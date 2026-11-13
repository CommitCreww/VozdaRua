import { SESSION_ABSOLUTE_MS, SESSION_IDLE_MS, isSessionValid, type SessionStore, type StoredSession } from '../security/sessions.js';
import type { SqlExecutor, TransactionalSqlExecutor } from './database.js';
import { createAuthSecurityRepository } from './auth-security.js';

interface SessionRow {
  id_hash: string;
  usuario_id: string;
  csrf_token_hash: string;
  criado_em: Date;
  ultima_atividade_em: Date;
  revogado_em: Date | null;
}
const columns = 'id_hash, usuario_id, csrf_token_hash, criado_em, ultima_atividade_em, revogado_em';
const dto = (row: SessionRow): StoredSession => ({ idHash: row.id_hash, accountId: row.usuario_id,
  csrfTokenHash: row.csrf_token_hash, createdAt: row.criado_em, lastActivityAt: row.ultima_atividade_em, revokedAt: row.revogado_em });

async function insert(sql: SqlExecutor, session: StoredSession) {
  await sql.query(`INSERT INTO sessoes (${columns}) VALUES ($1,$2,$3,$4,$5,$6)`,
    [session.idHash, session.accountId, session.csrfTokenHash, session.createdAt, session.lastActivityAt, session.revokedAt]);
}

export function createSessionStore(database: TransactionalSqlExecutor, options: { securityEvents: boolean } = { securityEvents: false }): SessionStore {
  return {
    async findByIdHash(idHash) {
      const [row] = await database.query<SessionRow>(`SELECT ${columns} FROM sessoes WHERE id_hash=$1`, [idHash]);
      return row ? dto(row) : null;
    },
    async save(session, expectedPasswordHash, requestId) {
      if (!isSessionValid(session, session.lastActivityAt)) return false;
      return database.transaction(async (sql) => {
        // Same first lock as reset: a login verified before reset cannot survive it.
        const [account] = await sql.query<{ senha_hash: string | null; email_verificado_em: Date | null }>(
          'SELECT senha_hash, email_verificado_em FROM usuarios WHERE id=$1 FOR UPDATE', [session.accountId]);
        if (!account?.email_verificado_em || account.senha_hash !== expectedPasswordHash) return false;
        await insert(sql, session);
        await sql.query('UPDATE usuarios SET ultimo_acesso_em=$2 WHERE id=$1', [session.accountId, session.createdAt]);
        if (options.securityEvents) await createAuthSecurityRepository(sql).record('LOGIN_SUCCEEDED', session.accountId, requestId);
        return true;
      });
    },
    async renewIfActive(idHash, now) {
      if (!Number.isFinite(now.getTime())) return null;
      const [row] = await database.query<SessionRow>(`UPDATE sessoes SET ultima_atividade_em=$2
        WHERE id_hash=$1 AND revogado_em IS NULL
          AND criado_em <= $2 AND ultima_atividade_em <= $2
          AND criado_em > $3 AND ultima_atividade_em > $4
        RETURNING ${columns}`, [idHash, now, new Date(now.getTime() - SESSION_ABSOLUTE_MS), new Date(now.getTime() - SESSION_IDLE_MS)]);
      return row ? dto(row) : null;
    },
    async revoke(idHash, at) {
      await database.query('UPDATE sessoes SET revogado_em=$2 WHERE id_hash=$1 AND revogado_em IS NULL', [idHash, at]);
    },
    async revokeOtherSessions(accountId, exceptIdHash, at) {
      await database.query('UPDATE sessoes SET revogado_em=$3 WHERE usuario_id=$1 AND id_hash<>$2 AND revogado_em IS NULL', [accountId, exceptIdHash, at]);
    },
    async revokeAllForAccount(accountId, at) {
      await database.query('UPDATE sessoes SET revogado_em=$2 WHERE usuario_id=$1 AND revogado_em IS NULL', [accountId, at]);
    },
    async replaceId(oldIdHash, session) {
      if (oldIdHash === session.idHash || !isSessionValid(session, session.lastActivityAt)) throw new Error('Invalid session replacement');
      await database.transaction(async (sql) => {
        await sql.query('SELECT id FROM usuarios WHERE id=$1 FOR UPDATE', [session.accountId]);
        const [old] = await sql.query<SessionRow>(`SELECT ${columns} FROM sessoes WHERE id_hash=$1 AND usuario_id=$2 FOR UPDATE`, [oldIdHash, session.accountId]);
        if (!old || old.usuario_id !== session.accountId || !isSessionValid(dto(old), session.lastActivityAt) || old.criado_em.getTime() !== session.createdAt.getTime()) {
          throw new Error('Invalid session replacement');
        }
        await sql.query('UPDATE sessoes SET revogado_em=$2 WHERE id_hash=$1', [oldIdHash, session.lastActivityAt]);
        await insert(sql, session);
      });
    }
  };
}

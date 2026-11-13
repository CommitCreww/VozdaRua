import type { AuthRepository, LocalAccount } from '../services/auth.js';
import type { TransactionalSqlExecutor } from './database.js';
import type { AuthTokenEffect } from './auth-mail.js';

interface AccountRow {
  id: string;
  email: string;
  senha_hash: string | null;
  email_verificado_em: Date | null;
  papel: LocalAccount['role'];
  status: LocalAccount['status'];
}
const columns = 'id, email, senha_hash, email_verificado_em, papel, status';
const dto = (row: AccountRow): LocalAccount => ({ id: row.id, email: row.email, passwordHash: row.senha_hash,
  emailVerifiedAt: row.email_verificado_em, role: row.papel, status: row.status });

export function createAuthRepository(database: TransactionalSqlExecutor, mail?: AuthTokenEffect): AuthRepository {
  return {
    async findByEmail(email) {
      const [row] = await database.query<AccountRow>(`SELECT ${columns} FROM usuarios WHERE LOWER(email)=LOWER($1)`, [email]);
      return row ? dto(row) : null;
    },
    async findById(id) {
      const [row] = await database.query<AccountRow>(`SELECT ${columns} FROM usuarios WHERE id=$1`, [id]);
      return row ? dto(row) : null;
    },
    async register(input) {
      return database.transaction(async (sql) => {
        const [account] = await sql.query<{ id: string }>(`INSERT INTO usuarios (nome,email,senha_hash,papel,status,perfil_publico,exibir_nome_nos_relatos)
          VALUES ($1,$2,$3,'CIDADAO','ATIVO',FALSE,FALSE)
          ON CONFLICT (LOWER(email)) DO NOTHING RETURNING id`, [input.name, input.email, input.passwordHash]);
        if (!account) return false;
        await sql.query(`INSERT INTO aceites_legais (usuario_id,termos_versao,termos_aceitos_em,privacidade_versao,privacidade_ciente_em)
          VALUES ($1,$2,CURRENT_TIMESTAMP,$3,CURRENT_TIMESTAMP)`, [account.id, input.termsVersion, input.privacyVersion]);
        await sql.query(`INSERT INTO tokens_conta (usuario_id,tipo,token_hash,expira_em)
          VALUES ($1,'EMAIL_VERIFICATION',$2,$3)`, [account.id, input.tokenHash, input.expiresAt]);
        await mail?.issued(sql, account.id, 'EMAIL_VERIFICATION', input.tokenHash, input.expiresAt);
        return true;
      });
    },
    async enqueueVerification(email, tokenHash, expiresAt) {
      return database.transaction(async (sql) => {
        const [account] = await sql.query<{ id: string }>(`SELECT id FROM usuarios
          WHERE LOWER(email)=LOWER($1) AND email_verificado_em IS NULL AND senha_hash IS NOT NULL FOR UPDATE`, [email]);
        if (!account) return false;
        await sql.query(`INSERT INTO tokens_conta (usuario_id,tipo,token_hash,expira_em)
          VALUES ($1,'EMAIL_VERIFICATION',$2,$3)`, [account.id, tokenHash, expiresAt]);
        await mail?.issued(sql, account.id, 'EMAIL_VERIFICATION', tokenHash, expiresAt);
        return true;
      });
    },
    async confirmEmail(tokenHash, now) {
      return database.transaction(async (sql) => {
        const [candidate] = await sql.query<{ usuario_id: string }>(
          "SELECT usuario_id FROM tokens_conta WHERE token_hash=$1 AND tipo='EMAIL_VERIFICATION'", [tokenHash]);
        if (!candidate) return false;
        const [account] = await sql.query<{ id: string }>(`SELECT id FROM usuarios WHERE id=$1
          AND email_verificado_em IS NULL AND senha_hash IS NOT NULL FOR UPDATE`, [candidate.usuario_id]);
        if (!account) return false;
        const [consumed] = await sql.query<{ id: string }>(`UPDATE tokens_conta SET consumido_em=$3
          WHERE token_hash=$1 AND usuario_id=$2 AND tipo='EMAIL_VERIFICATION'
            AND consumido_em IS NULL AND criado_em <= $3 AND expira_em > $3 RETURNING id`, [tokenHash, account.id, now]);
        if (!consumed) return false;
        await sql.query('UPDATE usuarios SET email_verificado_em=$2 WHERE id=$1', [account.id, now]);
        await sql.query(`UPDATE tokens_conta SET consumido_em=GREATEST(criado_em,$2)
          WHERE usuario_id=$1 AND tipo='EMAIL_VERIFICATION' AND consumido_em IS NULL`, [account.id, now]);
        return true;
      });
    }
  };
}

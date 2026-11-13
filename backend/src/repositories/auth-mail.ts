import { randomUUID } from 'node:crypto';
import type { AccountTokenKind } from '../security/tokens.js';
import type { SqlExecutor, TransactionalSqlExecutor } from './database.js';

export interface MailIntent {
  id: string;
  usuario_id: string;
  tipo: AccountTokenKind;
  expira_em: Date;
  tentativas: number;
  claim_id: string;
}
export interface AuthTokenEffect {
  issued(sql: SqlExecutor, accountId: string, kind: AccountTokenKind, requestHash: string, expiresAt: Date): Promise<void>;
}

export interface AuthMailSnapshot { pending: number; processing: number; failed: number; oldestPendingMs: number }

export async function purgeAuthMailRecords(database: SqlExecutor, retentionMs: number) {
  if (!Number.isSafeInteger(retentionMs) || retentionMs <= 0) throw new Error('Mail retention must be configured');
  await database.query(`DELETE FROM envios_email_auth WHERE estado IN ('SENT','FAILED')
    AND atualizado_em < clock_timestamp()-$1*INTERVAL '1 millisecond'`, [retentionMs]);
}

export function createAuthMailRepository(database: TransactionalSqlExecutor) {
  const effect: AuthTokenEffect = {
    async issued(sql, accountId, kind, hash, expiresAt) {
      await sql.query(`INSERT INTO envios_email_auth(usuario_id,tipo,solicitacao_hash,expira_em)
        VALUES($1,$2,$3,$4) ON CONFLICT(solicitacao_hash) DO NOTHING`, [accountId, kind, hash, expiresAt]);
    }
  };
  return {
    effect,
    async hasIntent(hash: string) {
      return (await database.query('SELECT id FROM envios_email_auth WHERE solicitacao_hash=$1', [hash])).length === 1;
    },
    async claim(leaseMs: number): Promise<MailIntent | null> {
      if (!Number.isSafeInteger(leaseMs) || leaseMs <= 0) throw new Error('Invalid mail lease');
      return database.transaction(async (sql) => {
        const ended = await sql.query<{ id: string }>(`UPDATE envios_email_auth SET estado='FAILED',resultado=CASE WHEN expira_em<=clock_timestamp() THEN 'EXPIRED' ELSE 'EXHAUSTED' END,
          claim_id=NULL,lease_ate=NULL,atualizado_em=clock_timestamp()
          WHERE estado IN ('PENDING','PROCESSING') AND (lease_ate IS NULL OR lease_ate<=clock_timestamp())
            AND (expira_em<=clock_timestamp() OR tentativas>=3) RETURNING id`);
        for (const job of ended) await sql.query(`UPDATE tentativas_email_auth SET concluido_em=clock_timestamp(),resultado='LEASE_EXPIRED'
          WHERE envio_id=$1 AND resultado IS NULL`, [job.id]);
        const [job] = await sql.query<MailIntent>(`SELECT id,usuario_id,tipo,expira_em,tentativas,claim_id FROM envios_email_auth
          WHERE estado IN ('PENDING','PROCESSING') AND tentativas<3 AND expira_em>clock_timestamp()
            AND proxima_em<=clock_timestamp() AND (lease_ate IS NULL OR lease_ate<=clock_timestamp())
          ORDER BY proxima_em,id FOR UPDATE SKIP LOCKED LIMIT 1`);
        if (!job) return null;
        await sql.query(`UPDATE tentativas_email_auth SET concluido_em=clock_timestamp(),resultado='LEASE_EXPIRED'
          WHERE envio_id=$1 AND resultado IS NULL`, [job.id]);
        const claim = randomUUID();
        const [updated] = await sql.query<MailIntent>(`UPDATE envios_email_auth SET estado='PROCESSING',tentativas=tentativas+1,
          claim_id=$2,lease_ate=clock_timestamp()+$3*INTERVAL '1 millisecond',atualizado_em=clock_timestamp()
          WHERE id=$1 RETURNING id,usuario_id,tipo,expira_em,tentativas,claim_id`, [job.id, claim, leaseMs]);
        await sql.query('INSERT INTO tentativas_email_auth(envio_id,tentativa,claim_id) VALUES($1,$2,$3)', [job.id, updated!.tentativas, claim]);
        return updated!;
      });
    },
    async issueDeliveryToken(job: MailIntent, hash: string): Promise<string | null> {
      return database.transaction(async (sql) => {
        // Same account-first lock order as confirmation/reset/session creation.
        const [account] = await sql.query<{ email: string; senha_hash: string | null; email_verificado_em: Date | null }>(
          'SELECT email,senha_hash,email_verificado_em FROM usuarios WHERE id=$1 FOR UPDATE', [job.usuario_id]);
        if (!account?.senha_hash || (job.tipo === 'EMAIL_VERIFICATION' && account.email_verificado_em)) return null;
        const [active] = await sql.query(`SELECT e.id FROM envios_email_auth e JOIN tokens_conta t ON t.token_hash=e.solicitacao_hash
          WHERE e.id=$1 AND e.claim_id=$2 AND e.estado='PROCESSING' AND t.consumido_em IS NULL
          AND e.lease_ate>clock_timestamp() AND e.expira_em>clock_timestamp() FOR UPDATE OF e`, [job.id, job.claim_id]);
        if (!active) return null;
        await sql.query(`INSERT INTO tokens_conta(usuario_id,tipo,token_hash,expira_em)
          VALUES($1,$2,$3,$4)`, [job.usuario_id, job.tipo, hash, job.expira_em]);
        return account.email;
      });
    },
    async finish(job: MailIntent, result: 'DELIVERED' | 'TEMPORARY' | 'PERMANENT' | 'INELIGIBLE', delayMs: number) {
      const terminal = result !== 'TEMPORARY' || job.tentativas >= 3;
      const state = result === 'DELIVERED' ? 'SENT' : terminal ? 'FAILED' : 'PENDING';
      return database.transaction(async (sql) => {
        const rows = await sql.query(`UPDATE envios_email_auth SET estado=$3,resultado=$4,claim_id=NULL,lease_ate=NULL,
          proxima_em=clock_timestamp()+$5*INTERVAL '1 millisecond',atualizado_em=clock_timestamp()
          WHERE id=$1 AND claim_id=$2 AND estado='PROCESSING' AND lease_ate>clock_timestamp() RETURNING id`,
        [job.id, job.claim_id, state, result, delayMs]);
        if (!rows.length) return false;
        await sql.query('UPDATE tentativas_email_auth SET concluido_em=clock_timestamp(),resultado=$2 WHERE claim_id=$1', [job.claim_id, result]);
        return true;
      });
    },
    async metrics() {
      return database.query<{ estado: string; quantidade: number }>(
        'SELECT estado,count(*)::integer AS quantidade FROM envios_email_auth GROUP BY estado');
    },
    async operationalSnapshot(): Promise<AuthMailSnapshot> {
      const [row] = await database.query<AuthMailSnapshot>(`SELECT
        count(*) FILTER (WHERE estado='PENDING')::integer AS pending,
        count(*) FILTER (WHERE estado='PROCESSING')::integer AS processing,
        count(*) FILTER (WHERE estado='FAILED')::integer AS failed,
        COALESCE(GREATEST(0,EXTRACT(EPOCH FROM(clock_timestamp()-min(criado_em)
          FILTER (WHERE estado IN ('PENDING','PROCESSING'))))*1000),0)::double precision AS "oldestPendingMs"
        FROM envios_email_auth`);
      return row!;
    },
    async purge(retentionMs: number) {
      await purgeAuthMailRecords(database, retentionMs);
    }
  };
}

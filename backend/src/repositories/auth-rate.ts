import type { SqlExecutor, TransactionalSqlExecutor } from './database.js';
import type { AuthRateGate } from '../services/auth.js';

export type AuthAction = Parameters<AuthRateGate['check']>[0];
export type RateScope = 'origin' | 'identity' | 'session' | 'failure';
export interface RateBucket { action: AuthAction; scope: RateScope; key: string; windowMs: number; limit: number }
interface RateRow { quantidade: number; expira_em: Date; bloqueado_ate: Date | null }

function validate(bucket: RateBucket) {
  if (!/^[a-f0-9]{64}$/.test(bucket.key) || !Number.isSafeInteger(bucket.windowMs) || bucket.windowMs <= 0 ||
      !Number.isSafeInteger(bucket.limit) || bucket.limit <= 0) throw new Error('Invalid rate policy');
}
async function lockBucket(sql: SqlExecutor, bucket: RateBucket, now: Date) {
  await sql.query(`INSERT INTO limites_auth(acao,escopo,chave_hash,expira_em) VALUES($1,$2,$3,$4)
    ON CONFLICT DO NOTHING`, [bucket.action, bucket.scope, bucket.key, new Date(now.getTime() + bucket.windowMs)]);
  const [row] = await sql.query<RateRow>(`SELECT quantidade,expira_em,bloqueado_ate FROM limites_auth
    WHERE acao=$1 AND escopo=$2 AND chave_hash=$3 FOR UPDATE`, [bucket.action, bucket.scope, bucket.key]);
  if (!row) throw new Error('Rate state unavailable');
  return row;
}

export function createAuthRateRepository(database: TransactionalSqlExecutor) {
  return {
    async consume(buckets: readonly RateBucket[], cooldown: RateBucket, quotaCooldownMs?: number): Promise<boolean> {
      if (quotaCooldownMs !== undefined && (!Number.isSafeInteger(quotaCooldownMs) || quotaCooldownMs <= 0 || quotaCooldownMs > cooldown.windowMs)) throw new Error('Invalid cooldown policy');
      const all = [...buckets, cooldown].sort((a, b) => `${a.action}:${a.scope}:${a.key}`.localeCompare(`${b.action}:${b.scope}:${b.key}`));
      all.forEach(validate);
      if (new Set(all.map((b) => `${b.action}:${b.scope}:${b.key}`)).size !== all.length) throw new Error('Duplicate rate bucket');
      return database.transaction(async (sql) => {
        const [initial] = await sql.query<{ now: Date }>('SELECT clock_timestamp() AS now');
        const rows = [];
        for (const bucket of all) rows.push({ bucket, row: await lockBucket(sql, bucket, initial!.now) });
        // Refresh after waiting for locks so expiration is decided at consumption time.
        const [clock] = await sql.query<{ now: Date }>('SELECT clock_timestamp() AS now');
        const now = clock!.now;
        for (const { bucket, row } of rows) {
          const active = row.expira_em > now;
          if (active && (row.bloqueado_ate && row.bloqueado_ate > now)) return false;
        }
        if (rows.some(({ bucket, row }) => bucket.scope !== 'failure' && row.expira_em > now && row.quantidade >= bucket.limit)) {
          if (quotaCooldownMs !== undefined) {
            // Pair-only and anchored to the first denial. Never extend an identity/origin window.
            const until = new Date(now.getTime() + quotaCooldownMs);
            await sql.query(`UPDATE limites_auth SET quantidade=1,expira_em=$4,bloqueado_ate=$4
              WHERE acao=$1 AND escopo=$2 AND chave_hash=$3`, [cooldown.action, cooldown.scope, cooldown.key, until]);
          }
          return false;
        }
        for (const { bucket, row } of rows) {
          if (bucket.scope === 'failure') continue;
          const active = row.expira_em > now;
          await sql.query(`UPDATE limites_auth SET quantidade=$4,expira_em=$5,bloqueado_ate=NULL
            WHERE acao=$1 AND escopo=$2 AND chave_hash=$3`, [bucket.action, bucket.scope, bucket.key,
            active ? row.quantidade + 1 : 1, active ? row.expira_em : new Date(now.getTime() + bucket.windowMs)]);
        }
        return true;
      });
    },
    async failure(bucket: RateBucket, delaysMs: readonly number[]) {
      validate(bucket);
      if (!delaysMs.length || delaysMs.some((n, i) => !Number.isSafeInteger(n) || n <= 0 || n > bucket.windowMs || (i > 0 && n < delaysMs[i - 1]!))) {
        throw new Error('Invalid cooldown policy');
      }
      await database.transaction(async (sql) => {
        const [clock] = await sql.query<{ now: Date }>('SELECT clock_timestamp() AS now');
        const row = await lockBucket(sql, bucket, clock!.now);
        const [current] = await sql.query<{ now: Date }>('SELECT clock_timestamp() AS now');
        const now = current!.now;
        // Concurrent failures admitted before the first one must not keep renewing a lockout.
        if (row.expira_em > now && row.bloqueado_ate && row.bloqueado_ate > now) return;
        const count = row.expira_em > now ? Math.min(row.quantidade + 1, delaysMs.length) : 1;
        const expiry = row.expira_em > now ? row.expira_em : new Date(now.getTime() + bucket.windowMs);
        const blocked = new Date(Math.min(expiry.getTime(), now.getTime() + delaysMs[count - 1]!));
        await sql.query(`UPDATE limites_auth SET quantidade=$4,expira_em=$5,bloqueado_ate=$6
          WHERE acao=$1 AND escopo=$2 AND chave_hash=$3`, [bucket.action, bucket.scope, bucket.key, count, expiry, blocked]);
      });
    },
    async purgeExpired() { await database.query('DELETE FROM limites_auth WHERE expira_em <= clock_timestamp()'); }
  };
}

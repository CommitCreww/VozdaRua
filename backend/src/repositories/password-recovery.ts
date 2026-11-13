import type { PasswordRecoveryRepository } from '../services/password-recovery.js';
import type { TransactionalSqlExecutor } from './database.js';

export function createPasswordRecoveryRepository(database: TransactionalSqlExecutor): PasswordRecoveryRepository {
  return {
    async requestReset(accountId, tokenHash, expiresAt, now) {
      return database.transaction(async (sql) => {
        const [account] = await sql.query<{ id: string }>('SELECT id FROM usuarios WHERE id=$1 AND senha_hash IS NOT NULL FOR UPDATE', [accountId]);
        if (!account) return false;
        await sql.query(`INSERT INTO tokens_conta (usuario_id,tipo,token_hash,expira_em,criado_em)
          VALUES ($1,'PASSWORD_RESET',$2,$3,$4)`, [accountId, tokenHash, expiresAt, now]);
        return true;
      });
    },
    async completeReset(tokenHash, passwordHash, now) {
      return database.transaction(async (sql) => {
        // Discover owner without locking token first; every account-wide auth mutation
        // must take the account lock first, then recheck token under READ COMMITTED.
        const [candidate] = await sql.query<{ usuario_id: string }>(
          "SELECT usuario_id FROM tokens_conta WHERE token_hash=$1 AND tipo='PASSWORD_RESET'", [tokenHash]);
        if (!candidate) return false;
        const [account] = await sql.query<{ id: string }>(
          'SELECT id FROM usuarios WHERE id=$1 AND senha_hash IS NOT NULL FOR UPDATE', [candidate.usuario_id]);
        if (!account) return false;
        const [consumed] = await sql.query<{ id: string }>(`UPDATE tokens_conta SET consumido_em=$3
          WHERE token_hash=$1 AND usuario_id=$2 AND tipo='PASSWORD_RESET'
            AND consumido_em IS NULL AND criado_em <= $3 AND expira_em > $3 RETURNING id`, [tokenHash, account.id, now]);
        if (!consumed) return false;
        await sql.query('UPDATE usuarios SET senha_hash=$2 WHERE id=$1', [account.id, passwordHash]);
        await sql.query(`UPDATE tokens_conta SET consumido_em=GREATEST(criado_em,$2)
          WHERE usuario_id=$1 AND tipo='PASSWORD_RESET' AND consumido_em IS NULL`, [account.id, now]);
        await sql.query(`UPDATE sessoes SET revogado_em=GREATEST(criado_em,$2)
          WHERE usuario_id=$1 AND revogado_em IS NULL`, [account.id, now]);
        return true;
      });
    }
  };
}

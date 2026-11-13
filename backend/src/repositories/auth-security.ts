import type { SqlExecutor } from './database.js';

export type AuthSecurityEvent = 'LOGIN_SUCCEEDED' | 'LOGIN_FAILED' | 'ACCESS_DENIED';
export interface AuthSecurityRecorder {
  record(event: AuthSecurityEvent, accountId?: string, requestId?: string): Promise<void>;
}
const outcomes = { LOGIN_SUCCEEDED: 'SUCCESS', LOGIN_FAILED: 'FAILURE', ACCESS_DENIED: 'DENIED' } as const;
export function createAuthSecurityRepository(sql: SqlExecutor): AuthSecurityRecorder & { purge(): Promise<void> } {
  return {
    async record(event, accountId, requestId) {
      await sql.query(`INSERT INTO eventos_seguranca_auth(usuario_id,evento,resultado,request_id)
        VALUES($1,$2,$3,$4)`, [accountId ?? null, event, outcomes[event], requestId ?? null]);
    },
    async purge() {
      await sql.query("DELETE FROM eventos_seguranca_auth WHERE criado_em < clock_timestamp() - INTERVAL '30 days'");
    }
  };
}

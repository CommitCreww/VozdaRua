import { describe, expect, it, vi } from 'vitest';
import { createSessionStore } from '../src/repositories/sessions.js';
import { createAuthRepository } from '../src/repositories/auth.js';
import { createPasswordRecoveryRepository } from '../src/repositories/password-recovery.js';
import type { SqlExecutor, TransactionalSqlExecutor } from '../src/repositories/database.js';
import { SESSION_ABSOLUTE_MS, SESSION_IDLE_MS, type StoredSession } from '../src/security/sessions.js';

const now = new Date('2026-01-01T00:00:00Z');
const base: StoredSession = { idHash: 'a'.repeat(64), accountId: 'synthetic-account', csrfTokenHash: 'b'.repeat(64), createdAt: now, lastActivityAt: now, revokedAt: null };
const row = { id_hash: base.idHash, usuario_id: base.accountId, csrf_token_hash: base.csrfTokenHash, criado_em: now, ultima_atividade_em: now, revogado_em: null };
function database(...responses: unknown[][]) {
  const calls: { sql: string; values?: readonly unknown[] }[] = [];
  const db: TransactionalSqlExecutor = {
    async query<Row>(sql: string, values?: readonly unknown[]) { calls.push({ sql, values }); return (responses.shift() ?? []) as Row[]; },
    async transaction<T>(work: (sql: SqlExecutor) => Promise<T>) { return work(db); }
  };
  return { db, calls };
}

describe('contratos SQL de sessoes (executor simulado, sem prova PostgreSQL)', () => {
  it('mapeia DTO explicito e vincula identificador como parametro', async () => {
    const x = database([{ ...row, internal: 'not exposed' }]);
    expect(await createSessionStore(x.db).findByIdHash(base.idHash)).toEqual(base);
    expect(x.calls[0]!.values).toEqual([base.idHash]); expect(x.calls[0]!.sql).not.toContain(base.idHash);
  });
  it('renovacao condicional exige validade e nao altera prazo absoluto nem revogacao', async () => {
    const at = new Date(now.getTime() + 1000); const x = database([{ ...row, ultima_atividade_em: at }]);
    const result = await createSessionStore(x.db).renewIfActive(base.idHash, at);
    expect(result?.createdAt).toEqual(now); expect(result?.lastActivityAt).toEqual(at);
    expect(x.calls[0]!.values).toEqual([base.idHash, at, new Date(at.getTime() - SESSION_ABSOLUTE_MS), new Date(at.getTime() - SESSION_IDLE_MS)]);
    expect(x.calls[0]!.sql).toMatch(/revogado_em IS NULL/); expect(x.calls[0]!.sql).toMatch(/criado_em > \$3 AND ultima_atividade_em > \$4/);
    expect(await createSessionStore(x.db).renewIfActive(base.idHash, at)).toBeNull();
    expect(await createSessionStore(x.db).renewIfActive(base.idHash, new Date(NaN))).toBeNull();
    expect(x.calls).toHaveLength(2);
  });
  it('login verifica senha atual sob lock antes de inserir sessao', async () => {
    const changed = database([{ senha_hash: 'new-hash', email_verificado_em: now }]);
    expect(await createSessionStore(changed.db).save(base, 'old-hash')).toBe(false);
    expect(changed.calls).toHaveLength(1); expect(changed.calls[0]!.sql).toMatch(/FOR UPDATE/);
    const unverified = database([{ senha_hash: 'old-hash', email_verificado_em: null }]);
    expect(await createSessionStore(unverified.db).save(base, 'old-hash')).toBe(false);
    const valid = database([{ senha_hash: 'old-hash', email_verificado_em: now }]);
    expect(await createSessionStore(valid.db).save(base, 'old-hash')).toBe(true);
    expect(valid.calls[1]!.values).toEqual([base.idHash, base.accountId, base.csrfTokenHash, now, now, null]);
  });
  it('rotacao impede troca de owner e reinicio do limite absoluto', async () => {
    const x = database([{ id: base.accountId }], [{ ...row, usuario_id: 'other' }]);
    await expect(createSessionStore(x.db).replaceId('old', base)).rejects.toThrow('Invalid session replacement');
    const missing = database([{ id: base.accountId }], []);
    await expect(createSessionStore(missing.db).replaceId('old', base)).rejects.toThrow('Invalid session replacement');
    expect(missing.calls[1]!.values).toEqual(['old', base.accountId]);
    const restarted = database([{ id: base.accountId }], [row]);
    await expect(createSessionStore(restarted.db).replaceId('old', { ...base, createdAt: new Date(now.getTime() - 1) })).rejects.toThrow('Invalid session replacement');
    expect(restarted.calls).toHaveLength(2);
    const valid = database([{ id: base.accountId }], [row]);
    await createSessionStore(valid.db).replaceId('old', base);
    expect(valid.calls[2]!.sql).toMatch(/UPDATE sessoes SET revogado_em/); expect(valid.calls[3]!.sql).toMatch(/INSERT INTO sessoes/);
    expect(x.calls).toHaveLength(2);
  });
  it('revogacao de outras sessoes permanece restrita ao owner e exclui sessao atual', async () => {
    const x = database(); const store = createSessionStore(x.db);
    await store.revokeOtherSessions(base.accountId, base.idHash, now);
    expect(x.calls[0]!.values).toEqual([base.accountId, base.idHash, now]);
    expect(x.calls[0]!.sql).toMatch(/usuario_id=\$1 AND id_hash<>\$2 AND revogado_em IS NULL/);
    await store.revokeAllForAccount(base.accountId, now); await store.revoke(base.idHash, now);
    expect(x.calls[1]!.values).toEqual([base.accountId, now]); expect(x.calls[2]!.values).toEqual([base.idHash, now]);
  });
});

describe('contratos SQL de recuperacao (executor simulado)', () => {
  it('conta externa nao recebe token e conta local usa parametros sem senha clara', async () => {
    const missing = database();
    expect(await createPasswordRecoveryRepository(missing.db).requestReset(base.accountId, 'hash', new Date(now.getTime() + 1000), now)).toBe(false);
    expect(missing.calls).toHaveLength(1);
    const local = database([{ id: base.accountId }]);
    expect(await createPasswordRecoveryRepository(local.db).requestReset(base.accountId, 'hash', new Date(now.getTime() + 1000), now)).toBe(true);
    expect(local.calls[0]!.sql).toMatch(/senha_hash IS NOT NULL FOR UPDATE/);
    expect(local.calls[1]!.values).toEqual([base.accountId, 'hash', new Date(now.getTime() + 1000), now]);
  });
  it('token ausente/expirado/consumido nao altera senha nem sessoes', async () => {
    const missing = database();
    expect(await createPasswordRecoveryRepository(missing.db).completeReset('hash', 'new-hash', now)).toBe(false);
    expect(missing.calls).toHaveLength(1);
    const invalid = database([{ usuario_id: base.accountId }], [{ id: base.accountId }], []);
    expect(await createPasswordRecoveryRepository(invalid.db).completeReset('hash', 'new-hash', now)).toBe(false);
    expect(invalid.calls).toHaveLength(3);
    expect(invalid.calls[2]!.sql).toMatch(/consumido_em IS NULL AND criado_em <= \$3 AND expira_em > \$3/);
  });
  it('lock de usuario precede consumo; senha, tokens e sessoes usam a mesma transacao', async () => {
    const x = database([{ usuario_id: base.accountId }], [{ id: base.accountId }], [{ id: 'token-id' }]);
    const transaction = vi.spyOn(x.db, 'transaction');
    expect(await createPasswordRecoveryRepository(x.db).completeReset('hash', 'new-hash', now)).toBe(true);
    expect(transaction).toHaveBeenCalledTimes(1); expect(x.calls).toHaveLength(6);
    expect(x.calls[1]!.sql).toMatch(/FOR UPDATE/); expect(x.calls[2]!.sql).toMatch(/tipo='PASSWORD_RESET'/);
    expect(x.calls[3]!.values).toEqual([base.accountId, 'new-hash']);
    expect(x.calls[3]!.sql).not.toMatch(/email_verificado|papel|status/);
    expect(x.calls[4]!.sql).toMatch(/tipo='PASSWORD_RESET'/); expect(x.calls[5]!.sql).toMatch(/usuario_id=\$1 AND revogado_em IS NULL/);
  });
});

describe('contratos SQL de conta e aceites (executor simulado)', () => {
  const input = { name: 'Pessoa sintética', email: 'pessoa@example.test', passwordHash: 'adaptive-hash', termsVersion: 'test-only-terms', privacyVersion: 'test-only-privacy', tokenHash: 'c'.repeat(64), expiresAt: new Date(now.getTime() + 1000) };
  it('cadastro atomico grava manifestacoes independentes e usuario privado', async () => {
    const x = database([{ id: base.accountId }]); const transaction = vi.spyOn(x.db, 'transaction');
    expect(await createAuthRepository(x.db).register(input)).toBe(true);
    expect(transaction).toHaveBeenCalledTimes(1); expect(x.calls).toHaveLength(3);
    expect(x.calls[0]!.values).toEqual([input.name, input.email, input.passwordHash]);
    expect(x.calls[0]!.sql).toMatch(/'CIDADAO','ATIVO',FALSE,FALSE/);
    expect(x.calls[0]!.sql).toMatch(/ON CONFLICT \(LOWER\(email\)\) DO NOTHING/);
    expect(x.calls[1]!.values).toEqual([base.accountId, input.termsVersion, input.privacyVersion]);
    expect(x.calls[2]!.values).toEqual([base.accountId, input.tokenHash, input.expiresAt]);
  });
  it('duplicidade nao grava aceite ou token e nao retorna detalhes da conta', async () => {
    const x = database(); expect(await createAuthRepository(x.db).register(input)).toBe(false);
    expect(x.calls).toHaveLength(1);
  });
  it('retorna somente contrato interno explicito, com senha nula para externa', async () => {
    const x = database([{ id: base.accountId, email: input.email, senha_hash: null, email_verificado_em: now, papel: 'CIDADAO', status: 'ATIVO', ignored: 'private' }]);
    expect(await createAuthRepository(x.db).findByEmail(input.email)).toEqual({ id: base.accountId, email: input.email, passwordHash: null, emailVerifiedAt: now, role: 'CIDADAO', status: 'ATIVO' });
    expect(x.calls[0]!.values).toEqual([input.email]);
    expect(await createAuthRepository(x.db).findById('missing')).toBeNull();
  });
  it('reenvio revalida confirmacao e tipo de conta sob lock', async () => {
    const missing = database(); expect(await createAuthRepository(missing.db).enqueueVerification(input.email, input.tokenHash, input.expiresAt)).toBe(false);
    expect(missing.calls).toHaveLength(1); expect(missing.calls[0]!.sql).toMatch(/email_verificado_em IS NULL AND senha_hash IS NOT NULL FOR UPDATE/);
    const valid = database([{ id: base.accountId }]);
    expect(await createAuthRepository(valid.db).enqueueVerification(input.email, input.tokenHash, input.expiresAt)).toBe(true);
    expect(valid.calls[1]!.values).toEqual([base.accountId, input.tokenHash, input.expiresAt]);
  });
  it('confirmacao exige tipo/validade e confirma uma vez sob lock de usuario', async () => {
    const missing = database(); expect(await createAuthRepository(missing.db).confirmEmail(input.tokenHash, now)).toBe(false);
    const invalid = database([{ usuario_id: base.accountId }], [{ id: base.accountId }], []);
    expect(await createAuthRepository(invalid.db).confirmEmail(input.tokenHash, now)).toBe(false); expect(invalid.calls).toHaveLength(3);
    const valid = database([{ usuario_id: base.accountId }], [{ id: base.accountId }], [{ id: 'token' }]);
    expect(await createAuthRepository(valid.db).confirmEmail(input.tokenHash, now)).toBe(true);
    expect(valid.calls[1]!.sql).toMatch(/FOR UPDATE/); expect(valid.calls[2]!.sql).toMatch(/tipo='EMAIL_VERIFICATION'/);
    expect(valid.calls[3]!.values).toEqual([base.accountId, now]); expect(valid.calls).toHaveLength(5);
    expect(valid.calls.some((call) => /INSERT INTO sessoes/.test(call.sql))).toBe(false);
  });
});

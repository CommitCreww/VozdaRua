import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildApp } from '../src/app.js';
import { readConfig } from '../src/config/index.js';
import { registerAuthRoutes } from '../src/routes/auth.js';
import { registerPasswordRecoveryRoutes } from '../src/routes/password-recovery.js';
import type { AuthDependencies, LocalAccount } from '../src/services/auth.js';
import type { PasswordRecoveryDependencies } from '../src/services/password-recovery.js';
import { hashPassword, verifyPassword } from '../src/security/password.js';
import { hashAccountToken, type AccountTokenKind } from '../src/security/tokens.js';
import { isSessionValid, type StoredSession } from '../src/security/sessions.js';

const apps: ReturnType<typeof buildApp>[] = [];
afterEach(async () => { await Promise.all(apps.splice(0).map((app) => app.close())); });
const oldPassword = 'frase antiga de teste sintetico';
const newPassword = 'frase nova de teste sintetico';
const origin = 'https://example.test';

async function setup() {
  let now = new Date('2026-01-01T00:00:00Z');
  const account: LocalAccount = { id: 'synthetic-account', email: 'pessoa@example.test', passwordHash: await hashPassword(oldPassword),
    emailVerifiedAt: now, role: 'CIDADAO', status: 'ATIVO' };
  const sessions = new Map<string, StoredSession>();
  const tokens = new Map<string, { expiresAt: Date; consumed: boolean; kind: AccountTokenKind }>();
  const delivered: string[] = [];
  const rate = { check: vi.fn(async () => true), recordFailure: vi.fn(async () => {}) };
  const accounts: AuthDependencies['accounts'] = {
    async findByEmail(email) { return email === account.email ? { ...account } : null; },
    async findById(id) { return id === account.id ? { ...account } : null; },
    async register() { return false; }, async confirmEmail() { return false; }, async enqueueVerification() { return false; }
  };
  const sessionStore: AuthDependencies['sessions'] = {
    async findByIdHash(id) { return sessions.get(id) ?? null; },
    async save(session, expected) { if (expected !== account.passwordHash) return false; sessions.set(session.idHash, session); return true; },
    async renewIfActive(id, at) {
      const stored = sessions.get(id);
      if (!stored || !isSessionValid(stored, at)) return null;
      const renewed = { ...stored, lastActivityAt: at }; sessions.set(id, renewed); return renewed;
    },
    async revoke(id, at) { const stored = sessions.get(id); if (stored) stored.revokedAt = at; },
    async revokeAllForAccount() {}, async revokeOtherSessions() {}, async replaceId() {}
  };
  const deps: PasswordRecoveryDependencies = {
    accounts, rate, now: () => now,
    delivery: { queue: vi.fn(async (_email, token) => { delivered.push(token); }) },
    repository: {
      requestReset: vi.fn(async (_id, hash, expiresAt) => { tokens.set(hash, { expiresAt, consumed: false, kind: 'PASSWORD_RESET' }); return true; }),
      completeReset: vi.fn(async (hash, passwordHash, at) => {
        const token = tokens.get(hash);
        if (!token || token.consumed || token.kind !== 'PASSWORD_RESET' || at >= token.expiresAt || !account.passwordHash) return false;
        token.consumed = true; account.passwordHash = passwordHash;
        for (const item of tokens.values()) if (item.kind === 'PASSWORD_RESET') item.consumed = true;
        for (const stored of sessions.values()) if (stored.accountId === account.id) stored.revokedAt = at;
        return true;
      })
    }
  };
  const app = buildApp(readConfig({ APP_ENV: 'test' })); apps.push(app);
  const auth = registerAuthRoutes(app, { accounts, sessions: sessionStore, rate, verification: { async queue() {} },
    legal: { termsVersion: 'test-only', privacyVersion: 'test-only' }, now: deps.now }, { production: true, origin });
  registerPasswordRecoveryRoutes(app, deps);
  const forgot = (email = account.email) => app.inject({ method: 'POST', url: '/api/v1/auth/password/forgot', payload: { email } });
  const reset = (token = delivered.at(-1), password = newPassword, passwordConfirmation = password) => app.inject({ method: 'POST', url: '/api/v1/auth/password/reset', payload: { token, password, passwordConfirmation } });
  const login = (password = oldPassword) => app.inject({ method: 'POST', url: '/api/v1/auth/login', payload: { email: account.email, password } });
  return { app, auth, account, sessions, sessionStore, tokens, delivered, deps, rate, forgot, reset, login, setNow: (at: Date) => { now = at; } };
}

describe('recuperacao HTTP integrada ao login, com persistencia e entrega simuladas', () => {
  it('resposta neutra para conta local, inexistente ou exclusivamente externa', async () => {
    const x = await setup();
    const existing = await x.forgot(' PESSOA@EXAMPLE.TEST ');
    const missing = await x.forgot('missing@example.test');
    x.account.passwordHash = null;
    const external = await x.forgot();
    expect(existing.statusCode).toBe(202); expect(missing.statusCode).toBe(202); expect(external.statusCode).toBe(202);
    expect(existing.body).toBe(missing.body); expect(existing.body).toBe(external.body);
    expect(existing.headers['set-cookie']).toBeUndefined();
    expect(x.delivered).toHaveLength(1);
    expect(x.deps.repository.requestReset).toHaveBeenCalledWith(x.account.id, hashAccountToken(x.delivered[0]!), new Date('2026-01-01T00:30:00Z'), new Date('2026-01-01T00:00:00Z'));
    expect(existing.body).not.toMatch(/token|email|password/i);
  });

  it('fecha DTOs, rejeita senha invalida ou divergente sem consumir token', async () => {
    const x = await setup(); await x.forgot();
    for (const payload of [{}, { email: 'invalid' }, { email: x.account.email, role: 'ADMIN' }]) {
      expect((await x.app.inject({ method: 'POST', url: '/api/v1/auth/password/forgot', payload })).statusCode).toBe(422);
    }
    expect((await x.reset(undefined, 'curta')).statusCode).toBe(422);
    expect((await x.reset(undefined, newPassword, oldPassword)).statusCode).toBe(422);
    expect((await x.reset('invalid')).statusCode).toBe(422);
    expect((await x.app.inject({ method: 'POST', url: '/api/v1/auth/password/reset', payload: {
      token: x.delivered[0], password: newPassword, passwordConfirmation: newPassword, accountId: 'another-account'
    } })).statusCode).toBe(422);
    expect(x.deps.repository.completeReset).not.toHaveBeenCalled();
    expect((await x.reset()).statusCode).toBe(200);
  });

  it('aplica rate gate a ambas as acoes sem enviar token bruto ao limitador', async () => {
    const x = await setup(); await x.forgot();
    x.rate.check.mockResolvedValue(false);
    expect((await x.forgot()).statusCode).toBe(429);
    expect((await x.reset()).statusCode).toBe(429);
    expect(x.rate.check).toHaveBeenLastCalledWith('reset', '127.0.0.1', hashAccountToken(x.delivered[0]!));
    expect(x.deps.repository.completeReset).not.toHaveBeenCalled();
    expect(x.delivered).toHaveLength(1);
  });

  it('rejeita expiracao inclusiva, tipo errado e replay', async () => {
    const x = await setup(); await x.forgot();
    const token = x.delivered[0]!;
    x.setNow(new Date('2026-01-01T00:30:00Z'));
    expect((await x.reset(token)).statusCode).toBe(422);
    await x.forgot();
    x.tokens.get(hashAccountToken(x.delivered.at(-1)!))!.kind = 'EMAIL_VERIFICATION';
    expect((await x.reset()).statusCode).toBe(422);
    await x.forgot(); expect((await x.reset()).statusCode).toBe(200);
    expect((await x.reset()).statusCode).toBe(422);
  });

  it('revoga duas sessoes, invalida tokens irmaos e exige login com senha nova', async () => {
    const x = await setup();
    const first = await x.login(); const second = await x.login();
    const id = (response: typeof first) => String(response.headers['set-cookie']).split(';')[0]!.split('=')[1]!;
    expect(id(first)).not.toBe(id(second));
    // A different account is outside the reset scope.
    const other = { ...[...x.sessions.values()][0]!, idHash: 'other', accountId: 'other-account' };
    x.sessions.set(other.idHash, other);
    await x.forgot(); const olderToken = x.delivered[0]!;
    await x.forgot();
    const response = await x.reset();
    expect(response.statusCode).toBe(200); expect(response.headers['set-cookie']).toBeUndefined();
    expect(await x.auth.current(id(first))).toBeNull(); expect(await x.auth.current(id(second))).toBeNull();
    expect(other.revokedAt).toBeNull();
    expect((await x.reset(olderToken)).statusCode).toBe(422);
    expect((await x.login()).statusCode).toBe(401); expect((await x.login(newPassword)).statusCode).toBe(200);
    expect(await verifyPassword(x.account.passwordHash!, newPassword)).toBe(true);
    expect(x.account.passwordHash).not.toContain(newPassword);
  });

  it('nao confirma email nem desbane conta e nao transforma externa em local', async () => {
    const x = await setup(); x.account.status = 'BANIDO'; x.account.emailVerifiedAt = null;
    await x.forgot(); expect((await x.reset()).statusCode).toBe(200);
    expect(x.account.status).toBe('BANIDO'); expect(x.account.emailVerifiedAt).toBeNull();
    expect((await x.login(newPassword)).statusCode).toBe(403);
    await x.forgot(); x.account.passwordHash = null;
    expect((await x.reset()).statusCode).toBe(422);
  });

  it('falhas de entrega e de persistencia nao retornam sucesso nem detalhes internos', async () => {
    const x = await setup();
    vi.mocked(x.deps.delivery.queue).mockRejectedValueOnce(new Error('SMTP password=private SQL /internal'));
    const deliveryFailure = await x.forgot();
    expect(deliveryFailure.statusCode).toBe(500); expect(deliveryFailure.body).not.toMatch(/SMTP|private|SQL|internal/);
    // A failed delivery did not expose the generated token; request another one.
    expect((await x.forgot()).statusCode).toBe(202);
    vi.mocked(x.deps.repository.completeReset).mockRejectedValueOnce(new Error('SQL /private token'));
    const resetFailure = await x.reset();
    expect(resetFailure.statusCode).toBe(500); expect(resetFailure.body).not.toMatch(/SQL|private|token/);
  });

  it('nega login cuja credencial mudou entre verificacao e criacao da sessao', async () => {
    const x = await setup();
    x.sessionStore.save = vi.fn(async () => false);
    const response = await x.login();
    expect(response.statusCode).toBe(401); expect(response.headers['set-cookie']).toBeUndefined(); expect(x.sessions.size).toBe(0);
  });

  it('servidor operacional continua sem rotas de autenticacao e recuperacao', async () => {
    const app = buildApp(readConfig({ APP_ENV: 'test' })); apps.push(app);
    for (const path of ['login', 'register', 'password/forgot', 'password/reset']) {
      expect((await app.inject({ method: 'POST', url: `/api/v1/auth/${path}`, payload: {} })).statusCode).toBe(404);
    }
  });
});

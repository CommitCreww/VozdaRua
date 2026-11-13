import { afterEach, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import { readConfig } from '../src/config/index.js';
import { registerAuthRoutes } from '../src/routes/auth.js';
import type { AuthDependencies, LocalAccount } from '../src/services/auth.js';
import { hashPassword } from '../src/security/password.js';
import { hashAccountToken } from '../src/security/tokens.js';
import { isSessionValid, type StoredSession } from '../src/security/sessions.js';

const apps: ReturnType<typeof buildApp>[] = [];
afterEach(async () => { await Promise.all(apps.splice(0).map((app) => app.close())); });

function setup() {
  const accounts = new Map<string, LocalAccount>();
  const sessions = new Map<string, StoredSession>();
  const tokens = new Map<string, { email: string; expiresAt: Date; used: boolean }>();
  const queued: string[] = [];
  let now = new Date('2026-01-01T00:00:00Z');
  let limited = false;
  const deps: AuthDependencies = {
    legal: { termsVersion: 'test-only', privacyVersion: 'test-only' }, now: () => now,
    verification: { async queue(_email, token) { queued.push(token); } },
    rate: { async check() { return !limited; }, async recordFailure() {} },
    accounts: {
      async findByEmail(email) { return accounts.get(email) ?? null; },
      async findById(id) { return [...accounts.values()].find((item) => item.id === id) ?? null; },
      async register(input) {
        if (accounts.has(input.email)) return false;
        accounts.set(input.email, { id: 'synthetic-user', email: input.email, passwordHash: input.passwordHash,
          emailVerifiedAt: null, role: 'CIDADAO', status: 'ATIVO' });
        tokens.set(input.tokenHash, { email: input.email, expiresAt: input.expiresAt, used: false });
        return true;
      },
      async enqueueVerification(email, hash, expiresAt) { tokens.set(hash, { email, expiresAt, used: false }); return true; },
      async confirmEmail(hash, at) {
        const token = tokens.get(hash);
        if (!token || token.used || at >= token.expiresAt) return false;
        token.used = true;
        const account = accounts.get(token.email);
        if (!account) return false;
        account.emailVerifiedAt = at;
        return true;
      }
    },
    sessions: {
      async findByIdHash(id) { return sessions.get(id) ?? null; },
      async renewIfActive(id, at) {
        const session = sessions.get(id);
        if (!session || !isSessionValid(session, at)) return null;
        const renewed = { ...session, lastActivityAt: at };
        sessions.set(id, renewed);
        return renewed;
      },
      async save(session) { sessions.set(session.idHash, session); return true; },
      async revoke(id, at) { const session = sessions.get(id); if (session) sessions.set(id, { ...session, revokedAt: at }); },
      async revokeOtherSessions() {}, async revokeAllForAccount() {}, async replaceId(oldId, session) { sessions.delete(oldId); sessions.set(session.idHash, session); }
    }
  };
  const app = buildApp(readConfig({ APP_ENV: 'test' })); apps.push(app);
  const auth = registerAuthRoutes(app, deps, { production: true, origin: 'https://example.test' });
  const register = () => app.inject({ method: 'POST', url: '/api/v1/auth/register', payload: {
    name: 'Pessoa Sintética', email: 'PESSOA@example.test', password: 'frase de teste aprovada', passwordConfirmation: 'frase de teste aprovada',
    termsAccepted: true, privacyAcknowledged: true
  } });
  const login = (password = 'frase de teste aprovada') => app.inject({ method: 'POST', url: '/api/v1/auth/login', payload: { email: 'pessoa@example.test', password } });
  return { app, auth, accounts, sessions, tokens, queued, register, login, setNow: (value: Date) => { now = value; }, setLimited: (value: boolean) => { limited = value; } };
}

describe('handlers de auth com stores simulados', () => {
  it('cadastro valida entrada, aceita sem sessao e nao enumera duplicidade', async () => {
    const x = setup();
    expect((await x.app.inject({ method: 'POST', url: '/api/v1/auth/register', payload: {} })).statusCode).toBe(422);
    expect((await x.app.inject({ method: 'POST', url: '/api/v1/auth/register', payload: {
      name: 'Pessoa', email: 'pessoa@example.test', password: 'curta', passwordConfirmation: 'curta', termsAccepted: true, privacyAcknowledged: true
    } })).statusCode).toBe(422);
    const first = await x.register(); const second = await x.register();
    expect(first.statusCode).toBe(202); expect(second.statusCode).toBe(202);
    expect(second.body).toBe(first.body);
    expect(first.headers['set-cookie']).toBeUndefined();
    expect(x.accounts.size).toBe(1); expect(x.queued).toHaveLength(1);
    expect(first.body).not.toMatch(/token|password|pessoa/i);
  });

  it('confirma token uma vez, rejeita expirado e nao cria sessao', async () => {
    const x = setup(); await x.register();
    const token = x.queued[0]!;
    const verify = () => x.app.inject({ method: 'POST', url: '/api/v1/auth/email/verify', payload: { token } });
    expect((await verify()).statusCode).toBe(200);
    expect((await verify()).statusCode).toBe(422);
    expect(x.sessions.size).toBe(0);
    const y = setup(); await y.register(); y.setNow(new Date('2026-01-02T00:00:00Z'));
    expect((await y.app.inject({ method: 'POST', url: '/api/v1/auth/email/verify', payload: { token: y.queued[0] } })).statusCode).toBe(422);
  });

  it('reenvio responde neutro e aplica gate de tentativas', async () => {
    const x = setup();
    const resend = (email: string) => x.app.inject({ method: 'POST', url: '/api/v1/auth/email/resend', payload: { email } });
    expect((await resend('missing@example.test')).statusCode).toBe(202);
    await x.register(); expect((await resend('pessoa@example.test')).statusCode).toBe(202);
    expect(x.queued).toHaveLength(2);
    x.setLimited(true); expect((await resend('pessoa@example.test')).statusCode).toBe(429);
  });

  it('login nega credencial invalida e nao confirmado; banido recebe sessao somente leitura', async () => {
    const x = setup(); await x.register();
    expect((await x.login('senha incorreta longa')).statusCode).toBe(401);
    expect((await x.login()).statusCode).toBe(403);
    await x.app.inject({ method: 'POST', url: '/api/v1/auth/email/verify', payload: { token: x.queued[0] } });
    x.accounts.get('pessoa@example.test')!.status = 'BANIDO';
    const response = await x.login();
    expect(response.statusCode).toBe(200);
    expect(response.json().account.status).toBe('BANIDO');
    expect(String(response.headers['set-cookie'])).toMatch(/HttpOnly.*Secure.*SameSite=Lax/);
    expect(response.json().csrfToken).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(response.body).not.toMatch(/passwordHash|frase de teste/);
    const sessionId = String(response.headers['set-cookie']).split(';')[0]!.split('=')[1]!;
    expect((await x.auth.current(sessionId))?.account.status).toBe('BANIDO');
    x.accounts.get('pessoa@example.test')!.role = 'ADMIN';
    expect((await x.auth.current(sessionId))?.account.role).toBe('ADMIN');
  });

  it('logout exige origin e CSRF, revoga no store; sessao expira por inatividade', async () => {
    const x = setup(); await x.register();
    await x.app.inject({ method: 'POST', url: '/api/v1/auth/email/verify', payload: { token: x.queued[0] } });
    const login = await x.login(); const cookie = String(login.headers['set-cookie']).split(';')[0]!;
    const csrf = login.json().csrfToken as string;
    const logout = (origin: string, token: string) => x.app.inject({ method: 'POST', url: '/api/v1/auth/logout', headers: { cookie, origin, 'x-csrf-token': token } });
    expect((await logout('https://evil.test', csrf)).statusCode).toBe(401);
    expect((await logout('https://example.test', 'bad')).statusCode).toBe(401);
    expect((await logout('https://example.test', csrf)).statusCode).toBe(204);
    expect((await logout('https://example.test', csrf)).statusCode).toBe(401);
    const second = await x.login();
    const sessionId = String(second.headers['set-cookie']).split(';')[0]!.split('=')[1]!;
    x.setNow(new Date('2026-01-01T00:30:00Z'));
    expect(await x.auth.current(sessionId)).toBeNull();
  });
});

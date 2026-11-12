import { describe, expect, it } from 'vitest';
import { hashPassword, isAllowedPassword, verifyPassword } from '../src/security/password.js';
import { commonPasswordFingerprints } from '../src/security/common-password-fingerprints.js';
import { generateAccountToken, hashAccountToken, isTokenUsable, TOKEN_TTL_MS, type AccountTokenStore } from '../src/security/tokens.js';
import { isSessionValid, renewSessionActivity, SESSION_ABSOLUTE_MS, SESSION_IDLE_MS, type SessionStore, type StoredSession } from '../src/security/sessions.js';

describe('senhas D04', () => {
  it('valida limites e lista local, sem exigir composicao', () => {
    expect(isAllowedPassword('x'.repeat(14))).toBe(false);
    expect(isAllowedPassword('x'.repeat(15))).toBe(true);
    expect(isAllowedPassword('x'.repeat(128))).toBe(true);
    expect(isAllowedPassword('x'.repeat(129))).toBe(false);
    expect(commonPasswordFingerprints.size).toBe(10_000);
    expect(isAllowedPassword('frase longa sem simbolos especiais')).toBe(true);
    expect(isAllowedPassword(' phrase with spaces ')).toBe(true);
    expect(isAllowedPassword(null as unknown as string)).toBe(false);
    expect(isAllowedPassword('frase longa', { has: () => true })).toBe(false);
  });
  it('gera hash Argon2id com salt distinto e verifica sem expor falha interna', async () => {
    const password = 'frase longa de teste sintetico';
    const first = await hashPassword(password);
    const second = await hashPassword(password);
    expect(first).toMatch(/^\$argon2id\$v=19\$m=19456,t=2,p=1\$/);
    expect(first).not.toBe(second);
    expect(first.length).toBeLessThanOrEqual(255);
    expect(await verifyPassword(first, password)).toBe(true);
    expect(await verifyPassword(first, 'senha incorreta longa')).toBe(false);
    expect(await verifyPassword('hash-malformado', password)).toBe(false);
    await expect(hashPassword('frase longa sintetica', { has: () => true })).rejects.toThrow('Senha inválida.');
  });
});

describe('tokens D04', () => {
  it('gera 32 bytes aleatorios URL-safe e persiste apenas hash', () => {
    const one = generateAccountToken(); const two = generateAccountToken();
    expect(Buffer.from(one, 'base64url')).toHaveLength(32);
    expect(one).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(one).not.toBe(two);
    expect(hashAccountToken(one)).toMatch(/^[0-9a-f]{64}$/);
    expect(hashAccountToken(one)).not.toContain(one);
  });
  it('distingue tipo, expiracao e consumo; store simulado consome uma vez', async () => {
    const token = generateAccountToken(); const hash = hashAccountToken(token);
    const now = new Date('2026-01-01T00:00:00Z');
    const record = { kind: 'PASSWORD_RESET' as const, hash, expiresAt: new Date(now.getTime() + TOKEN_TTL_MS.PASSWORD_RESET), consumedAt: null as Date | null };
    expect(isTokenUsable(record, 'PASSWORD_RESET', token, now)).toBe(true);
    expect(isTokenUsable(record, 'EMAIL_VERIFICATION', token, now)).toBe(false);
    expect(isTokenUsable(record, 'PASSWORD_RESET', 'outro', now)).toBe(false);
    expect(isTokenUsable(record, 'PASSWORD_RESET', token, record.expiresAt)).toBe(false);
    const store: AccountTokenStore = { async consume(candidate, kind, at) {
      if (!isTokenUsable(record, kind, token, at) || candidate !== hash) return false;
      record.consumedAt = at; return true;
    } };
    expect(await store.consume(hash, 'PASSWORD_RESET', now)).toBe(true);
    expect(await store.consume(hash, 'PASSWORD_RESET', now)).toBe(false);
    expect(TOKEN_TTL_MS.EMAIL_VERIFICATION).toBe(24 * 60 * 60 * 1000);
  });
});

describe('sessoes D03', () => {
  const createdAt = new Date('2026-01-01T00:00:00Z');
  const base: StoredSession = { idHash: 'synthetic', accountId: 'synthetic', csrfTokenHash: 'synthetic', createdAt, lastActivityAt: createdAt, revokedAt: null };
  it('expira nos limites de inatividade e absoluto', () => {
    expect(isSessionValid(base, new Date(createdAt.getTime() + SESSION_IDLE_MS - 1))).toBe(true);
    expect(isSessionValid(base, new Date(createdAt.getTime() + SESSION_IDLE_MS))).toBe(false);
    const active = { ...base, lastActivityAt: new Date(createdAt.getTime() + SESSION_ABSOLUTE_MS - 1) };
    expect(isSessionValid(active, new Date(createdAt.getTime() + SESSION_ABSOLUTE_MS))).toBe(false);
    expect(isSessionValid(null, createdAt)).toBe(false);
  });
  it('renova inatividade sem estender prazo absoluto e nega revogada', () => {
    const renewed = renewSessionActivity(base, new Date(createdAt.getTime() + 1_000));
    expect(renewed?.lastActivityAt.getTime()).toBe(createdAt.getTime() + 1_000);
    expect(renewed?.createdAt).toEqual(createdAt);
    expect(renewSessionActivity({ ...base, revokedAt: createdAt }, createdAt)).toBeNull();
  });
  it('contrato de store simulado revoga outras sessoes', async () => {
    const records = new Map([['one', { ...base, idHash: 'one' }], ['two', { ...base, idHash: 'two' }]]);
    const store: Pick<SessionStore, 'revokeOtherSessions' | 'findByIdHash'> = {
      async findByIdHash(id) { return records.get(id) ?? null; },
      async revokeOtherSessions(accountId, exceptIdHash, at) { for (const [id, session] of records) if (session.accountId === accountId && id !== exceptIdHash) records.set(id, { ...session, revokedAt: at }); }
    };
    await store.revokeOtherSessions('synthetic', 'one', createdAt);
    expect(isSessionValid(await store.findByIdHash('one'), createdAt)).toBe(true);
    expect(isSessionValid(await store.findByIdHash('two'), createdAt)).toBe(false);
  });
});

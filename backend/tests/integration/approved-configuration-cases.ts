import { createHmac, randomBytes, randomUUID } from 'node:crypto';
import { expect, it } from 'vitest';
import type { Pool } from 'pg';
import { AUTH_RATE_POLICIES } from '../../src/config/auth-rate.js';
import { createPersistentAuthRateGate } from '../../src/security/auth-rate.js';
import { createAuthRateRepository, type AuthAction } from '../../src/repositories/auth-rate.js';
import type { TransactionalSqlExecutor } from '../../src/repositories/database.js';
import type { createDatabase } from '../../src/repositories/database.js';
import { composeAuthBackend } from '../../src/composition/auth.js';
import { readConfig } from '../../src/config/index.js';

export function approvedConfigurationCases(fixture: { database(): TransactionalSqlExecutor; openDatabase(): ReturnType<typeof createDatabase>; admin(): Pool; now(): Date }) {
  const actions: AuthAction[] = ['login','register','resend','forgot','reset'];
  it('HTTP usa quotas operacionais aprovadas sem politica injetada e retorna 429 no quarto cadastro da identidade', async () => {
    const composition = composeAuthBackend({ database: fixture.openDatabase(), config: readConfig({ APP_ENV: 'test' }),
      rateKey: randomBytes(32), legal: { termsVersion: 'test-only', privacyVersion: 'test-only' }, origin: 'https://example.test', now: fixture.now });
    composition.mountExperimentalHttp();
    const password = 'frase sintetica quota aprovada';
    const email = `${randomUUID()}@example.test`;
    const payload = { name: 'Pessoa sintética', email, password, passwordConfirmation: password, termsAccepted: true, privacyAcknowledged: true };
    try {
      for (let i = 0; i < 3; i++) expect((await composition.app.inject({ method: 'POST', url: '/api/v1/auth/register', payload })).statusCode).toBe(202);
      const response = await composition.app.inject({ method: 'POST', url: '/api/v1/auth/register', payload });
      expect(response.statusCode).toBe(429); expect(response.json().code).toBe('RATE_LIMITED');
      expect(response.headers['set-cookie']).toBeUndefined(); expect(response.body).not.toContain(email);
      const account = (await composition.controls.accounts.findByEmail(email))!;
      expect(await fixture.database().query('SELECT id FROM envios_email_auth WHERE usuario_id=$1', [account.id])).toHaveLength(1);
    } finally { await composition.app.close(); }
  }, 20000);
  it.each(actions)('quota aprovada %s: concorrencia, prazo fixo, cooldown sem renovacao e recuperacao', async (action) => {
    const key = randomBytes(32); const origin = randomUUID(); const identity = randomUUID();
    const db = fixture.database(); const repo = createAuthRateRepository(db);
    const first = createPersistentAuthRateGate(repo, AUTH_RATE_POLICIES, key);
    const second = createPersistentAuthRateGate(createAuthRateRepository(db), AUTH_RATE_POLICIES, key);
    const digest = (parts: string[]) => createHmac('sha256', key).update(JSON.stringify(parts)).digest('hex');
    const identityKey = digest([action,'identity',identity]); const originKey = digest([action,'origin',origin]);
    const pairKey = digest([action,'failure',origin,identity]);
    const p = AUTH_RATE_POLICIES[action];
    const results = await Promise.all(Array.from({ length: p.identity.limit + 6 }, (_, i) => (i % 2 ? first : second).check(action, origin, identity)));
    expect(results.filter(Boolean)).toHaveLength(p.identity.limit);
    const state = async (hash: string) => (await db.query<{ quantidade: number; expira_em: Date; bloqueado_ate: Date | null }>('SELECT quantidade,expira_em,bloqueado_ate FROM limites_auth WHERE acao=$1 AND chave_hash=$2', [action,hash]))[0]!;
    const identityBefore = await state(identityKey); const pairBefore = await state(pairKey);
    expect(identityBefore.quantidade).toBe(p.identity.limit); expect(identityBefore.bloqueado_ate).toBeNull();
    if (p.quotaCooldownMs) {
      expect(pairBefore.bloqueado_ate!.getTime()).toBe(pairBefore.expira_em.getTime());
      const [timing] = await db.query<{ remaining: number }>('SELECT EXTRACT(EPOCH FROM($1::timestamptz-clock_timestamp()))*1000 AS remaining', [pairBefore.bloqueado_ate]);
      expect(Number(timing!.remaining)).toBeGreaterThan(p.quotaCooldownMs - 10000);
      expect(Number(timing!.remaining)).toBeLessThanOrEqual(p.quotaCooldownMs);
    }
    expect((await Promise.all(Array.from({ length: 5 }, () => second.check(action, origin, identity)))).every((v) => !v)).toBe(true);
    expect(await state(identityKey)).toEqual(identityBefore); expect(await state(pairKey)).toEqual(pairBefore);
    // Simulate fixed-window expiry in the fixture, without waiting minutes or changing global clocks.
    await fixture.admin().query("UPDATE limites_auth SET expira_em=clock_timestamp()-INTERVAL '1 second',bloqueado_ate=NULL WHERE chave_hash IN ($1,$2)", [identityKey,originKey]);
    expect(await second.check(action, randomUUID(), identity)).toBe(true); // Pair-only cooldown cannot block a different origin after quota expiry.
    expect(await first.check(action, origin, identity)).toBe(!p.quotaCooldownMs);
    await fixture.admin().query("UPDATE limites_auth SET expira_em=clock_timestamp()-INTERVAL '1 second',bloqueado_ate=NULL WHERE chave_hash=$1", [pairKey]);
    expect(await first.check(action, origin, identity)).toBe(true);
    expect(JSON.stringify(await state(identityKey))).not.toContain(identity);
  }, 60000);

  it.each(actions)('quota de origem aprovada %s permanece independente da identidade sob concorrencia', async (action) => {
    const key = randomBytes(32); const origin = randomUUID(); const p = AUTH_RATE_POLICIES[action];
    const one = createPersistentAuthRateGate(createAuthRateRepository(fixture.database()), AUTH_RATE_POLICIES, key);
    const two = createPersistentAuthRateGate(createAuthRateRepository(fixture.database()), AUTH_RATE_POLICIES, key);
    const results = await Promise.all(Array.from({ length: p.origin.limit + 3 }, (_, i) => (i % 2 ? one : two).check(action, origin, randomUUID())));
    expect(results.filter(Boolean)).toHaveLength(p.origin.limit);
  }, 60000);

  it('login progride 1/2/4/8/16/30 s, falhas concorrentes nao estendem bloqueio e outra origem nao herda cooldown', async () => {
    const key = randomBytes(32); const origin = randomUUID(); const identity = randomUUID();
    const gate = createPersistentAuthRateGate(createAuthRateRepository(fixture.database()), AUTH_RATE_POLICIES, key);
    const hash = createHmac('sha256',key).update(JSON.stringify(['login','failure',origin,identity])).digest('hex');
    for (const [index, milliseconds] of AUTH_RATE_POLICIES.login.cooldownMs.entries()) {
      const [start] = await fixture.database().query<{ now: Date }>('SELECT clock_timestamp() AS now');
      await gate.recordFailure('login', origin, identity);
      const [before] = await fixture.database().query<{ quantidade: number; bloqueado_ate: Date; expira_em: Date; now: Date }>(
        'SELECT quantidade,bloqueado_ate,expira_em,clock_timestamp() AS now FROM limites_auth WHERE chave_hash=$1', [hash]);
      expect(before!.quantidade).toBe(index + 1);
      // Bound the deadline using the database clock, without assuming host scheduling latency.
      expect(before!.bloqueado_ate.getTime()).toBeGreaterThanOrEqual(start!.now.getTime() + milliseconds - 1);
      expect(before!.bloqueado_ate.getTime()).toBeLessThanOrEqual(before!.now.getTime() + milliseconds);
      if (index === AUTH_RATE_POLICIES.login.cooldownMs.length - 1) {
        // Exercise concurrency within the approved 30 s window, rather than racing its 1 s predecessor.
        await Promise.all(Array.from({ length: 5 }, () => gate.recordFailure('login', origin, identity)));
        const [after] = await fixture.database().query<{ quantidade: number; bloqueado_ate: Date; expira_em: Date; now: Date }>(
          'SELECT quantidade,bloqueado_ate,expira_em,clock_timestamp() AS now FROM limites_auth WHERE chave_hash=$1', [hash]);
        expect(after!.now.getTime()).toBeLessThan(before!.bloqueado_ate.getTime());
        expect({ ...after, now: undefined }).toEqual({ ...before, now: undefined });
        expect(await gate.check('login', origin, identity)).toBe(false);
      }
      await fixture.admin().query("UPDATE limites_auth SET bloqueado_ate=clock_timestamp()-INTERVAL '1 millisecond' WHERE chave_hash=$1", [hash]);
    }
    expect(await gate.check('login', randomUUID(), identity)).toBe(true);
    await fixture.admin().query("UPDATE limites_auth SET expira_em=clock_timestamp()-INTERVAL '1 second',bloqueado_ate=NULL WHERE chave_hash=$1", [hash]);
    expect(await gate.check('login', origin, identity)).toBe(true);
  }, 30000);

  it('PostgreSQL real aplica statement_timeout de 10 s e recupera a conexao apos consulta cancelada', async () => {
    const db = fixture.database();
    expect((await db.query<{ value: string }>("SELECT current_setting('statement_timeout') AS value"))[0]!.value).toBe('10s');
    const start = performance.now();
    await expect(db.transaction(async (sql) => { await sql.query('SELECT pg_sleep(11)'); })).rejects.toBeDefined();
    expect(performance.now() - start).toBeGreaterThanOrEqual(9500);
    expect(performance.now() - start).toBeLessThan(20000);
    expect((await db.query<{ ok: number }>('SELECT 1 AS ok'))[0]!.ok).toBe(1);
  }, 25000);
}

import { describe, expect, it, vi } from 'vitest';
import { randomBytes } from 'node:crypto';
import { createPersistentAuthRateGate } from '../src/security/auth-rate.js';
import { createAuthRateRepository } from '../src/repositories/auth-rate.js';
import { createAuthMailRepository, type MailIntent } from '../src/repositories/auth-mail.js';
import { createAuthMailWorker } from '../src/services/auth-mail.js';
import { fixtureRatePolicies } from './integration/auth-controls-cases.js';
import { createAuthControls } from '../src/services/auth-controls.js';
import { buildApp } from '../src/app.js';
import { readConfig } from '../src/config/index.js';
import { registerAuthRoutes } from '../src/routes/auth.js';
import type { TransactionalSqlExecutor } from '../src/repositories/database.js';

describe('configuracao explicita e falhas dos controles auth', () => {
  it('recusa limites ausentes, janelas invalidas, cooldown regressivo e segredo ausente', () => {
    const repo = {} as ReturnType<typeof createAuthRateRepository>;
    expect(() => createPersistentAuthRateGate(repo, undefined!, randomBytes(32))).toThrow('explicitly configured');
    const invalid = fixtureRatePolicies(); invalid.login.origin.limit = 0;
    expect(() => createPersistentAuthRateGate(repo, invalid, randomBytes(32))).toThrow('explicitly configured');
    const reversed = fixtureRatePolicies(); reversed.login.cooldownMs = [2000, 1000];
    expect(() => createPersistentAuthRateGate(repo, reversed, randomBytes(32))).toThrow('explicitly configured');
    expect(() => createPersistentAuthRateGate(repo, fixtureRatePolicies(), Buffer.alloc(0))).toThrow('key unavailable');
  });

  it('falha de persistencia do limitador nao autoriza e nao recebe identidade clara', async () => {
    const consume = vi.fn(async () => { throw new Error('unavailable'); });
    const repo = { consume } as unknown as ReturnType<typeof createAuthRateRepository>;
    const gate = createPersistentAuthRateGate(repo, fixtureRatePolicies(), randomBytes(32));
    await expect(gate.check('login', '192.0.2.1', 'pessoa@example.test')).rejects.toThrow('unavailable');
    expect(JSON.stringify(consume.mock.calls)).not.toContain('192.0.2.1');
    expect(JSON.stringify(consume.mock.calls)).not.toContain('pessoa@example.test');
  });

  it('HTTP retorna erro seguro quando a persistencia do limitador falha', async () => {
    const fail = async () => { throw new Error('SQL password=private host=internal'); };
    const database: TransactionalSqlExecutor = { query: fail, transaction: fail };
    const controls = createAuthControls(database, fixtureRatePolicies(), randomBytes(32));
    const app = buildApp(readConfig({ APP_ENV: 'test' }));
    registerAuthRoutes(app, { ...controls, legal: { termsVersion: 'test-only', privacyVersion: 'test-only' }, now: () => new Date() }, { production: true, origin: 'https://example.test' });
    try {
      const response = await app.inject({ method: 'POST', url: '/api/v1/auth/login', payload: { email: 'pessoa@example.test', password: 'senha sintetica para teste' } });
      expect(response.statusCode).toBe(500); expect(response.headers['set-cookie']).toBeUndefined();
      expect(response.body).not.toMatch(/SQL|private|internal|password/);
    } finally { await app.close(); }
  });

  it('worker exige intervalos progressivos e lease superior ao timeout', () => {
    const repo = {} as ReturnType<typeof createAuthMailRepository>;
    const transport = { send: vi.fn() };
    expect(() => createAuthMailWorker(repo, transport, { leaseMs: 1, timeoutMs: 1, retryDelaysMs: [1, 2] })).toThrow('explicitly configured');
    expect(() => createAuthMailWorker(repo, transport, { leaseMs: 100, timeoutMs: 10, retryDelaysMs: [2, 1] })).toThrow('explicitly configured');
  });

  it('timeout cancela transporte e registra somente classificacao temporaria', async () => {
    const job = { id: 'synthetic', claim_id: 'claim', tentativas: 1 } as MailIntent;
    const finish = vi.fn(async () => true);
    const repo = { claim: vi.fn(async () => job), issueDeliveryToken: vi.fn(async () => 'pessoa@example.test'), finish } as unknown as ReturnType<typeof createAuthMailRepository>;
    let signal: AbortSignal | undefined;
    const worker = createAuthMailWorker(repo, { async send(_message, activeSignal) { signal = activeSignal; return new Promise(() => {}); } }, { leaseMs: 1000, timeoutMs: 10, retryDelaysMs: [10, 20] });
    expect(await worker.runOne()).toBe(true); expect(signal?.aborted).toBe(true);
    expect(finish).toHaveBeenCalledExactlyOnceWith(job, 'TEMPORARY', 10);
  });

  it('falha de gravacao do hash nao envia e deixa claim recuperavel', async () => {
    const send = vi.fn();
    const repo = { claim: vi.fn(async () => ({ id: 'synthetic' })), issueDeliveryToken: vi.fn(async () => { throw new Error('SQL failure'); }) } as unknown as ReturnType<typeof createAuthMailRepository>;
    await expect(createAuthMailWorker(repo, { send }, { leaseMs: 1000, timeoutMs: 10, retryDelaysMs: [10, 20] }).runOne()).rejects.toThrow('SQL failure');
    expect(send).not.toHaveBeenCalled();
  });
});

import { randomBytes } from 'node:crypto';
import { EventEmitter } from 'node:events';
import { describe, expect, it, vi } from 'vitest';
import { composeAuthBackend, composeAuthBackendPool } from '../src/composition/auth.js';
import { composePostmarkWorker, purgeAuthMailHistory } from '../src/composition/auth-mail.js';
import { AUTH_MAIL, approvedMailPolicies } from '../src/config/auth-mail.js';
import { readConfig } from '../src/config/index.js';
import type { DatabasePort, TransactionalSqlExecutor } from '../src/repositories/database.js';
import { createAuthMailMonitor, type MailAlert } from '../src/services/auth-mail-monitor.js';
import { fixtureRatePolicies } from './integration/auth-controls-cases.js';
import { runAuthMailLoop } from '../src/workers/auth-mail.js';

const options = () => ({ config: readConfig({ APP_ENV: 'test' }), ratePolicies: fixtureRatePolicies(), rateKey: randomBytes(32),
  legal: { termsVersion: 'test-only', privacyVersion: 'test-only' }, origin: 'https://example.test' });
describe('auth composition and approved D05 parameters', () => {
  it('centralizes approved values without filling open infrastructure parameters', () => {
    expect(AUTH_MAIL).toEqual({ maxAttempts: 3, retryDelaysMs: [60000, 300000], historyRetentionMs: 2592000000, pollMs: 5000, backoffMaxMs: 60000 });
    expect(() => approvedMailPolicies(undefined!)).toThrow('configuration unavailable');
    expect(() => approvedMailPolicies({ leaseMs: 1, timeoutMs: 1, backoffFactor: 2 })).toThrow();
    const policies = approvedMailPolicies({ leaseMs: 10000, timeoutMs: 1000, backoffFactor: 2 }); // Explicit fixture.
    expect(policies.delivery.retryDelaysMs).toEqual([60000, 300000]);
    expect(policies.polling).toEqual({ pollMinMs: 5000, pollMaxMs: 60000, backoffFactor: 2 });
  });
  it('blocks invalid quotas and secrets before pool access', () => {
    const pool = { query: vi.fn(), end: vi.fn() };
    const databaseConfig = { host: 'localhost', port: 5432, database: 'synthetic', user: 'app', password: 'synthetic' };
    const invalid = options(); invalid.ratePolicies.login.origin.limit = 0;
    expect(() => composeAuthBackendPool({ ...invalid, databaseConfig, pool })).toThrow('explicitly configured');
    expect(() => composeAuthBackendPool({ ...options(), rateKey: Buffer.alloc(0), databaseConfig, pool })).toThrow('key unavailable');
    expect(pool.query).not.toHaveBeenCalled();
  });
  it('enforces 5-second polling even with work and caps backoff at 60 seconds', async () => {
    const controller = new AbortController(); const waits: number[] = [];
    let calls = 0;
    const policies = approvedMailPolicies({ leaseMs: 10000, timeoutMs: 1000, backoffFactor: 2 }); // Explicit fixture multiplier.
    await runAuthMailLoop({ signal: controller.signal, log() {}, runOne: async () => {
      calls++; if (calls === 9) controller.abort(); return calls === 7;
    }, wait: async (ms) => { waits.push(ms); } }, policies.polling);
    expect(waits).toEqual([5000, 10000, 20000, 40000, 60000, 60000, 5000, 5000]);
  });
  it('prepares a lazy pool/app with auth unmounted and closes pool on app shutdown', async () => {
    const pool = { query: vi.fn(async () => ({ rows: [] })), end: vi.fn(async () => {}) };
    const composition = composeAuthBackendPool({ ...options(), ratePolicies: undefined, databaseConfig: { host: 'localhost', port: 5432, database: 'synthetic', user: 'app', password: 'synthetic' }, pool });
    try {
      expect(composition.sessionPolicy).toEqual({ store: 'postgresql', idleMs: 1800000, absoluteMs: 43200000 });
      expect((await composition.app.inject({ method: 'POST', url: '/api/v1/auth/login', payload: {} })).statusCode).toBe(404);
      expect(pool.query).not.toHaveBeenCalled();
    } finally { await composition.app.close(); }
    expect(pool.end).toHaveBeenCalledOnce();
  });
  it.each(['development', 'staging', 'production'] as const)('cannot mount operational auth in %s even with numeric fixtures', async (appEnv) => {
    const database = { close: vi.fn(async () => {}) } as unknown as DatabasePort & TransactionalSqlExecutor;
    const composition = composeAuthBackend({ ...options(), config: readConfig({ APP_ENV: appEnv }), database });
    try { expect(() => composition.mountExperimentalHttp()).toThrow('mounting blocked'); }
    finally { await composition.app.close(); }
  });
  it('rejects invalid origin/legal config and duplicate experimental mounting', async () => {
    const database = { close: vi.fn(async () => {}) } as unknown as DatabasePort & TransactionalSqlExecutor;
    expect(() => composeAuthBackend({ ...options(), origin: 'https://example.test/path', database })).toThrow('origin unavailable');
    expect(() => composeAuthBackend({ ...options(), legal: { termsVersion: '', privacyVersion: '' }, database })).toThrow('legal configuration');
    const composition = composeAuthBackend({ ...options(), database });
    try { composition.mountExperimentalHttp(); expect(() => composition.mountExperimentalHttp()).toThrow('already mounted'); }
    finally { await composition.app.close(); }
  });
  it('prepares worker without sends/polling and uses approved policy when explicitly run', async () => {
    const signals = new EventEmitter();
    const database = { close: vi.fn(async () => {}), transaction: vi.fn(async () => { signals.emit('SIGTERM'); return null; }) } as unknown as TransactionalSqlExecutor & { close(): Promise<void> };
    const fetch = vi.fn<typeof globalThis.fetch>();
    const worker = composePostmarkWorker({ database, signals, leaseMs: 10000, backoffFactor: 2, log() {}, postmark: {
      serverToken: 'synthetic-only', from: 'sender@example.test', messageStream: 'outbound', timeoutMs: 1000, fetch,
      render: () => ({ subject: 'Synthetic', textBody: 'Synthetic' }) } });
    expect(database.transaction).not.toHaveBeenCalled(); expect(fetch).not.toHaveBeenCalled();
    expect(worker.policies.delivery.retryDelaysMs).toEqual([60000, 300000]);
    const running = worker.run(); expect(worker.run()).toBe(running);
    await running; expect(fetch).not.toHaveBeenCalled(); expect(database.close).toHaveBeenCalledOnce();
  });
  it('applies the approved retention through the explicit maintenance port', async () => {
    const query = vi.fn(async (_sql: string, _values?: readonly unknown[]) => []);
    await purgeAuthMailHistory({ query });
    expect(query.mock.calls[0]?.[1]).toEqual([AUTH_MAIL.historyRetentionMs]);
  });
});

describe('mail alert preparation', () => {
  it('requires explicit thresholds, does not call source implicitly and projects minimized metrics', async () => {
    const source = { operationalSnapshot: vi.fn(async () => ({ pending: 2, processing: 1, failed: 1, oldestPendingMs: 10, token: 'must-not-forward' })) };
    const alerts: MailAlert[] = [];
    expect(() => createAuthMailMonitor(source, undefined!, async () => {})).toThrow('thresholds pending');
    const monitor = createAuthMailMonitor(source, { backlogCount: 3, oldestPendingMs: 100 }, async (alert) => { alerts.push(alert); });
    expect(source.operationalSnapshot).not.toHaveBeenCalled();
    await monitor.check(); expect(alerts.map((a) => a.code)).toEqual(['AUTH_MAIL_FAILED', 'AUTH_MAIL_BACKLOG']);
    expect(JSON.stringify(alerts)).not.toMatch(/token|must-not-forward/);
  });
  it('alerts on age, stays quiet below thresholds and propagates source/sink failures', async () => {
    const emit = vi.fn(async () => {});
    const source = { operationalSnapshot: vi.fn(async () => ({ pending: 1, processing: 0, failed: 0, oldestPendingMs: 1 })) };
    const monitor = createAuthMailMonitor(source, { backlogCount: 3, oldestPendingMs: 100 }, emit);
    await monitor.check(); expect(emit).not.toHaveBeenCalled();
    source.operationalSnapshot.mockResolvedValue({ pending: 1, processing: 0, failed: 0, oldestPendingMs: 100 });
    await monitor.check(); expect(emit).toHaveBeenCalledOnce();
    emit.mockRejectedValueOnce(new Error('synthetic sink unavailable')); await expect(monitor.check()).rejects.toThrow('sink unavailable');
    source.operationalSnapshot.mockRejectedValueOnce(new Error('synthetic SQL unavailable')); await expect(monitor.check()).rejects.toThrow('SQL unavailable');
  });
});

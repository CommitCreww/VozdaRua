import { EventEmitter } from 'node:events';
import { randomBytes } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { AUTH_RATE_POLICIES } from '../src/config/auth-rate.js';
import { OPERATIONAL_TIMEOUTS } from '../src/config/operational-timeouts.js';
import { approvedMailPolicies } from '../src/config/auth-mail.js';
import { composePostmarkWorker } from '../src/composition/auth-mail.js';
import { createPersistentAuthRateGate } from '../src/security/auth-rate.js';
import { databasePoolConfig, type TransactionalSqlExecutor } from '../src/repositories/database.js';
import type { createAuthRateRepository } from '../src/repositories/auth-rate.js';
import { runAuthMailProcess, type MailWorkerEvent } from '../src/workers/auth-mail.js';
import { createShutdownDeadline } from '../src/workers/shutdown.js';

describe('approved operational configuration', () => {
  it('implements every approved quota, window and cooldown', () => {
    const rows = Object.entries(AUTH_RATE_POLICIES).map(([action, p]) => [action, p.origin.limit, p.origin.windowMs, p.identity.limit, p.identity.windowMs, p.cooldownMs, p.quotaCooldownMs]);
    expect(rows).toEqual([
      ['login', 60, 300000, 10, 900000, [1000,2000,4000,8000,16000,30000], undefined],
      ['register', 10, 3600000, 3, 3600000, [900000], 900000],
      ['resend', 10, 900000, 3, 900000, [300000], 300000],
      ['forgot', 20, 900000, 3, 900000, [300000], 300000],
      ['reset', 30, 900000, 10, 900000, [300000], 300000]
    ]);
    expect(Object.isFrozen(AUTH_RATE_POLICIES.register.origin)).toBe(true);
  });
  it('passes approved cooldowns to persistent consumption and keeps identifiers hashed', async () => {
    const consume = vi.fn<ReturnType<typeof createAuthRateRepository>['consume']>(async () => false);
    const repo = { consume } as unknown as ReturnType<typeof createAuthRateRepository>;
    const gate = createPersistentAuthRateGate(repo, AUTH_RATE_POLICIES, randomBytes(32));
    for (const action of ['register','resend','forgot','reset'] as const) {
      expect(await gate.check(action, '192.0.2.10', 'synthetic@example.test')).toBe(false);
      expect(consume.mock.calls.at(-1)?.[2]).toBe(AUTH_RATE_POLICIES[action].quotaCooldownMs);
    }
    expect(JSON.stringify(consume.mock.calls)).not.toMatch(/192\.0\.2\.10|synthetic@example/);
  });
  it('configures PostgreSQL startup server and client timeouts without changing global settings', () => {
    expect(databasePoolConfig({ host: 'localhost', port: 5432, database: 'synthetic', user: 'app', password: 'synthetic' })).toMatchObject({
      connectionTimeoutMillis: 5000, statement_timeout: 10000, query_timeout: 10000, idleTimeoutMillis: 10000
    });
    expect(OPERATIONAL_TIMEOUTS).toEqual({ postgresConnectMs: 5000, postgresQueryMs: 10000, mailLeaseMs: 60000, postmarkRequestMs: 10000, shutdownMs: 30000 });
    expect(approvedMailPolicies({ backoffFactor: 2 }).delivery).toEqual({ leaseMs: 60000, timeoutMs: 10000, retryDelaysMs: [60000,300000] });
  });
  it('applies 60-second lease and 10-second Postmark request defaults without network calls', () => {
    const fetch = vi.fn<typeof globalThis.fetch>();
    const database = {} as TransactionalSqlExecutor & { close(): Promise<void> };
    const prepared = composePostmarkWorker({ database, backoffFactor: 2, log() {}, postmark: { serverToken: 'synthetic', from: 'sender@example.test', messageStream: 'outbound', fetch,
      render: () => ({ subject: 'Synthetic', textBody: 'Synthetic' }) } });
    expect(prepared.policies.delivery).toMatchObject({ leaseMs: 60000, timeoutMs: 10000 });
    expect(fetch).not.toHaveBeenCalled();
  });
  it('expires graceful shutdown at 30 seconds and never extends on repeated signals', async () => {
    vi.useFakeTimers();
    try {
      const expired = vi.fn(); const deadline = createShutdownDeadline(expired);
      const rejected = expect(deadline.expired).rejects.toThrow('deadline exceeded');
      deadline.start(); await vi.advanceTimersByTimeAsync(20000); deadline.start();
      await vi.advanceTimersByTimeAsync(9999); expect(expired).not.toHaveBeenCalled();
      await vi.advanceTimersByTimeAsync(1); await rejected; expect(expired).toHaveBeenCalledOnce(); deadline.clear();
    } finally { vi.useRealTimers(); }
  });
  it('bounds worker drain and prevents sending or ACK after a stalled claim resumes', async () => {
    vi.useFakeTimers();
    try {
      const signals = new EventEmitter(); const events: MailWorkerEvent[] = [];
      let resume!: (value: unknown) => void;
      const database = { transaction: vi.fn(() => new Promise((resolve) => { resume = resolve; })), close: vi.fn(async () => {}) } as unknown as TransactionalSqlExecutor & { close(): Promise<void> };
      const send = vi.fn();
      const running = runAuthMailProcess({ database, transport: { send }, ...approvedMailPolicies({ backoffFactor: 2 }), signals, log: (e) => events.push(e) });
      const rejected = expect(running).rejects.toThrow('deadline exceeded');
      signals.emit('SIGTERM'); await vi.advanceTimersByTimeAsync(30000); await rejected;
      resume({ id: 'synthetic-claim' }); await vi.advanceTimersByTimeAsync(0);
      expect(send).not.toHaveBeenCalled(); expect(database.transaction).toHaveBeenCalledOnce();
      expect(database.close).toHaveBeenCalledOnce(); expect(events).toContain('MAIL_WORKER_SHUTDOWN_TIMEOUT');
      expect(signals.listenerCount('SIGTERM')).toBe(0);
    } finally { vi.useRealTimers(); }
  });
});

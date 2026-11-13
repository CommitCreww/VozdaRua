import { EventEmitter } from 'node:events';
import { describe, expect, it, vi } from 'vitest';
import { runAuthMailLoop, runAuthMailProcess, type MailWorkerEvent } from '../src/workers/auth-mail.js';
import type { TransactionalSqlExecutor } from '../src/repositories/database.js';

const polling = { pollMinMs: 1, pollMaxMs: 8, backoffFactor: 2 }; // Test fixture only.
describe('separate auth mail worker lifecycle', () => {
  it('serializes jobs, drains active job on shutdown and stops claiming', async () => {
    const controller = new AbortController();
    const events: MailWorkerEvent[] = [];
    let calls = 0;
    let finish!: () => void;
    const runOne = vi.fn(async () => { calls++; await new Promise<void>((resolve) => { finish = resolve; }); return true; });
    const running = runAuthMailLoop({ runOne, signal: controller.signal, log: (e) => events.push(e) }, polling);
    expect(calls).toBe(1); controller.abort();
    expect(events).not.toContain('MAIL_WORKER_STOPPED'); finish(); await running;
    expect(calls).toBe(1); expect(events.at(-1)).toBe('MAIL_WORKER_STOPPED');
  });
  it('backs off idle/failure, resets after progress and contains secret errors', async () => {
      const controller = new AbortController(); const events: MailWorkerEvent[] = [];
      const waits: number[] = [];
      const runOne = vi.fn().mockResolvedValueOnce(false).mockRejectedValueOnce(new Error('SQL password=secret'))
        .mockResolvedValueOnce(true).mockResolvedValueOnce(false).mockImplementation(async () => { controller.abort(); return false; });
      await runAuthMailLoop({ runOne, signal: controller.signal, log: (e) => events.push(e), wait: async (ms) => { waits.push(ms); } }, polling);
      expect(waits).toEqual([1, 2, 1, 1]); expect(runOne).toHaveBeenCalledTimes(5);
      expect(events).toContain('MAIL_WORKER_ERROR'); expect(JSON.stringify(events)).not.toMatch(/secret|password|SQL/);
  });
  it('stops idle wait promptly and ignores logger failures', async () => {
    const controller = new AbortController();
    const running = runAuthMailLoop({ runOne: async () => false, signal: controller.signal, log() { throw new Error('logger'); } }, { ...polling, pollMinMs: 10_000, pollMaxMs: 20_000 });
    controller.abort(); await running;
  });
  it('refuses an implicit or invalid polling schedule', async () => {
    for (const policy of [undefined, { ...polling, pollMinMs: 0 }, { ...polling, pollMaxMs: 0 }, { ...polling, backoffFactor: 1 }]) {
      await expect(runAuthMailLoop({ runOne: async () => false, signal: new AbortController().signal, log() {} }, policy!)).rejects.toThrow('explicitly configured');
    }
  });
  it('handles SIGTERM, closes the dedicated DB and removes signal handlers', async () => {
    const signals = new EventEmitter(); const close = vi.fn(async () => {});
    const database = { close, transaction: vi.fn(async () => { signals.emit('SIGTERM'); return undefined; }) } as unknown as TransactionalSqlExecutor & { close(): Promise<void> };
    await runAuthMailProcess({ database, transport: { send: vi.fn() }, delivery: { leaseMs: 100, timeoutMs: 10, retryDelaysMs: [1, 2] }, polling, signals, log() {} });
    expect(close).toHaveBeenCalledOnce(); expect(signals.listenerCount('SIGINT')).toBe(0); expect(signals.listenerCount('SIGTERM')).toBe(0);
  });
  it('closes SQL even if initialization rejects configuration', async () => {
    const close = vi.fn(async () => {}); const signals = new EventEmitter();
    const database = { close } as unknown as TransactionalSqlExecutor & { close(): Promise<void> };
    await expect(runAuthMailProcess({ database, transport: { send: vi.fn() }, delivery: { leaseMs: 1, timeoutMs: 10, retryDelaysMs: [1, 2] }, polling, signals, log() {} })).rejects.toThrow();
    expect(close).toHaveBeenCalledOnce(); expect(signals.listenerCount('SIGTERM')).toBe(0);
  });
});

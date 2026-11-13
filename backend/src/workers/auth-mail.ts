import { setTimeout as delay } from 'node:timers/promises';
import { createAuthMailRepository } from '../repositories/auth-mail.js';
import type { TransactionalSqlExecutor } from '../repositories/database.js';
import { createAuthMailWorker, type AuthMailTransport, type MailWorkerPolicy } from '../services/auth-mail.js';
import { createShutdownDeadline } from './shutdown.js';

export interface MailLoopPolicy { pollMinMs: number; pollMaxMs: number; backoffFactor: number }
export type MailWorkerEvent = 'MAIL_WORKER_STARTED' | 'MAIL_WORKER_IDLE' | 'MAIL_WORKER_PROCESSED' | 'MAIL_WORKER_ERROR' | 'MAIL_WORKER_STOPPED' | 'MAIL_WORKER_SHUTDOWN_TIMEOUT';
export interface MailLoopDependencies {
  runOne(): Promise<boolean>;
  signal: AbortSignal;
  log(event: MailWorkerEvent): void;
  wait?(milliseconds: number, signal: AbortSignal): Promise<void>;
}

export async function runAuthMailLoop(dependencies: MailLoopDependencies, policy: MailLoopPolicy): Promise<void> {
  if (!policy || !Number.isSafeInteger(policy.pollMinMs) || policy.pollMinMs <= 0 ||
      !Number.isSafeInteger(policy.pollMaxMs) || policy.pollMaxMs < policy.pollMinMs ||
      !Number.isFinite(policy.backoffFactor) || policy.backoffFactor <= 1) throw new Error('Mail polling policy must be explicitly configured');
  // Logger failures must not interrupt persistence/ACK or expose the original exception.
  const log = (event: MailWorkerEvent) => { try { dependencies.log(event); } catch {} };
  let waitMs = policy.pollMinMs;
  log('MAIL_WORKER_STARTED');
  try {
    while (!dependencies.signal.aborted) {
      let processed = false;
      try {
        processed = await dependencies.runOne();
        log(processed ? 'MAIL_WORKER_PROCESSED' : 'MAIL_WORKER_IDLE');
      } catch { log('MAIL_WORKER_ERROR'); }
      if (processed) waitMs = policy.pollMinMs;
      if (dependencies.signal.aborted) break;
      const wait = dependencies.wait ?? ((milliseconds: number, signal: AbortSignal) => delay(milliseconds, undefined, { signal }));
      await wait(waitMs, dependencies.signal).catch((error: unknown) => {
        if (!dependencies.signal.aborted) throw error;
      });
      if (!processed) waitMs = Math.min(policy.pollMaxMs, Math.ceil(waitMs * policy.backoffFactor));
    }
  } finally { log('MAIL_WORKER_STOPPED'); }
}

interface ShutdownSignals {
  on(event: 'SIGINT' | 'SIGTERM', listener: () => void): unknown;
  off(event: 'SIGINT' | 'SIGTERM', listener: () => void): unknown;
}

// Composition root for a separate process, never imported or started by the HTTP server.
// Caller supplies an approved transport, policies and a dedicated non-superuser DB connection.
export async function runAuthMailProcess(options: {
  database: TransactionalSqlExecutor & { close(): Promise<void> };
  transport: AuthMailTransport;
  delivery: MailWorkerPolicy;
  polling: MailLoopPolicy;
  log(event: MailWorkerEvent): void;
  signals?: ShutdownSignals;
  shutdownGraceMs?: number; // Optional fixture override; operational composition uses 30 s.
}): Promise<void> {
  const signals = options.signals ?? process;
  const stopping = new AbortController();
  const interrupted = new AbortController();
  const deadline = createShutdownDeadline(() => {
    interrupted.abort();
    try { options.log('MAIL_WORKER_SHUTDOWN_TIMEOUT'); } catch {}
  }, options.shutdownGraceMs);
  const stop = () => { stopping.abort(); deadline.start(); };
  signals.on('SIGINT', stop); signals.on('SIGTERM', stop);
  try {
    const lifecycle = async () => {
      try {
        const worker = createAuthMailWorker(createAuthMailRepository(options.database), options.transport, options.delivery);
        await runAuthMailLoop({ runOne: () => worker.runOne(interrupted.signal), signal: stopping.signal, log: options.log }, options.polling);
      } finally { await options.database.close(); }
    };
    await Promise.race([lifecycle(), deadline.expired]);
  } finally {
    signals.off('SIGINT', stop); signals.off('SIGTERM', stop);
    deadline.clear();
    // The supervisor must terminate a process whose adapter ignores cancellation/SQL timeouts.
  }
}

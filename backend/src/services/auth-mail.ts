import { generateAccountToken, hashAccountToken, type AccountTokenKind } from '../security/tokens.js';
import { createAuthMailRepository } from '../repositories/auth-mail.js';
import { AUTH_MAIL } from '../config/auth-mail.js';

export interface AuthMailTransport {
  send(message: { idempotencyKey: string; recipient: string; kind: AccountTokenKind; token: string }, signal: AbortSignal): Promise<'DELIVERED' | 'TEMPORARY' | 'PERMANENT'>;
}
export interface MailWorkerPolicy { leaseMs: number; timeoutMs: number; retryDelaysMs: readonly [number, number] }
export function createAuthMailWorker(repository: ReturnType<typeof createAuthMailRepository>, transport: AuthMailTransport, policy: MailWorkerPolicy) {
  if (!policy || !Number.isSafeInteger(policy.timeoutMs) || policy.timeoutMs <= 0 || !Number.isSafeInteger(policy.leaseMs) || policy.leaseMs <= policy.timeoutMs ||
      !Array.isArray(policy.retryDelaysMs) || policy.retryDelaysMs.length !== 2 || policy.retryDelaysMs.some((n) => !Number.isSafeInteger(n) || n <= 0) || policy.retryDelaysMs[1] <= policy.retryDelaysMs[0]) {
    throw new Error('Mail worker policy must be explicitly configured');
  }
  return {
    async runOne(signal?: AbortSignal): Promise<boolean> {
      const checkInterrupted = () => { if (signal?.aborted) throw new Error('Mail work interrupted'); };
      checkInterrupted();
      const job = await repository.claim(policy.leaseMs);
      if (!job) return false;
      checkInterrupted();
      const token = generateAccountToken();
      const email = await repository.issueDeliveryToken(job, hashAccountToken(token));
      checkInterrupted();
      if (!email) { await repository.finish(job, 'INELIGIBLE', 0); return true; }
      const controller = new AbortController();
      let timer: ReturnType<typeof setTimeout> | undefined;
      let result: 'DELIVERED' | 'TEMPORARY' | 'PERMANENT';
      try {
        result = await Promise.race([
          transport.send({ idempotencyKey: job.id, recipient: email, kind: job.tipo, token }, signal ? AbortSignal.any([signal, controller.signal]) : controller.signal),
          new Promise<'TEMPORARY'>((resolve) => { timer = setTimeout(() => { controller.abort(); resolve('TEMPORARY'); }, policy.timeoutMs); })
        ]);
      } catch { result = 'TEMPORARY'; }
      finally { if (timer) clearTimeout(timer); }
      checkInterrupted(); // Deadline leaves the claim recoverable; no late ACK or new work.
      const delay = result === 'TEMPORARY' && job.tentativas < AUTH_MAIL.maxAttempts ? policy.retryDelaysMs[job.tentativas - 1]! : 0;
      await repository.finish(job, result, delay);
      return true;
    }
  };
}

// The existing Service callback acknowledges the transactional intent; only the worker sends.
export function createDurableAuthDelivery(repository: ReturnType<typeof createAuthMailRepository>) {
  return {
    async queue(_email: string, token: string) {
      if (!await repository.hasIntent(hashAccountToken(token))) throw new Error('Durable auth mail intent missing');
    }
  };
}

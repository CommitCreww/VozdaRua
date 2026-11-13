import type { MailWorkerPolicy } from '../services/auth-mail.js';
import type { MailLoopPolicy } from '../workers/auth-mail.js';
import { OPERATIONAL_TIMEOUTS } from './operational-timeouts.js';

// DT 12.5 / D05, approved 2026-11-13. No unapproved rate quotas here.
export const AUTH_MAIL = Object.freeze({
  maxAttempts: 3,
  retryDelaysMs: Object.freeze([60_000, 300_000] as const),
  historyRetentionMs: 30 * 24 * 60 * 60 * 1000,
  pollMs: 5_000,
  backoffMaxMs: 60_000
});

export function approvedMailPolicies(explicit: { leaseMs?: number; timeoutMs?: number; backoffFactor: number }): {
  delivery: MailWorkerPolicy; polling: MailLoopPolicy;
} {
  const timeoutMs = explicit?.timeoutMs ?? OPERATIONAL_TIMEOUTS.postmarkRequestMs;
  const leaseMs = explicit?.leaseMs ?? OPERATIONAL_TIMEOUTS.mailLeaseMs;
  if (!explicit || !Number.isSafeInteger(timeoutMs) || timeoutMs <= 0 ||
      !Number.isSafeInteger(leaseMs) || leaseMs <= timeoutMs ||
      !Number.isFinite(explicit.backoffFactor) || explicit.backoffFactor <= 1) throw new Error('Mail infrastructure configuration unavailable');
  return {
    delivery: { leaseMs, timeoutMs, retryDelaysMs: AUTH_MAIL.retryDelaysMs },
    polling: { pollMinMs: AUTH_MAIL.pollMs, pollMaxMs: AUTH_MAIL.backoffMaxMs, backoffFactor: explicit.backoffFactor }
  };
}

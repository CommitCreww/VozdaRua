import type { AuthMailSnapshot } from '../repositories/auth-mail.js';

export interface MailAlertPolicy { backlogCount: number; oldestPendingMs: number }
export interface MailAlert { code: 'AUTH_MAIL_FAILED' | 'AUTH_MAIL_BACKLOG'; snapshot: AuthMailSnapshot }

// Level-based signals. The approved collector must configure cadence, grouping and sustained windows.
// No recipients, tokens, payload, provider errors or credentials are passed to the sink.
export function createAuthMailMonitor(source: { operationalSnapshot(): Promise<AuthMailSnapshot> }, policy: MailAlertPolicy,
  emit: (alert: MailAlert) => Promise<void>) {
  if (!policy || !Number.isSafeInteger(policy.backlogCount) || policy.backlogCount <= 0 ||
      !Number.isSafeInteger(policy.oldestPendingMs) || policy.oldestPendingMs <= 0) throw new Error('Mail alert thresholds pending');
  return {
    async check() {
      const raw = await source.operationalSnapshot();
      // Explicit projection prevents accidentally forwarding future sensitive repository fields.
      const snapshot = { pending: raw.pending, processing: raw.processing, failed: raw.failed, oldestPendingMs: raw.oldestPendingMs };
      if (Object.values(snapshot).some((n) => !Number.isFinite(n) || n < 0)) throw new Error('Mail metrics unavailable');
      if (snapshot.failed > 0) await emit({ code: 'AUTH_MAIL_FAILED', snapshot });
      if (snapshot.pending + snapshot.processing >= policy.backlogCount || snapshot.oldestPendingMs >= policy.oldestPendingMs) {
        await emit({ code: 'AUTH_MAIL_BACKLOG', snapshot });
      }
      return snapshot;
    }
  };
}

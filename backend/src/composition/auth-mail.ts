import { approvedMailPolicies, AUTH_MAIL } from '../config/auth-mail.js';
import { createPostmarkTransport, type PostmarkOptions } from '../integrations/postmark.js';
import { purgeAuthMailRecords } from '../repositories/auth-mail.js';
import type { TransactionalSqlExecutor, SqlExecutor } from '../repositories/database.js';
import { runAuthMailProcess } from '../workers/auth-mail.js';

export function composePostmarkWorker(options: {
  database: TransactionalSqlExecutor & { close(): Promise<void> };
  postmark: Omit<PostmarkOptions, 'timeoutMs'> & { timeoutMs?: number };
  leaseMs?: number;
  backoffFactor: number;
  log: Parameters<typeof runAuthMailProcess>[0]['log'];
  signals?: Parameters<typeof runAuthMailProcess>[0]['signals'];
}) {
  const policies = approvedMailPolicies({ leaseMs: options.leaseMs, timeoutMs: options.postmark.timeoutMs, backoffFactor: options.backoffFactor });
  const transport = createPostmarkTransport({ ...options.postmark, timeoutMs: policies.delivery.timeoutMs });
  let running: Promise<void> | undefined;
  // Preparing the root never starts polling, reads environment secrets or sends mail.
  return { policies, run: () => running ??= runAuthMailProcess({ ...options, ...policies, transport }) };
}

// Invoked explicitly with a maintenance executor, never from app startup/HTTP/worker role.
export async function purgeAuthMailHistory(maintenance: SqlExecutor) {
  await purgeAuthMailRecords(maintenance, AUTH_MAIL.historyRetentionMs);
}

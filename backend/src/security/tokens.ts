import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

export type AccountTokenKind = 'EMAIL_VERIFICATION' | 'PASSWORD_RESET';
export const TOKEN_TTL_MS: Record<AccountTokenKind, number> = { EMAIL_VERIFICATION: 24 * 60 * 60 * 1000, PASSWORD_RESET: 30 * 60 * 1000 };

export interface StoredAccountToken {
  kind: AccountTokenKind;
  hash: string;
  expiresAt: Date;
  consumedAt: Date | null;
}

export interface AccountTokenStore {
  // Must atomically consume only an unconsumed, matching, unexpired token.
  consume(hash: string, kind: AccountTokenKind, now: Date): Promise<boolean>;
}

export function generateAccountToken(): string { return randomBytes(32).toString('base64url'); }
export function hashAccountToken(token: string): string { return createHash('sha256').update(token, 'utf8').digest('hex'); }

export function isTokenUsable(record: StoredAccountToken, kind: AccountTokenKind, token: string, now: Date): boolean {
  if (record.kind !== kind || record.consumedAt || !Number.isFinite(now.getTime()) || now >= record.expiresAt) return false;
  if (!/^[0-9a-f]{64}$/.test(record.hash)) return false;
  const candidate = Buffer.from(hashAccountToken(token), 'hex');
  return timingSafeEqual(Buffer.from(record.hash, 'hex'), candidate);
}

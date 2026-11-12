export const SESSION_IDLE_MS = 30 * 60 * 1000;
export const SESSION_ABSOLUTE_MS = 12 * 60 * 60 * 1000;

export interface StoredSession {
  idHash: string;
  accountId: string;
  csrfTokenHash: string;
  createdAt: Date;
  lastActivityAt: Date;
  revokedAt: Date | null;
}

export interface SessionStore {
  findByIdHash(idHash: string): Promise<StoredSession | null>;
  // Atomic conditional update: fail if revoked or either timeout elapsed at update time.
  renewIfActive(idHash: string, now: Date): Promise<StoredSession | null>;
  save(session: StoredSession): Promise<void>;
  revoke(idHash: string, at: Date): Promise<void>;
  revokeOtherSessions(accountId: string, exceptIdHash: string, at: Date): Promise<void>;
  revokeAllForAccount(accountId: string, at: Date): Promise<void>;
  // Replacement must be atomic; old ID must not remain valid.
  replaceId(oldIdHash: string, session: StoredSession): Promise<void>;
}

export interface SessionCsrfContract {
  // Synchronizer value stays server-side; client sends it in a header on authenticated mutations.
  verify(sessionIdHash: string, headerToken: string, origin: string | undefined): Promise<boolean>;
}

export function isSessionValid(session: StoredSession | null, now: Date): boolean {
  if (!session || session.revokedAt || !Number.isFinite(now.getTime())) return false;
  const age = now.getTime() - session.createdAt.getTime();
  const idle = now.getTime() - session.lastActivityAt.getTime();
  return age >= 0 && idle >= 0 && age < SESSION_ABSOLUTE_MS && idle < SESSION_IDLE_MS;
}

export function renewSessionActivity(session: StoredSession, now: Date): StoredSession | null {
  return isSessionValid(session, now) ? { ...session, lastActivityAt: now } : null;
}

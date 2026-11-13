import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { canIssueLocalSession, type CurrentAccount } from '../security/account-access.js';
import { hashPassword, isAllowedPassword, verifyPassword } from '../security/password.js';
import { generateAccountToken, hashAccountToken, TOKEN_TTL_MS } from '../security/tokens.js';
import { isSessionValid, type SessionStore, type StoredSession } from '../security/sessions.js';

export interface LocalAccount extends CurrentAccount {
  email: string;
  passwordHash: string | null;
  emailVerifiedAt: Date | null;
}
export interface AuthRepository {
  findByEmail(email: string): Promise<LocalAccount | null>;
  findById(id: string): Promise<LocalAccount | null>;
  // Atomic account + legal acceptances + hashed token. Delivery durability remains a P06 integration gate.
  register(input: { name: string; email: string; passwordHash: string; termsVersion: string; privacyVersion: string; tokenHash: string; expiresAt: Date }): Promise<boolean>;
  enqueueVerification(email: string, tokenHash: string, expiresAt: Date): Promise<boolean>;
  // Atomic token consumption and account confirmation; false for expired/used/missing token.
  confirmEmail(tokenHash: string, now: Date): Promise<boolean>;
}
export interface AuthRateGate {
  check(action: 'register' | 'resend' | 'login' | 'forgot' | 'reset', origin: string, identity: string): Promise<boolean>;
  recordFailure(action: 'login', origin: string, email: string): Promise<void>;
}
export interface AuthDependencies {
  accounts: AuthRepository;
  sessions: SessionStore;
  rate: AuthRateGate;
  verification: { queue(email: string, token: string): Promise<void> };
  legal: { termsVersion: string; privacyVersion: string };
  now(): Date;
}

const digest = (secret: string) => createHash('sha256').update(secret).digest('hex');
export type AuthResult<T = undefined> = { status: 'ok'; value: T } | { status: 'invalid' | 'limited' | 'unverified' | 'unauthorized' };

export function createAuthService(deps: AuthDependencies) {
  return {
    async register(input: { name: string; email: string; password: string; passwordConfirmation: string; termsAccepted: boolean; privacyAcknowledged: boolean }, origin: string): Promise<AuthResult> {
      if (!await deps.rate.check('register', origin, input.email)) return { status: 'limited' };
      if (!input.termsAccepted || !input.privacyAcknowledged || input.password !== input.passwordConfirmation || !isAllowedPassword(input.password)) return { status: 'invalid' };
      if (!deps.legal.termsVersion || !deps.legal.privacyVersion) return { status: 'invalid' };
      const token = generateAccountToken();
      const created = await deps.accounts.register({ name: input.name, email: input.email, passwordHash: await hashPassword(input.password), termsVersion: deps.legal.termsVersion, privacyVersion: deps.legal.privacyVersion, tokenHash: hashAccountToken(token), expiresAt: new Date(deps.now().getTime() + TOKEN_TTL_MS.EMAIL_VERIFICATION) });
      if (created) await deps.verification.queue(input.email, token);
      return { status: 'ok', value: undefined }; // duplicate account has the same public response
    },
    async resend(email: string, origin: string): Promise<AuthResult> {
      if (!await deps.rate.check('resend', origin, email)) return { status: 'limited' };
      const account = await deps.accounts.findByEmail(email);
      if (account && !canIssueLocalSession(account.emailVerifiedAt)) {
        const token = generateAccountToken();
        if (await deps.accounts.enqueueVerification(email, hashAccountToken(token), new Date(deps.now().getTime() + TOKEN_TTL_MS.EMAIL_VERIFICATION))) {
          await deps.verification.queue(email, token);
        }
      }
      return { status: 'ok', value: undefined };
    },
    async verify(token: string): Promise<AuthResult> {
      if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return { status: 'invalid' };
      return await deps.accounts.confirmEmail(hashAccountToken(token), deps.now()) ? { status: 'ok', value: undefined } : { status: 'invalid' };
    },
    async login(email: string, password: string, origin: string): Promise<AuthResult<{ sessionId: string; csrfToken: string; account: CurrentAccount }>> {
      if (!await deps.rate.check('login', origin, email)) return { status: 'limited' };
      const account = await deps.accounts.findByEmail(email);
      if (!account?.passwordHash || !await verifyPassword(account.passwordHash, password)) {
        await deps.rate.recordFailure('login', origin, email);
        return { status: 'unauthorized' };
      }
      if (!canIssueLocalSession(account.emailVerifiedAt)) return { status: 'unverified' };
      const current = await deps.accounts.findById(account.id);
      if (!current || current.passwordHash !== account.passwordHash || !canIssueLocalSession(current.emailVerifiedAt)) return { status: 'unauthorized' };
      const sessionId = randomBytes(32).toString('base64url');
      const csrfToken = randomBytes(32).toString('base64url');
      const now = deps.now();
      const saved = await deps.sessions.save({ idHash: digest(sessionId), accountId: current.id, csrfTokenHash: digest(csrfToken), createdAt: now, lastActivityAt: now, revokedAt: null }, account.passwordHash);
      if (!saved) return { status: 'unauthorized' };
      return { status: 'ok', value: { sessionId, csrfToken, account: { id: current.id, role: current.role, status: current.status } } };
    },
    async current(sessionId: string): Promise<{ session: StoredSession; account: CurrentAccount } | null> {
      if (!/^[A-Za-z0-9_-]{43}$/.test(sessionId)) return null;
      const stored = await deps.sessions.findByIdHash(digest(sessionId));
      const now = deps.now();
      if (!isSessionValid(stored, now) || !stored) return null;
      const account = await deps.accounts.findById(stored.accountId);
      if (!account || !canIssueLocalSession(account.emailVerifiedAt)) return null;
      const renewed = await deps.sessions.renewIfActive(stored.idHash, now);
      if (!renewed) return null;
      return { session: renewed, account: { id: account.id, role: account.role, status: account.status } };
    },
    async logout(sessionId: string, csrfToken: string, originAllowed: boolean): Promise<AuthResult> {
      const context = await this.current(sessionId);
      if (!context) return { status: 'unauthorized' };
      if (!originAllowed || !/^[A-Za-z0-9_-]{43}$/.test(csrfToken) ||
        !timingSafeEqual(Buffer.from(context.session.csrfTokenHash, 'hex'), Buffer.from(digest(csrfToken), 'hex'))) return { status: 'unauthorized' };
      await deps.sessions.revoke(context.session.idHash, deps.now());
      return { status: 'ok', value: undefined };
    }
  };
}

import { hashPassword, isAllowedPassword } from '../security/password.js';
import { generateAccountToken, hashAccountToken, TOKEN_TTL_MS } from '../security/tokens.js';
import type { AuthRateGate, AuthRepository, AuthResult } from './auth.js';

export interface PasswordRecoveryRepository {
  requestReset(accountId: string, tokenHash: string, expiresAt: Date, now: Date): Promise<boolean>;
  // One transaction: consume valid reset token, change local password, invalidate sibling
  // reset tokens and revoke all sessions. No email confirmation or privilege changes.
  completeReset(tokenHash: string, passwordHash: string, now: Date): Promise<boolean>;
}

export interface PasswordRecoveryDependencies {
  accounts: Pick<AuthRepository, 'findByEmail'>;
  repository: PasswordRecoveryRepository;
  rate: AuthRateGate;
  delivery: { queue(email: string, token: string): Promise<void> };
  now(): Date;
}

export function createPasswordRecoveryService(deps: PasswordRecoveryDependencies) {
  return {
    async forgot(email: string, origin: string): Promise<AuthResult> {
      if (!await deps.rate.check('forgot', origin, email)) return { status: 'limited' };
      const account = await deps.accounts.findByEmail(email);
      if (account?.passwordHash) {
        const token = generateAccountToken();
        const now = deps.now();
        if (await deps.repository.requestReset(account.id, hashAccountToken(token), new Date(now.getTime() + TOKEN_TTL_MS.PASSWORD_RESET), now)) {
          await deps.delivery.queue(email, token);
        }
      }
      return { status: 'ok', value: undefined };
    },
    async reset(input: { token: string; password: string; passwordConfirmation: string }, origin: string): Promise<AuthResult> {
      if (!/^[A-Za-z0-9_-]{43}$/.test(input.token)) return { status: 'invalid' };
      const tokenHash = hashAccountToken(input.token);
      if (!await deps.rate.check('reset', origin, tokenHash)) return { status: 'limited' };
      if (input.password !== input.passwordConfirmation || !isAllowedPassword(input.password)) return { status: 'invalid' };
      const passwordHash = await hashPassword(input.password);
      return await deps.repository.completeReset(tokenHash, passwordHash, deps.now())
        ? { status: 'ok', value: undefined } : { status: 'invalid' };
    }
  };
}

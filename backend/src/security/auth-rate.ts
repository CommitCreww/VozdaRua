import { createHmac } from 'node:crypto';
import type { AuthRateGate } from '../services/auth.js';
import { createAuthRateRepository, type AuthAction, type RateBucket } from '../repositories/auth-rate.js';

export interface AuthRatePolicy {
  origin: { limit: number; windowMs: number };
  identity: { limit: number; windowMs: number };
  session?: { limit: number; windowMs: number };
  failureWindowMs: number;
  cooldownMs: readonly number[];
  quotaCooldownMs?: number;
}
export type AuthRatePolicies = Record<AuthAction, AuthRatePolicy>;

export function validateAuthRateConfiguration(policies: AuthRatePolicies, key: Buffer): void {
  if (!Buffer.isBuffer(key) || key.length < 32) throw new Error('Rate key unavailable');
  for (const action of ['register', 'resend', 'login', 'forgot', 'reset'] as const) {
    const policy = policies?.[action];
    const windows = policy ? [policy.origin, policy.identity, ...(policy.session ? [policy.session] : [])] : [];
    if (!policy || !windows.length || windows.some((w) => !w || !Number.isSafeInteger(w.limit) || w.limit <= 0 || !Number.isSafeInteger(w.windowMs) || w.windowMs <= 0) ||
        !Number.isSafeInteger(policy.failureWindowMs) || policy.failureWindowMs <= 0 || !Array.isArray(policy.cooldownMs) || !policy.cooldownMs.length ||
        policy.cooldownMs.some((n, i) => !Number.isSafeInteger(n) || n <= 0 || n > policy.failureWindowMs || (i > 0 && n < policy.cooldownMs[i - 1]!)) ||
        (policy.quotaCooldownMs !== undefined && (!Number.isSafeInteger(policy.quotaCooldownMs) || policy.quotaCooldownMs <= 0 || policy.quotaCooldownMs > policy.failureWindowMs))) {
      throw new Error('Auth rate policies must be explicitly configured');
    }
  }
}

export function createPersistentAuthRateGate(repository: ReturnType<typeof createAuthRateRepository>, policies: AuthRatePolicies, key: Buffer): AuthRateGate {
  validateAuthRateConfiguration(policies, key);
  const digest = (parts: readonly string[]) => createHmac('sha256', key).update(JSON.stringify(parts)).digest('hex');
  const cooldown = (action: AuthAction, origin: string, identity: string): RateBucket => ({
    action, scope: 'failure', key: digest([action, 'failure', origin, identity]), windowMs: policies[action].failureWindowMs, limit: 1
  });
  return {
    async check(action, origin, identity, session?) {
      const policy = policies[action];
      const buckets: RateBucket[] = [
        { action, scope: 'origin', key: digest([action, 'origin', origin]), ...policy.origin },
        { action, scope: 'identity', key: digest([action, 'identity', identity]), ...policy.identity }
      ];
      if (session) {
        if (!policy.session) throw new Error('Session rate policy unavailable');
        buckets.push({ action, scope: 'session', key: digest([action, 'session', session]), ...policy.session });
      }
      return repository.consume(buckets, cooldown(action, origin, identity), policy.quotaCooldownMs);
    },
    async recordFailure(action, origin, identity) { await repository.failure(cooldown(action, origin, identity), policies[action].cooldownMs); }
  };
}

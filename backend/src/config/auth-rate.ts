import type { AuthRatePolicies, AuthRatePolicy } from '../security/auth-rate.js';

const minute = 60_000;
function policy(originLimit: number, originWindow: number, identityLimit: number, identityWindow: number, cooldownMs: readonly number[], quotaCooldownMs?: number): AuthRatePolicy {
  return Object.freeze({ origin: Object.freeze({ limit: originLimit, windowMs: originWindow }),
    identity: Object.freeze({ limit: identityLimit, windowMs: identityWindow }),
    failureWindowMs: identityWindow, cooldownMs: Object.freeze([...cooldownMs]), quotaCooldownMs });
}

// Approved values, not proposals. No session quota is invented for pre-login endpoints.
export const AUTH_RATE_POLICIES: AuthRatePolicies = Object.freeze({
  login: policy(60, 5 * minute, 10, 15 * minute, [1000, 2000, 4000, 8000, 16000, 30000]),
  register: policy(10, 60 * minute, 3, 60 * minute, [15 * minute], 15 * minute),
  resend: policy(10, 15 * minute, 3, 15 * minute, [5 * minute], 5 * minute),
  forgot: policy(20, 15 * minute, 3, 15 * minute, [5 * minute], 5 * minute),
  reset: policy(30, 15 * minute, 10, 15 * minute, [5 * minute], 5 * minute)
});

import { timingSafeEqual } from 'node:crypto';
import type { CurrentAccount } from '../security/account-access.js';
import { hasAccountCapability } from '../security/account-access.js';
import type { StoredSession } from '../security/sessions.js';
import { hashAccountToken } from '../security/tokens.js';
import type { createProfileRepository } from '../repositories/profile.js';
import type { PrivacyPatch } from '../schemas/profile.js';

export class ProfileError extends Error {
  constructor(readonly statusCode: 401|403|422|503) { super('Profile operation unavailable'); }
}
export interface ProfileDependencies {
  repository: ReturnType<typeof createProfileRepository>;
  session: { current(id: string): Promise<{ account: CurrentAccount; session: StoredSession } | null> };
  origin: string;
  now(): Date;
}
async function safe<T>(work: () => Promise<T>): Promise<T> {
  try { return await work(); } catch (error) { if (error instanceof ProfileError) throw error; throw new ProfileError(503); }
}
export function createProfileService(deps: ProfileDependencies) {
  let origin: URL;
  try { origin = new URL(deps.origin); } catch { throw new Error('Profile origin unavailable'); }
  if (origin.origin!==deps.origin || !['https:','http:'].includes(origin.protocol)) throw new Error('Profile origin unavailable');
  async function context(id: string | undefined) {
    if (!id) throw new ProfileError(401);
    const value = await deps.session.current(id);
    if (!value) throw new ProfileError(401);
    if (!hasAccountCapability(value.account,'READ_VISIBLE')) throw new ProfileError(403);
    return value;
  }
  return {
    async self(sessionId: string | undefined) {
      return safe(async () => {
        const current = await context(sessionId); const result = await deps.repository.self(current.account.id);
        if (!result) throw new ProfileError(401); return result;
      });
    },
    async privacy(sessionId: string | undefined, csrf: unknown, requestOrigin: string | undefined, patch: PrivacyPatch, requestId: string) {
      return safe(async () => {
        const current = await context(sessionId);
        if (!hasAccountCapability(current.account,'CONTRIBUTE') || requestOrigin!==deps.origin || typeof csrf!=='string' || !/^[a-zA-Z0-9_-]{43}$/.test(csrf) ||
            !/^[a-f0-9]{64}$/.test(current.session.csrfTokenHash) || !timingSafeEqual(Buffer.from(current.session.csrfTokenHash,'hex'),Buffer.from(hashAccountToken(csrf),'hex'))) throw new ProfileError(403);
        const result = await deps.repository.updatePrivacy({ accountId: current.account.id,sessionHash: hashAccountToken(sessionId!),csrfHash: hashAccountToken(csrf),patch,now: deps.now,requestId });
        if (result!=='UPDATED') throw new ProfileError(result==='FORBIDDEN' ? 403 : 401);
        return { status: 'updated' as const };
      });
    }
  };
}

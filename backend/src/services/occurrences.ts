import { hasAccountCapability, type CurrentAccount } from '../security/account-access.js';
import type { createOccurrenceReadRepository } from '../repositories/occurrences.js';
import type { NearbyQuery, ReadPagination } from '../schemas/occurrences.js';
import type { OccurrenceDetail, OccurrenceSummary, OfficialChannel, ReadPage } from '../dtos/occurrences.js';
import { MAX_NEARBY_RADIUS_METERS } from '../schemas/occurrences.js';

export interface MunicipalArea { geoJson: string; source: string; version: string }
export interface MunicipalAreaSource { load(): Promise<MunicipalArea | null> }
export class OccurrenceReadError extends Error {
  constructor(readonly statusCode: 401 | 403 | 404 | 422 | 503) { super('Occurrence read unavailable'); }
}
export interface OccurrenceReadDependencies {
  repository: ReturnType<typeof createOccurrenceReadRepository>;
  session: { current(id: string): Promise<{ account: CurrentAccount } | null> };
  area: MunicipalAreaSource;
}
const page = <T>(rows: T[], paging: ReadPagination): ReadPage<T> => ({ items: rows.slice(0,paging.size), page: paging.page, size: paging.size, hasMore: rows.length > paging.size });
function channelDTO(value: OfficialChannel | null): OfficialChannel | null {
  if (!value) return null;
  if (value.url !== null) {
    let url: URL;
    try { url = new URL(value.url); } catch { throw new OccurrenceReadError(503); }
    if (!['http:','https:'].includes(url.protocol) || url.username || url.password) throw new OccurrenceReadError(503);
  }
  return { id: value.id, name: value.name, type: value.type, url: value.url, phone: value.phone, email: value.email,
    instructions: value.instructions, categoryInstructions: value.categoryInstructions, requiresGovBr: value.requiresGovBr,
    organization: { id: value.organization.id, name: value.organization.name, type: value.organization.type } };
}
function safeSummary<T extends OccurrenceSummary>(value: T): T {
  return { ...value, officialChannel: channelDTO(value.officialChannel) };
}
async function dependency<T>(operation: () => Promise<T>): Promise<T> {
  try { return await operation(); } catch (error) {
    if (error instanceof OccurrenceReadError) throw error;
    throw new OccurrenceReadError(503); // No SQL, area coordinates, provider data or original exception in logs/HTTP.
  }
}
export function createOccurrenceReadService(deps: OccurrenceReadDependencies) {
  async function area() {
    const value = await deps.area.load();
    if (!value?.source || !value.version || !value.geoJson) throw new OccurrenceReadError(503);
    let geometry: unknown;
    try { geometry = JSON.parse(value.geoJson); } catch { throw new OccurrenceReadError(503); }
    if (!geometry || typeof geometry !== 'object' || !('type' in geometry) || geometry.type !== 'MultiPolygon') throw new OccurrenceReadError(503);
    return value.geoJson;
  }
  async function visibleDetail(id: string): Promise<OccurrenceDetail> {
    const row = await deps.repository.detail(id);
    if (!row) throw new OccurrenceReadError(404);
    const boundary = await area();
    const covered = await deps.repository.covers(boundary,row.location.lat,row.location.lng);
    if (!covered?.valid) throw new OccurrenceReadError(503);
    if (!covered.inside) throw new OccurrenceReadError(404);
    return safeSummary(row);
  }
  return {
    async authorize(sessionId: string | undefined) {
      if (!sessionId) throw new OccurrenceReadError(401);
      const context = await dependency(() => deps.session.current(sessionId));
      if (!context) throw new OccurrenceReadError(401);
      if (!hasAccountCapability(context.account,'READ_VISIBLE')) throw new OccurrenceReadError(403);
    },
    async nearby(query: NearbyQuery) {
      return dependency(async () => {
        const boundary = await area();
        const covered = await deps.repository.covers(boundary,query.lat,query.lng);
        if (!covered?.valid) throw new OccurrenceReadError(503);
        if (!covered.inside) throw new OccurrenceReadError(422);
        return page((await deps.repository.nearby({ ...query,radius: Math.min(query.radius,MAX_NEARBY_RADIUS_METERS) },boundary)).map(safeSummary),query);
      });
    },
    async detail(id: string) { return dependency(() => visibleDetail(id)); },
    async reports(id: string, paging: ReadPagination) {
      return dependency(async () => { await visibleDetail(id); return page(await deps.repository.reports(id,paging),paging); });
    },
    async history(id: string, paging: ReadPagination) {
      return dependency(async () => { await visibleDetail(id); return page(await deps.repository.history(id,paging),paging); });
    },
    async officialChannel(id: string) {
      return dependency(async () => {
        const row = await visibleDetail(id);
        return row.officialChannel ? { channel: row.officialChannel } : { channel: null, message: 'Canal oficial ainda não cadastrado' };
      });
    }
  };
}

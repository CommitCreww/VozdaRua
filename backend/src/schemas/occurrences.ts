import { objectWithKeys } from './auth.js';

export interface OccurrencePaginationPolicy { maxPageSize: number; maxOffset: number }
export interface ReadPagination { page: number; size: number; offset: number }
export interface NearbyQuery extends ReadPagination { lat: number; lng: number; radius: number; category?: string; status?: string }
export const OCCURRENCE_STATUS_CODES = ['PENDENTE_VALIDACAO','VALIDADA','ENCAMINHADA','EM_ANALISE','EM_RESOLUCAO','RESOLVIDA','REJEITADA','DUPLICADA','ARQUIVADA','REABERTA'] as const;
export const MAX_NEARBY_RADIUS_METERS = 3000;
export function occurrenceId(value: unknown): string | null {
  return typeof value === 'string' && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value) ? value : null;
}
export function validateOccurrencePaginationPolicy(policy: OccurrencePaginationPolicy) {
  if (!policy || !Number.isSafeInteger(policy.maxPageSize) || policy.maxPageSize <= 0 || policy.maxPageSize >= Number.MAX_SAFE_INTEGER ||
      !Number.isSafeInteger(policy.maxOffset) || policy.maxOffset < 0) throw new Error('Occurrence pagination policy unavailable');
}
const positiveInteger = (value: unknown) => typeof value === 'string' && /^[1-9][0-9]*$/.test(value) && Number.isSafeInteger(Number(value)) ? Number(value) : null;
function pagination(query: Record<string, unknown>, policy: OccurrencePaginationPolicy): ReadPagination | null {
  const page = positiveInteger(query.page); const size = positiveInteger(query.size);
  if (!page || !size || size > policy.maxPageSize) return null;
  const offset = (page - 1) * size;
  return Number.isSafeInteger(offset) && offset <= policy.maxOffset ? { page, size, offset } : null;
}
export function occurrencePagination(value: unknown, policy: OccurrencePaginationPolicy): ReadPagination | null {
  const query = objectWithKeys(value, ['page','size']);
  return query ? pagination(query, policy) : null;
}
const decimal = (value: unknown) => typeof value === 'string' && /^-?(?:[0-9]+(?:\.[0-9]+)?|\.[0-9]+)$/.test(value) && Number.isFinite(Number(value)) ? Number(value) : null;
export function nearbyQuery(value: unknown, policy: OccurrencePaginationPolicy): NearbyQuery | null {
  const query = objectWithKeys(value, ['lat','lng','radius','category','status','page','size']);
  if (!query) return null;
  const paging = pagination(query, policy); const lat = decimal(query.lat); const lng = decimal(query.lng); const radius = decimal(query.radius);
  if (!paging || lat === null || lat < -90 || lat > 90 || lng === null || lng < -180 || lng > 180 || radius === null || radius <= 0 ||
      (query.category !== undefined && !occurrenceId(query.category)) ||
      (query.status !== undefined && (typeof query.status !== 'string' || !OCCURRENCE_STATUS_CODES.some((s) => s === query.status)))) return null;
  return { ...paging, lat, lng, radius: Math.min(radius, MAX_NEARBY_RADIUS_METERS),
    ...(query.category !== undefined ? { category: query.category as string } : {}), ...(query.status !== undefined ? { status: query.status as string } : {}) };
}
export function emptyOccurrenceQuery(value: unknown) { return objectWithKeys(value, []) !== null; }

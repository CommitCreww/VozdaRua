import { randomUUID } from 'node:crypto';
import cookie from '@fastify/cookie';
import { describe, expect, it, vi } from 'vitest';
import { buildApp } from '../src/app.js';
import { readConfig } from '../src/config/index.js';
import { nearbyQuery, occurrencePagination, validateOccurrencePaginationPolicy } from '../src/schemas/occurrences.js';
import { mountExperimentalOccurrenceReads } from '../src/composition/occurrences.js';
import type { OccurrenceReadDependencies } from '../src/services/occurrences.js';
import type { OccurrenceDetail } from '../src/dtos/occurrences.js';

const policy = { maxPageSize: 2, maxOffset: 10 }; // Fixture, not an approved operational page-size limit.
const query = { lat: '-23.55', lng: '-46.63', radius: '3000', page: '1', size: '2' };
const area = { geoJson: JSON.stringify({ type: 'MultiPolygon', coordinates: [] }), source: 'synthetic-only', version: 'test-only' };
function dependencies(): OccurrenceReadDependencies {
  return { repository: { covers: vi.fn(async () => ({ valid: true, inside: true })), nearby: vi.fn(async () => []), detail: vi.fn(async () => null),
    reports: vi.fn(async () => []), history: vi.fn(async () => []) },
    session: { current: vi.fn(async () => ({ account: { id: randomUUID(), role: 'CIDADAO' as const, status: 'ATIVO' as const } })) },
    area: { load: vi.fn(async () => area) } };
}
async function http(deps = dependencies()) {
  const config = readConfig({ APP_ENV: 'test' }); const app = buildApp(config); app.register(cookie);
  mountExperimentalOccurrenceReads(app,config,deps,policy); await app.ready(); return app;
}
describe('P12 schemas and closed HTTP contract', () => {
  it('requires explicit pagination bounds and clamps radius to 3000 m', () => {
    expect(() => validateOccurrencePaginationPolicy(undefined!)).toThrow('policy unavailable');
    expect(() => validateOccurrencePaginationPolicy({ maxPageSize: 0, maxOffset: 1 })).toThrow();
    expect(nearbyQuery({ ...query, radius: '9000' },policy)?.radius).toBe(3000);
    expect(occurrencePagination({ page: '2', size: '2' },policy)).toEqual({ page: 2, size: 2, offset: 2 });
  });
  it.each([{ lat: 'NaN' },{ lng: '181' },{ lat: '-91' },{ radius: '0' },{ radius: '-1' },{ radius: 'Infinity' },{ size: '3' },{ page: '0' },{ page: '1.2' },{ page: '99' },{ size: ['1','2'] },{ category: "' OR TRUE --" },{ status: 'INVALID' },{ sort: 'updatedAt' }])('rejects invalid/unknown filters %j', (invalid) => {
    expect(nearbyQuery({ ...query,...invalid },policy)).toBeNull();
  });
  it('requires page/size rather than inventing defaults', () => {
    expect(nearbyQuery({ lat: '-23', lng: '-46', radius: '1000' },policy)).toBeNull();
    expect(occurrencePagination({ page: '1', size: '1', unknown: 'x' },policy)).toBeNull();
  });
  it('does not load occurrence data without a session', async () => {
    const deps = dependencies(); const app = await http(deps);
    try {
      const response = await app.inject({ method: 'GET', url: '/api/v1/occurrences/nearby?'+new URLSearchParams(query).toString() });
      expect(response.statusCode).toBe(401); expect(deps.session.current).not.toHaveBeenCalled(); expect(deps.repository.nearby).not.toHaveBeenCalled();
      expect(response.headers['cache-control']).toBe('private, no-store');
    } finally { await app.close(); }
  });
  it('revalidates session and refuses invalid context before querying', async () => {
    const deps = dependencies(); deps.session.current = vi.fn(async () => null); const app = await http(deps);
    try { expect((await app.inject({ method: 'GET', url: `/api/v1/occurrences/${randomUUID()}`, headers: { cookie: 'vdr_session=synthetic' } })).statusCode).toBe(401); expect(deps.repository.detail).not.toHaveBeenCalled(); }
    finally { await app.close(); }
  });
  it('allows BANIDO/ADMIN only the same visible read projection', async () => {
    const deps = dependencies(); deps.session.current = vi.fn(async () => ({ account: { id: randomUUID(), role: 'ADMIN' as const, status: 'BANIDO' as const } })); const app = await http(deps);
    try { expect((await app.inject({ method: 'GET', url: '/api/v1/occurrences/nearby?'+new URLSearchParams(query), headers: { cookie: 'vdr_session=synthetic' } })).statusCode).toBe(200); }
    finally { await app.close(); }
  });
  it.each(['source','repository','session'] as const)('sanitizes %s failure without logging/returning original SQL or secrets', async (failure) => {
    const deps = dependencies(); const fail = async (): Promise<never> => { throw new Error('SQL password=private cookie=secret coordinates=private'); };
    if (failure === 'source') deps.area.load = fail;
    if (failure === 'repository') deps.repository.nearby = fail;
    if (failure === 'session') deps.session.current = fail;
    const app = await http(deps);
    try {
      const response = await app.inject({ method: 'GET', url: '/api/v1/occurrences/nearby?'+new URLSearchParams(query), headers: { cookie: 'vdr_session=synthetic' } });
      expect(response.statusCode).toBe(503); expect(response.body).not.toMatch(/SQL|password|cookie|secret|coordinates/); expect(response.json().requestId).toBeTruthy();
    } finally { await app.close(); }
  });
  it('fails closed without an area source and rejects outside coverage', async () => {
    const deps = dependencies(); deps.area.load = vi.fn(async () => null); const app = await http(deps);
    const request = { method: 'GET' as const, url: '/api/v1/occurrences/nearby?'+new URLSearchParams(query), headers: { cookie: 'vdr_session=synthetic' } };
    try {
      expect((await app.inject(request)).statusCode).toBe(503); expect(deps.repository.nearby).not.toHaveBeenCalled();
      deps.area.load = vi.fn(async () => area); deps.repository.covers = vi.fn(async () => ({ valid: true, inside: false }));
      expect((await app.inject(request)).statusCode).toBe(422); expect(deps.repository.nearby).not.toHaveBeenCalled();
    } finally { await app.close(); }
  });
  it('rejects invalid UUID, extraneous params and duplicate query keys without SQL', async () => {
    const deps = dependencies(); const app = await http(deps);
    try {
      for (const url of ['/api/v1/occurrences/bad',`/api/v1/occurrences/${randomUUID()}?unexpected=true`,'/api/v1/occurrences/nearby?'+new URLSearchParams(query)+'&size=1']) {
        expect((await app.inject({ method: 'GET', url, headers: { cookie: 'vdr_session=synthetic' } })).statusCode).toBe(422);
      }
      expect(deps.repository.detail).not.toHaveBeenCalled(); expect(deps.repository.nearby).not.toHaveBeenCalled();
    } finally { await app.close(); }
  });
  it('does not return an unsafe configured official URL', async () => {
    const deps = dependencies();
    deps.repository.detail = vi.fn(async () => ({ id: randomUUID(), location: { lat: -23.55,lng: -46.63 }, officialChannel: { url: 'javascript:private' } } as OccurrenceDetail));
    const app = await http(deps);
    try {
      const response = await app.inject({ method: 'GET', url: `/api/v1/occurrences/${randomUUID()}/official-channel`, headers: { cookie: 'vdr_session=synthetic' } });
      expect(response.statusCode).toBe(503); expect(response.body).not.toContain('javascript');
    } finally { await app.close(); }
  });
  it.each(['development','staging','production'] as const)('blocks mounting in %s', async (appEnv) => {
    const config = readConfig({ APP_ENV: appEnv }); const app = buildApp(config);
    try { expect(() => mountExperimentalOccurrenceReads(app,config,dependencies(),policy)).toThrow('mounting blocked'); }
    finally { await app.close(); }
  });
});

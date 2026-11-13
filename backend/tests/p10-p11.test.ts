import { createHash, randomUUID } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { privacyBody } from '../src/schemas/profile.js';
import { createMunicipalAreaRepository } from '../src/repositories/municipal-area.js';
import { stageMunicipalArea } from '../src/services/municipal-area.js';
import { createOccurrenceCatalog } from '../src/repositories/catalog.js';
import type { TransactionalSqlExecutor } from '../src/repositories/database.js';
import { mountExperimentalProfile } from '../src/composition/profile.js';
import type { ProfileDependencies } from '../src/services/profile.js';
import { buildApp } from '../src/app.js';
import { readConfig } from '../src/config/index.js';
import { syntheticArtifact } from './fixtures/municipal-area.js';
import { chooseExperimentSubnet,rangesOverlap } from './integration/experiment-network.js';
describe('P10/P11 local contracts, not a geographic proof', () => {
  it('allocates a new private subnet without deleting or overlapping Docker/host networks',()=>{
    expect(rangesOverlap('10.253.0.0/28','10.253.0.8/32')).toBe(true);expect(rangesOverlap('10.253.0.0/28','10.253.0.16/28')).toBe(false);
    expect(chooseExperimentSubnet(['0.0.0.0/0','192.168.15.0/24','172.17.0.0/16','10.253.0.0/28'])).toBe('10.253.0.16/28');
    expect(()=>chooseExperimentSubnet(['10.0.0.0/8'])).toThrow('No isolated');
    expect(()=>chooseExperimentSubnet(['invalid'])).toThrow('Invalid');
  });
  it.each([{},null,[],{ perfil_publico:'true' },{ exibir_nome_nos_relatos:1 },{ papel:'ADMIN' },{ status:'ATIVO' },{ id:randomUUID(),perfil_publico:true },{ email:'other@example.test' }])('refuses invalid or mass-assignment privacy payload %j', (payload) => {
    expect(privacyBody(payload)).toBeNull();
  });
  it('accepts only explicit privacy booleans, including false', () => {
    expect(privacyBody({ perfil_publico:false })).toEqual({ perfil_publico:false });
    expect(privacyBody({ perfil_publico:true,exibir_nome_nos_relatos:false })).toEqual({ perfil_publico:true,exibir_nome_nos_relatos:false });
  });
  it('stages only an artifact with coherent hash and provenance, without activating or downloading', async () => {
    const id = randomUUID(); const stage = vi.fn(async () => id); const artifact = syntheticArtifact();
    expect(await stageMunicipalArea({ stage },artifact)).toBe(id); expect(stage).toHaveBeenCalledExactlyOnceWith(artifact);
  });
  it.each([{ sha256:'0'.repeat(64) },{ sourceUrl:'http://fixture.example.test/' },{ sourceUrl:'https://user:secret@fixture.example.test/' },{ sourceSrid:0 },{ license:'' },{ version:'' }])('refuses invalid provenance %j before SQL', async (invalid) => {
    const stage = vi.fn(); await expect(stageMunicipalArea({ stage },syntheticArtifact(invalid))).rejects.toThrow('configuration invalid'); expect(stage).not.toHaveBeenCalled();
  });
  it('does not guess feature extraction or CRS from unvalidated GeoJSON', async () => {
    for (const geometry of [{ type:'FeatureCollection',features:[] },{ type:'Point',coordinates:[0,0] },{ type:'Polygon',coordinates:[],crs:{ type:'name',properties:{ name:'unknown' } } }]) {
      const geoJson = JSON.stringify(geometry); const stage = vi.fn();
      await expect(stageMunicipalArea({ stage },syntheticArtifact({ geoJson,sha256:createHash('sha256').update(geoJson).digest('hex') }))).rejects.toThrow('configuration invalid');
      expect(stage).not.toHaveBeenCalled();
    }
  });
  it('minimizes a database staging exception', async () => {
    await expect(stageMunicipalArea({ async stage() { throw new Error('SQL password=private'); } },syntheticArtifact())).rejects.toThrow('Municipal staging failed');
  });
  it.each([4326,4674])('rejects invalid geographic coordinate ranges in CRS %i before SQL',async(sourceSrid)=>{
    for(const ring of [
      [[-46,91],[-45,91],[-45,92],[-46,92],[-46,91]],
      [[181,-23],[182,-23],[182,-22],[181,-22],[181,-23]],
      [[330000,7390000],[331000,7390000],[331000,7391000],[330000,7391000],[330000,7390000]]
    ]){
      const geoJson=JSON.stringify({type:'Polygon',coordinates:[ring]});const stage=vi.fn();
      await expect(stageMunicipalArea({stage},syntheticArtifact({sourceSrid,geoJson,sha256:createHash('sha256').update(geoJson).digest('hex')}))).rejects.toThrow('configuration invalid');
      expect(stage).not.toHaveBeenCalled();
    }
  });
  it('requires finite 2D coordinate pairs and preserves projected input for PostGIS transformation',async()=>{
    for(const coordinates of [null,[],[[[0,0,1],[1,0,1],[1,1,1],[0,0,1]]],[[[0,0],['1',0],[1,1],[0,0]]]]){
      const geoJson=JSON.stringify({type:'Polygon',coordinates});const stage=vi.fn();
      await expect(stageMunicipalArea({stage},syntheticArtifact({geoJson,sha256:createHash('sha256').update(geoJson).digest('hex')}))).rejects.toThrow('configuration invalid');expect(stage).not.toHaveBeenCalled();
    }
    const geoJson=JSON.stringify({type:'Polygon',coordinates:[[[330000,7390000],[331000,7390000],[331000,7391000],[330000,7391000],[330000,7390000]]]});
    const stage=vi.fn(async()=>randomUUID());const artifact=syntheticArtifact({sourceSrid:31983,geoJson,sha256:createHash('sha256').update(geoJson).digest('hex')});
    await stageMunicipalArea({stage},artifact);expect(stage).toHaveBeenCalledExactlyOnceWith(artifact);
  });
  it.each(['development','staging','production'])('blocks experimental profile/area roots in %s', async (appEnv) => {
    const config = readConfig({ APP_ENV:appEnv }); const app = buildApp(config);
    try { expect(() => mountExperimentalProfile(app,config,{} as ProfileDependencies)).toThrow('mounting blocked'); }
    finally { await app.close(); }
    expect(() => createMunicipalAreaRepository({} as TransactionalSqlExecutor).experimentalSource(appEnv,randomUUID())).toThrow('access blocked');
  });
  it('keeps catalog reference queries bounded without inventing operational page limits', async () => {
    const query = vi.fn(async (_sql:string,_values?:readonly unknown[]) => []);
    const catalog = createOccurrenceCatalog({ query },{ maxPageSize:2,maxOffset:10 });
    await expect(catalog.categories({ page:1,size:3,offset:0 })).rejects.toThrow('pagination'); expect(query).not.toHaveBeenCalled();
    await catalog.subcategories(randomUUID(),{ page:1,size:2,offset:0 }); expect(query.mock.calls[0]?.[1]).toHaveLength(3);
  });
});

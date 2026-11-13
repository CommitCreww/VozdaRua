import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { describe, it, expect } from 'vitest';
import type { Pool } from 'pg';
import type { TransactionalSqlExecutor, createDatabase } from '../../src/repositories/database.js';
import { prepareUrbisArtifact } from '../../src/services/municipal-artifact.js';
import { stageMunicipalArea } from '../../src/services/municipal-area.js';
import { createMunicipalAreaRepository } from '../../src/repositories/municipal-area.js';
import { experimental, recordExperiment } from './local-experiment.js';

export function municipalOfficialCases(fixture: { database(): ReturnType<typeof createDatabase>; admin(): Pool }) {
  describe('D-GEO-01 recurso oficial inválido deve falhar fechado', () => {
    const original = readFileSync(new URL('../../../geography/urbis/2026-09-05/limites_municipais.original.geojson', import.meta.url));
    const artifact = prepareUrbisArtifact(original);
    const maintenance: TransactionalSqlExecutor = {
      async query<Row>(sql: string, values?: readonly unknown[]) { return (await fixture.admin().query(sql, values ? [...values] : undefined)).rows as Row[]; },
      async transaction(work) {
        const client = await fixture.admin().connect();
        try {
          await client.query('BEGIN');
          const result = await work({ async query<Row>(sql: string, values?: readonly unknown[]) { return (await client.query(sql, values ? [...values] : undefined)).rows as Row[]; } });
          await client.query('COMMIT'); return result;
        } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
      }
    };
    it('identifica defeito topológico real, componentes degenerados e orientação sem reparar', async () => {
      const diagnostic = await fixture.database().query<{ valid: boolean; reason: string; empty: boolean; points: number; rings: number }>(`WITH a AS(SELECT ST_SetSRID(ST_GeomFromGeoJSON($1),31983) AS g)
        SELECT ST_IsValid(g) AS valid,ST_IsValidReason(g) AS reason,ST_IsEmpty(g) AS empty,ST_NPoints(g) AS points,
        ST_NRings(g) AS rings,ST_IsPolygonCCW(g) AS ccw,ST_IsPolygonCW(g) AS cw,
        ST_AsText((ST_IsValidDetail(g)).location) AS error_location,ST_AsText(ST_Envelope(g)) AS envelope FROM a`, [artifact.geoJson]);
      expect(diagnostic[0]).toMatchObject({ valid:false,empty:false,points:21334,rings:347 });
      expect(diagnostic[0]!.reason).toContain('Too few points');
      const degenerate = await fixture.database().query(`SELECT r.path[1] AS ring,ST_NPoints(r.geom) AS points,
        (SELECT count(DISTINCT ST_AsEWKB(p.geom))::integer FROM ST_DumpPoints(r.geom) p) AS distinct_points,ST_AsText(ST_Envelope(r.geom)) AS envelope
        FROM ST_DumpRings(ST_SetSRID(ST_GeomFromGeoJSON($1),31983)) r WHERE NOT ST_IsValid(r.geom) ORDER BY r.path`, [artifact.geoJson]);
      expect(degenerate.length).toBeGreaterThanOrEqual(10);
      if (experimental) recordExperiment('municipalOriginalDiagnostic',{ originalSha256:createHash('sha256').update(original).digest('hex'),geometrySha256:artifact.sha256,diagnostic,invalidRings:degenerate });
    });
    it('transformação explícita 31983→4326 preserva o defeito e não autoriza importação', async () => {
      const stats = await fixture.database().query<{ srid:number; valid:boolean; points:number }>(`WITH a AS(SELECT ST_Transform(ST_SetSRID(ST_GeomFromGeoJSON($1),31983),4326) AS g)
        SELECT ST_SRID(g) AS srid,ST_IsValid(g) AS valid,ST_IsValidReason(g) AS reason,ST_NPoints(g) AS points,
        ST_AsText(ST_Envelope(g)) AS envelope FROM a`,[artifact.geoJson]);
      expect(stats[0]).toMatchObject({srid:4326,valid:false,points:21334});
      if(experimental)recordExperiment('municipalTransformedDiagnostic',stats);
    });
    it('importação e reexecuções concorrentes rejeitam o recurso sem inserir, sobrescrever ou ativar versão',async()=>{
      const repository=createMunicipalAreaRepository(maintenance);
      const before=await fixture.database().query('SELECT id,artefato_sha256,ativo,aprovada FROM areas_municipais ORDER BY id');
      await expect(stageMunicipalArea(repository,artifact)).rejects.toThrow('Municipal staging failed');
      const repeated=await Promise.allSettled([stageMunicipalArea(repository,artifact),stageMunicipalArea(repository,artifact)]);
      expect(repeated.every((result)=>result.status==='rejected')).toBe(true);
      expect(await fixture.database().query('SELECT id FROM areas_municipais WHERE fonte_url=$1 AND versao=$2',[artifact.sourceUrl,artifact.version])).toHaveLength(0);
      expect(await fixture.database().query('SELECT id,artefato_sha256,ativo,aprovada FROM areas_municipais ORDER BY id')).toEqual(before);
      expect(await createMunicipalAreaRepository(fixture.database()).source().load()).toBeNull();
      if(experimental)recordExperiment('municipalImportRejected',{attempts:3,inserted:0,activated:0,previousVersionsUnchanged:true});
    },15000);
    it('coordenadas inválidas continuam sendo rejeitadas antes da persistência',async()=>{
      const geoJson=JSON.stringify({type:'Polygon',coordinates:[[[181,91],[182,91],[182,92],[181,91]]]});
      await expect(stageMunicipalArea(createMunicipalAreaRepository(maintenance),{...artifact,sourceSrid:4326,geoJson,sha256:createHash('sha256').update(geoJson).digest('hex')})).rejects.toThrow('configuration invalid');
    });
    it.skipIf(!process.env.GEO_IBGE_REFERENCE)('confere IBGE 2025 e distância dos contornos exteriores, sem produzir autoridade substituta',async()=>{
      const ibge=readFileSync(process.env.GEO_IBGE_REFERENCE!,'utf8');
      expect(createHash('sha256').update(ibge).digest('hex')).toBe('b42d7d5ac363b49cc854e7c0eb5ab8a1268c5f55faf0d314a110d4ed82dba7d6');
      // No overlay/area comparison of the invalid municipal polygon: exterior-line diagnostics only.
      const comparison=await fixture.database().query<{municipal_valid:boolean;ibge_valid:boolean;sampled_max_distance_m:number}>(`WITH a AS MATERIALIZED(SELECT
        ST_SetSRID(ST_GeomFromGeoJSON($1),31983) AS municipal,ST_Transform(ST_SetSRID(ST_GeomFromGeoJSON($2),4674),31983) AS ibge),
        lines AS MATERIALIZED(SELECT ST_ExteriorRing(municipal) AS m,ST_ExteriorRing(ibge) AS i FROM a),
        samples AS(SELECT ST_Distance(ST_LineInterpolatePoint(m,n/100.0),i) AS meters FROM lines CROSS JOIN generate_series(0,100) n
          UNION ALL SELECT ST_Distance(ST_LineInterpolatePoint(i,n/100.0),m) FROM lines CROSS JOIN generate_series(0,100) n)
        SELECT ST_IsValid(municipal) AS municipal_valid,ST_IsValid(ibge) AS ibge_valid,ST_NPoints(ibge) AS ibge_points,
        ST_Area(ibge)/1e6 AS ibge_projected_km2,
        (SELECT max(meters) FROM samples) AS sampled_max_distance_m,
        ST_AsText(ST_Envelope(municipal)) AS municipal_envelope,ST_AsText(ST_Envelope(ibge)) AS ibge_envelope FROM a`,[artifact.geoJson,ibge]);
      expect(comparison[0]).toMatchObject({municipal_valid:false,ibge_valid:true,ibge_points:21308});
      expect(Number.isFinite(comparison[0]!.sampled_max_distance_m)).toBe(true);
      if(experimental)recordExperiment('municipalIbgeComparison',{method:'101 equally spaced samples per exterior, both directions, nearest-line distance in EPSG:31983; lower-bound diagnostic only, not Hausdorff or territorial equivalence; no invalid-polygon overlay',comparison});
    },30000);
    it.skip('interior/exterior, vizinhança e fronteira exata com autoridade municipal válida — bloqueado pela topologia');
    it.skip('consultas de ocorrências e limite de 3 km com fonte municipal real — bloqueado pela importação');
    it.skip('idempotência de importação bem-sucedida e geometria persistente após restart — nenhuma versão oficial válida inserida');
  });
}

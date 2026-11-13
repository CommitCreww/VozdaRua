import type { TransactionalSqlExecutor } from './database.js';
import type { MunicipalAreaSource } from '../services/occurrences.js';

export interface AreaArtifact {
  name: string; municipalityCode: '3550308'; sourceUrl: string; version: string; license: string; licenseUrl: string;
  sourceSrid: number; sha256: string; geoJson: string; synthetic: boolean;
}
const converted = 'ST_Multi(ST_Transform(ST_SetSRID(ST_GeomFromGeoJSON($1),$2),4326))';
export function createMunicipalAreaRepository(database: TransactionalSqlExecutor) {
  return {
    async stage(artifact: AreaArtifact) {
      return database.transaction(async (sql) => {
        const [valid] = await sql.query<{ valid: boolean }>(`SELECT GeometryType(g)='MULTIPOLYGON' AND ST_IsValid(g) AND NOT ST_IsEmpty(g) AND ST_NDims(g)=2
          AND ST_XMin(Box3D(g))>=-180 AND ST_XMax(Box3D(g))<=180 AND ST_YMin(Box3D(g))>=-90 AND ST_YMax(Box3D(g))<=90 AS valid
          FROM(SELECT ${converted} AS g) a`,[artifact.geoJson,artifact.sourceSrid]);
        if (!valid?.valid) throw new Error('Invalid municipal geometry');
        const [row] = await sql.query<{ id: string }>(`INSERT INTO areas_municipais(nome,codigo_oficial,fonte_url,versao,licenca,licenca_url,srid_origem,artefato_sha256,geometria,sintetica)
          VALUES($3,$4,$5,$6,$7,$8,$2,$9,${converted},$10) ON CONFLICT(codigo_oficial,fonte_url,versao) DO NOTHING RETURNING id`,
        [artifact.geoJson,artifact.sourceSrid,artifact.name,artifact.municipalityCode,artifact.sourceUrl,artifact.version,artifact.license,artifact.licenseUrl,artifact.sha256,artifact.synthetic]);
        if (row) return row.id;
        const [existing] = await sql.query<{ id: string; hash: string; srid: number; license: string; license_url: string; synthetic: boolean }>(
          `SELECT id,artefato_sha256 AS hash,srid_origem AS srid,licenca AS license,licenca_url AS license_url,sintetica AS synthetic
            FROM areas_municipais WHERE codigo_oficial=$1 AND fonte_url=$2 AND versao=$3`,[artifact.municipalityCode,artifact.sourceUrl,artifact.version]);
        if (!existing || existing.hash!==artifact.sha256 || existing.srid!==artifact.sourceSrid || existing.license!==artifact.license || existing.license_url!==artifact.licenseUrl || existing.synthetic!==artifact.synthetic) throw new Error('Municipal area version conflict');
        return existing.id;
      });
    },
    source(): MunicipalAreaSource {
      return { async load() {
        const [row] = await database.query<{ geoJson: string; source: string; version: string }>(`SELECT ST_AsGeoJSON(geometria,17) AS "geoJson",fonte_url AS source,versao AS version
          FROM areas_municipais WHERE codigo_oficial='3550308' AND ativo AND aprovada AND NOT sintetica`);
        return row ?? null;
      } };
    },
    experimentalSource(appEnv: string, id: string): MunicipalAreaSource {
      if (appEnv!=='test') throw new Error('Experimental area access blocked');
      return { async load() {
        const [row] = await database.query<{ geoJson: string; source: string; version: string }>(`SELECT ST_AsGeoJSON(geometria,17) AS "geoJson",fonte_url AS source,versao AS version
          FROM areas_municipais WHERE id=$1 AND NOT ativo`,[id]);
        return row ?? null;
      } };
    }
  };
}

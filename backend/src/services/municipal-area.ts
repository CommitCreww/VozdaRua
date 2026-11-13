import { createHash } from 'node:crypto';
import type { AreaArtifact, createMunicipalAreaRepository } from '../repositories/municipal-area.js';

function https(value: string) {
  try { const url = new URL(value); return url.protocol==='https:' && !url.username && !url.password; } catch { return false; }
}
function coordinateFormat(geometry: object, sourceSrid: number): boolean {
  if (!('type' in geometry) || !('coordinates' in geometry)) return false;
  const polygons:unknown = geometry.type==='Polygon' ? [geometry.coordinates] : geometry.coordinates;
  if (!Array.isArray(polygons) || !polygons.length) return false;
  // Format/range only. Topology and CRS transformation remain PostgreSQL/PostGIS responsibilities.
  const geographic = sourceSrid===4326 || sourceSrid===4674;
  return polygons.every((polygon:unknown) => Array.isArray(polygon) && polygon.length>0 && polygon.every((ring:unknown) =>
    Array.isArray(ring) && ring.length>0 && ring.every((position:unknown) => Array.isArray(position) && position.length===2 &&
      position.every((number:unknown) => typeof number==='number' && Number.isFinite(number)) &&
      (!geographic || (position[0]>=-180 && position[0]<=180 && position[1]>=-90 && position[1]<=90)))));
}
// Explicit staging only. No download, repair, replacement, approval or activation operation.
export async function stageMunicipalArea(repository: Pick<ReturnType<typeof createMunicipalAreaRepository>,'stage'>, artifact: AreaArtifact) {
  if (!artifact || artifact.municipalityCode!=='3550308' || !artifact.name?.trim() || !artifact.version?.trim() || artifact.version.length>120 ||
      !artifact.license?.trim() || !https(artifact.sourceUrl) || !https(artifact.licenseUrl) || typeof artifact.synthetic!=='boolean' ||
      !Number.isSafeInteger(artifact.sourceSrid) || artifact.sourceSrid<=0 || !/^[a-f0-9]{64}$/.test(artifact.sha256) ||
      typeof artifact.geoJson!=='string' || createHash('sha256').update(artifact.geoJson,'utf8').digest('hex')!==artifact.sha256) throw new Error('Municipal artifact configuration invalid');
  let parsed: unknown;
  try { parsed = JSON.parse(artifact.geoJson); } catch { throw new Error('Municipal artifact configuration invalid'); }
  if (!parsed || typeof parsed!=='object' || !('type' in parsed) || !['Polygon','MultiPolygon'].includes(String(parsed.type)) || 'crs' in parsed || !coordinateFormat(parsed,artifact.sourceSrid)) throw new Error('Municipal artifact configuration invalid');
  try { return await repository.stage(artifact); } catch { throw new Error('Municipal staging failed'); }
}

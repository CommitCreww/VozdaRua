import { createHash } from 'node:crypto';
import { URBIS_SOURCE } from '../config/municipal-source.js';
import type { AreaArtifact } from '../repositories/municipal-area.js';

// Offline extraction from the reviewed original. No network, activation or geometry repair.
export function prepareUrbisArtifact(original: Uint8Array): AreaArtifact {
  if (original.byteLength !== URBIS_SOURCE.originalBytes || createHash('sha256').update(original).digest('hex') !== URBIS_SOURCE.originalSha256) {
    throw new Error('Municipal original integrity mismatch');
  }
  const collection = JSON.parse(Buffer.from(original).toString('utf8'));
  if (collection.type !== 'FeatureCollection' || collection.features?.length !== 1 ||
      collection.crs?.type !== 'name' || collection.crs.properties?.name !== 'urn:ogc:def:crs:EPSG::31983' ||
      collection.features[0].type !== 'Feature' || !['Polygon', 'MultiPolygon'].includes(collection.features[0].geometry?.type)) {
    throw new Error('Municipal original structure mismatch');
  }
  // Preserve every coordinate and its order. Extract only the geometry; explicit SRID comes from the original + metadata.
  const geoJson = JSON.stringify(collection.features[0].geometry);
  return { name: 'Município de São Paulo', municipalityCode: '3550308', sourceUrl: URBIS_SOURCE.resource,
    version: URBIS_SOURCE.version, license: URBIS_SOURCE.license, licenseUrl: URBIS_SOURCE.licenseUrl,
    sourceSrid: URBIS_SOURCE.sourceSrid, sha256: createHash('sha256').update(geoJson).digest('hex'), geoJson, synthetic: false };
}

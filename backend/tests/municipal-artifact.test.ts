import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { describe, it, expect } from 'vitest';
import { prepareUrbisArtifact } from '../src/services/municipal-artifact.js';
import { URBIS_SOURCE } from '../src/config/municipal-source.js';

const original = readFileSync(new URL('../../geography/urbis/2026-09-05/limites_municipais.original.geojson', import.meta.url));
describe('D-GEO-01 original municipal preservado', () => {
  it('extrai uma geometria sem alterar coordenadas e mantém procedência e CRS explícitos', () => {
    const artifact = prepareUrbisArtifact(original);
    expect(JSON.parse(artifact.geoJson)).toEqual(JSON.parse(original.toString('utf8')).features[0].geometry);
    expect(artifact).toMatchObject({ sourceSrid: 31983, synthetic: false, version: URBIS_SOURCE.version, license: 'CC BY-SA 4.0' });
    expect(artifact.sha256).toBe(createHash('sha256').update(artifact.geoJson).digest('hex'));
    expect(JSON.parse(artifact.geoJson).crs).toBeUndefined();
    expect(prepareUrbisArtifact(original)).toEqual(artifact);
  });
  it('rejeita bytes alterados, mesmo com tamanho e JSON válidos', () => {
    const changed = Buffer.from(original); const index = changed.indexOf(Buffer.from('335919'));
    expect(index).toBeGreaterThan(0); changed[index] = 0x34;
    expect(() => prepareUrbisArtifact(changed)).toThrow('integrity mismatch');
  });
  it('rejeita truncamento antes de interpretar JSON', () => {
    expect(() => prepareUrbisArtifact(original.subarray(0, -1))).toThrow('integrity mismatch');
  });
});

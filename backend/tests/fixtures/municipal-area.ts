import { createHash,randomUUID } from 'node:crypto';
import type { AreaArtifact } from '../../src/repositories/municipal-area.js';
export function syntheticArtifact(overrides: Partial<AreaArtifact> = {}): AreaArtifact {
  const geoJson = JSON.stringify({ type:'Polygon',coordinates:[[[-46.7,-23.6],[-46.6,-23.6],[-46.6,-23.5],[-46.7,-23.5],[-46.7,-23.6]]] });
  return { name:'Fixture sintética, não oficial',municipalityCode:'3550308',sourceUrl:'https://fixture.example.test/geometry',version:randomUUID(),license:'TEST-ONLY',
    licenseUrl:'https://fixture.example.test/license',sourceSrid:4326,geoJson,sha256:createHash('sha256').update(geoJson).digest('hex'),synthetic:true,...overrides };
}

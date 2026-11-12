import { describe, expect, it } from 'vitest';
import { detectImageSignature } from '../src/integrations/images/signature.js';

describe('triagem inicial de formato de imagem', () => {
  it.each([
    ['JPEG', [0xff, 0xd8, 0xff, 0xe0], 'image/jpeg'],
    ['PNG', [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 'image/png'],
    ['WebP', [0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50], 'image/webp']
  ] as const)('reconhece assinatura %s', (_name, bytes, mime) => {
    expect(detectImageSignature(Uint8Array.from(bytes))).toBe(mime);
  });

  it.each([
    [], [0xff, 0xd8], [0x89, 0x50, 0x4e, 0x47],
    [0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42],
    [...new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg">')],
    [0, 0, 0, 0x18, 0x66, 0x74, 0x79, 0x70, 0x68, 0x65, 0x69, 0x63]
  ].map((bytes) => ({ bytes })))('rejeita assinatura ausente, truncada ou fora da lista', ({ bytes }) => {
    expect(detectImageSignature(Uint8Array.from(bytes))).toBeNull();
  });
});

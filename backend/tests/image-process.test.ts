import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { InvalidImageError, MAX_IMAGE_BYTES, MAX_IMAGE_PIXELS, processImage } from '../src/integrations/images/process.js';

async function fixture(format: 'jpeg' | 'png' | 'webp', width = 8, height = 6) {
  return sharp({ create: { width, height, channels: 3, background: '#195f86' } }).toFormat(format).toBuffer();
}

describe('processamento isolado de imagens', () => {
  it.each([['jpeg', 'image/jpeg'], ['png', 'image/png'], ['webp', 'image/webp']] as const)(
    'decodifica e re-encoda %s sem metadados', async (format, mime) => {
      const result = await processImage(await fixture(format));
      expect(result).toMatchObject({ mime, width: 8, height: 6 });
      const meta = await sharp(result.bytes).metadata();
      expect(meta).toMatchObject({ format, width: 8, height: 6 });
      expect(meta.exif).toBeUndefined();
    }
  );

  it('aceita arquivo exatamente no limite de bytes e pixels', async () => {
    const atPixels = await fixture('png', 5_000, 4_000);
    expect(5_000 * 4_000).toBe(MAX_IMAGE_PIXELS);
    expect((await processImage(atPixels)).width).toBe(5_000);
    const atBytes = Buffer.alloc(MAX_IMAGE_BYTES);
    atPixels.copy(atBytes);
    expect((await processImage(atBytes)).width).toBe(5_000);
  });

  it('rejeita excesso de bytes antes do decoder', async () => {
    await expect(processImage(Buffer.alloc(MAX_IMAGE_BYTES + 1))).rejects.toBeInstanceOf(InvalidImageError);
  });

  it('rejeita mais de 20 milhoes de pixels', async () => {
    await expect(processImage(await fixture('png', 5_001, 4_000))).rejects.toBeInstanceOf(InvalidImageError);
  });

  it('rejeita arquivo truncado, assinatura falsa e dados malformados', async () => {
    const valid = await fixture('png');
    for (const bytes of [valid.subarray(0, 16), Buffer.from([0xff, 0xd8, 0xff, 0, 0]),
      Buffer.concat([valid.subarray(0, 8), Buffer.alloc(30)])]) {
      await expect(processImage(bytes)).rejects.toBeInstanceOf(InvalidImageError);
    }
  });

  it('rejeita SVG e HEIC', async () => {
    await expect(processImage(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>'))).rejects.toBeInstanceOf(InvalidImageError);
    await expect(processImage(Buffer.from([0, 0, 0, 24, 102, 116, 121, 112, 104, 101, 105, 99]))).rejects.toBeInstanceOf(InvalidImageError);
  });

  it('remove EXIF e corrige orientacao visual', async () => {
    const source = await sharp({ create: { width: 8, height: 6, channels: 3, background: '#195f86' } })
      .jpeg().withMetadata({ orientation: 6 }).withExif({ IFD0: { ImageDescription: 'synthetic' } }).toBuffer();
    const inputMeta = await sharp(source).metadata();
    expect(inputMeta.orientation).toBe(6);
    expect(inputMeta.exif).toBeDefined();
    const result = await processImage(source);
    expect(result).toMatchObject({ width: 6, height: 8 });
    const outputMeta = await sharp(result.bytes).metadata();
    expect(outputMeta.exif).toBeUndefined();
    expect(outputMeta.orientation).toBeUndefined();
  });
});

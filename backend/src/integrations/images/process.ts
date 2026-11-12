import sharp from 'sharp';
import { detectImageSignature, type AllowedImageMime } from './signature.js';

export const MAX_IMAGE_BYTES = 10_000_000;
export const MAX_IMAGE_PIXELS = 20_000_000;

const formats: Record<AllowedImageMime, 'jpeg' | 'png' | 'webp'> = {
  'image/jpeg': 'jpeg',
  'image/png': 'png',
  'image/webp': 'webp'
};

export class InvalidImageError extends Error {
  constructor() { super('Imagem inválida.'); }
}

export type ProcessedImage = {
  bytes: Buffer;
  mime: AllowedImageMime;
  width: number;
  height: number;
};

export async function processImage(input: Uint8Array): Promise<ProcessedImage> {
  if (input.byteLength === 0 || input.byteLength > MAX_IMAGE_BYTES) throw new InvalidImageError();
  const mime = detectImageSignature(input);
  if (!mime) throw new InvalidImageError();
  const source = Buffer.from(input);
  try {
    const options = { failOn: 'warning' as const, limitInputPixels: MAX_IMAGE_PIXELS };
    const metadata = await sharp(source, options).metadata();
    if (metadata.format !== formats[mime] || !metadata.width || !metadata.height ||
      metadata.width * metadata.height > MAX_IMAGE_PIXELS) throw new InvalidImageError();

    const { data, info } = await sharp(source, options).autoOrient().toFormat(formats[mime]).toBuffer({ resolveWithObject: true });
    if (data.byteLength > MAX_IMAGE_BYTES || info.width * info.height > MAX_IMAGE_PIXELS) throw new InvalidImageError();

    const resultMetadata = await sharp(data, options).metadata();
    if (resultMetadata.format !== formats[mime] || resultMetadata.width !== info.width ||
      resultMetadata.height !== info.height || resultMetadata.exif || resultMetadata.xmp ||
      resultMetadata.iptc || resultMetadata.icc || detectImageSignature(data) !== mime) throw new InvalidImageError();
    await sharp(data, options).raw().toBuffer();
    return { bytes: data, mime, width: info.width, height: info.height };
  } catch {
    throw new InvalidImageError();
  }
}

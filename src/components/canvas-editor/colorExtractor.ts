/**
 * In-browser Client-side Color Extractor
 * Extracts 4 dominant and visually distinct colors from an uploaded image (JPG, PNG, WEBP)
 * without sending anything to the backend.
 */

export interface ExtractedColor {
  hex: string;
  rgb: { r: number; g: number; b: number };
  luminance: number;
}

export async function extractPaletteFromImageFile(file: File): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Error al leer el archivo de imagen'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Error al decodificar la imagen'));
      img.onload = () => {
        try {
          const colors = extractDominantColors(img, 4);
          resolve(colors);
        } catch (err) {
          reject(err);
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Quantizes image pixels on an offscreen canvas and computes 4 distinct dominant colors.
 */
export function extractDominantColors(img: HTMLImageElement, colorCount: number = 4): string[] {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return ['#111827', '#D4AF37', '#F59E0B', '#E5E7EB'];

  // Scale down for fast client-side performance
  const maxDimension = 150;
  let w = img.naturalWidth || img.width;
  let h = img.naturalHeight || img.height;
  if (w > maxDimension || h > maxDimension) {
    if (w > h) {
      h = Math.round((h * maxDimension) / w);
      w = maxDimension;
    } else {
      w = Math.round((w * maxDimension) / h);
      h = maxDimension;
    }
  }

  canvas.width = w;
  canvas.height = h;
  ctx.drawImage(img, 0, 0, w, h);

  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;

  const buckets: { [key: string]: { r: number; g: number; b: number; count: number } } = {};

  // Sample pixels with quantization to 16-level buckets
  for (let i = 0; i < data.length; i += 16) {
    const a = data[i + 3];
    if (a < 128) continue; // Ignore transparent pixels

    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Quantize RGB to reduce color space
    const qr = Math.round(r / 24) * 24;
    const qg = Math.round(g / 24) * 24;
    const qb = Math.round(b / 24) * 24;

    const key = `${qr},${qg},${qb}`;
    if (!buckets[key]) {
      buckets[key] = { r, g, b, count: 0 };
    }
    buckets[key].count++;
  }

  // Sort buckets by frequency
  const sorted = Object.values(buckets).sort((a, b) => b.count - a.count);
  if (sorted.length === 0) return ['#111827', '#D4AF37', '#F59E0B', '#E5E7EB'];

  // Pick distinct colors ensuring minimum perceptual distance
  const selected: { r: number; g: number; b: number }[] = [];

  for (const item of sorted) {
    const isTooClose = selected.some(s => colorDistance(s, item) < 55);
    if (!isTooClose) {
      selected.push(item);
      if (selected.length >= colorCount) break;
    }
  }

  // Fallback if not enough distinct colors found
  let fallbackIdx = 0;
  while (selected.length < colorCount && fallbackIdx < sorted.length) {
    const cand = sorted[fallbackIdx];
    if (!selected.includes(cand)) {
      selected.push(cand);
    }
    fallbackIdx++;
  }

  // Final fallback defaults if image was monochrome
  const defaultFallbacks = [
    { r: 17, g: 24, b: 39 },    // Dark slate (#111827)
    { r: 212, g: 175, b: 55 },  // Gold (#D4AF37)
    { r: 245, g: 158, b: 11 },  // Amber (#F59E0B)
    { r: 229, g: 231, b: 235 }  // Light grey (#E5E7EB)
  ];
  while (selected.length < colorCount) {
    selected.push(defaultFallbacks[selected.length]);
  }

  return selected.slice(0, colorCount).map(c => rgbToHex(c.r, c.g, c.b));
}

function colorDistance(c1: { r: number; g: number; b: number }, c2: { r: number; g: number; b: number }): number {
  return Math.sqrt(
    Math.pow(c1.r - c2.r, 2) +
    Math.pow(c1.g - c2.g, 2) +
    Math.pow(c1.b - c2.b, 2)
  );
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

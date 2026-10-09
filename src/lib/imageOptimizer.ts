import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';

export interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  fit?: 'cover' | 'contain' | 'scale';
}

/**
 * Loads an image from a File, Blob, or URL/DataURL safely into an HTMLImageElement.
 */
function loadImage(source: File | Blob | string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    let objectUrl: string | null = null;
    if (typeof source === 'string') {
      img.src = source;
    } else {
      objectUrl = URL.createObjectURL(source);
      img.src = objectUrl;
    }

    img.onload = () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      resolve(img);
    };

    img.onerror = (e) => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      reject(new Error('No se pudo cargar la imagen para procesamiento.'));
    };
  });
}

/**
 * Optimizes, resizes, and crops an image without deformation.
 * Converts to WebP format to reduce file sizes by 80-90% with high visual clarity.
 */
export async function optimizeImage(
  source: File | Blob | string,
  options: ImageOptimizationOptions = {}
): Promise<{ blob: Blob; dataUrl: string; width: number; height: number; sizeBytes: number }> {
  const {
    maxWidth = 800,
    maxHeight = 600,
    quality = 0.82,
    fit = 'cover'
  } = options;

  const img = await loadImage(source);
  const srcW = img.naturalWidth || img.width;
  const srcH = img.naturalHeight || img.height;

  let destW = srcW;
  let destH = srcH;
  let srcX = 0;
  let srcY = 0;
  let cropW = srcW;
  let cropH = srcH;

  if (fit === 'cover') {
    // Aspect ratio center crop without distortion (object-fit: cover style)
    const targetAspect = maxWidth / maxHeight;
    const currentAspect = srcW / srcH;

    if (currentAspect > targetAspect) {
      // Source is wider than target: crop horizontal margins
      cropW = Math.round(srcH * targetAspect);
      srcX = Math.round((srcW - cropW) / 2);
    } else {
      // Source is taller than target: crop vertical margins
      cropH = Math.round(srcW / targetAspect);
      srcY = Math.round((srcH - cropH) / 2);
    }

    destW = Math.min(maxWidth, cropW);
    destH = Math.min(maxHeight, cropH);
  } else {
    // Proportional downscale (zero cropping, keeps 100% of the image)
    const ratio = Math.min(maxWidth / srcW, maxHeight / srcH, 1);
    destW = Math.round(srcW * ratio);
    destH = Math.round(srcH * ratio);
    cropW = srcW;
    cropH = srcH;
  }

  // Create high-DPI smoothing canvas
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, destW);
  canvas.height = Math.max(1, destH);
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Canvas 2D context not available');
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, srcX, srcY, cropW, cropH, 0, 0, destW, destH);

  // Convert to WebP blob
  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else {
          // Fallback if toBlob fails
          const fallbackDataUrl = canvas.toDataURL('image/webp', quality);
          const byteString = atob(fallbackDataUrl.split(',')[1]);
          const ab = new ArrayBuffer(byteString.length);
          const ia = new Uint8Array(ab);
          for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
          }
          resolve(new Blob([ab], { type: 'image/webp' }));
        }
      },
      'image/webp',
      quality
    );
  });

  const dataUrl = canvas.toDataURL('image/webp', quality);

  return {
    blob,
    dataUrl,
    width: destW,
    height: destH,
    sizeBytes: blob.size
  };
}

/**
 * Presets matching application guidelines:
 * - Logo: Max 300 × 300 px (scaled proportionally without deformation)
 * - Foto de plato: Max 800 × 600 px (or 1000 × 750 px max, cover crop without deformation)
 * - Usuario / Avatar: Max 300 × 300 px
 * - Portada / Banner: Max 1200 × 500 px
 */
export async function optimizeImageByTargetType(
  source: File | Blob | string,
  type: 'logo' | 'dish' | 'avatar' | 'cover'
) {
  switch (type) {
    case 'logo':
      return await optimizeImage(source, {
        maxWidth: 300,
        maxHeight: 300,
        fit: 'contain',
        quality: 0.85
      });
    case 'dish':
      return await optimizeImage(source, {
        maxWidth: 800,
        maxHeight: 600,
        fit: 'cover',
        quality: 0.82
      });
    case 'avatar':
      return await optimizeImage(source, {
        maxWidth: 300,
        maxHeight: 300,
        fit: 'cover',
        quality: 0.82
      });
    case 'cover':
      return await optimizeImage(source, {
        maxWidth: 1200,
        maxHeight: 500,
        fit: 'cover',
        quality: 0.80
      });
  }
}

let storageAvailableInSession = true;
const optimizedBase64Cache = new Map<string, string>();

/**
 * Uploads a WebP blob to Firebase Storage and returns its public download URL.
 * If Firebase Storage is unavailable or errors out, returns null.
 */
export async function uploadBlobToFirebaseStorage(
  blob: Blob,
  storagePath: string
): Promise<string | null> {
  if (!storage || !storageAvailableInSession) {
    return null;
  }

  try {
    const fileRef = ref(storage, storagePath);
    const snapshot = await uploadBytes(fileRef, blob, {
      contentType: 'image/webp',
      cacheControl: 'public, max-age=31536000'
    });
    const downloadUrl = await getDownloadURL(snapshot.ref);
    return downloadUrl;
  } catch (err) {
    storageAvailableInSession = false;
    console.warn('[Firebase Storage] Notice uploading image to Storage (using compact WebP fallback):', err);
    return null;
  }
}

/**
 * High-level helper:
 * 1. Optimizes and crops image without deformation according to target type.
 * 2. Converts to WebP.
 * 3. Uploads to Firebase Storage if available.
 * 4. Fallback to compact WebP dataUrl (only ~20-50 KB, never exceeding 1 MB).
 */
export async function processAndUploadImage(
  source: File | Blob | string,
  type: 'logo' | 'dish' | 'avatar' | 'cover',
  idHint: string = 'img'
): Promise<{ url: string; isStorage: boolean; sizeBytes: number }> {
  const optimized = await optimizeImageByTargetType(source, type);
  const cleanId = idHint.replace(/[^a-zA-Z0-9_-]/g, '_');
  const storagePath = `uploads/${type}s/${cleanId}_${Date.now()}.webp`;

  let storageUrl: string | null = null;
  try {
    storageUrl = await uploadBlobToFirebaseStorage(optimized.blob, storagePath);
  } catch (e) {
    console.warn('[Image Upload] Storage upload attempt notice:', e);
  }

  if (storageUrl) {
    return {
      url: storageUrl,
      isStorage: true,
      sizeBytes: optimized.sizeBytes
    };
  }

  // Fallback to compact WebP DataURL
  return {
    url: optimized.dataUrl,
    isStorage: false,
    sizeBytes: optimized.sizeBytes
  };
}

/**
 * Checks if a string is a base64 encoded image.
 */
export function isBase64Image(url?: string): boolean {
  if (!url) return false;
  return url.startsWith('data:image/');
}

/**
 * Checks if a Base64 image needs migration to WebP / Firebase Storage
 * (e.g., PNG/JPEG base64 or oversized WebP base64).
 */
export function needsBase64Migration(url?: string): boolean {
  if (!url || !url.startsWith('data:image/')) return false;
  if (url.startsWith('data:image/svg+xml') && url.length < 30000) return false;
  if (url.startsWith('data:image/webp') && url.length < 65000 && !storageAvailableInSession) return false;
  return true;
}

/**
 * Automatically converts existing Base64 images to optimized WebP (and uploads to Storage if available).
 * Guarantees that no oversized Base64 ever exceeds Firestore's 1MB limit.
 */
export async function ensureOptimizedImageUrl(
  url: string | undefined,
  type: 'logo' | 'dish' | 'avatar' | 'cover',
  idHint: string = 'img'
): Promise<string> {
  if (!url) return '';
  if (!url.startsWith('data:image/')) return url;
  if (url.startsWith('data:image/svg+xml') && url.length < 30000) return url;

  const cacheKey = `${type}:${url.length}:${url.slice(0, 64)}:${url.slice(-32)}`;
  if (optimizedBase64Cache.has(cacheKey)) {
    return optimizedBase64Cache.get(cacheKey)!;
  }

  // If already compact WebP and Storage is unavailable, cache and return immediately
  if (url.startsWith('data:image/webp') && url.length < 65000 && !storageAvailableInSession) {
    optimizedBase64Cache.set(cacheKey, url);
    return url;
  }

  if (typeof document === 'undefined') {
    return url.length > 200000 ? '' : url;
  }

  try {
    const res = await processAndUploadImage(url, type, idHint);
    const finalUrl = res.url.length > 250000 ? '' : res.url;
    optimizedBase64Cache.set(cacheKey, finalUrl);
    return finalUrl;
  } catch (err) {
    console.warn(`[Image Migration] Could not convert base64 image for ${idHint}, dropping heavy payload:`, err);
    return '';
  }
}

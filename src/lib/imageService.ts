import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';

export interface ImageUploadResult {
  url: string;
  filename: string;
  size: number;
  format: 'PNG' | 'JPG' | 'SVG' | 'WEBP';
  hasTransparency: boolean;
}

/**
 * Detects if an image file has alpha transparency
 */
export const detectTransparency = (file: File): Promise<boolean> => {
  return new Promise((resolve) => {
    if (file.type === 'image/svg+xml') {
      resolve(true);
      return;
    }
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = Math.min(img.width, 256);
        canvas.height = Math.min(img.height, 256);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(objectUrl);
          resolve(false);
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        for (let i = 3; i < data.length; i += 4) {
          if (data[i] < 255) {
            URL.revokeObjectURL(objectUrl);
            resolve(true);
            return;
          }
        }
        URL.revokeObjectURL(objectUrl);
        resolve(false);
      } catch (e) {
        URL.revokeObjectURL(objectUrl);
        resolve(false);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(false);
    };
    img.src = objectUrl;
  });
};

/**
 * Converts image blob/file to PNG to preserve transparency
 */
export const convertToPNG = async (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    if (file.type === 'image/svg+xml' || file.type === 'image/png') {
      resolve(file);
      return;
    }
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Canvas context not available'));
        return;
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(objectUrl);
        if (blob) {
          const pngFile = new File([blob], file.name.replace(/\.[^.]+$/, '.png'), {
            type: 'image/png'
          });
          resolve(pngFile);
        } else {
          reject(new Error('Failed to convert image to PNG blob'));
        }
      }, 'image/png');
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      reject(err);
    };
    img.src = objectUrl;
  });
};

const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Uploads image file to Firebase Storage with proper folder structure and validation
 */
export const uploadImage = async (
  file: File,
  restaurantId: string = 'global',
  type: 'logo' | 'dish' | 'header' | 'background' = 'dish'
): Promise<ImageUploadResult> => {
  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('La imagen excede el tamaño máximo permitido de 5MB.');
  }

  // Validate format
  const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    throw new Error('Formato de imagen no soportado. Use PNG, JPG, SVG o WEBP.');
  }

  const hasTransparency = await detectTransparency(file);
  let processedFile = file;

  if (hasTransparency && file.type !== 'image/svg+xml' && file.type !== 'image/png') {
    try {
      processedFile = await convertToPNG(file);
    } catch (e) {
      console.warn('[ImageService] Failed to convert transparent image to PNG, using original:', e);
    }
  }

  const timestamp = Date.now();
  const cleanName = processedFile.name.replace(/[^a-zA-Z0-9_.-]/g, '_');
  const pathMap = {
    logo: `restaurants/${restaurantId}/logos/${timestamp}-${cleanName}`,
    dish: `restaurants/${restaurantId}/dishes/${timestamp}-${cleanName}`,
    header: `restaurants/${restaurantId}/headers/${timestamp}-${cleanName}`,
    background: `restaurants/${restaurantId}/backgrounds/${timestamp}-${cleanName}`
  };

  const storagePath = pathMap[type] || `restaurants/${restaurantId}/uploads/${timestamp}-${cleanName}`;
  
  let downloadUrl = '';
  if (storage) {
    try {
      const storageRef = ref(storage, storagePath);
      await uploadBytes(storageRef, processedFile);
      downloadUrl = await getDownloadURL(storageRef);
    } catch (e) {
      console.warn('[ImageService] Firebase Storage upload failed, falling back to base64 data URL:', e);
      downloadUrl = await fileToDataUrl(processedFile);
    }
  } else {
    downloadUrl = await fileToDataUrl(processedFile);
  }

  let format: ImageUploadResult['format'] = 'JPG';
  if (processedFile.type.includes('png') || hasTransparency) format = 'PNG';
  else if (processedFile.type.includes('svg')) format = 'SVG';
  else if (processedFile.type.includes('webp')) format = 'WEBP';

  return {
    url: downloadUrl,
    filename: cleanName,
    size: processedFile.size,
    format,
    hasTransparency
  };
};

/**
 * Client-side Image Compression Utility
 * 
 * Compresses images before upload to reduce bandwidth and improve performance.
 * Uses browser-native Canvas API - no external dependencies.
 * 
 * Features:
 * - Resizes images to max 1600px longest side
 * - Compresses JPEG/WEBP to ~0.75 quality
 * - Preserves EXIF orientation
 * - Maintains aspect ratio
 * - Transparent to user (automatic)
 */

export interface CompressionOptions {
  /** Maximum width or height in pixels (default: 1600) */
  maxDimension?: number;
  /** JPEG/WEBP quality 0-1 (default: 0.75) */
  quality?: number;
  /** Maximum file size in bytes (optional, will compress further if exceeded) */
  maxSizeBytes?: number;
  /** MIME type for output (default: 'image/jpeg') */
  outputMimeType?: string;
}

const DEFAULT_OPTIONS: Required<Omit<CompressionOptions, 'maxSizeBytes'>> & { maxSizeBytes?: number } = {
  maxDimension: 1600,
  quality: 0.75,
  outputMimeType: 'image/jpeg',
};

/**
 * Get EXIF orientation from image file
 * Returns orientation value (1-8) or null if not available
 */
async function getExifOrientation(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const view = new DataView(e.target?.result as ArrayBuffer);
      if (view.getUint16(0, false) !== 0xFFD8) {
        resolve(null); // Not a JPEG
        return;
      }
      
      const length = view.byteLength;
      let offset = 2;
      
      while (offset < length) {
        if (view.getUint16(offset, false) !== 0xFFE1) {
          offset += 2;
          continue;
        }
        
        const marker = view.getUint16(offset + 2, false);
        if (marker !== 0x4578) { // 'Ex' in ASCII
          offset += 2;
          continue;
        }
        
        const exifLength = view.getUint16(offset, false);
        if (offset + exifLength > length) {
          resolve(null);
          return;
        }
        
        const tiffOffset = offset + 6;
        if (view.getUint32(tiffOffset, false) !== 0x49492A00) {
          resolve(null);
          return;
        }
        
        const ifdOffset = view.getUint32(tiffOffset + 4, false);
        const ifdPointer = tiffOffset + ifdOffset;
        const numEntries = view.getUint16(ifdPointer, false);
        
        for (let i = 0; i < numEntries; i++) {
          const entryOffset = ifdPointer + 2 + (i * 12);
          const tag = view.getUint16(entryOffset, false);
          
          if (tag === 0x0112) { // Orientation tag
            const orientation = view.getUint16(entryOffset + 8, false);
            resolve(orientation);
            return;
          }
        }
        
        resolve(null);
        return;
      }
      
      resolve(null);
    };
    reader.onerror = () => resolve(null);
    reader.readAsArrayBuffer(file.slice(0, 64 * 1024)); // Read first 64KB
  });
}

/**
 * Apply EXIF orientation transformation to canvas context
 */
function applyOrientation(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  orientation: number
): void {
  switch (orientation) {
    case 2:
      // Horizontal flip
      ctx.transform(-1, 0, 0, 1, width, 0);
      break;
    case 3:
      // 180° rotation
      ctx.transform(-1, 0, 0, -1, width, height);
      break;
    case 4:
      // Vertical flip
      ctx.transform(1, 0, 0, -1, 0, height);
      break;
    case 5:
      // Vertical flip + 90° rotation
      ctx.transform(0, 1, 1, 0, 0, 0);
      break;
    case 6:
      // 90° rotation
      ctx.transform(0, 1, -1, 0, height, 0);
      break;
    case 7:
      // Horizontal flip + 90° rotation
      ctx.transform(0, -1, -1, 0, height, width);
      break;
    case 8:
      // 270° rotation
      ctx.transform(0, -1, 1, 0, 0, width);
      break;
    default:
      // No transformation needed (orientation 1)
      break;
  }
}

/**
 * Calculate new dimensions maintaining aspect ratio
 */
function calculateDimensions(
  originalWidth: number,
  originalHeight: number,
  maxDimension: number
): { width: number; height: number } {
  if (originalWidth <= maxDimension && originalHeight <= maxDimension) {
    return { width: originalWidth, height: originalHeight };
  }
  
  const aspectRatio = originalWidth / originalHeight;
  
  if (originalWidth > originalHeight) {
    return {
      width: maxDimension,
      height: Math.round(maxDimension / aspectRatio),
    };
  } else {
    return {
      width: Math.round(maxDimension * aspectRatio),
      height: maxDimension,
    };
  }
}

/**
 * Compress a single image file
 * 
 * @param file - Original image file
 * @param options - Compression options
 * @returns Compressed File object
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Skip compression for non-image files
  if (!file.type.startsWith('image/')) {
    return file;
  }
  
  // Skip compression for very small files (< 100KB)
  if (file.size < 100 * 1024) {
    return file;
  }
  
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }
    
    img.onload = async () => {
      try {
        // Get EXIF orientation
        const orientation = await getExifOrientation(file);
        
        // Calculate dimensions
        let { width, height } = calculateDimensions(
          img.width,
          img.height,
          opts.maxDimension
        );
        
        // Swap dimensions if orientation requires rotation
        if (orientation && (orientation >= 5 && orientation <= 8)) {
          [width, height] = [height, width];
        }
        
        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;
        
        // Reset transform
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        
        // Apply orientation transformation
        if (orientation && orientation !== 1) {
          applyOrientation(ctx, width, height, orientation);
        }
        
        // Draw image
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to blob with compression
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }
            
            // Check if we need further compression to meet maxSizeBytes
            if (opts.maxSizeBytes && blob.size > opts.maxSizeBytes) {
              // Try with lower quality
              let quality = opts.quality;
              let attempts = 0;
              const maxAttempts = 5;
              
              const tryCompress = () => {
                quality = Math.max(0.1, quality - 0.1);
                canvas.toBlob(
                  (compressedBlob) => {
                    if (!compressedBlob) {
                      resolve(new File([blob], file.name, { type: opts.outputMimeType }));
                      return;
                    }
                    
                    if (compressedBlob.size <= opts.maxSizeBytes || attempts >= maxAttempts) {
                      resolve(
                        new File([compressedBlob], file.name, {
                          type: opts.outputMimeType,
                          lastModified: file.lastModified,
                        })
                      );
                    } else {
                      attempts++;
                      tryCompress();
                    }
                  },
                  opts.outputMimeType,
                  quality
                );
              };
              
              tryCompress();
            } else {
              // Create File from blob, preserving original name
              resolve(
                new File([blob], file.name, {
                  type: opts.outputMimeType,
                  lastModified: file.lastModified,
                })
              );
            }
          },
          opts.outputMimeType,
          opts.quality
        );
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    // Load image from file
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Compress multiple image files
 * 
 * @param files - Array of image files
 * @param options - Compression options
 * @returns Array of compressed File objects
 */
export async function compressImages(
  files: File[],
  options: CompressionOptions = {}
): Promise<File[]> {
  const results = await Promise.allSettled(
    files.map((file) => compressImage(file, options))
  );
  
  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      // If compression fails, return original file
      console.warn(`Failed to compress image ${files[index].name}:`, result.reason);
      return files[index];
    }
  });
}

/**
 * Check if file is an image that should be compressed
 */
export function shouldCompress(file: File): boolean {
  return (
    file.type.startsWith('image/') &&
    file.size > 100 * 1024 && // Only compress files > 100KB
    (file.type === 'image/jpeg' ||
      file.type === 'image/jpg' ||
      file.type === 'image/png' ||
      file.type === 'image/webp')
  );
}

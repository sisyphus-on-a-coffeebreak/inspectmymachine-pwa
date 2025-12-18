/**
 * Media Upload Manager
 * 
 * Handles parallel, non-blocking image uploads for inspections.
 * Decouples draft saves from media uploads for better mobile performance.
 * 
 * Features:
 * - Parallel uploads with concurrency control (2-3 concurrent)
 * - Per-image progress tracking
 * - Automatic retry on failure
 * - Non-blocking (doesn't freeze UI)
 * - HEIC to JPEG conversion for iOS
 */

import { compressImage, shouldCompress } from './imageCompression';
import { getApiUrl } from './apiConfig';
import { ensureCsrfToken } from './csrf';

export interface MediaUploadProgress {
  fileId: string;
  fileName: string;
  status: 'pending' | 'compressing' | 'uploading' | 'completed' | 'failed';
  progress: number; // 0-100
  error?: string;
  uploadedKey?: string;
}

export interface MediaUploadOptions {
  files: File[];
  prefix?: string;
  maxConcurrency?: number;
  onProgress?: (progress: MediaUploadProgress[]) => void;
  onFileComplete?: (fileId: string, key: string) => void;
  onFileError?: (fileId: string, error: Error) => void;
}

export interface MediaUploadResult {
  uploaded: Array<{ fileId: string; key: string; fileName: string }>;
  failed: Array<{ fileId: string; fileName: string; error: string }>;
}

/**
 * Convert HEIC/HEIF to JPEG using browser APIs
 * Falls back to original file if conversion not possible
 */
async function convertHeicToJpeg(file: File): Promise<File> {
  // Check if it's a HEIC/HEIF file
  const isHeic = file.type === 'image/heic' || 
                 file.type === 'image/heif' ||
                 file.name.toLowerCase().endsWith('.heic') ||
                 file.name.toLowerCase().endsWith('.heif');
  
  if (!isHeic) {
    return file;
  }
  
  try {
    // Try to use createImageBitmap (works in modern browsers)
    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      return file; // Fallback to original
    }
    
    ctx.drawImage(bitmap, 0, 0);
    bitmap.close();
    
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          const jpegFile = new File([blob], file.name.replace(/\.(heic|heif)$/i, '.jpg'), {
            type: 'image/jpeg',
            lastModified: file.lastModified,
          });
          resolve(jpegFile);
        } else {
          reject(new Error('Failed to convert HEIC to JPEG'));
        }
      }, 'image/jpeg', 0.85);
    });
  } catch (error) {
    // Conversion failed, return original (backend may handle it)
    console.warn('HEIC conversion failed, using original:', error);
    return file;
  }
}

/**
 * Get CSRF token helper
 */
function getCsrfToken(): string | null {
  const cookies = document.cookie;
  const match = cookies.match(/XSRF-TOKEN=([^;]+)/);
  if (match) {
    return decodeURIComponent(match[1]);
  }
  return null;
}

/**
 * Upload a single file with progress tracking
 */
async function uploadSingleFile(
  file: File,
  fileId: string,
  prefix: string | undefined,
  onProgress: (progress: number) => void
): Promise<string> {
  // Ensure CSRF token
  await ensureCsrfToken();
  const csrfToken = getCsrfToken();
  
  // Convert HEIC if needed
  let fileToUpload = await convertHeicToJpeg(file);
  
  // Compress if needed (async, non-blocking)
  if (shouldCompress(fileToUpload)) {
    fileToUpload = await compressImage(fileToUpload);
  }
  
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', fileToUpload, fileToUpload.name || 'photo');
    if (prefix) {
      const clean = prefix.replace(/^\/+/, '');
      if (clean) {
        formData.append('prefix', clean);
      }
    }
    
    const xhr = new XMLHttpRequest();
    const url = getApiUrl('/v1/files/upload');
    
    xhr.open('POST', url);
    xhr.setRequestHeader('Accept', 'application/json');
    if (csrfToken) {
      xhr.setRequestHeader('X-XSRF-TOKEN', csrfToken);
    }
    xhr.withCredentials = true;
    
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100);
        onProgress(percent);
      }
    };
    
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          if (response.key) {
            resolve(response.key);
          } else {
            reject(new Error('Server did not return file key'));
          }
        } catch {
          reject(new Error('Invalid server response'));
        }
      } else {
        reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
      }
    };
    
    xhr.onerror = () => {
      reject(new Error('Network error during upload'));
    };
    
    xhr.send(formData);
  });
}

/**
 * Upload multiple files in parallel with concurrency control
 */
export async function uploadMediaFiles(
  options: MediaUploadOptions
): Promise<MediaUploadResult> {
  const {
    files,
    prefix,
    maxConcurrency = 3,
    onProgress,
    onFileComplete,
    onFileError,
  } = options;
  
  // Generate unique IDs for each file
  const fileMap = new Map<string, File>();
  const fileIds = files.map((file, index) => {
    const fileId = `file-${Date.now()}-${index}`;
    fileMap.set(fileId, file);
    return fileId;
  });
  
  // Track progress for all files
  const progressMap = new Map<string, MediaUploadProgress>();
  
  fileIds.forEach((fileId) => {
    const file = fileMap.get(fileId)!;
    progressMap.set(fileId, {
      fileId,
      fileName: file.name,
      status: 'pending',
      progress: 0,
    });
  });
  
  const updateProgress = () => {
    if (onProgress) {
      onProgress(Array.from(progressMap.values()));
    }
  };
  
  const uploaded: Array<{ fileId: string; key: string; fileName: string }> = [];
  const failed: Array<{ fileId: string; fileName: string; error: string }> = [];
  
  // Process files with concurrency control
  let activeUploads = 0;
  let currentIndex = 0;
  
  const processNext = async (): Promise<void> => {
    while (currentIndex < fileIds.length || activeUploads > 0) {
      // Start new uploads up to concurrency limit
      while (activeUploads < maxConcurrency && currentIndex < fileIds.length) {
        const fileId = fileIds[currentIndex++];
        const file = fileMap.get(fileId)!;
        activeUploads++;
        
        (async () => {
          try {
            // Update status to compressing
            const progress = progressMap.get(fileId)!;
            progress.status = 'compressing';
            progress.progress = 5;
            updateProgress();
            
            // Small delay to show compressing state
            await new Promise(resolve => setTimeout(resolve, 50));
            
            // Update status to uploading
            progress.status = 'uploading';
            progress.progress = 10;
            updateProgress();
            
            // Upload file
            const key = await uploadSingleFile(
              file,
              fileId,
              prefix,
              (percent) => {
                const p = progressMap.get(fileId)!;
                // Map 0-100% to 10-100% (accounting for compression phase)
                p.progress = Math.min(100, 10 + Math.round(percent * 0.9));
                updateProgress();
              }
            );
            
            // Mark as completed
            progress.status = 'completed';
            progress.progress = 100;
            progress.uploadedKey = key;
            updateProgress();
            
            uploaded.push({ fileId, key, fileName: file.name });
            onFileComplete?.(fileId, key);
          } catch (error) {
            const progress = progressMap.get(fileId)!;
            progress.status = 'failed';
            progress.error = error instanceof Error ? error.message : String(error);
            updateProgress();
            
            failed.push({
              fileId,
              fileName: file.name,
              error: progress.error,
            });
            onFileError?.(fileId, error instanceof Error ? error : new Error(String(error)));
          } finally {
            activeUploads--;
            // Process next file
            await processNext();
          }
        })();
      }
      
      // Wait a bit before checking again
      if (activeUploads >= maxConcurrency) {
        await new Promise(resolve => setTimeout(resolve, 100));
      } else {
        break;
      }
    }
  };
  
  await processNext();
  
  return { uploaded, failed };
}

/**
 * Retry failed uploads with exponential backoff
 */
export async function retryFailedUploads(
  failedFiles: Array<{ fileId: string; file: File; error: string }>,
  options: Omit<MediaUploadOptions, 'files'>,
  maxRetries: number = 3
): Promise<MediaUploadResult> {
  let attempt = 0;
  let remainingFiles = failedFiles;
  const allUploaded: Array<{ fileId: string; key: string; fileName: string }> = [];
  const allFailed: Array<{ fileId: string; fileName: string; error: string }> = [];
  
  while (attempt < maxRetries && remainingFiles.length > 0) {
    attempt++;
    
    // Exponential backoff: 1s, 2s, 4s
    if (attempt > 1) {
      const delay = Math.pow(2, attempt - 2) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    const result = await uploadMediaFiles({
      ...options,
      files: remainingFiles.map(f => f.file),
    });
    
    // Track successful uploads
    allUploaded.push(...result.uploaded);
    
    // Prepare next retry batch from failures
    const failedFileMap = new Map(remainingFiles.map(f => [f.fileId, f]));
    remainingFiles = result.failed
      .map(f => failedFileMap.get(f.fileId))
      .filter((f): f is { fileId: string; file: File; error: string } => f !== undefined);
    
    allFailed.push(...result.failed);
  }
  
  return {
    uploaded: allUploaded,
    failed: allFailed,
  };
}

import React, { useState, useMemo, useEffect } from 'react';
import { colors, typography, spacing } from '../../lib/theme';
import { Button } from '../ui/button';
import { Modal } from '../ui/Modal';
import { ImageViewer } from '../ui/ImageViewer';
import { logger } from '../../lib/logger';
import { apiClient } from '../../lib/apiClient';
import { API_ORIGIN } from '../../lib/apiConfig';

interface MediaFile {
  id: string;
  url: string;
  name: string;
  questionText: string;
  answerId: string;
  type: 'image' | 'video';
  s3Key?: string; // S3 key for fetching signed URLs
}

interface ImageDownloadManagerProps {
  inspection: {
    id: string;
    template?: { name: string };
    vehicle?: { registration_number: string; make?: string; model?: string };
    answers: Array<{
      id: string;
      question_id: string;
        answer_files?: Array<{
          key?: string; // S3 key for fetching signed URLs
          path?: string;
          name?: string;
          url?: string;
          type?: string;
        }>;
      question?: {
        question_text: string;
        question_type: string;
      };
    }>;
  };
  onClose: () => void;
}

export const ImageDownloadManager: React.FC<ImageDownloadManagerProps> = ({
  inspection,
  onClose,
}) => {
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [downloading, setDownloading] = useState(false);
  const [previewMedia, setPreviewMedia] = useState<MediaFile | null>(null);
  const [previewIndex, setPreviewIndex] = useState<number>(0);
  const [signedUrlCache, setSignedUrlCache] = useState<Map<string, string>>(new Map());

  // Collect all images and videos from inspection answers
  const allImages = useMemo(() => {
    const images: MediaFile[] = [];
    
    inspection.answers.forEach((answer) => {
      if (answer.answer_files && Array.isArray(answer.answer_files) && answer.answer_files.length > 0) {
        answer.answer_files.forEach((file, index) => {
          // Check if it's an image or video file
          const isImage = file.type?.startsWith('image/') || 
                         file.name?.match(/\.(jpg|jpeg|png|gif|webp|bmp)$/i) ||
                         file.path?.match(/\.(jpg|jpeg|png|gif|webp|bmp)$/i);
          
          const isVideo = file.type?.startsWith('video/') ||
                         file.name?.match(/\.(mp4|webm|ogg|mov|avi|mkv)$/i) ||
                         file.path?.match(/\.(mp4|webm|ogg|mov|avi|mkv)$/i);
          
          if (!isImage && !isVideo) {
            return; // Skip non-media files
          }
          
          const mediaType: 'image' | 'video' = isVideo ? 'video' : 'image';
          
          // Files can be stored in two ways:
          // 1. Local storage (public disk): has 'path' field like "inspections/media/filename.jpg"
          // 2. S3 storage: has 'key' field for S3 key
          
          const directUrl = file.url; // May already be a signed URL or full URL
          const s3Key = file.key; // S3 key if file is on S3
          const localPath = file.path; // Local path if file is on local storage
          
          let imageUrl = '';
          let storageKey: string | undefined; // Key to use for fetching signed/public URL
          
          // If we have a direct URL (already signed or public), use it
          if (directUrl && (directUrl.startsWith('http') || directUrl.startsWith('data:'))) {
            imageUrl = directUrl;
          } else if (s3Key) {
            // File is on S3 - use S3 key to fetch signed URL
            storageKey = s3Key.trim().replace(/^\/+|\/+$/g, '');
            imageUrl = ''; // Will be replaced with signed URL
          } else if (localPath) {
            // File is on local storage - use path as key to fetch public URL from signed endpoint
            // The signed endpoint now returns public URLs for local files
            storageKey = localPath.trim().replace(/^\/+|\/+$/g, '');
            imageUrl = ''; // Will be replaced with public URL from signed endpoint
          } else if (file.name) {
            // Fallback: try to build storage key from name
            storageKey = `inspections/media/${file.name}`.trim().replace(/^\/+|\/+$/g, '');
            imageUrl = ''; // Will be replaced with URL from signed endpoint
          }
          
          // If still no URL/key/path, skip this file
          if (!imageUrl && !storageKey) {
            return; // Skip files without URL or storage key
          }
          
          // Preserve original file extension from path or name
          let fileExtension = mediaType === 'image' ? 'png' : 'mp4'; // Default based on type
          if (file.path) {
            const pathMatch = file.path.match(/\.([a-z0-9]+)$/i);
            if (pathMatch) {
              fileExtension = pathMatch[1].toLowerCase();
            }
          } else if (file.name) {
            const nameMatch = file.name.match(/\.([a-z0-9]+)$/i);
            if (nameMatch) {
              fileExtension = nameMatch[1].toLowerCase();
            }
          } else if (file.type) {
            // Infer from MIME type
            if (mediaType === 'image') {
              if (file.type.includes('jpeg') || file.type.includes('jpg')) {
                fileExtension = 'jpg';
              } else if (file.type.includes('png')) {
                fileExtension = 'png';
              } else if (file.type.includes('gif')) {
                fileExtension = 'gif';
              } else if (file.type.includes('webp')) {
                fileExtension = 'webp';
              }
            } else {
              if (file.type.includes('mp4')) {
                fileExtension = 'mp4';
              } else if (file.type.includes('webm')) {
                fileExtension = 'webm';
              } else if (file.type.includes('ogg')) {
                fileExtension = 'ogg';
              } else if (file.type.includes('quicktime') || file.type.includes('mov')) {
                fileExtension = 'mov';
              }
            }
          }
          
          // Generate filename preserving original extension
          const baseName = file.name 
            ? file.name.replace(/\.[^/.]+$/, '') // Remove existing extension
            : `${answer.question?.question_text || mediaType}_${index + 1}`
                .replace(/[^a-z0-9]/gi, '_')
                .toLowerCase();
          
          const fileName = `${baseName}.${fileExtension}`;
          
          images.push({
            id: `${answer.id}-${index}`,
            url: imageUrl || '', // Will be replaced with signed/public URL if needed
            name: fileName,
            questionText: answer.question?.question_text || 'Unknown Question',
            answerId: answer.id,
            type: mediaType,
            // Use storageKey for both S3 and local files (signed endpoint handles both)
            s3Key: storageKey,
          });
        });
      }
    });
    
    return images;
  }, [inspection.answers]);

  const toggleImage = (imageId: string) => {
    const newSelected = new Set(selectedImages);
    if (newSelected.has(imageId)) {
      newSelected.delete(imageId);
    } else {
      newSelected.add(imageId);
    }
    setSelectedImages(newSelected);
  };

  const selectAll = () => {
    setSelectedImages(new Set(allImages.map(img => img.id)));
  };

  const deselectAll = () => {
    setSelectedImages(new Set());
  };

  // Fetch signed/public URLs for all files (both S3 and local)
  // The signed endpoint now returns public URLs for local files and signed URLs for S3 files
  useEffect(() => {
    const fetchSignedUrls = async () => {
      const imagesNeedingUrls = allImages.filter(img => 
        img.s3Key && // Has a storage key (S3 or local)
        !signedUrlCache.has(img.s3Key) // Not already cached
      );
      
      if (imagesNeedingUrls.length === 0) return;

      const newCache = new Map(signedUrlCache);
      
      await Promise.all(
        imagesNeedingUrls.map(async (image) => {
          if (!image.s3Key) return;
          
          try {
            const response = await apiClient.get<{ key: string; url: string; expires_at?: string | null }>(
              `/v1/files/signed?key=${encodeURIComponent(image.s3Key)}`
            );
            // The endpoint returns public URLs for local files and signed URLs for S3 files
            let urlToCache = response.data.url;
            
            // In development, convert absolute URLs to relative paths to use Vite proxy
            if (import.meta.env.DEV && urlToCache.startsWith('http')) {
              try {
                const urlObj = new URL(urlToCache);
                urlToCache = urlObj.pathname; // Extract path (e.g., /storage/inspections/media/...)
              } catch (e) {
                // If URL parsing fails, use as-is
              }
            }
            
            newCache.set(image.s3Key, urlToCache);
          } catch (error) {
            logger.error(`Failed to get URL for ${image.s3Key}`, error, 'ImageDownloadManager');
            // Don't cache failed requests - will retry on next render
          }
        })
      );
      
      if (newCache.size > signedUrlCache.size) {
        setSignedUrlCache(newCache);
      }
    };

    fetchSignedUrls();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allImages]);

  // Get the actual URL for an image (signed/public URL if available, otherwise original)
  const getImageUrl = (image: MediaFile): string => {
    // If we have a direct URL (already signed or public), use it
    if (image.url && (image.url.startsWith('http') || image.url.startsWith('data:'))) {
      return image.url;
    }
    
    // If we have a storage key (S3 or local), try to get URL from cache
    // The signed endpoint now returns public URLs for local files and signed URLs for S3 files
    if (image.s3Key && signedUrlCache.has(image.s3Key)) {
      let cachedUrl = signedUrlCache.get(image.s3Key)!;
      
      // In development, convert absolute URLs to relative paths to use Vite proxy
      if (import.meta.env.DEV && cachedUrl.startsWith('http')) {
        // Extract the path from the URL (e.g., /storage/inspections/media/...)
        try {
          const urlObj = new URL(cachedUrl);
          const path = urlObj.pathname;
          // Use relative path - Vite proxy will handle it
          return path;
        } catch (e) {
          // If URL parsing fails, return as-is
          return cachedUrl;
        }
      }
      
      return cachedUrl;
    }
    
    // If we have a storage key but no URL yet, return placeholder
    if (image.s3Key) {
      return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="150"%3E%3Crect fill="%23f3f4f6" width="200" height="150"/%3E%3Ctext fill="%239ca3af" font-family="sans-serif" font-size="14" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3ELoading...%3C/text%3E%3C/svg%3E';
    }
    
    // Fallback: try to construct URL from image.url (shouldn't happen if storageKey is set)
    const url = image.url || '';
    if (url && !url.startsWith('http') && !url.startsWith('data:')) {
      // Already a relative path, return as-is (Vite proxy handles it in dev)
      return url;
    }
    
    return url || '';
  };

  const downloadImage = async (image: MediaFile): Promise<Blob> => {
    try {
      // Get the actual URL (signed/public URL if available)
      let imageUrl = getImageUrl(image);
      
      // If it's a placeholder, wait a bit for the signed URL to be fetched
      if (imageUrl.startsWith('data:image/svg+xml')) {
        // Wait for signed URL to be fetched (max 3 seconds)
        let attempts = 0;
        while (attempts < 30 && imageUrl.startsWith('data:image/svg+xml')) {
          await new Promise(resolve => setTimeout(resolve, 100));
          imageUrl = getImageUrl(image);
          attempts++;
        }
        
        // If still placeholder, try to fetch URL directly
        if (imageUrl.startsWith('data:image/svg+xml') && image.s3Key) {
          try {
            const response = await apiClient.get<{ key: string; url: string; expires_at?: string | null }>(
              `/v1/files/signed?key=${encodeURIComponent(image.s3Key)}`
            );
            imageUrl = response.data.url;
            
            // In development, convert absolute URLs to relative paths to use Vite proxy
            if (import.meta.env.DEV && imageUrl.startsWith('http')) {
              try {
                const urlObj = new URL(imageUrl);
                imageUrl = urlObj.pathname; // Extract path (e.g., /storage/inspections/media/...)
              } catch (e) {
                // If URL parsing fails, use as-is
              }
            }
            
            // Cache it for future use
            setSignedUrlCache(prev => new Map(prev).set(image.s3Key!, imageUrl));
          } catch (error) {
            logger.error(`Failed to fetch URL for ${image.s3Key}`, error, 'ImageDownloadManager');
            throw new Error(`Failed to get download URL for ${image.name}`);
          }
        }
      }
      
      // If it's a data URL, convert to blob
      if (imageUrl.startsWith('data:')) {
        const response = await fetch(imageUrl);
        return await response.blob();
      }
      
      // In development, use relative paths (Vite proxy handles it)
      // In production, use full URLs
      let fullUrl = imageUrl;
      if (!fullUrl.startsWith('http') && !fullUrl.startsWith('data:')) {
        // Relative path - in development, Vite proxy handles it
        // In production, construct full URL
        if (import.meta.env.DEV) {
          // Already relative, use as-is
          fullUrl = fullUrl.startsWith('/') ? fullUrl : `/${fullUrl}`;
        } else {
          // Production: construct full URL using centralized config
          fullUrl = `${API_ORIGIN}${fullUrl.startsWith('/') ? fullUrl : `/${fullUrl}`}`;
        }
      }
      
      // For images, try fetch first (works for same-origin and CORS-enabled resources)
      // Fall back to img element + canvas if fetch fails (for cross-origin without CORS)
      if (image.type === 'image') {
        try {
          // Try fetch first - works for same-origin and CORS-enabled resources
          // In development, relative paths go through Vite proxy (no CORS issues)
          const response = await fetch(fullUrl, {
            credentials: 'include',
            mode: import.meta.env.DEV ? 'same-origin' : 'cors',
          });
          
          if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
          }
          
          const blob = await response.blob();
          
          // Verify it's an image blob
          if (blob.type && blob.type.startsWith('image/')) {
            return blob;
          }
          
          // If MIME type is wrong, try to fix it based on extension
          const extension = image.name.match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase();
          const mimeTypes: Record<string, string> = {
            'png': 'image/png',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'gif': 'image/gif',
            'webp': 'image/webp',
            'bmp': 'image/bmp',
          };
          
          if (extension && mimeTypes[extension]) {
            return new Blob([blob], { type: mimeTypes[extension] });
          }
          
          return blob;
        } catch (fetchError) {
          // Fallback to img element + canvas for cross-origin without CORS
          logger.warn('Fetch failed, trying img element fallback', fetchError, 'ImageDownloadManager');
          
          return new Promise((resolve, reject) => {
            const img = new Image();
            // In development, relative paths are same-origin (no crossOrigin needed)
            // In production, only use crossOrigin for external URLs
            if (import.meta.env.DEV) {
              img.crossOrigin = undefined; // Same-origin in dev (Vite proxy)
            } else {
              const isExternal = !fullUrl.startsWith(window.location.origin);
              img.crossOrigin = isExternal ? 'anonymous' : undefined;
            }
            
            img.onload = () => {
              try {
                // Create a canvas to convert image to blob
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                
                if (!ctx) {
                  reject(new Error('Failed to get canvas context'));
                  return;
                }
                
                ctx.drawImage(img, 0, 0);
                
                // Convert canvas to blob with correct MIME type
                const extension = image.name.match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase();
                const mimeTypes: Record<string, string> = {
                  'png': 'image/png',
                  'jpg': 'image/jpeg',
                  'jpeg': 'image/jpeg',
                  'gif': 'image/gif',
                  'webp': 'image/webp',
                  'bmp': 'image/bmp',
                };
                
                const mimeType = extension && mimeTypes[extension] 
                  ? mimeTypes[extension] 
                  : 'image/png'; // Default to PNG
                
                canvas.toBlob((blob) => {
                  if (blob) {
                    // Create blob with correct MIME type
                    const typedBlob = new Blob([blob], { type: mimeType });
                    resolve(typedBlob);
                  } else {
                    reject(new Error('Failed to convert image to blob'));
                  }
                }, mimeType);
              } catch (error) {
                reject(error);
              }
            };
            
            img.onerror = (error) => {
              reject(new Error(`Failed to load image: ${fullUrl}`));
            };
            
            img.src = fullUrl;
          });
        }
      }
      
      // For videos, use fetch (videos are less affected by CORB)
      // In development, relative paths go through Vite proxy (no CORS issues)
      const response = await fetch(fullUrl, {
        credentials: 'include',
        mode: import.meta.env.DEV ? 'same-origin' : 'cors',
        headers: {
          'Accept': 'video/*',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch video: ${response.status} ${response.statusText}`);
      }
      
      const blob = await response.blob();
      
      // Verify it's actually a video blob
      if (!blob.type || !blob.type.startsWith('video/')) {
        logger.warn(`Downloaded file ${image.name} is not a video file`, { type: blob.type || 'unknown' }, 'ImageDownloadManager');
        // Try to preserve original type from extension
        const extension = image.name.match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase();
        if (extension) {
          const mimeTypes: Record<string, string> = {
            'mp4': 'video/mp4',
            'webm': 'video/webm',
            'ogg': 'video/ogg',
            'mov': 'video/quicktime',
            'avi': 'video/x-msvideo',
            'mkv': 'video/x-matroska',
          };
          if (mimeTypes[extension]) {
            return new Blob([blob], { type: mimeTypes[extension] });
          }
        }
      }
      
      return blob;
    } catch (error) {
      logger.error(`Error downloading image ${image.name} from ${image.url}`, error, 'ImageDownloadManager');
      throw error;
    }
  };

  const downloadSelected = async () => {
    if (selectedImages.size === 0) return;
    
    setDownloading(true);
    try {
      const imagesToDownload = allImages.filter(img => selectedImages.has(img.id));
      
      if (imagesToDownload.length === 1) {
        // Single image - download directly
        const image = imagesToDownload[0];
        const blob = await downloadImage(image);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = image.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        // Multiple images - create zip
        // Dynamic import for JSZip to handle ES module compatibility
        const JSZipModule = await import('jszip');
        const JSZip = (JSZipModule as any).default || JSZipModule;
        const zip = new JSZip();
        
        for (const image of imagesToDownload) {
          try {
            const blob = await downloadImage(image);
            zip.file(image.name, blob);
          } catch (error) {
            logger.error(`Failed to add ${image.name} to zip`, error, 'ImageDownloadManager');
          }
        }
        
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(zipBlob);
        const a = document.createElement('a');
        a.href = url;
        const vehicleInfo = inspection.vehicle 
          ? `${inspection.vehicle.registration_number || 'vehicle'}_`.replace(/[^a-z0-9]/gi, '_')
          : '';
        a.download = `${vehicleInfo}inspection_${inspection.id.substring(0, 8)}_images.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      logger.error('Error downloading images', error, 'ImageDownloadManager');
      alert('Failed to download images. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const downloadAll = async () => {
    setSelectedImages(new Set(allImages.map(img => img.id)));
    await downloadSelected();
  };

  // Keyboard navigation for preview
  useEffect(() => {
    if (!previewMedia) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPreviewMedia(null);
      } else if (e.key === 'ArrowLeft' && allImages.length > 1) {
        e.preventDefault();
        const newIndex = previewIndex > 0 ? previewIndex - 1 : allImages.length - 1;
        setPreviewIndex(newIndex);
        setPreviewMedia(allImages[newIndex]);
      } else if (e.key === 'ArrowRight' && allImages.length > 1) {
        e.preventDefault();
        const newIndex = previewIndex < allImages.length - 1 ? previewIndex + 1 : 0;
        setPreviewIndex(newIndex);
        setPreviewMedia(allImages[newIndex]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewMedia, previewIndex, allImages]);

  // Reset preview when modal closes
  const handleModalClose = () => {
    setPreviewMedia(null);
    setPreviewIndex(0);
    onClose();
  };

  return (
    <Modal
      isOpen={true}
      onClose={handleModalClose}
      title="Download Inspection Media"
      size="large"
    >
      <div style={{ padding: spacing.lg }}>
        <div style={{ marginBottom: spacing.lg }}>
          <p style={{ ...typography.body, color: colors.neutral[700], marginBottom: spacing.md }}>
            Select images and videos to download. You can download selected media or all media as a ZIP file.
          </p>
          
          <div style={{ display: 'flex', gap: spacing.sm, marginBottom: spacing.md }}>
            <Button
              variant="secondary"
              size="small"
              onClick={selectAll}
            >
              Select All
            </Button>
            <Button
              variant="secondary"
              size="small"
              onClick={deselectAll}
            >
              Deselect All
            </Button>
            <div style={{ flex: 1 }} />
            <Button
              variant="primary"
              onClick={downloadSelected}
              disabled={selectedImages.size === 0 || downloading}
            >
              {downloading ? 'Downloading...' : `Download Selected (${selectedImages.size})`}
            </Button>
            <Button
              variant="primary"
              onClick={downloadAll}
              disabled={downloading || allImages.length === 0}
            >
              Download All ({allImages.length})
            </Button>
          </div>
        </div>

        {allImages.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: spacing.xl,
            color: colors.neutral[600]
          }}>
            <div style={{ fontSize: '3rem', marginBottom: spacing.md }}>📷🎥</div>
            <div style={typography.body}>No images or videos found in this inspection.</div>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: spacing.md,
            maxHeight: '60vh',
            overflowY: 'auto',
            padding: spacing.sm,
          }}>
            {allImages.map((image, idx) => (
              <div
                key={image.id}
                style={{
                  position: 'relative',
                  cursor: 'pointer',
                  border: `2px solid ${selectedImages.has(image.id) ? colors.primary : colors.neutral[200]}`,
                  borderRadius: '8px',
                  overflow: 'hidden',
                  backgroundColor: colors.neutral[50],
                  transition: 'all 0.2s',
                  opacity: selectedImages.has(image.id) ? 1 : 0.8,
                }}
                onDoubleClick={(e) => {
                  // Double-click to open preview (prevents accidental opening)
                  const target = e.target as HTMLElement;
                  if (!target.closest('[data-select-area]')) {
                    e.stopPropagation();
                    setPreviewMedia(image);
                    setPreviewIndex(idx);
                  }
                }}
                onClick={(e) => {
                  // Single click only toggles selection if clicking on selection area
                  const target = e.target as HTMLElement;
                  if (target.closest('[data-select-area]')) {
                    e.stopPropagation();
                    toggleImage(image.id);
                  }
                  // Otherwise, clicking on the container does nothing
                }}
              >
                <div
                  data-select-area
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleImage(image.id);
                  }}
                  style={{
                    position: 'absolute',
                    top: spacing.xs,
                    right: spacing.xs,
                    backgroundColor: selectedImages.has(image.id) ? colors.primary : colors.neutral[300],
                    color: 'white',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    zIndex: 10,
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                  }}
                >
                  {selectedImages.has(image.id) ? '✓' : '+'}
                </div>
                <div style={{
                  position: 'absolute',
                  top: spacing.xs,
                  left: spacing.xs,
                  display: 'flex',
                  gap: spacing.xs,
                  zIndex: 5,
                }}>
                  <div style={{
                    backgroundColor: image.type === 'video' ? colors.primary : 'transparent',
                    color: 'white',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontWeight: 600,
                  }}>
                    {image.type === 'video' ? '🎥' : '📷'}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewMedia(image);
                      setPreviewIndex(idx);
                    }}
                    style={{
                      backgroundColor: 'rgba(0, 0, 0, 0.6)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '2px 6px',
                      fontSize: '10px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '2px',
                    }}
                    title="Preview (or double-click)"
                  >
                    👁️
                  </button>
                </div>
                {image.type === 'video' ? (
                  <video
                    src={getImageUrl(image)}
                    style={{
                      width: '100%',
                      height: '150px',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                    muted
                    onError={(e) => {
                      const video = e.target as HTMLVideoElement;
                      video.style.display = 'none';
                      const errorDiv = document.createElement('div');
                      errorDiv.textContent = 'Video not found';
                      errorDiv.style.cssText = 'width: 100%; height: 150px; display: flex; align-items: center; justify-content: center; background: #ddd; color: #999; font-size: 12px;';
                      video.parentElement?.appendChild(errorDiv);
                    }}
                  />
                ) : (
                  <a
                    href={getImageUrl(image)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: 'block', width: '100%', height: '150px', textDecoration: 'none' }}
                  >
                    <img
                      src={getImageUrl(image)}
                      alt={image.name}
                      // Only use crossOrigin in production (when not using proxy)
                      crossOrigin={import.meta.env.PROD ? "anonymous" : undefined}
                      style={{
                        width: '100%',
                        height: '150px',
                        objectFit: 'cover',
                        display: 'block',
                      }}
                      onError={(e) => {
                        const img = e.target as HTMLImageElement;
                        // In dev, proxy should handle auth, so no need for crossOrigin
                        // In prod, try without crossOrigin if it fails
                        if (import.meta.env.PROD && img.crossOrigin === 'anonymous') {
                          img.crossOrigin = null;
                          img.src = getImageUrl(image);
                        } else {
                          img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="150"%3E%3Crect fill="%23ddd" width="200" height="150"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="14" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage not found%3C/text%3E%3C/svg%3E';
                        }
                      }}
                    />
                  </a>
                )}
                <div style={{
                  padding: spacing.xs,
                  fontSize: '12px',
                  color: colors.neutral[700],
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {image.name}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Image Viewer with Pinch-to-Zoom - Only for images, not videos */}
      {previewMedia && previewMedia.type === 'image' && (
        <ImageViewer
          images={allImages
            .filter(img => img.type === 'image')
            .map((img) => ({
              id: img.id,
              url: getImageUrl(img),
              alt: img.name || img.questionText,
            }))}
          initialIndex={allImages
            .filter(img => img.type === 'image')
            .findIndex(img => img.id === previewMedia.id)}
          isOpen={!!previewMedia}
          onClose={() => setPreviewMedia(null)}
          onImageChange={(index) => {
            const imageOnlyImages = allImages.filter(img => img.type === 'image');
            if (imageOnlyImages[index]) {
              setPreviewIndex(allImages.findIndex(img => img.id === imageOnlyImages[index].id));
              setPreviewMedia(imageOnlyImages[index]);
            }
          }}
        />
      )}

      {/* Legacy Preview Modal (fallback for videos) */}
      {previewMedia && previewMedia.type === 'video' && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: spacing.xl,
          }}
          onClick={() => setPreviewMedia(null)}
        >
          {/* Close Button */}
          <button
            onClick={() => setPreviewMedia(null)}
            style={{
              position: 'absolute',
              top: spacing.lg,
              right: spacing.lg,
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              fontSize: '24px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10001,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
            }}
          >
            ×
          </button>

          {/* Navigation Buttons */}
          {allImages.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const newIndex = previewIndex > 0 ? previewIndex - 1 : allImages.length - 1;
                  setPreviewIndex(newIndex);
                  setPreviewMedia(allImages[newIndex]);
                }}
                style={{
                  position: 'absolute',
                  left: spacing.lg,
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '50px',
                  height: '50px',
                  fontSize: '24px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 10001,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                }}
              >
                ‹
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const newIndex = previewIndex < allImages.length - 1 ? previewIndex + 1 : 0;
                  setPreviewIndex(newIndex);
                  setPreviewMedia(allImages[newIndex]);
                }}
                style={{
                  position: 'absolute',
                  right: spacing.lg,
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '50px',
                  height: '50px',
                  fontSize: '24px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 10001,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                }}
              >
                ›
              </button>
            </>
          )}

          {/* Media Preview */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '90vw',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: spacing.md,
            }}
          >
            {previewMedia.type === 'video' ? (
              <video
                src={getImageUrl(previewMedia)}
                controls
                autoPlay
                style={{
                  maxWidth: '100%',
                  maxHeight: '80vh',
                  borderRadius: '8px',
                }}
              />
            ) : (
              <img
                src={getImageUrl(previewMedia)}
                alt={previewMedia.name}
                style={{
                  maxWidth: '100%',
                  maxHeight: '80vh',
                  objectFit: 'contain',
                  borderRadius: '8px',
                }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="600"%3E%3Crect fill="%23ddd" width="800" height="600"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="24" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage not found%3C/text%3E%3C/svg%3E';
                }}
              />
            )}
            
            {/* Media Info */}
            <div style={{
              color: 'white',
              textAlign: 'center',
              padding: spacing.md,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              borderRadius: '8px',
              maxWidth: '600px',
            }}>
              <div style={{ ...typography.body, fontWeight: 600, marginBottom: spacing.xs }}>
                {previewMedia.name}
              </div>
              <div style={{ ...typography.bodySmall, opacity: 0.8 }}>
                {previewMedia.questionText}
              </div>
              {allImages.length > 1 && (
                <div style={{ ...typography.bodySmall, opacity: 0.6, marginTop: spacing.xs }}>
                  {previewIndex + 1} of {allImages.length}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};


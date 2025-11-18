import React, { useState, useMemo, useEffect } from 'react';
import { colors, typography, spacing } from '../../lib/theme';
import { Button } from '../ui/button';
import { Modal } from '../ui/Modal';
import JSZip from 'jszip';

interface MediaFile {
  id: string;
  url: string;
  name: string;
  questionText: string;
  answerId: string;
  type: 'image' | 'video';
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
          
          // Construct URL - files stored in public storage
          // Laravel stores files with path like "inspections/media/filename.jpg"
          // Files are accessible via the API server's /storage/ path
          let imageUrl = file.url || file.path;
          if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('data:')) {
            // Get API origin for constructing full URLs
            const apiOrigin = import.meta.env.VITE_API_ORIGIN || 
              (import.meta.env.PROD ? "https://inspectmymachine.in" : "http://localhost:8000");
            
            // If it's a relative path, prepend storage URL
            // Laravel stores files in storage/app/public/inspections/media/
            // They're accessible via API server's /storage/inspections/media/filename
            let storagePath = '';
            if (imageUrl.startsWith('inspections/')) {
              storagePath = `/storage/${imageUrl}`;
            } else if (imageUrl.includes('/')) {
              // Already has path structure
              storagePath = imageUrl.startsWith('/') ? imageUrl : `/storage/${imageUrl}`;
            } else {
              // Just filename, assume it's in inspections/media
              storagePath = `/storage/inspections/media/${imageUrl}`;
            }
            
            // Construct full URL using API origin
            imageUrl = `${apiOrigin}${storagePath}`;
          }
          
          // If still no URL, skip this file
          if (!imageUrl) {
            return; // Skip files without URL
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
            url: imageUrl || '',
            name: fileName,
            questionText: answer.question?.question_text || 'Unknown Question',
            answerId: answer.id,
            type: mediaType,
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

  const downloadImage = async (image: MediaFile): Promise<Blob> => {
    try {
      // If it's a data URL, convert to blob
      if (image.url.startsWith('data:')) {
        const response = await fetch(image.url);
        return await response.blob();
      }
      
      // Image URL should already be a full URL (constructed with API origin)
      // But handle case where it might still be relative
      let fullUrl = image.url;
      if (!fullUrl.startsWith('http') && !fullUrl.startsWith('data:')) {
        // Fallback: construct full URL if somehow still relative
        const apiOrigin = import.meta.env.VITE_API_ORIGIN || 
          (import.meta.env.PROD ? "https://inspectmymachine.in" : "http://localhost:8000");
        fullUrl = fullUrl.startsWith('/') ? `${apiOrigin}${fullUrl}` : `${apiOrigin}/${fullUrl}`;
      }
      
      // Fetch from URL with proper headers
      const response = await fetch(fullUrl, {
        credentials: 'include',
        mode: 'cors',
        headers: {
          'Accept': image.type === 'image' ? 'image/*' : 'video/*',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }
      
      const blob = await response.blob();
      
      // Verify it's actually a media blob (image or video)
      const expectedType = image.type === 'image' ? 'image/' : 'video/';
      if (!blob.type || (!blob.type.startsWith('image/') && !blob.type.startsWith('video/'))) {
        console.warn(`Downloaded file ${image.name} is not a media file (type: ${blob.type || 'unknown'})`);
        // If blob type is wrong but we know it should be media, try to preserve original type
        const extension = image.name.match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase();
        if (extension) {
          const mimeTypes: Record<string, string> = {
            // Images
            'png': 'image/png',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'gif': 'image/gif',
            'webp': 'image/webp',
            'bmp': 'image/bmp',
            // Videos
            'mp4': 'video/mp4',
            'webm': 'video/webm',
            'ogg': 'video/ogg',
            'mov': 'video/quicktime',
            'avi': 'video/x-msvideo',
            'mkv': 'video/x-matroska',
          };
          if (mimeTypes[extension]) {
            // Create a new blob with correct MIME type
            return new Blob([blob], { type: mimeTypes[extension] });
          }
        }
      }
      
      return blob;
    } catch (error) {
      console.error(`Error downloading image ${image.name} from ${image.url}:`, error);
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
        const zip = new JSZip();
        
        for (const image of imagesToDownload) {
          try {
            const blob = await downloadImage(image);
            zip.file(image.name, blob);
          } catch (error) {
            console.error(`Failed to add ${image.name} to zip:`, error);
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
      console.error('Error downloading images:', error);
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

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
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
                onClick={(e) => {
                  // If clicking on the selection area (not the media itself), toggle selection
                  const target = e.target as HTMLElement;
                  if (target.closest('[data-select-area]')) {
                    toggleImage(image.id);
                  } else {
                    // Otherwise, open preview
                    setPreviewMedia(image);
                    setPreviewIndex(idx);
                  }
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
                  backgroundColor: image.type === 'video' ? colors.primary : 'transparent',
                  color: 'white',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: '10px',
                  fontWeight: 600,
                  zIndex: 5,
                }}>
                  {image.type === 'video' ? '🎥' : '📷'}
                </div>
                {image.type === 'video' ? (
                  <video
                    src={image.url}
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
                  <img
                    src={image.url}
                    alt={image.name}
                    style={{
                      width: '100%',
                      height: '150px',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="150"%3E%3Crect fill="%23ddd" width="200" height="150"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="14" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage not found%3C/text%3E%3C/svg%3E';
                    }}
                  />
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

      {/* Preview Modal */}
      {previewMedia && (
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
                src={previewMedia.url}
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
                src={previewMedia.url}
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


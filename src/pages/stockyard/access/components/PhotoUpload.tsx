import React, { useRef, useState } from 'react';
import { X } from 'lucide-react';
import { useToast } from '@/providers/ToastProvider';
import { colors, spacing, borderRadius, shadows } from '@/lib/theme';
import { DenseGrid } from '@/components/ui/ResponsiveGrid';

// 📸 PhotoUpload Component
// Handles photo uploads with preview - works on mobile camera and desktop file picker
// Think of it like the Instagram photo picker!

interface PhotoUploadProps {
  label: string;
  multiple?: boolean;
  required?: boolean;
  onPhotosChange: (files: File[]) => void;
  maxPhotos?: number;
  hint?: string;
}

export const PhotoUpload: React.FC<PhotoUploadProps> = ({
  label,
  multiple = false,
  required = false,
  onPhotosChange,
  maxPhotos = 5,
  hint
}) => {
  const { showToast } = useToast();
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<number, number>>({});
  const [uploading, setUploading] = useState<Record<number, boolean>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length === 0) return;

    // Check max photos limit
    const currentCount = previews.length;
    if (multiple && (currentCount + files.length) > maxPhotos) {
      showToast({
        title: 'Limit Exceeded',
        description: `Maximum ${maxPhotos} photos allowed. You can add ${maxPhotos - currentCount} more.`,
        variant: 'error',
      });
      return;
    }

    // Simulate upload progress for each file
    const newFiles = multiple ? files : [files[0]];
    const startIndex = previews.length;
    
    newFiles.forEach((file, index) => {
      const fileIndex = startIndex + index;
      setUploading(prev => ({ ...prev, [fileIndex]: true }));
      setUploadProgress(prev => ({ ...prev, [fileIndex]: 0 }));
      
      // Simulate progress
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setUploadProgress(prev => ({ ...prev, [fileIndex]: progress }));
        
        if (progress >= 100) {
          clearInterval(interval);
          setUploading(prev => ({ ...prev, [fileIndex]: false }));
        }
      }, 50);
    });

    // Create preview URLs for images
    const newPreviews = newFiles.map(file => URL.createObjectURL(file));
    setPreviews(multiple ? [...previews, ...newPreviews].slice(0, maxPhotos) : newPreviews);

    // Send files back to parent component
    onPhotosChange(multiple ? [...Array.from(fileInputRef.current?.files || []), ...newFiles].slice(0, maxPhotos) : newFiles);
  };

  const removePhoto = (index: number) => {
    // Revoke object URL to free memory
    URL.revokeObjectURL(previews[index]);
    
    const newPreviews = previews.filter((_, i) => i !== index);
    setPreviews(newPreviews);
    
    // Update upload state
    const newUploading = { ...uploading };
    const newProgress = { ...uploadProgress };
    delete newUploading[index];
    delete newProgress[index];
    setUploading(newUploading);
    setUploadProgress(newProgress);
    
    // Notify parent - need to get current files and remove the one at index
    // For now, just clear all and let user re-upload
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onPhotosChange([]);
  };

  return (
    <div className="photo-upload-container" style={{ marginBottom: '1.5rem' }}>
      <label style={{ 
        display: 'block', 
        fontSize: '0.875rem', 
        fontWeight: 500,
        marginBottom: '0.5rem',
        color: '#374151'
      }}>
        {label} {required && <span style={{ color: '#EF4444' }}>*</span>}
      </label>

      {hint && (
        <p style={{ 
          fontSize: '0.75rem', 
          color: '#6B7280', 
          marginBottom: '0.5rem' 
        }}>
          💡 {hint}
        </p>
      )}

      {/* Upload Button */}
      <div
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: '2px dashed #D1D5DB',
          borderRadius: '8px',
          padding: '2rem',
          textAlign: 'center',
          cursor: 'pointer',
          backgroundColor: '#F9FAFB',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = '#3B82F6';
          e.currentTarget.style.backgroundColor = '#EFF6FF';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = '#D1D5DB';
          e.currentTarget.style.backgroundColor = '#F9FAFB';
        }}
      >
        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📷</div>
        <div style={{ fontSize: '0.875rem', color: '#374151', fontWeight: 500 }}>
          Tap to {multiple ? 'upload photos' : 'upload photo'}
        </div>
        <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '0.25rem' }}>
          Or take photo with camera
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        capture="environment"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      {/* Photo Previews */}
      {previews.length > 0 && (
        <DenseGrid gap="md" style={{ marginTop: spacing.md }}>
          {previews.map((preview, index) => {
            const isUploading = uploading[index];
            const progress = uploadProgress[index] || 0;
            
            return (
              <div 
                key={index} 
                style={{ 
                  position: 'relative',
                  backgroundColor: colors.neutral[50],
                  borderRadius: borderRadius.md,
                  overflow: 'hidden',
                  border: `1px solid ${colors.neutral[200]}`
                }}
              >
                {/* Thumbnail */}
                <img
                  src={preview}
                  alt={`Preview ${index + 1}`}
                  style={{
                    width: '100%',
                    height: '120px',
                    objectFit: 'cover',
                    display: 'block'
                  }}
                />
                
                {/* Progress Bar */}
                {isUploading && (
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    backgroundColor: colors.neutral[200],
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${progress}%`,
                      backgroundColor: colors.primary,
                      transition: 'width 0.3s ease',
                    }} />
                  </div>
                )}
                
                {/* Delete Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removePhoto(index);
                  }}
                  aria-label={`Remove photo ${index + 1}`}
                  style={{
                    position: 'absolute',
                    top: spacing.xs,
                    right: spacing.xs,
                    backgroundColor: colors.error[500],
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    minWidth: '32px',
                    minHeight: '32px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: shadows.sm,
                    transition: 'transform 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            );
          })}
        </DenseGrid>
      )}
    </div>
  );
};
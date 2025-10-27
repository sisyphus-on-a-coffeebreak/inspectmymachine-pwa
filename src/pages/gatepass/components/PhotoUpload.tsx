import React, { useRef, useState } from 'react';

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
  const [previews, setPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length === 0) return;

    // Check max photos limit
    if (multiple && files.length > maxPhotos) {
      alert(`Maximum ${maxPhotos} photos allowed`);
      return;
    }

    // Create preview URLs for images
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPreviews(multiple ? [...previews, ...newPreviews].slice(0, maxPhotos) : newPreviews);

    // Send files back to parent component
    onPhotosChange(multiple ? files : [files[0]]);
  };

  const removePhoto = (index: number) => {
    const newPreviews = previews.filter((_, i) => i !== index);
    setPreviews(newPreviews);
    
    // Clear file input and notify parent
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
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
          gap: '0.5rem',
          marginTop: '1rem'
        }}>
          {previews.map((preview, index) => (
            <div key={index} style={{ position: 'relative' }}>
              <img
                src={preview}
                alt={`Preview ${index + 1}`}
                style={{
                  width: '100%',
                  height: '100px',
                  objectFit: 'cover',
                  borderRadius: '4px',
                  border: '1px solid #E5E7EB'
                }}
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removePhoto(index);
                }}
                style={{
                  position: 'absolute',
                  top: '4px',
                  right: '4px',
                  backgroundColor: '#EF4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
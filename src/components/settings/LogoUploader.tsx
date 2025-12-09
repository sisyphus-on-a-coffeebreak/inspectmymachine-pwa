import React, { useRef, useState } from 'react';
import { colors, spacing, borderRadius, shadows, typography } from '../../lib/theme';
import { Button } from '../ui/button';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

export interface LogoUploaderProps {
  currentLogoUrl: string | null;
  onUpload: (file: File) => Promise<void>;
  onRemove: () => Promise<void>;
  disabled?: boolean;
}

export const LogoUploader: React.FC<LogoUploaderProps> = ({
  currentLogoUrl,
  onUpload,
  onRemove,
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentLogoUrl);
  const [dragActive, setDragActive] = useState(false);

  const handleFileSelect = async (file: File) => {
    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a PNG, JPG, or SVG file');
      return;
    }

    // Validate file size (1MB max)
    if (file.size > 1024 * 1024) {
      alert('File size must be less than 1MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload
    try {
      setUploading(true);
      await onUpload(file);
    } catch (error) {
      console.error('Upload error:', error);
      setPreview(currentLogoUrl);
      alert('Failed to upload logo. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleRemove = async () => {
    if (disabled || !confirm('Are you sure you want to remove the logo?')) {
      return;
    }

    try {
      setUploading(true);
      await onRemove();
      setPreview(null);
    } catch (error) {
      console.error('Remove error:', error);
      alert('Failed to remove logo. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ width: '100%' }}>
      <label style={{ ...typography.label, marginBottom: spacing.sm, display: 'block' }}>
        Company Logo
      </label>
      <p style={{ ...typography.caption, color: colors.neutral[600], marginBottom: spacing.md }}>
        Recommended size: 300x100px. Max file size: 1MB. Formats: PNG, JPG, SVG
      </p>

      {preview ? (
        <div
          style={{
            position: 'relative',
            display: 'inline-block',
            border: `2px solid ${colors.neutral[200]}`,
            borderRadius: borderRadius.md,
            padding: spacing.md,
            backgroundColor: colors.neutral[50],
          }}
        >
          <img
            src={preview}
            alt="Company logo"
            style={{
              maxWidth: '300px',
              maxHeight: '100px',
              objectFit: 'contain',
              display: 'block',
            }}
          />
          {!disabled && (
            <button
              onClick={handleRemove}
              disabled={uploading}
              style={{
                position: 'absolute',
                top: spacing.xs,
                right: spacing.xs,
                background: colors.error[500],
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '28px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: uploading ? 'not-allowed' : 'pointer',
                opacity: uploading ? 0.5 : 1,
              }}
              aria-label="Remove logo"
            >
              <X size={16} />
            </button>
          )}
        </div>
      ) : (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={handleClick}
          style={{
            border: `2px dashed ${dragActive ? colors.primary : colors.neutral[300]}`,
            borderRadius: borderRadius.md,
            padding: spacing.xl,
            textAlign: 'center',
            cursor: disabled ? 'not-allowed' : 'pointer',
            backgroundColor: dragActive ? colors.neutral[50] : 'white',
            transition: 'all 0.2s',
            opacity: disabled ? 0.6 : 1,
          }}
        >
          <Upload
            size={48}
            color={colors.neutral[400]}
            style={{ marginBottom: spacing.sm }}
          />
          <p style={{ ...typography.body, color: colors.neutral[700], marginBottom: spacing.xs }}>
            {dragActive ? 'Drop logo here' : 'Click to upload or drag and drop'}
          </p>
          <p style={{ ...typography.caption, color: colors.neutral[500] }}>
            PNG, JPG, or SVG (max 1MB)
          </p>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/svg+xml"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            handleFileSelect(file);
          }
        }}
        disabled={disabled}
      />

      {uploading && (
        <p style={{ ...typography.caption, color: colors.neutral[600], marginTop: spacing.sm }}>
          {preview ? 'Removing...' : 'Uploading...'}
        </p>
      )}
    </div>
  );
};



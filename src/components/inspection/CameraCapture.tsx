import React, { useState, useRef } from 'react';
import { colors, spacing } from '../../lib/theme';
import { Button } from '../ui/button';

interface CameraCaptureProps {
  value?: any[];
  onChange: (files: any[]) => void;
  maxFiles?: number;
  maxSize?: string;
  disabled?: boolean;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({
  value = [],
  onChange,
  maxFiles = 5,
  maxSize = '5MB',
  disabled = false
}) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleCameraCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      setIsCapturing(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Wait for video to be ready
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(console.error);
        };
      }
    } catch (error) {
      console.error('Camera access denied:', error);
      alert('Camera access is required for photo capture. Please allow camera permissions.');
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');
      
      if (!context) {
        console.error('Could not get canvas context');
        return;
      }
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
          const newFiles = [...value, file];
          onChange(newFiles);
          
          // Provide feedback
          console.log('Photo captured successfully');
        } else {
          console.error('Failed to create blob from canvas');
        }
      }, 'image/jpeg', 0.8);
      
      stopCamera();
    } else {
      console.error('Video or canvas element not available');
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCapturing(false);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const newFiles = [...value, ...files];
    onChange(newFiles);
  };

  const removeFile = (index: number) => {
    const newFiles = value.filter((_, i) => i !== index);
    onChange(newFiles);
  };

  return (
    <div>
      {/* Camera Interface */}
      {isCapturing && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'black',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '500px' }}>
            <video
              ref={videoRef}
              style={{ 
                width: '100%', 
                height: 'auto', 
                maxHeight: '70vh',
                borderRadius: '8px'
              }}
              playsInline
              autoPlay
              muted
            />
            
            {/* Camera overlay frame */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '80%',
              height: '60%',
              border: '2px solid white',
              borderRadius: '8px',
              pointerEvents: 'none'
            }} />
          </div>
          
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          
          <div style={{ 
            display: 'flex', 
            gap: spacing.md, 
            marginTop: spacing.lg,
            backgroundColor: 'rgba(0,0,0,0.7)',
            padding: spacing.md,
            borderRadius: '8px'
          }}>
            <Button variant="secondary" onClick={stopCamera}>
              ❌ Cancel
            </Button>
            <Button variant="primary" onClick={capturePhoto}>
              📸 Capture Photo
            </Button>
          </div>
        </div>
      )}

      {/* Upload Interface */}
      <div style={{ display: 'flex', gap: spacing.sm, marginBottom: spacing.md }}>
        <Button
          variant="primary"
          onClick={handleCameraCapture}
          disabled={disabled}
        >
          📷 Take Photo
        </Button>
        
        <Button
          variant="secondary"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
        >
          📁 Upload from Gallery
        </Button>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />
      </div>

      {/* File List */}
      {value.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: spacing.sm }}>
          {value.map((file, index) => (
            <div key={index} style={{
              position: 'relative',
              backgroundColor: colors.neutral[100],
              borderRadius: '8px',
              overflow: 'hidden'
            }}>
              <img
                src={file instanceof File ? URL.createObjectURL(file) : file.url}
                alt={`Photo ${index + 1}`}
                style={{ width: '100%', height: '120px', objectFit: 'cover' }}
              />
              <button
                onClick={() => removeFile(index)}
                style={{
                  position: 'absolute',
                  top: '4px',
                  right: '4px',
                  backgroundColor: colors.status.critical,
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  cursor: 'pointer'
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <p style={{ fontSize: '12px', color: colors.neutral[500], marginTop: spacing.sm }}>
        Max {maxFiles} files, {maxSize} each
      </p>
    </div>
  );
};

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { colors, typography, spacing, borderRadius } from '../../lib/theme';
import jsQR from 'jsqr';

interface QRScannerProps {
  onScan: (data: string) => void;
  onError?: (error: string) => void;
  onClose?: () => void;
  title?: string;
  hint?: string;
  className?: string;
  autoStart?: boolean;
}

export const QRScanner: React.FC<QRScannerProps> = ({
  onScan,
  onError,
  onClose,
  title = 'Scan QR Code',
  hint = 'Point camera at QR code',
  className = '',
  autoStart = true
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);
  const detectorRef = useRef<any | null>(null);
  const isDetectingRef = useRef(false);

  const stopScanning = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    setIsScanning(false);
    isDetectingRef.current = false;
    onClose?.();
  }, [onClose]);

  // Single unified detection function - no circular dependencies
  const detectFrame = useCallback(() => {
    if (!isScanning || !videoRef.current || !canvasRef.current) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx || video.readyState < 2) {
      animationRef.current = requestAnimationFrame(detectFrame);
      return;
    }

    // Skip if already processing
    if (isDetectingRef.current) {
      animationRef.current = requestAnimationFrame(detectFrame);
      return;
    }

    isDetectingRef.current = true;

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Get image data for QR detection
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    // Try BarcodeDetector first (faster, if available)
    if (detectorRef.current) {
      detectorRef.current.detect(video)
        .then((codes: any[]) => {
          isDetectingRef.current = false;
          if (codes && codes.length > 0) {
            onScan(codes[0].rawValue);
            stopScanning();
            return;
          }
          // Continue scanning
          animationRef.current = requestAnimationFrame(detectFrame);
        })
        .catch(() => {
          // Fallback to jsQR on BarcodeDetector error
          try {
            const code = jsQR(imageData.data, imageData.width, imageData.height);
            if (code) {
              onScan(code.data);
              stopScanning();
              return;
            }
          } catch (err) {
            console.warn('jsQR detection error:', err);
          } finally {
            isDetectingRef.current = false;
          }
          // Continue scanning
          animationRef.current = requestAnimationFrame(detectFrame);
        });
    } else {
      // Use jsQR directly if BarcodeDetector not available
      try {
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code) {
          onScan(code.data);
          stopScanning();
          return;
        }
      } catch (err) {
        console.warn('jsQR detection error:', err);
      } finally {
        isDetectingRef.current = false;
      }
      // Continue scanning
      animationRef.current = requestAnimationFrame(detectFrame);
    }
  }, [isScanning, onScan, stopScanning]);

  const startScanning = useCallback(async () => {
    try {
      setError(null);
      setIsScanning(true);

      // Initialize BarcodeDetector if available
      if ('BarcodeDetector' in window) {
        try {
          detectorRef.current = new (window as any).BarcodeDetector({ 
            formats: ['qr_code'] 
          });
        } catch (err) {
          console.warn('BarcodeDetector not supported:', err);
          detectorRef.current = null;
        }
      }

      // Get camera stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Start detection loop
      animationRef.current = requestAnimationFrame(detectFrame);
    } catch (err) {
      const errorMessage = 'Camera access denied. Please allow camera permissions.';
      setError(errorMessage);
      onError?.(errorMessage);
      setIsScanning(false);
    }
  }, [onError, detectFrame]);

  // Handle manual entry
  const handleManualEntry = useCallback(() => {
    const code = prompt('Enter access code manually:');
    if (code && code.trim()) {
      onScan(code.trim());
      stopScanning();
    }
  }, [onScan, stopScanning]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        stopScanning();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [stopScanning]);

  // Auto-start scanning
  useEffect(() => {
    if (autoStart) {
      startScanning();
    }
    
    return () => {
      stopScanning();
    };
  }, [autoStart, startScanning, stopScanning]);

  const scannerStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg
  };

  const headerStyle: React.CSSProperties = {
    position: 'absolute',
    top: spacing.lg,
    left: spacing.lg,
    right: spacing.lg,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 1001
  };

  const closeButtonStyle: React.CSSProperties = {
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    border: 'none',
    color: 'white',
    fontSize: '20px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease'
  };

  const videoContainerStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    maxWidth: '400px',
    aspectRatio: '4/3',
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: 'black',
    border: '2px solid rgba(255, 255, 255, 0.3)'
  };

  const videoStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    backgroundColor: 'black'
  };

  const targetStyle: React.CSSProperties = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '200px',
    height: '200px',
    border: '2px solid rgba(255, 255, 255, 0.8)',
    borderRadius: borderRadius.lg,
    pointerEvents: 'none',
    animation: 'pulse 1.5s infinite'
  };

  const hintStyle: React.CSSProperties = {
    ...typography.body,
    color: 'white',
    textAlign: 'center',
    marginTop: spacing.lg,
    padding: `0 ${spacing.lg}`
  };

  const errorStyle: React.CSSProperties = {
    ...typography.body,
    color: colors.critical,
    textAlign: 'center',
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: borderRadius.md,
    border: `1px solid ${colors.critical}`
  };

  const manualEntryStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: spacing.xl,
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 1001
  };

  const startButtonStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: '120px',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: `${spacing.md} ${spacing.xl}`,
    backgroundColor: colors.primary,
    color: 'white',
    border: 'none',
    borderRadius: borderRadius.md,
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  };

  return (
    <div style={scannerStyle} className={className}>
      <div style={headerStyle}>
        <h2 style={{ 
          ...typography.header, 
          color: 'white', 
          margin: 0,
          fontSize: '20px'
        }}>
          {title}
        </h2>
        <button
          style={closeButtonStyle}
          onClick={stopScanning}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
          }}
          aria-label="Close scanner"
        >
          ✕
        </button>
      </div>

      <div style={videoContainerStyle}>
        <video
          ref={videoRef}
          style={videoStyle}
          autoPlay
          playsInline
          muted
        />
        <div style={targetStyle} className="qr-target" />
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>

      {error ? (
        <div style={errorStyle}>
          ⚠️ {error}
        </div>
      ) : (
        <div style={hintStyle}>
          💡 {hint}
        </div>
      )}

      <div style={manualEntryStyle}>
        <button
          style={{
            width: '100%',
            padding: spacing.md,
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: borderRadius.md,
            color: 'white',
            fontSize: '16px',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onClick={handleManualEntry}
        >
          ⌨️ Enter Access Code Instead
        </button>
      </div>

      {!isScanning && !error && (
        <button
          style={startButtonStyle}
          onClick={startScanning}
        >
          📷 Start Camera
        </button>
      )}
    </div>
  );
};

export default QRScanner;

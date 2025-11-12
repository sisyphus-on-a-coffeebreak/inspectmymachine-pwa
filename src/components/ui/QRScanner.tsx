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
  onManualEntry?: (code: string) => void;
}

export const QRScanner: React.FC<QRScannerProps> = ({
  onScan,
  onError,
  onClose,
  title = 'Scan QR Code',
  hint = 'Point camera at QR code',
  className = '',
  autoStart = true,
  onManualEntry
}) => {
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);
  const detectorRef = useRef<any | null>(null);
  const isDetectingRef = useRef(false);

  // Extract QR data - handles URLs with tokens or direct codes
  const extractQRData = useCallback((scannedData: string): string => {
    // If it's a URL, try to extract the token parameter
    if (scannedData.startsWith('http://') || scannedData.startsWith('https://')) {
      try {
        const url = new URL(scannedData);
        const token = url.searchParams.get('token');
        if (token) {
          return token;
        }
        // If no token param, return the full URL (backend will handle it)
        return scannedData;
      } catch {
        // Invalid URL, return as-is
        return scannedData;
      }
    }
    // If it's a token-like string (32 chars alphanumeric), return as-is
    if (/^[a-zA-Z0-9]{32}$/.test(scannedData)) {
      return scannedData;
    }
    // Otherwise return as-is (could be access code or other format)
    return scannedData;
  }, []);

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
            const scannedData = codes[0].rawValue;
            const processedData = extractQRData(scannedData);
            onScan(processedData);
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
              const processedData = extractQRData(code.data);
              onScan(processedData);
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
          const processedData = extractQRData(code.data);
          onScan(processedData);
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
  }, [isScanning, onScan, stopScanning, extractQRData]);

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

      // Try to get camera stream - try environment (back camera) first, then user (front camera)
      let stream: MediaStream | null = null;
      let error: Error | null = null;

      // First try: environment (back camera on mobile, rear on some laptops)
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });
      } catch (envError) {
        console.warn('Environment camera not available, trying user camera:', envError);
        error = envError as Error;
        
        // Second try: user (front camera on mobile, built-in on laptops)
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { 
              facingMode: 'user',
              width: { ideal: 1280 },
              height: { ideal: 720 }
            }
          });
          error = null;
        } catch (userError) {
          console.warn('User camera not available, trying any camera:', userError);
          
          // Third try: any available camera (no facingMode constraint)
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              video: { 
                width: { ideal: 1280 },
                height: { ideal: 720 }
              }
            });
            error = null;
          } catch (anyError) {
            error = anyError as Error;
          }
        }
      }

      if (!stream) {
        throw error || new Error('No camera available');
      }

      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Start detection loop
      animationRef.current = requestAnimationFrame(detectFrame);
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message.includes('permission') 
          ? 'Camera access denied. Please allow camera permissions in your browser settings.'
          : err.message.includes('not found') || err.message.includes('not available')
          ? 'No camera found. Please connect a camera and try again.'
          : 'Unable to access camera. Please check your camera permissions and try again.'
        : 'Camera access denied. Please allow camera permissions.';
      setError(errorMessage);
      onError?.(errorMessage);
      setIsScanning(false);
    }
  }, [onError, detectFrame]);

  // Handle manual entry
  const handleManualEntry = useCallback(() => {
    setShowManualEntry(true);
  }, []);

  const submitManualEntry = useCallback(() => {
    if (manualCode.trim()) {
      if (onManualEntry) {
        onManualEntry(manualCode.trim());
      } else {
        onScan(manualCode.trim());
      }
      stopScanning();
      setShowManualEntry(false);
      setManualCode('');
    }
  }, [manualCode, onScan, onManualEntry, stopScanning]);

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
    <>
      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
          50% {
            opacity: 0.7;
            transform: translate(-50%, -50%) scale(1.05);
          }
        }
      `}</style>
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
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
          }}
        >
          ⌨️ Enter Access Code Instead
        </button>
      </div>

      {/* Manual Entry Modal */}
      {showManualEntry && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          zIndex: 1002,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: spacing.lg,
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: borderRadius.lg,
            padding: spacing.xl,
            maxWidth: '400px',
            width: '100%',
          }}>
            <h3 style={{ ...typography.subheader, marginBottom: spacing.md }}>
              Enter Access Code
            </h3>
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Enter access code or scan QR code"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  submitManualEntry();
                } else if (e.key === 'Escape') {
                  setShowManualEntry(false);
                  setManualCode('');
                }
              }}
              style={{
                width: '100%',
                padding: spacing.md,
                border: `1px solid ${colors.neutral[300]}`,
                borderRadius: borderRadius.md,
                fontSize: '18px',
                textAlign: 'center',
                letterSpacing: '2px',
                marginBottom: spacing.md,
              }}
            />
            <div style={{ display: 'flex', gap: spacing.md }}>
              <button
                onClick={submitManualEntry}
                disabled={!manualCode.trim()}
                style={{
                  flex: 1,
                  padding: spacing.md,
                  backgroundColor: manualCode.trim() ? colors.primary : colors.neutral[300],
                  color: 'white',
                  border: 'none',
                  borderRadius: borderRadius.md,
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor: manualCode.trim() ? 'pointer' : 'not-allowed',
                }}
              >
                Submit
              </button>
              <button
                onClick={() => {
                  setShowManualEntry(false);
                  setManualCode('');
                }}
                style={{
                  flex: 1,
                  padding: spacing.md,
                  backgroundColor: colors.neutral[200],
                  color: colors.neutral[700],
                  border: 'none',
                  borderRadius: borderRadius.md,
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {!isScanning && !error && (
        <button
          style={startButtonStyle}
          onClick={startScanning}
        >
          📷 Start Camera
        </button>
      )}
      </div>
    </>
  );
};

export default QRScanner;

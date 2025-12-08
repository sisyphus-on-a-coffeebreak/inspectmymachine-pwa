/**
 * Compact QR Scanner
 * 
 * Simplified QR scanner for single-screen validation interface
 * - Smaller viewport (50% height)
 * - Camera continues running after scan
 * - No full-screen overlay
 * - Auto-start on mount
 */

import React, { useState, useRef, useEffect } from 'react';
import { colors, spacing } from '../../lib/theme';
import jsQR from 'jsqr';

interface CompactQRScannerProps {
  onScan: (data: string) => void;
  onError?: (error: string) => void;
  height?: string; // e.g., '50vh'
  className?: string;
}

export const CompactQRScanner: React.FC<CompactQRScannerProps> = ({
  onScan,
  onError,
  height = '50vh',
  className = '',
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);
  const detectorRef = useRef<any | null>(null);
  const isDetectingRef = useRef(false);
  const isScanningRef = useRef(false); // Use ref to track scanning state immediately
  const lastScanTimeRef = useRef<number>(0);
  const frameSkipCount = useRef<number>(0);
  const frameProcessCount = useRef<number>(0);
  const onScanRef = useRef(onScan);
  const onErrorRef = useRef(onError);

  // Keep refs updated
  useEffect(() => {
    onScanRef.current = onScan;
    onErrorRef.current = onError;
  }, [onScan, onError]);

  // Extract QR data - handles URLs with tokens or direct codes
  const extractQRData = (scannedData: string): string => {
    // If it's a URL, try to extract the token/access_code parameter
    if (scannedData.startsWith('http://') || scannedData.startsWith('https://')) {
      try {
        const url = new URL(scannedData);
        const token = url.searchParams.get('token') || url.searchParams.get('access_code');
        if (token) {
          return token;
        }
        return scannedData;
      } catch {
        return scannedData;
      }
    }
    // Try parsing as JSON
    try {
      const parsed = JSON.parse(scannedData);
      if (parsed.access_code) return parsed.access_code;
      if (parsed.id) return parsed.id;
    } catch {
      // Not JSON, continue
    }
    return scannedData.trim();
  };

  const stopScanning = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsScanning(false);
    isScanningRef.current = false; // Clear ref
    isDetectingRef.current = false;
  };

  // Throttled detection - process every 3rd frame for performance
  const detectFrame = () => {
    // Use ref instead of state for immediate check
    if (!isScanningRef.current || !videoRef.current || !canvasRef.current) {
      animationRef.current = requestAnimationFrame(detectFrame);
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Wait for video to be ready
    if (video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
      animationRef.current = requestAnimationFrame(detectFrame);
      return;
    }

    // Skip if already processing
    if (isDetectingRef.current) {
      animationRef.current = requestAnimationFrame(detectFrame);
      return;
    }

    // Throttle: process every 3rd frame
    frameSkipCount.current += 1;
    if (frameSkipCount.current < 3) {
      animationRef.current = requestAnimationFrame(detectFrame);
      return;
    }
    frameSkipCount.current = 0;

    // Prevent duplicate scans within 2 seconds (only if we've scanned before)
    const now = Date.now();
    if (lastScanTimeRef.current > 0 && now - lastScanTimeRef.current < 2000) {
      animationRef.current = requestAnimationFrame(detectFrame);
      return;
    }

    isDetectingRef.current = true;
    frameProcessCount.current += 1;

    try {
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        isDetectingRef.current = false;
        animationRef.current = requestAnimationFrame(detectFrame);
        return;
      }
      
      // Draw video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Get image data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      // Verify imageData is valid
      if (!imageData || imageData.data.length === 0) {
        isDetectingRef.current = false;
        animationRef.current = requestAnimationFrame(detectFrame);
        return;
      }
      
      // Try BarcodeDetector API first (faster) - detect on video element
      if (detectorRef.current) {
        (detectorRef.current as any).detect(video)
          .then((barcodes: any[]) => {
            isDetectingRef.current = false;
            if (barcodes && barcodes.length > 0) {
              const data = barcodes[0].rawValue;
              const extracted = extractQRData(data);
              lastScanTimeRef.current = now;
              onScanRef.current(extracted);
              // Continue scanning (don't stop camera)
              animationRef.current = requestAnimationFrame(detectFrame);
              return;
            }
            // No QR found, continue scanning
            animationRef.current = requestAnimationFrame(detectFrame);
          })
          .catch((err) => {
            // Fallback to jsQR
            try {
              const qrCode = jsQR(imageData.data, imageData.width, imageData.height);
              if (qrCode) {
              const extracted = extractQRData(qrCode.data);
              lastScanTimeRef.current = now;
              onScanRef.current(extracted);
              }
            } catch (jsQRErr) {
              // jsQR error, continue silently
            } finally {
              isDetectingRef.current = false;
              animationRef.current = requestAnimationFrame(detectFrame);
            }
          });
      } else {
        // Use jsQR directly
        try {
          const qrCode = jsQR(imageData.data, imageData.width, imageData.height);
          if (qrCode) {
            const extracted = extractQRData(qrCode.data);
            lastScanTimeRef.current = now;
            onScanRef.current(extracted);
          }
        } catch (err) {
          // jsQR error, continue silently
        } finally {
          isDetectingRef.current = false;
          animationRef.current = requestAnimationFrame(detectFrame);
        }
      }
    } catch (err) {
      isDetectingRef.current = false;
      animationRef.current = requestAnimationFrame(detectFrame);
    }
  };

  // Start scanning - only called once on mount
  useEffect(() => {
    let mounted = true;

    const startScanning = async () => {
      try {
        if (!mounted) return;
        
        setError(null);
        setIsScanning(true);
        isScanningRef.current = true; // Set ref immediately

        // Initialize BarcodeDetector if available
        if ('BarcodeDetector' in window) {
          try {
            detectorRef.current = new (window as any).BarcodeDetector({ 
              formats: ['qr_code'] 
            });
          } catch (err) {
            detectorRef.current = null;
          }
        }

        // Try to get camera stream - environment (back camera) first
        let stream: MediaStream | null = null;
        let error: Error | null = null;

        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { 
              facingMode: 'environment',
              width: { ideal: 1280 },
              height: { ideal: 720 }
            }
          });
        } catch (envError) {
          error = envError as Error;
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

        if (!mounted) {
          if (stream) {
            stream.getTracks().forEach(track => track.stop());
          }
          return;
        }

        if (!stream) {
          throw error || new Error('No camera available');
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          
          // Play video and start detection
          videoRef.current.play().then(() => {
            if (!mounted) return;
            
            // Wait a bit for video to be ready, then start detection
            const startDetection = () => {
              if (!mounted || !videoRef.current) return;
              
              // Check if video has dimensions
              if (videoRef.current.videoWidth > 0 && videoRef.current.videoHeight > 0) {
                animationRef.current = requestAnimationFrame(detectFrame);
              } else {
                // Retry after a short delay
                setTimeout(startDetection, 100);
              }
            };
            
            // Start detection after a short delay to ensure video is ready
            setTimeout(startDetection, 200);
          }).catch((playError) => {
            if (mounted) {
              setError('Failed to start video playback');
              onErrorRef.current?.('Failed to start video playback');
              setIsScanning(false);
            }
          });
        }
      } catch (err: any) {
        if (!mounted) return;
        
              const errorMessage = err.message || 'Failed to access camera';
              setError(errorMessage);
              onErrorRef.current?.(errorMessage);
              setIsScanning(false);
              isScanningRef.current = false; // Clear ref on error
      }
    };

    startScanning();

    return () => {
      mounted = false;
      stopScanning();
    };
    // Empty dependency array - only run once on mount
  }, []);

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width: '100%',
        height,
        backgroundColor: colors.neutral[900],
        overflow: 'hidden',
        borderRadius: '8px',
      }}
    >
      {error ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            padding: spacing.lg,
            color: 'white',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '2rem', marginBottom: spacing.md }}>📷</div>
          <div style={{ marginBottom: spacing.sm, fontWeight: 600 }}>
            Camera {error.includes('permission') ? 'Permission Denied' : 'Not Available'}
          </div>
          <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>
            {error.includes('permission')
              ? 'Please enable camera access in your browser settings'
              : 'Please use manual entry below'}
          </div>
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          {!isScanning && !error && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                color: 'white',
              }}
            >
              <div>Starting camera...</div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

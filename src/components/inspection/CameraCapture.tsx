import React, { useState, useRef, useEffect } from 'react';
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
  const [isVideoReady, setIsVideoReady] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const retryCountRef = useRef(0);
  const readyCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleCameraCapture = async () => {
    // Check if getUserMedia is available
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('Camera is not supported in this browser. Please use a modern browser or upload photos from your gallery.');
      return;
    }

    try {
      // Try environment (back camera) first, then fallback to user (front camera), then any camera
      let stream: MediaStream | null = null;
      let error: Error | null = null;

      // First try: environment (back camera on mobile)
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
        
        // Second try: user (front camera)
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

      setIsCapturing(true);
      setIsVideoReady(false);
      retryCountRef.current = 0;
      
      // Wait a bit for the video element to be in the DOM
      setTimeout(() => {
        if (!videoRef.current) {
          console.error('Video element not found in DOM');
          alert('Camera interface not ready. Please try again.');
          stopCamera();
          return;
        }

        const video = videoRef.current;
        
        // Assign stream to video element
        video.srcObject = stream;
        console.log('Stream assigned to video element', {
          streamActive: stream.active,
          tracks: stream.getTracks().length,
          videoTracks: stream.getVideoTracks().length
        });
        
        // Ensure video attributes are set
        video.playsInline = true;
        video.autoplay = true;
        video.muted = true;
        video.setAttribute('playsinline', 'true');
        video.setAttribute('autoplay', 'true');
        video.setAttribute('muted', 'true');
        
        // Wait for video to be ready and play
        const checkVideoReady = () => {
          if (videoRef.current) {
            const video = videoRef.current;
            // Check if video has valid dimensions and is playing
            if (video.readyState >= video.HAVE_CURRENT_DATA && 
                video.videoWidth > 0 && 
                video.videoHeight > 0) {
              console.log('Video is ready!', {
                readyState: video.readyState,
                videoWidth: video.videoWidth,
                videoHeight: video.videoHeight,
                paused: video.paused
              });
              setIsVideoReady(true);
              
              // Clear the interval since video is ready
              if (readyCheckIntervalRef.current) {
                clearInterval(readyCheckIntervalRef.current);
                readyCheckIntervalRef.current = null;
              }
              
              return true;
            }
          }
          return false;
        };

        // Try to play video immediately
        const tryPlay = async () => {
          if (!videoRef.current) {
            console.warn('Video element not available for play');
            return;
          }
          
          const video = videoRef.current;
          
          // Check if stream is still active
          if (video.srcObject) {
            const currentStream = video.srcObject as MediaStream;
            if (!currentStream.active) {
              console.warn('Stream is not active');
              return;
            }
          }
          
          try {
            await video.play();
            console.log('Video play() succeeded', {
              readyState: video.readyState,
              videoWidth: video.videoWidth,
              videoHeight: video.videoHeight,
              paused: video.paused
            });
            
            // Check if ready after playing
            setTimeout(() => {
              if (!checkVideoReady()) {
                // Check again after a bit more time
                setTimeout(() => {
                  checkVideoReady();
                }, 300);
              }
            }, 200);
          } catch (playError: any) {
            console.error('Error playing video:', playError);
            // Don't retry indefinitely - just log and wait for events
            if (playError.name !== 'NotAllowedError') {
              // Try again after a short delay for non-permission errors
              setTimeout(() => {
                tryPlay();
              }, 500);
            }
          }
        };

        // Try to set ready state when metadata loads
        video.onloadedmetadata = () => {
          console.log('Video metadata loaded', {
            readyState: video.readyState,
            videoWidth: video.videoWidth,
            videoHeight: video.videoHeight
          });
          tryPlay();
        };

        // Handle video playing event - most reliable indicator
        video.onplaying = () => {
          console.log('Video is playing, checking if ready...');
          setTimeout(() => {
            if (checkVideoReady()) {
              console.log('Video is ready!');
            } else {
              console.warn('Video playing but not ready yet, will check again...');
              // Check again after a bit more time
              setTimeout(() => {
                checkVideoReady();
              }, 300);
            }
          }, 100);
        };

        // Handle canplay event - video can start playing
        video.oncanplay = () => {
          console.log('Video can play', {
            readyState: video.readyState,
            videoWidth: video.videoWidth,
            videoHeight: video.videoHeight
          });
          if (!video.paused) {
            checkVideoReady();
          } else {
            // Try to play if paused
            tryPlay();
          }
        };

        // Handle loadeddata event
        video.onloadeddata = () => {
          console.log('Video data loaded', {
            readyState: video.readyState,
            videoWidth: video.videoWidth,
            videoHeight: video.videoHeight
          });
          tryPlay();
        };

        // Try to play immediately if stream is already available
        if (stream.active) {
          console.log('Stream is active, trying to play immediately');
          setTimeout(() => {
            tryPlay();
          }, 200);
        } else {
          console.warn('Stream is not active yet');
        }

        // Fallback: check periodically if video becomes ready
        let readyCheckCount = 0;
        readyCheckIntervalRef.current = setInterval(() => {
          if (!videoRef.current) {
            console.warn('Video element lost during check');
            if (readyCheckIntervalRef.current) {
              clearInterval(readyCheckIntervalRef.current);
              readyCheckIntervalRef.current = null;
            }
            return;
          }

          const video = videoRef.current;
          
          // Log current state for debugging
          if (readyCheckCount % 10 === 0) { // Log every second
            console.log('Video state check:', {
              readyState: video.readyState,
              videoWidth: video.videoWidth,
              videoHeight: video.videoHeight,
              paused: video.paused,
              srcObject: !!video.srcObject,
              streamActive: video.srcObject ? (video.srcObject as MediaStream).active : false
            });
          }

          // Check if video is ready
          if (checkVideoReady()) {
            // Interval is cleared inside checkVideoReady when video is ready
            return;
          }
          
          // If video is not ready yet, continue checking
          if (!videoRef.current) {
            // Video element was removed (camera stopped)
            if (readyCheckIntervalRef.current) {
              clearInterval(readyCheckIntervalRef.current);
              readyCheckIntervalRef.current = null;
            }
            return;
          }
          
          // Try to play if video is paused and has some data
          if (video.paused && video.readyState >= video.HAVE_METADATA) {
            console.log('Video is paused but has metadata, trying to play...');
            video.play().catch(err => {
              console.warn('Failed to play video:', err);
            });
          }
          
          // After 3 seconds, give up and mark as ready anyway if video has metadata
          if (readyCheckCount > 30) {
            if (video.readyState >= video.HAVE_METADATA) {
              console.warn('Video taking too long, but metadata is loaded. Marking as ready.');
              setIsVideoReady(true);
            } else {
              console.error('Video still not ready after 3 seconds', {
                readyState: video.readyState,
                srcObject: !!video.srcObject
              });
            }
            if (readyCheckIntervalRef.current) {
              clearInterval(readyCheckIntervalRef.current);
              readyCheckIntervalRef.current = null;
            }
          }
          readyCheckCount += 1;
        }, 100);

        // Clean up interval after max time
        setTimeout(() => {
          if (readyCheckIntervalRef.current) {
            clearInterval(readyCheckIntervalRef.current);
            readyCheckIntervalRef.current = null;
          }
        }, 10000); // Max 10 seconds

        // Handle video errors
        video.onerror = (e) => {
          console.error('Video error:', e);
          if (readyCheckIntervalRef.current) {
            clearInterval(readyCheckIntervalRef.current);
            readyCheckIntervalRef.current = null;
          }
          alert('Camera error occurred. Please try again.');
          stopCamera();
        };
      }, 100); // Close setTimeout callback
    } catch (error: any) {
      console.error('Camera access error:', error);
      
      let errorMessage = 'Camera access is required for photo capture. ';
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage += 'Please allow camera permissions in your browser settings and try again.';
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        errorMessage += 'No camera found. Please connect a camera or use the gallery upload option.';
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        errorMessage += 'Camera is being used by another application. Please close other apps using the camera and try again.';
      } else if (error.name === 'OverconstrainedError' || error.name === 'ConstraintNotSatisfiedError') {
        errorMessage += 'Camera constraints not supported. Please try uploading from gallery instead.';
      } else {
        errorMessage += 'Please check your camera permissions and try again.';
      }
      
      alert(errorMessage);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) {
      console.error('Video or canvas element not available');
      alert('Camera not ready. Please wait for the camera to initialize.');
      return;
    }

    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    // Check if video is ready - with max retry limit
    if (video.readyState < video.HAVE_CURRENT_DATA) {
      retryCountRef.current += 1;
      
      if (retryCountRef.current > 50) { // Max 5 seconds (50 * 100ms)
        console.error('Video not ready after maximum retries');
        alert('Camera is taking too long to initialize. Please try again.');
        stopCamera();
        return;
      }
      
      console.warn('Video not ready, waiting...', retryCountRef.current);
      setTimeout(() => capturePhoto(), 100);
      return;
    }

    // Reset retry count
    retryCountRef.current = 0;

    // Check if video has valid dimensions
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;
    
    if (!videoWidth || !videoHeight || videoWidth === 0 || videoHeight === 0) {
      console.error('Video dimensions not available', { videoWidth, videoHeight });
      alert('Camera video not ready. Please wait a moment and try again.');
      return;
    }

    const context = canvas.getContext('2d');
    
    if (!context) {
      console.error('Could not get canvas context');
      alert('Could not capture photo. Please try again.');
      return;
    }
    
    // Set canvas dimensions to match video
    canvas.width = videoWidth;
    canvas.height = videoHeight;
    
    // Draw video frame to canvas (no mirroring - save as original orientation)
    try {
      context.drawImage(video, 0, 0, videoWidth, videoHeight);
    } catch (drawError) {
      console.error('Error drawing image to canvas:', drawError);
      alert('Could not capture photo. Please try again.');
      return;
    }
    
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
        const newFiles = [...value, file];
        onChange(newFiles);
        
        // Provide feedback
        console.log('Photo captured successfully');
      } else {
        console.error('Failed to create blob from canvas');
        alert('Failed to save photo. Please try again.');
      }
    }, 'image/jpeg', 0.9); // Higher quality (0.9 instead of 0.8)
    
    stopCamera();
  };

  const stopCamera = () => {
    // Clear ready check interval
    if (readyCheckIntervalRef.current) {
      clearInterval(readyCheckIntervalRef.current);
      readyCheckIntervalRef.current = null;
    }
    
    if (videoRef.current) {
      // Stop all tracks
      if (videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => {
          track.stop();
          stream.removeTrack(track);
        });
        videoRef.current.srcObject = null;
      }
      
      // Pause video
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }
    setIsCapturing(false);
    setIsVideoReady(false);
    retryCountRef.current = 0;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Debug: Log video ready state changes
  useEffect(() => {
    if (isCapturing && videoRef.current) {
      console.log('Video ready state:', {
        isVideoReady,
        readyState: videoRef.current.readyState,
        videoWidth: videoRef.current.videoWidth,
        videoHeight: videoRef.current.videoHeight,
        paused: videoRef.current.paused,
        ended: videoRef.current.ended
      });
    }
  }, [isCapturing, isVideoReady]);

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
                borderRadius: '8px',
                transform: 'scaleX(-1)' // Mirror the video for better UX
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
            <Button 
              variant="primary" 
              onClick={capturePhoto}
              disabled={!isVideoReady}
            >
              📸 {isVideoReady ? 'Capture Photo' : 'Loading Camera...'}
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

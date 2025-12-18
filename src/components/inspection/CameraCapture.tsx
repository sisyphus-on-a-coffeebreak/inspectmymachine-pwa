import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { colors, spacing, shadows } from '../../lib/theme';
import { Button } from '../ui/button';
import { useToast } from '../../providers/ToastProvider';
import { SortablePhotoGrid } from '../ui/SortablePhotoGrid';
import type { Photo } from '../ui/SortablePhotoGrid';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { logger } from '../../lib/logger';
import { reorderInspectionPhotos } from '../../lib/inspectionPhotoReorder';
import { compressImages, compressImage, shouldCompress } from '../../lib/imageCompression';

interface CameraCaptureProps {
  value?: any[];
  onChange: (files: any[]) => void;
  maxFiles?: number;
  maxSize?: string;
  disabled?: boolean;
  onError?: (message: string) => void;
  enableReorder?: boolean;
  enableDelete?: boolean;
  inspectionId?: string;
  answerId?: string;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({
  value = [],
  onChange,
  maxFiles = 5,
  maxSize = '5MB',
  disabled = false,
  onError,
  enableReorder = true,
  enableDelete = true,
  inspectionId,
  answerId,
}) => {
  const { showToast } = useToast();
  const [isCapturing, setIsCapturing] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [captureMode, setCaptureMode] = useState<'photo' | 'video'>('photo');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const readyCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleError = (message: string) => {
    if (onError) {
      onError(message);
    } else {
      showToast({
        title: 'Camera Error',
        description: message,
        variant: 'error',
      });
    }
  };

  const handleCameraCapture = async () => {
    // Check if getUserMedia is available
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      handleError('Camera is not supported in this browser. Please use a modern browser or upload photos from your gallery.');
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
          },
          audio: captureMode === 'video' // Request audio for video recording
        });
      } catch (envError) {
        // Environment camera not available, trying user camera
        error = envError as Error;
        
        // Second try: user (front camera)
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { 
              facingMode: 'user',
              width: { ideal: 1280 },
              height: { ideal: 720 }
            },
            audio: captureMode === 'video' // Request audio for video recording
          });
          error = null;
        } catch (userError) {
          // User camera not available, trying any camera
          
          // Third try: any available camera (no facingMode constraint)
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              video: { 
                width: { ideal: 1280 },
                height: { ideal: 720 }
              },
              audio: captureMode === 'video' // Request audio for video recording
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
          handleError('Camera interface not ready. Please try again.');
          stopCamera();
          return;
        }

        const video = videoRef.current;
        
        // Assign stream to video element
        video.srcObject = stream;
        
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
              // Video is ready
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
            // Video element not available - handled gracefully
            return;
          }
          
          const video = videoRef.current;
          
          // Check if stream is still active
          if (video.srcObject) {
            const currentStream = video.srcObject as MediaStream;
            if (!currentStream.active) {
              // Stream is not active
              return;
            }
          }
          
          try {
            await video.play();
            // Video play() succeeded
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
            // Don't retry indefinitely - just wait for events
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
          // Video metadata loaded
          tryPlay();
        };

        // Handle video playing event - most reliable indicator
        video.onplaying = () => {
          // Video is playing, checking if ready
          setTimeout(() => {
            if (checkVideoReady()) {
              // Video is ready
            } else {
              // Video playing but not ready yet, will check again
              // Check again after a bit more time
              setTimeout(() => {
                checkVideoReady();
              }, 300);
            }
          }, 100);
        };

        // Handle canplay event - video can start playing
        video.oncanplay = () => {
          // Video can play
          if (!video.paused) {
            checkVideoReady();
          } else {
            // Try to play if paused
            tryPlay();
          }
        };

        // Handle loadeddata event
        video.onloadeddata = () => {
          // Video data loaded
          tryPlay();
        };

        // Try to play immediately if stream is already available
        if (stream.active) {
          // Stream is active, trying to play immediately
          setTimeout(() => {
            tryPlay();
          }, 200);
        } else {
          // Stream is not active yet
        }

        // Fallback: check periodically if video becomes ready
        let readyCheckCount = 0;
        readyCheckIntervalRef.current = setInterval(() => {
          if (!videoRef.current) {
            // Video element lost during check
            if (readyCheckIntervalRef.current) {
              clearInterval(readyCheckIntervalRef.current);
              readyCheckIntervalRef.current = null;
            }
            return;
          }

          const video = videoRef.current;
          
          // Log current state for debugging
          if (readyCheckCount % 10 === 0) { // Log every second
            // Video state check
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
            // Video is paused but has metadata, trying to play
            video.play().catch(() => {
              // Failed to play video
            });
          }
          
          // After 3 seconds, give up and mark as ready anyway if video has metadata
          if (readyCheckCount > 30) {
            if (video.readyState >= video.HAVE_METADATA) {
              // Video taking too long, but metadata is loaded. Marking as ready
              setIsVideoReady(true);
            } else {
              // Video still not ready after 3 seconds
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
          // Video error
          if (readyCheckIntervalRef.current) {
            clearInterval(readyCheckIntervalRef.current);
            readyCheckIntervalRef.current = null;
          }
          handleError('Camera error occurred. Please try again.');
          stopCamera();
        };
      }, 100); // Close setTimeout callback
    } catch (error: any) {
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
      
      handleError(errorMessage);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) {
      handleError('Camera not ready. Please wait for the camera to initialize.');
      return;
    }

    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    // Check if video is ready - with max retry limit
    if (video.readyState < video.HAVE_CURRENT_DATA) {
      retryCountRef.current += 1;
      
      if (retryCountRef.current > 50) { // Max 5 seconds (50 * 100ms)
        handleError('Camera is taking too long to initialize. Please try again.');
        stopCamera();
        return;
      }
      
      // Video not ready, waiting
      setTimeout(() => capturePhoto(), 100);
      return;
    }

    // Reset retry count
    retryCountRef.current = 0;

    // Check if video has valid dimensions
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;
    
    if (!videoWidth || !videoHeight || videoWidth === 0 || videoHeight === 0) {
      handleError('Camera video not ready. Please wait a moment and try again.');
      return;
    }

    const context = canvas.getContext('2d');
    
    if (!context) {
      handleError('Could not capture photo. Please try again.');
      return;
    }
    
    // Set canvas dimensions to match video
    canvas.width = videoWidth;
    canvas.height = videoHeight;
    
    // Draw video frame to canvas (no mirroring - save as original orientation)
    try {
      context.drawImage(video, 0, 0, videoWidth, videoHeight);
    } catch (drawError) {
      handleError('Could not capture photo. Please try again.');
      return;
    }
    
    canvas.toBlob(async (blob) => {
      if (blob) {
        try {
          // Create file from blob
          const capturedFile = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
          
          // Compress the captured photo before adding to list
          const compressedFile = shouldCompress(capturedFile)
            ? await compressImage(capturedFile)
            : capturedFile;
          
          const newFiles = [...value, compressedFile];
          onChange(newFiles);
          
          // Provide feedback
          // Photo captured and compressed successfully
        } catch (error) {
          handleError('Failed to process captured photo. Please try again.');
          console.error('Photo compression error:', error);
        }
      } else {
        handleError('Failed to save photo. Please try again.');
      }
    }, 'image/jpeg', 0.9); // Higher quality (0.9 instead of 0.8)
    
    stopCamera();
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      setRecordingTime(0);
    }
  };

  const startVideoRecording = () => {
    if (!videoRef.current || !isVideoReady) {
      handleError('Camera not ready. Please wait for the camera to initialize.');
      return;
    }

    const stream = videoRef.current.srcObject as MediaStream;
    if (!stream) {
      handleError('No video stream available.');
      return;
    }

    try {
      recordedChunksRef.current = [];
      
      // Get supported MIME type for video
      const options: MediaRecorderOptions = { mimeType: 'video/webm' };
      if (!MediaRecorder.isTypeSupported('video/webm')) {
        if (MediaRecorder.isTypeSupported('video/mp4')) {
          options.mimeType = 'video/mp4';
        } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
          options.mimeType = 'video/webm;codecs=vp9';
        } else {
          // Fallback to default
          delete options.mimeType;
        }
      }

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { 
          type: mediaRecorder.mimeType || 'video/webm' 
        });
        const file = new File([blob], `video-${Date.now()}.${blob.type.includes('mp4') ? 'mp4' : 'webm'}`, { 
          type: blob.type 
        });
        const newFiles = [...value, file];
        onChange(newFiles);
        
        showToast({
          title: 'Success',
          description: 'Video recorded successfully',
          variant: 'success',
        });

        recordedChunksRef.current = [];
        stopCamera();
      };

      mediaRecorder.onerror = (event: any) => {
        handleError('Error recording video: ' + (event.error?.message || 'Unknown error'));
        setIsRecording(false);
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }
        setRecordingTime(0);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start recording timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error: any) {
      handleError('Failed to start video recording: ' + (error.message || 'Unknown error'));
    }
  };

  const stopCamera = () => {
    // Stop recording if active
    stopRecording();
    
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
    setIsRecording(false);
    setRecordingTime(0);
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
      // Video ready state check
    }
  }, [isCapturing, isVideoReady]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;
    
    try {
      // Separate images and other files
      const imageFiles: File[] = [];
      const otherFiles: File[] = [];
      
      files.forEach(file => {
        if (shouldCompress(file)) {
          imageFiles.push(file);
        } else {
          otherFiles.push(file);
        }
      });
      
      // Compress images
      const compressedImages = imageFiles.length > 0 
        ? await compressImages(imageFiles)
        : [];
      
      // Combine compressed images with other files
      const processedFiles = [...compressedImages, ...otherFiles];
      const newFiles = [...value, ...processedFiles];
      onChange(newFiles);
      
      // Reset input so same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      handleError('Failed to process files. Please try again.');
      console.error('File processing error:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const removeFile = (index: number) => {
    const newFiles = value.filter((_, i) => i !== index);
    onChange(newFiles);
  };

  // Check if we have saved photos with keys (for backend reordering)
  const hasSavedPhotos = useMemo(() => {
    return inspectionId && answerId && value.some((file: any) => file.key || file.id);
  }, [inspectionId, answerId, value]);

  // Convert files to Photo format for SortablePhotoGrid
  const photos: Photo[] = useMemo(() => {
    return value.map((file: any, index: number) => {
      const fileObj = file instanceof File ? file : file;
      const url = file instanceof File ? URL.createObjectURL(file) : (fileObj.url || fileObj.object_url);
      const id = fileObj.key || fileObj.id || `temp-${index}`;
      return {
        id,
        url,
        name: fileObj.name || `Photo ${index + 1}`,
      };
    });
  }, [value]);

  // Handle reorder with backend sync
  const handleReorder = useCallback(async (newOrder: string[]) => {
    if (!inspectionId || !answerId) {
      // No backend sync, just reorder locally
      const reorderedFiles = newOrder.map(id => {
        return value.find((file: any) => {
          const fileKey = (file as any).key || (file as any).id || `temp-${value.indexOf(file)}`;
          return fileKey === id;
        });
      }).filter(Boolean);
      onChange(reorderedFiles);
      return;
    }

    try {
      await reorderInspectionPhotos(inspectionId, answerId, newOrder);
      showToast({
        title: 'Success',
        description: 'Photos reordered successfully',
        variant: 'success',
      });
      
      // Reorder locally as well
      const reorderedFiles = newOrder.map(id => {
        return value.find((file: any) => {
          const fileKey = (file as any).key || (file as any).id || `temp-${value.indexOf(file)}`;
          return fileKey === id;
        });
      }).filter(Boolean);
      onChange(reorderedFiles);
    } catch (error) {
      logger.error('Failed to reorder photos', error, 'CameraCapture');
      showToast({
        title: 'Error',
        description: 'Failed to reorder photos. Please try again.',
        variant: 'error',
      });
    }
  }, [inspectionId, answerId, value, onChange, showToast]);

  // Handle delete with confirmation
  const handleDelete = useCallback((photoId: string) => {
    const index = value.findIndex((file: any) => {
      const fileKey = (file as any).key || (file as any).id || `temp-${value.indexOf(file)}`;
      return fileKey === photoId;
    });
    
    if (index !== -1) {
      removeFile(index);
    }
  }, [value]);

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
            flexDirection: 'column',
            gap: spacing.md, 
            marginTop: spacing.lg,
            backgroundColor: 'rgba(0,0,0,0.7)',
            padding: spacing.md,
            borderRadius: '8px',
            alignItems: 'center'
          }}>
            {/* Mode Toggle */}
            <div style={{ display: 'flex', gap: spacing.sm, marginBottom: spacing.xs }}>
              <Button
                variant={captureMode === 'photo' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => {
                  if (isRecording) stopRecording();
                  setCaptureMode('photo');
                }}
                disabled={isRecording}
              >
                📸 Photo
              </Button>
              <Button
                variant={captureMode === 'video' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => {
                  if (isRecording) stopRecording();
                  setCaptureMode('video');
                }}
                disabled={isRecording}
              >
                🎥 Video
              </Button>
            </div>

            {/* Recording Timer */}
            {isRecording && (
              <div style={{ 
                color: colors.error[500], 
                fontSize: '18px', 
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: spacing.xs
              }}>
                <div style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor: colors.error[500],
                  animation: 'pulse 1s infinite'
                }} />
                Recording: {formatTime(recordingTime)}
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: spacing.md }}>
              <Button variant="secondary" onClick={stopCamera} disabled={isRecording}>
                ❌ Cancel
              </Button>
              {captureMode === 'photo' ? (
                <Button 
                  variant="primary" 
                  onClick={capturePhoto}
                  disabled={!isVideoReady || isRecording}
                >
                  📸 {isVideoReady ? 'Capture Photo' : 'Loading Camera...'}
                </Button>
              ) : (
                <>
                  {!isRecording ? (
                    <Button 
                      variant="primary" 
                      onClick={startVideoRecording}
                      disabled={!isVideoReady}
                    >
                      🎥 {isVideoReady ? 'Start Recording' : 'Loading Camera...'}
                    </Button>
                  ) : (
                    <Button 
                      variant="critical" 
                      onClick={stopRecording}
                    >
                      ⏹️ Stop Recording
                    </Button>
                  )}
                </>
              )}
            </div>
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
          📷 Use Camera
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
          accept="image/*,video/*"
          multiple
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />
      </div>

      {/* File List - Use SortablePhotoGrid if reordering is enabled and we have saved photos */}
      {value.length > 0 && (
        enableReorder && hasSavedPhotos ? (
          <SortablePhotoGrid
            photos={photos}
            onReorder={handleReorder}
            onDelete={enableDelete ? handleDelete : undefined}
            maxPhotos={maxFiles}
            disabled={disabled}
          />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: spacing.sm }}>
            {value.map((file, index) => {
              const fileObj = file instanceof File ? file : (file as any);
              const isVideo = fileObj.type?.startsWith('video/') || fileObj.name?.match(/\.(mp4|webm|mov|avi)$/i);
              const url = file instanceof File ? URL.createObjectURL(file) : (fileObj.url || fileObj.object_url);
              
              return (
                <div key={index} style={{
                  position: 'relative',
                  backgroundColor: colors.neutral[100],
                  borderRadius: '8px',
                  overflow: 'hidden'
                }}>
                  {isVideo ? (
                    <video
                      src={url}
                      style={{ width: '100%', height: '120px', objectFit: 'cover' }}
                      controls={false}
                      muted
                    />
                  ) : (
                    <img
                      src={url}
                      alt={`Media ${index + 1}`}
                      style={{ width: '100%', height: '120px', objectFit: 'cover' }}
                    />
                  )}
                  <div style={{
                    position: 'absolute',
                    top: '4px',
                    left: '4px',
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    color: 'white',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontWeight: 'bold'
                  }}>
                    {isVideo ? '🎥' : '📸'}
                  </div>
                  {enableDelete && (
                    <button
                      onClick={() => removeFile(index)}
                      aria-label={`Remove file ${index + 1}`}
                      style={{
                        position: 'absolute',
                        top: spacing.xs,
                        right: spacing.xs,
                        backgroundColor: colors.status.critical,
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
                        fontSize: '16px',
                        lineHeight: '1',
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
                      ×
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}

      <p style={{ fontSize: '12px', color: colors.neutral[500], marginTop: spacing.sm }}>
        Max {maxFiles} files, {maxSize} each. Supports photos and videos.
      </p>
      
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

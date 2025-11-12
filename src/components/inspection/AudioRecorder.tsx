import React, { useState, useRef, useEffect } from 'react';
import { colors, spacing } from '../../lib/theme';
import { Button } from '../ui/button';
import { useToast } from '../../providers/ToastProvider';

interface AudioRecorderProps {
  value?: any;
  onChange: (audioData: any) => void;
  maxDuration?: number;
  disabled?: boolean;
  onError?: (message: string) => void;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({
  value,
  onChange,
  maxDuration = 60,
  disabled = false,
  onError
}) => {
  const { showToast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleError = (message: string) => {
    if (onError) {
      onError(message);
    } else {
      showToast({
        title: 'Audio Error',
        description: message,
        variant: 'error',
      });
    }
  };

  useEffect(() => {
    if (isRecording) {
      intervalRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= maxDuration) {
            stopRecording();
            return maxDuration;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRecording, maxDuration]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setAudioBlob(audioBlob);
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        onChange({
          blob: audioBlob,
          url: url,
          duration: recordingTime
        });
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
    } catch (error) {
      console.error('Microphone access denied:', error);
      handleError('Microphone access is required for audio recording');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const deleteRecording = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
    onChange(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
      {/* Recording Controls */}
      <div style={{ display: 'flex', gap: spacing.sm, alignItems: 'center' }}>
        {!isRecording ? (
          <Button
            variant="primary"
            onClick={startRecording}
            disabled={disabled}
            icon="🎤"
          >
            Start Recording
          </Button>
        ) : (
          <Button
            variant="secondary"
            onClick={stopRecording}
            icon="⏹️"
          >
            Stop Recording
          </Button>
        )}

        {recordingTime > 0 && (
          <div style={{
            ...colors.neutral[600],
            fontSize: '14px',
            fontWeight: 600
          }}>
            {formatTime(recordingTime)} / {formatTime(maxDuration)}
          </div>
        )}
      </div>

      {/* Recording Indicator */}
      {isRecording && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing.sm,
          padding: spacing.sm,
          backgroundColor: colors.status.critical + '20',
          borderRadius: '8px',
          border: `1px solid ${colors.status.critical}`
        }}>
          <div style={{
            width: '12px',
            height: '12px',
            backgroundColor: colors.status.critical,
            borderRadius: '50%',
            animation: 'pulse 1s infinite'
          }} />
          <span style={{ fontSize: '14px', color: colors.status.critical }}>
            Recording... {formatTime(recordingTime)}
          </span>
        </div>
      )}

      {/* Audio Player */}
      {audioUrl && (
        <div style={{
          padding: spacing.md,
          backgroundColor: colors.neutral[50],
          borderRadius: '8px',
          border: `1px solid ${colors.neutral[200]}`
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm }}>
            <span style={{ fontSize: '14px', fontWeight: 600 }}>Recorded Audio:</span>
            <span style={{ fontSize: '12px', color: colors.neutral[600] }}>
              {formatTime(recordingTime)}
            </span>
          </div>
          
          <audio controls style={{ width: '100%', marginBottom: spacing.sm }}>
            <source src={audioUrl} type="audio/wav" />
            Your browser does not support the audio element.
          </audio>
          
          <Button
            variant="secondary"
            onClick={deleteRecording}
            icon="🗑️"
            size="sm"
          >
            Delete Recording
          </Button>
        </div>
      )}

      <p style={{ fontSize: '12px', color: colors.neutral[500] }}>
        Maximum recording duration: {formatTime(maxDuration)}
      </p>
    </div>
  );
};


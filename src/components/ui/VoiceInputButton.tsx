/**
 * VoiceInputButton Component
 * 
 * Button component for triggering speech-to-text input
 * Shows visual feedback when listening
 */

import React from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { colors, spacing, borderRadius } from '../../lib/theme';
import { logger } from '../../lib/logger';

export interface VoiceInputButtonProps {
  onTranscript: (transcript: string) => void; // Callback when transcript is received
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'primary' | 'ghost';
  className?: string;
  style?: React.CSSProperties;
}

export const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({
  onTranscript,
  disabled = false,
  size = 'md',
  variant = 'default',
  className = '',
  style,
}) => {
  const {
    transcript,
    isListening,
    isSupported,
    startListening,
    stopListening,
    error,
  } = useSpeechRecognition({
    continuous: false,
    interimResults: true,
    onResult: (transcript, isFinal) => {
      if (isFinal) {
        onTranscript(transcript);
      }
    },
    onError: (errorMessage) => {
      logger.warn('Speech recognition error', errorMessage, 'VoiceInputButton');
    },
  });

  // Update parent when final transcript is received
  React.useEffect(() => {
    if (transcript && !isListening) {
      // Transcript is final when recognition stops
      onTranscript(transcript);
    }
  }, [transcript, isListening, onTranscript]);

  if (!isSupported) {
    return null; // Don't show button if not supported
  }

  const sizeMap = {
    sm: { width: '32px', height: '32px', iconSize: 16 },
    md: { width: '44px', height: '44px', iconSize: 20 },
    lg: { width: '56px', height: '56px', iconSize: 24 },
  };

  const variantStyles = {
    default: {
      backgroundColor: isListening ? colors.error[500] : colors.neutral[100],
      color: isListening ? 'white' : colors.neutral[700],
      border: `1px solid ${colors.neutral[300]}`,
    },
    primary: {
      backgroundColor: isListening ? colors.error[500] : colors.primary,
      color: 'white',
      border: 'none',
    },
    ghost: {
      backgroundColor: 'transparent',
      color: isListening ? colors.error[500] : colors.neutral[600],
      border: 'none',
    },
  };

  const handleClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const currentSize = sizeMap[size];
  const currentVariant = variantStyles[variant];

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={className}
      style={{
        ...currentSize,
        ...currentVariant,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: borderRadius.full,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s ease',
        opacity: disabled ? 0.5 : 1,
        ...style,
      }}
      onMouseEnter={(e) => {
        if (!disabled && !isListening) {
          e.currentTarget.style.transform = 'scale(1.05)';
          e.currentTarget.style.boxShadow = `0 2px 8px rgba(0, 0, 0, 0.15)`;
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = 'none';
        }
      }}
      aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
      title={isListening ? 'Stop voice input' : 'Start voice input'}
    >
      {isListening ? (
        <MicOff size={currentSize.iconSize} />
      ) : (
        <Mic size={currentSize.iconSize} />
      )}
      {error && (
        <span style={{ display: 'none' }} aria-live="polite">
          {error}
        </span>
      )}
    </button>
  );
};





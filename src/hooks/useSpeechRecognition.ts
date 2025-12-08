/**
 * useSpeechRecognition Hook
 * 
 * Provides speech-to-text functionality using the Web Speech API
 * Falls back gracefully if the API is not supported
 */

import { useState, useEffect, useRef, useCallback } from 'react';

export interface UseSpeechRecognitionOptions {
  continuous?: boolean; // Keep listening after speech ends (default: false)
  interimResults?: boolean; // Show interim results (default: true)
  lang?: string; // Language code (default: 'en-US')
  onResult?: (transcript: string, isFinal: boolean) => void; // Callback for results
  onError?: (error: string) => void; // Callback for errors
  onStart?: () => void; // Callback when recognition starts
  onEnd?: () => void; // Callback when recognition ends
}

export interface UseSpeechRecognitionReturn {
  transcript: string; // Current transcript
  isListening: boolean; // Whether recognition is active
  isSupported: boolean; // Whether the API is supported
  startListening: () => void; // Start speech recognition
  stopListening: () => void; // Stop speech recognition
  error: string | null; // Current error, if any
}

/**
 * Check if Speech Recognition API is available
 */
function isSpeechRecognitionSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
  );
}

/**
 * Get Speech Recognition constructor
 */
function getSpeechRecognition(): typeof SpeechRecognition | null {
  if (typeof window === 'undefined') return null;
  
  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  
  return SpeechRecognition || null;
}

export function useSpeechRecognition(
  options: UseSpeechRecognitionOptions = {}
): UseSpeechRecognitionReturn {
  const {
    continuous = false,
    interimResults = true,
    lang = 'en-US',
    onResult,
    onError,
    onStart,
    onEnd,
  } = options;

  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isSupported = isSpeechRecognitionSupported();

  // Initialize recognition
  useEffect(() => {
    if (!isSupported) return;

    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.lang = lang;

    // Handle results
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      const fullTranscript = finalTranscript || interimTranscript;
      setTranscript(fullTranscript.trim());

      if (onResult) {
        onResult(fullTranscript.trim(), finalTranscript.length > 0);
      }
    };

    // Handle errors
    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      let errorMessage = 'Speech recognition error';
      
      switch (event.error) {
        case 'no-speech':
          errorMessage = 'No speech detected. Please try again.';
          break;
        case 'aborted':
          errorMessage = 'Speech recognition was aborted.';
          break;
        case 'audio-capture':
          errorMessage = 'No microphone found. Please check your microphone.';
          break;
        case 'network':
          errorMessage = 'Network error. Please check your connection.';
          break;
        case 'not-allowed':
          errorMessage = 'Microphone permission denied. Please allow microphone access.';
          break;
        case 'service-not-allowed':
          errorMessage = 'Speech recognition service not allowed.';
          break;
        default:
          errorMessage = `Speech recognition error: ${event.error}`;
      }

      setError(errorMessage);
      setIsListening(false);
      
      if (onError) {
        onError(errorMessage);
      }
    };

    // Handle end
    recognition.onend = () => {
      setIsListening(false);
      if (onEnd) {
        onEnd();
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore errors when stopping
        }
      }
    };
  }, [isSupported, continuous, interimResults, lang, onResult, onError, onEnd]);

  // Start listening
  const startListening = useCallback(() => {
    if (!isSupported || !recognitionRef.current) {
      setError('Speech recognition is not supported in this browser.');
      return;
    }

    if (isListening) {
      return; // Already listening
    }

    try {
      setError(null);
      setTranscript('');
      setIsListening(true);
      recognitionRef.current.start();
      
      if (onStart) {
        onStart();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start speech recognition';
      setError(errorMessage);
      setIsListening(false);
      
      if (onError) {
        onError(errorMessage);
      }
    }
  }, [isSupported, isListening, onStart, onError]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (!recognitionRef.current || !isListening) {
      return;
    }

    try {
      recognitionRef.current.stop();
      setIsListening(false);
    } catch (err) {
      // Ignore errors when stopping
    }
  }, [isListening]);

  return {
    transcript,
    isListening,
    isSupported,
    startListening,
    stopListening,
    error,
  };
}





import React, { useState, useEffect } from 'react';
import { colors, spacing } from '../../lib/theme';
import { Button } from '../ui/button';

interface GeolocationCaptureProps {
  value?: any;
  onChange: (location: any) => void;
  disabled?: boolean;
}

export const GeolocationCapture: React.FC<GeolocationCaptureProps> = ({
  value,
  onChange,
  disabled = false
}) => {
  const [location, setLocation] = useState<any>(value || null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const captureLocation = () => {
    if (disabled) return;

    setIsCapturing(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      setIsCapturing(false);
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const locationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date().toISOString()
        };
        
        setLocation(locationData);
        onChange(locationData);
        setIsCapturing(false);
      },
      (error) => {
        let errorMessage = 'Unable to capture location';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied by user';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
        }
        
        setError(errorMessage);
        setIsCapturing(false);
      },
      options
    );
  };

  const clearLocation = () => {
    setLocation(null);
    onChange(null);
    setError(null);
  };

  const formatCoordinates = (lat: number, lng: number) => {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
      {/* Capture Button */}
      <div style={{ display: 'flex', gap: spacing.sm }}>
        <Button
          variant="primary"
          onClick={captureLocation}
          disabled={disabled || isCapturing}
          icon="📍"
        >
          {isCapturing ? 'Capturing...' : 'Capture Location'}
        </Button>
        
        {location && (
          <Button
            variant="secondary"
            onClick={clearLocation}
            disabled={disabled}
            icon="🗑️"
          >
            Clear
          </Button>
        )}
      </div>

      {/* Loading State */}
      {isCapturing && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing.sm,
          padding: spacing.sm,
          backgroundColor: colors.primary + '20',
          borderRadius: '8px',
          border: `1px solid ${colors.primary}`
        }}>
          <div style={{
            width: '16px',
            height: '16px',
            border: `2px solid ${colors.primary}`,
            borderTop: '2px solid transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <span style={{ fontSize: '14px', color: colors.primary }}>
            Getting your location...
          </span>
        </div>
      )}

      {/* Location Display */}
      {location && (
        <div style={{
          padding: spacing.md,
          backgroundColor: colors.status.normal + '20',
          borderRadius: '8px',
          border: `1px solid ${colors.status.normal}`
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs }}>
            <span style={{ fontSize: '16px' }}>📍</span>
            <span style={{ fontSize: '14px', fontWeight: 600, color: colors.status.normal }}>
              Location Captured
            </span>
          </div>
          
          <div style={{ fontSize: '12px', color: colors.neutral[600], marginBottom: spacing.xs }}>
            Coordinates: {formatCoordinates(location.latitude, location.longitude)}
          </div>
          
          <div style={{ fontSize: '12px', color: colors.neutral[500] }}>
            Accuracy: ±{Math.round(location.accuracy)}m • {new Date(location.timestamp).toLocaleString()}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div style={{
          padding: spacing.sm,
          backgroundColor: colors.status.critical + '20',
          borderRadius: '8px',
          border: `1px solid ${colors.status.critical}`
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
            <span style={{ fontSize: '14px' }}>⚠️</span>
            <span style={{ fontSize: '12px', color: colors.status.critical }}>
              {error}
            </span>
          </div>
        </div>
      )}

      {disabled && (
        <p style={{ fontSize: '12px', color: colors.neutral[500], textAlign: 'center' }}>
          Location capture is disabled
        </p>
      )}
    </div>
  );
};


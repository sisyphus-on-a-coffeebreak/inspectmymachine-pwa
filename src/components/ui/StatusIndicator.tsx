import React from 'react';
import { colors, getStatusDot, statusBadgeStyles } from '../../lib/theme';

interface StatusIndicatorProps {
  status: 'normal' | 'warning' | 'critical';
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  text?: string;
  className?: string;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  size = 'md',
  showText = false,
  text,
  className = ''
}) => {
  const sizeMap = {
    sm: '8px',
    md: '12px',
    lg: '16px'
  };

  const dotStyle = {
    ...getStatusDot(status),
    width: sizeMap[size],
    height: sizeMap[size]
  };

  const badgeStyle = {
    ...statusBadgeStyles[status],
    fontSize: size === 'sm' ? '10px' : size === 'lg' ? '14px' : '12px'
  };

  if (showText) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div style={dotStyle} className="status-dot" />
        <span style={badgeStyle}>
          {text || status.toUpperCase()}
        </span>
      </div>
    );
  }

  return (
    <div 
      style={dotStyle} 
      className={`status-dot status-dot-${status} ${className}`}
      title={`Status: ${status}`}
      aria-label={`Status: ${status}`}
    />
  );
};

// Helper function to calculate status from time
export const calculateStatus = (entryTime: Date, currentTime: Date, closingTime?: Date): 'normal' | 'warning' | 'critical' => {
  const duration = currentTime.getTime() - entryTime.getTime();
  const hours = duration / (1000 * 60 * 60);
  
  // Check if after closing time (default 8 PM)
  const defaultClosing = new Date(currentTime);
  defaultClosing.setHours(20, 0, 0, 0);
  const isAfterClosing = currentTime > (closingTime || defaultClosing);
  
  if (isAfterClosing) return 'critical';
  if (hours >= 1) return 'warning';
  return 'normal';
};

// Status with duration display
interface StatusWithDurationProps {
  entryTime: Date;
  currentTime?: Date;
  closingTime?: Date;
  showDuration?: boolean;
  className?: string;
}

export const StatusWithDuration: React.FC<StatusWithDurationProps> = ({
  entryTime,
  currentTime = new Date(),
  closingTime,
  showDuration = true,
  className = ''
}) => {
  const status = calculateStatus(entryTime, currentTime, closingTime);
  const duration = currentTime.getTime() - entryTime.getTime();
  const hours = Math.floor(duration / (1000 * 60 * 60));
  const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
  
  const formatDuration = () => {
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <StatusIndicator status={status} size="md" />
      {showDuration && (
        <span style={{ 
          fontSize: '14px', 
          color: colors.neutral[600],
          fontWeight: 500 
        }}>
          {formatDuration()}
        </span>
      )}
    </div>
  );
};

export default StatusIndicator;

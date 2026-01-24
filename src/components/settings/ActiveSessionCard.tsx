/**
 * ActiveSessionCard Component
 * 
 * Displays information about an active session with option to terminate.
 */

import React from 'react';
import type { Session } from '../../lib/sessions';
import { getDeviceIcon, formatRelativeTime } from '../../lib/sessions';
import { Button } from '../ui/button';
import { colors, typography, spacing, cardStyles, borderRadius } from '../../lib/theme';
import { Monitor, Smartphone, Tablet, MapPin, Clock, LogOut, Shield } from 'lucide-react';

interface ActiveSessionCardProps {
  session: Session;
  onTerminate: (sessionId: string) => void;
  isTerminating?: boolean;
}

export const ActiveSessionCard: React.FC<ActiveSessionCardProps> = ({
  session,
  onTerminate,
  isTerminating = false,
}) => {
  const DeviceIcon = session.device_type === 'mobile' 
    ? Smartphone 
    : session.device_type === 'tablet' 
      ? Tablet 
      : Monitor;
  
  return (
    <div
      style={{
        ...cardStyles.base,
        padding: spacing.lg,
        position: 'relative',
        borderLeft: session.is_current 
          ? `4px solid ${colors.success}` 
          : `4px solid transparent`,
      }}
    >
      {/* Current session badge */}
      {session.is_current && (
        <div
          style={{
            position: 'absolute',
            top: spacing.md,
            right: spacing.md,
            backgroundColor: colors.success,
            color: '#fff',
            padding: `${spacing.xs} ${spacing.sm}`,
            borderRadius: borderRadius.full,
            fontSize: '12px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: spacing.xs,
          }}
        >
          <Shield size={12} />
          Current Session
        </div>
      )}
      
      <div style={{ display: 'flex', gap: spacing.lg, alignItems: 'flex-start' }}>
        {/* Device Icon */}
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: borderRadius.lg,
            backgroundColor: session.is_current 
              ? colors.success + '20' 
              : colors.neutral[100],
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <DeviceIcon 
            size={24} 
            color={session.is_current ? colors.success : colors.neutral[600]} 
          />
        </div>
        
        {/* Session Details */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Device & Browser */}
          <h3
            style={{
              ...typography.subheader,
              fontSize: '16px',
              color: colors.neutral[900],
              marginBottom: spacing.xs,
            }}
          >
            {session.browser} on {session.os}
          </h3>
          
          {/* Details Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: spacing.sm,
              marginTop: spacing.sm,
            }}
          >
            {/* Location */}
            {session.location && (session.location.city || session.location.country) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
                <MapPin size={14} color={colors.neutral[500]} />
                <span style={{ ...typography.caption, color: colors.neutral[600] }}>
                  {[session.location.city, session.location.country].filter(Boolean).join(', ')}
                </span>
              </div>
            )}
            
            {/* IP Address */}
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
              <span style={{ 
                ...typography.caption, 
                color: colors.neutral[500],
                fontFamily: 'monospace',
              }}>
                IP: {session.ip_address}
              </span>
            </div>
            
            {/* Last Activity */}
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
              <Clock size={14} color={colors.neutral[500]} />
              <span style={{ ...typography.caption, color: colors.neutral[600] }}>
                {session.is_current ? 'Active now' : formatRelativeTime(session.last_activity)}
              </span>
            </div>
          </div>
          
          {/* Created At */}
          <p
            style={{
              ...typography.caption,
              color: colors.neutral[500],
              marginTop: spacing.sm,
            }}
          >
            Session started: {new Date(session.created_at).toLocaleString()}
          </p>
        </div>
        
        {/* Terminate Button */}
        {!session.is_current && (
          <div style={{ flexShrink: 0 }}>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onTerminate(session.id)}
              disabled={isTerminating}
              icon={<LogOut size={16} />}
              style={{
                color: colors.critical,
                borderColor: colors.critical + '40',
              }}
            >
              {isTerminating ? 'Ending...' : 'End Session'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActiveSessionCard;








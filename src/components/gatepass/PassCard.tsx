/**
 * PassCard Component
 * 
 * Reusable card component for displaying a gate pass
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, ArrowDownCircle, ArrowUpCircle, Clock, MapPin, Package } from 'lucide-react';
import { colors, typography, spacing, cardStyles, borderRadius } from '../../lib/theme';
import { Badge } from '../ui/Badge';
import type { GatePass } from '@/pages/gatepass/gatePassTypes';
import {
  isVisitorPass,
  isOutboundVehicle,
  getPassDisplayName,
  getStatusColor,
  getStatusLabel,
  getPassTypeLabel,
  getPassTypeIcon,
  isExpired,
} from '@/pages/gatepass/gatePassTypes';

export interface PassCardProps {
  pass: GatePass;
  onClick?: () => void;
  compact?: boolean;
}

export const PassCard: React.FC<PassCardProps> = ({ pass, onClick, compact = false }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(`/app/gate-pass/${pass.id}`);
    }
  };

  const isClickable = !!onClick || true; // Always clickable to navigate
  const statusColor = getStatusColor(pass.status);
  const statusLabel = getStatusLabel(pass.status);
  const displayName = getPassDisplayName(pass);
  const isPassExpired = isExpired(pass);

  // Map status to Badge variant
  const getStatusVariant = (): 'default' | 'success' | 'warning' | 'error' | 'info' | 'neutral' => {
    const status = pass.status;
    switch (status) {
      case 'active':
      case 'inside':
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'expired':
      case 'rejected':
      case 'cancelled':
        return 'error';
      case 'draft':
        return 'neutral';
      default:
        return 'info';
    }
  };

  const statusVariant = getStatusVariant();

  // Get icon based on pass type
  const getIcon = () => {
    if (isVisitorPass(pass)) {
      return <User size={compact ? 18 : 20} />;
    }
    if (isOutboundVehicle(pass)) {
      return <ArrowUpCircle size={compact ? 18 : 20} />;
    }
    return <ArrowDownCircle size={compact ? 18 : 20} />;
  };

  // Get color based on pass type
  const getTypeColor = () => {
    if (isVisitorPass(pass)) {
      return colors.primary;
    }
    if (isOutboundVehicle(pass)) {
      return colors.brand;
    }
    return colors.success;
  };

  const typeColor = getTypeColor();

  // Format time
  const formatTime = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  // Get context info
  const getContextInfo = () => {
    if (isVisitorPass(pass)) {
      if (pass.vehicles_to_view && pass.vehicles_to_view.length > 0) {
        return `${pass.vehicles_to_view.length} vehicle${pass.vehicles_to_view.length > 1 ? 's' : ''} to view`;
      }
      return null;
    }
    if (pass.destination) {
      return `To: ${pass.destination}`;
    }
    if (pass.entry_time) {
      const entryTime = formatTime(pass.entry_time);
      return entryTime ? `Entered at ${entryTime}` : null;
    }
    if (pass.valid_to) {
      const validTo = formatTime(pass.valid_to);
      return validTo ? `Valid until ${validTo}` : null;
    }
    return null;
  };

  const contextInfo = getContextInfo();

  return (
    <div
      onClick={handleClick}
      style={{
        ...cardStyles.base,
        padding: compact ? spacing.md : spacing.lg,
        cursor: isClickable ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        borderLeft: `4px solid ${typeColor}`,
        position: 'relative',
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
        ...(isClickable ? {
          ':hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          },
        } : {}),
      }}
      onMouseEnter={(e) => {
        if (isClickable) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
          e.currentTarget.style.borderLeftWidth = '6px';
        }
      }}
      onMouseLeave={(e) => {
        if (isClickable) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = cardStyles.base.boxShadow as string;
          e.currentTarget.style.borderLeftWidth = '4px';
        }
      }}
    >
      {/* Header Row */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: compact ? spacing.xs : spacing.sm,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing.sm,
          flex: 1,
        }}>
          <div style={{
            width: compact ? 32 : 40,
            height: compact ? 32 : 40,
            borderRadius: borderRadius.full,
            backgroundColor: `${typeColor}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: typeColor,
            flexShrink: 0,
          }}>
            {getIcon()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              ...typography.subheader,
              fontSize: compact ? '14px' : '16px',
              color: colors.neutral[900],
              marginBottom: 2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {displayName}
            </div>
            <div style={{
              ...typography.caption,
              color: colors.neutral[600],
              fontSize: compact ? '11px' : '12px',
            }}>
              {pass.pass_number}
            </div>
          </div>
        </div>
        <Badge
          variant={statusVariant}
          size={compact ? 'sm' : 'md'}
        >
          {statusLabel}
        </Badge>
      </div>

      {/* Purpose */}
      {!compact && (
        <div style={{
          ...typography.bodySmall,
          color: colors.neutral[700],
          marginBottom: spacing.xs,
          textTransform: 'capitalize',
        }}>
          {pass.purpose.replace('_', ' ')}
        </div>
      )}

      {/* Context Info */}
      {contextInfo && !compact && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing.xs,
          marginTop: spacing.xs,
          ...typography.caption,
          color: colors.neutral[600],
        }}>
          {isVisitorPass(pass) && pass.vehicles_to_view && pass.vehicles_to_view.length > 0 && (
            <Package size={12} />
          )}
          {pass.destination && <MapPin size={12} />}
          {pass.entry_time && <Clock size={12} />}
          <span>{contextInfo}</span>
        </div>
      )}

      {/* Expiry Warning */}
      {isPassExpired && (
        <div style={{
          marginTop: spacing.xs,
          padding: spacing.xs,
          backgroundColor: colors.error + '10',
          borderRadius: borderRadius.sm,
          ...typography.caption,
          color: colors.error,
          display: 'flex',
          alignItems: 'center',
          gap: spacing.xs,
        }}>
          <Clock size={12} />
          Expired
        </div>
      )}

      {/* Valid Until (if not expired and not inside) */}
      {!isPassExpired && pass.status !== 'inside' && pass.valid_to && !compact && (
        <div style={{
          marginTop: spacing.xs,
          ...typography.caption,
          color: colors.neutral[500],
          display: 'flex',
          alignItems: 'center',
          gap: spacing.xs,
        }}>
          <Clock size={12} />
          Valid until {formatTime(pass.valid_to)}
        </div>
      )}
    </div>
  );
};

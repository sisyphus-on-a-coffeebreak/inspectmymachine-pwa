import React, { useState } from 'react';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { colors, spacing, typography } from '@/lib/theme';

export interface RecentScan {
  passNumber: string;
  displayName: string;
  action: 'entry' | 'exit' | 'validation';
  timestamp: number;
  success: boolean;
  passId?: string;
  accessCode?: string;
}

interface RecentScansListProps {
  scans: RecentScan[];
  onRevalidate: (scan: RecentScan) => void;
  onClear: () => void;
}

export const RecentScansList: React.FC<RecentScansListProps> = ({
  scans,
  onRevalidate,
  onClear,
}) => {
  const [expanded, setExpanded] = useState(false);

  const formatTimeAgo = (timestamp: number): string => {
    const now = Date.now();
    const diffMs = now - timestamp;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return new Date(timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  };

  const getActionIcon = (action: 'entry' | 'exit' | 'validation'): string => {
    switch (action) {
      case 'entry': return '✓ In';
      case 'exit': return '✓ Out';
      default: return '✓';
    }
  };

  const displayScans = expanded ? scans : scans.slice(0, 5);

  if (scans.length === 0) {
    return null;
  }

  return (
    <div style={{
      borderTop: `1px solid ${colors.neutral[200]}`,
      backgroundColor: colors.neutral[50],
      padding: spacing.md,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm,
      }}>
        <div style={{ ...typography.label, color: colors.neutral[700] }}>
          Recent Scans
        </div>
        <div style={{ display: 'flex', gap: spacing.xs }}>
          {scans.length > 5 && (
            <Button
              variant="ghost"
              onClick={() => setExpanded(!expanded)}
              style={{ padding: spacing.xs, minWidth: 'auto' }}
            >
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </Button>
          )}
          <Button
            variant="ghost"
            onClick={onClear}
            style={{ padding: spacing.xs, minWidth: 'auto' }}
          >
            <X size={16} />
          </Button>
        </div>
      </div>

      {/* Scan List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
        {displayScans.map((scan, index) => (
          <button
            key={`${scan.passNumber}-${scan.timestamp}-${index}`}
            onClick={() => onRevalidate(scan)}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: spacing.sm,
              backgroundColor: 'white',
              border: `1px solid ${colors.neutral[200]}`,
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              textAlign: 'left',
              width: '100%',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.neutral[50];
              e.currentTarget.style.borderColor = colors.primary[300];
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'white';
              e.currentTarget.style.borderColor = colors.neutral[200];
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                ...typography.body,
                fontWeight: 600,
                color: colors.neutral[900],
                marginBottom: '2px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {scan.passNumber} {scan.displayName}
              </div>
              <div style={{
                ...typography.bodySmall,
                color: colors.neutral[600],
                display: 'flex',
                alignItems: 'center',
                gap: spacing.xs,
              }}>
                <span>{getActionIcon(scan.action)}</span>
                <span>•</span>
                <span>{formatTimeAgo(scan.timestamp)}</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};



import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { colors, spacing, typography } from '../../lib/theme';

interface CollapsibleSectionProps {
  id?: string; // For sessionStorage key
  title: string;
  defaultExpanded?: boolean;
  children: React.ReactNode;
  badge?: string; // e.g., "4 fields" or "Optional"
  onToggle?: (expanded: boolean) => void;
  className?: string;
  forceExpanded?: boolean; // Force expansion (e.g., for validation errors)
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  id,
  title,
  defaultExpanded = false,
  children,
  badge,
  onToggle,
  className = '',
  forceExpanded = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [contentHeight, setContentHeight] = useState<number | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Sync with sessionStorage if id provided
  useEffect(() => {
    if (id) {
      const saved = sessionStorage.getItem(`collapsible_${id}`);
      if (saved !== null) {
        setIsExpanded(saved === 'true');
      }
    }
  }, [id]);

  // Save state to sessionStorage
  useEffect(() => {
    if (id) {
      sessionStorage.setItem(`collapsible_${id}`, String(isExpanded));
    }
  }, [id, isExpanded]);

  // Force expansion (e.g., for validation errors)
  useEffect(() => {
    if (forceExpanded && !isExpanded) {
      setIsExpanded(true);
    }
  }, [forceExpanded, isExpanded]);

  // Measure content height for smooth animation
  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [children, isExpanded]);

  const handleToggle = () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    onToggle?.(newExpanded);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggle();
    }
  };

  return (
    <div className={className} style={{ marginBottom: spacing.md }}>
      {/* Header */}
      <button
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        aria-expanded={isExpanded}
        aria-controls={id ? `collapsible-content-${id}` : undefined}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: `${spacing.sm} ${spacing.md}`,
          backgroundColor: colors.neutral[50],
          border: `1px solid ${colors.neutral[200]}`,
          borderRadius: '8px',
          cursor: 'pointer',
          transition: 'background-color 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = colors.neutral[100];
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = colors.neutral[50];
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
          <ChevronDown
            size={18}
            style={{
              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
              color: colors.neutral[600],
            }}
          />
          <span style={{ ...typography.label, color: colors.neutral[900] }}>
            {title}
          </span>
          {badge && (
            <span
              style={{
                fontSize: '0.75rem',
                padding: `${spacing.xs / 2}px ${spacing.xs}`,
                backgroundColor: colors.neutral[200],
                color: colors.neutral[700],
                borderRadius: '4px',
                fontWeight: 500,
              }}
            >
              {badge}
            </span>
          )}
        </div>
      </button>

      {/* Content */}
      <div
        id={id ? `collapsible-content-${id}` : undefined}
        ref={contentRef}
        style={{
          maxHeight: isExpanded ? (contentHeight ? `${contentHeight}px` : '2000px') : '0',
          overflow: 'hidden',
          transition: 'max-height 0.3s ease-out',
          border: isExpanded ? `1px solid ${colors.neutral[200]}` : 'none',
          borderTop: 'none',
          borderBottomLeftRadius: '8px',
          borderBottomRightRadius: '8px',
          backgroundColor: 'white',
        }}
      >
        <div style={{ padding: spacing.md }}>{children}</div>
      </div>
    </div>
  );
};





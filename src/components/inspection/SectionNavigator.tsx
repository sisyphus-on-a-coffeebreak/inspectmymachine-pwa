/**
 * Section Navigator Component
 * 
 * Provides "Jump to..." dropdown for navigating between sections.
 * Shows completion status per section.
 */

import React, { useState, useRef, useEffect } from 'react';
import { colors, typography, spacing, borderRadius, cardStyles } from '../../lib/theme';
import { ChevronDown, CheckCircle2, Circle } from 'lucide-react';

interface Section {
  id: string;
  name: string;
  questions: Array<{ id: string }>;
}

interface SectionNavigatorProps {
  sections: Section[];
  currentIndex: number;
  onNavigate: (index: number) => void;
  completionStatus: Record<string, boolean>; // sectionId -> isComplete
}

export const SectionNavigator: React.FC<SectionNavigatorProps> = ({
  sections,
  currentIndex,
  onNavigate,
  completionStatus,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSectionSelect = (index: number) => {
    onNavigate(index);
    setIsOpen(false);
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing.xs,
          padding: `${spacing.sm} ${spacing.md}`,
          border: `1px solid ${colors.neutral[300]}`,
          borderRadius: borderRadius.md,
          backgroundColor: 'white',
          ...typography.body,
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = colors.primary;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = colors.neutral[300];
        }}
      >
        <span>Jump to...</span>
        <ChevronDown
          size={16}
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
          }}
        />
      </button>

      {isOpen && (
        <div
          style={{
            ...cardStyles.card,
            position: 'absolute',
            top: '100%',
            left: 0,
            marginTop: spacing.xs,
            minWidth: '250px',
            zIndex: 1000,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            maxHeight: '300px',
            overflowY: 'auto',
          }}
        >
          {sections.map((section, index) => {
            const isComplete = completionStatus[section.id] || false;
            const isCurrent = index === currentIndex;

            return (
              <button
                key={section.id}
                onClick={() => handleSectionSelect(index)}
                style={{
                  width: '100%',
                  padding: spacing.md,
                  textAlign: 'left',
                  border: 'none',
                  backgroundColor: isCurrent ? colors.primary + '10' : 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.sm,
                  ...typography.body,
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (!isCurrent) {
                    e.currentTarget.style.backgroundColor = colors.neutral[50];
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isCurrent) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                {isComplete ? (
                  <CheckCircle2 size={18} color={colors.success} />
                ) : (
                  <Circle size={18} color={colors.neutral[400]} />
                )}
                <span
                  style={{
                    flex: 1,
                    color: isCurrent ? colors.primary : colors.neutral[900],
                    fontWeight: isCurrent ? 600 : 400,
                  }}
                >
                  {index + 1}. {section.name}
                </span>
                {isCurrent && (
                  <span
                    style={{
                      ...typography.caption,
                      color: colors.primary,
                      backgroundColor: colors.primary + '15',
                      padding: `${spacing.xs} ${spacing.sm}`,
                      borderRadius: borderRadius.sm,
                    }}
                  >
                    Current
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};










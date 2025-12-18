/**
 * Inspection Progress Bar Component
 * 
 * Displays progress indicators for multi-section inspection forms:
 * - Progress dots (one per section)
 * - Continuous progress bar
 * - Text counter (Section X of Y • Z of N questions answered)
 */

import React from 'react';
import { colors, typography, spacing, borderRadius } from '../../lib/theme';

interface Section {
  id: string;
  name: string;
  questions: Array<{ id: string }>;
}

interface InspectionProgressBarProps {
  sections: Section[];
  currentSectionIndex: number;
  answeredQuestions: number;
  totalQuestions: number;
  onSectionClick?: (index: number) => void;
}

export const InspectionProgressBar: React.FC<InspectionProgressBarProps> = ({
  sections,
  currentSectionIndex,
  answeredQuestions,
  totalQuestions,
  onSectionClick,
}) => {
  const progressPercent = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;

  return (
    <div style={{ marginBottom: spacing.xl }}>
      {/* Progress Dots */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: spacing.sm,
          marginBottom: spacing.md,
          flexWrap: 'wrap',
        }}
      >
        {sections.map((section, index) => {
          const isCompleted = index < currentSectionIndex;
          const isCurrent = index === currentSectionIndex;
          const sectionAnswered = section.questions.filter(
            (q) => q.id !== undefined
          ).length;

          return (
            <button
              key={section.id}
              onClick={() => onSectionClick?.(index)}
              disabled={!onSectionClick}
              style={{
                width: isCurrent ? '16px' : '12px',
                height: isCurrent ? '16px' : '12px',
                borderRadius: '50%',
                border: 'none',
                backgroundColor: isCompleted || isCurrent
                  ? colors.primary
                  : colors.neutral[300],
                cursor: onSectionClick ? 'pointer' : 'default',
                transition: 'all 0.2s',
                position: 'relative',
              }}
              title={section.name}
              aria-label={`Section ${index + 1}: ${section.name}`}
              onMouseEnter={(e) => {
                if (onSectionClick) {
                  e.currentTarget.style.transform = 'scale(1.2)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            />
          );
        })}
      </div>

      {/* Progress Bar */}
      <div
        style={{
          width: '100%',
          height: '8px',
          backgroundColor: colors.neutral[200],
          borderRadius: borderRadius.full,
          overflow: 'hidden',
          marginBottom: spacing.sm,
        }}
      >
        <div
          style={{
            width: `${progressPercent}%`,
            height: '100%',
            backgroundColor: colors.primary,
            borderRadius: borderRadius.full,
            transition: 'width 0.3s ease',
          }}
        />
      </div>

      {/* Text Counter */}
      <div
        style={{
          ...typography.bodySmall,
          color: colors.neutral[600],
          textAlign: 'center',
        }}
      >
        Section {currentSectionIndex + 1} of {sections.length} • {answeredQuestions} of{' '}
        {totalQuestions} questions answered
      </div>
    </div>
  );
};





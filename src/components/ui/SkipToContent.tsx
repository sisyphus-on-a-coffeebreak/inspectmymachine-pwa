/**
 * SkipToContent Component
 * 
 * Provides a "Skip to main content" link for keyboard navigation
 * Hidden by default, appears when focused
 */

import React from 'react';
import { colors, spacing, borderRadius } from '../../lib/theme';

export const SkipToContent: React.FC<{ mainContentId?: string }> = ({ 
  mainContentId = 'main-content' 
}) => {
  return (
    <a
      href={`#${mainContentId}`}
      style={{
        position: 'absolute',
        top: '-100px',
        left: spacing.md,
        zIndex: 10000,
        padding: `${spacing.md} ${spacing.lg}`,
        backgroundColor: colors.primary,
        color: 'white',
        textDecoration: 'none',
        borderRadius: borderRadius.md,
        fontWeight: 600,
        fontSize: '16px',
        transition: 'top 0.2s ease',
      }}
      onFocus={(e) => {
        e.currentTarget.style.top = spacing.md;
      }}
      onBlur={(e) => {
        e.currentTarget.style.top = '-100px';
      }}
      onClick={(e) => {
        e.preventDefault();
        const element = document.getElementById(mainContentId);
        if (element) {
          element.focus();
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }}
    >
      Skip to main content
    </a>
  );
};





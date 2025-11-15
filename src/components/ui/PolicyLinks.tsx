/**
 * PolicyLinks Component
 * 
 * Displays policy and documentation links for modules
 * Provides quick access to compliance guidelines and standards
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { colors, typography, spacing, borderRadius } from '../../lib/theme';
import { ExternalLink, FileText, Shield, CheckCircle } from 'lucide-react';

export interface PolicyLink {
  label: string;
  url?: string;
  external?: boolean;
  icon?: React.ReactNode;
}

export interface PolicyLinksProps {
  title?: string;
  links: PolicyLink[];
  variant?: 'compact' | 'default';
  className?: string;
}

export const PolicyLinks: React.FC<PolicyLinksProps> = ({
  title = 'Policy & Compliance',
  links,
  variant = 'default',
  className = '',
}) => {
  if (links.length === 0) return null;

  return (
    <div
      className={`policy-links ${className}`}
      style={{
        padding: variant === 'compact' ? spacing.md : spacing.lg,
        backgroundColor: colors.neutral[50],
        borderRadius: borderRadius.lg,
        border: `1px solid ${colors.neutral[200]}`,
        marginTop: spacing.lg,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing.sm,
          marginBottom: spacing.md,
        }}
      >
        <Shield size={18} color={colors.primary} />
        <h3
          style={{
            ...typography.subheader,
            fontSize: variant === 'compact' ? '14px' : '16px',
            color: colors.neutral[900],
            margin: 0,
          }}
        >
          {title}
        </h3>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: spacing.xs,
        }}
      >
        {links.map((link, index) => {
          const content = (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing.sm,
                padding: spacing.sm,
                borderRadius: borderRadius.md,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                color: colors.neutral[700],
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.neutral[100];
                e.currentTarget.style.color = colors.primary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = colors.neutral[700];
              }}
            >
              {typeof link.icon === 'string' ? (
                <span style={{ fontSize: '16px' }}>{link.icon}</span>
              ) : link.icon ? (
                link.icon
              ) : (
                <FileText size={14} />
              )}
              <span
                style={{
                  ...typography.bodySmall,
                  fontSize: variant === 'compact' ? '12px' : '14px',
                }}
              >
                {link.label}
              </span>
              {link.external && (
                <ExternalLink size={12} style={{ marginLeft: 'auto' }} />
              )}
            </div>
          );

          if (link.external && link.url) {
            return (
              <a
                key={index}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: 'none', color: 'inherit' }}
                aria-label={`${link.label} (opens in new tab)`}
              >
                {content}
              </a>
            );
          }

          if (link.url) {
            return (
              <Link
                key={index}
                to={link.url}
                style={{ textDecoration: 'none', color: 'inherit' }}
                aria-label={link.label}
              >
                {content}
              </Link>
            );
          }

          return (
            <div key={index} style={{ opacity: 0.6 }}>
              {content}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PolicyLinks;


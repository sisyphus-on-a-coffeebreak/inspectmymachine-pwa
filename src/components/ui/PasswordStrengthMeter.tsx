/**
 * PasswordStrengthMeter Component
 * 
 * Visual indicator of password strength with requirements checklist.
 */

import React, { useMemo } from 'react';
import {
  validatePassword,
  getStrengthColor,
  getStrengthLabel,
  type PasswordValidationOptions,
} from '../../lib/passwordValidation';
import { colors, typography, spacing, borderRadius } from '../../lib/theme';
import { Check, X } from 'lucide-react';

interface PasswordStrengthMeterProps {
  password: string;
  options?: PasswordValidationOptions;
  showRequirements?: boolean;
  showLabel?: boolean;
  showFeedback?: boolean;
  className?: string;
}

export const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({
  password,
  options,
  showRequirements = true,
  showLabel = true,
  showFeedback = true,
  className = '',
}) => {
  const validation = useMemo(
    () => validatePassword(password, options),
    [password, options]
  );
  
  const strengthColor = getStrengthColor(validation.strength);
  const strengthLabel = getStrengthLabel(validation.strength);
  
  // Don't show anything if password is empty
  if (!password) {
    return null;
  }
  
  return (
    <div className={className} style={{ marginTop: spacing.sm }}>
      {/* Strength Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing.sm,
          marginBottom: showRequirements ? spacing.sm : 0,
        }}
      >
        <div
          style={{
            flex: 1,
            height: 6,
            backgroundColor: colors.neutral[200],
            borderRadius: borderRadius.full,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${validation.score}%`,
              height: '100%',
              backgroundColor: strengthColor,
              borderRadius: borderRadius.full,
              transition: 'width 0.3s ease, background-color 0.3s ease',
            }}
          />
        </div>
        
        {showLabel && (
          <span
            style={{
              ...typography.caption,
              color: strengthColor,
              fontWeight: 600,
              minWidth: 80,
              textAlign: 'right',
            }}
          >
            {strengthLabel}
          </span>
        )}
      </div>
      
      {/* Requirements Checklist */}
      {showRequirements && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: spacing.xs,
            marginTop: spacing.sm,
          }}
        >
          {validation.requirements.map((req) => (
            <div
              key={req.key}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing.xs,
              }}
            >
              {req.met ? (
                <Check
                  size={14}
                  color={colors.success}
                  style={{ flexShrink: 0 }}
                />
              ) : (
                <X
                  size={14}
                  color={colors.neutral[400]}
                  style={{ flexShrink: 0 }}
                />
              )}
              <span
                style={{
                  ...typography.caption,
                  color: req.met ? colors.success : colors.neutral[500],
                  textDecoration: req.met ? 'line-through' : 'none',
                }}
              >
                {req.label}
              </span>
            </div>
          ))}
        </div>
      )}
      
      {/* Feedback */}
      {showFeedback && validation.feedback.length > 0 && (
        <div
          style={{
            marginTop: spacing.sm,
            padding: spacing.sm,
            backgroundColor: colors.warning + '10',
            borderRadius: borderRadius.md,
            borderLeft: `3px solid ${colors.warning}`,
          }}
        >
          <p
            style={{
              ...typography.caption,
              color: colors.warning,
              margin: 0,
            }}
          >
            💡 {validation.feedback[0]}
          </p>
        </div>
      )}
    </div>
  );
};

export default PasswordStrengthMeter;






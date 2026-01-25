/**
 * Password Validation Utilities
 * 
 * Provides password strength checking and validation functions.
 */

/**
 * Password strength levels
 */
export type PasswordStrength = 'weak' | 'fair' | 'good' | 'strong' | 'very-strong';

/**
 * Password validation result
 */
export interface PasswordValidationResult {
  strength: PasswordStrength;
  score: number; // 0-100
  feedback: string[];
  requirements: PasswordRequirement[];
  isValid: boolean;
}

/**
 * Individual password requirement
 */
export interface PasswordRequirement {
  key: string;
  label: string;
  met: boolean;
}

/**
 * Password validation options
 */
export interface PasswordValidationOptions {
  minLength?: number;
  requireUppercase?: boolean;
  requireLowercase?: boolean;
  requireNumbers?: boolean;
  requireSpecialChars?: boolean;
  maxLength?: number;
}

const DEFAULT_OPTIONS: Required<PasswordValidationOptions> = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  maxLength: 128,
};

/**
 * Special characters considered valid in passwords
 */
const SPECIAL_CHARS = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;

/**
 * Validate password and return detailed result
 */
export function validatePassword(
  password: string,
  options: PasswordValidationOptions = {}
): PasswordValidationResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const requirements: PasswordRequirement[] = [];
  const feedback: string[] = [];
  let score = 0;
  
  // Length check
  const hasMinLength = password.length >= opts.minLength;
  requirements.push({
    key: 'minLength',
    label: `At least ${opts.minLength} characters`,
    met: hasMinLength,
  });
  if (hasMinLength) score += 20;
  else feedback.push(`Password should be at least ${opts.minLength} characters`);
  
  // Uppercase check
  if (opts.requireUppercase) {
    const hasUppercase = /[A-Z]/.test(password);
    requirements.push({
      key: 'uppercase',
      label: 'Contains uppercase letter',
      met: hasUppercase,
    });
    if (hasUppercase) score += 15;
    else feedback.push('Add an uppercase letter');
  }
  
  // Lowercase check
  if (opts.requireLowercase) {
    const hasLowercase = /[a-z]/.test(password);
    requirements.push({
      key: 'lowercase',
      label: 'Contains lowercase letter',
      met: hasLowercase,
    });
    if (hasLowercase) score += 15;
    else feedback.push('Add a lowercase letter');
  }
  
  // Number check
  if (opts.requireNumbers) {
    const hasNumber = /[0-9]/.test(password);
    requirements.push({
      key: 'number',
      label: 'Contains a number',
      met: hasNumber,
    });
    if (hasNumber) score += 15;
    else feedback.push('Add a number');
  }
  
  // Special character check
  if (opts.requireSpecialChars) {
    const hasSpecial = SPECIAL_CHARS.test(password);
    requirements.push({
      key: 'special',
      label: 'Contains special character (!@#$%...)',
      met: hasSpecial,
    });
    if (hasSpecial) score += 15;
    else feedback.push('Add a special character (!@#$%^&*)');
  }
  
  // Bonus points for extra length
  if (password.length >= 12) score += 10;
  if (password.length >= 16) score += 10;
  
  // Check for common patterns (reduce score)
  if (hasCommonPattern(password)) {
    score = Math.max(0, score - 20);
    feedback.push('Avoid common patterns');
  }
  
  // Check for repetition
  if (hasRepetition(password)) {
    score = Math.max(0, score - 10);
    feedback.push('Avoid repeated characters');
  }
  
  // Cap score at 100
  score = Math.min(100, score);
  
  // Determine strength level
  const strength = getStrengthLevel(score);
  
  // Check if all requirements are met
  const isValid = requirements.every(r => r.met);
  
  return {
    strength,
    score,
    feedback,
    requirements,
    isValid,
  };
}

/**
 * Get strength level from score
 */
function getStrengthLevel(score: number): PasswordStrength {
  if (score >= 90) return 'very-strong';
  if (score >= 70) return 'strong';
  if (score >= 50) return 'good';
  if (score >= 30) return 'fair';
  return 'weak';
}

/**
 * Check for common password patterns
 */
function hasCommonPattern(password: string): boolean {
  const lowerPassword = password.toLowerCase();
  
  // Common words to avoid
  const commonPatterns = [
    'password',
    '123456',
    'qwerty',
    'abc123',
    'letmein',
    'welcome',
    'admin',
    'login',
    'master',
    'dragon',
    'baseball',
    'iloveyou',
    'trustno1',
    'sunshine',
    'princess',
    'football',
    'shadow',
    'superman',
    'michael',
    'ashley',
  ];
  
  return commonPatterns.some(pattern => lowerPassword.includes(pattern));
}

/**
 * Check for character repetition
 */
function hasRepetition(password: string): boolean {
  // Check for 3+ repeated characters
  return /(.)\1{2,}/.test(password);
}

/**
 * Get color for password strength
 */
export function getStrengthColor(strength: PasswordStrength): string {
  switch (strength) {
    case 'very-strong':
      return '#10B981'; // Green
    case 'strong':
      return '#34D399'; // Light green
    case 'good':
      return '#F59E0B'; // Amber
    case 'fair':
      return '#F97316'; // Orange
    case 'weak':
    default:
      return '#EF4444'; // Red
  }
}

/**
 * Get label for password strength
 */
export function getStrengthLabel(strength: PasswordStrength): string {
  switch (strength) {
    case 'very-strong':
      return 'Very Strong';
    case 'strong':
      return 'Strong';
    case 'good':
      return 'Good';
    case 'fair':
      return 'Fair';
    case 'weak':
    default:
      return 'Weak';
  }
}









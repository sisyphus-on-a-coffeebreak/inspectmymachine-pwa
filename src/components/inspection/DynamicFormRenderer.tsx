import React, { useState, useEffect, useCallback, useRef } from 'react';
import { colors, typography, spacing } from '../../lib/theme';
import { Button } from '../ui/button';
import { CameraCapture } from './CameraCapture';
import { AudioRecorder } from './AudioRecorder';
import { SignaturePad } from './SignaturePad';
import { GeolocationCapture } from './GeolocationCapture';
import { DynamicTyreFields } from './DynamicTyreFields';

interface Question {
  id: string;
  question_text: string;
  question_type: string;
  is_required: boolean;
  is_critical: boolean;
  validation_rules?: any;
  conditional_logic?: any;
  options?: Array<{id: string, option_text: string, option_value: string}>;
}

interface Section {
  id: string;
  name: string;
  questions: Question[];
}

interface DynamicFormRendererProps {
  template: {
    sections: Section[];
  };
  initialAnswers?: Record<string, any>;
  onSubmit: (answers: Record<string, any>) => void;
  onSaveDraft: (answers: Record<string, any>) => void;
  readOnly?: boolean;
  submitting?: boolean;
}

export const DynamicFormRenderer: React.FC<DynamicFormRendererProps> = ({
  template,
  initialAnswers = {},
  onSubmit,
  onSaveDraft,
  readOnly = false,
  submitting = false
}) => {
  const [currentSection, setCurrentSection] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>(initialAnswers);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [pendingUploads, setPendingUploads] = useState<File[]>([]);
  const answersRef = useRef(answers);

  const currentSectionData = template.sections[currentSection];
  const totalSections = template.sections.length;

  const retryPendingUploads = useCallback(async () => {
    // Implementation for retrying failed uploads when back online
    // Retrying pending uploads
    setPendingUploads([]);
  }, []);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    setAnswers(initialAnswers);
  }, [initialAnswers]);

  // Auto-save every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      onSaveDraft(answersRef.current);
      setLastSaved(new Date());
    }, 30000);

    return () => clearInterval(interval);
  }, [onSaveDraft]);

  // Offline detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      // Retry pending uploads when back online
      if (pendingUploads.length > 0) {
        retryPendingUploads();
      }
    };

    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [retryPendingUploads]); // Added retryPendingUploads back to dependencies

  const handleAnswerChange = useCallback((questionId: string, value: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
    
    // Real-time validation
    const question = currentSectionData.questions.find(q => q.id === questionId);
    if (question && question.validation_rules) {
      const validationResult = validateField(question, value, question.validation_rules);
      if (validationResult) {
        setErrors(prev => ({
          ...prev,
          [questionId]: validationResult
        }));
      } else {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[questionId];
          return newErrors;
        });
      }
    } else {
      // Clear error when user starts answering
      if (errors[questionId]) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[questionId];
          return newErrors;
        });
      }
    }
  }, [errors, currentSectionData.questions]);

  const validateSection = useCallback(() => {
    const sectionErrors: Record<string, string> = {};
    
    currentSectionData.questions.forEach(question => {
      const value = answers[question.id];
      
      // Required field validation
      if (question.is_required && !value) {
        sectionErrors[question.id] = `${question.question_text} is required`;
        return;
      }
      
      // Skip validation if no value and not required
      if (value === null || value === undefined || value === '') return;
      
      // Custom validation rules
      if (question.validation_rules) {
        const rules = question.validation_rules;
        const validationResult = validateField(question, value, rules);
        if (validationResult) {
          sectionErrors[question.id] = validationResult;
        }
      }
    });
    
    setErrors(sectionErrors);
    return Object.keys(sectionErrors).length === 0;
  }, [currentSectionData, answers]);

  const validateField = (question: Question, value: any, rules: any): string | null => {
    // Numeric validations
    if (rules.min !== undefined && Number(value) < rules.min) {
      return `Value must be at least ${rules.min}`;
    }
    
    if (rules.max !== undefined && Number(value) > rules.max) {
      return `Value must be at most ${rules.max}`;
    }
    
    // String length validations
    if (rules.min_length && String(value).length < rules.min_length) {
      return `Must be at least ${rules.min_length} characters`;
    }
    
    if (rules.max_length && String(value).length > rules.max_length) {
      return `Must be at most ${rules.max_length} characters`;
    }
    
    // Pattern validation
    if (rules.pattern && !new RegExp(rules.pattern).test(String(value))) {
      return rules.pattern_message || 'Invalid format';
    }
    
    // File validations
    if (question.question_type === 'camera' && Array.isArray(value)) {
      if (rules.max_files && value.length > rules.max_files) {
        return `Maximum ${rules.max_files} files allowed`;
      }
      
      // Check file sizes
      const maxSizeBytes = parseFileSize(rules.max_size || '5MB');
      const oversizedFiles = value.filter((file: File) => file.size > maxSizeBytes);
      if (oversizedFiles.length > 0) {
        return `Some files exceed the maximum size of ${rules.max_size || '5MB'}`;
      }
      
      // Check file types
      if (rules.allowed_types && Array.isArray(rules.allowed_types)) {
        const invalidTypes = value.filter((file: File) => 
          !rules.allowed_types.includes(file.type)
        );
        if (invalidTypes.length > 0) {
          return `Only ${rules.allowed_types.join(', ')} files are allowed`;
        }
      }
    }
    
    // Audio validations
    if (question.question_type === 'audio' && value) {
      if (rules.max_duration && value.duration > rules.max_duration) {
        return `Recording must be at most ${rules.max_duration} seconds`;
      }
    }
    
    // Tyre field validations
    if (question.question_type === 'tyre_fields' && Array.isArray(value)) {
      if (rules.max_tyres && value.length > rules.max_tyres) {
        return `Maximum ${rules.max_tyres} tyres allowed`;
      }
      
      // Validate each tyre
      for (let i = 0; i < value.length; i++) {
        const tyre = value[i];
        if (!tyre.position) {
          return `Tyre #${i + 1}: Position is required`;
        }
        
        if (rules.min_tread_depth && tyre.tread_depth < rules.min_tread_depth) {
          return `Tyre #${i + 1}: Tread depth must be at least ${rules.min_tread_depth}mm`;
        }
        
        if (rules.min_pressure && tyre.pressure < rules.min_pressure) {
          return `Tyre #${i + 1}: Pressure must be at least ${rules.min_pressure} PSI`;
        }
      }
    }
    
    // Custom validation function
    if (rules.custom_validator && typeof rules.custom_validator === 'function') {
      const customResult = rules.custom_validator(value, question);
      if (customResult) {
        return customResult;
      }
    }
    
    return null;
  };

  const parseFileSize = (sizeStr: string): number => {
    const units: Record<string, number> = {
      'B': 1,
      'KB': 1024,
      'MB': 1024 * 1024,
      'GB': 1024 * 1024 * 1024
    };
    
    const match = sizeStr.match(/^(\d+(?:\.\d+)?)\s*([A-Z]+)$/i);
    if (!match) return 5 * 1024 * 1024; // Default 5MB
    
    const value = parseFloat(match[1]);
    const unit = match[2].toUpperCase();
    
    return value * (units[unit] || 1024 * 1024);
  };

  const handleNext = useCallback(() => {
    if (validateSection()) {
      if (currentSection < totalSections - 1) {
        setCurrentSection(prev => prev + 1);
      } else {
        onSubmit(answers);
      }
    }
  }, [validateSection, currentSection, totalSections, answers, onSubmit]);

  const handlePrevious = useCallback(() => {
    if (currentSection > 0) {
      setCurrentSection(prev => prev - 1);
    }
  }, [currentSection]);

  const renderQuestion = (question: Question) => {
    const value = answers[question.id];
    const error = errors[question.id];
    const isVisible = checkConditionalLogic(question);

    if (!isVisible) return null;

    return (
      <div key={question.id} style={{ marginBottom: spacing.lg }}>
        <label style={{
          ...typography.label,
          color: colors.neutral[900],
          marginBottom: spacing.sm,
          display: 'block'
        }}>
          {question.question_text}
          {question.is_required && <span style={{ color: colors.status.critical }}> *</span>}
          {question.is_critical && <span style={{ color: colors.status.warning }}> ⚠</span>}
        </label>

        {question.help_text && (
          <p style={{
            ...typography.bodySmall,
            color: colors.neutral[600],
            marginBottom: spacing.sm
          }}>
            {question.help_text}
          </p>
        )}

        {renderQuestionInput(question, value, error)}

        {error && (
          <p style={{
            ...typography.bodySmall,
            color: colors.status.critical,
            marginTop: spacing.xs
          }}>
            {error}
          </p>
        )}
      </div>
    );
  };

  const renderQuestionInput = (question: Question, value: any, error: string) => {
    const inputStyle = {
      width: '100%',
      padding: spacing.md,
      borderRadius: '8px',
      border: `1px solid ${error ? colors.status.critical : colors.neutral[300]}`,
      ...typography.body,
      color: colors.neutral[900]
    };

    switch (question.question_type) {
      case 'text':
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            style={inputStyle}
            disabled={readOnly}
          />
        );

      case 'year':
        const currentYear = new Date().getFullYear();
        const startYear = question.validation_rules?.min || 1990;
        const endYear = question.validation_rules?.max || currentYear + 1;
        
        const yearOptions = [];
        for (let year = endYear; year >= startYear; year--) {
          yearOptions.push(year);
        }
        
        return (
          <select
            value={value || ''}
            onChange={(e) => handleAnswerChange(question.id, parseInt(e.target.value))}
            style={inputStyle}
            disabled={readOnly}
          >
            <option value="">Select Year</option>
            {yearOptions.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        );

      case 'number':
        return (
          <input
            type="number"
            value={value || ''}
            onChange={(e) => handleAnswerChange(question.id, parseFloat(e.target.value))}
            style={inputStyle}
            disabled={readOnly}
          />
        );

      case 'date':
        return (
          <input
            type="date"
            value={value || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            style={inputStyle}
            disabled={readOnly}
          />
        );

      case 'yesno':
        return (
          <div style={{ display: 'flex', gap: spacing.md }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
              <input
                type="radio"
                name={question.id}
                checked={value === true}
                onChange={() => handleAnswerChange(question.id, true)}
                disabled={readOnly}
              />
              Yes
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
              <input
                type="radio"
                name={question.id}
                checked={value === false}
                onChange={() => handleAnswerChange(question.id, false)}
                disabled={readOnly}
              />
              No
            </label>
          </div>
        );

      case 'dropdown':
        return (
          <select
            value={value || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            style={inputStyle}
            disabled={readOnly}
          >
            <option value="">Select an option</option>
            {question.options?.map(option => (
              <option key={option.id} value={option.option_value}>
                {option.option_text}
              </option>
            ))}
          </select>
        );

      case 'slider':
        return (
          <div>
            <input
              type="range"
              min={question.validation_rules?.min || 1}
              max={question.validation_rules?.max || 10}
              value={value || 5}
              onChange={(e) => handleAnswerChange(question.id, parseInt(e.target.value))}
              style={{ width: '100%' }}
              disabled={readOnly}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: spacing.sm }}>
              <span style={{ ...typography.bodySmall, color: colors.neutral[600] }}>
                {question.validation_rules?.min || 1}
              </span>
              <span style={{ ...typography.bodySmall, color: colors.neutral[600] }}>
                {question.validation_rules?.max || 10}
              </span>
            </div>
            <div style={{ textAlign: 'center', marginTop: spacing.sm }}>
              <span style={{ ...typography.subheader, color: colors.primary }}>
                {value || 5}
              </span>
            </div>
          </div>
        );

      case 'camera':
        return (
          <CameraCapture
            value={value}
            onChange={(files) => handleAnswerChange(question.id, files)}
            maxFiles={question.validation_rules?.max_files || 5}
            maxSize={question.validation_rules?.max_size || '5MB'}
            disabled={readOnly}
          />
        );

      case 'audio':
        return (
          <AudioRecorder
            value={value}
            onChange={(audioData) => handleAnswerChange(question.id, audioData)}
            maxDuration={question.validation_rules?.max_duration || 60}
            disabled={readOnly}
          />
        );

      case 'signature':
        return (
          <SignaturePad
            value={value}
            onChange={(signature) => handleAnswerChange(question.id, signature)}
            disabled={readOnly}
          />
        );

      case 'multiselect':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
            {question.options?.map(option => (
              <label key={option.id} style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                <input
                  type="checkbox"
                  checked={value?.includes(option.option_value) || false}
                  onChange={(e) => {
                    const currentValues = value || [];
                    if (e.target.checked) {
                      handleAnswerChange(question.id, [...currentValues, option.option_value]);
                    } else {
                      handleAnswerChange(question.id, currentValues.filter(v => v !== option.option_value));
                    }
                  }}
                  disabled={readOnly}
                />
                {option.option_text}
              </label>
            ))}
          </div>
        );

      case 'geolocation':
        return (
          <GeolocationCapture
            value={value}
            onChange={(location) => handleAnswerChange(question.id, location)}
            disabled={readOnly}
          />
        );

      case 'tyre_fields':
        return (
          <DynamicTyreFields
            value={value}
            onChange={(tyres) => handleAnswerChange(question.id, tyres)}
            maxTyres={question.validation_rules?.max_tyres || 10}
            disabled={readOnly}
          />
        );

      default:
        return <div>Unsupported question type: {question.question_type}</div>;
    }
  };

  const checkConditionalLogic = (question: Question): boolean => {
    if (!question.conditional_logic) return true;
    
    const { depends_on, condition, value: expectedValue, operator } = question.conditional_logic;
    const dependentAnswer = answers[depends_on];
    
    // Handle multiple dependencies with AND/OR operators
    if (Array.isArray(depends_on)) {
      const results = depends_on.map((depId, index) => {
        const depAnswer = answers[depId];
        const depCondition = condition[index];
        const depValue = expectedValue[index];
        
        return evaluateCondition(depAnswer, depCondition, depValue);
      });
      
      if (operator === 'AND') {
        return results.every(result => result);
      } else if (operator === 'OR') {
        return results.some(result => result);
      }
    }
    
    return evaluateCondition(dependentAnswer, condition, expectedValue);
  };

  const evaluateCondition = (answer: any, condition: string, expectedValue: any): boolean => {
    switch (condition) {
      case 'equals':
        return answer === expectedValue;
      case 'not_equals':
        return answer !== expectedValue;
      case 'greater_than':
        return Number(answer) > Number(expectedValue);
      case 'less_than':
        return Number(answer) < Number(expectedValue);
      case 'greater_than_or_equal':
        return Number(answer) >= Number(expectedValue);
      case 'less_than_or_equal':
        return Number(answer) <= Number(expectedValue);
      case 'contains':
        return String(answer).toLowerCase().includes(String(expectedValue).toLowerCase());
      case 'not_contains':
        return !String(answer).toLowerCase().includes(String(expectedValue).toLowerCase());
      case 'starts_with':
        return String(answer).toLowerCase().startsWith(String(expectedValue).toLowerCase());
      case 'ends_with':
        return String(answer).toLowerCase().endsWith(String(expectedValue).toLowerCase());
      case 'is_empty':
        return !answer || answer === '';
      case 'is_not_empty':
        return answer && answer !== '';
      case 'is_true':
        return answer === true;
      case 'is_false':
        return answer === false;
      case 'in_array':
        return Array.isArray(expectedValue) && expectedValue.includes(answer);
      case 'not_in_array':
        return Array.isArray(expectedValue) && !expectedValue.includes(answer);
      case 'regex':
        return new RegExp(expectedValue).test(String(answer));
      default:
        return true;
    }
  };

  return (
    <div style={{ 
      maxWidth: '800px', 
      margin: '0 auto', 
      padding: spacing.xl,
      // Mobile optimizations - using CSS classes instead of inline styles
      // Mobile styles will be handled by CSS classes
    }}>
      {/* Progress Indicator */}
      <div style={{ marginBottom: spacing.xl }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: spacing.sm }}>
          <span style={{ ...typography.label, color: colors.neutral[600] }}>
            Step {currentSection + 1} of {totalSections}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
            <span style={{ ...typography.bodySmall, color: colors.neutral[500] }}>
              {Math.round(((currentSection + 1) / totalSections) * 100)}% Complete
            </span>
            {isOffline && (
              <span style={{ 
                ...typography.bodySmall, 
                color: colors.status.warning,
                display: 'flex',
                alignItems: 'center',
                gap: spacing.xs
              }}>
                📡 Offline
              </span>
            )}
            {lastSaved && (
              <span style={{ 
                ...typography.bodySmall, 
                color: colors.status.normal,
                display: 'flex',
                alignItems: 'center',
                gap: spacing.xs
              }}>
                💾 Saved {lastSaved.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
        <div style={{
          width: '100%',
          height: '8px',
          backgroundColor: colors.neutral[200],
          borderRadius: '4px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${((currentSection + 1) / totalSections) * 100}%`,
            height: '100%',
            backgroundColor: isOffline ? colors.status.warning : colors.primary,
            transition: 'width 0.3s ease'
          }} />
        </div>
        
        {/* Section completion status */}
        <div style={{ 
          display: 'flex', 
          gap: spacing.xs, 
          marginTop: spacing.sm,
          flexWrap: 'wrap'
        }}>
          {template.sections.map((section, index) => {
            const isCompleted = index < currentSection;
            const isCurrent = index === currentSection;
            const hasErrors = Object.keys(errors).some(errorId => 
              section.questions.some(q => q.id === errorId)
            );
            
            return (
              <div
                key={section.id}
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor: isCompleted 
                    ? colors.status.normal 
                    : isCurrent 
                      ? (hasErrors ? colors.status.critical : colors.primary)
                      : colors.neutral[300],
                  border: isCurrent ? `2px solid ${colors.primary}` : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                title={`${section.name} ${isCompleted ? '(Completed)' : isCurrent ? '(Current)' : '(Pending)'}`}
              />
            );
          })}
        </div>
      </div>

      {/* Section Header */}
      <div style={{ marginBottom: spacing.xl }}>
        <h2 style={{
          ...typography.header,
          color: colors.neutral[900],
          marginBottom: spacing.sm
        }}>
          {currentSectionData.name}
        </h2>
        <p style={{
          ...typography.body,
          color: colors.neutral[600]
        }}>
          Please complete all required fields in this section.
        </p>
      </div>

      {/* Questions */}
      <div style={{ marginBottom: spacing.xl }}>
        {currentSectionData.questions.map(renderQuestion)}
      </div>

      {/* Navigation */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: spacing.lg,
        borderTop: `1px solid ${colors.neutral[200]}`
      }}>
        <Button
          variant="secondary"
          onClick={handlePrevious}
          disabled={currentSection === 0}
        >
          Previous
        </Button>

        <div style={{ display: 'flex', gap: spacing.sm }}>
          <Button
            variant="secondary"
            onClick={() => onSaveDraft(answers)}
          >
            Save Draft
          </Button>
          
          <Button
            variant="primary"
            onClick={handleNext}
            disabled={submitting}
          >
            {currentSection === totalSections - 1 ? 'Submit Inspection' : 'Next'}
          </Button>
        </div>
      </div>
    </div>
  );
};

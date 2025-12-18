import React, { useState, useEffect, useCallback, useRef } from 'react';
import { colors, typography, spacing } from '../../lib/theme';
import { Button } from '../ui/button';
import { CameraCapture } from './CameraCapture';
import { AudioRecorder } from './AudioRecorder';
import { SignaturePad } from './SignaturePad';
import { GeolocationCapture } from './GeolocationCapture';
import { DynamicTyreFields } from './DynamicTyreFields';
import { SegmentedControl } from '../ui/SegmentedControl';
import { InspectionProgressBar } from './InspectionProgressBar';
import { SectionNavigator } from './SectionNavigator';
import { AutoSaveIndicator } from './AutoSaveIndicator';
import { useDebounce } from '../../hooks/useDebounce';
import { CheckCircle2 } from 'lucide-react';
import { useMobileViewport, getResponsiveContainerStyles, getTouchButtonStyles } from '../../lib/mobileUtils';

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
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const answersRef = useRef(answers);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const currentSectionData = template.sections[currentSection];
  const totalSections = template.sections.length;

  // Debounce answers for auto-save (3 seconds)
  const debouncedAnswers = useDebounce(answers, 3000);

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
    
    // Resume draft: Navigate to last section with answers
    if (Object.keys(initialAnswers).length > 0) {
      // Find the last section that has at least one answer
      let lastSectionWithAnswers = 0;
      template.sections.forEach((section, index) => {
        const hasAnswer = section.questions.some((q) => initialAnswers[q.id] !== undefined);
        if (hasAnswer) {
          lastSectionWithAnswers = index;
        }
      });
      
      // Navigate to the section after the last one with answers (or stay at 0)
      // This allows user to continue from where they left off
      if (lastSectionWithAnswers < totalSections - 1) {
        setCurrentSection(lastSectionWithAnswers);
      }
    }
  }, [initialAnswers, template.sections, totalSections]);

  // Calculate progress
  const progress = React.useMemo(() => {
    const totalQuestions = template.sections.reduce(
      (sum, section) => sum + section.questions.length,
      0
    );

    const answeredQuestions = Object.keys(answers).filter(
      (questionId) => {
        const value = answers[questionId];
        return value !== null && value !== undefined && value !== '';
      }
    ).length;

    const sectionCompletion: Record<string, boolean> = {};
    template.sections.forEach((section) => {
      const sectionQuestions = section.questions.map((q) => q.id);
      const answeredInSection = sectionQuestions.filter(
        (qId) => {
          const value = answers[qId];
          return value !== null && value !== undefined && value !== '';
        }
      ).length;
      sectionCompletion[section.id] = answeredInSection === section.questions.length;
    });

    return { totalQuestions, answeredQuestions, sectionCompletion };
  }, [template.sections, answers]);

  // Auto-save with debounce (3 seconds after last change)
  useEffect(() => {
    // Skip if answers haven't changed from initial
    if (Object.keys(debouncedAnswers).length === 0) return;

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    setAutoSaveStatus('saving');

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await onSaveDraft(debouncedAnswers);
        setLastSaved(new Date());
        setAutoSaveStatus('saved');
      } catch (error) {
        setAutoSaveStatus('error');
      }
    }, 100); // Small delay to show "saving" state

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [debouncedAnswers, onSaveDraft]);

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
        // Scroll to top of section
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        onSubmit(answers);
      }
    } else {
      // Show error toast or highlight missing fields
      const missingFields = currentSectionData.questions.filter(
        (q) => q.is_required && !answers[q.id]
      );
      if (missingFields.length > 0) {
        // Errors are already set by validateSection
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }, [validateSection, currentSection, totalSections, answers, onSubmit, currentSectionData]);

  const handlePrevious = useCallback(() => {
    if (currentSection > 0) {
      setCurrentSection(prev => prev - 1);
      // Scroll to top of section
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentSection]);

  const handleSectionNavigate = useCallback((index: number) => {
    setCurrentSection(index);
    // Scroll to top of section
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleRetrySave = useCallback(() => {
    setAutoSaveStatus('saving');
    onSaveDraft(answers)
      .then(() => {
        setLastSaved(new Date());
        setAutoSaveStatus('saved');
      })
      .catch(() => {
        setAutoSaveStatus('error');
      });
  }, [answers, onSaveDraft]);

  const isQuestionAnswered = (questionId: string): boolean => {
    const value = answers[questionId];
    return value !== null && value !== undefined && value !== '';
  };

  const renderQuestion = (question: Question) => {
    const value = answers[question.id];
    const error = errors[question.id];
    const isVisible = checkConditionalLogic(question);
    const isAnswered = isQuestionAnswered(question.id);

    if (!isVisible) return null;

    const isMobile = useMobileViewport();

    return (
      <div key={question.id} style={{ 
        marginBottom: isMobile ? spacing.xl : spacing.lg,
        paddingBottom: isMobile ? spacing.md : spacing.sm,
        borderBottom: isMobile ? `1px solid ${colors.neutral[100]}` : 'none',
      }}>
        <label style={{
          ...typography.label,
          color: colors.neutral[900],
          marginBottom: spacing.sm,
          display: 'flex',
          alignItems: 'center',
          gap: spacing.xs,
          fontSize: isMobile ? 'clamp(14px, 3.5vw, 16px)' : typography.label.fontSize,
        }}>
          {isAnswered && (
            <CheckCircle2 size={isMobile ? 18 : 16} color={colors.success} style={{ flexShrink: 0 }} />
          )}
          <span style={{ flex: 1 }}>
            {question.question_text}
            {question.is_required && <span style={{ color: colors.status.critical }}> *</span>}
            {question.is_critical && <span style={{ color: colors.status.warning }}> ⚠</span>}
          </span>
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
    const isMobile = useMobileViewport();
    const inputStyle = {
      width: '100%',
      padding: isMobile ? spacing.lg : spacing.md,
      minHeight: isMobile ? '44px' : 'auto',
      borderRadius: '8px',
      border: `1px solid ${error ? colors.status.critical : colors.neutral[300]}`,
      ...typography.body,
      fontSize: isMobile ? 'clamp(16px, 4vw, 18px)' : typography.body.fontSize,
      color: colors.neutral[900],
      touchAction: 'manipulation',
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
        // If options are provided, use segmented control for categorical ratings
        if (question.options && question.options.length > 0) {
          const options = question.options.map((opt) => ({
            value: opt.option_value,
            label: opt.option_text,
          }));
          
          // Determine default value from options or validation rules
          const defaultValue = question.validation_rules?.default 
            ? question.validation_rules.default 
            : question.options[Math.floor(question.options.length / 2)]?.option_value;
          
          return (
            <div>
              <SegmentedControl
                options={options}
                value={value !== null && value !== undefined ? value : defaultValue}
                onChange={(val) => handleAnswerChange(question.id, val)}
                disabled={readOnly}
                fullWidth
                size="md"
              />
              {question.validation_rules?.description && (
                <div style={{ marginTop: spacing.sm, ...typography.bodySmall, color: colors.neutral[600] }}>
                  {question.validation_rules.description}
                </div>
              )}
            </div>
          );
        }
        
        // Otherwise, use numeric range slider
        return (
          <div>
            <input
              type="range"
              min={question.validation_rules?.min || 1}
              max={question.validation_rules?.max || 10}
              value={value !== null && value !== undefined ? value : (question.validation_rules?.default || 5)}
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
                {value !== null && value !== undefined ? value : (question.validation_rules?.default || 5)}
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

  const isMobile = useMobileViewport();

  return (
    <div style={{ 
      ...getResponsiveContainerStyles({
        maxWidth: '800px',
        padding: spacing.lg,
        mobilePadding: spacing.md,
      }),
    }}>
      {/* Progress Bar */}
      <InspectionProgressBar
        sections={template.sections}
        currentSectionIndex={currentSection}
        answeredQuestions={progress.answeredQuestions}
        totalQuestions={progress.totalQuestions}
        onSectionClick={handleSectionNavigate}
      />

      {/* Section Header with Navigator */}
      <div style={{ 
        marginBottom: spacing.xl,
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between',
        alignItems: isMobile ? 'stretch' : 'flex-start',
        gap: spacing.md,
      }}>
        <div style={{ flex: 1 }}>
          <h2 style={{
            ...typography.header,
            color: colors.neutral[900],
            marginBottom: spacing.sm,
            fontSize: isMobile ? 'clamp(20px, 5vw, 24px)' : typography.header.fontSize,
          }}>
            {currentSectionData.name}
          </h2>
          <p style={{
            ...typography.body,
            color: colors.neutral[600],
            fontSize: isMobile ? 'clamp(14px, 3.5vw, 16px)' : typography.body.fontSize,
          }}>
            Please complete all required fields in this section.
          </p>
        </div>
        {!isMobile && (
          <SectionNavigator
            sections={template.sections}
            currentIndex={currentSection}
            onNavigate={handleSectionNavigate}
            completionStatus={progress.sectionCompletion}
          />
        )}
      </div>


      {/* Questions */}
      <div style={{ marginBottom: spacing.xl }}>
        {currentSectionData.questions.map(renderQuestion)}
      </div>

      {/* Auto-Save Indicator */}
      <div style={{ 
        marginBottom: spacing.lg,
        paddingTop: spacing.md,
        borderTop: `1px solid ${colors.neutral[200]}`,
        display: 'flex',
        justifyContent: 'center',
      }}>
        <AutoSaveIndicator
          status={autoSaveStatus}
          lastSaved={lastSaved}
          onRetry={handleRetrySave}
        />
      </div>

      {/* Navigation */}
      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between',
        alignItems: 'stretch',
        gap: spacing.md,
        paddingTop: spacing.lg,
        borderTop: `1px solid ${colors.neutral[200]}`,
        position: isMobile ? 'sticky' : 'static',
        bottom: 0,
        backgroundColor: 'white',
        zIndex: 10,
        ...(isMobile && {
          paddingBottom: spacing.md,
          marginLeft: `-${spacing.md}`,
          marginRight: `-${spacing.md}`,
          paddingLeft: spacing.md,
          paddingRight: spacing.md,
        }),
      }}>
        <Button
          variant="secondary"
          onClick={handlePrevious}
          disabled={currentSection === 0}
          style={isMobile ? getTouchButtonStyles() : undefined}
        >
          Previous
        </Button>

        <div style={{ 
          display: 'flex', 
          flexDirection: isMobile ? 'column' : 'row',
          gap: spacing.sm,
          width: isMobile ? '100%' : 'auto',
        }}>
          <Button
            variant="secondary"
            onClick={() => {
              setAutoSaveStatus('saving');
              onSaveDraft(answers)
                .then(() => {
                  setLastSaved(new Date());
                  setAutoSaveStatus('saved');
                })
                .catch(() => {
                  setAutoSaveStatus('error');
                });
            }}
            style={isMobile ? { ...getTouchButtonStyles(), width: '100%' } : undefined}
          >
            Save Draft
          </Button>
          
          <Button
            variant="primary"
            onClick={handleNext}
            disabled={submitting}
            style={isMobile ? { ...getTouchButtonStyles(), width: '100%' } : undefined}
          >
            {currentSection === totalSections - 1 ? 'Submit Inspection' : 'Next Section'}
          </Button>
        </div>
      </div>
    </div>
  );
};

/**
 * InputWithHistory Component
 * 
 * Input field with autocomplete suggestions based on input history
 * Shows dropdown with previous values as user types
 */

import React, { useState, useRef, useEffect } from 'react';
import { useInputHistory, type UseInputHistoryOptions } from '../../hooks/useInputHistory';
import { colors, spacing, borderRadius, shadows, typography } from '../../lib/theme';
import { ChevronDown, X } from 'lucide-react';

export interface InputWithHistoryProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: string;
  onChange: (value: string) => void;
  historyOptions: UseInputHistoryOptions;
  onSelectSuggestion?: (value: string) => void;
  showClearButton?: boolean;
}

export const InputWithHistory: React.FC<InputWithHistoryProps> = ({
  value,
  onChange,
  historyOptions,
  onSelectSuggestion,
  showClearButton = false,
  className = '',
  style,
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const { suggestions, addToHistory } = useInputHistory(value, historyOptions);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setIsOpen(newValue.length >= (historyOptions.minLength || 2) && suggestions.length > 0);
    setFocusedIndex(-1);
  };

  // Handle input focus
  const handleFocus = () => {
    if (suggestions.length > 0 && value.length >= (historyOptions.minLength || 2)) {
      setIsOpen(true);
    }
  };

  // Handle input blur (with delay to allow clicking suggestions)
  const handleBlur = () => {
    setTimeout(() => {
      setIsOpen(false);
      setFocusedIndex(-1);
    }, 200);
  };

  // Handle suggestion selection
  const handleSelectSuggestion = (suggestion: string) => {
    onChange(suggestion);
    setIsOpen(false);
    setFocusedIndex(-1);
    inputRef.current?.focus();
    onSelectSuggestion?.(suggestion);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        if (focusedIndex >= 0 && focusedIndex < suggestions.length) {
          e.preventDefault();
          handleSelectSuggestion(suggestions[focusedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setFocusedIndex(-1);
        break;
    }
  };

  // Scroll focused item into view
  useEffect(() => {
    if (focusedIndex >= 0 && suggestionsRef.current) {
      const focusedElement = suggestionsRef.current.children[focusedIndex] as HTMLElement;
      if (focusedElement) {
        focusedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [focusedIndex]);

  // Update suggestions visibility
  useEffect(() => {
    setIsOpen(
      value.length >= (historyOptions.minLength || 2) && 
      suggestions.length > 0 &&
      !suggestions.includes(value)
    );
  }, [value, suggestions, historyOptions.minLength]);

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: spacing.md,
    paddingRight: showClearButton && value ? '40px' : spacing.md,
    border: `1px solid ${colors.neutral[300]}`,
    borderRadius: borderRadius.md,
    fontSize: '16px',
    color: colors.neutral[900],
    backgroundColor: props.disabled ? colors.neutral[100] : 'white',
    transition: 'border-color 0.2s ease',
    ...style,
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <div style={{ position: 'relative' }}>
        <input
          {...props}
          ref={inputRef}
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          style={inputStyle}
          className={className}
          autoComplete="off"
        />
        {showClearButton && value && (
          <button
            type="button"
            onClick={() => {
              onChange('');
              inputRef.current?.focus();
            }}
            style={{
              position: 'absolute',
              right: spacing.sm,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: spacing.xs,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: colors.neutral[500],
              borderRadius: borderRadius.sm,
              width: '32px',
              height: '32px',
            }}
            aria-label="Clear input"
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.neutral[100];
              e.currentTarget.style.color = colors.neutral[700];
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = colors.neutral[500];
            }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: spacing.xs,
            backgroundColor: 'white',
            border: `1px solid ${colors.neutral[200]}`,
            borderRadius: borderRadius.md,
            boxShadow: shadows.lg,
            maxHeight: '200px',
            overflowY: 'auto',
            zIndex: 1000,
          }}
          role="listbox"
          aria-label="Input suggestions"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => handleSelectSuggestion(suggestion)}
              style={{
                width: '100%',
                padding: spacing.sm,
                textAlign: 'left',
                background: focusedIndex === index ? colors.neutral[100] : 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                color: colors.neutral[900],
                ...typography.body,
                transition: 'background-color 0.15s ease',
              }}
              onMouseEnter={() => setFocusedIndex(index)}
              role="option"
              aria-selected={focusedIndex === index}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};





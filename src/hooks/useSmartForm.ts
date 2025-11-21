import { useCallback, useRef, useEffect } from 'react';

export type FieldType = 'amount' | 'phone' | 'email' | 'name' | 'otp' | 'text' | 'number';

export interface FieldPreset {
  inputMode?: 'text' | 'numeric' | 'decimal' | 'tel' | 'email' | 'url' | 'search';
  pattern?: string;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoComplete?: string;
  maxLength?: number;
}

const fieldPresets: Record<FieldType, FieldPreset> = {
  amount: {
    inputMode: 'decimal',
    pattern: '[0-9]*\\.?[0-9]*',
  },
  phone: {
    inputMode: 'tel',
    pattern: '[0-9+\\-\\s]*',
  },
  email: {
    inputMode: 'email',
    autoCapitalize: 'none',
    autoComplete: 'email',
  },
  name: {
    autoCapitalize: 'words',
    autoComplete: 'name',
  },
  otp: {
    inputMode: 'numeric',
    maxLength: 6,
    autoComplete: 'one-time-code',
  },
  text: {
    inputMode: 'text',
  },
  number: {
    inputMode: 'numeric',
    pattern: '[0-9]*',
  },
};

export interface UseSmartFormOptions {
  onEnterSubmit?: () => void;
  autoFocusNext?: boolean;
}

export function useSmartForm(options: UseSmartFormOptions = {}) {
  const formRef = useRef<HTMLFormElement>(null);
  const { autoFocusNext = true, onEnterSubmit } = options;

  const getInputProps = useCallback((fieldType: FieldType) => {
    const preset = fieldPresets[fieldType] || fieldPresets.text;
    return {
      ...preset,
      onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && autoFocusNext) {
          e.preventDefault();
          const form = formRef.current;
          if (!form) return;

          const inputs = Array.from(
            form.querySelectorAll<HTMLInputElement>('input, textarea, select, button[type="submit"]')
          ).filter(
            (el) =>
              !el.disabled &&
              el.offsetParent !== null && // visible
              (el.type !== 'hidden' || el.tagName === 'BUTTON')
          );

          const currentIndex = inputs.indexOf(e.currentTarget);
          const nextIndex = currentIndex + 1;

          if (nextIndex < inputs.length) {
            const nextInput = inputs[nextIndex];
            if (nextInput.tagName === 'BUTTON') {
              // If next is submit button, trigger it
              (nextInput as HTMLButtonElement).click();
            } else {
              nextInput.focus();
            }
          } else if (onEnterSubmit) {
            // If at last input, trigger submit
            onEnterSubmit();
          }
        }
      },
    };
  }, [autoFocusNext, onEnterSubmit]);

  return {
    formRef,
    getInputProps,
    fieldPresets,
  };
}


import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FormField } from '../FormField';

// Mock hooks
vi.mock('../../../hooks/useInputMask', () => ({
  useInputMask: () => null,
}));

vi.mock('../../../lib/autocomplete-utils', () => ({
  getAutocompleteForField: () => 'off',
}));

vi.mock('../../../lib/form-validation', () => ({
  validateField: () => ({ isValid: true, error: undefined }),
  debounceValidation: (fn: () => void) => fn,
}));

describe('FormField', () => {
  it('should display error message when error prop is provided', () => {
    render(
      <FormField 
        label="Email" 
        value=""
        onChange={vi.fn()}
        error="Invalid email"
      />
    );
    expect(screen.getByText('Invalid email')).toBeInTheDocument();
  });

  it('should show required indicator when required is true', () => {
    render(
      <FormField 
        label="Name" 
        value=""
        onChange={vi.fn()}
        required
      />
    );
    const label = screen.getByText('Name');
    expect(label).toBeInTheDocument();
    // Check for asterisk (required indicator)
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('should call onChange when input value changes', () => {
    const handleChange = vi.fn();
    const { container } = render(
      <FormField 
        label="Email" 
        value=""
        onChange={handleChange}
      />
    );
    
    // Query input directly since label doesn't use htmlFor
    const input = container.querySelector('input[type="text"]') as HTMLInputElement;
    expect(input).toBeInTheDocument();
    fireEvent.change(input, { target: { value: 'test@example.com' } });
    expect(handleChange).toHaveBeenCalledWith('test@example.com');
  });

  it('should display hint when provided', () => {
    render(
      <FormField 
        label="Password" 
        value=""
        onChange={vi.fn()}
        hint="Must be at least 8 characters"
      />
    );
    expect(screen.getByText('Must be at least 8 characters')).toBeInTheDocument();
  });

  it('should display success message when success prop is provided', () => {
    render(
      <FormField 
        label="Email" 
        value="test@example.com"
        onChange={vi.fn()}
        success="Email is valid"
      />
    );
    expect(screen.getByText('Email is valid')).toBeInTheDocument();
  });

  it('should be disabled when disabled prop is true', () => {
    const { container } = render(
      <FormField 
        label="Email" 
        value=""
        onChange={vi.fn()}
        disabled
      />
    );
    const input = container.querySelector('input[type="text"]') as HTMLInputElement;
    expect(input).toBeDisabled();
  });

  it('should have proper ARIA attributes for accessibility', () => {
    const { container } = render(
      <FormField 
        label="Email" 
        value=""
        onChange={vi.fn()}
        error="Invalid email"
      />
    );
    
    const input = container.querySelector('input[type="text"]') as HTMLInputElement;
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', 'Email-error');
  });
});


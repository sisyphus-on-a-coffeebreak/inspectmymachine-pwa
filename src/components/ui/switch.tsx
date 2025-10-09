import * as React from 'react';

export interface SwitchProps {
  id?: string;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function Switch({ id, checked, onCheckedChange, disabled, className }: SwitchProps) {
  return (
    <input
      id={id}
      type="checkbox"
      role="switch"
      className={className}
      disabled={disabled}
      checked={!!checked}
      onChange={(e) => onCheckedChange?.(e.currentTarget.checked)}
    />
  );
}

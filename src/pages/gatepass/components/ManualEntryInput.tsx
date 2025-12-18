import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { colors, spacing, typography } from '../../../lib/theme';

interface ManualEntryInputProps {
  onSubmit: (code: string) => void;
  disabled?: boolean;
  loading?: boolean;
}

export const ManualEntryInput: React.FC<ManualEntryInputProps> = ({
  onSubmit,
  disabled = false,
  loading = false,
}) => {
  const [value, setValue] = useState('');
  const [focused, setFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() && !disabled && !loading) {
      onSubmit(value.trim());
      setValue(''); // Clear after submission
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: spacing.sm }}>
      <Input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="Or enter pass number or access code"
        disabled={disabled || loading}
        style={{
          flex: 1,
          fontSize: '16px',
          padding: spacing.md,
          borderColor: focused ? colors.primary[500] : colors.neutral[300],
          transition: 'border-color 0.2s',
        }}
      />
      <Button
        type="submit"
        variant="primary"
        disabled={!value.trim() || disabled || loading}
        icon={<ArrowRight size={18} />}
        style={{
          minWidth: '60px',
          padding: spacing.md,
        }}
      >
        {loading ? '...' : ''}
      </Button>
    </form>
  );
};







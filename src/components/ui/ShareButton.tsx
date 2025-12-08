/**
 * ShareButton Component
 * 
 * A reusable button component that uses native share API
 * Falls back to clipboard copy if native share is not available
 */

import React from 'react';
import { Share2 } from 'lucide-react';
import { useNativeShare } from '../../hooks/useNativeShare';
import { useToast } from '../../providers/ToastProvider';
import { Button } from './button';

export interface ShareButtonProps {
  title?: string;
  text?: string;
  url?: string;
  files?: File[];
  variant?: 'primary' | 'secondary' | 'success' | 'error';
  icon?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onShareComplete?: (shared: boolean) => void;
}

export const ShareButton: React.FC<ShareButtonProps> = ({
  title,
  text,
  url,
  files,
  variant = 'secondary',
  icon,
  children,
  className = '',
  disabled = false,
  onShareComplete,
}) => {
  const { showToast } = useToast();
  const { share, canShare } = useNativeShare({
    showToast,
    onSuccess: onShareComplete,
  });

  const handleShare = async () => {
    await share({
      title,
      text,
      url,
      files,
    });
  };

  return (
    <Button
      variant={variant}
      onClick={handleShare}
      disabled={disabled}
      icon={icon || <Share2 size={18} />}
      className={className}
    >
      {children || (canShare ? 'Share' : 'Copy Link')}
    </Button>
  );
};


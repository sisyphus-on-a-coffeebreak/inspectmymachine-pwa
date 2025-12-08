import { useCallback } from 'react';
import { logger } from '../lib/logger';

export interface ShareData {
  title?: string;
  text?: string;
  url?: string;
  files?: File[];
}

export interface UseNativeShareOptions {
  onSuccess?: (shared: boolean) => void;
  onError?: (error: Error) => void;
  showToast?: (options: { title: string; description?: string; variant?: 'success' | 'error' | 'warning' | 'info' }) => void;
}

export interface UseNativeShareReturn {
  share: (data: ShareData) => Promise<boolean>;
  canShare: boolean;
  canShareFiles: boolean;
}

export function useNativeShare(options: UseNativeShareOptions = {}): UseNativeShareReturn {
  const { onSuccess, onError, showToast } = options;
  const canShare = typeof navigator.share === 'function';
  const canShareFiles = typeof navigator.canShare === 'function';

  const share = useCallback(async (data: ShareData): Promise<boolean> => {
    try {
      // Check if Web Share API is available and can handle the data
      if (canShare) {
        // If files are provided, check if they can be shared
        if (data.files && data.files.length > 0) {
          if (canShareFiles) {
            const shareData: ShareData = {
              title: data.title,
              text: data.text,
              url: data.url,
              files: data.files,
            };
            
            // Check if the platform can share files
            if (navigator.canShare(shareData)) {
              await navigator.share(shareData);
              return true;
            }
          }
          // If files can't be shared, fall through to URL/text sharing
        } else {
          // Share without files
          const shareData: ShareData = {
            title: data.title,
            text: data.text,
            url: data.url,
          };
          await navigator.share(shareData);
          return true;
        }
      }

      // Fallback: Copy to clipboard
      const textToCopy = data.url || data.text || data.title || '';
      if (textToCopy && navigator.clipboard) {
        await navigator.clipboard.writeText(textToCopy);
        
        // Show toast notification
        if (showToast) {
          showToast({
            title: 'Copied to Clipboard',
            description: 'Link copied to clipboard',
            variant: 'success',
          });
        } else if (window.dispatchEvent) {
          window.dispatchEvent(
            new CustomEvent('toast', {
              detail: {
                message: 'Link copied to clipboard',
                type: 'success',
              },
            })
          );
        }
        if (onSuccess) onSuccess(false);
        return false;
      }

      return false;
    } catch (error) {
      // User cancelled or error occurred
      if ((error as Error).name === 'AbortError') {
        // User cancelled - don't show error
        return false;
      }
      
      logger.error('Share failed', error, 'useNativeShare');
      
      // Fallback to clipboard on error
      try {
        const textToCopy = data.url || data.text || data.title || '';
        if (textToCopy && navigator.clipboard) {
          await navigator.clipboard.writeText(textToCopy);
          if (showToast) {
            showToast({
              title: 'Copied to Clipboard',
              description: 'Link copied to clipboard',
              variant: 'success',
            });
          } else if (window.dispatchEvent) {
            window.dispatchEvent(
              new CustomEvent('toast', {
                detail: {
                  message: 'Link copied to clipboard',
                  type: 'success',
                },
              })
            );
          }
          if (onSuccess) onSuccess(false);
        }
      } catch (clipboardError) {
        if (onError) onError(clipboardError as Error);
      }
      
      return false;
    }
  }, [canShare, canShareFiles, onSuccess, onError, showToast]);

  return {
    share,
    canShare,
    canShareFiles,
  };
}


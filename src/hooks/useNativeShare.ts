import { useCallback } from 'react';

export interface ShareData {
  title?: string;
  text?: string;
  url?: string;
  files?: File[];
}

export interface UseNativeShareReturn {
  share: (data: ShareData) => Promise<boolean>;
  canShare: boolean;
  canShareFiles: boolean;
}

export function useNativeShare(): UseNativeShareReturn {
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
        
        // Show toast notification (you can integrate with your toast system)
        if (window.dispatchEvent) {
          window.dispatchEvent(
            new CustomEvent('toast', {
              detail: {
                message: 'Link copied to clipboard',
                type: 'success',
              },
            })
          );
        }
        return false;
      }

      return false;
    } catch (error) {
      // User cancelled or error occurred
      if ((error as Error).name === 'AbortError') {
        // User cancelled - don't show error
        return false;
      }
      
      console.error('Share failed:', error);
      
      // Fallback to clipboard on error
      try {
        const textToCopy = data.url || data.text || data.title || '';
        if (textToCopy && navigator.clipboard) {
          await navigator.clipboard.writeText(textToCopy);
          if (window.dispatchEvent) {
            window.dispatchEvent(
              new CustomEvent('toast', {
                detail: {
                  message: 'Link copied to clipboard',
                  type: 'success',
                },
              })
            );
          }
        }
      } catch (clipboardError) {
        console.error('Clipboard copy failed:', clipboardError);
      }
      
      return false;
    }
  }, [canShare, canShareFiles]);

  return {
    share,
    canShare,
    canShareFiles,
  };
}


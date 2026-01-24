/**
 * React hook to get a safe logo URL that avoids CORS issues
 * Automatically fetches external storage URLs through backend proxy
 */

import { useState, useEffect } from 'react';
import { getSafeLogoUrl } from '../lib/report-branding';

/**
 * Hook to convert a logo URL to a safe blob URL that avoids CORS
 * @param logoUrl - The original logo URL (may be external R2/S3 URL)
 * @returns The safe URL to use in img src (blob URL for external, original for relative)
 */
export function useLogoUrl(logoUrl: string | null): string | null {
  const [safeUrl, setSafeUrl] = useState<string | null>(logoUrl);

  useEffect(() => {
    if (!logoUrl) {
      setSafeUrl(null);
      return;
    }

    // If it's already a relative URL or data URL, use it directly
    if (logoUrl.startsWith('/') || logoUrl.startsWith('data:')) {
      setSafeUrl(logoUrl);
      return;
    }

    // For external URLs, fetch through backend proxy
    let cancelled = false;
    getSafeLogoUrl(logoUrl)
      .then((url) => {
        if (!cancelled) {
          setSafeUrl(url);
        }
      })
      .catch((error) => {
        console.warn('Failed to fetch logo URL:', error);
        if (!cancelled) {
          // Fallback to original URL (component will handle error)
          setSafeUrl(logoUrl);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [logoUrl]);

  return safeUrl;
}


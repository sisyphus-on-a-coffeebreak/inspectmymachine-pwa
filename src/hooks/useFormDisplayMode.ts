/**
 * Form Display Mode Hook
 * 
 * Determines whether a form should be displayed in a bottom sheet or full page
 * Based on query parameters and navigation context
 */

import { useLocation, useSearchParams } from 'react-router-dom';
import { useMemo } from 'react';

export type FormDisplayMode = 'fullpage' | 'bottomsheet';

export interface UseFormDisplayModeOptions {
  defaultMode?: FormDisplayMode;
  preferBottomSheet?: boolean; // Prefer bottom sheet on mobile
}

export interface UseFormDisplayModeReturn {
  mode: FormDisplayMode;
  isBottomSheet: boolean;
  isFullPage: boolean;
  openBottomSheet: () => void;
  closeBottomSheet: () => void;
}

export function useFormDisplayMode(
  options: UseFormDisplayModeOptions = {}
): UseFormDisplayModeReturn {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { defaultMode = 'fullpage', preferBottomSheet = true } = options;

  // Check if mobile viewport
  const isMobile = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768;
  }, []);

  // Determine mode from query params or context
  const mode = useMemo<FormDisplayMode>(() => {
    // Check query param first
    const modeParam = searchParams.get('mode');
    if (modeParam === 'bottomsheet' || modeParam === 'modal') {
      return 'bottomsheet';
    }
    if (modeParam === 'fullpage' || modeParam === 'page') {
      return 'fullpage';
    }

    // Check location state
    const stateMode = (location.state as any)?.formMode;
    if (stateMode) {
      return stateMode;
    }

    // Default: prefer bottom sheet on mobile if option is enabled
    if (preferBottomSheet && isMobile) {
      return 'bottomsheet';
    }

    return defaultMode;
  }, [searchParams, location.state, defaultMode, preferBottomSheet, isMobile]);

  const openBottomSheet = () => {
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      newParams.set('mode', 'bottomsheet');
      return newParams;
    });
  };

  const closeBottomSheet = () => {
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      newParams.delete('mode');
      return newParams;
    });
  };

  return {
    mode,
    isBottomSheet: mode === 'bottomsheet',
    isFullPage: mode === 'fullpage',
    openBottomSheet,
    closeBottomSheet,
  };
}





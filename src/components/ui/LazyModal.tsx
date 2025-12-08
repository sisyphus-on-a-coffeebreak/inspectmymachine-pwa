/**
 * LazyModal Component
 * 
 * Lazy-loaded Modal wrapper for code splitting
 */

import { lazy, Suspense } from 'react';
import { ModalProps } from './Modal';
import { SkeletonLoader } from './SkeletonLoader';

// Lazy load Modal component
const Modal = lazy(() => import('./Modal').then(m => ({ default: m.Modal })));

/**
 * Lazy-loaded Modal component
 * Falls back to skeleton loader while loading
 */
export function LazyModal(props: ModalProps) {
  return (
    <Suspense fallback={<SkeletonLoader variant="card" />}>
      <Modal {...props} />
    </Suspense>
  );
}



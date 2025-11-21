import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

export interface SearchResult {
  id: string;
  type: 'gate-pass' | 'inspection' | 'expense' | 'vehicle' | 'user';
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
}

export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K (Mac) or Ctrl+K (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      // Escape to close
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen(prev => !prev), []);

  const handleSelect = useCallback((result: SearchResult) => {
    navigate(result.path);
    setIsOpen(false);
  }, [navigate]);

  return {
    isOpen,
    open,
    close,
    toggle,
    handleSelect,
  };
}


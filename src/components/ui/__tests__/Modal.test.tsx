import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Modal } from '../Modal';

// Mock hooks
vi.mock('../../../hooks/useFocusTrap', () => ({
  useFocusTrap: () => ({ current: null }),
}));

vi.mock('../../../hooks/useSmartKeyboard', () => ({
  useSmartKeyboard: () => {},
}));

vi.mock('../../../lib/mobileUtils', () => ({
  getResponsiveModalStyles: () => ({}),
  lockBodyScroll: () => {},
  useMobileViewport: () => false,
}));

describe('Modal', () => {
  it('should render when title is provided', () => {
    const onClose = vi.fn();
    render(
      <Modal onClose={onClose} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Modal content')).toBeInTheDocument();
  });

  it('should render children when provided', () => {
    const onClose = vi.fn();
    render(
      <Modal onClose={onClose} title="Test">
        <p>Modal content</p>
      </Modal>
    );
    expect(screen.getByText('Modal content')).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(
      <Modal onClose={onClose} title="Test">
        Content
      </Modal>
    );
    
    const closeButton = screen.getByLabelText(/close/i);
    fireEvent.click(closeButton);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when Escape key is pressed', () => {
    const onClose = vi.fn();
    render(
      <Modal onClose={onClose} title="Test">
        Content
      </Modal>
    );
    
    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should render footer when provided', () => {
    const onClose = vi.fn();
    render(
      <Modal onClose={onClose} title="Test" footer={<button>Footer Button</button>}>
        Content
      </Modal>
    );
    expect(screen.getByText('Footer Button')).toBeInTheDocument();
  });

  it('should have proper ARIA attributes', () => {
    const onClose = vi.fn();
    render(
      <Modal onClose={onClose} title="Test Modal">
        Content
      </Modal>
    );
    
    const modal = screen.getByRole('dialog');
    expect(modal).toHaveAttribute('aria-modal', 'true');
    expect(modal).toHaveAttribute('aria-labelledby', 'modal-title');
  });
});


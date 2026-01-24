/**
 * Login Page Tests
 * Tests the login functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, createMockAuthContext, vi as vitest } from '../testUtils';
import Login from '../../pages/Login';

describe('Login Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render login form', () => {
      const authContext = createMockAuthContext(null);
      renderWithProviders(<Login />, {
        authContext,
        initialEntries: ['/login'],
      });

      expect(screen.getByLabelText(/employee id/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('should show VOMS branding', () => {
      const authContext = createMockAuthContext(null);
      renderWithProviders(<Login />, {
        authContext,
        initialEntries: ['/login'],
      });

      expect(screen.getByText('VOMS')).toBeInTheDocument();
      expect(screen.getByText(/vehicle operations management system/i)).toBeInTheDocument();
    });

    it('should show welcome message', () => {
      const authContext = createMockAuthContext(null);
      renderWithProviders(<Login />, {
        authContext,
        initialEntries: ['/login'],
      });

      expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
      expect(screen.getByText(/sign in to continue/i)).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should require employee ID', async () => {
      const user = userEvent.setup();
      const mockLogin = vi.fn();
      const authContext = createMockAuthContext(null, { login: mockLogin });
      
      renderWithProviders(<Login />, {
        authContext,
        initialEntries: ['/login'],
      });

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      // Form should not submit without required fields
      expect(mockLogin).not.toHaveBeenCalled();
    });

    it('should require password', async () => {
      const user = userEvent.setup();
      const mockLogin = vi.fn();
      const authContext = createMockAuthContext(null, { login: mockLogin });
      
      renderWithProviders(<Login />, {
        authContext,
        initialEntries: ['/login'],
      });

      const employeeIdInput = screen.getByLabelText(/employee id/i);
      await user.type(employeeIdInput, 'TEST001');

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      // Form should not submit without password
      expect(mockLogin).not.toHaveBeenCalled();
    });

    it('should convert employee ID to uppercase', async () => {
      const user = userEvent.setup();
      const authContext = createMockAuthContext(null);
      
      renderWithProviders(<Login />, {
        authContext,
        initialEntries: ['/login'],
      });

      const employeeIdInput = screen.getByLabelText(/employee id/i);
      await user.type(employeeIdInput, 'test001');

      expect(employeeIdInput).toHaveValue('TEST001');
    });
  });

  describe('Form Submission', () => {
    it('should call login on valid submission', async () => {
      const user = userEvent.setup();
      const mockLogin = vi.fn().mockResolvedValue(undefined);
      const authContext = createMockAuthContext(null, { login: mockLogin });
      
      renderWithProviders(<Login />, {
        authContext,
        initialEntries: ['/login'],
      });

      const employeeIdInput = screen.getByLabelText(/employee id/i);
      const passwordInput = screen.getByLabelText(/password/i);

      await user.type(employeeIdInput, 'TEST001');
      await user.type(passwordInput, 'password123');

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('TEST001', 'password123');
      });
    });

    it('should show loading state during submission', async () => {
      const user = userEvent.setup();
      let resolveLogin: () => void;
      const loginPromise = new Promise<void>((resolve) => {
        resolveLogin = resolve;
      });
      const mockLogin = vi.fn().mockReturnValue(loginPromise);
      const authContext = createMockAuthContext(null, { login: mockLogin });
      
      renderWithProviders(<Login />, {
        authContext,
        initialEntries: ['/login'],
      });

      const employeeIdInput = screen.getByLabelText(/employee id/i);
      const passwordInput = screen.getByLabelText(/password/i);

      await user.type(employeeIdInput, 'TEST001');
      await user.type(passwordInput, 'password123');

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      // Should show loading state
      await waitFor(() => {
        expect(screen.getByText(/signing in/i)).toBeInTheDocument();
      });

      resolveLogin!();
    });

    it('should show error message on login failure', async () => {
      const user = userEvent.setup();
      const mockLogin = vi.fn().mockRejectedValue(new Error('Invalid credentials'));
      const authContext = createMockAuthContext(null, { login: mockLogin });
      
      renderWithProviders(<Login />, {
        authContext,
        initialEntries: ['/login'],
      });

      const employeeIdInput = screen.getByLabelText(/employee id/i);
      const passwordInput = screen.getByLabelText(/password/i);

      await user.type(employeeIdInput, 'TEST001');
      await user.type(passwordInput, 'wrongpassword');

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
      });
    });
  });

  describe('Password Visibility', () => {
    it('should toggle password visibility', async () => {
      const user = userEvent.setup();
      const authContext = createMockAuthContext(null);
      
      renderWithProviders(<Login />, {
        authContext,
        initialEntries: ['/login'],
      });

      const passwordInput = screen.getByLabelText(/password/i);
      expect(passwordInput).toHaveAttribute('type', 'password');

      // Find the toggle button (eye icon button)
      const toggleButtons = screen.getAllByRole('button');
      const toggleButton = toggleButtons.find(btn => btn.getAttribute('tabindex') === '-1');
      
      if (toggleButton) {
        await user.click(toggleButton);
        expect(passwordInput).toHaveAttribute('type', 'text');

        await user.click(toggleButton);
        expect(passwordInput).toHaveAttribute('type', 'password');
      }
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels', () => {
      const authContext = createMockAuthContext(null);
      renderWithProviders(<Login />, {
        authContext,
        initialEntries: ['/login'],
      });

      expect(screen.getByLabelText(/employee id/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    });

    it('should have proper button text', () => {
      const authContext = createMockAuthContext(null);
      renderWithProviders(<Login />, {
        authContext,
        initialEntries: ['/login'],
      });

      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });
  });
});








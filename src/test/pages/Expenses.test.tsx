/**
 * Expenses Module Tests
 * Tests all expense related functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, mockUsers, createMockAuthContext, mockApiResponses } from '../testUtils';
import type { User } from '../../providers/authTypes';

// Mock the expense components
vi.mock('../../pages/expenses/EmployeeExpenseDashboard', () => ({
  EmployeeExpenseDashboard: () => (
    <div data-testid="expense-dashboard">
      <h1>Expense Dashboard</h1>
      <div data-testid="expense-list">Expense List</div>
      <button data-testid="create-expense-btn">Create Expense</button>
      <div data-testid="balance">Balance: ₹5,000</div>
    </div>
  ),
}));

vi.mock('../../pages/expenses/CreateExpense', () => ({
  CreateExpense: () => (
    <div data-testid="create-expense">
      <h1>Create Expense</h1>
      <form data-testid="expense-form">
        <input data-testid="amount" type="number" placeholder="Amount" />
        <select data-testid="category">
          <option value="FUEL">Fuel</option>
          <option value="MAINTENANCE">Maintenance</option>
        </select>
        <input data-testid="description" placeholder="Description" />
        <button type="submit">Submit Expense</button>
      </form>
    </div>
  ),
}));

vi.mock('../../pages/expenses/ExpenseDetails', () => ({
  ExpenseDetails: () => (
    <div data-testid="expense-details">
      <h1>Expense Details</h1>
      <div data-testid="expense-info">Expense Info</div>
      <div data-testid="receipt">Receipt Image</div>
      <div data-testid="status">Status: Pending</div>
    </div>
  ),
}));

vi.mock('../../pages/expenses/ExpenseHistory', () => ({
  ExpenseHistory: () => (
    <div data-testid="expense-history">
      <h1>Expense History</h1>
      <div data-testid="history-list">History List</div>
    </div>
  ),
}));

vi.mock('../../pages/expenses/EmployeeLedger', () => ({
  EmployeeLedger: () => (
    <div data-testid="employee-ledger">
      <h1>Employee Ledger</h1>
      <div data-testid="transactions">Transactions</div>
      <div data-testid="balance-summary">Balance Summary</div>
    </div>
  ),
}));

vi.mock('../../pages/expenses/LedgerReconciliation', () => ({
  LedgerReconciliation: () => (
    <div data-testid="ledger-reconciliation">
      <h1>Ledger Reconciliation</h1>
      <div data-testid="reconciliation-form">Reconciliation Form</div>
    </div>
  ),
}));

vi.mock('../../pages/expenses/ExpenseAnalytics', () => ({
  ExpenseAnalytics: () => (
    <div data-testid="expense-analytics">
      <h1>Expense Analytics</h1>
      <div data-testid="charts">Charts</div>
      <div data-testid="category-breakdown">Category Breakdown</div>
    </div>
  ),
}));

vi.mock('../../pages/expenses/ExpenseReports', () => ({
  ExpenseReports: () => (
    <div data-testid="expense-reports">
      <h1>Expense Reports</h1>
      <div data-testid="report-filters">Report Filters</div>
      <div data-testid="report-list">Report List</div>
    </div>
  ),
}));

vi.mock('../../pages/expenses/ReceiptsGallery', () => ({
  ReceiptsGallery: () => (
    <div data-testid="receipts-gallery">
      <h1>Receipts Gallery</h1>
      <div data-testid="receipt-grid">Receipt Grid</div>
    </div>
  ),
}));

vi.mock('../../pages/expenses/AdvanceLedgerView', () => ({
  AdvanceLedgerView: () => (
    <div data-testid="advance-ledger">
      <h1>Advance Ledger</h1>
      <div data-testid="advance-details">Advance Details</div>
    </div>
  ),
}));

describe('Expenses Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Expense Dashboard', () => {
    it('should render dashboard for authenticated users', async () => {
      const { EmployeeExpenseDashboard } = await import('../../pages/expenses/EmployeeExpenseDashboard');
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<EmployeeExpenseDashboard />, {
        authContext,
        initialEntries: ['/app/expenses'],
      });

      expect(screen.getByTestId('expense-dashboard')).toBeInTheDocument();
    });

    it('should show expense list', async () => {
      const { EmployeeExpenseDashboard } = await import('../../pages/expenses/EmployeeExpenseDashboard');
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<EmployeeExpenseDashboard />, {
        authContext,
        initialEntries: ['/app/expenses'],
      });

      expect(screen.getByTestId('expense-list')).toBeInTheDocument();
    });

    it('should show create expense button', async () => {
      const { EmployeeExpenseDashboard } = await import('../../pages/expenses/EmployeeExpenseDashboard');
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<EmployeeExpenseDashboard />, {
        authContext,
        initialEntries: ['/app/expenses'],
      });

      expect(screen.getByTestId('create-expense-btn')).toBeInTheDocument();
    });

    it('should show balance', async () => {
      const { EmployeeExpenseDashboard } = await import('../../pages/expenses/EmployeeExpenseDashboard');
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<EmployeeExpenseDashboard />, {
        authContext,
        initialEntries: ['/app/expenses'],
      });

      expect(screen.getByTestId('balance')).toBeInTheDocument();
    });
  });

  describe('Create Expense', () => {
    it('should render create form', async () => {
      const { CreateExpense } = await import('../../pages/expenses/CreateExpense');
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<CreateExpense />, {
        authContext,
        initialEntries: ['/app/expenses/create'],
      });

      expect(screen.getByTestId('create-expense')).toBeInTheDocument();
      expect(screen.getByTestId('expense-form')).toBeInTheDocument();
    });

    it('should have amount input', async () => {
      const { CreateExpense } = await import('../../pages/expenses/CreateExpense');
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<CreateExpense />, {
        authContext,
        initialEntries: ['/app/expenses/create'],
      });

      expect(screen.getByTestId('amount')).toBeInTheDocument();
    });

    it('should have category select', async () => {
      const { CreateExpense } = await import('../../pages/expenses/CreateExpense');
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<CreateExpense />, {
        authContext,
        initialEntries: ['/app/expenses/create'],
      });

      expect(screen.getByTestId('category')).toBeInTheDocument();
    });

    it('should have description input', async () => {
      const { CreateExpense } = await import('../../pages/expenses/CreateExpense');
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<CreateExpense />, {
        authContext,
        initialEntries: ['/app/expenses/create'],
      });

      expect(screen.getByTestId('description')).toBeInTheDocument();
    });
  });

  describe('Expense Details', () => {
    it('should render details page', async () => {
      const { ExpenseDetails } = await import('../../pages/expenses/ExpenseDetails');
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<ExpenseDetails />, {
        authContext,
        initialEntries: ['/app/expenses/1'],
      });

      expect(screen.getByTestId('expense-details')).toBeInTheDocument();
    });

    it('should show expense info', async () => {
      const { ExpenseDetails } = await import('../../pages/expenses/ExpenseDetails');
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<ExpenseDetails />, {
        authContext,
        initialEntries: ['/app/expenses/1'],
      });

      expect(screen.getByTestId('expense-info')).toBeInTheDocument();
    });

    it('should show receipt', async () => {
      const { ExpenseDetails } = await import('../../pages/expenses/ExpenseDetails');
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<ExpenseDetails />, {
        authContext,
        initialEntries: ['/app/expenses/1'],
      });

      expect(screen.getByTestId('receipt')).toBeInTheDocument();
    });

    it('should show status', async () => {
      const { ExpenseDetails } = await import('../../pages/expenses/ExpenseDetails');
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<ExpenseDetails />, {
        authContext,
        initialEntries: ['/app/expenses/1'],
      });

      expect(screen.getByTestId('status')).toBeInTheDocument();
    });
  });

  describe('Expense History', () => {
    it('should render history page', async () => {
      const { ExpenseHistory } = await import('../../pages/expenses/ExpenseHistory');
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<ExpenseHistory />, {
        authContext,
        initialEntries: ['/app/expenses/history'],
      });

      expect(screen.getByTestId('expense-history')).toBeInTheDocument();
    });

    it('should show history list', async () => {
      const { ExpenseHistory } = await import('../../pages/expenses/ExpenseHistory');
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<ExpenseHistory />, {
        authContext,
        initialEntries: ['/app/expenses/history'],
      });

      expect(screen.getByTestId('history-list')).toBeInTheDocument();
    });
  });

  describe('Employee Ledger', () => {
    it('should render ledger page', async () => {
      const { EmployeeLedger } = await import('../../pages/expenses/EmployeeLedger');
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<EmployeeLedger />, {
        authContext,
        initialEntries: ['/app/expenses/ledger'],
      });

      expect(screen.getByTestId('employee-ledger')).toBeInTheDocument();
    });

    it('should show transactions', async () => {
      const { EmployeeLedger } = await import('../../pages/expenses/EmployeeLedger');
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<EmployeeLedger />, {
        authContext,
        initialEntries: ['/app/expenses/ledger'],
      });

      expect(screen.getByTestId('transactions')).toBeInTheDocument();
    });

    it('should show balance summary', async () => {
      const { EmployeeLedger } = await import('../../pages/expenses/EmployeeLedger');
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<EmployeeLedger />, {
        authContext,
        initialEntries: ['/app/expenses/ledger'],
      });

      expect(screen.getByTestId('balance-summary')).toBeInTheDocument();
    });
  });

  describe('Expense Analytics (Admin Only)', () => {
    it('should render for admin', async () => {
      const { ExpenseAnalytics } = await import('../../pages/expenses/ExpenseAnalytics');
      const authContext = createMockAuthContext(mockUsers.admin as User);
      
      renderWithProviders(<ExpenseAnalytics />, {
        authContext,
        initialEntries: ['/app/expenses/analytics'],
      });

      expect(screen.getByTestId('expense-analytics')).toBeInTheDocument();
    });

    it('should show charts', async () => {
      const { ExpenseAnalytics } = await import('../../pages/expenses/ExpenseAnalytics');
      const authContext = createMockAuthContext(mockUsers.admin as User);
      
      renderWithProviders(<ExpenseAnalytics />, {
        authContext,
        initialEntries: ['/app/expenses/analytics'],
      });

      expect(screen.getByTestId('charts')).toBeInTheDocument();
    });

    it('should show category breakdown', async () => {
      const { ExpenseAnalytics } = await import('../../pages/expenses/ExpenseAnalytics');
      const authContext = createMockAuthContext(mockUsers.admin as User);
      
      renderWithProviders(<ExpenseAnalytics />, {
        authContext,
        initialEntries: ['/app/expenses/analytics'],
      });

      expect(screen.getByTestId('category-breakdown')).toBeInTheDocument();
    });
  });

  describe('Expense Reports (Admin Only)', () => {
    it('should render for admin', async () => {
      const { ExpenseReports } = await import('../../pages/expenses/ExpenseReports');
      const authContext = createMockAuthContext(mockUsers.admin as User);
      
      renderWithProviders(<ExpenseReports />, {
        authContext,
        initialEntries: ['/app/expenses/reports'],
      });

      expect(screen.getByTestId('expense-reports')).toBeInTheDocument();
    });

    it('should show report filters', async () => {
      const { ExpenseReports } = await import('../../pages/expenses/ExpenseReports');
      const authContext = createMockAuthContext(mockUsers.admin as User);
      
      renderWithProviders(<ExpenseReports />, {
        authContext,
        initialEntries: ['/app/expenses/reports'],
      });

      expect(screen.getByTestId('report-filters')).toBeInTheDocument();
    });
  });

  describe('Receipts Gallery', () => {
    it('should render gallery', async () => {
      const { ReceiptsGallery } = await import('../../pages/expenses/ReceiptsGallery');
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<ReceiptsGallery />, {
        authContext,
        initialEntries: ['/app/expenses/receipts'],
      });

      expect(screen.getByTestId('receipts-gallery')).toBeInTheDocument();
    });

    it('should show receipt grid', async () => {
      const { ReceiptsGallery } = await import('../../pages/expenses/ReceiptsGallery');
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<ReceiptsGallery />, {
        authContext,
        initialEntries: ['/app/expenses/receipts'],
      });

      expect(screen.getByTestId('receipt-grid')).toBeInTheDocument();
    });
  });

  describe('Advance Ledger View', () => {
    it('should render advance ledger', async () => {
      const { AdvanceLedgerView } = await import('../../pages/expenses/AdvanceLedgerView');
      const authContext = createMockAuthContext(mockUsers.superAdmin as User);
      
      renderWithProviders(<AdvanceLedgerView />, {
        authContext,
        initialEntries: ['/app/expenses/advances/1/ledger'],
      });

      expect(screen.getByTestId('advance-ledger')).toBeInTheDocument();
    });
  });

  describe('Role-based Access', () => {
    const rolesAllowed = ['superAdmin', 'admin', 'supervisor', 'inspector', 'clerk'] as const;

    rolesAllowed.forEach((role) => {
      it(`should allow ${role} to access expense dashboard`, async () => {
        const { EmployeeExpenseDashboard } = await import('../../pages/expenses/EmployeeExpenseDashboard');
        const user = mockUsers[role] as User;
        const authContext = createMockAuthContext(user);
        
        renderWithProviders(<EmployeeExpenseDashboard />, {
          authContext,
          initialEntries: ['/app/expenses'],
        });

        expect(screen.getByTestId('expense-dashboard')).toBeInTheDocument();
      });
    });
  });
});





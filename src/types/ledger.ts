/**
 * Employee Ledger System Types
 *
 * Defines the data structures for the employee ledger accounting system.
 * The ledger tracks all financial transactions between company and employees
 * using double-entry bookkeeping principles (Credits and Debits).
 */

// Transaction Types
export type TransactionType =
  | 'ADVANCE_ISSUE'      // Credit (CR) - Company gives advance to employee
  | 'EXPENSE'            // Debit (DR) - Employee spends from advance
  | 'CASH_RETURN'        // Debit (DR) - Employee returns unused cash
  | 'REIMBURSEMENT'      // Credit (CR) - Company reimburses employee
  | 'OPENING_BALANCE';   // Opening balance entry

// Advance Status
export type AdvanceStatus =
  | 'OPEN'                // Advance issued, not yet utilized
  | 'PARTIALLY_UTILIZED'  // Some amount used
  | 'FULLY_UTILIZED'      // Completely spent
  | 'RETURNED'            // Returned to company
  | 'EXPIRED';            // Validity period expired

// Advance Purpose Categories
export type AdvancePurpose =
  | 'TRAVEL'              // Travel-related advance
  | 'PROJECT'             // Project-specific advance
  | 'EMERGENCY'           // Emergency advance
  | 'REGULAR'             // Regular operational advance
  | 'PETTY_CASH';         // Petty cash advance

/**
 * Core Ledger Entry
 * Represents a single transaction in the employee ledger
 */
export interface LedgerEntry {
  id: string;
  employee_id: string;
  employee_name?: string;

  // Transaction details
  transaction_date: string;           // ISO datetime of transaction
  transaction_type: TransactionType;
  description: string;

  // Double-entry amounts
  debit_amount: number;               // DR amount (expenses, returns)
  credit_amount: number;              // CR amount (advances, reimbursements)
  running_balance: number;            // Balance after this transaction

  // References
  reference_id?: string;              // Links to expense, advance, or return record
  reference_type?: 'expense' | 'advance' | 'return' | 'reimbursement';

  // Metadata
  created_by: string;
  created_by_name?: string;
  created_at: string;
  approved_by?: string;
  approved_by_name?: string;
  approved_at?: string;
  notes?: string;

  // Additional context
  project_id?: string;
  project_name?: string;
  asset_id?: string;
  asset_name?: string;
  category?: string;
}

/**
 * Advance Record
 * Tracks advances issued to employees
 */
export interface Advance {
  id: string;
  employee_id: string;
  employee_name?: string;

  // Advance details
  amount: number;
  issued_date: string;
  purpose: AdvancePurpose;
  purpose_description?: string;
  status: AdvanceStatus;

  // Utilization tracking
  utilized_amount: number;
  remaining_balance: number;
  utilization_percentage: number;     // Calculated: (utilized / amount) * 100

  // Validity
  validity_days?: number;
  expires_at?: string;
  is_expired?: boolean;

  // Approval chain
  issued_by: string;
  issued_by_name?: string;
  approved_by?: string;
  approved_by_name?: string;
  approved_at?: string;

  // Metadata
  created_at: string;
  updated_at?: string;
  notes?: string;

  // Related transactions
  ledger_entry_id?: string;           // Link to ledger entry
  linked_expenses?: string[];         // IDs of expenses using this advance
}

/**
 * Opening Balance Record
 * Stores the starting balance for employees
 */
export interface OpeningBalance {
  employee_id: string;
  employee_name?: string;
  opening_balance: number;
  effective_date: string;             // Date from which this balance is effective
  created_by: string;
  created_by_name?: string;
  created_at: string;
  notes?: string;
}

/**
 * Balance Summary
 * Aggregated view of employee's ledger balance
 */
export interface BalanceSummary {
  employee_id: string;
  employee_name?: string;

  // Balance components
  opening_balance: number;
  total_credits: number;              // Sum of all CR (advances + reimbursements)
  total_debits: number;               // Sum of all DR (expenses + returns)
  current_balance: number;            // opening + CR - DR

  // Status indicators
  is_in_surplus: boolean;             // Balance > 0
  is_in_deficit: boolean;             // Balance < 0
  deficit_amount: number;             // Absolute deficit if negative
  surplus_amount: number;             // Balance if positive

  // Advance tracking
  open_advances: AdvanceSummary[];
  total_open_advances: number;
  total_advance_utilization: number;

  // Pending items
  pending_expenses: number;           // Sum of pending expense approvals
  pending_reimbursements: number;     // Sum of pending reimbursements

  // Period analysis
  period_credits: number;             // CR in current period
  period_debits: number;              // DR in current period
  period_start_balance: number;
  period_end_balance: number;

  // Timestamps
  last_transaction_date?: string;
  updated_at: string;
}

/**
 * Advance Summary (nested in BalanceSummary)
 */
export interface AdvanceSummary {
  id: string;
  amount: number;
  issued_date: string;
  purpose: AdvancePurpose;
  utilized_amount: number;
  remaining_balance: number;
  utilization_percentage: number;
  status: AdvanceStatus;
  expires_at?: string;
  is_expired?: boolean;
  days_outstanding?: number;
}

/**
 * Ledger Transaction Preview
 * Shows the impact of a transaction before submission
 */
export interface LedgerPreview {
  transaction_type: TransactionType;
  amount: number;
  is_credit: boolean;
  is_debit: boolean;

  // Balance impact
  current_balance: number;
  new_balance: number;
  balance_change: number;

  // Warnings
  will_create_deficit: boolean;
  deficit_amount: number;
  warnings: string[];

  // Advance impact (for expenses)
  linked_advance_id?: string;
  advance_remaining_before?: number;
  advance_remaining_after?: number;
}

/**
 * Ledger Filter Options
 */
export interface LedgerFilters {
  employee_id?: string;
  transaction_types?: TransactionType[];
  date_from?: string;
  date_to?: string;
  min_amount?: number;
  max_amount?: number;
  category?: string;
  project_id?: string;
  asset_id?: string;
  is_credit?: boolean;                // Filter for CR only
  is_debit?: boolean;                 // Filter for DR only
  search_query?: string;              // Full-text search
}

/**
 * Ledger Statistics
 * Aggregated statistics for analytics
 */
export interface LedgerStatistics {
  total_employees: number;

  // Balances
  total_surplus: number;
  total_deficit: number;
  net_balance: number;

  // Employee counts
  employees_in_surplus: number;
  employees_in_deficit: number;
  employees_zero_balance: number;

  // Top lists
  top_surplus_employees: EmployeeBalanceRank[];
  top_deficit_employees: EmployeeBalanceRank[];

  // Advances
  total_open_advances: number;
  total_advance_amount: number;
  total_advance_utilization: number;
  average_utilization_percentage: number;

  // Aging analysis
  advances_0_30_days: number;
  advances_31_60_days: number;
  advances_61_90_days: number;
  advances_over_90_days: number;

  // Period comparison
  period: string;
  previous_period?: string;
  period_growth?: number;
}

/**
 * Employee Balance Ranking
 */
export interface EmployeeBalanceRank {
  employee_id: string;
  employee_name: string;
  balance: number;
  rank: number;
  open_advances: number;
  last_transaction_date?: string;
}

/**
 * Reconciliation Summary
 * For month-end/period-end reconciliation
 */
export interface ReconciliationSummary {
  employee_id: string;
  employee_name?: string;
  period_start: string;
  period_end: string;

  // Opening
  opening_balance: number;

  // Period transactions
  period_credits: number;
  period_debits: number;
  transaction_count: number;

  // Closing
  closing_balance: number;

  // Breakdown by type
  advances_issued: number;
  expenses_posted: number;
  cash_returns: number;
  reimbursements: number;

  // Validation
  is_balanced: boolean;               // opening + CR - DR = closing
  variance: number;                   // Any discrepancy

  // Metadata
  reconciled_by?: string;
  reconciled_at?: string;
  notes?: string;
}

/**
 * API Response Wrappers
 */
export interface LedgerResponse {
  data: LedgerEntry[];
  total: number;
  page?: number;
  per_page?: number;
  has_more?: boolean;
}

export interface AdvanceResponse {
  data: Advance[];
  total: number;
  summary?: {
    total_amount: number;
    total_utilized: number;
    total_remaining: number;
  };
}

export interface BalanceResponse {
  data: BalanceSummary;
}

/**
 * Form Data Types
 */
export interface IssueAdvanceFormData {
  employee_id: string;
  amount: number;
  purpose: AdvancePurpose;
  purpose_description?: string;
  validity_days?: number;
  notes?: string;
}

export interface CashReturnFormData {
  employee_id: string;
  amount: number;
  return_date: string;
  description: string;
  receipt_keys?: string[];
  notes?: string;
}

export interface ReimbursementFormData {
  employee_id: string;
  amount?: number;                    // Optional - can auto-calculate from expenses
  expense_ids: string[];              // Expenses to reimburse
  description: string;
  payment_method?: string;
  notes?: string;
}

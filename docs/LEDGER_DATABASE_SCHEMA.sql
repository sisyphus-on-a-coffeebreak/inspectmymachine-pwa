-- ============================================================================
-- EMPLOYEE LEDGER SYSTEM - DATABASE SCHEMA
-- ============================================================================
-- This schema implements a double-entry bookkeeping system for employee
-- financial transactions including advances, expenses, returns, and reimbursements.
--
-- Core Tables:
--   1. employee_ledger      - Main transaction ledger with running balance
--   2. advances             - Advance tracking and utilization
--   3. opening_balances     - Initial balances for employees
--
-- Design Principles:
--   - Every transaction creates a ledger entry
--   - Running balance is calculated and stored for performance
--   - Immutable ledger entries (no updates, only inserts)
--   - Strong foreign key relationships for data integrity
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Table: employee_ledger
-- Purpose: Core ledger table storing all financial transactions
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS employee_ledger (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Employee Reference
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,

    -- Transaction Details
    transaction_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    transaction_type VARCHAR(50) NOT NULL CHECK (
        transaction_type IN (
            'ADVANCE_ISSUE',
            'EXPENSE',
            'CASH_RETURN',
            'REIMBURSEMENT',
            'OPENING_BALANCE'
        )
    ),
    description TEXT NOT NULL,

    -- Double-Entry Amounts (exactly one should be non-zero)
    debit_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00 CHECK (debit_amount >= 0),
    credit_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00 CHECK (credit_amount >= 0),

    -- Running Balance (calculated and stored for performance)
    running_balance DECIMAL(10, 2) NOT NULL,

    -- Reference to Source Transaction
    reference_id UUID,
    reference_type VARCHAR(50) CHECK (
        reference_type IN ('expense', 'advance', 'return', 'reimbursement', 'opening_balance')
    ),

    -- Audit Trail
    created_by UUID NOT NULL REFERENCES employees(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    approved_by UUID REFERENCES employees(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,

    -- Additional Context (Optional Linking)
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
    category VARCHAR(100),

    -- Constraints
    CONSTRAINT either_debit_or_credit CHECK (
        (debit_amount > 0 AND credit_amount = 0) OR
        (credit_amount > 0 AND debit_amount = 0) OR
        (transaction_type = 'OPENING_BALANCE')
    )
);

-- Indexes for Performance
CREATE INDEX idx_ledger_employee_date ON employee_ledger(employee_id, transaction_date DESC);
CREATE INDEX idx_ledger_type ON employee_ledger(transaction_type);
CREATE INDEX idx_ledger_reference ON employee_ledger(reference_id, reference_type);
CREATE INDEX idx_ledger_created_at ON employee_ledger(created_at DESC);
CREATE INDEX idx_ledger_project ON employee_ledger(project_id) WHERE project_id IS NOT NULL;
CREATE INDEX idx_ledger_asset ON employee_ledger(asset_id) WHERE asset_id IS NOT NULL;

-- ----------------------------------------------------------------------------
-- Table: advances
-- Purpose: Track advances issued to employees and their utilization
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS advances (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Employee Reference
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,

    -- Advance Details
    amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
    issued_date DATE NOT NULL DEFAULT CURRENT_DATE,
    purpose VARCHAR(50) NOT NULL CHECK (
        purpose IN ('TRAVEL', 'PROJECT', 'EMERGENCY', 'REGULAR', 'PETTY_CASH')
    ),
    purpose_description TEXT,

    -- Status Tracking
    status VARCHAR(50) NOT NULL DEFAULT 'OPEN' CHECK (
        status IN ('OPEN', 'PARTIALLY_UTILIZED', 'FULLY_UTILIZED', 'RETURNED', 'EXPIRED')
    ),

    -- Utilization Tracking
    utilized_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00 CHECK (utilized_amount >= 0),
    remaining_balance DECIMAL(10, 2) NOT NULL CHECK (remaining_balance >= 0),

    -- Validity Period
    validity_days INTEGER CHECK (validity_days > 0),
    expires_at TIMESTAMP WITH TIME ZONE,

    -- Approval Chain
    issued_by UUID NOT NULL REFERENCES employees(id),
    approved_by UUID REFERENCES employees(id),
    approved_at TIMESTAMP WITH TIME ZONE,

    -- Audit Trail
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,

    -- Ledger Link
    ledger_entry_id UUID REFERENCES employee_ledger(id) ON DELETE SET NULL,

    -- Constraints
    CONSTRAINT valid_utilization CHECK (utilized_amount <= amount),
    CONSTRAINT correct_remaining CHECK (remaining_balance = amount - utilized_amount)
);

-- Indexes for Performance
CREATE INDEX idx_advances_employee ON advances(employee_id, issued_date DESC);
CREATE INDEX idx_advances_status ON advances(status);
CREATE INDEX idx_advances_expiry ON advances(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_advances_ledger ON advances(ledger_entry_id);

-- ----------------------------------------------------------------------------
-- Table: opening_balances
-- Purpose: Store initial/opening balances for employees
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS opening_balances (
    -- Primary Key (one opening balance per employee)
    employee_id UUID PRIMARY KEY REFERENCES employees(id) ON DELETE RESTRICT,

    -- Opening Balance
    opening_balance DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    effective_date DATE NOT NULL DEFAULT CURRENT_DATE,

    -- Audit Trail
    created_by UUID NOT NULL REFERENCES employees(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

-- Index for Audit
CREATE INDEX idx_opening_balances_created ON opening_balances(created_at DESC);

-- ============================================================================
-- TRIGGERS AND FUNCTIONS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Function: calculate_running_balance
-- Purpose: Calculate running balance for new ledger entry
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION calculate_running_balance()
RETURNS TRIGGER AS $$
DECLARE
    prev_balance DECIMAL(10, 2);
BEGIN
    -- Get the most recent balance for this employee
    SELECT running_balance INTO prev_balance
    FROM employee_ledger
    WHERE employee_id = NEW.employee_id
        AND transaction_date < NEW.transaction_date
    ORDER BY transaction_date DESC, created_at DESC
    LIMIT 1;

    -- If no previous balance, check opening balance
    IF prev_balance IS NULL THEN
        SELECT COALESCE(opening_balance, 0) INTO prev_balance
        FROM opening_balances
        WHERE employee_id = NEW.employee_id;

        -- If still null, default to 0
        prev_balance := COALESCE(prev_balance, 0);
    END IF;

    -- Calculate new running balance
    -- Credits increase balance, Debits decrease balance
    NEW.running_balance := prev_balance + NEW.credit_amount - NEW.debit_amount;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to employee_ledger table
CREATE TRIGGER trg_calculate_running_balance
    BEFORE INSERT ON employee_ledger
    FOR EACH ROW
    EXECUTE FUNCTION calculate_running_balance();

-- ----------------------------------------------------------------------------
-- Function: update_advance_utilization
-- Purpose: Update advance utilization when expense is posted
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_advance_utilization()
RETURNS TRIGGER AS $$
DECLARE
    advance_rec RECORD;
    expense_amount DECIMAL(10, 2);
BEGIN
    -- Only process if this is an expense transaction with a linked advance
    IF NEW.transaction_type = 'EXPENSE' AND NEW.reference_type = 'expense' THEN
        -- Get the expense amount (debit amount)
        expense_amount := NEW.debit_amount;

        -- Find oldest open/partial advance for this employee
        SELECT * INTO advance_rec
        FROM advances
        WHERE employee_id = NEW.employee_id
            AND status IN ('OPEN', 'PARTIALLY_UTILIZED')
            AND remaining_balance > 0
        ORDER BY issued_date ASC, created_at ASC
        LIMIT 1;

        -- If advance found, update utilization
        IF FOUND THEN
            UPDATE advances
            SET utilized_amount = utilized_amount + expense_amount,
                remaining_balance = remaining_balance - expense_amount,
                status = CASE
                    WHEN remaining_balance - expense_amount <= 0 THEN 'FULLY_UTILIZED'
                    ELSE 'PARTIALLY_UTILIZED'
                END,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = advance_rec.id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to employee_ledger table
CREATE TRIGGER trg_update_advance_utilization
    AFTER INSERT ON employee_ledger
    FOR EACH ROW
    EXECUTE FUNCTION update_advance_utilization();

-- ----------------------------------------------------------------------------
-- Function: check_advance_expiry
-- Purpose: Mark advances as expired if past expiry date
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION check_advance_expiry()
RETURNS void AS $$
BEGIN
    UPDATE advances
    SET status = 'EXPIRED'
    WHERE status IN ('OPEN', 'PARTIALLY_UTILIZED')
        AND expires_at IS NOT NULL
        AND expires_at < CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- Schedule this function to run periodically (using pg_cron or application cron)

-- ----------------------------------------------------------------------------
-- Function: get_employee_balance
-- Purpose: Get current balance for an employee
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_employee_balance(p_employee_id UUID)
RETURNS DECIMAL(10, 2) AS $$
DECLARE
    current_balance DECIMAL(10, 2);
BEGIN
    SELECT running_balance INTO current_balance
    FROM employee_ledger
    WHERE employee_id = p_employee_id
    ORDER BY transaction_date DESC, created_at DESC
    LIMIT 1;

    -- If no ledger entries, check opening balance
    IF current_balance IS NULL THEN
        SELECT COALESCE(opening_balance, 0) INTO current_balance
        FROM opening_balances
        WHERE employee_id = p_employee_id;
    END IF;

    RETURN COALESCE(current_balance, 0);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- View: v_employee_balance_summary
-- Purpose: Current balance summary for all employees
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_employee_balance_summary AS
WITH latest_balances AS (
    SELECT DISTINCT ON (employee_id)
        employee_id,
        running_balance,
        transaction_date
    FROM employee_ledger
    ORDER BY employee_id, transaction_date DESC, created_at DESC
),
advance_summary AS (
    SELECT
        employee_id,
        COUNT(*) FILTER (WHERE status IN ('OPEN', 'PARTIALLY_UTILIZED')) as open_advance_count,
        SUM(remaining_balance) FILTER (WHERE status IN ('OPEN', 'PARTIALLY_UTILIZED')) as total_remaining_advance
    FROM advances
    GROUP BY employee_id
)
SELECT
    e.id as employee_id,
    e.name as employee_name,
    COALESCE(lb.running_balance, ob.opening_balance, 0) as current_balance,
    COALESCE(adv.open_advance_count, 0) as open_advances,
    COALESCE(adv.total_remaining_advance, 0) as total_advance_remaining,
    lb.transaction_date as last_transaction_date
FROM employees e
LEFT JOIN latest_balances lb ON e.id = lb.employee_id
LEFT JOIN opening_balances ob ON e.id = ob.employee_id
LEFT JOIN advance_summary adv ON e.id = adv.employee_id;

-- ----------------------------------------------------------------------------
-- View: v_ledger_with_names
-- Purpose: Ledger entries with employee/project/asset names
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_ledger_with_names AS
SELECT
    l.*,
    e.name as employee_name,
    creator.name as created_by_name,
    approver.name as approved_by_name,
    p.name as project_name,
    a.registration_number as asset_name
FROM employee_ledger l
JOIN employees e ON l.employee_id = e.id
JOIN employees creator ON l.created_by = creator.id
LEFT JOIN employees approver ON l.approved_by = approver.id
LEFT JOIN projects p ON l.project_id = p.id
LEFT JOIN assets a ON l.asset_id = a.id;

-- ============================================================================
-- SAMPLE DATA INSERTION
-- ============================================================================

-- Note: This section is for development/testing only
-- Remove or comment out in production

-- Example: Set opening balance for an employee
-- INSERT INTO opening_balances (employee_id, opening_balance, effective_date, created_by, notes)
-- VALUES (
--     'emp_uuid_here',
--     5000.00,
--     '2025-01-01',
--     'admin_uuid_here',
--     'Initial opening balance for FY 2025'
-- );

-- Example: Issue an advance
-- WITH new_advance AS (
--     INSERT INTO advances (
--         employee_id, amount, issued_date, purpose, purpose_description,
--         validity_days, expires_at, issued_by, approved_by, approved_at
--     )
--     VALUES (
--         'emp_uuid_here',
--         15000.00,
--         CURRENT_DATE,
--         'TRAVEL',
--         'Business trip to Mumbai - Client meeting',
--         30,
--         CURRENT_TIMESTAMP + INTERVAL '30 days',
--         'admin_uuid_here',
--         'manager_uuid_here',
--         CURRENT_TIMESTAMP
--     )
--     RETURNING id
-- )
-- INSERT INTO employee_ledger (
--     employee_id, transaction_type, description,
--     debit_amount, credit_amount, reference_id, reference_type,
--     created_by, approved_by, approved_at
-- )
-- SELECT
--     'emp_uuid_here',
--     'ADVANCE_ISSUE',
--     'Travel advance issued for Mumbai trip',
--     0.00,
--     15000.00,
--     id,
--     'advance',
--     'admin_uuid_here',
--     'manager_uuid_here',
--     CURRENT_TIMESTAMP
-- FROM new_advance;

-- ============================================================================
-- GRANTS AND PERMISSIONS
-- ============================================================================

-- Grant read access to ledger views for all authenticated users
-- GRANT SELECT ON v_employee_balance_summary TO authenticated;
-- GRANT SELECT ON v_ledger_with_names TO authenticated;

-- Grant write access to ledger tables for finance role
-- GRANT INSERT ON employee_ledger TO finance_role;
-- GRANT INSERT, UPDATE ON advances TO finance_role;
-- GRANT INSERT, UPDATE ON opening_balances TO finance_role;

-- ============================================================================
-- MAINTENANCE QUERIES
-- ============================================================================

-- Check for balance discrepancies (should return 0 rows in healthy system)
-- SELECT
--     employee_id,
--     opening_balance + total_credits - total_debits as calculated_balance,
--     current_balance,
--     (opening_balance + total_credits - total_debits) - current_balance as discrepancy
-- FROM (
--     SELECT
--         l.employee_id,
--         COALESCE(ob.opening_balance, 0) as opening_balance,
--         SUM(l.credit_amount) as total_credits,
--         SUM(l.debit_amount) as total_debits,
--         (SELECT running_balance FROM employee_ledger
--          WHERE employee_id = l.employee_id
--          ORDER BY transaction_date DESC, created_at DESC LIMIT 1) as current_balance
--     FROM employee_ledger l
--     LEFT JOIN opening_balances ob ON l.employee_id = ob.employee_id
--     GROUP BY l.employee_id, ob.opening_balance
-- ) balance_check
-- WHERE ABS((opening_balance + total_credits - total_debits) - current_balance) > 0.01;

-- Find employees with deficit
-- SELECT * FROM v_employee_balance_summary WHERE current_balance < 0 ORDER BY current_balance ASC;

-- Find employees with surplus
-- SELECT * FROM v_employee_balance_summary WHERE current_balance > 0 ORDER BY current_balance DESC;

-- Aging analysis of advances
-- SELECT
--     purpose,
--     CASE
--         WHEN AGE(CURRENT_DATE, issued_date) < INTERVAL '30 days' THEN '0-30 days'
--         WHEN AGE(CURRENT_DATE, issued_date) < INTERVAL '60 days' THEN '31-60 days'
--         WHEN AGE(CURRENT_DATE, issued_date) < INTERVAL '90 days' THEN '61-90 days'
--         ELSE '90+ days'
--     END as age_bucket,
--     COUNT(*) as count,
--     SUM(remaining_balance) as total_remaining
-- FROM advances
-- WHERE status IN ('OPEN', 'PARTIALLY_UTILIZED')
-- GROUP BY purpose, age_bucket
-- ORDER BY purpose, age_bucket;

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================

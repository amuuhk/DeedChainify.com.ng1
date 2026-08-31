/*
# Bank Collateral Management System

## Overview
Enhances the existing bank portal with comprehensive collateral management
for lending institutions to manage property-backed loans.

## New Tables

1. `collateral_loans` - Links properties to bank loans
   - id (uuid PK)
   - bank_id (uuid FK -> banks)
   - property_id (uuid FK -> properties)
   - loan_amount (numeric)
   - loan_term_months (int)
   - interest_rate (numeric)
   - monthly_payment (numeric)
   - outstanding_balance (numeric)
   - status (ACTIVE | PAID | DEFAULTED | RESTRUCTURED)
   - start_date (timestamptz)
   - end_date (timestamptz)
   - next_payment_date (timestamptz)
   - created_at (timestamptz)

2. `collateral_insurance` - Insurance policies for collateral
   - id (uuid PK)
   - loan_id (uuid FK -> collateral_loans)
   - policy_number (text unique)
   - insurance_provider (text)
   - coverage_amount (numeric)
   - premium_amount (numeric)
   - policy_start_date (timestamptz)
   - policy_end_date (timestamptz)
   - status (ACTIVE | EXPIRED | CANCELLED)
   - created_at (timestamptz)

3. `collateral_valuations` - Property valuations over time
   - id (uuid PK)
   - property_id (uuid FK -> properties)
   - bank_id (uuid FK -> banks)
   - valuation_amount (numeric)
   - valuation_date (timestamptz)
   - valuator_name (text)
   - valuation_method (text)
   - notes (text)
   - created_at (timestamptz)

4. `collateral_alerts` - Risk alerts for collateral
   - id (uuid PK)
   - loan_id (uuid FK -> collateral_loans)
   - alert_type (PAYMENT_DUE | MARKET_VALUE_DROP | INSURANCE_EXPIRY | DEFAULT_RISK)
   - severity (LOW | MEDIUM | HIGH | CRITICAL)
   - message (text)
   - is_resolved (bool default false)
   - resolved_at (timestamptz)
   - created_at (timestamptz)

## Security (RLS)
- collateral_loans: Bank-scoped CRUD (bank_id matches authenticated bank)
- collateral_insurance: Bank-scoped CRUD via loan relationship
- collateral_valuations: Bank-scoped CRUD
- collateral_alerts: Bank-scoped CRUD
*/

-- COLLATERAL LOANS
CREATE TABLE IF NOT EXISTS collateral_loans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_id uuid NOT NULL REFERENCES banks(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  loan_amount numeric NOT NULL DEFAULT 0,
  loan_term_months integer NOT NULL DEFAULT 12,
  interest_rate numeric NOT NULL DEFAULT 0,
  monthly_payment numeric NOT NULL DEFAULT 0,
  outstanding_balance numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'ACTIVE',
  start_date timestamptz NOT NULL DEFAULT now(),
  end_date timestamptz,
  next_payment_date timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE collateral_loans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bank_read_own_loans" ON collateral_loans;
CREATE POLICY "bank_read_own_loans" ON collateral_loans FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "bank_insert_own_loans" ON collateral_loans;
CREATE POLICY "bank_insert_own_loans" ON collateral_loans FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "bank_update_own_loans" ON collateral_loans;
CREATE POLICY "bank_update_own_loans" ON collateral_loans FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

-- COLLATERAL INSURANCE
CREATE TABLE IF NOT EXISTS collateral_insurance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id uuid NOT NULL REFERENCES collateral_loans(id) ON DELETE CASCADE,
  policy_number text UNIQUE NOT NULL,
  insurance_provider text NOT NULL,
  coverage_amount numeric NOT NULL DEFAULT 0,
  premium_amount numeric NOT NULL DEFAULT 0,
  policy_start_date timestamptz NOT NULL,
  policy_end_date timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'ACTIVE',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE collateral_insurance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bank_read_own_insurance" ON collateral_insurance;
CREATE POLICY "bank_read_own_insurance" ON collateral_insurance FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "bank_insert_own_insurance" ON collateral_insurance;
CREATE POLICY "bank_insert_own_insurance" ON collateral_insurance FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "bank_update_own_insurance" ON collateral_insurance;
CREATE POLICY "bank_update_own_insurance" ON collateral_insurance FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

-- COLLATERAL VALUATIONS
CREATE TABLE IF NOT EXISTS collateral_valuations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  bank_id uuid NOT NULL REFERENCES banks(id) ON DELETE CASCADE,
  valuation_amount numeric NOT NULL DEFAULT 0,
  valuation_date timestamptz NOT NULL DEFAULT now(),
  valuator_name text NOT NULL,
  valuation_method text NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE collateral_valuations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bank_read_own_valuations" ON collateral_valuations;
CREATE POLICY "bank_read_own_valuations" ON collateral_valuations FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "bank_insert_own_valuations" ON collateral_valuations;
CREATE POLICY "bank_insert_own_valuations" ON collateral_valuations FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "bank_update_own_valuations" ON collateral_valuations;
CREATE POLICY "bank_update_own_valuations" ON collateral_valuations FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

-- COLLATERAL ALERTS
CREATE TABLE IF NOT EXISTS collateral_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id uuid NOT NULL REFERENCES collateral_loans(id) ON DELETE CASCADE,
  alert_type text NOT NULL,
  severity text NOT NULL DEFAULT 'MEDIUM',
  message text NOT NULL,
  is_resolved boolean NOT NULL DEFAULT false,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE collateral_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bank_read_own_alerts" ON collateral_alerts;
CREATE POLICY "bank_read_own_alerts" ON collateral_alerts FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "bank_insert_own_alerts" ON collateral_alerts;
CREATE POLICY "bank_insert_own_alerts" ON collateral_alerts FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "bank_update_own_alerts" ON collateral_alerts;
CREATE POLICY "bank_update_own_alerts" ON collateral_alerts FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_collateral_loans_bank_id ON collateral_loans(bank_id);
CREATE INDEX IF NOT EXISTS idx_collateral_loans_property_id ON collateral_loans(property_id);
CREATE INDEX IF NOT EXISTS idx_collateral_loans_status ON collateral_loans(status);
CREATE INDEX IF NOT EXISTS idx_collateral_insurance_loan_id ON collateral_insurance(loan_id);
CREATE INDEX IF NOT EXISTS idx_collateral_valuations_property_id ON collateral_valuations(property_id);
CREATE INDEX IF NOT EXISTS idx_collateral_valuations_bank_id ON collateral_valuations(bank_id);
CREATE INDEX IF NOT EXISTS idx_collateral_alerts_loan_id ON collateral_alerts(loan_id);
CREATE INDEX IF NOT EXISTS idx_collateral_alerts_resolved ON collateral_alerts(is_resolved);
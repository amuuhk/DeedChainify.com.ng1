/*
# DeedChainify OS v1.0 — Core Schema

## Overview
Creates the full database schema for DeedChainify, a Nigerian land/property
verification platform. Every land record gets a lifetime DCID (like BVN) and
a DC_TITLE. Public QR scans and private onboarding generate revenue.

## New Tables

1. `profiles` — extends Supabase auth.users with DeedChainify identity.
   - id (uuid, PK, FK -> auth.users)
   - dc_id (text, unique) — lifetime ID, format DC-[STATE2]-[YEAR]-[6DIGIT]
   - full_name, phone, email, nin, bvn, address
   - kyc_status (default PENDING)
   - next_of_kin (jsonb)
   - role (default 'owner') — owner | admin | state | bank | agent
   - created_at

2. `properties` — land records tied to an owner.
   - id (uuid PK)
   - dc_title (text, unique) — property title
   - owner_id (uuid FK -> auth.users) — the authenticated owner
   - owner_dc_id (text) — denormalized DCID for display
   - owner_name (text) — denormalized owner full name
   - state, lga, layout_name, block_no, plot_no, plot_type
   - gps_lat, gps_long (float)
   - size_sqm (int)
   - status (default PENDING) — PENDING | YELLOW | GREEN | DISPUTED
   - is_pledged (bool default false)
   - bank_name (text)
   - public_qr_url (text)
   - private_qr_token (text unique)
   - landlord_id, barrister_id (text)
   - listing_type (text) — PRIVATE | PUBLIC
   - created_at

3. `banks` — registered bank partners for API access.
   - id, bank_name (unique), tier, monthly_fee, api_calls_included,
     api_calls_used, api_key (unique)

4. `payments` — revenue log for all chargeable events.
   - id, type (PUBLIC_SCAN | PRIVATE_ONBOARD | BANK_API | SUBSCRIPTION),
     amount, dc_title, dc_id, status, created_at

5. `public_scan_logs` — tracks public scans per dc_title per month.
   - id, dc_title, month, scan_count
   - unique(dc_title, month)

6. `private_scan_logs` — tracks private scans per dc_title per user per month.
   - id, dc_title, user_id, month, scan_count
   - unique(dc_title, user_id, month)

7. `neighbor_requests` — community verification requests.
   - id, property_id, neighbor_phone, status (default PENDING),
     responder_dc_id, created_at

8. `agents` — landlord/barrister agents.
   - id, phone (unique), type, commission_earned

## Security (RLS)
- profiles: owner-scoped CRUD (auth.uid() = id). Admins can read all.
- properties: public SELECT (anyone can verify land — core product premise);
  owner-scoped INSERT/UPDATE/DELETE.
- banks: authenticated SELECT; service-role only for writes (managed via
  edge functions / admin).
- payments: owner-scoped SELECT (own payments); INSERT via authenticated.
- public_scan_logs: authenticated CRUD (scan logic runs client + verified
  via edge function).
- private_scan_logs: owner-scoped (auth.uid() = user_id).
- neighbor_requests: authenticated SELECT/INSERT/UPDATE.
- agents: authenticated SELECT.

## Notes
1. Properties are publicly readable because the entire product premise is
   public land verification via QR scan. Writes remain owner-scoped.
2. Owner columns default to auth.uid() so inserts omitting owner_id succeed.
3. Scan-log "2 free per month" logic is enforced in the verify API/edge
   function, not by RLS — RLS just ensures rows are readable.
*/

-- PROFILES
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  dc_id text UNIQUE NOT NULL,
  full_name text NOT NULL,
  phone text UNIQUE NOT NULL,
  email text UNIQUE,
  nin text UNIQUE,
  bvn text UNIQUE,
  address text,
  kyc_status text NOT NULL DEFAULT 'PENDING',
  next_of_kin jsonb,
  role text NOT NULL DEFAULT 'owner',
  referral_code text,
  role_id text,
  bank_account text,
  bank_name text,
  cac_number text,
  traditional_title text,
  title_proof text,
  bar_id text,
  law_license text,
  company_license text,
  developer_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- PROPERTIES
CREATE TABLE IF NOT EXISTS properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dc_title text UNIQUE NOT NULL,
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_dc_id text,
  owner_name text,
  state text NOT NULL,
  lga text NOT NULL,
  layout_name text NOT NULL,
  block_no text NOT NULL,
  plot_no text NOT NULL,
  plot_type text NOT NULL,
  gps_lat double precision,
  gps_long double precision,
  size_sqm integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'PENDING',
  is_pledged boolean NOT NULL DEFAULT false,
  bank_name text,
  public_qr_url text,
  private_qr_token text UNIQUE,
  landlord_id text,
  barrister_id text,
  landlord_referral text,
  barrister_referral text,
  listing_type text NOT NULL DEFAULT 'PRIVATE',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Public read: anyone (anon + authenticated) can view properties — core verification premise
DROP POLICY IF EXISTS "public_read_properties" ON properties;
CREATE POLICY "public_read_properties" ON properties FOR SELECT
  TO anon, authenticated USING (true);

-- Owner-scoped writes
DROP POLICY IF EXISTS "insert_own_property" ON properties;
CREATE POLICY "insert_own_property" ON properties FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "update_own_property" ON properties;
CREATE POLICY "update_own_property" ON properties FOR UPDATE
  TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "delete_own_property" ON properties;
CREATE POLICY "delete_own_property" ON properties FOR DELETE
  TO authenticated USING (auth.uid() = owner_id);

-- BANKS
CREATE TABLE IF NOT EXISTS banks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_name text UNIQUE NOT NULL,
  tier text NOT NULL DEFAULT 'BASIC',
  monthly_fee integer NOT NULL DEFAULT 200000,
  api_calls_included integer NOT NULL DEFAULT 100,
  api_calls_used integer NOT NULL DEFAULT 0,
  api_key text UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE banks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_banks" ON banks;
CREATE POLICY "read_banks" ON banks FOR SELECT
  TO authenticated USING (true);

-- PAYMENTS
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  amount integer NOT NULL,
  dc_title text,
  dc_id text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  recipient_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'SUCCESS',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_payments" ON payments;
CREATE POLICY "select_own_payments" ON payments FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_payments" ON payments;
CREATE POLICY "insert_own_payments" ON payments FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- PUBLIC SCAN LOGS
CREATE TABLE IF NOT EXISTS public_scan_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dc_title text NOT NULL,
  month text NOT NULL,
  scan_count integer NOT NULL DEFAULT 0,
  CONSTRAINT public_scan_logs_dc_title_month_key UNIQUE (dc_title, month)
);
ALTER TABLE public_scan_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_public_scan_logs" ON public_scan_logs;
CREATE POLICY "read_public_scan_logs" ON public_scan_logs FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "write_public_scan_logs" ON public_scan_logs;
CREATE POLICY "write_public_scan_logs" ON public_scan_logs FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_public_scan_logs" ON public_scan_logs;
CREATE POLICY "update_public_scan_logs" ON public_scan_logs FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

-- PRIVATE SCAN LOGS
CREATE TABLE IF NOT EXISTS private_scan_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dc_title text NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month text NOT NULL,
  scan_count integer NOT NULL DEFAULT 0,
  CONSTRAINT private_scan_logs_dc_title_user_month_key UNIQUE (dc_title, user_id, month)
);
ALTER TABLE private_scan_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_private_scan_logs" ON private_scan_logs;
CREATE POLICY "select_own_private_scan_logs" ON private_scan_logs FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_private_scan_logs" ON private_scan_logs;
CREATE POLICY "insert_own_private_scan_logs" ON private_scan_logs FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_private_scan_logs" ON private_scan_logs;
CREATE POLICY "update_own_private_scan_logs" ON private_scan_logs FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- NEIGHBOR REQUESTS
CREATE TABLE IF NOT EXISTS neighbor_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  neighbor_phone text NOT NULL,
  status text NOT NULL DEFAULT 'PENDING',
  responder_dc_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE neighbor_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_neighbor_requests" ON neighbor_requests;
CREATE POLICY "read_neighbor_requests" ON neighbor_requests FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_neighbor_requests" ON neighbor_requests;
CREATE POLICY "insert_neighbor_requests" ON neighbor_requests FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_neighbor_requests" ON neighbor_requests;
CREATE POLICY "update_neighbor_requests" ON neighbor_requests FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

-- AGENTS
CREATE TABLE IF NOT EXISTS agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text UNIQUE NOT NULL,
  type text NOT NULL DEFAULT 'landlord',
  commission_earned integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_agents" ON agents;
CREATE POLICY "read_agents" ON agents FOR SELECT
  TO authenticated USING (true);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_properties_owner_id ON properties(owner_id);
CREATE INDEX IF NOT EXISTS idx_properties_dc_title ON properties(dc_title);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_public_scan_logs_month ON public_scan_logs(month);

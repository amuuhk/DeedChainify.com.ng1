/*
# Add admin-read-all policies for profiles, payments, transfers, property_owners

## Overview
Grants users with role = 'admin' the ability to read all rows in
profiles, payments, transfers, and property_owners. This is needed for
the admin dashboard to display platform-wide data. Admin users still
cannot write to other users' data — only read.

## Modified Tables
1. `profiles` — adds a SELECT policy allowing admin role to read all rows.
2. `payments` — adds a SELECT policy allowing admin role to read all rows.
3. `transfers` — adds a SELECT policy allowing admin role to read all rows.
   (transfers already has public SELECT, so this is supplementary.)
4. `property_owners` — adds a SELECT policy allowing admin role to read all rows.
   (property_owners already has public SELECT, so this is supplementary.)

## Security
- New policies use a subquery: EXISTS (SELECT 1 FROM profiles p WHERE
  p.id = auth.uid() AND p.role = 'admin'). This ensures only users whose
  profile row has role='admin' can benefit from the admin read policy.
- These are SELECT-only policies. No INSERT/UPDATE/DELETE grants are added
  for admin — admins read data; they do not mutate other users' rows via RLS.
- Existing owner-scoped policies remain intact.
*/

-- profiles: admin can read all profiles
DROP POLICY IF EXISTS "admin_read_all_profiles" ON profiles;
CREATE POLICY "admin_read_all_profiles" ON profiles FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- payments: admin can read all payments
DROP POLICY IF EXISTS "admin_read_all_payments" ON payments;
CREATE POLICY "admin_read_all_payments" ON payments FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- transfers: admin can read all transfers (supplements existing public read)
DROP POLICY IF EXISTS "admin_read_all_transfers" ON transfers;
CREATE POLICY "admin_read_all_transfers" ON transfers FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- property_owners: admin can read all co-owners (supplements existing public read)
DROP POLICY IF EXISTS "admin_read_all_property_owners" ON property_owners;
CREATE POLICY "admin_read_all_property_owners" ON property_owners FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );
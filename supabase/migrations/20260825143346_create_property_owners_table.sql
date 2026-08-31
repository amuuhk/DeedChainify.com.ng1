/*
# Create property_owners table for co-ownership

## Overview
Adds a `property_owners` table to support 1-50 co-owners per property,
each with a name, NIN, phone, and ownership share percentage.

## New Tables

1. `property_owners` — co-owners linked to a property.
   - id (uuid, PK)
   - property_id (uuid, FK -> properties.id, ON DELETE CASCADE)
   - name (text, NOT NULL)
   - nin (text)
   - phone (text)
   - share_pct (numeric, NOT NULL) — ownership percentage (0-100)
   - created_at (timestamptz, default now())

## Security (RLS)
- property_owners: authenticated CRUD scoped to the property owner.
  SELECT public so verify page can show owners. INSERT/UPDATE/DELETE
  scoped to the property's owner via a subquery.
*/

CREATE TABLE IF NOT EXISTS property_owners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  name text NOT NULL,
  nin text,
  phone text,
  share_pct numeric(5,2) NOT NULL DEFAULT 100.00,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE property_owners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_property_owners" ON property_owners;
CREATE POLICY "public_read_property_owners" ON property_owners FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_property_owners" ON property_owners;
CREATE POLICY "insert_own_property_owners" ON property_owners FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM properties p WHERE p.id = property_id AND p.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_own_property_owners" ON property_owners;
CREATE POLICY "update_own_property_owners" ON property_owners FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM properties p WHERE p.id = property_id AND p.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_own_property_owners" ON property_owners;
CREATE POLICY "delete_own_property_owners" ON property_owners FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM properties p WHERE p.id = property_id AND p.owner_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_property_owners_property_id ON property_owners(property_id);

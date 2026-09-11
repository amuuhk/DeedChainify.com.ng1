/*
# Add geotier columns to transfers table

## Overview
Adds columns to the `transfers` table to support the Geotier pricing system.
These columns store the tier price, tier number, state, and LGA for pricing calculations.

## Modified Tables

1. `transfers` — added columns:
   - tier_price (integer) — the geotier fee for this transfer
   - tier (integer) — the tier number (1-5)
   - state (text) — the state for geotier lookup
   - lga (text) — the LGA for geotier lookup

## Security
- No policy changes. Existing RLS policies on transfers remain unchanged.
*/

ALTER TABLE transfers ADD COLUMN IF NOT EXISTS tier_price integer;
ALTER TABLE transfers ADD COLUMN IF NOT EXISTS tier integer;
ALTER TABLE transfers ADD COLUMN IF NOT EXISTS state text;
ALTER TABLE transfers ADD COLUMN IF NOT EXISTS lga text;

/*
# BLOCKCHAIN SYSTEM REMOVED - This migration is disabled

The private_ledger table was part of the blockchain/custodium system
which has been removed from the application. This migration is kept
for reference but should not be applied to new deployments.

To enable blockchain features in the future, uncomment the SQL below.

*/

/*
CREATE TABLE IF NOT EXISTS private_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_id text UNIQUE,
  dc_title text NOT NULL,
  pdf_hash text NOT NULL,
  previous_hash text,
  signature text NOT NULL,
  nonce text NOT NULL,
  status text NOT NULL DEFAULT 'SEALED',
  timestamp timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE private_ledger ENABLE ROW LEVEL SECURITY;

-- Public read: anyone can verify a custodium entry
DROP POLICY IF EXISTS "public_read_private_ledger" ON private_ledger;
CREATE POLICY "public_read_private_ledger" ON private_ledger FOR SELECT
  TO anon, authenticated USING (true);

-- No INSERT/UPDATE/DELETE policies for anon or authenticated.
-- Only the service role (used by edge functions) can write to this table.

CREATE INDEX IF NOT EXISTS idx_private_ledger_transfer_id ON private_ledger(transfer_id);
CREATE INDEX IF NOT EXISTS idx_private_ledger_dc_title ON private_ledger(dc_title);
*/

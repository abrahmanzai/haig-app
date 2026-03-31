-- ─── 002_performance_rsvp.sql ────────────────────────────────────────────────
-- Adds:
--   1. rsvp column on attendance (members self-report intent to attend)
--   2. nav_snapshots table (admin-recorded portfolio NAV history for performance page)

-- ── 1. RSVP column ────────────────────────────────────────────────────────────
ALTER TABLE attendance
  ADD COLUMN IF NOT EXISTS rsvp BOOLEAN NOT NULL DEFAULT FALSE;

-- ── 2. Portfolio NAV snapshots ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS nav_snapshots (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date   DATE        NOT NULL UNIQUE,
  total_value     NUMERIC(12,2) NOT NULL,
  cash_on_hand    NUMERIC(12,2) NOT NULL,
  holdings_value  NUMERIC(12,2) NOT NULL,
  total_invested  NUMERIC(12,2) NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE nav_snapshots ENABLE ROW LEVEL SECURITY;

-- All authenticated members can read historical NAV data
CREATE POLICY "members_read_snapshots"
  ON nav_snapshots FOR SELECT
  TO authenticated
  USING (true);

-- Only admins may insert snapshots
CREATE POLICY "admin_insert_snapshots"
  ON nav_snapshots FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Only admins may delete snapshots (e.g. to correct a bad entry)
CREATE POLICY "admin_delete_snapshots"
  ON nav_snapshots FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

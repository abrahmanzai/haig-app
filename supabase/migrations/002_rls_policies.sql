-- Enable Row Level Security on all application tables and grant read access
-- to authenticated users. All writes go through service-role API routes which
-- bypass RLS, so no write policies are needed here (except user-owned rows).

ALTER TABLE profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE events          ENABLE ROW LEVEL SECURITY;
ALTER TABLE pitches         ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE holdings        ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades          ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance      ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_financials ENABLE ROW LEVEL SECURITY;

-- ── profiles ──────────────────────────────────────────────────────────────────
CREATE POLICY "authenticated_read_profiles"
  ON profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "users_update_own_profile"
  ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- ── events ────────────────────────────────────────────────────────────────────
CREATE POLICY "authenticated_read_events"
  ON events FOR SELECT TO authenticated USING (true);

-- ── pitches ───────────────────────────────────────────────────────────────────
CREATE POLICY "authenticated_read_pitches"
  ON pitches FOR SELECT TO authenticated USING (true);

CREATE POLICY "authorized_insert_pitches"
  ON pitches FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('authorized', 'admin')
    )
  );

CREATE POLICY "submitter_update_own_pitch"
  ON pitches FOR UPDATE TO authenticated
  USING (submitted_by = auth.uid());

-- ── votes ─────────────────────────────────────────────────────────────────────
CREATE POLICY "authenticated_read_votes"
  ON votes FOR SELECT TO authenticated USING (true);

CREATE POLICY "users_insert_own_vote"
  ON votes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = voter_id);

-- ── holdings (club-wide, read-only for members; admin writes via service role) ─
CREATE POLICY "authenticated_read_holdings"
  ON holdings FOR SELECT TO authenticated USING (true);

-- ── trades ────────────────────────────────────────────────────────────────────
CREATE POLICY "authenticated_read_trades"
  ON trades FOR SELECT TO authenticated USING (true);

-- ── attendance ────────────────────────────────────────────────────────────────
CREATE POLICY "authenticated_read_attendance"
  ON attendance FOR SELECT TO authenticated USING (true);

CREATE POLICY "users_upsert_own_attendance"
  ON attendance FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = member_id);

-- ── club_financials ───────────────────────────────────────────────────────────
CREATE POLICY "authenticated_read_club_financials"
  ON club_financials FOR SELECT TO authenticated USING (true);

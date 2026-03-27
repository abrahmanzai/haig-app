-- ── Tables ────────────────────────────────────────────────────────────────────

CREATE TABLE meeting_minutes (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_number INTEGER NOT NULL,
  title          TEXT NOT NULL,
  content        TEXT NOT NULL,
  meeting_date   DATE NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE partnership_documents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  description   TEXT,
  file_url      TEXT,
  document_date DATE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Indexes ───────────────────────────────────────────────────────────────────

CREATE INDEX idx_meeting_minutes_number ON meeting_minutes (meeting_number);
CREATE INDEX idx_meeting_minutes_date   ON meeting_minutes (meeting_date DESC);
CREATE INDEX idx_partnership_docs_date  ON partnership_documents (document_date DESC);

-- ── Row Level Security ────────────────────────────────────────────────────────

ALTER TABLE meeting_minutes       ENABLE ROW LEVEL SECURITY;
ALTER TABLE partnership_documents ENABLE ROW LEVEL SECURITY;

-- Meeting minutes: authorized + admin can read; admin can write
CREATE POLICY "mm_select" ON meeting_minutes
  FOR SELECT TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('authorized', 'admin'));
CREATE POLICY "mm_insert" ON meeting_minutes
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "mm_update" ON meeting_minutes
  FOR UPDATE TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "mm_delete" ON meeting_minutes
  FOR DELETE TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Partnership documents: authorized + admin can read; admin can write
CREATE POLICY "pd_select" ON partnership_documents
  FOR SELECT TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('authorized', 'admin'));
CREATE POLICY "pd_insert" ON partnership_documents
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "pd_update" ON partnership_documents
  FOR UPDATE TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "pd_delete" ON partnership_documents
  FOR DELETE TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- ── Seed: Meeting 0 ───────────────────────────────────────────────────────────

INSERT INTO meeting_minutes (meeting_number, title, content, meeting_date) VALUES (
  0,
  'Meeting 0 — Founding Meeting',
  'Leadership & Elections
• Dawson was unanimously elected as Secretary and is also tasked with handling the group''s social media presence.
• The Treasurer position remains open, though Siral was mentioned as a primary candidate.
• The President and Vice President hold tie-breaking power in the event of any deadlocked votes.

Voting Mechanics
• The group adopted a weighted voting system based on a logarithmic scale tied to individual capital contributions.
• During the meeting, the group voted to lower the leverage value from 5 to 4.
• Under this finalized system, the largest capital contributor gets a maximum of 4 votes, while the smallest gets 1 vote.
• Trade executions will require a simple 50% majority to pass.

Investment Strategy
• Foreign exchanges are strictly prohibited for the time being.
• The group debated between an "Income-focused" model and a "Core and Satellite" model.
• They officially voted to adopt the "Core and Satellite" strategy.
• This structure allocates 75% of the collective portfolio to broad-market ETFs and index funds, leaving 25% for riskier individual stock picking.

Logistics & Cadence
• Meetings will be held bi-weekly (every two weeks) rather than on specific dates, ensuring a consistent schedule regardless of the month.
• Initial capital collections will be handled via Venmo or paper checks.
• The group will use Fidelity as their brokerage, which requires all members to sign a formal partnership agreement.',
  '2026-03-27'
);

-- ── Seed: Partnership Documents ───────────────────────────────────────────────

INSERT INTO partnership_documents (title, description, file_url, document_date) VALUES
  ('General Partnership Agreement', 'Primary partnership agreement establishing the High Agency Investment Group as a general partnership.', '/docs/partnership-agreement.pdf', '2026-03-27'),
  ('Meeting 0 Amendments', 'Amendments adopted during the founding meeting covering voting mechanics and investment strategy.', '/docs/meeting-0-amendments.pdf', '2026-03-27');

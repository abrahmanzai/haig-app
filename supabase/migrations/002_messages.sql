-- ── Tables ───────────────────────────────────────────────────────────────────

CREATE TABLE announcements (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  created_by  UUID REFERENCES profiles(id) ON DELETE SET NULL,
  pinned      BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE group_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id   UUID REFERENCES profiles(id) ON DELETE SET NULL,
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE direct_messages (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content       TEXT NOT NULL,
  read          BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE pitch_comments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pitch_id   UUID NOT NULL REFERENCES pitches(id) ON DELETE CASCADE,
  author_id  UUID REFERENCES profiles(id) ON DELETE SET NULL,
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE announcement_reads (
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  announcement_id UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, announcement_id)
);

-- ── Indexes ───────────────────────────────────────────────────────────────────

CREATE INDEX idx_group_messages_created_at  ON group_messages  (created_at);
CREATE INDEX idx_direct_messages_sender     ON direct_messages (sender_id);
CREATE INDEX idx_direct_messages_recipient  ON direct_messages (recipient_id);
CREATE INDEX idx_direct_messages_created_at ON direct_messages (created_at);
CREATE INDEX idx_pitch_comments_pitch       ON pitch_comments  (pitch_id);

-- ── Row Level Security ────────────────────────────────────────────────────────

ALTER TABLE announcements      ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_messages     ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_messages    ENABLE ROW LEVEL SECURITY;
ALTER TABLE pitch_comments     ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_reads ENABLE ROW LEVEL SECURITY;

-- Announcements: all authenticated can read; only admin can write
CREATE POLICY "ann_select" ON announcements
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "ann_insert" ON announcements
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "ann_update" ON announcements
  FOR UPDATE TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "ann_delete" ON announcements
  FOR DELETE TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Group messages: authorized + admin can read and send
CREATE POLICY "gm_select" ON group_messages
  FOR SELECT TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('authorized','admin'));
CREATE POLICY "gm_insert" ON group_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('authorized','admin')
  );

-- Direct messages: only sender or recipient can see; sender inserts
CREATE POLICY "dm_select" ON direct_messages
  FOR SELECT TO authenticated
  USING (sender_id = auth.uid() OR recipient_id = auth.uid());
CREATE POLICY "dm_insert" ON direct_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('authorized','admin')
  );
CREATE POLICY "dm_update_read" ON direct_messages
  FOR UPDATE TO authenticated
  USING (recipient_id = auth.uid());

-- Pitch comments: all authenticated can read; authorized + admin can post
CREATE POLICY "pc_select" ON pitch_comments
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "pc_insert" ON pitch_comments
  FOR INSERT TO authenticated
  WITH CHECK (
    author_id = auth.uid() AND
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('authorized','admin')
  );

-- Announcement reads: users manage their own records
CREATE POLICY "ar_select" ON announcement_reads
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "ar_insert" ON announcement_reads
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "ar_delete" ON announcement_reads
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- ── Realtime ─────────────────────────────────────────────────────────────────

ALTER TABLE announcements      REPLICA IDENTITY FULL;
ALTER TABLE group_messages     REPLICA IDENTITY FULL;
ALTER TABLE direct_messages    REPLICA IDENTITY FULL;
ALTER TABLE pitch_comments     REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE announcements;
ALTER PUBLICATION supabase_realtime ADD TABLE group_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE direct_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE pitch_comments;

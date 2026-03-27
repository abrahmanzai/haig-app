-- Allow anonymous (unauthenticated) users to read events
-- so the public landing page can display upcoming events without requiring login.
CREATE POLICY "anon_read_events"
  ON events FOR SELECT TO anon USING (true);

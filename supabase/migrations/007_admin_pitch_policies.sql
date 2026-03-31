-- Allow admins to delete pitches (and cascading votes/comments)
CREATE POLICY "admin_delete_pitches"
  ON pitches FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Allow admins to update any pitch (status changes via StatusChanger)
CREATE POLICY "admin_update_pitches"
  ON pitches FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

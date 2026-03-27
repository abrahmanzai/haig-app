-- Allow admins to insert and update attendance records for any member.
-- The existing "users_upsert_own_attendance" policy only allows INSERT where
-- auth.uid() = member_id, and there is no UPDATE policy at all, so admins
-- could not take attendance on behalf of other members.

CREATE POLICY "admin_insert_attendance"
  ON attendance FOR INSERT TO authenticated
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "admin_update_attendance"
  ON attendance FOR UPDATE TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

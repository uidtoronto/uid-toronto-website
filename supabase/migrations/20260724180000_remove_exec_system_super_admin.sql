/*
# Remove Executive Board system; authorize admin via super_admin role

## Summary
- Drops the exec_members auto-create trigger and all exec_* tables
- Replaces exec_members-based RLS on members/family_members with super_admin checks
- Super admins are identified by app_metadata.role = 'super_admin' (set via service role only)

## Assigning a super admin (run in Supabase SQL editor or via Admin API)
  UPDATE auth.users
  SET raw_app_meta_data = raw_app_meta_data || '{"role":"super_admin"}'::jsonb
  WHERE email = 'admin@example.com';
*/

-- ── Remove exec_members auto-create trigger ──
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_exec_member ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_exec_member();

-- ── Drop all executive board tables ──
DROP TABLE IF EXISTS exec_task_comments CASCADE;
DROP TABLE IF EXISTS exec_messages CASCADE;
DROP TABLE IF EXISTS exec_meeting_attendees CASCADE;
DROP TABLE IF EXISTS exec_event_rsvps CASCADE;
DROP TABLE IF EXISTS exec_crm_notes CASCADE;
DROP TABLE IF EXISTS exec_volunteers CASCADE;
DROP TABLE IF EXISTS exec_call_log CASCADE;
DROP TABLE IF EXISTS exec_notifications CASCADE;
DROP TABLE IF EXISTS exec_finance_transactions CASCADE;
DROP TABLE IF EXISTS exec_documents CASCADE;
DROP TABLE IF EXISTS exec_tasks CASCADE;
DROP TABLE IF EXISTS exec_meetings CASCADE;
DROP TABLE IF EXISTS exec_events CASCADE;
DROP TABLE IF EXISTS exec_crm_members CASCADE;
DROP TABLE IF EXISTS exec_message_channels CASCADE;
DROP TABLE IF EXISTS exec_members CASCADE;

-- ── Helper: super_admin authorization (app_metadata is service-role writable) ──
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = pg_catalog, public
AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin',
    false
  );
$$;

-- ── members: public registration INSERT; super_admin manages roster ──
DROP POLICY IF EXISTS "members_select" ON members;
CREATE POLICY "members_select" ON members FOR SELECT
  TO authenticated USING (public.is_super_admin());

DROP POLICY IF EXISTS "members_insert" ON members;
CREATE POLICY "members_insert" ON members FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "members_update" ON members;
CREATE POLICY "members_update" ON members FOR UPDATE
  TO authenticated USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "members_delete" ON members;
CREATE POLICY "members_delete" ON members FOR DELETE
  TO authenticated USING (public.is_super_admin());

-- ── family_members: public registration INSERT; super_admin manages ──
DROP POLICY IF EXISTS "family_members_select" ON family_members;
CREATE POLICY "family_members_select" ON family_members FOR SELECT
  TO authenticated USING (public.is_super_admin());

DROP POLICY IF EXISTS "family_members_insert" ON family_members;
CREATE POLICY "family_members_insert" ON family_members FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "family_members_update" ON family_members;
CREATE POLICY "family_members_update" ON family_members FOR UPDATE
  TO authenticated USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "family_members_delete" ON family_members;
CREATE POLICY "family_members_delete" ON family_members FOR DELETE
  TO authenticated USING (public.is_super_admin());

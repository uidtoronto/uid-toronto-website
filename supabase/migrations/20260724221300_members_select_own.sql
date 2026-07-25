/*
# Allow members to read their own registration row

## Problem
Registration uses `.insert().select('id')`. INSERT is allowed for anon/authenticated,
but SELECT was restricted to super_admin only. PostgREST could not return the new row,
surfacing RLS error 42501 even when the insert succeeded.

## Fix
Add a narrow SELECT policy so authenticated users can read only the row linked to
their auth account. Super admin SELECT policy is unchanged; policies are OR-combined.
*/

CREATE POLICY "members_select_own" ON members
  FOR SELECT
  TO authenticated
  USING (auth_user_id = auth.uid());

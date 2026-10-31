-- Ensure PostgREST .upsert() (INSERT ... ON CONFLICT DO UPDATE) operations on
-- public.families and public.users succeed for authenticated family members under RLS.
BEGIN;

DROP POLICY IF EXISTS families_insert_own_family ON public.families;
CREATE POLICY families_insert_own_family
  ON public.families FOR INSERT
  TO authenticated
  WITH CHECK (
    id = (SELECT private.current_user_family_id())
    OR created_by = (SELECT auth.uid())
  );

DROP POLICY IF EXISTS users_insert_self_only ON public.users;
CREATE POLICY users_insert_self_only
  ON public.users FOR INSERT
  TO authenticated
  WITH CHECK (
    auth_user_id = (SELECT auth.uid())
    AND (
      family_id IS NULL
      OR family_id = (SELECT private.current_user_family_id())
    )
  );

COMMIT;

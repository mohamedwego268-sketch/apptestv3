-- Keep the family-scope helper outside PostgREST's exposed public schema.
-- RLS policies may invoke it, but clients cannot call it as a public RPC.
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO anon, authenticated;

CREATE OR REPLACE FUNCTION private.current_user_family_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
  SELECT u.family_id
  FROM public.users AS u
  WHERE u.auth_user_id = auth.uid()
    AND u.family_id IS NOT NULL
  LIMIT 1;
$function$;

REVOKE ALL ON FUNCTION private.current_user_family_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.current_user_family_id() TO anon, authenticated, service_role;

DO $migration$
DECLARE
  policy_row record;
  using_expr text;
  check_expr text;
  alter_sql text;
BEGIN
  FOR policy_row IN
    SELECT schemaname, tablename, policyname, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'public'
      AND (
        coalesce(qual, '') LIKE '%current_user_family_id()%'
        OR coalesce(with_check, '') LIKE '%current_user_family_id()%'
      )
  LOOP
    using_expr := CASE
      WHEN policy_row.qual IS NULL THEN NULL
      ELSE replace(policy_row.qual, 'current_user_family_id()', 'private.current_user_family_id()')
    END;
    check_expr := CASE
      WHEN policy_row.with_check IS NULL THEN NULL
      ELSE replace(policy_row.with_check, 'current_user_family_id()', 'private.current_user_family_id()')
    END;

    alter_sql := format('ALTER POLICY %I ON %I.%I', policy_row.policyname, policy_row.schemaname, policy_row.tablename);
    IF using_expr IS NOT NULL THEN
      alter_sql := alter_sql || format(' USING (%s)', using_expr);
    END IF;
    IF check_expr IS NOT NULL THEN
      alter_sql := alter_sql || format(' WITH CHECK (%s)', check_expr);
    END IF;
    EXECUTE alter_sql;
  END LOOP;
END
$migration$;

REVOKE ALL ON FUNCTION public.current_user_family_id() FROM PUBLIC, anon, authenticated;
DROP FUNCTION IF EXISTS public.current_user_family_id();

-- Clear only the child's home reference when a home is deleted.
ALTER TABLE public.children
  DROP CONSTRAINT IF EXISTS children_current_home_family_fk;
ALTER TABLE public.children
  ADD CONSTRAINT children_current_home_family_fk
  FOREIGN KEY (current_home_id, family_id)
  REFERENCES public.family_homes(id, family_id)
  ON DELETE SET NULL (current_home_id);

-- Invitations are write-once from the inviter's own verified family account.
-- The acceptance RPC alone may mark an invitation as accepted.
DROP POLICY IF EXISTS co_parent_pairings_all_own_family ON public.co_parent_pairings;
DROP POLICY IF EXISTS co_parent_pairings_insert_invitation ON public.co_parent_pairings;
CREATE POLICY co_parent_pairings_insert_invitation
  ON public.co_parent_pairings
  FOR INSERT TO authenticated
  WITH CHECK (
    family_id = private.current_user_family_id()
    AND status = 'pending'
    AND verified = false
    AND partner_user_id IS NULL
    AND expires_at > now()
    AND expires_at <= now() + interval '48 hours'
    AND length(pairing_token_hash) = 64
    AND invited_by_user_id = (
      SELECT u.id FROM public.users u
      WHERE u.auth_user_id = (SELECT auth.uid())
        AND u.family_id = co_parent_pairings.family_id
      LIMIT 1
    )
    AND partner_role IN ('father','mother')
    AND partner_role <> (
      SELECT u.role FROM public.users u
      WHERE u.auth_user_id = (SELECT auth.uid())
        AND u.family_id = co_parent_pairings.family_id
      LIMIT 1
    )
  );

REVOKE ALL ON public.co_parent_pairings FROM anon;
REVOKE SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.co_parent_pairings FROM authenticated;
GRANT INSERT ON public.co_parent_pairings TO authenticated;

-- Keep the SECURITY DEFINER implementation in the private schema.
-- Preserve the existing public RPC name as a SECURITY INVOKER wrapper.
ALTER FUNCTION public.bootstrap_authenticated_family_space(text,text,text,text,text,text,text)
  SET SCHEMA private;

CREATE OR REPLACE FUNCTION public.bootstrap_authenticated_family_space(
  p_full_name text,
  p_role text DEFAULT 'mother',
  p_family_name text DEFAULT NULL,
  p_country text DEFAULT 'SA',
  p_city text DEFAULT 'الدمام',
  p_currency text DEFAULT 'SAR',
  p_phone text DEFAULT NULL
)
RETURNS TABLE(user_id uuid, family_id uuid, is_new_family boolean)
LANGUAGE sql
SECURITY INVOKER
SET search_path = public, private, pg_temp
AS $function$
  SELECT * FROM private.bootstrap_authenticated_family_space(
    p_full_name, p_role, p_family_name, p_country, p_city, p_currency, p_phone
  );
$function$;

REVOKE ALL ON FUNCTION private.bootstrap_authenticated_family_space(text,text,text,text,text,text,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.bootstrap_authenticated_family_space(text,text,text,text,text,text,text) FROM anon;
GRANT USAGE ON SCHEMA private TO authenticated;
GRANT EXECUTE ON FUNCTION private.bootstrap_authenticated_family_space(text,text,text,text,text,text,text) TO authenticated;

REVOKE ALL ON FUNCTION public.bootstrap_authenticated_family_space(text,text,text,text,text,text,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.bootstrap_authenticated_family_space(text,text,text,text,text,text,text) FROM anon;
GRANT EXECUTE ON FUNCTION public.bootstrap_authenticated_family_space(text,text,text,text,text,text,text) TO authenticated;

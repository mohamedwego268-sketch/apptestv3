-- Allow a newly authenticated co-parent to accept the single pending invitation
-- addressed to their exact, confirmed email. The existing hardened implementation
-- remains the authority for role, family, expiry, self-invite and data-integrity checks.
CREATE OR REPLACE FUNCTION public.accept_pending_family_invitation_for_current_user()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private, auth, pg_temp
AS $function$
DECLARE
  v_auth_uid uuid := auth.uid();
  v_email text;
  v_email_confirmed_at timestamptz;
  v_pending_count integer := 0;
  v_token_hash text;
BEGIN
  IF v_auth_uid IS NULL THEN
    RAISE EXCEPTION 'AUTH_REQUIRED: Sign in before accepting a family invitation.';
  END IF;

  SELECT lower(trim(email)), email_confirmed_at
    INTO v_email, v_email_confirmed_at
  FROM auth.users
  WHERE id = v_auth_uid;

  IF v_email IS NULL OR v_email_confirmed_at IS NULL THEN
    RAISE EXCEPTION 'IDENTITY_NOT_VERIFIED: Confirm this email before accepting a family invitation.';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.users
    WHERE auth_user_id = v_auth_uid
      AND lower(coalesce(role, '')) IN ('father', 'mother')
  ) THEN
    RAISE EXCEPTION 'PROFILE_REQUIRED: Complete parent account setup before accepting a family invitation.';
  END IF;

  SELECT count(*)
    INTO v_pending_count
  FROM public.co_parent_pairings cp
  JOIN public.users recipient
    ON recipient.auth_user_id = v_auth_uid
   AND lower(recipient.role) = lower(cp.partner_role)
  WHERE lower(trim(coalesce(cp.partner_email, ''))) = v_email
    AND cp.status = 'pending'
    AND cp.verified = false
    AND cp.expires_at > now();

  IF v_pending_count = 0 THEN
    RETURN jsonb_build_object('accepted', false, 'reason', 'NO_PENDING_INVITATION');
  END IF;

  IF v_pending_count > 1 THEN
    RAISE EXCEPTION 'MULTIPLE_PENDING_INVITATIONS: More than one active family invitation matches this email. Ask the inviter to cancel duplicates.';
  END IF;

  SELECT cp.pairing_token_hash
    INTO v_token_hash
  FROM public.co_parent_pairings cp
  JOIN public.users recipient
    ON recipient.auth_user_id = v_auth_uid
   AND lower(recipient.role) = lower(cp.partner_role)
  WHERE lower(trim(coalesce(cp.partner_email, ''))) = v_email
    AND cp.status = 'pending'
    AND cp.verified = false
    AND cp.expires_at > now()
  FOR UPDATE OF cp;

  IF v_token_hash IS NULL THEN
    RAISE EXCEPTION 'INVITATION_NOT_FOUND: The pending family invitation could not be locked.';
  END IF;

  RETURN private.accept_family_invitation_impl(v_token_hash);
END;
$function$;

REVOKE ALL ON FUNCTION public.accept_pending_family_invitation_for_current_user() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.accept_pending_family_invitation_for_current_user() TO authenticated;

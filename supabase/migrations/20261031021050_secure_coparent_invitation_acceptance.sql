CREATE OR REPLACE FUNCTION private.accept_family_invitation_impl(p_token_hash text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions, pg_temp
AS $function$
DECLARE
  v_invitation public.co_parent_pairings%ROWTYPE;
  v_auth_user auth.users%ROWTYPE;
  v_profile public.users%ROWTYPE;
  v_inviter_role text;
  v_email_matches boolean := false;
  v_phone_matches boolean := false;
  v_auth_phone_digits text;
  v_invite_phone_digits text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'AUTH_REQUIRED: Sign in before accepting a family invitation.';
  END IF;

  IF p_token_hash IS NULL OR p_token_hash !~ '^[0-9a-f]{64}$' THEN
    RAISE EXCEPTION 'INVALID_INVITATION: The invitation code is invalid.';
  END IF;

  SELECT * INTO v_invitation
  FROM public.co_parent_pairings
  WHERE pairing_token_hash = p_token_hash
  FOR UPDATE;

  IF NOT FOUND
     OR v_invitation.status <> 'pending'
     OR v_invitation.verified = true
     OR v_invitation.expires_at <= now() THEN
    RAISE EXCEPTION 'INVITATION_EXPIRED: This invitation is invalid, expired, or already used.';
  END IF;

  SELECT * INTO v_auth_user FROM auth.users WHERE id = auth.uid();
  IF NOT FOUND THEN
    RAISE EXCEPTION 'AUTH_REQUIRED: Authenticated account was not found.';
  END IF;

  v_email_matches := COALESCE(
    COALESCE(v_invitation.partner_email, '') <> ''
    AND v_auth_user.email_confirmed_at IS NOT NULL
    AND lower(COALESCE(v_auth_user.email, '')) = lower(v_invitation.partner_email),
    false
  );

  v_auth_phone_digits := regexp_replace(COALESCE(v_auth_user.phone, ''), '\D', '', 'g');
  v_invite_phone_digits := regexp_replace(COALESCE(v_invitation.partner_phone, ''), '\D', '', 'g');
  v_phone_matches := COALESCE(
    COALESCE(v_invite_phone_digits, '') <> ''
    AND v_auth_user.phone_confirmed_at IS NOT NULL
    AND length(v_auth_phone_digits) >= 9
    AND length(v_invite_phone_digits) >= 9
    AND right(v_auth_phone_digits, 9) = right(v_invite_phone_digits, 9),
    false
  );

  IF NOT (v_email_matches OR v_phone_matches) THEN
    RAISE EXCEPTION 'INVITATION_IDENTITY_MISMATCH: Sign in with the verified email or phone number that received this invitation.';
  END IF;

  SELECT * INTO v_profile
  FROM public.users
  WHERE auth_user_id = auth.uid()
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'PROFILE_REQUIRED: Complete account setup before accepting a family invitation.';
  END IF;

  IF v_profile.id = v_invitation.invited_by_user_id THEN
    RAISE EXCEPTION 'SELF_INVITATION: You cannot accept your own invitation.';
  END IF;

  IF lower(COALESCE(v_profile.role, '')) NOT IN ('father', 'mother') THEN
    RAISE EXCEPTION 'PARENT_ROLE_REQUIRED: Only a verified parent account can accept this co-parent invitation.';
  END IF;

  IF lower(COALESCE(v_profile.role, '')) <> lower(v_invitation.partner_role) THEN
    RAISE EXCEPTION 'ROLE_MISMATCH: This invitation was issued for a different parent role.';
  END IF;

  SELECT lower(COALESCE(role, '')) INTO v_inviter_role
  FROM public.users
  WHERE id = v_invitation.invited_by_user_id
    AND family_id = v_invitation.family_id;

  IF v_inviter_role IS NULL
     OR v_inviter_role NOT IN ('father', 'mother')
     OR v_inviter_role = lower(v_invitation.partner_role) THEN
    RAISE EXCEPTION 'INVITER_INVALID: The inviting parent is not an active member of this family.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.family_id = v_invitation.family_id
      AND lower(COALESCE(u.role, '')) = lower(v_invitation.partner_role)
      AND u.id <> v_profile.id
  ) THEN
    RAISE EXCEPTION 'PARENT_ALREADY_LINKED: This family already has a verified account for that parent role.';
  END IF;

  IF v_profile.family_id IS NOT NULL
     AND v_profile.family_id <> v_invitation.family_id THEN
    IF EXISTS (SELECT 1 FROM public.children WHERE family_id = v_profile.family_id)
       OR EXISTS (SELECT 1 FROM public.extended_family WHERE family_id = v_profile.family_id)
       OR EXISTS (
         SELECT 1 FROM public.users u
         WHERE u.family_id = v_profile.family_id AND u.id <> v_profile.id
       ) THEN
      RAISE EXCEPTION 'FAMILY_DATA_EXISTS: This account already has family or child data. A safe data merge is required before linking.';
    END IF;
  END IF;

  UPDATE public.users
  SET family_id = v_invitation.family_id,
      updated_at = now()
  WHERE id = v_profile.id;

  UPDATE public.parent_locations
  SET family_id = v_invitation.family_id,
      updated_at = now()
  WHERE user_id = v_profile.id;

  UPDATE public.co_parent_pairings
  SET partner_user_id = v_profile.id,
      status = 'accepted',
      verified = true,
      accepted_at = now()
  WHERE id = v_invitation.id;

  RETURN jsonb_build_object(
    'accepted', true,
    'family_id', v_invitation.family_id,
    'profile_user_id', v_profile.id,
    'inviter_user_id', v_invitation.invited_by_user_id
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.accept_family_invitation(p_token_hash text)
RETURNS jsonb
LANGUAGE sql
SECURITY INVOKER
SET search_path = public, private, pg_temp
AS $function$
  SELECT private.accept_family_invitation_impl(p_token_hash);
$function$;

REVOKE ALL ON FUNCTION private.accept_family_invitation_impl(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.accept_family_invitation_impl(text) FROM anon;
GRANT USAGE ON SCHEMA private TO authenticated;
GRANT EXECUTE ON FUNCTION private.accept_family_invitation_impl(text) TO authenticated;

REVOKE ALL ON FUNCTION public.accept_family_invitation(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.accept_family_invitation(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.accept_family_invitation(text) TO authenticated;

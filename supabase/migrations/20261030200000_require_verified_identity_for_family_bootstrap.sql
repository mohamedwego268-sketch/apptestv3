-- Require a confirmed email or phone before creating or linking a family.
-- The check is enforced inside the SECURITY DEFINER RPC, not only in the client.
CREATE OR REPLACE FUNCTION public.bootstrap_authenticated_family_space(
  p_full_name TEXT,
  p_role TEXT DEFAULT 'mother',
  p_family_name TEXT DEFAULT NULL,
  p_country TEXT DEFAULT 'SA',
  p_city TEXT DEFAULT 'الدمام',
  p_currency TEXT DEFAULT 'SAR',
  p_phone TEXT DEFAULT NULL
)
RETURNS TABLE (
  user_id UUID,
  family_id UUID,
  is_new_family BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  v_auth_uid UUID := auth.uid();
  v_auth_email TEXT := NULLIF(TRIM(COALESCE(auth.jwt() ->> 'email', '')), '');
  v_is_identity_verified BOOLEAN := FALSE;
  v_clean_name TEXT := NULLIF(TRIM(COALESCE(p_full_name, '')), '');
  v_clean_role TEXT := CASE
    WHEN LOWER(TRIM(COALESCE(p_role, ''))) IN ('father', 'dad', 'أب') THEN 'father'
    ELSE 'mother'
  END;
  v_clean_country TEXT := CASE
    WHEN UPPER(TRIM(COALESCE(p_country, ''))) = 'EG' THEN 'EG'
    ELSE 'SA'
  END;
  v_clean_currency TEXT := CASE
    WHEN UPPER(TRIM(COALESCE(p_currency, ''))) IN ('EGP', 'SAR', 'USD') THEN UPPER(TRIM(p_currency))
    WHEN UPPER(TRIM(COALESCE(p_country, ''))) = 'EG' THEN 'EGP'
    ELSE 'SAR'
  END;
  v_clean_city TEXT := COALESCE(NULLIF(TRIM(p_city), ''), CASE WHEN v_clean_country = 'EG' THEN 'القاهرة' ELSE 'الدمام' END);
  v_clean_family_name TEXT;
  v_existing_user_id UUID;
  v_existing_family_id UUID;
BEGIN
  IF v_auth_uid IS NULL THEN
    RAISE EXCEPTION 'UNAUTHENTICATED: Active Supabase Auth session (auth.uid()) is required.';
  END IF;

  IF v_clean_name IS NULL THEN
    RAISE EXCEPTION 'INVALID_INPUT: Parent full_name is required.';
  END IF;

  SELECT COALESCE(au.email_confirmed_at IS NOT NULL OR au.phone_confirmed_at IS NOT NULL, FALSE)
    INTO v_is_identity_verified
  FROM auth.users au
  WHERE au.id = v_auth_uid
  LIMIT 1;

  IF NOT v_is_identity_verified THEN
    RAISE EXCEPTION 'IDENTITY_NOT_VERIFIED: Confirm your email address or phone number before creating a family.';
  END IF;

  v_clean_family_name := COALESCE(
    NULLIF(TRIM(p_family_name), ''),
    'أسرة ' || v_clean_name || ' — نكبر'
  );

  PERFORM pg_advisory_xact_lock(hashtext(v_auth_uid::text));

  SELECT u.id, u.family_id
    INTO v_existing_user_id, v_existing_family_id
  FROM public.users u
  WHERE u.auth_user_id = v_auth_uid
  LIMIT 1;

  IF v_existing_user_id IS NOT NULL AND v_existing_family_id IS NOT NULL THEN
    UPDATE public.users
    SET
      full_name = v_clean_name,
      role = v_clean_role,
      email = COALESCE(v_auth_email, email),
      phone = COALESCE(NULLIF(TRIM(p_phone), ''), phone),
      country = v_clean_country,
      verified = v_is_identity_verified,
      updated_at = NOW()
    WHERE id = v_existing_user_id
      AND auth_user_id = v_auth_uid;

    RETURN QUERY SELECT v_existing_user_id, v_existing_family_id, FALSE;
    RETURN;
  END IF;

  INSERT INTO public.families (
    family_name, country, city, currency, active_parent, created_by, updated_at
  )
  VALUES (
    v_clean_family_name, v_clean_country, v_clean_city, v_clean_currency,
    v_clean_role, v_auth_uid, NOW()
  )
  RETURNING id INTO v_existing_family_id;

  IF v_existing_user_id IS NOT NULL THEN
    UPDATE public.users
    SET
      family_id = v_existing_family_id,
      full_name = v_clean_name,
      role = v_clean_role,
      email = v_auth_email,
      phone = NULLIF(TRIM(p_phone), ''),
      country = v_clean_country,
      verified = v_is_identity_verified,
      updated_at = NOW()
    WHERE id = v_existing_user_id
      AND auth_user_id = v_auth_uid;
  ELSE
    INSERT INTO public.users (
      auth_user_id, family_id, full_name, role, email, phone, country, verified, updated_at
    )
    VALUES (
      v_auth_uid, v_existing_family_id, v_clean_name, v_clean_role,
      v_auth_email, NULLIF(TRIM(p_phone), ''), v_clean_country,
      v_is_identity_verified, NOW()
    )
    RETURNING id INTO v_existing_user_id;
  END IF;

  RETURN QUERY SELECT v_existing_user_id, v_existing_family_id, TRUE;
END;
$function$;

REVOKE ALL ON FUNCTION public.bootstrap_authenticated_family_space(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.bootstrap_authenticated_family_space(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;

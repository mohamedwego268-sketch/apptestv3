-- ============================================================================
-- Migration: 20261031120000_support_all_22_arab_league_countries.sql
-- Purpose: Expand country, currency, and timezone constraints and RPC defaults
--          across public.family_homes, public.parent_locations,
--          private.create_default_family_home(), and
--          public.bootstrap_authenticated_family_space() to support all 22
--          Arab League countries:
--          EG, SA, AE, KW, QA, BH, OM, IQ, JO, PS, LB, SY, YE, SD, LY, TN, DZ, MA, MR, SO, DJ, KM
-- ============================================================================

-- 1. Expand country & currency CHECK constraints on public.family_homes
ALTER TABLE public.family_homes
  DROP CONSTRAINT IF EXISTS family_homes_country_check,
  DROP CONSTRAINT IF EXISTS family_homes_currency_check;

ALTER TABLE public.family_homes
  ADD CONSTRAINT family_homes_country_check
    CHECK (country IN ('EG','SA','AE','KW','QA','BH','OM','IQ','JO','PS','LB','SY','YE','SD','LY','TN','DZ','MA','MR','SO','DJ','KM')),
  ADD CONSTRAINT family_homes_currency_check
    CHECK (currency IN ('EGP','SAR','AED','KWD','QAR','BHD','OMR','IQD','JOD','ILS','LBP','SYP','YER','SDG','LYD','TND','DZD','MAD','MRU','SOS','DJF','KMF'));

-- 2. Expand country & currency CHECK constraints on public.parent_locations
ALTER TABLE public.parent_locations
  DROP CONSTRAINT IF EXISTS parent_locations_country_check,
  DROP CONSTRAINT IF EXISTS parent_locations_currency_check;

ALTER TABLE public.parent_locations
  ADD CONSTRAINT parent_locations_country_check
    CHECK (country IN ('EG','SA','AE','KW','QA','BH','OM','IQ','JO','PS','LB','SY','YE','SD','LY','TN','DZ','MA','MR','SO','DJ','KM')),
  ADD CONSTRAINT parent_locations_currency_check
    CHECK (currency IN ('EGP','SAR','AED','KWD','QAR','BHD','OMR','IQD','JOD','ILS','LBP','SYP','YER','SDG','LYD','TND','DZD','MAD','MRU','SOS','DJF','KMF'));

-- 3. Update private.create_default_family_home() trigger function to resolve all 22 timezones
CREATE OR REPLACE FUNCTION private.create_default_family_home()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  INSERT INTO public.family_homes (family_id, label, country, city, currency, timezone, is_primary, created_by)
  VALUES (
    NEW.id, 'منزل الأسرة', NEW.country, NEW.city, NEW.currency,
    CASE NEW.country
      WHEN 'EG' THEN 'Africa/Cairo'
      WHEN 'SA' THEN 'Asia/Riyadh'
      WHEN 'AE' THEN 'Asia/Dubai'
      WHEN 'KW' THEN 'Asia/Kuwait'
      WHEN 'QA' THEN 'Asia/Qatar'
      WHEN 'BH' THEN 'Asia/Bahrain'
      WHEN 'OM' THEN 'Asia/Muscat'
      WHEN 'IQ' THEN 'Asia/Baghdad'
      WHEN 'JO' THEN 'Asia/Amman'
      WHEN 'PS' THEN 'Asia/Gaza'
      WHEN 'LB' THEN 'Asia/Beirut'
      WHEN 'SY' THEN 'Asia/Damascus'
      WHEN 'YE' THEN 'Asia/Aden'
      WHEN 'SD' THEN 'Africa/Khartoum'
      WHEN 'LY' THEN 'Africa/Tripoli'
      WHEN 'TN' THEN 'Africa/Tunis'
      WHEN 'DZ' THEN 'Africa/Algiers'
      WHEN 'MA' THEN 'Africa/Casablanca'
      WHEN 'MR' THEN 'Africa/Nouakchott'
      WHEN 'SO' THEN 'Africa/Mogadishu'
      WHEN 'DJ' THEN 'Africa/Djibouti'
      WHEN 'KM' THEN 'Indian/Comoro'
      ELSE 'Asia/Riyadh'
    END,
    true, NEW.created_by
  )
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION private.create_default_family_home() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.create_default_family_home() TO authenticated, service_role;

-- 4. Update public.bootstrap_authenticated_family_space() to accept all 22 Arab League countries and currencies
-- Keep the hardened production architecture: SECURITY DEFINER stays private.
-- Preserve the existing function signature and return contract used by the app.
CREATE OR REPLACE FUNCTION private.bootstrap_authenticated_family_space(
  p_full_name text,
  p_role text DEFAULT 'mother',
  p_family_name text DEFAULT NULL,
  p_country text DEFAULT 'SA',
  p_city text DEFAULT 'الدمام',
  p_currency text DEFAULT 'SAR',
  p_phone text DEFAULT NULL
)
RETURNS TABLE(user_id uuid, family_id uuid, is_new_family boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  v_auth_uid uuid := auth.uid();
  v_auth_email text := NULLIF(BTRIM(COALESCE(auth.jwt() ->> 'email', '')), '');
  v_is_identity_verified boolean := false;
  v_clean_name text := NULLIF(BTRIM(COALESCE(p_full_name, '')), '');
  v_clean_role text := CASE
    WHEN LOWER(BTRIM(COALESCE(p_role, ''))) IN ('father', 'dad', 'أب') THEN 'father'
    ELSE 'mother'
  END;
  v_clean_country text;
  v_clean_currency text;
  v_clean_city text;
  v_clean_family_name text;
  v_existing_user_id uuid;
  v_existing_family_id uuid;
BEGIN
  IF v_auth_uid IS NULL THEN
    RAISE EXCEPTION 'UNAUTHENTICATED: Active Supabase Auth session (auth.uid()) is required.';
  END IF;
  IF v_clean_name IS NULL THEN
    RAISE EXCEPTION 'INVALID_INPUT: Parent full_name is required.';
  END IF;

  SELECT COALESCE(au.email_confirmed_at IS NOT NULL OR au.phone_confirmed_at IS NOT NULL, false)
    INTO v_is_identity_verified
  FROM auth.users au
  WHERE au.id = v_auth_uid
  LIMIT 1;

  IF NOT v_is_identity_verified THEN
    RAISE EXCEPTION 'IDENTITY_NOT_VERIFIED: Confirm your email address or phone number before creating a family.';
  END IF;

  v_clean_country := UPPER(BTRIM(COALESCE(p_country, '')));
  IF v_clean_country NOT IN ('EG','SA','AE','KW','QA','BH','OM','IQ','JO','PS','LB','SY','YE','SD','LY','TN','DZ','MA','MR','SO','DJ','KM') THEN
    v_clean_country := 'SA';
  END IF;

  v_clean_currency := UPPER(BTRIM(COALESCE(p_currency, '')));
  IF v_clean_currency NOT IN ('EGP','SAR','AED','KWD','QAR','BHD','OMR','IQD','JOD','ILS','LBP','SYP','YER','SDG','LYD','TND','DZD','MAD','MRU','SOS','DJF','KMF') THEN
    v_clean_currency := CASE v_clean_country
      WHEN 'EG' THEN 'EGP'
      WHEN 'SA' THEN 'SAR'
      WHEN 'AE' THEN 'AED'
      WHEN 'KW' THEN 'KWD'
      WHEN 'QA' THEN 'QAR'
      WHEN 'BH' THEN 'BHD'
      WHEN 'OM' THEN 'OMR'
      WHEN 'IQ' THEN 'IQD'
      WHEN 'JO' THEN 'JOD'
      WHEN 'PS' THEN 'ILS'
      WHEN 'LB' THEN 'LBP'
      WHEN 'SY' THEN 'SYP'
      WHEN 'YE' THEN 'YER'
      WHEN 'SD' THEN 'SDG'
      WHEN 'LY' THEN 'LYD'
      WHEN 'TN' THEN 'TND'
      WHEN 'DZ' THEN 'DZD'
      WHEN 'MA' THEN 'MAD'
      WHEN 'MR' THEN 'MRU'
      WHEN 'SO' THEN 'SOS'
      WHEN 'DJ' THEN 'DJF'
      WHEN 'KM' THEN 'KMF'
      ELSE 'SAR'
    END;
  END IF;

  v_clean_city := COALESCE(NULLIF(BTRIM(p_city), ''), CASE v_clean_country
    WHEN 'EG' THEN 'القاهرة'
    WHEN 'SA' THEN 'الرياض'
    WHEN 'AE' THEN 'دبي'
    WHEN 'KW' THEN 'مدينة الكويت'
    WHEN 'QA' THEN 'الدوحة'
    WHEN 'BH' THEN 'المنامة'
    WHEN 'OM' THEN 'مسقط'
    WHEN 'IQ' THEN 'بغداد'
    WHEN 'JO' THEN 'عمّان'
    WHEN 'PS' THEN 'رام الله'
    WHEN 'LB' THEN 'بيروت'
    WHEN 'SY' THEN 'دمشق'
    WHEN 'YE' THEN 'صنعاء'
    WHEN 'SD' THEN 'الخرطوم'
    WHEN 'LY' THEN 'طرابلس'
    WHEN 'TN' THEN 'تونس'
    WHEN 'DZ' THEN 'الجزائر'
    WHEN 'MA' THEN 'الرباط'
    WHEN 'MR' THEN 'نواكشوط'
    WHEN 'SO' THEN 'مقديشو'
    WHEN 'DJ' THEN 'جيبوتي'
    WHEN 'KM' THEN 'موروني'
    ELSE 'الرياض'
  END);

  v_clean_family_name := COALESCE(
    NULLIF(BTRIM(p_family_name), ''),
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
    SET full_name = v_clean_name,
        role = v_clean_role,
        email = COALESCE(v_auth_email, email),
        phone = COALESCE(NULLIF(BTRIM(p_phone), ''), phone),
        country = v_clean_country,
        verified = v_is_identity_verified,
        updated_at = NOW()
    WHERE id = v_existing_user_id AND auth_user_id = v_auth_uid;

    RETURN QUERY SELECT v_existing_user_id, v_existing_family_id, false;
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
    SET family_id = v_existing_family_id,
        full_name = v_clean_name,
        role = v_clean_role,
        email = v_auth_email,
        phone = NULLIF(BTRIM(p_phone), ''),
        country = v_clean_country,
        verified = v_is_identity_verified,
        updated_at = NOW()
    WHERE id = v_existing_user_id AND auth_user_id = v_auth_uid;
  ELSE
    INSERT INTO public.users (
      auth_user_id, family_id, full_name, role, email, phone, country, verified, updated_at
    )
    VALUES (
      v_auth_uid, v_existing_family_id, v_clean_name, v_clean_role,
      v_auth_email, NULLIF(BTRIM(p_phone), ''), v_clean_country,
      v_is_identity_verified, NOW()
    )
    RETURNING id INTO v_existing_user_id;
  END IF;

  RETURN QUERY SELECT v_existing_user_id, v_existing_family_id, true;
END;
$function$;

REVOKE ALL ON FUNCTION private.bootstrap_authenticated_family_space(text,text,text,text,text,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.bootstrap_authenticated_family_space(text,text,text,text,text,text,text) TO authenticated, service_role;

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

REVOKE ALL ON FUNCTION public.bootstrap_authenticated_family_space(text,text,text,text,text,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.bootstrap_authenticated_family_space(text,text,text,text,text,text,text) TO authenticated, service_role;

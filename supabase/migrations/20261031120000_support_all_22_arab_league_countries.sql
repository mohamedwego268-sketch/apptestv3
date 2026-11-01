-- ============================================================================
-- Migration: 20260417010000_support_all_22_arab_league_countries.sql
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
CREATE OR REPLACE FUNCTION public.bootstrap_authenticated_family_space(
  p_full_name text DEFAULT NULL,
  p_role text DEFAULT NULL,
  p_phone text DEFAULT NULL,
  p_country text DEFAULT NULL,
  p_city text DEFAULT NULL,
  p_currency text DEFAULT NULL,
  p_family_name text DEFAULT NULL
)
RETURNS TABLE(family_id uuid, user_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_auth_uid uuid := (SELECT auth.uid());
  v_auth_email text;
  v_meta jsonb := '{}'::jsonb;
  v_existing_user_id uuid;
  v_existing_family_id uuid;
  v_target_family_id uuid;
  v_full_name text;
  v_role text;
  v_phone text;
  v_country text;
  v_city text;
  v_currency text;
  v_family_name text;
BEGIN
  IF v_auth_uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required to bootstrap family space' USING ERRCODE = '42501';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext('bootstrap_family_space:' || v_auth_uid::text));

  SELECT u.email, COALESCE(u.raw_user_meta_data, '{}'::jsonb)
  INTO v_auth_email, v_meta
  FROM auth.users AS u
  WHERE u.id = v_auth_uid;

  SELECT u.id, u.family_id
  INTO v_existing_user_id, v_existing_family_id
  FROM public.users AS u
  WHERE u.auth_user_id = v_auth_uid
  ORDER BY u.created_at ASC
  LIMIT 1;

  v_role := LOWER(COALESCE(NULLIF(BTRIM(p_role), ''), NULLIF(BTRIM(v_meta ->> 'role'), ''), 'mother'));
  IF v_role IN ('dad', 'father', 'أب') THEN
    v_role := 'father';
  ELSE
    v_role := 'mother';
  END IF;

  v_country := UPPER(COALESCE(NULLIF(BTRIM(p_country), ''), NULLIF(BTRIM(v_meta ->> 'country'), ''), 'SA'));
  IF v_country NOT IN ('EG','SA','AE','KW','QA','BH','OM','IQ','JO','PS','LB','SY','YE','SD','LY','TN','DZ','MA','MR','SO','DJ','KM') THEN
    v_country := 'SA';
  END IF;

  v_currency := UPPER(COALESCE(NULLIF(BTRIM(p_currency), ''), NULLIF(BTRIM(v_meta ->> 'currency'), ''), ''));
  IF v_currency NOT IN ('EGP','SAR','AED','KWD','QAR','BHD','OMR','IQD','JOD','ILS','LBP','SYP','YER','SDG','LYD','TND','DZD','MAD','MRU','SOS','DJF','KMF') THEN
    v_currency := CASE v_country
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

  v_city := COALESCE(
    NULLIF(BTRIM(p_city), ''),
    NULLIF(BTRIM(v_meta ->> 'city'), ''),
    CASE v_country
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
    END
  );

  v_full_name := COALESCE(
    NULLIF(BTRIM(p_full_name), ''),
    NULLIF(BTRIM(v_meta ->> 'full_name'), ''),
    NULLIF(SPLIT_PART(COALESCE(v_auth_email, ''), '@', 1), ''),
    CASE WHEN v_role = 'father' THEN 'أحمد' ELSE 'مريم' END
  );

  v_phone := COALESCE(NULLIF(BTRIM(p_phone), ''), NULLIF(BTRIM(v_meta ->> 'phone'), ''));

  v_family_name := COALESCE(
    NULLIF(BTRIM(p_family_name), ''),
    NULLIF(BTRIM(v_meta ->> 'family_name'), ''),
    'أسرة ' || v_full_name || ' — نكبر'
  );

  IF v_existing_family_id IS NOT NULL THEN
    v_target_family_id := v_existing_family_id;
  ELSE
    SELECT f.id
    INTO v_target_family_id
    FROM public.families AS f
    WHERE f.created_by = v_auth_uid
    ORDER BY f.created_at ASC
    LIMIT 1;
  END IF;

  IF v_target_family_id IS NULL THEN
    INSERT INTO public.families (
      family_name,
      country,
      city,
      currency,
      active_parent,
      created_by
    )
    VALUES (
      v_family_name,
      v_country,
      v_city,
      v_currency,
      v_role,
      v_auth_uid
    )
    RETURNING id INTO v_target_family_id;
  END IF;

  IF v_existing_user_id IS NULL THEN
    INSERT INTO public.users (
      auth_user_id,
      family_id,
      full_name,
      role,
      email,
      phone,
      country,
      verified
    )
    VALUES (
      v_auth_uid,
      v_target_family_id,
      v_full_name,
      v_role,
      v_auth_email,
      v_phone,
      v_country,
      true
    )
    RETURNING id INTO v_existing_user_id;
  ELSE
    UPDATE public.users
    SET family_id = COALESCE(public.users.family_id, v_target_family_id),
        full_name = COALESCE(NULLIF(BTRIM(p_full_name), ''), public.users.full_name),
        role = COALESCE(NULLIF(BTRIM(v_role), ''), public.users.role),
        email = COALESCE(v_auth_email, public.users.email),
        phone = COALESCE(v_phone, public.users.phone),
        country = COALESCE(v_country, public.users.country),
        updated_at = now()
    WHERE id = v_existing_user_id;
  END IF;

  RETURN QUERY SELECT v_target_family_id, v_existing_user_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.bootstrap_authenticated_family_space(text, text, text, text, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.bootstrap_authenticated_family_space(text, text, text, text, text, text, text) TO authenticated, service_role;

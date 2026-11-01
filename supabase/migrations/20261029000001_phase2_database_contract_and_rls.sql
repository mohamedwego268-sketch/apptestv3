-- ============================================================================
-- Nekbaar (نكبر) — Phase 2 Database Contract, Atomic Auth Bootstrap & RLS
-- Target Project: qbwnzunusmaidciakuod (PREPARED ONLY — DO NOT AUTO-EXECUTE)
-- Guarantees:
--   1. Zero destructive changes: no DROP TABLE, DROP COLUMN, DELETE, or UPDATE
--      overwriting/quarantining existing rows in `public.users`, `public.families`,
--      or `public.children`.
--   2. Uses `NOT VALID` on new foreign keys so existing rows are preserved untouched
--      while strictly enforcing referential integrity on all new/updated rows.
--   3. Reuses existing schema table names (`co_parent_pairings`, `extended_family`,
--      `wellness_diagnostics`, `bedtime_stories`, `catalog_items`) without duplicates.
--   4. Enforces least-privilege RLS derived strictly from `auth.uid()` and verified
--      `public.users.auth_user_id` + `public.users.family_id`.
-- ============================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- 1. `public.families` — Additive Columns Preserving Live (id, family_name, created_at)
-- ============================================================================
ALTER TABLE public.families
  ALTER COLUMN id SET DEFAULT gen_random_uuid(),
  ALTER COLUMN created_at SET DEFAULT NOW();

ALTER TABLE public.families
  ADD COLUMN IF NOT EXISTS country TEXT NOT NULL DEFAULT 'SA',
  ADD COLUMN IF NOT EXISTS city TEXT NOT NULL DEFAULT 'الدمام',
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'SAR',
  ADD COLUMN IF NOT EXISTS active_parent TEXT NOT NULL DEFAULT 'mother',
  ADD COLUMN IF NOT EXISTS pairing_token TEXT NULL,
  ADD COLUMN IF NOT EXISTS created_by UUID NULL,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_families_created_by') THEN
    ALTER TABLE public.families
      ADD CONSTRAINT fk_families_created_by
      FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL NOT VALID;
  END IF;
END $$;

-- ============================================================================
-- 2. `public.users` — Additive Columns Preserving Live (id, auth_user_id, full_name, role, created_at)
-- Zero mutation/quarantine of existing rows; `NOT VALID` constraints protect existing data.
-- ============================================================================
ALTER TABLE public.users
  ALTER COLUMN id SET DEFAULT gen_random_uuid(),
  ALTER COLUMN created_at SET DEFAULT NOW();

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS family_id UUID NULL,
  ADD COLUMN IF NOT EXISTS email TEXT NULL,
  ADD COLUMN IF NOT EXISTS phone TEXT NULL,
  ADD COLUMN IF NOT EXISTS country TEXT NOT NULL DEFAULT 'SA',
  ADD COLUMN IF NOT EXISTS verified BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_users_auth_user_id') THEN
    ALTER TABLE public.users
      ADD CONSTRAINT fk_users_auth_user_id
      FOREIGN KEY (auth_user_id) REFERENCES auth.users(id) ON DELETE CASCADE NOT VALID;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_users_family_id') THEN
    ALTER TABLE public.users
      ADD CONSTRAINT fk_users_family_id
      FOREIGN KEY (family_id) REFERENCES public.families(id) ON UPDATE CASCADE ON DELETE RESTRICT NOT VALID;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS uq_users_auth_user_id
  ON public.users(auth_user_id)
  WHERE auth_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_family_id
  ON public.users(family_id)
  WHERE family_id IS NOT NULL;

-- ============================================================================
-- 3. `public.children` — Additive Columns Preserving Live (id, family_id, name, age_stage, gender, passions_or_heroes, created_at)
-- ============================================================================
ALTER TABLE public.children
  ALTER COLUMN id SET DEFAULT gen_random_uuid(),
  ALTER COLUMN created_at SET DEFAULT NOW();

ALTER TABLE public.children
  ADD COLUMN IF NOT EXISTS birth DATE NULL,
  ADD COLUMN IF NOT EXISTS interests TEXT NULL,
  ADD COLUMN IF NOT EXISTS emoji TEXT NOT NULL DEFAULT '👶🏻',
  ADD COLUMN IF NOT EXISTS avatar_theme TEXT NOT NULL DEFAULT 'astronaut',
  ADD COLUMN IF NOT EXISTS vaccinations_note TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS growth_height_cm NUMERIC NULL,
  ADD COLUMN IF NOT EXISTS growth_weight_kg NUMERIC NULL,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_children_family_id') THEN
    ALTER TABLE public.children
      ADD CONSTRAINT fk_children_family_id
      FOREIGN KEY (family_id) REFERENCES public.families(id) ON UPDATE CASCADE ON DELETE CASCADE NOT VALID;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_children_family_id ON public.children(family_id);

-- ============================================================================
-- 4. Reuse Existing Application Tables (`co_parent_pairings`, `extended_family`,
--    `wellness_diagnostics`, `bedtime_stories`, `catalog_items`) with UUID `family_id`
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.co_parent_pairings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  invited_by_user_id UUID NULL REFERENCES public.users(id) ON DELETE SET NULL,
  partner_user_id UUID NULL REFERENCES public.users(id) ON DELETE SET NULL,
  partner_name TEXT NOT NULL,
  partner_phone TEXT NOT NULL DEFAULT '',
  partner_email TEXT NOT NULL,
  partner_role TEXT NOT NULL DEFAULT 'father' CHECK (partner_role IN ('father', 'mother')),
  pairing_method TEXT NOT NULL DEFAULT 'phone_otp' CHECK (pairing_method IN ('phone_otp', 'qr_token')),
  pairing_token_hash TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'revoked', 'expired')),
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '48 hours'),
  linked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_co_parent_pairings_family_id
  ON public.co_parent_pairings(family_id);

-- 4.2 `public.extended_family` (Already exists on live DB with: id, family_id, full_name, relation_type, created_at)
CREATE TABLE IF NOT EXISTS public.extended_family (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  relation_type TEXT NOT NULL DEFAULT '',
  name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT '',
  side TEXT NOT NULL DEFAULT 'Maternal',
  phone_number TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.extended_family
  ALTER COLUMN full_name SET DEFAULT '',
  ALTER COLUMN relation_type SET DEFAULT '';

ALTER TABLE public.extended_family
  ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS side TEXT NOT NULL DEFAULT 'Maternal',
  ADD COLUMN IF NOT EXISTS phone_number TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS email TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_extended_family_family_id') THEN
    ALTER TABLE public.extended_family
      ADD CONSTRAINT fk_extended_family_family_id
      FOREIGN KEY (family_id) REFERENCES public.families(id) ON DELETE CASCADE NOT VALID;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_extended_family_family_id
  ON public.extended_family(family_id);

-- 4.3 `public.wellness_diagnostics`
CREATE TABLE IF NOT EXISTS public.wellness_diagnostics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  child_name TEXT NOT NULL,
  age_stage TEXT NOT NULL DEFAULT '0-2',
  overall_score INTEGER NOT NULL DEFAULT 90,
  sleep_score INTEGER NOT NULL DEFAULT 90,
  nutrition_score INTEGER NOT NULL DEFAULT 90,
  mood_score INTEGER NOT NULL DEFAULT 90,
  routine_score INTEGER NOT NULL DEFAULT 85,
  routine_completion_score INTEGER NOT NULL DEFAULT 85,
  status_level TEXT NOT NULL DEFAULT 'optimal',
  recommendation_ar TEXT NOT NULL DEFAULT '',
  recommendation_en TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (family_id, child_id)
);

CREATE INDEX IF NOT EXISTS idx_wellness_diagnostics_family_id
  ON public.wellness_diagnostics(family_id);

-- 4.4 `public.bedtime_stories`
CREATE TABLE IF NOT EXISTS public.bedtime_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_code TEXT NOT NULL,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  child_id UUID NULL REFERENCES public.children(id) ON DELETE SET NULL,
  child_name TEXT NOT NULL,
  age_stage TEXT NOT NULL DEFAULT '0-2',
  title_ar TEXT NOT NULL,
  title_en TEXT NOT NULL,
  story_body_ar TEXT NOT NULL,
  story_body_en TEXT NOT NULL,
  moral_tag_ar TEXT NOT NULL DEFAULT '',
  moral_tag_en TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bedtime_stories_family_id
  ON public.bedtime_stories(family_id);

-- 4.5 `public.catalog_items` (Already exists on live DB with: id, title, price, description, created_at)
CREATE TABLE IF NOT EXISTS public.catalog_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL DEFAULT '',
  price NUMERIC NOT NULL DEFAULT 0,
  description TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.catalog_items
  ADD COLUMN IF NOT EXISTS sequence_code TEXT NULL,
  ADD COLUMN IF NOT EXISTS family_id UUID NULL,
  ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS name_en TEXT NOT NULL DEFAULT 'Featured Family Item',
  ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'product',
  ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'toys',
  ADD COLUMN IF NOT EXISTS category_label TEXT NOT NULL DEFAULT 'ألعاب وتنمية',
  ADD COLUMN IF NOT EXISTS country TEXT NOT NULL DEFAULT 'ALL',
  ADD COLUMN IF NOT EXISTS city TEXT NOT NULL DEFAULT 'القاهرة',
  ADD COLUMN IF NOT EXISTS price_egp NUMERIC NOT NULL DEFAULT 450,
  ADD COLUMN IF NOT EXISTS price_sar NUMERIC NOT NULL DEFAULT 95,
  ADD COLUMN IF NOT EXISTS rating TEXT NOT NULL DEFAULT '4.9',
  ADD COLUMN IF NOT EXISTS is_sponsored BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS emoji TEXT NOT NULL DEFAULT '🧸',
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_catalog_items_family_id') THEN
    ALTER TABLE public.catalog_items
      ADD CONSTRAINT fk_catalog_items_family_id
      FOREIGN KEY (family_id) REFERENCES public.families(id) ON DELETE CASCADE NOT VALID;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_catalog_items_family_id
  ON public.catalog_items(family_id)
  WHERE family_id IS NOT NULL;

-- ============================================================================
-- 5. Security-Definer Functions (`SET search_path = public, pg_temp`)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.current_user_family_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT u.family_id
  FROM public.users u
  WHERE u.auth_user_id = auth.uid()
    AND u.family_id IS NOT NULL
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.current_user_family_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_user_family_id() TO authenticated;

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
AS $$
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

  -- Check genuine confirmation status in auth.users (never assume verified merely because RPC was called)
  SELECT COALESCE(au.email_confirmed_at IS NOT NULL OR au.phone_confirmed_at IS NOT NULL, FALSE)
    INTO v_is_identity_verified
  FROM auth.users au
  WHERE au.id = v_auth_uid
  LIMIT 1;

  v_clean_family_name := COALESCE(
    NULLIF(TRIM(p_family_name), ''),
    'أسرة ' || v_clean_name || ' — نكبر'
  );

  PERFORM pg_advisory_xact_lock(hashtext(v_auth_uid::text));

  -- Only match a profile explicitly linked to this authenticated `auth.uid()`
  -- Never claim unlinked/existing records automatically.
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
    family_name,
    country,
    city,
    currency,
    active_parent,
    created_by,
    updated_at
  )
  VALUES (
    v_clean_family_name,
    v_clean_country,
    v_clean_city,
    v_clean_currency,
    v_clean_role,
    v_auth_uid,
    NOW()
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
      auth_user_id,
      family_id,
      full_name,
      role,
      email,
      phone,
      country,
      verified,
      updated_at
    )
    VALUES (
      v_auth_uid,
      v_existing_family_id,
      v_clean_name,
      v_clean_role,
      v_auth_email,
      NULLIF(TRIM(p_phone), ''),
      v_clean_country,
      v_is_identity_verified,
      NOW()
    )
    RETURNING id INTO v_existing_user_id;
  END IF;

  RETURN QUERY SELECT v_existing_user_id, v_existing_family_id, TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.bootstrap_authenticated_family_space(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.bootstrap_authenticated_family_space(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- ============================================================================
-- 6. Strict Least-Privilege Row Level Security (RLS) Policies
-- ============================================================================
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.co_parent_pairings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extended_family ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wellness_diagnostics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bedtime_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_items ENABLE ROW LEVEL SECURITY;

-- 6.1 `public.families`
DROP POLICY IF EXISTS "families_select_own_family" ON public.families;
CREATE POLICY "families_select_own_family"
  ON public.families FOR SELECT
  TO authenticated
  USING (id = public.current_user_family_id());

DROP POLICY IF EXISTS "families_update_own_family" ON public.families;
CREATE POLICY "families_update_own_family"
  ON public.families FOR UPDATE
  TO authenticated
  USING (id = public.current_user_family_id())
  WITH CHECK (id = public.current_user_family_id());

-- 6.2 `public.users`
DROP POLICY IF EXISTS "users_select_own_or_family" ON public.users;
DROP POLICY IF EXISTS "users_select_own_family" ON public.users;
CREATE POLICY "users_select_own_or_family"
  ON public.users FOR SELECT
  TO authenticated
  USING (
    auth_user_id = auth.uid()
    OR (
      auth_user_id IS NOT NULL
      AND family_id IS NOT NULL
      AND family_id = public.current_user_family_id()
    )
  );

DROP POLICY IF EXISTS "users_update_self_only" ON public.users;
DROP POLICY IF EXISTS "users_update_own_family" ON public.users;
CREATE POLICY "users_update_self_only"
  ON public.users FOR UPDATE
  TO authenticated
  USING (
    auth_user_id = auth.uid()
    AND family_id IS NOT NULL
    AND family_id = public.current_user_family_id()
  )
  WITH CHECK (
    auth_user_id = auth.uid()
    AND family_id IS NOT NULL
    AND family_id = public.current_user_family_id()
  );

-- 6.3 `public.children`
DROP POLICY IF EXISTS "children_select_own_family" ON public.children;
CREATE POLICY "children_select_own_family"
  ON public.children FOR SELECT
  TO authenticated
  USING (family_id = public.current_user_family_id());

DROP POLICY IF EXISTS "children_insert_own_family" ON public.children;
CREATE POLICY "children_insert_own_family"
  ON public.children FOR INSERT
  TO authenticated
  WITH CHECK (family_id = public.current_user_family_id());

DROP POLICY IF EXISTS "children_update_own_family" ON public.children;
CREATE POLICY "children_update_own_family"
  ON public.children FOR UPDATE
  TO authenticated
  USING (family_id = public.current_user_family_id())
  WITH CHECK (family_id = public.current_user_family_id());

DROP POLICY IF EXISTS "children_delete_own_family" ON public.children;
CREATE POLICY "children_delete_own_family"
  ON public.children FOR DELETE
  TO authenticated
  USING (family_id = public.current_user_family_id());

-- 6.4 `public.co_parent_pairings`
DROP POLICY IF EXISTS "co_parent_pairings_all_own_family" ON public.co_parent_pairings;
CREATE POLICY "co_parent_pairings_all_own_family"
  ON public.co_parent_pairings FOR ALL
  TO authenticated
  USING (family_id = public.current_user_family_id())
  WITH CHECK (family_id = public.current_user_family_id());

-- 6.5 `public.extended_family`
DROP POLICY IF EXISTS "extended_family_all_own_family" ON public.extended_family;
CREATE POLICY "extended_family_all_own_family"
  ON public.extended_family FOR ALL
  TO authenticated
  USING (family_id = public.current_user_family_id())
  WITH CHECK (family_id = public.current_user_family_id());

-- 6.6 `public.wellness_diagnostics`
DROP POLICY IF EXISTS "wellness_diagnostics_all_own_family" ON public.wellness_diagnostics;
CREATE POLICY "wellness_diagnostics_all_own_family"
  ON public.wellness_diagnostics FOR ALL
  TO authenticated
  USING (family_id = public.current_user_family_id())
  WITH CHECK (family_id = public.current_user_family_id());

-- 6.7 `public.bedtime_stories`
DROP POLICY IF EXISTS "bedtime_stories_all_own_family" ON public.bedtime_stories;
CREATE POLICY "bedtime_stories_all_own_family"
  ON public.bedtime_stories FOR ALL
  TO authenticated
  USING (family_id = public.current_user_family_id())
  WITH CHECK (family_id = public.current_user_family_id());

-- 6.8 `public.catalog_items`
DROP POLICY IF EXISTS "catalog_items_select_policy" ON public.catalog_items;
CREATE POLICY "catalog_items_select_policy"
  ON public.catalog_items FOR SELECT
  TO anon, authenticated
  USING (family_id IS NULL OR family_id = public.current_user_family_id());

DROP POLICY IF EXISTS "catalog_items_write_own_family" ON public.catalog_items;
CREATE POLICY "catalog_items_write_own_family"
  ON public.catalog_items FOR ALL
  TO authenticated
  USING (family_id IS NOT NULL AND family_id = public.current_user_family_id())
  WITH CHECK (family_id IS NOT NULL AND family_id = public.current_user_family_id());

COMMIT;

-- ============================================================================
-- 7. NON-DESTRUCTIVE ROLLBACK STRATEGY (Reference Only — Do Not Auto-Run)
-- Preserves all data rows in `families`, `users`, `children`, `extended_family`,
-- and `catalog_items` while reverting only the policies, RPCs, and constraints
-- introduced by this migration if ever required:
-- ============================================================================
/*
BEGIN;
  DROP POLICY IF EXISTS "families_select_own_family" ON public.families;
  DROP POLICY IF EXISTS "families_update_own_family" ON public.families;
  DROP POLICY IF EXISTS "users_select_own_or_family" ON public.users;
  DROP POLICY IF EXISTS "users_update_self_only" ON public.users;
  DROP POLICY IF EXISTS "children_select_own_family" ON public.children;
  DROP POLICY IF EXISTS "children_insert_own_family" ON public.children;
  DROP POLICY IF EXISTS "children_update_own_family" ON public.children;
  DROP POLICY IF EXISTS "children_delete_own_family" ON public.children;
  DROP POLICY IF EXISTS "co_parent_pairings_all_own_family" ON public.co_parent_pairings;
  DROP POLICY IF EXISTS "extended_family_all_own_family" ON public.extended_family;
  DROP POLICY IF EXISTS "wellness_diagnostics_all_own_family" ON public.wellness_diagnostics;
  DROP POLICY IF EXISTS "bedtime_stories_all_own_family" ON public.bedtime_stories;
  DROP POLICY IF EXISTS "catalog_items_select_policy" ON public.catalog_items;
  DROP POLICY IF EXISTS "catalog_items_write_own_family" ON public.catalog_items;

  DROP FUNCTION IF EXISTS public.bootstrap_authenticated_family_space(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);
  DROP FUNCTION IF EXISTS public.current_user_family_id();

  ALTER TABLE public.families DROP CONSTRAINT IF EXISTS fk_families_created_by;
  ALTER TABLE public.users DROP CONSTRAINT IF EXISTS fk_users_auth_user_id;
  ALTER TABLE public.users DROP CONSTRAINT IF EXISTS fk_users_family_id;
  ALTER TABLE public.children DROP CONSTRAINT IF EXISTS fk_children_family_id;
  ALTER TABLE public.extended_family DROP CONSTRAINT IF EXISTS fk_extended_family_family_id;
  ALTER TABLE public.catalog_items DROP CONSTRAINT IF EXISTS fk_catalog_items_family_id;
COMMIT;
*/

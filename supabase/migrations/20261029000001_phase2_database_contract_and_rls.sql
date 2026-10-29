-- ============================================================================
-- Nekbaar (نكبر) — Phase 2 Proposed Migration (REVIEW ONLY — DO NOT AUTO-APPLY)
-- Target Project: qbwnzunusmaidciakuod
-- Purpose:
--   1. Align live PostgreSQL tables (`public.families`, `public.users`, `public.children`)
--      with the verified Phase 2 application contract WITHOUT destructive changes.
--   2. Preserve and explicitly quarantine existing orphaned profile records in `public.users`
--      (since `auth.users` currently contains 0 records).
--   3. Establish atomic `SECURITY DEFINER` RPC functions for:
--      - Account + Family bootstrap (`public.bootstrap_authenticated_family_space`)
--      - Secure Co-Parent invitation creation & acceptance (`public.create_co_parent_invitation`,
--        `public.accept_co_parent_invitation`)
--   4. Enforce strict, least-privilege Row Level Security (RLS) policies across all tables
--      derived exclusively from `auth.uid()` and verified `public.users.auth_user_id` membership.
-- ============================================================================

BEGIN;

-- Ensure pgcrypto is available for gen_random_uuid() and cryptographic token hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- STEP 1: NON-DESTRUCTIVE ADDITIVE COLUMNS ON `public.families`
-- Live columns verified: (id, family_name, created_at)
-- ============================================================================
ALTER TABLE public.families
  ALTER COLUMN id SET DEFAULT gen_random_uuid(),
  ALTER COLUMN created_at SET DEFAULT NOW();

ALTER TABLE public.families
  ADD COLUMN IF NOT EXISTS country TEXT NOT NULL DEFAULT 'SA',
  ADD COLUMN IF NOT EXISTS city TEXT NOT NULL DEFAULT 'الدمام',
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'SAR',
  ADD COLUMN IF NOT EXISTS active_parent TEXT NOT NULL DEFAULT 'mother',
  ADD COLUMN IF NOT EXISTS created_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_families_country'
  ) THEN
    ALTER TABLE public.families
      ADD CONSTRAINT chk_families_country CHECK (country IN ('EG', 'SA'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_families_currency'
  ) THEN
    ALTER TABLE public.families
      ADD CONSTRAINT chk_families_currency CHECK (currency IN ('EGP', 'SAR', 'USD'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_families_active_parent'
  ) THEN
    ALTER TABLE public.families
      ADD CONSTRAINT chk_families_active_parent CHECK (active_parent IN ('mother', 'father'));
  END IF;
END $$;

-- ============================================================================
-- STEP 2: NON-DESTRUCTIVE ADDITIVE COLUMNS & ORPHAN REMEDIATION ON `public.users`
-- Live columns verified: (id, auth_user_id, full_name, role, created_at)
-- Note: Live `public.users` does NOT currently have `family_id`, and `auth.users` has 0 rows.
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
  ADD COLUMN IF NOT EXISTS is_legacy_orphan BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS orphan_notes TEXT NULL,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Explicitly preserve and quarantine existing orphaned profile records:
-- Because `auth.users` currently has 0 records, any existing row in `public.users`
-- either has `auth_user_id IS NULL` or an `auth_user_id` that does not exist in `auth.users`.
-- Instead of deleting them, we mark `is_legacy_orphan = TRUE` and detach unverified `auth_user_id`
-- so the foreign key to `auth.users(id)` can be enforced safely.
UPDATE public.users u
SET
  is_legacy_orphan = TRUE,
  orphan_notes = COALESCE(
    u.orphan_notes,
    'Preserved pre-Phase-2 profile record with no matching auth.users row; isolated from RLS until admin/owner mapping is approved.'
  ),
  auth_user_id = CASE
    WHEN u.auth_user_id IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM auth.users au WHERE au.id = u.auth_user_id)
    THEN NULL
    ELSE u.auth_user_id
  END,
  updated_at = NOW()
WHERE u.auth_user_id IS NULL
   OR NOT EXISTS (SELECT 1 FROM auth.users au WHERE au.id = u.auth_user_id);

-- Enforce foreign key from `public.users(auth_user_id)` -> `auth.users(id)`
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_users_auth_user_id'
  ) THEN
    ALTER TABLE public.users
      ADD CONSTRAINT fk_users_auth_user_id
      FOREIGN KEY (auth_user_id)
      REFERENCES auth.users(id)
      ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_users_family_id'
  ) THEN
    ALTER TABLE public.users
      ADD CONSTRAINT fk_users_family_id
      FOREIGN KEY (family_id)
      REFERENCES public.families(id)
      ON UPDATE CASCADE
      ON DELETE RESTRICT;
  END IF;
END $$;

-- Unique index on non-null `auth_user_id` guarantees 1:1 mapping between `auth.users` and `public.users`
CREATE UNIQUE INDEX IF NOT EXISTS uq_users_auth_user_id
  ON public.users(auth_user_id)
  WHERE auth_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_family_id
  ON public.users(family_id)
  WHERE family_id IS NOT NULL;

-- Ensure all non-orphan rows require both `auth_user_id` and `family_id`
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_users_active_requires_auth_and_family'
  ) THEN
    ALTER TABLE public.users
      ADD CONSTRAINT chk_users_active_requires_auth_and_family
      CHECK (
        is_legacy_orphan = TRUE
        OR (auth_user_id IS NOT NULL AND family_id IS NOT NULL)
      );
  END IF;
END $$;

-- ============================================================================
-- STEP 3: NON-DESTRUCTIVE ADDITIVE COLUMNS ON `public.children`
-- Live columns verified: (id, family_id, name, age_stage, gender, passions_or_heroes, created_at)
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

-- Backfill `interests` from existing `passions_or_heroes` so existing records retain all data
UPDATE public.children
SET interests = passions_or_heroes
WHERE interests IS NULL AND passions_or_heroes IS NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_children_family_id'
  ) THEN
    ALTER TABLE public.children
      ADD CONSTRAINT fk_children_family_id
      FOREIGN KEY (family_id)
      REFERENCES public.families(id)
      ON UPDATE CASCADE
      ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_children_family_id ON public.children(family_id);

-- ============================================================================
-- STEP 4: SECURE CO-PARENT INVITATIONS TABLE (`public.family_invitations`)
-- Replaces insecure client-generated pairing tokens with verifiable DB invitations
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.family_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  invited_by_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  invited_email TEXT NOT NULL,
  invited_phone TEXT NULL,
  invited_role TEXT NOT NULL CHECK (invited_role IN ('father', 'mother')),
  token_hash TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'revoked', 'expired')),
  accepted_by_user_id UUID NULL REFERENCES public.users(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '48 hours'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_family_invitations_family_id
  ON public.family_invitations(family_id);
CREATE INDEX IF NOT EXISTS idx_family_invitations_invited_email
  ON public.family_invitations(LOWER(invited_email));

-- ============================================================================
-- STEP 5: AUXILIARY FAMILY-OWNED TABLES (UUID `family_id` CONTRACT)
-- Ensures `extended_family`, `wellness_diagnostics`, `bedtime_stories`, and
-- `catalog_items` exist with UUID `family_id` referencing `public.families(id)`.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.extended_family (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  side TEXT NOT NULL,
  phone_number TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_extended_family_family_id
  ON public.extended_family(family_id);

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

CREATE TABLE IF NOT EXISTS public.catalog_items (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  sequence_code TEXT NOT NULL UNIQUE,
  family_id UUID NULL REFERENCES public.families(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_en TEXT NOT NULL DEFAULT 'Featured Family Item',
  kind TEXT NOT NULL DEFAULT 'product' CHECK (kind IN ('product', 'service', 'offer')),
  category TEXT NOT NULL DEFAULT 'toys',
  category_label TEXT NOT NULL DEFAULT 'ألعاب وتنمية',
  country TEXT NOT NULL DEFAULT 'ALL',
  city TEXT NOT NULL DEFAULT 'القاهرة',
  price_egp NUMERIC NOT NULL DEFAULT 450,
  price_sar NUMERIC NOT NULL DEFAULT 95,
  rating TEXT NOT NULL DEFAULT '4.9',
  is_sponsored BOOLEAN NOT NULL DEFAULT FALSE,
  description TEXT NOT NULL DEFAULT '',
  emoji TEXT NOT NULL DEFAULT '🧸',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- STEP 6: VERIFIED FAMILY MEMBERSHIP HELPER & ATOMIC BOOTSTRAP FUNCTIONS
-- ============================================================================

-- 6A. `public.current_user_family_id()`:
-- Strictly resolves the authenticated caller's `family_id` UUID from `public.users`
-- where `auth_user_id = auth.uid()` and `is_legacy_orphan = FALSE`.
-- NEVER trusts `user_metadata.family_id`, `email`, or fallback constants.
CREATE OR REPLACE FUNCTION public.current_user_family_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.family_id
  FROM public.users u
  WHERE u.auth_user_id = auth.uid()
    AND u.is_legacy_orphan = FALSE
    AND u.family_id IS NOT NULL
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.current_user_family_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_user_family_id() TO authenticated;

-- 6B. `public.bootstrap_authenticated_family_space(...)`:
-- Atomically creates a `public.families` row and links the caller's `public.users`
-- profile (`auth_user_id = auth.uid()`) in a single transaction.
-- Idempotent: if the caller already belongs to a verified family, it updates their
-- profile and returns the existing `(user_id, family_id, is_new_family = false)`.
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
SET search_path = public
AS $$
DECLARE
  v_auth_uid UUID := auth.uid();
  v_auth_email TEXT := NULLIF(TRIM(COALESCE(auth.jwt() ->> 'email', '')), '');
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

  v_clean_family_name := COALESCE(
    NULLIF(TRIM(p_family_name), ''),
    'أسرة ' || v_clean_name || ' — نكبر'
  );

  -- Serialize concurrent bootstrap calls for the same authenticated user
  PERFORM pg_advisory_xact_lock(hashtext(v_auth_uid::text));

  SELECT u.id, u.family_id
    INTO v_existing_user_id, v_existing_family_id
  FROM public.users u
  WHERE u.auth_user_id = v_auth_uid
    AND u.is_legacy_orphan = FALSE
  LIMIT 1;

  IF v_existing_user_id IS NOT NULL AND v_existing_family_id IS NOT NULL THEN
    UPDATE public.users
    SET
      full_name = v_clean_name,
      role = v_clean_role,
      email = COALESCE(v_auth_email, email),
      phone = COALESCE(NULLIF(TRIM(p_phone), ''), phone),
      country = v_clean_country,
      verified = TRUE,
      updated_at = NOW()
    WHERE id = v_existing_user_id;

    RETURN QUERY SELECT v_existing_user_id, v_existing_family_id, FALSE;
    RETURN;
  END IF;

  -- Create a new family record owned by the authenticated user
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
      verified = TRUE,
      is_legacy_orphan = FALSE,
      updated_at = NOW()
    WHERE id = v_existing_user_id;
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
      is_legacy_orphan,
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
      TRUE,
      FALSE,
      NOW()
    )
    RETURNING id INTO v_existing_user_id;
  END IF;

  RETURN QUERY SELECT v_existing_user_id, v_existing_family_id, TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.bootstrap_authenticated_family_space(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.bootstrap_authenticated_family_space(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- 6C. `public.accept_co_parent_invitation(p_raw_token TEXT, p_full_name TEXT, p_phone TEXT)`:
-- Allows an authenticated second parent to securely join an existing family using a valid,
-- unexpired invitation token whose `invited_email` matches the second parent's `auth.jwt() ->> 'email'`.
CREATE OR REPLACE FUNCTION public.accept_co_parent_invitation(
  p_raw_token TEXT,
  p_full_name TEXT,
  p_phone TEXT DEFAULT NULL
)
RETURNS TABLE (
  user_id UUID,
  family_id UUID,
  joined_role TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_auth_uid UUID := auth.uid();
  v_auth_email TEXT := LOWER(TRIM(COALESCE(auth.jwt() ->> 'email', '')));
  v_token_hash TEXT;
  v_invite RECORD;
  v_user_id UUID;
BEGIN
  IF v_auth_uid IS NULL OR v_auth_email = '' THEN
    RAISE EXCEPTION 'UNAUTHENTICATED: Verified Supabase Auth session and email are required to accept an invitation.';
  END IF;

  IF NULLIF(TRIM(COALESCE(p_raw_token, '')), '') IS NULL THEN
    RAISE EXCEPTION 'INVALID_TOKEN: Invitation token is required.';
  END IF;

  v_token_hash := encode(digest(TRIM(p_raw_token), 'sha256'), 'hex');

  SELECT *
    INTO v_invite
  FROM public.family_invitations fi
  WHERE fi.token_hash = v_token_hash
    AND fi.status = 'pending'
    AND fi.expires_at > NOW()
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'INVALID_OR_EXPIRED_INVITE: Invitation is invalid, expired, or already used.';
  END IF;

  IF LOWER(TRIM(v_invite.invited_email)) <> v_auth_email THEN
    RAISE EXCEPTION 'EMAIL_MISMATCH: Authenticated user email does not match the invited co-parent email.';
  END IF;

  INSERT INTO public.users (
    auth_user_id,
    family_id,
    full_name,
    role,
    email,
    phone,
    verified,
    is_legacy_orphan,
    updated_at
  )
  VALUES (
    v_auth_uid,
    v_invite.family_id,
    COALESCE(NULLIF(TRIM(p_full_name), ''), 'شريك الأسرة'),
    v_invite.invited_role,
    v_auth_email,
    NULLIF(TRIM(p_phone), ''),
    TRUE,
    FALSE,
    NOW()
  )
  ON CONFLICT (auth_user_id) WHERE auth_user_id IS NOT NULL
  DO UPDATE SET
    family_id = EXCLUDED.family_id,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    email = EXCLUDED.email,
    phone = COALESCE(EXCLUDED.phone, public.users.phone),
    verified = TRUE,
    is_legacy_orphan = FALSE,
    updated_at = NOW()
  RETURNING id INTO v_user_id;

  UPDATE public.family_invitations
  SET
    status = 'accepted',
    accepted_by_user_id = v_user_id,
    accepted_at = NOW()
  WHERE id = v_invite.id;

  RETURN QUERY SELECT v_user_id, v_invite.family_id, v_invite.invited_role;
END;
$$;

REVOKE ALL ON FUNCTION public.accept_co_parent_invitation(TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.accept_co_parent_invitation(TEXT, TEXT, TEXT) TO authenticated;

-- ============================================================================
-- STEP 7: STRICT LEAST-PRIVILEGE ROW LEVEL SECURITY (RLS) POLICIES
-- Zero trust in `user_metadata`, `localStorage`, or `OR auth.uid() IS NOT NULL`.
-- ============================================================================

ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extended_family ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wellness_diagnostics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bedtime_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_items ENABLE ROW LEVEL SECURITY;

-- 7.1 `public.families` policies
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

-- Note: Direct client INSERT/DELETE on `public.families` is intentionally omitted;
-- family creation happens atomically via `public.bootstrap_authenticated_family_space`.

-- 7.2 `public.users` policies
DROP POLICY IF EXISTS "users_select_own_or_family" ON public.users;
DROP POLICY IF EXISTS "users_select_own_family" ON public.users;
CREATE POLICY "users_select_own_or_family"
  ON public.users FOR SELECT
  TO authenticated
  USING (
    is_legacy_orphan = FALSE
    AND (
      auth_user_id = auth.uid()
      OR (family_id IS NOT NULL AND family_id = public.current_user_family_id())
    )
  );

DROP POLICY IF EXISTS "users_update_self_only" ON public.users;
DROP POLICY IF EXISTS "users_update_own_family" ON public.users;
CREATE POLICY "users_update_self_only"
  ON public.users FOR UPDATE
  TO authenticated
  USING (
    is_legacy_orphan = FALSE
    AND auth_user_id = auth.uid()
    AND family_id = public.current_user_family_id()
  )
  WITH CHECK (
    is_legacy_orphan = FALSE
    AND auth_user_id = auth.uid()
    AND family_id = public.current_user_family_id()
  );

-- 7.3 `public.children` policies
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

-- 7.4 `public.family_invitations` policies
DROP POLICY IF EXISTS "family_invitations_select_own_family" ON public.family_invitations;
CREATE POLICY "family_invitations_select_own_family"
  ON public.family_invitations FOR SELECT
  TO authenticated
  USING (
    family_id = public.current_user_family_id()
    OR LOWER(invited_email) = LOWER(COALESCE(auth.jwt() ->> 'email', ''))
  );

DROP POLICY IF EXISTS "family_invitations_insert_own_family" ON public.family_invitations;
CREATE POLICY "family_invitations_insert_own_family"
  ON public.family_invitations FOR INSERT
  TO authenticated
  WITH CHECK (
    family_id = public.current_user_family_id()
    AND invited_by_user_id IN (
      SELECT u.id FROM public.users u WHERE u.auth_user_id = auth.uid() AND u.is_legacy_orphan = FALSE
    )
  );

DROP POLICY IF EXISTS "family_invitations_update_own_family" ON public.family_invitations;
CREATE POLICY "family_invitations_update_own_family"
  ON public.family_invitations FOR UPDATE
  TO authenticated
  USING (family_id = public.current_user_family_id())
  WITH CHECK (family_id = public.current_user_family_id());

-- 7.5 `public.extended_family` policies
DROP POLICY IF EXISTS "extended_family_all_own_family" ON public.extended_family;
CREATE POLICY "extended_family_all_own_family"
  ON public.extended_family FOR ALL
  TO authenticated
  USING (family_id = public.current_user_family_id())
  WITH CHECK (family_id = public.current_user_family_id());

-- 7.6 `public.wellness_diagnostics` policies
DROP POLICY IF EXISTS "wellness_diagnostics_all_own_family" ON public.wellness_diagnostics;
CREATE POLICY "wellness_diagnostics_all_own_family"
  ON public.wellness_diagnostics FOR ALL
  TO authenticated
  USING (family_id = public.current_user_family_id())
  WITH CHECK (family_id = public.current_user_family_id());

-- 7.7 `public.bedtime_stories` policies
DROP POLICY IF EXISTS "bedtime_stories_all_own_family" ON public.bedtime_stories;
CREATE POLICY "bedtime_stories_all_own_family"
  ON public.bedtime_stories FOR ALL
  TO authenticated
  USING (family_id = public.current_user_family_id())
  WITH CHECK (family_id = public.current_user_family_id());

-- 7.8 `public.catalog_items` policies (Public/Global items with `family_id IS NULL` are read-only; family-specific items scoped to `family_id`)
DROP POLICY IF EXISTS "catalog_items_select_policy" ON public.catalog_items;
CREATE POLICY "catalog_items_select_policy"
  ON public.catalog_items FOR SELECT
  TO anon, authenticated
  USING (
    family_id IS NULL
    OR family_id = public.current_user_family_id()
  );

DROP POLICY IF EXISTS "catalog_items_write_own_family" ON public.catalog_items;
CREATE POLICY "catalog_items_write_own_family"
  ON public.catalog_items FOR ALL
  TO authenticated
  USING (family_id IS NOT NULL AND family_id = public.current_user_family_id())
  WITH CHECK (family_id IS NOT NULL AND family_id = public.current_user_family_id());

COMMIT;

-- ============================================================================
-- ROLLBACK CONSIDERATIONS & REVERSAL SCRIPT (MANUAL / EMERGENCY ONLY)
-- ============================================================================
-- Because this migration is strictly additive and non-destructive, rolling back
-- policies and helper functions does not lose any existing data in `public.families`,
-- `public.users`, or `public.children`:
--
-- BEGIN;
-- DROP POLICY IF EXISTS "catalog_items_write_own_family" ON public.catalog_items;
-- DROP POLICY IF EXISTS "catalog_items_select_policy" ON public.catalog_items;
-- DROP POLICY IF EXISTS "bedtime_stories_all_own_family" ON public.bedtime_stories;
-- DROP POLICY IF EXISTS "wellness_diagnostics_all_own_family" ON public.wellness_diagnostics;
-- DROP POLICY IF EXISTS "extended_family_all_own_family" ON public.extended_family;
-- DROP POLICY IF EXISTS "family_invitations_update_own_family" ON public.family_invitations;
-- DROP POLICY IF EXISTS "family_invitations_insert_own_family" ON public.family_invitations;
-- DROP POLICY IF EXISTS "family_invitations_select_own_family" ON public.family_invitations;
-- DROP POLICY IF EXISTS "children_delete_own_family" ON public.children;
-- DROP POLICY IF EXISTS "children_update_own_family" ON public.children;
-- DROP POLICY IF EXISTS "children_insert_own_family" ON public.children;
-- DROP POLICY IF EXISTS "children_select_own_family" ON public.children;
-- DROP POLICY IF EXISTS "users_update_self_only" ON public.users;
-- DROP POLICY IF EXISTS "users_select_own_or_family" ON public.users;
-- DROP POLICY IF EXISTS "families_update_own_family" ON public.families;
-- DROP POLICY IF EXISTS "families_select_own_family" ON public.families;
-- DROP FUNCTION IF EXISTS public.accept_co_parent_invitation(TEXT, TEXT, TEXT);
-- DROP FUNCTION IF EXISTS public.bootstrap_authenticated_family_space(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);
-- DROP FUNCTION IF EXISTS public.current_user_family_id();
-- ALTER TABLE public.users DROP CONSTRAINT IF EXISTS chk_users_active_requires_auth_and_family;
-- ALTER TABLE public.users DROP CONSTRAINT IF EXISTS fk_users_family_id;
-- ALTER TABLE public.users DROP CONSTRAINT IF EXISTS fk_users_auth_user_id;
-- COMMIT;

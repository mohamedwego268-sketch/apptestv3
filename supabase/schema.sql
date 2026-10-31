-- ============================================================================
-- نكبر (Nekbaar) — Canonical Supabase / PostgreSQL Database Schema & RLS
-- Architecture: UUID-keyed multi-tenant family isolation (`private.current_user_family_id()`)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 1. Core Family & User Identity Tables
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_name TEXT NOT NULL DEFAULT 'أسرة نكبر',
  country TEXT NOT NULL DEFAULT 'EG',
  city TEXT NOT NULL DEFAULT 'القاهرة',
  currency TEXT NOT NULL DEFAULT 'EGP',
  active_parent TEXT NOT NULL DEFAULT 'father',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  family_id UUID REFERENCES public.families(id) ON DELETE RESTRICT,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('father', 'mother', 'dad', 'mom')),
  email TEXT,
  phone TEXT,
  country TEXT NOT NULL DEFAULT 'EG',
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  is_legacy_orphan BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_auth_user_id_unique
  ON public.users (auth_user_id)
  WHERE auth_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_family_id
  ON public.users (family_id);

-- ----------------------------------------------------------------------------
-- 2. Children & Child Life Records
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  age_stage TEXT NOT NULL DEFAULT 'EARLY_CHILDHOOD',
  birth TEXT DEFAULT '',
  gender TEXT NOT NULL DEFAULT 'boy' CHECK (gender IN ('boy', 'girl')),
  passions_or_heroes TEXT NOT NULL DEFAULT '',
  interests TEXT NOT NULL DEFAULT '',
  emoji TEXT NOT NULL DEFAULT '👦🏻',
  avatar_theme TEXT NOT NULL DEFAULT 'astronaut',
  current_home_id UUID,
  profile_details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT children_id_family_id_unique UNIQUE (id, family_id)
);

CREATE INDEX IF NOT EXISTS idx_children_family_id
  ON public.children (family_id);

CREATE TABLE IF NOT EXISTS public.child_life_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  child_id UUID NOT NULL,
  domain TEXT NOT NULL CHECK (
    domain IN ('overview', 'health', 'education', 'character', 'memories', 'aspirations', 'rights')
  ),
  record_type TEXT NOT NULL,
  title TEXT NOT NULL CHECK (char_length(btrim(title)) BETWEEN 1 AND 240),
  summary TEXT NOT NULL DEFAULT '',
  occurred_on DATE,
  visibility TEXT NOT NULL DEFAULT 'family' CHECK (visibility IN ('family', 'parents_only', 'future_gift')),
  unlock_on DATE,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(payload) = 'object'),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT child_life_records_child_family_fk
    FOREIGN KEY (child_id, family_id)
    REFERENCES public.children (id, family_id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_child_life_records_family_child_domain
  ON public.child_life_records (family_id, child_id, domain, occurred_on DESC NULLS LAST, created_at DESC);

-- ----------------------------------------------------------------------------
-- 3. Extended Family, Co-Parent Pairings, Homes, Locations & Workspace State
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.extended_family (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  relation_type TEXT NOT NULL,
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  permission_scope TEXT NOT NULL DEFAULT 'viewer',
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_extended_family_family_id
  ON public.extended_family (family_id);

CREATE TABLE IF NOT EXISTS public.co_parent_pairings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  inviter_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  partner_role TEXT NOT NULL CHECK (partner_role IN ('father', 'mother')),
  partner_name TEXT NOT NULL,
  partner_phone TEXT NOT NULL,
  partner_email TEXT,
  country TEXT NOT NULL DEFAULT 'EG',
  verification_method TEXT NOT NULL CHECK (verification_method IN ('phone_otp', 'magic_link', 'invite_code')),
  invite_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending_verification' CHECK (status IN ('pending_verification', 'verified', 'revoked')),
  accepted_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  accepted_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_co_parent_pairings_family_id
  ON public.co_parent_pairings (family_id);

CREATE TABLE IF NOT EXISTS public.family_homes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(btrim(name)) BETWEEN 2 AND 80),
  home_kind TEXT NOT NULL DEFAULT 'family' CHECK (home_kind IN ('family', 'father', 'mother', 'extended', 'school', 'other')),
  owner_parent_role TEXT CHECK (owner_parent_role IS NULL OR owner_parent_role IN ('father', 'mother')),
  city TEXT NOT NULL DEFAULT '',
  address_line TEXT NOT NULL DEFAULT '',
  latitude DOUBLE PRECISION CHECK (latitude IS NULL OR (latitude >= -90 AND latitude <= 90)),
  longitude DOUBLE PRECISION CHECK (longitude IS NULL OR (longitude >= -180 AND longitude <= 180)),
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT family_homes_id_family_unique UNIQUE (id, family_id)
);

CREATE TABLE IF NOT EXISTS public.child_home_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  child_id UUID NOT NULL,
  home_id UUID NOT NULL,
  schedule_kind TEXT NOT NULL DEFAULT 'weekly' CHECK (schedule_kind IN ('weekly', 'date_range')),
  weekday SMALLINT CHECK (weekday IS NULL OR (weekday >= 0 AND weekday <= 6)),
  start_time TIME,
  end_time TIME,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  timezone TEXT NOT NULL DEFAULT 'Africa/Cairo',
  notes TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT child_home_schedules_child_family_fk
    FOREIGN KEY (child_id, family_id) REFERENCES public.children (id, family_id) ON DELETE CASCADE,
  CONSTRAINT child_home_schedules_home_family_fk
    FOREIGN KEY (home_id, family_id) REFERENCES public.family_homes (id, family_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.parent_locations (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  parent_role TEXT NOT NULL CHECK (parent_role IN ('father', 'mother')),
  sharing_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  latitude DOUBLE PRECISION CHECK (latitude IS NULL OR (latitude >= -90 AND latitude <= 90)),
  longitude DOUBLE PRECISION CHECK (longitude IS NULL OR (longitude >= -180 AND longitude <= 180)),
  accuracy_meters DOUBLE PRECISION CHECK (accuracy_meters IS NULL OR accuracy_meters >= 0),
  location_label TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.family_shared_state (
  family_id UUID PRIMARY KEY REFERENCES public.families(id) ON DELETE CASCADE,
  shared_payload JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(shared_payload) = 'object'),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.parent_private_state (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  parent_role TEXT NOT NULL CHECK (parent_role IN ('father', 'mother')),
  private_payload JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(private_payload) = 'object'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 4. Diagnostics, Stories & Public Catalog Tables
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.wellness_diagnostics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  child_id UUID,
  overall_score INTEGER NOT NULL DEFAULT 80,
  physical_energy INTEGER NOT NULL DEFAULT 80,
  emotional_balance INTEGER NOT NULL DEFAULT 80,
  social_connection INTEGER NOT NULL DEFAULT 80,
  cognitive_focus INTEGER NOT NULL DEFAULT 80,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT wellness_diagnostics_child_family_fk
    FOREIGN KEY (child_id, family_id) REFERENCES public.children (id, family_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.bedtime_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_code TEXT UNIQUE NOT NULL,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  child_id UUID,
  child_name TEXT NOT NULL,
  age_stage TEXT NOT NULL DEFAULT 'EARLY_CHILDHOOD',
  title_ar TEXT NOT NULL,
  title_en TEXT NOT NULL,
  story_body_ar TEXT NOT NULL,
  story_body_en TEXT NOT NULL,
  moral_tag_ar TEXT NOT NULL DEFAULT '',
  moral_tag_en TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT bedtime_stories_child_family_fk
    FOREIGN KEY (child_id, family_id) REFERENCES public.children (id, family_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.catalog_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  description TEXT DEFAULT '',
  category TEXT DEFAULT 'general',
  currency TEXT DEFAULT 'EGP',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 5. Security Helper Functions & Immutable Ownership Triggers
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.current_user_family_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT u.family_id
  FROM public.users AS u
  WHERE u.auth_user_id = (SELECT auth.uid())
    AND u.family_id IS NOT NULL
    AND COALESCE(u.is_legacy_orphan, false) = false
  ORDER BY u.created_at ASC
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION private.current_user_family_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.current_user_family_id() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.prevent_ownership_column_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_TABLE_NAME = 'families' THEN
    IF NEW.id IS DISTINCT FROM OLD.id THEN
      RAISE EXCEPTION 'IMMUTABLE_OWNERSHIP_VIOLATION: families.id cannot be changed'
        USING ERRCODE = '42501';
    END IF;
    IF OLD.created_by IS NOT NULL AND NEW.created_by IS DISTINCT FROM OLD.created_by THEN
      RAISE EXCEPTION 'IMMUTABLE_OWNERSHIP_VIOLATION: families.created_by cannot be reassigned'
        USING ERRCODE = '42501';
    END IF;
  ELSIF TG_TABLE_NAME = 'users' THEN
    IF NEW.id IS DISTINCT FROM OLD.id THEN
      RAISE EXCEPTION 'IMMUTABLE_OWNERSHIP_VIOLATION: users.id cannot be changed'
        USING ERRCODE = '42501';
    END IF;
    IF OLD.auth_user_id IS NOT NULL AND NEW.auth_user_id IS DISTINCT FROM OLD.auth_user_id THEN
      RAISE EXCEPTION 'IMMUTABLE_OWNERSHIP_VIOLATION: users.auth_user_id cannot be reassigned'
        USING ERRCODE = '42501';
    END IF;
    IF OLD.family_id IS NOT NULL AND NEW.family_id IS DISTINCT FROM OLD.family_id THEN
      RAISE EXCEPTION 'IMMUTABLE_OWNERSHIP_VIOLATION: users.family_id cannot be reassigned once linked'
        USING ERRCODE = '42501';
    END IF;
  ELSIF TG_TABLE_NAME = 'children' THEN
    IF NEW.id IS DISTINCT FROM OLD.id THEN
      RAISE EXCEPTION 'IMMUTABLE_OWNERSHIP_VIOLATION: children.id cannot be changed'
        USING ERRCODE = '42501';
    END IF;
    IF NEW.family_id IS DISTINCT FROM OLD.family_id THEN
      RAISE EXCEPTION 'IMMUTABLE_OWNERSHIP_VIOLATION: children.family_id cannot be reassigned'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.prevent_ownership_column_mutation() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_families_immutable_ownership ON public.families;
CREATE TRIGGER trg_families_immutable_ownership
  BEFORE UPDATE ON public.families
  FOR EACH ROW
  EXECUTE FUNCTION private.prevent_ownership_column_mutation();

DROP TRIGGER IF EXISTS trg_users_immutable_ownership ON public.users;
CREATE TRIGGER trg_users_immutable_ownership
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION private.prevent_ownership_column_mutation();

DROP TRIGGER IF EXISTS trg_children_immutable_ownership ON public.children;
CREATE TRIGGER trg_children_immutable_ownership
  BEFORE UPDATE ON public.children
  FOR EACH ROW
  EXECUTE FUNCTION private.prevent_ownership_column_mutation();

-- ----------------------------------------------------------------------------
-- 6. Row Level Security (RLS) Enforcement Across All Exposed Tables
-- ----------------------------------------------------------------------------
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.child_life_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extended_family ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.co_parent_pairings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_homes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.child_home_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_shared_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_private_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wellness_diagnostics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bedtime_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_items ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.families FROM anon;
REVOKE ALL ON public.users FROM anon;
REVOKE ALL ON public.children FROM anon;
REVOKE ALL ON public.child_life_records FROM anon;
REVOKE ALL ON public.extended_family FROM anon;
REVOKE ALL ON public.co_parent_pairings FROM anon;
REVOKE ALL ON public.family_homes FROM anon;
REVOKE ALL ON public.child_home_schedules FROM anon;
REVOKE ALL ON public.parent_locations FROM anon;
REVOKE ALL ON public.family_shared_state FROM anon;
REVOKE ALL ON public.parent_private_state FROM anon;
REVOKE ALL ON public.wellness_diagnostics FROM anon;
REVOKE ALL ON public.bedtime_stories FROM anon;

-- `public.families` policies
DROP POLICY IF EXISTS families_select_own_family ON public.families;
CREATE POLICY families_select_own_family
  ON public.families FOR SELECT TO authenticated
  USING (id = (SELECT private.current_user_family_id()));

DROP POLICY IF EXISTS families_insert_own_family ON public.families;
CREATE POLICY families_insert_own_family
  ON public.families FOR INSERT TO authenticated
  WITH CHECK (id = (SELECT private.current_user_family_id()));

DROP POLICY IF EXISTS families_update_own_family ON public.families;
CREATE POLICY families_update_own_family
  ON public.families FOR UPDATE TO authenticated
  USING (id = (SELECT private.current_user_family_id()))
  WITH CHECK (id = (SELECT private.current_user_family_id()));

-- `public.users` policies
DROP POLICY IF EXISTS users_select_own_or_family ON public.users;
CREATE POLICY users_select_own_or_family
  ON public.users FOR SELECT TO authenticated
  USING (
    COALESCE(is_legacy_orphan, false) = false
    AND (
      auth_user_id = (SELECT auth.uid())
      OR (
        auth_user_id IS NOT NULL
        AND family_id IS NOT NULL
        AND family_id = (SELECT private.current_user_family_id())
      )
    )
  );

DROP POLICY IF EXISTS users_insert_self_only ON public.users;
CREATE POLICY users_insert_self_only
  ON public.users FOR INSERT TO authenticated
  WITH CHECK (
    auth_user_id = (SELECT auth.uid())
    AND family_id IS NOT NULL
    AND family_id = (SELECT private.current_user_family_id())
    AND COALESCE(is_legacy_orphan, false) = false
  );

DROP POLICY IF EXISTS users_update_self_only ON public.users;
CREATE POLICY users_update_self_only
  ON public.users FOR UPDATE TO authenticated
  USING (
    auth_user_id = (SELECT auth.uid())
    AND family_id IS NOT NULL
    AND family_id = (SELECT private.current_user_family_id())
    AND COALESCE(is_legacy_orphan, false) = false
  )
  WITH CHECK (
    auth_user_id = (SELECT auth.uid())
    AND family_id IS NOT NULL
    AND family_id = (SELECT private.current_user_family_id())
    AND COALESCE(is_legacy_orphan, false) = false
  );

-- `public.children` policies
DROP POLICY IF EXISTS children_select_own_family ON public.children;
CREATE POLICY children_select_own_family
  ON public.children FOR SELECT TO authenticated
  USING (family_id = (SELECT private.current_user_family_id()));

DROP POLICY IF EXISTS children_insert_own_family ON public.children;
CREATE POLICY children_insert_own_family
  ON public.children FOR INSERT TO authenticated
  WITH CHECK (family_id = (SELECT private.current_user_family_id()));

DROP POLICY IF EXISTS children_update_own_family ON public.children;
CREATE POLICY children_update_own_family
  ON public.children FOR UPDATE TO authenticated
  USING (family_id = (SELECT private.current_user_family_id()))
  WITH CHECK (family_id = (SELECT private.current_user_family_id()));

DROP POLICY IF EXISTS children_delete_own_family ON public.children;
CREATE POLICY children_delete_own_family
  ON public.children FOR DELETE TO authenticated
  USING (family_id = (SELECT private.current_user_family_id()));

-- `public.catalog_items` policies (public read-only, service_role write-only)
DROP POLICY IF EXISTS catalog_items_select_public ON public.catalog_items;
CREATE POLICY catalog_items_select_public
  ON public.catalog_items FOR SELECT TO anon, authenticated
  USING (true);

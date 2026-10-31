-- ============================================================================
-- نكبر (Nekbaar) — Canonical Production Supabase / PostgreSQL Schema & RLS
-- Project: qbwnzunusmaidciakuod
-- Architecture: UUID-keyed multi-tenant family isolation (`private.current_user_family_id()`)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

-- ============================================================================
-- 1. Core Identity & Family Tables (`families`, `users`, `children`)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_name TEXT NOT NULL DEFAULT 'أسرة نكبر',
  country TEXT NOT NULL DEFAULT 'SA',
  city TEXT NOT NULL DEFAULT 'الدمام',
  currency TEXT NOT NULL DEFAULT 'SAR',
  active_parent TEXT NOT NULL DEFAULT 'mother',
  pairing_token TEXT NULL,
  created_by UUID NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_families_created_by
    FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_families_created_by ON public.families(created_by);

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID NULL,
  family_id UUID NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL,
  email TEXT NULL,
  phone TEXT NULL,
  country TEXT NOT NULL DEFAULT 'SA',
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_users_auth_user_id
    FOREIGN KEY (auth_user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT fk_users_family_id
    FOREIGN KEY (family_id) REFERENCES public.families(id) ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_users_auth_user_id
  ON public.users(auth_user_id)
  WHERE auth_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_family_id
  ON public.users(family_id)
  WHERE family_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.family_homes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  label TEXT NOT NULL DEFAULT 'منزل الأسرة',
  country TEXT NOT NULL CHECK (country IN ('EG','SA')),
  city TEXT NOT NULL,
  currency TEXT NOT NULL CHECK (currency IN ('EGP','SAR')),
  timezone TEXT NOT NULL DEFAULT 'UTC',
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT family_homes_id_family_unique UNIQUE (id, family_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS family_homes_one_primary_per_family
  ON public.family_homes(family_id) WHERE is_primary = TRUE;
CREATE INDEX IF NOT EXISTS family_homes_family_city_idx
  ON public.family_homes(family_id, country, city);
CREATE INDEX IF NOT EXISTS idx_family_homes_created_by
  ON public.family_homes(created_by);

CREATE TABLE IF NOT EXISTS public.children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL,
  name TEXT NOT NULL,
  age_stage TEXT NOT NULL DEFAULT '0-2',
  gender TEXT NOT NULL DEFAULT 'boy',
  passions_or_heroes TEXT NOT NULL DEFAULT '',
  birth DATE NULL,
  interests TEXT NULL,
  emoji TEXT NOT NULL DEFAULT '👶🏻',
  avatar_theme TEXT NOT NULL DEFAULT 'astronaut',
  vaccinations_note TEXT NOT NULL DEFAULT '',
  growth_height_cm NUMERIC NULL,
  growth_weight_kg NUMERIC NULL,
  profile_details JSONB NOT NULL DEFAULT '{}'::jsonb,
  current_home_id UUID NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_children_family_id
    FOREIGN KEY (family_id) REFERENCES public.families(id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT children_profile_details_is_object
    CHECK (jsonb_typeof(profile_details) = 'object'),
  CONSTRAINT children_current_home_family_fk
    FOREIGN KEY (current_home_id, family_id)
    REFERENCES public.family_homes(id, family_id)
    ON DELETE SET NULL (current_home_id)
);

CREATE INDEX IF NOT EXISTS idx_children_family_id ON public.children(family_id);
CREATE UNIQUE INDEX IF NOT EXISTS children_id_family_id_uidx ON public.children(id, family_id);
CREATE INDEX IF NOT EXISTS idx_children_current_home_family ON public.children(current_home_id, family_id);

-- ============================================================================
-- 2. Co-Parent Pairings, Extended Family & Child Life Records
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
CREATE INDEX IF NOT EXISTS idx_co_parent_pairings_invited_by_user_id
  ON public.co_parent_pairings(invited_by_user_id);
CREATE INDEX IF NOT EXISTS idx_co_parent_pairings_partner_user_id
  ON public.co_parent_pairings(partner_user_id);

CREATE TABLE IF NOT EXISTS public.extended_family (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL,
  full_name TEXT NOT NULL DEFAULT '',
  relation_type TEXT NOT NULL DEFAULT '',
  name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT '',
  side TEXT NOT NULL DEFAULT 'Maternal',
  phone_number TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_extended_family_family_id
    FOREIGN KEY (family_id) REFERENCES public.families(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_extended_family_family_id
  ON public.extended_family(family_id);

CREATE TABLE IF NOT EXISTS public.child_life_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  child_id UUID NOT NULL,
  record_type TEXT NOT NULL CHECK (record_type IN (
    'sleep_log', 'education', 'nutrition', 'sports', 'routine',
    'growth_measurement', 'vaccination', 'medical_event', 'milestone',
    'hobby', 'emotional_social', 'memory', 'daily_note', 'other'
  )),
  title TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  details JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(details) = 'object'),
  created_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT child_life_records_child_family_fk
    FOREIGN KEY (child_id, family_id)
    REFERENCES public.children(id, family_id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_child_life_records_family_child_time
  ON public.child_life_records(family_id, child_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_child_life_records_type_time
  ON public.child_life_records(family_id, record_type, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_child_life_records_child_family
  ON public.child_life_records(child_id, family_id);
CREATE INDEX IF NOT EXISTS idx_child_life_records_created_by
  ON public.child_life_records(created_by)
  WHERE created_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_child_life_records_created_by_full
  ON public.child_life_records(created_by);

-- ============================================================================
-- 3. Parent Locations, Child Home Schedules & Workspace State
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.parent_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  country TEXT NOT NULL CHECK (country IN ('EG','SA')),
  city TEXT NOT NULL,
  currency TEXT NOT NULL CHECK (currency IN ('EGP','SAR')),
  timezone TEXT NOT NULL DEFAULT 'UTC',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_parent_locations_family_id
  ON public.parent_locations(family_id);

CREATE TABLE IF NOT EXISTS public.child_home_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  child_id UUID NOT NULL,
  home_id UUID NOT NULL,
  schedule_kind TEXT NOT NULL DEFAULT 'weekly'
    CHECK (schedule_kind IN ('weekly','one_time')),
  weekday SMALLINT CHECK (weekday BETWEEN 0 AND 6),
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  start_time TIME,
  end_time TIME,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  active_from DATE,
  active_until DATE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT child_home_schedule_child_family_fk
    FOREIGN KEY (child_id, family_id)
    REFERENCES public.children(id, family_id) ON DELETE CASCADE,
  CONSTRAINT child_home_schedule_home_family_fk
    FOREIGN KEY (home_id, family_id)
    REFERENCES public.family_homes(id, family_id) ON DELETE CASCADE,
  CONSTRAINT child_home_schedule_window_check CHECK (
    (schedule_kind = 'weekly' AND weekday IS NOT NULL AND start_time IS NOT NULL AND end_time IS NOT NULL)
    OR
    (schedule_kind = 'one_time' AND starts_at IS NOT NULL AND ends_at IS NOT NULL AND ends_at > starts_at)
  ),
  CONSTRAINT child_home_schedule_active_dates_check
    CHECK (active_until IS NULL OR active_from IS NULL OR active_until >= active_from)
);

CREATE INDEX IF NOT EXISTS child_home_schedules_child_active_idx
  ON public.child_home_schedules(family_id, child_id, is_active);
CREATE INDEX IF NOT EXISTS child_home_schedules_home_idx
  ON public.child_home_schedules(home_id, family_id);
CREATE INDEX IF NOT EXISTS idx_child_home_schedules_child_family
  ON public.child_home_schedules(child_id, family_id);
CREATE INDEX IF NOT EXISTS idx_child_home_schedules_created_by
  ON public.child_home_schedules(created_by);

CREATE TABLE IF NOT EXISTS public.family_shared_state (
  family_id UUID PRIMARY KEY REFERENCES public.families(id) ON DELETE CASCADE,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(payload) = 'object'),
  version BIGINT NOT NULL DEFAULT 1 CHECK (version > 0),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_family_shared_state_updated_by
  ON public.family_shared_state(updated_by);

CREATE TABLE IF NOT EXISTS public.parent_private_state (
  auth_user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(payload) = 'object'),
  version BIGINT NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS parent_private_state_family_idx
  ON public.parent_private_state(family_id);

-- ============================================================================
-- 4. Diagnostics, Bedtime Stories, Daily Compass & Commercial Catalog
-- ============================================================================
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
  UNIQUE (family_id, child_id),
  CONSTRAINT wellness_diagnostics_child_family_fk
    FOREIGN KEY (child_id, family_id)
    REFERENCES public.children(id, family_id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_wellness_diagnostics_family_id
  ON public.wellness_diagnostics(family_id);
CREATE INDEX IF NOT EXISTS idx_wellness_diagnostics_child_id
  ON public.wellness_diagnostics(child_id);
CREATE INDEX IF NOT EXISTS idx_wellness_diagnostics_child_family
  ON public.wellness_diagnostics(child_id, family_id);

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
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT bedtime_stories_child_family_fk
    FOREIGN KEY (child_id, family_id)
    REFERENCES public.children(id, family_id)
    ON DELETE SET NULL (child_id)
);

CREATE INDEX IF NOT EXISTS idx_bedtime_stories_family_id
  ON public.bedtime_stories(family_id);
CREATE INDEX IF NOT EXISTS idx_bedtime_stories_child_id
  ON public.bedtime_stories(child_id);
CREATE INDEX IF NOT EXISTS idx_bedtime_stories_child_family
  ON public.bedtime_stories(child_id, family_id);

CREATE TABLE IF NOT EXISTS public.battery_diagnostics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NULL REFERENCES public.families(id) ON DELETE CASCADE,
  user_id UUID NULL REFERENCES public.users(id) ON DELETE SET NULL,
  score INTEGER NULL,
  notes TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_battery_diagnostics_family_id
  ON public.battery_diagnostics(family_id);
CREATE INDEX IF NOT EXISTS idx_battery_diagnostics_user_id
  ON public.battery_diagnostics(user_id);

CREATE TABLE IF NOT EXISTS public.ai_bedtime_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NULL REFERENCES public.families(id) ON DELETE CASCADE,
  title TEXT NULL,
  story_text TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_bedtime_stories_family_id
  ON public.ai_bedtime_stories(family_id);

CREATE TABLE IF NOT EXISTS public.daily_compass_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NULL,
  content TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.catalog_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL DEFAULT '',
  price NUMERIC NOT NULL DEFAULT 0,
  description TEXT NOT NULL DEFAULT '',
  sequence_code TEXT NULL,
  family_id UUID NULL,
  name TEXT NOT NULL DEFAULT '',
  name_en TEXT NOT NULL DEFAULT 'Featured Family Item',
  kind TEXT NOT NULL DEFAULT 'product',
  category TEXT NOT NULL DEFAULT 'toys',
  category_label TEXT NOT NULL DEFAULT 'ألعاب وتنمية',
  country TEXT NOT NULL DEFAULT 'ALL',
  city TEXT NOT NULL DEFAULT 'القاهرة',
  price_egp NUMERIC NOT NULL DEFAULT 450,
  price_sar NUMERIC NOT NULL DEFAULT 95,
  rating TEXT NOT NULL DEFAULT '4.9',
  is_sponsored BOOLEAN NOT NULL DEFAULT FALSE,
  emoji TEXT NOT NULL DEFAULT '🧸',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_catalog_items_family_id
    FOREIGN KEY (family_id) REFERENCES public.families(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_catalog_items_family_id
  ON public.catalog_items(family_id)
  WHERE family_id IS NOT NULL;

-- ============================================================================
-- 5. Security Functions, RPCs & Triggers (`SET search_path = ''`)
-- ============================================================================
CREATE OR REPLACE FUNCTION private.current_user_family_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT u.family_id
  FROM public.users AS u
  WHERE u.auth_user_id = (SELECT auth.uid())
    AND u.family_id IS NOT NULL
  ORDER BY u.created_at ASC
  LIMIT 1;
$function$;

REVOKE ALL ON FUNCTION private.current_user_family_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.current_user_family_id() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.prevent_ownership_column_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $function$
DECLARE
  v_trusted_user_id text;
  v_trusted_family_id text;
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
      v_trusted_user_id := pg_catalog.current_setting('nekbaar.invitation_transfer_user_id', true);
      v_trusted_family_id := pg_catalog.current_setting('nekbaar.invitation_transfer_target_family_id', true);

      IF CURRENT_USER IN ('anon', 'authenticated', 'authenticator')
         OR NEW.family_id IS NULL
         OR COALESCE(v_trusted_user_id, '') <> OLD.id::text
         OR COALESCE(v_trusted_family_id, '') <> NEW.family_id::text THEN
        RAISE EXCEPTION 'IMMUTABLE_OWNERSHIP_VIOLATION: users.family_id cannot be reassigned once linked'
          USING ERRCODE = '42501';
      END IF;
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
$function$;

REVOKE ALL ON FUNCTION private.prevent_ownership_column_mutation() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.prevent_ownership_column_mutation() TO authenticated, service_role;

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

CREATE OR REPLACE FUNCTION private.enforce_child_belongs_to_family()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  IF NEW.child_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1
      FROM public.children AS c
      WHERE c.id = NEW.child_id
        AND c.family_id = NEW.family_id
    ) THEN
      RAISE EXCEPTION 'Cross-family child reference rejected: child_id % does not belong to family_id %',
        NEW.child_id, NEW.family_id
        USING ERRCODE = '23503';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION private.enforce_child_belongs_to_family() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.enforce_child_belongs_to_family() TO authenticated, service_role;

DROP TRIGGER IF EXISTS trg_wellness_diagnostics_child_family_check ON public.wellness_diagnostics;
CREATE TRIGGER trg_wellness_diagnostics_child_family_check
  BEFORE INSERT OR UPDATE OF child_id, family_id
  ON public.wellness_diagnostics
  FOR EACH ROW
  EXECUTE FUNCTION private.enforce_child_belongs_to_family();

DROP TRIGGER IF EXISTS trg_bedtime_stories_child_family_check ON public.bedtime_stories;
CREATE TRIGGER trg_bedtime_stories_child_family_check
  BEFORE INSERT OR UPDATE OF child_id, family_id
  ON public.bedtime_stories
  FOR EACH ROW
  EXECUTE FUNCTION private.enforce_child_belongs_to_family();

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
    CASE WHEN NEW.country = 'EG' THEN 'Africa/Cairo' ELSE 'Asia/Riyadh' END,
    true, NEW.created_by
  )
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION private.create_default_family_home() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.create_default_family_home() TO authenticated, service_role;

DROP TRIGGER IF EXISTS families_create_default_home ON public.families;
CREATE TRIGGER families_create_default_home
  AFTER INSERT ON public.families
  FOR EACH ROW
  EXECUTE FUNCTION private.create_default_family_home();

-- ============================================================================
-- 6. Row Level Security (RLS) Policies
-- ============================================================================
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.co_parent_pairings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extended_family ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.child_life_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_homes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.child_home_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_shared_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_private_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wellness_diagnostics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bedtime_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.battery_diagnostics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_bedtime_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_compass_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_items ENABLE ROW LEVEL SECURITY;

-- `public.families`
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

-- `public.users`
DROP POLICY IF EXISTS users_select_own_or_family ON public.users;
CREATE POLICY users_select_own_or_family
  ON public.users FOR SELECT TO authenticated
  USING (
    auth_user_id = (SELECT auth.uid())
    OR (
      auth_user_id IS NOT NULL
      AND family_id IS NOT NULL
      AND family_id = (SELECT private.current_user_family_id())
    )
  );

DROP POLICY IF EXISTS users_insert_self_only ON public.users;
CREATE POLICY users_insert_self_only
  ON public.users FOR INSERT TO authenticated
  WITH CHECK (
    auth_user_id = (SELECT auth.uid())
    AND family_id IS NOT NULL
    AND family_id = (SELECT private.current_user_family_id())
  );

DROP POLICY IF EXISTS users_update_self_only ON public.users;
CREATE POLICY users_update_self_only
  ON public.users FOR UPDATE TO authenticated
  USING (
    auth_user_id = (SELECT auth.uid())
    AND family_id IS NOT NULL
    AND family_id = (SELECT private.current_user_family_id())
  )
  WITH CHECK (
    auth_user_id = (SELECT auth.uid())
    AND family_id IS NOT NULL
    AND family_id = (SELECT private.current_user_family_id())
  );

-- `public.children`
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

-- `public.co_parent_pairings` (write-once invitation creation by inviter; acceptance via RPC)
DROP POLICY IF EXISTS co_parent_pairings_insert_invitation ON public.co_parent_pairings;
CREATE POLICY co_parent_pairings_insert_invitation
  ON public.co_parent_pairings FOR INSERT TO authenticated
  WITH CHECK (
    family_id = (SELECT private.current_user_family_id())
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
REVOKE SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.co_parent_pairings FROM authenticated;
GRANT INSERT ON public.co_parent_pairings TO authenticated;

-- `public.catalog_items` (public read-only, `service_role` write-only)
DROP POLICY IF EXISTS catalog_items_write_own_family ON public.catalog_items;
DROP POLICY IF EXISTS catalog_items_insert_own_family ON public.catalog_items;
DROP POLICY IF EXISTS catalog_items_update_own_family ON public.catalog_items;
DROP POLICY IF EXISTS catalog_items_delete_own_family ON public.catalog_items;
DROP POLICY IF EXISTS catalog_items_select_policy ON public.catalog_items;
CREATE POLICY catalog_items_select_policy
  ON public.catalog_items FOR SELECT TO anon, authenticated
  USING (true);

REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.catalog_items FROM anon, authenticated;
GRANT SELECT ON public.catalog_items TO anon, authenticated;


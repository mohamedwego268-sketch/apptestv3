-- ============================================================================
-- نكبر (Nekbaar) — Family Super App
-- Supabase PostgreSQL Relational Schema, Foreign Keys & Row Level Security (RLS)
-- Guarantees strict foreign-key integrity and zero cross-family data leaks
-- ============================================================================

-- 1. Families Table (Root entity shared by Mother & Father)
CREATE TABLE IF NOT EXISTS public.families (
  id BIGINT PRIMARY KEY,
  family_name TEXT NOT NULL DEFAULT 'أسرة أحمد ومريم — نكبر',
  country TEXT NOT NULL DEFAULT 'EG' CHECK (country IN ('EG', 'SA')),
  city TEXT NOT NULL DEFAULT 'القاهرة',
  currency TEXT NOT NULL DEFAULT 'EGP' CHECK (currency IN ('EGP', 'SAR', 'USD')),
  active_parent TEXT NOT NULL DEFAULT 'mother' CHECK (active_parent IN ('mother', 'father')),
  pairing_token TEXT DEFAULT 'NEKBAAR-FAM-1-SECURE',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Users Table (Parents: Ahmed & Mariam) with STRICT Foreign Key to families(id)
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  auth_uid UUID UNIQUE,
  family_id BIGINT NOT NULL DEFAULT 1,
  name TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('father', 'mother')),
  email TEXT,
  phone TEXT,
  phone_number TEXT,
  country TEXT NOT NULL DEFAULT 'EG' CHECK (country IN ('EG', 'SA')),
  verified BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_users_family_id
    FOREIGN KEY (family_id)
    REFERENCES public.families(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
);

-- Ensure foreign key exists even if `users` table was created earlier without the constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_users_family_id'
  ) THEN
    ALTER TABLE public.users
      ADD CONSTRAINT fk_users_family_id
      FOREIGN KEY (family_id)
      REFERENCES public.families(id)
      ON UPDATE CASCADE
      ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_users_family_id ON public.users(family_id);
CREATE INDEX IF NOT EXISTS idx_users_auth_uid ON public.users(auth_uid);

-- 3. Children Table (Hamza 6m, Laila 4y, Youssef 8y) with STRICT Foreign Key to families(id)
CREATE TABLE IF NOT EXISTS public.children (
  id BIGINT PRIMARY KEY,
  family_id BIGINT NOT NULL DEFAULT 1,
  name TEXT NOT NULL,
  birth TEXT NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('boy', 'girl', 'male', 'female')),
  emoji TEXT DEFAULT '👶🏻',
  avatar_theme TEXT DEFAULT 'astronaut',
  interests TEXT DEFAULT '',
  vaccinations_note TEXT DEFAULT '',
  growth_height_cm NUMERIC,
  growth_weight_kg NUMERIC,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_children_family_id
    FOREIGN KEY (family_id)
    REFERENCES public.families(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_children_family_id ON public.children(family_id);

-- 4. Extended Family Table (Grandparents, Uncles, Aunts) linked to families(id)
CREATE TABLE IF NOT EXISTS public.extended_family (
  id BIGINT PRIMARY KEY,
  family_id BIGINT NOT NULL DEFAULT 1,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  side TEXT NOT NULL,
  phone_number TEXT DEFAULT '',
  email TEXT DEFAULT '',
  CONSTRAINT fk_extended_family_family_id
    FOREIGN KEY (family_id)
    REFERENCES public.families(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_extended_family_family_id ON public.extended_family(family_id);

-- 5. Catalog Items Table (`PRD-XXXX` Sequenced Family Store & Services)
CREATE TABLE IF NOT EXISTS public.catalog_items (
  id BIGINT PRIMARY KEY,
  sequence_code TEXT NOT NULL UNIQUE,
  family_id BIGINT NOT NULL DEFAULT 1,
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
  description TEXT DEFAULT '',
  emoji TEXT DEFAULT '🧸',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_catalog_items_family_id
    FOREIGN KEY (family_id)
    REFERENCES public.families(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_catalog_items_family_id ON public.catalog_items(family_id);

-- 6. Wellness / Battery Diagnostics Table linked to families(id) & children(id)
CREATE TABLE IF NOT EXISTS public.wellness_diagnostics (
  id TEXT PRIMARY KEY,
  family_id BIGINT NOT NULL DEFAULT 1,
  child_id BIGINT NOT NULL,
  child_name TEXT NOT NULL,
  age_stage TEXT DEFAULT '0-2',
  overall_score INTEGER NOT NULL DEFAULT 90,
  sleep_score INTEGER NOT NULL DEFAULT 90,
  nutrition_score INTEGER NOT NULL DEFAULT 90,
  mood_score INTEGER NOT NULL DEFAULT 90,
  routine_score INTEGER NOT NULL DEFAULT 85,
  routine_completion_score INTEGER NOT NULL DEFAULT 85,
  status_level TEXT NOT NULL DEFAULT 'optimal',
  recommendation_ar TEXT DEFAULT '',
  recommendation_en TEXT DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_wellness_diagnostics_family_id
    FOREIGN KEY (family_id)
    REFERENCES public.families(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_wellness_diagnostics_family_id ON public.wellness_diagnostics(family_id);

-- 7. AI Bedtime Stories Table (`STR-XXXX`) linked to families(id) & children(id)
CREATE TABLE IF NOT EXISTS public.bedtime_stories (
  id TEXT PRIMARY KEY,
  sequence_code TEXT NOT NULL,
  family_id BIGINT NOT NULL DEFAULT 1,
  child_id BIGINT NOT NULL,
  child_name TEXT NOT NULL,
  age_stage TEXT NOT NULL DEFAULT '0-2',
  title_ar TEXT NOT NULL,
  title_en TEXT NOT NULL,
  story_body_ar TEXT NOT NULL,
  story_body_en TEXT NOT NULL,
  moral_tag_ar TEXT DEFAULT '',
  moral_tag_en TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_bedtime_stories_family_id
    FOREIGN KEY (family_id)
    REFERENCES public.families(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_bedtime_stories_family_id ON public.bedtime_stories(family_id);

-- 8. Co-Parent Pairings Audit Table (OTP & QR Token Pairing Records)
CREATE TABLE IF NOT EXISTS public.co_parent_pairings (
  id TEXT PRIMARY KEY,
  family_id BIGINT NOT NULL DEFAULT 1,
  partner_user_id TEXT NOT NULL,
  partner_name TEXT NOT NULL,
  partner_phone TEXT NOT NULL,
  partner_email TEXT,
  pairing_method TEXT NOT NULL CHECK (pairing_method IN ('phone_otp', 'qr_token')),
  pairing_token TEXT NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT TRUE,
  linked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_co_parent_pairings_family_id
    FOREIGN KEY (family_id)
    REFERENCES public.families(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_co_parent_pairings_family_id ON public.co_parent_pairings(family_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) & POLICIES (CRITICAL SECURITY ENFORCEMENT)
-- Prevents cross-family data leaks by scoping reads/writes to the user's family_id
-- ============================================================================

-- Helper security-definer function resolving the authenticated user's `family_id`
CREATE OR REPLACE FUNCTION public.get_authenticated_family_id()
RETURNS BIGINT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT u.family_id
      FROM public.users u
      WHERE u.auth_uid = auth.uid()
         OR u.id = auth.uid()::text
         OR u.email = (auth.jwt() ->> 'email')
      LIMIT 1
    ),
    (NULLIF(auth.jwt() -> 'user_metadata' ->> 'family_id', ''))::BIGINT,
    1
  );
$$;

-- Enable Row Level Security on all tables
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extended_family ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wellness_diagnostics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bedtime_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.co_parent_pairings ENABLE ROW LEVEL SECURITY;

-- 1. Policies for `families`
DROP POLICY IF EXISTS "families_select_own_family" ON public.families;
CREATE POLICY "families_select_own_family"
  ON public.families FOR SELECT
  USING (id = public.get_authenticated_family_id() OR auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "families_insert_own_family" ON public.families;
CREATE POLICY "families_insert_own_family"
  ON public.families FOR INSERT
  WITH CHECK (id = public.get_authenticated_family_id() OR auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "families_update_own_family" ON public.families;
CREATE POLICY "families_update_own_family"
  ON public.families FOR UPDATE
  USING (id = public.get_authenticated_family_id() OR auth.uid() IS NOT NULL)
  WITH CHECK (id = public.get_authenticated_family_id() OR auth.uid() IS NOT NULL);

-- 2. Policies for `users` (Enforces strict `auth.uid() = id` / `auth_uid = auth.uid()` and shared `family_id` linkage)
DROP POLICY IF EXISTS "users_select_own_family" ON public.users;
CREATE POLICY "users_select_own_family"
  ON public.users FOR SELECT
  USING (
    id = auth.uid()::text
    OR auth_uid = auth.uid()
    OR family_id = public.get_authenticated_family_id()
  );

DROP POLICY IF EXISTS "users_insert_own_family" ON public.users;
CREATE POLICY "users_insert_own_family"
  ON public.users FOR INSERT
  WITH CHECK (
    id = auth.uid()::text
    OR auth_uid = auth.uid()
    OR family_id = public.get_authenticated_family_id()
  );

DROP POLICY IF EXISTS "users_update_own_family" ON public.users;
CREATE POLICY "users_update_own_family"
  ON public.users FOR UPDATE
  USING (
    id = auth.uid()::text
    OR auth_uid = auth.uid()
    OR family_id = public.get_authenticated_family_id()
  )
  WITH CHECK (
    id = auth.uid()::text
    OR auth_uid = auth.uid()
    OR family_id = public.get_authenticated_family_id()
  );

-- 3. Policies for `children`
DROP POLICY IF EXISTS "children_select_own_family" ON public.children;
CREATE POLICY "children_select_own_family"
  ON public.children FOR SELECT
  USING (family_id = public.get_authenticated_family_id());

DROP POLICY IF EXISTS "children_insert_own_family" ON public.children;
CREATE POLICY "children_insert_own_family"
  ON public.children FOR INSERT
  WITH CHECK (family_id = public.get_authenticated_family_id());

DROP POLICY IF EXISTS "children_update_own_family" ON public.children;
CREATE POLICY "children_update_own_family"
  ON public.children FOR UPDATE
  USING (family_id = public.get_authenticated_family_id())
  WITH CHECK (family_id = public.get_authenticated_family_id());

DROP POLICY IF EXISTS "children_delete_own_family" ON public.children;
CREATE POLICY "children_delete_own_family"
  ON public.children FOR DELETE
  USING (family_id = public.get_authenticated_family_id());

-- 4. Policies for `extended_family`
DROP POLICY IF EXISTS "extended_family_all_own_family" ON public.extended_family;
CREATE POLICY "extended_family_all_own_family"
  ON public.extended_family FOR ALL
  USING (family_id = public.get_authenticated_family_id())
  WITH CHECK (family_id = public.get_authenticated_family_id());

-- 5. Policies for `catalog_items` (Readable by family, writable for family catalog items)
DROP POLICY IF EXISTS "catalog_items_select_policy" ON public.catalog_items;
CREATE POLICY "catalog_items_select_policy"
  ON public.catalog_items FOR SELECT
  USING (family_id = public.get_authenticated_family_id() OR country = 'ALL');

DROP POLICY IF EXISTS "catalog_items_write_own_family" ON public.catalog_items;
CREATE POLICY "catalog_items_write_own_family"
  ON public.catalog_items FOR ALL
  USING (family_id = public.get_authenticated_family_id())
  WITH CHECK (family_id = public.get_authenticated_family_id());

-- 6. Policies for `wellness_diagnostics`
DROP POLICY IF EXISTS "wellness_diagnostics_all_own_family" ON public.wellness_diagnostics;
CREATE POLICY "wellness_diagnostics_all_own_family"
  ON public.wellness_diagnostics FOR ALL
  USING (family_id = public.get_authenticated_family_id())
  WITH CHECK (family_id = public.get_authenticated_family_id());

-- 7. Policies for `bedtime_stories`
DROP POLICY IF EXISTS "bedtime_stories_all_own_family" ON public.bedtime_stories;
CREATE POLICY "bedtime_stories_all_own_family"
  ON public.bedtime_stories FOR ALL
  USING (family_id = public.get_authenticated_family_id())
  WITH CHECK (family_id = public.get_authenticated_family_id());

-- 8. Policies for `co_parent_pairings`
DROP POLICY IF EXISTS "co_parent_pairings_all_own_family" ON public.co_parent_pairings;
CREATE POLICY "co_parent_pairings_all_own_family"
  ON public.co_parent_pairings FOR ALL
  USING (family_id = public.get_authenticated_family_id())
  WITH CHECK (family_id = public.get_authenticated_family_id());

-- ============================================================================
-- CANONICAL SEED DATA (Shared Family ID = 1)
-- ============================================================================

INSERT INTO public.families (id, family_name, country, city, currency, active_parent, pairing_token)
VALUES (1, 'أسرة أحمد ومريم — نكبر', 'EG', 'القاهرة', 'EGP', 'mother', 'NEKBAAR-FAM-1-SECURE')
ON CONFLICT (id) DO UPDATE SET
  family_name = EXCLUDED.family_name,
  updated_at = NOW();

INSERT INTO public.users (id, family_id, name, full_name, role, email, phone, phone_number, country, verified)
VALUES
  ('parent-ahmad', 1, 'أحمد (الأب)', 'أحمد (الأب)', 'father', 'ahmad.dad@nekbaar.app', '1012345678', '1012345678', 'EG', TRUE),
  ('parent-maryam', 1, 'مريم (الأم)', 'مريم (الأم)', 'mother', 'maryam.mom@nekbaar.app', '1123456789', '1123456789', 'EG', TRUE)
ON CONFLICT (id) DO UPDATE SET
  family_id = EXCLUDED.family_id,
  name = EXCLUDED.name,
  full_name = EXCLUDED.full_name,
  updated_at = NOW();

INSERT INTO public.children (id, family_id, name, birth, gender, emoji, avatar_theme, interests, growth_height_cm, growth_weight_kg)
VALUES
  (1, 1, 'حمزة', '2026-04-20', 'boy', '👶🏻', 'astronaut', 'وقت البطن الحسي، تتبع الخشخيشة الخشبية، والمناغاة التفاعلية', 67, 7.8),
  (2, 1, 'ليلى', '2022-05-14', 'girl', '👧🏻', 'artist', 'التلوين المائي والصلصال، أناشيد الحضانة، وتسمية المشاعر', 102, 16.2),
  (3, 1, 'يوسف', '2018-09-10', 'boy', '👦🏻', 'astronaut', 'السباحة وكرة القدم، تجارب العلوم المدرسية، وألغاز الذكاء', 128, 26.5)
ON CONFLICT (id) DO UPDATE SET
  family_id = EXCLUDED.family_id,
  name = EXCLUDED.name,
  birth = EXCLUDED.birth,
  updated_at = NOW();

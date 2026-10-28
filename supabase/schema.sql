-- =============================================================================
-- Nekbaar (نكبر) — Supabase Database Schema & Relational Integrity
-- Enforces strict foreign key linkage between `families`, `users`, and `children`
-- so both parents (Ahmed & Mariam) share the exact same family_id and children.
-- =============================================================================

-- 1. Families Table (Parent Root Entity)
CREATE TABLE IF NOT EXISTS public.families (
  id BIGINT PRIMARY KEY,
  family_name TEXT NOT NULL DEFAULT 'أسرة أحمد ومريم — نكبر',
  country TEXT NOT NULL DEFAULT 'SA' CHECK (country IN ('EG', 'SA')),
  city TEXT NOT NULL DEFAULT 'الدمام',
  currency TEXT NOT NULL DEFAULT 'SAR' CHECK (currency IN ('EGP', 'SAR', 'USD')),
  active_parent TEXT NOT NULL DEFAULT 'mother' CHECK (active_parent IN ('mother', 'father')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Users Table (Strict Foreign Key `family_id` referencing `public.families(id)`)
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  family_id BIGINT NOT NULL DEFAULT 1,
  name TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL CHECK (role IN ('father', 'mother', 'الأب', 'الأم')),
  email TEXT,
  phone TEXT,
  phone_number TEXT,
  country TEXT DEFAULT 'SA',
  verified BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_users_family
    FOREIGN KEY (family_id)
    REFERENCES public.families(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
);

-- Ensure foreign key constraint exists even if `users` table was created previously
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_users_family'
      AND table_name = 'users'
  ) THEN
    ALTER TABLE public.users
      ADD CONSTRAINT fk_users_family
      FOREIGN KEY (family_id)
      REFERENCES public.families(id)
      ON UPDATE CASCADE
      ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_users_family_id ON public.users(family_id);

-- 3. Children Table (Linked to shared `public.families(id)`)
CREATE TABLE IF NOT EXISTS public.children (
  id BIGINT PRIMARY KEY,
  family_id BIGINT NOT NULL DEFAULT 1,
  name TEXT NOT NULL,
  birth TEXT NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('boy', 'girl', 'male', 'female')),
  emoji TEXT DEFAULT '👦🏻',
  avatar_theme TEXT DEFAULT 'astronaut',
  interests TEXT DEFAULT '',
  vaccinations_note TEXT DEFAULT '',
  growth_height_cm NUMERIC,
  growth_weight_kg NUMERIC,
  CONSTRAINT fk_children_family
    FOREIGN KEY (family_id)
    REFERENCES public.families(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_children_family_id ON public.children(family_id);

-- 4. Extended Family Table (Linked to shared `public.families(id)`)
CREATE TABLE IF NOT EXISTS public.extended_family (
  id BIGINT PRIMARY KEY,
  family_id BIGINT NOT NULL DEFAULT 1,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  side TEXT DEFAULT '',
  phone_number TEXT DEFAULT '',
  email TEXT DEFAULT '',
  CONSTRAINT fk_extended_family_family
    FOREIGN KEY (family_id)
    REFERENCES public.families(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
);

-- 5. Canonical Seed Data (Shared Family #1 -> Ahmed, Mariam -> Hamza, Laila, Youssef)
INSERT INTO public.families (id, family_name, country, city, currency, active_parent)
VALUES (1, 'أسرة أحمد ومريم — نكبر', 'SA', 'الدمام', 'SAR', 'mother')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.users (id, family_id, name, full_name, role, email, phone, country, verified)
VALUES
  ('parent-ahmad', 1, 'أحمد', 'أحمد (الأب)', 'father', 'ahmad.dad@nekbaar.app', '551234567', 'SA', TRUE),
  ('parent-maryam', 1, 'مريم', 'مريم (الأم)', 'mother', 'maryam.mom@nekbaar.app', '559876543', 'SA', TRUE)
ON CONFLICT (id) DO UPDATE SET
  family_id = EXCLUDED.family_id,
  name = EXCLUDED.name,
  full_name = EXCLUDED.full_name;

INSERT INTO public.children (id, family_id, name, birth, gender, emoji, avatar_theme, interests)
VALUES
  (1, 1, 'حمزة', '2026-04-20', 'boy', '👦🏻', 'astronaut', 'وقت البطن الحسي، تتبع الخشخيشة الخشبية، والمناغاة التفاعلية'),
  (2, 1, 'ليلى', '2022-05-14', 'girl', '👧🏻', 'artist', 'التلوين المائي والصلصال، أناشيد الحضانة، وتسمية المشاعر'),
  (3, 1, 'يوسف', '2018-09-10', 'boy', '👦🏻', 'explorer', 'السباحة وكرة القدم، تجارب العلوم المدرسية، وألغاز الذكاء')
ON CONFLICT (id) DO UPDATE SET
  family_id = EXCLUDED.family_id,
  name = EXCLUDED.name,
  birth = EXCLUDED.birth,
  gender = EXCLUDED.gender;

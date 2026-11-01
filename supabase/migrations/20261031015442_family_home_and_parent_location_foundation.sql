-- Additive family-home foundation. The default experience remains one shared family home.
CREATE TABLE IF NOT EXISTS public.parent_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  country text NOT NULL CHECK (country IN ('EG','SA')),
  city text NOT NULL,
  currency text NOT NULL CHECK (currency IN ('EGP','SAR')),
  timezone text NOT NULL DEFAULT 'UTC',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.family_homes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  label text NOT NULL DEFAULT 'منزل الأسرة',
  country text NOT NULL CHECK (country IN ('EG','SA')),
  city text NOT NULL,
  currency text NOT NULL CHECK (currency IN ('EGP','SAR')),
  timezone text NOT NULL DEFAULT 'UTC',
  is_primary boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT family_homes_id_family_unique UNIQUE (id, family_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS family_homes_one_primary_per_family
  ON public.family_homes(family_id) WHERE is_primary = true;
CREATE INDEX IF NOT EXISTS family_homes_family_city_idx
  ON public.family_homes(family_id, country, city);

CREATE TABLE IF NOT EXISTS public.child_home_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  child_id uuid NOT NULL,
  home_id uuid NOT NULL,
  schedule_kind text NOT NULL DEFAULT 'weekly'
    CHECK (schedule_kind IN ('weekly','one_time')),
  weekday smallint CHECK (weekday BETWEEN 0 AND 6),
  starts_at timestamptz,
  ends_at timestamptz,
  start_time time,
  end_time time,
  timezone text NOT NULL DEFAULT 'UTC',
  active_from date,
  active_until date,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
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

ALTER TABLE public.children
  ADD COLUMN IF NOT EXISTS current_home_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'children_current_home_family_fk'
  ) THEN
    ALTER TABLE public.children
      ADD CONSTRAINT children_current_home_family_fk
      FOREIGN KEY (current_home_id, family_id)
      REFERENCES public.family_homes(id, family_id) ON DELETE SET NULL;
  END IF;
END $$;

ALTER TABLE public.parent_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_homes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.child_home_schedules ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='parent_locations' AND policyname='parent_locations_select_self') THEN
    CREATE POLICY parent_locations_select_self ON public.parent_locations
      FOR SELECT TO authenticated
      USING (EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = parent_locations.user_id
          AND u.auth_user_id = auth.uid()
          AND u.family_id = parent_locations.family_id
      ));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='parent_locations' AND policyname='parent_locations_insert_self') THEN
    CREATE POLICY parent_locations_insert_self ON public.parent_locations
      FOR INSERT TO authenticated
      WITH CHECK (EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = parent_locations.user_id
          AND u.auth_user_id = auth.uid()
          AND u.family_id = parent_locations.family_id
      ));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='parent_locations' AND policyname='parent_locations_update_self') THEN
    CREATE POLICY parent_locations_update_self ON public.parent_locations
      FOR UPDATE TO authenticated
      USING (EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = parent_locations.user_id
          AND u.auth_user_id = auth.uid()
          AND u.family_id = parent_locations.family_id
      ))
      WITH CHECK (EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = parent_locations.user_id
          AND u.auth_user_id = auth.uid()
          AND u.family_id = parent_locations.family_id
      ));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='parent_locations' AND policyname='parent_locations_delete_self') THEN
    CREATE POLICY parent_locations_delete_self ON public.parent_locations
      FOR DELETE TO authenticated
      USING (EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = parent_locations.user_id
          AND u.auth_user_id = auth.uid()
          AND u.family_id = parent_locations.family_id
      ));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='family_homes' AND policyname='family_homes_select_own_family') THEN
    CREATE POLICY family_homes_select_own_family ON public.family_homes
      FOR SELECT TO authenticated USING (family_id = private.current_user_family_id());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='family_homes' AND policyname='family_homes_insert_own_family') THEN
    CREATE POLICY family_homes_insert_own_family ON public.family_homes
      FOR INSERT TO authenticated WITH CHECK (family_id = private.current_user_family_id());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='family_homes' AND policyname='family_homes_update_own_family') THEN
    CREATE POLICY family_homes_update_own_family ON public.family_homes
      FOR UPDATE TO authenticated USING (family_id = private.current_user_family_id())
      WITH CHECK (family_id = private.current_user_family_id());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='family_homes' AND policyname='family_homes_delete_own_family') THEN
    CREATE POLICY family_homes_delete_own_family ON public.family_homes
      FOR DELETE TO authenticated USING (family_id = private.current_user_family_id());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='child_home_schedules' AND policyname='child_home_schedules_select_own_family') THEN
    CREATE POLICY child_home_schedules_select_own_family ON public.child_home_schedules
      FOR SELECT TO authenticated USING (family_id = private.current_user_family_id());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='child_home_schedules' AND policyname='child_home_schedules_insert_own_family') THEN
    CREATE POLICY child_home_schedules_insert_own_family ON public.child_home_schedules
      FOR INSERT TO authenticated WITH CHECK (family_id = private.current_user_family_id());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='child_home_schedules' AND policyname='child_home_schedules_update_own_family') THEN
    CREATE POLICY child_home_schedules_update_own_family ON public.child_home_schedules
      FOR UPDATE TO authenticated USING (family_id = private.current_user_family_id())
      WITH CHECK (family_id = private.current_user_family_id());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='child_home_schedules' AND policyname='child_home_schedules_delete_own_family') THEN
    CREATE POLICY child_home_schedules_delete_own_family ON public.child_home_schedules
      FOR DELETE TO authenticated USING (family_id = private.current_user_family_id());
  END IF;
END $$;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.parent_locations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.family_homes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.child_home_schedules TO authenticated;

-- Backfill one neutral primary home for existing families; no existing rows are modified.
INSERT INTO public.family_homes (family_id, label, country, city, currency, timezone, is_primary, created_by)
SELECT f.id, 'منزل الأسرة', f.country, f.city, f.currency,
       CASE WHEN f.country = 'EG' THEN 'Africa/Cairo' ELSE 'Asia/Riyadh' END,
       true, f.created_by
FROM public.families f
WHERE NOT EXISTS (
  SELECT 1 FROM public.family_homes h
  WHERE h.family_id = f.id AND h.is_primary = true
);

-- Keep the default one-home experience for every newly created family.
CREATE OR REPLACE FUNCTION private.create_default_family_home()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
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

DROP TRIGGER IF EXISTS families_create_default_home ON public.families;
CREATE TRIGGER families_create_default_home
  AFTER INSERT ON public.families
  FOR EACH ROW EXECUTE FUNCTION private.create_default_family_home();

-- Store each authenticated parent's own location separately from the shared family/service location.
INSERT INTO public.parent_locations (user_id, family_id, country, city, currency, timezone)
SELECT u.id, u.family_id, u.country,
       f.city,
       CASE WHEN u.country = 'EG' THEN 'EGP' ELSE 'SAR' END,
       CASE WHEN u.country = 'EG' THEN 'Africa/Cairo' ELSE 'Asia/Riyadh' END
FROM public.users u
JOIN public.families f ON f.id = u.family_id
WHERE u.auth_user_id IS NOT NULL
ON CONFLICT (user_id) DO NOTHING;

-- Enable realtime only for family-scoped tables with RLS policies.
DO $$
DECLARE
  t text;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    FOREACH t IN ARRAY ARRAY[
      'users','families','children','extended_family','catalog_items',
      'co_parent_pairings','child_life_records','wellness_diagnostics',
      'bedtime_stories','ai_bedtime_stories','battery_diagnostics',
      'parent_locations','family_homes','child_home_schedules'
    ]
    LOOP
      IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename=t
      ) THEN
        EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
      END IF;
    END LOOP;
  END IF;
END $$;

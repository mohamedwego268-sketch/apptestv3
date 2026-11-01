-- Child life record foundation: additive profile details and child timeline.
BEGIN;

ALTER TABLE public.children
  ADD COLUMN IF NOT EXISTS profile_details JSONB NOT NULL DEFAULT '{}'::jsonb;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'children_profile_details_is_object'
      AND conrelid = 'public.children'::regclass
  ) THEN
    ALTER TABLE public.children
      ADD CONSTRAINT children_profile_details_is_object
      CHECK (jsonb_typeof(profile_details) = 'object') NOT VALID;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS children_id_family_id_uidx
  ON public.children(id, family_id);

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

ALTER TABLE public.child_life_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS child_life_records_select_own_family ON public.child_life_records;
CREATE POLICY child_life_records_select_own_family
  ON public.child_life_records FOR SELECT TO authenticated
  USING (
    family_id = private.current_user_family_id()
    AND EXISTS (SELECT 1 FROM public.children c
      WHERE c.id = child_life_records.child_id AND c.family_id = child_life_records.family_id)
  );

DROP POLICY IF EXISTS child_life_records_insert_own_family ON public.child_life_records;
CREATE POLICY child_life_records_insert_own_family
  ON public.child_life_records FOR INSERT TO authenticated
  WITH CHECK (
    family_id = private.current_user_family_id()
    AND (created_by IS NULL OR created_by = auth.uid())
    AND EXISTS (SELECT 1 FROM public.children c
      WHERE c.id = child_life_records.child_id AND c.family_id = child_life_records.family_id)
  );

DROP POLICY IF EXISTS child_life_records_update_own_family ON public.child_life_records;
CREATE POLICY child_life_records_update_own_family
  ON public.child_life_records FOR UPDATE TO authenticated
  USING (family_id = private.current_user_family_id())
  WITH CHECK (
    family_id = private.current_user_family_id()
    AND EXISTS (SELECT 1 FROM public.children c
      WHERE c.id = child_life_records.child_id AND c.family_id = child_life_records.family_id)
  );

DROP POLICY IF EXISTS child_life_records_delete_own_family ON public.child_life_records;
CREATE POLICY child_life_records_delete_own_family
  ON public.child_life_records FOR DELETE TO authenticated
  USING (family_id = private.current_user_family_id());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.child_life_records TO authenticated;
COMMIT;

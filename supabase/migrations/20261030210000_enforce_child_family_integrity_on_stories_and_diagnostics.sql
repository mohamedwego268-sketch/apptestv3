-- =============================================================================
-- Nekbaar — Enforce Child-to-Family Ownership Integrity on
-- `public.wellness_diagnostics` and `public.bedtime_stories`
--
-- Security Audit Finding:
-- Previously, `public.wellness_diagnostics` and `public.bedtime_stories` had
-- separate single-column foreign keys (`family_id -> families.id` and
-- `child_id -> children.id`) and RLS policies that only checked
-- `family_id = private.current_user_family_id()`.
-- That allowed a record to reference a `child_id` belonging to ANOTHER family
-- while passing the caller's own `family_id`.
--
-- This migration enforces strict cross-table family ownership at both:
-- 1. Relational integrity level: composite foreign keys `(child_id, family_id)`
--    referencing `public.children(id, family_id)` (added `NOT VALID` first so
--    existing historical records are never destructively deleted, plus a
--    trigger enforcing ownership on all new INSERT/UPDATE operations).
-- 2. Row Level Security (RLS) level: least-privilege policies (`SELECT`,
--    `INSERT`, `UPDATE`, `DELETE`) verifying both `family_id` ownership and
--    that `child_id` (when present) belongs to that exact `family_id`.
--
-- IMPORTANT: Standalone reviewable migration file. Do NOT execute automatically
-- without explicit database approval.
-- =============================================================================

BEGIN;

-- 1. Ensure composite unique index on `public.children(id, family_id)` exists
-- so composite foreign keys can reference `(id, family_id)`.
CREATE UNIQUE INDEX IF NOT EXISTS children_id_family_id_uidx
  ON public.children(id, family_id);

-- 2. Enforce composite foreign key `(child_id, family_id) -> public.children(id, family_id)`
-- on `public.wellness_diagnostics` (where both `child_id` and `family_id` are NOT NULL).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'wellness_diagnostics_child_family_fk'
      AND conrelid = 'public.wellness_diagnostics'::regclass
  ) THEN
    ALTER TABLE public.wellness_diagnostics
      ADD CONSTRAINT wellness_diagnostics_child_family_fk
      FOREIGN KEY (child_id, family_id)
      REFERENCES public.children(id, family_id)
      ON DELETE CASCADE
      NOT VALID;
  END IF;
END $$;

-- 3. Enforce composite foreign key `(child_id, family_id) -> public.children(id, family_id)`
-- on `public.bedtime_stories` (where `child_id` is nullable; when `child_id IS NOT NULL`,
-- PostgreSQL MATCH SIMPLE composite FK requires `(child_id, family_id)` to exist in `public.children`).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'bedtime_stories_child_family_fk'
      AND conrelid = 'public.bedtime_stories'::regclass
  ) THEN
    ALTER TABLE public.bedtime_stories
      ADD CONSTRAINT bedtime_stories_child_family_fk
      FOREIGN KEY (child_id, family_id)
      REFERENCES public.children(id, family_id)
      ON DELETE SET NULL (child_id)
      NOT VALID;
  END IF;
END $$;

-- 4. Defense-in-depth trigger function ensuring `child_id` always belongs to `family_id`
-- on INSERT or UPDATE for both `wellness_diagnostics` and `bedtime_stories`.
CREATE OR REPLACE FUNCTION private.enforce_child_belongs_to_family()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.child_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1
      FROM public.children c
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
$$;

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

-- 5. Supporting composite indexes for fast RLS and FK lookups
CREATE INDEX IF NOT EXISTS idx_wellness_diagnostics_child_family
  ON public.wellness_diagnostics(child_id, family_id);

CREATE INDEX IF NOT EXISTS idx_bedtime_stories_child_family
  ON public.bedtime_stories(child_id, family_id);

-- 6. Replace broad `FOR ALL` RLS policies on `public.wellness_diagnostics`
-- with explicit operation-specific policies verifying `(child_id, family_id)` ownership.
ALTER TABLE public.wellness_diagnostics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS wellness_diagnostics_family_all ON public.wellness_diagnostics;
DROP POLICY IF EXISTS wellness_diagnostics_all_own_family ON public.wellness_diagnostics;
DROP POLICY IF EXISTS wellness_diagnostics_select_family ON public.wellness_diagnostics;
DROP POLICY IF EXISTS wellness_diagnostics_insert_family ON public.wellness_diagnostics;
DROP POLICY IF EXISTS wellness_diagnostics_update_family ON public.wellness_diagnostics;
DROP POLICY IF EXISTS wellness_diagnostics_delete_family ON public.wellness_diagnostics;

CREATE POLICY wellness_diagnostics_select_family
  ON public.wellness_diagnostics
  FOR SELECT
  TO authenticated
  USING (
    family_id = (SELECT private.current_user_family_id())
    AND EXISTS (
      SELECT 1
      FROM public.children c
      WHERE c.id = wellness_diagnostics.child_id
        AND c.family_id = wellness_diagnostics.family_id
    )
  );

CREATE POLICY wellness_diagnostics_insert_family
  ON public.wellness_diagnostics
  FOR INSERT
  TO authenticated
  WITH CHECK (
    family_id = (SELECT private.current_user_family_id())
    AND EXISTS (
      SELECT 1
      FROM public.children c
      WHERE c.id = wellness_diagnostics.child_id
        AND c.family_id = wellness_diagnostics.family_id
    )
  );

CREATE POLICY wellness_diagnostics_update_family
  ON public.wellness_diagnostics
  FOR UPDATE
  TO authenticated
  USING (
    family_id = (SELECT private.current_user_family_id())
    AND EXISTS (
      SELECT 1
      FROM public.children c
      WHERE c.id = wellness_diagnostics.child_id
        AND c.family_id = wellness_diagnostics.family_id
    )
  )
  WITH CHECK (
    family_id = (SELECT private.current_user_family_id())
    AND EXISTS (
      SELECT 1
      FROM public.children c
      WHERE c.id = wellness_diagnostics.child_id
        AND c.family_id = wellness_diagnostics.family_id
    )
  );

CREATE POLICY wellness_diagnostics_delete_family
  ON public.wellness_diagnostics
  FOR DELETE
  TO authenticated
  USING (
    family_id = (SELECT private.current_user_family_id())
    AND EXISTS (
      SELECT 1
      FROM public.children c
      WHERE c.id = wellness_diagnostics.child_id
        AND c.family_id = wellness_diagnostics.family_id
    )
  );

-- 7. Replace broad `FOR ALL` RLS policies on `public.bedtime_stories`
-- with explicit operation-specific policies verifying `(child_id, family_id)` ownership
-- whenever `child_id IS NOT NULL`.
ALTER TABLE public.bedtime_stories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS bedtime_stories_family_all ON public.bedtime_stories;
DROP POLICY IF EXISTS bedtime_stories_all_own_family ON public.bedtime_stories;
DROP POLICY IF EXISTS bedtime_stories_select_family ON public.bedtime_stories;
DROP POLICY IF EXISTS bedtime_stories_insert_family ON public.bedtime_stories;
DROP POLICY IF EXISTS bedtime_stories_update_family ON public.bedtime_stories;
DROP POLICY IF EXISTS bedtime_stories_delete_family ON public.bedtime_stories;

CREATE POLICY bedtime_stories_select_family
  ON public.bedtime_stories
  FOR SELECT
  TO authenticated
  USING (
    family_id = (SELECT private.current_user_family_id())
    AND (
      child_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.children c
        WHERE c.id = bedtime_stories.child_id
          AND c.family_id = bedtime_stories.family_id
      )
    )
  );

CREATE POLICY bedtime_stories_insert_family
  ON public.bedtime_stories
  FOR INSERT
  TO authenticated
  WITH CHECK (
    family_id = (SELECT private.current_user_family_id())
    AND (
      child_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.children c
        WHERE c.id = bedtime_stories.child_id
          AND c.family_id = bedtime_stories.family_id
      )
    )
  );

CREATE POLICY bedtime_stories_update_family
  ON public.bedtime_stories
  FOR UPDATE
  TO authenticated
  USING (
    family_id = (SELECT private.current_user_family_id())
    AND (
      child_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.children c
        WHERE c.id = bedtime_stories.child_id
          AND c.family_id = bedtime_stories.family_id
      )
    )
  )
  WITH CHECK (
    family_id = (SELECT private.current_user_family_id())
    AND (
      child_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.children c
        WHERE c.id = bedtime_stories.child_id
          AND c.family_id = bedtime_stories.family_id
      )
    )
  );

CREATE POLICY bedtime_stories_delete_family
  ON public.bedtime_stories
  FOR DELETE
  TO authenticated
  USING (
    family_id = (SELECT private.current_user_family_id())
    AND (
      child_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.children c
        WHERE c.id = bedtime_stories.child_id
          AND c.family_id = bedtime_stories.family_id
      )
    )
  );

COMMIT;

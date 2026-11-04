-- ============================================================================
-- Migration: Backend RLS InitPlan Optimization & Query Indexes
-- Purpose:
-- 1. Wrap `private.current_user_family_id()` and `auth.uid()` in scalar subqueries
--    `(SELECT ...)` across workspace, home, and child life record RLS policies so
--    PostgreSQL evaluates them once per statement (InitPlan) rather than per row.
-- 2. Add targeted indexes for child deduplication, pending co-parent invitation
--    lookup, and dynamic content foreign keys.
-- Non-destructive: preserves all existing data, tables, and access semantics.
-- ============================================================================

-- 1. Targeted Composite & Foreign Key Indexes
CREATE INDEX IF NOT EXISTS idx_children_family_name_birth
  ON public.children (family_id, lower(name), birth);

CREATE INDEX IF NOT EXISTS idx_co_parent_pairings_pending_email
  ON public.co_parent_pairings (lower(partner_email), status)
  WHERE status = 'pending';

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'dynamic_content_items'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_dynamic_content_items_created_by ON public.dynamic_content_items (created_by) WHERE created_by IS NOT NULL';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_dynamic_content_items_updated_by ON public.dynamic_content_items (updated_by) WHERE updated_by IS NOT NULL';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'dynamic_content_reviews'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_dynamic_content_reviews_reviewer_user_id ON public.dynamic_content_reviews (reviewer_user_id) WHERE reviewer_user_id IS NOT NULL';
  END IF;
END $$;

-- 2. RLS InitPlan Optimization on `public.child_life_records`
DROP POLICY IF EXISTS child_life_records_select_own_family ON public.child_life_records;
CREATE POLICY child_life_records_select_own_family
  ON public.child_life_records FOR SELECT TO authenticated
  USING (
    family_id = (SELECT private.current_user_family_id())
    AND EXISTS (
      SELECT 1 FROM public.children c
      WHERE c.id = child_life_records.child_id
        AND c.family_id = child_life_records.family_id
    )
  );

DROP POLICY IF EXISTS child_life_records_insert_own_family ON public.child_life_records;
CREATE POLICY child_life_records_insert_own_family
  ON public.child_life_records FOR INSERT TO authenticated
  WITH CHECK (
    family_id = (SELECT private.current_user_family_id())
    AND (created_by IS NULL OR created_by = (SELECT auth.uid()))
    AND EXISTS (
      SELECT 1 FROM public.children c
      WHERE c.id = child_life_records.child_id
        AND c.family_id = child_life_records.family_id
    )
  );

DROP POLICY IF EXISTS child_life_records_update_own_family ON public.child_life_records;
CREATE POLICY child_life_records_update_own_family
  ON public.child_life_records FOR UPDATE TO authenticated
  USING (family_id = (SELECT private.current_user_family_id()))
  WITH CHECK (
    family_id = (SELECT private.current_user_family_id())
    AND EXISTS (
      SELECT 1 FROM public.children c
      WHERE c.id = child_life_records.child_id
        AND c.family_id = child_life_records.family_id
    )
  );

DROP POLICY IF EXISTS child_life_records_delete_own_family ON public.child_life_records;
CREATE POLICY child_life_records_delete_own_family
  ON public.child_life_records FOR DELETE TO authenticated
  USING (family_id = (SELECT private.current_user_family_id()));

-- 3. RLS InitPlan Optimization on `public.family_homes` & `public.child_home_schedules`
DROP POLICY IF EXISTS family_homes_select_own_family ON public.family_homes;
CREATE POLICY family_homes_select_own_family
  ON public.family_homes FOR SELECT TO authenticated
  USING (family_id = (SELECT private.current_user_family_id()));

DROP POLICY IF EXISTS family_homes_insert_own_family ON public.family_homes;
CREATE POLICY family_homes_insert_own_family
  ON public.family_homes FOR INSERT TO authenticated
  WITH CHECK (family_id = (SELECT private.current_user_family_id()));

DROP POLICY IF EXISTS family_homes_update_own_family ON public.family_homes;
CREATE POLICY family_homes_update_own_family
  ON public.family_homes FOR UPDATE TO authenticated
  USING (family_id = (SELECT private.current_user_family_id()))
  WITH CHECK (family_id = (SELECT private.current_user_family_id()));

DROP POLICY IF EXISTS family_homes_delete_own_family ON public.family_homes;
CREATE POLICY family_homes_delete_own_family
  ON public.family_homes FOR DELETE TO authenticated
  USING (family_id = (SELECT private.current_user_family_id()));

DROP POLICY IF EXISTS child_home_schedules_select_own_family ON public.child_home_schedules;
CREATE POLICY child_home_schedules_select_own_family
  ON public.child_home_schedules FOR SELECT TO authenticated
  USING (family_id = (SELECT private.current_user_family_id()));

DROP POLICY IF EXISTS child_home_schedules_insert_own_family ON public.child_home_schedules;
CREATE POLICY child_home_schedules_insert_own_family
  ON public.child_home_schedules FOR INSERT TO authenticated
  WITH CHECK (family_id = (SELECT private.current_user_family_id()));

DROP POLICY IF EXISTS child_home_schedules_update_own_family ON public.child_home_schedules;
CREATE POLICY child_home_schedules_update_own_family
  ON public.child_home_schedules FOR UPDATE TO authenticated
  USING (family_id = (SELECT private.current_user_family_id()))
  WITH CHECK (family_id = (SELECT private.current_user_family_id()));

DROP POLICY IF EXISTS child_home_schedules_delete_own_family ON public.child_home_schedules;
CREATE POLICY child_home_schedules_delete_own_family
  ON public.child_home_schedules FOR DELETE TO authenticated
  USING (family_id = (SELECT private.current_user_family_id()));

-- 4. RLS InitPlan Optimization on `public.family_shared_state` & `public.parent_private_state`
DROP POLICY IF EXISTS family_shared_state_select_own_family ON public.family_shared_state;
CREATE POLICY family_shared_state_select_own_family
  ON public.family_shared_state FOR SELECT TO authenticated
  USING (family_id = (SELECT private.current_user_family_id()));

DROP POLICY IF EXISTS family_shared_state_insert_own_family ON public.family_shared_state;
CREATE POLICY family_shared_state_insert_own_family
  ON public.family_shared_state FOR INSERT TO authenticated
  WITH CHECK (
    family_id = (SELECT private.current_user_family_id())
    AND updated_by = (SELECT auth.uid())
  );

DROP POLICY IF EXISTS family_shared_state_update_own_family ON public.family_shared_state;
CREATE POLICY family_shared_state_update_own_family
  ON public.family_shared_state FOR UPDATE TO authenticated
  USING (family_id = (SELECT private.current_user_family_id()))
  WITH CHECK (
    family_id = (SELECT private.current_user_family_id())
    AND updated_by = (SELECT auth.uid())
  );

DROP POLICY IF EXISTS parent_private_state_select_self ON public.parent_private_state;
CREATE POLICY parent_private_state_select_self
  ON public.parent_private_state FOR SELECT TO authenticated
  USING (
    auth_user_id = (SELECT auth.uid())
    AND family_id = (SELECT private.current_user_family_id())
  );

DROP POLICY IF EXISTS parent_private_state_insert_self ON public.parent_private_state;
CREATE POLICY parent_private_state_insert_self
  ON public.parent_private_state FOR INSERT TO authenticated
  WITH CHECK (
    auth_user_id = (SELECT auth.uid())
    AND family_id = (SELECT private.current_user_family_id())
  );

DROP POLICY IF EXISTS parent_private_state_update_self ON public.parent_private_state;
CREATE POLICY parent_private_state_update_self
  ON public.parent_private_state FOR UPDATE TO authenticated
  USING (
    auth_user_id = (SELECT auth.uid())
    AND family_id = (SELECT private.current_user_family_id())
  )
  WITH CHECK (
    auth_user_id = (SELECT auth.uid())
    AND family_id = (SELECT private.current_user_family_id())
  );

DROP POLICY IF EXISTS parent_private_state_delete_self ON public.parent_private_state;
CREATE POLICY parent_private_state_delete_self
  ON public.parent_private_state FOR DELETE TO authenticated
  USING (
    auth_user_id = (SELECT auth.uid())
    AND family_id = (SELECT private.current_user_family_id())
  );

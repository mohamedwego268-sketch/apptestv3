-- Index and RLS policy tuning for child life records.
BEGIN;
CREATE INDEX IF NOT EXISTS idx_child_life_records_child_family
  ON public.child_life_records(child_id, family_id);
CREATE INDEX IF NOT EXISTS idx_child_life_records_created_by
  ON public.child_life_records(created_by)
  WHERE created_by IS NOT NULL;
DROP POLICY IF EXISTS child_life_records_insert_own_family ON public.child_life_records;
CREATE POLICY child_life_records_insert_own_family
  ON public.child_life_records FOR INSERT TO authenticated
  WITH CHECK (
    family_id = private.current_user_family_id()
    AND (created_by IS NULL OR created_by = (SELECT auth.uid()))
    AND EXISTS (
      SELECT 1 FROM public.children c
      WHERE c.id = child_life_records.child_id
        AND c.family_id = child_life_records.family_id
    )
  );
COMMIT;

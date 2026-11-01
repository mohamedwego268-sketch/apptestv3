-- Validate deferred foreign keys and cover foreign-key lookups with indexes.
-- Preflight performed on the live database: all six constraints had zero orphan rows.
ALTER TABLE public.users VALIDATE CONSTRAINT fk_users_auth_user_id;
ALTER TABLE public.users VALIDATE CONSTRAINT fk_users_family_id;
ALTER TABLE public.families VALIDATE CONSTRAINT fk_families_created_by;
ALTER TABLE public.children VALIDATE CONSTRAINT fk_children_family_id;
ALTER TABLE public.extended_family VALIDATE CONSTRAINT fk_extended_family_family_id;
ALTER TABLE public.catalog_items VALIDATE CONSTRAINT fk_catalog_items_family_id;

CREATE INDEX IF NOT EXISTS idx_ai_bedtime_stories_family_id ON public.ai_bedtime_stories(family_id);
CREATE INDEX IF NOT EXISTS idx_battery_diagnostics_family_id ON public.battery_diagnostics(family_id);
CREATE INDEX IF NOT EXISTS idx_battery_diagnostics_user_id ON public.battery_diagnostics(user_id);
CREATE INDEX IF NOT EXISTS idx_bedtime_stories_child_id ON public.bedtime_stories(child_id);
CREATE INDEX IF NOT EXISTS idx_co_parent_pairings_invited_by_user_id ON public.co_parent_pairings(invited_by_user_id);
CREATE INDEX IF NOT EXISTS idx_co_parent_pairings_partner_user_id ON public.co_parent_pairings(partner_user_id);
CREATE INDEX IF NOT EXISTS idx_families_created_by ON public.families(created_by);
CREATE INDEX IF NOT EXISTS idx_wellness_diagnostics_child_id ON public.wellness_diagnostics(child_id);

ALTER POLICY users_select_own_or_family ON public.users
USING (
  auth_user_id = (SELECT auth.uid())
  OR (
    auth_user_id IS NOT NULL
    AND family_id IS NOT NULL
    AND family_id = private.current_user_family_id()
  )
);
ALTER POLICY users_update_self_only ON public.users
USING (
  auth_user_id = (SELECT auth.uid())
  AND family_id IS NOT NULL
  AND family_id = private.current_user_family_id()
)
WITH CHECK (
  auth_user_id = (SELECT auth.uid())
  AND family_id IS NOT NULL
  AND family_id = private.current_user_family_id()
);

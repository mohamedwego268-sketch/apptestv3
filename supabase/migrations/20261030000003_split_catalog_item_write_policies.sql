DROP POLICY IF EXISTS catalog_items_write_own_family ON public.catalog_items;

CREATE POLICY catalog_items_insert_own_family
ON public.catalog_items FOR INSERT
TO authenticated
WITH CHECK (family_id IS NOT NULL AND family_id = private.current_user_family_id());

CREATE POLICY catalog_items_update_own_family
ON public.catalog_items FOR UPDATE
TO authenticated
USING (family_id IS NOT NULL AND family_id = private.current_user_family_id())
WITH CHECK (family_id IS NOT NULL AND family_id = private.current_user_family_id());

CREATE POLICY catalog_items_delete_own_family
ON public.catalog_items FOR DELETE
TO authenticated
USING (family_id IS NOT NULL AND family_id = private.current_user_family_id());

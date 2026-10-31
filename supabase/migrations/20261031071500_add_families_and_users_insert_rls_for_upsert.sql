-- ============================================================================
-- Migration: 20261031071500_add_families_and_users_insert_rls_for_upsert.sql
-- Purpose:
--   1. Provide strict, least-privilege INSERT policies on `public.families` and
--      `public.users` so PostgreSQL `INSERT ... ON CONFLICT DO UPDATE` (`.upsert()`)
--      succeeds ONLY for the authenticated caller's already-verified family/profile
--      without allowing arbitrary family creation or unverified profile insertion.
--   2. Enforce immutable ownership columns (`id`, `auth_user_id`, `family_id`,
--      `created_by`) on `public.families`, `public.users`, and `public.children`
--      via a BEFORE UPDATE trigger so UPDATE/UPSERT payloads can never tamper
--      with ownership identifiers.
--   3. Provision the private `family-media` storage bucket (`public = false`)
--      and enforce strict family-isolated RLS policies on `storage.objects`
--      requiring `(storage.foldername(name))[1] = (SELECT private.current_user_family_id())::text`.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. Strict INSERT policies on `public.families` and `public.users` for UPSERT
-- ----------------------------------------------------------------------------
-- Note: New families and initial user profiles are created exclusively via the
-- verified `public.bootstrap_authenticated_family_space` / `public.accept_family_invitation`
-- RPCs. These INSERT policies intentionally require `private.current_user_family_id()`
-- to match so that `.upsert(..., { onConflict })` on an existing row passes
-- PostgreSQL's dual INSERT + UPDATE RLS requirement without permitting a browser
-- client to create an unbootstrapped family or claim another family's ID.

DROP POLICY IF EXISTS families_insert_own_family ON public.families;
CREATE POLICY families_insert_own_family
  ON public.families
  FOR INSERT
  TO authenticated
  WITH CHECK (
    id = (SELECT private.current_user_family_id())
  );

DROP POLICY IF EXISTS users_insert_self_only ON public.users;
CREATE POLICY users_insert_self_only
  ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth_user_id = (SELECT auth.uid())
    AND family_id IS NOT NULL
    AND family_id = (SELECT private.current_user_family_id())
    AND COALESCE(is_legacy_orphan, false) = false
  );

-- Ensure UPDATE policies on `public.families`, `public.users`, and `public.children`
-- enforce both USING and WITH CHECK against the authenticated family/user scope.
DROP POLICY IF EXISTS families_update_own_family ON public.families;
CREATE POLICY families_update_own_family
  ON public.families
  FOR UPDATE
  TO authenticated
  USING (id = (SELECT private.current_user_family_id()))
  WITH CHECK (id = (SELECT private.current_user_family_id()));

DROP POLICY IF EXISTS users_update_self_only ON public.users;
CREATE POLICY users_update_self_only
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (
    auth_user_id = (SELECT auth.uid())
    AND family_id IS NOT NULL
    AND family_id = (SELECT private.current_user_family_id())
    AND COALESCE(is_legacy_orphan, false) = false
  )
  WITH CHECK (
    auth_user_id = (SELECT auth.uid())
    AND family_id IS NOT NULL
    AND family_id = (SELECT private.current_user_family_id())
    AND COALESCE(is_legacy_orphan, false) = false
  );

DROP POLICY IF EXISTS children_update_own_family ON public.children;
CREATE POLICY children_update_own_family
  ON public.children
  FOR UPDATE
  TO authenticated
  USING (family_id = (SELECT private.current_user_family_id()))
  WITH CHECK (family_id = (SELECT private.current_user_family_id()));

-- ----------------------------------------------------------------------------
-- 2. Immutable Ownership Trigger on `families`, `users`, and `children`
-- ----------------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.prevent_ownership_column_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
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
      RAISE EXCEPTION 'IMMUTABLE_OWNERSHIP_VIOLATION: users.family_id cannot be reassigned once linked'
        USING ERRCODE = '42501';
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
$$;

REVOKE ALL ON FUNCTION private.prevent_ownership_column_mutation() FROM PUBLIC;

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

-- ----------------------------------------------------------------------------
-- 3. Private Family Media Storage Bucket & `storage.objects` RLS Policies
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'storage' AND table_name = 'buckets'
  ) THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'family-media',
      'family-media',
      false,
      10485760, -- 10 MB limit
      ARRAY[
        'image/jpeg',
        'image/png',
        'image/webp',
        'audio/webm',
        'audio/mp4',
        'audio/mpeg'
      ]
    )
    ON CONFLICT (id) DO UPDATE
    SET
      public = false,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'storage' AND table_name = 'objects'
  ) THEN
    DROP POLICY IF EXISTS family_media_select_own_family ON storage.objects;
    CREATE POLICY family_media_select_own_family
      ON storage.objects
      FOR SELECT
      TO authenticated
      USING (
        bucket_id = 'family-media'
        AND (SELECT private.current_user_family_id()) IS NOT NULL
        AND (storage.foldername(name))[1] = (SELECT private.current_user_family_id())::text
      );

    DROP POLICY IF EXISTS family_media_insert_own_family ON storage.objects;
    CREATE POLICY family_media_insert_own_family
      ON storage.objects
      FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'family-media'
        AND (SELECT private.current_user_family_id()) IS NOT NULL
        AND (storage.foldername(name))[1] = (SELECT private.current_user_family_id())::text
        AND owner = (SELECT auth.uid())
      );

    DROP POLICY IF EXISTS family_media_update_own_family ON storage.objects;
    CREATE POLICY family_media_update_own_family
      ON storage.objects
      FOR UPDATE
      TO authenticated
      USING (
        bucket_id = 'family-media'
        AND (SELECT private.current_user_family_id()) IS NOT NULL
        AND (storage.foldername(name))[1] = (SELECT private.current_user_family_id())::text
        AND owner = (SELECT auth.uid())
      )
      WITH CHECK (
        bucket_id = 'family-media'
        AND (SELECT private.current_user_family_id()) IS NOT NULL
        AND (storage.foldername(name))[1] = (SELECT private.current_user_family_id())::text
        AND owner = (SELECT auth.uid())
      );

    DROP POLICY IF EXISTS family_media_delete_own_family ON storage.objects;
    CREATE POLICY family_media_delete_own_family
      ON storage.objects
      FOR DELETE
      TO authenticated
      USING (
        bucket_id = 'family-media'
        AND (SELECT private.current_user_family_id()) IS NOT NULL
        AND (storage.foldername(name))[1] = (SELECT private.current_user_family_id())::text
      );
  END IF;
END $$;

COMMIT;

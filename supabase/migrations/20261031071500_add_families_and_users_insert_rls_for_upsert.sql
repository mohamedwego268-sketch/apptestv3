-- ============================================================================
-- Migration: 20261031071500_add_families_and_users_insert_rls_for_upsert.sql
-- Purpose:
--   1. Add strict least-privilege INSERT policies (`families_insert_own_family`
--      and `users_insert_self_only`) and hardened UPDATE policies so PostgreSQL
--      `INSERT ... ON CONFLICT DO UPDATE` (`.upsert()`) succeeds ONLY for the
--      authenticated user's verified family/profile and denies all unauthorized
--      or cross-family writes.
--   2. Enforce ownership column immutability (`id`, `auth_user_id`, `family_id`,
--      `created_by`) on `public.families`, `public.users`, and `public.children`
--      via `private.prevent_ownership_column_mutation()`, while permitting the
--      trusted server-side `private.accept_family_invitation_impl(text)` RPC to
--      link an unlinked or empty-bootstrap-family invitee into the inviting family.
--   3. Harden all SECURITY DEFINER functions (`private.current_user_family_id`,
--      `private.prevent_ownership_column_mutation`, `private.accept_family_invitation_impl`,
--      `private.bootstrap_authenticated_family_space`, `private.enforce_child_belongs_to_family`,
--      `private.create_default_family_home`) to use `SET search_path = ''` and
--      revoke anonymous execution on internal functions.
--   4. Resolve `public.catalog_items` write-permission conflict by removing
--      authenticated browser write policies (`catalog_items_insert_own_family`,
--      `catalog_items_update_own_family`, `catalog_items_delete_own_family`) and
--      revoking client write privileges so catalog mutations require `service_role`.
--   5. Provision private storage bucket `family-media` (`public = false`, 10 MB,
--      explicit MIME allowlist) and `storage.objects` RLS policies.
--   6. Add missing foreign-key indexes and `(SELECT auth.uid())` /
--      `(SELECT private.current_user_family_id())` RLS InitPlan optimizations.
-- ============================================================================

BEGIN;

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 1. Harden `private.current_user_family_id()` (`SET search_path = ''`)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.current_user_family_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT u.family_id
  FROM public.users AS u
  WHERE u.auth_user_id = (SELECT auth.uid())
    AND u.family_id IS NOT NULL
  ORDER BY u.created_at ASC
  LIMIT 1;
$function$;

REVOKE ALL ON FUNCTION private.current_user_family_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.current_user_family_id() TO authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 2. Ownership Immutability Trigger (`private.prevent_ownership_column_mutation`)
--    Protects `id`, `auth_user_id`, `family_id`, and `created_by` on
--    `public.families`, `public.users`, and `public.children`.
--    Permits `users.family_id` transition ONLY when executed inside the
--    SECURITY DEFINER `private.accept_family_invitation_impl(text)` RPC with
--    matching transaction-local transfer context for an empty solo family.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.prevent_ownership_column_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $function$
DECLARE
  v_trusted_user_id text;
  v_trusted_family_id text;
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
      v_trusted_user_id := pg_catalog.current_setting('nekbaar.invitation_transfer_user_id', true);
      v_trusted_family_id := pg_catalog.current_setting('nekbaar.invitation_transfer_target_family_id', true);

      -- Because this trigger function is SECURITY INVOKER:
      --   * Direct PostgREST client UPDATE/UPSERT runs with CURRENT_USER IN ('anon', 'authenticated', 'authenticator')
      --     and is unconditionally blocked from mutating a non-null family_id.
      --   * Validated co-parent transfer inside SECURITY DEFINER `private.accept_family_invitation_impl`
      --     runs as the function owner (not 'anon'/'authenticated') with exact transaction-local GUC values.
      IF CURRENT_USER IN ('anon', 'authenticated', 'authenticator')
         OR NEW.family_id IS NULL
         OR COALESCE(v_trusted_user_id, '') <> OLD.id::text
         OR COALESCE(v_trusted_family_id, '') <> NEW.family_id::text THEN
        RAISE EXCEPTION 'IMMUTABLE_OWNERSHIP_VIOLATION: users.family_id cannot be reassigned once linked'
          USING ERRCODE = '42501';
      END IF;
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
$function$;

REVOKE ALL ON FUNCTION private.prevent_ownership_column_mutation() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.prevent_ownership_column_mutation() TO authenticated, service_role;

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
-- 3. Harden Co-Parent Invitation Acceptance (`private.accept_family_invitation_impl`)
--    - Fixed empty `search_path = ''` with fully qualified schema references.
--    - Row locks on invitation, invitee profile, and family records.
--    - Allows unlinked (`family_id IS NULL`) or empty bootstrap family accounts
--      to accept a valid invitation while blocking accounts that already have
--      children, co-parents, extended family, or child records.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.accept_family_invitation_impl(p_token_hash text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_auth_uid uuid := auth.uid();
  v_invitation public.co_parent_pairings%ROWTYPE;
  v_auth_user auth.users%ROWTYPE;
  v_profile public.users%ROWTYPE;
  v_inviter_role text;
  v_email_matches boolean := false;
  v_phone_matches boolean := false;
  v_auth_phone_digits text;
  v_invite_phone_digits text;
BEGIN
  IF v_auth_uid IS NULL THEN
    RAISE EXCEPTION 'AUTH_REQUIRED: Sign in before accepting a family invitation.';
  END IF;

  IF p_token_hash IS NULL OR p_token_hash !~ '^[0-9a-f]{64}$' THEN
    RAISE EXCEPTION 'INVALID_INVITATION: The invitation code is invalid.';
  END IF;

  -- Serialize invitation acceptance per authenticated user
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext(v_auth_uid::text));

  SELECT * INTO v_invitation
  FROM public.co_parent_pairings
  WHERE pairing_token_hash = p_token_hash
  FOR UPDATE;

  IF NOT FOUND
     OR v_invitation.status <> 'pending'
     OR v_invitation.verified = true
     OR v_invitation.partner_user_id IS NOT NULL
     OR v_invitation.accepted_at IS NOT NULL
     OR v_invitation.expires_at <= pg_catalog.now() THEN
    RAISE EXCEPTION 'INVITATION_EXPIRED: This invitation is invalid, expired, or already used.';
  END IF;

  SELECT * INTO v_auth_user
  FROM auth.users
  WHERE id = v_auth_uid;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'AUTH_REQUIRED: Authenticated account was not found.';
  END IF;

  v_email_matches := COALESCE(
    COALESCE(v_invitation.partner_email, '') <> ''
    AND v_auth_user.email_confirmed_at IS NOT NULL
    AND pg_catalog.lower(COALESCE(v_auth_user.email, '')) = pg_catalog.lower(v_invitation.partner_email),
    false
  );

  v_auth_phone_digits := pg_catalog.regexp_replace(COALESCE(v_auth_user.phone, ''), '\D', '', 'g');
  v_invite_phone_digits := pg_catalog.regexp_replace(COALESCE(v_invitation.partner_phone, ''), '\D', '', 'g');
  v_phone_matches := COALESCE(
    COALESCE(v_invite_phone_digits, '') <> ''
    AND v_auth_user.phone_confirmed_at IS NOT NULL
    AND pg_catalog.length(v_auth_phone_digits) >= 9
    AND pg_catalog.length(v_invite_phone_digits) >= 9
    AND v_auth_phone_digits = v_invite_phone_digits,
    false
  );

  IF NOT (v_email_matches OR v_phone_matches) THEN
    RAISE EXCEPTION 'INVITATION_IDENTITY_MISMATCH: Sign in with the exact verified email or phone number that received this invitation.';
  END IF;

  SELECT * INTO v_profile
  FROM public.users
  WHERE auth_user_id = v_auth_uid
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'PROFILE_REQUIRED: Complete account setup before accepting a family invitation.';
  END IF;

  IF v_profile.id = v_invitation.invited_by_user_id THEN
    RAISE EXCEPTION 'SELF_INVITATION: You cannot accept your own invitation.';
  END IF;

  IF pg_catalog.lower(COALESCE(v_profile.role, '')) NOT IN ('father', 'mother') THEN
    RAISE EXCEPTION 'PARENT_ROLE_REQUIRED: Only a verified parent account can accept this co-parent invitation.';
  END IF;

  IF pg_catalog.lower(COALESCE(v_profile.role, '')) <> pg_catalog.lower(v_invitation.partner_role) THEN
    RAISE EXCEPTION 'ROLE_MISMATCH: This invitation was issued for a different parent role.';
  END IF;

  -- Lock target family row to serialize concurrent membership checks
  PERFORM 1
  FROM public.families
  WHERE id = v_invitation.family_id
  FOR UPDATE;

  SELECT pg_catalog.lower(COALESCE(u.role, '')) INTO v_inviter_role
  FROM public.users AS u
  WHERE u.id = v_invitation.invited_by_user_id
    AND u.family_id = v_invitation.family_id;

  IF v_inviter_role IS NULL
     OR v_inviter_role NOT IN ('father', 'mother')
     OR v_inviter_role = pg_catalog.lower(v_invitation.partner_role) THEN
    RAISE EXCEPTION 'INVITER_INVALID: The inviting parent is not an active member of this family.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.users AS u
    WHERE u.family_id = v_invitation.family_id
      AND pg_catalog.lower(COALESCE(u.role, '')) = pg_catalog.lower(v_invitation.partner_role)
      AND u.id <> v_profile.id
  ) THEN
    RAISE EXCEPTION 'PARENT_ALREADY_LINKED: This family already has a verified account for that parent role.';
  END IF;

  -- If the invitee is currently associated with a different family, verify that
  -- their existing family is an empty solo bootstrap family with zero data.
  IF v_profile.family_id IS NOT NULL AND v_profile.family_id <> v_invitation.family_id THEN
    PERFORM 1
    FROM public.families
    WHERE id = v_profile.family_id
    FOR UPDATE;

    IF EXISTS (SELECT 1 FROM public.children WHERE family_id = v_profile.family_id)
       OR EXISTS (SELECT 1 FROM public.extended_family WHERE family_id = v_profile.family_id)
       OR EXISTS (
         SELECT 1 FROM public.users AS u
         WHERE u.family_id = v_profile.family_id AND u.id <> v_profile.id
       )
       OR EXISTS (SELECT 1 FROM public.child_life_records WHERE family_id = v_profile.family_id)
       OR EXISTS (SELECT 1 FROM public.wellness_diagnostics WHERE family_id = v_profile.family_id)
       OR EXISTS (SELECT 1 FROM public.bedtime_stories WHERE family_id = v_profile.family_id)
       OR EXISTS (SELECT 1 FROM public.child_home_schedules WHERE family_id = v_profile.family_id)
       OR EXISTS (
         SELECT 1 FROM public.co_parent_pairings AS cp
         WHERE cp.family_id = v_profile.family_id AND cp.status = 'accepted'
       ) THEN
      RAISE EXCEPTION 'FAMILY_DATA_EXISTS: This account already has family or child data. A safe data merge is required before linking.';
    END IF;
  END IF;

  -- Authorize the narrow transaction-local family_id transition on `public.users`
  PERFORM pg_catalog.set_config('nekbaar.invitation_transfer_user_id', v_profile.id::text, true);
  PERFORM pg_catalog.set_config('nekbaar.invitation_transfer_target_family_id', v_invitation.family_id::text, true);

  UPDATE public.users
  SET family_id = v_invitation.family_id,
      updated_at = pg_catalog.now()
  WHERE id = v_profile.id;

  PERFORM pg_catalog.set_config('nekbaar.invitation_transfer_user_id', '', true);
  PERFORM pg_catalog.set_config('nekbaar.invitation_transfer_target_family_id', '', true);

  UPDATE public.parent_locations
  SET family_id = v_invitation.family_id,
      updated_at = pg_catalog.now()
  WHERE user_id = v_profile.id;

  UPDATE public.parent_private_state
  SET family_id = v_invitation.family_id,
      updated_at = pg_catalog.now()
  WHERE auth_user_id = v_auth_uid;

  UPDATE public.co_parent_pairings
  SET partner_user_id = v_profile.id,
      status = 'accepted',
      verified = true,
      accepted_at = pg_catalog.now()
  WHERE id = v_invitation.id;

  RETURN pg_catalog.jsonb_build_object(
    'accepted', true,
    'family_id', v_invitation.family_id,
    'profile_user_id', v_profile.id,
    'inviter_user_id', v_invitation.invited_by_user_id
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.accept_family_invitation(p_token_hash text)
RETURNS jsonb
LANGUAGE sql
SECURITY INVOKER
SET search_path = ''
AS $function$
  SELECT private.accept_family_invitation_impl(p_token_hash);
$function$;

REVOKE ALL ON FUNCTION private.accept_family_invitation_impl(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.accept_family_invitation_impl(text) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.accept_family_invitation(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.accept_family_invitation(text) TO authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 4. Harden Remaining SECURITY DEFINER Functions (`SET search_path = ''`)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.bootstrap_authenticated_family_space(
  p_full_name text,
  p_role text DEFAULT 'mother',
  p_family_name text DEFAULT NULL,
  p_country text DEFAULT 'SA',
  p_city text DEFAULT 'الدمام',
  p_currency text DEFAULT 'SAR',
  p_phone text DEFAULT NULL
)
RETURNS TABLE (
  user_id uuid,
  family_id uuid,
  is_new_family boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_auth_uid uuid := auth.uid();
  v_auth_email text := NULLIF(pg_catalog.btrim(COALESCE(auth.jwt() ->> 'email', '')), '');
  v_is_identity_verified boolean := false;
  v_clean_name text := NULLIF(pg_catalog.btrim(COALESCE(p_full_name, '')), '');
  v_clean_role text := CASE
    WHEN pg_catalog.lower(pg_catalog.btrim(COALESCE(p_role, ''))) IN ('father', 'dad', 'أب') THEN 'father'
    ELSE 'mother'
  END;
  v_clean_country text := CASE
    WHEN pg_catalog.upper(pg_catalog.btrim(COALESCE(p_country, ''))) = 'EG' THEN 'EG'
    ELSE 'SA'
  END;
  v_clean_currency text := CASE
    WHEN pg_catalog.upper(pg_catalog.btrim(COALESCE(p_currency, ''))) IN ('EGP', 'SAR', 'USD') THEN pg_catalog.upper(pg_catalog.btrim(p_currency))
    WHEN pg_catalog.upper(pg_catalog.btrim(COALESCE(p_country, ''))) = 'EG' THEN 'EGP'
    ELSE 'SAR'
  END;
  v_clean_city text := COALESCE(
    NULLIF(pg_catalog.btrim(p_city), ''),
    CASE WHEN v_clean_country = 'EG' THEN 'القاهرة' ELSE 'الدمام' END
  );
  v_clean_family_name text;
  v_existing_user_id uuid;
  v_existing_family_id uuid;
BEGIN
  IF v_auth_uid IS NULL THEN
    RAISE EXCEPTION 'UNAUTHENTICATED: Active Supabase Auth session (auth.uid()) is required.';
  END IF;

  IF v_clean_name IS NULL THEN
    RAISE EXCEPTION 'INVALID_INPUT: Parent full_name is required.';
  END IF;

  SELECT COALESCE(au.email_confirmed_at IS NOT NULL OR au.phone_confirmed_at IS NOT NULL, false)
    INTO v_is_identity_verified
  FROM auth.users AS au
  WHERE au.id = v_auth_uid
  LIMIT 1;

  IF NOT v_is_identity_verified THEN
    RAISE EXCEPTION 'IDENTITY_NOT_VERIFIED: Confirm your email address or phone number before creating a family.';
  END IF;

  v_clean_family_name := COALESCE(
    NULLIF(pg_catalog.btrim(p_family_name), ''),
    'أسرة ' || v_clean_name || ' — نكبر'
  );

  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext(v_auth_uid::text));

  SELECT u.id, u.family_id
    INTO v_existing_user_id, v_existing_family_id
  FROM public.users AS u
  WHERE u.auth_user_id = v_auth_uid
  LIMIT 1;

  IF v_existing_user_id IS NOT NULL AND v_existing_family_id IS NOT NULL THEN
    UPDATE public.users
    SET
      full_name = v_clean_name,
      role = v_clean_role,
      email = COALESCE(v_auth_email, email),
      phone = COALESCE(NULLIF(pg_catalog.btrim(p_phone), ''), phone),
      country = v_clean_country,
      verified = v_is_identity_verified,
      updated_at = pg_catalog.now()
    WHERE id = v_existing_user_id
      AND auth_user_id = v_auth_uid;

    RETURN QUERY SELECT v_existing_user_id, v_existing_family_id, false;
    RETURN;
  END IF;

  INSERT INTO public.families (
    family_name, country, city, currency, active_parent, created_by, updated_at
  )
  VALUES (
    v_clean_family_name, v_clean_country, v_clean_city, v_clean_currency,
    v_clean_role, v_auth_uid, pg_catalog.now()
  )
  RETURNING id INTO v_existing_family_id;

  IF v_existing_user_id IS NOT NULL THEN
    UPDATE public.users
    SET
      family_id = v_existing_family_id,
      full_name = v_clean_name,
      role = v_clean_role,
      email = v_auth_email,
      phone = NULLIF(pg_catalog.btrim(p_phone), ''),
      country = v_clean_country,
      verified = v_is_identity_verified,
      updated_at = pg_catalog.now()
    WHERE id = v_existing_user_id
      AND auth_user_id = v_auth_uid;
  ELSE
    INSERT INTO public.users (
      auth_user_id, family_id, full_name, role, email, phone, country, verified, updated_at
    )
    VALUES (
      v_auth_uid, v_existing_family_id, v_clean_name, v_clean_role,
      v_auth_email, NULLIF(pg_catalog.btrim(p_phone), ''), v_clean_country,
      v_is_identity_verified, pg_catalog.now()
    )
    RETURNING id INTO v_existing_user_id;
  END IF;

  RETURN QUERY SELECT v_existing_user_id, v_existing_family_id, true;
END;
$function$;

CREATE OR REPLACE FUNCTION public.bootstrap_authenticated_family_space(
  p_full_name text,
  p_role text DEFAULT 'mother',
  p_family_name text DEFAULT NULL,
  p_country text DEFAULT 'SA',
  p_city text DEFAULT 'الدمام',
  p_currency text DEFAULT 'SAR',
  p_phone text DEFAULT NULL
)
RETURNS TABLE(user_id uuid, family_id uuid, is_new_family boolean)
LANGUAGE sql
SECURITY INVOKER
SET search_path = ''
AS $function$
  SELECT * FROM private.bootstrap_authenticated_family_space(
    p_full_name, p_role, p_family_name, p_country, p_city, p_currency, p_phone
  );
$function$;

REVOKE ALL ON FUNCTION private.bootstrap_authenticated_family_space(text,text,text,text,text,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.bootstrap_authenticated_family_space(text,text,text,text,text,text,text) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.bootstrap_authenticated_family_space(text,text,text,text,text,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.bootstrap_authenticated_family_space(text,text,text,text,text,text,text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.enforce_child_belongs_to_family()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  IF NEW.child_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1
      FROM public.children AS c
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
$function$;

REVOKE ALL ON FUNCTION private.enforce_child_belongs_to_family() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.enforce_child_belongs_to_family() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.create_default_family_home()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
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

REVOKE ALL ON FUNCTION private.create_default_family_home() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.create_default_family_home() TO authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 5. Supporting Indexes for All Foreign Keys (Advisor Remediation)
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_parent_locations_family_id
  ON public.parent_locations(family_id);

CREATE INDEX IF NOT EXISTS idx_family_homes_created_by
  ON public.family_homes(created_by);

CREATE INDEX IF NOT EXISTS idx_child_home_schedules_created_by
  ON public.child_home_schedules(created_by);

CREATE INDEX IF NOT EXISTS idx_child_home_schedules_child_family
  ON public.child_home_schedules(child_id, family_id);

CREATE INDEX IF NOT EXISTS idx_children_current_home_family
  ON public.children(current_home_id, family_id);

CREATE INDEX IF NOT EXISTS idx_family_shared_state_updated_by
  ON public.family_shared_state(updated_by);

CREATE INDEX IF NOT EXISTS idx_child_life_records_created_by_full
  ON public.child_life_records(created_by);

-- ----------------------------------------------------------------------------
-- 6. RLS Policies: `families`, `users`, `children`, `catalog_items` & InitPlan Optimization
-- ----------------------------------------------------------------------------

-- 6.1 `public.families`
DROP POLICY IF EXISTS families_select_own_family ON public.families;
CREATE POLICY families_select_own_family
  ON public.families
  FOR SELECT
  TO authenticated
  USING (id = (SELECT private.current_user_family_id()));

DROP POLICY IF EXISTS families_insert_own_family ON public.families;
CREATE POLICY families_insert_own_family
  ON public.families
  FOR INSERT
  TO authenticated
  WITH CHECK (id = (SELECT private.current_user_family_id()));

DROP POLICY IF EXISTS families_update_own_family ON public.families;
CREATE POLICY families_update_own_family
  ON public.families
  FOR UPDATE
  TO authenticated
  USING (id = (SELECT private.current_user_family_id()))
  WITH CHECK (id = (SELECT private.current_user_family_id()));

-- 6.2 `public.users`
DROP POLICY IF EXISTS users_select_own_or_family ON public.users;
CREATE POLICY users_select_own_or_family
  ON public.users
  FOR SELECT
  TO authenticated
  USING (
    auth_user_id = (SELECT auth.uid())
    OR (
      auth_user_id IS NOT NULL
      AND family_id IS NOT NULL
      AND family_id = (SELECT private.current_user_family_id())
    )
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
  );

DROP POLICY IF EXISTS users_update_self_only ON public.users;
CREATE POLICY users_update_self_only
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (
    auth_user_id = (SELECT auth.uid())
    AND family_id IS NOT NULL
    AND family_id = (SELECT private.current_user_family_id())
  )
  WITH CHECK (
    auth_user_id = (SELECT auth.uid())
    AND family_id IS NOT NULL
    AND family_id = (SELECT private.current_user_family_id())
  );

-- 6.3 `public.children`
DROP POLICY IF EXISTS children_select_own_family ON public.children;
CREATE POLICY children_select_own_family
  ON public.children
  FOR SELECT
  TO authenticated
  USING (family_id = (SELECT private.current_user_family_id()));

DROP POLICY IF EXISTS children_insert_own_family ON public.children;
CREATE POLICY children_insert_own_family
  ON public.children
  FOR INSERT
  TO authenticated
  WITH CHECK (family_id = (SELECT private.current_user_family_id()));

DROP POLICY IF EXISTS children_update_own_family ON public.children;
CREATE POLICY children_update_own_family
  ON public.children
  FOR UPDATE
  TO authenticated
  USING (family_id = (SELECT private.current_user_family_id()))
  WITH CHECK (family_id = (SELECT private.current_user_family_id()));

DROP POLICY IF EXISTS children_delete_own_family ON public.children;
CREATE POLICY children_delete_own_family
  ON public.children
  FOR DELETE
  TO authenticated
  USING (family_id = (SELECT private.current_user_family_id()));

-- 6.4 `public.catalog_items` — Public read-only (`anon`, `authenticated`), `service_role` write-only
DROP POLICY IF EXISTS catalog_items_write_own_family ON public.catalog_items;
DROP POLICY IF EXISTS catalog_items_insert_own_family ON public.catalog_items;
DROP POLICY IF EXISTS catalog_items_update_own_family ON public.catalog_items;
DROP POLICY IF EXISTS catalog_items_delete_own_family ON public.catalog_items;
DROP POLICY IF EXISTS catalog_items_select_public ON public.catalog_items;
DROP POLICY IF EXISTS catalog_items_select_policy ON public.catalog_items;

CREATE POLICY catalog_items_select_policy
  ON public.catalog_items
  FOR SELECT
  TO anon, authenticated
  USING (true);

REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.catalog_items FROM anon, authenticated;
GRANT SELECT ON public.catalog_items TO anon, authenticated;

-- 6.5 Optimize the 10 RLS policies flagged by Supabase Performance Advisor (`(SELECT auth.uid())` & `(SELECT private.current_user_family_id())`)
DROP POLICY IF EXISTS parent_locations_select_self ON public.parent_locations;
CREATE POLICY parent_locations_select_self
  ON public.parent_locations
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = parent_locations.user_id
      AND u.auth_user_id = (SELECT auth.uid())
      AND u.family_id = parent_locations.family_id
  ));

DROP POLICY IF EXISTS parent_locations_insert_self ON public.parent_locations;
CREATE POLICY parent_locations_insert_self
  ON public.parent_locations
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = parent_locations.user_id
      AND u.auth_user_id = (SELECT auth.uid())
      AND u.family_id = parent_locations.family_id
  ));

DROP POLICY IF EXISTS parent_locations_update_self ON public.parent_locations;
CREATE POLICY parent_locations_update_self
  ON public.parent_locations
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = parent_locations.user_id
      AND u.auth_user_id = (SELECT auth.uid())
      AND u.family_id = parent_locations.family_id
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = parent_locations.user_id
      AND u.auth_user_id = (SELECT auth.uid())
      AND u.family_id = parent_locations.family_id
  ));

DROP POLICY IF EXISTS parent_locations_delete_self ON public.parent_locations;
CREATE POLICY parent_locations_delete_self
  ON public.parent_locations
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = parent_locations.user_id
      AND u.auth_user_id = (SELECT auth.uid())
      AND u.family_id = parent_locations.family_id
  ));

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

DROP POLICY IF EXISTS co_parent_pairings_insert_invitation ON public.co_parent_pairings;
CREATE POLICY co_parent_pairings_insert_invitation
  ON public.co_parent_pairings
  FOR INSERT TO authenticated
  WITH CHECK (
    family_id = (SELECT private.current_user_family_id())
    AND status = 'pending'
    AND verified = false
    AND partner_user_id IS NULL
    AND expires_at > now()
    AND expires_at <= now() + interval '48 hours'
    AND length(pairing_token_hash) = 64
    AND invited_by_user_id = (
      SELECT u.id FROM public.users u
      WHERE u.auth_user_id = (SELECT auth.uid())
        AND u.family_id = co_parent_pairings.family_id
      LIMIT 1
    )
    AND partner_role IN ('father','mother')
    AND partner_role <> (
      SELECT u.role FROM public.users u
      WHERE u.auth_user_id = (SELECT auth.uid())
        AND u.family_id = co_parent_pairings.family_id
      LIMIT 1
    )
  );

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

DROP POLICY IF EXISTS extended_family_all_own_family ON public.extended_family;
CREATE POLICY extended_family_all_own_family
  ON public.extended_family FOR ALL TO authenticated
  USING (family_id = (SELECT private.current_user_family_id()))
  WITH CHECK (family_id = (SELECT private.current_user_family_id()));

-- ----------------------------------------------------------------------------
-- 7. Private Family Media Storage Bucket (`family-media`) & `storage.objects` RLS
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
        'image/gif',
        'video/mp4',
        'video/webm',
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
        AND name IS NOT NULL
        AND name !~ '(^|/)\.\.(/|$)'
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
        AND name IS NOT NULL
        AND name !~ '(^|/)\.\.(/|$)'
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
        AND name IS NOT NULL
        AND name !~ '(^|/)\.\.(/|$)'
        AND (storage.foldername(name))[1] = (SELECT private.current_user_family_id())::text
        AND owner = (SELECT auth.uid())
      )
      WITH CHECK (
        bucket_id = 'family-media'
        AND (SELECT private.current_user_family_id()) IS NOT NULL
        AND name IS NOT NULL
        AND name !~ '(^|/)\.\.(/|$)'
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
        AND name IS NOT NULL
        AND name !~ '(^|/)\.\.(/|$)'
        AND (storage.foldername(name))[1] = (SELECT private.current_user_family_id())::text
      );
  END IF;
END $$;

COMMIT;

# Nekbaar (نكبر) — Phase 2 Implementation Plan: Database Contract, Secure Auth & Least-Privilege RLS

**Repository:** `mohamedwego268-sketch/apptestv3`  
**Supabase Project:** `qbwnzunusmaidciakuod`  
**Status:** Reviewable Plan & Proposed Migration (No Live Database Changes Executed)

---

## 1. Live Database vs. Application Code Contract Audit

A full inspection of `src/services/supabaseService.ts`, `src/services/MasterAppController.ts`, `src/services/OnboardingFlowController.ts`, and `supabase/schema.sql` against the **verified live database** (`public.users`, `public.families`, `public.children`, `auth.users`, and `pg_policies`) revealed the following critical mismatches:

### 1.1 Table-Level Schema Mismatches

| Table | Verified Live Columns | Legacy `supabase/schema.sql` | Frontend Code (`supabaseService.ts` / `MasterAppController.ts`) | Contract Mismatch |
| :--- | :--- | :--- | :--- | :--- |
| **`public.users`** | `id`, `auth_user_id`, `full_name`, `role`, `created_at` | `id TEXT`, `auth_uid UUID`, `family_id BIGINT`, `name`, `full_name`, `role`, `email`, `phone`, `phone_number`, `country`, `verified`, `updated_at` | Queries/upserts `id`, `family_id`, `name`, `full_name`, `role`, `email`, `phone`, `phone_number`, `country`, `verified` | **Critical**: Live `public.users` has **no `family_id` column**, uses `auth_user_id` (not `id = auth.uid()` and not `auth_uid`), and lacks `name`, `email`, `phone`, `phone_number`, `country`, `verified`. |
| **`public.families`** | `id`, `family_name`, `created_at` | `id BIGINT`, `family_name`, `country`, `city`, `currency`, `active_parent`, `pairing_token`, `updated_at` | Upserts `id`, `family_name`, `country`, `city`, `currency`, `active_parent`, `updated_at` | **Critical**: Live `public.families` lacks `country`, `city`, `currency`, `active_parent`, `updated_at`. Any upsert including those columns fails with PostgREST `PGRST204` (`column not found in schema cache`). |
| **`public.children`** | `id`, `family_id`, `name`, `age_stage`, `gender`, `passions_or_heroes`, `created_at` | `id BIGINT`, `family_id BIGINT`, `name`, `birth`, `gender`, `emoji`, `avatar_theme`, `interests`, `vaccinations_note`, `growth_height_cm`, `growth_weight_kg`, `updated_at` | Upserts/selects `id`, `family_id`, `name`, `birth`, `gender`, `emoji`, `avatar_theme`, `interests`, `vaccinations_note`, `growth_height_cm`, `growth_weight_kg` | **Critical**: Live `public.children` uses `age_stage` and `passions_or_heroes`, and lacks `birth`, `interests`, `emoji`, `avatar_theme`, `vaccinations_note`, `growth_height_cm`, `growth_weight_kg`. |
| **RLS (`pg_policies`)** | RLS **enabled**, **0 policies** in `pg_policies` | Permissive policies using `OR auth.uid() IS NOT NULL` and `user_metadata->>'family_id'` | Assumes direct client `.select()` and `.upsert()` succeed when authenticated | **Critical**: With RLS enabled and 0 policies in `pg_policies`, PostgreSQL enforces **default-deny** on all reads and writes for `anon` and `authenticated` roles. |

---

### 1.2 Operation-by-Operation Mismatches in Code

1. **`resolveVerifiedFamilyContext()` (`src/services/supabaseService.ts:252–331`)**:
   - Queries `.from('users').select('id, family_id').eq('id', authUid).limit(1)`.
   - **Fails on live DB** because:
     1. `public.users.family_id` does not exist (`42703: column users.family_id does not exist`).
     2. Live `public.users` stores the Supabase Auth UUID in `auth_user_id`, whereas `id` is the profile primary key.
     3. With zero `pg_policies`, `SELECT` on `public.users` returns 0 rows even for an authenticated user.

2. **Signup & Signin Flows (`authenticateParentWithSupabase`, `initiateGatewayEmailOrOAuthInSupabase`, `verifyGatewayEmailOtpInSupabase` in `src/services/supabaseService.ts:1285–1716`)**:
   - **Bootstrap Deadlock**: `authenticateParentWithSupabase` calls `supabaseClient.auth.signUp()`, then immediately calls `resolveVerifiedFamilyContext()`. A newly registered user has no `public.families` row and no `public.users` row yet, so `resolveVerifiedFamilyContext()` always returns `verifiedFamilyId: null`, aborting account setup before the family or user profile can ever be created.
   - **Email Confirmation / Null Session Handling**: When Supabase Auth email confirmation is active, `auth.signUp()` returns `data.user` (`UUID`) with `data.session = null`. Current code checks `signUpData?.session?.user?.id`, treating `session = null` as a generic failure instead of transitioning to a `PENDING_EMAIL_CONFIRMATION` step before attempting any database writes.
   - **Non-existent Columns on User Upsert**: `authenticateParentWithSupabase` upserts `{ id, family_id, name, full_name, role, email, phone, phone_number, country, verified }` into `public.users`, omitting `auth_user_id` and sending columns absent from live `public.users`.
   - **Hardcoded Fallback Password & Demo OTP**: `normalizeOnboardingAuthPayload` falls back to `'Nekbaar#2026'` when password is omitted, and `initiateGatewayEmailOrOAuthInSupabase` returns `demoOtpCode: '1234'` even when OTP dispatch fails.

3. **Family Creation & Profile Linking (`ensureSharedFamilyRecordInSupabase`, `saveOnboardingLocationToSupabase`, `fetchUsersFromSupabase` in `src/services/supabaseService.ts:338–521, 1732–1753`)**:
   - `ensureSharedFamilyRecordInSupabase` requires `resolveVerifiedFamilyContext()` to return a `verifiedFamilyId` *before* it upserts into `public.families`, making initial family creation impossible.
   - Upserts `country`, `city`, `currency`, `active_parent`, `updated_at` to `public.families`, which do not exist on live `public.families`.
   - `fetchUsersFromSupabase` filters `.eq('family_id', targetFamilyUuid)` on `public.users`, which lacks `family_id`.

4. **Child Creation, Updates & Reads (`fetchChildrenFromSupabase`, `saveOnboardingChildrenToSupabase`, `syncFamilySpaceToSupabase` in `src/services/supabaseService.ts:544–666, 1114–1147, 1776–1921`)**:
   - `saveOnboardingChildrenToSupabase` sends `{ family_id, name, birth, gender, emoji, avatar_theme, interests }` and `.select('id, name, birth')`. Live `public.children` requires/uses `age_stage` and `passions_or_heroes` and does not have `birth`, `emoji`, `avatar_theme`, or `interests`.
   - `fetchChildrenFromSupabase` does not read `row.passions_or_heroes` as a fallback for `interests` or `row.age_stage` when `birth` is absent.

5. **Family-Space Synchronization (`fetchFamilySpaceFromSupabase`, `syncFamilySpaceToSupabase` in `src/services/supabaseService.ts:768–1153`)**:
   - `fetchFamilySpaceFromSupabase` queries `public.extended_family` and `public.catalog_items` alongside `users`, `families`, and `children`.
   - `syncFamilySpaceToSupabase` writes to `families`, `users`, and `children` with non-existent columns and uses `id: authUserId` instead of `auth_user_id: authUserId` on `public.users`.

6. **Diagnostics, Bedtime Stories & Co-Parent Pairing (`MasterAppController.ts:620–995`, `supabaseService.ts:1951–2055`)**:
   - `MasterAppController.recomputeBatteryDiagnostics` writes `routine_score`, whereas `saveDiagnosticAssessment` writes `routine_completion_score`, `age_stage`, `status_level`, `recommendation_ar`, `recommendation_en` to `public.wellness_diagnostics`.
   - `MasterAppController.generateBedtimeStoryForChild` writes `id: "story-1-<timestamp>"` (non-UUID string) to `public.bedtime_stories`.
   - `linkCoParentAccountInSupabase` writes `partner_user_id: "parent-ahmad" | "parent-maryam"` and a predictable client string (`NEKBAAR-FAM-...`) to `public.co_parent_pairings` without verifying that the second parent authenticated or accepted an invite.

---

## 2. Secure Account Creation & Family Bootstrap Design

### 2.1 Primary Parent Registration Flow
1. **Step 1 — Real Supabase Auth Signup (`supabase.auth.signUp`)**:
   - Client calls `supabase.auth.signUp({ email, password })` with a real user-supplied password (no fallback password).
   - Client evaluates the response via `evaluateAuthSessionResponse()`:
     - **Case A (`user.id` UUID present, `session === null`)**: Email confirmation is enabled. Transition UI to `VERIFY_EMAIL_PENDING`. **Do not attempt any `public.*` table writes yet.** Once the user verifies their email via OTP (`supabase.auth.verifyOtp({ email, token, type: 'signup' | 'email' })`) or confirmation link, an active session JWT is issued.
     - **Case B (`user.id` UUID present, `session.access_token` present)**: Session is immediately active (`ACTIVE_SESSION_READY`).
2. **Step 2 — Atomic Family & Profile Bootstrap (`supabase.rpc('bootstrap_authenticated_family_space', ...)`)**:
   - Once an active session exists (`auth.uid() IS NOT NULL`), the client invokes the `SECURITY DEFINER` PostgreSQL function `public.bootstrap_authenticated_family_space(p_full_name, p_role, p_family_name, p_country, p_city, p_currency, p_phone)`.
   - Inside a single database transaction protected by `pg_advisory_xact_lock`:
     1. Checks if `public.users` already has a non-orphan row where `auth_user_id = auth.uid()`.
     2. If not found, inserts a new `public.families` row (`id = gen_random_uuid()`, `created_by = auth.uid()`) and inserts/updates the `public.users` row with `auth_user_id = auth.uid()` and `family_id = <new_family_uuid>`.
     3. Returns `(user_id UUID, family_id UUID, is_new_family BOOLEAN)`.
   - **Why an atomic RPC is required**: Under strict least-privilege RLS, a new user cannot `SELECT` a newly inserted `public.families` row before their `public.users.family_id` points to it, and cannot set `public.users.family_id` before `public.families` exists. Executing both inside `bootstrap_authenticated_family_space` prevents partially created accounts, race conditions, and overly permissive `INSERT/SELECT` policies on `public.families`.

### 2.2 Secure Second Parent (Co-Parent) Linking Flow
1. **Invitation Creation (Parent 1)**:
   - Authenticated Parent 1 creates an invitation in `public.family_invitations` storing `family_id = current_user_family_id()`, `invited_by_user_id`, `invited_email`, `invited_role`, `token_hash = sha256(raw_token)`, and `expires_at = NOW() + INTERVAL '48 hours'`.
2. **Invitation Acceptance (Parent 2)**:
   - Parent 2 signs up / signs in with their own Supabase Auth account (`auth.uid()`) using `invited_email`.
   - Parent 2 calls `supabase.rpc('accept_co_parent_invitation', { p_raw_token, p_full_name, p_phone })`.
   - The database function verifies:
     - `auth.uid() IS NOT NULL`
     - `LOWER(auth.jwt() ->> 'email') = LOWER(invited_email)`
     - `token_hash = encode(digest(p_raw_token, 'sha256'), 'hex')`
     - `status = 'pending'` and `expires_at > NOW()`
   - Upon verification, links Parent 2's `public.users` row (`auth_user_id = auth.uid()`) to `v_invite.family_id` and marks the invitation `accepted`.

---

## 3. Least-Privilege RLS Architecture

All RLS policies in `supabase/migrations/20261029000001_phase2_database_contract_and_rls.sql` derive family ownership strictly from `public.current_user_family_id()`:

```sql
SELECT u.family_id
FROM public.users u
WHERE u.auth_user_id = auth.uid()
  AND u.is_legacy_orphan = FALSE
  AND u.family_id IS NOT NULL
LIMIT 1;
```

- **`public.families`**:
  - `SELECT` / `UPDATE`: `id = public.current_user_family_id()` (`TO authenticated`).
  - Direct client `INSERT` / `DELETE`: Disabled (handled exclusively via `bootstrap_authenticated_family_space`).
- **`public.users`**:
  - `SELECT`: `is_legacy_orphan = FALSE AND (auth_user_id = auth.uid() OR (family_id IS NOT NULL AND family_id = public.current_user_family_id()))`.
  - `UPDATE`: `is_legacy_orphan = FALSE AND auth_user_id = auth.uid() AND family_id = public.current_user_family_id()` (a parent can only update their own user row, never another parent's row).
- **`public.children`**, **`public.extended_family`**, **`public.wellness_diagnostics`**, **`public.bedtime_stories`**:
  - `SELECT` / `INSERT` / `UPDATE` / `DELETE`: `family_id = public.current_user_family_id()` (`TO authenticated`).
- **`public.family_invitations`**:
  - `SELECT`: `family_id = public.current_user_family_id() OR LOWER(invited_email) = LOWER(COALESCE(auth.jwt() ->> 'email', ''))`.
  - `INSERT` / `UPDATE`: `family_id = public.current_user_family_id()`.
- **`public.catalog_items`**:
  - `SELECT`: `family_id IS NULL OR family_id = public.current_user_family_id()`.
  - `INSERT` / `UPDATE` / `DELETE`: `family_id IS NOT NULL AND family_id = public.current_user_family_id()`.

---

## 4. Handling Existing Public Records & Orphaned Profiles

Because `auth.users` currently has **zero records**, all existing rows in `public.users` are orphaned (they have no corresponding `auth.users` account and no `family_id` column).
- **Non-Destructive Quarantine**: The migration adds `is_legacy_orphan BOOLEAN NOT NULL DEFAULT FALSE` and `orphan_notes TEXT` to `public.users`, marks existing unlinked rows with `is_legacy_orphan = TRUE`, and sets any dangling `auth_user_id` (not present in `auth.users`) to `NULL` before adding `FOREIGN KEY (auth_user_id) REFERENCES auth.users(id)`.
- **Zero Cross-Family Leakage**: All RLS policies and helper functions filter `WHERE is_legacy_orphan = FALSE`, ensuring existing preserved rows are never exposed to new accounts until an explicit mapping decision is approved.

---

## 5. Decisions Requiring Approval Before Phase 3 Execution

1. **Orphaned Records Disposition (`public.users`, `public.families`, `public.children`)**:
   - Should the existing pre-Phase-2 rows in `public.users`, `public.families`, and `public.children` remain quarantined (`is_legacy_orphan = TRUE`) as historical/test artifacts, or should they be linked to a specific owner email once that owner registers in `auth.users`?
2. **`public.children` Dual-Column Retention (`passions_or_heroes` & `age_stage` vs. `interests` & `birth`)**:
   - The proposed migration keeps existing `age_stage` and `passions_or_heroes` columns intact while adding `birth`, `interests`, `emoji`, `avatar_theme`, `vaccinations_note`, `growth_height_cm`, and `growth_weight_kg`. Confirm whether `passions_or_heroes` and `interests` should remain mirrored on write.
3. **Supabase Auth Email Confirmation Setting**:
   - Confirm whether the Supabase project (`qbwnzunusmaidciakuod`) will use **Email OTP (6-digit code)** or **Instant Session on Signup** in production so the frontend onboarding wizard displays the exact verification step configured in the Supabase Auth dashboard.

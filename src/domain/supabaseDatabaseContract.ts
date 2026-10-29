import { ChildProfile, CountryCode, CurrencyCode, calculateChildAge } from './familySpaceCore';
import { SHARED_FAMILY_ID, isValidUuid } from '../services/supabaseService';

/**
 * ============================================================================
 * NEKBAAR PHASE 2 — VERIFIED LIVE DATABASE CONTRACT & SAFE MAPPING LAYER
 * ============================================================================
 * Reflects the verified live Supabase schema (`qbwnzunusmaidciakuod`) and
 * provides pure, testable contract validators and payload mappers for Phase 2.
 */

export const VERIFIED_LIVE_TABLE_COLUMNS = {
  users: ['id', 'auth_user_id', 'full_name', 'role', 'created_at'] as const,
  families: ['id', 'family_name', 'created_at'] as const,
  children: [
    'id',
    'family_id',
    'name',
    'age_stage',
    'gender',
    'passions_or_heroes',
    'created_at',
  ] as const,
} as const;

export const PHASE2_TARGET_TABLE_COLUMNS = {
  users: [
    'id',
    'auth_user_id',
    'family_id',
    'full_name',
    'role',
    'email',
    'phone',
    'country',
    'verified',
    'is_legacy_orphan',
    'created_at',
    'updated_at',
  ] as const,
  families: [
    'id',
    'family_name',
    'country',
    'city',
    'currency',
    'active_parent',
    'created_by',
    'created_at',
    'updated_at',
  ] as const,
  children: [
    'id',
    'family_id',
    'name',
    'age_stage',
    'birth',
    'gender',
    'passions_or_heroes',
    'interests',
    'emoji',
    'avatar_theme',
    'vaccinations_note',
    'growth_height_cm',
    'growth_weight_kg',
    'created_at',
    'updated_at',
  ] as const,
} as const;

/**
 * Live `public.users` row shape before/after Phase 2 additive migration.
 */
export interface DbUserContractRow {
  id: string;
  auth_user_id: string | null;
  family_id?: string | null;
  full_name: string;
  role: 'father' | 'mother' | string;
  email?: string | null;
  phone?: string | null;
  country?: CountryCode | null;
  verified?: boolean;
  is_legacy_orphan?: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Live `public.families` row shape before/after Phase 2 additive migration.
 */
export interface DbFamilyContractRow {
  id: string;
  family_name: string;
  country?: CountryCode;
  city?: string;
  currency?: CurrencyCode;
  active_parent?: 'mother' | 'father';
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * Live `public.children` row shape supporting both verified live columns
 * (`age_stage`, `passions_or_heroes`) and Phase 2 additive columns (`birth`, `interests`, etc.).
 */
export interface DbChildContractRow {
  id?: string;
  family_id: string;
  name: string;
  age_stage: string;
  gender: 'boy' | 'girl' | 'male' | 'female';
  passions_or_heroes: string;
  birth?: string | null;
  interests?: string | null;
  emoji?: string | null;
  avatar_theme?: ChildProfile['avatarTheme'] | null;
  vaccinations_note?: string | null;
  growth_height_cm?: number | null;
  growth_weight_kg?: number | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * Auth signup/signin outcome states for Phase 2 account creation.
 * Explicitly separates immediate session creation from pending email confirmation
 * so the client never attempts unauthenticated table writes when `session` is null.
 */
export type AuthAccountLifecycleStatus =
  | 'ACTIVE_SESSION_READY'
  | 'PENDING_EMAIL_CONFIRMATION'
  | 'UNAUTHENTICATED_OR_INVALID'
  | 'AUTH_ERROR';

export interface EvaluatedAuthSessionState {
  status: AuthAccountLifecycleStatus;
  authUserId: string | null;
  email: string | null;
  canProceedToFamilyBootstrap: boolean;
  requiresEmailVerificationPrompt: boolean;
  reason: string | null;
}

/**
 * Evaluates a Supabase `auth.signUp` or `auth.signInWithPassword` response.
 * Ensures:
 * 1. If `user.id` (valid UUID) AND `session.access_token` are present -> `ACTIVE_SESSION_READY`.
 * 2. If `user.id` (valid UUID) is present but `session` is null -> `PENDING_EMAIL_CONFIRMATION`
 *    (blocks premature table writes that would fail RLS or leave unlinked rows).
 * 3. Demo IDs (`parent-ahmad`, `parent-maryam`, `1`) are strictly rejected.
 */
export function evaluateAuthSessionResponse(input: {
  user?: { id?: unknown; email?: unknown; user_metadata?: Record<string, unknown> } | null;
  session?: { access_token?: unknown; user?: { id?: unknown; email?: unknown } | null } | null;
  error?: { message?: string } | null;
}): EvaluatedAuthSessionState {
  if (input.error?.message) {
    return {
      status: 'AUTH_ERROR',
      authUserId: null,
      email: null,
      canProceedToFamilyBootstrap: false,
      requiresEmailVerificationPrompt: false,
      reason: input.error.message,
    };
  }

  const rawUserId = input.session?.user?.id ?? input.user?.id;
  const rawEmail = input.session?.user?.email ?? input.user?.email;
  const cleanEmail = typeof rawEmail === 'string' && rawEmail.trim() ? rawEmail.trim() : null;

  if (!isValidUuid(rawUserId)) {
    return {
      status: 'UNAUTHENTICATED_OR_INVALID',
      authUserId: null,
      email: cleanEmail,
      canProceedToFamilyBootstrap: false,
      requiresEmailVerificationPrompt: false,
      reason: 'Missing or non-UUID auth user ID.',
    };
  }

  const hasValidAccessToken =
    typeof input.session?.access_token === 'string' &&
    input.session.access_token.trim().length > 0 &&
    isValidUuid(input.session?.user?.id) &&
    input.session.user.id.trim() === rawUserId.trim();

  if (!hasValidAccessToken) {
    return {
      status: 'PENDING_EMAIL_CONFIRMATION',
      authUserId: rawUserId.trim(),
      email: cleanEmail,
      canProceedToFamilyBootstrap: false,
      requiresEmailVerificationPrompt: true,
      reason:
        'Account created in auth.users, but email confirmation is required before an active session token is issued.',
    };
  }

  return {
    status: 'ACTIVE_SESSION_READY',
    authUserId: rawUserId.trim(),
    email: cleanEmail,
    canProceedToFamilyBootstrap: true,
    requiresEmailVerificationPrompt: false,
    reason: null,
  };
}

/**
 * Verifies family ownership strictly from the authenticated `auth.uid()` and the
 * `public.users` record (`auth_user_id` + `family_id`), rejecting:
 * - `localStorage` values
 * - `user_metadata.family_id`
 * - `SHARED_FAMILY_ID = 1`
 * - Orphaned profile rows where `auth_user_id` is null or does not match `auth.uid()`
 */
export function verifyDatabaseFamilyMembership(params: {
  sessionAuthUid: unknown;
  dbUserRow: Partial<DbUserContractRow> | null | undefined;
  localStorageFamilyId?: unknown;
  userMetadataFamilyId?: unknown;
}): {
  verified: boolean;
  authUserId: string | null;
  profileUserId: string | null;
  verifiedFamilyId: string | null;
  needsFamilyBootstrap: boolean;
  rejectionReason: string | null;
} {
  // Never trust localStorage or user_metadata.family_id
  void params.localStorageFamilyId;
  void params.userMetadataFamilyId;

  if (!isValidUuid(params.sessionAuthUid)) {
    return {
      verified: false,
      authUserId: null,
      profileUserId: null,
      verifiedFamilyId: null,
      needsFamilyBootstrap: false,
      rejectionReason: 'No valid authenticated session UUID (auth.uid()).',
    };
  }

  const authUid = params.sessionAuthUid.trim();

  if (!params.dbUserRow || typeof params.dbUserRow !== 'object') {
    return {
      verified: false,
      authUserId: authUid,
      profileUserId: null,
      verifiedFamilyId: null,
      needsFamilyBootstrap: true,
      rejectionReason: 'Authenticated user has no linked profile row in public.users yet.',
    };
  }

  if (params.dbUserRow.is_legacy_orphan) {
    return {
      verified: false,
      authUserId: authUid,
      profileUserId: null,
      verifiedFamilyId: null,
      needsFamilyBootstrap: true,
      rejectionReason: 'Profile row is marked as a legacy orphaned record and cannot be claimed implicitly.',
    };
  }

  const rowAuthUserId =
    typeof params.dbUserRow.auth_user_id === 'string'
      ? params.dbUserRow.auth_user_id.trim()
      : null;

  if (!isValidUuid(rowAuthUserId) || rowAuthUserId.toLowerCase() !== authUid.toLowerCase()) {
    return {
      verified: false,
      authUserId: authUid,
      profileUserId: null,
      verifiedFamilyId: null,
      needsFamilyBootstrap: true,
      rejectionReason: 'public.users.auth_user_id does not match authenticated auth.uid().',
    };
  }

  const rowProfileId =
    typeof params.dbUserRow.id === 'string' && isValidUuid(params.dbUserRow.id)
      ? params.dbUserRow.id.trim()
      : null;

  const rowFamilyId =
    typeof params.dbUserRow.family_id === 'string' ? params.dbUserRow.family_id.trim() : null;

  if (!isValidUuid(rowFamilyId) || rowFamilyId === String(SHARED_FAMILY_ID)) {
    return {
      verified: false,
      authUserId: authUid,
      profileUserId: rowProfileId,
      verifiedFamilyId: null,
      needsFamilyBootstrap: true,
      rejectionReason: 'Authenticated user profile has no verified UUID family_id in public.users.',
    };
  }

  return {
    verified: true,
    authUserId: authUid,
    profileUserId: rowProfileId,
    verifiedFamilyId: rowFamilyId,
    needsFamilyBootstrap: false,
    rejectionReason: null,
  };
}

/**
 * Maps a local `ChildProfile` (which uses numeric local `id` for UI linkage and `birth`/`interests`)
 * into a database payload compatible with `public.children`:
 * - Populates live columns `age_stage` and `passions_or_heroes`
 * - Populates Phase 2 additive columns (`birth`, `interests`, `emoji`, `avatar_theme`) when target mode is used
 * - Only includes `id` when `child.remoteId` is a valid UUID (never sends local numeric `1, 2, 3`).
 */
export function mapChildProfileToContractRow(
  child: Pick<ChildProfile, 'id' | 'name' | 'birth' | 'gender' | 'interests'> &
    Partial<
      Pick<
        ChildProfile,
        | 'remoteId'
        | 'emoji'
        | 'avatarTheme'
        | 'vaccinationsNote'
        | 'growthHeightCm'
        | 'growthWeightKg'
      >
    >,
  verifiedFamilyUuid: string,
  mode: 'live_minimal' | 'phase2_full' = 'phase2_full'
): DbChildContractRow {
  if (!isValidUuid(verifiedFamilyUuid)) {
    throw new Error('Verified UUID family_id is required to map a child database row.');
  }

  const ageInfo = calculateChildAge(child.birth || '2022-05-14', 'ar');
  const cleanInterests = (child.interests || '').trim();
  const gender: 'boy' | 'girl' = child.gender === 'girl' ? 'girl' : 'boy';

  const baseLiveRow: DbChildContractRow = {
    ...(isValidUuid(child.remoteId) ? { id: child.remoteId.trim() } : {}),
    family_id: verifiedFamilyUuid.trim(),
    name: (child.name || '').trim() || 'طفل',
    age_stage: ageInfo.stageCode,
    gender,
    passions_or_heroes: cleanInterests,
  };

  if (mode === 'live_minimal') {
    return baseLiveRow;
  }

  return {
    ...baseLiveRow,
    birth: child.birth || null,
    interests: cleanInterests,
    emoji: child.emoji || (gender === 'girl' ? '👧🏻' : '👦🏻'),
    avatar_theme: child.avatarTheme || (gender === 'girl' ? 'artist' : 'astronaut'),
    vaccinations_note: child.vaccinationsNote || '',
    growth_height_cm: typeof child.growthHeightCm === 'number' ? child.growthHeightCm : null,
    growth_weight_kg: typeof child.growthWeightKg === 'number' ? child.growthWeightKg : null,
  };
}

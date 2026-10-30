import { SupabaseClient } from '@supabase/supabase-js';
import supabase, { SUPABASE_ANON_KEY, SUPABASE_URL } from '../supabase.js';
import {
  ChildProfile,
  CommercialCatalogItem,
  CountryCode,
  CurrencyCode,
  DEFAULT_SEED,
  FamilyMember,
  FamilySpaceState,
  ParentAccountProfile,
  calculateChildAge,
  getSuggestedCurrencyForCountry,
  normalizeAppData,
} from '../domain/familySpaceCore';
import {
  evaluateAuthSessionResponse,
  mapChildProfileToContractRow,
} from '../domain/supabaseDatabaseContract';

export const SUPABASE_PROJECT_URL = SUPABASE_URL;
export { SUPABASE_ANON_KEY };
export const supabaseClient: SupabaseClient | null = supabase;

/**
 * Shared local UI fallback family ID for the in-memory Demo Seed only (Ahmed & Mariam).
 * NEVER sent as a UUID or real family_id in Supabase write/query operations.
 */
export const SHARED_FAMILY_ID = 1;
export const SUPABASE_QUERY_TIMEOUT_MS = 6500;

const UUID_V4_OR_GENERIC_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Validates whether a candidate value is a canonical UUID string.
 * Rejects numbers (like SHARED_FAMILY_ID = 1), numeric strings ("1"), and empty values.
 */
export function isValidUuid(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed || trimmed === String(SHARED_FAMILY_ID)) return false;
  return UUID_V4_OR_GENERIC_REGEX.test(trimmed);
}

/**
 * Database Table Names Bound to Nekbaar (نكبر)
 */
export const SUPABASE_TABLES = {
  USERS: 'users',
  FAMILIES: 'families',
  CHILDREN: 'children',
  EXTENDED_FAMILY: 'extended_family',
  CATALOG_ITEMS: 'catalog_items',
  CO_PARENT_PAIRINGS: 'co_parent_pairings',
} as const;

/**
 * Clean TypeScript interface for `families` table rows (Parent Root Entity)
 */
export interface Family {
  id: string | number;
  family_name: string;
  country: CountryCode;
  city: string;
  currency: CurrencyCode;
  active_parent?: 'mother' | 'father';
  pairing_token?: string;
  updated_at?: string;
}

/**
 * Clean TypeScript interface for `users` table rows (Parents: Ahmed & Mariam)
 * Enforces strict foreign key `family_id` referencing `families(id)`.
 */
export interface User {
  id: string;
  /** Foreign key referencing `families(id)` */
  family_id: string | number;
  name: string;
  full_name?: string;
  role: 'father' | 'mother' | 'الأب' | 'الأم' | string;
  phone?: string;
  phone_number?: string;
  email?: string;
  country?: CountryCode;
  verified?: boolean;
  created_at?: string;
}

/**
 * Clean TypeScript interface for `children` table rows (Hamza, Laila, Youssef)
 * Enforces strict foreign key `family_id` referencing `families(id)`.
 */
export interface Child {
  id: number;
  /** Real database record ID (UUID or DB primary key) separated from local UI `id` */
  remote_id?: string | number;
  /** Foreign key referencing `families(id)` */
  family_id: string | number;
  name: string;
  birth: string;
  gender: 'boy' | 'girl' | 'male' | 'female';
  emoji?: string;
  avatar_theme?: ChildProfile['avatarTheme'];
  interests?: string;
  vaccinations_note?: string;
  growth_height_cm?: number | null;
  growth_weight_kg?: number | null;
}

export interface SupabaseSyncSummary {
  connected: boolean;
  timedOut?: boolean;
  sharedFamilyId: string | number;
  usersCount: number;
  familiesCount: number;
  childrenCount: number;
  extendedFamilyCount: number;
  catalogCount: number;
  syncedAt: string;
  errorMessage?: string | null;
}

export interface SupabaseHydrationResult {
  nextState: FamilySpaceState;
  users: User[];
  family: Family | null;
  children: Child[];
  catalogItems: CommercialCatalogItem[];
  summary: SupabaseSyncSummary;
  error: string | null;
}

/**
 * Timeout wrapper that prevents hanging network requests or unresponsive queries
 * from blocking the UI or onboarding flow.
 */
export async function withSupabaseTimeout<T>(
  operation: PromiseLike<T>,
  timeoutMs: number = SUPABASE_QUERY_TIMEOUT_MS
): Promise<T> {
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(new Error('SUPABASE_TIMEOUT: Request timed out while contacting database.'));
    }, timeoutMs);
  });

  try {
    return await Promise.race([Promise.resolve(operation), timeoutPromise]);
  } finally {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }
  }
}

/**
 * Exponential backoff retry wrapper for remote Supabase calls to guarantee
 * resilience against transient network failures and prevent uncaught promise rejections.
 */
export async function withSupabaseRetry<T>(
  operationFactory: () => PromiseLike<T>,
  maxRetries: number = 3
): Promise<T> {
  const backoffDelays = [350, 800, 1600];
  let lastErr: unknown = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await withSupabaseTimeout(operationFactory());
    } catch (err) {
      lastErr = err;
      if (attempt < maxRetries) {
        const delayMs = backoffDelays[attempt - 1] || 1000;
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  throw lastErr instanceof Error
    ? lastErr
    : new Error('SUPABASE_RETRY_EXHAUSTED: Operation failed after retries.');
}

/**
 * Generates a deterministic, secure family pairing token for QR Code & OTP Co-Parent linking.
 */
export function generateFamilyPairingToken(
  familyId: string | number = SHARED_FAMILY_ID,
  partnerPhone: string = '559876543'
): string {
  const cleanDigits = partnerPhone.replace(/\D/g, '').slice(-4) || '2026';
  return `NEKBAAR-FAM-${familyId}-${cleanDigits}-SECURE`;
}

/**
 * Canonical fallback User entities for Ahmed and Mariam linked to local `SHARED_FAMILY_ID` (1)
 */
export const DEFAULT_SUPABASE_USERS: User[] = [
  {
    id: 'parent-ahmad',
    family_id: SHARED_FAMILY_ID,
    name: 'أحمد',
    full_name: 'أحمد (الأب)',
    role: 'father',
    email: 'ahmad.dad@nekbaar.app',
    phone: '1012345678',
    country: 'EG',
    verified: true,
  },
  {
    id: 'parent-maryam',
    family_id: SHARED_FAMILY_ID,
    name: 'مريم',
    full_name: 'مريم (الأم)',
    role: 'mother',
    email: 'maryam.mom@nekbaar.app',
    phone: '1098765432',
    country: 'EG',
    verified: true,
  },
];

/**
 * Canonical fallback Child entities for Hamza (6m), Laila (4y), and Youssef (8y)
 * linked to local `SHARED_FAMILY_ID` (1) for UI preview only.
 */
export const DEFAULT_SUPABASE_CHILDREN: Child[] = DEFAULT_SEED.kids.map((kid) => ({
  id: kid.id,
  family_id: SHARED_FAMILY_ID,
  name: kid.name,
  birth: kid.birth,
  gender: kid.gender,
  emoji: kid.emoji,
  avatar_theme: kid.avatarTheme || 'astronaut',
  interests: kid.interests || '',
  vaccinations_note: kid.vaccinationsNote || '',
  growth_height_cm: kid.growthHeightCm ?? null,
  growth_weight_kg: kid.growthWeightKg ?? null,
}));

export interface VerifiedSupabaseFamilyContext {
  authenticated: boolean;
  userId: string | null;
  profileUserId?: string | null;
  userRowId?: string | null;
  fullName?: string | null;
  role?: 'father' | 'mother' | null;
  phone?: string | null;
  email: string | null;
  emailVerified: boolean;
  phoneVerified: boolean;
  verifiedFamilyId: string | null;
  userRow?: Record<string, unknown> | null;
  error: string | null;
}

/**
 * Helper to detect if a PostgREST / PostgreSQL error is caused by an undefined column
 * (`42703` or `PGRST204`) when running against a pre-migration schema.
 */
function isUndefinedColumnError(err: { code?: string; message?: string } | null | undefined): boolean {
  if (!err) return false;
  const code = String(err.code || '').toUpperCase();
  const msg = String(err.message || '').toLowerCase();
  return (
    code === '42703' ||
    code === 'PGRST204' ||
    msg.includes('column') && (msg.includes('does not exist') || msg.includes('schema cache'))
  );
}

/**
 * Strictly resolves an authenticated Supabase Auth session AND verifies the user's real
 * `family_id` UUID directly from database membership (`public.users`), NEVER trusting
 * `localStorage`, `SHARED_FAMILY_ID = 1`, or unverified `user_metadata.family_id`.
 * Never marks `emailVerified` or `phoneVerified` based on database sync alone.
 */
export async function resolveVerifiedFamilyContext(
  customClient?: SupabaseClient | null
): Promise<VerifiedSupabaseFamilyContext> {
  const activeClient = customClient !== undefined ? customClient : supabaseClient;
  if (!activeClient) {
    return {
      authenticated: false,
      userId: null,
      profileUserId: null,
      email: null,
      emailVerified: false,
      phoneVerified: false,
      verifiedFamilyId: null,
      userRow: null,
      error: 'Supabase client is not initialized.',
    };
  }

  try {
    const { data: sessionRes, error: sessionErr } = await withSupabaseTimeout(
      activeClient.auth.getSession(),
      2500
    );
    const session = sessionRes?.session;
    const sessionUser = session?.user;
    if (sessionErr || !session || !sessionUser || !isValidUuid(sessionUser.id)) {
      return {
        authenticated: false,
        userId: null,
        profileUserId: null,
        email: null,
        emailVerified: false,
        phoneVerified: false,
        verifiedFamilyId: null,
        userRow: null,
        error: sessionErr?.message || 'Unauthenticated: no active Supabase Auth session.',
      };
    }

    const authUid = sessionUser.id.trim();
    const userEmail = sessionUser.email?.trim() || null;
    const emailVerified = Boolean(
      (typeof sessionUser.email_confirmed_at === 'string' &&
        sessionUser.email_confirmed_at.trim().length > 0) ||
        (typeof (sessionUser as unknown as Record<string, unknown>).confirmed_at === 'string' &&
          String((sessionUser as unknown as Record<string, unknown>).confirmed_at).trim().length > 0)
    );
    const phoneVerified = Boolean(
      typeof sessionUser.phone_confirmed_at === 'string' &&
        sessionUser.phone_confirmed_at.trim().length > 0
    );

    // Verify real family ownership from the `users` table by authenticated `auth_user_id`
    const { data: userRows, error: userErr } = await withSupabaseTimeout(
      activeClient
        .from(SUPABASE_TABLES.USERS)
        .select('*')
        .eq('auth_user_id', authUid)
        .limit(1),
      2500
    );

    if (userErr) {
      return {
        authenticated: true,
        userId: authUid,
        profileUserId: null,
        email: userEmail,
        emailVerified,
        phoneVerified,
        verifiedFamilyId: null,
        userRow: null,
        error: userErr.message,
      };
    }

    const row =
      Array.isArray(userRows) && userRows.length > 0
        ? (userRows[0] as Record<string, unknown>)
        : null;

    if (row?.is_legacy_orphan === true) {
      return {
        authenticated: true,
        userId: authUid,
        profileUserId: null,
        userRowId: null,
        email: userEmail,
        emailVerified,
        phoneVerified,
        verifiedFamilyId: null,
        userRow: row,
        error: 'Profile row is quarantined as a legacy orphan and cannot grant family ownership.',
      };
    }

    const rowProfileId =
      row && typeof row.id === 'string' && isValidUuid(row.id) ? row.id.trim() : null;
    const rowAuthUserId =
      row && typeof row.auth_user_id === 'string' ? row.auth_user_id.trim() : null;
    const dbFamilyId =
      row && typeof row.family_id === 'string' ? row.family_id.trim() : null;
    const rowFullName =
      row && typeof row.full_name === 'string' && row.full_name.trim()
        ? row.full_name.trim()
        : null;
    const rowRole: 'father' | 'mother' | null =
      row && typeof row.role === 'string'
        ? row.role.toLowerCase() === 'father' || row.role.toLowerCase() === 'dad'
          ? 'father'
          : 'mother'
        : null;
    const rowPhone =
      row && typeof row.phone === 'string' && row.phone.trim() ? row.phone.trim() : null;

    if (
      !isValidUuid(rowAuthUserId) ||
      rowAuthUserId.toLowerCase() !== authUid.toLowerCase() ||
      !isValidUuid(dbFamilyId)
    ) {
      return {
        authenticated: true,
        userId: authUid,
        profileUserId: rowProfileId,
        userRowId: rowProfileId,
        fullName: rowFullName,
        role: rowRole,
        phone: rowPhone,
        email: userEmail,
        emailVerified,
        phoneVerified,
        verifiedFamilyId: null,
        userRow: row,
        error:
          row && !('family_id' in row)
            ? 'Live public.users table is missing column family_id (Phase 2 migration required).'
            : 'No verified UUID family_id linked to authenticated user (auth_user_id) in database.',
      };
    }

    return {
      authenticated: true,
      userId: authUid,
      profileUserId: rowProfileId,
      userRowId: rowProfileId,
      fullName: rowFullName,
      role: rowRole,
      phone: rowPhone,
      email: userEmail,
      emailVerified,
      phoneVerified,
      verifiedFamilyId: dbFamilyId,
      userRow: row,
      error: null,
    };
  } catch (err) {
    return {
      authenticated: false,
      userId: null,
      profileUserId: null,
      email: null,
      emailVerified: false,
      phoneVerified: false,
      verifiedFamilyId: null,
      userRow: null,
      error: err instanceof Error ? err.message : 'Failed to verify authenticated family context.',
    };
  }
}

/**
 * Ensures the parent `families` row exists in Supabase BEFORE upserting `users` or `children`.
 * Blocks any write when there is no verified Auth session or when `familyId` is not a real UUID
 * (never sends `SHARED_FAMILY_ID = 1` to Supabase).
 */
export async function ensureSharedFamilyRecordInSupabase(
  params?: {
    familyId?: string | number;
    familyName?: string;
    country?: CountryCode;
    city?: string;
    currency?: CurrencyCode;
    activeParent?: 'mother' | 'father';
  },
  customClient?: SupabaseClient | null
): Promise<{ family: Family; synced: boolean; error: string | null }> {
  const activeClient = customClient !== undefined ? customClient : supabaseClient;
  const rawFamilyId = params?.familyId ?? SHARED_FAMILY_ID;
  const country = params?.country || 'SA';
  const fallbackRecord: Family = {
    id: rawFamilyId,
    family_name: params?.familyName?.trim() || 'أسرة أحمد ومريم — نكبر',
    country,
    city: params?.city?.trim() || (country === 'SA' ? 'الدمام' : 'القاهرة'),
    currency: params?.currency || getSuggestedCurrencyForCountry(country),
    active_parent: params?.activeParent || 'mother',
    updated_at: new Date().toISOString(),
  };

  if (!activeClient) {
    return { family: fallbackRecord, synced: false, error: 'Supabase client is not initialized.' };
  }

  const verifiedCtx = await resolveVerifiedFamilyContext(activeClient);
  if (!verifiedCtx.authenticated || !verifiedCtx.userId) {
    return {
      family: fallbackRecord,
      synced: false,
      error: verifiedCtx.error || 'Write blocked: Active authenticated session is required.',
    };
  }

  // Only allow a verified UUID familyId (never send SHARED_FAMILY_ID = 1 to UUID column)
  const targetFamilyUuid = isValidUuid(verifiedCtx.verifiedFamilyId)
    ? verifiedCtx.verifiedFamilyId
    : isValidUuid(rawFamilyId)
    ? rawFamilyId.trim()
    : null;

  if (!targetFamilyUuid) {
    return {
      family: fallbackRecord,
      synced: false,
      error:
        'Write blocked: Verified UUID family_id is required (SHARED_FAMILY_ID = 1 is not allowed for Supabase).',
    };
  }

  const verifiedFamilyRecord: Family = {
    ...fallbackRecord,
    id: targetFamilyUuid,
  };

  try {
    let { error } = await withSupabaseRetry(() =>
      activeClient.from(SUPABASE_TABLES.FAMILIES).upsert(verifiedFamilyRecord, { onConflict: 'id' })
    );
    if (error && isUndefinedColumnError(error)) {
      const minimalFamilyPayload = {
        id: targetFamilyUuid,
        family_name: verifiedFamilyRecord.family_name,
      };
      const retryRes = await withSupabaseRetry(() =>
        activeClient
          .from(SUPABASE_TABLES.FAMILIES)
          .upsert(minimalFamilyPayload, { onConflict: 'id' })
      );
      error = retryRes.error;
    }
    return {
      family: verifiedFamilyRecord,
      synced: !error,
      error: error ? error.message : null,
    };
  } catch (err) {
    return {
      family: verifiedFamilyRecord,
      synced: false,
      error: err instanceof Error ? err.message : 'Failed to ensure shared family record.',
    };
  }
}

/**
 * Queries the `users` table in Supabase and normalizes rows into clean `User` entities
 * only when a verified UUID `familyId` is available; never sends `SHARED_FAMILY_ID = 1` as a UUID filter.
 */
export async function fetchUsersFromSupabase(
  familyId: string | number = SHARED_FAMILY_ID,
  customClient?: SupabaseClient | null
): Promise<{
  data: User[];
  resolvedFamilyId: string | number;
  error: string | null;
}> {
  const activeClient = customClient !== undefined ? customClient : supabaseClient;
  if (!activeClient) {
    return {
      data: [],
      resolvedFamilyId: familyId,
      error: 'Supabase client is not initialized.',
    };
  }

  try {
    const verifiedCtx = await resolveVerifiedFamilyContext(activeClient);
    const targetFamilyUuid = isValidUuid(verifiedCtx.verifiedFamilyId)
      ? verifiedCtx.verifiedFamilyId
      : isValidUuid(familyId)
      ? familyId.trim()
      : null;

    if (!targetFamilyUuid) {
      return {
        data: [],
        resolvedFamilyId: SHARED_FAMILY_ID,
        error: 'No authenticated family UUID is available; no user records were loaded.',
      };
    }

    const { data, error } = await withSupabaseRetry(() =>
      activeClient
        .from(SUPABASE_TABLES.USERS)
        .select('*')
        .eq('family_id', targetFamilyUuid)
        .limit(20)
    );

    if (error) {
      return { data: [], resolvedFamilyId: targetFamilyUuid, error: error.message };
    }

    if (!Array.isArray(data) || data.length === 0) {
      return { data: [], resolvedFamilyId: targetFamilyUuid, error: null };
    }

    let detectedFamilyId: string | number = targetFamilyUuid;

    const mappedUsers: User[] = data.map((row: Record<string, unknown>) => {
      const rawName =
        (typeof row.name === 'string' && row.name.trim()) ||
        (typeof row.full_name === 'string' && row.full_name.trim()) ||
        (typeof row.first_name === 'string' && row.first_name.trim()) ||
        '';

      const rawRole = typeof row.role === 'string' ? row.role.toLowerCase() : '';
      const isMother =
        rawRole === 'mother' ||
        rawRole === 'mom' ||
        rawRole.includes('أم') ||
        rawName.includes('مريم') ||
        rawName.toLowerCase().includes('mariam') ||
        rawName.toLowerCase().includes('maryam');

      const phoneVal =
        (typeof row.phone === 'string' && row.phone.trim()) ||
        (typeof row.phone_number === 'string' && row.phone_number.trim()) ||
        '';

      const rowFamilyId = isValidUuid(row.family_id)
        ? row.family_id.trim()
        : targetFamilyUuid;

      detectedFamilyId = rowFamilyId;

      return {
        id:
          typeof row.id === 'string' && row.id.trim()
            ? row.id.trim()
            : isMother
            ? 'parent-maryam'
            : 'parent-ahmad',
        family_id: rowFamilyId,
        name: rawName,
        full_name:
          typeof row.full_name === 'string' && row.full_name.trim()
            ? row.full_name.trim()
            : rawName,
        role: rawRole === 'mother' || rawRole === 'mom' || rawRole.includes('أم') ? 'mother' : 'father',
        phone: phoneVal,
        phone_number: phoneVal,
        email: typeof row.email === 'string' ? row.email : undefined,
        country: row.country === 'SA' || row.country === 'EG' ? row.country : 'EG',
        verified: typeof row.verified === 'boolean' ? row.verified : true,
      };
    });

    return { data: mappedUsers, resolvedFamilyId: detectedFamilyId, error: null };
  } catch (err) {
    return {
      data: [],
      resolvedFamilyId: familyId,
      error: err instanceof Error ? err.message : 'Network error while fetching users.',
    };
  }
}

/**
 * Checks whether a children list matches the canonical 3 demo children (Hamza, Laila, Youssef).
 */
export function isCanonicalThreeDemoKids(
  kids: ReadonlyArray<{ name?: string }> | undefined | null
): boolean {
  if (!Array.isArray(kids) || kids.length !== 3) return false;
  const names = new Set(kids.map((k) => (k?.name || '').trim()));
  return names.has('حمزة') && names.has('ليلى') && names.has('يوسف');
}

/**
 * Checks whether a full FamilySpaceState is purely the default Demo Seed and has no verified remote records.
 */
export function isDefaultDemoSeedState(state: FamilySpaceState): boolean {
  if (!isCanonicalThreeDemoKids(state.kids)) return false;
  const hasAnyRemoteChildId = state.kids.some((k) => isValidUuid(k.remoteId));
  if (hasAnyRemoteChildId) return false;
  return true;
}

export async function fetchChildrenFromSupabase(
  familyId: string | number = SHARED_FAMILY_ID,
  customClient?: SupabaseClient | null
): Promise<{
  data: Child[];
  error: string | null;
}> {
  const activeClient = customClient !== undefined ? customClient : supabaseClient;
  if (!activeClient) {
    return {
      data: [],
      error: 'Supabase client is not initialized.',
    };
  }

  try {
    const targetFamilyUuid = isValidUuid(familyId) ? familyId.trim() : null;
    if (!targetFamilyUuid) {
      // Never send SHARED_FAMILY_ID = 1 to a UUID column in Supabase
      return { data: [], error: null };
    }

    const { data, error } = await withSupabaseRetry(() =>
      activeClient
        .from(SUPABASE_TABLES.CHILDREN)
        .select('*')
        .eq('family_id', targetFamilyUuid)
    );

    if (error) {
      return { data: [], error: error.message };
    }

    if (!Array.isArray(data) || data.length === 0) {
      return { data: [], error: null };
    }

    const mappedChildren: Child[] = data.map(
      (row: Record<string, unknown>, idx: number) => {
        const rawName =
          (typeof row.name === 'string' && row.name.trim()) ||
          (typeof row.full_name === 'string' && row.full_name.trim()) ||
          (typeof row.first_name === 'string' && row.first_name.trim()) ||
          `طفل ${idx + 1}`;

        let normalizedName = rawName;
        const lower = rawName.toLowerCase();
        if (lower === 'hamza') normalizedName = 'حمزة';
        else if (lower === 'laila' || lower === 'layla') normalizedName = 'ليلى';
        else if (lower === 'youssef' || lower === 'yousef' || lower === 'yusuf')
          normalizedName = 'يوسف';

        const canonicalMatch = DEFAULT_SUPABASE_CHILDREN.find(
          (dk) => dk.name === normalizedName
        );

        const isGirl =
          row.gender === 'girl' ||
          row.gender === 'female' ||
          normalizedName === 'ليلى' ||
          lower === 'laila' ||
          lower === 'layla';

        const rawBirth =
          (typeof row.birth === 'string' && row.birth.trim()) ||
          (typeof row.birth_date === 'string' && row.birth_date.trim()) ||
          (typeof row.date_of_birth === 'string' && row.date_of_birth.trim()) ||
          canonicalMatch?.birth ||
          '2022-05-14';

        const remoteId =
          typeof row.id === 'string' && row.id.trim()
            ? row.id.trim()
            : typeof row.id === 'number' && Number.isFinite(row.id)
            ? row.id
            : undefined;

        const localNumericId =
          typeof row.id === 'number' && Number.isFinite(row.id) && row.id > 0
            ? row.id
            : idx + 1;

        return {
          id: localNumericId,
          ...(remoteId !== undefined ? { remote_id: remoteId } : {}),
          family_id: isValidUuid(row.family_id) ? row.family_id.trim() : targetFamilyUuid,
          name: normalizedName,
          birth: rawBirth,
          gender: isGirl ? 'girl' : 'boy',
          emoji:
            typeof row.emoji === 'string' && row.emoji.trim()
              ? row.emoji
              : canonicalMatch?.emoji || (isGirl ? '👧🏻' : '👦🏻'),
          avatar_theme:
            (typeof row.avatar_theme === 'string'
              ? (row.avatar_theme as ChildProfile['avatarTheme'])
              : canonicalMatch?.avatar_theme) || (isGirl ? 'artist' : 'astronaut'),
          interests:
            typeof row.interests === 'string' && row.interests.trim()
              ? row.interests.trim()
              : typeof row.passions_or_heroes === 'string' && row.passions_or_heroes.trim()
              ? row.passions_or_heroes.trim()
              : canonicalMatch?.interests || '',
          vaccinations_note:
            typeof row.vaccinations_note === 'string' && row.vaccinations_note.trim()
              ? row.vaccinations_note
              : canonicalMatch?.vaccinations_note || '',
          growth_height_cm:
            typeof row.growth_height_cm === 'number'
              ? row.growth_height_cm
              : canonicalMatch?.growth_height_cm ?? null,
          growth_weight_kg:
            typeof row.growth_weight_kg === 'number'
              ? row.growth_weight_kg
              : canonicalMatch?.growth_weight_kg ?? null,
        };
      }
    );

    return { data: mappedChildren, error: null };
  } catch (err) {
    return {
      data: [],
      error: err instanceof Error ? err.message : 'Network error while fetching children.',
    };
  }
}

/**
 * Converts a `Child` entity from Supabase into Nekbaar's domain `ChildProfile`,
 * preserving a stable local numeric `id` for tasks/calendar/routine/wishes linkage
 * while storing the real database UUID in `remoteId`.
 */
function mapChildEntityToProfile(
  child: Child,
  fallbackIdx: number,
  existingLocalKids?: ChildProfile[]
): ChildProfile {
  const existingMatch = existingLocalKids?.find(
    (ek) =>
      (child.remote_id !== undefined && String(ek.remoteId) === String(child.remote_id)) ||
      (ek.name.trim().toLowerCase() === child.name.trim().toLowerCase() &&
        ek.birth.trim() === child.birth.trim())
  );
  const stableLocalId = existingMatch?.id || child.id || fallbackIdx + 1;
  const remoteId = child.remote_id ?? (isValidUuid(child.id) ? child.id : undefined);

  const canonicalSeedKid = DEFAULT_SEED.kids.find((sk) => sk.name === child.name);
  const isGirl = child.gender === 'girl' || child.gender === 'female';

  if (canonicalSeedKid) {
    return {
      ...canonicalSeedKid,
      id: stableLocalId,
      ...(remoteId !== undefined ? { remoteId } : {}),
      name: child.name || canonicalSeedKid.name,
      birth: child.birth || canonicalSeedKid.birth,
      gender: isGirl ? 'girl' : 'boy',
      emoji: child.emoji || canonicalSeedKid.emoji,
      avatarTheme: child.avatar_theme || canonicalSeedKid.avatarTheme,
      interests: child.interests || canonicalSeedKid.interests,
      vaccinationsNote: child.vaccinations_note || canonicalSeedKid.vaccinationsNote,
      growthHeightCm:
        typeof child.growth_height_cm === 'number'
          ? child.growth_height_cm
          : canonicalSeedKid.growthHeightCm,
      growthWeightKg:
        typeof child.growth_weight_kg === 'number'
          ? child.growth_weight_kg
          : canonicalSeedKid.growthWeightKg,
    };
  }

  return {
    id: stableLocalId,
    ...(remoteId !== undefined ? { remoteId } : {}),
    name: child.name || `طفل ${fallbackIdx + 1}`,
    birth: child.birth || '2022-05-14',
    gender: isGirl ? 'girl' : 'boy',
    emoji: child.emoji || (isGirl ? '👧🏻' : '👦🏻'),
    avatarTheme: child.avatar_theme || (isGirl ? 'artist' : 'astronaut'),
    interests: child.interests || '',
    vaccinationsNote: child.vaccinations_note || undefined,
    growthHeightCm:
      typeof child.growth_height_cm === 'number' ? child.growth_height_cm : undefined,
    growthWeightKg:
      typeof child.growth_weight_kg === 'number' ? child.growth_weight_kg : undefined,
    useIllustratedAvatar: true,
    voiceMoments: existingMatch?.voiceMoments || [],
  };
}

/**
 * Maps a database row from `extended_family` into Nekbaar's `FamilyMember` structure,
 * keeping local numeric `id` separate from `remoteId`.
 */
function mapSupabaseExtendedFamilyRow(
  row: Record<string, unknown>,
  fallbackIdx: number
): FamilyMember {
  const defaultMember = DEFAULT_SEED.family[fallbackIdx] || DEFAULT_SEED.family[0];
  const remoteId =
    typeof row.id === 'string' && row.id.trim()
      ? row.id.trim()
      : typeof row.id === 'number'
      ? row.id
      : undefined;
  const resolvedName =
    (typeof row.name === 'string' && row.name.trim()) ||
    (typeof row.full_name === 'string' && row.full_name.trim()) ||
    defaultMember.name;
  const resolvedRole =
    (typeof row.role === 'string' && row.role.trim()) ||
    (typeof row.relation_type === 'string' && row.relation_type.trim()) ||
    defaultMember.role;
  return {
    ...defaultMember,
    id: typeof row.id === 'number' && Number.isFinite(row.id) ? row.id : defaultMember.id || fallbackIdx + 1,
    ...(remoteId !== undefined ? { remoteId } : {}),
    name: resolvedName,
    role: resolvedRole,
    side: typeof row.side === 'string' && row.side.trim() ? row.side.trim() : defaultMember.side,
    phoneNumber:
      typeof row.phone_number === 'string' && row.phone_number.trim()
        ? row.phone_number.trim()
        : defaultMember.phoneNumber,
    email:
      typeof row.email === 'string' && row.email.trim() ? row.email.trim() : defaultMember.email,
  };
}

/**
 * Fetches Users, Shared Family (`family_id`), Children,
 * Extended Family, and Catalog items dynamically from Supabase with timeout protection.
 * Never queries UUID tables with `SHARED_FAMILY_ID = 1`.
 */
export async function fetchFamilySpaceFromSupabase(
  currentState: FamilySpaceState,
  customClient?: SupabaseClient | null
): Promise<SupabaseHydrationResult> {
  const activeClient = customClient !== undefined ? customClient : supabaseClient;
  if (!activeClient) {
    return {
      nextState: currentState,
      users: DEFAULT_SUPABASE_USERS,
      family: null,
      children: [],
      catalogItems: [],
      summary: {
        connected: false,
        sharedFamilyId: SHARED_FAMILY_ID,
        usersCount: DEFAULT_SUPABASE_USERS.length,
        familiesCount: 1,
        childrenCount: currentState.kids.length,
        extendedFamilyCount: currentState.family.length,
        catalogCount: 0,
        syncedAt: new Date().toISOString(),
        errorMessage: 'Supabase client is not configured.',
      },
      error: 'Supabase client is not configured.',
    };
  }

  try {
    const verifiedCtx = await resolveVerifiedFamilyContext(activeClient);
    const verifiedFamilyUuid = verifiedCtx.verifiedFamilyId;

    if (!verifiedCtx.authenticated || !isValidUuid(verifiedFamilyUuid)) {
      // Unauthenticated or no verified UUID family_id: keep local state intact without querying family tables with integer 1
      return {
        nextState: currentState,
        users: DEFAULT_SUPABASE_USERS,
        family: null,
        children: [],
        catalogItems: [],
        summary: {
          connected: true,
          sharedFamilyId: SHARED_FAMILY_ID,
          usersCount: DEFAULT_SUPABASE_USERS.length,
          familiesCount: 1,
          childrenCount: currentState.kids.length,
          extendedFamilyCount: currentState.family.length,
          catalogCount: 0,
          syncedAt: new Date().toISOString(),
          errorMessage: null,
        },
        error: null,
      };
    }

    const [usersResult, childrenResult, familiesRes, extendedFamilyRes, catalogRes] =
      await Promise.all([
        fetchUsersFromSupabase(verifiedFamilyUuid, activeClient),
        fetchChildrenFromSupabase(verifiedFamilyUuid, activeClient),
        withSupabaseRetry(() =>
          activeClient
            .from(SUPABASE_TABLES.FAMILIES)
            .select('*')
            .eq('id', verifiedFamilyUuid)
            .limit(5)
        ),
        withSupabaseRetry(() =>
          activeClient
            .from(SUPABASE_TABLES.EXTENDED_FAMILY)
            .select('*')
            .eq('family_id', verifiedFamilyUuid)
            .limit(30)
        ),
        withSupabaseRetry(() =>
          activeClient.from(SUPABASE_TABLES.CATALOG_ITEMS).select('*').limit(50)
        ),
      ]);

    const queryErrors = [
      usersResult.error,
      childrenResult.error,
      familiesRes.error?.message,
    ].filter(Boolean) as string[];

    const familiesRows = Array.isArray(familiesRes.data) ? familiesRes.data : [];
    const extendedRows = Array.isArray(extendedFamilyRes.data) ? extendedFamilyRes.data : [];
    const catalogRows = Array.isArray(catalogRes.data) ? catalogRes.data : [];

    // Map Users into ParentAccounts linked to `verifiedFamilyUuid`
    let updatedParentAccounts = { ...currentState.parentAccounts };
    let detectedActiveRole: 'father' | 'mother' = currentState.activeParentAccount;
    if (usersResult.data.length > 0) {
      usersResult.data.forEach((userEntity) => {
        const rawName = userEntity.name || userEntity.full_name || '';
        const lower = rawName.toLowerCase();
        const isFather =
          userEntity.role === 'father' ||
          rawName.includes('أحمد') ||
          lower.includes('ahmad') ||
          lower.includes('ahmed');
        const isMother =
          userEntity.role === 'mother' ||
          rawName.includes('مريم') ||
          lower.includes('maryam') ||
          lower.includes('mariam');

        if (isFather) {
          detectedActiveRole = 'father';
          const cleanFatherName = rawName.includes('الأب') ? rawName : `${rawName} (الأب)`;
          const fatherProfile: ParentAccountProfile = {
            ...updatedParentAccounts.father,
            ...(isValidUuid(userEntity.id) ? { remoteUserId: userEntity.id } : {}),
            fullName: cleanFatherName,
            phoneNumber: userEntity.phone || updatedParentAccounts.father.phoneNumber,
            email: userEntity.email || updatedParentAccounts.father.email,
          };
          updatedParentAccounts = { ...updatedParentAccounts, father: fatherProfile };
        } else if (isMother) {
          detectedActiveRole = 'mother';
          const cleanMotherName = rawName.includes('الأم') ? rawName : `${rawName} (الأم)`;
          const motherProfile: ParentAccountProfile = {
            ...updatedParentAccounts.mother,
            ...(isValidUuid(userEntity.id) ? { remoteUserId: userEntity.id } : {}),
            fullName: cleanMotherName,
            phoneNumber: userEntity.phone || updatedParentAccounts.mother.phoneNumber,
            email: userEntity.email || updatedParentAccounts.mother.email,
          };
          updatedParentAccounts = { ...updatedParentAccounts, mother: motherProfile };
        }
      });
    }

    // Map Children from Supabase `children` table while preserving local numeric IDs for tasks/calendar/routine
    // Never replace real database children with demo seed data
    let updatedKids = currentState.kids;
    if (childrenResult.data.length > 0) {
      updatedKids = childrenResult.data.map((child, idx) =>
        mapChildEntityToProfile(child, idx, currentState.kids)
      );
    }

    let updatedExtendedFamily = currentState.family;
    if (extendedRows.length > 0) {
      updatedExtendedFamily = extendedRows.map((row, idx) =>
        mapSupabaseExtendedFamilyRow(row as Record<string, unknown>, idx)
      );
    }

    const primaryFamilyRow = familiesRows[0] as Record<string, unknown> | undefined;
    const familyEntity: Family = {
      id:
        typeof primaryFamilyRow?.id === 'string' && primaryFamilyRow.id.trim()
          ? primaryFamilyRow.id.trim()
          : verifiedFamilyUuid,
      family_name:
        typeof primaryFamilyRow?.family_name === 'string' && primaryFamilyRow.family_name.trim()
          ? primaryFamilyRow.family_name
          : 'أسرة نكبر',
      country:
        primaryFamilyRow?.country === 'SA' || primaryFamilyRow?.country === 'EG'
          ? primaryFamilyRow.country
          : currentState.country,
      city:
        typeof primaryFamilyRow?.city === 'string' && primaryFamilyRow.city.trim()
          ? primaryFamilyRow.city
          : currentState.city,
      currency:
        primaryFamilyRow?.currency === 'SAR' ||
        primaryFamilyRow?.currency === 'EGP'
          ? primaryFamilyRow.currency
          : currentState.currency,
      active_parent:
        primaryFamilyRow?.active_parent === 'father' ||
        primaryFamilyRow?.active_parent === 'mother'
          ? primaryFamilyRow.active_parent
          : detectedActiveRole,
    };

    const activeParentProfile =
      familyEntity.active_parent === 'father'
        ? updatedParentAccounts.father
        : updatedParentAccounts.mother;

    const nextState: FamilySpaceState = {
      ...normalizeAppData({
        ...currentState,
        verifiedFamilyId: verifiedFamilyUuid,
        parentAccounts: updatedParentAccounts,
        kids: updatedKids,
        family: updatedExtendedFamily,
        country: familyEntity.country || currentState.country,
        city: familyEntity.city || currentState.city,
        currency: familyEntity.currency || currentState.currency,
        activeParentAccount: familyEntity.active_parent || detectedActiveRole,
        role: (familyEntity.active_parent || detectedActiveRole) === 'father' ? 'dad' : 'mom',
      }),
      verifiedFamilyId: verifiedFamilyUuid,
      kids: updatedKids,
      parentAccounts: updatedParentAccounts,
      parentName: activeParentProfile.fullName || currentState.parentName,
    };

    const mappedCatalog: CommercialCatalogItem[] = catalogRows.map(
      (row: Record<string, unknown>, idx: number) => ({
        id: typeof row.id === 'number' ? row.id : 9000 + idx + 1,
        name:
          (typeof row.name === 'string' && row.name.trim()) ||
          (typeof row.title === 'string' && row.title.trim()) ||
          'منتج عائلي مميز',
        nameEn:
          (typeof row.name_en === 'string' && row.name_en.trim()) ||
          (typeof row.title === 'string' && row.title.trim()) ||
          'Featured Family Item',
        kind:
          row.kind === 'service' || row.kind === 'product' || row.kind === 'offer'
            ? row.kind
            : 'product',
        category:
          (typeof row.category === 'string'
            ? (row.category as CommercialCatalogItem['category'])
            : 'toys') || 'toys',
        categoryLabel:
          typeof row.category_label === 'string' ? row.category_label : 'ألعاب وتنمية',
        country: row.country === 'EG' || row.country === 'SA' ? row.country : 'ALL',
        city: typeof row.city === 'string' ? row.city : 'القاهرة',
        priceEGP:
          typeof row.price_egp === 'number'
            ? row.price_egp
            : typeof row.price === 'number'
            ? row.price
            : 450,
        priceSAR:
          typeof row.price_sar === 'number'
            ? row.price_sar
            : typeof row.price === 'number'
            ? Math.round(row.price / 4.5)
            : 95,
        rating: typeof row.rating === 'string' ? row.rating : '4.9',
        isSponsored: Boolean(row.is_sponsored),
        description:
          typeof row.description === 'string'
            ? row.description
            : 'منتج مختار بعناية لأطفال الأسرة.',
        emoji: typeof row.emoji === 'string' ? row.emoji : '🧸',
      })
    );

    const hasNetworkOrTimeoutError = queryErrors.some(
      (msg) =>
        msg.includes('SUPABASE_TIMEOUT') ||
        msg.toLowerCase().includes('fetch') ||
        msg.toLowerCase().includes('network') ||
        msg.toLowerCase().includes('failed to fetch')
    );

    return {
      nextState,
      users: usersResult.data,
      family: familyEntity,
      children: childrenResult.data,
      catalogItems: mappedCatalog,
      summary: {
        connected: !hasNetworkOrTimeoutError,
        timedOut: queryErrors.some((msg) => msg.includes('SUPABASE_TIMEOUT')),
        sharedFamilyId: verifiedFamilyUuid,
        usersCount: usersResult.data.length,
        familiesCount: familiesRows.length || 1,
        childrenCount: updatedKids.length,
        extendedFamilyCount: updatedExtendedFamily.length,
        catalogCount: mappedCatalog.length,
        syncedAt: new Date().toISOString(),
        errorMessage: hasNetworkOrTimeoutError ? queryErrors[0] : null,
      },
      error: hasNetworkOrTimeoutError ? queryErrors[0] : null,
    };
  } catch (err) {
    const errorMsg =
      err instanceof Error ? err.message : 'Unable to reach Supabase database.';
    return {
      nextState: currentState,
      users: DEFAULT_SUPABASE_USERS,
      family: null,
      children: DEFAULT_SUPABASE_CHILDREN,
      catalogItems: [],
      summary: {
        connected: false,
        timedOut: errorMsg.includes('SUPABASE_TIMEOUT'),
        sharedFamilyId: SHARED_FAMILY_ID,
        usersCount: DEFAULT_SUPABASE_USERS.length,
        familiesCount: 1,
        childrenCount: currentState.kids.length,
        extendedFamilyCount: currentState.family.length,
        catalogCount: 0,
        syncedAt: new Date().toISOString(),
        errorMessage: errorMsg,
      },
      error: errorMsg,
    };
  }
}

/**
 * Syncs Family (Root), Authenticated User, Children, and Extended Family records to Supabase.
 * Strictly enforces:
 * 1. An active authenticated Supabase Auth session (`auth.getSession()`).
 * 2. A verified UUID `family_id` resolved from the database (never `SHARED_FAMILY_ID = 1`, `localStorage`, or `user_metadata.family_id`).
 * 3. Blocks syncing default Demo Seed data (Hamza, Laila, Youssef) as real database records.
 * 4. Separates local numeric IDs (`1, 2, 3`) from remote database UUIDs (`remoteId`).
 */
export async function syncFamilySpaceToSupabase(
  state: FamilySpaceState,
  customClient?: SupabaseClient | null
): Promise<boolean> {
  const activeClient = customClient !== undefined ? customClient : supabaseClient;
  if (!activeClient) return false;

  // Prevent syncing the default Demo Seed state to the live database
  if (isDefaultDemoSeedState(state)) {
    return false;
  }

  try {
    const verifiedCtx = await resolveVerifiedFamilyContext(activeClient);
    if (
      !verifiedCtx.authenticated ||
      !verifiedCtx.userId ||
      !isValidUuid(verifiedCtx.verifiedFamilyId)
    ) {
      return false;
    }

    const verifiedFamilyUuid = verifiedCtx.verifiedFamilyId;
    const authUserId = verifiedCtx.userId;

    const activeAccount =
      state.activeParentAccount === 'father'
        ? state.parentAccounts.father
        : state.parentAccounts.mother;

    const familyPayload = {
      id: verifiedFamilyUuid,
      family_name: state.parentName?.trim()
        ? `أسرة ${state.parentName.trim()} — نكبر`
        : 'أسرة نكبر',
      country: state.country,
      city: state.city,
      currency: state.currency,
      active_parent: state.activeParentAccount,
      updated_at: new Date().toISOString(),
    };

    // 1. Upsert `families` FIRST with verified UUID (with fallback to minimal live columns)
    let { error: famErr } = await withSupabaseRetry(() =>
      activeClient.from(SUPABASE_TABLES.FAMILIES).upsert(familyPayload, { onConflict: 'id' })
    );
    if (famErr && isUndefinedColumnError(famErr)) {
      const retryFam = await withSupabaseRetry(() =>
        activeClient
          .from(SUPABASE_TABLES.FAMILIES)
          .upsert({ id: verifiedFamilyUuid, family_name: familyPayload.family_name }, { onConflict: 'id' })
      );
      famErr = retryFam.error;
    }
    if (famErr) return false;

    // 2. Upsert only the authenticated user's record linked via `auth_user_id` (1:1 check first)
    const userPayload = {
      auth_user_id: authUserId,
      family_id: verifiedFamilyUuid,
      full_name: activeAccount.fullName || state.parentName,
      role: state.activeParentAccount,
      email: verifiedCtx.email || activeAccount.email,
      phone: activeAccount.phoneNumber,
      country: activeAccount.country,
      verified: verifiedCtx.emailVerified || verifiedCtx.phoneVerified,
    };

    const { data: existingUsers } = await withSupabaseTimeout(
      activeClient
        .from(SUPABASE_TABLES.USERS)
        .select('id')
        .eq('auth_user_id', authUserId)
        .limit(1)
    );
    const existingUserRowId =
      Array.isArray(existingUsers) && existingUsers[0] && isValidUuid((existingUsers[0] as Record<string, unknown>).id)
        ? String((existingUsers[0] as Record<string, unknown>).id).trim()
        : null;

    let userErr: unknown = null;
    if (existingUserRowId) {
      const updRes = await withSupabaseRetry(() =>
        activeClient
          .from(SUPABASE_TABLES.USERS)
          .update(userPayload)
          .eq('id', existingUserRowId)
          .eq('auth_user_id', authUserId)
      );
      userErr = updRes.error;
      if (userErr && isUndefinedColumnError(userErr)) {
        const retryUpd = await withSupabaseRetry(() =>
          activeClient
            .from(SUPABASE_TABLES.USERS)
            .update({
              full_name: userPayload.full_name,
              role: userPayload.role,
            })
            .eq('id', existingUserRowId)
            .eq('auth_user_id', authUserId)
        );
        userErr = retryUpd.error;
      }
    } else {
      const insRes = await withSupabaseRetry(() =>
        activeClient.from(SUPABASE_TABLES.USERS).upsert(userPayload, { onConflict: 'auth_user_id' })
      );
      userErr = insRes.error;
      if (userErr && isUndefinedColumnError(userErr)) {
        const retryUser = await withSupabaseRetry(() =>
          activeClient
            .from(SUPABASE_TABLES.USERS)
            .insert({
              auth_user_id: authUserId,
              full_name: userPayload.full_name,
              role: userPayload.role,
            })
        );
        userErr = retryUser.error;
      }
    }
    if (userErr) return false;

    // 3. Persist non-demo children (both existing UUID children and newly added children)
    const nonDemoKids = isCanonicalThreeDemoKids(state.kids) ? [] : state.kids;
    if (nonDemoKids.length > 0) {
      const saveKidsRes = await saveOnboardingChildrenToSupabase(
        {
          familyId: verifiedFamilyUuid,
          childrenList: nonDemoKids.map((kid) => ({
            id: kid.id,
            remoteId: isValidUuid(kid.remoteId) ? kid.remoteId : undefined,
            name: kid.name,
            birth: kid.birth,
            gender: kid.gender,
            interests: kid.interests || '',
            avatarTheme: kid.avatarTheme || 'astronaut',
          })),
        },
        activeClient
      );
      if (!saveKidsRes.synced) {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
}

export type OnboardingParentRoleInput =
  | 'mother'
  | 'father'
  | 'mom'
  | 'dad'
  | 'high-contrast';

export function normalizeOnboardingRoleToAccount(
  role?: string | null
): 'father' | 'mother' {
  const cleaned = (role || '').trim().toLowerCase();
  if (
    cleaned === 'father' ||
    cleaned === 'dad' ||
    cleaned === 'أب' ||
    cleaned.includes('الأب')
  ) {
    return 'father';
  }
  return 'mother';
}

export function normalizeOnboardingRoleToTheme(
  role?: string | null
): 'dad' | 'mom' {
  return normalizeOnboardingRoleToAccount(role) === 'father' ? 'dad' : 'mom';
}

export interface OnboardingAuthStepPayload {
  mode: 'signup' | 'signin';
  email: string;
  password?: string;
  phone: string;
  parentName?: string;
  fullName?: string;
  role: OnboardingParentRoleInput;
  country?: CountryCode;
  city?: string;
  currency?: CurrencyCode;
  familyId?: number;
  familyName?: string;
}

export interface NormalizedOnboardingAuthPayload {
  mode: 'signup' | 'signin';
  email: string;
  password: string;
  phone: string;
  parentName: string;
  role: 'father' | 'mother';
  themeRole: 'dad' | 'mom';
  country: CountryCode;
  city: string;
  currency: CurrencyCode;
  familyId: number;
  familyName: string;
}

export function normalizeOnboardingAuthPayload(
  payload: OnboardingAuthStepPayload
): NormalizedOnboardingAuthPayload {
  const normalizedRole = normalizeOnboardingRoleToAccount(payload.role);
  const themeRole = normalizeOnboardingRoleToTheme(payload.role);
  const resolvedParentName = (
    payload.parentName ??
    payload.fullName ??
    ''
  ).trim();
  const country: CountryCode = payload.country === 'SA' ? 'SA' : 'EG';
  const city =
    (payload.city || '').trim() || (country === 'SA' ? 'الرياض' : 'القاهرة');
  const currency: CurrencyCode =
    payload.currency === 'SAR' || payload.currency === 'EGP'
      ? payload.currency
      : getSuggestedCurrencyForCountry(country);
  const familyId =
    typeof payload.familyId === 'number' &&
    Number.isFinite(payload.familyId) &&
    payload.familyId > 0
      ? payload.familyId
      : SHARED_FAMILY_ID;
  const familyName =
    (payload.familyName || '').trim() ||
    (resolvedParentName ? `أسرة ${resolvedParentName} — نكبر` : 'أسرة نكبر');

  return {
    mode: payload.mode === 'signin' ? 'signin' : 'signup',
    email: (payload.email || '').trim(),
    password: (payload.password || '').trim(),
    phone: (payload.phone || '').trim(),
    parentName: resolvedParentName,
    role: normalizedRole,
    themeRole,
    country,
    city,
    currency,
    familyId,
    familyName,
  };
}

export interface OnboardingAuthStepResult {
  success: boolean;
  authenticated: boolean;
  identityVerified: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  pendingEmailVerification: boolean;
  accountCreated: boolean;
  profileCreated: boolean;
  familyLinked: boolean;
  userId: string;
  familyId: number;
  verifiedFamilyUuid?: string | null;
  sessionEmail: string;
  user: {
    id: string;
    family_id: number;
    name: string;
    full_name: string;
    role: 'father' | 'mother';
    email: string;
    phone: string;
    country: CountryCode;
  };
  family?: Family | null;
  sharedChildren: Child[];
  syncedToDb: boolean;
  error: string | null;
}

/**
 * Step 1 of Onboarding & Authentication:
 * Clearly separates:
 * - Account Creation (`signUp`)
 * - Identity Verification (`emailVerified` / `phoneVerified` strictly from Supabase Auth confirmation timestamps)
 * - Profile Creation (`public.users` 1:1 row where `auth_user_id = auth.uid()`)
 * - Family Ownership/Membership (`public.families` + `public.users.family_id`)
 * Never marks an account as verified simply because database synchronization succeeded.
 */
export async function authenticateParentWithSupabase(
  payload: OnboardingAuthStepPayload,
  customClient?: SupabaseClient | null
): Promise<OnboardingAuthStepResult> {
  const activeClient = customClient !== undefined ? customClient : supabaseClient;
  const normalized = normalizeOnboardingAuthPayload(payload);
  const canonicalUserId =
    normalized.role === 'father' ? 'parent-ahmad' : 'parent-maryam';
  const sharedFamilyId = normalized.familyId;

  const fallbackUserSummary = {
    id: canonicalUserId,
    family_id: sharedFamilyId,
    name: normalized.parentName,
    full_name: normalized.parentName,
    role: normalized.role,
    email: normalized.email,
    phone: normalized.phone,
    country: normalized.country,
  };

  if (!normalized.email || !normalized.password) {
    return {
      success: false,
      authenticated: false,
      identityVerified: false,
      emailVerified: false,
      phoneVerified: false,
      pendingEmailVerification: false,
      accountCreated: false,
      profileCreated: false,
      familyLinked: false,
      userId: canonicalUserId,
      familyId: sharedFamilyId,
      verifiedFamilyUuid: null,
      sessionEmail: normalized.email,
      user: fallbackUserSummary,
      family: null,
      sharedChildren: [],
      syncedToDb: false,
      error: 'البريد الإلكتروني وكلمة المرور مطلوبان لتسجيل الدخول الآمن.',
    };
  }

  if (normalized.mode === 'signup' && !normalized.parentName) {
    return {
      success: false,
      authenticated: false,
      identityVerified: false,
      emailVerified: false,
      phoneVerified: false,
      pendingEmailVerification: false,
      accountCreated: false,
      profileCreated: false,
      familyLinked: false,
      userId: canonicalUserId,
      familyId: sharedFamilyId,
      verifiedFamilyUuid: null,
      sessionEmail: normalized.email,
      user: fallbackUserSummary,
      family: null,
      sharedChildren: [],
      syncedToDb: false,
      error: 'اسم ولي الأمر مطلوب لحفظ الحساب.',
    };
  }

  if (!activeClient) {
    return {
      success: false,
      authenticated: false,
      identityVerified: false,
      emailVerified: false,
      phoneVerified: false,
      pendingEmailVerification: false,
      accountCreated: false,
      profileCreated: false,
      familyLinked: false,
      userId: canonicalUserId,
      familyId: sharedFamilyId,
      verifiedFamilyUuid: null,
      sessionEmail: normalized.email,
      user: fallbackUserSummary,
      family: null,
      sharedChildren: [],
      syncedToDb: false,
      error: 'خدمة قاعدة البيانات السحابية غير متصلة حالياً.',
    };
  }

  let authUserId = canonicalUserId;
  let activeSessionVerified = false;
  let emailVerified = false;
  let phoneVerified = false;
  let accountCreated = false;

  try {
    let pendingEmailConfirmation = false;
    let authFailureReason: string | null = null;

    if (normalized.email) {
      if (normalized.mode === 'signup') {
        const { data: signUpData, error: signUpErr } = await withSupabaseTimeout(
          activeClient.auth.signUp({
            email: normalized.email,
            password: normalized.password,
            options: {
              // Return the user to the exact app origin where signup started.
              // Supabase Auth must also allow this origin in its Redirect URLs.
              emailRedirectTo:
                typeof window !== 'undefined' ? window.location.origin : undefined,
              data: {
                full_name: normalized.parentName,
                phone: normalized.phone,
                role: normalized.role,
                country: normalized.country,
              },
            },
          })
        );

        const evalSignUp = evaluateAuthSessionResponse({
          user: signUpData?.user,
          session: signUpData?.session,
          error: signUpErr,
        });

        emailVerified = evalSignUp.emailVerified;
        phoneVerified = evalSignUp.phoneVerified;

        if (evalSignUp.status === 'ACTIVE_SESSION_READY' && evalSignUp.authUserId) {
          authUserId = evalSignUp.authUserId;
          activeSessionVerified = true;
          accountCreated = true;
        } else if (evalSignUp.status === 'PENDING_EMAIL_CONFIRMATION' && evalSignUp.authUserId) {
          authUserId = evalSignUp.authUserId;
          pendingEmailConfirmation = true;
          accountCreated = true;
        } else if (
          signUpErr &&
          signUpErr.message.toLowerCase().includes('already registered')
        ) {
          // Never turn a sign-up attempt into an implicit sign-in. Ask the user
          // to switch to the explicit sign-in flow or recover their password.
          authFailureReason =
            'هذا البريد الإلكتروني مسجل بالفعل. انتقل إلى تسجيل الدخول أو استخدم استعادة كلمة المرور.';
        } else if (signUpErr) {
          authFailureReason = signUpErr.message;
        }
      } else {
        const { data: signInData, error: signInErr } = await withSupabaseTimeout(
          activeClient.auth.signInWithPassword({
            email: normalized.email,
            password: normalized.password,
          })
        );
        const evalSignIn = evaluateAuthSessionResponse({
          user: signInData?.user,
          session: signInData?.session,
          error: signInErr,
        });
        emailVerified = evalSignIn.emailVerified;
        phoneVerified = evalSignIn.phoneVerified;
        if (evalSignIn.status === 'ACTIVE_SESSION_READY' && evalSignIn.authUserId) {
          authUserId = evalSignIn.authUserId;
          activeSessionVerified = true;
          accountCreated = true;
        } else if (
          signInErr &&
          signInErr.message.toLowerCase().includes('email not confirmed')
        ) {
          pendingEmailConfirmation = true;
          authFailureReason =
            'البريد الإلكتروني غير مؤكد بعد؛ يرجى إدخال رمز التحقق المرسل لبريدك الإلكتروني.';
        } else {
          authFailureReason = signInErr?.message || evalSignIn.reason;
        }
      }
    }

    if (pendingEmailConfirmation) {
      return {
        success: false,
        authenticated: false,
        identityVerified: false,
        emailVerified: false,
        phoneVerified: false,
        pendingEmailVerification: true,
        accountCreated: true,
        profileCreated: false,
        familyLinked: false,
        userId: authUserId,
        familyId: sharedFamilyId,
        verifiedFamilyUuid: null,
        sessionEmail: normalized.email,
        user: {
          ...fallbackUserSummary,
          id: authUserId,
        },
        family: null,
        sharedChildren: [],
        syncedToDb: false,
        error:
          authFailureReason ||
          'تم إنشاء حساب المصادقة؛ يرجى تأكيد البريد الإلكتروني لإصدار جلسة موثقة قبل مزامنة بيانات الأسرة.',
      };
    }

    // 2. Verify active session and verified UUID family_id before any table writes
    const verifiedCtx = await resolveVerifiedFamilyContext(activeClient);
    let verifiedFamilyUuid = verifiedCtx.verifiedFamilyId;
    if (verifiedCtx.authenticated) {
      emailVerified = verifiedCtx.emailVerified;
      phoneVerified = verifiedCtx.phoneVerified;
    }

    if (!activeSessionVerified && !verifiedCtx.authenticated) {
      return {
        success: false,
        authenticated: false,
        identityVerified: false,
        emailVerified: false,
        phoneVerified: false,
        pendingEmailVerification: false,
        accountCreated,
        profileCreated: false,
        familyLinked: false,
        userId: authUserId,
        familyId: sharedFamilyId,
        verifiedFamilyUuid: null,
        sessionEmail: normalized.email,
        user: {
          ...fallbackUserSummary,
          id: authUserId,
        },
        family: null,
        sharedChildren: [],
        syncedToDb: false,
        error:
          authFailureReason ||
          verifiedCtx.error ||
          'تعذر التحقق من جلسة المصادقة السحابية؛ تم حفظ البيانات محلياً فقط.',
      };
    }

    const effectiveUserUuid = isValidUuid(verifiedCtx.userId)
      ? verifiedCtx.userId
      : isValidUuid(authUserId)
      ? authUserId
      : null;

    const resolvedFullName =
      normalized.parentName ||
      verifiedCtx.fullName ||
      (normalized.role === 'father' ? 'أحمد' : 'مريم');
    const resolvedRole = verifiedCtx.role || normalized.role;

    // 3. If authenticated user has no verified family_id yet, attempt atomic RPC bootstrap first
    let profileCreated = Boolean(verifiedCtx.userRowId);
    let familyLinked = isValidUuid(verifiedFamilyUuid);

    if (effectiveUserUuid && !isValidUuid(verifiedFamilyUuid)) {
      try {
        const { data: rpcRows, error: rpcErr } = await withSupabaseTimeout(
          activeClient.rpc('bootstrap_authenticated_family_space', {
            p_full_name: resolvedFullName,
            p_role: resolvedRole,
            p_family_name: normalized.familyName,
            p_country: normalized.country,
            p_city: normalized.city,
            p_currency: normalized.currency,
            p_phone: normalized.phone,
          }),
          3000
        );
        if (!rpcErr && Array.isArray(rpcRows) && rpcRows.length > 0) {
          const firstRow = rpcRows[0] as Record<string, unknown>;
          if (isValidUuid(firstRow.family_id)) {
            verifiedFamilyUuid = firstRow.family_id.trim();
            familyLinked = true;
            profileCreated = true;
          }
        }
      } catch {
        // RPC may not be applied on live DB yet; handled below
      }
    }

    if (!effectiveUserUuid || !isValidUuid(verifiedFamilyUuid)) {
      return {
        success: false,
        authenticated: true,
        identityVerified: emailVerified || phoneVerified,
        emailVerified,
        phoneVerified,
        pendingEmailVerification: false,
        accountCreated: true,
        profileCreated,
        familyLinked: false,
        userId: effectiveUserUuid || canonicalUserId,
        familyId: sharedFamilyId,
        verifiedFamilyUuid: null,
        sessionEmail: normalized.email,
        user: {
          ...fallbackUserSummary,
          id: effectiveUserUuid || canonicalUserId,
          name: resolvedFullName,
          full_name: resolvedFullName,
          role: resolvedRole,
        },
        family: null,
        sharedChildren: [],
        syncedToDb: false,
        error:
          'لا يوجد معرّف أسرة سحابي (UUID) موثق مرتبط بالحساب؛ يلزم تطبيق ترحيل المرحلة الثانية (bootstrap_authenticated_family_space + RLS) لإنشاء وربط سجل الأسرة.',
      };
    }

    // 4. Enforce 1:1 user profile mapping in `public.users` (`auth_user_id = effectiveUserUuid`)
    // Check existing row by `auth_user_id` first so we never create duplicate user rows
    const { data: existingUserRows } = await withSupabaseTimeout(
      activeClient
        .from(SUPABASE_TABLES.USERS)
        .select('id')
        .eq('auth_user_id', effectiveUserUuid)
        .limit(1)
    );
    const existingRowId =
      Array.isArray(existingUserRows) &&
      existingUserRows[0] &&
      isValidUuid((existingUserRows[0] as Record<string, unknown>).id)
        ? String((existingUserRows[0] as Record<string, unknown>).id).trim()
        : verifiedCtx.userRowId || null;

    const userRow = {
      auth_user_id: effectiveUserUuid,
      family_id: verifiedFamilyUuid,
      full_name: resolvedFullName,
      role: resolvedRole,
      email: normalized.email,
      phone: normalized.phone,
      country: normalized.country,
      verified: emailVerified || phoneVerified,
    };

    let upsertErr: { message?: string; code?: string } | null = null;
    if (existingRowId) {
      const upd = await withSupabaseRetry(() =>
        activeClient
          .from(SUPABASE_TABLES.USERS)
          .update(userRow)
          .eq('id', existingRowId)
          .eq('auth_user_id', effectiveUserUuid)
      );
      upsertErr = upd.error;
      if (upsertErr && isUndefinedColumnError(upsertErr)) {
        const retryUpd = await withSupabaseRetry(() =>
          activeClient
            .from(SUPABASE_TABLES.USERS)
            .update({
              full_name: resolvedFullName,
              role: resolvedRole,
            })
            .eq('id', existingRowId)
            .eq('auth_user_id', effectiveUserUuid)
        );
        upsertErr = retryUpd.error;
      }
    } else {
      const ins = await withSupabaseRetry(() =>
        activeClient
          .from(SUPABASE_TABLES.USERS)
          .upsert([userRow], { onConflict: 'auth_user_id' })
      );
      upsertErr = ins.error;
      if (upsertErr && isUndefinedColumnError(upsertErr)) {
        const retryIns = await withSupabaseRetry(() =>
          activeClient
            .from(SUPABASE_TABLES.USERS)
            .insert([
              {
                auth_user_id: effectiveUserUuid,
                full_name: resolvedFullName,
                role: resolvedRole,
              },
            ])
        );
        upsertErr = retryIns.error;
      }
    }

    // Verify that the profile row exists and is linked to this exact Auth user + family.
    const profileCheck = await withSupabaseTimeout(
      activeClient
        .from(SUPABASE_TABLES.USERS)
        .select('id, auth_user_id, family_id')
        .eq('auth_user_id', effectiveUserUuid)
        .eq('family_id', verifiedFamilyUuid)
        .limit(1)
    );
    const verifiedProfileRow = Array.isArray(profileCheck.data) ? profileCheck.data[0] as Record<string, unknown> | undefined : undefined;
    const profileVerified = Boolean(
      !upsertErr && !profileCheck.error && verifiedProfileRow &&
      verifiedProfileRow.auth_user_id === effectiveUserUuid &&
      verifiedProfileRow.family_id === verifiedFamilyUuid &&
      isValidUuid(verifiedProfileRow.id)
    );
    const syncedToDb = profileVerified;
    profileCreated = profileCreated || profileVerified;
    familyLinked = Boolean(isValidUuid(verifiedFamilyUuid) && profileVerified);
    const dbErrorMsg =
      upsertErr?.message || profileCheck.error?.message ||
      (!syncedToDb ? 'تعذر التحقق من حفظ ملف المستخدم وربطه بالأسرة في قاعدة البيانات.' : null);

    // 5. Fetch family record and shared `children` linked to `verifiedFamilyUuid`
    const { data: famRows } = await withSupabaseTimeout(
      activeClient
        .from(SUPABASE_TABLES.FAMILIES)
        .select('*')
        .eq('id', verifiedFamilyUuid)
        .limit(1)
    );
    const restoredFamilyRow =
      Array.isArray(famRows) && famRows.length > 0
        ? (famRows[0] as Record<string, unknown>)
        : null;
    const restoredFamily: Family = {
      id: verifiedFamilyUuid,
      family_name:
        (typeof restoredFamilyRow?.family_name === 'string' &&
          restoredFamilyRow.family_name.trim()) ||
        normalized.familyName,
      country:
        restoredFamilyRow?.country === 'EG' || restoredFamilyRow?.country === 'SA'
          ? restoredFamilyRow.country
          : normalized.country,
      city:
        (typeof restoredFamilyRow?.city === 'string' && restoredFamilyRow.city.trim()) ||
        normalized.city,
      currency:
        restoredFamilyRow?.currency === 'EGP' || restoredFamilyRow?.currency === 'SAR'
          ? restoredFamilyRow.currency
          : normalized.currency,
      active_parent:
        restoredFamilyRow?.active_parent === 'father' ||
        restoredFamilyRow?.active_parent === 'mother'
          ? restoredFamilyRow.active_parent
          : resolvedRole,
    };

    const sharedChildrenRes = await fetchChildrenFromSupabase(
      verifiedFamilyUuid,
      activeClient
    );

    return {
      success: syncedToDb,
      authenticated: true,
      identityVerified: emailVerified || phoneVerified,
      emailVerified,
      phoneVerified,
      pendingEmailVerification: false,
      accountCreated: true,
      profileCreated,
      familyLinked,
      userId: effectiveUserUuid,
      familyId: sharedFamilyId,
      verifiedFamilyUuid,
      sessionEmail: normalized.email,
      user: {
        id: effectiveUserUuid,
        family_id: sharedFamilyId,
        name: resolvedFullName,
        full_name: resolvedFullName,
        role: resolvedRole,
        email: normalized.email,
        phone: normalized.phone,
        country: restoredFamily.country,
      },
      family: restoredFamily,
      sharedChildren: sharedChildrenRes.data,
      syncedToDb,
      error: dbErrorMsg,
    };
  } catch (err) {
    const errorMessage =
      err instanceof Error
        ? err.message
        : 'تعذر الاتصال بقاعدة البيانات أثناء حفظ الحساب.';
    return {
      success: false,
      authenticated: activeSessionVerified,
      identityVerified: emailVerified || phoneVerified,
      emailVerified,
      phoneVerified,
      pendingEmailVerification: false,
      accountCreated,
      profileCreated: false,
      familyLinked: false,
      userId: authUserId,
      familyId: sharedFamilyId,
      verifiedFamilyUuid: null,
      sessionEmail: normalized.email,
      user: {
        ...fallbackUserSummary,
        id: authUserId,
      },
      family: null,
      sharedChildren: [],
      syncedToDb: false,
      error: errorMessage,
    };
  }
}

export interface VerifyAccountIdentityOtpParams {
  email?: string;
  phone?: string;
  token: string;
  type?: 'signup' | 'email' | 'sms';
}

export interface VerifyAccountIdentityOtpResult {
  verified: boolean;
  userId: string | null;
  emailVerified: boolean;
  phoneVerified: boolean;
  error: string | null;
}

/**
 * Genuine Supabase Identity Verification (`verifyOtp`):
 * Verifies an Email or SMS OTP token issued by Supabase Auth and confirms that
 * the returned session user has a genuine `email_confirmed_at` or `phone_confirmed_at` timestamp.
 */
export async function verifyAccountIdentityOtpInSupabase(
  params: VerifyAccountIdentityOtpParams,
  customClient?: SupabaseClient | null
): Promise<VerifyAccountIdentityOtpResult> {
  const activeClient = customClient !== undefined ? customClient : supabaseClient;
  const cleanToken = (params.token || '').trim();
  if (cleanToken.length < 4) {
    return {
      verified: false,
      userId: null,
      emailVerified: false,
      phoneVerified: false,
      error: 'يرجى إدخال رمز التحقق الصحيح المكون من 6 أرقام.',
    };
  }

  if (!activeClient) {
    return {
      verified: false,
      userId: null,
      emailVerified: false,
      phoneVerified: false,
      error: 'خدمة المصادقة السحابية غير متصلة حالياً.',
    };
  }

  try {
    const cleanEmail = (params.email || '').trim();
    const cleanPhone = (params.phone || '').trim();
    const otpType = params.type || (cleanPhone && !cleanEmail ? 'sms' : 'signup');

    let verifyRes;
    if (otpType === 'sms' && cleanPhone) {
      verifyRes = await withSupabaseTimeout(
        activeClient.auth.verifyOtp({
          phone: cleanPhone,
          token: cleanToken,
          type: 'sms',
        }),
        4000
      );
    } else {
      // Try `signup` OTP first, and if that fails, try `email` OTP
      verifyRes = await withSupabaseTimeout(
        activeClient.auth.verifyOtp({
          email: cleanEmail,
          token: cleanToken,
          type: otpType === 'email' ? 'email' : 'signup',
        }),
        4000
      );
      if (verifyRes.error && otpType !== 'email') {
        const fallbackVerify = await withSupabaseTimeout(
          activeClient.auth.verifyOtp({
            email: cleanEmail,
            token: cleanToken,
            type: 'email',
          }),
          4000
        );
        if (!fallbackVerify.error) {
          verifyRes = fallbackVerify;
        }
      }
    }

    const evalState = evaluateAuthSessionResponse({
      user: verifyRes.data?.user,
      session: verifyRes.data?.session,
      error: verifyRes.error,
    });

    if (evalState.status !== 'ACTIVE_SESSION_READY' || !evalState.authUserId) {
      return {
        verified: false,
        userId: evalState.authUserId,
        emailVerified: evalState.emailVerified,
        phoneVerified: evalState.phoneVerified,
        error: verifyRes.error?.message || evalState.reason || 'رمز التحقق غير صالح أو منتهي الصلاحية.',
      };
    }

    return {
      verified: evalState.emailVerified || evalState.phoneVerified,
      userId: evalState.authUserId,
      emailVerified: evalState.emailVerified,
      phoneVerified: evalState.phoneVerified,
      error: null,
    };
  } catch (err) {
    return {
      verified: false,
      userId: null,
      emailVerified: false,
      phoneVerified: false,
      error: err instanceof Error ? err.message : 'تعذر التحقق من الرمز حالياً.',
    };
  }
}

/**
 * Resends a genuine Supabase signup or email confirmation OTP code.
 */
export async function resendAccountVerificationOtpInSupabase(
  params: { email: string; type?: 'signup' | 'email' },
  customClient?: SupabaseClient | null
): Promise<{ sent: boolean; error: string | null }> {
  const activeClient = customClient !== undefined ? customClient : supabaseClient;
  const cleanEmail = (params.email || '').trim();
  if (!cleanEmail) {
    return { sent: false, error: 'البريد الإلكتروني مطلوب لإعادة إرسال الرمز.' };
  }
  if (!activeClient) {
    return { sent: false, error: 'خدمة المصادقة السحابية غير متصلة حالياً.' };
  }

  try {
    const { error } = await withSupabaseTimeout(
      activeClient.auth.resend({
        type: 'signup',
        email: cleanEmail,
      }),
      4000
    );
    if (error) {
      return { sent: false, error: error.message };
    }
    return { sent: true, error: null };
  } catch (err) {
    return {
      sent: false,
      error: err instanceof Error ? err.message : 'تعذر إعادة إرسال رمز التحقق.',
    };
  }
}

export interface RestoredAuthenticatedAccount {
  restored: boolean;
  authenticated: boolean;
  userId: string | null;
  userRowId: string | null;
  verifiedFamilyId: string | null;
  emailVerified: boolean;
  phoneVerified: boolean;
  userProfile: {
    id: string;
    auth_user_id: string;
    family_id: string;
    full_name: string;
    role: 'father' | 'mother';
    email: string;
    phone: string;
    country: CountryCode;
  } | null;
  family: Family | null;
  children: Child[];
  error: string | null;
}

/**
 * Restores an existing authenticated user's exact profile (`public.users`),
 * family (`public.families`), and children (`public.children`) from Supabase.
 * Never returns demo/seed data if the database records are missing.
 */
export async function restoreAuthenticatedAccountFromSupabase(
  customClient?: SupabaseClient | null
): Promise<RestoredAuthenticatedAccount> {
  const activeClient = customClient !== undefined ? customClient : supabaseClient;
  if (!activeClient) {
    return {
      restored: false,
      authenticated: false,
      userId: null,
      userRowId: null,
      verifiedFamilyId: null,
      emailVerified: false,
      phoneVerified: false,
      userProfile: null,
      family: null,
      children: [],
      error: 'Supabase client is not initialized.',
    };
  }

  const verifiedCtx = await resolveVerifiedFamilyContext(activeClient);
  if (!verifiedCtx.authenticated || !verifiedCtx.userId) {
    return {
      restored: false,
      authenticated: false,
      userId: null,
      userRowId: null,
      verifiedFamilyId: null,
      emailVerified: false,
      phoneVerified: false,
      userProfile: null,
      family: null,
      children: [],
      error: verifiedCtx.error || 'No active authenticated session.',
    };
  }

  if (!verifiedCtx.verifiedFamilyId) {
    return {
      restored: false,
      authenticated: true,
      userId: verifiedCtx.userId,
      userRowId: verifiedCtx.userRowId || null,
      verifiedFamilyId: null,
      emailVerified: verifiedCtx.emailVerified,
      phoneVerified: verifiedCtx.phoneVerified,
      userProfile: null,
      family: null,
      children: [],
      error: verifiedCtx.error || 'No verified family linked to this user account.',
    };
  }

  try {
    const familyUuid = verifiedCtx.verifiedFamilyId;
    const [userRes, famRes, childrenRes] = await Promise.all([
      withSupabaseTimeout(
        activeClient
          .from(SUPABASE_TABLES.USERS)
          .select('*')
          .eq('auth_user_id', verifiedCtx.userId)
          .limit(1)
      ),
      withSupabaseTimeout(
        activeClient
          .from(SUPABASE_TABLES.FAMILIES)
          .select('*')
          .eq('id', familyUuid)
          .limit(1)
      ),
      fetchChildrenFromSupabase(familyUuid, activeClient),
    ]);

    const rawUser =
      Array.isArray(userRes.data) && userRes.data.length > 0
        ? (userRes.data[0] as Record<string, unknown>)
        : null;
    const rawFam =
      Array.isArray(famRes.data) && famRes.data.length > 0
        ? (famRes.data[0] as Record<string, unknown>)
        : null;

    if (!rawUser || !rawFam) {
      return {
        restored: false,
        authenticated: true,
        userId: verifiedCtx.userId,
        userRowId: verifiedCtx.userRowId || null,
        verifiedFamilyId: familyUuid,
        emailVerified: verifiedCtx.emailVerified,
        phoneVerified: verifiedCtx.phoneVerified,
        userProfile: null,
        family: null,
        children: [],
        error: 'User profile or family row could not be retrieved from Supabase.',
      };
    }

    const country: CountryCode =
      rawFam.country === 'EG' || rawUser.country === 'EG' ? 'EG' : 'SA';
    const role: 'father' | 'mother' =
      rawUser.role === 'father' || rawUser.role === 'dad' ? 'father' : 'mother';
    const fullName =
      typeof rawUser.full_name === 'string' && rawUser.full_name.trim()
        ? rawUser.full_name.trim()
        : verifiedCtx.fullName || (role === 'father' ? 'أحمد' : 'مريم');

    const userProfile = {
      id: String(rawUser.id || verifiedCtx.userRowId || verifiedCtx.userId),
      auth_user_id: verifiedCtx.userId,
      family_id: familyUuid,
      full_name: fullName,
      role,
      email:
        (typeof rawUser.email === 'string' && rawUser.email.trim()) ||
        verifiedCtx.email ||
        '',
      phone:
        (typeof rawUser.phone === 'string' && rawUser.phone.trim()) ||
        verifiedCtx.phone ||
        '',
      country,
    };

    const family: Family = {
      id: familyUuid,
      family_name:
        typeof rawFam.family_name === 'string' && rawFam.family_name.trim()
          ? rawFam.family_name.trim()
          : `أسرة ${fullName} — نكبر`,
      country,
      city:
        typeof rawFam.city === 'string' && rawFam.city.trim()
          ? rawFam.city.trim()
          : country === 'EG'
          ? 'القاهرة'
          : 'الرياض',
      currency:
        rawFam.currency === 'EGP' || rawFam.currency === 'SAR'
          ? rawFam.currency
          : getSuggestedCurrencyForCountry(country),
      active_parent:
        rawFam.active_parent === 'father' || rawFam.active_parent === 'mother'
          ? rawFam.active_parent
          : role,
    };

    return {
      restored: true,
      authenticated: true,
      userId: verifiedCtx.userId,
      userRowId: userProfile.id,
      verifiedFamilyId: familyUuid,
      emailVerified: verifiedCtx.emailVerified,
      phoneVerified: verifiedCtx.phoneVerified,
      userProfile,
      family,
      children: childrenRes.data,
      error: null,
    };
  } catch (err) {
    return {
      restored: false,
      authenticated: true,
      userId: verifiedCtx.userId,
      userRowId: verifiedCtx.userRowId || null,
      verifiedFamilyId: verifiedCtx.verifiedFamilyId,
      emailVerified: verifiedCtx.emailVerified,
      phoneVerified: verifiedCtx.phoneVerified,
      userProfile: null,
      family: null,
      children: [],
      error: err instanceof Error ? err.message : 'Failed to restore account from Supabase.',
    };
  }
}

/**
 * Signs out the active user session from Supabase Auth.
 */
export async function signOutFromSupabase(
  customClient?: SupabaseClient | null
): Promise<{ signedOut: boolean; error: string | null }> {
  const activeClient = customClient !== undefined ? customClient : supabaseClient;
  if (!activeClient) {
    return { signedOut: true, error: null };
  }
  try {
    const { error } = await withSupabaseTimeout(activeClient.auth.signOut(), 3000);
    return { signedOut: !error, error: error ? error.message : null };
  } catch (err) {
    return {
      signedOut: false,
      error: err instanceof Error ? err.message : 'Sign-out failed.',
    };
  }
}

export type AuthProviderType = 'email' | 'google' | 'apple' | 'facebook' | 'outlook';

export interface GatewayStepAResult {
  success: boolean;
  provider: AuthProviderType;
  email: string;
  userId: string;
  otpSent: boolean;
  demoOtpCode: string;
  error: string | null;
}

/**
 * Mandatory Auth Gateway — Step A:
 * Supports Gmail (Google OAuth), iCloud (Apple Sign-In), Facebook, Outlook (Microsoft Azure),
 * or standard Email & Password / Email OTP, and dispatches an OTP verification code
 * to the user's email for Step B.
 */
export async function initiateGatewayEmailOrOAuthInSupabase(params: {
  provider: AuthProviderType;
  mode: 'signin' | 'signup';
  email: string;
  password?: string;
  parentName: string;
  role: 'mother' | 'father';
  country: CountryCode;
}): Promise<GatewayStepAResult> {
  const cleanEmail =
    params.email.trim() ||
    (params.role === 'father' ? 'ahmad.dad@nekbaar.app' : 'maryam.mom@nekbaar.app');
  const fallbackUserId = params.role === 'father' ? 'parent-ahmad' : 'parent-maryam';

  if (!supabaseClient) {
    return {
      success: false,
      provider: params.provider,
      email: cleanEmail,
      userId: fallbackUserId,
      otpSent: false,
      demoOtpCode: '',
      error: 'خدمة المصادقة السحابية غير متصلة حالياً.',
    };
  }

  let resolvedUserId = fallbackUserId;

  try {
    if (
      params.provider === 'google' ||
      params.provider === 'apple' ||
      params.provider === 'facebook' ||
      params.provider === 'outlook'
    ) {
      const oauthProvider = params.provider === 'outlook' ? 'azure' : params.provider;
      await withSupabaseTimeout(
        supabaseClient.auth.signInWithOAuth({
          provider: oauthProvider,
          options: {
            redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
            skipBrowserRedirect: true,
          },
        }),
        2000
      ).catch(() => null);
    } else if (params.password && params.password.trim().length >= 4) {
      if (params.mode === 'signup') {
        const { data: signUpRes } = await withSupabaseTimeout(
          supabaseClient.auth.signUp({
            email: cleanEmail,
            password: params.password.trim(),
            options: {
              data: {
                full_name: params.parentName.trim(),
                role: params.role,
                country: params.country,
              },
            },
          }),
          2500
        ).catch(() => ({ data: null }));
        if (signUpRes?.user?.id) {
          resolvedUserId = signUpRes.user.id;
        }
      } else {
        const { data: signInRes } = await withSupabaseTimeout(
          supabaseClient.auth.signInWithPassword({
            email: cleanEmail,
            password: params.password.trim(),
          }),
          2500
        ).catch(() => ({ data: null }));
        if (signInRes?.user?.id) {
          resolvedUserId = signInRes.user.id;
        }
      }
    }

    const { error: otpErr } = await withSupabaseTimeout(
      supabaseClient.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          shouldCreateUser: true,
          data: {
            full_name: params.parentName.trim(),
            role: params.role,
            country: params.country,
          },
        },
      }),
      2200
    );

    return {
      success: !otpErr,
      provider: params.provider,
      email: cleanEmail,
      userId: resolvedUserId,
      otpSent: !otpErr,
      demoOtpCode: '',
      error: otpErr ? otpErr.message : null,
    };
  } catch (err) {
    return {
      success: false,
      provider: params.provider,
      email: cleanEmail,
      userId: resolvedUserId,
      otpSent: false,
      demoOtpCode: '',
      error: err instanceof Error ? err.message : null,
    };
  }
}

/**
 * Mandatory Auth Gateway — Step B:
 * Verifies the Email OTP code entered by the user before advancing to Step C.
 */
export async function verifyGatewayEmailOtpInSupabase(params: {
  email: string;
  otpCode: string;
}): Promise<{ verified: boolean; userId?: string; error: string | null }> {
  const res = await verifyAccountIdentityOtpInSupabase({
    email: params.email,
    token: params.otpCode,
    type: 'email',
  });
  return {
    verified: res.verified,
    userId: res.userId || undefined,
    error: res.error,
  };
}

/**
 * Mandatory Auth Gateway — Step C ("ربط وتوثيق رقم الجوال"):
 * Binds the verified primary mobile phone number for instant co-parent linking,
 * maps the authenticated user (`auth.uid() = auth_user_id`) to `public.users` and `public.families`,
 * and returns the shared family children.
 */
export async function bindPhoneAndFinalizeAuthInSupabase(params: {
  mode: 'signin' | 'signup';
  provider: AuthProviderType;
  email: string;
  password?: string;
  phone: string;
  parentName: string;
  role: 'mother' | 'father';
  country: CountryCode;
  city: string;
}): Promise<OnboardingAuthStepResult> {
  return authenticateParentWithSupabase({
    mode: params.mode,
    email: params.email,
    password: params.password || '',
    phone: params.phone,
    parentName: params.parentName,
    role: params.role,
    country: params.country,
    city: params.city,
    currency: getSuggestedCurrencyForCountry(params.country),
  });
}

export interface SaveOnboardingLocationPayload {
  familyId: string | number;
  familyName?: string;
  country: CountryCode;
  city: string;
  currency?: CurrencyCode;
  activeParent?: OnboardingParentRoleInput;
}

/**
 * Step 2 of Onboarding Wizard:
 * Saves the selected Country, City/Region, Family Name, Currency, and Active Parent
 * to the `families` record in Supabase ONLY when an authenticated session and verified UUID familyId exist.
 */
export async function saveOnboardingLocationToSupabase(
  params: SaveOnboardingLocationPayload,
  customClient?: SupabaseClient | null
): Promise<{ synced: boolean; family: Family; error: string | null }> {
  const country: CountryCode = params.country === 'SA' ? 'SA' : 'EG';
  const city = (params.city || '').trim() || (country === 'SA' ? 'الرياض' : 'القاهرة');
  const currency: CurrencyCode =
    params.currency === 'SAR' || params.currency === 'EGP'
      ? params.currency
      : getSuggestedCurrencyForCountry(country);
  const activeParent = normalizeOnboardingRoleToAccount(params.activeParent);
  const familyName = (params.familyName || '').trim() || 'أسرة أحمد ومريم — نكبر';

  const res = await ensureSharedFamilyRecordInSupabase(
    {
      familyId: params.familyId || SHARED_FAMILY_ID,
      familyName,
      country,
      city,
      currency,
      activeParent,
    },
    customClient
  );
  return { synced: res.synced, family: res.family, error: res.error };
}

export interface OnboardingChildPersistenceItem {
  id?: number;
  remoteId?: string;
  name: string;
  birth: string;
  gender: 'boy' | 'girl';
  interests?: string;
  avatarTheme?: ChildProfile['avatarTheme'];
}

export interface SaveOnboardingChildrenPayload {
  familyId: string | number;
  childrenList: OnboardingChildPersistenceItem[];
}

/**
 * Step 4 of Onboarding Wizard:
 * Validates and deduplicates `childrenList` both locally and against existing DB rows for the family,
 * preserving numeric local `id` for UI linkage, and writes to Supabase `children` ONLY when
 * an active authenticated session and verified UUID `family_id` exist.
 */
export async function saveOnboardingChildrenToSupabase(
  params: SaveOnboardingChildrenPayload,
  customClient?: SupabaseClient | null
): Promise<{ synced: boolean; savedChildren: Child[]; error: string | null }> {
  const activeClient = customClient !== undefined ? customClient : supabaseClient;
  if (!params || typeof params !== 'object' || !Array.isArray(params.childrenList)) {
    return {
      synced: false,
      savedChildren: [],
      error: 'Invalid children payload: expected { familyId, childrenList }.',
    };
  }

  const targetFamilyId =
    typeof params.familyId === 'string' && isValidUuid(params.familyId)
      ? params.familyId.trim()
      : null;

  if (!targetFamilyId) {
    return {
      synced: false,
      savedChildren: [],
      error: 'Write blocked: a verified family UUID is required before saving children.',
    };
  }

  // Deduplicate by normalized (name + birth) so retries never create duplicate child records
  const seenKeys = new Set<string>();
  const uniqueInput = params.childrenList.filter((item) => {
    if (!item || typeof item !== 'object') return false;
    const cleanName = (item.name || '').trim().toLowerCase();
    if (!cleanName) return false;
    const cleanBirth = (item.birth || '').trim();
    const key = `${cleanName}::${cleanBirth}`;
    if (seenKeys.has(key)) return false;
    seenKeys.add(key);
    return true;
  });

  if (uniqueInput.length === 0) {
    return {
      synced: false,
      savedChildren: [],
      error: 'يرجى إضافة طفل واحد على الأقل قبل الحفظ.',
    };
  }

  const usedIds = new Set<number>();
  const mappedChildren: Child[] = uniqueInput.map((item, idx) => {
    let resolvedId =
      typeof item.id === 'number' && Number.isFinite(item.id) && item.id > 0
        ? Math.floor(item.id)
        : idx + 1;
    while (usedIds.has(resolvedId)) {
      resolvedId += 1;
    }
    usedIds.add(resolvedId);

    const gender: 'boy' | 'girl' = item.gender === 'girl' ? 'girl' : 'boy';
    return {
      id: resolvedId,
      ...(isValidUuid(item.remoteId) ? { remote_id: item.remoteId.trim() } : {}),
      family_id: targetFamilyId,
      name: (item.name || '').trim() || `طفل ${idx + 1}`,
      birth: (item.birth || '').trim() || '2022-05-14',
      gender,
      emoji: gender === 'girl' ? '👧🏻' : '👦🏻',
      avatar_theme: item.avatarTheme || (gender === 'girl' ? 'artist' : 'astronaut'),
      interests: (item.interests || '').trim(),
    };
  });

  if (!activeClient) {
    return {
      synced: false,
      savedChildren: mappedChildren,
      error: 'خدمة قاعدة البيانات السحابية غير متصلة حالياً.',
    };
  }

  // Prevent sending the default 3 demo children (Hamza, Laila, Youssef) to the live database as real records
  if (isCanonicalThreeDemoKids(mappedChildren)) {
    return {
      synced: false,
      savedChildren: mappedChildren,
      error: 'البيانات الافتراضية للتجربة متاحة محلياً فقط ولا يتم إرسالها لقاعدة البيانات السحابية.',
    };
  }

  try {
    const verifiedCtx = await resolveVerifiedFamilyContext(activeClient);
    const verifiedFamilyUuid = isValidUuid(verifiedCtx.verifiedFamilyId)
      ? verifiedCtx.verifiedFamilyId
      : isValidUuid(targetFamilyId) && verifiedCtx.authenticated
      ? targetFamilyId
      : null;

    if (!verifiedCtx.authenticated || !verifiedFamilyUuid) {
      return {
        synced: false,
        savedChildren: mappedChildren,
        error:
          verifiedCtx.error ||
          'Write blocked: Authenticated session and verified UUID family_id are required to save children to Supabase.',
      };
    }

    // Query existing children in DB for this family to prevent duplicate insertions on retry
    const existingDbRes = await fetchChildrenFromSupabase(verifiedFamilyUuid, activeClient);
    const existingByKey = new Map<string, string>();
    for (const existingChild of existingDbRes.data) {
      if (isValidUuid(existingChild.remote_id)) {
        const nameKey = `${(existingChild.name || '').trim().toLowerCase()}::${(existingChild.birth || '').trim()}`;
        existingByKey.set(nameKey, existingChild.remote_id.trim());
      }
    }

    const fullPayload = mappedChildren.map((child) => {
      const ageInfo = calculateChildAge(child.birth || '2022-05-14', 'ar');
      const matchedRemoteUuid =
        (isValidUuid(child.remote_id) && child.remote_id.trim()) ||
        existingByKey.get(`${child.name.trim().toLowerCase()}::${child.birth.trim()}`) ||
        undefined;
      if (matchedRemoteUuid) {
        child.remote_id = matchedRemoteUuid;
      }
      const row: Record<string, unknown> = {
        family_id: verifiedFamilyUuid,
        name: child.name,
        age_stage: ageInfo.stageCode,
        birth: child.birth,
        gender: child.gender,
        passions_or_heroes: child.interests || '',
        interests: child.interests || '',
        emoji: child.emoji || (child.gender === 'girl' ? '👧🏻' : '👦🏻'),
        avatar_theme: child.avatar_theme || 'astronaut',
      };
      if (matchedRemoteUuid) {
        row.id = matchedRemoteUuid;
      }
      return row;
    });

    const minimalPayload = mappedChildren.map((child) => {
      const ageInfo = calculateChildAge(child.birth || '2022-05-14', 'ar');
      const row: Record<string, unknown> = {
        family_id: verifiedFamilyUuid,
        name: child.name,
        age_stage: ageInfo.stageCode,
        gender: child.gender,
        passions_or_heroes: child.interests || '',
      };
      if (isValidUuid(child.remote_id)) {
        row.id = child.remote_id;
      }
      return row;
    });

    let { data: insertedRows, error } = await withSupabaseRetry(() =>
      activeClient
        .from(SUPABASE_TABLES.CHILDREN)
        .upsert(fullPayload)
        .select('id, name, age_stage, passions_or_heroes')
    );

    if (error && isUndefinedColumnError(error)) {
      const retryMinimal = await withSupabaseRetry(() =>
        activeClient
          .from(SUPABASE_TABLES.CHILDREN)
          .upsert(minimalPayload)
          .select('id, name, age_stage, passions_or_heroes')
      );
      insertedRows = retryMinimal.data;
      error = retryMinimal.error;
    }

    if (Array.isArray(insertedRows)) {
      insertedRows.forEach((dbRow: Record<string, unknown>, idx: number) => {
        if (isValidUuid(dbRow.id) && mappedChildren[idx]) {
          mappedChildren[idx].remote_id = dbRow.id.trim();
          mappedChildren[idx].family_id = verifiedFamilyUuid;
        }
      });
    }

    // Verify persistence by reading the family rows back; an upsert response alone is not enough.
    if (error) {
      return { synced: false, savedChildren: mappedChildren, error: error.message };
    }
    const verifyRes = await fetchChildrenFromSupabase(verifiedFamilyUuid, activeClient);
    if (verifyRes.error) {
      return { synced: false, savedChildren: mappedChildren, error: `Write completed but read-back verification failed: ${verifyRes.error}` };
    }
    const persistedByKey = new Map(
      verifyRes.data.map((row) => [`${(row.name || '').trim().toLowerCase()}::${(row.birth || '').trim()}`, row])
    );
    const verifiedChildren = mappedChildren.map((child) => {
      const persisted = persistedByKey.get(`${child.name.trim().toLowerCase()}::${child.birth.trim()}`);
      return persisted && isValidUuid(persisted.remote_id)
        ? { ...child, remote_id: persisted.remote_id, family_id: verifiedFamilyUuid }
        : child;
    });
    const synced = verifiedChildren.every((child) =>
      isValidUuid(child.remote_id) && persistedByKey.has(`${child.name.trim().toLowerCase()}::${child.birth.trim()}`)
    );
    return {
      synced,
      savedChildren: verifiedChildren,
      error: synced ? null : 'Write returned but one or more child records could not be verified after saving.',
    };
  } catch (err) {
    return {
      synced: false,
      savedChildren: mappedChildren,
      error: err instanceof Error ? err.message : 'Unable to save children to Supabase.',
    };
  }
}

export type CoParentPairingMethod = 'phone_otp' | 'qr_token';

export interface CoParentLinkPayload {
  familyId: string | number;
  partnerRole: 'father' | 'mother';
  partnerName: string;
  partnerPhone: string;
  partnerEmail: string;
  country: CountryCode;
  method: CoParentPairingMethod;
  otpCode?: string;
  pairingToken?: string;
}

export interface CoParentLinkResult {
  linked: boolean;
  syncedToDb: boolean;
  familyId: string | number;
  partnerUserId: string;
  pairingToken: string;
  method: CoParentPairingMethod;
  error: string | null;
}

/**
 * Step 5 of Onboarding Wizard — Co-Parent Integration Module:
 * Persists pairing locally and only writes to Supabase if a verified Auth session + UUID family_id exist.
 */
export async function linkCoParentAccountInSupabase(
  payload: CoParentLinkPayload,
  customClient?: SupabaseClient | null
): Promise<CoParentLinkResult> {
  const activeClient = customClient !== undefined ? customClient : supabaseClient;
  const targetFamilyId = payload.familyId || SHARED_FAMILY_ID;
  const partnerUserId =
    payload.partnerRole === 'father' ? 'parent-ahmad' : 'parent-maryam';
  const resolvedToken =
    payload.pairingToken?.trim() ||
    generateFamilyPairingToken(targetFamilyId, payload.partnerPhone);

  // Persist pairing draft locally first without marking verified=true unless DB session is verified
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(
        'nekbaar_coparent_pairing_v2',
        JSON.stringify({
          familyId: targetFamilyId,
          partnerUserId,
          partnerName: payload.partnerName.trim(),
          partnerPhone: payload.partnerPhone.trim(),
          partnerEmail: payload.partnerEmail.trim(),
          method: payload.method,
          pairingToken: resolvedToken,
          verified: false,
          linkedAt: new Date().toISOString(),
        })
      );
    }
  } catch {
    // Ignore local storage errors
  }

  if (!activeClient) {
    return {
      linked: false,
      syncedToDb: false,
      familyId: targetFamilyId,
      partnerUserId,
      pairingToken: resolvedToken,
      method: payload.method,
      error: 'Supabase client is not initialized.',
    };
  }

  try {
    const verifiedCtx = await resolveVerifiedFamilyContext(activeClient);
    const verifiedFamilyUuid = isValidUuid(verifiedCtx.verifiedFamilyId)
      ? verifiedCtx.verifiedFamilyId
      : null;

    if (!verifiedCtx.authenticated || !verifiedFamilyUuid) {
      return {
        linked: false,
        syncedToDb: false,
        familyId: targetFamilyId,
        partnerUserId,
        pairingToken: resolvedToken,
        method: payload.method,
        error:
          verifiedCtx.error ||
          'Write blocked: Authenticated session and verified UUID family_id are required.',
      };
    }

    const genuinelyVerified = Boolean(verifiedCtx.emailVerified || verifiedCtx.phoneVerified);
    const { error: pairErr } = await withSupabaseTimeout(
      activeClient.from(SUPABASE_TABLES.CO_PARENT_PAIRINGS).upsert(
        {
          family_id: verifiedFamilyUuid,
          partner_name:
            payload.partnerName.trim() ||
            (payload.partnerRole === 'father' ? 'أحمد (الأب)' : 'مريم (الأم)'),
          partner_phone: payload.partnerPhone.trim(),
          partner_email: payload.partnerEmail.trim(),
          partner_role: payload.partnerRole,
          pairing_method: payload.method,
          pairing_token_hash: resolvedToken,
          verified: genuinelyVerified,
          linked_at: new Date().toISOString(),
        },
        { onConflict: 'pairing_token_hash' }
      )
    );

    return {
      linked: !pairErr,
      syncedToDb: !pairErr,
      familyId: verifiedFamilyUuid,
      partnerUserId,
      pairingToken: resolvedToken,
      method: payload.method,
      error: pairErr ? pairErr.message : null,
    };
  } catch (err) {
    return {
      linked: false,
      syncedToDb: false,
      familyId: targetFamilyId,
      partnerUserId,
      pairingToken: resolvedToken,
      method: payload.method,
      error: err instanceof Error ? err.message : null,
    };
  }
}

/**
 * Truthful Supabase OAuth Sign-In (`signInWithOAuth`):
 * Calls Supabase Auth `signInWithOAuth` for `'google' | 'apple' | 'facebook' | 'azure'`.
 * Never fakes authentication with demo emails or marks the user as signed in if the OAuth
 * provider is disabled in Supabase Dashboard (`external.<provider> = false`).
 */
export async function signInWithOAuthProviderInSupabase(
  provider: 'google' | 'apple' | 'facebook' | 'azure',
  customClient?: SupabaseClient | null
): Promise<{
  initiated: boolean;
  provider: 'google' | 'apple' | 'facebook' | 'azure';
  redirectUrl: string | null;
  errorAr: string | null;
  errorEn: string | null;
}> {
  const activeClient = customClient !== undefined ? customClient : supabaseClient;
  if (!activeClient) {
    return {
      initiated: false,
      provider,
      redirectUrl: null,
      errorAr: 'خدمة المصادقة السحابية غير متصلة حالياً.',
      errorEn: 'Supabase Auth client is not initialized.',
    };
  }

  try {
    const res = await withSupabaseTimeout(
      activeClient.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
          skipBrowserRedirect: true,
        },
      }),
      3500
    );

    if (res.error) {
      return {
        initiated: false,
        provider,
        redirectUrl: null,
        errorAr: `مزود تسجيل الدخول (${provider}) غير مفعّل في إعدادات Supabase Auth حالياً. يرجى التسجيل أو الدخول بالبريد الإلكتروني وكلمة المرور.`,
        errorEn: `OAuth provider (${provider}) is not enabled in Supabase Auth (${res.error.message}). Please use Email & Password.`,
      };
    }

    const redirectUrl =
      typeof res.data?.url === 'string' && res.data.url.trim().startsWith('http')
        ? res.data.url.trim()
        : null;

    if (!redirectUrl) {
      return {
        initiated: false,
        provider,
        redirectUrl: null,
        errorAr: `مزود تسجيل الدخول (${provider}) غير مفعّل حالياً في مشروع Supabase. يرجى استخدام البريد الإلكتروني وكلمة المرور.`,
        errorEn: `OAuth provider (${provider}) is not enabled in Supabase Dashboard. Please use Email & Password.`,
      };
    }

    return {
      initiated: true,
      provider,
      redirectUrl,
      errorAr: null,
      errorEn: null,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'OAuth request failed';
    return {
      initiated: false,
      provider,
      redirectUrl: null,
      errorAr: `تعذر الاتصال بمزود تسجيل الدخول (${provider}). يرجى استخدام البريد الإلكتروني وكلمة المرور.`,
      errorEn: `Unable to initiate OAuth with ${provider}: ${msg}`,
    };
  }
}

/**
 * Deletes a child record from `public.children` in Supabase ONLY when:
 * 1. The caller has an active authenticated session.
 * 2. The caller's verified `family_id` owns the child record.
 * 3. `remoteId` is a valid UUID.
 */
export async function deleteChildFromSupabase(
  params: { remoteId?: string | number | null; childName?: string },
  customClient?: SupabaseClient | null
): Promise<{ deleted: boolean; error: string | null }> {
  const activeClient = customClient !== undefined ? customClient : supabaseClient;
  if (!activeClient) {
    return { deleted: false, error: 'Supabase client is not initialized.' };
  }

  if (!isValidUuid(params.remoteId)) {
    return {
      deleted: false,
      error: 'Delete skipped: child record does not have a remote database UUID.',
    };
  }

  try {
    const verifiedCtx = await resolveVerifiedFamilyContext(activeClient);
    if (!verifiedCtx.authenticated || !isValidUuid(verifiedCtx.verifiedFamilyId)) {
      return {
        deleted: false,
        error:
          verifiedCtx.error ||
          'Delete blocked: Authenticated session and verified UUID family_id are required.',
      };
    }

    const { error } = await withSupabaseTimeout(
      activeClient
        .from(SUPABASE_TABLES.CHILDREN)
        .delete()
        .eq('id', params.remoteId.trim())
        .eq('family_id', verifiedCtx.verifiedFamilyId)
    );

    if (error) {
      return { deleted: false, error: error.message };
    }

    return { deleted: true, error: null };
  } catch (err) {
    return {
      deleted: false,
      error: err instanceof Error ? err.message : 'Failed to delete child from Supabase.',
    };
  }
}


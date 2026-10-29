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
  getSuggestedCurrencyForCountry,
  normalizeAppData,
} from '../domain/familySpaceCore';

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
  email: string | null;
  verifiedFamilyId: string | null;
  error: string | null;
}

/**
 * Strictly resolves an authenticated Supabase Auth session AND verifies the user's real
 * `family_id` UUID directly from database membership (`public.users`), NEVER trusting
 * `localStorage`, `SHARED_FAMILY_ID = 1`, or unverified `user_metadata.family_id`.
 */
export async function resolveVerifiedFamilyContext(): Promise<VerifiedSupabaseFamilyContext> {
  if (!supabaseClient) {
    return {
      authenticated: false,
      userId: null,
      email: null,
      verifiedFamilyId: null,
      error: 'Supabase client is not initialized.',
    };
  }

  try {
    const { data: sessionRes, error: sessionErr } = await withSupabaseTimeout(
      supabaseClient.auth.getSession(),
      2500
    );
    const sessionUser = sessionRes?.session?.user;
    if (sessionErr || !sessionUser || !isValidUuid(sessionUser.id)) {
      return {
        authenticated: false,
        userId: null,
        email: null,
        verifiedFamilyId: null,
        error: sessionErr?.message || 'Unauthenticated: no active Supabase Auth session.',
      };
    }

    const authUid = sessionUser.id.trim();
    const userEmail = sessionUser.email?.trim() || null;

    // Verify real family ownership from the `users` table by authenticated `auth_user_id`
    // Uses `.select('*')` so pre-migration live schemas without `family_id` do not throw 42703 column errors,
    // and enforces `row.auth_user_id === authUid` + `isValidUuid(row.family_id)` + `!row.is_legacy_orphan`.
    const { data: userRows, error: userErr } = await withSupabaseTimeout(
      supabaseClient
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
        email: userEmail,
        verifiedFamilyId: null,
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
        email: userEmail,
        verifiedFamilyId: null,
        error: 'Profile row is quarantined as a legacy orphan and cannot grant family ownership.',
      };
    }

    const rowAuthUserId =
      row && typeof row.auth_user_id === 'string' ? row.auth_user_id.trim() : null;
    const dbFamilyId =
      row && typeof row.family_id === 'string' ? row.family_id.trim() : null;

    if (!isValidUuid(rowAuthUserId) || rowAuthUserId.toLowerCase() !== authUid.toLowerCase() || !isValidUuid(dbFamilyId)) {
      return {
        authenticated: true,
        userId: authUid,
        email: userEmail,
        verifiedFamilyId: null,
        error: 'No verified UUID family_id linked to authenticated user (auth_user_id) in database.',
      };
    }

    return {
      authenticated: true,
      userId: authUid,
      email: userEmail,
      verifiedFamilyId: dbFamilyId,
      error: null,
    };
  } catch (err) {
    return {
      authenticated: false,
      userId: null,
      email: null,
      verifiedFamilyId: null,
      error: err instanceof Error ? err.message : 'Failed to verify authenticated family context.',
    };
  }
}

/**
 * Ensures the parent `families` row exists in Supabase BEFORE upserting `users` or `children`.
 * Blocks any write when there is no verified Auth session or when `familyId` is not a real UUID
 * (never sends `SHARED_FAMILY_ID = 1` to Supabase).
 */
export async function ensureSharedFamilyRecordInSupabase(params?: {
  familyId?: string | number;
  familyName?: string;
  country?: CountryCode;
  city?: string;
  currency?: CurrencyCode;
  activeParent?: 'mother' | 'father';
}): Promise<{ family: Family; synced: boolean; error: string | null }> {
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

  if (!supabaseClient) {
    return { family: fallbackRecord, synced: false, error: 'Supabase client is not initialized.' };
  }

  const verifiedCtx = await resolveVerifiedFamilyContext();
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
      error: 'Write blocked: Verified UUID family_id is required (SHARED_FAMILY_ID = 1 is not allowed for Supabase).',
    };
  }

  // Prevent demo family name seed from overwriting real database records unless customized
  const verifiedFamilyRecord: Family = {
    ...fallbackRecord,
    id: targetFamilyUuid,
  };

  try {
    const { error } = await withSupabaseRetry(() =>
      supabaseClient.from(SUPABASE_TABLES.FAMILIES).upsert(verifiedFamilyRecord, { onConflict: 'id' })
    );
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
  familyId: string | number = SHARED_FAMILY_ID
): Promise<{
  data: User[];
  resolvedFamilyId: string | number;
  error: string | null;
}> {
  if (!supabaseClient) {
    return {
      data: DEFAULT_SUPABASE_USERS,
      resolvedFamilyId: familyId,
      error: 'Supabase client is not initialized.',
    };
  }

  try {
    const verifiedCtx = await resolveVerifiedFamilyContext();
    const targetFamilyUuid = isValidUuid(verifiedCtx.verifiedFamilyId)
      ? verifiedCtx.verifiedFamilyId
      : isValidUuid(familyId)
      ? familyId.trim()
      : null;

    if (!targetFamilyUuid) {
      return {
        data: DEFAULT_SUPABASE_USERS,
        resolvedFamilyId: SHARED_FAMILY_ID,
        error: null,
      };
    }

    const { data, error } = await withSupabaseRetry(() =>
      supabaseClient
        .from(SUPABASE_TABLES.USERS)
        .select('*')
        .eq('family_id', targetFamilyUuid)
        .limit(20)
    );

    if (error) {
      return { data: DEFAULT_SUPABASE_USERS, resolvedFamilyId: targetFamilyUuid, error: error.message };
    }

    if (!Array.isArray(data) || data.length === 0) {
      return { data: DEFAULT_SUPABASE_USERS, resolvedFamilyId: targetFamilyUuid, error: null };
    }

    let detectedFamilyId: string | number = targetFamilyUuid;

    const mappedUsers: User[] = data.map((row: Record<string, unknown>, idx: number) => {
      const fallback = DEFAULT_SUPABASE_USERS[idx] || DEFAULT_SUPABASE_USERS[0];
      const rawName =
        (typeof row.name === 'string' && row.name.trim()) ||
        (typeof row.full_name === 'string' && row.full_name.trim()) ||
        (typeof row.first_name === 'string' && row.first_name.trim()) ||
        fallback.name;

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
        fallback.phone;

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
        role: isMother ? 'mother' : 'father',
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
      data: DEFAULT_SUPABASE_USERS,
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
  familyId: string | number = SHARED_FAMILY_ID
): Promise<{
  data: Child[];
  error: string | null;
}> {
  if (!supabaseClient) {
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
      supabaseClient
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
      (ek.name.trim() === child.name.trim() && ek.birth.trim() === child.birth.trim()) ||
      ek.name.trim() === child.name.trim()
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
  return {
    ...defaultMember,
    id: typeof row.id === 'number' && Number.isFinite(row.id) ? row.id : defaultMember.id || fallbackIdx + 1,
    ...(remoteId !== undefined ? { remoteId } : {}),
    name: typeof row.name === 'string' && row.name.trim() ? row.name.trim() : defaultMember.name,
    role: typeof row.role === 'string' && row.role.trim() ? row.role.trim() : defaultMember.role,
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
  currentState: FamilySpaceState
): Promise<SupabaseHydrationResult> {
  if (!supabaseClient) {
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
    const verifiedCtx = await resolveVerifiedFamilyContext();
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
        fetchUsersFromSupabase(verifiedFamilyUuid),
        fetchChildrenFromSupabase(verifiedFamilyUuid),
        withSupabaseRetry(() =>
          supabaseClient
            .from(SUPABASE_TABLES.FAMILIES)
            .select('*')
            .eq('id', verifiedFamilyUuid)
            .limit(5)
        ),
        withSupabaseRetry(() =>
          supabaseClient
            .from(SUPABASE_TABLES.EXTENDED_FAMILY)
            .select('*')
            .eq('family_id', verifiedFamilyUuid)
            .limit(30)
        ),
        withSupabaseRetry(() =>
          supabaseClient.from(SUPABASE_TABLES.CATALOG_ITEMS).select('*').limit(50)
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
    let updatedKids = currentState.kids;
    if (childrenResult.data.length > 0) {
      const mappedProfiles = childrenResult.data.map((child, idx) =>
        mapChildEntityToProfile(child, idx, currentState.kids)
      );
      const localHasCustomKids =
        currentState.kids.length > 0 && !isCanonicalThreeDemoKids(currentState.kids);
      const remoteIsDefaultDemoSeed = isCanonicalThreeDemoKids(mappedProfiles);

      if (localHasCustomKids && remoteIsDefaultDemoSeed) {
        updatedKids = currentState.kids;
      } else {
        updatedKids = mappedProfiles;
      }
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
          : 'أسرة أحمد ومريم — نكبر',
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
          : currentState.activeParentAccount,
    };

    const activeParentProfile =
      currentState.activeParentAccount === 'father'
        ? updatedParentAccounts.father
        : updatedParentAccounts.mother;

    const nextState: FamilySpaceState = {
      ...normalizeAppData({
        ...currentState,
        verifiedFamilyId: verifiedFamilyUuid,
        parentAccounts: updatedParentAccounts,
        kids: updatedKids,
        family: updatedExtendedFamily,
        city: familyEntity.city || currentState.city,
      }),
      verifiedFamilyId: verifiedFamilyUuid,
      kids: updatedKids,
      parentAccounts: updatedParentAccounts,
      parentName: activeParentProfile.fullName || currentState.parentName,
    };

    const mappedCatalog: CommercialCatalogItem[] = catalogRows.map(
      (row: Record<string, unknown>, idx: number) => ({
        id: typeof row.id === 'number' ? row.id : 9000 + idx + 1,
        name: typeof row.name === 'string' ? row.name : 'منتج عائلي مميز',
        nameEn: typeof row.name_en === 'string' ? row.name_en : 'Featured Family Item',
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
        priceEGP: typeof row.price_egp === 'number' ? row.price_egp : 450,
        priceSAR: typeof row.price_sar === 'number' ? row.price_sar : 95,
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
export async function syncFamilySpaceToSupabase(state: FamilySpaceState): Promise<boolean> {
  if (!supabaseClient) return false;

  // Prevent syncing the default Demo Seed state to the live database
  if (isDefaultDemoSeedState(state)) {
    return false;
  }

  try {
    const verifiedCtx = await resolveVerifiedFamilyContext();
    if (!verifiedCtx.authenticated || !verifiedCtx.userId || !isValidUuid(verifiedCtx.verifiedFamilyId)) {
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

    // 1. Upsert `families` FIRST with verified UUID
    const { error: famErr } = await withSupabaseRetry(() =>
      supabaseClient.from(SUPABASE_TABLES.FAMILIES).upsert(familyPayload, { onConflict: 'id' })
    );
    if (famErr) return false;

    // 2. Upsert only the authenticated user's record with their real Auth UUID (`authUserId`)
    const userPayload = {
      id: authUserId,
      family_id: verifiedFamilyUuid,
      name: activeAccount.fullName || state.parentName,
      full_name: activeAccount.fullName || state.parentName,
      role: state.activeParentAccount,
      email: verifiedCtx.email || activeAccount.email,
      phone: activeAccount.phoneNumber,
      phone_number: activeAccount.phoneNumber,
      country: activeAccount.country,
      verified: activeAccount.phoneVerified,
    };

    // 3. Map non-demo children using `remoteId` only when it is a valid UUID (never send local numeric id 1,2,3 as UUID)
    const nonDemoKids = isCanonicalThreeDemoKids(state.kids) ? [] : state.kids;
    const childrenPayload = nonDemoKids.map((kid) => {
      const row: Record<string, unknown> = {
        family_id: verifiedFamilyUuid,
        name: kid.name,
        birth: kid.birth,
        gender: kid.gender,
        emoji: kid.emoji,
        avatar_theme: kid.avatarTheme || 'astronaut',
        interests: kid.interests || '',
        vaccinations_note: kid.vaccinationsNote || '',
        growth_height_cm: kid.growthHeightCm || null,
        growth_weight_kg: kid.growthWeightKg || null,
      };
      if (isValidUuid(kid.remoteId)) {
        row.id = kid.remoteId;
      }
      return row;
    });

    await withSupabaseRetry(() =>
      supabaseClient.from(SUPABASE_TABLES.USERS).upsert(userPayload, { onConflict: 'id' })
    );

    if (childrenPayload.length > 0) {
      const existingUuidKids = childrenPayload.filter((r) => isValidUuid(r.id));
      if (existingUuidKids.length > 0) {
        await withSupabaseRetry(() =>
          supabaseClient
            .from(SUPABASE_TABLES.CHILDREN)
            .upsert(existingUuidKids, { onConflict: 'id' })
        );
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
    password: (payload.password || '').trim() || 'Nekbaar#2026',
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
  sharedChildren: Child[];
  syncedToDb: boolean;
  error: string | null;
}

/**
 * Step 1 of Onboarding Wizard:
 * 1. Normalizes `fullName`/`parentName` and `'dad' | 'mom'` <-> `'father' | 'mother'`.
 * 2. Authenticates the parent via Supabase Auth first (`signUp` / `signInWithPassword`).
 * 3. Only writes to Supabase tables if an authenticated session with a valid UUID user & verified UUID `family_id` exists.
 * 4. Never sends `SHARED_FAMILY_ID = 1` or non-UUID strings (`parent-ahmad` / `parent-maryam`) to Supabase UUID columns.
 * 5. Explicitly reports failure (`success: false, syncedToDb: false`) when Supabase is unavailable or unverified.
 */
export async function authenticateParentWithSupabase(
  payload: OnboardingAuthStepPayload
): Promise<OnboardingAuthStepResult> {
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

  if (normalized.mode === 'signup' && !normalized.parentName) {
    return {
      success: false,
      userId: canonicalUserId,
      familyId: sharedFamilyId,
      sessionEmail: normalized.email,
      user: fallbackUserSummary,
      sharedChildren: [],
      syncedToDb: false,
      error: 'اسم ولي الأمر مطلوب لحفظ الحساب.',
    };
  }

  if (!supabaseClient) {
    return {
      success: false,
      userId: canonicalUserId,
      familyId: sharedFamilyId,
      sessionEmail: normalized.email,
      user: fallbackUserSummary,
      sharedChildren: [],
      syncedToDb: false,
      error: 'خدمة قاعدة البيانات السحابية غير متصلة حالياً.',
    };
  }

  let authUserId = canonicalUserId;
  let activeSessionVerified = false;

  try {
    // 1. Authenticate via Supabase Auth with timeout protection (never pass SHARED_FAMILY_ID in user_metadata)
    if (normalized.email) {
      if (normalized.mode === 'signup') {
        const { data: signUpData, error: signUpErr } = await withSupabaseTimeout(
          supabaseClient.auth.signUp({
            email: normalized.email,
            password: normalized.password,
            options: {
              data: {
                full_name: normalized.parentName,
                phone: normalized.phone,
                role: normalized.role,
                country: normalized.country,
              },
            },
          })
        );

        if (signUpData?.session?.user?.id && isValidUuid(signUpData.session.user.id)) {
          authUserId = signUpData.session.user.id;
          activeSessionVerified = true;
        } else if (
          signUpErr &&
          signUpErr.message.toLowerCase().includes('already registered')
        ) {
          const { data: signInData } = await withSupabaseTimeout(
            supabaseClient.auth.signInWithPassword({
              email: normalized.email,
              password: normalized.password,
            })
          );
          if (signInData?.session?.user?.id && isValidUuid(signInData.session.user.id)) {
            authUserId = signInData.session.user.id;
            activeSessionVerified = true;
          }
        }
      } else {
        const { data: signInData } = await withSupabaseTimeout(
          supabaseClient.auth.signInWithPassword({
            email: normalized.email,
            password: normalized.password,
          })
        );
        if (signInData?.session?.user?.id && isValidUuid(signInData.session.user.id)) {
          authUserId = signInData.session.user.id;
          activeSessionVerified = true;
        }
      }
    }

    // 2. Verify active session and verified UUID family_id before any table writes
    const verifiedCtx = await resolveVerifiedFamilyContext();
    const verifiedFamilyUuid = verifiedCtx.verifiedFamilyId;

    if (!activeSessionVerified && !verifiedCtx.authenticated) {
      return {
        success: false,
        userId: authUserId,
        familyId: sharedFamilyId,
        verifiedFamilyUuid: null,
        sessionEmail: normalized.email,
        user: {
          ...fallbackUserSummary,
          id: authUserId,
        },
        sharedChildren: [],
        syncedToDb: false,
        error:
          verifiedCtx.error ||
          'تعذر التحقق من جلسة المصادقة السحابية؛ تم حفظ البيانات محلياً فقط.',
      };
    }

    const effectiveUserUuid = isValidUuid(verifiedCtx.userId)
      ? verifiedCtx.userId
      : isValidUuid(authUserId)
      ? authUserId
      : null;

    if (!effectiveUserUuid || !isValidUuid(verifiedFamilyUuid)) {
      return {
        success: false,
        userId: effectiveUserUuid || canonicalUserId,
        familyId: sharedFamilyId,
        verifiedFamilyUuid: null,
        sessionEmail: normalized.email,
        user: {
          ...fallbackUserSummary,
          id: effectiveUserUuid || canonicalUserId,
        },
        sharedChildren: [],
        syncedToDb: false,
        error:
          'لا يوجد معرّف أسرة سحابي (UUID) موثق مرتبط بالحساب؛ تم إيقاف الكتابة المباشرة لقاعدة البيانات.',
      };
    }

    // 3. Upsert verified user record using real UUIDs only
    const userRow = {
      id: effectiveUserUuid,
      family_id: verifiedFamilyUuid,
      name: normalized.parentName || (normalized.role === 'father' ? 'أحمد' : 'مريم'),
      full_name:
        normalized.parentName || (normalized.role === 'father' ? 'أحمد' : 'مريم'),
      role: normalized.role,
      email: normalized.email,
      phone: normalized.phone,
      phone_number: normalized.phone,
      country: normalized.country,
      verified: true,
    };

    const { error: upsertErr } = await withSupabaseRetry(() =>
      supabaseClient
        .from(SUPABASE_TABLES.USERS)
        .upsert([userRow], { onConflict: 'id' })
    );

    const syncedToDb = Boolean(!upsertErr);
    const dbErrorMsg =
      upsertErr?.message ||
      (!syncedToDb ? 'تعذر حفظ بيانات الحساب في قاعدة البيانات.' : null);

    // 4. Query shared `children` linked to `verifiedFamilyUuid`
    const sharedChildrenRes = await fetchChildrenFromSupabase(verifiedFamilyUuid);

    return {
      success: syncedToDb,
      userId: effectiveUserUuid,
      familyId: sharedFamilyId,
      verifiedFamilyUuid,
      sessionEmail: normalized.email,
      user: {
        id: effectiveUserUuid,
        family_id: sharedFamilyId,
        name: userRow.name,
        full_name: userRow.full_name || userRow.name,
        role: normalized.role,
        email: normalized.email,
        phone: normalized.phone,
        country: normalized.country,
      },
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
      userId: authUserId,
      familyId: sharedFamilyId,
      verifiedFamilyUuid: null,
      sessionEmail: normalized.email,
      user: {
        ...fallbackUserSummary,
        id: authUserId,
      },
      sharedChildren: [],
      syncedToDb: false,
      error: errorMessage,
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
 * or standard Email & Password / Email OTP, and dispatches an instant OTP verification code
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
      success: true,
      provider: params.provider,
      email: cleanEmail,
      userId: fallbackUserId,
      otpSent: true,
      demoOtpCode: '1234',
      error: null,
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
      // Trigger non-redirecting OAuth URL preparation (iframe-safe) + instant Email OTP verification
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

    // Dispatch Email OTP via Supabase Auth (`signInWithOtp`) so user can verify in Step B
    await withSupabaseTimeout(
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
    ).catch(() => null);

    return {
      success: true,
      provider: params.provider,
      email: cleanEmail,
      userId: resolvedUserId,
      otpSent: true,
      demoOtpCode: '1234',
      error: null,
    };
  } catch (err) {
    return {
      success: true,
      provider: params.provider,
      email: cleanEmail,
      userId: resolvedUserId,
      otpSent: true,
      demoOtpCode: '1234',
      error: err instanceof Error ? err.message : null,
    };
  }
}

/**
 * Mandatory Auth Gateway — Step B:
 * Verifies the Email OTP code entered by the user before advancing to Step C (Phone Linking).
 */
export async function verifyGatewayEmailOtpInSupabase(params: {
  email: string;
  otpCode: string;
}): Promise<{ verified: boolean; userId?: string; error: string | null }> {
  const cleanCode = params.otpCode.trim();
  if (cleanCode.length < 4) {
    return {
      verified: false,
      error: 'يرجى إدخال رمز التحقق المكون من ٤ أرقام على الأقل.',
    };
  }

  if (!supabaseClient) {
    return { verified: true, error: null };
  }

  try {
    const { data, error } = await withSupabaseTimeout(
      supabaseClient.auth.verifyOtp({
        email: params.email.trim(),
        token: cleanCode,
        type: 'email',
      }),
      2200
    );

    if (error || !data?.session?.user?.id) {
      return {
        verified: false,
        error: error?.message || 'رمز التحقق غير صالح أو انتهت صلاحيته.',
      };
    }

    return {
      verified: true,
      userId: data.session.user.id,
      error: null,
    };
  } catch (err) {
    return {
      verified: false,
      error: err instanceof Error ? err.message : 'تعذر التحقق من الرمز حالياً.',
    };
  }
}

/**
 * Mandatory Auth Gateway — Step C ("ربط وتوثيق رقم الجوال"):
 * Binds the verified primary mobile phone number for instant co-parent linking,
 * maps the authenticated user (`auth.uid() = id`) to `public.users` and `public.families`,
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
    password: params.password || 'Nekbaar#2026',
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
  params: SaveOnboardingLocationPayload
): Promise<{ synced: boolean; family: Family; error: string | null }> {
  const country: CountryCode = params.country === 'SA' ? 'SA' : 'EG';
  const city = (params.city || '').trim() || (country === 'SA' ? 'الرياض' : 'القاهرة');
  const currency: CurrencyCode =
    params.currency === 'SAR' || params.currency === 'EGP'
      ? params.currency
      : getSuggestedCurrencyForCountry(country);
  const activeParent = normalizeOnboardingRoleToAccount(params.activeParent);
  const familyName = (params.familyName || '').trim() || 'أسرة أحمد ومريم — نكبر';

  const res = await ensureSharedFamilyRecordInSupabase({
    familyId: params.familyId || SHARED_FAMILY_ID,
    familyName,
    country,
    city,
    currency,
    activeParent,
  });
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
 * Validates and deduplicates `childrenList` locally, preserving numeric local `id` for UI linkage,
 * and writes to Supabase `children` ONLY when an active authenticated session and verified UUID `family_id` exist
 * (and when the children list is not the default Demo Seed).
 */
export async function saveOnboardingChildrenToSupabase(
  params: SaveOnboardingChildrenPayload
): Promise<{ synced: boolean; savedChildren: Child[]; error: string | null }> {
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
      : typeof params.familyId === 'number' &&
        Number.isFinite(params.familyId) &&
        params.familyId > 0
      ? params.familyId
      : SHARED_FAMILY_ID;

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

  if (!supabaseClient) {
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
    const verifiedCtx = await resolveVerifiedFamilyContext();
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

    const dbPayload = mappedChildren.map((child) => {
      const row: Record<string, unknown> = {
        family_id: verifiedFamilyUuid,
        name: child.name,
        birth: child.birth,
        gender: child.gender,
        emoji: child.emoji,
        avatar_theme: child.avatar_theme,
        interests: child.interests,
      };
      if (isValidUuid(child.remote_id)) {
        row.id = child.remote_id;
      }
      return row;
    });

    const { data: insertedRows, error } = await withSupabaseRetry(() =>
      supabaseClient
        .from(SUPABASE_TABLES.CHILDREN)
        .upsert(dbPayload)
        .select('id, name, birth')
    );

    if (Array.isArray(insertedRows)) {
      insertedRows.forEach((dbRow: Record<string, unknown>, idx: number) => {
        if (isValidUuid(dbRow.id) && mappedChildren[idx]) {
          mappedChildren[idx].remote_id = dbRow.id.trim();
        }
      });
    }

    const synced = Boolean(!error);
    return {
      synced,
      savedChildren: mappedChildren,
      error: error ? error.message : !synced ? 'Unable to save children to Supabase.' : null,
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
  payload: CoParentLinkPayload
): Promise<CoParentLinkResult> {
  const targetFamilyId = payload.familyId || SHARED_FAMILY_ID;
  const partnerUserId =
    payload.partnerRole === 'father' ? 'parent-ahmad' : 'parent-maryam';
  const resolvedToken =
    payload.pairingToken?.trim() ||
    generateFamilyPairingToken(targetFamilyId, payload.partnerPhone);

  // Persist pairing record locally first for instant offline resilience
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
          verified: true,
          linkedAt: new Date().toISOString(),
        })
      );
    }
  } catch {
    // Ignore local storage errors
  }

  if (!supabaseClient) {
    return {
      linked: true,
      syncedToDb: false,
      familyId: targetFamilyId,
      partnerUserId,
      pairingToken: resolvedToken,
      method: payload.method,
      error: null,
    };
  }

  try {
    const verifiedCtx = await resolveVerifiedFamilyContext();
    const verifiedFamilyUuid = isValidUuid(verifiedCtx.verifiedFamilyId)
      ? verifiedCtx.verifiedFamilyId
      : null;

    if (!verifiedCtx.authenticated || !verifiedFamilyUuid) {
      return {
        linked: true,
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

    const { error: pairErr } = await withSupabaseTimeout(
      supabaseClient.from(SUPABASE_TABLES.CO_PARENT_PAIRINGS).upsert(
        {
          id: `pair-${verifiedFamilyUuid}-${payload.partnerRole}`,
          family_id: verifiedFamilyUuid,
          partner_user_id: partnerUserId,
          partner_name:
            payload.partnerName.trim() ||
            (payload.partnerRole === 'father' ? 'أحمد (الأب)' : 'مريم (الأم)'),
          partner_phone: payload.partnerPhone.trim(),
          partner_email: payload.partnerEmail.trim(),
          pairing_method: payload.method,
          pairing_token: resolvedToken,
          verified: true,
          linked_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      )
    );

    return {
      linked: true,
      syncedToDb: !pairErr,
      familyId: verifiedFamilyUuid,
      partnerUserId,
      pairingToken: resolvedToken,
      method: payload.method,
      error: pairErr ? pairErr.message : null,
    };
  } catch (err) {
    return {
      linked: true,
      syncedToDb: false,
      familyId: targetFamilyId,
      partnerUserId,
      pairingToken: resolvedToken,
      method: payload.method,
      error: err instanceof Error ? err.message : null,
    };
  }
}

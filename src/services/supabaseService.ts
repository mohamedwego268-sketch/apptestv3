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
 * Shared canonical family ID linking both parents (Ahmed & Mariam)
 * to the exact same `families(id)` record and `children` records (Hamza, Laila, Youssef).
 */
export const SHARED_FAMILY_ID = 1;
export const SUPABASE_QUERY_TIMEOUT_MS = 6500;

/**
 * Database Table Names Bound to Nekbaar (نكبر)
 */
export const SUPABASE_TABLES = {
  USERS: 'users',
  FAMILIES: 'families',
  CHILDREN: 'children',
  EXTENDED_FAMILY: 'extended_family',
  CATALOG_ITEMS: 'catalog_items',
} as const;

/**
 * Clean TypeScript interface for `families` table rows (Parent Root Entity)
 */
export interface Family {
  id: number;
  family_name: string;
  country: CountryCode;
  city: string;
  currency: CurrencyCode;
  active_parent?: 'mother' | 'father';
  updated_at?: string;
}

/**
 * Clean TypeScript interface for `users` table rows (Parents: Ahmed & Mariam)
 * Enforces strict foreign key `family_id` referencing `families(id)`.
 */
export interface User {
  id: string;
  /** Foreign key referencing `families(id)` */
  family_id: number;
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
  /** Foreign key referencing `families(id)` */
  family_id: number;
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
  sharedFamilyId: number;
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
 * Canonical fallback User entities for Ahmed and Mariam linked to `SHARED_FAMILY_ID` (1)
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
 * linked to `SHARED_FAMILY_ID` (1)
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

/**
 * Ensures the parent `families` row exists in Supabase BEFORE upserting `users` or `children`,
 * strictly satisfying the `users.family_id -> families(id)` foreign key constraint.
 */
export async function ensureSharedFamilyRecordInSupabase(params?: {
  familyId?: number;
  familyName?: string;
  country?: CountryCode;
  city?: string;
  currency?: CurrencyCode;
  activeParent?: 'mother' | 'father';
}): Promise<{ family: Family; synced: boolean; error: string | null }> {
  const targetFamilyId = params?.familyId || SHARED_FAMILY_ID;
  const country = params?.country || 'SA';
  const familyRecord: Family = {
    id: targetFamilyId,
    family_name: params?.familyName?.trim() || 'أسرة أحمد ومريم — نكبر',
    country,
    city: params?.city?.trim() || (country === 'SA' ? 'الدمام' : 'القاهرة'),
    currency: params?.currency || getSuggestedCurrencyForCountry(country),
    active_parent: params?.activeParent || 'mother',
    updated_at: new Date().toISOString(),
  };

  if (!supabaseClient) {
    return { family: familyRecord, synced: false, error: 'Supabase client is not initialized.' };
  }

  try {
    const { error } = await withSupabaseTimeout(
      supabaseClient.from(SUPABASE_TABLES.FAMILIES).upsert(familyRecord)
    );
    return {
      family: familyRecord,
      synced: !error,
      error: error ? error.message : null,
    };
  } catch (err) {
    return {
      family: familyRecord,
      synced: false,
      error: err instanceof Error ? err.message : 'Failed to ensure shared family record.',
    };
  }
}

/**
 * Queries the `users` table in Supabase and normalizes rows into clean `User` entities
 * with strict `family_id` foreign key linkage.
 */
export async function fetchUsersFromSupabase(
  familyId: number = SHARED_FAMILY_ID
): Promise<{
  data: User[];
  resolvedFamilyId: number;
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
    const { data, error } = await withSupabaseTimeout(
      supabaseClient.from(SUPABASE_TABLES.USERS).select('*').limit(20)
    );

    if (error) {
      return { data: DEFAULT_SUPABASE_USERS, resolvedFamilyId: familyId, error: error.message };
    }

    if (!Array.isArray(data) || data.length === 0) {
      return { data: DEFAULT_SUPABASE_USERS, resolvedFamilyId: familyId, error: null };
    }

    let detectedFamilyId = familyId;

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

      const rowFamilyId =
        typeof row.family_id === 'number' && Number.isFinite(row.family_id)
          ? row.family_id
          : typeof row.family_id === 'string' && Number.isFinite(Number(row.family_id))
          ? Number(row.family_id)
          : SHARED_FAMILY_ID;

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
 * Queries the `children` table in Supabase for the shared `family_id` so both Ahmed and Mariam
 * see identical children data (Hamza 6m, Laila 4y, Youssef 8y).
 */
export async function fetchChildrenFromSupabase(
  familyId: number = SHARED_FAMILY_ID
): Promise<{
  data: Child[];
  error: string | null;
}> {
  if (!supabaseClient) {
    return {
      data: DEFAULT_SUPABASE_CHILDREN,
      error: 'Supabase client is not initialized.',
    };
  }

  try {
    const { data, error } = await withSupabaseTimeout(
      supabaseClient
        .from(SUPABASE_TABLES.CHILDREN)
        .select('*')
        .order('id', { ascending: true })
    );

    if (error) {
      return { data: DEFAULT_SUPABASE_CHILDREN, error: error.message };
    }

    if (!Array.isArray(data) || data.length === 0) {
      return { data: DEFAULT_SUPABASE_CHILDREN, error: null };
    }

    // Filter rows matching the shared `family_id` (or include rows where `family_id` is null/matching)
    const familyFilteredRows = data.filter((row: Record<string, unknown>) => {
      if (row.family_id === undefined || row.family_id === null) return true;
      return Number(row.family_id) === Number(familyId);
    });

    const sourceRows = familyFilteredRows.length > 0 ? familyFilteredRows : data;

    const mappedChildren: Child[] = sourceRows.map(
      (row: Record<string, unknown>, idx: number) => {
        const defaultKid = DEFAULT_SUPABASE_CHILDREN[idx] || DEFAULT_SUPABASE_CHILDREN[0];
        const rawName =
          (typeof row.name === 'string' && row.name.trim()) ||
          (typeof row.full_name === 'string' && row.full_name.trim()) ||
          (typeof row.first_name === 'string' && row.first_name.trim()) ||
          defaultKid.name;

        let normalizedName = rawName;
        const lower = rawName.toLowerCase();
        if (lower === 'hamza') normalizedName = 'حمزة';
        else if (lower === 'laila' || lower === 'layla') normalizedName = 'ليلى';
        else if (lower === 'youssef' || lower === 'yousef' || lower === 'yusuf')
          normalizedName = 'يوسف';

        const isGirl =
          row.gender === 'girl' ||
          row.gender === 'female' ||
          normalizedName.includes('ليلى') ||
          lower.includes('laila') ||
          lower.includes('layla');

        const rawBirth =
          (typeof row.birth === 'string' && row.birth.trim()) ||
          (typeof row.birth_date === 'string' && row.birth_date.trim()) ||
          (typeof row.date_of_birth === 'string' && row.date_of_birth.trim()) ||
          defaultKid.birth;

        return {
          id: typeof row.id === 'number' ? row.id : defaultKid.id,
          family_id:
            typeof row.family_id === 'number'
              ? row.family_id
              : Number(row.family_id) || familyId,
          name: normalizedName,
          birth: rawBirth,
          gender: isGirl ? 'girl' : 'boy',
          emoji:
            typeof row.emoji === 'string' && row.emoji.trim() ? row.emoji : defaultKid.emoji,
          avatar_theme:
            (typeof row.avatar_theme === 'string'
              ? (row.avatar_theme as ChildProfile['avatarTheme'])
              : defaultKid.avatar_theme) || defaultKid.avatar_theme,
          interests:
            typeof row.interests === 'string' && row.interests.trim()
              ? row.interests
              : defaultKid.interests,
          vaccinations_note:
            typeof row.vaccinations_note === 'string' && row.vaccinations_note.trim()
              ? row.vaccinations_note
              : defaultKid.vaccinations_note,
          growth_height_cm:
            typeof row.growth_height_cm === 'number'
              ? row.growth_height_cm
              : defaultKid.growth_height_cm,
          growth_weight_kg:
            typeof row.growth_weight_kg === 'number'
              ? row.growth_weight_kg
              : defaultKid.growth_weight_kg,
        };
      }
    );

    return { data: mappedChildren, error: null };
  } catch (err) {
    return {
      data: DEFAULT_SUPABASE_CHILDREN,
      error: err instanceof Error ? err.message : 'Network error while fetching children.',
    };
  }
}

/**
 * Converts a `Child` entity from Supabase into Nekbaar's domain `ChildProfile`.
 */
function mapChildEntityToProfile(child: Child, fallbackIdx: number): ChildProfile {
  const defaultKid = DEFAULT_SEED.kids[fallbackIdx] || DEFAULT_SEED.kids[0];
  return {
    ...defaultKid,
    id: child.id || defaultKid.id,
    name: child.name || defaultKid.name,
    birth: child.birth || defaultKid.birth,
    gender: child.gender === 'girl' || child.gender === 'female' ? 'girl' : 'boy',
    emoji: child.emoji || defaultKid.emoji,
    avatarTheme: child.avatar_theme || defaultKid.avatarTheme,
    interests: child.interests || defaultKid.interests,
    vaccinationsNote: child.vaccinations_note || defaultKid.vaccinationsNote,
    growthHeightCm:
      typeof child.growth_height_cm === 'number'
        ? child.growth_height_cm
        : defaultKid.growthHeightCm,
    growthWeightKg:
      typeof child.growth_weight_kg === 'number'
        ? child.growth_weight_kg
        : defaultKid.growthWeightKg,
  };
}

/**
 * Maps a database row from `extended_family` into Nekbaar's `FamilyMember` structure.
 */
function mapSupabaseExtendedFamilyRow(
  row: Record<string, unknown>,
  fallbackIdx: number
): FamilyMember {
  const defaultMember = DEFAULT_SEED.family[fallbackIdx] || DEFAULT_SEED.family[0];
  return {
    ...defaultMember,
    id: typeof row.id === 'number' ? row.id : defaultMember.id,
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
 * Fetches Users (Ahmed, Mariam), Shared Family (`family_id`), Children (Hamza, Laila, Youssef),
 * Extended Family, and Catalog items dynamically from Supabase with timeout protection.
 */
export async function fetchFamilySpaceFromSupabase(
  currentState: FamilySpaceState
): Promise<SupabaseHydrationResult> {
  if (!supabaseClient) {
    return {
      nextState: currentState,
      users: DEFAULT_SUPABASE_USERS,
      family: null,
      children: DEFAULT_SUPABASE_CHILDREN,
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
    const usersResult = await fetchUsersFromSupabase(SHARED_FAMILY_ID);
    const activeSharedFamilyId = usersResult.resolvedFamilyId || SHARED_FAMILY_ID;

    const [childrenResult, familiesRes, extendedFamilyRes, catalogRes] = await Promise.all([
      fetchChildrenFromSupabase(activeSharedFamilyId),
      withSupabaseTimeout(
        supabaseClient
          .from(SUPABASE_TABLES.FAMILIES)
          .select('*')
          .eq('id', activeSharedFamilyId)
          .limit(5)
      ),
      withSupabaseTimeout(
        supabaseClient.from(SUPABASE_TABLES.EXTENDED_FAMILY).select('*').limit(30)
      ),
      withSupabaseTimeout(
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

    // Map Users (Ahmed & Mariam) into ParentAccounts linked to `activeSharedFamilyId`
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
            fullName: cleanFatherName,
            phoneNumber: userEntity.phone || updatedParentAccounts.father.phoneNumber,
            email: userEntity.email || updatedParentAccounts.father.email,
          };
          updatedParentAccounts = { ...updatedParentAccounts, father: fatherProfile };
        } else if (isMother) {
          const cleanMotherName = rawName.includes('الأم') ? rawName : `${rawName} (الأم)`;
          const motherProfile: ParentAccountProfile = {
            ...updatedParentAccounts.mother,
            fullName: cleanMotherName,
            phoneNumber: userEntity.phone || updatedParentAccounts.mother.phoneNumber,
            email: userEntity.email || updatedParentAccounts.mother.email,
          };
          updatedParentAccounts = { ...updatedParentAccounts, mother: motherProfile };
        }
      });
    }

    // Map Children (Hamza, Laila, Youssef) dynamically from Supabase `children` table
    let updatedKids = currentState.kids;
    if (childrenResult.data.length > 0) {
      const mappedProfiles = childrenResult.data.map((child, idx) =>
        mapChildEntityToProfile(child, idx)
      );
      if (mappedProfiles.length >= 3) {
        updatedKids = mappedProfiles;
      } else {
        updatedKids = currentState.kids.map((existingKid, idx) => {
          const matched =
            mappedProfiles.find((m) => m.id === existingKid.id) || mappedProfiles[idx];
          return matched ? { ...existingKid, ...matched } : existingKid;
        });
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
        typeof primaryFamilyRow?.id === 'number'
          ? primaryFamilyRow.id
          : activeSharedFamilyId,
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
        primaryFamilyRow?.currency === 'EGP' ||
        primaryFamilyRow?.currency === 'USD'
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
        parentAccounts: updatedParentAccounts,
        kids: updatedKids,
        family: updatedExtendedFamily,
        city: familyEntity.city || currentState.city,
      }),
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
        sharedFamilyId: activeSharedFamilyId,
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
 * Syncs Family (Root), Users (Ahmed & Mariam with `family_id`), Children (Hamza, Laila, Youssef with `family_id`),
 * and Extended Family records in strict foreign-key order (`families` first, then `users` & `children`).
 */
export async function syncFamilySpaceToSupabase(state: FamilySpaceState): Promise<boolean> {
  if (!supabaseClient) return false;

  try {
    const familyPayload: Family = {
      id: SHARED_FAMILY_ID,
      family_name: 'أسرة أحمد ومريم — نكبر',
      country: state.country,
      city: state.city,
      currency: state.currency,
      active_parent: state.activeParentAccount,
      updated_at: new Date().toISOString(),
    };

    // 1. Upsert `families` FIRST so `users.family_id` foreign key constraint is strictly satisfied
    await withSupabaseTimeout(
      supabaseClient.from(SUPABASE_TABLES.FAMILIES).upsert(familyPayload)
    );

    const usersPayload: User[] = [
      {
        id: 'parent-ahmad',
        family_id: SHARED_FAMILY_ID,
        name: state.parentAccounts.father.fullName || 'أحمد (الأب)',
        full_name: state.parentAccounts.father.fullName || 'أحمد (الأب)',
        role: 'father',
        email: state.parentAccounts.father.email,
        phone: state.parentAccounts.father.phoneNumber,
        phone_number: state.parentAccounts.father.phoneNumber,
        country: state.parentAccounts.father.country,
        verified: state.parentAccounts.father.phoneVerified,
      },
      {
        id: 'parent-maryam',
        family_id: SHARED_FAMILY_ID,
        name: state.parentAccounts.mother.fullName || 'مريم (الأم)',
        full_name: state.parentAccounts.mother.fullName || 'مريم (الأم)',
        role: 'mother',
        email: state.parentAccounts.mother.email,
        phone: state.parentAccounts.mother.phoneNumber,
        phone_number: state.parentAccounts.mother.phoneNumber,
        country: state.parentAccounts.mother.country,
        verified: state.parentAccounts.mother.phoneVerified,
      },
    ];

    const childrenPayload: Child[] = state.kids.map((kid) => ({
      id: kid.id,
      family_id: SHARED_FAMILY_ID,
      name: kid.name,
      birth: kid.birth,
      gender: kid.gender,
      emoji: kid.emoji,
      avatar_theme: kid.avatarTheme || 'astronaut',
      interests: kid.interests || '',
      vaccinations_note: kid.vaccinationsNote || '',
      growth_height_cm: kid.growthHeightCm || null,
      growth_weight_kg: kid.growthWeightKg || null,
    }));

    const extendedFamilyPayload = state.family.map((member) => ({
      id: member.id,
      family_id: SHARED_FAMILY_ID,
      name: member.name,
      role: member.role,
      side: member.side,
      phone_number: member.phoneNumber || '',
      email: member.email || '',
    }));

    // 2. Upsert `users`, `children`, and `extended_family` referencing `SHARED_FAMILY_ID`
    await Promise.allSettled([
      withSupabaseTimeout(supabaseClient.from(SUPABASE_TABLES.USERS).upsert(usersPayload)),
      withSupabaseTimeout(
        supabaseClient.from(SUPABASE_TABLES.CHILDREN).upsert(childrenPayload)
      ),
      withSupabaseTimeout(
        supabaseClient.from(SUPABASE_TABLES.EXTENDED_FAMILY).upsert(extendedFamilyPayload)
      ),
    ]);

    return true;
  } catch {
    return false;
  }
}

export interface OnboardingAuthStepPayload {
  mode: 'signup' | 'signin';
  email: string;
  password: string;
  phone: string;
  parentName: string;
  role: 'mother' | 'father';
  country: CountryCode;
}

export interface OnboardingAuthStepResult {
  success: boolean;
  userId: string;
  familyId: number;
  sessionEmail: string;
  sharedChildren: Child[];
  syncedToDb: boolean;
  error: string | null;
}

/**
 * Step 1 of Onboarding Wizard:
 * 1. Ensures the shared `families(id = 1)` record exists in Supabase first (foreign key prerequisite).
 * 2. Authenticates Ahmed or Mariam via Supabase Auth.
 * 3. Upserts the parent into `users` with `family_id = 1` referencing `families(id)`.
 * 4. Fetches the shared family's children (Hamza, Laila, Youssef) so both parents see identical children data.
 */
export async function authenticateParentWithSupabase(
  payload: OnboardingAuthStepPayload
): Promise<OnboardingAuthStepResult> {
  const canonicalUserId = payload.role === 'father' ? 'parent-ahmad' : 'parent-maryam';
  const sharedFamilyId = SHARED_FAMILY_ID;

  if (!supabaseClient) {
    return {
      success: true,
      userId: canonicalUserId,
      familyId: sharedFamilyId,
      sessionEmail: payload.email.trim(),
      sharedChildren: DEFAULT_SUPABASE_CHILDREN,
      syncedToDb: false,
      error: null,
    };
  }

  let authUserId = canonicalUserId;
  let syncedToDb = false;

  try {
    // 1. Ensure `families(id = 1)` exists BEFORE inserting/updating `users` (strict FK integrity)
    await ensureSharedFamilyRecordInSupabase({
      familyId: sharedFamilyId,
      country: payload.country,
      activeParent: payload.role,
    });

    // 2. Authenticate via Supabase Auth with timeout protection
    if (payload.mode === 'signup') {
      const { data: signUpData, error: signUpErr } = await withSupabaseTimeout(
        supabaseClient.auth.signUp({
          email: payload.email.trim(),
          password: payload.password,
          options: {
            data: {
              full_name: payload.parentName.trim(),
              phone: payload.phone.trim(),
              role: payload.role,
              country: payload.country,
              family_id: sharedFamilyId,
            },
          },
        })
      );

      if (signUpData?.user?.id) {
        authUserId = signUpData.user.id;
      } else if (signUpErr && signUpErr.message.toLowerCase().includes('already registered')) {
        const { data: signInData } = await withSupabaseTimeout(
          supabaseClient.auth.signInWithPassword({
            email: payload.email.trim(),
            password: payload.password,
          })
        );
        if (signInData?.user?.id) {
          authUserId = signInData.user.id;
        }
      }
    } else {
      const { data: signInData } = await withSupabaseTimeout(
        supabaseClient.auth.signInWithPassword({
          email: payload.email.trim(),
          password: payload.password,
        })
      );
      if (signInData?.user?.id) {
        authUserId = signInData.user.id;
      }
    }

    // 3. Upsert parent row in `users` with strict `family_id` foreign key referencing `families(id)`
    const userRow: User = {
      id: canonicalUserId,
      family_id: sharedFamilyId,
      name: payload.parentName.trim(),
      full_name: payload.parentName.trim(),
      role: payload.role,
      email: payload.email.trim(),
      phone: payload.phone.trim(),
      phone_number: payload.phone.trim(),
      country: payload.country,
      verified: true,
    };

    const { error: upsertErr } = await withSupabaseTimeout(
      supabaseClient.from(SUPABASE_TABLES.USERS).upsert(userRow)
    );
    syncedToDb = !upsertErr;

    // 4. Query shared `children` linked to `sharedFamilyId` so Ahmed & Mariam see identical children
    const sharedChildrenRes = await fetchChildrenFromSupabase(sharedFamilyId);

    return {
      success: true,
      userId: authUserId,
      familyId: sharedFamilyId,
      sessionEmail: payload.email.trim(),
      sharedChildren: sharedChildrenRes.data,
      syncedToDb,
      error: null,
    };
  } catch (err) {
    return {
      success: true,
      userId: authUserId,
      familyId: sharedFamilyId,
      sessionEmail: payload.email.trim(),
      sharedChildren: DEFAULT_SUPABASE_CHILDREN,
      syncedToDb: false,
      error: err instanceof Error ? err.message : null,
    };
  }
}

/**
 * Step 2 of Onboarding Wizard:
 * Saves the selected Country, City/Region (e.g., Dammam, Riyadh, Cairo), and Currency
 * directly to the shared `families` record in Supabase.
 */
export async function saveOnboardingLocationToSupabase(params: {
  familyId: number;
  familyName: string;
  country: CountryCode;
  city: string;
  currency: CurrencyCode;
  activeParent: 'mother' | 'father';
}): Promise<{ synced: boolean; error: string | null }> {
  const res = await ensureSharedFamilyRecordInSupabase({
    familyId: params.familyId || SHARED_FAMILY_ID,
    familyName: params.familyName,
    country: params.country,
    city: params.city,
    currency: params.currency,
    activeParent: params.activeParent,
  });
  return { synced: res.synced, error: res.error };
}

/**
 * Step 3 of Onboarding Wizard:
 * Ensures the parent `families(id)` row exists first, then writes the children
 * (Hamza, Laila, Youssef) directly to the `children` table linked to `family_id`.
 */
export async function saveOnboardingChildrenToSupabase(params: {
  familyId: number;
  childrenList: Array<{
    id: number;
    name: string;
    birth: string;
    gender: 'boy' | 'girl';
    interests: string;
    avatarTheme: ChildProfile['avatarTheme'];
  }>;
}): Promise<{ synced: boolean; savedChildren: Child[]; error: string | null }> {
  const targetFamilyId = params.familyId || SHARED_FAMILY_ID;
  const mappedChildren: Child[] = params.childrenList.map((item, idx) => ({
    id: item.id || idx + 1,
    family_id: targetFamilyId,
    name: item.name.trim(),
    birth: item.birth,
    gender: item.gender,
    emoji: item.gender === 'girl' ? '👧🏻' : '👦🏻',
    avatar_theme: item.avatarTheme || 'astronaut',
    interests: item.interests.trim(),
  }));

  if (!supabaseClient) {
    return { synced: false, savedChildren: mappedChildren, error: null };
  }

  try {
    await ensureSharedFamilyRecordInSupabase({ familyId: targetFamilyId });
    const { error } = await withSupabaseTimeout(
      supabaseClient.from(SUPABASE_TABLES.CHILDREN).upsert(mappedChildren)
    );

    return {
      synced: !error,
      savedChildren: mappedChildren,
      error: error ? error.message : null,
    };
  } catch (err) {
    return {
      synced: false,
      savedChildren: mappedChildren,
      error: err instanceof Error ? err.message : 'Unable to save children to Supabase.',
    };
  }
}

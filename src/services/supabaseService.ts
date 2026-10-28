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
  normalizeAppData,
} from '../domain/familySpaceCore';

export const SUPABASE_PROJECT_URL = SUPABASE_URL;
export { SUPABASE_ANON_KEY };
export const supabaseClient: SupabaseClient | null = supabase;

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
 * Clean TypeScript interface for `users` table rows (Parents: Ahmed & Mariam)
 */
export interface User {
  id: string | number;
  name: string;
  full_name?: string;
  role: 'father' | 'mother' | 'الأب' | 'الأم' | string;
  phone?: string;
  phone_number?: string;
  email?: string;
  country?: CountryCode;
  verified?: boolean;
  family_id?: number | string;
  created_at?: string;
}

/**
 * Clean TypeScript interface for `families` table rows
 */
export interface Family {
  id: number | string;
  family_name: string;
  country: CountryCode;
  city: string;
  currency: CurrencyCode;
  active_parent?: 'mother' | 'father';
  updated_at?: string;
}

/**
 * Clean TypeScript interface for `children` table rows (Hamza, Laila, Youssef)
 */
export interface Child {
  id: number;
  name: string;
  birth: string;
  gender: 'boy' | 'girl' | 'male' | 'female';
  emoji?: string;
  avatar_theme?: ChildProfile['avatarTheme'];
  interests?: string;
  vaccinations_note?: string;
  growth_height_cm?: number | null;
  growth_weight_kg?: number | null;
  family_id?: number | string;
}

export interface SupabaseSyncSummary {
  connected: boolean;
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
 * Canonical fallback User entities for Ahmed and Mariam
 */
export const DEFAULT_SUPABASE_USERS: User[] = [
  {
    id: 'parent-ahmad',
    name: 'أحمد',
    full_name: 'أحمد (الأب)',
    role: 'father',
    phone: '1012345678',
    country: 'EG',
    verified: true,
    family_id: 1,
  },
  {
    id: 'parent-maryam',
    name: 'مريم',
    full_name: 'مريم (الأم)',
    role: 'mother',
    phone: '1098765432',
    country: 'EG',
    verified: true,
    family_id: 1,
  },
];

/**
 * Canonical fallback Child entities for Hamza (6m), Laila (4y), and Youssef (8y)
 */
export const DEFAULT_SUPABASE_CHILDREN: Child[] = DEFAULT_SEED.kids.map((kid) => ({
  id: kid.id,
  name: kid.name,
  birth: kid.birth,
  gender: kid.gender,
  emoji: kid.emoji,
  avatar_theme: kid.avatarTheme || 'astronaut',
  interests: kid.interests || '',
  vaccinations_note: kid.vaccinationsNote || '',
  growth_height_cm: kid.growthHeightCm ?? null,
  growth_weight_kg: kid.growthWeightKg ?? null,
  family_id: 1,
}));

/**
 * Queries the `users` table in Supabase and normalizes rows into clean `User` entities.
 */
export async function fetchUsersFromSupabase(): Promise<{
  data: User[];
  error: string | null;
}> {
  if (!supabaseClient) {
    return {
      data: DEFAULT_SUPABASE_USERS,
      error: 'Supabase client is not initialized.',
    };
  }

  try {
    const { data, error } = await supabaseClient
      .from(SUPABASE_TABLES.USERS)
      .select('*')
      .limit(20);

    if (error) {
      return { data: DEFAULT_SUPABASE_USERS, error: error.message };
    }

    if (!Array.isArray(data) || data.length === 0) {
      return { data: DEFAULT_SUPABASE_USERS, error: null };
    }

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

      return {
        id:
          typeof row.id === 'string' || typeof row.id === 'number'
            ? row.id
            : isMother
            ? 'parent-maryam'
            : 'parent-ahmad',
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
        family_id:
          typeof row.family_id === 'number' || typeof row.family_id === 'string'
            ? row.family_id
            : 1,
      };
    });

    return { data: mappedUsers, error: null };
  } catch (err) {
    return {
      data: DEFAULT_SUPABASE_USERS,
      error: err instanceof Error ? err.message : 'Network error while fetching users.',
    };
  }
}

/**
 * Queries the `children` table in Supabase and normalizes rows into clean `Child` entities
 * for Hamza (6m), Laila (4y), and Youssef (8y).
 */
export async function fetchChildrenFromSupabase(): Promise<{
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
    const { data, error } = await supabaseClient
      .from(SUPABASE_TABLES.CHILDREN)
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      return { data: DEFAULT_SUPABASE_CHILDREN, error: error.message };
    }

    if (!Array.isArray(data) || data.length === 0) {
      return { data: DEFAULT_SUPABASE_CHILDREN, error: null };
    }

    const mappedChildren: Child[] = data.map((row: Record<string, unknown>, idx: number) => {
      const defaultKid = DEFAULT_SUPABASE_CHILDREN[idx] || DEFAULT_SUPABASE_CHILDREN[0];
      const rawName =
        (typeof row.name === 'string' && row.name.trim()) ||
        (typeof row.full_name === 'string' && row.full_name.trim()) ||
        (typeof row.first_name === 'string' && row.first_name.trim()) ||
        defaultKid.name;

      // Normalize English or Arabic child names from Supabase so both display and matching work seamlessly
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
        family_id:
          typeof row.family_id === 'number' || typeof row.family_id === 'string'
            ? row.family_id
            : 1,
      };
    });

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
 * Fetches Users (Ahmed, Mariam), Families, Children (Hamza, Laila, Youssef),
 * Extended Family, and Catalog items dynamically from Supabase and merges them
 * with the application state while handling loading/error fallback states.
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
    const [usersResult, childrenResult, familiesRes, extendedFamilyRes, catalogRes] =
      await Promise.all([
        fetchUsersFromSupabase(),
        fetchChildrenFromSupabase(),
        supabaseClient.from(SUPABASE_TABLES.FAMILIES).select('*').limit(10),
        supabaseClient.from(SUPABASE_TABLES.EXTENDED_FAMILY).select('*').limit(30),
        supabaseClient.from(SUPABASE_TABLES.CATALOG_ITEMS).select('*').limit(50),
      ]);

    const queryErrors = [
      usersResult.error,
      childrenResult.error,
      familiesRes.error?.message,
    ].filter(Boolean) as string[];

    const familiesRows = Array.isArray(familiesRes.data) ? familiesRes.data : [];
    const extendedRows = Array.isArray(extendedFamilyRes.data) ? extendedFamilyRes.data : [];
    const catalogRows = Array.isArray(catalogRes.data) ? catalogRes.data : [];

    // Map Users (Ahmed & Mariam) into ParentAccounts
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
          };
          updatedParentAccounts = { ...updatedParentAccounts, father: fatherProfile };
        } else if (isMother) {
          const cleanMotherName = rawName.includes('الأم') ? rawName : `${rawName} (الأم)`;
          const motherProfile: ParentAccountProfile = {
            ...updatedParentAccounts.mother,
            fullName: cleanMotherName,
            phoneNumber: userEntity.phone || updatedParentAccounts.mother.phoneNumber,
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
        // Merge live database rows by matching ID or name while keeping all 3 siblings
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
        typeof primaryFamilyRow?.id === 'number' || typeof primaryFamilyRow?.id === 'string'
          ? primaryFamilyRow.id
          : 1,
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
      // Preserve live child & parent names fetched from Supabase
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

    const hasNetworkFailure =
      queryErrors.length >= 3 &&
      queryErrors.some(
        (msg) =>
          msg.toLowerCase().includes('fetch') ||
          msg.toLowerCase().includes('network') ||
          msg.toLowerCase().includes('failed')
      );

    return {
      nextState,
      users: usersResult.data,
      family: familyEntity,
      children: childrenResult.data,
      catalogItems: mappedCatalog,
      summary: {
        connected: !hasNetworkFailure,
        usersCount: usersResult.data.length,
        familiesCount: familiesRows.length || 1,
        childrenCount: updatedKids.length,
        extendedFamilyCount: updatedExtendedFamily.length,
        catalogCount: mappedCatalog.length,
        syncedAt: new Date().toISOString(),
        errorMessage: hasNetworkFailure ? queryErrors[0] : null,
      },
      error: hasNetworkFailure ? queryErrors[0] : null,
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
 * Syncs Users (Ahmed & Mariam), Family Space, Children (Hamza, Laila, Youssef),
 * and Extended Family records to Supabase tables when changes occur.
 */
export async function syncFamilySpaceToSupabase(state: FamilySpaceState): Promise<boolean> {
  if (!supabaseClient) return false;

  try {
    const familyPayload: Family = {
      id: 1,
      family_name: 'أسرة أحمد ومريم — نكبر',
      country: state.country,
      city: state.city,
      currency: state.currency,
      active_parent: state.activeParentAccount,
      updated_at: new Date().toISOString(),
    };

    const usersPayload: User[] = [
      {
        id: 'parent-ahmad',
        name: state.parentAccounts.father.fullName || 'أحمد (الأب)',
        role: 'father',
        phone: state.parentAccounts.father.phoneNumber,
        verified: state.parentAccounts.father.phoneVerified,
      },
      {
        id: 'parent-maryam',
        name: state.parentAccounts.mother.fullName || 'مريم (الأم)',
        role: 'mother',
        phone: state.parentAccounts.mother.phoneNumber,
        verified: state.parentAccounts.mother.phoneVerified,
      },
    ];

    const childrenPayload: Child[] = state.kids.map((kid) => ({
      id: kid.id,
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
      name: member.name,
      role: member.role,
      side: member.side,
      phone_number: member.phoneNumber || '',
      email: member.email || '',
    }));

    await Promise.allSettled([
      supabaseClient.from(SUPABASE_TABLES.FAMILIES).upsert(familyPayload),
      supabaseClient.from(SUPABASE_TABLES.USERS).upsert(usersPayload),
      supabaseClient.from(SUPABASE_TABLES.CHILDREN).upsert(childrenPayload),
      supabaseClient.from(SUPABASE_TABLES.EXTENDED_FAMILY).upsert(extendedFamilyPayload),
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
  syncedToDb: boolean;
  error: string | null;
}

/**
 * Step 1 of Onboarding Wizard:
 * Authenticates the parent via Supabase Auth (Sign-Up or Sign-In with Email, Password, Phone)
 * and progressively saves the parent profile into the `users` table.
 */
export async function authenticateParentWithSupabase(
  payload: OnboardingAuthStepPayload
): Promise<OnboardingAuthStepResult> {
  const defaultUserId = payload.role === 'father' ? 'parent-ahmad' : 'parent-maryam';
  const defaultFamilyId = 1;

  if (!supabaseClient) {
    return {
      success: true,
      userId: defaultUserId,
      familyId: defaultFamilyId,
      sessionEmail: payload.email.trim(),
      syncedToDb: false,
      error: null,
    };
  }

  let authUserId = defaultUserId;
  let syncedToDb = false;

  try {
    if (payload.mode === 'signup') {
      const { data: signUpData, error: signUpErr } = await supabaseClient.auth.signUp({
        email: payload.email.trim(),
        password: payload.password,
        options: {
          data: {
            full_name: payload.parentName.trim(),
            phone: payload.phone.trim(),
            role: payload.role,
            country: payload.country,
          },
        },
      });

      if (signUpData?.user?.id) {
        authUserId = signUpData.user.id;
      } else if (signUpErr && signUpErr.message.toLowerCase().includes('already registered')) {
        const { data: signInData } = await supabaseClient.auth.signInWithPassword({
          email: payload.email.trim(),
          password: payload.password,
        });
        if (signInData?.user?.id) {
          authUserId = signInData.user.id;
        }
      }
    } else {
      const { data: signInData } = await supabaseClient.auth.signInWithPassword({
        email: payload.email.trim(),
        password: payload.password,
      });
      if (signInData?.user?.id) {
        authUserId = signInData.user.id;
      }
    }

    const userRow: User = {
      id: defaultUserId,
      name: payload.parentName.trim(),
      full_name: payload.parentName.trim(),
      role: payload.role,
      email: payload.email.trim(),
      phone: payload.phone.trim(),
      phone_number: payload.phone.trim(),
      country: payload.country,
      verified: true,
      family_id: defaultFamilyId,
    };

    const { error: upsertErr } = await supabaseClient
      .from(SUPABASE_TABLES.USERS)
      .upsert(userRow);

    syncedToDb = !upsertErr;

    return {
      success: true,
      userId: authUserId,
      familyId: defaultFamilyId,
      sessionEmail: payload.email.trim(),
      syncedToDb,
      error: null,
    };
  } catch (err) {
    return {
      success: true,
      userId: authUserId,
      familyId: defaultFamilyId,
      sessionEmail: payload.email.trim(),
      syncedToDb: false,
      error: err instanceof Error ? err.message : null,
    };
  }
}

/**
 * Step 2 of Onboarding Wizard:
 * Saves the selected Country, City/Region (e.g., Dammam, Riyadh, Cairo), and Currency
 * directly to the `families` table in Supabase.
 */
export async function saveOnboardingLocationToSupabase(params: {
  familyId: number;
  familyName: string;
  country: CountryCode;
  city: string;
  currency: CurrencyCode;
  activeParent: 'mother' | 'father';
}): Promise<{ synced: boolean; error: string | null }> {
  if (!supabaseClient) {
    return { synced: false, error: null };
  }

  try {
    const familyRecord: Family = {
      id: params.familyId || 1,
      family_name: params.familyName.trim() || 'أسرة أحمد ومريم — نكبر',
      country: params.country,
      city: params.city,
      currency: params.currency,
      active_parent: params.activeParent,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabaseClient
      .from(SUPABASE_TABLES.FAMILIES)
      .upsert(familyRecord);

    return { synced: !error, error: error ? error.message : null };
  } catch (err) {
    return {
      synced: false,
      error: err instanceof Error ? err.message : 'Unable to save location to Supabase.',
    };
  }
}

/**
 * Step 3 of Onboarding Wizard:
 * Writes the dynamic list of children (e.g., Hamza, Laila, Youssef) directly
 * to the `children` table in Supabase linked to `family_id`.
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
  const mappedChildren: Child[] = params.childrenList.map((item, idx) => ({
    id: item.id || idx + 1,
    name: item.name.trim(),
    birth: item.birth,
    gender: item.gender,
    emoji: item.gender === 'girl' ? '👧🏻' : '👦🏻',
    avatar_theme: item.avatarTheme || 'astronaut',
    interests: item.interests.trim(),
    family_id: params.familyId || 1,
  }));

  if (!supabaseClient) {
    return { synced: false, savedChildren: mappedChildren, error: null };
  }

  try {
    const { error } = await supabaseClient
      .from(SUPABASE_TABLES.CHILDREN)
      .upsert(mappedChildren);

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


import { CountryCode, DEFAULT_SEED, ParentThemeRole } from '../domain/familySpaceCore';
import { AvatarAccessoryTheme } from '../domain/assetManifest3D';
import {
  Child,
  SHARED_FAMILY_ID,
  isValidUuid,
  resolveVerifiedFamilyContext,
  restoreAuthenticatedAccountFromSupabase,
  supabaseClient,
  withSupabaseTimeout,
} from './supabaseService';

/**
 * Full lifecycle steps for the progressive 5-step Nekbaar onboarding state machine.
 */
export type OnboardingStep =
  | 'CHECKING'
  | 'WELCOME_PROFILE'
  | 'LOCATION'
  | 'CREDENTIALS'
  | 'VERIFY_METHOD'
  | 'CHILDREN'
  | 'CO_PARENT'
  | 'DASHBOARD';

export type VerificationChannel = 'sms' | 'email';

export interface OnboardingChildDraftItem {
  id: number;
  remoteId?: string | number;
  name: string;
  gender: 'boy' | 'girl';
  ageStagePreset: 'infant_6m' | 'nursery_4y' | 'school_8y' | 'custom';
  birth: string;
  interests: string;
  avatarTheme: AvatarAccessoryTheme;
}

export interface UserSessionProfile {
  userId?: string;
  familyId: string | number;
  verifiedFamilyId?: string | null;
  isDbVerified?: boolean;
  fullName?: string;
  parentName?: string;
  role?: ParentThemeRole;
  parentRole?: ParentThemeRole;
  sessionToken?: string;
  authenticatedAt?: string;
  onboardingCompleted?: boolean;
  isOtpVerified?: boolean;
  email: string;
  phone: string;
  city: string;
  country: CountryCode;
  childrenCount: number;
  isCoParentLinked: boolean;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  authProvider?: 'email' | 'google' | 'apple' | 'facebook' | 'outlook';
  verificationChannel?: VerificationChannel;
  coParentName?: string;
  coParentEmail?: string;
  coParentPhone?: string;
  syncedToDb?: boolean;
  updatedAt?: string;
}

export interface OnboardingDraftData {
  currentStep: OnboardingStep;
  stepNumber: 1 | 2 | 3 | 4 | 5;
  authMode: 'signup' | 'signin';
  parentRole: ParentThemeRole;
  parentName: string;
  email: string;
  phone: string;
  familyId: number;
  selectedCountry: CountryCode;
  selectedCity: string;
  verificationChannel: VerificationChannel;
  otpCode: string;
  isOtpVerified: boolean;
  childrenList: OnboardingChildDraftItem[];
  coParentName: string;
  coParentEmail: string;
  coParentPhone: string;
  isCoParentLinked: boolean;
  updatedAt: string;
}

export const INITIAL_CANONICAL_ONBOARDING_CHILDREN: OnboardingChildDraftItem[] = [
  {
    id: 1,
    name: DEFAULT_SEED.kids[0]?.name || 'حمزة',
    gender: 'boy',
    ageStagePreset: 'infant_6m',
    birth: DEFAULT_SEED.kids[0]?.birth || '2026-04-20',
    interests:
      DEFAULT_SEED.kids[0]?.interests ||
      'وقت البطن الحسي، تتبع الخشخيشة الخشبية، والمناغاة التفاعلية',
    avatarTheme: 'astronaut',
  },
  {
    id: 2,
    name: DEFAULT_SEED.kids[1]?.name || 'ليلى',
    gender: 'girl',
    ageStagePreset: 'nursery_4y',
    birth: DEFAULT_SEED.kids[1]?.birth || '2022-05-14',
    interests:
      DEFAULT_SEED.kids[1]?.interests ||
      'التلوين المائي والصلصال، أناشيد الحضانة، وتسمية المشاعر',
    avatarTheme: 'artist',
  },
  {
    id: 3,
    name: DEFAULT_SEED.kids[2]?.name || 'يوسف',
    gender: 'boy',
    ageStagePreset: 'school_8y',
    birth: DEFAULT_SEED.kids[2]?.birth || '2018-09-10',
    interests:
      DEFAULT_SEED.kids[2]?.interests ||
      'السباحة وكرة القدم، تجارب العلوم المدرسية، وألغاز الذكاء',
    avatarTheme: 'astronaut',
  },
];

export class OnboardingFlowController {
  public static readonly STORAGE_KEY = 'nekbaar_user_persistence_v2';
  public static readonly DRAFT_KEY = 'nekbaar_onboarding_draft_v2';

  /**
   * Defensively normalizes any children draft array from localStorage or state
   * so no missing/undefined property can ever trigger an Error Boundary crash on Step 4.
   */
  public static sanitizeChildrenList(
    rawList: unknown,
    allowEmpty: boolean = false
  ): OnboardingChildDraftItem[] {
    if (!Array.isArray(rawList)) {
      return allowEmpty ? [] : INITIAL_CANONICAL_ONBOARDING_CHILDREN;
    }
    if (rawList.length === 0) {
      return allowEmpty ? [] : INITIAL_CANONICAL_ONBOARDING_CHILDREN;
    }

    const sanitized = rawList
      .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'))
      .map((item, idx): OnboardingChildDraftItem => {
        const rawName =
          typeof item.name === 'string' && item.name.trim()
            ? item.name.trim()
            : `طفل ${idx + 1}`;
        const canonicalMatch = INITIAL_CANONICAL_ONBOARDING_CHILDREN.find(
          (c) => c.name === rawName
        );
        const rawGender: 'boy' | 'girl' =
          item.gender === 'girl' || item.gender === 'female' ? 'girl' : 'boy';
        const rawBirth =
          typeof item.birth === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(item.birth.trim())
            ? item.birth.trim()
            : canonicalMatch?.birth || '2022-05-14';
        const rawPreset: OnboardingChildDraftItem['ageStagePreset'] =
          item.ageStagePreset === 'infant_6m' ||
          item.ageStagePreset === 'nursery_4y' ||
          item.ageStagePreset === 'school_8y' ||
          item.ageStagePreset === 'custom'
            ? item.ageStagePreset
            : canonicalMatch?.ageStagePreset || 'custom';
        const rawTheme: AvatarAccessoryTheme =
          item.avatarTheme === 'astronaut' ||
          item.avatarTheme === 'artist' ||
          item.avatarTheme === 'scientist' ||
          item.avatarTheme === 'athlete' ||
          item.avatarTheme === 'reader' ||
          item.avatarTheme === 'nature'
            ? item.avatarTheme
            : canonicalMatch?.avatarTheme || (rawGender === 'girl' ? 'artist' : 'astronaut');

        return {
          id:
            typeof item.id === 'number' && Number.isFinite(item.id) && item.id > 0
              ? item.id
              : idx + 1,
          remoteId:
            typeof item.remoteId === 'string' || typeof item.remoteId === 'number'
              ? item.remoteId
              : undefined,
          name: rawName,
          gender: rawGender,
          ageStagePreset: rawPreset,
          birth: rawBirth,
          interests:
            typeof item.interests === 'string' && item.interests.trim()
              ? item.interests.trim()
              : canonicalMatch?.interests ||
                (rawGender === 'girl' ? 'الرسم والقصص' : 'السباحة والتركيب'),
          avatarTheme: rawTheme,
        };
      });

    if (sanitized.length > 0) return sanitized;
    return allowEmpty ? [] : INITIAL_CANONICAL_ONBOARDING_CHILDREN;
  }

  /**
   * Maps an OnboardingStep to its sequential 1..5 wizard step number.
   */
  public static stepToNumber(step: OnboardingStep): 1 | 2 | 3 | 4 | 5 {
    switch (step) {
      case 'LOCATION':
        return 1;
      case 'CREDENTIALS':
        return 2;
      case 'VERIFY_METHOD':
        return 3;
      case 'CHILDREN':
        return 4;
      case 'CO_PARENT':
      case 'DASHBOARD':
        return 5;
      default:
        return 1;
    }
  }

  /**
   * Maps a 1..5 wizard step number to its canonical OnboardingStep identifier.
   */
  public static numberToStep(stepNum: 1 | 2 | 3 | 4 | 5): OnboardingStep {
    switch (stepNum) {
      case 1:
        return 'LOCATION';
      case 2:
        return 'CREDENTIALS';
      case 3:
        return 'VERIFY_METHOD';
      case 4:
        return 'CHILDREN';
      case 5:
        return 'CO_PARENT';
    }
  }

  /**
   * Step 0: Smart Startup & Mandatory Auth Gateway Detection
   * Checks if a valid active session (`auth.uid` or local persistence) exists.
   * - If an active Supabase session exists: restores exact DB user profile, family, and children,
   *   and derives `emailVerified`/`phoneVerified` strictly from Supabase Auth confirmation timestamps.
   * - If not found: returns `{ step: 'WELCOME_PROFILE', draft }` so unauthenticated visitors see the Auth Gateway first.
   */
  public static async detectInitialState(): Promise<{
    step: OnboardingStep;
    profile?: UserSessionProfile;
    restoredChildren?: Child[];
    draft?: OnboardingDraftData;
  }> {
    try {
      // 1. Check live Supabase Auth session and verified DB family ownership first
      if (supabaseClient) {
        try {
          const { data: sessionRes } = await withSupabaseTimeout(
            supabaseClient.auth.getSession(),
            2500
          );
          const sessionUser = sessionRes?.session?.user;
          if (sessionUser && isValidUuid(sessionUser.id)) {
            const restored = await restoreAuthenticatedAccountFromSupabase(supabaseClient);
            const verifiedCtx = restored.authenticated
              ? {
                  authenticated: restored.authenticated,
                  verifiedFamilyId: restored.verifiedFamilyId,
                  emailVerified: restored.emailVerified,
                  phoneVerified: restored.phoneVerified,
                }
              : await resolveVerifiedFamilyContext(supabaseClient);

            const verifiedFamilyUuid =
              verifiedCtx.authenticated && isValidUuid(verifiedCtx.verifiedFamilyId)
                ? verifiedCtx.verifiedFamilyId
                : null;
            const meta = (sessionUser.user_metadata || {}) as Record<string, unknown>;
            const rawRole =
              restored.userProfile?.role ||
              (typeof meta.role === 'string' ? meta.role.toLowerCase() : '');
            const isDad =
              rawRole === 'father' ||
              rawRole === 'dad' ||
              (sessionUser.email || '').toLowerCase().includes('ahmad');

            // Never trust user_metadata.family_id as verified family ownership,
            // and never mark emailVerified/phoneVerified true unless confirmed by Supabase Auth!
            const resolvedProfile: UserSessionProfile = {
              userId: sessionUser.id,
              familyId: verifiedFamilyUuid || String(SHARED_FAMILY_ID),
              verifiedFamilyId: verifiedFamilyUuid,
              isDbVerified: Boolean(verifiedFamilyUuid && restored.restored),
              syncedToDb: Boolean(verifiedFamilyUuid && restored.restored),
              fullName:
                restored.userProfile?.full_name ||
                (typeof meta.full_name === 'string' && meta.full_name.trim()) ||
                (isDad ? 'أحمد (الأب)' : 'مريم (الأم)'),
              role: isDad ? 'dad' : 'mom',
              email:
                restored.userProfile?.email ||
                sessionUser.email ||
                (isDad ? 'ahmad.dad@nekbaar.app' : 'maryam.mom@nekbaar.app'),
              phone:
                restored.userProfile?.phone ||
                (typeof meta.phone === 'string' && meta.phone.trim()) ||
                sessionUser.phone ||
                '551234567',
              city:
                restored.family?.city ||
                (typeof meta.city === 'string' && meta.city.trim()) ||
                'الدمام',
              country:
                restored.family?.country === 'EG' || meta.country === 'EG' ? 'EG' : 'SA',
              childrenCount:
                restored.restored && restored.children.length > 0
                  ? restored.children.length
                  : 0,
              isCoParentLinked: false,
              isOtpVerified: verifiedCtx.emailVerified || verifiedCtx.phoneVerified,
              emailVerified: verifiedCtx.emailVerified,
              phoneVerified: verifiedCtx.phoneVerified,
              onboardingCompleted: Boolean(verifiedFamilyUuid && restored.restored),
              updatedAt: new Date().toISOString(),
            };
            this.persistUserSession(resolvedProfile, false);
            return {
              step: 'DASHBOARD',
              profile: resolvedProfile,
              restoredChildren: restored.restored ? restored.children : undefined,
            };
          }
        } catch {
          // Proceed gracefully to local UI state check if offline
        }
      }

      // A cached profile is not an authenticated session. Require a live Supabase Auth
      // session before exposing any family workspace; preserve the draft for retry.

      const draft = this.loadDraft();
      return { step: 'WELCOME_PROFILE', draft: draft || undefined };
    } catch (error) {
      console.error('Error detecting initial state:', error);
      return { step: 'WELCOME_PROFILE' };
    }
  }

  /**
   * Synchronous helper for reading the persisted user session profile if available.
   */
  public static getSavedProfile(): UserSessionProfile | null {
    try {
      const raw = window.localStorage.getItem(this.STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as UserSessionProfile;
      if (parsed && parsed.userId && parsed.fullName) {
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Loads the cached progressive onboarding draft so accidental browser refreshes (F5)
   * restore the exact step and all typed fields immediately.
   */
  public static loadDraft(): OnboardingDraftData | null {
    try {
      const raw = window.localStorage.getItem(this.DRAFT_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as Partial<OnboardingDraftData>;
      if (!parsed || typeof parsed !== 'object') return null;

      const stepNumber: 1 | 2 | 3 | 4 | 5 =
        parsed.stepNumber === 1 ||
        parsed.stepNumber === 2 ||
        parsed.stepNumber === 3 ||
        parsed.stepNumber === 4 ||
        parsed.stepNumber === 5
          ? parsed.stepNumber
          : this.stepToNumber(parsed.currentStep || 'LOCATION');

      const currentStep = this.numberToStep(stepNumber);

      return {
        currentStep,
        stepNumber,
        authMode: parsed.authMode === 'signin' ? 'signin' : 'signup',
        parentRole: parsed.parentRole === 'dad' ? 'dad' : 'mom',
        parentName:
          typeof parsed.parentName === 'string' && parsed.parentName.trim()
            ? parsed.parentName
            : 'مريم (الأم)',
        email:
          typeof parsed.email === 'string' && parsed.email.trim()
            ? parsed.email
            : 'maryam.mom@nekbaar.app',
        phone:
          typeof parsed.phone === 'string' && parsed.phone.trim()
            ? parsed.phone
            : '551234567',
        familyId:
          typeof parsed.familyId === 'number' && Number.isFinite(parsed.familyId)
            ? parsed.familyId
            : SHARED_FAMILY_ID,
        selectedCountry: parsed.selectedCountry === 'EG' ? 'EG' : 'SA',
        selectedCity:
          typeof parsed.selectedCity === 'string' && parsed.selectedCity.trim()
            ? parsed.selectedCity
            : 'الدمام',
        verificationChannel:
          parsed.verificationChannel === 'email' ? 'email' : 'sms',
        otpCode: typeof parsed.otpCode === 'string' ? parsed.otpCode : '1234',
        isOtpVerified: Boolean(parsed.isOtpVerified),
        childrenList: this.sanitizeChildrenList(parsed.childrenList, true),
        coParentName:
          typeof parsed.coParentName === 'string'
            ? parsed.coParentName
            : 'أحمد (الأب)',
        coParentEmail:
          typeof parsed.coParentEmail === 'string'
            ? parsed.coParentEmail
            : 'ahmad.dad@nekbaar.app',
        coParentPhone:
          typeof parsed.coParentPhone === 'string'
            ? parsed.coParentPhone
            : '559876543',
        isCoParentLinked: Boolean(parsed.isCoParentLinked),
        updatedAt:
          typeof parsed.updatedAt === 'string'
            ? parsed.updatedAt
            : new Date().toISOString(),
      };
    } catch {
      return null;
    }
  }

  /**
   * Saves the current onboarding step and form fields to `localStorage` (`nekbaar_onboarding_draft_v2`)
   * so no data is ever lost on refresh.
   */
  public static saveDraft(
    step: OnboardingStep,
    data: Partial<OnboardingDraftData>
  ): void {
    try {
      const existingDraft = this.loadDraft();
      const stepNumber = data.stepNumber || this.stepToNumber(step);
      const updated: OnboardingDraftData = {
        currentStep: step,
        stepNumber,
        authMode: data.authMode ?? existingDraft?.authMode ?? 'signup',
        parentRole: data.parentRole ?? existingDraft?.parentRole ?? 'mom',
        parentName: data.parentName ?? existingDraft?.parentName ?? 'مريم (الأم)',
        email: data.email ?? existingDraft?.email ?? 'maryam.mom@nekbaar.app',
        phone: data.phone ?? existingDraft?.phone ?? '551234567',
        familyId: data.familyId ?? existingDraft?.familyId ?? SHARED_FAMILY_ID,
        selectedCountry:
          data.selectedCountry ?? existingDraft?.selectedCountry ?? 'SA',
        selectedCity: data.selectedCity ?? existingDraft?.selectedCity ?? 'الدمام',
        verificationChannel:
          data.verificationChannel ?? existingDraft?.verificationChannel ?? 'sms',
        otpCode: data.otpCode ?? existingDraft?.otpCode ?? '1234',
        isOtpVerified: data.isOtpVerified ?? existingDraft?.isOtpVerified ?? false,
        childrenList:
          data.childrenList ??
          existingDraft?.childrenList ??
          [],
        coParentName:
          data.coParentName ?? existingDraft?.coParentName ?? 'أحمد (الأب)',
        coParentEmail:
          data.coParentEmail ??
          existingDraft?.coParentEmail ??
          'ahmad.dad@nekbaar.app',
        coParentPhone:
          data.coParentPhone ?? existingDraft?.coParentPhone ?? '559876543',
        isCoParentLinked:
          data.isCoParentLinked ?? existingDraft?.isCoParentLinked ?? false,
        updatedAt: new Date().toISOString(),
      };
      window.localStorage.setItem(this.DRAFT_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save onboarding draft:', e);
    }
  }

  /**
   * Permanently persists the authenticated family session once Email OTP + Phone Linking
   * (or Step 4 Children Setup) is completed, ensuring future app launches bypass the gateway
   * and load `/dashboard` immediately.
   */
  public static persistUserSession(
    profile: UserSessionProfile,
    clearDraftAfterComplete: boolean = false
  ): void {
    try {
      const resolvedName =
        profile.fullName ||
        profile.parentName ||
        (profile.role === 'dad' || profile.parentRole === 'dad' ? 'أحمد' : 'مريم');
      const resolvedUserId =
        profile.userId ||
        profile.sessionToken ||
        `usr_${profile.familyId || SHARED_FAMILY_ID}_${Date.now()}`;
      const payload: UserSessionProfile = {
        ...profile,
        userId: resolvedUserId,
        fullName: resolvedName,
        parentName: resolvedName,
        role: profile.role || profile.parentRole || 'mom',
        familyId: String(profile.familyId || SHARED_FAMILY_ID),
        updatedAt: new Date().toISOString(),
      };
      window.localStorage.setItem(this.STORAGE_KEY, JSON.stringify(payload));
      if (clearDraftAfterComplete) {
        window.localStorage.removeItem(this.DRAFT_KEY);
      }
    } catch (e) {
      console.error('Failed to persist user session:', e);
    }
  }

  /**
   * Alias for persistUserSession used by OnboardingFlowModal upon finalizing onboarding.
   */
  public static saveAuthenticatedSession(
    profile: UserSessionProfile,
    clearDraftAfterComplete: boolean = true
  ): void {
    this.persistUserSession(profile, clearDraftAfterComplete);
  }

  /**
   * Clears both the permanent user session and any temporary onboarding draft (Sign Out / Reset).
   */
  public static clearSession(): void {
    try {
      window.localStorage.removeItem(this.STORAGE_KEY);
      window.localStorage.removeItem(this.DRAFT_KEY);
      window.localStorage.removeItem('nekbaar_temp_user');
      if (supabaseClient) {
        void supabaseClient.auth.signOut().catch(() => null);
      }
    } catch (e) {
      console.error('Failed to clear session:', e);
    }
  }

  /**
   * Subscribes to real-time Supabase Auth state transitions (`SIGNED_IN`, `TOKEN_REFRESHED`, `SIGNED_OUT`)
   * so the frontend session state stays synchronized with genuine Supabase Auth state.
   */
  public static subscribeToAuthSessionChanges(
    onSessionChange: (payload: {
      event: string;
      authenticated: boolean;
      userId: string | null;
      emailVerified: boolean;
      phoneVerified: boolean;
    }) => void
  ): () => void {
    if (!supabaseClient?.auth?.onAuthStateChange) {
      return () => {};
    }
    const { data } = supabaseClient.auth.onAuthStateChange((event, session) => {
      const user = session?.user;
      const validUser = Boolean(user && isValidUuid(user.id));
      const emailConfirmed = Boolean(
        validUser &&
          ((typeof user?.email_confirmed_at === 'string' && user.email_confirmed_at.length > 0) ||
            (typeof user?.confirmed_at === 'string' && user.confirmed_at.length > 0))
      );
      const phoneConfirmed = Boolean(
        validUser &&
          typeof user?.phone_confirmed_at === 'string' &&
          user.phone_confirmed_at.length > 0
      );
      onSessionChange({
        event,
        authenticated: validUser,
        userId: validUser && user ? user.id : null,
        emailVerified: emailConfirmed,
        phoneVerified: phoneConfirmed,
      });
    });
    return () => {
      data?.subscription?.unsubscribe();
    };
  }
}


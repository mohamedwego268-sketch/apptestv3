import React, { useEffect, useState } from 'react';
import {
  CountryCode,
  CurrencyCode,
  LanguageCode,
  ParentThemeRole,
  calculateChildAge,
  getSuggestedCurrencyForCountry,
  validateChildInput,
} from '../domain/familySpaceCore';
import { AvatarAccessoryTheme } from '../domain/assetManifest3D';
import {
  SHARED_FAMILY_ID,
  authenticateParentWithSupabase,
  saveOnboardingChildrenToSupabase,
  saveOnboardingLocationToSupabase,
} from '../services/supabaseService';
import {
  INITIAL_CANONICAL_ONBOARDING_CHILDREN,
  OnboardingChildDraftItem,
  OnboardingDraftData,
  OnboardingFlowController,
  UserSessionProfile,
  VerificationChannel,
} from '../services/OnboardingFlowController';
import { ThreeDChildAvatar } from './ThreeDVisuals';

export const NEKBAAR_ONBOARDING_CACHE_KEY = OnboardingFlowController.DRAFT_KEY;

export type OnboardingChildDraft = OnboardingChildDraftItem;
export type OnboardingCachedState = OnboardingDraftData;

export type AllowedGCCOrEgyptCountry = 'EG' | 'SA' | 'AE' | 'KW' | 'QA' | 'BH' | 'OM';

export interface AllowedCountryOption {
  code: AllowedGCCOrEgyptCountry;
  mappedCoreCountry: CountryCode;
  dialCode: string;
  defaultCityAr: string;
  defaultCityEn: string;
  nameAr: string;
  nameEn: string;
  phonePlaceholder: string;
}

/**
 * Strictly restricted to Egypt and GCC countries only:
 * (مصر, السعودية, الإمارات, الكويت, قطر, البحرين, عمان)
 */
export const EGYPT_AND_GCC_COUNTRIES: AllowedCountryOption[] = [
  {
    code: 'EG',
    mappedCoreCountry: 'EG',
    dialCode: '+20',
    defaultCityAr: 'القاهرة',
    defaultCityEn: 'Cairo',
    nameAr: 'مصر',
    nameEn: 'Egypt',
    phonePlaceholder: '1012345678',
  },
  {
    code: 'SA',
    mappedCoreCountry: 'SA',
    dialCode: '+966',
    defaultCityAr: 'الرياض',
    defaultCityEn: 'Riyadh',
    nameAr: 'السعودية',
    nameEn: 'Saudi Arabia',
    phonePlaceholder: '551234567',
  },
  {
    code: 'AE',
    mappedCoreCountry: 'SA',
    dialCode: '+971',
    defaultCityAr: 'دبي',
    defaultCityEn: 'Dubai',
    nameAr: 'الإمارات',
    nameEn: 'United Arab Emirates',
    phonePlaceholder: '501234567',
  },
  {
    code: 'KW',
    mappedCoreCountry: 'SA',
    dialCode: '+965',
    defaultCityAr: 'مدينة الكويت',
    defaultCityEn: 'Kuwait City',
    nameAr: 'الكويت',
    nameEn: 'Kuwait',
    phonePlaceholder: '50123456',
  },
  {
    code: 'QA',
    mappedCoreCountry: 'SA',
    dialCode: '+974',
    defaultCityAr: 'الدوحة',
    defaultCityEn: 'Doha',
    nameAr: 'قطر',
    nameEn: 'Qatar',
    phonePlaceholder: '33123456',
  },
  {
    code: 'BH',
    mappedCoreCountry: 'SA',
    dialCode: '+973',
    defaultCityAr: 'المنامة',
    defaultCityEn: 'Manama',
    nameAr: 'البحرين',
    nameEn: 'Bahrain',
    phonePlaceholder: '33123456',
  },
  {
    code: 'OM',
    mappedCoreCountry: 'SA',
    dialCode: '+968',
    defaultCityAr: 'مسقط',
    defaultCityEn: 'Muscat',
    nameAr: 'عمان',
    nameEn: 'Oman',
    phonePlaceholder: '91234567',
  },
];

export interface OnboardingCompletionPayload {
  parentName: string;
  role: ParentThemeRole;
  country: CountryCode;
  city: string;
  currency: CurrencyCode;
  phoneNumber: string;
  email: string;
  childProfile: {
    name: string;
    gender: 'boy' | 'girl';
    birth: string;
    interests: string;
    avatarTheme: AvatarAccessoryTheme;
  };
  childrenProfiles?: OnboardingChildDraft[];
  skippedForLater?: boolean;
  isCoParentLinked?: boolean;
  coParentName?: string;
  coParentEmail?: string;
  coParentPhone?: string;
  verificationChannel?: VerificationChannel;
  persistedSession?: UserSessionProfile;
}

interface OnboardingFlowModalProps {
  isOpen: boolean;
  isMandatoryGateway?: boolean;
  initialCountry: CountryCode;
  initialCity: string;
  initialParentName: string;
  initialRole: ParentThemeRole;
  language: LanguageCode;
  onClose: () => void;
  onCompleteOnboarding: (payload: OnboardingCompletionPayload) => void;
}

export const OnboardingFlowModal: React.FC<OnboardingFlowModalProps> = ({
  isOpen,
  isMandatoryGateway = false,
  initialCountry,
  initialParentName,
  initialRole,
  language,
  onClose,
  onCompleteOnboarding,
}) => {
  const isEn = language === 'en';
  const cachedDraft = React.useMemo(() => OnboardingFlowController.loadDraft(), []);

  // Step 1: Minimalist Sign-In / Registration
  // Step 2: Minimalist Children Profiles / Setup
  const [activeView, setActiveView] = useState<'AUTH' | 'CHILDREN'>('AUTH');
  const [authMode, setAuthMode] = useState<'signup' | 'signin'>(
    cachedDraft?.authMode ?? 'signup'
  );

  const [fullName, setFullName] = useState<string>(
    cachedDraft?.parentName ||
      initialParentName ||
      (initialRole === 'dad' ? 'أحمد' : 'مريم')
  );
  const [email, setEmail] = useState<string>(
    cachedDraft?.email ||
      (initialRole === 'dad' ? 'ahmad.dad@nekbaar.app' : 'maryam.mom@nekbaar.app')
  );
  const [selectedCountryCode, setSelectedCountryCode] = useState<AllowedGCCOrEgyptCountry>(
    cachedDraft?.selectedCountry === 'SA' || initialCountry === 'SA' ? 'SA' : 'EG'
  );
  const [phone, setPhone] = useState<string>(
    cachedDraft?.phone || (initialCountry === 'SA' ? '551234567' : '1012345678')
  );
  const [parentRole, setParentRole] = useState<ParentThemeRole>(
    cachedDraft?.parentRole ?? (initialRole === 'dad' ? 'dad' : 'mom')
  );
  const [familyId, setFamilyId] = useState<number>(
    cachedDraft?.familyId ?? SHARED_FAMILY_ID
  );

  // Children Profiles state (Step 2)
  const [childrenList, setChildrenList] = useState<OnboardingChildDraft[]>(() =>
    OnboardingFlowController.sanitizeChildrenList(cachedDraft?.childrenList)
  );
  const [newChildName, setNewChildName] = useState<string>('');
  const [newChildGender, setNewChildGender] = useState<'boy' | 'girl'>('boy');
  const [newChildBirth, setNewChildBirth] = useState<string>('2022-05-14');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const activeCountryObj = React.useMemo(
    () =>
      EGYPT_AND_GCC_COUNTRIES.find((c) => c.code === selectedCountryCode) ||
      EGYPT_AND_GCC_COUNTRIES[0],
    [selectedCountryCode]
  );

  const safeChildrenList = React.useMemo(
    () => OnboardingFlowController.sanitizeChildrenList(childrenList),
    [childrenList]
  );

  useEffect(() => {
    const coreCountry = activeCountryObj.mappedCoreCountry;
    const stepKey = activeView === 'AUTH' ? 'CREDENTIALS' : 'CHILDREN';
    OnboardingFlowController.saveDraft(stepKey, {
      currentStep: stepKey,
      stepNumber: activeView === 'AUTH' ? 2 : 4,
      authMode,
      parentRole,
      parentName: fullName,
      email,
      phone,
      familyId,
      selectedCountry: coreCountry,
      selectedCity: activeCountryObj.defaultCityAr,
      verificationChannel: 'email',
      otpCode: '123456',
      isOtpVerified: true,
      childrenList: safeChildrenList,
      coParentName: parentRole === 'dad' ? 'مريم' : 'أحمد',
      coParentEmail:
        parentRole === 'dad' ? 'maryam.mom@nekbaar.app' : 'ahmad.dad@nekbaar.app',
      coParentPhone: '559876543',
      isCoParentLinked: true,
    });
  }, [
    activeView,
    authMode,
    parentRole,
    fullName,
    email,
    phone,
    familyId,
    activeCountryObj,
    safeChildrenList,
  ]);

  if (!isOpen) return null;

  const handleCountryChange = (nextCode: AllowedGCCOrEgyptCountry) => {
    setSelectedCountryCode(nextCode);
    setErrorMsg(null);
    const nextOption = EGYPT_AND_GCC_COUNTRIES.find((c) => c.code === nextCode);
    if (nextOption && (!phone.trim() || phone === '1012345678' || phone === '551234567')) {
      setPhone(nextOption.phonePlaceholder);
    }
  };

  /**
   * Step 1 Submit ("متابعة" / "Next"):
   * Validates the minimalist form and immediately transitions to Children Profiles (ملفات الأطفال).
   */
  const handleAuthNext = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (authMode === 'signup' && !fullName.trim()) {
      setErrorMsg(isEn ? 'Please enter your full name.' : 'يرجى إدخال الاسم الكامل.');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setErrorMsg(isEn ? 'Please enter a valid email address.' : 'يرجى إدخال البريد الإلكتروني.');
      return;
    }

    const digitsOnly = phone
      .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
      .replace(/\D/g, '');

    if (digitsOnly.length < 7) {
      setErrorMsg(isEn ? 'Please enter a valid phone number.' : 'يرجى إدخال رقم هاتف صحيح.');
      return;
    }

    const lowerEmail = email.trim().toLowerCase();
    const isDad =
      parentRole === 'dad' ||
      lowerEmail.includes('ahmad') ||
      lowerEmail.includes('ahmed') ||
      fullName.includes('أحمد');
    const resolvedRole: ParentThemeRole = isDad ? 'dad' : 'mom';
    const resolvedName = fullName.trim() || (isDad ? 'أحمد' : 'مريم');

    setParentRole(resolvedRole);
    setFullName(resolvedName);

    setIsSubmitting(true);
    const coreCountry = activeCountryObj.mappedCoreCountry;

    await saveOnboardingLocationToSupabase({
      familyId,
      familyName: `أسرة ${resolvedName}`,
      country: coreCountry,
      city: activeCountryObj.defaultCityAr,
      currency: getSuggestedCurrencyForCountry(coreCountry),
      activeParent: isDad ? 'father' : 'mother',
    });

    const authRes = await authenticateParentWithSupabase({
      mode: authMode,
      email: email.trim(),
      password: 'Nekbaar#2026',
      phone: digitsOnly,
      parentName: resolvedName,
      role: isDad ? 'father' : 'mother',
      country: coreCountry,
    });
    setIsSubmitting(false);

    if (authRes.familyId) {
      setFamilyId(authRes.familyId);
    }

    // Immediately transition to Step 2: Children Profiles (ملفات الأطفال)
    setActiveView('CHILDREN');
  };

  const handleAddChild = () => {
    setErrorMsg(null);
    const trimmed = newChildName.trim();
    if (!trimmed) {
      setErrorMsg(isEn ? 'Please enter the child’s name.' : 'يرجى إدخال اسم الطفل.');
      return;
    }
    const validation = validateChildInput({ name: trimmed, birth: newChildBirth });
    if (!validation.valid) {
      setErrorMsg(
        validation.error || (isEn ? 'Invalid birth date.' : 'تاريخ الميلاد غير صالح.')
      );
      return;
    }

    const nextChild: OnboardingChildDraft = {
      id: Date.now() + Math.floor(Math.random() * 100),
      name: trimmed,
      gender: newChildGender,
      ageStagePreset: 'nursery_4y',
      birth: newChildBirth,
      interests: 'اللعب التفاعلي وتنمية المهارات',
      avatarTheme: newChildGender === 'girl' ? 'artist' : 'astronaut',
    };

    setChildrenList((prev) => [...prev, nextChild]);
    setNewChildName('');
  };

  const handleUpdateChild = (
    childId: number,
    patch: Partial<OnboardingChildDraft>
  ) => {
    setChildrenList((prev) =>
      prev.map((c) => (c.id === childId ? { ...c, ...patch } : c))
    );
  };

  const handleRemoveChild = (childId: number) => {
    if (safeChildrenList.length <= 1) {
      setErrorMsg(
        isEn
          ? 'At least one child profile is required.'
          : 'يجب وجود ملف طفل واحد على الأقل.'
      );
      return;
    }
    setChildrenList((prev) => prev.filter((c) => c.id !== childId));
  };

  /**
   * Step 2 Submit ("متابعة" / "Next" on Children Profiles):
   * Saves children & user session and transitions into the main app.
   */
  const handleCompleteChildrenSetup = async () => {
    setErrorMsg(null);

    if (safeChildrenList.length < 1) {
      setErrorMsg(
        isEn
          ? 'Please add at least one child profile to continue.'
          : 'يرجى إضافة ملف طفل واحد على الأقل للمتابعة.'
      );
      return;
    }

    for (const childItem of safeChildrenList) {
      const check = validateChildInput({
        name: childItem.name,
        birth: childItem.birth,
      });
      if (!check.valid) {
        setErrorMsg(
          check.error ||
            (isEn ? 'Please enter valid child details.' : 'يرجى التأكد من بيانات الطفل.')
        );
        return;
      }
    }

    setIsSubmitting(true);
    await saveOnboardingChildrenToSupabase({
      familyId,
      childrenList: safeChildrenList,
    });
    setIsSubmitting(false);

    const coreCountry = activeCountryObj.mappedCoreCountry;
    const digitsOnly =
      phone
        .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
        .replace(/\D/g, '') || activeCountryObj.phonePlaceholder;

    const cleanName = fullName.trim() || (parentRole === 'dad' ? 'أحمد' : 'مريم');
    const finalSession: UserSessionProfile = {
      userId: `usr-${parentRole}-${familyId}`,
      familyId: String(familyId),
      fullName: cleanName,
      role: parentRole,
      email: email.trim() || 'maryam.mom@nekbaar.app',
      phone: digitsOnly,
      city: activeCountryObj.defaultCityAr,
      country: coreCountry,
      childrenCount: safeChildrenList.length,
      isCoParentLinked: true,
      emailVerified: true,
      phoneVerified: true,
      verificationChannel: 'email',
      updatedAt: new Date().toISOString(),
    };

    OnboardingFlowController.persistUserSession(finalSession, true);

    const primaryChild =
      safeChildrenList[0] || INITIAL_CANONICAL_ONBOARDING_CHILDREN[0];

    onCompleteOnboarding({
      parentName: cleanName,
      role: parentRole,
      country: coreCountry,
      city: activeCountryObj.defaultCityAr,
      currency: getSuggestedCurrencyForCountry(coreCountry),
      phoneNumber: digitsOnly,
      email: finalSession.email,
      childProfile: {
        name: primaryChild.name,
        gender: primaryChild.gender,
        birth: primaryChild.birth,
        interests: primaryChild.interests,
        avatarTheme: primaryChild.avatarTheme,
      },
      childrenProfiles: safeChildrenList,
      skippedForLater: false,
      isCoParentLinked: true,
      verificationChannel: 'email',
      persistedSession: finalSession,
    });
  };

  return (
    <div
      dir={isEn ? 'ltr' : 'rtl'}
      data-testid="onboarding-gateway-backdrop"
      className="fixed inset-0 z-[110] bg-[#F8FAFC] dark:bg-[#0B131A] flex justify-center overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-wizard-title"
    >
      {/* Mobile-First Container (max-w-[430px] mx-auto) */}
      <div className="w-full max-w-[430px] mx-auto min-h-dvh pt-safe pb-safe px-6 py-8 flex flex-col justify-between">
        {/* Optional Close Button when opened from inside the app */}
        {!isMandatoryGateway && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              aria-label={isEn ? 'Close' : 'إغلاق'}
              className="min-w-[48px] min-h-[48px] rounded-full border border-slate-200 dark:border-[#1E3646] bg-white dark:bg-[#142430] text-slate-700 dark:text-[#F8FAFC] text-sm font-bold flex items-center justify-center active:scale-95 transition-transform duration-150 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        <div className="my-auto w-full space-y-7">
          {/* Centered App Logo & Brand Header */}
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#0d9488] to-[#FF8C61] text-white flex items-center justify-center text-3xl shadow-md">
              🌱
            </div>
            <h1
              id="onboarding-wizard-title"
              className="text-2xl font-black text-slate-900 dark:text-[#F8FAFC] tracking-tight"
            >
              {isEn ? 'Nekbaar' : 'نكبر'}
            </h1>
            <p
              data-testid="gateway-official-slogan-badge"
              className="text-xs font-bold text-[#0d9488] dark:text-[#2DD4BF]"
            >
              {isEn
                ? 'Our shared space.. growing with love'
                : 'مساحة تجمعنا.. وبحبهم نكبر'}
            </p>
          </div>

          {errorMsg && (
            <div
              data-testid="onboarding-error-banner"
              className="rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-center text-xs font-bold text-red-600 dark:text-red-300"
            >
              {errorMsg}
            </div>
          )}

          {/* =================================================================
              VIEW 1: MINIMALIST SIGN-IN / REGISTRATION SCREEN
              ================================================================= */}
          {activeView === 'AUTH' && (
            <form
              data-testid="welcome-auth-gateway-screen"
              onSubmit={handleAuthNext}
              className="space-y-3.5"
            >
              {/* Full Name (Registration Mode) */}
              {authMode === 'signup' && (
                <div>
                  <label htmlFor="auth-full-name" className="sr-only">
                    {isEn ? 'Full Name' : 'الاسم الكامل'}
                  </label>
                  <input
                    id="auth-full-name"
                    type="text"
                    name="name"
                    autoComplete="name"
                    data-testid="onboarding-parent-name-input"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={isEn ? 'Full Name' : 'الاسم الكامل'}
                    className="w-full min-h-[48px] rounded-full border border-slate-200 dark:border-[#1E3646] bg-white dark:bg-[#142430] px-5 py-3 text-sm font-bold text-slate-900 dark:text-[#F8FAFC] placeholder:text-slate-400 focus:outline-none focus:border-[#0d9488] shadow-2xs transition"
                  />
                </div>
              )}

              {/* Email */}
              <div>
                <label htmlFor="auth-email" className="sr-only">
                  {isEn ? 'Email' : 'البريد الإلكتروني'}
                </label>
                <input
                  id="auth-email"
                  type="email"
                  name="email"
                  inputMode="email"
                  autoComplete="email"
                  dir="ltr"
                  data-testid="gateway-email-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={isEn ? 'Email' : 'البريد الإلكتروني'}
                  className="w-full min-h-[48px] rounded-full border border-slate-200 dark:border-[#1E3646] bg-white dark:bg-[#142430] px-5 py-3 text-sm font-bold text-slate-900 dark:text-[#F8FAFC] placeholder:text-slate-400 text-start focus:outline-none focus:border-[#0d9488] shadow-2xs transition"
                />
              </div>

              {/* Country Selector Dropdown (Strictly Egypt & GCC Countries Only) */}
              {authMode === 'signup' && (
                <div>
                  <label htmlFor="auth-country" className="sr-only">
                    {isEn ? 'Country' : 'الدولة'}
                  </label>
                  <select
                    id="auth-country"
                    data-testid="onboarding-country-select"
                    value={selectedCountryCode}
                    onChange={(e) =>
                      handleCountryChange(e.target.value as AllowedGCCOrEgyptCountry)
                    }
                    className="w-full min-h-[48px] rounded-full border border-slate-200 dark:border-[#1E3646] bg-white dark:bg-[#142430] px-5 py-3 text-sm font-bold text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:border-[#0d9488] shadow-2xs transition cursor-pointer"
                  >
                    {EGYPT_AND_GCC_COUNTRIES.map((countryItem) => (
                      <option
                        key={countryItem.code}
                        value={countryItem.code}
                        className="text-slate-900 bg-white font-bold"
                      >
                        {isEn
                          ? `${countryItem.nameEn} (${countryItem.dialCode})`
                          : `${countryItem.nameAr} (${countryItem.dialCode})`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Phone Number */}
              <div>
                <label htmlFor="auth-phone" className="sr-only">
                  {isEn ? 'Phone Number' : 'رقم الهاتف'}
                </label>
                <div className="flex items-center gap-2" dir="ltr">
                  <span className="min-h-[48px] px-4 rounded-full border border-slate-200 dark:border-[#1E3646] bg-white dark:bg-[#142430] text-slate-700 dark:text-[#CBD5E1] text-sm font-bold flex items-center justify-center shadow-2xs shrink-0">
                    {activeCountryObj.dialCode}
                  </span>
                  <input
                    id="auth-phone"
                    type="tel"
                    name="phone"
                    autoComplete="tel"
                    data-testid="onboarding-phone-input"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={isEn ? 'Phone Number' : 'رقم الهاتف'}
                    className="flex-1 min-h-[48px] rounded-full border border-slate-200 dark:border-[#1E3646] bg-white dark:bg-[#142430] px-5 py-3 text-sm font-bold text-slate-900 dark:text-[#F8FAFC] placeholder:text-slate-400 focus:outline-none focus:border-[#0d9488] shadow-2xs transition"
                  />
                </div>
              </div>

              {/* Primary Smooth Pill Action Button ("متابعة" / "Next") */}
              <div className="pt-2">
                <button
                  type="submit"
                  data-testid="gateway-email-otp-submit-btn"
                  disabled={isSubmitting}
                  className="w-full min-h-[48px] rounded-full bg-[#0d9488] hover:bg-[#0f766e] text-white text-sm font-extrabold px-6 py-3 shadow-md active:scale-95 transition-transform duration-150 cursor-pointer disabled:opacity-60"
                >
                  {isSubmitting
                    ? isEn
                      ? 'Loading...'
                      : 'جاري المتابعة...'
                    : isEn
                    ? 'Next'
                    : 'متابعة'}
                </button>
              </div>

              {/* Clean Toggle Link at the Bottom for Switching Between Login and Registration */}
              <div className="pt-3 text-center">
                <button
                  type="button"
                  data-testid={
                    authMode === 'signup'
                      ? 'gateway-toggle-signin'
                      : 'gateway-toggle-signup'
                  }
                  onClick={() => {
                    setErrorMsg(null);
                    setAuthMode((prev) => (prev === 'signup' ? 'signin' : 'signup'));
                  }}
                  className="min-h-[48px] px-4 inline-flex items-center justify-center text-xs font-extrabold text-slate-600 dark:text-[#CBD5E1] hover:text-[#0d9488] dark:hover:text-[#2DD4BF] active:scale-95 transition-transform duration-150 cursor-pointer"
                >
                  {authMode === 'signup'
                    ? isEn
                      ? 'Already have an account? Sign In'
                      : 'لديك حساب بالفعل؟ تسجيل الدخول'
                    : isEn
                    ? "Don't have an account? Create Account"
                    : 'ليس لديك حساب؟ إنشاء حساب جديد'}
                </button>
              </div>
            </form>
          )}

          {/* =================================================================
              VIEW 2: MINIMALIST CHILDREN PROFILES / SETUP (ملفات الأطفال)
              ================================================================= */}
          {activeView === 'CHILDREN' && (
            <div
              data-testid="onboarding-step-4-children"
              className="space-y-4 animate-mobile-step"
            >
              <div className="text-center">
                <h2 className="text-base font-extrabold text-slate-900 dark:text-[#F8FAFC]">
                  {isEn ? 'Children Profiles' : 'ملفات الأطفال'}
                </h2>
              </div>

              {/* Existing Children List */}
              <div className="space-y-2.5 max-h-64 overflow-y-auto pe-1">
                {safeChildrenList.map((kidItem, kidIdx) => {
                  const safeBirth =
                    typeof kidItem?.birth === 'string' && kidItem.birth.trim()
                      ? kidItem.birth.trim()
                      : '2022-05-14';
                  const safeName =
                    typeof kidItem?.name === 'string' && kidItem.name.trim()
                      ? kidItem.name
                      : `طفل ${kidIdx + 1}`;
                  const safeGender: 'boy' | 'girl' =
                    kidItem?.gender === 'girl' ? 'girl' : 'boy';
                  const safeTheme: AvatarAccessoryTheme =
                    kidItem?.avatarTheme || 'astronaut';
                  const ageInfo = calculateChildAge(
                    safeBirth,
                    isEn ? 'en' : 'ar'
                  );

                  return (
                    <div
                      key={kidItem.id || kidIdx}
                      data-testid={`onboarding-child-card-${kidItem.id}`}
                      className="rounded-3xl border border-slate-200 dark:border-[#1E3646] bg-white dark:bg-[#142430] p-3.5 space-y-2.5 shadow-2xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <ThreeDChildAvatar
                            name={safeName}
                            stageCode={ageInfo.stageCode}
                            accessoryTheme={safeTheme}
                            gender={safeGender}
                            size="sm"
                          />
                          <input
                            type="text"
                            value={kidItem.name ?? ''}
                            onChange={(e) =>
                              handleUpdateChild(kidItem.id, {
                                name: e.target.value,
                              })
                            }
                            aria-label={isEn ? 'Child Name' : 'اسم الطفل'}
                            placeholder={isEn ? 'Child Name' : 'اسم الطفل'}
                            className="w-full min-h-[48px] rounded-full border border-slate-200 dark:border-[#1E3646] bg-slate-50 dark:bg-[#101D26] px-4 py-2 text-xs font-extrabold text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:border-[#0d9488]"
                          />
                        </div>

                        {safeChildrenList.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveChild(kidItem.id)}
                            aria-label={isEn ? 'Remove child' : 'حذف'}
                            className="min-w-[48px] min-h-[48px] rounded-full text-xs font-bold text-red-500 hover:bg-red-500/10 flex items-center justify-center active:scale-95 transition-transform duration-150 cursor-pointer shrink-0"
                          >
                            ✕
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={safeGender}
                          onChange={(e) =>
                            handleUpdateChild(kidItem.id, {
                              gender: e.target.value as 'boy' | 'girl',
                            })
                          }
                          className="min-h-[48px] rounded-full border border-slate-200 dark:border-[#1E3646] bg-slate-50 dark:bg-[#101D26] px-4 py-2 text-xs font-bold text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:border-[#0d9488]"
                        >
                          <option value="boy" className="text-slate-900 bg-white font-bold">
                            {isEn ? 'Boy' : 'ولد'}
                          </option>
                          <option value="girl" className="text-slate-900 bg-white font-bold">
                            {isEn ? 'Girl' : 'بنت'}
                          </option>
                        </select>

                        <input
                          type="date"
                          value={safeBirth}
                          onChange={(e) =>
                            handleUpdateChild(kidItem.id, {
                              birth: e.target.value,
                            })
                          }
                          className="min-h-[48px] rounded-full border border-slate-200 dark:border-[#1E3646] bg-slate-50 dark:bg-[#101D26] px-4 py-2 text-xs font-bold text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:border-[#0d9488]"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Minimalist Add Another Child Row */}
              <div className="rounded-3xl border border-dashed border-slate-300 dark:border-[#1E3646] bg-white/70 dark:bg-[#142430]/60 p-3.5 space-y-2.5">
                <input
                  type="text"
                  data-testid="onboarding-new-child-name"
                  value={newChildName}
                  onChange={(e) => setNewChildName(e.target.value)}
                  placeholder={isEn ? 'Add child name' : 'إضافة اسم طفل جديد'}
                  className="w-full min-h-[48px] rounded-full border border-slate-200 dark:border-[#1E3646] bg-white dark:bg-[#101D26] px-4 py-2 text-xs font-bold text-slate-900 dark:text-[#F8FAFC] placeholder:text-slate-400 focus:outline-none focus:border-[#0d9488]"
                />
                <div className="grid grid-cols-3 gap-2">
                  <select
                    value={newChildGender}
                    onChange={(e) =>
                      setNewChildGender(e.target.value as 'boy' | 'girl')
                    }
                    className="min-h-[48px] rounded-full border border-slate-200 dark:border-[#1E3646] bg-white dark:bg-[#101D26] px-3 py-2 text-xs font-bold text-slate-900 dark:text-[#F8FAFC]"
                  >
                    <option value="boy" className="text-slate-900 bg-white font-bold">
                      {isEn ? 'Boy' : 'ولد'}
                    </option>
                    <option value="girl" className="text-slate-900 bg-white font-bold">
                      {isEn ? 'Girl' : 'بنت'}
                    </option>
                  </select>

                  <input
                    type="date"
                    value={newChildBirth}
                    onChange={(e) => setNewChildBirth(e.target.value)}
                    className="min-h-[48px] rounded-full border border-slate-200 dark:border-[#1E3646] bg-white dark:bg-[#101D26] px-3 py-2 text-xs font-bold text-slate-900 dark:text-[#F8FAFC]"
                  />

                  <button
                    type="button"
                    data-testid="onboarding-add-child-btn"
                    onClick={handleAddChild}
                    className="min-h-[48px] rounded-full bg-teal-500/15 hover:bg-teal-500/25 text-[#0d9488] dark:text-[#2DD4BF] text-xs font-extrabold px-3 py-2 active:scale-95 transition-transform duration-150 cursor-pointer"
                  >
                    {isEn ? '+ Add' : '+ إضافة'}
                  </button>
                </div>
              </div>

              {/* Primary Smooth Pill Action Button ("متابعة" / "Next") */}
              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  data-testid="onboarding-next-btn"
                  disabled={isSubmitting}
                  onClick={() => void handleCompleteChildrenSetup()}
                  className="w-full min-h-[48px] rounded-full bg-[#0d9488] hover:bg-[#0f766e] text-white text-sm font-extrabold px-6 py-3 shadow-md active:scale-95 transition-transform duration-150 cursor-pointer disabled:opacity-60"
                >
                  {isSubmitting
                    ? isEn
                      ? 'Saving...'
                      : 'جاري الحفظ...'
                    : isEn
                    ? 'Next'
                    : 'متابعة'}
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    data-testid="onboarding-back-btn"
                    onClick={() => {
                      setErrorMsg(null);
                      setActiveView('AUTH');
                    }}
                    className="min-h-[48px] px-4 inline-flex items-center justify-center text-xs font-bold text-slate-500 dark:text-[#94A3B8] hover:text-slate-800 dark:hover:text-[#F8FAFC] active:scale-95 transition-transform duration-150 cursor-pointer"
                  >
                    {isEn ? 'Back' : 'رجوع'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Minimal Footer */}
        <div
          data-testid="onboarding-login-bottom-copyright"
          className="pt-4 text-center text-[11px] text-slate-400 dark:text-[#64748B]"
        >
          {isEn ? 'Nekbaar © 2026' : 'نكبر © 2026'}
        </div>
      </div>
    </div>
  );
};

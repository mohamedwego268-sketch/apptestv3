import React, { useEffect, useState } from 'react';
import {
  COUNTRY_CITIES_MAP,
  CountryCode,
  CurrencyCode,
  DEFAULT_SEED,
  LanguageCode,
  ParentThemeRole,
  calculateChildAge,
  getSuggestedCurrencyForCountry,
  validateChildInput,
  validatePhoneForCountry,
} from '../domain/familySpaceCore';
import { AVATAR_ACCESSORY_THEMES, AvatarAccessoryTheme } from '../domain/assetManifest3D';
import {
  authenticateParentWithSupabase,
  saveOnboardingChildrenToSupabase,
  saveOnboardingLocationToSupabase,
} from '../services/supabaseService';
import { ThreeDChildAvatar } from './ThreeDVisuals';

export interface OnboardingChildDraft {
  id: number;
  name: string;
  gender: 'boy' | 'girl';
  ageStagePreset: 'infant_6m' | 'nursery_4y' | 'school_8y' | 'custom';
  birth: string;
  interests: string;
  avatarTheme: AvatarAccessoryTheme;
}

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
}

interface OnboardingFlowModalProps {
  isOpen: boolean;
  initialCountry: CountryCode;
  initialCity: string;
  initialParentName: string;
  initialRole: ParentThemeRole;
  language: LanguageCode;
  onClose: () => void;
  onCompleteOnboarding: (payload: OnboardingCompletionPayload) => void;
}

const QUICK_REGION_PRESETS: Array<{
  country: CountryCode;
  cityAr: string;
  cityEn: string;
  regionAr: string;
  regionEn: string;
}> = [
  {
    country: 'SA',
    cityAr: 'الدمام',
    cityEn: 'Dammam',
    regionAr: 'المنطقة الشرقية',
    regionEn: 'Eastern Province',
  },
  {
    country: 'SA',
    cityAr: 'الرياض',
    cityEn: 'Riyadh',
    regionAr: 'منطقة الرياض',
    regionEn: 'Riyadh Region',
  },
  {
    country: 'SA',
    cityAr: 'جدة',
    cityEn: 'Jeddah',
    regionAr: 'منطقة مكة المكرمة',
    regionEn: 'Makkah Region',
  },
  {
    country: 'EG',
    cityAr: 'القاهرة',
    cityEn: 'Cairo',
    regionAr: 'إقليم القاهرة الكبرى',
    regionEn: 'Greater Cairo',
  },
  {
    country: 'EG',
    cityAr: 'الإسكندرية',
    cityEn: 'Alexandria',
    regionAr: 'إقليم الإسكندرية',
    regionEn: 'Alexandria Region',
  },
];

const INITIAL_CANONICAL_CHILDREN: OnboardingChildDraft[] = [
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
    avatarTheme: 'Explorer' as AvatarAccessoryTheme,
  },
];

export const OnboardingFlowModal: React.FC<OnboardingFlowModalProps> = ({
  isOpen,
  initialCountry,
  initialCity,
  initialParentName,
  initialRole,
  language,
  onClose,
  onCompleteOnboarding,
}) => {
  const isEn = language === 'en';
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [isSavingStep, setIsSavingStep] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [stepSyncNotice, setStepSyncNotice] = useState<string | null>(null);

  // Step 1: Supabase Authentication & Credentials (Email, Password, Phone Number)
  const [authMode, setAuthMode] = useState<'signup' | 'signin'>('signup');
  const [parentRole, setParentRole] = useState<ParentThemeRole>(
    initialRole === 'dad' ? 'dad' : 'mom'
  );
  const [parentName, setParentName] = useState<string>(
    initialParentName || (initialRole === 'dad' ? 'أحمد (الأب)' : 'مريم (الأم)')
  );
  const [email, setEmail] = useState<string>('maryam.mom@nekbaar.app');
  const [password, setPassword] = useState<string>('Nekbaar#2026');
  const [phone, setPhone] = useState<string>(initialCountry === 'SA' ? '551234567' : '1012345678');
  const [familyId, setFamilyId] = useState<number>(1);
  const [authenticatedUserId, setAuthenticatedUserId] = useState<string>('parent-maryam');

  // Step 2: Location & Region Selection
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(initialCountry || 'SA');
  const [selectedCity, setSelectedCity] = useState<string>(initialCity || 'الدمام');
  const [isLoadingCities, setIsLoadingCities] = useState<boolean>(false);

  // Step 3: Dynamic Children Profiles Setup (Hamza, Laila, Youssef + Add New Child form)
  const [childrenList, setChildrenList] = useState<OnboardingChildDraft[]>(() =>
    INITIAL_CANONICAL_CHILDREN.map((c) => ({
      ...c,
      avatarTheme:
        AVATAR_ACCESSORY_THEMES.find((t) => t.id === c.avatarTheme)?.id || 'astronaut',
    }))
  );
  const [newChildName, setNewChildName] = useState<string>('');
  const [newChildGender, setNewChildGender] = useState<'boy' | 'girl'>('boy');
  const [newChildStage, setNewChildStage] =
    useState<OnboardingChildDraft['ageStagePreset']>('infant_6m');
  const [newChildBirth, setNewChildBirth] = useState<string>('2026-04-20');
  const [newChildInterests, setNewChildInterests] = useState<string>(
    'وقت البطن الحسي، الألعاب الخشبية، والقصص المصورة'
  );
  const [newChildAvatarTheme, setNewChildAvatarTheme] =
    useState<AvatarAccessoryTheme>('astronaut');

  const availableCities = COUNTRY_CITIES_MAP[selectedCountry] || [];

  useEffect(() => {
    if (!isOpen) return;
    setErrorMsg(null);
  }, [isOpen, step]);

  if (!isOpen) return null;

  const handleSelectCountry = (nextCountry: CountryCode) => {
    setSelectedCountry(nextCountry);
    setIsLoadingCities(true);
    setErrorMsg(null);
    window.setTimeout(() => {
      setIsLoadingCities(false);
      const firstCity =
        nextCountry === 'SA'
          ? 'الدمام'
          : COUNTRY_CITIES_MAP[nextCountry]?.[0]?.id || 'القاهرة';
      setSelectedCity(firstCity);
      if (nextCountry === 'SA' && phone === '1012345678') {
        setPhone('551234567');
      } else if (nextCountry === 'EG' && phone === '551234567') {
        setPhone('1012345678');
      }
    }, 140);
  };

  const handleStagePresetChange = (preset: OnboardingChildDraft['ageStagePreset']) => {
    setNewChildStage(preset);
    if (preset === 'infant_6m') {
      setNewChildBirth('2026-04-20');
      setNewChildInterests('وقت البطن الحسي، تتبع الخشخيشة الخشبية، والمناغاة التفاعلية');
    } else if (preset === 'nursery_4y') {
      setNewChildBirth('2022-05-14');
      setNewChildInterests('التلوين المائي والصلصال، أناشيد الحضانة، وتسمية المشاعر');
    } else if (preset === 'school_8y') {
      setNewChildBirth('2018-09-10');
      setNewChildInterests('السباحة وكرة القدم، تجارب العلوم المدرسية، وألغاز الذكاء');
    }
  };

  const handleAddDraftChild = () => {
    setErrorMsg(null);
    const trimmedName = newChildName.trim();
    if (!trimmedName) {
      setErrorMsg(
        isEn
          ? 'Please enter the child’s name before adding.'
          : 'يرجى كتابة اسم الطفل أولاً لإضافته للقائمة.'
      );
      return;
    }
    const validation = validateChildInput({ name: trimmedName, birth: newChildBirth });
    if (!validation.valid) {
      setErrorMsg(
        validation.error || (isEn ? 'Invalid child birth date.' : 'تاريخ ميلاد الطفل غير صالح.')
      );
      return;
    }

    const nextChild: OnboardingChildDraft = {
      id: Date.now() + Math.floor(Math.random() * 100),
      name: trimmedName,
      gender: newChildGender,
      ageStagePreset: newChildStage,
      birth: newChildBirth,
      interests: newChildInterests.trim() || 'اللعب التفاعلي وتنمية المهارات',
      avatarTheme: newChildAvatarTheme,
    };

    setChildrenList((prev) => [...prev, nextChild]);
    setNewChildName('');
    setStepSyncNotice(
      isEn
        ? `Added "${trimmedName}" to family children list.`
        : `تمت إضافة «${trimmedName}» إلى قائمة أطفال الأسرة.`
    );
  };

  const handleRemoveDraftChild = (childId: number) => {
    if (childrenList.length <= 1) {
      setErrorMsg(
        isEn
          ? 'At least one child profile must remain in the family.'
          : 'يجب الإبقاء على ملف طفل واحد على الأقل في الأسرة.'
      );
      return;
    }
    setChildrenList((prev) => prev.filter((c) => c.id !== childId));
  };

  const handleUpdateDraftChildField = (
    childId: number,
    patch: Partial<OnboardingChildDraft>
  ) => {
    setChildrenList((prev) =>
      prev.map((c) => (c.id === childId ? { ...c, ...patch } : c))
    );
  };

  // Sequential Step Progression with Supabase Auth & Progressive Table Persistence
  const handleNextStep = async () => {
    setErrorMsg(null);
    setStepSyncNotice(null);

    // STEP 1 -> STEP 2: Authenticate via Supabase Auth & upsert `users`
    if (step === 1) {
      if (!email.trim() || !email.includes('@')) {
        setErrorMsg(
          isEn
            ? 'Please enter a valid email address.'
            : 'يرجى إدخال بريد إلكتروني صحيح للتسجيل.'
        );
        return;
      }
      if (!password || password.length < 6) {
        setErrorMsg(
          isEn
            ? 'Password must be at least 6 characters long.'
            : 'يجب أن تتكون كلمة المرور من ٦ أحرف أو أرقام على الأقل.'
        );
        return;
      }
      const phoneCheck = validatePhoneForCountry(phone, selectedCountry);
      if (!phoneCheck.valid) {
        setErrorMsg(
          isEn
            ? phoneCheck.errorEn || 'Invalid mobile number.'
            : phoneCheck.errorAr || 'رقم الجوال غير صالح.'
        );
        return;
      }
      if (!parentName.trim()) {
        setErrorMsg(
          isEn ? 'Please enter parent display name.' : 'يرجى إدخال اسم الوالد أو الوالدة.'
        );
        return;
      }

      setIsSavingStep(true);
      const authRes = await authenticateParentWithSupabase({
        mode: authMode,
        email: email.trim(),
        password,
        phone: phoneCheck.normalized,
        parentName: parentName.trim(),
        role: parentRole === 'dad' ? 'father' : 'mother',
        country: selectedCountry,
      });
      setIsSavingStep(false);

      setAuthenticatedUserId(authRes.userId);
      setFamilyId(authRes.familyId);
      setStepSyncNotice(
        isEn
          ? 'Step 1 Saved: Account authenticated & synced with Supabase Auth.'
          : 'تم حفظ الخطوة ١: تم توثيق الحساب وربطه بقاعدة بيانات Supabase بنجاح.'
      );
      setStep(2);
      return;
    }

    // STEP 2 -> STEP 3: Save Region/City to `families` table in Supabase
    if (step === 2) {
      if (!selectedCity.trim()) {
        setErrorMsg(
          isEn
            ? 'Please select your city or region (e.g., Dammam, Riyadh, Cairo).'
            : 'يرجى اختيار المدينة أو المنطقة (مثل: الدمام، الرياض، القاهرة).'
        );
        return;
      }

      setIsSavingStep(true);
      await saveOnboardingLocationToSupabase({
        familyId,
        familyName: `أسرة ${parentName.trim()} — نكبر`,
        country: selectedCountry,
        city: selectedCity,
        currency: getSuggestedCurrencyForCountry(selectedCountry),
        activeParent: parentRole === 'dad' ? 'father' : 'mother',
      });
      setIsSavingStep(false);

      setStepSyncNotice(
        isEn
          ? `Step 2 Saved: Region set to ${selectedCity} in Supabase families table.`
          : `تم حفظ الخطوة ٢: تم حفظ موقع الأسرة (${selectedCity}) في جدول العائلات.`
      );
      setStep(3);
      return;
    }

    // STEP 3 -> STEP 4: Save Children Profiles (Hamza, Laila, Youssef) to `children` table in Supabase
    if (step === 3) {
      if (childrenList.length === 0) {
        setErrorMsg(
          isEn
            ? 'Please add at least one child profile.'
            : 'يرجى إضافة ملف طفل واحد على الأقل.'
        );
        return;
      }
      for (const childItem of childrenList) {
        const check = validateChildInput({ name: childItem.name, birth: childItem.birth });
        if (!check.valid) {
          setErrorMsg(
            check.error ||
              (isEn
                ? `Invalid data for child: ${childItem.name}`
                : `بيانات غير صالحة لملف الطفل: ${childItem.name}`)
          );
          return;
        }
      }

      setIsSavingStep(true);
      await saveOnboardingChildrenToSupabase({
        familyId,
        childrenList,
      });
      setIsSavingStep(false);

      setStepSyncNotice(
        isEn
          ? `Step 3 Saved: ${childrenList.length} children profiles linked to family_id #${familyId}.`
          : `تم حفظ الخطوة ٣: تم ربط ${childrenList.length} ملفات أطفال بقاعدة بيانات الأسرة بنجاح.`
      );
      setStep(4);
      return;
    }

    // STEP 4 -> COMPLETE & REDIRECT TO DASHBOARD
    if (step === 4) {
      const primaryChild = childrenList[0] || INITIAL_CANONICAL_CHILDREN[0];
      onCompleteOnboarding({
        parentName: parentName.trim(),
        role: parentRole,
        country: selectedCountry,
        city: selectedCity,
        currency: getSuggestedCurrencyForCountry(selectedCountry),
        phoneNumber: phone.trim(),
        email: email.trim(),
        childProfile: {
          name: primaryChild.name,
          gender: primaryChild.gender,
          birth: primaryChild.birth,
          interests: primaryChild.interests,
          avatarTheme: primaryChild.avatarTheme,
        },
        childrenProfiles: childrenList,
      });
    }
  };

  const handlePreviousStep = () => {
    setErrorMsg(null);
    setStepSyncNotice(null);
    if (step > 1) {
      setStep((prev) => (prev - 1) as 1 | 2 | 3 | 4);
    }
  };

  return (
    <div
      dir={isEn ? 'ltr' : 'rtl'}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-wizard-title"
    >
      <div className="soft-card-surface w-full max-w-2xl rounded-3xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-surface)] dark:bg-[#101D26] p-4 sm:p-6 space-y-4 max-h-[92vh] overflow-y-auto shadow-2xl">
        {/* Top Wizard Header */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-[var(--color-border)] dark:border-[#1E3646]">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-[11px] font-black text-[#0d9488] dark:text-[#2DD4BF]">
              <span>✨</span>
              <span>
                {isEn
                  ? `Sequential Family Onboarding · Step ${step} of 4`
                  : `معالج إعداد العائلة المتسلسل · الخطوة ${step} من 4`}
              </span>
            </div>
            <h2
              id="onboarding-wizard-title"
              className="text-base sm:text-lg font-black text-[var(--color-text)] dark:text-[#F8FAFC]"
            >
              {step === 1
                ? isEn
                  ? 'Step 1: Supabase Authentication & Parent Credentials'
                  : 'الخطوة ١: توثيق الحساب وبيانات الوالدين (Supabase Auth)'
                : step === 2
                ? isEn
                  ? 'Step 2: Location & Region Selection'
                  : 'الخطوة ٢: اختيار الموقع والمنطقة / المدينة'
                : step === 3
                ? isEn
                  ? 'Step 3: Children Profiles Setup (Hamza, Laila & Youssef)'
                  : 'الخطوة ٣: إعداد ملفات الأطفال (حمزة، ليلى، ويوسف)'
                : isEn
                ? 'Step 4: Ready! Enter Family Dashboard'
                : 'الخطوة ٤: اكتمل الإعداد! الدخول إلى لوحة العائلة'}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={isEn ? 'Close onboarding wizard' : 'إغلاق معالج الإعداد'}
            className="w-8 h-8 rounded-xl text-lg font-black leading-none border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-muted)] dark:bg-[#142430] text-[var(--color-text)] dark:text-[#F8FAFC] hover:border-[#FF8C61] flex items-center justify-center shrink-0 cursor-pointer"
          >
            ×
          </button>
        </div>

        {/* Sequential Progress Bar & Step Indicators */}
        <div className="space-y-2">
          <div className="grid grid-cols-4 gap-2">
            {[
              { num: 1, labelAr: '١. التوثيق', labelEn: '1. Auth' },
              { num: 2, labelAr: '٢. المنطقة', labelEn: '2. Location' },
              { num: 3, labelAr: '٣. الأطفال', labelEn: '3. Children' },
              { num: 4, labelAr: '٤. الانطلاق', labelEn: '4. Launch' },
            ].map((item) => {
              const isCurrent = step === item.num;
              const isCompleted = step > item.num;
              return (
                <div
                  key={item.num}
                  data-testid={`onboarding-step-pill-${item.num}`}
                  className={`py-2 px-2.5 rounded-xl text-xs font-extrabold text-center transition-all border ${
                    isCurrent
                      ? 'bg-[#0d9488] text-white border-[#0d9488] shadow-xs'
                      : isCompleted
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/35'
                      : 'bg-[var(--color-control-muted)] dark:bg-[#142430] text-[var(--color-muted)] border-transparent'
                  }`}
                >
                  {isCompleted ? '✓ ' : ''}
                  {isEn ? item.labelEn : item.labelAr}
                </div>
              );
            })}
          </div>
          <div className="w-full h-1.5 rounded-full bg-[var(--color-control-muted)] dark:bg-[#142430] overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#0d9488] to-[#FF8C61] transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* Validation Error Alert */}
        {errorMsg && (
          <div
            role="alert"
            data-testid="onboarding-error-alert"
            className="rounded-2xl border border-red-400/50 bg-red-50/90 dark:bg-red-950/40 px-4 py-3 text-xs font-extrabold text-red-800 dark:text-red-200 flex items-center gap-2"
          >
            <span>⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Progressive Sync Confirmation Notice */}
        {stepSyncNotice && !errorMsg && (
          <div
            role="status"
            className="rounded-2xl border border-emerald-500/40 bg-emerald-50/90 dark:bg-emerald-950/35 px-4 py-2.5 text-xs font-extrabold text-emerald-800 dark:text-emerald-200 flex items-center gap-2"
          >
            <span>✅</span>
            <span>{stepSyncNotice}</span>
          </div>
        )}

        {/* ===================================================================
            STEP 1: AUTHENTICATION & CREDENTIALS (SUPABASE AUTH)
            =================================================================== */}
        {step === 1 && (
          <div data-testid="onboarding-step-1-auth" className="space-y-4">
            {/* Sign Up vs Sign In Switcher */}
            <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-[var(--color-control-muted)] dark:bg-[#142430]">
              <button
                type="button"
                onClick={() => setAuthMode('signup')}
                className={`py-2 px-3 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                  authMode === 'signup'
                    ? 'bg-[var(--color-surface)] dark:bg-[#101D26] text-[#0d9488] dark:text-[#2DD4BF] shadow-2xs'
                    : 'text-[var(--color-muted)]'
                }`}
              >
                {isEn ? 'Create Family Account (Sign Up)' : 'إنشاء حساب عائلي جديد'}
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('signin')}
                className={`py-2 px-3 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                  authMode === 'signin'
                    ? 'bg-[var(--color-surface)] dark:bg-[#101D26] text-[#0d9488] dark:text-[#2DD4BF] shadow-2xs'
                    : 'text-[var(--color-muted)]'
                }`}
              >
                {isEn ? 'Sign In to Existing Account' : 'تسجيل الدخول لحساب حالي'}
              </button>
            </div>

            {/* Parent Identity Preset (Maryam / Ahmad) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold text-[var(--color-text)] dark:text-[#F8FAFC]">
                {isEn ? 'Select Active Parent Identity' : 'اختر هوية الوالد / الوالدة'}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setParentRole('mom');
                    setParentName('مريم (الأم)');
                    setEmail('maryam.mom@nekbaar.app');
                  }}
                  className={`p-3 rounded-2xl border-2 text-start transition cursor-pointer flex items-center gap-3 ${
                    parentRole === 'mom'
                      ? 'border-rose-500/60 bg-rose-500/10 text-[var(--color-text)] dark:text-[#F8FAFC]'
                      : 'border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-bg)] dark:bg-[#142430]'
                  }`}
                >
                  <span className="text-xl">👩🏻‍🍼</span>
                  <div>
                    <div className="text-xs font-black">
                      {isEn ? 'Mom Maryam' : 'ماما مريم (الأم)'}
                    </div>
                    <div className="text-[11px] text-[var(--color-muted)]">
                      {isEn ? 'Warm Rose & Coral Theme' : 'السمة الوردية الدافئة'}
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setParentRole('dad');
                    setParentName('أحمد (الأب)');
                    setEmail('ahmad.dad@nekbaar.app');
                  }}
                  className={`p-3 rounded-2xl border-2 text-start transition cursor-pointer flex items-center gap-3 ${
                    parentRole === 'dad'
                      ? 'border-[#0d9488] bg-teal-500/10 text-[var(--color-text)] dark:text-[#F8FAFC]'
                      : 'border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-bg)] dark:bg-[#142430]'
                  }`}
                >
                  <span className="text-xl">👨🏻‍🍼</span>
                  <div>
                    <div className="text-xs font-black">
                      {isEn ? 'Dad Ahmad' : 'بابا أحمد (الأب)'}
                    </div>
                    <div className="text-[11px] text-[var(--color-muted)]">
                      {isEn ? 'Calm Teal & Slate Theme' : 'السمة التركوازية الهادئة'}
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Parent Name, Email, Password, Phone Number */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[var(--color-text)] dark:text-[#F8FAFC] mb-1">
                  {isEn ? 'Full Name' : 'الاسم الكامل'}
                </label>
                <input
                  type="text"
                  data-testid="onboarding-parent-name-input"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  placeholder={isEn ? 'e.g. Ahmad or Maryam' : 'مثال: أحمد أو مريم'}
                  className="w-full rounded-xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-bg)] dark:bg-[#142430] px-3.5 py-2.5 text-xs font-bold text-[var(--color-text)] dark:text-[#F8FAFC]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--color-text)] dark:text-[#F8FAFC] mb-1">
                  {isEn
                    ? `Phone Number (${selectedCountry === 'SA' ? '+966' : '+20'})`
                    : `رقم الجوال (${selectedCountry === 'SA' ? '+966' : '+20'})`}
                </label>
                <input
                  type="tel"
                  dir="ltr"
                  data-testid="onboarding-phone-input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={selectedCountry === 'SA' ? '551234567' : '1012345678'}
                  className="w-full rounded-xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-bg)] dark:bg-[#142430] px-3.5 py-2.5 text-xs font-bold text-[var(--color-text)] dark:text-[#F8FAFC] tabular-nums"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--color-text)] dark:text-[#F8FAFC] mb-1">
                  {isEn ? 'Email Address (Supabase Auth)' : 'البريد الإلكتروني (Supabase Auth)'}
                </label>
                <input
                  type="email"
                  dir="ltr"
                  data-testid="onboarding-email-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="parent@nekbaar.app"
                  className="w-full rounded-xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-bg)] dark:bg-[#142430] px-3.5 py-2.5 text-xs font-bold text-[var(--color-text)] dark:text-[#F8FAFC]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--color-text)] dark:text-[#F8FAFC] mb-1">
                  {isEn ? 'Password (min 6 characters)' : 'كلمة المرور (٦ أحرف على الأقل)'}
                </label>
                <input
                  type="password"
                  dir="ltr"
                  data-testid="onboarding-password-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-bg)] dark:bg-[#142430] px-3.5 py-2.5 text-xs font-bold text-[var(--color-text)] dark:text-[#F8FAFC]"
                />
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================
            STEP 2: LOCATION & REGION SELECTION (SAVED TO SUPABASE FAMILIES)
            =================================================================== */}
        {step === 2 && (
          <div data-testid="onboarding-step-2-location" className="space-y-4">
            <p className="text-xs font-semibold text-[var(--color-muted)] dark:text-[#CBD5E1] leading-relaxed">
              {isEn
                ? 'Select your country and city/region (e.g., Dammam, Riyadh, Jeddah, Cairo) to personalize local pediatric clinics, nurseries, weather, and currency.'
                : 'اختر الدولة والمدينة أو المنطقة (مثل: الدمام، الرياض، جدة، القاهرة) لحفظها في ملف الأسرة وتخصيص الأطباء والحضانات وحالة الطقس.'}
            </p>

            {/* Quick-Select Popular Cities (Dammam, Riyadh, Jeddah, Cairo, Alexandria) */}
            <div className="space-y-1.5">
              <div className="text-xs font-extrabold text-[var(--color-text)] dark:text-[#F8FAFC]">
                ⚡ {isEn ? 'Quick Region Selection:' : 'اختيار سريع للمدن الرئيسية:'}
              </div>
              <div className="flex flex-wrap gap-2">
                {QUICK_REGION_PRESETS.map((preset) => {
                  const isActive =
                    selectedCountry === preset.country && selectedCity === preset.cityAr;
                  return (
                    <button
                      key={`${preset.country}-${preset.cityEn}`}
                      type="button"
                      onClick={() => {
                        setSelectedCountry(preset.country);
                        setSelectedCity(preset.cityAr);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border transition cursor-pointer ${
                        isActive
                          ? 'bg-[#0d9488] text-white border-[#0d9488] shadow-2xs'
                          : 'border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-bg)] dark:bg-[#142430] text-[var(--color-text)] dark:text-[#F8FAFC] hover:border-[#0d9488]'
                      }`}
                    >
                      📍 {isEn ? `${preset.cityEn} (${preset.regionEn})` : `${preset.cityAr} (${preset.regionAr})`}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Country Selector Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                {
                  code: 'SA' as CountryCode,
                  titleAr: '🇸🇦 المملكة العربية السعودية (ر.س · SAR)',
                  titleEn: '🇸🇦 Saudi Arabia (SAR)',
                  subAr: 'الدمام، الرياض، جدة، الخبر، مكة، المدينة، القصيم، وجميع مناطق المملكة',
                  subEn: 'Dammam, Riyadh, Jeddah, Khobar, Makkah, Madinah & all Saudi regions',
                },
                {
                  code: 'EG' as CountryCode,
                  titleAr: '🇪🇬 جمهورية مصر العربية (ج.م · EGP)',
                  titleEn: '🇪🇬 Egypt (EGP)',
                  subAr: 'القاهرة، الجيزة، الإسكندرية، الدقهلية، الشرقية وجميع المحافظات الـ ٢٧',
                  subEn: 'Cairo, Giza, Alexandria & all 27 Egyptian governorates',
                },
              ].map((countryCard) => {
                const active = selectedCountry === countryCard.code;
                return (
                  <button
                    key={countryCard.code}
                    type="button"
                    onClick={() => handleSelectCountry(countryCard.code)}
                    className={`p-3.5 rounded-2xl border-2 text-start transition cursor-pointer space-y-1 ${
                      active
                        ? 'border-[#0d9488] bg-teal-500/10'
                        : 'border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-bg)] dark:bg-[#142430]'
                    }`}
                  >
                    <div className="text-xs sm:text-sm font-black text-[var(--color-text)] dark:text-[#F8FAFC]">
                      {isEn ? countryCard.titleEn : countryCard.titleAr}
                    </div>
                    <div className="text-[11px] text-[var(--color-muted)] dark:text-[#94A3B8] leading-relaxed">
                      {isEn ? countryCard.subEn : countryCard.subAr}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* City / Region Select Dropdown */}
            <div className="space-y-2">
              <label className="block text-xs font-extrabold text-[var(--color-text)] dark:text-[#F8FAFC]">
                🏙️ {isEn ? 'Selected City / Region' : 'المدينة / المنطقة المختارة'}
              </label>

              {isLoadingCities ? (
                <div className="rounded-2xl border border-dashed border-[var(--color-border)] p-4 text-center text-xs font-bold text-[var(--color-muted)]">
                  ⏳ {isEn ? 'Loading regional cities...' : 'جاري تحميل قائمة المدن والمناطق...'}
                </div>
              ) : (
                <select
                  data-testid="onboarding-city-select"
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full rounded-xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-bg)] dark:bg-[#142430] px-3.5 py-2.5 text-xs font-extrabold text-[var(--color-text)] dark:text-[#F8FAFC]"
                >
                  {selectedCountry === 'SA' && (
                    <option value="الدمام">
                      {isEn ? 'Dammam — Eastern Province' : 'الدمام — المنطقة الشرقية'}
                    </option>
                  )}
                  {availableCities.map((cityItem) => (
                    <option key={cityItem.id} value={cityItem.id}>
                      {isEn
                        ? `${cityItem.nameEn} — ${cityItem.regionEn}`
                        : `${cityItem.nameAr} — ${cityItem.regionAr}`}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        )}

        {/* ===================================================================
            STEP 3: CHILDREN PROFILES SETUP (HAMZA, LAILA, YOUSSEF + DYNAMIC ADD)
            =================================================================== */}
        {step === 3 && (
          <div data-testid="onboarding-step-3-children" className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-semibold text-[var(--color-muted)] dark:text-[#CBD5E1]">
                {isEn
                  ? 'Review or customize your children profiles (Hamza 6m, Laila 4y, Youssef 8y) or add another child. All records are saved to the Supabase children table.'
                  : 'راجع أو عدّل ملفات أطفالك (حمزة ٦ شهور، ليلى ٤ سنوات، يوسف ٨ سنوات) أو أضف طفلاً جديداً ليتم حفظهم مباشرة في جدول children بقاعدة البيانات.'}
              </p>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-teal-500/15 text-[#0d9488] dark:text-[#2DD4BF]">
                {childrenList.length} {isEn ? 'Children' : 'أطفال مسجلين'}
              </span>
            </div>

            {/* Active Children List */}
            <div className="space-y-2.5 max-h-60 overflow-y-auto pe-1">
              {childrenList.map((kidItem, idx) => {
                const ageInfo = calculateChildAge(kidItem.birth, language);
                return (
                  <div
                    key={kidItem.id}
                    data-testid={`onboarding-child-card-${idx}`}
                    className="rounded-2xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-bg)] dark:bg-[#142430] p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <ThreeDChildAvatar
                        name={kidItem.name}
                        gender={kidItem.gender}
                        stageCode={ageInfo.stageCode}
                        accessoryTheme={kidItem.avatarTheme}
                        size="sm"
                      />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={kidItem.name}
                            onChange={(e) =>
                              handleUpdateDraftChildField(kidItem.id, { name: e.target.value })
                            }
                            aria-label={isEn ? 'Child Name' : 'اسم الطفل'}
                            className="rounded-lg border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-surface)] dark:bg-[#101D26] px-2.5 py-1 text-xs font-black text-[var(--color-text)] dark:text-[#F8FAFC] w-32"
                          />
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-500/12 text-[#0d9488] dark:text-[#2DD4BF]">
                            {ageInfo.label}
                          </span>
                        </div>
                        <div className="text-[11px] text-[var(--color-muted)] dark:text-[#94A3B8]">
                          {ageInfo.stageTitle}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={kidItem.gender}
                        onChange={(e) =>
                          handleUpdateDraftChildField(kidItem.id, {
                            gender: e.target.value as 'boy' | 'girl',
                          })
                        }
                        className="rounded-xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-surface)] dark:bg-[#101D26] px-2.5 py-1.5 text-xs font-bold text-[var(--color-text)] dark:text-[#F8FAFC]"
                      >
                        <option value="boy">{isEn ? 'Boy 👦🏻' : 'ولد 👦🏻'}</option>
                        <option value="girl">{isEn ? 'Girl 👧🏻' : 'بنت 👧🏻'}</option>
                      </select>

                      <input
                        type="date"
                        value={kidItem.birth}
                        onChange={(e) =>
                          handleUpdateDraftChildField(kidItem.id, { birth: e.target.value })
                        }
                        className="rounded-xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-surface)] dark:bg-[#101D26] px-2.5 py-1 text-xs font-bold text-[var(--color-text)] dark:text-[#F8FAFC]"
                      />

                      {childrenList.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveDraftChild(kidItem.id)}
                          className="px-2.5 py-1 rounded-xl text-xs font-bold text-red-600 hover:bg-red-500/10 cursor-pointer"
                          title={isEn ? 'Remove child' : 'حذف الملف'}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Dynamic Form to Add Another Child */}
            <div className="rounded-2xl border border-dashed border-[#0d9488]/45 bg-teal-50/40 dark:bg-[#142430]/70 p-3.5 space-y-3">
              <div className="text-xs font-black text-[#0d9488] dark:text-[#2DD4BF]">
                ➕ {isEn ? 'Add Another Child to Family' : 'إضافة طفل جديد لقائمة الأسرة'}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <input
                  type="text"
                  data-testid="onboarding-new-child-name"
                  value={newChildName}
                  onChange={(e) => setNewChildName(e.target.value)}
                  placeholder={isEn ? 'Child Name (e.g. Omar)' : 'اسم الطفل'}
                  className="rounded-xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-surface)] dark:bg-[#101D26] px-3 py-2 text-xs font-bold text-[var(--color-text)] dark:text-[#F8FAFC]"
                />

                <select
                  value={newChildStage}
                  onChange={(e) =>
                    handleStagePresetChange(
                      e.target.value as OnboardingChildDraft['ageStagePreset']
                    )
                  }
                  className="rounded-xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-surface)] dark:bg-[#101D26] px-3 py-2 text-xs font-bold text-[var(--color-text)] dark:text-[#F8FAFC]"
                >
                  <option value="infant_6m">
                    {isEn ? 'Infant Stage (0–2 Years / 6m)' : 'مرحلة الرضيع (٦ شهور / ٠–٢ سنة)'}
                  </option>
                  <option value="nursery_4y">
                    {isEn ? 'Nursery & Creative (3–5 Years)' : 'مرحلة الحضانة والإبداع (٣–٥ سنوات)'}
                  </option>
                  <option value="school_8y">
                    {isEn ? 'School & Sports (6–9 Years)' : 'مرحلة المدرسة والرياضة (٦–٩ سنوات)'}
                  </option>
                </select>

                <div className="flex items-center gap-2">
                  <select
                    value={newChildGender}
                    onChange={(e) => setNewChildGender(e.target.value as 'boy' | 'girl')}
                    className="flex-1 rounded-xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-surface)] dark:bg-[#101D26] px-3 py-2 text-xs font-bold text-[var(--color-text)] dark:text-[#F8FAFC]"
                  >
                    <option value="boy">{isEn ? 'Boy 👦🏻' : 'ولد 👦🏻'}</option>
                    <option value="girl">{isEn ? 'Girl 👧🏻' : 'بنت 👧🏻'}</option>
                  </select>

                  <button
                    type="button"
                    data-testid="onboarding-add-child-btn"
                    onClick={handleAddDraftChild}
                    className="px-3.5 py-2 rounded-xl text-xs font-extrabold bg-[#0d9488] hover:bg-[#0f766e] text-white transition cursor-pointer shrink-0"
                  >
                    {isEn ? '+ Add' : '+ إضافة'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================
            STEP 4: APP DASHBOARD ENTRY (SUMMARY & LIVE DATA HYDRATION)
            =================================================================== */}
        {step === 4 && (
          <div data-testid="onboarding-step-4-summary" className="space-y-4">
            <div className="rounded-3xl border-2 border-[#0d9488]/40 bg-gradient-to-br from-teal-50/90 via-white to-orange-50/60 dark:from-[#142430] dark:via-[#101D26] dark:to-[#142430] p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#0d9488] text-white flex items-center justify-center text-2xl shadow-sm">
                  🎉
                </div>
                <div>
                  <h3 className="text-base font-black text-[var(--color-text)] dark:text-[#F8FAFC]">
                    {isEn
                      ? `Welcome to Nekbaar, ${parentName}!`
                      : `أهلاً بك في مساحة عائلتك «نكبر»، ${parentName}!`}
                  </h3>
                  <p className="text-xs font-semibold text-[var(--color-muted)] dark:text-[#CBD5E1]">
                    {isEn
                      ? 'Your account, region, and children profiles are synced with Supabase and ready.'
                      : 'تم ربط حسابك، ومنطقتك، وملفات أطفالك بقاعدة بيانات Supabase بنجاح.'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                <div className="rounded-2xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-surface)] dark:bg-[#101D26] p-3 space-y-1">
                  <div className="text-[11px] font-bold text-[var(--color-muted)]">
                    {isEn ? 'Authenticated Account' : 'الحساب الموثق'}
                  </div>
                  <div className="font-black text-[var(--color-text)] dark:text-[#F8FAFC]">
                    {parentName}
                  </div>
                  <div className="text-[11px] text-[#0d9488] dark:text-[#2DD4BF] truncate" dir="ltr">
                    {email}
                  </div>
                </div>

                <div className="rounded-2xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-surface)] dark:bg-[#101D26] p-3 space-y-1">
                  <div className="text-[11px] font-bold text-[var(--color-muted)]">
                    {isEn ? 'Region & Currency' : 'المنطقة والعملة'}
                  </div>
                  <div className="font-black text-[var(--color-text)] dark:text-[#F8FAFC]">
                    📍 {selectedCity} ({selectedCountry})
                  </div>
                  <div className="text-[11px] text-[#0d9488] dark:text-[#2DD4BF]">
                    {getSuggestedCurrencyForCountry(selectedCountry)} · Family #{familyId}
                  </div>
                </div>

                <div className="rounded-2xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-surface)] dark:bg-[#101D26] p-3 space-y-1">
                  <div className="text-[11px] font-bold text-[var(--color-muted)]">
                    {isEn ? 'Synced Children Profiles' : 'ملفات الأطفال المتزامنة'}
                  </div>
                  <div className="font-black text-[var(--color-text)] dark:text-[#F8FAFC]">
                    {childrenList.map((c) => c.name).join(isEn ? ', ' : '، ')}
                  </div>
                  <div className="text-[11px] text-emerald-700 dark:text-emerald-300">
                    ✓ {childrenList.length} {isEn ? 'linked to children table' : 'في جدول الأطفال'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sequential Back / Next Footer Controls */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-[var(--color-border)] dark:border-[#1E3646]">
          <div className="text-[11px] font-bold text-[var(--color-muted)]">
            {isSavingStep
              ? isEn
                ? '⏳ Saving step to Supabase...'
                : '⏳ جاري حفظ الخطوة في قاعدة بيانات Supabase...'
              : isEn
              ? `Step ${step} of 4 · Progressive Supabase Sync`
              : `الخطوة ${step} من 4 · حفظ تدريجي مباشر في Supabase`}
          </div>

          <div className="flex items-center gap-2">
            {step > 1 && (
              <button
                type="button"
                data-testid="onboarding-back-btn"
                disabled={isSavingStep}
                onClick={handlePreviousStep}
                className="px-4 py-2 rounded-xl text-xs font-extrabold border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-muted)] dark:bg-[#142430] text-[var(--color-text)] dark:text-[#F8FAFC] hover:border-[#0d9488] transition cursor-pointer disabled:opacity-50"
              >
                {isEn ? '← Back' : '→ السابق'}
              </button>
            )}

            <button
              type="button"
              data-testid="onboarding-next-btn"
              disabled={isSavingStep}
              onClick={handleNextStep}
              className="px-5 py-2.5 rounded-xl text-xs font-black bg-[#0d9488] hover:bg-[#0f766e] text-white shadow-xs transition cursor-pointer disabled:opacity-60 whitespace-nowrap"
            >
              {isSavingStep
                ? isEn
                  ? 'Saving...'
                  : 'جاري الحفظ...'
                : step < 4
                ? isEn
                  ? 'Next Step →'
                  : 'الخطوة التالية ←'
                : isEn
                ? '🚀 Enter Family Dashboard'
                : '🚀 الدخول إلى لوحة العائلة'}
            </button>
          </div>
        </div>

        {/* Bottom Copyright Ownership */}
        <div
          data-testid="onboarding-login-bottom-copyright"
          className="pt-1 text-center text-[11px] font-bold text-[var(--color-muted)] opacity-85"
        >
          {isEn
            ? 'نكبر (Nekbaar) © 2026 — All Intellectual Property & Copyright Reserved'
            : 'نكبر (Nekbaar) © 2026 — جميع حقوق الملكية الفكرية محفوظة'}
        </div>
      </div>
    </div>
  );
};

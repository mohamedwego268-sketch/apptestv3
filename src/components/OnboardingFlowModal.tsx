import React, { useEffect, useState } from 'react';
import {
  COUNTRY_CITIES_MAP,
  CountryCode,
  CurrencyCode,
  DEMO_OTP_CODE,
  LanguageCode,
  ParentThemeRole,
  calculateChildAge,
  getSuggestedCurrencyForCountry,
  validateChildInput,
  validatePhoneForCountry,
} from '../domain/familySpaceCore';
import { AvatarAccessoryTheme } from '../domain/assetManifest3D';
import {
  AuthProviderType,
  CoParentPairingMethod,
  SHARED_FAMILY_ID,
  authenticateParentWithSupabase,
  bindPhoneAndFinalizeAuthInSupabase,
  generateFamilyPairingToken,
  initiateGatewayEmailOrOAuthInSupabase,
  linkCoParentAccountInSupabase,
  saveOnboardingChildrenToSupabase,
  saveOnboardingLocationToSupabase,
  verifyGatewayEmailOtpInSupabase,
} from '../services/supabaseService';
import {
  INITIAL_CANONICAL_ONBOARDING_CHILDREN,
  OnboardingChildDraftItem,
  OnboardingDraftData,
  OnboardingFlowController,
  OnboardingStep,
  UserSessionProfile,
  VerificationChannel,
} from '../services/OnboardingFlowController';
import { ThreeDChildAvatar } from './ThreeDVisuals';

export const NEKBAAR_ONBOARDING_CACHE_KEY = OnboardingFlowController.DRAFT_KEY;

export type OnboardingChildDraft = OnboardingChildDraftItem;
export type OnboardingCachedState = OnboardingDraftData;

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

const WIZARD_STEPS_META: Array<{
  num: 1 | 2 | 3 | 4 | 5;
  stepKey: OnboardingStep;
  icon: string;
  labelAr: string;
  labelEn: string;
}> = [
  {
    num: 1,
    stepKey: 'LOCATION',
    icon: '📍',
    labelAr: '1. الدولة والمدينة',
    labelEn: '1. Country & City',
  },
  {
    num: 2,
    stepKey: 'CREDENTIALS',
    icon: '🔐',
    labelAr: '2. بيانات الحساب',
    labelEn: '2. Account Credentials',
  },
  {
    num: 3,
    stepKey: 'VERIFY_METHOD',
    icon: '📲',
    labelAr: '3. طريقة التحقق',
    labelEn: '3. Verification Method',
  },
  {
    num: 4,
    stepKey: 'CHILDREN',
    icon: '👶🏻',
    labelAr: '4. ملفات الأطفال',
    labelEn: '4. Children Profiles',
  },
  {
    num: 5,
    stepKey: 'CO_PARENT',
    icon: '🤝',
    labelAr: '5. ربط الشريك',
    labelEn: '5. Co-Parent Link',
  },
];

export type EntryGatewayFlowMode = 'GATEWAY' | 'AUTH_PIPELINE' | 'WIZARD';
export type GatewayAuthSubStep = 'STEP_A_IDENTITY' | 'STEP_B_EMAIL_OTP' | 'STEP_C_PHONE_LINK';

/**
 * Generates a deterministic 15x15 QR Code matrix with 3 standard finder patterns
 * from a secure family pairing token string.
 */
function buildDeterministicQrMatrix(token: string): boolean[][] {
  const size = 15;
  const grid: boolean[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => false)
  );

  const drawFinder = (r0: number, c0: number) => {
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        const isBorder = r === 0 || r === 4 || c === 0 || c === 4;
        const isCenter = r === 2 && c === 2;
        grid[r0 + r][c0 + c] = isBorder || isCenter;
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(0, size - 5);
  drawFinder(size - 5, 0);

  let hash = 2166136261;
  const safeToken = token || 'NEKBAAR-FAM-1-SECURE';
  for (let i = 0; i < safeToken.length; i++) {
    hash ^= safeToken.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const inTopLeft = r < 6 && c < 6;
      const inTopRight = r < 6 && c >= size - 6;
      const inBottomLeft = r >= size - 6 && c < 6;
      if (inTopLeft || inTopRight || inBottomLeft) continue;

      const bitSeed = Math.abs(hash ^ ((r * 31 + c * 17 + safeToken.length * 13) * 2654435761));
      grid[r][c] = bitSeed % 2 === 0;
    }
  }

  return grid;
}

export const OnboardingFlowModal: React.FC<OnboardingFlowModalProps> = ({
  isOpen,
  isMandatoryGateway = false,
  initialCountry,
  initialCity,
  initialParentName,
  initialRole,
  language,
  onClose,
  onCompleteOnboarding,
}) => {
  const isEn = language === 'en';
  const cachedDraft = React.useMemo(() => OnboardingFlowController.loadDraft(), []);

  // Mandatory Landing Flow Mode: starts at the Auth Gateway ('GATEWAY') as the absolute first screen
  // for unauthenticated visitors, with two main actions:
  // 1) "تسجيل دخول (لديك حساب مسبق)"
  // 2) "إنشاء حساب جديد"
  const [flowMode, setFlowMode] = useState<EntryGatewayFlowMode>('GATEWAY');
  const [gatewayAuthIntent, setGatewayAuthIntent] = useState<'signin' | 'signup'>('signin');
  const [authSubStep, setAuthSubStep] = useState<GatewayAuthSubStep>('STEP_A_IDENTITY');
  const [selectedProvider, setSelectedProvider] = useState<AuthProviderType>('email');
  const [usePasswordInStepA, setUsePasswordInStepA] = useState<boolean>(true);
  const [gatewayEmail, setGatewayEmail] = useState<string>(
    cachedDraft?.email || 'maryam.mom@nekbaar.app'
  );
  const [gatewayPassword, setGatewayPassword] = useState<string>('Nekbaar#2026');
  const [gatewayEmailOtp, setGatewayEmailOtp] = useState<string>(DEMO_OTP_CODE);
  const [gatewayEmailVerified, setGatewayEmailVerified] = useState<boolean>(false);
  const [gatewayPhone, setGatewayPhone] = useState<string>(
    cachedDraft?.phone || (initialCountry === 'SA' ? '551234567' : '1012345678')
  );
  const [gatewayResolvedUserId, setGatewayResolvedUserId] = useState<string>('');

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(cachedDraft?.stepNumber ?? 1);
  const [restoredFromCache, setRestoredFromCache] = useState<boolean>(Boolean(cachedDraft));
  const [isSavingStep, setIsSavingStep] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [canRetryFailedNetwork, setCanRetryFailedNetwork] = useState<boolean>(false);
  const [stepSyncNotice, setStepSyncNotice] = useState<string | null>(null);

  // Step 1: Location (Country & City first)
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(
    cachedDraft?.selectedCountry || initialCountry || 'SA'
  );
  const [selectedCity, setSelectedCity] = useState<string>(
    cachedDraft?.selectedCity || initialCity || 'الدمام'
  );
  const [isLoadingCities, setIsLoadingCities] = useState<boolean>(false);

  // Step 2: Credentials (Phone Number, Email, Parent Name & Role)
  const [authMode, setAuthMode] = useState<'signup' | 'signin'>(
    cachedDraft?.authMode ?? 'signup'
  );
  const [parentRole, setParentRole] = useState<ParentThemeRole>(
    cachedDraft?.parentRole ?? (initialRole === 'dad' ? 'dad' : 'mom')
  );
  const [parentName, setParentName] = useState<string>(
    cachedDraft?.parentName ||
      initialParentName ||
      (initialRole === 'dad' ? 'أحمد (الأب)' : 'مريم (الأم)')
  );
  const [email, setEmail] = useState<string>(
    cachedDraft?.email ||
      (initialRole === 'dad' ? 'ahmad.dad@nekbaar.app' : 'maryam.mom@nekbaar.app')
  );
  const [password, setPassword] = useState<string>('Nekbaar#2026');
  const [phone, setPhone] = useState<string>(
    cachedDraft?.phone || (initialCountry === 'SA' ? '551234567' : '1012345678')
  );
  const [familyId, setFamilyId] = useState<number>(
    cachedDraft?.familyId ?? SHARED_FAMILY_ID
  );

  // Step 3: Verification Method (OTP via SMS on Phone vs. via Email)
  const [verificationChannel, setVerificationChannel] = useState<VerificationChannel>(
    cachedDraft?.verificationChannel ?? 'sms'
  );
  const [otpCode, setOtpCode] = useState<string>(cachedDraft?.otpCode || DEMO_OTP_CODE);
  const [isOtpVerified, setIsOtpVerified] = useState<boolean>(
    cachedDraft?.isOtpVerified ?? true
  );
  const [otpSentBanner, setOtpSentBanner] = useState<boolean>(true);

  // Step 4: Children Setup (Must add at least ONE child to proceed and unlock app features)
  const [childrenList, setChildrenList] = useState<OnboardingChildDraft[]>(() =>
    OnboardingFlowController.sanitizeChildrenList(cachedDraft?.childrenList)
  );
  const [newChildName, setNewChildName] = useState<string>('');
  const [newChildGender, setNewChildGender] = useState<'boy' | 'girl'>('boy');
  const [newChildStage, setNewChildStage] =
    useState<OnboardingChildDraft['ageStagePreset']>('infant_6m');
  const [newChildBirth, setNewChildBirth] = useState<string>('2026-04-20');
  const [newChildInterests, setNewChildInterests] = useState<string>(
    'وقت البطن الحسي، الألعاب الخشبية، والقصص المصورة'
  );
  const [newChildAvatarTheme] = useState<AvatarAccessoryTheme>('astronaut');

  // Step 5: Co-Parent Linking (Method A: Phone OTP & Method B: QR Code Pairing — Optional & Skippable)
  const [coParentName, setCoParentName] = useState<string>(
    cachedDraft?.coParentName ||
      (parentRole === 'dad' ? 'مريم (الأم)' : 'أحمد (الأب)')
  );
  const [coParentEmail, setCoParentEmail] = useState<string>(
    cachedDraft?.coParentEmail ||
      (parentRole === 'dad' ? 'maryam.mom@nekbaar.app' : 'ahmad.dad@nekbaar.app')
  );
  const [coParentPhone, setCoParentPhone] = useState<string>(
    cachedDraft?.coParentPhone || '559876543'
  );
  const [isCoParentLinked, setIsCoParentLinked] = useState<boolean>(
    cachedDraft?.isCoParentLinked ?? true
  );
  const [coParentMethod, setCoParentMethod] = useState<CoParentPairingMethod>('phone_otp');
  const [coParentOtpSent, setCoParentOtpSent] = useState<boolean>(false);
  const [coParentOtpCode, setCoParentOtpCode] = useState<string>(DEMO_OTP_CODE);
  const [coParentOtpVerified, setCoParentOtpVerified] = useState<boolean>(false);
  const [qrTokenNonce, setQrTokenNonce] = useState<number>(0);
  const [qrScanInputToken, setQrScanInputToken] = useState<string>('');
  const [isQrPairedSuccess, setIsQrPairedSuccess] = useState<boolean>(false);

  const familyPairingToken = React.useMemo(
    () =>
      generateFamilyPairingToken(
        familyId,
        `${coParentPhone}${qrTokenNonce > 0 ? String(qrTokenNonce) : ''}`
      ),
    [familyId, coParentPhone, qrTokenNonce]
  );

  const qrMatrix = React.useMemo(
    () => buildDeterministicQrMatrix(familyPairingToken),
    [familyPairingToken]
  );

  const safeChildrenList = React.useMemo(
    () => OnboardingFlowController.sanitizeChildrenList(childrenList),
    [childrenList]
  );

  const availableCities = COUNTRY_CITIES_MAP[selectedCountry] || [];

  // Automatic localStorage Draft Persistence on every step & input change (Refresh F5 Protection)
  useEffect(() => {
    const stepKey = OnboardingFlowController.numberToStep(step);
    OnboardingFlowController.saveDraft(stepKey, {
      currentStep: stepKey,
      stepNumber: step,
      authMode,
      parentRole,
      parentName,
      email,
      phone,
      familyId,
      selectedCountry,
      selectedCity,
      verificationChannel,
      otpCode,
      isOtpVerified,
      childrenList,
      coParentName,
      coParentEmail,
      coParentPhone,
      isCoParentLinked,
    });
  }, [
    step,
    authMode,
    parentRole,
    parentName,
    email,
    phone,
    familyId,
    selectedCountry,
    selectedCity,
    verificationChannel,
    otpCode,
    isOtpVerified,
    childrenList,
    coParentName,
    coParentEmail,
    coParentPhone,
    isCoParentLinked,
  ]);

  useEffect(() => {
    if (!isOpen) return;
    setErrorMsg(null);
    setCanRetryFailedNetwork(false);
  }, [isOpen, step]);

  if (!isOpen) return null;

  const buildCurrentUserSessionProfile = (
    coParentLinkedOverride?: boolean
  ): UserSessionProfile => {
    const cleanName =
      parentName.trim() || (parentRole === 'dad' ? 'أحمد (الأب)' : 'مريم (الأم)');
    return {
      userId: `usr-${parentRole}-${familyId}`,
      familyId: String(familyId),
      fullName: cleanName,
      role: parentRole,
      email: email.trim() || 'maryam.mom@nekbaar.app',
      phone: phone.trim() || '551234567',
      city: selectedCity || 'الدمام',
      country: selectedCountry,
      childrenCount: Math.max(1, childrenList.length),
      isCoParentLinked: coParentLinkedOverride ?? isCoParentLinked,
      verificationChannel,
      coParentName: coParentName.trim(),
      coParentEmail: coParentEmail.trim(),
      coParentPhone: coParentPhone.trim(),
      updatedAt: new Date().toISOString(),
    };
  };

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
    }, 120);
  };

  const handleStagePresetChange = (preset: OnboardingChildDraft['ageStagePreset']) => {
    setNewChildStage(preset);
    if (preset === 'infant_6m') {
      setNewChildBirth('2026-04-20');
      setNewChildInterests(
        'وقت البطن الحسي، تتبع الخشخيشة الخشبية، والمناغاة التفاعلية'
      );
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
        validation.error ||
          (isEn ? 'Invalid child birth date.' : 'تاريخ ميلاد الطفل غير صالح.')
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
          ? 'Constraint: You must keep at least ONE child profile to unlock app features.'
          : 'شرط أساسي: يجب وجود ملف طفل واحد على الأقل لتفعيل ميزات التطبيق.'
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

  /**
   * Finalizes onboarding (either by linking Co-Parent in Step 5 or clicking "تخطي مؤقت / إكمال لاحقاً" on Step 5),
   * persists the permanent user session, and routes to `/dashboard`.
   */
  const finalizeAndRouteToDashboard = (options: {
    skippedCoParent: boolean;
    skippedForLater?: boolean;
  }) => {
    const finalSession = buildCurrentUserSessionProfile(!options.skippedCoParent);
    OnboardingFlowController.persistUserSession(
      finalSession,
      !options.skippedForLater
    );

    const primaryChild =
      childrenList[0] || INITIAL_CANONICAL_ONBOARDING_CHILDREN[0];

    onCompleteOnboarding({
      parentName: finalSession.fullName,
      role: parentRole,
      country: selectedCountry,
      city: selectedCity || 'الدمام',
      currency: getSuggestedCurrencyForCountry(selectedCountry),
      phoneNumber: finalSession.phone,
      email: finalSession.email,
      childProfile: {
        name: primaryChild.name,
        gender: primaryChild.gender,
        birth: primaryChild.birth,
        interests: primaryChild.interests,
        avatarTheme: primaryChild.avatarTheme,
      },
      childrenProfiles: childrenList,
      skippedForLater: Boolean(options.skippedForLater),
      isCoParentLinked: !options.skippedCoParent,
      coParentName: coParentName.trim(),
      coParentEmail: coParentEmail.trim(),
      coParentPhone: coParentPhone.trim(),
      verificationChannel,
      persistedSession: finalSession,
    });
  };

  /**
   * Sequential Step Progression (Steps 1 -> 2 -> 3 -> 4 -> 5 -> Dashboard)
   */
  const handleNextStep = async () => {
    setErrorMsg(null);
    setCanRetryFailedNetwork(false);
    setStepSyncNotice(null);

    // =========================================================================
    // STEP 1 (LOCATION): Select Country and City first -> Save to draft & DB
    // =========================================================================
    if (step === 1) {
      if (!selectedCity.trim()) {
        setErrorMsg(
          isEn
            ? 'Please select your Country and City to continue.'
            : 'يرجى اختيار الدولة والمدينة أولاً للمتابعة.'
        );
        return;
      }

      OnboardingFlowController.saveDraft('CREDENTIALS', {
        selectedCountry,
        selectedCity,
        stepNumber: 2,
      });

      setIsSavingStep(true);
      const locRes = await saveOnboardingLocationToSupabase({
        familyId,
        familyName: 'أسرة أحمد ومريم — نكبر',
        country: selectedCountry,
        city: selectedCity,
        currency: getSuggestedCurrencyForCountry(selectedCountry),
        activeParent: parentRole === 'dad' ? 'father' : 'mother',
      });
      setIsSavingStep(false);

      if (locRes.error && locRes.error.includes('SUPABASE_TIMEOUT')) {
        setCanRetryFailedNetwork(true);
      }

      setStepSyncNotice(
        isEn
          ? `Step 1 Saved: Location set to ${selectedCity} (${selectedCountry}).`
          : `تم حفظ الخطوة ١: تم تحديد الموقع (${selectedCity} - ${
              selectedCountry === 'SA' ? 'السعودية' : 'مصر'
            }) في المسودة.`
      );
      setStep(2);
      return;
    }

    // =========================================================================
    // STEP 2 (CREDENTIALS): Enter Phone Number and Email -> Save to draft & Auth
    // =========================================================================
    if (step === 2) {
      if (!parentName.trim()) {
        setErrorMsg(
          isEn
            ? 'Please enter your display name.'
            : 'يرجى إدخال اسم الوالد أو الوالدة.'
        );
        return;
      }
      if (!email.trim() || !email.includes('@')) {
        setErrorMsg(
          isEn
            ? 'Please enter a valid email address.'
            : 'يرجى إدخال بريد إلكتروني صحيح.'
        );
        return;
      }
      const phoneCheck = validatePhoneForCountry(phone, selectedCountry);
      if (!phoneCheck.valid) {
        setErrorMsg(
          isEn
            ? phoneCheck.errorEn || 'Invalid mobile phone number.'
            : phoneCheck.errorAr || 'رقم الجوال غير صالح للدولة المختارة.'
        );
        return;
      }

      OnboardingFlowController.saveDraft('VERIFY_METHOD', {
        parentName: parentName.trim(),
        parentRole,
        email: email.trim(),
        phone: phoneCheck.normalized,
        stepNumber: 3,
      });

      setIsSavingStep(true);
      const authRes = await authenticateParentWithSupabase({
        mode: authMode,
        email: email.trim(),
        password: password || 'Nekbaar#2026',
        phone: phoneCheck.normalized,
        parentName: parentName.trim(),
        role: parentRole === 'dad' ? 'father' : 'mother',
        country: selectedCountry,
      });
      setIsSavingStep(false);

      setFamilyId(authRes.familyId);
      setOtpSentBanner(true);

      setStepSyncNotice(
        isEn
          ? `Step 2 Saved: Credentials saved for ${parentName.trim()}. Choose verification method.`
          : `تم حفظ الخطوة ٢: تم حفظ رقم الجوال والبريد الإلكتروني لـ ${parentName.trim()}. اختر قناة التحقق.`
      );
      setStep(3);
      return;
    }

    // =========================================================================
    // STEP 3 (VERIFY_METHOD): Choose OTP via SMS on Phone vs. via Email
    // =========================================================================
    if (step === 3) {
      if (otpCode.trim().length < 4) {
        setErrorMsg(
          isEn
            ? `Please enter the 4-digit verification code (Demo code: ${DEMO_OTP_CODE}).`
            : `يرجى إدخال رمز التحقق المكون من ٤ أرقام (الرمز التجريبي: ${DEMO_OTP_CODE}).`
        );
        return;
      }

      setIsOtpVerified(true);
      OnboardingFlowController.saveDraft('CHILDREN', {
        verificationChannel,
        otpCode: otpCode.trim(),
        isOtpVerified: true,
        stepNumber: 4,
      });

      setStepSyncNotice(
        isEn
          ? `Step 3 Verified via ${
              verificationChannel === 'sms' ? 'SMS on Phone' : 'Email'
            }. Now confirm your children profiles.`
          : `تم التحقق بنجاح عبر ${
              verificationChannel === 'sms'
                ? 'رسالة نصية SMS على الجوال'
                : 'البريد الإلكتروني'
            }. أضف الآن ملف طفل واحد على الأقل.`
      );
      setStep(4);
      return;
    }

    // =========================================================================
    // STEP 4 (CHILDREN): Must add at least ONE child -> Persist permanent session!
    // =========================================================================
    if (step === 4) {
      if (childrenList.length < 1) {
        setErrorMsg(
          isEn
            ? 'Constraint: You must add at least ONE child profile to proceed and unlock app features.'
            : 'شرط أساسي: يجب إضافة ملف طفل واحد على الأقل للمتابعة وفتح ميزات التطبيق.'
        );
        return;
      }

      for (const childItem of childrenList) {
        const check = validateChildInput({
          name: childItem.name,
          birth: childItem.birth,
        });
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
      const kidsRes = await saveOnboardingChildrenToSupabase({
        familyId,
        childrenList,
      });
      setIsSavingStep(false);

      if (kidsRes.error && kidsRes.error.includes('SUPABASE_TIMEOUT')) {
        setCanRetryFailedNetwork(true);
      }

      // Requirement 3: Upon completing Step 4 (at least 1 child), persist the user session permanently
      // to localStorage (`nekbaar_user_persistence_v2`) and Supabase so future app launches bypass onboarding!
      const permanentProfile = buildCurrentUserSessionProfile(isCoParentLinked);
      OnboardingFlowController.persistUserSession(permanentProfile, false);
      OnboardingFlowController.saveDraft('CO_PARENT', {
        childrenList,
        stepNumber: 5,
      });

      setStepSyncNotice(
        isEn
          ? `Step 4 Complete: ${childrenList.length} child profile(s) saved & permanent session activated! Step 5 (Co-Parent) is optional.`
          : `تم إتمام الخطوة ٤ بنجاح: تم حفظ ${childrenList.length} أطفال وتثبيت جلستك الدائمة على الجهاز! الخطوة ٥ (ربط الشريك) اختيارية.`
      );
      setStep(5);
      return;
    }

    // =========================================================================
    // STEP 5 (CO_PARENT): Link partner/mother account via OTP or QR Code -> Dashboard
    // =========================================================================
    if (step === 5) {
      if (coParentMethod === 'phone_otp') {
        if (!coParentPhone.trim() || coParentPhone.trim().length < 7) {
          setErrorMsg(
            isEn
              ? 'Please enter the partner’s mobile phone number or click Skip for Later.'
              : 'يرجى إدخال رقم جوال الشريك للربط عبر رمز التحقق OTP أو اختيار «تخطي مؤقت».'
          );
          return;
        }
        if (coParentOtpCode.trim().length < 4) {
          setErrorMsg(
            isEn
              ? `Please enter the 4-digit partner OTP code (${DEMO_OTP_CODE}).`
              : `يرجى إدخال رمز التحقق المكون من ٤ أرقام المرسل لجوال الشريك (${DEMO_OTP_CODE}).`
          );
          return;
        }
      }

      setIsSavingStep(true);
      await linkCoParentAccountInSupabase({
        familyId,
        partnerRole: parentRole === 'dad' ? 'mother' : 'father',
        partnerName:
          coParentName.trim() ||
          (parentRole === 'dad' ? 'مريم (الأم)' : 'أحمد (الأب)'),
        partnerPhone: coParentPhone.trim() || '559876543',
        partnerEmail:
          coParentEmail.trim() ||
          (parentRole === 'dad' ? 'maryam.mom@nekbaar.app' : 'ahmad.dad@nekbaar.app'),
        country: selectedCountry,
        method: coParentMethod,
        otpCode: coParentOtpCode.trim(),
        pairingToken: qrScanInputToken.trim() || familyPairingToken,
      });
      setIsSavingStep(false);

      setIsCoParentLinked(true);
      finalizeAndRouteToDashboard({
        skippedCoParent: false,
        skippedForLater: false,
      });
    }
  };

  const handlePreviousStep = () => {
    setErrorMsg(null);
    setCanRetryFailedNetwork(false);
    setStepSyncNotice(null);
    if (step > 1) {
      setStep((prev) => (prev - 1) as 1 | 2 | 3 | 4 | 5);
    }
  };

  /**
   * Step A Handler (Email / Password or Google OAuth / Apple Sign-In):
   * Validates or resolves email, triggers OAuth or Email OTP in Supabase, and advances to Step B (Email OTP verification).
   */
  const handleStepASubmit = async (providerOverride?: AuthProviderType) => {
    setErrorMsg(null);
    setStepSyncNotice(null);
    const activeProvider: AuthProviderType = providerOverride || selectedProvider || 'email';
    setSelectedProvider(activeProvider);

    let resolvedEmail = gatewayEmail.trim();
    if (activeProvider === 'google' && (!resolvedEmail || !resolvedEmail.includes('@'))) {
      resolvedEmail =
        parentRole === 'dad' ? 'ahmad.dad@gmail.com' : 'maryam.mom@gmail.com';
      setGatewayEmail(resolvedEmail);
    } else if (activeProvider === 'apple' && (!resolvedEmail || !resolvedEmail.includes('@'))) {
      resolvedEmail =
        parentRole === 'dad' ? 'ahmad.dad@icloud.com' : 'maryam.mom@icloud.com';
      setGatewayEmail(resolvedEmail);
    }

    if (!resolvedEmail || !resolvedEmail.includes('@')) {
      setErrorMsg(
        isEn
          ? 'Please enter a valid email address to receive your verification code.'
          : 'يرجى إدخال بريد إلكتروني صحيح لاستلام رمز التحقق الفوري.'
      );
      return;
    }

    if (
      activeProvider === 'email' &&
      usePasswordInStepA &&
      gatewayPassword.trim().length < 4
    ) {
      setErrorMsg(
        isEn
          ? 'Please enter a valid password (at least 4 characters).'
          : 'يرجى إدخال كلمة مرور صالحة (٤ أحرف على الأقل).'
      );
      return;
    }

    const lowerEmail = resolvedEmail.toLowerCase();
    const isDadAccount =
      parentRole === 'dad' ||
      lowerEmail.includes('ahmad') ||
      lowerEmail.includes('ahmed');
    const resolvedName =
      parentName.trim() || (isDadAccount ? 'أحمد (الأب)' : 'مريم (الأم)');

    setEmail(resolvedEmail);
    setParentName(resolvedName);
    setParentRole(isDadAccount ? 'dad' : 'mom');

    setIsSavingStep(true);
    const stepARes = await initiateGatewayEmailOrOAuthInSupabase({
      provider: activeProvider,
      mode: gatewayAuthIntent,
      email: resolvedEmail,
      password: usePasswordInStepA ? gatewayPassword : 'Nekbaar#2026',
      parentName: resolvedName,
      role: isDadAccount ? 'father' : 'mother',
      country: selectedCountry,
    });
    setIsSavingStep(false);

    if (stepARes.userId) {
      setGatewayResolvedUserId(stepARes.userId);
    }
    setGatewayEmailOtp(stepARes.demoOtpCode || DEMO_OTP_CODE);
    setAuthSubStep('STEP_B_EMAIL_OTP');
    setStepSyncNotice(
      activeProvider === 'google'
        ? isEn
          ? `Google account connected (${resolvedEmail}). Instant verification code sent to your email.`
          : `تم الاتصال بحساب Google (${resolvedEmail}) وإرسال رمز التحقق الفوري إلى بريدك الإلكتروني.`
        : activeProvider === 'apple'
        ? isEn
          ? `Apple ID connected (${resolvedEmail}). Instant verification code sent to your email.`
          : `تم الاتصال بحساب Apple (${resolvedEmail}) وإرسال رمز التحقق الفوري إلى بريدك الإلكتروني.`
        : isEn
        ? `Verification code sent to ${resolvedEmail}. Please confirm the code in Step B.`
        : `تم إرسال رمز التحقق الفوري (OTP) إلى بريدك الإلكتروني (${resolvedEmail}).`
    );
  };

  /**
   * Step B Handler (Email OTP Verification):
   * Verifies the OTP code sent to the user's email and advances immediately to Step C ("ربط وتوثيق رقم الجوال").
   */
  const handleStepBVerifyEmailOtp = async () => {
    setErrorMsg(null);
    setStepSyncNotice(null);

    if (gatewayEmailOtp.trim().length < 4) {
      setErrorMsg(
        isEn
          ? `Please enter the 4-digit email verification code (Instant code: ${DEMO_OTP_CODE}).`
          : `يرجى إدخال رمز التحقق المرسل للبريد الإلكتروني (الرمز الفوري: ${DEMO_OTP_CODE}).`
      );
      return;
    }

    setIsSavingStep(true);
    const verifyRes = await verifyGatewayEmailOtpInSupabase({
      email: gatewayEmail.trim(),
      otpCode: gatewayEmailOtp.trim(),
    });
    setIsSavingStep(false);

    if (!verifyRes.verified) {
      setErrorMsg(
        verifyRes.error ||
          (isEn
            ? 'Invalid verification code. Please try again.'
            : 'رمز التحقق غير صحيح. يرجى المحاولة مرة أخرى.')
      );
      return;
    }

    if (verifyRes.userId) {
      setGatewayResolvedUserId(verifyRes.userId);
    }

    setGatewayEmailVerified(true);
    setIsOtpVerified(true);
    setAuthSubStep('STEP_C_PHONE_LINK');
    setStepSyncNotice(
      isEn
        ? `Email (${gatewayEmail.trim()}) verified! Now complete Step C: Link & verify your mobile number for co-parent pairing.`
        : `تم توثيق البريد الإلكتروني (${gatewayEmail.trim()}) بنجاح! انتقلنا للخطوة (ج): ربط وتوثيق رقم الجوال.`
    );
  };

  /**
   * Step C Handler ("ربط وتوثيق رقم الجوال" — Phone Linking & Co-Parent Prep):
   * Validates and binds the user's primary mobile number, syncs with Supabase `users` & `families`
   * (`auth.uid() = id`, `family_id = 1`), permanently persists the session in `localStorage`,
   * and either enters the Dashboard directly or continues to the 5-step customization wizard.
   */
  const handleStepCCompletePhoneBinding = async (options?: {
    openCustomizationWizard?: boolean;
  }) => {
    setErrorMsg(null);
    setStepSyncNotice(null);

    const phoneValidation = validatePhoneForCountry(gatewayPhone, selectedCountry);
    if (!phoneValidation.valid) {
      setErrorMsg(
        isEn
          ? phoneValidation.errorEn || 'Please enter a valid primary mobile phone number.'
          : phoneValidation.errorAr || 'يرجى إدخال رقم جوال أساسي صحيح للدولة المختارة.'
      );
      return;
    }

    const normalizedPhone = phoneValidation.normalized;
    setPhone(normalizedPhone);

    const lowerEmail = gatewayEmail.trim().toLowerCase();
    const isDadLogin =
      parentRole === 'dad' ||
      lowerEmail.includes('ahmad') ||
      lowerEmail.includes('ahmed') ||
      parentName.includes('أحمد');

    const resolvedRole: ParentThemeRole = isDadLogin ? 'dad' : 'mom';
    const resolvedName =
      parentName.trim() || (isDadLogin ? 'أحمد (الأب)' : 'مريم (الأم)');
    const resolvedEmail =
      gatewayEmail.trim() ||
      (isDadLogin ? 'ahmad.dad@nekbaar.app' : 'maryam.mom@nekbaar.app');

    setIsSavingStep(true);
    const authRes = await bindPhoneAndFinalizeAuthInSupabase({
      mode: gatewayAuthIntent,
      provider: selectedProvider,
      email: resolvedEmail,
      password: gatewayPassword || 'Nekbaar#2026',
      phone: normalizedPhone,
      parentName: resolvedName,
      role: isDadLogin ? 'father' : 'mother',
      country: selectedCountry,
      city: selectedCity || 'الدمام',
    });
    setIsSavingStep(false);

    const syncedSession: UserSessionProfile = {
      userId:
        authRes.userId ||
        gatewayResolvedUserId ||
        `usr-${resolvedRole}-${authRes.familyId || SHARED_FAMILY_ID}`,
      familyId: String(authRes.familyId || SHARED_FAMILY_ID),
      fullName: resolvedName,
      role: resolvedRole,
      email: resolvedEmail,
      phone: normalizedPhone,
      city: selectedCity || 'الدمام',
      country: selectedCountry,
      childrenCount: Math.max(1, safeChildrenList.length),
      isCoParentLinked: true,
      emailVerified: true,
      phoneVerified: true,
      authProvider: selectedProvider,
      verificationChannel: 'email',
      coParentName: isDadLogin ? 'مريم (الأم)' : 'أحمد (الأب)',
      coParentEmail: isDadLogin ? 'maryam.mom@nekbaar.app' : 'ahmad.dad@nekbaar.app',
      coParentPhone: coParentPhone || '559876543',
      updatedAt: new Date().toISOString(),
    };

    // Requirement 3: Once the user completes email verification and phone linking,
    // persist the session permanently in `localStorage` so future app launches bypass the gateway!
    OnboardingFlowController.persistUserSession(
      syncedSession,
      !options?.openCustomizationWizard
    );

    if (options?.openCustomizationWizard) {
      setStep(1);
      setFlowMode('WIZARD');
      setStepSyncNotice(
        isEn
          ? `Session permanently saved & phone (${normalizedPhone}) linked! You can now customize location, children, and co-parent settings.`
          : `تم توثيق الجوال (${normalizedPhone}) وتثبيت جلستك الدائمة بنجاح! يمكنك الآن تخصيص الموقع وملفات الأطفال والشريك.`
      );
      return;
    }

    const primaryChild =
      safeChildrenList[0] || INITIAL_CANONICAL_ONBOARDING_CHILDREN[0];

    onCompleteOnboarding({
      parentName: resolvedName,
      role: resolvedRole,
      country: selectedCountry,
      city: selectedCity || 'الدمام',
      currency: getSuggestedCurrencyForCountry(selectedCountry),
      phoneNumber: normalizedPhone,
      email: resolvedEmail,
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
      coParentName: syncedSession.coParentName,
      coParentEmail: syncedSession.coParentEmail,
      coParentPhone: syncedSession.coParentPhone,
      verificationChannel: 'email',
      persistedSession: syncedSession,
    });
  };

  return (
    <div
      dir={isEn ? 'ltr' : 'rtl'}
      data-testid="onboarding-gateway-backdrop"
      className="fixed inset-0 z-[110] bg-pattern flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-wizard-title"
    >
      {/* Subtle Decorative Arabesque Geometric SVG Pattern Exclusive to Entry & Onboarding */}
      <svg
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 w-full h-full opacity-20"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="nekbaar-arabesque-entry-pattern"
            width="64"
            height="64"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M32 0 L64 32 L32 64 L0 32 Z M32 12 L52 32 L32 52 L12 32 Z"
              fill="none"
              stroke="#2DD4BF"
              strokeWidth="0.8"
            />
            <circle cx="32" cy="32" r="3.5" fill="none" stroke="#FF8C61" strokeWidth="0.9" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#nekbaar-arabesque-entry-pattern)" />
      </svg>

      <div className="relative z-10 soft-card-surface w-full max-w-2xl rounded-3xl border border-teal-500/35 dark:border-[#1E3646] bg-[var(--color-surface)] dark:bg-[#101D26] p-4 sm:p-6 space-y-4 max-h-[92vh] overflow-y-auto shadow-2xl">
        {/* ===================================================================
            MODE 1: MANDATORY AUTH GATEWAY (LANDING SCREEN)
            =================================================================== */}
        {flowMode === 'GATEWAY' && (
          <div data-testid="welcome-auth-gateway-screen" className="space-y-5 py-1">
            {/* Top Brand Header */}
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-[var(--color-border)] dark:border-[#1E3646]">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0d9488] to-[#0f766e] text-white flex items-center justify-center text-2xl font-black shadow-md">
                  🌱
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-[#0d9488] dark:text-[#2DD4BF]">
                      {isEn ? 'Nekbaar Family Super App' : 'تطبيق العائلة الذكي — نكبر'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-teal-500/15 text-[#0d9488] dark:text-[#2DD4BF] text-[10px] font-black">
                      {isEn ? 'Secure Auth Gateway' : 'بوابة المصادقة الآمنة'}
                    </span>
                  </div>
                  <h2
                    id="onboarding-wizard-title"
                    className="text-base sm:text-xl font-black text-[var(--color-text)] dark:text-[#F8FAFC]"
                  >
                    {isEn
                      ? 'Welcome to Nekbaar Family Space'
                      : 'أهلاً بك في نكبر — بوابة الدخول الآمنة للعائلة'}
                  </h2>
                </div>
              </div>

              {!isMandatoryGateway && (
                <button
                  type="button"
                  onClick={onClose}
                  aria-label={isEn ? 'Close' : 'إغلاق'}
                  className="w-8 h-8 rounded-xl border border-[var(--color-border)] dark:border-[#1E3646] text-xs font-bold flex items-center justify-center hover:bg-teal-500/10 cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Greeting & Security Explanation Card */}
            <div className="rounded-2xl border border-teal-500/30 bg-gradient-to-br from-teal-500/10 via-transparent to-amber-500/10 p-4 sm:p-5 space-y-2">
              <p className="text-xs sm:text-sm font-bold text-[var(--color-text)] dark:text-[#F8FAFC] leading-relaxed">
                {isEn
                  ? 'Please sign in or create a new family account to access your children’s profiles (Hamza, Laila, Youssef), daily routines, bedtime stories, and instant co-parent sync.'
                  : 'يرجى تسجيل الدخول أو إنشاء حساب عائلي جديد للوصول إلى ملفات أطفالك (حمزة، ليلى، يوسف)، الروتين اليومي، قصص ما قبل النوم، والربط الفوري مع الشريك.'}
              </p>
              <div className="text-[11px] font-semibold text-[var(--color-muted)] dark:text-[#CBD5E1]">
                {isEn
                  ? 'Supports Google / Apple OAuth, instant Email OTP verification, and primary mobile binding:'
                  : 'يدعم الدخول عبر Google و Apple، رمز التحقق الفوري عبر البريد الإلكتروني (OTP)، وتوثيق رقم الجوال لربط الشريك:'}
              </div>
            </div>

            {/* Two Primary Main Action Buttons (Requirement 1) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Main Action 1: تسجيل دخول (لديك حساب مسبق) */}
              <button
                type="button"
                data-testid="gateway-login-btn"
                onClick={() => {
                  setErrorMsg(null);
                  setStepSyncNotice(null);
                  setGatewayAuthIntent('signin');
                  setAuthMode('signin');
                  setAuthSubStep('STEP_A_IDENTITY');
                  setFlowMode('AUTH_PIPELINE');
                }}
                className="group rounded-2xl border-2 border-[#0d9488] bg-white dark:bg-[#142430] hover:bg-teal-50/70 dark:hover:bg-[#182C3A] p-4 sm:p-5 text-start transition-all cursor-pointer shadow-sm flex flex-col justify-between gap-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="w-10 h-10 rounded-xl bg-teal-500/15 text-[#0d9488] dark:text-[#2DD4BF] flex items-center justify-center text-lg font-black">
                      🔑
                    </span>
                    <span className="text-xs font-extrabold text-[#0d9488] dark:text-[#2DD4BF]">
                      {isEn ? 'Existing Account →' : 'حساب مسجل ←'}
                    </span>
                  </div>
                  <div className="text-sm sm:text-base font-black text-gray-900 dark:text-[#F8FAFC]">
                    {isEn
                      ? 'Sign In (Already have an account)'
                      : 'تسجيل دخول (لديك حساب مسبق)'}
                  </div>
                  <p className="text-xs font-medium text-gray-600 dark:text-[#CBD5E1] leading-relaxed">
                    {isEn
                      ? 'Sign in with Google, Apple, or Email + instant OTP verification and phone binding.'
                      : 'الدخول عبر البريد الإلكتروني أو Google/Apple مع رمز التحقق الفوري وتوثيق الجوال.'}
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-200 dark:border-[#1E3646] text-xs font-extrabold text-[#0d9488] dark:text-[#2DD4BF]">
                  {isEn ? 'تسجيل دخول (لديك حساب مسبق) →' : 'تسجيل دخول (لديك حساب مسبق) ←'}
                </div>
              </button>

              {/* Main Action 2: إنشاء حساب جديد */}
              <button
                type="button"
                data-testid="gateway-register-btn"
                onClick={() => {
                  setErrorMsg(null);
                  setStepSyncNotice(null);
                  setGatewayAuthIntent('signup');
                  setAuthMode('signup');
                  setAuthSubStep('STEP_A_IDENTITY');
                  setFlowMode('AUTH_PIPELINE');
                }}
                className="group rounded-2xl border-2 border-[#0d9488] bg-[#0d9488] hover:bg-[#0f766e] text-white p-4 sm:p-5 text-start transition-all cursor-pointer shadow-md flex flex-col justify-between gap-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="w-10 h-10 rounded-xl bg-white/20 text-white flex items-center justify-center text-lg font-black">
                      🚀
                    </span>
                    <span className="text-xs font-extrabold text-teal-100">
                      {isEn ? 'New Family Account →' : 'حساب عائلي جديد ←'}
                    </span>
                  </div>
                  <div className="text-sm sm:text-base font-black text-white">
                    {isEn ? 'Create New Account' : 'إنشاء حساب جديد'}
                  </div>
                  <p className="text-xs font-medium text-teal-50/95 leading-relaxed">
                    {isEn
                      ? 'Register with Email or Google/Apple, verify Email OTP, and link your phone for instant co-parent pairing.'
                      : 'تسجيل حساب جديد بالبريد أو Google/Apple، تأكيد رمز البريد، وربط وتوثيق رقم الجوال للشريك.'}
                  </p>
                </div>
                <div className="pt-2 border-t border-white/25 text-xs font-extrabold text-white">
                  {isEn ? 'إنشاء حساب جديد →' : 'إنشاء حساب جديد ←'}
                </div>
              </button>
            </div>

            {/* Direct Quick OAuth Shortcuts (Google & Apple) */}
            <div className="rounded-2xl border border-slate-200 dark:border-[#1E3646] bg-white/80 dark:bg-[#142430]/75 p-3.5 space-y-2.5">
              <div className="text-[11px] font-extrabold text-gray-700 dark:text-[#CBD5E1] text-center">
                {isEn
                  ? 'Or continue instantly with your Google or Apple account:'
                  : 'أو المتابعة المباشرة السريعة باستخدام حساب Google أو Apple:'}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  data-testid="gateway-quick-google-btn"
                  onClick={() => {
                    setGatewayAuthIntent('signin');
                    setFlowMode('AUTH_PIPELINE');
                    void handleStepASubmit('google');
                  }}
                  className="min-h-[42px] rounded-xl border border-slate-300 dark:border-[#1E3646] bg-white hover:bg-slate-50 text-gray-900 px-3.5 py-2 text-xs font-black flex items-center justify-center gap-2 shadow-2xs transition cursor-pointer"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fill="#EA4335"
                      d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.8-5.5 3.8-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.4 14.6 2.5 12 2.5 6.8 2.5 2.5 6.8 2.5 12s4.3 9.5 9.5 9.5c5.5 0 9.1-3.9 9.1-9.3 0-.6-.1-1.1-.2-1.6H12z"
                    />
                  </svg>
                  <span className="text-gray-900 font-semibold">
                    {isEn ? 'Continue with Google' : 'المتابعة باستخدام Google'}
                  </span>
                </button>

                <button
                  type="button"
                  data-testid="gateway-quick-apple-btn"
                  onClick={() => {
                    setGatewayAuthIntent('signin');
                    setFlowMode('AUTH_PIPELINE');
                    void handleStepASubmit('apple');
                  }}
                  className="min-h-[42px] rounded-xl border border-slate-300 dark:border-[#1E3646] bg-white hover:bg-slate-50 text-gray-900 px-3.5 py-2 text-xs font-black flex items-center justify-center gap-2 shadow-2xs transition cursor-pointer"
                >
                  <span className="text-base leading-none text-gray-900" aria-hidden="true">
                    
                  </span>
                  <span className="text-gray-900 font-semibold">
                    {isEn ? 'Continue with Apple' : 'المتابعة باستخدام Apple'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================
            MODE 2: 3-STEP AUTHENTICATION & SIGNUP PIPELINE
            Step A (Email / Google / Apple) -> Step B (Email OTP) -> Step C (Phone Linking)
            =================================================================== */}
        {flowMode === 'AUTH_PIPELINE' && (
          <div data-testid="auth-pipeline-screen" className="space-y-4 py-1">
            {/* Top Header */}
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-[var(--color-border)] dark:border-[#1E3646]">
              <div>
                <div className="text-[11px] font-extrabold text-[#0d9488] dark:text-[#2DD4BF]">
                  {gatewayAuthIntent === 'signup'
                    ? isEn
                      ? 'New Family Account Registration'
                      : 'إنشاء حساب عائلي جديد — خطوات التوثيق المتدرجة'
                    : isEn
                    ? 'Existing Family Account Sign-In'
                    : 'تسجيل دخول (لديك حساب مسبق) — خطوات التوثيق الآمن'}
                </div>
                <h2
                  id="onboarding-wizard-title"
                  className="text-base sm:text-lg font-black text-[var(--color-text)] dark:text-[#F8FAFC]"
                >
                  {authSubStep === 'STEP_A_IDENTITY' &&
                    (gatewayAuthIntent === 'signup'
                      ? isEn
                        ? 'Step A: Create New Account (Email or Google/Apple)'
                        : 'الخطوة (أ): إنشاء حساب جديد (البريد أو Google / Apple)'
                      : isEn
                      ? 'Step A: Sign In (Email or Google/Apple)'
                      : 'الخطوة (أ): تسجيل دخول (البريد أو Google / Apple)')}
                  {authSubStep === 'STEP_B_EMAIL_OTP' &&
                    (isEn
                      ? 'Step B: Instant Email OTP Verification'
                      : 'الخطوة (ب): التحقق الفوري من البريد الإلكتروني (OTP)')}
                  {authSubStep === 'STEP_C_PHONE_LINK' &&
                    (isEn
                      ? 'Step C: ربط وتوثيق رقم الجوال (Phone Linking)'
                      : 'الخطوة (ج): ربط وتوثيق رقم الجوال')}
                </h2>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  data-testid="auth-pipeline-back-gateway-btn"
                  onClick={() => {
                    setErrorMsg(null);
                    setStepSyncNotice(null);
                    setFlowMode('GATEWAY');
                  }}
                  className="px-3 py-1.5 rounded-xl border border-[var(--color-border)] dark:border-[#1E3646] bg-white text-xs font-semibold text-gray-900 hover:border-[#0d9488] cursor-pointer"
                >
                  {isEn ? '← Auth Gateway' : '→ بوابة الدخول'}
                </button>
                {!isMandatoryGateway && (
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label={isEn ? 'Close' : 'إغلاق'}
                    className="w-8 h-8 rounded-xl border border-[var(--color-border)] dark:border-[#1E3646] text-xs font-bold flex items-center justify-center hover:bg-teal-500/10 cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Horizontal Scrollable 3-Step Auth Progress Bar (High Contrast, Zero Truncation) */}
            <nav
              aria-label={isEn ? 'Authentication Steps' : 'مراحل المصادقة وتوثيق الجوال'}
              data-testid="auth-pipeline-progress-bar"
              className="flex items-center gap-2 overflow-x-auto flex-nowrap step-tabs-scroll pb-2 pt-0.5"
            >
              {[
                {
                  id: 'STEP_A_IDENTITY' as GatewayAuthSubStep,
                  icon: '📧',
                  labelAr: 'أ. البريد الإلكتروني أو Google/Apple',
                  labelEn: 'A. Email or Google/Apple',
                },
                {
                  id: 'STEP_B_EMAIL_OTP' as GatewayAuthSubStep,
                  icon: '🔐',
                  labelAr: 'ب. رمز التحقق للبريد (OTP)',
                  labelEn: 'B. Email OTP Code',
                },
                {
                  id: 'STEP_C_PHONE_LINK' as GatewayAuthSubStep,
                  icon: '📱',
                  labelAr: 'ج. ربط وتوثيق رقم الجوال',
                  labelEn: 'C. Phone Linking & Co-Parent Prep',
                },
              ].map((tabItem, idx) => {
                const orderMap: Record<GatewayAuthSubStep, number> = {
                  STEP_A_IDENTITY: 1,
                  STEP_B_EMAIL_OTP: 2,
                  STEP_C_PHONE_LINK: 3,
                };
                const currentOrder = orderMap[authSubStep];
                const itemOrder = idx + 1;
                const isActive = authSubStep === tabItem.id;
                const isDone = currentOrder > itemOrder;
                return (
                  <button
                    key={tabItem.id}
                    type="button"
                    data-testid={`auth-pipeline-tab-${itemOrder}`}
                    onClick={() => {
                      setErrorMsg(null);
                      setAuthSubStep(tabItem.id);
                    }}
                    className={`shrink-0 whitespace-nowrap rounded-xl px-3.5 py-2 text-xs sm:text-sm border transition-all cursor-pointer flex items-center gap-1.5 ${
                      isActive
                        ? 'border-[#0d9488] bg-[#0d9488] text-white font-bold shadow-xs'
                        : isDone
                        ? 'border-emerald-600/50 bg-emerald-50 text-gray-900 font-semibold'
                        : 'border-slate-300 bg-white hover:border-[#0d9488] text-gray-900 font-semibold'
                    }`}
                  >
                    <span aria-hidden="true">{isDone ? '✓' : tabItem.icon}</span>
                    <span className={isActive ? 'text-white font-bold' : 'text-gray-900 font-semibold'}>
                      {isEn ? tabItem.labelEn : tabItem.labelAr}
                    </span>
                  </button>
                );
              })}
            </nav>

            {/* Step Sync Notice */}
            {stepSyncNotice && (
              <div
                data-testid="auth-pipeline-sync-notice"
                className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-3.5 py-2.5 text-xs font-bold text-emerald-800 dark:text-emerald-300"
              >
                ✅ {stepSyncNotice}
              </div>
            )}

            {/* Error Banner */}
            {errorMsg && (
              <div
                data-testid="auth-pipeline-error-banner"
                className="rounded-2xl border border-red-500/40 bg-red-500/10 px-3.5 py-2.5 text-xs font-bold text-red-700 dark:text-red-300"
              >
                ⚠️ {errorMsg}
              </div>
            )}

            {/* ---------------------------------------------------------------
                STEP A: EMAIL / PASSWORD OR GOOGLE / APPLE SIGN-IN
                --------------------------------------------------------------- */}
            {authSubStep === 'STEP_A_IDENTITY' && (
              <div data-testid="auth-step-a-screen" className="space-y-4">
                {/* Mode Switcher: تسجيل دخول vs إنشاء حساب جديد */}
                <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-100 dark:bg-[#142430] border border-slate-200 dark:border-[#1E3646]">
                  <button
                    type="button"
                    data-testid="auth-mode-signin-tab"
                    onClick={() => {
                      setGatewayAuthIntent('signin');
                      setAuthMode('signin');
                      setErrorMsg(null);
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-black transition cursor-pointer ${
                      gatewayAuthIntent === 'signin'
                        ? 'bg-[#0d9488] text-white shadow-xs'
                        : 'bg-white text-gray-900 font-semibold'
                    }`}
                  >
                    {isEn ? '🔑 Sign In (Existing Account)' : '🔑 تسجيل دخول (لديك حساب مسبق)'}
                  </button>
                  <button
                    type="button"
                    data-testid="auth-mode-signup-tab"
                    onClick={() => {
                      setGatewayAuthIntent('signup');
                      setAuthMode('signup');
                      setErrorMsg(null);
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-black transition cursor-pointer ${
                      gatewayAuthIntent === 'signup'
                        ? 'bg-[#0d9488] text-white shadow-xs'
                        : 'bg-white text-gray-900 font-semibold'
                    }`}
                  >
                    {isEn ? '🚀 Create New Account' : '🚀 إنشاء حساب جديد'}
                  </button>
                </div>

                {/* Google OAuth & Apple Sign-In Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    data-testid="oauth-google-btn"
                    disabled={isSavingStep}
                    onClick={() => void handleStepASubmit('google')}
                    className="min-h-[44px] rounded-xl border border-slate-300 bg-white hover:bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-gray-900 flex items-center justify-center gap-2 shadow-2xs transition cursor-pointer"
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        fill="#EA4335"
                        d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.8-5.5 3.8-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.4 14.6 2.5 12 2.5 6.8 2.5 2.5 6.8 2.5 12s4.3 9.5 9.5 9.5c5.5 0 9.1-3.9 9.1-9.3 0-.6-.1-1.1-.2-1.6H12z"
                      />
                    </svg>
                    <span className="text-gray-900 font-semibold">
                      {isEn ? 'Continue with Google' : 'المتابعة باستخدام Google'}
                    </span>
                  </button>

                  <button
                    type="button"
                    data-testid="oauth-apple-btn"
                    disabled={isSavingStep}
                    onClick={() => void handleStepASubmit('apple')}
                    className="min-h-[44px] rounded-xl border border-slate-300 bg-white hover:bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-gray-900 flex items-center justify-center gap-2 shadow-2xs transition cursor-pointer"
                  >
                    <span className="text-base leading-none text-gray-900" aria-hidden="true">
                      
                    </span>
                    <span className="text-gray-900 font-semibold">
                      {isEn ? 'Continue with Apple' : 'المتابعة باستخدام Apple'}
                    </span>
                  </button>
                </div>

                <div className="relative flex items-center justify-center py-0.5">
                  <div className="border-t border-slate-200 dark:border-[#1E3646] w-full" />
                  <span className="px-3 bg-[var(--color-surface)] dark:bg-[#101D26] text-[11px] font-bold text-[var(--color-muted)] shrink-0">
                    {isEn ? 'or with Email & Instant OTP' : 'أو عبر البريد الإلكتروني ورمز التحقق'}
                  </span>
                  <div className="border-t border-slate-200 dark:border-[#1E3646] w-full" />
                </div>

                {/* Parent Profile Selection (Maryam Mom vs Ahmad Dad) */}
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    data-testid="fast-login-preset-mom"
                    onClick={() => {
                      setParentRole('mom');
                      setParentName('مريم (الأم)');
                      setGatewayEmail('maryam.mom@nekbaar.app');
                      setEmail('maryam.mom@nekbaar.app');
                    }}
                    className={`min-h-[42px] rounded-xl border px-3 py-2 text-xs transition cursor-pointer ${
                      parentRole === 'mom'
                        ? 'bg-[#0d9488] text-white font-bold border-[#0d9488]'
                        : 'bg-white text-gray-900 font-semibold border-slate-300'
                    }`}
                  >
                    👩🏻 {isEn ? 'Mother Profile (Maryam)' : 'حساب الأم — مريم'}
                  </button>
                  <button
                    type="button"
                    data-testid="fast-login-preset-dad"
                    onClick={() => {
                      setParentRole('dad');
                      setParentName('أحمد (الأب)');
                      setGatewayEmail('ahmad.dad@nekbaar.app');
                      setEmail('ahmad.dad@nekbaar.app');
                    }}
                    className={`min-h-[42px] rounded-xl border px-3 py-2 text-xs transition cursor-pointer ${
                      parentRole === 'dad'
                        ? 'bg-[#0d9488] text-white font-bold border-[#0d9488]'
                        : 'bg-white text-gray-900 font-semibold border-slate-300'
                    }`}
                  >
                    👨🏻 {isEn ? 'Father Profile (Ahmad)' : 'حساب الأب — أحمد'}
                  </button>
                </div>

                {gatewayAuthIntent === 'signup' && (
                  <div className="space-y-1">
                    <label className="block text-xs font-extrabold text-[var(--color-text)] dark:text-[#F8FAFC]">
                      {isEn ? 'Full Name (Parent):' : 'الاسم الكامل (الأم أو الأب):'}
                    </label>
                    <input
                      type="text"
                      data-testid="auth-step-a-name-input"
                      value={parentName}
                      onChange={(e) => setParentName(e.target.value)}
                      placeholder={isEn ? 'e.g. Maryam / Ahmad' : 'مثال: مريم (الأم) أو أحمد (الأب)'}
                      className="w-full min-h-[42px] rounded-xl border border-slate-300 dark:border-[#1E3646] bg-white dark:bg-[#142430] px-3.5 py-2 text-xs font-bold text-gray-900 dark:text-[#F8FAFC]"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <label className="block text-xs font-extrabold text-[var(--color-text)] dark:text-[#F8FAFC]">
                    {isEn ? 'Email Address:' : 'البريد الإلكتروني:'}
                  </label>
                  <input
                    type="email"
                    dir="ltr"
                    data-testid="auth-step-a-email-input"
                    value={gatewayEmail}
                    onChange={(e) => {
                      setGatewayEmail(e.target.value);
                      setEmail(e.target.value);
                    }}
                    placeholder="maryam.mom@nekbaar.app"
                    className="w-full min-h-[42px] rounded-xl border border-slate-300 dark:border-[#1E3646] bg-white dark:bg-[#142430] px-3.5 py-2 text-xs font-bold text-gray-900 dark:text-[#F8FAFC]"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-extrabold text-[var(--color-text)] dark:text-[#F8FAFC]">
                      {isEn ? 'Password (or Email OTP Only):' : 'كلمة المرور (أو رمز تحقق البريد فقط):'}
                    </label>
                    <button
                      type="button"
                      onClick={() => setUsePasswordInStepA((prev) => !prev)}
                      className="text-[11px] font-bold text-[#0d9488] dark:text-[#2DD4BF] underline cursor-pointer"
                    >
                      {usePasswordInStepA
                        ? isEn
                          ? 'Use Email OTP without password'
                          : 'الاكتفاء برمز التحقق للبريد بدون كلمة مرور'
                        : isEn
                        ? 'Include password'
                        : 'إدخال كلمة المرور أيضاً'}
                    </button>
                  </div>
                  {usePasswordInStepA && (
                    <input
                      type="password"
                      dir="ltr"
                      data-testid="auth-step-a-password-input"
                      value={gatewayPassword}
                      onChange={(e) => {
                        setGatewayPassword(e.target.value);
                        setPassword(e.target.value);
                      }}
                      className="w-full min-h-[42px] rounded-xl border border-slate-300 dark:border-[#1E3646] bg-white dark:bg-[#142430] px-3.5 py-2 text-xs font-bold text-gray-900 dark:text-[#F8FAFC]"
                    />
                  )}
                </div>

                <div className="flex items-center justify-end gap-3 pt-2 border-t border-[var(--color-border)] dark:border-[#1E3646]">
                  <button
                    type="button"
                    data-testid="auth-step-a-submit-btn"
                    disabled={isSavingStep}
                    onClick={() => void handleStepASubmit('email')}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs sm:text-sm font-black bg-[#0d9488] hover:bg-[#0f766e] text-white shadow-sm transition cursor-pointer disabled:opacity-60"
                  >
                    {isSavingStep
                      ? isEn
                        ? 'Sending Email OTP...'
                        : 'جاري إرسال رمز التحقق للبريد...'
                      : isEn
                      ? '📨 Send Email Verification Code (Step B) →'
                      : '📨 إرسال رمز التحقق للبريد الإلكتروني (الخطوة ب) ←'}
                  </button>
                </div>
              </div>
            )}

            {/* ---------------------------------------------------------------
                STEP B: INSTANT EMAIL OTP VERIFICATION
                --------------------------------------------------------------- */}
            {authSubStep === 'STEP_B_EMAIL_OTP' && (
              <div data-testid="auth-step-b-screen" className="space-y-4">
                <div className="rounded-2xl border border-teal-500/35 bg-teal-500/10 p-4 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs sm:text-sm font-black text-[var(--color-text)] dark:text-[#F8FAFC]">
                      📧{' '}
                      {isEn
                        ? `Instant Verification Code Sent to:`
                        : 'تم إرسال رمز التحقق الفوري (OTP) إلى البريد:'}
                    </span>
                    <code
                      dir="ltr"
                      className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#142430] border border-teal-500/30 text-xs font-black text-[#0d9488] dark:text-[#2DD4BF]"
                    >
                      {gatewayEmail}
                    </code>
                  </div>
                  <p className="text-xs font-semibold text-[var(--color-muted)] dark:text-[#CBD5E1]">
                    {isEn
                      ? 'Enter the verification code sent to your email to confirm your account ownership and proceed to phone number linking.'
                      : 'أدخل رمز التحقق المرسل إلى بريدك الإلكتروني لتأكيد ملكية الحساب والانتقال فوراً لخطوة ربط وتوثيق رقم الجوال.'}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-extrabold text-[var(--color-text)] dark:text-[#F8FAFC]">
                      {isEn
                        ? 'Email OTP Verification Code:'
                        : 'رمز التحقق المرسل للبريد الإلكتروني (OTP):'}
                    </label>
                    <span className="text-[11px] font-black text-amber-700 dark:text-amber-300">
                      {isEn ? `Instant Code: ${DEMO_OTP_CODE}` : `الرمز الفوري: ${DEMO_OTP_CODE}`}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    <input
                      type="text"
                      dir="ltr"
                      maxLength={6}
                      data-testid="auth-step-b-otp-input"
                      value={gatewayEmailOtp}
                      onChange={(e) => setGatewayEmailOtp(e.target.value)}
                      placeholder={DEMO_OTP_CODE}
                      className="flex-1 min-w-[160px] min-h-[44px] rounded-xl border border-slate-300 dark:border-[#1E3646] bg-white dark:bg-[#142430] px-4 py-2 text-center text-base font-black tracking-widest text-gray-900 dark:text-[#F8FAFC]"
                    />
                    <button
                      type="button"
                      onClick={() => setGatewayEmailOtp(DEMO_OTP_CODE)}
                      className="min-h-[44px] px-3.5 py-2 rounded-xl bg-teal-500/15 text-[#0d9488] dark:text-[#2DD4BF] text-xs font-extrabold cursor-pointer"
                    >
                      {isEn ? 'Auto-Fill (1234)' : 'تعبئة تلقائية (1234)'}
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleStepASubmit(selectedProvider)}
                      className="min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-gray-900 text-xs font-semibold cursor-pointer"
                    >
                      {isEn ? '🔄 Resend Code' : '🔄 إعادة إرسال الرمز'}
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[var(--color-border)] dark:border-[#1E3646]">
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMsg(null);
                      setAuthSubStep('STEP_A_IDENTITY');
                    }}
                    className="px-4 py-2 rounded-xl border border-slate-300 bg-white text-gray-900 text-xs font-semibold cursor-pointer"
                  >
                    {isEn ? '← Back to Email (Step A)' : '→ تعديل البريد (الخطوة أ)'}
                  </button>

                  <button
                    type="button"
                    data-testid="auth-step-b-verify-btn"
                    disabled={isSavingStep}
                    onClick={() => void handleStepBVerifyEmailOtp()}
                    className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-black bg-[#0d9488] hover:bg-[#0f766e] text-white shadow-sm transition cursor-pointer disabled:opacity-60"
                  >
                    {isSavingStep
                      ? isEn
                        ? 'Verifying OTP...'
                        : 'جاري التحقق من الرمز...'
                      : isEn
                      ? '✓ Verify Email Code & Continue to Phone Linking →'
                      : '✓ تأكيد رمز البريد والانتقال لربط الجوال (الخطوة ج) ←'}
                  </button>
                </div>
              </div>
            )}

            {/* ---------------------------------------------------------------
                STEP C: PHONE LINKING & CO-PARENT PREP ("ربط وتوثيق رقم الجوال")
                --------------------------------------------------------------- */}
            {authSubStep === 'STEP_C_PHONE_LINK' && (
              <div data-testid="auth-step-c-phone-screen" className="space-y-4">
                {/* Explicit Guidance Banner (Requirement 2 — Step C) */}
                <div
                  data-testid="phone-linking-coparent-guidance"
                  className="rounded-2xl border-2 border-[#0d9488]/45 bg-gradient-to-br from-teal-500/12 via-emerald-500/5 to-amber-500/10 p-4 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm sm:text-base font-black text-[var(--color-text)] dark:text-[#F8FAFC] flex items-center gap-2">
                      <span>📱</span>
                      <span>ربط وتوثيق رقم الجوال</span>
                    </h3>
                    {gatewayEmailVerified && (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-black">
                        ✓ {isEn ? 'Email Verified' : 'تم توثيق البريد'}
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm font-extrabold text-[#0d9488] dark:text-[#2DD4BF] leading-relaxed">
                    (سجل رقم جوالك الأساسي لتسهيل عملية الربط الفوري مع حساب الشريك والطرف الثاني لاحقاً)
                  </p>
                </div>

                {/* Country Code & Primary Mobile Phone Input */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-extrabold text-[var(--color-text)] dark:text-[#F8FAFC]">
                      {isEn ? 'Country & Dial Code:' : 'الدولة ومفتاح الاتصال:'}
                    </label>
                    <select
                      data-testid="auth-step-c-country-select"
                      value={selectedCountry}
                      onChange={(e) => handleSelectCountry(e.target.value as CountryCode)}
                      className="w-full min-h-[44px] rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-gray-900"
                    >
                      <option value="SA" className="text-gray-900 bg-white font-bold">
                        🇸🇦 السعودية (+966)
                      </option>
                      <option value="EG" className="text-gray-900 bg-white font-bold">
                        🇪🇬 مصر (+20)
                      </option>
                    </select>
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <label className="block text-xs font-extrabold text-[var(--color-text)] dark:text-[#F8FAFC]">
                      {isEn ? 'Primary Mobile Phone Number:' : 'رقم الجوال الأساسي:'}
                    </label>
                    <div className="flex items-center gap-2" dir="ltr">
                      <span className="min-h-[44px] px-3.5 rounded-xl border border-slate-300 bg-slate-100 text-gray-900 text-xs font-black flex items-center">
                        {selectedCountry === 'SA' ? '+966' : '+20'}
                      </span>
                      <input
                        type="tel"
                        data-testid="auth-step-c-phone-input"
                        value={gatewayPhone}
                        onChange={(e) => {
                          setGatewayPhone(e.target.value);
                          setPhone(e.target.value);
                        }}
                        placeholder={selectedCountry === 'SA' ? '551234567' : '1012345678'}
                        className="flex-1 min-h-[44px] rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-black text-gray-900"
                      />
                    </div>
                  </div>
                </div>

                {/* Action Footer for Step C */}
                <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t border-[var(--color-border)] dark:border-[#1E3646]">
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMsg(null);
                      setAuthSubStep('STEP_B_EMAIL_OTP');
                    }}
                    className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-gray-900 text-xs font-semibold cursor-pointer"
                  >
                    {isEn ? '← Back to Step B' : '→ السابق (الخطوة ب)'}
                  </button>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      data-testid="auth-step-c-continue-wizard-btn"
                      disabled={isSavingStep}
                      onClick={() =>
                        void handleStepCCompletePhoneBinding({
                          openCustomizationWizard: true,
                        })
                      }
                      className="px-3.5 py-2.5 rounded-xl border border-[#0d9488] bg-white hover:bg-teal-50 text-gray-900 text-xs font-semibold transition cursor-pointer"
                    >
                      {isEn
                        ? '⚙️ Verify Phone & Customize 5-Step Setup'
                        : '⚙️ توثيق الجوال وتخصيص ملفات الأطفال والشريك (٥ خطوات)'}
                    </button>

                    <button
                      type="button"
                      data-testid="auth-step-c-complete-btn"
                      disabled={isSavingStep}
                      onClick={() =>
                        void handleStepCCompletePhoneBinding({
                          openCustomizationWizard: false,
                        })
                      }
                      className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black bg-[#0d9488] hover:bg-[#0f766e] text-white shadow-sm transition cursor-pointer disabled:opacity-60"
                    >
                      {isSavingStep
                        ? isEn
                          ? 'Binding Phone & Syncing...'
                          : 'جاري توثيق الجوال وتثبيت الجلسة...'
                        : isEn
                        ? '✓ Verify Phone & Enter Family Dashboard →'
                        : '✓ توثيق رقم الجوال والدخول للوحة العائلة ←'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===================================================================
            MODE 3: PROGRESSIVE 5-STEP ONBOARDING WIZARD
            =================================================================== */}
        {flowMode === 'WIZARD' && (
          <>
            {/* Top Wizard Header */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-[var(--color-border)] dark:border-[#1E3646]">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-black text-[#0d9488] dark:text-[#2DD4BF]">
                    <span>✨</span>
                    <span>
                      {isEn
                        ? `Progressive Family Setup · Step ${step} of 5`
                        : `التسجيل المتدرج الذكي · الخطوة ${step} من 5`}
                    </span>
                  </span>
                  {restoredFromCache && (
                    <span
                      data-testid="onboarding-cache-restored-badge"
                      className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                    >
                      {isEn
                        ? '✓ Auto-restored after refresh'
                        : '✓ تم استرجاع خطوتك تلقائياً بعد التحديث'}
                    </span>
                  )}
                </div>
                <h2
                  id="onboarding-wizard-title"
                  className="text-base sm:text-lg font-black text-[var(--color-text)] dark:text-[#F8FAFC]"
                >
                  {step === 1 &&
                    (isEn
                      ? '1. Country & City Selection'
                      : '1. الدولة والمدينة — تخصيص منطقتك أولاً')}
                  {step === 2 &&
                    (isEn
                      ? '2. Account Credentials (Phone & Email)'
                      : '2. بيانات الحساب — رقم الجوال والبريد الإلكتروني')}
                  {step === 3 &&
                    (isEn
                      ? '3. Verification Method (SMS vs. Email)'
                      : '3. طريقة التحقق — رسالة SMS أو بريد إلكتروني')}
                  {step === 4 &&
                    (isEn
                      ? '4. Children Profiles (At Least 1 Required)'
                      : '4. ملفات الأطفال — طفل واحد على الأقل لتفعيل الحساب')}
                  {step === 5 &&
                    (isEn
                      ? '5. Co-Parent Link (Phone OTP or QR Code)'
                      : '5. ربط الشريك — عبر رمز OTP أو مسح QR (اختياري)')}
                </h2>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  data-testid="onboarding-switch-gateway-btn"
                  onClick={() => {
                    setErrorMsg(null);
                    setFlowMode('GATEWAY');
                  }}
                  className="px-2.5 py-1.5 rounded-xl text-[11px] font-extrabold border border-[var(--color-border)] dark:border-[#1E3646] bg-white dark:bg-[#142430] text-gray-900 dark:text-[#F8FAFC] hover:border-[#0d9488] transition cursor-pointer"
                >
                  {isEn ? '⇄ Gateway' : '⇄ بوابة الدخول'}
                </button>
                <button
                  type="button"
                  data-testid="onboarding-complete-later-top-btn"
                  onClick={() =>
                    finalizeAndRouteToDashboard({
                      skippedCoParent: true,
                      skippedForLater: true,
                    })
                  }
                  className="px-3 py-1.5 rounded-xl text-[11px] font-extrabold bg-amber-500/15 hover:bg-amber-500/25 text-amber-800 dark:text-amber-300 border border-amber-500/35 transition cursor-pointer"
                >
                  {isEn ? '⏳ Complete Later' : '⏳ تخطي مؤقت / إكمال لاحقاً'}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label={isEn ? 'Close' : 'إغلاق'}
                  className="w-8 h-8 rounded-xl border border-[var(--color-border)] dark:border-[#1E3646] text-xs font-bold flex items-center justify-center hover:bg-teal-500/10 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Redesigned Horizontal Scrollable Step Navigation Tabs (Zero Truncation, High-Contrast Text) */}
            <nav
              aria-label={isEn ? 'Onboarding Steps' : 'خطوات التسجيل المتدرج'}
              data-testid="onboarding-step-progress-bar"
              className="flex items-center gap-2 overflow-x-auto flex-nowrap step-tabs-scroll pb-2 pt-0.5"
            >
              {WIZARD_STEPS_META.map((item) => {
                const isActive = step === item.num;
                const isCompleted = step > item.num;
                return (
                  <button
                    key={item.num}
                    type="button"
                    data-testid={`onboarding-step-pill-${item.num}`}
                    onClick={() => {
                      setErrorMsg(null);
                      setStep(item.num);
                    }}
                    className={`shrink-0 whitespace-nowrap rounded-xl px-3.5 py-2.5 text-xs sm:text-sm border transition-all cursor-pointer flex items-center gap-1.5 ${
                      isActive
                        ? 'border-[#0d9488] bg-[#0d9488] text-white font-bold shadow-sm'
                        : isCompleted
                        ? 'border-emerald-600/50 bg-emerald-50 text-gray-900 font-semibold'
                        : 'border-slate-300 bg-white hover:border-[#0d9488] text-gray-900 font-semibold'
                    }`}
                  >
                    <span aria-hidden="true">
                      {isCompleted ? '✓' : item.icon}
                    </span>
                    <span className={isActive ? 'text-white font-bold' : 'text-gray-900 font-semibold'}>
                      {isEn ? item.labelEn : item.labelAr}
                    </span>
                  </button>
                );
              })}
            </nav>

            {/* Step Sync Notice */}
            {stepSyncNotice && (
              <div
                data-testid="onboarding-step-sync-notice"
                className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-3.5 py-2.5 text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center justify-between gap-2"
              >
                <span>✅ {stepSyncNotice}</span>
            <button
              type="button"
              onClick={() => setStepSyncNotice(null)}
              className="text-[11px] underline cursor-pointer"
            >
              {isEn ? 'Dismiss' : 'إخفاء'}
            </button>
          </div>
        )}

        {/* Validation or Network Error Banner */}
        {errorMsg && (
          <div
            data-testid="onboarding-error-banner"
            className="rounded-2xl border border-red-500/40 bg-red-500/10 px-3.5 py-2.5 text-xs font-bold text-red-700 dark:text-red-300 space-y-2"
          >
            <div className="flex items-center justify-between gap-2">
              <span>⚠️ {errorMsg}</span>
              {canRetryFailedNetwork && (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="px-3 py-1 rounded-lg bg-red-600 text-white text-[11px] font-extrabold cursor-pointer"
                >
                  {isEn ? '🔄 Retry' : '🔄 إعادة المحاولة'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* ===================================================================
            STEP 1: LOCATION (SELECT COUNTRY & CITY FIRST — SAVE TO DRAFT)
            =================================================================== */}
        {step === 1 && (
          <div data-testid="onboarding-step-1-location" className="space-y-4">
            <p className="text-xs font-semibold text-[var(--color-muted)] dark:text-[#CBD5E1] leading-relaxed">
              {isEn
                ? 'Select your country and city first so we can tailor local schools, nurseries, medical care, and currency. Your choice is saved immediately to your local draft.'
                : 'اختر الدولة والمدينة أولاً لتخصيص الحضانات، المدارس، الأطباء، والعملة المحلية لمنطقتك. يتم حفظ اختيارك تلقائياً في المسودة الذكية.'}
            </p>

            {/* Country Cards */}
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  code: 'SA' as CountryCode,
                  flag: '🇸🇦',
                  titleAr: 'المملكة العربية السعودية',
                  titleEn: 'Saudi Arabia (SAR)',
                  subAr: 'الدمام · الرياض · جدة · الخبر',
                  subEn: 'Dammam · Riyadh · Jeddah',
                },
                {
                  code: 'EG' as CountryCode,
                  flag: '🇪🇬',
                  titleAr: 'جمهورية مصر العربية',
                  titleEn: 'Egypt (EGP)',
                  subAr: 'القاهرة · الإسكندرية · الجيزة',
                  subEn: 'Cairo · Alexandria · Giza',
                },
              ].map((cItem) => {
                const active = selectedCountry === cItem.code;
                return (
                  <button
                    key={cItem.code}
                    type="button"
                    data-testid={`onboarding-country-${cItem.code}`}
                    onClick={() => handleSelectCountry(cItem.code)}
                    className={`rounded-2xl p-3.5 text-start border transition-all cursor-pointer ${
                      active
                        ? 'border-[#0d9488] bg-teal-500/10 dark:bg-[#142430] shadow-xs'
                        : 'border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-muted)]/40 dark:bg-[#142430]/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">{cItem.flag}</span>
                      {active && (
                        <span className="px-2 py-0.5 rounded-full bg-[#0d9488] text-white text-[10px] font-black">
                          ✓ {isEn ? 'Selected' : 'محدد'}
                        </span>
                      )}
                    </div>
                    <div className="mt-2 text-xs sm:text-sm font-black text-[var(--color-text)] dark:text-[#F8FAFC]">
                      {isEn ? cItem.titleEn : cItem.titleAr}
                    </div>
                    <div className="text-[11px] font-semibold text-[var(--color-muted)] dark:text-[#94A3B8]">
                      {isEn ? cItem.subEn : cItem.subAr}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Quick City Chips */}
            <div className="space-y-2">
              <label className="block text-xs font-extrabold text-[var(--color-text)] dark:text-[#F8FAFC]">
                {isEn ? 'Quick City Selection:' : 'اختيار سريع للمدينة:'}
              </label>
              <div className="flex flex-wrap gap-2">
                {QUICK_REGION_PRESETS.filter((p) => p.country === selectedCountry).map(
                  (preset) => {
                    const isSelected = selectedCity === preset.cityAr;
                    return (
                      <button
                        key={preset.cityAr}
                        type="button"
                        onClick={() => setSelectedCity(preset.cityAr)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#0d9488] text-white border-[#0d9488]'
                            : 'bg-[var(--color-control-muted)] dark:bg-[#142430] text-[var(--color-text)] dark:text-[#F8FAFC] border-[var(--color-border)] dark:border-[#1E3646]'
                        }`}
                      >
                        📍 {isEn ? preset.cityEn : preset.cityAr}
                      </button>
                    );
                  }
                )}
              </div>
            </div>

            {/* Full Governorate / City Dropdown (High-Contrast Text & Full Labels) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold text-[var(--color-text)] dark:text-[#F8FAFC]">
                {isEn
                  ? 'Or choose from all Governorates / Cities:'
                  : 'أو اختر من قائمة المحافظات والمدن الكاملة:'}
              </label>
              {isLoadingCities ? (
                <div className="text-xs font-bold text-[#0d9488]">
                  {isEn ? 'Loading cities...' : 'جاري تحديث قائمة المدن...'}
                </div>
              ) : (
                <select
                  data-testid="onboarding-city-select"
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full min-h-[42px] rounded-xl border border-[var(--color-border)] dark:border-[#1E3646] bg-white dark:bg-[#142430] px-3.5 py-2 text-xs font-bold text-gray-900 dark:text-[#F8FAFC]"
                >
                  {availableCities.map((c, idx) => (
                    <option
                      key={c.id}
                      value={c.id}
                      className="text-gray-900 bg-white font-bold"
                    >
                      {isEn
                        ? `${idx + 1}. ${c.nameEn || c.labelEn || c.id} — ${c.regionEn}`
                        : `${idx + 1}. ${c.nameAr || c.labelAr || c.id} — ${c.regionAr}`}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        )}

        {/* ===================================================================
            STEP 2: CREDENTIALS (ENTER PHONE NUMBER & EMAIL — SAVE TO DRAFT)
            =================================================================== */}
        {step === 2 && (
          <div data-testid="onboarding-step-2-credentials" className="space-y-4">
            <p className="text-xs font-semibold text-[var(--color-muted)] dark:text-[#CBD5E1] leading-relaxed">
              {isEn
                ? 'Enter your name, mobile phone number, and email address. Everything is auto-saved to your draft as you type.'
                : 'أدخل اسمك ورقم الجوال والبريد الإلكتروني لحفظ حسابك العائلي. يتم الحفظ التلقائي الفوري أثناء الكتابة.'}
            </p>

            {/* Parent Role Selector (Mom Maryam vs Dad Ahmad) */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setParentRole('mom');
                  if (parentName.includes('أحمد')) setParentName('مريم (الأم)');
                  if (email.includes('ahmad')) setEmail('maryam.mom@nekbaar.app');
                  setCoParentName('أحمد (الأب)');
                  setCoParentEmail('ahmad.dad@nekbaar.app');
                }}
                className={`min-h-[44px] rounded-xl border px-3 py-2 text-xs font-black transition cursor-pointer ${
                  parentRole === 'mom'
                    ? 'bg-[#0d9488] text-white border-[#0d9488]'
                    : 'bg-[var(--color-control-muted)] dark:bg-[#142430] text-[var(--color-text)] dark:text-[#F8FAFC] border-[var(--color-border)] dark:border-[#1E3646]'
                }`}
              >
                👩🏻 {isEn ? 'Mom Account (Maryam)' : 'حساب الأم (مريم)'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setParentRole('dad');
                  if (parentName.includes('مريم')) setParentName('أحمد (الأب)');
                  if (email.includes('maryam')) setEmail('ahmad.dad@nekbaar.app');
                  setCoParentName('مريم (الأم)');
                  setCoParentEmail('maryam.mom@nekbaar.app');
                }}
                className={`min-h-[44px] rounded-xl border px-3 py-2 text-xs font-black transition cursor-pointer ${
                  parentRole === 'dad'
                    ? 'bg-[#0d9488] text-white border-[#0d9488]'
                    : 'bg-[var(--color-control-muted)] dark:bg-[#142430] text-[var(--color-text)] dark:text-[#F8FAFC] border-[var(--color-border)] dark:border-[#1E3646]'
                }`}
              >
                👨🏻 {isEn ? 'Dad Account (Ahmad)' : 'حساب الأب (أحمد)'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-extrabold text-[var(--color-text)] dark:text-[#F8FAFC]">
                  {isEn ? 'Full Name:' : 'الاسم الكامل:'}
                </label>
                <input
                  type="text"
                  data-testid="onboarding-parent-name-input"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  className="w-full min-h-[42px] rounded-xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-surface)] dark:bg-[#142430] px-3.5 py-2 text-xs font-bold text-[var(--color-text)] dark:text-[#F8FAFC]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-extrabold text-[var(--color-text)] dark:text-[#F8FAFC]">
                  {isEn ? 'ربط وتوثيق رقم الجوال:' : 'ربط وتوثيق رقم الجوال:'}
                </label>
                <div className="flex items-center gap-2" dir="ltr">
                  <span className="min-h-[42px] px-3 rounded-xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-muted)] dark:bg-[#142430] text-xs font-black flex items-center">
                    {selectedCountry === 'SA' ? '+966' : '+20'}
                  </span>
                  <input
                    type="tel"
                    data-testid="onboarding-phone-input"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={selectedCountry === 'SA' ? '551234567' : '1012345678'}
                    className="flex-1 min-h-[42px] rounded-xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-surface)] dark:bg-[#142430] px-3.5 py-2 text-xs font-bold text-[var(--color-text)] dark:text-[#F8FAFC]"
                  />
                </div>
                <p className="text-[11px] font-bold text-[#0d9488] dark:text-[#2DD4BF]">
                  (سجل رقم جوالك الأساسي لتسهيل عملية الربط الفوري مع حساب الشريك والطرف الثاني لاحقاً)
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-extrabold text-[var(--color-text)] dark:text-[#F8FAFC]">
                  {isEn ? 'Email Address:' : 'البريد الإلكتروني:'}
                </label>
                <input
                  type="email"
                  dir="ltr"
                  data-testid="onboarding-email-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full min-h-[42px] rounded-xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-surface)] dark:bg-[#142430] px-3.5 py-2 text-xs font-bold text-[var(--color-text)] dark:text-[#F8FAFC]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-extrabold text-[var(--color-text)] dark:text-[#F8FAFC]">
                  {isEn ? 'Account Password:' : 'كلمة المرور:'}
                </label>
                <input
                  type="password"
                  dir="ltr"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full min-h-[42px] rounded-xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-surface)] dark:bg-[#142430] px-3.5 py-2 text-xs font-bold text-[var(--color-text)] dark:text-[#F8FAFC]"
                />
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================
            STEP 3: VERIFICATION METHOD (OTP VIA SMS ON PHONE VS. VIA EMAIL)
            =================================================================== */}
        {step === 3 && (
          <div data-testid="onboarding-step-3-verify" className="space-y-4">
            <p className="text-xs font-semibold text-[var(--color-muted)] dark:text-[#CBD5E1] leading-relaxed">
              {isEn
                ? 'Choose your preferred OTP verification channel: SMS message to your phone number or verification code to your email.'
                : 'اختر قناة استلام رمز التحقق (OTP) المفضلة لديك: عبر رسالة نصية SMS على رقم الجوال أو عبر البريد الإلكتروني.'}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                data-testid="verify-channel-sms"
                onClick={() => {
                  setVerificationChannel('sms');
                  setOtpSentBanner(true);
                }}
                className={`rounded-2xl p-4 text-start border transition-all cursor-pointer space-y-1.5 ${
                  verificationChannel === 'sms'
                    ? 'border-[#0d9488] bg-teal-500/10 dark:bg-[#142430] shadow-xs'
                    : 'border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-muted)]/40 dark:bg-[#142430]/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xl">📱</span>
                  {verificationChannel === 'sms' && (
                    <span className="px-2 py-0.5 rounded-full bg-[#0d9488] text-white text-[10px] font-black">
                      ✓ {isEn ? 'Active Channel' : 'القناة المختارة'}
                    </span>
                  )}
                </div>
                <div className="text-xs sm:text-sm font-black text-[var(--color-text)] dark:text-[#F8FAFC]">
                  {isEn ? 'Verify via SMS on Phone' : 'التحقق عبر رسالة نصية SMS للجوال'}
                </div>
                <div
                  className="text-[11px] font-bold text-[#0d9488] dark:text-[#2DD4BF]"
                  dir="ltr"
                >
                  {selectedCountry === 'SA' ? '+966' : '+20'} {phone}
                </div>
              </button>

              <button
                type="button"
                data-testid="verify-channel-email"
                onClick={() => {
                  setVerificationChannel('email');
                  setOtpSentBanner(true);
                }}
                className={`rounded-2xl p-4 text-start border transition-all cursor-pointer space-y-1.5 ${
                  verificationChannel === 'email'
                    ? 'border-[#0d9488] bg-teal-500/10 dark:bg-[#142430] shadow-xs'
                    : 'border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-muted)]/40 dark:bg-[#142430]/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xl">📧</span>
                  {verificationChannel === 'email' && (
                    <span className="px-2 py-0.5 rounded-full bg-[#0d9488] text-white text-[10px] font-black">
                      ✓ {isEn ? 'Active Channel' : 'القناة المختارة'}
                    </span>
                  )}
                </div>
                <div className="text-xs sm:text-sm font-black text-[var(--color-text)] dark:text-[#F8FAFC]">
                  {isEn ? 'Verify via Email Address' : 'التحقق عبر البريد الإلكتروني'}
                </div>
                <div
                  className="text-[11px] font-bold text-[#0d9488] dark:text-[#2DD4BF] truncate"
                  dir="ltr"
                >
                  {email}
                </div>
              </button>
            </div>

            <div className="rounded-2xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-muted)]/35 dark:bg-[#142430] p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-extrabold text-[var(--color-text)] dark:text-[#F8FAFC]">
                  {verificationChannel === 'sms'
                    ? isEn
                      ? `Enter 4-digit SMS code sent to ${phone}:`
                      : `أدخل رمز التحقق المرسل في رسالة SMS إلى ${phone}:`
                    : isEn
                    ? `Enter 4-digit Email code sent to ${email}:`
                    : `أدخل رمز التحقق المرسل إلى البريد ${email}:`}
                </span>
                <span className="text-[11px] font-black text-amber-700 dark:text-amber-300">
                  {isEn ? `Instant Code: ${DEMO_OTP_CODE}` : `الرمز الفوري: ${DEMO_OTP_CODE}`}
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <input
                  type="text"
                  dir="ltr"
                  maxLength={6}
                  data-testid="onboarding-otp-input"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className="w-36 min-h-[42px] rounded-xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-surface)] dark:bg-[#101D26] px-4 py-2 text-center text-sm font-black tracking-widest text-[var(--color-text)] dark:text-[#F8FAFC]"
                />
                <button
                  type="button"
                  onClick={() => {
                    setOtpCode(DEMO_OTP_CODE);
                    setIsOtpVerified(true);
                    setOtpSentBanner(true);
                  }}
                  className="min-h-[42px] px-3.5 py-2 rounded-xl bg-teal-500/15 text-[#0d9488] dark:text-[#2DD4BF] text-xs font-extrabold cursor-pointer"
                >
                  {isEn ? 'Auto-Fill OTP' : 'تعبئة الرمز تلقائياً'}
                </button>
              </div>

              {otpSentBanner && (
                <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                  ✓{' '}
                  {isEn
                    ? 'Verification channel ready. Click Next Step to continue to Children Setup.'
                    : 'تم تجهيز قناة التحقق بنجاح. اضغط «الخطوة التالية» للانتقال إلى ملفات الأطفال.'}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===================================================================
            STEP 4: CHILDREN SETUP (MUST ADD AT LEAST ONE CHILD TO PROCEED)
            =================================================================== */}
        {step === 4 && (
          <div data-testid="onboarding-step-4-children" className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-semibold text-[var(--color-muted)] dark:text-[#CBD5E1]">
                {isEn
                  ? 'Add or verify your children profiles. At least ONE child is required to unlock Nekbaar features and persist your permanent session.'
                  : 'أضف أو راجع ملفات أطفالك. يشترط وجود ملف طفل واحد على الأقل لتفعيل ميزات التطبيق وتثبيت دخولك الدائم.'}
              </p>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 text-[11px] font-black">
                👶 {safeChildrenList.length}{' '}
                {isEn ? 'Children Added (Min: 1)' : 'أطفال مضافون (الحد الأدنى: ١)'}
              </span>
            </div>

            <div className="space-y-2.5 max-h-60 overflow-y-auto pe-1">
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
                    className="rounded-2xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-muted)]/40 dark:bg-[#142430] p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <ThreeDChildAvatar
                        name={safeName}
                        stageCode={ageInfo.stageCode}
                        accessoryTheme={safeTheme}
                        gender={safeGender}
                        size="sm"
                      />
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={kidItem.name ?? ''}
                            onChange={(e) =>
                              handleUpdateDraftChildField(kidItem.id, {
                                name: e.target.value,
                              })
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
                        value={safeGender}
                        onChange={(e) =>
                          handleUpdateDraftChildField(kidItem.id, {
                            gender: e.target.value as 'boy' | 'girl',
                          })
                        }
                        className="rounded-xl border border-[var(--color-border)] dark:border-[#1E3646] bg-white dark:bg-[#101D26] px-2.5 py-1.5 text-xs font-bold text-gray-900 dark:text-[#F8FAFC]"
                      >
                        <option value="boy" className="text-gray-900 bg-white font-bold">
                          {isEn ? 'Boy 👦🏻' : 'ولد 👦🏻'}
                        </option>
                        <option value="girl" className="text-gray-900 bg-white font-bold">
                          {isEn ? 'Girl 👧🏻' : 'بنت 👧🏻'}
                        </option>
                      </select>

                      <input
                        type="date"
                        value={safeBirth}
                        onChange={(e) =>
                          handleUpdateDraftChildField(kidItem.id, {
                            birth: e.target.value,
                          })
                        }
                        className="rounded-xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-surface)] dark:bg-[#101D26] px-2.5 py-1 text-xs font-bold text-[var(--color-text)] dark:text-[#F8FAFC]"
                      />

                      {safeChildrenList.length > 1 && (
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
                ➕ {isEn ? 'Add Another Child Profile' : 'إضافة طفل آخر لقائمة الأسرة'}
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
                  className="rounded-xl border border-[var(--color-border)] dark:border-[#1E3646] bg-white dark:bg-[#101D26] px-3 py-2 text-xs font-bold text-gray-900 dark:text-[#F8FAFC]"
                >
                  <option value="infant_6m" className="text-gray-900 bg-white font-bold">
                    {isEn
                      ? 'Infant Stage (0–2 Years / 6m)'
                      : 'مرحلة الرضيع (٦ شهور / ٠–٢ سنة)'}
                  </option>
                  <option value="nursery_4y" className="text-gray-900 bg-white font-bold">
                    {isEn
                      ? 'Nursery & Creative (3–5 Years)'
                      : 'مرحلة الحضانة والإبداع (٣–٥ سنوات)'}
                  </option>
                  <option value="school_8y" className="text-gray-900 bg-white font-bold">
                    {isEn
                      ? 'School & Sports (6–9 Years)'
                      : 'مرحلة المدرسة والرياضة (٦–٩ سنوات)'}
                  </option>
                </select>

                <div className="flex items-center gap-2">
                  <select
                    value={newChildGender}
                    onChange={(e) =>
                      setNewChildGender(e.target.value as 'boy' | 'girl')
                    }
                    className="flex-1 rounded-xl border border-[var(--color-border)] dark:border-[#1E3646] bg-white dark:bg-[#101D26] px-3 py-2 text-xs font-bold text-gray-900 dark:text-[#F8FAFC]"
                  >
                    <option value="boy" className="text-gray-900 bg-white font-bold">
                      {isEn ? 'Boy 👦🏻' : 'ولد 👦🏻'}
                    </option>
                    <option value="girl" className="text-gray-900 bg-white font-bold">
                      {isEn ? 'Girl 👧🏻' : 'بنت 👧🏻'}
                    </option>
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
            STEP 5: CO-PARENT INTEGRATION MODULE (PHONE OTP & QR CODE PAIRING)
            =================================================================== */}
        {step === 5 && (
          <div data-testid="onboarding-step-5-coparent" className="space-y-4">
            <div className="rounded-2xl border border-emerald-500/35 bg-emerald-500/10 p-3.5 flex items-center justify-between gap-2">
              <div className="text-xs font-extrabold text-emerald-900 dark:text-emerald-200">
                🎉{' '}
                {isEn
                  ? `Permanent session saved for ${parentName}! Your ${safeChildrenList.length} children are active.`
                  : `تم تثبيت جلستك الدائمة باسم «${parentName}» وتفعيل ملفات أطفالك (${safeChildrenList.length}) بنجاح!`}
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-black shrink-0">
                {isEn ? 'Optional Step' : 'خطوة اختيارية'}
              </span>
            </div>

            <p className="text-xs font-semibold text-[var(--color-muted)] dark:text-[#CBD5E1] leading-relaxed">
              {isEn
                ? 'Choose your preferred pairing method to bind your partner (Mother/Father) to Shared Family ID #' +
                  familyId +
                  ': Method A (Phone OTP Verification) or Method B (QR Code Pairing), or skip for later.'
                : `اختر طريقة ربط حساب الشريك (الأم / الأب) بنفس معرف العائلة المشترك (#${familyId}): الطريقة (أ) عبر رمز التحقق OTP لجوال الشريك، أو الطريقة (ب) عبر مسح رمز QR الذكي، أو التخطي مؤقتاً.`}
            </p>

            {/* Method Selector Tabs: Method A (Phone OTP) vs Method B (QR Code Pairing) */}
            <div className="grid grid-cols-2 gap-2.5" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={coParentMethod === 'phone_otp'}
                data-testid="coparent-method-phone-otp-tab"
                onClick={() => {
                  setCoParentMethod('phone_otp');
                  setErrorMsg(null);
                }}
                className={`rounded-2xl p-3 text-start border transition-all cursor-pointer ${
                  coParentMethod === 'phone_otp'
                    ? 'border-[#0d9488] bg-teal-500/12 dark:bg-[#142430] shadow-xs'
                    : 'border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-muted)]/40 dark:bg-[#142430]/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-base">📲</span>
                  {coParentMethod === 'phone_otp' && (
                    <span className="px-2 py-0.5 rounded-full bg-[#0d9488] text-white text-[10px] font-black">
                      {isEn ? 'Method A' : 'الطريقة (أ)'}
                    </span>
                  )}
                </div>
                <div className="mt-1 text-xs font-black text-[var(--color-text)] dark:text-[#F8FAFC]">
                  {isEn
                    ? 'Method A: Partner Phone OTP'
                    : 'الطريقة (أ): ربط برقم جوال الشريك (OTP)'}
                </div>
                <div className="text-[11px] text-[var(--color-muted)] dark:text-[#94A3B8]">
                  {isEn
                    ? 'Send OTP to partner mobile & bind to family_id'
                    : 'إرسال رمز تحقق لجوال الشريك وربطه بالعائلة'}
                </div>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={coParentMethod === 'qr_token'}
                data-testid="coparent-method-qr-tab"
                onClick={() => {
                  setCoParentMethod('qr_token');
                  setErrorMsg(null);
                }}
                className={`rounded-2xl p-3 text-start border transition-all cursor-pointer ${
                  coParentMethod === 'qr_token'
                    ? 'border-[#0d9488] bg-teal-500/12 dark:bg-[#142430] shadow-xs'
                    : 'border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-muted)]/40 dark:bg-[#142430]/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-base">📷</span>
                  {coParentMethod === 'qr_token' && (
                    <span className="px-2 py-0.5 rounded-full bg-[#0d9488] text-white text-[10px] font-black">
                      {isEn ? 'Method B' : 'الطريقة (ب)'}
                    </span>
                  )}
                </div>
                <div className="mt-1 text-xs font-black text-[var(--color-text)] dark:text-[#F8FAFC]">
                  {isEn
                    ? 'Method B: Dynamic QR Code Pairing'
                    : 'الطريقة (ب): الربط السريع برمز QR العائلي'}
                </div>
                <div className="text-[11px] text-[var(--color-muted)] dark:text-[#94A3B8]">
                  {isEn
                    ? 'Scan secure family QR token for instant sync'
                    : 'توليد ومسح رمز QR مشفر للربط الفوري'}
                </div>
              </button>
            </div>

            <div className="rounded-2xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-muted)]/35 dark:bg-[#142430] p-4 space-y-3.5">
              {/* Shared Partner Info Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="block text-[11px] font-extrabold text-[var(--color-text)] dark:text-[#F8FAFC]">
                    {isEn ? 'Partner / Co-Parent Name:' : 'اسم الشريك (الأب / الأم):'}
                  </label>
                  <input
                    type="text"
                    data-testid="onboarding-coparent-name-input"
                    value={coParentName}
                    onChange={(e) => setCoParentName(e.target.value)}
                    className="w-full min-h-[40px] rounded-xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-surface)] dark:bg-[#101D26] px-3 py-1.5 text-xs font-bold text-[var(--color-text)] dark:text-[#F8FAFC]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-extrabold text-[var(--color-text)] dark:text-[#F8FAFC]">
                    {isEn ? 'Partner Email:' : 'البريد الإلكتروني للشريك:'}
                  </label>
                  <input
                    type="email"
                    dir="ltr"
                    data-testid="onboarding-coparent-email-input"
                    value={coParentEmail}
                    onChange={(e) => setCoParentEmail(e.target.value)}
                    className="w-full min-h-[40px] rounded-xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-surface)] dark:bg-[#101D26] px-3 py-1.5 text-xs font-bold text-[var(--color-text)] dark:text-[#F8FAFC]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-extrabold text-[var(--color-text)] dark:text-[#F8FAFC]">
                    {isEn ? 'Partner Registered Mobile:' : 'رقم جوال الشريك المسجل:'}
                  </label>
                  <input
                    type="tel"
                    dir="ltr"
                    data-testid="onboarding-coparent-phone-input"
                    value={coParentPhone}
                    onChange={(e) => setCoParentPhone(e.target.value)}
                    placeholder={selectedCountry === 'SA' ? '559876543' : '1098765432'}
                    className="w-full min-h-[40px] rounded-xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-surface)] dark:bg-[#101D26] px-3 py-1.5 text-xs font-bold text-[var(--color-text)] dark:text-[#F8FAFC]"
                  />
                </div>
              </div>

              {/* METHOD A: PHONE OTP VERIFICATION PANEL */}
              {coParentMethod === 'phone_otp' && (
                <div
                  data-testid="coparent-phone-otp-panel"
                  className="rounded-2xl border border-teal-500/35 bg-teal-500/5 dark:bg-[#101D26] p-3.5 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="text-xs font-black text-[var(--color-text)] dark:text-[#F8FAFC]">
                        📲{' '}
                        {isEn
                          ? 'Partner Mobile OTP Verification'
                          : 'التحقق من رقم جوال الشريك عبر رمز OTP'}
                      </div>
                      <div className="text-[11px] font-semibold text-[var(--color-muted)] dark:text-[#94A3B8]">
                        {isEn
                          ? `Send a 4-digit OTP to ${coParentPhone} to securely bind ${coParentName} to Family #${familyId}.`
                          : `إرسال رمز تحقق من ٤ أرقام إلى الجوال (${coParentPhone}) لربط حساب «${coParentName}» بمعرف العائلة #${familyId}.`}
                      </div>
                    </div>

                    <button
                      type="button"
                      data-testid="coparent-send-otp-btn"
                      onClick={() => {
                        setErrorMsg(null);
                        setCoParentOtpSent(true);
                        setCoParentOtpCode(DEMO_OTP_CODE);
                        setStepSyncNotice(
                          isEn
                            ? `Partner OTP code (${DEMO_OTP_CODE}) sent to ${coParentPhone}.`
                            : `تم إرسال رمز التحقق (${DEMO_OTP_CODE}) إلى جوال الشريك (${coParentPhone}).`
                        );
                      }}
                      className="px-3.5 py-2 rounded-xl text-xs font-extrabold bg-[#0d9488] hover:bg-[#0f766e] text-white transition cursor-pointer shrink-0"
                    >
                      {coParentOtpSent
                        ? isEn
                          ? '🔄 Resend Partner OTP'
                          : '🔄 إعادة إرسال رمز OTP للشريك'
                        : isEn
                        ? '📨 Send Partner OTP'
                        : '📨 إرسال رمز OTP لجوال الشريك'}
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 pt-1">
                    <input
                      type="text"
                      dir="ltr"
                      maxLength={6}
                      data-testid="coparent-otp-input"
                      value={coParentOtpCode}
                      onChange={(e) => setCoParentOtpCode(e.target.value)}
                      placeholder={DEMO_OTP_CODE}
                      className="w-36 min-h-[40px] rounded-xl border border-[var(--color-border)] dark:border-[#1E3646] bg-white dark:bg-[#142430] px-3 py-1.5 text-center text-sm font-black tracking-widest text-gray-900 dark:text-[#F8FAFC]"
                    />
                    <button
                      type="button"
                      data-testid="coparent-verify-otp-btn"
                      onClick={async () => {
                        if (coParentOtpCode.trim().length < 4) {
                          setErrorMsg(
                            isEn
                              ? `Enter the 4-digit OTP code (${DEMO_OTP_CODE}).`
                              : `أدخل رمز التحقق المكون من ٤ أرقام (${DEMO_OTP_CODE}).`
                          );
                          return;
                        }
                        setErrorMsg(null);
                        setIsSavingStep(true);
                        const res = await linkCoParentAccountInSupabase({
                          familyId,
                          partnerRole: parentRole === 'dad' ? 'mother' : 'father',
                          partnerName: coParentName,
                          partnerPhone: coParentPhone,
                          partnerEmail: coParentEmail,
                          country: selectedCountry,
                          method: 'phone_otp',
                          otpCode: coParentOtpCode.trim(),
                        });
                        setIsSavingStep(false);
                        setCoParentOtpVerified(true);
                        setIsCoParentLinked(true);
                        setStepSyncNotice(
                          isEn
                            ? `Verified! ${coParentName} is now bound to Shared Family #${res.familyId} via Phone OTP.`
                            : `تم التحقق والربط بنجاح! حساب «${coParentName}» مرتبط الآن بمعرف العائلة المشترك (#${res.familyId}).`
                        );
                      }}
                      className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold transition cursor-pointer"
                    >
                      {coParentOtpVerified
                        ? isEn
                          ? '✓ Partner OTP Verified'
                          : '✓ تم توثيق وربط الشريك'
                        : isEn
                        ? '✓ Verify OTP & Bind Partner'
                        : '✓ تحقق وربط الشريك فوراً'}
                    </button>
                    <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300">
                      {isEn ? `Demo OTP: ${DEMO_OTP_CODE}` : `الرمز التجريبي: ${DEMO_OTP_CODE}`}
                    </span>
                  </div>
                </div>
              )}

              {/* METHOD B: QR CODE PAIRING PANEL */}
              {coParentMethod === 'qr_token' && (
                <div
                  data-testid="coparent-qr-pairing-panel"
                  className="rounded-2xl border border-teal-500/35 bg-teal-500/5 dark:bg-[#101D26] p-3.5 flex flex-col sm:flex-row items-center gap-4"
                >
                  {/* Dynamic SVG QR Code Matrix */}
                  <div className="p-3 rounded-2xl bg-white border-2 border-[#0d9488] shadow-sm shrink-0">
                    <svg
                      data-testid="coparent-qr-code-svg"
                      width="124"
                      height="124"
                      viewBox="0 0 15 15"
                      shapeRendering="crispEdges"
                      aria-label={isEn ? 'Family Pairing QR Code' : 'رمز الاستجابة السريعة لربط العائلة'}
                    >
                      <rect width="15" height="15" fill="#ffffff" />
                      {qrMatrix.map((row, rIdx) =>
                        row.map((cell, cIdx) =>
                          cell ? (
                            <rect
                              key={`${rIdx}-${cIdx}`}
                              x={cIdx}
                              y={rIdx}
                              width={1}
                              height={1}
                              fill="#0f172a"
                            />
                          ) : null
                        )
                      )}
                    </svg>
                  </div>

                  <div className="flex-1 space-y-2.5 w-full">
                    <div className="space-y-0.5">
                      <div className="text-xs font-black text-[var(--color-text)] dark:text-[#F8FAFC]">
                        📷{' '}
                        {isEn
                          ? 'Secure Family Pairing QR Token'
                          : 'رمز QR الذكي للربط المباشر بين الوالدين'}
                      </div>
                      <p className="text-[11px] font-semibold text-[var(--color-muted)] dark:text-[#94A3B8]">
                        {isEn
                          ? 'Have your partner scan this QR code from their Nekbaar app or click Scan & Pair below to link instantly.'
                          : 'اطلب من الشريك مسح رمز QR هذا من تطبيقه، أو اضغط على زر «مسح رمز QR والربط الفوري» بالأسفل.'}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <code
                        dir="ltr"
                        data-testid="coparent-qr-token-code"
                        className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#142430] border border-[var(--color-border)] dark:border-[#1E3646] text-[11px] font-black text-[#0d9488] dark:text-[#2DD4BF]"
                      >
                        {familyPairingToken}
                      </code>
                      <button
                        type="button"
                        data-testid="coparent-refresh-qr-btn"
                        onClick={() => setQrTokenNonce((n) => n + 1)}
                        className="px-2.5 py-1 rounded-lg bg-teal-500/15 text-[#0d9488] dark:text-[#2DD4BF] text-[11px] font-extrabold cursor-pointer"
                      >
                        {isEn ? '🔄 Refresh QR' : '🔄 تجديد الرمز'}
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <input
                        type="text"
                        dir="ltr"
                        data-testid="coparent-qr-scanner-input"
                        value={qrScanInputToken}
                        onChange={(e) => setQrScanInputToken(e.target.value)}
                        placeholder={familyPairingToken}
                        className="flex-1 min-w-[160px] min-h-[38px] rounded-xl border border-[var(--color-border)] dark:border-[#1E3646] bg-white dark:bg-[#142430] px-3 py-1 text-xs font-bold text-gray-900 dark:text-[#F8FAFC]"
                      />
                      <button
                        type="button"
                        data-testid="coparent-scan-qr-btn"
                        onClick={async () => {
                          setErrorMsg(null);
                          const tokenToUse = qrScanInputToken.trim() || familyPairingToken;
                          setQrScanInputToken(tokenToUse);
                          setIsSavingStep(true);
                          const res = await linkCoParentAccountInSupabase({
                            familyId,
                            partnerRole: parentRole === 'dad' ? 'mother' : 'father',
                            partnerName: coParentName,
                            partnerPhone: coParentPhone,
                            partnerEmail: coParentEmail,
                            country: selectedCountry,
                            method: 'qr_token',
                            pairingToken: tokenToUse,
                          });
                          setIsSavingStep(false);
                          setIsQrPairedSuccess(true);
                          setIsCoParentLinked(true);
                          setStepSyncNotice(
                            isEn
                              ? `QR Code Paired! ${coParentName} linked to Shared Family #${res.familyId} (${res.pairingToken}).`
                              : `تم مسح رمز QR والربط الفوري بنجاح! حساب «${coParentName}» مرتبط الآن بالعائلة (#${res.familyId}).`
                          );
                        }}
                        className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold transition cursor-pointer shrink-0"
                      >
                        {isQrPairedSuccess
                          ? isEn
                            ? '✓ QR Paired Successfully'
                            : '✓ تم الاقتران برمز QR'
                          : isEn
                          ? '📷 Scan & Pair Now'
                          : '📷 مسح رمز QR والربط الفوري'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--color-border)]/60 dark:border-[#1E3646]">
                <span className="text-[11px] font-bold text-[#0d9488] dark:text-[#2DD4BF]">
                  🔗{' '}
                  {isEn
                    ? `Shared Family ID #${familyId} ready for instant co-parent sync`
                    : `معرف العائلة المشترك (#${familyId}) جاهز للمزامنة الفورية بين الوالدين`}
                </span>
                <button
                  type="button"
                  data-testid="onboarding-skip-coparent-btn"
                  onClick={() =>
                    finalizeAndRouteToDashboard({
                      skippedCoParent: true,
                      skippedForLater: false,
                    })
                  }
                  className="px-3.5 py-2 rounded-xl border border-amber-500/40 bg-amber-500/15 hover:bg-amber-500/25 text-amber-900 dark:text-amber-200 text-xs font-black cursor-pointer"
                >
                  {isEn
                    ? '⏭️ تخطي مؤقت / إكمال لاحقاً (Enter Dashboard)'
                    : '⏭️ تخطي مؤقت / إكمال لاحقاً والدخول للتطبيق'}
                </button>
              </div>
            </div>
          </div>
        )}

            {/* Sequential Back / Skip / Next Footer Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[var(--color-border)] dark:border-[#1E3646]">
              <div className="flex items-center gap-2 text-[11px] font-bold text-[var(--color-muted)]">
                <span>
                  {isSavingStep
                    ? isEn
                      ? '⏳ Syncing step...'
                      : '⏳ جاري حفظ ومزامنة الخطوة...'
                    : isEn
                    ? `Step ${step} of 5 · Auto-cached in localStorage`
                    : `الخطوة ${step} من 5 · محفوظة تلقائياً ضد التحديث (F5)`}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {step > 1 && (
                  <button
                    type="button"
                    data-testid="onboarding-back-btn"
                    disabled={isSavingStep}
                    onClick={handlePreviousStep}
                    className="px-3.5 py-2 rounded-xl text-xs font-extrabold border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-muted)] dark:bg-[#142430] text-[var(--color-text)] dark:text-[#F8FAFC] hover:border-[#0d9488] transition cursor-pointer disabled:opacity-50"
                  >
                    {isEn ? '← Back' : '→ السابق'}
                  </button>
                )}

                {step === 5 && (
                  <button
                    type="button"
                    data-testid="onboarding-footer-skip-coparent-btn"
                    disabled={isSavingStep}
                    onClick={() =>
                      finalizeAndRouteToDashboard({
                        skippedCoParent: true,
                        skippedForLater: false,
                      })
                    }
                    className="px-3.5 py-2 rounded-xl text-xs font-bold border border-dashed border-[var(--color-border)] dark:border-[#1E3646] text-[var(--color-muted)] dark:text-[#CBD5E1] hover:text-[#0d9488] hover:border-[#0d9488] transition cursor-pointer"
                  >
                    {isEn ? 'Skip for Later' : 'تخطي مؤقت / إكمال لاحقاً'}
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
                    : step === 4
                    ? isEn
                      ? 'Save Children & Unlock App →'
                      : 'حفظ الأطفال وتثبيت الجلسة ←'
                    : isEn
                    ? '🤝 Link Partner & Enter Dashboard'
                    : '🤝 ربط الشريك والدخول للوحة العائلة'}
                </button>
              </div>
            </div>
          </>
        )}

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

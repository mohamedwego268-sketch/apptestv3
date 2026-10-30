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
  isValidUuid,
  normalizeOnboardingRoleToAccount,
  resendAccountVerificationOtpInSupabase,
  saveOnboardingChildrenToSupabase,
  saveOnboardingLocationToSupabase,
  signInWithOAuthProviderInSupabase,
  verifyAccountIdentityOtpInSupabase,
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

export interface CityChoice {
  ar: string;
  en: string;
}

export interface AllowedCountryOption {
  code: AllowedGCCOrEgyptCountry;
  mappedCoreCountry: CountryCode;
  dialCode: string;
  defaultCityAr: string;
  defaultCityEn: string;
  nameAr: string;
  nameEn: string;
  phonePlaceholder: string;
  cities: CityChoice[];
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
    cities: [
      { ar: 'القاهرة', en: 'Cairo' },
      { ar: 'الإسكندرية', en: 'Alexandria' },
      { ar: 'الجيزة', en: 'Giza' },
      { ar: 'المنصورة', en: 'Mansoura' },
      { ar: 'طنطا', en: 'Tanta' },
      { ar: 'أسيوط', en: 'Asyut' },
    ],
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
    cities: [
      { ar: 'الرياض', en: 'Riyadh' },
      { ar: 'جدة', en: 'Jeddah' },
      { ar: 'الدمام', en: 'Dammam' },
      { ar: 'مكة المكرمة', en: 'Makkah' },
      { ar: 'المدينة المنورة', en: 'Madinah' },
      { ar: 'الخبر', en: 'Khobar' },
    ],
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
    cities: [
      { ar: 'دبي', en: 'Dubai' },
      { ar: 'أبوظبي', en: 'Abu Dhabi' },
      { ar: 'الشارقة', en: 'Sharjah' },
      { ar: 'العين', en: 'Al Ain' },
    ],
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
    cities: [
      { ar: 'مدينة الكويت', en: 'Kuwait City' },
      { ar: 'حولي', en: 'Hawalli' },
      { ar: 'السالمية', en: 'Salmiya' },
      { ar: 'الفروانية', en: 'Farwaniya' },
    ],
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
    cities: [
      { ar: 'الدوحة', en: 'Doha' },
      { ar: 'الوكرة', en: 'Al Wakrah' },
      { ar: 'الريان', en: 'Al Rayyan' },
      { ar: 'لوسيل', en: 'Lusail' },
    ],
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
    cities: [
      { ar: 'المنامة', en: 'Manama' },
      { ar: 'المحرق', en: 'Muharraq' },
      { ar: 'الرفاع', en: 'Riffa' },
    ],
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
    cities: [
      { ar: 'مسقط', en: 'Muscat' },
      { ar: 'صلالة', en: 'Salalah' },
      { ar: 'صحار', en: 'Sohar' },
    ],
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
  emailVerified?: boolean;
  phoneVerified?: boolean;
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
  syncedToDb?: boolean;
  dbSyncError?: string | null;
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

type SocialProviderId = 'gmail' | 'icloud' | 'facebook' | 'outlook';

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
  const tempSavedUser = React.useMemo(() => {
    try {
      const raw = localStorage.getItem('nekbaar_temp_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  // Progressive Flow Steps:
  // Step 1 ('AUTH')     -> Minimalist Card-Based Sign-In / Registration Gateway
  // Step 2 ('CHILDREN') -> Children Profiles Setup (ملفات الأطفال / المحاضرات)
  // Step 3 ('PARTNER')  -> Optional Co-Parent Linking (ربط حساب الشريك)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const activeView: 'AUTH' | 'CHILDREN' | 'PARTNER' =
    currentStep === 1 ? 'AUTH' : currentStep === 2 ? 'CHILDREN' : 'PARTNER';

  const setActiveView = (view: 'AUTH' | 'CHILDREN' | 'PARTNER') => {
    setCurrentStep(view === 'AUTH' ? 1 : view === 'CHILDREN' ? 2 : 3);
  };

  const [authMode, setAuthMode] = useState<'signup' | 'signin'>(
    cachedDraft?.authMode ?? 'signup'
  );

  const [parentRole, setParentRole] = useState<ParentThemeRole>(
    tempSavedUser?.parentRole ??
      (tempSavedUser?.role === 'أب'
        ? 'dad'
        : tempSavedUser?.role === 'أم'
        ? 'mom'
        : cachedDraft?.parentRole ?? (initialRole === 'dad' ? 'dad' : 'mom'))
  );
  const [fullName, setFullName] = useState<string>(
    tempSavedUser?.fullName || cachedDraft?.parentName || initialParentName || ''
  );
  const [email, setEmail] = useState<string>(tempSavedUser?.email || cachedDraft?.email || '');
  const [password, setPassword] = useState<string>('');
  const [selectedCountryCode, setSelectedCountryCode] = useState<AllowedGCCOrEgyptCountry>(
    tempSavedUser?.country &&
      EGYPT_AND_GCC_COUNTRIES.some((c) => c.code === tempSavedUser.country)
      ? (tempSavedUser.country as AllowedGCCOrEgyptCountry)
      : cachedDraft?.selectedCountry === 'SA' || initialCountry === 'SA'
      ? 'SA'
      : 'EG'
  );
  const [locationMode, setLocationMode] = useState<'gps' | 'manual'>('manual');
  const [selectedCityAr, setSelectedCityAr] = useState<string>(
    tempSavedUser?.city ||
      cachedDraft?.selectedCity ||
      initialCity ||
      (initialCountry === 'SA' ? 'الرياض' : 'القاهرة')
  );
  const [isLocatingGps, setIsLocatingGps] = useState<boolean>(false);
  const [phone, setPhone] = useState<string>(tempSavedUser?.phone || cachedDraft?.phone || '');
  const [familyId, setFamilyId] = useState<number>(
    cachedDraft?.familyId ?? SHARED_FAMILY_ID
  );
  const [verifiedUserUuid, setVerifiedUserUuid] = useState<string | null>(null);
  const [verifiedFamilyUuid, setVerifiedFamilyUuid] = useState<string | null>(null);
  const [emailVerifiedState, setEmailVerifiedState] = useState<boolean>(false);
  const [phoneVerifiedState, setPhoneVerifiedState] = useState<boolean>(false);
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState<string | null>(null);
  const [verificationOtpCode, setVerificationOtpCode] = useState<string>('');
  const [otpStatusMsg, setOtpStatusMsg] = useState<string | null>(null);

  // Step 2: Children Profiles Setup
  const [childrenList, setChildrenList] = useState<OnboardingChildDraft[]>(() =>
    OnboardingFlowController.sanitizeChildrenList(cachedDraft?.childrenList, true)
  );
  const [newChildName, setNewChildName] = useState<string>('');
  const [newChildGender, setNewChildGender] = useState<'boy' | 'girl'>('boy');
  const [newChildBirth, setNewChildBirth] = useState<string>('2022-05-14');

  // Step 3: Optional Co-Parent Linking
  const [coParentName, setCoParentName] = useState<string>(
    cachedDraft?.coParentName || (parentRole === 'dad' ? 'مريم' : 'أحمد')
  );
  const [coParentEmail, setCoParentEmail] = useState<string>(
    cachedDraft?.coParentEmail ||
      (parentRole === 'dad' ? 'maryam.mom@nekbaar.app' : 'ahmad.dad@nekbaar.app')
  );
  const [coParentPhone, setCoParentPhone] = useState<string>(
    cachedDraft?.coParentPhone || '559876543'
  );

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [dbSyncWarning, setDbSyncWarning] = useState<string | null>(null);
  const [authSyncedToDb, setAuthSyncedToDb] = useState<boolean>(false);

  const activeCountryObj = React.useMemo(
    () =>
      EGYPT_AND_GCC_COUNTRIES.find((c) => c.code === selectedCountryCode) ||
      EGYPT_AND_GCC_COUNTRIES[0],
    [selectedCountryCode]
  );

  const safeChildrenList = React.useMemo(
    () => OnboardingFlowController.sanitizeChildrenList(childrenList, true),
    [childrenList]
  );

  const officialSlogan = isEn
    ? 'Our shared space.. growing with love'
    : 'مساحة تجمعنا.. وبحبهم نكبر';

  // Ensure selected city belongs to active country
  useEffect(() => {
    const existsInCountry = activeCountryObj.cities.some((c) => c.ar === selectedCityAr);
    if (!existsInCountry) {
      setSelectedCityAr(activeCountryObj.defaultCityAr);
    }
  }, [activeCountryObj, selectedCityAr]);

  useEffect(() => {
    const coreCountry = activeCountryObj.mappedCoreCountry;
    const stepKey =
      activeView === 'AUTH'
        ? 'CREDENTIALS'
        : activeView === 'CHILDREN'
        ? 'CHILDREN'
        : 'CO_PARENT';
    OnboardingFlowController.saveDraft(stepKey, {
      currentStep: stepKey,
      stepNumber: activeView === 'AUTH' ? 2 : activeView === 'CHILDREN' ? 4 : 5,
      authMode,
      parentRole,
      parentName: fullName,
      email,
      phone,
      familyId,
      selectedCountry: coreCountry,
      selectedCity: selectedCityAr || activeCountryObj.defaultCityAr,
      verificationChannel: 'email',
      otpCode: '',
      isOtpVerified: emailVerifiedState || phoneVerifiedState,
      childrenList: safeChildrenList,
      coParentName,
      coParentEmail,
      coParentPhone,
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
    selectedCityAr,
    safeChildrenList,
    coParentName,
    coParentEmail,
    coParentPhone,
    emailVerifiedState,
    phoneVerifiedState,
  ]);

  if (!isOpen) return null;

  const handleSelectRole = (nextRole: ParentThemeRole) => {
    setParentRole(nextRole);
  };

  const handleDetectCurrentLocationGps = () => {
    setLocationMode('gps');
    setErrorMsg(null);
    setIsLocatingGps(true);

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setIsLocatingGps(false);
      setLocationMode('manual');
      setErrorMsg(isEn
        ? 'Location is unavailable in this browser. Please select your city manually.'
        : 'خدمة تحديد الموقع غير متاحة في المتصفح. اختر المدينة يدويًا.');
      return;
    }

    const cityCoordinates: Array<{ country: 'SA' | 'EG'; city: string; lat: number; lon: number }> = [
      { country: 'SA', city: 'الخبر', lat: 26.2172, lon: 50.1971 },
      { country: 'SA', city: 'الدمام', lat: 26.4207, lon: 50.0888 },
      { country: 'SA', city: 'الرياض', lat: 24.7136, lon: 46.6753 },
      { country: 'SA', city: 'جدة', lat: 21.4858, lon: 39.1925 },
      { country: 'SA', city: 'مكة المكرمة', lat: 21.3891, lon: 39.8579 },
      { country: 'SA', city: 'المدينة المنورة', lat: 24.5247, lon: 39.5692 },
      { country: 'SA', city: 'الجبيل', lat: 27.0174, lon: 49.6583 },
      { country: 'SA', city: 'أبها', lat: 18.2164, lon: 42.5053 },
      { country: 'EG', city: 'القاهرة', lat: 30.0444, lon: 31.2357 },
      { country: 'EG', city: 'الإسكندرية', lat: 31.2001, lon: 29.9187 },
      { country: 'EG', city: 'الجيزة', lat: 30.0131, lon: 31.2089 },
      { country: 'EG', city: 'المنصورة', lat: 31.0409, lon: 31.3785 },
      { country: 'EG', city: 'طنطا', lat: 30.7865, lon: 31.0004 },
      { country: 'EG', city: 'أسيوط', lat: 27.1809, lon: 31.1837 },
    ];

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const isEgypt = latitude >= 21.5 && latitude <= 32.5 && longitude >= 24.5 && longitude <= 36;
        const isSaudi = latitude >= 16 && latitude <= 33.5 && longitude >= 34 && longitude <= 56;
        const detectedCountry = isEgypt ? 'EG' : isSaudi ? 'SA' : null;

        if (!detectedCountry) {
          setIsLocatingGps(false);
          setLocationMode('manual');
          setErrorMsg(isEn
            ? 'Your location is outside the supported countries. Please choose Egypt or Saudi Arabia and select a city.'
            : 'موقعك خارج نطاق مصر والسعودية. اختر الدولة والمدينة يدويًا.');
          return;
        }

        const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
        const distanceKm = (a: number, b: number, c: number, d: number) => {
          const dLat = toRadians(c - a);
          const dLon = toRadians(d - b);
          const h = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRadians(a)) * Math.cos(toRadians(c)) * Math.sin(dLon / 2) ** 2;
          return 6371 * 2 * Math.asin(Math.sqrt(h));
        };
        const nearestCity = cityCoordinates
          .filter((city) => city.country === detectedCountry)
          .map((city) => ({ ...city, distance: distanceKm(latitude, longitude, city.lat, city.lon) }))
          .sort((a, b) => a.distance - b.distance)[0];

        setSelectedCountryCode(detectedCountry);
        if (nearestCity && nearestCity.distance <= 100) {
          setSelectedCityAr(nearestCity.city);
          setErrorMsg(null);
        } else {
          setLocationMode('manual');
          setErrorMsg(isEn
            ? 'Country detected, but the nearest supported city is not accurate enough. Please select your city manually.'
            : 'تم تحديد الدولة، لكن لا يمكن تأكيد المدينة بدقة كافية. اختر مدينتك يدويًا.');
        }
        setIsLocatingGps(false);
      },
      (error) => {
        setIsLocatingGps(false);
        setLocationMode('manual');
        const message = error.code === 1
          ? (isEn ? 'Allow location permission for this site, then try again.' : 'اسمح للمتصفح بالوصول للموقع ثم حاول مرة أخرى.')
          : error.code === 3
          ? (isEn ? 'Location request timed out. Try again or select your city manually.' : 'انتهت مهلة تحديد الموقع. حاول مرة أخرى أو اختر المدينة يدويًا.')
          : (isEn ? 'Could not determine your location. Select your city manually.' : 'تعذر تحديد موقعك. اختر المدينة يدويًا.');
        setErrorMsg(message);
      },
      { enableHighAccuracy: true, maximumAge: 30000, timeout: 15000 }
    );
  };

  const syncAuthAndLocationWithSupabase = async (params: {
    cleanName: string;
    cleanEmail: string;
    cleanPassword?: string;
    cleanPhone: string;
    coreCountry: CountryCode;
    resolvedCity: string;
  }) => {
    const normalizedRole = normalizeOnboardingRoleToAccount(parentRole);
    const resolvedCurrency = getSuggestedCurrencyForCountry(params.coreCountry);
    const resolvedFamilyName = `أسرة ${params.cleanName} — نكبر`;

    try {
      const authRes = await authenticateParentWithSupabase({
        mode: authMode,
        role: normalizedRole,
        parentName: params.cleanName,
        fullName: params.cleanName,
        email: params.cleanEmail,
        password: params.cleanPassword || password,
        phone: params.cleanPhone,
        country: params.coreCountry,
        city: params.resolvedCity,
        currency: resolvedCurrency,
        familyId,
        familyName: resolvedFamilyName,
      });

      // Strictly track genuine Supabase Auth confirmation state (never fake from DB sync)
      setEmailVerifiedState(Boolean(authRes.emailVerified));
      setPhoneVerifiedState(Boolean(authRes.phoneVerified));

      if (isValidUuid(authRes.userId)) {
        setVerifiedUserUuid(authRes.userId);
      }
      if (isValidUuid(authRes.verifiedFamilyUuid)) {
        setVerifiedFamilyUuid(authRes.verifiedFamilyUuid);
      }

      if (authRes.pendingEmailVerification) {
        setPendingVerificationEmail(params.cleanEmail);
        setOtpStatusMsg(
          isEn
            ? `Verification code sent to ${params.cleanEmail}. Enter the 6-digit OTP to confirm your identity.`
            : `تم إرسال رمز تحقق إلى ${params.cleanEmail}. أدخل الرمز لتأكيد البريد الإلكتروني وتفعيل المزامنة السحابية.`
        );
      } else {
        setPendingVerificationEmail(null);
      }

      // Restore existing family children if signing in to an existing family
      if (Array.isArray(authRes.sharedChildren) && authRes.sharedChildren.length > 0) {
        setChildrenList(
          authRes.sharedChildren.map((child, idx) => ({
            id: child.id || idx + 1,
            remoteId: child.remote_id,
            name: child.name,
            gender: child.gender === 'girl' ? 'girl' : 'boy',
            ageStagePreset: 'custom',
            birth: child.birth || '2022-05-14',
            interests: child.interests || '',
            avatarTheme: child.avatar_theme || (child.gender === 'girl' ? 'artist' : 'astronaut'),
          }))
        );
      }

      const locRes = authRes.success && isValidUuid(authRes.verifiedFamilyUuid)
        ? await saveOnboardingLocationToSupabase({
            familyId: authRes.verifiedFamilyUuid,
            familyName: resolvedFamilyName,
            country: params.coreCountry,
            city: params.resolvedCity,
            currency: resolvedCurrency,
            activeParent: normalizedRole,
          })
        : { synced: false, error: authRes.error || 'No verified family UUID; location write was blocked.' };

      if (authRes.success && authRes.syncedToDb && locRes.synced) {
        setAuthSyncedToDb(true);
        setDbSyncWarning(null);
      } else {
        setAuthSyncedToDb(false);
        setDbSyncWarning(
          authRes.error ||
            (isEn
              ? 'Saved locally on this device. Cloud database sync failed or is unavailable.'
              : 'تم حفظ بياناتك محلياً؛ تعذرت المزامنة مع قاعدة البيانات السحابية حالياً.')
        );
      }
      return authRes;
    } catch {
      setAuthSyncedToDb(false);
      setDbSyncWarning(
        isEn
          ? 'Saved locally on this device. Cloud database sync failed or is unavailable.'
          : 'تم حفظ بياناتك محلياً؛ تعذرت المزامنة مع قاعدة البيانات السحابية حالياً.'
      );
      return null;
    }
  };

  const handleVerifyIdentityOtp = async () => {
    const targetEmail = pendingVerificationEmail || email.trim();
    if (!verificationOtpCode.trim()) {
      setErrorMsg(
        isEn ? 'Please enter the verification code.' : 'يرجى إدخال رمز التحقق المرسل لبريدك.'
      );
      return;
    }
    setErrorMsg(null);
    const verifyRes = await verifyAccountIdentityOtpInSupabase({
      email: targetEmail,
      token: verificationOtpCode.trim(),
      type: 'signup',
    });
    if (!verifyRes.verified) {
      setErrorMsg(
        verifyRes.error ||
          (isEn ? 'Invalid or expired verification code.' : 'رمز التحقق غير صالح أو منتهي الصلاحية.')
      );
      return;
    }

    setEmailVerifiedState(verifyRes.emailVerified);
    setPhoneVerifiedState(verifyRes.phoneVerified);
    if (verifyRes.userId && isValidUuid(verifyRes.userId)) {
      setVerifiedUserUuid(verifyRes.userId);
    }
    setPendingVerificationEmail(null);
    setOtpStatusMsg(
      isEn ? 'Identity verified. Connecting your family space…' : 'تم التحقق من الهوية. جارٍ ربط مساحة الأسرة…'
    );

    const coreCountry = activeCountryObj.mappedCoreCountry;
    const resolvedCity = selectedCityAr || activeCountryObj.defaultCityAr;
    if (!fullName.trim() || !phone.trim()) {
      setErrorMsg(isEn ? 'Enter your name and phone number to continue.' : 'أدخل الاسم ورقم الجوال للمتابعة.');
      return;
    }
    await syncAuthAndLocationWithSupabase({
      cleanName: fullName.trim(),
      cleanEmail: targetEmail,
      cleanPassword: password,
      cleanPhone: phone.trim(),
      coreCountry,
      resolvedCity,
    });
  };

  const handleResendIdentityOtp = async () => {
    const targetEmail = pendingVerificationEmail || email.trim();
    const res = await resendAccountVerificationOtpInSupabase({
      email: targetEmail,
      type: 'signup',
    });
    if (res.sent) {
      setOtpStatusMsg(
        isEn
          ? `A new verification code was sent to ${targetEmail}.`
          : `تمت إعادة إرسال رمز التحقق إلى ${targetEmail}.`
      );
    } else if (res.error) {
      setErrorMsg(res.error);
    }
  };

  const handleSocialQuickAuth = async (provider: SocialProviderId) => {
    setErrorMsg(null);
    setDbSyncWarning(null);
    const providerMap: Record<SocialProviderId, 'google' | 'apple' | 'facebook' | 'azure'> = {
      gmail: 'google',
      icloud: 'apple',
      facebook: 'facebook',
      outlook: 'azure',
    };

    const supabaseProvider = providerMap[provider];
    setIsSubmitting(true);
    const oauthRes = await signInWithOAuthProviderInSupabase(supabaseProvider);
    setIsSubmitting(false);

    if (!oauthRes.initiated || !oauthRes.redirectUrl) {
      // Never fake OAuth authentication with hardcoded emails or advance to Step 2 when OAuth is disabled
      setErrorMsg(
        isEn
          ? oauthRes.errorEn ||
              `OAuth provider (${provider}) is not enabled in Supabase Dashboard. Please use Email & Password.`
          : oauthRes.errorAr ||
              `مزود تسجيل الدخول (${provider}) غير مفعّل في إعدادات Supabase حالياً. يرجى استخدام البريد الإلكتروني وكلمة المرور.`
      );
      return;
    }

    if (typeof window !== 'undefined') {
      window.location.assign(oauthRes.redirectUrl);
    }
  };

  const handleFirstStepSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setErrorMsg(null);
    setDbSyncWarning(null);

    const country = selectedCountryCode;
    const cleanFullName = fullName.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();
    const cleanPassword = password;
    const resolvedCity = selectedCityAr || activeCountryObj.defaultCityAr;

    if (!cleanEmail || !cleanPassword || (authMode === 'signup' && (!cleanFullName || !cleanPhone || !country))) {
      setErrorMsg(isEn
        ? 'Enter a valid email and password; sign-up also requires your name and phone.'
        : 'أدخل البريد الإلكتروني وكلمة المرور؛ والتسجيل الجديد يتطلب الاسم ورقم الهاتف أيضًا.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setErrorMsg(isEn ? 'Enter a valid email address.' : 'أدخل بريدًا إلكترونيًا صحيحًا.');
      return;
    }
    if (cleanPassword.length < 8) {
      setErrorMsg(isEn ? 'Password must be at least 8 characters.' : 'كلمة المرور يجب ألا تقل عن 8 أحرف.');
      return;
    }

    // Keep a recoverable draft only; authentication and cloud persistence remain authoritative.
    try {
      localStorage.setItem('nekbaar_temp_user', JSON.stringify({
        fullName: cleanFullName, email: cleanEmail, phone: cleanPhone, country,
        role: parentRole === 'dad' ? 'أب' : 'أم', parentRole, city: resolvedCity,
      }));
    } catch {
      // Local draft storage is optional and never treated as successful account creation.
    }

    setIsSubmitting(true);
    try {
      const authRes = await syncAuthAndLocationWithSupabase({
        cleanName: cleanFullName,
        cleanEmail,
        cleanPassword,
        cleanPhone,
        coreCountry: activeCountryObj.mappedCoreCountry,
        resolvedCity,
      });
      if (authRes?.success || authRes?.pendingEmailVerification) {
        setCurrentStep(2);
      } else {
        setErrorMsg(authRes?.error || (isEn
          ? 'Authentication could not be completed. Your account data was not advanced.'
          : 'تعذر إكمال تسجيل الدخول؛ لم ننتقل للخطوة التالية ولم نعتبر البيانات محفوظة.'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddChild = () => {
    setErrorMsg(null);
    const trimmed = newChildName.trim();
    if (!trimmed) {
      setErrorMsg(isEn ? 'Enter child name first.' : 'يرجى إدخال اسم الطفل أولاً.');
      return;
    }
    const validation = validateChildInput({
      name: trimmed,
      birth: newChildBirth,
    });
    if (!validation.valid) {
      setErrorMsg(
        validation.error ||
          (isEn ? 'Please check the child details.' : 'يرجى التحقق من بيانات الطفل.')
      );
      return;
    }

    setChildrenList((prev) => {
      const currentSanitized = OnboardingFlowController.sanitizeChildrenList(prev, true);
      const duplicateIdx = currentSanitized.findIndex(
        (c) =>
          c.name.trim().toLowerCase() === trimmed.toLowerCase() &&
          c.birth.trim() === newChildBirth.trim()
      );
      if (duplicateIdx >= 0) {
        const updated = [...currentSanitized];
        updated[duplicateIdx] = {
          ...updated[duplicateIdx],
          name: trimmed,
          gender: newChildGender,
          birth: newChildBirth,
          interests: newChildGender === 'girl' ? 'الرسم والقصص' : 'السباحة والتركيب',
          avatarTheme: newChildGender === 'girl' ? 'artist' : 'astronaut',
        };
        return updated;
      }

      const nextId =
        currentSanitized.reduce((maxId, c) => Math.max(maxId, Number(c.id) || 0), 0) + 1;

      const newItem: OnboardingChildDraft = {
        id: nextId,
        name: trimmed,
        gender: newChildGender,
        ageStagePreset: 'custom',
        birth: newChildBirth,
        interests: newChildGender === 'girl' ? 'الرسم والقصص' : 'السباحة والتركيب',
        avatarTheme: newChildGender === 'girl' ? 'artist' : 'astronaut',
      };
      return [...currentSanitized, newItem];
    });
    setNewChildName('');
  };

  const handleRemoveChild = (id: number | string) => {
    setErrorMsg(null);
    setChildrenList((prev) => prev.filter((c) => String(c.id) !== String(id)));
  };

  const handleProceedFromChildrenStep = () => {
    setErrorMsg(null);
    if (safeChildrenList.length === 0) {
      setErrorMsg(
        isEn
          ? 'Please add at least one child profile before continuing.'
          : 'يرجى إضافة ملف طفل واحد على الأقل قبل المتابعة.'
      );
      return;
    }
    setActiveView('PARTNER');
  };

  const handleFinalizeFlow = async (linkCoParent: boolean) => {
    setErrorMsg(null);
    if (safeChildrenList.length === 0) {
      setErrorMsg(
        isEn
          ? 'Please add at least one child profile before saving.'
          : 'يرجى إضافة ملف طفل واحد على الأقل قبل الحفظ.'
      );
      setActiveView('CHILDREN');
      return;
    }

    if (!verifiedUserUuid || !isValidUuid(verifiedUserUuid) || !verifiedFamilyUuid || !isValidUuid(verifiedFamilyUuid) || !authSyncedToDb) {
      setErrorMsg(isEn
        ? 'Verify your account and complete cloud family setup before saving the children.'
        : 'لازم توثّق الحساب وتكتمل مزامنة مساحة الأسرة قبل حفظ بيانات الأطفال.');
      setActiveView('AUTH');
      return;
    }

    setIsSubmitting(true);
    const listToSave = safeChildrenList;

    let childrenSynced = false;
    let childrenSyncError: string | null = null;
    let enrichedChildrenList = listToSave;
    try {
      const saveRes = await saveOnboardingChildrenToSupabase({
        familyId: verifiedFamilyUuid || familyId,
        childrenList: listToSave.map((item, idx) => ({
          id: Number.isFinite(Number(item.id)) && Number(item.id) > 0 ? Number(item.id) : idx + 1,
          remoteId: item.remoteId !== undefined ? String(item.remoteId) : undefined,
          name: item.name,
          birth: item.birth,
          gender: item.gender,
          interests: item.interests,
          avatarTheme: item.avatarTheme,
        })),
      });
      childrenSynced = saveRes.synced;
      childrenSyncError = saveRes.error;
      if (Array.isArray(saveRes.savedChildren) && saveRes.savedChildren.length > 0) {
        enrichedChildrenList = listToSave.map((item, idx) => {
          const localId =
            Number.isFinite(Number(item.id)) && Number(item.id) > 0 ? Number(item.id) : idx + 1;
          const matchedSaved =
            saveRes.savedChildren.find((sc) => sc.id === localId) ||
            saveRes.savedChildren.find((sc) => sc.name === item.name);
          return {
            ...item,
            id: localId,
            remoteId: matchedSaved?.remote_id ?? item.remoteId,
          };
        });
      }
    } catch (err) {
      childrenSynced = false;
      childrenSyncError =
        err instanceof Error ? err.message : 'Unable to save children to Supabase.';
    }

    const finalSyncedToDb = Boolean(authSyncedToDb && childrenSynced);
    if (!childrenSynced) {
      setIsSubmitting(false);
      setDbSyncWarning(childrenSyncError || (isEn
        ? 'Children could not be confirmed in cloud storage. Please retry before completing setup.'
        : 'لم نتمكن من تأكيد حفظ بيانات الأطفال سحابياً. أعد المحاولة قبل إكمال التسجيل.'));
      return;
    }
    if (!finalSyncedToDb) {
      setDbSyncWarning(
        isEn
          ? 'Could not sync with cloud database; your family profile was saved locally on this device.'
          : 'تعذر الحفظ في قاعدة البيانات السحابية؛ تم حفظ ملف عائلتك وأطفالك محلياً على هذا الجهاز.'
      );
    }

    const coreCountry = activeCountryObj.mappedCoreCountry;
    const finalCity = selectedCityAr || activeCountryObj.defaultCityAr;
    const primaryChild = listToSave[0];
    const cleanParentName = fullName.trim();
    const cleanPhone = `${activeCountryObj.dialCode}${phone.replace(/^0+/, '')}`;

    // Never mark an account as verified simply because database synchronization succeeded!
    const genuineEmailVerified = Boolean(emailVerifiedState);
    const genuinePhoneVerified = Boolean(phoneVerifiedState);

    const sessionProfile: UserSessionProfile = {
      userId: verifiedUserUuid,
      sessionToken: '',
      authenticatedAt: new Date().toISOString(),
      onboardingCompleted: true,
      familyId: verifiedFamilyUuid,
      verifiedFamilyId: verifiedFamilyUuid,
      isDbVerified: finalSyncedToDb,
      role: parentRole,
      parentRole,
      fullName: cleanParentName,
      parentName: cleanParentName,
      email: email.trim(),
      phone: cleanPhone,
      country: coreCountry,
      city: finalCity,
      verificationChannel: 'email',
      isOtpVerified: genuineEmailVerified || genuinePhoneVerified,
      emailVerified: genuineEmailVerified,
      phoneVerified: genuinePhoneVerified,
      isCoParentLinked: linkCoParent,
      coParentName: coParentName.trim(),
      coParentEmail: coParentEmail.trim(),
      coParentPhone: coParentPhone.trim(),
      childrenCount: listToSave.length,
      syncedToDb: finalSyncedToDb,
    };

    if (typeof OnboardingFlowController.saveAuthenticatedSession === 'function') {
      OnboardingFlowController.saveAuthenticatedSession(sessionProfile, true);
    } else {
      OnboardingFlowController.persistUserSession(sessionProfile, true);
    }

    setIsSubmitting(false);
    onCompleteOnboarding({
      parentName: cleanParentName,
      role: parentRole,
      country: coreCountry,
      city: finalCity,
      currency: getSuggestedCurrencyForCountry(coreCountry),
      phoneNumber: cleanPhone,
      email: sessionProfile.email,
      emailVerified: genuineEmailVerified,
      phoneVerified: genuinePhoneVerified,
      childProfile: {
        name: primaryChild.name,
        gender: primaryChild.gender,
        birth: primaryChild.birth,
        interests: primaryChild.interests,
        avatarTheme: primaryChild.avatarTheme,
      },
      childrenProfiles: enrichedChildrenList,
      isCoParentLinked: linkCoParent,
      coParentName: sessionProfile.coParentName,
      coParentEmail: sessionProfile.coParentEmail,
      coParentPhone: sessionProfile.coParentPhone,
      verificationChannel: 'email',
      persistedSession: sessionProfile,
      syncedToDb: finalSyncedToDb,
      dbSyncError: childrenSyncError,
    });
  };

  return (
    <div
      id="onboarding-wizard-modal"
      data-testid="onboarding-wizard-modal"
      role="dialog"
      aria-modal="true"
      aria-label={isEn ? 'Nekbaar Authentication' : 'نكبر'}
      dir={isEn ? 'ltr' : 'rtl'}
      className="fixed inset-0 z-50 bg-slate-100/95 dark:bg-[#0B131A] overflow-y-auto flex flex-col items-center justify-start sm:justify-center p-3 pt-safe pb-safe"
    >
      <div className="w-full max-w-[430px] mx-auto my-auto flex flex-col justify-center">
        {/* Minimalist Card Container */}
        <div className="w-full rounded-3xl bg-white dark:bg-[#101D26] border border-slate-200/80 dark:border-[#1E3646] shadow-xl p-5 sm:p-6 space-y-5 relative">
          {!isMandatoryGateway && (
            <button
              type="button"
              onClick={onClose}
              aria-label={isEn ? 'Close' : 'إغلاق'}
              className="absolute top-4 end-4 min-w-[48px] min-h-[48px] rounded-full bg-slate-100 dark:bg-[#142430] text-slate-600 dark:text-slate-300 flex items-center justify-center text-sm font-bold hover:bg-slate-200 transition-colors cursor-pointer"
            >
              ✕
            </button>
          )}

          {/* Centered Brand Logo, Title & Official Slogan */}
          <div className="flex flex-col items-center text-center space-y-1.5 pt-1">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#0d9488] to-[#14b8a6] flex items-center justify-center shadow-md">
              <span className="text-2xl font-black text-white select-none">ن</span>
            </div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              {isEn ? 'Nekbaar' : 'نكبر'}
            </h1>
            <p
              data-testid="auth-official-slogan"
              className="text-xs font-bold text-[#0d9488] dark:text-[#2DD4BF] leading-snug"
            >
              {officialSlogan}
            </p>
          </div>

          {errorMsg && (
            <div
              role="alert"
              className="rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 px-4 py-2.5 text-xs font-bold text-rose-600 dark:text-rose-300 text-center"
            >
              {errorMsg}
            </div>
          )}

          {dbSyncWarning && !errorMsg && (
            <div
              role="status"
              data-testid="onboarding-db-sync-warning"
              className="rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 px-4 py-2 text-xs font-bold text-amber-700 dark:text-amber-300 text-center"
            >
              {dbSyncWarning}
            </div>
          )}

          {pendingVerificationEmail && (
            <div
              data-testid="auth-otp-verification-box"
              className="rounded-2xl bg-teal-50 dark:bg-[#142430] border border-teal-300 dark:border-teal-700/60 p-3.5 space-y-2.5"
            >
              <p className="text-xs font-extrabold text-teal-900 dark:text-teal-200 text-center">
                {otpStatusMsg ||
                  (isEn
                    ? `Verify your email (${pendingVerificationEmail})`
                    : `تأكيد البريد الإلكتروني (${pendingVerificationEmail})`)}
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  dir="ltr"
                  data-testid="auth-otp-code-input"
                  value={verificationOtpCode}
                  onChange={(e) => setVerificationOtpCode(e.target.value)}
                  placeholder={isEn ? '6-digit OTP code' : 'رمز التحقق (6 أرقام)'}
                  aria-label={isEn ? 'Verification code' : 'رمز التحقق'}
                  className="flex-1 min-h-[42px] px-4 rounded-full border border-teal-300 dark:border-[#1E3646] bg-white dark:bg-[#101D26] text-xs font-bold text-slate-900 dark:text-white text-center"
                />
                <button
                  type="button"
                  data-testid="auth-otp-verify-btn"
                  onClick={handleVerifyIdentityOtp}
                  className="min-h-[42px] px-4 rounded-full bg-[#0d9488] text-white text-xs font-black cursor-pointer"
                >
                  {isEn ? 'Verify' : 'تأكيد'}
                </button>
              </div>
              <div className="text-center">
                <button
                  type="button"
                  data-testid="auth-otp-resend-btn"
                  onClick={handleResendIdentityOtp}
                  className="text-[11px] font-bold text-[#0d9488] dark:text-[#2DD4BF] hover:underline cursor-pointer"
                >
                  {isEn ? 'Resend verification code' : 'إعادة إرسال رمز التحقق'}
                </button>
              </div>
            </div>
          )}

          {/* =================================================================
              VIEW 1: MINIMALIST CARD-BASED SIGN-IN / REGISTRATION GATEWAY
              ================================================================= */}
          {activeView === 'AUTH' && (
            <form onSubmit={handleFirstStepSubmit} className="space-y-3.5" noValidate>
              {/* Clean Top Segmented Toggle: Registration vs Sign-In */}
              <div className="grid grid-cols-2 gap-1.5 p-1 rounded-full bg-slate-100 dark:bg-[#142430] border border-slate-200/70 dark:border-[#1E3646]">
                <button
                  type="button"
                  data-testid="auth-tab-signup"
                  onClick={() => {
                    setErrorMsg(null);
                    setAuthMode('signup');
                  }}
                  className={`min-h-[48px] rounded-full text-xs font-black transition-all cursor-pointer ${
                    authMode === 'signup'
                      ? 'bg-white dark:bg-[#0d9488] text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {isEn ? 'Create Account' : 'إنشاء حساب'}
                </button>
                <button
                  type="button"
                  data-testid="auth-tab-signin"
                  onClick={() => {
                    setErrorMsg(null);
                    setAuthMode('signin');
                  }}
                  className={`min-h-[48px] rounded-full text-xs font-black transition-all cursor-pointer ${
                    authMode === 'signin'
                      ? 'bg-white dark:bg-[#0d9488] text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {isEn ? 'Sign In' : 'تسجيل الدخول'}
                </button>
              </div>

              {/* Family Role Selector Quick Toggle: [أب / Father] or [أم / Mother] */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  data-testid="role-toggle-dad"
                  onClick={() => handleSelectRole('dad')}
                  className={`min-h-[48px] rounded-full border text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    parentRole === 'dad'
                      ? 'border-[#0d9488] bg-[#0d9488]/10 text-[#0d9488] dark:text-[#2DD4BF]'
                      : 'border-slate-200 dark:border-[#1E3646] bg-slate-50 dark:bg-[#142430] text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <span>👨🏻‍🍼</span>
                  <span>{isEn ? 'Father' : 'أب'}</span>
                </button>
                <button
                  type="button"
                  data-testid="role-toggle-mom"
                  onClick={() => handleSelectRole('mom')}
                  className={`min-h-[48px] rounded-full border text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    parentRole === 'mom'
                      ? 'border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-300'
                      : 'border-slate-200 dark:border-[#1E3646] bg-slate-50 dark:bg-[#142430] text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <span>👩🏻‍🍼</span>
                  <span>{isEn ? 'Mother' : 'أم'}</span>
                </button>
              </div>

              {/* Full Name (الاسم الكامل) */}
              {authMode === 'signup' && (
                <div>
                  <input
                    id="auth-full-name-input"
                    data-testid="auth-full-name-input"
                    type="text"
                    autoComplete="name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={isEn ? 'Full Name' : 'الاسم الكامل'}
                    aria-label={isEn ? 'Full Name' : 'الاسم الكامل'}
                    className="w-full min-h-[48px] px-5 rounded-full border border-slate-200 dark:border-[#1E3646] bg-slate-50 dark:bg-[#142430] text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#0d9488] transition-colors"
                  />
                </div>
              )}

              {/* Email (البريد الإلكتروني) */}
              <div>
                <input
                  id="auth-email-input"
                  data-testid="auth-email-input"
                  type="email"
                  dir="ltr"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={isEn ? 'Email Address' : 'البريد الإلكتروني'}
                  aria-label={isEn ? 'Email Address' : 'البريد الإلكتروني'}
                  className="w-full min-h-[48px] px-5 rounded-full border border-slate-200 dark:border-[#1E3646] bg-slate-50 dark:bg-[#142430] text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#0d9488] transition-colors text-start"
                />
              </div>

              {/* Password (كلمة المرور) */}
              <div>
                <input
                  id="auth-password-input"
                  data-testid="auth-password-input"
                  type="password"
                  dir="ltr"
                  autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isEn ? 'Password' : 'كلمة المرور'}
                  aria-label={isEn ? 'Password' : 'كلمة المرور'}
                  className="w-full min-h-[48px] px-5 rounded-full border border-slate-200 dark:border-[#1E3646] bg-slate-50 dark:bg-[#142430] text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#0d9488] transition-colors text-start"
                />
              </div>

              {/* Phone Number + Restricted Country Selector (Egypt & GCC Only) */}
              {authMode === 'signup' && (
                <>
                  {/* Country Dropdown (Strictly Egypt & GCC) */}
                  <div>
                    <select
                      id="auth-country-select"
                      data-testid="auth-country-select"
                      value={selectedCountryCode}
                      onChange={(e) =>
                        setSelectedCountryCode(e.target.value as AllowedGCCOrEgyptCountry)
                      }
                      aria-label={isEn ? 'Country' : 'الدولة'}
                      className="w-full min-h-[48px] px-5 rounded-full border border-slate-200 dark:border-[#1E3646] bg-slate-50 dark:bg-[#142430] text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-[#0d9488] transition-colors cursor-pointer"
                    >
                      {EGYPT_AND_GCC_COUNTRIES.map((countryItem) => (
                        <option key={countryItem.code} value={countryItem.code}>
                          {isEn ? countryItem.nameEn : countryItem.nameAr} ({countryItem.dialCode})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Dynamic Location Feature: Current Location GPS vs Manual City Selection */}
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        data-testid="location-mode-gps-btn"
                        onClick={handleDetectCurrentLocationGps}
                        className={`min-h-[48px] px-3 rounded-full border text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          locationMode === 'gps'
                            ? 'border-[#0d9488] bg-[#0d9488]/12 text-[#0d9488] dark:text-[#2DD4BF]'
                            : 'border-slate-200 dark:border-[#1E3646] bg-slate-50 dark:bg-[#142430] text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        <span>📍</span>
                        <span>
                          {isLocatingGps
                            ? isEn
                              ? 'Locating...'
                              : 'جاري التحديد...'
                            : isEn
                            ? 'Current Location'
                            : 'الموقع الحالي'}
                        </span>
                      </button>

                      <button
                        type="button"
                        data-testid="location-mode-manual-btn"
                        onClick={() => setLocationMode('manual')}
                        className={`min-h-[48px] px-3 rounded-full border text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          locationMode === 'manual'
                            ? 'border-[#0d9488] bg-[#0d9488]/12 text-[#0d9488] dark:text-[#2DD4BF]'
                            : 'border-slate-200 dark:border-[#1E3646] bg-slate-50 dark:bg-[#142430] text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        <span>🏙️</span>
                        <span>{isEn ? 'Choose Your City' : 'اختر مدينتك'}</span>
                      </button>
                    </div>

                    {locationMode === 'manual' ? (
                      <select
                        id="auth-city-select"
                        data-testid="auth-city-select"
                        value={selectedCityAr}
                        onChange={(e) => setSelectedCityAr(e.target.value)}
                        aria-label={isEn ? 'City' : 'المدينة'}
                        className="w-full min-h-[48px] px-5 rounded-full border border-slate-200 dark:border-[#1E3646] bg-slate-50 dark:bg-[#142430] text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-[#0d9488] transition-colors cursor-pointer"
                      >
                        {activeCountryObj.cities.map((cityItem) => (
                          <option key={cityItem.ar} value={cityItem.ar}>
                            {isEn ? cityItem.en : cityItem.ar}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="min-h-[48px] px-5 rounded-full border border-teal-500/30 bg-teal-500/8 flex items-center justify-between text-xs font-bold text-[#0d9488] dark:text-[#2DD4BF]">
                        <span>
                          📍{' '}
                          {isEn
                            ? activeCountryObj.cities.find((c) => c.ar === selectedCityAr)?.en ||
                              activeCountryObj.defaultCityEn
                            : selectedCityAr}
                        </span>
                        <span className="text-[11px] opacity-80">GPS</span>
                      </div>
                    )}
                  </div>

                  {/* Clear Country + City + Currency + Dial Code Summary Strip */}
                  <div
                    data-testid="onboarding-region-summary"
                    className="rounded-2xl border border-teal-500/25 bg-teal-50/70 dark:bg-[#142430] px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-[11px] font-extrabold text-teal-900 dark:text-[#2DD4BF]"
                  >
                    <span>
                      🌍 {isEn ? activeCountryObj.nameEn : activeCountryObj.nameAr} ·{' '}
                      {isEn
                        ? activeCountryObj.cities.find((c) => c.ar === selectedCityAr)?.en ||
                          activeCountryObj.defaultCityEn
                        : selectedCityAr}
                    </span>
                    <span dir="ltr" className="tabular-nums">
                      {activeCountryObj.dialCode} ·{' '}
                      {getSuggestedCurrencyForCountry(activeCountryObj.mappedCoreCountry)}
                    </span>
                  </div>

                  {/* Phone Number Input */}
                  <div className="flex items-center gap-2" dir="ltr">
                    <span className="min-h-[48px] px-4 rounded-full border border-slate-200 dark:border-[#1E3646] bg-slate-100 dark:bg-[#142430] text-xs font-black text-slate-700 dark:text-slate-200 inline-flex items-center justify-center shrink-0 tabular-nums">
                      {activeCountryObj.dialCode}
                    </span>
                    <input
                      id="auth-phone-input"
                      data-testid="auth-phone-input"
                      type="tel"
                      autoComplete="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder={isEn ? 'Phone Number' : 'رقم الهاتف'}
                      aria-label={isEn ? 'Phone Number' : 'رقم الهاتف'}
                      className="w-full min-h-[48px] px-5 rounded-full border border-slate-200 dark:border-[#1E3646] bg-slate-50 dark:bg-[#142430] text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#0d9488] transition-colors"
                    />
                  </div>
                </>
              )}

              {/* Smooth Pill Primary Action Button ("متابعة" / "Next") */}
              <button
                type="submit"
                id="auth-primary-submit-btn"
                data-testid="auth-primary-submit-btn"
                disabled={isSubmitting}
                className="w-full min-h-[48px] rounded-full bg-[#0d9488] hover:bg-[#0f766e] active:scale-[0.99] text-white text-sm font-black shadow-md transition-all cursor-pointer flex items-center justify-center"
              >
                {isSubmitting
                  ? isEn
                    ? 'Loading...'
                    : 'جاري المتابعة...'
                  : isEn
                  ? 'Next'
                  : 'متابعة'}
              </button>

              {/* Official Branded Social Logins: Gmail, iCloud, Facebook, Outlook */}
              <div className="pt-2 space-y-2.5">
                <div className="relative flex items-center justify-center">
                  <div className="border-t border-slate-200 dark:border-[#1E3646] w-full" />
                  <span className="bg-white dark:bg-[#101D26] px-3 text-[11px] font-bold text-slate-400 shrink-0">
                    {isEn ? 'Or continue with' : 'أو المتابعة السريعة عبر'}
                  </span>
                  <div className="border-t border-slate-200 dark:border-[#1E3646] w-full" />
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {/* Gmail */}
                  <button
                    type="button"
                    data-testid="social-auth-gmail"
                    onClick={() => handleSocialQuickAuth('gmail')}
                    title="Gmail"
                    aria-label="Gmail"
                    className="min-h-[48px] rounded-2xl border border-slate-200 dark:border-[#1E3646] bg-slate-50 dark:bg-[#142430] hover:border-slate-300 flex flex-col items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        fill="#EA4335"
                        d="M12 10.2v3.6h5.1c-.2 1.2-.9 2.2-1.9 2.9l3.1 2.4c1.8-1.7 2.8-4.1 2.8-7 0-.7-.1-1.3-.2-1.9H12z"
                      />
                      <path
                        fill="#34A853"
                        d="M6.6 14.3l-.7.5-2.5 1.9C5 19.8 8.2 22 12 22c2.7 0 5-.9 6.6-2.4l-3.1-2.4c-.9.6-2 .9-3.5.9-2.7 0-5-1.8-5.8-4.3z"
                      />
                      <path
                        fill="#4A90E2"
                        d="M3.4 7.3C2.5 9 2 10.9 2 13s.5 4 1.4 5.7l3.2-2.4c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L3.4 7.3z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M12 5.8c1.5 0 2.8.5 3.9 1.5l2.9-2.9C17 2.8 14.7 2 12 2 8.2 2 5 4.2 3.4 7.3l3.2 2.4c.8-2.5 3.1-3.9 5.4-3.9z"
                      />
                    </svg>
                    <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">
                      Gmail
                    </span>
                  </button>

                  {/* iCloud */}
                  <button
                    type="button"
                    data-testid="social-auth-icloud"
                    onClick={() => handleSocialQuickAuth('icloud')}
                    title="iCloud"
                    aria-label="iCloud"
                    className="min-h-[48px] rounded-2xl border border-slate-200 dark:border-[#1E3646] bg-slate-50 dark:bg-[#142430] hover:border-slate-300 flex flex-col items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer"
                  >
                    <svg
                      className="w-4 h-4 text-slate-900 dark:text-white"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.53 4.08zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                    </svg>
                    <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">
                      iCloud
                    </span>
                  </button>

                  {/* Facebook */}
                  <button
                    type="button"
                    data-testid="social-auth-facebook"
                    onClick={() => handleSocialQuickAuth('facebook')}
                    title="Facebook"
                    aria-label="Facebook"
                    className="min-h-[48px] rounded-2xl border border-slate-200 dark:border-[#1E3646] bg-slate-50 dark:bg-[#142430] hover:border-slate-300 flex flex-col items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        fill="#1877F2"
                        d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z"
                      />
                    </svg>
                    <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">
                      Facebook
                    </span>
                  </button>

                  {/* Outlook */}
                  <button
                    type="button"
                    data-testid="social-auth-outlook"
                    onClick={() => handleSocialQuickAuth('outlook')}
                    title="Outlook"
                    aria-label="Outlook"
                    className="min-h-[48px] rounded-2xl border border-slate-200 dark:border-[#1E3646] bg-slate-50 dark:bg-[#142430] hover:border-slate-300 flex flex-col items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                      <path fill="#F25022" d="M3 3h8.5v8.5H3z" />
                      <path fill="#7FBA00" d="M12.5 3H21v8.5h-8.5z" />
                      <path fill="#00A4EF" d="M3 12.5h8.5V21H3z" />
                      <path fill="#FFB900" d="M12.5 12.5H21V21h-8.5z" />
                    </svg>
                    <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">
                      Outlook
                    </span>
                  </button>
                </div>
              </div>

              {/* Bottom Toggle between Login and Registration */}
              <div className="pt-1 text-center">
                <button
                  type="button"
                  data-testid="auth-mode-toggle-btn"
                  onClick={() => {
                    setErrorMsg(null);
                    setAuthMode((prev) => (prev === 'signup' ? 'signin' : 'signup'));
                  }}
                  className="min-h-[48px] px-4 rounded-full text-xs font-bold text-[#0d9488] dark:text-[#2DD4BF] hover:underline inline-flex items-center justify-center cursor-pointer"
                >
                  {authMode === 'signup'
                    ? isEn
                      ? 'Already have an account? Sign In'
                      : 'لديك حساب بالفعل؟ تسجيل الدخول'
                    : isEn
                    ? 'Create a new account'
                    : 'إنشاء حساب جديد'}
                </button>
              </div>
            </form>
          )}

          {/* =================================================================
              VIEW 2: MINIMALIST CHILDREN PROFILES SETUP (ملفات الأطفال)
              ================================================================= */}
          {activeView === 'CHILDREN' && (
            <div className="space-y-4">
              <div className="text-center">
                <h2 className="text-base font-black text-slate-800 dark:text-slate-100">
                  {isEn ? 'Children’s Profiles' : 'ملفات أطفالك'}
                </h2>
              </div>

              {/* Existing Children Pills */}
              <div className="space-y-2 max-h-[210px] overflow-y-auto pr-0.5">
                {safeChildrenList.map((child) => {
                  const ageInfo = calculateChildAge(child.birth, language);
                  return (
                    <div
                      key={child.id}
                      className="flex items-center justify-between gap-2 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-[#1E3646] bg-slate-50 dark:bg-[#142430]"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-teal-500/10 flex items-center justify-center shrink-0">
                          <ThreeDChildAvatar
                            gender={child.gender}
                            theme={child.avatarTheme}
                            size={28}
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-black text-slate-900 dark:text-white truncate">
                            {child.name}
                          </p>
                          <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                            {ageInfo.label}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveChild(child.id)}
                        aria-label={isEn ? 'Remove child' : 'حذف'}
                        className="min-w-[48px] min-h-[48px] rounded-full text-slate-400 hover:text-rose-500 flex items-center justify-center text-xs font-bold cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Add Child Form */}
              <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-[#1E3646]">
                <input
                  id="onboarding-child-name-input"
                  data-testid="onboarding-child-name-input"
                  type="text"
                  value={newChildName}
                  onChange={(e) => setNewChildName(e.target.value)}
                  placeholder={isEn ? 'Child Name' : 'اسم الطفل'}
                  aria-label={isEn ? 'Child Name' : 'اسم الطفل'}
                  className="w-full min-h-[48px] px-5 rounded-full border border-slate-200 dark:border-[#1E3646] bg-slate-50 dark:bg-[#142430] text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#0d9488]"
                />

                <div className="grid grid-cols-2 gap-2">
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setNewChildGender('boy')}
                      className={`min-h-[48px] rounded-full border text-xs font-black cursor-pointer transition-colors ${
                        newChildGender === 'boy'
                          ? 'border-[#0d9488] bg-[#0d9488]/10 text-[#0d9488] dark:text-[#2DD4BF]'
                          : 'border-slate-200 dark:border-[#1E3646] bg-slate-50 dark:bg-[#142430] text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {isEn ? 'Boy' : 'ولد'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewChildGender('girl')}
                      className={`min-h-[48px] rounded-full border text-xs font-black cursor-pointer transition-colors ${
                        newChildGender === 'girl'
                          ? 'border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-300'
                          : 'border-slate-200 dark:border-[#1E3646] bg-slate-50 dark:bg-[#142430] text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {isEn ? 'Girl' : 'بنت'}
                    </button>
                  </div>

                  <input
                    type="date"
                    value={newChildBirth}
                    onChange={(e) => setNewChildBirth(e.target.value)}
                    aria-label={isEn ? 'Birth Date' : 'تاريخ الميلاد'}
                    className="w-full min-h-[48px] px-3 rounded-full border border-slate-200 dark:border-[#1E3646] bg-slate-50 dark:bg-[#142430] text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-[#0d9488]"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleAddChild}
                  className="w-full min-h-[48px] rounded-full border border-[#0d9488]/40 bg-[#0d9488]/10 text-[#0d9488] dark:text-[#2DD4BF] text-xs font-black hover:bg-[#0d9488]/20 transition-colors cursor-pointer"
                >
                  + {isEn ? 'Add Child' : 'إضافة طفل'}
                </button>
              </div>

              {/* Navigation Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  id="onboarding-children-next-btn"
                  data-testid="onboarding-children-next-btn"
                  onClick={handleProceedFromChildrenStep}
                  className="w-full min-h-[48px] rounded-full bg-[#0d9488] hover:bg-[#0f766e] active:scale-[0.99] text-white text-sm font-black shadow-md transition-all cursor-pointer flex items-center justify-center"
                >
                  {isEn ? 'Next' : 'متابعة'}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveView('AUTH')}
                  className="w-full min-h-[48px] rounded-full text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  {isEn ? 'Back' : 'رجوع'}
                </button>
              </div>
            </div>
          )}

          {/* =================================================================
              VIEW 3: OPTIONAL CO-PARENT LINKING (ربط حساب الشريك)
              ================================================================= */}
          {activeView === 'PARTNER' && (
            <div className="space-y-4">
              <div className="text-center">
                <h2 className="text-base font-black text-slate-800 dark:text-slate-100">
                  {isEn ? 'Invite a Co-Parent' : 'دعوة ولي الأمر الآخر'}
                </h2>
              </div>

              <div className="space-y-3">
                <input
                  type="text"
                  value={coParentName}
                  onChange={(e) => setCoParentName(e.target.value)}
                  placeholder={isEn ? 'Co-Parent Name' : 'اسم ولي الأمر الآخر'}
                  aria-label={isEn ? 'Co-Parent Name' : 'اسم ولي الأمر الآخر'}
                  className="w-full min-h-[48px] px-5 rounded-full border border-slate-200 dark:border-[#1E3646] bg-slate-50 dark:bg-[#142430] text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#0d9488]"
                />
                <input
                  type="email"
                  dir="ltr"
                  value={coParentEmail}
                  onChange={(e) => setCoParentEmail(e.target.value)}
                  placeholder={isEn ? 'Co-Parent Email' : 'بريد ولي الأمر الآخر'}
                  aria-label={isEn ? 'Co-Parent Email' : 'بريد ولي الأمر الآخر'}
                  className="w-full min-h-[48px] px-5 rounded-full border border-slate-200 dark:border-[#1E3646] bg-slate-50 dark:bg-[#142430] text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#0d9488] text-start"
                />
                <input
                  type="tel"
                  dir="ltr"
                  value={coParentPhone}
                  onChange={(e) => setCoParentPhone(e.target.value)}
                  placeholder={isEn ? 'Co-Parent Phone' : 'رقم جوال ولي الأمر الآخر'}
                  aria-label={isEn ? 'Co-Parent Phone' : 'رقم جوال ولي الأمر الآخر'}
                  className="w-full min-h-[48px] px-5 rounded-full border border-slate-200 dark:border-[#1E3646] bg-slate-50 dark:bg-[#142430] text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#0d9488] text-start"
                />
              </div>

              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  id="onboarding-complete-btn"
                  data-testid="onboarding-complete-btn"
                  disabled={isSubmitting}
                  onClick={() => handleFinalizeFlow(true)}
                  className="w-full min-h-[48px] rounded-full bg-[#0d9488] hover:bg-[#0f766e] active:scale-[0.99] text-white text-sm font-black shadow-md transition-all cursor-pointer flex items-center justify-center"
                >
                  {isSubmitting
                    ? isEn
                      ? 'Saving...'
                      : 'جاري الحفظ...'
                    : isEn
                    ? 'Link & Start'
                    : 'ربط الحساب والبدء'}
                </button>

                <button
                  type="button"
                  data-testid="onboarding-skip-coparent-btn"
                  disabled={isSubmitting}
                  onClick={() => handleFinalizeFlow(false)}
                  className="w-full min-h-[48px] rounded-full border border-slate-200 dark:border-[#1E3646] bg-slate-50 dark:bg-[#142430] text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 cursor-pointer flex items-center justify-center"
                >
                  {isEn ? 'Skip for now' : 'تخطي في الوقت الحالي'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

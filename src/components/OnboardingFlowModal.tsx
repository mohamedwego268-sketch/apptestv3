import React, { useState, useEffect } from 'react';
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
import { AVATAR_ACCESSORY_THEMES, AvatarAccessoryTheme } from '../domain/assetManifest3D';
import { ThreeDChildAvatar } from './ThreeDVisuals';

interface OnboardingCompletionPayload {
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
  const [authMode, setAuthMode] = useState<'register' | 'login' | 'join_qr'>('register');
  const [joinFamilyCode, setJoinFamilyCode] = useState<string>('FS-FAM-8824');
  const [joinMemberRoleLabel, setJoinMemberRoleLabel] = useState<string>('الأم (Mother)');

  // Step 1: Account & OTP
  const [email, setEmail] = useState<string>('sara.mom@familyspace.demo');
  const [phone, setPhone] = useState<string>('1012345678');
  const [otpInput, setOtpInput] = useState<string>('123456');

  // Step 2: Country & Dependent City
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(initialCountry);
  const [isLoadingCities, setIsLoadingCities] = useState<boolean>(false);
  const [selectedCity, setSelectedCity] = useState<string>(initialCity || 'القاهرة');

  // Step 3: Parent Profile
  const [parentName, setParentName] = useState<string>(initialParentName || 'سارة وأحمد');
  const [parentRole, setParentRole] = useState<ParentThemeRole>(initialRole);

  // Step 4: Child Profile
  const [childName, setChildName] = useState<string>('ليان');
  const [childGender, setChildGender] = useState<'boy' | 'girl'>('girl');
  const [childBirth, setChildBirth] = useState<string>('2023-06-15');
  const [childInterests, setChildInterests] = useState<string>('القصص المصورة، المكعبات، والرسم');
  const [childAvatarTheme, setChildAvatarTheme] = useState<AvatarAccessoryTheme>('artist');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const availableCities = COUNTRY_CITIES_MAP[selectedCountry] || [];

  // Handle Country -> City dependency with loading & default selection
  const handleSelectCountry = (nextCountry: CountryCode) => {
    setSelectedCountry(nextCountry);
    setSelectedCity('');
    setIsLoadingCities(true);
    setErrorMsg(null);
    window.setTimeout(() => {
      setIsLoadingCities(false);
      const firstCity = COUNTRY_CITIES_MAP[nextCountry]?.[0]?.id || '';
      setSelectedCity(firstCity);
      if (nextCountry === 'SA' && phone === '1012345678') {
        setPhone('551234567');
      } else if (nextCountry === 'EG' && phone === '551234567') {
        setPhone('1012345678');
      }
    }, 180);
  };

  useEffect(() => {
    if (!isOpen) return;
    setErrorMsg(null);
  }, [isOpen, step]);

  if (!isOpen) return null;

  const handleNextStep = () => {
    setErrorMsg(null);
    if (step === 1) {
      if (!email.trim() || !email.includes('@')) {
        setErrorMsg(
          isEn ? 'Please enter a valid email address.' : 'يرجى إدخال بريد إلكتروني صحيح.'
        );
        return;
      }
      const phoneCheck = validatePhoneForCountry(phone, selectedCountry);
      if (!phoneCheck.valid) {
        setErrorMsg(isEn ? phoneCheck.errorEn || 'Invalid phone' : phoneCheck.errorAr || 'رقم غير صالح');
        return;
      }
      if (otpInput.trim() !== DEMO_OTP_CODE) {
        setErrorMsg(
          isEn
            ? `Invalid demo OTP code. Use ${DEMO_OTP_CODE}.`
            : `رمز التحقق التجريبي غير صحيح. استخدم الرمز ${DEMO_OTP_CODE}.`
        );
        return;
      }
      setStep(2);
      return;
    }

    if (step === 2) {
      if (!selectedCity) {
        setErrorMsg(
          isEn
            ? 'Please select your city to customize local doctors, nurseries, and stores.'
            : 'يرجى اختيار المدينة لتخصيص الأطباء والحضانات والمتاجر القريبة منك.'
        );
        return;
      }
      setStep(3);
      return;
    }

    if (step === 3) {
      if (!parentName.trim()) {
        setErrorMsg(
          isEn ? 'Please enter parent / family display name.' : 'يرجى كتابة اسم الوالد / الأسرة.'
        );
        return;
      }
      setStep(4);
      return;
    }

    if (step === 4) {
      const childCheck = validateChildInput({ name: childName, birth: childBirth });
      if (!childCheck.valid) {
        setErrorMsg(childCheck.error || (isEn ? 'Invalid child data' : 'بيانات الطفل غير صالحة'));
        return;
      }
      onCompleteOnboarding({
        parentName: parentName.trim(),
        role: parentRole,
        country: selectedCountry,
        city: selectedCity,
        currency: getSuggestedCurrencyForCountry(selectedCountry),
        phoneNumber: phone,
        email: email.trim(),
        childProfile: {
          name: childName.trim(),
          gender: childGender,
          birth: childBirth,
          interests: childInterests.trim(),
          avatarTheme: childAvatarTheme,
        },
      });
    }
  };

  const previewAge = calculateChildAge(childBirth, language);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-modal-title"
    >
      <div className="soft-card-surface w-full max-w-2xl rounded-[22px] border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-surface)] dark:bg-[#101D26] p-4 sm:p-6 space-y-4 max-h-[92vh] overflow-y-auto shadow-2xl">
        {/* Header & Step Progress */}
        <div className="flex items-start justify-between gap-3 pb-2.5 border-b border-[var(--color-border)]">
          <div>
            <div className="text-[11px] font-extrabold text-[var(--color-role-text)]">
              🚀 {isEn ? `Nekbaar · Interactive Registration & QR Setup (Step ${step} of 4)` : `نكبر · معالج التسجيل وربط الأسرة عبر QR (الخطوة ${step} من 4)`}
            </div>
            <h2 id="onboarding-modal-title" className="text-base sm:text-lg font-extrabold text-[var(--color-text)] mt-0.5">
              {step === 1
                ? isEn
                  ? '1. Account Registration, Login & Family QR Link'
                  : '١. إنشاء حساب أو تسجيل الدخول أو الربط برمز QR'
                : step === 2
                ? isEn
                  ? '2. Select Your Country & Governorate / Region (Location-Aware Ecosystem)'
                  : '٢. اختيار الدولة والمحافظة / المنطقة (لتخصيص الأطباء والحضانات والمتجر)'
                : step === 3
                ? isEn
                  ? '3. Parent Profile & Visual Experience Setup'
                  : '٣. إعداد ملف الوالد/الوالدة والسمة البصرية'
                : isEn
                ? '4. Child Profile & 3D Identity Setup'
                : '٤. إعداد ملف الطفل والهوية ثلاثية الأبعاد'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={isEn ? 'Close registration wizard' : 'إغلاق نافذة التسجيل'}
            className="w-8 h-8 rounded-xl text-lg font-black leading-none border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-muted)] dark:bg-[#142430] text-[var(--color-text)] hover:border-[#FF8C61] flex items-center justify-center shrink-0 cursor-pointer"
          >
            ×
          </button>
        </div>

        {/* Step Indicator Pills */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { num: 1, labelAr: '١. الحساب وQR', labelEn: '1. Account & QR' },
            { num: 2, labelAr: '٢. الدولة والمحافظة', labelEn: '2. Location' },
            { num: 3, labelAr: '٣. ملف الوالد', labelEn: '3. Parent' },
            { num: 4, labelAr: '٤. ملف الطفل', labelEn: '4. Child' },
          ].map((s) => (
            <button
              key={s.num}
              type="button"
              onClick={() => setStep(s.num as 1 | 2 | 3 | 4)}
              className={`py-1.5 px-2 rounded-xl text-xs font-extrabold text-center transition-colors ${
                step === s.num
                  ? 'bg-[var(--color-accent)] text-[var(--color-accent-contrast)]'
                  : step > s.num
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-[var(--color-control-muted)] text-[var(--color-muted)]'
              }`}
            >
              {isEn ? s.labelEn : s.labelAr}
            </button>
          ))}
        </div>

        {errorMsg && (
          <div className="rounded-xl border border-red-300 bg-red-50 px-3.5 py-2.5 text-xs font-bold text-red-800" role="alert">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* STEP 1: ACCOUNT REGISTRATION / LOGIN / QR FAMILY LINK */}
        {step === 1 && (
          <div className="space-y-3.5">
            <div className="flex flex-wrap gap-1 p-1 rounded-xl bg-[var(--color-control-muted)]">
              <button
                type="button"
                onClick={() => setAuthMode('register')}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold ${
                  authMode === 'register'
                    ? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-2xs'
                    : 'text-[var(--color-muted)]'
                }`}
              >
                {isEn ? 'Create New Account' : 'إنشاء حساب أسرة جديد'}
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold ${
                  authMode === 'login'
                    ? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-2xs'
                    : 'text-[var(--color-muted)]'
                }`}
              >
                {isEn ? 'Sign In' : 'تسجيل الدخول'}
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('join_qr')}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold ${
                  authMode === 'join_qr'
                    ? 'bg-teal-700 text-white shadow-2xs'
                    : 'text-[var(--color-muted)]'
                }`}
              >
                📲 {isEn ? 'Join Family via QR / Code' : 'الانضمام لأسرة عبر QR أو كود'}
              </button>
            </div>

            {authMode === 'join_qr' && (
              <div className="rounded-2xl border border-teal-200 bg-teal-50/75 p-3.5 space-y-2.5">
                <div className="text-xs font-extrabold text-teal-950">
                  📲 {isEn ? 'Scan Partner QR Code or Enter Family Invite Code' : 'امسح رمز QR من هاتف الأب/الأم أو أدخل كود الأسرة اليدوي'}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-[var(--color-text)] mb-1">
                      {isEn ? 'Family Invite Code' : 'كود ربط الأسرة'}
                    </label>
                    <input
                      type="text"
                      dir="ltr"
                      value={joinFamilyCode}
                      onChange={(e) => setJoinFamilyCode(e.target.value)}
                      className="w-full rounded-xl border border-teal-300 bg-white px-3 py-1.5 text-xs font-mono font-extrabold text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[var(--color-text)] mb-1">
                      {isEn ? 'Your Family Role' : 'صفتك في الأسرة'}
                    </label>
                    <select
                      value={joinMemberRoleLabel}
                      onChange={(e) => setJoinMemberRoleLabel(e.target.value)}
                      className="w-full rounded-xl border border-teal-300 bg-white px-3 py-1.5 text-xs font-bold"
                    >
                      <option value="الأم (Mother)">👩🏻‍💼 الأم (Mother)</option>
                      <option value="الأب (Father)">👨🏻‍💼 الأب (Father)</option>
                      <option value="الجدة (Grandmother)">👵🏻 الجدة (Grandmother)</option>
                      <option value="الجد (Grandfather)">👴🏻 الجد (Grandfather)</option>
                      <option value="العم / الخال (Uncle)">🧔🏻 العم / الخال (Uncle)</option>
                      <option value="العمة / الخالة (Aunt)">👩🏻 العمة / الخالة (Aunt)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[var(--color-text)] mb-1">
                  {isEn ? 'Email Address' : 'البريد الإلكتروني المرتبط بالحساب'}
                </label>
                <input
                  type="email"
                  dir="ltr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-3 py-2 text-xs text-[var(--color-text)]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[var(--color-text)] mb-1">
                  {isEn
                    ? `Mobile Number (${selectedCountry === 'SA' ? '+966' : '+20'})`
                    : `رقم الجوال (${selectedCountry === 'SA' ? '+966' : '+20'})`}
                </label>
                <input
                  type="tel"
                  dir="ltr"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-3 py-2 text-xs text-[var(--color-text)] tabular-nums"
                />
              </div>
            </div>

            <div className="rounded-xl bg-[var(--color-control-muted)] p-3 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <label className="text-xs font-bold text-[var(--color-text)]">
                  🔑 {isEn ? 'Simulated OTP Verification Code (Demo: 123456)' : 'رمز التحقق التجريبي عبر الجوال (الرمز: 123456)'}
                </label>
                <span dir="ltr" className="text-xs font-mono font-bold text-emerald-800">
                  OTP: 123456
                </span>
              </div>
              <input
                type="text"
                dir="ltr"
                maxLength={6}
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value)}
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-sm font-mono font-bold text-[var(--color-text)] tracking-widest text-center"
              />
            </div>
          </div>
        )}

        {/* STEP 2: COUNTRY & DEPENDENT GOVERNORATE / REGION SELECTION */}
        {step === 2 && (
          <div className="space-y-4">
            <p className="text-xs text-[var(--color-muted)] leading-relaxed">
              {isEn
                ? 'Choosing your country and governorate/region automatically personalizes local pediatricians, nurseries, stores, and currency across Nekbaar.'
                : 'اختيار الدولة والمحافظة أو المنطقة يضبط العملة تلقائيًا ويظهر لك الأطباء والعيادات والحضانات والمتاجر المتاحة في منطقتك داخل نكبر.'}
            </p>

            {/* Country Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(
                [
                  {
                    code: 'EG' as CountryCode,
                    titleAr: '🇪🇬 جمهورية مصر العربية (٢٧ محافظة)',
                    titleEn: '🇪🇬 Egypt (All 27 Governorates · EGP)',
                    subAr: 'القاهرة، الجيزة، الإسكندرية، القليوبية، الدقهلية، الشرقية وجميع المحافظات الـ ٢٧ · العملة: ج.م (EGP)',
                    subEn: 'Cairo, Giza, Alexandria, Qalyubia, Dakahlia, Sharqia & all 27 Governorates · Currency: EGP',
                  },
                  {
                    code: 'SA' as CountryCode,
                    titleAr: '🇸🇦 المملكة العربية السعودية (المناطق والمحافظات الرئيسية)',
                    titleEn: '🇸🇦 Saudi Arabia (Main Regions & Governorates · SAR)',
                    subAr: 'الرياض، مكة المكرمة، المدينة المنورة، الشرقية، القصيم، عسير، تبوك، حائل، جازان، نجران، الباحة، الجوف، الحدود الشمالية، الطائف، ينبع · العملة: ر.س (SAR)',
                    subEn: 'Riyadh, Makkah, Madinah, Eastern Province, Qassim, Asir, Tabuk, Hail, Jazan, Najran, Al-Baha, Al-Jouf, Northern Borders, Taif, Yanbu · SAR',
                  },
                ]
              ).map((c) => {
                const active = selectedCountry === c.code;
                return (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => handleSelectCountry(c.code)}
                    className={`soft-card-surface p-4 rounded-2xl border-2 text-start transition-all space-y-1 ${
                      active
                        ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)]'
                        : 'border-[var(--color-border)] bg-[var(--color-control-bg)]'
                    }`}
                  >
                    <div className="text-sm font-extrabold text-[var(--color-text)]">
                      {isEn ? c.titleEn : c.titleAr}
                    </div>
                    <div className="text-xs text-[var(--color-muted)] leading-relaxed">
                      {isEn ? c.subEn : c.subAr}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Dependent Governorate / Region Dropdown + Interactive Grid */}
            <div className="space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="block text-xs font-extrabold text-[var(--color-text)]">
                  📍{' '}
                  {selectedCountry === 'EG'
                    ? isEn
                      ? 'Select Governorate (All 27 Egyptian Governorates)'
                      : 'اختر المحافظة (جميع محافظات مصر الـ ٢٧ كاملة)'
                    : isEn
                    ? 'Select Region / Governorate (Main Saudi Regions & Cities)'
                    : 'اختر المنطقة أو المحافظة الرئيسية في المملكة'}
                </label>
                <span className="text-[11px] font-extrabold text-[#0d9488] dark:text-[#A5F3FC]">
                  {availableCities.length} {selectedCountry === 'EG' ? (isEn ? 'governorates' : 'محافظة') : (isEn ? 'regions' : 'منطقة ومحافظة')}
                </span>
              </div>

              {!isLoadingCities && availableCities.length > 0 && (
                <select
                  aria-label={isEn ? 'Quick select governorate or region' : 'اختيار سريع للمحافظة أو المنطقة'}
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full min-h-[42px] rounded-xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-surface)] dark:bg-[#101D26] px-3.5 py-2 text-xs font-extrabold text-[var(--color-text)] dark:text-[#F8FAFC]"
                >
                  {availableCities.map((cityItem) => (
                    <option key={cityItem.id} value={cityItem.id}>
                      {isEn ? cityItem.nameEn : cityItem.nameAr} — {isEn ? cityItem.regionEn : cityItem.regionAr}
                    </option>
                  ))}
                </select>
              )}

              {isLoadingCities ? (
                <div className="rounded-2xl border border-dashed border-[var(--color-border)] p-6 text-center text-xs font-bold text-[var(--color-muted)]">
                  ⏳ {isEn ? 'Loading governorates and local providers...' : 'جاري تحميل قائمة المحافظات ومقدمي الخدمات للدولة المختارة...'}
                </div>
              ) : availableCities.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[var(--color-border)] p-6 text-center text-xs text-[var(--color-muted)]">
                  {isEn ? 'No cities available.' : 'لا توجد مدن متاحة.'}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pe-1">
                  {availableCities.map((cityItem) => {
                    const isSelected = selectedCity === cityItem.id;
                    return (
                      <button
                        key={cityItem.id}
                        type="button"
                        onClick={() => setSelectedCity(cityItem.id)}
                        className={`soft-card-surface p-3 rounded-xl border text-start transition-all flex items-center justify-between gap-2 ${
                          isSelected
                            ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)] font-extrabold'
                            : 'border-[var(--color-border)] bg-[var(--color-control-bg)] hover:border-[var(--color-accent)]'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-extrabold text-[var(--color-text)]">
                            {isEn ? cityItem.nameEn : cityItem.nameAr}
                          </div>
                          <div className="text-[11px] text-[var(--color-muted)]">
                            {isEn ? cityItem.regionEn : cityItem.regionAr}
                          </div>
                        </div>
                        <span className="text-[11px] font-bold text-emerald-800 dark:text-[#A5F3FC] shrink-0 tabular-nums">
                          {cityItem.providersCount} {isEn ? 'providers' : 'خدمة وعيادة'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 3: PARENT PROFILE & VISUAL THEME */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[var(--color-text)] mb-1">
                {isEn ? 'Parent / Family Display Name' : 'اسم الوالد / الأسرة المعروض في المنصة'}
              </label>
              <input
                type="text"
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-3.5 py-2.5 text-sm text-[var(--color-text)]"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-[var(--color-text)]">
                🎨 {isEn ? 'Select Parent Profile & Color-Coded Theme' : 'اختر ملف الوالدين والسمة اللونية المخصصة'}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  { id: 'mom' as ParentThemeRole, titleAr: '🌸 حساب الأم (ماما سارة) — مرجاني ووردي دافئ', titleEn: '🌸 Mother Profile — Soft Coral & Warm Rose' },
                  { id: 'dad' as ParentThemeRole, titleAr: '🌊 حساب الأب (بابا أحمد) — تيل وأزرق أردوازي', titleEn: '🌊 Father Profile — Teal & Slate Blue' },
                  { id: 'high-contrast' as ParentThemeRole, titleAr: '👁️ تباين عالٍ للقراءة', titleEn: '👁️ High Contrast' },
                ].map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => {
                      setParentRole(r.id);
                      if (r.id === 'dad') setParentName('بابا (أحمد)');
                      if (r.id === 'mom') setParentName('ماما (سارة)');
                    }}
                    className={`p-3.5 rounded-xl border text-xs font-extrabold text-center ${
                      parentRole === r.id
                        ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-text)]'
                        : 'border-[var(--color-border)] bg-[var(--color-control-bg)] text-[var(--color-muted)]'
                    }`}
                  >
                    {isEn ? r.titleEn : r.titleAr}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: CHILD PROFILE CREATION */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-[var(--color-control-muted)] p-4 flex items-center gap-4">
              <ThreeDChildAvatar
                name={childName || 'طفل'}
                gender={childGender}
                stageCode={previewAge.stageCode}
                accessoryTheme={childAvatarTheme}
                size="lg"
              />
              <div className="space-y-1">
                <div className="text-sm font-extrabold text-[var(--color-text)]">
                  {childName || (isEn ? 'New Child Profile' : 'ملف الطفل الجديد')}
                </div>
                <div className="text-xs text-[var(--color-muted)]">
                  {previewAge.label} · {previewAge.stageTitle}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-[var(--color-text)] mb-1">
                  {isEn ? 'Child Name or Nickname' : 'اسم الطفل أو اسم الدلع'}
                </label>
                <input
                  type="text"
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-3.5 py-2 text-sm text-[var(--color-text)]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[var(--color-text)] mb-1">
                  {isEn ? 'Date of Birth' : 'تاريخ الميلاد'}
                </label>
                <input
                  type="date"
                  value={childBirth}
                  onChange={(e) => setChildBirth(e.target.value)}
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-3.5 py-2 text-sm text-[var(--color-text)]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-[var(--color-text)] mb-1">
                  {isEn ? 'Gender' : 'النوع'}
                </label>
                <select
                  value={childGender}
                  onChange={(e) => setChildGender(e.target.value as 'boy' | 'girl')}
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-3.5 py-2 text-xs font-bold text-[var(--color-text)]"
                >
                  <option value="girl">{isEn ? 'Girl (Rose 3D Theme)' : 'بنت — هوية روز ثلاثية الأبعاد'}</option>
                  <option value="boy">{isEn ? 'Boy (Aqua 3D Theme)' : 'ولد — هوية أكوا ثلاثية الأبعاد'}</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-[var(--color-text)] mb-1">
                  {isEn ? '3D Personality Theme' : 'شخصية الطفل ثلاثية الأبعاد'}
                </label>
                <select
                  value={childAvatarTheme}
                  onChange={(e) => setChildAvatarTheme(e.target.value as AvatarAccessoryTheme)}
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-3.5 py-2 text-xs font-bold text-[var(--color-text)]"
                >
                  {AVATAR_ACCESSORY_THEMES.map((th) => (
                    <option key={th.id} value={th.id}>
                      {isEn ? th.labelEn : th.labelAr}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Footer Controls */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-[var(--color-border)]">
          <div className="text-[11px] text-[var(--color-muted)]">
            {isEn
              ? 'Demo Mode: Saves locally & updates location-based providers.'
              : 'وضع العرض التجريبي: يحفظ الإعدادات محليًا ويحدّث خدمات مدينتك فورًا.'}
          </div>
          <div className="flex items-center gap-2">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3 | 4)}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-[var(--color-border)] text-[var(--color-text)]"
              >
                {isEn ? 'Back' : 'السابق'}
              </button>
            )}
            <button
              type="button"
              onClick={handleNextStep}
              className="px-5 py-2.5 rounded-xl text-xs font-extrabold bg-[var(--color-accent)] text-[var(--color-accent-contrast)] whitespace-nowrap"
            >
              {step < 4
                ? isEn
                  ? 'Continue →'
                  : 'الخطوة التالية ←'
                : isEn
                ? '🚀 Complete Setup & Open Platform'
                : '🚀 إتمام التسجيل وفتح المنصة'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import {
  FamilySpaceState,
  ParentThemeRole,
  CountryCode,
  LanguageCode,
  CurrencyCode,
  ALL_ARAB_COUNTRY_CODES,
  ALL_ARAB_CURRENCIES,
  ARAB_COUNTRIES_REGISTRY,
  CURRENCY_METADATA_MAP,
  CalendarDisplayMode,
  COUNTRY_CITIES_MAP,
  getCountryMetadata,
  getDefaultCityForCountry,
  locText,
  ParentProfileThemeSpec,
} from '../domain/familySpaceCore';
import { getCardBackgroundSpec } from '../domain/cardBackgrounds';
import { t } from '../domain/i18n';
import { ThreeDIcon } from '../components/ThreeDVisuals';
import { MasterPatternCard, PrimaryCtaButton, SoftFilledIcon, UnifiedBadge, CollapsibleSectionCard } from '../components/DesignSystem';
import { SectionToolsDrawer } from '../components/SectionToolsDrawer';

export interface ProfileSettingsSectionProps {
  state: FamilySpaceState;
  parentProfileSpec: ParentProfileThemeSpec;
  unreadNotifCount: number;
  showInnerSettings: boolean;
  onToggleShowInnerSettings: () => void;
  onOpenOnboardingModal: () => void;
  onNavigateTo: (page: 'family' | 'children' | 'services' | 'notifications' | 'privacy' | 'terms' | 'contact') => void;
  onToggleDarkMode: () => void;
  settingsParentName: string;
  onChangeSettingsParentName: (val: string) => void;
  settingsRole: ParentThemeRole;
  onChangeSettingsRole: (val: ParentThemeRole) => void;
  settingsLanguage: LanguageCode;
  onChangeSettingsLanguage: (val: LanguageCode) => void;
  settingsCalendarMode: CalendarDisplayMode;
  onChangeSettingsCalendarMode: (val: CalendarDisplayMode) => void;
  onSaveGeneralSettings: () => void;
  onExportJson: () => void;
  onImportJsonFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onOpenConfirmResetModal: () => void;
  onSignOut: () => void;
  onShowToast: (msg: string) => void;
  settingsCountry: CountryCode;
  onCountryChangeInSettings: (val: CountryCode) => void;
  settingsCity: string;
  onChangeSettingsCity: (val: string) => void;
  settingsCurrency: CurrencyCode;
  onChangeSettingsCurrency: (val: CurrencyCode) => void;
  settingsPhoneInput: string;
  onChangeSettingsPhoneInput: (val: string) => void;
  currencySuggestionBanner: CurrencyCode | null;
  onAcceptCurrencySuggestion: (currency: CurrencyCode) => void;
  settingsOtpStep: boolean;
  settingsOtpCode: string;
  onChangeSettingsOtpCode: (val: string) => void;
  onSaveBottomInternationalAndPhone: () => void;
}

export const ProfileSettingsSection: React.FC<ProfileSettingsSectionProps> = ({
  state,
  parentProfileSpec,
  unreadNotifCount,
  showInnerSettings,
  onToggleShowInnerSettings,
  onOpenOnboardingModal,
  onNavigateTo,
  onToggleDarkMode,
  settingsParentName,
  onChangeSettingsParentName,
  settingsRole,
  onChangeSettingsRole,
  settingsLanguage,
  onChangeSettingsLanguage,
  settingsCalendarMode,
  onChangeSettingsCalendarMode,
  onSaveGeneralSettings,
  onExportJson,
  onImportJsonFile,
  onOpenConfirmResetModal,
  onSignOut,
  onShowToast,
  settingsCountry,
  onCountryChangeInSettings,
  settingsCity,
  onChangeSettingsCity,
  settingsCurrency,
  onChangeSettingsCurrency,
  settingsPhoneInput,
  onChangeSettingsPhoneInput,
  currencySuggestionBanner,
  onAcceptCurrencySuggestion,
  settingsOtpStep,
  settingsOtpCode,
  onChangeSettingsOtpCode,
  onSaveBottomInternationalAndPhone,
}) => {
  const lang = state.language;
  const personalCountry = state.parentAccounts[state.activeParentAccount]?.country || state.country;
  const [fontScale, setFontScale] = useState<'compact' | 'standard' | 'large'>(() => {
    try {
      const saved = window.localStorage.getItem('nekbaar-font-scale-v1');
      return saved === 'standard' || saved === 'large' ? saved : 'compact';
    } catch {
      return 'standard';
    }
  });

  useEffect(() => {
    document.documentElement.dataset.fontScale = fontScale;
    try {
      window.localStorage.setItem('nekbaar-font-scale-v1', fontScale);
    } catch {
      // Keep the in-session preference when storage is unavailable.
    }
  }, [fontScale]);

  return (
    <section className="space-y-2.5" aria-label={lang === 'en' ? 'Profile & Settings' : 'حساب الأسرة والإعدادات'}>
      {/* Compact Profile Hero Warm Image Card for Unified Family Space */}
      <div
        className="image-bg-card rounded-xl p-2.5 space-y-2"
        style={{
          backgroundImage: getCardBackgroundSpec('settings', state.darkMode).backgroundImageCss,
          borderColor: parentProfileSpec.badgeBorderCss,
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-white/90 dark:bg-[#142430] border border-white dark:border-[#1E3646] shadow-2xs flex items-center justify-center shrink-0">
              <ThreeDIcon id="family" size={22} />
            </div>
            <div className="min-w-0">
              <span
                style={{
                  backgroundColor: parentProfileSpec.badgeBgCss,
                  color: parentProfileSpec.badgeTextCss,
                  borderColor: parentProfileSpec.badgeBorderCss,
                }}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold border shadow-2xs"
              >
                <SoftFilledIcon id="family" size={12} boxSize="sm" />
                <span>{lang === 'en' ? parentProfileSpec.roleBadgeEn : parentProfileSpec.roleBadgeAr}</span>
              </span>
              <h2 className="image-card-title text-sm font-extrabold mt-0.5 leading-snug">
                {lang === 'en' ? parentProfileSpec.greetingEn : parentProfileSpec.greetingAr}
              </h2>
              <div className="image-card-subtitle text-[10px] font-bold tabular-nums leading-tight">
                {getCountryMetadata(state.country).flag}{' '}
                {lang === 'en'
                  ? getCountryMetadata(state.country).nameEn
                  : getCountryMetadata(state.country).nameAr}{' '}
                · {locText(state.city || getDefaultCityForCountry(state.country), lang)} · {state.currency}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1">
            <PrimaryCtaButton variant="orange" size="sm" onClick={onOpenOnboardingModal}>
              {lang === 'en' ? 'Edit Account & City' : 'تحديث بيانات الحساب والموقع'}
            </PrimaryCtaButton>
            <button
              type="button"
              onClick={() => onNavigateTo('family')}
              className="min-h-[32px] px-2.5 py-1 rounded-lg text-[10px] font-extrabold border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-surface)] dark:bg-[#142430] text-[var(--color-text)] shadow-2xs cursor-pointer"
            >
              {lang === 'en' ? 'Family & Permissions' : 'الأسرة والصلاحيات'}
            </button>
            <button
              type="button"
              onClick={onToggleShowInnerSettings}
              className="min-h-[32px] px-2.5 py-1 rounded-lg text-[10px] font-extrabold border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-surface)] dark:bg-[#142430] text-[var(--color-text)] shadow-2xs cursor-pointer"
            >
              {showInnerSettings
                ? lang === 'en'
                  ? 'Hide Settings'
                  : 'إخفاء الإعدادات'
                : lang === 'en'
                ? 'App Settings'
                : 'إعدادات الحساب'}
            </button>
          </div>
        </div>
      </div>

      {/* Standardized Section Tools (أدوات القسم) immediately after the top profile banner */}
      <SectionToolsDrawer
        language={lang}
        sectionId="settings"
        titleAr="أدوات الإعدادات"
        titleEn="Settings tools"
        badgeCount={unreadNotifCount}
        quickActions={[
          {
            id: 'toggle-inner-settings',
            icon: '⚙️',
            labelAr: showInnerSettings ? 'إخفاء الإعدادات' : 'إعدادات الحساب',
            labelEn: showInnerSettings ? 'Hide Settings' : 'App Settings',
            active: showInnerSettings,
            onClick: onToggleShowInnerSettings,
          },
          {
            id: 'edit-account',
            icon: '✏️',
            labelAr: 'تعديل الحساب والمدينة',
            labelEn: 'Edit Account & City',
            onClick: onOpenOnboardingModal,
          },
          {
            id: 'family-permissions',
            icon: '👨‍👩‍👧‍👦',
            labelAr: 'الأسرة والصلاحيات',
            labelEn: 'Family & Permissions',
            onClick: () => onNavigateTo('family'),
          },
          {
            id: 'export-backup',
            icon: '💾',
            labelAr: 'تصدير نسخة احتياطية',
            labelEn: 'Export Backup',
            onClick: onExportJson,
          },
        ]}
      >
        <div className="space-y-2.5">
          <div className="text-xs font-extrabold text-[var(--color-text)] dark:text-[#F8FAFC]">
            {lang === 'en' ? 'Quick Appearance & Language' : 'اختصارات المظهر واللغة'}
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              id="profile-dark-mode-switch"
              type="button"
              role="switch"
              aria-checked={Boolean(state.darkMode)}
              aria-label={lang === 'en' ? 'Toggle dark mode' : 'تبديل الوضع الليلي والنهاري'}
              onClick={onToggleDarkMode}
              className="min-h-[36px] px-3 py-1.5 rounded-xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-bg)] dark:bg-[#142430] text-xs font-extrabold text-[var(--color-text)] dark:text-[#F8FAFC] cursor-pointer"
            >
              {state.darkMode ? (lang === 'en' ? '☀️ Day Mode' : '☀️ الوضع النهاري') : (lang === 'en' ? '🌙 Night Mode' : '🌙 الوضع الليلي')}
            </button>
            <button
              type="button"
              onClick={onSignOut}
              className="min-h-[36px] px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 text-xs font-extrabold text-rose-700 dark:text-rose-300 cursor-pointer"
            >
              {lang === 'en' ? 'Sign Out' : 'تسجيل الخروج'}
            </button>
          </div>

          <div className="rounded-xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-surface)] dark:bg-[#101D26] px-3 py-2.5 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-extrabold text-[var(--color-text)]">{lang === 'en' ? 'App text size' : 'حجم خطوط التطبيق'}</p>
              <p className="text-[10px] text-[var(--color-muted)]">{lang === 'en' ? 'Applies across all screens' : 'يتطبق على شاشات التطبيق بالكامل'}</p>
            </div>
            <div className="inline-flex shrink-0 rounded-xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-muted)] p-0.5" role="group" aria-label={lang === 'en' ? 'App text size' : 'حجم خطوط التطبيق'}>
              {(['compact', 'standard', 'large'] as const).map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setFontScale(size)}
                  aria-pressed={fontScale === size}
                  className={`min-h-[32px] px-2 rounded-lg text-[10px] font-extrabold transition-colors ${fontScale === size ? 'bg-[var(--color-accent)] text-[var(--color-accent-contrast)] shadow-sm' : 'text-[var(--color-muted)]'}`}
                >
                  {size === 'compact' ? (lang === 'en' ? 'Small' : 'صغير') : size === 'standard' ? (lang === 'en' ? 'Default' : 'افتراضي') : (lang === 'en' ? 'Large' : 'كبير')}
                </button>
              ))}
            </div>
          </div>
        </div>
      </SectionToolsDrawer>

      {/* Inner Settings Section inside Profile Screen */}
      {showInnerSettings && (
        <div className="space-y-5" aria-label={lang === 'en' ? 'Settings inside Profile' : 'الإعدادات داخل صفحة الحساب'}>
          <div className="section-heading-block">
            <h3 className="section-heading-centered">
              {lang === 'en' ? 'Settings & Account Preferences' : 'تفضيلات الحساب والتطبيق'}
            </h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* 1. Experience & Interface Preferences */}
            <CollapsibleSectionCard
              title={lang === 'en' ? 'Theme, Language & Calendar' : 'السمة البصرية واللغة والتقويم'}
              subtitle={lang === 'en' ? 'Personalize your profile, appearance and language' : 'خصص ملفك وطريقة عرض التطبيق واللغة'}
              iconId="settings"
              badgeLabel={lang === 'en' ? 'Preferences' : 'تفضيلات العرض'}
              badgeTone="purple"
              cardTone="purple"
              defaultOpen={true}
            >
              <div className="space-y-4">
                <div>
                  <label htmlFor="parentName" className="block text-xs font-bold text-[var(--color-muted)] mb-1">
                    {lang === 'en' ? 'Parent or Family Name' : 'اسم ولي الأمر أو الأسرة'}
                  </label>
                  <input
                    id="parentName"
                    type="text"
                    maxLength={80}
                    value={settingsParentName}
                    onChange={(e) => onChangeSettingsParentName(e.target.value)}
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-3 py-2 text-sm text-[var(--color-text)]"
                  />
                </div>

                <div>
                  <label htmlFor="parentRole" className="block text-xs font-bold text-[var(--color-muted)] mb-1">
                    {lang === 'en' ? 'Visual Theme & Parent Mode' : 'نوع التجربة والسمة البصرية'}
                  </label>
                  <select
                    id="parentRole"
                    value={settingsRole}
                    onChange={(e) => onChangeSettingsRole(e.target.value as ParentThemeRole)}
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-3 py-2 text-sm text-[var(--color-text)]"
                  >
                    <option value="mom">{lang === 'en' ? 'Mother Mode — Rose' : 'الأم — روز'}</option>
                    <option value="dad">{lang === 'en' ? 'Father Mode — Aqua' : 'الأب — أكوا'}</option>
                    <option value="high-contrast">
                      {lang === 'en' ? 'High Contrast — Readability' : 'تباين عالٍ — لسهولة القراءة'}
                    </option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="settingsLanguage" className="block text-xs font-bold text-[var(--color-muted)] mb-1">
                      {lang === 'en' ? 'Interface Language' : 'لغة الواجهة'}
                    </label>
                    <select
                      id="settingsLanguage"
                      value={settingsLanguage}
                      onChange={(e) => onChangeSettingsLanguage(e.target.value as LanguageCode)}
                      className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-3 py-2 text-sm text-[var(--color-text)]"
                    >
                      <option value="ar">{t(lang, 'langAr')}</option>
                      <option value="en">{t(lang, 'langEn')}</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="settingsCalendarMode" className="block text-xs font-bold text-[var(--color-muted)] mb-1">
                      {lang === 'en' ? 'Calendar Date Display' : 'نظام عرض التاريخ'}
                    </label>
                    <select
                      id="settingsCalendarMode"
                      value={settingsCalendarMode}
                      onChange={(e) => onChangeSettingsCalendarMode(e.target.value as CalendarDisplayMode)}
                      className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-3 py-2 text-sm text-[var(--color-text)]"
                    >
                      <option value="both">{t(lang, 'calendarBoth')}</option>
                      <option value="gregorian">{t(lang, 'calendarGregorian')}</option>
                      <option value="hijri">{t(lang, 'calendarHijri')}</option>
                    </select>
                  </div>
                </div>

                <PrimaryCtaButton variant="purple" onClick={onSaveGeneralSettings}>
                  {lang === 'en' ? 'Save Preferences' : 'حفظ التفضيلات'}
                </PrimaryCtaButton>
              </div>
            </CollapsibleSectionCard>

            {/* 2. Data Backup, Restore & 3D Asset Manifest */}
            <div className="space-y-5">
              <CollapsibleSectionCard
                id="settings-json-backup"
                title={lang === 'en' ? 'Data Backup & Restore' : 'النسخ الاحتياطي واستعادة البيانات'}
                subtitle={lang === 'en' ? 'Export or import your family profile locally' : 'تصدير أو استيراد ملف بيانات أسرتك بأمان'}
                iconId="shield"
                badgeLabel={lang === 'en' ? 'Local Backup' : 'نسخة احتياطية محلية'}
                badgeTone="emerald"
                cardTone="emerald"
                defaultOpen={false}
              >
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={onExportJson}
                      className="min-h-[42px] px-4 py-2 rounded-2xl text-xs font-extrabold border border-[var(--color-border)] bg-[var(--color-control-bg)] text-[var(--color-text)] shadow-2xs inline-flex items-center gap-1.5"
                    >
                      <SoftFilledIcon id="shield" size={16} />
                      <span>{lang === 'en' ? 'Export Backup' : 'تصدير نسخة احتياطية'}</span>
                    </button>

                    <label className="min-h-[42px] px-4 py-2 rounded-2xl text-xs font-extrabold border border-[var(--color-border)] bg-[var(--color-control-bg)] text-[var(--color-text)] shadow-2xs cursor-pointer inline-flex items-center gap-1.5">
                      <SoftFilledIcon id="sparkles" size={16} />
                      <span>{lang === 'en' ? 'Import Backup File' : 'استيراد ملف بيانات'}</span>
                      <input
                        type="file"
                        accept="application/json,.json"
                        onChange={onImportJsonFile}
                        className="sr-only"
                      />
                    </label>

                    <button
                      type="button"
                      onClick={onSignOut}
                      className="min-h-[42px] px-4 py-2 rounded-2xl text-xs font-extrabold border border-amber-300 bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-200"
                    >
                      {lang === 'en' ? 'Sign Out' : 'تسجيل الخروج'}
                    </button>
                    <button
                      type="button"
                      onClick={onOpenConfirmResetModal}
                      className="min-h-[42px] px-4 py-2 rounded-2xl text-xs font-extrabold border border-red-200 bg-[var(--color-control-bg)] text-red-700"
                    >
                      {lang === 'en' ? 'Reset Account Data' : 'مسح وإعادة ضبط البيانات'}
                    </button>
                  </div>

                  <div className="pt-3 border-t border-emerald-200/60 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        onShowToast(
                          lang === 'en'
                            ? `✓ Local Storage Integrity Verified: ${state.kids.length} Kids, ${state.family.length} Family Members, ${state.tasks.length} Tasks.`
                            : `✓ تم فحص سلامة البيانات المحلية بنجاح: ${state.kids.length} أطفال، ${state.family.length} أفراد عائلة، و${state.tasks.length} مهام روتين.`
                        )
                      }
                      className="px-3 py-1.5 rounded-xl text-xs font-extrabold border border-[var(--color-border)] bg-[var(--color-control-bg)] text-[var(--color-text)] hover:border-[var(--color-accent)] active:scale-95 transition-all"
                    >
                      {lang === 'en' ? 'Verify Local Data Integrity' : 'فحص سلامة البيانات المحلية'}
                    </button>
                    <button
                      type="button"
                      onClick={onExportJson}
                      className="px-3 py-1.5 rounded-xl text-xs font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs active:scale-95 transition-all"
                    >
                      {lang === 'en' ? 'Download Full Family Snapshot' : 'تنزيل لقطة كاملة لبيانات الأسرة'}
                    </button>
                  </div>
                </div>
              </CollapsibleSectionCard>
            </div>
          </div>

          {/* ==============================================================
              BOTTOM OF SETTINGS PAGE: COUNTRY, CURRENCY & VERIFIED PHONE
              ============================================================== */}
          <CollapsibleSectionCard
            id="settings-international-bottom"
            title={
              lang === 'en'
                ? 'Country, City, Currency & Phone'
                : 'الدولة والمدينة والعملة ورقم الجوال'
            }
            subtitle={
              lang === 'en'
                ? 'Set your country, city, display currency and phone number'
                : 'حدد الدولة والمدينة والعملة، وأدر رقم هاتف الحساب'
            }
            iconId="location"
            badgeLabel={`${getCountryMetadata(state.country).dialCode} · ${state.currency} · ${locText(
              state.city || getDefaultCityForCountry(state.country),
              lang
            )}`}
            badgeTone="amber"
            cardTone="amber"
            defaultOpen={true}
          >
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <UnifiedBadge
                  label={lang === 'en' ? 'Mobile Number & Arab Countries (22)' : 'رقم الجوال والدول العربية (22 دولة)'}
                  tone="amber"
                  iconId="shield"
                />
              </div>

              <div
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-3 max-h-56 overflow-y-auto pe-1"
                role="group"
                aria-label={lang === 'en' ? 'Choose country' : 'اختيار الدولة'}
              >
                {ALL_ARAB_COUNTRY_CODES.map((code) => {
                  const meta = ARAB_COUNTRIES_REGISTRY[code];
                  return (
                    <button
                      key={code}
                      type="button"
                      data-testid={`settings-country-${code.toLowerCase()}-btn`}
                      aria-pressed={settingsCountry === code}
                      onClick={() => onCountryChangeInSettings(code)}
                      className={`min-h-[54px] rounded-2xl border px-2.5 py-2 flex items-center gap-2 text-start transition-all cursor-pointer ${
                        settingsCountry === code
                          ? 'border-[#0d9488] bg-teal-50 dark:bg-[#12343a] shadow-sm'
                          : 'border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-bg)] hover:border-[#0d9488]/60'
                      }`}
                    >
                      <span className="text-xl shrink-0" aria-hidden="true">
                        {meta.flag}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs font-black text-[var(--color-text)] truncate">
                          {lang === 'en' ? meta.nameEn : meta.nameAr}
                        </span>
                        <span className="block text-[10px] font-bold text-[var(--color-muted)] truncate">
                          {(COUNTRY_CITIES_MAP[code] || []).length} {lang === 'en' ? 'cities' : 'مدن'} · {meta.currencyCode}
                        </span>
                      </span>
                      {settingsCountry === code && (
                        <span className="text-[#0d9488] font-black" aria-hidden="true">
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label htmlFor="settingsCountry" className="block text-xs font-bold text-[var(--color-text)] mb-1">
                    {lang === 'en' ? 'Family service country' : 'دولة موقع الأسرة والخدمات'}
                  </label>
                  <select
                    id="settingsCountry"
                    value={settingsCountry}
                    onChange={(e) => onCountryChangeInSettings(e.target.value as CountryCode)}
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-3 py-2 text-sm text-[var(--color-text)]"
                  >
                    {ALL_ARAB_COUNTRY_CODES.map((code) => {
                      const meta = ARAB_COUNTRIES_REGISTRY[code];
                      return (
                        <option key={code} value={code}>
                          {meta.flag} {lang === 'en' ? meta.nameEn : meta.nameAr} ({meta.dialCode})
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label htmlFor="settingsCity" className="block text-xs font-bold text-[var(--color-text)] mb-1">
                    {lang === 'en'
                      ? `Governorate / City (${getCountryMetadata(settingsCountry).nameEn})`
                      : `المحافظة / المدينة (${getCountryMetadata(settingsCountry).nameAr})`}
                  </label>
                  <select
                    id="settingsCity"
                    value={settingsCity}
                    onChange={(e) => onChangeSettingsCity(e.target.value)}
                    className="w-full rounded-xl border border-[var(--color-border)] dark:border-[#1E3646] bg-white dark:bg-[#142430] px-3 py-2 text-sm font-bold text-gray-900 dark:text-[#F8FAFC]"
                  >
                    {(COUNTRY_CITIES_MAP[settingsCountry] || []).map((cItem, idx) => (
                      <option
                        key={cItem.id}
                        value={cItem.id}
                        className="text-gray-900 bg-white font-bold"
                      >
                        {lang === 'en'
                          ? `${idx + 1}. ${cItem.nameEn || cItem.labelEn || cItem.id} — ${cItem.regionEn}`
                          : `${idx + 1}. ${cItem.nameAr || cItem.labelAr || cItem.id} — ${cItem.regionAr}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="settingsCurrency" className="block text-xs font-bold text-[var(--color-text)] mb-1">
                    {lang === 'en' ? 'Display Currency' : 'العملة المعتمدة للأسعار'}
                  </label>
                  <select
                    id="settingsCurrency"
                    value={settingsCurrency}
                    onChange={(e) => onChangeSettingsCurrency(e.target.value as CurrencyCode)}
                    className="w-full rounded-xl border border-[var(--color-border)] bg-white dark:bg-[#142430] px-3 py-2 text-sm font-bold text-gray-900 dark:text-[#F8FAFC]"
                  >
                    {ALL_ARAB_CURRENCIES.map((currCode) => {
                      const currMeta = CURRENCY_METADATA_MAP[currCode];
                      return (
                        <option key={currCode} value={currCode} className="text-gray-900 bg-white font-bold">
                          {currCode} — {lang === 'en' ? currMeta.nameEn : currMeta.nameAr} ({currMeta.symbolAr})
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label htmlFor="settingsPhoneInput" className="block text-xs font-bold text-[var(--color-text)] mb-1">
                    {lang === 'en'
                      ? `Mobile phone number (${getCountryMetadata(personalCountry).dialCode})`
                      : `رقم الجوال (${getCountryMetadata(personalCountry).dialCode})`}
                  </label>
                  <input
                    id="settingsPhoneInput"
                    type="tel"
                    dir="ltr"
                    value={settingsPhoneInput}
                    onChange={(e) => onChangeSettingsPhoneInput(e.target.value)}
                    placeholder={getCountryMetadata(personalCountry).phoneRule.exampleLocal}
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-3 py-2 text-sm tabular-nums text-[var(--color-text)]"
                  />
                </div>
              </div>

              {/* Suggested Currency Banner when Country switches */}
              {currencySuggestionBanner && (
                <div className="rounded-2xl bg-[var(--color-control-bg)] border border-[var(--color-border)] p-3.5 flex flex-wrap items-center justify-between gap-2 text-xs font-bold">
                  <span>
                    {lang === 'en'
                      ? `You selected ${getCountryMetadata(settingsCountry).nameEn}. Switch to suggested currency (${currencySuggestionBanner})?`
                      : `اخترت ${getCountryMetadata(settingsCountry).nameAr}. هل ترغب في التبديل إلى العملة المقترحة (${currencySuggestionBanner})؟`}
                  </span>
                  <button
                    type="button"
                    onClick={() => onAcceptCurrencySuggestion(currencySuggestionBanner)}
                    className="px-3.5 py-1.5 rounded-xl font-extrabold bg-amber-600 text-white whitespace-nowrap"
                  >
                    {lang === 'en' ? `Yes, use ${currencySuggestionBanner}` : `نعم، اعتمد ${currencySuggestionBanner}`}
                  </button>
                </div>
              )}

              {settingsOtpStep && (
                <div className="rounded-2xl border border-amber-300 bg-[var(--color-control-bg)] p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="text-[var(--color-text)] font-bold">
                    {lang === 'en'
                      ? 'Enter verification code (OTP) to confirm update:'
                      : 'أدخل رمز التحقق المرسل للجوال لتأكيد التحديث:'}
                  </div>
                  <input
                    type="text"
                    dir="ltr"
                    value={settingsOtpCode}
                    onChange={(e) => onChangeSettingsOtpCode(e.target.value)}
                    placeholder="123456"
                    maxLength={6}
                    className="w-28 rounded-xl border border-amber-400 bg-amber-50 px-3 py-1.5 text-center font-extrabold tabular-nums text-slate-900"
                  />
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <span className="text-xs font-bold text-[var(--color-muted)]">
                  {lang === 'en'
                    ? 'Supports all 22 Arab League mobile formats & dial codes'
                    : 'يدعم التحقق القياسي لأرقام الجوال في جميع الدول العربية الـ 22'}
                </span>
                <PrimaryCtaButton variant="orange" onClick={onSaveBottomInternationalAndPhone}>
                  {settingsOtpStep
                    ? lang === 'en'
                      ? 'Verify OTP & Save Settings'
                      : 'تأكيد رمز OTP وحفظ الدولة والهاتف'
                    : lang === 'en'
                    ? 'Save family service location & phone'
                    : 'حفظ موقع الأسرة والخدمات ورقم الجوال'}
                </PrimaryCtaButton>
              </div>
            </div>
          </CollapsibleSectionCard>
        </div>
      )}
    </section>
  );
};

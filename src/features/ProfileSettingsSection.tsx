import React from 'react';
import {
  FamilySpaceState,
  ParentThemeRole,
  CountryCode,
  LanguageCode,
  CurrencyCode,
  CalendarDisplayMode,
  COUNTRY_CITIES_MAP,
  DEMO_OTP_CODE,
  locText,
  ParentProfileThemeSpec,
} from '../domain/familySpaceCore';
import { getCardBackgroundSpec } from '../domain/cardBackgrounds';
import { t } from '../domain/i18n';
import { ThreeDIcon } from '../components/ThreeDVisuals';
import { PrimaryCtaButton, SoftFilledIcon, UnifiedBadge, CollapsibleSectionCard } from '../components/DesignSystem';

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

  return (
    <section className="space-y-6" aria-label={lang === 'en' ? 'Profile & Settings' : 'الحساب والإعدادات'}>
      {/* Profile Hero Warm Image Card with Father vs. Mother Visual Distinction */}
      <div
        className="image-bg-card rounded-[24px] p-5 sm:p-6 space-y-5"
        style={{
          backgroundImage: getCardBackgroundSpec('settings', state.darkMode).backgroundImageCss,
          borderColor: parentProfileSpec.badgeBorderCss,
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-16 h-16 rounded-3xl bg-white/90 border border-white shadow-sm flex items-center justify-center shrink-0">
              <ThreeDIcon id="family" size={38} />
            </div>
            <div>
              <span
                style={{
                  backgroundColor: parentProfileSpec.badgeBgCss,
                  color: parentProfileSpec.badgeTextCss,
                  borderColor: parentProfileSpec.badgeBorderCss,
                }}
                className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-extrabold border shadow-2xs"
              >
                <SoftFilledIcon id="family" size={14} />
                <span>{lang === 'en' ? parentProfileSpec.roleBadgeEn : parentProfileSpec.roleBadgeAr}</span>
              </span>
              <h2 className="image-card-title text-xl sm:text-2xl font-extrabold mt-1">
                {lang === 'en' ? parentProfileSpec.greetingEn : parentProfileSpec.greetingAr}
              </h2>
              <div className="image-card-subtitle text-xs font-bold tabular-nums mt-0.5">
                {t(lang, 'brandName')} ·{' '}
                {state.country === 'SA'
                  ? lang === 'en'
                    ? 'Saudi Arabia'
                    : 'السعودية'
                  : lang === 'en'
                  ? 'Egypt'
                  : 'مصر'}{' '}
                · {locText(state.city || (state.country === 'SA' ? 'الرياض' : 'القاهرة'), lang)} · {state.currency}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <PrimaryCtaButton variant="orange" onClick={onOpenOnboardingModal}>
              {lang === 'en' ? 'Edit Account & City' : 'تحديث الحساب والمدينة'}
            </PrimaryCtaButton>
            <button
              type="button"
              onClick={() => onNavigateTo('family')}
              className="min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-extrabold border border-[var(--color-border)] bg-[var(--color-surface)] dark:bg-[#142430] text-[var(--color-text)] shadow-2xs"
            >
              {lang === 'en' ? 'Family & Permissions' : 'العائلة والصلاحيات'}
            </button>
            <button
              type="button"
              onClick={onToggleShowInnerSettings}
              className="min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-extrabold border border-[var(--color-border)] bg-[var(--color-surface)] dark:bg-[#142430] text-[var(--color-text)] shadow-2xs"
            >
              {showInnerSettings
                ? lang === 'en'
                  ? 'Hide Settings'
                  : 'إخفاء الإعدادات'
                : lang === 'en'
                ? 'App Settings'
                : 'الإعدادات'}
            </button>
          </div>
        </div>
      </div>

      {/* Dedicated Dark / Light Mode Accessibility Toggle Card in Profile (الحساب) */}
      <div
        id="profile-dark-mode-card"
        className="rounded-[24px] border border-indigo-200/85 bg-indigo-50/85 p-4 sm:p-5 shadow-2xs flex flex-wrap items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-[var(--color-control-bg)] border border-[var(--color-border)] shadow-2xs flex items-center justify-center shrink-0">
            <SoftFilledIcon id={state.darkMode ? 'star' : 'sparkles'} size={24} />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm sm:text-base font-extrabold text-[var(--color-text)]">
                {lang === 'en'
                  ? 'Dark Mode — Deep Midnight Charcoal'
                  : 'الوضع الليلي العميق المريح للعين'}
              </h3>
              <UnifiedBadge
                label={
                  state.darkMode
                    ? lang === 'en'
                      ? 'Active · Midnight Charcoal'
                      : 'مفعّل · فحمي ليلي'
                    : lang === 'en'
                    ? 'Light Mode · Pastel'
                    : 'الوضع النهاري · باستيل'
                }
                tone="indigo"
                iconId="settings"
              />
            </div>
            <p className="text-xs font-semibold text-[var(--color-muted)] mt-0.5">
              {lang === 'en'
                ? 'Switches the entire app instantly to deep midnight charcoal tones (#0B131A) with high-contrast legible text.'
                : 'يُحوّل ألوان التطبيق فورًا إلى درجات الرمادي الفحمي والأزرق الليلي العميق (#0B131A) مع تباين نصي فائق الوضوح.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            id="profile-dark-mode-switch"
            type="button"
            role="switch"
            aria-checked={Boolean(state.darkMode)}
            aria-label={
              lang === 'en'
                ? 'Toggle Dark Mode'
                : 'تبديل الوضع الليلي والنهاري'
            }
            onClick={onToggleDarkMode}
            className={`min-h-[42px] px-4 py-2 rounded-2xl text-xs font-extrabold flex items-center gap-2.5 border shadow-2xs active:scale-95 transition-all ${
              state.darkMode
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-500'
                : 'bg-[var(--color-control-bg)] hover:border-[var(--color-accent)] text-[var(--color-text)] border-[var(--color-border)]'
            }`}
          >
            <span
              aria-hidden="true"
              className={`w-9 h-5 rounded-full p-0.5 flex items-center transition-colors ${
                state.darkMode ? 'bg-indigo-900/80 justify-end' : 'bg-slate-200 justify-start'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-white shadow-xs block" />
            </span>
            <span>
              {state.darkMode
                ? lang === 'en'
                  ? 'Dark Mode On (Switch to Light)'
                  : 'الوضع الليلي مفعّل (تبديل للنهاري)'
                : lang === 'en'
                ? 'Enable Dark Mode'
                : 'تفعيل الوضع الليلي'}
            </span>
          </button>
        </div>
      </div>

      {/* Inner Settings Section inside Profile Screen */}
      {showInnerSettings && (
        <div className="space-y-5" aria-label={lang === 'en' ? 'Settings inside Profile' : 'الإعدادات داخل صفحة الحساب'}>
          <div className="section-heading-block">
            <h3 className="section-heading-centered">
              {lang === 'en' ? 'Settings & Account Preferences' : 'الإعدادات وتخصيص الحساب'}
            </h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* 1. Experience & Interface Preferences */}
            <CollapsibleSectionCard
              title={lang === 'en' ? 'Theme, Language & Calendar' : 'السمة البصرية واللغة والتقويم'}
              subtitle={lang === 'en' ? 'Parent profile role, visual theme & language' : 'تخصيص وضع ولي الأمر والسمة البصرية ولغة العرض'}
              iconId="settings"
              badgeLabel={lang === 'en' ? 'Preferences' : 'تفضيلات العرض'}
              badgeTone="purple"
              cardTone="purple"
              defaultOpen={true}
            >
              <div className="space-y-4">
                <div>
                  <label htmlFor="parentName" className="block text-xs font-bold text-[var(--color-muted)] mb-1">
                    {lang === 'en' ? 'Parent / Family Display Name' : 'اسم ولي الأمر / الأسرة'}
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
                  {lang === 'en' ? 'Save Experience Preferences' : 'حفظ تفضيلات التجربة واللغة'}
                </PrimaryCtaButton>
              </div>
            </CollapsibleSectionCard>

            {/* 2. Data Backup, Restore & 3D Asset Manifest */}
            <div className="space-y-5">
              <CollapsibleSectionCard
                id="settings-json-backup"
                title={lang === 'en' ? 'JSON Data Backup & Restore' : 'النسخ الاحتياطي واستيراد البيانات (JSON)'}
                subtitle={lang === 'en' ? 'Export or import your family profile locally' : 'تصدير أو استيراد ملف بيانات أسرتك محلياً'}
                iconId="shield"
                badgeLabel="family-space-v1"
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
                      <span>{lang === 'en' ? 'Export JSON Backup' : 'تصدير نسخة JSON'}</span>
                    </button>

                    <label className="min-h-[42px] px-4 py-2 rounded-2xl text-xs font-extrabold border border-[var(--color-border)] bg-[var(--color-control-bg)] text-[var(--color-text)] shadow-2xs cursor-pointer inline-flex items-center gap-1.5">
                      <SoftFilledIcon id="sparkles" size={16} />
                      <span>{lang === 'en' ? 'Import JSON File' : 'استيراد ملف JSON'}</span>
                      <input
                        type="file"
                        accept="application/json,.json"
                        onChange={onImportJsonFile}
                        className="sr-only"
                      />
                    </label>

                    <button
                      type="button"
                      onClick={onOpenConfirmResetModal}
                      className="min-h-[42px] px-4 py-2 rounded-2xl text-xs font-extrabold border border-red-200 bg-[var(--color-control-bg)] text-red-700"
                    >
                      {lang === 'en' ? 'Reset Demo Data' : 'مسح وإعادة ضبط البيانات'}
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
                ? 'Country, Calling Code, Currency & Verified Phone'
                : 'إعدادات الدولة، مفتاح الهاتف، العملة، وتوثيق الجوال'
            }
            subtitle={
              lang === 'en'
                ? 'Region, international dial code, currency & OTP verified phone'
                : 'تحديد الدولة، مفتاح الاتصال، العملة وتوثيق رقم الهاتف'
            }
            iconId="location"
            badgeLabel={`${state.country === 'SA' ? '+966 · SAR' : '+20 · EGP'} · ${locText(
              state.city || (state.country === 'SA' ? 'الرياض' : 'القاهرة'),
              lang
            )}`}
            badgeTone="amber"
            cardTone="amber"
            defaultOpen={false}
          >
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <UnifiedBadge label={`OTP: ${DEMO_OTP_CODE}`} tone="amber" iconId="shield" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label htmlFor="settingsCountry" className="block text-xs font-bold text-[var(--color-text)] mb-1">
                    {lang === 'en' ? 'Country & Calling Code' : 'الدولة ومفتاح الاتصال الدولي'}
                  </label>
                  <select
                    id="settingsCountry"
                    value={settingsCountry}
                    onChange={(e) => onCountryChangeInSettings(e.target.value as CountryCode)}
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-3 py-2 text-sm text-[var(--color-text)]"
                  >
                    <option value="EG">{t(lang, 'countryEG')} (+20)</option>
                    <option value="SA">{t(lang, 'countrySA')} (+966)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="settingsCity" className="block text-xs font-bold text-[var(--color-text)] mb-1">
                    {lang === 'en' ? 'City / Governorate' : 'المدينة / المحافظة'}
                  </label>
                  <select
                    id="settingsCity"
                    value={settingsCity}
                    onChange={(e) => onChangeSettingsCity(e.target.value)}
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-3 py-2 text-sm text-[var(--color-text)]"
                  >
                    {(COUNTRY_CITIES_MAP[settingsCountry] || []).map((cItem) => (
                      <option key={cItem.id} value={cItem.id}>
                        {lang === 'en' ? `${cItem.nameEn} (${cItem.regionEn})` : `${cItem.nameAr} (${cItem.regionAr})`}
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
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-3 py-2 text-sm text-[var(--color-text)]"
                  >
                    <option value="EGP">{t(lang, 'currencyEGP')}</option>
                    <option value="SAR">{t(lang, 'currencySAR')}</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="settingsPhoneInput" className="block text-xs font-bold text-[var(--color-text)] mb-1">
                    {lang === 'en'
                      ? `Verified Phone (${settingsCountry === 'SA' ? '+966' : '+20'})`
                      : `رقم هاتف الحساب الموثق (${settingsCountry === 'SA' ? '+966' : '+20'})`}
                  </label>
                  <input
                    id="settingsPhoneInput"
                    type="tel"
                    dir="ltr"
                    value={settingsPhoneInput}
                    onChange={(e) => onChangeSettingsPhoneInput(e.target.value)}
                    placeholder={settingsCountry === 'SA' ? '512345678' : '1012345678'}
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-3 py-2 text-sm tabular-nums text-[var(--color-text)]"
                  />
                </div>
              </div>

              {/* Suggested Currency Banner when Country switches */}
              {currencySuggestionBanner && (
                <div className="rounded-2xl bg-[var(--color-control-bg)] border border-[var(--color-border)] p-3.5 flex flex-wrap items-center justify-between gap-2 text-xs font-bold">
                  <span>
                    {lang === 'en'
                      ? `You selected ${settingsCountry === 'SA' ? 'Saudi Arabia' : 'Egypt'}. Switch to suggested currency (${currencySuggestionBanner})?`
                      : `اخترت ${settingsCountry === 'SA' ? 'السعودية' : 'مصر'}. هل ترغب في التبديل إلى العملة المقترحة (${currencySuggestionBanner})؟`}
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
                      ? `Enter OTP code (${DEMO_OTP_CODE}) to confirm update:`
                      : `أدخل رمز التحقق OTP التجريبي (${DEMO_OTP_CODE}) لتأكيد التحديث:`}
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
                    ? 'Supports Egyptian (+20) & Saudi (+966) mobile formats'
                    : 'يدعم التحقق القياسي للهاتف المصري (+20) والسعودي (+966)'}
                </span>
                <PrimaryCtaButton variant="orange" onClick={onSaveBottomInternationalAndPhone}>
                  {settingsOtpStep
                    ? lang === 'en'
                      ? 'Verify OTP & Save Settings'
                      : 'تأكيد رمز OTP وحفظ الدولة والهاتف'
                    : lang === 'en'
                    ? 'Save Country, City, Currency & Phone'
                    : 'حفظ إعدادات الدولة والمدينة والعملة والهاتف'}
                </PrimaryCtaButton>
              </div>
            </div>
          </CollapsibleSectionCard>
        </div>
      )}
    </section>
  );
};

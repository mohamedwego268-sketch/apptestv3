import React, { useState } from 'react';
import { CountryCode, LanguageCode, ParentThemeRole, locText } from '../domain/familySpaceCore';
import { PageId } from '../context/FamilyAppContext';
import { ThreeDIcon } from './ThreeDVisuals';
import { LiveWeatherWidget } from './LiveWeatherWidget';

export interface HeaderBarNavOption {
  id: PageId;
  shortLabel: string;
}

export interface HeaderBarProfileSpec {
  role: ParentThemeRole;
  displayNameAr: string;
  displayNameEn: string;
  badgeBgCss: string;
  badgeTextCss: string;
  badgeBorderCss: string;
}

export interface HeaderBarProps {
  lang: LanguageCode;
  brandName: string;
  darkMode: boolean;
  bedtimeMode?: boolean;
  unreadNotifCount: number;
  openTasksCount?: number;
  parentProfileSpec: HeaderBarProfileSpec;
  activePage: PageId;
  navItems?: HeaderBarNavOption[];
  onNavigate: (pageId: PageId) => void;
  onToggleDarkMode: () => void;
  onToggleBedtimeMode?: () => void;
  onToggleLanguage: () => void;
  onOpenSmartPlanner?: () => void;
  onOpenProfileDrawer: () => void;
  isScrolled?: boolean;
  country?: CountryCode;
  city?: string;
  userCoords?: { lat: number; lng: number } | null;
  onSelectCity?: (country: CountryCode, city: string) => void;
}

const COMPACT_HEADER_WEATHER: Record<
  string,
  { tempC: number; conditionEmoji: string; labelAr: string; labelEn: string; humidity: number; windKmh: number }
> = {
  القاهرة: { tempC: 27, conditionEmoji: '☀️', labelAr: 'مشمس ومعتدل', labelEn: 'Sunny & Mild', humidity: 42, windKmh: 14 },
  الإسكندرية: { tempC: 24, conditionEmoji: '🌤️', labelAr: 'نسيم بحري لطيف', labelEn: 'Sea Breeze', humidity: 58, windKmh: 18 },
  الجيزة: { tempC: 28, conditionEmoji: '☀️', labelAr: 'مشمس ودافئ', labelEn: 'Sunny & Warm', humidity: 40, windKmh: 13 },
  المنصورة: { tempC: 26, conditionEmoji: '⛅', labelAr: 'غائم جزئياً', labelEn: 'Partly Cloudy', humidity: 48, windKmh: 12 },
  الرياض: { tempC: 33, conditionEmoji: '☀️', labelAr: 'مشمس وصافٍ', labelEn: 'Clear & Sunny', humidity: 22, windKmh: 15 },
  جدة: { tempC: 31, conditionEmoji: '🌤️', labelAr: 'دافئ ساحلي', labelEn: 'Warm Coastal', humidity: 62, windKmh: 16 },
  الدمام: { tempC: 32, conditionEmoji: '☀️', labelAr: 'مشمس ومستقر', labelEn: 'Sunny & Calm', humidity: 50, windKmh: 14 },
};

/**
 * HeaderBar Component for نكبر (Nekbaar).
 * Clean flexbox layout:
 * 1. Hamburger Menu Trigger (☰)
 * 2. Quick Notifications Bell Button with Live Unread Badge
 * 3. Super-Compact Minimalist Weather Widget directly beside the Notification Bell (opens Expanded Weather Details Modal on click)
 * 4. Brand Wordmark ("نكبر" / "Nekbaar")
 */
export const HeaderBar: React.FC<HeaderBarProps> = ({
  lang,
  brandName,
  darkMode,
  unreadNotifCount,
  activePage,
  onNavigate,
  onOpenProfileDrawer,
  isScrolled = false,
  country = 'EG',
  city = 'القاهرة',
  userCoords = null,
  onSelectCity,
}) => {
  const isEn = lang === 'en';
  const isNotificationsActive = activePage === 'notifications';
  const [weatherModalOpen, setWeatherModalOpen] = useState<boolean>(false);

  const activeCity = city || (country === 'SA' ? 'الرياض' : 'القاهرة');
  const localizedCity = locText(activeCity, lang);
  const compactWeather = COMPACT_HEADER_WEATHER[activeCity] || COMPACT_HEADER_WEATHER['القاهرة'];

  return (
    <>
      <header
        id="main-sticky-header"
        data-scrolled={isScrolled ? 'true' : 'false'}
        className="sticky top-0 z-30 w-full border-b border-gray-200/80 dark:border-[#1E3646] glass-sticky-header transition-all duration-300 ease-in-out select-none pt-safe"
      >
        <div className="max-w-[430px] mx-auto px-3.5 py-2 flex items-center justify-between gap-2">
          {/* Left/Start Control Group: Hamburger Menu Trigger (☰) + Quick Notifications Bell + Minimalist Weather Widget */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Hamburger Menu Trigger (☰) — Opens Master Control Slide Bar */}
            <button
              id="master-slidebar-trigger-btn"
              data-testid="master-slidebar-trigger-btn"
              type="button"
              onClick={onOpenProfileDrawer}
              title={
                isEn
                  ? 'Open Master Navigation Slide Bar (☰)'
                  : 'فتح القائمة الجانبية الشاملة والتحكم السريع (☰)'
              }
              aria-label={
                isEn
                  ? 'Open Master Navigation Slide Bar'
                  : 'فتح القائمة الجانبية الشاملة والتحكم السريع'
              }
              className="min-h-[48px] min-w-[48px] px-3 rounded-2xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-bg)] dark:bg-[#142430] hover:border-[#0d9488] text-[var(--color-text)] dark:text-[#F8FAFC] inline-flex items-center justify-center gap-1.5 shadow-2xs active:scale-95 transition-all duration-300 ease-in-out shrink-0 cursor-pointer group"
            >
              <svg
                className="w-5 h-5 text-[#0d9488] dark:text-[#2DD4BF] group-hover:scale-110 transition-transform"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M4 6.5h16M4 12h16M4 17.5h11"
                  stroke="currentColor"
                  strokeWidth="2.3"
                  strokeLinecap="round"
                />
              </svg>
              <span className="text-xs font-bold">
                {isEn ? 'Menu' : 'القائمة'}
              </span>
            </button>

            {/* Prominent Notifications Quick Bell Button with Live Unread Badge */}
            <button
              id="header-notifications-quick-btn"
              data-testid="header-notifications-quick-btn"
              type="button"
              onClick={() => onNavigate('notifications')}
              title={isEn ? 'Smart Family Notifications' : 'مركز التنبيهات والتذكيرات الذكية'}
              aria-label={
                isEn
                  ? `Notifications (${unreadNotifCount} unread)`
                  : `التنبيهات (${unreadNotifCount} غير مقروءة)`
              }
              className={`relative min-h-[48px] min-w-[48px] px-3 rounded-2xl border inline-flex items-center justify-center gap-1.5 shadow-2xs active:scale-95 transition-all duration-300 ease-in-out shrink-0 cursor-pointer ${
                isNotificationsActive
                  ? 'border-[#0d9488] bg-[#0d9488] text-white'
                  : 'border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-bg)] dark:bg-[#142430] hover:border-[#FF8C61] text-[var(--color-text)] dark:text-[#F8FAFC]'
              }`}
            >
              <svg
                className={`w-5 h-5 ${
                  isNotificationsActive ? 'text-white' : 'text-[#FF8C61]'
                }`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {unreadNotifCount > 0 && (
                <span
                  data-testid="header-notifications-unread-badge"
                  className="px-1.5 min-w-[18px] h-[18px] rounded-full bg-[#FF8C61] text-white text-[10px] font-black inline-flex items-center justify-center tabular-nums shadow-2xs"
                >
                  {unreadNotifCount}
                </span>
              )}
            </button>

            {/* Super-Compact Minimalist Weather Widget Directly Beside the Notification Bell */}
            <button
              id="header-weather-quick-btn"
              data-testid="header-weather-quick-btn"
              type="button"
              onClick={() => setWeatherModalOpen(true)}
              title={
                isEn
                  ? `Weather in ${localizedCity}: ${compactWeather.tempC}°C — Tap for full details`
                  : `طقس ${localizedCity}: ${compactWeather.tempC}°م — اضغط للتفاصيل الكاملة وتوصيات ملابس الأطفال`
              }
              aria-label={
                isEn
                  ? `Weather in ${localizedCity}: ${compactWeather.tempC} degrees Celsius. Open weather details`
                  : `طقس ${localizedCity} ${compactWeather.tempC} درجة مئوية. افتح تفاصيل الطقس`
              }
              className="min-h-[48px] px-3 rounded-2xl border border-sky-500/30 dark:border-[#1E3646] bg-sky-50/80 dark:bg-[#142430] hover:border-sky-500 text-[var(--color-text)] dark:text-[#F8FAFC] inline-flex items-center justify-center gap-1.5 shadow-2xs active:scale-95 transition-all duration-300 ease-in-out shrink-0 cursor-pointer"
            >
              <span className="text-base leading-none" aria-hidden="true">
                {compactWeather.conditionEmoji}
              </span>
              <span className="text-xs font-black tabular-nums text-sky-700 dark:text-sky-300">
                {compactWeather.tempC}°C
              </span>
            </button>
          </div>

          {/* Exclusive Top-Level Brand Wordmark */}
          <button
            type="button"
            onClick={() => onNavigate('home')}
            aria-label={isEn ? 'Nekbaar Home' : 'رئيسية نكبر'}
            className="min-h-[48px] px-1.5 flex items-center gap-2 text-start group focus:outline-none active:scale-95 transition-all duration-300 ease-in-out cursor-pointer min-w-0"
          >
            <div className="min-w-0 text-end">
              <div className="flex flex-col items-end">
                <span className="font-bold text-xl text-[var(--color-text)] dark:text-[#F8FAFC] leading-tight tracking-tight shrink-0">
                  {brandName}
                </span>
                <span
                  data-testid="header-official-slogan-badge"
                  className="text-[10px] font-semibold text-[#0d9488] dark:text-[#2DD4BF] leading-tight whitespace-nowrap"
                >
                  {isEn ? 'Family Hub' : 'وبحبهم نكبر'}
                </span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#0d9488] to-[#FF8C61] flex items-center justify-center p-0.5 shadow-2xs group-hover:scale-105 transition-transform shrink-0">
              <ThreeDIcon id="home" size={22} />
            </div>
          </button>
        </div>
      </header>

      {/* Expanded Weather Details Modal when clicking the Header Weather Widget */}
      {weatherModalOpen && (
        <div
          id="header-weather-details-modal"
          data-testid="header-weather-details-modal"
          role="dialog"
          aria-modal="true"
          aria-label={isEn ? 'Expanded Family Weather Details' : 'تفاصيل الطقس وتوصيات ملابس وخروج الأطفال'}
          onClick={() => setWeatherModalOpen(false)}
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-3 animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[430px] rounded-3xl border border-gray-100 dark:border-[#1E3646] bg-white dark:bg-[#101D26] p-4 space-y-4 shadow-2xl max-h-[88dvh] overflow-y-auto pb-safe"
          >
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-[#1E3646]">
              <div className="flex items-center gap-2.5">
                <span className="w-11 h-11 rounded-2xl bg-sky-500/15 text-sky-600 dark:text-sky-300 flex items-center justify-center text-xl shrink-0">
                  {compactWeather.conditionEmoji}
                </span>
                <div>
                  <h3 className="text-base font-semibold text-[var(--color-text)] dark:text-[#F8FAFC]">
                    {isEn
                      ? `Family Weather · ${localizedCity}`
                      : `حالة الطقس ودليل الأطفال · ${localizedCity}`}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-[#94A3B8]">
                    {isEn
                      ? 'Live temperature & clothing tips for Hamza, Laila & Youssef'
                      : 'درجة الحرارة الآن ونصائح ملابس حمزة وليلى ويوسف'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                data-testid="close-header-weather-modal-btn"
                onClick={() => setWeatherModalOpen(false)}
                aria-label={isEn ? 'Close weather modal' : 'إغلاق نافذة الطقس'}
                className="min-w-[48px] min-h-[48px] rounded-2xl bg-[var(--color-control-muted)] dark:bg-[#142430] text-[var(--color-text)] dark:text-[#F8FAFC] text-base font-bold flex items-center justify-center active:scale-95 transition-all duration-300 ease-in-out cursor-pointer shrink-0"
              >
                ×
              </button>
            </div>

            {/* Interactive LiveWeatherWidget inside modal */}
            <LiveWeatherWidget
              city={activeCity}
              country={country}
              language={lang}
              darkMode={darkMode}
              userCoords={userCoords}
              onSelectCity={(cCode, cName) => {
                onSelectCity?.(cCode, cName);
              }}
            />

            {/* Extra Expanded Details: Humidity, Wind, UV & Child-Specific Guidance */}
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-2xl border border-gray-100 dark:border-[#1E3646] bg-slate-50 dark:bg-[#142430] p-3 text-center">
                <div className="text-xs text-gray-500 dark:text-[#94A3B8]">
                  💧 {isEn ? 'Humidity' : 'الرطوبة'}
                </div>
                <div className="text-sm font-bold text-sky-600 dark:text-sky-300 tabular-nums mt-0.5">
                  {compactWeather.humidity}%
                </div>
              </div>
              <div className="rounded-2xl border border-gray-100 dark:border-[#1E3646] bg-slate-50 dark:bg-[#142430] p-3 text-center">
                <div className="text-xs text-gray-500 dark:text-[#94A3B8]">
                  🌬️ {isEn ? 'Wind' : 'الرياح'}
                </div>
                <div className="text-sm font-bold text-[#0d9488] dark:text-[#2DD4BF] tabular-nums mt-0.5">
                  {compactWeather.windKmh} {isEn ? 'km/h' : 'كم/س'}
                </div>
              </div>
              <div className="rounded-2xl border border-gray-100 dark:border-[#1E3646] bg-slate-50 dark:bg-[#142430] p-3 text-center">
                <div className="text-xs text-gray-500 dark:text-[#94A3B8]">
                  👕 {isEn ? 'Outfit' : 'الملابس'}
                </div>
                <div className="text-xs font-bold text-amber-700 dark:text-amber-300 mt-0.5">
                  {isEn ? 'Light Cotton' : 'قطن خفيف'}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-teal-500/25 bg-teal-50/60 dark:bg-[#142430] p-4 space-y-1.5">
              <div className="text-base font-semibold text-[#0d9488] dark:text-[#2DD4BF]">
                🧭 {isEn ? 'Tailored Parenting Weather Advice:' : 'توصية الطقس اليوم لحمزة وليلى ويوسف:'}
              </div>
              <p className="text-sm leading-relaxed text-[var(--color-text)] dark:text-[#CBD5E1]">
                {isEn
                  ? 'Great weather for Youssef’s afternoon sports practice and a 20-minute stroller walk with baby Hamza before sunset. Pack an extra water bottle for Laila at nursery.'
                  : 'الجو مناسب جداً لتمرين يوسف بعد العصر، وتمشية خفيفة بعربية الرضيع مع حمزة لمدة ٢٠ دقيقة قبل الغروب، مع تزويد ليلى بزمزمية مياه إضافية في الحضانة.'}
              </p>
            </div>

            <div className="pt-1">
              <button
                type="button"
                onClick={() => setWeatherModalOpen(false)}
                className="w-full min-h-[48px] px-5 py-3 rounded-2xl bg-[#0d9488] hover:bg-[#0f766e] text-white text-sm font-bold active:scale-95 transition-all duration-300 ease-in-out cursor-pointer"
              >
                {isEn ? 'Done' : 'حسناً، فهمت'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

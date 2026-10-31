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
        className="sticky top-0 z-30 w-full border-b border-gray-200/80 dark:border-[#1E3646] glass-sticky-header transition-all duration-200 select-none"
      >
        <div className="max-w-[430px] mx-auto px-3 py-1.5 flex items-center justify-between gap-2">
          {/* Compact Control Group: Menu + Notifications + Weather */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              id="master-slidebar-trigger-btn"
              data-testid="master-slidebar-trigger-btn"
              type="button"
              onClick={onOpenProfileDrawer}
              title={isEn ? 'Explore Family Space' : 'استكشف مساحة الأسرة'}
              aria-label={isEn ? 'Open Family Navigation' : 'فتح قائمة الأسرة'}
              className="header-control min-h-[42px] px-1.5 rounded-xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-bg)] dark:bg-[#142430] hover:border-[#0d9488] text-[var(--color-text)] dark:text-[#F8FAFC] inline-flex items-center justify-center gap-1 shadow-2xs active:scale-95 transition-transform duration-150 shrink-0 cursor-pointer"
            >
              <svg
                className="w-4 h-4 text-[#0d9488] dark:text-[#2DD4BF]"
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
                {isEn ? 'Explore' : 'استكشف'}
              </span>
            </button>

            <button
              id="header-notifications-quick-btn"
              data-testid="header-notifications-quick-btn"
              type="button"
              onClick={() => onNavigate('notifications')}
              title={isEn ? 'Notifications' : 'التنبيهات'}
              aria-label={isEn ? 'Notifications' : 'التنبيهات'}
              className={`header-control relative min-h-[42px] min-w-[42px] rounded-xl border inline-flex items-center justify-center shadow-2xs active:scale-95 transition-transform duration-150 shrink-0 cursor-pointer ${
                isNotificationsActive
                  ? 'border-[#0d9488] bg-[#0d9488] text-white'
                  : 'border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-bg)] dark:bg-[#142430] hover:border-[#FF8C61] text-[var(--color-text)] dark:text-[#F8FAFC]'
              }`}
            >
              <svg
                className={`w-[18px] h-[18px] ${
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
                  className="absolute -top-1 -end-1 px-1 min-w-[16px] h-[16px] rounded-full bg-[#FF8C61] text-white text-[9px] font-black inline-flex items-center justify-center tabular-nums shadow-2xs"
                >
                  {unreadNotifCount}
                </span>
              )}
            </button>

            <button
              id="header-weather-quick-btn"
              data-testid="header-weather-quick-btn"
              type="button"
              onClick={() => setWeatherModalOpen(true)}
              title={
                isEn
                  ? `View live weather for ${localizedCity}`
                  : `عرض الطقس الحالي في ${localizedCity}`
              }
              aria-label={
                isEn
                  ? `View live weather in ${localizedCity}`
                  : `عرض الطقس الحالي في ${localizedCity}`
              }
              className="header-control min-h-[42px] px-2 rounded-xl border border-sky-500/30 dark:border-[#1E3646] bg-sky-50/80 dark:bg-[#142430] hover:border-sky-500 text-[var(--color-text)] dark:text-[#F8FAFC] inline-flex items-center justify-center gap-1 shadow-2xs active:scale-95 transition-transform duration-150 shrink-0 cursor-pointer"
            >
              <span className="text-sm leading-none" aria-hidden="true">
                {compactWeather.conditionEmoji}
              </span>
              <span className="text-xs font-bold text-sky-700 dark:text-sky-300">
                {isEn ? 'Weather' : 'الطقس'}
              </span>
            </button>
          </div>

          {/* Compact Brand Wordmark & Logo */}
          <button
            type="button"
            onClick={() => onNavigate('home')}
            aria-label={brandName}
            className="min-h-[36px] px-0.5 flex items-center gap-1.5 text-start group focus:outline-none active:scale-95 transition-transform duration-150 cursor-pointer min-w-0 shrink-0 justify-end"
          >
            <span className="shrink-0 font-black text-[15px] text-[var(--color-text)] dark:text-[#F8FAFC] leading-tight tracking-tight">
              {brandName}
            </span>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#0d9488] to-[#FF8C61] flex items-center justify-center p-0.5 shadow-2xs group-hover:scale-105 transition-transform shrink-0">
              <ThreeDIcon id="home" size={20} />
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
                      ? 'Local weather and practical family tips'
                      : 'حالة الطقس ونصائح مناسبة لأنشطة الأسرة'}
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

            <div className="rounded-2xl border border-sky-500/25 bg-sky-50/70 dark:bg-[#142430] p-3 space-y-1.5">
              <p className="text-sm font-bold text-sky-800 dark:text-sky-200">
                {isEn ? 'A quick reminder' : 'تذكير سريع'}
              </p>
              <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-200">
                {isEn
                  ? 'Check local conditions before heading out, then adjust clothing, sun protection and hydration to the day.'
                  : 'تحققوا من حالة الطقس قبل الخروج، واختاروا الملابس ووسائل الحماية والترطيب بما يناسب اليوم.'}
              </p>
            </div>

            <div className="pt-1">
              <button
                type="button"
                onClick={() => setWeatherModalOpen(false)}
                className="w-full min-h-[48px] px-5 py-3 rounded-2xl bg-[#0d9488] hover:bg-[#0f766e] text-white text-sm font-bold active:scale-95 transition-all duration-300 ease-in-out cursor-pointer"
              >
                {isEn ? 'Done' : 'تم'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

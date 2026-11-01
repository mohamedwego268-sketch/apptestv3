import React from 'react';
import {
  CountryCode,
  LanguageCode,
  ParentThemeRole,
} from '../domain/familySpaceCore';
import { SoftFilledIcon } from './DesignSystem';

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
  unreadNotifCount: number;
  openTasksCount?: number;
  parentProfileSpec: HeaderBarProfileSpec;
  activePage: string;
  navItems: Array<{ id: any; shortLabel: string }>;
  onNavigate: (page: any) => void;
  onToggleDarkMode: () => void;
  onToggleLanguage?: () => void;
  onOpenSmartPlanner: () => void;
  onOpenProfileDrawer: () => void;
  isScrolled: boolean;
  bedtimeMode?: boolean;
  onToggleBedtimeMode?: () => void;
  country?: CountryCode;
  city?: string;
  userCoords?: { lat: number; lng: number } | null;
  onSelectCity?: (country: CountryCode, cityName: string) => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  lang,
  darkMode,
  unreadNotifCount,
  activePage,
  onNavigate,
  onOpenProfileDrawer,
  isScrolled,
}) => {
  const isEn = lang === 'en';

  return (
    <header
      id="main-sticky-header"
      data-testid="minimal-top-header-bar"
      className={`sticky top-0 z-50 transition-all duration-200 ${
        isScrolled
          ? 'glass-sticky-header shadow-xs border-b border-gray-200/80 dark:border-[#1E3646]'
          : 'bg-[var(--color-surface)]/95 dark:bg-[#101D26]/95 border-b border-gray-200/60 dark:border-[#1E3646]'
      }`}
    >
      <div className="w-full max-w-[430px] mx-auto px-3 py-1.5 min-h-[46px] flex items-center justify-between gap-2">
        {/* Start: Brand Logo + Official Slogan */}
        <button
          id="brand-home-btn"
          type="button"
          onClick={() => onNavigate('home')}
          aria-label={isEn ? 'Nekbaar — Home' : 'نكبر — الرئيسية'}
          className="flex items-center gap-2 text-start group focus:outline-none min-w-0 shrink cursor-pointer"
        >
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#0F766E] to-[#14B8A6] text-white flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform shrink-0">
            <svg
              width="16"
              height="16"
              viewBox="0 0 36 36"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <circle cx="12.5" cy="11.5" r="3.2" fill="#FFFFFF" />
              <circle cx="23.5" cy="11.5" r="3.2" fill="#FFFFFF" />
              <circle cx="18" cy="15.5" r="2.6" fill="#FDE68A" />
              <path
                d="M7.5 23.5C7.5 19.8 10.6 17.5 14.2 17.5H21.8C25.4 17.5 28.5 19.8 28.5 23.5V25.2C28.5 26.5 27.4 27.5 26.1 27.5H9.9C8.6 27.5 7.5 26.5 7.5 25.2V23.5Z"
                fill="#FFFFFF"
                fillOpacity="0.92"
              />
              <path
                d="M18 25.2C18 25.2 13.5 22.3 13.5 19.8C13.5 18.5 14.5 17.6 15.7 17.6C16.6 17.6 17.5 18.1 18 18.9C18.5 18.1 19.4 17.6 20.3 17.6C21.5 17.6 22.5 18.5 22.5 19.8C22.5 22.3 18 25.2 18 25.2Z"
                fill="#FF8C61"
              />
            </svg>
          </div>
          <div className="leading-tight min-w-0">
            <span className="block font-extrabold text-sm tracking-tight text-[var(--color-text)] dark:text-[#F8FAFC] truncate">
              {isEn ? 'Nekbaar' : 'نكبر'}
            </span>
            <span className="block text-[9.5px] font-bold text-[#0d9488] dark:text-[#2DD4BF] truncate">
              {isEn ? 'Growing together with love' : 'مساحة تجمعنا.. وبحبهم نكبر'}
            </span>
          </div>
        </button>

        {/* End: Compact Notifications Bell + Slidebar Drawer Button */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* 1. Notifications Bell */}
          <button
            id="header-notifications-btn"
            data-testid="header-notifications-btn"
            type="button"
            onClick={() => onNavigate('notifications')}
            aria-label={
              unreadNotifCount > 0
                ? isEn
                  ? `Notifications (${unreadNotifCount} unread)`
                  : `الإشعارات (${unreadNotifCount} غير مقروءة)`
                : isEn
                ? 'Notifications'
                : 'الإشعارات'
            }
            className={`relative min-w-[34px] min-h-[34px] w-[34px] h-[34px] rounded-xl border flex items-center justify-center transition-all active:scale-95 cursor-pointer ${
              activePage === 'notifications'
                ? 'border-[#0d9488] bg-[#0d9488]/12'
                : 'border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-bg)] dark:bg-[#142430] hover:border-[#0d9488]'
            }`}
          >
            <SoftFilledIcon id="notifications" size={16} />
            {unreadNotifCount > 0 && (
              <span
                data-testid="header-notifications-badge"
                className="absolute -top-1 -end-1 min-w-[16px] h-[16px] px-1 rounded-full bg-[#FF8C61] text-white text-[9px] font-extrabold flex items-center justify-center tabular-nums shadow-2xs"
              >
                {unreadNotifCount}
              </span>
            )}
          </button>

          {/* 2. Slidebar Menu Button */}
          <button
            id="header-slidebar-menu-btn"
            data-testid="header-slidebar-menu-btn"
            type="button"
            onClick={onOpenProfileDrawer}
            aria-label={isEn ? 'Open navigation menu' : 'فتح القائمة الجانبية'}
            className="min-h-[34px] h-[34px] px-2.5 py-1 rounded-xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-bg)] dark:bg-[#142430] hover:border-[#0d9488] text-[var(--color-text)] dark:text-[#F8FAFC] flex items-center justify-center gap-1.5 shadow-2xs active:scale-95 transition-all cursor-pointer"
          >
            <span className="flex flex-col items-center justify-center gap-[3px] w-3.5" aria-hidden="true">
              <span
                className={`block w-3.5 h-[1.8px] rounded-full ${
                  darkMode ? 'bg-[#F8FAFC]' : 'bg-slate-800'
                }`}
              />
              <span
                className={`block w-3.5 h-[1.8px] rounded-full ${
                  darkMode ? 'bg-[#2DD4BF]' : 'bg-[#0d9488]'
                }`}
              />
              <span
                className={`block w-2.5 h-[1.8px] rounded-full self-end ${
                  darkMode ? 'bg-[#F8FAFC]' : 'bg-slate-800'
                }`}
              />
            </span>
            <span className="text-[11px] font-extrabold leading-none">
              {isEn ? 'Menu' : 'القائمة'}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};

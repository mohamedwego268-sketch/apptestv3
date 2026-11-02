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
      <div className="nekbaar-header-inner w-full max-w-[430px] mx-auto grid grid-cols-[minmax(0,1fr)_96px] items-center gap-2 px-3 py-2 min-h-[62px]">
        {/* Start: Brand Logo + Official Slogan */}
        <button
          id="brand-home-btn"
          type="button"
          onClick={() => onNavigate('home')}
          aria-label={isEn ? 'Nekbaar — Home' : 'نكبر — الرئيسية'}
          className="flex min-w-0 w-full items-center gap-2 text-start group focus:outline-none cursor-pointer"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#0F766E] to-[#14B8A6] text-white flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform shrink-0">
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
          <div className="min-w-0 flex-1 leading-[1.25]">
            <span className="block font-extrabold text-[13px] tracking-tight text-[var(--color-text)] dark:text-[#F8FAFC] truncate">
              {isEn ? 'Nekbaar' : 'نكبر'}
            </span>
            <span className="mt-0.5 block max-w-full whitespace-normal break-words text-[9px] font-bold leading-[1.35] text-[#0d9488] dark:text-[#2DD4BF]">
              {isEn ? 'Growing together with love' : 'مساحة تجمعنا.. وبحبهم نكبر'}
            </span>
          </div>
        </button>

        {/* End: Compact Notifications Bell + Slidebar Drawer Button */}
        <div className="nekbaar-header-actions flex w-24 shrink-0 items-center justify-end gap-2">
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
            className={`relative min-w-[44px] min-h-[44px] w-[44px] h-[44px] rounded-xl border flex items-center justify-center transition-all active:scale-95 cursor-pointer ${
              activePage === 'notifications'
                ? 'border-[#0d9488] bg-[#0d9488]/12'
                : 'border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-bg)] dark:bg-[#142430] hover:border-[#0d9488]'
            }`}
          >
            <SoftFilledIcon id="notifications" size={16} />
            {unreadNotifCount > 0 && (
              <span
                data-testid="header-notifications-badge"
                className="absolute -top-1 -end-1 z-10 min-w-[18px] h-[18px] px-1 rounded-full bg-[#FF8C61] text-white text-[9px] font-extrabold flex items-center justify-center tabular-nums shadow-2xs"
              >
                {unreadNotifCount > 99 ? '99+' : unreadNotifCount}
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
            className="nekbaar-header-menu-btn relative inline-flex h-11 min-h-[44px] w-11 min-w-[44px] shrink-0 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] text-[var(--color-text)] shadow-2xs transition-all hover:border-[#0d9488] active:scale-95 dark:border-[#1E3646] dark:bg-[#142430] dark:text-[#F8FAFC]"
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
            <span className="sr-only">{isEn ? 'Menu' : 'القائمة'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};

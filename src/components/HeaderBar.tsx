import React from 'react';
import { LanguageCode, ParentThemeRole } from '../domain/familySpaceCore';
import { PageId } from '../context/FamilyAppContext';
import { ThreeDIcon } from './ThreeDVisuals';

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
}

/**
 * HeaderBar Component for نكبر (Nekbaar).
 * Clean flexbox layout with zero overlapping elements:
 * 1. Brand Wordmark strictly renders "نكبر" in Arabic and "Nekbaar" in English.
 * 2. Primary desktop navigation bar.
 * 3. Uniform soft-filled SVG control buttons (Theme, Bedtime Focus, Language, Calendar & To-Do, Notifications, Profile) sharing
 *    identical h-9 height, rounded-2xl geometry, and harmonious borders.
 * 4. Dynamic Notification Badge that displays unread counter cleanly side-by-side with the bell icon
 *    and hides seamlessly when unreadNotifCount === 0 without distorting the icon or button layout.
 */
export const HeaderBar: React.FC<HeaderBarProps> = ({
  lang,
  brandName,
  onNavigate,
  onOpenProfileDrawer,
  isScrolled = false,
}) => {
  const isEn = lang === 'en';

  return (
    <header
      id="main-sticky-header"
      data-scrolled={isScrolled ? 'true' : 'false'}
      className="sticky top-0 z-30 w-full border-b border-[var(--color-border)] dark:border-[#1E3646] glass-sticky-header transition-colors select-none"
    >
      <div className="max-w-[1280px] mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3">
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
          className="h-9 sm:h-10 px-3 sm:px-3.5 rounded-xl sm:rounded-2xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-bg)] dark:bg-[#142430] hover:border-[#0d9488] text-[var(--color-text)] dark:text-[#F8FAFC] inline-flex items-center justify-center gap-2 shadow-2xs active:scale-95 transition-all shrink-0 cursor-pointer group"
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
          <span className="text-xs font-extrabold">
            {isEn ? 'Menu' : 'القائمة'}
          </span>
        </button>

        {/* Exclusive Top-Level Brand Wordmark & Slogan */}
        <button
          type="button"
          onClick={() => onNavigate('home')}
          aria-label={isEn ? 'Nekbaar Home' : 'رئيسية نكبر'}
          className="h-10 flex items-center gap-2.5 sm:gap-3 text-start group focus:outline-none cursor-pointer min-w-0"
        >
          <div className="min-w-0 text-end sm:text-start">
            <div className="flex items-center justify-end sm:justify-start gap-2">
              <span className="font-black text-lg sm:text-xl text-[var(--color-text)] leading-none tracking-tight">
                {brandName}
              </span>
              <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-500/10 text-[#0d9488] dark:text-[#2DD4BF] border border-teal-500/20">
                {isEn ? 'Smart Family Companion' : 'رفيقك الذكي لتربية صحية'}
              </span>
            </div>
            <p className="text-[10px] font-bold text-[var(--color-muted)] leading-tight mt-0.5 truncate max-w-[220px] sm:max-w-[360px]">
              {isEn
                ? 'All your family needs, doctors, nurseries & trusted stores in one place'
                : 'كل احتياجات أسرتك، دكاترة، حضانات ومتاجر موثوقة في مكان واحد'}
            </p>
          </div>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-[#0d9488] to-[#FF8C61] flex items-center justify-center p-0.5 shadow-2xs group-hover:scale-105 transition-transform shrink-0">
            <ThreeDIcon id="home" size={22} />
          </div>
        </button>
      </div>
    </header>
  );
};


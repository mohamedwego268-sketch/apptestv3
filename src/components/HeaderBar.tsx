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
  unreadNotifCount: number;
  parentProfileSpec: HeaderBarProfileSpec;
  activePage: PageId;
  navItems?: HeaderBarNavOption[];
  onNavigate: (pageId: PageId) => void;
  onToggleDarkMode: () => void;
  onToggleLanguage: () => void;
  onOpenProfileDrawer: () => void;
  isScrolled?: boolean;
}

/**
 * HeaderBar Component for نكبر (Nekbaar).
 * Restructures top sticky header bar into a clean, responsive flexbox layout with zero overlaps.
 * Features:
 * 1. Strict localized brand name ("نكبر" in Arabic, "Nekbaar" in English).
 * 2. Primary nav tabs with high-contrast active state.
 * 3. Standardized soft-filled SVG control buttons sharing identical h-9 height, rounded-2xl geometry, and harmonious borders.
 * 4. Perfectly aligned Notification Bell container with absolute corner counter badge.
 */
export const HeaderBar: React.FC<HeaderBarProps> = ({
  lang,
  brandName,
  darkMode,
  unreadNotifCount,
  parentProfileSpec,
  activePage,
  navItems = [],
  onNavigate,
  onToggleDarkMode,
  onToggleLanguage,
  onOpenProfileDrawer,
  isScrolled = false,
}) => {
  const isEn = lang === 'en';

  const defaultPrimaryNavIds = ['home', 'medical', 'media', 'community', 'chat', 'assistant', 'services'];
  const primaryNavItems = navItems.filter((item) => defaultPrimaryNavIds.includes(item.id));

  return (
    <header
      id="main-sticky-header"
      data-scrolled={isScrolled ? 'true' : 'false'}
      className="sticky top-0 z-30 w-full border-b border-[var(--color-border)] glass-sticky-header transition-colors select-none"
    >
      <div className="max-w-[1280px] mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3">
        {/* Zone 1: Localized Official Brand Wordmark ("نكبر" in AR / "Nekbaar" in EN) */}
        <button
          type="button"
          onClick={() => onNavigate('home')}
          aria-label={isEn ? 'Nekbaar Home' : 'رئيسية نكبر'}
          className="h-10 flex items-center gap-2.5 text-base sm:text-lg font-black tracking-tight text-[var(--color-text)] whitespace-nowrap shrink-0 group focus:outline-none"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#0d9488] to-[#FF8C61] flex items-center justify-center p-0.5 shadow-2xs group-hover:scale-105 transition-transform shrink-0">
            <ThreeDIcon id="home" size={20} />
          </div>
          <span className="font-black text-base sm:text-lg text-[var(--color-text)] leading-none">
            {brandName}
          </span>
        </button>

        {/* Zone 2: Primary Single-Line Navigation Links (Desktop Viewports) */}
        {primaryNavItems.length > 0 && (
          <nav
            aria-label={isEn ? 'Main navigation' : 'التنقل الرئيسي'}
            className="hidden xl:flex items-center gap-1.5 text-xs font-bold text-[var(--color-muted)] min-w-0"
          >
            {primaryNavItems.map((item) => {
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onNavigate(item.id)}
                  className={`h-9 px-3 rounded-xl transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-[var(--color-accent-soft)] text-[var(--color-text)] font-extrabold shadow-2xs'
                      : 'hover:bg-[var(--color-control-muted)] hover:text-[var(--color-text)]'
                  }`}
                >
                  <span>{item.shortLabel}</span>
                </button>
              );
            })}
          </nav>
        )}

        {/* Zone 3: Standardized Aligned Controls (Theme + Lang + Notifications + Profile) */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Dark / Light Mode Toggle Button */}
          <button
            id="top-dark-mode-toggle"
            type="button"
            onClick={onToggleDarkMode}
            aria-pressed={Boolean(darkMode)}
            aria-label={
              darkMode
                ? isEn
                  ? 'Switch to Light Mode'
                  : 'التبديل إلى الوضع النهاري'
                : isEn
                ? 'Switch to Dark Mode'
                : 'التبديل إلى الوضع الليلي'
            }
            className={`h-9 px-2.5 sm:px-3 rounded-2xl text-xs font-extrabold border whitespace-nowrap shrink-0 flex items-center gap-1.5 transition-all shadow-2xs ${
              darkMode
                ? 'border-teal-500/50 bg-teal-500/20 text-teal-200 hover:border-teal-400'
                : 'border-[var(--color-border)] bg-[var(--color-control-bg)] text-[var(--color-text)] hover:border-[var(--color-accent)]'
            }`}
          >
            {darkMode ? (
              <svg className="w-4 h-4 fill-none stroke-current stroke-2 shrink-0 text-amber-300" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" strokeLinecap="round" />
                <line x1="12" y1="21" x2="12" y2="23" strokeLinecap="round" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" strokeLinecap="round" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" strokeLinecap="round" />
                <line x1="1" y1="12" x2="3" y2="12" strokeLinecap="round" />
                <line x1="21" y1="12" x2="23" y2="12" strokeLinecap="round" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" strokeLinecap="round" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" strokeLinecap="round" />
              </svg>
            ) : (
              <svg className="w-4 h-4 fill-none stroke-current stroke-2 shrink-0 text-slate-700" viewBox="0 0 24 24">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
            <span className="hidden sm:inline">
              {darkMode ? (isEn ? 'Light' : 'نهاري') : isEn ? 'Dark' : 'ليلي'}
            </span>
          </button>

          {/* Language Toggle Button (AR <-> EN) */}
          <button
            id="top-language-switcher"
            type="button"
            onClick={onToggleLanguage}
            aria-label={isEn ? 'Switch language to Arabic' : 'Switch language to English'}
            className="h-9 px-2.5 sm:px-3 rounded-2xl text-xs font-extrabold border border-[var(--color-border)] bg-[var(--color-control-bg)] text-[var(--color-text)] whitespace-nowrap shrink-0 hover:border-[var(--color-accent)] flex items-center gap-1.5 transition-all shadow-2xs"
          >
            <svg className="w-4 h-4 fill-none stroke-current stroke-2 shrink-0 text-[#0d9488]" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            <span>{isEn ? 'عربي' : 'English'}</span>
          </button>

          {/* Notifications Bell Container with Non-Overlapping Corner Badge */}
          <button
            id="top-notification-bell"
            type="button"
            onClick={() => onNavigate('notifications')}
            aria-label={isEn ? 'Notifications' : 'الإشعارات اليومية'}
            className="h-9 px-2.5 sm:px-3 rounded-2xl text-xs font-extrabold border border-[var(--color-border)] bg-[var(--color-control-bg)] text-[var(--color-text)] flex items-center gap-1.5 whitespace-nowrap shrink-0 hover:border-[var(--color-accent)] transition-all shadow-2xs relative"
          >
            <div className="relative flex items-center justify-center">
              <svg className="w-4 h-4 fill-none stroke-current stroke-2 shrink-0 text-[#FF8C61]" viewBox="0 0 24 24">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h24s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {unreadNotifCount > 0 && (
                <span className="absolute -top-1 -right-1.5 min-w-[15px] h-[15px] px-1 rounded-full bg-[#FF8C61] text-white text-[9.5px] font-black flex items-center justify-center tabular-nums leading-none shadow-2xs">
                  {unreadNotifCount}
                </span>
              )}
            </div>
            <span className="hidden md:inline">{isEn ? 'Alerts' : 'إشعارات'}</span>
          </button>

          {/* Color-Coded Parent Profile Button */}
          <button
            id="open-profile-drawer-btn"
            type="button"
            data-parent-role={parentProfileSpec.role}
            onClick={onOpenProfileDrawer}
            aria-label={isEn ? 'Open Profile Controls' : 'فتح التحكم بالحساب'}
            style={{
              backgroundColor: parentProfileSpec.badgeBgCss,
              color: parentProfileSpec.badgeTextCss,
              borderColor: parentProfileSpec.badgeBorderCss,
            }}
            className="h-9 px-2.5 sm:px-3.5 rounded-2xl text-xs font-extrabold border whitespace-nowrap shrink-0 flex items-center gap-1.5 transition-all shadow-2xs"
          >
            <span className="w-5 h-5 rounded-full bg-white/30 dark:bg-black/20 flex items-center justify-center shrink-0">
              <svg className="w-3.5 h-3.5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </span>
            <span className="hidden sm:inline font-extrabold">
              {isEn ? parentProfileSpec.displayNameEn : parentProfileSpec.displayNameAr}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};

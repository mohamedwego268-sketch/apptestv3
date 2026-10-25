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
  openTasksCount?: number;
  parentProfileSpec: HeaderBarProfileSpec;
  activePage: PageId;
  navItems?: HeaderBarNavOption[];
  onNavigate: (pageId: PageId) => void;
  onToggleDarkMode: () => void;
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
 * 3. Uniform soft-filled SVG control buttons (Theme, Language, Calendar & To-Do, Notifications, Profile) sharing
 *    identical h-9 height, rounded-2xl geometry, and harmonious borders.
 * 4. Dynamic Notification Badge that displays unread counter cleanly side-by-side with the bell icon
 *    and hides seamlessly when unreadNotifCount === 0 without distorting the icon or button layout.
 */
export const HeaderBar: React.FC<HeaderBarProps> = ({
  lang,
  brandName,
  darkMode,
  unreadNotifCount,
  openTasksCount = 0,
  parentProfileSpec,
  activePage,
  navItems = [],
  onNavigate,
  onToggleDarkMode,
  onToggleLanguage,
  onOpenSmartPlanner,
  onOpenProfileDrawer,
  isScrolled = false,
}) => {
  const isEn = lang === 'en';

  const defaultPrimaryNavIds: PageId[] = [
    'home',
    'medical',
    'media',
    'community',
    'chat',
    'assistant',
    'services',
  ];
  const primaryNavItems = navItems.filter((item) => defaultPrimaryNavIds.includes(item.id));

  const sharedControlBtnClass =
    'h-9 px-2.5 sm:px-3 rounded-2xl text-xs font-extrabold border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-bg)] dark:bg-[#142430] text-[var(--color-text)] dark:text-[#F8FAFC] hover:border-[var(--color-accent)] hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap shrink-0 inline-flex items-center justify-center gap-1.5 transition-all duration-300 ease-in-out shadow-2xs select-none cursor-pointer';

  return (
    <header
      id="main-sticky-header"
      data-scrolled={isScrolled ? 'true' : 'false'}
      className="sticky top-0 z-30 w-full border-b border-[var(--color-border)] dark:border-[#1E3646] glass-sticky-header transition-colors select-none"
    >
      <div className="max-w-[1280px] mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-3">
        {/* Zone 1: Localized Official Brand Wordmark (Strictly "نكبر" in AR or "Nekbaar" in EN) */}
        <button
          type="button"
          onClick={() => onNavigate('home')}
          aria-label={isEn ? 'Nekbaar Home' : 'رئيسية نكبر'}
          className="h-10 flex items-center gap-2.5 text-base sm:text-lg font-black tracking-tight text-[var(--color-text)] whitespace-nowrap shrink-0 group focus:outline-none cursor-pointer"
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
                  className={`h-9 px-3 rounded-xl transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer ${
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

        {/* Zone 3: Standardized Aligned Controls (Theme + Language + Calendar/To-Do + Notifications + Profile) */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* 1. Theme Toggle Button (Soft-Filled Sun / Moon SVG) */}
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
            className={sharedControlBtnClass}
          >
            {darkMode ? (
              <svg
                className="w-4 h-4 shrink-0 text-amber-400"
                viewBox="0 0 24 24"
                fill="currentColor"
                fillOpacity="0.22"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="4.5" />
                <path
                  strokeLinecap="round"
                  d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41m11.32-11.32l1.41-1.41"
                />
              </svg>
            ) : (
              <svg
                className="w-4 h-4 shrink-0 text-[#0d9488]"
                viewBox="0 0 24 24"
                fill="currentColor"
                fillOpacity="0.18"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
                />
              </svg>
            )}
            <span className="hidden sm:inline">
              {darkMode ? (isEn ? 'Light' : 'نهاري') : isEn ? 'Dark' : 'ليلي'}
            </span>
          </button>

          {/* 2. Language Toggle Button (Soft-Filled Globe SVG) */}
          <button
            id="top-language-switcher"
            type="button"
            onClick={onToggleLanguage}
            aria-label={isEn ? 'Switch language to Arabic' : 'Switch language to English'}
            className={sharedControlBtnClass}
          >
            <svg
              className="w-4 h-4 shrink-0 text-[#0d9488] dark:text-teal-300"
              viewBox="0 0 24 24"
              fill="currentColor"
              fillOpacity="0.16"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="9.5" />
              <line x1="2.5" y1="12" x2="21.5" y2="12" />
              <path d="M12 2.5a14.5 14.5 0 0 1 3.8 9.5 14.5 14.5 0 0 1-3.8 9.5 14.5 14.5 0 0 1-3.8-9.5 14.5 14.5 0 0 1 3.8-9.5z" />
            </svg>
            <span>{isEn ? 'عربي' : 'English'}</span>
          </button>

          {/* 3. Family Calendar & To-Do List Button ("مفكرة العيلة الذكية") */}
          <button
            id="top-calendar-todo-btn"
            type="button"
            onClick={() => {
              if (onOpenSmartPlanner) {
                onOpenSmartPlanner();
              } else {
                onNavigate('calendar');
              }
            }}
            aria-label={
              isEn
                ? 'Open Family Calendar & To-Do List'
                : 'فتح مفكرة العيلة الذكية وقائمة المهام'
            }
            className={`${sharedControlBtnClass} ${
              activePage === 'calendar' || activePage === 'routine'
                ? 'border-[#0d9488] dark:border-[#38BDF8]'
                : ''
            }`}
          >
            <svg
              className="w-4 h-4 shrink-0 text-[#0d9488] dark:text-[#38BDF8]"
              viewBox="0 0 24 24"
              fill="currentColor"
              fillOpacity="0.18"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="4" width="18" height="17" rx="3" />
              <line x1="8" y1="2.5" x2="8" y2="6" strokeLinecap="round" />
              <line x1="16" y1="2.5" x2="16" y2="6" strokeLinecap="round" />
              <line x1="3" y1="9.5" x2="21" y2="9.5" />
              <path
                d="M9.5 14.5l1.8 1.8 3.5-3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="hidden sm:inline">{isEn ? 'Planner' : 'المفكرة'}</span>
            {openTasksCount > 0 && (
              <span
                data-testid="header-planner-badge"
                className="min-w-[18px] h-[18px] px-1 rounded-full bg-[#0d9488] dark:bg-[#38BDF8] text-white dark:text-[#0B131A] text-[10px] font-black inline-flex items-center justify-center tabular-nums leading-none shadow-2xs shrink-0"
              >
                {openTasksCount}
              </span>
            )}
          </button>

          {/* 3. Notifications Bell Button (Non-Overlapping Inline Counter Pill) */}
          <button
            id="top-notification-bell"
            type="button"
            onClick={() => onNavigate('notifications')}
            aria-label={
              unreadNotifCount > 0
                ? isEn
                  ? `Notifications (${unreadNotifCount} unread)`
                  : `الإشعارات اليومية (${unreadNotifCount} غير مقروءة)`
                : isEn
                ? 'Notifications (All read)'
                : 'الإشعارات اليومية (مقروءة بالكامل)'
            }
            className={`${sharedControlBtnClass} ${
              activePage === 'notifications'
                ? 'border-[#FF8C61] dark:border-[#FF8C61]'
                : ''
            }`}
          >
            <svg
              className="w-4 h-4 shrink-0 text-[#FF8C61]"
              viewBox="0 0 24 24"
              fill="currentColor"
              fillOpacity="0.2"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
              />
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <span className="hidden md:inline">{isEn ? 'Alerts' : 'إشعارات'}</span>
            {unreadNotifCount > 0 && (
              <span
                data-testid="header-notif-badge"
                className="min-w-[19px] h-[19px] px-1.5 rounded-full bg-[#FF8C61] text-white text-[10px] font-black inline-flex items-center justify-center tabular-nums leading-none shadow-2xs shrink-0"
              >
                {unreadNotifCount}
              </span>
            )}
          </button>

          {/* 4. Parent Profile Drawer Button (Soft-Filled User Avatar SVG) */}
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
            className="h-9 px-2.5 sm:px-3.5 rounded-2xl text-xs font-extrabold border whitespace-nowrap shrink-0 inline-flex items-center justify-center gap-1.5 transition-all shadow-2xs select-none"
          >
            <span className="w-5 h-5 rounded-full bg-white/30 dark:bg-black/25 inline-flex items-center justify-center shrink-0">
              <svg
                className="w-3.5 h-3.5"
                viewBox="0 0 24 24"
                fill="currentColor"
                fillOpacity="0.2"
                stroke="currentColor"
                strokeWidth="2"
              >
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

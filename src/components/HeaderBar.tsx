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
  darkMode,
  bedtimeMode = false,
  unreadNotifCount,
  openTasksCount = 0,
  parentProfileSpec,
  activePage,
  navItems = [],
  onNavigate,
  onToggleDarkMode,
  onToggleBedtimeMode,
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
    'h-9 min-w-[36px] px-2.5 sm:px-3 rounded-2xl text-xs font-extrabold border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-bg)] dark:bg-[#142430] text-[var(--color-text)] dark:text-[#F8FAFC] hover:border-[var(--color-accent)] hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap shrink-0 inline-flex items-center justify-center gap-1.5 transition-all duration-300 ease-in-out shadow-2xs select-none cursor-pointer';

  const compactIconBadgeBtnClass =
    'w-9 h-9 rounded-2xl text-xs font-extrabold border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-bg)] dark:bg-[#142430] text-[var(--color-text)] dark:text-[#F8FAFC] hover:border-[var(--color-accent)] hover:scale-[1.02] active:scale-[0.98] shrink-0 inline-flex items-center justify-center transition-all duration-300 ease-in-out shadow-2xs select-none cursor-pointer';

  return (
    <header
      id="main-sticky-header"
      data-scrolled={isScrolled ? 'true' : 'false'}
      className="sticky top-0 z-30 w-full border-b border-[var(--color-border)] dark:border-[#1E3646] glass-sticky-header transition-colors select-none"
    >
      <div className="max-w-[1280px] mx-auto px-3.5 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2.5 sm:gap-4">
        {/* Zone 1: Localized Official Brand Wordmark (Strictly "نكبر" in AR or "Nekbaar" in EN) */}
        <button
          type="button"
          onClick={() => onNavigate('home')}
          aria-label={isEn ? 'Nekbaar Home' : 'رئيسية نكبر'}
          className="h-10 flex items-center gap-2 sm:gap-2.5 text-base sm:text-lg font-black tracking-tight text-[var(--color-text)] whitespace-nowrap shrink-0 group focus:outline-none cursor-pointer"
        >
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#0d9488] to-[#FF8C61] flex items-center justify-center p-0.5 shadow-2xs group-hover:scale-105 transition-transform shrink-0">
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

        {/* Zone 3: Standardized Well-Spaced Controls (Theme + Bedtime Mode + Sleek Language Globe 🌐 + Calendar/To-Do + Notifications + Profile) */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* 1. Theme Toggle Button (Soft-Filled Sun / Moon SVG) */}
          <button
            id="top-dark-mode-toggle"
            type="button"
            onClick={onToggleDarkMode}
            aria-pressed={Boolean(darkMode)}
            title={
              darkMode
                ? isEn
                  ? 'Switch to Light Mode'
                  : 'التبديل إلى الوضع النهاري'
                : isEn
                ? 'Switch to Dark Mode'
                : 'التبديل إلى الوضع الليلي'
            }
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
            <span className="hidden lg:inline">
              {darkMode ? (isEn ? 'Light' : 'نهاري') : isEn ? 'Dark' : 'ليلي'}
            </span>
          </button>

          {/* 1B. Warm Bedtime / Family Focus Mode Toggle */}
          {onToggleBedtimeMode && (
            <button
              id="top-bedtime-mode-toggle"
              type="button"
              onClick={onToggleBedtimeMode}
              aria-pressed={Boolean(bedtimeMode)}
              title={
                isEn
                  ? 'Warm Bedtime Dimming & Night Reading Filter'
                  : 'وضع وقت النوم وتعتيم القراءة الليلي الدافئ'
              }
              aria-label={
                isEn
                  ? 'Toggle Warm Bedtime Focus Mode'
                  : 'تفعيل أو إيقاف وضع وقت النوم الدافئ'
              }
              className={`${sharedControlBtnClass} ${
                bedtimeMode
                  ? '!bg-amber-500/20 !border-amber-500 !text-amber-700 dark:!text-amber-300'
                  : ''
              }`}
            >
              <span className="text-sm leading-none">🕯️</span>
              <span className="hidden lg:inline">
                {bedtimeMode
                  ? isEn
                    ? 'Bedtime On'
                    : 'نوم دافئ ✓'
                  : isEn
                  ? 'Bedtime'
                  : 'وقت النوم'}
              </span>
            </button>
          )}

          {/* 2. Sleek Compact Language Globe Icon Badge (🌐) */}
          <button
            id="top-language-switcher"
            type="button"
            onClick={onToggleLanguage}
            title={isEn ? 'التبديل إلى العربية' : 'Switch to English'}
            aria-label={isEn ? 'Switch language to Arabic' : 'Switch language to English'}
            className={compactIconBadgeBtnClass}
          >
            <span aria-hidden="true" className="text-sm leading-none">
              🌐
            </span>
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
            title={
              isEn
                ? 'Open Family Calendar & To-Do List'
                : 'فتح مفكرة العيلة الذكية وقائمة المهام'
            }
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
            <span className="hidden lg:inline">{isEn ? 'Planner' : 'المفكرة'}</span>
            {openTasksCount > 0 && (
              <span
                data-testid="header-planner-badge"
                className="min-w-[17px] h-[17px] px-1 rounded-full bg-[#0d9488] dark:bg-[#38BDF8] text-white dark:text-[#0B131A] text-[9.5px] font-black inline-flex items-center justify-center tabular-nums leading-none shadow-2xs shrink-0"
              >
                {openTasksCount}
              </span>
            )}
          </button>

          {/* 4. Notifications Bell Button (Non-Overlapping Inline Counter Pill) */}
          <button
            id="top-notification-bell"
            type="button"
            onClick={() => onNavigate('notifications')}
            title={
              unreadNotifCount > 0
                ? isEn
                  ? `Notifications (${unreadNotifCount} unread)`
                  : `الإشعارات اليومية (${unreadNotifCount} غير مقروءة)`
                : isEn
                ? 'Notifications (All read)'
                : 'الإشعارات اليومية (مقروءة بالكامل)'
            }
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
            <span className="hidden lg:inline">{isEn ? 'Alerts' : 'إشعارات'}</span>
            {unreadNotifCount > 0 && (
              <span
                data-testid="header-notif-badge"
                className="min-w-[18px] h-[18px] px-1 rounded-full bg-[#FF8C61] text-white text-[9.5px] font-black inline-flex items-center justify-center tabular-nums leading-none shadow-2xs shrink-0"
              >
                {unreadNotifCount}
              </span>
            )}
          </button>

          {/* 5. Parent Profile Drawer Button (Soft-Filled User Avatar SVG) */}
          <button
            id="open-profile-drawer-btn"
            type="button"
            data-parent-role={parentProfileSpec.role}
            onClick={onOpenProfileDrawer}
            title={isEn ? 'Open Profile Controls' : 'فتح التحكم بالحساب'}
            aria-label={isEn ? 'Open Profile Controls' : 'فتح التحكم بالحساب'}
            style={{
              backgroundColor: parentProfileSpec.badgeBgCss,
              color: parentProfileSpec.badgeTextCss,
              borderColor: parentProfileSpec.badgeBorderCss,
            }}
            className="h-9 min-w-[36px] px-2.5 sm:px-3.5 rounded-2xl text-xs font-extrabold border whitespace-nowrap shrink-0 inline-flex items-center justify-center gap-1.5 transition-all shadow-2xs select-none cursor-pointer"
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
            <span className="hidden md:inline font-extrabold">
              {isEn ? parentProfileSpec.displayNameEn : parentProfileSpec.displayNameAr}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};

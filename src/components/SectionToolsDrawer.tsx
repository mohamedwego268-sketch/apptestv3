import React, { useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import { LanguageCode } from '../domain/familySpaceCore';

export interface SectionQuickAction {
  id: string;
  labelAr: string;
  labelEn: string;
  icon?: string;
  badge?: string | number;
  active?: boolean;
  tone?: 'teal' | 'orange' | 'indigo' | 'rose' | 'neutral';
  closeOnSelect?: boolean;
  onClick: () => void;
}

export interface SectionToolsDrawerProps {
  language: LanguageCode;
  sectionId: string;
  titleAr?: string;
  titleEn?: string;
  subtitleAr?: string;
  subtitleEn?: string;
  /** Optional active filter/sort count badge shown on the compact trigger button */
  badgeCount?: number;
  /** Optional quick action chips rendered inside the slide-over drawer */
  quickActions?: SectionQuickAction[];
  /** Optional shopping cart item count; when onOpenCart is provided, renders a cart shortcut inside the drawer and badge on trigger */
  cartItemCount?: number;
  /** Optional callback to open the shopping cart modal or navigate to the store cart */
  onOpenCart?: () => void;
  /** Optional unified search bar inside the drawer */
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholderAr?: string;
  searchPlaceholderEn?: string;
  /** Optional clear/reset callback for filters inside the drawer */
  onResetFilters?: () => void;
  hasActiveFilters?: boolean;
  /** Custom section-specific filter/sort/tool controls rendered inside the drawer body */
  children?: React.ReactNode;
}

const TONE_CLASSES: Record<NonNullable<SectionQuickAction['tone']>, string> = {
  teal:
    'border-[#0d9488]/30 bg-teal-500/10 text-[#0d9488] dark:text-[#2DD4BF] hover:bg-[#0d9488] hover:text-white',
  orange:
    'border-[#EA580C]/30 bg-orange-500/10 text-[#EA580C] dark:text-[#FDBA74] hover:bg-[#EA580C] hover:text-white',
  indigo:
    'border-indigo-500/30 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-600 hover:text-white',
  rose:
    'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300 hover:bg-rose-600 hover:text-white',
  neutral:
    'border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-bg)] dark:bg-[#142430] text-[var(--color-text)] dark:text-[#F8FAFC] hover:border-[#0d9488]',
};

/**
 * Sections where the shopping cart must NEVER be displayed:
 * - 'community' (Parents Community / مجتمع الآباء والأمهات)
 * - 'settings' / 'account' / 'family' (Account & Settings / الحساب والإعدادات)
 */
const CART_EXCLUDED_SECTION_IDS = new Set(['community', 'settings', 'account', 'family']);

export const SectionToolsDrawer: React.FC<SectionToolsDrawerProps> = ({
  language,
  sectionId,
  titleAr = 'أدوات القسم',
  titleEn = 'Section tools',
  subtitleAr = 'الفلاتر والفرز والاختصارات السريعة',
  subtitleEn = 'Filters, sorting & quick actions',
  badgeCount = 0,
  quickActions = [],
  cartItemCount = 0,
  onOpenCart,
  searchValue,
  onSearchChange,
  searchPlaceholderAr = 'ابحث داخل هذا القسم...',
  searchPlaceholderEn = 'Search in this section...',
  onResetFilters,
  hasActiveFilters = false,
  children,
}) => {
  const isEn = language === 'en';
  const showCartInSection = Boolean(onOpenCart) && !CART_EXCLUDED_SECTION_IDS.has(sectionId);
  const [open, setOpen] = useState(false);
  const drawerTitleId = useId();

  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  const effectiveBadgeCount =
    badgeCount + (hasActiveFilters ? 1 : 0) + (searchValue && searchValue.trim() ? 1 : 0);

  return (
    <div
      data-testid={`section-tools-bar-${sectionId}`}
      dir={isEn ? 'ltr' : 'rtl'}
      className="flex items-center justify-between gap-2"
    >
      {/* Compact, refined section toolbar trigger */}
      <button
        type="button"
        id={`section-tools-open-btn-${sectionId}`}
        data-testid="section-tools-open-btn"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={`section-tools-drawer-${sectionId}`}
        className="group inline-flex items-center gap-1.5 min-h-[34px] h-[34px] px-2.5 py-1 rounded-xl border border-slate-200/85 dark:border-[#1E3646] bg-white/95 dark:bg-[#101D26]/95 hover:border-[#0d9488]/60 hover:bg-teal-50/40 dark:hover:bg-[#142430] text-[var(--color-text)] dark:text-[#F8FAFC] text-[11px] font-extrabold shadow-2xs transition-all cursor-pointer"
      >
        <span
          aria-hidden="true"
          className="w-5 h-5 rounded-md bg-teal-500/12 dark:bg-teal-400/15 text-[#0d9488] dark:text-[#2DD4BF] inline-flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="4" y1="6" x2="20" y2="6" />
            <line x1="8" y1="12" x2="20" y2="12" />
            <line x1="4" y1="18" x2="16" y2="18" />
            <circle cx="6" cy="6" r="2" fill="currentColor" />
            <circle cx="14" cy="12" r="2" fill="currentColor" />
            <circle cx="18" cy="18" r="2" fill="currentColor" />
          </svg>
        </span>
        <span className="tracking-tight leading-none">{isEn ? titleEn : titleAr}</span>
        {effectiveBadgeCount > 0 && (
          <span
            data-testid="section-tools-active-badge"
            className="min-w-[18px] h-[18px] px-1 rounded-md bg-[#0d9488] text-white text-[10px] font-black inline-flex items-center justify-center tabular-nums leading-none"
          >
            {effectiveBadgeCount}
          </span>
        )}
        {showCartInSection && cartItemCount > 0 && (
          <span
            data-testid="section-tools-trigger-cart-badge"
            className="inline-flex items-center gap-0.5 px-1.5 h-[18px] rounded-md bg-[#EA580C]/12 text-[#EA580C] dark:text-[#FDBA74] text-[10px] font-black tabular-nums leading-none"
          >
            <span aria-hidden="true" className="text-[10px]">🛒</span>
            <span>{cartItemCount}</span>
          </span>
        )}
      </button>

      {/* Slide-Over Tools Drawer rendered via Portal */}
      {open &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[1300] flex justify-end bg-slate-950/45 backdrop-blur-[2px] animate-fade-in"
            dir={isEn ? 'ltr' : 'rtl'}
            onClick={(e) => {
              if (e.target === e.currentTarget) setOpen(false);
            }}
          >
            <aside
              id={`section-tools-drawer-${sectionId}`}
              data-testid="section-tools-drawer"
              role="dialog"
              aria-modal="true"
              aria-labelledby={drawerTitleId}
              className="relative w-[min(86vw,340px)] max-w-[340px] h-full bg-[var(--color-surface)] dark:bg-[#101D26] border-s border-[var(--color-border)] dark:border-[#1E3646] shadow-2xl flex flex-col justify-between overflow-hidden"
            >
              {/* Compact Drawer Header */}
              <div className="px-3.5 py-2.5 border-b border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-bg)]/80 dark:bg-[#142430]/90 flex items-center justify-between gap-2">
                <div className="min-w-0 flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="w-6 h-6 rounded-lg bg-teal-500/12 text-[#0d9488] dark:text-[#2DD4BF] inline-flex items-center justify-center shrink-0"
                  >
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="4" y1="6" x2="20" y2="6" />
                      <line x1="8" y1="12" x2="20" y2="12" />
                      <line x1="4" y1="18" x2="16" y2="18" />
                    </svg>
                  </span>
                  <div className="min-w-0">
                    <h3
                      id={drawerTitleId}
                      className="text-xs font-black text-[var(--color-text)] dark:text-[#F8FAFC] truncate leading-tight"
                    >
                      {isEn ? titleEn : titleAr}
                    </h3>
                    <p className="text-[10px] font-semibold text-[var(--color-muted)] dark:text-[#94A3B8] truncate">
                      {isEn ? subtitleEn : subtitleAr}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {showCartInSection && onOpenCart && (
                    <button
                      type="button"
                      data-testid="section-tools-cart-btn"
                      onClick={() => {
                        setOpen(false);
                        onOpenCart();
                      }}
                      className="min-h-[30px] h-[30px] px-2.5 py-1 rounded-lg border border-[#EA580C]/35 bg-orange-500/10 hover:bg-[#EA580C] hover:text-white text-[#EA580C] dark:text-[#FDBA74] text-[11px] font-extrabold inline-flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <span aria-hidden="true">🛒</span>
                      <span>{isEn ? 'Cart' : 'السلة'}</span>
                      <span
                        data-testid="section-tools-cart-count"
                        className="min-w-[16px] h-4 px-1 rounded-md bg-[#EA580C] text-white text-[10px] font-black inline-flex items-center justify-center tabular-nums"
                      >
                        {cartItemCount}
                      </span>
                    </button>
                  )}

                  <button
                    type="button"
                    data-testid="section-tools-close-btn"
                    onClick={() => setOpen(false)}
                    aria-label={isEn ? 'Close section tools' : 'إغلاق أدوات القسم'}
                    className="w-7 h-7 rounded-lg border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-surface)] dark:bg-[#101D26] text-[var(--color-text)] dark:text-[#F8FAFC] hover:border-rose-400 hover:text-rose-600 text-xs font-black inline-flex items-center justify-center transition-colors cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Drawer Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5">
                {/* Unified Section Search Input */}
                {typeof onSearchChange === 'function' && (
                  <div className="space-y-1">
                    <label
                      htmlFor={`section-tools-search-${sectionId}`}
                      className="block text-[10px] font-extrabold text-[var(--color-muted)] dark:text-[#94A3B8]"
                    >
                      {isEn ? 'Quick Search' : 'بحث سريع داخل القسم'}
                    </label>
                    <div className="relative">
                      <input
                        id={`section-tools-search-${sectionId}`}
                        data-testid="section-tools-search-input"
                        type="search"
                        value={searchValue ?? ''}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder={isEn ? searchPlaceholderEn : searchPlaceholderAr}
                        className="w-full min-h-[34px] h-[34px] ps-3 pe-8 py-1 rounded-lg border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-bg)] dark:bg-[#142430] text-xs font-bold text-[var(--color-text)] dark:text-[#F8FAFC] focus:outline-none focus:border-[#0d9488]"
                      />
                      {searchValue && searchValue.trim().length > 0 && (
                        <button
                          type="button"
                          onClick={() => onSearchChange('')}
                          aria-label={isEn ? 'Clear search' : 'مسح البحث'}
                          className="absolute top-1/2 -translate-y-1/2 end-1.5 w-5 h-5 rounded-md bg-slate-200/80 dark:bg-slate-700 text-[10px] font-black text-slate-700 dark:text-slate-200 inline-flex items-center justify-center cursor-pointer"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Quick Action Chips */}
                {quickActions.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="text-[10px] font-extrabold text-[var(--color-muted)] dark:text-[#94A3B8]">
                      {isEn ? 'Quick Actions' : 'إجراءات سريعة'}
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {quickActions.map((action) => {
                        const toneClass = action.active
                          ? 'border-[#0d9488] bg-[#0d9488] text-white shadow-2xs'
                          : TONE_CLASSES[action.tone || 'neutral'];
                        return (
                          <button
                            key={action.id}
                            type="button"
                            data-testid={`section-tool-chip-${action.id}`}
                            onClick={() => {
                              action.onClick();
                              if (action.closeOnSelect !== false) {
                                setOpen(false);
                              }
                            }}
                            className={`min-h-[34px] px-2.5 py-1.5 rounded-lg border text-[11px] font-extrabold inline-flex items-center justify-between gap-1.5 transition-all cursor-pointer text-start ${toneClass}`}
                          >
                            <span className="inline-flex items-center gap-1.5 min-w-0">
                              {action.icon && <span aria-hidden="true" className="text-xs shrink-0">{action.icon}</span>}
                              <span className="truncate">{isEn ? action.labelEn : action.labelAr}</span>
                            </span>
                            {action.badge !== undefined && (
                              <span
                                className={`px-1 py-0.2 rounded text-[10px] font-black tabular-nums shrink-0 ${
                                  action.active
                                    ? 'bg-white/20 text-white'
                                    : 'bg-black/8 dark:bg-white/10 text-current'
                                }`}
                              >
                                {action.badge}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Section-Specific Filters / Controls */}
                {children && (
                  <div
                    data-testid={`section-tools-custom-body-${sectionId}`}
                    className="space-y-3"
                  >
                    {children}
                  </div>
                )}
              </div>

              {/* Compact Drawer Footer */}
              <div className="px-3.5 py-2.5 border-t border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-bg)]/80 dark:bg-[#142430]/90 flex items-center justify-between gap-2">
                {onResetFilters ? (
                  <button
                    type="button"
                    data-testid="section-tools-reset-btn"
                    onClick={() => onResetFilters()}
                    className="min-h-[32px] h-8 px-2.5 py-1 rounded-lg border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-surface)] dark:bg-[#101D26] text-[11px] font-extrabold text-[var(--color-muted)] hover:text-[var(--color-text)] cursor-pointer"
                  >
                    {isEn ? 'Reset' : 'إعادة ضبط'}
                  </button>
                ) : (
                  <span className="text-[10px] font-bold text-[var(--color-muted)]">
                    {isEn ? 'Settings saved automatically' : 'يتم تطبيق الاختيارات فورًا'}
                  </span>
                )}

                <button
                  type="button"
                  data-testid="section-tools-done-btn"
                  onClick={() => setOpen(false)}
                  className="min-h-[32px] h-8 px-3.5 py-1 rounded-lg bg-[#0d9488] hover:bg-[#0f766e] text-white text-[11px] font-extrabold shadow-2xs transition-colors cursor-pointer"
                >
                  {isEn ? 'Done' : 'تم'}
                </button>
              </div>
            </aside>
          </div>,
          document.body
        )}
    </div>
  );
};

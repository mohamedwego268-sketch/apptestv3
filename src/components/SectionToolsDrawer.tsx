import React, { useEffect, useState } from 'react';
import { LanguageCode } from '../domain/familySpaceCore';
import { useOptionalFamilyAppContext } from '../context/FamilyAppContext';

export interface SectionToolAction {
  id: string;
  labelAr: string;
  labelEn: string;
  icon?: string;
  active?: boolean;
  badge?: string | number;
  closeOnSelect?: boolean;
  onClick: () => void;
}

export interface SectionToolsDrawerProps {
  language: LanguageCode;
  titleAr: string;
  titleEn: string;
  sectionId?: string;
  badgeCount?: number;
  cartItemCount?: number;
  onOpenCart?: () => void;
  quickActions?: SectionToolAction[];
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholderAr?: string;
  searchPlaceholderEn?: string;
  children?: React.ReactNode;
}

const CART_EXCLUDED_SECTION_IDS = new Set([
  'community',
  'settings',
  'account',
  'family',
  'permissions',
  'homes',
]);

/**
 * Standardized Section Tools (`أدوات القسم`) side sheet.
 * Positioned immediately after each section's top banner/announcement board,
 * aligned to the start edge (`justify-start` in both RTL and LTR),
 * and centralizing section-specific search, filter, sort, and quick tools
 * inside a soft, premium, mobile-first side sheet.
 *
 * Shopping cart shortcuts are strictly excluded from Community (`community`)
 * and Account (`settings` / `account` / `family`) sections and preserved in
 * the Store (`store`) section.
 */
export const SectionToolsDrawer: React.FC<SectionToolsDrawerProps> = ({
  language,
  titleAr,
  titleEn,
  sectionId,
  badgeCount = 0,
  cartItemCount,
  onOpenCart,
  quickActions = [],
  searchValue,
  onSearchChange,
  searchPlaceholderAr,
  searchPlaceholderEn,
  children,
}) => {
  const isEn = language === 'en';
  const [isOpen, setIsOpen] = useState(false);
  const appCtx = useOptionalFamilyAppContext();

  const normalizedSectionId = (sectionId || '').trim().toLowerCase();
  const isCartExcludedSection = CART_EXCLUDED_SECTION_IDS.has(normalizedSectionId);
  const showCartInSection =
    !isCartExcludedSection &&
    (Boolean(onOpenCart) || normalizedSectionId === 'store' || typeof cartItemCount === 'number');

  const contextCartCount =
    appCtx?.state?.cart?.reduce((sum, entry) => sum + (entry.quantity || 0), 0) ?? 0;
  const resolvedCartCount = showCartInSection
    ? typeof cartItemCount === 'number'
      ? cartItemCount
      : contextCartCount
    : 0;

  const activeQuickActionsCount = quickActions.filter((a) => Boolean(a.active)).length;
  const searchActiveCount = searchValue && searchValue.trim().length > 0 ? 1 : 0;
  const resolvedBadgeCount = badgeCount + searchActiveCount + activeQuickActionsCount;

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleOpenCart = () => {
    if (!showCartInSection) return;
    if (onOpenCart) {
      onOpenCart();
      setIsOpen(false);
      return;
    }
    if (appCtx?.navigateTo) {
      appCtx.navigateTo('services');
      setIsOpen(false);
    }
  };

  const subtitleText = showCartInSection
    ? isEn
      ? 'Search, smart filters, cart & section tools'
      : 'البحث والفلاتر الذكية والسلة وأدوات القسم'
    : isEn
      ? 'Search, smart filters & quick section tools'
      : 'البحث والفلاتر الذكية وأدوات التخصيص السريعة';

  return (
    <>
      <div
        data-testid={sectionId ? `section-tools-bar-${sectionId}` : 'section-tools-bar'}
        dir={isEn ? 'ltr' : 'rtl'}
        className="w-full flex items-center justify-start"
      >
        <button
          type="button"
          data-testid="section-tools-open-btn"
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          onClick={() => setIsOpen(true)}
          className="group min-h-[44px] inline-flex items-center gap-2.5 rounded-2xl border border-teal-600/20 dark:border-teal-400/20 bg-gradient-to-b from-white to-slate-50/95 dark:from-[#12222E] dark:to-[#0E1A24] px-4 py-2 text-xs font-extrabold text-[var(--color-text)] dark:text-[#F8FAFC] shadow-sm shadow-teal-950/5 hover:border-[#0d9488]/50 hover:shadow-md active:scale-[0.99] transition-all duration-200 cursor-pointer shrink-0"
        >
          <span
            aria-hidden="true"
            className="w-7 h-7 rounded-xl bg-teal-500/12 dark:bg-teal-400/15 border border-teal-500/20 text-[#0d9488] dark:text-[#2DD4BF] inline-flex items-center justify-center text-sm shadow-2xs group-hover:scale-105 transition-transform"
          >
            ☷
          </span>
          <span className="tracking-tight">{isEn ? 'Section tools' : 'أدوات القسم'}</span>
          <span className="text-[11px] font-bold text-[var(--color-muted)] dark:text-[#94A3B8] hidden sm:inline">
            · {isEn ? titleEn : titleAr}
          </span>
          {resolvedBadgeCount > 0 && (
            <span
              data-testid="section-tools-active-badge"
              className="min-w-5 h-5 rounded-full bg-gradient-to-r from-[#0d9488] to-[#0f766e] px-1.5 text-[10px] font-black text-white inline-flex items-center justify-center tabular-nums shadow-2xs"
            >
              {resolvedBadgeCount}
            </span>
          )}
          {showCartInSection && resolvedCartCount > 0 && (
            <span
              data-testid="section-tools-trigger-cart-badge"
              className="min-h-5 rounded-full bg-gradient-to-r from-[#FF8C61] to-[#F97316] px-2 py-0.5 text-[10px] font-black text-white inline-flex items-center gap-1 tabular-nums shadow-2xs"
            >
              <span aria-hidden="true">🛒</span>
              <span>{resolvedCartCount}</span>
            </span>
          )}
        </button>
      </div>

      {isOpen && (
        <div
          data-testid="section-tools-backdrop"
          className="fixed inset-0 z-[95] bg-slate-950/45 backdrop-blur-md flex items-stretch transition-opacity duration-200"
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) setIsOpen(false);
          }}
        >
          <aside
            data-testid="section-tools-drawer"
            role="dialog"
            aria-modal="true"
            aria-label={isEn ? titleEn : titleAr}
            dir={isEn ? 'ltr' : 'rtl'}
            className="w-[min(92vw,390px)] max-w-[390px] h-[100dvh] flex flex-col overflow-hidden bg-gradient-to-b from-[#FFFFFF] via-[#F8FAFC] to-[#F1F5F9]/95 dark:from-[#0E1A24] dark:via-[#0B141C] dark:to-[#091118] border-e border-slate-200/80 dark:border-[#1E3646] rounded-e-3xl pt-safe pb-safe shadow-[0_24px_60px_-15px_rgba(15,23,42,0.42)] animate-tab-enter"
          >
            {/* Soft Premium Sheet Header */}
            <div className="shrink-0 px-4 pt-4 pb-3.5 border-b border-slate-200/75 dark:border-[#1E3646]/90 bg-white/85 dark:bg-[#0E1A24]/90 backdrop-blur-md">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    aria-hidden="true"
                    className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-500/15 via-teal-500/10 to-emerald-500/5 dark:from-teal-400/20 dark:to-teal-500/5 border border-teal-500/25 dark:border-teal-400/25 text-[#0d9488] dark:text-[#2DD4BF] flex items-center justify-center text-base font-black shrink-0 shadow-2xs"
                  >
                    ☷
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#0d9488] dark:bg-[#2DD4BF]" />
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#0d9488] dark:text-[#2DD4BF]">
                        {isEn ? 'Section Workspace' : 'مساحة أدوات القسم'}
                      </span>
                    </div>
                    <h2 className="text-sm sm:text-base font-black text-[var(--color-text)] dark:text-[#F8FAFC] truncate mt-0.5">
                      {isEn ? titleEn : titleAr}
                    </h2>
                    <p className="text-[11px] font-semibold text-[var(--color-muted)] dark:text-[#94A3B8] truncate">
                      {subtitleText}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  data-testid="section-tools-close-btn"
                  onClick={() => setIsOpen(false)}
                  aria-label={isEn ? 'Close section tools' : 'إغلاق أدوات القسم'}
                  className="min-w-[44px] min-h-[44px] w-11 h-11 shrink-0 rounded-2xl border border-slate-200/80 dark:border-[#1E3646] bg-slate-100/80 dark:bg-[#142430] hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-600 dark:hover:text-rose-300 text-[var(--color-text)] dark:text-[#F8FAFC] text-lg font-black inline-flex items-center justify-center transition-all cursor-pointer active:scale-95"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Scrollable Sheet Body */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 space-y-4">
              {/* Store-only Shopping Cart Shortcut */}
              {showCartInSection && (
                <div className="rounded-2xl p-1 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-teal-500/10 border border-amber-300/60 dark:border-amber-500/30 shadow-2xs">
                  <button
                    type="button"
                    data-testid="section-tools-cart-btn"
                    onClick={handleOpenCart}
                    className="w-full min-h-[46px] px-3.5 py-2.5 rounded-xl bg-white/95 dark:bg-[#132330] text-[var(--color-text)] dark:text-[#F8FAFC] flex items-center justify-between gap-2.5 text-xs font-extrabold hover:bg-amber-50/60 dark:hover:bg-[#172B3A] transition-all cursor-pointer"
                  >
                    <span className="inline-flex items-center gap-2.5">
                      <span
                        aria-hidden="true"
                        className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-300 inline-flex items-center justify-center text-sm"
                      >
                        🛒
                      </span>
                      <span className="flex flex-col items-start text-start">
                        <span>{isEn ? 'Shopping Cart' : 'سلة التسوق'}</span>
                        <span className="text-[10px] font-semibold text-[var(--color-muted)] dark:text-[#94A3B8]">
                          {isEn ? 'Review selected family items' : 'مراجعة المنتجات المختارة للعائلة'}
                        </span>
                      </span>
                    </span>
                    <span
                      data-testid="section-tools-cart-count"
                      className={`min-w-7 h-7 px-2.5 rounded-full text-xs font-black inline-flex items-center justify-center tabular-nums shadow-2xs ${
                        resolvedCartCount > 0
                          ? 'bg-gradient-to-r from-[#FF8C61] to-[#F97316] text-white'
                          : 'bg-slate-200/90 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      {resolvedCartCount}
                    </span>
                  </button>
                </div>
              )}

              {/* Unified Section Search Input inside Section Tools */}
              {onSearchChange && (
                <div className="rounded-2xl border border-slate-200/80 dark:border-[#1E3646] bg-white/90 dark:bg-[#111F2B] p-3 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <label className="block text-[11px] font-extrabold text-[var(--color-text)] dark:text-[#E2E8F0]">
                      {isEn ? 'Quick Search' : 'البحث السريع في القسم'}
                    </label>
                    {searchValue && searchValue.trim().length > 0 && (
                      <button
                        type="button"
                        onClick={() => onSearchChange('')}
                        className="text-[10px] font-extrabold text-[#0d9488] dark:text-[#2DD4BF] hover:underline cursor-pointer"
                      >
                        {isEn ? 'Clear' : 'مسح'}
                      </button>
                    )}
                  </div>
                  <div className="relative flex items-center">
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute start-3 text-xs text-[var(--color-muted)] dark:text-[#94A3B8]"
                    >
                      🔍
                    </span>
                    <input
                      type="search"
                      data-testid="section-tools-search-input"
                      value={searchValue ?? ''}
                      onChange={(e) => onSearchChange(e.target.value)}
                      placeholder={
                        isEn
                          ? searchPlaceholderEn || 'Search in this section...'
                          : searchPlaceholderAr || 'ابحث في هذا القسم...'
                      }
                      aria-label={isEn ? titleEn : titleAr}
                      className="w-full min-h-[44px] rounded-xl border border-slate-200/90 dark:border-[#1E3646] bg-slate-50/90 dark:bg-[#142430] ps-9 pe-3 py-2 text-xs font-bold text-[var(--color-text)] dark:text-[#F8FAFC] placeholder:text-[var(--color-muted)] focus:outline-none focus:border-[#0d9488] focus:bg-white dark:focus:bg-[#172A38] transition-colors"
                    />
                  </div>
                </div>
              )}

              {/* Quick Actions / Filters Card */}
              {quickActions.length > 0 && (
                <div className="rounded-2xl border border-slate-200/80 dark:border-[#1E3646] bg-white/90 dark:bg-[#111F2B] p-3 shadow-2xs space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-extrabold text-[var(--color-text)] dark:text-[#E2E8F0]">
                      {isEn ? 'Views & Quick Filters' : 'طرق العرض والفلاتر السريعة'}
                    </span>
                    {activeQuickActionsCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-teal-500/12 text-[#0d9488] dark:text-[#2DD4BF] text-[10px] font-black tabular-nums">
                        {activeQuickActionsCount}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {quickActions.map((action) => (
                      <button
                        key={action.id}
                        type="button"
                        data-testid={`section-tool-chip-${action.id}`}
                        onClick={() => {
                          action.onClick();
                          if (action.closeOnSelect) {
                            setIsOpen(false);
                          }
                        }}
                        className={`min-h-[44px] px-3 py-2 rounded-xl border text-xs font-extrabold flex items-center justify-between gap-1.5 transition-all duration-150 cursor-pointer active:scale-[0.98] ${
                          action.active
                            ? 'border-[#0d9488] bg-gradient-to-r from-[#0d9488] to-[#0f766e] text-white shadow-sm shadow-teal-950/15'
                            : 'border-slate-200/85 dark:border-[#1E3646] bg-slate-50/85 dark:bg-[#142430] text-[var(--color-text)] dark:text-[#F8FAFC] hover:border-[#0d9488]/60 hover:bg-white dark:hover:bg-[#182B3A]'
                        }`}
                      >
                        <span className="inline-flex items-center gap-1.5 truncate">
                          {action.icon && (
                            <span aria-hidden="true" className="text-sm shrink-0">
                              {action.icon}
                            </span>
                          )}
                          <span className="truncate">{isEn ? action.labelEn : action.labelAr}</span>
                        </span>
                        {action.badge !== undefined && (
                          <span
                            className={`px-1.5 py-0.5 rounded-full text-[10px] font-black tabular-nums shrink-0 ${
                              action.active
                                ? 'bg-white/25 text-white'
                                : 'bg-teal-500/15 text-[#0d9488] dark:text-[#2DD4BF]'
                            }`}
                          >
                            {action.badge}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Section-Specific Custom Tools */}
              {children && (
                <div className="rounded-2xl border border-slate-200/80 dark:border-[#1E3646] bg-white/90 dark:bg-[#111F2B] p-3.5 shadow-2xs space-y-3">
                  {children}
                </div>
              )}
            </div>

            {/* Soft Sheet Footer */}
            <div className="shrink-0 px-4 py-3 border-t border-slate-200/75 dark:border-[#1E3646]/90 bg-white/85 dark:bg-[#0E1A24]/90 backdrop-blur-md">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-full min-h-[44px] rounded-xl bg-gradient-to-r from-[#0d9488] to-[#0f766e] hover:from-[#0f766e] hover:to-[#115e59] text-white text-xs font-extrabold shadow-sm transition-all cursor-pointer active:scale-[0.99]"
              >
                {isEn ? 'Done & Return to Section' : 'تم والعودة للقسم'}
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
};



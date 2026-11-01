import React, { useState } from 'react';
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

/**
 * Standardized Section Tools (`أدوات القسم`) component.
 * Positioned immediately after each section's top banner/announcement board,
 * aligned to the right in Arabic RTL (`justify-start` in `dir="rtl"`),
 * and centralizing section-specific search, filter, sort, shopping cart, and quick tools
 * behind one compact entry point.
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

  const contextCartCount =
    appCtx?.state?.cart?.reduce((sum, entry) => sum + (entry.quantity || 0), 0) ?? 0;
  const resolvedCartCount =
    typeof cartItemCount === 'number' ? cartItemCount : contextCartCount;

  const activeQuickActionsCount = quickActions.filter((a) => Boolean(a.active)).length;
  const searchActiveCount = searchValue && searchValue.trim().length > 0 ? 1 : 0;
  const resolvedBadgeCount = badgeCount + searchActiveCount + activeQuickActionsCount;

  const handleOpenCart = () => {
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
          className="min-h-[42px] inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-surface)] dark:bg-[#101D26] px-3.5 py-2 text-xs font-extrabold text-[var(--color-text)] dark:text-[#F8FAFC] shadow-2xs hover:border-[#0d9488] transition-colors cursor-pointer shrink-0"
        >
          <span aria-hidden="true" className="text-[#0d9488] dark:text-[#2DD4BF]">
            ☷
          </span>
          <span>{isEn ? 'Section tools' : 'أدوات القسم'}</span>
          <span className="text-[10px] font-bold text-[var(--color-muted)] dark:text-[#94A3B8] hidden sm:inline">
            · {isEn ? titleEn : titleAr}
          </span>
          {resolvedBadgeCount > 0 && (
            <span
              data-testid="section-tools-active-badge"
              className="min-w-5 h-5 rounded-full bg-[#0d9488] px-1.5 text-[10px] text-white inline-flex items-center justify-center tabular-nums"
            >
              {resolvedBadgeCount}
            </span>
          )}
          {resolvedCartCount > 0 && (
            <span
              data-testid="section-tools-trigger-cart-badge"
              className="min-h-5 rounded-full bg-[#FF8C61] px-2 py-0.5 text-[10px] font-black text-white inline-flex items-center gap-1 tabular-nums"
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
          className="fixed inset-0 z-[95] bg-slate-950/55 backdrop-blur-sm flex items-stretch"
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
            className="w-[min(90vw,380px)] max-w-[380px] h-[100dvh] overflow-y-auto overscroll-contain bg-[var(--color-surface)] dark:bg-[#0B131A] border-e border-[var(--color-border)] dark:border-[#1E3646] p-3.5 pt-safe pb-safe shadow-2xl animate-tab-enter"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between gap-3 pb-3 mb-3 border-b border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-surface)] dark:bg-[#0B131A]">
              <div className="min-w-0">
                <h2 className="text-sm font-black text-[var(--color-text)] dark:text-[#F8FAFC]">
                  {isEn ? titleEn : titleAr}
                </h2>
                <p className="text-[10px] font-semibold text-[var(--color-muted)]">
                  {isEn ? 'Search, filters, cart, and quick actions' : 'البحث والفلاتر والسلة والإجراءات السريعة'}
                </p>
              </div>
              <button
                type="button"
                data-testid="section-tools-close-btn"
                onClick={() => setIsOpen(false)}
                aria-label={isEn ? 'Close section tools' : 'إغلاق أدوات القسم'}
                className="w-9 h-9 shrink-0 rounded-xl bg-[var(--color-control-muted)] dark:bg-[#142430] text-[var(--color-text)] dark:text-[#F8FAFC] text-lg font-black cursor-pointer"
              >
                ×
              </button>
            </div>

            <div className="space-y-3.5">
              {/* Unified Shopping Cart Entry inside Section Tools */}
              {(Boolean(onOpenCart) || Boolean(appCtx) || resolvedCartCount > 0) && (
                <button
                  type="button"
                  data-testid="section-tools-cart-btn"
                  onClick={handleOpenCart}
                  className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-amber-300/80 dark:border-amber-500/40 bg-amber-50/90 dark:bg-[#142430] text-[var(--color-text)] dark:text-[#F8FAFC] flex items-center justify-between gap-2 text-xs font-extrabold hover:border-[#FF8C61] transition-colors cursor-pointer"
                >
                  <span className="inline-flex items-center gap-2">
                    <span aria-hidden="true">🛒</span>
                    <span>{isEn ? 'Shopping Cart' : 'سلة التسوق'}</span>
                  </span>
                  <span
                    data-testid="section-tools-cart-count"
                    className={`min-w-6 h-6 px-2 rounded-full text-[11px] font-black inline-flex items-center justify-center tabular-nums ${
                      resolvedCartCount > 0
                        ? 'bg-[#FF8C61] text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    {resolvedCartCount}
                  </span>
                </button>
              )}

              {/* Unified Section Search Input inside Section Tools */}
              {onSearchChange && (
                <div className="space-y-1">
                  <label className="block text-[11px] font-extrabold text-[var(--color-muted)]">
                    {isEn ? 'Search in section' : 'البحث في القسم'}
                  </label>
                  <input
                    type="search"
                    data-testid="section-tools-search-input"
                    value={searchValue ?? ''}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder={
                      isEn
                        ? searchPlaceholderEn || 'Search in section...'
                        : searchPlaceholderAr || 'ابحث في هذا القسم...'
                    }
                    aria-label={isEn ? titleEn : titleAr}
                    className="w-full min-h-[40px] rounded-xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-bg)] dark:bg-[#142430] px-3 py-2 text-xs font-bold text-[var(--color-text)] dark:text-[#F8FAFC] placeholder:text-[var(--color-muted)] focus:outline-none focus:border-[#0d9488]"
                  />
                </div>
              )}

              {/* Quick Actions inside Section Tools */}
              {quickActions.length > 0 && (
                <div className="grid grid-cols-2 gap-1.5">
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
                      className={`min-h-[38px] px-2.5 py-1.5 rounded-xl border text-xs font-extrabold flex items-center justify-between gap-1.5 transition-all cursor-pointer ${
                        action.active
                          ? 'border-[#0d9488] bg-[#0d9488] text-white'
                          : 'border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-bg)] dark:bg-[#142430] text-[var(--color-text)] dark:text-[#F8FAFC] hover:border-[#0d9488]'
                      }`}
                    >
                      <span className="inline-flex items-center gap-1.5 truncate">
                        {action.icon && <span aria-hidden="true">{action.icon}</span>}
                        <span className="truncate">{isEn ? action.labelEn : action.labelAr}</span>
                      </span>
                      {action.badge !== undefined && (
                        <span
                          className={`px-1.5 py-0.5 rounded-full text-[10px] font-black tabular-nums shrink-0 ${
                            action.active
                              ? 'bg-white/20 text-white'
                              : 'bg-teal-500/15 text-[#0d9488] dark:text-[#2DD4BF]'
                          }`}
                        >
                          {action.badge}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
              {children}
            </div>
          </aside>
        </div>
      )}
    </>
  );
};



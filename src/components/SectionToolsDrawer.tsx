import React, { useState } from 'react';
import { LanguageCode } from '../domain/familySpaceCore';

export interface SectionToolAction {
  id: string;
  labelAr: string;
  labelEn: string;
  icon?: string;
  active?: boolean;
  badge?: string | number;
  onClick: () => void;
}

export interface SectionToolsDrawerProps {
  language: LanguageCode;
  titleAr: string;
  titleEn: string;
  sectionId?: string;
  badgeCount?: number;
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
 * and centralizing section-specific search, filter, sort, and quick tools.
 */
export const SectionToolsDrawer: React.FC<SectionToolsDrawerProps> = ({
  language,
  titleAr,
  titleEn,
  sectionId,
  badgeCount = 0,
  quickActions = [],
  searchValue,
  onSearchChange,
  searchPlaceholderAr,
  searchPlaceholderEn,
  children,
}) => {
  const isEn = language === 'en';
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div
        data-testid={sectionId ? `section-tools-bar-${sectionId}` : 'section-tools-bar'}
        dir={isEn ? 'ltr' : 'rtl'}
        className="w-full flex flex-wrap items-center justify-start gap-2"
      >
        <button
          type="button"
          data-testid="section-tools-open-btn"
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          onClick={() => setIsOpen(true)}
          className="min-h-[38px] inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-surface)] dark:bg-[#101D26] px-3 py-1.5 text-xs font-extrabold text-[var(--color-text)] dark:text-[#F8FAFC] shadow-2xs hover:border-[#0d9488] transition-colors cursor-pointer shrink-0"
        >
          <span aria-hidden="true" className="text-[#0d9488] dark:text-[#2DD4BF]">
            ☷
          </span>
          <span>{isEn ? 'Section tools' : 'أدوات القسم'}</span>
          <span className="text-[10px] font-bold text-[var(--color-muted)] dark:text-[#94A3B8] hidden sm:inline">
            · {isEn ? titleEn : titleAr}
          </span>
          {badgeCount > 0 && (
            <span className="min-w-5 h-5 rounded-full bg-[#0d9488] px-1 text-[10px] text-white inline-flex items-center justify-center tabular-nums">
              {badgeCount}
            </span>
          )}
        </button>

        {quickActions.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar max-w-full py-0.5">
            {quickActions.map((action) => (
              <button
                key={action.id}
                type="button"
                data-testid={`section-tool-chip-${action.id}`}
                onClick={action.onClick}
                className={`min-h-[34px] px-2.5 py-1 rounded-xl border text-[11px] font-extrabold inline-flex items-center gap-1 whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                  action.active
                    ? 'border-[#0d9488] bg-[#0d9488] text-white shadow-2xs'
                    : 'border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-surface)] dark:bg-[#101D26] text-[var(--color-text)] dark:text-[#F8FAFC] hover:border-[#0d9488]'
                }`}
              >
                {action.icon && <span aria-hidden="true">{action.icon}</span>}
                <span>{isEn ? action.labelEn : action.labelAr}</span>
                {action.badge !== undefined && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[9.5px] font-black tabular-nums ${
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

        {onSearchChange && (
          <div className="flex-1 min-w-[150px]">
            <input
              type="search"
              value={searchValue ?? ''}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={
                isEn
                  ? searchPlaceholderEn || 'Search in section...'
                  : searchPlaceholderAr || 'ابحث في هذا القسم...'
              }
              aria-label={isEn ? titleEn : titleAr}
              className="w-full min-h-[36px] rounded-xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-surface)] dark:bg-[#101D26] px-3 py-1 text-xs font-bold text-[var(--color-text)] dark:text-[#F8FAFC] placeholder:text-[var(--color-muted)] focus:outline-none focus:border-[#0d9488]"
            />
          </div>
        )}
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
            className="w-[min(88vw,360px)] max-w-[360px] h-[100dvh] overflow-y-auto overscroll-contain bg-[var(--color-surface)] dark:bg-[#0B131A] border-e border-[var(--color-border)] dark:border-[#1E3646] p-3 pt-safe pb-safe shadow-2xl animate-tab-enter"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between gap-3 pb-3 mb-3 border-b border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-surface)] dark:bg-[#0B131A]">
              <div className="min-w-0">
                <h2 className="text-sm font-black text-[var(--color-text)] dark:text-[#F8FAFC]">
                  {isEn ? titleEn : titleAr}
                </h2>
                <p className="text-[10px] font-semibold text-[var(--color-muted)]">
                  {isEn ? 'Filters and quick actions' : 'الفلاتر والإجراءات السريعة'}
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

            <div className="space-y-3">
              {quickActions.length > 0 && (
                <div className="grid grid-cols-2 gap-1.5">
                  {quickActions.map((action) => (
                    <button
                      key={action.id}
                      type="button"
                      onClick={() => {
                        action.onClick();
                        setIsOpen(false);
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
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-teal-500/15 text-[#0d9488] dark:text-[#2DD4BF] tabular-nums shrink-0">
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


import React, { useState } from 'react';
import { LanguageCode } from '../domain/familySpaceCore';

interface SectionToolsDrawerProps {
  language: LanguageCode;
  titleAr: string;
  titleEn: string;
  badgeCount?: number;
  children: React.ReactNode;
}

/** A consistent, compact per-section tools drawer that keeps primary content uncluttered. */
export const SectionToolsDrawer: React.FC<SectionToolsDrawerProps> = ({
  language,
  titleAr,
  titleEn,
  badgeCount = 0,
  children,
}) => {
  const isEn = language === 'en';
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="flex justify-end">
        <button
          type="button"
          data-testid="section-tools-open-btn"
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          onClick={() => setIsOpen(true)}
          className="min-h-[38px] inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-surface)] dark:bg-[#101D26] px-3 py-1.5 text-xs font-extrabold text-[var(--color-text)] dark:text-[#F8FAFC] shadow-2xs hover:border-[#0d9488] transition-colors"
        >
          <span aria-hidden="true">☷</span>
          <span>{isEn ? 'Section tools' : 'أدوات القسم'}</span>
          {badgeCount > 0 && (
            <span className="min-w-5 h-5 rounded-full bg-[#0d9488] px-1 text-[10px] text-white inline-flex items-center justify-center tabular-nums">
              {badgeCount}
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
                className="w-9 h-9 shrink-0 rounded-xl bg-[var(--color-control-muted)] dark:bg-[#142430] text-[var(--color-text)] dark:text-[#F8FAFC] text-lg font-black"
              >
                ×
              </button>
            </div>
            <div className="space-y-3">{children}</div>
          </aside>
        </div>
      )}
    </>
  );
};

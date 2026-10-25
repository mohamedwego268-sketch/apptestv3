import React from 'react';
import {
  ChildProfile,
  FamilySpaceState,
  LanguageCode,
  WishItem,
  formatCurrency,
  getEmptyStateCopy,
  locText,
} from '../domain/familySpaceCore';
import { getCardBackgroundSpec } from '../domain/cardBackgrounds';
import {
  FriendlyEmptyState,
  MasterPatternCard,
  PrimaryCtaButton,
  SoftFilledIcon,
  UnifiedBadge,
} from '../components/DesignSystem';
import { ThreeDIcon } from '../components/ThreeDVisuals';

export interface KidsWishesSectionProps {
  state: FamilySpaceState;
  lang: LanguageCode;
  wishKidTab: string;
  setWishKidTab: (val: string) => void;
  filteredWishes: WishItem[];
  kidMap: Record<string, ChildProfile>;
  onOpenAddWish: () => void;
  onOpenEditWish: (wish: WishItem) => void;
  onUpdateWishProgress: (id: number, delta: number) => void;
  onToggleWishReserve: (id: number) => void;
  onDeleteWish: (id: number) => void;
  onQuickAddWish: (name: string, priceEGP: number, priceSAR: number, emoji: string) => void;
}

export const KidsWishesSection: React.FC<KidsWishesSectionProps> = ({
  state,
  lang,
  wishKidTab,
  setWishKidTab,
  filteredWishes,
  kidMap,
  onOpenAddWish,
  onOpenEditWish,
  onUpdateWishProgress,
  onToggleWishReserve,
  onDeleteWish,
  onQuickAddWish,
}) => {
  const isEn = lang === 'en';
  const emptyWishesCopy = getEmptyStateCopy('wishes', lang);

  return (
    <section className="space-y-6" aria-label={isEn ? 'Wishes & Gifts' : 'الأمنيات والهدايا'}>
      <div
        style={{ backgroundImage: getCardBackgroundSpec('wishes', state.darkMode).backgroundImageCss }}
        className="image-bg-card rounded-3xl p-6 sm:p-8 flex flex-col items-center justify-center text-center gap-3 shadow-md"
      >
        <div className="image-card-glass-panel rounded-2xl p-4 sm:p-5 max-w-xl w-full flex flex-col items-center justify-center gap-2.5">
          <span className="image-card-badge px-3 py-1 rounded-full text-xs font-extrabold tabular-nums">
            {state.wishes.length} {isEn ? 'Saved Wishes' : 'أمنيات مسجلة'}
          </span>
          <h2 className="image-card-title text-xl sm:text-2xl font-extrabold text-center leading-snug">
            {isEn ? 'Kids Wishes & Family Gift Goals' : 'أمنيات الأطفال وأهداف الإهداء العائلي'}
          </h2>
          <PrimaryCtaButton variant="orange" onClick={onOpenAddWish}>
            {isEn ? '+ Add Wish' : '+ إضافة أمنية'}
          </PrimaryCtaButton>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 bg-[var(--color-control-muted)] dark:bg-[#101D26] border border-[var(--color-border)] dark:border-[#1E3646] p-1.5 rounded-2xl w-max max-w-full">
        <button
          type="button"
          onClick={() => setWishKidTab('all')}
          className={`min-h-[38px] px-3.5 py-1.5 text-xs font-extrabold rounded-xl transition-all duration-300 ease-in-out whitespace-nowrap cursor-pointer ${
            wishKidTab === 'all'
              ? 'bg-[var(--color-surface)] dark:bg-[#142430] text-[var(--color-text)] shadow-xs'
              : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
          }`}
        >
          {isEn ? `All Kids (${state.wishes.length})` : `كل الأطفال (${state.wishes.length})`}
        </button>
        {state.kids.map((k) => (
          <button
            key={k.id}
            type="button"
            onClick={() => setWishKidTab(String(k.id))}
            className={`min-h-[38px] px-3.5 py-1.5 text-xs font-extrabold rounded-xl transition-all duration-300 ease-in-out whitespace-nowrap inline-flex items-center gap-1.5 cursor-pointer ${
              wishKidTab === String(k.id)
                ? 'bg-[var(--color-surface)] dark:bg-[#142430] text-[var(--color-text)] shadow-xs'
                : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            <ThreeDIcon id="children" size={14} />
            <span>{locText(k.name, lang)}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredWishes.length === 0 ? (
            <div className="sm:col-span-2">
              <FriendlyEmptyState
                id="empty-wishes-state"
                iconId="wishes"
                tone="rose"
                title={emptyWishesCopy.title}
                subtitle={emptyWishesCopy.subtitle}
                actionLabel={emptyWishesCopy.actionLabel}
                onAction={onOpenAddWish}
              />
            </div>
          ) : (
            filteredWishes.map((w) => {
              const kidObj = kidMap[String(w.kid)];
              const prog = w.progress ?? (w.reserved ? 100 : 40);
              return (
                <MasterPatternCard
                  key={w.id}
                  tone={w.reserved ? 'emerald' : 'rose'}
                  categoryKey="wishes"
                  itemIdOrIndex={w.id}
                  darkMode={state.darkMode}
                  onThumbnailClick={() => onOpenEditWish(w)}
                  topLeftBadge={kidObj ? locText(kidObj.name, lang) : locText('الأسرة', lang)}
                  topRightBadge={
                    <span>
                      {w.reserved ? (isEn ? '🎁 Reserved' : '🎁 محجوزة') : isEn ? '✨ Available' : '✨ متاحة'}
                    </span>
                  }
                  titlePrefixSlot={<SoftFilledIcon id="wishes" size={18} />}
                  title={locText(w.name, lang)}
                  metaLeft={
                    <span>
                      🎯 {locText(w.goalType || 'خطة تحقيق الأمنية', lang)} · {prog}%
                    </span>
                  }
                  metaRightAction={
                    <span dir="ltr" className="text-xs font-extrabold text-[var(--color-text)] dark:text-[#A5F3FC] tabular-nums">
                      {formatCurrency(w.price, w.currency || state.currency, state.language)}
                    </span>
                  }
                  bodyContent={
                    <div className="w-full h-2.5 rounded-full bg-white dark:bg-[#142430] overflow-hidden border border-pink-100 dark:border-[#1E3646]">
                      <div
                        className="h-full rounded-full transition-all duration-300 ease-in-out"
                        style={{
                          width: `${prog}%`,
                          backgroundColor: 'var(--color-accent)',
                        }}
                      />
                    </div>
                  }
                  footerLeft={
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onUpdateWishProgress(w.id, 15)}
                        className="min-h-[34px] px-2.5 py-1 rounded-xl text-xs font-extrabold border border-[var(--color-border)] dark:border-[#1E3646] bg-white dark:bg-[#142430] text-[var(--color-text)] dark:text-[#F8FAFC] tabular-nums transition-all duration-300 ease-in-out active:scale-95 cursor-pointer"
                      >
                        +15%
                      </button>
                      <button
                        type="button"
                        onClick={() => onToggleWishReserve(w.id)}
                        className="min-h-[34px] px-2.5 py-1 rounded-xl text-xs font-extrabold border border-[var(--color-border)] dark:border-[#1E3646] bg-white dark:bg-[#142430] text-[var(--color-text)] dark:text-[#F8FAFC] transition-all duration-300 ease-in-out active:scale-95 cursor-pointer"
                      >
                        {w.reserved
                          ? isEn
                            ? 'Unreserve'
                            : 'إلغاء الحجز'
                          : isEn
                          ? 'Reserve as Gift'
                          : 'حجز كهدية'}
                      </button>
                    </div>
                  }
                  footerRight={
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onOpenEditWish(w)}
                        className="min-h-[34px] px-2.5 py-1 rounded-xl text-xs font-bold border border-[var(--color-border)] dark:border-[#1E3646] bg-white dark:bg-[#142430] text-[var(--color-text)] dark:text-[#F8FAFC] transition-all duration-300 ease-in-out active:scale-95 cursor-pointer"
                      >
                        {isEn ? 'Edit' : 'تعديل'}
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteWish(w.id)}
                        aria-label={`${isEn ? 'Delete wish' : 'حذف الأمنية'} ${locText(w.name, lang)}`}
                        className="min-h-[34px] px-2.5 py-1 rounded-xl text-xs font-bold border border-red-200 dark:border-[#1E3646] bg-white dark:bg-[#142430] text-red-700 dark:text-rose-400 transition-all duration-300 ease-in-out active:scale-95 cursor-pointer"
                      >
                        ×
                      </button>
                    </div>
                  }
                />
              );
            })
          )}
        </div>

        {/* Gift Ideas Card with Unified SoftFilledIcons */}
        <div className="rounded-3xl border border-amber-200/80 dark:border-[#1E3646] bg-amber-50/85 dark:bg-[#101D26] p-5 shadow-2xs space-y-3.5 soft-card-surface">
          <h3 className="text-sm sm:text-base font-extrabold text-[var(--color-text)] flex items-center gap-2">
            <SoftFilledIcon id="wishes" boxSize="sm" />
            <span>{isEn ? 'Quick Gift Ideas' : 'أفكار هدايا سريعة تفرح ولادنا'}</span>
          </h3>
          <div className="space-y-2.5">
            {[
              { emoji: '📚', iconId: 'media' as const, title: 'مجموعة قصص مصورة', egp: 120, sar: 35 },
              { emoji: '🧩', iconId: 'games' as const, title: 'لعبة تركيب خشبية', egp: 280, sar: 75 },
              { emoji: '🎨', iconId: 'wishes' as const, title: 'حقيبة ألوان مائية آمنة', egp: 150, sar: 42 },
            ].map((idea, idx) => {
              const p = state.currency === 'SAR' ? idea.sar : idea.egp;
              return (
                <MasterPatternCard
                  key={idea.title}
                  tone="amber"
                  categoryKey="toy"
                  itemIdOrIndex={idx + 1}
                  darkMode={state.darkMode}
                  onThumbnailClick={() => onQuickAddWish(idea.title, idea.egp, idea.sar, idea.emoji)}
                  topLeftBadge={isEn ? 'Gift Idea' : 'هدية مقترحة'}
                  topRightBadge={<span>{idea.emoji} ★ 4.9</span>}
                  titlePrefixSlot={<SoftFilledIcon id={idea.iconId} size={18} />}
                  title={locText(idea.title, lang)}
                  footerLeft={
                    <span dir="ltr" className="text-xs sm:text-sm font-extrabold text-amber-900 dark:text-[#FDBA74] tabular-nums">
                      {formatCurrency(p, state.currency, state.language)}
                    </span>
                  }
                  footerRight={
                    <button
                      type="button"
                      onClick={() => onQuickAddWish(idea.title, idea.egp, idea.sar, idea.emoji)}
                      className="min-h-[34px] px-3 py-1 rounded-xl text-xs font-extrabold bg-[#FF8C61] hover:bg-[#e86a3d] text-white whitespace-nowrap transition-all duration-300 ease-in-out active:scale-95 cursor-pointer"
                    >
                      {isEn ? '+ Add' : '+ أضف'}
                    </button>
                  }
                />
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

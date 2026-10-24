import React from 'react';
import {
  ChildProfile,
  FamilySpaceState,
  LanguageCode,
  WishItem,
  formatCurrency,
  locText,
} from '../domain/familySpaceCore';
import { getCardBackgroundSpec } from '../domain/cardBackgrounds';
import { PrimaryCtaButton, SoftFilledIcon, UnifiedBadge } from '../components/DesignSystem';
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

  return (
    <section className="space-y-6" aria-label={isEn ? 'Wishes & Gifts' : 'الأمنيات والهدايا'}>
      <div
        style={{ backgroundImage: getCardBackgroundSpec('wishes', state.darkMode).backgroundImageCss }}
        className="image-bg-card rounded-[24px] p-6 sm:p-8 flex flex-col items-center justify-center text-center gap-3"
      >
        <span className="image-card-badge px-3 py-1 rounded-xl text-xs font-extrabold tabular-nums">
          {state.wishes.length} {isEn ? 'Saved Wishes' : 'أمنيات مسجلة'}
        </span>
        <h2 className="image-card-title text-xl sm:text-2xl font-extrabold text-center">
          {isEn ? 'Kids Wishes & Family Gift Goals' : 'أمنيات الأطفال وأهداف الإهداء العائلي'}
        </h2>
        <PrimaryCtaButton variant="orange" onClick={onOpenAddWish}>
          {isEn ? '+ Add Wish' : '+ إضافة أمنية'}
        </PrimaryCtaButton>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 bg-[var(--color-control-muted)] p-1.5 rounded-2xl w-max max-w-full">
        <button
          type="button"
          onClick={() => setWishKidTab('all')}
          className={`min-h-[38px] px-3.5 py-1.5 text-xs font-extrabold rounded-xl transition-colors whitespace-nowrap ${
            wishKidTab === 'all'
              ? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-xs'
              : 'text-[var(--color-muted)]'
          }`}
        >
          {isEn ? `All Kids (${state.wishes.length})` : `كل الأطفال (${state.wishes.length})`}
        </button>
        {state.kids.map((k) => (
          <button
            key={k.id}
            type="button"
            onClick={() => setWishKidTab(String(k.id))}
            className={`min-h-[38px] px-3.5 py-1.5 text-xs font-extrabold rounded-xl transition-colors whitespace-nowrap inline-flex items-center gap-1.5 ${
              wishKidTab === String(k.id)
                ? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-xs'
                : 'text-[var(--color-muted)]'
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
            <div className="sm:col-span-2 rounded-[24px] border border-dashed border-[var(--color-border)] p-6 text-center text-sm font-bold text-[var(--color-muted)]">
              {isEn ? 'No wishes found for this selection.' : 'قائمة الأمنيات فارغة لهذا الاختيار.'}
            </div>
          ) : (
            filteredWishes.map((w) => {
              const kidObj = kidMap[String(w.kid)];
              const prog = w.progress ?? (w.reserved ? 100 : 40);
              return (
                <div
                  key={w.id}
                  className="rounded-[24px] border border-pink-200/80 bg-pink-50/75 p-5 shadow-2xs flex flex-col justify-between gap-3.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <SoftFilledIcon id="wishes" boxSize="md" />
                      <div className="min-w-0">
                        <div className="font-extrabold text-sm text-[var(--color-text)] truncate">
                          {locText(w.name, lang)}
                        </div>
                        <div className="text-xs font-bold text-[var(--color-muted)] tabular-nums mt-0.5">
                          {kidObj ? locText(kidObj.name, lang) : locText('الأسرة', lang)} ·{' '}
                          {formatCurrency(w.price, w.currency || state.currency, state.language)}
                        </div>
                      </div>
                    </div>
                    <UnifiedBadge tone={w.reserved ? 'emerald' : 'rose'} iconId={w.reserved ? 'star' : 'wishes'}>
                      {w.reserved ? (isEn ? 'Reserved' : 'محجوزة') : isEn ? 'Available' : 'متاحة'}
                    </UnifiedBadge>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-bold text-[var(--color-muted)] tabular-nums">
                      <span>{locText(w.goalType || 'خطة تحقيق الأمنية', lang)}</span>
                      <span className="font-extrabold text-[var(--color-text)]">{prog}%</span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-white overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-200"
                        style={{
                          width: `${prog}%`,
                          backgroundColor: 'var(--color-accent)',
                        }}
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-pink-200/60 flex flex-wrap items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onUpdateWishProgress(w.id, 15)}
                        className="min-h-[36px] px-2.5 py-1 rounded-xl text-xs font-extrabold border border-[var(--color-border)] bg-white text-[var(--color-text)] tabular-nums"
                      >
                        +15%
                      </button>
                      <button
                        type="button"
                        onClick={() => onToggleWishReserve(w.id)}
                        className="min-h-[36px] px-2.5 py-1 rounded-xl text-xs font-extrabold border border-[var(--color-border)] bg-white text-[var(--color-text)]"
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
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onOpenEditWish(w)}
                        className="min-h-[36px] px-2.5 py-1 rounded-xl text-xs font-bold border border-[var(--color-border)] bg-white text-[var(--color-text)]"
                      >
                        {isEn ? 'Edit' : 'تعديل'}
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteWish(w.id)}
                        aria-label={`${isEn ? 'Delete wish' : 'حذف الأمنية'} ${locText(w.name, lang)}`}
                        className="min-h-[36px] px-2.5 py-1 rounded-xl text-xs font-bold border border-red-200 bg-white text-red-700"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Gift Ideas Card with Unified SoftFilledIcons */}
        <div className="rounded-[24px] border border-amber-200/80 bg-amber-50/85 p-5 shadow-2xs space-y-3">
          <h3 className="text-sm sm:text-base font-extrabold text-[var(--color-text)] flex items-center gap-2">
            <SoftFilledIcon id="wishes" boxSize="sm" />
            <span>{isEn ? 'Quick Gift Ideas' : 'أفكار هدايا سريعة'}</span>
          </h3>
          <div className="space-y-2.5">
            {[
              { emoji: '📚', iconId: 'media' as const, title: 'مجموعة قصص مصورة', egp: 120, sar: 35 },
              { emoji: '🧩', iconId: 'games' as const, title: 'لعبة تركيب خشبية', egp: 280, sar: 75 },
              { emoji: '🎨', iconId: 'wishes' as const, title: 'حقيبة ألوان مائية آمنة', egp: 150, sar: 42 },
            ].map((idea) => {
              const p = state.currency === 'SAR' ? idea.sar : idea.egp;
              return (
                <div
                  key={idea.title}
                  className="rounded-2xl border border-white bg-white/90 p-3.5 flex items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="flex items-center gap-3">
                    <SoftFilledIcon id={idea.iconId} boxSize="sm" />
                    <div>
                      <div className="text-xs sm:text-sm font-extrabold text-[var(--color-text)]">
                        {locText(idea.title, lang)}
                      </div>
                      <div className="text-[11px] font-bold text-amber-900 tabular-nums">
                        {formatCurrency(p, state.currency, state.language)}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onQuickAddWish(idea.title, idea.egp, idea.sar, idea.emoji)}
                    className="min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-extrabold bg-amber-600 text-white whitespace-nowrap"
                  >
                    {isEn ? '+ Add' : '+ أضف'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

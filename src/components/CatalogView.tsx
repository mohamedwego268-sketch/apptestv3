import React, { useMemo, useState } from 'react';
import { CommercialItem, LanguageCode, locText } from '../domain/familySpaceCore';
import {
  SequencedCatalogItem,
  useMasterController,
} from '../services/MasterAppController';

export interface CatalogViewProps {
  lang?: LanguageCode;
  onAddToCart?: (item: CommercialItem, variant?: string) => void;
  onInspectItem?: (item: CommercialItem) => void;
  onAddToWishes?: (item: CommercialItem) => void;
  onShowToast?: (msg: string) => void;
}

export const CatalogView: React.FC<CatalogViewProps> = ({
  lang = 'ar',
  onAddToCart,
  onInspectItem,
  onAddToWishes,
  onShowToast,
}) => {
  const isEn = lang === 'en';
  const master = useMasterController();
  const items = master.catalog.items;

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach((item) => {
      if (item.category) set.add(item.category);
    });
    return ['all', ...Array.from(set)];
  }, [items]);

  const filteredItems = useMemo<SequencedCatalogItem[]>(() => {
    const q = searchQuery.trim().toLowerCase();
    return items.filter((item) => {
      const catMatch =
        selectedCategory === 'all' || item.category === selectedCategory;
      if (!catMatch) return false;
      if (!q) return true;
      return (
        item.sequenceCode.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q) ||
        (item.description || '').toLowerCase().includes(q) ||
        (item.partnerBrand || item.sellerName || '').toLowerCase().includes(q)
      );
    });
  }, [items, selectedCategory, searchQuery]);

  const handleRefreshCatalog = async () => {
    setIsRefreshing(true);
    try {
      const refreshed = await master.catalog.refresh();
      onShowToast?.(
        isEn
          ? `🔄 Updated ${refreshed.length} store items`
          : `🔄 تم تحديث ${refreshed.length} منتجاً في المتجر`
      );
    } finally {
      setIsRefreshing(false);
    }
  };

  const categoryLabel = (cat: string) => {
    if (cat === 'all') return isEn ? 'All Items' : 'الكل';
    const map: Record<string, { ar: string; en: string }> = {
      toys: { ar: '🧸 ألعاب مونتيسوري', en: '🧸 Montessori Toys' },
      essentials: { ar: '🍼 مستلزمات الرضع', en: '🍼 Infant Essentials' },
      clothing: { ar: '👟 أزياء قطنية', en: '👟 Cotton Apparel' },
      nursery: { ar: '🏫 حضانات ومدارس', en: '🏫 Nurseries & Schools' },
      courses: { ar: '🎨 كورسات وأنشطة', en: '🎨 Courses & Sports' },
      books: { ar: '📚 قصص ومنصات', en: '📚 Books & Platforms' },
    };
    return map[cat] ? (isEn ? map[cat].en : map[cat].ar) : cat;
  };

  return (
    <div
      id="master-catalog-view"
      data-testid="master-catalog-view"
      dir={isEn ? 'ltr' : 'rtl'}
      className="rounded-2xl border border-gray-100 dark:border-[#1E3646] bg-white dark:bg-[#0F1B24] p-4 space-y-4 shadow-sm"
    >
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[var(--color-border)]/60 dark:border-[#1E3646]">
        <div className="space-y-0.5">
          <div className="inline-flex items-center gap-2">
            <span className="text-sm">🛍️</span>
            <span className="text-[11px] font-black uppercase tracking-wider text-[#0d9488] dark:text-[#2DD4BF]">
              {isEn
                ? 'Family Store & Essentials'
                : 'متجر الأسرة ومستلزمات الأطفال'}
            </span>
          </div>
          <h3 className="text-base font-semibold text-[var(--color-text)] dark:text-[#F8FAFC]">
            {isEn
              ? 'Verified Products & Family Services'
              : 'منتجات وخدمات موثوقة لأطفالكم'}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            data-testid="catalog-refresh-btn"
            disabled={isRefreshing}
            onClick={handleRefreshCatalog}
            className="min-h-[48px] px-3.5 py-2 rounded-xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-muted)] dark:bg-[#142430] text-xs font-extrabold text-[var(--color-text)] dark:text-[#F8FAFC] hover:border-[#0d9488] active:scale-95 transition-all duration-300 ease-in-out cursor-pointer"
          >
            {isRefreshing
              ? isEn
                ? 'Updating...'
                : 'جاري التحديث...'
              : isEn
              ? '🔄 Refresh Store'
              : '🔄 تحديث المنتجات'}
          </button>
        </div>
      </div>

      {/* Search & Category Filter Row */}
      <div className="flex flex-col items-stretch justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto flex-nowrap step-tabs-scroll pb-1">
          {categories.slice(0, 7).map((cat) => {
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                data-testid={`catalog-filter-${cat}`}
                onClick={() => setSelectedCategory(cat)}
                className={`min-h-[48px] shrink-0 whitespace-nowrap px-3.5 py-2 rounded-xl text-xs font-extrabold border active:scale-95 transition-all duration-300 ease-in-out cursor-pointer ${
                  active
                    ? 'bg-[#0d9488] text-white border-[#0d9488]'
                    : 'bg-[var(--color-control-muted)] dark:bg-[#142430] text-[var(--color-text)] dark:text-[#F8FAFC] border-[var(--color-border)] dark:border-[#1E3646]'
                }`}
              >
                {categoryLabel(cat)}
              </button>
            );
          })}
        </div>

        <input
          type="search"
          data-testid="catalog-search-input"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={
            isEn
              ? 'Search products or brands...'
              : 'ابحث باسم المنتج أو العلامة التجارية...'
          }
          className="w-full min-h-[48px] rounded-xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-muted)]/50 dark:bg-[#142430] px-3.5 py-2 text-sm font-semibold text-[var(--color-text)] dark:text-[#F8FAFC]"
        />
      </div>

      {/* Sequenced Catalog Items Grid */}
      <div className="grid grid-cols-1 gap-3.5">
        {filteredItems.slice(0, 6).map((item) => (
          <div
            key={item.id}
            data-testid={`catalog-item-card-${item.sequenceCode}`}
            className="rounded-2xl border border-gray-100 dark:border-[#1E3646] bg-slate-50/75 dark:bg-[#142430]/75 p-4 flex flex-col justify-between gap-3 hover:border-[#0d9488] transition-all duration-300 ease-in-out"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span
                  data-testid={`catalog-sequence-code-${item.id}`}
                  className="px-2.5 py-0.5 rounded-lg bg-[#0d9488]/15 border border-[#0d9488]/30 text-[#0d9488] dark:text-[#2DD4BF] text-[11px] font-black tabular-nums"
                >
                  {item.sequenceCode}
                </span>
                <span className="text-[11px] font-bold text-amber-600 dark:text-amber-300 tabular-nums">
                  ★ {item.rating}
                </span>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="text-2xl shrink-0">{item.emoji}</span>
                <div className="min-w-0">
                  <h4 className="text-base font-semibold text-[var(--color-text)] dark:text-[#F8FAFC] leading-snug">
                    {isEn ? item.nameEn || locText(item.name, lang) : item.name}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-[#94A3B8]">
                    {locText(item.partnerBrand || item.sellerName || item.categoryLabel, lang)} ·{' '}
                    {item.ageStage || '0-8'}
                  </p>
                </div>
              </div>

              <p className="text-sm leading-relaxed text-gray-600 dark:text-[#CBD5E1] line-clamp-2">
                {isEn ? item.descriptionEn || locText(item.description, lang) : item.description}
              </p>
            </div>

            <div className="pt-2.5 border-t border-[var(--color-border)]/60 dark:border-[#1E3646] flex items-center justify-between gap-2">
              <div className="text-xs font-black text-[var(--color-text)] dark:text-[#F8FAFC] tabular-nums">
                {item.priceEGP} {isEn ? 'EGP' : 'ج.م'}
              </div>

              <div className="flex items-center gap-1.5">
                {onAddToWishes && (
                  <button
                    type="button"
                    onClick={() => onAddToWishes(item)}
                    title={isEn ? 'Add to Wishes' : 'أضف للأمنيات'}
                    className="min-h-[34px] px-2.5 py-1 rounded-xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-surface)] dark:bg-[#0B131A] text-xs cursor-pointer hover:border-rose-400"
                  >
                    💝
                  </button>
                )}

                {onInspectItem && (
                  <button
                    type="button"
                    onClick={() => onInspectItem(item)}
                    className="min-h-[34px] px-2.5 py-1 rounded-xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-surface)] dark:bg-[#0B131A] text-[11px] font-extrabold text-[var(--color-text)] dark:text-[#F8FAFC] cursor-pointer"
                  >
                    {isEn ? 'Details' : 'تفاصيل'}
                  </button>
                )}

                <button
                  type="button"
                  data-testid={`catalog-add-cart-${item.sequenceCode}`}
                  onClick={() => {
                    onAddToCart?.(item);
                    onShowToast?.(
                      isEn
                        ? `🛒 Added ${item.nameEn || item.name} to Family Cart`
                        : `🛒 تمت إضافة ${item.name} إلى سلة الأسرة`
                    );
                  }}
                  className="min-h-[34px] px-3 py-1 rounded-xl bg-[#0d9488] hover:bg-[#0f766e] text-white text-[11px] font-black cursor-pointer"
                >
                  + {isEn ? 'Add' : 'أضف للسلة'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

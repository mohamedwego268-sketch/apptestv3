import React from 'react';
import {
  CommercialCatalogItem,
  CurrencyCode,
  LanguageCode,
  convertCatalogPrice,
  formatCurrency,
} from '../domain/familySpaceCore';

export interface MarketplaceCategory {
  id: string;
  titleAr: string;
  titleEn: string;
  subtitleAr: string;
  subtitleEn: string;
  badgeAr: string;
  badgeEn: string;
  emoji: string;
  imageUrl: string;
  matchCategories: readonly string[];
}

interface NekbaarMarketplaceExperienceProps {
  language: LanguageCode;
  currency: CurrencyCode;
  city: string;
  categories: readonly MarketplaceCategory[];
  activeCategory: MarketplaceCategory | null;
  items: CommercialCatalogItem[];
  searchQuery: string;
  onSearchChange: (value: string) => void;
  segment: 'all' | 'product' | 'service' | 'offer';
  onSegmentChange: (value: 'all' | 'product' | 'service' | 'offer') => void;
  sortBy: 'featured' | 'price-asc' | 'price-desc' | 'rating';
  onSortChange: (value: 'featured' | 'price-asc' | 'price-desc' | 'rating') => void;
  cartCount: number;
  onOpenCart: () => void;
  onOpenCategory: (id: string) => void;
  onBackToAll: () => void;
  onInspect: (item: CommercialCatalogItem) => void;
  onAddToCart: (item: CommercialCatalogItem) => void;
  onBookService: (item: CommercialCatalogItem) => void;
  getItemGallery: (item: CommercialCatalogItem) => string[];
  isDemoCatalog: boolean;
}

const MarketplaceProductCard: React.FC<{
  item: CommercialCatalogItem;
  currency: CurrencyCode;
  language: LanguageCode;
  image: string;
  isDemoCatalog: boolean;
  onInspect: () => void;
  onAction: () => void;
}> = ({ item, currency, language, image, isDemoCatalog, onInspect, onAction }) => {
  const isEn = language === 'en';
  const price = convertCatalogPrice(item.priceEGP, item.priceSAR, currency);
  const original = item.originalPriceEGP && item.originalPriceSAR
    ? convertCatalogPrice(item.originalPriceEGP, item.originalPriceSAR, currency)
    : null;
  const isService = item.kind === 'service';
  const badge = item.collectionTag === 'deal'
    ? (isEn ? 'OFFER' : 'عرض')
    : item.collectionTag === 'bestseller'
      ? (isEn ? 'BESTSELLER' : 'الأكثر طلباً')
      : item.collectionTag === 'new'
        ? (isEn ? 'NEW' : 'جديد')
        : '';

  return (
    <article className="group flex min-w-0 flex-col overflow-hidden rounded-[20px] border border-slate-200/90 bg-white shadow-[0_3px_14px_rgba(15,23,42,.045)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_12px_28px_rgba(15,23,42,.10)] dark:border-slate-700/70 dark:bg-[#142430]">
      <button type="button" onClick={onInspect} className="block w-full text-start" aria-label={isEn ? `View ${item.nameEn}` : `عرض ${item.name}`}>
        <div className="relative aspect-square overflow-hidden bg-slate-100 dark:bg-[#0D1D27]">
          {image ? <img src={image} alt={isEn ? item.nameEn : item.name} loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.045]" /> : <div className="flex h-full items-center justify-center text-5xl">{item.emoji || '🧸'}</div>}
          <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-slate-950/25 to-transparent" />
          {badge && <span className="absolute start-2.5 top-2.5 rounded-full bg-white/95 px-2.5 py-1 text-[9px] font-black text-slate-800 shadow-sm dark:bg-slate-900/90 dark:text-white">{badge}</span>}
          {isService && <span className="absolute bottom-2.5 end-2.5 rounded-full bg-teal-700 px-2.5 py-1 text-[9px] font-extrabold text-white">{isEn ? 'SERVICE' : 'خدمة'}</span>}
          {item.kind === 'offer' && <span className="absolute bottom-2.5 end-2.5 rounded-full bg-orange-500 px-2.5 py-1 text-[9px] font-extrabold text-white">{isEn ? 'DEAL' : 'عرض خاص'}</span>}
        </div>
        <div className="space-y-2 p-3">
          <div className="flex min-h-4 items-center justify-between gap-2">
            <span className="truncate text-[9px] font-extrabold tracking-wide text-teal-700 dark:text-teal-300">{item.partnerBrand || item.categoryLabel}</span>
            {item.ageRange && <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-300">{item.ageRange}</span>}
          </div>
          <h3 className="min-h-[2.5rem] line-clamp-2 text-[12px] font-extrabold leading-[1.35rem] text-slate-900 dark:text-white">{isEn ? item.nameEn : item.name}</h3>
          <div className="flex min-h-6 flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="text-[14px] font-black tabular-nums text-slate-950 dark:text-white">{formatCurrency(price, currency, language)}</span>
            {original && original > price && <span className="text-[10px] font-bold text-slate-400 line-through">{formatCurrency(original, currency, language)}</span>}
          </div>
          {isService && item.serviceDurationMinutes ? <p className="text-[9px] font-semibold text-slate-500 dark:text-slate-400">{isEn ? `${item.serviceDurationMinutes} min` : `المدة ${item.serviceDurationMinutes} دقيقة`}</p> : null}
          {!isDemoCatalog && item.sellerName && <p className="truncate text-[9px] text-slate-400">{isEn ? 'By' : 'بواسطة'} {item.sellerName}</p>}
        </div>
      </button>
      <div className="mt-auto flex items-center gap-2 border-t border-slate-100 px-3 py-2.5 dark:border-slate-700/70">
        <button type="button" onClick={onInspect} className="min-h-10 flex-1 rounded-xl border border-slate-200 text-[10px] font-extrabold text-slate-700 transition-colors hover:border-teal-500 hover:text-teal-700 dark:border-slate-600 dark:text-slate-200">{isEn ? 'Details' : 'التفاصيل'}</button>
        <button type="button" onClick={onAction} className="min-h-10 flex-[1.2] rounded-xl bg-[#0D9488] px-2 text-[10px] font-extrabold text-white transition-colors hover:bg-[#0F766E]">{isService ? (isEn ? 'Book' : 'احجز') : (isEn ? 'Add to cart' : 'أضف للسلة')}</button>
      </div>
    </article>
  );
};

export const NekbaarMarketplaceExperience: React.FC<NekbaarMarketplaceExperienceProps> = ({
  language, currency, city, categories, activeCategory, items, searchQuery, onSearchChange,
  segment, onSegmentChange, sortBy, onSortChange, cartCount, onOpenCart, onOpenCategory, onBackToAll,
  onInspect, onAddToCart, onBookService, getItemGallery, isDemoCatalog,
}) => {
  const isEn = language === 'en';
  const visibleItems = activeCategory
    ? items.filter((item) => activeCategory.matchCategories.includes(item.category))
    : items;
  const featured = visibleItems.filter((item) => ['bestseller', 'deal', 'recommended'].includes(item.collectionTag || '')).slice(0, 8);
  // Marketplace merchandising: show a curated rail only on the unfiltered storefront,
  // then keep those same listings out of the main grid to avoid repetitive cards.
  const showFeatured = !activeCategory && segment === 'all' && !searchQuery.trim() && featured.length > 0;
  const featuredItems = showFeatured ? featured.slice(0, 4) : [];
  const featuredIds = new Set(featuredItems.map((item) => item.id));
  const gridItems = showFeatured ? visibleItems.filter((item) => !featuredIds.has(item.id)) : visibleItems;
  const categoryCount = (category: MarketplaceCategory) => items.filter((item) => category.matchCategories.includes(item.category)).length;
  const segments = [
    { id: 'all' as const, ar: 'الكل', en: 'All', icon: '✦' },
    { id: 'product' as const, ar: 'المنتجات', en: 'Products', icon: '▦' },
    { id: 'service' as const, ar: 'الخدمات', en: 'Services', icon: '◷' },
    { id: 'offer' as const, ar: 'العروض', en: 'Offers', icon: '％' },
  ];

  const renderCard = (item: CommercialCatalogItem) => {
    const category = categories.find((entry) => entry.matchCategories.includes(item.category));
    const gallery = getItemGallery(item);
    const image = gallery[0] || item.imageUrl || category?.imageUrl || '';
    return <MarketplaceProductCard
      key={item.id}
      item={item}
      currency={currency}
      language={language}
      image={image}
      isDemoCatalog={isDemoCatalog}
      onInspect={() => onInspect(item)}
      onAction={() => item.kind === 'service' ? onBookService(item) : onAddToCart(item)}
    />;
  };

  return (
    <section data-testid="nekbaar-marketplace-v2" aria-label={isEn ? 'Nekbaar family marketplace' : 'متجر نكبر للأسرة والطفل'} className="space-y-8 pb-6">
      <header className="relative isolate overflow-hidden rounded-[26px] bg-[#102A35] text-white shadow-[0_14px_38px_rgba(15,42,53,.14)]">
        <img src={activeCategory?.imageUrl || categories[0]?.imageUrl} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover opacity-25" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#071B25]/95 via-[#0B2630]/90 to-[#0D554F]/65" />
        <div className="absolute -end-20 -top-24 h-64 w-64 rounded-full bg-teal-300/15 blur-3xl" />
        <div className="relative grid gap-5 p-5 sm:p-7 lg:grid-cols-[1fr_310px] lg:items-center">
          <div className="min-w-0 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[9px] font-black tracking-[.16em] text-teal-100">NEKBAAR MARKET</span>
              <span className="rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-bold text-white/80">📍 {city}</span>
              {isDemoCatalog && <span className="rounded-full border border-amber-200/30 bg-amber-300/10 px-3 py-1.5 text-[9px] font-bold text-amber-100">{isEn ? 'PREVIEW' : 'نسخة معاينة'}</span>}
            </div>
            {activeCategory ? (
              <div className="space-y-2">
                <button type="button" onClick={onBackToAll} className="text-[11px] font-bold text-teal-200 hover:text-white">← {isEn ? 'All departments' : 'كل أقسام المتجر'}</button>
                <div><p className="mb-1.5 text-[10px] font-bold tracking-wide text-teal-200">{activeCategory.emoji} {isEn ? 'DEPARTMENT' : 'القسم'}</p><h1 className="max-w-2xl text-3xl font-black leading-tight sm:text-4xl">{isEn ? activeCategory.titleEn : activeCategory.titleAr}</h1><p className="mt-2 max-w-xl text-sm leading-6 text-white/75">{isEn ? activeCategory.subtitleEn : activeCategory.subtitleAr}</p></div>
              </div>
            ) : (
              <div><p className="mb-2 text-[10px] font-bold tracking-wide text-teal-200">{isEn ? 'MADE FOR LITTLE ONES & THE PEOPLE WHO LOVE THEM' : 'كل ما يهم طفلك وأسرتك في مكان واحد'}</p><h1 className="max-w-2xl text-[2rem] font-black leading-[1.2] sm:text-[2.8rem]">{isEn ? 'A little more joy in every family day.' : 'كل يوم أحلى… باختيارات تليق بأسرتك.'}</h1><p className="mt-2 max-w-xl text-[13px] leading-6 text-white/75">{isEn ? 'Discover products, helpful services and experiences for every stage of childhood.' : 'اكتشف منتجات وخدمات وتجارب مختارة ترافق طفلك في كل مرحلة.'}</p></div>
            )}
            <div className="flex flex-col gap-2 rounded-2xl border border-white/15 bg-white p-2 shadow-lg sm:flex-row">
              <div className="flex min-w-0 flex-1 items-center gap-2 px-2"><span className="text-xl text-slate-400">⌕</span><input data-testid="storefront-search-input" value={searchQuery} onChange={(event) => onSearchChange(event.target.value)} type="search" placeholder={isEn ? 'Search products, services and more' : 'ابحث عن منتج أو خدمة أو احتياج للأسرة'} aria-label={isEn ? 'Search marketplace' : 'ابحث في المتجر'} className="h-11 min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400" /></div>
              <button type="button" onClick={onOpenCart} className="relative min-h-11 rounded-xl bg-[#0D9488] px-5 text-xs font-black text-white transition-colors hover:bg-[#0F766E]">{isEn ? 'Cart' : 'سلة المشتريات'} 🛒{cartCount > 0 && <span className="ms-2 rounded-full bg-white px-1.5 py-0.5 text-[9px] text-teal-800">{cartCount}</span>}</button>
            </div>
          </div>
          <div className="hidden lg:block">
            <div className="relative overflow-hidden rounded-[22px] border border-white/15 bg-white/10 p-2.5 backdrop-blur-sm">
              <img src={activeCategory?.imageUrl || categories.find((entry) => entry.id === 'toys')?.imageUrl || categories[0]?.imageUrl} alt="" className="h-[205px] w-full rounded-[16px] object-cover" />
              <div className="flex items-center justify-between gap-3 px-2 pb-1 pt-3"><div><p className="text-[9px] font-bold text-teal-200">{isEn ? 'DISCOVER NEKBAAR' : 'اكتشف عالم نكبر'}</p><p className="mt-1 text-xs font-black">{isEn ? 'Little things. Big memories.' : 'تفاصيل صغيرة… وذكريات كبيرة.'}</p></div><span className="text-2xl">✦</span></div>
            </div>
          </div>
        </div>
      </header>

      {!activeCategory && (
        <section className="space-y-3">
          <div className="flex items-end justify-between gap-3"><div><p className="text-[9px] font-black tracking-[.15em] text-teal-700 dark:text-teal-300">{isEn ? 'EXPLORE' : 'اكتشف الأقسام'}</p><h2 className="mt-1 text-lg font-black text-slate-900 dark:text-white">{isEn ? 'Shop by need' : 'تسوّق حسب احتياجك'}</h2></div><span className="text-[10px] font-medium text-slate-400">{categories.length} {isEn ? 'departments' : 'أقسام'}</span></div>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
            {categories.map((category) => {
              const count = categoryCount(category);
              return <button key={category.id} type="button" onClick={() => onOpenCategory(category.id)} className="group relative min-h-[138px] overflow-hidden rounded-[18px] bg-slate-900 text-start shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-lg sm:min-h-[158px]">
                <img src={category.imageUrl} alt="" aria-hidden="true" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover opacity-90 transition-transform duration-500 group-hover:scale-105" />
                <span className="absolute inset-0 bg-gradient-to-t from-[#07131B]/95 via-[#07131B]/25 to-transparent" />
                <span className="relative flex h-full min-h-[138px] flex-col justify-between p-3 sm:min-h-[158px]"><span className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/20 bg-white/15 text-lg backdrop-blur-sm">{category.emoji}</span><span><span className="block text-[11px] font-black text-white">{isEn ? category.badgeEn : category.badgeAr}</span><span className="mt-1 block text-[9px] font-medium text-white/70">{count} {isEn ? 'items' : 'اختيار'}</span></span></span>
              </button>;
            })}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div><p className="text-[9px] font-black tracking-[.15em] text-teal-700 dark:text-teal-300">{isEn ? 'FIND YOUR MATCH' : 'اختار بسهولة'}</p><h2 className="mt-1 text-lg font-black text-slate-900 dark:text-white">{isEn ? 'Browse the marketplace' : 'كل المنتجات والخدمات'}</h2></div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-[10px] font-bold text-slate-500 shadow-sm dark:border-slate-700 dark:bg-[#142430] dark:text-slate-300">
              <span>{isEn ? 'Sort' : 'ترتيب'}</span>
              <select data-testid="marketplace-sort" value={sortBy} onChange={(event) => onSortChange(event.target.value as 'featured' | 'price-asc' | 'price-desc' | 'rating')} className="max-w-[145px] bg-transparent text-[10px] font-extrabold text-slate-900 outline-none dark:text-white" aria-label={isEn ? 'Sort products' : 'ترتيب المنتجات'}>
                <option value="featured">{isEn ? 'Recommended' : 'الأكثر صلة'}</option>
                <option value="price-asc">{isEn ? 'Price: low to high' : 'السعر: الأقل أولاً'}</option>
                <option value="price-desc">{isEn ? 'Price: high to low' : 'السعر: الأعلى أولاً'}</option>
                {!isDemoCatalog && <option value="rating">{isEn ? 'Top rated' : 'الأعلى تقييماً'}</option>}
              </select>
            </label>
            <div className="flex items-center gap-1.5 rounded-full bg-slate-100 p-1 dark:bg-slate-800">
              {segments.map((tab) => <button key={tab.id} type="button" onClick={() => onSegmentChange(tab.id)} aria-pressed={segment === tab.id} className={'min-h-9 rounded-full px-3 text-[10px] font-extrabold transition-colors ' + (segment === tab.id ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white')}>{tab.icon} {isEn ? tab.en : tab.ar}</button>)}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-2 dark:border-slate-700"><span className="text-[10px] text-slate-500 dark:text-slate-400">{gridItems.length + featuredItems.length} {isEn ? 'results' : 'نتيجة'}</span>{activeCategory && <button type="button" onClick={onBackToAll} className="text-[10px] font-bold text-teal-700 dark:text-teal-300">← {isEn ? 'All departments' : 'كل الأقسام'}</button>}</div>
        {gridItems.length + featuredItems.length > 0 ? (gridItems.length > 0 ? <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4">{gridItems.slice(0, 32).map(renderCard)}</div> : null) : <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-700 dark:bg-[#142430]"><span className="text-4xl">⌕</span><h3 className="mt-3 text-sm font-black text-slate-900 dark:text-white">{isEn ? 'No matching listings yet' : 'مفيش نتائج مطابقة حالياً'}</h3><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{isEn ? 'Try another search or department.' : 'جرّب كلمة بحث تانية أو اختار قسم مختلف.'}</p><button type="button" onClick={onBackToAll} className="mt-4 rounded-xl bg-teal-700 px-4 py-2.5 text-xs font-extrabold text-white">{isEn ? 'Back to all departments' : 'العودة لكل الأقسام'}</button></div>}
      </section>

      {showFeatured && (
        <section className="space-y-3" aria-label={isEn ? 'Featured family picks' : 'اختيارات نكبر المميزة'}>
          <div className="flex items-end justify-between gap-3"><div><p className="text-[9px] font-black tracking-[.15em] text-orange-600 dark:text-orange-300">{isEn ? 'CURATED FOR YOU' : 'اختيارات نكبر'}</p><h2 className="mt-1 text-lg font-black text-slate-900 dark:text-white">{isEn ? 'Family favourites' : 'اختيارات تستاهل التجربة'}</h2></div><span className="text-[10px] font-semibold text-slate-400">{isEn ? 'Handpicked' : 'مختارة بعناية'}</span></div>
          <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2">{featuredItems.map((item) => <div key={item.id} className="w-[min(76vw,250px)] shrink-0 snap-start sm:w-[250px]">{renderCard(item)}</div>)}</div>
        </section>
      )}

      {isDemoCatalog && <p className="rounded-xl border border-dashed border-amber-200 bg-amber-50 px-3 py-2.5 text-[10px] leading-5 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-200">🧪 {isEn ? 'Preview experience: sample catalog content and imagery are illustrative. No payment or provider booking is processed.' : 'تجربة معاينة: المنتجات والصور المعروضة توضيحية. لا يتم تحصيل أموال أو إرسال حجوزات فعلية.'}</p>}
    </section>
  );
};

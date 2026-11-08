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
    ? (isEn ? 'SPECIAL OFFER' : 'عرض مميز')
    : item.collectionTag === 'bestseller'
      ? (isEn ? 'BEST SELLER' : 'الأكثر طلباً')
      : item.collectionTag === 'new'
        ? (isEn ? 'NEW' : 'جديد')
        : item.kind === 'service'
          ? (isEn ? 'BOOKING' : 'حجز')
          : '';

  return (
    <article className="group min-w-0 overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_5px_22px_rgba(15,23,42,.045)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_14px_34px_rgba(15,23,42,.11)] dark:border-slate-700/70 dark:bg-[#142430]">
      <button type="button" onClick={onInspect} className="block w-full text-start" aria-label={isEn ? `View ${item.nameEn}` : `عرض ${item.name}`}>
        <div className="relative aspect-[1.08/1] overflow-hidden bg-slate-100 dark:bg-[#0D1D27]">
          {image ? <img src={image} alt={isEn ? item.nameEn : item.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.055]" /> : <div className="flex h-full items-center justify-center text-6xl">{item.emoji || '🧸'}</div>}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-950/35 to-transparent" />
          {badge && <span className="absolute start-2.5 top-2.5 rounded-full bg-white/95 px-2.5 py-1 text-[9px] font-black tracking-wide text-slate-800 shadow-sm dark:bg-slate-900/90 dark:text-white">{badge}</span>}
          {isService && <span className="absolute bottom-2.5 end-2.5 rounded-full bg-[#0D9488] px-2.5 py-1 text-[9px] font-extrabold text-white">{isEn ? 'Service' : 'خدمة'}</span>}
          {!isService && <span className="absolute bottom-2.5 end-2.5 rounded-full bg-white/95 px-2 py-1 text-[9px] font-extrabold text-slate-700">{isEn ? 'Family pick' : 'اختيار الأسرة'}</span>}
        </div>
        <div className="space-y-1.5 p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-[9px] font-extrabold uppercase tracking-wide text-teal-700 dark:text-teal-300">{item.partnerBrand || item.categoryLabel}</span>
            {item.ageRange && <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-300">{item.ageRange}</span>}
          </div>
          <h3 className="min-h-[2.6rem] line-clamp-2 text-[12px] font-extrabold leading-5 text-slate-900 dark:text-white">{isEn ? item.nameEn : item.name}</h3>
          <p className="min-h-[2rem] line-clamp-2 text-[10px] leading-4 text-slate-500 dark:text-slate-400">{isEn ? (item.descriptionEn || item.description) : item.description}</p>
          <div className="flex min-h-6 items-center gap-2">
            <span className="text-[14px] font-black tabular-nums text-slate-950 dark:text-white">{formatCurrency(price, currency, language)}</span>
            {original && original > price && <span className="text-[10px] font-bold text-slate-400 line-through">{formatCurrency(original, currency, language)}</span>}
          </div>
          {isService && item.serviceDurationMinutes ? <p className="text-[9px] font-bold text-slate-500 dark:text-slate-400">{isEn ? `${item.serviceDurationMinutes} min session` : `مدة الخدمة ${item.serviceDurationMinutes} دقيقة`}</p> : null}
          {!isDemoCatalog && item.sellerName && <p className="truncate text-[9px] text-slate-400">{isEn ? 'Sold by' : 'البائع'} · {item.sellerName}</p>}
        </div>
      </button>
      <div className="flex items-center gap-2 border-t border-slate-100 px-3 py-2.5 dark:border-slate-700/70">
        <button type="button" onClick={onInspect} className="min-h-9 flex-1 rounded-xl border border-slate-200 text-[10px] font-extrabold text-slate-700 transition-colors hover:border-teal-500 hover:text-teal-700 dark:border-slate-600 dark:text-slate-200 dark:hover:text-teal-300">{isEn ? 'Details' : 'التفاصيل'}</button>
        <button type="button" onClick={onAction} className="min-h-9 flex-[1.15] rounded-xl bg-[#0D9488] px-2 text-[10px] font-extrabold text-white transition-colors hover:bg-[#0F766E]">{isService ? (isEn ? 'Book now' : 'احجز الآن') : (isEn ? 'Add to cart' : 'أضف للسلة')}</button>
      </div>
    </article>
  );
};

export const NekbaarMarketplaceExperience: React.FC<NekbaarMarketplaceExperienceProps> = ({
  language, currency, city, categories, activeCategory, items, searchQuery, onSearchChange,
  segment, onSegmentChange, cartCount, onOpenCart, onOpenCategory, onBackToAll,
  onInspect, onAddToCart, onBookService, getItemGallery, isDemoCatalog,
}) => {
  const isEn = language === 'en';
  const visibleItems = activeCategory
    ? items.filter((item) => activeCategory.matchCategories.includes(item.category))
    : items;
  const products = visibleItems.filter((item) => item.kind !== 'service');
  const services = visibleItems.filter((item) => item.kind === 'service');
  const featured = visibleItems.filter((item) => ['bestseller', 'deal', 'recommended'].includes(item.collectionTag || '')).slice(0, 8);
  const mainPicks = featured.length ? featured : products.slice(0, 8);
  const segments = [
    { id: 'all' as const, ar: 'الكل', en: 'All', icon: '✦' },
    { id: 'product' as const, ar: 'المنتجات', en: 'Products', icon: '▦' },
    { id: 'service' as const, ar: 'الخدمات والحجوزات', en: 'Services', icon: '◷' },
    { id: 'offer' as const, ar: 'العروض', en: 'Offers', icon: '％' },
  ];

  const renderCard = (item: CommercialCatalogItem, index: number) => {
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
    <section data-testid="nekbaar-marketplace-v2" aria-label={isEn ? 'Nekbaar family marketplace' : 'متجر نكبر للأسرة والطفل'} className="space-y-7 pb-5">
      <div className="relative isolate overflow-hidden rounded-[30px] bg-[#102A35] text-white shadow-[0_18px_55px_rgba(15,42,53,.18)]">
        <img src={activeCategory?.imageUrl || categories[0]?.imageUrl} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover opacity-35" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#071B25] via-[#0B2630]/95 to-[#0B2630]/55" />
        <div className="absolute -end-16 -top-20 h-64 w-64 rounded-full bg-teal-400/20 blur-3xl" />
        <div className="relative grid gap-6 p-5 sm:p-8 lg:grid-cols-[1.2fr_.8fr] lg:items-center">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[9px] font-black tracking-[.18em] text-teal-100">NEKBAAR MARKET</span>
              <span className="rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-bold text-white/80">📍 {city}</span>
              {isDemoCatalog && <span className="rounded-full border border-amber-200/30 bg-amber-300/10 px-3 py-1.5 text-[9px] font-bold text-amber-100">{isEn ? 'Preview catalog' : 'كتالوج معاينة'}</span>}
            </div>
            {activeCategory ? (
              <>
                <button type="button" onClick={onBackToAll} className="text-xs font-bold text-teal-200 hover:text-white">← {isEn ? 'All departments' : 'كل أقسام المتجر'}</button>
                <div><p className="mb-2 text-xs font-bold text-teal-200">{activeCategory.emoji} {isEn ? 'DEPARTMENT' : 'القسم'}</p><h1 className="max-w-2xl text-3xl font-black leading-tight sm:text-4xl">{isEn ? activeCategory.titleEn : activeCategory.titleAr}</h1><p className="mt-3 max-w-xl text-sm leading-7 text-white/75">{isEn ? activeCategory.subtitleEn : activeCategory.subtitleAr}</p></div>
              </>
            ) : (
              <>
                <div><p className="mb-2 text-xs font-bold text-teal-200">{isEn ? 'A MARKETPLACE MADE FOR FAMILY LIFE' : 'كل احتياجات الطفل والأسرة في مكان واحد'}</p><h1 className="max-w-2xl text-3xl font-black leading-[1.18] sm:text-5xl">{isEn ? 'Good choices for every little milestone.' : 'اختيارات أذكى… لكل مرحلة في حياة طفلك.'}</h1><p className="mt-3 max-w-xl text-sm leading-7 text-white/75">{isEn ? 'Shop essentials, discover trusted services and find experiences your family will love.' : 'تسوّق احتياجات طفلك، اكتشف خدمات مفيدة، واختار تجارب تضيف لحياة أسرتك.'}</p></div>
                <div className="flex flex-wrap gap-2"><span className="rounded-full border border-white/15 bg-white/10 px-3 py-2 text-[10px] font-bold">🧸 {isEn ? 'Play & learn' : 'لعب وتعلّم'}</span><span className="rounded-full border border-white/15 bg-white/10 px-3 py-2 text-[10px] font-bold">🩺 {isEn ? 'Health & care' : 'صحة ورعاية'}</span><span className="rounded-full border border-white/15 bg-white/10 px-3 py-2 text-[10px] font-bold">⚽ {isEn ? 'Activities' : 'أنشطة وتجارب'}</span></div>
              </>
            )}
            <div className="flex flex-col gap-2 rounded-2xl border border-white/15 bg-white p-2 shadow-xl sm:flex-row">
              <div className="flex min-w-0 flex-1 items-center gap-2 px-2"><span className="text-xl text-slate-400">⌕</span><input data-testid="storefront-search-input" value={searchQuery} onChange={(event) => onSearchChange(event.target.value)} type="search" placeholder={isEn ? 'What does your family need today?' : 'بتدور على إيه؟ لعبة، منتج، خدمة، أو مكان...'} aria-label={isEn ? 'Search marketplace' : 'ابحث في المتجر'} className="h-11 min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400" /></div>
              <div className="flex gap-2"><button type="button" onClick={onOpenCart} className="relative min-h-11 flex-1 rounded-xl bg-[#0D9488] px-5 text-xs font-black text-white hover:bg-[#0F766E] sm:flex-none">{isEn ? 'Open cart' : 'سلة المشتريات'} 🛒{cartCount > 0 && <span className="ms-2 rounded-full bg-white px-1.5 py-0.5 text-[9px] text-teal-800">{cartCount}</span>}</button></div>
            </div>
          </div>
          <div className="hidden lg:block">
            <div className="relative mx-auto max-w-[360px]">
              <div className="absolute -inset-4 rounded-[34px] bg-teal-300/10 blur-xl" />
              <div className="relative overflow-hidden rounded-[28px] border border-white/20 bg-white/10 p-3 backdrop-blur-sm">
                <img src={activeCategory?.imageUrl || categories.find((entry) => entry.id === 'toys')?.imageUrl || categories[0]?.imageUrl} alt="" className="h-[270px] w-full rounded-[20px] object-cover" />
                <div className="flex items-center justify-between gap-3 px-2 pb-1 pt-3"><div><p className="text-[10px] font-bold text-teal-200">{isEn ? 'DISCOVER MORE' : 'اكتشف عالم نكبر'}</p><p className="mt-1 text-sm font-black">{isEn ? 'Little things. Big memories.' : 'تفاصيل صغيرة… وذكريات كبيرة.'}</p></div><span className="text-3xl">✦</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {!activeCategory && (
        <>
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {segments.map((tab) => <button key={tab.id} type="button" onClick={() => onSegmentChange(tab.id)} aria-pressed={segment === tab.id} className={'shrink-0 rounded-full border px-4 py-2.5 text-[11px] font-extrabold transition-colors ' + (segment === tab.id ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-950' : 'border-slate-200 bg-white text-slate-600 hover:border-teal-500 dark:border-slate-700 dark:bg-[#142430] dark:text-slate-200')}>{tab.icon} {isEn ? tab.en : tab.ar}</button>)}
            <span className="ms-auto self-center whitespace-nowrap text-[10px] font-bold text-slate-400">{visibleItems.length} {isEn ? 'items' : 'منتج وخدمة'}</span>
          </div>

          <section className="space-y-3">
            <div className="flex items-end justify-between gap-3"><div><p className="text-[10px] font-black tracking-wider text-teal-700 dark:text-teal-300">{isEn ? 'EXPLORE THE MARKET' : 'اكتشف المتجر'}</p><h2 className="mt-1 text-xl font-black text-slate-900 dark:text-white">{isEn ? 'Shop by department' : 'تسوّق حسب احتياجك'}</h2></div><span className="text-[10px] font-bold text-slate-400">{isEn ? 'Explore all' : 'كل الأقسام'} ↙</span></div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {categories.map((category, index) => {
                const count = items.filter((item) => category.matchCategories.includes(item.category)).length;
                return <button key={category.id} type="button" onClick={() => onOpenCategory(category.id)} className="group relative min-h-[145px] overflow-hidden rounded-[22px] border border-slate-200 bg-slate-900 text-start shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg dark:border-slate-700 sm:min-h-[170px]">
                  <img src={category.imageUrl} alt="" aria-hidden="true" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-90 transition-transform duration-500 group-hover:scale-110" />
                  <span className="absolute inset-0 bg-gradient-to-t from-[#07131B] via-[#07131B]/45 to-transparent" />
                  <span className="relative flex h-full min-h-[145px] flex-col justify-between p-3 sm:min-h-[170px]"><span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/25 bg-white/15 text-xl backdrop-blur-sm">{category.emoji}</span><span><span className="block text-xs font-black text-white">{isEn ? category.badgeEn : category.badgeAr}</span><span className="mt-1 block text-[9px] font-semibold text-white/75">{count} {isEn ? 'listings' : 'اختيار'}</span></span></span>
                </button>;
              })}
            </div>
          </section>

          {mainPicks.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-end justify-between gap-3"><div><p className="text-[10px] font-black tracking-wider text-orange-600 dark:text-orange-300">{isEn ? 'PICKED FOR FAMILIES' : 'اختيارات نكبر'}</p><h2 className="mt-1 text-xl font-black text-slate-900 dark:text-white">{isEn ? 'Worth a closer look' : 'اختيارات تستاهل تشوفها'}</h2></div><span className="text-[10px] font-bold text-slate-400">{isEn ? 'Curated picks' : 'مختارة بعناية'} ✦</span></div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{mainPicks.slice(0, 4).map(renderCard)}</div>
            </section>
          )}
        </>
      )}

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3"><div><p className="text-[10px] font-black tracking-wider text-teal-700 dark:text-teal-300">{activeCategory ? (isEn ? 'DEPARTMENT LISTINGS' : 'معروضات القسم') : (isEn ? 'THE FAMILY MARKET' : 'سوق الأسرة')}</p><h2 className="mt-1 text-xl font-black text-slate-900 dark:text-white">{activeCategory ? (isEn ? 'Explore this department' : 'اختار اللي يناسبك') : segment === 'service' ? (isEn ? 'Services & experiences' : 'خدمات وتجارب للأسرة') : segment === 'offer' ? (isEn ? 'Offers for your family' : 'عروض الأسرة') : (isEn ? 'Products & essentials' : 'منتجات واحتياجات الأسرة')}</h2></div><span className="text-[10px] font-bold text-slate-400">{visibleItems.length} {isEn ? 'results' : 'نتيجة'}</span></div>
        {visibleItems.length > 0 ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{visibleItems.slice(0, 24).map(renderCard)}</div> : <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-700 dark:bg-[#142430]"><span className="text-4xl">🔎</span><h3 className="mt-3 text-sm font-black text-slate-900 dark:text-white">{isEn ? 'No matching listings yet' : 'مفيش نتائج مطابقة حالياً'}</h3><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{isEn ? 'Try another search or department.' : 'جرّب كلمة بحث تانية أو اختار قسم مختلف.'}</p><button type="button" onClick={onBackToAll} className="mt-4 rounded-xl bg-teal-700 px-4 py-2.5 text-xs font-extrabold text-white">{isEn ? 'Back to all departments' : 'العودة لكل الأقسام'}</button></div>}
      </section>

      {!activeCategory && services.length > 0 && segment === 'all' && (
        <section className="rounded-[26px] border border-teal-100 bg-gradient-to-br from-teal-50 to-white p-4 dark:border-teal-900/50 dark:from-[#102A2B] dark:to-[#142430] sm:p-5">
          <div className="mb-3 flex items-center justify-between gap-3"><div><p className="text-[10px] font-black tracking-wider text-teal-700 dark:text-teal-300">{isEn ? 'MORE THAN SHOPPING' : 'مش منتجات وبس'}</p><h2 className="mt-1 text-lg font-black text-slate-900 dark:text-white">{isEn ? 'Services that make family life easier' : 'خدمات وتجارب تسهّل حياة الأسرة'}</h2></div><span className="text-2xl">📅</span></div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{services.slice(0, 4).map(renderCard)}</div>
        </section>
      )}

      {isDemoCatalog && <p className="rounded-xl border border-dashed border-amber-200 bg-amber-50 px-3 py-2.5 text-[10px] leading-5 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-200">🧪 {isEn ? 'Preview experience: sample catalog content and imagery are illustrative. No payment or provider booking is processed.' : 'تجربة معاينة: المنتجات والصور المعروضة توضيحية. لا يتم تحصيل أموال أو إرسال حجوزات فعلية.'}</p>}
    </section>
  );
};

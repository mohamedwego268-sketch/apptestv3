import React, { useState } from 'react';
import {
  COMMERCIAL_CATALOG,
  CartItem,
  CommercialCatalogItem,
  CountryCode,
  CurrencyCode,
  DemoOrder,
  DemoShippingAddress,
  LanguageCode,
  formatCurrency,
} from '../domain/familySpaceCore';
import { ThreeDIcon } from './ThreeDVisuals';
import {
  BannerSlideItem,
  PASTEL_CARD_TONES,
  PastelTone,
  PrimaryCtaButton,
  SwipeableBannerCarousel,
} from './DesignSystem';

interface CommercialEcosystemSectionProps {
  country: CountryCode;
  city?: string;
  currency: CurrencyCode;
  language: LanguageCode;
  cart: CartItem[];
  shippingAddress: DemoShippingAddress;
  orders: DemoOrder[];
  onAddProductToWishes: (item: CommercialCatalogItem) => void;
  onInspectCommercialItem: (item: CommercialCatalogItem) => void;
  onAddToCart: (item: CommercialCatalogItem, variant?: string) => void;
  onUpdateCartQuantity: (productId: number, delta: number) => void;
  onRemoveFromCart: (productId: number) => void;
  onUpdateShippingAddress: (patch: Partial<DemoShippingAddress>) => void;
  onCompleteDemoCheckout: () => void;
}

const CATEGORY_TONE_MAP: Record<string, PastelTone> = {
  toys: 'amber',
  clothing: 'rose',
  essentials: 'sky',
  doctor: 'emerald',
  nursery: 'indigo',
  consultation: 'purple',
  delivery: 'teal',
};

export const CommercialEcosystemSection: React.FC<CommercialEcosystemSectionProps> = ({
  country,
  city = country === 'SA' ? 'الرياض' : 'القاهرة',
  currency,
  language,
  cart,
  shippingAddress,
  orders,
  onAddProductToWishes,
  onInspectCommercialItem,
  onAddToCart,
  onUpdateCartQuantity,
  onRemoveFromCart,
  onUpdateShippingAddress,
  onCompleteDemoCheckout,
}) => {
  const isEn = language === 'en';
  const [segment, setSegment] = useState<'all' | 'product' | 'service' | 'offer'>('all');
  const [collectionFilter, setCollectionFilter] = useState<
    'all' | 'bestseller' | 'new' | 'deal' | 'recommended'
  >('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [cityScopeFilter, setCityScopeFilter] = useState<'all' | 'local'>('all');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'rating'>('featured');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCartPanel, setShowCartPanel] = useState(false);

  const filtered = COMMERCIAL_CATALOG.filter((item) => {
    if (segment !== 'all' && item.kind !== segment) return false;
    if (collectionFilter !== 'all' && item.collectionTag !== collectionFilter) return false;
    if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
    if (cityScopeFilter === 'local' && item.kind === 'service') {
      const loc = country === 'SA' ? item.locationSA : item.locationEG;
      if (loc && !loc.includes(city)) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const match =
        item.name.toLowerCase().includes(q) ||
        item.nameEn.toLowerCase().includes(q) ||
        item.categoryLabel.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  }).sort((a, b) => {
    const priceA = currency === 'SAR' ? a.priceSAR : a.priceEGP;
    const priceB = currency === 'SAR' ? b.priceSAR : b.priceEGP;
    if (sortBy === 'price-asc') return priceA - priceB;
    if (sortBy === 'price-desc') return priceB - priceA;
    if (sortBy === 'rating') return Number(b.rating) - Number(a.rating);
    return 0;
  });

  const cartEnriched = cart
    .map((ci) => {
      const product = COMMERCIAL_CATALOG.find((p) => p.id === ci.productId);
      if (!product) return null;
      const unitPrice = currency === 'SAR' ? product.priceSAR : product.priceEGP;
      return {
        ...ci,
        product,
        unitPrice,
        lineTotal: unitPrice * ci.quantity,
      };
    })
    .filter((x): x is NonNullable<typeof x> => Boolean(x));

  const cartTotalCount = cartEnriched.reduce((acc, c) => acc + c.quantity, 0);
  const cartTotalAmount = cartEnriched.reduce((acc, c) => acc + c.lineTotal, 0);

  const storeBanners: BannerSlideItem[] = [
    {
      id: 'store-slide-deals',
      badge: isEn ? '🛍️ Family Super Deals' : '🛍️ عروض متجر الأسرة',
      title: isEn
        ? `Montessori Toys & Organic Baby Essentials (${currency})`
        : `ألعاب مونتيسوري ومستلزمات الطفل العضوية (${currency})`,
      subtitle: isEn
        ? `Fast Delivery in ${city} · Curated for 0–8 Yrs`
        : `توصيل سريع في ${city} · مختارات لعمر 0–8 سنوات`,
      ctaLabel: isEn ? 'Shop Bestsellers Now' : 'تسوّق الأكثر مبيعًا الآن',
      onCtaClick: () => {
        setSegment('product');
        setCollectionFilter('bestseller');
      },
      iconId: 'services',
      gradient: 'linear-gradient(125deg, #fff4e6, #ffedd5, #fde8ef)',
      ctaVariant: 'orange',
    },
    {
      id: 'store-slide-nurseries',
      badge: isEn ? '🏫 Verified Nurseries & Clinics' : '🏫 حضانات وعيادات موثقة',
      title: isEn
        ? `Top Nurseries & Pediatric Services in ${city}`
        : `أفضل الحضانات والخدمات المعتمدة في ${city}`,
      subtitle: isEn
        ? 'Verified Ratings · Direct Booking · Local Directory'
        : 'تقييمات موثقة · حجز مباشر · دليل مدينتك',
      ctaLabel: isEn ? 'Explore Local Services' : 'استكشف خدمات مدينتي',
      onCtaClick: () => {
        setSegment('service');
        setCityScopeFilter('local');
      },
      iconId: 'children',
      gradient: 'linear-gradient(125deg, #eef2ff, #e0e7ff, #f3e8ff)',
      ctaVariant: 'indigo',
    },
    {
      id: 'store-slide-offers',
      badge: isEn ? '🏷️ Partner Bundles' : '🏷️ باقات التوفير العائلية',
      title: isEn
        ? 'Save up to 25% on Seasonal Child Bundles'
        : 'وفّر حتى 25% على باقات الطفل والمواليد',
      subtitle: isEn
        ? 'Simulated Cart & Instant Checkout'
        : 'سلة تسوق ذكية · إتمام طلب فوري',
      ctaLabel: isEn ? `Open Cart (${cartTotalCount})` : `افتح سلة التسوق (${cartTotalCount})`,
      onCtaClick: () => setShowCartPanel(true),
      iconId: 'cart',
      gradient: 'linear-gradient(125deg, #ecfdf5, #d1fae5, #e0f2fe)',
      ctaVariant: 'emerald',
    },
  ];

  return (
    <section className="space-y-5" aria-label={isEn ? 'Family Store & Services' : 'المتجر والخدمات'}>
      {/* Top Action Strip: City Filter + Prominent Cart Button */}
      <div className="rounded-2xl border border-amber-200/80 bg-amber-50/80 px-4 py-3 shadow-2xs flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-white shadow-2xs flex items-center justify-center shrink-0">
            <ThreeDIcon id="services" size={28} />
          </div>
          <div className="min-w-0">
            <div className="text-sm sm:text-base font-extrabold text-[var(--color-text)] truncate">
              {isEn ? 'Family Store & Local Directory' : 'متجر الأسرة ودليل الخدمات'}
            </div>
            <div className="text-[11px] font-bold text-[var(--color-muted)] truncate">
              {country === 'SA' ? '🇸🇦 السعودية' : '🇪🇬 مصر'} · 📍 {city} · {currency}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-2xl border border-[var(--color-border)] bg-white/90 p-1">
            <button
              type="button"
              onClick={() => setCityScopeFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-colors ${
                cityScopeFilter === 'all'
                  ? 'bg-[var(--color-accent)] text-[var(--color-accent-contrast)]'
                  : 'text-[var(--color-muted)]'
              }`}
            >
              {isEn ? 'All Cities' : 'كل المدن'}
            </button>
            <button
              type="button"
              onClick={() => setCityScopeFilter('local')}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-colors ${
                cityScopeFilter === 'local'
                  ? 'bg-[var(--color-accent)] text-[var(--color-accent-contrast)]'
                  : 'text-[var(--color-muted)]'
              }`}
            >
              📍 {city}
            </button>
          </div>

          <PrimaryCtaButton
            variant="orange"
            size="sm"
            onClick={() => setShowCartPanel((s) => !s)}
          >
            <span>🛒</span>
            <span>
              {isEn ? `Shopping Cart (${cartTotalCount})` : `سلة التسوق (${cartTotalCount})`}
            </span>
          </PrimaryCtaButton>
        </div>
      </div>

      {/* Swipeable Image Carousel / Banners (matching Home Screen) */}
      <SwipeableBannerCarousel
        slides={storeBanners}
        language={language}
        ariaLabel={isEn ? 'Store Offers Carousel' : 'لافتات عروض المتجر المتحركة'}
      />

      {/* Interactive Shopping Cart & Simulated Checkout Drawer */}
      {showCartPanel && (
        <div
          id="shopping-cart-panel"
          className="rounded-[24px] border-2 border-orange-300 bg-[var(--color-surface)] p-5 space-y-4 shadow-md"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center">
                <ThreeDIcon id="cart" size={28} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[var(--color-text)]">
                  {isEn ? 'Shopping Cart & Fast Checkout' : 'سلة التسوق وإتمام الطلب السريع'}
                </h3>
                <span className="text-[11px] font-bold text-[var(--color-muted)]">
                  📍 {city} · {currency}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowCartPanel(false)}
              className="min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-extrabold border border-[var(--color-border)] bg-[var(--color-control-muted)]"
            >
              {isEn ? 'Close Cart' : 'إغلاق السلة'}
            </button>
          </div>

          {cartEnriched.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--color-border)] p-6 text-center text-xs font-bold text-[var(--color-muted)]">
              {isEn
                ? 'Your family cart is empty. Tap "+ Cart" on any item below.'
                : 'سلة التسوق فارغة حاليًا. اضغط على «+ للسلة» لإضافة المنتجات أو الخدمات.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-2.5">
                {cartEnriched.map((ci) => (
                  <div
                    key={ci.productId}
                    className="rounded-2xl border border-amber-200/70 bg-amber-50/50 p-3.5 flex flex-wrap items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-11 h-11 rounded-2xl bg-white shadow-2xs flex items-center justify-center text-2xl">
                        {ci.product.emoji}
                      </span>
                      <div>
                        <div className="text-sm font-extrabold text-[var(--color-text)]">
                          {isEn ? ci.product.nameEn : ci.product.name}
                        </div>
                        {ci.selectedVariant && (
                          <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-lg bg-white text-[var(--color-muted)]">
                            {ci.selectedVariant}
                          </span>
                        )}
                        <div className="text-xs font-bold text-orange-800 tabular-nums mt-0.5">
                          {formatCurrency(ci.unitPrice, currency, language)} × {ci.quantity} ={' '}
                          <strong>{formatCurrency(ci.lineTotal, currency, language)}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        aria-label="إنقاص الكمية"
                        onClick={() => onUpdateCartQuantity(ci.productId, -1)}
                        className="w-8 h-8 rounded-xl border border-[var(--color-border)] bg-white text-xs font-extrabold"
                      >
                        −
                      </button>
                      <span className="px-2 text-xs font-extrabold tabular-nums">{ci.quantity}</span>
                      <button
                        type="button"
                        aria-label="زيادة الكمية"
                        onClick={() => onUpdateCartQuantity(ci.productId, 1)}
                        className="w-8 h-8 rounded-xl border border-[var(--color-border)] bg-white text-xs font-extrabold"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => onRemoveFromCart(ci.productId)}
                        className="ms-1 px-2.5 py-1.5 rounded-xl text-xs font-bold text-red-700 bg-white border border-red-200"
                      >
                        {isEn ? 'Remove' : 'حذف'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Demo Shipping Address & Checkout Button */}
              <div className="rounded-2xl border border-orange-200/80 bg-orange-50/70 p-4 space-y-3">
                <div className="text-xs font-extrabold text-[var(--color-text)]">
                  📍 {isEn ? 'Delivery Address' : 'عنوان التوصيل للأسرة'}
                </div>
                <input
                  type="text"
                  value={shippingAddress.city}
                  onChange={(e) => onUpdateShippingAddress({ city: e.target.value })}
                  placeholder={isEn ? 'City' : 'المدينة'}
                  className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-xs font-semibold"
                />
                <input
                  type="text"
                  value={shippingAddress.streetDetails}
                  onChange={(e) => onUpdateShippingAddress({ streetDetails: e.target.value })}
                  placeholder={isEn ? 'Street / Building' : 'الحي / الشارع / المبنى'}
                  className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-xs font-semibold"
                />
                <div className="pt-2 border-t border-orange-200 flex items-center justify-between text-sm font-extrabold">
                  <span>{isEn ? 'Order Total:' : 'إجمالي السلة:'}</span>
                  <span className="tabular-nums text-orange-900">
                    {formatCurrency(cartTotalAmount, currency, language)}
                  </span>
                </div>
                <PrimaryCtaButton
                  variant="orange"
                  onClick={onCompleteDemoCheckout}
                  className="w-full"
                >
                  🚀 {isEn ? 'Confirm Simulated Order' : 'تأكيد الطلب التجريبي الآن'}
                </PrimaryCtaButton>
              </div>
            </div>
          )}

          {orders.length > 0 && (
            <div className="pt-3 border-t border-[var(--color-border)] space-y-2">
              <div className="text-xs font-extrabold text-emerald-900">
                ✅ {isEn ? `Confirmed Orders (${orders.length})` : `الطلبات المؤكدة (${orders.length})`}
              </div>
              {orders.slice(0, 2).map((ord) => (
                <div
                  key={ord.id}
                  className="rounded-2xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-950 flex flex-wrap items-center justify-between gap-2"
                >
                  <span className="font-bold">
                    #{ord.id} · {ord.items.map((i) => `${i.name} (×${i.quantity})`).join('، ')}
                  </span>
                  <span className="font-extrabold tabular-nums">
                    {formatCurrency(ord.totalAmount, ord.currency, language)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Search & Visual Category Filter Cards */}
      <div className="rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5 space-y-3.5 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex-1 min-w-[220px]">
            <label htmlFor="search" className="sr-only">
              بحث في المتجر والخدمات
            </label>
            <input
              id="search"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                isEn
                  ? '🔍 Search Montessori toys, cotton clothes, clinics, nurseries...'
                  : '🔍 ابحث عن لعبة مونتيسوري، ملابس قطنية، طبيب، أو حضانة...'
              }
              className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-4 py-2.5 text-xs sm:text-sm font-semibold text-[var(--color-text)]"
            />
          </div>

          <select
            aria-label={isEn ? 'Sort products' : 'ترتيب المنتجات'}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="min-h-[42px] rounded-2xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-3.5 py-2 text-xs font-extrabold text-[var(--color-text)]"
          >
            <option value="featured">{isEn ? 'Sort: Featured' : 'الترتيب: المختارات'}</option>
            <option value="price-asc">{isEn ? 'Price: Low to High' : 'السعر: الأقل أولًا'}</option>
            <option value="price-desc">{isEn ? 'Price: High to Low' : 'السعر: الأعلى أولًا'}</option>
            <option value="rating">{isEn ? 'Top Rated' : 'الأعلى تقييمًا'}</option>
          </select>

          <select
            id="commercialCategorySelect"
            aria-label={isEn ? 'Category' : 'الفئة'}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="min-h-[42px] rounded-2xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-3.5 py-2 text-xs font-extrabold text-[var(--color-text)]"
          >
            <option value="all">{isEn ? 'All Categories' : 'كل الفئات'}</option>
            <option value="toys">{isEn ? '🧸 Educational Toys' : '🧸 ألعاب تعليمية'}</option>
            <option value="clothing">{isEn ? '👕 Clothing' : '👕 ألبسة أطفال'}</option>
            <option value="essentials">{isEn ? '🍼 Daily Essentials' : '🍼 مستلزمات يومية'}</option>
            <option value="doctor">{isEn ? '🩺 Doctors & Clinics' : '🩺 أطباء وعيادات'}</option>
            <option value="nursery">{isEn ? '🏫 Nurseries' : '🏫 حضانات ومدارس'}</option>
            <option value="consultation">{isEn ? '💬 Consultations' : '💬 استشارات تربوية'}</option>
            <option value="delivery">{isEn ? '🚚 Delivery' : '🚚 خدمات التوصيل'}</option>
          </select>
        </div>

        {/* Segment Tabs + Collection Quick Chips */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div
            className="flex flex-wrap items-center gap-1.5 bg-[var(--color-control-muted)] p-1 rounded-2xl"
            role="tablist"
            aria-label="أقسام المتجر والخدمات"
          >
            {[
              { id: 'all', label: isEn ? 'All Items' : 'الكل' },
              { id: 'product', label: isEn ? '🛍️ Products' : '🛍️ المنتجات' },
              { id: 'service', label: isEn ? '🏫 Services & Clinics' : '🏫 الحضانات والعيادات' },
              { id: 'offer', label: isEn ? '🏷️ Offers' : '🏷️ العروض' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSegment(tab.id as typeof segment)}
                className={`px-3.5 py-1.5 text-xs font-extrabold rounded-xl transition-colors whitespace-nowrap shrink-0 ${
                  segment === tab.id
                    ? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-2xs'
                    : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: isEn ? 'All' : 'كل المجموعات' },
              { id: 'bestseller', label: isEn ? '🔥 Bestsellers' : '🔥 الأكثر طلبًا' },
              { id: 'new', label: isEn ? '✨ New' : '✨ جديد' },
              { id: 'deal', label: isEn ? '🏷️ Deals' : '🏷️ عروض توفير' },
            ].map((col) => (
              <button
                key={col.id}
                type="button"
                onClick={() => setCollectionFilter(col.id as typeof collectionFilter)}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border transition-colors ${
                  collectionFilter === col.id
                    ? 'border-orange-500 bg-orange-50 text-orange-900'
                    : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted)]'
                }`}
              >
                {col.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Super App Product & Service Grid Cards (Soft Pastel Tints + Less Text, More Visuals) */}
      {filtered.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-[var(--color-border)] p-8 text-center text-sm font-bold text-[var(--color-muted)]">
          {isEn
            ? 'No matching services or products found.'
            : 'لا توجد نتائج مطابقة للبحث. جرّب اختيار فئة أخرى.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => {
            const priceVal = currency === 'SAR' ? item.priceSAR : item.priceEGP;
            const origVal = currency === 'SAR' ? item.originalPriceSAR : item.originalPriceEGP;
            const displayTitle = isEn ? item.nameEn : item.name;
            const toneKey = CATEGORY_TONE_MAP[item.category] || 'amber';
            const tone = PASTEL_CARD_TONES[toneKey];

            return (
              <div
                key={item.id}
                className={`rounded-[24px] border ${tone.card} bg-[var(--color-surface)] p-4 flex flex-col justify-between gap-3.5 shadow-2xs hover:shadow-md transition-all`}
              >
                <div className="space-y-3">
                  {/* Top Visual Header: 3D Tactile Icon Box + Rating/Collection Tag */}
                  <div
                    onClick={() => onInspectCommercialItem(item)}
                    className="rounded-2xl p-4 cursor-pointer relative overflow-hidden flex items-center justify-between gap-3 border border-white/80 bg-white/85 shadow-2xs"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-[var(--color-accent-soft)]/60 flex items-center justify-center text-3xl shrink-0">
                      {item.emoji}
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      {item.collectionTag && (
                        <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold ${tone.badge}`}>
                          {item.collectionTag === 'bestseller'
                            ? isEn
                              ? '🔥 Bestseller'
                              : '🔥 الأكثر مبيعًا'
                            : item.collectionTag === 'new'
                            ? isEn
                              ? '✨ New'
                              : '✨ جديد'
                            : item.collectionTag === 'deal'
                            ? isEn
                              ? '🏷️ Value Deal'
                              : '🏷️ عرض توفير'
                            : isEn
                            ? '⭐ Recommended'
                            : '⭐ موصى به'}
                        </span>
                      )}
                      <span className="text-xs font-extrabold text-amber-800 tabular-nums">
                        🌟 {item.rating} ({item.reviewCount || 80})
                      </span>
                    </div>
                  </div>

                  {/* Title & Compact Visual Metadata Strip (No long paragraph) */}
                  <div className="space-y-1.5">
                    <h3 className="text-sm sm:text-base font-extrabold text-[var(--color-text)] leading-snug line-clamp-2">
                      {displayTitle}
                    </h3>

                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold text-[var(--color-muted)]">
                      <span>{item.categoryLabel}</span>
                      <span aria-hidden="true">·</span>
                      <span>📍 {item.city}</span>
                      {item.deliveryEstimateAr && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-emerald-800">
                            🚚 {isEn ? item.deliveryEstimateEn : item.deliveryEstimateAr}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Price + Standardized Super App Action Buttons */}
                <div className="pt-3 border-t border-[var(--color-border)]/70 space-y-2.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[11px] font-bold text-[var(--color-muted)]">
                      {item.kind === 'service'
                        ? isEn
                          ? 'Fee:'
                          : 'التكلفة:'
                        : isEn
                        ? 'Price:'
                        : 'السعر:'}
                    </span>
                    <div className="flex items-baseline gap-1.5 tabular-nums">
                      {origVal && (
                        <span className="text-xs line-through text-[var(--color-muted)]">
                          {formatCurrency(origVal, currency, language)}
                        </span>
                      )}
                      <strong className="text-base font-extrabold text-[var(--color-text)]">
                        {formatCurrency(priceVal, currency, language)}
                      </strong>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => onInspectCommercialItem(item)}
                      className="min-h-[40px] px-2 py-2 rounded-xl text-xs font-extrabold border border-[var(--color-border)] bg-white text-[var(--color-text)] whitespace-nowrap active:scale-95 transition-transform"
                    >
                      {isEn ? 'Details' : 'التفاصيل'}
                    </button>
                    <button
                      type="button"
                      onClick={() => onAddToCart(item, item.variants?.[0])}
                      className="min-h-[40px] px-2 py-2 rounded-xl text-xs font-extrabold bg-orange-600 hover:bg-orange-700 text-white shadow-2xs whitespace-nowrap active:scale-95 transition-transform"
                    >
                      {isEn ? '+ Cart' : '+ للسلة'}
                    </button>
                    <button
                      type="button"
                      onClick={() => onAddProductToWishes(item)}
                      className="min-h-[40px] px-2 py-2 rounded-xl text-xs font-extrabold border border-[var(--color-border)] bg-white/80 text-[var(--color-text)] whitespace-nowrap active:scale-95 transition-transform"
                    >
                      {isEn ? '+ Wish' : '+ أمنية'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Compact Visual Payment Badges Strip (Replaces verbose disclaimer paragraph) */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-[var(--color-muted)]">
        <span>
          🛡️ {isEn ? 'Localized Demo Catalog (EGP & SAR)' : 'كتالوج محلي تجريبي (ج.م EGP · ر.س SAR)'}
        </span>
        <span className="text-[var(--color-text)]">
          💳 Visa · Mastercard · مدى mada · Apple Pay
        </span>
      </div>
    </section>
  );
};

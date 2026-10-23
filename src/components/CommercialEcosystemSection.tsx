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
import { ThreeDIcon, ThreeDInteractiveScene } from './ThreeDVisuals';

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

  return (
    <div className="space-y-5">
      {/* Header & Cart Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-[var(--color-text)]">
            {language === 'en'
              ? '3D Family Store, Services Directory & Smart Shopping'
              : 'متجر الأسرة ثلاثي الأبعاد، دليل الخدمات، والتسوق الذكي'}
          </h2>
          <p className="text-sm text-[var(--color-muted)]">
            {language === 'en'
              ? 'Search-first commerce for child essentials, educational toys, pediatric clinics, and nurseries with cart & simulated checkout.'
              : 'تسوق سريع لمنتجات الطفل، الألعاب التعليمية، العيادات والحضانات مع سلة مشتريات ومحاكاة إتمام الطلب.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] p-1">
            <button
              type="button"
              onClick={() => setCityScopeFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                cityScopeFilter === 'all'
                  ? 'bg-[var(--color-accent)] text-[var(--color-accent-contrast)]'
                  : 'text-[var(--color-muted)]'
              }`}
            >
              {language === 'en' ? 'All Cities' : 'كل المدن'}
            </button>
            <button
              type="button"
              onClick={() => setCityScopeFilter('local')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                cityScopeFilter === 'local'
                  ? 'bg-[var(--color-accent)] text-[var(--color-accent-contrast)]'
                  : 'text-[var(--color-muted)]'
              }`}
            >
              📍 {language === 'en' ? `My City: ${city}` : `مدينتي: ${city}`}
            </button>
          </div>
          <div className="text-xs text-[var(--color-muted)] tabular-nums">
            {language === 'en'
              ? `${country === 'SA' ? 'Saudi Arabia' : 'Egypt'} · ${city} · ${currency}`
              : `${country === 'SA' ? 'السعودية' : 'مصر'} · ${city} · ${currency === 'SAR' ? 'ر.س SAR' : 'ج.م EGP'}`}
          </div>
          <button
            type="button"
            onClick={() => setShowCartPanel((s) => !s)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[var(--color-accent)] text-[var(--color-accent-contrast)] flex items-center gap-2 shadow-xs"
          >
            <span>🛒</span>
            <span>
              {language === 'en'
                ? `Shopping Cart (${cartTotalCount})`
                : `سلة التسوق (${cartTotalCount})`}
            </span>
          </button>
        </div>
      </div>

      {/* 3D Merchandising Podium Banner */}
      <ThreeDInteractiveScene
        variant="commerce-podium"
        title={
          language === 'en'
            ? '3D Family Commerce Showcase · Curated by Child Age (0–8 Years)'
            : 'منصة التسوق العائلي ثلاثية الأبعاد · مختارات حسب عمر طفلك (0–8 سنوات)'
        }
        subtitle={
          language === 'en'
            ? 'Montessori Toys · Organic Cotton · Daily Essentials · Verified Clinics & Nurseries'
            : 'ألعاب مونتيسوري · قطن عضوي · مستلزمات يومية · عيادات وحضانات موثوقة'
        }
      />

      {/* Interactive Shopping Cart & Simulated Checkout Drawer */}
      {showCartPanel && (
        <div
          id="shopping-cart-panel"
          className="rounded-[18px] border-2 border-[var(--color-accent)] bg-[var(--color-surface)] p-5 space-y-4 shadow-md"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ThreeDIcon id="cart" size={30} />
              <h3 className="text-base font-bold text-[var(--color-text)]">
                {language === 'en'
                  ? 'Shopping Cart & Simulated Family Checkout'
                  : 'سلة مشتريات الأسرة وإتمام الطلب التجريبي'}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setShowCartPanel(false)}
              className="px-3 py-1 rounded-lg text-xs font-semibold border border-[var(--color-border)]"
            >
              {language === 'en' ? 'Close Cart' : 'إغلاق السلة'}
            </button>
          </div>

          {cartEnriched.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--color-border)] p-6 text-center text-xs text-[var(--color-muted)]">
              {language === 'en'
                ? 'Your family cart is empty. Add products or service bookings from the catalog below.'
                : 'سلة التسوق فارغة حاليًا. أضف منتجات أو خدمات من الكتالوج بالأسفل.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Cart Items */}
              <div className="lg:col-span-2 divide-y divide-[var(--color-border)]">
                {cartEnriched.map((ci) => (
                  <div
                    key={ci.productId}
                    className="py-3 flex flex-wrap items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{ci.product.emoji}</span>
                      <div>
                        <div className="text-sm font-bold text-[var(--color-text)]">
                          {language === 'en' ? ci.product.nameEn : ci.product.name}
                        </div>
                        {ci.selectedVariant && (
                          <div className="text-[11px] text-[var(--color-muted)]">
                            {ci.selectedVariant}
                          </div>
                        )}
                        <div className="text-xs font-semibold text-[var(--color-role-text)] tabular-nums">
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
                        className="w-7 h-7 rounded-lg border border-[var(--color-border)] bg-[var(--color-control-bg)] text-xs font-bold"
                      >
                        −
                      </button>
                      <span className="px-2 text-xs font-bold tabular-nums">{ci.quantity}</span>
                      <button
                        type="button"
                        aria-label="زيادة الكمية"
                        onClick={() => onUpdateCartQuantity(ci.productId, 1)}
                        className="w-7 h-7 rounded-lg border border-[var(--color-border)] bg-[var(--color-control-bg)] text-xs font-bold"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => onRemoveFromCart(ci.productId)}
                        className="ms-2 px-2.5 py-1 rounded-lg text-xs font-semibold text-red-700 border border-[var(--color-border)]"
                      >
                        {language === 'en' ? 'Remove' : 'حذف'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Demo Shipping Address & Checkout Button */}
              <div className="rounded-2xl bg-[var(--color-control-muted)] p-4 space-y-3">
                <div className="text-xs font-bold text-[var(--color-text)]">
                  {language === 'en'
                    ? '📍 Demo Delivery Address'
                    : '📍 عنوان التوصيل للأسرة (نموذج تجريبي)'}
                </div>
                <input
                  type="text"
                  value={shippingAddress.city}
                  onChange={(e) => onUpdateShippingAddress({ city: e.target.value })}
                  placeholder={language === 'en' ? 'City' : 'المدينة'}
                  className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1.5 text-xs"
                />
                <input
                  type="text"
                  value={shippingAddress.streetDetails}
                  onChange={(e) => onUpdateShippingAddress({ streetDetails: e.target.value })}
                  placeholder={language === 'en' ? 'Street / Building' : 'تفاصيل العنوان'}
                  className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1.5 text-xs"
                />
                <div className="pt-2 border-t border-[var(--color-border)] flex items-center justify-between text-sm font-extrabold">
                  <span>{language === 'en' ? 'Order Total:' : 'إجمالي السلة:'}</span>
                  <span className="tabular-nums">
                    {formatCurrency(cartTotalAmount, currency, language)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onCompleteDemoCheckout}
                  className="w-full py-2.5 rounded-xl text-xs font-bold bg-[var(--color-accent)] text-[var(--color-accent-contrast)]"
                >
                  {language === 'en'
                    ? '🚀 Confirm Simulated Order (No Real Payment)'
                    : '🚀 تأكيد الطلب التجريبي (محاكاة بدون دفع فعلي)'}
                </button>
              </div>
            </div>
          )}

          {orders.length > 0 && (
            <div className="pt-3 border-t border-[var(--color-border)] space-y-2">
              <div className="text-xs font-bold text-emerald-900">
                {language === 'en'
                  ? `Recent Simulated Orders (${orders.length})`
                  : `سجل الطلبات التجريبية المؤكدة (${orders.length})`}
              </div>
              {orders.slice(0, 2).map((ord) => (
                <div
                  key={ord.id}
                  className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-950 flex flex-wrap items-center justify-between gap-2"
                >
                  <span>
                    <strong>#{ord.id}</strong> · {ord.items.map((i) => `${i.name} (×${i.quantity})`).join('، ')}
                  </span>
                  <span className="font-bold tabular-nums">
                    {formatCurrency(ord.totalAmount, ord.currency, language)} — تم التأكيد تجريبيًا
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Search-First & Collection Controls */}
      <div className="rounded-[18px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 space-y-3">
        {/* Search Input First */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex-1 min-w-[240px]">
            <label htmlFor="search" className="sr-only">
              بحث في المتجر والخدمات
            </label>
            <input
              id="search"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                language === 'en'
                  ? '🔍 Search Montessori toys, organic cotton, pediatricians, nurseries...'
                  : '🔍 ابحث بسرعة عن لعبة تعليمية، ملابس قطنية، طبيب أطفال، أو حضانة...'
              }
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-3.5 py-2 text-sm text-[var(--color-text)]"
            />
          </div>

          <select
            aria-label={language === 'en' ? 'Sort products' : 'ترتيب المنتجات'}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-3 py-2 text-xs font-semibold text-[var(--color-text)]"
          >
            <option value="featured">{language === 'en' ? 'Sort: Featured' : 'الترتيب: المختارات'}</option>
            <option value="price-asc">{language === 'en' ? 'Price: Low to High' : 'السعر: من الأقل للأعلى'}</option>
            <option value="price-desc">{language === 'en' ? 'Price: High to Low' : 'السعر: من الأعلى للأقل'}</option>
            <option value="rating">{language === 'en' ? 'Top Rated' : 'الأعلى تقييمًا'}</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Segment Tabs */}
          <div
            className="flex flex-wrap items-center gap-1.5 bg-[var(--color-control-muted)] p-1 rounded-xl"
            role="tablist"
            aria-label="أقسام المتجر والخدمات"
          >
            {[
              { id: 'all', label: language === 'en' ? 'All Ecosystem' : 'كل الأقسام' },
              { id: 'product', label: language === 'en' ? 'Store Products' : 'المتجر والمنتجات' },
              { id: 'service', label: language === 'en' ? 'Services Directory' : 'دليل الخدمات والأطباء' },
              { id: 'offer', label: language === 'en' ? 'Partner Offers' : 'عروض الشركاء' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSegment(tab.id as typeof segment)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                  segment === tab.id
                    ? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-xs'
                    : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Collection Quick Chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: language === 'en' ? 'All Collections' : 'كل المجموعات' },
              { id: 'bestseller', label: language === 'en' ? '🔥 Bestsellers' : '🔥 الأكثر طلبًا' },
              { id: 'new', label: language === 'en' ? '✨ New Arrivals' : '✨ وصل حديثًا' },
              { id: 'deal', label: language === 'en' ? '🏷️ Family Deals' : '🏷️ عروض التوفير' },
            ].map((col) => (
              <button
                key={col.id}
                type="button"
                onClick={() => setCollectionFilter(col.id as typeof collectionFilter)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                  collectionFilter === col.id
                    ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]'
                    : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted)]'
                }`}
              >
                {col.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="commercialCategorySelect" className="text-xs text-[var(--color-muted)] whitespace-nowrap">
              {language === 'en' ? 'Category:' : 'الفئة:'}
            </label>
            <select
              id="commercialCategorySelect"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-control-bg)] px-3 py-1.5 text-xs text-[var(--color-text)]"
            >
              <option value="all">{language === 'en' ? 'All Categories' : 'كل الفئات'}</option>
              <option value="toys">{language === 'en' ? 'Educational Toys' : 'ألعاب تعليمية'}</option>
              <option value="clothing">{language === 'en' ? 'Clothing' : 'ألبسة أطفال'}</option>
              <option value="essentials">{language === 'en' ? 'Daily Essentials' : 'مستلزمات يومية'}</option>
              <option value="doctor">{language === 'en' ? 'Doctors & Clinics' : 'أطباء ومراكز طبية'}</option>
              <option value="nursery">{language === 'en' ? 'Nurseries & Schools' : 'حضانات ومدارس'}</option>
              <option value="consultation">{language === 'en' ? 'Consultations' : 'استشارات تربوية ونفسية'}</option>
              <option value="delivery">{language === 'en' ? 'Delivery Services' : 'خدمات التوصيل'}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Catalog Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-[18px] border border-dashed border-[var(--color-border)] p-8 text-center text-sm text-[var(--color-muted)]">
          {language === 'en'
            ? 'No matching services or products found.'
            : 'لا توجد نتائج مطابقة للبحث. جرّب اختيار فئة أخرى.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => {
            const priceVal = currency === 'SAR' ? item.priceSAR : item.priceEGP;
            const origVal = currency === 'SAR' ? item.originalPriceSAR : item.originalPriceEGP;
            const displayTitle = language === 'en' ? item.nameEn : item.name;
            const displayDesc =
              language === 'en' && item.descriptionEn ? item.descriptionEn : item.description;
            return (
              <div
                key={item.id}
                className="rounded-[18px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 flex flex-col justify-between gap-3"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2 text-xs text-[var(--color-muted)]">
                    <span>
                      {item.categoryLabel} · {item.city}
                    </span>
                    {item.isSponsored ? (
                      <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded">
                        {language === 'en' ? 'Sponsored' : 'إعلان تجريبي'}
                      </span>
                    ) : (
                      <span className="tabular-nums font-semibold text-[var(--color-text)]">
                        🌟 {item.rating} ({item.reviewCount || 80})
                      </span>
                    )}
                  </div>

                  {/* 3D Tactile Product Showcase Card */}
                  <div
                    onClick={() => onInspectCommercialItem(item)}
                    className="rounded-2xl p-4 text-center text-4xl cursor-pointer relative overflow-hidden"
                    style={{
                      background:
                        'linear-gradient(135deg, var(--color-art-start), var(--color-art-end))',
                      boxShadow:
                        'inset 0 2px 4px rgba(255,255,255,0.85), 0 8px 16px -6px rgba(38, 28, 46, 0.12)',
                    }}
                  >
                    <span>{item.emoji}</span>
                    {item.collectionTag && (
                      <span className="absolute top-2 start-2 px-2 py-0.5 rounded-md bg-white/90 text-[10px] font-bold text-slate-800">
                        {item.collectionTag === 'bestseller'
                          ? language === 'en'
                            ? 'Bestseller'
                            : 'الأكثر مبيعًا'
                          : item.collectionTag === 'new'
                          ? language === 'en'
                            ? 'New 3D'
                            : 'جديد'
                          : item.collectionTag === 'deal'
                          ? language === 'en'
                            ? 'Value Deal'
                            : 'عرض توفير'
                          : language === 'en'
                          ? 'Recommended'
                          : 'موصى به'}
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-[var(--color-text)] leading-snug">
                    {displayTitle}
                  </h3>
                  <p className="text-xs text-[var(--color-muted)] leading-relaxed">{displayDesc}</p>
                  {item.deliveryEstimateAr && (
                    <div className="text-[11px] text-emerald-800 font-semibold">
                      🚚 {language === 'en' ? item.deliveryEstimateEn : item.deliveryEstimateAr}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-[var(--color-border)] space-y-2.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-xs text-[var(--color-muted)]">
                      {item.kind === 'service'
                        ? language === 'en'
                          ? 'Indicative Fee:'
                          : 'تكلفة استرشادية:'
                        : language === 'en'
                        ? 'Price:'
                        : 'السعر:'}
                    </span>
                    <div className="flex items-baseline gap-2 tabular-nums">
                      {origVal && (
                        <span className="text-xs line-through text-[var(--color-muted)]">
                          {formatCurrency(origVal, currency, language)}
                        </span>
                      )}
                      <strong className="text-base font-bold text-[var(--color-text)]">
                        {formatCurrency(priceVal, currency, language)}
                      </strong>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => onInspectCommercialItem(item)}
                      className="px-2 py-2 rounded-xl text-xs font-semibold border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] whitespace-nowrap"
                    >
                      {language === 'en' ? 'Details' : 'التفاصيل'}
                    </button>
                    <button
                      type="button"
                      onClick={() => onAddToCart(item, item.variants?.[0])}
                      className="px-2 py-2 rounded-xl text-xs font-bold bg-[var(--color-accent)] text-[var(--color-accent-contrast)] whitespace-nowrap"
                    >
                      {language === 'en' ? '+ Cart' : '+ للسلة'}
                    </button>
                    <button
                      type="button"
                      onClick={() => onAddProductToWishes(item)}
                      className="px-2 py-2 rounded-xl text-xs font-semibold border border-[var(--color-border)] bg-[var(--color-control-bg)] text-[var(--color-text)] whitespace-nowrap"
                    >
                      {language === 'en' ? '+ Wish' : '+ للأمنيات'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Payment & Regional Readiness Disclosure Card */}
      <div className="rounded-[18px] border border-[var(--color-border)] bg-[var(--color-notice)] text-[var(--color-notice-text)] p-4 text-xs space-y-1">
        <div className="font-bold">
          {language === 'en'
            ? 'Commercial Layer Transparency & Future Payment Integrations'
            : 'شفافية النظام التجاري وبوابات الدفع المستقبلية'}
        </div>
        <p>
          {language === 'en'
            ? 'All listings, medical clinics, nurseries, and partner offers above are illustrative prototype data. Production architecture supports localized catalogs for Egypt (EGP) and Saudi Arabia (SAR) with planned payment gateways (Visa, Mastercard, mada مدى, Apple Pay, stc pay) — no real payment is collected in this prototype.'
            : 'جميع العيادات والحضانات والمنتجات والعروض أعلاه بيانات استعراضية لتوضيح المنظومة التجارية. يدعم التصميم المعماري كتالوجات محلية لمصر (ج.م EGP) والسعودية (ر.س SAR) مع جاهزية الربط المستقبلي بوسائل الدفع (Visa · Mastercard · مدى mada · Apple Pay · stc pay) — لا يتم تحصيل أي مدفوعات حقيقية في هذا النموذج.'}
        </p>
      </div>
    </div>
  );
};

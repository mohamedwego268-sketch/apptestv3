import React, { useEffect, useState } from 'react';
import {
  COMMERCIAL_CATALOG,
  CartItem,
  CheckoutPaymentMethodType,
  CommercialCatalogItem,
  CountryCode,
  CurrencyCode,
  DemoOrder,
  DemoShippingAddress,
  LanguageCode,
  calculateCheckoutSummary,
  convertCatalogPrice,
  formatCurrency,
  getCountryMetadata,
  getEmptyStateCopy,
  getPaymentMethodLabels,
  locText,
} from '../domain/familySpaceCore';
import { ThreeDIcon } from './ThreeDVisuals';
import { SectionToolsDrawer } from './SectionToolsDrawer';
import {
  CARD_STOCK_PHOTO_URLS,
  getCardBackgroundSpec,
  getProductUnsplashImageUrl,
} from '../domain/cardBackgrounds';
import {
  BannerSlideItem,
  CollapsibleSectionCard,
  CompareArrowsIcon,
  FriendlyEmptyState,
  PASTEL_CARD_TONES,
  PastelTone,
  PrimaryCtaButton,
  SwipeableBannerCarousel,
} from './DesignSystem';
import { formatProductSequenceCode, useMaster } from '../services/MasterAppController';

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
  onCompleteDemoCheckout: (paymentMethod?: CheckoutPaymentMethodType) => void;
  onShowToast?: (msg: string) => void;
  darkMode?: boolean;
  initialCategoryId?: string | null;
  initialOpenCheckout?: boolean;
  allowDemoData?: boolean;
}

const CATEGORY_TONE_MAP: Record<string, PastelTone> = {
  toys: 'amber',
  nursery: 'indigo',
  doctor: 'emerald',
  clothing: 'rose',
  essentials: 'sky',
  courses: 'purple',
  sports: 'teal',
  events_park...[truncated]الرياض' : 'القاهرة',
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
  onShowToast = () => {},
  darkMode,
  initialCategoryId = null,
  initialOpenCheckout = false,
  allowDemoData = false,
}) => {
  const isEn = language === 'en';
  const displayCity = locText(city, language);
  const [segment, setSegment] = useState<'all' | 'product' | 'service' | 'offer'>('all');
  const [collectionFilter, setCollectionFilter] = useState<
    'all' | 'bestseller' | 'new' | 'deal' | 'recommended'
  >('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [cityScopeFilter, setCityScopeFilter] = useState<'all' | 'local'>('all');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'rating'>('featured');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCartPanel, setShowCartPanel] = useState(initialOpenCheckout);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [priceRangeFilter, setPriceRangeFilter] = useState<'all' | 'under300' | '300to800' | 'above800'>('all');
  const [minRatingFilter, setMinRatingFilter] = useState<number>(0);
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'express' | 'local' | 'offers'>('all');

  const activeFiltersCount =
    (priceRangeFilter !== 'all' ? 1 : 0) +
    (minRatingFilter > 0 ? 1 : 0) +
    (availabilityFilter !== 'all' ? 1 : 0) +
    (collectionFilter !== 'all' ? 1 : 0);

  const resetStoreFilters = () => {
    setPriceRangeFilter('all');
    setMinRatingFilter(0);
    setAvailabilityFilter('all');
    setCollectionFilter('all');
    setCityScopeFilter('all');
    setSegment('all');
    setCategoryFilter('all');
    setSearchQuery('');
  };

  // Store Flow View Mode: Catalog vs Dedicated Checkout (إتمام الطلب) vs Order Confirmed (تأكيد الطلب)
  co...[truncated]      titleEn: '🍼 Daily Baby Essentials',
      subtitleAr: 'عربيات أطفال، كراسي سيارة، ومنتجات عناية طبيعية',
      subtitleEn: 'Strollers, car seats & natural baby care bundles',
      badgeAr: '🍼 مستلزمات عائلية',
      badgeEn: '🍼 Family Essentials',
      emoji: '🍼',
      bgKey: 'essentials' as const,
      imageUrl: CARD_STOCK_PHOTO_URLS.essentials,
      matchCategories: ['essentials'],
    },
    {
      id: 'courses',
      titleAr: '🎨 كورسات أطفال وتنمية مهارات',
      titleEn: '🎨 Kids Skill Academies',
      subtitleAr: 'برمجة، روبوتيكس، رسم، وحساب ذهني تفاعلي',
      subtitleEn: 'Coding, robotics, art workshops & mental math',
      badgeAr: '🎨 كورسات أطفال',
      badgeEn: '🎨 Kids Courses',
      emoji: '🎨',
      bgKey: 'courses' as const,
      imageUrl: CARD_STOCK_PHOTO_URLS.courses,
      matchCategories: ['courses'],
    },
    {
      id: 'sports',
      titleAr: '⚽ ملاعب وأنشطة رياضية',
      titleEn: '⚽ Sports Academies',
      subtitleAr: 'سباحة، كرة قدم، جمباز، وكاراتيه للأبطال',
      subtitleEn: 'Swimming, football, gymnastics & karate academies',
      badgeAr: '⚽ ملاعب وأنشطة',
      badgeEn: '⚽ Sports & Play',
      emoji: '⚽',
      bgKey: 'sports' as const,
      imageUrl: CARD_STOCK_PHOTO_URLS.sports,
      matchCategories: ['sports'],
    },
    {
      id: 'events_parks',
      titleAr: '🎪 ملاهي وأعياد ميلاد وخروجات',
      titleEn: '🎪 Parks & Birthday Parties',
      subtitleAr: 'أماكن للعب وخيارات لتنظيم أعياد الميلاد',
      subtitleEn: 'Indoor play spaces and birthday packages',
      badgeAr: '🎪 ملاهي وأعياد ميلاد',
      badgeEn: '🎪 Parks & Birthdays',
      emoji: '🎪',
      bgKey: 'events_parks' as const,
      imageUrl: CARD_STOCK_PHOTO_URLS.events_parks,
      matchCategories: ['events_parks'],
    },
    {
      id: 'books',
      titleAr: '📖 قصص وكتب أطفال تفاعلية',
      titleEn: '📖 Interactive Storybooks',
      subtitleAr: 'قصص قبل النوم وموسوعات مصورة بالعربي والإنجليزي',
      subtitleEn: 'Bedtime st...[truncated]09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                  fill="currentColor"
                  fillOpacity="0.2"
                  stroke="currentColor"
                  strokeWidth="1.9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            {/* Minimalist Shopping Cart Icon (Teal #0d9488) */}
            <button
              type="button"
              onClick={() => onAddToCart(item, item.variants?.[0])}
              title={isEn ? 'Add to Cart' : 'أضف للسلة'}
              aria-label={isEn ? 'Add to Cart' : 'أضف للسلة'}
              className="min-w-10 min-h-10 rounded-xl bg-[#0d9488] hover:bg-[#0f766e] text-white flex items-center justify-center shadow-2xs active:scale-90 transition-all shrink-0 cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                <path
                  d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4H6z"
                  fill="currentColor"
                  fillOpacity="0.22"
                  stroke="currentColor"
                  strokeWidth="1.9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M3 6h18M16 10a4 4 0 01-8 0"
                  stroke="currentColor"
                  strokeWidth="1.9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  };

  const master = useMaster();
  const activeCatalogSource =
    master.catalogSource === 'remote'
      ? master.sequencedCatalog
      : allowDemoData
        ? COMMERCIAL_CATALOG
        : [];

  const filtered = activeCatalogSource.filter((item) => {
    if (segment !== 'all' && item.kind !== segment) return false;
    if (collectionFilter !== 'all' && item.collectionTag !== collectionFilter) return false;
    if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
    if (cityScopeFilter === 'local' && item.kind === 'service') {
      const matchesCountry = item.country === 'ALL' || item.country === country;
      const matchesCity = !item.city || item.city === city || item.city === 'ALL' || item.city === 'كل المدن' || item.city.includes(city);
      if (!matchesCountry || !matchesCity) return false;
    }
    const itemPrice = convertCatalogPrice(item.priceEGP, item.priceSAR, currency);
    if (priceRangeFilter === 'under300' && itemPrice >= 300) return false;
    if (priceRangeFilter === '300to800' && (itemPrice < 300 || itemPrice > 800)) return false;
    if (priceRangeFilter === 'above800' && itemPrice <= 800) return false;
    if (minRatingFilter > 0 && Number(item.rating) < minRatingFilter) return false;
    if (availabilityFilter === 'express' && item.kind !== 'product') return false;
    if (availabilityFilter === 'local') {
      const matchesCountry = item.country === 'ALL' || item.country === country;
      const matchesCity = !item.city || item.city === city || item.city === 'ALL' || item.city === 'كل المدن' || item.city.includes(city);
      if (!matchesCountry || !matchesCity) return false;
    }
    if (...[truncated]: showFilterPanel || activeFiltersCount > 0,
            onClick: () => setShowFilterPanel((prev) => !prev),
          },
          ...(allowDemoData ? [
            {
              id: 'compare-panel',
              icon: '⇄',
              labelAr: 'المقارنة',
              labelEn: 'Compare',
              badge: `${comparedItems.length}/3`,
              active: showComparePanel,
              closeOnSelect: true,
              onClick: () => {
                setStoreFlowStep('catalog');
                setShowCartPanel(false);
                setShowComparePanel((prev) => !prev);
              },
            },
            {
              id: 'live-tracking',
              icon: '🛵',
              labelAr: 'تتبع الطلب',
              labelEn: 'Tracking',
              active: showLiveTracking,
              closeOnSelect: true,
              onClick: () => {
                setStoreFlowStep('catalog');
                setShowCartPanel(false);
                setShowLiveTracking((prev) => (storeFlowStep !== 'catalog' ? true : !prev));
              },
            },
          ] : []),
        ]}
      >
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-control-muted)] p-2.5 space-y-3">
          {/* Market Context */}
          <div className="flex items-center justify-between gap-2 text-[11px] font-bold text-[var(--color-muted)] pb-2 border-b border-[var(--color-border)]">
            <span>
              {getCountryMetadata(country).flag}{' '}
              {isEn ? getCountryMetadata(country).nameEn : getCountryMetadata(country).nameAr} · {displayCity}
            </span>
            <span className="font-extrabold text-[var(--color-text)]">{currency}</span>
          </div>

          <div className="space-y-1.5">
            <p className="text-xs font-extrabold text-[var(--color-text)]">
              {isEn ? 'Browse scope' : 'نطاق التصفح'}
            </p>
            <div className="grid grid-cols-2 gap-1.5">
        ...[truncated]              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="w-full min-h-[36px] rounded-xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-surface)] dark:bg-[#142430] px-3 py-1.5 text-xs font-extrabold text-[var(--color-text)]"
            >
              <option value="featured">{isEn ? 'Sort: Featured' : 'الترتيب: المختارات'}</option>
              <option value="price-asc">{isEn ? 'Price: Low to High' : 'السعر: الأقل أولًا'}</option>
              <option value="price-desc">{isEn ? 'Price: High to Low' : 'السعر: الأعلى أولًا'}</option>
              <option value="rating">{isEn ? 'Top Rated' : 'الأعلى تقييمًا'}</option>
            </select>
          </div>

          {/* Store Category Navigation inside Section Tools */}
          <div className="space-y-1.5">
            <p className="text-xs font-extrabold text-[var(--color-text)]">
              {isEn ? 'Store Categories' : 'أقسام المتجر'}
            </p>
            <div className="flex flex-wrap gap-1.5" role="region" aria-label={isEn ? 'Store Category Navigation' : 'شريط أقسام المتجر'}>
              <button
                type="button"
                onClick={() => {
                  setActiveCategoryPageId(null);
                  setCategoryFilter('all');
                }}
                className={`min-h-[36px] px-3 py-1.5 rounded-xl text-[11px] font-extrabold border transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeCategoryPageId === null
                    ? 'bg-[#0d9488] text-white border-teal-500 shadow-sm'
                    : 'bg-[var(--color-surface)] dark:bg-[#142430] text-[var(--color-text)] border-[var(--color-border)] dark:border-[#1E3646]'
                }`}
              >
                <span>✨</span>
                <span>{isEn ? 'All Category Rows' : 'جميع الأقسام'}</span>
              </button>

              {STORE_CATEGORY_SECTIONS.map((sec) => {...[truncated]? 'Smart Store Filters' : 'فلترة المتجر الذكية'}
              </span>
              <button
                type="button"
                onClick={resetStoreFilters}
                className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-muted)] dark:bg-[#142430] text-[var(--color-text)] hover:border-[#FF8C61]"
              >
                {isEn ? 'Reset All' : 'إعادة ضبط'}
              </button>
            </div>

            {/* 1. Price Filter */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-extrabold text-[var(--color-text)] dark:text-[#A5F3FC]">
                💰 {isEn ? `Price Range (${currency})` : `نطاق السعر (${currency})`}
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'all', labelAr: 'كل الأسعار', labelEn: 'All Prices' },
                  { id: 'under300', labelAr: 'أقل من ٣٠٠', labelEn: 'Under 300' },
                  { id: '300to800', labelAr: '٣٠٠ إلى ٨٠٠', labelEn: '300 – 800' },
                  { id: 'above800', labelAr: 'أكثر من ٨٠٠', labelEn: 'Above 800' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setPriceRangeFilter(opt.id as typeof priceRangeFilter)}
                    className={`px-2 py-1.5 rounded-lg text-[11px] font-extrabold border transition-all ${
                      priceRangeFilter === opt.id
                        ? 'bg-[#0d9488] text-white border-teal-500 shadow-2xs'
                        : 'bg-[var(--color-surface)] dark:bg-[#101D26] text-[var(--color-text)] dark:text-[#F8FAFC] border-[var(--color-border)] dark:border-[#1E3646]'
                    }`}
                  >
                    {isEn ? opt.labelEn : opt.labelAr}
                  </button>
                ))}
              </div>
     ...[truncated]                  <linearGradient id="mapBgGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#0B131A" />
                    <stop offset="100%" stopColor="#142430" />
                  </linearGradient>
                </defs>
                <rect width="400" height="165" rx="12" fill="url(#mapBgGrad)" />

                <g stroke="#334155" strokeWidth="10" strokeLinecap="round" fill="none" opacity="0.7">
                  <path d="M 20 135 L 150 135 L 220 85 L 375 85" />
                  <path d="M 55 25 L 55 150" />
                  <path d="M 185 20 L 185 150" />
                  <path d="M 310 20 L 310 150" />
                  <path d="M 30 55 L 365 55" />
                </g>

                <path
                  d="M 68 128 C 120 128, 130 95, 195 88 C 250 82, 285 58, 332 54"
                  stroke="#64748b"
                  strokeWidth="4"
                  strokeDasharray="6 6"
                  fill="none"
                />

                <path
                  d="M 68 128 C 120 128, 130 95, 195 88 C 250 82, 285 58, 332 54"
                  stroke="#10b981"
                  strokeWidth="5"
                  strokeLinecap="round"
                  fill="none"
                  strokeDasharray="320"
                  strokeDashoffset={Math.round(320 * (1 - activeStage.progressPct / 100))}
                />

                <g transform="translate(68, 128)">
                  <circle r="13" fill="#f97316" />
                  <circle r="6" fill="#ffffff" />
                </g>
                <text x="42" y="152" fill="#fed7aa" fontSize="10" fontWeight="bold">
                  {isEn ? 'Store' : 'المتجر'}
                </text>

                <g transform="translate(332, 54)">
                  <circle r="15" fill="#10b981" opacity="0.3" />
                  <circle r="10" fill="#10b981" />
                  <circle r="4.5" fill="#ffffff" />
                </g>
                <text x="305" y="34" fill=...[truncated]                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-emerald-200 dark:border-[#1E3646] bg-white dark:bg-[#142430] p-4 flex flex-col justify-between gap-3 shadow-2xs">
                  <div className="space-y-2.5">
                    <h5 className="text-xs sm:text-sm font-extrabold text-[var(--color-text)]">
                      🛍️ {isEn ? 'Ordered Family Items' : 'المنتجات والخدمات المشمولة في الطلب'}
                    </h5>
                    <div className="space-y-2 max-h-44 overflow-y-auto pe-1">
                      {(latestOrder?.items && latestOrder.items.length > 0
                        ? latestOrder.items
                        : cartEnriched.map((ci) => ({
                            productId: ci.productId,
                            name: isEn ? ci.product.nameEn : ci.product.name,
                            quantity: ci.quantity,
                            unitPrice: ci.unitPrice,
                            variant: ci.selectedVariant,
                          }))
                      ).map((item, idx) => (
                        <div
                          key={`${item.productId}-${idx}`}
                          className="rounded-xl bg-emerald-50/70 dark:bg-[#101D26] border border-emerald-100 dark:border-[#1E3646] px-3 py-2 flex items-center justify-between gap-2 text-xs"
                        >
                          <div>
                            <div className="font-extrabold text-[var(--color-text)]">
                              {item.name} <span className="text-emerald-800 dark:text-[#2DD4BF]">(×{item.quantity})</span>
                            </div>
                            {item.variant && (
                              <div className="text-[10px] font-bold text-[var(--color-muted)]">
                                {item.variant}
                              </div>
  ...[truncated]ty(ci.productId, 1)}
                              className="w-7 h-7 rounded-lg border border-[var(--color-border)] dark:border-[#1E3646] bg-amber-50 dark:bg-[#142430] text-xs font-extrabold text-[var(--color-text)]"
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Delivery Recipient & Shipping Details */}
                <div className="rounded-2xl border border-sky-200/80 dark:border-[#1E3646] bg-sky-50/55 dark:bg-[#142430] p-3.5 space-y-2.5">
                  <div className="text-xs sm:text-sm font-extrabold text-[var(--color-text)]">
                    🚚 {isEn ? '2. Delivery Recipient & Address' : '٢. بيانات المستلم وعنوان التوصيل'}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label htmlFor="checkoutRecipientName" className="block text-[10px] font-extrabold text-[var(--color-muted)] mb-0.5">
                        {isEn ? 'Recipient Name' : 'اسم المستلم'}
                      </label>
                      <input
                        id="checkoutRecipientName"
                        type="text"
                        value={shippingAddress.recipientName}
                        onChange={(e) => onUpdateShippingAddress({ recipientName: e.target.value })}
                        className="w-full rounded-xl border border-[var(--color-border)] dark:border-[#1E3646] bg-white dark:bg-[#101D26] px-2.5 py-1.5 text-xs font-semibold text-[var(--color-text)]"
                      />
                    </div>
                    <div>
                      <label htmlFor="checkoutPhoneInput" className="block text-[10px] font-extrabold text-[var(--color-muted)] mb-0.5">
                        {isEn ? 'Contact Mobile' : 'رقم جوال ا...[truncated]                        <span dir="ltr" className="text-[10px] font-extrabold text-emerald-800 dark:text-[#A5F3FC] bg-emerald-50 dark:bg-[#142430] px-2 py-0.5 rounded-md">
                          VISA · Mastercard · mada
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label htmlFor="mockCardHolder" className="block text-[10px] font-extrabold text-[var(--color-muted)] mb-0.5">
                            {isEn ? 'Cardholder Name' : 'اسم حامل البطاقة'}
                          </label>
                          <input
                            id="mockCardHolder"
                            type="text"
                            dir="ltr"
                            value={testCardHolder}
                            onChange={(e) => {
                              setPaymentMethod('electronic_card');
                              setTestCardHolder(e.target.value);
                            }}
                            placeholder="AHMED & SARA"
                            className="w-full rounded-xl border border-[var(--color-border)] dark:border-[#1E3646] bg-slate-50 dark:bg-[#142430] px-2.5 py-1.5 text-xs font-bold text-[var(--color-text)]"
                          />
                        </div>

                        <div>
                          <label htmlFor="mockCardNumber" className="block text-[10px] font-extrabold text-[var(--color-muted)] mb-0.5">
                            {isEn ? 'Card Number' : 'رقم البطاقة البنكية'}
                          </label>
                          <input
                            id="mockCardNumber"
                            type="text"
                            dir="ltr"
                            value={testCardNumber}
                            onChange={(e) => {
                              setPaymentMethod('electronic_card');
                   ...[truncated]           ? isEn
                      ? '⏳ Processing Order...'
                      : '⏳ جاري تأكيد الطلب...'
                    : paymentCategory === 'cod'
                    ? isEn
                      ? '✅ Confirm Order (Cash on Delivery)'
                      : '✅ تأكيد الطلب (الدفع عند الاستلام)'
                    : isEn
                    ? `🚀 Pay Now & Confirm Order (${getPaymentMethodLabels(paymentMethod).badgeIcon})`
                    : `🚀 تأكيد الدفع الإلكتروني وإتمام الطلب (${getPaymentMethodLabels(paymentMethod).badgeIcon})`}
                </PrimaryCtaButton>
              </div>
            </div>
          )}
        </div>
      )}



      {/* =====================================================================
          SMART PRODUCT COMPARISON MATRIX (Side-by-Side Specs, Price & Rating)
          ===================================================================== */}
      {storeFlowStep === 'catalog' && showComparePanel && (
        <div
          id="store-smart-comparison-panel"
          className="rounded-2xl sm:rounded-3xl border border-[#0d9488]/40 dark:border-[#1E3646] bg-[var(--color-surface)] dark:bg-[#101D26] p-3.5 sm:p-4 space-y-3 soft-card-surface shadow-md animate-page-enter"
        >
          <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2.5 border-b border-[var(--color-border)] dark:border-[#1E3646]">
            <div className="flex items-center gap-2">
              <span className="w-9 h-9 rounded-xl bg-[#0d9488]/15 dark:bg-[#142430] border border-[#0d9488]/30 text-[#0d9488] dark:text-[#2DD4BF] flex items-center justify-center shrink-0">
                <CompareArrowsIcon size={18} />
              </span>
              <div>
                <h3 className="text-xs sm:text-sm font-black text-[var(--color-text)] dark:text-[#F8FAFC]">
                  {isEn
                    ? `Smart Product Comparison (${comparedItems.length}/3 Selected)`
                    : `جدول المقارنة الذكية ...[truncated]                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(to top, rgba(11, 19, 26, 0.85) 0%, rgba(11, 19, 26, 0.25) 100%)',
                  }}
                />
                <span className="relative z-10 text-xl drop-shadow">{activeCategorySpec.emoji}</span>
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#142430] text-[#A5F3FC] border border-[#1E3646]">
                    {isEn ? activeCategorySpec.badgeEn : activeCategorySpec.badgeAr}
                  </span>
                  <span className="text-[11px] font-bold text-[var(--color-muted)]">
                    📍 {displayCity}
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-extrabold text-[var(--color-text)] mt-0.5">
                  {isEn ? activeCategorySpec.titleEn : activeCategorySpec.titleAr}
                </h2>
                <p className="text-xs font-semibold text-[var(--color-muted)]">
                  {isEn ? activeCategorySpec.subtitleEn : activeCategorySpec.subtitleAr}
                </p>
              </div>
            </div>

            <button
              type="button"
              data-testid="back-to-store-categories-btn"
              onClick={() => setActiveCategoryPageId(null)}
              className="min-h-[40px] px-4 py-2 rounded-2xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-muted)] dark:bg-[#142430] hover:border-[#FF8C61] text-[var(--color-text)] text-xs font-extrabold flex items-center gap-2 shrink-0 active:scale-95 transition-all"
            >
              <span>{isEn ? '←' : '→'}</span>
              <span>{isEn ? 'Back to All Categories' : 'العودة لجميع أ...[truncated]
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
  onShowToast?: (msg: string) => void;
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

type DeliveryStageIndex = 0 | 1 | 2 | 3;

interface DeliveryTimelineStage {
  index: DeliveryStageIndex;
  id: 'received' | 'preparing' | 'out_for_delivery' | 'delivered';
  titleAr: string;
  titleEn: string;
  subtitleAr: string;
  subtitleEn: string;
  etaMinutes: number;
  icon: string;
  progressPct: number;
  courierCoords: { x: number; y: number };
}

const DELIVERY_TIMELINE_STAGES: DeliveryTimelineStage[] = [
  {
    index: 0,
    id: 'received',
    titleAr: 'تم استلام الطلب',
    titleEn: 'Order Received',
    subtitleAr: 'تم تأكيد الدفع التجريبي وإرسال الطلب للمتجر',
    subtitleEn: 'Test payment verified & sent to merchant',
    etaMinutes: 28,
    icon: '📋',
    progressPct: 18,
    courierCoords: { x: 68, y: 128 },
  },
  {
    index: 1,
    id: 'preparing',
    titleAr: 'جاري التحضير والتغليف',
    titleEn: 'Preparing Order',
    subtitleAr: 'يتم تجهيز منتجات طفلك وتغليفها بعناية',
    subtitleEn: 'Packing your family items with care',
    etaMinutes: 19,
    icon: '📦',
    progressPct: 48,
    courierCoords: { x: 142, y: 102 },
  },
  {
    index: 2,
    id: 'out_for_delivery',
    titleAr: 'المندوب في الطريق إليك',
    titleEn: 'Out for Delivery',
    subtitleAr: 'كابتن طارق في طريقه لعنوان الأسرة الآن',
    subtitleEn: 'Courier Tarek is on the route to your home',
    etaMinutes: 9,
    icon: '🛵',
    progressPct: 78,
    courierCoords: { x: 248, y: 74 },
  },
  {
    index: 3,
    id: 'delivered',
    titleAr: 'تم التوصيل بنجاح',
    titleEn: 'Delivered',
    subtitleAr: 'وصل الطلب لباب المنزل — نتمنى لطفلك أوقاتًا سعيدة!',
    subtitleEn: 'Delivered to your doorstep — enjoy!',
    etaMinutes: 0,
    icon: '🎉',
    progressPct: 100,
    courierCoords: { x: 332, y: 54 },
  },
];

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
  onShowToast = () => {},
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

  // Payment Gateway & Live Tracking State (Talabat / UberEats Style)
  const [paymentMethod, setPaymentMethod] = useState<'apple_pay' | 'card' | 'wallet' | 'cod'>('card');
  const [testCardNumber, setTestCardNumber] = useState('4242 •••• •••• 4242');
  const [testCardExpiry, setTestCardExpiry] = useState('09/28');
  const [testCardCvv, setTestCardCvv] = useState('888');
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [showLiveTracking, setShowLiveTracking] = useState(true);
  const [trackingStageIdx, setTrackingStageIdx] = useState<DeliveryStageIndex>(2);
  const [driverInstructionNote, setDriverInstructionNote] = useState(
    isEn ? 'Leave at door / Don’t ring bell (baby sleeping)' : 'يرجى الاتصال عند الوصول وعدم رن الجرس (الطفل نائم)'
  );

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
  const deliveryFee = currency === 'SAR' ? 15 : 45;

  const activeStage = DELIVERY_TIMELINE_STAGES[trackingStageIdx] || DELIVERY_TIMELINE_STAGES[2];
  const latestOrder = orders[0];

  const handleProcessTestPayment = () => {
    setPaymentProcessing(true);
    window.setTimeout(() => {
      setPaymentProcessing(false);
      onCompleteDemoCheckout();
      setShowCartPanel(false);
      setShowLiveTracking(true);
      setTrackingStageIdx(0);
      onShowToast(
        isEn
          ? '✓ Test Payment Approved! Live Order Tracking started.'
          : '✓ تمت عملية الدفع التجريبي بنجاح! بدأ تتبع الطلب المباشر.'
      );
    }, 350);
  };

  const storeBanners: BannerSlideItem[] = [
    {
      id: 'store-slide-deals',
      badge: isEn ? '🛍️ Family Super Deals' : '🛍️ عروض متجر الأسرة',
      title: isEn
        ? `Montessori Toys & Organic Baby Essentials (${currency})`
        : `ألعاب مونتيسوري ومستلزمات الطفل العضوية (${currency})`,
      subtitle: isEn
        ? `Fast Delivery in ${city} · Live Courier Tracking`
        : `توصيل فوري في ${city} · تتبع المندوب مباشرة على الخريطة`,
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
      id: 'store-slide-tracking',
      badge: isEn ? '🛵 Live Talabat-Style Tracking' : '🛵 تتبع الطلبات المباشر',
      title: isEn
        ? 'Real-Time Order Timeline & Live Driver Route Map'
        : 'تتبع لحظي لحالة طلبك ومسار المندوب حتى باب المنزل',
      subtitle: isEn
        ? 'Order Received → Preparing → Out for Delivery'
        : 'تم الاستلام ← جاري التحضير ← في الطريق إليك',
      ctaLabel: isEn ? 'Open Live Order Tracker' : 'افتح خريطة تتبع الطلب',
      onCtaClick: () => setShowLiveTracking(true),
      iconId: 'cart',
      gradient: 'linear-gradient(125deg, #ecfdf5, #d1fae5, #e0f2fe)',
      ctaVariant: 'emerald',
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
  ];

  return (
    <section className="space-y-4" aria-label={isEn ? 'Family Store & Services' : 'المتجر والخدمات'}>
      {/* Top Action Strip: City Filter + Live Order Tracking + Cart Button */}
      <div className="rounded-2xl border border-amber-200/80 bg-amber-50/80 px-3.5 py-2.5 shadow-2xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-2xl bg-white shadow-2xs flex items-center justify-center shrink-0">
            <ThreeDIcon id="services" size={24} />
          </div>
          <div className="min-w-0">
            <div className="text-xs sm:text-sm font-extrabold text-[var(--color-text)] truncate">
              {isEn ? 'Family Store & Express Delivery' : 'متجر الأسرة والتوصيل الفوري'}
            </div>
            <div className="text-[11px] font-bold text-[var(--color-muted)] truncate">
              {country === 'SA' ? '🇸🇦 السعودية' : '🇪🇬 مصر'} · 📍 {city} · {currency}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <div className="flex items-center gap-1 rounded-xl border border-[var(--color-border)] bg-white/90 p-0.5">
            <button
              type="button"
              onClick={() => setCityScopeFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition-colors ${
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
              className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition-colors ${
                cityScopeFilter === 'local'
                  ? 'bg-[var(--color-accent)] text-[var(--color-accent-contrast)]'
                  : 'text-[var(--color-muted)]'
              }`}
            >
              📍 {city}
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowLiveTracking((prev) => !prev)}
            className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-extrabold border transition-all flex items-center gap-1.5 ${
              showLiveTracking
                ? 'border-emerald-600 bg-emerald-600 text-white shadow-2xs'
                : 'border-emerald-300 bg-emerald-50 text-emerald-950 hover:bg-emerald-100'
            }`}
          >
            <span>🛵</span>
            <span>{isEn ? 'Live Order Tracking' : 'تتبع الطلب المباشر'}</span>
          </button>

          <PrimaryCtaButton
            variant="orange"
            size="sm"
            onClick={() => setShowCartPanel((s) => !s)}
          >
            <span>🛒</span>
            <span>
              {isEn ? `Checkout (${cartTotalCount})` : `السلة والدفع (${cartTotalCount})`}
            </span>
          </PrimaryCtaButton>
        </div>
      </div>

      {/* Swipeable Image Carousel / Banners */}
      <SwipeableBannerCarousel
        slides={storeBanners}
        language={language}
        ariaLabel={isEn ? 'Store Offers Carousel' : 'لافتات عروض المتجر المتحركة'}
      />

      {/* =====================================================================
          TALABAT / UBER-EATS STYLE LIVE ORDER TRACKING & ROUTE MAP
          ===================================================================== */}
      {showLiveTracking && (
        <div
          id="talabat-live-order-tracker"
          className="rounded-[22px] border-2 border-emerald-300/90 bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/70 p-4 sm:p-5 space-y-4 shadow-sm"
          aria-label={isEn ? 'Live Order Tracking' : 'تتبع الطلب المباشر على الخريطة'}
        >
          {/* Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center text-xl shadow-2xs shrink-0">
                🛵
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 text-[10px] font-extrabold">
                    {isEn ? 'LIVE GPS TRACKING' : 'تتبع مباشر · Talabat Style'}
                  </span>
                  <span className="text-[11px] font-extrabold text-[var(--color-muted)] tabular-nums">
                    #{latestOrder ? latestOrder.id : 'FS-9042'}
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-extrabold text-[var(--color-text)]">
                  {isEn ? activeStage.titleEn : activeStage.titleAr}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="rounded-xl bg-emerald-950 text-white px-3 py-1.5 text-center shadow-2xs">
                <div className="text-[9px] font-bold text-emerald-200 uppercase">
                  {isEn ? 'Estimated Arrival' : 'وقت الوصول المتوقع'}
                </div>
                <div className="text-xs sm:text-sm font-extrabold tabular-nums">
                  {activeStage.etaMinutes === 0
                    ? isEn
                      ? 'Arrived ✓'
                      : 'وصل الطلب ✓'
                    : isEn
                    ? `${activeStage.etaMinutes} mins`
                    : `${activeStage.etaMinutes} دقيقة`}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowLiveTracking(false)}
                className="min-h-[34px] px-2.5 py-1 rounded-xl text-[11px] font-extrabold border border-[var(--color-border)] bg-white text-[var(--color-muted)]"
              >
                {isEn ? 'Hide' : 'إخفاء'}
              </button>
            </div>
          </div>

          {/* Status Timeline Stepper (Order Received -> Preparing -> Out for Delivery -> Delivered) */}
          <div className="space-y-2">
            <div className="w-full h-2 rounded-full bg-emerald-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 transition-all duration-300"
                style={{ width: `${activeStage.progressPct}%` }}
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {DELIVERY_TIMELINE_STAGES.map((stage) => {
                const isDone = stage.index <= trackingStageIdx;
                const isCurrent = stage.index === trackingStageIdx;
                return (
                  <button
                    key={stage.id}
                    type="button"
                    onClick={() => setTrackingStageIdx(stage.index)}
                    className={`rounded-xl border p-2.5 text-start transition-all cursor-pointer flex items-center gap-2 ${
                      isCurrent
                        ? 'border-emerald-600 bg-emerald-50/95 ring-2 ring-emerald-500/20 shadow-2xs'
                        : isDone
                        ? 'border-emerald-200 bg-white text-emerald-950'
                        : 'border-[var(--color-border)] bg-white/60 text-[var(--color-muted)]'
                    }`}
                  >
                    <span className="w-8 h-8 rounded-lg bg-white border border-emerald-100 flex items-center justify-center text-base shrink-0 shadow-2xs">
                      {stage.icon}
                    </span>
                    <div className="min-w-0">
                      <div className="text-[11px] font-extrabold text-[var(--color-text)] truncate">
                        {isEn ? stage.titleEn : stage.titleAr}
                      </div>
                      <div className="text-[10px] font-bold text-emerald-700">
                        {isCurrent
                          ? isEn
                            ? '● Active Now'
                            : '● المرحلة الحالية'
                          : isDone
                          ? isEn
                            ? '✓ Completed'
                            : '✓ مكتمل'
                          : isEn
                          ? 'Upcoming'
                          : 'قادم'}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interactive Live Map & Courier Card Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-[1.45fr_1fr] gap-3.5 items-stretch">
            {/* Mock Live GPS Route Map */}
            <div className="rounded-2xl border border-emerald-200 bg-slate-900 text-white p-3 relative overflow-hidden min-h-[195px] flex flex-col justify-between">
              <div className="flex items-center justify-between gap-2 z-10 text-[11px] font-bold">
                <span className="px-2.5 py-1 rounded-lg bg-black/50 backdrop-blur-xs text-emerald-300">
                  🛰️ {isEn ? `Live Route · ${city}` : `خريطة التوصيل المباشرة · ${city}`}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-black/50 backdrop-blur-xs text-white tabular-nums">
                  📍 {shippingAddress.streetDetails || (isEn ? 'Family Home' : 'منزل الأسرة')}
                </span>
              </div>

              {/* SVG Street Grid + Route + Moving Courier Marker */}
              <svg
                viewBox="0 0 400 165"
                className="w-full h-36 my-1 rounded-xl"
                role="img"
                aria-label={isEn ? 'Live Delivery Route Map' : 'خريطة مسار المندوب المباشرة'}
              >
                <defs>
                  <linearGradient id="mapBgGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#0f172a" />
                    <stop offset="100%" stopColor="#1e293b" />
                  </linearGradient>
                </defs>
                <rect width="400" height="165" rx="12" fill="url(#mapBgGrad)" />

                {/* City Blocks & Roads */}
                <g stroke="#334155" strokeWidth="10" strokeLinecap="round" fill="none" opacity="0.7">
                  <path d="M 20 135 L 150 135 L 220 85 L 375 85" />
                  <path d="M 55 25 L 55 150" />
                  <path d="M 185 20 L 185 150" />
                  <path d="M 310 20 L 310 150" />
                  <path d="M 30 55 L 365 55" />
                </g>

                {/* Planned Route Line (Dashed) */}
                <path
                  d="M 68 128 C 120 128, 130 95, 195 88 C 250 82, 285 58, 332 54"
                  stroke="#64748b"
                  strokeWidth="4"
                  strokeDasharray="6 6"
                  fill="none"
                />

                {/* Active Route Line */}
                <path
                  d="M 68 128 C 120 128, 130 95, 195 88 C 250 82, 285 58, 332 54"
                  stroke="#10b981"
                  strokeWidth="5"
                  strokeLinecap="round"
                  fill="none"
                  strokeDasharray="320"
                  strokeDashoffset={Math.round(320 * (1 - activeStage.progressPct / 100))}
                />

                {/* Store Pin (Origin) */}
                <g transform="translate(68, 128)">
                  <circle r="13" fill="#f97316" />
                  <circle r="6" fill="#ffffff" />
                </g>
                <text x="42" y="152" fill="#fed7aa" fontSize="10" fontWeight="bold">
                  {isEn ? 'Store' : 'المتجر'}
                </text>

                {/* Home Pin (Destination) */}
                <g transform="translate(332, 54)">
                  <circle r="15" fill="#10b981" opacity="0.3" />
                  <circle r="10" fill="#10b981" />
                  <circle r="4.5" fill="#ffffff" />
                </g>
                <text x="305" y="34" fill="#a7f3d0" fontSize="10" fontWeight="bold">
                  {isEn ? 'Home' : 'المنزل'}
                </text>

                {/* Moving Courier Pin */}
                <g
                  transform={`translate(${activeStage.courierCoords.x}, ${activeStage.courierCoords.y})`}
                >
                  <circle r="18" fill="#38bdf8" opacity="0.25" />
                  <circle r="13" fill="#ffffff" stroke="#0284c7" strokeWidth="3" />
                  <text x="-7" y="5" fontSize="13">
                    🛵
                  </text>
                </g>
              </svg>

              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-300 z-10">
                <span>{isEn ? activeStage.subtitleEn : activeStage.subtitleAr}</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      setTrackingStageIdx(
                        (prev) => ((prev + 1) % 4) as DeliveryStageIndex
                      )
                    }
                    className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-[11px] cursor-pointer"
                  >
                    {isEn ? '▶ Simulate Next Step' : '▶ محاكاة الخطوة التالية'}
                  </button>
                </div>
              </div>
            </div>

            {/* Driver Contact & Delivery Instructions Card */}
            <div className="rounded-2xl border border-emerald-200/90 bg-white p-3.5 flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-2xl shrink-0">
                    👷🏻‍♂️
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-extrabold text-[var(--color-text)]">
                      {isEn ? 'Capt. Tarek Al-Harbi' : 'كابتن طارق الحربي'}
                    </div>
                    <div className="text-[11px] font-bold text-emerald-800">
                      ⭐ 4.95 · {isEn ? 'Verified Family Courier' : 'مندوب توصيل طلبات الأسرة'}
                    </div>
                  </div>
                </div>
                <span className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-900 text-[10px] font-extrabold tabular-nums">
                  🛵 4821-أ ب
                </span>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="driverNoteInput"
                  className="block text-[11px] font-extrabold text-[var(--color-muted)]"
                >
                  📝 {isEn ? 'Delivery Note for Courier:' : 'تعليمات التوصيل للمندوب:'}
                </label>
                <input
                  id="driverNoteInput"
                  type="text"
                  value={driverInstructionNote}
                  onChange={(e) => setDriverInstructionNote(e.target.value)}
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-2.5 py-1.5 text-xs font-semibold text-[var(--color-text)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    onShowToast(
                      isEn
                        ? '📞 Calling Captain Tarek (+966 55 019 2831)...'
                        : '📞 جاري الاتصال بكابتن طارق مندوب التوصيل...'
                    )
                  }
                  className="min-h-[36px] px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center justify-center gap-1.5"
                >
                  <span>📞</span>
                  <span>{isEn ? 'Call Driver' : 'اتصال بالمندوب'}</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onShowToast(
                      isEn
                        ? '💬 Sent delivery note to Captain Tarek!'
                        : '💬 تم إرسال ملاحظة التوصيل للمندوب بنجاح!'
                    )
                  }
                  className="min-h-[36px] px-3 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-950 text-xs font-extrabold flex items-center justify-center gap-1.5"
                >
                  <span>💬</span>
                  <span>{isEn ? 'Message' : 'رسالة سريعة'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          INTERACTIVE SHOPPING CART & TEST PAYMENT GATEWAY DRAWER
          ===================================================================== */}
      {showCartPanel && (
        <div
          id="shopping-cart-panel"
          className="rounded-[22px] border-2 border-orange-300 bg-[var(--color-surface)] p-4 sm:p-5 space-y-4 shadow-md"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center">
                <ThreeDIcon id="cart" size={26} />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-[var(--color-text)]">
                  {isEn
                    ? 'Shopping Cart & Test Payment Gateway'
                    : 'سلة التسوق وبوابة الدفع التجريبية (Test Checkout)'}
                </h3>
                <span className="text-[11px] font-bold text-[var(--color-muted)]">
                  📍 {city} · {currency}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowCartPanel(false)}
              className="min-h-[36px] px-3 py-1 rounded-xl text-xs font-extrabold border border-[var(--color-border)] bg-[var(--color-control-muted)]"
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
            <div className="grid grid-cols-1 lg:grid-cols-[1.25fr_1fr] gap-4">
              {/* Cart Items List */}
              <div className="space-y-2.5">
                {cartEnriched.map((ci) => (
                  <div
                    key={ci.productId}
                    className="rounded-2xl border border-amber-200/70 bg-amber-50/50 p-3 flex flex-wrap items-center justify-between gap-2.5"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-10 h-10 rounded-xl bg-white shadow-2xs flex items-center justify-center text-xl">
                        {ci.product.emoji}
                      </span>
                      <div>
                        <div className="text-xs sm:text-sm font-extrabold text-[var(--color-text)]">
                          {isEn ? ci.product.nameEn : ci.product.name}
                        </div>
                        {ci.selectedVariant && (
                          <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-md bg-white text-[var(--color-muted)]">
                            {ci.selectedVariant}
                          </span>
                        )}
                        <div className="text-[11px] font-bold text-orange-800 tabular-nums mt-0.5">
                          {formatCurrency(ci.unitPrice, currency, language)} × {ci.quantity} ={' '}
                          <strong>{formatCurrency(ci.lineTotal, currency, language)}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        aria-label="إنقاص الكمية"
                        onClick={() => onUpdateCartQuantity(ci.productId, -1)}
                        className="w-7 h-7 rounded-lg border border-[var(--color-border)] bg-white text-xs font-extrabold"
                      >
                        −
                      </button>
                      <span className="px-2 text-xs font-extrabold tabular-nums">{ci.quantity}</span>
                      <button
                        type="button"
                        aria-label="زيادة الكمية"
                        onClick={() => onUpdateCartQuantity(ci.productId, 1)}
                        className="w-7 h-7 rounded-lg border border-[var(--color-border)] bg-white text-xs font-extrabold"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => onRemoveFromCart(ci.productId)}
                        className="ms-1 px-2 py-1 rounded-lg text-[11px] font-bold text-red-700 bg-white border border-red-200"
                      >
                        {isEn ? 'Remove' : 'حذف'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Test Payment Gateway & Shipping Form */}
              <div className="rounded-2xl border border-orange-200/90 bg-orange-50/60 p-3.5 space-y-3">
                <div className="text-xs font-extrabold text-[var(--color-text)]">
                  📍 {isEn ? '1. Delivery Address' : '١. عنوان توصيل الأسرة'}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={shippingAddress.city}
                    onChange={(e) => onUpdateShippingAddress({ city: e.target.value })}
                    placeholder={isEn ? 'City' : 'المدينة'}
                    className="w-full rounded-xl border border-[var(--color-border)] bg-white px-2.5 py-1.5 text-xs font-semibold"
                  />
                  <input
                    type="text"
                    value={shippingAddress.streetDetails}
                    onChange={(e) => onUpdateShippingAddress({ streetDetails: e.target.value })}
                    placeholder={isEn ? 'District / Street' : 'الحي / الشارع / المبنى'}
                    className="w-full rounded-xl border border-[var(--color-border)] bg-white px-2.5 py-1.5 text-xs font-semibold"
                  />
                </div>

                {/* Payment Gateway Methods */}
                <div className="space-y-1.5 pt-1">
                  <div className="text-xs font-extrabold text-[var(--color-text)]">
                    💳 {isEn ? '2. Select Test Payment Method' : '٢. بوابة الدفع التجريبية (Test Payment)'}
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { id: 'card', label: isEn ? '💳 Mada / Visa' : '💳 مدى / بطاقة بنكية' },
                      { id: 'apple_pay', label: ' Apple Pay' },
                      { id: 'wallet', label: isEn ? '👛 Family Wallet' : '👛 محفظة الأسرة' },
                      { id: 'cod', label: isEn ? '💵 Cash on Delivery' : '💵 الدفع عند الاستلام' },
                    ].map((pm) => (
                      <button
                        key={pm.id}
                        type="button"
                        onClick={() => setPaymentMethod(pm.id as typeof paymentMethod)}
                        className={`px-2.5 py-2 rounded-xl text-[11px] font-extrabold border text-start transition-all ${
                          paymentMethod === pm.id
                            ? 'border-orange-600 bg-orange-600 text-white shadow-2xs'
                            : 'border-[var(--color-border)] bg-white text-[var(--color-text)]'
                        }`}
                      >
                        {pm.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Test Card Details Box when Card is selected */}
                {paymentMethod === 'card' && (
                  <div className="rounded-xl border border-orange-200 bg-white p-2.5 space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-extrabold text-emerald-800">
                      <span>🔒 {isEn ? 'Sandbox Test Card Ready' : 'بطاقة اختبار تجريبية جاهزة'}</span>
                      <span dir="ltr">VISA / mada</span>
                    </div>
                    <input
                      type="text"
                      dir="ltr"
                      value={testCardNumber}
                      onChange={(e) => setTestCardNumber(e.target.value)}
                      aria-label={isEn ? 'Test Card Number' : 'رقم البطاقة التجريبية'}
                      className="w-full rounded-lg border border-[var(--color-border)] bg-slate-50 px-2.5 py-1 text-xs font-mono font-bold text-slate-900"
                    />
                    <div className="grid grid-cols-2 gap-2" dir="ltr">
                      <input
                        type="text"
                        value={testCardExpiry}
                        onChange={(e) => setTestCardExpiry(e.target.value)}
                        aria-label="Expiry"
                        className="rounded-lg border border-[var(--color-border)] bg-slate-50 px-2.5 py-1 text-xs font-mono font-bold text-slate-900"
                      />
                      <input
                        type="text"
                        value={testCardCvv}
                        onChange={(e) => setTestCardCvv(e.target.value)}
                        aria-label="CVV"
                        className="rounded-lg border border-[var(--color-border)] bg-slate-50 px-2.5 py-1 text-xs font-mono font-bold text-slate-900"
                      />
                    </div>
                  </div>
                )}

                {/* Order Summary Breakdown */}
                <div className="pt-2 border-t border-orange-200 space-y-1 text-xs">
                  <div className="flex items-center justify-between text-[var(--color-muted)] font-bold">
                    <span>{isEn ? 'Subtotal:' : 'قيمة المنتجات:'}</span>
                    <span className="tabular-nums">{formatCurrency(cartTotalAmount, currency, language)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[var(--color-muted)] font-bold">
                    <span>{isEn ? 'Express Delivery:' : 'رسوم التوصيل السريع:'}</span>
                    <span className="tabular-nums">{formatCurrency(deliveryFee, currency, language)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm font-extrabold text-orange-950 pt-1">
                    <span>{isEn ? 'Total Amount:' : 'الإجمالي النهائي:'}</span>
                    <span className="tabular-nums">
                      {formatCurrency(cartTotalAmount + deliveryFee, currency, language)}
                    </span>
                  </div>
                </div>

                <PrimaryCtaButton
                  variant="orange"
                  onClick={handleProcessTestPayment}
                  disabled={paymentProcessing}
                  className="w-full"
                >
                  {paymentProcessing
                    ? isEn
                      ? '⏳ Authorizing Test Payment...'
                      : '⏳ جاري تأكيد الدفع التجريبي...'
                    : isEn
                    ? '🚀 Pay Now & Track Order Live'
                    : '🚀 إتمام الدفع التجريبي وتتبع الطلب'}
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
                  className="rounded-xl bg-emerald-50 border border-emerald-200 p-2.5 text-xs text-emerald-950 flex flex-wrap items-center justify-between gap-2"
                >
                  <span className="font-bold">
                    #{ord.id} · {ord.items.map((i) => `${i.name} (×${i.quantity})`).join('، ')}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold tabular-nums">
                      {formatCurrency(ord.totalAmount, ord.currency, language)}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCartPanel(false);
                        setShowLiveTracking(true);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[11px] font-extrabold"
                    >
                      🛵 {isEn ? 'Track on Map' : 'تتبع على الخريطة'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Search & Visual Category Filter Cards */}
      <div className="rounded-[22px] border border-[var(--color-border)] bg-[var(--color-surface)] p-3.5 sm:p-4 space-y-3 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex-1 min-w-[200px]">
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
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-3.5 py-2 text-xs font-semibold text-[var(--color-text)]"
            />
          </div>

          <select
            aria-label={isEn ? 'Sort products' : 'ترتيب المنتجات'}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="min-h-[38px] rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-3 py-1.5 text-xs font-extrabold text-[var(--color-text)]"
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
            className="min-h-[38px] rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-3 py-1.5 text-xs font-extrabold text-[var(--color-text)]"
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
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div
            className="flex flex-wrap items-center gap-1 bg-[var(--color-control-muted)] p-1 rounded-xl"
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
                className={`px-3 py-1 text-xs font-extrabold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                  segment === tab.id
                    ? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-2xs'
                    : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-1">
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
                className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold border transition-colors ${
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

      {/* Super App Product & Service Grid Cards (Compact Premium Feel) */}
      {filtered.length === 0 ? (
        <div className="rounded-[22px] border border-dashed border-[var(--color-border)] p-8 text-center text-xs font-bold text-[var(--color-muted)]">
          {isEn
            ? 'No matching services or products found.'
            : 'لا توجد نتائج مطابقة للبحث. جرّب اختيار فئة أخرى.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filtered.map((item) => {
            const priceVal = currency === 'SAR' ? item.priceSAR : item.priceEGP;
            const origVal = currency === 'SAR' ? item.originalPriceSAR : item.originalPriceEGP;
            const displayTitle = isEn ? item.nameEn : item.name;
            const toneKey = CATEGORY_TONE_MAP[item.category] || 'amber';
            const tone = PASTEL_CARD_TONES[toneKey];

            return (
              <div
                key={item.id}
                className={`rounded-[20px] border ${tone.card} bg-[var(--color-surface)] p-3.5 flex flex-col justify-between gap-3 shadow-2xs hover:shadow-md transition-all`}
              >
                <div className="space-y-2.5">
                  {/* Top Visual Header: 3D Tactile Icon Box + Rating/Collection Tag */}
                  <div
                    onClick={() => onInspectCommercialItem(item)}
                    className="rounded-xl p-3 cursor-pointer relative overflow-hidden flex items-center justify-between gap-2.5 border border-white/80 bg-white/85 shadow-2xs"
                  >
                    <div className="w-12 h-12 rounded-xl bg-[var(--color-accent-soft)]/60 flex items-center justify-center text-2xl shrink-0">
                      {item.emoji}
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      {item.collectionTag && (
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${tone.badge}`}>
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
                      <span className="text-[11px] font-extrabold text-amber-800 tabular-nums">
                        🌟 {item.rating} ({item.reviewCount || 80})
                      </span>
                    </div>
                  </div>

                  {/* Title & Compact Visual Metadata Strip */}
                  <div className="space-y-1">
                    <h3 className="text-xs sm:text-sm font-extrabold text-[var(--color-text)] leading-snug line-clamp-2">
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
                <div className="pt-2.5 border-t border-[var(--color-border)]/70 space-y-2">
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
                        <span className="text-[11px] line-through text-[var(--color-muted)]">
                          {formatCurrency(origVal, currency, language)}
                        </span>
                      )}
                      <strong className="text-sm font-extrabold text-[var(--color-text)]">
                        {formatCurrency(priceVal, currency, language)}
                      </strong>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => onInspectCommercialItem(item)}
                      className="min-h-[36px] px-2 py-1.5 rounded-xl text-[11px] font-extrabold border border-[var(--color-border)] bg-white text-[var(--color-text)] whitespace-nowrap active:scale-95 transition-transform"
                    >
                      {isEn ? 'Details' : 'التفاصيل'}
                    </button>
                    <button
                      type="button"
                      onClick={() => onAddToCart(item, item.variants?.[0])}
                      className="min-h-[36px] px-2 py-1.5 rounded-xl text-[11px] font-extrabold bg-orange-600 hover:bg-orange-700 text-white shadow-2xs whitespace-nowrap active:scale-95 transition-transform"
                    >
                      {isEn ? '+ Cart' : '+ للسلة'}
                    </button>
                    <button
                      type="button"
                      onClick={() => onAddProductToWishes(item)}
                      className="min-h-[36px] px-2 py-1.5 rounded-xl text-[11px] font-extrabold border border-[var(--color-border)] bg-white/80 text-[var(--color-text)] whitespace-nowrap active:scale-95 transition-transform"
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

      {/* Compact Visual Payment Badges Strip */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-[11px] font-bold text-[var(--color-muted)]">
        <span>
          🛡️ {isEn ? 'Localized Catalog & Live Delivery Tracking' : 'كتالوج محلي وتوصيل مباشر على الخريطة'}
        </span>
        <span className="text-[var(--color-text)]">
          💳 Visa · Mastercard · مدى mada · Apple Pay
        </span>
      </div>
    </section>
  );
};

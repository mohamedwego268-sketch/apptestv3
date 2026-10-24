import React, { useState } from 'react';
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
  formatCurrency,
  getEmptyStateCopy,
  getPaymentMethodLabels,
  locText,
} from '../domain/familySpaceCore';
import { ThreeDIcon } from './ThreeDVisuals';
import { getCardBackgroundSpec } from '../domain/cardBackgrounds';
import {
  BannerSlideItem,
  FriendlyEmptyState,
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
  onCompleteDemoCheckout: (paymentMethod?: CheckoutPaymentMethodType) => void;
  onShowToast?: (msg: string) => void;
  darkMode?: boolean;
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
  darkMode,
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
  const [showCartPanel, setShowCartPanel] = useState(false);

  // Store Flow View Mode: Catalog vs Dedicated Checkout (إتمام الطلب) vs Order Confirmed (تأكيد الطلب)
  const [storeFlowStep, setStoreFlowStep] = useState<'catalog' | 'checkout' | 'confirmed'>('catalog');
  const [paymentCategory, setPaymentCategory] = useState<'electronic' | 'cod'>('electronic');
  const [paymentMethod, setPaymentMethod] = useState<CheckoutPaymentMethodType>('electronic_card');
  const [testCardHolder, setTestCardHolder] = useState('AHMED & SARA');
  const [testCardNumber, setTestCardNumber] = useState('4242 •••• •••• 4242');
  const [testCardExpiry, setTestCardExpiry] = useState('09/28');
  const [testCardCvv, setTestCardCvv] = useState('888');
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [confirmedOrderSnapshot, setConfirmedOrderSnapshot] = useState<DemoOrder | null>(null);
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

  const emptyCartCopy = getEmptyStateCopy('cart', language);

  const effectiveCheckoutCart: CartItem[] = cart;

  const cartEnriched = effectiveCheckoutCart
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

  const checkoutTotals = calculateCheckoutSummary(effectiveCheckoutCart, currency, paymentMethod);
  const cartTotalCount = cart.reduce((acc, c) => acc + c.quantity, 0);
  const cartTotalAmount = checkoutTotals.subtotal;
  const deliveryFee = cart.length > 0 ? checkoutTotals.deliveryFee : 0;
  const codFee = cart.length > 0 ? checkoutTotals.codFee : 0;
  const grandTotal = cart.length > 0 ? checkoutTotals.grandTotal : 0;

  const handleClearCartForEmptyState = () => {
    cart.forEach((ci) => onRemoveFromCart(ci.productId));
    onShowToast(
      isEn
        ? 'Shopping cart cleared — Empty state active'
        : 'تم تفريغ سلة التسوق بنجاح'
    );
  };

  const activeStage = DELIVERY_TIMELINE_STAGES[trackingStageIdx] || DELIVERY_TIMELINE_STAGES[2];
  const latestOrder = confirmedOrderSnapshot || orders[0];

  const handleSelectCategoryMode = (cat: 'electronic' | 'cod') => {
    setPaymentCategory(cat);
    if (cat === 'cod') {
      setPaymentMethod('cod');
    } else if (paymentMethod === 'cod') {
      setPaymentMethod('electronic_card');
    }
  };

  const handleProcessTestPayment = (overrideMethod?: CheckoutPaymentMethodType) => {
    const chosenMethod = overrideMethod || paymentMethod;
    if (overrideMethod) {
      setPaymentMethod(overrideMethod);
      setPaymentCategory(overrideMethod === 'cod' ? 'cod' : 'electronic');
    }

    if (chosenMethod === 'electronic_card') {
      if (!testCardNumber.trim() || !testCardExpiry.trim() || !testCardCvv.trim()) {
        onShowToast(
          isEn
            ? 'Please fill in the mock card details to complete Electronic Payment.'
            : 'يرجى استكمال بيانات البطاقة التجريبية لإتمام الدفع الإلكتروني.'
        );
        return;
      }
    }

    setPaymentProcessing(true);
    const pmInfo = getPaymentMethodLabels(chosenMethod);
    const snapshotTotals = calculateCheckoutSummary(effectiveCheckoutCart, currency, chosenMethod);

    const newConfirmedSnapshot: DemoOrder = {
      id: `FS-${String(Date.now()).slice(-5)}`,
      createdAt: new Date().toISOString(),
      items: cartEnriched.map((ci) => ({
        productId: ci.productId,
        name: isEn ? ci.product.nameEn : ci.product.name,
        quantity: ci.quantity,
        unitPrice: ci.unitPrice,
        variant: ci.selectedVariant,
      })),
      totalAmount: snapshotTotals.grandTotal,
      deliveryFee: snapshotTotals.deliveryFee + snapshotTotals.codFee,
      currency,
      shippingAddress,
      paymentMethod: chosenMethod,
      paymentMethodLabelAr: pmInfo.labelAr,
      paymentMethodLabelEn: pmInfo.labelEn,
      status: 'confirmed_demo',
    };

    window.setTimeout(() => {
      setPaymentProcessing(false);
      setConfirmedOrderSnapshot(newConfirmedSnapshot);
      onCompleteDemoCheckout(chosenMethod);
      setShowCartPanel(true);
      setStoreFlowStep('confirmed');
      setTrackingStageIdx(0);
      onShowToast(
        isEn
          ? `✓ Order #${newConfirmedSnapshot.id} Confirmed via ${pmInfo.labelEn}!`
          : `✓ تم تأكيد الطلب #${newConfirmedSnapshot.id} بنجاح (${pmInfo.labelAr})!`
      );
    }, 300);
  };

  const storeBanners: BannerSlideItem[] = [
    {
      id: 'store-slide-deals',
      badge: isEn ? '🛍️ Family Super Deals' : '🛍️ عروض متجر الأسرة',
      title: isEn
        ? `Montessori Toys & Organic Baby Essentials (${currency})`
        : `ألعاب مونتيسوري ومستلزمات الطفل العضوية (${currency})`,
      subtitle: isEn
        ? `Fast Delivery in ${displayCity} · Live Courier Tracking`
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
        ? `Top Nurseries & Pediatric Services in ${displayCity}`
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
    <section className="space-y-6" aria-label={isEn ? 'Family Store & Services' : 'المتجر والخدمات'}>
      {/* Sticky Glassmorphism Top Action Strip: City Filter + Live Order Tracking + Cart Button */}
      <div
        id="store-sticky-subheader"
        className="sticky top-[52px] z-20 glass-sticky-subheader backdrop-blur-md rounded-2xl border border-amber-200/60 bg-amber-50/85 px-4 py-3 shadow-2xs flex flex-wrap items-center justify-between gap-2.5 transition-all"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-2xl bg-white shadow-2xs flex items-center justify-center shrink-0">
            <ThreeDIcon id="services" size={24} />
          </div>
          <div className="min-w-0">
            <div className="text-xs sm:text-sm font-extrabold text-[var(--color-text)] truncate">
              {isEn ? 'Family Store & Express Delivery' : 'متجر الأسرة والتوصيل الفوري'}
            </div>
            <div className="text-[11px] font-bold text-[var(--color-muted)] truncate">
              {country === 'SA' ? (isEn ? '🇸🇦 Saudi Arabia' : '🇸🇦 السعودية') : isEn ? '🇪🇬 Egypt' : '🇪🇬 مصر'} · 📍 {displayCity} · {currency}
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
              📍 {displayCity}
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              setStoreFlowStep('catalog');
              setShowCartPanel(false);
              setShowLiveTracking((prev) => (storeFlowStep !== 'catalog' ? true : !prev));
            }}
            className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-extrabold border transition-all flex items-center gap-1.5 ${
              showLiveTracking && storeFlowStep === 'catalog'
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
            onClick={() => {
              setShowCartPanel(true);
              setStoreFlowStep('checkout');
            }}
          >
            <span>🛒</span>
            <span>
              {isEn ? `Checkout (${cartTotalCount})` : `إتمام الطلب (${cartTotalCount})`}
            </span>
          </PrimaryCtaButton>
        </div>
      </div>

      {/* Store Flow Navigation Stepper Bar (Catalog -> Checkout إتمام الطلب -> Order Confirmed -> Live Tracking) */}
      <div
        className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-2 shadow-2xs flex flex-wrap items-center justify-between gap-2"
        role="tablist"
        aria-label={isEn ? 'Store & Checkout Steps' : 'مراحل التسوق وإتمام الطلب'}
      >
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            role="tab"
            aria-selected={storeFlowStep === 'catalog' && !showCartPanel}
            onClick={() => {
              setStoreFlowStep('catalog');
              setShowCartPanel(false);
            }}
            className={`min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 ${
              storeFlowStep === 'catalog' && !showCartPanel
                ? 'bg-[var(--color-accent)] text-[var(--color-accent-contrast)] shadow-2xs'
                : 'bg-[var(--color-control-muted)] text-[var(--color-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            <span>🛍️</span>
            <span>{isEn ? '1. Store Catalog' : '١. تصفح المتجر'}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={storeFlowStep === 'checkout' || showCartPanel}
            onClick={() => {
              setShowCartPanel(true);
              setStoreFlowStep('checkout');
            }}
            className={`min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 ${
              storeFlowStep === 'checkout'
                ? 'bg-orange-600 text-white shadow-2xs'
                : 'bg-orange-50 text-orange-950 border border-orange-200 hover:bg-orange-100'
            }`}
          >
            <span>💳</span>
            <span>{isEn ? '2. Checkout (إتمام الطلب)' : '٢. إتمام الطلب ومحاكاة الدفع'}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={storeFlowStep === 'confirmed'}
            onClick={() => {
              setShowCartPanel(true);
              setStoreFlowStep('confirmed');
            }}
            className={`min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 ${
              storeFlowStep === 'confirmed'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-emerald-50 text-emerald-950 border border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            <span>✅</span>
            <span>{isEn ? '3. Order Confirmed' : '٣. تأكيد الطلب وملخص الدفع'}</span>
          </button>
        </div>

        <span className="text-[11px] font-bold text-[var(--color-muted)] px-2">
          🔒 {isEn ? 'Safe Mock Checkout (No Real Charge)' : 'محاكاة دفع آمنة ١٠٠٪ لأغراض الاختبار'}
        </span>
      </div>

      {/* Swipeable Image Carousel / Banners (Shown in Catalog view) */}
      {storeFlowStep === 'catalog' && (
        <SwipeableBannerCarousel
          slides={storeBanners}
          language={language}
          ariaLabel={isEn ? 'Store Offers Carousel' : 'لافتات عروض المتجر المتحركة'}
        />
      )}

      {/* =====================================================================
          TALABAT / UBER-EATS STYLE LIVE ORDER TRACKING & ROUTE MAP
          ===================================================================== */}
      {showLiveTracking && storeFlowStep === 'catalog' && (
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
                  🛰️ {isEn ? `Live Route · ${displayCity}` : `خريطة التوصيل المباشرة · ${city}`}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-black/50 backdrop-blur-xs text-white tabular-nums">
                  📍 {locText(shippingAddress.streetDetails, language) || (isEn ? 'Family Home' : 'منزل الأسرة')}
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
          COMPLETE MOCK CHECKOUT & PAYMENT FLOW (إتمام الطلب ومحاكاة الدفع)
          + PAYMENT SUCCESSFUL / ORDER CONFIRMED SCREEN
          ===================================================================== */}
      {(showCartPanel || storeFlowStep === 'checkout' || storeFlowStep === 'confirmed') && (
        <div
          id="shopping-cart-panel"
          data-testid="store-checkout-flow-container"
          className="rounded-[22px] border-2 border-orange-300 bg-[var(--color-surface)] p-4 sm:p-5 space-y-4 shadow-md"
        >
          {/* Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[var(--color-border)]">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center">
                <ThreeDIcon id="cart" size={26} />
              </div>
              <div>
                <span className="inline-block px-2 py-0.5 rounded-md bg-orange-100 text-orange-900 text-[10px] font-extrabold">
                  {storeFlowStep === 'confirmed'
                    ? isEn
                      ? 'ORDER CONFIRMED · تم تأكيد الطلب'
                      : 'تم الدفع وتأكيد الطلب بنجاح'
                    : isEn
                    ? 'CHECKOUT & MOCK PAYMENT · إتمام الطلب'
                    : 'شاشة إتمام الطلب ومحاكاة الدفع'}
                </span>
                <h3 className="text-sm sm:text-base font-extrabold text-[var(--color-text)] mt-0.5">
                  {storeFlowStep === 'confirmed'
                    ? isEn
                      ? 'Payment Successful & Order Confirmed'
                      : 'تمت عملية الدفع وتأكيد طلب الأسرة بنجاح'
                    : isEn
                    ? 'Checkout (إتمام الطلب) — Select Payment Method'
                    : 'إتمام الطلب (Checkout) — اختيار وسيلة الدفع وتأكيد الشحن'}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {storeFlowStep === 'checkout' && cart.length > 0 && (
                <button
                  id="clear-cart-empty-btn"
                  type="button"
                  onClick={handleClearCartForEmptyState}
                  className="min-h-[36px] px-3 py-1 rounded-xl text-xs font-extrabold border border-rose-200 bg-rose-50 text-rose-900 hover:bg-rose-100 transition-colors"
                >
                  🗑️ {isEn ? 'Clear Cart' : 'تفريغ السلة'}
                </button>
              )}
              {storeFlowStep === 'confirmed' && (
                <button
                  type="button"
                  onClick={() => setStoreFlowStep('checkout')}
                  className="min-h-[36px] px-3 py-1 rounded-xl text-xs font-extrabold border border-orange-300 bg-orange-50 text-orange-950"
                >
                  {isEn ? '← Back to Checkout' : '← الرجوع لإتمام الطلب'}
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setShowCartPanel(false);
                  setStoreFlowStep('catalog');
                }}
                className="min-h-[36px] px-3 py-1 rounded-xl text-xs font-extrabold border border-[var(--color-border)] bg-[var(--color-control-muted)]"
              >
                {isEn ? 'Close' : 'إغلاق'}
              </button>
            </div>
          </div>

          {/* -----------------------------------------------------------------
              VIEW A: PAYMENT SUCCESSFUL / ORDER CONFIRMED SCREEN
              ----------------------------------------------------------------- */}
          {storeFlowStep === 'confirmed' ? (
            <div
              id="store-order-confirmed-screen"
              data-testid="payment-successful-screen"
              className="rounded-[20px] border-2 border-emerald-300 bg-gradient-to-br from-emerald-50/95 via-white to-teal-50/85 p-4 sm:p-6 space-y-5 shadow-2xs"
            >
              {/* Success Banner */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-emerald-200/80">
                <div className="flex items-center gap-3.5">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center text-3xl shadow-sm shrink-0">
                    ✅
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-950 text-[10px] font-extrabold">
                        {isEn ? 'PAYMENT SUCCESSFUL' : 'عملية دفع وتأكيد ناجحة'}
                      </span>
                      <span className="text-xs font-extrabold text-emerald-900 tabular-nums">
                        #{latestOrder ? latestOrder.id : 'FS-9042'}
                      </span>
                    </div>
                    <h4 className="text-base sm:text-lg font-extrabold text-[var(--color-text)] mt-0.5">
                      {isEn
                        ? 'Thank you! Your Family Order is Confirmed'
                        : 'شكرًا لك! تم تأكيد طلب الأسرة وإرساله للمتجر'}
                    </h4>
                    <p className="text-xs font-semibold text-[var(--color-muted)]">
                      {isEn
                        ? 'Your courier is being assigned. Track your order live on the map below.'
                        : 'تم تسجيل وسيلة الدفع وتعيين مندوب التوصيل. يمكنك متابعة مسار الطلب مباشرة الآن.'}
                    </p>
                  </div>
                </div>

                {/* Primary CTA leading directly to Live Order Tracking UI */}
                <PrimaryCtaButton
                  variant="emerald"
                  size="lg"
                  onClick={() => {
                    setShowLiveTracking(true);
                    setShowCartPanel(false);
                    setStoreFlowStep('catalog');
                    setTrackingStageIdx(0);
                    window.setTimeout(() => {
                      document
                        .getElementById('talabat-live-order-tracker')
                        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 80);
                  }}
                >
                  <span>🛵</span>
                  <span>
                    {isEn
                      ? 'Go to Live Order Tracking'
                      : 'الانتقال إلى تتبع الطلب المباشر'}
                  </span>
                </PrimaryCtaButton>
              </div>

              {/* Confirmed Order Summary Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Order Details & Payment Method Summary */}
                <div className="rounded-2xl border border-emerald-200 bg-white p-4 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs sm:text-sm font-extrabold text-[var(--color-text)]">
                      📋 {isEn ? 'Confirmed Order Summary' : 'ملخص الطلب المؤكد وتفاصيل الدفع'}
                    </h5>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-900 text-[10px] font-extrabold">
                      {isEn ? 'Verified' : 'مؤكد ✓'}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                      <span className="font-bold text-[var(--color-muted)]">
                        {isEn ? 'Order Number:' : 'رقم الطلب:'}
                      </span>
                      <span className="font-extrabold text-[var(--color-text)] tabular-nums">
                        #{latestOrder ? latestOrder.id : 'FS-9042'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                      <span className="font-bold text-[var(--color-muted)]">
                        {isEn ? 'Payment Method:' : 'وسيلة الدفع المختارة:'}
                      </span>
                      <span className="font-extrabold text-emerald-900 bg-emerald-50 px-2.5 py-0.5 rounded-lg">
                        {latestOrder?.paymentMethodLabelAr
                          ? isEn
                            ? latestOrder.paymentMethodLabelEn
                            : latestOrder.paymentMethodLabelAr
                          : isEn
                          ? getPaymentMethodLabels(paymentMethod).labelEn
                          : getPaymentMethodLabels(paymentMethod).labelAr}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                      <span className="font-bold text-[var(--color-muted)]">
                        {isEn ? 'Recipient:' : 'المستلم:'}
                      </span>
                      <span className="font-extrabold text-[var(--color-text)]">
                        {locText(latestOrder?.shippingAddress?.recipientName || shippingAddress.recipientName, language)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                      <span className="font-bold text-[var(--color-muted)]">
                        {isEn ? 'Delivery Destination:' : 'وجهة التوصيل:'}
                      </span>
                      <span className="font-bold text-[var(--color-text)] text-end">
                        {locText(latestOrder?.shippingAddress?.city || shippingAddress.city, language)} —{' '}
                        {locText(latestOrder?.shippingAddress?.streetDetails || shippingAddress.streetDetails, language)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 text-sm font-extrabold text-emerald-950">
                      <span>{isEn ? 'Total Order Amount:' : 'الإجمالي النهائي للطلب:'}</span>
                      <span className="tabular-nums text-base">
                        {formatCurrency(
                          latestOrder ? latestOrder.totalAmount : grandTotal,
                          latestOrder ? latestOrder.currency : currency,
                          language
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Ordered Items List + Action Buttons */}
                <div className="rounded-2xl border border-emerald-200 bg-white p-4 flex flex-col justify-between gap-3 shadow-2xs">
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
                          className="rounded-xl bg-emerald-50/70 border border-emerald-100 px-3 py-2 flex items-center justify-between gap-2 text-xs"
                        >
                          <div>
                            <div className="font-extrabold text-[var(--color-text)]">
                              {item.name} <span className="text-emerald-800">(×{item.quantity})</span>
                            </div>
                            {item.variant && (
                              <div className="text-[10px] font-bold text-[var(--color-muted)]">
                                {item.variant}
                              </div>
                            )}
                          </div>
                          <span className="font-extrabold text-emerald-950 tabular-nums">
                            {formatCurrency(item.unitPrice * item.quantity, currency, language)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setShowLiveTracking(true);
                        setShowCartPanel(false);
                        setStoreFlowStep('catalog');
                        setTrackingStageIdx(0);
                      }}
                      className="min-h-[40px] px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-2xs"
                    >
                      <span>🛵</span>
                      <span>{isEn ? 'Live Delivery Map' : 'تتبع الطلب المباشر'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCartPanel(false);
                        setStoreFlowStep('catalog');
                      }}
                      className="min-h-[40px] px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-control-muted)] text-[var(--color-text)] text-xs font-extrabold flex items-center justify-center gap-1.5"
                    >
                      <span>🛍️</span>
                      <span>{isEn ? 'Continue Shopping' : 'متابعة التسوق'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : cart.length === 0 ? (
            /* -----------------------------------------------------------------
               EMPTY CART STATE (سلة التسوق فارغة — لا توجد عناصر هنا بعد)
               ----------------------------------------------------------------- */
            <div className="space-y-3">
              <FriendlyEmptyState
                id="empty-cart-state"
                iconId="cart"
                tone="amber"
                title={emptyCartCopy.title}
                subtitle={emptyCartCopy.subtitle}
                actionLabel={
                  isEn
                    ? '+ Add Demo Item to Cart'
                    : '➕ إضافة منتج تجريبي للسلة'
                }
                onAction={() => {
                  const demoItem = COMMERCIAL_CATALOG[0];
                  if (demoItem) {
                    onAddToCart(demoItem, demoItem.variants?.[0]);
                  }
                }}
              />
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => {
                    setShowCartPanel(false);
                    setStoreFlowStep('catalog');
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-extrabold border border-[var(--color-border)] bg-[var(--color-control-muted)] text-[var(--color-text)]"
                >
                  🛍️ {emptyCartCopy.actionLabel}
                </button>
              </div>
            </div>
          ) : (
            /* -----------------------------------------------------------------
               VIEW B: DEDICATED CHECKOUT SCREEN (شاشة إتمام الطلب ومحاكاة الدفع)
               ----------------------------------------------------------------- */
            <div
              id="store-checkout-screen"
              data-testid="checkout-payment-screen"
              className="grid grid-cols-1 lg:grid-cols-[1.15fr_1.25fr] gap-4 items-start"
            >
              {/* Column 1: Order Items & Delivery Info */}
              <div className="space-y-3.5">
                <div className="rounded-2xl border border-amber-200/80 bg-amber-50/55 p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs sm:text-sm font-extrabold text-[var(--color-text)]">
                      🛍️ {isEn ? '1. Order Items Review' : '١. مراجعة منتجات الطلب'}
                    </h4>
                    <span className="px-2 py-0.5 rounded-md bg-white text-amber-900 text-[10px] font-extrabold tabular-nums">
                      {cartEnriched.reduce((a, b) => a + b.quantity, 0)}{' '}
                      {isEn ? 'items' : 'منتجات'}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {cartEnriched.map((ci) => (
                      <div
                        key={ci.productId}
                        className="rounded-xl border border-amber-200/70 bg-white p-2.5 flex flex-wrap items-center justify-between gap-2 shadow-2xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-lg shrink-0">
                            {ci.product.emoji}
                          </span>
                          <div className="min-w-0">
                            <div className="text-xs font-extrabold text-[var(--color-text)] truncate">
                              {isEn ? ci.product.nameEn : ci.product.name}
                            </div>
                            <div className="text-[11px] font-bold text-orange-800 tabular-nums">
                              {formatCurrency(ci.unitPrice, currency, language)} × {ci.quantity} ={' '}
                              <strong>{formatCurrency(ci.lineTotal, currency, language)}</strong>
                            </div>
                          </div>
                        </div>

                        {cart.length > 0 && (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              aria-label="إنقاص الكمية"
                              onClick={() => onUpdateCartQuantity(ci.productId, -1)}
                              className="w-7 h-7 rounded-lg border border-[var(--color-border)] bg-amber-50 text-xs font-extrabold"
                            >
                              −
                            </button>
                            <span className="px-1.5 text-xs font-extrabold tabular-nums">
                              {ci.quantity}
                            </span>
                            <button
                              type="button"
                              aria-label="زيادة الكمية"
                              onClick={() => onUpdateCartQuantity(ci.productId, 1)}
                              className="w-7 h-7 rounded-lg border border-[var(--color-border)] bg-amber-50 text-xs font-extrabold"
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
                <div className="rounded-2xl border border-sky-200/80 bg-sky-50/55 p-3.5 space-y-2.5">
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
                        className="w-full rounded-xl border border-[var(--color-border)] bg-white px-2.5 py-1.5 text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label htmlFor="checkoutPhoneInput" className="block text-[10px] font-extrabold text-[var(--color-muted)] mb-0.5">
                        {isEn ? 'Contact Mobile' : 'رقم جوال التواصل'}
                      </label>
                      <input
                        id="checkoutPhoneInput"
                        type="tel"
                        dir="ltr"
                        value={shippingAddress.phone}
                        onChange={(e) => onUpdateShippingAddress({ phone: e.target.value })}
                        className="w-full rounded-xl border border-[var(--color-border)] bg-white px-2.5 py-1.5 text-xs font-semibold tabular-nums"
                      />
                    </div>
                    <div>
                      <label htmlFor="checkoutCityInput" className="block text-[10px] font-extrabold text-[var(--color-muted)] mb-0.5">
                        {isEn ? 'City' : 'المدينة'}
                      </label>
                      <input
                        id="checkoutCityInput"
                        type="text"
                        value={shippingAddress.city}
                        onChange={(e) => onUpdateShippingAddress({ city: e.target.value })}
                        className="w-full rounded-xl border border-[var(--color-border)] bg-white px-2.5 py-1.5 text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label htmlFor="checkoutStreetInput" className="block text-[10px] font-extrabold text-[var(--color-muted)] mb-0.5">
                        {isEn ? 'District / Street / Door' : 'الحي / الشارع / المنزل'}
                      </label>
                      <input
                        id="checkoutStreetInput"
                        type="text"
                        value={shippingAddress.streetDetails}
                        onChange={(e) => onUpdateShippingAddress({ streetDetails: e.target.value })}
                        className="w-full rounded-xl border border-[var(--color-border)] bg-white px-2.5 py-1.5 text-xs font-semibold"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Column 2: Payment Methods Selection (Electronic Payment vs Cash on Delivery) */}
              <div className="rounded-2xl border-2 border-orange-200/95 bg-orange-50/55 p-4 space-y-3.5 shadow-2xs">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs sm:text-sm font-extrabold text-[var(--color-text)]">
                    💳 {isEn ? '3. Select Payment Method' : '٣. اختر طريقة الدفع (محاكاة الدفع)'}
                  </h4>
                  <span className="px-2 py-0.5 rounded-md bg-orange-100 text-orange-950 text-[10px] font-extrabold">
                    {isEn ? '2 Options Available' : 'خياران متاحان'}
                  </span>
                </div>

                {/* Two Distinct Payment Category Cards: Electronic Payment vs Cash on Delivery (COD) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5" role="radiogroup" aria-label="طرق الدفع">
                  {/* Option A: Electronic Payment (الدفع الإلكتروني) */}
                  <button
                    type="button"
                    role="radio"
                    aria-checked={paymentCategory === 'electronic'}
                    onClick={() => handleSelectCategoryMode('electronic')}
                    className={`rounded-2xl border-2 p-3 text-start transition-all cursor-pointer flex items-start gap-2.5 ${
                      paymentCategory === 'electronic'
                        ? 'border-orange-600 bg-white ring-2 ring-orange-500/20 shadow-2xs'
                        : 'border-[var(--color-border)] bg-white/75 text-[var(--color-muted)] hover:bg-white'
                    }`}
                  >
                    <span className="w-9 h-9 rounded-xl bg-orange-100 text-orange-900 flex items-center justify-center text-lg shrink-0">
                      💳
                    </span>
                    <div className="min-w-0">
                      <div className="text-xs font-extrabold text-[var(--color-text)]">
                        {isEn ? 'Electronic Payment' : 'الدفع الإلكتروني'}
                      </div>
                      <div className="text-[10px] font-bold text-[var(--color-muted)] mt-0.5">
                        {isEn
                          ? 'Credit/Debit Cards · Apple Pay · Google Pay'
                          : 'بطاقات ائتمانية / مدى · Apple Pay · Google Pay'}
                      </div>
                    </div>
                  </button>

                  {/* Option B: Cash on Delivery (الدفع عند الاستلام) */}
                  <button
                    type="button"
                    role="radio"
                    aria-checked={paymentCategory === 'cod'}
                    onClick={() => handleSelectCategoryMode('cod')}
                    className={`rounded-2xl border-2 p-3 text-start transition-all cursor-pointer flex items-start gap-2.5 ${
                      paymentCategory === 'cod'
                        ? 'border-emerald-600 bg-white ring-2 ring-emerald-500/20 shadow-2xs'
                        : 'border-[var(--color-border)] bg-white/75 text-[var(--color-muted)] hover:bg-white'
                    }`}
                  >
                    <span className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-900 flex items-center justify-center text-lg shrink-0">
                      💵
                    </span>
                    <div className="min-w-0">
                      <div className="text-xs font-extrabold text-[var(--color-text)]">
                        {isEn ? 'Cash on Delivery (COD)' : 'الدفع عند الاستلام'}
                      </div>
                      <div className="text-[10px] font-bold text-[var(--color-muted)] mt-0.5">
                        {isEn
                          ? 'Pay cash or POS when courier arrives'
                          : 'ادفع نقدًا أو عبر جهاز الشبكة عند وصول المندوب'}
                      </div>
                    </div>
                  </button>
                </div>

                {/* ELECTRONIC PAYMENT DETAILS: Apple Pay / Google Pay Buttons + Credit/Debit Card Fields */}
                {paymentCategory === 'electronic' ? (
                  <div className="rounded-2xl border border-orange-200 bg-white p-3.5 space-y-3 shadow-2xs">
                    {/* Express Digital Wallets: Apple Pay & Google Pay */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-extrabold text-[var(--color-muted)]">
                        <span>⚡ {isEn ? 'Express Digital Wallets:' : 'محافظ الدفع السريع بضغطة واحدة:'}</span>
                        <span>Apple Pay / Google Pay</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setPaymentMethod('apple_pay');
                            onShowToast(
                              isEn
                                ? ' Apple Pay selected — tap Confirm Order below or pay instantly'
                                : ' تم اختيار Apple Pay — اضغط تأكيد الطلب بالأسفل لإتمام المحاكاة'
                            );
                          }}
                          className={`min-h-[42px] px-3 py-2 rounded-xl text-xs font-extrabold border-2 transition-all flex items-center justify-center gap-1.5 ${
                            paymentMethod === 'apple_pay'
                              ? 'border-slate-950 bg-slate-950 text-white shadow-sm'
                              : 'border-slate-300 bg-slate-900 text-white hover:bg-slate-800'
                          }`}
                        >
                          <span className="text-base"></span>
                          <span>Apple Pay</span>
                          {paymentMethod === 'apple_pay' && <span>✓</span>}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setPaymentMethod('google_pay');
                            onShowToast(
                              isEn
                                ? 'G Google Pay selected — tap Confirm Order below'
                                : 'G تم اختيار Google Pay — اضغط تأكيد الطلب بالأسفل لإتمام المحاكاة'
                            );
                          }}
                          className={`min-h-[42px] px-3 py-2 rounded-xl text-xs font-extrabold border-2 transition-all flex items-center justify-center gap-1.5 ${
                            paymentMethod === 'google_pay'
                              ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                              : 'border-slate-300 bg-white text-slate-900 hover:bg-slate-50'
                          }`}
                        >
                          <span className="font-black text-blue-600 bg-white px-1.5 rounded">G</span>
                          <span>Google Pay</span>
                          {paymentMethod === 'google_pay' && <span>✓</span>}
                        </button>
                      </div>
                    </div>

                    {/* Credit / Debit Card Mock Input Fields */}
                    <div className="pt-2 border-t border-slate-100 space-y-2">
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('electronic_card')}
                          className={`text-xs font-extrabold flex items-center gap-1.5 ${
                            paymentMethod === 'electronic_card'
                              ? 'text-orange-700'
                              : 'text-[var(--color-text)]'
                          }`}
                        >
                          <span>💳</span>
                          <span>
                            {isEn
                              ? 'Credit / Debit Card Details (Mock)'
                              : 'بيانات البطاقة الائتمانية / بطاقة الخصم المباشر'}
                          </span>
                        </button>
                        <span dir="ltr" className="text-[10px] font-extrabold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
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
                            className="w-full rounded-xl border border-[var(--color-border)] bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-900"
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
                              setTestCardNumber(e.target.value);
                            }}
                            placeholder="4242 •••• •••• 4242"
                            className="w-full rounded-xl border border-[var(--color-border)] bg-slate-50 px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2" dir="ltr">
                        <div>
                          <label htmlFor="mockCardExpiry" className="block text-[10px] font-extrabold text-[var(--color-muted)] mb-0.5">
                            {isEn ? 'Expiry Date (MM/YY)' : 'تاريخ الانتهاء (MM/YY)'}
                          </label>
                          <input
                            id="mockCardExpiry"
                            type="text"
                            value={testCardExpiry}
                            onChange={(e) => {
                              setPaymentMethod('electronic_card');
                              setTestCardExpiry(e.target.value);
                            }}
                            placeholder="09/28"
                            className="w-full rounded-xl border border-[var(--color-border)] bg-slate-50 px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900"
                          />
                        </div>
                        <div>
                          <label htmlFor="mockCardCvv" className="block text-[10px] font-extrabold text-[var(--color-muted)] mb-0.5">
                            {isEn ? 'CVV / Security Code' : 'رمز الأمان (CVV)'}
                          </label>
                          <input
                            id="mockCardCvv"
                            type="text"
                            value={testCardCvv}
                            onChange={(e) => {
                              setPaymentMethod('electronic_card');
                              setTestCardCvv(e.target.value);
                            }}
                            placeholder="888"
                            className="w-full rounded-xl border border-[var(--color-border)] bg-slate-50 px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* CASH ON DELIVERY (الدفع عند الاستلام) DETAILS */
                  <div
                    data-testid="cod-payment-box"
                    className="rounded-2xl border border-emerald-300 bg-white p-3.5 space-y-2 shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-950 text-[10px] font-extrabold">
                        💵 {isEn ? 'CASH ON DELIVERY SELECTED' : 'تم اختيار الدفع عند الاستلام'}
                      </span>
                      <span className="text-xs font-extrabold text-emerald-900">
                        {isEn ? 'No upfront payment needed' : 'لا يتطلب بطاقة بنكية'}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-[var(--color-text)] leading-relaxed">
                      {isEn
                        ? 'You will pay the courier directly upon receiving your order at your doorstep (Cash or portable POS terminal available).'
                        : 'سيتم تحصيل قيمة الطلب مباشرة عند وصول مندوب التوصيل لباب المنزل (متاح الدفع نقدًا أو عبر جهاز الشبكة المحمول مع المندوب).'}
                    </p>
                  </div>
                )}

                {/* Order Cost Summary Breakdown */}
                <div className="rounded-xl bg-white/90 border border-orange-200/80 p-3 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-[var(--color-muted)] font-bold">
                    <span>{isEn ? 'Items Subtotal:' : 'قيمة المنتجات:'}</span>
                    <span className="tabular-nums">{formatCurrency(cartTotalAmount, currency, language)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[var(--color-muted)] font-bold">
                    <span>{isEn ? 'Express Delivery:' : 'رسوم التوصيل السريع:'}</span>
                    <span className="tabular-nums">{formatCurrency(deliveryFee, currency, language)}</span>
                  </div>
                  {codFee > 0 && (
                    <div className="flex items-center justify-between text-emerald-800 font-bold">
                      <span>{isEn ? 'Cash on Delivery Service:' : 'رسوم خدمة الدفع عند الاستلام:'}</span>
                      <span className="tabular-nums">{formatCurrency(codFee, currency, language)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm font-extrabold text-orange-950 pt-1.5 border-t border-orange-100">
                    <span>{isEn ? 'Total Amount:' : 'الإجمالي النهائي للطلب:'}</span>
                    <span className="tabular-nums text-base">
                      {formatCurrency(grandTotal, currency, language)}
                    </span>
                  </div>
                </div>

                {/* Primary Confirm Checkout CTA */}
                <PrimaryCtaButton
                  variant="orange"
                  size="lg"
                  onClick={() => handleProcessTestPayment()}
                  disabled={paymentProcessing}
                  className="w-full"
                >
                  {paymentProcessing
                    ? isEn
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

      {/* Horizontal Scrollable Category & Featured Picks Carousels (UI Decluttering & Breathing Room) */}
      <div className="space-y-4">
        <div className="horizontal-scroll-row py-1" role="region" aria-label={isEn ? 'Horizontal Category Carousel' : 'شريط الفئات الأفقي'}>
          {[
            { id: 'all', labelAr: 'كل الفئات', labelEn: 'All Categories' },
            { id: 'toys', labelAr: 'ألعاب مونتيسوري', labelEn: 'Montessori Toys' },
            { id: 'clothing', labelAr: 'ألبسة قطنية', labelEn: 'Cotton Apparel' },
            { id: 'essentials', labelAr: 'مستلزمات الرضع', labelEn: 'Baby Essentials' },
            { id: 'doctor', labelAr: 'أطباء وعيادات', labelEn: 'Doctors & Clinics' },
            { id: 'nursery', labelAr: 'حضانات ومدارس', labelEn: 'Nurseries' },
            { id: 'consultation', labelAr: 'استشارات تربوية', labelEn: 'Consultations' },
          ].map((cat) => {
            const bgSpec = getCardBackgroundSpec(cat.id, darkMode);
            const isSelected = categoryFilter === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                data-image-card="true"
                data-category-image-card={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                style={{ backgroundImage: bgSpec.backgroundImageCss }}
                className={`image-bg-card min-h-[60px] min-w-[146px] px-5 py-3 rounded-2xl text-xs font-extrabold transition-all flex items-center justify-center text-center whitespace-nowrap ${
                  isSelected
                    ? 'ring-2 ring-amber-400 shadow-lg'
                    : 'opacity-95 hover:opacity-100'
                }`}
              >
                <span className="image-card-title tracking-wide">
                  {isEn ? cat.labelEn : cat.labelAr}
                </span>
              </button>
            );
          })}
        </div>

        {/* Horizontal Featured Bestsellers Carousel */}
        <div className="rounded-[24px] border border-[var(--color-border)]/50 bg-[var(--color-surface)] p-5 sm:p-6 space-y-4 soft-card-surface">
          <div className="section-heading-block">
            <h3 className="section-heading-centered">
              {isEn ? 'Featured Picks Carousel' : 'مختارات الأسرة السريعة'}
            </h3>
            <p className="section-subtitle-centered">
              {isEn
                ? 'Swipe horizontally to explore top-rated Montessori & family essentials'
                : 'اسحب أفقيًا لاستعراض أفضل منتجات وخدمات الأسرة المختارة'}
            </p>
          </div>

          <div
            data-testid="store-horizontal-carousel"
            className="horizontal-scroll-row pt-1"
          >
            {COMMERCIAL_CATALOG.slice(0, 6).map((item) => {
              const priceVal = currency === 'SAR' ? item.priceSAR : item.priceEGP;
              const bgSpec = getCardBackgroundSpec(item.category, darkMode);
              return (
                <div
                  key={`carousel-${item.id}`}
                  data-image-card="true"
                  style={{ backgroundImage: bgSpec.backgroundImageCss }}
                  className="image-bg-card w-[245px] sm:w-[265px] rounded-2xl p-4 flex flex-col justify-between gap-3.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="image-card-badge px-2.5 py-0.5 rounded-full text-[10px] font-extrabold">
                      {locText(item.categoryLabel, language)}
                    </span>
                    <span
                      data-keep-dark-text="true"
                      className="image-card-rating-pill px-2 py-0.5 rounded-lg text-[10px] font-extrabold tabular-nums"
                    >
                      ★ {item.rating}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="image-card-title text-sm font-extrabold line-clamp-1">
                      {isEn ? item.nameEn : item.name}
                    </div>
                    <div className="image-card-subtitle text-[11px] font-semibold">
                      {locText(item.city, language)}
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-white/25">
                    <strong className="text-xs font-extrabold text-amber-200 tabular-nums">
                      {formatCurrency(priceVal, currency, language)}
                    </strong>
                    <button
                      type="button"
                      onClick={() => onAddToCart(item, item.variants?.[0])}
                      className="image-card-cta-pill px-3 py-1.5 rounded-xl text-[11px] font-extrabold shadow-2xs"
                    >
                      {isEn ? '+ Add' : '+ للسلة'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Super App Product & Service Grid Cards (Spacious Breathing Room) */}
      {filtered.length === 0 ? (
        <FriendlyEmptyState
          id="empty-store-filter-state"
          iconId="services"
          tone="amber"
          title={
            isEn
              ? 'No items here yet — No matching products'
              : 'لا توجد عناصر هنا بعد — لا توجد منتجات مطابقة للبحث'
          }
          subtitle={
            isEn
              ? 'Try clearing search filters or selecting another category from the store.'
              : 'جرّب مسح كلمات البحث أو اختيار فئة أخرى لاستعراض منتجات وخدمات الأسرة.'
          }
          actionLabel={isEn ? 'Reset Store Filters' : 'إعادة ضبط فلاتر المتجر'}
          onAction={() => {
            setSearchQuery('');
            setSegment('all');
            setCategoryFilter('all');
            setCollectionFilter('all');
            setCityScopeFilter('all');
          }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((item) => {
            const priceVal = currency === 'SAR' ? item.priceSAR : item.priceEGP;
            const origVal = currency === 'SAR' ? item.originalPriceSAR : item.originalPriceEGP;
            const displayTitle = isEn ? item.nameEn : item.name;
            const toneKey = CATEGORY_TONE_MAP[item.category] || 'amber';
            const tone = PASTEL_CARD_TONES[toneKey];
            const itemBgSpec = getCardBackgroundSpec(item.category, darkMode);

            return (
              <div
                key={item.id}
                className={`rounded-[24px] border ${tone.card} bg-[var(--color-surface)] p-5 flex flex-col justify-between gap-4 soft-card-surface hover:scale-[1.02] active:scale-[1.02] hover:shadow-md transition-all`}
              >
                <div className="space-y-3">
                  {/* Top Visual Header: Image Background Header (No small boring icon box) */}
                  <div
                    onClick={() => onInspectCommercialItem(item)}
                    data-image-card="true"
                    style={{ backgroundImage: itemBgSpec.backgroundImageCss }}
                    className="image-bg-card rounded-2xl p-4 min-h-[96px] cursor-pointer flex flex-col justify-between gap-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="image-card-badge px-2.5 py-0.5 rounded-full text-[10px] font-extrabold">
                        {locText(item.categoryLabel, language)}
                      </span>
                      {item.collectionTag && (
                        <span
                          data-keep-dark-text="true"
                          className="image-card-rating-pill px-2 py-0.5 rounded-md text-[10px] font-extrabold"
                        >
                          {item.collectionTag === 'bestseller'
                            ? isEn
                              ? 'Bestseller'
                              : 'الأكثر مبيعًا'
                            : item.collectionTag === 'new'
                            ? isEn
                              ? 'New'
                              : 'جديد'
                            : item.collectionTag === 'deal'
                            ? isEn
                              ? 'Value Deal'
                              : 'عرض توفير'
                            : isEn
                            ? 'Recommended'
                            : 'موصى به'}
                        </span>
                      )}
                    </div>

                    <div className="flex items-end justify-between gap-2 pt-2">
                      <h3 className="image-card-title text-sm sm:text-base font-extrabold leading-snug line-clamp-2">
                        {displayTitle}
                      </h3>
                      <span className="text-[11px] font-extrabold text-amber-200 tabular-nums shrink-0">
                        ★ {item.rating} ({item.reviewCount || 80})
                      </span>
                    </div>
                  </div>

                  {/* Compact Visual Metadata Strip */}
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold text-[var(--color-muted)]">
                      <span>{locText(item.categoryLabel, language)}</span>
                      <span aria-hidden="true">·</span>
                      <span>📍 {locText(item.city, language)}</span>
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

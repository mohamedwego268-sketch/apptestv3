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
  formatCurrency,
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
}

const CATEGORY_TONE_MAP: Record<string, PastelTone> = {
  toys: 'amber',
  nursery: 'indigo',
  doctor: 'emerald',
  clothing: 'rose',
  essentials: 'sky',
  courses: 'purple',
  sports: 'teal',
  events_parks: 'orange',
  books: 'cyan',
  nutrition: 'lime',
  furniture: 'pink',
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
    subtitleAr: 'تم استلام الطلب وجارٍ تجهيزه',
    subtitleEn: 'Order received for preparation',
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
    subtitleAr: 'يتم تجهيز طلبك الآن',
    subtitleEn: 'Your order is being prepared',
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
    subtitleAr: 'سيظهر تحديث حالة التوصيل هنا',
    subtitleEn: 'The delivery status will appear here',
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
  initialCategoryId = null,
  initialOpenCheckout = false,
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
  const [storeFlowStep, setStoreFlowStep] = useState<'catalog' | 'checkout' | 'confirmed'>(
    initialOpenCheckout ? 'checkout' : 'catalog'
  );
  const [paymentCategory, setPaymentCategory] = useState<'electronic' | 'cod'>('electronic');
  const [paymentMethod, setPaymentMethod] = useState<CheckoutPaymentMethodType>('electronic_card');
  const [testCardHolder, setTestCardHolder] = useState('AHMED & SARA');
  const [testCardNumber, setTestCardNumber] = useState('4242 •••• •••• 4242');
  const [testCardExpiry, setTestCardExpiry] = useState('09/28');
  const [testCardCvv, setTestCardCvv] = useState('888');
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [confirmedOrderSnapshot, setConfirmedOrderSnapshot] = useState<DemoOrder | null>(null);
  const [showLiveTracking, setShowLiveTracking] = useState(initialCategoryId === 'live_tracking');
  const [expandedProductMetaIds, setExpandedProductMetaIds] = useState<number[]>([]);
  const [trackingStageIdx, setTrackingStageIdx] = useState<DeliveryStageIndex>(2);
  const [isAutoSimulatingDelivery, setIsAutoSimulatingDelivery] = useState<boolean>(false);
  const [driverInstructionNote, setDriverInstructionNote] = useState(
    isEn ? 'Leave at door / Don’t ring bell (baby sleeping)' : 'يرجى الاتصال عند الوصول وعدم رن الجرس (الطفل نائم)'
  );

  // Smart Product Comparison State (up to 3 items side-by-side)
  const [compareIds, setCompareIds] = useState<number[]>([
    COMMERCIAL_CATALOG[0]?.id ?? 1,
    COMMERCIAL_CATALOG[1]?.id ?? 2,
  ]);
  const [showComparePanel, setShowComparePanel] = useState<boolean>(false);

  const comparedItems = COMMERCIAL_CATALOG.filter((item) => compareIds.includes(item.id));

  const handleToggleCompareItem = (item: CommercialCatalogItem) => {
    setCompareIds((prev) => {
      if (prev.includes(item.id)) {
        const next = prev.filter((id) => id !== item.id);
        onShowToast(
          isEn
            ? `Removed "${item.nameEn}" from comparison`
            : `تمت إزالة «${item.name}» من المقارنة الذكية`
        );
        return next;
      }
      if (prev.length >= 3) {
        const next = [...prev.slice(1), item.id];
        setShowComparePanel(true);
        onShowToast(
          isEn
            ? `Added "${item.nameEn}" to Smart Comparison (3/3)`
            : `تمت إضافة «${item.name}» للمقارنة الذكية (٣ منتجات)`
        );
        return next;
      }
      const next = [...prev, item.id];
      setShowComparePanel(true);
      onShowToast(
        isEn
          ? `Added "${item.nameEn}" to Smart Comparison (${next.length}/3)`
          : `تمت إضافة «${item.name}» لجدول المقارنة الذكية (${next.length}/3)`
      );
      return next;
    });
  };

  useEffect(() => {
    if (!isAutoSimulatingDelivery) return;
    const timer = window.setInterval(() => {
      setTrackingStageIdx((prev) => ((prev + 1) % 4) as DeliveryStageIndex);
    }, 2400);
    return () => window.clearInterval(timer);
  }, [isAutoSimulatingDelivery]);

  // Dedicated Full-Page Category View state (null = Categorized Horizontal Rows overview)
  const [activeCategoryPageId, setActiveCategoryPageId] = useState<string | null>(
    initialCategoryId === 'live_tracking' ? null : initialCategoryId
  );

  useEffect(() => {
    if (initialCategoryId !== undefined) {
      if (initialCategoryId === 'live_tracking') {
        setActiveCategoryPageId(null);
        setStoreFlowStep('catalog');
        setShowCartPanel(false);
        setShowLiveTracking(true);
      } else {
        setActiveCategoryPageId(initialCategoryId);
        if (initialCategoryId) {
          setStoreFlowStep('catalog');
          setShowCartPanel(false);
        }
      }
    }
  }, [initialCategoryId]);

  useEffect(() => {
    if (initialOpenCheckout) {
      setShowCartPanel(true);
      setStoreFlowStep('checkout');
    }
  }, [initialOpenCheckout]);

  const STORE_CATEGORY_SECTIONS = [
    {
      id: 'toys',
      titleAr: '🧸 ألعاب مونتيسوري وتنمية الذكاء',
      titleEn: '🧸 Montessori & STEM Toys',
      subtitleAr: 'ألعاب خشبية آمنة وبازل لتنمية الذكاء بدون شاشات',
      subtitleEn: 'Wooden Montessori sets, STEM kits & balance bikes',
      badgeAr: '🧸 ألعاب مونتيسوري',
      badgeEn: '🧸 Montessori Toys',
      emoji: '🧸',
      bgKey: 'toys' as const,
      imageUrl: CARD_STOCK_PHOTO_URLS.toys,
      matchCategories: ['toys'],
    },
    {
      id: 'nursery',
      titleAr: '📚 حضانات ومدارس',
      titleEn: '📚 Nurseries & Preschools',
      subtitleAr: 'استكشف الحضانات والمدارس القريبة وتعرّف على تفاصيلها',
      subtitleEn: 'Explore nearby nurseries and preschools',
      badgeAr: '📚 حضانات ومدارس',
      badgeEn: '📚 Nurseries & Schools',
      emoji: '📚',
      bgKey: 'nursery' as const,
      imageUrl: CARD_STOCK_PHOTO_URLS.nursery,
      matchCategories: ['nursery'],
    },
    {
      id: 'doctor',
      titleAr: '🩺 أطباء أطفال وعيادات متخصصة',
      titleEn: '🩺 Pediatricians & Clinics',
      subtitleAr: 'خيارات لطب الأطفال والتغذية وطب الأسنان',
      subtitleEn: 'Pediatric, nutrition and dental care options',
      badgeAr: '🩺 أطباء أطفال',
      badgeEn: '🩺 Pediatricians',
      emoji: '🩺',
      bgKey: 'doctor' as const,
      imageUrl: CARD_STOCK_PHOTO_URLS.doctor,
      matchCategories: ['doctor'],
    },
    {
      id: 'clothing',
      titleAr: '👗 ألبسة قطنية وأزياء أطفال',
      titleEn: '👗 Organic Cotton Apparel',
      subtitleAr: 'ملابس قطنية وأحذية مريحة للأطفال',
      subtitleEn: 'Cotton clothing and comfortable footwear',
      badgeAr: '👗 ألبسة قطنية',
      badgeEn: '👗 Cotton Apparel',
      emoji: '👗',
      bgKey: 'clothing' as const,
      imageUrl: CARD_STOCK_PHOTO_URLS.clothing,
      matchCategories: ['clothing'],
    },
    {
      id: 'essentials',
      titleAr: '🍼 مستلزمات عائلية وعناية يومية',
      titleEn: '🍼 Daily Baby Essentials',
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
      subtitleEn: 'Bedtime stories, pop-up books & illustrated tales',
      badgeAr: '📖 قصص وكتب',
      badgeEn: '📖 Books & Stories',
      emoji: '📖',
      bgKey: 'books' as const,
      imageUrl: CARD_STOCK_PHOTO_URLS.books,
      matchCategories: ['books'],
    },
    {
      id: 'nutrition',
      titleAr: '🍱 تغذية صحية ولانش بوكس',
      titleEn: '🍱 Healthy Kids Nutrition',
      subtitleAr: 'وجبات صحية طازجة وسناكس طبيعية بدون سكر',
      subtitleEn: 'Fresh organic meals & zero-sugar fruit snacks',
      badgeAr: '🍱 تغذية صحية',
      badgeEn: '🍱 Healthy Nutrition',
      emoji: '🍱',
      bgKey: 'nutrition' as const,
      imageUrl: CARD_STOCK_PHOTO_URLS.nutrition,
      matchCategories: ['nutrition'],
    },
    {
      id: 'furniture',
      titleAr: '🪑 أثاث غرف الأطفال ومونتيسوري',
      titleEn: '🪑 Kids Montessori Furniture',
      subtitleAr: 'سراير مونتيسوري، مكاتب مذاكرة، ووحدات تخزين آمنة',
      subtitleEn: 'Montessori floor beds, desks & safe organizers',
      badgeAr: '🪑 أثاث غرف الأطفال',
      badgeEn: '🪑 Kids Furniture',
      emoji: '🪑',
      bgKey: 'furniture' as const,
      imageUrl: CARD_STOCK_PHOTO_URLS.furniture,
      matchCategories: ['furniture'],
    },
    {
      id: 'services',
      titleAr: '👩‍⚕️ استشارات تربوية وتوصيل سريع',
      titleEn: '👩‍⚕️ Consultations & Delivery',
      subtitleAr: 'جلسات إرشاد وتخاطب أونلاين وخيارات توصيل',
      subtitleEn: 'Online parenting consultations & delivery options',
      badgeAr: '👩‍⚕️ استشارات وتوصيل',
      badgeEn: '👩‍⚕️ Consultations',
      emoji: '👩‍⚕️',
      bgKey: 'consultation' as const,
      imageUrl: CARD_STOCK_PHOTO_URLS.consultation,
      matchCategories: ['consultation', 'delivery'],
    },
  ] as const;

  const openCategoryFullPage = (secId: string) => {
    setActiveCategoryPageId(secId);
    setCategoryFilter('all');
    setStoreFlowStep('catalog');
    setShowCartPanel(false);
  };

  const renderCompactProductCard = (
    item: CommercialCatalogItem,
    layoutMode: 'carousel' | 'grid'
  ) => {
    const priceVal = currency === 'SAR' ? item.priceSAR : item.priceEGP;
    const origVal = currency === 'SAR' ? item.originalPriceSAR : item.originalPriceEGP;
    const displayTitle = isEn ? item.nameEn : item.name;
    const toneKey = CATEGORY_TONE_MAP[item.category] || 'amber';
    const tone = PASTEL_CARD_TONES[toneKey];
    const stockImageUrl = item.imageUrl || getProductUnsplashImageUrl(item.category, item.id);
    const itemBgSpec = getCardBackgroundSpec(item.category, darkMode, stockImageUrl);
    const revCount = item.reviewCount || 142;

    return (
      <div
        key={`${layoutMode}-${item.id}`}
        data-store-product-card={item.id}
        className={`${
          layoutMode === 'carousel'
            ? 'w-[236px] sm:w-[256px] shrink-0'
            : 'w-full'
        } rounded-2xl sm:rounded-3xl border ${tone.card} bg-[var(--color-surface)] dark:bg-[#101D26] dark:border-[#1E3646] p-4 sm:p-5 flex flex-col justify-between gap-2 soft-card-surface shadow-sm hover:shadow-md hover:scale-[1.005] active:scale-[0.99] transition-all group`}
      >
        <div className="space-y-1.5">
          {/* Premium Visual Thumbnail with Real Unsplash Stock Image + Directional Gradient + Glassmorphic Title Container */}
          <div
            onClick={() => onInspectCommercialItem(item)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onInspectCommercialItem(item);
              }
            }}
            data-image-card="true"
            style={{ backgroundImage: itemBgSpec.backgroundImageCss }}
            className="image-bg-card relative overflow-hidden rounded-xl p-2.5 min-h-[82px] sm:min-h-[90px] cursor-pointer flex flex-col justify-between gap-1 shadow-2xs"
          >
            <img
              src={stockImageUrl}
              alt={displayTitle}
              loading="lazy"
              decoding="async"
              onError={(e) => {
                const target = e.currentTarget;
                if (target.src !== itemBgSpec.imagePath) {
                  target.src = itemBgSpec.imagePath;
                }
              }}
              className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-85 dark:opacity-80 group-hover:scale-105 transition-transform duration-500"
            />
            {/* Directional Gradient Scrim (WCAG AAA Contrast for Bottom Text, Vibrant Image Top) */}
            <div
              aria-hidden="true"
              className="absolute inset-0 pointer-events-none"
              style={{
                background: darkMode
                  ? 'linear-gradient(to top, rgba(11, 19, 26, 0.95) 0%, rgba(16, 29, 38, 0.62) 52%, rgba(11, 19, 26, 0.28) 100%)'
                  : 'linear-gradient(to top, rgba(255, 255, 255, 0.94) 0%, rgba(248, 250, 252, 0.65) 50%, rgba(255, 255, 255, 0.22) 100%)',
              }}
            />

            <div className="relative z-10 flex items-center justify-between gap-1.5 min-w-0">
              <span className="image-card-badge px-1.5 py-0.5 rounded-full text-[8.5px] font-extrabold truncate shadow-2xs max-w-[65%]">
                {item.emoji} {locText(item.categoryLabel, language)}
              </span>
              <span
                data-keep-dark-text="true"
                className="image-card-rating-pill px-1.5 py-0.5 rounded-full text-[8.5px] font-extrabold tabular-nums shrink-0 inline-flex items-center gap-0.5 shadow-2xs"
              >
                <span>⭐ {item.rating}</span>
                <span className="opacity-85">({revCount})</span>
              </span>
            </div>

            <div className="relative z-10 image-card-glass-panel rounded-lg px-2 py-1 flex items-end justify-between gap-1">
              <h4 className="image-card-title text-[11.5px] sm:text-xs font-extrabold leading-tight line-clamp-1">
                {displayTitle}
              </h4>
            </div>
          </div>

          {/* Layer 3 (Metadata & Tags Carousel): Hidden by default, revealed only on explicit user trigger */}
          {expandedProductMetaIds.includes(item.id) && (
            <div
              data-card-layer="3-metadata-carousel"
              className="flex items-center justify-between gap-2 text-[9.5px] font-bold text-[var(--color-muted)] px-0.5 min-w-0 animate-page-enter"
            >
              <div className="flex items-center gap-1.5 min-w-0 flex-1 overflow-x-auto whitespace-nowrap no-scrollbar py-0.5">
                <span className="px-1.5 py-0.5 rounded-md bg-[var(--color-control-muted)] dark:bg-[#142430] shrink-0">
                  📍 {locText(item.city, language)}
                </span>
                {item.ageStage && (
                  <span className="px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-800 dark:text-amber-300 font-extrabold shrink-0">
                    👶 {item.ageStage === 'all' ? (isEn ? '0–8 yrs' : '٠–٨ سنوات') : `${item.ageStage} ${isEn ? 'yrs' : 'سنوات'}`}
                  </span>
                )}
                {item.deliveryEstimateAr && (
                  <span className="px-1.5 py-0.5 rounded-md bg-teal-500/10 text-teal-700 dark:text-[#2DD4BF] font-extrabold shrink-0">
                    🚚 {isEn ? item.deliveryEstimateEn : item.deliveryEstimateAr}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => onInspectCommercialItem(item)}
                className="text-[9.5px] font-extrabold text-[#0d9488] dark:text-[#A5F3FC] hover:underline shrink-0 ms-auto cursor-pointer"
              >
                {isEn ? 'Details' : 'تفاصيل'}
              </button>
            </div>
          )}
        </div>

        {/* Layer 2 (Action Footer): Fixed, non-overlapping horizontal action row for primary buttons */}
        <div
          data-card-layer="2-action-footer"
          className="pt-2 border-t border-[var(--color-border)]/70 dark:border-[#1E3646] flex items-center justify-between gap-1.5 min-w-0"
        >
          <div
            onClick={() => onInspectCommercialItem(item)}
            className="flex flex-col min-w-0 flex-1 cursor-pointer truncate"
          >
            <div className="flex items-baseline gap-x-1 tabular-nums truncate">
              {origVal && (
                <span className="text-[9.5px] line-through text-[var(--color-muted)] whitespace-nowrap">
                  {formatCurrency(origVal, currency, language)}
                </span>
              )}
              <strong className="text-xs font-extrabold text-[var(--color-text)] whitespace-nowrap">
                {formatCurrency(priceVal, currency, language)}
              </strong>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0 ms-auto">
            {/* Explicit Metadata & Tags Toggle Button (Hidden by Default) */}
            <button
              type="button"
              onClick={() =>
                setExpandedProductMetaIds((prev) =>
                  prev.includes(item.id)
                    ? prev.filter((id) => id !== item.id)
                    : [...prev, item.id]
                )
              }
              aria-expanded={expandedProductMetaIds.includes(item.id)}
              title={isEn ? 'Toggle location, age & delivery info' : 'عرض الموقع والسن والتوصيل'}
              aria-label={isEn ? 'Toggle product metadata' : 'عرض تفاصيل التوصيل والسن'}
              className={`w-7 h-7 rounded-lg border text-[10px] font-extrabold flex items-center justify-center shadow-2xs active:scale-90 transition-all shrink-0 cursor-pointer ${
                expandedProductMetaIds.includes(item.id)
                  ? 'border-[#0d9488] bg-[#0d9488]/15 text-[#0d9488] dark:text-[#2DD4BF]'
                  : 'border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-muted)] dark:bg-[#142430] text-[var(--color-muted)] hover:border-[#0d9488]'
              }`}
            >
              ℹ️
            </button>

            {/* Smart Product Comparison Toggle Button (Modern Dual Opposing Arrows ⇄) */}
            <button
              type="button"
              onClick={() => handleToggleCompareItem(item)}
              aria-pressed={compareIds.includes(item.id)}
              title={
                compareIds.includes(item.id)
                  ? isEn
                    ? 'In Comparison (Tap to remove)'
                    : 'مضاف للمقارنة (اضغط للإزالة)'
                  : isEn
                  ? 'Compare Product Specs'
                  : 'قارن مواصفات وسعر المنتج'
              }
              aria-label={isEn ? 'Compare Product' : 'مقارنة المنتج'}
              className={`h-7 px-2 rounded-lg border text-[9.5px] font-extrabold flex items-center justify-center gap-1 shadow-2xs active:scale-90 transition-all shrink-0 cursor-pointer ${
                compareIds.includes(item.id)
                  ? 'border-[#0d9488] bg-[#0d9488] text-white'
                  : 'border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-muted)] dark:bg-[#142430] text-[var(--color-text)] dark:text-[#A5F3FC] hover:border-[#0d9488]'
              }`}
            >
              <CompareArrowsIcon size={13} />
              <span className="hidden md:inline">
                {compareIds.includes(item.id)
                  ? isEn
                    ? 'Comparing'
                    : 'في المقارنة'
                  : isEn
                  ? 'Compare'
                  : 'قارن'}
              </span>
            </button>

            {/* Minimalist Wishlist / Heart Icon (Warm Coral #FF8C61) */}
            <button
              type="button"
              onClick={() => onAddProductToWishes(item)}
              title={isEn ? 'Save to Wishlist' : 'احفظ في الأمنيات'}
              aria-label={isEn ? 'Save to Wishlist' : 'احفظ في الأمنيات'}
              className="w-7 h-7 rounded-lg border border-orange-200/80 dark:border-[#1E3646] bg-orange-50/80 dark:bg-[#142430] text-[#FF8C61] hover:bg-[#FF8C61] hover:text-white flex items-center justify-center shadow-2xs active:scale-90 transition-all shrink-0 cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
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
              className="w-7 h-7 rounded-lg bg-[#0d9488] hover:bg-[#0f766e] text-white flex items-center justify-center shadow-2xs active:scale-90 transition-all shrink-0 cursor-pointer"
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
    master.sequencedCatalog && master.sequencedCatalog.length > 0
      ? master.sequencedCatalog
      : COMMERCIAL_CATALOG;

  const filtered = activeCatalogSource.filter((item) => {
    if (segment !== 'all' && item.kind !== segment) return false;
    if (collectionFilter !== 'all' && item.collectionTag !== collectionFilter) return false;
    if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
    if (cityScopeFilter === 'local' && item.kind === 'service') {
      const matchesCountry = item.country === 'ALL' || item.country === country;
      const matchesCity = !item.city || item.city === city || item.city === 'ALL' || item.city === 'كل المدن' || item.city.includes(city);
      if (!matchesCountry || !matchesCity) return false;
    }
    const itemPrice = currency === 'SAR' ? item.priceSAR : item.priceEGP;
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
    if (availabilityFilter === 'offers' && item.kind !== 'offer' && item.collectionTag !== 'deal') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const seqCode = formatProductSequenceCode(item.id).toLowerCase();
      const match =
        seqCode.includes(q) ||
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
            ? 'Please complete your card details to proceed with Electronic Payment.'
            : 'يرجى استكمال بيانات البطاقة البنكية لإتمام الدفع الإلكتروني.'
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
        ? `Delivery options in ${displayCity} · Sample tracking`
        : `خيارات التوصيل في ${city} · نموذج توضيحي للتتبع`,
      ctaLabel: isEn ? 'Explore Toys & Entertainment' : 'استكشف قسم الألعاب والترفيه',
      onCtaClick: () => openCategoryFullPage('toys'),
      iconId: 'services',
      gradient: 'linear-gradient(125deg, #fff4e6, #ffedd5, #fde8ef)',
      ctaVariant: 'orange',
    },
    {
      id: 'store-slide-tracking',
      badge: isEn ? '🛵 Sample Delivery Tracking' : '🛵 نموذج تتبع الطلبات',
      title: isEn
        ? 'Sample Order Timeline & Delivery Route'
        : 'عرض توضيحي لمراحل الطلب ومسار التوصيل',
      subtitle: isEn
        ? 'Order Received → Preparing → Out for Delivery'
        : 'تم الاستلام ← جاري التحضير ← في الطريق إليك',
      ctaLabel: isEn ? 'Open Tracking Demo' : 'افتح نموذج التتبع',
      onCtaClick: () => setShowLiveTracking(true),
      iconId: 'cart',
      gradient: 'linear-gradient(125deg, #ecfdf5, #d1fae5, #e0f2fe)',
      ctaVariant: 'emerald',
    },
    {
      id: 'store-slide-nurseries',
      badge: isEn ? '🏫 Nurseries, Preschools & Schools' : '🏫 دليل الحضانات والمدارس',
      title: isEn
        ? `Nurseries, Preschools & Academies in ${displayCity}`
        : `الحضانات والمدارس المتاحة في ${city}`,
      subtitle: isEn
        ? 'Directory listings · Ratings shown in this demo'
        : 'ملفات الدليل · التقييمات المعروضة في النموذج',
      ctaLabel: isEn ? 'View All Schools & Nurseries' : 'عرض قسم الحضانات والمدارس',
      onCtaClick: () => openCategoryFullPage('nursery'),
      iconId: 'children',
      gradient: 'linear-gradient(125deg, #eef2ff, #e0e7ff, #f3e8ff)',
      ctaVariant: 'indigo',
    },
  ];

  const activeCategorySpec = STORE_CATEGORY_SECTIONS.find((s) => s.id === activeCategoryPageId) || null;

  return (
    <section className="space-y-4" aria-label={isEn ? 'Family Store & Services' : 'المتجر والخدمات'}>
      {/* 1. Auto-Play Hero Carousel at the VERY TOP of the Store page */}
      {storeFlowStep === 'catalog' && !activeCategorySpec && (
        <SwipeableBannerCarousel
          slides={storeBanners}
          language={language}
          darkMode={darkMode}
          autoPlayMs={4500}
          ariaLabel={isEn ? 'Store Offers Carousel' : 'لافتات عروض المتجر المتحركة'}
        />
      )}

      <SectionToolsDrawer
        language={language}
        sectionId="store"
        titleAr="أدوات المتجر"
        titleEn="Store tools"
        badgeCount={activeFiltersCount}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholderAr="🔍 ابحث في المتجر والخدمات..."
        searchPlaceholderEn="🔍 Search store & services..."
        quickActions={[
          {
            id: 'filter-panel',
            icon: '⚙️',
            labelAr: 'تصفية وفلترة',
            labelEn: 'Filters',
            badge: activeFiltersCount > 0 ? activeFiltersCount : undefined,
            active: showFilterPanel || activeFiltersCount > 0,
            onClick: () => setShowFilterPanel((prev) => !prev),
          },
          {
            id: 'compare-panel',
            icon: '⇄',
            labelAr: 'المقارنة',
            labelEn: 'Compare',
            badge: `${comparedItems.length}/3`,
            active: showComparePanel,
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
            onClick: () => {
              setStoreFlowStep('catalog');
              setShowCartPanel(false);
              setShowLiveTracking((prev) => (storeFlowStep !== 'catalog' ? true : !prev));
            },
          },
        ]}
      >
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-control-muted)] p-2.5 space-y-2.5">
          <div className="space-y-1.5">
            <p className="text-xs font-extrabold text-[var(--color-text)]">
              {isEn ? 'Browse scope' : 'نطاق التصفح'}
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => setCityScopeFilter('all')}
                className={`min-h-[34px] rounded-lg px-2 text-[11px] font-bold cursor-pointer ${
                  cityScopeFilter === 'all'
                    ? 'bg-[var(--color-accent)] text-[var(--color-accent-contrast)]'
                    : 'bg-[var(--color-surface)] text-[var(--color-muted)]'
                }`}
              >
                {isEn ? 'All cities' : 'كل المدن'}
              </button>
              <button
                type="button"
                onClick={() => setCityScopeFilter('local')}
                className={`min-h-[34px] rounded-lg px-2 text-[11px] font-bold truncate cursor-pointer ${
                  cityScopeFilter === 'local'
                    ? 'bg-[var(--color-accent)] text-[var(--color-accent-contrast)]'
                    : 'bg-[var(--color-surface)] text-[var(--color-muted)]'
                }`}
              >
                📍 {displayCity}
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label
              htmlFor="store-drawer-sort-select"
              className="block text-xs font-extrabold text-[var(--color-text)]"
            >
              {isEn ? 'Sort products' : 'ترتيب المنتجات'}
            </label>
            <select
              id="store-drawer-sort-select"
              aria-label={isEn ? 'Sort products' : 'ترتيب المنتجات'}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="w-full min-h-[36px] rounded-xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-surface)] dark:bg-[#142430] px-3 py-1.5 text-xs font-extrabold text-[var(--color-text)]"
            >
              <option value="featured">{isEn ? 'Sort: Featured' : 'الترتيب: المختارات'}</option>
              <option value="price-asc">{isEn ? 'Price: Low to High' : 'السعر: الأقل أولًا'}</option>
              <option value="price-desc">{isEn ? 'Price: High to Low' : 'السعر: الأعلى أولًا'}</option>
              <option value="rating">{isEn ? 'Top Rated' : 'الأعلى تقييمًا'}</option>
            </select>
          </div>
        </div>
      </SectionToolsDrawer>

      {/* Horizontal Swipeable Category Bar + Collapsible Filter Panel (triggered from SectionToolsDrawer) */}
      <div className="rounded-[24px] border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-surface)] dark:bg-[#101D26] p-3.5 sm:p-4 space-y-3 soft-card-surface">
        <div
          dir={isEn ? 'ltr' : 'rtl'}
          className="horizontal-scroll-row !pb-1"
          role="region"
          aria-label={isEn ? 'Store Category Navigation' : 'شريط أقسام المتجر'}
        >
          <button
            type="button"
            onClick={() => {
              setActiveCategoryPageId(null);
              setCategoryFilter('all');
            }}
            className={`min-h-[42px] px-4 py-2 rounded-xl text-xs font-extrabold border transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeCategoryPageId === null
                ? 'bg-[#0d9488] text-white border-teal-500 shadow-sm'
                : 'bg-[var(--color-control-muted)] dark:bg-[#142430] text-[var(--color-text)] border-[var(--color-border)] dark:border-[#1E3646]'
            }`}
          >
            <span>✨</span>
            <span>{isEn ? 'All Category Rows' : 'جميع الأقسام (صفوف أفقية)'}</span>
          </button>

          {STORE_CATEGORY_SECTIONS.map((sec) => {
            const isSelected = activeCategoryPageId === sec.id;
            const secCount = filtered.filter((item) =>
              (sec.matchCategories as readonly string[]).includes(item.category)
            ).length;
            return (
              <button
                key={sec.id}
                type="button"
                data-testid={`store-category-pill-${sec.id}`}
                onClick={() => openCategoryFullPage(sec.id)}
                className={`min-h-[42px] px-4 py-2 rounded-xl text-xs font-extrabold border transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? 'bg-[#FF8C61] text-white border-[#FF8C61] shadow-sm'
                    : 'bg-[var(--color-control-muted)] dark:bg-[#142430] text-[var(--color-text)] border-[var(--color-border)] dark:border-[#1E3646] hover:border-[#FF8C61]'
                }`}
              >
                <span>{sec.emoji}</span>
                <span>{isEn ? sec.badgeEn : sec.badgeAr}</span>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/15 text-current tabular-nums">
                  {secCount}
                </span>
              </button>
            );
          })}
        </div>

        {/* Interactive Store Filter Panel (Price, Rating, Availability — toggled from SectionToolsDrawer) */}
        {showFilterPanel && (
          <div
            id="store-category-filter-panel"
            data-testid="store-category-filter-panel"
            className="soft-card-surface rounded-2xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-surface)] dark:bg-[#101D26] p-4 space-y-4 animate-page-enter"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-[var(--color-border)] dark:border-[#1E3646]">
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-[var(--color-text)] dark:text-[#F8FAFC]">
                  🎛️ {isEn ? 'Smart Store Filters (Price · Rating · Availability)' : 'فلترة المتجر الذكية (السعر · التقييم · التوفر)'}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-teal-500/15 text-teal-700 dark:text-[#A5F3FC] tabular-nums">
                  {filtered.length} {isEn ? 'items match' : 'منتج وخدمة مطابقة'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={resetStoreFilters}
                  className="px-3 py-1 rounded-lg text-[11px] font-extrabold border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-muted)] dark:bg-[#142430] text-[var(--color-text)] dark:text-[#F8FAFC] hover:border-[#FF8C61]"
                >
                  {isEn ? 'Reset All' : 'إعادة ضبط الفلاتر'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowFilterPanel(false)}
                  aria-label={isEn ? 'Close filter panel' : 'إغلاق لوحة الفلترة'}
                  className="w-8 h-8 rounded-xl text-lg font-black leading-none bg-[#0d9488] text-white flex items-center justify-center shrink-0 cursor-pointer"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {/* 1. Price Filter */}
              <div className="rounded-xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-muted)]/60 dark:bg-[#142430] p-3 space-y-2">
                <div className="text-xs font-extrabold text-[var(--color-text)] dark:text-[#A5F3FC]">
                  💰 {isEn ? `Price Range (${currency})` : `نطاق السعر (${currency === 'SAR' ? 'ر.س' : 'ج.م'})`}
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
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-extrabold border transition-all ${
                        priceRangeFilter === opt.id
                          ? 'bg-[#0d9488] text-white border-teal-500 shadow-2xs'
                          : 'bg-[var(--color-surface)] dark:bg-[#101D26] text-[var(--color-text)] dark:text-[#F8FAFC] border-[var(--color-border)] dark:border-[#1E3646]'
                      }`}
                    >
                      {isEn ? opt.labelEn : opt.labelAr}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Rating Filter */}
              <div className="rounded-xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-muted)]/60 dark:bg-[#142430] p-3 space-y-2">
                <div className="text-xs font-extrabold text-[var(--color-text)] dark:text-[#A5F3FC]">
                  ⭐ {isEn ? 'Minimum Parent Rating' : 'تقييم الأمهات والآباء'}
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { val: 0, labelAr: 'كل التقييمات', labelEn: 'All Ratings' },
                    { val: 4.5, labelAr: '⭐ +4.5 ممتاز', labelEn: '⭐ 4.5+ & Up' },
                    { val: 4.8, labelAr: '⭐ +4.8 فائق', labelEn: '⭐ 4.8+ Top' },
                    { val: 4.9, labelAr: '⭐ +4.9 النخبة', labelEn: '⭐ 4.9+ Elite' },
                  ].map((opt) => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => setMinRatingFilter(opt.val)}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-extrabold border transition-all ${
                        minRatingFilter === opt.val
                          ? 'bg-[#FF8C61] text-white border-[#FF8C61] shadow-2xs'
                          : 'bg-[var(--color-surface)] dark:bg-[#101D26] text-[var(--color-text)] dark:text-[#F8FAFC] border-[var(--color-border)] dark:border-[#1E3646]'
                      }`}
                    >
                      {isEn ? opt.labelEn : opt.labelAr}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Availability Filter */}
              <div className="rounded-xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-muted)]/60 dark:bg-[#142430] p-3 space-y-2">
                <div className="text-xs font-extrabold text-[var(--color-text)] dark:text-[#A5F3FC]">
                  🚚 {isEn ? 'Availability & Delivery' : 'التوفر والشحن السريع'}
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'all', labelAr: 'الكل متاح', labelEn: 'All Available' },
                    { id: 'express', labelAr: 'شحن فوري (منتجات)', labelEn: 'Express In-Stock' },
                    { id: 'local', labelAr: `متاح في ${displayCity}`, labelEn: `In ${displayCity}` },
                    { id: 'offers', labelAr: 'عروض وخصومات', labelEn: 'Active Deals' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setAvailabilityFilter(opt.id as typeof availabilityFilter)}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-extrabold border transition-all ${
                        availabilityFilter === opt.id
                          ? 'bg-[#0d9488] text-white border-teal-500 shadow-2xs'
                          : 'bg-[var(--color-surface)] dark:bg-[#101D26] text-[var(--color-text)] dark:text-[#F8FAFC] border-[var(--color-border)] dark:border-[#1E3646]'
                      }`}
                    >
                      {isEn ? opt.labelEn : opt.labelAr}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Compact store controls: location context + cart only. Filters and secondary actions live in the tools drawer. */}
      <div id="store-sticky-subheader" className="sticky top-[48px] z-20 rounded-xl border border-amber-200/60 dark:border-[#1E3646] bg-amber-50/90 dark:bg-[#101D26]/95 px-2.5 py-2 shadow-2xs flex items-center justify-between gap-2">
        <div className="min-w-0 flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-white dark:bg-[#142430] flex items-center justify-center shrink-0"><ThreeDIcon id="services" size={17} /></span>
          <div className="min-w-0">
            <p className="text-[11px] font-extrabold text-[var(--color-text)] truncate">{isEn ? 'Family store' : 'متجر الأسرة'}</p>
            <p className="text-[9px] font-bold text-[var(--color-muted)] truncate">{country === 'SA' ? (isEn ? '🇸🇦 Saudi Arabia' : '🇸🇦 السعودية') : isEn ? '🇪🇬 Egypt' : '🇪🇬 مصر'} · {displayCity} · {currency}</p>
          </div>
        </div>
        <PrimaryCtaButton variant="orange" size="sm" onClick={() => { setShowCartPanel(true); setStoreFlowStep('checkout'); }}>
          🛒 {isEn ? `Cart (${cartTotalCount})` : `السلة (${cartTotalCount})`}
        </PrimaryCtaButton>
      </div>

      {/* Checkout progress appears only while completing an order, not while browsing the store. */}
      {storeFlowStep !== 'catalog' && (
        <div className="rounded-xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-surface)] dark:bg-[#101D26] p-2 shadow-2xs">
          <div className="flex items-center justify-between gap-1.5 text-[10px] font-bold text-[var(--color-muted)]">
            <span>🛍️ {isEn ? 'Store' : 'المتجر'}</span><span>›</span>
            <span>💳 {isEn ? 'Checkout' : 'الدفع'}</span><span>›</span>
            <span>✅ {isEn ? 'Confirmed' : 'التأكيد'}</span>
          </div>
          <p className="mt-1 text-center text-[9px] text-[var(--color-muted)]">🔒 {isEn ? 'Secure checkout' : 'معاملات دفع آمنة'}</p>
        </div>
      )}

      {/* =====================================================================
          LIVE ORDER TRACKING & ROUTE MAP (Hidden by default; shown only via explicit trigger)
          ===================================================================== */}
      {storeFlowStep === 'catalog' && showLiveTracking && (
        <CollapsibleSectionCard
          id="talabat-live-order-tracker"
          icon="🛵"
          cardTone="emerald"
          isOpen={showLiveTracking}
          onToggle={setShowLiveTracking}
          defaultOpen={false}
          title={isEn ? 'Sample Delivery Tracking & Route Map' : 'تتبع الطلب المباشر وخريطة التوصيل'}
          subtitle={
            isEn
              ? `Status: ${activeStage.titleEn} · ETA: ${
                  activeStage.etaMinutes === 0 ? 'Arrived ✓' : `${activeStage.etaMinutes} mins`
                }`
              : `الحالة: ${activeStage.titleAr} · المتوقع: ${
                  activeStage.etaMinutes === 0 ? 'وصل الطلب ✓' : `${activeStage.etaMinutes} دقيقة`
                }`
          }
          badge={
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-[#142430] text-emerald-900 dark:text-[#A5F3FC] text-[10px] font-extrabold border border-emerald-200/50 dark:border-[#1E3646]">
              #{latestOrder ? latestOrder.id : 'FS-9042'} · {isEn ? 'LIVE GPS' : 'تتبع حي'}
            </span>
          }
          bodyClassName="p-4 sm:p-5 space-y-4 bg-gradient-to-br from-emerald-50/70 via-white to-teal-50/50 dark:from-[#101D26] dark:via-[#101D26] dark:to-[#101D26]"
        >
          {/* Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center text-xl shadow-2xs shrink-0">
                🛵
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-[#142430] text-emerald-900 dark:text-[#A5F3FC] text-[10px] font-extrabold">
                    {isEn ? 'LIVE GPS TRACKING' : 'تتبع مباشر لحالة الطلب'}
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

            <div className="flex flex-wrap items-center gap-2">
              <button
                id="toggle-auto-delivery-sim-btn"
                type="button"
                onClick={() => setIsAutoSimulatingDelivery((prev) => !prev)}
                aria-pressed={isAutoSimulatingDelivery}
                className={`min-h-[36px] px-3 py-1.5 rounded-xl text-[11px] font-extrabold border transition-all flex items-center gap-1.5 cursor-pointer ${
                  isAutoSimulatingDelivery
                    ? 'border-amber-400 bg-amber-500 text-slate-950 shadow-sm'
                    : 'border-emerald-300 dark:border-[#1E3646] bg-emerald-50 dark:bg-[#142430] text-emerald-900 dark:text-[#A5F3FC] hover:border-emerald-500'
                }`}
              >
                <span>{isAutoSimulatingDelivery ? '⏸️' : '▶️'}</span>
                <span>
                  {isAutoSimulatingDelivery
                    ? isEn
                      ? 'Live Updates Active'
                      : 'تحديث مباشر نشط'
                    : isEn
                    ? 'Auto-Update Status'
                    : 'تحديث تلقائي للحالة'}
                </span>
              </button>

              <div className="rounded-xl bg-[#142430] border border-[#1E3646] text-white px-3 py-1.5 text-center shadow-2xs">
                <div className="text-[9px] font-bold text-[#A5F3FC] uppercase">
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
                className="min-h-[34px] px-2.5 py-1 rounded-xl text-[11px] font-extrabold border border-[var(--color-border)] dark:border-[#1E3646] bg-white dark:bg-[#142430] text-[var(--color-muted)]"
              >
                {isEn ? 'Hide' : 'إخفاء'}
              </button>
            </div>
          </div>

          {/* Status Timeline Stepper */}
          <div className="space-y-2">
            <div className="w-full h-2 rounded-full bg-emerald-100 dark:bg-[#142430] overflow-hidden">
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
                        ? 'border-emerald-600 bg-emerald-50/95 dark:bg-[#142430] ring-2 ring-emerald-500/20 shadow-2xs'
                        : isDone
                        ? 'border-emerald-200 dark:border-[#1E3646] bg-white dark:bg-[#101D26] text-emerald-950 dark:text-[#F8FAFC]'
                        : 'border-[var(--color-border)] dark:border-[#1E3646] bg-white/60 dark:bg-[#101D26] text-[var(--color-muted)]'
                    }`}
                  >
                    <span className="w-8 h-8 rounded-lg bg-white dark:bg-[#142430] border border-emerald-100 dark:border-[#1E3646] flex items-center justify-center text-base shrink-0 shadow-2xs">
                      {stage.icon}
                    </span>
                    <div className="min-w-0">
                      <div className="text-[11px] font-extrabold text-[var(--color-text)] truncate">
                        {isEn ? stage.titleEn : stage.titleAr}
                      </div>
                      <div className="text-[10px] font-bold text-emerald-700 dark:text-[#2DD4BF]">
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
            <div className="rounded-2xl border border-emerald-200 dark:border-[#1E3646] bg-[#0B131A] text-white p-3 relative overflow-hidden min-h-[195px] flex flex-col justify-between">
              <div className="flex items-center justify-between gap-2 z-10 text-[11px] font-bold">
                <span className="px-2.5 py-1 rounded-lg bg-[#142430] border border-[#1E3646] text-[#A5F3FC]">
                  🛰️ {isEn ? `Live Route · ${displayCity}` : `خريطة التوصيل المباشرة · ${city}`}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-[#142430] border border-[#1E3646] text-white tabular-nums">
                  📍 {locText(shippingAddress.streetDetails, language) || (isEn ? 'Family Home' : 'منزل الأسرة')}
                </span>
              </div>

              <svg
                viewBox="0 0 400 165"
                className="w-full h-36 my-1 rounded-xl"
                role="img"
                aria-label={isEn ? 'Live Delivery Route Map' : 'خريطة مسار المندوب المباشرة'}
              >
                <defs>
                  <linearGradient id="mapBgGrad" x1="0" y1="0" x2="1" y2="1">
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
                <text x="305" y="34" fill="#a7f3d0" fontSize="10" fontWeight="bold">
                  {isEn ? 'Home' : 'المنزل'}
                </text>

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
                    {isEn ? '▶ Next Stage' : '▶ المرحلة التالية'}
                  </button>
                </div>
              </div>
            </div>

            {/* Driver Contact & Delivery Instructions Card */}
            <div className="rounded-2xl border border-emerald-200/90 dark:border-[#1E3646] bg-white dark:bg-[#101D26] p-3.5 flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-[#142430] border border-emerald-200 dark:border-[#1E3646] flex items-center justify-center text-2xl shrink-0">
                    👷🏻‍♂️
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-extrabold text-[var(--color-text)]">
                      {isEn ? 'Sample Courier Profile' : 'ملف مندوب تجريبي'}
                    </div>
                    <div className="text-[11px] font-bold text-emerald-800 dark:text-[#2DD4BF]">
                      {isEn ? 'Sample courier profile · Demo only' : 'ملف مندوب توصيل تجريبي'}
                    </div>
                  </div>
                </div>
                <span className="px-2 py-1 rounded-lg bg-emerald-50 dark:bg-[#142430] text-emerald-900 dark:text-[#A5F3FC] text-[10px] font-extrabold tabular-nums">
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
                  className="w-full rounded-xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-bg)] dark:bg-[#142430] px-2.5 py-1.5 text-xs font-semibold text-[var(--color-text)]"
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
                  className="min-h-[36px] px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-[#1E3646] bg-emerald-50 dark:bg-[#142430] text-emerald-950 dark:text-[#A5F3FC] text-xs font-extrabold flex items-center justify-center gap-1.5"
                >
                  <span>💬</span>
                  <span>{isEn ? 'Message' : 'رسالة سريعة'}</span>
                </button>
              </div>
            </div>
          </div>
        </CollapsibleSectionCard>
      )}

      {/* =====================================================================
          COMPLETE MOCK CHECKOUT & PAYMENT FLOW (إتمام الطلب ومحاكاة الدفع)
          + PAYMENT SUCCESSFUL / ORDER CONFIRMED SCREEN
          ===================================================================== */}
      {(showCartPanel || storeFlowStep === 'checkout' || storeFlowStep === 'confirmed') && (
        <div
          id="shopping-cart-panel"
          data-testid="store-checkout-flow-container"
          className="rounded-[22px] border-2 border-orange-300 dark:border-[#1E3646] bg-[var(--color-surface)] dark:bg-[#101D26] p-4 sm:p-5 space-y-4 shadow-md"
        >
          {/* Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[var(--color-border)] dark:border-[#1E3646]">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-orange-50 dark:bg-[#142430] border border-orange-200 dark:border-[#1E3646] flex items-center justify-center">
                <ThreeDIcon id="cart" size={26} />
              </div>
              <div>
                <span className="inline-block px-2 py-0.5 rounded-md bg-orange-100 dark:bg-[#142430] text-orange-900 dark:text-[#FDBA74] text-[10px] font-extrabold">
                  {storeFlowStep === 'confirmed'
                    ? isEn
                      ? 'ORDER CONFIRMED'
                      : 'تم الدفع وتأكيد الطلب بنجاح'
                    : isEn
                    ? 'SECURE CHECKOUT'
                    : 'شاشة إتمام الطلب وتأكيد الدفع'}
                </span>
                <h3 className="text-sm sm:text-base font-extrabold text-[var(--color-text)] mt-0.5">
                  {storeFlowStep === 'confirmed'
                    ? isEn
                      ? 'Payment Successful & Order Confirmed'
                      : 'تمت عملية الدفع وتأكيد طلب الأسرة بنجاح'
                    : isEn
                    ? 'Checkout — Select Payment Method'
                    : 'إتمام الطلب — اختيار وسيلة الدفع وتأكيد الشحن'}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {storeFlowStep === 'checkout' && cart.length > 0 && (
                <button
                  id="clear-cart-empty-btn"
                  type="button"
                  onClick={handleClearCartForEmptyState}
                  className="min-h-[36px] px-3 py-1 rounded-xl text-xs font-extrabold border border-rose-200 dark:border-[#1E3646] bg-rose-50 dark:bg-[#142430] text-rose-900 dark:text-[#FDA4AF] hover:bg-rose-100 transition-colors"
                >
                  🗑️ {isEn ? 'Clear Cart' : 'تفريغ السلة'}
                </button>
              )}
              {storeFlowStep === 'confirmed' && (
                <button
                  type="button"
                  onClick={() => setStoreFlowStep('checkout')}
                  className="min-h-[36px] px-3 py-1 rounded-xl text-xs font-extrabold border border-orange-300 dark:border-[#1E3646] bg-orange-50 dark:bg-[#142430] text-orange-950 dark:text-[#FDBA74]"
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
                aria-label={isEn ? 'Close Cart & Checkout' : 'إغلاق السلة وإتمام الطلب'}
                className="w-8 h-8 rounded-xl text-lg font-black leading-none border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-muted)] dark:bg-[#142430] text-[var(--color-text)] hover:border-[#FF8C61] flex items-center justify-center shrink-0 cursor-pointer"
              >
                ×
              </button>
            </div>
          </div>

          {storeFlowStep === 'confirmed' ? (
            <div
              id="store-order-confirmed-screen"
              data-testid="payment-successful-screen"
              className="rounded-[20px] border-2 border-emerald-300 dark:border-[#1E3646] bg-gradient-to-br from-emerald-50/95 via-white to-teal-50/85 dark:from-[#101D26] dark:via-[#101D26] dark:to-[#101D26] p-4 sm:p-6 space-y-5 shadow-2xs"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-emerald-200/80 dark:border-[#1E3646]">
                <div className="flex items-center gap-3.5">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center text-3xl shadow-sm shrink-0">
                    ✅
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 dark:bg-[#142430] text-emerald-950 dark:text-[#A5F3FC] text-[10px] font-extrabold">
                        {isEn ? 'PAYMENT SUCCESSFUL' : 'عملية دفع وتأكيد ناجحة'}
                      </span>
                      <span className="text-xs font-extrabold text-emerald-900 dark:text-[#2DD4BF] tabular-nums">
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

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-emerald-200 dark:border-[#1E3646] bg-white dark:bg-[#142430] p-4 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs sm:text-sm font-extrabold text-[var(--color-text)]">
                      📋 {isEn ? 'Sample Order Summary' : 'ملخص الطلب التجريبي وتفاصيل الدفع'}
                    </h5>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-[#101D26] text-emerald-900 dark:text-[#A5F3FC] text-[10px] font-extrabold">
                      {isEn ? 'Demo' : 'نموذج'}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-[#1E3646]">
                      <span className="font-bold text-[var(--color-muted)]">
                        {isEn ? 'Order Number:' : 'رقم الطلب:'}
                      </span>
                      <span className="font-extrabold text-[var(--color-text)] tabular-nums">
                        #{latestOrder ? latestOrder.id : 'FS-9042'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-[#1E3646]">
                      <span className="font-bold text-[var(--color-muted)]">
                        {isEn ? 'Payment Method:' : 'وسيلة الدفع المختارة:'}
                      </span>
                      <span className="font-extrabold text-emerald-900 dark:text-[#A5F3FC] bg-emerald-50 dark:bg-[#101D26] px-2.5 py-0.5 rounded-lg">
                        {latestOrder?.paymentMethodLabelAr
                          ? isEn
                            ? latestOrder.paymentMethodLabelEn
                            : latestOrder.paymentMethodLabelAr
                          : isEn
                          ? getPaymentMethodLabels(paymentMethod).labelEn
                          : getPaymentMethodLabels(paymentMethod).labelAr}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-[#1E3646]">
                      <span className="font-bold text-[var(--color-muted)]">
                        {isEn ? 'Recipient:' : 'المستلم:'}
                      </span>
                      <span className="font-extrabold text-[var(--color-text)]">
                        {locText(latestOrder?.shippingAddress?.recipientName || shippingAddress.recipientName, language)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-[#1E3646]">
                      <span className="font-bold text-[var(--color-muted)]">
                        {isEn ? 'Delivery Destination:' : 'وجهة التوصيل:'}
                      </span>
                      <span className="font-bold text-[var(--color-text)] text-end">
                        {locText(latestOrder?.shippingAddress?.city || shippingAddress.city, language)} —{' '}
                        {locText(latestOrder?.shippingAddress?.streetDetails || shippingAddress.streetDetails, language)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 text-sm font-extrabold text-emerald-950 dark:text-[#A5F3FC]">
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
                            )}
                          </div>
                          <span className="font-extrabold text-emerald-950 dark:text-[#A5F3FC] tabular-nums">
                            {formatCurrency(item.unitPrice * item.quantity, currency, language)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-[#1E3646]">
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
                      className="min-h-[40px] px-3 py-2 rounded-xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-muted)] dark:bg-[#101D26] text-[var(--color-text)] text-xs font-extrabold flex items-center justify-center gap-1.5"
                    >
                      <span>🛍️</span>
                      <span>{isEn ? 'Continue Shopping' : 'متابعة التسوق'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : cart.length === 0 ? (
            <div className="space-y-3">
              <FriendlyEmptyState
                id="empty-cart-state"
                iconId="cart"
                tone="amber"
                title={emptyCartCopy.title}
                subtitle={emptyCartCopy.subtitle}
                actionLabel={
                  isEn
                    ? '+ Add Featured Item to Cart'
                    : '➕ إضافة منتج مختار للسلة'
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
                  className="px-4 py-2 rounded-xl text-xs font-extrabold border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-muted)] dark:bg-[#142430] text-[var(--color-text)]"
                >
                  🛍️ {emptyCartCopy.actionLabel}
                </button>
              </div>
            </div>
          ) : (
            <div
              id="store-checkout-screen"
              data-testid="checkout-payment-screen"
              className="grid grid-cols-1 lg:grid-cols-[1.15fr_1.25fr] gap-4 items-start"
            >
              {/* Column 1: Order Items & Delivery Info */}
              <div className="space-y-3.5">
                <div className="rounded-2xl border border-amber-200/80 dark:border-[#1E3646] bg-amber-50/55 dark:bg-[#142430] p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs sm:text-sm font-extrabold text-[var(--color-text)]">
                      🛍️ {isEn ? '1. Order Items Review' : '١. مراجعة منتجات الطلب'}
                    </h4>
                    <span className="px-2 py-0.5 rounded-md bg-white dark:bg-[#101D26] text-amber-900 dark:text-[#FDBA74] text-[10px] font-extrabold tabular-nums">
                      {cartEnriched.reduce((a, b) => a + b.quantity, 0)}{' '}
                      {isEn ? 'items' : 'منتجات'}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {cartEnriched.map((ci) => (
                      <div
                        key={ci.productId}
                        className="rounded-xl border border-amber-200/70 dark:border-[#1E3646] bg-white dark:bg-[#101D26] p-2.5 flex flex-wrap items-center justify-between gap-2 shadow-2xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-[#142430] flex items-center justify-center text-lg shrink-0">
                            {ci.product.emoji}
                          </span>
                          <div className="min-w-0">
                            <div className="text-xs font-extrabold text-[var(--color-text)] truncate">
                              {isEn ? ci.product.nameEn : ci.product.name}
                            </div>
                            <div className="text-[11px] font-bold text-orange-800 dark:text-[#FDBA74] tabular-nums">
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
                              className="w-7 h-7 rounded-lg border border-[var(--color-border)] dark:border-[#1E3646] bg-amber-50 dark:bg-[#142430] text-xs font-extrabold text-[var(--color-text)]"
                            >
                              −
                            </button>
                            <span className="px-1.5 text-xs font-extrabold tabular-nums text-[var(--color-text)]">
                              {ci.quantity}
                            </span>
                            <button
                              type="button"
                              aria-label="زيادة الكمية"
                              onClick={() => onUpdateCartQuantity(ci.productId, 1)}
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
                        {isEn ? 'Contact Mobile' : 'رقم جوال التواصل'}
                      </label>
                      <input
                        id="checkoutPhoneInput"
                        type="tel"
                        dir="ltr"
                        value={shippingAddress.phone}
                        onChange={(e) => onUpdateShippingAddress({ phone: e.target.value })}
                        className="w-full rounded-xl border border-[var(--color-border)] dark:border-[#1E3646] bg-white dark:bg-[#101D26] px-2.5 py-1.5 text-xs font-semibold tabular-nums text-[var(--color-text)]"
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
                        className="w-full rounded-xl border border-[var(--color-border)] dark:border-[#1E3646] bg-white dark:bg-[#101D26] px-2.5 py-1.5 text-xs font-semibold text-[var(--color-text)]"
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
                        className="w-full rounded-xl border border-[var(--color-border)] dark:border-[#1E3646] bg-white dark:bg-[#101D26] px-2.5 py-1.5 text-xs font-semibold text-[var(--color-text)]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Column 2: Payment Methods Selection */}
              <div className="rounded-2xl border-2 border-orange-200/95 dark:border-[#1E3646] bg-orange-50/55 dark:bg-[#142430] p-4 space-y-3.5 shadow-2xs">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs sm:text-sm font-extrabold text-[var(--color-text)]">
                    💳 {isEn ? '3. Select Payment Method' : '٣. اختر طريقة الدفع'}
                  </h4>
                  <span className="px-2 py-0.5 rounded-md bg-orange-100 dark:bg-[#101D26] text-orange-950 dark:text-[#FDBA74] text-[10px] font-extrabold">
                    {isEn ? '2 Options Available' : 'خياران متاحان'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5" role="radiogroup" aria-label="طرق الدفع">
                  <button
                    type="button"
                    role="radio"
                    aria-checked={paymentCategory === 'electronic'}
                    onClick={() => handleSelectCategoryMode('electronic')}
                    className={`rounded-2xl border-2 p-3 text-start transition-all cursor-pointer flex items-start gap-2.5 ${
                      paymentCategory === 'electronic'
                        ? 'border-orange-600 bg-white dark:bg-[#101D26] ring-2 ring-orange-500/20 shadow-2xs'
                        : 'border-[var(--color-border)] dark:border-[#1E3646] bg-white/75 dark:bg-[#101D26] text-[var(--color-muted)]'
                    }`}
                  >
                    <span className="w-9 h-9 rounded-xl bg-orange-100 dark:bg-[#142430] text-orange-900 dark:text-[#FDBA74] flex items-center justify-center text-lg shrink-0">
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

                  <button
                    type="button"
                    role="radio"
                    aria-checked={paymentCategory === 'cod'}
                    onClick={() => handleSelectCategoryMode('cod')}
                    className={`rounded-2xl border-2 p-3 text-start transition-all cursor-pointer flex items-start gap-2.5 ${
                      paymentCategory === 'cod'
                        ? 'border-emerald-600 bg-white dark:bg-[#101D26] ring-2 ring-emerald-500/20 shadow-2xs'
                        : 'border-[var(--color-border)] dark:border-[#1E3646] bg-white/75 dark:bg-[#101D26] text-[var(--color-muted)]'
                    }`}
                  >
                    <span className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-[#142430] text-emerald-900 dark:text-[#A5F3FC] flex items-center justify-center text-lg shrink-0">
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

                {paymentCategory === 'electronic' ? (
                  <div className="rounded-2xl border border-orange-200 dark:border-[#1E3646] bg-white dark:bg-[#101D26] p-3.5 space-y-3 shadow-2xs">
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
                                ? ' Apple Pay selected — tap Confirm Order below'
                                : ' تم اختيار Apple Pay — اضغط تأكيد الطلب بالأسفل لإتمام الطلب'
                            );
                          }}
                          className={`min-h-[42px] px-3 py-2 rounded-xl text-xs font-extrabold border-2 transition-all flex items-center justify-center gap-1.5 ${
                            paymentMethod === 'apple_pay'
                              ? 'border-teal-400 bg-[#142430] text-white shadow-sm'
                              : 'border-[#1E3646] bg-[#0B131A] text-white hover:bg-[#142430]'
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
                                : 'G تم اختيار Google Pay — اضغط تأكيد الطلب بالأسفل لإتمام الطلب'
                            );
                          }}
                          className={`min-h-[42px] px-3 py-2 rounded-xl text-xs font-extrabold border-2 transition-all flex items-center justify-center gap-1.5 ${
                            paymentMethod === 'google_pay'
                              ? 'border-blue-500 bg-blue-600 text-white shadow-sm'
                              : 'border-[#1E3646] bg-[#142430] text-white hover:bg-[#182C3A]'
                          }`}
                        >
                          <span className="font-black text-blue-400 bg-[#0B131A] px-1.5 rounded">G</span>
                          <span>Google Pay</span>
                          {paymentMethod === 'google_pay' && <span>✓</span>}
                        </button>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-[#1E3646] space-y-2">
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('electronic_card')}
                          className={`text-xs font-extrabold flex items-center gap-1.5 ${
                            paymentMethod === 'electronic_card'
                              ? 'text-[#FF8C61]'
                              : 'text-[var(--color-text)]'
                          }`}
                        >
                          <span>💳</span>
                          <span>
                            {isEn
                              ? 'Credit / Debit Card Details'
                              : 'بيانات البطاقة الائتمانية / بطاقة الخصم المباشر'}
                          </span>
                        </button>
                        <span dir="ltr" className="text-[10px] font-extrabold text-emerald-800 dark:text-[#A5F3FC] bg-emerald-50 dark:bg-[#142430] px-2 py-0.5 rounded-md">
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
                              setTestCardNumber(e.target.value);
                            }}
                            placeholder="4242 •••• •••• 4242"
                            className="w-full rounded-xl border border-[var(--color-border)] dark:border-[#1E3646] bg-slate-50 dark:bg-[#142430] px-2.5 py-1.5 text-xs font-mono font-bold text-[var(--color-text)]"
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
                            className="w-full rounded-xl border border-[var(--color-border)] dark:border-[#1E3646] bg-slate-50 dark:bg-[#142430] px-2.5 py-1.5 text-xs font-mono font-bold text-[var(--color-text)]"
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
                            className="w-full rounded-xl border border-[var(--color-border)] dark:border-[#1E3646] bg-slate-50 dark:bg-[#142430] px-2.5 py-1.5 text-xs font-mono font-bold text-[var(--color-text)]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    data-testid="cod-payment-box"
                    className="rounded-2xl border border-emerald-300 dark:border-[#1E3646] bg-white dark:bg-[#101D26] p-3.5 space-y-2 shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 dark:bg-[#142430] text-emerald-950 dark:text-[#A5F3FC] text-[10px] font-extrabold">
                        💵 {isEn ? 'CASH ON DELIVERY SELECTED' : 'تم اختيار الدفع عند الاستلام'}
                      </span>
                      <span className="text-xs font-extrabold text-emerald-900 dark:text-[#2DD4BF]">
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

                <div className="rounded-xl bg-white/90 dark:bg-[#101D26] border border-orange-200/80 dark:border-[#1E3646] p-3 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-[var(--color-muted)] font-bold">
                    <span>{isEn ? 'Items Subtotal:' : 'قيمة المنتجات:'}</span>
                    <span className="tabular-nums">{formatCurrency(cartTotalAmount, currency, language)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[var(--color-muted)] font-bold">
                    <span>{isEn ? 'Express Delivery:' : 'رسوم التوصيل السريع:'}</span>
                    <span className="tabular-nums">{formatCurrency(deliveryFee, currency, language)}</span>
                  </div>
                  {codFee > 0 && (
                    <div className="flex items-center justify-between text-emerald-800 dark:text-[#2DD4BF] font-bold">
                      <span>{isEn ? 'Cash on Delivery Service:' : 'رسوم خدمة الدفع عند الاستلام:'}</span>
                      <span className="tabular-nums">{formatCurrency(codFee, currency, language)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm font-extrabold text-[var(--color-text)] pt-1.5 border-t border-orange-100 dark:border-[#1E3646]">
                    <span>{isEn ? 'Total Amount:' : 'الإجمالي النهائي للطلب:'}</span>
                    <span className="tabular-nums text-base">
                      {formatCurrency(grandTotal, currency, language)}
                    </span>
                  </div>
                </div>

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
                    : `جدول المقارنة الذكية للمنتجات والخدمات (${comparedItems.length}/3)`}
                </h3>
                <p className="text-[10.5px] font-semibold text-[var(--color-muted)] dark:text-[#94A3B8]">
                  {isEn
                    ? 'Compare price, parent rating, and delivery speed side-by-side'
                    : 'قارن السعر، تقييم الوالدين، وسرعة التوصيل جنبًا إلى جنب'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() =>
                  setCompareIds(COMMERCIAL_CATALOG.slice(0, 3).map((item) => item.id))
                }
                className="px-2.5 py-1 rounded-xl text-[11px] font-extrabold border border-[#0d9488]/40 bg-teal-50/80 dark:bg-[#142430] text-[#0d9488] dark:text-[#A5F3FC] cursor-pointer"
              >
                {isEn ? '✨ Compare Top 3 Picks' : '✨ قارن أفضل ٣ اختيارات'}
              </button>
              {comparedItems.length > 0 && (
                <button
                  type="button"
                  onClick={() => setCompareIds([])}
                  className="px-2.5 py-1 rounded-xl text-[11px] font-extrabold border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-muted)] dark:bg-[#142430] text-[var(--color-muted)] cursor-pointer"
                >
                  {isEn ? 'Clear All' : 'مسح الكل'}
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowComparePanel(false)}
                aria-label={isEn ? 'Close comparison panel' : 'إغلاق جدول المقارنة'}
                className="w-7 h-7 rounded-xl text-base font-black leading-none bg-[#0d9488] text-white flex items-center justify-center shrink-0 cursor-pointer"
              >
                ×
              </button>
            </div>
          </div>

          {comparedItems.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--color-border)] dark:border-[#1E3646] p-4 text-center space-y-1.5">
              <div className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-[#0d9488]/15 text-[#0d9488] dark:text-[#2DD4BF]">
                <CompareArrowsIcon size={18} />
              </div>
              <div className="text-xs font-extrabold text-[var(--color-text)]">
                {isEn
                  ? 'No products selected for comparison yet — tap ⇄ Compare on any card'
                  : 'لم تختر أي منتجات للمقارنة بعد — اضغط على زر «⇄ قارن» في أي بطاقة منتج'}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {comparedItems.map((cItem) => {
                const cPrice = currency === 'SAR' ? cItem.priceSAR : cItem.priceEGP;
                const cTitle = isEn ? cItem.nameEn : cItem.name;
                return (
                  <div
                    key={cItem.id}
                    className="rounded-2xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-muted)]/45 dark:bg-[#142430] p-3.5 flex flex-col justify-between gap-3"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#0d9488]/15 text-[#0d9488] dark:text-[#A5F3FC]">
                          {cItem.emoji} {locText(cItem.categoryLabel, language)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleToggleCompareItem(cItem)}
                          className="text-[11px] font-extrabold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                        >
                          {isEn ? 'Remove ✕' : 'إزالة ✕'}
                        </button>
                      </div>
                      <h4 className="text-xs sm:text-sm font-black text-[var(--color-text)] dark:text-[#F8FAFC]">
                        {cTitle}
                      </h4>

                      <div className="space-y-1.5 pt-1 text-[11px]">
                        <div className="flex items-center justify-between py-1 border-b border-[var(--color-border)]/60 dark:border-[#1E3646]">
                          <span className="font-bold text-[var(--color-muted)]">
                            {isEn ? 'Price:' : 'السعر:'}
                          </span>
                          <span className="font-black text-[#0d9488] dark:text-[#2DD4BF] tabular-nums">
                            {formatCurrency(cPrice, currency, language)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between py-1 border-b border-[var(--color-border)]/60 dark:border-[#1E3646]">
                          <span className="font-bold text-[var(--color-muted)]">
                            {isEn ? 'Parent Rating:' : 'تقييم الوالدين:'}
                          </span>
                          <span className="font-extrabold text-amber-600 dark:text-amber-300 tabular-nums">
                            ⭐ {cItem.rating} ({cItem.reviewCount || 140})
                          </span>
                        </div>
                        <div className="flex items-center justify-between py-1 border-b border-[var(--color-border)]/60 dark:border-[#1E3646]">
                          <span className="font-bold text-[var(--color-muted)]">
                            {isEn ? 'Location / Scope:' : 'النطاق والتوصيل:'}
                          </span>
                          <span className="font-extrabold text-[var(--color-text)] truncate max-w-[140px]">
                            📍 {locText(cItem.city, language)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between py-1">
                          <span className="font-bold text-[var(--color-muted)]">
                            {isEn ? 'Delivery Speed:' : 'سرعة التوصيل:'}
                          </span>
                          <span className="font-extrabold text-emerald-700 dark:text-[#A5F3FC]">
                            🚚{' '}
                            {cItem.deliveryEstimateAr
                              ? isEn
                                ? cItem.deliveryEstimateEn
                                : cItem.deliveryEstimateAr
                              : isEn
                              ? 'Same-Day Booking'
                              : 'طلب خدمة أو حجز'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => onAddToCart(cItem, cItem.variants?.[0])}
                        className="flex-1 min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-extrabold bg-[#0d9488] hover:bg-[#0f766e] text-white transition-all cursor-pointer"
                      >
                        🛒 {isEn ? 'Add to Cart' : 'أضف للسلة'}
                      </button>
                      <button
                        type="button"
                        onClick={() => onInspectCommercialItem(cItem)}
                        className="min-h-[36px] px-2.5 py-1.5 rounded-xl text-xs font-extrabold border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-surface)] dark:bg-[#101D26] text-[var(--color-text)] cursor-pointer"
                      >
                        {isEn ? 'Details' : 'تفاصيل'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          STORE CATALOG CONTENT:
          1) DEDICATED FULL-PAGE CATEGORY VIEW (Multi-Column Grid) when a category title/button is clicked
          2) CATEGORIZED HORIZONTAL ROWS (Swipeable Carousels per Category) by default
          ===================================================================== */}
      {filtered.length === 0 ? (
        <FriendlyEmptyState
          id="empty-store-filter-state"
          iconId="services"
          tone="amber"
          title={getEmptyStateCopy('search', language).title}
          subtitle={getEmptyStateCopy('search', language).subtitle}
          actionLabel={getEmptyStateCopy('search', language).actionLabel}
          onAction={() => {
            resetStoreFilters();
            setActiveCategoryPageId(null);
          }}
        />
      ) : activeCategorySpec ? (
        /* -------------------------------------------------------------------
           DEDICATED FULL-PAGE CATEGORY VIEW (Multi-Column Grid Layout)
           ------------------------------------------------------------------- */
        <div
          id={`store-category-page-${activeCategorySpec.id}`}
          data-testid="store-category-fullpage-view"
          className="space-y-4 animate-page-enter"
        >
          {/* Full-Page Category Header Banner with Back Button & Unsplash Stock Thumbnail */}
          <div className="rounded-3xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-surface)] dark:bg-[#101D26] p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 soft-card-surface shadow-sm">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="relative w-16 h-16 rounded-2xl bg-[#142430] border border-[#1E3646] overflow-hidden flex items-center justify-center shrink-0 shadow-sm">
                <img
                  src={activeCategorySpec.imageUrl}
                  alt={isEn ? activeCategorySpec.titleEn : activeCategorySpec.titleAr}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover opacity-85"
                />
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
              <span>{isEn ? 'Back to All Categories' : 'العودة لجميع أقسام المتجر'}</span>
            </button>
          </div>

          {/* Dedicated Category Multi-Column Grid */}
          <div
            data-testid="store-category-grid"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5"
          >
            {filtered
              .filter((item) =>
                (activeCategorySpec.matchCategories as readonly string[]).includes(item.category)
              )
              .map((item) => renderCompactProductCard(item, 'grid'))}
          </div>
        </div>
      ) : (
        /* -------------------------------------------------------------------
           CATEGORIZED HORIZONTAL ROWS (Default Store Catalog View)
           Each row features a clickable Section Header/Button + Horizontal Carousel
           ------------------------------------------------------------------- */
        <div data-testid="store-categorized-rows" className="space-y-3.5">
          {STORE_CATEGORY_SECTIONS.map((sec) => {
            const rowItems = filtered.filter((item) =>
              (sec.matchCategories as readonly string[]).includes(item.category)
            );
            if (rowItems.length === 0) return null;

            return (
              <div
                key={sec.id}
                data-testid={`store-category-row-${sec.id}`}
                className="rounded-2xl sm:rounded-3xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-surface)] dark:bg-[#101D26] p-3 sm:p-4 space-y-2.5 soft-card-surface shadow-sm"
              >
                {/* Clickable Category Row Header / Button with Unsplash Thumbnail & Gradient Overlay */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[var(--color-border)]/60 dark:border-[#1E3646]">
                  <button
                    type="button"
                    data-testid={`store-category-header-btn-${sec.id}`}
                    onClick={() => openCategoryFullPage(sec.id)}
                    className="flex items-center gap-2.5 text-start group cursor-pointer min-w-0"
                  >
                    <span className="relative w-10 h-10 rounded-xl bg-[var(--color-control-muted)] dark:bg-[#142430] border border-[var(--color-border)] dark:border-[#1E3646] overflow-hidden flex items-center justify-center text-base shrink-0 group-hover:border-[#FF8C61] shadow-2xs transition-all">
                      <img
                        src={sec.imageUrl}
                        alt={isEn ? sec.titleEn : sec.titleAr}
                        loading="lazy"
                        className="absolute inset-0 w-full h-full object-cover opacity-85 group-hover:scale-110 transition-transform duration-300"
                      />
                      <span
                        aria-hidden="true"
                        className="absolute inset-0"
                        style={{
                          background:
                            'linear-gradient(to top, rgba(11, 19, 26, 0.82) 0%, rgba(11, 19, 26, 0.22) 100%)',
                        }}
                      />
                      <span className="relative z-10 drop-shadow">{sec.emoji}</span>
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-xs sm:text-sm font-extrabold text-[var(--color-text)] group-hover:text-[#FF8C61] transition-colors truncate">
                          {isEn ? sec.titleEn : sec.titleAr}
                        </h3>
                        <span className="px-1.5 py-0.5 rounded-full text-[9.5px] font-extrabold bg-[var(--color-control-muted)] dark:bg-[#142430] text-[var(--color-text)] dark:text-[#A5F3FC] border border-[var(--color-border)] dark:border-[#1E3646] tabular-nums shrink-0">
                          {rowItems.length}
                        </span>
                      </div>
                      <p className="text-[10px] font-semibold text-[var(--color-muted)] line-clamp-1">
                        {isEn ? sec.subtitleEn : sec.subtitleAr}
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    data-testid={`store-category-viewall-btn-${sec.id}`}
                    onClick={() => openCategoryFullPage(sec.id)}
                    className="min-h-[30px] px-3 py-1 rounded-xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-muted)] dark:bg-[#142430] hover:bg-[#0d9488] hover:text-white hover:border-[#0d9488] text-[var(--color-text)] dark:text-[#A5F3FC] text-[10.5px] font-extrabold flex items-center gap-1 shrink-0 active:scale-95 transition-all"
                  >
                    <span>{isEn ? 'View All' : 'عرض الكل'}</span>
                    <span>{isEn ? '→' : '←'}</span>
                  </button>
                </div>

                {/* Smooth Swipeable Horizontal Carousel for this Category */}
                <div
                  dir={isEn ? 'ltr' : 'rtl'}
                  data-testid={`store-horizontal-carousel-${sec.id}`}
                  className="horizontal-scroll-row pt-0.5"
                >
                  {rowItems.map((item) => renderCompactProductCard(item, 'carousel'))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Compact Visual Payment Badges Strip */}
      <div className="rounded-2xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-surface)] dark:bg-[#101D26] px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-[11px] font-bold text-[var(--color-muted)]">
        <span>
          🛡️ {isEn ? 'Localized Catalog & Sample Delivery Tracking' : 'كتالوج محلي وتوصيل مباشر على الخريطة'}
        </span>
        <span className="text-[var(--color-text)]">
          💳 Visa · Mastercard · مدى mada · Apple Pay
        </span>
      </div>
    </section>
  );
};


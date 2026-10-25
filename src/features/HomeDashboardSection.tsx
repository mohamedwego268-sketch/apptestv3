import React, { useMemo, useState } from 'react';
import {
  COMMERCIAL_CATALOG,
  COUNTRY_CITIES_MAP,
  CalendarEvent,
  CommercialCatalogItem,
  FamilySpaceState,
  LanguageCode,
  ParentProfileThemeSpec,
  calculateChildAge,
  formatCurrency,
  locText,
  sortCatalogByCityAndProximity,
} from '../domain/familySpaceCore';
import { getCardBackgroundSpec, getProductUnsplashImageUrl } from '../domain/cardBackgrounds';
import { t } from '../domain/i18n';
import {
  BannerSlideItem,
  MasterPatternCard,
  PrimaryCtaButton,
  SoftFilledIcon,
  SwipeableBannerCarousel,
} from '../components/DesignSystem';
import { ThreeDChildAvatar, ThreeDIcon, ThreeDIconId } from '../components/ThreeDVisuals';
import { LiveWeatherWidget } from '../components/LiveWeatherWidget';
import { PageId } from '../context/FamilyAppContext';

export interface HomeDashboardSectionProps {
  state: FamilySpaceState;
  lang: LanguageCode;
  parentProfileSpec: ParentProfileThemeSpec;
  cartItemCount: number;
  completedTasksCount: number;
  nearestEvent: CalendarEvent | null;
  todayFormattedCombined: string;
  userCoords: { lat: number; lng: number } | null;
  geoStatus: 'idle' | 'locating' | 'active';
  navigateTo: (page: PageId) => void;
  onSelectParentProfile: (role: 'mom' | 'dad') => void;
  onSelectPreciseCity: (combinedValue: string) => void;
  onUseCurrentLocation: () => void;
  onAddToCart: (item: CommercialCatalogItem) => void;
  onInspectCommercialItem?: (item: CommercialCatalogItem) => void;
  onAddProductToWishes?: (item: CommercialCatalogItem) => void;
}

export const HomeDashboardSection: React.FC<HomeDashboardSectionProps> = ({
  state,
  lang,
  parentProfileSpec,
  cartItemCount,
  completedTasksCount,
  nearestEvent,
  todayFormattedCombined,
  userCoords,
  geoStatus,
  navigateTo,
  onSelectParentProfile,
  onSelectPreciseCity,
  onUseCurrentLocation,
  onAddToCart,
  onInspectCommercialItem,
  onAddProductToWishes,
}) => {
  const [showAllHomeHubs, setShowAllHomeHubs] = useState<boolean>(false);
  const [homeFocusTab, setHomeFocusTab] = useState<'nearby' | 'children' | 'schedule'>('nearby');
  const [homeWishlistIds, setHomeWishlistIds] = useState<number[]>([]);

  const toggleHomeWishlist = (item: CommercialCatalogItem) => {
    setHomeWishlistIds((prev) =>
      prev.includes(item.id) ? prev.filter((x) => x !== item.id) : [...prev, item.id]
    );
    if (onAddProductToWishes) {
      onAddProductToWishes(item);
    }
  };

  const isEn = lang === 'en';
  const brandName = t(lang, 'brandName');
  const activeCity = state.city || (state.country === 'SA' ? 'الرياض' : 'القاهرة');
  const localizedCity = locText(activeCity, lang);

  // Compact Auto-Play Hero Carousel Slides at the very top of the Home Screen
  const heroSlides: BannerSlideItem[] = useMemo(
    () => [
      {
        id: 'hero-announcement-welcome',
        badge: `${brandName} · ${isEn ? parentProfileSpec.roleBadgeEn : parentProfileSpec.roleBadgeAr}`,
        title: isEn
          ? `${parentProfileSpec.greetingEn} — Your Family Daily Hub`
          : `${parentProfileSpec.greetingAr} — مساحة أسرتك المتكاملة اليوم`,
        subtitle: isEn
          ? `${brandName} · Everything your family needs for child health, daily routines & trusted care in ${localizedCity}.`
          : `${brandName} · كل ما تحتاجه أسرتك لصحة طفلك، روتينه اليومي، وأفضل الأطباء والمتاجر في ${localizedCity}.`,
        ctaLabel: isEn ? 'Explore Medical Care' : 'استكشف الرعاية الطبية',
        onCtaClick: () => navigateTo('medical'),
        iconId: 'health',
        gradient: 'from-teal-50 to-sky-50',
        ctaVariant: state.role === 'dad' ? 'teal' : 'orange',
      },
      {
        id: 'hero-top-article',
        badge: isEn ? `${brandName} · Top Pediatric Article` : `${brandName} · مقال طبي وتربوي مميز`,
        title: isEn
          ? 'Vaccination & Developmental Milestones Guide (Day 1 – 8 Years)'
          : 'دليل التطعيمات ومراحل النمو الصحي للطفل (من أول يوم حتى 8 سنوات)',
        subtitle: isEn
          ? 'Track height, weight, sleep habits, and book verified pediatricians directly in your city.'
          : 'تابع جدول التطعيمات، الطول والوزن، عادات النوم، واحجز موعدك مباشرة مع نخبة أطباء الأطفال.',
        ctaLabel: isEn ? 'Manage 3D Child Profiles' : 'إدارة ملفات الأطفال 3D',
        onCtaClick: () => navigateTo('children'),
        iconId: 'children',
        gradient: 'from-emerald-50 to-teal-50',
        ctaVariant: 'teal',
      },
      {
        id: 'hero-store-promo',
        badge: isEn ? `${brandName} · Featured Promotion` : `${brandName} · عروض متجر الأسرة المميزة`,
        title: isEn
          ? `Curated Nurseries, Montessori Toys & Baby Essentials in ${localizedCity}`
          : `عروض مختارة على الحضانات والألعاب التعليمية ومستلزمات الطفل في ${localizedCity}`,
        subtitle: isEn
          ? 'Sorted dynamically by proximity to your city with Cash on Delivery & live order tracking.'
          : 'مرتبة تلقائيًا حسب الأقرب لمدينتك مع خيارات الدفع عند الاستلام وتتبع الطلبات مباشرة.',
        ctaLabel: isEn ? 'Shop Family Store' : 'تسوّق متجر الأسرة',
        onCtaClick: () => navigateTo('services'),
        iconId: 'services',
        gradient: 'from-orange-50 to-amber-50',
        ctaVariant: 'orange',
      },
      {
        id: 'hero-ai-reels',
        badge: isEn ? `${brandName} · 9:16 Reels & AI Agent` : `${brandName} · الريلز التربوية والمساعد الذكي`,
        title: isEn
          ? '60-Second Visual Parenting Tips & Instant AI Routine Planner'
          : 'نصائح تربوية سريعة في 60 ثانية وتخطيط ذكي للروتين اليومي بالذكاء الاصطناعي',
        subtitle: isEn
          ? 'Watch bite-sized expert reels or ask our AI Parenting Agent for age-tailored daily schedules.'
          : 'شاهد فيديوهات الريلز القصيرة أو استشر المساعد الذكي لتصميم جدول يومي مخصص لعمر طفلك.',
        ctaLabel: isEn ? 'Ask AI Parenting Agent' : 'استشر المساعد الذكي AI',
        onCtaClick: () => navigateTo('assistant'),
        iconId: 'assistant',
        gradient: 'from-cyan-50 to-teal-50',
        ctaVariant: 'blue',
      },
    ],
    [brandName, isEn, parentProfileSpec, localizedCity, state.role, navigateTo]
  );

  const heroBgSpec = getCardBackgroundSpec(
    state.role === 'dad' ? 'medical' : 'family',
    state.darkMode
  );

  return (
    <section className="space-y-5" aria-label={isEn ? 'Home Dashboard' : 'الشاشة الرئيسية'}>
      {/* 1. AUTO-PLAY HERO CAROUSEL AT THE VERY TOP */}
      <SwipeableBannerCarousel
        slides={heroSlides}
        language={lang}
        darkMode={Boolean(state.darkMode)}
        autoPlayMs={4500}
        ariaLabel={isEn ? `${brandName} Featured Announcements Carousel` : `لافتات ${brandName} الترويجية المتحركة`}
      />

      {/* 2. SLEEK LIVE WEATHER WIDGET STRIP (Current Temp, Condition & Mini Today/Tomorrow Forecast) */}
      <LiveWeatherWidget
        city={activeCity}
        country={state.country}
        language={lang}
        darkMode={Boolean(state.darkMode)}
        userCoords={userCoords}
      />

      {/* 3. PERSONALIZED GREETING & CORE VALUE PROPOSITION HERO */}
      <div
        id="home-core-value-hero"
        data-testid="home-core-value-hero"
        data-parent-profile={parentProfileSpec.role}
        style={{
          backgroundImage: heroBgSpec.backgroundImageCss,
          borderColor: parentProfileSpec.badgeBorderCss,
        }}
        className="image-bg-card rounded-[24px] p-5 sm:p-6 flex flex-col justify-between gap-4"
      >
        <div className="space-y-3.5 max-w-3xl">
          {/* Top Personalized Greeting Badge & Parent Profile Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span
                id="hero-parent-role-badge"
                style={{
                  backgroundColor: parentProfileSpec.badgeBgCss,
                  color: parentProfileSpec.badgeTextCss,
                  borderColor: parentProfileSpec.badgeBorderCss,
                }}
                className="px-3.5 py-1 rounded-full text-xs font-extrabold border shadow-2xs inline-flex items-center gap-1.5"
              >
                <ThreeDIcon id="family" size={15} />
                <span>
                  {isEn ? parentProfileSpec.roleBadgeEn : parentProfileSpec.roleBadgeAr}
                </span>
              </span>
              <span className="image-card-badge px-3 py-1 rounded-full text-xs font-extrabold inline-flex items-center gap-1.5">
                <ThreeDIcon id="home" size={14} />
                <span>{brandName}</span>
              </span>
            </div>

            {/* Instant Parent Profile Switcher: Father (Teal/Slate Blue) vs. Mother (Soft Coral/Warm Rose) */}
            <div
              role="group"
              aria-label={isEn ? 'Switch Parent Profile' : 'التبديل بين حساب الأب وحساب الأم'}
              className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-surface)]/90 backdrop-blur-md p-1 border border-[var(--color-border)] shadow-2xs"
            >
              <button
                id="switch-parent-dad-btn"
                type="button"
                onClick={() => onSelectParentProfile('dad')}
                aria-pressed={state.role === 'dad'}
                className={`px-3 py-1 rounded-full text-[11px] font-extrabold transition-all flex items-center gap-1.5 ${
                  state.role === 'dad'
                    ? 'bg-[#0d9488] text-white shadow-2xs'
                    : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
                }`}
              >
                <ThreeDIcon id="shield" size={14} />
                <span>{isEn ? 'Dad (Ahmed)' : 'بابا (أحمد)'}</span>
              </button>
              <button
                id="switch-parent-mom-btn"
                type="button"
                onClick={() => onSelectParentProfile('mom')}
                aria-pressed={state.role !== 'dad'}
                className={`px-3 py-1 rounded-full text-[11px] font-extrabold transition-all flex items-center gap-1.5 ${
                  state.role !== 'dad'
                    ? 'bg-[#E86A3D] text-white shadow-2xs'
                    : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
                }`}
              >
                <ThreeDIcon id="family" size={14} />
                <span>{isEn ? 'Mom (Sara)' : 'ماما (سارة)'}</span>
              </button>
            </div>
          </div>

          {/* Personalized Greeting & Strictly Single-Language Brand Tagline */}
          <div className="space-y-2">
            <h1
              id="home-main-greeting-heading"
              className="image-card-title text-2xl sm:text-4xl font-extrabold leading-tight"
            >
              {isEn ? parentProfileSpec.greetingEn : parentProfileSpec.greetingAr}
            </h1>
            <p className="image-card-title text-base sm:text-xl font-extrabold leading-snug">
              {isEn
                ? `${brandName} · Everything Your Family Needs for Child Health, Daily Routines & Trusted Care`
                : `${brandName} · كل اللي عيلتك محتاجاه لصحة طفلك، روتينه اليومي، وأشطر الدكاترة والحضانات والمتاجر الموثوقة`}
            </p>
          </div>

          <p className="image-card-subtitle text-xs sm:text-sm font-semibold leading-relaxed max-w-2xl">
            {isEn
              ? 'Personalized for ages Day 1 to 8 Years · Instant pediatric booking, smart AI routine planning, and verified family stores.'
              : 'تجربة هادية ومظبوطة على سن طفلك من أول يوم لحد 8 سنين · حجز دكاترة أطفال معتمدين، مساعد ذكي للروتين، ومتجر متكامل لبيتك.'}
          </p>

          <div className="pt-1 flex flex-wrap items-center gap-2.5">
            <PrimaryCtaButton variant="teal" size="md" onClick={() => navigateTo('medical')}>
              <ThreeDIcon id="health" size={16} />
              <span>{isEn ? 'Book Pediatrician' : 'احجز دكتور أطفال'}</span>
            </PrimaryCtaButton>
            <PrimaryCtaButton variant="orange" size="md" onClick={() => navigateTo('services')}>
              <ThreeDIcon id="services" size={16} />
              <span>{isEn ? 'Explore Family Store' : 'اتسوق من متجر الأسرة'}</span>
            </PrimaryCtaButton>
            <button
              type="button"
              onClick={() => navigateTo('assistant')}
              className="image-card-badge min-h-[40px] px-4 py-2 rounded-xl text-xs font-extrabold hover:opacity-95 transition-opacity inline-flex items-center gap-1.5"
            >
              <ThreeDIcon id="assistant" size={15} />
              <span>{isEn ? 'Smart AI Assistant' : 'اسأل المساعد الذكي AI'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. CORE HUBS GRID WITH UNIFIED SOFT-FILLED ICONOGRAPHY */}
      <div className="space-y-5">
        <div className="section-heading-block">
          <h2 className="section-heading-centered">
            {isEn ? 'Quick Family Picks' : 'مختارات الأسرة السريعة'}
          </h2>
          <p className="section-subtitle-centered">
            {isEn
              ? 'Focused access to your essential daily family services'
              : 'كل خدمات البيت وأطفالك في مكان واحد سريع ومنظم من غير زحمة'}
          </p>
        </div>

        {(() => {
          const allHubCards: Array<{
            id: PageId;
            iconId: ThreeDIconId;
            title: string;
            subtitle: string;
            badge: string;
          }> = [
            {
              id: 'medical',
              iconId: 'health',
              title: isEn ? 'Medical Care' : 'الرعاية الطبية',
              subtitle: isEn ? 'Pediatricians & Growth' : 'أطباء الأطفال والنمو',
              badge: isEn ? 'Doctors & Clinics' : 'أطباء وعيادات',
            },
            {
              id: 'services',
              iconId: 'services',
              title: isEn ? 'Family Store' : 'المتجر والخدمات',
              subtitle: isEn ? 'Toys, Apparel & Nurseries' : 'ألعاب ومستلزمات وحضانات',
              badge:
                cartItemCount > 0
                  ? isEn
                    ? `${cartItemCount} in Cart`
                    : `${cartItemCount} في السلة`
                  : isEn
                  ? 'Products & Offers'
                  : 'منتجات وحضانات',
            },
            {
              id: 'assistant',
              iconId: 'assistant',
              title: isEn ? 'AI Agent' : 'مساعد الذكاء الاصطناعي',
              subtitle: isEn ? 'Smart Routine & Advice' : 'إرشاد وتصميم روتين',
              badge: isEn ? 'Chat & Create' : 'محادثة وإنشاء',
            },
            {
              id: 'children',
              iconId: 'children',
              title: isEn ? 'Kids Profiles 3D' : 'ملفات الأطفال',
              subtitle: isEn ? '3D Identity & Milestones' : 'هوية 3D ومتابعة النمو',
              badge: `${state.kids.length} ${isEn ? 'Profiles' : 'ملفات مسجلة'}`,
            },
            {
              id: 'routine',
              iconId: 'routine',
              title: isEn ? 'Daily Routine' : 'الروتين اليومي',
              subtitle: isEn ? 'Habits & Smart Alerts' : 'مهام وتذكيرات ذكية',
              badge: `${completedTasksCount}/${state.tasks.length} ${isEn ? 'Done' : 'مكتمل'}`,
            },
            {
              id: 'community',
              iconId: 'star',
              title: isEn ? 'Parents Community' : 'مجتمع الآباء',
              subtitle: isEn ? 'Real Parent Experiences' : 'تجارب ونقاشات يومية',
              badge: isEn ? 'Discussions' : 'تجارب ونقاشات',
            },
            {
              id: 'media',
              iconId: 'video',
              title: isEn ? 'Media & Reels' : 'الميديا والريلز',
              subtitle: isEn ? '60s Visual Parenting Tips' : 'نصائح بصرية سريعة',
              badge: isEn ? '9:16 Videos' : 'فيديوهات 9:16',
            },
            {
              id: 'calendar',
              iconId: 'calendar',
              title: isEn ? 'Calendar' : 'التقويم والمواعيد',
              subtitle: isEn ? 'Gregorian & Hijri Sync' : 'تقويم ميلادي وهجري',
              badge: `${state.events.length} ${isEn ? 'Events' : 'مواعيد'}`,
            },
            {
              id: 'wishes',
              iconId: 'wishes',
              title: isEn ? 'Kids Wishes' : 'أمنيات الأطفال',
              subtitle: isEn ? 'Family Gift Goals' : 'أهداف وهدايا الطفل',
              badge: `${state.wishes.length} ${isEn ? 'Wishes' : 'أمنيات'}`,
            },
            {
              id: 'chat',
              iconId: 'shield',
              title: isEn ? 'Internal Chat' : 'المحادثات',
              subtitle: isEn ? 'Family & Specialist Chat' : 'تواصل عائلي واستشاري',
              badge: isEn ? 'Direct Messages' : 'تواصل مباشر',
            },
            {
              id: 'games',
              iconId: 'games',
              title: isEn ? '3D Kids Games' : 'ألعاب الأطفال 3D',
              subtitle: isEn ? 'Safe Educational Play' : 'لعب تعليمي آمن',
              badge: isEn ? 'Interactive' : 'ترفيه تعليمي',
            },
            {
              id: 'settings',
              iconId: 'settings',
              title: isEn ? 'Profile & Settings' : 'الحساب والإعدادات',
              subtitle: isEn ? 'Theme, City & Backup' : 'إدارة الحساب والمدينة',
              badge: isEn ? 'Account & Prefs' : 'إدارة الحساب',
            },
          ];

          const visibleCards = showAllHomeHubs ? allHubCards : allHubCards.slice(0, 6);

          return (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {visibleCards.map((card, idx) => (
                  <MasterPatternCard
                    key={card.id}
                    tone={idx % 2 === 0 ? 'teal' : 'amber'}
                    categoryKey={card.id}
                    itemIdOrIndex={idx}
                    darkMode={Boolean(state.darkMode)}
                    onThumbnailClick={() => navigateTo(card.id)}
                    topLeftBadge={
                      <>
                        <ThreeDIcon id={card.iconId} size={13} />
                        <span>{card.title}</span>
                      </>
                    }
                    topRightBadge={<span>⭐ {card.badge}</span>}
                    title={card.title}
                    titlePrefixSlot={<SoftFilledIcon id={card.iconId} boxSize="sm" />}
                    metaLeft={
                      <>
                        <span className="truncate">📍 {localizedCity}</span>
                        <span aria-hidden="true">·</span>
                        <span className="text-teal-700 dark:text-[#2DD4BF] font-extrabold truncate">
                          {card.subtitle}
                        </span>
                      </>
                    }
                    metaRightAction={
                      <button
                        type="button"
                        onClick={() => navigateTo(card.id)}
                        className="text-[10.5px] font-extrabold text-[#0d9488] dark:text-[#A5F3FC] hover:underline cursor-pointer"
                      >
                        {isEn ? 'View Details' : 'شوف التفاصيل'}
                      </button>
                    }
                    footerLeft={
                      <span className="text-xs font-extrabold text-[var(--color-text)] dark:text-[#F8FAFC] truncate">
                        {card.badge}
                      </span>
                    }
                    footerRight={
                      <button
                        type="button"
                        onClick={() => navigateTo(card.id)}
                        className="min-h-[34px] px-3 py-1 rounded-xl bg-[#0d9488] hover:bg-[#0f766e] text-white text-[11px] font-extrabold inline-flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
                      >
                        <span>{isEn ? 'Open' : 'افتح القسم'}</span>
                        <span>{isEn ? '→' : '←'}</span>
                      </button>
                    }
                  />
                ))}
              </div>

              <div className="flex justify-center pt-1">
                <button
                  id="toggle-all-home-hubs-btn"
                  type="button"
                  onClick={() => setShowAllHomeHubs((prev) => !prev)}
                  className="min-h-[38px] px-5 py-2 rounded-xl text-xs font-extrabold border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-role-text)] hover:border-[var(--color-accent)] transition-colors"
                >
                  {showAllHomeHubs
                    ? isEn
                      ? 'Show Essential Hubs Only (6)'
                      : 'عرض الأقسام الأساسية فقط (6)'
                    : isEn
                    ? 'Explore All Family Tools & Sections (12)'
                    : 'عرض جميع أدوات وأقسام المنصة (12)'}
                </button>
              </div>
            </>
          );
        })()}
      </div>

      {/* 4. ORGANIZED SEGMENTED TABS FOR LOCAL PICKS, CHILDREN & SCHEDULE */}
      <div
        id="home-decluttered-tabs"
        data-testid="home-horizontal-carousel"
        className="rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-7 space-y-6 soft-card-surface"
      >
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-[var(--color-border)] pb-4">
          <div className="text-center sm:text-start">
            <h2 className="text-lg sm:text-xl font-extrabold text-[var(--color-heading)]">
              {isEn
                ? 'Your Local Services & Family Snapshot'
                : 'الخدمات القريبة وملخص الأسرة اليومي'}
            </h2>
            <p className="text-xs font-semibold text-[var(--color-muted)] mt-0.5">
              {isEn
                ? `Filtered for ${localizedCity} · Switch tabs below`
                : `مخصص لمدينة ${localizedCity} · تنقّل بين التبويبات المنظمة`}
            </p>
          </div>

          {/* Clean Internal Segmented Tabs with Unified ThreeDIcons */}
          <div
            role="tablist"
            aria-label={isEn ? 'Home organized sections' : 'تبويبات الشاشة الرئيسية المنظمة'}
            className="flex flex-wrap items-center gap-1.5 rounded-2xl bg-[var(--color-control-muted)] p-1.5"
          >
            {[
              {
                id: 'nearby' as const,
                iconId: 'services' as ThreeDIconId,
                label: isEn ? 'Nearby Store & Clinics' : 'الأقرب في مدينتك',
              },
              {
                id: 'children' as const,
                iconId: 'children' as ThreeDIconId,
                label: isEn ? `Kids (${state.kids.length})` : `الأطفال (${state.kids.length})`,
              },
              {
                id: 'schedule' as const,
                iconId: 'calendar' as ThreeDIconId,
                label: isEn ? 'Schedule & Routine' : 'المواعيد والروتين',
              },
            ].map((tab) => {
              const active = homeFocusTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setHomeFocusTab(tab.id)}
                  className={`min-h-[36px] px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all inline-flex items-center gap-1.5 ${
                    active
                      ? 'bg-[var(--color-accent)] text-[var(--color-accent-contrast)] shadow-2xs'
                      : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
                  }`}
                >
                  <ThreeDIcon id={tab.iconId} size={14} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* TAB 1: NEARBY SERVICES & STORE */}
        {homeFocusTab === 'nearby' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[var(--color-surface)] dark:bg-[#101D26] p-3.5 border border-[var(--color-border)] dark:border-[#1E3646] soft-card-surface">
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Step 1: Hierarchical Country Selector (Egypt vs Saudi Arabia) */}
                <div className="inline-flex items-center gap-1 rounded-xl bg-[var(--color-control-muted)] dark:bg-[#142430] p-1 border border-[var(--color-border)] dark:border-[#1E3646]">
                  <button
                    id="home-country-eg-btn"
                    type="button"
                    onClick={() => onSelectPreciseCity(`EG:${COUNTRY_CITIES_MAP.EG[0].id}`)}
                    aria-pressed={state.country === 'EG'}
                    className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                      state.country === 'EG'
                        ? 'bg-[#0d9488] text-white shadow-2xs'
                        : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
                    }`}
                  >
                    {isEn ? '🇪🇬 Egypt (27)' : '🇪🇬 مصر (٢٧ محافظة)'}
                  </button>
                  <button
                    id="home-country-sa-btn"
                    type="button"
                    onClick={() => onSelectPreciseCity(`SA:${COUNTRY_CITIES_MAP.SA[0].id}`)}
                    aria-pressed={state.country === 'SA'}
                    className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                      state.country === 'SA'
                        ? 'bg-[#0d9488] text-white shadow-2xs'
                        : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
                    }`}
                  >
                    {isEn ? '🇸🇦 Saudi Arabia' : '🇸🇦 السعودية'}
                  </button>
                </div>

                {/* Step 2: Dynamic Governorate / Region Selector for the Selected Country */}
                <label
                  htmlFor="home-city-filter-select"
                  className="text-xs font-extrabold text-[var(--color-text)] inline-flex items-center gap-1"
                >
                  <ThreeDIcon id="services" size={14} />
                  <span>
                    {state.country === 'EG'
                      ? isEn
                        ? 'Governorate:'
                        : 'المحافظة:'
                      : isEn
                      ? 'Region / Governorate:'
                      : 'المنطقة / المحافظة:'}
                  </span>
                </label>
                <select
                  id="home-city-filter-select"
                  value={`${state.country}:${activeCity}`}
                  onChange={(e) => onSelectPreciseCity(e.target.value)}
                  className="min-h-[38px] rounded-xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-bg)] dark:bg-[#142430] px-3 py-1.5 text-xs font-extrabold text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)]"
                >
                  {(COUNTRY_CITIES_MAP[state.country] || []).map((c, idx) => (
                    <option key={`${state.country}-${c.id}`} value={`${state.country}:${c.id}`}>
                      {isEn
                        ? `${idx + 1}. ${c.nameEn}`
                        : `${idx + 1}. ${c.nameAr}`}
                    </option>
                  ))}
                </select>

                <button
                  id="use-current-location-btn"
                  type="button"
                  onClick={onUseCurrentLocation}
                  className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                    geoStatus === 'active'
                      ? 'bg-[#0d9488] text-white shadow-2xs'
                      : 'bg-[var(--color-surface)] dark:bg-[#142430] text-[var(--color-role-text)] border border-[var(--color-border)] dark:border-[#1E3646] hover:border-[var(--color-accent)]'
                  }`}
                >
                  <ThreeDIcon id="services" size={14} />
                  <span>
                    {geoStatus === 'locating'
                      ? isEn
                        ? 'Detecting GPS...'
                        : 'جاري تحديد موقعك...'
                      : geoStatus === 'active'
                      ? isEn
                        ? 'GPS Sorted (Closest)'
                        : 'مرتب حسب الأقرب (GPS)'
                      : isEn
                      ? 'Use my current location'
                      : 'استخدم موقعي الحالي'}
                  </span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => navigateTo('services')}
                className="text-xs font-extrabold text-[var(--color-role-text)] hover:underline cursor-pointer"
              >
                {isEn ? 'Open Full Store →' : 'عرض المتجر كاملًا ←'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 py-1">
              {sortCatalogByCityAndProximity(
                COMMERCIAL_CATALOG,
                state.country,
                activeCity,
                userCoords
              )
                .slice(0, 6)
                .map((item) => {
                  const price = state.currency === 'SAR' ? item.priceSAR : item.priceEGP;
                  const origPrice = state.currency === 'SAR' ? item.originalPriceSAR : item.originalPriceEGP;
                  const stockImageUrl = item.imageUrl || getProductUnsplashImageUrl(item.category, item.id);
                  const isWishlisted = homeWishlistIds.includes(item.id);
                  const revCount = item.reviewCount || 142;
                  const handleInspect = () =>
                    onInspectCommercialItem
                      ? onInspectCommercialItem(item)
                      : navigateTo('services');

                  return (
                    <MasterPatternCard
                      key={`home-carousel-${item.id}`}
                      tone="teal"
                      categoryKey={item.category}
                      customImageUrl={stockImageUrl}
                      itemIdOrIndex={item.id}
                      darkMode={Boolean(state.darkMode)}
                      onThumbnailClick={handleInspect}
                      topLeftBadge={
                        <>
                          <span>{item.emoji}</span>
                          <span>{locText(item.categoryLabel, lang)}</span>
                        </>
                      }
                      topRightBadge={
                        <>
                          <span>⭐ {item.rating}</span>
                          <span className="opacity-85">({revCount})</span>
                        </>
                      }
                      title={isEn ? item.nameEn : item.name}
                      metaLeft={
                        <>
                          <span className="truncate">
                            📍 {locText(item.city, lang)} · {item.estimatedDistanceKm}{' '}
                            {isEn ? 'km' : 'كم'}
                          </span>
                          {item.deliveryEstimateAr && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="text-teal-700 dark:text-[#2DD4BF] font-extrabold truncate">
                                🚚 {isEn ? item.deliveryEstimateEn : item.deliveryEstimateAr}
                              </span>
                            </>
                          )}
                        </>
                      }
                      metaRightAction={
                        <button
                          type="button"
                          onClick={handleInspect}
                          className="text-[10.5px] font-extrabold text-[#0d9488] dark:text-[#A5F3FC] hover:underline shrink-0 cursor-pointer"
                        >
                          {isEn ? 'View Details' : 'شوف التفاصيل'}
                        </button>
                      }
                      footerLeft={
                        <div
                          onClick={handleInspect}
                          className="flex items-baseline gap-1.5 tabular-nums cursor-pointer"
                        >
                          {origPrice && (
                            <span className="text-[10px] line-through text-[var(--color-muted)]">
                              {formatCurrency(origPrice, state.currency, state.language)}
                            </span>
                          )}
                          <strong className="text-xs sm:text-sm font-extrabold text-[var(--color-text)] dark:text-[#F8FAFC] truncate">
                            {formatCurrency(price, state.currency, state.language)}
                          </strong>
                        </div>
                      }
                      footerRight={
                        <>
                          <button
                            type="button"
                            onClick={() => toggleHomeWishlist(item)}
                            title={isEn ? 'Save to Wishlist' : 'احفظ في الأمنيات'}
                            aria-label={isEn ? 'Toggle Wishlist' : 'إضافة للمفضلة'}
                            className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-all active:scale-95 cursor-pointer ${
                              isWishlisted
                                ? 'bg-[#FF8C61] border-[#FF8C61] text-white'
                                : 'border-orange-200/80 dark:border-[#1E3646] bg-orange-50/80 dark:bg-[#142430] text-[#FF8C61] hover:bg-[#FF8C61] hover:text-white'
                            }`}
                          >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                              <path
                                d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                                fill="currentColor"
                                fillOpacity={isWishlisted ? '0.95' : '0.2'}
                                stroke="currentColor"
                                strokeWidth="1.9"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => onAddToCart(item)}
                            title={isEn ? 'Add to Cart' : 'أضف للسلة'}
                            aria-label={isEn ? 'Add to Cart' : 'أضف للسلة'}
                            className="w-8 h-8 rounded-xl bg-[#0d9488] hover:bg-[#0f766e] text-white flex items-center justify-center shadow-2xs transition-all active:scale-95 cursor-pointer"
                          >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
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
                        </>
                      }
                    />
                  );
                })}
            </div>
          </div>
        )}

        {/* TAB 2: CHILDREN 3D PROFILES */}
        {homeFocusTab === 'children' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-extrabold text-[var(--color-text)]">
                {t(lang, 'yourChildren')}
              </span>
              <button
                type="button"
                onClick={() => navigateTo('children')}
                className="min-h-[34px] px-3.5 py-1.5 rounded-xl text-xs font-extrabold bg-[var(--color-accent-soft)] text-[var(--color-role-text)]"
              >
                {t(lang, 'manageProfiles')}
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {state.kids.map((kid, idx) => {
                const ageInfo = calculateChildAge(kid.birth, state.language);
                const displayKidName = locText(kid.name, lang);
                return (
                  <MasterPatternCard
                    key={kid.id}
                    tone={idx % 2 === 0 ? 'teal' : 'rose'}
                    categoryKey="children"
                    itemIdOrIndex={kid.id}
                    darkMode={Boolean(state.darkMode)}
                    onThumbnailClick={() => navigateTo('children')}
                    topLeftBadge={<span>👶 {ageInfo.stageTitle}</span>}
                    topRightBadge={<span>⭐ {ageInfo.label}</span>}
                    title={displayKidName}
                    titlePrefixSlot={
                      <ThreeDChildAvatar
                        name={displayKidName}
                        gender={kid.gender}
                        stageCode={ageInfo.stageCode}
                        accessoryTheme={kid.avatarTheme || 'astronaut'}
                        photoDataUrl={kid.photoDataUrl}
                        useIllustratedAvatar={kid.useIllustratedAvatar}
                        size="sm"
                      />
                    }
                    metaLeft={
                      <>
                        <span>📍 {localizedCity}</span>
                        <span aria-hidden="true">·</span>
                        <span className="truncate">{locText(kid.interests, lang)}</span>
                      </>
                    }
                    metaRightAction={
                      <button
                        type="button"
                        onClick={() => navigateTo('children')}
                        className="text-[10.5px] font-extrabold text-[#0d9488] dark:text-[#A5F3FC] hover:underline cursor-pointer"
                      >
                        {isEn ? 'View Profile' : 'شوف الملف'}
                      </button>
                    }
                    footerLeft={
                      <span className="text-xs font-extrabold text-[var(--color-text)] dark:text-[#F8FAFC]">
                        {kid.growthHeightCm ? `${kid.growthHeightCm} cm` : ''}{' '}
                        {kid.growthWeightKg ? `· ${kid.growthWeightKg} kg` : ''}
                      </span>
                    }
                    footerRight={
                      <button
                        type="button"
                        onClick={() => navigateTo('children')}
                        className="min-h-[34px] px-3 py-1 rounded-xl bg-[#0d9488] hover:bg-[#0f766e] text-white text-[11px] font-extrabold cursor-pointer"
                      >
                        {t(lang, 'manageProfiles')}
                      </button>
                    }
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: UPCOMING SCHEDULE & ROUTINE */}
        {homeFocusTab === 'schedule' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {nearestEvent ? (
              <MasterPatternCard
                tone="sky"
                categoryKey="calendar"
                itemIdOrIndex={1}
                darkMode={Boolean(state.darkMode)}
                onThumbnailClick={() => navigateTo('calendar')}
                topLeftBadge={<span>📅 {t(lang, 'nearestAppointment')}</span>}
                topRightBadge={<span>⭐ {nearestEvent.date}</span>}
                title={locText(nearestEvent.title, lang)}
                metaLeft={
                  <>
                    <span>📍 {localizedCity}</span>
                    {nearestEvent.time && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>🕒 {locText(nearestEvent.time, lang)}</span>
                      </>
                    )}
                  </>
                }
                metaRightAction={
                  <button
                    type="button"
                    onClick={() => navigateTo('calendar')}
                    className="text-[10.5px] font-extrabold text-[#0d9488] dark:text-[#A5F3FC] hover:underline cursor-pointer"
                  >
                    {t(lang, 'openCalendar')}
                  </button>
                }
                footerLeft={
                  <span className="text-xs font-extrabold text-[var(--color-text)] dark:text-[#F8FAFC]">
                    {locText(nearestEvent.type || 'موعد أسري', lang)}
                  </span>
                }
                footerRight={
                  <button
                    type="button"
                    onClick={() => navigateTo('calendar')}
                    className="min-h-[34px] px-3 py-1 rounded-xl bg-[#0d9488] hover:bg-[#0f766e] text-white text-[11px] font-extrabold cursor-pointer"
                  >
                    {t(lang, 'openCalendar')}
                  </button>
                }
              />
            ) : (
              <div className="soft-card-surface rounded-3xl border border-dashed border-[var(--color-border)] dark:border-[#1E3646] p-5 text-center text-xs text-[var(--color-muted)]">
                {t(lang, 'noUpcomingEvents')}
              </div>
            )}

            <MasterPatternCard
              tone="teal"
              categoryKey="routine"
              itemIdOrIndex={2}
              darkMode={Boolean(state.darkMode)}
              onThumbnailClick={() => navigateTo('routine')}
              topLeftBadge={<span>✅ {isEn ? 'Daily Routine Progress' : 'إنجاز الروتين اليومي'}</span>}
              topRightBadge={
                <span>
                  ⭐ {completedTasksCount}/{state.tasks.length}
                </span>
              }
              title={`${completedTasksCount} / ${state.tasks.length} ${
                isEn ? 'Tasks Completed Today' : 'مهام مكتملة اليوم'
              }`}
              metaLeft={<span>📅 {todayFormattedCombined}</span>}
              metaRightAction={
                <button
                  type="button"
                  onClick={() => navigateTo('routine')}
                  className="text-[10.5px] font-extrabold text-[#0d9488] dark:text-[#A5F3FC] hover:underline cursor-pointer"
                >
                  {isEn ? 'Open Routine' : 'فتح الروتين'}
                </button>
              }
              footerLeft={
                <span className="text-xs font-extrabold text-[var(--color-text)] dark:text-[#F8FAFC]">
                  {isEn ? 'Daily Family Habits' : 'عادات ومهام الأسرة اليومية'}
                </span>
              }
              footerRight={
                <button
                  type="button"
                  onClick={() => navigateTo('routine')}
                  className="min-h-[34px] px-3 py-1 rounded-xl bg-[#FF8C61] hover:bg-[#e86a3d] text-white text-[11px] font-extrabold cursor-pointer"
                >
                  {isEn ? 'Open Routine' : 'فتح الروتين'}
                </button>
              }
            />
          </div>
        )}
      </div>
    </section>
  );
};

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
  CompareArrowsIcon,
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
  bedtimeMode?: boolean;
  onToggleBedtimeMode?: () => void;
  navigateTo: (page: PageId) => void;
  onSelectParentProfile: (role: 'mom' | 'dad') => void;
  onSelectPreciseCity: (combinedValue: string) => void;
  onUseCurrentLocation: () => void;
  onAddToCart: (item: CommercialCatalogItem) => void;
  onInspectCommercialItem?: (item: CommercialCatalogItem) => void;
  onAddProductToWishes?: (item: CommercialCatalogItem) => void;
  onAddSuggestedRoutineTask?: (taskName: string, timeStr: string, kidId: number | null) => void;
  onShowToast?: (msg: string) => void;
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
  bedtimeMode = false,
  onToggleBedtimeMode,
  navigateTo,
  onSelectParentProfile,
  onSelectPreciseCity,
  onUseCurrentLocation,
  onAddToCart,
  onInspectCommercialItem,
  onAddProductToWishes,
  onAddSuggestedRoutineTask,
  onShowToast,
}) => {
  const [showAllHomeHubs, setShowAllHomeHubs] = useState<boolean>(false);
  const [homeFocusTab, setHomeFocusTab] = useState<'nearby' | 'children' | 'schedule'>('nearby');
  const [homeWishlistIds, setHomeWishlistIds] = useState<number[]>([]);
  const [homeCompareIds, setHomeCompareIds] = useState<number[]>([]);
  const [activeTipKidIdx, setActiveTipKidIdx] = useState<number>(0);
  const [proactiveTipIndex, setProactiveTipIndex] = useState<number>(0);
  const [homeAiPrompt, setHomeAiPrompt] = useState<string>('');
  const [homeAiVoiceActive, setHomeAiVoiceActive] = useState<boolean>(false);
  const [homeAiReply, setHomeAiReply] = useState<{
    badgeAr: string;
    badgeEn: string;
    textAr: string;
    textEn: string;
    taskTitleAr: string;
    taskTitleEn: string;
    taskTime: string;
  } | null>(null);

  const toggleHomeWishlist = (item: CommercialCatalogItem) => {
    setHomeWishlistIds((prev) =>
      prev.includes(item.id) ? prev.filter((x) => x !== item.id) : [...prev, item.id]
    );
    if (onAddProductToWishes) {
      onAddProductToWishes(item);
    }
  };

  const toggleHomeCompare = (item: CommercialCatalogItem) => {
    setHomeCompareIds((prev) => {
      const exists = prev.includes(item.id);
      const next = exists ? prev.filter((id) => id !== item.id) : [...prev.slice(-2), item.id];
      onShowToast?.(
        exists
          ? lang === 'en'
            ? `Removed "${item.nameEn}" from comparison`
            : `تمت إزالة «${item.name}» من المقارنة`
          : lang === 'en'
          ? `Added "${item.nameEn}" to comparison`
          : `تمت إضافة «${item.name}» للمقارنة الذكية`
      );
      return next;
    });
  };

  const isEn = lang === 'en';
  const activeCountryCities = COUNTRY_CITIES_MAP[state.country] || COUNTRY_CITIES_MAP.EG;
  const resolvedHomeCityObj =
    activeCountryCities.find(
      (c) =>
        c.id === state.city ||
        (state.city && (c.id.includes(state.city) || state.city.includes(c.id)))
    ) || activeCountryCities[0];
  const activeCity = resolvedHomeCityObj.id;
  const localizedCity = isEn ? resolvedHomeCityObj.nameEn : resolvedHomeCityObj.nameAr;

  const activeTipKid = state.kids[activeTipKidIdx] || state.kids[0];
  const activeTipKidAge = activeTipKid ? calculateChildAge(activeTipKid.birth, lang) : null;
  const activeKidName = activeTipKid ? locText(activeTipKid.name, lang) : isEn ? 'Your Child' : 'طفلك';

  const quickChildPromptChips = useMemo(() => {
    const kAr = activeTipKid?.name || 'طفلي';
    const kEn = activeTipKid ? locText(activeTipKid.name, 'en') : 'my child';
    return [
      {
        id: 'sleep',
        labelAr: `🌙 خطة نوم هادئ لـ ${kAr}`,
        labelEn: `🌙 Calm Sleep Plan for ${kEn}`,
        promptAr: `اقترح خطة نوم مسائية هادئة لـ ${kAr}`,
        promptEn: `Suggest a calm evening sleep plan for ${kEn}`,
      },
      {
        id: 'play',
        labelAr: `🎨 أنشطة ذكاء ومونتيسوري لـ ${kAr}`,
        labelEn: `🎨 Montessori Play for ${kEn}`,
        promptAr: `اقترح ٣ أنشطة ذكاء ومونتيسوري لـ ${kAr} بدون شاشات`,
        promptEn: `Suggest 3 screen-free Montessori activities for ${kEn}`,
      },
      {
        id: 'nutrition',
        labelAr: `🥦 وجبات تركيز ومناعة لـ ${kAr}`,
        labelEn: `🥦 Healthy Meals for ${kEn}`,
        promptAr: `اقترح جدول وجبات صحية لزيادة التركيز والمناعة لـ ${kAr}`,
        promptEn: `Suggest healthy focus & immunity meals for ${kEn}`,
      },
      {
        id: 'behavior',
        labelAr: `💛 تعديل السلوك الإيجابي لـ ${kAr}`,
        labelEn: `💛 Positive Behavior for ${kEn}`,
        promptAr: `كيف أتعامل بهدوء مع العناد ونوبات الغضب عند ${kAr}؟`,
        promptEn: `How to handle tantrums and build confidence for ${kEn}?`,
      },
    ];
  }, [activeTipKid]);

  const dynamicHomeChildPlans = useMemo(() => {
    const kAr = activeTipKid?.name || 'طفلك';
    const kEn = activeTipKid ? locText(activeTipKid.name, 'en') : 'your child';
    const stageStr = activeTipKidAge?.label || (isEn ? '3–5 yrs' : '3–5 سنوات');
    const interestsAr = activeTipKid?.interests || 'القصص والمكعبات';
    const interestsEn = activeTipKid ? locText(activeTipKid.interests, 'en') : 'stories and blocks';

    const plans = [
      {
        id: 'plan-evening',
        badgeAr: `🌙 المساء · ${stageStr}`,
        badgeEn: `🌙 Evening · ${stageStr}`,
        titleAr: `تهدئة المساء وقصة قبل النوم لـ ${kAr}`,
        titleEn: `Calm Wind-Down & Storytime for ${kEn}`,
        descAr: `إيقاف الشاشات 07:30 م + قصة قصيرة تناسب حب ${kAr} لـ (${interestsAr}).`,
        descEn: `Zero screens at 07:30 PM + short story around ${interestsEn}.`,
        time: '07:45 م',
      },
      {
        id: 'plan-focus',
        badgeAr: `🎨 المهارات · ${stageStr}`,
        badgeEn: `🎨 Skills · ${stageStr}`,
        titleAr: `جلسة تركيز ولعب تفاعلي (٢٠ د) مع ${kAr}`,
        titleEn: `20-Min Interactive Focus Play with ${kEn}`,
        descAr: `نشاط عملي لتنمية اللغة والمهارات لـ ${kAr} عبر (${interestsAr}).`,
        descEn: `Hands-on vocabulary & motor skills session around ${interestsEn}.`,
        time: '04:30 م',
      },
      {
        id: 'plan-nutrition',
        badgeAr: `🍎 التغذية · ${stageStr}`,
        badgeEn: `🍎 Nutrition · ${stageStr}`,
        titleAr: `وجبة الطاقة والتركيز الصباحية لـ ${kAr}`,
        titleEn: `Morning Energy & Brain-Boost Meal for ${kEn}`,
        descAr: `وجبة متوازنة غنية بالحديد لدعم نمو ${kAr} (${stageStr}).`,
        descEn: `Iron-rich balanced meal supporting ${kEn}'s growth (${stageStr}).`,
        time: '08:30 ص',
      },
      {
        id: 'plan-autonomy',
        badgeAr: `🌟 الاستقلالية · ${stageStr}`,
        badgeEn: `🌟 Autonomy · ${stageStr}`,
        titleAr: `تحدي الاعتماد على النفس اليومي لـ ${kAr}`,
        titleEn: `Daily Self-Reliance Challenge for ${kEn}`,
        descAr: `منح ${kAr} خيارين لترتيب ألعابه وتجهيز أدوات الغد.`,
        descEn: `Two positive choices for ${kEn} to tidy toys and prep for tomorrow.`,
        time: '06:30 م',
      },
    ];

    const offset = proactiveTipIndex % plans.length;
    return [...plans.slice(offset), ...plans.slice(0, offset)].slice(0, 2);
  }, [activeTipKid, activeTipKidAge, isEn, proactiveTipIndex]);

  const handleSendHomeAiQuery = (customQuery?: string) => {
    const query = (customQuery ?? homeAiPrompt).trim();
    if (!query) return;
    const kAr = activeTipKid?.name || 'طفلك';
    const kEn = activeTipKid ? locText(activeTipKid.name, 'en') : 'your child';
    const stageStr = activeTipKidAge?.label || (isEn ? '3–5 yrs' : '3–5 سنوات');

    setHomeAiReply({
      badgeAr: `خطة ذكية فورية لـ ${kAr} (${stageStr})`,
      badgeEn: `Instant AI Blueprint for ${kEn} (${stageStr})`,
      textAr: `بناءً على سؤالك «${query}»، ينصح المساعد الذكي بتقسيم الخطوات لـ ${kAr} إلى روتين يومي ثابت مدته ١٥ دقيقة مع تشجيع إيجابي وبدون شاشات.`,
      textEn: `Based on "${query}", our AI recommends a consistent 15-minute screen-free daily habit for ${kEn} with positive reinforcement.`,
      taskTitleAr: `تطبيق خطة المساعد الذكي لـ ${kAr}: ${query.slice(0, 32)}`,
      taskTitleEn: `AI Action Step for ${kEn}: ${query.slice(0, 32)}`,
      taskTime: '06:00 م',
    });
    setHomeAiPrompt('');
    setHomeAiVoiceActive(false);
  };

  const handleToggleHomeVoiceMic = () => {
    if (!homeAiVoiceActive) {
      setHomeAiVoiceActive(true);
      const sample = quickChildPromptChips[proactiveTipIndex % quickChildPromptChips.length];
      setHomeAiPrompt(isEn ? sample.promptEn : sample.promptAr);
    } else {
      setHomeAiVoiceActive(false);
      handleSendHomeAiQuery(homeAiPrompt);
    }
  };

  // Compact Auto-Play Hero Carousel Slides at the very top of the Home Screen
  const heroSlides: BannerSlideItem[] = useMemo(
    () => [
      {
        id: 'hero-announcement-welcome',
        badge: isEn ? parentProfileSpec.roleBadgeEn : parentProfileSpec.roleBadgeAr,
        title: isEn
          ? `${parentProfileSpec.greetingEn} — Your Family Daily Hub`
          : `${parentProfileSpec.greetingAr} — مساحة أسرتك المتكاملة اليوم`,
        subtitle: isEn
          ? `Child health, daily routines & trusted care in ${localizedCity}.`
          : `صحة طفلك، روتينه اليومي، وأفضل الأطباء والمتاجر في ${localizedCity}.`,
        ctaLabel: isEn ? 'Medical Care' : 'الرعاية الطبية',
        onCtaClick: () => navigateTo('medical'),
        iconId: 'health',
        gradient: 'from-teal-50 to-sky-50',
        ctaVariant: state.role === 'dad' ? 'teal' : 'orange',
      },
      {
        id: 'hero-top-article',
        badge: isEn ? 'Pediatric Guide' : 'دليل النمو والتطعيمات',
        title: isEn
          ? 'Vaccination & Developmental Milestones (Day 1 – 8 Years)'
          : 'دليل التطعيمات ومراحل النمو الصحي للطفل (من أول يوم حتى 8 سنوات)',
        subtitle: isEn
          ? 'Track height, weight, sleep habits, and book verified pediatricians.'
          : 'تابع جدول التطعيمات، الطول والوزن، واحجز موعدك مع نخبة أطباء الأطفال.',
        ctaLabel: isEn ? '3D Child Profiles' : 'ملفات الأطفال 3D',
        onCtaClick: () => navigateTo('children'),
        iconId: 'children',
        gradient: 'from-emerald-50 to-teal-50',
        ctaVariant: 'teal',
      },
      {
        id: 'hero-store-promo',
        badge: isEn ? 'Family Store' : 'عروض متجر الأسرة',
        title: isEn
          ? `Nurseries, Montessori Toys & Baby Essentials in ${localizedCity}`
          : `حضانات وألعاب مونتيسوري ومستلزمات الطفل في ${localizedCity}`,
        subtitle: isEn
          ? 'Sorted dynamically by proximity to your city with live order tracking.'
          : 'مرتبة تلقائيًا حسب الأقرب لمدينتك مع تتبع الطلبات مباشرة.',
        ctaLabel: isEn ? 'Shop Store' : 'تسوّق المتجر',
        onCtaClick: () => navigateTo('services'),
        iconId: 'services',
        gradient: 'from-orange-50 to-amber-50',
        ctaVariant: 'orange',
      },
    ],
    [isEn, parentProfileSpec, localizedCity, state.role, navigateTo]
  );

  const heroBgSpec = getCardBackgroundSpec(
    state.role === 'dad' ? 'medical' : 'family',
    state.darkMode
  );

  return (
    <section className="space-y-3.5" aria-label={isEn ? 'Home Dashboard' : 'الشاشة الرئيسية'}>
      {/* 1. COMPACT PRIMARY HERO CARD AT THE TOP OF HOME SCREEN */}
      <div
        id="home-core-value-hero"
        data-testid="home-core-value-hero"
        data-parent-profile={parentProfileSpec.role}
        style={{
          backgroundImage: heroBgSpec.backgroundImageCss,
          borderColor: parentProfileSpec.badgeBorderCss,
        }}
        className="image-bg-card rounded-2xl sm:rounded-3xl p-4 sm:p-5 flex flex-col justify-between gap-2"
      >
        <div className="space-y-1.5">
          {/* Top Compact Personalized Single-Account Context Row */}
          <div className="flex items-center justify-between gap-2 overflow-x-auto whitespace-nowrap no-scrollbar">
            <div className="flex items-center gap-1.5 shrink-0">
              <span
                id="hero-parent-role-badge"
                style={{
                  backgroundColor: parentProfileSpec.badgeBgCss,
                  color: parentProfileSpec.badgeTextCss,
                  borderColor: parentProfileSpec.badgeBorderCss,
                }}
                className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border shadow-2xs inline-flex items-center gap-1 shrink-0"
              >
                <ThreeDIcon id="family" size={11} />
                <span>
                  {isEn ? parentProfileSpec.displayNameEn : parentProfileSpec.displayNameAr}
                </span>
              </span>
              <span className="image-card-badge px-2.5 py-0.5 rounded-full text-[10px] font-extrabold inline-flex items-center gap-1 shrink-0">
                <ThreeDIcon id="home" size={11} />
                <span>📍 {localizedCity}</span>
              </span>
            </div>

            <button
              type="button"
              onClick={() => navigateTo('settings')}
              className="image-card-badge px-2.5 py-0.5 rounded-full text-[10px] font-extrabold inline-flex items-center gap-1 shrink-0 hover:opacity-95 transition-opacity cursor-pointer"
            >
              <ThreeDIcon id="settings" size={11} />
              <span>{isEn ? 'Account' : 'الحساب'}</span>
            </button>
          </div>

          {/* Compact Single-Line Greeting & Subtitle */}
          <div className="space-y-0.5">
            <h1
              id="home-main-greeting-heading"
              className="image-card-title text-sm sm:text-lg font-extrabold leading-snug"
            >
              {isEn ? parentProfileSpec.greetingEn : parentProfileSpec.greetingAr} —{' '}
              <span className="text-[11px] sm:text-xs font-bold opacity-95">
                {isEn
                  ? 'Child Health, Smart Routines & Trusted Care'
                  : 'صحة طفلك، روتينه اليومي، وأفضل الأطباء والمتاجر'}
              </span>
            </h1>
          </div>

          {/* Horizontal Scrollable Quick Action Carousel Strip */}
          <div className="pt-0.5 flex items-center gap-1.5 overflow-x-auto whitespace-nowrap no-scrollbar">
            <PrimaryCtaButton variant="teal" size="sm" onClick={() => navigateTo('medical')}>
              <ThreeDIcon id="health" size={13} />
              <span>{isEn ? 'Book Doctor' : 'احجز دكتور أطفال'}</span>
            </PrimaryCtaButton>
            <PrimaryCtaButton variant="orange" size="sm" onClick={() => navigateTo('services')}>
              <ThreeDIcon id="services" size={13} />
              <span>{isEn ? 'Family Store' : 'متجر الأسرة'}</span>
            </PrimaryCtaButton>
            <button
              type="button"
              onClick={() => navigateTo('assistant')}
              className="image-card-badge min-h-[34px] px-3 py-1 rounded-xl text-[10.5px] font-extrabold hover:opacity-95 transition-opacity inline-flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <ThreeDIcon id="assistant" size={13} />
              <span>{isEn ? 'Full AI Studio' : 'استوديو المساعد الذكي'}</span>
            </button>
            {onToggleBedtimeMode && (
              <button
                type="button"
                onClick={onToggleBedtimeMode}
                aria-pressed={Boolean(bedtimeMode)}
                className={`min-h-[34px] px-3 py-1 rounded-xl text-[10.5px] font-extrabold border transition-all inline-flex items-center gap-1 shrink-0 cursor-pointer ${
                  bedtimeMode
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-2xs'
                    : 'image-card-badge hover:opacity-95'
                }`}
              >
                <span>🕯️</span>
                <span>
                  {bedtimeMode
                    ? isEn
                      ? 'Bedtime Active'
                      : 'وضع النوم مفعّل'
                    : isEn
                    ? 'Bedtime Mode'
                    : 'وضع وقت النوم'}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. INTERACTIVE AI ASSISTANT CHAT BOX & DYNAMIC CHILD PLANS DIRECTLY BELOW TOP HERO CARD */}
      <div
        id="home-inline-ai-assistant"
        data-testid="home-inline-ai-assistant"
        className="rounded-2xl sm:rounded-3xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-surface)] dark:bg-[#101D26] p-4 sm:p-5 space-y-2 soft-card-surface shadow-sm"
      >
        {/* Header + Registered Child Selector Carousel */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#0d9488]/20 to-[#FF8C61]/25 border border-[#0d9488]/30 flex items-center justify-center shrink-0">
              <ThreeDIcon id="assistant" size={18} />
            </span>
            <div className="min-w-0">
              <h2 className="text-xs sm:text-sm font-extrabold text-[var(--color-text)] dark:text-[#F8FAFC] truncate">
                🤖 {isEn ? `Smart AI Assistant for ${activeKidName}` : `المساعد الذكي السريع لـ ${activeKidName}`}
              </h2>
              <p className="text-[10px] font-bold text-[var(--color-muted)] dark:text-[#94A3B8] truncate">
                {isEn
                  ? `Ask anything or tap a quick chip tailored to ${activeKidName} (${activeTipKidAge?.label || '3–5 yrs'})`
                  : `اسأل مباشرة أو اختر اقتراحًا مخصصًا لـ ${activeKidName} (${activeTipKidAge?.label || '3–5 سنوات'})`}
              </p>
            </div>
          </div>

          {/* Horizontal Scrollable Child Profile Selector Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap no-scrollbar">
            {state.kids.map((kid, idx) => {
              const isSelected = activeTipKid?.id === kid.id;
              return (
                <button
                  key={kid.id}
                  type="button"
                  onClick={() => {
                    setActiveTipKidIdx(idx);
                    setProactiveTipIndex(0);
                  }}
                  className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold border transition-all shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-[#0d9488] text-white border-[#0d9488] shadow-2xs'
                      : 'bg-[var(--color-control-muted)] dark:bg-[#142430] text-[var(--color-text)] dark:text-[#F8FAFC] border-[var(--color-border)] dark:border-[#1E3646]'
                  }`}
                >
                  👶 {locText(kid.name, lang)}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => navigateTo('assistant')}
              className="px-2.5 py-1 rounded-xl text-[10px] font-extrabold border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-muted)] dark:bg-[#142430] text-[#0d9488] dark:text-[#2DD4BF] hover:border-[#0d9488] shrink-0 cursor-pointer"
            >
              {isEn ? 'Full Chat →' : 'المحادثة الكاملة ←'}
            </button>
          </div>
        </div>

        {/* Horizontal Scrollable Quick Recommendation Chips Based on Child Names */}
        <div
          role="region"
          aria-label={isEn ? 'Child AI Recommendation Chips' : 'شريط توصيات المساعد الذكي باسم الطفل'}
          className="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap no-scrollbar pb-0.5"
        >
          {quickChildPromptChips.map((chip) => (
            <button
              key={chip.id}
              type="button"
              data-testid={`home-ai-chip-${chip.id}`}
              onClick={() => handleSendHomeAiQuery(isEn ? chip.promptEn : chip.promptAr)}
              className="px-2.5 py-1 rounded-xl text-[10.5px] font-extrabold border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-muted)] dark:bg-[#142430] text-[var(--color-text)] dark:text-[#A5F3FC] hover:border-[#FF8C61] transition-all shrink-0 cursor-pointer"
            >
              {isEn ? chip.labelEn : chip.labelAr}
            </button>
          ))}
        </div>

        {/* Interactive AI Input Bar with Clean Microphone Icon (🎤) */}
        <div className="flex items-center gap-1.5">
          <button
            id="home-ai-voice-mic-btn"
            data-testid="home-ai-voice-mic-btn"
            type="button"
            onClick={handleToggleHomeVoiceMic}
            aria-pressed={homeAiVoiceActive}
            aria-label={isEn ? 'Voice input microphone' : 'ميكروفون التحدث الصوتي'}
            title={isEn ? 'Voice Input' : 'إدخال صوتي بالمايكروفون'}
            className={`w-9 h-9 rounded-xl text-sm font-extrabold border transition-all flex items-center justify-center shrink-0 cursor-pointer ${
              homeAiVoiceActive
                ? 'bg-rose-600 text-white border-rose-500 animate-pulse shadow-sm'
                : 'bg-[var(--color-control-muted)] dark:bg-[#142430] text-[var(--color-text)] dark:text-[#A5F3FC] border-[var(--color-border)] dark:border-[#1E3646] hover:border-[#FF8C61]'
            }`}
          >
            <span aria-hidden="true">{homeAiVoiceActive ? '⏹️' : '🎤'}</span>
          </button>

          <input
            type="text"
            value={homeAiPrompt}
            onChange={(e) => setHomeAiPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSendHomeAiQuery();
              }
            }}
            placeholder={
              isEn
                ? `Ask AI about ${activeKidName}'s routine, sleep, or tap 🎤...`
                : `اسأل المساعد الذكي عن ${activeKidName} أو اضغط 🎤...`
            }
            className="flex-1 min-w-0 rounded-xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-bg)] dark:bg-[#142430] px-3 py-1.5 text-xs font-semibold text-[var(--color-text)] dark:text-[#F8FAFC]"
          />

          <button
            type="button"
            data-testid="home-ai-send-btn"
            onClick={() => handleSendHomeAiQuery()}
            className="min-h-[36px] px-3 py-1.5 rounded-xl bg-[#0d9488] hover:bg-[#0f766e] text-white text-[11px] font-extrabold shrink-0 transition-all active:scale-95 cursor-pointer"
          >
            {isEn ? 'Ask ✨' : 'اسأل ✨'}
          </button>
        </div>

        {/* Instant AI Reply Bubble if user asked or tapped a chip */}
        {homeAiReply && (
          <div
            data-testid="home-ai-instant-reply"
            className="rounded-xl border border-[#0d9488]/40 dark:border-[#1E3646] bg-teal-50/70 dark:bg-[#142430] p-2.5 space-y-1.5 animate-page-enter"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10.5px] font-extrabold text-[#0d9488] dark:text-[#2DD4BF]">
                ✨ {isEn ? homeAiReply.badgeEn : homeAiReply.badgeAr}
              </span>
              <button
                type="button"
                onClick={() => setHomeAiReply(null)}
                aria-label={isEn ? 'Dismiss AI reply' : 'إغلاق الرد'}
                className="w-6 h-6 rounded-lg bg-white/80 dark:bg-[#101D26] text-[var(--color-text)] text-xs font-black flex items-center justify-center cursor-pointer"
              >
                ×
              </button>
            </div>
            <p className="text-xs font-semibold text-[var(--color-text)] dark:text-[#F8FAFC] leading-relaxed">
              {isEn ? homeAiReply.textEn : homeAiReply.textAr}
            </p>
            {onAddSuggestedRoutineTask && (
              <div className="pt-0.5 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => {
                    onAddSuggestedRoutineTask(
                      isEn ? homeAiReply.taskTitleEn : homeAiReply.taskTitleAr,
                      homeAiReply.taskTime,
                      activeTipKid?.id || null
                    );
                  }}
                  className="px-2.5 py-1 rounded-lg bg-[#0d9488] text-white text-[10.5px] font-extrabold cursor-pointer"
                >
                  + {isEn ? 'Add to Daily Routine' : 'أضف لجدول الروتين اليومي'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Personalized Family Action Plans Positioned Directly Beneath the Chat Interface */}
        <div
          id="home-proactive-family-tips"
          data-testid="home-proactive-family-tips"
          className="pt-2 border-t border-[var(--color-border)]/70 dark:border-[#1E3646] space-y-2"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-extrabold text-[var(--color-text)] dark:text-[#A5F3FC]">
              📋{' '}
              {isEn
                ? `Personalized Action Plans for ${activeKidName} (${activeTipKidAge?.label || '3–5 yrs'})`
                : `خطط العمل اليومية المخصصة لـ ${activeKidName} (${activeTipKidAge?.label || '3–5 سنوات'})`}
            </span>
            <button
              type="button"
              onClick={() => {
                setProactiveTipIndex((prev) => prev + 1);
                onShowToast?.(
                  isEn
                    ? `Extended fresh plans for ${activeKidName}!`
                    : `تم توليد خطط إضافية مخصصة لـ ${activeKidName}!`
                );
              }}
              className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-muted)] dark:bg-[#142430] text-[var(--color-text)] dark:text-[#F8FAFC] hover:border-[#FF8C61] transition-all cursor-pointer"
            >
              🔄 {isEn ? 'Extend Plans' : 'توليد خطة إضافية'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {dynamicHomeChildPlans.map((plan) => (
              <div
                key={plan.id}
                className="rounded-2xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-muted)]/55 dark:bg-[#142430] p-3.5 sm:p-4 flex flex-col justify-between gap-1.5"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-1.5 overflow-x-auto whitespace-nowrap no-scrollbar">
                    <span className="px-2 py-0.5 rounded-full bg-teal-500/15 text-[#0d9488] dark:text-[#2DD4BF] text-[9px] font-extrabold shrink-0">
                      {isEn ? plan.badgeEn : plan.badgeAr}
                    </span>
                    <span className="text-[9.5px] font-bold text-[var(--color-muted)] tabular-nums shrink-0">
                      🕒 {plan.time}
                    </span>
                  </div>
                  <h3 className="text-xs font-extrabold text-[var(--color-text)] dark:text-[#F8FAFC] leading-snug">
                    {isEn ? plan.titleEn : plan.titleAr}
                  </h3>
                  <p className="text-[10px] font-semibold text-[var(--color-muted)] dark:text-[#CBD5E1] leading-snug line-clamp-2">
                    {isEn ? plan.descEn : plan.descAr}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-[var(--color-border)]/50 dark:border-[#1E3646]">
                  <button
                    type="button"
                    onClick={() => handleSendHomeAiQuery(isEn ? plan.titleEn : plan.titleAr)}
                    className="text-[10px] font-extrabold text-[#0d9488] dark:text-[#A5F3FC] hover:underline cursor-pointer"
                  >
                    {isEn ? 'Customize in Chat' : 'تخصيص في المحادثة'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (onAddSuggestedRoutineTask) {
                        onAddSuggestedRoutineTask(
                          isEn ? plan.titleEn : plan.titleAr,
                          plan.time,
                          activeTipKid?.id || null
                        );
                      } else {
                        navigateTo('routine');
                      }
                    }}
                    className="px-2.5 py-1 rounded-lg bg-[#0d9488] hover:bg-[#0f766e] text-white text-[10px] font-extrabold transition-all active:scale-95 cursor-pointer"
                  >
                    + {isEn ? 'Add to Routine' : 'أضف للروتين'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. SLEEK LIVE WEATHER WIDGET STRIP (Current Temp, Condition & Interactive 5-Day Forecast) */}
      <LiveWeatherWidget
        city={activeCity}
        country={state.country}
        language={lang}
        darkMode={Boolean(state.darkMode)}
        userCoords={userCoords}
        onSelectCity={(cCode, cName) => onSelectPreciseCity(`${cCode}:${cName}`)}
      />

      {/* 4. COMPACT AUTO-PLAY HIGHLIGHTS CAROUSEL */}
      <SwipeableBannerCarousel
        slides={heroSlides}
        language={lang}
        darkMode={Boolean(state.darkMode)}
        autoPlayMs={4500}
        ariaLabel={isEn ? 'Featured Announcements Carousel' : 'اللافتات الترويجية المتحركة'}
      />

      {/* 5. CORE HUBS GRID WITH UNIFIED SOFT-FILLED ICONOGRAPHY */}
      <div className="space-y-3.5">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
                        <ThreeDIcon id={card.iconId} size={12} />
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
                        className="text-[9.5px] font-extrabold text-[#0d9488] dark:text-[#A5F3FC] hover:underline cursor-pointer"
                      >
                        {isEn ? 'Details' : 'تفاصيل'}
                      </button>
                    }
                    footerLeft={
                      <span className="text-[11px] font-extrabold text-[var(--color-text)] dark:text-[#F8FAFC] truncate">
                        {card.badge}
                      </span>
                    }
                    footerRight={
                      <button
                        type="button"
                        onClick={() => navigateTo(card.id)}
                        className="min-h-[30px] px-2.5 py-1 rounded-lg bg-[#0d9488] hover:bg-[#0f766e] text-white text-[10.5px] font-extrabold inline-flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
                      >
                        <span>{isEn ? 'Open' : 'افتح'}</span>
                        <span>{isEn ? '→' : '←'}</span>
                      </button>
                    }
                  />
                ))}
              </div>

              <div className="flex justify-center pt-0.5">
                <button
                  id="toggle-all-home-hubs-btn"
                  type="button"
                  onClick={() => setShowAllHomeHubs((prev) => !prev)}
                  className="min-h-[34px] px-4 py-1.5 rounded-xl text-[11px] font-extrabold border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-role-text)] hover:border-[var(--color-accent)] transition-colors"
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
        className="rounded-2xl sm:rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5 space-y-3 soft-card-surface"
      >
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 border-b border-[var(--color-border)] pb-2.5">
          <div className="text-center sm:text-start">
            <h2 className="text-sm sm:text-base font-extrabold text-[var(--color-heading)]">
              {isEn
                ? 'Local Services & Family Snapshot'
                : 'الخدمات القريبة وملخص الأسرة'}
            </h2>
            <p className="text-[10px] font-semibold text-[var(--color-muted)]">
              {isEn
                ? `Filtered for ${localizedCity}`
                : `مخصص لمدينة ${localizedCity}`}
            </p>
          </div>

          {/* Clean Internal Segmented Tabs with Unified ThreeDIcons */}
          <div
            role="tablist"
            aria-label={isEn ? 'Home organized sections' : 'تبويبات الشاشة الرئيسية المنظمة'}
            className="flex items-center gap-1 rounded-xl bg-[var(--color-control-muted)] p-1 overflow-x-auto whitespace-nowrap no-scrollbar max-w-full"
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
                  className={`min-h-[34px] px-3 py-1 rounded-xl text-[11px] font-extrabold transition-all inline-flex items-center gap-1.5 shrink-0 ${
                    active
                      ? 'bg-[var(--color-accent)] text-[var(--color-accent-contrast)] shadow-2xs'
                      : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
                  }`}
                >
                  <ThreeDIcon id={tab.iconId} size={13} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* TAB 1: NEARBY SERVICES & STORE */}
        {homeFocusTab === 'nearby' && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-2xl bg-[var(--color-surface)] dark:bg-[#101D26] p-4 border border-[var(--color-border)] dark:border-[#1E3646] soft-card-surface">
              <div className="flex flex-wrap items-center gap-2">
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
                  {isEn ? '🇸🇦 Saudi Arabia (15 · SAR)' : '🇸🇦 السعودية (١٥ منطقة · SAR)'}
                </button>
              </div>

              {/* Step 2: Dynamic Governorate / Region Selector Right Beside GPS Button */}
              <div className="flex flex-wrap items-center gap-2">
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
                      ? 'Region / City:'
                      : 'المنطقة / المدينة:'}
                  </span>
                </label>
                <select
                  id="home-city-filter-select"
                  value={`${state.country}:${activeCity}`}
                  onChange={(e) => onSelectPreciseCity(e.target.value)}
                  className="min-h-[38px] rounded-xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-bg)] dark:bg-[#142430] px-3 py-1.5 text-xs font-extrabold text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)] cursor-pointer"
                >
                  {activeCountryCities.map((c, idx) => (
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
            </div>

              <button
                type="button"
                onClick={() => navigateTo('services')}
                className="text-xs font-extrabold text-[var(--color-role-text)] hover:underline cursor-pointer"
              >
                {isEn ? 'Open Full Store →' : 'عرض المتجر كاملًا ←'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 py-0.5">
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
                  const isCompared = homeCompareIds.includes(item.id);
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
                          className="text-[9.5px] font-extrabold text-[#0d9488] dark:text-[#A5F3FC] hover:underline shrink-0 cursor-pointer"
                        >
                          {isEn ? 'Details' : 'تفاصيل'}
                        </button>
                      }
                      footerLeft={
                        <div
                          onClick={handleInspect}
                          className="flex items-baseline gap-1 tabular-nums cursor-pointer"
                        >
                          {origPrice && (
                            <span className="text-[9.5px] line-through text-[var(--color-muted)]">
                              {formatCurrency(origPrice, state.currency, state.language)}
                            </span>
                          )}
                          <strong className="text-xs font-extrabold text-[var(--color-text)] dark:text-[#F8FAFC] truncate">
                            {formatCurrency(price, state.currency, state.language)}
                          </strong>
                        </div>
                      }
                      footerRight={
                        <>
                          <button
                            type="button"
                            onClick={() => toggleHomeCompare(item)}
                            aria-pressed={isCompared}
                            title={isEn ? 'Compare Product' : 'مقارنة المنتج'}
                            aria-label={isEn ? 'Compare Product' : 'مقارنة المنتج'}
                            className={`h-7 px-2 rounded-lg border text-[9.5px] font-extrabold flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer ${
                              isCompared
                                ? 'bg-[#0d9488] border-[#0d9488] text-white'
                                : 'border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-muted)] dark:bg-[#142430] text-[var(--color-text)] dark:text-[#A5F3FC] hover:border-[#0d9488]'
                            }`}
                          >
                            <CompareArrowsIcon size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleHomeWishlist(item)}
                            title={isEn ? 'Save to Wishlist' : 'احفظ في الأمنيات'}
                            aria-label={isEn ? 'Toggle Wishlist' : 'إضافة للمفضلة'}
                            className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all active:scale-95 cursor-pointer ${
                              isWishlisted
                                ? 'bg-[#FF8C61] border-[#FF8C61] text-white'
                                : 'border-orange-200/80 dark:border-[#1E3646] bg-orange-50/80 dark:bg-[#142430] text-[#FF8C61] hover:bg-[#FF8C61] hover:text-white'
                            }`}
                          >
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
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
                            className="w-7 h-7 rounded-lg bg-[#0d9488] hover:bg-[#0f766e] text-white flex items-center justify-center shadow-2xs transition-all active:scale-95 cursor-pointer"
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

import React, { useMemo, useState } from 'react';
import {
  COUNTRY_CITIES_MAP,
  CalendarEvent,
  CommercialCatalogItem,
  FamilySpaceState,
  LanguageCode,
  ParentProfileThemeSpec,
  calculateChildAge,
  locText,
} from '../domain/familySpaceCore';
import {
  FamilyMoodBarometer,
  MasterPatternCard,
  SoftFilledIcon,
  StarOfTheDayCrownBadge,
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
  onSelectPreciseCity: (combinedValue: string) => void;
  onUseCurrentLocation: () => void;
  onAddToCart: (item: CommercialCatalogItem) => void;
  onInspectCommercialItem?: (item: CommercialCatalogItem) => void;
  onAddProductToWishes?: (item: CommercialCatalogItem) => void;
  onAddSuggestedRoutineTask?: (taskName: string, timeStr: string, kidId: number | null) => void;
  onShowToast?: (msg: string) => void;
  onOpenStoreCategory?: (categoryId: string) => void;
  onReplaySplash?: () => void;
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
  navigateTo,
  onSelectPreciseCity,
  onAddSuggestedRoutineTask,
  onShowToast,
  onOpenStoreCategory,
}) => {
  const isEn = lang === 'en';

  // Selected Child Index for Dashboard Context
  const [selectedKidIdx, setSelectedKidIdx] = useState<number>(0);

  // Daily Essentials Interactive States (Scoped per Child ID)
  const [selectedMealSlot, setSelectedMealSlot] = useState<'breakfast' | 'lunchbox' | 'snack'>('lunchbox');
  const [waterCupsByKid, setWaterCupsByKid] = useState<Record<number, number>>(() => {
    const initial: Record<number, number> = {};
    state.kids.forEach((k, idx) => {
      initial[k.id] = idx === 0 ? 4 : 3;
    });
    return initial;
  });
  const [selectedSportSlot, setSelectedSportSlot] = useState<'cardio' | 'balance' | 'outdoor'>('outdoor');
  const [completedSportByKid, setCompletedSportByKid] = useState<Record<number, boolean>>({});
  const [showPromoShowcase, setShowPromoShowcase] = useState<boolean>(false);

  const activeCountryCities = COUNTRY_CITIES_MAP[state.country] || COUNTRY_CITIES_MAP.EG;
  const resolvedHomeCityObj =
    activeCountryCities.find(
      (c) =>
        c.id === state.city ||
        (state.city && (c.id.includes(state.city) || state.city.includes(c.id)))
    ) || activeCountryCities[0];
  const activeCity = resolvedHomeCityObj.id;
  const localizedCity = isEn ? resolvedHomeCityObj.nameEn : resolvedHomeCityObj.nameAr;

  const activeKid = state.kids[selectedKidIdx] || state.kids[0];
  const activeKidId = activeKid?.id ?? 1;
  const activeKidAge = activeKid ? calculateChildAge(activeKid.birth, lang) : null;
  const activeKidName = activeKid ? locText(activeKid.name, lang) : isEn ? 'Your Child' : 'طفلك';
  const activeKidStageLabel = activeKidAge?.label || (isEn ? '3–5 yrs' : '٣–٥ سنوات');

  // Time-Aware Greeting & Smart Daily Activity Recommendation
  const timeAwareSpec = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return {
        icon: '☀️',
        periodAr: 'صباح الإشراق والنشاط',
        periodEn: 'Good Morning & Bright Energy',
        recTitleAr: `توصية الصباح لـ ${activeKidName}`,
        recTitleEn: `Morning Activity Tip for ${activeKidName}`,
        recBodyAr: `الطقس في ${localizedCity} مناسب لتهوية الغرفة، فطور صحي غني بالبروتين، و١٥ دقيقة لعب حركي قبل الحضانة أو المدرسة.`,
        recBodyEn: `Fresh morning in ${localizedCity} — ideal for a protein breakfast and 15 mins of active stretching with ${activeKidName}.`,
      };
    }
    if (hour >= 12 && hour < 17) {
      return {
        icon: '🌤️',
        periodAr: 'نهاركم سعيد ومليان حيوية',
        periodEn: 'Good Afternoon & Joyful Vibes',
        recTitleAr: `توصية الظهيرة والعصر لـ ${activeKidName}`,
        recTitleEn: `Afternoon Activity Tip for ${activeKidName}`,
        recBodyAr: `أفضل وقت لترطيب الجسم بالمياه، وجبة غداء متوازنة، ونشاط رياضي خفيف في الهواء الطلق أو النادي في ${localizedCity}.`,
        recBodyEn: `Great afternoon in ${localizedCity} for hydration, balanced lunch, and outdoor park or club play with ${activeKidName}.`,
      };
    }
    return {
      icon: '🌙',
      periodAr: 'مساء الهدوء والدفء العائلي',
      periodEn: 'Good Evening & Calm Family Time',
      recTitleAr: `توصية المساء الهادئ لـ ${activeKidName}`,
      recTitleEn: `Evening Wind-Down Tip for ${activeKidName}`,
      recBodyAr: `أمسية لطيفة في ${localizedCity} — ينصح بتخفيف الإضاءة، إيقاف الشاشات، وقراءة قصة قصيرة مع ${activeKidName} قبل النوم.`,
      recBodyEn: `Cozy evening in ${localizedCity} — dim the lights, pause screens, and enjoy a short bedtime story with ${activeKidName}.`,
    };
  }, [activeKidName, localizedCity]);

  // 1. Daily Nutrition & Lunchbox Data for Selected Child
  const nutritionPlans = useMemo(() => {
    return {
      breakfast: {
        badgeAr: '🥣 فطور الطاقة والتركيز',
        badgeEn: '🥣 Morning Brain Breakfast',
        titleAr: `شوفان بالحليب والفواكه مع بيضة مسلوقة لـ ${activeKidName}`,
        titleEn: `Oatmeal with Berries & Boiled Egg for ${activeKidName}`,
        descAr: 'غني بالحديد والكالسيوم وفيتامين D لدعم التركيز والذاكرة طوال الصباح.',
        descEn: 'Rich in iron, calcium & vitamin D to fuel morning focus and immunity.',
        time: '08:00 ص',
        calories: '320 kcal',
      },
      lunchbox: {
        badgeAr: '🍱 اللانش بوكس المتوازن',
        badgeEn: '🍱 Balanced Healthy Lunchbox',
        titleAr: `ساندويتش حبوب كاملة + خيار وجزر + تفاح ومكسرات لـ ${activeKidName}`,
        titleEn: `Whole-Grain Wrap + Veggie Sticks & Apple Slices for ${activeKidName}`,
        descAr: 'وجبة متكاملة ألوانها مبهجة للطفل بدون سكريات مصنعة أو مواد حافظة.',
        descEn: 'Colorful, zero-preservative lunchbox packed with fiber and natural energy.',
        time: '11:30 ص',
        calories: '410 kcal',
      },
      snack: {
        badgeAr: '🍎 سناك المناعة والحيوية',
        badgeEn: '🍎 Immunity Afternoon Snack',
        titleAr: `زبادي يوناني بالعسل الطبيعي وشرائح الموز لـ ${activeKidName}`,
        titleEn: `Greek Yogurt with Natural Honey & Banana for ${activeKidName}`,
        descAr: 'خفيف وسريع الهضم ويمد الطفل بالبروبيوتيك والطاقة قبل التمرين.',
        descEn: 'Probiotic-rich, gentle snack boosting energy before afternoon play.',
        time: '04:00 م',
        calories: '210 kcal',
      },
    };
  }, [activeKidName]);

  const currentNutrition = nutritionPlans[selectedMealSlot];

  // 2. Hydration / Water Goal Data for Selected Child
  const targetWaterCups = activeKidAge && activeKidAge.years < 3 ? 5 : 6;
  const currentWaterCups = waterCupsByKid[activeKidId] ?? 4;
  const waterProgressPct = Math.min(100, Math.round((currentWaterCups / targetWaterCups) * 100));

  const handleAdjustWater = (delta: number) => {
    setWaterCupsByKid((prev) => {
      const current = prev[activeKidId] ?? 4;
      const next = Math.max(0, Math.min(10, current + delta));
      if (delta > 0 && next === targetWaterCups) {
        onShowToast?.(
          isEn
            ? `🎉 Bravo! ${activeKidName} completed today's hydration goal (${targetWaterCups} cups)!`
            : `🎉 برافو! أتمّ ${activeKidName} هدف شرب المياه اليومي (${targetWaterCups} أكواب)!`
        );
      }
      return { ...prev, [activeKidId]: next };
    });
  };

  // 3. Physical Sports & Activity Data for Selected Child
  const sportActivities = useMemo(() => {
    return {
      outdoor: {
        badgeAr: '⚽ نشاط خارجي وحركة',
        badgeEn: '⚽ Outdoor Park & Ball Play',
        titleAr: `٢٥ دقيقة جري ولعب بالكرة أو الدراجة مع ${activeKidName}`,
        titleEn: `25-Min Bike Ride & Ball Play with ${activeKidName}`,
        descAr: 'ينمّي التآزر الحركي والعضلي ويفرغ طاقة الطفل بشكل إيجابي وممتع.',
        descEn: 'Builds gross motor coordination, cardiovascular health, and joyful sleep.',
        time: '05:00 م',
      },
      balance: {
        badgeAr: '🧘‍♂️ توازن ومرونة بدنية',
        badgeEn: '🧘‍♂️ Balance & Core Flexibility',
        titleAr: `١٥ دقيقة تمارين توازن وإطالة مرحة في البيت لـ ${activeKidName}`,
        titleEn: `15-Min Fun Indoor Balance & Stretching for ${activeKidName}`,
        descAr: 'يقوّي عضلات الظهر والوقوف السليم ويزيد التركيز الذهني بدون شاشات.',
        descEn: 'Strengthens posture, core stability, and screen-free mindfulness.',
        time: '04:30 م',
      },
      cardio: {
        badgeAr: '🏃‍♂️ تحدي اللياقة السريع',
        badgeEn: '🏃‍♂️ Active Fitness Circuit',
        titleAr: `تحدي القفز والحركة الموسيقية (٢٠ دقيقة) لـ ${activeKidName}`,
        titleEn: `20-Min Musical Jump & Agility Circuit for ${activeKidName}`,
        descAr: 'ثلاث جولات قصيرة من القفز والتقاط الكرات لتنشيط الدورة الدموية.',
        descEn: 'Three playful rounds of jumping jacks and ball-toss agility.',
        time: '06:00 م',
      },
    };
  }, [activeKidName]);

  const currentSport = sportActivities[selectedSportSlot];
  const isSportDoneToday = Boolean(completedSportByKid[activeKidId]);

  // Clean Minimalist Gateways Grid Items
  const minimalistGateways: Array<{
    id: PageId;
    iconId: ThreeDIconId;
    titleAr: string;
    titleEn: string;
    subAr: string;
    subEn: string;
    statAr: string;
    statEn: string;
    accentClass: string;
  }> = [
    {
      id: 'services',
      iconId: 'services',
      titleAr: 'المتجر السريع',
      titleEn: 'Express Store',
      subAr: 'ألعاب مونتيسوري، ملابس وحضانات',
      subEn: 'Montessori toys, apparel & nurseries',
      statAr: cartItemCount > 0 ? `${cartItemCount} بالسلة` : '٠–٨ سنوات',
      statEn: cartItemCount > 0 ? `${cartItemCount} in Cart` : 'Ages 0–8',
      accentClass: 'hover:border-[#FF8C61]',
    },
    {
      id: 'assistant',
      iconId: 'assistant',
      titleAr: 'المساعد الذكي',
      titleEn: 'AI Assistant',
      subAr: 'مستشار تربوي وخطط يومية',
      subEn: 'Parenting advisor & daily plans',
      statAr: '٣ موديلات ذكية',
      statEn: '3 AI Models',
      accentClass: 'hover:border-[#0d9488]',
    },
    {
      id: 'medical',
      iconId: 'health',
      titleAr: 'الدكتور والعيادة',
      titleEn: 'Pediatric Clinic',
      subAr: 'أطباء أطفال وتطعيمات ونمو',
      subEn: 'Verified doctors & vaccinations',
      statAr: 'حجز فوري',
      statEn: 'Instant Book',
      accentClass: 'hover:border-emerald-500',
    },
    {
      id: 'media',
      iconId: 'video',
      titleAr: 'ريلز التربية 9:16',
      titleEn: 'Parenting Reels',
      subAr: 'فيديوهات إرشادية في ٦٠ ثانية',
      subEn: '60s visual parenting guides',
      statAr: 'فيديو وبودكاست',
      statEn: 'Reels & Audio',
      accentClass: 'hover:border-indigo-500',
    },
    {
      id: 'community',
      iconId: 'star',
      titleAr: 'لمة الآباء',
      titleEn: 'Parents Hub',
      subAr: 'تجارب ونقاشات آمنة وموثقة',
      subEn: 'Verified parent discussions',
      statAr: 'مجتمع آمن',
      statEn: 'Safe Hub',
      accentClass: 'hover:border-amber-500',
    },
    {
      id: 'routine',
      iconId: 'routine',
      titleAr: 'الروتين اليومي',
      titleEn: 'Daily Routine',
      subAr: 'مهام الأطفال والتذكيرات الذكية',
      subEn: 'Kids habits & smart reminders',
      statAr: `${completedTasksCount}/${state.tasks.length} مكتمل`,
      statEn: `${completedTasksCount}/${state.tasks.length} Done`,
      accentClass: 'hover:border-[#0d9488]',
    },
    {
      id: 'calendar',
      iconId: 'calendar',
      titleAr: 'التقويم والمواعيد',
      titleEn: 'Family Calendar',
      subAr: nearestEvent ? locText(nearestEvent.title, lang) : 'مواعيد العيلة والتطعيمات',
      subEn: nearestEvent ? locText(nearestEvent.title, lang) : 'Shared events & checkups',
      statAr: `${state.events.length} مواعيد`,
      statEn: `${state.events.length} Events`,
      accentClass: 'hover:border-sky-500',
    },
    {
      id: 'children',
      iconId: 'children',
      titleAr: 'أولادنا 3D',
      titleEn: '3D Kids Profiles',
      subAr: 'هوية 3D ومتابعة الطول والوزن',
      subEn: '3D avatars & growth charts',
      statAr: `${state.kids.length} أطفال`,
      statEn: `${state.kids.length} Kids`,
      accentClass: 'hover:border-rose-400',
    },
  ];

  return (
    <section
      className="space-y-5 sm:space-y-6"
      aria-label={isEn ? 'Family Care Dashboard' : 'لوحة رعاية الأسرة والطفل'}
    >
      {/* =====================================================================
          1. DYNAMIC TIME-AWARE HERO & LIVE WEATHER ACTIVITY RECOMMENDATION
          ===================================================================== */}
      <div
        id="home-core-value-hero"
        data-testid="home-core-value-hero"
        data-parent-profile={parentProfileSpec.role}
        style={{
          borderColor: parentProfileSpec.badgeBorderCss,
        }}
        className="rounded-3xl border-2 bg-[var(--color-surface)] dark:bg-[#101D26] p-5 sm:p-7 flex flex-col justify-between gap-4 shadow-sm"
      >
        <div className="space-y-3">
          {/* Clean Uncluttered Top Context Line + Official Slogan Pill */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-extrabold">
            <div className="inline-flex items-center gap-2 text-[var(--color-text)] dark:text-[#F8FAFC]">
              <span>{timeAwareSpec.icon}</span>
              <span>{isEn ? timeAwareSpec.periodEn : timeAwareSpec.periodAr}</span>
              <span aria-hidden="true" className="opacity-50">·</span>
              <span className="text-[#0d9488] dark:text-[#2DD4BF]">📍 {localizedCity}</span>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 text-[#0d9488] dark:text-[#2DD4BF] border border-teal-500/20 text-[11px] font-black">
              <span>✨</span>
              <span>
                {isEn ? 'Growing Together with Love' : 'مساحة تجمعنا.. وبحبهم نكبر'}
              </span>
            </span>
          </div>

          {/* Main Greeting Heading */}
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h1
                id="home-main-greeting-heading"
                className="text-xl sm:text-2xl font-black text-[var(--color-text)] dark:text-[#F8FAFC] leading-snug"
              >
                {isEn ? parentProfileSpec.greetingEn : parentProfileSpec.greetingAr}
              </h1>
              <span className="text-[11px] font-bold text-[var(--color-muted)] dark:text-[#94A3B8]">
                {todayFormattedCombined}
              </span>
            </div>
            <p className="text-xs sm:text-sm font-bold text-[var(--color-muted)] dark:text-[#CBD5E1] leading-relaxed">
              {isEn ? timeAwareSpec.recBodyEn : timeAwareSpec.recBodyAr}
            </p>
          </div>
        </div>

        {/* Live Weather Strip Embedded Seamlessly */}
        <LiveWeatherWidget
          city={activeCity}
          country={state.country}
          language={lang}
          darkMode={Boolean(state.darkMode)}
          userCoords={userCoords}
          onSelectCity={(cCode, cName) => onSelectPreciseCity(`${cCode}:${cName}`)}
        />
      </div>

      {/* Emotional Family Energy & Mood Gauge Meter */}
      <FamilyMoodBarometer
        language={lang}
        darkMode={Boolean(state.darkMode)}
        onSelectMood={(_, msg) => onShowToast?.(msg)}
      />

      {/* =====================================================================
          1B. DAILY HERO CHALLENGE & PARENTING WISDOM (SOLID HIGH-CONTRAST CARDS)
          ===================================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Daily Hero Challenge Card */}
        <div
          id="home-daily-hero-challenge"
          data-testid="home-daily-hero-challenge"
          className="rounded-3xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-surface)] dark:bg-[#101D26] p-5 flex flex-col justify-between gap-3 shadow-2xs"
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[11px] font-black">
                🏆 {isEn ? 'Daily Hero Challenge' : 'تحدي بطل اليوم'}
              </span>
              <span className="text-[11px] font-extrabold text-[#0d9488] dark:text-[#2DD4BF]">
                +25 ⭐ {isEn ? 'Points' : 'نقطة تشجيع'}
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-black text-[var(--color-text)] dark:text-[#F8FAFC]">
              {isEn
                ? `15-Minute Tidy-Up & Gratitude Circle with ${activeKidName}`
                : `١٥ دقيقة ترتيب الألعاب بمرح + جملة شكر مع ${activeKidName}`}
            </h3>
            <p className="text-xs font-semibold text-[var(--color-muted)] dark:text-[#94A3B8] leading-relaxed">
              {isEn
                ? 'Turn cleanup into a quick team race before dinner and celebrate together!'
                : 'حوّلوا ترتيب الغرفة لسباق عائلي مبهج على أنشودة قصيرة واحتفلوا بالإنجاز معاً!'}
            </p>
          </div>
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-[var(--color-border)]/60 dark:border-[#1E3646]">
            <span className="text-[11px] font-bold text-[var(--color-muted)] dark:text-[#94A3B8]">
              👶 {activeKidName} ({activeKidStageLabel})
            </span>
            <button
              type="button"
              onClick={() => {
                onShowToast?.(
                  isEn
                    ? `🏆 Bravo! ${activeKidName} completed the Daily Hero Challenge (+25 ⭐)!`
                    : `🏆 بطل رائع! أتمّ ${activeKidName} تحدي بطل اليوم وحصل على +٢٥ نجمة تشجيع!`
                );
              }}
              className="min-h-[34px] px-3.5 py-1 rounded-xl bg-[#FF8C61] hover:bg-[#e86a3d] text-white text-[11px] font-extrabold transition-all active:scale-95 cursor-pointer"
            >
              {isEn ? 'Complete Challenge 🎉' : 'إتمام التحدي 🎉'}
            </button>
          </div>
        </div>

        {/* Daily Parenting Wisdom Card */}
        <div
          id="home-daily-parenting-wisdom"
          data-testid="home-daily-parenting-wisdom"
          className="rounded-3xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-surface)] dark:bg-[#101D26] p-5 flex flex-col justify-between gap-3 shadow-2xs"
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-teal-500/15 text-[#0d9488] dark:text-[#2DD4BF] text-[11px] font-black">
                💡 {isEn ? 'Daily Parenting Wisdom' : 'حكمة ومعلومة تربوية اليوم'}
              </span>
              <span className="text-[11px] font-bold text-[var(--color-muted)] dark:text-[#94A3B8]">
                {isEn ? 'Positive Discipline' : 'تربية إيجابية ذكية'}
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-black text-[var(--color-text)] dark:text-[#F8FAFC]">
              {isEn
                ? 'Connection Before Correction Builds Lifelong Confidence'
                : '«التواصل العاطفي قبل التوجيه» يصنع طفلاً واثقاً ومتعاوناً'}
            </h3>
            <p className="text-xs font-semibold text-[var(--color-muted)] dark:text-[#94A3B8] leading-relaxed">
              {isEn
                ? `When ${activeKidName} feels heard for 30 seconds at eye level, cooperation increases naturally without power struggles.`
                : `النزول لمستوى نظر ${activeKidName} واحتواء مشاعره لمدة ٣٠ ثانية قبل إعطاء التوجيه يضاعف استجابته بهدوء وحب.`}
            </p>
          </div>
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-[var(--color-border)]/60 dark:border-[#1E3646]">
            <span className="text-[11px] font-extrabold text-[#0d9488] dark:text-[#2DD4BF]">
              ✨ {isEn ? 'Verified Pediatric Psychology Tip' : 'توصية خبراء علم نفس الطفل'}
            </span>
            <button
              type="button"
              onClick={() => navigateTo('assistant')}
              className="min-h-[34px] px-3.5 py-1 rounded-xl border border-[#0d9488]/40 bg-teal-500/10 hover:bg-teal-500/20 text-[#0d9488] dark:text-[#2DD4BF] text-[11px] font-extrabold transition-all cursor-pointer"
            >
              {isEn ? 'Ask AI Advisor →' : 'اسأل المستشار الذكي ←'}
            </button>
          </div>
        </div>
      </div>

      {/* =====================================================================
          2. REFINED KIDS CAROUSEL & ELEVATED MODULAR CARDS (ملفات الأطفال)
          ===================================================================== */}
      <div
        id="home-kids-switcher-bar"
        data-testid="home-kids-switcher-bar"
        className="rounded-3xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-surface)] dark:bg-[#101D26] p-5 sm:p-6 space-y-4 soft-card-surface shadow-sm"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-teal-500/15 text-[#0d9488] dark:text-[#2DD4BF] flex items-center justify-center text-base">
                👶
              </span>
              <h2 className="text-base sm:text-lg font-black text-[var(--color-text)] dark:text-[#F8FAFC]">
                {isEn ? 'Our Children · Active Care Context' : 'ملفات أطفالنا · تخصيص لوحة الرعاية اليومية'}
              </h2>
            </div>
            <p className="text-xs font-semibold text-[var(--color-muted)] dark:text-[#94A3B8]">
              {isEn
                ? `Tailoring nutrition, hydration & sports for ${activeKidName} (${activeKidStageLabel})`
                : `يتم تخصيص التغذية وشرب المياه والنشاط البدني تلقائياً حسب مرحلة ${activeKidName} (${activeKidStageLabel})`}
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigateTo('children')}
            className="min-h-[38px] px-4 py-2 rounded-2xl border border-teal-500/35 bg-teal-500/10 hover:bg-[#0d9488] hover:text-white text-xs font-extrabold text-[#0d9488] dark:text-[#2DD4BF] transition-all cursor-pointer shrink-0 shadow-2xs"
          >
            {isEn ? 'Manage 3D Profiles →' : 'إدارة ملفات الأطفال 3D ←'}
          </button>
        </div>

        {/* Horizontal Carousel of Elevated Modular Child Cards */}
        <div
          role="tablist"
          aria-label={isEn ? 'Children Switcher' : 'شريط اختيار الطفل'}
          className="flex items-stretch gap-4 overflow-x-auto no-scrollbar pt-1 pb-2"
        >
          {state.kids.map((kid, idx) => {
            const isSelected = idx === selectedKidIdx;
            const ageInfo = calculateChildAge(kid.birth, lang);
            const displayKidName = locText(kid.name, lang);
            const kidInterests = locText(kid.interests || 'القصص والمكعبات', lang);
            const kidDoneCount = state.tasks.filter(
              (tItem) => tItem.done && (Number(tItem.kidId) === kid.id || tItem.kidId === null)
            ).length;
            const kidWaterCups = waterCupsByKid[kid.id] ?? 4;

            return (
              <button
                key={kid.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                data-testid={`home-kid-switcher-${kid.id}`}
                onClick={() => {
                  setSelectedKidIdx(idx);
                  onShowToast?.(
                    isEn
                      ? `Dashboard updated for ${displayKidName} (${ageInfo.label})`
                      : `تم تخصيص لوحة اليوم لـ ${displayKidName} (${ageInfo.label})`
                  );
                }}
                className={`min-w-[270px] sm:min-w-[305px] rounded-3xl border-2 p-4 sm:p-5 text-start transition-all duration-300 flex flex-col justify-between gap-3.5 shrink-0 cursor-pointer ${
                  isSelected
                    ? 'border-[#0d9488] bg-gradient-to-br from-teal-50/90 via-white to-amber-50/50 dark:from-[#142430] dark:via-[#101D26] dark:to-[#142430] ring-4 ring-[#0d9488]/15 shadow-md -translate-y-0.5'
                    : 'border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-surface)] dark:bg-[#0B131A]/85 hover:border-[#0d9488]/60 hover:shadow-sm'
                }`}
              >
                {/* Card Top Layer: 3D Avatar + Name + Active Pill */}
                <div className="flex items-start justify-between gap-3 w-full">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`p-1 rounded-2xl border transition-transform ${
                        isSelected
                          ? 'border-[#0d9488]/40 bg-white dark:bg-[#101D26] scale-105 shadow-xs'
                          : 'border-transparent'
                      }`}
                    >
                      <ThreeDChildAvatar
                        name={displayKidName}
                        gender={kid.gender}
                        stageCode={ageInfo.stageCode}
                        accessoryTheme={kid.avatarTheme || 'astronaut'}
                        photoDataUrl={kid.photoDataUrl}
                        useIllustratedAvatar={kid.useIllustratedAvatar}
                        size="sm"
                      />
                    </div>
                    <div className="min-w-0 space-y-1">
                      <div className="text-sm sm:text-base font-black text-[var(--color-text)] dark:text-[#F8FAFC] truncate">
                        {displayKidName}
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="px-2.5 py-0.5 rounded-full bg-teal-500/12 text-[#0d9488] dark:text-[#2DD4BF] border border-teal-500/20 text-[10.5px] font-black">
                          {ageInfo.label}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/12 text-amber-800 dark:text-amber-300 text-[10px] font-extrabold">
                          {ageInfo.stageTitle}
                        </span>
                      </div>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-black shrink-0 transition-all ${
                      isSelected
                        ? 'bg-[#0d9488] text-white shadow-2xs'
                        : 'bg-[var(--color-control-muted)] dark:bg-[#142430] text-[var(--color-muted)] dark:text-[#94A3B8]'
                    }`}
                  >
                    {isSelected
                      ? isEn
                        ? '✓ Active'
                        : '✓ نشط الآن'
                      : isEn
                      ? 'Select'
                      : 'اختيار'}
                  </span>
                </div>

                {/* Card Middle Layer: Interests & Star Crown */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-[var(--color-border)]/60 dark:border-[#1E3646] w-full">
                  <span className="text-[11px] font-bold text-[var(--color-muted)] dark:text-[#CBD5E1] truncate">
                    🎨 {kidInterests}
                  </span>
                  <StarOfTheDayCrownBadge
                    language={lang}
                    completedCount={Math.max(1, kidDoneCount)}
                  />
                </div>

                {/* Card Bottom Layer: Quick Daily Metrics Pills */}
                <div className="grid grid-cols-2 gap-2 w-full">
                  <div className="rounded-xl bg-[var(--color-control-muted)]/70 dark:bg-[#101D26] border border-[var(--color-border)]/70 dark:border-[#1E3646] px-2.5 py-1.5 flex items-center justify-between text-[10.5px] font-extrabold">
                    <span className="text-[var(--color-muted)] dark:text-[#94A3B8]">
                      💧 {isEn ? 'Water' : 'المياه'}
                    </span>
                    <span className="text-sky-600 dark:text-sky-400 tabular-nums">
                      {kidWaterCups} {isEn ? 'cups' : 'أكواب'}
                    </span>
                  </div>
                  <div className="rounded-xl bg-[var(--color-control-muted)]/70 dark:bg-[#101D26] border border-[var(--color-border)]/70 dark:border-[#1E3646] px-2.5 py-1.5 flex items-center justify-between text-[10.5px] font-extrabold">
                    <span className="text-[var(--color-muted)] dark:text-[#94A3B8]">
                      ✅ {isEn ? 'Routine' : 'الروتين'}
                    </span>
                    <span className="text-[#0d9488] dark:text-[#2DD4BF] tabular-nums">
                      {kidDoneCount} {isEn ? 'done' : 'مكتمل'}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* =====================================================================
          3. DAILY ESSENTIALS HUB (3-LAYER MODULAR CARDS: NUTRITION, HYDRATION, SPORTS)
          ===================================================================== */}
      <div
        id="home-daily-essentials-hub"
        data-testid="home-daily-essentials-hub"
        className="space-y-3.5"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
          <div>
            <h2 className="text-base sm:text-lg font-black text-[var(--color-text)] dark:text-[#F8FAFC]">
              🌟 {isEn ? `Daily Care Essentials for ${activeKidName}` : `أساسيات الرعاية اليومية لـ ${activeKidName}`}
            </h2>
            <p className="text-xs font-semibold text-[var(--color-muted)] dark:text-[#94A3B8]">
              {isEn
                ? 'Interactive nutrition & lunchbox, water intake goal, and physical activity'
                : 'التغذية واللانش بوكس، هدف شرب المياه، والنشاط البدني والرياضي اليومي'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* ESSENTIAL CARD 1: DAILY NUTRITION & LUNCHBOX */}
          <MasterPatternCard
            id="home-essential-nutrition-card"
            testId="home-essential-nutrition-card"
            tone="amber"
            categoryKey="nutrition"
            itemIdOrIndex={1}
            darkMode={Boolean(state.darkMode)}
            topLeftBadge={<span>{ isEn ? currentNutrition.badgeEn : currentNutrition.badgeAr }</span>}
            topRightBadge={<span>🕒 {currentNutrition.time}</span>}
            title={isEn ? currentNutrition.titleEn : currentNutrition.titleAr}
            metaLeft={
              <>
                <span>👶 {activeKidName} ({activeKidStageLabel})</span>
                <span aria-hidden="true">·</span>
                <span>🔥 {currentNutrition.calories}</span>
              </>
            }
            bodyContent={
              <div className="space-y-2.5 pt-1">
                <p className="text-xs font-semibold text-[var(--color-muted)] dark:text-[#CBD5E1] leading-relaxed">
                  {isEn ? currentNutrition.descEn : currentNutrition.descAr}
                </p>
                {/* Meal Slot Switcher Buttons */}
                <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                  {[
                    { id: 'breakfast' as const, labelAr: '🥣 الفطور', labelEn: '🥣 Breakfast' },
                    { id: 'lunchbox' as const, labelAr: '🍱 لانش بوكس', labelEn: '🍱 Lunchbox' },
                    { id: 'snack' as const, labelAr: '🍎 سناك', labelEn: '🍎 Snack' },
                  ].map((slot) => {
                    const active = selectedMealSlot === slot.id;
                    return (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={() => setSelectedMealSlot(slot.id)}
                        className={`py-1.5 px-2 rounded-xl text-[10.5px] font-extrabold border transition-all cursor-pointer ${
                          active
                            ? 'bg-[#0d9488] text-white border-[#0d9488] shadow-2xs'
                            : 'bg-[var(--color-control-muted)] dark:bg-[#142430] text-[var(--color-text)] dark:text-[#F8FAFC] border-[var(--color-border)] dark:border-[#1E3646]'
                        }`}
                      >
                        {isEn ? slot.labelEn : slot.labelAr}
                      </button>
                    );
                  })}
                </div>
              </div>
            }
            footerLeft={
              <span className="text-xs font-extrabold text-[var(--color-text)] dark:text-[#F8FAFC]">
                {isEn ? 'Healthy Meal Plan' : 'وجبة صحية متوازنة'}
              </span>
            }
            footerRight={
              <button
                type="button"
                onClick={() => {
                  if (onAddSuggestedRoutineTask) {
                    onAddSuggestedRoutineTask(
                      isEn ? currentNutrition.titleEn : currentNutrition.titleAr,
                      currentNutrition.time,
                      activeKid?.id || null
                    );
                  } else {
                    navigateTo('routine');
                  }
                }}
                className="min-h-[34px] px-3 py-1 rounded-xl bg-[#0d9488] hover:bg-[#0f766e] text-white text-[11px] font-extrabold transition-all active:scale-95 cursor-pointer"
              >
                + {isEn ? 'Add to Routine' : 'أضف للروتين'}
              </button>
            }
          />

          {/* ESSENTIAL CARD 2: HYDRATION / WATER GOAL TRACKER */}
          <MasterPatternCard
            id="home-essential-hydration-card"
            testId="home-essential-hydration-card"
            tone="sky"
            categoryKey="medical"
            itemIdOrIndex={2}
            darkMode={Boolean(state.darkMode)}
            topLeftBadge={
              <span>💧 {isEn ? 'Hydration & Water Goal' : 'شرب المياه والترطيب'}</span>
            }
            topRightBadge={
              <span>
                {currentWaterCups}/{targetWaterCups} {isEn ? 'Cups' : 'أكواب'}
              </span>
            }
            title={
              isEn
                ? `${activeKidName}'s Daily Water Intake (${waterProgressPct}%)`
                : `معدل شرب المياه اليومي لـ ${activeKidName} (${waterProgressPct}٪)`
            }
            metaLeft={
              <>
                <span>📍 {localizedCity}</span>
                <span aria-hidden="true">·</span>
                <span>
                  {isEn
                    ? `Target: ${targetWaterCups} cups/day`
                    : `الهدف اليومي: ${targetWaterCups} أكواب`}
                </span>
              </>
            }
            bodyContent={
              <div className="space-y-2.5 pt-1">
                <p className="text-xs font-semibold text-[var(--color-muted)] dark:text-[#CBD5E1] leading-relaxed">
                  {currentWaterCups >= targetWaterCups
                    ? isEn
                      ? `Awesome! ${activeKidName} reached today's full hydration goal.`
                      : `ممتاز! أكمل ${activeKidName} هدف شرب المياه بالكامل اليوم.`
                    : isEn
                    ? `${targetWaterCups - currentWaterCups} more cup(s) recommended to keep ${activeKidName} hydrated and energized.`
                    : `متبقي ${targetWaterCups - currentWaterCups} أكواب مياه للحفاظ على تركيز ونشاط ${activeKidName} اليوم.`}
                </p>

                {/* Visual Water Cups Progress Bar */}
                <div className="space-y-1.5">
                  <div className="w-full h-2.5 rounded-full bg-sky-100 dark:bg-[#142430] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-sky-500 to-[#0d9488] transition-all duration-300"
                      style={{ width: `${waterProgressPct}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between gap-1 text-[11px] font-extrabold text-sky-700 dark:text-sky-300">
                    <span>
                      {Array.from({ length: targetWaterCups })
                        .map((_, i) => (i < currentWaterCups ? '💧' : '⚪'))
                        .join(' ')}
                    </span>
                    <span className="tabular-nums">
                      {currentWaterCups * 200} ml
                    </span>
                  </div>
                </div>
              </div>
            }
            footerLeft={
              <span className="text-xs font-extrabold text-[var(--color-text)] dark:text-[#F8FAFC]">
                {currentWaterCups} / {targetWaterCups} {isEn ? 'Cups Today' : 'أكواب اليوم'}
              </span>
            }
            footerRight={
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleAdjustWater(-1)}
                  aria-label={isEn ? 'Decrease water cup' : 'إنقاص كوب ماء'}
                  className="w-8 h-8 rounded-xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-muted)] dark:bg-[#142430] text-xs font-black text-[var(--color-text)] dark:text-[#F8FAFC] flex items-center justify-center cursor-pointer"
                >
                  −
                </button>
                <button
                  type="button"
                  data-testid="home-hydration-add-cup-btn"
                  onClick={() => handleAdjustWater(1)}
                  className="min-h-[34px] px-3 py-1 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-extrabold transition-all active:scale-95 cursor-pointer"
                >
                  + {isEn ? '1 Cup 💧' : 'كوب ماء 💧'}
                </button>
              </div>
            }
          />

          {/* ESSENTIAL CARD 3: PHYSICAL SPORTS & ACTIVITY */}
          <MasterPatternCard
            id="home-essential-sports-card"
            testId="home-essential-sports-card"
            tone="teal"
            categoryKey="sports"
            itemIdOrIndex={3}
            darkMode={Boolean(state.darkMode)}
            topLeftBadge={<span>{isEn ? currentSport.badgeEn : currentSport.badgeAr}</span>}
            topRightBadge={<span>🕒 {currentSport.time}</span>}
            title={isEn ? currentSport.titleEn : currentSport.titleAr}
            metaLeft={
              <>
                <span>👶 {activeKidName}</span>
                <span aria-hidden="true">·</span>
                <span>{isEn ? 'Motor & Physical Growth' : 'تنمية اللياقة والمهارات الحركية'}</span>
              </>
            }
            bodyContent={
              <div className="space-y-2.5 pt-1">
                <p className="text-xs font-semibold text-[var(--color-muted)] dark:text-[#CBD5E1] leading-relaxed">
                  {isEn ? currentSport.descEn : currentSport.descAr}
                </p>

                {/* Activity Type Switcher */}
                <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                  {[
                    { id: 'outdoor' as const, labelAr: '⚽ حديقة/كرة', labelEn: '⚽ Outdoor' },
                    { id: 'balance' as const, labelAr: '🧘‍♂️ توازن', labelEn: '🧘‍♂️ Balance' },
                    { id: 'cardio' as const, labelAr: '🏃‍♂️ لياقة', labelEn: '🏃‍♂️ Cardio' },
                  ].map((act) => {
                    const active = selectedSportSlot === act.id;
                    return (
                      <button
                        key={act.id}
                        type="button"
                        onClick={() => setSelectedSportSlot(act.id)}
                        className={`py-1.5 px-2 rounded-xl text-[10.5px] font-extrabold border transition-all cursor-pointer ${
                          active
                            ? 'bg-[#0d9488] text-white border-[#0d9488] shadow-2xs'
                            : 'bg-[var(--color-control-muted)] dark:bg-[#142430] text-[var(--color-text)] dark:text-[#F8FAFC] border-[var(--color-border)] dark:border-[#1E3646]'
                        }`}
                      >
                        {isEn ? act.labelEn : act.labelAr}
                      </button>
                    );
                  })}
                </div>
              </div>
            }
            footerLeft={
              <button
                type="button"
                onClick={() => {
                  if (onAddSuggestedRoutineTask) {
                    onAddSuggestedRoutineTask(
                      isEn ? currentSport.titleEn : currentSport.titleAr,
                      currentSport.time,
                      activeKid?.id || null
                    );
                  } else {
                    navigateTo('routine');
                  }
                }}
                className="text-[11px] font-extrabold text-[#0d9488] dark:text-[#2DD4BF] hover:underline cursor-pointer"
              >
                + {isEn ? 'Schedule in Routine' : 'جدولة في الروتين'}
              </button>
            }
            footerRight={
              <button
                type="button"
                data-testid="home-sports-complete-btn"
                onClick={() => {
                  const nextState = !isSportDoneToday;
                  setCompletedSportByKid((prev) => ({ ...prev, [activeKidId]: nextState }));
                  onShowToast?.(
                    nextState
                      ? isEn
                        ? `🏅 Great job! ${activeKidName} completed today's physical activity!`
                        : `🏅 بطل اليوم! أتمّ ${activeKidName} النشاط الرياضي اليومي بنجاح!`
                      : isEn
                      ? 'Activity status reset'
                      : 'تمت إعادة ضبط حالة النشاط الرياضي'
                  );
                }}
                className={`min-h-[34px] px-3 py-1 rounded-xl text-[11px] font-extrabold transition-all active:scale-95 cursor-pointer ${
                  isSportDoneToday
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-[#FF8C61] hover:bg-[#e86a3d] text-white'
                }`}
              >
                {isSportDoneToday
                  ? isEn
                    ? '✓ Completed'
                    : '✓ تم التمرين'
                  : isEn
                  ? 'Mark Done 🏅'
                  : 'إتمام التمرين 🏅'}
              </button>
            }
          />
        </div>
      </div>

      {/* =====================================================================
          4. MINIMALIST GATEWAYS GRID (Clean, Icon-Driven Navigation Tiles)
          ===================================================================== */}
      <div
        id="home-minimalist-gateways"
        data-testid="home-minimalist-gateways"
        className="rounded-3xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-surface)] dark:bg-[#101D26] p-4 sm:p-5 space-y-4 soft-card-surface shadow-2xs"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm sm:text-base font-extrabold text-[var(--color-text)] dark:text-[#F8FAFC]">
              🧭 {isEn ? 'Family Platform Gateways' : 'بوابات أقسام المنصة السريعة'}
            </h2>
            <p className="text-[11px] font-semibold text-[var(--color-muted)] dark:text-[#94A3B8]">
              {isEn
                ? 'Direct access to Store, AI Assistant, Medical Care, Reels, and Community'
                : 'انتقل مباشرة للمتجر، المساعد الذكي، الأطباء، الريلز، ولمة الآباء بلمسة واحدة'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowPromoShowcase((prev) => !prev)}
            aria-expanded={showPromoShowcase}
            className="min-h-[34px] px-3 py-1 rounded-xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-muted)] dark:bg-[#142430] text-[11px] font-extrabold text-[var(--color-text)] dark:text-[#A5F3FC] hover:border-[#FF8C61] transition-all inline-flex items-center gap-1.5 cursor-pointer"
          >
            <span>🔥</span>
            <span>
              {isEn
                ? showPromoShowcase
                  ? 'Hide Store Categories'
                  : 'Store Categories (0–8 yrs)'
                : showPromoShowcase
                ? 'إخفاء أقسام المتجر'
                : 'أقسام المتجر (٠–٨ سنوات)'}
            </span>
            <span className="text-[10px]">{showPromoShowcase ? '⌄' : '›'}</span>
          </button>
        </div>

        {/* 8 Clean Minimalist Gateway Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          {minimalistGateways.map((gw) => (
            <button
              key={gw.id}
              type="button"
              data-testid={`home-gateway-${gw.id}`}
              onClick={() => navigateTo(gw.id)}
              className={`rounded-2xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-muted)]/35 dark:bg-[#142430]/80 p-3.5 text-start flex flex-col justify-between gap-2.5 transition-all hover:scale-[1.01] active:scale-98 cursor-pointer group ${gw.accentClass}`}
            >
              <div className="flex items-center justify-between gap-2 w-full">
                <SoftFilledIcon id={gw.iconId} boxSize="sm" />
                <span className="text-[10px] font-bold text-[#0d9488] dark:text-[#2DD4BF] truncate">
                  {isEn ? gw.statEn : gw.statAr}
                </span>
              </div>
              <div className="space-y-0.5 min-w-0">
                <div className="text-xs sm:text-sm font-black text-[var(--color-text)] dark:text-[#F8FAFC] truncate flex items-center justify-between gap-1">
                  <span className="truncate">{isEn ? gw.titleEn : gw.titleAr}</span>
                  <span className="text-[11px] opacity-50 group-hover:opacity-100 transition-opacity shrink-0">
                    {isEn ? '→' : '←'}
                  </span>
                </div>
                <p className="text-[10.5px] font-semibold text-[var(--color-muted)] dark:text-[#94A3B8] line-clamp-1">
                  {isEn ? gw.subEn : gw.subAr}
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* Expandable Store Sub-Categories Drawer (Hidden by default; linked from Slide Bar #home-promotional-showcase) */}
        <div id="home-promotional-showcase" data-testid="home-promotional-showcase">
          {showPromoShowcase && (
            <div className="pt-3 border-t border-[var(--color-border)]/60 dark:border-[#1E3646] grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 animate-page-enter">
              {[
                {
                  catId: 'toys',
                  emoji: '🧸',
                  titleAr: 'ألعاب مونتيسوري',
                  titleEn: 'Montessori Toys',
                  ageAr: '٠–٨ سنوات',
                  ageEn: 'Ages 0–8',
                },
                {
                  catId: 'essentials',
                  emoji: '🍼',
                  titleAr: 'مستلزمات الرضع',
                  titleEn: 'Baby Essentials',
                  ageAr: '٠–٢ سنة',
                  ageEn: 'Ages 0–2',
                },
                {
                  catId: 'clothing',
                  emoji: '👟',
                  titleAr: 'أزياء وأحذية قطنية',
                  titleEn: 'Cotton Apparel',
                  ageAr: '٠–٨ سنوات',
                  ageEn: 'Ages 0–8',
                },
                {
                  catId: 'nursery',
                  emoji: '🏫',
                  titleAr: 'حضانات ومدارس',
                  titleEn: 'Verified Nurseries',
                  ageAr: '١–٨ سنوات',
                  ageEn: 'Ages 1–8',
                },
                {
                  catId: 'courses',
                  emoji: '🎨',
                  titleAr: 'كورسات وأنشطة',
                  titleEn: 'Skill Courses',
                  ageAr: '٣–٨ سنوات',
                  ageEn: 'Ages 3–8',
                },
                {
                  catId: 'books',
                  emoji: '💻',
                  titleAr: 'منصات وقصص',
                  titleEn: 'Online & Books',
                  ageAr: '٢–٨ سنوات',
                  ageEn: 'Ages 2–8',
                },
              ].map((promo) => (
                <button
                  key={promo.catId}
                  type="button"
                  onClick={() => {
                    if (onOpenStoreCategory) {
                      onOpenStoreCategory(promo.catId);
                    } else {
                      navigateTo('services');
                    }
                  }}
                  className="rounded-2xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-surface)] dark:bg-[#0B131A] hover:border-[#0d9488] p-3 text-start flex flex-col justify-between gap-1.5 transition-all cursor-pointer"
                >
                  <span className="text-lg leading-none">{promo.emoji}</span>
                  <div className="text-[11px] font-extrabold text-[var(--color-text)] dark:text-[#F8FAFC] truncate">
                    {isEn ? promo.titleEn : promo.titleAr}
                  </div>
                  <div className="text-[9.5px] font-bold text-[#0d9488] dark:text-[#2DD4BF]">
                    {isEn ? promo.ageEn : promo.ageAr}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

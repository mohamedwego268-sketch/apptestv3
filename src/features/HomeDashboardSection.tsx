import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Baby } from 'lucide-react';
import {
  CommercialItem,
  FamilySpaceState,
  LanguageCode,
  calculateChildAge,
  getDefaultCityForCountry,
  locText,
  sanitizeUserText,
} from '../domain/familySpaceCore';
import { PageId } from '../context/FamilyAppContext';
import {
  MasterPatternCard,
} from '../components/DesignSystem';
import { HeaderBarProfileSpec } from '../components/HeaderBar';
import { ParentingSupportCenter } from '../components/ParentingSupportCenter';
import { StoriesLibraryView } from '../components/StoriesLibraryView';
import { CatalogView } from '../components/CatalogView';
import { SectionToolsDrawer } from '../components/SectionToolsDrawer';
import { InternalVideoFeed } from '../components/InternalVideoFeed';
import { HomeContentTracks } from './HomeContentTracks';
import { HomeExpertContentNetwork } from './HomeExpertContentNetwork';
import { HomeValuesTrackSection } from './HomeValuesTrackSection';
import { HomeLearningTrackSection } from './HomeLearningTrackSection';
import { createChildLifeRecord, fetchDailyChildLifeRecords } from '../services/supabaseService';

export interface HomeDashboardSectionProps {
  state: FamilySpaceState;
  lang: LanguageCode;
  parentProfileSpec: HeaderBarProfileSpec;
  cartItemCount: number;
  completedTasksCount: number;
  todayFormattedCombined: string;
  navigateTo: (pageId: PageId) => void;
  onAddToCart: (item: CommercialItem, variant?: string) => void;
  onInspectCommercialItem: (item: CommercialItem) => void;
  onAddProductToWishes: (item: CommercialItem) => void;
  onAddSuggestedRoutineTask?: (taskName: string, timeStr: string, kidId: number | null) => void;
  onShowToast?: (msg: string) => void;
  bedtimeMode?: boolean;
  onToggleBedtimeMode?: () => void;
  onOpenStoreCategory?: (catId: string) => void;
  onReplaySplash?: () => void;
}

interface DailyReadAloudTip {
  id: string;
  timeBucket: 'morning' | 'afternoon' | 'evening';
  slotLabelAr: string;
  slotLabelEn: string;
  titleAr: string;
  titleEn: string;
  hostsAr: string;
  hostsEn: string;
  summaryAr: string;
  summaryEn: string;
  takeawayAr: string;
  takeawayEn: string;
}

const DAILY_READ_ALOUD_TIPS: DailyReadAloudTip[] = [
  {
    id: 'tip-morning',
    timeBucket: 'morning',
    slotLabelAr: '☀️ قراءة نصيحة الصباح',
    slotLabelEn: '☀️ Morning tip read-aloud',
    titleAr: 'ابدأ يومكم بلحظة تواصل بسيطة',
    titleEn: 'Begin the Day with a Small Moment Together',
    hostsAr: 'قراءة بصوت الجهاز',
    hostsEn: 'Read aloud with your device voice',
    summaryAr:
      'قبل ما تبدأوا مشاوير اليوم، خُدوا دقيقة تسمعوا طفلكم وتقولوا له إيه اللي هيحصل النهارده. الروتين الواضح بيساعده يستعد.',
    summaryEn:
      'A calm greeting and a warm moment of connection can help a child feel seen before the day begins.',
    takeawayAr: '💡 جرّب النهارده: قول لطفلك خطوتين أو تلاتة من خطة اليوم.',
    takeawayEn: '💡 Morning cue: Calm begins with our voice tone in the first 10 minutes.',
  },
  {
    id: 'tip-afternoon',
    timeBucket: 'afternoon',
    slotLabelAr: '🌤️ قراءة نصيحة الظهيرة',
    slotLabelEn: '🌤️ Afternoon tip read-aloud',
    titleAr: 'بعد الحضانة أو المدرسة: استمع أولاً، ثم اسأل',
    titleEn: 'After School: Listen First, Then Ask',
    hostsAr: 'قراءة بصوت الجهاز',
    hostsEn: 'Read aloud with your device voice',
    summaryAr:
      'سيب لطفلك فرصة يهدأ بعد الرجوع. اعرض عليه مية أو وجبة مناسبة لعمره، وبعدها اسأله سؤال بسيط عن يومه من غير تحقيق.',
    summaryEn:
      'When your child returns, allow time to settle, offer water or a suitable snack, then ask a gentle question about the day.',
    takeawayAr: '💡 جرّب النهارده: عشر دقايق لعب أو كلام من غير موبايل.',
    takeawayEn: '💡 Try a short moment of undivided attention, without pressure to make it perfect.',
  },
  {
    id: 'tip-evening',
    timeBucket: 'evening',
    slotLabelAr: '🌙 قراءة نصيحة المساء',
    slotLabelEn: '🌙 Evening tip read-aloud',
    titleAr: 'قبل النوم: اختتموا اليوم بهدوء وروتين ثابت',
    titleEn: 'End the Day with a Calm, Familiar Routine',
    hostsAr: 'قراءة بصوت الجهاز',
    hostsEn: 'A calm supportive moment for parents',
    summaryAr:
      'اختاروا نشاط هادي قبل النوم يناسب سن طفلكم: قصة قصيرة، حضن، أو كلام عن أحلى حاجة حصلت النهارده.',
    summaryEn:
      'You made it through another day. Choose a calm closing ritual that fits your family, and remember that rest is part of caring.',
    takeawayAr: '💡 جرّبوا: نفس الترتيب كل ليلة، مع مرونة لو اليوم اتأخر.',
    takeawayEn: '💡 A calm, caring goodbye to the day can help everyone transition toward rest.',
  },
];

interface WisdomGalleryCardItem {
  id: string;
  tagAr: string;
  tagEn: string;
  titleAr: string;
  titleEn: string;
  wisdomAr: string;
  wisdomEn: string;
  imageUrl: string;
  borderTone: string;
}

const PUBLIC_PARENTING_GALLERY_CARDS: WisdomGalleryCardItem[] = [
  {
    id: 'gal-1',
    tagAr: '👶🏻 التواصل المبكر',
    tagEn: '👶🏻 Early Connection',
    titleAr: 'ردّ على طفلك لما يحاول يتواصل',
    titleEn: 'Respond When Your Child Reaches Out',
    wisdomAr:
      'لما طفلك يبص لك أو يصدر صوت، رد عليه بابتسامة أو كلام بسيط. التفاعل المتبادل فرصة يومية للتواصل والتعلم.',
    wisdomEn:
      'When your child looks at you, babbles or gestures, respond warmly. These small back-and-forth moments support early communication.',
    imageUrl: 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?auto=format&fit=crop&w=700&q=80',
    borderTone: 'border-sky-500/40',
  },
  {
    id: 'gal-2',
    tagAr: '🎨 الخيال واللعب',
    tagEn: '🎨 Imagination & Play',
    titleAr: 'خليه يكمل حكايته للآخر',
    titleEn: 'Give Their Story Room to Grow',
    wisdomAr:
      'اسأل طفلك: «وبعدين حصل إيه؟» وسيبه يكمل الحكاية بطريقته. مش لازم تصحح كل تفصيلة.',
    wisdomEn:
      'Ask “What happened next?” and let your child lead the story. You do not need to correct every detail.',
    imageUrl: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=700&q=80',
    borderTone: 'border-rose-500/40',
  },
  {
    id: 'gal-3',
    tagAr: '🏆 الثقة بالمحاولة',
    tagEn: '🏆 Confidence Through Effort',
    titleAr: 'امدح المحاولة والمجهود',
    titleEn: 'Praise the Effort, Not Only the Result',
    wisdomAr:
      'امدح المجهود المحدد: «عجبني إنك حاولت تاني». ده أوضح وأفيد من المدح العام.',
    wisdomEn:
      'Notice a specific effort: “I liked how you tried again.” Specific encouragement shows children what they can repeat.',
    imageUrl: 'https://images.unsplash.com/photo-1484820540004-14229fe36ca4?auto=format&fit=crop&w=700&q=80',
    borderTone: 'border-amber-500/40',
  },
  {
    id: 'gal-4',
    tagAr: '💚 تعاون الأسرة',
    tagEn: '💚 Family Teamwork',
    titleAr: 'اتفقوا على تقسيم مسؤوليات البيت',
    titleEn: 'Make Family Responsibilities Clear',
    wisdomAr:
      'قسّموا المهام واتفقوا على طريقة واضحة للتعامل مع الروتين. مش لازم شخص واحد يشيل كل التفاصيل.',
    wisdomEn:
      'Agree who handles each part of the routine. Clear handovers reduce confusion and make care more consistent.',
    imageUrl: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=700&q=80',
    borderTone: 'border-teal-500/40',
  },
  {
    id: 'gal-5',
    tagAr: '🌙 روتين المساء',
    tagEn: '🌙 Bedtime Rhythm',
    titleAr: 'خلّوا آخر اليوم أهدى',
    titleEn: 'Create a Calmer End to the Day',
    wisdomAr:
      'اختاروا خطوات بسيطة ومتكررة قبل النوم: نشاط هادي، قصة أو حديث قصير، ثم إضاءة أخف. عدّلوا الروتين حسب احتياج طفلكم.',
    wisdomEn:
      'Choose a few predictable steps before bed: a calm activity, a short story or chat, then softer lighting. Adapt the routine to your child.',
    imageUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=700&q=80',
    borderTone: 'border-indigo-500/40',
  },
];

/**
 * Universal Home Accordion Card Wrapper (Checklist #3)
 * Wraps every Home accordion section with a clean header, badge, optional action, and an open/close arrow.
 */
interface HomeAccordionCardProps {
  id: string;
  testId: string;
  iconEmoji: string;
  iconBgClass: string;
  title: string;
  subtitle: string;
  badgeText?: string;
  badgeClass?: string;
  isOpen: boolean;
  onToggle: () => void;
  headerExtraAction?: React.ReactNode;
  borderClass?: string;
  isEn: boolean;
  children: React.ReactNode;
}

const HomeAccordionCard: React.FC<HomeAccordionCardProps> = ({
  id,
  testId,
  iconEmoji,
  iconBgClass,
  title,
  subtitle,
  badgeText,
  badgeClass = 'bg-teal-500/12 text-[#0d9488] dark:text-[#2DD4BF]',
  isOpen,
  onToggle,
  headerExtraAction,
  borderClass = 'border-gray-100 dark:border-[#1E3646]',
  isEn,
  children,
}) => {
  return (
    <div
      id={id}
      data-testid={testId}
      data-collapsible-section="true"
      dir={isEn ? 'ltr' : 'rtl'}
      className={`bg-white dark:bg-[#101D26] shadow-sm rounded-2xl p-4 border ${borderClass} space-y-4 transition-all duration-300 ease-in-out`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <button
          type="button"
          data-testid={`${testId}-toggle-btn`}
          aria-expanded={isOpen}
          onClick={onToggle}
          className="min-h-[48px] flex-1 min-w-[200px] flex items-center justify-between gap-3 text-start active:scale-95 transition-all duration-300 ease-in-out cursor-pointer group"
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <span
              className={`w-11 h-11 rounded-2xl ${iconBgClass} flex items-center justify-center text-lg shrink-0 shadow-2xs`}
            >
              {iconEmoji}
            </span>
            <div className="min-w-0 flex-1 space-y-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-semibold text-[var(--color-text)] dark:text-[#F8FAFC] leading-snug">
                  {title}
                </h2>
                {badgeText && (
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${badgeClass}`}>
                    {badgeText}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-[#94A3B8] leading-relaxed">
                {subtitle}
              </p>
            </div>
          </div>

          {/* Open / Close Accordion Arrow */}
          <span
            data-testid={`${testId}-arrow`}
            aria-hidden="true"
            className={`w-10 h-10 rounded-xl border border-gray-100 dark:border-[#1E3646] bg-slate-50 dark:bg-[#142430] text-[var(--color-text)] dark:text-[#F8FAFC] flex items-center justify-center text-xs font-black transition-transform duration-300 shrink-0 ${
              isOpen ? 'rotate-180 bg-teal-500/15 border-[#0d9488]/40 text-[#0d9488] dark:text-[#2DD4BF]' : ''
            }`}
          >
            ▼
          </span>
        </button>

        {headerExtraAction && <div className="shrink-0 w-full sm:w-auto">{headerExtraAction}</div>}
      </div>

      {isOpen && (
        <div
          data-testid={`${testId}-content`}
          className="pt-3 border-t border-gray-100 dark:border-[#1E3646] space-y-4 animate-page-enter transition-all duration-300 ease-in-out"
        >
          {children}
        </div>
      )}
    </div>
  );
};

export const HomeDashboardSection: React.FC<HomeDashboardSectionProps> = ({
  state,
  lang,
  parentProfileSpec,
  cartItemCount,
  completedTasksCount,
  todayFormattedCombined,
  navigateTo,
  onAddToCart,
  onInspectCommercialItem,
  onAddProductToWishes,
  onAddSuggestedRoutineTask,
  onShowToast,
  bedtimeMode = false,
  onToggleBedtimeMode,
  onOpenStoreCategory,
  onReplaySplash,
}) => {
  const isEn = lang === 'en';
  const [selectedKidIdx, setSelectedKidIdx] = useState<number>(0);

  useEffect(() => {
    if (selectedKidIdx >= state.kids.length && selectedKidIdx !== 0) {
      setSelectedKidIdx(Math.max(0, state.kids.length - 1));
    }
  }, [selectedKidIdx, state.kids.length]);

  // Shared open/close state for all Home accordion sections.
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({
    welcomeAudio: false,
    quickTrack: true,
    dailyWisdom: false,
    heroesArena: false,
    bedtimeStories: false,
    dailyEssentials: false,
    parentingSupport: false,
    learningTrack: false,
    valuesTrack: false,
    kidsGames: false,
    wisdomGallery: false,
    storeShowcase: false,
  });

  const toggleAccordion = (key: string) => {
    setOpenAccordions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const openHomeSection = (key: 'heroesArena' | 'parentingSupport' | 'valuesTrack' | 'dailyEssentials' | 'learningTrack' | 'sportsTrack') => {
    const sectionIds: Record<typeof key, string> = {
      heroesArena: 'home-heroes-passions-arena',
      parentingSupport: 'home-parenting-support-center',
      valuesTrack: 'home-values-track-card',
      dailyEssentials: 'home-daily-essentials-hub',
      learningTrack: 'home-learning-track-card',
      sportsTrack: 'home-essential-sports-card',
    };
    const accordionKey = key === 'sportsTrack' ? 'dailyEssentials' : key;
    setOpenAccordions((previous) => ({ ...previous, [accordionKey]: true }));
    window.setTimeout(() => {
      document.getElementById(sectionIds[key])?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  };

  const openChildMoodCheckin = () => {
    setOpenAccordions((previous) => ({ ...previous, parentingSupport: true }));
    window.setTimeout(() => {
      document.getElementById('child-emotional-checkin')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);
  };

  // Determine current time bucket (Morning: 5–11, Afternoon: 12–16, Evening: 17–4)
  const currentTimeBucket = useMemo<'morning' | 'afternoon' | 'evening'>(() => {
    const hr = new Date().getHours();
    if (hr >= 5 && hr < 12) return 'morning';
    if (hr >= 12 && hr < 17) return 'afternoon';
    return 'evening';
  }, []);

  const [wisdomTimeOverride, setWisdomTimeOverride] = useState<
    'auto' | 'morning' | 'afternoon' | 'evening'
  >('auto');
  const effectiveTimeBucket =
    wisdomTimeOverride === 'auto' ? currentTimeBucket : wisdomTimeOverride;

  // ============================================================================
  // Time-aware daily tip read-aloud using the device speech engine; never autoplay.
  // ============================================================================
  const defaultTipIdx = useMemo(() => {
    const idx = DAILY_READ_ALOUD_TIPS.findIndex((b) => b.timeBucket === currentTimeBucket);
    return idx >= 0 ? idx : 0;
  }, [currentTimeBucket]);

  const [activeTipIdx, setActiveBriefIdx] = useState<number>(defaultTipIdx);
  const [isReadingTip, setIsPlayingBrief] = useState<boolean>(false);

  const currentTip = DAILY_READ_ALOUD_TIPS[activeTipIdx] || DAILY_READ_ALOUD_TIPS[0];

  // Read the daily tip aloud with the device's speech engine; never autoplay audio.
  const readDailyTipAloud = (brief: DailyReadAloudTip = currentTip): boolean => {
    if (!('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') {
      setIsPlayingBrief(false);
      onShowToast?.(isEn ? 'Audio reading is not available on this device.' : 'خاصية القراءة الصوتية مش متاحة على الجهاز ده.');
      return false;
    }
    window.speechSynthesis.cancel();
    const spokenText = [isEn ? brief.titleEn : brief.titleAr, isEn ? brief.summaryEn : brief.summaryAr, isEn ? brief.takeawayEn : brief.takeawayAr].join('. ');
    const utterance = new SpeechSynthesisUtterance(spokenText);
    utterance.lang = isEn ? 'en-US' : 'ar-EG';
    utterance.rate = 0.95;
    utterance.onstart = () => setIsPlayingBrief(true);
    utterance.onend = () => {
      setIsPlayingBrief(false);
    };
    utterance.onerror = () => setIsPlayingBrief(false);
    setIsPlayingBrief(true);
    window.speechSynthesis.speak(utterance);
    return true;
  };

  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  const handleReplayDailyTip = () => {
    if (readDailyTipAloud(currentTip)) {
      onShowToast?.(isEn ? '🔊 Playing the daily tip aloud' : '🔊 جاري قراءة نصيحة اليوم بصوت مسموع');
    }
  };

  // ============================================================================
  // CHECKLIST #12: Horizontal Image Gallery Scroll Controls
  // ============================================================================
  const galleryScrollRef = useRef<HTMLDivElement | null>(null);
  const handleScrollGallery = (dir: 'prev' | 'next') => {
    if (!galleryScrollRef.current) return;
    const delta = dir === 'next' ? 300 : -300;
    galleryScrollRef.current.scrollBy({ left: isEn ? delta : -delta, behavior: 'smooth' });
  };

  // Child interests and activities are grounded in each child's own profile.
  const [cheeredHeroIds, setCheeredHeroIds] = useState<Record<string, number>>({});

  // Streamlined One-Handed Quick Log State per Child (Checklist #2)
  const [quickPulseByKid, setQuickPulseByKid] = useState<
    Record<
      number,
      {
        sleepLogged: boolean;
        mealLogged: boolean;
        moodEmoji: string;
        careLogged: boolean;
      }
    >
  >({});
  const [savingDashboardActions, setSavingDashboardActions] = useState<Record<string, boolean>>({});
  const savingDashboardActionKeysRef = useRef(new Set<string>());

  // Daily Essentials Interactive State
  const [selectedMealSlot, setSelectedMealSlot] = useState<'breakfast' | 'lunchbox' | 'snack'>('lunchbox');
  const [waterCupsByKid, setWaterCupsByKid] = useState<Record<number, number>>({});
  const [selectedSportSlot, setSelectedSportSlot] = useState<'outdoor' | 'balance' | 'cardio'>('outdoor');
  const [completedSportByKid, setCompletedSportByKid] = useState<Record<number, boolean>>({});
  const [showPromoShowcase, setShowPromoShowcase] = useState<boolean>(false);

  const activeCity = state.city || getDefaultCityForCountry(state.country);
  const localizedCity = locText(activeCity, lang);

  // Active child for Quick Tracking & Daily Essentials
  const activeKid = state.kids[selectedKidIdx] || state.kids[0];
  const activeKidId = activeKid?.id ?? -1;
  const activeKidAge = activeKid ? calculateChildAge(activeKid.birth, lang) : null;
  const activeKidName = activeKid ? locText(activeKid.name, lang) : isEn ? 'your child' : 'طفلك';

  // Hydrate the dashboard's one-tap indicators from today's real family records.
  useEffect(() => {
    const savedChildren = state.kids.filter((kid) => typeof kid.remoteId === 'string' && kid.remoteId);
    if (!state.verifiedFamilyId || savedChildren.length === 0) {
      setQuickPulseByKid({});
      return;
    }
    let active = true;
    void fetchDailyChildLifeRecords(savedChildren.map((kid) => String(kid.remoteId))).then(({ records }) => {
      if (!active) return;
      const remoteToLocal = new Map(savedChildren.map((kid) => [String(kid.remoteId), kid.id]));
      const next: typeof quickPulseByKid = {};
      const hydration: Record<number, number> = {};
      const sports: Record<number, boolean> = {};
      for (const record of records) {
        const localId = remoteToLocal.get(record.child_id);
        if (localId === undefined) continue;
        const current = next[localId] || { sleepLogged: false, mealLogged: false, moodEmoji: '😊', careLogged: false };
        if (record.record_type === 'sleep_log') current.sleepLogged = true;
        if (record.record_type === 'nutrition' && record.details?.dashboardKind === 'hydration') {
          hydration[localId] = Math.max(0, (hydration[localId] || 0) + Number(record.details.cups || 0));
        }
        if (record.record_type === 'nutrition' && record.details?.dashboardKind !== 'hydration') current.mealLogged = true;
        if (record.record_type === 'sports') sports[localId] = true;
        if (record.record_type === 'emotional_social' && typeof record.details?.moodEmoji === 'string') {
          current.moodEmoji = record.details.moodEmoji;
        }
        if (record.record_type === 'other' && record.details?.dashboardKind === 'care') current.careLogged = true;
        next[localId] = current;
      }
      setQuickPulseByKid(next);
      setWaterCupsByKid(hydration);
      setCompletedSportByKid(sports);
    });
    return () => { active = false; };
  }, [state.verifiedFamilyId, state.kids]);

  const saveDashboardChildLog = async (
    recordType: 'sleep_log' | 'nutrition' | 'sports' | 'emotional_social' | 'other',
    title: string,
    details: Record<string, unknown> = {}
  ): Promise<boolean> => {
    if (!activeKid || !activeKid.remoteId) {
      onShowToast?.(isEn ? 'Save this child profile to the family first, then log daily activity.' : 'احفظ ملف الطفل في حساب الأسرة أولاً، وبعدها سجّل النشاط اليومي.');
      return false;
    }
    const result = await createChildLifeRecord({
      childRemoteId: activeKid.remoteId,
      recordType,
      title,
      details: { ...details, source: 'dashboard_quick_track' },
    });
    if (result.error || !result.record) {
      onShowToast?.(isEn ? `Could not save: ${result.error || 'Unknown error'}` : `تعذر حفظ السجل: ${result.error || 'خطأ غير معروف'}`);
      return false;
    }
    return true;
  };
  const runDashboardSave = async (
    actionKey: string,
    recordType: 'sleep_log' | 'nutrition' | 'sports' | 'emotional_social' | 'other',
    title: string,
    details: Record<string, unknown>,
    onSaved: () => void
  ): Promise<boolean> => {
    if (savingDashboardActionKeysRef.current.has(actionKey)) return false;
    savingDashboardActionKeysRef.current.add(actionKey);
    setSavingDashboardActions((previous) => ({ ...previous, [actionKey]: true }));
    try {
      const saved = await saveDashboardChildLog(recordType, title, details);
      if (saved) onSaved();
      return saved;
    } finally {
      savingDashboardActionKeysRef.current.delete(actionKey);
      setSavingDashboardActions((previous) => {
        const next = { ...previous };
        delete next[actionKey];
        return next;
      });
    }
  };

  const activeKidStageLabel = activeKidAge?.label || (isEn ? 'Age not set' : 'العمر غير محدد');

  // Give each child a consistent accent without depending on names or sample IDs.
  const getChildColorClasses = (idx: number) => {
    if (idx % 3 === 1) {
      return {
        pillActive: 'bg-rose-600 text-white border-rose-600 shadow-2xs',
        pillInactive: 'border-rose-500/35 text-rose-700 dark:text-rose-300 bg-rose-50/60 dark:bg-[#142430]',
        accentText: 'text-rose-600 dark:text-rose-300',
      };
    }
    if (idx % 3 === 2) {
      return {
        pillActive: 'bg-amber-600 text-white border-amber-600 shadow-2xs',
        pillInactive: 'border-amber-500/35 text-amber-800 dark:text-amber-300 bg-amber-50/60 dark:bg-[#142430]',
        accentText: 'text-amber-700 dark:text-amber-300',
      };
    }
    return {
      pillActive: 'bg-sky-600 text-white border-sky-600 shadow-2xs',
      pillInactive: 'border-sky-500/35 text-sky-700 dark:text-sky-300 bg-sky-50/60 dark:bg-[#142430]',
      accentText: 'text-sky-600 dark:text-sky-300',
    };
  };

  // Time-of-Day Dynamic Parenting Wisdom
  const dailyCompassWisdom = useMemo(() => {
    const childLabel = activeKidName;
    if (effectiveTimeBucket === 'morning') {
      return {
        badgeAr: '☀️ بداية اليوم · تواصل قبل الانشغال',
        badgeEn: '☀️ Morning · Connect Before the Rush',
        titleAr: 'ابدأوا اليوم بسؤال بسيط وخطة واضحة',
        titleEn: 'Start with One Warm Check-in and a Clear Plan',
        bodyAr: `خدوا دقيقة مع ${childLabel}: اسألوه عن حاجة متحمس لها النهارده، وشاركوه خطوة واحدة من خطة اليوم. لو لسه صغير، خلي البداية بابتسامة وكلام هادي وتواصل مناسب لعمره.`,
        bodyEn: `Take a minute with ${childLabel}: ask what they are looking forward to and share one simple part of the day’s plan. For younger children, start with a warm smile and calm interaction.`,
        quoteAr: '«مش مطلوب يوم مثالي؛ المهم بداية فيها اهتمام ووضوح.»',
        quoteEn: '“The goal is not a perfect day; it is a start built on attention and clarity.”',
        actionLabelAr: 'إضافة لحظة تواصل للروتين',
        actionLabelEn: 'Add a Connection Moment',
        actionTaskAr: `خمس دقائق تواصل هادي مع ${childLabel} قبل بداية اليوم`,
        actionTaskEn: `Five calm minutes of connection with ${childLabel}`,
        actionTime: '07:30 ص',
      };
    }
    if (effectiveTimeBucket === 'afternoon') {
      return {
        badgeAr: '🌤️ وقت الرجوع · اسمع قبل ما توجّه',
        badgeEn: '🌤️ Afternoon · Listen Before You Guide',
        titleAr: 'ادي طفلك فرصة يفصل ويحكي عن يومه',
        titleEn: 'Give Your Child Space to Unwind and Share',
        bodyAr: `بعد الرجوع، ابدأوا بوقت هادي ومياه أو وجبة مناسبة، وبعدها اسألوا ${childLabel} عن حاجة حلوة وحاجة كانت صعبة في يومه. سيبوا له مساحة يرد على قد سنه ومزاجه.`,
        bodyEn: `After the day, allow some quiet time and offer water or an age-appropriate snack. Then ask ${childLabel} about one good moment and one difficult moment, without rushing the answer.`,
        quoteAr: '«الاستماع الهادي أحياناً أهم من النصيحة السريعة.»',
        quoteEn: '“A calm listener can matter more than a quick solution.”',
        actionLabelAr: 'جدولة وقت حكي وونس',
        actionLabelEn: 'Schedule a Check-in',
        actionTaskAr: `١٠ دقائق حكي وونس مع ${childLabel} من غير شاشات`,
        actionTaskEn: `10 screen-free minutes to reconnect with ${childLabel}`,
        actionTime: '03:30 م',
      };
    }
    return {
      badgeAr: '🌙 نهاية اليوم · هدوء واستعداد للنوم',
      badgeEn: '🌙 Evening · Slow Down Together',
      titleAr: 'اختتموا اليوم بروتين بسيط ومتكرر',
      titleEn: 'Close the Day with a Simple, Familiar Routine',
      bodyAr: `اختاروا مع ${childLabel} نشاطاً هادئاً يناسب عمره: قصة قصيرة، ترتيب لعبة، أو حديث عن أحلى لحظة في اليوم. خفّفوا الإضاءة وخلّوا الترتيب مرناً حسب احتياج الطفل.`,
      bodyEn: `Choose a calm, age-appropriate activity with ${childLabel}: a short story, putting a toy away, or sharing a favorite moment from the day. Soften the lights and keep the routine flexible.`,
      quoteAr: '«الروتين المألوف يسهّل الانتقال للراحة، من غير ما يتحول لضغط.»',
      quoteEn: '“A familiar routine can make winding down easier without turning it into pressure.”',
      actionLabelAr: 'إضافة طقس هدوء للمساء',
      actionLabelEn: 'Add an Evening Wind-down',
      actionTaskAr: `وقت هادي وقصة قصيرة مع ${childLabel} قبل النوم`,
      actionTaskEn: `A calm moment and short story with ${childLabel} before bed`,
      actionTime: '08:00 م',
    };
  }, [effectiveTimeBucket, activeKidName]);

  // Child interests are sourced only from each saved profile; never infer a child's hobbies from their position or ID.
  const heroesPassionsFeed = useMemo(
    () =>
      state.kids.map((kid, index) => {
        const profileInterests = [
          ...(kid.profileDetails?.interests || []),
          ...(kid.profileDetails?.hobbies || []),
          ...(kid.profileDetails?.sports || []),
          ...(kid.interests ? [kid.interests] : []),
        ]
          .map((item) => sanitizeUserText(item, 70))
          .filter(Boolean);
        const uniqueInterests = Array.from(new Set(profileInterests)).slice(0, 4);
        const childName = locText(kid.name, lang);
        const hasInterests = uniqueInterests.length > 0;
        const tones = [
          { border: 'border-sky-500/45', bg: 'bg-sky-500/12 text-sky-700 dark:text-sky-300', progress: 'from-sky-500 to-teal-500' },
          { border: 'border-rose-500/45', bg: 'bg-rose-500/12 text-rose-700 dark:text-rose-300', progress: 'from-rose-500 to-pink-500' },
          { border: 'border-amber-500/45', bg: 'bg-amber-500/12 text-amber-800 dark:text-amber-300', progress: 'from-amber-500 to-teal-600' },
        ];
        const tone = tones[index % tones.length];
        return {
          id: `child-profile-${kid.id}`,
          kidId: kid.id,
          nameAr: `${locText(kid.name, 'ar')} · ${calculateChildAge(kid.birth, 'ar').label}`,
          nameEn: `${locText(kid.name, 'en')} · ${calculateChildAge(kid.birth, 'en').label}`,
          arenaBadgeAr: hasInterests ? '🌱 اهتمامات مسجلة' : '🌱 اكتشاف الاهتمامات',
          arenaBadgeEn: hasInterests ? '🌱 Saved interests' : '🌱 Discover interests',
          accentBorder: tone.border,
          accentBg: tone.bg,
          progressBarClass: tone.progress,
          titleAr: hasInterests ? `مساحة اهتمامات ${childName}` : `اكتشفوا مع ${childName} الحاجات اللي بيحبها`,
          titleEn: hasInterests ? `${childName}’s Interests` : `Discover what ${childName} enjoys`,
          passionTagsAr: uniqueInterests,
          passionTagsEn: uniqueInterests,
          nextGoalAr: hasInterests
            ? 'الاهتمامات دي مأخوذة من ملف الطفل. حدّثوها كلما اكتشفتوا حاجة جديدة.'
            : 'لسه مفيش اهتمامات مسجلة. أضيفوا الهوايات والرياضات والحاجات اللي بتلفت انتباهه.',
          nextGoalEn: hasInterests
            ? 'These interests come from the child profile. Update them as you discover new favorites.'
            : 'No interests have been added yet. Record hobbies, sports, and things that catch their attention.',
          routineTaskAr: hasInterests
            ? `وقت مشترك لاكتشاف أو ممارسة ${uniqueInterests[0]} مع ${childName}`
            : `١٠ دقائق لعب وملاحظة الحاجات اللي بتجذب ${childName}`,
          routineTaskEn: hasInterests
            ? `Spend time exploring ${uniqueInterests[0]} with ${childName}`
            : `Spend 10 minutes playing and noticing what interests ${childName}`,
          routineTime: '05:00 م',
        };
      }),
    [state.kids, lang]
  );

  // Meal ideas are prompts for family planning, not prescribed diets or calorie targets.
  const nutritionPlans = useMemo(() => {
    const hasKnownAge = Boolean(activeKid?.birth);
    const ageMonths = activeKidAge?.months ?? 0;
    const isUnderSixMonths = hasKnownAge && ageMonths < 6;
    const isUnderTwoYears = hasKnownAge && ageMonths < 24;

    if (isUnderTwoYears) {
      const milkGuidance = isUnderSixMonths;
      const base = milkGuidance
        ? {
            titleAr: `الرضاعة حسب احتياج ${activeKidName}`,
            titleEn: `Feeding ${activeKidName} responsively`,
            descAr: 'في هذه المرحلة تكون الرضاعة الطبيعية أو الصناعية هي مصدر التغذية الأساسي. لا تبدأوا الأطعمة أو الماء أو المكملات دون إرشاد طبي مناسب.',
            descEn: 'At this stage, breast milk or infant formula is the primary source of nutrition. Do not introduce solids, water or supplements without appropriate professional guidance.',
          }
        : {
            titleAr: `وجبة تكميلية مناسبة لمرحلة ${activeKidName}`,
            titleEn: `An age-appropriate complementary meal for ${activeKidName}`,
            descAr: 'اختاروا قوامًا مناسبًا لقدرة الطفل وعلامات استعداده، وقدموا الأطعمة الجديدة تدريجيًا مع مراعاة الحساسية وإرشادات طبيب الأطفال.',
            descEn: 'Choose textures that match the child’s readiness and abilities. Introduce foods thoughtfully and account for allergies and pediatric guidance.',
          };
      return {
        breakfast: { badgeAr: '🍼 متابعة التغذية', badgeEn: '🍼 Feeding routine', ...base, time: '08:00 ص' },
        lunchbox: { badgeAr: '🥣 وجبة مناسبة للعمر', badgeEn: '🥣 Age-aware meal', ...base, time: '12:30 م' },
        snack: { badgeAr: '🍎 متابعة الرضاعة والوجبات', badgeEn: '🍎 Feeding check-in', ...base, time: '04:30 م' },
      };
    }

    if (!hasKnownAge) {
      const general = {
        titleAr: 'سجلوا الوجبة التي تناسب طفلكم',
        titleEn: 'Record a meal that suits your child',
        descAr: 'أضيفوا تاريخ الميلاد والحساسيات أو القيود الغذائية لتظهر اقتراحات أكثر ملاءمة. راعوا دائمًا تفضيلات الطفل وإرشادات المختص.',
        descEn: 'Add the birth date and any allergies or dietary restrictions to improve relevance. Always consider the child’s preferences and professional guidance.',
      };
      return {
        breakfast: { badgeAr: '🥣 فطور الأسرة', badgeEn: '🥣 Family breakfast', ...general, time: '08:00 ص' },
        lunchbox: { badgeAr: '🍱 وجبة اليوم', badgeEn: '🍱 Today’s meal', ...general, time: '12:30 م' },
        snack: { badgeAr: '🍎 وجبة خفيفة', badgeEn: '🍎 Snack', ...general, time: '04:30 م' },
      };
    }

    if (activeKidAge?.stageCode === '5-8') {
      return {
        breakfast: {
          badgeAr: '🥣 فكرة فطور متوازن',
          badgeEn: '🥣 Balanced breakfast idea',
          titleAr: `بيض بالخضار وخبز حبوب كاملة لـ ${activeKidName}`,
          titleEn: `Vegetable eggs and whole-grain toast for ${activeKidName}`,
          descAr: 'فكرة قابلة للتعديل حسب شهية الطفل والحساسية المسجلة وما يتناوله عادة.',
          descEn: 'An adaptable idea based on appetite, recorded allergies and the child’s usual diet.',
          time: '06:45 ص',
        },
        lunchbox: {
          badgeAr: '🍱 وجبة مدرسية',
          badgeEn: '🍱 School meal idea',
          titleAr: `وجبة متنوعة يشارك ${activeKidName} في اختيارها`,
          titleEn: `A varied lunch chosen together with ${activeKidName}`,
          descAr: 'وازنوا بين المكونات المناسبة، وراعوا أي حساسية أو قيود غذائية مسجلة.',
          descEn: 'Balance suitable food groups and account for any recorded allergies or dietary restrictions.',
          time: '11:30 ص',
        },
        snack: {
          badgeAr: '🍌 وجبة خفيفة',
          badgeEn: '🍌 Snack idea',
          titleAr: `وجبة خفيفة مفضلة لدى ${activeKidName}`,
          titleEn: `A snack ${activeKidName} enjoys`,
          descAr: 'استخدموا الأطعمة المفضلة المسجلة في ملف الطفل إذا كانت مناسبة ولا تتعارض مع أي قيود.',
          descEn: 'Use foods recorded as favorites when they are suitable and do not conflict with dietary restrictions.',
          time: '04:00 م',
        },
      };
    }

    const preschool = activeKidAge?.stageCode === '2-5';
    const generalTitleAr = preschool ? 'وجبة بسيطة يشارك الطفل في تجهيزها' : 'وجبة متنوعة تناسب روتين الطفل';
    const generalTitleEn = preschool ? 'A simple meal the child can help prepare' : 'A varied meal for the child’s routine';
    const generalDescAr = 'اختاروا مكونات مألوفة ومناسبة، وشجعوا الطفل على المشاركة دون ضغط أو إجبار على إنهاء الطبق.';
    const generalDescEn = 'Choose familiar, suitable ingredients and invite the child to participate without pressure to finish the plate.';
    return {
      breakfast: { badgeAr: '🥣 فكرة فطور', badgeEn: '🥣 Breakfast idea', titleAr: generalTitleAr, titleEn: generalTitleEn, descAr: generalDescAr, descEn: generalDescEn, time: '07:45 ص' },
      lunchbox: { badgeAr: '🍱 وجبة اليوم', badgeEn: '🍱 Meal idea', titleAr: generalTitleAr, titleEn: generalTitleEn, descAr: generalDescAr, descEn: generalDescEn, time: '11:30 ص' },
      snack: { badgeAr: '🍎 وجبة خفيفة', badgeEn: '🍎 Snack idea', titleAr: generalTitleAr, titleEn: generalTitleEn, descAr: generalDescAr, descEn: generalDescEn, time: '03:45 م' },
    };
  }, [activeKid?.birth, activeKidAge?.months, activeKidAge?.stageCode, activeKidName]);

  const currentNutrition = nutritionPlans[selectedMealSlot];

  const currentWaterCups = waterCupsByKid[activeKidId] ?? 0;

  const handleAdjustWater = async (delta: number) => {
    const current = waterCupsByKid[activeKidId] ?? 0;
    const next = Math.max(0, Math.min(10, current + delta));
    if (next === current || !activeKid) return;
    await runDashboardSave(
      `${activeKidId}:hydration`,
      'nutrition',
      delta > 0 ? 'تسجيل شرب الماء' : 'تصحيح تسجيل شرب الماء',
      { dashboardKind: 'hydration', cups: delta },
      () => setWaterCupsByKid((prev) => ({ ...prev, [activeKidId]: next }))
    );
  };

  const sportActivities = useMemo(() => {
    const stageCode = activeKid?.birth ? activeKidAge?.stageCode : 'unknown';
    if (stageCode === 'unknown') {
      const generalActivity = {
        badgeAr: '🌿 نشاط عائلي بسيط',
        badgeEn: '🌿 Simple family activity',
        titleAr: `اختاروا حركة أو لعبة يحبها ${activeKidName}`,
        titleEn: `Choose a movement game ${activeKidName} enjoys`,
        descAr: 'أضيفوا تاريخ الميلاد لتظهر أنشطة مناسبة للعمر. اختاروا الآن نشاطًا آمنًا وتحت إشرافكم.',
        descEn: 'Add the birth date for age-aware suggestions. For now, choose a safe activity with adult supervision.',
        time: '05:00 م',
      };
      return { outdoor: generalActivity, balance: generalActivity, cardio: generalActivity };
    }
    if (stageCode === '0-2') {
      const isUnderSixMonths = (activeKidAge?.months ?? 0) < 6;
      return {
        outdoor: isUnderSixMonths
          ? {
              badgeAr: '👶🏻 وقت البطن تحت إشرافك',
              badgeEn: '👶🏻 Supervised tummy time',
              titleAr: `فترات قصيرة من وقت البطن أثناء اليقظة لـ ${activeKidName}`,
              titleEn: `Short, supervised tummy-time sessions for ${activeKidName}`,
              descAr: 'يكون الطفل مستيقظًا وتحت مراقبة مباشرة على سطح ثابت وآمن. أوقفوا النشاط عند الانزعاج، ولا يُستخدم وقت البطن للنوم.',
              descEn: 'Only while awake, on a firm safe surface with direct supervision. Stop if uncomfortable; tummy time is not for sleep.',
              time: '01:30 م',
            }
          : {
              badgeAr: '🧸 حركة ولعب أرضي آمن',
              badgeEn: '🧸 Safe floor play',
              titleAr: `لعب أرضي وتتبع لعبة وحركة حسب قدرة ${activeKidName}`,
              titleEn: `Floor play, toy tracking and movement at ${activeKidName}’s pace`,
              descAr: 'وفروا مساحة آمنة للحركة والاستكشاف، واسمحوا للطفل يكرر المحاولة دون استعجال.',
              descEn: 'Offer a safe space to explore and move, allowing the child to repeat attempts without rushing.',
              time: '01:30 م',
            },
        balance: {
          badgeAr: '🧸 تتبع بصري ومهارات القبض باليد',
          badgeEn: '🧸 Visual Tracking & Grasp Play',
          titleAr: `١٠ دقائق لعب بالخشخيشة الخشبية والركل بالقدمين مع ${activeKidName}`,
          titleEn: `10-Min Wooden Rattle Grasp & Leg Kick Play with ${activeKidName}`,
          descAr: 'ينمّي التآزر البصري الحركي واستكشاف الأصوات والملمس الطبيعي.',
          descEn: 'Develops hand-eye coordination, sensory curiosity, and joyful babbling.',
          time: '04:00 م',
        },
        cardio: {
          badgeAr: '🌙 تدليك مسائي وتمارين إطالة الرضيع',
          badgeEn: '🌙 Soothing Infant Massage & Stretch',
          titleAr: `١٠ دقائق تدليك دافئ وحركة الدراجة اللطيفة للساقين لـ ${activeKidName}`,
          titleEn: `10-Min Warm Oil Massage & Gentle Bicycle Legs for ${activeKidName}`,
          descAr: 'نشاط لطيف اختياري؛ أوقفوه إذا ظهر انزعاج، ولا يُستخدم لعلاج المغص أو اضطرابات النوم.',
          descEn: 'A calm, optional interaction. Stop if the child shows discomfort; it is not a treatment for colic or sleep problems.',
          time: '07:15 م',
        },
      };
    }

    if (stageCode === '5-8') {
      return {
        outdoor: {
          badgeAr: '🏊‍♂️ رياضة واستقلالية حركية',
          badgeEn: '🏊‍♂️ Swimming & Athletic Agility',
          titleAr: `٤٠ دقيقة تمرين سباحة أو كرة قدم وتفريغ طاقة بدون شاشات لـ ${activeKidName}`,
          titleEn: `40-Min Screen-Free Swimming or Football Practice for ${activeKidName}`,
          descAr: 'يعزز اللياقة البدنية، الثقة بالنفس، والالتزام بجدول توازن اللعب والمذاكرة.',
          descEn: 'Builds stamina, teamwork discipline, and healthy screen-time balance.',
          time: '05:00 م',
        },
        balance: {
          badgeAr: '♟️ تحدي التركيز والتوازن البدني',
          badgeEn: '♟️ Core Balance & Logic Circuit',
          titleAr: `٢٠ دقيقة تمارين توازن وإطالة + جولة تفكير منطقي مع ${activeKidName}`,
          titleEn: `20-Min Core Stretching + Logic Challenge with ${activeKidName}`,
          descAr: 'يجمع بين تنشيط الجسم بعد الجلوس للمذاكرة وتقوية مهارات التخطيط.',
          descEn: 'Refreshes posture after homework while sharpening strategic thinking.',
          time: '06:15 م',
        },
        cardio: {
          badgeAr: '🚴‍♂️ سباق اللياقة العائلي السريع',
          badgeEn: '🚴‍♂️ Family Fitness & Bike Sprint',
          titleAr: `٢٥ دقيقة حركة بالدراجة أو القفز بالحبل مع أحد الوالدين لـ ${activeKidName}`,
          titleEn: `25-Min Bike Ride or Jump-Rope Challenge with a Parent for ${activeKidName}`,
          descAr: 'نشاط عائلي ممتع يدعم المشاركة والحركة، مع مراعاة قدرة الطفل وإشراف شخص بالغ.',
          descEn: 'A shared activity that encourages connection and movement; it does not guarantee a sleep outcome.',
          time: '05:30 م',
        },
      };
    }

    return {
      outdoor: {
        badgeAr: '🎨 لعب حركي وإبداعي للحضانة',
        badgeEn: '🎨 Active Creative Play',
        titleAr: `٢٠ دقيقة مسار توازن الألوان والقفز المرح في البيت مع ${activeKidName}`,
        titleEn: `20-Min Color Hopscotch & Creative Movement with ${activeKidName}`,
        descAr: 'ادمجوا الحركة مع تسمية الألوان أو المشاعر إذا كان الطفل مهتمًا بذلك.',
        descEn: 'Combines gross motor hopping with color and emotion naming after nursery.',
        time: '04:30 م',
      },
      balance: {
        badgeAr: '🧘‍♀️ يوجا الأطفال وتهدئة المشاعر',
        badgeEn: '🧘‍♀️ Kids Yoga & Emotion Breathing',
        titleAr: `١٥ دقيقة تمارين تنفس الفراشة وتوازن الشجرة مع بطاقات المشاعر لـ ${activeKidName}`,
        titleEn: `15-Min Butterfly Breathing & Tree Pose with Emotion Cards for ${activeKidName}`,
        descAr: 'جرّبوا التنفس الهادئ والتعبير عن المشاعر دون مطالبة الطفل بإيقاف البكاء أو كبت إحساسه.',
        descEn: 'Teaches self-regulation and calm emotional expression without tantrums.',
        time: '05:15 م',
      },
      cardio: {
        badgeAr: '💃 رقص وحركة إيقاعية مبهجة',
        badgeEn: '💃 Musical Freeze Dance & Agility',
        titleAr: `١٥ دقيقة لعبة الحركة والتوقف الموسيقية مع أحد الوالدين لـ ${activeKidName}`,
        titleEn: `15-Min Musical Freeze Dance with a Parent for ${activeKidName}`,
        descAr: 'تقوّي التحكم في الاندفاع والانتباه السمعي وتملأ البيت بالضحك.',
        descEn: 'A playful way to practice listening and shared enjoyment without expecting a specific behavioral outcome.',
        time: '06:00 م',
      },
    };
  }, [activeKidAge?.stageCode, activeKidName]);

  const currentSport = sportActivities[selectedSportSlot];
  const isSportDoneToday = Boolean(completedSportByKid[activeKidId]);
  const sportActionKey = `${activeKidId}:sports`;
  const isSportSaving = Boolean(savingDashboardActions[sportActionKey]);

  // Personalized Active Parent Profile Details from live `state.parentAccounts` (fetched from Supabase `users` table)
  const isMotherActive =
    state.activeParentAccount === 'mother' ||
    state.role === 'mom' ||
    parentProfileSpec.role === 'mom';

  const fatherShortAr = (state.parentAccounts.father?.fullName || '').replace(/\s*\(.*?\)\s*/g, '').trim();
  const motherShortAr = (state.parentAccounts.mother?.fullName || '').replace(/\s*\(.*?\)\s*/g, '').trim();

  const activeParentNameAr = isMotherActive ? motherShortAr : fatherShortAr;
  const activeParentDisplayNameAr = activeParentNameAr || (isMotherActive ? 'ماما' : 'ولي الأمر');
  const activeParentNameEn = activeParentNameAr ? locText(activeParentNameAr, 'en') : isMotherActive ? 'Mother' : 'Parent';
  const partnerParentNameAr = isMotherActive ? fatherShortAr : motherShortAr;
  const partnerParentNameEn = partnerParentNameAr ? locText(partnerParentNameAr, 'en') : '';
  const parentWellbeingMessage = useMemo(() => {
    if (effectiveTimeBucket === 'morning') {
      return {
        titleAr: 'ابدأ يومك برفق مع نفسك',
        titleEn: 'Begin the day gently with yourself',
        bodyAr: 'مش مطلوب منك تبدأ اليوم بكل الإجابات. اختار أولوية واحدة، واطلب المساعدة لو محتاج. رعايتك لنفسك جزء من رعاية الأسرة.',
        bodyEn: 'You do not need every answer to begin the day. Choose one priority and ask for help when you need it. Caring for yourself is part of caring for your family.',
      };
    }
    if (effectiveTimeBucket === 'afternoon') {
      return {
        titleAr: 'خد مساحة صغيرة لنفسك',
        titleEn: 'Make a little space for yourself',
        bodyAr: 'لو تقدر، خُد استراحة قصيرة وشارك اللي شاغلك مع شخص تثق فيه. مش لازم تشيل كل المسؤوليات وحدك.',
        bodyEn: 'If you can, take a short break and share what is on your mind with someone you trust. You do not have to carry every responsibility alone.',
      };
    }
    return {
      titleAr: 'اليوم الصعب مش معناه إنك قصّرت',
      titleEn: 'A difficult day does not mean you failed',
      bodyAr: 'افتكر لحظة واحدة كنت فيها حاضرًا مع أسرتك، حتى لو كانت بسيطة. اسمح لنفسك ترتاح؛ مفيش يوم لازم يكون مثالي.',
      bodyEn: 'Remember one small moment when you were present for your family. Allow yourself to rest; no day has to be perfect.',
    };
  }, [effectiveTimeBucket]);


  return (
    <section
      dir={isEn ? 'ltr' : 'rtl'}
      className="space-y-4 sm:space-y-5"
      aria-label={isEn ? 'Nekbaar Family Home Dashboard' : 'لوحة العائلة الرئيسية — نكبر'}
    >
      {/* =====================================================================
          1. ACCORDION: PERSONALIZED WELCOME & DAILY TIP READ-ALOUD CARD
          ===================================================================== */}
      <div
        id="home-core-value-hero"
        data-testid="home-core-value-hero"
        data-parent-profile={parentProfileSpec.role}
        dir={isEn ? 'ltr' : 'rtl'}
        style={{
          borderColor: isMotherActive ? 'rgba(225, 29, 72, 0.35)' : 'rgba(13, 148, 136, 0.38)',
        }}
        className="bg-white dark:bg-[#101D26] shadow-sm rounded-2xl p-4 border border-gray-100 dark:border-[#1E3646] flex flex-col justify-between gap-4 transition-all duration-300 ease-in-out"
      >
        {/* Top Accordion Header for Personalized Welcome Banner */}
        <div
          id="home-personalized-welcome-banner"
          data-testid="home-personalized-welcome-banner"
          className="space-y-2.5"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-extrabold">
            <div className="inline-flex flex-wrap items-center gap-2 text-[var(--color-text)] dark:text-[#F8FAFC]">
              <span
                className={`px-2.5 py-1 rounded-full text-[11px] font-black border ${
                  isMotherActive
                    ? 'bg-rose-500/12 text-rose-700 dark:text-rose-300 border-rose-500/30'
                    : 'bg-teal-500/12 text-[#0d9488] dark:text-[#2DD4BF] border-teal-500/30'
                }`}
              >
                {isMotherActive
                  ? isEn
                    ? `👩🏻‍🍼 Active Profile: Mom${motherShortAr ? ` ${activeParentNameEn}` : ''}`
                    : `👩🏻‍🍼 الحساب النشط: الأم${motherShortAr ? ` · ${activeParentNameAr}` : ''}`
                  : isEn
                  ? `👨🏻‍🍼 Active Profile: Parent${fatherShortAr ? ` ${activeParentNameEn}` : ''}`
                  : `👨🏻‍🍼 الحساب النشط: ولي الأمر${fatherShortAr ? ` · ${activeParentNameAr}` : ''}`}
              </span>
              <span className="text-[#0d9488] dark:text-[#2DD4BF]">📍 {localizedCity}</span>
              {partnerParentNameAr && (
                <span className="text-xs text-gray-500 dark:text-[#94A3B8]">
                  · {isEn ? `Family link: ${partnerParentNameEn}` : `مرتبط بحساب الأسرة: ${partnerParentNameAr}`}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-[#94A3B8]">
                {todayFormattedCombined}
              </span>
              <button
                type="button"
                data-testid="welcome-hero-accordion-arrow"
                aria-expanded={openAccordions.welcomeAudio}
                onClick={() => toggleAccordion('welcomeAudio')}
                title={isEn ? 'Toggle Daily Tip Card' : 'طي / فتح بطاقة نصيحة اليوم'}
                className={`min-w-[48px] min-h-[48px] rounded-xl border border-gray-100 dark:border-[#1E3646] bg-slate-50 dark:bg-[#142430] text-[var(--color-text)] dark:text-[#F8FAFC] flex items-center justify-center text-xs font-black active:scale-95 transition-all duration-300 ease-in-out cursor-pointer ${
                  openAccordions.welcomeAudio ? 'rotate-180 bg-teal-500/15 border-[#0d9488]/40 text-[#0d9488] dark:text-[#2DD4BF]' : ''
                }`}
              >
                ▼
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <h1
              id="home-main-greeting-heading"
              className="text-xl font-bold text-[var(--color-text)] dark:text-[#F8FAFC] leading-snug"
            >
              {isEn
                ? `Welcome back, ${activeParentNameEn} 👋 Let's make today's family routine easier.`
                : `أهلاً يا ${activeParentDisplayNameAr} 👋 خلّينا نرتّب يومكم ونركز على اللي يهم طفلك.`}
            </h1>
            <p className="text-sm leading-relaxed text-gray-600 dark:text-[#CBD5E1]">
              {isMotherActive
                ? isEn
                  ? `See today's tasks, upcoming appointments, useful age-based tips, and family updates in one place.`
                  : `هتلاقي هنا مهام اليوم، والمواعيد الجاية، ونصايح مناسبة لسن طفلك، وتحديثات الأسرة في مكان واحد.`
                : isEn
                ? `See today's tasks, upcoming appointments, useful age-based tips, and family updates in one place.`
                : `ابدأ من احتياجك دلوقتي: تابع يوم طفلك، رتّب المواعيد، أو افتح السجل الصحي والتسوق من مكان واحد.`}
            </p>
          </div>
        </div>

        <div data-testid="home-parent-wellbeing-card" className="rounded-2xl border border-rose-200/80 dark:border-rose-900/40 bg-gradient-to-br from-rose-50/90 via-white to-teal-50/70 dark:from-[#211B25] dark:via-[#101D26] dark:to-[#142430] p-3.5 sm:p-4 flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-200 text-xl">💚</span>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-black text-[var(--color-text)] dark:text-white">{isEn ? 'A moment for you, too' : 'رسالة ليك كمان يا أب أو أم'}</h2>
              <span className="rounded-full bg-rose-100/80 dark:bg-rose-500/15 px-2 py-0.5 text-[9px] font-extrabold text-rose-700 dark:text-rose-200">{isEn ? 'Parent wellbeing' : 'دعم نفسي للوالدين'}</span>
            </div>
            <h3 className="text-xs font-extrabold text-[var(--color-text)] dark:text-white">{isEn ? parentWellbeingMessage.titleEn : parentWellbeingMessage.titleAr}</h3>
            <p className="text-xs leading-relaxed font-semibold text-[var(--color-muted)] dark:text-[#CBD5E1]">{isEn ? parentWellbeingMessage.bodyEn : parentWellbeingMessage.bodyAr}</p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1">
              <button type="button" onClick={() => openHomeSection('parentingSupport')} className="min-h-[44px] px-1 text-xs font-black text-rose-700 dark:text-rose-200 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 rounded-lg">
                {isEn ? 'Open wellbeing & parenting center →' : 'افتح مركز الدعم النفسي والتربوي ←'}
              </button>
              <button type="button" onClick={() => navigateTo('notifications')} className="min-h-[44px] px-1 text-xs font-black text-teal-800 dark:text-teal-200 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 rounded-lg">
                {isEn ? 'Parent support messages' : 'رسائل دعم الأب والأم'}
              </button>
            </div>
          </div>
        </div>

        <HomeContentTracks
          language={lang}
          childName={activeKidName}
          onNavigate={navigateTo}
          onOpenSection={openHomeSection}
        />

        <HomeExpertContentNetwork
          language={lang}
          onNavigate={navigateTo}
          onOpenSection={openHomeSection}
        />

        {/* =====================================================================
            DAILY TIP READ-ALOUD CARD — DEVICE SPEECH, NO FAKE RECORDING METRICS
            Full-width stacked layout prevents any vertical letter-by-letter wrapping!
            ===================================================================== */}
        {openAccordions.welcomeAudio && (
          <div
            id="home-daily-tip-read-aloud"
            data-testid="home-daily-tip-read-aloud"
            dir={isEn ? 'ltr' : 'rtl'}
            className="w-full rounded-2xl sm:rounded-3xl border border-teal-500/35 dark:border-[#1E3646] bg-gradient-to-r from-teal-50/90 via-white to-orange-50/60 dark:from-[#142430] dark:via-[#101D26] dark:to-[#142430] p-4 sm:p-5 flex flex-col gap-3.5 shadow-2xs"
          >
            {/* Row 1: Play Button + Full-Width Natural Horizontal Arabic Title & Slot Badge */}
            <div className="flex items-start gap-3.5 w-full">
              <button
                type="button"
                data-testid="daily-tip-read-aloud-toggle"
                onClick={() => {
                  if (isReadingTip) {
                    window.speechSynthesis?.pause();
                    setIsPlayingBrief(false);
                  } else if (window.speechSynthesis?.paused) {
                    window.speechSynthesis.resume();
                    setIsPlayingBrief(true);
                  } else {
                    readDailyTipAloud(currentTip);
                  }
                }}
                aria-label={
                  isReadingTip
                    ? isEn
                      ? 'Pause reading'
                      : 'إيقاف القراءة الصوتية'
                    : isEn
                    ? 'Read tip aloud'
                    : 'قراءة النصيحة بصوت مسموع'
                }
                className={`w-12 h-12 rounded-2xl flex items-center justify-center text-base font-black shrink-0 transition-all cursor-pointer shadow-xs ${
                  isReadingTip
                    ? 'bg-[#FF8C61] text-white scale-105'
                    : 'bg-[#0d9488] hover:bg-[#0f766e] text-white'
                }`}
              >
                {isReadingTip ? '⏸' : '▶'}
              </button>

              <div className="flex-1 min-w-0 w-full space-y-1 text-start">
                <div className="flex flex-wrap items-center gap-2 text-xs font-extrabold text-[#0d9488] dark:text-[#2DD4BF]">
                  <span className="inline-block whitespace-normal">
                    🔊 {isEn ? currentTip.slotLabelEn : currentTip.slotLabelAr}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="text-[var(--color-muted)] dark:text-[#94A3B8] whitespace-normal">
                    {isEn ? currentTip.hostsEn : currentTip.hostsAr}
                  </span>
                </div>
                <h2 className="text-sm sm:text-base font-black text-[var(--color-text)] dark:text-[#F8FAFC] leading-relaxed whitespace-normal">
                  {isEn ? currentTip.titleEn : currentTip.titleAr}
                </h2>
              </div>
            </div>

            {/* Playback uses the device speech engine; no recorded-audio duration is implied. */}
            <div data-testid="daily-tip-read-aloud-status" className="flex items-center gap-2 rounded-xl border border-teal-500/15 bg-teal-500/5 px-3 py-2 text-[11px] font-semibold text-[var(--color-muted)] dark:text-[#CBD5E1]">
              <span aria-hidden="true">🔊</span>
              <span>{isEn ? 'Read aloud using your device voice' : 'تُقرأ النصيحة بصوت الجهاز'}</span>
            </div>

            {/* Playback controls and navigation between the three daily tips. */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 w-full">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  id="daily-tip-read-aloud-replay"
                  data-testid="daily-tip-read-aloud-replay"
                  onClick={handleReplayDailyTip}
                  className="min-h-[38px] px-3.5 py-1.5 rounded-2xl border border-[#0d9488]/40 bg-teal-500/12 hover:bg-[#0d9488] hover:text-white text-xs font-extrabold text-[#0d9488] dark:text-[#2DD4BF] transition-all cursor-pointer inline-flex items-center gap-1.5"
                >
                  <span>🔄</span>
                  <span>{isEn ? 'Read again' : 'اقرأها تاني'}</span>
                </button>

                <button
                  type="button"
                  data-testid="daily-tip-read-aloud-next"
                  onClick={() => {
                    const nextIdx = (activeTipIdx + 1) % DAILY_READ_ALOUD_TIPS.length;
                    setActiveBriefIdx(nextIdx);
                                    readDailyTipAloud(DAILY_READ_ALOUD_TIPS[nextIdx]);
                  }}
                  className="min-h-[38px] px-3.5 py-1.5 rounded-2xl border border-[var(--color-border)] dark:border-[#1E3646] bg-white/90 dark:bg-[#101D26] hover:border-[#0d9488] text-xs font-extrabold text-[var(--color-text)] dark:text-[#F8FAFC] cursor-pointer"
                >
                  {isEn ? 'Next tip ⏭' : 'النصيحة التالية ⏭'}
                </button>
              </div>
            </div>

            {/* Row 4: Full-Width Horizontal Summary & Takeaway */}
            <p className="w-full text-xs sm:text-[13px] font-semibold text-[var(--color-muted)] dark:text-[#CBD5E1] leading-relaxed text-start whitespace-normal">
              {isEn ? currentTip.summaryEn : currentTip.summaryAr}{' '}
              <strong className="text-[var(--color-text)] dark:text-[#F8FAFC]">
                {isEn ? currentTip.takeawayEn : currentTip.takeawayAr}
              </strong>
            </p>
          </div>
        )}
      </div>

      {/* Standardized Section Tools (أدوات القسم) immediately after the top welcome banner */}
      <SectionToolsDrawer
        language={lang}
        sectionId="dashboard"
        titleAr="أدوات الرئيسية"
        titleEn="Dashboard tools"
        badgeCount={state.tasks.filter((t) => !t.done).length}
        cartItemCount={cartItemCount}
        onOpenCart={() => navigateTo('services')}
        quickActions={[
          {
            id: 'routine-shortcut',
            icon: '✅',
            labelAr: 'مهام اليوم',
            labelEn: 'Daily Routine',
            badge: state.tasks.filter((t) => !t.done).length,
            onClick: () => navigateTo('routine'),
          },
          {
            id: 'calendar-shortcut',
            icon: '📅',
            labelAr: 'التقويم الأسري',
            labelEn: 'Family Calendar',
            badge: state.events.length,
            onClick: () => navigateTo('calendar'),
          },
          {
            id: 'children-shortcut',
            icon: '👶',
            labelAr: 'ملفات الأطفال',
            labelEn: 'Children Profiles',
            badge: state.kids.length,
            onClick: () => navigateTo('children'),
          },
          ...(onToggleBedtimeMode
            ? [
                {
                  id: 'toggle-bedtime',
                  icon: '🌙',
                  labelAr: bedtimeMode ? 'إيقاف وضع النوم' : 'وضع ما قبل النوم',
                  labelEn: bedtimeMode ? 'Exit Bedtime Mode' : 'Bedtime Mode',
                  active: Boolean(bedtimeMode),
                  onClick: onToggleBedtimeMode,
                },
              ]
            : []),
        ]}
      >
        <div className="space-y-3">
          {state.kids.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-xs font-extrabold text-[var(--color-text)] dark:text-[#F8FAFC]">
                {isEn ? 'Active Child Focus' : 'تخصيص العرض حسب الطفل'}
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {state.kids.map((kid, idx) => (
                  <button
                    key={kid.id}
                    type="button"
                    onClick={() => setSelectedKidIdx(idx)}
                    className={`min-h-[36px] px-3 py-1.5 rounded-xl border text-xs font-extrabold transition-colors cursor-pointer ${
                      selectedKidIdx === idx
                        ? 'border-[#0d9488] bg-[#0d9488] text-white'
                        : 'border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-bg)] dark:bg-[#142430] text-[var(--color-text)] dark:text-[#F8FAFC]'
                    }`}
                  >
                    {locText(kid.name, lang)}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--color-border)] dark:border-[#1E3646]">
            <button
              type="button"
              onClick={() => toggleAccordion('welcomeAudio')}
              className="min-h-[38px] px-3 py-1.5 rounded-xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-bg)] dark:bg-[#142430] text-xs font-extrabold text-[var(--color-text)] dark:text-[#F8FAFC] cursor-pointer"
            >
              {openAccordions.welcomeAudio
                ? isEn
                  ? '🔊 Hide read-aloud tip'
                  : '🔊 إخفاء قراءة النصيحة'
                : isEn
                ? '🔊 Show read-aloud tip'
                : '🔊 إظهار قراءة النصيحة'}
            </button>
            {onReplaySplash && (
              <button
                type="button"
                onClick={onReplaySplash}
                className="min-h-[38px] px-3 py-1.5 rounded-xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-bg)] dark:bg-[#142430] text-xs font-extrabold text-[var(--color-text)] dark:text-[#F8FAFC] cursor-pointer"
              >
                {isEn ? '✨ Replay Welcome' : '✨ شاشة الترحيب'}
              </button>
            )}
          </div>
        </div>
      </SectionToolsDrawer>


      <section data-testid="home-video-library" className="overflow-hidden rounded-3xl border border-[#1b5360]/20 bg-gradient-to-br from-[#102C38] via-[#123A46] to-[#1B5360] p-4 text-white shadow-lg sm:p-5">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-black tracking-widest text-teal-200">NEKBAAR MEDIA</span>
            <h2 className="mt-1 text-base font-black leading-relaxed">{isEn ? 'Family video library' : 'مكتبة الفيديوهات العائلية'}</h2>
            <p className="mt-1 max-w-xl text-[11px] leading-6 text-white/75">{isEn ? 'Videos are uploaded, reviewed and played inside Nekbaar. No external video links.' : 'كل فيديوهات نكبر هتترفع على المنصة وتُراجع قبل النشر، وتتفرجوا عليها من مشغّل داخلي من غير روابط خارجية.'}</p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] font-extrabold text-teal-100">{isEn ? 'INTERNAL ONLY' : 'محتوى داخلي'}</span>
            <button type="button" onClick={() => navigateTo('media')} className="min-h-[40px] rounded-xl border border-white/25 bg-white/10 px-3 py-2 text-[11px] font-black text-white hover:bg-white/20">{isEn ? 'Open media library →' : 'افتح مكتبة الوسائط ←'}</button>
          </div>
        </div>
        <InternalVideoFeed language={isEn ? 'en' : 'ar'} limit={4}/>
      </section>

      <section data-testid="home-practical-family-ideas" className="rounded-3xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-surface)] dark:bg-[#101D26] p-4 sm:p-5 space-y-3.5">
        <div className="flex items-end justify-between gap-3">
          <div>
            <span className="text-[10px] font-black tracking-wide text-teal-700 dark:text-teal-300">{isEn ? 'SMALL STEPS, REAL VALUE' : 'خطوات صغيرة.. فايدة حقيقية'}</span>
            <h2 className="mt-1 text-base font-black text-[var(--color-text)] dark:text-white">{isEn ? 'Practical ideas for your family today' : 'أفكار عملية تقدروا تطبقوها النهارده'}</h2>
            <p className="mt-1 text-xs leading-5 text-[var(--color-muted)]">{isEn ? 'Short, useful actions — not another feed to scroll.' : 'اقتراحات بسيطة قابلة للتنفيذ، مش محتوى لمجرد التصفح.'}</p>
          </div>
          <span className="shrink-0 rounded-xl bg-teal-50 dark:bg-[#142430] px-2.5 py-1.5 text-[10px] font-black text-teal-800 dark:text-teal-300">{isEn ? '3 ideas' : '٣ أفكار'}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { id: 'routine' as const, image: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=700&q=80', titleAr: 'جهّزوا للنوم من بدري', titleEn: 'Make bedtime easier', bodyAr: 'اختاروا ٣ خطوات ثابتة قبل النوم: تهدئة، قصة قصيرة، ثم إضاءة هادية.', bodyEn: 'Keep three predictable steps: wind down, share a short story, then dim the lights.', ctaAr: 'افتح الروتين', ctaEn: 'Open routine' },
            { id: 'children' as const, image: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=700&q=80', titleAr: 'اسأل عن إحساسه', titleEn: 'Name the feeling', bodyAr: 'بدل «مالك؟»، جرّب «إيه أكتر حاجة فرّحتك أو ضايقتك النهارده؟» واسمع للآخر.', bodyEn: 'Try “What made you happy or upset today?” — then listen without rushing to fix it.', ctaAr: 'افتح متابعة المشاعر', ctaEn: 'Open emotional check-in' },
            { id: 'medical' as const, image: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=700&q=80', titleAr: 'خلّي المعلومات المهمة جاهزة', titleEn: 'Keep key care details ready', bodyAr: 'راجعوا الحساسية والأدوية وبيانات طبيب الأطفال، وحدّثوها عند أي تغيير.', bodyEn: 'Review allergies, medications and pediatrician details; update them whenever something changes.', ctaAr: 'افتح المتابعة الصحية', ctaEn: 'Open health records' },
          ].map((idea) => (
            <article key={idea.id} className="overflow-hidden rounded-2xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-muted)]/45 dark:bg-[#142430]">
              <div className="relative h-28 sm:h-32 overflow-hidden">
                <img src={idea.image} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/45 to-transparent" />
              </div>
              <div className="space-y-2 p-3">
                <h3 className="text-sm font-black text-[var(--color-text)] dark:text-white">{isEn ? idea.titleEn : idea.titleAr}</h3>
                <p className="min-h-[54px] text-[11px] leading-5 text-[var(--color-muted)]">{isEn ? idea.bodyEn : idea.bodyAr}</p>
                <button type="button" onClick={() => idea.id === 'children' ? openChildMoodCheckin() : navigateTo(idea.id)} className="min-h-10 w-full rounded-xl bg-teal-700 px-3 py-2 text-xs font-extrabold text-white transition-colors hover:bg-teal-800">{isEn ? idea.ctaEn : idea.ctaAr} ←</button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* =====================================================================
          3. DAILY CHILD LOG — KEEP THE USEFUL TRACKING ACTIONS
          ===================================================================== */}
      <HomeAccordionCard
        id="home-one-handed-quick-pulse"
        testId="home-one-handed-quick-pulse"
        iconEmoji="⚡"
        iconBgClass="bg-teal-500/15 text-[#0d9488] dark:text-[#2DD4BF]"
        title={isEn ? 'Your child’s day at a glance' : 'سجل يوم طفلك'}
        subtitle={
          isEn
            ? `Log sleep, meals & care for ${activeKidName}; open a full emotional check-in`
            : `سجّل النوم والوجبات والرعاية لـ ${activeKidName}، وافتح متابعة المشاعر بالتفصيل`
        }
        badgeText={`${activeKidName} · ${activeKidStageLabel}`}
        isOpen={Boolean(openAccordions.quickTrack)}
        onToggle={() => toggleAccordion('quickTrack')}
        isEn={isEn}
        headerExtraAction={<button type="button" onClick={() => navigateTo('children')} className="min-h-[40px] rounded-xl bg-teal-700 px-3 py-2 text-xs font-black text-white">{isEn ? 'Open child profile' : 'فتح ملف الطفل'}</button>}
      >
        <div className="space-y-3">
          {state.kids.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-teal-500/35 bg-teal-50/50 dark:bg-[#142430] p-4 text-center space-y-3">
              <p className="text-xs font-semibold text-[var(--color-muted)] dark:text-[#CBD5E1]">{isEn ? 'Your child’s daily log will appear here after adding a child profile.' : 'سجل يوم الطفل هيظهر هنا بعد إضافة ملفه للأسرة.'}</p>
              <button type="button" onClick={() => navigateTo('children')} className="min-h-[40px] rounded-xl bg-[#0d9488] px-4 py-2 text-xs font-black text-white">{isEn ? 'Add child profile' : 'إضافة ملف طفل'}</button>
            </div>
          ) : (
          <>
          {/* Clean Child Selector Strip */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-extrabold text-[var(--color-muted)] dark:text-[#94A3B8]">
              {isEn ? 'Select Child:' : 'اختر الطفل:'}
            </span>
            <div className="inline-flex flex-wrap items-center gap-1.5">
              {state.kids.map((kid, idx) => {
                const isActive = idx === selectedKidIdx;
                const cTone = getChildColorClasses(idx);
                return (
                  <button
                    key={kid.id}
                    type="button"
                    data-testid={`home-kid-switcher-${kid.id}`}
                    onClick={() => setSelectedKidIdx(idx)}
                    className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                      isActive ? cTone.pillActive : cTone.pillInactive
                    }`}
                  >
                    {kid.emoji} {locText(kid.name, lang)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4 Balanced, Intuitive One-Tap Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {(() => {
              const pulse = quickPulseByKid[activeKidId] || {
                sleepLogged: false,
                mealLogged: false,
                moodEmoji: '😊',
                careLogged: false,
              };
              const sleepActionKey = `${activeKidId}:sleep`;
              const mealActionKey = `${activeKidId}:meal`;
              const careActionKey = `${activeKidId}:care`;
              const isSleepSaving = Boolean(savingDashboardActions[sleepActionKey]);
              const isMealSaving = Boolean(savingDashboardActions[mealActionKey]);
              const isCareSaving = Boolean(savingDashboardActions[careActionKey]);
              const loggedCount = Number(pulse.sleepLogged) + Number(pulse.mealLogged) + Number(pulse.careLogged);
              const progressPercent = Math.round((loggedCount / 3) * 100);
              return (
                <>
                  <div className="col-span-2 sm:col-span-4 rounded-2xl border border-teal-500/20 bg-gradient-to-r from-teal-50 to-sky-50 dark:from-[#142B35] dark:to-[#142430] p-3.5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-black text-[var(--color-text)] dark:text-white">{isEn ? activeKidName + '’s daily log' : 'ملخص يوم ' + activeKidName}</p>
                        <p className="mt-1 text-[10px] font-semibold text-[var(--color-muted)]">{isEn ? 'Saved sleep, meal and care entries appear in the child profile.' : 'أي تسجيل نوم أو وجبة أو رعاية محفوظ هتلاقوه في ملف الطفل.'}</p>
                      </div>
                      <span className="shrink-0 rounded-xl bg-white/80 dark:bg-[#0B131A] px-3 py-2 text-xs font-black tabular-nums text-teal-800 dark:text-teal-200">{loggedCount}/3</span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/80 dark:bg-[#0B131A]">
                      <div className="h-full rounded-full bg-gradient-to-r from-teal-500 to-sky-500 transition-all duration-500" style={{ width: progressPercent + '%' }} />
                    </div>
                    <p className="mt-1.5 text-[9px] font-bold text-[var(--color-muted)]">{progressPercent === 100 ? (isEn ? 'Daily essentials completed' : 'اكتملت أساسيات تسجيل اليوم') : (isEn ? 'Complete the three essentials when they happen.' : 'سجّل الأساسيات وقت حدوثها.. من غير ضغط أو التزام يومي.')}</p>
                  </div>
                  <button
                    type="button"
                    data-testid="quick-pulse-sleep-btn"
                    disabled={pulse.sleepLogged || isSleepSaving}
                    onClick={() => {
                      void runDashboardSave(sleepActionKey, 'sleep_log', 'تسجيل النوم أو القيلولة', {}, () => {
                        setQuickPulseByKid((prev) => {
                          const current = prev[activeKidId] || { sleepLogged: false, mealLogged: false, moodEmoji: '😊', careLogged: false };
                          return { ...prev, [activeKidId]: { ...current, sleepLogged: true } };
                        });
                        onShowToast?.(isEn ? `🌙 ${activeKidName}: sleep logged and saved ✓` : `🌙 تم حفظ سجل نوم ${activeKidName} بنجاح ✓`);
                      });
                    }}
                    className={`min-h-[48px] px-3.5 py-2.5 rounded-2xl border flex items-center justify-between gap-2 text-xs font-extrabold transition-all active:scale-95 cursor-pointer disabled:cursor-wait disabled:opacity-60 ${
                      pulse.sleepLogged
                        ? 'border-indigo-500/40 bg-indigo-500/15 text-indigo-900 dark:text-indigo-200'
                        : 'border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-muted)]/40 dark:bg-[#142430] text-[var(--color-text)] dark:text-[#F8FAFC]'
                    }`}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <span>🌙</span>
                      <span>{isEn ? 'Sleep / Nap' : 'نوم / قيلولة'}</span>
                    </span>
                    <span className="text-[11px] font-black">{isSleepSaving ? (isEn ? 'Saving…' : 'جارٍ الحفظ…') : pulse.sleepLogged ? '✓' : '+'}</span>
                  </button>

                  <button
                    type="button"
                    data-testid="quick-pulse-meal-btn"
                    disabled={pulse.mealLogged || isMealSaving}
                    onClick={() => {
                      void runDashboardSave(mealActionKey, 'nutrition', 'تسجيل وجبة أو رضعة', { dashboardKind: 'meal' }, () => {
                        setQuickPulseByKid((prev) => {
                          const current = prev[activeKidId] || { sleepLogged: false, mealLogged: false, moodEmoji: '😊', careLogged: false };
                          return { ...prev, [activeKidId]: { ...current, mealLogged: true } };
                        });
                        onShowToast?.(isEn ? `🥣 ${activeKidName}: meal saved ✓` : `🥣 تم حفظ سجل وجبة ${activeKidName} بنجاح ✓`);
                      });
                    }}
                    className={`min-h-[48px] px-3.5 py-2.5 rounded-2xl border flex items-center justify-between gap-2 text-xs font-extrabold transition-all active:scale-95 cursor-pointer disabled:cursor-wait disabled:opacity-60 ${
                      pulse.mealLogged
                        ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-900 dark:text-emerald-200'
                        : 'border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-muted)]/40 dark:bg-[#142430] text-[var(--color-text)] dark:text-[#F8FAFC]'
                    }`}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <span>🥣</span>
                      <span>{isEn ? 'Meal / Feed' : 'وجبة / رضعة'}</span>
                    </span>
                    <span className="text-[11px] font-black">{isMealSaving ? (isEn ? 'Saving…' : 'جارٍ الحفظ…') : pulse.mealLogged ? '✓' : '+'}</span>
                  </button>

                  <button
                    type="button"
                    data-testid="quick-pulse-mood-btn"
                    onClick={() => openChildMoodCheckin()}
                    className="min-h-[48px] px-3.5 py-2.5 rounded-2xl border border-amber-500/40 bg-amber-500/12 text-amber-900 dark:text-amber-200 flex items-center justify-between gap-2 text-xs font-extrabold transition-all active:scale-95 cursor-pointer"
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <span>{pulse.moodEmoji}</span>
                      <span>{isEn ? 'Emotional check-in' : 'متابعة المشاعر'}</span>
                    </span>
                    <span className="text-[11px] font-black">↗</span>
                  </button>

                  <button
                    type="button"
                    data-testid="quick-pulse-care-btn"
                    disabled={pulse.careLogged || isCareSaving}
                    onClick={() => {
                      void runDashboardSave(careActionKey, 'other', 'تسجيل الرعاية اليومية', { dashboardKind: 'care' }, () => {
                        setQuickPulseByKid((prev) => {
                          const current = prev[activeKidId] || { sleepLogged: false, mealLogged: false, moodEmoji: '😊', careLogged: false };
                          return { ...prev, [activeKidId]: { ...current, careLogged: true } };
                        });
                        onShowToast?.(isEn ? `🩺 ${activeKidName}: daily care saved ✓` : `🩺 تم حفظ سجل الرعاية اليومية لـ ${activeKidName} ✓`);
                      });
                    }}
                    className={`min-h-[48px] px-3.5 py-2.5 rounded-2xl border flex items-center justify-between gap-2 text-xs font-extrabold transition-all active:scale-95 cursor-pointer disabled:cursor-wait disabled:opacity-60 ${
                      pulse.careLogged
                        ? 'border-teal-500/40 bg-teal-500/15 text-[#0d9488] dark:text-[#2DD4BF]'
                        : 'border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-muted)]/40 dark:bg-[#142430] text-[var(--color-text)] dark:text-[#F8FAFC]'
                    }`}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <span>🩺</span>
                      <span>{isEn ? 'Daily care' : 'رعاية يومية'}</span>
                    </span>
                    <span className="text-[11px] font-black">{isCareSaving ? (isEn ? 'Saving…' : 'جارٍ الحفظ…') : pulse.careLogged ? '✓' : '+'}</span>
                  </button>
                </>
              );
            })()}
          </div>
          </>
          )}
        </div>
      </HomeAccordionCard>

      {/* =====================================================================
          4. ACCORDION: DYNAMIC TIME-AWARE DAILY WISDOM (بوصلة اليوم — CHECKLIST #3)
          ===================================================================== */}
      <HomeAccordionCard
        id="home-daily-parenting-wisdom"
        testId="home-daily-parenting-wisdom"
        iconEmoji="🧭"
        iconBgClass="bg-teal-500/15 text-[#0d9488] dark:text-[#2DD4BF]"
        title={isEn ? 'Daily Parenting Compass Wisdom' : 'حكمة وبوصلة اليوم التربوية'}
        subtitle={isEn ? dailyCompassWisdom.titleEn : dailyCompassWisdom.titleAr}
        badgeText={isEn ? dailyCompassWisdom.badgeEn : dailyCompassWisdom.badgeAr}
        isOpen={Boolean(openAccordions.dailyWisdom)}
        onToggle={() => toggleAccordion('dailyWisdom')}
        isEn={isEn}
      >
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold text-[var(--color-muted)] dark:text-[#94A3B8]">
              {isEn ? 'Switch time-of-day wisdom:' : 'تبديل حكمة الفترة الزمنية:'}
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'auto' as const, labelAr: '⚡ تلقائي', labelEn: '⚡ Auto' },
                { id: 'morning' as const, labelAr: '☀️ الصباح', labelEn: '☀️ Morning' },
                { id: 'afternoon' as const, labelAr: '🌤️ الظهيرة', labelEn: '🌤️ Afternoon' },
                { id: 'evening' as const, labelAr: '🌙 المساء', labelEn: '🌙 Evening' },
              ].map((slot) => {
                const active = wisdomTimeOverride === slot.id;
                return (
                  <button
                    key={slot.id}
                    type="button"
                    data-testid={`wisdom-slot-${slot.id}`}
                    onClick={() => setWisdomTimeOverride(slot.id)}
                    className={`min-h-[34px] px-2.5 py-1 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                      active
                        ? 'bg-[#0d9488] text-white border-[#0d9488]'
                        : 'bg-[var(--color-control-muted)] dark:bg-[#142430] text-[var(--color-text)] dark:text-[#F8FAFC] border-[var(--color-border)] dark:border-[#1E3646]'
                    }`}
                  >
                    {isEn ? slot.labelEn : slot.labelAr}
                  </button>
                );
              })}
            </div>
          </div>

          <p className="text-xs sm:text-sm font-semibold text-[var(--color-muted)] dark:text-[#CBD5E1] leading-relaxed">
            {isEn ? dailyCompassWisdom.bodyEn : dailyCompassWisdom.bodyAr}
          </p>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[var(--color-border)]/60 dark:border-[#1E3646]">
            <span className="text-xs font-extrabold text-[#0d9488] dark:text-[#2DD4BF]">
              ✨ {isEn ? dailyCompassWisdom.quoteEn : dailyCompassWisdom.quoteAr}
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onAddSuggestedRoutineTask?.(
                    isEn ? dailyCompassWisdom.actionTaskEn : dailyCompassWisdom.actionTaskAr,
                    dailyCompassWisdom.actionTime,
                    null
                  );
                }}
                className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-[#0d9488] hover:bg-[#0f766e] text-white text-xs font-extrabold transition-all cursor-pointer"
              >
                + {isEn ? dailyCompassWisdom.actionLabelEn : dailyCompassWisdom.actionLabelAr}
              </button>
            </div>
          </div>
        </div>
      </HomeAccordionCard>

      {/* =====================================================================
          5. ACCORDION: CHILD PROFILES, INTERESTS & ACTIVITIES
          ===================================================================== */}
      <HomeAccordionCard
        id="home-heroes-passions-arena"
        testId="home-heroes-passions-arena"
        iconEmoji="🏅"
        iconBgClass="bg-amber-500/15 text-amber-700 dark:text-amber-300"
        title={
          isEn
            ? 'Heroes, Passions & Milestones'
            : 'عالم الأبطال والشغف · محطات نمو أطفالنا'
        }
        subtitle={
          isEn
            ? 'Each child’s interests and activities, based on their own profile'
            : 'اهتمامات وأنشطة كل طفل بناءً على بيانات ملفه الفعلية'
        }
        badgeText={isEn ? `${state.kids.length} Child Profiles` : `${state.kids.length} ملفات أطفال`}
        badgeClass="bg-amber-500/15 text-amber-800 dark:text-amber-300"
        isOpen={Boolean(openAccordions.heroesArena)}
        onToggle={() => toggleAccordion('heroesArena')}
        isEn={isEn}
        headerExtraAction={<button type="button" onClick={() => navigateTo('children')} className="min-h-[40px] rounded-xl bg-[#0d9488] px-3 py-2 text-xs font-black text-white">{isEn ? 'Manage profiles' : 'إدارة ملفات الأطفال'}</button>}
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {heroesPassionsFeed.length === 0 ? (
            <div className="lg:col-span-3 rounded-2xl border border-dashed border-amber-500/35 bg-amber-50/40 dark:bg-[#142430] p-4 text-center space-y-3">
              <p className="text-xs font-semibold text-[var(--color-muted)] dark:text-[#CBD5E1]">{isEn ? 'Add a child profile to see interests and activities grounded in your family’s real information.' : 'أضيفوا ملف طفل علشان تظهر الاهتمامات والأنشطة المرتبطة ببيانات أسرتكم الفعلية.'}</p>
              <button type="button" onClick={() => navigateTo('children')} className="min-h-[40px] rounded-xl bg-[#0d9488] px-4 py-2 text-xs font-black text-white">{isEn ? 'Add child profile' : 'إضافة ملف طفل'}</button>
            </div>
          ) : heroesPassionsFeed.map((hero) => {
            const cheerCount = cheeredHeroIds[hero.id] ?? 0;
            return (
              <div
                key={hero.id}
                data-testid={`hero-passion-card-${hero.id}`}
                className={`rounded-2xl border-2 ${hero.accentBorder} bg-[var(--color-control-muted)]/30 dark:bg-[#142430]/80 p-4 flex flex-col justify-between gap-3 transition-all`}
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`px-2.5 py-1 rounded-xl text-[11px] font-black ${hero.accentBg}`}>
                      {isEn ? hero.arenaBadgeEn : hero.arenaBadgeAr}
                    </span>
                    <span className="text-xs font-black text-[var(--color-text)] dark:text-[#F8FAFC]">
                      {isEn ? hero.nameEn : hero.nameAr}
                    </span>
                  </div>

                  <h3 className="text-xs sm:text-sm font-black text-[var(--color-text)] dark:text-[#F8FAFC] leading-snug">
                    {isEn ? hero.titleEn : hero.titleAr}
                  </h3>

                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold text-[var(--color-muted)] dark:text-[#CBD5E1]">
                    {(isEn ? hero.passionTagsEn : hero.passionTagsAr).map((tag, i, arr) => (
                      <React.Fragment key={tag}>
                        <span>{tag}</span>
                        {i < arr.length - 1 && <span aria-hidden="true">·</span>}
                      </React.Fragment>
                    ))}
                  </div>

                  <p className="text-xs font-semibold text-[var(--color-muted)] dark:text-[#94A3B8] leading-relaxed">
                    {isEn ? hero.nextGoalEn : hero.nextGoalAr}
                  </p>

                  <div className="rounded-xl bg-[var(--color-surface)]/80 dark:bg-[#0B131A]/60 border border-[var(--color-border)]/70 px-3 py-2">
                    <p className="text-[10px] font-extrabold text-[var(--color-muted)] dark:text-[#94A3B8]">
                      {isEn ? 'Profile-based information' : 'معلومات من ملف الطفل'}
                    </p>
                    <p className="mt-0.5 text-[11px] font-semibold text-[var(--color-text)] dark:text-[#F8FAFC]">
                      {hero.passionTagsAr.length > 0
                        ? (isEn ? 'Interests are saved in this profile.' : 'الاهتمامات المعروضة مسجلة في الملف.')
                        : (isEn ? 'Add interests to personalize activities.' : 'أضيفوا الاهتمامات لتخصيص الأنشطة.')}
                    </p>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-[var(--color-border)]/60 dark:border-[#1E3646] flex items-center justify-between gap-2">
                  <button
                    type="button"
                    data-testid={`cheer-hero-btn-${hero.id}`}
                    onClick={() => {
                      setCheeredHeroIds((prev) => ({
                        ...prev,
                        [hero.id]: (prev[hero.id] ?? 0) + 1,
                      }));
                      onShowToast?.(
                        isEn
                          ? `🌟 Added family cheer for ${hero.nameEn}!`
                          : `🌟 تشجيع عائلي جديد للبطل ${hero.nameAr}!`
                      );
                    }}
                    className="min-h-[36px] px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-800 dark:text-amber-300 text-xs font-black cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <span>🌟</span>
                    <span>
                      {isEn ? `Cheer · ${cheerCount}` : `تشجيع البطل · ${cheerCount}`}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      onAddSuggestedRoutineTask?.(
                        isEn ? hero.routineTaskEn : hero.routineTaskAr,
                        hero.routineTime,
                        hero.kidId
                      )
                    }
                    className="min-h-[36px] px-3 py-1.5 rounded-xl bg-[#0d9488] hover:bg-[#0f766e] text-white text-xs font-extrabold cursor-pointer"
                  >
                    + {isEn ? 'Add Activity' : 'أضف للروتين'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </HomeAccordionCard>

      {/* =====================================================================
          6. ACCORDION: AI STORYTELLER
          ===================================================================== */}
      <HomeAccordionCard
        id="home-ai-storyteller-accordion"
        testId="home-ai-storyteller-accordion"
        iconEmoji="📖"
        iconBgClass="bg-amber-500/15 text-amber-700 dark:text-amber-300"
        title={
          isEn
            ? 'Bedtime Story Creator'
            : 'صانع حواديت قبل النوم'
        }
        subtitle={
          isEn
            ? 'Create a warm bedtime story starring your children'
            : 'ألف حدوتة مسائية دافئة بأسماء أطفالكم'
        }
        badgeText={isEn ? '15 Lines' : '١٥ سطراً'}
        badgeClass="bg-amber-500/15 text-amber-800 dark:text-amber-300"
        borderClass="border-amber-500/35 dark:border-[#1E3646]"
        isOpen={Boolean(openAccordions.bedtimeStories)}
        onToggle={() => toggleAccordion('bedtimeStories')}
        isEn={isEn}
        headerExtraAction={
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => navigateTo('children')} className="min-h-[40px] rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-black text-amber-800 dark:text-amber-200">{isEn ? 'Child profiles' : 'ملفات الأطفال'}</button>
          {onToggleBedtimeMode ? (
            <button
              type="button"
              data-testid="home-bedtime-filter-btn"
              onClick={onToggleBedtimeMode}
              className={`min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                bedtimeMode
                  ? 'bg-amber-500 text-slate-950 border-amber-500'
                  : 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/35'
              }`}
            >
              🌙 {bedtimeMode ? (isEn ? 'Evening Light: ON' : 'إضاءة المساء: مفعّلة') : isEn ? 'Warm Light' : 'إضاءة المساء'}
            </button>
          ) : undefined}
          </div>
        }
      >
        <div id="ai-storyteller-accordion-panel" data-testid="ai-storyteller-accordion-panel" className="space-y-4">
          <section
            data-testid="premium-illustrated-stories-coming-soon"
            aria-label={isEn ? 'Premium illustrated stories coming soon' : 'القصص المصوّرة مع Premium قريبًا'}
            dir={isEn ? 'ltr' : 'rtl'}
            className="relative overflow-hidden rounded-2xl border border-violet-500/25 bg-gradient-to-br from-violet-50 via-white to-amber-50 p-4 dark:from-[#211B35] dark:via-[#101D26] dark:to-[#30251D]"
          >
            <div className="flex items-start gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-violet-500/10 text-2xl">🎨</span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-black text-[var(--color-text)] dark:text-white">
                    {isEn ? 'Stories where your child becomes the hero' : 'حواديت مصوّرة طفلك بطلها'}
                  </h3>
                  <span className="rounded-full bg-violet-600 px-2.5 py-1 text-[10px] font-black text-white">
                    {isEn ? 'Coming soon with Premium' : 'قريبًا مع Premium'}
                  </span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-[var(--color-muted)] dark:text-[#CBD5E1]">
                  {isEn
                    ? 'With a parent-approved photo, your child will become a private illustrated character in an age-aware story. This feature is not available yet.'
                    : 'بموافقة ولي الأمر واختيار صورة الطفل، هيتحوّل لشخصية كرتونية داخل حكاية تناسب عمره واهتماماته. الميزة لسه مش متاحة، ومش بنطلب صورة دلوقتي.'}
                </p>
                <p className="mt-2 text-[10px] font-bold text-violet-800 dark:text-violet-200">
                  {isEn
                    ? 'Private by design: no public profile or sharing of the child photo.'
                    : 'خصوصية الطفل أساسية: الصورة والقصص هتكون خاصة بالأسرة، من غير نشر عام.'}
                </p>
              </div>
            </div>
          </section>
          <StoriesLibraryView
            lang={lang}
            kids={state.kids}
            onOpenChildren={() => navigateTo('children')}
            onShowToast={onShowToast}
            onScheduleStoryTask={onAddSuggestedRoutineTask}
          />
        </div>
      </HomeAccordionCard>

      {/* =====================================================================
          7. ACCORDION: DAILY CARE ESSENTIALS (NUTRITION, HYDRATION & SPORTS — CHECKLIST #3)
          ===================================================================== */}
      <HomeAccordionCard
        id="home-daily-essentials-hub"
        testId="home-daily-essentials-hub"
        iconEmoji="🌟"
        iconBgClass="bg-sky-500/15 text-sky-700 dark:text-sky-300"
        title={
          isEn
            ? `Daily Care Essentials for ${activeKidName}`
            : `أساسيات الرعاية اليومية لـ ${activeKidName}`
        }
        subtitle={
          isEn
            ? 'Nutrition, age-appropriate water logging, and physical activity'
            : 'التغذية، وتسجيل الماء عند ملاءمة العمر، والنشاط البدني والرياضي اليومي'
        }
        badgeText={`${currentWaterCups} 💧`}
        badgeClass="bg-sky-500/15 text-sky-700 dark:text-sky-300"
        headerExtraAction={<button type="button" onClick={() => navigateTo('medical')} className="min-h-[40px] rounded-xl border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-xs font-black text-sky-800 dark:text-sky-200">{isEn ? 'Open health record' : 'فتح السجل الصحي'}</button>}
        isOpen={Boolean(openAccordions.dailyEssentials)}
        onToggle={() => toggleAccordion('dailyEssentials')}
        isEn={isEn}
      >
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-extrabold text-[var(--color-muted)] dark:text-[#94A3B8]">
              {isEn ? 'Customize essentials for:' : 'تخصيص أساسيات الرعاية لـ:'}
            </span>
            <div className="inline-flex flex-wrap items-center gap-1.5">
              {state.kids.map((kid, idx) => {
                const isSelected = idx === selectedKidIdx;
                const cTone = getChildColorClasses(idx);
                return (
                  <button
                    key={kid.id}
                    type="button"
                    onClick={() => setSelectedKidIdx(idx)}
                    className={`min-h-[36px] px-3 py-1 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                      isSelected ? cTone.pillActive : cTone.pillInactive
                    }`}
                  >
                    {kid.emoji} {locText(kid.name, lang)}
                  </button>
                );
              })}
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
              topLeftBadge={<span>{isEn ? currentNutrition.badgeEn : currentNutrition.badgeAr}</span>}
              topRightBadge={<span>🕒 {currentNutrition.time}</span>}
              title={isEn ? currentNutrition.titleEn : currentNutrition.titleAr}
              metaLeft={
                <>
                  <span>👶 {activeKidName} · {activeKidStageLabel}</span>
                </>
              }
              bodyContent={
                <div className="space-y-2.5 pt-1">
                  <p className="text-xs font-semibold text-[var(--color-muted)] dark:text-[#CBD5E1] leading-relaxed">
                    {isEn ? currentNutrition.descEn : currentNutrition.descAr}
                  </p>
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

            {/* Water logging is hidden for infants under 6 months and when age is unknown. */}
            {activeKid?.birth && activeKidAge && activeKidAge.months >= 6 && (
              <MasterPatternCard
                id="home-essential-hydration-card"
                testId="home-essential-hydration-card"
                tone="sky"
                categoryKey="medical"
                itemIdOrIndex={2}
                darkMode={Boolean(state.darkMode)}
                topLeftBadge={<span>💧 {isEn ? 'Water log' : 'تسجيل شرب الماء'}</span>}
                topRightBadge={<span>{currentWaterCups} {isEn ? 'logged' : 'حصص مسجلة'}</span>}
                title={isEn ? `Water servings logged for ${activeKidName}` : `حصص الماء المسجلة لـ ${activeKidName}`}
                metaLeft={<span>{isEn ? 'A record, not a daily target' : 'سجل متابعة وليس هدفًا يوميًا ثابتًا'}</span>}
                bodyContent={
                  <p className="text-xs font-semibold text-[var(--color-muted)] dark:text-[#CBD5E1] leading-relaxed">
                    {isEn
                      ? 'Record water servings offered during the day. Needs vary with age, food, weather and health; follow your child’s clinician for individual guidance.'
                      : 'سجلوا حصص الماء المقدمة خلال اليوم. الاحتياج يختلف حسب العمر والطعام والطقس والحالة الصحية؛ اتبعوا إرشادات الطبيب عند الحاجة.'}
                  </p>
                }
                footerLeft={
                  <span className="text-xs font-extrabold text-[var(--color-text)] dark:text-[#F8FAFC]">
                    {currentWaterCups} {isEn ? 'servings today' : 'حصص اليوم'}
                  </span>
                }
                footerRight={
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={Boolean(savingDashboardActions[`${activeKidId}:hydration`])}
                      onClick={() => handleAdjustWater(-1)}
                      aria-label={isEn ? 'Decrease water log' : 'إنقاص تسجيل الماء'}
                      className="min-w-[44px] min-h-[44px] rounded-xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-muted)] dark:bg-[#142430] text-sm font-black text-[var(--color-text)] dark:text-[#F8FAFC] flex items-center justify-center cursor-pointer active:scale-95"
                    >
                      −
                    </button>
                    <button
                      type="button"
                      data-testid="home-hydration-add-cup-btn"
                      disabled={Boolean(savingDashboardActions[`${activeKidId}:hydration`])}
                      onClick={() => handleAdjustWater(1)}
                      className="min-h-[44px] px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-extrabold transition-all active:scale-95 cursor-pointer"
                    >
                      + {savingDashboardActions[`${activeKidId}:hydration`] ? (isEn ? 'Saving…' : 'جارٍ الحفظ…') : (isEn ? 'Log water' : 'تسجيل ماء 💧')}
                    </button>
                  </div>
                }
              />
            )}

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
                  disabled={isSportDoneToday || isSportSaving}
                  onClick={() => {
                    void runDashboardSave(sportActionKey, 'sports', isEn ? currentSport.titleEn : currentSport.titleAr, {
                      dashboardKind: 'sports',
                      activityId: selectedSportSlot,
                    }, () => {
                      setCompletedSportByKid((prev) => ({ ...prev, [activeKidId]: true }));
                      onShowToast?.(
                        isEn
                          ? `🏅 ${activeKidName}’s activity was saved for today ✓`
                          : `🏅 تم حفظ نشاط ${activeKidName} الرياضي اليوم ✓`
                      );
                    });
                  }}
                  className={`min-h-[34px] px-3 py-1 rounded-xl text-[11px] font-extrabold transition-all active:scale-95 cursor-pointer disabled:cursor-wait disabled:opacity-60 ${
                    isSportDoneToday
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-[#FF8C61] hover:bg-[#e86a3d] text-white'
                  }`}
                >
                  {isSportSaving
                    ? isEn
                      ? 'Saving…'
                      : 'جارٍ الحفظ…'
                    : isSportDoneToday
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
      </HomeAccordionCard>

      {/* =====================================================================
          8. ACCORDION: FAMILY WELLBEING & POSITIVE PARENTING SUPPORT
          Household support is separate from each child's emotional record.
          ===================================================================== */}
      <HomeAccordionCard
        id="home-parenting-support-center"
        testId="home-parenting-support-center"
        iconEmoji="💚"
        iconBgClass="bg-rose-500/15 text-rose-700 dark:text-rose-300"
        title={isEn ? 'Family Wellbeing & Parenting Support' : 'الدعم النفسي والتربوي للأسرة'}
        subtitle={
          isEn
            ? 'Practical support for parents, individual child check-ins and everyday situations'
            : 'مساندة للأب والأم، ومتابعة مشاعر كل طفل، وخطوات عملية للمواقف اليومية'
        }
        badgeText={isEn ? 'Parents + Each Child' : 'البيت + كل طفل'}
        headerExtraAction={<div className="flex flex-wrap gap-2"><button type="button" onClick={() => navigateTo('notifications')} className="min-h-[40px] rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-black text-rose-800 dark:text-rose-200">{isEn ? 'Parent support messages' : 'رسائل دعم الوالدين'}</button><button type="button" onClick={() => navigateTo('children')} className="min-h-[40px] rounded-xl border border-teal-500/30 bg-teal-500/10 px-3 py-2 text-xs font-black text-teal-800 dark:text-teal-200">{isEn ? 'Child profiles' : 'ملفات الأطفال'}</button></div>}
        isOpen={Boolean(openAccordions.parentingSupport)}
        onToggle={() => toggleAccordion('parentingSupport')}
        isEn={isEn}
      >
        <ParentingSupportCenter
          kids={state.kids}
          initialKidId={activeKid?.id ?? null}
          onActiveKidChange={(kidId) => {
            const selectedIndex = state.kids.findIndex((kid) => kid.id === kidId);
            if (selectedIndex >= 0) setSelectedKidIdx(selectedIndex);
          }}
          language={lang}
          onSaveChildMood={async (kidId, mood) => {
            const targetKid = state.kids.find((kid) => kid.id === kidId);
            if (!targetKid?.remoteId) {
              onShowToast?.(
                isEn
                  ? 'Save this child profile to the family account before recording feelings.'
                  : 'احفظ ملف الطفل في حساب الأسرة أولًا قبل تسجيل حالته الشعورية.'
              );
              return false;
            }
            const result = await createChildLifeRecord({
              childRemoteId: targetKid.remoteId,
              recordType: 'emotional_social',
              title: 'متابعة الحالة الشعورية للطفل',
              details: {
                moodKey: mood.id,
                moodEmoji: mood.emoji,
                moodLabelAr: mood.labelAr,
                moodLabelEn: mood.labelEn,
                source: 'parenting_support_center',
              },
            });
            if (result.error || !result.record) {
              onShowToast?.(
                isEn
                  ? `Could not save the child check-in: ${result.error || 'Unknown error'}`
                  : `تعذر حفظ متابعة الطفل: ${result.error || 'خطأ غير معروف'}`
              );
              return false;
            }
            setQuickPulseByKid((previous) => {
              const current = previous[kidId] || {
                sleepLogged: false,
                mealLogged: false,
                moodEmoji: '😊',
                careLogged: false,
              };
              return { ...previous, [kidId]: { ...current, moodEmoji: mood.emoji } };
            });
            onShowToast?.(
              isEn
                ? `💛 Saved ${mood.labelEn.toLowerCase()} check-in to ${locText(targetKid.name, 'en')}’s child record.`
                : `💛 تم حفظ حالة «${mood.labelAr}» في ملف ${locText(targetKid.name, 'ar')}.`
            );
            return true;
          }}
          onAddRoutineTask={onAddSuggestedRoutineTask}
        />
      </HomeAccordionCard>

      {/* =====================================================================
          9. ACCORDION: AGE-AWARE LEARNING & CURIOSITY
          ===================================================================== */}
      <HomeAccordionCard
        id="home-learning-track-card"
        testId="home-learning-track-card"
        iconEmoji="📚"
        iconBgClass="bg-sky-500/15 text-sky-700 dark:text-sky-300"
        title={isEn ? 'Learning, Curiosity & Development' : 'التعلم والفضول وتنمية المهارات'}
        subtitle={isEn ? 'Simple shared activities shaped around the child’s age' : 'أنشطة بسيطة مشتركة تناسب عمر الطفل واهتماماته'}
        badgeText={activeKidAge?.label || (isEn ? 'Age not recorded' : 'العمر غير مسجل')}
        isOpen={Boolean(openAccordions.learningTrack)}
        onToggle={() => toggleAccordion('learningTrack')}
        isEn={isEn}
      >
        <HomeLearningTrackSection
          language={lang}
          childName={activeKidName}
          ageStage={activeKidAge?.stageCode || 'all'}
          childId={activeKid?.id ?? null}
          onNavigate={navigateTo}
          onAddRoutineTask={onAddSuggestedRoutineTask}
        />
      </HomeAccordionCard>

      {/* =====================================================================
          9. ACCORDION: FAMILY VALUES & AGE-AWARE DAILY HABITS
          ===================================================================== */}
      <HomeAccordionCard
        id="home-values-track-card"
        testId="home-values-track-card"
        iconEmoji="✨"
        iconBgClass="bg-amber-500/15 text-amber-700 dark:text-amber-300"
        title={isEn ? 'Family Values & Everyday Character' : 'القيم والعادات في حياة الأسرة'}
        subtitle={isEn ? 'Age-aware kindness, respect, gratitude and responsibility' : 'الرحمة والاحترام والامتنان والمسؤولية بما يناسب عمر الطفل'}
        badgeText={isEn ? 'Family + Child' : 'الأسرة + الطفل'}
        isOpen={Boolean(openAccordions.valuesTrack)}
        onToggle={() => toggleAccordion('valuesTrack')}
        isEn={isEn}
      >
        <HomeValuesTrackSection
          language={lang}
          childName={activeKidName}
          ageStage={activeKidAge?.stageCode || 'all'}
          childId={activeKid?.id ?? null}
          onAddRoutineTask={onAddSuggestedRoutineTask}
        />
      </HomeAccordionCard>

      {/* =====================================================================
          9. ACCORDION: INTERACTIVE CHILDREN'S GAMES SHOWCASE
          ===================================================================== */}
      <HomeAccordionCard
        id="home-children-games-showcase"
        testId="home-children-games-showcase"
        iconEmoji="🎮"
        iconBgClass="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
        title={
          isEn
            ? 'Interactive Children’s Learning Games'
            : 'ركن ألعاب أطفالنا التفاعلية'
        }
        subtitle={
          isEn
            ? 'Brain puzzles, memory cards, emotion matching & sensory sounds'
            : 'ألغاز ذكاء، تطابق الذاكرة، الألوان والمشاعر، والأصوات الحسية'
        }
        badgeText={isEn ? '3 Stages' : '٣ مراحل'}
        badgeClass="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
        borderClass="border-emerald-500/35 dark:border-[#1E3646]"
        isOpen={Boolean(openAccordions.kidsGames)}
        onToggle={() => toggleAccordion('kidsGames')}
        isEn={isEn}
        headerExtraAction={
          <button
            type="button"
            id="home-open-games-page-btn"
            data-testid="home-open-games-page-btn"
            onClick={() => navigateTo('games')}
            className="min-h-[40px] px-4 py-2 rounded-2xl bg-gradient-to-r from-[#0d9488] to-emerald-600 hover:from-[#0f766e] hover:to-emerald-700 text-white text-xs font-black shadow-sm active:scale-95 transition-all cursor-pointer inline-flex items-center gap-1.5"
          >
            <span>🚀</span>
            <span>{isEn ? 'Open Games Page →' : 'افتح صفحة الألعاب ←'}</span>
          </button>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {state.kids.length === 0 ? (
            <div className="sm:col-span-3 rounded-2xl border border-dashed border-emerald-500/35 bg-emerald-50/40 dark:bg-[#142430] p-4 text-center space-y-3">
              <p className="text-xs font-semibold text-[var(--color-muted)] dark:text-[#CBD5E1]">{isEn ? 'Add a child profile to get age-aware learning and play suggestions.' : 'أضيفوا ملف طفل علشان تظهر اقتراحات اللعب والتعلم المناسبة لعمره.'}</p>
              <button type="button" onClick={() => navigateTo('children')} className="min-h-[40px] rounded-xl bg-[#0d9488] px-4 py-2 text-xs font-black text-white">{isEn ? 'Add child profile' : 'إضافة ملف طفل'}</button>
            </div>
          ) : state.kids.map((kid, index) => {
            const age = calculateChildAge(kid.birth, lang);
            const hasKnownAge = Boolean(kid.birth);
            const tone = ['border-sky-500/40', 'border-rose-500/40', 'border-amber-500/40'][index % 3];
            const activity = !hasKnownAge
              ? {
                  badgeAr: '🌿 نشاط عام تحت إشراف الأسرة',
                  badgeEn: '🌿 General supervised activity',
                  titleAr: 'اختاروا نشاطًا بسيطًا حسب قدرة الطفل واهتمامه',
                  titleEn: 'Choose a simple activity based on the child’s ability and interests',
                  descAr: 'أضيفوا تاريخ الميلاد لعرض اقتراحات أدق حسب المرحلة العمرية.',
                  descEn: 'Add the birth date to show more relevant age-stage suggestions.',
                }
              : age.months < 24
              ? {
                  badgeAr: '👶🏻 استكشاف حسي مناسب للعمر',
                  badgeEn: '👶🏻 Age-aware sensory play',
                  titleAr: 'أصوات هادئة وتتبع بصري ولعب آمن تحت إشرافك',
                  titleEn: 'Gentle sounds, visual tracking and supervised safe play',
                  descAr: 'اختاروا نشاطًا بسيطًا يناسب مرحلة الحركة الحالية، مع مراقبة الطفل طوال الوقت.',
                  descEn: 'Choose a simple activity that fits the child’s current movement stage and supervise throughout.',
                }
              : age.years < 5
              ? {
                  badgeAr: '🎨 لعب واكتشاف',
                  badgeEn: '🎨 Play & discovery',
                  titleAr: 'تطابق الألوان والحكايات وتسمية المشاعر',
                  titleEn: 'Color matching, stories and naming feelings',
                  descAr: 'نشاط اختياري يجمع اللعب واللغة والتعبير عن المشاعر دون ضغط.',
                  descEn: 'An optional activity combining play, language and emotional expression without pressure.',
                }
              : {
                  badgeAr: '🧩 تفكير ومهارات',
                  badgeEn: '🧩 Thinking & skills',
                  titleAr: 'لغز بسيط أو تحدي حساب حسب اهتمام الطفل',
                  titleEn: 'A simple puzzle or number challenge based on the child’s interests',
                  descAr: 'اختاروا تحديًا قصيرًا يناسب مستوى الطفل واهتماماته، واحتفلوا بالمحاولة.',
                  descEn: 'Choose a short challenge that fits the child’s level and interests, and celebrate the effort.',
                };
            return {
              id: `game-child-${kid.id}`,
              badgeAr: `${locText(kid.name, 'ar')} · ${age.label}`,
              badgeEn: `${locText(kid.name, 'en')} · ${age.label}`,
              titleAr: activity.titleAr,
              titleEn: activity.titleEn,
              descAr: activity.descAr,
              descEn: activity.descEn,
              borderTone: tone,
            };
          }).map((gCard) => (
            <button
              type="button"
              key={gCard.id}
              onClick={() => navigateTo('games')}
              className={`w-full text-start rounded-2xl border-2 ${gCard.borderTone} bg-[var(--color-control-muted)]/35 dark:bg-[#142430] p-4 flex flex-col justify-between gap-2.5 hover:shadow-md transition-all cursor-pointer`}
            >
              <div className="space-y-1.5">
                <span className="text-[11px] font-black text-[#0d9488] dark:text-[#2DD4BF]">
                  {isEn ? gCard.badgeEn : gCard.badgeAr}
                </span>
                <h3 className="text-xs sm:text-sm font-black text-[var(--color-text)] dark:text-[#F8FAFC]">
                  {isEn ? gCard.titleEn : gCard.titleAr}
                </h3>
                <p className="text-xs font-semibold text-[var(--color-muted)] dark:text-[#94A3B8] leading-relaxed">
                  {isEn ? gCard.descEn : gCard.descAr}
                </p>
              </div>
              <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-300 pt-1 inline-flex items-center gap-1">
                <span>▶</span>
                <span>{isEn ? 'Play Now' : 'العب الآن'}</span>
              </span>
            </button>
          ))}
        </div>
      </HomeAccordionCard>

      {/* =====================================================================
          10. ACCORDION: HORIZONTAL SCROLLABLE IMAGE GALLERY (CHECKLIST #3 & #12B)
          ===================================================================== */}
      <HomeAccordionCard
        id="home-horizontal-wisdom-gallery"
        testId="home-horizontal-wisdom-gallery"
        iconEmoji="🖼️"
        iconBgClass="bg-indigo-500/15 text-indigo-700 dark:text-indigo-300"
        title={
          isEn
            ? 'Visual Parenting Wisdom Gallery'
            : 'نصايح مصورة وسهلة التطبيق'
        }
        subtitle={
          isEn
            ? 'Swipe horizontally left or right to explore illustrated daily parenting tips'
            : 'بطاقات سريعة فيها فكرة واحدة تقدر تطبقها مع طفلك'
        }
        badgeText={isEn ? '5 Cards' : '٥ بطاقات مصورة'}
        badgeClass="bg-indigo-500/15 text-indigo-700 dark:text-indigo-300"
        headerExtraAction={<button type="button" onClick={() => { setOpenAccordions((previous) => ({ ...previous, dailyWisdom: true })); document.getElementById('home-daily-parenting-wisdom')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }} className="min-h-[40px] rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-3 py-2 text-xs font-black text-indigo-800 dark:text-indigo-200">{isEn ? 'Open daily parenting compass' : 'افتح بوصلة التربية اليومية'}</button>}
        isOpen={Boolean(openAccordions.wisdomGallery)}
        onToggle={() => toggleAccordion('wisdomGallery')}
        isEn={isEn}
      >
        <div className="space-y-3">
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              data-testid="wisdom-gallery-scroll-prev"
              onClick={() => handleScrollGallery('prev')}
              aria-label={isEn ? 'Scroll gallery left' : 'تمرير المعرض لليمين'}
              className="w-9 h-9 rounded-xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-muted)] dark:bg-[#142430] text-[var(--color-text)] dark:text-[#F8FAFC] flex items-center justify-center text-sm font-black cursor-pointer"
            >
              {isEn ? '◀' : '▶'}
            </button>
            <button
              type="button"
              data-testid="wisdom-gallery-scroll-next"
              onClick={() => handleScrollGallery('next')}
              aria-label={isEn ? 'Scroll gallery right' : 'تمرير المعرض لليسار'}
              className="w-9 h-9 rounded-xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-muted)] dark:bg-[#142430] text-[var(--color-text)] dark:text-[#F8FAFC] flex items-center justify-center text-sm font-black cursor-pointer"
            >
              {isEn ? '▶' : '◀'}
            </button>
          </div>

          <div
            ref={galleryScrollRef}
            className="flex items-stretch gap-4 overflow-x-auto no-scrollbar pb-2 snap-x snap-mandatory"
          >
            {PUBLIC_PARENTING_GALLERY_CARDS.map((card) => (
              <div
                key={card.id}
                data-testid={`wisdom-gallery-card-${card.id}`}
                className={`min-w-[270px] sm:min-w-[310px] max-w-[320px] snap-start rounded-2xl border-2 ${card.borderTone} bg-[var(--color-control-muted)]/35 dark:bg-[#142430] overflow-hidden flex flex-col justify-between shrink-0 shadow-xs`}
              >
                <div className="relative h-40 w-full overflow-hidden bg-slate-900">
                  <img
                    src={card.imageUrl}
                    alt={isEn ? card.titleEn : card.titleAr}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                  <span className="absolute top-3 start-3 px-2.5 py-1 rounded-full bg-black/55 backdrop-blur-xs text-white text-[11px] font-black border border-white/20">
                    {isEn ? card.tagEn : card.tagAr}
                  </span>
                  <h3 className="absolute bottom-3 inset-x-3 text-xs sm:text-sm font-black text-white leading-snug">
                    {isEn ? card.titleEn : card.titleAr}
                  </h3>
                </div>

                <div className="p-3.5 flex-1 flex flex-col justify-between gap-2">
                  <p className="text-xs font-semibold text-[var(--color-text)] dark:text-[#CBD5E1] leading-relaxed">
                    {isEn ? card.wisdomEn : card.wisdomAr}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </HomeAccordionCard>

      {/* =====================================================================
          11. ACCORDION: FEATURED FAMILY STORE & PRODUCTS SHOWCASE
          ===================================================================== */}
      <HomeAccordionCard
        id="home-minimalist-gateways"
        testId="home-minimalist-gateways"
        iconEmoji="🛍️"
        iconBgClass="bg-teal-500/15 text-[#0d9488] dark:text-[#2DD4BF]"
        title={isEn ? 'Featured Family Store & Supplies' : 'ترشيحات المتجر ومستلزمات الأسرة'}
        subtitle={
          isEn
            ? 'Montessori toys, books, apparel, and family service listings'
            : 'ألعاب مونتيسوري، قصص تربوية، ملابس قطنية، وخدمات أسرية'
        }
        badgeText={isEn ? 'Family supplies & services' : 'مستلزمات وخدمات الأسرة'}
        headerExtraAction={<button type="button" onClick={() => navigateTo('services')} className="min-h-[40px] rounded-xl bg-teal-700 px-3 py-2 text-xs font-black text-white">{isEn ? 'Open full store' : 'فتح المتجر بالكامل'}</button>}
        isOpen={Boolean(openAccordions.storeShowcase)}
        onToggle={() => toggleAccordion('storeShowcase')}
        isEn={isEn}
      >
        <div className="space-y-4">
          <div className="flex justify-end">
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
                    : 'Store Categories'
                  : showPromoShowcase
                  ? 'إخفاء أقسام المتجر'
                  : 'أقسام المتجر'}
              </span>
              <span className="text-[10px]">{showPromoShowcase ? '⌄' : '›'}</span>
            </button>
          </div>

          <div id="home-promotional-showcase" data-testid="home-promotional-showcase">
            {showPromoShowcase && (
              <div className="pt-3 border-t border-gray-100 dark:border-[#1E3646] grid grid-cols-2 gap-2.5 animate-page-enter">
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
                    titleEn: 'Nurseries & Schools',
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
                    <div className="text-xs font-extrabold text-[var(--color-text)] dark:text-[#F8FAFC] leading-snug">
                      {isEn ? promo.titleEn : promo.titleAr}
                    </div>
                    <div className="text-[10px] font-bold text-[#0d9488] dark:text-[#2DD4BF]">
                      {isEn ? promo.ageEn : promo.ageAr}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <CatalogView
            lang={lang}
            onAddToCart={onAddToCart}
            onInspectItem={onInspectCommercialItem}
            onAddToWishes={onAddProductToWishes}
            onShowToast={onShowToast}
          />
        </div>
      </HomeAccordionCard>
    </section>
  );
};

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Baby, CalendarDays, HeartPulse, ListChecks, ShoppingBag } from 'lucide-react';
import {
  CalendarEvent,
  CommercialItem,
  FamilySpaceState,
  LanguageCode,
  VoiceVaultMoment,
  calculateChildAge,
  getDefaultCityForCountry,
  locText,
  sanitizeUserText,
} from '../domain/familySpaceCore';
import { PageId } from '../context/FamilyAppContext';
import {
  FamilyMoodBarometer,
  MasterPatternCard,
  SoftFilledIcon,
} from '../components/DesignSystem';
import { ThreeDIconId } from '../components/ThreeDVisuals';
import { HeaderBarProfileSpec } from '../components/HeaderBar';
import { useMaster } from '../services/MasterAppController';
import { BatteryDiagnosticsView } from '../components/BatteryDiagnosticsView';
import { StoriesLibraryView } from '../components/StoriesLibraryView';
import { CatalogView } from '../components/CatalogView';
import { SectionToolsDrawer } from '../components/SectionToolsDrawer';
import { InternalVideoFeed } from '../components/InternalVideoFeed';
import { createChildLifeRecord, fetchDailyChildLifeRecords } from '../services/supabaseService';

export interface HomeDashboardSectionProps {
  state: FamilySpaceState;
  lang: LanguageCode;
  parentProfileSpec: HeaderBarProfileSpec;
  cartItemCount: number;
  completedTasksCount: number;
  nearestEvent?: CalendarEvent | null;
  todayFormattedCombined: string;
  userCoords?: { lat: number; lng: number } | null;
  geoStatus: 'idle' | 'loading' | 'success' | 'error' | 'active' | 'locating';
  navigateTo: (pageId: PageId) => void;
  onSelectPreciseCity: (val: string) => void;
  onUseCurrentLocation: () => void;
  onAddToCart: (item: CommercialItem, variant?: string) => void;
  onInspectCommercialItem: (item: CommercialItem) => void;
  onAddProductToWishes: (item: CommercialItem) => void;
  onAddSuggestedRoutineTask?: (taskName: string, timeStr: string, kidId: number | null) => void;
  onShowToast?: (msg: string) => void;
  bedtimeMode?: boolean;
  onToggleBedtimeMode?: () => void;
  onOpenStoreCategory?: (catId: string) => void;
  onReplaySplash?: () => void;
  onAddVoiceMoment?: (kidId: number, moment: VoiceVaultMoment) => void;
  onToggleTaskDone?: (taskId: number) => void;
}

interface DailyAudioBriefEpisode {
  id: string;
  timeBucket: 'morning' | 'afternoon' | 'evening';
  slotLabelAr: string;
  slotLabelEn: string;
  titleAr: string;
  titleEn: string;
  hostsAr: string;
  hostsEn: string;
  durationSec: number;
  durationLabel: string;
  summaryAr: string;
  summaryEn: string;
  takeawayAr: string;
  takeawayEn: string;
  melodyHz: number[];
}

const DAILY_AUDIO_BRIEFS_30S: DailyAudioBriefEpisode[] = [
  {
    id: 'brief-morning-30s',
    timeBucket: 'morning',
    slotLabelAr: '☀️ رسالة الصباح الصوتية',
    slotLabelEn: '☀️ Morning Support Audio',
    titleAr: 'ابدأ يومكم بلحظة تواصل بسيطة',
    titleEn: 'Begin the Day with a Small Moment Together',
    hostsAr: 'دقيقة عملية لكل أب وأم',
    hostsEn: 'A practical minute for every parent',
    durationSec: 30,
    durationLabel: '00:30',
    summaryAr:
      'قبل ما تبدأوا مشاوير اليوم، خُدوا دقيقة تسمعوا طفلكم وتقولوا له إيه اللي هيحصل النهارده. الروتين الواضح بيساعده يستعد.',
    summaryEn:
      'A calm smile and a warm hug before Youssef heads to school and Laila to nursery anchors their emotional safety all day.',
    takeawayAr: '💡 جرّب النهارده: قول لطفلك خطوتين أو تلاتة من خطة اليوم.',
    takeawayEn: '💡 Morning cue: Calm begins with our voice tone in the first 10 minutes.',
    melodyHz: [392.0, 440.0, 493.88, 523.25],
  },
  {
    id: 'brief-afternoon-30s',
    timeBucket: 'afternoon',
    slotLabelAr: '🌤️ رسالة الظهيرة الصوتية',
    slotLabelEn: '🌤️ Afternoon Support Audio',
    titleAr: 'بعد الحضانة أو المدرسة: استمع أولاً، ثم اسأل',
    titleEn: 'After School: Listen First, Then Ask',
    hostsAr: 'دعم صوتي دافئ لأحمد ومريم',
    hostsEn: 'Warm Audio Support for Ahmad & Maryam',
    durationSec: 30,
    durationLabel: '00:30',
    summaryAr:
      'سيب لطفلك فرصة يهدأ بعد الرجوع. اعرض عليه مية أو وجبة مناسبة لعمره، وبعدها اسأله سؤال بسيط عن يومه من غير تحقيق.',
    summaryEn:
      'When Laila and Youssef return, offer a light snack and water first alongside gentle tummy time for baby Hamza before homework talk.',
    takeawayAr: '💡 جرّب النهارده: عشر دقايق لعب أو كلام من غير موبايل.',
    takeawayEn: '💡 Afternoon cue: 15 minutes of undivided presence refills their love tank.',
    melodyHz: [440.0, 523.25, 587.33, 659.25],
  },
  {
    id: 'brief-evening-30s',
    timeBucket: 'evening',
    slotLabelAr: '🌙 رسالة المساء الصوتية',
    slotLabelEn: '🌙 Evening Wind-Down Audio',
    titleAr: 'قبل النوم: اختتموا اليوم بهدوء وروتين ثابت',
    titleEn: 'End the Day with a Calm, Familiar Routine',
    hostsAr: 'دعم صوتي دافئ لأحمد ومريم',
    hostsEn: 'Warm Audio Support for Ahmad & Maryam',
    durationSec: 30,
    durationLabel: '00:30',
    summaryAr:
      'اختاروا نشاط هادي قبل النوم يناسب سن طفلكم: قصة قصيرة، حضن، أو كلام عن أحلى حاجة حصلت النهارده.',
    summaryEn:
      'You both did a wonderful job today, Ahmad & Maryam. Dim the lights now and close the night with a warm story for Youssef, Laila, and Hamza.',
    takeawayAr: '💡 جرّبوا: نفس الترتيب كل ليلة، مع مرونة لو اليوم اتأخر.',
    takeawayEn: '💡 Evening cue: The last feeling before sleep stays in a child’s heart tomorrow.',
    melodyHz: [329.63, 392.0, 440.0, 523.25],
  },
];

interface InstagramReelTipItem {
  id: string;
  durationSec: number;
  durationLabel: string;
  stageBadgeAr: string;
  stageBadgeEn: string;
  childFocusAr: string;
  childFocusEn: string;
  titleAr: string;
  titleEn: string;
  captionAr: string;
  captionEn: string;
  expertNameAr: string;
  expertNameEn: string;
  likesCount: number;
  imageUrl: string;
  accentGradient: string;
  melodyHz: number[];
}

const HOME_INSTAGRAM_REELS: InstagramReelTipItem[] = [
  {
    id: 'reel-hamza-sensory',
    durationSec: 45,
    durationLabel: '00:45',
    stageBadgeAr: '👶🏻 من ٠ إلى ١٢ شهر',
    stageBadgeEn: '👶🏻 0–12 Months',
    childFocusAr: 'اللعب والتواصل في السنة الأولى',
    childFocusEn: 'Infant Sensory & Motor Milestones',
    titleAr: 'وقت الاستلقاء على البطن: دقائق قصيرة مع مراقبتك',
    titleEn: 'Simple Tummy-Time Ideas to Support Early Movement',
    captionAr:
      'اختار وقت يكون فيه الطفل صاحي وهادي، وحطه على بطنه على سطح ثابت وآمن مع مراقبتك طول الوقت. لو اتضايق، وقف وجرب وقت تاني.',
    captionEn:
      "Place a safe toy within your baby's easy reach and stay close, talking or singing gently while supervising.",
    expertNameAr: 'معلومة إرشادية · راجع طبيب الأطفال عند القلق',
    expertNameEn: 'Nekbaar Parenting Tips',
    likesCount: 0,
    imageUrl: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&w=900&q=80',
    accentGradient: 'from-sky-900/90 via-sky-950/45 to-slate-950/95',
    melodyHz: [392.0, 493.88, 587.33],
  },
  {
    id: 'reel-laila-emotions',
    durationSec: 52,
    durationLabel: '00:52',
    stageBadgeAr: '🎨 من ٣ إلى ٥ سنوات',
    stageBadgeEn: '🎨 Ages 3–5',
    childFocusAr: 'التعبير عن المشاعر',
    childFocusEn: 'Emotion Naming & Creative Expression',
    titleAr: 'ساعد طفلك يسمي إحساسه بدل ما تطلب منه يبطل عياط',
    titleEn: 'Turn Big Feelings into a Simple Drawing Activity',
    captionAr:
      'ممكن تقول: «واضح إنك متضايق.. تحب تحكيلي حصل إيه؟» اسمع من غير تقليل من إحساسه، ومش لازم يهدأ فورًا.',
    captionEn:
      'Instead of saying "stop crying", ask your child: "If that feeling had a color, which one would it be?"',
    expertNameAr: 'نشاط مقترح · مش بديل عن دعم متخصص',
    expertNameEn: 'Nekbaar Parenting Tips',
    likesCount: 0,
    imageUrl: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=900&q=80',
    accentGradient: 'from-rose-900/90 via-rose-950/45 to-slate-950/95',
    melodyHz: [440.0, 554.37, 659.25],
  },
  {
    id: 'reel-youssef-champions',
    durationSec: 55,
    durationLabel: '00:55',
    stageBadgeAr: '🎒 من ٦ إلى ٨ سنوات',
    stageBadgeEn: '🎒 Ages 6–8',
    childFocusAr: 'تنظيم المذاكرة والحركة',
    childFocusEn: 'School Focus & Athletic Confidence',
    titleAr: 'قسّم وقت المذاكرة لفترات قصيرة وبينها حركة',
    titleEn: 'Try Short Study Sessions with Movement Breaks',
    captionAr:
      'ابدأوا بفترة تركيز مناسبة لطفلكم، وبعدها استراحة حركة أو شرب مية. عدّلوا المدة حسب سنه وقدرته، ومفيش رقم واحد يناسب كل الأطفال.',
    captionEn:
      'Pairing a short study session with a movement break can help your child reset and return to the task.',
    expertNameAr: 'فكرة لتنظيم اليوم · عدّلها حسب طفلك',
    expertNameEn: 'Nekbaar Parenting Tips',
    likesCount: 0,
    imageUrl: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=900&q=80',
    accentGradient: 'from-amber-900/90 via-teal-950/50 to-slate-950/95',
    melodyHz: [523.25, 659.25, 783.99],
  },
  {
    id: 'reel-parents-harmony',
    durationSec: 48,
    durationLabel: '00:48',
    stageBadgeAr: '🤝 للأب والأم ومقدمي الرعاية',
    stageBadgeEn: '🤝 Parents & Caregivers',
    childFocusAr: 'تقاسم المهام وتجديد طاقة البيت',
    childFocusEn: 'Shared Care & Evening Reset',
    titleAr: 'اتفقوا على تقسيم المسؤوليات بدل ما كل حاجة تبقى على شخص واحد',
    titleEn: 'A Simple Evening Handover for Shared Parenting',
    captionAr:
      'اتفقوا مين مسؤول عن الوجبة، ومين عن تجهيز النوم، ومين يتابع المواعيد. الاتفاق الواضح يقلل اللخبطة والضغط.',
    captionEn:
      'Take turns gently: while one reads bedtime stories to Laila and Youssef, the other enjoys a quiet 15-minute recharge.',
    expertNameAr: 'خطوة عملية لتنظيم مسؤوليات البيت',
    expertNameEn: 'Nekbaar Family Tips',
    likesCount: 0,
    imageUrl: 'https://images.unsplash.com/photo-1542037104857-ffbb0b9155fb?auto=format&fit=crop&w=900&q=80',
    accentGradient: 'from-teal-900/90 via-slate-900/50 to-slate-950/95',
    melodyHz: [349.23, 440.0, 523.25],
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
    tagAr: '👶🏻 حمزة · ٦ شهور',
    tagEn: '👶🏻 Hamza · 6m',
    titleAr: 'ردّ على طفلك لما يحاول يتواصل',
    titleEn: 'Emotional Safety Starts with Eye Contact',
    wisdomAr:
      'لما طفلك يبص لك أو يصدر صوت، رد عليه بابتسامة أو كلام بسيط. التفاعل المتبادل فرصة يومية للتواصل والتعلم.',
    wisdomEn:
      'Your warm response to Hamza’s coos and smiles builds millions of neural pathways for lifelong trust.',
    imageUrl: 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?auto=format&fit=crop&w=700&q=80',
    borderTone: 'border-sky-500/40',
  },
  {
    id: 'gal-2',
    tagAr: '🎨 ليلى · ٤ سنوات',
    tagEn: '🎨 Laila · 4y',
    titleAr: 'خليه يكمل حكايته للآخر',
    titleEn: 'Imagination Fuels Emotional Intelligence',
    wisdomAr:
      'اسأل طفلك: «وبعدين حصل إيه؟» وسيبه يكمل الحكاية بطريقته. مش لازم تصحح كل تفصيلة.',
    wisdomEn:
      'When Laila shares an imaginative tale after nursery, listen with wonder—pretend play trains problem-solving.',
    imageUrl: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=700&q=80',
    borderTone: 'border-rose-500/40',
  },
  {
    id: 'gal-3',
    tagAr: '🏆 يوسف · ٨ سنوات',
    tagEn: '🏆 Youssef · 8y',
    titleAr: 'امدح المحاولة والمجهود',
    titleEn: 'Praise Effort, Not Just the Trophy',
    wisdomAr:
      'امدح المجهود المحدد: «عجبني إنك حاولت تاني». ده أوضح وأفيد من المدح العام.',
    wisdomEn:
      'Telling Youssef "I love how focused you stayed in practice today" builds resilient self-confidence.',
    imageUrl: 'https://images.unsplash.com/photo-1484820540004-14229fe36ca4?auto=format&fit=crop&w=700&q=80',
    borderTone: 'border-amber-500/40',
  },
  {
    id: 'gal-4',
    tagAr: '💚 أحمد ومريم · الأسرة',
    tagEn: '💚 Ahmad & Maryam · Family',
    titleAr: 'اتفقوا على تقسيم مسؤوليات البيت',
    titleEn: 'Calm Parents Are the Home’s Compass',
    wisdomAr:
      'قسّموا المهام واتفقوا على طريقة واحدة للتعامل مع الروتين. مش لازم كل واحد يعمل كل حاجة.',
    wisdomEn:
      'Children don’t need perfection—they thrive on the warmth they feel when Dad Ahmad and Mom Maryam team up.',
    imageUrl: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=700&q=80',
    borderTone: 'border-teal-500/40',
  },
  {
    id: 'gal-5',
    tagAr: '🌙 روتين المساء',
    tagEn: '🌙 Bedtime Rhythm',
    titleAr: 'روتين هادي قبل النوم',
    titleEn: '30 Screen-Free Minutes Before Sleep',
    wisdomAr:
      'اعملوا روتين هادي قبل النوم، وقللوا الشاشات حسب عمر الطفل وإرشادات طبيبه.',
    wisdomEn:
      'Replacing screens with warm lighting and a shared story doubles children’s deep sleep quality.',
    imageUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=700&q=80',
    borderTone: 'border-indigo-500/40',
  },
];

/**
 * Universal Home Accordion Card Wrapper (Checklist #3)
 * Wraps every section on the Home page (except the Instagram Reels player)
 * with a clean header, badge, optional header action, and an open/close arrow.
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
  nearestEvent,
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

  // Universal Accordion States for every Home section (EXCEPT the Instagram Reels player which stays always open)
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({
    welcomeAudio: false,
    quickTrack: true,
    dailyWisdom: false,
    heroesArena: false,
    aiStoryteller: false,
    dailyEssentials: false,
    batteryDiagnostic: false,
    kidsGames: false,
    wisdomGallery: false,
    platformGateways: false,
  });

  const toggleAccordion = (key: string) => {
    setOpenAccordions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const setAllAccordions = (openState: boolean) => {
    setOpenAccordions({
      welcomeAudio: true,
      quickTrack: openState,
      dailyWisdom: openState,
      heroesArena: openState,
      aiStoryteller: openState,
      dailyEssentials: openState,
      batteryDiagnostic: openState,
      kidsGames: openState,
      wisdomGallery: openState,
      platformGateways: openState,
    });
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
  // CHECKLIST #1 & #7: 30-Second Auto-Playing Time-Aware Audio Brief + Replay
  // ============================================================================
  const defaultBriefIdx = useMemo(() => {
    const idx = DAILY_AUDIO_BRIEFS_30S.findIndex((b) => b.timeBucket === currentTimeBucket);
    return idx >= 0 ? idx : 0;
  }, [currentTimeBucket]);

  const [activeBriefIdx, setActiveBriefIdx] = useState<number>(defaultBriefIdx);
  const [isPlayingBrief, setIsPlayingBrief] = useState<boolean>(false);
  const [briefElapsedSec, setBriefElapsedSec] = useState<number>(0);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const currentBrief = DAILY_AUDIO_BRIEFS_30S[activeBriefIdx] || DAILY_AUDIO_BRIEFS_30S[0];

  const playGentleAudioSynthesizer = (notesHz: number[] = [392.0, 440.0, 523.25]) => {
    try {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new Ctx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      notesHz.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.25);
        gain.gain.setValueAtTime(0.06, ctx.currentTime + idx * 0.25);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.25 + 0.22);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.25);
        osc.stop(ctx.currentTime + idx * 0.25 + 0.23);
      });
    } catch {
      // Safe fallback in headless/restricted audio environments
    }
  };

  // Read the daily tip aloud with the device's speech engine; never autoplay audio.
  const speakDailyBrief = (brief: DailyAudioBriefEpisode = currentBrief) => {
    if (!('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') {
      onShowToast?.(isEn ? 'Audio reading is not available on this device.' : 'خاصية القراءة الصوتية مش متاحة على الجهاز ده.');
      return;
    }
    window.speechSynthesis.cancel();
    const spokenText = [isEn ? brief.titleEn : brief.titleAr, isEn ? brief.summaryEn : brief.summaryAr, isEn ? brief.takeawayEn : brief.takeawayAr].join('. ');
    const utterance = new SpeechSynthesisUtterance(spokenText);
    utterance.lang = isEn ? 'en-US' : 'ar-EG';
    utterance.rate = 0.95;
    utterance.onstart = () => setIsPlayingBrief(true);
    utterance.onend = () => {
      setIsPlayingBrief(false);
      setBriefElapsedSec(30);
    };
    utterance.onerror = () => setIsPlayingBrief(false);
    setBriefElapsedSec(0);
    setIsPlayingBrief(true);
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    if (!isPlayingBrief) return;
    const interval = window.setInterval(() => setBriefElapsedSec((prev) => Math.min(30, prev + 1)), 1000);
    return () => window.clearInterval(interval);
  }, [isPlayingBrief]);

  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  const handleReplayAudioBrief = () => {
    speakDailyBrief(currentBrief);
    onShowToast?.(isEn ? '🔊 Playing the daily tip aloud' : '🔊 جاري قراءة نصيحة اليوم بصوت مسموع');
  };

  // ============================================================================
  // CHECKLIST #8: Instagram-Style Reel Video Player (< 60s, ALWAYS OPEN)
  // ============================================================================
  const [activeReelIdx, setActiveReelIdx] = useState<number>(0);
  const [isReelPlaying, setIsReelPlaying] = useState<boolean>(false);
  const [reelElapsedSec, setReelElapsedSec] = useState<number>(12);
  const [reelLikesById, setReelLikesById] = useState<Record<string, boolean>>({});

  const currentReel = HOME_INSTAGRAM_REELS[activeReelIdx] || HOME_INSTAGRAM_REELS[0];

  useEffect(() => {
    if (!isReelPlaying) return;
    const timer = window.setInterval(() => {
      setReelElapsedSec((prev) => {
        if (prev >= currentReel.durationSec) {
          return 0;
        }
        return prev + 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isReelPlaying, currentReel.durationSec]);

  const handlePrevReel = () => {
    const prevIdx = (activeReelIdx - 1 + HOME_INSTAGRAM_REELS.length) % HOME_INSTAGRAM_REELS.length;
    setActiveReelIdx(prevIdx);
    setReelElapsedSec(0);
    setIsReelPlaying(true);
    playGentleAudioSynthesizer(HOME_INSTAGRAM_REELS[prevIdx].melodyHz);
  };

  const handleNextReel = () => {
    const nextIdx = (activeReelIdx + 1) % HOME_INSTAGRAM_REELS.length;
    setActiveReelIdx(nextIdx);
    setReelElapsedSec(0);
    setIsReelPlaying(true);
    playGentleAudioSynthesizer(HOME_INSTAGRAM_REELS[nextIdx].melodyHz);
  };

  // ============================================================================
  // CHECKLIST #10: AI Storyteller Accordion (صانع الحواديت بالذكاء الاصطناعي — ~15 lines)
  // ============================================================================
  const [storyCustomTopic, setStoryCustomTopic] = useState<string>(
    'مغامرة البحث عن نجمة النوم المضيئة في حديقة البيت'
  );
  const [storySelectedMoral, setStorySelectedMoral] = useState<string>('التعاون والمحبة بين الإخوة');
  const [generatedStoryLines, setGeneratedStoryLines] = useState<string[]>(() =>
    buildFifteenLineStory(
      'مغامرة البحث عن نجمة النوم المضيئة في حديقة البيت',
      'التعاون والمحبة بين الإخوة',
      isEn
    )
  );

  function buildFifteenLineStory(topic: string, moral: string, english: boolean): string[] {
    const cleanTopic =
      sanitizeUserText(topic, 120) ||
      (english ? 'The Glowing Star Adventure' : 'مغامرة نجمة المساء المضيئة');
    const cleanMoral =
      sanitizeUserText(moral, 80) ||
      (english ? 'Sibling kindness & teamwork' : 'التعاون والمحبة بين الإخوة');

    if (english) {
      return [
        `1. As the golden evening quiet settled over the house, Dad Ahmad and Mom Maryam dimmed the warm bedroom lights.`,
        `2. Eight-year-old Youssef closed his school notebook with a proud smile after finishing his sports and homework.`,
        `3. Four-year-old Laila hugged her colorful drawing pad, still excited from her creative day at nursery.`,
        `4. In his cozy crib nearby, six-month-old baby Hamza giggled softly, waving his tiny hands at his brother and sister.`,
        `5. Tonight, a gentle magical breeze whispered the beginning of a special adventure: "${cleanTopic}".`,
        `6. Youssef wore his brave captain badge and said, "Laila, Hamza, follow me—we will solve this quest together!"`,
        `7. Laila used her magic paintbrush to draw a glowing bridge of pastel stars across the quiet night sky.`,
        `8. Baby Hamza cooed happily, and every time he smiled, a little silver firefly lit the path ahead of them.`,
        `9. Along the way, they met a sleepy little owl who needed help finding her way back to the olive tree.`,
        `10. Youssef thought carefully with his champion focus, while Laila comforted the owl with a gentle nursery song.`,
        `11. Together, they guided the little owl home, proving that "${cleanMoral}" makes every challenge easy.`,
        `12. The wise owl thanked Youssef, Laila, and baby Hamza by sprinkling soft moonlight dust over their pillows.`,
        `13. Back in their warm room, Mom Maryam tucked the soft cotton blankets around her three little heroes.`,
        `14. Dad Ahmad whispered, "We are so proud of you—tomorrow brings brand new adventures and happy discoveries."`,
        `15. Hamza closed his eyes first, followed by Laila and Youssef, drifting into a deep, peaceful, dream-filled sleep.`,
      ];
    }

    return [
      `١. حين هدأت أضواء البيت في المساء، خفّف بابا أحمد وماما مريم الإضاءة لتبدأ لحظة الدفء العائلي.`,
      `٢. أغلق البطل يوسف (٨ سنوات) حقيبته المدرسية بفخر بعد يوم مليء بالتركيز والنشاط الرياضي الجميل.`,
      `٣. وجلست ليلى المبدعة (٤ سنوات) بجانبه وهي تحتضن كراسة التلوين التي رسمت فيها نجوماً مبهجة في الحضانة.`,
      `٤. وفي سريره الصغير الدافئ، ابتسم الرضيع حمزة (٦ شهور) وبدأ يناغي بفرح حين رأى أخاه وأخته يقتربان منه.`,
      `٥. همست نسمة المساء اللطيفة لتبدأ فصول حدوتة الليلة الخاصة: «${cleanTopic}».`,
      `٦. ارتدى يوسف شارة القائد الشجاع وقال بحنان: «هيا يا ليلى وأنت يا صغيرنا حمزة، سنكتشف السر معاً!».`,
      `٧. أمسكت ليلى فرشاتها السحرية ورسمت في الخيال جسراً ملوناً من الغيوم الناعمة يربط بين غرفهم والنجوم.`,
      `٨. وكلما ضحك الصغير حمزة وحرّك يديه الصغيرتين، أضاءت فراشة ذهبية الطريق أمام يوسف وليلى.`,
      `٩. وفي منتصف الرحلة، وجدوا عصفوراً صغيراً يبحث عن عشه الدافئ قبل حلول الليل.`,
      `١٠. فكّر يوسف بذكاء الأبطال ليعرف اتجاه الشجرة، بينما غنّت ليلى للعصفور أغنية هادئة تعلمتها في الحضانة.`,
      `١١. وبفضل «${cleanMoral}»، وصل العصفور إلى عشه بسلام وعمّت السعادة قلوب الإخوة الثلاثة.`,
      `١٢. أهدت نجمة المساء ليوسف وليلى وحمزة ضوءاً هادئاً يملأ الغرفة بالسكينة والطمأنينة.`,
      `١٣. عاد الأبطال الثلاثة إلى أسرّتهم الدافئة، وغطّتهم ماما مريم بالبطانية القطنية الناعمة بحب كبير.`,
      `١٤. مسح بابا أحمد على رؤوسهم مبتسماً وقال: «فخورون بكم جداً.. غداً يوم جديد مليء بالنجاح واللعب».`,
      `١٥. أغمض حمزة عينيه أولاً في نوم عميق، وتبعته ليلى ثم يوسف، في ليلة هادئة تحرسها المحبة.`,
    ];
  }

  const master = useMaster();

  const handleGenerateCustomStory = () => {
    const lines = buildFifteenLineStory(storyCustomTopic, storySelectedMoral, isEn);
    setGeneratedStoryLines(lines);
    void master.generateBedtimeStoryForChild({
      childId: activeKidId,
      childName: activeKid?.name || 'حمزة',
      themePrompt: storyCustomTopic,
      moralFocus: storySelectedMoral,
    });
    playGentleAudioSynthesizer([392.0, 440.0, 523.25]);
    onShowToast?.(
      isEn
        ? '✨ Generated & saved custom 15-line bedtime story in library!'
        : '✨ تم تأليف وحفظ الحدوتة المخصصة (١٥ سطراً) في مكتبة حواديت الطفل!'
    );
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

  // Heroes, Passions & Life Arena (Strictly grounded in Hamza 6m, Laila 4y, Youssef 8y)
  const [cheeredHeroIds, setCheeredHeroIds] = useState<Record<string, number>>({
    'hero-hamza': 14,
    'hero-laila': 19,
    'hero-youssef': 23,
  });

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
  const activeKidId = activeKid?.id ?? 1;
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
  const activeKidStageLabel = activeKidAge?.label || (isEn ? '6 Months' : '٦ شهور');

  // Standardized Child Color Helper (Hamza = Sky, Laila = Rose, Youssef = Amber)
  const getChildColorClasses = (kidName: string, idx: number) => {
    if (kidName.includes('ليلى') || kidName.toLowerCase().includes('laila') || idx === 1) {
      return {
        pillActive: 'bg-rose-600 text-white border-rose-600 shadow-2xs',
        pillInactive: 'border-rose-500/35 text-rose-700 dark:text-rose-300 bg-rose-50/60 dark:bg-[#142430]',
        accentText: 'text-rose-600 dark:text-rose-300',
      };
    }
    if (kidName.includes('يوسف') || kidName.toLowerCase().includes('youssef') || idx === 2) {
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
    if (effectiveTimeBucket === 'morning') {
      return {
        badgeAr: '☀️ بداية اليوم · لحظة هادئة مع طفلك',
        badgeEn: '☀️ Morning Moment · A Calm Start Together',
        titleAr: 'ابدأوا اليوم بخمس دقائق من التواصل والابتسامة',
        titleEn: 'Start the Day with Five Minutes of Connection and Warm Smiles',
        bodyAr:
          'ابدأوا صباحكم بلمسة حانية لحمزة، وتشجيع ليلى على اختيار ألوان يومها في الحضانة، وتذكير يوسف بأنه بطل مسؤول في مدرسته.',
        bodyEn:
          'Start the morning with gentle cuddles for baby Hamza, let Laila pick her nursery creative goal, and empower Youssef with confidence for school.',
        quoteAr: '«الأطفال لا يحتاجون صباحاً مثالياً، بل يحتاجون صباحاً دافئاً يشعرون فيه أنهم محبوبون.»',
        quoteEn: '“Children don’t need a perfect morning; they need a warm morning where they feel deeply loved.”',
        actionLabelAr: 'تطبيق عادة الصباح الدافئ',
        actionLabelEn: 'Apply Warm Morning Habit',
        actionTaskAr: 'حضن الصباح الدافئ وتأكيد الثقة لحمزة وليلى ويوسف',
        actionTaskEn: 'Warm Morning Hug & Confidence Boost for Hamza, Laila & Youssef',
        actionTime: '07:30 ص',
      };
    }
    if (effectiveTimeBucket === 'afternoon') {
      return {
        badgeAr: '🌤️ وقت العودة · مساحة للحكي والاستماع',
        badgeEn: '🌤️ After School · Reconnect and Listen',
        titleAr: 'امنح طفلك وقتاً للحكي قبل السؤال عن الواجبات',
        titleEn: 'Warm Reconnection After School & Nursery Matters More Than Immediate Homework Questions',
        bodyAr:
          'عند عودة يوسف من المدرسة وليلى من الحضانة، امنحوهم ١٥ دقيقة استرخاء ووجبة خفيفة صحية مع وقت البطن الحسي لحمزة قبل بدء المذاكرة أو التمرين.',
        bodyEn:
          'When Youssef returns from school and Laila from nursery, give them 15 minutes of calm snack time alongside sensory tummy time with baby Hamza before homework.',
        quoteAr: '«الاتصال العاطفي قبل التوجيه التربوي يفتح قلوب الأطفال للتعاون بدون عناد.»',
        quoteEn: '“Connection before correction opens children’s hearts to joyful cooperation.”',
        actionLabelAr: 'جدولة جلسة ونس الظهيرة',
        actionLabelEn: 'Schedule Afternoon Connection',
        actionTaskAr: '١٥ دقيقة سناك وونس عائلي بعد المدرسة والحضانة بدون شاشات',
        actionTaskEn: '15-Min Screen-Free Family Snack & Reconnection',
        actionTime: '03:30 م',
      };
    }
    return {
      badgeAr: '🌙 نهاية اليوم · هدوء واستعداد للنوم',
      badgeEn: '🌙 Evening Reset · A Calmer Bedtime',
      titleAr: 'خفّفوا الإضاءة قبل النوم، وابدؤوا روتيناً هادئاً',
      titleEn: 'Dim the Lights and Begin a Calm Bedtime Routine',
      bodyAr:
        'في المساء، يتعاون أحمد ومريم لتهدئة إيقاع البيت: تدليك لطيف لحمزة، وحدوتة خيالية قصيرة لليلى، وحوار امتنان هادئ مع يوسف عن أجمل لحظة في يومه.',
      bodyEn:
        'In the evening, Ahmad and Maryam slow the home rhythm: a soothing massage for Hamza, an imaginative story for Laila, and a gratitude chat with Youssef.',
      quoteAr: '«آخر شعور ينام عليه الطفل في المساء هو أول شعور يستيقظ به في الصباح.»',
      quoteEn: '“The last feeling a child falls asleep with is the first feeling they wake up with tomorrow.”',
      actionLabelAr: 'تفعيل طقس المساء الهادئ',
      actionLabelEn: 'Schedule Calm Evening Ritual',
      actionTaskAr: 'ساعة هدوء المساء وحدوتة قبل النوم لحمزة وليلى ويوسف',
      actionTaskEn: 'Calm Evening Hour & Bedtime Story for Hamza, Laila & Youssef',
      actionTime: '08:00 م',
    };
  }, [effectiveTimeBucket]);

  // Live Children Names & Ages from Supabase `children` table via `state.kids`
  const liveKidHamza = state.kids.find((k) => k.id === 1) || state.kids[0];
  const liveKidLaila = state.kids.find((k) => k.id === 2) || state.kids[1] || state.kids[0];
  const liveKidYoussef = state.kids.find((k) => k.id === 3) || state.kids[2] || state.kids[0];

  const liveHamzaNameAr = liveKidHamza ? locText(liveKidHamza.name, 'ar') : 'حمزة';
  const liveHamzaNameEn = liveKidHamza ? locText(liveKidHamza.name, 'en') : 'Hamza';
  const liveHamzaAgeAr = liveKidHamza ? calculateChildAge(liveKidHamza.birth, 'ar').label : '٦ شهور';
  const liveHamzaAgeEn = liveKidHamza ? calculateChildAge(liveKidHamza.birth, 'en').label : '6 Months';

  const liveLailaNameAr = liveKidLaila ? locText(liveKidLaila.name, 'ar') : 'ليلى';
  const liveLailaNameEn = liveKidLaila ? locText(liveKidLaila.name, 'en') : 'Laila';
  const liveLailaAgeAr = liveKidLaila ? calculateChildAge(liveKidLaila.birth, 'ar').label : '٤ سنوات';
  const liveLailaAgeEn = liveKidLaila ? calculateChildAge(liveKidLaila.birth, 'en').label : '4 Years';

  const liveYoussefNameAr = liveKidYoussef ? locText(liveKidYoussef.name, 'ar') : 'يوسف';
  const liveYoussefNameEn = liveKidYoussef ? locText(liveKidYoussef.name, 'en') : 'Youssef';
  const liveYoussefAgeAr = liveKidYoussef ? calculateChildAge(liveKidYoussef.birth, 'ar').label : '٨ سنوات';
  const liveYoussefAgeEn = liveKidYoussef ? calculateChildAge(liveKidYoussef.birth, 'en').label : '8 Years';

  // Heroes, Passions & Life Arena (Dynamically bound to live Supabase `children` rows)
  const heroesPassionsFeed = useMemo(
    () => [
      {
        id: 'hero-hamza',
        kidId: liveKidHamza?.id ?? 1,
        nameAr: `${liveHamzaNameAr} · ${liveHamzaAgeAr}`,
        nameEn: `${liveHamzaNameEn} · ${liveHamzaAgeEn}`,
        arenaBadgeAr: '👶🏻 عالم الرضيع الحسي والحركي',
        arenaBadgeEn: '👶🏻 Infant Sensory & Motor World',
        accentBorder: 'border-sky-500/45',
        accentBg: 'bg-sky-500/12 text-sky-700 dark:text-sky-300',
        progressBarClass: 'from-sky-500 to-teal-500',
        titleAr: 'محطة الأسبوع: مهارات الحركة والاستكشاف وتجربة أطعمة جديدة',
        titleEn: 'This Week: Movement, Exploration and New Food Experiences',
        passionTagsAr: ['وقت البطن', 'الألعاب الخشبية الحسية', 'المناغاة والابتسامة'],
        passionTagsEn: ['Tummy Time', 'Sensory Wooden Rattle', 'Joyful Babbling'],
        nextGoalAr: '🎯 الهدف القادم: الجلوس المستقل لمدة ٣٠ ثانية + فحص تطعيم الـ ٦ شهور',
        nextGoalEn: '🎯 Next Goal: 30s Independent Sitting + 6-Month Pediatric Checkup',
        routineTaskAr: `١٥ دقيقة تمرين وقت البطن وتتبع بصري لـ ${liveHamzaNameAr}`,
        routineTaskEn: `15-Min Tummy Time & Visual Tracking with ${liveHamzaNameEn}`,
        routineTime: '01:30 م',
      },
      {
        id: 'hero-laila',
        kidId: liveKidLaila?.id ?? 2,
        nameAr: `${liveLailaNameAr} · ${liveLailaAgeAr}`,
        nameEn: `${liveLailaNameEn} · ${liveLailaAgeEn}`,
        arenaBadgeAr: '🎨 عالم الإبداع والحضانة والخيال',
        arenaBadgeEn: '🎨 Nursery, Art & Creative World',
        accentBorder: 'border-rose-500/45',
        accentBg: 'bg-rose-500/12 text-rose-700 dark:text-rose-300',
        progressBarClass: 'from-rose-500 to-pink-500',
        titleAr: 'لحظة إبداع: الرسم والتعبير عن المشاعر',
        titleEn: 'Creative Moment: Art and Naming Feelings',
        passionTagsAr: ['التلوين المائي والصلصال', 'أناشيد الحضانة', 'القصص المصورة'],
        passionTagsEn: ['Watercolors & Clay', 'Nursery Rhymes', 'Picture Stories'],
        nextGoalAr: '🎯 الهدف القادم: ترتيب ركن الألوان بنفسها + مشاركة أصدقائها في الحضانة',
        nextGoalEn: '🎯 Next Goal: Tidying Art Corner Independently + Sharing at Nursery',
        routineTaskAr: `جلسة تلوين وبطاقات تسمية المشاعر مع ${liveLailaNameAr}`,
        routineTaskEn: `Watercolor Art & Emotion Cards Session with ${liveLailaNameEn}`,
        routineTime: '04:30 م',
      },
      {
        id: 'hero-youssef',
        kidId: liveKidYoussef?.id ?? 3,
        nameAr: `${liveYoussefNameAr} · ${liveYoussefAgeAr}`,
        nameEn: `${liveYoussefNameEn} · ${liveYoussefAgeEn}`,
        arenaBadgeAr: '🏆 عالم الأبطال والمدرسة والرياضة',
        arenaBadgeEn: '🏆 School, Sports & Champions Arena',
        accentBorder: 'border-amber-500/45',
        accentBg: 'bg-amber-500/12 text-amber-800 dark:text-amber-300',
        progressBarClass: 'from-amber-500 to-teal-600',
        titleAr: 'إنجاز الأسبوع: تجربة علمية ونشاط رياضي',
        titleEn: 'This Week’s Wins: A Science Project and Active Play',
        passionTagsAr: ['السباحة وكرة القدم', 'ألغاز الذكاء والمنطق', 'تجارب العلوم والفضاء'],
        passionTagsEn: ['Swimming & Football', 'Logic & Chess Puzzles', 'Space & Science'],
        nextGoalAr: '🎯 الهدف القادم: شارة القراءة الأسبوعية + تحدي اللياقة العائلي يوم الجمعة',
        nextGoalEn: '🎯 Next Goal: Weekly Reading Badge + Friday Family Fitness Challenge',
        routineTaskAr: `٤٠ دقيقة تمرين رياضي وتفريغ طاقة لـ ${liveYoussefNameAr}`,
        routineTaskEn: `40-Min Sports Practice & Energy Session for ${liveYoussefNameEn}`,
        routineTime: '05:00 م',
      },
    ],
    [
      liveKidHamza?.id,
      liveHamzaNameAr,
      liveHamzaNameEn,
      liveHamzaAgeAr,
      liveHamzaAgeEn,
      liveKidLaila?.id,
      liveLailaNameAr,
      liveLailaNameEn,
      liveLailaAgeAr,
      liveLailaAgeEn,
      liveKidYoussef?.id,
      liveYoussefNameAr,
      liveYoussefNameEn,
      liveYoussefAgeAr,
      liveYoussefAgeEn,
    ]
  );

  // Stage-Tailored Nutrition & Lunchbox Data
  const nutritionPlans = useMemo(() => {
    const stageCode = activeKidAge?.stageCode || '0-2';
    if (stageCode === '0-2') {
      return {
        breakfast: {
          badgeAr: '🍼 رضاعة صباحية + فيتامين D للرضيع',
          badgeEn: '🍼 Morning Feed & Infant Vitamin D',
          titleAr: `رضعة الصباح الدافئة + نقط فيتامين د لـ ${activeKidName}`,
          titleEn: `Warm Morning Milk Feed + Vitamin D Drops for ${activeKidName}`,
          descAr: 'تغذية أساسية متكاملة لعمر ٦ شهور لدعم المناعة ونمو العظام الصحي.',
          descEn: 'Essential 6-month infant nutrition supporting immunity and bone growth.',
          time: '08:00 ص',
          calories: '180 kcal',
        },
        lunchbox: {
          badgeAr: '🥕 أول وجبة خضار مهروس طازج',
          badgeEn: '🥕 First Veggie Puree Meal',
          titleAr: `مهروس الجزر والبطاطا الحلوة والكوسة بالبخار لـ ${activeKidName}`,
          titleEn: `Steamed Carrot, Sweet Potato & Zucchini Puree for ${activeKidName}`,
          descAr: 'قوام كريمي ناعم غني بفيتامين A والبيتا كاروتين بدون ملح أو سكر مضاف.',
          descEn: 'Silky steamed puree rich in beta-carotene with zero added salt or sugar.',
          time: '12:30 م',
          calories: '140 kcal',
        },
        snack: {
          badgeAr: '🍎 مهروس الفواكه المسائي الهادئ',
          badgeEn: '🍎 Gentle Evening Fruit Puree',
          titleAr: `مهروس التفاح المطهو على البخار مع الكمثرى لـ ${activeKidName}`,
          titleEn: `Steamed Apple & Pear Smooth Puree for ${activeKidName}`,
          descAr: 'مريح للمعدة قبل روتين المساء ويساعد على نوم ليلي هادئ بدون مغص.',
          descEn: 'Soothing on the tummy before bedtime to support peaceful infant sleep.',
          time: '04:30 م',
          calories: '110 kcal',
        },
      };
    }

    if (stageCode === '5-8') {
      return {
        breakfast: {
          badgeAr: '🥣 فطور التركيز والاستقلالية للمدرسة',
          badgeEn: '🥣 School Brain & Focus Breakfast',
          titleAr: `بيض أومليت بالخضار + توست حبوب كاملة وحليب لـ ${activeKidName}`,
          titleEn: `Veggie Omelet + Whole-Grain Toast & Milk for ${activeKidName}`,
          descAr: 'بروتين عالي وكربوهيدرات معقدة تمنح يوسف تركيزاً ذهنياً طوال الحصص الدراسية.',
          descEn: 'Sustained protein and complex carbs fueling school focus and logic.',
          time: '06:45 ص',
          calories: '420 kcal',
        },
        lunchbox: {
          badgeAr: '🍱 لانش بوكس الأبطال للمدرسة',
          badgeEn: '🍱 School Champion Lunchbox',
          titleAr: `ساندويتش دجاج مشوي + خيار وجزر + تفاح ومكسرات لـ ${activeKidName}`,
          titleEn: `Grilled Chicken Wrap + Veggie Sticks, Apple & Nuts for ${activeKidName}`,
          descAr: 'وجبة متوازنة يشارك يوسف في تحضيرها بنفسه لتعزيز الاستقلالية والمسؤولية.',
          descEn: 'Balanced school lunchbox encouraging self-prep and afternoon energy.',
          time: '11:30 ص',
          calories: '490 kcal',
        },
        snack: {
          badgeAr: '🍌 سناك الطاقة قبل التمرين والمذاكرة',
          badgeEn: '🍌 Pre-Sport & Homework Boost Snack',
          titleAr: `زبادي يوناني بالعسل والموز والشوفان لـ ${activeKidName}`,
          titleEn: `Greek Yogurt with Honey, Banana & Oats for ${activeKidName}`,
          descAr: 'يجدد نشاط الدماغ بعد المدرسة مباشرة قبل بدء وقت الواجبات أو تمرين السباحة.',
          descEn: 'Recharges brain focus after school right before homework or swimming.',
          time: '04:00 م',
          calories: '280 kcal',
        },
      };
    }

    return {
      breakfast: {
        badgeAr: '🥣 فطور الطاقة المبهج للحضانة',
        badgeEn: '🥣 Joyful Nursery Breakfast',
        titleAr: `بان كيك الشوفان والموز بأشكال مرحة مع الحليب لـ ${activeKidName}`,
        titleEn: `Playful Banana Oat Pancakes & Warm Milk for ${activeKidName}`,
        descAr: 'فطور ملون يشجع ليلى على الأكل بنفسها وبداية يوم الحضانة بابتسامة.',
        descEn: 'Fun finger-food breakfast boosting happy nursery transitions.',
        time: '07:45 ص',
        calories: '310 kcal',
      },
      lunchbox: {
        badgeAr: '🍱 لانش بوكس الحضانة الملون',
        badgeEn: '🍱 Colorful Nursery Lunchbox',
        titleAr: `رول التورتيلا بالجبن الكريمي + خيار على شكل نجوم وفراولة لـ ${activeKidName}`,
        titleEn: `Cream Cheese Pinwheels + Star Cucumbers & Berries for ${activeKidName}`,
        descAr: 'مقسم بألوان مبهجة تفتح الشهية في الحضانة بدون سكريات مصنعة.',
        descEn: 'Bite-sized colorful sections easy for 4-year-old hands at nursery.',
        time: '11:30 ص',
        calories: '360 kcal',
      },
      snack: {
        badgeAr: '🍎 سناك الإبداع والهدوء بعد الحضانة',
        badgeEn: '🍎 Post-Nursery Creative Snack',
        titleAr: `شرائح التفاح بزبدة الفول السوداني الطبيعية والزبادي لـ ${activeKidName}`,
        titleEn: `Apple Slices with Natural Peanut Butter & Yogurt for ${activeKidName}`,
        descAr: 'يمنح ليلى طاقة هادئة ومستقرة قبل جلسة التلوين وبطاقات تسمية المشاعر.',
        descEn: 'Steadies afternoon mood before creative play and emotion-naming cards.',
        time: '03:45 م',
        calories: '210 kcal',
      },
    };
  }, [activeKidAge?.stageCode, activeKidName]);

  const currentNutrition = nutritionPlans[selectedMealSlot];

  const targetWaterCups =
    activeKidAge && activeKidAge.months < 12
      ? 2
      : activeKidAge && activeKidAge.years < 5
      ? 5
      : 7;
  const currentWaterCups = waterCupsByKid[activeKidId] ?? 0;
  const waterProgressPct = Math.min(100, Math.round((currentWaterCups / targetWaterCups) * 100));

  const handleAdjustWater = async (delta: number) => {
    const current = waterCupsByKid[activeKidId] ?? 0;
    const next = Math.max(0, Math.min(10, current + delta));
    if (next === current || !activeKid) return;
    const saved = await saveDashboardChildLog(
      'nutrition',
      delta > 0 ? 'تسجيل شرب الماء' : 'تصحيح تسجيل شرب الماء',
      { dashboardKind: 'hydration', cups: delta }
    );
    if (!saved) return;
    setWaterCupsByKid((prev) => ({ ...prev, [activeKidId]: next }));
    if (delta > 0 && next >= targetWaterCups) {
      onShowToast?.(
        isEn
          ? `🎉 Bravo! ${activeKidName} reached today's hydration goal (${targetWaterCups} cups)!`
          : `🎉 برافو! وصل ${activeKidName} لهدف شرب المياه اليومي (${targetWaterCups} أكواب)!`
      );
    }
  };

  const sportActivities = useMemo(() => {
    const stageCode = activeKidAge?.stageCode || '0-2';
    if (stageCode === '0-2') {
      return {
        outdoor: {
          badgeAr: '👶🏻 تمرين وقت البطن الحسي',
          badgeEn: '👶🏻 Guided Tummy Time & Reach',
          titleAr: `١٥ دقيقة تمرين وقت البطن على سجادة اللعب الحسية لـ ${activeKidName}`,
          titleEn: `15-Min Sensory Mat Tummy Time & Toy Reach for ${activeKidName}`,
          descAr: 'يقوّي عضلات الرقبة والأكتاف والظهر ويمهّد لمرحلة الجلوس والحبي بأمان.',
          descEn: 'Strengthens neck, shoulder, and core muscles preparing for sitting & crawling.',
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
          descAr: 'يريح الجهاز الهضمي من الغازات ويهيئ حمزة لنوم ليلي عميق ومستقر.',
          descEn: 'Relieves tummy gas and cues deep, restorative nighttime sleep.',
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
          titleAr: `٢٥ دقيقة ركوب دراجة أو تحدي قفز الحبل مع بابا أحمد لـ ${activeKidName}`,
          titleEn: `25-Min Bike Ride or Jump-Rope Challenge with Dad Ahmed for ${activeKidName}`,
          descAr: 'نشاط مشترك يقوّي علاقة الأب بالابن الأكبر ويضمن نوماً صحياً مبكراً.',
          descEn: 'Active father-son bonding that guarantees restful sleep.',
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
        descAr: 'يدمج الحركة بتسمية الألوان والمشاعر لتفريغ طاقة ليلى بعد الحضانة بمرح.',
        descEn: 'Combines gross motor hopping with color and emotion naming after nursery.',
        time: '04:30 م',
      },
      balance: {
        badgeAr: '🧘‍♀️ يوجا الأطفال وتهدئة المشاعر',
        badgeEn: '🧘‍♀️ Kids Yoga & Emotion Breathing',
        titleAr: `١٥ دقيقة تمارين تنفس الفراشة وتوازن الشجرة مع بطاقات المشاعر لـ ${activeKidName}`,
        titleEn: `15-Min Butterfly Breathing & Tree Pose with Emotion Cards for ${activeKidName}`,
        descAr: 'تدرّب ليلى على تهدئة النفس عند الإحباط والتعبير بالكلمات بدلاً من البكاء.',
        descEn: 'Teaches self-regulation and calm emotional expression without tantrums.',
        time: '05:15 م',
      },
      cardio: {
        badgeAr: '💃 رقص وحركة إيقاعية مبهجة',
        badgeEn: '💃 Musical Freeze Dance & Agility',
        titleAr: `١٥ دقيقة لعبة الحركة والتوقف الموسيقية مع ماما مريم لـ ${activeKidName}`,
        titleEn: `15-Min Musical Freeze Dance with Mom Maryam for ${activeKidName}`,
        descAr: 'تقوّي التحكم في الاندفاع والانتباه السمعي وتملأ البيت بالضحك.',
        descEn: 'Boosts impulse control, listening skills, and joyful mother-daughter bonding.',
        time: '06:00 م',
      },
    };
  }, [activeKidAge?.stageCode, activeKidName]);

  const currentSport = sportActivities[selectedSportSlot];
  const isSportDoneToday = Boolean(completedSportByKid[activeKidId]);

  // Personalized Active Parent Profile Details from live `state.parentAccounts` (fetched from Supabase `users` table)
  const isMotherActive =
    state.activeParentAccount === 'mother' ||
    state.role === 'mom' ||
    parentProfileSpec.role === 'mom';

  const fatherShortAr =
    (state.parentAccounts.father?.fullName || 'أحمد').replace(/\s*\(.*?\)\s*/g, '').trim() || 'أحمد';
  const motherShortAr =
    (state.parentAccounts.mother?.fullName || 'مريم').replace(/\s*\(.*?\)\s*/g, '').trim() || 'مريم';

  const activeParentNameAr = isMotherActive ? motherShortAr : fatherShortAr;
  const activeParentNameEn = isMotherActive ? locText(motherShortAr, 'en') : locText(fatherShortAr, 'en');
  const partnerParentNameAr = isMotherActive ? fatherShortAr : motherShortAr;
  const partnerParentNameEn = isMotherActive ? locText(fatherShortAr, 'en') : locText(motherShortAr, 'en');

  return (
    <section
      dir={isEn ? 'ltr' : 'rtl'}
      className="space-y-4 sm:space-y-5"
      aria-label={isEn ? 'Nekbaar Family Home Dashboard' : 'لوحة العائلة الرئيسية — نكبر'}
    >
      {/* =====================================================================
          1. ACCORDION: PERSONALIZED WELCOME & 30S VOICE MESSAGE CARD (BUG FIXED)
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
                    ? `👩🏻‍🍼 Active Profile: Mom ${activeParentNameEn}`
                    : `👩🏻‍🍼 الحساب النشط: ماما ${activeParentNameAr}`
                  : isEn
                  ? `👨🏻‍🍼 Active Profile: Dad ${activeParentNameEn}`
                  : `👨🏻‍🍼 الحساب النشط: بابا ${activeParentNameAr}`}
              </span>
              <span className="text-[#0d9488] dark:text-[#2DD4BF]">📍 {localizedCity}</span>
              <span className="text-xs text-gray-500 dark:text-[#94A3B8]">
                · {isEn ? `Synced with ${partnerParentNameEn}` : `متصل مع ${partnerParentNameAr}`}
              </span>
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
                : `أهلاً يا ${activeParentNameAr} 👋 خلّينا نرتّب يومكم ونركز على اللي يهم طفلك.`}
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

        <div data-testid="home-family-shortcuts" className="rounded-2xl border border-teal-500/20 bg-gradient-to-br from-teal-50 via-white to-sky-50 dark:from-[#142430] dark:via-[#101D26] dark:to-[#142430] p-3.5 sm:p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-black text-[var(--color-text)] dark:text-white">{isEn ? 'What would you like to do now?' : 'تحتاج تتابع إيه دلوقتي؟'}</h2>
              <p className="mt-0.5 text-[11px] font-semibold text-[var(--color-muted)]">{isEn ? 'Your family’s most-used actions, one tap away.' : 'أهم المهام اليومية للأسرة في متناول إيدك.'}</p>
            </div>
            <span className="rounded-xl bg-white/80 dark:bg-[#0B131A] px-2.5 py-1.5 text-[10px] font-black text-teal-700 dark:text-teal-300">{isEn ? 'QUICK ACCESS' : 'وصول سريع'}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              { id: 'routine' as const, icon: ListChecks, titleAr: 'روتين اليوم', titleEn: 'Today’s routine', detailAr: `${completedTasksCount} مهام منجزة`, detailEn: `${completedTasksCount} tasks completed`, tone: 'teal' },
              { id: 'calendar' as const, icon: CalendarDays, titleAr: 'المواعيد والتقويم', titleEn: 'Calendar & events', detailAr: 'مواعيد الأسرة والتذكيرات', detailEn: 'Family events & reminders', tone: 'sky' },
              { id: 'children' as const, icon: Baby, titleAr: 'ملفات الأطفال', titleEn: 'Children profiles', detailAr: 'النمو والاهتمامات والذكريات', detailEn: 'Growth, interests & memories', tone: 'rose' },
              { id: 'medical' as const, icon: HeartPulse, titleAr: 'الصحة والمتابعة', titleEn: 'Health & care', detailAr: 'السجل الصحي والتنبيهات', detailEn: 'Health records & alerts', tone: 'amber' },
              { id: 'services' as const, icon: ShoppingBag, titleAr: 'المتجر والخدمات', titleEn: 'Store & services', detailAr: cartItemCount > 0 ? `${cartItemCount} منتجات في السلة` : 'منتجات وخدمات الأسرة', detailEn: cartItemCount > 0 ? `${cartItemCount} items in cart` : 'Family products & services', tone: 'violet' },
            ].map((action) => (
              <button key={action.id} type="button" onClick={() => navigateTo(action.id)} className="min-h-[88px] rounded-xl border border-white/90 dark:border-[#1E3646] bg-white/90 dark:bg-[#101D26] p-3 text-start shadow-sm transition-all hover:-translate-y-0.5 hover:border-teal-400 active:scale-[.98]">
                <span className={`mb-2 grid h-9 w-9 place-items-center rounded-xl ${action.tone === 'teal' ? 'bg-teal-100 text-teal-800' : action.tone === 'sky' ? 'bg-sky-100 text-sky-800' : action.tone === 'rose' ? 'bg-rose-100 text-rose-800' : action.tone === 'amber' ? 'bg-amber-100 text-amber-800' : 'bg-violet-100 text-violet-800'}`}><action.icon size={18} strokeWidth={2.2} /></span>
                <span className="block text-xs font-black text-[var(--color-text)] dark:text-white">{isEn ? action.titleEn : action.titleAr}</span>
                <span className="mt-1 block text-[10px] font-semibold text-[var(--color-muted)]">{isEn ? action.detailEn : action.detailAr}</span>
              </button>
            ))}
          </div>
        </div>

        {/* =====================================================================
            CHECKLIST #1 & #7: BUG-FREE HORIZONTAL RTL VOICE MESSAGE CARD (30S)
            Full-width stacked layout prevents any vertical letter-by-letter wrapping!
            ===================================================================== */}
        {openAccordions.welcomeAudio && (
          <div
            id="home-audio-brief-podcast-player"
            data-testid="home-audio-brief-podcast-player"
            dir={isEn ? 'ltr' : 'rtl'}
            className="w-full rounded-2xl sm:rounded-3xl border border-teal-500/35 dark:border-[#1E3646] bg-gradient-to-r from-teal-50/90 via-white to-orange-50/60 dark:from-[#142430] dark:via-[#101D26] dark:to-[#142430] p-4 sm:p-5 flex flex-col gap-3.5 shadow-2xs"
          >
            {/* Row 1: Play Button + Full-Width Natural Horizontal Arabic Title & Slot Badge */}
            <div className="flex items-start gap-3.5 w-full">
              <button
                type="button"
                data-testid="audio-brief-play-toggle"
                onClick={() => {
                  if (isPlayingBrief) {
                    window.speechSynthesis?.pause();
                    setIsPlayingBrief(false);
                  } else if (window.speechSynthesis?.paused) {
                    window.speechSynthesis.resume();
                    setIsPlayingBrief(true);
                  } else {
                    speakDailyBrief(currentBrief);
                  }
                }}
                aria-label={
                  isPlayingBrief
                    ? isEn
                      ? 'Pause audio brief'
                      : 'إيقاف الرسالة الصوتية'
                    : isEn
                    ? 'Play audio brief'
                    : 'تشغيل الرسالة الصوتية'
                }
                className={`w-12 h-12 rounded-2xl flex items-center justify-center text-base font-black shrink-0 transition-all cursor-pointer shadow-xs ${
                  isPlayingBrief
                    ? 'bg-[#FF8C61] text-white scale-105'
                    : 'bg-[#0d9488] hover:bg-[#0f766e] text-white'
                }`}
              >
                {isPlayingBrief ? '⏸' : '▶'}
              </button>

              <div className="flex-1 min-w-0 w-full space-y-1 text-start">
                <div className="flex flex-wrap items-center gap-2 text-xs font-extrabold text-[#0d9488] dark:text-[#2DD4BF]">
                  <span className="inline-block whitespace-normal">
                    🔊 {isEn ? currentBrief.slotLabelEn : currentBrief.slotLabelAr}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="text-[var(--color-muted)] dark:text-[#94A3B8] whitespace-normal">
                    {isEn ? currentBrief.hostsEn : currentBrief.hostsAr}
                  </span>
                </div>
                <h2 className="text-sm sm:text-base font-black text-[var(--color-text)] dark:text-[#F8FAFC] leading-relaxed whitespace-normal">
                  {isEn ? currentBrief.titleEn : currentBrief.titleAr}
                </h2>
              </div>
            </div>

            {/* Row 2: Full-Width Progress Bar */}
            <div className="w-full h-2 rounded-full bg-teal-950/10 dark:bg-[#0B131A] overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#0d9488] to-[#FF8C61] transition-all duration-300"
                style={{ width: `${Math.min(100, Math.round((briefElapsedSec / 30) * 100))}%` }}
              />
            </div>

            {/* Row 3: Unobstructed Controls Bar (Waveform + 30s Timer + Replay Button + Next Period Button) */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 w-full">
              <div className="flex items-center gap-2">
                <div
                  data-testid="audio-brief-waveforms"
                  aria-hidden="true"
                  className="flex items-center gap-1 h-7 px-2.5 rounded-2xl bg-teal-500/8 dark:bg-[#0B131A]/60 border border-teal-500/15"
                >
                  {[10, 18, 13, 22, 15, 24, 12, 19, 14, 21, 11, 16].map((barH, idx) => {
                    const activeBar = Math.floor((briefElapsedSec / 30) * 12);
                    const isPassed = idx <= activeBar;
                    return (
                      <span
                        key={idx}
                        style={{
                          height: isPlayingBrief
                            ? `${Math.max(6, ((barH + ((briefElapsedSec + idx * 3) % 9)) % 22) + 4)}px`
                            : `${Math.round(barH * 0.72)}px`,
                        }}
                        className={`w-1 rounded-full transition-all duration-300 ${
                          isPlayingBrief
                            ? idx % 2 === 0
                              ? 'bg-[#0d9488] dark:bg-[#2DD4BF]'
                              : 'bg-[#FF8C61]'
                            : isPassed
                            ? 'bg-[#0d9488]/80 dark:bg-[#2DD4BF]/80'
                            : 'bg-teal-900/20 dark:bg-teal-100/20'
                        }`}
                      />
                    );
                  })}
                </div>

                <span
                  dir="ltr"
                  className="text-xs font-black tabular-nums text-[#0d9488] dark:text-[#2DD4BF] px-2.5 py-1 rounded-xl bg-teal-500/10"
                >
                  00:{String(briefElapsedSec).padStart(2, '0')} / {currentBrief.durationLabel}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  id="audio-brief-replay-btn"
                  data-testid="audio-brief-replay-btn"
                  onClick={handleReplayAudioBrief}
                  className="min-h-[38px] px-3.5 py-1.5 rounded-2xl border border-[#0d9488]/40 bg-teal-500/12 hover:bg-[#0d9488] hover:text-white text-xs font-extrabold text-[#0d9488] dark:text-[#2DD4BF] transition-all cursor-pointer inline-flex items-center gap-1.5"
                >
                  <span>🔄</span>
                  <span>{isEn ? 'Listen again' : 'اسمع تاني'}</span>
                </button>

                <button
                  type="button"
                  data-testid="audio-brief-next-btn"
                  onClick={() => {
                    const nextIdx = (activeBriefIdx + 1) % DAILY_AUDIO_BRIEFS_30S.length;
                    setActiveBriefIdx(nextIdx);
                    setBriefElapsedSec(0);
                    setIsPlayingBrief(true);
                    speakDailyBrief(DAILY_AUDIO_BRIEFS_30S[nextIdx]);
                  }}
                  className="min-h-[38px] px-3.5 py-1.5 rounded-2xl border border-[var(--color-border)] dark:border-[#1E3646] bg-white/90 dark:bg-[#101D26] hover:border-[#0d9488] text-xs font-extrabold text-[var(--color-text)] dark:text-[#F8FAFC] cursor-pointer"
                >
                  {isEn ? 'Next tip ⏭' : 'النصيحة التالية ⏭'}
                </button>
              </div>
            </div>

            {/* Row 4: Full-Width Horizontal Summary & Takeaway */}
            <p className="w-full text-xs sm:text-[13px] font-semibold text-[var(--color-muted)] dark:text-[#CBD5E1] leading-relaxed text-start whitespace-normal">
              {isEn ? currentBrief.summaryEn : currentBrief.summaryAr}{' '}
              <strong className="text-[var(--color-text)] dark:text-[#F8FAFC]">
                {isEn ? currentBrief.takeawayEn : currentBrief.takeawayAr}
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
                  ? '🔊 Hide Audio Tip'
                  : '🔊 إخفاء الرسالة الصوتية'
                : isEn
                ? '🔊 Show Audio Tip'
                : '🔊 إظهار الرسالة الصوتية'}
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
          <span className="shrink-0 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] font-extrabold text-teal-100">{isEn ? 'INTERNAL ONLY' : 'محتوى داخلي'}</span>
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
            { id: 'children' as const, image: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=700&q=80', titleAr: 'اسأل عن إحساسه', titleEn: 'Name the feeling', bodyAr: 'بدل «مالك؟»، جرّب «إيه أكتر حاجة فرّحتك أو ضايقتك النهارده؟» واسمع للآخر.', bodyEn: 'Try “What made you happy or upset today?” — then listen without rushing to fix it.', ctaAr: 'افتح ملف الطفل', ctaEn: 'Open child profile' },
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
                <button type="button" onClick={() => navigateTo(idea.id)} className="min-h-10 w-full rounded-xl bg-teal-700 px-3 py-2 text-xs font-extrabold text-white transition-colors hover:bg-teal-800">{isEn ? idea.ctaEn : idea.ctaAr} ←</button>
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
            ? `Log sleep, meal, mood & care for ${activeKidName} in one tap`
            : `سجّل النوم، الوجبة، المزاج، والرعاية الصحية لـ ${activeKidName} بلمسة واحدة`
        }
        badgeText={`${activeKidName} · ${activeKidStageLabel}`}
        isOpen={Boolean(openAccordions.quickTrack)}
        onToggle={() => toggleAccordion('quickTrack')}
        isEn={isEn}
      >
        <div className="space-y-3">
          {/* Clean Child Selector Strip */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-extrabold text-[var(--color-muted)] dark:text-[#94A3B8]">
              {isEn ? 'Select Child:' : 'اختر الطفل:'}
            </span>
            <div className="inline-flex flex-wrap items-center gap-1.5">
              {state.kids.map((kid, idx) => {
                const isActive = idx === selectedKidIdx;
                const cTone = getChildColorClasses(kid.name, idx);
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
              const moodCycle = ['😊', '🥰', '😴', '🎨', '🏆'];
              const loggedCount = Number(pulse.sleepLogged) + Number(pulse.mealLogged) + Number(pulse.careLogged);
              const progressPercent = Math.round((loggedCount / 3) * 100);
              return (
                <>
                  <div className="col-span-2 sm:col-span-4 rounded-2xl border border-teal-500/20 bg-gradient-to-r from-teal-50 to-sky-50 dark:from-[#142B35] dark:to-[#142430] p-3.5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-black text-[var(--color-text)] dark:text-white">{isEn ? activeKidName + '’s daily log' : 'ملخص يوم ' + activeKidName}</p>
                        <p className="mt-1 text-[10px] font-semibold text-[var(--color-muted)]">{isEn ? 'Sleep, meals and care — saved to the child profile.' : 'النوم والوجبات والرعاية.. محفوظة في ملف الطفل.'}</p>
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
                    onClick={() => {
                      if (pulse.sleepLogged) return;
                      void saveDashboardChildLog('sleep_log', 'تسجيل النوم أو القيلولة').then((saved) => {
                        if (!saved) return;
                        setQuickPulseByKid((prev) => ({
                          ...prev,
                          [activeKidId]: { ...pulse, sleepLogged: true },
                        }));
                        onShowToast?.(isEn ? `🌙 ${activeKidName}: sleep logged and saved ✓` : `🌙 تم حفظ سجل نوم ${activeKidName} بنجاح ✓`);
                      });
                    }}
                    className={`min-h-[48px] px-3.5 py-2.5 rounded-2xl border flex items-center justify-between gap-2 text-xs font-extrabold transition-all active:scale-95 cursor-pointer ${
                      pulse.sleepLogged
                        ? 'border-indigo-500/40 bg-indigo-500/15 text-indigo-900 dark:text-indigo-200'
                        : 'border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-muted)]/40 dark:bg-[#142430] text-[var(--color-text)] dark:text-[#F8FAFC]'
                    }`}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <span>🌙</span>
                      <span>{isEn ? 'Sleep / Nap' : 'نوم / قيلولة'}</span>
                    </span>
                    <span className="text-[11px] font-black">{pulse.sleepLogged ? '✓' : '+'}</span>
                  </button>

                  <button
                    type="button"
                    data-testid="quick-pulse-meal-btn"
                    onClick={() => {
                      if (pulse.mealLogged) return;
                      void saveDashboardChildLog('nutrition', 'تسجيل وجبة أو رضعة', { dashboardKind: 'meal' }).then((saved) => {
                        if (!saved) return;
                        setQuickPulseByKid((prev) => ({
                          ...prev,
                          [activeKidId]: { ...pulse, mealLogged: true },
                        }));
                        onShowToast?.(isEn ? `🥣 ${activeKidName}: meal saved ✓` : `🥣 تم حفظ سجل وجبة ${activeKidName} بنجاح ✓`);
                      });
                    }}
                    className={`min-h-[48px] px-3.5 py-2.5 rounded-2xl border flex items-center justify-between gap-2 text-xs font-extrabold transition-all active:scale-95 cursor-pointer ${
                      pulse.mealLogged
                        ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-900 dark:text-emerald-200'
                        : 'border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-muted)]/40 dark:bg-[#142430] text-[var(--color-text)] dark:text-[#F8FAFC]'
                    }`}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <span>🥣</span>
                      <span>{isEn ? 'Meal / Feed' : 'وجبة / رضعة'}</span>
                    </span>
                    <span className="text-[11px] font-black">{pulse.mealLogged ? '✓' : '+'}</span>
                  </button>

                  <button
                    type="button"
                    data-testid="quick-pulse-mood-btn"
                    onClick={() => {
                      const nextEmoji =
                        moodCycle[(moodCycle.indexOf(pulse.moodEmoji) + 1) % moodCycle.length];
                      void saveDashboardChildLog('emotional_social', 'تسجيل الحالة المزاجية', { moodEmoji: nextEmoji }).then((saved) => {
                        if (!saved) return;
                        setQuickPulseByKid((prev) => ({
                          ...prev,
                          [activeKidId]: { ...pulse, moodEmoji: nextEmoji },
                        }));
                        onShowToast?.(isEn ? `💛 ${activeKidName}’s mood saved as ${nextEmoji}` : `💛 تم حفظ مزاج ${activeKidName} اليوم: ${nextEmoji}`);
                      });
                    }}
                    className="min-h-[48px] px-3.5 py-2.5 rounded-2xl border border-amber-500/40 bg-amber-500/12 text-amber-900 dark:text-amber-200 flex items-center justify-between gap-2 text-xs font-extrabold transition-all active:scale-95 cursor-pointer"
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <span>{pulse.moodEmoji}</span>
                      <span>{isEn ? 'Mood' : 'مزاج الطفل'}</span>
                    </span>
                    <span className="text-[11px] font-black">↻</span>
                  </button>

                  <button
                    type="button"
                    data-testid="quick-pulse-care-btn"
                    onClick={() => {
                      if (pulse.careLogged) return;
                      void saveDashboardChildLog('other', 'تسجيل الرعاية اليومية', { dashboardKind: 'care' }).then((saved) => {
                        if (!saved) return;
                        setQuickPulseByKid((prev) => ({
                          ...prev,
                          [activeKidId]: { ...pulse, careLogged: true },
                        }));
                        onShowToast?.(isEn ? `🩺 ${activeKidName}: daily care saved ✓` : `🩺 تم حفظ سجل الرعاية اليومية لـ ${activeKidName} ✓`);
                      });
                    }}
                    className={`min-h-[48px] px-3.5 py-2.5 rounded-2xl border flex items-center justify-between gap-2 text-xs font-extrabold transition-all active:scale-95 cursor-pointer ${
                      pulse.careLogged
                        ? 'border-teal-500/40 bg-teal-500/15 text-[#0d9488] dark:text-[#2DD4BF]'
                        : 'border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-muted)]/40 dark:bg-[#142430] text-[var(--color-text)] dark:text-[#F8FAFC]'
                    }`}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <span>🩺</span>
                      <span>{isEn ? 'Care / Vitamin' : 'رعاية / فيتامين'}</span>
                    </span>
                    <span className="text-[11px] font-black">{pulse.careLogged ? '✓' : '+'}</span>
                  </button>
                </>
              );
            })()}
          </div>

          {/* Autonomous Battery Diagnostics Engine Live Bar for Active Child */}
          {(() => {
            const childDiag = master.batterySummary.childrenDiagnostics[activeKidId];
            if (!childDiag) return null;
            return (
              <div
                data-testid="child-battery-diagnostic-strip"
                className="rounded-2xl border border-teal-500/30 bg-teal-50/55 dark:bg-[#142430] px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs"
              >
                <div className="flex items-center gap-2 font-extrabold text-[var(--color-text)] dark:text-[#F8FAFC]">
                  <span>🔋</span>
                  <span>
                    {isEn
                      ? `${activeKidName} Wellness Battery: ${childDiag.overallScore}%`
                      : `مؤشر طاقة وعافية ${activeKidName}: ${childDiag.overallScore}%`}
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-[#0d9488] dark:text-[#2DD4BF]">
                  {isEn ? childDiag.recommendationEn : childDiag.recommendationAr}
                </span>
              </div>
            );
          })()}
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
          5. ACCORDION: HEROES, PASSIONS & MILESTONES ARENA (حمزة وليلى ويوسف — CHECKLIST #3 & #4)
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
            ? 'Infant sensory milestones, nursery creativity, and school & sports passions'
            : 'متابعة حية لإنجازات أطفالكم الحسية والإبداعية والرياضية'
        }
        badgeText={isEn ? '3 Heroes' : '٣ أبطال'}
        badgeClass="bg-amber-500/15 text-amber-800 dark:text-amber-300"
        isOpen={Boolean(openAccordions.heroesArena)}
        onToggle={() => toggleAccordion('heroesArena')}
        isEn={isEn}
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {heroesPassionsFeed.map((hero) => {
            const cheerCount = cheeredHeroIds[hero.id] ?? 10;
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

                  <div className="space-y-1 pt-1">
                    <div className="flex items-center justify-between text-[11px] font-extrabold text-[var(--color-text)] dark:text-[#F8FAFC]">
                      <span>{isEn ? 'Weekly Stage Rhythm' : 'مؤشر التقدم الأسبوعي'}</span>
                      <span className="tabular-nums">
                        {Math.min(100, 72 + (cheerCount % 25))}%
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-teal-950/10 dark:bg-[#0B131A] overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${hero.progressBarClass} transition-all duration-300`}
                        style={{ width: `${Math.min(100, 72 + (cheerCount % 25))}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-[var(--color-border)]/60 dark:border-[#1E3646] flex items-center justify-between gap-2">
                  <button
                    type="button"
                    data-testid={`cheer-hero-btn-${hero.id}`}
                    onClick={() => {
                      setCheeredHeroIds((prev) => ({
                        ...prev,
                        [hero.id]: (prev[hero.id] ?? 10) + 1,
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
            ? 'AI Bedtime Storyteller'
            : 'صانع الحواديت بالذكاء الاصطناعي'
        }
        subtitle={
          isEn
            ? 'Create a warm bedtime story starring your children'
            : 'ألف حدوتة مسائية دافئة بأسماء أطفالكم'
        }
        badgeText={isEn ? '15 Lines · AI' : '١٥ سطراً · بأسماء أطفالكم'}
        badgeClass="bg-amber-500/15 text-amber-800 dark:text-amber-300"
        borderClass="border-amber-500/35 dark:border-[#1E3646]"
        isOpen={Boolean(openAccordions.aiStoryteller)}
        onToggle={() => toggleAccordion('aiStoryteller')}
        isEn={isEn}
        headerExtraAction={
          onToggleBedtimeMode ? (
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
          ) : undefined
        }
      >
        <div
          id="ai-storyteller-accordion-panel"
          data-testid="ai-storyteller-accordion-panel"
          className="space-y-4"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
            <div className="lg:col-span-6 space-y-1">
              <label
                htmlFor="ai-story-custom-input"
                className="block text-xs font-extrabold text-[var(--color-text)] dark:text-[#F8FAFC]"
              >
                {isEn
                  ? 'Story Idea or Theme:'
                  : 'فكرة الحدوتة:'}
              </label>
              <input
                id="ai-story-custom-input"
                data-testid="ai-story-custom-input"
                type="text"
                value={storyCustomTopic}
                onChange={(e) => setStoryCustomTopic(e.target.value)}
                placeholder={
                  isEn
                    ? 'Searching for the glowing star in our garden...'
                    : 'رحلة البحث عن نجمة المساء المضيئة في حديقة البيت...'
                }
                className="w-full min-h-[42px] rounded-xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-bg)] dark:bg-[#142430] px-3.5 py-2 text-xs font-semibold text-[var(--color-text)] dark:text-[#F8FAFC]"
              />
            </div>

            <div className="lg:col-span-4 space-y-1">
              <label className="block text-xs font-extrabold text-[var(--color-text)] dark:text-[#F8FAFC]">
                {isEn ? 'Educational Value:' : 'القيمة التربوية للحدوتة:'}
              </label>
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  'التعاون والمحبة بين الإخوة',
                  'الصدق والشجاعة الهادئة',
                  'حب الاستكشاف وترتيب الغرفة',
                ].map((moralItem) => (
                  <button
                    key={moralItem}
                    type="button"
                    onClick={() => setStorySelectedMoral(moralItem)}
                    className={`min-h-[38px] px-2.5 py-1 rounded-xl text-[11px] font-extrabold border transition-all cursor-pointer ${
                      storySelectedMoral === moralItem
                        ? 'bg-[#FF8C61] text-white border-[#FF8C61]'
                        : 'bg-[var(--color-control-muted)] dark:bg-[#142430] text-[var(--color-text)] dark:text-[#F8FAFC] border-[var(--color-border)] dark:border-[#1E3646]'
                    }`}
                  >
                    {moralItem}
                  </button>
                ))}
              </div>
            </div>

            <div className="lg:col-span-2 flex items-end">
              <button
                type="button"
                id="ai-story-generate-btn"
                data-testid="ai-story-generate-btn"
                onClick={handleGenerateCustomStory}
                className="w-full min-h-[42px] px-4 py-2 rounded-xl bg-[#0d9488] hover:bg-[#0f766e] text-white text-xs font-black shadow-xs transition-all cursor-pointer"
              >
                ✨ {isEn ? 'Create Story' : 'تأليف الحدوتة'}
              </button>
            </div>
          </div>

          <div
            data-testid="ai-story-fifteen-lines-output"
            className="rounded-2xl border border-amber-500/35 bg-amber-50/55 dark:bg-[#142430] p-4 space-y-2"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-amber-500/20">
              <span className="text-xs font-black text-amber-900 dark:text-amber-300">
                🌟 {isEn ? 'Tonight’s Custom Story:' : 'حدوتة الليلة المخصصة:'}
              </span>
              <button
                type="button"
                onClick={() =>
                  onAddSuggestedRoutineTask?.(
                    isEn ? `Bedtime Story: ${storyCustomTopic}` : `حدوتة المساء: ${storyCustomTopic}`,
                    '08:15 م',
                    null
                  )
                }
                className="min-h-[34px] px-3 py-1 rounded-xl bg-[#FF8C61] hover:bg-[#e86a3d] text-white text-[11px] font-extrabold cursor-pointer"
              >
                + {isEn ? 'Schedule Tonight 8:15 PM' : 'جدولة الليلة 8:15 م'}
              </button>
            </div>

            <div className="space-y-1.5 text-xs sm:text-[13px] font-semibold text-[var(--color-text)] dark:text-[#F8FAFC] leading-relaxed">
              {generatedStoryLines.map((line, idx) => (
                <p key={idx} className="py-0.5">
                  {line}
                </p>
              ))}
            </div>
          </div>

          <StoriesLibraryView
            lang={lang}
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
            ? 'Interactive nutrition & lunchbox, daily water intake goal, and physical activity'
            : 'التغذية واللانش بوكس، هدف شرب المياه، والنشاط البدني والرياضي اليومي'
        }
        badgeText={`${currentWaterCups}/${targetWaterCups} 💧`}
        badgeClass="bg-sky-500/15 text-sky-700 dark:text-sky-300"
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
                const cTone = getChildColorClasses(kid.name, idx);
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
                  <span aria-hidden="true">·</span>
                  <span>🔥 {currentNutrition.calories}</span>
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
                  ? `${activeKidName}'s Daily Water Intake · ${waterProgressPct}%`
                  : `معدل شرب المياه اليومي لـ ${activeKidName} · ${waterProgressPct}٪`
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
                      <span dir="ltr" className="tabular-nums">
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
                    className="min-w-[44px] min-h-[44px] rounded-xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-muted)] dark:bg-[#142430] text-sm font-black text-[var(--color-text)] dark:text-[#F8FAFC] flex items-center justify-center cursor-pointer active:scale-95"
                  >
                    −
                  </button>
                  <button
                    type="button"
                    data-testid="home-hydration-add-cup-btn"
                    onClick={() => handleAdjustWater(1)}
                    className="min-h-[44px] px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-extrabold transition-all active:scale-95 cursor-pointer"
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
                    if (isSportDoneToday) return;
                    void saveDashboardChildLog('sports', isEn ? currentSport.titleEn : currentSport.titleAr, {
                      dashboardKind: 'sports',
                      activityId: selectedSportSlot,
                    }).then((saved) => {
                      if (!saved) return;
                      setCompletedSportByKid((prev) => ({ ...prev, [activeKidId]: true }));
                      onShowToast?.(
                        isEn
                          ? `🏅 ${activeKidName}’s activity was saved for today ✓`
                          : `🏅 تم حفظ نشاط ${activeKidName} الرياضي اليوم ✓`
                      );
                    });
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
      </HomeAccordionCard>

      {/* =====================================================================
          8. ACCORDION: DAILY BATTERY DIAGNOSTIC (QUESTIONS FIRST, RESULT BELOW — CHECKLIST #3 & #9)
          ===================================================================== */}
      <HomeAccordionCard
        id="home-battery-diagnostic-accordion"
        testId="home-battery-diagnostic-accordion"
        iconEmoji="🔋"
        iconBgClass="bg-teal-500/15 text-[#0d9488] dark:text-[#2DD4BF]"
        title={isEn ? 'Daily Home Battery & Rescue Plan' : 'مؤشر طاقة البيت وخطة الإنقاذ'}
        subtitle={
          isEn
            ? 'Check in on family energy and view tailored daily recommendations'
            : 'قيّم طاقة البيت والأطفال واحصل على توصيات فورية لروتين اليوم'
        }
        badgeText={isEn ? 'Smart Check-In' : 'تشخيص ذكي'}
        isOpen={Boolean(openAccordions.batteryDiagnostic)}
        onToggle={() => toggleAccordion('batteryDiagnostic')}
        isEn={isEn}
      >
        <div className="space-y-4">
          <BatteryDiagnosticsView
            lang={lang}
            onShowToast={onShowToast}
            onAddRescueTask={onAddSuggestedRoutineTask}
          />

          <FamilyMoodBarometer
            language={lang}
            darkMode={Boolean(state.darkMode)}
            onSelectMood={(_, msg) => onShowToast?.(msg)}
            onAddRescueTask={(taskName, timeStr, kidId) => {
              onAddSuggestedRoutineTask?.(taskName, timeStr, kidId);
              onShowToast?.(
                isEn
                  ? `🛟 Added Rescue Plan task to Daily Routine: "${taskName}"`
                  : `🛟 تمت إضافة مهمة خطة الإنقاذ إلى الروتين اليومي: «${taskName}»`
              );
            }}
          />
        </div>
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
          {[
            {
              id: 'game-hamza-sensory',
              badgeAr: '👶🏻 حمزة · ٦ شهور',
              badgeEn: '👶🏻 Hamza · 6m',
              titleAr: 'أصوات الطبيعة والخشخيشة الحسية',
              titleEn: 'Sensory Sounds & Gentle Rattle Play',
              descAr: 'تحفيز سمعي وبصري هادئ بألوان مريحة لعيون الرضيع.',
              descEn: 'Calm auditory and visual stimulation safe for infants.',
              borderTone: 'border-sky-500/40',
            },
            {
              id: 'game-laila-colors',
              badgeAr: '🎨 ليلى · ٤ سنوات',
              badgeEn: '🎨 Laila · 4y',
              titleAr: 'تطابق الألوان والحيوانات وتسمية المشاعر',
              titleEn: 'Color & Animal Memory Match + Emotions',
              descAr: 'تنمّي الذاكرة البصرية والتركيز والخيال في مرحلة الحضانة.',
              descEn: 'Builds visual memory, focus, and joyful nursery readiness.',
              borderTone: 'border-rose-500/40',
            },
            {
              id: 'game-youssef-logic',
              badgeAr: '🏆 يوسف · ٨ سنوات',
              badgeEn: '🏆 Youssef · 8y',
              titleAr: 'تحدي أبطال الحساب السريع والمنطق',
              titleEn: 'Champion Math Sprint & Logic Quest',
              descAr: 'سباق ذكاء سريع ينشط التفكير المنطقي والسرعة الذهنية.',
              descEn: 'Fast-paced brain challenge sharpening logic and math.',
              borderTone: 'border-amber-500/40',
            },
          ].map((gCard) => (
            <div
              key={gCard.id}
              onClick={() => navigateTo('games')}
              className={`rounded-2xl border-2 ${gCard.borderTone} bg-[var(--color-control-muted)]/35 dark:bg-[#142430] p-4 flex flex-col justify-between gap-2.5 hover:shadow-md transition-all cursor-pointer`}
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
            </div>
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
        badgeText={isEn ? 'Ages 0–8' : '٠–٨ سنوات'}
        isOpen={Boolean(openAccordions.platformGateways)}
        onToggle={() => toggleAccordion('platformGateways')}
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

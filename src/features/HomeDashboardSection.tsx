import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  COUNTRY_CITIES_MAP,
  CalendarEvent,
  CommercialCatalogItem,
  FamilySpaceState,
  LanguageCode,
  ParentProfileThemeSpec,
  VoiceVaultMoment,
  calculateChildAge,
  dateLocalISO,
  locText,
  sanitizeUserText,
} from '../domain/familySpaceCore';
import {
  FamilyMoodBarometer,
  MasterPatternCard,
  SoftFilledIcon,
  StarOfTheDayCrownBadge,
} from '../components/DesignSystem';
import { ThreeDChildAvatar, ThreeDIconId } from '../components/ThreeDVisuals';
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
  onToggleTaskDone?: (taskId: number) => void;
  onAddVoiceMoment?: (kidId: number, moment: VoiceVaultMoment) => void;
}

interface DailyAudioBriefEpisode {
  id: string;
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

const DAILY_AUDIO_BRIEFS: DailyAudioBriefEpisode[] = [
  {
    id: 'brief-morning-harmony',
    slotLabelAr: '☀️ إيجاز الصباح للوالدين',
    slotLabelEn: '☀️ Morning Parent Brief',
    titleAr: 'دقيقة صباحية لأحمد ومريم: توزيع هادئ ليوم حمزة وليلى ويوسف',
    titleEn: '1-Min Morning Sync for Ahmad & Maryam: Calm Flow for Hamza, Laila & Youssef',
    hostsAr: 'بصوت بوصلة نكبر · لأحمد ومريم',
    hostsEn: 'Nekbaar Parenting Compass · For Ahmad & Maryam',
    durationSec: 60,
    durationLabel: '01:00',
    summaryAr:
      'ابدآ الصباح بدقيقة تواصل بصري وابتسامة مع ليلى ويوسف قبل الحديث عن الحضانة والمدرسة، بينما ينعم حمزة برضعته الصباحية الهادئة.',
    summaryEn:
      'Start the morning with 60 seconds of warm connection with Laila and Youssef before school prep, while Hamza enjoys his calm morning feed.',
    takeawayAr: '💡 سر اليوم: هدوء نبرة الوالدين في أول ١٠ دقائق يصنع أمان البيت طوال النهار.',
    takeawayEn: '💡 Key Takeaway: Calm parent tone in the first 10 minutes sets the household rhythm.',
    melodyHz: [392.0, 493.88, 587.33, 659.25],
  },
  {
    id: 'brief-midday-passions',
    slotLabelAr: '🌱 كبسولة الظهيرة والشغف',
    slotLabelEn: '🌱 Afternoon Growth Brief',
    titleAr: 'رعاية شغف الأبطال: خيال ليلى الفني، منطق يوسف، واكتشافات حمزة',
    titleEn: 'Nurturing Passions: Laila’s Art, Youssef’s Sports & Hamza’s Sensory World',
    hostsAr: 'د. سلمى الكيلاني · علم نفس النمو',
    hostsEn: 'Dr. Salma El-Kilany · Child Development',
    durationSec: 60,
    durationLabel: '01:00',
    summaryAr:
      'بعد العودة من الحضانة والمدرسة، يحتاج الطفل ١٥ دقيقة استرخاء حر قبل أي أسئلة، متبوعة بلعب حسي لحمزة وتلوين لليلى ورياضة ليوسف.',
    summaryEn:
      'After nursery and school, give kids 15 minutes of unstructured decompression before homework, creative art, or tummy time.',
    takeawayAr: '💡 سر اليوم: لاحظوا شغف كل طفل وسمّوا نقاط قوته بصوت مسموع أمام العائلة.',
    takeawayEn: '💡 Key Takeaway: Notice and name each child’s unique passion out loud.',
    melodyHz: [440.0, 523.25, 659.25, 783.99],
  },
  {
    id: 'brief-evening-serenity',
    slotLabelAr: '🌙 بودكاست سكينة المساء',
    slotLabelEn: '🌙 Evening Serenity Podcast',
    titleAr: 'طقس الـ ٢٠ دقيقة الذهبية قبل النوم وتجديد طاقة أحمد ومريم',
    titleEn: 'The Golden 20-Minute Bedtime Ritual & Evening Recharge for Ahmad & Maryam',
    hostsAr: 'همسة المساء · نكبر',
    hostsEn: 'Evening Whisper · Nekbaar',
    durationSec: 60,
    durationLabel: '01:00',
    summaryAr:
      'تخفيت الإضاءة، حمام دافئ لحمزة، وحدوتة مشتركة لليلى ويوسف يمنح الأطفال نوماً عميقاً ويترك لأحمد ومريم وقتاً هادئاً معاً.',
    summaryEn:
      'Dimming lights, a warm bath for Hamza, and a shared story for Laila & Youssef cues deep sleep and gives Ahmad & Maryam peaceful couple time.',
    takeawayAr: '💡 سر المساء: لا تبحثا عن الكمال اليوم؛ حبكما واحتواؤكما هو أعظم إنجاز.',
    takeawayEn: '💡 Evening Note: Let go of perfection tonight—your warmth is what they remember.',
    melodyHz: [329.63, 392.0, 493.88, 523.25],
  },
];

export const HomeDashboardSection: React.FC<HomeDashboardSectionProps> = ({
  state,
  lang,
  parentProfileSpec,
  cartItemCount,
  completedTasksCount,
  nearestEvent,
  todayFormattedCombined,
  userCoords,
  bedtimeMode,
  onToggleBedtimeMode,
  navigateTo,
  onSelectPreciseCity,
  onAddSuggestedRoutineTask,
  onShowToast,
  onOpenStoreCategory,
  onAddVoiceMoment,
}) => {
  const isEn = lang === 'en';

  // Selected Child Index for Dashboard Context
  const [selectedKidIdx, setSelectedKidIdx] = useState<number>(0);

  // 1. Top Audio Brief / Podcast Player State
  const [activeBriefIdx, setActiveBriefIdx] = useState<number>(0);
  const [isPlayingBrief, setIsPlayingBrief] = useState<boolean>(false);
  const [briefElapsedSec, setBriefElapsedSec] = useState<number>(18);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // 2. Dynamic Time-Aware Daily Wisdom (بوصلة اليوم) State
  const [wisdomTimeOverride, setWisdomTimeOverride] = useState<'auto' | 'morning' | 'afternoon' | 'evening'>('auto');

  // 3. Heroes, Passions & Life Arena (عالم الأبطال والشغف) State
  const [cheeredHeroIds, setCheeredHeroIds] = useState<Record<string, number>>({
    hamza: 12,
    laila: 19,
    youssef: 24,
  });

  // 4. Micro-Moments Voice Vault (10s Logger) & Bedtime Story Inspiration State
  const [vaultKidId, setVaultKidId] = useState<number>(() => state.kids[0]?.id ?? 1);
  const [isRecordingVault, setIsRecordingVault] = useState<boolean>(false);
  const [vaultElapsedSec, setVaultElapsedSec] = useState<number>(0);
  const [vaultDraftTitle, setVaultDraftTitle] = useState<string>('');
  const [vaultSelectedTag, setVaultSelectedTag] = useState<string>('أول ضحكة 👶🏻');
  const [playingVaultId, setPlayingVaultId] = useState<string | null>(null);
  const [localVaultMoments, setLocalVaultMoments] = useState<VoiceVaultMoment[]>([
    {
      id: 'home-vm-seed-1',
      title: 'ضحكة حمزة العالية وقت اللعب مع ليلى ويوسف 👶🏻💛',
      createdAt: dateLocalISO(new Date()),
      durationSec: 10,
      tag: 'أول ضحكة 👶🏻',
      recordedBy: 'mother',
      melodyHz: [392.0, 493.88, 587.33, 659.25],
    },
  ]);

  const [storyThemeIdx, setStoryThemeIdx] = useState<number>(0);

  // Daily Essentials Interactive States (Scoped per Child ID)
  const [selectedMealSlot, setSelectedMealSlot] = useState<'breakfast' | 'lunchbox' | 'snack'>('lunchbox');
  const [waterCupsByKid, setWaterCupsByKid] = useState<Record<number, number>>(() => {
    const initial: Record<number, number> = {};
    state.kids.forEach((k, idx) => {
      initial[k.id] = idx === 0 ? 2 : idx === 1 ? 4 : 6;
    });
    return initial;
  });
  const [selectedSportSlot, setSelectedSportSlot] = useState<'cardio' | 'balance' | 'outdoor'>('outdoor');
  const [completedSportByKid, setCompletedSportByKid] = useState<Record<number, boolean>>({});
  const [showPromoShowcase, setShowPromoShowcase] = useState<boolean>(false);

  const playGentleAudioSynthesizer = (notesHz: number[] = [392.0, 493.88, 587.33, 659.25]) => {
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
        ctx.resume();
      }
      notesHz.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.2);
        gain.gain.setValueAtTime(0.06, ctx.currentTime + idx * 0.2);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.2 + 0.19);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.2);
        osc.stop(ctx.currentTime + idx * 0.2 + 0.2);
      });
    } catch {
      // Ignore Web Audio errors in headless environments
    }
  };

  // Timer for Top 1-Minute Audio Brief Player
  useEffect(() => {
    if (!isPlayingBrief) return;
    const interval = window.setInterval(() => {
      setBriefElapsedSec((prev) => {
        if (prev >= 60) {
          setIsPlayingBrief(false);
          return 0;
        }
        return prev + 1;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [isPlayingBrief]);

  // Timer for 10-Second Micro-Moments Voice Vault Logger
  const targetVaultKid = useMemo(
    () => state.kids.find((k) => k.id === vaultKidId) || state.kids[0],
    [state.kids, vaultKidId]
  );

  const finalizeHomeVaultRecording = (durationSec: number) => {
    const kidName = targetVaultKid ? locText(targetVaultKid.name, lang) : isEn ? 'Child' : 'طفلنا';
    const cleanTitle =
      sanitizeUserText(vaultDraftTitle, 120) ||
      (isEn
        ? `10s Spontaneous Voice Memory for ${kidName}`
        : `لقطة صوتية عفوية لـ ${kidName} (${Math.max(1, durationSec)} ثوانٍ)`);
    const createdMoment: VoiceVaultMoment = {
      id: `vm-home-${Date.now()}`,
      title: cleanTitle,
      createdAt: dateLocalISO(new Date()),
      durationSec: Math.max(1, Math.min(10, durationSec)),
      tag: vaultSelectedTag,
      recordedBy: state.role === 'dad' ? 'father' : 'mother',
      melodyHz: [440.0, 523.25, 659.25, 783.99],
    };

    setLocalVaultMoments((prev) => [createdMoment, ...prev]);
    if (targetVaultKid && onAddVoiceMoment) {
      onAddVoiceMoment(targetVaultKid.id, createdMoment);
    } else {
      onShowToast?.(
        isEn
          ? `🎙️ Saved 10s voice memory "${cleanTitle}" to Voice Vault!`
          : `🎙️ تم حفظ اللقطة الصوتية «${cleanTitle}» في خزينة الذكريات!`
      );
    }
    setVaultDraftTitle('');
    setIsRecordingVault(false);
    setVaultElapsedSec(0);
    playGentleAudioSynthesizer(createdMoment.melodyHz);
  };

  useEffect(() => {
    if (!isRecordingVault) return;
    const timer = window.setInterval(() => {
      setVaultElapsedSec((prev) => {
        if (prev >= 9) {
          window.setTimeout(() => finalizeHomeVaultRecording(10), 40);
          return 10;
        }
        return prev + 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isRecordingVault, vaultDraftTitle, vaultSelectedTag, targetVaultKid]);

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

  const resolvedTimeOfDay: 'morning' | 'afternoon' | 'evening' = useMemo(() => {
    if (wisdomTimeOverride !== 'auto') return wisdomTimeOverride;
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'afternoon';
    return 'evening';
  }, [wisdomTimeOverride]);

  // Dynamic Time-Aware Daily Wisdom (بوصلة اليوم)
  const dailyCompassWisdom = useMemo(() => {
    if (resolvedTimeOfDay === 'morning') {
      return {
        badgeAr: '☀️ بوصلة الصباح · عقلية البداية الهادئة',
        badgeEn: '☀️ Morning Compass · Calm Start Mindset',
        titleAr: '«خمس دقائق من الاحتواء الصباحي تمنح أطفالكم أمان اليوم كله»',
        titleEn: '“Five Minutes of Morning Connection Anchors Your Children All Day”',
        bodyAr:
          'قبل زحمة تحضير شنطة مدرسة يوسف وحضانة ليلى، انزلوا لمستوى نظرهم بابتسامة دافئة وحضن قصير. الطفل الذي يشعر بالارتباط العاطفي صباحاً يتعاون تلقائياً ويمضي يومه بثقة وفضول.',
        bodyEn:
          'Before rushing into Youssef’s school bag and Laila’s nursery prep, pause for an eye-level smile and a 10-second hug. Connection before direction builds effortless cooperation.',
        quoteAr: 'همسة لأحمد ومريم: هدوء نبرتكما صباحاً هو البوصلة التي يضبط عليها الأبناء مشاعرهم.',
        quoteEn: 'For Ahmad & Maryam: Your calm morning tone is the compass your children tune their emotions to.',
        actionLabelAr: 'أضف «حضن الصباح الهادئ» للروتين',
        actionLabelEn: 'Add “Calm Morning Hug” to Routine',
        actionTaskAr: 'حضن الصباح الهادئ وتسمية هدف جميل لليوم مع ليلى ويوسف وحمزة',
        actionTaskEn: 'Calm morning hug & positive intention with Laila, Youssef & Hamza',
        actionTime: '07:15 ص',
      };
    }
    if (resolvedTimeOfDay === 'afternoon') {
      return {
        badgeAr: '🌤️ بوصلة الظهيرة · محطة تجديد الطاقة والتواصل',
        badgeEn: '🌤️ Afternoon Compass · Midday Check-In & Reset',
        titleAr: '«لحظة الالتقاء بعد المدرسة والحضانة هي جسر الأمان العاطفي»',
        titleEn: '“The Post-School Reunion Is Your Child’s Emotional Reset Bridge”',
        bodyAr:
          'عند عودة يوسف من المدرسة وليلى من الحضانة، استبدلوا أسئلة الاختبار («عملت إيه؟») بجملة دافئة («اشتقت لكم جداً، مبسوط بوجودكم»). أمنحوهما ١٥ دقيقة استرخاء ووجبة خفيفة بينما يمارس حمزة وقت البطن.',
        bodyEn:
          'When Youssef and Laila return home, lead with warmth (“I missed you so much!”) rather than interrogation. Offer a healthy snack and 15 minutes of calm play alongside Hamza’s tummy time.',
        quoteAr: 'همسة لأحمد ومريم: الإصغاء لثرثرة ليلى العفوية وحماس يوسف الرياضي يصنع ذكريات لا تُنسى.',
        quoteEn: 'For Ahmad & Maryam: Listening to Laila’s stories and Youssef’s passions builds lifelong trust.',
        actionLabelAr: 'أضف «استراحة الظهيرة الهادئة» للروتين',
        actionLabelEn: 'Add “Afternoon Connection Reset” to Routine',
        actionTaskAr: 'جلسة فواكه واستماع دافئ لحكايات ليلى ويوسف بعد العودة للبيت',
        actionTaskEn: 'Fruit snack & warm listening circle with Laila & Youssef',
        actionTime: '03:30 م',
      };
    }
    return {
      badgeAr: '🌙 بوصلة المساء · سكينة البيت وامتنان آخر اليوم',
      badgeEn: '🌙 Evening Compass · Calm Wind-Down & Gratitude',
      titleAr: '«في آخر اليوم.. أطفالكم لا يحتاجون أماً وأباً كاملين، بل قلباً دافئاً»',
      titleEn: '“At Day’s End, Your Kids Don’t Need Perfection—They Need Your Warmth”',
      bodyAr:
        'اتركا أي توتر من تفاصيل النهار خلفكما. حمام دافئ لحمزة (٦ شهور)، تخفيت إضاءة البيت، وسؤال ليلى ويوسف عن «أجمل لحظة أسعدتهم اليوم» يختم النهار بسلام نفسي ونوم عميق.',
      bodyEn:
        'Release the day’s unfinished checklists. A warm bath for Hamza, dimmed amber lighting, and asking Laila & Youssef for their favorite moment of the day closes the night in peace.',
      quoteAr: 'همسة لأحمد ومريم: شكراً لكل جهد بذلتماه اليوم.. وبحبكم يكبر حمزة وليلى ويوسف.',
      quoteEn: 'For Ahmad & Maryam: Thank you for showing up with love today—through your love, they grow.',
      actionLabelAr: 'أضف «دائرة امتنان المساء» للروتين',
      actionLabelEn: 'Add “Evening Gratitude Circle” to Routine',
      actionTaskAr: 'دائرة امتنان المساء وتخفيت الإضاءة قبل النوم مع العيلة',
      actionTaskEn: 'Evening gratitude circle & dimmed lights before bedtime',
      actionTime: '08:00 م',
    };
  }, [resolvedTimeOfDay]);

  // Heroes, Passions & Life Arena (عالم الأبطال والشغف)
  const heroesPassionsFeed = useMemo(() => {
    const hamzaKid = state.kids.find((k) => k.id === 1 || k.name.includes('حمزة')) || state.kids[0];
    const lailaKid = state.kids.find((k) => k.id === 2 || k.name.includes('ليلى')) || state.kids[1] || state.kids[0];
    const youssefKid = state.kids.find((k) => k.id === 3 || k.name.includes('يوسف')) || state.kids[2] || state.kids[0];

    const hamzaAge = hamzaKid ? calculateChildAge(hamzaKid.birth, lang) : null;
    const lailaAge = lailaKid ? calculateChildAge(lailaKid.birth, lang) : null;
    const youssefAge = youssefKid ? calculateChildAge(youssefKid.birth, lang) : null;

    const hamzaInterestsAr = hamzaKid?.interests
      ? hamzaKid.interests.split(/[،,]/).map((s: string) => s.trim()).filter(Boolean)
      : ['وقت البطن الحسي', 'أول وجبة خضار', 'تنظيم القيلولة'];
    const lailaInterestsAr = lailaKid?.interests
      ? lailaKid.interests.split(/[،,]/).map((s: string) => s.trim()).filter(Boolean)
      : ['الألوان المائية', 'بطاقات تسمية المشاعر', 'حكايات الحضانة'];
    const youssefInterestsAr = youssefKid?.interests
      ? youssefKid.interests.split(/[،,]/).map((s: string) => s.trim()).filter(Boolean)
      : ['تمرين السباحة والكرة', 'الشطرنج والمنطق', 'علوم الفضاء'];

    return [
      {
        id: 'hamza',
        kidId: hamzaKid?.id ?? 1,
        nameAr: `${hamzaKid?.name || 'حمزة'} (${hamzaAge?.label || '٦ شهور'})`,
        nameEn: `${locText(hamzaKid?.name || 'حمزة', 'en')} (${hamzaAge?.label || '6 Months'})`,
        arenaBadgeAr: '👶🏻 محطات الرضيع والنوم الهادئ (٦ شهور)',
        arenaBadgeEn: '👶🏻 Infant Milestones & Sleep (6m)',
        titleAr: 'إنجاز الأسبوع: ثبات الرقبة في تمرين وقت البطن وتذوق مهروس الجزر والبطاطا وانتظام القيلولة!',
        titleEn: 'Weekly Milestone: Strong Tummy-Time Head Lift, First Sweet Potato Puree & Calm Nap Rhythm!',
        passionTagsAr: hamzaInterestsAr.slice(0, 3).map((t: string, idx: number) => `${['🧸', '🍼', '🌙'][idx] || '✨'} ${t}`),
        passionTagsEn: ['🧸 Sensory Tummy Time', '🍼 First Veggie Puree', '🌙 Nap & Sleep Rhythm'],
        nextGoalAr:
          hamzaKid?.healthNotePrivate
            ? `${hamzaKid.healthNotePrivate} · الخطوة القادمة: تحفيز الجلوس المسنود والتقاط الخشخيشة الخشبية.`
            : 'الخطوة القادمة: تحفيز الجلوس المسنود والتقاط الخشخيشة الخشبية باليدين مع تهدئة المساء.',
        nextGoalEn: 'Next Horizon: Supported sitting play, two-handed wooden rattle grasp & soothing bedtime.',
        routineTaskAr: `١٥ دقيقة تمرين وقت البطن والألعاب الحسية لـ ${hamzaKid?.name || 'حمزة'}`,
        routineTaskEn: `15-min sensory tummy time & rattle reach with ${locText(hamzaKid?.name || 'حمزة', 'en')}`,
        routineTime: '01:30 م',
        accentBorder: 'border-teal-500/35',
        accentBg: 'bg-teal-500/10 text-[#0d9488] dark:text-[#2DD4BF]',
      },
      {
        id: 'laila',
        kidId: lailaKid?.id ?? 2,
        nameAr: `${lailaKid?.name || 'ليلى'} (${lailaAge?.label || '٤ سنوات'})`,
        nameEn: `${locText(lailaKid?.name || 'ليلى', 'en')} (${lailaAge?.label || '4 Years'})`,
        arenaBadgeAr: '🎨 الحضانة، الخيال والعالم الإبداعي (٤ سنوات)',
        arenaBadgeEn: '🎨 Nursery, Imagination & Creative World (4y)',
        titleAr: 'شغف ليلى: رسمت لوحة «عيلتنا تحت الشمس» بالألوان المائية وسمّت مشاعرها بهدوء في الحضانة!',
        titleEn: 'Laila’s Creative World: Painted “Our Family Under the Sun” & Named Emotions Calmly at Nursery!',
        passionTagsAr: lailaInterestsAr.slice(0, 3).map((t: string, idx: number) => `${['🎨', '🌸', '🏫'][idx] || '✨'} ${t}`),
        passionTagsEn: ['🎨 Watercolors & Art', '🌸 Emotion Naming Cards', '🏫 Nursery Storytelling'],
        nextGoalAr:
          lailaKid?.healthNotePrivate
            ? `${lailaKid.healthNotePrivate} · تأليف حدوتة قصيرة بالدمى المسرحية ومشاركتها قبل النوم.`
            : 'الخطوة القادمة: تأليف حدوتة قصيرة بالدمى المسرحية ومشاركتها قبل النوم.',
        nextGoalEn: 'Next Horizon: Creating a short puppet story to share with the family before bedtime.',
        routineTaskAr: `جلسة ألوان مائية وبطاقات تسمية المشاعر مع ${lailaKid?.name || 'ليلى'}`,
        routineTaskEn: `Watercolor art & emotion-naming session with ${locText(lailaKid?.name || 'ليلى', 'en')}`,
        routineTime: '04:30 م',
        accentBorder: 'border-rose-400/40',
        accentBg: 'bg-rose-500/10 text-rose-700 dark:text-rose-300',
      },
      {
        id: 'youssef',
        kidId: youssefKid?.id ?? 3,
        nameAr: `${youssefKid?.name || 'يوسف'} (${youssefAge?.label || '٨ سنوات'})`,
        nameEn: `${locText(youssefKid?.name || 'يوسف', 'en')} (${youssefAge?.label || '8 Years'})`,
        arenaBadgeAr: '🏆 المدرسة، الرياضة ومدار الأبطال والشغف (٨ سنوات)',
        arenaBadgeEn: '🏆 School, Sports & Heroes/Passions Orbit (8y)',
        titleAr: 'تألق يوسف: أنهى واجبات المدرسة باستقلالية وفاز بتحدي السباحة والشطرنج مع بابا أحمد!',
        titleEn: 'Youssef’s Orbit: Independent School Homework Finish + Swimming & Chess Win with Dad Ahmad!',
        passionTagsAr: youssefInterestsAr.slice(0, 3).map((t: string, idx: number) => `${['🏊‍♂️', '♟️', '🚀'][idx] || '✨'} ${t}`),
        passionTagsEn: ['🏊‍♂️ Swimming & Football', '♟️ Chess & Logic', '🚀 Space & Robotics Orbit'],
        nextGoalAr:
          youssefKid?.healthNotePrivate
            ? `${youssefKid.healthNotePrivate} · قيادة تحدي القراءة الأسبوعي وتنظيم وقت الشاشات ذاتياً.`
            : 'الخطوة القادمة: قيادة تحدي القراءة الأسبوعي وتنظيم وقت الشاشات ذاتياً.',
        nextGoalEn: 'Next Horizon: Leading the weekly reading challenge & self-managed screen timer.',
        routineTaskAr: `تمرين لياقة وجولة شطرنج وتفكير منطقي مع ${youssefKid?.name || 'يوسف'}`,
        routineTaskEn: `Fitness drill & strategic chess match with ${locText(youssefKid?.name || 'يوسف', 'en')}`,
        routineTime: '05:30 م',
        accentBorder: 'border-amber-500/40',
        accentBg: 'bg-amber-500/15 text-amber-800 dark:text-amber-300',
      },
    ];
  }, [state.kids, lang]);

  // Bedtime Story Inspiration Prompts (إلهام حدوتة المساء)
  const bedtimeStoryPrompts = useMemo(
    () => [
      {
        id: 'story-courage-stars',
        themeAr: '🚀 الشجاعة وحب الاستكشاف',
        themeEn: '🚀 Courage & Curiosity',
        titleAr: '«مغامرة الكابتن يوسف والفنانة ليلى والرضيع حمزة في كوكب النجوم المضيئة»',
        titleEn: '“Captain Youssef, Artist Laila & Baby Hamza on the Planet of Glowing Stars”',
        promptAr:
          'يحكي بابا أحمد أو ماما مريم كيف قاد الكابتن يوسف السفينة بذكائه، ولونت ليلى الغيوم بفرشاتها السحرية لتضيء الطريق، بينما أطلقت ضحكة حمزة الصغيرة نجمة ذهبية أعادت الدفء للكوكب.',
        promptEn:
          'Tell how Captain Youssef navigated with logic, Laila painted the clouds with her magic brush to light the sky, and baby Hamza’s giggle unlocked a golden star of warmth.',
        moralAr: 'القيمة التربوية: كل فرد في عيلتنا له موهبة خاصة تكمل إخوته.',
        moralEn: 'Core Moral: Every sibling brings a unique gift that makes our family complete.',
      },
      {
        id: 'story-kindness-garden',
        themeAr: '🌸 اللطافة والتعاون بين الإخوة',
        themeEn: '🌸 Sibling Kindness & Empathy',
        titleAr: '«حديقة الكلمات الطيبة وشجرة المحبة التي تكبر كل مساء»',
        titleEn: '“The Garden of Kind Words & the Tree That Grows with Love”',
        promptAr:
          'في حديقة سرية خلف بيتنا، كلما ساعد يوسف أخته ليلى، أو غنت ليلى لحمزة الصغير حتى ينام، تتفتح زهرة مضيئة جديدة على شجرة العائلة وتهمس للجميع بأحلام سعيدة.',
        promptEn:
          'In a secret garden behind our home, every time Youssef helps Laila or Laila sings softly to baby Hamza, a glowing blossom opens on the family tree.',
        moralAr: 'القيمة التربوية: الكلمة الطيبة والمساعدة الصغيرة تصنع سعادة كبيرة في البيت.',
        moralEn: 'Core Moral: Gentle words and small acts of care make our home bloom.',
      },
      {
        id: 'story-gratitude-moon',
        themeAr: '🌙 السكينة والامتنان قبل النوم',
        themeEn: '🌙 Calm Gratitude & Sweet Dreams',
        titleAr: '«قطار الغيوم الدافئ ورسائل الشكر الثلاث للقمر»',
        titleEn: '“The Cozy Cloud Train & Three Thank-You Notes to the Moon”',
        promptAr:
          'يركب يوسف وليلى وحمزة قطار الغيوم الناعم، ويذكر كل واحد منهم شيئاً جميلاً حدث اليوم قبل أن يغمضوا عيونهم على صوت تنفس هادئ ودعاء المساء.',
        promptEn:
          'Youssef, Laila, and Hamza board the soft cloud train, each sharing one happy moment from today before drifting to sleep with calm breathing.',
        moralAr: 'القيمة التربوية: تذكّر النعم الجميلة قبل النوم يملأ القلب بالطمأنينة.',
        moralEn: 'Core Moral: Remembering today’s blessings fills the heart with deep peace.',
      },
    ],
    []
  );

  const currentBrief = DAILY_AUDIO_BRIEFS[activeBriefIdx % DAILY_AUDIO_BRIEFS.length];
  const currentStoryPrompt = bedtimeStoryPrompts[storyThemeIdx % bedtimeStoryPrompts.length];

  // Merged Voice Vault moments across kids + local home recordings
  const combinedVoiceMoments = useMemo(() => {
    const fromKids = state.kids.flatMap((k) => k.voiceMoments || []);
    return [...localVaultMoments, ...fromKids].slice(0, 4);
  }, [localVaultMoments, state.kids]);

  // 1. Stage-Tailored Daily Nutrition & Lunchbox Data for Selected Child
  const nutritionPlans = useMemo(() => {
    const stageCode = activeKidAge?.stageCode || '2-5';
    if (stageCode === '0-2') {
      return {
        breakfast: {
          badgeAr: '🍼 رضعة الصباح وبداية التغذية (٦ شهور)',
          badgeEn: '🍼 Morning Milk & First Cereal (6m)',
          titleAr: `رضعة الصباح المشبعة + ملعقتين سيريلاك شوفان ناعم لـ ${activeKidName}`,
          titleEn: `Morning Milk Feed + 2 Spoons Smooth Oat Cereal for ${activeKidName}`,
          descAr: 'بداية لطيفة وسهلة الهضم تناسب معدة الرضيع في سن ٦ شهور وتدعم النمو الحركي.',
          descEn: 'Gentle, iron-fortified first solid feeding tailored for a 6-month infant.',
          time: '07:30 ص',
          calories: '180 kcal',
        },
        lunchbox: {
          badgeAr: '🥕 وجبة إدخال الخضار المهروس',
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

  // 2. Hydration / Water Goal Data for Selected Child
  const targetWaterCups =
    activeKidAge && activeKidAge.months < 12
      ? 2
      : activeKidAge && activeKidAge.years < 5
      ? 5
      : 7;
  const currentWaterCups = waterCupsByKid[activeKidId] ?? (targetWaterCups > 2 ? 4 : 1);
  const waterProgressPct = Math.min(100, Math.round((currentWaterCups / targetWaterCups) * 100));

  const handleAdjustWater = (delta: number) => {
    setWaterCupsByKid((prev) => {
      const current = prev[activeKidId] ?? (targetWaterCups > 2 ? 4 : 1);
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

  // 3. Stage-Tailored Physical Sports & Motor Activity Data for Selected Child
  const sportActivities = useMemo(() => {
    const stageCode = activeKidAge?.stageCode || '2-5';
    if (stageCode === '0-2') {
      return {
        outdoor: {
          badgeAr: '👶🏻 تمرين وقت البطن (Tummy Time)',
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
          titleEn: `40-Min Swimming or Football Practice (Screen-Free) for ${activeKidName}`,
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
        badgeAr: '🎨 لعب حركي وإبداعي (مرحلة الحضانة)',
        badgeEn: '🎨 Active Creative Play (4 yrs)',
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
      aria-label={isEn ? 'The Parenting Compass Family Dashboard' : 'بوصلة الأبوة والأمومة — لوحة العائلة المشتركة'}
    >
      {/* =====================================================================
          1. UNIFIED FAMILY HERO + COMPACT INLINE WEATHER + TOP AUDIO BRIEF PLAYER
          ===================================================================== */}
      <div
        id="home-core-value-hero"
        data-testid="home-core-value-hero"
        data-parent-profile={parentProfileSpec.role}
        style={{
          borderColor: parentProfileSpec.badgeBorderCss,
        }}
        className="rounded-3xl border-2 bg-[var(--color-surface)] dark:bg-[#101D26] p-5 sm:p-6 flex flex-col justify-between gap-4 shadow-sm"
      >
        {/* Top Row: Unified Family Compass Identity + Slogan */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-extrabold">
            <div className="inline-flex flex-wrap items-center gap-2 text-[var(--color-text)] dark:text-[#F8FAFC]">
              <span>🧭</span>
              <span>
                {isEn
                  ? 'The Parenting Compass · Ahmad & Maryam Family Space'
                  : 'بوصلة الأبوة والأمومة · مساحة أحمد ومريم المشتركة'}
              </span>
              <span aria-hidden="true" className="opacity-50">·</span>
              <span className="text-[#0d9488] dark:text-[#2DD4BF]">📍 {localizedCity}</span>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 text-[#0d9488] dark:text-[#2DD4BF] border border-teal-500/20 text-xs font-black">
              <span>✨</span>
              <span>{isEn ? 'Growing Together with Love' : 'مساحة تجمعنا.. وبحبهم نكبر'}</span>
            </span>
          </div>

          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h1
              id="home-main-greeting-heading"
              className="text-xl sm:text-2xl font-black text-[var(--color-text)] dark:text-[#F8FAFC] leading-snug"
            >
              {isEn
                ? 'Welcome to Your Family Compass, Ahmad & Maryam 👋'
                : 'أهلاً بكما في بوصلة العيلة يا أحمد ومريم 👋'}
            </h1>
            <span className="text-xs font-bold text-[var(--color-muted)] dark:text-[#94A3B8]">
              {todayFormattedCombined}
            </span>
          </div>
        </div>

        {/* Compact, Minimalist Single-Row Inline Weather Widget */}
        <LiveWeatherWidget
          city={activeCity}
          country={state.country}
          language={lang}
          darkMode={Boolean(state.darkMode)}
          userCoords={userCoords}
          onSelectCity={(cCode, cName) => onSelectPreciseCity(`${cCode}:${cName}`)}
        />

        {/* Sleek Top Audio Brief / 1-Minute Daily Podcast Ribbon with Soft Curves & Clean Waveforms */}
        <div
          id="home-audio-brief-podcast-player"
          data-testid="home-audio-brief-podcast-player"
          className="rounded-3xl border border-teal-500/35 dark:border-[#1E3646] bg-gradient-to-r from-teal-50/90 via-white to-orange-50/60 dark:from-[#142430] dark:via-[#101D26] dark:to-[#142430] p-4 sm:p-4.5 space-y-3 shadow-2xs"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <button
                type="button"
                data-testid="audio-brief-play-toggle"
                onClick={() => {
                  const nextPlay = !isPlayingBrief;
                  setIsPlayingBrief(nextPlay);
                  if (nextPlay) {
                    playGentleAudioSynthesizer(currentBrief.melodyHz);
                  }
                }}
                aria-label={isPlayingBrief ? (isEn ? 'Pause daily audio brief' : 'إيقاف البودكاست اليومي') : isEn ? 'Play daily audio brief' : 'تشغيل البودكاست اليومي'}
                className={`w-11 h-11 rounded-2xl flex items-center justify-center text-base font-black shrink-0 transition-all cursor-pointer shadow-xs ${
                  isPlayingBrief
                    ? 'bg-[#FF8C61] text-white scale-105'
                    : 'bg-[#0d9488] hover:bg-[#0f766e] text-white'
                }`}
              >
                {isPlayingBrief ? '⏸' : '▶'}
              </button>

              <div className="min-w-0 flex-1 space-y-0.5">
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-extrabold text-[#0d9488] dark:text-[#2DD4BF]">
                  <span>🎙️ {isEn ? currentBrief.slotLabelEn : currentBrief.slotLabelAr}</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-[var(--color-muted)] dark:text-[#94A3B8]">
                    {isEn ? currentBrief.hostsEn : currentBrief.hostsAr}
                  </span>
                </div>
                <h2 className="text-xs sm:text-sm font-black text-[var(--color-text)] dark:text-[#F8FAFC] leading-snug break-words">
                  {isEn ? currentBrief.titleEn : currentBrief.titleAr}
                </h2>
              </div>
            </div>

            {/* Clean Acoustic Waveform Bars + Rotating 1-Minute Episode Switcher Controls */}
            <div className="flex items-center gap-2.5 shrink-0">
              <div
                data-testid="audio-brief-waveforms"
                aria-hidden="true"
                className="hidden sm:flex items-center gap-1 h-7 px-2.5 rounded-2xl bg-teal-500/8 dark:bg-[#0B131A]/60 border border-teal-500/15"
              >
                {[10, 18, 13, 22, 15, 24, 12, 19, 14, 21, 11, 16].map((barH, idx) => {
                  const activeBar = Math.floor((briefElapsedSec / 60) * 12);
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

              <span className="text-xs font-black tabular-nums text-[#0d9488] dark:text-[#2DD4BF] px-2.5 py-1 rounded-xl bg-teal-500/10">
                00:{String(briefElapsedSec).padStart(2, '0')} / {currentBrief.durationLabel}
              </span>
              <button
                type="button"
                data-testid="audio-brief-next-btn"
                onClick={() => {
                  const nextIdx = (activeBriefIdx + 1) % DAILY_AUDIO_BRIEFS.length;
                  setActiveBriefIdx(nextIdx);
                  setBriefElapsedSec(0);
                  playGentleAudioSynthesizer(DAILY_AUDIO_BRIEFS[nextIdx].melodyHz);
                }}
                className="min-h-[36px] px-3 py-1.5 rounded-2xl border border-[var(--color-border)] dark:border-[#1E3646] bg-white/90 dark:bg-[#101D26] hover:border-[#0d9488] text-xs font-extrabold text-[var(--color-text)] dark:text-[#F8FAFC] cursor-pointer"
              >
                {isEn ? 'Next Brief ⏭' : 'الكبسولة التالية ⏮'}
              </button>
            </div>
          </div>

          {/* Sleek Audio Progress Bar */}
          <div className="w-full h-1.5 rounded-full bg-teal-950/10 dark:bg-[#0B131A] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#0d9488] to-[#FF8C61] transition-all duration-300"
              style={{ width: `${Math.min(100, Math.round((briefElapsedSec / 60) * 100))}%` }}
            />
          </div>

          {/* Brief Summary & Takeaway */}
          <p className="text-xs font-semibold text-[var(--color-muted)] dark:text-[#CBD5E1] leading-relaxed">
            {isEn ? currentBrief.summaryEn : currentBrief.summaryAr}{' '}
            <strong className="text-[var(--color-text)] dark:text-[#F8FAFC]">
              {isEn ? currentBrief.takeawayEn : currentBrief.takeawayAr}
            </strong>
          </p>
        </div>
      </div>

      {/* =====================================================================
          2. DYNAMIC TIME-AWARE DAILY WISDOM (بوصلة اليوم)
          ===================================================================== */}
      <div
        id="home-daily-parenting-wisdom"
        data-testid="home-daily-parenting-wisdom"
        className="rounded-3xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-surface)] dark:bg-[#101D26] p-5 sm:p-6 space-y-4 shadow-sm"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[var(--color-border)]/60 dark:border-[#1E3646]">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-xl bg-teal-500/15 text-[#0d9488] dark:text-[#2DD4BF] text-xs font-black">
              {isEn ? dailyCompassWisdom.badgeEn : dailyCompassWisdom.badgeAr}
            </span>
          </div>

          {/* Time-of-Day Wisdom Preview Switcher */}
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

        <div className="space-y-2">
          <h2 className="text-base sm:text-lg font-black text-[var(--color-text)] dark:text-[#F8FAFC] leading-snug">
            {isEn ? dailyCompassWisdom.titleEn : dailyCompassWisdom.titleAr}
          </h2>
          <p className="text-xs sm:text-sm font-semibold text-[var(--color-muted)] dark:text-[#CBD5E1] leading-relaxed">
            {isEn ? dailyCompassWisdom.bodyEn : dailyCompassWisdom.bodyAr}
          </p>
        </div>

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
            <button
              type="button"
              onClick={() => navigateTo('assistant')}
              className="min-h-[38px] px-3.5 py-1.5 rounded-xl border border-[#0d9488]/40 bg-teal-500/10 hover:bg-teal-500/20 text-[#0d9488] dark:text-[#2DD4BF] text-xs font-extrabold transition-all cursor-pointer"
            >
              {isEn ? 'Ask AI Advisor →' : 'اسأل المستشار الذكي ←'}
            </button>
          </div>
        </div>
      </div>

      {/* =====================================================================
          3. HEROES, PASSIONS & LIFE ARENA (عالم الأبطال والشغف — حمزة وليلى ويوسف)
          ===================================================================== */}
      <div
        id="home-heroes-passions-arena"
        data-testid="home-heroes-passions-arena"
        className="rounded-3xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-surface)] dark:bg-[#101D26] p-5 sm:p-6 space-y-4 shadow-sm"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="space-y-0.5">
            <div className="inline-flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-300 flex items-center justify-center text-base">
                🏅
              </span>
              <h2 className="text-base sm:text-lg font-black text-[var(--color-text)] dark:text-[#F8FAFC]">
                {isEn
                  ? 'Heroes, Passions & Life Arena (Hamza, Laila & Youssef)'
                  : 'عالم الأبطال والشغف · محطات نمو حمزة وليلى ويوسف'}
              </h2>
            </div>
            <p className="text-xs font-semibold text-[var(--color-muted)] dark:text-[#94A3B8]">
              {isEn
                ? 'Live developmental feed tracking infant milestones, nursery creativity, and school/sports passions'
                : 'متابعة حية لإنجازات حمزة الحسية، عالم ليلى الإبداعي في الحضانة، وشغف يوسف الرياضي والمدرسي'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigateTo('children')}
            className="min-h-[38px] px-3.5 py-1.5 rounded-xl border border-teal-500/35 bg-teal-500/10 text-[#0d9488] dark:text-[#2DD4BF] text-xs font-extrabold cursor-pointer"
          >
            {isEn ? '3D Profiles & Growth →' : 'ملفات الأبطال 3D ←'}
          </button>
        </div>

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

                  {/* Unboxed clean metadata / passion tags with typographic separator */}
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
                      {isEn ? `Cheer (${cheerCount})` : `تشجيع البطل (${cheerCount})`}
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
      </div>

      {/* =====================================================================
          4. MICRO-MOMENTS VOICE VAULT (10S) & BEDTIME STORY INSPIRATION
          ===================================================================== */}
      <div
        id="home-soulful-vault-and-story"
        data-testid="home-soulful-vault-and-story"
        className="grid grid-cols-1 lg:grid-cols-2 gap-4"
      >
        {/* Left Card: 10-Second Micro-Moments Voice Vault Logger */}
        <div
          id="home-voice-vault-card"
          data-testid="home-voice-vault-card"
          className="rounded-3xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-surface)] dark:bg-[#101D26] p-5 flex flex-col justify-between gap-4 shadow-sm"
        >
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="inline-flex items-center gap-2">
                <span className="w-9 h-9 rounded-xl bg-teal-500/15 text-[#0d9488] dark:text-[#2DD4BF] flex items-center justify-center text-lg">
                  🎙️
                </span>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-[var(--color-text)] dark:text-[#F8FAFC]">
                    {isEn
                      ? 'Micro-Moments Voice Vault (10s Logger)'
                      : 'خزينة اللقطات الصوتية العفوية (١٠ ثوانٍ)'}
                  </h3>
                  <p className="text-xs font-semibold text-[var(--color-muted)] dark:text-[#94A3B8]">
                    {isEn
                      ? 'Preserve first laughs, new words & proud moments in 10 seconds'
                      : 'وثّق أول ضحكة لحمزة، حكايات ليلى، أو إنجاز يوسف في ١٠ ثوانٍ'}
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-teal-500/15 text-[#0d9488] dark:text-[#2DD4BF] text-xs font-black tabular-nums">
                {isRecordingVault
                  ? `🔴 00:${String(10 - vaultElapsedSec).padStart(2, '0')}s`
                  : isEn
                  ? '10s Memory'
                  : 'تسجيل فوري ١٠ث'}
              </span>
            </div>

            {/* Child Selector + Tag Selector */}
            <div className="flex flex-wrap items-center gap-1.5">
              {state.kids.map((k) => {
                const isSelected = k.id === (targetVaultKid?.id ?? 1);
                return (
                  <button
                    key={k.id}
                    type="button"
                    onClick={() => setVaultKidId(k.id)}
                    className={`min-h-[34px] px-3 py-1 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#0d9488] text-white border-[#0d9488]'
                        : 'bg-[var(--color-control-muted)] dark:bg-[#142430] text-[var(--color-text)] dark:text-[#F8FAFC] border-[var(--color-border)] dark:border-[#1E3646]'
                    }`}
                  >
                    {k.emoji} {locText(k.name, lang)}
                  </button>
                );
              })}
              {['أول ضحكة 👶🏻', 'كلمة جديدة 💬', 'حكاية الحضانة 🎨', 'فخر وإنجاز 🏆'].map((tg) => (
                <button
                  key={tg}
                  type="button"
                  onClick={() => setVaultSelectedTag(tg)}
                  className={`min-h-[34px] px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                    vaultSelectedTag === tg
                      ? 'border-[#FF8C61] bg-[#FF8C61]/15 text-[#c2410c] dark:text-[#FF8C61]'
                      : 'border-[var(--color-border)] dark:border-[#1E3646] text-[var(--color-muted)]'
                  }`}
                >
                  {tg}
                </button>
              ))}
            </div>

            {/* Input + 10s Record Button */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="text"
                value={vaultDraftTitle}
                onChange={(e) => setVaultDraftTitle(sanitizeUserText(e.target.value, 120))}
                placeholder={
                  isEn
                    ? 'Name this 10-second voice memory...'
                    : 'اكتب عنوان اللقطة الصوتية (مثال: ضحكة حمزة، جملة ليلى الطريفة)...'
                }
                className="flex-1 min-h-[42px] rounded-xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-bg)] dark:bg-[#142430] px-3 py-2 text-xs font-semibold text-[var(--color-text)] dark:text-[#F8FAFC]"
              />
              {isRecordingVault ? (
                <button
                  type="button"
                  data-testid="home-voice-vault-stop-btn"
                  onClick={() => finalizeHomeVaultRecording(Math.max(1, vaultElapsedSec))}
                  className="min-h-[42px] px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black cursor-pointer shrink-0"
                >
                  ⏹ {isEn ? `Save (${10 - vaultElapsedSec}s)` : `حفظ اللقطة (${10 - vaultElapsedSec}ث)`}
                </button>
              ) : (
                <button
                  type="button"
                  data-testid="home-voice-vault-record-btn"
                  onClick={() => {
                    setIsRecordingVault(true);
                    setVaultElapsedSec(0);
                    playGentleAudioSynthesizer([440.0, 523.25]);
                  }}
                  className="min-h-[42px] px-4 py-2 rounded-xl bg-[#0d9488] hover:bg-[#0f766e] text-white text-xs font-black cursor-pointer shrink-0"
                >
                  🎙️ {isEn ? 'Record 10s' : 'سجّل ١٠ ثوانٍ'}
                </button>
              )}
            </div>

            {/* Latest Recorded Moments Preview */}
            <div className="space-y-1.5 pt-1">
              {combinedVoiceMoments.slice(0, 2).map((vm) => {
                const isPlaying = playingVaultId === vm.id;
                return (
                  <div
                    key={vm.id}
                    className="rounded-xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-muted)]/40 dark:bg-[#142430] px-3 py-2 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-extrabold text-[var(--color-text)] dark:text-[#F8FAFC] truncate">
                        {vm.title}
                      </div>
                      <div className="text-[11px] font-semibold text-[var(--color-muted)] dark:text-[#94A3B8]">
                        {vm.tag} · {vm.durationSec}s
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (isPlaying) {
                          setPlayingVaultId(null);
                        } else {
                          setPlayingVaultId(vm.id);
                          playGentleAudioSynthesizer(vm.melodyHz);
                          window.setTimeout(() => setPlayingVaultId(null), 2000);
                        }
                      }}
                      className="min-h-[34px] px-3 py-1 rounded-xl bg-teal-500/15 text-[#0d9488] dark:text-[#2DD4BF] text-xs font-black cursor-pointer shrink-0"
                    >
                      {isPlaying ? (isEn ? '🔊 Playing' : '🔊 يعمل') : isEn ? '▶ Listen' : '▶ استماع'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Card: Bedtime Story Inspiration & Warm Evening Mode */}
        <div
          id="home-bedtime-story-inspiration"
          data-testid="home-bedtime-story-inspiration"
          className="rounded-3xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-surface)] dark:bg-[#101D26] p-5 flex flex-col justify-between gap-4 shadow-sm"
        >
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="inline-flex items-center gap-2">
                <span className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-300 flex items-center justify-center text-lg">
                  📖
                </span>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-[var(--color-text)] dark:text-[#F8FAFC]">
                    {isEn
                      ? 'Bedtime Story Inspiration (Tonight’s Prompt)'
                      : 'إلهام حدوتة ما قبل النوم (لبطولة حمزة وليلى ويوسف)'}
                  </h3>
                  <p className="text-xs font-semibold text-[var(--color-muted)] dark:text-[#94A3B8]">
                    {isEn
                      ? ' Personalized 3-minute storytelling spark for calm screen-free nights'
                      : 'فكرة حدوتة دافئة في ٣ دقائق تجمع الأولاد بدون شاشات قبل النوم'}
                  </p>
                </div>
              </div>

              {onToggleBedtimeMode && (
                <button
                  type="button"
                  data-testid="home-bedtime-filter-btn"
                  onClick={onToggleBedtimeMode}
                  className={`min-h-[36px] px-3 py-1 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                    bedtimeMode
                      ? 'bg-amber-500 text-slate-950 border-amber-500'
                      : 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/35'
                  }`}
                >
                  🌙 {bedtimeMode ? (isEn ? 'Bedtime Filter: ON' : 'إضاءة المساء: مفعّلة') : isEn ? 'Warm Bedtime Light' : 'تفعيل إضاءة المساء'}
                </button>
              )}
            </div>

            {/* Theme Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              {bedtimeStoryPrompts.map((sp, idx) => (
                <button
                  key={sp.id}
                  type="button"
                  onClick={() => setStoryThemeIdx(idx)}
                  className={`min-h-[34px] px-3 py-1 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                    storyThemeIdx === idx
                      ? 'bg-[#FF8C61] text-white border-[#FF8C61]'
                      : 'bg-[var(--color-control-muted)] dark:bg-[#142430] text-[var(--color-text)] dark:text-[#F8FAFC] border-[var(--color-border)] dark:border-[#1E3646]'
                  }`}
                >
                  {isEn ? sp.themeEn : sp.themeAr}
                </button>
              ))}
            </div>

            {/* Story Prompt Box */}
            <div className="rounded-2xl border border-amber-500/30 bg-amber-50/50 dark:bg-[#142430] p-3.5 space-y-1.5">
              <h4 className="text-xs sm:text-sm font-black text-[var(--color-text)] dark:text-[#F8FAFC] leading-snug">
                {isEn ? currentStoryPrompt.titleEn : currentStoryPrompt.titleAr}
              </h4>
              <p className="text-xs font-semibold text-[var(--color-muted)] dark:text-[#CBD5E1] leading-relaxed">
                {isEn ? currentStoryPrompt.promptEn : currentStoryPrompt.promptAr}
              </p>
              <div className="text-[11px] font-extrabold text-[#0d9488] dark:text-[#2DD4BF] pt-1">
                ✨ {isEn ? currentStoryPrompt.moralEn : currentStoryPrompt.moralAr}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 pt-2 border-t border-[var(--color-border)]/60 dark:border-[#1E3646]">
            <button
              type="button"
              onClick={() => setStoryThemeIdx((prev) => (prev + 1) % bedtimeStoryPrompts.length)}
              className="min-h-[36px] px-3 py-1.5 rounded-xl border border-[var(--color-border)] dark:border-[#1E3646] text-xs font-extrabold text-[var(--color-text)] dark:text-[#F8FAFC] cursor-pointer"
            >
              🔄 {isEn ? 'Another Story Idea' : 'فكرة حدوتة أخرى'}
            </button>
            <button
              type="button"
              onClick={() =>
                onAddSuggestedRoutineTask?.(
                  isEn ? `Bedtime Story: ${currentStoryPrompt.titleEn}` : `حدوتة المساء: ${currentStoryPrompt.titleAr}`,
                  '08:15 م',
                  null
                )
              }
              className="min-h-[36px] px-3.5 py-1.5 rounded-xl bg-[#FF8C61] hover:bg-[#e86a3d] text-white text-xs font-extrabold cursor-pointer"
            >
              + {isEn ? 'Schedule Tonight 8:15 PM' : 'جدولة الليلة 8:15 م'}
            </button>
          </div>
        </div>
      </div>

      {/* =====================================================================
          5. REFINED KIDS CAROUSEL & ELEVATED MODULAR CARDS (ملفات الأطفال)
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
                      <div className="text-sm sm:text-base font-black text-[var(--color-text)] dark:text-[#F8FAFC] leading-snug break-words">
                        {displayKidName}
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold text-[#0d9488] dark:text-[#2DD4BF]">
                        <span>{ageInfo.label}</span>
                        <span aria-hidden="true">·</span>
                        <span className="text-amber-800 dark:text-amber-300">{ageInfo.stageTitle}</span>
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

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--color-border)]/60 dark:border-[#1E3646] w-full">
                  <span className="text-[11px] font-bold text-[var(--color-muted)] dark:text-[#CBD5E1] leading-snug break-words">
                    🎨 {kidInterests}
                  </span>
                  <StarOfTheDayCrownBadge
                    language={lang}
                    completedCount={Math.max(1, kidDoneCount)}
                  />
                </div>

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
          6. DAILY ESSENTIALS HUB (3-LAYER MODULAR CARDS: NUTRITION, HYDRATION, SPORTS)
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
            topLeftBadge={<span>{isEn ? currentNutrition.badgeEn : currentNutrition.badgeAr}</span>}
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
          7. INTERACTIVE FAMILY PULSE BAROMETER
          ===================================================================== */}
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

      {/* =====================================================================
          8. MINIMALIST GATEWAYS GRID (Clean, Icon-Driven Navigation Tiles)
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
              <div className="flex flex-wrap items-center justify-between gap-1.5 w-full">
                <SoftFilledIcon id={gw.iconId} boxSize="sm" />
                <span className="text-[10.5px] font-bold text-[#0d9488] dark:text-[#2DD4BF] leading-snug break-words">
                  {isEn ? gw.statEn : gw.statAr}
                </span>
              </div>
              <div className="space-y-1 min-w-0">
                <div className="text-xs sm:text-sm font-black text-[var(--color-text)] dark:text-[#F8FAFC] leading-snug break-words flex items-center justify-between gap-1">
                  <span className="leading-snug break-words">{isEn ? gw.titleEn : gw.titleAr}</span>
                  <span className="text-[11px] opacity-50 group-hover:opacity-100 transition-opacity shrink-0">
                    {isEn ? '→' : '←'}
                  </span>
                </div>
                <p className="text-[11px] font-semibold text-[var(--color-muted)] dark:text-[#94A3B8] leading-snug break-words">
                  {isEn ? gw.subEn : gw.subAr}
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* Expandable Store Sub-Categories Drawer */}
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
                  <div className="text-xs font-extrabold text-[var(--color-text)] dark:text-[#F8FAFC] leading-snug break-words">
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
      </div>
    </section>
  );
};

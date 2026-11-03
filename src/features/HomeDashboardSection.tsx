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
import { HomeVisualDiscovery } from './HomeVisualDiscovery';
import { DailyChildJournal, type JournalRecordType } from './DailyChildJournal';
import { HomeContentTracks } from './HomeContentTracks';
import { HomeValuesTrackSection } from './HomeValuesTrackSection';
import { HomeLearningTrackSection } from './HomeLearningTrackSection';
import { createChildLifeRecord, fetchDailyChildLifeRecords, fetchRecentChildLifeRecords, type DailyChildLifeRecord } from '../services/supabaseService';
import {
  buildDailyWelcomePersonalization,
  extractProfileSignals,
  getSafeFavoriteFood,
} from '../domain/contentRecommendationEngine';

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
      className={`relative overflow-hidden bg-gradient-to-br from-white via-white to-slate-50/80 dark:from-[#101D26] dark:via-[#101D26] dark:to-[#142430] shadow-[0_8px_24px_-18px_rgba(15,23,42,0.28)] rounded-3xl p-4 sm:p-5 border ${borderClass} space-y-4 transition-all duration-300 ease-in-out hover:shadow-[0_14px_30px_-20px_rgba(13,148,136,0.34)] ${isOpen ? 'ring-1 ring-teal-500/15' : ''}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <button
          type="button"
          data-testid={`${testId}-toggle-btn`}
          aria-expanded={isOpen}
          onClick={onToggle}
          className="min-h-[52px] flex-1 min-w-0 flex items-center justify-between gap-3 rounded-2xl text-start active:scale-[0.99] transition-all duration-300 ease-in-out cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <span
              className={`w-12 h-12 rounded-2xl ${iconBgClass} flex items-center justify-center text-xl shrink-0 shadow-sm ring-1 ring-black/[0.03] dark:ring-white/[0.06]`}
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
          className="pt-4 border-t border-slate-100/90 dark:border-[#1E3646] space-y-4 animate-page-enter transition-all duration-300 ease-in-out"
        >
          {children}
        </div>
      )}
    </div>
  );
};


interface HomeContentGroupHeadingProps {
  id: string;
  title: string;
  description: string;
  step: string;
}

const HomeContentGroupHeading: React.FC<HomeContentGroupHeadingProps> = ({
  id,
  title,
  description,
  step,
}) => (
  <div id={id} data-testid={id} className="relative flex items-center gap-3 overflow-hidden rounded-2xl border border-teal-500/15 bg-gradient-to-r from-teal-50/90 via-white to-sky-50/70 px-3.5 py-3 shadow-sm dark:from-[#122A30] dark:via-[#101D26] dark:to-[#142430] dark:border-[#24505A]">
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-teal-500/20 bg-teal-500/10 text-sm font-black text-teal-800 dark:text-teal-200">
      {step}
    </span>
    <div className="min-w-0 flex-1">
      <h2 className="text-sm font-black text-[var(--color-text)] dark:text-white">{title}</h2>
      <p className="mt-0.5 text-[11px] leading-relaxed text-[var(--color-muted)] dark:text-[#94A3B8]">{description}</p>
    </div>
    <span aria-hidden="true" className="h-px min-w-5 flex-1 bg-gradient-to-l from-teal-500/35 to-transparent" />
  </div>
);

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
    quickTrack: true,
    dailyWisdom: false,
    heroesArena: false,
    bedtimeStories: false,
    dailyEssentials: false,
    parentingSupport: false,
    learningTrack: false,
    valuesTrack: false,
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
  const [isReadingCompass, setIsReadingCompass] = useState(false);

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
  const [recentRecordsByKid, setRecentRecordsByKid] = useState<Record<number, DailyChildLifeRecord[]>>({});
  const [todayRecordsByKid, setTodayRecordsByKid] = useState<Record<number, DailyChildLifeRecord[]>>({});
  const savingDashboardActionKeysRef = useRef(new Set<string>());

  // Daily Essentials Interactive State
  const [selectedMealSlot, setSelectedMealSlot] = useState<'breakfast' | 'lunchbox' | 'snack'>('lunchbox');
  const [waterCupsByKid, setWaterCupsByKid] = useState<Record<number, number>>({});
  const [selectedSportSlot, setSelectedSportSlot] = useState<'outdoor' | 'balance' | 'cardio'>('outdoor');
  const [completedSportByKid, setCompletedSportByKid] = useState<Record<number, boolean>>({});
  const [showPromoShowcase, setShowPromoShowcase] = useState<boolean>(true);

  const activeCity = state.city || getDefaultCityForCountry(state.country);
  const localizedCity = locText(activeCity, lang);

  // Active child for Quick Tracking & Daily Essentials
  const activeKid = state.kids[selectedKidIdx] || state.kids[0];
  const activeKidId = activeKid?.id ?? -1;
  const activeKidAge = activeKid ? calculateChildAge(activeKid.birth, lang) : null;
  const activeKidName = activeKid ? locText(activeKid.name, lang) : isEn ? 'your child' : 'طفلك';
  const activeKidRecentRecords = recentRecordsByKid[activeKidId] ?? [];
  const activeKidSignals = useMemo(
    () => activeKid
      ? extractProfileSignals({ child: activeKid, language: lang, recentRecords: activeKidRecentRecords })
      : null,
    [activeKid, activeKidRecentRecords, lang]
  );
  const activeKidFavoriteFood = getSafeFavoriteFood(activeKid?.profileDetails);
  const latestSportRecord = activeKidRecentRecords.find((record) => record.record_type === 'sports');

  // Hydrate the dashboard's one-tap indicators from today's real family records.
  useEffect(() => {
    const savedChildren = state.kids.filter((kid) => typeof kid.remoteId === 'string' && kid.remoteId);
    if (!state.verifiedFamilyId || savedChildren.length === 0) {
      setQuickPulseByKid({});
      setRecentRecordsByKid({});
      setTodayRecordsByKid({});
      return;
    }
    let active = true;
    const childRemoteIds = savedChildren.map((kid) => String(kid.remoteId));
    void fetchRecentChildLifeRecords(childRemoteIds, 14).then(({ records }) => {
      if (!active) return;
      const remoteToLocal = new Map(savedChildren.map((kid) => [String(kid.remoteId), kid.id]));
      const grouped: Record<number, DailyChildLifeRecord[]> = {};
      for (const record of records) {
        const localId = remoteToLocal.get(record.child_id);
        if (localId === undefined) continue;
        (grouped[localId] ||= []).push(record);
      }
      setRecentRecordsByKid(grouped);
    });
    void fetchDailyChildLifeRecords(childRemoteIds).then(({ records }) => {
      if (!active) return;
      const remoteToLocal = new Map(savedChildren.map((kid) => [String(kid.remoteId), kid.id]));
      const next: typeof quickPulseByKid = {};
      const groupedToday: Record<number, DailyChildLifeRecord[]> = {};
      const hydration: Record<number, number> = {};
      const sports: Record<number, boolean> = {};
      for (const record of records) {
        const localId = remoteToLocal.get(record.child_id);
        if (localId === undefined) continue;
        (groupedToday[localId] ||= []).push(record);
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
      setTodayRecordsByKid(groupedToday);
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

  const saveJournalEntry = async (recordType: JournalRecordType,title: string,notes: string,details: Record<string,unknown>,occurredAt: string):Promise<boolean>=>{
    if(!activeKid?.remoteId){onShowToast?.(isEn?'Save this child profile to the family first.':'احفظ ملف الطفل في حساب الأسرة أولًا قبل تسجيل اليوم.');return false;}
    const result=await createChildLifeRecord({childRemoteId:activeKid.remoteId,recordType,title,notes,details:{...details,source:'daily_child_journal'},occurredAt});
    if(result.error||!result.record){onShowToast?.(isEn?'Could not save this moment: '+(result.error||'Unknown error'):'تعذر حفظ اللحظة: '+(result.error||'خطأ غير معروف'));return false;}
    setTodayRecordsByKid(p=>({...p,[activeKidId]:[result.record!,...(p[activeKidId]||[])]}));
    setRecentRecordsByKid(p=>({...p,[activeKidId]:[result.record!,...(p[activeKidId]||[])].slice(0,40)}));
    onShowToast?.(isEn?'Saved to '+activeKidName+'’s timeline ✓':'اتحفظت اللحظة في سجل '+activeKidName+' بنجاح ✓');return true;
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

  const welcomePersonalization = useMemo(
    () =>
      buildDailyWelcomePersonalization({
        child: activeKid ?? null,
        parentDisplayNameAr: activeParentDisplayNameAr,
        parentDisplayNameEn: activeParentNameEn,
        timeBucket: effectiveTimeBucket,
        recentRecords: activeKidRecentRecords,
      }),
    [activeKid, activeParentDisplayNameAr, activeParentNameEn, effectiveTimeBucket, activeKidRecentRecords]
  );

  // Time-of-Day Dynamic Parenting Wisdom
  const dailyCompassWisdom = welcomePersonalization.compass;

  const toggleCompassReadAloud = () => {
    if (!('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') {
      setIsReadingCompass(false);
      onShowToast?.(isEn ? 'Audio reading is not available on this device.' : 'القراءة الصوتية مش متاحة على الجهاز ده.');
      return;
    }
    if (isReadingCompass && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
      setIsReadingCompass(false);
      return;
    }
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setIsReadingCompass(true);
      return;
    }
    window.speechSynthesis.cancel();
    const spokenText = [
      isEn ? dailyCompassWisdom.titleEn : dailyCompassWisdom.titleAr,
      isEn ? dailyCompassWisdom.bodyEn : dailyCompassWisdom.bodyAr,
      isEn ? dailyCompassWisdom.quoteEn : dailyCompassWisdom.quoteAr,
      isEn ? dailyCompassWisdom.actionLabelEn : dailyCompassWisdom.actionLabelAr,
    ].join('. ');
    const utterance = new SpeechSynthesisUtterance(spokenText);
    utterance.lang = isEn ? 'en-US' : 'ar-EG';
    utterance.rate = 0.95;
    utterance.onstart = () => setIsReadingCompass(true);
    utterance.onend = () => setIsReadingCompass(false);
    utterance.onerror = () => setIsReadingCompass(false);
    setIsReadingCompass(true);
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => () => window.speechSynthesis?.cancel(), []);

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
          titleAr: activeKidFavoriteFood
            ? `فكرة سناك باستخدام ${activeKidFavoriteFood} لـ ${activeKidName}`
            : `وجبة خفيفة مفضلة لدى ${activeKidName}`,
          titleEn: activeKidFavoriteFood
            ? `A snack idea using ${locText(activeKidFavoriteFood, lang)} for ${activeKidName}`
            : `A snack ${activeKidName} enjoys`,
          descAr: activeKidFavoriteFood
            ? 'هذا الطعام مسجل كمفضل في ملف الطفل. راعوا الكمية والملاءمة العمرية وطريقة التقديم الآمنة.'
            : 'لا نقترح طعامًا محددًا هنا؛ راجعوا القيود والتفضيلات المسجلة قبل اختيار الوجبة.',
          descEn: activeKidFavoriteFood
            ? 'This food is recorded as a favorite. Consider age suitability, serving size and safe preparation.'
            : 'No specific food is suggested here; review recorded restrictions and preferences before choosing.',
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
  }, [activeKid?.birth, activeKid?.profileDetails, activeKidAge?.months, activeKidAge?.stageCode, activeKidFavoriteFood, activeKidName, lang]);

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
      const preferredSport = activeKidSignals?.sports[0];
      const localizedSport = preferredSport ? locText(preferredSport, lang) : null;
      const recentSportNoteAr = latestSportRecord?.title ? ` آخر نشاط مسجل: ${latestSportRecord.title}.` : '';
      const recentSportNoteEn = latestSportRecord?.title ? ` Last logged activity: ${latestSportRecord.title}.` : '';
      return {
        outdoor: {
          badgeAr: preferredSport ? `🏅 رياضة ${preferredSport}` : '🏊‍♂️ رياضة واستقلالية حركية',
          badgeEn: preferredSport ? `🏅 ${localizedSport} activity` : '🏊‍♂️ Swimming & Athletic Agility',
          titleAr: preferredSport
            ? `نشاط ${preferredSport} مناسب لعمر ${activeKidName}`
            : `٤٠ دقيقة نشاط حركي مناسب للعمر لـ ${activeKidName}`,
          titleEn: preferredSport
            ? `Age-aware ${localizedSport} activity for ${activeKidName}`
            : `40-Min Age-Aware Physical Activity for ${activeKidName}`,
          descAr: preferredSport
            ? `ابدؤوا بوقت قصير يناسب قدرة الطفل، وبإشراف مناسب. لا حاجة لفرض تدريب أو منافسة.${recentSportNoteAr}`
            : 'اختاروا نشاطًا يحبه الطفل، وراعوا قدرته وإشراف شخص بالغ وتوازن الحركة مع الراحة.',
          descEn: preferredSport
            ? `Start with a short session suited to the child’s ability and appropriate supervision; there is no need to force training or competition.${recentSportNoteEn}`
            : 'Choose a movement activity the child enjoys, with suitable supervision and a balance of activity and rest.',
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
  }, [activeKidAge?.stageCode, activeKidName, activeKidSignals?.sports, lang, latestSportRecord?.title]);

  const currentSport = sportActivities[selectedSportSlot];
  const isSportDoneToday = Boolean(completedSportByKid[activeKidId]);
  const sportActionKey = `${activeKidId}:sports`;
  const isSportSaving = Boolean(savingDashboardActions[sportActionKey]);

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
      className="space-y-5 sm:space-y-6 pb-3"
      aria-label={isEn ? 'Nekbaar Family Home Dashboard' : 'لوحة العائلة الرئيسية — نكبر'}
    >
      {/* =====================================================================
          1. PERSONALIZED WELCOME & PARENT WELLBEING
          ===================================================================== */}
      <div
        id="home-core-value-hero"
        data-testid="home-core-value-hero"
        data-parent-profile={parentProfileSpec.role}
        dir={isEn ? 'ltr' : 'rtl'}
        style={{
          borderColor: isMotherActive ? 'rgba(225, 29, 72, 0.35)' : 'rgba(13, 148, 136, 0.38)',
        }}
        className="relative overflow-hidden bg-gradient-to-br from-white via-white to-teal-50/40 dark:from-[#101D26] dark:via-[#101D26] dark:to-[#142430] shadow-[0_12px_32px_-22px_rgba(15,23,42,0.35)] rounded-3xl p-4 sm:p-5 border border-slate-100 dark:border-[#1E3646] flex flex-col justify-between gap-4 transition-all duration-300 ease-in-out"
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
              <span
                data-testid="home-welcome-time-badge"
                className="px-2.5 py-1 rounded-full text-[11px] font-black border border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300"
              >
                {isEn ? welcomePersonalization.timeBadgeEn : welcomePersonalization.timeBadgeAr}
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
            </div>
          </div>

          <div className="space-y-2">
            <h1
              id="home-main-greeting-heading"
              className="text-xl font-bold text-[var(--color-text)] dark:text-[#F8FAFC] leading-snug"
            >
              {isEn ? welcomePersonalization.greetingEn : welcomePersonalization.greetingAr}
            </h1>
            <p
              data-testid="home-welcome-personalized-summary"
              className="text-sm leading-relaxed text-gray-600 dark:text-[#CBD5E1]"
            >
              {isEn ? welcomePersonalization.summaryEn : welcomePersonalization.summaryAr}
            </p>

            {activeKid && (
              <div id="home-child-profile-picker" data-testid="home-welcome-child-context" className="space-y-3 rounded-3xl border border-teal-500/20 bg-gradient-to-br from-teal-50/80 via-white to-sky-50/70 p-3 dark:from-[#142B35] dark:via-[#101D26] dark:to-[#142430]">
                <div className="flex items-center justify-between gap-2"><div><p className="text-xs font-black">{isEn?'Who are we spending time with today?':'مين معانا النهارده؟'}</p><p className="mt-1 text-[10px] text-[var(--color-muted)]">{isEn?'Choose a profile; the home adapts to them.':'اختار ملف الطفل والمحتوى هيتظبط تلقائيًا عليه.'}</p></div><span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black text-teal-800 dark:bg-[#0B131A]">{state.kids.length} {isEn?'profiles':'ملفات'}</span></div>
                <div className="flex snap-x gap-2.5 overflow-x-auto pb-1">{state.kids.map((kid,idx)=>{const selected=idx===selectedKidIdx;const age=calculateChildAge(kid.birth,lang);return <button key={kid.id} type="button" data-testid={`home-welcome-kid-pill-${kid.id}`} aria-pressed={selected} onClick={()=>setSelectedKidIdx(idx)} className={`relative flex min-w-[132px] snap-start flex-col items-center gap-1.5 rounded-2xl border px-3 py-3 text-center ${selected?'border-teal-600 bg-teal-700 text-white shadow-lg':'border-[var(--color-border)] bg-white/85 text-[var(--color-text)] dark:border-[#29404D] dark:bg-[#101D26] dark:text-white'}`}><span className="grid h-14 w-14 place-items-center overflow-hidden rounded-full bg-teal-500/10">{kid.photoDataUrl&&!kid.useIllustratedAvatar?<img src={kid.photoDataUrl} alt="" className="h-full w-full object-cover"/>:<span className="text-3xl">{kid.emoji}</span>}</span><b className="max-w-full truncate text-xs">{locText(kid.name,lang)}</b><span className="text-[10px] opacity-75">{age?.label||(isEn?'Age not set':'العمر غير محدد')}</span>{selected&&<span className="absolute end-2 top-2 rounded-full bg-white px-1 text-teal-800">✓</span>}</button>})}</div>
                <div className="flex flex-wrap gap-1.5"><span data-testid="home-welcome-child-age-badge" className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black text-teal-800 dark:bg-[#0B131A]">{isEn?welcomePersonalization.ageLabelEn:welcomePersonalization.ageLabelAr}</span>{(isEn?welcomePersonalization.topInterestsEn:welcomePersonalization.topInterestsAr).map(interest=><span key={interest} data-testid="home-welcome-child-interest-tag" className="rounded-full bg-teal-500/10 px-2.5 py-1 text-[10px] font-bold text-teal-800 dark:text-teal-200">🌱 {interest}</span>)}</div>
              </div>
            )}
            <button
              type="button"
              data-testid="home-start-daily-checkin"
              onClick={() => document.getElementById('home-one-handed-quick-pulse')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className="mt-2 inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-teal-700 px-4 py-3 text-xs font-black text-white shadow-sm transition-all hover:bg-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 active:scale-[.98]"
            >
              <span aria-hidden="true">⚡</span>
              {activeKid
                ? isEn
                  ? `Start ${activeKidName}'s daily check-in`
                  : `ابدأ بمتابعة يوم ${activeKidName}`
                : isEn
                ? "Start today's child check-in"
                : 'ابدأ بمتابعة يوم طفلك'}
              <span aria-hidden="true">{isEn ? '→' : '←'}</span>
            </button>
          </div>
        </div>

        <div data-testid="home-parent-wellbeing-card" className="rounded-2xl border border-rose-200/70 dark:border-rose-900/40 bg-gradient-to-br from-rose-50/90 via-white to-teal-50/70 dark:from-[#211B25] dark:via-[#101D26] dark:to-[#142430] p-3.5 sm:p-4 flex items-start gap-3 shadow-sm">
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
              <button
                type="button"
                data-testid="home-child-emotional-checkin-link"
                onClick={openChildMoodCheckin}
                className="min-h-[44px] px-1 text-xs font-black text-violet-700 dark:text-violet-200 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 rounded-lg"
              >
                {isEn ? 'Check in with your child’s feelings' : 'تابع مشاعر طفلك'}
              </button>
              <button type="button" onClick={() => navigateTo('notifications')} className="min-h-[44px] px-1 text-xs font-black text-teal-800 dark:text-teal-200 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 rounded-lg">
                {isEn ? 'Parent support messages' : 'رسائل دعم الأب والأم'}
              </button>
            </div>
          </div>
        </div>

      </div>

      <HomeContentGroupHeading
        id="home-content-group-inspiration"
        step="٣"
        title={isEn ? 'Discover, watch and listen' : 'اكتشفوا.. شاهدوا.. واسمعوا'}
        description={isEn ? 'A visual family experience shaped around your child.' : 'تجربة بصرية وصوتية تتشكل حسب عمر طفلك واهتماماته.'}
      />
      <HomeVisualDiscovery
        language={lang}
        childName={activeKidName}
        ageLabel={activeKidStageLabel}
        signals={activeKidSignals}
        onNavigate={navigateTo}
        onOpenSection={openHomeSection}
      />

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
          {onReplaySplash && (
            <div className="border-t border-[var(--color-border)] pt-2 dark:border-[#1E3646]">
              <button
                type="button"
                onClick={onReplaySplash}
                className="min-h-[40px] w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-3 py-2 text-xs font-extrabold text-[var(--color-text)] dark:border-[#1E3646] dark:bg-[#142430] dark:text-[#F8FAFC] cursor-pointer"
              >
                {isEn ? '✨ Replay Welcome' : '✨ شاشة الترحيب'}
              </button>
            </div>
          )}
        </div>
      </SectionToolsDrawer>


      <HomeContentGroupHeading
        id="home-content-group-daily"
        step="١"
        title={isEn ? 'Follow your child’s day' : 'تابع يوم طفلك'}
        description={isEn ? 'Small daily records, interests and routines — all connected to the selected child.' : 'سجلات يومية واهتمامات وروتين مرتبط بملف الطفل المختار.'}
      />
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
        headerExtraAction={<button type="button" onClick={() => document.getElementById('home-child-profile-picker')?.scrollIntoView({behavior:'smooth',block:'center'})} className="min-h-[40px] rounded-xl bg-teal-700 px-3 py-2 text-xs font-black text-white">{isEn?'Switch child':'تغيير الطفل'}</button>}
      >
        <div className="space-y-4">{state.kids.length===0?<div className="rounded-3xl border border-dashed border-teal-500/35 p-5 text-center"><p className="text-xs">{isEn?'Add a child profile to start.':'ضيف ملف الطفل الأول علشان نبدأ.'}</p><button onClick={()=>navigateTo('children')} className="mt-3 min-h-11 rounded-xl bg-teal-700 px-4 text-xs font-black text-white">{isEn?'Add child':'إضافة طفل'}</button></div>:<DailyChildJournal language={lang} childName={activeKidName} hasSavedProfile={Boolean(activeKid?.remoteId)} records={todayRecordsByKid[activeKidId]||[]} onSave={saveJournalEntry} onOpenChildren={()=>navigateTo('children')}/>}</div>>
      </HomeAccordionCard>

      <div className="scroll-mt-24">
        <HomeContentTracks
          language={lang}
          childName={activeKidName}
          onNavigate={navigateTo}
          onOpenSection={openHomeSection}
        />
      </div>

      {/* =====================================================================
          4. ACCORDION: TIME-AWARE PARENTING COMPASS
          ===================================================================== */}
      <HomeAccordionCard
        id="home-daily-parenting-wisdom"
        testId="home-daily-parenting-wisdom"
        iconEmoji="🧭"
        iconBgClass="bg-teal-500/15 text-[#0d9488] dark:text-[#2DD4BF]"
        title={isEn ? 'Daily Parenting Compass' : 'بوصلة اليوم التربوية'}
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
                data-testid="daily-compass-read-aloud-toggle"
                aria-label={isReadingCompass ? (isEn ? 'Pause reading' : 'إيقاف القراءة') : (isEn ? 'Read today’s guidance aloud' : 'استمع لإرشاد اليوم')}
                onClick={toggleCompassReadAloud}
                className="min-h-[38px] px-3.5 py-1.5 rounded-xl border border-teal-500/35 bg-teal-500/10 text-xs font-extrabold text-teal-800 dark:text-teal-200"
              >
                {isReadingCompass ? (isEn ? '⏸ Pause' : '⏸ إيقاف') : (isEn ? '🔊 Listen with device voice' : '🔊 استمع بصوت الجهاز')}
              </button>
              <button
                type="button"
                onClick={() => {
                  onAddSuggestedRoutineTask?.(
                    isEn ? dailyCompassWisdom.actionTaskEn : dailyCompassWisdom.actionTaskAr,
                    dailyCompassWisdom.actionTime,
                    activeKid?.id ?? null
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
            ? 'Child Interests & Activities'
            : 'اهتمامات أطفالنا وأنشطتهم'
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
          ) : heroesPassionsFeed.map((hero) => (
              <div
                key={hero.id}
                data-testid={`hero-passion-card-${hero.id}`}
                className={`flex flex-col justify-between gap-3 rounded-3xl border ${hero.accentBorder} bg-gradient-to-br from-white via-white to-slate-50/80 p-4 shadow-[0_8px_24px_-18px_rgba(15,23,42,0.34)] transition-all hover:-translate-y-0.5 hover:shadow-md dark:from-[#142430] dark:via-[#142430] dark:to-[#101D26]`}
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

                  <div className="rounded-2xl border border-slate-200/75 bg-white/75 px-3.5 py-3 shadow-sm dark:border-[#29404D] dark:bg-[#0B131A]/65">
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

                <div className="mt-1 flex flex-wrap items-center justify-between gap-2.5 border-t border-slate-100 pt-3 dark:border-[#29404D]">
                  <button
                    type="button"
                    onClick={() => navigateTo('children')}
                    className="min-h-[44px] rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-2.5 text-xs font-extrabold text-amber-800 transition-all hover:bg-amber-500/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 active:scale-[.98] dark:text-amber-200"
                  >
                    {isEn ? 'Update interests' : 'تحديث الاهتمامات'}
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
                    className="min-h-[44px] rounded-xl bg-[#0d9488] px-3 py-2.5 text-xs font-extrabold text-white shadow-sm transition-all hover:bg-[#0f766e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 active:scale-[.98]"
                  >
                    + {isEn ? 'Add Activity' : 'أضف للروتين'}
                  </button>
                </div>
              </div>
          ))}
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
      <HomeContentGroupHeading
        id="home-content-group-growth"
        step="٢"
        title={isEn ? 'Support, learning and growth' : 'الدعم والتربية والنمو'}
        description={isEn ? 'Care for parents’ wellbeing while supporting each child’s feelings, skills and values.' : 'اهتمام براحة الأب والأم، ومشاعر كل طفل، ومهاراته وقيمه.'}
      />
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
          activeParentRole={isMotherActive ? 'mother' : 'father'}
          motherName={motherShortAr}
          fatherName={fatherShortAr}
          recentRecordsByKid={recentRecordsByKid}
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
          childInterests={activeKidSignals?.interests ?? []}
          childHobbies={activeKidSignals?.hobbies ?? []}
          childId={activeKid?.id ?? null}
          onNavigate={navigateTo}
          onAddRoutineTask={onAddSuggestedRoutineTask}
        />
      </HomeAccordionCard>

      {/* =====================================================================
          10. ACCORDION: FAMILY VALUES & AGE-AWARE DAILY HABITS
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
          12. OPTIONAL ACCORDION: BEDTIME STORY CREATOR
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
            ? 'Create a gentle story with your child’s name and a theme you choose'
            : 'ألف حدوتة لطيفة باسم طفلك وفكرة تختاروها'
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
            data-testid="illustrated-stories-coming-soon"
            aria-label={isEn ? 'Personalized bedtime story' : 'حدوتة مخصصة قبل النوم'}
            dir={isEn ? 'ltr' : 'rtl'}
            className="group relative isolate min-h-[190px] overflow-hidden rounded-3xl bg-[#211B35] text-white shadow-lg"
          >
            <img
              src="https://images.unsplash.com/photo-1519682337058-a94d519337bc?auto=format&fit=crop&w=1200&q=85"
              alt=""
              loading="lazy"
              decoding="async"
              className="absolute inset-0 -z-20 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#171329]/95 via-[#211B35]/75 to-[#211B35]/20" />
            <div className="flex min-h-[190px] max-w-xl flex-col items-start justify-center gap-2.5 p-5">
              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-black text-violet-100">{isEn ? 'A STORY FOR TONIGHT' : 'حدوتة الليلة'}</span>
              <h3 className="text-lg font-black leading-snug">{isEn ? 'Make your child the hero of a new bedtime story' : 'خلّي طفلك بطل حدوتة جديدة باسمه'}</h3>
              <p className="text-xs leading-6 text-white/80">{isEn ? 'Choose a theme, create a family story and listen together.' : 'اختاروا الفكرة، ألّفوا حدوتة باسم طفلكم، واسمعوها سوا قبل النوم.'}</p>
              <button
                type="button"
                onClick={() => document.getElementById('stories-library-view')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                className="mt-1 min-h-11 rounded-xl bg-violet-200 px-4 py-2 text-xs font-black text-violet-950 transition hover:bg-white"
              >
                {isEn ? 'Create tonight’s story' : 'ابدأوا حدوتة الليلة'} {isEn ? '→' : '←'}
              </button>
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
          13. ACCORDION: HORIZONTAL SCROLLABLE IMAGE GALLERY (CHECKLIST #3 & #12B)
          ===================================================================== */}


      {/* =====================================================================
          14. ACCORDION: FEATURED FAMILY STORE & PRODUCTS SHOWCASE
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
                    catId: 'toys', emoji: '🧸', titleAr: 'ألعاب مونتيسوري', titleEn: 'Montessori Toys',
                    ageAr: '٠–٨ سنوات', ageEn: 'Ages 0–8',
                    image: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=700&q=80',
                  },
                  {
                    catId: 'essentials', emoji: '🍼', titleAr: 'مستلزمات الرضع', titleEn: 'Baby Essentials',
                    ageAr: '٠–٢ سنة', ageEn: 'Ages 0–2',
                    image: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&w=700&q=80',
                  },
                  {
                    catId: 'clothing', emoji: '👟', titleAr: 'أزياء وأحذية قطنية', titleEn: 'Cotton Apparel',
                    ageAr: '٠–٨ سنوات', ageEn: 'Ages 0–8',
                    image: 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?auto=format&fit=crop&w=700&q=80',
                  },
                  {
                    catId: 'nursery', emoji: '🏫', titleAr: 'حضانات ومدارس', titleEn: 'Nurseries & Schools',
                    ageAr: '١–٨ سنوات', ageEn: 'Ages 1–8',
                    image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=700&q=80',
                  },
                  {
                    catId: 'courses', emoji: '🎨', titleAr: 'كورسات وأنشطة', titleEn: 'Skill Courses',
                    ageAr: '٣–٨ سنوات', ageEn: 'Ages 3–8',
                    image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=700&q=80',
                  },
                  {
                    catId: 'books', emoji: '📚', titleAr: 'منصات وقصص', titleEn: 'Online & Books',
                    ageAr: '٢–٨ سنوات', ageEn: 'Ages 2–8',
                    image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=700&q=80',
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
                    className="group relative min-h-[150px] overflow-hidden rounded-2xl border border-white/15 bg-slate-950 p-3 text-start shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
                  >
                    <img src={promo.image} alt="" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover opacity-75 transition-transform duration-500 group-hover:scale-105" />
                    <span className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
                    <span className="relative z-10 flex h-full min-h-[124px] flex-col items-start justify-end gap-1.5">
                      <span className="grid h-9 w-9 place-items-center rounded-xl border border-white/20 bg-black/25 text-xl backdrop-blur">{promo.emoji}</span>
                      <span className="text-sm font-black leading-snug text-white">{isEn ? promo.titleEn : promo.titleAr}</span>
                      <span className="text-[10px] font-bold text-teal-100">{isEn ? promo.ageEn : promo.ageAr}</span>
                    </span>
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

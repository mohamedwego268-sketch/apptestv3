import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  CHILD_COLOR_PALETTE_ORDER,
  CHILD_VISUAL_IDENTITY_THEMES,
  ChildColorThemeId,
  ChildProfile,
  CommercialItem,
  FamilySpaceState,
  LanguageCode,
  RoutineTask,
  calculateChildAge,
  dateLocalISO,
  getChildVisualIdentitySpec,
  getDefaultCityForCountry,
  getCountryTimezone,
  isTaskCompletedOnDate,
  isTaskScheduledForDate,
  locText,
  resolveChildColorTheme,
  sanitizeUserText,
} from '../domain/familySpaceCore';
import { PageId } from '../context/FamilyAppContext';
import {
  MasterPatternCard,
} from '../components/DesignSystem';
import { ThreeDChildAvatar } from '../components/ThreeDVisuals';
import { HeaderBarProfileSpec } from '../components/HeaderBar';
import { SectionToolsDrawer } from '../components/SectionToolsDrawer';
import { createChildLifeRecord, fetchDailyChildLifeRecords, fetchRecentChildLifeRecords, type DailyChildLifeRecord } from '../services/supabaseService';
import {
  extractProfileSignals,
  getSafeFavoriteFood,
} from '../domain/contentRecommendationEngine';
const ParentingSupportCenter = React.lazy(() => import('../components/ParentingSupportCenter').then((module) => ({ default: module.ParentingSupportCenter })));
const StoriesLibraryView = React.lazy(() => import('../components/StoriesLibraryView').then((module) => ({ default: module.StoriesLibraryView })));
const CatalogView = React.lazy(() => import('../components/CatalogView').then((module) => ({ default: module.CatalogView })));
const HomeDailyExperience = React.lazy(() => import('./HomeDailyExperience').then((module) => ({ default: module.HomeDailyExperience })));
const HomeValuesTrackSection = React.lazy(() => import('./HomeValuesTrackSection').then((module) => ({ default: module.HomeValuesTrackSection })));
const HomeLearningTrackSection = React.lazy(() => import('./HomeLearningTrackSection').then((module) => ({ default: module.HomeLearningTrackSection })));

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
  onAddSuggestedRoutineTask?: (
    taskName: string,
    timeStr: string,
    kidId: number | null,
    category?: string,
    cadence?: 'daily' | 'weekly' | 'monthly',
    owner?: string,
    dayOfWeek?: number,
    dayOfMonth?: number,
    daysOfWeek?: number[]
  ) => void;
  onToggleRoutineTask?: (taskId: number, done: boolean, targetDateISO?: string) => void;
  onUpdateRoutineTaskOwner?: (taskId: number, owner: string) => void;
  onEditRoutineTask?: (
    taskId: number,
    updates: Partial<
      Pick<
        RoutineTask,
        | 'name'
        | 'time'
        | 'category'
        | 'owner'
        | 'kidId'
        | 'cadence'
        | 'dayOfWeek'
        | 'daysOfWeek'
        | 'dayOfMonth'
      >
    >
  ) => void;
  onDeleteRoutineTask?: (taskId: number) => void;
  onRestoreRoutineTask?: (task: RoutineTask) => void;
  onChangeChildColorTheme?: (kidId: number, colorTheme: ChildColorThemeId) => void;
  onOpenEditChild?: (kid: ChildProfile) => void;
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
  onToggleRoutineTask,
  onUpdateRoutineTaskOwner,
  onEditRoutineTask,
  onDeleteRoutineTask,
  onRestoreRoutineTask,
  onChangeChildColorTheme,
  onOpenEditChild,
  onShowToast,
  bedtimeMode = false,
  onToggleBedtimeMode,
  onOpenStoreCategory,
  onReplaySplash,
}) => {
  const isEn = lang === 'en';
  const [selectedKidIdx, setSelectedKidIdx] = useState<number>(0);
  const [quickTaskName, setQuickTaskName] = useState('');
  const [quickTaskTime, setQuickTaskTime] = useState('17:00');
  const [quickTaskCategory, setQuickTaskCategory] = useState('روتين يومي');
  const [quickTaskCadence, setQuickTaskCadence] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [quickTaskScope, setQuickTaskScope] = useState<'child' | 'shared'>('child');
  const [taskView, setTaskView] = useState<'all' | 'open' | 'done'>('all');
  const [quickTaskOwner, setQuickTaskOwner] = useState<'الأم' | 'الأب' | 'مشترك'>('مشترك');
  const [quickTaskDay, setQuickTaskDay] = useState(new Date().getDay());
  const [quickTaskDayOfMonth, setQuickTaskDayOfMonth] = useState(new Date().getDate());
  const [plannerDay, setPlannerDay] = useState(new Date().getDay());
  const [plannerWeekOffset, setPlannerWeekOffset] = useState(0);
  const [plannerOwner, setPlannerOwner] = useState<'all' | 'الأم' | 'الأب' | 'مشترك'>('all');
  const [plannerScope, setPlannerScope] = useState<'all' | 'child' | 'shared'>('all');
  const [plannerCategory, setPlannerCategory] = useState<string>('all');
  const [commandFaithMode, setCommandFaithMode] = useState<'shared' | 'islam' | 'christian'>('shared');
  const [editingCommandTaskId, setEditingCommandTaskId] = useState<number | null>(null);
  const [editTaskDraft, setEditTaskDraft] = useState<{
    name: string;
    time: string;
    category: string;
    owner: string;
    kidId: number | null;
    cadence: 'daily' | 'weekly' | 'monthly';
    dayOfWeek: number;
    dayOfMonth: number;
  } | null>(null);
  const [confirmDeleteTaskId, setConfirmDeleteTaskId] = useState<number | null>(null);
  const [lastDeletedTask, setLastDeletedTask] = useState<RoutineTask | null>(null);

  useEffect(() => {
    if (selectedKidIdx >= state.kids.length && selectedKidIdx !== 0) {
      setSelectedKidIdx(Math.max(0, state.kids.length - 1));
    }
  }, [selectedKidIdx, state.kids.length]);

  // Shared open/close state for all Home accordion sections.
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({
    quickTrack: false,
    dailyWisdom: false,
    dailyEssentials: false,
    bedtimeStories: false,
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
      heroesArena: 'command-domain-hobbies',
      parentingSupport: 'home-parenting-support-center',
      valuesTrack: 'home-values-track-card',
      dailyEssentials: 'home-daily-essentials-hub',
      learningTrack: 'home-learning-track-card',
      sportsTrack: 'home-daily-essentials-hub',
    };
    if (key === 'parentingSupport' || key === 'valuesTrack' || key === 'dailyEssentials' || key === 'learningTrack') {
      setOpenAccordions((previous) => ({ ...previous, [key]: true }));
    }
    document.getElementById(sectionIds[key])?.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
    void fetchDailyChildLifeRecords(childRemoteIds, new Date(), undefined, getCountryTimezone(state.country)).then(({ records }) => {
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
    recordType: 'sleep_log' | 'nutrition' | 'sports' | 'emotional_social' | 'routine' | 'other',
    title: string,
    details: Record<string, unknown> = {}
  ): Promise<boolean> => {
    if (!activeKid || !activeKid.remoteId) {
      onShowToast?.(isEn ? 'Save this child profile to the family first, then log daily activity.' : 'احفظ ملف الطفل في حساب الأسرة أولاً، وبعدها سجّل النشاط اليومي.');
      return false;
    }
    const savedKid = activeKid;
    const remoteChildId = savedKid.remoteId;
    const result = await createChildLifeRecord({
      childRemoteId: remoteChildId,
      recordType,
      title,
      details: { ...details, source: 'dashboard_quick_track' },
    });
    if (result.error || !result.record) {
      onShowToast?.(isEn ? `Could not save: ${result.error || 'Unknown error'}` : `تعذر حفظ السجل: ${result.error || 'خطأ غير معروف'}`);
      return false;
    }

    // Keep the dashboard's recommendation context in sync with the record just saved.
    // Use the captured child so a fast child switch cannot attach records to another profile.
    const refreshed = await fetchRecentChildLifeRecords([String(savedKid.remoteId)], 14);
    if (!refreshed.error) {
      setRecentRecordsByKid((previous) => ({
        ...previous,
        [savedKid.id]: refreshed.records,
      }));
    }
    return true;
  };
  const toggleCommandTask = async (task: RoutineTask, nextDone: boolean, targetDateISO: string) => {
    const wasDone = isTaskCompletedOnDate(task, targetDateISO);
    onToggleRoutineTask?.(task.id, nextDone, targetDateISO);
    if (!nextDone || wasDone || !activeKid?.remoteId) return;

    const completionKey = `command-task:${activeKid.id}:${task.id}:${targetDateISO}`;
    if (savingDashboardActionKeysRef.current.has(completionKey)) return;
    const alreadyRecorded = activeKidRecentRecords.some((record) =>
      record.record_type === 'routine' &&
      record.details?.dashboardKind === 'command_center_task' &&
      Number(record.details?.taskId) === task.id &&
      record.details?.scheduledDateISO === targetDateISO &&
      record.details?.action === 'completed'
    );
    if (alreadyRecorded) return;

    savingDashboardActionKeysRef.current.add(completionKey);
    try {
      const saved = await saveDashboardChildLog(
        'routine',
        isEn ? `Completed task: ${task.name}` : `إنجاز مهمة: ${task.name}`,
        {
          dashboardKind: 'command_center_task',
          taskId: task.id,
          scheduledDateISO: targetDateISO,
          category: task.category,
          owner: task.owner || 'مشترك',
          time: task.time,
          cadence: task.cadence || 'daily',
          action: 'completed',
        }
      );
      if (saved) {
        onShowToast?.(isEn ? 'Task completion added to the child timeline ✓' : 'اتسجل إنجاز المهمة في سجل الطفل ✓');
      }
    } finally {
      savingDashboardActionKeysRef.current.delete(completionKey);
    }
  };
  const completeParentChildActivity = async (activity: {
    id: string;
    title: string;
    topic: string;
    durationMinutes: number;
    reflectionNote?: string;
    chosenChallenge?: string;
    childResponse?: 'loved' | 'okay' | 'not_interested' | 'repeat';
  }): Promise<boolean> => {
    if (!activeKid?.remoteId) {
      onShowToast?.(isEn
        ? 'Save this child profile to the family first, then record your shared activity.'
        : 'احفظ ملف الطفل في حساب الأسرة أولاً، وبعدها نقدر نسجل التجربة المشتركة.');
      return false;
    }
    const saved = await saveDashboardChildLog('other', activity.title, {
      dashboardKind: 'shared_activity',
      activityId: activity.id,
      topic: activity.topic,
      durationMinutes: activity.durationMinutes,
      parentParticipated: true,
      childParticipated: true,
      completedTogether: true,
      parentReflection: activity.reflectionNote || null,
      chosenChallenge: activity.chosenChallenge || null,
      childResponse: activity.childResponse || null,
    });
    if (!saved) return false;
    onShowToast?.(isEn
      ? 'Shared moment saved to your child’s timeline ✓'
      : 'اتسجلت اللحظة المشتركة في سجل طفلك ✓');
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
              descAr: 'جهّزوا مكان آمن للحركة واللعب، وسيبوا طفلك يجرب أكتر من مرة براحة.',
              descEn: 'Offer a safe space to explore and move, allowing the child to repeat attempts without rushing.',
              time: '01:30 م',
            },
        balance: {
          badgeAr: '🧸 تتبع بصري ومهارات القبض باليد',
          badgeEn: '🧸 Visual Tracking & Grasp Play',
          titleAr: `١٠ دقائق لعب بالخشخيشة الخشبية والركل بالقدمين مع ${activeKidName}`,
          titleEn: `10-Min Wooden Rattle Grasp & Leg Kick Play with ${activeKidName}`,
          descAr: 'يساعد طفلك يربط بين اللي بيشوفه وحركة إيده، ويتعرف على الأصوات والملمس.',
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
      {/* Child Life Command Center — the single place to switch child and manage the day with per-child visual identity. */}
      {(() => {
        const activeKidColorId = resolveChildColorTheme(activeKid, state.kids);
        const activeKidVisual = getChildVisualIdentitySpec(activeKidColorId);
        const localNow = new Date();
        const todayLocalISO = dateLocalISO(localNow);
        const selectedDateObj = new Date(
          localNow.getFullYear(),
          localNow.getMonth(),
          localNow.getDate() + plannerWeekOffset * 7 + (plannerDay - localNow.getDay()),
          12,
          0,
          0
        );
        const selectedPlannerDateISO = dateLocalISO(selectedDateObj);
        const isViewingToday = selectedPlannerDateISO === todayLocalISO;

        const scopedTodayTasks = state.tasks.filter(
          (task) =>
            (task.kidId === null || task.kidId === activeKidId) &&
            isTaskScheduledForDate(task, todayLocalISO)
        );
        const todayOpenCount = scopedTodayTasks.filter((task) => !isTaskCompletedOnDate(task, todayLocalISO)).length;

        const activePulse = quickPulseByKid[activeKidId] || {
          sleepLogged: false,
          mealLogged: false,
          moodEmoji: '😊',
          careLogged: false,
        };
        const activeKidHero = heroesPassionsFeed.find((h) => h.kidId === activeKidId);
        const faithQuickPrompt =
          commandFaithMode === 'islam'
            ? {
                titleAr: 'وقت هادئ نتعرّف فيه على الصلاة والوضوء بالقدوة',
                titleEn: 'Calm time to explore prayer and wudu by example',
                descAr: 'مشاركة لطيفة بدون إجبار أو مقارنة، تناسب سن الطفل.',
                descEn: 'Gentle participation by example without pressure, suited to the child’s age.',
              }
            : commandFaithMode === 'christian'
            ? {
                titleAr: 'لحظة صلاة عائلية هادئة وحكاية محبة',
                titleEn: 'Quiet family prayer moment and story of love',
                descAr: 'شكر ودعاء بكلمات الطفل البسيطة وفق تقليد الأسرة.',
                descEn: 'Gratitude and prayer in the child’s simple words following family tradition.',
              }
            : {
                titleAr: 'لحظة امتنان ولطف ومساعدة متبادلة في البيت',
                titleEn: 'A daily moment of gratitude, kindness and mutual help',
                descAr: 'قيم يومية نعيشها بالقدوة والحوار الهادئ.',
                descEn: 'Everyday values lived through example and calm conversation.',
              };

        return (
          <section
            id="child-life-command-center"
            data-testid="child-life-command-center"
            data-child-color={activeKidColorId}
            dir={isEn ? 'ltr' : 'rtl'}
            className={`relative overflow-hidden rounded-[28px] border ${activeKidVisual.commandCenterBorder} bg-gradient-to-br ${activeKidVisual.commandCenterGradient} p-4 text-white shadow-[0_18px_45px_-25px_rgba(4,55,59,.65)] sm:p-5 space-y-4 transition-colors duration-300`}
          >
            {/* Header with Child Avatar / Real Photo, Name, Visual Identity Color Picker & Remaining Tasks Counter */}
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {activeKid && (
                  <div
                    data-testid="command-center-child-avatar"
                    className="shrink-0 rounded-2xl border-2 border-white/30 bg-white/10 p-1 shadow-md"
                  >
                    <ThreeDChildAvatar
                      name={activeKidName}
                      gender={activeKid.gender}
                      stageCode={activeKidAge?.stageCode || '2-5'}
                      accessoryTheme={activeKid.avatarTheme || 'astronaut'}
                      photoDataUrl={activeKid.photoDataUrl}
                      useIllustratedAvatar={activeKid.useIllustratedAvatar}
                      size="sm"
                    />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-bold text-white/85">
                      {isEn ? 'Child Daily Command Center' : 'مركز قيادة يوم الطفل'}
                    </span>
                    <span className="text-[11px] text-white/60" aria-hidden="true">·</span>
                    <span className="text-[11px] font-semibold text-white/85">
                      {isEn ? activeKidVisual.labelEn : activeKidVisual.labelAr}
                    </span>
                  </div>
                  <h2 className="mt-1 text-xl font-black sm:text-2xl truncate">
                    {activeKid
                      ? isEn
                        ? `${activeKidName}’s day`
                        : `يوم ${activeKidName}`
                      : isEn
                      ? 'Your child’s day'
                      : 'يوم طفلك'}
                  </h2>
                  <p className="mt-0.5 text-xs leading-5 text-white/85">
                    {isEn
                      ? 'One shared plan for parents, daily routines, care and milestones.'
                      : 'لوحة موحدة للأب والأم لمتابعة مهام الطفل، تغذيته، نومه، أنشطته ومواعيده.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <div className="rounded-2xl border border-white/15 bg-white/10 px-3 py-2 text-center">
                  <div className="text-xl font-black tabular-nums">{todayOpenCount}</div>
                  <div className="text-[10px] text-white/85">{isEn ? 'Tasks left today' : 'مهام متبقية اليوم'}</div>
                </div>
              </div>
            </div>

            {/* Child Switcher & Per-Child Color Identity Bar */}
            {state.kids.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="text-[11px] font-bold text-white/85">
                    {isEn ? 'Switch Child' : 'اختاروا الطفل'}
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {state.kids.map((kid, idx) => {
                      const selected = idx === selectedKidIdx;
                      const kidColorId = resolveChildColorTheme(kid, state.kids);
                      const kidVisual = getChildVisualIdentitySpec(kidColorId);
                      return (
                        <button
                          key={kid.id}
                          type="button"
                          data-testid={`home-kid-switcher-${kid.id}`}
                          aria-pressed={selected}
                          onClick={() => {
                            setSelectedKidIdx(idx);
                            setEditingCommandTaskId(null);
                            setConfirmDeleteTaskId(null);
                          }}
                          className={`min-h-11 shrink-0 rounded-2xl border px-3.5 py-2 text-xs font-black transition flex items-center gap-2 cursor-pointer ${
                            selected ? activeKidVisual.activePillClass : activeKidVisual.inactivePillClass
                          }`}
                        >
                          <span
                            aria-hidden="true"
                            style={{ backgroundColor: kidVisual.swatchHex }}
                            className="h-2.5 w-2.5 rounded-full border border-white/80 shrink-0"
                          />
                          <span>{kid.emoji}</span>
                          <span>{locText(kid.name, lang)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {activeKid && (
                  <details className="group relative shrink-0">
                    <summary className="flex min-h-10 cursor-pointer list-none items-center gap-2 rounded-xl border border-white/15 bg-white/[0.07] px-3 text-[11px] font-bold text-white [&::-webkit-details-marker]:hidden">
                      <span aria-hidden="true">🎨</span><span>{isEn ? 'Color' : 'اللون'}</span><span className="text-white/60 transition-transform group-open:rotate-180" aria-hidden="true">⌄</span>
                    </summary>
                    <div className="absolute end-0 top-full z-30 mt-2 flex items-center gap-2 rounded-xl border border-white/15 bg-slate-900 p-3 shadow-xl">
                      {CHILD_COLOR_PALETTE_ORDER.map((colorId) => {
                        const cSpec = CHILD_VISUAL_IDENTITY_THEMES[colorId];
                        const isSelectedColor = activeKidColorId === colorId;
                        return (
                          <button key={colorId} type="button" data-testid={`command-center-color-${colorId}`} aria-label={isEn ? `Set ${activeKidName} color to ${cSpec.labelEn}` : `تخصيص لون ${activeKidName} إلى ${cSpec.labelAr}`} aria-pressed={isSelectedColor} onClick={() => onChangeChildColorTheme?.(activeKid.id, colorId)} style={{ backgroundColor: cSpec.swatchHex }} className={`h-7 w-7 rounded-full border transition-transform cursor-pointer ${isSelectedColor ? 'border-white scale-110 ring-2 ring-white/70' : 'border-white/50 opacity-80 hover:opacity-100'}`} />
                        );
                      })}
                      {onOpenEditChild && <button type="button" data-testid="command-center-edit-child-btn" onClick={() => onOpenEditChild(activeKid)} className="ms-1 rounded-lg border border-white/20 bg-white/10 px-2.5 py-1.5 text-[10px] font-bold text-white hover:bg-white/20 cursor-pointer">{isEn ? 'Profile' : 'ملف الطفل'}</button>}
                    </div>
                  </details>
                )}
              </div>
            )}

            {activeKid && (
              <>
                <details className="group rounded-2xl border border-white/15 bg-white/[0.07]">
                  <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-3.5 py-3 [&::-webkit-details-marker]:hidden">
                    <span className="min-w-0"><span className="block text-sm font-black">{isEn ? 'Child life areas' : 'جوانب حياة الطفل'}</span><span className="mt-0.5 block text-[11px] text-white/70">{isEn ? 'Meals, sleep, learning, health and wellbeing' : 'الأكل والنوم والتعلم والصحة والمشاعر والقيم'}</span></span>
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/10 text-sm transition-transform group-open:rotate-180" aria-hidden="true">⌄</span>
                  </summary>
                  <div className="grid grid-cols-2 gap-2 border-t border-white/10 p-3 sm:grid-cols-4">
                    <button type="button" data-testid="command-domain-nutrition" onClick={() => openHomeSection('dailyEssentials')} className="flex min-h-[58px] items-center gap-2 rounded-xl border border-white/10 bg-white/[0.07] px-3 py-2 text-start text-xs font-bold hover:bg-white/15 cursor-pointer"><span className="text-lg">🥣</span><span className="min-w-0"><span className="block">{isEn ? 'Meals' : 'الأكل'}</span><span className="mt-0.5 block truncate text-[10px] font-normal text-white/65">{isEn ? currentNutrition.titleEn : currentNutrition.titleAr}</span></span></button>
                    <button type="button" data-testid="command-domain-sleep" onClick={() => { setOpenAccordions((prev) => ({ ...prev, quickTrack: true })); document.getElementById('home-one-handed-quick-pulse')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }} className="flex min-h-[58px] items-center gap-2 rounded-xl border border-white/10 bg-white/[0.07] px-3 py-2 text-start text-xs font-bold hover:bg-white/15 cursor-pointer"><span className="text-lg">🌙</span><span className="min-w-0"><span className="block">{isEn ? 'Sleep' : 'النوم'}</span><span className="mt-0.5 block truncate text-[10px] font-normal text-white/65">{activePulse.sleepLogged ? (isEn ? 'Logged today' : 'تم تسجيله اليوم') : (isEn ? 'Add sleep log' : 'سجّل النوم')}</span></span></button>
                    <button type="button" data-testid="command-domain-learning" onClick={() => openHomeSection('learningTrack')} className="flex min-h-[58px] items-center gap-2 rounded-xl border border-white/10 bg-white/[0.07] px-3 py-2 text-start text-xs font-bold hover:bg-white/15 cursor-pointer"><span className="text-lg">📚</span><span className="min-w-0"><span className="block">{isEn ? 'Learning' : 'التعلم'}</span><span className="mt-0.5 block truncate text-[10px] font-normal text-white/65">{activeKidStageLabel}</span></span></button>
                    <button type="button" data-testid="command-domain-sports" onClick={() => openHomeSection('sportsTrack')} className="flex min-h-[58px] items-center gap-2 rounded-xl border border-white/10 bg-white/[0.07] px-3 py-2 text-start text-xs font-bold hover:bg-white/15 cursor-pointer"><span className="text-lg">⚽</span><span className="min-w-0"><span className="block">{isEn ? 'Movement' : 'الحركة'}</span><span className="mt-0.5 block truncate text-[10px] font-normal text-white/65">{isEn ? currentSport.titleEn : currentSport.titleAr}</span></span></button>
                    <button type="button" data-testid="command-domain-health" onClick={() => navigateTo('medical')} className="flex min-h-[58px] items-center gap-2 rounded-xl border border-white/10 bg-white/[0.07] px-3 py-2 text-start text-xs font-bold hover:bg-white/15 cursor-pointer"><span className="text-lg">🩺</span><span className="min-w-0"><span className="block">{isEn ? 'Health' : 'الصحة'}</span><span className="mt-0.5 block truncate text-[10px] font-normal text-white/65">{activeKid.vaccinationsNote ? locText(activeKid.vaccinationsNote, lang) : (isEn ? 'Growth & care' : 'النمو والمتابعة')}</span></span></button>
                    <button type="button" data-testid="command-domain-hobbies" onClick={() => openHomeSection('heroesArena')} className="flex min-h-[58px] items-center gap-2 rounded-xl border border-white/10 bg-white/[0.07] px-3 py-2 text-start text-xs font-bold hover:bg-white/15 cursor-pointer"><span className="text-lg">🎨</span><span className="min-w-0"><span className="block">{isEn ? 'Interests' : 'الهوايات'}</span><span className="mt-0.5 block truncate text-[10px] font-normal text-white/65">{activeKidHero && activeKidHero.passionTagsAr.length > 0 ? activeKidHero.passionTagsAr.join(' · ') : (isEn ? 'Discover interests' : 'اكتشف اهتماماته')}</span></span></button>
                    <button type="button" data-testid="command-domain-wellbeing" onClick={() => openChildMoodCheckin()} className="flex min-h-[58px] items-center gap-2 rounded-xl border border-white/10 bg-white/[0.07] px-3 py-2 text-start text-xs font-bold hover:bg-white/15 cursor-pointer"><span className="text-lg">💚</span><span className="min-w-0"><span className="block">{isEn ? 'Feelings' : 'المشاعر'}</span><span className="mt-0.5 block truncate text-[10px] font-normal text-white/65">{isEn ? 'Emotional support' : 'الدعم النفسي'}</span></span></button>
                    <button type="button" data-testid="command-domain-values" onClick={() => openHomeSection('valuesTrack')} className="flex min-h-[58px] items-center gap-2 rounded-xl border border-white/10 bg-white/[0.07] px-3 py-2 text-start text-xs font-bold hover:bg-white/15 cursor-pointer"><span className="text-lg">🕊️</span><span className="min-w-0"><span className="block">{isEn ? 'Values' : 'القيم'}</span><span className="mt-0.5 block truncate text-[10px] font-normal text-white/65">{isEn ? 'Family faith & values' : 'القيم والدين حسب الأسرة'}</span></span></button>
                  </div>
                  <div className="border-t border-white/10 px-3 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0"><p className="text-xs font-bold">{isEn ? 'Family values path' : 'مسار القيم والصلاة'}</p><p className="mt-0.5 text-[10px] text-white/65">{isEn ? 'Choose what fits your family' : 'اختاروا ما يناسب أسرتكم'}</p></div>
                      <div className="flex flex-wrap gap-1.5">
                        {([{ id: 'shared', ar: 'قيم عامة', en: 'Shared' }, { id: 'islam', ar: 'إسلامي', en: 'Islam' }, { id: 'christian', ar: 'مسيحي', en: 'Christian' }] as const).map((fp) => <button key={fp.id} type="button" aria-pressed={commandFaithMode === fp.id} onClick={() => setCommandFaithMode(fp.id)} className={`min-h-8 rounded-lg border px-2.5 text-[10px] font-bold transition cursor-pointer ${commandFaithMode === fp.id ? activeKidVisual.activePillClass : 'border-white/15 bg-white/5 text-white/80'}`}>{isEn ? fp.en : fp.ar}</button>)}
                      </div>
                    </div>
                    <p className="mt-2 text-[11px] font-semibold text-white/85">{isEn ? faithQuickPrompt.titleEn : faithQuickPrompt.titleAr}</p>
                    <button type="button" onClick={() => onAddSuggestedRoutineTask?.(isEn ? faithQuickPrompt.titleEn : faithQuickPrompt.titleAr, '19:30', activeKidId, 'الصلاة والقيم', 'daily', 'مشترك')} className={`mt-2 min-h-9 rounded-xl px-3 text-[11px] font-bold transition cursor-pointer ${activeKidVisual.accentButtonClass}`}>+ {isEn ? 'Add to today' : 'أضف لجدول اليوم'}</button>
                  </div>
                </details>

                {/* Tasks, Recurrence & Shared Parent Plan */}
                <div className={`rounded-2xl border border-white/15 ${activeKidVisual.innerPanelBg} p-3.5 space-y-3`}>
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-black">
                        {isViewingToday
                          ? isEn
                            ? 'Today’s Plan & Tasks'
                            : 'خطة اليوم والمهام'
                          : isEn
                          ? `Plan for ${selectedPlannerDateISO}`
                          : `جدول يوم ${selectedPlannerDateISO}`}
                      </h3>
                      <p className="mt-0.5 text-[10px] text-white/75">
                        {isEn
                          ? 'Daily tasks reset automatically each new day while keeping completion history'
                          : 'المهام اليومية تتجدد تلقائيًا كل يوم جديد مع حفظ الإنجازات السابقة في سجل الطفل'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigateTo('routine')}
                      className="min-h-10 rounded-xl border border-white/20 px-3 text-[11px] font-bold text-white hover:bg-white/10 cursor-pointer"
                    >
                      {isEn ? 'Full planner' : 'كل المهام ←'}
                    </button>
                  </div>

                  {/* Undo Deleted Task Banner */}
                  {lastDeletedTask && (
                    <div
                      role="status"
                      data-testid="command-center-undo-banner"
                      className="flex items-center justify-between gap-2 rounded-xl border border-amber-200/30 bg-amber-400/15 px-3 py-2 text-xs text-white"
                    >
                      <span className="truncate font-bold">
                        {isEn
                          ? `Deleted "${lastDeletedTask.name}"`
                          : `تم حذف المهمة «${lastDeletedTask.name}»`}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          data-testid="command-center-undo-btn"
                          onClick={() => {
                            onRestoreRoutineTask?.(lastDeletedTask);
                            setLastDeletedTask(null);
                          }}
                          className={`rounded-lg px-2.5 py-1 text-[11px] font-black cursor-pointer ${activeKidVisual.accentButtonClass}`}
                        >
                          {isEn ? 'Undo' : 'تراجع عن الحذف'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setLastDeletedTask(null)}
                          aria-label={isEn ? 'Dismiss undo' : 'إغلاق'}
                          className="rounded-lg px-1.5 py-1 text-[11px] text-white/75 hover:text-white cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Upcoming Appointment Callout */}
                  {(() => {
                    const nextEvent = state.events
                      .filter(
                        (event) =>
                          (event.childId === null || event.childId === activeKidId) &&
                          event.date >= todayLocalISO
                      )
                      .slice()
                      .sort((a, b) =>
                        `${a.date} ${a.time || ''}`.localeCompare(`${b.date} ${b.time || ''}`)
                      )[0];
                    return nextEvent ? (
                      <div className="flex items-center gap-3 rounded-xl border border-amber-200/20 bg-amber-300/10 p-3">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-amber-300/15 text-lg">
                          📅
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="text-[10px] font-bold text-amber-100">
                            {isEn ? 'Next Appointment' : 'أقرب ميعاد قادم'}
                          </div>
                          <div className="truncate text-xs font-black text-white">{nextEvent.title}</div>
                          <div className="mt-0.5 text-[10px] text-amber-100/80">
                            {nextEvent.date}
                            {nextEvent.time ? ` · ${nextEvent.time}` : ''}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => navigateTo('calendar')}
                          className="min-h-9 rounded-lg border border-white/15 px-2.5 text-[10px] font-bold text-white cursor-pointer"
                        >
                          {isEn ? 'View' : 'عرض'}
                        </button>
                      </div>
                    ) : null;
                  })()}

                  {/* Weekly Day Switcher */}
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[10px] font-bold text-white/90">
                        {isEn ? 'Weekly Schedule' : 'جدول الأسبوع'}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button type="button" data-testid="planner-current-week" onClick={() => { setPlannerWeekOffset(0); setPlannerDay(localNow.getDay()); }} className="min-h-8 rounded-lg border border-white/15 bg-white/10 px-2.5 text-[10px] font-bold text-white hover:bg-white/15">
                          {isEn ? 'This week' : 'الأسبوع الحالي'}
                        </button>
                        <button type="button" aria-label={isEn ? 'Previous week' : 'الأسبوع السابق'} data-testid="planner-previous-week" onClick={() => setPlannerWeekOffset((value) => value - 1)} className="grid h-8 w-8 place-items-center rounded-lg border border-white/15 bg-white/10 text-sm text-white hover:bg-white/15">‹</button>
                        <button type="button" aria-label={isEn ? 'Next week' : 'الأسبوع التالي'} data-testid="planner-next-week" onClick={() => setPlannerWeekOffset((value) => value + 1)} className="grid h-8 w-8 place-items-center rounded-lg border border-white/15 bg-white/10 text-sm text-white hover:bg-white/15">›</button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2 text-[10px] text-white/70">
                      <span>{isEn ? 'Selected day' : 'اليوم المختار'}</span>
                      <span className="font-bold tabular-nums text-white/90">{selectedPlannerDateISO}</span>
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {(isEn
                        ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
                        : ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت']
                      ).map((day, index) => {
                        const dayDate = new Date(localNow.getFullYear(), localNow.getMonth(), localNow.getDate() + plannerWeekOffset * 7 + index - localNow.getDay(), 12, 0, 0);
                        const dayISO = dateLocalISO(dayDate);
                        const dayTasks = state.tasks.filter((task) =>
                          (task.kidId === null || task.kidId === activeKidId) &&
                          isTaskScheduledForDate(task, dayISO)
                        );
                        const doneTasks = dayTasks.filter((task) => isTaskCompletedOnDate(task, dayISO)).length;
                        const isToday = dayISO === todayLocalISO;
                        return (
                          <button
                            key={day}
                            type="button"
                            aria-pressed={plannerDay === index}
                            aria-label={`${day} ${dayDate.toLocaleDateString(isEn ? 'en-US' : 'ar-EG')}, ${dayTasks.length} ${isEn ? 'tasks' : 'مهام'}`}
                            data-testid={`planner-day-${dayISO}`}
                            onClick={() => { setPlannerDay(index); setQuickTaskDay(index); }}
                            className={`relative flex min-h-[66px] min-w-0 flex-col items-center justify-center gap-1 rounded-xl border px-0.5 py-1 transition cursor-pointer ${
                              plannerDay === index
                                ? activeKidVisual.activePillClass
                                : 'border-white/15 bg-white/5 text-white/90'
                            } ${isToday && plannerDay !== index ? 'ring-1 ring-emerald-200/70' : ''}`}
                          >
                            <span className="text-[9px] font-bold">{day}</span>
                            <span className="text-sm font-black tabular-nums">{dayDate.getDate()}</span>
                            <span className="text-[8px] opacity-75">{dayTasks.length ? `${doneTasks}/${dayTasks.length}` : isToday ? (isEn ? 'Today' : 'اليوم') : '—'}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {(() => {
                    const childTasks = state.tasks.filter((task) => {
                      const matchesKidOrShared =
                        plannerScope === 'child'
                          ? task.kidId === activeKidId
                          : plannerScope === 'shared'
                          ? task.kidId === null
                          : task.kidId === null || task.kidId === activeKidId;
                      if (!matchesKidOrShared) return false;
                      return isTaskScheduledForDate(task, selectedPlannerDateISO);
                    });

                    const completedCount = childTasks.filter((task) =>
                      isTaskCompletedOnDate(task, selectedPlannerDateISO)
                    ).length;
                    const progress = childTasks.length
                      ? Math.round((completedCount / childTasks.length) * 100)
                      : 0;
                    const weeklyDays = Array.from({ length: 7 }, (_, index) => {
                      const dayDate = new Date(
                        localNow.getFullYear(),
                        localNow.getMonth(),
                        localNow.getDate() + plannerWeekOffset * 7 + index - localNow.getDay(),
                        12,
                        0,
                        0
                      );
                      return { date: dayDate, iso: dateLocalISO(dayDate) };
                    });
                    const weeklyDateSet = new Set(weeklyDays.map((day) => day.iso));
                    const weeklyTaskInstances = weeklyDays.flatMap(({ iso }) =>
                      state.tasks
                        .filter((task) =>
                          (task.kidId === null || task.kidId === activeKidId) &&
                          isTaskScheduledForDate(task, iso)
                        )
                        .map((task) => ({ task, iso }))
                    );
                    const weeklyCompletedCount = weeklyTaskInstances.filter(({ task, iso }) =>
                      isTaskCompletedOnDate(task, iso)
                    ).length;
                    const weeklyEventCount = state.events.filter((event) =>
                      weeklyDateSet.has(event.date) &&
                      (event.childId == null || event.childId === activeKidId)
                    ).length;
                    const recentRecordsStartISO = dateLocalISO(new Date(Date.now() - 13 * 24 * 60 * 60 * 1000));
                    const weeklyRecordsWindowAvailable = weeklyDays.every((day) => day.iso >= recentRecordsStartISO);
                    const weeklyRecordCount = weeklyRecordsWindowAvailable
                      ? activeKidRecentRecords.filter((record) =>
                          weeklyDateSet.has(dateLocalISO(new Date(record.occurred_at)))
                        ).length
                      : null;

                    const visibleTasks = childTasks
                      .filter((task) => {
                        const doneOnDate = isTaskCompletedOnDate(task, selectedPlannerDateISO);
                        return (
                          taskView === 'all' || (taskView === 'done' ? doneOnDate : !doneOnDate)
                        );
                      })
                      .filter((task) => plannerOwner === 'all' || task.owner === plannerOwner)
                      .filter(
                        (task) => plannerCategory === 'all' || task.category === plannerCategory
                      )
                      .slice()
                      .sort((a, b) => a.time.localeCompare(b.time));

                    return (
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[10px] text-white/85">
                            <span>{isEn ? 'Daily progress' : 'نسبة إنجاز اليوم'}</span>
                            <span className="font-black tabular-nums">
                              {completedCount}/{childTasks.length} · {progress}%
                            </span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-white/15">
                            <div
                              className={`h-full rounded-full ${activeKidVisual.progressBarClass} transition-all duration-500`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>

                        <section
                          data-testid="command-center-weekly-summary"
                          aria-label={isEn ? 'Weekly family summary' : 'ملخص الأسبوع'}
                          className="rounded-2xl border border-white/15 bg-slate-950/15 p-3 space-y-2.5"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <h3 className="text-[11px] font-black text-white">{isEn ? 'Your week at a glance' : 'ملخص أسبوع طفلك'}</h3>
                              <p className="mt-0.5 text-[9px] text-white/65">{isEn ? 'A quick view of what happened and what is coming up' : 'نظرة سريعة على اللي اتعمل والمواعيد المسجلة'}</p>
                            </div>
                            <span className="rounded-full bg-white/10 px-2 py-1 text-[9px] font-bold text-white/80 tabular-nums">{weeklyDays[0].iso.slice(5)} — {weeklyDays[6].iso.slice(5)}</span>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <div className="rounded-xl bg-white/[0.08] p-2">
                              <div className="text-[9px] text-white/65">{isEn ? 'Tasks done' : 'مهام اتعملت'}</div>
                              <div className="mt-1 text-lg font-black leading-none text-white tabular-nums">{weeklyCompletedCount}<span className="mx-1 text-[10px] font-semibold text-white/55">/ {weeklyTaskInstances.length}</span></div>
                              <div className="mt-1 text-[8px] text-white/55">{weeklyTaskInstances.length ? `${Math.round((weeklyCompletedCount / weeklyTaskInstances.length) * 100)}% ${isEn ? 'complete' : 'إنجاز'}` : (isEn ? 'No tasks planned' : 'مفيش مهام مجدولة')}</div>
                            </div>
                            <div className="rounded-xl bg-white/[0.08] p-2">
                              <div className="text-[9px] text-white/65">{isEn ? 'Appointments' : 'مواعيد'}</div>
                              <div className="mt-1 text-lg font-black leading-none text-white tabular-nums">{weeklyEventCount}</div>
                              <div className="mt-1 text-[8px] text-white/55">{isEn ? 'Family calendar' : 'في تقويم الأسرة'}</div>
                            </div>
                            <div className="rounded-xl bg-white/[0.08] p-2">
                              <div className="text-[9px] text-white/65">{isEn ? 'Child records' : 'تسجيلات الطفل'}</div>
                              <div className="mt-1 text-lg font-black leading-none text-white tabular-nums">{weeklyRecordCount === null ? '—' : weeklyRecordCount}</div>
                              <div className="mt-1 text-[8px] text-white/55">{weeklyRecordCount === null ? (isEn ? 'Available for recent weeks' : 'متاحة للأسابيع الأخيرة') : (isEn ? 'Saved moments & care' : 'لحظات ومتابعات محفوظة')}</div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between gap-2 border-t border-white/10 pt-2">
                            <span className="text-[9px] text-white/65">{isEn ? 'Still to do this week' : 'لسه متبقي خلال الأسبوع'}</span>
                            <strong className="text-[11px] font-black text-white tabular-nums">{weeklyTaskInstances.length - weeklyCompletedCount}</strong>
                          </div>
                        </section>

                        <details className="group rounded-xl border border-white/10 bg-white/[0.05]">
                          <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between gap-2 px-3 text-[11px] font-bold text-white/85 [&::-webkit-details-marker]:hidden"><span>{isEn ? 'More filters' : 'تصفية متقدمة'}</span><span className="text-white/60 transition-transform group-open:rotate-180" aria-hidden="true">⌄</span></summary>
                          <div className="grid grid-cols-1 gap-2 border-t border-white/10 p-2 sm:grid-cols-3">
                            <select aria-label={isEn ? 'Filter by task scope' : 'تصفية حسب الطفل أو المشترك'} value={plannerScope} onChange={(event) => setPlannerScope(event.target.value as 'all' | 'child' | 'shared')} className={`min-h-10 rounded-lg border border-white/15 ${activeKidVisual.selectBgClass} px-2.5 text-[11px] font-bold text-white outline-none`}><option value="all">{isEn ? `${activeKidName} + Shared` : `مهام ${activeKidName} والمشتركة`}</option><option value="child">{isEn ? `${activeKidName} only` : `مهام ${activeKidName} فقط`}</option><option value="shared">{isEn ? 'Shared family tasks' : 'المهام المشتركة للأسرة'}</option></select>
                            <select aria-label={isEn ? 'Filter by parent' : 'تصفية حسب المسؤول'} value={plannerOwner} onChange={(event) => setPlannerOwner(event.target.value as 'all' | 'الأم' | 'الأب' | 'مشترك')} className={`min-h-10 rounded-lg border border-white/15 ${activeKidVisual.selectBgClass} px-2.5 text-[11px] font-bold text-white outline-none`}><option value="all">{isEn ? 'All responsible' : 'كل المسؤولين'}</option><option value="الأم">{isEn ? 'Mother' : 'الأم'}</option><option value="الأب">{isEn ? 'Father' : 'الأب'}</option><option value="مشترك">{isEn ? 'Shared' : 'مشترك'}</option></select>
                            <select aria-label={isEn ? 'Filter by category' : 'تصفية حسب التصنيف'} value={plannerCategory} onChange={(event) => setPlannerCategory(event.target.value)} className={`min-h-10 rounded-lg border border-white/15 ${activeKidVisual.selectBgClass} px-2.5 text-[11px] font-bold text-white outline-none`}><option value="all">{isEn ? 'All categories' : 'كل التصنيفات'}</option><option value="روتين يومي">{isEn ? 'Daily routine' : 'روتين يومي'}</option><option value="الأكل والتغذية">{isEn ? 'Food & nutrition' : 'الأكل والتغذية'}</option><option value="النوم والراحة">{isEn ? 'Sleep & rest' : 'النوم والراحة'}</option><option value="التعليم والتعلم">{isEn ? 'Learning' : 'التعليم والتعلم'}</option><option value="الرياضة والحركة">{isEn ? 'Sports & movement' : 'الرياضة والحركة'}</option><option value="الصحة والمتابعة">{isEn ? 'Health' : 'الصحة والمتابعة'}</option><option value="الصلاة والقيم">{isEn ? 'Prayer & values' : 'الصلاة والقيم'}</option><option value="مواعيد وأنشطة">{isEn ? 'Appointments & activities' : 'المواعيد والأنشطة'}</option></select>
                          </div>
                        </details>

                        {/* Status Filter Tabs */}                        {/* Status Filter Tabs */}
                        <div className="flex gap-2 overflow-x-auto pb-1">
                          {(
                            [
                              { id: 'all', ar: 'كل المهام', en: 'All', count: childTasks.length },
                              {
                                id: 'open',
                                ar: 'المتبقية',
                                en: 'To do',
                                count: childTasks.length - completedCount,
                              },
                              { id: 'done', ar: 'المكتملة', en: 'Done', count: completedCount },
                            ] as const
                          ).map((filter) => (
                            <button
                              key={filter.id}
                              type="button"
                              aria-pressed={taskView === filter.id}
                              onClick={() => setTaskView(filter.id)}
                              className={`min-h-9 shrink-0 rounded-xl border px-3 text-[10px] font-bold transition cursor-pointer ${
                                taskView === filter.id
                                  ? activeKidVisual.activePillClass
                                  : 'border-white/15 bg-white/5 text-white/90'
                              }`}
                            >
                              {isEn ? filter.en : filter.ar} ({filter.count})
                            </button>
                          ))}
                        </div>

                        {/* Calm task rows: one primary action and compact secondary controls. */}
                        <div className="space-y-2">
                          {visibleTasks.map((task) => {
                            const doneOnDate = isTaskCompletedOnDate(task, selectedPlannerDateISO);
                            const isEditingThis = editingCommandTaskId === task.id && editTaskDraft;
                            const isConfirmingDelete = confirmDeleteTaskId === task.id;
                            return (
                              <div key={task.id} data-testid={`command-task-row-${task.id}`} className="rounded-xl border border-white/10 bg-white/[0.07] p-3">
                                <div className="flex items-center gap-2.5">
                                  <button type="button" aria-label={doneOnDate ? (isEn ? 'Mark incomplete' : 'إعادة فتح المهمة') : (isEn ? 'Complete task' : 'إنجاز المهمة')} disabled={!onToggleRoutineTask} onClick={() => { void toggleCommandTask(task, !doneOnDate, selectedPlannerDateISO); }} className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border text-sm font-black transition cursor-pointer ${doneOnDate ? 'border-emerald-300 bg-emerald-300 text-[#073F43]' : 'border-white/30 bg-white/5 text-white hover:bg-white/15'}`}>{doneOnDate ? '✓' : '○'}</button>
                                  <div className="min-w-0 flex-1"><div className={`truncate text-[13px] font-bold ${doneOnDate ? 'text-white/55 line-through' : 'text-white'}`}>{task.name}</div><div className="mt-1 flex flex-wrap items-center gap-x-2 text-[10px] text-white/65"><span>{task.time}</span><span>· {task.owner || (isEn ? 'Shared' : 'مشترك')}</span>{task.cadence === 'weekly' && <span>· {isEn ? 'Weekly' : 'أسبوعي'}</span>}{task.cadence === 'monthly' && <span>· {isEn ? `Monthly · day ${task.dayOfMonth || 1}` : `شهري · يوم ${task.dayOfMonth || 1}`}</span>}</div></div>
                                  <div className="flex shrink-0 items-center gap-1">
                                    {onEditRoutineTask && <button type="button" data-testid={`command-task-edit-btn-${task.id}`} aria-label={isEn ? 'Edit task' : 'تعديل المهمة'} title={isEn ? 'Edit' : 'تعديل'} onClick={() => { if (editingCommandTaskId === task.id) { setEditingCommandTaskId(null); setEditTaskDraft(null); } else { setEditingCommandTaskId(task.id); setConfirmDeleteTaskId(null); setEditTaskDraft({ name: task.name, time: task.time || '17:00', category: task.category || 'روتين يومي', owner: task.owner === 'الأم' || task.owner === 'الأب' ? task.owner : 'مشترك', kidId: task.kidId, cadence: task.cadence || 'daily', dayOfWeek: task.dayOfWeek ?? plannerDay, dayOfMonth: task.dayOfMonth ?? new Date().getDate() }); } }} className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white/[0.06] text-sm text-white/80 hover:bg-white/15 cursor-pointer">✎</button>}
                                    {onDeleteRoutineTask && <button type="button" data-testid={`command-task-delete-btn-${task.id}`} aria-label={isEn ? 'Delete task' : 'حذف المهمة'} title={isEn ? 'Delete' : 'حذف'} onClick={() => { setConfirmDeleteTaskId(isConfirmingDelete ? null : task.id); setEditingCommandTaskId(null); }} className="grid h-9 w-9 place-items-center rounded-lg border border-rose-200/20 bg-rose-400/10 text-sm text-rose-100 hover:bg-rose-400/20 cursor-pointer">×</button>}
                                  </div>
                                </div>

                                {/* Inline Delete Confirmation */}
                                {isConfirmingDelete && (
                                  <div
                                    data-testid={`command-task-delete-confirm-${task.id}`}
                                    className="flex items-center justify-between gap-2 rounded-xl border border-rose-300/35 bg-rose-950/60 px-3 py-2 text-[11px]"
                                  >
                                    <span className="font-bold text-rose-100">
                                      {isEn
                                        ? 'Delete this task?'
                                        : 'تأكيد حذف هذه المهمة؟'}
                                    </span>
                                    <div className="flex items-center gap-1.5">
                                      <button
                                        type="button"
                                        data-testid={`command-task-confirm-delete-yes-${task.id}`}
                                        onClick={() => {
                                          setLastDeletedTask(task);
                                          onDeleteRoutineTask?.(task.id);
                                          setConfirmDeleteTaskId(null);
                                        }}
                                        className="rounded-lg bg-rose-500 px-2.5 py-1 text-[10px] font-black text-white cursor-pointer"
                                      >
                                        {isEn ? 'Yes, delete' : 'نعم، احذف'}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setConfirmDeleteTaskId(null)}
                                        className="rounded-lg border border-white/20 px-2.5 py-1 text-[10px] font-bold text-white cursor-pointer"
                                      >
                                        {isEn ? 'Cancel' : 'إلغاء'}
                                      </button>
                                    </div>
                                  </div>
                                )}

                                {/* Inline Edit Task Form */}
                                {isEditingThis && editTaskDraft && (
                                  <form
                                    data-testid={`command-task-edit-form-${task.id}`}
                                    className="grid grid-cols-1 sm:grid-cols-2 gap-2 rounded-xl border border-white/20 bg-black/25 p-2.5"
                                    onSubmit={(e) => {
                                      e.preventDefault();
                                      if (!editTaskDraft.name.trim()) return;
                                      onEditRoutineTask?.(task.id, {
                                        name: editTaskDraft.name.trim(),
                                        time: editTaskDraft.time,
                                        category: editTaskDraft.category,
                                        owner: editTaskDraft.owner,
                                        kidId: editTaskDraft.kidId,
                                        cadence: editTaskDraft.cadence,
                                        dayOfWeek:
                                          editTaskDraft.cadence === 'weekly'
                                            ? editTaskDraft.dayOfWeek
                                            : undefined,
                                        dayOfMonth:
                                          editTaskDraft.cadence === 'monthly'
                                            ? editTaskDraft.dayOfMonth
                                            : undefined,
                                      });
                                      setEditingCommandTaskId(null);
                                      setEditTaskDraft(null);
                                    }}
                                  >
                                    <input
                                      value={editTaskDraft.name}
                                      onChange={(e) =>
                                        setEditTaskDraft({ ...editTaskDraft, name: e.target.value })
                                      }
                                      maxLength={120}
                                      aria-label={isEn ? 'Edit task name' : 'تعديل اسم المهمة'}
                                      className="min-h-9 rounded-lg bg-white px-2.5 text-xs font-semibold text-slate-900"
                                    />
                                    <input
                                      type="time"
                                      value={editTaskDraft.time}
                                      onChange={(e) =>
                                        setEditTaskDraft({ ...editTaskDraft, time: e.target.value })
                                      }
                                      aria-label={isEn ? 'Edit task time' : 'تعديل وقت المهمة'}
                                      className="min-h-9 rounded-lg bg-white px-2.5 text-xs font-semibold text-slate-900"
                                    />
                                    <select
                                      value={editTaskDraft.category}
                                      onChange={(e) =>
                                        setEditTaskDraft({
                                          ...editTaskDraft,
                                          category: e.target.value,
                                        })
                                      }
                                      aria-label={isEn ? 'Edit task category' : 'تعديل تصنيف المهمة'}
                                      className="min-h-9 rounded-lg bg-white px-2.5 text-xs font-semibold text-slate-900"
                                    >
                                      <option value="روتين يومي">{isEn ? 'Daily routine' : 'روتين يومي'}</option>
                                      <option value="الأكل والتغذية">{isEn ? 'Food & nutrition' : 'الأكل والتغذية'}</option>
                                      <option value="النوم والراحة">{isEn ? 'Sleep & rest' : 'النوم والراحة'}</option>
                                      <option value="التعليم والتعلم">{isEn ? 'Learning' : 'التعليم والتعلم'}</option>
                                      <option value="الرياضة والحركة">{isEn ? 'Sports & movement' : 'الرياضة والحركة'}</option>
                                      <option value="الصحة والمتابعة">{isEn ? 'Health' : 'الصحة والمتابعة'}</option>
                                      <option value="الصلاة والقيم">{isEn ? 'Prayer & values' : 'الصلاة والقيم'}</option>
                                      <option value="مواعيد وأنشطة">{isEn ? 'Appointments & activities' : 'مواعيد وأنشطة'}</option>
                                    </select>
                                    <select
                                      value={editTaskDraft.owner}
                                      onChange={(e) =>
                                        setEditTaskDraft({
                                          ...editTaskDraft,
                                          owner: e.target.value,
                                        })
                                      }
                                      aria-label={isEn ? 'Edit responsible parent' : 'تعديل المسؤول'}
                                      className="min-h-9 rounded-lg bg-white px-2.5 text-xs font-semibold text-slate-900"
                                    >
                                      <option value="مشترك">{isEn ? 'Shared' : 'مشترك'}</option>
                                      <option value="الأم">{isEn ? 'Mother' : 'الأم'}</option>
                                      <option value="الأب">{isEn ? 'Father' : 'الأب'}</option>
                                    </select>
                                    <select
                                      value={editTaskDraft.kidId === null ? 'shared' : String(editTaskDraft.kidId)}
                                      onChange={(e) =>
                                        setEditTaskDraft({
                                          ...editTaskDraft,
                                          kidId: e.target.value === 'shared' ? null : Number(e.target.value),
                                        })
                                      }
                                      aria-label={isEn ? 'Edit task target' : 'تخصيص المهمة'}
                                      className="min-h-9 rounded-lg bg-white px-2.5 text-xs font-semibold text-slate-900"
                                    >
                                      <option value="shared">{isEn ? 'Shared family task' : 'مهمة مشتركة للأسرة'}</option>
                                      {state.kids.map((k) => (
                                        <option key={k.id} value={String(k.id)}>
                                          {locText(k.name, lang)}
                                        </option>
                                      ))}
                                    </select>
                                    <select
                                      value={editTaskDraft.cadence}
                                      onChange={(e) =>
                                        setEditTaskDraft({
                                          ...editTaskDraft,
                                          cadence: e.target.value as 'daily' | 'weekly' | 'monthly',
                                        })
                                      }
                                      aria-label={isEn ? 'Edit repeat schedule' : 'تعديل تكرار المهمة'}
                                      className="min-h-9 rounded-lg bg-white px-2.5 text-xs font-semibold text-slate-900"
                                    >
                                      <option value="daily">{isEn ? 'Every day' : 'يومي'}</option>
                                      <option value="weekly">{isEn ? 'Every week' : 'أسبوعي'}</option>
                                      <option value="monthly">{isEn ? 'Every month' : 'شهري'}</option>
                                    </select>
                                    {editTaskDraft.cadence === 'weekly' && (
                                      <select
                                        value={editTaskDraft.dayOfWeek}
                                        onChange={(e) =>
                                          setEditTaskDraft({
                                            ...editTaskDraft,
                                            dayOfWeek: Number(e.target.value),
                                          })
                                        }
                                        aria-label={isEn ? 'Edit weekday' : 'تعديل يوم الأسبوع'}
                                        className="min-h-9 rounded-lg bg-white px-2.5 text-xs font-semibold text-slate-900"
                                      >
                                        {(isEn
                                          ? ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
                                          : ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
                                        ).map((dayName, idx) => (
                                          <option key={dayName} value={idx}>
                                            {dayName}
                                          </option>
                                        ))}
                                      </select>
                                    )}
                                    {editTaskDraft.cadence === 'monthly' && (
                                      <input
                                        type="number"
                                        min={1}
                                        max={31}
                                        value={editTaskDraft.dayOfMonth}
                                        onChange={(e) =>
                                          setEditTaskDraft({
                                            ...editTaskDraft,
                                            dayOfMonth: Math.max(1, Math.min(31, Number(e.target.value) || 1)),
                                          })
                                        }
                                        aria-label={isEn ? 'Edit day of month' : 'تعديل يوم الشهر'}
                                        className="min-h-9 rounded-lg bg-white px-2.5 text-xs font-semibold text-slate-900"
                                      />
                                    )}
                                    <div className="flex items-center gap-2 sm:col-span-2">
                                      <button
                                        type="submit"
                                        className={`min-h-9 flex-1 rounded-lg px-3 text-xs font-black cursor-pointer ${activeKidVisual.accentButtonClass}`}
                                      >
                                        {isEn ? 'Save changes' : 'حفظ التعديلات'}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingCommandTaskId(null);
                                          setEditTaskDraft(null);
                                        }}
                                        className="min-h-9 rounded-lg border border-white/25 px-3 text-xs font-bold text-white cursor-pointer"
                                      >
                                        {isEn ? 'Cancel' : 'إلغاء'}
                                      </button>
                                    </div>
                                  </form>
                                )}
                              </div>
                            );
                          })}

                          {visibleTasks.length === 0 && (
                            <div className="rounded-xl border border-dashed border-white/20 p-3 text-center text-xs text-white/80">
                              {childTasks.length === 0
                                ? isEn
                                  ? 'No tasks scheduled for this day. Add the first item below.'
                                  : 'لسه مفيش مهام مجدولة في اليوم ده. أضيفوا أول مهمة بالأسفل.'
                                : isEn
                                ? 'Nothing matches the selected filter.'
                                : 'مفيش مهام مطابقة للتصفية المختارة حاليًا.'}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Quick Add Task Form */}
                  <form
                    className="grid grid-cols-1 gap-2 sm:grid-cols-2 pt-1"
                    onSubmit={(event) => {
                      event.preventDefault();
                      const name = quickTaskName.trim();
                      if (!name || !onAddSuggestedRoutineTask) return;
                      const targetKidId = quickTaskScope === 'shared' ? null : activeKidId;
                      onAddSuggestedRoutineTask(
                        name,
                        quickTaskTime,
                        targetKidId,
                        quickTaskCategory,
                        quickTaskCadence,
                        quickTaskOwner,
                        quickTaskDay,
                        quickTaskDayOfMonth
                      );
                      setQuickTaskName('');
                    }}
                  >
                    <input
                      value={quickTaskName}
                      onChange={(event) => setQuickTaskName(event.target.value)}
                      maxLength={90}
                      placeholder={isEn ? 'Add a task or appointment…' : 'أضيفوا مهمة جديدة لليوم...'}
                      aria-label={isEn ? 'New task' : 'مهمة جديدة'}
                      className="min-h-11 min-w-0 rounded-xl border border-white/15 bg-white px-3 text-xs font-semibold text-slate-900 outline-none placeholder:text-slate-400"
                    />
                    <input
                      type="time"
                      aria-label={isEn ? 'Task time' : 'ميعاد المهمة'}
                      value={quickTaskTime}
                      onChange={(event) => setQuickTaskTime(event.target.value)}
                      className="min-h-11 rounded-xl border border-white/15 bg-white px-3 text-xs font-semibold text-slate-900 outline-none"
                    />
                    <select
                      aria-label={isEn ? 'Task category' : 'نوع المهمة'}
                      value={quickTaskCategory}
                      onChange={(event) => setQuickTaskCategory(event.target.value)}
                      className="min-h-11 rounded-xl border border-white/15 bg-white px-3 text-xs font-semibold text-slate-900 outline-none"
                    >
                      <option value="روتين يومي">{isEn ? 'Daily routine' : 'روتين يومي'}</option>
                      <option value="الأكل والتغذية">{isEn ? 'Food & nutrition' : 'الأكل والتغذية'}</option>
                      <option value="النوم والراحة">{isEn ? 'Sleep & rest' : 'النوم والراحة'}</option>
                      <option value="التعليم والتعلم">{isEn ? 'Learning' : 'التعليم والتعلم'}</option>
                      <option value="الرياضة والحركة">{isEn ? 'Sports & movement' : 'الرياضة والحركة'}</option>
                      <option value="الصحة والمتابعة">{isEn ? 'Health' : 'الصحة والمتابعة'}</option>
                      <option value="الصلاة والقيم">{isEn ? 'Prayer & values' : 'الصلاة والقيم'}</option>
                      <option value="مواعيد وأنشطة">{isEn ? 'Appointments & activities' : 'مواعيد وأنشطة'}</option>
                    </select>
                    <select
                      aria-label={isEn ? 'Responsible parent' : 'المسؤول عن المهمة'}
                      value={quickTaskOwner}
                      onChange={(event) =>
                        setQuickTaskOwner(event.target.value as 'الأم' | 'الأب' | 'مشترك')
                      }
                      className="min-h-11 rounded-xl border border-white/15 bg-white px-3 text-xs font-semibold text-slate-900 outline-none"
                    >
                      <option value="مشترك">{isEn ? 'Shared' : 'مشترك بين الأب والأم'}</option>
                      <option value="الأم">{isEn ? 'Mother' : 'الأم'}</option>
                      <option value="الأب">{isEn ? 'Father' : 'الأب'}</option>
                    </select>
                    <select
                      aria-label={isEn ? 'Task target' : 'لمن هذه المهمة'}
                      value={quickTaskScope}
                      onChange={(event) =>
                        setQuickTaskScope(event.target.value as 'child' | 'shared')
                      }
                      className="min-h-11 rounded-xl border border-white/15 bg-white px-3 text-xs font-semibold text-slate-900 outline-none"
                    >
                      <option value="child">
                        {isEn ? `For ${activeKidName}` : `خاصة بـ ${activeKidName}`}
                      </option>
                      <option value="shared">
                        {isEn ? 'Shared family task' : 'مهمة أسرية مشتركة'}
                      </option>
                    </select>
                    <select
                      aria-label={isEn ? 'Repeat schedule' : 'تكرار المهمة'}
                      value={quickTaskCadence}
                      onChange={(event) =>
                        setQuickTaskCadence(
                          event.target.value as 'daily' | 'weekly' | 'monthly'
                        )
                      }
                      className="min-h-11 rounded-xl border border-white/15 bg-white px-3 text-xs font-semibold text-slate-900 outline-none"
                    >
                      <option value="daily">{isEn ? 'Every day' : 'كل يوم'}</option>
                      <option value="weekly">{isEn ? 'Every week' : 'كل أسبوع'}</option>
                      <option value="monthly">{isEn ? 'Every month' : 'كل شهر'}</option>
                    </select>
                    {quickTaskCadence === 'weekly' && (
                      <select
                        aria-label={isEn ? 'Scheduled weekday' : 'يوم تنفيذ المهمة'}
                        value={quickTaskDay}
                        onChange={(event) => setQuickTaskDay(Number(event.target.value))}
                        className="min-h-11 rounded-xl border border-white/15 bg-white px-3 text-xs font-semibold text-slate-900 outline-none"
                      >
                        {(isEn
                          ? ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
                          : ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
                        ).map((day, index) => (
                          <option key={day} value={index}>
                            {day}
                          </option>
                        ))}
                      </select>
                    )}
                    {quickTaskCadence === 'monthly' && (
                      <input
                        type="number"
                        min={1}
                        max={31}
                        aria-label={isEn ? 'Scheduled day of month' : 'يوم الشهر (١–٣١)'}
                        value={quickTaskDayOfMonth}
                        onChange={(event) =>
                          setQuickTaskDayOfMonth(
                            Math.max(1, Math.min(31, Number(event.target.value) || 1))
                          )
                        }
                        className="min-h-11 rounded-xl border border-white/15 bg-white px-3 text-xs font-semibold text-slate-900 outline-none"
                      />
                    )}
                    <button
                      type="submit"
                      disabled={!quickTaskName.trim() || !onAddSuggestedRoutineTask}
                      className={`min-h-11 rounded-xl px-4 text-xs font-black disabled:opacity-50 cursor-pointer ${
                        quickTaskCadence === 'daily' ? 'sm:col-span-2' : ''
                      } ${activeKidVisual.accentButtonClass}`}
                    >
                      {isEn ? '+ Add to Plan' : '+ إضافة للجدول'}
                    </button>
                  </form>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => navigateTo('calendar')}
                    className="min-h-11 rounded-xl border border-white/20 bg-white/10 px-3 text-xs font-bold text-white hover:bg-white/15 cursor-pointer"
                  >
                    📅 {isEn ? 'Calendar & appointments' : 'التقويم والمواعيد'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOpenAccordions((prev) => ({ ...prev, quickTrack: true }));
                      document
                        .getElementById('home-one-handed-quick-pulse')
                        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    className="min-h-11 rounded-xl border border-white/20 bg-white/10 px-3 text-xs font-bold text-white hover:bg-white/15 cursor-pointer"
                  >
                    ✍️ {isEn ? 'Log a moment' : 'سجّل لحظة من يومه'}
                  </button>
                </div>
              </>
            )}
          </section>
        );
      })()}

      {activeKid && (
        <React.Suspense fallback={<div className="min-h-24 animate-pulse rounded-2xl bg-slate-100/70 dark:bg-white/5" aria-label="Loading section" />}><HomeDailyExperience
          language={lang}
          childName={activeKidName}
          childEmoji={activeKid.emoji}
          ageLabel={activeKidStageLabel}
          records={activeKidRecentRecords}
          todayProgress={quickPulseByKid[activeKidId] || {
            sleepLogged: false,
            mealLogged: false,
            careLogged: false,
          }}
          onOpenDailyLog={() => {
            setOpenAccordions((previous) => ({ ...previous, quickTrack: true }));
            window.setTimeout(() => {
              document.getElementById('home-one-handed-quick-pulse')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
          }}
          onOpenMood={openChildMoodCheckin}
          onOpenProfile={() => navigateTo('children')}
        /></React.Suspense>
      )}

      <HomeContentGroupHeading
        id="home-content-group-daily"
        step="١"
        title={isEn ? 'Follow your child’s day' : 'تفاصيل يوم طفلك'}
        description={isEn ? 'Small daily records, interests and routines — all connected to the selected child.' : 'سجّلوا نومه وأكله ومشاعره والحاجات اللي بيحب يعملها.'}
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
                        <p className="text-xs font-black text-[var(--color-text)] dark:text-white">{isEn ? activeKidName + '’s daily log' : 'إيه اللي سجلتوه النهارده لـ ' + activeKidName}</p>
                        <p className="mt-1 text-[10px] font-semibold text-[var(--color-muted)]">{isEn ? 'Saved sleep, meal and care entries appear in the child profile.' : 'التسجيلات اللي بتحفظوها هتلاقوها في ملف طفلكم.'}</p>
                      </div>
                      <span className="shrink-0 rounded-xl bg-white/80 dark:bg-[#0B131A] px-3 py-2 text-xs font-black tabular-nums text-teal-800 dark:text-teal-200">{loggedCount}/3</span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/80 dark:bg-[#0B131A]">
                      <div className="h-full rounded-full bg-gradient-to-r from-teal-500 to-sky-500 transition-all duration-500" style={{ width: progressPercent + '%' }} />
                    </div>
                    <p className="mt-1.5 text-[9px] font-bold text-[var(--color-muted)]">{progressPercent === 100 ? (isEn ? 'Daily essentials completed' : 'اكتملت أساسيات تسجيل اليوم') : (isEn ? 'Complete the three essentials when they happen.' : 'سجّلوا اللي حصل وقت ما تحبوا، ومش لازم تسجلوا كل حاجة.')}</p>
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
                      <span>{isEn ? 'Emotional check-in' : 'حاسس بإيه؟'}</span>
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
          <section data-testid="child-recent-activity" className="rounded-2xl border border-white/60 dark:border-[#294352] bg-gradient-to-br from-slate-50 to-white dark:from-[#132631] dark:to-[#101D26] p-3.5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-black text-[var(--color-text)] dark:text-white">{isEn ? 'Recent moments' : 'آخر الحاجات اللي سجلتوها'}</h3>
                <p className="mt-0.5 text-[11px] text-[var(--color-muted)] dark:text-[#94A3B8]">{isEn ? 'A small timeline that grows with your child.' : 'كل تسجيل بيضيف جزء جديد لحكاية طفلك.'}</p>
              </div>
              <span className="rounded-full bg-teal-500/10 px-2.5 py-1 text-[10px] font-black text-teal-800 dark:text-teal-200">{activeKidRecentRecords.length} {isEn ? 'records' : 'تسجيل'}</span>
            </div>
            {activeKidRecentRecords.length > 0 ? (
              <div className="space-y-2">
                {activeKidRecentRecords.slice(0, 3).map((record) => {
                  const labels: Record<string, { ar: string; en: string; icon: string }> = {
                    sleep_log: { ar: 'النوم والراحة', en: 'Sleep & rest', icon: '🌙' },
                    nutrition: { ar: 'الأكل والتغذية', en: 'Food & nutrition', icon: '🥣' },
                    sports: { ar: 'اللعب والحركة', en: 'Play & movement', icon: '🏃' },
                    emotional_social: { ar: 'المشاعر', en: 'Feelings', icon: '💛' },
                    education: { ar: 'التعلّم', en: 'Learning', icon: '📚' },
                    routine: { ar: 'الروتين', en: 'Routine', icon: '🗓️' },
                    growth_measurement: { ar: 'النمو', en: 'Growth', icon: '📏' },
                    vaccination: { ar: 'التطعيمات', en: 'Vaccinations', icon: '💉' },
                    medical_event: { ar: 'الصحة', en: 'Health', icon: '🩺' },
                    milestone: { ar: 'إنجاز جديد', en: 'Milestone', icon: '⭐' },
                    hobby: { ar: 'الهوايات', en: 'Hobbies', icon: '🎨' },
                    memory: { ar: 'ذكرى', en: 'Memory', icon: '📸' },
                    daily_note: { ar: 'ملاحظة', en: 'Note', icon: '📝' },
                    other: { ar: 'لحظة عائلية', en: 'Family moment', icon: '💚' },
                  };
                  const label = labels[record.record_type] || labels.other;
                  return (
                    <div key={record.id} className="flex items-start gap-3 rounded-xl border border-[var(--color-border)]/70 dark:border-[#294352] bg-white/80 dark:bg-[#0F202A] p-2.5">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-teal-500/10 text-lg">{label.icon}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-1">
                          <span className="text-[10px] font-extrabold text-teal-800 dark:text-teal-200">{isEn ? label.en : label.ar}</span>
                          <time dateTime={record.occurred_at} className="text-[10px] font-semibold text-[var(--color-muted)] dark:text-[#94A3B8]">{new Date(record.occurred_at).toLocaleDateString(isEn ? 'en' : 'ar', { day: 'numeric', month: 'short' })}</time>
                        </div>
                        <p className="mt-0.5 truncate text-xs font-bold text-[var(--color-text)] dark:text-[#F8FAFC]">{record.title}</p>
                        {record.notes ? <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-[var(--color-muted)] dark:text-[#94A3B8]">{record.notes}</p> : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-teal-500/30 bg-teal-500/5 px-3 py-4 text-center">
                <span className="text-2xl" aria-hidden="true">🌱</span>
                <p className="mt-1 text-xs font-bold text-[var(--color-text)] dark:text-white">{isEn ? 'Your child’s story starts with a small moment.' : 'حكاية طفلك بتبدأ بتفصيلة صغيرة.'}</p>
                <p className="mt-1 text-[11px] text-[var(--color-muted)] dark:text-[#94A3B8]">{isEn ? 'Save sleep, food, feelings or a new skill to build a useful history.' : 'سجّل النوم أو الأكل أو المشاعر أو مهارة جديدة علشان يبقى عندكم سجل مفيد مع الوقت.'}</p>
              </div>
            )}
            <button type="button" onClick={() => navigateTo('children')} className="min-h-10 w-full rounded-xl border border-teal-500/25 bg-teal-500/8 px-3 py-2 text-xs font-black text-teal-800 dark:text-teal-200 hover:bg-teal-500/15">
              {isEn ? 'Open the full child record' : 'افتح سجل الطفل بالكامل'} {isEn ? '→' : '←'}
            </button>
          </section>
          </>
          )}
        </div>
      </HomeAccordionCard>

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
          7. ACCORDION: DAILY CARE ESSENTIALS (NUTRITION, HYDRATION & SPORTS — CHECKLIST #3)
          ===================================================================== */}
      <HomeAccordionCard
        id="home-daily-essentials-hub"
        testId="home-daily-essentials-hub"
        iconEmoji="🌟"
        iconBgClass="bg-sky-500/15 text-sky-700 dark:text-sky-300"
        title={
          isEn
            ? `Food, water and movement for ${activeKidName}`
            : `الأكل والماء والحركة مع ${activeKidName}`
        }
        subtitle={
          isEn
            ? 'Food, age-appropriate water tracking, and daily movement'
            : 'أفكار للأكل، ومتابعة شرب الماء لما يكون مناسب لسن الطفل، وحركة ولعب كل يوم'
        }
        badgeText={`${currentWaterCups} 💧`}
        badgeClass="bg-sky-500/15 text-sky-700 dark:text-sky-300"
        headerExtraAction={<button type="button" onClick={() => navigateTo('medical')} className="min-h-[40px] rounded-xl border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-xs font-black text-sky-800 dark:text-sky-200">{isEn ? 'Open health record' : 'فتح السجل الصحي'}</button>}
        isOpen={Boolean(openAccordions.dailyEssentials)}
        onToggle={() => toggleAccordion('dailyEssentials')}
        isEn={isEn}
      >
        <div className="space-y-4">
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
                topRightBadge={<span>{currentWaterCups} {isEn ? 'logged' : 'مرات مسجلة'}</span>}
                title={isEn ? `Water servings logged for ${activeKidName}` : `مرات تقديم الماء لـ ${activeKidName}`}
                metaLeft={<span>{isEn ? 'A record, not a daily target' : 'للمتابعة فقط، مش هدف لازم توصلوله'}</span>}
                bodyContent={
                  <p className="text-xs font-semibold text-[var(--color-muted)] dark:text-[#CBD5E1] leading-relaxed">
                    {isEn
                      ? 'Record water servings offered during the day. Needs vary with age, food, weather and health; follow your child’s clinician for individual guidance.'
                      : 'سجلوا كل مرة قدمتوا فيها ماء خلال اليوم. احتياج الطفل بيختلف حسب سنه وأكله والجو وحالته الصحية؛ اسألوا طبيبه لو محتاجين توجيه.'}
                  </p>
                }
                footerLeft={
                  <span className="text-xs font-extrabold text-[var(--color-text)] dark:text-[#F8FAFC]">
                    {currentWaterCups} {isEn ? 'servings today' : 'مرات اليوم'}
                  </span>
                }
                footerRight={
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={Boolean(savingDashboardActions[`${activeKidId}:hydration`])}
                      onClick={() => handleAdjustWater(-1)}
                      aria-label={isEn ? 'Decrease water log' : 'تقليل عدد مرات تسجيل الماء'}
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
                      + {savingDashboardActions[`${activeKidId}:hydration`] ? (isEn ? 'Saving…' : 'جارٍ الحفظ…') : (isEn ? 'Log water' : 'سجلوا مرة 💧')}
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
                  <span>{isEn ? 'Movement & Play' : 'الحركة واللعب'}</span>
                </>
              }
              bodyContent={
                <div className="space-y-2.5 pt-1">
                  <p className="text-xs font-semibold text-[var(--color-muted)] dark:text-[#CBD5E1] leading-relaxed">
                    {isEn ? currentSport.descEn : currentSport.descAr}
                  </p>

                  <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                    {[
                      { id: 'outdoor' as const, labelAr: '⚽ لعب بره', labelEn: '⚽ Outdoor' },
                      { id: 'balance' as const, labelAr: '🧘‍♂️ توازن', labelEn: '🧘‍♂️ Balance' },
                      { id: 'cardio' as const, labelAr: '🏃‍♂️ حركة ونشاط', labelEn: '🏃‍♂️ Cardio' },
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
        title={isEn ? 'Support for the Whole Family' : 'دعم ومساندة للأسرة كلها'}
        subtitle={
          isEn
            ? 'Practical support for parents, individual child check-ins and everyday situations'
            : 'رسائل وإرشادات بسيطة للأب والأم، وأفكار تساعد الأسرة في المواقف اليومية'
        }
        badgeText={isEn ? 'Parents + Each Child' : 'البيت + كل طفل'}
        headerExtraAction={<div className="flex flex-wrap gap-2"><button type="button" onClick={() => navigateTo('notifications')} className="min-h-[40px] rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-black text-rose-800 dark:text-rose-200">{isEn ? 'Family messages' : 'رسائل الأسرة'}</button><button type="button" onClick={() => navigateTo('children')} className="min-h-[40px] rounded-xl border border-teal-500/30 bg-teal-500/10 px-3 py-2 text-xs font-black text-teal-800 dark:text-teal-200">{isEn ? 'Child profiles' : 'ملفات الأطفال'}</button></div>}
        isOpen={Boolean(openAccordions.parentingSupport)}
        onToggle={() => toggleAccordion('parentingSupport')}
        isEn={isEn}
      >
        <React.Suspense fallback={<div className="min-h-24 animate-pulse rounded-2xl bg-slate-100/70 dark:bg-white/5" aria-label="Loading section" />}><ParentingSupportCenter
          kids={state.kids}
          initialKidId={activeKid?.id ?? null}
          hideChildSelector={true}
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
            const actionKey = `mood:${kidId}`;
            if (savingDashboardActionKeysRef.current.has(actionKey)) return false;
            savingDashboardActionKeysRef.current.add(actionKey);
            try {
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
            const refreshed = await fetchRecentChildLifeRecords([String(targetKid.remoteId)], 14);
            if (!refreshed.error) {
              setRecentRecordsByKid((previous) => ({
                ...previous,
                [kidId]: refreshed.records,
              }));
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
            } finally {
              savingDashboardActionKeysRef.current.delete(actionKey);
            }
          }}
          onAddRoutineTask={onAddSuggestedRoutineTask}
        /></React.Suspense>
      </HomeAccordionCard>

      {/* =====================================================================
          9. ACCORDION: AGE-AWARE LEARNING & CURIOSITY
          ===================================================================== */}
      <HomeAccordionCard
        id="home-learning-track-card"
        testId="home-learning-track-card"
        iconEmoji="📚"
        iconBgClass="bg-sky-500/15 text-sky-700 dark:text-sky-300"
        title={isEn ? 'Learning, Curiosity & Development' : 'نتعلم ونجرب حاجات جديدة'}
        subtitle={isEn ? 'Simple shared activities shaped around the child’s age' : 'أفكار سهلة تعملوها سوا، على قد سن طفلك والحاجات اللي بيحبها'}
        badgeText={activeKidAge?.label || (isEn ? 'Age not recorded' : 'العمر غير مسجل')}
        isOpen={Boolean(openAccordions.learningTrack)}
        onToggle={() => toggleAccordion('learningTrack')}
        isEn={isEn}
      >
        <React.Suspense fallback={<div className="min-h-24 animate-pulse rounded-2xl bg-slate-100/70 dark:bg-white/5" aria-label="Loading section" />}><HomeLearningTrackSection
          language={lang}
          childName={activeKidName}
          ageStage={activeKidAge?.stageCode || 'all'}
          childInterests={activeKidSignals?.interests ?? []}
          childHobbies={activeKidSignals?.hobbies ?? []}
          childId={activeKid?.id ?? null}
          onNavigate={navigateTo}
          onAddRoutineTask={onAddSuggestedRoutineTask}
        /></React.Suspense>
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
        <React.Suspense fallback={<div className="min-h-24 animate-pulse rounded-2xl bg-slate-100/70 dark:bg-white/5" aria-label="Loading section" />}><HomeValuesTrackSection
          language={lang}
          childName={activeKidName}
          ageStage={activeKidAge?.stageCode || 'all'}
          childId={activeKid?.id ?? null}
          onAddRoutineTask={onAddSuggestedRoutineTask}
        /></React.Suspense>
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
          <React.Suspense fallback={<div className="min-h-24 animate-pulse rounded-2xl bg-slate-100/70 dark:bg-white/5" aria-label="Loading section" />}><StoriesLibraryView
            lang={lang}
            kids={state.kids}
            onOpenChildren={() => navigateTo('children')}
            onShowToast={onShowToast}
            onScheduleStoryTask={onAddSuggestedRoutineTask}
          /></React.Suspense>
        </div>
      </HomeAccordionCard>

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

          <React.Suspense fallback={<div className="min-h-24 animate-pulse rounded-2xl bg-slate-100/70 dark:bg-white/5" aria-label="Loading section" />}><CatalogView
            lang={lang}
            onAddToCart={onAddToCart}
            onInspectItem={onInspectCommercialItem}
            onAddToWishes={onAddProductToWishes}
            onShowToast={onShowToast}
          /></React.Suspense>
        </div>
      </HomeAccordionCard>
    </section>
  );
};

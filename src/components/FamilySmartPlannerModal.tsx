import React, { useMemo, useState } from 'react';
import {
  CalendarEvent,
  ChildProfile,
  LanguageCode,
  ParentThemeRole,
  RoutineTask,
  TaskCadence,
} from '../domain/familySpaceCore';
import { PrimaryCtaButton, SoftFilledIcon, UnifiedBadge } from './DesignSystem';
import { ThreeDIcon } from './ThreeDVisuals';

export interface PublicCalendarOccasion {
  id: string;
  titleAr: string;
  titleEn: string;
  date: string;
  category: 'holiday' | 'school' | 'season';
  badgeAr: string;
  badgeEn: string;
  noteAr: string;
  noteEn: string;
}

export interface FamilySmartPlannerModalProps {
  open: boolean;
  onClose: () => void;
  lang: LanguageCode;
  darkMode: boolean;
  role: ParentThemeRole;
  parentName: string;
  kids: ChildProfile[];
  events: CalendarEvent[];
  tasks: RoutineTask[];
  onSaveEvent: (
    payload: {
      id?: number;
      title: string;
      date: string;
      time: string;
      type: string;
      childId: number | null;
      repeat: 'none' | 'weekly' | 'monthly' | 'yearly';
      note: string;
    }
  ) => void;
  onDeleteEvent: (id: number) => void;
  onSaveTask: (
    payload: {
      id?: number;
      name: string;
      time: string;
      kidId: number | null;
      category: string;
      owner: string;
      cadence: TaskCadence;
      scheduledDate?: string;
    }
  ) => void;
  onToggleTask: (id: number, done: boolean, targetDateISO?: string) => void;
  onDeleteTask: (id: number) => void;
}

const ARABIC_WEEKDAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const ENGLISH_WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const ARABIC_MONTHS = [
  'يناير',
  'فبراير',
  'مارس',
  'أبريل',
  'مايو',
  'يونيو',
  'يوليو',
  'أغسطس',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر',
];

const ENGLISH_MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function toIsoDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function buildPublicFamilyOccasions(baseYear: number, baseMonthIndex: number): PublicCalendarOccasion[] {
  const ym = (monthOffset: number, day: number) => {
    const dt = new Date(baseYear, baseMonthIndex + monthOffset, day);
    return toIsoDateString(dt);
  };

  return [
    {
      id: 'pub-school-review',
      titleAr: 'متابعة التقييم الشهري والأنشطة المدرسية',
      titleEn: 'Monthly School Assessment & Activities Week',
      date: ym(0, 8),
      category: 'school',
      badgeAr: 'فصل دراسي',
      badgeEn: 'School Semester',
      noteAr: 'مراجعة دفاتر المتابعة وتجهيز مشاريع الأنشطة مع الأولاد بدري.',
      noteEn: 'Review school notebooks and prepare activity projects early.',
    },
    {
      id: 'pub-family-holiday',
      titleAr: 'إجازة رسمية وعطلة عائلية ممتدة',
      titleEn: 'National Holiday & Extended Family Weekend',
      date: ym(0, 15),
      category: 'holiday',
      badgeAr: 'عطلة رسمية',
      badgeEn: 'Public Holiday',
      noteAr: 'فرصة جميلة لخروجة عائلية في الهواء الطلق أو زيارة تيتة وجدو.',
      noteEn: 'Great chance for an outdoor family outing or visiting grandparents.',
    },
    {
      id: 'pub-parent-council',
      titleAr: 'يوم التواصل المدرسي المفتوح لأولياء الأمور',
      titleEn: 'School Open House & Parent-Teacher Day',
      date: ym(0, 22),
      category: 'school',
      badgeAr: 'مناسبة مدرسية',
      badgeEn: 'School Event',
      noteAr: 'مقابلة المدرسين والاطمئنان على مستوى تقدم الأولاد.',
      noteEn: 'Meet teachers and check in on the kids progress.',
    },
    {
      id: 'pub-seasonal-prep',
      titleAr: 'موسم تجهيزات العيلة والأنشطة الرياضية',
      titleEn: 'Family Seasonal Sports & Club Activities',
      date: ym(0, 27),
      category: 'season',
      badgeAr: 'مناسبة عامة',
      badgeEn: 'Public Occasion',
      noteAr: 'تجديد اشتراكات التمرين ومراجعة جدول السباحة والجمباز.',
      noteEn: 'Renew club training subscriptions and review swimming schedule.',
    },
    {
      id: 'pub-next-semester',
      titleAr: 'بداية اختبارات منتصف الفصل الدراسي',
      titleEn: 'Mid-Term School Assessments Start',
      date: ym(1, 5),
      category: 'school',
      badgeAr: 'فصل دراسي',
      badgeEn: 'School Semester',
      noteAr: 'تنظيم وقت المذاكرة والنوم بدري عشان تركيز الولاد.',
      noteEn: 'Organize study blocks and early bedtime for focus.',
    },
  ];
}

export const FamilySmartPlannerModal: React.FC<FamilySmartPlannerModalProps> = ({
  open,
  onClose,
  lang,
  role,
  kids,
  events,
  tasks,
  onSaveEvent,
  onDeleteEvent,
  onSaveTask,
  onToggleTask,
  onDeleteTask,
}) => {
  const isEn = lang === 'en';
  const isMom = role === 'mom';
  const parentCalloutAr = isMom ? 'يا ماما' : 'يا بابا';
  const parentFullCalloutAr = isMom ? 'ماما مريم' : 'بابا أحمد';

  const todayDate = useMemo(() => new Date(), []);
  const todayIso = useMemo(() => toIsoDateString(todayDate), [todayDate]);

  // Calendar view state (Monthly vs Weekly)
  const [calendarViewMode, setCalendarViewMode] = useState<'monthly' | 'weekly'>('monthly');
  const [cursorDate, setCursorDate] = useState<Date>(() => new Date());
  const [selectedDateIso, setSelectedDateIso] = useState<string>(todayIso);
  const [eventSourceFilter, setEventSourceFilter] = useState<'all' | 'private' | 'public'>('all');
  const [eventCategoryFilter, setEventCategoryFilter] = useState<string>('all');
  const [mobileSectionTab, setMobileSectionTab] = useState<'both' | 'calendar' | 'todo'>('both');

  // Event form state
  const [isEventFormOpen, setIsEventFormOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<number | undefined>(undefined);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState(todayIso);
  const [eventTime, setEventTime] = useState('17:00');
  const [eventType, setEventType] = useState('مناسبة عائلية');
  const [eventChildId, setEventChildId] = useState<string>('');
  const [eventRepeat, setEventRepeat] = useState<'none' | 'weekly' | 'monthly' | 'yearly'>('none');
  const [eventNote, setEventNote] = useState('');

  // To-Do form state
  const [taskInputName, setTaskInputName] = useState('');
  const [taskInputTime, setTaskInputTime] = useState('18:00');
  const [taskInputOwner, setTaskInputOwner] = useState<string>(isMom ? 'ماما مريم' : 'بابا أحمد');
  const [taskInputKidId, setTaskInputKidId] = useState<string>('');
  const [taskInputCategory, setTaskInputCategory] = useState<string>('مهام الأسرة');
  const [editingTaskId, setEditingTaskId] = useState<number | undefined>(undefined);
  const [todoFilter, setTodoFilter] = useState<'all' | 'open' | 'done'>('all');
  const [taskOwnerFilter, setTaskOwnerFilter] = useState<'all' | 'dad' | 'mom' | 'shared'>('all');
  const [planDuration, setPlanDuration] = useState<3 | 7>(3);
  const [planChildId, setPlanChildId] = useState<number | null>(() => kids[0]?.id ?? null);
  const [isPlanReady, setIsPlanReady] = useState(false);
  const [isPlanAdded, setIsPlanAdded] = useState(false);

  useEffect(() => {
    if (kids.length === 0) {
      setPlanChildId(null);
      return;
    }
    if (planChildId === null || !kids.some((kid) => kid.id === planChildId)) setPlanChildId(kids[0].id);
  }, [kids, planChildId]);

  const suggestedPlan = useMemo(() => {
    const child = kids.find((kid) => kid.id === planChildId);
    const childName = child ? locText(child.name, lang) : (isEn ? 'your child' : 'طفلك');
    const interests = child?.profileDetails?.hobbies || child?.profileDetails?.interests || [];
    const interestText = interests.filter(Boolean).slice(0, 2).join(isEn ? ' and ' : ' و ');
    const activitySets = [
      [
        { time: '10:00', emoji: '🎨', category: isEn ? 'Creative activity' : 'نشاط إبداعي', title: isEn ? 'Create an art project together' : 'اعملوا لوحة فنية مع بعض', note: isEn ? 'Use paper, colors and safe household materials.' : 'استخدموا الورق والألوان وخامات منزلية آمنة.' },
        { time: '19:30', emoji: '📖', category: isEn ? 'Bedtime story' : 'حكاية قبل النوم', title: isEn ? 'Choose a bedtime story' : 'اختاروا حكاية قبل النوم', note: isEn ? 'Pick a story connected to the child’s interests.' : 'اختاروا حكاية مرتبطة باهتمامات الطفل.' },
      ],
      [
        { time: '17:00', emoji: '⚽', category: isEn ? 'Movement & play' : 'حركة ولعب', title: isEn ? 'Try a movement challenge' : 'جربوا تحدي حركة', note: isEn ? 'A short, age-appropriate movement game.' : 'لعبة حركة قصيرة ومناسبة لعمر الطفل.' },
        { time: '18:30', emoji: '🧩', category: isEn ? 'Thinking game' : 'لعبة تفكير', title: isEn ? 'Play a family puzzle game' : 'العبوا لعبة ألغاز عائلية', note: isEn ? 'Take turns solving a simple puzzle together.' : 'تناوبوا في حل لغز بسيط معاً.' },
      ],
      [
        { time: '16:30', emoji: '🌱', category: isEn ? 'Discovery' : 'اكتشاف وتجربة', title: isEn ? 'Explore something new together' : 'اكتشفوا حاجة جديدة مع بعض', note: isEn ? 'A tiny experiment or nature observation.' : 'تجربة بسيطة أو ملاحظة شيء من الطبيعة.' },
        { time: '20:00', emoji: '💬', category: isEn ? 'Family connection' : 'وقت عائلي', title: isEn ? 'Share the best moment of the day' : 'احكوا أحلى موقف حصل النهارده', note: isEn ? 'Give everyone a turn to share.' : 'كل فرد ياخد دوره ويحكي أجمل لحظة.' },
      ],
    ];
    return Array.from({ length: planDuration }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() + index + 1);
      const iso = toIsoDateString(date);
      const activities = activitySets[index % activitySets.length].map((activity) => ({
        ...activity,
        title: interestText && index % 3 === 0
          ? (isEn ? activity.title + ' · inspired by ' + interestText : activity.title + ' · من اهتمامات ' + interestText)
          : activity.title,
        date: iso,
      }));
      return { date: iso, label: new Intl.DateTimeFormat(isEn ? 'en-US' : 'ar-EG', { weekday: 'long', day: 'numeric', month: 'short' }).format(date), activities };
    });
  }, [kids, planChildId, planDuration, isEn, lang]);

  const addSuggestedPlanToTasks = () => {
    if (isPlanAdded) return;
    suggestedPlan.forEach((day) => day.activities.forEach((activity) => {
      onSaveTask({
        name: activity.title,
        time: activity.time,
        kidId: planChildId,
        category: activity.category,
        owner: parentFullCalloutAr,
        cadence: 'daily',
        scheduledDate: day.date,
      });
    }));
    setIsPlanAdded(true);
    setMobileSectionTab('todo');
    setSelectedDateIso(suggestedPlan[0]?.date || todayIso);
    if (suggestedPlan[0]?.date) setCursorDate(new Date(suggestedPlan[0].date + 'T12:00:00'));
  };

  const kidMap = useMemo(
    () => Object.fromEntries(kids.map((k) => [String(k.id), k])),
    [kids]
  );

  const publicOccasions = useMemo(
    () => buildPublicFamilyOccasions(cursorDate.getFullYear(), cursorDate.getMonth()),
    [cursorDate]
  );

  // Build calendar cells for Monthly or Weekly mode
  const calendarDays = useMemo(() => {
    const year = cursorDate.getFullYear();
    const month = cursorDate.getMonth();

    if (calendarViewMode === 'weekly') {
      const anchor = new Date(selectedDateIso + 'T12:00:00');
      const base = Number.isNaN(anchor.getTime()) ? new Date(year, month, cursorDate.getDate()) : anchor;
      const dayOfWeek = base.getDay();
      const startOfWeek = new Date(base);
      startOfWeek.setDate(base.getDate() - dayOfWeek);

      return Array.from({ length: 7 }, (_, idx) => {
        const dt = new Date(startOfWeek);
        dt.setDate(startOfWeek.getDate() + idx);
        return {
          date: dt,
          iso: toIsoDateString(dt),
          inCurrentMonth: dt.getMonth() === month,
          dayNumber: dt.getDate(),
        };
      });
    }

    const firstDayOfMonth = new Date(year, month, 1);
    const startOffset = firstDayOfMonth.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;

    return Array.from({ length: totalCells }, (_, idx) => {
      const dt = new Date(year, month, 1 - startOffset + idx);
      return {
        date: dt,
        iso: toIsoDateString(dt),
        inCurrentMonth: dt.getMonth() === month,
        dayNumber: dt.getDate(),
      };
    });
  }, [cursorDate, calendarViewMode, selectedDateIso]);

  // Map events by date ISO
  const eventsByDate = useMemo(() => {
    const map: Record<
      string,
      {
        privateEvents: CalendarEvent[];
        publicEvents: PublicCalendarOccasion[];
      }
    > = {};

    for (const ev of events) {
      if (!map[ev.date]) {
        map[ev.date] = { privateEvents: [], publicEvents: [] };
      }
      map[ev.date].privateEvents.push(ev);
    }

    for (const pub of publicOccasions) {
      if (!map[pub.date]) {
        map[pub.date] = { privateEvents: [], publicEvents: [] };
      }
      map[pub.date].publicEvents.push(pub);
    }

    return map;
  }, [events, publicOccasions]);

  // Filtered events list for the selected date or current view
  const displayedPrivateEvents = useMemo(() => {
    if (eventSourceFilter === 'public') return [];
    const exact = events.filter((ev) => ev.date === selectedDateIso);
    const baseList =
      exact.length > 0
        ? exact
        : [...events].sort((a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')));
    if (eventCategoryFilter === 'all') return baseList;
    return baseList.filter((ev) => (ev.type || 'مناسبة عائلية').includes(eventCategoryFilter));
  }, [events, selectedDateIso, eventSourceFilter, eventCategoryFilter]);

  const displayedPublicEvents = useMemo(() => {
    if (eventSourceFilter === 'private') return [];
    const exact = publicOccasions.filter((pub) => pub.date === selectedDateIso);
    return exact.length > 0 ? exact : publicOccasions;
  }, [publicOccasions, selectedDateIso, eventSourceFilter]);

  const selectedDateHasExactEvents = useMemo(() => {
    const bucket = eventsByDate[selectedDateIso];
    if (!bucket) return false;
    return bucket.privateEvents.length + bucket.publicEvents.length > 0;
  }, [eventsByDate, selectedDateIso]);

  // Task stats & filtered list
  const completedTasksCount = useMemo(() => tasks.filter((t) => t.done).length, [tasks]);
  const completionPct = tasks.length > 0 ? Math.round((completedTasksCount / tasks.length) * 100) : 0;

  const visibleTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (todoFilter === 'open' && t.done) return false;
      if (todoFilter === 'done' && !t.done) return false;
      if (taskOwnerFilter === 'dad') {
        return (t.owner || '').includes('بابا') || (t.owner || '').toLowerCase().includes('dad');
      }
      if (taskOwnerFilter === 'mom') {
        return (t.owner || '').includes('ماما') || (t.owner || '').toLowerCase().includes('mom');
      }
      if (taskOwnerFilter === 'shared') {
        return (t.owner || '').includes('مشترك') || (t.owner || '').toLowerCase().includes('shared');
      }
      return true;
    });
  }, [tasks, todoFilter, taskOwnerFilter]);

  const handleCycleTaskDelegation = (task: RoutineTask) => {
    const currentOwner = task.owner || 'بابا أحمد';
    const nextOwner = currentOwner.includes('بابا')
      ? 'ماما مريم'
      : currentOwner.includes('ماما')
      ? 'مشترك'
      : 'بابا أحمد';
    onSaveTask({
      id: task.id,
      name: task.name,
      time: task.time || '18:00',
      kidId: task.kidId ?? null,
      category: task.category || 'مهام الأسرة',
      owner: nextOwner,
      cadence: task.cadence || 'daily',
      scheduledDate: task.scheduledDate,
    });
  };

  if (!open) return null;

  const openNewEventForm = (presetTitle = '', presetType = 'مناسبة عائلية', targetDate = selectedDateIso) => {
    setEditingEventId(undefined);
    setEventTitle(presetTitle);
    setEventDate(targetDate || todayIso);
    setEventTime('17:00');
    setEventType(presetType);
    setEventChildId('');
    setEventRepeat('none');
    setEventNote('');
    setIsEventFormOpen(true);
  };

  const openEditEventForm = (ev: CalendarEvent) => {
    setEditingEventId(ev.id);
    setEventTitle(ev.title);
    setEventDate(ev.date);
    setEventTime(ev.time || '17:00');
    setEventType(ev.type || 'مناسبة عائلية');
    setEventChildId(ev.childId ? String(ev.childId) : '');
    setEventRepeat(ev.repeat || 'none');
    setEventNote(ev.note || '');
    setIsEventFormOpen(true);
  };

  const handleEventFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim() || !eventDate.trim()) return;
    onSaveEvent({
      id: editingEventId,
      title: eventTitle.trim(),
      date: eventDate.trim(),
      time: eventTime.trim(),
      type: eventType,
      childId: eventChildId ? Number(eventChildId) : null,
      repeat: eventRepeat,
      note: eventNote.trim(),
    });
    setSelectedDateIso(eventDate.trim());
    setIsEventFormOpen(false);
    setEditingEventId(undefined);
    setEventTitle('');
    setEventNote('');
  };

  const handleTaskFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskInputName.trim()) return;
    onSaveTask({
      id: editingTaskId,
      name: taskInputName.trim(),
      time: taskInputTime.trim() || '18:00',
      kidId: taskInputKidId ? Number(taskInputKidId) : null,
      category: taskInputCategory,
      owner: taskInputOwner,
      cadence: 'daily',
    });
    setTaskInputName('');
    setEditingTaskId(undefined);
  };

  const handleQuickAddPresetTask = (title: string, category: string, time: string) => {
    onSaveTask({
      name: title,
      time,
      kidId: kids[0]?.id ?? null,
      category,
      owner: parentFullCalloutAr,
      cadence: 'daily',
    });
  };

  const handleStartEditTask = (task: RoutineTask) => {
    setEditingTaskId(task.id);
    setTaskInputName(task.name);
    setTaskInputTime(task.time || '18:00');
    setTaskInputOwner(task.owner || parentFullCalloutAr);
    setTaskInputKidId(task.kidId ? String(task.kidId) : '');
    setTaskInputCategory(task.category || 'مهام الأسرة');
  };

  const handleStepCalendar = (dir: -1 | 1) => {
    if (calendarViewMode === 'weekly') {
      const base = new Date(selectedDateIso + 'T12:00:00');
      const next = Number.isNaN(base.getTime()) ? new Date(cursorDate) : base;
      next.setDate(next.getDate() + dir * 7);
      setCursorDate(next);
      setSelectedDateIso(toIsoDateString(next));
    } else {
      const next = new Date(cursorDate.getFullYear(), cursorDate.getMonth() + dir, 1);
      setCursorDate(next);
    }
  };

  const handleJumpToToday = () => {
    const now = new Date();
    setCursorDate(now);
    setSelectedDateIso(toIsoDateString(now));
  };

  const currentMonthLabel = isEn
    ? `${ENGLISH_MONTHS[cursorDate.getMonth()]} ${cursorDate.getFullYear()}`
    : `${ARABIC_MONTHS[cursorDate.getMonth()]} ${cursorDate.getFullYear()}`;

  const quickTaskPresets = [
    {
      labelAr: 'شراء مستلزمات المدرسة',
      labelEn: 'Buy school supplies',
      category: 'مدرسة ودراسة',
      time: '17:30',
    },
    {
      labelAr: 'موعد دكتور الأسنان',
      labelEn: 'Dentist appointment',
      category: 'صحة ومتابعة',
      time: '19:00',
    },
    {
      labelAr: 'تمرين السباحة',
      labelEn: 'Swimming practice',
      category: 'رياضة ونادي',
      time: '16:30',
    },
    {
      labelAr: 'تحضير اللانش بوكس الصحي',
      labelEn: 'Prepare healthy lunchbox',
      category: 'تغذية الأسرة',
      time: '07:15',
    },
  ];

  const quickEventPresets = [
    {
      labelAr: 'عيد ميلاد في العيلة 🎂',
      labelEn: 'Family Birthday 🎂',
      type: 'عيد ميلاد',
    },
    {
      labelAr: 'موعد تطعيم أو متابعة طبية 💉',
      labelEn: 'Vaccination / Doctor Visit 💉',
      type: 'موعد طبي',
    },
    {
      labelAr: 'اجتماع أولياء الأمور 🏫',
      labelEn: 'School Parents Meeting 🏫',
      type: 'مدرسة وحضانة',
    },
    {
      labelAr: 'خروجة عائلية نهاية الأسبوع 🎡',
      labelEn: 'Weekend Family Outing 🎡',
      type: 'نشاط عائلي',
    },
  ];

  return (
    <div
      id="family-smart-planner-modal"
      role="dialog"
      aria-modal="true"
      aria-label={isEn ? 'Smart Family Calendar & To-Do List' : 'مفكرة العيلة الذكية'}
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-5 bg-[#0B131A]/75 backdrop-blur-md animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-[1160px] max-h-[92vh] flex flex-col rounded-3xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[#F8FAFC] dark:bg-[#0B131A] text-[var(--color-text)] dark:text-[#F8FAFC] shadow-2xl overflow-hidden transition-all duration-300 ease-in-out">
        {/* Top Modal Header Bar */}
        <div className="px-4 sm:px-6 py-4 border-b border-[var(--color-border)] dark:border-[#1E3646] bg-white/90 dark:bg-[#101D26]/95 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#0d9488]/20 to-[#FF8C61]/20 dark:from-[#0d9488]/30 dark:to-[#FF8C61]/25 border border-[#0d9488]/30 flex items-center justify-center shrink-0 shadow-2xs">
              <ThreeDIcon id="calendar" size={26} />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-xl font-black tracking-tight text-[#0B131A] dark:text-[#F8FAFC] truncate">
                  {isEn ? 'Smart Family Planner & To-Do' : 'مفكرة العيلة الذكية'}
                </h2>
                <UnifiedBadge tone="teal" iconId="family">
                  {isEn
                    ? `Welcome, ${isMom ? 'Mom Maryam' : 'Dad Ahmad'}`
                    : `منور ${parentCalloutAr} (${parentFullCalloutAr})`}
                </UnifiedBadge>
              </div>
              <p className="text-xs font-medium text-[#475569] dark:text-[#CBD5E1] mt-0.5 truncate">
                {isEn
                  ? 'Monthly & weekly family occasions, school holidays, and collaborative daily tasks in one place'
                  : 'كل مواعيد العيلة، الإجازات الرسمية والمدرسية، ومهام اليوم لبابا وماما في مكان واحد'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Live Quick Stats Pill */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-2xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[#F8FAFC] dark:bg-[#142430] text-xs font-extrabold">
              <span className="text-[#0d9488] dark:text-[#38BDF8]">
                {isEn ? `${events.length} Family Events` : `${events.length} مناسبات مسجلة`}
              </span>
              <span className="opacity-30">|</span>
              <span className="text-[#FF8C61]">
                {isEn
                  ? `${completedTasksCount}/${tasks.length} Tasks Done`
                  : `${completedTasksCount} من ${tasks.length} مهام مكتملة`}
              </span>
            </div>

            <button
              id="close-smart-planner-modal-btn"
              type="button"
              onClick={onClose}
              aria-label={isEn ? 'Close Family Planner' : 'إغلاق مفكرة العيلة'}
              className="w-9 h-9 rounded-xl text-lg font-black leading-none border border-[var(--color-border)] dark:border-[#1E3646] bg-white dark:bg-[#142430] text-[#0B131A] dark:text-[#F8FAFC] hover:border-[#FF8C61] hover:text-[#FF8C61] transition-all duration-300 ease-in-out flex items-center justify-center shrink-0 cursor-pointer"
            >
              ×
            </button>
          </div>
        </div>

        {/* Mobile View Switcher Bar */}
        <div className="flex lg:hidden items-center gap-1.5 px-4 py-2.5 border-b border-[var(--color-border)] dark:border-[#1E3646] bg-white dark:bg-[#101D26] shrink-0">
          {(
            [
              { id: 'both', labelAr: 'المفكرة كاملة', labelEn: 'Split View' },
              { id: 'calendar', labelAr: 'التقويم والمناسبات', labelEn: 'Calendar' },
              { id: 'todo', labelAr: `مهام العيلة (${tasks.length})`, labelEn: `To-Do (${tasks.length})` },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setMobileSectionTab(tab.id)}
              className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-extrabold transition-all duration-300 ease-in-out ${
                mobileSectionTab === tab.id
                  ? 'bg-[#0d9488] text-white shadow-2xs'
                  : 'bg-[#F8FAFC] dark:bg-[#142430] text-[#475569] dark:text-[#CBD5E1]'
              }`}
            >
              {isEn ? tab.labelEn : tab.labelAr}
            </button>
          ))}
        </div>

        {/* Main Scrollable Split Workspace */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <section data-testid="family-ai-planner" className="mb-6 overflow-hidden rounded-3xl border border-teal-500/20 bg-gradient-to-br from-[#E7F7F3] via-white to-[#EEF3FF] p-4 shadow-sm dark:from-[#102D32] dark:via-[#101D26] dark:to-[#18253A] sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-teal-600 text-xl text-white shadow-md">✨</span>
                <div className="min-w-0">
                  <h3 className="text-base font-black text-[#0B3435] dark:text-teal-100">{isEn ? "Smart Family Planner" : "مساعد التخطيط الذكي للأسرة"}</h3>
                  <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-600 dark:text-slate-300">{isEn ? "Prepare practical ideas for the coming days, then add the approved plan directly to family tasks." : "جهّز أفكاراً عملية للأيام الجاية، وراجعها قبل إضافتها مباشرة لقائمة مهام الأسرة."}</p>
                </div>
              </div>
              <span className="rounded-full border border-teal-600/20 bg-white/80 px-3 py-1 text-[10px] font-black text-teal-800 dark:bg-white/10 dark:text-teal-200">{isEn ? "Plan & do" : "خطط ونفّذ"}</span>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
              <label className="flex min-w-0 flex-col gap-1 text-[11px] font-bold text-slate-600 dark:text-slate-300">{isEn ? "Plan for" : "الخطة لمين؟"}
                <select value={planChildId ?? ""} onChange={(event) => { setPlanChildId(event.target.value ? Number(event.target.value) : null); setIsPlanReady(false); setIsPlanAdded(false); }} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-800 outline-none focus:border-teal-500 dark:border-[#29404D] dark:bg-[#142430] dark:text-white">
                  <option value="">{isEn ? "Whole family" : "الأسرة كلها"}</option>
                  {kids.map((kid) => <option key={kid.id} value={kid.id}>{locText(kid.name, lang)}</option>)}
                </select>
              </label>
              <div className="flex flex-col gap-1 text-[11px] font-bold text-slate-600 dark:text-slate-300">{isEn ? "Plan length" : "مدة الخطة"}
                <div className="flex h-11 rounded-xl border border-slate-200 bg-white p-1 dark:border-[#29404D] dark:bg-[#142430]">
                  {[3, 7].map((days) => <button key={days} type="button" onClick={() => { setPlanDuration(days as 3 | 7); setIsPlanReady(false); setIsPlanAdded(false); }} className={"min-w-[76px] rounded-lg px-3 text-xs font-black transition " + (planDuration === days ? "bg-teal-600 text-white shadow-sm" : "text-slate-600 dark:text-slate-300")}>{isEn ? days + " days" : days + " أيام"}</button>)}
                </div>
              </div>
              <div className="flex flex-col justify-end"><button type="button" onClick={() => { setIsPlanReady(true); setIsPlanAdded(false); }} className="h-11 rounded-xl bg-[#087F73] px-4 text-xs font-black text-white shadow-sm transition hover:bg-[#066D63]">{isEn ? "Prepare my plan" : "جهّز الخطة"}</button></div>
            </div>
            {isPlanReady && <div className="mt-4 space-y-3" data-testid="family-ai-plan-preview">
              <div className="flex flex-wrap items-center justify-between gap-2"><div><h4 className="text-sm font-black text-slate-900 dark:text-white">{isEn ? "Your upcoming family plan" : "خطة الأيام القادمة"}</h4><p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">{isEn ? "Review the activities before adding them." : "راجع الأنشطة قبل إضافتها لقائمة المهام."}</p></div><span className="rounded-full bg-white/80 px-3 py-1 text-[10px] font-black text-teal-800 dark:bg-white/10 dark:text-teal-200">{suggestedPlan.reduce((total, day) => total + day.activities.length, 0)} {isEn ? "activities" : "نشاط"}</span></div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">{suggestedPlan.map((day) => <article key={day.date} className="rounded-2xl border border-white/80 bg-white/85 p-3 shadow-sm dark:border-white/10 dark:bg-[#142430]/90"><div className="mb-2 flex items-center justify-between gap-2"><h5 className="text-xs font-black text-slate-800 dark:text-white">{day.label}</h5><span className="text-[10px] font-bold text-teal-700 dark:text-teal-300">{day.date}</span></div><div className="space-y-2">{day.activities.map((activity) => <div key={activity.time + activity.category} className="flex items-start gap-2 rounded-xl bg-slate-50 p-2.5 dark:bg-white/5"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-teal-500/10 text-lg">{activity.emoji}</span><div className="min-w-0 flex-1"><p className="text-[11px] font-black leading-5 text-slate-800 dark:text-white">{activity.title}</p><p className="text-[10px] leading-5 text-slate-500 dark:text-slate-400">{activity.note}</p><p className="mt-1 text-[10px] font-bold text-teal-700 dark:text-teal-300">{activity.time} · {activity.category}</p></div></div>)}</div></article>)}</div>
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-teal-900/10 pt-3 dark:border-white/10"><p className="text-[10px] leading-5 text-slate-600 dark:text-slate-300">{isEn ? "Tasks are scheduled on their actual dates and linked to the selected child." : "كل نشاط هيتسجل في تاريخه الفعلي ويرتبط بالطفل المختار."}</p><button type="button" disabled={isPlanAdded} onClick={addSuggestedPlanToTasks} className="min-h-11 rounded-xl bg-[#087F73] px-4 py-2 text-xs font-black text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50">{isPlanAdded ? (isEn ? "Added to family tasks ✓" : "اتضافت لمهام الأسرة ✓") : (isEn ? "Add plan to task list" : "أضف الخطة لقائمة المهام")}</button></div>
            </div>}
          </section>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* COLUMN 1: FAMILY CALENDAR & EVENTS VIEW (7 cols on desktop) */}
            <div
              className={`lg:col-span-7 space-y-5 ${
                mobileSectionTab === 'todo' ? 'hidden lg:block' : 'block'
              }`}
            >
              {/* Calendar Control Header Card */}
              <div className="rounded-3xl border border-[var(--color-border)] dark:border-[#1E3646] bg-white dark:bg-[#101D26] p-4 sm:p-5 shadow-xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#0d9488] dark:text-[#38BDF8]">
                      <SoftFilledIcon id="calendar" size={15} />
                      <span>
                        {isEn
                          ? 'Family Calendar & Occasions'
                          : 'تقويم العيلة والمناسبات العامة والخاصة'}
                      </span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-black text-[#0B131A] dark:text-[#F8FAFC] mt-0.5">
                      {currentMonthLabel}
                    </h3>
                  </div>

                  {/* Monthly / Weekly Switcher + Navigation */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <div className="inline-flex p-1 rounded-2xl bg-[#F8FAFC] dark:bg-[#142430] border border-[var(--color-border)] dark:border-[#1E3646]">
                      <button
                        type="button"
                        onClick={() => setCalendarViewMode('monthly')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all duration-300 ease-in-out cursor-pointer ${
                          calendarViewMode === 'monthly'
                            ? 'bg-[#0d9488] text-white shadow-2xs'
                            : 'text-[#475569] dark:text-[#CBD5E1] hover:text-[#0B131A] dark:hover:text-white'
                        }`}
                      >
                        {isEn ? 'Monthly' : 'شهري'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setCalendarViewMode('weekly')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all duration-300 ease-in-out cursor-pointer ${
                          calendarViewMode === 'weekly'
                            ? 'bg-[#0d9488] text-white shadow-2xs'
                            : 'text-[#475569] dark:text-[#CBD5E1] hover:text-[#0B131A] dark:hover:text-white'
                        }`}
                      >
                        {isEn ? 'Weekly' : 'أسبوعي'}
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleStepCalendar(-1)}
                      aria-label={isEn ? 'Previous period' : 'الفترة السابقة'}
                      className="w-8 h-8 rounded-xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[#F8FAFC] dark:bg-[#142430] text-[#0B131A] dark:text-[#F8FAFC] font-black hover:border-[#0d9488] transition-all cursor-pointer"
                    >
                      {isEn ? '‹' : '›'}
                    </button>
                    <button
                      type="button"
                      onClick={handleJumpToToday}
                      className="px-2.5 h-8 rounded-xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[#F8FAFC] dark:bg-[#142430] text-xs font-extrabold text-[#0d9488] dark:text-[#38BDF8] hover:border-[#0d9488] transition-all cursor-pointer"
                    >
                      {isEn ? 'Today' : 'اليوم'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStepCalendar(1)}
                      aria-label={isEn ? 'Next period' : 'الفترة التالية'}
                      className="w-8 h-8 rounded-xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[#F8FAFC] dark:bg-[#142430] text-[#0B131A] dark:text-[#F8FAFC] font-black hover:border-[#0d9488] transition-all cursor-pointer"
                    >
                      {isEn ? '›' : '‹'}
                    </button>
                  </div>
                </div>

                {/* Weekday Headers */}
                <div className="grid grid-cols-7 gap-1.5 text-center">
                  {(isEn ? ENGLISH_WEEKDAYS : ARABIC_WEEKDAYS).map((dayName) => (
                    <div
                      key={dayName}
                      className="py-1.5 text-[11px] font-extrabold text-[#475569] dark:text-[#94A3B8] truncate"
                    >
                      {dayName}
                    </div>
                  ))}
                </div>

                {/* Interactive Calendar Grid */}
                <div className="grid grid-cols-7 gap-1.5">
                  {calendarDays.map((cell) => {
                    const bucket = eventsByDate[cell.iso];
                    const privCount = bucket?.privateEvents.length || 0;
                    const pubCount = bucket?.publicEvents.length || 0;
                    const isSelected = cell.iso === selectedDateIso;
                    const isToday = cell.iso === todayIso;

                    return (
                      <button
                        key={cell.iso}
                        type="button"
                        onClick={() => setSelectedDateIso(cell.iso)}
                        className={`min-h-[58px] sm:min-h-[68px] p-1.5 rounded-2xl border text-start flex flex-col justify-between transition-all duration-300 ease-in-out cursor-pointer ${
                          isSelected
                            ? 'border-[#0d9488] dark:border-[#38BDF8] bg-[#0d9488]/12 dark:bg-[#38BDF8]/15 shadow-xs scale-[1.02]'
                            : isToday
                            ? 'border-[#FF8C61] bg-[#FF8C61]/10 dark:bg-[#FF8C61]/15'
                            : cell.inCurrentMonth
                            ? 'border-[var(--color-border)] dark:border-[#1E3646] bg-[#F8FAFC] dark:bg-[#142430] hover:border-[#0d9488]/50'
                            : 'border-transparent bg-[#F8FAFC]/50 dark:bg-[#101D26]/50 opacity-45'
                        }`}
                      >
                        <div className="w-full flex items-center justify-between">
                          <span
                            className={`text-xs font-black tabular-nums ${
                              isSelected
                                ? 'text-[#0d9488] dark:text-[#38BDF8]'
                                : isToday
                                ? 'text-[#FF8C61]'
                                : 'text-[#0B131A] dark:text-[#F8FAFC]'
                            }`}
                          >
                            {cell.dayNumber}
                          </span>
                          {isToday && (
                            <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-[#FF8C61] text-white">
                              {isEn ? 'Now' : 'اليوم'}
                            </span>
                          )}
                        </div>

                        {/* Event Indicators inside Day Cell */}
                        {(privCount > 0 || pubCount > 0) && (
                          <div className="flex flex-wrap items-center gap-1 mt-1">
                            {privCount > 0 && (
                              <span
                                title={
                                  isEn
                                    ? `${privCount} family event(s)`
                                    : `${privCount} مناسبة عائلية خاصة`
                                }
                                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-[#0d9488]/20 dark:bg-[#38BDF8]/25 text-[#0f766e] dark:text-[#7DD3FC] text-[9px] font-black leading-none"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-[#0d9488] dark:bg-[#38BDF8]" />
                                {privCount}
                              </span>
                            )}
                            {pubCount > 0 && (
                              <span
                                title={
                                  isEn
                                    ? `${pubCount} public/school event(s)`
                                    : `${pubCount} مناسبة عامة/مدرسية`
                                }
                                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-[#FF8C61]/20 text-[#c2410c] dark:text-[#FDBA74] text-[9px] font-black leading-none"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-[#FF8C61]" />
                                {pubCount}
                              </span>
                            )}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Legend + Add Custom Family Event CTA */}
                <div className="pt-2 border-t border-[var(--color-border)] dark:border-[#1E3646] flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold text-[#475569] dark:text-[#CBD5E1]">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#0d9488] dark:bg-[#38BDF8]" />
                      <span>{isEn ? 'Private Family Occasions' : 'مناسبات العيلة الخاصة'}</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#FF8C61]" />
                      <span>{isEn ? 'Public & School Events' : 'إجازات ومواسم مدرسية'}</span>
                    </span>
                  </div>

                  <PrimaryCtaButton
                    onClick={() => openNewEventForm('', 'مناسبة عائلية', selectedDateIso)}
                  >
                    <SoftFilledIcon id="calendar" size={14} boxSize="sm" />
                    <span>
                      {isEn
                        ? 'Add Family Event'
                        : `أضف موعد أو مناسبة ${parentCalloutAr}`}
                    </span>
                  </PrimaryCtaButton>
                </div>
              </div>

              {/* Quick Occasion Presets & Add/Edit Event Form */}
              {isEventFormOpen ? (
                <form
                  onSubmit={handleEventFormSubmit}
                  className="rounded-3xl border-2 border-[#0d9488]/40 dark:border-[#38BDF8]/40 bg-white dark:bg-[#101D26] p-4 sm:p-5 shadow-md space-y-4 animate-fade-in"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm sm:text-base font-black text-[#0B131A] dark:text-[#F8FAFC]">
                      {editingEventId
                        ? isEn
                          ? 'Edit Family Occasion'
                          : 'تعديل تفاصيل الموعد العائلي'
                        : isEn
                        ? 'New Family Event or Reminder'
                        : `إضافة مناسبة أو تذكير جديد ${parentCalloutAr}`}
                    </h4>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEventFormOpen(false);
                        setEditingEventId(undefined);
                      }}
                      className="text-xs font-extrabold text-[#475569] dark:text-[#CBD5E1] hover:text-[#FF8C61] cursor-pointer"
                    >
                      {isEn ? 'Cancel' : 'إلغاء'}
                    </button>
                  </div>

                  {/* Quick Event Templates */}
                  <div className="flex flex-wrap gap-1.5">
                    {quickEventPresets.map((preset) => (
                      <button
                        key={preset.labelAr}
                        type="button"
                        onClick={() => {
                          setEventTitle(isEn ? preset.labelEn : preset.labelAr);
                          setEventType(preset.type);
                        }}
                        className="px-2.5 py-1 rounded-xl text-[11px] font-bold border border-[var(--color-border)] dark:border-[#1E3646] bg-[#F8FAFC] dark:bg-[#142430] text-[#0B131A] dark:text-[#F8FAFC] hover:border-[#0d9488] transition-all cursor-pointer"
                      >
                        + {isEn ? preset.labelEn : preset.labelAr}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-extrabold mb-1 text-[#0B131A] dark:text-[#F8FAFC]">
                        {isEn ? 'Event Title' : 'اسم المناسبة أو الموعد'}
                      </label>
                      <input
                        type="text"
                        required
                        value={eventTitle}
                        onChange={(e) => setEventTitle(e.target.value)}
                        placeholder={
                          isEn
                            ? 'e.g. Hamza 6m Vaccination, Laila Nursery Day, Youssef Football Match'
                            : 'مثال: تطعيم حمزة (٦ شهور)، نشاط حضانة ليلى، مباراة كرة قدم يوسف...'
                        }
                        className="w-full h-10 px-3.5 rounded-2xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[#F8FAFC] dark:bg-[#142430] text-xs font-bold text-[#0B131A] dark:text-[#F8FAFC] focus:outline-none focus:border-[#0d9488]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold mb-1 text-[#0B131A] dark:text-[#F8FAFC]">
                        {isEn ? 'Date' : 'التاريخ'}
                      </label>
                      <input
                        type="date"
                        required
                        value={eventDate}
                        onChange={(e) => setEventDate(e.target.value)}
                        className="w-full h-10 px-3 rounded-2xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[#F8FAFC] dark:bg-[#142430] text-xs font-bold text-[#0B131A] dark:text-[#F8FAFC]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold mb-1 text-[#0B131A] dark:text-[#F8FAFC]">
                        {isEn ? 'Time' : 'الوقت'}
                      </label>
                      <input
                        type="time"
                        value={eventTime}
                        onChange={(e) => setEventTime(e.target.value)}
                        className="w-full h-10 px-3 rounded-2xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[#F8FAFC] dark:bg-[#142430] text-xs font-bold text-[#0B131A] dark:text-[#F8FAFC]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold mb-1 text-[#0B131A] dark:text-[#F8FAFC]">
                        {isEn ? 'Occasion Type' : 'نوع المناسبة'}
                      </label>
                      <select
                        value={eventType}
                        onChange={(e) => setEventType(e.target.value)}
                        className="w-full h-10 px-3 rounded-2xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[#F8FAFC] dark:bg-[#142430] text-xs font-bold text-[#0B131A] dark:text-[#F8FAFC]"
                      >
                        <option value="مناسبة عائلية">مناسبة عائلية خاصة</option>
                        <option value="موعد طبي">موعد طبي / تطعيم</option>
                        <option value="مدرسة وحضانة">اجتماع مدرسة / حضانة</option>
                        <option value="عيد ميلاد">عيد ميلاد</option>
                        <option value="نشاط عائلي">خروجة / نشاط ترفيهي</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold mb-1 text-[#0B131A] dark:text-[#F8FAFC]">
                        {isEn ? 'Related Child (Optional)' : 'مرتبط بطفل (اختياري)'}
                      </label>
                      <select
                        value={eventChildId}
                        onChange={(e) => setEventChildId(e.target.value)}
                        className="w-full h-10 px-3 rounded-2xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[#F8FAFC] dark:bg-[#142430] text-xs font-bold text-[#0B131A] dark:text-[#F8FAFC]"
                      >
                        <option value="">{isEn ? 'All Family' : 'كل العيلة'}</option>
                        {kids.map((k) => (
                          <option key={k.id} value={String(k.id)}>
                            {k.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-extrabold mb-1 text-[#0B131A] dark:text-[#F8FAFC]">
                        {isEn ? 'Reminder Notes' : 'ملاحظات أو تجهيزات مطلوبة'}
                      </label>
                      <input
                        type="text"
                        value={eventNote}
                        onChange={(e) => setEventNote(e.target.value)}
                        placeholder={
                          isEn
                            ? 'Add any details for Mom & Dad...'
                            : 'مثال: نحضر دفتر التطعيمات أو نجهز هدية عيد الميلاد...'
                        }
                        className="w-full h-10 px-3.5 rounded-2xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[#F8FAFC] dark:bg-[#142430] text-xs font-bold text-[#0B131A] dark:text-[#F8FAFC]"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <PrimaryCtaButton type="submit">
                      <SoftFilledIcon id="calendar" size={14} boxSize="sm" />
                      <span>
                        {editingEventId
                          ? isEn
                            ? 'Save Changes'
                            : 'حفظ التعديلات'
                          : isEn
                          ? 'Save Event to Calendar'
                          : 'تثبيت الموعد في تقويم العيلة'}
                      </span>
                    </PrimaryCtaButton>
                  </div>
                </form>
              ) : null}

              {/* Events Feed Card (Private Family Occasions + Public Holidays/Semesters) */}
              <div className="rounded-3xl border border-[var(--color-border)] dark:border-[#1E3646] bg-white dark:bg-[#101D26] p-4 sm:p-5 shadow-xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h4 className="text-sm sm:text-base font-black text-[#0B131A] dark:text-[#F8FAFC]">
                      {selectedDateHasExactEvents
                        ? isEn
                          ? `Events on ${selectedDateIso}`
                          : `مواعيد ومناسبات يوم ${selectedDateIso}`
                        : isEn
                        ? 'Upcoming Family & Public Occasions'
                        : 'أقرب مواعيد العيلة والمناسبات العامة'}
                    </h4>
                    <p className="text-[11px] font-medium text-[#475569] dark:text-[#CBD5E1]">
                      {selectedDateHasExactEvents
                        ? isEn
                          ? 'Showing events matching your selected date'
                          : 'عرض المناسبات المسجلة في اليوم المحدد على التقويم'
                        : isEn
                        ? 'No exact event on selected day — showing all upcoming occasions'
                        : 'مفيش موعد مسجل في اليوم ده تحديدًا — دي كل مواعيد العيلة والمواسم الجاية'}
                    </p>
                  </div>

                  {/* Filter Pills */}
                  <div className="inline-flex p-1 rounded-2xl bg-[#F8FAFC] dark:bg-[#142430] border border-[var(--color-border)] dark:border-[#1E3646]">
                    {(
                      [
                        { id: 'all', labelAr: 'الكل', labelEn: 'All' },
                        { id: 'private', labelAr: 'مناسباتنا', labelEn: 'Family' },
                        { id: 'public', labelAr: 'عامة ومدرسية', labelEn: 'Public' },
                      ] as const
                    ).map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setEventSourceFilter(f.id)}
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-extrabold transition-all cursor-pointer ${
                          eventSourceFilter === f.id
                            ? 'bg-[#0d9488] text-white'
                            : 'text-[#475569] dark:text-[#CBD5E1]'
                        }`}
                      >
                        {isEn ? f.labelEn : f.labelAr}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Event Category Filter Chips */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {[
                    { id: 'all', labelAr: '✨ كل التصنيفات', labelEn: '✨ All Categories' },
                    { id: 'مناسبة عائلية', labelAr: '🏠 عائلية', labelEn: '🏠 Family' },
                    { id: 'موعد طبي', labelAr: '💉 طبي وتطعيم', labelEn: '💉 Medical' },
                    { id: 'مدرسة وحضانة', labelAr: '🏫 مدرسة وحضانة', labelEn: '🏫 School' },
                    { id: 'عيد ميلاد', labelAr: '🎂 عيد ميلاد', labelEn: '🎂 Birthday' },
                    { id: 'نشاط عائلي', labelAr: '🎡 خروجة ونشاط', labelEn: '🎡 Outing' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setEventCategoryFilter(cat.id)}
                      className={`px-2.5 py-1 rounded-xl text-[10.5px] font-extrabold border transition-all cursor-pointer ${
                        eventCategoryFilter === cat.id
                          ? 'border-[#0d9488] bg-[#0d9488]/15 dark:bg-[#38BDF8]/20 text-[#0f766e] dark:text-[#7DD3FC]'
                          : 'border-[var(--color-border)] dark:border-[#1E3646] bg-[#F8FAFC] dark:bg-[#142430] text-[#475569] dark:text-[#CBD5E1]'
                      }`}
                    >
                      {isEn ? cat.labelEn : cat.labelAr}
                    </button>
                  ))}
                </div>

                {/* Private Family Events List */}
                {displayedPrivateEvents.length > 0 && (
                  <div className="space-y-2.5">
                    {displayedPrivateEvents.slice(0, 6).map((ev) => {
                      const kid = ev.childId ? kidMap[String(ev.childId)] : null;
                      return (
                        <div
                          key={ev.id}
                          className="p-3.5 rounded-2xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[#F8FAFC] dark:bg-[#142430] flex flex-wrap items-center justify-between gap-3 hover:border-[#0d9488]/60 transition-all duration-300 ease-in-out"
                        >
                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="px-2 py-0.5 rounded-lg bg-[#0d9488]/15 dark:bg-[#38BDF8]/20 text-[#0f766e] dark:text-[#7DD3FC] text-[10px] font-black">
                                {ev.type || (isEn ? 'Family Event' : 'موعد عائلي')}
                              </span>
                              <span className="text-[11px] font-extrabold text-[#475569] dark:text-[#CBD5E1] tabular-nums">
                                📅 {ev.date} {ev.time ? `· ⏰ ${ev.time}` : ''}
                              </span>
                              {kid && (
                                <span className="px-2 py-0.5 rounded-lg bg-[#FF8C61]/15 text-[#c2410c] dark:text-[#FDBA74] text-[10px] font-extrabold">
                                  {kid.name}
                                </span>
                              )}
                            </div>
                            <div className="text-xs sm:text-sm font-black text-[#0B131A] dark:text-[#F8FAFC]">
                              {ev.title}
                            </div>
                            {ev.note && (
                              <p className="text-xs text-[#475569] dark:text-[#CBD5E1]">
                                {ev.note}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => openEditEventForm(ev)}
                              className="px-2.5 py-1.5 rounded-xl text-[11px] font-extrabold border border-[var(--color-border)] dark:border-[#1E3646] bg-white dark:bg-[#101D26] text-[#0B131A] dark:text-[#F8FAFC] hover:border-[#0d9488] transition-all cursor-pointer"
                            >
                              {isEn ? 'Edit' : 'تعديل'}
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteEvent(ev.id)}
                              className="px-2.5 py-1.5 rounded-xl text-[11px] font-extrabold border border-red-200 dark:border-red-900/50 bg-red-50/70 dark:bg-red-950/30 text-red-700 dark:text-red-300 hover:bg-red-100 transition-all cursor-pointer"
                            >
                              {isEn ? 'Delete' : 'حذف'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Public & School Occasions List */}
                {displayedPublicEvents.length > 0 && (
                  <div className="space-y-2.5 pt-1">
                    {displayedPublicEvents.map((pub) => (
                      <div
                        key={pub.id}
                        className="p-3.5 rounded-2xl border border-[#FF8C61]/30 bg-[#FF8C61]/5 dark:bg-[#142430] flex flex-wrap items-center justify-between gap-3 transition-all duration-300 ease-in-out"
                      >
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded-lg bg-[#FF8C61]/20 text-[#c2410c] dark:text-[#FDBA74] text-[10px] font-black">
                              {isEn ? pub.badgeEn : pub.badgeAr}
                            </span>
                            <span className="text-[11px] font-extrabold text-[#475569] dark:text-[#CBD5E1] tabular-nums">
                              📅 {pub.date}
                            </span>
                          </div>
                          <div className="text-xs sm:text-sm font-black text-[#0B131A] dark:text-[#F8FAFC]">
                            {isEn ? pub.titleEn : pub.titleAr}
                          </div>
                          <p className="text-xs text-[#475569] dark:text-[#CBD5E1]">
                            {isEn ? pub.noteEn : pub.noteAr}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            openNewEventForm(
                              isEn ? pub.titleEn : pub.titleAr,
                              'مدرسة وحضانة',
                              pub.date
                            )
                          }
                          className="px-3 py-1.5 rounded-xl text-[11px] font-extrabold border border-[#0d9488]/40 bg-white dark:bg-[#101D26] text-[#0d9488] dark:text-[#38BDF8] hover:bg-[#0d9488] hover:text-white transition-all cursor-pointer shrink-0"
                        >
                          {isEn ? '+ Copy to Family' : '+ أضف لتقويمنا'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* COLUMN 2: COLLABORATIVE FAMILY TO-DO LIST & TASK MANAGER (5 cols on desktop) */}
            <div
              className={`lg:col-span-5 space-y-5 ${
                mobileSectionTab === 'calendar' ? 'hidden lg:block' : 'block'
              }`}
            >
              <div className="rounded-3xl border border-[var(--color-border)] dark:border-[#1E3646] bg-white dark:bg-[#101D26] p-4 sm:p-5 shadow-xs space-y-4">
                {/* To-Do Header & Completion Progress */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#FF8C61]">
                      <SoftFilledIcon id="routine" size={15} />
                      <span>
                        {isEn
                          ? 'Collaborative Family To-Do List'
                          : 'قائمة مهام العيلة المشتركة (بابا وماما)'}
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-black text-[#0B131A] dark:text-[#F8FAFC] mt-0.5">
                      {isEn
                        ? `Add a new task, ${isMom ? 'Mom' : 'Dad'}`
                        : `أضف مهمة جديدة ${parentCalloutAr}`}
                    </h3>
                  </div>

                  <div className="text-end shrink-0">
                    <div className="text-xs font-black text-[#0d9488] dark:text-[#38BDF8] tabular-nums">
                      {completionPct}%
                    </div>
                    <div className="text-[10px] font-bold text-[#475569] dark:text-[#CBD5E1]">
                      {completedTasksCount}/{tasks.length} {isEn ? 'Done' : 'مكتمل'}
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2.5 rounded-full bg-[#F8FAFC] dark:bg-[#142430] overflow-hidden border border-[var(--color-border)] dark:border-[#1E3646]">
                  <div
                    style={{ width: `${completionPct}%` }}
                    className="h-full rounded-full bg-gradient-to-r from-[#0d9488] to-[#FF8C61] transition-all duration-500 ease-out"
                  />
                </div>

                {/* Quick Preset Task Chips */}
                <div className="space-y-1.5">
                  <div className="text-[11px] font-extrabold text-[#475569] dark:text-[#CBD5E1]">
                    {isEn ? 'One-Tap Quick Family Tasks:' : 'إضافة سريعة بضغطة واحدة:'}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {quickTaskPresets.map((preset) => (
                      <button
                        key={preset.labelAr}
                        type="button"
                        onClick={() =>
                          handleQuickAddPresetTask(
                            isEn ? preset.labelEn : preset.labelAr,
                            preset.category,
                            preset.time
                          )
                        }
                        className="px-2.5 py-1.5 rounded-xl text-[11px] font-extrabold border border-[var(--color-border)] dark:border-[#1E3646] bg-[#F8FAFC] dark:bg-[#142430] text-[#0B131A] dark:text-[#F8FAFC] hover:border-[#0d9488] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 ease-in-out cursor-pointer"
                      >
                        + {isEn ? preset.labelEn : preset.labelAr}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Interactive Add / Edit Task Form */}
                <form
                  onSubmit={handleTaskFormSubmit}
                  className="p-3.5 rounded-2xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[#F8FAFC] dark:bg-[#142430] space-y-3"
                >
                  <div>
                    <label className="block text-[11px] font-extrabold mb-1 text-[#0B131A] dark:text-[#F8FAFC]">
                      {editingTaskId
                        ? isEn
                          ? 'Update Family Task'
                          : 'تعديل المهمة الحالية'
                        : isEn
                        ? 'Task Title'
                        : `اكتب المهمة الجديدة ${parentCalloutAr}`}
                    </label>
                    <input
                      id="smart-planner-todo-input"
                      type="text"
                      required
                      value={taskInputName}
                      onChange={(e) => setTaskInputName(e.target.value)}
                      placeholder={
                        isEn
                          ? 'e.g. Buy school supplies, Dentist appointment, Swimming practice...'
                          : 'مثال: شراء مستلزمات المدرسة، موعد دكتور الأسنان، تمرين السباحة...'
                      }
                      className="w-full h-10 px-3.5 rounded-xl border border-[var(--color-border)] dark:border-[#1E3646] bg-white dark:bg-[#101D26] text-xs font-bold text-[#0B131A] dark:text-[#F8FAFC] focus:outline-none focus:border-[#0d9488]"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] font-extrabold mb-1 text-[#475569] dark:text-[#CBD5E1]">
                        {isEn ? 'Time' : 'الموعد'}
                      </label>
                      <input
                        type="time"
                        value={taskInputTime}
                        onChange={(e) => setTaskInputTime(e.target.value)}
                        className="w-full h-9 px-2 rounded-xl border border-[var(--color-border)] dark:border-[#1E3646] bg-white dark:bg-[#101D26] text-xs font-bold text-[#0B131A] dark:text-[#F8FAFC]"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-extrabold mb-1 text-[#475569] dark:text-[#CBD5E1]">
                        {isEn ? 'Assigned To' : 'مين هينفذها؟'}
                      </label>
                      <select
                        value={taskInputOwner}
                        onChange={(e) => setTaskInputOwner(e.target.value)}
                        className="w-full h-9 px-2 rounded-xl border border-[var(--color-border)] dark:border-[#1E3646] bg-white dark:bg-[#101D26] text-xs font-bold text-[#0B131A] dark:text-[#F8FAFC]"
                      >
                        <option value="بابا أحمد">بابا أحمد</option>
                        <option value="ماما مريم">ماما مريم</option>
                        <option value="مشترك">مشترك سوا</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-extrabold mb-1 text-[#475569] dark:text-[#CBD5E1]">
                        {isEn ? 'Child' : 'للطفل'}
                      </label>
                      <select
                        value={taskInputKidId}
                        onChange={(e) => setTaskInputKidId(e.target.value)}
                        className="w-full h-9 px-2 rounded-xl border border-[var(--color-border)] dark:border-[#1E3646] bg-white dark:bg-[#101D26] text-xs font-bold text-[#0B131A] dark:text-[#F8FAFC]"
                      >
                        <option value="">{isEn ? 'All' : 'الكل'}</option>
                        {kids.map((k) => (
                          <option key={k.id} value={String(k.id)}>
                            {k.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    {editingTaskId ? (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingTaskId(undefined);
                          setTaskInputName('');
                        }}
                        className="text-xs font-extrabold text-[#475569] dark:text-[#CBD5E1] hover:text-[#FF8C61] cursor-pointer"
                      >
                        {isEn ? 'Cancel Edit' : 'إلغاء التعديل'}
                      </button>
                    ) : (
                      <span className="text-[11px] font-bold text-[#475569] dark:text-[#CBD5E1]">
                        {isEn
                          ? 'Synced instantly with Daily Routine'
                          : 'بتتزامن تلقائيًا مع روتين العيلة اليومي'}
                      </span>
                    )}

                    <PrimaryCtaButton type="submit">
                      <SoftFilledIcon id="routine" size={14} boxSize="sm" />
                      <span>
                        {editingTaskId
                          ? isEn
                            ? 'Save Task'
                            : 'حفظ التعديل'
                          : isEn
                          ? 'Add Task'
                          : `أضف للمهام ${parentCalloutAr}`}
                      </span>
                    </PrimaryCtaButton>
                  </div>
                </form>

                {/* Filter Tabs for To-Do List + Parent Delegation Filter */}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="inline-flex p-1 rounded-2xl bg-[#F8FAFC] dark:bg-[#142430] border border-[var(--color-border)] dark:border-[#1E3646]">
                      {(
                        [
                          { id: 'all', labelAr: `الكل (${tasks.length})`, labelEn: `All (${tasks.length})` },
                          {
                            id: 'open',
                            labelAr: `مطلوب (${tasks.length - completedTasksCount})`,
                            labelEn: `Open (${tasks.length - completedTasksCount})`,
                          },
                          {
                            id: 'done',
                            labelAr: `تمت (${completedTasksCount})`,
                            labelEn: `Done (${completedTasksCount})`,
                          },
                        ] as const
                      ).map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setTodoFilter(tab.id)}
                          className={`px-3 py-1 rounded-xl text-[11px] font-extrabold transition-all cursor-pointer ${
                            todoFilter === tab.id
                              ? 'bg-[#0d9488] text-white'
                              : 'text-[#475569] dark:text-[#CBD5E1]'
                          }`}
                        >
                          {isEn ? tab.labelEn : tab.labelAr}
                        </button>
                      ))}
                    </div>

                    <span className="text-[10px] font-extrabold text-[#475569] dark:text-[#94A3B8]">
                      {isEn ? 'Tap owner badge to delegate ⇄' : 'اضغط على اسم المسؤول للتفويض السريع ⇄'}
                    </span>
                  </div>

                  {/* Parent Delegation Filter Bar (Dad / Mom / Shared) */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {(
                      [
                        { id: 'all', labelAr: '👨‍👩‍👧‍👦 كل المهام', labelEn: '👨‍👩‍👧‍👦 All Owners' },
                        { id: 'dad', labelAr: '👨 مهام بابا أحمد', labelEn: '👨 Dad Ahmad' },
                        { id: 'mom', labelAr: '👩 مهام ماما مريم', labelEn: '👩 Mom Maryam' },
                        { id: 'shared', labelAr: '🤝 مشترك سوا', labelEn: '🤝 Shared' },
                      ] as const
                    ).map((delTab) => (
                      <button
                        key={delTab.id}
                        type="button"
                        onClick={() => setTaskOwnerFilter(delTab.id)}
                        className={`px-2.5 py-1 rounded-xl text-[10.5px] font-extrabold border transition-all cursor-pointer ${
                          taskOwnerFilter === delTab.id
                            ? 'border-[#FF8C61] bg-[#FF8C61] text-white shadow-2xs'
                            : 'border-[var(--color-border)] dark:border-[#1E3646] bg-[#F8FAFC] dark:bg-[#142430] text-[#475569] dark:text-[#CBD5E1]'
                        }`}
                      >
                        {isEn ? delTab.labelEn : delTab.labelAr}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Interactive Task Checklist */}
                <div className="space-y-2.5 max-h-[380px] overflow-y-auto pe-1">
                  {visibleTasks.length === 0 ? (
                    <div className="p-6 rounded-2xl border border-dashed border-[var(--color-border)] dark:border-[#1E3646] text-center space-y-1.5">
                      <div className="text-2xl">🎉</div>
                      <div className="text-xs sm:text-sm font-black text-[#0B131A] dark:text-[#F8FAFC]">
                        {isEn
                          ? 'All clear! No tasks in this filter.'
                          : `تسلم إيدك ${parentCalloutAr}! مفيش مهام متأخرة هنا`}
                      </div>
                      <p className="text-xs text-[#475569] dark:text-[#CBD5E1]">
                        {isEn
                          ? 'Use the quick chips above to add new tasks for your family.'
                          : 'تقدر تضيف مهام جديدة للولاد أو للبيت من الاختيارات السريعة فوق.'}
                      </p>
                    </div>
                  ) : (
                    visibleTasks.map((task) => {
                      const kid = task.kidId ? kidMap[String(task.kidId)] : null;
                      return (
                        <div
                          key={task.id}
                          className={`p-3 rounded-2xl border transition-all duration-300 ease-in-out flex items-start justify-between gap-2.5 ${
                            task.done
                              ? 'border-emerald-500/30 bg-emerald-500/5 dark:bg-[#142430]/60 opacity-80'
                              : 'border-[var(--color-border)] dark:border-[#1E3646] bg-[#F8FAFC] dark:bg-[#142430] hover:border-[#0d9488]/60'
                          }`}
                        >
                          <div className="flex items-start gap-2.5 min-w-0 flex-1">
                            <input
                              type="checkbox"
                              checked={task.done}
                              onChange={(e) => onToggleTask(task.id, e.target.checked, task.scheduledDate)}
                              aria-label={task.name}
                              className="mt-1 w-4 h-4 rounded-md accent-[#0d9488] cursor-pointer shrink-0"
                            />
                            <div className="min-w-0 flex-1 space-y-1">
                              <div
                                onClick={() => onToggleTask(task.id, !task.done, task.scheduledDate)}
                                className={`text-xs sm:text-sm font-black transition-all cursor-pointer ${
                                  task.done
                                    ? 'line-through text-[#64748B] dark:text-[#94A3B8]'
                                    : 'text-[#0B131A] dark:text-[#F8FAFC]'
                                }`}
                              >
                                {task.name}
                              </div>
                              <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-extrabold">
                                {task.time && (
                                  <span className="px-2 py-0.5 rounded-md bg-white dark:bg-[#101D26] text-[#475569] dark:text-[#CBD5E1] tabular-nums">
                                    ⏰ {task.time}
                                  </span>
                                )}
                                {task.scheduledDate && (
                                  <span className="px-2 py-0.5 rounded-md bg-teal-500/10 text-teal-800 dark:text-teal-200">
                                    📅 {new Intl.DateTimeFormat(isEn ? 'en-US' : 'ar-EG', { day: 'numeric', month: 'short' }).format(new Date(task.scheduledDate + 'T12:00:00'))}
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleCycleTaskDelegation(task)}
                                  title={
                                    isEn
                                      ? 'Tap to delegate between Dad Ahmad, Mom Maryam & Shared'
                                      : 'اضغط لتفويض المهمة بين بابا أحمد، ماما مريم، أو مشترك'
                                  }
                                  className={`px-2 py-0.5 rounded-md border transition-all cursor-pointer inline-flex items-center gap-1 ${
                                    (task.owner || '').includes('ماما')
                                      ? 'border-[#FF8C61]/40 bg-[#FF8C61]/15 text-[#c2410c] dark:text-[#FDBA74]'
                                      : (task.owner || '').includes('مشترك')
                                      ? 'border-purple-400/40 bg-purple-500/15 text-purple-800 dark:text-purple-300'
                                      : 'border-[#0d9488]/40 bg-[#0d9488]/15 dark:bg-[#38BDF8]/20 text-[#0f766e] dark:text-[#7DD3FC]'
                                  }`}
                                >
                                  <span>
                                    {(task.owner || '').includes('ماما')
                                      ? '👩'
                                      : (task.owner || '').includes('مشترك')
                                      ? '🤝'
                                      : '👨'}
                                  </span>
                                  <span>{task.owner || 'بابا أحمد'}</span>
                                  <span className="opacity-75">⇄</span>
                                </button>
                                {task.category && (
                                  <span className="px-2 py-0.5 rounded-md bg-white dark:bg-[#101D26] text-[#475569] dark:text-[#94A3B8]">
                                    🏷️ {task.category}
                                  </span>
                                )}
                                {kid && (
                                  <span className="px-2 py-0.5 rounded-md bg-[#FF8C61]/15 text-[#c2410c] dark:text-[#FDBA74]">
                                    🧒 {kid.name}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleStartEditTask(task)}
                              aria-label={isEn ? 'Edit task' : 'تعديل المهمة'}
                              className="px-2 py-1 rounded-lg text-[10px] font-extrabold border border-[var(--color-border)] dark:border-[#1E3646] bg-white dark:bg-[#101D26] text-[#0B131A] dark:text-[#F8FAFC] hover:border-[#0d9488] transition-all cursor-pointer"
                            >
                              {isEn ? 'Edit' : 'تعديل'}
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteTask(task.id)}
                              aria-label={isEn ? 'Delete task' : 'حذف المهمة'}
                              className="px-2 py-1 rounded-lg text-[10px] font-extrabold border border-red-200 dark:border-red-900/40 bg-red-50/70 dark:bg-red-950/30 text-red-700 dark:text-red-300 hover:bg-red-100 transition-all cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

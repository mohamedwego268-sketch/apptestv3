import React from 'react';
import {
  ChildProfile,
  FamilySpaceState,
  LanguageCode,
  RoutineTask,
  TaskCadence,
  TaskReminderInfo,
  getEmptyStateCopy,
  getRoutineTaskReminder,
  locText,
} from '../domain/familySpaceCore';
import { getCardBackgroundSpec } from '../domain/cardBackgrounds';
import {
  FriendlyEmptyState,
  MasterPatternCard,
  PrimaryCtaButton,
  UnifiedBadge,
} from '../components/DesignSystem';
import { SectionToolsDrawer } from '../components/SectionToolsDrawer';

export interface DailyRoutineSectionProps {
  state: FamilySpaceState;
  lang: LanguageCode;
  completedTasksCount: number;
  routineReminderFilter: 'all' | 'alerts' | 'overdue' | 'approaching';
  setRoutineReminderFilter: (val: 'all' | 'alerts' | 'overdue' | 'approaching') => void;
  routineApproachingWindow: number;
  setRoutineApproachingWindow: (val: number) => void;
  routineRefTimePreset: string;
  setRoutineRefTimePreset: (val: string) => void;
  routineCadenceFilter: 'all' | TaskCadence;
  setRoutineCadenceFilter: (val: 'all' | TaskCadence) => void;
  routineKidFilter: string;
  setRoutineKidFilter: (val: string) => void;
  routineStatusFilter: 'all' | 'open' | 'done';
  setRoutineStatusFilter: (val: 'all' | 'open' | 'done') => void;
  routineRemindersSummary: { overdueCount: number; approachingCount: number };
  filteredTasks: RoutineTask[];
  kidMap: Record<string, ChildProfile>;
  effectiveNowMinutes: number;
  renderReminderBadge: (reminder: TaskReminderInfo, compact?: boolean) => React.ReactNode;
  onResetTasks: () => void;
  onOpenAddTask: () => void;
  onOpenEditTask: (task: RoutineTask) => void;
  onToggleTask: (id: number, done: boolean) => void;
  onDeleteTask: (id: number) => void;
}

export const DailyRoutineSection: React.FC<DailyRoutineSectionProps> = ({
  state,
  lang,
  completedTasksCount,
  routineReminderFilter,
  setRoutineReminderFilter,
  routineApproachingWindow,
  setRoutineApproachingWindow,
  routineRefTimePreset,
  setRoutineRefTimePreset,
  routineCadenceFilter,
  setRoutineCadenceFilter,
  routineKidFilter,
  setRoutineKidFilter,
  routineStatusFilter,
  setRoutineStatusFilter,
  routineRemindersSummary,
  filteredTasks,
  kidMap,
  effectiveNowMinutes,
  renderReminderBadge,
  onResetTasks,
  onOpenAddTask,
  onOpenEditTask,
  onToggleTask,
  onDeleteTask,
}) => {
  const isEn = lang === 'en';
  const emptyRoutineCopy = getEmptyStateCopy('routine', lang);

  return (
    <section className="space-y-4" aria-label={isEn ? 'Daily Routine' : 'الروتين اليومي'}>
      {/* Top Action & Smart Reminders Warm Image Card */}
      <div
        className="image-bg-card rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 space-y-2.5 shadow-sm"
        style={{
          backgroundImage: getCardBackgroundSpec('routine', state.darkMode).backgroundImageCss,
        }}
        aria-label={isEn ? 'Daily Routine Reminders' : 'تذكيرات الروتين اليومي'}
      >
        <div className="image-card-glass-panel rounded-xl p-3 flex flex-wrap items-center justify-between gap-2">
          <div className="space-y-0.5 text-start">
            <span className="image-card-badge px-2 py-0.5 rounded-full text-[10px] font-extrabold tabular-nums">
              {isEn ? 'Done:' : 'أُنجز:'} {completedTasksCount}/{state.tasks.length}
            </span>
            <h2 className="image-card-title text-sm sm:text-base font-extrabold">
              {isEn ? 'Family Routine & Reminders' : 'روتين الأسرة والتذكيرات'}
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={onResetTasks}
              className="min-h-[34px] px-3 py-1 rounded-xl text-[11px] font-extrabold border border-white/80 dark:border-[#1E3646] bg-white/90 dark:bg-[#142430] text-slate-900 dark:text-[#F8FAFC] whitespace-nowrap transition-all active:scale-95 cursor-pointer"
            >
              {isEn ? 'Clear filters' : 'مسح التصفية'}
            </button>
            <PrimaryCtaButton variant="orange" size="sm" onClick={onOpenAddTask}>
              {isEn ? '+ Add Task' : '+ إضافة مهمة'}
            </PrimaryCtaButton>
          </div>
        </div>
      </div>

      <SectionToolsDrawer language={lang} titleAr="أدوات الروتين" titleEn="Routine tools">
        {/* Quick Reminder Status Filter Pills */}
        <div className="rounded-xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-muted)] dark:bg-[#142430] p-2.5 flex flex-wrap items-center justify-between gap-2">
          <div
            className="flex flex-wrap items-center gap-1.5"
            role="group"
            aria-label={isEn ? 'Filter by reminder status' : 'تصفية حسب حالة التذكير'}
          >
            <button
              type="button"
              onClick={() => setRoutineReminderFilter('all')}
              className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-extrabold border transition-all duration-300 ease-in-out cursor-pointer ${
                routineReminderFilter === 'all'
                  ? 'bg-[var(--color-accent)] text-[var(--color-accent-contrast)] border-transparent'
                  : 'border-[var(--color-border)] dark:border-[#1E3646] bg-white dark:bg-[#142430] text-[var(--color-text)]'
              }`}
            >
              {isEn ? `All (${state.tasks.length})` : `الكل (${state.tasks.length})`}
            </button>
            <button
              type="button"
              onClick={() => setRoutineReminderFilter('overdue')}
              className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-extrabold border transition-all duration-300 ease-in-out tabular-nums cursor-pointer ${
                routineReminderFilter === 'overdue'
                  ? 'bg-red-700 text-white border-red-700'
                  : 'bg-red-50 dark:bg-[#142430] text-red-800 dark:text-rose-300 border-red-200 dark:border-[#1E3646] hover:bg-red-100'
              }`}
            >
              {isEn
                ? `Overdue (${routineRemindersSummary.overdueCount})`
                : `تجاوزت الموعد (${routineRemindersSummary.overdueCount})`}
            </button>
            <button
              type="button"
              onClick={() => setRoutineReminderFilter('approaching')}
              className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-extrabold border transition-all duration-300 ease-in-out tabular-nums cursor-pointer ${
                routineReminderFilter === 'approaching'
                  ? 'bg-amber-600 text-white border-amber-600'
                  : 'bg-amber-50 dark:bg-[#142430] text-amber-900 dark:text-amber-300 border-amber-300 dark:border-[#1E3646] hover:bg-amber-100'
              }`}
            >
              {isEn
                ? `Approaching (${routineRemindersSummary.approachingCount})`
                : `اقترب موعدها (${routineRemindersSummary.approachingCount})`}
            </button>
          </div>

          {/* Compact Reminder Controls */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <select
              id="routineLeadWindow"
              aria-label={isEn ? 'Reminder lead time' : 'مدة التنبيه قبل الموعد'}
              value={routineApproachingWindow}
              onChange={(e) => setRoutineApproachingWindow(Number(e.target.value))}
              className="rounded-xl border border-[var(--color-border)] dark:border-[#1E3646] bg-white dark:bg-[#142430] px-2.5 py-1.5 text-xs font-bold text-[var(--color-text)]"
            >
              <option value={30}>{isEn ? 'Alert 30m before' : 'تنبيه قبل 30 دقيقة'}</option>
              <option value={60}>{isEn ? 'Alert 60m before' : 'تنبيه قبل 60 دقيقة'}</option>
              <option value={90}>{isEn ? 'Alert 90m before' : 'تنبيه قبل 90 دقيقة'}</option>
              <option value={120}>{isEn ? 'Alert 120m before' : 'تنبيه قبل 120 دقيقة'}</option>
            </select>
            <select
              id="routineRefTime"
              aria-label={isEn ? 'Reference time' : 'الوقت المرجعي لحساب التذكيرات'}
              value={routineRefTimePreset}
              onChange={(e) => setRoutineRefTimePreset(e.target.value)}
              className="rounded-xl border border-[var(--color-border)] dark:border-[#1E3646] bg-white dark:bg-[#142430] px-2.5 py-1.5 text-xs font-bold text-[var(--color-text)]"
            >
              <option value="live">{isEn ? 'Current time' : 'الوقت الحالي'}</option>
              <option value="07:15">{isEn ? 'Morning (07:15 AM)' : 'صباحًا (07:15 ص)'}</option>
              <option value="15:45">{isEn ? 'Afternoon (03:45 PM)' : 'عصرًا (03:45 م)'}</option>
              <option value="18:20">{isEn ? 'Evening (06:20 PM)' : 'مساءً (06:20 م)'}</option>
              <option value="20:30">{isEn ? 'Night (08:30 PM)' : 'ليلًا (08:30 م)'}</option>
            </select>
          </div>
        </div>
      </SectionToolsDrawer>

      <div className="rounded-2xl sm:rounded-3xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-surface)] dark:bg-[#101D26] p-3.5 sm:p-4 soft-card-surface space-y-3.5">
        {/* Day / Week / Month Tabs & Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div
            className="flex items-center gap-1.5 bg-[var(--color-control-muted)] dark:bg-[#142430] p-1 rounded-2xl border border-transparent dark:border-[#1E3646]"
            role="tablist"
            aria-label={isEn ? 'Routine cadence' : 'نطاق تكرار الروتين'}
          >
            {[
              { id: 'all', label: isEn ? 'All Periods' : 'كل الفترات' },
              { id: 'daily', label: isEn ? 'Daily' : 'اليوم' },
              { id: 'weekly', label: isEn ? 'Weekly' : 'الأسبوع' },
              { id: 'monthly', label: isEn ? 'Monthly' : 'الشهر' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setRoutineCadenceFilter(tab.id as 'all' | TaskCadence)}
                className={`px-3.5 py-1.5 text-xs font-extrabold rounded-xl transition-all duration-300 ease-in-out whitespace-nowrap shrink-0 cursor-pointer ${
                  routineCadenceFilter === tab.id
                    ? 'bg-[var(--color-surface)] dark:bg-[#101D26] text-[var(--color-text)] shadow-xs'
                    : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              id="routineKidFilter"
              aria-label={isEn ? 'Filter by child' : 'عرض مهام'}
              value={routineKidFilter}
              onChange={(e) => setRoutineKidFilter(e.target.value)}
              className="rounded-xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-bg)] dark:bg-[#142430] px-3 py-2 text-xs font-bold text-[var(--color-text)]"
            >
              <option value="all">{isEn ? 'Everyone in the family' : 'كل أفراد الأسرة'}</option>
              {state.kids.map((k) => (
                <option key={k.id} value={String(k.id)}>
                  {locText(k.name, lang)}
                </option>
              ))}
            </select>
            <select
              id="routineStatusFilter"
              aria-label={isEn ? 'Task status' : 'حالة المهمة'}
              value={routineStatusFilter}
              onChange={(e) => setRoutineStatusFilter(e.target.value as 'all' | 'open' | 'done')}
              className="rounded-xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-bg)] dark:bg-[#142430] px-3 py-2 text-xs font-bold text-[var(--color-text)]"
            >
              <option value="all">{isEn ? 'All Statuses' : 'كل الحالات'}</option>
              <option value="open">{isEn ? 'Open' : 'غير مكتملة'}</option>
              <option value="done">{isEn ? 'Completed' : 'مكتملة'}</option>
            </select>
          </div>
        </div>

        {/* Tasks Grid Cards with Standardized SoftFilledIcon & Visual Reminder Badges */}
        {filteredTasks.length === 0 ? (
          <FriendlyEmptyState
            id="empty-routine-state"
            iconId="routine"
            tone="teal"
            title={emptyRoutineCopy.title}
            subtitle={emptyRoutineCopy.subtitle}
            actionLabel={emptyRoutineCopy.actionLabel}
            onAction={onOpenAddTask}
            secondaryCtaLabel={isEn ? 'Show All Tasks' : 'عرض كل مهام الروتين'}
            onSecondaryCtaClick={() => {
              setRoutineReminderFilter('all');
              setRoutineCadenceFilter('all');
              setRoutineKidFilter('all');
              setRoutineStatusFilter('all');
            }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredTasks.map((task) => {
              const assignedKid = task.kidId ? kidMap[String(task.kidId)] : null;
              const reminder = getRoutineTaskReminder(
                task,
                effectiveNowMinutes,
                routineApproachingWindow,
                state.language
              );
              const taskTone =
                reminder.status === 'overdue'
                  ? 'rose'
                  : reminder.status === 'approaching'
                  ? 'amber'
                  : task.done
                  ? 'emerald'
                  : 'teal';

              return (
                <MasterPatternCard
                  key={task.id}
                  tone={taskTone}
                  categoryKey="routine"
                  itemIdOrIndex={task.id}
                  darkMode={state.darkMode}
                  onThumbnailClick={() => onToggleTask(task.id, !task.done)}
                  topLeftBadge={locText(task.category, lang)}
                  topRightBadge={
                    <span>
                      🕒 {locText(task.time || 'مرن', lang)}
                    </span>
                  }
                  titlePrefixSlot={
                    <label className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] -m-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={task.done}
                        aria-label={locText(task.name, lang)}
                        onChange={(e) => {
                          e.stopPropagation();
                          onToggleTask(task.id, e.target.checked);
                        }}
                        className="w-5 h-5 accent-[var(--color-task-accent)] shrink-0 cursor-pointer"
                      />
                    </label>
                  }
                  title={
                    <span className={task.done ? 'line-through opacity-75' : ''}>
                      {locText(task.name, lang)}
                    </span>
                  }
                  metaLeft={
                    <span>
                      👶 {assignedKid ? locText(assignedKid.name, lang) : locText('الأسرة', lang)} ·{' '}
                      {locText(task.category, lang)}
                    </span>
                  }
                  metaRightAction={renderReminderBadge(reminder)}
                  footerLeft={
                    <UnifiedBadge tone="teal" iconId={task.done ? 'star' : 'routine'}>
                      {task.done
                        ? isEn
                          ? 'Completed ✓'
                          : 'مكتملة ✓'
                        : isEn
                        ? 'Pending Task'
                        : 'قيد التنفيذ'}
                    </UnifiedBadge>
                  }
                  footerRight={
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => onOpenEditTask(task)}
                        className="min-h-[44px] px-3.5 py-1.5 rounded-xl text-xs font-bold border border-[var(--color-border)] dark:border-[#1E3646] bg-white dark:bg-[#142430] text-[var(--color-text)] dark:text-[#F8FAFC] transition-all duration-200 ease-in-out active:scale-95 cursor-pointer"
                      >
                        {isEn ? 'Edit' : 'تعديل'}
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteTask(task.id)}
                        aria-label={`${isEn ? 'Delete task' : 'حذف المهمة'} ${locText(task.name, lang)}`}
                        className="min-h-[44px] min-w-[44px] px-3 py-1.5 rounded-xl text-sm font-bold border border-red-200 dark:border-[#1E3646] bg-white dark:bg-[#142430] text-red-700 dark:text-rose-400 transition-all duration-200 ease-in-out active:scale-95 cursor-pointer"
                      >
                        ×
                      </button>
                    </div>
                  }
                />
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

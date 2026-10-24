import React from 'react';
import {
  ChildProfile,
  FamilySpaceState,
  LanguageCode,
  RoutineTask,
  TaskCadence,
  TaskReminderInfo,
  getRoutineTaskReminder,
  locText,
} from '../domain/familySpaceCore';
import { getCardBackgroundSpec } from '../domain/cardBackgrounds';
import { PrimaryCtaButton, SoftFilledIcon, UnifiedBadge } from '../components/DesignSystem';

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

  return (
    <section className="space-y-6" aria-label={isEn ? 'Daily Routine' : 'الروتين اليومي'}>
      {/* Top Action & Smart Reminders Warm Image Card */}
      <div
        className="image-bg-card rounded-[24px] p-5 sm:p-6 space-y-4"
        style={{
          backgroundImage: getCardBackgroundSpec('routine', state.darkMode).backgroundImageCss,
        }}
        aria-label={isEn ? 'Daily Routine Reminders' : 'تذكيرات الروتين اليومي'}
      >
        <div className="flex flex-col items-center justify-center text-center gap-3 py-2">
          <span className="image-card-badge px-3 py-1 rounded-full text-xs font-extrabold tabular-nums">
            {isEn ? 'Completed:' : 'مكتمل:'} {completedTasksCount}/{state.tasks.length}
          </span>
          <h2 className="section-heading-centered image-card-title">
            {isEn ? 'Daily Routine & Smart Reminders' : 'الروتين اليومي والتذكيرات الذكية'}
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <button
              type="button"
              onClick={onResetTasks}
              className="min-h-[44px] px-3.5 py-2 rounded-2xl text-xs font-extrabold border border-white bg-white/90 text-slate-900 whitespace-nowrap"
            >
              {isEn ? 'Reset Progress' : 'إعادة ضبط الإنجاز'}
            </button>
            <PrimaryCtaButton variant="orange" onClick={onOpenAddTask}>
              {isEn ? '+ Add Task' : '+ إضافة مهمة'}
            </PrimaryCtaButton>
          </div>
        </div>

        {/* Quick Reminder Status Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/50">
          <div
            className="flex flex-wrap items-center gap-1.5"
            role="group"
            aria-label={isEn ? 'Filter by reminder status' : 'تصفية حسب حالة التذكير'}
          >
            <button
              type="button"
              onClick={() => setRoutineReminderFilter('all')}
              className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-extrabold border transition-colors ${
                routineReminderFilter === 'all'
                  ? 'bg-[var(--color-accent)] text-[var(--color-accent-contrast)] border-transparent'
                  : 'border-[var(--color-border)] bg-white text-[var(--color-text)]'
              }`}
            >
              {isEn ? `All (${state.tasks.length})` : `الكل (${state.tasks.length})`}
            </button>
            <button
              type="button"
              onClick={() => setRoutineReminderFilter('overdue')}
              className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-extrabold border transition-colors tabular-nums ${
                routineReminderFilter === 'overdue'
                  ? 'bg-red-700 text-white border-red-700'
                  : 'bg-red-50 text-red-800 border-red-200 hover:bg-red-100'
              }`}
            >
              {isEn
                ? `Overdue (${routineRemindersSummary.overdueCount})`
                : `تجاوزت الموعد (${routineRemindersSummary.overdueCount})`}
            </button>
            <button
              type="button"
              onClick={() => setRoutineReminderFilter('approaching')}
              className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-extrabold border transition-colors tabular-nums ${
                routineReminderFilter === 'approaching'
                  ? 'bg-amber-600 text-white border-amber-600'
                  : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
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
              aria-label={isEn ? 'Alert lead window' : 'التنبيه قبل الموعد بـ'}
              value={routineApproachingWindow}
              onChange={(e) => setRoutineApproachingWindow(Number(e.target.value))}
              className="rounded-xl border border-[var(--color-border)] bg-white px-2.5 py-1.5 text-xs font-bold text-[var(--color-text)]"
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
              className="rounded-xl border border-[var(--color-border)] bg-white px-2.5 py-1.5 text-xs font-bold text-[var(--color-text)]"
            >
              <option value="live">{isEn ? 'Live Current Time' : 'الوقت الحالي تلقائيًا'}</option>
              <option value="07:15">{isEn ? 'Morning (07:15 AM)' : 'صباحًا (07:15 ص)'}</option>
              <option value="15:45">{isEn ? 'Afternoon (03:45 PM)' : 'عصرًا (03:45 م)'}</option>
              <option value="18:20">{isEn ? 'Evening (06:20 PM)' : 'مساءً (06:20 م)'}</option>
              <option value="20:30">{isEn ? 'Night (08:30 PM)' : 'ليلًا (08:30 م)'}</option>
            </select>
          </div>
        </div>
      </div>

      <div className="rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-6 soft-card-surface space-y-5">
        {/* Day / Week / Month Tabs & Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div
            className="flex items-center gap-1.5 bg-[var(--color-control-muted)] p-1 rounded-2xl"
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
                className={`px-3.5 py-1.5 text-xs font-extrabold rounded-xl transition-colors whitespace-nowrap shrink-0 ${
                  routineCadenceFilter === tab.id
                    ? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-xs'
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
              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-3 py-2 text-xs font-bold text-[var(--color-text)]"
            >
              <option value="all">{isEn ? 'All Kids & Family' : 'كل الأطفال والأسرة'}</option>
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
              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-3 py-2 text-xs font-bold text-[var(--color-text)]"
            >
              <option value="all">{isEn ? 'All Statuses' : 'كل الحالات'}</option>
              <option value="open">{isEn ? 'Open' : 'غير مكتملة'}</option>
              <option value="done">{isEn ? 'Completed' : 'مكتملة'}</option>
            </select>
          </div>
        </div>

        {/* Tasks Grid Cards with Standardized SoftFilledIcon & Visual Reminder Badges */}
        {filteredTasks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--color-border)] p-6 text-center text-sm font-bold text-[var(--color-muted)]">
            {isEn ? 'No tasks match the current filter.' : 'لا توجد مهام مطابقة للتصفية الحالية.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTasks.map((task) => {
              const assignedKid = task.kidId ? kidMap[String(task.kidId)] : null;
              const reminder = getRoutineTaskReminder(
                task,
                effectiveNowMinutes,
                routineApproachingWindow,
                state.language
              );
              return (
                <div
                  key={task.id}
                  className={`rounded-2xl border p-4 flex items-center justify-between gap-3 transition-all ${
                    reminder.status === 'overdue'
                      ? 'bg-red-50/75 border-red-200'
                      : reminder.status === 'approaching'
                      ? 'bg-amber-50/75 border-amber-200'
                      : task.done
                      ? 'bg-emerald-50/50 border-emerald-200/70'
                      : 'bg-[var(--color-control-muted)]/55 border-[var(--color-border)]'
                  }`}
                >
                  <label className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={task.done}
                      onChange={(e) => onToggleTask(task.id, e.target.checked)}
                      className="w-5 h-5 accent-[var(--color-task-accent)] shrink-0"
                    />
                    <SoftFilledIcon id={task.done ? 'star' : 'routine'} boxSize="sm" />
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={`text-sm font-extrabold truncate ${
                            task.done
                              ? 'line-through text-[var(--color-muted)]'
                              : 'text-[var(--color-text)]'
                          }`}
                        >
                          {locText(task.name, lang)}
                        </span>
                        {renderReminderBadge(reminder)}
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold text-[var(--color-muted)]">
                        <UnifiedBadge tone="teal" iconId="children">
                          {assignedKid ? locText(assignedKid.name, lang) : locText('الأسرة', lang)}
                        </UnifiedBadge>
                        <span>· {locText(task.category, lang)}</span>
                        <span>· {locText(task.time || 'مرن', lang)}</span>
                      </div>
                    </div>
                  </label>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => onOpenEditTask(task)}
                      className="min-h-[36px] px-2.5 py-1 rounded-xl text-xs font-bold border border-[var(--color-border)] bg-white text-[var(--color-text)]"
                    >
                      {isEn ? 'Edit' : 'تعديل'}
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteTask(task.id)}
                      aria-label={`${isEn ? 'Delete task' : 'حذف المهمة'} ${locText(task.name, lang)}`}
                      className="min-h-[36px] px-2.5 py-1 rounded-xl text-xs font-bold border border-red-200 bg-white text-red-700"
                    >
                      ×
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

import React from 'react';
import {
  CalendarDisplayMode,
  CalendarEvent,
  ChildProfile,
  FamilySpaceState,
  LanguageCode,
  formatGregorianAndHijri,
  locText,
} from '../domain/familySpaceCore';
import { getCardBackgroundSpec } from '../domain/cardBackgrounds';
import { PrimaryCtaButton, SoftFilledIcon, UnifiedBadge } from '../components/DesignSystem';

export interface FamilyCalendarSectionProps {
  state: FamilySpaceState;
  lang: LanguageCode;
  todayFormattedCombined: string;
  eventFrom: string;
  setEventFrom: (val: string) => void;
  eventTo: string;
  setEventTo: (val: string) => void;
  isEventRangeReversed: boolean;
  filteredEvents: CalendarEvent[];
  kidMap: Record<string, ChildProfile>;
  onSetEventRange: (days: number) => void;
  onChangeCalendarMode: (mode: CalendarDisplayMode) => void;
  onOpenAddEvent: () => void;
  onOpenEditEvent: (ev: CalendarEvent) => void;
  onDeleteEvent: (id: number) => void;
}

export const FamilyCalendarSection: React.FC<FamilyCalendarSectionProps> = ({
  state,
  lang,
  todayFormattedCombined,
  eventFrom,
  setEventFrom,
  eventTo,
  setEventTo,
  isEventRangeReversed,
  filteredEvents,
  kidMap,
  onSetEventRange,
  onChangeCalendarMode,
  onOpenAddEvent,
  onOpenEditEvent,
  onDeleteEvent,
}) => {
  const isEn = lang === 'en';

  return (
    <section className="space-y-6" aria-label={isEn ? 'Family Calendar' : 'التقويم الأسري'}>
      <div
        style={{ backgroundImage: getCardBackgroundSpec('calendar', state.darkMode).backgroundImageCss }}
        className="image-bg-card rounded-[24px] p-6 sm:p-8 flex flex-col items-center justify-center text-center gap-3"
      >
        <span className="image-card-badge px-3 py-1 rounded-xl text-xs font-extrabold tabular-nums">
          {todayFormattedCombined}
        </span>
        <h2 className="image-card-title text-xl sm:text-2xl font-extrabold text-center">
          {isEn ? 'Family Calendar (Gregorian & Hijri)' : 'التقويم والمواعيد (ميلادي وهجري)'}
        </h2>
        <PrimaryCtaButton variant="teal" onClick={onOpenAddEvent}>
          {isEn ? '+ Add New Event' : '+ إضافة حدث جديد'}
        </PrimaryCtaButton>
      </div>

      <div className="rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-6 soft-card-surface space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[var(--color-border)]">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onSetEventRange(0)}
              className="min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-extrabold border border-[var(--color-border)] bg-[var(--color-control-muted)] text-[var(--color-text)]"
            >
              {isEn ? 'Today' : 'اليوم'}
            </button>
            <button
              type="button"
              onClick={() => onSetEventRange(7)}
              className="min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-extrabold border border-[var(--color-border)] bg-[var(--color-control-muted)] text-[var(--color-text)]"
            >
              {isEn ? 'Next 7 Days' : 'الأيام السبعة القادمة'}
            </button>
            <button
              type="button"
              onClick={() => {
                setEventFrom('');
                setEventTo('');
              }}
              className="min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-extrabold border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]"
            >
              {isEn ? `All Events (${state.events.length})` : `كل الأحداث (${state.events.length})`}
            </button>
          </div>

          <div
            className="flex items-center gap-1.5 bg-[var(--color-control-muted)] p-1 rounded-2xl"
            role="group"
            aria-label={isEn ? 'Date display mode' : 'نظام عرض التاريخ'}
          >
            {[
              { id: 'both', label: isEn ? 'Gregorian & Hijri' : 'الميلادي والهجري' },
              { id: 'gregorian', label: isEn ? 'Gregorian' : 'الميلادي' },
              { id: 'hijri', label: isEn ? 'Hijri' : 'الهجري' },
            ].map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() => onChangeCalendarMode(mode.id as CalendarDisplayMode)}
                className={`px-3 py-1 text-xs font-extrabold rounded-xl transition-colors whitespace-nowrap shrink-0 ${
                  state.calendarMode === mode.id
                    ? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-xs'
                    : 'text-[var(--color-muted)]'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>

        {/* Date Range Filter */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="eventFrom" className="block text-xs font-bold text-[var(--color-muted)] mb-1">
              {isEn ? 'From Date' : 'من تاريخ'}
            </label>
            <input
              id="eventFrom"
              type="date"
              value={eventFrom}
              onChange={(e) => setEventFrom(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-3 py-2 text-sm text-[var(--color-text)]"
            />
          </div>
          <div>
            <label htmlFor="eventTo" className="block text-xs font-bold text-[var(--color-muted)] mb-1">
              {isEn ? 'To Date' : 'إلى تاريخ'}
            </label>
            <input
              id="eventTo"
              type="date"
              value={eventTo}
              onChange={(e) => setEventTo(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-3 py-2 text-sm text-[var(--color-text)]"
            />
          </div>
        </div>

        {/* Events Grid Cards with Standardized SoftFilledIcon & UnifiedBadge */}
        {isEventRangeReversed ? (
          <div
            className="rounded-2xl border border-dashed border-amber-400 bg-amber-50 p-5 text-center text-xs font-bold text-amber-900"
            role="status"
          >
            {isEn
              ? 'Start date is after end date. Adjust the range to view events.'
              : 'تاريخ البداية بعد تاريخ النهاية. عدّل نطاق التاريخ لعرض الأحداث.'}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--color-border)] p-6 text-center text-sm font-bold text-[var(--color-muted)]">
            {isEn ? 'No events in this date range.' : 'لا توجد أحداث في هذه الفترة.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredEvents.map((ev) => {
              const assignedKid = ev.childId ? kidMap[String(ev.childId)] : null;
              const formattedDate = formatGregorianAndHijri(
                ev.date,
                state.country,
                state.language,
                state.calendarMode
              );
              const isMedical = ev.type === 'موعد طبي' || ev.type === 'تطعيم';
              const iconId = isMedical ? 'health' : ev.type === 'عيد ميلاد' ? 'wishes' : 'calendar';

              return (
                <div
                  key={ev.id}
                  className={`rounded-[22px] border p-4 sm:p-5 flex items-start justify-between gap-3 shadow-2xs ${
                    isMedical
                      ? 'bg-emerald-50/80 border-emerald-200/80'
                      : 'bg-cyan-50/75 border-cyan-200/80'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <SoftFilledIcon id={iconId} boxSize="md" />
                    <div className="min-w-0 space-y-1">
                      <div className="font-extrabold text-sm text-[var(--color-text)]">
                        {locText(ev.title, lang)}
                      </div>
                      <div className="text-xs font-bold text-[var(--color-muted)] tabular-nums">
                        {formattedDate.combined}
                        {ev.time ? ` · ${locText(ev.time, lang)}` : ''}
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        <UnifiedBadge tone={isMedical ? 'emerald' : 'sky'} iconId={iconId}>
                          {locText(ev.type, lang)}
                        </UnifiedBadge>
                        <UnifiedBadge tone="teal" iconId={assignedKid ? 'children' : 'family'}>
                          {assignedKid ? locText(assignedKid.name, lang) : locText('الأسرة', lang)}
                        </UnifiedBadge>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => onOpenEditEvent(ev)}
                      className="min-h-[36px] px-2.5 py-1 rounded-xl text-xs font-bold border border-[var(--color-border)] bg-white text-[var(--color-text)]"
                    >
                      {isEn ? 'Edit' : 'تعديل'}
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteEvent(ev.id)}
                      aria-label={`${isEn ? 'Delete event' : 'حذف الحدث'} ${locText(ev.title, lang)}`}
                      className="min-h-[36px] px-2.5 py-1 rounded-xl text-xs font-bold border border-red-200 bg-white text-red-700"
                    >
                      {isEn ? 'Delete' : 'حذف'}
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

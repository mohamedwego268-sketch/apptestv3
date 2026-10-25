import React from 'react';
import {
  CalendarDisplayMode,
  CalendarEvent,
  ChildProfile,
  FamilySpaceState,
  LanguageCode,
  formatGregorianAndHijri,
  getEmptyStateCopy,
  locText,
} from '../domain/familySpaceCore';
import { getCardBackgroundSpec } from '../domain/cardBackgrounds';
import {
  FriendlyEmptyState,
  MasterPatternCard,
  PrimaryCtaButton,
  SoftFilledIcon,
  UnifiedBadge,
} from '../components/DesignSystem';

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
  const emptyCalendarCopy = getEmptyStateCopy('calendar', lang);

  return (
    <section className="space-y-6" aria-label={isEn ? 'Family Calendar' : 'التقويم الأسري'}>
      <div
        style={{ backgroundImage: getCardBackgroundSpec('calendar', state.darkMode).backgroundImageCss }}
        className="image-bg-card rounded-3xl p-6 sm:p-8 flex flex-col items-center justify-center text-center gap-3 shadow-md"
      >
        <div className="image-card-glass-panel rounded-2xl p-4 sm:p-5 max-w-xl w-full flex flex-col items-center justify-center gap-2.5">
          <span className="image-card-badge px-3 py-1 rounded-full text-xs font-extrabold tabular-nums">
            {todayFormattedCombined}
          </span>
          <h2 className="image-card-title text-xl sm:text-2xl font-extrabold text-center leading-snug">
            {isEn ? 'Family Calendar (Gregorian & Hijri)' : 'التقويم والمواعيد (ميلادي وهجري)'}
          </h2>
          <PrimaryCtaButton variant="teal" onClick={onOpenAddEvent}>
            {isEn ? '+ Add New Event' : '+ إضافة حدث جديد'}
          </PrimaryCtaButton>
        </div>
      </div>

      <div className="rounded-3xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-surface)] dark:bg-[#101D26] p-5 sm:p-6 soft-card-surface space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[var(--color-border)] dark:border-[#1E3646]">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onSetEventRange(0)}
              className="min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-extrabold border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-muted)] dark:bg-[#142430] text-[var(--color-text)] transition-all duration-300 ease-in-out active:scale-95 cursor-pointer"
            >
              {isEn ? 'Today' : 'اليوم'}
            </button>
            <button
              type="button"
              onClick={() => onSetEventRange(7)}
              className="min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-extrabold border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-muted)] dark:bg-[#142430] text-[var(--color-text)] transition-all duration-300 ease-in-out active:scale-95 cursor-pointer"
            >
              {isEn ? 'Next 7 Days' : 'الأيام السبعة القادمة'}
            </button>
            <button
              type="button"
              onClick={() => {
                setEventFrom('');
                setEventTo('');
              }}
              className="min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-extrabold border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-surface)] dark:bg-[#142430] text-[var(--color-text)] transition-all duration-300 ease-in-out active:scale-95 cursor-pointer"
            >
              {isEn ? `All Events (${state.events.length})` : `كل الأحداث (${state.events.length})`}
            </button>
          </div>

          <div
            className="flex items-center gap-1.5 bg-[var(--color-control-muted)] dark:bg-[#142430] p-1 rounded-2xl border border-transparent dark:border-[#1E3646]"
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
                className={`px-3 py-1 text-xs font-extrabold rounded-xl transition-all duration-300 ease-in-out whitespace-nowrap shrink-0 cursor-pointer ${
                  state.calendarMode === mode.id
                    ? 'bg-[var(--color-surface)] dark:bg-[#101D26] text-[var(--color-text)] shadow-xs'
                    : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
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
              className="w-full rounded-xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-bg)] dark:bg-[#142430] px-3 py-2 text-sm text-[var(--color-text)]"
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
              className="w-full rounded-xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-bg)] dark:bg-[#142430] px-3 py-2 text-sm text-[var(--color-text)]"
            />
          </div>
        </div>

        {/* Events Grid Cards with Standardized SoftFilledIcon & UnifiedBadge */}
        {isEventRangeReversed ? (
          <div
            className="rounded-2xl border border-dashed border-amber-400 dark:border-[#1E3646] bg-amber-50 dark:bg-[#142430] p-5 text-center text-xs font-bold text-amber-900 dark:text-[#FDBA74]"
            role="status"
          >
            {isEn
              ? 'Start date is after end date. Adjust the range to view events.'
              : 'تاريخ البداية بعد تاريخ النهاية. عدّل نطاق التاريخ لعرض الأحداث.'}
          </div>
        ) : filteredEvents.length === 0 ? (
          <FriendlyEmptyState
            id="empty-calendar-state"
            iconId="calendar"
            tone="sky"
            title={emptyCalendarCopy.title}
            subtitle={emptyCalendarCopy.subtitle}
            actionLabel={emptyCalendarCopy.actionLabel}
            onAction={onOpenAddEvent}
            secondaryCtaLabel={isEn ? 'Show All Events' : 'عرض كل الأحداث'}
            onSecondaryCtaClick={() => {
              setEventFrom('');
              setEventTo('');
            }}
          />
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
                <MasterPatternCard
                  key={ev.id}
                  tone={isMedical ? 'emerald' : 'sky'}
                  categoryKey={isMedical ? 'medical' : 'calendar'}
                  itemIdOrIndex={ev.id}
                  darkMode={state.darkMode}
                  onThumbnailClick={() => onOpenEditEvent(ev)}
                  topLeftBadge={locText(ev.type, lang)}
                  topRightBadge={
                    <span>
                      📅 {ev.date}
                    </span>
                  }
                  titlePrefixSlot={<SoftFilledIcon id={iconId} size={18} />}
                  title={locText(ev.title, lang)}
                  metaLeft={
                    <span>
                      🗓️ {formattedDate.combined}
                      {ev.time ? ` · ${locText(ev.time, lang)}` : ''}
                    </span>
                  }
                  metaRightAction={
                    <UnifiedBadge tone="teal" iconId={assignedKid ? 'children' : 'family'}>
                      {assignedKid ? locText(assignedKid.name, lang) : locText('الأسرة', lang)}
                    </UnifiedBadge>
                  }
                  footerLeft={
                    <UnifiedBadge tone={isMedical ? 'emerald' : 'sky'} iconId={iconId}>
                      {locText(ev.type, lang)}
                    </UnifiedBadge>
                  }
                  footerRight={
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => onOpenEditEvent(ev)}
                        className="min-h-[34px] px-2.5 py-1 rounded-xl text-xs font-bold border border-[var(--color-border)] dark:border-[#1E3646] bg-white dark:bg-[#142430] text-[var(--color-text)] dark:text-[#F8FAFC] transition-all duration-300 ease-in-out active:scale-95 cursor-pointer"
                      >
                        {isEn ? 'Edit' : 'تعديل'}
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteEvent(ev.id)}
                        aria-label={`${isEn ? 'Delete event' : 'حذف الحدث'} ${locText(ev.title, lang)}`}
                        className="min-h-[34px] px-2.5 py-1 rounded-xl text-xs font-bold border border-red-200 dark:border-[#1E3646] bg-white dark:bg-[#142430] text-red-700 dark:text-rose-400 transition-all duration-300 ease-in-out active:scale-95 cursor-pointer"
                      >
                        {isEn ? 'Delete' : 'حذف'}
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

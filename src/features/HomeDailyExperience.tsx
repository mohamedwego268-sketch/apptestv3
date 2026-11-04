import React, { useMemo } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  ChartNoAxesColumnIncreasing,
  ClipboardCheck,
  Heart,
  Sparkles,
} from 'lucide-react';
import type { DailyChildLifeRecord } from '../services/supabaseService';

interface HomeDailyExperienceProps {
  language: 'ar' | 'en';
  childName: string;
  childEmoji: string;
  ageLabel: string;
  records: DailyChildLifeRecord[];
  todayProgress: {
    sleepLogged: boolean;
    mealLogged: boolean;
    careLogged: boolean;
  };
  onOpenDailyLog: () => void;
  onOpenMood: () => void;
  onOpenProfile: () => void;
}

const getLocalDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const HomeDailyExperience: React.FC<HomeDailyExperienceProps> = ({
  language,
  childName,
  childEmoji,
  ageLabel,
  records,
  todayProgress,
  onOpenDailyLog,
  onOpenMood,
  onOpenProfile,
}) => {
  const isEn = language === 'en';
  const week = useMemo(() => {
    const today = new Date();
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - index));
      date.setHours(0, 0, 0, 0);
      const key = getLocalDateKey(date);
      return {
        key,
        label: new Intl.DateTimeFormat(isEn ? 'en-US' : 'ar-EG', { weekday: 'short' }).format(date),
        count: records.filter((record) => getLocalDateKey(new Date(record.occurred_at)) === key).length,
        isToday: index === 6,
      };
    });
    return days;
  }, [records, isEn]);

  const weekTotal = week.reduce((sum, day) => sum + day.count, 0);
  const activeDays = week.filter((day) => day.count > 0).length;
  const maxCount = Math.max(1, ...week.map((day) => day.count));
  const todayKey = getLocalDateKey(new Date());
  const todayRecords = records.filter((record) => getLocalDateKey(new Date(record.occurred_at)) === todayKey).length;
  const completedEssentials = Number(todayProgress.sleepLogged) + Number(todayProgress.mealLogged) + Number(todayProgress.careLogged);
  const completion = Math.round((completedEssentials / 3) * 100);
  const Arrow = isEn ? ArrowRight : ArrowLeft;

  return (
    <section
      data-testid="home-daily-experience"
      dir={isEn ? 'ltr' : 'rtl'}
      className="relative isolate overflow-hidden rounded-[2rem] border border-teal-500/20 bg-gradient-to-br from-[#092F38] via-[#0D4850] to-[#123A55] p-4 text-white shadow-[0_22px_55px_-30px_rgba(4,47,56,.75)] sm:p-5"
      aria-labelledby="home-daily-experience-title"
    >
      <div aria-hidden="true" className="pointer-events-none absolute -end-12 -top-16 h-44 w-44 rounded-full bg-cyan-300/10 blur-2xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-20 -start-10 h-48 w-48 rounded-full bg-emerald-300/10 blur-2xl" />
      <div className="relative space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[10px] font-extrabold text-teal-100">
              <Sparkles size={13} />
              {isEn ? 'YOUR FAMILY, IN THE MOMENT' : 'لحظات طفلك.. تستاهل تتسجل'}
            </div>
            <h2 id="home-daily-experience-title" className="text-lg font-black leading-tight sm:text-xl">
              {isEn ? `A little closer to ${childName}’s world` : `كل يوم بنعرف عالم ${childName} أكتر`}
            </h2>
            <p className="mt-1.5 text-xs font-medium leading-relaxed text-cyan-50/75">
              {isEn ? 'A living picture built from the moments you actually record.' : 'صورة بتكبر من اللحظات الحقيقية اللي بتسجّلها معاه.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenProfile}
            aria-label={isEn ? 'Open child profile' : 'افتح ملف الطفل'}
            className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-white/15 bg-white/10 text-3xl shadow-inner transition duration-300 hover:-translate-y-1 hover:bg-white/15 active:scale-95"
          >
            {childEmoji || '🧒'}
          </button>
        </div>

        <div className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-2xl border border-white/10 bg-white/[.07] p-3.5 backdrop-blur-sm">
          <div className="min-w-0">
            <p className="text-sm font-black">{childName}</p>
            <p className="mt-0.5 text-[10px] font-bold text-cyan-50/65">{ageLabel}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-bold text-white/90">
                <CalendarDays size={12} /> {todayRecords} {isEn ? 'today' : 'تسجيل اليوم'}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-bold text-white/90">
                <ChartNoAxesColumnIncreasing size={12} /> {weekTotal} {isEn ? 'this week' : 'خلال 7 أيام'}
              </span>
            </div>
          </div>
          <div className="relative grid h-[76px] w-[76px] shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(#67E8C2 ${completion}%, rgba(255,255,255,.13) 0)` }}>
            <div className="grid h-[62px] w-[62px] place-items-center rounded-full bg-[#10414A] text-center">
              <span className="text-base font-black tabular-nums">{completion}%</span>
              <span className="text-[8px] font-bold text-cyan-50/65">{isEn ? 'TODAY' : 'اليوم'}</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#062C35]/35 p-3.5">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <p className="text-xs font-black">{isEn ? 'Your week in moments' : 'أسبوع طفلك في لحظات'}</p>
              <p className="mt-0.5 text-[10px] text-cyan-50/60">{isEn ? 'Saved moments by day — not a score or a target.' : 'عدد اللحظات المسجلة كل يوم، مش تقييم ولا سباق.'}</p>
            </div>
            <span className="rounded-lg bg-white/10 px-2 py-1 text-[10px] font-black">{activeDays}/7</span>
          </div>
          <div className="flex h-[82px] items-end justify-between gap-2" role="img" aria-label={isEn ? `${weekTotal} records across the last seven days` : `${weekTotal} تسجيل خلال آخر سبعة أيام`}>
            {week.map((day) => (
              <div key={day.key} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1.5">
                <span className="text-[9px] font-black tabular-nums text-cyan-50/75">{day.count || ''}</span>
                <div className="flex h-[54px] w-full items-end justify-center rounded-t-lg bg-white/[.07]">
                  <div
                    className={`w-full max-w-7 rounded-t-lg transition-all duration-700 ease-out ${day.isToday ? 'bg-[#70E7C3]' : 'bg-gradient-to-t from-cyan-500/55 to-cyan-200/80'}`}
                    style={{ height: day.count ? `${Math.max(12, (day.count / maxCount) * 100)}%` : '4px', opacity: day.count ? 1 : .35 }}
                  />
                </div>
                <span className={`text-[9px] font-bold ${day.isToday ? 'text-[#8AF0D0]' : 'text-cyan-50/55'}`}>{day.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            { key: 'sleep', label: isEn ? 'Sleep' : 'النوم', done: todayProgress.sleepLogged, emoji: '🌙' },
            { key: 'meal', label: isEn ? 'Food' : 'الأكل', done: todayProgress.mealLogged, emoji: '🥣' },
            { key: 'care', label: isEn ? 'Care' : 'الرعاية', done: todayProgress.careLogged, emoji: '🫧' },
          ].map((item) => (
            <div key={item.key} className={`rounded-xl border px-2 py-2 text-center transition-colors ${item.done ? 'border-emerald-200/25 bg-emerald-300/15' : 'border-white/10 bg-white/[.06]'}`}>
              <div className="text-base">{item.done ? '✓' : item.emoji}</div>
              <p className="mt-0.5 text-[10px] font-extrabold text-white/90">{item.label}</p>
              <p className="text-[9px] font-bold text-cyan-50/55">{item.done ? (isEn ? 'Saved' : 'اتسجل') : (isEn ? 'Not yet' : 'لسه')}</p>
            </div>
          ))}
        </div>

        <div data-testid="daily-care-journey" className="rounded-2xl border border-white/10 bg-white/[.06] p-3.5">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <p className="text-xs font-black">{isEn ? 'Today, one caring moment at a time' : 'رحلة رعاية النهارده.. خطوة بخطوة'}</p>
              <p className="mt-1 text-[10px] leading-relaxed text-cyan-50/65">{isEn ? 'A gentle overview of what has been recorded so far.' : 'نظرة بسيطة على اللي اتسجل لحد دلوقتي، من غير ضغط.'}</p>
            </div>
            <span className="rounded-xl border border-teal-200/20 bg-teal-200/10 px-2.5 py-1.5 text-xs font-black text-[#8AF0D0] tabular-nums">{completedEssentials}/3</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'sleep', icon: '🌙', label: isEn ? 'Rest' : 'راحة', detail: isEn ? 'Sleep' : 'النوم', done: todayProgress.sleepLogged },
              { id: 'meal', icon: '🥣', label: isEn ? 'Nourish' : 'تغذية', detail: isEn ? 'Meals' : 'الأكل', done: todayProgress.mealLogged },
              { id: 'care', icon: '💚', label: isEn ? 'Care' : 'اهتمام', detail: isEn ? 'Daily care' : 'الرعاية', done: todayProgress.careLogged },
            ].map((step, index) => (
              <div key={step.id} className={`relative min-w-0 rounded-xl border p-2 text-center transition-colors ${step.done ? 'border-[#8AF0D0]/35 bg-[#8AF0D0]/10' : 'border-white/10 bg-black/10'}`}>
                <span className="mx-auto grid h-8 w-8 place-items-center rounded-full bg-white/10 text-base">{step.done ? '✓' : step.icon}</span>
                <p className="mt-1.5 text-[10px] font-black">{isEn ? step.label : step.label}</p>
                <p className="mt-0.5 text-[9px] text-cyan-50/60">{step.done ? (isEn ? 'Recorded' : 'اتسجلت') : step.detail}</p>
                {index < 2 && <span aria-hidden="true" className={`absolute -end-2 top-5 z-10 h-px w-2 ${step.done ? 'bg-[#8AF0D0]/70' : 'bg-white/20'}`} />}
              </div>
            ))}
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-gradient-to-r from-teal-300 to-emerald-200 transition-all duration-700" style={{ width: `${completion}%` }} />
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            data-testid="home-daily-experience-log"
            onClick={onOpenDailyLog}
            className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl bg-[#8AF0D0] px-4 py-3 text-xs font-black text-[#07343B] shadow-lg shadow-black/10 transition duration-200 hover:-translate-y-0.5 hover:bg-[#A5F5DD] active:translate-y-0 active:scale-[.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0D4850]"
          >
            <ClipboardCheck size={16} />
            {isEn ? 'Add a moment to today' : 'سجّل لحظة من يومه'}
            <Arrow size={15} />
          </button>
          <button
            type="button"
            data-testid="home-daily-experience-mood"
            onClick={onOpenMood}
            className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[.08] px-4 py-3 text-xs font-extrabold text-white transition duration-200 hover:bg-white/[.14] active:scale-[.98]"
          >
            <Heart size={15} />
            {isEn ? 'How are they feeling?' : 'عامل إيه من جواه؟'}
          </button>
        </div>
        <p className="text-center text-[9px] font-medium leading-relaxed text-cyan-50/50">
          {isEn ? 'No streaks. No pressure. Every small moment matters.' : 'مفيش سباق ولا ضغط.. كل لحظة صغيرة ليها قيمة.'}
        </p>
      </div>
    </section>
  );
};

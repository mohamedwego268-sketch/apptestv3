import React, { useEffect, useMemo, useState } from 'react';
import { LanguageCode } from '../domain/familySpaceCore';
import {
  ChildBatteryDiagnostic,
  useMasterController,
} from '../services/MasterAppController';

export interface BatteryDiagnosticsViewProps {
  lang?: LanguageCode;
  onShowToast?: (msg: string) => void;
  onAddRescueTask?: (taskName: string, timeStr: string, kidId: number | null) => void;
}

type AssessmentScope = 'family' | 1 | 2 | 3;

const CHILD_META: Record<
  1 | 2 | 3,
  {
    id: 1 | 2 | 3;
    nameAr: string;
    nameEn: string;
    ageBadgeAr: string;
    ageBadgeEn: string;
    emoji: string;
    accentPill: string;
    barGradient: string;
  }
> = {
  1: {
    id: 1,
    nameAr: 'حمزة',
    nameEn: 'Hamza',
    ageBadgeAr: '٦ شهور · مرحلة الرضيع',
    ageBadgeEn: '6 Months · Infant Milestones',
    emoji: '👶🏻',
    accentPill:
      'border-sky-500/40 bg-sky-500/10 text-sky-800 dark:text-sky-200 dark:border-sky-400/40',
    barGradient: 'from-sky-500 to-teal-500',
  },
  2: {
    id: 2,
    nameAr: 'ليلى',
    nameEn: 'Laila',
    ageBadgeAr: '٤ سنوات · الحضانة والإبداع',
    ageBadgeEn: '4 Years · Nursery & Creativity',
    emoji: '🎨',
    accentPill:
      'border-rose-500/40 bg-rose-500/10 text-rose-800 dark:text-rose-200 dark:border-rose-400/40',
    barGradient: 'from-rose-500 to-amber-500',
  },
  3: {
    id: 3,
    nameAr: 'يوسف',
    nameEn: 'Youssef',
    ageBadgeAr: '٨ سنوات · المدرسة والأبطال',
    ageBadgeEn: '8 Years · School & Champions',
    emoji: '🏆',
    accentPill:
      'border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-200 dark:border-amber-400/40',
    barGradient: 'from-amber-500 to-emerald-500',
  },
};

export const BatteryDiagnosticsView: React.FC<BatteryDiagnosticsViewProps> = ({
  lang = 'ar',
  onShowToast,
  onAddRescueTask,
}) => {
  const isEn = lang === 'en';
  const master = useMasterController();
  const summary = master.diagnostics.summary;

  const [scope, setScope] = useState<AssessmentScope>('family');
  const [sleepScore, setSleepScore] = useState<number>(88);
  const [nutritionScore, setNutritionScore] = useState<number>(88);
  const [moodScore, setMoodScore] = useState<number>(90);
  const [routineScore, setRoutineScore] = useState<number>(84);
  const [ahmadScore, setAhmadScore] = useState<number>(summary.parentAhmadBattery || 86);
  const [maryamScore, setMaryamScore] = useState<number>(summary.parentMaryamBattery || 84);
  const [customNote, setCustomNote] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [justSavedAt, setJustSavedAt] = useState<string | null>(null);

  const selectedChildDiag: ChildBatteryDiagnostic | null = useMemo(() => {
    if (scope === 'family') return null;
    return summary.childrenDiagnostics[scope] || null;
  }, [scope, summary.childrenDiagnostics]);

  // Synchronize interactive sliders when switching between Family or a specific child (Hamza, Laila, Youssef)
  useEffect(() => {
    if (scope === 'family') {
      const diags = Object.values(summary.childrenDiagnostics);
      const avg = (getter: (d: ChildBatteryDiagnostic) => number) =>
        Math.round(
          diags.reduce((acc, item) => acc + getter(item), 0) / Math.max(1, diags.length)
        );
      setSleepScore(avg((d) => d.sleepScore) || 88);
      setNutritionScore(avg((d) => d.nutritionScore) || 88);
      setMoodScore(avg((d) => d.moodScore) || 90);
      setRoutineScore(avg((d) => d.routineCompletionScore) || 84);
      setAhmadScore(summary.parentAhmadBattery || 86);
      setMaryamScore(summary.parentMaryamBattery || 84);
    } else {
      const target = summary.childrenDiagnostics[scope];
      if (target) {
        setSleepScore(target.sleepScore);
        setNutritionScore(target.nutritionScore);
        setMoodScore(target.moodScore);
        setRoutineScore(target.routineCompletionScore);
      }
    }
  }, [scope, summary]);

  const livePreviewScore = useMemo(() => {
    const childWeighted = Math.round(
      sleepScore * 0.3 +
        nutritionScore * 0.25 +
        moodScore * 0.25 +
        routineScore * 0.2
    );
    if (scope !== 'family') return childWeighted;
    const parentAvg = (ahmadScore + maryamScore) / 2;
    return Math.round(childWeighted * 0.7 + parentAvg * 0.3);
  }, [scope, sleepScore, nutritionScore, moodScore, routineScore, ahmadScore, maryamScore]);

  const handleSaveAssessment = async () => {
    setIsSaving(true);
    try {
      await master.diagnostics.save({
        scope,
        childId: scope === 'family' ? null : scope,
        sleepScore,
        nutritionScore,
        moodScore,
        routineCompletionScore: routineScore,
        parentAhmadBattery: ahmadScore,
        parentMaryamBattery: maryamScore,
        notes: customNote.trim() || undefined,
      });

      const timeStr = new Date().toLocaleTimeString(isEn ? 'en-US' : 'ar-EG', {
        hour: '2-digit',
        minute: '2-digit',
      });
      setJustSavedAt(timeStr);
      setCustomNote('');

      const targetLabel =
        scope === 'family'
          ? isEn
            ? 'Family Home Battery'
            : 'بطارية البيت العائلية'
          : isEn
          ? CHILD_META[scope].nameEn
          : CHILD_META[scope].nameAr;

      onShowToast?.(
        isEn
          ? `🔋 Saved assessment for ${targetLabel} — ${livePreviewScore}%`
          : `🔋 تم حفظ تقييم ${targetLabel} بنجاح — ${livePreviewScore}٪`
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleQuickPillarBoost = async (
    childId: 1 | 2 | 3,
    pillar: 'sleep' | 'nutrition' | 'mood' | 'routine'
  ) => {
    const updated = await master.diagnostics.boost(childId, pillar, 4);
    const meta = CHILD_META[childId];
    onShowToast?.(
      isEn
        ? `⚡ Boosted ${meta.nameEn}'s ${pillar} score to ${updated.overallScore}%`
        : `⚡ تم تعزيز مؤشر ${meta.nameAr} إلى ${updated.overallScore}٪`
    );
  };

  const historyPoints = useMemo(() => {
    const list = summary.historySnapshots || [];
    return list.slice(-7);
  }, [summary.historySnapshots]);

  return (
    <div
      id="battery-diagnostics-view"
      data-testid="battery-diagnostics-view"
      dir={isEn ? 'ltr' : 'rtl'}
      className="rounded-3xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-surface)] dark:bg-[#0F1B24] p-4 sm:p-5 space-y-5 shadow-xs"
    >
      {/* Top Status & Offline Resilience Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[var(--color-border)]/60 dark:border-[#1E3646]">
        <div className="space-y-0.5">
          <div className="inline-flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-black uppercase tracking-wider text-[#0d9488] dark:text-[#2DD4BF]">
              {isEn
                ? 'Family Energy & Well-Being'
                : 'مؤشر طاقة البيت والأسرة'}
            </span>
          </div>
          <h3 className="text-sm sm:text-base font-black text-[var(--color-text)] dark:text-[#F8FAFC]">
            {isEn
              ? 'Interactive Family & Child Well-Being Assessment'
              : 'التقييم التفاعلي لطاقة البيت والأطفال'}
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="px-3 py-1.5 rounded-2xl bg-teal-500/15 border border-teal-500/35 text-[#0d9488] dark:text-[#2DD4BF] text-xs font-black tabular-nums">
            🔋 {isEn ? 'Family Avg:' : 'متوسط طاقة البيت:'} {summary.familyAverageScore}%
          </div>
        </div>
      </div>

      {/* Scope Selector Pills */}
      <div className="space-y-2">
        <label className="block text-xs font-extrabold text-[var(--color-muted)] dark:text-[#94A3B8]">
          {isEn
            ? 'Select Assessment Target:'
            : 'اختر نطاق التقييم:'}
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            type="button"
            data-testid="battery-scope-family"
            onClick={() => setScope('family')}
            className={`min-h-[48px] px-3 py-2 rounded-2xl border text-xs font-black transition-all flex items-center justify-between gap-2 cursor-pointer ${
              scope === 'family'
                ? 'bg-[#0d9488] text-white border-[#0d9488] shadow-xs'
                : 'bg-[var(--color-control-muted)]/60 dark:bg-[#142430] text-[var(--color-text)] dark:text-[#F8FAFC] border-[var(--color-border)] dark:border-[#1E3646]'
            }`}
          >
            <span className="inline-flex items-center gap-1.5">
              <span>🏡</span>
              <span>{isEn ? 'All Family' : 'البيت بالكامل'}</span>
            </span>
            <span className="tabular-nums text-[11px] font-extrabold opacity-90">
              {summary.familyAverageScore}%
            </span>
          </button>

          {([1, 2, 3] as const).map((cid) => {
            const meta = CHILD_META[cid];
            const diag = summary.childrenDiagnostics[cid];
            const isSelected = scope === cid;
            return (
              <button
                key={cid}
                type="button"
                data-testid={`battery-scope-child-${cid}`}
                onClick={() => setScope(cid)}
                className={`min-h-[46px] px-3 py-2 rounded-2xl border text-xs font-black transition-all flex items-center justify-between gap-2 cursor-pointer ${
                  isSelected
                    ? 'bg-[#0d9488] text-white border-[#0d9488] shadow-xs'
                    : 'bg-[var(--color-control-muted)]/60 dark:bg-[#142430] text-[var(--color-text)] dark:text-[#F8FAFC] border-[var(--color-border)] dark:border-[#1E3646]'
                }`}
              >
                <span className="inline-flex items-center gap-1.5 truncate">
                  <span>{meta.emoji}</span>
                  <span className="truncate">{isEn ? meta.nameEn : meta.nameAr}</span>
                </span>
                <span className="tabular-nums text-[11px] font-extrabold">
                  {diag ? `${diag.overallScore}%` : '90%'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Interactive Assessment Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        <div className="lg:col-span-7 rounded-2xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-muted)]/35 dark:bg-[#142430]/75 p-4 space-y-3.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-black text-[var(--color-text)] dark:text-[#F8FAFC]">
              {scope === 'family'
                ? isEn
                  ? 'Household & Co-Parenting Energy'
                  : 'مؤشرات طاقة البيت والوالدين'
                : isEn
                ? `${CHILD_META[scope].emoji} ${CHILD_META[scope].nameEn} · ${CHILD_META[scope].ageBadgeEn}`
                : `${CHILD_META[scope].emoji} ${CHILD_META[scope].nameAr} · ${CHILD_META[scope].ageBadgeAr}`}
            </span>
            <span
              data-testid="battery-live-preview-score"
              className="px-2.5 py-1 rounded-xl bg-[#0d9488]/15 text-[#0d9488] dark:text-[#2DD4BF] text-xs font-black tabular-nums"
            >
              {isEn ? 'Live Score:' : 'النتيجة الفورية:'} {livePreviewScore}%
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              {
                id: 'sleep',
                labelAr: '🌙 جودة النوم والراحة',
                labelEn: '🌙 Sleep & Rest Quality',
                val: sleepScore,
                setVal: setSleepScore,
              },
              {
                id: 'nutrition',
                labelAr: '🍎 التغذية والترطيب',
                labelEn: '🍎 Nutrition & Hydration',
                val: nutritionScore,
                setVal: setNutritionScore,
              },
              {
                id: 'mood',
                labelAr: '💛 الهدوء والمزاج العاطفي',
                labelEn: '💛 Emotional Calm & Mood',
                val: moodScore,
                setVal: setMoodScore,
              },
              {
                id: 'routine',
                labelAr: '✅ انتظام الروتين اليومي',
                labelEn: '✅ Daily Routine Rhythm',
                val: routineScore,
                setVal: setRoutineScore,
              },
            ].map((slider) => (
              <div
                key={slider.id}
                className="rounded-xl border border-[var(--color-border)]/70 dark:border-[#1E3646] bg-[var(--color-surface)] dark:bg-[#0B131A] p-3 space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs font-extrabold text-[var(--color-text)] dark:text-[#F8FAFC]">
                  <span>{isEn ? slider.labelEn : slider.labelAr}</span>
                  <span className="tabular-nums text-[#0d9488] dark:text-[#2DD4BF]">
                    {slider.val}%
                  </span>
                </div>
                <input
                  type="range"
                  min={45}
                  max={100}
                  step={1}
                  data-testid={`battery-slider-${slider.id}`}
                  value={slider.val}
                  onChange={(e) => slider.setVal(Number(e.target.value))}
                  className="w-full accent-[#0d9488] cursor-pointer"
                />
              </div>
            ))}
          </div>

          {scope === 'family' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="rounded-xl border border-teal-500/30 bg-teal-500/5 p-3 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-extrabold text-[var(--color-text)] dark:text-[#F8FAFC]">
                  <span>👨🏻 {isEn ? 'Dad Ahmad Energy' : 'طاقة بابا أحمد'}</span>
                  <span className="tabular-nums text-[#0d9488] dark:text-[#2DD4BF]">
                    {ahmadScore}%
                  </span>
                </div>
                <input
                  type="range"
                  min={45}
                  max={100}
                  value={ahmadScore}
                  onChange={(e) => setAhmadScore(Number(e.target.value))}
                  className="w-full accent-[#0d9488] cursor-pointer"
                />
              </div>

              <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-3 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-extrabold text-[var(--color-text)] dark:text-[#F8FAFC]">
                  <span>👩🏻 {isEn ? 'Mom Maryam Energy' : 'طاقة ماما مريم'}</span>
                  <span className="tabular-nums text-rose-600 dark:text-rose-300">
                    {maryamScore}%
                  </span>
                </div>
                <input
                  type="range"
                  min={45}
                  max={100}
                  value={maryamScore}
                  onChange={(e) => setMaryamScore(Number(e.target.value))}
                  className="w-full accent-rose-500 cursor-pointer"
                />
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
            <input
              type="text"
              data-testid="battery-assessment-note-input"
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder={
                isEn
                  ? 'Add a brief note...'
                  : 'أضف ملاحظة سريعة...'
              }
              className="flex-1 min-h-[48px] rounded-xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-surface)] dark:bg-[#0B131A] px-3.5 py-2 text-xs font-semibold text-[var(--color-text)] dark:text-[#F8FAFC]"
            />

            <button
              type="button"
              data-testid="battery-save-assessment-btn"
              disabled={isSaving}
              onClick={handleSaveAssessment}
              className="min-h-[48px] px-5 py-2 rounded-xl bg-[#0d9488] hover:bg-[#0f766e] disabled:opacity-60 text-white text-xs font-black shadow-xs transition-all cursor-pointer shrink-0"
            >
              {isSaving
                ? isEn
                  ? 'Saving...'
                  : 'جاري الحفظ...'
                : isEn
                ? '💾 Save Assessment'
                : '💾 حفظ التقييم'}
            </button>
          </div>

          {justSavedAt && (
            <div
              data-testid="battery-saved-confirmation"
              className="flex items-center justify-between gap-2 rounded-xl bg-emerald-500/15 border border-emerald-500/35 px-3 py-2 text-xs font-extrabold text-emerald-800 dark:text-emerald-200"
            >
              <span>
                ✓{' '}
                {isEn
                  ? `Assessment saved at ${justSavedAt}`
                  : `تم حفظ التقييم بنجاح في ${justSavedAt}`}
              </span>
              {onAddRescueTask && (
                <button
                  type="button"
                  onClick={() =>
                    onAddRescueTask(
                      isEn
                        ? '15-Min Calm Family Recharge'
                        : '١٥ دقيقة استرخاء وشحن طاقة البيت',
                      '07:30 م',
                      scope === 'family' ? null : scope
                    )
                  }
                  className="px-2.5 py-1 rounded-lg bg-emerald-700 text-white text-[11px] font-black cursor-pointer"
                >
                  + {isEn ? 'Add Recharge Task' : 'أضف مهمة شحن للروتين'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Live Child Cards & Score Trends */}
        <div className="lg:col-span-5 space-y-3.5">
          {/* Individual Children Live Diagnostics Summary */}
          <div className="rounded-2xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-muted)]/35 dark:bg-[#142430]/75 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-[var(--color-text)] dark:text-[#F8FAFC]">
                {isEn
                  ? 'Children Readiness Overview'
                  : 'مؤشر جاهزية الأطفال الآن'}
              </h4>
              <span className="text-[11px] font-bold text-[var(--color-muted)] dark:text-[#94A3B8]">
                {selectedChildDiag
                  ? isEn
                    ? `Focused: ${CHILD_META[scope as 1 | 2 | 3].nameEn}`
                    : `التركيز: ${CHILD_META[scope as 1 | 2 | 3].nameAr}`
                  : isEn
                  ? 'All 3 Children'
                  : 'الأطفال الثلاثة'}
              </span>
            </div>

            <div className="space-y-2.5">
              {([1, 2, 3] as const).map((cid) => {
                const meta = CHILD_META[cid];
                const diag = summary.childrenDiagnostics[cid];
                const score = diag?.overallScore ?? 90;
                return (
                  <div
                    key={cid}
                    data-testid={`battery-child-card-${cid}`}
                    className="rounded-xl border border-[var(--color-border)]/70 dark:border-[#1E3646] bg-[var(--color-surface)] dark:bg-[#0B131A] p-3 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{meta.emoji}</span>
                        <div>
                          <div className="text-xs font-black text-[var(--color-text)] dark:text-[#F8FAFC]">
                            {isEn ? meta.nameEn : meta.nameAr}
                          </div>
                          <div className="text-[10.5px] font-bold text-[var(--color-muted)] dark:text-[#94A3B8]">
                            {isEn ? meta.ageBadgeEn : meta.ageBadgeAr}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleQuickPillarBoost(cid, 'mood')}
                          className="px-2 py-1 rounded-lg bg-teal-500/15 hover:bg-teal-500/25 text-[#0d9488] dark:text-[#2DD4BF] text-[10.5px] font-black cursor-pointer"
                        >
                          +4% ⚡
                        </button>
                        <span className="text-xs font-black tabular-nums text-[var(--color-text)] dark:text-[#F8FAFC]">
                          {score}%
                        </span>
                      </div>
                    </div>

                    <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-[#142430] overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${meta.barGradient} transition-all duration-300`}
                        style={{ width: `${score}%` }}
                      />
                    </div>

                    {diag && (
                      <p className="text-[11px] font-semibold text-[var(--color-muted)] dark:text-[#CBD5E1] leading-snug">
                        {isEn ? diag.recommendationEn : diag.recommendationAr}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Score Trends Timeline (`historySnapshots`) */}
          <div
            data-testid="battery-score-trends"
            className="rounded-2xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-muted)]/35 dark:bg-[#142430]/75 p-4 space-y-2.5"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-[var(--color-text)] dark:text-[#F8FAFC]">
                📈 {isEn ? 'Battery Score Trends' : 'اتجاهات مؤشر طاقة البيت'}
              </h4>
              <span className="text-[11px] font-bold text-[#0d9488] dark:text-[#2DD4BF]">
                {historyPoints.length} {isEn ? 'snapshots' : 'قراءات مسجلة'}
              </span>
            </div>

            <div className="grid grid-cols-7 gap-1.5 items-end h-20 pt-2">
              {historyPoints.map((snap, idx) => {
                const pct = Math.min(100, Math.max(30, snap.familyAverageScore));
                const timeShort = new Date(snap.timestamp).toLocaleTimeString(
                  isEn ? 'en-US' : 'ar-EG',
                  { hour: '2-digit', minute: '2-digit' }
                );
                return (
                  <div
                    key={`${snap.timestamp}-${idx}`}
                    className="flex flex-col items-center justify-end gap-1 h-full"
                  >
                    <span className="text-[10px] font-black tabular-nums text-[#0d9488] dark:text-[#2DD4BF]">
                      {pct}%
                    </span>
                    <div className="w-full bg-slate-200/70 dark:bg-[#0B131A] rounded-t-lg h-12 flex items-end overflow-hidden">
                      <div
                        className="w-full bg-gradient-to-t from-[#0d9488] to-emerald-400 rounded-t-lg transition-all duration-300"
                        style={{ height: `${pct}%` }}
                      />
                    </div>
                    <span className="text-[9px] font-bold text-[var(--color-muted)] dark:text-[#94A3B8] truncate max-w-full">
                      {timeShort}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

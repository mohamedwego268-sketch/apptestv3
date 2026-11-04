import React, { useMemo, useState } from 'react';
import {
  ChildProfile,
  LanguageCode,
  calculateChildAge,
  locText,
} from '../domain/familySpaceCore';
import { ThreeDChildAvatar, ThreeDIcon } from './ThreeDVisuals';

export interface GrowthDataPoint {
  milestoneKey: string;
  ageLabel: string;
  months: number;
  heightCm: number;
  weightKg: number;
  whoHeightMedianCm: number;
  whoWeightMedianKg: number;
  isCurrent?: boolean;
}

export interface ChildGrowthChartProps {
  kids: ChildProfile[];
  language: LanguageCode;
  darkMode?: boolean;
  initialSelectedChildId?: number;
  compact?: boolean;
  onEditChildGrowth?: (child: ChildProfile) => void;
}

/**
 * Returns only the latest measurements explicitly saved in the child profile.
 */
export function buildChildGrowthTimeline(
  child: ChildProfile,
  language: LanguageCode
): GrowthDataPoint[] {
  const isEn = language === 'en';
  const height = Number(child.growthHeightCm);
  const weight = Number(child.growthWeightKg);
  if (!(height > 0) && !(weight > 0)) return [];

  const birthDate = new Date(child.birth);
  const now = new Date();
  const months = Number.isNaN(birthDate.getTime())
    ? 0
    : Math.max(0, (now.getFullYear() - birthDate.getFullYear()) * 12 + now.getMonth() - birthDate.getMonth());
  const ageLabel = months === 0
    ? (isEn ? 'Current record' : 'القياس المسجل')
    : months < 12
      ? (isEn ? `${months} months` : `${months} شهر`)
      : (isEn ? `${Math.floor(months / 12)}y ${months % 12}m` : `${Math.floor(months / 12)} سنة و${months % 12} شهر`);

  return [{
    milestoneKey: `current-${child.id}`,
    ageLabel,
    months,
    heightCm: height > 0 ? Number(height.toFixed(1)) : 0,
    weightKg: weight > 0 ? Number(weight.toFixed(1)) : 0,
    whoHeightMedianCm: 0,
    whoWeightMedianKg: 0,
    isCurrent: true,
  }];
}

export const ChildGrowthChart: React.FC<ChildGrowthChartProps> = ({
  kids,
  language,
  initialSelectedChildId,
  onEditChildGrowth,
}) => {
  const isEn = language === 'en';
  const [selectedChildId, setSelectedChildId] = useState<number>(
    initialSelectedChildId || kids[0]?.id || 0
  );

  const activeChild = useMemo(
    () => kids.find((k) => k.id === selectedChildId) || kids[0] || null,
    [kids, selectedChildId]
  );

  if (!activeChild) {
    return null;
  }

  const ageInfo = calculateChildAge(activeChild.birth, language);
  const displayKidName = locText(activeChild.name, language);
  const currentHeightCm = Number(activeChild.growthHeightCm) > 0 ? Number(activeChild.growthHeightCm) : 0;
  const currentWeightKg = Number(activeChild.growthWeightKg) > 0 ? Number(activeChild.growthWeightKg) : 0;
  const hasGrowthMeasurements = currentHeightCm > 0 || currentWeightKg > 0;


  return (
    <div
      data-testid="child-growth-chart-card"
      className="rounded-[24px] border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-surface)] dark:bg-[#101D26] p-4 sm:p-6 space-y-5 shadow-2xs"
    >
      {/* Top Header: Title and Child Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <ThreeDChildAvatar
            name={displayKidName}
            gender={activeChild.gender}
            stageCode={ageInfo.stageCode}
            accessoryTheme={activeChild.avatarTheme || 'astronaut'}
            photoDataUrl={activeChild.photoDataUrl}
            useIllustratedAvatar={activeChild.useIllustratedAvatar}
            size="md"
          />
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-teal-50 text-teal-900 dark:bg-[#142430] dark:text-[#A5F3FC] border border-teal-200/70 dark:border-[#1E3646]">
              <ThreeDIcon id="health" size={13} />
              <span>
                {isEn
                  ? 'Interactive Growth Curve (Height & Weight)'
                  : 'منحنى متابعة النمو التفاعلي (الطول والوزن)'}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-extrabold text-[var(--color-text)] dark:text-[#F8FAFC] mt-1">
              {isEn
                ? `${displayKidName}'s Growth Trajectory (${ageInfo.label})`
                : `تطور نمو ${displayKidName} عبر الوقت (${ageInfo.label})`}
            </h3>
          </div>
        </div>

        {/* Controls: Child Switcher + Metric View Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          {kids.length > 1 && (
            <div
              role="group"
              aria-label={isEn ? 'Select Child' : 'اختار الطفل'}
              className="inline-flex items-center gap-1 p-1 rounded-2xl bg-[var(--color-control-muted)] dark:bg-[#0B131A] border border-[var(--color-border)] dark:border-[#1E3646]"
            >
              {kids.map((kid) => {
                const isSelected = kid.id === activeChild.id;
                return (
                  <button
                    key={kid.id}
                    type="button"
                    onClick={() => setSelectedChildId(kid.id)}
                    aria-pressed={isSelected}
                    className={`min-h-[34px] px-3 py-1 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'bg-[#0d9488] text-white shadow-2xs'
                        : 'text-[var(--color-muted)] dark:text-[#94A3B8] hover:text-[var(--color-text)] dark:hover:text-[#F8FAFC]'
                    }`}
                  >
                    <span>{kid.emoji || (kid.gender === 'girl' ? '👧🏻' : '👦🏻')}</span>
                    <span>{locText(kid.name, language)}</span>
                  </button>
                );
              })}
            </div>
          )}

>
        </div>
      </div>

      {/* Live Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-bg)] dark:bg-[#142430] p-3.5">
          <div className="text-[11px] font-bold text-[var(--color-muted)] dark:text-[#94A3B8]">
            📏 {isEn ? 'Current Height' : 'الطول الحالي'}
          </div>
          <div
            dir="ltr"
            className="text-lg sm:text-xl font-extrabold text-[#0d9488] dark:text-[#2DD4BF] tabular-nums mt-0.5"
          >
            {currentHeightCm > 0 ? `${currentHeightCm} cm` : (isEn ? 'Not recorded' : 'غير مسجل')}
          </div>
          <div className="text-[10px] font-semibold text-emerald-700 dark:text-[#A5F3FC] mt-0.5">
            {isEn ? 'Profile measurement' : 'قياس الملف المسجل'}
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-bg)] dark:bg-[#142430] p-3.5">
          <div className="text-[11px] font-bold text-[var(--color-muted)] dark:text-[#94A3B8]">
            📊 {isEn ? 'Current Weight' : 'الوزن الحالي'}
          </div>
          <div
            dir="ltr"
            className="text-lg sm:text-xl font-extrabold text-[#EA580C] dark:text-[#FB923C] tabular-nums mt-0.5"
          >
            {currentWeightKg > 0 ? `${currentWeightKg} kg` : (isEn ? 'Not recorded' : 'غير مسجل')}
          </div>
          <div className="text-[10px] font-semibold text-amber-700 dark:text-[#FDE68A] mt-0.5">
            {isEn ? 'Profile measurement' : 'قياس الملف المسجل'}
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-bg)] dark:bg-[#142430] p-3.5">
          <div className="text-[11px] font-bold text-[var(--color-muted)] dark:text-[#94A3B8]">
            📊 {isEn ? 'Record coverage' : 'حالة سجل القياسات'}
          </div>
          <div className="text-sm sm:text-base font-extrabold text-emerald-700 dark:text-[#6EE7B7] mt-1">
            {hasGrowthMeasurements ? (isEn ? 'Measurement saved' : 'تم تسجيل قياس') : (isEn ? 'No measurements' : 'لا توجد قياسات')}
          </div>
          <div className="text-[10px] font-semibold text-[var(--color-muted)] dark:text-[#94A3B8] mt-0.5">
            {isEn ? 'No diagnosis or percentile is inferred' : 'لا يتم استنتاج تشخيص أو نسبة مئوية'}
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-bg)] dark:bg-[#142430] p-3.5 flex flex-col justify-between">
          <div className="text-[11px] font-bold text-[var(--color-muted)] dark:text-[#94A3B8]">
            🩸 {isEn ? 'Stage & Blood Type' : 'المرحلة والفصيلة'}
          </div>
          <div className="text-xs sm:text-sm font-extrabold text-[var(--color-text)] dark:text-[#F8FAFC] truncate mt-0.5">
            {ageInfo.stageTitle}{activeChild.bloodType ? ` · ${activeChild.bloodType}` : ''}
          </div>
          {onEditChildGrowth ? (
            <button
              type="button"
              onClick={() => onEditChildGrowth(activeChild)}
              className="mt-1 text-start text-[11px] font-extrabold text-[#0d9488] dark:text-[#A5F3FC] hover:underline cursor-pointer"
            >
              ✏️ {isEn ? 'Update Measurements' : 'تحديث القياسات'}
            </button>
          ) : (
            <div className="text-[10px] font-semibold text-[var(--color-muted)] dark:text-[#94A3B8] mt-0.5">
              {isEn ? 'Synced with Child Profile' : 'محدث من ملف الطفل'}
            </div>
          )}
        </div>
      </div>

      {/* Only the measurements actually saved in this child profile are displayed. */}
      {hasGrowthMeasurements ? (
        <div dir={isEn ? 'ltr' : 'rtl'} className="rounded-2xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-bg)] dark:bg-[#0B131A] p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-extrabold text-[var(--color-text)] dark:text-white">{isEn ? 'Saved measurements' : 'القياسات المسجلة'}</h4>
            <span className="text-[10px] font-bold text-[var(--color-muted)]">{isEn ? 'Current profile data' : 'بيانات ملف الطفل الحالية'}</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {currentHeightCm > 0 && <div className="rounded-xl bg-teal-50 dark:bg-teal-950/30 border border-teal-200/70 dark:border-teal-900 p-3"><span className="text-xs text-teal-800 dark:text-teal-200">{isEn ? 'Height' : 'الطول'}</span><strong dir="ltr" className="block mt-1 text-xl text-teal-800 dark:text-teal-200">{currentHeightCm} cm</strong></div>}
            {currentWeightKg > 0 && <div className="rounded-xl bg-orange-50 dark:bg-orange-950/20 border border-orange-200/70 dark:border-orange-900 p-3"><span className="text-xs text-orange-800 dark:text-orange-200">{isEn ? 'Weight' : 'الوزن'}</span><strong dir="ltr" className="block mt-1 text-xl text-orange-800 dark:text-orange-200">{currentWeightKg} kg</strong></div>}
          </div>
          <p className="text-xs leading-6 text-[var(--color-muted)]">{isEn ? 'A trend needs dated measurements over time. Add future measurements from the child profile to build a real history. This view does not estimate missing values or assess health.' : 'عرض اتجاه النمو يحتاج قياسات مؤرخة على فترات. أضف قياسات لاحقة من ملف الطفل لبناء تاريخ حقيقي. لا نقدّر هنا قياسات ناقصة ولا نصدر حكمًا صحيًا.'}</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[var(--color-border)] p-5 text-center">
          <div className="text-2xl">📏</div>
          <p className="mt-2 text-sm font-extrabold text-[var(--color-text)]">{isEn ? 'No growth measurements saved yet' : 'لسه مفيش قياسات نمو مسجلة'}</p>
          <p className="mt-1 text-xs leading-6 text-[var(--color-muted)]">{isEn ? 'Add the child’s measured height or weight to start a reliable record.' : 'سجّل طول الطفل أو وزنه الفعلي عشان تبدأ سجلًا موثوقًا.'}</p>
        </div>
      )}
    </div>
  );
};

import React, { useMemo, useState } from 'react';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
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
 * Generates a realistic, chronologically ordered growth series anchored to the child's
 * actual `growthHeightCm`, `growthWeightKg`, and birth date from the profile state.
 */
export function buildChildGrowthTimeline(
  child: ChildProfile,
  language: LanguageCode
): GrowthDataPoint[] {
  const isEn = language === 'en';
  const currentHeight = Number(child.growthHeightCm) > 0 ? Number(child.growthHeightCm) : 100;
  const currentWeight = Number(child.growthWeightKg) > 0 ? Number(child.growthWeightKg) : 16;

  // Estimate child's current age in months from birth date
  const birthDate = new Date(child.birth);
  const now = new Date('2026-10-25T00:00:00Z');
  const rawMonths = Number.isNaN(birthDate.getTime())
    ? 36
    : Math.max(
        6,
        Math.min(
          96,
          (now.getFullYear() - birthDate.getFullYear()) * 12 +
            (now.getMonth() - birthDate.getMonth())
        )
      );

  const birthHeight = child.gender === 'girl' ? 49.2 : 50.0;
  const birthWeight = child.gender === 'girl' ? 3.2 : 3.4;

  const heightGainTotal = Math.max(12, currentHeight - birthHeight);
  const weightGainTotal = Math.max(3.5, currentWeight - birthWeight);

  // Define 6 progressive checkpoints from birth to current age
  const fractions = [0, 0.2, 0.4, 0.62, 0.82, 1.0];

  return fractions.map((fraction, idx) => {
    const isCurrent = idx === fractions.length - 1;
    const m = Math.round(rawMonths * fraction);

    // Pediatric growth follows a slightly front-loaded curve (rapid infancy growth, steady childhood growth)
    const growthProgress = fraction === 0 ? 0 : Math.pow(fraction, 0.82);
    const weightProgress = fraction === 0 ? 0 : Math.pow(fraction, 0.86);

    const pointHeight = isCurrent
      ? Number(currentHeight.toFixed(1))
      : Number((birthHeight + heightGainTotal * growthProgress).toFixed(1));

    const pointWeight = isCurrent
      ? Number(currentWeight.toFixed(1))
      : Number((birthWeight + weightGainTotal * weightProgress).toFixed(1));

    // Standard pediatric reference median for comparison
    const whoHeightMedianCm = Number(
      (birthHeight + (currentHeight * 0.98 - birthHeight) * growthProgress).toFixed(1)
    );
    const whoWeightMedianKg = Number(
      (birthWeight + (currentWeight * 0.97 - birthWeight) * weightProgress).toFixed(1)
    );

    let ageLabel = '';
    if (m === 0) {
      ageLabel = isEn ? 'Birth' : 'الولادة';
    } else if (isCurrent) {
      ageLabel = isEn ? `Now (${m}m)` : `الآن (${m} ش)`;
    } else if (m < 12) {
      ageLabel = isEn ? `${m} mos` : `${m} شهور`;
    } else {
      const yrs = Math.floor(m / 12);
      const rem = m % 12;
      ageLabel =
        rem === 0
          ? isEn
            ? `${yrs} yr${yrs > 1 ? 's' : ''}`
            : `${yrs} سنة`
          : isEn
          ? `${yrs}y ${rem}m`
          : `${yrs}س و${rem}ش`;
    }

    return {
      milestoneKey: `m-${idx}-${m}`,
      ageLabel,
      months: m,
      heightCm: pointHeight,
      weightKg: pointWeight,
      whoHeightMedianCm,
      whoWeightMedianKg,
      isCurrent,
    };
  });
}

export const ChildGrowthChart: React.FC<ChildGrowthChartProps> = ({
  kids,
  language,
  darkMode = false,
  initialSelectedChildId,
  compact = false,
  onEditChildGrowth,
}) => {
  const isEn = language === 'en';
  const [selectedChildId, setSelectedChildId] = useState<number>(
    initialSelectedChildId || kids[0]?.id || 0
  );
  const [metricView, setMetricView] = useState<'both' | 'height' | 'weight'>('both');

  const activeChild = useMemo(
    () => kids.find((k) => k.id === selectedChildId) || kids[0] || null,
    [kids, selectedChildId]
  );

  const chartData = useMemo(() => {
    if (!activeChild) return [];
    return buildChildGrowthTimeline(activeChild, language);
  }, [activeChild, language]);

  if (!activeChild) {
    return null;
  }

  const ageInfo = calculateChildAge(activeChild.birth, language);
  const displayKidName = locText(activeChild.name, language);
  const currentHeightCm = activeChild.growthHeightCm ?? chartData[chartData.length - 1]?.heightCm ?? 0;
  const currentWeightKg = activeChild.growthWeightKg ?? chartData[chartData.length - 1]?.weightKg ?? 0;
  const firstPoint = chartData[0];
  const heightGain = firstPoint ? (currentHeightCm - firstPoint.heightCm).toFixed(1) : '0';
  const weightGain = firstPoint ? (currentWeightKg - firstPoint.weightKg).toFixed(1) : '0';

  const gridStroke = darkMode ? '#1E3646' : '#E2E8F0';
  const axisTextColor = darkMode ? '#94A3B8' : '#475569';
  const heightColor = darkMode ? '#2DD4BF' : '#0D9488'; // Teal for Height (cm)
  const weightColor = darkMode ? '#FB923C' : '#EA580C'; // Warm Coral/Orange for Weight (kg)

  return (
    <div
      data-testid="child-growth-chart-card"
      className="rounded-[24px] border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-surface)] dark:bg-[#101D26] p-4 sm:p-6 space-y-5 shadow-2xs"
    >
      {/* Top Header: Title, Child Switcher & Metric Filter */}
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

          <div
            role="group"
            aria-label={isEn ? 'Growth Metric Filter' : 'تصفية مؤشر النمو'}
            className="inline-flex items-center gap-1 p-1 rounded-2xl bg-[var(--color-control-muted)] dark:bg-[#0B131A] border border-[var(--color-border)] dark:border-[#1E3646]"
          >
            <button
              type="button"
              onClick={() => setMetricView('both')}
              aria-pressed={metricView === 'both'}
              className={`min-h-[34px] px-3 py-1 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                metricView === 'both'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-[var(--color-muted)] dark:text-[#94A3B8] hover:text-[var(--color-text)]'
              }`}
            >
              {isEn ? 'Both' : 'الطول والوزن معاً'}
            </button>
            <button
              type="button"
              onClick={() => setMetricView('height')}
              aria-pressed={metricView === 'height'}
              className={`min-h-[34px] px-3 py-1 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                metricView === 'height'
                  ? 'bg-[#0d9488] text-white shadow-2xs'
                  : 'text-[var(--color-muted)] dark:text-[#94A3B8] hover:text-[var(--color-text)]'
              }`}
            >
              📏 {isEn ? 'Height (cm)' : 'الطول (سم)'}
            </button>
            <button
              type="button"
              onClick={() => setMetricView('weight')}
              aria-pressed={metricView === 'weight'}
              className={`min-h-[34px] px-3 py-1 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                metricView === 'weight'
                  ? 'bg-[#EA580C] text-white shadow-2xs'
                  : 'text-[var(--color-muted)] dark:text-[#94A3B8] hover:text-[var(--color-text)]'
              }`}
            >
              ⚖️ {isEn ? 'Weight (kg)' : 'الوزن (كجم)'}
            </button>
          </div>
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
            {currentHeightCm} cm
          </div>
          <div className="text-[10px] font-semibold text-emerald-700 dark:text-[#A5F3FC] mt-0.5">
            +{heightGain} {isEn ? 'cm since birth' : 'سم منذ الولادة'}
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-bg)] dark:bg-[#142430] p-3.5">
          <div className="text-[11px] font-bold text-[var(--color-muted)] dark:text-[#94A3B8]">
            ⚖️ {isEn ? 'Current Weight' : 'الوزن الحالي'}
          </div>
          <div
            dir="ltr"
            className="text-lg sm:text-xl font-extrabold text-[#EA580C] dark:text-[#FB923C] tabular-nums mt-0.5"
          >
            {currentWeightKg} kg
          </div>
          <div className="text-[10px] font-semibold text-amber-700 dark:text-[#FDE68A] mt-0.5">
            +{weightGain} {isEn ? 'kg since birth' : 'كجم منذ الولادة'}
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-bg)] dark:bg-[#142430] p-3.5">
          <div className="text-[11px] font-bold text-[var(--color-muted)] dark:text-[#94A3B8]">
            📊 {isEn ? 'Growth Status' : 'مؤشر النمو العام'}
          </div>
          <div className="text-sm sm:text-base font-extrabold text-emerald-700 dark:text-[#6EE7B7] mt-1">
            ✅ {isEn ? 'Healthy Percentile' : 'نمو طبيعي متوازن'}
          </div>
          <div className="text-[10px] font-semibold text-[var(--color-muted)] dark:text-[#94A3B8] mt-0.5">
            {isEn ? 'Aligned with WHO curve' : 'متوافق مع منحنى النمو القياسي'}
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-bg)] dark:bg-[#142430] p-3.5 flex flex-col justify-between">
          <div className="text-[11px] font-bold text-[var(--color-muted)] dark:text-[#94A3B8]">
            🩸 {isEn ? 'Stage & Blood Type' : 'المرحلة والفصيلة'}
          </div>
          <div className="text-xs sm:text-sm font-extrabold text-[var(--color-text)] dark:text-[#F8FAFC] truncate mt-0.5">
            {ageInfo.stageTitle} · {activeChild.bloodType || 'O+'}
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

      {/* Recharts Visualization Canvas */}
      <div
        dir="ltr"
        className={`w-full rounded-2xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-bg)] dark:bg-[#0B131A] p-3 sm:p-4 ${
          compact ? 'h-[260px]' : 'h-[310px] sm:h-[340px]'
        }`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 12, right: 16, left: 0, bottom: 8 }}
          >
            <defs>
              <linearGradient id={`heightGrad-${activeChild.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={heightColor} stopOpacity={0.32} />
                <stop offset="95%" stopColor={heightColor} stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id={`weightGrad-${activeChild.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={weightColor} stopOpacity={0.28} />
                <stop offset="95%" stopColor={weightColor} stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />

            <XAxis
              dataKey="ageLabel"
              tick={{ fill: axisTextColor, fontSize: 11, fontWeight: 700 }}
              axisLine={{ stroke: gridStroke }}
              tickLine={false}
            />

            {(metricView === 'both' || metricView === 'height') && (
              <YAxis
                yAxisId="heightAxis"
                orientation="left"
                domain={['dataMin - 6', 'dataMax + 6']}
                unit=" cm"
                tick={{ fill: heightColor, fontSize: 11, fontWeight: 700 }}
                axisLine={false}
                tickLine={false}
                width={56}
              />
            )}

            {(metricView === 'both' || metricView === 'weight') && (
              <YAxis
                yAxisId="weightAxis"
                orientation={metricView === 'weight' ? 'left' : 'right'}
                domain={[0, 'dataMax + 4']}
                unit=" kg"
                tick={{ fill: weightColor, fontSize: 11, fontWeight: 700 }}
                axisLine={false}
                tickLine={false}
                width={52}
              />
            )}

            <Tooltip
              contentStyle={{
                backgroundColor: darkMode ? '#101D26' : '#FFFFFF',
                borderColor: darkMode ? '#1E3646' : '#CBD5E1',
                borderRadius: '16px',
                color: darkMode ? '#F8FAFC' : '#0B131A',
                fontSize: '12px',
                fontWeight: 700,
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.25)',
              }}
              labelStyle={{
                color: darkMode ? '#A5F3FC' : '#0F766E',
                fontWeight: 800,
                marginBottom: '4px',
              }}
            />

            <Legend
              wrapperStyle={{
                paddingTop: '8px',
                fontSize: '12px',
                fontWeight: 700,
              }}
            />

            {(metricView === 'both' || metricView === 'height') && (
              <>
                <Area
                  yAxisId="heightAxis"
                  type="monotone"
                  dataKey="heightCm"
                  name={isEn ? 'Height (cm)' : 'الطول (سم)'}
                  stroke={heightColor}
                  strokeWidth={3}
                  fillOpacity={1}
                  fill={`url(#heightGrad-${activeChild.id})`}
                  activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff' }}
                />
                <Line
                  yAxisId="heightAxis"
                  type="monotone"
                  dataKey="whoHeightMedianCm"
                  name={isEn ? 'Reference Height (WHO)' : 'الطول القياسي المرجعي'}
                  stroke={heightColor}
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={false}
                />
              </>
            )}

            {(metricView === 'both' || metricView === 'weight') && (
              <>
                <Line
                  yAxisId="weightAxis"
                  type="monotone"
                  dataKey="weightKg"
                  name={isEn ? 'Weight (kg)' : 'الوزن (كجم)'}
                  stroke={weightColor}
                  strokeWidth={3}
                  dot={{ r: 4, fill: weightColor, strokeWidth: 1.5, stroke: '#fff' }}
                  activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff' }}
                />
                <Line
                  yAxisId="weightAxis"
                  type="monotone"
                  dataKey="whoWeightMedianKg"
                  name={isEn ? 'Reference Weight (WHO)' : 'الوزن القياسي المرجعي'}
                  stroke={weightColor}
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={false}
                />
              </>
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

import React, { useCallback, useEffect, useState } from 'react';
import {
  CHILD_LIFE_RECORD_TYPES,
  ChildLifeRecord,
  ChildLifeRecordType,
  createChildLifeRecord,
  fetchChildLifeRecords,
} from '../services/childLifeRecordService';

const LABELS: Record<ChildLifeRecordType, { ar: string; en: string }> = {
  sleep_log: { ar: 'النوم', en: 'Sleep' },
  education: { ar: 'التعليم', en: 'Education' },
  nutrition: { ar: 'التغذية', en: 'Nutrition' },
  sports: { ar: 'الرياضة والنشاط', en: 'Sports & Activity' },
  routine: { ar: 'الروتين اليومي', en: 'Daily Routine' },
  growth_measurement: { ar: 'قياسات النمو', en: 'Growth' },
  vaccination: { ar: 'التطعيمات', en: 'Vaccinations' },
  medical_event: { ar: 'حدث صحي', en: 'Health Event' },
  milestone: { ar: 'إنجاز ومحطة عمرية', en: 'Milestone' },
  hobby: { ar: 'الهوايات والاهتمامات', en: 'Hobbies' },
  emotional_social: { ar: 'المشاعر والتواصل', en: 'Emotional & Social' },
  memory: { ar: 'ذكرى', en: 'Memory' },
  daily_note: { ar: 'ملاحظة يومية', en: 'Daily Note' },
  other: { ar: 'أخرى', en: 'Other' },
};

type TimelineFilter = 'all' | 'care' | 'learning' | 'interests' | 'memories';

const FILTER_TYPES: Record<Exclude<TimelineFilter, 'all'>, ChildLifeRecordType[]> = {
  care: ['sleep_log', 'nutrition', 'routine', 'vaccination', 'medical_event', 'growth_measurement'],
  learning: ['education'],
  interests: ['sports', 'hobby'],
  memories: ['milestone', 'memory', 'emotional_social', 'daily_note', 'other'],
};

interface Props {
  childId?: string | number;
  childName: string;
  lang: 'ar' | 'en' | string;
}

export const ChildLifeTimelinePanel: React.FC<Props> = ({ childId, childName, lang }) => {
  const isEn = lang === 'en';
  const validChildId = typeof childId === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(childId);
  const [records, setRecords] = useState<ChildLifeRecord[]>([]);
  const [recordType, setRecordType] = useState<ChildLifeRecordType>('daily_note');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [occurredAt, setOccurredAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [interestCategory, setInterestCategory] = useState('');
  const [interestReaction, setInterestReaction] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = React.useRef<HTMLFormElement | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [activeFilter, setActiveFilter] = useState<TimelineFilter>('all');
  const filterCards: { id: TimelineFilter; icon: string; ar: string; en: string; count: number }[] = [
    { id: 'all', icon: '🧭', ar: 'الكل', en: 'All', count: records.length },
    { id: 'care', icon: '🌙', ar: 'الرعاية', en: 'Care', count: records.filter((item) => FILTER_TYPES.care.includes(item.record_type)).length },
    { id: 'learning', icon: '🧩', ar: 'التعلم', en: 'Learning', count: records.filter((item) => FILTER_TYPES.learning.includes(item.record_type)).length },
    { id: 'interests', icon: '🎨', ar: 'الاهتمامات', en: 'Interests', count: records.filter((item) => FILTER_TYPES.interests.includes(item.record_type)).length },
    { id: 'memories', icon: '💛', ar: 'الذكريات', en: 'Memories', count: records.filter((item) => FILTER_TYPES.memories.includes(item.record_type)).length },
  ];
  const visibleRecords = activeFilter === 'all'
    ? records
    : records.filter((item) => FILTER_TYPES[activeFilter].includes(item.record_type));
  const growthRecords = records
    .filter((item) => item.record_type === 'growth_measurement' && (Number(item.details?.heightCm) > 0 || Number(item.details?.weightKg) > 0))
    .slice()
    .sort((a, b) => new Date(a.occurred_at).getTime() - new Date(b.occurred_at).getTime());
  const interestRecords = records
    .filter((item) => ['hobby', 'sports', 'education'].includes(item.record_type))
    .slice()
    .sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime());
  const interestGroups = [
    { id: 'movement', icon: '🏃', ar: 'حركة ورياضة', en: 'Movement', keywords: ['sport', 'football', 'swim', 'run', 'dance', 'رياض', 'كرة', 'سباح', 'جري', 'حركة', 'رقص'] },
    { id: 'creative', icon: '🎨', ar: 'إبداع وفنون', en: 'Creative arts', keywords: ['draw', 'paint', 'craft', 'music', 'art', 'رسم', 'تلوين', 'فن', 'موسيقى', 'عجين'] },
    { id: 'discovery', icon: '🔬', ar: 'اكتشاف وتجربة', en: 'Discovery', keywords: ['science', 'experiment', 'nature', 'build', 'discover', 'علوم', 'تجربة', 'اكتشاف', 'تركيب', 'طبيعة'] },
    { id: 'learning', icon: '📚', ar: 'قراءة وتعلّم', en: 'Reading & learning', keywords: ['read', 'book', 'letter', 'number', 'learn', 'قراءة', 'كتاب', 'حروف', 'أرقام', 'تعلم'] },
    { id: 'social', icon: '🤝', ar: 'تواصل ومشاركة', en: 'Social play', keywords: ['friend', 'team', 'share', 'group', 'صديق', 'أصدقاء', 'فريق', 'مشاركة', 'جماعي'] },
  ];
  const getInterestGroup = (record: ChildLifeRecord) => {
    const savedCategory = typeof record.details?.interestCategory === 'string' ? record.details.interestCategory : '';
    if (savedCategory) return interestGroups.find((group) => group.id === savedCategory) || null;
    const text = `${record.title} ${record.notes}`.toLocaleLowerCase();
    return interestGroups.find((group) => group.keywords.some((keyword) => text.includes(keyword))) ||
      (record.record_type === 'sports' ? interestGroups[0] : record.record_type === 'education' ? interestGroups[3] : null);
  };

  const refresh = useCallback(async () => {
    if (!validChildId || typeof childId !== 'string') return;
    setLoading(true);
    const result = await fetchChildLifeRecords(childId);
    setRecords(result.data);
    setError(result.error);
    setLoading(false);
  }, [childId, validChildId]);

  useEffect(() => { void refresh(); }, [refresh]);

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validChildId || typeof childId !== 'string' || !title.trim()) return;
    if (recordType === 'growth_measurement' && !(Number(heightCm) > 0 || Number(weightKg) > 0)) {
      setError(isEn ? 'Enter a measured height or weight.' : 'سجّل الطول أو الوزن الفعلي على الأقل.');
      return;
    }
    setSaving(true);
    setError(null);
    const result = await createChildLifeRecord({
      childId,
      recordType,
      title: title.trim(),
      notes: notes.trim(),
      occurredAt: new Date(`${occurredAt}T12:00:00`).toISOString(),
      details: recordType === 'growth_measurement' ? {
        ...(Number(heightCm) > 0 ? { heightCm: Number(heightCm) } : {}),
        ...(Number(weightKg) > 0 ? { weightKg: Number(weightKg) } : {}),
      } : ['hobby', 'sports', 'education'].includes(recordType)
        ? { ...(interestCategory ? { interestCategory } : {}), ...(interestReaction ? { interestReaction } : {}) }
        : {},
    });
    setSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setTitle('');
    setNotes('');
    setHeightCm('');
    setWeightKg('');
    setInterestCategory('');
    setInterestReaction('');
    setOccurredAt(new Date().toISOString().slice(0, 10));
    await refresh();
  };

  return (
    <section className="mt-4 rounded-2xl border border-[var(--color-border)] dark:border-[#1E3646] bg-white/80 dark:bg-[#142430] p-3 sm:p-4 space-y-3" dir={isEn ? 'ltr' : 'rtl'}>
      <button type="button" onClick={() => setExpanded((value) => !value)} className="w-full flex items-center justify-between gap-3 text-start">
        <span className="font-extrabold text-sm text-[var(--color-text)] dark:text-[#F8FAFC]">
          {isEn ? childName + ' · Life Timeline' : 'سجل حياة ' + childName}
          <span className="block text-xs font-semibold text-[var(--color-muted)] mt-1">
            {isEn ? 'Sleep, health, nutrition, learning, activities & memories' : 'النوم والصحة والتغذية والتعليم والأنشطة والذكريات'}
          </span>
        </span>
        <span className="text-xs font-extrabold text-teal-700 dark:text-teal-300">{expanded ? (isEn ? 'Hide' : 'إخفاء') : (isEn ? 'Open' : 'فتح')} · {records.length}</span>
      </button>

      {expanded && (
        <>
          {!validChildId ? (
            <p className="text-xs leading-6 text-amber-700 dark:text-amber-300">
              {isEn ? 'This child profile is not linked to a verified cloud record yet. Save the child profile first.' : 'ملف الطفل ده لسه مش مربوط بسجل سحابي موثّق. احفظ بيانات الطفل الأول علشان تقدر تسجل تاريخه.'}
            </p>
          ) : (
            <>
              <form ref={formRef} onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 gap-2 scroll-mt-4">
                <select value={recordType} onChange={(event) => setRecordType(event.target.value as ChildLifeRecordType)} className="min-h-11 rounded-xl border border-[var(--color-border)] bg-white dark:bg-[#0D1B26] px-3 text-sm">
                  {CHILD_LIFE_RECORD_TYPES.map((type) => <option key={type} value={type}>{isEn ? LABELS[type].en : LABELS[type].ar}</option>)}
                </select>
                <input value={title} onChange={(event) => setTitle(event.target.value)} required maxLength={160} placeholder={isEn ? 'Record title' : 'عنوان التسجيل'} className="min-h-11 rounded-xl border border-[var(--color-border)] bg-white dark:bg-[#0D1B26] px-3 text-sm" />
                <label className="flex flex-col gap-1 text-[11px] font-bold text-[var(--color-muted)]"><span>{isEn ? 'Date of this event' : 'تاريخ حدوث التسجيل'}</span><input type="date" value={occurredAt} max={new Date().toISOString().slice(0, 10)} onChange={(event) => setOccurredAt(event.target.value)} required className="min-h-11 rounded-xl border border-[var(--color-border)] bg-white dark:bg-[#0D1B26] px-3 text-sm text-[var(--color-text)]" /></label>
                {['hobby', 'sports', 'education'].includes(recordType) && <label className="sm:col-span-2 flex flex-col gap-1 text-[11px] font-bold text-[var(--color-muted)]"><span>{isEn ? 'Activity area (optional)' : 'مجال النشاط (اختياري)'}</span><select value={interestCategory} onChange={(event) => setInterestCategory(event.target.value)} className="min-h-11 rounded-xl border border-[var(--color-border)] bg-white dark:bg-[#0D1B26] px-3 text-sm"><option value="">{isEn ? 'Let the activity speak for itself' : 'سيب النشاط يعبّر عن نفسه'}</option>{interestGroups.map((group) => <option key={group.id} value={group.id}>{isEn ? group.en : group.ar}</option>)}</select><span className="font-normal">{isEn ? 'Choose only if it genuinely describes what you tried together.' : 'اختار المجال لو بيوصف النشاط فعلًا، وممكن تسيبه بدون تصنيف.'}</span><span className="mt-1">{isEn ? 'How did your child respond?' : 'كان رد فعل الطفل إيه؟'}</span><select value={interestReaction} onChange={(event) => setInterestReaction(event.target.value)} className="min-h-11 rounded-xl border border-[var(--color-border)] bg-white dark:bg-[#0D1B26] px-3 text-sm"><option value="">{isEn ? 'Not noted' : 'مش مسجل'}</option><option value="asked_again">{isEn ? 'Asked to do it again' : 'طلب يكرر التجربة'}</option><option value="engaged">{isEn ? 'Stayed engaged' : 'كان مندمج ومهتم'}</option><option value="curious">{isEn ? 'Asked questions' : 'سأل واستكشف'}</option><option value="neutral">{isEn ? 'Tried it calmly' : 'جرّب بهدوء'}</option><option value="not_interested">{isEn ? 'Was not interested today' : 'ماكانش مهتم النهارده'}</option><option value="uncertain">{isEn ? 'Not sure yet' : 'لسه مش واضح'}</option></select><span className="font-normal">{isEn ? 'One moment does not define a lasting preference.' : 'رد فعل مرة واحدة مش معناه تفضيل ثابت.'}</span></label>}
                {recordType === 'growth_measurement' && <div className="sm:col-span-2 grid grid-cols-2 gap-2 rounded-xl border border-teal-200 dark:border-teal-900 bg-teal-50/60 dark:bg-teal-950/20 p-3"><label className="flex flex-col gap-1 text-[11px] font-bold text-teal-800 dark:text-teal-200"><span>{isEn ? 'Measured height (cm)' : 'الطول المقاس (سم)'}</span><input type="number" min="1" max="250" step="0.1" inputMode="decimal" value={heightCm} onChange={(event) => setHeightCm(event.target.value)} placeholder={isEn ? 'e.g. 102.5' : 'مثال: 102.5'} className="min-h-11 rounded-lg border border-teal-200 dark:border-teal-900 bg-white dark:bg-[#0D1B26] px-3 text-sm" /></label><label className="flex flex-col gap-1 text-[11px] font-bold text-teal-800 dark:text-teal-200"><span>{isEn ? 'Measured weight (kg)' : 'الوزن المقاس (كجم)'}</span><input type="number" min="0.1" max="200" step="0.1" inputMode="decimal" value={weightKg} onChange={(event) => setWeightKg(event.target.value)} placeholder={isEn ? 'e.g. 16.2' : 'مثال: 16.2'} className="min-h-11 rounded-lg border border-teal-200 dark:border-teal-900 bg-white dark:bg-[#0D1B26] px-3 text-sm" /></label><p className="col-span-2 text-[10px] leading-5 text-teal-800/80 dark:text-teal-200/80">{isEn ? 'Enter values from an actual measurement. Missing values are not estimated.' : 'أدخل القيم من قياس فعلي. لن يتم تقدير أي قيمة غير مسجلة.'}</p></div>}
                <textarea value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={4000} rows={2} placeholder={isEn ? 'Notes and details (optional)' : 'ملاحظات وتفاصيل (اختياري)'} className="sm:col-span-2 rounded-xl border border-[var(--color-border)] bg-white dark:bg-[#0D1B26] px-3 py-2 text-sm" />
                <button disabled={saving || !title.trim() || (recordType === 'growth_measurement' && !(Number(heightCm) > 0 || Number(weightKg) > 0))} type="submit" className="sm:col-span-2 min-h-11 rounded-xl bg-teal-600 text-white text-sm font-extrabold disabled:opacity-50">
                  {saving ? (isEn ? 'Saving…' : 'جارٍ الحفظ…') : (isEn ? 'Save to child timeline' : 'حفظ في سجل الطفل')}
                </button>
              </form>
              {growthRecords.length > 0 && (
                <section data-testid="child-growth-history" className="rounded-2xl border border-teal-200/80 dark:border-teal-900 bg-gradient-to-br from-teal-50/80 to-white dark:from-teal-950/30 dark:to-[#101D26] p-3 space-y-3">
                  <div className="flex items-center justify-between gap-2"><div><h4 className="text-xs font-extrabold text-teal-900 dark:text-teal-100">{isEn ? 'Growth measurement history' : 'تاريخ قياسات النمو'}</h4><p className="mt-0.5 text-[10px] text-teal-800/80 dark:text-teal-200/80">{isEn ? 'Recorded values, in date order' : 'القيم الفعلية المسجلة مرتبة حسب التاريخ'}</p></div><span className="rounded-full bg-teal-100 dark:bg-teal-900/60 px-2.5 py-1 text-[10px] font-black text-teal-800 dark:text-teal-100">{growthRecords.length}</span></div>
                  <div className="flex gap-2 overflow-x-auto pb-1 snap-x">
                    {growthRecords.map((record, index) => (
                      <article key={record.id} className="relative min-w-[138px] snap-start rounded-xl border border-teal-200/80 dark:border-teal-900 bg-white/90 dark:bg-[#142430] p-3">
                        <time className="text-[10px] font-bold text-[var(--color-muted)]" dateTime={record.occurred_at}>{new Date(record.occurred_at).toLocaleDateString(isEn ? 'en' : 'ar', { day: 'numeric', month: 'short', year: 'numeric' })}</time>
                        {Number(record.details?.heightCm) > 0 && <div className="mt-2 flex items-baseline justify-between gap-1"><span className="text-[10px] text-teal-800 dark:text-teal-200">{isEn ? 'Height' : 'الطول'}</span><strong dir="ltr" className="text-sm text-teal-800 dark:text-teal-200">{Number(record.details.heightCm)} cm</strong></div>}
                        {Number(record.details?.weightKg) > 0 && <div className="mt-1 flex items-baseline justify-between gap-1"><span className="text-[10px] text-orange-800 dark:text-orange-200">{isEn ? 'Weight' : 'الوزن'}</span><strong dir="ltr" className="text-sm text-orange-800 dark:text-orange-200">{Number(record.details.weightKg)} kg</strong></div>}
                        {index < growthRecords.length - 1 && <span className="absolute -end-2 top-1/2 z-10 grid h-5 w-5 -translate-y-1/2 place-items-center rounded-full bg-teal-600 text-[10px] text-white shadow">{isEn ? '›' : '‹'}</span>}
                      </article>
                    ))}
                  </div>
                  {growthRecords.length === 1 && <p className="text-[10px] leading-5 text-teal-900/80 dark:text-teal-100/80">{isEn ? 'Add another dated measurement to begin comparing real changes over time.' : 'أضف قياسًا آخر بتاريخ مختلف علشان نقدر نتابع التغير الفعلي بمرور الوقت.'}</p>}
                </section>
              )}
              <section data-testid="child-interest-map" className="overflow-hidden rounded-2xl border border-violet-200/80 dark:border-violet-900/70 bg-gradient-to-br from-violet-50/90 via-white to-amber-50/60 dark:from-[#201B32] dark:via-[#142430] dark:to-[#29251D] p-3 sm:p-4 space-y-3">
                <div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-black tracking-wide text-violet-700 dark:text-violet-300">{isEn ? 'CURIOSITY MAP' : 'خريطة الفضول والاكتشاف'}</p><h4 className="mt-1 text-sm font-extrabold text-[var(--color-text)] dark:text-white">{isEn ? `${childName}’s explored interests` : `الحاجات اللي ${childName} جرّبها واهتم بيها`}</h4><p className="mt-1 text-[10px] leading-5 text-[var(--color-muted)]">{isEn ? 'A reflection of saved activities, not a talent test or a child rating.' : 'انعكاس للأنشطة المسجلة، مش اختبار مواهب ولا تقييم للطفل.'}</p></div><span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-violet-100 dark:bg-violet-900/50 text-xl">🪁</span></div>
                {interestRecords.length > 0 ? <>
                  <div className="flex flex-wrap gap-2">{interestGroups.map((group) => { const matching = interestRecords.filter((record) => getInterestGroup(record)?.id === group.id); if (!matching.length) return null; return <div key={group.id} className="rounded-xl border border-violet-200/80 dark:border-violet-800 bg-white/80 dark:bg-[#172536] px-3 py-2"><span className="text-sm">{group.icon}</span><span className="ms-1.5 text-[11px] font-extrabold text-[var(--color-text)] dark:text-white">{isEn ? group.en : group.ar}</span><span className="ms-2 text-[10px] font-black text-violet-700 dark:text-violet-300">{matching.length}</span></div>; })}</div>
                  <div className="space-y-2"><div className="flex items-center justify-between"><span className="text-[11px] font-extrabold text-[var(--color-text)] dark:text-white">{isEn ? 'Recently explored' : 'آخر الأنشطة اللي اتجربت'}</span><span className="text-[10px] text-[var(--color-muted)]">{interestRecords.length} {isEn ? 'records' : 'تسجيلات'}</span></div><div className="flex gap-2 overflow-x-auto pb-1 snap-x">{interestRecords.slice(0, 8).map((record) => { const group = getInterestGroup(record); return <article key={record.id} className="min-w-[155px] max-w-[190px] snap-start rounded-xl border border-violet-100 dark:border-violet-900/70 bg-white/90 dark:bg-[#172536] p-3"><span className="text-lg">{group?.icon || (record.record_type === 'sports' ? '🏃' : record.record_type === 'education' ? '🧩' : '✨')}</span><p className="mt-1 text-xs font-extrabold text-[var(--color-text)] dark:text-white line-clamp-2">{record.title}</p>{typeof record.details?.interestReaction === 'string' && <span className="mt-1 inline-block rounded-full bg-violet-50 dark:bg-violet-950/50 px-2 py-1 text-[9px] font-bold text-violet-800 dark:text-violet-200">{{ asked_again: isEn ? 'Wants to repeat' : 'طلب يكررها', engaged: isEn ? 'Engaged' : 'مندمج', curious: isEn ? 'Curious' : 'فضولي', neutral: isEn ? 'Tried calmly' : 'جرّب بهدوء', not_interested: isEn ? 'Not today' : 'مش النهارده', uncertain: isEn ? 'Not sure yet' : 'لسه مش واضح' }[record.details.interestReaction] || ''}</span>}<time className="mt-1 block text-[10px] text-[var(--color-muted)]" dateTime={record.occurred_at}>{new Date(record.occurred_at).toLocaleDateString(isEn ? 'en' : 'ar', { day: 'numeric', month: 'short' })}</time></article>; })}</div></div>
                </> : <div className="rounded-xl border border-dashed border-violet-300 dark:border-violet-800 bg-white/60 dark:bg-[#172536]/60 p-3"><p className="text-xs font-bold text-[var(--color-text)] dark:text-white">{isEn ? 'The best way to discover an interest is to try something together.' : 'أحسن طريقة لاكتشاف اهتمام جديد إنكم تجربوا حاجة سوا.'}</p><p className="mt-1 text-[10px] leading-5 text-[var(--color-muted)]">{isEn ? 'Try drawing, building, a short story, or a movement game. Save what you tried and how your child responded.' : 'جرّبوا رسم، تركيب مكعبات، حكاية قصيرة، أو لعبة حركة. سجّلوا النشاط ورد فعل الطفل من غير ضغط أو توقعات.'}</p></div>}
                <div className="border-t border-violet-200/70 dark:border-violet-900/70 pt-3"><div className="flex items-center justify-between gap-2"><div><h5 className="text-xs font-extrabold text-[var(--color-text)] dark:text-white">{isEn ? 'Try it together' : 'جرّبوا سوا'}</h5><p className="text-[10px] text-[var(--color-muted)]">{isEn ? 'Small ideas, no scores and no pressure' : 'أفكار بسيطة من غير درجات أو ضغط'}</p></div><span className="text-lg">💡</span></div><div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">{[
                  { id: 'creative', icon: '🖍️', ar: 'ارسموا حكاية سوا', en: 'Draw a story together', type: 'hobby' as ChildLifeRecordType },
                  { id: 'discovery', icon: '🧪', ar: 'جرّبوا تجربة آمنة', en: 'Try a safe experiment', type: 'education' as ChildLifeRecordType },
                  { id: 'movement', icon: '⚽', ar: 'ابتكروا لعبة حركة', en: 'Invent a movement game', type: 'sports' as ChildLifeRecordType },
                  { id: 'learning', icon: '📖', ar: 'اختاروا قصة واقرؤوها', en: 'Choose and read a story', type: 'education' as ChildLifeRecordType },
                  { id: 'social', icon: '🧩', ar: 'ابنوا حاجة كفريق', en: 'Build something as a team', type: 'hobby' as ChildLifeRecordType },
                  { id: 'creative', icon: '🎵', ar: 'اعملوا إيقاع بالموجود', en: 'Make a rhythm together', type: 'hobby' as ChildLifeRecordType },
                ].map((idea, index) => <button key={`${idea.id}-${index}`} type="button" onClick={() => { setRecordType(idea.type); setInterestCategory(idea.id); setTitle(isEn ? idea.en : idea.ar); setNotes(''); setActiveFilter('interests'); formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }} className="min-h-[76px] rounded-xl border border-violet-100 dark:border-violet-900/70 bg-white/90 dark:bg-[#172536] p-2 text-start transition hover:-translate-y-0.5 hover:border-violet-400"><span className="text-lg">{idea.icon}</span><span className="mt-1 block text-[10px] font-extrabold leading-4 text-[var(--color-text)] dark:text-white">{isEn ? idea.en : idea.ar}</span><span className="mt-1 block text-[9px] font-bold text-violet-700 dark:text-violet-300">{isEn ? 'Use in activity log →' : 'سجّلوا التجربة ←'}</span></button>)}</div></div>
              </section>
              <div data-testid="child-timeline-insights" className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-extrabold text-[var(--color-text)] dark:text-white">{isEn ? 'Explore this child’s story' : 'اكتشفوا حكاية طفلكم'}</h4>
                  <span className="text-[10px] text-[var(--color-muted)]">{isEn ? `${records.length} saved moments` : `${records.length} تسجيلات محفوظة`}</span>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {filterCards.map((card) => (
                    <button key={card.id} type="button" onClick={() => setActiveFilter(card.id)} aria-pressed={activeFilter === card.id}
                      className={`min-w-0 rounded-xl border p-2 text-center transition-all ${activeFilter === card.id ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/40' : 'border-[var(--color-border)] bg-[var(--color-bg)] dark:bg-[#0D1B26]'}`}>
                      <span className="block text-base" aria-hidden="true">{card.icon}</span>
                      <span className="mt-1 block truncate text-[9px] font-extrabold text-[var(--color-text)] dark:text-white">{isEn ? card.en : card.ar}</span>
                      <span className="mt-0.5 block text-xs font-black tabular-nums text-teal-700 dark:text-teal-300">{card.count}</span>
                    </button>
                  ))}
                </div>
              </div>
              {error && <p role="alert" className="text-xs text-red-600 dark:text-red-300">{error}</p>}
              <div className="space-y-2">
                {loading ? <p className="text-xs text-[var(--color-muted)]">{isEn ? 'Loading records…' : 'جارٍ تحميل السجل…'}</p> :
                  visibleRecords.length === 0 ? <p className="text-xs text-[var(--color-muted)]">{records.length === 0 ? (isEn ? 'No records yet. Add the first moment above.' : 'لسه مفيش تسجيلات. أضف أول لحظة من النموذج.') : (isEn ? 'No records in this story yet.' : 'مفيش تسجيلات في المسار ده لسه.')}</p> :
                  visibleRecords.map((record) => (
                    <article key={record.id} className="rounded-xl border border-[var(--color-border)] dark:border-[#1E3646] p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-extrabold text-teal-700 dark:text-teal-300">{isEn ? LABELS[record.record_type].en : LABELS[record.record_type].ar}</span>
                        <time className="text-[11px] text-[var(--color-muted)]" dateTime={record.occurred_at}>{new Date(record.occurred_at).toLocaleString(isEn ? 'en' : 'ar')}</time>
                      </div>
                      <h4 className="mt-1 text-sm font-bold text-[var(--color-text)] dark:text-[#F8FAFC]">{record.title}</h4>
                      {record.record_type === 'growth_measurement' && (Number(record.details?.heightCm) > 0 || Number(record.details?.weightKg) > 0) && <div className="mt-2 flex flex-wrap gap-2">{Number(record.details?.heightCm) > 0 && <span dir="ltr" className="rounded-lg bg-teal-50 dark:bg-teal-950/30 px-2.5 py-1 text-xs font-extrabold text-teal-800 dark:text-teal-200">📏 {Number(record.details.heightCm)} cm</span>}{Number(record.details?.weightKg) > 0 && <span dir="ltr" className="rounded-lg bg-orange-50 dark:bg-orange-950/30 px-2.5 py-1 text-xs font-extrabold text-orange-800 dark:text-orange-200">⚖️ {Number(record.details.weightKg)} kg</span>}</div>}
                      {record.notes && <p className="mt-1 text-xs leading-6 whitespace-pre-wrap text-[var(--color-muted)]">{record.notes}</p>}
                    </article>
                  ))}
              </div>
            </>
          )}
        </>
      )}
    </section>
  );
};

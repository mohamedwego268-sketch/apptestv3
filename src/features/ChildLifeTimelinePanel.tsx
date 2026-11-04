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
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
      } : {},
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
              <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <select value={recordType} onChange={(event) => setRecordType(event.target.value as ChildLifeRecordType)} className="min-h-11 rounded-xl border border-[var(--color-border)] bg-white dark:bg-[#0D1B26] px-3 text-sm">
                  {CHILD_LIFE_RECORD_TYPES.map((type) => <option key={type} value={type}>{isEn ? LABELS[type].en : LABELS[type].ar}</option>)}
                </select>
                <input value={title} onChange={(event) => setTitle(event.target.value)} required maxLength={160} placeholder={isEn ? 'Record title' : 'عنوان التسجيل'} className="min-h-11 rounded-xl border border-[var(--color-border)] bg-white dark:bg-[#0D1B26] px-3 text-sm" />
                <label className="flex flex-col gap-1 text-[11px] font-bold text-[var(--color-muted)]"><span>{isEn ? 'Date of this event' : 'تاريخ حدوث التسجيل'}</span><input type="date" value={occurredAt} max={new Date().toISOString().slice(0, 10)} onChange={(event) => setOccurredAt(event.target.value)} required className="min-h-11 rounded-xl border border-[var(--color-border)] bg-white dark:bg-[#0D1B26] px-3 text-sm text-[var(--color-text)]" /></label>
                {recordType === 'growth_measurement' && <div className="sm:col-span-2 grid grid-cols-2 gap-2 rounded-xl border border-teal-200 dark:border-teal-900 bg-teal-50/60 dark:bg-teal-950/20 p-3"><label className="flex flex-col gap-1 text-[11px] font-bold text-teal-800 dark:text-teal-200"><span>{isEn ? 'Measured height (cm)' : 'الطول المقاس (سم)'}</span><input type="number" min="1" max="250" step="0.1" inputMode="decimal" value={heightCm} onChange={(event) => setHeightCm(event.target.value)} placeholder={isEn ? 'e.g. 102.5' : 'مثال: 102.5'} className="min-h-11 rounded-lg border border-teal-200 dark:border-teal-900 bg-white dark:bg-[#0D1B26] px-3 text-sm" /></label><label className="flex flex-col gap-1 text-[11px] font-bold text-teal-800 dark:text-teal-200"><span>{isEn ? 'Measured weight (kg)' : 'الوزن المقاس (كجم)'}</span><input type="number" min="0.1" max="200" step="0.1" inputMode="decimal" value={weightKg} onChange={(event) => setWeightKg(event.target.value)} placeholder={isEn ? 'e.g. 16.2' : 'مثال: 16.2'} className="min-h-11 rounded-lg border border-teal-200 dark:border-teal-900 bg-white dark:bg-[#0D1B26] px-3 text-sm" /></label><p className="col-span-2 text-[10px] leading-5 text-teal-800/80 dark:text-teal-200/80">{isEn ? 'Enter values from an actual measurement. Missing values are not estimated.' : 'أدخل القيم من قياس فعلي. لن يتم تقدير أي قيمة غير مسجلة.'}</p></div>}
                <textarea value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={4000} rows={2} placeholder={isEn ? 'Notes and details (optional)' : 'ملاحظات وتفاصيل (اختياري)'} className="sm:col-span-2 rounded-xl border border-[var(--color-border)] bg-white dark:bg-[#0D1B26] px-3 py-2 text-sm" />
                <button disabled={saving || !title.trim() || (recordType === 'growth_measurement' && !(Number(heightCm) > 0 || Number(weightKg) > 0))} type="submit" className="sm:col-span-2 min-h-11 rounded-xl bg-teal-600 text-white text-sm font-extrabold disabled:opacity-50">
                  {saving ? (isEn ? 'Saving…' : 'جارٍ الحفظ…') : (isEn ? 'Save to child timeline' : 'حفظ في سجل الطفل')}
                </button>
              </form>
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

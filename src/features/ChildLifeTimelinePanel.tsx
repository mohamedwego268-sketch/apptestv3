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
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

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
    setSaving(true);
    setError(null);
    const result = await createChildLifeRecord({
      childId,
      recordType,
      title: title.trim(),
      notes: notes.trim(),
    });
    setSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setTitle('');
    setNotes('');
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
                <textarea value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={4000} rows={2} placeholder={isEn ? 'Notes and details (optional)' : 'ملاحظات وتفاصيل (اختياري)'} className="sm:col-span-2 rounded-xl border border-[var(--color-border)] bg-white dark:bg-[#0D1B26] px-3 py-2 text-sm" />
                <button disabled={saving || !title.trim()} type="submit" className="sm:col-span-2 min-h-11 rounded-xl bg-teal-600 text-white text-sm font-extrabold disabled:opacity-50">
                  {saving ? (isEn ? 'Saving…' : 'جارٍ الحفظ…') : (isEn ? 'Save to child timeline' : 'حفظ في سجل الطفل')}
                </button>
              </form>
              {error && <p role="alert" className="text-xs text-red-600 dark:text-red-300">{error}</p>}
              <div className="space-y-2">
                {loading ? <p className="text-xs text-[var(--color-muted)]">{isEn ? 'Loading records…' : 'جارٍ تحميل السجل…'}</p> :
                  records.length === 0 ? <p className="text-xs text-[var(--color-muted)]">{isEn ? 'No records yet. Add the first moment above.' : 'لسه مفيش تسجيلات. أضف أول لحظة من النموذج.'}</p> :
                  records.map((record) => (
                    <article key={record.id} className="rounded-xl border border-[var(--color-border)] dark:border-[#1E3646] p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-extrabold text-teal-700 dark:text-teal-300">{isEn ? LABELS[record.record_type].en : LABELS[record.record_type].ar}</span>
                        <time className="text-[11px] text-[var(--color-muted)]" dateTime={record.occurred_at}>{new Date(record.occurred_at).toLocaleString(isEn ? 'en' : 'ar')}</time>
                      </div>
                      <h4 className="mt-1 text-sm font-bold text-[var(--color-text)] dark:text-[#F8FAFC]">{record.title}</h4>
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

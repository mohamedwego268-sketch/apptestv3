import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { DynamicContentCatalogItem } from '../domain/contentRecommendationEngine';
import { supabaseClient } from '../services/supabaseService';
import { clearDynamicContentCatalogCache } from '../services/dynamicContentService';

type ContentRow = DynamicContentCatalogItem & {
  review_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
};

interface MediaAssetOption { id: string; title: string; media_type: string; visibility: string; }

interface ContentFormState {
  titleAr: string;
  titleEn: string;
  summaryAr: string;
  summaryEn: string;
  bodyAr: string;
  bodyEn: string;
  contentType: string;
  topic: string;
  audience: 'child' | 'parent' | 'family';
  language: 'ar' | 'en' | 'both';
  ageMin: string;
  ageMax: string;
  tags: string;
  interests: string;
  hobbies: string;
  sports: string;
  safetyLevel: 'general' | 'sensitive' | 'medical';
  sourceName: string;
  sourceUrl: string;
  mediaAssetId: string;
}

const EMPTY_FORM: ContentFormState = {
  titleAr: '',
  titleEn: '',
  summaryAr: '',
  summaryEn: '',
  bodyAr: '',
  bodyEn: '',
  contentType: 'tip',
  topic: 'general',
  audience: 'family',
  language: 'both',
  ageMin: '',
  ageMax: '',
  tags: '',
  interests: '',
  hobbies: '',
  sports: '',
  safetyLevel: 'general',
  sourceName: '',
  sourceUrl: '',
  mediaAssetId: '',
};

const parseTags = (value: string): string[] =>
  [...new Set(value.split(/[,،;|]/).map((part) => part.trim()).filter(Boolean))];

const parseAge = (value: string): number | null => {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
};

const statusLabel = (status: string, isEn: boolean): string => {
  const labels: Record<string, [string, string]> = {
    draft: ['مسودة', 'Draft'],
    pending_review: ['بانتظار المراجعة', 'Pending review'],
    approved: ['معتمد', 'Approved'],
    rejected: ['مرفوض', 'Rejected'],
    archived: ['مؤرشف', 'Archived'],
  };
  const pair = labels[status] || [status, status];
  return isEn ? pair[1] : pair[0];
};

interface DynamicContentAdminPanelProps {
  language: 'ar' | 'en';
  permissions: string[];
  isSuperAdmin: boolean;
}

export const DynamicContentAdminPanel: React.FC<DynamicContentAdminPanelProps> = ({
  language,
  permissions,
  isSuperAdmin,
}) => {
  const isEn = language === 'en';
  const canCreate = isSuperAdmin || permissions.includes('content.create') || permissions.includes('content.edit');
  const canEdit = isSuperAdmin || permissions.includes('content.edit');
  const canModerate = isSuperAdmin || permissions.includes('content.moderate');
  const canPublish = isSuperAdmin || permissions.includes('content.publish');
  const [rows, setRows] = useState<ContentRow[]>([]);
  const [mediaAssets, setMediaAssets] = useState<MediaAssetOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'draft' | 'pending_review' | 'approved' | 'rejected'>('all');
  const [editing, setEditing] = useState<ContentRow | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<ContentFormState>(EMPTY_FORM);
  const [notice, setNotice] = useState('');

  const loadRows = useCallback(async () => {
    if (!supabaseClient) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const [contentResult, mediaResult] = await Promise.all([
      supabaseClient
        .from('content_catalog')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(150),
      supabaseClient
        .from('media_assets')
        .select('id,title,media_type,visibility')
        .eq('approval_status', 'approved')
        .eq('visibility', 'public')
        .order('created_at', { ascending: false })
        .limit(100),
    ]);
    if (contentResult.error) {
      setNotice((isEn ? 'Could not load content: ' : 'تعذر تحميل المحتوى: ') + contentResult.error.message);
      setRows([]);
    } else {
      setRows((contentResult.data ?? []) as unknown as ContentRow[]);
    }
    if (!mediaResult.error) setMediaAssets((mediaResult.data ?? []) as MediaAssetOption[]);
    setLoading(false);
  }, [isEn]);

  useEffect(() => {
    void loadRows();
  }, [loadRows]);

  const filteredRows = useMemo(() => {
    const term = query.trim().toLocaleLowerCase();
    return rows.filter((row) => {
      const matchesFilter = filter === 'all' || row.review_status === filter;
      const matchesQuery = !term || [
        row.title_ar,
        row.title_en,
        row.content_key,
        row.topic,
        ...row.tags,
      ].some((value) => String(value || '').toLocaleLowerCase().includes(term));
      return matchesFilter && matchesQuery;
    });
  }, [rows, query, filter]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (row: ContentRow) => {
    setEditing(row);
    setForm({
      titleAr: row.title_ar || '',
      titleEn: row.title_en || '',
      summaryAr: row.summary_ar || '',
      summaryEn: row.summary_en || '',
      bodyAr: row.body_ar || '',
      bodyEn: row.body_en || '',
      contentType: row.content_type || 'tip',
      topic: row.topic || 'general',
      audience: row.audience || 'family',
      language: row.language || 'both',
      ageMin: row.age_min_months === null ? '' : String(row.age_min_months),
      ageMax: row.age_max_months === null ? '' : String(row.age_max_months),
      tags: row.tags.join(', '),
      interests: row.interest_tags.join(', '),
      hobbies: row.hobby_tags.join(', '),
      sports: row.sport_tags.join(', '),
      safetyLevel: row.safety_level,
      sourceName: row.source_name || '',
      sourceUrl: row.source_url || '',
      mediaAssetId: row.media_asset_id || '',
    });
    setModalOpen(true);
  };

  const saveContent = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabaseClient || saving) return;
    const ageMin = parseAge(form.ageMin);
    const ageMax = parseAge(form.ageMax);
    if (form.ageMin.trim() && ageMin === null || form.ageMax.trim() && ageMax === null) {
      setNotice(isEn ? 'Age values must be whole months, zero or greater.' : 'العمر لازم يكون عدد شهور صحيح، صفر أو أكبر.');
      return;
    }
    if (ageMin !== null && ageMax !== null && ageMax < ageMin) {
      setNotice(isEn ? 'Maximum age must be greater than or equal to minimum age.' : 'الحد الأقصى للعمر لازم يكون أكبر من أو يساوي الحد الأدنى.');
      return;
    }
    if (form.sourceUrl.trim() && !/^https:\/\//i.test(form.sourceUrl.trim())) {
      setNotice(isEn ? 'Source links must use HTTPS.' : 'رابط المصدر لازم يبدأ بـ HTTPS.');
      return;
    }

    setSaving(true);
    setNotice('');
    const { data: authData, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !authData.user) {
      setSaving(false);
      setNotice(isEn ? 'An active admin session is required.' : 'يلزم تسجيل دخول إداري صالح.');
      return;
    }

    const slugSource = (form.titleEn || form.titleAr || 'family-content')
      .normalize('NFKD')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const payload = {
      content_key: editing?.content_key || (slugSource || 'family-content') + '-' + Date.now(),
      title_ar: form.titleAr.trim(),
      title_en: form.titleEn.trim(),
      summary_ar: form.summaryAr.trim(),
      summary_en: form.summaryEn.trim(),
      body_ar: form.bodyAr.trim(),
      body_en: form.bodyEn.trim(),
      content_type: form.contentType,
      topic: form.topic.trim() || 'general',
      audience: form.audience,
      language: form.language,
      age_min_months: ageMin,
      age_max_months: ageMax,
      tags: parseTags(form.tags),
      interest_tags: parseTags(form.interests),
      hobby_tags: parseTags(form.hobbies),
      sport_tags: parseTags(form.sports),
      safety_level: form.safetyLevel,
      source_name: form.sourceName.trim() || null,
      source_url: form.sourceUrl.trim() || null,
      media_asset_id: form.mediaAssetId || null,
      is_published: false,
      review_status: 'pending_review',
      updated_by: authData.user.id,
      ...(editing ? {} : { created_by: authData.user.id }),
    };

    const result = editing
      ? await supabaseClient.from('content_catalog').update(payload).eq('id', editing.id)
      : await supabaseClient.from('content_catalog').insert(payload);
    setSaving(false);
    if (result.error) {
      setNotice((isEn ? 'Save failed: ' : 'فشل الحفظ: ') + result.error.message);
      return;
    }
    clearDynamicContentCatalogCache();
    setModalOpen(false);
    setNotice(isEn ? 'Saved and sent to review. It is not published yet.' : 'تم الحفظ وإرسال المحتوى للمراجعة. لم يتم نشره.');
    await loadRows();
  };

  const moderate = async (row: ContentRow, nextStatus: 'approved' | 'rejected') => {
    if (!supabaseClient || !canModerate || saving) return;
    const { data: authData } = await supabaseClient.auth.getUser();
    if (!authData.user) return;
    setSaving(true);
    const { error } = await supabaseClient.from('content_catalog').update({
      review_status: nextStatus,
      reviewed_by: authData.user.id,
      reviewed_at: new Date().toISOString(),
      updated_by: authData.user.id,
      is_published: false,
    }).eq('id', row.id);
    setSaving(false);
    setNotice(error
      ? (isEn ? 'Review action failed: ' : 'تعذر تنفيذ المراجعة: ') + error.message
      : (isEn ? 'Review status updated.' : 'تم تحديث حالة المراجعة.'));
    if (!error) { clearDynamicContentCatalogCache(); await loadRows(); }
  };

  const togglePublish = async (row: ContentRow) => {
    if (!supabaseClient || !canPublish || saving) return;
    if (!row.is_published && row.review_status !== 'approved') {
      setNotice(isEn ? 'Approve this item before publishing.' : 'اعتمد المحتوى أولاً قبل النشر.');
      return;
    }
    setSaving(true);
    const publishing = !row.is_published;
    const { error } = await supabaseClient.rpc('content_catalog_set_published', {
      p_content_id: row.id,
      p_is_published: publishing,
    });
    setSaving(false);
    setNotice(error
      ? (isEn ? 'Publishing action failed: ' : 'تعذر تغيير حالة النشر: ') + error.message
      : (publishing ? (isEn ? 'Content published.' : 'تم نشر المحتوى.') : (isEn ? 'Content unpublished.' : 'تم إيقاف نشر المحتوى.')));
    if (!error) { clearDynamicContentCatalogCache(); await loadRows(); }
  };

  return (
    <section className="admin-panel dynamic-content-admin">
      <div className="panel-heading">
        <div>
          <h3>{isEn ? 'Personalized content library' : 'مكتبة المحتوى المخصص'}</h3>
          <p>{isEn ? 'Create, review and publish age-aware content for the family home feed.' : 'أنشئ المحتوى، راجعه، وانشره ليظهر حسب عمر الطفل واهتماماته في الرئيسية.'}</p>
        </div>
        <div className="catalog-heading-actions">
          <label className="admin-search">
            <span aria-hidden="true">⌕</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={isEn ? 'Search content…' : 'ابحث في المحتوى…'} />
          </label>
          {canCreate && <button type="button" className="admin-add-btn" onClick={openCreate}>{isEn ? '+ New content' : '+ محتوى جديد'}</button>}
        </div>
      </div>

      <div className="b2b-tabs dynamic-content-filters">
        {(['all', 'draft', 'pending_review', 'approved', 'rejected'] as const).map((status) => (
          <button key={status} type="button" className={filter === status ? 'active' : ''} onClick={() => setFilter(status)}>
            {status === 'all' ? (isEn ? 'All' : 'الكل') : statusLabel(status, isEn)}
          </button>
        ))}
      </div>

      {notice && <p className="admin-form-note" role="status">{notice}</p>}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>{isEn ? 'Content' : 'المحتوى'}</th>
              <th>{isEn ? 'Audience / age' : 'الفئة / العمر'}</th>
              <th>{isEn ? 'Safety' : 'السلامة'}</th>
              <th>{isEn ? 'Review' : 'المراجعة'}</th>
              <th>{isEn ? 'Publishing' : 'النشر'}</th>
              <th>{isEn ? 'Actions' : 'الإجراءات'}</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row) => (
              <tr key={row.id}>
                <td>
                  <div className="catalog-item-name">
                    <span>{row.content_type === 'video' ? '▶' : row.content_type === 'audio' ? '♫' : '✦'}</span>
                    <div><b>{isEn ? row.title_en || row.title_ar : row.title_ar || row.title_en}</b><small>{row.content_key} · {row.topic}</small></div>
                  </div>
                </td>
                <td>{row.audience}<small className="table-sub">{row.age_min_months ?? '—'} – {row.age_max_months ?? '—'} {isEn ? 'months' : 'شهر'}</small></td>
                <td>{row.safety_level}</td>
                <td><span className={'directory-verified ' + (row.review_status === 'approved' ? 'is-verified' : '')}>{statusLabel(row.review_status, isEn)}</span></td>
                <td><span className={'directory-verified ' + (row.is_published ? 'is-verified' : '')}>{row.is_published ? (isEn ? 'Published' : 'منشور') : (isEn ? 'Unpublished' : 'غير منشور')}</span></td>
                <td>
                  <div className="catalog-actions">
                    {canEdit && (canModerate || (!row.is_published && row.review_status !== 'approved')) && <button type="button" className="admin-edit-btn" onClick={() => openEdit(row)}>{isEn ? 'Edit' : 'تعديل'}</button>}
                    {canModerate && row.review_status === 'pending_review' && <>
                      <button type="button" className="admin-edit-btn" disabled={saving} onClick={() => void moderate(row, 'approved')}>{isEn ? 'Approve' : 'اعتماد'}</button>
                      <button type="button" className="admin-edit-btn" disabled={saving} onClick={() => void moderate(row, 'rejected')}>{isEn ? 'Reject' : 'رفض'}</button>
                    </>}
                    {canPublish && row.review_status === 'approved' && row.safety_level !== 'medical' && (
                      <button type="button" className="admin-edit-btn" disabled={saving} onClick={() => void togglePublish(row)}>
                        {row.is_published ? (isEn ? 'Unpublish' : 'إيقاف') : (isEn ? 'Publish' : 'نشر')}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!loading && filteredRows.length === 0 && <tr><td colSpan={6} className="admin-empty-cell">{isEn ? 'No matching content yet.' : 'لا يوجد محتوى مطابق حتى الآن.'}</td></tr>}
          </tbody>
        </table>
        {loading && <div className="directory-loading">{isEn ? 'Loading content library…' : 'جارٍ تحميل مكتبة المحتوى…'}</div>}
      </div>

      {modalOpen && (
        <div className="admin-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setModalOpen(false); }}>
          <form className="admin-staff-modal dynamic-content-modal" onSubmit={saveContent}>
            <div className="admin-modal-head">
              <div><span className="admin-modal-kicker">{isEn ? 'CONTENT WORKFLOW' : 'إدارة المحتوى'}</span><h2>{editing ? (isEn ? 'Edit content' : 'تعديل المحتوى') : (isEn ? 'Create content' : 'إضافة محتوى')}</h2><p>{isEn ? 'Saving sends the item back to review and unpublishes it until approved again.' : 'الحفظ يعيد المحتوى للمراجعة ويوقف نشره لحين اعتماده مرة أخرى.'}</p></div>
              <button type="button" className="admin-icon-btn" onClick={() => setModalOpen(false)}>×</button>
            </div>
            <div className="admin-staff-form-grid">
              <label>{isEn ? 'Arabic title' : 'العنوان بالعربية'}<input required={form.language !== 'en'} value={form.titleAr} onChange={(event) => setForm((current) => ({ ...current, titleAr: event.target.value }))} /></label>
              <label>{isEn ? 'English title' : 'العنوان بالإنجليزية'}<input required={form.language !== 'ar'} value={form.titleEn} onChange={(event) => setForm((current) => ({ ...current, titleEn: event.target.value }))} /></label>
              <label>{isEn ? 'Content type' : 'نوع المحتوى'}<select value={form.contentType} onChange={(event) => setForm((current) => ({ ...current, contentType: event.target.value }))}><option value="tip">Tip / نصيحة</option><option value="activity">Activity / نشاط</option><option value="guide">Guide / دليل</option><option value="article">Article / مقال</option><option value="video">Video / فيديو</option><option value="audio">Audio / صوت</option><option value="story">Story / قصة</option><option value="exercise">Exercise / تمرين</option></select></label>
              <label>{isEn ? 'Topic key' : 'التصنيف'}<input value={form.topic} onChange={(event) => setForm((current) => ({ ...current, topic: event.target.value }))} /></label>
              <label>{isEn ? 'Audience' : 'الفئة المستهدفة'}<select value={form.audience} onChange={(event) => setForm((current) => ({ ...current, audience: event.target.value as ContentFormState['audience'] }))}><option value="child">{isEn ? 'Child' : 'الطفل'}</option><option value="parent">{isEn ? 'Parent' : 'ولي الأمر'}</option><option value="family">{isEn ? 'Family' : 'الأسرة'}</option></select></label>
              <label>{isEn ? 'Language' : 'اللغة'}<select value={form.language} onChange={(event) => setForm((current) => ({ ...current, language: event.target.value as ContentFormState['language'] }))}><option value="both">{isEn ? 'Arabic + English' : 'عربي + إنجليزي'}</option><option value="ar">العربية</option><option value="en">English</option></select></label>
              <label>{isEn ? 'Minimum age (months)' : 'أقل عمر (بالشهور)'}<input type="number" min="0" value={form.ageMin} onChange={(event) => setForm((current) => ({ ...current, ageMin: event.target.value }))} placeholder={isEn ? 'Any age' : 'كل الأعمار'} /></label>
              <label>{isEn ? 'Maximum age (months)' : 'أقصى عمر (بالشهور)'}<input type="number" min="0" value={form.ageMax} onChange={(event) => setForm((current) => ({ ...current, ageMax: event.target.value }))} placeholder={isEn ? 'Any age' : 'كل الأعمار'} /></label>
              <label>{isEn ? 'Interest tags' : 'اهتمامات'}<input value={form.interests} onChange={(event) => setForm((current) => ({ ...current, interests: event.target.value }))} placeholder={isEn ? 'space, art, science' : 'فضاء، رسم، علوم'} /></label>
              <label>{isEn ? 'Hobby tags' : 'هوايات'}<input value={form.hobbies} onChange={(event) => setForm((current) => ({ ...current, hobbies: event.target.value }))} /></label>
              <label>{isEn ? 'Sport tags' : 'رياضات'}<input value={form.sports} onChange={(event) => setForm((current) => ({ ...current, sports: event.target.value }))} /></label>
              <label>{isEn ? 'General tags' : 'وسوم عامة'}<input value={form.tags} onChange={(event) => setForm((current) => ({ ...current, tags: event.target.value }))} /></label>
              <label>{isEn ? 'Safety level' : 'مستوى السلامة'}<select value={form.safetyLevel} onChange={(event) => setForm((current) => ({ ...current, safetyLevel: event.target.value as ContentFormState['safetyLevel'] }))}><option value="general">{isEn ? 'General' : 'عام'}</option><option value="sensitive">{isEn ? 'Sensitive / members' : 'حساس / للأعضاء'}</option><option value="medical">{isEn ? 'Medical (admin only)' : 'طبي (للإدارة فقط)'}</option></select></label>
              <label>{isEn ? 'Source name' : 'اسم المصدر'}<input value={form.sourceName} onChange={(event) => setForm((current) => ({ ...current, sourceName: event.target.value }))} /></label>
              <label>{isEn ? 'Approved media asset' : 'وسيط معتمد'}<select value={form.mediaAssetId} onChange={(event) => setForm((current) => ({ ...current, mediaAssetId: event.target.value }))}><option value="">{isEn ? 'No media attached' : 'بدون وسيط'}</option>{mediaAssets.map((asset) => <option key={asset.id} value={asset.id}>{asset.title} · {asset.media_type}</option>)}</select></label>
              <label>{isEn ? 'Source URL (HTTPS)' : 'رابط المصدر (HTTPS)'}<input type="url" value={form.sourceUrl} onChange={(event) => setForm((current) => ({ ...current, sourceUrl: event.target.value }))} /></label>
              <label className="catalog-description">{isEn ? 'Arabic summary' : 'ملخص بالعربية'}<textarea rows={2} value={form.summaryAr} onChange={(event) => setForm((current) => ({ ...current, summaryAr: event.target.value }))} /></label>
              <label className="catalog-description">{isEn ? 'English summary' : 'ملخص بالإنجليزية'}<textarea rows={2} value={form.summaryEn} onChange={(event) => setForm((current) => ({ ...current, summaryEn: event.target.value }))} /></label>
              <label className="catalog-description">{isEn ? 'Arabic body' : 'المحتوى بالعربية'}<textarea rows={4} value={form.bodyAr} onChange={(event) => setForm((current) => ({ ...current, bodyAr: event.target.value }))} /></label>
              <label className="catalog-description">{isEn ? 'English body' : 'المحتوى بالإنجليزية'}<textarea rows={4} value={form.bodyEn} onChange={(event) => setForm((current) => ({ ...current, bodyEn: event.target.value }))} /></label>
            </div>
            <div className="admin-modal-actions">
              <button type="button" className="admin-cancel-btn" onClick={() => setModalOpen(false)}>{isEn ? 'Cancel' : 'إلغاء'}</button>
              <button type="submit" className="admin-primary-btn" disabled={saving}>{saving ? (isEn ? 'Saving…' : 'جارٍ الحفظ…') : (isEn ? 'Save for review' : 'حفظ وإرسال للمراجعة')}</button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
};

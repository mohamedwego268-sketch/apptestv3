import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Film, LoaderCircle, ShieldCheck, UploadCloud, XCircle } from 'lucide-react';
import { supabaseClient } from '../services/supabaseService';
import { InternalVideoPlayer } from './InternalVideoPlayer';

type MediaAsset = {
  id: string;
  asset_code: string;
  title: string;
  description: string | null;
  category: string;
  storage_path: string;
  poster_path: string | null;
  approval_status: 'draft' | 'pending_review' | 'approved' | 'rejected' | 'archived';
  file_size_bytes: number;
  created_at: string;
  owner_type: 'platform' | 'partner';
};

type MediaUploadPanelProps = {
  ownerType: 'platform' | 'partner';
  partnerId?: string;
  language?: 'ar' | 'en';
  allowUpload?: boolean;
  allowModeration?: boolean;
};

const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
const statusText = (status: MediaAsset['approval_status'], en: boolean) => ({
  draft: en ? 'Draft' : 'مسودة',
  pending_review: en ? 'Pending review' : 'بانتظار المراجعة',
  approved: en ? 'Approved' : 'معتمد',
  rejected: en ? 'Rejected' : 'مرفوض',
  archived: en ? 'Archived' : 'مؤرشف',
}[status]);

export const MediaUploadPanel: React.FC<MediaUploadPanelProps> = ({
  ownerType,
  partnerId,
  language = 'ar',
  allowUpload = true,
  allowModeration = false,
}) => {
  const en = language === 'en';
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('parenting');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const loadAssets = useCallback(async () => {
    if (!supabaseClient) { setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabaseClient
      .from('media_assets')
      .select('id,asset_code,title,description,category,storage_path,poster_path,approval_status,file_size_bytes,created_at,owner_type')
      .order('created_at', { ascending: false })
      .limit(40);
    if (error) setMessage(error.message);
    else setAssets((data || []) as MediaAsset[]);
    setLoading(false);
  }, []);

  useEffect(() => { void loadAssets(); }, [loadAssets]);

  const uploadVideo = async () => {
    if (!supabaseClient || !file || title.trim().length < 2) return;
    if (ownerType === 'partner' && !partnerId) {
      setMessage(en ? 'This partner account is not linked to an active partner record.' : 'حساب الشريك غير مرتبط بمنشأة نشطة.');
      return;
    }
    if (!['video/mp4', 'video/webm', 'video/quicktime', 'video/x-m4v'].includes(file.type)) {
      setMessage(en ? 'Choose an MP4, WebM or MOV video.' : 'اختار فيديو MP4 أو WebM أو MOV.');
      return;
    }
    if (file.size > MAX_VIDEO_BYTES) {
      setMessage(en ? 'Maximum file size is 50 MB.' : 'الحد الأقصى لحجم الفيديو 50 ميجابايت.');
      return;
    }
    setBusy(true);
    setMessage('');
    let assetId: string | null = null;
    let storagePath = '';
    try {
      const { data: userResult, error: userError } = await supabaseClient.auth.getUser();
      if (userError || !userResult.user) throw userError || new Error('Sign in is required.');
      const userId = userResult.user.id;
      const safeName = file.name.normalize('NFKD').replace(/[^a-zA-Z0-9._-]+/g, '-').slice(-72) || 'video.mp4';
      const folder = ownerType === 'platform'
        ? `platform/${userId}`
        : `partners/${partnerId}/${userId}`;
      storagePath = `${folder}/${crypto.randomUUID()}-${safeName}`;

      const { data: asset, error: insertError } = await supabaseClient
        .from('media_assets')
        .insert({
          owner_type: ownerType,
          partner_id: ownerType === 'partner' ? partnerId : null,
          uploader_auth_user_id: userId,
          title: title.trim(),
          category,
          media_type: 'video',
          storage_path: storagePath,
          mime_type: file.type,
          file_size_bytes: file.size,
          visibility: 'public',
          approval_status: 'draft',
        })
        .select('id')
        .single();
      if (insertError || !asset) throw insertError || new Error('Could not create media record.');
      assetId = asset.id;

      const { error: uploadError } = await supabaseClient.storage
        .from('nekbaar-media')
        .upload(storagePath, file, { contentType: file.type, cacheControl: '3600', upsert: false });
      if (uploadError) throw uploadError;

      const { error: submitError } = await supabaseClient
        .from('media_assets')
        .update({ approval_status: 'pending_review', updated_at: new Date().toISOString() })
        .eq('id', assetId);
      if (submitError) throw submitError;

      setTitle('');
      setFile(null);
      const fileInput = document.getElementById('nekbaar-video-file') as HTMLInputElement | null;
      if (fileInput) fileInput.value = '';
      setMessage(en ? 'Video uploaded and sent for review.' : 'تم رفع الفيديو وإرساله للمراجعة.');
      await loadAssets();
    } catch (error) {
      if (assetId && supabaseClient) {
        if (storagePath) await supabaseClient.storage.from('nekbaar-media').remove([storagePath]);
        await supabaseClient.from('media_assets').delete().eq('id', assetId);
      }
      setMessage(error instanceof Error ? error.message : (en ? 'Upload failed.' : 'فشل رفع الفيديو.'));
    } finally {
      setBusy(false);
    }
  };

  const reviewAsset = async (asset: MediaAsset, approved: boolean) => {
    if (!supabaseClient) return;
    setReviewingId(asset.id);
    setMessage('');
    const { data: userResult } = await supabaseClient.auth.getUser();
    const { error } = await supabaseClient
      .from('media_assets')
      .update({
        approval_status: approved ? 'approved' : 'rejected',
        approved_by: approved ? userResult.user?.id || null : null,
        approved_at: approved ? new Date().toISOString() : null,
        review_note: approved ? null : (en ? 'Rejected by platform review.' : 'تم رفض المحتوى من مراجعة المنصة.'),
        updated_at: new Date().toISOString(),
      })
      .eq('id', asset.id);
    if (error) setMessage(error.message);
    else {
      setMessage(en ? 'Review status updated.' : 'تم تحديث حالة المراجعة.');
      await loadAssets();
    }
    setReviewingId(null);
  };

  const formatSize = (bytes: number) => bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.ceil(bytes / 1024)} KB`;

  return (
    <section className="mt-5 space-y-4 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm dark:border-[#1E3646] dark:bg-[#101D26]" dir={en ? 'ltr' : 'rtl'}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="text-[10px] font-black tracking-widest text-teal-700 dark:text-teal-300">NEKBAAR MEDIA</span>
          <h3 className="mt-1 text-base font-black leading-7 text-[var(--color-text)]">{en ? 'Internal video library' : 'مكتبة الفيديوهات الداخلية'}</h3>
          <p className="mt-1 text-xs leading-6 text-[var(--color-muted)]">{en ? 'Upload video files to Nekbaar storage. Partner videos stay hidden until approved.' : 'ارفع ملفات الفيديو على تخزين نكبر مباشرة. فيديوهات الشركاء لا تظهر للأسر إلا بعد اعتماد الإدارة.'}</p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-teal-50 px-3 py-1.5 text-[10px] font-extrabold text-teal-800 dark:bg-[#142430] dark:text-teal-200"><ShieldCheck size={13}/>{en ? 'Private storage' : 'تخزين خاص'}</span>
      </div>

      {allowUpload && (
        <div className="grid gap-3 rounded-2xl border border-dashed border-teal-300 bg-teal-50/60 p-3 dark:border-teal-900 dark:bg-[#142430]">
          <label className="block text-xs font-extrabold text-[var(--color-text)]">
            {en ? 'Video title' : 'عنوان الفيديو'}
            <input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={180} placeholder={en ? 'e.g. Simple bedtime routine' : 'مثال: روتين نوم هادي للطفل'} className="mt-1.5 min-h-[44px] w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm font-semibold"/>
          </label>
          <label className="block text-xs font-extrabold text-[var(--color-text)]">
            {en ? 'Content category' : 'تصنيف المحتوى'}
            <select value={category} onChange={(event) => setCategory(event.target.value)} className="mt-1.5 min-h-[44px] w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm font-semibold">
              <option value="parenting">{en ? 'Parenting' : 'تربية ورعاية'}</option>
              <option value="health">{en ? 'Health & nutrition' : 'الصحة والتغذية'}</option>
              <option value="learning">{en ? 'Learning & play' : 'التعلّم واللعب'}</option>
              <option value="services">{en ? 'Partner services' : 'خدمات الشركاء'}</option>
              <option value="promotions">{en ? 'Partner promotions' : 'عروض الشركاء'}</option>
            </select>
          </label>
          <label className="block text-xs font-extrabold text-[var(--color-text)]">
            {en ? 'Video file · MP4 / WebM / MOV · up to 50 MB' : 'ملف الفيديو · MP4 / WebM / MOV · حتى 50 ميجابايت'}
            <input id="nekbaar-video-file" type="file" accept="video/mp4,video/webm,video/quicktime,video/x-m4v" onChange={(event) => setFile(event.target.files?.[0] || null)} className="mt-1.5 block min-h-[44px] w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-2 text-xs"/>
          </label>
          <button type="button" disabled={busy || !file || title.trim().length < 2 || (ownerType === 'partner' && !partnerId)} onClick={() => void uploadVideo()} className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0d9488] to-[#0284c7] px-4 text-sm font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-50">
            {busy ? <LoaderCircle className="animate-spin" size={17}/> : <UploadCloud size={17}/>}
            {busy ? (en ? 'Uploading…' : 'جاري الرفع…') : (en ? 'Upload and send for review' : 'رفع الفيديو وإرساله للمراجعة')}
          </button>
          <p className="text-[10px] leading-5 text-[var(--color-muted)]">{en ? 'The file is stored inside Nekbaar. No YouTube, Vimeo or external embed links are accepted.' : 'الملف بيتخزن داخل نكبر. لا نقبل روابط YouTube أو Vimeo أو مشغلات خارجية.'}</p>
        </div>
      )}

      {message && <p role="status" className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold leading-5 text-slate-700 dark:bg-[#142430] dark:text-slate-100">{message}</p>}

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-sm font-black text-[var(--color-text)]">{en ? 'Uploaded videos' : 'الفيديوهات المرفوعة'}</h4>
          <button type="button" onClick={() => void loadAssets()} disabled={loading} className="min-h-[40px] rounded-xl border border-[var(--color-border)] px-3 text-xs font-bold text-[var(--color-text)]">{en ? 'Refresh' : 'تحديث'}</button>
        </div>
        {loading ? <div className="flex items-center gap-2 py-5 text-xs text-[var(--color-muted)]"><LoaderCircle className="animate-spin" size={16}/>{en ? 'Loading media…' : 'جاري تحميل الوسائط…'}</div> : assets.length ? (
          <div className="grid gap-3 md:grid-cols-2">
            {assets.map((asset) => (
              <article key={asset.id} className="min-w-0 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-page)] p-3 dark:border-[#1E3646] dark:bg-[#0B1821]">
                <InternalVideoPlayer storagePath={asset.storage_path} posterPath={asset.poster_path} title={asset.title} language={language}/>
                <div className="mt-3 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h5 className="break-words text-sm font-extrabold leading-6 text-[var(--color-text)]">{asset.title}</h5>
                    <p className="mt-1 text-[10px] text-[var(--color-muted)]">{asset.asset_code} · {formatSize(asset.file_size_bytes)}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-slate-200 px-2 py-1 text-[9px] font-extrabold text-slate-700 dark:bg-[#1E3646] dark:text-slate-100">{statusText(asset.approval_status, en)}</span>
                </div>
                {allowModeration && asset.approval_status === 'pending_review' && (
                  <div className="mt-3 flex gap-2">
                    <button type="button" disabled={reviewingId === asset.id} onClick={() => void reviewAsset(asset, true)} className="inline-flex min-h-[42px] flex-1 items-center justify-center gap-1 rounded-xl bg-teal-700 px-3 text-xs font-extrabold text-white disabled:opacity-50"><CheckCircle2 size={15}/>{en ? 'Approve' : 'اعتماد'}</button>
                    <button type="button" disabled={reviewingId === asset.id} onClick={() => void reviewAsset(asset, false)} className="inline-flex min-h-[42px] flex-1 items-center justify-center gap-1 rounded-xl bg-rose-100 px-3 text-xs font-extrabold text-rose-800 disabled:opacity-50 dark:bg-rose-950/40 dark:text-rose-200"><XCircle size={15}/>{en ? 'Reject' : 'رفض'}</button>
                  </div>
                )}
              </article>
            ))}
          </div>
        ) : <div className="rounded-2xl border border-dashed border-[var(--color-border)] px-4 py-6 text-center"><Film className="mx-auto text-[var(--color-muted)]" size={26}/><p className="mt-2 text-xs font-bold text-[var(--color-muted)]">{en ? 'No videos uploaded yet.' : 'لسه مفيش فيديوهات مرفوعة.'}</p></div>}
      </div>
    </section>
  );
};

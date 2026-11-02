import React, { useEffect, useState } from 'react';
import { Film, LoaderCircle } from 'lucide-react';
import { supabaseClient } from '../services/supabaseService';
import { InternalVideoPlayer } from './InternalVideoPlayer';

type FeedAsset = {
  id: string;
  asset_code: string;
  title: string;
  description: string | null;
  category: string;
  storage_path: string;
  poster_path: string | null;
  created_at: string;
};

type InternalVideoFeedProps = { language?: 'ar' | 'en'; limit?: number };

export const InternalVideoFeed: React.FC<InternalVideoFeedProps> = ({ language = 'ar', limit = 6 }) => {
  const en = language === 'en';
  const [items, setItems] = useState<FeedAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!supabaseClient) {
        if (active) { setError(en ? 'Media service is unavailable.' : 'خدمة الوسائط غير متاحة حاليًا.'); setLoading(false); }
        return;
      }
      setLoading(true);
      const { data, error: queryError } = await supabaseClient
        .from('media_assets')
        .select('id,asset_code,title,description,category,storage_path,poster_path,created_at')
        .eq('media_type', 'video')
        .eq('approval_status', 'approved')
        .eq('visibility', 'public')
        .order('created_at', { ascending: false })
        .limit(limit);
      if (!active) return;
      if (queryError) setError(queryError.message);
      else { setItems((data || []) as FeedAsset[]); setError(''); }
      setLoading(false);
    };
    void load();
    return () => { active = false; };
  }, [en, limit]);

  if (loading) return <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{Array.from({length: Math.min(limit, 2)}).map((_, i) => <div key={i} className="aspect-video animate-pulse rounded-2xl bg-white/10"/>)}</div>;
  if (error) return <p role="status" className="rounded-xl border border-white/15 bg-white/5 px-3 py-3 text-xs leading-5 text-white/75">{error}</p>;
  if (!items.length) return <div className="rounded-2xl border border-dashed border-white/20 bg-white/[0.04] px-4 py-6 text-center text-white"><Film className="mx-auto text-teal-200" size={28}/><p className="mt-2 text-xs font-extrabold">{en ? 'No approved videos yet' : 'مفيش فيديوهات معتمدة للعرض حاليًا'}</p><p className="mt-1 text-[10px] leading-5 text-white/65">{en ? 'Approved internal uploads will appear here automatically.' : 'أول ما يتم رفع الفيديوهات واعتمادها، هتظهر هنا تلقائيًا.'}</p></div>;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <article key={item.id} className="min-w-0 overflow-hidden rounded-2xl border border-white/15 bg-[#0B2530]/80 p-2.5">
          <InternalVideoPlayer storagePath={item.storage_path} posterPath={item.poster_path} title={item.title} language={language}/>
          <div className="px-1 pb-1 pt-3">
            <h3 className="break-words text-sm font-extrabold leading-6 text-white">{item.title}</h3>
            {item.description && <p className="mt-1 break-words text-[10px] leading-5 text-white/65">{item.description}</p>}
            <span className="mt-2 inline-block rounded-full bg-white/10 px-2 py-1 text-[9px] font-bold text-teal-100">{item.category}</span>
          </div>
        </article>
      ))}
    </div>
  );
};

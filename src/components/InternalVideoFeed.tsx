import React, { useEffect, useState } from 'react';
import { ArrowUpLeft, ArrowUpRight, Film, Play } from 'lucide-react';
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

type InternalVideoFeedProps = { language?: 'ar' | 'en'; limit?: number; onOpenLibrary?: () => void };

export const InternalVideoFeed: React.FC<InternalVideoFeedProps> = ({ language = 'ar', limit = 6, onOpenLibrary }) => {
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
      if (queryError) setError(en ? 'Videos could not be loaded right now. Please try again later.' : 'مش قادرين نحمّل الفيديوهات دلوقتي. حاولوا مرة تانية بعد شوية.');
      else { setItems((data || []) as FeedAsset[]); setError(''); }
      setLoading(false);
    };
    void load();
    return () => { active = false; };
  }, [en, limit]);

  if (loading) return <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{Array.from({length: Math.min(limit, 2)}).map((_, i) => <div key={i} className="aspect-video animate-pulse rounded-2xl bg-white/10"/>)}</div>;
  if (error) return <p role="status" className="rounded-xl border border-white/15 bg-white/5 px-3 py-3 text-xs leading-5 text-white/75">{error}</p>;
  if (!items.length) return (
    <div className="relative isolate overflow-hidden rounded-2xl border border-white/15 bg-[#0B2530] p-4 text-white sm:p-5">
      <img src="https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=1000&q=80" alt="" loading="lazy" className="absolute inset-0 -z-20 h-full w-full object-cover opacity-35" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#06151D] via-[#08232D]/90 to-[#0B2530]/65" />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-md">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[9px] font-black text-teal-100"><Film size={12}/>{en ? 'FAMILY VIDEO SPACE' : 'مساحة فيديوهات الأسرة'}</span>
          <p className="mt-2 text-sm font-black">{en ? 'Your next family watch is waiting here' : 'لحظات المشاهدة العائلية هتلاقوها هنا'}</p>
          <p className="mt-1 text-[10px] leading-5 text-white/75">{en ? 'New approved videos will appear automatically. Explore the library in the meantime.' : 'الفيديوهات الجديدة هتظهر تلقائيًا بعد اعتمادها. تقدروا تستكشفوا مكتبة الوسائط دلوقتي.'}</p>
        </div>
        <button type="button" onClick={onOpenLibrary} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-teal-300 px-4 py-2 text-xs font-black text-[#06242A] transition hover:bg-teal-200">
          <Play size={14}/>{en ? 'Open media library' : 'افتح مكتبة الوسائط'} {en ? <ArrowUpRight size={14}/> : <ArrowUpLeft size={14}/>}
        </button>
      </div>
    </div>
  );

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

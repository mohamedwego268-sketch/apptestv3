import React, { useEffect, useState } from 'react';
import { Film, LoaderCircle, ShieldCheck } from 'lucide-react';
import { supabaseClient } from '../services/supabaseService';

type InternalVideoPlayerProps = {
  storagePath?: string | null;
  posterPath?: string | null;
  title: string;
  language?: 'ar' | 'en';
  className?: string;
};

export const InternalVideoPlayer: React.FC<InternalVideoPlayerProps> = ({
  storagePath,
  posterPath,
  title,
  language = 'ar',
  className = '',
}) => {
  const isEn = language === 'en';
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [posterUrl, setPosterUrl] = useState<string | undefined>();
  const [status, setStatus] = useState<'empty' | 'loading' | 'ready' | 'error'>('empty');

  useEffect(() => {
    let active = true;
    setVideoUrl(null);
    setPosterUrl(undefined);
    if (!storagePath) {
      setStatus('empty');
      return () => { active = false; };
    }
    if (!supabaseClient) {
      setStatus('error');
      return () => { active = false; };
    }
    setStatus('loading');
    const storage = supabaseClient.storage.from('nekbaar-media');
    Promise.all([
      storage.createSignedUrl(storagePath, 60 * 60),
      posterPath ? storage.createSignedUrl(posterPath, 60 * 60) : Promise.resolve({ data: null, error: null }),
    ]).then(([videoResult, posterResult]) => {
      if (!active) return;
      if (videoResult.error || !videoResult.data?.signedUrl) {
        setStatus('error');
        return;
      }
      setVideoUrl(videoResult.data.signedUrl);
      setPosterUrl(posterResult.data?.signedUrl || undefined);
      setStatus('ready');
    }).catch(() => {
      if (active) setStatus('error');
    });
    return () => { active = false; };
  }, [storagePath, posterPath]);

  return (
    <div className={`overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[#071923] ${className}`}>
      {status === 'ready' && videoUrl ? (
        <video key={videoUrl} src={videoUrl} poster={posterUrl} controls playsInline preload="metadata" className="aspect-video w-full bg-black object-contain" aria-label={title} />
      ) : (
        <div className="grid aspect-video place-items-center bg-gradient-to-br from-[#102C38] via-[#123A46] to-[#1B5360] px-4 py-5 text-center text-white">
          <div className="max-w-sm">
            {status === 'loading' ? <LoaderCircle className="mx-auto animate-spin text-teal-200" size={30} /> : status === 'error' ? <ShieldCheck className="mx-auto text-amber-200" size={30} /> : <Film className="mx-auto text-teal-200" size={32} />}
            <p className="mt-3 text-sm font-extrabold leading-6">
              {status === 'loading' ? (isEn ? 'Preparing internal video…' : 'جاري تجهيز الفيديو الداخلي…') : status === 'error' ? (isEn ? 'Video is not available in internal storage yet.' : 'الفيديو غير متاح في التخزين الداخلي حاليًا.') : (isEn ? 'This video has not been uploaded yet.' : 'الفيديو ده لسه متمرفعش على نكبر.')}
            </p>
            <p className="mt-1 text-[10px] leading-5 text-white/65">{isEn ? 'Only files uploaded and approved inside Nekbaar can appear here.' : 'الفيديوهات هتظهر هنا بعد رفعها داخليًا ومراجعتها واعتمادها.'}</p>
          </div>
        </div>
      )}
      <div className="flex items-center gap-2 border-t border-white/10 bg-[#0B2530] px-3 py-2 text-[10px] font-bold text-teal-100"><ShieldCheck size={13}/><span>{isEn ? 'Nekbaar internal media' : 'وسائط داخلية من نكبر'}</span></div>
    </div>
  );
};

import React, { useEffect, useMemo, useState } from 'react';
import type { ChildProfile, LanguageCode } from '../domain/familySpaceCore';
import {
  extractProfileSignals,
  rankDynamicContent,
  type RecommendationProfile,
} from '../domain/contentRecommendationEngine';
import { clearDynamicContentCatalogCache, fetchDynamicContentCatalog } from '../services/dynamicContentService';
import { supabaseClient } from '../services/supabaseService';

interface HomeDynamicContentSectionProps {
  child?: ChildProfile;
  language: LanguageCode;
  recentRecords?: RecommendationProfile['recentRecords'];
}

const contentTypeLabel = (type: string, isEn: boolean): string => {
  const labels: Record<string, [string, string]> = {
    tip: ['نصيحة', 'Tip'],
    activity: ['نشاط', 'Activity'],
    guide: ['دليل', 'Guide'],
    article: ['مقال', 'Article'],
    video: ['فيديو', 'Video'],
    audio: ['صوت', 'Audio'],
    story: ['قصة', 'Story'],
    exercise: ['تمرين', 'Exercise'],
  };
  const pair = labels[type] || labels.tip;
  return isEn ? pair[1] : pair[0];
};

export const HomeDynamicContentSection: React.FC<HomeDynamicContentSectionProps> = ({
  child,
  language,
  recentRecords,
}) => {
  const isEn = language === 'en';
  const [catalog, setCatalog] = useState<Awaited<ReturnType<typeof fetchDynamicContentCatalog>>['items']>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    let requestVersion = 0;
    const loadCatalog = (forceRefresh = false) => {
      const version = ++requestVersion;
      void fetchDynamicContentCatalog(forceRefresh).then((result) => {
        if (!active || version !== requestVersion) return;
        setCatalog(result.items);
        setLoaded(true);
      });
    };

    loadCatalog();
    const authListener = supabaseClient?.auth.onAuthStateChange((event) => {
      if (event !== 'SIGNED_IN' && event !== 'SIGNED_OUT' && event !== 'USER_UPDATED') return;
      setCatalog([]);
      setLoaded(false);
      clearDynamicContentCatalogCache();
      window.setTimeout(() => loadCatalog(true), 0);
    });

    return () => {
      active = false;
      authListener?.data.subscription.unsubscribe();
    };
  }, []);

  const profile = useMemo<RecommendationProfile | null>(
    () => child ? { child, language, recentRecords } : null,
    [child, language, recentRecords],
  );
  const signals = useMemo(() => profile ? extractProfileSignals(profile) : null, [profile]);
  const recommendations = useMemo(
    () => profile ? rankDynamicContent(catalog, profile, { limit: 3 }) : [],
    [catalog, profile],
  );
  const personalIdeas = useMemo(() => {
    if (!signals) return [];
    const stage = signals.ageMonths === null ? 'unknown' : signals.ageMonths < 24 ? 'baby' : signals.ageMonths < 48 ? 'preschool' : signals.ageMonths < 72 ? 'early' : 'older';
    const ideas: Array<{ id: string; icon: string; label: string; title: string; body: string; tag: string }> = [];
    if (signals.interests[0]) ideas.push({
      id: 'interest', icon: '🔎', label: isEn ? 'From an interest' : 'من اهتماماته',
      title: isEn ? 'Explore ' + signals.interests[0] : 'نكتشف ' + signals.interests[0],
      body: stage === 'baby'
        ? (isEn ? 'Explore it together through safe objects, names and gentle sounds.' : 'استكشفوه سوا بأشياء آمنة، وسمّوا الأشياء والأصوات اللي حواليكم.')
        : stage === 'preschool'
          ? (isEn ? 'Find three related things and let your child name or sort them.' : 'دوروا على 3 حاجات مرتبطة بالاهتمام ده وخليه يسميها أو يصنفها.')
          : stage === 'early'
            ? (isEn ? 'Turn it into a small drawing, building or storytelling challenge.' : 'حوّلوا الاهتمام ده لتحدي رسم أو تركيب أو حكاية صغيرة.')
            : (isEn ? 'Invite your child to make a mini project and explain one discovery.' : 'خليه يعمل مشروع صغير عن الموضوع ويحكيلك اكتشف إيه.'),
      tag: signals.interests[0],
    });
    if (signals.hobbies[0]) ideas.push({
      id: 'hobby', icon: '🎨', label: isEn ? 'A favourite hobby' : 'هواية بيحبها',
      title: isEn ? 'Time for ' + signals.hobbies[0] : 'وقت ممتع لـ' + signals.hobbies[0],
      body: stage === 'preschool'
        ? (isEn ? 'Offer two simple ways to enjoy it and let your child choose.' : 'اعرض عليه طريقتين بسيطتين للهواية وسيبه يختار.')
        : (isEn ? 'Set a tiny creative challenge and celebrate the effort, not the result.' : 'اعملوا تحدي إبداعي صغير واحتفلوا بالمحاولة مش بالنتيجة.'),
      tag: signals.hobbies[0],
    });
    if (signals.sports[0]) ideas.push({
      id: 'sport', icon: '⚽', label: isEn ? 'Favourite sport' : 'رياضته المفضلة',
      title: isEn ? 'A small step in ' + signals.sports[0] : 'خطوة صغيرة في ' + signals.sports[0],
      body: isEn ? 'Choose one enjoyable skill to practise safely, with breaks and no pressure to compete.' : 'اختاروا مهارة واحدة ممتعة يتدرب عليها بأمان، مع فواصل ومن غير ضغط منافسة.',
      tag: signals.sports[0],
    });
    if (ideas.length < 3 && signals.recentTopics.includes('wellbeing')) ideas.push({
      id: 'connection', icon: '💛', label: isEn ? 'A moment to connect' : 'لحظة تواصل',
      title: isEn ? 'A gentle check-in' : 'دقيقة نسمع فيها بعض',
      body: isEn ? 'Give your child space to describe their day without rushing to solve.' : 'ادي لطفلك مساحة يحكي عن يومه من غير استعجال في تقديم الحلول.',
      tag: isEn ? 'Connection' : 'تواصل',
    });
    if (ideas.length < 3 && signals.recentTopics.includes('sports')) ideas.push({
      id: 'movement', icon: '🏃', label: isEn ? 'From recent activity' : 'من نشاطه الأخير',
      title: isEn ? 'Keep movement playful' : 'خلّوا الحركة ممتعة',
      body: isEn ? 'Ask which part of the recent activity your child enjoyed most.' : 'اسأله أكتر جزء استمتع بيه في النشاط الأخير وابدأوا منه المرة الجاية.',
      tag: isEn ? 'Movement' : 'حركة',
    });
    if (ideas.length < 3 && signals.recentTopics.includes('nutrition')) ideas.push({
      id: 'routine', icon: '🥣', label: isEn ? 'From the daily log' : 'من سجل اليوم',
      title: isEn ? 'Notice food preferences' : 'لاحظوا تفضيلاته',
      body: isEn ? 'Let your child help with one suitable meal task under adult supervision.' : 'خليه يشارك في اختيار أو تجهيز جزء مناسب من الوجبة تحت إشرافك.',
      tag: isEn ? 'Daily routine' : 'روتين يومي',
    });
    if (ideas.length < 3 && signals.recentTopics.includes('sleep')) ideas.push({
      id: 'sleep', icon: '🌙', label: isEn ? 'From the sleep log' : 'من سجل النوم',
      title: isEn ? 'A calmer evening transition' : 'انتقال أهدى لنهاية اليوم',
      body: isEn ? 'Keep the next step predictable and give your child a little time to wind down.' : 'خلّوا الخطوة الجاية متوقعة وادي لطفلك وقت بسيط ينتقل فيه من نشاط اليوم للهدوء.',
      tag: isEn ? 'Evening routine' : 'روتين المساء',
    });
    if (ideas.length < 3 && signals.recentTopics.includes('routine')) ideas.push({
      id: 'routine-check', icon: '🧩', label: isEn ? 'From the daily routine' : 'من الروتين اليومي',
      title: isEn ? 'One small shared task' : 'مهمة صغيرة نعملها سوا',
      body: isEn ? 'Choose one age-appropriate task and let your child take part at their own pace.' : 'اختاروا مهمة واحدة مناسبة لعمره وخليه يشارك فيها على مهله.',
      tag: isEn ? 'Family routine' : 'روتين الأسرة',
    });
    if (!ideas.length) ideas.push({
      id: 'profile', icon: '✨', label: isEn ? 'Make this personal' : 'خلّيها أقرب له',
      title: isEn ? 'Add interests and hobbies' : 'سجّل اهتماماته وهواياته',
      body: isEn ? 'Add a few things your child enjoys to make suggestions more relevant.' : 'ضيف شوية حاجات بيحبها عشان اقتراحات الرئيسية تبقى مرتبطة بشخصيته.',
      tag: isEn ? 'Child profile' : 'ملف الطفل',
    });
    return ideas.slice(0, 3);
  }, [signals, isEn]);

  if (!child || !signals) return null;

  return (
    <section
      data-testid="home-dynamic-content"
      aria-labelledby="home-dynamic-content-title"
      dir={isEn ? 'ltr' : 'rtl'}
      className="relative overflow-hidden rounded-3xl border border-teal-500/15 bg-gradient-to-br from-white via-white to-slate-50/80 p-4 shadow-[0_8px_24px_-18px_rgba(15,23,42,0.28)] dark:border-[#1E3646] dark:from-[#101D26] dark:via-[#101D26] dark:to-[#142430] sm:p-5"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id="home-dynamic-content-title" className="text-sm font-black text-[var(--color-text)] dark:text-white">
            {isEn ? 'Picked for your child' : 'محتوى مختار لطفلك'}
          </h2>
          <p className="mt-1 text-[11px] leading-relaxed text-[var(--color-muted)] dark:text-[#94A3B8]">
            {isEn
              ? 'Age-aware ideas shaped by saved interests, hobbies and activities.'
              : 'أفكار مناسبة للعمر، ومرتبطة بالاهتمامات والهوايات والأنشطة المسجلة.'}
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-teal-500/15 bg-teal-500/10 px-3 py-1.5 text-[10px] font-extrabold text-teal-800 dark:text-teal-200">
          {child.name} · {signals.ageMonths === null ? (isEn ? 'Age not set' : 'العمر غير محدد') : signals.ageMonths < 24 ? (isEn ? '0–2 years' : '0–2 سنة') : signals.ageMonths < 48 ? (isEn ? '2–4 years' : '2–4 سنوات') : signals.ageMonths < 72 ? (isEn ? '4–6 years' : '4–6 سنوات') : (isEn ? '6+ years' : '6+ سنوات')}
        </span>
      </div>

      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-xs font-black text-[var(--color-text)] dark:text-white">
          {isEn ? 'A few ideas for today' : 'أفكار صغيرة لليوم'}
        </h3>
        <span className="text-[9px] font-bold text-[var(--color-muted)]">{isEn ? 'Changes with the child profile' : 'بتتغير مع بيانات الطفل'}</span>
      </div>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        {personalIdeas.map((idea) => (
          <article key={idea.id} className="flex min-w-0 gap-3 rounded-2xl border border-teal-900/5 bg-white/85 p-3 shadow-sm dark:border-[#29404D] dark:bg-[#142430]">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-500/10 text-xl" aria-hidden="true">{idea.icon}</div>
            <div className="min-w-0">
              <p className="text-[9px] font-extrabold text-teal-700 dark:text-teal-300">{idea.label}</p>
              <h4 className="mt-0.5 text-xs font-black leading-snug text-[var(--color-text)] dark:text-white">{idea.title}</h4>
              <p className="mt-1 text-[11px] leading-relaxed text-[var(--color-muted)] dark:text-[#C1CFD7]">{idea.body}</p>
              <span className="mt-2 inline-flex rounded-lg bg-slate-100 px-2 py-1 text-[9px] font-bold text-slate-600 dark:bg-[#0B131A] dark:text-slate-300">{idea.tag}</span>
            </div>
          </article>
        ))}
      </div>
      {!loaded && <p className="mt-3 text-[10px] font-semibold text-[var(--color-muted)]" aria-live="polite">{isEn ? 'Loading more reviewed ideas…' : 'بنحمّل أفكار إضافية من مكتبة المحتوى…'}</p>}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {recommendations.map(({ item }) => {
          const title = isEn ? item.title_en || item.title_ar : item.title_ar || item.title_en;
          const summary = isEn ? item.summary_en || item.body_en : item.summary_ar || item.body_ar;
          const tags = [...item.interest_tags, ...item.hobby_tags, ...item.sport_tags].slice(0, 3);
          return (
            <article
              key={item.id}
              data-testid={"dynamic-content-" + item.content_key}
              className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 shadow-sm dark:border-[#29404D] dark:bg-[#142430]"
            >
              {item.media_type === 'video' && item.media_url ? (
                <video src={item.media_url} poster={item.media_poster_url || undefined} controls playsInline preload="none" className="max-h-56 w-full bg-black object-contain" aria-label={title} />
              ) : item.media_type === 'audio' && item.media_url ? (
                <div className="bg-teal-500/5 p-4 dark:bg-[#0B131A]">
                  <div className="mb-2 text-xs font-black text-[var(--color-text)] dark:text-white">{isEn ? 'Listen' : 'استمع للمحتوى'}</div>
                  <audio src={item.media_url} controls preload="none" className="w-full" aria-label={title} />
                </div>
              ) : item.media_url ? (
                <img src={item.media_url} alt={title} loading="lazy" className="h-36 w-full object-cover" />
              ) : null}
              <div className="space-y-2.5 p-3.5">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="rounded-full bg-teal-500/10 px-2.5 py-1 text-[10px] font-extrabold text-teal-800 dark:text-teal-200">
                    {contentTypeLabel(item.content_type, isEn)}
                  </span>
                  {item.safety_level === 'sensitive' && (
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600 dark:bg-[#0B131A] dark:text-slate-300">
                      {isEn ? 'Members' : 'للأعضاء'}
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-black leading-snug text-[var(--color-text)] dark:text-white">
                  {title}
                </h3>
                {summary && (
                  <p className="text-xs leading-relaxed text-[var(--color-muted)] dark:text-[#CBD5E1]">
                    {summary}
                  </p>
                )}
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map((tag) => (
                      <span key={tag} className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600 dark:bg-[#0B131A] dark:text-slate-300">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                {item.source_name && (
                  <p className="border-t border-slate-100 pt-2 text-[10px] font-semibold text-[var(--color-muted)] dark:border-[#29404D]">
                    {isEn ? 'Source: ' : 'المصدر: '}{item.source_name}
                    {item.source_url && (
                      <a href={item.source_url} target="_blank" rel="noreferrer" className="ms-1 font-black text-teal-700 underline dark:text-teal-300">
                        {isEn ? 'Reference' : 'المرجع'}
                      </a>
                    )}
                  </p>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};

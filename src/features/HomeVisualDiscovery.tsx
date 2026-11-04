import React, { useEffect, useMemo, useState } from 'react';
import { ArrowUpLeft, ArrowUpRight, Headphones, Pause, Play, Sparkles, Volume2 } from 'lucide-react';
import type { PageId } from '../context/FamilyAppContext';
import type { LanguageCode } from '../domain/familySpaceCore';
import type { extractProfileSignals } from '../domain/contentRecommendationEngine';
import { InternalVideoFeed } from '../components/InternalVideoFeed';
import { ParentChildActivityGuide, type GuidedActivity } from './ParentChildActivityGuide';

type HomeVisualSignals = ReturnType<typeof extractProfileSignals>;

interface HomeVisualDiscoveryProps {
  language: LanguageCode;
  childName: string;
  ageLabel: string;
  signals: HomeVisualSignals | null;
  onNavigate: (page: PageId) => void;
  onCompleteActivity: (activity: GuidedActivity) => Promise<boolean>;
}

type VisualStory = {
  id: string;
  topic: string;
  minAge: number;
  maxAge: number;
  keywords: string[];
  titleAr: string;
  titleEn: string;
  bodyAr: string;
  bodyEn: string;
  activityAr: string;
  activityEn: string;
  tagAr: string;
  tagEn: string;
  image: string;
  duration: string;
  destination: { kind: 'page'; page: PageId } | { kind: 'section'; section: HomeSectionKey };
};

const VISUAL_STORIES: VisualStory[] = [
  {
    id: 'sensory-play', topic: 'learning', minAge: 0, maxAge: 30,
    keywords: ['حسي', 'ألوان', 'مكعبات', 'أصوات', 'sensory', 'blocks', 'colors'],
    titleAr: 'اكتشفوا العالم بحواس صغيرة', titleEn: 'Explore the world through little senses',
    bodyAr: 'لحظات قصيرة من اللمس والنظر والاستماع تساعد طفلك يكتشف العالم بإيقاعه.',
    bodyEn: 'Short moments of touching, looking and listening let your child explore at their own pace.',
    activityAr: 'جهّزوا ٣ خامات آمنة مختلفة، وسمّوا الملمس واللون والصوت معًا.',
    activityEn: 'Offer three safe textures and name each texture, color and sound together.',
    tagAr: 'اللعب الحسي · للسن الصغير', tagEn: 'Sensory play · Early years',
    image: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=1200&q=85',
    duration: '5–10 د', destination: { kind: 'section', section: 'learningTrack' },
  },
  {
    id: 'picture-story', topic: 'learning', minAge: 12, maxAge: 72,
    keywords: ['قصص', 'حيوانات', 'خيال', 'قراءة', 'story', 'animals', 'books'],
    titleAr: 'خلّوا الحكاية تبدأ من صورة', titleEn: 'Let one picture start the story',
    bodyAr: 'اختاروا صورة واحدة، وسيبوا طفلكم يلاحظ ويسأل ويكمل الحكاية بطريقته.',
    bodyEn: 'Choose one picture and let your child notice, ask questions and lead the story.',
    activityAr: 'اسألوه: شايف إيه؟ تتوقع إيه اللي هيحصل بعد كده؟',
    activityEn: 'Ask: What can you see? What do you think might happen next?',
    tagAr: 'اللغة والخيال', tagEn: 'Language & imagination',
    image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=1200&q=85',
    duration: '10 د', destination: { kind: 'section', section: 'learningTrack' },
  },
  {
    id: 'creative-art', topic: 'learning', minAge: 24, maxAge: 96,
    keywords: ['رسم', 'ألوان', 'فن', 'painting', 'drawing', 'art', 'watercolor'],
    titleAr: 'مساحة صغيرة للإبداع', titleEn: 'A little space for creativity',
    bodyAr: 'مش مطلوب رسمة مثالية؛ المهم مساحة آمنة للتجربة والاختيار والتعبير.',
    bodyEn: 'The goal is not a perfect picture. It is a safe space to experiment and express.',
    activityAr: 'اختاروا لونين أو ثلاثة، وسيبوا الطفل يختار شكلًا أو فكرة من خياله.',
    activityEn: 'Offer two or three colors and let your child choose what to create.',
    tagAr: 'الفن والتعبير', tagEn: 'Art & expression',
    image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=1200&q=85',
    duration: '15 د', destination: { kind: 'section', section: 'heroesArena' },
  },
  {
    id: 'active-play', topic: 'sports', minAge: 24, maxAge: 96,
    keywords: ['رياضة', 'سباحة', 'كرة', 'جري', 'حركة', 'football', 'swimming', 'sport'],
    titleAr: 'الحركة أحلى لما تبقى لعبة', titleEn: 'Movement is better when it feels like play',
    bodyAr: 'نشاط بسيط يناسب طاقة الطفل واهتمامه، من غير منافسة أو ضغط على الأداء.',
    bodyEn: 'A simple activity that fits your child’s energy and interests, without pressure to perform.',
    activityAr: 'اعملوا مسار حركة آمن في البيت أو اختاروا لعبة بالكرة حسب عمره.',
    activityEn: 'Create a safe movement path at home or play a simple ball game that fits their age.',
    tagAr: 'حركة ورياضة', tagEn: 'Movement & sports',
    image: 'https://images.unsplash.com/photo-1471286174890-9c112ffca5b4?auto=format&fit=crop&w=1200&q=85',
    duration: '10–15 د', destination: { kind: 'section', section: 'sportsTrack' },
  },
  {
    id: 'food-rhythm', topic: 'nutrition', minAge: 6, maxAge: 96,
    keywords: ['وجبة', 'تغذية', 'طعام', 'مشروب', 'meal', 'nutrition', 'food'],
    titleAr: 'اختيارات أكل تشاركوا فيها', titleEn: 'Make mealtimes a shared choice',
    bodyAr: 'خلّوا وقت الأكل فرصة للمشاركة والاستقلال، مع مراعاة احتياجات الطفل الغذائية المسجلة.',
    bodyEn: 'Make mealtimes a chance to participate and build independence while respecting the child’s recorded dietary needs.',
    activityAr: 'اعرضوا اختيارين مناسبين سبق التأكد من ملاءمتهما لحساسية الطفل واحتياجاته، وسيبوه يختار.',
    activityEn: 'Offer two options already confirmed as suitable for the child’s allergies and dietary needs, then let them choose.',
    tagAr: 'التغذية والعادات', tagEn: 'Nutrition & routines',
    image: 'https://images.unsplash.com/photo-1505576399279-565b52d4ac71?auto=format&fit=crop&w=1200&q=85',
    duration: 'وقت الوجبة', destination: { kind: 'section', section: 'dailyEssentials' },
  },
  {
    id: 'feelings-checkin', topic: 'wellbeing', minAge: 0, maxAge: 96,
    keywords: ['مشاعر', 'قلق', 'هدوء', 'تواصل', 'feelings', 'calm', 'emotion'],
    titleAr: 'دقيقة تسمعوا فيها بعض', titleEn: 'One minute to really listen',
    bodyAr: 'مش كل إحساس محتاج حل فوري. أحيانًا وجودكم وإنصاتكم هو أول خطوة.',
    bodyEn: 'Not every feeling needs an instant fix. Being present and listening can be the first step.',
    activityAr: 'اسألوا: تحب تحكي، ولا نقعد جنب بعض شوية؟',
    activityEn: 'Ask: Would you like to talk, or should we sit together for a little while?',
    tagAr: 'الأمان العاطفي', tagEn: 'Emotional safety',
    image: 'https://images.unsplash.com/photo-1491013516836-7db643ee125a?auto=format&fit=crop&w=1200&q=85',
    duration: 'دقيقة واحدة', destination: { kind: 'section', section: 'parentingSupport' },
  },
  {
    id: 'calm-evening', topic: 'sleep', minAge: 0, maxAge: 96,
    keywords: ['نوم', 'مساء', 'حدوتة', 'روتين', 'sleep', 'bedtime', 'story'],
    titleAr: 'خلّوا المساء أهدى خطوة بخطوة', titleEn: 'Make evenings calmer, one step at a time',
    bodyAr: 'إشارات متكررة وبسيطة تساعد الطفل ينتقل من نشاط اليوم إلى الراحة.',
    bodyEn: 'Simple, familiar cues can help children move from a busy day toward rest.',
    activityAr: 'خفّفوا الإضاءة، اختاروا قصة قصيرة، وقلّلوا المثيرات قبل النوم.',
    activityEn: 'Dim the lights, choose a short story and reduce stimulation before bedtime.',
    tagAr: 'النوم والروتين', tagEn: 'Sleep & routines',
    image: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1200&q=85',
    duration: '10 د', destination: { kind: 'section', section: 'dailyEssentials' },
  },
  {
    id: 'family-connection', topic: 'wellbeing', minAge: 0, maxAge: 96,
    keywords: ['أسرة', 'عائلة', 'إخوة', 'family', 'siblings', 'together'],
    titleAr: 'لحظة صغيرة تجمع الأسرة', titleEn: 'A small moment that brings everyone together',
    bodyAr: 'وقت مشترك قصير من غير شاشات، يدي لكل فرد فرصة يشارك بطريقته.',
    bodyEn: 'A short screen-free moment gives everyone in the family a chance to join in.',
    activityAr: 'كل واحد يشارك حاجة واحدة حلوة حصلت له النهارده.',
    activityEn: 'Invite everyone to share one good thing from today.',
    tagAr: 'ترابط الأسرة', tagEn: 'Family connection',
    image: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=1200&q=85',
    duration: '5 د', destination: { kind: 'section', section: 'parentingSupport' },
  },
  {
    id: 'independence', topic: 'routine', minAge: 48, maxAge: 96,
    keywords: ['استقلال', 'مسؤولية', 'مدرسة', 'ترتيب', 'school', 'independence'],
    titleAr: 'مهمة صغيرة تبني الثقة', titleEn: 'A small task that builds confidence',
    bodyAr: 'اختاروا مسؤولية بسيطة تناسب عمره، وخلّوا المحاولة أهم من النتيجة.',
    bodyEn: 'Choose one age-fit responsibility and value the attempt more than the result.',
    activityAr: 'خليه يختار بين مهمتين بسيطتين وينفذ واحدة بمساعدتكم عند الحاجة.',
    activityEn: 'Let your child choose between two simple tasks and help only when needed.',
    tagAr: 'الثقة والاستقلال', tagEn: 'Confidence & independence',
    image: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=1200&q=85',
    duration: '5–10 د', destination: { kind: 'section', section: 'valuesTrack' },
  },
];

const normalize = (value: string) => value.toLocaleLowerCase().replace(/[ًٌٍَُِّْـ]/g, '').trim();

const NEXT_ACTIVITY_BY_FAVORITE: Record<string, string> = {
  'sensory-play': 'creative-art',
  'picture-story': 'family-connection',
  'creative-art': 'sensory-play',
  'active-play': 'independence',
  'food-rhythm': 'creative-art',
  'feelings-checkin': 'calm-evening',
  'calm-evening': 'family-connection',
  'family-connection': 'picture-story',
  independence: 'active-play',
};

export const HomeVisualDiscovery: React.FC<HomeVisualDiscoveryProps> = ({
  language, childName, ageLabel, signals, onNavigate, onCompleteActivity,
}) => {
  const isEn = language === 'en';
  const [isReading, setIsReading] = useState(false);
  const [activeActivity, setActiveActivity] = useState<VisualStory | null>(null);

  const recommendations = useMemo(() => {
    const ageMonths = signals?.ageMonths ?? null;
    const profileWords = [
      ...(signals?.interests ?? []),
      ...(signals?.hobbies ?? []),
      ...(signals?.sports ?? []),
      ...(signals?.favoriteFoods ?? []),
      ...(signals?.favoriteDrinks ?? []),
      ...Object.values(signals?.sleepPreferences ?? {}).filter((value): value is string => typeof value === 'string'),
      ...Object.values(signals?.emotionalProfile ?? {}).filter((value): value is string => typeof value === 'string'),
    ].map(normalize);
    const recentTopics = signals?.recentTopics ?? [];
    const recentTitles = (signals?.recentTitles ?? []).map(normalize);
    const sharedActivityHistory = signals?.recentSharedActivities ?? [];
    const likedActivityIds = new Set(sharedActivityHistory.filter((entry) => entry.childResponse === 'loved' || entry.childResponse === 'repeat').map((entry) => entry.activityId).filter((id): id is string => Boolean(id)));
    const nextActivityIds = new Set([...likedActivityIds].map((id) => NEXT_ACTIVITY_BY_FAVORITE[id]).filter((id): id is string => Boolean(id)));
    const declinedActivityIds = new Set(sharedActivityHistory.filter((entry) => entry.childResponse === 'not_interested').map((entry) => entry.activityId).filter((id): id is string => Boolean(id)));
    const hasFoodPreferences = Boolean(signals?.favoriteFoods.length || signals?.favoriteDrinks.length);
    const dayRotation = Math.floor(Date.now() / 86400000) % VISUAL_STORIES.length;
    const ranked = VISUAL_STORIES
      .filter((story) => ageMonths === null || (ageMonths >= story.minAge && ageMonths <= story.maxAge))
      .map((story) => {
        const keywordMatches = story.keywords.filter((keyword) =>
          profileWords.some((word) => word.includes(normalize(keyword)) || normalize(keyword).includes(word))
        ).length;
        const recentPenalty = recentTopics.includes(story.topic) ? 2 : 0;
        const titlePenalty = recentTitles.some((title) =>
          story.keywords.some((keyword) => title.includes(normalize(keyword)))
        ) ? 2 : 0;
        const foodPreferenceBoost = story.topic === 'nutrition' && hasFoodPreferences ? 5 : 0;
        const nextStepBoost = nextActivityIds.has(story.id) ? 14 : 0;
        const avoidImmediateRepeat = declinedActivityIds.has(story.id) ? 10 : 0;
        return { story, score: keywordMatches * 5 + foodPreferenceBoost + nextStepBoost + (ageMonths === null ? 0 : 2) - recentPenalty - titlePenalty - avoidImmediateRepeat };
      })
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        const ai = VISUAL_STORIES.findIndex((story) => story.id === a.story.id);
        const bi = VISUAL_STORIES.findIndex((story) => story.id === b.story.id);
        return ((ai - dayRotation + VISUAL_STORIES.length) % VISUAL_STORIES.length) -
          ((bi - dayRotation + VISUAL_STORIES.length) % VISUAL_STORIES.length);
      })
      .map((entry) => entry.story);
    return ranked.slice(0, 4);
  }, [signals]);

  const featured = recommendations[0] ?? VISUAL_STORIES[0];
  const supporting = recommendations.slice(1, 4);

  useEffect(() => () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
  }, []);

  const toggleReadAloud = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') return;
    if (isReading) {
      window.speechSynthesis.cancel();
      setIsReading(false);
      return;
    }
    window.speechSynthesis.cancel();
    const spoken = [
      isEn ? featured.titleEn : featured.titleAr,
      isEn ? featured.bodyEn : featured.bodyAr,
      isEn ? featured.activityEn : featured.activityAr,
    ].join('. ');
    const utterance = new SpeechSynthesisUtterance(spoken);
    utterance.lang = isEn ? 'en-US' : 'ar-EG';
    utterance.rate = 0.92;
    utterance.onstart = () => setIsReading(true);
    utterance.onend = () => setIsReading(false);
    utterance.onerror = () => setIsReading(false);
    setIsReading(true);
    window.speechSynthesis.speak(utterance);
  };

  const openDestination = (story: VisualStory) => {
    setActiveActivity(story);
  };

  return (
    <section data-testid="home-visual-discovery" dir={isEn ? 'ltr' : 'rtl'} className="space-y-5" aria-label={isEn ? 'Personalized family discovery' : 'اكتشاف محتوى الأسرة المخصص'}>
      <div className="flex items-end justify-between gap-3 px-1">
        <div>
          <span className="text-[10px] font-black tracking-[0.18em] text-teal-700 dark:text-teal-300">NEKBAAR · DISCOVER</span>
          <h2 className="mt-1 text-xl font-black text-[var(--color-text)] dark:text-white">
            {isEn ? 'A little inspiration for ' + childName : 'حاجة جديدة نكتشفها مع ' + childName}
          </h2>
          <p className="mt-1 text-xs leading-5 text-[var(--color-muted)] dark:text-[#94A3B8]">
            {isEn ? 'Stories, movement and moments chosen around your family.' : 'حواديت وأنشطة ولحظات مختارة حسب عمر طفلك واهتماماته.'}
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-teal-500/20 bg-teal-500/10 px-3 py-1.5 text-[10px] font-extrabold text-teal-800 dark:text-teal-200">{ageLabel}</span>
      </div>

      <div data-testid="shared-discovery-loop" className="rounded-2xl border border-violet-500/15 bg-gradient-to-br from-violet-50 via-white to-teal-50/70 p-3 dark:from-[#201A39] dark:via-[#17232E] dark:to-[#12333A]">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-xs font-black text-[var(--color-text)] dark:text-white">{isEn ? 'Make it a shared experience' : 'خلّوا الاكتشاف تجربة تعيشوها سوا'}</p>
            <p className="mt-1 text-[10px] text-[var(--color-muted)]">{isEn ? 'You lead, your child explores, and you notice what matters.' : 'إنتوا تفتحوا الباب، وطفلك يكتشف، وسوا تلاحظوا اللي بيفرق.'}</p>
          </div>
          <span className="text-xl" aria-hidden="true">🪄</span>
        </div>
        <div className="mt-3 grid grid-cols-4 gap-1.5">
          {(isEn ? [{icon:'🧑‍🤝‍🧑',label:'Together'},{icon:'🎯',label:'Choose'},{icon:'🎨',label:'Explore'},{icon:'💬',label:'Reflect'}] : [{icon:'🧑‍🤝‍🧑',label:'سوا'},{icon:'🎯',label:'اختاروا'},{icon:'🎨',label:'اكتشفوا'},{icon:'💬',label:'احكوا'}]).map((step,index)=>(
            <div key={step.label} className="min-w-0 rounded-xl border border-violet-500/10 bg-white/80 px-1 py-2 text-center dark:border-white/10 dark:bg-white/5">
              <span className="block text-base">{step.icon}</span>
              <span className="mt-1 block text-[9px] font-black text-[var(--color-text)] dark:text-white">{step.label}</span>
              <span className="mt-0.5 block text-[8px] text-[var(--color-muted)]">{index+1}</span>
            </div>
          ))}
        </div>
      </div>

      <article className="group relative isolate min-h-[360px] overflow-hidden rounded-[2rem] bg-slate-950 text-white shadow-xl sm:min-h-[420px]">
        <img src={featured.image} alt={isEn ? featured.titleEn : featured.titleAr} loading="lazy" decoding="async" className="absolute inset-0 -z-20 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#06151D] via-[#06151D]/55 to-black/5" />
        <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-2 p-4">
          <span className="rounded-full border border-white/25 bg-black/25 px-3 py-1.5 text-[10px] font-extrabold text-white backdrop-blur-md">{isEn ? featured.tagEn : featured.tagAr}</span>
          <span className="rounded-full bg-white/15 px-3 py-1.5 text-[10px] font-extrabold text-white backdrop-blur-md">{featured.duration}</span>
        </div>
        <div className="absolute inset-x-0 bottom-0 space-y-3 p-5 sm:p-7">
          <div className="flex items-center gap-2 text-teal-200"><Sparkles size={15} /><span className="text-[10px] font-black tracking-wide">{isEn ? 'PICKED FOR YOUR FAMILY' : 'اختيار مناسب لاهتمامات طفلك'}</span></div>
          <h3 className="max-w-xl text-2xl font-black leading-tight sm:text-3xl">{isEn ? featured.titleEn : featured.titleAr}</h3>
          <p className="max-w-xl text-sm leading-7 text-white/85">{isEn ? featured.bodyEn : featured.bodyAr}</p>
          {(signals?.recentSharedActivities ?? []).some((entry) => NEXT_ACTIVITY_BY_FAVORITE[entry.activityId ?? ''] === featured.id && (entry.childResponse === 'loved' || entry.childResponse === 'repeat')) && (
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-amber-200/50 bg-amber-300/15 px-3 py-1.5 text-[10px] font-black text-amber-50">
              <Sparkles size={12} /> {isEn ? 'A next step based on what your child enjoyed' : 'تجربة جديدة مبنية على حاجة طفلك حبها'}
            </span>
          )}
          <div className="flex flex-wrap gap-2 pt-1">
            <button type="button" onClick={() => openDestination(featured)} className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-teal-400 px-4 py-3 text-xs font-black text-[#06242A] shadow-lg transition hover:bg-teal-300 active:scale-[.98]">
              {isEn ? 'Try it together' : 'جرّبوها مع بعض'} {isEn ? <ArrowUpRight size={16} /> : <ArrowUpLeft size={16} />}
            </button>
            <button type="button" onClick={toggleReadAloud} className="inline-flex min-h-12 items-center gap-2 rounded-2xl border border-white/30 bg-black/25 px-4 py-3 text-xs font-black text-white backdrop-blur-md transition hover:bg-white/15" aria-pressed={isReading}>
              {isReading ? <Pause size={16} /> : <Volume2 size={16} />}
              {isReading ? (isEn ? 'Stop audio' : 'إيقاف الصوت') : (isEn ? 'Listen to the idea' : 'اسمع الفكرة')}
            </button>
          </div>
        </div>
      </article>

      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div>
            <h3 className="text-base font-black text-[var(--color-text)] dark:text-white">{isEn ? 'More to explore' : 'اختيارات تانية تستاهل التجربة'}</h3>
            <p className="mt-1 text-[11px] text-[var(--color-muted)]">{isEn ? 'The mix changes with age, interests and recent activity.' : 'الاختيارات بتتغير حسب السن والاهتمامات والنشاط الأخير.'}</p>
          </div>
          <span className="text-[10px] font-bold text-teal-700 dark:text-teal-300">{isEn ? 'For you' : 'مخصص لكم'}</span>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {supporting.map((story) => (
            <button key={story.id} type="button" onClick={() => openDestination(story)} className="group overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] text-start shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-[#29404D] dark:bg-[#101D26]">
              <div className="relative h-40 overflow-hidden bg-slate-900">
                <img src={story.image} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <span className="absolute bottom-3 start-3 rounded-full border border-white/20 bg-black/50 px-2.5 py-1 text-[10px] font-extrabold text-white backdrop-blur">{story.duration}</span>
              </div>
              <div className="space-y-2 p-3.5">
                <span className="text-[10px] font-black text-teal-700 dark:text-teal-300">{isEn ? story.tagEn : story.tagAr}</span>
                <h4 className="text-sm font-black leading-6 text-[var(--color-text)] dark:text-white">{isEn ? story.titleEn : story.titleAr}</h4>
                <p className="line-clamp-3 text-[11px] leading-5 text-[var(--color-muted)] dark:text-[#94A3B8]">{isEn ? story.bodyEn : story.bodyAr}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <section className="overflow-hidden rounded-[1.75rem] border border-violet-500/20 bg-gradient-to-br from-[#201A39] via-[#2A2350] to-[#132F3C] p-4 text-white shadow-lg sm:p-5">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/10 text-violet-100"><Headphones size={23} /></span>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-black tracking-widest text-violet-200">{isEn ? 'AUDIO MOMENT' : 'لحظة صوتية'}</span>
            <h3 className="mt-1 text-base font-black">{isEn ? 'Listen, connect and slow down' : 'اسمعوا بعض.. وخدوا نفس'}</h3>
          </div>
          <button type="button" onClick={toggleReadAloud} className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white text-violet-900 transition hover:scale-105" aria-label={isReading ? 'Stop audio' : 'Play audio'}>
            {isReading ? <Pause size={19} /> : <Play size={19} />}
          </button>
        </div>
        <p className="mt-3 text-xs leading-6 text-white/80">{isEn ? featured.activityEn : featured.activityAr}</p>
        <div className="mt-3 flex items-center gap-2 text-[10px] font-bold text-violet-200"><Volume2 size={13} />{isEn ? 'Read aloud on this device' : 'تشغيل صوتي مباشر على جهازكم'}</div>
      </section>

      <section data-testid="home-video-library" className="overflow-hidden rounded-[1.75rem] border border-[#1b5360]/20 bg-gradient-to-br from-[#102C38] via-[#123A46] to-[#1B5360] p-4 text-white shadow-lg sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="text-[10px] font-black tracking-widest text-teal-200">NEKBAAR MEDIA</span>
            <h3 className="mt-1 text-base font-black">{isEn ? 'Watch and learn together' : 'شاهدوا واتعلموا مع بعض'}</h3>
            <p className="mt-1 text-[11px] leading-5 text-white/70">{isEn ? 'Approved family videos, in one safe place.' : 'فيديوهات الأسرة المعتمدة في مكان واحد.'}</p>
          </div>
          <button type="button" onClick={() => onNavigate('media')} className="min-h-11 rounded-xl border border-white/25 bg-white/10 px-3 py-2 text-[11px] font-black text-white hover:bg-white/20">{isEn ? 'Explore media' : 'استكشف الوسائط'} {isEn ? '→' : '←'}</button>
        </div>
        <InternalVideoFeed language={isEn ? 'en' : 'ar'} limit={4} onOpenLibrary={() => onNavigate('media')} />
      </section>
      {activeActivity && (
        <ParentChildActivityGuide
          activity={{
            id: activeActivity.id,
            title: isEn ? activeActivity.titleEn : activeActivity.titleAr,
            topic: activeActivity.topic,
            durationMinutes: 1,
          }}
          language={isEn ? 'en' : 'ar'}
          ageMonths={signals?.ageMonths ?? null}
          onClose={() => setActiveActivity(null)}
          onComplete={onCompleteActivity}
        />
      )}
    </section>
  );
};

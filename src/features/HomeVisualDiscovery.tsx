import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUpLeft, ArrowUpRight, ChevronLeft, ChevronRight, Headphones, Pause, Play, Sparkles, Volume2 } from 'lucide-react';
import type { PageId } from '../context/FamilyAppContext';
import type { LanguageCode } from '../domain/familySpaceCore';
import type { extractProfileSignals } from '../domain/contentRecommendationEngine';
import { InternalVideoFeed } from '../components/InternalVideoFeed';

type HomeVisualSignals = ReturnType<typeof extractProfileSignals>;
type HomeSectionKey = 'heroesArena' | 'parentingSupport' | 'valuesTrack' | 'dailyEssentials' | 'learningTrack' | 'sportsTrack';

interface HomeVisualDiscoveryProps {
  language: LanguageCode;
  childName: string;
  ageLabel: string;
  signals: HomeVisualSignals | null;
  onNavigate: (page: PageId) => void;
  onOpenSection: (section: HomeSectionKey) => void;
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
  {
    id:'language-play',topic:'learning',minAge:12,maxAge:96,keywords:['لغة','كلام','حروف','language','speech'],
    titleAr:'خلّوا الكلام لعبة بينكم',titleEn:'Turn everyday talk into a little game',
    bodyAr:'سمّوا الأشياء اللي حواليكم، استنوا إجابة الطفل، ووسعوا كلمته من غير استعجال.',bodyEn:'Name things around you, leave room for your child to respond, and gently expand their words.',
    activityAr:'اختاروا ٣ أشياء واسألوا: بنستخدم ده في إيه؟',activityEn:'Choose three nearby objects and ask what they are for.',
    tagAr:'لغة وتواصل',tagEn:'Language & communication',image:'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1200&q=85',duration:'5–10 د',destination:{kind:'section',section:'learningTrack'},
  },
  {
    id:'curiosity-lab',topic:'learning',minAge:36,maxAge:96,keywords:['علوم','تجربة','اكتشاف','science','experiment'],
    titleAr:'مختبر فضول صغير في البيت',titleEn:'A tiny curiosity lab at home',
    bodyAr:'خلّوا الطفل يتوقع ويلاحظ ويقارن؛ مش لازم نوصل لإجابة مثالية عشان نتعلم.',bodyEn:'Invite your child to predict, observe and compare. Discovery matters more than a perfect answer.',
    activityAr:'راقبوا ظل لعبة مع تغيّر مكان الضوء واسألوا: إيه اللي اتغير؟',activityEn:'Watch how a toy’s shadow changes when the light moves.',
    tagAr:'فضول واكتشاف',tagEn:'Curiosity & discovery',image:'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1200&q=85',duration:'10 د',destination:{kind:'section',section:'learningTrack'},
  },
  {
    id:'friendship-skills',topic:'wellbeing',minAge:30,maxAge:96,keywords:['أصدقاء','مشاركة','تعاون','friends','sharing'],
    titleAr:'نتعلم نلعب سوا',titleEn:'Learning to play together',
    bodyAr:'المشاركة والتناوب مهارات بتكبر بالتدريب والقدوة، مش بالأوامر أو المقارنة.',bodyEn:'Sharing and taking turns grow through practice and modeling, not pressure.',
    activityAr:'العبوا لعبة قصيرة لكل واحد فيها دور واضح.',activityEn:'Play a short turn-taking game and notice cooperation.',
    tagAr:'مهارات اجتماعية',tagEn:'Social skills',image:'https://images.unsplash.com/photo-1472162072942-cd5147eb3902?auto=format&fit=crop&w=1200&q=85',duration:'10 د',destination:{kind:'section',section:'parentingSupport'},
  },
  {
    id:'child-led-sport',topic:'sports',minAge:36,maxAge:96,keywords:['سباحة','كرة','رياضة','swimming','football','sport'],
    titleAr:'اكتشفوا الحركة اللي بيحبها',titleEn:'Find the movement your child loves',
    bodyAr:'مش كل طفل لازم يحب نفس الرياضة. راقبوا المتعة والراحة قبل الأداء.',bodyEn:'Children do not need to enjoy the same sport. Notice comfort and joy before performance.',
    activityAr:'اعرضوا اختيارين آمنين ومناسبين لعمره وسيبوه يختار.',activityEn:'Offer two safe, age-appropriate movement choices.',
    tagAr:'رياضة باختيار الطفل',tagEn:'Child-led movement',image:'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1200&q=85',duration:'10–15 د',destination:{kind:'section',section:'sportsTrack'},
  },
  {
    id:'confidence-moments',topic:'routine',minAge:24,maxAge:96,keywords:['ثقة','استقلال','محاولة','confidence','independence'],
    titleAr:'لاحظوا المحاولة قبل النتيجة',titleEn:'Notice the effort before the outcome',
    bodyAr:'وصف المحاولة بصدق يساعد الطفل يشوف تقدمه: حاول تاني أو طلب مساعدة.',bodyEn:'Naming real effort helps children notice their progress and growing independence.',
    activityAr:'سمّوا خطوة واحدة نجح الطفل يعملها بنفسه النهارده.',activityEn:'Name one step your child managed independently today.',
    tagAr:'الثقة والاستقلال',tagEn:'Confidence & independence',image:'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=1200&q=85',duration:'3–5 د',destination:{kind:'section',section:'valuesTrack'},
  },
  {
    id:'quiet-connection',topic:'sleep',minAge:0,maxAge:96,keywords:['نوم','هدوء','قرب','sleep','calm','bedtime'],
    titleAr:'إشارة هدوء يعرفها طفلك',titleEn:'A calming cue your child can recognize',
    bodyAr:'إشارة بسيطة قبل الراحة، زي حضن أو أغنية هادية أو قصة قصيرة، ممكن تساعد الانتقال للمساء.',bodyEn:'A familiar cue such as a cuddle, gentle song or short story can help mark the transition toward rest.',
    activityAr:'اختاروا إشارة لطيفة وكرروها بهدوء قبل موعد الراحة.',activityEn:'Choose one gentle cue and repeat it calmly before rest time.',
    tagAr:'روتين واحتواء',tagEn:'Rituals & connection',image:'https://images.unsplash.com/photo-1519682337058-a94d519337bc?auto=format&fit=crop&w=1200&q=85',duration:'5 د',destination:{kind:'section',section:'dailyEssentials'},
  },
];

const normalize = (value: string) => value.toLocaleLowerCase().replace(/[ًٌٍَُِّْـ]/g, '').trim();

export const HomeVisualDiscovery: React.FC<HomeVisualDiscoveryProps> = ({
  language, childName, ageLabel, signals, onNavigate, onOpenSection,
}) => {
  const isEn = language === 'en';
  const [isReading, setIsReading] = useState(false);
  const [activeCardIndex,setActiveCardIndex]=useState(0);
  const carouselRef=useRef<HTMLDivElement>(null);

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
    const hasFoodPreferences = Boolean((signals?.favoriteFoods.length || signals?.favoriteDrinks.length) && !signals?.foodRestrictions.length && !signals?.dislikedFoods.length);
    const dayRotation = Math.floor(Date.now() / 86400000) % VISUAL_STORIES.length;
    const ranked = VISUAL_STORIES
      .filter((story) => ageMonths === null || (ageMonths >= story.minAge && ageMonths <= story.maxAge))
      .map((story) => {
        const keywordMatches = story.keywords.filter((keyword) =>
          profileWords.some((word) => word.includes(normalize(keyword)) || normalize(keyword).includes(word))
        ).length;
        const recentPenalty = recentTopics.filter((topic) => topic === story.topic).length * 1.5;
        const titlePenalty = recentTitles.some((title) =>
          story.keywords.some((keyword) => title.includes(normalize(keyword)))
        ) ? 2 : 0;
        const sportsBoost = story.topic === 'sports' && Boolean(signals?.sports.length) ? 2 : 0;
        const sleepBoost = story.topic === 'sleep' && Object.keys(signals?.sleepPreferences ?? {}).length > 0 ? 2 : 0;
        const foodPreferenceBoost = story.topic === 'nutrition' && hasFoodPreferences ? 3 : 0;
        return { story, score: keywordMatches * 5 + foodPreferenceBoost + sportsBoost + sleepBoost + (ageMonths === null ? 0 : 2) - recentPenalty - titlePenalty };
      })
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        const ai = VISUAL_STORIES.findIndex((story) => story.id === a.story.id);
        const bi = VISUAL_STORIES.findIndex((story) => story.id === b.story.id);
        return ((ai - dayRotation + VISUAL_STORIES.length) % VISUAL_STORIES.length) -
          ((bi - dayRotation + VISUAL_STORIES.length) % VISUAL_STORIES.length);
      })
      .map((entry) => entry.story);
    return ranked.slice(0, 10);
  }, [signals]);

  const featured = recommendations[0] ?? VISUAL_STORIES[0];
  const supporting = recommendations.slice(1);

  useEffect(() => { setActiveCardIndex(0); }, [recommendations]);
  const moveCarousel=(direction:-1|1)=>{const next=Math.max(0,Math.min(supporting.length-1,activeCardIndex+direction));setActiveCardIndex(next);carouselRef.current?.querySelectorAll<HTMLElement>('[data-discovery-card]')[next]?.scrollIntoView({behavior:'smooth',block:'nearest',inline:'center'});};
  useEffect(() => () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
  }, []);

  const toggleReadAloud = (story: VisualStory = featured) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') return;
    if (isReading) {
      window.speechSynthesis.cancel();
      setIsReading(false);
      return;
    }
    window.speechSynthesis.cancel();
    const spoken = [
      isEn ? story.titleEn : story.titleAr,
      isEn ? story.bodyEn : story.bodyAr,
      isEn ? story.activityEn : story.activityAr,
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
    if (story.destination.kind === 'page') onNavigate(story.destination.page);
    else onOpenSection(story.destination.section);
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
        <div className="flex items-center gap-2"><button type="button" onClick={()=>moveCarousel(-1)} disabled={activeCardIndex===0} aria-label={isEn?'Previous ideas':'الأفكار السابقة'} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] disabled:opacity-35"><ChevronLeft size={18}/></button><div ref={carouselRef} className="flex min-w-0 flex-1 snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-3" style={{scrollbarWidth:'thin'}}>{supporting.map(story=><article key={story.id} data-discovery-card="true" className="group min-w-[82%] max-w-[360px] snap-center overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm sm:min-w-[42%] dark:border-[#29404D] dark:bg-[#101D26]"><button type="button" onClick={()=>openDestination(story)} className="block w-full text-start"><div className="relative h-40 overflow-hidden bg-slate-900"><img src={story.image} alt={isEn?story.titleEn:story.titleAr} loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"/><span className="absolute bottom-3 start-3 rounded-full bg-black/50 px-2.5 py-1 text-[10px] font-extrabold text-white">{story.duration}</span></div><div className="space-y-2 p-3.5"><span className="text-[10px] font-black text-teal-700 dark:text-teal-300">{isEn?story.tagEn:story.tagAr}</span><h4 className="text-sm font-black leading-6 text-[var(--color-text)] dark:text-white">{isEn?story.titleEn:story.titleAr}</h4><p className="line-clamp-3 text-[11px] leading-5 text-[var(--color-muted)]">{isEn?story.bodyEn:story.bodyAr}</p><p className="rounded-xl bg-teal-500/10 p-2 text-[10px] leading-5 text-teal-900 dark:text-teal-100">{isEn?story.activityEn:story.activityAr}</p></div></button><button type="button" onClick={()=>toggleReadAloud(story)} className="mx-3 mb-3 inline-flex min-h-10 items-center gap-2 rounded-xl border border-teal-500/25 px-3 text-[10px] font-black text-teal-800 dark:text-teal-200"><Volume2 size={14}/>{isEn?'Listen':'استمع'}</button></article>)}</div><button type="button" onClick={()=>moveCarousel(1)} disabled={activeCardIndex>=supporting.length-1} aria-label={isEn?'More ideas':'أفكار إضافية'} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-teal-700 text-white disabled:opacity-35"><ChevronRight size={18}/></button></div><div className="flex items-center justify-center gap-1.5">{supporting.map((story,index)=><span key={story.id} className={'h-1.5 rounded-full '+(activeCardIndex===index?'w-5 bg-teal-600':'w-1.5 bg-teal-500/25')}/>)}</div>
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
    </section>
  );
};

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  MEDIA_CONTENT_CATALOG,
  MediaContentItem,
  MediaTopicCategory,
  AgeStage,
  LanguageCode,
} from '../domain/familySpaceCore';
import { ThreeDIcon } from './ThreeDVisuals';
import {
  BannerSlideItem,
  PrimaryCtaButton,
  SwipeableBannerCarousel,
} from './DesignSystem';

interface MediaPlatformSectionProps {
  catalog?: MediaContentItem[];
  savedMediaIds: number[];
  onToggleSaveMedia: (id: number) => void;
  onShowToast?: (msg: string) => void;
  onSelectMediaModal?: (item: MediaContentItem) => void;
  language?: LanguageCode;
}

interface ParentingReelItem {
  id: string;
  titleAr: string;
  titleEn: string;
  creatorNameAr: string;
  creatorNameEn: string;
  creatorRoleAr: string;
  creatorRoleEn: string;
  categoryAr: string;
  categoryEn: string;
  ageStage: string;
  duration: string;
  likesBase: number;
  savesBase: number;
  captionAr: string;
  captionEn: string;
  keyTakeawaysAr: string[];
  keyTakeawaysEn: string[];
  gradientBg: string;
  iconId: 'routine' | 'children' | 'games' | 'media' | 'assistant' | 'wishes';
}

const PARENTING_REELS_FEED: ParentingReelItem[] = [
  {
    id: 'reel-1',
    titleAr: 'قاعدة الـ 3 دقائق لتهدئة نوبة الغضب فورًا بدون صراخ',
    titleEn: 'The 3-Minute Rule to Calm Toddler Tantrums Without Yelling',
    creatorNameAr: 'د. نورهان الشافعي',
    creatorNameEn: 'Dr. Nourhan El-Shafei',
    creatorRoleAr: 'أخصائية تعديل سلوك وتربية إيجابية',
    creatorRoleEn: 'Child Behavior Specialist',
    categoryAr: 'السلوك والمشاعر',
    categoryEn: 'Behavior & Emotions',
    ageStage: '2–5 سنوات',
    duration: '0:45',
    likesBase: 1420,
    savesBase: 610,
    captionAr:
      'انزلي لمستوى نظره، سمّي شعوره بهدوء («أنا شايفة إنك زعلان عشان اللعبة خلصت»)، وخدي نفس عميق معاه لمدة 30 ثانية.',
    captionEn:
      'Kneel to eye level, name the feeling calmly, and take 3 slow breaths together before giving any instruction.',
    keyTakeawaysAr: [
      '١. النزول لمستوى عين الطفل يقلل شعوره بالتهديد فورًا.',
      '٢. تسمية الشعور قبل التصحيح («أنت غضبان لأن...»).',
      '٣. تقديم خيارين بسيطين بعد الهدوء.',
    ],
    keyTakeawaysEn: [
      '1. Eye-level posture immediately lowers defensiveness.',
      '2. Validate the emotion before correcting behavior.',
      '3. Offer two simple choices once calm returns.',
    ],
    gradientBg: 'linear-gradient(155deg, #311042 0%, #6b21a8 50%, #be185d 100%)',
    iconId: 'children',
  },
  {
    id: 'reel-2',
    titleAr: '5 أنشطة مونتيسوري من مطبخك تنمي تركيز طفلك (بدون شاشات)',
    titleEn: '5 Kitchen Montessori Activities That Boost Focus (Zero Screens)',
    creatorNameAr: 'أ. مريم عبد الرحمن',
    creatorNameEn: 'Mariam Abdelrahman',
    creatorRoleAr: 'مدربة مونتيسوري وتنمية مهارات مبكرة',
    creatorRoleEn: 'Certified Montessori Educator',
    categoryAr: 'أنشطة ومهارات',
    categoryEn: 'Play & Montessori',
    ageStage: '1.5–5 سنوات',
    duration: '0:52',
    likesBase: 2180,
    savesBase: 940,
    captionAr:
      'فرز المعكرونة الملونة، نقل الماء بإسفنجة، وتقشير الموز مع ماما يقوي عضلات اليد الدقيقة ويجهز الطفل للكتابة بمتعة.',
    captionEn:
      'Sorting pasta shapes, transferring water with a sponge, and peeling a banana build fine motor strength.',
    keyTakeawaysAr: [
      '١. نقل الحبوب بالملعقة يقوي قبضة القلم.',
      '٢. مطابقة أغطية العلب ينمي التفكير المنطقي.',
      '٣. مدة النشاط المثالية 12–15 دقيقة.',
    ],
    keyTakeawaysEn: [
      '1. Spoon transfers strengthen pencil grip muscles.',
      '2. Matching jar lids builds spatial logic.',
      '3. 12–15 minutes of focused play refreshes the brain.',
    ],
    gradientBg: 'linear-gradient(155deg, #0f172a 0%, #1d4ed8 55%, #0ea5e9 100%)',
    iconId: 'games',
  },
  {
    id: 'reel-3',
    titleAr: 'روتين الـ 20 دقيقة الذهبية لنوم عميق للرضع والأطفال',
    titleEn: 'The Golden 20-Minute Wind-Down Routine for Deep Child Sleep',
    creatorNameAr: 'سارة المنيري',
    creatorNameEn: 'Sara El-Moneiry',
    creatorRoleAr: 'استشارية نوم معتمدة للأطفال والرضع',
    creatorRoleEn: 'Certified Pediatric Sleep Consultant',
    categoryAr: 'النوم والروتين',
    categoryEn: 'Sleep & Routine',
    ageStage: '0–6 سنوات',
    duration: '0:38',
    likesBase: 1890,
    savesBase: 820,
    captionAr:
      'إيقاف الشاشات قبل النوم بساعة، إضاءة دافئة خافتة، حمام دافئ سريع، وتهويدة صوتية بنفس الترتيب كل ليلة.',
    captionEn:
      'Stopping screens 1 hour before bed, warm dim lighting, a brief bath, and the same audio lullaby sequence.',
    keyTakeawaysAr: [
      '١. ثبات ترتيب الخطوات أهم من طول مدتها.',
      '٢. الإضاءة الصفراء الخافتة تحفز هرمون الميلاتونين.',
      '٣. جملة ختامية ثابتة ومطمئنة قبل إطفاء النور.',
    ],
    keyTakeawaysEn: [
      '1. Consistent sequence matters more than duration.',
      '2. Warm amber lighting stimulates natural melatonin.',
      '3. Use a calm, predictable goodnight phrase.',
    ],
    gradientBg: 'linear-gradient(155deg, #1e1b4b 0%, #3730a3 52%, #7c3aed 100%)',
    iconId: 'routine',
  },
  {
    id: 'reel-4',
    titleAr: 'أفكار لانش بوكس ذكية للأطفال الانتقائيين في الأكل',
    titleEn: 'Smart Lunchbox Ideas for Picky Eaters (Nursery & School)',
    creatorNameAr: 'د. هبة الجندي',
    creatorNameEn: 'Dr. Heba El-Gendy',
    creatorRoleAr: 'أخصائية تغذية علاجية للأطفال',
    creatorRoleEn: 'Pediatric Clinical Nutritionist',
    categoryAr: 'تغذية الطفل',
    categoryEn: 'Child Nutrition',
    ageStage: '2–8 سنوات',
    duration: '0:49',
    likesBase: 1640,
    savesBase: 775,
    captionAr:
      'قسّمي اللانش بوكس لـ 4 أقسام صغيرة بألوان مبهجة: بروتين سهل الأكل + خضار مقرمش + فاكهة محببة + صنف واحد جديد بكمية صغيرة.',
    captionEn:
      'Use a 4-compartment box: easy protein, crunchy veggies, favorite fruit, and one tiny portion of a new food.',
    keyTakeawaysAr: [
      '١. تقديم الصنف الجديد بجانب صنفين يحبهما الطفل.',
      '٢. تقطيع الخضار بأشكال صغيرة سهلة الالتقاط.',
      '٣. تجنب المقارنة أو الضغط أثناء وجبة الطعام.',
    ],
    keyTakeawaysEn: [
      '1. Pair 1 tiny new food next to 2 familiar favorites.',
      '2. Bite-sized shapes make veggies fun to pick up.',
      '3. Keep mealtime pressure-free.',
    ],
    gradientBg: 'linear-gradient(155deg, #064e3b 0%, #0d9488 55%, #0284c7 100%)',
    iconId: 'wishes',
  },
];

export const MediaPlatformSection: React.FC<MediaPlatformSectionProps> = ({
  catalog = MEDIA_CONTENT_CATALOG,
  savedMediaIds,
  onToggleSaveMedia,
  onShowToast = () => {},
  language = 'ar',
}) => {
  const isEn = language === 'en';
  const [mediaViewMode, setMediaViewMode] = useState<'reels' | 'library' | 'audio'>('reels');
  const [activeReelIndex, setActiveReelIndex] = useState<number>(0);
  const [likedReelIds, setLikedReelIds] = useState<string[]>(['reel-1']);
  const [savedReelIds, setSavedReelIds] = useState<string[]>(['reel-2']);
  const [reelPlaying, setReelPlaying] = useState<boolean>(true);
  const [reelCategoryFilter] = useState<string>('all');

  const [selectedType, setSelectedType] = useState<'all' | 'video' | 'audio' | 'article' | 'guide' | 'gallery' | 'saved'>('all');
  const [selectedTopic] = useState<'all' | MediaTopicCategory>('all');
  const [selectedStage, setSelectedStage] = useState<AgeStage>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeItem, setActiveItem] = useState<MediaContentItem | null>(null);

  // Interactive Audio Player State
  const audioItems = useMemo(() => catalog.filter((c) => c.type === 'audio' && c.audioConfig), [catalog]);
  const [selectedAudioId] = useState<number>(audioItems[0]?.id || 105);
  const activeAudioItem = useMemo(
    () => audioItems.find((a) => a.id === selectedAudioId) || audioItems[0],
    [audioItems, selectedAudioId]
  );
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioProgressSec, setAudioProgressSec] = useState(0);
  const [audioSpeed, setAudioSpeed] = useState<0.75 | 1 | 1.25 | 1.5>(1);
  const [audioVolume] = useState(0.75);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Interactive Video Player State
  const videoItems = useMemo(() => catalog.filter((c) => c.type === 'video' && c.videoConfig), [catalog]);
  const [selectedVideoId, setSelectedVideoId] = useState<number>(videoItems[0]?.id || 101);
  const activeVideoItem = useMemo(
    () => videoItems.find((v) => v.id === selectedVideoId) || videoItems[0],
    [videoItems, selectedVideoId]
  );
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [videoProgressSec, setVideoProgressSec] = useState(0);
  const [videoCaptionsOn, setVideoCaptionsOn] = useState(true);
  const [videoSpeed, setVideoSpeed] = useState<1 | 1.25 | 1.5>(1);

  const filteredReels = useMemo(() => {
    if (reelCategoryFilter === 'all') return PARENTING_REELS_FEED;
    return PARENTING_REELS_FEED.filter(
      (r) => r.categoryAr === reelCategoryFilter || r.categoryEn === reelCategoryFilter
    );
  }, [reelCategoryFilter]);

  const currentReel = filteredReels[activeReelIndex % Math.max(1, filteredReels.length)] || PARENTING_REELS_FEED[0];

  const triggerGentleChime = (freqHz: number, vol: number) => {
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContextClass();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freqHz, ctx.currentTime);
      gain.gain.setValueAtTime(Math.max(0.01, vol * 0.08), ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.48);
    } catch {
      // Ignore Web Audio restriction
    }
  };

  useEffect(() => {
    if (!audioPlaying || !activeAudioItem?.audioConfig) return;
    const total = activeAudioItem.audioConfig.durationSeconds;
    const notes = activeAudioItem.audioConfig.melodyNotesHz;
    const timer = window.setInterval(() => {
      setAudioProgressSec((prev) => {
        const next = prev + 1;
        if (next >= total) {
          setAudioPlaying(false);
          return 0;
        }
        const noteHz = notes[next % notes.length] || 330;
        triggerGentleChime(noteHz, audioVolume);
        return next;
      });
    }, Math.round(1000 / audioSpeed));
    return () => window.clearInterval(timer);
  }, [audioPlaying, activeAudioItem, audioSpeed, audioVolume]);

  useEffect(() => {
    if (!videoPlaying || !activeVideoItem?.videoConfig) return;
    const total = activeVideoItem.videoConfig.durationSeconds;
    const timer = window.setInterval(() => {
      setVideoProgressSec((prev) => {
        if (prev + 1 >= total) {
          setVideoPlaying(false);
          return 0;
        }
        return prev + 1;
      });
    }, Math.round(1000 / videoSpeed));
    return () => window.clearInterval(timer);
  }, [videoPlaying, activeVideoItem, videoSpeed]);

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return catalog.filter((item) => {
      if (selectedType === 'saved' && !savedMediaIds.includes(item.id)) return false;
      if (selectedType !== 'all' && selectedType !== 'saved' && item.type !== selectedType) return false;
      if (selectedTopic !== 'all' && item.topic !== selectedTopic) return false;
      if (selectedStage !== 'all' && item.ageStage !== 'all' && item.ageStage !== selectedStage) return false;
      if (!q) return true;
      const haystack = `${item.title} ${item.titleEn} ${item.summary} ${item.summaryEn} ${item.tags.join(' ')}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [catalog, savedMediaIds, selectedType, selectedTopic, selectedStage, searchQuery]);

  const formatSec = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const mediaBanners: BannerSlideItem[] = [
    {
      id: 'media-slide-reels',
      badge: isEn ? '📱 Vertical Reels 9:16' : '📱 ريلز الأسرة القصيرة 9:16',
      title: isEn
        ? '60-Second Parenting Reels from Specialists'
        : 'فيديوهات ريلز تربوية سريعة من المتخصصين',
      subtitle: isEn
        ? 'Tantrums · Montessori · Sleep · Nutrition'
        : 'تهدئة الغضب · أنشطة مونتيسوري · النوم · التغذية',
      ctaLabel: isEn ? 'Watch Vertical Reels' : 'شاهد الريلز الآن',
      onCtaClick: () => setMediaViewMode('reels'),
      iconId: 'video',
      gradient: 'linear-gradient(125deg, #eef2ff, #f5f3ff, #fdf2f8)',
      ctaVariant: 'indigo',
    },
    {
      id: 'media-slide-audio',
      badge: isEn ? '🎵 Bedtime Lullabies' : '🎵 قصص وتهويدات قبل النوم',
      title: isEn
        ? 'Calming Audio Stories & Melodies for Deep Sleep'
        : 'قصص صوتية وتهويدات هادئة لنوم عميق لطفلك',
      subtitle: isEn
        ? 'Screen-Free · Gentle Chimes · 0–8 Yrs'
        : 'بدون شاشات · نغمات مريحة · لعمر 0–8 سنوات',
      ctaLabel: isEn ? 'Open Audio Studio' : 'شغّل القصص الصوتية',
      onCtaClick: () => setMediaViewMode('audio'),
      iconId: 'audio',
      gradient: 'linear-gradient(125deg, #f5f3ff, #ede9fe, #e0f2fe)',
      ctaVariant: 'purple',
    },
  ];

  return (
    <section className="space-y-5" aria-label={isEn ? 'Media, Videos & Reels Hub' : 'مركز الميديا والريلز التربوية'}>
      {/* Swipeable Media Banners */}
      <SwipeableBannerCarousel
        slides={mediaBanners}
        language={language}
        ariaLabel={isEn ? 'Media Highlights Carousel' : 'لافتات الميديا والريلز المتحركة'}
      />

      {/* Mode Switcher Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-indigo-50/90 border border-indigo-200/80 w-max max-w-full">
        <button
          type="button"
          onClick={() => setMediaViewMode('reels')}
          className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-extrabold transition-colors whitespace-nowrap ${
            mediaViewMode === 'reels'
              ? 'bg-indigo-600 text-white shadow-2xs'
              : 'text-indigo-950 hover:bg-indigo-100/70'
          }`}
        >
          📱 {isEn ? 'Vertical Reels (9:16)' : 'ريلز الأسرة (9:16)'}
        </button>
        <button
          type="button"
          onClick={() => setMediaViewMode('library')}
          className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-extrabold transition-colors whitespace-nowrap ${
            mediaViewMode === 'library'
              ? 'bg-indigo-600 text-white shadow-2xs'
              : 'text-indigo-950 hover:bg-indigo-100/70'
          }`}
        >
          🎥 {isEn ? 'Videos & Guides' : 'الفيديو والأدلة'}
        </button>
        <button
          type="button"
          onClick={() => setMediaViewMode('audio')}
          className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-extrabold transition-colors whitespace-nowrap ${
            mediaViewMode === 'audio'
              ? 'bg-indigo-600 text-white shadow-2xs'
              : 'text-indigo-950 hover:bg-indigo-100/70'
          }`}
        >
          🎵 {isEn ? 'Audio Lullabies' : 'القصص الصوتية'}
        </button>
      </div>

      {/* MODE 1: VERTICAL SWIPEABLE REELS EXPERIENCE (9:16) */}
      {mediaViewMode === 'reels' && (
        <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-5 items-start">
          {/* Vertical 9:16 Reel Player Frame */}
          <div
            className="rounded-[28px] p-5 text-white flex flex-col justify-between min-h-[520px] relative overflow-hidden shadow-xl border border-white/15"
            style={{ background: currentReel.gradientBg }}
          >
            <div className="flex items-center justify-between gap-2 z-10">
              <div className="flex items-center gap-2 text-xs font-bold bg-black/30 backdrop-blur-xs px-3 py-1.5 rounded-full">
                <span>🎬 {isEn ? currentReel.categoryEn : currentReel.categoryAr}</span>
                <span>·</span>
                <span dir="ltr" className="tabular-nums">{currentReel.duration}</span>
              </div>
              <button
                type="button"
                onClick={() => setReelPlaying((p) => !p)}
                className="px-3 py-1.5 rounded-full bg-white/20 hover:bg-white/30 text-xs font-bold backdrop-blur-xs"
              >
                {reelPlaying ? (isEn ? '⏸ Pause' : '⏸ إيقاف') : isEn ? '▶ Play' : '▶ تشغيل'}
              </button>
            </div>

            <div className="my-auto py-6 text-center space-y-4 z-10">
              <div className="mx-auto w-20 h-20 rounded-3xl bg-white/15 backdrop-blur-xs border border-white/25 flex items-center justify-center shadow-lg">
                <ThreeDIcon id={currentReel.iconId} size={54} />
              </div>
              <div className="space-y-2 px-2">
                <span className="text-[11px] font-bold text-indigo-200">
                  👶 {currentReel.ageStage}
                </span>
                <h3 className="text-lg sm:text-xl font-extrabold leading-snug">
                  {isEn ? currentReel.titleEn : currentReel.titleAr}
                </h3>
                <p className="text-xs text-white/90 leading-relaxed bg-black/35 backdrop-blur-xs rounded-2xl p-3.5">
                  {isEn ? currentReel.captionEn : currentReel.captionAr}
                </p>
              </div>
            </div>

            <div className="space-y-3 z-10 pt-2 border-t border-white/15">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-extrabold">
                    {isEn ? currentReel.creatorNameEn : currentReel.creatorNameAr} · ✅
                  </div>
                  <div className="text-[11px] text-white/75">
                    {isEn ? currentReel.creatorRoleEn : currentReel.creatorRoleAr}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const liked = likedReelIds.includes(currentReel.id);
                      setLikedReelIds((prev) =>
                        liked ? prev.filter((id) => id !== currentReel.id) : [...prev, currentReel.id]
                      );
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold backdrop-blur-xs ${
                      likedReelIds.includes(currentReel.id)
                        ? 'bg-rose-500 text-white'
                        : 'bg-white/15 text-white hover:bg-white/25'
                    }`}
                  >
                    ♥{' '}
                    <span dir="ltr" className="tabular-nums">
                      {currentReel.likesBase + (likedReelIds.includes(currentReel.id) ? 1 : 0)}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const saved = savedReelIds.includes(currentReel.id);
                      setSavedReelIds((prev) =>
                        saved ? prev.filter((id) => id !== currentReel.id) : [...prev, currentReel.id]
                      );
                      onShowToast(
                        saved
                          ? isEn
                            ? 'Removed Reel from saved list'
                            : 'تمت إزالة الريل من المحفوظات'
                          : isEn
                          ? 'Saved Reel for quick reference'
                          : 'تم حفظ الريل للرجوع إليه لاحقًا'
                      );
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold backdrop-blur-xs ${
                      savedReelIds.includes(currentReel.id)
                        ? 'bg-amber-400 text-slate-950'
                        : 'bg-white/15 text-white hover:bg-white/25'
                    }`}
                  >
                    🌟 {savedReelIds.includes(currentReel.id) ? (isEn ? 'Saved' : 'محفوظ') : isEn ? 'Save' : 'حفظ'}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                <button
                  type="button"
                  onClick={() =>
                    setActiveReelIndex(
                      (i) => (i - 1 + filteredReels.length) % filteredReels.length
                    )
                  }
                  className="flex-1 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-xs font-extrabold text-center"
                >
                  ↑ {isEn ? 'Prev Reel' : 'الريل السابق'}
                </button>
                <span dir="ltr" className="text-xs font-bold tabular-nums px-2">
                  {(activeReelIndex % filteredReels.length) + 1} / {filteredReels.length}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setActiveReelIndex((i) => (i + 1) % filteredReels.length)
                  }
                  className="flex-1 py-2 rounded-xl bg-white text-slate-900 hover:bg-indigo-50 text-xs font-extrabold text-center"
                >
                  ↓ {isEn ? 'Next Reel' : 'الريل التالي'}
                </button>
              </div>
            </div>
          </div>

          {/* Right Panel: Reel Takeaways + All Reels Grid Cards */}
          <div className="space-y-4">
            <div className="rounded-[24px] border border-indigo-200/80 bg-indigo-50/70 p-5 space-y-3 shadow-2xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-base font-extrabold text-[var(--color-text)]">
                  💡 {isEn ? 'Quick Actionable Steps' : 'خطوات عملية سريعة'}
                </h3>
                <span className="px-2.5 py-0.5 rounded-lg bg-indigo-100 text-indigo-900 text-xs font-extrabold">
                  {currentReel.ageStage}
                </span>
              </div>
              <div className="space-y-2">
                {(isEn ? currentReel.keyTakeawaysEn : currentReel.keyTakeawaysAr).map((step, i) => (
                  <div
                    key={i}
                    className="rounded-2xl bg-white border border-indigo-100 p-3 text-xs font-bold text-slate-800 shadow-2xs"
                  >
                    {step}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-3 shadow-2xs">
              <h3 className="text-base font-extrabold text-[var(--color-text)]">
                🎞️ {isEn ? 'All Parenting Reels' : 'قائمة الريلز المختارة'}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PARENTING_REELS_FEED.map((reel, idx) => {
                  const isCurrent = reel.id === currentReel.id;
                  return (
                    <button
                      key={reel.id}
                      type="button"
                      onClick={() => setActiveReelIndex(idx)}
                      className={`p-3.5 rounded-2xl border text-start transition-all flex items-start gap-3 ${
                        isCurrent
                          ? 'border-indigo-600 bg-indigo-50/80 shadow-2xs'
                          : 'border-[var(--color-border)] bg-[var(--color-control-bg)] hover:border-indigo-300'
                      }`}
                    >
                      <div className="w-11 h-11 rounded-2xl bg-white shadow-2xs flex items-center justify-center shrink-0">
                        <ThreeDIcon id={reel.iconId} size={28} />
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="text-xs font-extrabold text-[var(--color-text)] line-clamp-2 leading-snug">
                          {isEn ? reel.titleEn : reel.titleAr}
                        </div>
                        <div className="text-[11px] font-bold text-[var(--color-muted)]">
                          {isEn ? reel.creatorNameEn : reel.creatorNameAr} ·{' '}
                          <span dir="ltr" className="tabular-nums">{reel.duration}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODE 2: VIDEO PLAYER & EDUCATIONAL GUIDES LIBRARY */}
      {mediaViewMode === 'library' && (
        <div className="space-y-5">
          {activeVideoItem && activeVideoItem.videoConfig && (
            <div className="rounded-[24px] border border-indigo-200/80 bg-indigo-50/60 p-5 grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-5 items-center shadow-2xs">
              <div
                className="rounded-2xl p-5 text-white flex flex-col justify-between min-h-[220px]"
                style={{
                  background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 55%, #4c1d95 100%)',
                }}
              >
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-bold text-indigo-200">
                    🎥 {isEn ? 'Educational Video' : 'فيديو تربوي تفاعلي'}
                  </span>
                  <span dir="ltr" className="tabular-nums font-mono">
                    {formatSec(videoProgressSec)} / {formatSec(activeVideoItem.videoConfig.durationSeconds)}
                  </span>
                </div>

                <div className="my-auto py-4 text-center space-y-2">
                  <div className="text-base font-extrabold">
                    {isEn ? activeVideoItem.titleEn : activeVideoItem.title}
                  </div>
                  {videoCaptionsOn && (
                    <div className="mx-auto max-w-md rounded-xl bg-black/55 px-3.5 py-2 text-xs text-white leading-relaxed">
                      {
                        (isEn
                          ? activeVideoItem.videoConfig.captionsEn
                          : activeVideoItem.videoConfig.captionsAr)[
                          Math.min(
                            2,
                            Math.floor(
                              (videoProgressSec /
                                Math.max(1, activeVideoItem.videoConfig.durationSeconds)) *
                                3
                            )
                          )
                        ]
                      }
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <input
                    type="range"
                    min={0}
                    max={activeVideoItem.videoConfig.durationSeconds}
                    value={videoProgressSec}
                    onChange={(e) => setVideoProgressSec(Number(e.target.value))}
                    aria-label={isEn ? 'Seek video timeline' : 'تقديم أو تأخير الفيديو'}
                    className="w-full accent-indigo-400 cursor-pointer"
                  />
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setVideoPlaying((p) => !p)}
                      className="px-4 py-1.5 rounded-xl text-xs font-extrabold bg-white text-indigo-950"
                    >
                      {videoPlaying ? (isEn ? '⏸ Pause' : '⏸ إيقاف') : isEn ? '▶ Play Video' : '▶ تشغيل الفيديو'}
                    </button>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setVideoCaptionsOn((c) => !c)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                          videoCaptionsOn ? 'bg-indigo-500 text-white' : 'bg-white/15 text-white'
                        }`}
                      >
                        CC
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setVideoSpeed((s) => (s === 1 ? 1.25 : s === 1.25 ? 1.5 : 1))
                        }
                        className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white/15 text-white tabular-nums"
                      >
                        <span dir="ltr">{videoSpeed}x</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-xs font-extrabold text-indigo-900">
                  🎬 {isEn ? 'Select Educational Video' : 'اختر الفيديو التربوي'}
                </div>
                <select
                  value={selectedVideoId}
                  onChange={(e) => {
                    setSelectedVideoId(Number(e.target.value));
                    setVideoProgressSec(0);
                    setVideoPlaying(false);
                  }}
                  aria-label={isEn ? 'Select educational video' : 'اختيار الفيديو التربوي'}
                  className="w-full rounded-2xl border border-[var(--color-border)] bg-white px-3.5 py-2.5 text-xs font-extrabold text-[var(--color-text)]"
                >
                  {videoItems.map((v) => (
                    <option key={v.id} value={v.id}>
                      {isEn ? v.titleEn : v.title}
                    </option>
                  ))}
                </select>
                <div className="text-xs font-semibold text-[var(--color-muted)] leading-relaxed">
                  {isEn ? activeVideoItem.summaryEn : activeVideoItem.summary}
                </div>
              </div>
            </div>
          )}

          {/* Filter & Search Bar for Articles/Guides */}
          <div className="rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 space-y-3 shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: 'all', label: isEn ? 'All Media' : 'الكل' },
                  { id: 'video', label: isEn ? '🎬 Videos' : '🎬 فيديوهات' },
                  { id: 'guide', label: isEn ? '📘 Guides' : '📘 أدلة عملية' },
                  { id: 'saved', label: isEn ? `🌟 Saved (${savedMediaIds.length})` : `🌟 المحفوظات (${savedMediaIds.length})` },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSelectedType(tab.id as typeof selectedType)}
                    className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-colors whitespace-nowrap ${
                      selectedType === tab.id
                        ? 'bg-indigo-600 text-white'
                        : 'bg-[var(--color-control-muted)] text-[var(--color-muted)]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <select
                value={selectedStage}
                onChange={(e) => setSelectedStage(e.target.value as AgeStage)}
                aria-label={isEn ? 'Filter by child age' : 'تصفية حسب عمر الطفل'}
                className="min-h-[38px] rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-3 py-1.5 text-xs font-extrabold text-[var(--color-text)]"
              >
                <option value="all">{isEn ? 'All Ages (0–8 yrs)' : 'كل الأعمار (0–8)'}</option>
                <option value="0-2">{isEn ? '0–2 Years' : '0–2 سنوات'}</option>
                <option value="2-5">{isEn ? '2–5 Years' : '2–5 سنوات'}</option>
                <option value="5-8">{isEn ? '5–8 Years' : '5–8 سنوات'}</option>
              </select>
            </div>

            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isEn ? '🔍 Search videos and parenting guides...' : '🔍 ابحث في الفيديوهات والأدلة التربوية...'}
              className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-4 py-2.5 text-xs sm:text-sm font-semibold text-[var(--color-text)]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => {
              const isSaved = savedMediaIds.includes(item.id);
              return (
                <article
                  key={item.id}
                  className="rounded-[24px] border border-indigo-200/80 bg-indigo-50/60 p-5 flex flex-col justify-between gap-4 shadow-2xs"
                >
                  <div className="space-y-2">
                    <div className="text-xs font-extrabold text-indigo-800">
                      {item.type === 'video' ? '🎬 ' : '📘 '}
                      {item.durationLabel} · 👶 {item.ageStage === 'all' ? '0–8' : item.ageStage}
                    </div>
                    <h3 className="text-base font-extrabold text-[var(--color-text)] leading-snug">
                      {isEn ? item.titleEn : item.title}
                    </h3>
                    <div className="text-xs font-semibold text-[var(--color-muted)] line-clamp-2">
                      {isEn ? item.summaryEn : item.summary}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-3 border-t border-indigo-200/60">
                    <PrimaryCtaButton
                      variant="indigo"
                      size="sm"
                      onClick={() => setActiveItem(item)}
                    >
                      {isEn ? 'Open Guide' : 'عرض التفاصيل'}
                    </PrimaryCtaButton>
                    <button
                      type="button"
                      onClick={() => onToggleSaveMedia(item.id)}
                      className="min-h-[40px] px-3.5 py-2 rounded-2xl text-xs font-extrabold border border-[var(--color-border)] bg-white"
                    >
                      {isSaved ? (isEn ? '🌟 Saved' : '🌟 محفوظ') : isEn ? '🔖 Save' : '🔖 حفظ'}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}

      {/* MODE 3: BEDTIME AUDIO STORIES & LULLABIES STUDIO */}
      {mediaViewMode === 'audio' && activeAudioItem && activeAudioItem.audioConfig && (
        <div className="rounded-[24px] border border-purple-200/80 bg-purple-50/75 p-5 sm:p-6 space-y-4 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white shadow-2xs flex items-center justify-center shrink-0">
                <ThreeDIcon id="audio" size={34} />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-[var(--color-text)]">
                  {isEn ? activeAudioItem.titleEn : activeAudioItem.title}
                </h3>
                <div className="text-xs font-semibold text-[var(--color-muted)]">
                  {isEn ? activeAudioItem.summaryEn : activeAudioItem.summary}
                </div>
              </div>
            </div>
            <span dir="ltr" className="px-3 py-1 rounded-xl bg-white text-purple-900 text-xs font-extrabold tabular-nums shadow-2xs">
              {formatSec(audioProgressSec)} / {formatSec(activeAudioItem.audioConfig.durationSeconds)}
            </span>
          </div>

          <input
            type="range"
            min={0}
            max={activeAudioItem.audioConfig.durationSeconds}
            value={audioProgressSec}
            onChange={(e) => setAudioProgressSec(Number(e.target.value))}
            aria-label={isEn ? 'Audio timeline' : 'شريط تقدم القصة الصوتية'}
            className="w-full accent-purple-600 cursor-pointer"
          />

          <div className="rounded-2xl bg-white border border-purple-100 p-4 text-xs font-semibold text-[var(--color-text)] leading-relaxed shadow-2xs">
            {isEn ? activeAudioItem.audioConfig.transcriptEn : activeAudioItem.audioConfig.transcriptAr}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <PrimaryCtaButton
              variant="purple"
              onClick={() => {
                const nextState = !audioPlaying;
                setAudioPlaying(nextState);
                if (nextState) {
                  triggerGentleChime(activeAudioItem.audioConfig?.melodyNotesHz[0] || 330, audioVolume);
                }
              }}
            >
              {audioPlaying ? (isEn ? '⏸ Pause Audio Story' : '⏸ إيقاف القصة الصوتية') : isEn ? '▶ Play Bedtime Story' : '▶ تشغيل القصة والتهويدة'}
            </PrimaryCtaButton>

            <div className="flex items-center gap-1.5 text-xs">
              <span className="font-bold text-[var(--color-muted)]">{isEn ? 'Speed:' : 'السرعة:'}</span>
              {([0.75, 1, 1.25, 1.5] as const).map((spd) => (
                <button
                  key={spd}
                  type="button"
                  onClick={() => setAudioSpeed(spd)}
                  className={`px-2.5 py-1 rounded-xl font-extrabold tabular-nums ${
                    audioSpeed === spd
                      ? 'bg-purple-700 text-white'
                      : 'bg-white text-[var(--color-text)]'
                  }`}
                >
                  <span dir="ltr">{spd}x</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Reader Modal */}
      {activeItem && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-xl rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 space-y-4 max-h-[85vh] overflow-y-auto shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-lg font-extrabold text-[var(--color-text)]">
                {isEn ? activeItem.titleEn : activeItem.title}
              </h3>
              <button
                type="button"
                onClick={() => setActiveItem(null)}
                className="px-3 py-1 rounded-xl text-xs font-extrabold border border-[var(--color-border)]"
              >
                {isEn ? 'Close' : 'إغلاق'}
              </button>
            </div>
            <div className="space-y-2.5 text-sm text-[var(--color-text)] leading-relaxed">
              {(isEn && activeItem.bodyEn ? activeItem.bodyEn : activeItem.body).map((line, i) => (
                <p key={i} className="rounded-2xl bg-indigo-50/70 border border-indigo-100 p-3.5">
                  {line}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

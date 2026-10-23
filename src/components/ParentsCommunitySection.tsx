import React, { useState, useMemo } from 'react';
import { LanguageCode } from '../domain/familySpaceCore';
import {
  BannerSlideItem,
  PASTEL_CARD_TONES,
  PastelTone,
  PrimaryCtaButton,
  SwipeableBannerCarousel,
} from './DesignSystem';

interface CommunityComment {
  id: number;
  authorAr: string;
  authorEn: string;
  roleBadgeAr: string;
  roleBadgeEn: string;
  isVerifiedExpert?: boolean;
  textAr: string;
  textEn: string;
  timeLabel: string;
}

interface CommunityPost {
  id: number;
  authorAr: string;
  authorEn: string;
  authorCityAr: string;
  authorCityEn: string;
  childAgeLabelAr: string;
  childAgeLabelEn: string;
  topicId: 'sleep' | 'nutrition' | 'nursery' | 'behavior' | 'experiences';
  topicLabelAr: string;
  topicLabelEn: string;
  titleAr: string;
  titleEn: string;
  bodyAr: string;
  bodyEn: string;
  timeAgoAr: string;
  timeAgoEn: string;
  likes: number;
  helpfulCount: number;
  comments: CommunityComment[];
}

const TOPIC_TONE_MAP: Record<CommunityPost['topicId'], PastelTone> = {
  nursery: 'indigo',
  behavior: 'rose',
  nutrition: 'emerald',
  sleep: 'purple',
  experiences: 'amber',
};

const INITIAL_COMMUNITY_POSTS: CommunityPost[] = [
  {
    id: 501,
    authorAr: 'نهى محمود (أم عمر وليلى)',
    authorEn: 'Noha Mahmoud (Mom of Omar & Laila)',
    authorCityAr: 'القاهرة الجديدة',
    authorCityEn: 'New Cairo',
    childAgeLabelAr: '3 سنوات و 5 سنوات',
    childAgeLabelEn: '3 yrs & 5 yrs',
    topicId: 'nursery',
    topicLabelAr: 'الحضانات والمدارس',
    topicLabelEn: 'Nurseries & Schools',
    titleAr: 'تجربتي مع أول أسبوع حضانة لبنتي (3 سنوات) وكيف تغلبنا على قلق الانفصال',
    titleEn: 'Our first week of nursery at age 3 and how we overcame separation anxiety',
    bodyAr:
      'تطبيق طقس الوداع القصير الواضح (حضن + وعد بالعودة بعد الغداء + اختيار لعبة صغيرة في الشنطة) فرق معانا من رابع يوم!',
    bodyEn:
      'Keeping a short, predictable goodbye ritual (hug + clear pickup promise after lunch) made a huge difference by day 4!',
    timeAgoAr: 'منذ ساعتين',
    timeAgoEn: '2h ago',
    likes: 48,
    helpfulCount: 31,
    comments: [
      {
        id: 1,
        authorAr: 'د. سلمى الكيلاني',
        authorEn: 'Dr. Salma El-Kilany',
        roleBadgeAr: '🩺 استشاري تربوي ونفسي معتمد (موثّق)',
        roleBadgeEn: '🩺 Verified Child Psychologist',
        isVerifiedExpert: true,
        textAr:
          'تجربة رائعة يا نهى! ثبات موعد الاستلام وعدم التسلل دون وداع يبني ثقة الطفل في المكان.',
        textEn:
          'Wonderful approach! Predictable pickup times and never sneaking away build lasting trust.',
        timeLabel: '1h ago',
      },
      {
        id: 2,
        authorAr: 'أحمد سامي (أب لزين)',
        authorEn: 'Ahmed Samy (Dad of Zain)',
        roleBadgeAr: 'ولي أمر',
        roleBadgeEn: 'Parent',
        textAr: 'شكرًا جدًا على المشاركة، بدأنا نطبق نفس الخطوة مع زين وفرقت معاه فعلًا.',
        textEn: 'Thank you for sharing! We tried the same step with Zain and it really helped.',
        timeLabel: '35m ago',
      },
    ],
  },
  {
    id: 502,
    authorAr: 'خالد العتيبي (أبو ريان)',
    authorEn: 'Khaled Al-Otaibi (Dad of Rayan)',
    authorCityAr: 'الرياض',
    authorCityEn: 'Riyadh',
    childAgeLabelAr: '5 سنوات',
    childAgeLabelEn: '5 yrs',
    topicId: 'behavior',
    topicLabelAr: 'السلوك والمشاعر',
    topicLabelEn: 'Behavior & Emotions',
    titleAr: 'سؤال للآباء والأمهات: كيف تنظمون وقت الشاشات في عطلة نهاية الأسبوع؟',
    titleEn: 'Question for parents: How do you structure screen time on weekends?',
    bodyAr:
      'اتفقنا في البيت على 30 دقيقة فقط بعد الغداء بشرط نلعب معاه لعبة حركية أو مكعبات بعدها. إيه البدائل اللي نجحت مع أطفالكم؟',
    bodyEn:
      'We agreed on 30 minutes after lunch followed by physical play or building blocks. What alternatives worked well for your 5-year-olds?',
    timeAgoAr: 'منذ 5 ساعات',
    timeAgoEn: '5h ago',
    likes: 39,
    helpfulCount: 27,
    comments: [
      {
        id: 3,
        authorAr: 'سارة المنيري',
        authorEn: 'Sara El-Moneiry',
        roleBadgeAr: 'أم ومستشارة تربوية',
        roleBadgeEn: 'Parent & Educator',
        textAr:
          'استخدام مؤقت بصري (ساعة رملية أو منبه لطيف) قبل انتهاء الوقت بـ 5 دقائق يمنع الصدام.',
        textEn:
          'Using a visual timer 5 minutes before screen time ends prevents frustration.',
        timeLabel: '3h ago',
      },
    ],
  },
  {
    id: 503,
    authorAr: 'ياسمين فؤاد (أم ليان)',
    authorEn: 'Yasmine Fouad (Mom of Layan)',
    authorCityAr: 'الإسكندرية',
    authorCityEn: 'Alexandria',
    childAgeLabelAr: '14 شهرًا',
    childAgeLabelEn: '14 months',
    topicId: 'nutrition',
    topicLabelAr: 'التغذية واللانش بوكس',
    topicLabelEn: 'Child Nutrition',
    titleAr: 'أفكار فطور غني بالحديد والكالسيوم للرضع بعد عمر السنة',
    titleEn: 'Iron & calcium-rich breakfast ideas for toddlers after 12 months',
    bodyAr:
      'جربت الشوفان المطبوخ بالحليب مع التمر المهروس والسمسم المطحون بدون سكر مضاف وكانت ممتازة جدًا.',
    bodyEn:
      'Oats with mashed dates and ground sesame with zero added sugar worked great for us.',
    timeAgoAr: 'أمس',
    timeAgoEn: 'Yesterday',
    likes: 64,
    helpfulCount: 52,
    comments: [],
  },
];

interface ParentsCommunitySectionProps {
  parentName: string;
  city: string;
  language: LanguageCode;
  onShowToast: (msg: string) => void;
}

export const ParentsCommunitySection: React.FC<ParentsCommunitySectionProps> = ({
  parentName,
  city,
  language,
  onShowToast,
}) => {
  const isEn = language === 'en';
  const [posts, setPosts] = useState<CommunityPost[]>(INITIAL_COMMUNITY_POSTS);
  const [topicFilter, setTopicFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [likedIds, setLikedIds] = useState<number[]>([501]);
  const [helpfulIds, setHelpfulIds] = useState<number[]>([503]);
  const [expandedPostId, setExpandedPostId] = useState<number | null>(501);
  const [commentDrafts, setCommentDrafts] = useState<Record<number, string>>({});

  // New Post Composer State
  const [composerOpen, setComposerOpen] = useState<boolean>(false);
  const [newPostTitle, setNewPostTitle] = useState<string>('');
  const [newPostBody, setNewPostBody] = useState<string>('');
  const [newPostTopic, setNewPostTopic] = useState<CommunityPost['topicId']>('experiences');
  const [newPostAge, setNewPostAge] = useState<string>('2–5 سنوات');

  const filteredPosts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return posts.filter((p) => {
      if (topicFilter !== 'all' && p.topicId !== topicFilter) return false;
      if (!q) return true;
      const haystack = `${p.titleAr} ${p.titleEn} ${p.bodyAr} ${p.bodyEn} ${p.authorAr}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [posts, topicFilter, searchQuery]);

  const handlePublishPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostTitle.trim() || !newPostBody.trim()) {
      onShowToast(isEn ? 'Please enter a title and post content' : 'يرجى كتابة عنوان ومحتوى المشاركة');
      return;
    }

    const topicLabels: Record<CommunityPost['topicId'], { ar: string; en: string }> = {
      sleep: { ar: 'نوم الرضع والروتين', en: 'Sleep & Routine' },
      nutrition: { ar: 'التغذية واللانش بوكس', en: 'Child Nutrition' },
      nursery: { ar: 'الحضانات والمدارس', en: 'Nurseries & Schools' },
      behavior: { ar: 'السلوك والمشاعر', en: 'Behavior & Emotions' },
      experiences: { ar: 'تجارب الأمهات والآباء', en: 'Parent Experiences' },
    };

    const created: CommunityPost = {
      id: Date.now(),
      authorAr: parentName,
      authorEn: parentName,
      authorCityAr: city,
      authorCityEn: city,
      childAgeLabelAr: newPostAge,
      childAgeLabelEn: newPostAge,
      topicId: newPostTopic,
      topicLabelAr: topicLabels[newPostTopic].ar,
      topicLabelEn: topicLabels[newPostTopic].en,
      titleAr: newPostTitle.trim(),
      titleEn: newPostTitle.trim(),
      bodyAr: newPostBody.trim(),
      bodyEn: newPostBody.trim(),
      timeAgoAr: 'الآن',
      timeAgoEn: 'Just now',
      likes: 1,
      helpfulCount: 1,
      comments: [],
    };

    setPosts((prev) => [created, ...prev]);
    setNewPostTitle('');
    setNewPostBody('');
    setComposerOpen(false);
    setExpandedPostId(created.id);
    onShowToast(isEn ? 'Post published to Parents Community!' : 'تم نشر مشاركتك في مجتمع الوالدين!');
  };

  const handleAddComment = (postId: number) => {
    const text = (commentDrafts[postId] || '').trim();
    if (!text) return;
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              comments: [
                ...p.comments,
                {
                  id: Date.now(),
                  authorAr: parentName,
                  authorEn: parentName,
                  roleBadgeAr: 'ولي أمر',
                  roleBadgeEn: 'Parent',
                  textAr: text,
                  textEn: text,
                  timeLabel: isEn ? 'Just now' : 'الآن',
                },
              ],
            }
          : p
      )
    );
    setCommentDrafts((prev) => ({ ...prev, [postId]: '' }));
    onShowToast(isEn ? 'Comment added' : 'تمت إضافة تعليقك');
  };

  const communityBanners: BannerSlideItem[] = [
    {
      id: 'comm-slide-share',
      badge: isEn ? '🤝 Safe Parents Community' : '🤝 مجتمع الآباء والأمهات',
      title: isEn
        ? 'Share Experiences & Get Verified Specialist Replies'
        : 'شارك تجربتك اليومية واحصل على ردود الخبراء الموثقين',
      subtitle: isEn
        ? `${posts.length} Active Discussions · Grouped by Age (0–8 Yrs)`
        : `${posts.length} نقاشات نشطة · مصنفة حسب عمر الطفل (0–8 سنوات)`,
      ctaLabel: isEn ? '+ Publish Post or Question' : '+ انشر تجربة أو سؤال الآن',
      onCtaClick: () => setComposerOpen(true),
      iconId: 'star',
      gradient: 'linear-gradient(125deg, #fff7ed, #ffedd5, #fde8ef)',
      ctaVariant: 'orange',
    },
    {
      id: 'comm-slide-nursery',
      badge: isEn ? '🏫 Nursery & School Tips' : '🏫 تجارب الحضانات والمدارس',
      title: isEn
        ? 'How Parents Overcame First-Week Nursery Anxiety'
        : 'كيف تغلب الآباء على قلق الأسبوع الأول في الحضانة؟',
      subtitle: isEn
        ? 'Real Parent Tips · Psychologist Reviewed'
        : 'تجارب واقعية · نصائح استشاريين نفسيين',
      ctaLabel: isEn ? 'Filter Nursery Topics' : 'استعرض تجارب الحضانات',
      onCtaClick: () => setTopicFilter('nursery'),
      iconId: 'children',
      gradient: 'linear-gradient(125deg, #eef2ff, #e0e7ff, #fae8ff)',
      ctaVariant: 'indigo',
    },
    {
      id: 'comm-slide-nutrition',
      badge: isEn ? '🍎 Nutrition & Sleep' : '🍎 التغذية والروتين اليومي',
      title: isEn
        ? 'Healthy Toddler Breakfasts & Calm Bedtime Routines'
        : 'أفكار فطور صحية للرضع وروتين نوم هادئ بدون شاشات',
      subtitle: isEn
        ? 'No Added Sugar · Practical Daily Ideas'
        : 'بدون سكر مضاف · وصفات مجربة من الأمهات',
      ctaLabel: isEn ? 'Explore Nutrition Tips' : 'تصفح نقاشات التغذية',
      onCtaClick: () => setTopicFilter('nutrition'),
      iconId: 'routine',
      gradient: 'linear-gradient(125deg, #ecfdf5, #d1fae5, #fef3c7)',
      ctaVariant: 'emerald',
    },
  ];

  return (
    <section className="space-y-5" aria-label={isEn ? 'Parents Community' : 'مجتمع الوالدين'}>
      {/* Swipeable Community Banner Carousel */}
      <SwipeableBannerCarousel
        slides={communityBanners}
        language={language}
        ariaLabel={isEn ? 'Community Highlights Carousel' : 'لافتات مجتمع الآباء المتحركة'}
      />

      {/* Post Composer Drawer */}
      {composerOpen && (
        <form
          onSubmit={handlePublishPost}
          className="rounded-[24px] border-2 border-orange-300 bg-[var(--color-surface)] p-5 space-y-4 shadow-md"
        >
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base font-extrabold text-[var(--color-text)]">
              ✍️ {isEn ? 'New Community Post or Question' : 'مشاركة جديدة في مجتمع الوالدين'}
            </h3>
            <button
              type="button"
              onClick={() => setComposerOpen(false)}
              className="px-3 py-1 rounded-xl text-xs font-extrabold border border-[var(--color-border)]"
            >
              {isEn ? 'Close' : 'إغلاق'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-extrabold text-[var(--color-text)] mb-1">
                {isEn ? 'Topic Category' : 'قسم النقاش'}
              </label>
              <select
                value={newPostTopic}
                onChange={(e) => setNewPostTopic(e.target.value as CommunityPost['topicId'])}
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-3 py-2 text-xs font-bold text-[var(--color-text)]"
              >
                <option value="experiences">{isEn ? 'Parent Experiences' : 'تجارب الأمهات والآباء'}</option>
                <option value="sleep">{isEn ? 'Sleep & Routine' : 'نوم الرضع والروتين'}</option>
                <option value="nutrition">{isEn ? 'Child Nutrition' : 'التغذية واللانش بوكس'}</option>
                <option value="nursery">{isEn ? 'Nurseries & Schools' : 'الحضانات والمدارس'}</option>
                <option value="behavior">{isEn ? 'Behavior & Emotions' : 'السلوك والمشاعر'}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-extrabold text-[var(--color-text)] mb-1">
                {isEn ? 'Child Age Stage' : 'المرحلة العمرية للطفل'}
              </label>
              <select
                value={newPostAge}
                onChange={(e) => setNewPostAge(e.target.value)}
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-3 py-2 text-xs font-bold text-[var(--color-text)]"
              >
                <option value="0–2 سنوات">{isEn ? '0–2 Years' : 'من أول يوم لـ سنتين (0–2)'}</option>
                <option value="2–5 سنوات">{isEn ? '2–5 Years' : 'من 2 إلى 5 سنوات'}</option>
                <option value="5–8 سنوات">{isEn ? '5–8 Years' : 'من 5 إلى 8 سنوات'}</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-[var(--color-text)] mb-1">
              {isEn ? 'Post Title / Question' : 'عنوان السؤال أو التجربة'}
            </label>
            <input
              type="text"
              value={newPostTitle}
              onChange={(e) => setNewPostTitle(e.target.value)}
              placeholder={
                isEn
                  ? 'e.g., How did you transition your toddler to a big bed?'
                  : 'مثال: إزاي شجعتم أطفالكم على ترتيب ألعابهم بعد اللعب؟'
              }
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-3.5 py-2 text-sm text-[var(--color-text)]"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-[var(--color-text)] mb-1">
              {isEn ? 'Details' : 'تفاصيل المشاركة'}
            </label>
            <textarea
              value={newPostBody}
              onChange={(e) => setNewPostBody(e.target.value)}
              placeholder={
                isEn
                  ? 'Share context so other parents and specialists can help...'
                  : 'اكتب تفاصيل سؤالك أو تجربتك ليستفيد باقي الآباء والأمهات...'
              }
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] p-3.5 text-sm text-[var(--color-text)] min-h-[84px]"
            />
          </div>

          <div className="flex justify-end gap-2">
            <PrimaryCtaButton type="submit" variant="orange" size="sm">
              {isEn ? 'Publish to Community' : 'نشر في المجتمع الآن'}
            </PrimaryCtaButton>
          </div>
        </form>
      )}

      {/* Topic Filter Bar, Search & Quick New Post Button */}
      <div className="rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 space-y-3 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', labelAr: 'الكل', labelEn: 'All' },
              { id: 'nursery', labelAr: '🏫 الحضانات', labelEn: '🏫 Nurseries' },
              { id: 'behavior', labelAr: '💛 السلوك', labelEn: '💛 Behavior' },
              { id: 'nutrition', labelAr: '🍎 التغذية', labelEn: '🍎 Nutrition' },
              { id: 'sleep', labelAr: '🌙 النوم', labelEn: '🌙 Sleep' },
              { id: 'experiences', labelAr: '✨ التجارب', labelEn: '✨ Experiences' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTopicFilter(tab.id)}
                className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-colors whitespace-nowrap ${
                  topicFilter === tab.id
                    ? 'bg-orange-600 text-white shadow-2xs'
                    : 'bg-[var(--color-control-muted)] text-[var(--color-muted)] hover:text-[var(--color-text)]'
                }`}
              >
                {isEn ? tab.labelEn : tab.labelAr}
              </button>
            ))}
          </div>

          <PrimaryCtaButton
            variant="orange"
            size="sm"
            onClick={() => setComposerOpen((v) => !v)}
          >
            ✍️ {isEn ? '+ New Post' : '+ مشاركة جديدة'}
          </PrimaryCtaButton>
        </div>

        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={
            isEn
              ? '🔍 Search parent discussions, questions, or cities...'
              : '🔍 ابحث في نقاشات وتجارب الوالدين (حضانة، فطور، شاشات)...'
          }
          className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-4 py-2.5 text-xs sm:text-sm font-semibold text-[var(--color-text)]"
        />
      </div>

      {/* Community Feed Cards with Soft Pastel Tints */}
      <div className="space-y-4">
        {filteredPosts.map((post) => {
          const isLiked = likedIds.includes(post.id);
          const isHelpful = helpfulIds.includes(post.id);
          const isExpanded = expandedPostId === post.id;
          const tone = PASTEL_CARD_TONES[TOPIC_TONE_MAP[post.topicId] || 'amber'];

          return (
            <article
              key={post.id}
              className={`rounded-[24px] border ${tone.card} bg-[var(--color-surface)] p-5 space-y-3.5 shadow-2xs`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--color-muted)]">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-white border border-orange-200 text-orange-900 font-extrabold flex items-center justify-center shrink-0 shadow-2xs">
                    {(isEn ? post.authorEn : post.authorAr).slice(0, 1)}
                  </div>
                  <div>
                    <div className="font-extrabold text-[var(--color-text)]">
                      {isEn ? post.authorEn : post.authorAr}
                    </div>
                    <div className="text-[11px] font-bold text-[var(--color-muted)]">
                      📍 {isEn ? post.authorCityEn : post.authorCityAr} · 👶{' '}
                      {isEn ? post.childAgeLabelEn : post.childAgeLabelAr} ·{' '}
                      {isEn ? post.timeAgoEn : post.timeAgoAr}
                    </div>
                  </div>
                </div>

                <span className={`px-2.5 py-1 rounded-xl text-[11px] font-extrabold ${tone.badge}`}>
                  {isEn ? post.topicLabelEn : post.topicLabelAr}
                </span>
              </div>

              <div className="space-y-1.5">
                <h3 className="text-base sm:text-lg font-extrabold text-[var(--color-text)] leading-snug">
                  {isEn ? post.titleEn : post.titleAr}
                </h3>
                <p className="text-xs sm:text-sm text-[var(--color-muted)] leading-relaxed">
                  {isEn ? post.bodyEn : post.bodyAr}
                </p>
              </div>

              {/* Reaction & Comment Actions */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[var(--color-border)]/70">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setLikedIds((prev) =>
                        isLiked ? prev.filter((id) => id !== post.id) : [...prev, post.id]
                      )
                    }
                    className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-extrabold border transition-colors ${
                      isLiked
                        ? 'bg-orange-600 text-white border-orange-600'
                        : 'bg-white text-[var(--color-text)] border-[var(--color-border)]'
                    }`}
                  >
                    ❤️ {isEn ? 'Like' : 'أعجبني'} ·{' '}
                    <span dir="ltr" className="tabular-nums">
                      {post.likes + (isLiked ? 1 : 0)}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setHelpfulIds((prev) =>
                        isHelpful ? prev.filter((id) => id !== post.id) : [...prev, post.id]
                      )
                    }
                    className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-extrabold border transition-colors ${
                      isHelpful
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-[var(--color-text)] border-[var(--color-border)]'
                    }`}
                  >
                    💡 {isEn ? 'Helpful' : 'مفيد'} ·{' '}
                    <span dir="ltr" className="tabular-nums">
                      {post.helpfulCount + (isHelpful ? 1 : 0)}
                    </span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setExpandedPostId(isExpanded ? null : post.id)}
                  className="min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-extrabold bg-white border border-[var(--color-border)] text-[var(--color-text)]"
                >
                  💬 {isEn ? `Comments (${post.comments.length})` : `الردود (${post.comments.length})`}
                </button>
              </div>

              {/* Comments Thread */}
              {isExpanded && (
                <div className="pt-3 space-y-2.5 border-t border-[var(--color-border)]/70">
                  {post.comments.map((c) => (
                    <div
                      key={c.id}
                      className={`rounded-2xl p-3.5 text-xs space-y-1 ${
                        c.isVerifiedExpert
                          ? 'bg-emerald-50/90 border border-emerald-200'
                          : 'bg-white/90 border border-[var(--color-border)]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-extrabold text-[var(--color-text)]">
                          {isEn ? c.authorEn : c.authorAr}{' '}
                          <span className="font-bold text-emerald-800">
                            · {isEn ? c.roleBadgeEn : c.roleBadgeAr}
                          </span>
                        </span>
                        <span dir="ltr" className="text-[11px] text-[var(--color-muted)] tabular-nums">
                          {c.timeLabel}
                        </span>
                      </div>
                      <p className="text-[var(--color-text)] leading-relaxed">
                        {isEn ? c.textEn : c.textAr}
                      </p>
                    </div>
                  ))}

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      value={commentDrafts[post.id] || ''}
                      onChange={(e) =>
                        setCommentDrafts((prev) => ({ ...prev, [post.id]: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddComment(post.id);
                        }
                      }}
                      placeholder={
                        isEn
                          ? 'Write a supportive reply...'
                          : 'اكتب تعليقًا داعمًا أو شارك تجربتك...'
                      }
                      className="flex-1 rounded-xl border border-[var(--color-border)] bg-white px-3.5 py-2 text-xs font-semibold text-[var(--color-text)]"
                    />
                    <PrimaryCtaButton
                      variant="orange"
                      size="sm"
                      onClick={() => handleAddComment(post.id)}
                    >
                      {isEn ? 'Reply' : 'إرسال'}
                    </PrimaryCtaButton>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
};

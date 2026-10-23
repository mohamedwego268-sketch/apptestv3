import React, { useState, useMemo } from 'react';
import { LanguageCode } from '../domain/familySpaceCore';
import { ThreeDIcon } from './ThreeDVisuals';

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
      'كنت شايلة هم أول أسبوع في الحضانة جدًا، لكن تطبيق طقس الوداع القصير الواضح (حضن + وعد بالعودة بعد الغداء + اختيار لعبة صغيرة في الشنطة) فرق معانا من رابع يوم! حبيت أشارككم التجربة لو حد بيجهز طفله للحضانة الشهر ده.',
    bodyEn:
      'I was worried about our first week at nursery, but keeping a short, predictable goodbye ritual (hug + clear pickup promise after lunch) made a huge difference by day 4!',
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
          'تجربة رائعة يا نهى! ثبات موعد الاستلام وعدم التسلل دون وداع يبني ثقة الطفل في المكان وفي وعد الوالدين.',
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
      'ريان عمره 5 سنوات ويحب الألعاب التفاعلية، اتفقنا في البيت على 30 دقيقة فقط بعد الغداء بشرط نلعب معاه لعبة حركية أو مكعبات بعدها. إيه البدائل اللي نجحت مع أطفالكم في نفس السن؟',
    bodyEn:
      'Rayan is 5 and loves interactive games. We agreed on 30 minutes after lunch followed by physical play or building blocks. What alternatives worked well for your 5-year-olds?',
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
          'استخدام مؤقت بصري (ساعة رملية أو منبه لطيف) قبل انتهاء الوقت بـ 5 دقائق يمنع الصدام وقت إغلاق الشاشة.',
        textEn:
          'Using a visual timer 5 minutes before screen time ends prevents frustration when turning it off.',
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
      'شاركوني وصفات سريعة للفطور الصباحي بدون سكر مضاف، جربت الشوفان المطبوخ بالحليب مع التمر المهروس والسمسم المطحون وكانت ممتازة جدًا.',
    bodyEn:
      'Share your quick no-added-sugar toddler breakfast recipes! Oats with mashed dates and ground sesame worked great for us.',
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

  return (
    <section className="space-y-6" aria-label={isEn ? 'Parents Community' : 'مجتمع الوالدين'}>
      {/* Warm Coral-Amber Community Personality Hero */}
      <div
        className="rounded-[24px] p-5 sm:p-7 border border-orange-200/80 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6"
        style={{
          background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 52%, #fef3c7 100%)',
          boxShadow: '0 16px 34px -14px rgba(234, 88, 12, 0.14)',
        }}
      >
        <div className="space-y-2.5 max-w-2xl">
          <div className="text-xs font-extrabold text-orange-800">
            🤝 {isEn ? 'Safe & Moderated Parents Community (Demo)' : 'مجتمع الآباء والأمهات التفاعلي (بيئة آمنة ومعتدلة — عرض تجريبي)'}
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
            {isEn
              ? 'Share Real Parenting Experiences, Ask Questions & Learn from Specialists'
              : 'تبادلوا الخبرات اليومية، اطرحوا الأسئلة، وتفاعلوا مع آباء وأمهات ومتخصصين'}
          </h2>
          <p className="text-sm text-slate-700 leading-relaxed">
            {isEn
              ? 'Discover discussions grouped by child age and topic, react to helpful experiences, and get verified specialist commentary.'
              : 'مساحة مجتمعية مخصصة للوالدين لمناقشة تجارب الحضانات، النوم، التغذية، وتعديل السلوك مع ردود موثقة من المتخصصين.'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setComposerOpen((v) => !v)}
          className="px-5 py-3 rounded-2xl text-xs font-extrabold bg-orange-600 text-white hover:bg-orange-700 transition-colors whitespace-nowrap shrink-0 shadow-sm"
        >
          ✍️ {isEn ? '+ Publish Post or Ask a Question' : '+ انشر تجربة أو اطرح سؤالًا للوالدين'}
        </button>
      </div>

      {/* Post Composer Drawer */}
      {composerOpen && (
        <form
          onSubmit={handlePublishPost}
          className="rounded-[22px] border-2 border-orange-300 bg-[var(--color-surface)] p-5 space-y-4"
        >
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base font-extrabold text-[var(--color-text)]">
              ✍️ {isEn ? 'Create a Community Post or Question' : 'مشاركة جديدة في مجتمع الوالدين'}
            </h3>
            <button
              type="button"
              onClick={() => setComposerOpen(false)}
              className="px-3 py-1 rounded-lg text-xs font-bold border border-[var(--color-border)]"
            >
              {isEn ? 'Close' : 'إغلاق'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[var(--color-text)] mb-1">
                {isEn ? 'Topic Category' : 'قسم النقاش'}
              </label>
              <select
                value={newPostTopic}
                onChange={(e) => setNewPostTopic(e.target.value as CommunityPost['topicId'])}
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-3 py-2 text-xs text-[var(--color-text)]"
              >
                <option value="experiences">{isEn ? 'Parent Experiences' : 'تجارب الأمهات والآباء'}</option>
                <option value="sleep">{isEn ? 'Sleep & Routine' : 'نوم الرضع والروتين'}</option>
                <option value="nutrition">{isEn ? 'Child Nutrition' : 'التغذية واللانش بوكس'}</option>
                <option value="nursery">{isEn ? 'Nurseries & Schools' : 'الحضانات والمدارس'}</option>
                <option value="behavior">{isEn ? 'Behavior & Emotions' : 'السلوك والمشاعر'}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--color-text)] mb-1">
                {isEn ? 'Child Age Stage' : 'المرحلة العمرية للطفل'}
              </label>
              <select
                value={newPostAge}
                onChange={(e) => setNewPostAge(e.target.value)}
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-3 py-2 text-xs text-[var(--color-text)]"
              >
                <option value="0–2 سنوات">{isEn ? '0–2 Years' : 'من أول يوم لـ سنتين (0–2)'}</option>
                <option value="2–5 سنوات">{isEn ? '2–5 Years' : 'من 2 إلى 5 سنوات'}</option>
                <option value="5–8 سنوات">{isEn ? '5–8 Years' : 'من 5 إلى 8 سنوات'}</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--color-text)] mb-1">
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
            <label className="block text-xs font-bold text-[var(--color-text)] mb-1">
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
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] p-3.5 text-sm text-[var(--color-text)] min-h-[90px]"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-xs font-extrabold bg-orange-600 text-white"
            >
              {isEn ? 'Publish to Community' : 'نشر في المجتمع الآن'}
            </button>
          </div>
        </form>
      )}

      {/* Topic Filter Bar & Search */}
      <div className="rounded-[18px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'all', labelAr: 'كل النقاشات', labelEn: 'All Discussions' },
            { id: 'nursery', labelAr: 'الحضانات والمدارس', labelEn: 'Nurseries & Schools' },
            { id: 'behavior', labelAr: 'السلوك والمشاعر', labelEn: 'Behavior & Emotions' },
            { id: 'nutrition', labelAr: 'التغذية واللانش بوكس', labelEn: 'Child Nutrition' },
            { id: 'sleep', labelAr: 'نوم الرضع والروتين', labelEn: 'Sleep & Routine' },
            { id: 'experiences', labelAr: 'تجارب الأمهات والآباء', labelEn: 'Parent Experiences' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setTopicFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                topicFilter === tab.id
                  ? 'bg-orange-600 text-white'
                  : 'bg-[var(--color-control-muted)] text-[var(--color-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              {isEn ? tab.labelEn : tab.labelAr}
            </button>
          ))}
        </div>

        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={
            isEn
              ? 'Search parent discussions, questions, or cities...'
              : 'ابحث في نقاشات وتجارب الوالدين (مثلًا: حضانة، فطور، شاشات)...'
          }
          className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-3.5 py-2 text-xs text-[var(--color-text)]"
        />
      </div>

      {/* Community Feed */}
      <div className="space-y-4">
        {filteredPosts.map((post) => {
          const isLiked = likedIds.includes(post.id);
          const isHelpful = helpfulIds.includes(post.id);
          const isExpanded = expandedPostId === post.id;

          return (
            <article
              key={post.id}
              className="rounded-[22px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--color-muted)]">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-900 font-extrabold flex items-center justify-center shrink-0">
                    {(isEn ? post.authorEn : post.authorAr).slice(0, 1)}
                  </div>
                  <div>
                    <div className="font-extrabold text-[var(--color-text)]">
                      {isEn ? post.authorEn : post.authorAr}
                    </div>
                    <div className="text-[11px] text-[var(--color-muted)]">
                      📍 {isEn ? post.authorCityEn : post.authorCityAr} ·{' '}
                      {isEn ? post.childAgeLabelEn : post.childAgeLabelAr} ·{' '}
                      {isEn ? post.timeAgoEn : post.timeAgoAr}
                    </div>
                  </div>
                </div>

                <span className="text-xs font-bold text-orange-800">
                  {isEn ? post.topicLabelEn : post.topicLabelAr}
                </span>
              </div>

              <div className="space-y-2">
                <h3 className="text-base sm:text-lg font-extrabold text-[var(--color-text)] leading-snug">
                  {isEn ? post.titleEn : post.titleAr}
                </h3>
                <p className="text-sm text-[var(--color-muted)] leading-relaxed">
                  {isEn ? post.bodyEn : post.bodyAr}
                </p>
              </div>

              {/* Reaction & Comment Actions */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[var(--color-border)]">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setLikedIds((prev) =>
                        isLiked ? prev.filter((id) => id !== post.id) : [...prev, post.id]
                      )
                    }
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                      isLiked
                        ? 'bg-orange-600 text-white border-orange-600'
                        : 'bg-[var(--color-control-bg)] text-[var(--color-text)] border-[var(--color-border)]'
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
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                      isHelpful
                        ? 'bg-emerald-700 text-white border-emerald-700'
                        : 'bg-[var(--color-control-bg)] text-[var(--color-text)] border-[var(--color-border)]'
                    }`}
                  >
                    💡 {isEn ? 'Helpful Experience' : 'تجربة مفيدة'} ·{' '}
                    <span dir="ltr" className="tabular-nums">
                      {post.helpfulCount + (isHelpful ? 1 : 0)}
                    </span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setExpandedPostId(isExpanded ? null : post.id)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[var(--color-control-muted)] text-[var(--color-text)]"
                >
                  💬 {isEn ? `Comments (${post.comments.length})` : `التعليقات والردود (${post.comments.length})`}
                </button>
              </div>

              {/* Comments Thread */}
              {isExpanded && (
                <div className="pt-3 space-y-3 border-t border-[var(--color-border)]">
                  {post.comments.map((c) => (
                    <div
                      key={c.id}
                      className={`rounded-xl p-3.5 text-xs space-y-1 ${
                        c.isVerifiedExpert
                          ? 'bg-emerald-50/80 border border-emerald-200'
                          : 'bg-[var(--color-control-muted)]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-extrabold text-[var(--color-text)]">
                          {isEn ? c.authorEn : c.authorAr}{' '}
                          <span className="font-semibold text-emerald-800">
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
                          ? 'Write a supportive reply or share your tip...'
                          : 'اكتب تعليقًا داعمًا أو شارك تجربتك...'
                      }
                      className="flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-3 py-2 text-xs text-[var(--color-text)]"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddComment(post.id)}
                      className="px-4 py-2 rounded-xl text-xs font-extrabold bg-orange-600 text-white whitespace-nowrap"
                    >
                      {isEn ? 'Reply' : 'إرسال'}
                    </button>
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

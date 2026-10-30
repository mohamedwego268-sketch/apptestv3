import React, { useState, useMemo } from 'react';
import { LanguageCode, sanitizeUserText } from '../domain/familySpaceCore';
import {
  BannerSlideItem,
  CollapsibleSectionCard,
  FriendlyEmptyState,
  MasterPatternCard,
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
    authorAr: 'نهى محمود (ماما عمر وليلى)',
    authorEn: 'Noha Mahmoud (Mom of Omar & Laila)',
    authorCityAr: 'القاهرة الجديدة',
    authorCityEn: 'New Cairo',
    childAgeLabelAr: '3 سنوات و 5 سنوات',
    childAgeLabelEn: '3 yrs & 5 yrs',
    topicId: 'nursery',
    topicLabelAr: 'الحضانات والمدارس',
    topicLabelEn: 'Nurseries & Schools',
    titleAr: 'تجربتي مع أول أسبوع حضانة لطفلتي (3 سنوات) وكيف تجاوزنا قلق الصباح بسهولة',
    titleEn: 'Our first week of nursery at age 3 and how we overcame separation anxiety',
    bodyAr:
      'أهلًا بكم جميعًا، خطوة الوداع السريع الواضح (حضن مطمئن + وعد واضح بالحضور بعد الغداء مباشرة + اصطحاب دمية صغيرة مفضلة في الحقيبة) أحدثت فارقًا كبيرًا معنا منذ اليوم الرابع!',
    bodyEn:
      'Keeping a short, predictable goodbye ritual (hug + clear pickup promise after lunch) made a huge difference by day 4!',
    timeAgoAr: 'منذ ساعتين',
    timeAgoEn: '2h ago',
    likes: 84,
    helpfulCount: 62,
    comments: [
      {
        id: 1,
        authorAr: 'مساهم من المجتمع',
        authorEn: 'Community contributor',
        roleBadgeAr: '🩺 مساهمة مجتمعية',
        roleBadgeEn: '🩺 Community contributor',
        isVerifiedExpert: false,
        textAr:
          'خطوة ممتازة يا نهى! ثبات موعد الاستلام وتوديع الطفل بوضوح بدل الانصراف المفاجئ يبني أمانًا وثقة كبيرة في الحضانة.',
        textEn:
          'Wonderful approach! Predictable pickup times and never sneaking away build lasting trust.',
        timeLabel: '1h ago',
      },
      {
        id: 2,
        authorAr: 'أحمد سامي (أبو زين)',
        authorEn: 'Ahmed Samy (Dad of Zain)',
        roleBadgeAr: 'ولي أمر',
        roleBadgeEn: 'Parent',
        textAr: 'شكرًا جزيلًا على هذه النصيحة، جربناها اليوم مع زين وأحدثت فرقًا واضحًا عند البوابة.',
        textEn: 'Thank you for sharing! We tried the same step with Zain and it really helped.',
        timeLabel: '35m ago',
      },
    ],
  },
  {
    id: 502,
    authorAr: 'كريم الشافعي (أبو آدم)',
    authorEn: 'Karim El-Shafei (Dad of Adam)',
    authorCityAr: 'الشيخ زايد',
    authorCityEn: 'Sheikh Zayed',
    childAgeLabelAr: '5 سنوات',
    childAgeLabelEn: '5 yrs',
    topicId: 'behavior',
    topicLabelAr: 'السلوك والمشاعر',
    topicLabelEn: 'Behavior & Emotions',
    titleAr: 'سؤال للآباء والأمهات: كيف تنظمون وقت الأجهزة والشاشات في عطلة نهاية الأسبوع؟',
    titleEn: 'Question for parents: How do you structure screen time on weekends?',
    bodyAr:
      'اتفقنا في المنزل على نصف ساعة فقط بعد الغداء بشرط أن نلعب بعدها بازل أو نخرج لركوب الدراجة في النادي. ما الأفكار والبدائل التي نجحت مع أطفالكم بهدوء؟',
    bodyEn:
      'We agreed on 30 minutes after lunch followed by physical play or building blocks. What alternatives worked well for your 5-year-olds?',
    timeAgoAr: 'منذ 4 ساعات',
    timeAgoEn: '4h ago',
    likes: 73,
    helpfulCount: 51,
    comments: [
      {
        id: 3,
        authorAr: 'مساهمة من المجتمع',
        authorEn: 'Community contributor',
        roleBadgeAr: '🩺 مساهمة مجتمعية',
        roleBadgeEn: '🩺 Community contributor',
        isVerifiedExpert: false,
        textAr:
          'استخدام مؤقت مرئي (ساعة رملية أو منبه لطيف) وتنبيه الطفل قبل انتهاء الوقت بـ 5 دقائق يمنع نوبات الغضب عند إغلاق الشاشة.',
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
    childAgeLabelAr: 'سنة وشهران',
    childAgeLabelEn: '14 months',
    topicId: 'nutrition',
    topicLabelAr: 'التغذية واللانش بوكس',
    topicLabelEn: 'Child Nutrition',
    titleAr: 'أفكار فطور سريعة وغنية بالحديد والكالسيوم للطفل بعد عمر السنة',
    titleEn: 'Iron & calcium-rich breakfast ideas for toddlers after 12 months',
    bodyAr:
      'جربت الشوفان المطبوخ بالحليب مع التمر المهروس وملعقة سمسم مطحون وموزة دون أي سكر مضاف، وأحبتها ليان كثيرًا ومنحتها طاقة طوال الصباح!',
    bodyEn:
      'Oats with mashed dates and ground sesame with zero added sugar worked great for us.',
    timeAgoAr: 'منذ 6 ساعات',
    timeAgoEn: '6h ago',
    likes: 96,
    helpfulCount: 79,
    comments: [
      {
        id: 4,
        authorAr: 'مساهمة من المجتمع',
        authorEn: 'Community contributor',
        roleBadgeAr: '🩺 مساهمة مجتمعية',
        roleBadgeEn: '🩺 Community contributor',
        isVerifiedExpert: false,
        textAr:
          'اختيار ممتاز يا ياسمين! السمسم المطحون مع التمر مصدر غني بالكالسيوم والحديد، ويمكن إضافة رشة قرفة خفيفة لتحسين النكهة.',
        textEn: 'Great choice! Ground sesame with dates is rich in calcium and iron.',
        timeLabel: '4h ago',
      },
    ],
  },
  {
    id: 504,
    authorAr: 'مروة عادل (أم يونس)',
    authorEn: 'Marwa Adel (Mom of Younis)',
    authorCityAr: 'المعادي',
    authorCityEn: 'Maadi',
    childAgeLabelAr: 'سنتان ونصف',
    childAgeLabelEn: '2.5 yrs',
    topicId: 'sleep',
    topicLabelAr: 'نوم الرضع والروتين',
    topicLabelEn: 'Sleep & Routine',
    titleAr: 'كيف ثبّتنا موعد النوم الساعة 8:30 مساءً وودعنا السهر!',
    titleEn: 'How we fixed our 8:30 PM bedtime routine and said goodbye to late nights',
    bodyAr:
      'السر كان في تثبيت ٣ خطوات هادئة كل يوم: حمام دافئ، إضاءة صفراء خافتة في الغرفة، وقصة مصورة بدون أي شاشات قبل النوم بساعة كاملة.',
    bodyEn:
      'The secret was a consistent 3-step wind-down: warm bath, dim warm lighting, and a picture book with zero screens an hour before bed.',
    timeAgoAr: 'أمس',
    timeAgoEn: 'Yesterday',
    likes: 112,
    helpfulCount: 94,
    comments: [
      {
        id: 5,
        authorAr: 'مساهم من المجتمع',
        authorEn: 'Community contributor',
        roleBadgeAr: '🩺 مساهمة مجتمعية',
        roleBadgeEn: '🩺 Community contributor',
        isVerifiedExpert: false,
        textAr:
          'روتين النوم المبكر يصنع فارقًا كبيرًا في إفراز هرمون النمو والتركيز وتقوية المناعة. استمروا على نفس التوقيت حتى في الإجازات.',
        textEn: 'Early bedtime routines significantly boost growth hormone and immunity.',
        timeLabel: '20h ago',
      },
    ],
  },
  {
    id: 505,
    authorAr: 'محمود درويش (أبو فريدة وعلي)',
    authorEn: 'Mahmoud Darwish (Dad of Farida & Ali)',
    authorCityAr: 'مصر الجديدة',
    authorCityEn: 'Heliopolis',
    childAgeLabelAr: '4 سنوات وسنة',
    childAgeLabelEn: '4 yrs & 1 yr',
    topicId: 'behavior',
    topicLabelAr: 'السلوك والمشاعر',
    topicLabelEn: 'Behavior & Emotions',
    titleAr: 'التعامل التربوي مع غيرة الطفل الأكبر بعد قدوم المولود الجديد',
    titleEn: 'Handling older sibling jealousy after welcoming a new baby',
    bodyAr:
      'خصصنا يوميًا نصف ساعة اسمها «وقت فريدة الخاص» مع الأب أو الأم بمفردها دون الرضيع، وأشركناها في اختيار ملابس أخيها الصغير؛ فتراجعت الغيرة بشكل ملحوظ.',
    bodyEn:
      'Dedicating 30 minutes of special 1-on-1 time every day for our older daughter reduced jealousy dramatically.',
    timeAgoAr: 'منذ يومين',
    timeAgoEn: '2d ago',
    likes: 68,
    helpfulCount: 55,
    comments: [],
  },
  {
    id: 506,
    authorAr: 'رانيا الشربيني (أم سليم)',
    authorEn: 'Rania El-Sherbiny (Mom of Selim)',
    authorCityAr: 'المنصورة',
    authorCityEn: 'Mansoura',
    childAgeLabelAr: 'سنتان',
    childAgeLabelEn: '2 yrs',
    topicId: 'experiences',
    topicLabelAr: 'تجارب الأمهات والآباء',
    topicLabelEn: 'Parent Experiences',
    titleAr: 'ألعاب مونتيسوري الخشبية طورت تركيز طفلي وحصيلته اللغوية',
    titleEn: 'Wooden Montessori toys transformed my toddler’s focus and speech',
    bodyAr:
      'عندما قللنا وقت الشاشات واعتمدنا على بازل الحروف والأشكال الخشبية مع تسمية كل شكل يوميًا لمدة ١٥ دقيقة، زادت حصيلة الكلمات لدى سليم بشكل ملحوظ خلال شهر واحد.',
    bodyEn:
      'Replacing cartoons with wooden shape puzzles and naming objects together for 15 minutes daily boosted his vocabulary in just one month.',
    timeAgoAr: 'منذ 3 أيام',
    timeAgoEn: '3d ago',
    likes: 91,
    helpfulCount: 74,
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
  const [expandedPostId, setExpandedPostId] = useState<number | null>(null);
  const [commentDrafts, setCommentDrafts] = useState<Record<number, string>>({});

  // New Post Composer State
  const [composerOpen, setComposerOpen] = useState<boolean>(false);
  const [newPostTitle, setNewPostTitle] = useState<string>('');
  const [newPostBody, setNewPostBody] = useState<string>('');
  const [newPostTopic, setNewPostTopic] = useState<CommunityPost['topicId']>('experiences');
  const [newPostAge, setNewPostAge] = useState<string>('2–5 سنوات');

  // Short-Form Family Story Reels Preview State
  const [activeStoryReelId, setActiveStoryReelId] = useState<string | null>(null);

  // Interactive Instagram/Facebook-Style Parent Stories State
  const [customParentStories, setCustomParentStories] = useState<
    Array<{
      id: string;
      authorAr: string;
      authorEn: string;
      roleAr: string;
      roleEn: string;
      isExpert: boolean;
      duration: string;
      emoji: string;
      titleAr: string;
      titleEn: string;
      summaryAr: string;
      summaryEn: string;
      imageUrl: string;
    }>
  >([]);
  const [viewedStoryIds, setViewedStoryIds] = useState<Record<string, boolean>>({});
  const [storyModalId, setStoryModalId] = useState<string | null>(null);
  const [addStoryModalOpen, setAddStoryModalOpen] = useState<boolean>(false);
  const [newStoryText, setNewStoryText] = useState<string>('');
  const [newStoryEmoji, setNewStoryEmoji] = useState<string>('🌟');

  const defaultStoryReels = [
    {
      id: 'reel-maryam-ahmed-family',
      authorAr: 'مريم وأحمد (عائلة حمزة وليلى ويوسف)',
      authorEn: 'Maryam & Ahmed (Hamza, Laila & Youssef)',
      roleAr: '💛 يوميات عيلتنا في نكبر',
      roleEn: '💛 Our Family Daily Moment',
      isExpert: false,
      duration: '0:35',
      emoji: '👨‍👩‍👧‍👦',
      titleAr: 'كيف ننسق يومنا بين نوم حمزة (٦ شهور)، حضانة ليلى (٤ س)، ومدرسة يوسف (٨ س)',
      titleEn: 'Balancing Hamza (6m), Laila (4y) nursery & Youssef (8y) school as a team',
      summaryAr: 'توزيع الصباح بين أحمد (شنطة يوسف وتمرين حمزة) ومريم (بطاقات مشاعر ليلى وتغذية حمزة) خلى البيت هادي ومتناغم!',
      summaryEn: 'Splitting morning duties between Ahmed and Maryam keeps our 3-stage household calm and joyful!',
      imageUrl: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'reel-expert-sleep',
      authorAr: 'مساهم من المجتمع',
      authorEn: 'Community contributor',
      roleAr: '🏅 مساهمة مجتمعية',
      roleEn: '🏅 Community contributor',
      isExpert: false,
      duration: '0:45',
      emoji: '🌙',
      titleAr: 'سر الـ ٢٠ دقيقة الذهبية قبل نوم الطفل بدون سهر',
      titleEn: 'The Golden 20-Minute Wind-Down Before Bedtime',
      summaryAr: 'إطفاء الشاشات + إضاءة صفراء دافئة + قصة قصيرة يضبط الساعة البيولوجية لطفلك من ثالث يوم.',
      summaryEn: 'Zero screens + warm amber lighting + a short story resets your toddler’s sleep cycle in 3 days.',
      imageUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'reel-lunchbox',
      authorAr: 'مساهمة من المجتمع',
      authorEn: 'Community contributor',
      roleAr: '🏅 مساهمة مجتمعية',
      roleEn: '🏅 Community contributor',
      isExpert: false,
      duration: '0:38',
      emoji: '🍱',
      titleAr: '٣ أفكار لانش بوكس غنية بالحديد والتركيز للمدرسة',
      titleEn: '3 Iron-Rich School Lunchbox Combos Kids Love',
      summaryAr: 'شوفان بالتمر والسمسم + شرائح تفاح بالقرفة + ساندوتش جبنة قريش بالخضار الملون.',
      summaryEn: 'Date-sesame oat bites + cinnamon apple slices + colorful veggie cottage cheese wraps.',
      imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'reel-montessori',
      authorAr: 'مساهمة من المجتمع',
      authorEn: 'Community contributor',
      roleAr: '🏅 مساهمة مجتمعية',
      roleEn: '🏅 Community contributor',
      isExpert: false,
      duration: '0:52',
      emoji: '🧸',
      titleAr: 'نشاط مونتيسوري منزلي بأدوات المطبخ لتنمية التركيز',
      titleEn: '5-Minute Kitchen Montessori Sorting Activity',
      summaryAr: 'تصنيف البقوليات أو الأغطية الملونة ينمي العضلات الدقيقة والانتباه بدون تكلفة.',
      summaryEn: 'Sorting colorful lids or pasta shapes builds fine motor skills and calm focus.',
      imageUrl: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'reel-nursery-mom',
      authorAr: 'نهى محمود (ماما عمر)',
      authorEn: 'Noha Mahmoud (Mom of Omar)',
      roleAr: '🌟 تجربة أم مميزة',
      roleEn: '🌟 Featured Parent Story',
      isExpert: false,
      duration: '0:30',
      emoji: '🎒',
      titleAr: 'روتيني الصباحي السريع لتجهيز الأولاد للحضانة في ١٥ دقيقة',
      titleEn: 'Our 15-Minute Calm Morning Nursery Prep Routine',
      summaryAr: 'تجهيز الشنط والملابس من بالليل واختيار الطفل لفاكهته المفضلة بيوفر نص الوقت الصبح!',
      summaryEn: 'Prepping bags at night and letting kids pick their fruit saves half the morning rush!',
      imageUrl: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=600&q=80',
    },
  ];

  const familyStoryReels = [...customParentStories, ...defaultStoryReels];
  const activeStoryReel = familyStoryReels.find((r) => r.id === activeStoryReelId) || null;
  const modalStoryIndex = familyStoryReels.findIndex((r) => r.id === storyModalId);
  const activeModalStory = modalStoryIndex >= 0 ? familyStoryReels[modalStoryIndex] : null;

  const handleCreateParentStory = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanText = sanitizeUserText(newStoryText, 220);
    if (!cleanText) {
      onShowToast(
        isEn ? 'Please enter a short status or parenting moment' : 'يرجى كتابة لحظة أو حالة يومية قصيرة'
      );
      return;
    }
    const createdStory = {
      id: `story-user-${Date.now()}`,
      authorAr: sanitizeUserText(parentName, 60) || 'ولي أمر',
      authorEn: sanitizeUserText(parentName, 60) || 'Parent',
      roleAr: '✨ حالتي اليوم',
      roleEn: '✨ My Daily Story',
      isExpert: false,
      duration: '0:15',
      emoji: newStoryEmoji,
      titleAr: cleanText,
      titleEn: cleanText,
      summaryAr: `لحظة عائلية مشاركة من ${sanitizeUserText(city, 40)} — مساحة تجمعنا.. وبحبهم نكبر.`,
      summaryEn: `Shared family moment from ${sanitizeUserText(city, 40)} — A space that brings us together.`,
      imageUrl:
        'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=600&q=80',
    };
    setCustomParentStories((prev) => [createdStory, ...prev]);
    setNewStoryText('');
    setAddStoryModalOpen(false);
    setStoryModalId(createdStory.id);
    onShowToast(
      isEn ? '✨ Your moment has been shared with the community.' : '✨ تمت مشاركة لحظتك مع مجتمع الأهل.'
    );
  };

  const filteredPosts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return posts.filter((p) => {
      if (topicFilter === 'experts') {
        const hasExpert = p.comments.some((c) => c.isVerifiedExpert);
        if (!hasExpert) return false;
      } else if (topicFilter !== 'all' && p.topicId !== topicFilter) {
        return false;
      }
      if (!q) return true;
      const haystack = `${p.titleAr} ${p.titleEn} ${p.bodyAr} ${p.bodyEn} ${p.authorAr}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [posts, topicFilter, searchQuery]);

  const handlePublishPost = (e: React.FormEvent) => {
    e.preventDefault();
    const safeTitle = sanitizeUserText(newPostTitle, 140);
    const safeBody = sanitizeUserText(newPostBody, 800);
    if (!safeTitle || !safeBody) {
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
      authorAr: sanitizeUserText(parentName, 60),
      authorEn: sanitizeUserText(parentName, 60),
      authorCityAr: sanitizeUserText(city, 50),
      authorCityEn: sanitizeUserText(city, 50),
      childAgeLabelAr: sanitizeUserText(newPostAge, 40),
      childAgeLabelEn: sanitizeUserText(newPostAge, 40),
      topicId: newPostTopic,
      topicLabelAr: topicLabels[newPostTopic].ar,
      topicLabelEn: topicLabels[newPostTopic].en,
      titleAr: safeTitle,
      titleEn: safeTitle,
      bodyAr: safeBody,
      bodyEn: safeBody,
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
    onShowToast(isEn ? 'Your post has been shared with the community.' : 'تمت مشاركة منشورك مع مجتمع الأهل.');
  };

  const handleAddComment = (postId: number) => {
    const text = sanitizeUserText(commentDrafts[postId] || '', 400);
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
                  authorAr: sanitizeUserText(parentName, 60),
                  authorEn: sanitizeUserText(parentName, 60),
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
      badge: isEn ? '🤝 Parents Community' : '🤝 مجتمع الأهل',
      title: isEn
        ? 'Share experiences and learn from the community'
        : 'شارك تجربتك اليومية واحصل على مساهمات وتجارب المجتمع',
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
        ? 'Real Parent Tips · Parent Experiences'
        : 'تجارب واقعية · تجارب وملاحظات أولياء الأمور',
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
    <section className="space-y-3.5" aria-label={isEn ? 'Parents Community' : 'مجتمع الوالدين'}>
      {/* =====================================================================
          INSTAGRAM / FACEBOOK STYLE INTERACTIVE STORIES CAROUSEL ("حالات الآباء")
          ===================================================================== */}
      <div
        id="community-stories-carousel"
        data-testid="community-stories-carousel"
        className="rounded-3xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-surface)] dark:bg-[#101D26] p-4 sm:p-5 space-y-3 soft-card-surface shadow-2xs"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-base">📸</span>
            <div>
              <h3 className="text-xs sm:text-sm font-black text-[var(--color-text)] dark:text-[#F8FAFC]">
                {isEn ? 'Parents Daily Stories & Moments' : 'لحظات ويوميات الأسرة'}
              </h3>
              <p className="text-[10.5px] font-semibold text-[var(--color-muted)] dark:text-[#94A3B8]">
                {isEn
                  ? 'Tap any ring to view daily parenting highlights or share your own'
                  : 'اضغط على أي دائرة لمشاهدة يوميات العائلات والخبراء أو شارك لحظتك الآن'}
              </p>
            </div>
          </div>
          <button
            type="button"
            data-testid="community-open-add-story-btn"
            onClick={() => setAddStoryModalOpen(true)}
            className="min-h-[34px] px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#FF8C61] to-[#0d9488] text-white text-[11px] font-extrabold shadow-2xs hover:opacity-95 active:scale-95 transition-all cursor-pointer shrink-0"
          >
            + {isEn ? 'Share a Moment' : 'شارك لحظة'}
          </button>
        </div>

        {/* Horizontal Avatar Stories Carousel with Active Gradient Rings */}
        <div className="flex items-start gap-3.5 overflow-x-auto no-scrollbar pt-1 pb-1">
          {/* 1. "+ شارك لحظة / Share a Moment" Circular Trigger */}
          <button
            type="button"
            data-testid="stories-carousel-add-trigger"
            onClick={() => setAddStoryModalOpen(true)}
            className="flex flex-col items-center gap-1.5 shrink-0 w-[76px] group cursor-pointer"
          >
            <div className="relative w-16 h-16 rounded-full p-[3px] bg-gradient-to-tr from-[#0d9488] via-teal-400 to-[#FF8C61] group-hover:scale-105 transition-transform">
              <div className="w-full h-full rounded-full bg-[var(--color-surface)] dark:bg-[#142430] flex items-center justify-center text-2xl">
                ➕
              </div>
              <span className="absolute -bottom-0.5 -end-0.5 w-6 h-6 rounded-full bg-[#FF8C61] text-white text-xs font-black border-2 border-white dark:border-[#101D26] flex items-center justify-center shadow-xs">
                +
              </span>
            </div>
            <span className="text-[10.5px] font-extrabold text-[var(--color-text)] dark:text-[#F8FAFC] truncate w-full text-center">
              {isEn ? 'Share a Moment' : 'شارك لحظة'}
            </span>
          </button>

          {/* 2. Active Parent & Expert Story Circles */}
          {familyStoryReels.map((story) => {
            const isViewed = Boolean(viewedStoryIds[story.id]);
            return (
              <button
                key={`circle-${story.id}`}
                type="button"
                data-testid={`story-circle-${story.id}`}
                onClick={() => {
                  setViewedStoryIds((prev) => ({ ...prev, [story.id]: true }));
                  setStoryModalId(story.id);
                }}
                className="flex flex-col items-center gap-1.5 shrink-0 w-[80px] group cursor-pointer"
              >
                <div
                  className={`relative w-16 h-16 rounded-full p-[3px] transition-transform group-hover:scale-105 ${
                    isViewed
                      ? 'bg-slate-300 dark:bg-slate-700'
                      : 'bg-gradient-to-tr from-[#FF8C61] via-amber-400 to-[#0d9488] shadow-sm'
                  }`}
                >
                  <img
                    src={story.imageUrl}
                    alt={isEn ? story.authorEn : story.authorAr}
                    loading="lazy"
                    className="w-full h-full rounded-full object-cover border-2 border-white dark:border-[#101D26]"
                  />
                  <span className="absolute -bottom-0.5 -end-0.5 w-5 h-5 rounded-full bg-white dark:bg-[#142430] border border-[var(--color-border)] dark:border-[#1E3646] text-[11px] flex items-center justify-center shadow-2xs">
                    {story.emoji}
                  </span>
                </div>
                <span className="text-xs font-bold text-[var(--color-text)] dark:text-[#F8FAFC] leading-snug break-words w-full text-center">
                  {(isEn ? story.authorEn : story.authorAr).split(' ')[0]}{' '}
                  {(isEn ? story.authorEn : story.authorAr).split(' ')[1] || ''}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Share a Moment Composer Modal Popup */}
      {addStoryModalOpen && (
        <div
          id="community-add-story-modal"
          data-testid="community-add-story-modal"
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[120] bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setAddStoryModalOpen(false)}
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleCreateParentStory}
            className="w-full max-w-md rounded-3xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-surface)] dark:bg-[#101D26] p-5 sm:p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-base font-black text-[var(--color-text)] dark:text-[#F8FAFC]">
                📸 {isEn ? 'Share a Family Moment' : 'شارك لحظة ولحظتك اليومية مع أطفالك'}
              </h3>
              <button
                type="button"
                onClick={() => setAddStoryModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-[var(--color-control-muted)] dark:bg-[#142430] text-sm font-black text-[var(--color-text)] dark:text-[#F8FAFC] cursor-pointer"
              >
                ×
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-extrabold text-[var(--color-muted)] dark:text-[#94A3B8]">
                {isEn ? 'Pick a Mood Icon' : 'اختر رمز اللحظة'}
              </label>
              <div className="flex items-center gap-2">
                {['🌟', '🧸', '🍱', '🏅', '❤️', '🌙'].map((em) => (
                  <button
                    key={em}
                    type="button"
                    onClick={() => setNewStoryEmoji(em)}
                    className={`w-10 h-10 rounded-xl text-lg flex items-center justify-center border transition-all cursor-pointer ${
                      newStoryEmoji === em
                        ? 'border-[#0d9488] bg-teal-500/15 scale-105'
                        : 'border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-muted)] dark:bg-[#142430]'
                    }`}
                  >
                    {em}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold text-[var(--color-muted)] dark:text-[#94A3B8]">
                {isEn ? 'Your Family Moment' : 'اكتب لحظة أو إنجازاً تحب مشاركته'}
              </label>
              <textarea
                rows={3}
                maxLength={220}
                value={newStoryText}
                onChange={(e) => setNewStoryText(e.target.value)}
                placeholder={
                  isEn
                    ? 'e.g., Today Hamza smiled during tummy time, Laila painted a rainbow, and Youssef built a robot!'
                    : 'مثال: الحمد لله اليوم حمزة ابتسم في تمارين البطن، وليلى رسمت قوس قزح، ويوسف خلص تمرين الكرة!'
                }
                className="w-full rounded-2xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-muted)] dark:bg-[#142430] p-3 text-xs sm:text-sm font-bold text-[var(--color-text)] dark:text-[#F8FAFC] focus:outline-none focus:border-[#0d9488]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setAddStoryModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-[var(--color-border)] dark:border-[#1E3646] text-xs font-extrabold text-[var(--color-muted)] cursor-pointer"
              >
                {isEn ? 'Cancel' : 'إلغاء'}
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#0d9488] hover:bg-[#0f766e] text-white text-xs font-extrabold shadow-sm cursor-pointer"
              >
                {isEn ? 'Publish Story ✨' : 'نشر الحالة الآن ✨'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Full-Screen Interactive Story Viewer Modal (Strictly Instagram Stories 9:16 Mobile Sizing & Viewport Bounded) */}
      {activeModalStory && (
        <div
          id="community-story-viewer-modal"
          data-testid="community-story-viewer-modal"
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md animate-fade-in"
          onClick={() => setStoryModalId(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="fixed inset-0 z-50 max-w-md mx-auto flex items-center justify-center p-3 sm:p-4 overflow-hidden"
          >
            <div className="relative w-full max-w-[380px] aspect-[9/16] max-h-[86vh] rounded-[28px] overflow-hidden border border-white/20 bg-[#0B131A] text-white shadow-2xl flex flex-col justify-between">
              <img
                src={activeModalStory.imageUrl}
                alt={isEn ? activeModalStory.titleEn : activeModalStory.titleAr}
                className="absolute inset-0 w-full h-full object-cover opacity-55 pointer-events-none"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/40 to-black/90 pointer-events-none"
              />

              {/* Story Top Progress Segments & Author Header */}
              <div className="relative z-10 p-3.5 sm:p-4 space-y-2.5 shrink-0">
                <div className="flex items-center gap-1.5">
                  {familyStoryReels.map((s, idx) => (
                    <div
                      key={s.id}
                      className="flex-1 h-1.5 rounded-full bg-white/25 overflow-hidden"
                    >
                      <div
                        className={`h-full rounded-full transition-all ${
                          idx <= modalStoryIndex ? 'w-full bg-[#2DD4BF]' : 'w-0'
                        }`}
                      />
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <span className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#FF8C61] to-[#0d9488] flex items-center justify-center text-lg shrink-0">
                      {activeModalStory.emoji}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs sm:text-sm font-black leading-snug break-words">
                        {isEn ? activeModalStory.authorEn : activeModalStory.authorAr}
                      </div>
                      <div className="text-[11px] font-bold text-amber-300 leading-snug break-words">
                        {isEn ? activeModalStory.roleEn : activeModalStory.roleAr}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStoryModalId(null)}
                    aria-label={isEn ? 'Close story' : 'إغلاق الستوري'}
                    className="min-h-[44px] min-w-[44px] rounded-full bg-white/15 hover:bg-white/25 text-white text-base font-black flex items-center justify-center cursor-pointer shrink-0"
                  >
                    ×
                  </button>
                </div>
              </div>

              {/* Left / Right Instagram Story Tap Navigation Arrows */}
              <button
                type="button"
                aria-label={isEn ? 'Previous story' : 'الستوري السابقة'}
                onClick={() => {
                  const prevIdx =
                    (modalStoryIndex - 1 + familyStoryReels.length) % familyStoryReels.length;
                  setStoryModalId(familyStoryReels[prevIdx].id);
                }}
                className="absolute start-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/45 hover:bg-black/70 border border-white/20 text-white flex items-center justify-center text-sm font-black cursor-pointer"
              >
                {isEn ? '‹' : '›'}
              </button>
              <button
                type="button"
                aria-label={isEn ? 'Next story' : 'الستوري التالية'}
                onClick={() => {
                  const nextIdx = (modalStoryIndex + 1) % familyStoryReels.length;
                  setStoryModalId(familyStoryReels[nextIdx].id);
                }}
                className="absolute end-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/45 hover:bg-black/70 border border-white/20 text-white flex items-center justify-center text-sm font-black cursor-pointer"
              >
                {isEn ? '›' : '‹'}
              </button>

              {/* Story Center Content */}
              <div className="relative z-10 px-6 py-4 text-center space-y-2.5 my-auto overflow-y-auto max-h-full">
                <span className="inline-block text-4xl">{activeModalStory.emoji}</span>
                <h4 className="text-base sm:text-xl font-black leading-snug break-words">
                  {isEn ? activeModalStory.titleEn : activeModalStory.titleAr}
                </h4>
                <p className="text-xs sm:text-sm font-semibold text-slate-100 leading-relaxed break-words">
                  {isEn ? activeModalStory.summaryEn : activeModalStory.summaryAr}
                </p>
              </div>

              {/* Story Footer Controls & Quick Reactions */}
              <div className="relative z-10 p-3.5 sm:p-4 border-t border-white/15 bg-black/60 backdrop-blur-xs flex flex-wrap items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-1.5">
                  {['❤️', '👏', '🌟', '🤲'].map((reactEmoji) => (
                    <button
                      key={reactEmoji}
                      type="button"
                      onClick={() =>
                        onShowToast(
                          isEn
                            ? `Sent ${reactEmoji} reaction to ${activeModalStory.authorEn}!`
                            : `تم إرسال تفاعل ${reactEmoji} على حالة ${activeModalStory.authorAr}!`
                        )
                      }
                      className="min-h-[42px] min-w-[42px] rounded-full bg-white/15 hover:bg-white/25 text-base flex items-center justify-center transition-transform active:scale-125 cursor-pointer"
                    >
                      {reactEmoji}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const prevIdx =
                        (modalStoryIndex - 1 + familyStoryReels.length) % familyStoryReels.length;
                      setStoryModalId(familyStoryReels[prevIdx].id);
                    }}
                    className="min-h-[40px] px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-xs font-extrabold cursor-pointer"
                  >
                    {isEn ? 'Prev' : 'السابق'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const nextIdx = (modalStoryIndex + 1) % familyStoryReels.length;
                      setStoryModalId(familyStoryReels[nextIdx].id);
                    }}
                    className="min-h-[40px] px-3 py-1.5 rounded-xl bg-[#0d9488] hover:bg-[#0f766e] text-xs font-extrabold cursor-pointer"
                  >
                    {isEn ? 'Next' : 'التالي'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Swipeable Community Banner Carousel */}
      <SwipeableBannerCarousel
        slides={communityBanners}
        language={language}
        ariaLabel={isEn ? 'Featured Community Stories' : 'قصص وتجارب من مجتمع الأهل'}
      />

      {/* Short-Form Family Story Reels Preview Strip & Verified Golden Experts Highlight */}
      <div
        id="community-story-reels-strip"
        className="rounded-2xl sm:rounded-3xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-surface)] dark:bg-[#101D26] p-4 sm:p-5 space-y-2.5 soft-card-surface shadow-xs"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="space-y-0.5 min-w-0">
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-400/40 text-amber-800 dark:text-amber-300 text-[9.5px] font-extrabold">
              <span>🎬</span>
              <span>
                {isEn
                  ? 'Family Stories & Community Tips'
                  : 'قصص قصيرة ونصائح مجتمعية'}
              </span>
            </div>
            <h3 className="text-xs sm:text-sm font-black text-[var(--color-text)] dark:text-[#F8FAFC]">
              {isEn
                ? 'Quick Parenting Ideas & Family Stories'
                : 'أفكار عملية وتجارب أسرية قصيرة'}
            </h3>
          </div>

          <button
            type="button"
            onClick={() => setTopicFilter(topicFilter === 'experts' ? 'all' : 'experts')}
            className={`min-h-[32px] px-3 py-1 rounded-xl text-[10.5px] font-extrabold border transition-all flex items-center gap-1 cursor-pointer ${
              topicFilter === 'experts'
                ? 'border-amber-500 bg-amber-500 text-slate-950 shadow-sm'
                : 'border-amber-400/50 bg-amber-50/90 dark:bg-[#142430] text-amber-900 dark:text-amber-300 hover:border-amber-400'
            }`}
          >
            <span>🏅</span>
            <span>
              {topicFilter === 'experts'
                ? isEn
                  ? 'Community replies'
                  : 'ردود الخبراء ✓'
                : isEn
                ? 'Expert Replies'
                : 'منشورات الأطباء'}
            </span>
          </button>
        </div>

        {/* Horizontal Story Reels Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          {familyStoryReels.map((reel) => {
            const isSelectedReel = activeStoryReelId === reel.id;
            return (
              <button
                key={reel.id}
                type="button"
                onClick={() => setActiveStoryReelId(isSelectedReel ? null : reel.id)}
                className={`group relative overflow-hidden rounded-xl border text-start p-2 min-h-[96px] flex flex-col justify-between transition-all duration-300 cursor-pointer ${
                  isSelectedReel
                    ? 'border-amber-400 ring-2 ring-amber-400/30 scale-[1.01]'
                    : 'border-[var(--color-border)] dark:border-[#1E3646] hover:border-amber-400/60 hover:scale-[1.01]'
                }`}
              >
                <img
                  src={reel.imageUrl}
                  alt={isEn ? reel.titleEn : reel.titleAr}
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-85 group-hover:scale-105 transition-transform duration-500"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      'linear-gradient(to top, rgba(11, 19, 26, 0.94) 0%, rgba(16, 29, 38, 0.58) 55%, rgba(11, 19, 26, 0.25) 100%)',
                  }}
                />

                <div className="relative z-10 flex flex-wrap items-center justify-between gap-1 w-full">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black inline-flex items-center gap-1 leading-snug break-words ${
                      reel.isExpert
                        ? 'bg-amber-400 text-slate-950 shadow-2xs'
                        : 'bg-teal-500 text-white'
                    }`}
                  >
                    <span>{reel.isExpert ? '🏅' : '🌟'}</span>
                    <span>
                      {isEn ? reel.roleEn.replace('🏅 ', '') : reel.roleAr.replace('🏅 ', '')}
                    </span>
                  </span>
                  <span className="px-1.5 py-0.5 rounded-full bg-black/65 text-white text-[10px] font-extrabold tabular-nums">
                    ▶ {reel.duration}
                  </span>
                </div>

                <div className="relative z-10 space-y-1 pt-2">
                  <div className="text-xs font-extrabold text-amber-300 leading-snug break-words">
                    {reel.emoji} {isEn ? reel.authorEn : reel.authorAr}
                  </div>
                  <div className="text-xs sm:text-sm font-black text-white leading-snug break-words">
                    {isEn ? reel.titleEn : reel.titleAr}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Story Reel Inline Viewer */}
        {activeStoryReel && (
          <div className="rounded-2xl border border-amber-400/50 bg-amber-50/85 dark:bg-[#142430] p-3.5 flex items-start justify-between gap-3 animate-fade-in">
            <div className="space-y-1 flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[9.5px] font-black">
                  {isEn ? activeStoryReel.roleEn : activeStoryReel.roleAr}
                </span>
                <span className="text-xs font-extrabold text-[var(--color-text)] dark:text-[#F8FAFC]">
                  {isEn ? activeStoryReel.authorEn : activeStoryReel.authorAr}
                </span>
              </div>
              <h4 className="text-xs sm:text-sm font-black text-[var(--color-text)] dark:text-[#F8FAFC]">
                {activeStoryReel.emoji} {isEn ? activeStoryReel.titleEn : activeStoryReel.titleAr}
              </h4>
              <p className="text-xs font-semibold text-[var(--color-muted)] dark:text-[#CBD5E1] leading-relaxed">
                {isEn ? activeStoryReel.summaryEn : activeStoryReel.summaryAr}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveStoryReelId(null)}
              aria-label={isEn ? 'Close story reel' : 'إغلاق القصة'}
              className="w-8 h-8 rounded-xl text-lg font-black leading-none bg-[#0B131A] text-white flex items-center justify-center cursor-pointer shrink-0"
            >
              ×
            </button>
          </div>
        )}
      </div>

      {/* Post Composer Collapsible Card */}
      <CollapsibleSectionCard
        id="community-post-composer-accordion"
        title={isEn ? 'Share an Experience or Ask a Question' : 'شارك تجربتك أو اطرح سؤالاً'}
        subtitle={
          isEn
            ? 'Connect with parents and share family experiences across Egypt & Saudi Arabia'
            : 'تواصل مع أولياء الأمور وتبادل الخبرات الأسرية في مصر والسعودية'
        }
        iconId="star"
        cardTone="amber"
        badgeLabel={isEn ? 'Write Post' : 'إنشاء مشاركة'}
        badgeTone="amber"
        isOpen={composerOpen}
        onToggle={(next) => setComposerOpen(next)}
      >
        <form onSubmit={handlePublishPost} className="space-y-4 pt-3">
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
            <button
              type="button"
              onClick={() => setComposerOpen(false)}
              className="min-h-[36px] px-3.5 py-1.5 rounded-xl text-xs font-extrabold border border-[var(--color-border)] bg-[var(--color-control-bg)] text-[var(--color-muted)]"
            >
              {isEn ? 'Cancel' : 'إلغاء'}
            </button>
            <PrimaryCtaButton type="submit" variant="orange" size="sm">
              {isEn ? 'Publish to Community' : 'نشر في المجتمع الآن'}
            </PrimaryCtaButton>
          </div>
        </form>
      </CollapsibleSectionCard>

      {/* Topic Filter Bar, Search & Quick Actions in Collapsible Card */}
      <CollapsibleSectionCard
        id="community-topic-filter-card"
        title={isEn ? 'Explore Topics & Search Discussions' : 'تصفية الموضوعات وبحث النقاشات'}
        subtitle={
          isEn
            ? `${filteredPosts.length} active discussions found`
            : `${filteredPosts.length} نقاشات وتجارب معروضة`
        }
        iconId="children"
        cardTone="teal"
        badgeLabel={`${filteredPosts.length}`}
        badgeTone="teal"
        defaultOpen={false}
        headerAction={
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setComposerOpen((prev) => !prev);
            }}
            className="min-h-[34px] px-3 py-1 rounded-xl text-xs font-extrabold bg-[#FF8C61] hover:bg-[#e86a3d] text-white shadow-2xs transition-all flex items-center gap-1.5"
          >
            <span>✍️</span>
            <span>{isEn ? 'New Post' : 'مشاركة جديدة'}</span>
          </button>
        }
      >
        <div className="space-y-2.5 pt-2.5">
          <div className="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap no-scrollbar pb-0.5">
            {[
              { id: 'all', labelAr: 'الكل', labelEn: 'All' },
              { id: 'experts', labelAr: '🏅 مساهمات المجتمع', labelEn: '🏅 Community contributors' },
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
                className={`min-h-[34px] px-3 py-1 rounded-xl text-[11px] font-extrabold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  topicFilter === tab.id
                    ? 'bg-[#0d9488] text-white shadow-2xs'
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
                ? '🔍 Search parent discussions, questions, or cities...'
                : '🔍 ابحث في نقاشات وتجارب الوالدين (حضانة، فطور، شاشات)...'
            }
            className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-4 py-2.5 text-xs sm:text-sm font-semibold text-[var(--color-text)]"
          />
        </div>
      </CollapsibleSectionCard>

      {/* Community Feed Cards with Soft Pastel Tints */}
      {filteredPosts.length === 0 ? (
        <FriendlyEmptyState
          id="empty-community-state"
          iconId="star"
          tone="purple"
          title={
            isEn
              ? 'No items here yet — No matching discussions'
              : 'لا توجد عناصر هنا بعد — لا توجد مشاركات مطابقة'
          }
          subtitle={
            isEn
              ? 'Try clearing the search box or start a new discussion with parents.'
              : 'جرّب مسح كلمات البحث أو ابدأ نقاشًا جديدًا مع الآباء والأمهات.'
          }
          actionLabel={isEn ? 'Show All Discussions' : 'عرض كل النقاشات'}
          onAction={() => {
            setSearchQuery('');
            setTopicFilter('all');
          }}
        />
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredPosts.map((post) => {
          const isLiked = likedIds.includes(post.id);
          const isHelpful = helpfulIds.includes(post.id);
          const isExpanded = expandedPostId === post.id;
          const postToneKey = TOPIC_TONE_MAP[post.topicId] || 'amber';
          const postCategoryKey =
            post.topicId === 'nursery'
              ? 'nursery'
              : post.topicId === 'nutrition'
              ? 'nutrition'
              : 'consultation';

          return (
            <MasterPatternCard
              key={post.id}
              tone={postToneKey}
              categoryKey={postCategoryKey}
              itemIdOrIndex={post.id}
              onThumbnailClick={() => setExpandedPostId(isExpanded ? null : post.id)}
              topLeftBadge={isEn ? post.topicLabelEn : post.topicLabelAr}
              topRightBadge={
                <span>
                  💡 {post.helpfulCount + (isHelpful ? 1 : 0)} {isEn ? 'Helpful' : 'مفيد'}
                </span>
              }
              titlePrefixSlot={
                <div className="w-6 h-6 rounded-lg bg-white/95 dark:bg-[#142430] border border-orange-200 dark:border-[#1E3646] text-orange-900 dark:text-[#FDBA74] text-[10.5px] font-extrabold flex items-center justify-center shrink-0 shadow-2xs">
                  {(isEn ? post.authorEn : post.authorAr).slice(0, 1)}
                </div>
              }
              title={isEn ? post.titleEn : post.titleAr}
              metaLeft={
                <span>
                  📍 {isEn ? post.authorCityEn : post.authorCityAr} · 👶{' '}
                  {isEn ? post.childAgeLabelEn : post.childAgeLabelAr} ·{' '}
                  {isEn ? post.timeAgoEn : post.timeAgoAr}
                </span>
              }
              metaRightAction={
                <span className="text-[10px] font-extrabold text-[var(--color-text)] dark:text-[#A5F3FC]">
                  {isEn ? post.authorEn : post.authorAr}
                </span>
              }
              bodyContent={
                <p className="text-xs sm:text-sm text-[var(--color-muted)] dark:text-[#94A3B8] font-semibold leading-relaxed break-words">
                  {isEn ? post.bodyEn : post.bodyAr}
                </p>
              }
              footerLeft={
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setLikedIds((prev) =>
                        isLiked ? prev.filter((id) => id !== post.id) : [...prev, post.id]
                      )
                    }
                    className={`min-h-[44px] px-3 py-1.5 rounded-xl text-xs font-extrabold border transition-all duration-300 ease-in-out active:scale-95 cursor-pointer ${
                      isLiked
                        ? 'bg-[#FF8C61] text-white border-[#FF8C61]'
                        : 'bg-[var(--color-control-bg)] dark:bg-[#142430] text-[var(--color-text)] dark:text-[#F8FAFC] border-[var(--color-border)] dark:border-[#1E3646]'
                    }`}
                  >
                    ❤️ {isEn ? 'Like' : 'عجبني'} ·{' '}
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
                    className={`min-h-[44px] px-3 py-1.5 rounded-xl text-xs font-extrabold border transition-all duration-300 ease-in-out active:scale-95 cursor-pointer ${
                      isHelpful
                        ? 'bg-[#0d9488] text-white border-[#0d9488]'
                        : 'bg-[var(--color-control-bg)] dark:bg-[#142430] text-[var(--color-text)] dark:text-[#F8FAFC] border-[var(--color-border)] dark:border-[#1E3646]'
                    }`}
                  >
                    💡 {isEn ? 'Helpful' : 'مفيد جدًا'} ·{' '}
                    <span dir="ltr" className="tabular-nums">
                      {post.helpfulCount + (isHelpful ? 1 : 0)}
                    </span>
                  </button>
                </div>
              }
              footerRight={
                <button
                  type="button"
                  onClick={() => setExpandedPostId(isExpanded ? null : post.id)}
                  className="min-h-[44px] px-3 py-1.5 rounded-xl text-xs font-extrabold bg-[var(--color-control-bg)] dark:bg-[#142430] border border-[var(--color-border)] dark:border-[#1E3646] text-[var(--color-text)] dark:text-[#F8FAFC] transition-all duration-300 ease-in-out active:scale-95 cursor-pointer"
                >
                  💬 {isEn ? `Comments (${post.comments.length})` : `التعليقات والردود (${post.comments.length})`}
                </button>
              }
            >
              {/* Comments Thread */}
              {isExpanded && (
                <div className="pt-2.5 space-y-2 border-t border-black/5 dark:border-[#1E3646]">
                  {post.comments.map((c) => (
                    <div
                      key={c.id}
                      className={`rounded-2xl p-3 text-xs space-y-1.5 ${
                        c.isVerifiedExpert
                          ? 'bg-gradient-to-r from-amber-50/95 via-emerald-50/85 to-amber-50/90 dark:from-[#142430] dark:to-[#182C3A] border-2 border-amber-400/60 dark:border-amber-400/50 shadow-2xs'
                          : 'bg-[var(--color-control-bg)] dark:bg-[#142430] border border-[var(--color-border)] dark:border-[#1E3646]'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-extrabold text-[var(--color-text)] dark:text-[#F8FAFC]">
                            {isEn ? c.authorEn : c.authorAr}
                          </span>
                          {c.isVerifiedExpert ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black shadow-2xs">
                              <span>🏅</span>
                              <span>{isEn ? c.roleBadgeEn : c.roleBadgeAr}</span>
                            </span>
                          ) : (
                            <span className="font-bold text-emerald-800 dark:text-[#2DD4BF]">
                              · {isEn ? c.roleBadgeEn : c.roleBadgeAr}
                            </span>
                          )}
                        </div>
                        <span dir="ltr" className="text-[11px] text-[var(--color-muted)] dark:text-[#94A3B8] tabular-nums">
                          {c.timeLabel}
                        </span>
                      </div>
                      <p className="text-[var(--color-text)] dark:text-[#F8FAFC] leading-relaxed font-semibold">
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
                          : 'اكتب رد أو شاركنا تجربتك...'
                      }
                      className="flex-1 rounded-xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-bg)] dark:bg-[#142430] px-3.5 py-2 text-xs font-semibold text-[var(--color-text)] dark:text-[#F8FAFC]"
                    />
                    <PrimaryCtaButton
                      variant="orange"
                      size="sm"
                      onClick={() => handleAddComment(post.id)}
                    >
                      {isEn ? 'Reply' : 'ابعت الرد'}
                    </PrimaryCtaButton>
                  </div>
                </div>
              )}
            </MasterPatternCard>
          );
        })}
      </div>
      )}
    </section>
  );
};

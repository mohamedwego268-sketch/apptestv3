import React, { useMemo, useState } from 'react';
import {
  ChildProfile,
  LanguageCode,
  calculateChildAge,
  locText,
} from '../domain/familySpaceCore';
import { getCardBackgroundSpec, CardBackgroundKey } from '../domain/cardBackgrounds';
import { ThreeDChildAvatar, ThreeDIcon, ThreeDIconId, AiRobotHeadIcon } from './ThreeDVisuals';
import {
  BannerSlideItem,
  MasterPatternCard,
  PASTEL_CARD_TONES,
  PastelTone,
  PrimaryCtaButton,
  SectionHeader,
  SwipeableBannerCarousel,
} from './DesignSystem';

interface AiChatMessage {
  id: number;
  sender: 'parent' | 'ai';
  textAr: string;
  textEn: string;
  timestamp: string;
  structuredCard?: {
    badgeAr: string;
    badgeEn: string;
    stepsAr: string[];
    stepsEn: string[];
    activityTipAr: string;
    activityTipEn: string;
  };
}

interface AiAssistantSectionProps {
  kids: ChildProfile[];
  parentName: string;
  city: string;
  language: LanguageCode;
  darkMode?: boolean;
  onAddSuggestedRoutineTask: (taskName: string, timeStr: string, kidId: number | null) => void;
  onShowToast: (msg: string) => void;
}

export const AiAssistantSection: React.FC<AiAssistantSectionProps> = ({
  kids,
  parentName,
  language,
  darkMode = false,
  onAddSuggestedRoutineTask,
  onShowToast,
}) => {
  const isEn = language === 'en';
  const [selectedKidId, setSelectedKidId] = useState<number>(kids[0]?.id || 0);
  const selectedKid = kids.find((k) => k.id === selectedKidId) || kids[0];
  const kidAge = selectedKid ? calculateChildAge(selectedKid.birth, language) : null;
  const displayParentName = locText(parentName, language);
  const displayKidName = selectedKid ? locText(selectedKid.name, language) : isEn ? 'your child' : 'طفلك';
  const displayKidInterests = selectedKid ? locText(selectedKid.interests, language) : isEn ? 'Stories & blocks' : 'القصص والمكعبات';

  const [inputPrompt, setInputPrompt] = useState<string>('');
  const [isVoiceSimulating, setIsVoiceSimulating] = useState<boolean>(false);
  const [voiceSampleIdx, setVoiceSampleIdx] = useState<number>(0);

  const simulatedVoicePrompts = [
    {
      topic: 'sleep',
      ar: `🎙️ «يا نكبر، صمّم لي جدول نوم مسائي هادئ لـ ${selectedKid?.name || 'طفلي'} يبدأ الساعة ٨ مساءً بدون شاشات»`,
      en: `🎙️ "Nekbaar, create a calm 8:00 PM screen-free bedtime routine for ${displayKidName}"`,
    },
    {
      topic: 'food',
      ar: `🎙️ «إزاي أشجع ${selectedKid?.name || 'طفلي'} يجرب الخضار والفواكه في اللانش بوكس من غير إجبار؟»`,
      en: `🎙️ "How can I encourage ${displayKidName} to try veggies and fruit in their lunchbox gently?"`,
    },
    {
      topic: 'behavior',
      ar: `🎙️ «اقترح لي ٣ خطوات سريعة لتهدئة نوبة الغضب وقت لمّ الألعاب بهدوء»`,
      en: `🎙️ "Give me 3 quick co-regulation steps to calm a cleanup-time tantrum gently"`,
    },
    {
      topic: 'play',
      ar: `🎙️ «عايز نشاط مونتيسوري منزلي لمدة ١٥ دقيقة ينمّي التركيز واللغة عند ${selectedKid?.name || 'طفلي'}»`,
      en: `🎙️ "Suggest a 15-minute home Montessori play activity to boost ${displayKidName}'s focus"`,
    },
  ];

  const handleToggleVoiceSimulation = () => {
    if (isVoiceSimulating) {
      setIsVoiceSimulating(false);
      const sample = simulatedVoicePrompts[voiceSampleIdx % simulatedVoicePrompts.length];
      const textToSend = isEn ? sample.en : sample.ar;
      setInputPrompt(textToSend);
      setVoiceSampleIdx((prev) => prev + 1);
      handleSendPrompt(textToSend, sample.topic);
      onShowToast(
        isEn
          ? '🎙️ Voice command transcribed & sent to AI Parenting Agent!'
          : '🎙️ تم تحويل رسالتك الصوتية وإرسالها للمساعد الذكي فورًا!'
      );
      return;
    }

    setIsVoiceSimulating(true);
    const sample = simulatedVoicePrompts[voiceSampleIdx % simulatedVoicePrompts.length];
    setInputPrompt(isEn ? sample.en : sample.ar);
    onShowToast(
      isEn
        ? '🎙️ Voice recording simulation active — tap again to send!'
        : '🎙️ جاري الاستماع لصوتك... اضغط مرة أخرى لإرسال الطلب الصوتي!'
    );
  };
  const [messages, setMessages] = useState<AiChatMessage[]>([
    {
      id: 1,
      sender: 'ai',
      textAr: `أهلًا ${parentName} 👋 أنا مساعد الذكاء الاصطناعي لـ ${selectedKid ? selectedKid.name : 'طفلك'} (${kidAge?.label || '2–5 سنوات'}). اختر بطاقة سريعة أو اكتب طلبك بالأسفل:`,
      textEn: `Hello ${displayParentName}! I am your AI Parenting Agent for ${displayKidName} (${kidAge?.label || '2–5 yrs'}). Tap a quick creation card or ask below:`,
      timestamp: '09:00 AM',
      structuredCard: {
        badgeAr: `خطة مخصصة لـ ${selectedKid?.name || 'الطفل'} (${kidAge?.stageCode || '2-5'} سنوات)`,
        badgeEn: `Tailored Plan for ${displayKidName} (${kidAge?.stageCode || '2-5'} yrs)`,
        stepsAr: [
          '١. تثبيت موعد الاستيقاظ والإفطار يمنح الطفل أمانًا صباحيًا.',
          '٢. 15 دقيقة لعب تفاعلي مشترك بدون شاشات بعد الحضانة.',
          '٣. بدء طقس الهدوء المسائي الساعة 08:00 مساءً.',
        ],
        stepsEn: [
          '1. Consistent morning wake-up and breakfast anchors security.',
          '2. 15 minutes of screen-free parent-child play after nursery.',
          '3. Start the evening wind-down ritual at 08:00 PM.',
        ],
        activityTipAr: 'نشاط مقترح: لعبة تطابق الذاكرة وتسمية المشاعر 3D.',
        activityTipEn: 'Suggested Activity: 3D Memory Match & Emotion Naming.',
      },
    },
  ]);

  const quickCreationCards: {
    topic: string;
    titleAr: string;
    titleEn: string;
    badgeAr: string;
    badgeEn: string;
    promptAr: string;
    promptEn: string;
    iconId: ThreeDIconId;
    tone: PastelTone;
    bgKey: CardBackgroundKey;
  }[] = [
    {
      topic: 'sleep',
      titleAr: 'إنشاء روتين نوم هادئ',
      titleEn: 'Create Bedtime Routine',
      badgeAr: 'خطة 20 دقيقة',
      badgeEn: '20-Min Plan',
      promptAr: `🌙 خطة نوم مسائية مخصصة لـ ${selectedKid?.name || 'طفلي'}`,
      promptEn: `🌙 Bedtime sleep routine for ${displayKidName}`,
      iconId: 'routine',
      tone: 'purple',
      bgKey: 'routine',
    },
    {
      topic: 'food',
      titleAr: 'حلول انتقائية الطعام',
      titleEn: 'Picky Eating Solutions',
      badgeAr: 'تغذية صحية',
      badgeEn: 'Healthy Meals',
      promptAr: '🍎 كيف أتعامل مع انتقائية الطعام ورفض الخضار؟',
      promptEn: '🍎 How to handle picky eating and refusing vegetables?',
      iconId: 'wishes',
      tone: 'emerald',
      bgKey: 'medical',
    },
    {
      topic: 'behavior',
      titleAr: 'تهدئة نوبات الغضب',
      titleEn: 'Calm Tantrums Gently',
      badgeAr: 'تربية إيجابية',
      badgeEn: 'Co-Regulation',
      promptAr: '💛 تهدئة نوبات الغضب والعناد بهدوء بدون صراخ',
      promptEn: '💛 Calming tantrums without yelling',
      iconId: 'children',
      tone: 'rose',
      bgKey: 'children',
    },
    {
      topic: 'play',
      titleAr: 'أنشطة مونتيسوري منزلية',
      titleEn: 'Home Montessori Play',
      badgeAr: 'بدون شاشات',
      badgeEn: 'Zero Screens',
      promptAr: '🎨 اقترح 3 أنشطة منزلية لتنمية التركيز واللغة اليوم',
      promptEn: '🎨 Suggest 3 home activities for focus and language today',
      iconId: 'games',
      tone: 'amber',
      bgKey: 'games',
    },
  ];

  const handleSendPrompt = (customText?: string, topicHint?: string) => {
    const promptText = (customText ?? inputPrompt).trim();
    if (!promptText) return;

    const nowStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const parentMsg: AiChatMessage = {
      id: Date.now(),
      sender: 'parent',
      textAr: promptText,
      textEn: promptText,
      timestamp: nowStr,
    };

    const lower = promptText.toLowerCase();
    const isSleep = topicHint === 'sleep' || lower.includes('نوم') || lower.includes('sleep');
    const isFood = topicHint === 'food' || lower.includes('أكل') || lower.includes('طعام') || lower.includes('food');
    const isBehavior = topicHint === 'behavior' || lower.includes('غضب') || lower.includes('عناد') || lower.includes('tantrum');

    const aiReply: AiChatMessage = isSleep
      ? {
          id: Date.now() + 1,
          sender: 'ai',
          textAr: `خطة روتين النوم المخصصة لـ ${selectedKid?.name || 'طفلك'} (${kidAge?.label || '3 سنوات'}):`,
          textEn: `Tailored 3-step bedtime routine for ${selectedKid?.name || 'your child'} (${kidAge?.label || '3 yrs'}):`,
          timestamp: nowStr,
          structuredCard: {
            badgeAr: 'خطة النوم المريحة (20 دقيقة قبل السرير)',
            badgeEn: 'Calm Bedtime Blueprint (20 mins before bed)',
            stepsAr: [
              '١. الساعة 07:45 م: إيقاف الشاشات وخفض إضاءة الغرفة.',
              '٢. الساعة 08:00 م: حمام دافئ واختيار بيجامة النوم مع الطفل.',
              '٣. الساعة 08:15 م: تشغيل تهويدة «رحلة القمر الصغير» أو قصة قصيرة.',
            ],
            stepsEn: [
              '1. 07:45 PM: Turn off screens and dim room lights.',
              '2. 08:00 PM: Warm bath and let the child choose pajamas.',
              '3. 08:15 PM: Play the Little Moon audio lullaby or read 1 short story.',
            ],
            activityTipAr: 'أضيفي المهمة مباشرة لجدول الروتين اليومي بضغطة زر بالأسفل.',
            activityTipEn: 'Add this step directly to your Daily Routine below.',
          },
        }
      : isFood
      ? {
          id: Date.now() + 1,
          sender: 'ai',
          textAr: `استراتيجية الطبق المقسم الإيجابي لـ ${selectedKid?.name || 'طفلك'}:`,
          textEn: `Positive Divided Plate strategy for ${selectedKid?.name || 'your child'}:`,
          timestamp: nowStr,
          structuredCard: {
            badgeAr: 'استراتيجية الطبق المقسم الإيجابي',
            badgeEn: 'Positive Divided Plate Strategy',
            stepsAr: [
              '١. تقديم صنفين يحبهما الطفل بجانب ملعقة صغيرة من الصنف الجديد.',
              '٢. إشراك الطفل في غسل الفاكهة أو ترتيب الطبق.',
              '٣. تحديد وقت الوجبة بـ 20 دقيقة هادئة بدون شاشات.',
            ],
            stepsEn: [
              '1. Serve 2 familiar favorites alongside 1 tiny spoon of a new food.',
              '2. Let your child help wash fruit or arrange the plate.',
              '3. Keep meals to 20 calm minutes without screens.',
            ],
            activityTipAr: 'نشاط مقترح: لعبة تخمين ألوان الفواكه والخضروات قبل الغداء.',
            activityTipEn: 'Suggested game: Fruit & veggie color matching before lunch.',
          },
        }
      : isBehavior
      ? {
          id: Date.now() + 1,
          sender: 'ai',
          textAr: `بروتوكول التهدئة والاحتواء السريع لـ ${selectedKid?.name || 'الطفل'}:`,
          textEn: `Quick Co-Regulation protocol for ${selectedKid?.name || 'your child'}:`,
          timestamp: nowStr,
          structuredCard: {
            badgeAr: 'بروتوكول التهدئة والاحتواء (3 خطوات)',
            badgeEn: 'Co-Regulation Protocol (3 Steps)',
            stepsAr: [
              '١. النزول لمستوى نظر الطفل والتحدث بنبرة منخفضة وبطيئة.',
              '٢. تسمية الشعور: «أنا فاهمة إنك زعلان عشان وقت اللعب خلص».',
              '٣. تقديم خيارين صغيرين: «تشيل المكعبات الحمراء الأول ولا الزرقاء؟».',
            ],
            stepsEn: [
              '1. Get down to eye level and speak in a slow, low tone.',
              '2. Name the feeling: "I see you are upset play time ended."',
              '3. Offer two small choices: "Pick up red blocks or blue blocks first?"',
            ],
            activityTipAr: 'الاحتواء الهادئ يختصر مدة نوبة الغضب للنصف.',
            activityTipEn: 'Calm presence cuts meltdown time in half.',
          },
        }
      : {
          id: Date.now() + 1,
          sender: 'ai',
          textAr: `خطة أنشطة يومية مخصصة لـ ${selectedKid?.name || 'طفلك'} (${kidAge?.label || '2–5 سنوات'}):`,
          textEn: `Customized daily activity plan for ${selectedKid?.name || 'your child'} (${kidAge?.label || '2–5 yrs'}):`,
          timestamp: nowStr,
          structuredCard: {
            badgeAr: `خطة أنشطة وتنمية مهارات (${kidAge?.stageCode || '2-5'} سنوات)`,
            badgeEn: `Skill & Play Plan (${kidAge?.stageCode || '2-5'} yrs)`,
            stepsAr: [
              '١. نشاط حركي (10 دقائق): تصنيف المكعبات حسب اللون والحجم.',
              '٢. نشاط لغوي (10 دقائق): حكي قصة قصيرة وترك الطفل يتوقع النهاية.',
              '٣. نشاط تشاركي: جولة في لعبة تطابق الذاكرة والمفردات 3D.',
            ],
            stepsEn: [
              '1. Fine motor (10m): Sort blocks or shapes by color and size.',
              '2. Language (10m): Tell a short story and let your child invent the ending.',
              '3. Co-play: One round of 3D Memory & Vocabulary Match.',
            ],
            activityTipAr: `اهتمامات ${selectedKid?.name || 'الطفل'}: ${selectedKid?.interests || 'القصص والمكعبات'}.`,
            activityTipEn: `Interests for ${displayKidName}: ${displayKidInterests}.`,
          },
        };

    setMessages((prev) => [...prev, parentMsg, aiReply]);
    setInputPrompt('');
  };

  const aiBanners: BannerSlideItem[] = [
    {
      id: 'ai-slide-routine',
      badge: isEn ? '✨ Smart AI Parenting Agent' : '✨ مساعد الذكاء الاصطناعي للأسرة',
      title: isEn
        ? `Instant Plans & Routines for ${displayKidName}`
        : `تصميم خطط النوم والتغذية والروتين لـ ${selectedKid?.name || 'طفلك'}`,
      subtitle: isEn
        ? `Tailored for ${kidAge?.label || '0–8 Yrs'} · One-Tap Add to Daily Routine`
        : `مخصص لعمر ${kidAge?.label || '0–8 سنوات'} · إضافة فورية للروتين اليومي`,
      ctaLabel: isEn ? 'Generate Bedtime Plan' : 'أنشئ خطة نوم مسائية الآن',
      onCtaClick: () =>
        handleSendPrompt(
          isEn
            ? `🌙 Bedtime sleep routine for ${displayKidName}`
            : `🌙 خطة نوم مسائية مخصصة لـ ${selectedKid?.name || 'طفلي'}`,
          'sleep'
        ),
      iconId: 'assistant',
      gradient: 'linear-gradient(125deg, #f5f3ff, #ede9fe, #fae8ff)',
      ctaVariant: 'purple',
    },
    {
      id: 'ai-slide-play',
      badge: isEn ? '🎨 Zero-Screen Play' : '🎨 أنشطة مونتيسوري بدون شاشات',
      title: isEn
        ? 'Generate 3 Custom Home Activities in Seconds'
        : 'ابتكر 3 أنشطة منزلية لتنمية ذكاء وتركيز طفلك اليوم',
      subtitle: isEn
        ? 'Fine Motor · Language · Emotional Growth'
        : 'مهارات حركية · حصيلة لغوية · ذكاء عاطفي',
      ctaLabel: isEn ? 'Create Play Plan' : 'ابتكر خطة أنشطة اليوم',
      onCtaClick: () =>
        handleSendPrompt(
          isEn
            ? '🎨 Suggest 3 home activities for focus and language today'
            : '🎨 اقترح 3 أنشطة منزلية لتنمية التركيز واللغة اليوم',
          'play'
        ),
      iconId: 'games',
      gradient: 'linear-gradient(125deg, #fffbeb, #fef3c7, #fce7f3)',
      ctaVariant: 'orange',
    },
  ];

  const [dynamicPlanOffset, setDynamicPlanOffset] = useState(0);

  const dynamicChildPlans = useMemo(() => {
    const kName = displayKidName;
    const stageLabel = kidAge?.label || (isEn ? '3–5 yrs' : '3–5 سنوات');
    const stageCode = kidAge?.stageCode || '2-5';

    const allTemplates = [
      {
        id: 'sleep-plan',
        topic: 'sleep' as const,
        iconId: 'routine' as const,
        tone: 'indigo' as const,
        bgKey: 'routine',
        badgeAr: `🌙 خطة النوم · ${stageLabel}`,
        badgeEn: `🌙 Sleep Plan · ${stageLabel}`,
        titleAr: `روتين نوم هادئ لـ ${kName} في ٢٠ دقيقة`,
        titleEn: `20-Min Calm Bedtime Plan for ${kName}`,
        stepsAr: [
          `07:30 م: خفض الإضاءة وإيقاف الشاشات لـ ${kName}`,
          `07:45 م: حمام دافئ وقصة مصورة قصيرة (${stageCode === '0-2' ? 'تهويدة هادئة' : 'حوار دافئ'})`,
        ],
        stepsEn: [
          `07:30 PM: Dim lights & zero screens for ${kName}`,
          `07:45 PM: Warm bath & short illustrated story`,
        ],
        taskTime: '07:45 م',
      },
      {
        id: 'nutrition-plan',
        topic: 'nutrition' as const,
        iconId: 'health' as const,
        tone: 'emerald' as const,
        bgKey: 'medical',
        badgeAr: `🥦 تغذية ومناعة · ${stageLabel}`,
        badgeEn: `🥦 Nutrition & Immunity · ${stageLabel}`,
        titleAr: `جدول وجبات التركيز والمناعة لـ ${kName}`,
        titleEn: `Focus & Immunity Meal Plan for ${kName}`,
        stepsAr: [
          `08:30 ص: فطور غني بالبروتين والشوفان والفواكه الطازجة لـ ${kName}`,
          `02:30 م: طبق مقسم بألوان مرحة (خضار مقرمش + بروتين مشوي)`,
        ],
        stepsEn: [
          `08:30 AM: Protein-rich oats & fresh fruit breakfast for ${kName}`,
          `02:30 PM: Fun divided plate (crunchy veggies + grilled protein)`,
        ],
        taskTime: '08:30 ص',
      },
      {
        id: 'behavior-plan',
        topic: 'behavior' as const,
        iconId: 'family' as const,
        tone: 'purple' as const,
        bgKey: 'assistant',
        badgeAr: `💛 تعديل السلوك · ${stageLabel}`,
        badgeEn: `💛 Positive Behavior · ${stageLabel}`,
        titleAr: `احتواء نوبات الغضب وبناء ثقة ${kName}`,
        titleEn: `Emotional Coaching & Confidence for ${kName}`,
        stepsAr: [
          `ركن الهدوء الآمن وتسمية المشاعر مع ${kName} بهدوء`,
          `تقديم خيارين إيجابيين لتعزيز استقلالية ${kName}`,
        ],
        stepsEn: [
          `Safe calm-down corner & naming feelings with ${kName}`,
          `Offer two positive choices to empower ${kName}`,
        ],
        taskTime: '05:00 م',
      },
      {
        id: 'play-plan',
        topic: 'play' as const,
        iconId: 'games' as const,
        tone: 'orange' as const,
        bgKey: 'games',
        badgeAr: `🎨 ذكاء ومونتيسوري · ${stageLabel}`,
        badgeEn: `🎨 Montessori & Play · ${stageLabel}`,
        titleAr: `٣ أنشطة منزلية لتنمية تركيز ولغة ${kName}`,
        titleEn: `3 Home Focus & Language Activities for ${kName}`,
        stepsAr: [
          `١٥ دقيقة فرز الألوان والأشكال الهندسية مع ${kName}`,
          `لعبة تمثيل الأدوار والحوار التفاعلي بدون شاشات`,
        ],
        stepsEn: [
          `15-min color & shape sorting activity with ${kName}`,
          `Interactive role-play & storytelling without screens`,
        ],
        taskTime: '04:30 م',
      },
      {
        id: 'reading-plan',
        topic: 'play' as const,
        iconId: 'media' as const,
        tone: 'teal' as const,
        bgKey: 'media',
        badgeAr: `📚 القراءة واللغة · ${stageLabel}`,
        badgeEn: `📚 Reading & Vocabulary · ${stageLabel}`,
        titleAr: `تحدي القراءة اليومي وتنمية خيال ${kName}`,
        titleEn: `Daily Reading & Imagination Challenge for ${kName}`,
        stepsAr: [
          `قراءة قصة مصورة وسؤال ${kName} عن نهاية بديلة للقصة`,
          `تعلم ٣ كلمات عربية وإنجليزية جديدة يوميًا باللعب`,
        ],
        stepsEn: [
          `Read an illustrated story & ask ${kName} for an alternate ending`,
          `Learn 3 new Arabic & English words daily through play`,
        ],
        taskTime: '06:30 م',
      },
      {
        id: 'independence-plan',
        topic: 'sleep' as const,
        iconId: 'star' as const,
        tone: 'amber' as const,
        bgKey: 'wishes',
        badgeAr: `🌟 الاستقلالية والاعتماد على النفس · ${stageLabel}`,
        badgeEn: `🌟 Self-Reliance · ${stageLabel}`,
        titleAr: `مهارات الاعتماد على النفس اليومية لـ ${kName}`,
        titleEn: `Daily Self-Reliance Habits for ${kName}`,
        stepsAr: [
          `ترتيب صندوق الألعاب وتجهيز ملابس الغد بمشاركة ${kName}`,
          `تحديث لوحة النجوم والمكافآت الأسبوعية في نكبر`,
        ],
        stepsEn: [
          `Tidy up toy box & prepare tomorrow's outfit with ${kName}`,
          `Update weekly star & reward chart in Nekbaar`,
        ],
        taskTime: '07:00 م',
      },
    ];

    const rotated = [
      ...allTemplates.slice(dynamicPlanOffset % allTemplates.length),
      ...allTemplates.slice(0, dynamicPlanOffset % allTemplates.length),
    ];
    return rotated.slice(0, 4);
  }, [displayKidName, dynamicPlanOffset, isEn, kidAge]);

  return (
    <section className="space-y-4" aria-label={isEn ? 'In-App AI Parenting Assistant' : 'المساعد الذكي للأسرة'}>
      {/* Compact Swipeable AI Agent Banners */}
      <SwipeableBannerCarousel
        slides={aiBanners}
        language={language}
        darkMode={darkMode}
        ariaLabel={isEn ? 'AI Agent Modes Carousel' : 'لافتات مساعد الذكاء الاصطناعي'}
      />

      {/* Interactive AI Parenting Assistant Chat Box */}
      <div className="rounded-2xl sm:rounded-3xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-surface)] dark:bg-[#101D26] p-3.5 sm:p-4 space-y-3 shadow-2xs soft-card-surface">
        {/* Top Row: Active Child Profile Strip (Horizontal Scrollable Carousel) */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[var(--color-border)]/70 dark:border-[#1E3646]">
          <div className="flex items-center gap-2 min-w-0">
            {selectedKid && kidAge && (
              <ThreeDChildAvatar
                name={selectedKid.name}
                gender={selectedKid.gender}
                stageCode={kidAge.stageCode}
                accessoryTheme={selectedKid.avatarTheme || 'astronaut'}
                photoDataUrl={selectedKid.photoDataUrl}
                useIllustratedAvatar={selectedKid.useIllustratedAvatar}
                size="sm"
              />
            )}
            <div className="min-w-0">
              <div className="text-xs sm:text-sm font-extrabold text-[var(--color-text)] dark:text-[#F8FAFC] truncate">
                🤖 {isEn ? 'Interactive AI Parenting Assistant' : 'محادثة المساعد الذكي للأسرة'}
              </div>
              <div className="text-[10.5px] font-bold text-[var(--color-muted)] dark:text-[#94A3B8] truncate">
                {isEn
                  ? `Tailored for ${displayKidName} (${kidAge?.label || '2–5 yrs'})`
                  : `إرشاد ذكي مخصص لـ ${displayKidName} (${kidAge?.label || '2–5 سنوات'})`}
              </div>
            </div>
          </div>

          {/* Horizontal Scrollable Child Selector Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap no-scrollbar py-0.5">
            {kids.map((k) => {
              const isSelected = selectedKid?.id === k.id;
              const ageSpec = calculateChildAge(k.birth, language);
              return (
                <button
                  key={k.id}
                  type="button"
                  onClick={() => setSelectedKidId(k.id)}
                  className={`px-2.5 py-1 rounded-xl text-[10.5px] font-extrabold border transition-all flex items-center gap-1 shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-[#0d9488] text-white border-[#0d9488] shadow-2xs'
                      : 'bg-[var(--color-control-muted)] dark:bg-[#142430] text-[var(--color-text)] dark:text-[#F8FAFC] border-[var(--color-border)] dark:border-[#1E3646] hover:border-[#0d9488]'
                  }`}
                >
                  <span>{k.emoji || '👶'}</span>
                  <span>{locText(k.name, language)}</span>
                  <span className="opacity-80 text-[9.5px]">({ageSpec.label})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Horizontal Scrollable Quick Recommendation Chips Based on Child Name */}
        <div
          role="region"
          aria-label={isEn ? 'Quick AI Prompts' : 'اقتراحات ذكية سريعة باسم طفلك'}
          className="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap no-scrollbar pb-0.5"
        >
          {quickCreationCards.map((chip) => (
            <button
              key={chip.topic}
              type="button"
              onClick={() => handleSendPrompt(isEn ? chip.promptEn : chip.promptAr, chip.topic)}
              className="px-2.5 py-1 rounded-xl text-[10.5px] font-extrabold border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-muted)] dark:bg-[#142430] text-[var(--color-text)] dark:text-[#A5F3FC] hover:border-[#FF8C61] transition-all flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <span>✨</span>
              <span>
                {isEn
                  ? `${chip.badgeEn} (${displayKidName})`
                  : `${chip.badgeAr} لـ ${displayKidName}`}
              </span>
            </button>
          ))}
        </div>

        {/* Conversational Thread */}
        <div className="space-y-3 max-h-[340px] overflow-y-auto pe-1">
          {messages.map((msg) => {
            const isParent = msg.sender === 'parent';
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isParent ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[92%] sm:max-w-[84%] rounded-2xl p-3 space-y-2 ${
                    isParent
                      ? 'bg-[#0e7490] text-white'
                      : 'bg-[var(--color-control-muted)] dark:bg-[#142430] text-[var(--color-text)] dark:text-[#F8FAFC] border border-[var(--color-border)] dark:border-[#1E3646]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-[10.5px] font-extrabold opacity-90">
                    <span className="inline-flex items-center gap-1.5">
                      {!isParent && <AiRobotHeadIcon size={18} />}
                      {isParent
                        ? isEn
                          ? 'You (Parent)'
                          : 'أنت (ولي الأمر)'
                        : isEn
                        ? 'AI Parenting Agent'
                        : 'مساعد الذكاء الاصطناعي'}
                    </span>
                    <span dir="ltr" className="tabular-nums">{msg.timestamp}</span>
                  </div>

                  <p className="text-xs font-semibold leading-relaxed">
                    {isEn ? msg.textEn : msg.textAr}
                  </p>

                  {msg.structuredCard && (
                    <div className="rounded-xl bg-white dark:bg-[#101D26] text-[var(--color-text)] dark:text-[#F8FAFC] border border-[var(--color-border)] dark:border-[#1E3646] p-2.5 space-y-2 shadow-2xs">
                      <div className="text-[11px] font-extrabold text-[#0d9488] dark:text-[#2DD4BF]">
                        📋 {isEn ? msg.structuredCard.badgeEn : msg.structuredCard.badgeAr}
                      </div>
                      <div className="space-y-1 text-[11px]">
                        {(isEn ? msg.structuredCard.stepsEn : msg.structuredCard.stepsAr).map(
                          (step, i) => (
                            <div
                              key={i}
                              className="rounded-lg bg-slate-50 dark:bg-[#142430] px-2.5 py-1.5 font-bold text-[var(--color-text)] dark:text-[#F8FAFC]"
                            >
                              {step}
                            </div>
                          )
                        )}
                      </div>
                      <div className="text-[11px] font-extrabold text-emerald-700 dark:text-[#A5F3FC]">
                        💡 {isEn ? msg.structuredCard.activityTipEn : msg.structuredCard.activityTipAr}
                      </div>
                      <div className="pt-0.5">
                        <PrimaryCtaButton
                          variant="teal"
                          size="sm"
                          onClick={() => {
                            onAddSuggestedRoutineTask(
                              isEn
                                ? `Evening Wind-down & Story with ${selectedKid?.name || 'Child'}`
                                : `طقس الهدوء والقصة المسائية مع ${selectedKid?.name || 'الطفل'}`,
                              '08:00 م',
                              selectedKid?.id || null
                            );
                            onShowToast(
                              isEn
                                ? 'Added suggested task to Daily Routine!'
                                : 'تمت إضافة المهمة المقترحة إلى جدول الروتين اليومي!'
                            );
                          }}
                        >
                          + {isEn ? 'Add to Daily Routine' : 'إضافة للروتين اليومي'}
                        </PrimaryCtaButton>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Interactive Voice Simulation Banner when active */}
        {isVoiceSimulating && (
          <div
            id="ai-voice-simulation-banner"
            className="rounded-2xl border border-teal-300 dark:border-[#1E3646] bg-teal-50/90 dark:bg-[#142430] px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 animate-fade-in"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="relative flex h-3 w-3 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500" />
              </span>
              <div className="min-w-0">
                <div className="text-[11px] font-black text-teal-950 dark:text-[#F8FAFC]">
                  {isEn
                    ? '🎤 Smart Voice Input Active...'
                    : '🎤 الاستماع الصوتي الذكي نشط الآن...'}
                </div>
                <p className="text-[10.5px] font-bold text-teal-800 dark:text-[#CBD5E1] truncate">
                  {inputPrompt}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  const nextIdx = (voiceSampleIdx + 1) % simulatedVoicePrompts.length;
                  setVoiceSampleIdx(nextIdx);
                  const nextSample = simulatedVoicePrompts[nextIdx];
                  setInputPrompt(isEn ? nextSample.en : nextSample.ar);
                }}
                className="px-2 py-1 rounded-lg text-[10px] font-extrabold border border-teal-200 dark:border-[#1E3646] bg-white dark:bg-[#101D26] text-teal-900 dark:text-[#A5F3FC] cursor-pointer"
              >
                {isEn ? '🔄 Next Sample' : '🔄 جملة أخرى'}
              </button>
              <button
                type="button"
                onClick={handleToggleVoiceSimulation}
                className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-rose-600 hover:bg-rose-700 text-white shadow-2xs cursor-pointer"
              >
                {isEn ? '✓ Send' : '✓ إرسال'}
              </button>
            </div>
          </div>
        )}

        {/* Input Composer with Clean Microphone Icon (🎤) */}
        <div className="pt-2.5 border-t border-[var(--color-border)] dark:border-[#1E3646] flex items-center gap-2">
          <button
            id="ai-voice-input-toggle-btn"
            data-testid="ai-voice-mic-btn"
            type="button"
            onClick={handleToggleVoiceSimulation}
            aria-pressed={isVoiceSimulating}
            aria-label={isEn ? 'Voice input microphone' : 'ميكروفون الإدخال الصوتي'}
            title={
              isEn
                ? 'Voice Input (Microphone)'
                : 'التحدث الصوتي مع المساعد الذكي'
            }
            className={`w-10 h-10 rounded-xl text-base font-extrabold border transition-all duration-300 ease-in-out inline-flex items-center justify-center shrink-0 cursor-pointer ${
              isVoiceSimulating
                ? 'border-rose-500 bg-rose-600 text-white shadow-md scale-105 animate-pulse'
                : 'border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-muted)] dark:bg-[#142430] text-[var(--color-text)] dark:text-[#A5F3FC] hover:border-[#FF8C61]'
            }`}
          >
            <span aria-hidden="true">{isVoiceSimulating ? '⏹️' : '🎤'}</span>
          </button>

          <input
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                setIsVoiceSimulating(false);
                handleSendPrompt();
              }
            }}
            placeholder={
              isEn
                ? `Ask AI about ${displayKidName}'s sleep, meals, or tap 🎤...`
                : `اسأل المساعد الذكي عن ${displayKidName} أو اضغط 🎤 للتحدث...`
            }
            className="flex-1 min-w-0 rounded-xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-bg)] dark:bg-[#142430] px-3 py-2 text-xs font-semibold text-[var(--color-text)] dark:text-[#F8FAFC]"
          />
          <PrimaryCtaButton
            variant="teal"
            size="sm"
            onClick={() => {
              setIsVoiceSimulating(false);
              handleSendPrompt();
            }}
          >
            {isEn ? 'Send ✨' : 'إرسال ✨'}
          </PrimaryCtaButton>
        </div>
      </div>

      {/* Personalized Family Action Plans Positioned Directly Beneath the Chat Interface */}
      <div
        id="ai-dynamic-child-plans-section"
        data-testid="ai-dynamic-child-plans-section"
        className="rounded-2xl sm:rounded-3xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-surface)] dark:bg-[#101D26] p-3.5 sm:p-4 space-y-3 soft-card-surface shadow-sm"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[var(--color-border)]/70 dark:border-[#1E3646]">
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-[var(--color-text)] dark:text-[#F8FAFC]">
              📋 {isEn ? `Personalized Action Plans for ${displayKidName}` : `خطط العمل المخصصة لـ ${displayKidName}`}
            </h3>
            <p className="text-[11px] font-semibold text-[var(--color-muted)] dark:text-[#94A3B8]">
              {isEn
                ? `Dynamically tailored to ${displayKidName}'s developmental stage (${kidAge?.label || '3–5 yrs'})`
                : `مُصممة ديناميكيًا حسب المرحلة العمرية والاهتمامات لـ ${displayKidName} (${kidAge?.label || '3–5 سنوات'})`}
            </p>
          </div>

          <button
            type="button"
            data-testid="extend-dynamic-child-plans-btn"
            onClick={() => {
              setDynamicPlanOffset((prev) => prev + 1);
              onShowToast(
                isEn
                  ? `Generated fresh developmental plans for ${displayKidName}!`
                  : `تم توليد وتوسيع خطط تربوية جديدة مخصصة لـ ${displayKidName}!`
              );
            }}
            className="min-h-[34px] px-3 py-1.5 rounded-xl text-[11px] font-extrabold bg-[#FF8C61] hover:bg-[#e86a3d] text-white shadow-2xs active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span>🔄</span>
            <span>{isEn ? 'Extend & Refresh Plans' : 'توليد خطط إضافية للطفل'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {dynamicChildPlans.map((plan, idx) => (
            <MasterPatternCard
              key={`${plan.id}-${selectedKid?.id || 0}`}
              tone={plan.tone}
              categoryKey={plan.bgKey}
              itemIdOrIndex={idx + 1 + dynamicPlanOffset}
              darkMode={darkMode}
              onThumbnailClick={() =>
                handleSendPrompt(isEn ? plan.titleEn : plan.titleAr, plan.topic)
              }
              topLeftBadge={isEn ? plan.badgeEn : plan.badgeAr}
              topRightBadge={<span>👶 {displayKidName}</span>}
              titlePrefixSlot={<ThreeDIcon id={plan.iconId} size={18} />}
              title={isEn ? plan.titleEn : plan.titleAr}
              bodyContent={
                <div className="space-y-1">
                  {(isEn ? plan.stepsEn : plan.stepsAr).map((st, sIdx) => (
                    <div
                      key={sIdx}
                      className="text-[10.5px] font-bold text-[var(--color-text)] dark:text-[#E2E8F0] bg-[var(--color-control-muted)]/70 dark:bg-[#142430] px-2 py-1 rounded-lg line-clamp-1"
                    >
                      • {st}
                    </div>
                  ))}
                </div>
              }
              footerLeft={
                <button
                  type="button"
                  onClick={() => handleSendPrompt(isEn ? plan.titleEn : plan.titleAr, plan.topic)}
                  className="text-[10.5px] font-extrabold text-[#0d9488] dark:text-[#2DD4BF] hover:underline cursor-pointer"
                >
                  {isEn ? 'Ask AI Details' : 'اسأل المساعد'}
                </button>
              }
              footerRight={
                <button
                  type="button"
                  onClick={() => {
                    onAddSuggestedRoutineTask(
                      isEn ? plan.titleEn : plan.titleAr,
                      plan.taskTime,
                      selectedKid?.id || null
                    );
                  }}
                  className="min-h-[30px] px-2.5 py-1 rounded-xl text-[10.5px] font-extrabold bg-[#0d9488] hover:bg-[#0f766e] text-white shadow-2xs active:scale-95 transition-all cursor-pointer"
                >
                  {isEn ? '+ Routine' : '+ للروتين'}
                </button>
              }
            />
          ))}
        </div>
      </div>
    </section>
  );
};

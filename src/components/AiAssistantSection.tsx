import React, { useState } from 'react';
import {
  ChildProfile,
  LanguageCode,
  calculateChildAge,
  locText,
  sanitizeUserText,
} from '../domain/familySpaceCore';
import { AiRobotHeadIcon } from './ThreeDVisuals';
import { PrimaryCtaButton } from './DesignSystem';

export type AiModelId = 'consultant' | 'planner' | 'behavior';

interface AiChatMessage {
  id: number;
  sender: 'parent' | 'ai';
  textAr: string;
  textEn: string;
  timestamp: string;
  modelBadgeAr?: string;
  modelBadgeEn?: string;
  structuredCard?: {
    badgeAr: string;
    badgeEn: string;
    stepsAr: string[];
    stepsEn: string[];
    activityTipAr: string;
    activityTipEn: string;
  };
}

interface AiConversationThread {
  id: string;
  titleAr: string;
  titleEn: string;
  dateLabelAr: string;
  dateLabelEn: string;
  modelId: AiModelId;
  messages: AiChatMessage[];
}

const AI_MODELS_SPEC: Array<{
  id: AiModelId;
  nameAr: string;
  nameEn: string;
  descAr: string;
  descEn: string;
  badgeAr: string;
  badgeEn: string;
  emoji: string;
}> = [
  {
    id: 'consultant',
    nameAr: 'مستشار تربوي',
    nameEn: 'Parenting Consultant',
    descAr: 'إرشاد نفسي وتربوي حديث مبني على مراحل نمو الطفل (0–8 سنوات)',
    descEn: 'Evidence-based child psychology & developmental guidance (ages 0–8)',
    badgeAr: '🧠 مستشار تربوي ذكي',
    badgeEn: '🧠 Parenting Consultant',
    emoji: '🧠',
  },
  {
    id: 'planner',
    nameAr: 'خطط يومية',
    nameEn: 'Daily Plans Architect',
    descAr: 'تصميم جداول النوم، الروتين اليومي، اللانش بوكس، وأنشطة مونتيسوري',
    descEn: 'Custom sleep schedules, daily routines, healthy lunchboxes & Montessori play',
    badgeAr: '📅 مهندس الخطط اليومية',
    badgeEn: '📅 Daily Plans Architect',
    emoji: '📅',
  },
  {
    id: 'behavior',
    nameAr: 'دعم سلوكي',
    nameEn: 'Behavioral Coach',
    descAr: 'حلول هادئة لنوبات الغضب، العناد، الغيرة بين الإخوة، وتقليل الشاشات',
    descEn: 'Calm co-regulation for tantrums, sibling rivalry & screen-free habits',
    badgeAr: '💛 مدرب الدعم السلوكي',
    badgeEn: '💛 Positive Behavior Coach',
    emoji: '💛',
  },
];

interface AiAssistantSectionProps {
  kids: ChildProfile[];
  parentName: string;
  city: string;
  language: LanguageCode;
  darkMode?: boolean;
  initialModelId?: AiModelId;
  initialHistoryOpen?: boolean;
  onAddSuggestedRoutineTask: (taskName: string, timeStr: string, kidId: number | null) => void;
  onShowToast: (msg: string) => void;
}

export const AiAssistantSection: React.FC<AiAssistantSectionProps> = ({
  kids,
  parentName,
  language,
  darkMode = false,
  initialModelId = 'consultant',
  initialHistoryOpen = false,
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

  const [activeModelId, setActiveModelId] = useState<AiModelId>(initialModelId);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState<boolean>(initialHistoryOpen);

  React.useEffect(() => {
    setActiveModelId(initialModelId);
  }, [initialModelId]);

  React.useEffect(() => {
    setShowHistoryDrawer(initialHistoryOpen);
  }, [initialHistoryOpen]);

  const activeModelSpec =
    AI_MODELS_SPEC.find((m) => m.id === activeModelId) || AI_MODELS_SPEC[0];

  const [inputPrompt, setInputPrompt] = useState<string>('');
  const [isVoiceSimulating, setIsVoiceSimulating] = useState<boolean>(false);
  const [voiceSampleIdx, setVoiceSampleIdx] = useState<number>(0);

  const simulatedVoicePrompts = [
    {
      topic: 'sleep',
      ar: `🎙️ «صمّم لي جدول نوم مسائي هادئ لـ ${selectedKid?.name || 'طفلي'} يبدأ الساعة ٨ مساءً بدون شاشات»`,
      en: `🎙️ "Create a calm 8:00 PM screen-free bedtime routine for ${displayKidName}"`,
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
        ? '🎙️ Voice recording active — tap again to send!'
        : '🎙️ جاري الاستماع لصوتك... اضغط مرة أخرى لإرسال الطلب الصوتي!'
    );
  };

  const defaultWelcomeMsg: AiChatMessage = {
    id: 1,
    sender: 'ai',
    textAr: `أهلًا ${parentName} 👋 أنا مساعدك الذكي بوضع «${activeModelSpec.nameAr}» لـ ${selectedKid ? selectedKid.name : 'طفلك'} (${kidAge?.label || '2–5 سنوات'}). اختر بطاقة سريعة أو اكتب سؤالك بالأسفل:`,
    textEn: `Hello ${displayParentName}! I am your AI Agent in "${activeModelSpec.nameEn}" mode for ${displayKidName} (${kidAge?.label || '2–5 yrs'}). Tap a quick card or ask below:`,
    timestamp: '09:00 AM',
    modelBadgeAr: activeModelSpec.badgeAr,
    modelBadgeEn: activeModelSpec.badgeEn,
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
  };

  const [messages, setMessages] = useState<AiChatMessage[]>([defaultWelcomeMsg]);

  const [savedThreads, setSavedThreads] = useState<AiConversationThread[]>([
    {
      id: 'thread-current',
      titleAr: `خطة روتين وتربية ${selectedKid?.name || 'حمزة'} اليومية`,
      titleEn: `${displayKidName}'s Daily Routine & Parenting Plan`,
      dateLabelAr: 'اليوم · نشط الآن',
      dateLabelEn: 'Today · Active Now',
      modelId: 'consultant',
      messages: [defaultWelcomeMsg],
    },
    {
      id: 'thread-sleep-calm',
      titleAr: 'تنظيم النوم المسائي الهادئ بدون شاشات',
      titleEn: 'Screen-Free Calm Bedtime Routine Setup',
      dateLabelAr: 'أمس · 08:30 م',
      dateLabelEn: 'Yesterday · 08:30 PM',
      modelId: 'planner',
      messages: [
        {
          id: 101,
          sender: 'parent',
          textAr: 'إزاي أخلي وقت النوم هادي من غير شد عصبي أو شاشات؟',
          textEn: 'How can I make bedtime calm without power struggles or screens?',
          timestamp: '08:28 PM',
        },
        {
          id: 102,
          sender: 'ai',
          textAr: 'إليك خطة التهدئة المسائية التدريجية في ٢٠ دقيقة لمساعدة الطفل على الاسترخاء الطبيعي:',
          textEn: 'Here is the 20-minute gradual evening wind-down blueprint for natural sleep:',
          timestamp: '08:29 PM',
          modelBadgeAr: '📅 مهندس الخطط اليومية',
          modelBadgeEn: '📅 Daily Plans Architect',
          structuredCard: {
            badgeAr: 'طقس النوم الهادئ (٣ خطوات)',
            badgeEn: 'Calm Sleep Ritual (3 Steps)',
            stepsAr: [
              '١. تخفيت الإضاءة قبل النوم بـ ٣٠ دقيقة وإغلاق التلفزيون.',
              '٢. حمام دافئ سريع واختيار قصة مصورة واحدة.',
              '٣. تمرين التنفس الهادئ مع حضن مطمئن قبل إطفاء النور.',
            ],
            stepsEn: [
              '1. Dim lights 30 minutes before bed and turn off TV.',
              '2. Quick warm bath and let the child pick one picture book.',
              '3. Deep calm breathing and a reassuring hug before lights out.',
            ],
            activityTipAr: 'يمكنك تفعيل «وضع وقت النوم الدافئ 🕯️» من القائمة الجانبية.',
            activityTipEn: 'You can enable the Warm Bedtime Filter 🕯️ from the Slide Bar.',
          },
        },
      ],
    },
    {
      id: 'thread-tantrums',
      titleAr: 'التعامل التربوي الهادئ مع نوبات الغضب والعناد',
      titleEn: 'Gentle Co-Regulation for Tantrums & Defiance',
      dateLabelAr: 'منذ ٣ أيام',
      dateLabelEn: '3 days ago',
      modelId: 'behavior',
      messages: [
        {
          id: 201,
          sender: 'parent',
          textAr: 'طفلي بيعاند جداً وقت لمّ الألعاب، أتصرف إزاي بهدوء؟',
          textEn: 'My child resists toy cleanup strongly, how do I respond calmly?',
          timestamp: '05:15 PM',
        },
        {
          id: 202,
          sender: 'ai',
          textAr: 'تحويل وقت الترتيب إلى لعبة سباق قصيرة مع التخيير الإيجابي يقلل العناد بنسبة ٨٠٪:',
          textEn: 'Turning cleanup into a short race game with positive choices reduces resistance by 80%:',
          timestamp: '05:16 PM',
          modelBadgeAr: '💛 مدرب الدعم السلوكي',
          modelBadgeEn: '💛 Positive Behavior Coach',
          structuredCard: {
            badgeAr: 'خطة التنظيم المشترك (Co-Regulation)',
            badgeEn: 'Co-Regulation Cleanup Plan',
            stepsAr: [
              '١. التمهيد المسبق: «فاضل ٥ دقايق ونودّي المكعبات بيتها تنام».',
              '٢. التخيير المحدود: «تحب نلم المكعبات الحمراء الأول ولا الزرقاء؟».',
              '٣. الاحتفال الفوري بنجمة اليوم بعد وضع آخر لعبة.',
            ],
            stepsEn: [
              '1. 5-minute transition warning before cleanup starts.',
              '2. Offer two choices: "Red blocks first or blue blocks first?".',
              '3. Celebrate immediately with a Star of the Day badge.',
            ],
            activityTipAr: 'جربي إضافة مهمة «ترتيب الألعاب المسائي» في الروتين اليومي لتحفيز طفلك بالاحتفال.',
            activityTipEn: 'Add "Evening Toy Tidy-Up" to Daily Routine to trigger the completion celebration.',
          },
        },
      ],
    },
  ]);

  const [activeThreadId, setActiveThreadId] = useState<string>('thread-current');

  const handleSelectThread = (thread: AiConversationThread) => {
    setActiveThreadId(thread.id);
    setActiveModelId(thread.modelId);
    setMessages(thread.messages);
    onShowToast(
      isEn
        ? `Opened conversation: "${thread.titleEn}"`
        : `تم فتح المحادثة: «${thread.titleAr}»`
    );
  };

  const handleStartNewChat = () => {
    const newId = `thread-${Date.now()}`;
    const freshMsg: AiChatMessage = {
      ...defaultWelcomeMsg,
      id: Date.now(),
      textAr: `محادثة جديدة (${activeModelSpec.nameAr}) 👋 كيف يمكنني مساعدتك اليوم مع ${selectedKid?.name || 'طفلك'}؟`,
      textEn: `New Chat (${activeModelSpec.nameEn}) 👋 How can I help you today with ${displayKidName}?`,
      modelBadgeAr: activeModelSpec.badgeAr,
      modelBadgeEn: activeModelSpec.badgeEn,
    };
    const newThread: AiConversationThread = {
      id: newId,
      titleAr: `محادثة جديدة · ${activeModelSpec.nameAr}`,
      titleEn: `New Chat · ${activeModelSpec.nameEn}`,
      dateLabelAr: 'الآن',
      dateLabelEn: 'Just now',
      modelId: activeModelId,
      messages: [freshMsg],
    };
    setSavedThreads((prev) => [newThread, ...prev]);
    setActiveThreadId(newId);
    setMessages([freshMsg]);
    onShowToast(
      isEn
        ? `Started a new "${activeModelSpec.nameEn}" conversation!`
        : `تم بدء محادثة جديدة بوضع «${activeModelSpec.nameAr}»!`
    );
  };

  const handleDeleteThread = (idToRemove: string) => {
    setSavedThreads((prev) => {
      const remaining = prev.filter((tItem) => tItem.id !== idToRemove);
      if (remaining.length === 0) {
        return [
          {
            id: 'thread-current',
            titleAr: 'محادثة جديدة',
            titleEn: 'New Conversation',
            dateLabelAr: 'الآن',
            dateLabelEn: 'Just now',
            modelId: activeModelId,
            messages: [defaultWelcomeMsg],
          },
        ];
      }
      if (activeThreadId === idToRemove) {
        setActiveThreadId(remaining[0].id);
        setMessages(remaining[0].messages);
      }
      return remaining;
    });
  };

  const handleSendPrompt = (customText?: string, topicHint?: string) => {
    const promptText = sanitizeUserText(customText ?? inputPrompt, 500);
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

  return (
    <section
      className="min-h-[calc(100vh-145px)] flex flex-col"
      aria-label={isEn ? 'In-App AI Parenting Assistant' : 'مساعد نكبر الذكي'}
    >
      {/* Full-Page Immersive ChatGPT / Gemini-Standard AI Workspace */}
      <div className="flex-1 min-h-[calc(100vh-155px)] rounded-3xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-surface)] dark:bg-[#101D26] p-4 sm:p-6 flex flex-col justify-between gap-4 shadow-sm soft-card-surface relative overflow-hidden">
        {/* Top Control Bar: History Side-Drawer Trigger + New Chat + Child Selector + Distraction-Free Model Switcher */}
        <div
          id="ai-platform-control-bar"
          data-testid="ai-platform-control-bar"
          className="flex flex-wrap items-center justify-between gap-2.5 pb-3.5 border-b border-[var(--color-border)]/70 dark:border-[#1E3646]"
        >
          {/* Left / Start: Side History Drawer Toggle + New Chat + Child Selector */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              id="ai-history-drawer-toggle-btn"
              data-testid="ai-history-drawer-toggle-btn"
              type="button"
              onClick={() => setShowHistoryDrawer((prev) => !prev)}
              aria-expanded={showHistoryDrawer}
              className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-extrabold border transition-all inline-flex items-center gap-1.5 cursor-pointer ${
                showHistoryDrawer
                  ? 'bg-[#0d9488] text-white border-[#0d9488] shadow-2xs'
                  : 'bg-[var(--color-control-muted)] dark:bg-[#142430] text-[var(--color-text)] dark:text-[#F8FAFC] border-[var(--color-border)] dark:border-[#1E3646] hover:border-[#0d9488]'
              }`}
            >
              <span>🗂️</span>
              <span>{isEn ? 'Chat History' : 'سجل المحادثات'}</span>
              <span className="px-1.5 py-0.2 rounded-full bg-black/15 text-[10px] tabular-nums">
                {savedThreads.length}
              </span>
            </button>

            <button
              id="ai-new-chat-btn"
              data-testid="ai-new-chat-btn"
              type="button"
              onClick={handleStartNewChat}
              className="min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-extrabold border border-teal-500/35 bg-teal-500/10 hover:bg-[#0d9488] hover:text-white text-[#0d9488] dark:text-[#2DD4BF] transition-all inline-flex items-center gap-1 cursor-pointer"
            >
              <span>＋</span>
              <span>{isEn ? 'New Chat' : 'محادثة جديدة'}</span>
            </button>

            {kids.length > 0 && (
              <select
                value={selectedKid?.id || 0}
                onChange={(e) => setSelectedKidId(Number(e.target.value))}
                aria-label={isEn ? 'Select Child Profile' : 'اختيار ملف الطفل'}
                className="min-h-[38px] rounded-xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-muted)] dark:bg-[#142430] px-3 py-1.5 text-xs font-extrabold text-[var(--color-text)] dark:text-[#F8FAFC] cursor-pointer"
              >
                {kids.map((k) => {
                  const ageSpec = calculateChildAge(k.birth, language);
                  return (
                    <option key={k.id} value={k.id}>
                      {k.emoji || '👶'} {locText(k.name, language)} ({ageSpec.label})
                    </option>
                  );
                })}
              </select>
            )}
          </div>

          {/* Right / End: Distraction-Free Model Selector (مستشار تربوي | خطط يومية | دعم سلوكي) */}
          <div
            role="tablist"
            aria-label={isEn ? 'Switch AI Assistant Model' : 'تبديل موديل المساعد الذكي'}
            className="flex items-center gap-1 rounded-2xl bg-[var(--color-control-muted)] dark:bg-[#142430] p-1 border border-[var(--color-border)] dark:border-[#1E3646] overflow-x-auto whitespace-nowrap no-scrollbar max-w-full"
          >
            {AI_MODELS_SPEC.map((mod) => {
              const isSelected = activeModelId === mod.id;
              return (
                <button
                  key={mod.id}
                  id={`ai-model-tab-${mod.id}`}
                  data-testid={`ai-model-tab-${mod.id}`}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => {
                    setActiveModelId(mod.id);
                    onShowToast(
                      isEn
                        ? `Switched AI Model to: ${mod.nameEn}`
                        : `تم تبديل موديل المساعد إلى: «${mod.nameAr}»`
                    );
                  }}
                  className={`min-h-[34px] px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all inline-flex items-center gap-1.5 shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-[#0d9488] text-white shadow-2xs'
                      : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
                  }`}
                >
                  <span>{mod.emoji}</span>
                  <span>{isEn ? mod.nameEn : mod.nameAr}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Body Area: Side-Drawer History + Full-Height Chat Stream */}
        <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-[420px] overflow-hidden">
          {/* Collapsible Side-Drawer Conversation History (سجل المحادثات السابقة) */}
          {showHistoryDrawer && (
            <aside
              id="ai-history-drawer-panel"
              data-testid="ai-history-drawer-panel"
              className="w-full lg:w-72 shrink-0 rounded-2xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-muted)]/60 dark:bg-[#142430] p-3.5 flex flex-col justify-between gap-3 animate-tab-enter overflow-y-auto max-h-[520px]"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-[var(--color-border)]/60 dark:border-[#1E3646]">
                  <span className="text-xs font-black text-[var(--color-text)] dark:text-[#F8FAFC]">
                    🗂️ {isEn ? 'Conversation History' : 'سجل المحادثات المحفوظة'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowHistoryDrawer(false)}
                    className="text-xs font-bold text-[var(--color-muted)] hover:text-[var(--color-text)] cursor-pointer"
                  >
                    {isEn ? 'Close ×' : 'إغلاق ×'}
                  </button>
                </div>

                <div className="space-y-2">
                  {savedThreads.map((th) => {
                    const isCurrent = th.id === activeThreadId;
                    const modSpec =
                      AI_MODELS_SPEC.find((m) => m.id === th.modelId) || AI_MODELS_SPEC[0];
                    return (
                      <div
                        key={th.id}
                        className={`rounded-xl border p-3 flex flex-col justify-between gap-2 transition-all ${
                          isCurrent
                            ? 'border-[#0d9488] bg-teal-50/90 dark:bg-[#101D26] shadow-2xs'
                            : 'border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-surface)] dark:bg-[#0B131A]'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => handleSelectThread(th)}
                          className="text-start space-y-1 cursor-pointer min-w-0"
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="px-2 py-0.5 rounded-md bg-teal-500/15 text-[#0d9488] dark:text-[#2DD4BF] text-[9.5px] font-extrabold truncate">
                              {modSpec.emoji} {isEn ? modSpec.nameEn : modSpec.nameAr}
                            </span>
                            <span className="text-[9.5px] font-bold text-[var(--color-muted)] shrink-0">
                              {isEn ? th.dateLabelEn : th.dateLabelAr}
                            </span>
                          </div>
                          <div className="text-xs font-extrabold text-[var(--color-text)] dark:text-[#F8FAFC] line-clamp-2">
                            {isEn ? th.titleEn : th.titleAr}
                          </div>
                        </button>

                        <div className="flex items-center justify-between gap-1 pt-1.5 border-t border-[var(--color-border)]/50 dark:border-[#1E3646]">
                          <span className="text-[10px] font-bold text-[var(--color-muted)]">
                            {th.messages.length} {isEn ? 'messages' : 'رسائل'}
                          </span>
                          {savedThreads.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleDeleteThread(th.id)}
                              className="text-[10px] font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                            >
                              {isEn ? 'Delete' : 'حذف'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </aside>
          )}

          {/* Center Full-Page Conversational Stream with Ample Whitespace */}
          <div className="flex-1 flex flex-col justify-between gap-4 overflow-y-auto px-1 sm:px-3 py-2">
            <div className="max-w-3xl w-full mx-auto space-y-4">
              {messages.map((msg) => {
                const isParent = msg.sender === 'parent';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isParent ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[92%] sm:max-w-[82%] rounded-3xl p-4 sm:p-5 space-y-2.5 shadow-2xs ${
                        isParent
                          ? 'bg-[#0e7490] text-white rounded-ee-lg'
                          : 'bg-[var(--color-control-muted)]/75 dark:bg-[#142430] text-[var(--color-text)] dark:text-[#F8FAFC] border border-[var(--color-border)] dark:border-[#1E3646] rounded-es-lg'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3 text-[11px] font-extrabold opacity-90">
                        <span className="inline-flex items-center gap-2">
                          {!isParent && <AiRobotHeadIcon size={20} />}
                          <span>
                            {isParent
                              ? isEn
                                ? 'You (Parent)'
                                : 'أنت (ولي الأمر)'
                              : isEn
                              ? msg.modelBadgeEn || activeModelSpec.badgeEn
                              : msg.modelBadgeAr || activeModelSpec.badgeAr}
                          </span>
                        </span>
                        <span dir="ltr" className="tabular-nums text-[10px] opacity-80">
                          {msg.timestamp}
                        </span>
                      </div>

                      <p className="text-xs sm:text-sm font-semibold leading-relaxed">
                        {isEn ? msg.textEn : msg.textAr}
                      </p>

                      {msg.structuredCard && (
                        <div className="rounded-2xl bg-white dark:bg-[#101D26] text-[var(--color-text)] dark:text-[#F8FAFC] border border-[var(--color-border)] dark:border-[#1E3646] p-3.5 sm:p-4 space-y-2.5 shadow-2xs">
                          <div className="text-xs font-extrabold text-[#0d9488] dark:text-[#2DD4BF]">
                            📋 {isEn ? msg.structuredCard.badgeEn : msg.structuredCard.badgeAr}
                          </div>
                          <div className="space-y-1.5 text-xs">
                            {(isEn ? msg.structuredCard.stepsEn : msg.structuredCard.stepsAr).map(
                              (step, i) => (
                                <div
                                  key={i}
                                  className="rounded-xl bg-slate-50 dark:bg-[#142430] px-3 py-2 font-bold text-[var(--color-text)] dark:text-[#F8FAFC] flex items-center justify-between gap-2"
                                >
                                  <span>{step}</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const cleanStep = step.replace(/^[٠-٩0-9]+[.\-)]\s*/, '').trim();
                                      onAddSuggestedRoutineTask(
                                        `${cleanStep} (${selectedKid?.name || 'الطفل'})`,
                                        '07:30 م',
                                        selectedKid?.id || null
                                      );
                                      onShowToast(
                                        isEn
                                          ? `✨ Added step to ${displayKidName}'s Daily Routine!`
                                          : `✨ تمت إضافة الخطوة مباشرة إلى الروتين اليومي لـ ${selectedKid?.name || 'طفلك'}!`
                                      );
                                    }}
                                    className="px-2 py-0.5 rounded-lg bg-teal-500/12 hover:bg-[#0d9488] hover:text-white text-[#0d9488] dark:text-[#2DD4BF] text-[10px] font-black shrink-0 transition-all cursor-pointer"
                                    title={isEn ? 'Add this step to Daily Routine' : 'أضف هذه الخطوة للروتين اليومي'}
                                  >
                                    + {isEn ? 'Add' : 'أضف'}
                                  </button>
                                </div>
                              )
                            )}
                          </div>
                          <div className="text-xs font-extrabold text-emerald-700 dark:text-[#A5F3FC]">
                            💡 {isEn ? msg.structuredCard.activityTipEn : msg.structuredCard.activityTipAr}
                          </div>
                          <div className="pt-1">
                            <PrimaryCtaButton
                              data-testid="ai-magic-add-routine-btn"
                              variant="teal"
                              size="sm"
                              onClick={() => {
                                const badgeTaskTitle = isEn
                                  ? `${msg.structuredCard?.badgeEn || 'AI Plan'} — ${displayKidName}`
                                  : `${msg.structuredCard?.badgeAr || 'خطة المساعد الذكي'} — ${selectedKid?.name || 'الطفل'}`;
                                onAddSuggestedRoutineTask(
                                  badgeTaskTitle,
                                  '08:00 م',
                                  selectedKid?.id || null
                                );
                                onShowToast(
                                  isEn
                                    ? `✨ Magic Action: Added "${badgeTaskTitle}" to shared Daily Routine!`
                                    : `✨ تم تحويل نصيحة المساعد الذكي «${badgeTaskTitle}» إلى مهمة مشتركة في الروتين اليومي!`
                                );
                              }}
                            >
                              ✨ {isEn ? 'Add to Daily Routine' : 'أضف إلى الروتين اليومي'}
                            </PrimaryCtaButton>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Suggested Starter Prompts Above Composer Dock */}
            <div className="max-w-3xl w-full mx-auto pt-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
              {[
                {
                  topic: 'sleep',
                  labelAr: '🌙 جدول نوم مسائي هادئ',
                  labelEn: '🌙 Calm Bedtime Routine',
                },
                {
                  topic: 'food',
                  labelAr: '🍱 أفكار لانش بوكس صحي',
                  labelEn: '🍱 Healthy Lunchbox Ideas',
                },
                {
                  topic: 'behavior',
                  labelAr: '💛 تهدئة نوبات الغضب والعناد',
                  labelEn: '💛 Calm Tantrum Co-Regulation',
                },
                {
                  topic: 'play',
                  labelAr: '🧸 نشاط مونتيسوري ١٥ دقيقة',
                  labelEn: '🧸 15-Min Montessori Play',
                },
              ].map((chip) => (
                <button
                  key={chip.topic}
                  type="button"
                  onClick={() =>
                    handleSendPrompt(
                      isEn ? chip.labelEn : chip.labelAr,
                      chip.topic
                    )
                  }
                  className="px-3.5 py-1.5 rounded-full border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-muted)]/60 dark:bg-[#142430] hover:border-[#0d9488] text-[11px] font-extrabold text-[var(--color-text)] dark:text-[#F8FAFC] whitespace-nowrap shrink-0 transition-all cursor-pointer"
                >
                  {isEn ? chip.labelEn : chip.labelAr}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Interactive Voice Simulation Banner when active */}
        {isVoiceSimulating && (
          <div
            id="ai-voice-simulation-banner"
            className="max-w-3xl w-full mx-auto rounded-2xl border border-teal-300 dark:border-[#1E3646] bg-teal-50/90 dark:bg-[#142430] px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 animate-fade-in"
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
                className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold border border-teal-200 dark:border-[#1E3646] bg-white dark:bg-[#101D26] text-teal-900 dark:text-[#A5F3FC] cursor-pointer"
              >
                {isEn ? '🔄 Next Sample' : '🔄 جملة أخرى'}
              </button>
              <button
                type="button"
                onClick={handleToggleVoiceSimulation}
                className="px-3 py-1 rounded-lg text-[10px] font-extrabold bg-rose-600 hover:bg-rose-700 text-white shadow-2xs cursor-pointer"
              >
                {isEn ? '✓ Send' : '✓ إرسال'}
              </button>
            </div>
          </div>
        )}

        {/* Bottom Dock: ChatGPT/Gemini-Standard Composer Bar */}
        <div className="max-w-3xl w-full mx-auto pt-3 border-t border-[var(--color-border)] dark:border-[#1E3646] flex items-center gap-2.5">
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
            className={`w-11 h-11 rounded-2xl text-base font-extrabold border transition-all duration-300 ease-in-out inline-flex items-center justify-center shrink-0 cursor-pointer ${
              isVoiceSimulating
                ? 'border-rose-500 bg-rose-600 text-white shadow-md scale-105 animate-pulse'
                : 'border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-muted)] dark:bg-[#142430] text-[var(--color-text)] dark:text-[#A5F3FC] hover:border-[#FF8C61]'
            }`}
          >
            <span aria-hidden="true">{isVoiceSimulating ? '⏹️' : '🎤'}</span>
          </button>

          <input
            type="text"
            maxLength={500}
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
                ? `Message ${activeModelSpec.nameEn} (${displayKidName})...`
                : `اكتب رسالتك لـ «${activeModelSpec.nameAr}» بخصوص ${displayKidName}...`
            }
            className="flex-1 min-w-0 min-h-[44px] rounded-2xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-bg)] dark:bg-[#142430] px-4 py-2.5 text-xs sm:text-sm font-semibold text-[var(--color-text)] dark:text-[#F8FAFC] focus:outline-none focus:border-[#0d9488]"
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
    </section>
  );
};

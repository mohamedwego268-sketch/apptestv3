import React, { useEffect, useMemo, useState } from 'react';
import { calculateChildAge, ChildProfile, LanguageCode, locText } from '../domain/familySpaceCore';
import type { RecommendationProfile } from '../domain/contentRecommendationEngine';
import {
  buildChildStageEmotionalGuidance,
  buildFamilyBondingRituals,
  buildParentEmotionalSupportCards,
  buildPositiveParentingAdviceList,
  buildScenarioPersonalizedAddOn,
  ChildMoodId,
  FamilyBondingModeId,
  HouseholdCoordination,
  HouseholdEnergy,
  ParentSupportRole,
  PositiveParentingFocusId,
} from '../domain/familyWellbeingEngine';

const CHILD_MOODS: Array<{
  id: ChildMoodId;
  emoji: string;
  labelAr: string;
  labelEn: string;
  responseAr: string;
  responseEn: string;
}> = [
  { id: 'happy', emoji: '😊', labelAr: 'مبسوط', labelEn: 'Happy', responseAr: 'شاركوه فرحته واسألوه: إيه أكتر حاجة حلوة حصلت النهارده؟', responseEn: 'Share the moment and ask: What was the best part of your day?' },
  { id: 'calm', emoji: '😌', labelAr: 'هادئ', labelEn: 'Calm', responseAr: 'استغلوا الهدوء في تواصل بسيط أو نشاط يحبه، من غير تحويل اللحظة لاختبار.', responseEn: 'Use the calm moment for connection or a favorite activity, without turning it into a test.' },
  { id: 'sad', emoji: '😢', labelAr: 'زعلان', labelEn: 'Sad', responseAr: 'اسمعوه من غير استعجال للحلول. قولوا: أنا جنبك، تحب تحكي ولا نقعد سوا شوية؟', responseEn: 'Listen without rushing to fix it. Say: I’m here. Would you like to talk or sit together?' },
  { id: 'angry', emoji: '😠', labelAr: 'متضايق أو غضبان', labelEn: 'Angry', responseAr: 'حافظوا على الأمان والهدوء، وسمّوا الشعور مع تثبيت الحدود: من حقك تغضب، ومش مسموح نؤذي حد.', responseEn: 'Keep everyone safe and calm. Name the feeling while holding the limit: You can feel angry; hurting someone is not okay.' },
  { id: 'worried', emoji: '😟', labelAr: 'قلقان', labelEn: 'Worried', responseAr: 'اسألوه عن أكثر شيء مقلقه، ووضحوا الخطوة القادمة ببساطة. ما تقللوش من خوفه.', responseEn: 'Ask what worries them most and explain the next step simply. Do not dismiss the fear.' },
  { id: 'tired', emoji: '😴', labelAr: 'مرهق', labelEn: 'Tired', responseAr: 'خففوا المطالب والاختيارات، وراجعوا احتياجه للراحة والطعام والهدوء حسب روتينه.', responseEn: 'Reduce demands and choices. Check whether rest, food or quiet time would help.' },
  { id: 'overwhelmed', emoji: '🥺', labelAr: 'حاسس إن كل حاجة كتير', labelEn: 'Overwhelmed', responseAr: 'قسّموا الموقف لخطوة واحدة صغيرة، وابقوا قريبين منه. مش لازم يحل كل حاجة دلوقتي.', responseEn: 'Break the moment into one small step and stay close. They do not need to solve everything now.' },
];

const PARENTING_SCENARIOS = [
  {
    id: 'big-feelings',
    emoji: '🌋',
    titleAr: 'نوبة غضب أو انفعال',
    titleEn: 'Big feelings or a meltdown',
    stepsAr: ['تأكدوا أن المكان آمن، وقللوا الكلام والمثيرات وقت الانفعال.', 'سمّوا الشعور بهدوء، من غير سخرية أو تهديد.', 'بعد الهدوء، اتفقوا على طريقة آمنة للتعبير في المرة القادمة.'],
    stepsEn: ['Make the space safe and reduce words and stimulation during the peak.', 'Name the feeling calmly; avoid ridicule or threats.', 'After things settle, agree on a safer way to express the feeling next time.'],
    phraseAr: '«أنا شايف إنك متضايق. أنا جنبك، وهنحل الموضوع لما نهدى.»',
    phraseEn: '“I can see you’re upset. I’m here, and we’ll work it out when we’re calmer.”',
    avoidAr: 'تجنبوا الصراخ، الإهانة، المقارنة، أو إجبار الطفل على الاعتذار وهو ما زال منفعلاً.',
    avoidEn: 'Avoid shouting, shaming, comparisons or forcing an apology while the child is still overwhelmed.',
    seekAr: 'اطلبوا رأي مختص إذا كانت النوبات شديدة أو متكررة جدًا أو تؤثر بوضوح على الحياة اليومية أو السلامة.',
    seekEn: 'Seek professional guidance if episodes are very intense or frequent, or significantly affect daily life or safety.',
  },
  {
    id: 'screen-change',
    emoji: '📱',
    titleAr: 'صعوبة إيقاف الشاشة',
    titleEn: 'Screen-time transitions',
    stepsAr: ['اتفقوا على وقت واضح قبل بدء المشاهدة.', 'استخدموا تنبيهًا قبل النهاية بخمس دقائق، ثم اختيارين مقبولين للنشاط التالي.', 'نفذوا الاتفاق بهدوء وثبات، وراجعوا القاعدة لاحقًا إذا لم تكن مناسبة.'],
    stepsEn: ['Agree on a clear limit before screen time begins.', 'Give a five-minute warning, then offer two acceptable next activities.', 'Follow through calmly and revisit the rule later if it is not workable.'],
    phraseAr: '«فاضل خمس دقايق. بعد ما نخلص، تختار نرسم ولا نلعب بالمكعبات؟»',
    phraseEn: '“Five minutes left. When we finish, would you like to draw or play with blocks?”',
    avoidAr: 'تجنبوا التهديدات المفاجئة أو استخدام الشاشة كمكافأة وعقاب لكل موقف.',
    avoidEn: 'Avoid sudden threats or making screens the reward or punishment for every situation.',
    seekAr: 'لو استخدام الشاشة يسبب صراعًا يوميًا مستمرًا أو يؤثر على النوم أو الدراسة أو العلاقات، ناقشوا خطة مناسبة مع مختص.',
    seekEn: 'If screen use causes persistent daily conflict or affects sleep, learning or relationships, discuss a plan with a professional.',
  },
  {
    id: 'school-worry',
    emoji: '🎒',
    titleAr: 'قلق الحضانة أو المدرسة',
    titleEn: 'Nursery or school worries',
    stepsAr: ['اسمعوا القلق من غير تقليل أو وعود غير مضمونة.', 'حضّروا الطفل لخطوات اليوم بروتين بسيط ومتوقع.', 'تواصلوا مع المعلم لفهم ما يحدث خلال اليوم والاتفاق على متابعة.'],
    stepsEn: ['Listen without dismissing the worry or making promises you cannot guarantee.', 'Prepare the child with a simple, predictable routine.', 'Talk with the teacher to understand the day and agree on follow-up.'],
    phraseAr: '«واضح إن الموضوع مقلقك. خلينا نفكر سوا إيه اللي ممكن يساعدك أول ما توصل.»',
    phraseEn: '“I can see this feels worrying. Let’s think together about what might help when you arrive.”',
    avoidAr: 'تجنبوا وصف الطفل بالضعف أو تهديده بتركه، ولا تطيلوا الوداع بطريقة تزيد التوتر.',
    avoidEn: 'Avoid calling the child weak, threatening to leave, or prolonging goodbye in a way that increases stress.',
    seekAr: 'استشيروا مختصًا إذا استمر القلق أو صاحبه رفض شديد أو أعراض جسدية أو تراجع واضح في الأداء.',
    seekEn: 'Consult a professional if anxiety persists or comes with severe refusal, physical symptoms or a clear decline in functioning.',
  },
  {
    id: 'siblings',
    emoji: '🤝',
    titleAr: 'خلاف بين الإخوة',
    titleEn: 'Sibling conflict',
    stepsAr: ['أوقفوا الأذى أولًا وافصلوا الأطفال بهدوء إذا لزم.', 'اسمعوا كل طفل على حدة، من غير تحديد مذنب مسبقًا.', 'ساعدوهم على اقتراح حل أو إصلاح الضرر بعد الهدوء.'],
    stepsEn: ['Stop any harm first and calmly separate the children if needed.', 'Hear each child separately without deciding who is guilty in advance.', 'Help them suggest a solution or repair harm once calm.'],
    phraseAr: '«هسمع كل واحد فيكم. نقدر نختلف، لكن من غير ضرب أو إهانة.»',
    phraseEn: '“I’ll listen to each of you. We can disagree, but no hitting or insulting.”',
    avoidAr: 'تجنبوا المقارنة أو تثبيت أدوار مثل المشاغب والمظلوم بشكل دائم.',
    avoidEn: 'Avoid comparisons or permanently labeling one child as the troublemaker and another as the victim.',
    seekAr: 'اطلبوا مساعدة متخصصة إذا تكرر الأذى أو وُجد خوف أو تهديد أو فرق كبير في القوة بين الأطفال.',
    seekEn: 'Seek specialist support if harm repeats or there is fear, intimidation or a major power imbalance.',
  },
  {
    id: 'bedtime',
    emoji: '🌙',
    titleAr: 'مقاومة النوم',
    titleEn: 'Bedtime resistance',
    stepsAr: ['راجعوا الجوع أو العطش أو الانزعاج أو تغير الروتين قبل افتراض العناد.', 'ثبتوا تسلسلًا قصيرًا ومريحًا قبل النوم.', 'قدموا اختيارين صغيرين داخل موعد النوم المتفق عليه.'],
    stepsEn: ['Check for hunger, thirst, discomfort or routine changes before assuming defiance.', 'Keep a short, calming and predictable bedtime sequence.', 'Offer two small choices within the agreed bedtime.'],
    phraseAr: '«تحب نقرأ قصة قصيرة ولا نختار نشاط هادي تحبه قبل النوم؟»',
    phraseEn: '“Would you like a short story or a quiet activity you enjoy before bed?”',
    avoidAr: 'تجنبوا تحويل النوم لمعركة أو تهديد الطفل بالعقاب.',
    avoidEn: 'Avoid turning bedtime into a battle or threatening punishment.',
    seekAr: 'استشيروا طبيب الأطفال إذا كانت هناك صعوبات نوم مستمرة أو شخير شديد أو تأثير ملحوظ على نشاط الطفل.',
    seekEn: 'Talk with a pediatric clinician about persistent sleep difficulty, significant snoring or noticeable effects on daytime functioning.',
  },
  {
    id: 'learning-frustration',
    emoji: '📚',
    titleAr: 'إحباط من المذاكرة أو التعلم',
    titleEn: 'Learning frustration',
    stepsAr: ['اكتشفوا هل المهمة صعبة أو طويلة أو غير واضحة.', 'قسموها لخطوة صغيرة مع استراحة قصيرة عند الحاجة.', 'امدحوا المحاولة والاستراتيجية، وليس الدرجة فقط.'],
    stepsEn: ['Find out whether the task is too hard, too long or unclear.', 'Break it into a small step and add a short break when needed.', 'Praise effort and strategy, not only the score.'],
    phraseAr: '«مش لازم نخلص كله مرة واحدة. نبدأ بأول سؤال سوا؟»',
    phraseEn: '“We don’t have to finish it all at once. Shall we start with the first question together?”',
    avoidAr: 'تجنبوا المقارنة بإخوة أو زملاء أو وصف الطفل بالكسل.',
    avoidEn: 'Avoid comparing the child with siblings or classmates or calling them lazy.',
    seekAr: 'لو الصعوبة مستمرة رغم الدعم، تحدثوا مع المدرسة أو مختص تعلم لفهم الاحتياج بدل افتراض السبب.',
    seekEn: 'If difficulty persists despite support, speak with the school or a learning specialist to understand the need rather than guessing the cause.',
  },
] as const;

export interface ParentingSupportCenterProps {
  kids: ChildProfile[];
  language: LanguageCode;
  onSaveChildMood: (kidId: number, mood: (typeof CHILD_MOODS)[number]) => Promise<boolean>;
  onAddRoutineTask?: (taskName: string, time: string, kidId: number | null) => void;
  initialKidId?: number | null;
  onActiveKidChange?: (kidId: number) => void;
  hideChildSelector?: boolean;
  activeParentRole?: ParentSupportRole;
  motherName?: string;
  fatherName?: string;
  recentRecordsByKid?: Record<number, RecommendationProfile['recentRecords']>;
}

export const ParentingSupportCenter: React.FC<ParentingSupportCenterProps> = ({
  kids,
  language,
  onSaveChildMood,
  onAddRoutineTask,
  initialKidId,
  onActiveKidChange,
  hideChildSelector = false,
  activeParentRole = 'mother',
  motherName,
  fatherName,
  recentRecordsByKid,
}) => {
  const isEn = language === 'en';
  const [activeKidId, setActiveKidId] = useState<number | null>(initialKidId ?? kids[0]?.id ?? null);

  useEffect(() => {
    if (initialKidId != null && kids.some((kid) => kid.id === initialKidId)) {
      setActiveKidId(initialKidId);
    } else if (!kids.some((kid) => kid.id === activeKidId)) {
      setActiveKidId(kids[0]?.id ?? null);
    }
  }, [initialKidId, kids, activeKidId]);

  const [selectedParentRole, setSelectedParentRole] = useState<ParentSupportRole>(activeParentRole);
  useEffect(() => {
    setSelectedParentRole(activeParentRole);
  }, [activeParentRole]);

  const [selectedParentCardIdx, setSelectedParentCardIdx] = useState<number>(0);
  const [selectedMoodByKid, setSelectedMoodByKid] = useState<Record<number, ChildMoodId>>({});
  const [savedMoodByKid, setSavedMoodByKid] = useState<Record<number, ChildMoodId>>({});
  const [savingMood, setSavingMood] = useState(false);
  const [moodSaveError, setMoodSaveError] = useState<string | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<(typeof PARENTING_SCENARIOS)[number]['id']>('big-feelings');
  const [householdEnergy, setHouseholdEnergy] = useState<HouseholdEnergy>('steady');
  const [householdCoordination, setHouseholdCoordination] = useState<HouseholdCoordination>('shared');
  const [selectedPositiveFocus, setSelectedPositiveFocus] = useState<PositiveParentingFocusId>('confidence');
  const [selectedBondingMode, setSelectedBondingMode] = useState<FamilyBondingModeId>('dialogue');
  const [parentNeed, setParentNeed] = useState<'rest' | 'listening' | 'shared_load' | 'reassurance'>('rest');
  const [parentResetStep, setParentResetStep] = useState(0);
  const [childSupportStep, setChildSupportStep] = useState(0);
  const parentNeedContent = {
    rest: { ar: 'محتاج/ة أهدى وأستعيد طاقتي', en: 'I need a pause and some energy back', promptAr: 'خدوا دقيقة بعيد عن الضوضاء لو ده آمن، اشربوا مياه، واختاروا مهمة واحدة ممكن تستنى.', promptEn: 'Take a quiet minute if it is safe, drink some water, and choose one task that can wait.', taskAr: 'استراحة قصيرة للأب أو الأم بدون مهام', taskEn: 'A short no-task break for a parent' },
    listening: { ar: 'محتاج/ة حد يسمعني من غير حلول', en: 'I need someone to listen without fixing', promptAr: 'قولوا لشخص موثوق: محتاج/ة عشر دقايق تحكيلي فيها من غير نصايح، وبعدها نشوف محتاجين إيه.', promptEn: 'Tell someone you trust: I need ten minutes to be heard without advice; then we can decide what helps.', taskAr: 'وقت استماع متبادل بين الوالدين', taskEn: 'A listening check-in between parents' },
    shared_load: { ar: 'محتاج/ة الحمل يتقسم بشكل أوضح', en: 'I need the load shared more clearly', promptAr: 'حوّلوا الطلب لمهمة محددة بموعد واضح: مين هيعمل إيه وإمتى؟ وابدأوا بالأكثر إلحاحًا فقط.', promptEn: 'Turn the request into one specific task and time: who will do what, and when? Start with only what is urgent.', taskAr: 'مراجعة توزيع مهمة واحدة بين الوالدين', taskEn: 'Review and share one household task' },
    reassurance: { ar: 'محتاج/ة أفتكر إن مش لازم أكون مثالي', en: 'I need reassurance that I do not have to be perfect', promptAr: 'اختاروا معيار نجاح صغير لليوم: أمان الطفل، احتياج أساسي، ولحظة تواصل. الباقي ممكن يستنى.', promptEn: 'Choose a small definition of success today: child safety, one basic need, and one moment of connection. The rest can wait.', taskAr: 'تحديد أولوية واقعية واحدة لليوم', taskEn: 'Choose one realistic priority for today' },
  }[parentNeed];


  const activeKid = useMemo(
    () => kids.find((kid) => kid.id === activeKidId) || kids[0] || null,
    [kids, activeKidId]
  );
  const activeKidRecords = activeKid ? recentRecordsByKid?.[activeKid.id] ?? [] : [];
  const activeMood = activeKid ? CHILD_MOODS.find((mood) => mood.id === selectedMoodByKid[activeKid.id]) : null;
  const savedMood = activeKid ? CHILD_MOODS.find((mood) => mood.id === savedMoodByKid[activeKid.id]) : null;
  const scenario = PARENTING_SCENARIOS.find((item) => item.id === selectedScenario) || PARENTING_SCENARIOS[0];
  const ageLabel = activeKid ? calculateChildAge(activeKid.birth, language).label : '';

  const parentSupportCards = useMemo(
    () =>
      buildParentEmotionalSupportCards({
        role: selectedParentRole,
        motherName,
        fatherName,
        kidsCount: kids.length,
        selectedChildNameAr: activeKid ? locText(activeKid.name, 'ar') : undefined,
        selectedChildNameEn: activeKid ? locText(activeKid.name, 'en') : undefined,
      }),
    [selectedParentRole, motherName, fatherName, kids.length, activeKid]
  );

  const activeParentCard = parentSupportCards[selectedParentCardIdx % parentSupportCards.length] || parentSupportCards[0];

  const childStageGuidance = useMemo(
    () =>
      buildChildStageEmotionalGuidance({
        child: activeKid,
        selectedMoodId: activeMood?.id ?? null,
        recentRecords: activeKidRecords,
      }),
    [activeKid, activeMood?.id, activeKidRecords]
  );

  const childRegulationPlan = childStageGuidance.stageCode === '0-2'
    ? (isEn ? [
        'Check comfort first: feeding, diaper, temperature, tiredness and signs of discomfort.',
        'Lower noise and light; stay close and use a calm, familiar voice. Never shake or leave an infant unattended.',
        'When settled, follow the child’s cues with a short, gentle interaction. Stop if they turn away or become distressed.',
      ] : [
        'راجعوا الراحة أولًا: الرضاعة، الحفاض، الحرارة، الإرهاق وأي علامة انزعاج.',
        'قللوا الصوت والإضاءة، وابقوا قريبين بصوت مألوف وهادئ. ممنوع هز الرضيع أو تركه دون متابعة.',
        'بعد الهدوء، اتبعوا إشارات الطفل في تفاعل بسيط، وتوقفوا لو أدار وجهه أو زاد انزعاجه.',
      ])
    : childStageGuidance.stageCode === '2-5'
    ? (isEn ? [
        'Get close at the child’s level and name the feeling in a few simple words.',
        'Offer two safe choices, such as sitting together or having some quiet space nearby.',
        'Talk about what happened only after the child is calmer; do not demand an explanation or apology at the peak.',
      ] : [
        'قربوا لمستوى نظر الطفل وسمّوا الشعور بكلمات قليلة وبسيطة.',
        'اعرضوا اختيارين آمنين، زي نقعد سوا أو ياخد مساحة هادية وأنتم قريبين.',
        'اتكلموا عن اللي حصل بعد ما يهدأ؛ ما تطلبوش تفسير أو اعتذار وقت ذروة الانفعال.',
      ])
    : (isEn ? [
        'Validate the feeling without agreeing to unsafe behavior: “It makes sense that you’re upset.”',
        'Listen first. Ask whether they want help, a short break, or to think aloud together.',
        'When ready, agree on one repair or next step and revisit it later if needed.',
      ] : [
        'اعترفوا بالشعور من غير قبول السلوك المؤذي: «فاهم إنك متضايق، ومن حقك تحس كده».',
        'اسمعوا الأول، واسألوا: تحب مساعدة، استراحة قصيرة، ولا نفكر سوا بصوت عالي؟',
        'لما يكون مستعد، اتفقوا على إصلاح أو خطوة واحدة، وممكن ترجعوا للموضوع لاحقًا.',
      ]);
  const positiveAdviceList = useMemo(
    () =>
      buildPositiveParentingAdviceList({
        child: activeKid,
        recentRecords: activeKidRecords,
      }),
    [activeKid, activeKidRecords]
  );
  const activePositiveAdvice =
    positiveAdviceList.find((item) => item.id === selectedPositiveFocus) || positiveAdviceList[0];

  const scenarioPersonalization = useMemo(
    () =>
      buildScenarioPersonalizedAddOn({
        scenarioId: selectedScenario,
        child: activeKid,
        kidsCount: kids.length,
        recentRecords: activeKidRecords,
      }),
    [selectedScenario, activeKid, kids.length, activeKidRecords]
  );

  const familyBondingRituals = useMemo(
    () =>
      buildFamilyBondingRituals({
        child: activeKid,
        kidsCount: kids.length,
        recentRecords: activeKidRecords,
      }),
    [activeKid, kids.length, activeKidRecords]
  );
  const activeBondingRitual =
    familyBondingRituals.find((item) => item.id === selectedBondingMode) || familyBondingRituals[0];

  const householdGuidance = householdEnergy === 'overloaded'
    ? (isEn
      ? 'Choose one non-urgent responsibility to postpone, and ask a trusted person to take one specific task. You do not need to carry everything today.'
      : 'اختاروا مسؤولية واحدة غير عاجلة لتأجيلها، واطلبوا من شخص موثوق تولّي مهمة محددة. مش مطلوب منكم تشيلوا كل حاجة النهارده.')
    : householdEnergy === 'tired'
    ? (isEn
      ? 'Make room for a short recovery break and lower today’s expectations to what truly matters.'
      : 'خصصوا مساحة لاستراحة قصيرة، وقللوا توقعات اليوم للحاجات الضرورية فعلًا.')
    : (isEn
      ? 'Keep the day realistic: one shared priority and one small moment of connection are enough.'
      : 'خلّوا اليوم واقعي: أولوية واحدة مشتركة ولحظة تواصل بسيطة كفاية.');

  const coordinationGuidance = householdCoordination === 'uneven'
    ? (isEn
      ? 'Name the tasks that feel uneven and agree who owns one or two of them, including when they will be done.'
      : 'سمّوا المهام اللي توزيعها مش متوازن، واتفقوا مين مسؤول عن مهمة أو اتنين وامتى هتتعمل.')
    : householdCoordination === 'not_discussed'
    ? (isEn
      ? 'Set aside ten calm minutes to review the week, listen to each other and agree on the next practical step.'
      : 'خصصوا عشر دقايق هادية لمراجعة الأسبوع، وسماع بعض، والاتفاق على خطوة عملية واحدة.')
    : (isEn
      ? 'Notice what is working and keep checking in before pressure builds.'
      : 'لاحظوا الحاجات اللي ماشية كويس، واستمروا في السؤال عن احتياجات بعض قبل ما الضغط يتراكم.');

  const handleSaveMood = async () => {
    if (!activeKid || !activeMood || savingMood) return;
    setSavingMood(true);
    setMoodSaveError(null);
    try {
      const saved = await onSaveChildMood(activeKid.id, activeMood);
      if (saved) {
        setSavedMoodByKid((previous) => ({ ...previous, [activeKid.id]: activeMood.id }));
      } else {
        setMoodSaveError(isEn
          ? 'This check-in was not saved. Please make sure the child profile is saved to the family account, then try again.'
          : 'لم يتم حفظ المتابعة. تأكدوا من حفظ ملف الطفل في حساب الأسرة ثم حاولوا مرة أخرى.');
      }
    } catch {
      setMoodSaveError(isEn
        ? 'A connection issue prevented saving. Your check-in is still available here; please try again.'
        : 'حصلت مشكلة في الاتصال ومنقدرناش نحفظ المتابعة. الحالة لم تُحفظ، جرّبوا مرة تانية.');
    } finally {
      setSavingMood(false);
    }
  };

  return (
    <div className="space-y-4" dir={isEn ? 'ltr' : 'rtl'} data-testid="parenting-support-center">
      {/* =====================================================================
          1. EMOTIONAL SUPPORT FOR PARENTS (MOTHERS & FATHERS) + HOUSEHOLD CHECK-IN
          ===================================================================== */}
      <section
        className="rounded-3xl border border-rose-300/35 bg-gradient-to-br from-rose-50/80 via-white to-teal-50/60 p-4 shadow-[0_8px_24px_-18px_rgba(15,23,42,0.32)] space-y-4 dark:border-rose-900/40 dark:from-[#241B26] dark:via-[#101D26] dark:to-[#142430]"
        data-testid="household-wellbeing-checkin"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-rose-500/12 text-2xl">🏡</span>
            <div className="min-w-0">
              <h3 className="text-sm font-black text-[var(--color-text)] dark:text-white">
                {isEn ? 'The whole household · Parents first' : 'البيت كله · الأب والأم أولًا'}
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-[var(--color-muted)] dark:text-[#CBD5E1]">
                {isEn
                  ? 'Emotional support for mothers and fathers, plus shared responsibility check-ins — separate from each child’s record.'
                  : 'مساندة نفسية للأم والأب، ومتابعة لطاقة البيت وتوزيع المسؤوليات — وده منفصل تمامًا عن سجل كل طفل.'}
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-2xl border border-rose-500/20 bg-white/80 p-1 dark:border-[#1E3646] dark:bg-[#0B131A]/70">
            <button
              type="button"
              data-testid="parent-support-role-mother"
              aria-pressed={selectedParentRole === 'mother'}
              onClick={() => {
                setSelectedParentRole('mother');
                setSelectedParentCardIdx(0);
              }}
              className={`min-h-[38px] rounded-xl px-3 py-1.5 text-xs font-extrabold transition-all cursor-pointer ${
                selectedParentRole === 'mother'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-[var(--color-text)] dark:text-[#CBD5E1]'
              }`}
            >
              {isEn ? '👩🏻‍🍼 For Mom' : '👩🏻‍🍼 دعم الأم'}
            </button>
            <button
              type="button"
              data-testid="parent-support-role-father"
              aria-pressed={selectedParentRole === 'father'}
              onClick={() => {
                setSelectedParentRole('father');
                setSelectedParentCardIdx(0);
              }}
              className={`min-h-[38px] rounded-xl px-3 py-1.5 text-xs font-extrabold transition-all cursor-pointer ${
                selectedParentRole === 'father'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'text-[var(--color-text)] dark:text-[#CBD5E1]'
              }`}
            >
              {isEn ? '👨🏻‍🍼 For Dad' : '👨🏻‍🍼 دعم الأب'}
            </button>
          </div>
        </div>

        <div
          data-testid="parent-role-emotional-support"
          className="rounded-2xl border border-rose-500/20 bg-white/85 p-3.5 shadow-sm space-y-2.5 dark:border-[#29404D] dark:bg-[#0B131A]/75"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="rounded-full bg-rose-500/12 px-2.5 py-1 text-[11px] font-black text-rose-800 dark:text-rose-200">
              {isEn ? activeParentCard.badgeEn : activeParentCard.badgeAr}
            </span>
            <div className="flex items-center gap-1.5">
              {parentSupportCards.map((card, idx) => (
                <button
                  key={card.id}
                  type="button"
                  data-testid={`parent-support-card-tab-${idx}`}
                  onClick={() => setSelectedParentCardIdx(idx)}
                  className={`min-h-[32px] rounded-lg px-2.5 py-1 text-[11px] font-extrabold border transition-all cursor-pointer ${
                    idx === selectedParentCardIdx
                      ? 'border-rose-500 bg-rose-500/15 text-rose-900 dark:text-rose-100'
                      : 'border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-surface)] text-[var(--color-muted)]'
                  }`}
                >
                  {isEn ? `Message ${idx + 1}` : `رسالة ${idx + 1}`}
                </button>
              ))}
            </div>
          </div>

          <h4 className="text-xs sm:text-sm font-black text-[var(--color-text)] dark:text-white leading-snug">
            {isEn ? activeParentCard.titleEn : activeParentCard.titleAr}
          </h4>
          <p className="text-xs leading-relaxed text-[var(--color-muted)] dark:text-[#CBD5E1]">
            {isEn ? activeParentCard.bodyEn : activeParentCard.bodyAr}
          </p>
          <div className="rounded-xl bg-rose-50/80 dark:bg-[#142430] px-3 py-2 text-xs font-bold text-[var(--color-text)] dark:text-[#E2E8F0]">
            💡 {isEn ? activeParentCard.practicalStepEn : activeParentCard.practicalStepAr}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <button
              type="button"
              onClick={() =>
                onAddRoutineTask?.(
                  isEn ? activeParentCard.routineTaskEn : activeParentCard.routineTaskAr,
                  activeParentCard.routineTime,
                  null
                )
              }
              className="min-h-[44px] rounded-xl bg-rose-700 px-3.5 py-2 text-xs font-extrabold text-white hover:bg-rose-800 transition-colors cursor-pointer"
            >
              + {isEn ? 'Schedule parent recharge in routine' : 'أضف وقت راحة الوالدين للروتين'}
            </button>
          </div>
        </div>

        <section data-testid="parent-reset-practice" className="rounded-2xl border border-orange-300/50 bg-gradient-to-br from-orange-50/90 via-white to-rose-50/60 p-3.5 space-y-3 dark:border-orange-900/50 dark:from-[#2A211D] dark:via-[#142430] dark:to-[#241B26]">
          <div className="flex items-start justify-between gap-2">
            <div><p className="text-[10px] font-black tracking-wide text-orange-800 dark:text-orange-200">{isEn ? 'A MOMENT FOR YOU' : 'دقيقة ليك كأب أو أم'}</p><h4 className="mt-1 text-xs font-black text-[var(--color-text)] dark:text-white">{isEn ? 'What would help me right now?' : 'إيه اللي ممكن يساعدني دلوقتي؟'}</h4><p className="mt-1 text-[10px] leading-relaxed text-[var(--color-muted)]">{isEn ? 'Choose honestly. This is a private reflection on this screen, not a diagnosis or a saved record.' : 'اختاروا بصدق ومن غير لوم. دي مساحة تفكير على الشاشة فقط، مش تشخيص ولا سجل محفوظ.'}</p></div>
            <span className="text-2xl">🧡</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {([
              ['rest','☕',isEn ? 'A pause' : 'راحة وهدوء'],
              ['listening','👂',isEn ? 'To be heard' : 'حد يسمعني'],
              ['shared_load','🤝',isEn ? 'Shared load' : 'تقسيم الحمل'],
              ['reassurance','🌱',isEn ? 'Reassurance' : 'طمأنة'],
            ] as const).map(([id,emoji,label]) => <button key={id} type="button" aria-pressed={parentNeed === id} onClick={() => {setParentNeed(id);setParentResetStep(0);}} className={`min-h-11 rounded-xl border px-2 py-2 text-[10px] font-extrabold transition ${parentNeed === id ? 'border-orange-500 bg-orange-100 text-orange-950 dark:bg-orange-900/40 dark:text-orange-100' : 'border-[var(--color-border)] bg-white/80 text-[var(--color-text)] dark:border-[#29404D] dark:bg-[#0B131A]/70'}`}>{emoji} {label}</button>)}
          </div>
          <div className="rounded-xl bg-white/85 p-3 dark:bg-[#0B131A]/70">
            <p className="text-xs font-bold leading-relaxed text-[var(--color-text)] dark:text-[#E2E8F0]">{isEn ? parentNeedContent.promptEn : parentNeedContent.promptAr}</p>
            <div className="mt-3 flex items-center justify-between gap-2"><p className="text-[10px] font-black text-orange-800 dark:text-orange-200">{isEn ? 'A 3-step reset' : 'وقفة من ٣ خطوات'}</p><span className="text-[9px] text-[var(--color-muted)]">{parentResetStep + 1}/3</span></div>
            <div className="mt-2 grid grid-cols-3 gap-1.5">
              {(isEn ? ['Pause safely','Name the need','Choose one step'] : ['قف بأمان','سمّي احتياجك','اختار خطوة']).map((label,index) => <button key={label} type="button" aria-pressed={parentResetStep === index} onClick={() => setParentResetStep(index)} className={`min-h-10 rounded-lg px-1.5 py-2 text-[9px] font-extrabold ${parentResetStep === index ? 'bg-orange-600 text-white' : parentResetStep > index ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100' : 'bg-orange-50 text-orange-900 dark:bg-orange-950/30 dark:text-orange-100'}`}>{index+1}. {label}</button>)}
            </div>
            <p className="mt-2 text-[10px] leading-relaxed text-[var(--color-muted)]">{parentResetStep === 0 ? (isEn ? 'If the child is with you, first make sure they are in a safe place with a trusted adult before stepping away.' : 'لو الطفل معاكم، اتأكدوا الأول إنه في مكان آمن ومع شخص كبير موثوق قبل ما تبعدوا.') : parentResetStep === 1 ? (isEn ? 'Name the need without judging yourself: rest, listening, help or reassurance.' : 'سمّوا الاحتياج من غير حكم على نفسكم: راحة، استماع، مساعدة أو طمأنة.') : (isEn ? 'Ask for one specific, realistic action. Small support is still support.' : 'اطلبوا مساعدة واحدة محددة وواقعية. المساندة الصغيرة برضه مساندة.')}</p>
            <div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={() => setParentResetStep((step) => (step + 1) % 3)} className="min-h-10 rounded-xl bg-orange-700 px-3 py-2 text-[10px] font-extrabold text-white">{isEn ? 'Next step' : 'الخطوة التالية'}</button><button type="button" onClick={() => onAddRoutineTask?.(isEn ? parentNeedContent.taskEn : parentNeedContent.taskAr,'08:00 م',null)} className="min-h-10 rounded-xl border border-orange-500/30 bg-orange-500/10 px-3 py-2 text-[10px] font-extrabold text-orange-900 dark:text-orange-100">+ {isEn ? 'Add to family routine' : 'أضف للروتين الأسري'}</button></div>
          </div>
        </section>

        <div
          data-testid="household-balance-visual"
          className="rounded-2xl border border-rose-500/15 bg-gradient-to-br from-white via-rose-50/50 to-teal-50/60 p-3.5 dark:from-[#18232D] dark:via-[#241B26] dark:to-[#122A2B]"
        >
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs font-black text-[var(--color-text)] dark:text-white">{isEn ? 'A small map for a calmer home' : 'خريطة صغيرة لبيت أهدى'}</p>
              <p className="mt-1 text-[10px] leading-relaxed text-[var(--color-muted)] dark:text-[#CBD5E1]">{isEn ? 'Notice the load, talk together, then choose one realistic step.' : 'لاحظوا الحمل، اتكلموا سوا، وبعدها اختاروا خطوة واقعية واحدة.'}</p>
            </div>
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-rose-500/10 text-xl">⚖️</span>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-1.5">
            {[
              { n: '١', icon: '🌡️', ar: householdEnergy === 'steady' ? 'الطاقة مستقرة' : householdEnergy === 'tired' ? 'محتاجين راحة' : 'الضغط كبير', en: householdEnergy === 'steady' ? 'Energy is steady' : householdEnergy === 'tired' ? 'Rest is needed' : 'Pressure is high' },
              { n: '٢', icon: '🤝', ar: householdCoordination === 'shared' ? 'المسؤوليات مشتركة' : householdCoordination === 'uneven' ? 'الحمل محتاج يتوزع' : 'محتاجين نتفق', en: householdCoordination === 'shared' ? 'Shared responsibilities' : householdCoordination === 'uneven' ? 'Rebalance the load' : 'Agree together' },
              { n: '٣', icon: '🌱', ar: 'خطوة واحدة صغيرة', en: 'One small next step' },
            ].map((step, index) => (
              <React.Fragment key={step.n}>
                <div className="min-w-0 rounded-xl border border-white/80 bg-white/80 px-1.5 py-2 text-center shadow-sm dark:border-white/10 dark:bg-white/5">
                  <span className="mx-auto grid h-7 w-7 place-items-center rounded-full bg-rose-500/10 text-sm">{step.icon}</span>
                  <p className="mt-1 text-[9px] font-black leading-relaxed text-[var(--color-text)] dark:text-white">{isEn ? step.en : step.ar}</p>
                </div>
              </React.Fragment>
            ))}
          </div>
          <p className="mt-2 text-[9px] text-[var(--color-muted)] dark:text-[#94A3B8]">{isEn ? 'A private reflection on this screen only — not saved or sent.' : 'مساحة تفكير خاصة على الشاشة دي فقط — الاختيارات مش محفوظة ولا مُرسلة.'}</p>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-extrabold text-[var(--color-text)] dark:text-white">{isEn ? 'How is the household energy today?' : 'طاقة البيت والأب والأم عاملة إيه النهارده؟'}</p>
          <div className="grid grid-cols-3 gap-2">
            {([
              ['steady', '🙂', 'مستقرين', 'Steady'],
              ['tired', '😮‍💨', 'محتاجين راحة', 'Need a break'],
              ['overloaded', '🫶', 'الضغط كبير', 'Overloaded'],
            ] as const).map(([id, emoji, ar, en]) => (
              <button key={id} type="button" aria-pressed={householdEnergy === id} onClick={() => setHouseholdEnergy(id)} className={`min-h-[68px] rounded-2xl border px-2 py-2 text-center text-[11px] font-extrabold shadow-[0_3px_12px_-10px_rgba(15,23,42,0.3)] transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 active:scale-[.98] ${householdEnergy === id ? 'border-rose-500 bg-rose-500/12 text-rose-800 dark:text-rose-200' : 'border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-surface)] text-[var(--color-text)]'}`}>
                <span className="block text-xl">{emoji}</span><span>{isEn ? en : ar}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-xs font-extrabold text-[var(--color-text)] dark:text-white">{isEn ? 'How are responsibilities shared?' : 'توزيع مسؤوليات البيت بينكم عامل إيه؟'}</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {([
              ['shared', 'متقاسمينها بشكل مناسب', 'Fairly shared'],
              ['uneven', 'فيه حمل على طرف أكتر', 'Uneven load'],
              ['not_discussed', 'محتاجين نتكلم ونتفق', 'Need to discuss'],
            ] as const).map(([id, ar, en]) => (
              <button key={id} type="button" aria-pressed={householdCoordination === id} onClick={() => setHouseholdCoordination(id)} className={`min-h-[46px] rounded-2xl border px-3 py-2.5 text-xs font-bold shadow-[0_3px_12px_-10px_rgba(15,23,42,0.3)] transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 active:scale-[.98] ${householdCoordination === id ? 'border-teal-500 bg-teal-500/10 text-teal-800 dark:text-teal-200' : 'border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-surface)] text-[var(--color-text)]'}`}>{isEn ? en : ar}</button>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200/75 bg-white/75 p-3.5 shadow-sm space-y-2.5 dark:border-[#29404D] dark:bg-[#0B131A]/65">
          <p className="text-xs font-bold leading-relaxed text-[var(--color-text)] dark:text-[#E2E8F0]">{householdGuidance}</p>
          <p className="text-xs font-bold leading-relaxed text-[var(--color-text)] dark:text-[#E2E8F0]">{coordinationGuidance}</p>
          <button type="button" onClick={() => onAddRoutineTask?.(isEn ? '10-minute parent check-in and task sharing' : 'جلسة تنسيق وراحة للأب والأم لمدة ١٠ دقائق', '08:30 م', null)} className="min-h-[44px] rounded-xl bg-teal-700 px-3 py-2 text-xs font-extrabold text-white hover:bg-teal-800">
            + {isEn ? 'Add a family check-in to the routine' : 'أضف جلسة تنسيق للأسرة للروتين'}
          </button>
        </div>
        <p className="text-[10px] leading-relaxed text-[var(--color-muted)] dark:text-[#94A3B8]">{isEn ? 'This is a supportive reflection, not a mental-health assessment or diagnosis. Household answers stay in this screen and are not saved.' : 'دي مساحة مساندة للتفكير، مش تقييم أو تشخيص نفسي. اختيارات البيت هنا لا تُحفظ ولا تُرسل.'}</p>
      </section>

      {/* =====================================================================
          2. CHILDREN'S EMOTIONAL WELLBEING BY AGE & DEVELOPMENTAL STAGE
          ===================================================================== */}
      <section
        className="rounded-3xl border border-sky-300/35 bg-gradient-to-br from-sky-50/75 via-white to-cyan-50/40 p-4 shadow-[0_8px_24px_-18px_rgba(15,23,42,0.32)] space-y-4 dark:border-sky-900/40 dark:from-[#172D3A] dark:via-[#101F2B] dark:to-[#101D26]"
        data-testid="child-emotional-checkin"
      >
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-sky-500/12 text-2xl">🧒</span>
          <div className="min-w-0">
            <h3 className="text-sm font-black text-[var(--color-text)] dark:text-white">{isEn ? 'Each child · Their own feelings' : 'مشاعر كل طفل لوحده'}</h3>
            <p className="mt-1 text-xs leading-relaxed text-[var(--color-muted)] dark:text-[#CBD5E1]">{isEn ? 'Choose one child and record how they seem right now. A feeling is a moment, not a label.' : 'اختاروا طفلكم وشوفوا حاسس بإيه دلوقتي. الإحساس ممكن يتغير، ومش معناه إن دي صفة ثابتة فيه.'}</p>
          </div>
        </div>
        {kids.length > 0 ? (
          <>
            {!hideChildSelector && (
              <div className="flex flex-wrap gap-2">
                {kids.map((kid) => (
                  <button key={kid.id} type="button" aria-pressed={activeKid?.id === kid.id} onClick={() => {
                      setActiveKidId(kid.id);
                      onActiveKidChange?.(kid.id);
                    }} className={`min-h-[44px] rounded-2xl border px-3 py-2 text-xs font-extrabold shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 ${activeKid?.id === kid.id ? 'border-sky-600 bg-sky-600 text-white' : 'border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-surface)] text-[var(--color-text)]'}`}>
                    {kid.emoji} {locText(kid.name, language)}
                  </button>
                ))}
              </div>
            )}
            {activeKid && (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-bold text-[var(--color-muted)] dark:text-[#CBD5E1]">{locText(activeKid.name, language)} · {ageLabel || (isEn ? 'Age not recorded' : 'لسه مسجلتوش عمره')}</p>
                  <span className="text-[10px] font-bold text-[var(--color-muted)]">{isEn ? 'Private child record' : 'بيتسجل في ملف الطفل'}</span>
                </div>

                <div
                  data-testid="child-stage-emotional-guidance"
                  className="rounded-2xl border border-sky-500/20 bg-white/80 p-3.5 shadow-sm space-y-2 dark:border-[#29404D] dark:bg-[#0B131A]/70"
                >
                  <span className="inline-block rounded-full bg-sky-500/12 px-2.5 py-0.5 text-[11px] font-black text-sky-800 dark:text-sky-200">
                    {isEn ? childStageGuidance.stageBadgeEn : childStageGuidance.stageBadgeAr}
                  </span>
                  <p className="text-xs font-bold leading-relaxed text-[var(--color-text)] dark:text-[#E2E8F0]">
                    {isEn ? childStageGuidance.coreNeedEn : childStageGuidance.coreNeedAr}
                  </p>
                  <p className="text-xs leading-relaxed text-[var(--color-muted)] dark:text-[#CBD5E1]">
                    💬 {isEn ? childStageGuidance.communicationTipEn : childStageGuidance.communicationTipAr}
                  </p>
                </div>

                {activeMood && (
                  <div data-testid="child-co-regulation-practice" className="rounded-2xl border border-cyan-500/25 bg-gradient-to-br from-cyan-50/80 via-white to-sky-50/70 p-3 dark:from-[#132B35] dark:via-[#101D26] dark:to-[#172D3A]">
                    <div className="flex items-start justify-between gap-2"><div><p className="text-[10px] font-black text-cyan-900 dark:text-cyan-200">{isEn ? 'CALMING HELP FOR EVERY AGE' : 'إزاي نساعد الطفل يهدأ حسب سنه'}</p><h4 className="mt-1 text-xs font-black text-[var(--color-text)] dark:text-white">{isEn ? 'How can I help my child right now?' : 'أساعد طفلي إزاي دلوقتي؟'}</h4></div><span className="text-xl">🫶</span></div>
                    <div className="mt-3 grid grid-cols-3 gap-1.5">
                      {childRegulationPlan.map((step,index) => <button key={step} type="button" aria-pressed={childSupportStep === index} onClick={() => setChildSupportStep(index)} className={`min-h-[54px] rounded-xl border px-2 py-2 text-start text-[9px] font-extrabold leading-relaxed ${childSupportStep === index ? 'border-cyan-600 bg-cyan-100 text-cyan-950 dark:bg-cyan-900/40 dark:text-cyan-100' : 'border-cyan-200/70 bg-white/80 text-[var(--color-text)] dark:border-cyan-900/60 dark:bg-[#0B131A]/60 dark:text-slate-200'}`}>{index+1}. {isEn ? ['Notice','Connect','Support'][index] : ['لاحظ','اتواصل','اسند'][index]}</button>)}
                    </div>
                    <p className="mt-2 rounded-xl bg-white/85 p-3 text-[11px] font-bold leading-relaxed text-[var(--color-text)] dark:bg-[#0B131A]/70 dark:text-[#E2E8F0]">{childRegulationPlan[childSupportStep]}</p>
                    <button type="button" onClick={() => onAddRoutineTask?.(isEn ? '10-minute calm connection and co-regulation with child' : '١٠ دقائق تواصل وتهدئة مشتركة مع الطفل', '05:30 م', activeKid?.id ?? null)} className="mt-2 min-h-[42px] rounded-xl bg-cyan-800 px-3 py-2 text-[10px] font-extrabold text-white hover:bg-cyan-900">+ {isEn ? 'Add a calm connection moment' : 'ضيفوا وقت هادي مع طفلكم للروتين'}</button>
                    <p className="mt-2 text-[9px] leading-relaxed text-[var(--color-muted)]">{isEn ? 'Follow the child’s cues and safety needs. Never force touch, eye contact, breathing exercises or talking.' : 'خدوا بالكم من إشارات طفلكم وراحته. ما تجبروهوش على الحضن أو النظر في العين أو التنفس بطريقة معينة أو الكلام.'}</p>
                  </div>
                )}
                {activeMood && (
                  <div data-testid="child-emotion-path" className="rounded-2xl border border-sky-500/20 bg-gradient-to-r from-sky-50/90 via-white to-cyan-50/80 p-3 dark:from-[#172D3A] dark:via-[#101D26] dark:to-[#102B36]">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-black text-sky-950 dark:text-sky-100">{isEn ? 'From feeling to connection' : 'نفهم إحساسه ونقرب منه'}</p>
                      <span className="rounded-full bg-sky-600/10 px-2 py-1 text-[10px] font-black text-sky-800 dark:text-sky-200">{activeMood.emoji} {isEn ? activeMood.labelEn : activeMood.labelAr}</span>
                    </div>
                    <div className="mt-3 grid grid-cols-4 gap-1.5">
                      {(isEn ? ['Notice', 'Name', 'Listen', 'Support'] : ['لاحظ', 'سمّي', 'اسمع', 'اسند']).map((label, index) => (
                        <div key={label} className="min-w-0 text-center">
                          <span className="mx-auto grid h-8 w-8 place-items-center rounded-full border border-sky-500/20 bg-white text-xs font-black text-sky-800 shadow-sm dark:bg-[#0B131A] dark:text-sky-200">{index + 1}</span>
                          <p className="mt-1 text-[9px] font-extrabold text-sky-950 dark:text-sky-100">{label}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-sky-900/10 dark:bg-white/10"><div className="h-full w-full rounded-full bg-gradient-to-r from-sky-400 to-teal-400" /></div>
                  </div>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {CHILD_MOODS.map((mood) => (
                    <button key={mood.id} type="button" aria-pressed={selectedMoodByKid[activeKid.id] === mood.id} onClick={() => {
                        setSelectedMoodByKid((previous) => ({ ...previous, [activeKid.id]: mood.id }));
                        setMoodSaveError(null);
                      }} className={`min-h-[68px] rounded-2xl border px-2 py-2.5 text-center shadow-[0_3px_12px_-10px_rgba(15,23,42,0.3)] transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 active:scale-[.98] ${selectedMoodByKid[activeKid.id] === mood.id ? 'border-sky-600 bg-sky-500/15 text-sky-900 dark:text-sky-100' : 'border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-surface)] text-[var(--color-text)]'}`}>
                      <span className="block text-xl">{mood.emoji}</span><span className="text-[11px] font-extrabold">{isEn ? mood.labelEn : mood.labelAr}</span>
                    </button>
                  ))}
                </div>
                {activeMood && (
                  <div className="rounded-2xl border border-sky-500/20 bg-white/80 p-3.5 shadow-sm space-y-2.5 dark:bg-[#0B131A]/70">
                    <p className="text-xs font-bold leading-relaxed text-[var(--color-text)] dark:text-[#E2E8F0]">{isEn ? activeMood.responseEn : activeMood.responseAr}</p>
                    <p className="text-xs leading-relaxed text-sky-900 dark:text-sky-200">
                      🌱 {isEn ? childStageGuidance.moodFollowUpEn : childStageGuidance.moodFollowUpAr}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <button type="button" disabled={savingMood} onClick={() => void handleSaveMood()} className="min-h-[44px] rounded-xl bg-sky-700 px-4 py-2 text-xs font-extrabold text-white disabled:opacity-50">
                        {savingMood ? (isEn ? 'Saving…' : 'جاري الحفظ…') : (isEn ? 'Save to this child’s record' : 'احفظوا في ملف الطفل')}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onAddRoutineTask?.(
                            isEn ? childStageGuidance.suggestedRoutineTaskEn : childStageGuidance.suggestedRoutineTaskAr,
                            '05:30 م',
                            activeKid.id
                          )
                        }
                        className="min-h-[44px] rounded-xl border border-sky-500/30 bg-sky-500/10 px-3.5 py-2 text-xs font-extrabold text-sky-800 dark:text-sky-200"
                      >
                        + {isEn ? 'Add connection step to routine' : 'ضيفوا وقت هادي مع طفلكم للروتين'}
                      </button>
                    </div>
                    {savedMood?.id === activeMood.id && <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">✓ {isEn ? 'Saved to the child record.' : 'اتحفظت مشاعره في ملفه.'}</p>}
                    {moodSaveError && <p role="alert" className="text-[11px] font-bold leading-relaxed text-rose-700 dark:text-rose-300">{moodSaveError}</p>}
                  </div>
                )}
              </>
            )}
          </>
        ) : (
          <p className="rounded-xl bg-white/70 dark:bg-[#0B131A]/60 p-3 text-xs font-bold text-[var(--color-muted)]">{isEn ? 'Add a child profile to start an individual emotional check-in.' : 'أضيفوا ملف طفل لبدء تسجيل مشاعره بشكل مستقل.'}</p>
        )}
        <p className="text-[10px] leading-relaxed text-[var(--color-muted)] dark:text-[#94A3B8]">{isEn ? 'A feelings log is not a diagnosis. If distress lasts, feels severe, or affects safety and daily life, seek help from a qualified professional.' : 'تسجيل المشاعر مش تشخيص. لو طفلك متضايق لفترة طويلة، أو الضيق مأثر على حياته أو أمانه، اطلبوا مساعدة من مختص.'}</p>
      </section>

      {/* =====================================================================
          3. POSITIVE PARENTING GUIDANCE & PRACTICAL DAILY ADVICE
          ===================================================================== */}
      <section
        className="rounded-3xl border border-teal-300/35 bg-gradient-to-br from-teal-50/75 via-white to-emerald-50/40 p-4 shadow-[0_8px_24px_-18px_rgba(15,23,42,0.32)] space-y-4 dark:border-teal-900/40 dark:from-[#122A2B] dark:via-[#101D26] dark:to-[#142430]"
        data-testid="positive-parenting-daily-guidance"
      >
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-teal-500/12 text-2xl">🌱</span>
          <div className="min-w-0">
            <h3 className="text-sm font-black text-[var(--color-text)] dark:text-white">
              {isEn ? 'Everyday parenting help' : 'أفكار تساعدكم في مواقف التربية كل يوم'}
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-[var(--color-muted)] dark:text-[#CBD5E1]">
              {isEn
                ? 'Four distinct, non-repetitive pillars tailored to your child’s stage and interests.'
                : '٤ طرق بسيطة تساعدكم تفهموا طفلكم وتتعاملوا معاه بهدوء، حسب سنه والحاجات اللي بيحبها.'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {positiveAdviceList.map((item) => (
            <button
              key={item.id}
              type="button"
              data-testid={`positive-parenting-focus-${item.id}`}
              aria-pressed={selectedPositiveFocus === item.id}
              onClick={() => setSelectedPositiveFocus(item.id)}
              className={`min-h-[60px] rounded-2xl border px-3 py-2 text-start text-xs font-extrabold shadow-xs transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 cursor-pointer ${
                selectedPositiveFocus === item.id
                  ? 'border-teal-600 bg-teal-500/15 text-teal-900 dark:text-teal-100'
                  : 'border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-surface)] text-[var(--color-text)]'
              }`}
            >
              <span className="block text-base">{item.emoji}</span>
              <span>{isEn ? item.labelEn : item.labelAr}</span>
            </button>
          ))}
        </div>

        <div className="rounded-2xl border border-teal-500/20 bg-white/85 p-3.5 shadow-sm space-y-3 dark:border-[#29404D] dark:bg-[#0B131A]/70">
          <h4 className="text-sm font-black text-[var(--color-text)] dark:text-white">
            {isEn ? activePositiveAdvice.headlineEn : activePositiveAdvice.headlineAr}
          </h4>
          <p className="text-xs leading-relaxed text-[var(--color-muted)] dark:text-[#CBD5E1]">
            {isEn ? activePositiveAdvice.adviceEn : activePositiveAdvice.adviceAr}
          </p>
          <div className="rounded-xl bg-teal-500/10 p-3">
            <p className="text-[10px] font-black text-teal-800 dark:text-teal-200">
              {isEn ? 'Suggested phrase' : 'ممكن تقولوا له'}
            </p>
            <p className="mt-1 text-xs font-bold leading-relaxed text-[var(--color-text)] dark:text-[#F8FAFC]">
              {isEn ? activePositiveAdvice.sayThisEn : activePositiveAdvice.sayThisAr}
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              onAddRoutineTask?.(
                isEn ? activePositiveAdvice.routineTaskEn : activePositiveAdvice.routineTaskAr,
                activePositiveAdvice.routineTime,
                activeKid?.id ?? null
              )
            }
            className="min-h-[44px] rounded-xl bg-teal-700 px-3.5 py-2 text-xs font-extrabold text-white hover:bg-teal-800 transition-colors cursor-pointer"
          >
            + {isEn ? 'Add practice to daily routine' : 'أضف هذا التطبيق لروتين اليوم'}
          </button>
        </div>
      </section>

      {/* =====================================================================
          4. HANDLING COMMON PARENTING SITUATIONS (WITH STAGE & INTEREST ADAPTATION)
          ===================================================================== */}
      <section
        className="rounded-3xl border border-amber-300/35 bg-gradient-to-br from-amber-50/75 via-white to-orange-50/35 p-4 shadow-[0_8px_24px_-18px_rgba(15,23,42,0.32)] space-y-4 dark:border-amber-900/40 dark:from-[#29251D] dark:via-[#1D1B18] dark:to-[#101D26]"
        data-testid="parenting-situation-guide"
      >
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-amber-500/12 text-2xl">🧭</span>
          <div>
            <h3 className="text-sm font-black text-[var(--color-text)] dark:text-white">{isEn ? 'What is happening today?' : 'محتاجين تتصرفوا إزاي في موقف معين؟'}</h3>
            <p className="mt-1 text-xs leading-relaxed text-[var(--color-muted)] dark:text-[#CBD5E1]">{isEn ? 'Choose a situation for practical, non-judgmental steps.' : 'اختاروا الموقف وخدوا خطوات عملية هادية، من غير لوم أو أحكام.'}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {PARENTING_SCENARIOS.map((item) => (
            <button key={item.id} type="button" aria-pressed={selectedScenario === item.id} onClick={() => setSelectedScenario(item.id)} className={`min-h-[68px] rounded-2xl border px-3 py-2.5 text-start text-xs font-extrabold shadow-[0_3px_12px_-10px_rgba(15,23,42,0.3)] transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 active:scale-[.98] ${selectedScenario === item.id ? 'border-amber-600 bg-amber-500/15 text-amber-900 dark:text-amber-100' : 'border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-surface)] text-[var(--color-text)]'}`}>
              <span className="block text-lg">{item.emoji}</span>{isEn ? item.titleEn : item.titleAr}
            </button>
          ))}
        </div>
        <div className="rounded-2xl border border-amber-500/20 bg-white/80 p-3.5 shadow-sm space-y-3.5 dark:bg-[#0B131A]/70">
          <h4 className="text-sm font-black text-[var(--color-text)] dark:text-white">{isEn ? scenario.titleEn : scenario.titleAr}</h4>
          <div className="rounded-xl border border-amber-500/20 bg-amber-50/70 dark:bg-[#142430] p-3 space-y-1.5">
            <p className="text-[11px] font-black text-amber-900 dark:text-amber-200">
              {isEn ? scenarioPersonalization.stageNoteEn : scenarioPersonalization.stageNoteAr}
            </p>
            <p className="text-xs font-bold leading-relaxed text-[var(--color-text)] dark:text-[#E2E8F0]">
              {isEn ? scenarioPersonalization.personalizedPhraseEn : scenarioPersonalization.personalizedPhraseAr}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-black text-amber-800 dark:text-amber-200">{isEn ? 'A practical path, one step at a time' : 'مسار عملي.. خطوة ورا خطوة'}</p>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
              {(isEn ? scenario.stepsEn : scenario.stepsAr).map((step, index) => (
                <div key={step} className="relative rounded-xl border border-amber-500/15 bg-gradient-to-br from-white to-amber-50/70 p-3 dark:from-[#142430] dark:to-[#29251D]">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-amber-600 text-[11px] font-black text-white shadow-sm">{index + 1}</span>
                  <p className="mt-2 text-[11px] font-bold leading-relaxed text-[var(--color-text)] dark:text-[#E2E8F0]">{step}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-lg bg-amber-500/10 p-3">
            <p className="text-[10px] font-black text-amber-800 dark:text-amber-200">{isEn ? 'A phrase you can use' : 'جملة ممكن تقولوها'}</p>
            <p className="mt-1 text-xs font-bold leading-relaxed text-[var(--color-text)] dark:text-[#F8FAFC]">{isEn ? scenario.phraseEn : scenario.phraseAr}</p>
          </div>
          <div>
            <p className="text-[10px] font-black text-rose-700 dark:text-rose-300">{isEn ? 'Try to avoid' : 'حاولوا تتجنبوا'}</p>
            <p className="mt-1 text-xs leading-relaxed text-[var(--color-muted)] dark:text-[#CBD5E1]">{isEn ? scenario.avoidEn : scenario.avoidAr}</p>
          </div>
          <div>
            <p className="text-[10px] font-black text-teal-800 dark:text-teal-200">{isEn ? 'When to seek extra support' : 'إمتى نطلب دعم متخصص؟'}</p>
            <p className="mt-1 text-xs leading-relaxed text-[var(--color-muted)] dark:text-[#CBD5E1]">{isEn ? scenario.seekEn : scenario.seekAr}</p>
          </div>
          <button
            type="button"
            onClick={() =>
              onAddRoutineTask?.(
                isEn ? scenarioPersonalization.preventiveTaskEn : scenarioPersonalization.preventiveTaskAr,
                scenarioPersonalization.preventiveTime,
                activeKid?.id ?? null
              )
            }
            className="min-h-[44px] rounded-xl bg-amber-700 px-3.5 py-2 text-xs font-extrabold text-white hover:bg-amber-800 transition-colors cursor-pointer"
          >
            + {isEn ? 'Add preventive step to routine' : 'أضف خطوة وقائية للروتين'}
          </button>
        </div>
      </section>

      {/* =====================================================================
          5. FAMILY COMMUNICATION & BONDING RITUALS
          ===================================================================== */}
      <section
        className="rounded-3xl border border-indigo-300/35 bg-gradient-to-br from-indigo-50/75 via-white to-sky-50/40 p-4 shadow-[0_8px_24px_-18px_rgba(15,23,42,0.32)] space-y-4 dark:border-indigo-900/40 dark:from-[#1B1F38] dark:via-[#101D26] dark:to-[#142430]"
        data-testid="family-bonding-communication-hub"
      >
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-indigo-500/12 text-2xl">🤝</span>
          <div className="min-w-0">
            <h3 className="text-sm font-black text-[var(--color-text)] dark:text-white">
              {isEn ? 'Family Time Together' : 'وقت حلو يجمع الأسرة'}
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-[var(--color-muted)] dark:text-[#CBD5E1]">
              {isEn
                ? 'Simple daily habits for warm conversation, child-led connection, and mutual appreciation.'
                : 'عادات يومية بسيطة للحوار الدافئ، والوقت المشترك، والتقدير المتبادل بين أفراد الأسرة.'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {familyBondingRituals.map((ritual) => (
            <button
              key={ritual.id}
              type="button"
              data-testid={`family-bonding-mode-${ritual.id}`}
              aria-pressed={selectedBondingMode === ritual.id}
              onClick={() => setSelectedBondingMode(ritual.id)}
              className={`min-h-[54px] rounded-2xl border px-3 py-2 text-start text-xs font-extrabold shadow-xs transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 cursor-pointer ${
                selectedBondingMode === ritual.id
                  ? 'border-indigo-600 bg-indigo-500/15 text-indigo-900 dark:text-indigo-100'
                  : 'border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-surface)] text-[var(--color-text)]'
              }`}
            >
              <span className="me-1.5">{ritual.emoji}</span>
              <span>{isEn ? ritual.labelEn : ritual.labelAr}</span>
            </button>
          ))}
        </div>

        <div className="rounded-2xl border border-indigo-500/20 bg-white/85 p-3.5 shadow-sm space-y-3 dark:border-[#29404D] dark:bg-[#0B131A]/70">
          <h4 className="text-sm font-black text-[var(--color-text)] dark:text-white">
            {isEn ? activeBondingRitual.titleEn : activeBondingRitual.titleAr}
          </h4>
          <p className="text-xs leading-relaxed text-[var(--color-muted)] dark:text-[#CBD5E1]">
            {isEn ? activeBondingRitual.descriptionEn : activeBondingRitual.descriptionAr}
          </p>
          <div className="rounded-xl bg-indigo-500/10 p-3">
            <p className="text-[10px] font-black text-indigo-800 dark:text-indigo-200">
              {isEn ? 'Start with these words' : 'ابدأوا الحوار بالجملة دي'}
            </p>
            <p className="mt-1 text-xs font-bold leading-relaxed text-[var(--color-text)] dark:text-[#F8FAFC]">
              {isEn ? activeBondingRitual.promptEn : activeBondingRitual.promptAr}
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              onAddRoutineTask?.(
                isEn ? activeBondingRitual.routineTaskEn : activeBondingRitual.routineTaskAr,
                activeBondingRitual.routineTime,
                activeKid?.id ?? null
              )
            }
            className="min-h-[44px] rounded-xl bg-indigo-700 px-3.5 py-2 text-xs font-extrabold text-white hover:bg-indigo-800 transition-colors cursor-pointer"
          >
            + {isEn ? 'Add family time to routine' : 'ضيفوا وقتكم الحلو لروتين الأسرة'}
          </button>
        </div>
      </section>
    </div>
  );
};

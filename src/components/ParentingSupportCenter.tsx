import React, { useEffect, useMemo, useState } from 'react';
import { calculateChildAge, ChildProfile, LanguageCode, locText } from '../domain/familySpaceCore';

type ChildMoodId = 'happy' | 'calm' | 'sad' | 'angry' | 'worried' | 'tired' | 'overwhelmed';
type HouseholdEnergy = 'steady' | 'tired' | 'overloaded';
type HouseholdCoordination = 'shared' | 'uneven' | 'not_discussed';

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

interface ParentingSupportCenterProps {
  kids: ChildProfile[];
  language: LanguageCode;
  onSaveChildMood: (kidId: number, mood: (typeof CHILD_MOODS)[number]) => Promise<boolean>;
  onAddRoutineTask?: (taskName: string, time: string, kidId: number | null) => void;
  initialKidId?: number | null;
  onActiveKidChange?: (kidId: number) => void;
}

export const ParentingSupportCenter: React.FC<ParentingSupportCenterProps> = ({
  kids,
  language,
  onSaveChildMood,
  onAddRoutineTask,
  initialKidId,
  onActiveKidChange,
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
  const [selectedMoodByKid, setSelectedMoodByKid] = useState<Record<number, ChildMoodId>>({});
  const [savedMoodByKid, setSavedMoodByKid] = useState<Record<number, ChildMoodId>>({});
  const [savingMood, setSavingMood] = useState(false);
  const [moodSaveError, setMoodSaveError] = useState<string | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<(typeof PARENTING_SCENARIOS)[number]['id']>('big-feelings');
  const [householdEnergy, setHouseholdEnergy] = useState<HouseholdEnergy>('steady');
  const [householdCoordination, setHouseholdCoordination] = useState<HouseholdCoordination>('shared');

  const activeKid = useMemo(
    () => kids.find((kid) => kid.id === activeKidId) || kids[0] || null,
    [kids, activeKidId]
  );
  const activeMood = activeKid ? CHILD_MOODS.find((mood) => mood.id === selectedMoodByKid[activeKid.id]) : null;
  const savedMood = activeKid ? CHILD_MOODS.find((mood) => mood.id === savedMoodByKid[activeKid.id]) : null;
  const scenario = PARENTING_SCENARIOS.find((item) => item.id === selectedScenario) || PARENTING_SCENARIOS[0];
  const ageLabel = activeKid ? calculateChildAge(activeKid.birth, language).label : '';

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
      <section className="rounded-3xl border border-rose-300/35 bg-gradient-to-br from-rose-50/80 via-white to-teal-50/60 p-4 shadow-[0_8px_24px_-18px_rgba(15,23,42,0.32)] space-y-4 dark:border-rose-900/40 dark:from-[#241B26] dark:via-[#101D26] dark:to-[#142430]" data-testid="household-wellbeing-checkin">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-rose-500/12 text-2xl">🏡</span>
          <div className="min-w-0">
            <h3 className="text-sm font-black text-[var(--color-text)] dark:text-white">{isEn ? 'The whole household · Parents first' : 'البيت كله · الأب والأم أولًا'}</h3>
            <p className="mt-1 text-xs leading-relaxed text-[var(--color-muted)] dark:text-[#CBD5E1]">{isEn ? 'A quick check-in about the adults and shared responsibilities — separate from each child’s personal record.' : 'متابعة سريعة لحالة الكبار وتوزيع المسؤوليات، وده منفصل تمامًا عن سجل كل طفل.'}</p>
          </div>
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
          <button type="button" onClick={() => onAddRoutineTask?.(isEn ? '10-minute parent check-in and task sharing' : 'جلسة تنسيق وراحة للأب والأم لمدة ١٠ دقائق', '08:30 م', null)} className="min-h-[40px] rounded-xl bg-teal-700 px-3 py-2 text-xs font-extrabold text-white hover:bg-teal-800">
            + {isEn ? 'Add a family check-in to the routine' : 'أضف جلسة تنسيق للأسرة للروتين'}
          </button>
        </div>
        <p className="text-[10px] leading-relaxed text-[var(--color-muted)] dark:text-[#94A3B8]">{isEn ? 'This is a supportive reflection, not a mental-health assessment or diagnosis. Household answers stay in this screen and are not saved.' : 'دي مساحة مساندة للتفكير، مش تقييم أو تشخيص نفسي. اختيارات البيت هنا لا تُحفظ ولا تُرسل.'}</p>
      </section>

      <section className="rounded-3xl border border-sky-300/35 bg-gradient-to-br from-sky-50/75 via-white to-cyan-50/40 p-4 shadow-[0_8px_24px_-18px_rgba(15,23,42,0.32)] space-y-4 dark:border-sky-900/40 dark:from-[#172D3A] dark:via-[#101F2B] dark:to-[#101D26]" data-testid="child-emotional-checkin">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-sky-500/12 text-2xl">🧒</span>
          <div className="min-w-0">
            <h3 className="text-sm font-black text-[var(--color-text)] dark:text-white">{isEn ? 'Each child · Their own feelings' : 'كل طفل لوحده · مشاعره وسجله'}</h3>
            <p className="mt-1 text-xs leading-relaxed text-[var(--color-muted)] dark:text-[#CBD5E1]">{isEn ? 'Choose one child and record how they seem right now. A feeling is a moment, not a label.' : 'اختاروا طفل واحد وسجلوا حالته الشعورية دلوقتي. الشعور لحظة بنلاحظها، مش صفة بنحكم بيها على الطفل.'}</p>
          </div>
        </div>
        {kids.length > 0 ? (
          <>
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
            {activeKid && (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-bold text-[var(--color-muted)] dark:text-[#CBD5E1]">{locText(activeKid.name, language)} · {ageLabel || (isEn ? 'Age not recorded' : 'العمر غير مسجل')}</p>
                  <span className="text-[10px] font-bold text-[var(--color-muted)]">{isEn ? 'Private child record' : 'سجل خاص بالطفل'}</span>
                </div>
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
                    <button type="button" disabled={savingMood} onClick={() => void handleSaveMood()} className="min-h-[42px] rounded-xl bg-sky-700 px-4 py-2 text-xs font-extrabold text-white disabled:opacity-50">
                      {savingMood ? (isEn ? 'Saving…' : 'جاري الحفظ…') : (isEn ? 'Save to this child’s record' : 'احفظ في ملف الطفل')}
                    </button>
                    {savedMood?.id === activeMood.id && <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">✓ {isEn ? 'Saved to the child record.' : 'تم حفظ الحالة في سجل الطفل.'}</p>}
                    {moodSaveError && <p role="alert" className="text-[11px] font-bold leading-relaxed text-rose-700 dark:text-rose-300">{moodSaveError}</p>}
                  </div>
                )}
              </>
            )}
          </>
        ) : (
          <p className="rounded-xl bg-white/70 dark:bg-[#0B131A]/60 p-3 text-xs font-bold text-[var(--color-muted)]">{isEn ? 'Add a child profile to start an individual emotional check-in.' : 'أضيفوا ملف طفل لبدء تسجيل مشاعره بشكل مستقل.'}</p>
        )}
        <p className="text-[10px] leading-relaxed text-[var(--color-muted)] dark:text-[#94A3B8]">{isEn ? 'A mood log is not a diagnosis. If distress is persistent, severe or affects safety and daily functioning, speak with a qualified professional.' : 'تسجيل المزاج مش تشخيص. لو الضيق مستمر أو شديد أو مؤثر على الأمان والحياة اليومية، تواصلوا مع مختص مؤهل.'}</p>
      </section>

      <section className="rounded-3xl border border-amber-300/35 bg-gradient-to-br from-amber-50/75 via-white to-orange-50/35 p-4 shadow-[0_8px_24px_-18px_rgba(15,23,42,0.32)] space-y-4 dark:border-amber-900/40 dark:from-[#29251D] dark:via-[#1D1B18] dark:to-[#101D26]" data-testid="parenting-situation-guide">
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
          <div>
            <p className="text-[11px] font-black text-amber-800 dark:text-amber-200">{isEn ? 'Try these steps' : 'جرّبوا الخطوات دي'}</p>
            <ol className="mt-1 space-y-1.5 ps-5 list-decimal text-xs leading-relaxed text-[var(--color-text)] dark:text-[#E2E8F0]">
              {(isEn ? scenario.stepsEn : scenario.stepsAr).map((step) => <li key={step}>{step}</li>)}
            </ol>
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
        </div>
      </section>
    </div>
  );
};

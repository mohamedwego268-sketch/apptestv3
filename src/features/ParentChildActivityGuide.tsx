import React, { useEffect, useState } from 'react';
import { CheckCircle2, ChevronLeft, ChevronRight, Clock3, X } from 'lucide-react';

export interface GuidedActivity {
  id: string;
  title: string;
  topic: string;
  durationMinutes: number;
  reflectionNote?: string;
  chosenChallenge?: string;
  childResponse?: 'loved' | 'okay' | 'not_interested' | 'repeat';
}

interface ParentChildActivityGuideProps {
  activity: GuidedActivity;
  language: 'ar' | 'en';
  onClose: () => void;
  onComplete: (activity: GuidedActivity) => Promise<boolean>;
}

type ActivityPlan = {
  minutes: number;
  materials: string[];
  steps: { title: string; prompt: string }[];
  reflection: string;
};

const PLANS: Record<string, ActivityPlan> = {
  'sensory-play': { minutes: 7, materials: ['٣ خامات آمنة مختلفة', 'مكان هادئ'], steps: [
    { title: 'جهّزوا الاكتشاف', prompt: 'حطّوا الخامات قدام الطفل وخلوه يختار واحدة بنفسه.' },
    { title: 'اكتشفوا سوا', prompt: 'المسوا الخامة ووصفوا إحساسها: ناعمة، خشنة، باردة أو طرية.' },
    { title: 'سيبوا له القيادة', prompt: 'اسألوه: تحب تجرب أنهي واحدة بعد كده؟ واحترموا اختياره.' },
  ], reflection: 'إيه أكتر خامة شدت انتباهه؟' },
  'picture-story': { minutes: 8, materials: ['كتاب مصور أو صورة واحدة'], steps: [
    { title: 'اختاروا صورة', prompt: 'خلّوا الطفل يختار الصورة اللي عجباه، من غير ما تفرضوا موضوع.' },
    { title: 'لاحظوا التفاصيل', prompt: 'اسألوه: شايف إيه؟ وإيه أكتر حاجة لفتت نظرك؟' },
    { title: 'كمّلوا الحكاية', prompt: 'خلوه يتخيل اللي هيحصل بعد كده، وشاركوه بإضافة لطيفة.' },
  ], reflection: 'إيه الفكرة اللي فاجأتكم؟' },
  'creative-art': { minutes: 12, materials: ['ورق', 'ألوان آمنة مناسبة للعمر'], steps: [
    { title: 'افتحوا مساحة للإبداع', prompt: 'اختاروا لونين أو ثلاثة وسيبوا الطفل يقرر يبدأ بإيه.' },
    { title: 'شاركوه من غير تصحيح', prompt: 'ارسموا جنبه، واسألوه يحكي لكم عن اختياراته.' },
    { title: 'احتفلوا بالمحاولة', prompt: 'اعرضوا العمل في مكان يختاره الطفل، من غير تقييم أو مقارنة.' },
  ], reflection: 'إيه اللي استمتع بعمله النهارده؟' },
  'active-play': { minutes: 10, materials: ['مساحة آمنة وخالية من العوائق', 'كرة خفيفة اختيارية'], steps: [
    { title: 'اختاروا الحركة', prompt: 'اعرضوا حركتين بسيطتين وخلوه يختار اللي يحب يجربها.' },
    { title: 'العبوا بالتبادل', prompt: 'قلّدوا حركة بعض أو مرروا الكرة بهدوء حسب عمره وقدرته.' },
    { title: 'اختموا بهدوء', prompt: 'خفّفوا السرعة وخدوا نفسًا مع بعض قبل إنهاء اللعب.' },
  ], reflection: 'أي حركة طلب يكررها؟' },
  'food-rhythm': { minutes: 8, materials: ['اختياران مناسبان ومسموحان للطفل', 'طبق صغير'], steps: [
    { title: 'جهّزوا اختيارين', prompt: 'استخدموا أطعمة سبق التأكد من مناسبتها لحساسية الطفل واحتياجاته.' },
    { title: 'شاركوه التحضير', prompt: 'خلوه يختار بين الاختيارين ويساعد في خطوة آمنة تناسب عمره.' },
    { title: 'احترموا إشاراته', prompt: 'شجعوا الاستكشاف من غير ضغط أو إجبار على الأكل.' },
  ], reflection: 'إيه الاختيار اللي فضّله؟ وهل حب يشارك؟' },
  'feelings-checkin': { minutes: 4, materials: ['وقت هادئ من غير مقاطعة'], steps: [
    { title: 'ابدأوا بالقرب', prompt: 'اقعدوا في مستوى نظره، وادّوله اختيار يتكلم أو يقعد جنبكم.' },
    { title: 'اسمعوا من غير استعجال', prompt: 'سمّوا الإحساس بلطف من غير ما تقولوا له المفروض يحس بإيه.' },
    { title: 'اسألوه محتاج إيه', prompt: 'اسألوه: تحب مساعدة، حضن، ولا وقت لوحدك؟ واحترموا إشارته.' },
  ], reflection: 'إيه اللي ساعده يحس بالأمان؟' },
  'calm-evening': { minutes: 8, materials: ['إضاءة هادئة', 'قصة قصيرة اختيارية'], steps: [
    { title: 'أعلنوا نهاية النشاط', prompt: 'قولوا للطفل بهدوء إن وقت الراحة قرب، وادّوه فرصة يختار آخر نشاط.' },
    { title: 'خفّفوا المثيرات', prompt: 'قلّلوا الأصوات والشاشات وخفّفوا الإضاءة تدريجيًا.' },
    { title: 'اصنعوا طقسًا ثابتًا', prompt: 'اختاروا قصة أو أغنية هادئة أو لحظة حضن حسب ما يريحه.' },
  ], reflection: 'أي خطوة كانت أهدى وأسهل عليه؟' },
  'family-connection': { minutes: 6, materials: ['كل فرد متاح من الأسرة'], steps: [
    { title: 'اجمعوا لحظة قصيرة', prompt: 'اقفلوا الشاشات لدقايق وخلي كل شخص يشارك بالطريقة اللي تريحه.' },
    { title: 'شاركوا حاجة لطيفة', prompt: 'كل واحد يقول أو يرسم حاجة صغيرة أسعدته النهارده.' },
    { title: 'اختاروا ذكرى مشتركة', prompt: 'اتفقوا على حاجة بسيطة تحبوا تعملوها سوا مرة تانية.' },
  ], reflection: 'إيه اللحظة اللي حابين تفتكروها؟' },
  independence: { minutes: 7, materials: ['مهمة منزلية آمنة تناسب العمر'], steps: [
    { title: 'اعرضوا اختيارين', prompt: 'اختاروا مهمتين آمنتين ومناسبتين لعمره وخلوه يختار واحدة.' },
    { title: 'نفّذوا جنب بعض', prompt: 'قسّموا المهمة لخطوات صغيرة، وساعدوه عند الحاجة فقط.' },
    { title: 'قدّروا المحاولة', prompt: 'اشكروه على المشاركة والمجهود، مش على الكمال أو السرعة.' },
  ], reflection: 'إيه الجزء اللي قدر يعمله باستقلالية؟' },
};

const ENGLISH_PLANS: Record<string, ActivityPlan> = {
  'sensory-play': { minutes: 7, materials: ['Three safe textures', 'A calm space'], steps: [
    { title: 'Set up discovery', prompt: 'Place the textures nearby and let your child choose one.' },
    { title: 'Explore together', prompt: 'Touch it together and describe how it feels: soft, rough, cool or squishy.' },
    { title: 'Let your child lead', prompt: 'Ask which one they would like to explore next, and follow their choice.' },
  ], reflection: 'Which texture caught their attention most?' },
  'picture-story': { minutes: 8, materials: ['A picture book or one photo'], steps: [
    { title: 'Choose a picture', prompt: 'Let your child pick the picture that interests them.' },
    { title: 'Notice the details', prompt: 'Ask: What do you see? What caught your eye?' },
    { title: 'Continue the story', prompt: 'Invite your child to imagine what happens next, then add an idea together.' },
  ], reflection: 'What idea surprised you?' },
  'creative-art': { minutes: 12, materials: ['Paper', 'Age-safe colors'], steps: [
    { title: 'Make room for creativity', prompt: 'Offer two or three colors and let your child choose where to begin.' },
    { title: 'Create without correcting', prompt: 'Draw alongside them and invite them to tell you about their choices.' },
    { title: 'Celebrate the attempt', prompt: 'Display the creation somewhere they choose. No grading or comparisons.' },
  ], reflection: 'What part did they enjoy most?' },
  'active-play': { minutes: 10, materials: ['A safe, clear space', 'A soft ball if useful'], steps: [
    { title: 'Choose a movement', prompt: 'Offer two simple movements and let your child choose one.' },
    { title: 'Take turns', prompt: 'Copy each other or gently pass the ball in an age-appropriate way.' },
    { title: 'Slow down together', prompt: 'Gradually slow the movement and take a calm breath before finishing.' },
  ], reflection: 'Which movement did they want to repeat?' },
  'food-rhythm': { minutes: 8, materials: ['Two foods already confirmed safe', 'A small plate'], steps: [
    { title: 'Prepare two choices', prompt: 'Use only foods already confirmed suitable for the child’s allergies and dietary needs.' },
    { title: 'Invite them to help', prompt: 'Let your child choose and help with one safe, age-appropriate preparation step.' },
    { title: 'Respect their signals', prompt: 'Invite exploration without pressure or forcing them to eat.' },
  ], reflection: 'Which option did they prefer? Did they enjoy helping?' },
  'feelings-checkin': { minutes: 4, materials: ['A quiet moment without interruptions'], steps: [
    { title: 'Start with connection', prompt: 'Come down to their eye level and offer to talk or simply sit together.' },
    { title: 'Listen without rushing', prompt: 'Gently name the feeling without telling them what they should feel.' },
    { title: 'Ask what would help', prompt: 'Ask whether they would like help, a hug, or a little space. Respect their signal.' },
  ], reflection: 'What helped them feel safe or settled?' },
  'calm-evening': { minutes: 8, materials: ['Soft lighting', 'A short story if wanted'], steps: [
    { title: 'Signal the transition', prompt: 'Gently let your child know rest time is approaching and offer a final activity choice.' },
    { title: 'Reduce stimulation', prompt: 'Lower noise, put screens away and soften the lights gradually.' },
    { title: 'Create a familiar ritual', prompt: 'Choose a story, quiet song or comforting moment that suits your child.' },
  ], reflection: 'Which step made the transition easier?' },
  'family-connection': { minutes: 6, materials: ['Any family members who are available'], steps: [
    { title: 'Make a small gathering', prompt: 'Put screens aside for a few minutes and let everyone join in their own way.' },
    { title: 'Share one good thing', prompt: 'Each person can say or draw one small thing they enjoyed today.' },
    { title: 'Choose a shared memory', prompt: 'Pick one simple thing you would enjoy doing together again.' },
  ], reflection: 'Which moment would you like to remember?' },
  independence: { minutes: 7, materials: ['A safe, age-appropriate household task'], steps: [
    { title: 'Offer two choices', prompt: 'Choose two safe tasks that suit your child’s age and let them pick one.' },
    { title: 'Do it side by side', prompt: 'Break the task into small steps and help only when needed.' },
    { title: 'Value the effort', prompt: 'Thank them for joining in and trying, not for speed or perfection.' },
  ], reflection: 'Which part could they do independently?' },
};

const PLAY_CHALLENGES: Record<string, { ar: string[]; en: string[] }> = {
  'sensory-play': { ar: ['اعملوا تخمين للخامة قبل لمسها', 'دوروا على خامة شبهها في البيت', 'غمّضوا العينين وخمّنوا الملمس'], en: ['Guess the texture before touching', 'Find a similar texture at home', 'Close your eyes and guess the feel'] },
  'picture-story': { ar: ['اخترعوا صوتًا لشخصية في الصورة', 'تخيلوا نهاية مختلفة للحكاية', 'ابحثوا عن ٣ تفاصيل صغيرة'], en: ['Invent a voice for a character', 'Imagine a different ending', 'Find three tiny details'] },
  'creative-art': { ar: ['ارسموا بنفس اللون وأنتم مغمضين', 'حوّلوا شكلًا عشوائيًا لشيء جديد', 'ارسموا لوحة بالتبادل'], en: ['Draw using one color with eyes closed', 'Turn a random shape into something new', 'Take turns adding to one picture'] },
  'active-play': { ar: ['قلّدوا حركة حيوان', 'امشوا كأنكم روبوتات', 'ابتكروا حركة سرية للأسرة'], en: ['Copy an animal movement', 'Walk like friendly robots', 'Invent a secret family move'] },
  'food-rhythm': { ar: ['اوصفوا اللون والرائحة معًا', 'رتّبوا الأطعمة حسب اللون', 'اختاروا اسمًا مضحكًا للطبق'], en: ['Describe the color and smell together', 'Sort foods by color', 'Give the plate a funny name'] },
  'feelings-checkin': { ar: ['اختاروا لونًا يعبّر عن الإحساس', 'ارسموا الإحساس في شكل', 'اختاروا شيئًا يساعد على الهدوء'], en: ['Choose a color for the feeling', 'Draw the feeling as a shape', 'Choose something that helps you feel calm'] },
  'calm-evening': { ar: ['اسمعوا صوتًا هادئًا وخمّنوه', 'اختاروا كلمة لطيفة لليوم', 'خذوا ٣ أنفاس بطيئة سوا'], en: ['Listen and guess a gentle sound', 'Choose a kind word for today', 'Take three slow breaths together'] },
  'family-connection': { ar: ['مثّلوا ذكرى مضحكة', 'قولوا مجاملة لكل شخص', 'اخترعوا تحية أسرية جديدة'], en: ['Act out a funny memory', 'Give everyone a kind compliment', 'Invent a new family greeting'] },
  independence: { ar: ['رتّبوا ٣ أشياء في مكانها', 'اختاروا مهمة صغيرة للغد', 'علّموا بعض خطوة جديدة'], en: ['Put three things in their place', 'Choose one small task for tomorrow', 'Teach each other one new step'] },
};

export const ParentChildActivityGuide: React.FC<ParentChildActivityGuideProps> = ({ activity, language, onClose, onComplete }) => {
  const isEn = language === 'en';
  const plan = (isEn ? ENGLISH_PLANS[activity.id] : PLANS[activity.id]) ?? PLANS['family-connection'];
  const [step, setStep] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [reflectionNote, setReflectionNote] = useState('');
  const [chosenChallenge, setChosenChallenge] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [childResponse, setChildResponse] = useState<GuidedActivity['childResponse']>();

  const playCue = () => {
    if (!soundEnabled || typeof window === 'undefined' || !('AudioContext' in window)) return;
    try {
      const audio = new window.AudioContext();
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(660, audio.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(880, audio.currentTime + 0.09);
      gain.gain.setValueAtTime(0.0001, audio.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.08, audio.currentTime + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.18);
      oscillator.connect(gain);
      gain.connect(audio.destination);
      oscillator.start();
      oscillator.stop(audio.currentTime + 0.19);
      oscillator.onended = () => { void audio.close(); };
    } catch {
      // Sound is optional; the activity remains fully usable if audio is unavailable.
    }
  };
  const challenges = PLAY_CHALLENGES[activity.id] ?? PLAY_CHALLENGES['family-connection'];

  useEffect(() => {
    setStep(0);
    setElapsed(0);
    setReflectionNote('');
    setChosenChallenge('');
    setChildResponse(undefined);
    setSaved(false);
  }, [activity.id]);

  useEffect(() => {
    if (saved) return;
    const timer = window.setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [saved]);

  const finish = async () => {
    setSaving(true);
    const ok = await onComplete({ ...activity, durationMinutes: Math.max(1, Math.round(elapsed / 60)), reflectionNote: reflectionNote.trim() || undefined, chosenChallenge: chosenChallenge || undefined, childResponse });
    setSaving(false);
    if (ok) setSaved(true);
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center bg-slate-950/70 p-0 backdrop-blur-sm sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="nekbaar-guided-activity-title" dir={isEn ? 'ltr' : 'rtl'}>
      <div className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-[2rem] border border-white/15 bg-[#F8FCFB] p-4 text-slate-900 shadow-2xl dark:bg-[#10212A] dark:text-white sm:rounded-[2rem] sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-black tracking-widest text-teal-700 dark:text-teal-300">{isEn ? 'PARENT + CHILD MODE' : 'وقت مشترك · ولي الأمر والطفل'}</span>
            <h2 id="nekbaar-guided-activity-title" className="mt-1 text-lg font-black">{activity.title}</h2>
          </div>
          <button type="button" onClick={() => setSoundEnabled((value) => !value)} aria-pressed={soundEnabled} aria-label={isEn ? 'Toggle sound effects' : 'تشغيل أو إيقاف صوت التفاعل'} className={`grid h-11 w-11 shrink-0 place-items-center rounded-full transition ${soundEnabled ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-600 dark:bg-white/10 dark:text-white'}`}><span aria-hidden="true">{soundEnabled ? '🔊' : '🔈'}</span></button>
          <button type="button" onClick={onClose} aria-label={isEn ? 'Close activity' : 'إغلاق النشاط'} className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-slate-200 text-slate-700 transition hover:rotate-90 dark:bg-white/10 dark:text-white"><X size={19} /></button>
        </div>
        {saved ? (
          <div className="space-y-4 py-8 text-center">
            <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300"><CheckCircle2 size={42} /></div>
            <h3 className="text-xl font-black">{isEn ? 'A real moment, saved!' : 'لحظة حقيقية اتسجلت!'}</h3>
            <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{isEn ? 'This shared activity is now part of your child’s timeline.' : 'التجربة دي بقت جزء من حكاية يوم طفلك وتقدروا ترجعولها.'}</p>
            <button type="button" onClick={onClose} className="min-h-12 w-full rounded-2xl bg-teal-600 px-4 py-3 text-sm font-black text-white">{isEn ? 'Back to our day' : 'نرجع ليومنا'}</button>
          </div>
        ) : (
          <>
            <div className="mb-4 grid grid-cols-2 gap-2">
              <div className="rounded-2xl bg-teal-50 p-3 dark:bg-teal-400/10"><span className="text-[10px] font-bold text-teal-800 dark:text-teal-200">{isEn ? 'TIME TOGETHER' : 'وقت التجربة'}</span><p className="mt-1 flex items-center gap-1.5 text-lg font-black tabular-nums"><Clock3 size={17} /> {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')}</p></div>
              <div className="rounded-2xl bg-violet-50 p-3 dark:bg-violet-400/10"><span className="text-[10px] font-bold text-violet-800 dark:text-violet-200">{isEn ? 'SUGGESTED TIME' : 'الوقت المقترح'}</span><p className="mt-1 text-lg font-black">{plan.minutes} {isEn ? 'min' : 'دقيقة'}</p></div>
            </div>
            <div className="mb-4 rounded-2xl border border-slate-200 p-3 dark:border-white/10">
              <p className="mb-2 text-xs font-black">{isEn ? 'Get these ready' : 'جهّزوا مع بعض'}</p>
              <div className="flex flex-wrap gap-2">{plan.materials.map((item) => <span key={item} className="rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-bold dark:bg-white/10">{item}</span>)}</div>
            </div>
            <div className="mb-3 flex items-center justify-between"><span className="text-xs font-black">{isEn ? 'Do it together, step by step' : 'نفّذوا النشاط خطوة بخطوة'}</span><span className="text-[11px] font-black text-teal-700 dark:text-teal-300">{step + 1}/{plan.steps.length}</span></div>
            <div className="mb-4 flex gap-1.5">{plan.steps.map((item, index) => <div key={item.title} className={`h-1.5 flex-1 rounded-full transition-colors ${index <= step ? 'bg-teal-500' : 'bg-slate-200 dark:bg-white/10'}`} />)}</div>
            <div className="min-h-[170px] rounded-[1.5rem] bg-gradient-to-br from-[#0D4850] to-[#174A69] p-5 text-white shadow-lg">
              <span className="text-3xl">{['🤝', '🌱', '✨'][step]}</span>
              <h3 className="mt-3 text-xl font-black">{plan.steps[step].title}</h3>
              <p className="mt-2 text-sm leading-7 text-white/85">{plan.steps[step].prompt}</p>
              <p className="mt-3 text-[10px] font-bold text-teal-100/75">{isEn ? 'Follow your child’s pace. Adapt or stop whenever they need.' : 'امشوا على إيقاع طفلك. غيّروا الخطوة أو وقفوا وقت ما يحتاج.'}</p>
            </div>
            {step === 1 && (
              <section className="mt-3 rounded-2xl border border-violet-200 bg-violet-50/80 p-3 dark:border-violet-300/15 dark:bg-violet-400/10" aria-label={isEn ? 'Choose a mini game' : 'اختاروا تحديًا صغيرًا'}>
                <div className="mb-2 flex items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-xl bg-violet-200 text-lg dark:bg-violet-300/15">🎲</span>
                  <div>
                    <p className="text-xs font-black text-violet-950 dark:text-violet-100">{isEn ? 'Pick a playful mini-challenge' : 'اختاروا تحدي صغير يخلّيها لعبة'}</p>
                    <p className="text-[10px] text-violet-800/80 dark:text-violet-200/80">{isEn ? 'No right or wrong answers — just do it together.' : 'مفيش إجابة صح أو غلط.. اختاروا ونفّذوا سوا.'}</p>
                  </div>
                </div>
                <div className="grid gap-2">
                  {(isEn ? challenges.en : challenges.ar).map((challenge, index) => (
                    <button key={challenge} type="button" aria-pressed={chosenChallenge === challenge} onClick={() => { setChosenChallenge(challenge); playCue(); }} className={`min-h-11 rounded-xl border px-3 py-2 text-start text-xs font-bold transition ${chosenChallenge === challenge ? 'border-violet-500 bg-violet-200 text-violet-950 dark:bg-violet-300/20 dark:text-white' : 'border-violet-200 bg-white/80 text-slate-700 hover:border-violet-400 dark:border-white/10 dark:bg-white/5 dark:text-slate-100'}`}>
                      <span className="me-2 inline-grid h-6 w-6 place-items-center rounded-lg bg-violet-100 text-[10px] font-black text-violet-800 dark:bg-white/10 dark:text-violet-100">{index + 1}</span>{challenge}
                    </button>
                  ))}
                </div>
                {chosenChallenge && <p aria-live="polite" className="mt-2 rounded-xl bg-white/80 px-3 py-2 text-[11px] font-black text-violet-900 dark:bg-white/10 dark:text-violet-100">{isEn ? 'Your mission:' : 'مهمتكم:'} {chosenChallenge} ✨</p>}
              </section>
            )}
            {step === plan.steps.length - 1 && (
              <fieldset className="mt-3 rounded-2xl border border-teal-200 bg-teal-50/70 p-3 dark:border-teal-300/15 dark:bg-teal-400/10">
                <legend className="px-1 text-[11px] font-black text-teal-950 dark:text-teal-100">{isEn ? 'How did your child respond?' : 'طفلك استقبل التجربة إزاي؟'}</legend>
                <div className="mt-1 grid grid-cols-2 gap-2">
                  {([
                    ['loved', isEn ? 'Loved it 😍' : 'انبسط جدًا 😍'],
                    ['okay', isEn ? 'Enjoyed it 🙂' : 'انبسط 🙂'],
                    ['not_interested', isEn ? 'Not interested 😶' : 'مش مهتم دلوقتي 😶'],
                    ['repeat', isEn ? 'Wants it again 🔁' : 'عايز يكررها 🔁'],
                  ] as const).map(([value, label]) => (
                    <button key={value} type="button" aria-pressed={childResponse === value} onClick={() => setChildResponse(value)} className={`min-h-11 rounded-xl border px-2 py-2 text-[11px] font-black transition ${childResponse === value ? 'border-teal-600 bg-teal-100 text-teal-950 dark:bg-teal-300/20 dark:text-white' : 'border-teal-200 bg-white/80 text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-100'}`}>{label}</button>
                  ))}
                </div>
              </fieldset>
            )}
            {step === plan.steps.length - 1 && (
              <label className="mt-3 block">
                <span className="mb-1.5 block text-[11px] font-black text-slate-700 dark:text-slate-200">{isEn ? 'A note about this moment (optional)' : 'احفظوا ملاحظة صغيرة عن اللحظة (اختياري)'}</span>
                <textarea
                  value={reflectionNote}
                  onChange={(event) => setReflectionNote(event.target.value)}
                  rows={2}
                  maxLength={400}
                  placeholder={isEn ? 'What did your child enjoy or discover?' : 'إيه اللي استمتع بيه طفلك أو اكتشفه؟'}
                  className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/15 dark:border-white/10 dark:bg-white/5"
                />
              </label>
            )}
            <div className="mt-4 flex gap-2">
              <button type="button" disabled={step === 0} onClick={() => setStep((value) => Math.max(0, value - 1))} className="grid min-h-12 w-12 shrink-0 place-items-center rounded-xl border border-slate-200 disabled:opacity-30 dark:border-white/10">{isEn ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}</button>
              {step < plan.steps.length - 1 ? <button type="button" onClick={() => { setStep((value) => Math.min(plan.steps.length - 1, value + 1)); playCue(); }} className="min-h-12 flex-1 rounded-xl bg-teal-600 px-4 py-3 text-sm font-black text-white transition hover:bg-teal-500">{isEn ? 'Next step →' : 'خلصنا الخطوة.. نكمل ←'}</button> : <button type="button" disabled={saving} onClick={() => void finish()} className="min-h-12 flex-1 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-black text-white transition hover:bg-emerald-500 disabled:opacity-60">{saving ? (isEn ? 'Saving…' : 'جارٍ حفظ اللحظة…') : (isEn ? 'We did it — save our moment ✓' : 'خلصنا.. سجّلوا اللحظة دي ✓')}</button>}
            </div>
            <p className="mt-3 text-center text-[10px] leading-5 text-slate-500 dark:text-slate-400">{plan.reflection}</p>
          </>
        )}
      </div>
    </div>
  );
};

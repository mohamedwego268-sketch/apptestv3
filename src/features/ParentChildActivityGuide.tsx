import React, { useEffect, useState } from 'react';
import { CheckCircle2, ChevronLeft, ChevronRight, Clock3, X } from 'lucide-react';

export interface GuidedActivity {
  id: string;
  title: string;
  topic: string;
  durationMinutes: number;
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

export const ParentChildActivityGuide: React.FC<ParentChildActivityGuideProps> = ({ activity, language, onClose, onComplete }) => {
  const isEn = language === 'en';
  const plan = PLANS[activity.id] ?? PLANS['family-connection'];
  const [step, setStep] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (saved) return;
    const timer = window.setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [saved]);

  const finish = async () => {
    setSaving(true);
    const ok = await onComplete({ ...activity, durationMinutes: Math.max(1, Math.round(elapsed / 60)) });
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
            <div className="mt-4 flex gap-2">
              <button type="button" disabled={step === 0} onClick={() => setStep((value) => Math.max(0, value - 1))} className="grid min-h-12 w-12 shrink-0 place-items-center rounded-xl border border-slate-200 disabled:opacity-30 dark:border-white/10">{isEn ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}</button>
              {step < plan.steps.length - 1 ? <button type="button" onClick={() => setStep((value) => Math.min(plan.steps.length - 1, value + 1))} className="min-h-12 flex-1 rounded-xl bg-teal-600 px-4 py-3 text-sm font-black text-white transition hover:bg-teal-500">{isEn ? 'Next step →' : 'خلصنا الخطوة.. نكمل ←'}</button> : <button type="button" disabled={saving} onClick={() => void finish()} className="min-h-12 flex-1 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-black text-white transition hover:bg-emerald-500 disabled:opacity-60">{saving ? (isEn ? 'Saving…' : 'جارٍ حفظ اللحظة…') : (isEn ? 'We did it — save our moment ✓' : 'خلصنا.. سجّلوا اللحظة دي ✓')}</button>}
            </div>
            <p className="mt-3 text-center text-[10px] leading-5 text-slate-500 dark:text-slate-400">{plan.reflection}</p>
          </>
        )}
      </div>
    </div>
  );
};

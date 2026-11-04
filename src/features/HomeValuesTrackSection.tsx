import React, { useState } from 'react';
import type { AgeStage, LanguageCode } from '../domain/familySpaceCore';

interface HomeValuesTrackSectionProps {
  language: LanguageCode;
  childName: string;
  ageStage: AgeStage;
  childId: number | null;
  onAddRoutineTask?: (taskName: string, time: string, kidId: number | null) => void;
}

interface ValueActivity {
  id: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  taskAr: string;
  taskEn: string;
}

const ACTIVITIES_BY_AGE: Record<AgeStage, ValueActivity[]> = {
  '0-2': [
    {
      id: 'warm-example',
      titleAr: 'القدوة والحنان',
      titleEn: 'Warm example',
      descriptionAr: 'استخدموا كلمات لطيفة ونبرة هادئة؛ الطفل في السن ده بيتعلم بالملاحظة والتفاعل اليومي.',
      descriptionEn: 'Use kind words and a calm tone. At this age, children learn through observation and everyday interaction.',
      taskAr: 'لحظة تواصل هادئة مع الطفل',
      taskEn: 'A calm connection moment with your child',
    },
    {
      id: 'gentle-routine',
      titleAr: 'عادة صغيرة متكررة',
      titleEn: 'A small repeated ritual',
      descriptionAr: 'خلّوا للتحية أو الشكر أو الوداع طقسًا بسيطًا يتكرر مع ابتسامة وتواصل.',
      descriptionEn: 'Make greeting, thanking or saying goodbye a small repeated ritual with warmth and connection.',
      taskAr: 'تدريب يومي على التحية والشكر',
      taskEn: 'Practice greeting and gratitude',
    },
  ],
  '2-5': [
    {
      id: 'taking-turns',
      titleAr: 'الدور والمشاركة',
      titleEn: 'Taking turns',
      descriptionAr: 'استخدموا لعبة قصيرة لتعليم انتظار الدور. المشاركة مهارة بتتدرّب، ومش مطلوب إجبار الطفل على التنازل عن حاجته.',
      descriptionEn: 'Use a short game to practice turn-taking. Sharing is a skill to learn, not a reason to force a child to give up something important.',
      taskAr: 'لعبة تبادل الأدوار لمدة ١٠ دقائق',
      taskEn: 'A 10-minute turn-taking game',
    },
    {
      id: 'kindness',
      titleAr: 'اللطف والتعاطف',
      titleEn: 'Kindness and empathy',
      descriptionAr: 'سمّوا المشاعر واسألوا: نقدر نساعد صاحبنا إزاي؟ خلّوا التعاطف مرتبطًا بموقف حقيقي وبسيط.',
      descriptionEn: 'Name feelings and ask how someone could be helped. Connect empathy to a real, simple moment.',
      taskAr: 'موقف يومي للتعبير عن اللطف',
      taskEn: 'A small daily act of kindness',
    },
  ],
  '5-8': [
    {
      id: 'responsibility',
      titleAr: 'المسؤولية المناسبة للعمر',
      titleEn: 'Age-appropriate responsibility',
      descriptionAr: 'اختاروا مسؤولية صغيرة وواضحة، زي ترتيب أدواته أو تجهيز شيء بسيط لليوم التالي، وامدحوا المحاولة.',
      descriptionEn: 'Choose one clear, small responsibility, such as putting away belongings or preparing something for tomorrow. Notice the effort.',
      taskAr: 'مسؤولية يومية صغيرة للطفل',
      taskEn: 'One small daily responsibility',
    },
    {
      id: 'honesty-fairness',
      titleAr: 'الصدق والعدل',
      titleEn: 'Honesty and fairness',
      descriptionAr: 'ناقشوا موقفًا يوميًا واسألوا: إيه التصرف العادل؟ إزاي نصلح الغلط؟ من غير تخويف أو إحراج.',
      descriptionEn: 'Talk through an everyday situation: What would be fair? How can we repair a mistake? Avoid fear or shame.',
      taskAr: 'حوار قصير عن الصدق والعدل',
      taskEn: 'A short conversation about honesty and fairness',
    },
  ],
  all: [
    {
      id: 'family-gratitude',
      titleAr: 'لحظة امتنان للأسرة',
      titleEn: 'A family gratitude moment',
      descriptionAr: 'كل فرد يشارك حاجة واحدة قدّرها في يومه، من غير مقارنة أو إجبار على الكلام.',
      descriptionEn: 'Each family member may share one thing they appreciated today, without comparison or pressure to speak.',
      taskAr: 'لحظة امتنان عائلية',
      taskEn: 'A family gratitude moment',
    },
    {
      id: 'family-help',
      titleAr: 'مساعدة متبادلة',
      titleEn: 'Helping one another',
      descriptionAr: 'اختاروا فعل مساعدة بسيطًا يناسب قدرات كل فرد، واحتفلوا بالتعاون مش بالكمال.',
      descriptionEn: 'Choose one helpful action that fits each person’s abilities. Celebrate cooperation, not perfection.',
      taskAr: 'مهمة مساعدة مشتركة للأسرة',
      taskEn: 'A shared family helping task',
    },
  ],
};

export const HomeValuesTrackSection: React.FC<HomeValuesTrackSectionProps> = ({
  language,
  childName,
  ageStage,
  childId,
  onAddRoutineTask,
}) => {
  const isEn = language === 'en';
  const activities = ACTIVITIES_BY_AGE[ageStage] || ACTIVITIES_BY_AGE.all;
  const [faithPath, setFaithPath] = useState<'shared' | 'islam' | 'christian'>('shared');
  const faithActivities = {
    shared: [
      { icon: '💛', titleAr: 'الرحمة والرفق', titleEn: 'Compassion and gentleness', bodyAr: 'احكوا عن موقف احتاج فيه شخص للمساعدة، وفكروا سوا في تصرف رحيم يناسب الموقف.', bodyEn: 'Talk about a moment when someone needed help and think together of a kind response.', taskAr: 'موقف يومي نمارس فيه الرحمة', taskEn: 'A daily act of compassion' },
      { icon: '🤲', titleAr: 'العطاء والمشاركة', titleEn: 'Generosity and sharing', bodyAr: 'اختاروا شيئًا بسيطًا تقدموه لشخص آخر، مع احترام حق الطفل في ممتلكاته وحدوده.', bodyEn: 'Choose a small way to give, while respecting the child’s ownership and boundaries.', taskAr: 'نشاط عطاء ومساعدة مع الأسرة', taskEn: 'A family act of giving' },
      { icon: '🌿', titleAr: 'الصدق والاعتذار والإصلاح', titleEn: 'Honesty, apology and repair', bodyAr: 'علّموا الطفل أن الاعتراف بالخطأ شجاعة، وأن الاعتذار يتبعه إصلاح عملي من غير فضح أو تخويف.', bodyEn: 'Show that admitting a mistake takes courage and that an apology can be followed by practical repair, without shame or fear.', taskAr: 'حوار عائلي عن الصدق وإصلاح الخطأ', taskEn: 'A family conversation about honesty and repair' },
    ],
    islam: [
      { icon: '🕌', titleAr: 'نتعرّف على الصلاة بالقدوة', titleEn: 'Discover prayer through example', bodyAr: 'خلّوا الطفل يشوف استعدادكم للصلاة بهدوء، ويتعرف على السجادة والقبلة وأسماء الحركات. الصغير يشارك بالمشاهدة والتقليد من غير إجبار أو توبيخ.', bodyEn: 'Let the child see your calm preparation for salah and become familiar with the prayer mat, qibla and movements. Younger children can observe and imitate without pressure.', taskAr: 'وقت هادئ نتعرّف فيه على الصلاة', taskEn: 'A calm moment to explore salah' },
      { icon: '💧', titleAr: 'الوضوء خطوة خطوة', titleEn: 'Learn wudu step by step', bodyAr: 'حوّلوا ترتيب الوضوء إلى تعلّم عملي بسيط بإشراف الأهل، مع تسمية الخطوات وشرح النظافة والاستعداد للصلاة. راعوا قدرة الطفل وسلامته قرب الماء.', bodyEn: 'Explore the order of wudu as a simple supervised learning activity, naming each step and explaining preparation for prayer. Keep water play safe and age-appropriate.', taskAr: 'نتعلم خطوات الوضوء معًا', taskEn: 'Learn the steps of wudu together' },
      { icon: '📖', titleAr: 'معاني قصيرة من القرآن', titleEn: 'Small meanings from the Qur’an', bodyAr: 'اختاروا آية قصيرة أو سورة مناسبة، واستمعوا لها معًا ثم اشرحوا معنى واحدًا بلغة الطفل، مثل الرحمة أو الشكر أو الصدق، من غير اختبار للحفظ.', bodyEn: 'Choose a short, age-appropriate passage, listen together and explain one child-friendly meaning such as mercy, gratitude or honesty. Avoid turning memorization into a test.', taskAr: 'لحظة استماع وفهم لمعنى قرآني', taskEn: 'A shared Qur’an listening and meaning moment' },
    ],
    christian: [
      { icon: '🙏', titleAr: 'الصلاة بكلمات الطفل', titleEn: 'Prayer in a child’s own words', bodyAr: 'خصصوا لحظة هادئة يشكر فيها الطفل على شيء ويحكي ما يشغله أو يطلب المساعدة. شاركوه الصلاة بالأسلوب الذي تتبعه أسرتكم وكنيستكم، من غير فرض صيغة واحدة.', bodyEn: 'Create a quiet moment for the child to give thanks, share a concern or ask for help. Pray in the way your family and church tradition practices, without imposing one formula.', taskAr: 'لحظة صلاة عائلية هادئة', taskEn: 'A quiet family prayer moment' },
      { icon: '📖', titleAr: 'حكاية من الإنجيل وقيمة نعيشها', titleEn: 'A Gospel story and a value to live', bodyAr: 'اختاروا حكاية كتابية مناسبة لعمر الطفل، مثل السامري الصالح أو الخروف الضال، ثم اربطوا معناها بفعل رحمة أو مساعدة في الحياة اليومية.', bodyEn: 'Choose an age-appropriate Bible story, such as the Good Samaritan or the Lost Sheep, then connect its meaning to a practical act of kindness.', taskAr: 'حكاية كتابية ونشاط رحمة', taskEn: 'A Bible story and kindness activity' },
      { icon: '🕊️', titleAr: 'نتعلم المحبة والغفران', titleEn: 'Practice love and forgiveness', bodyAr: 'استخدموا موقفًا بسيطًا لتوضيح المحبة والتسامح وطلب الصفح، مع التأكيد أن الغفران لا يعني قبول الأذى أو التنازل عن الأمان والحدود.', bodyEn: 'Use a simple everyday moment to explore love, forgiveness and making amends, while explaining that forgiveness never means accepting harm or giving up safety and boundaries.', taskAr: 'حوار عن المحبة والتسامح والحدود', taskEn: 'A conversation about love, forgiveness and boundaries' },
    ],
  }[faithPath];

  return (
    <section
      data-testid="home-values-track"
      dir={isEn ? 'ltr' : 'rtl'}
      className="space-y-3"
    >
      <div className="rounded-2xl border border-amber-300/35 bg-gradient-to-br from-amber-50/80 to-white p-4 shadow-sm dark:border-amber-900/40 dark:from-[#29251D] dark:to-[#211F1A]">
        <p className="text-xs font-black text-amber-900 dark:text-amber-100">
          {isEn ? `Small everyday values for ${childName}` : `قيم صغيرة نعيشها كل يوم مع ${childName}`}
        </p>
        <p className="mt-1 text-[11px] leading-relaxed text-amber-950/80 dark:text-amber-100/80">
          {isEn
            ? 'Values grow through example, conversation and repeated moments — not lectures or pressure.'
            : 'القيم بتكبر بالقدوة والحوار والمواقف المتكررة، مش بالمواعظ أو الضغط.'}
        </p>
      </div>

      <div data-testid="values-practice-map" className="rounded-2xl border border-amber-300/35 bg-gradient-to-br from-amber-50 via-white to-orange-50/70 p-3.5 dark:from-[#29251D] dark:via-[#211F1A] dark:to-[#2B211B]">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-xs font-black text-amber-950 dark:text-amber-100">{isEn ? 'How values become habits' : 'إزاي القيمة تتحول لعادة؟'}</p>
            <p className="mt-1 text-[10px] text-amber-900/70 dark:text-amber-100/65">{isEn ? 'Children learn values through lived moments, not lectures.' : 'الطفل بيتعلم القيم من المواقف اللي بيعيشها، مش من الكلام بس.'}</p>
          </div>
          <span className="text-2xl">🌱</span>
        </div>
        <div className="mt-3 grid grid-cols-4 gap-1.5">
          {(isEn ? [{e:'👀',t:'See it'},{e:'💬',t:'Talk'},{e:'🤲',t:'Practice'},{e:'✨',t:'Notice'}] : [{e:'👀',t:'يشوفها'},{e:'💬',t:'يفهمها'},{e:'🤲',t:'يمارسها'},{e:'✨',t:'نقدّرها'}]).map((step,index)=>(
            <div key={step.t} className="min-w-0 rounded-xl border border-amber-500/10 bg-white/80 px-1 py-2 text-center dark:border-white/10 dark:bg-white/5">
              <span className="block text-lg">{step.e}</span>
              <span className="mt-1 block text-[9px] font-black text-amber-950 dark:text-amber-100">{step.t}</span>
              <span className="mt-1 block text-[8px] font-bold text-amber-700/65 dark:text-amber-200/55">{index+1}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {activities.map((activity) => (
          <article key={activity.id} className="flex flex-col rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white to-slate-50/80 p-4 shadow-[0_5px_16px_-14px_rgba(15,23,42,0.35)] dark:border-[#29404D] dark:from-[#142430] dark:to-[#101D26]">
            <h4 className="text-xs font-black text-[var(--color-text)] dark:text-white">
              {isEn ? activity.titleEn : activity.titleAr}
            </h4>
            <p className="mt-1.5 text-[11px] leading-relaxed text-[var(--color-muted)] dark:text-[#CBD5E1]">
              {isEn ? activity.descriptionEn : activity.descriptionAr}
            </p>
            <button
              type="button"
              onClick={() => onAddRoutineTask?.(
                isEn ? activity.taskEn : activity.taskAr,
                '07:30 م',
                childId
              )}
              disabled={!onAddRoutineTask}
              className="mt-4 min-h-[46px] w-full rounded-xl bg-amber-700 px-3 py-2.5 text-[11px] font-extrabold text-white shadow-sm transition-all hover:bg-amber-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 active:scale-[.99] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isEn ? 'Add to family routine' : 'أضفها لروتين الأسرة'}
            </button>
          </article>
        ))}
      </div>

      <section data-testid="family-faith-learning" className="overflow-hidden rounded-3xl border border-indigo-200/80 bg-gradient-to-br from-indigo-50 via-white to-rose-50/70 p-3.5 sm:p-4 shadow-sm dark:border-indigo-900/60 dark:from-[#1B2137] dark:via-[#142430] dark:to-[#30202B] space-y-3">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/80 text-2xl shadow-sm dark:bg-white/10">🕊️</span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black tracking-wide text-indigo-700 dark:text-indigo-300">{isEn ? 'FAITH, VALUES & DAILY PRACTICE' : 'الإيمان والقيم والممارسة اليومية'}</p>
            <h3 className="mt-1 text-sm font-black text-[var(--color-text)] dark:text-white">{isEn ? 'A respectful space for every family' : 'مساحة تحترم إيمان كل أسرة'}</h3>
            <p className="mt-1 text-[11px] leading-relaxed text-[var(--color-muted)] dark:text-slate-300">{isEn ? 'Choose the learning path you want to explore. This choice is not saved as a religious identity and can be changed at any time.' : 'اختاروا المسار اللي تحبوا تستكشفوه. الاختيار مش بيتسجل كهوية دينية للأسرة، وتقدروا تغيروه في أي وقت.'}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-1.5 rounded-2xl bg-white/70 p-1 dark:bg-black/15">
          {([{id:'shared',ar:'قيم مشتركة',en:'Shared values',icon:'💛'},{id:'islam',ar:'المسار الإسلامي',en:'Islamic path',icon:'☪️'},{id:'christian',ar:'المسار المسيحي',en:'Christian path',icon:'✝️'}] as const).map((item) => <button key={item.id} type="button" onClick={() => setFaithPath(item.id)} aria-pressed={faithPath === item.id} className={`min-h-[58px] rounded-xl px-1.5 py-2 text-center transition ${faithPath === item.id ? 'bg-indigo-700 text-white shadow-sm' : 'text-[var(--color-text)] hover:bg-indigo-50 dark:text-slate-200 dark:hover:bg-white/10'}`}><span className="block text-base">{item.icon}</span><span className="mt-1 block text-[9px] font-extrabold leading-3">{isEn ? item.en : item.ar}</span></button>)}
        </div>
        <div className="rounded-2xl border border-indigo-100 bg-white/80 p-3 dark:border-indigo-900/60 dark:bg-[#101D26]/75">
          <div className="flex items-center gap-2"><span className="text-lg">{faithPath === 'shared' ? '🌍' : faithPath === 'islam' ? '🕌' : '⛪'}</span><h4 className="text-xs font-black text-[var(--color-text)] dark:text-white">{faithPath === 'shared' ? (isEn ? 'Values that bring us together' : 'قيم إنسانية نعيشها كلنا') : faithPath === 'islam' ? (isEn ? 'Islamic learning with gentleness' : 'تعلّم إسلامي بالقدوة والرفق') : (isEn ? 'Christian learning with gentleness' : 'تعلّم مسيحي بالقدوة والرفق')}</h4></div>
          <p className="mt-1 text-[10px] leading-relaxed text-[var(--color-muted)] dark:text-slate-300">{faithPath === 'shared' ? (isEn ? 'Mercy, honesty, gratitude, generosity, respect and helping others are practiced through everyday family life.' : 'الرحمة والصدق والامتنان والعطاء والاحترام ومساعدة الآخرين قيم بنبنيها بالمواقف اليومية.') : faithPath === 'islam' ? (isEn ? 'Explore prayer, wudu and Qur’an meanings gradually, following your family’s practice and the child’s readiness.' : 'اكتشفوا الصلاة والوضوء ومعاني القرآن بالتدريج، وفق ممارسة الأسرة واستعداد الطفل.') : (isEn ? 'Explore family prayer, Bible stories and Christian values in a way that respects your church tradition.' : 'اكتشفوا الصلاة العائلية وحكايات الكتاب المقدس والقيم المسيحية بما يحترم تقليد أسرتكم وكنيستكم.')}</p>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {faithActivities.map((activity) => <article key={activity.titleAr} className="flex flex-col rounded-2xl border border-indigo-100 bg-white/90 p-3 dark:border-[#304052] dark:bg-[#142430]"><span className="text-xl">{activity.icon}</span><h5 className="mt-1 text-[11px] font-black text-[var(--color-text)] dark:text-white">{isEn ? activity.titleEn : activity.titleAr}</h5><p className="mt-1 flex-1 text-[10px] leading-relaxed text-[var(--color-muted)] dark:text-slate-300">{isEn ? activity.bodyEn : activity.bodyAr}</p><button type="button" disabled={!onAddRoutineTask} onClick={() => onAddRoutineTask?.(isEn ? activity.taskEn : activity.taskAr, '07:30 م', childId)} className="mt-3 min-h-[42px] rounded-xl bg-indigo-700 px-2.5 py-2 text-[10px] font-extrabold text-white transition hover:bg-indigo-800 disabled:opacity-50">{isEn ? 'Add to routine' : 'أضفها للروتين'}</button></article>)}
        </div>
        <p className="text-[9px] leading-relaxed text-indigo-900/70 dark:text-indigo-200/70">{isEn ? 'No child should be shamed, frightened or compared over prayer, belief, memorization or participation. Follow age, ability and family tradition; for detailed religious rulings, consult a trusted faith educator.' : 'ممنوع إحراج الطفل أو تخويفه أو مقارنته بسبب الصلاة أو الإيمان أو الحفظ أو المشاركة. راعوا العمر والقدرة وتقليد الأسرة؛ وللتفاصيل الدينية المتخصصة ارجعوا لمعلّم موثوق في تقليدكم الديني.'}</p>
      </section>

      <div className="rounded-2xl border border-teal-500/20 bg-gradient-to-r from-teal-50/65 to-white p-3.5 shadow-sm dark:from-teal-500/10 dark:to-[#101D26]">
        <p className="text-[11px] leading-relaxed text-[var(--color-text)] dark:text-[#E2E8F0]">
          {isEn
            ? 'Spiritual and religious practices are a family choice. Keep the habits, examples and language aligned with your own beliefs and traditions.'
            : 'العادات الروحية والدينية اختيار الأسرة؛ اختاروا الممارسات والأمثلة واللغة اللي تناسب معتقداتكم وتقاليدكم.'}
        </p>
      </div>
    </section>
  );
};

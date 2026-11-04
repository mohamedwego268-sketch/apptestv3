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
      titleAr: 'نتعلم نتحمل مسؤولية بسيطة',
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
  const [selectedScenario, setSelectedScenario] = useState<number | null>(null);
  const storyLibrary = {
    shared: [
      { icon: '🧸', titleAr: 'اللعبة اللي ضاعت', titleEn: 'The missing toy', storyAr: 'لاحظت ليلى إن صاحبها بيدوّر على لعبته المفضلة. كان ممكن تكمل لعب، لكنها قررت تساعده يدور عليها. وبعد شوية لقوها تحت الكرسي.', storyEn: 'Maya noticed her friend searching for a favorite toy. She paused her game to help, and together they found it under a chair.', questionAr: 'إيه أحسن حاجة نعملها لما حد يكون محتاج مساعدة؟', questionEn: 'What can we do when someone needs help?', choicesAr: ['نتجاهله ونكمل لعب', 'نسأله محتاج إيه ونساعد لو نقدر', 'ناخد لعبته'], choicesEn: ['Ignore them and keep playing', 'Ask what they need and help if we can', 'Take their toy'], correct: 1, lessonAr: 'المساعدة تبدأ بالسؤال، ونحترم كمان لو الشخص مش محتاج مساعدة.', lessonEn: 'Helping starts by asking, while respecting it if someone does not want help.', activityAr: 'ساعدوا شخصًا في مهمة صغيرة اليوم', activityEn: 'Help someone with one small task today' },
      { icon: '🌱', titleAr: 'الاعتذار اللي اتبعه إصلاح', titleEn: 'An apology followed by repair', storyAr: 'أثناء اللعب، وقع كريم برج المكعبات اللي أخته بنته. قال لها إنه آسف، وبعدها سألها إذا كانت تحب يبنوه سوا من جديد.', storyEn: 'During play, Sam knocked over his sister’s block tower. He apologized, then asked if she wanted to rebuild it together.', questionAr: 'إيه اللي يخلي الاعتذار مفيد؟', questionEn: 'What makes an apology meaningful?', choicesAr: ['نقول آسف وخلاص', 'نلوم الشخص التاني', 'نعترف بالغلط ونسأل إزاي نصلحه'], choicesEn: ['Say sorry and stop there', 'Blame the other person', 'Own the mistake and ask how to repair it'], correct: 2, lessonAr: 'الاعتذار الصادق يتبعه إصلاح مناسب، من غير إجبار الطرف الآخر يسامح فورًا.', lessonEn: 'A sincere apology is followed by repair; the other person never has to forgive immediately.', activityAr: 'اختاروا حاجة تصلحوها أو ترتبوها سوا', activityEn: 'Choose something to fix or tidy together' },
    ],
    islam: [
      { icon: '🌙', titleAr: 'الأمانة في الحكاية', titleEn: 'Honesty in a small moment', storyAr: 'وجد طفل شيئًا ليس له في مكان اللعب. تذكّر أن الأمانة تعني أن يحافظ على حق صاحبه، فسأل أحد والديه كيف يعيده لصاحبه.', storyEn: 'A child found something that did not belong to them. Remembering the value of amanah, they asked a parent how to return it to its owner.', questionAr: 'نعمل إيه لما نلاقي حاجة مش بتاعتنا؟', questionEn: 'What should we do when we find something that is not ours?', choicesAr: ['نحتفظ بها', 'نسأل عن صاحبها ونعيدها', 'نخفيها'], choicesEn: ['Keep it', 'Ask who owns it and return it', 'Hide it'], correct: 1, lessonAr: 'الأمانة تظهر في التصرفات الصغيرة، ونتعلمها بالقدوة والتطبيق.', lessonEn: 'Trustworthiness appears in small actions and grows through example and practice.', activityAr: 'أعيدوا شيئًا لمكانه أو لصاحبه معًا', activityEn: 'Return something to its place or owner together' },
      { icon: '🤲', titleAr: 'رحمة في موقف يومي', titleEn: 'Mercy in an everyday moment', storyAr: 'رأى طفل زميله حزينًا لأنه لم يستطع إكمال الرسم. جلس بجانبه وعرض أن يساعده، من غير سخرية أو استعجال.', storyEn: 'A child saw a classmate upset about a drawing. They sat beside them and offered help without teasing or rushing.', questionAr: 'إزاي نكون رحماء في موقف يومي؟', questionEn: 'How can we turn mercy into an action?', choicesAr: ['نضحك على المحاولة', 'نسمع له ونعرض المساعدة بلطف', 'نقرر بدلًا منه'], choicesEn: ['Laugh at the attempt', 'Listen and gently offer help', 'Decide for them'], correct: 1, lessonAr: 'الرفق يبدأ بالاستماع، والمساعدة تكون باحترام اختيار الآخر.', lessonEn: 'Gentleness begins with listening and respects the other person’s choice.', activityAr: 'اختاروا عمل رحمة بسيطًا اليوم', activityEn: 'Choose one small act of kindness today' },
    ],
    christian: [
      { icon: '🫶', titleAr: 'السامري الصالح: مين احتاج مساعدة؟', titleEn: 'The Good Samaritan: who needed help?', storyAr: 'في حكاية السامري الصالح، مرّ أشخاص بجوار رجل محتاج، ثم توقف شخص ليساعده ويعتني به. احكوا القصة من مصدر الأسرة الكتابي الموثوق وبكلمات تناسب عمر الطفل.', storyEn: 'In the Good Samaritan story, several people passed a person in need before someone stopped to care for him. Read the story from your family’s trusted Bible source in age-appropriate words.', questionAr: 'إيه التصرف اللي عبّر عن المحبة في الحكاية؟', questionEn: 'Which action showed love in the story?', choicesAr: ['المرور من غير اهتمام', 'التوقف وتقديم المساعدة', 'لوم الشخص المحتاج'], choicesEn: ['Walking past without care', 'Stopping to offer help', 'Blaming the person in need'], correct: 1, lessonAr: 'المحبة تظهر في الرحمة والعمل، مع مراعاة الأمان وطلب مساعدة الكبار عند الحاجة.', lessonEn: 'Love is shown through compassion and action, while staying safe and asking adults for help when needed.', activityAr: 'اعملوا فعل مساعدة آمنًا معًا', activityEn: 'Do one safe act of help together' },
      { icon: '🐑', titleAr: 'الخروف الضال: الاهتمام بكل شخص', titleEn: 'The Lost Sheep: everyone matters', storyAr: 'تحكي قصة الخروف الضال عن راعٍ اهتم بالبحث عن خروفه. ناقشوا مع الطفل معنى الاهتمام وعدم الاستهانة بأحد، من خلال رواية تناسب تقليد الأسرة.', storyEn: 'The Lost Sheep tells of a shepherd who cared enough to look for one missing sheep. Explore care and the worth of each person through your family’s tradition.', questionAr: 'إيه اللي نتعلمه عن الاهتمام بالآخرين؟', questionEn: 'What can we learn about caring for others?', choicesAr: ['كل شخص مهم ويستحق الاهتمام', 'نهتم بالأقوى فقط', 'نتجاهل اللي محتاجنا'], choicesEn: ['Every person matters and deserves care', 'Only the strongest matter', 'Ignore those who need us'], correct: 0, lessonAr: 'كل إنسان له قيمة، والاهتمام يكون بمحبة ومن غير تعريض الطفل للخطر.', lessonEn: 'Every person has worth; care should be loving and safe.', activityAr: 'اطمئنوا على شخص من الأسرة أو الأصدقاء', activityEn: 'Check in on a family member or friend' },
    ],
  }[faithPath];
  const scenarios = isEn ? [
    { prompt: 'A friend is left out of a game. What could you do?', options: ['Invite them if they want to join', 'Laugh at them', 'Force them to play'], answer: 0, feedback: 'A kind invitation respects their choice.' },
    { prompt: 'You accidentally break something. What is a helpful next step?', options: ['Hide it', 'Tell a trusted adult and help make it right', 'Blame someone else'], answer: 1, feedback: 'Honesty and repair help rebuild trust.' },
    { prompt: 'You feel angry because someone took your turn. What can you try?', options: ['Hit them', 'Name your feeling and ask for a fair turn', 'Break the game'], answer: 1, feedback: 'You can express anger safely and ask for fairness.' },
  ] : [
    { prompt: 'صاحبك قاعد لوحده ومش مشارك في اللعبة.. تعمل إيه؟', options: ['تعزمه يشارك لو حابب', 'تضحك عليه', 'تجبره يلعب'], answer: 0, feedback: 'الدعوة اللطيفة بتحترم اختياره.' },
    { prompt: 'كسرت حاجة بالغلط.. إيه الخطوة المفيدة؟', options: ['تخبيها', 'تقول لشخص كبير موثوق وتساعد في الإصلاح', 'تلوم حد تاني'], answer: 1, feedback: 'الصدق والإصلاح بيساعدوا الثقة ترجع.' },
    { prompt: 'حد أخد دورك وحسيت بالغضب.. تجرب إيه؟', options: ['تضربه', 'تعبّر عن إحساسك وتطلب دور عادل', 'تبوظ اللعبة'], answer: 1, feedback: 'ممكن نعبّر عن الغضب بأمان ونطلب العدل.' },
  ];
  const faithActivities = {
    shared: [
      { icon: '💛', titleAr: 'الرحمة والرفق', titleEn: 'Compassion and gentleness', bodyAr: 'احكوا عن موقف احتاج فيه شخص للمساعدة، وفكروا سوا في تصرف رحيم يناسب الموقف.', bodyEn: 'Talk about a moment when someone needed help and think together of a kind response.', taskAr: 'موقف يومي نمارس فيه الرحمة', taskEn: 'A daily act of compassion' },
      { icon: '🤲', titleAr: 'العطاء والمشاركة', titleEn: 'Generosity and sharing', bodyAr: 'اختاروا شيئًا بسيطًا تقدموه لشخص آخر، مع احترام حق الطفل في ممتلكاته وحدوده.', bodyEn: 'Choose a small way to give, while respecting the child’s ownership and boundaries.', taskAr: 'نشاط عطاء ومساعدة مع الأسرة', taskEn: 'A family act of giving' },
      { icon: '🌿', titleAr: 'الصدق والاعتذار والإصلاح', titleEn: 'Honesty, apology and repair', bodyAr: 'علّموا الطفل أن الاعتراف بالخطأ شجاعة، وأن الاعتذار يتبعه إصلاح عملي من غير فضح أو تخويف.', bodyEn: 'Show that admitting a mistake takes courage and that an apology can be followed by practical repair, without shame or fear.', taskAr: 'حوار عائلي عن الصدق وإصلاح الخطأ', taskEn: 'A family conversation about honesty and repair' },
      { icon: '🌍', titleAr: 'احترام اختلاف الناس', titleEn: 'Respecting differences', bodyAr: 'علّموا الطفل أن الناس قد تختلف في معتقداتها وطرق عبادتها، وأن الاحترام واللطف حق للجميع من غير سخرية أو تقليل.', bodyEn: 'Teach that people may have different beliefs and ways of worship, and everyone deserves respect and kindness without ridicule.', taskAr: 'حوار بسيط عن احترام اختلاف الآخرين', taskEn: 'A simple conversation about respecting differences' },
    ],
    islam: [
      { icon: '🕌', titleAr: 'نتعرّف على الصلاة بالقدوة', titleEn: 'Discover prayer through example', bodyAr: 'خلّوا الطفل يشوفكم وأنتم بتستعدوا للصلاة بهدوء، وعرّفوه على السجادة والقبلة والحركات. ممكن يتفرج أو يقلد لو حابب، من غير إجبار أو زعل.', bodyEn: 'Let the child see your calm preparation for salah and become familiar with the prayer mat, qibla and movements. Younger children can observe and imitate without pressure.', taskAr: 'وقت هادئ نتعرّف فيه على الصلاة', taskEn: 'A calm moment to explore salah' },
      { icon: '💧', titleAr: 'الوضوء خطوة خطوة', titleEn: 'Learn wudu step by step', bodyAr: 'حوّلوا ترتيب الوضوء إلى تعلّم عملي بسيط بإشراف الأهل، مع تسمية الخطوات وشرح النظافة والاستعداد للصلاة. راعوا قدرة الطفل وسلامته قرب الماء.', bodyEn: 'Explore the order of wudu as a simple supervised learning activity, naming each step and explaining preparation for prayer. Keep water play safe and age-appropriate.', taskAr: 'نتعلم خطوات الوضوء معًا', taskEn: 'Learn the steps of wudu together' },
      { icon: '📖', titleAr: 'معاني قصيرة من القرآن', titleEn: 'Small meanings from the Qur’an', bodyAr: 'اختاروا آية قصيرة أو سورة مناسبة، واستمعوا لها معًا ثم اشرحوا معنى واحدًا بلغة الطفل، مثل الرحمة أو الشكر أو الصدق، من غير اختبار للحفظ.', bodyEn: 'Choose a short, age-appropriate passage, listen together and explain one child-friendly meaning such as mercy, gratitude or honesty. Avoid turning memorization into a test.', taskAr: 'لحظة استماع وفهم لمعنى قرآني', taskEn: 'A shared Qur’an listening and meaning moment' },
    ],
    christian: [
      { icon: '🙏', titleAr: 'الصلاة بكلمات الطفل', titleEn: 'Prayer in a child’s own words', bodyAr: 'خصصوا لحظة هادئة يشكر فيها الطفل على شيء ويحكي ما يشغله أو يطلب المساعدة. شاركوه الصلاة بالأسلوب الذي تتبعه أسرتكم وكنيستكم، من غير فرض صيغة واحدة.', bodyEn: 'Create a quiet moment for the child to give thanks, share a concern or ask for help. Pray in the way your family and church tradition practices, without imposing one formula.', taskAr: 'لحظة صلاة عائلية هادئة', taskEn: 'A quiet family prayer moment' },
      { icon: '📖', titleAr: 'حكاية من الإنجيل وقيمة نعيشها', titleEn: 'A Gospel story and a value to live', bodyAr: 'اختاروا حكاية كتابية مناسبة لعمر الطفل، مثل السامري الصالح أو الخروف الضال، ثم اربطوا معناها بفعل رحمة أو مساعدة في الحياة اليومية.', bodyEn: 'Choose an age-appropriate Bible story, such as the Good Samaritan or the Lost Sheep, then connect its meaning to a practical act of kindness.', taskAr: 'حكاية كتابية ونشاط رحمة', taskEn: 'A Bible story and kindness activity' },
      { icon: '🕊️', titleAr: 'نتعلم المحبة والغفران', titleEn: 'Practice love and forgiveness', bodyAr: 'استخدموا موقفًا بسيطًا لتوضيح المحبة والتسامح وطلب الصفح، مع التأكيد أن الغفران لا يعني قبول الأذى أو التنازل عن الأمان والحدود.', bodyEn: 'Use a simple everyday moment to explore love, forgiveness and making amends, while explaining that forgiveness never means accepting harm or giving up safety and boundaries.', taskAr: 'نتكلم عن المحبة والتسامح وحماية نفسنا', taskEn: 'A conversation about love, forgiveness and boundaries' },
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
            <p className="text-xs font-black text-amber-950 dark:text-amber-100">{isEn ? 'How values become habits' : 'إزاي نخلي التصرف الحلو عادة؟'}</p>
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
            <p className="text-[10px] font-black tracking-wide text-indigo-700 dark:text-indigo-300">{isEn ? 'FAITH, VALUES & DAILY PRACTICE' : 'الإيمان والعادات الحلوة كل يوم'}</p>
            <h3 className="mt-1 text-sm font-black text-[var(--color-text)] dark:text-white">{isEn ? 'A respectful space for every family' : 'مساحة تحترم إيمان كل أسرة'}</h3>
            <p className="mt-1 text-[11px] leading-relaxed text-[var(--color-muted)] dark:text-slate-300">{isEn ? 'Choose the learning path you want to explore. This choice is not saved as a religious identity and can be changed at any time.' : 'اختاروا المسار اللي تحبوا تستكشفوه. الاختيار مش بيتسجل كهوية دينية للأسرة، وتقدروا تغيروه في أي وقت.'}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-1.5 rounded-2xl bg-white/70 p-1 dark:bg-black/15">
          {([{id:'shared',ar:'قيم مشتركة',en:'Shared values',icon:'💛'},{id:'islam',ar:'المسار الإسلامي',en:'Islamic path',icon:'☪️'},{id:'christian',ar:'المسار المسيحي',en:'Christian path',icon:'✝️'}] as const).map((item) => <button key={item.id} type="button" onClick={() => { setFaithPath(item.id); setSelectedScenario(null); }} aria-pressed={faithPath === item.id} className={`min-h-[58px] rounded-xl px-1.5 py-2 text-center transition ${faithPath === item.id ? 'bg-indigo-700 text-white shadow-sm' : 'text-[var(--color-text)] hover:bg-indigo-50 dark:text-slate-200 dark:hover:bg-white/10'}`}><span className="block text-base">{item.icon}</span><span className="mt-1 block text-[9px] font-extrabold leading-3">{isEn ? item.en : item.ar}</span></button>)}
        </div>
        <div className="rounded-xl border border-indigo-100/80 bg-indigo-50/70 px-3 py-2.5 dark:border-indigo-900/50 dark:bg-indigo-950/25"><p className="text-[10px] font-black text-indigo-800 dark:text-indigo-200">{isEn ? 'A gentle guide for this age' : 'طريقة مناسبة للمرحلة العمرية'}</p><p className="mt-1 text-[10px] leading-relaxed text-indigo-950/80 dark:text-indigo-100/80">{ageStage === '0-2' ? (isEn ? '0–2 years: let the child observe loving family rituals, hear calm words and join only through safe, simple imitation.' : 'من ٠ إلى سنتين: الطفل يلاحظ طقوس الأسرة بمحبة، ويسمع الكلمات الهادئة، ويشارك فقط بتقليد بسيط وآمن.') : ageStage === '2-5' ? (isEn ? '2–5 years: use short stories, playful demonstrations and tiny shared moments. Keep instructions simple and never turn practice into a test.' : 'من سنتين إلى ٥ سنوات: استخدموا الحكايات القصيرة والتوضيح باللعب واللحظات المشتركة. خلي التعليمات بسيطة ومن غير تحويل الممارسة لاختبار.') : ageStage === '5-8' ? (isEn ? '5–8 years: explain the meaning behind each practice, invite questions and let the child take small steps with patient guidance.' : 'من ٥ إلى ٨ سنوات: اشرحوا معنى كل ممارسة، وافتحوا باب الأسئلة، وسيبوا الطفل يتقدم بخطوات صغيرة مع التوجيه والصبر.') : (isEn ? 'Adapt every activity to the child’s age, ability, questions and family tradition.' : 'كيّفوا كل نشاط حسب عمر الطفل وقدرته وأسئلته وتقليد الأسرة.')}</p></div>
        {faithPath !== 'shared' && <div className="rounded-2xl border border-indigo-100 bg-white/85 p-3 dark:border-indigo-900/60 dark:bg-[#101D26]/80"><div className="flex items-center justify-between gap-2"><h4 className="text-xs font-black text-[var(--color-text)] dark:text-white">{faithPath === 'islam' ? (isEn ? 'A gentle introduction to salah' : 'نتعلم الصلاة واحدة واحدة') : (isEn ? 'A simple family prayer rhythm' : 'ترتيب بسيط للصلاة العائلية')}</h4><span className="text-lg">{faithPath === 'islam' ? '🕌' : '🙏'}</span></div><div className="mt-2 flex gap-2 overflow-x-auto pb-1 snap-x">{(faithPath === 'islam' ? (isEn ? [{e:'💧',t:'Prepare',d:'Wudu, a clean place and facing the qibla.'},{e:'🧍',t:'Stand & begin',d:'Learn the opening takbir with a parent.'},{e:'📖',t:'Recite',d:'Hear Al-Fatiha and a short surah gradually.'},{e:'🤲',t:'Bow & prostrate',d:'Imitate the movements gently and safely.'},{e:'🌙',t:'Finish',d:'Learn sitting and salam as part of the sequence.'}] : [{e:'💧',t:'الاستعداد',d:'الوضوء والمكان النظيف واستقبال القبلة.'},{e:'🧍',t:'القيام والبداية',d:'التعرّف على تكبيرة الإحرام مع أحد الوالدين.'},{e:'📖',t:'القراءة',d:'سماع الفاتحة وسورة قصيرة بالتدريج.'},{e:'🤲',t:'الركوع والسجود',d:'تقليد الحركات برفق وبطريقة آمنة.'},{e:'🌙',t:'الختام',d:'التعرّف على الجلوس والتسليم ضمن ترتيب الصلاة.'}]) : (isEn ? [{e:'🕯️',t:'Be still',d:'Find a calm moment and settle together.'},{e:'💛',t:'Give thanks',d:'Name one thing the child is grateful for.'},{e:'💬',t:'Share',d:'Talk about a hope, worry or someone to remember.'},{e:'📖',t:'Pray together',d:'Use a family prayer or the Lord’s Prayer if it belongs to your tradition.'},{e:'🕊️',t:'Close',d:'Finish in the familiar way your family practices.'}] : [{e:'🕯️',t:'نهدأ سوا',d:'نختار لحظة هادئة ونستعد للصلاة.'},{e:'💛',t:'نشكر',d:'كل واحد يذكر نعمة أو حاجة ممتن لها.'},{e:'💬',t:'نشارك',d:'نحكي طلب أو قلق أو شخص نحب نفتكره في الصلاة.'},{e:'📖',t:'نصلي معًا',d:'نستخدم صلاة الأسرة أو الصلاة الربانية إذا كانت ضمن تقليدكم.'},{e:'🕊️',t:'نختم',d:'نختم بالطريقة المعتادة في الأسرة والكنيسة.'}])).map((step,index) => <article key={step.t} className="min-w-[132px] max-w-[155px] flex-1 snap-start rounded-xl border border-indigo-100 bg-indigo-50/65 p-2.5 dark:border-indigo-900/50 dark:bg-indigo-950/20"><span className="text-lg">{step.e}</span><p className="mt-1 text-[10px] font-black text-[var(--color-text)] dark:text-white">{index+1}. {step.t}</p><p className="mt-1 text-[9px] leading-relaxed text-[var(--color-muted)] dark:text-slate-300">{step.d}</p></article>)}</div><p className="mt-2 text-[9px] leading-relaxed text-[var(--color-muted)] dark:text-slate-400">{faithPath === 'islam' ? (isEn ? 'This is a child-friendly learning sequence, not a complete jurisprudential guide. Follow your family’s trusted teaching tradition.' : 'ده تسلسل تعليمي مبسّط للأطفال، مش دليل فقهي كامل. اتبعوا طريقة التعليم الموثوقة في أسرتكم.') : (isEn ? 'Christian prayer forms differ across churches and families; adapt the examples to your own tradition.' : 'طريقة الصلاة بتختلف بين الكنائس والأسر؛ اختاروا اللي يناسب أسرتكم وكنيستكم.')}</p></div>}
        <div className="rounded-2xl border border-indigo-100 bg-white/80 p-3 dark:border-indigo-900/60 dark:bg-[#101D26]/75">
          <div className="flex items-center gap-2"><span className="text-lg">{faithPath === 'shared' ? '🌍' : faithPath === 'islam' ? '🕌' : '⛪'}</span><h4 className="text-xs font-black text-[var(--color-text)] dark:text-white">{faithPath === 'shared' ? (isEn ? 'Values that bring us together' : 'قيم إنسانية نعيشها كلنا') : faithPath === 'islam' ? (isEn ? 'Islamic learning with gentleness' : 'نتعلم من ديننا الإسلامي بالقدوة والرفق') : (isEn ? 'Christian learning with gentleness' : 'نتعلم من ديننا المسيحي بالقدوة والرفق')}</h4></div>
          <p className="mt-1 text-[10px] leading-relaxed text-[var(--color-muted)] dark:text-slate-300">{faithPath === 'shared' ? (isEn ? 'Mercy, honesty, gratitude, generosity, respect and helping others are practiced through everyday family life.' : 'الرحمة والصدق والامتنان والعطاء والاحترام ومساعدة الآخرين قيم بنبنيها بالمواقف اليومية.') : faithPath === 'islam' ? (isEn ? 'Explore prayer, wudu and Qur’an meanings gradually, following your family’s practice and the child’s readiness.' : 'اكتشفوا الصلاة والوضوء ومعاني القرآن بالتدريج، وفق ممارسة الأسرة واستعداد الطفل.') : (isEn ? 'Explore family prayer, Bible stories and Christian values in a way that respects your church tradition.' : 'اكتشفوا الصلاة العائلية وحكايات الكتاب المقدس والقيم المسيحية بما يحترم تقليد أسرتكم وكنيستكم.')}</p>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {faithActivities.map((activity) => <article key={activity.titleAr} className="flex flex-col rounded-2xl border border-indigo-100 bg-white/90 p-3 dark:border-[#304052] dark:bg-[#142430]"><span className="text-xl">{activity.icon}</span><h5 className="mt-1 text-[11px] font-black text-[var(--color-text)] dark:text-white">{isEn ? activity.titleEn : activity.titleAr}</h5><p className="mt-1 flex-1 text-[10px] leading-relaxed text-[var(--color-muted)] dark:text-slate-300">{isEn ? activity.bodyEn : activity.bodyAr}</p><button type="button" disabled={!onAddRoutineTask} onClick={() => onAddRoutineTask?.(isEn ? activity.taskEn : activity.taskAr, '07:30 م', childId)} className="mt-3 min-h-[42px] rounded-xl bg-indigo-700 px-2.5 py-2 text-[10px] font-extrabold text-white transition hover:bg-indigo-800 disabled:opacity-50">{isEn ? 'Add to routine' : 'أضفها للروتين'}</button></article>)}
        </div>
        <p className="text-[9px] leading-relaxed text-indigo-900/70 dark:text-indigo-200/70">{isEn ? 'No child should be shamed, frightened or compared over prayer, belief, memorization or participation. Follow age, ability and family tradition; for detailed religious rulings, consult a trusted faith educator.' : 'ممنوع إحراج الطفل أو تخويفه أو مقارنته بسبب الصلاة أو الإيمان أو الحفظ أو المشاركة. راعوا العمر والقدرة وتقليد الأسرة؛ وللتفاصيل الدينية المتخصصة ارجعوا لمعلّم موثوق في تقليدكم الديني.'}</p>
      </section>

      <section data-testid="family-story-play-library" className="space-y-3 overflow-hidden rounded-3xl border border-fuchsia-200/80 bg-gradient-to-br from-fuchsia-50 via-white to-sky-50/70 p-3.5 shadow-sm dark:border-fuchsia-900/50 dark:from-[#251D32] dark:via-[#142430] dark:to-[#142B35] sm:p-4">
        <div className="flex items-start justify-between gap-2">
          <div><p className="text-[10px] font-black tracking-wide text-fuchsia-700 dark:text-fuchsia-300">{isEn ? 'STORIES • TALK • TRY TOGETHER' : 'حكاية • حوار • تجربة سوا'}</p><h3 className="mt-1 text-sm font-black text-[var(--color-text)] dark:text-white">{isEn ? 'A little story, a real-life moment' : 'حكاية صغيرة.. وأثر نعيشه'}</h3><p className="mt-1 text-[10px] leading-relaxed text-[var(--color-muted)]">{isEn ? 'Read, pause for the question, then choose one small activity together.' : 'اقروا الحكاية بصوت هادي، وقفوا عند السؤال، وبعدها اختاروا نشاط صغير تنفذوه سوا.'}</p><p className="mt-2 rounded-xl bg-fuchsia-100/70 px-2.5 py-2 text-[9px] font-bold leading-relaxed text-fuchsia-950 dark:bg-fuchsia-950/30 dark:text-fuchsia-100">{ageStage === '0-2' ? (isEn ? 'For ages 0–2: keep it to pictures, warm voice, gestures and safe imitation. No questions or choices are expected.' : 'من ٠–٢ سنة: اكتفوا بالصور والصوت الهادي والإشارات والتقليد الآمن؛ مش مطلوب من الطفل يجاوب أو يختار.') : ageStage === '2-5' ? (isEn ? 'For ages 2–5: read the choices aloud, let the child point or answer freely, and accept more than one thoughtful response.' : 'من ٢–٥ سنوات: اقرأوا الاختيارات بصوت واضح، وسيبوا الطفل يشاور أو يجاوب بطريقته، واقبلوا التفكير المختلف.') : (isEn ? 'For ages 5–8: invite the child to explain why, imagine another ending and suggest a real-life action.' : 'من ٥–٨ سنوات: اسألوا الطفل ليه اختار الإجابة، وتخيلوا نهاية تانية، واقترحوا تصرفًا حقيقيًا يطبقه.')}</p></div>
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white text-2xl shadow-sm dark:bg-white/10">📚</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {storyLibrary.map((story,index) => <article key={story.titleAr} className="flex min-w-0 flex-col rounded-2xl border border-fuchsia-100 bg-white/90 p-3 dark:border-fuchsia-900/60 dark:bg-[#172536]">
            <span className="text-2xl">{story.icon}</span><h4 className="mt-1 text-[11px] font-black leading-5 text-[var(--color-text)] dark:text-white">{isEn ? story.titleEn : story.titleAr}</h4>
            <p className="mt-1 flex-1 text-[10px] leading-relaxed text-[var(--color-muted)]">{isEn ? story.storyEn : story.storyAr}</p>
            {ageStage !== '0-2' && <div className="mt-2 rounded-xl bg-fuchsia-50/80 p-2 dark:bg-fuchsia-950/25"><p className="text-[10px] font-black text-fuchsia-900 dark:text-fuchsia-200">{isEn ? story.questionEn : story.questionAr}</p><div className="mt-1.5 space-y-1">{(isEn ? story.choicesEn : story.choicesAr).map((choice,choiceIndex) => <button key={choice} type="button" onClick={() => setSelectedScenario(index * 10 + choiceIndex)} aria-pressed={selectedScenario === index * 10 + choiceIndex} className={`min-h-9 w-full rounded-lg border px-2 py-1.5 text-start text-[9px] font-bold transition ${selectedScenario === index * 10 + choiceIndex ? 'border-fuchsia-500 bg-fuchsia-100 text-fuchsia-950 dark:bg-fuchsia-900/40 dark:text-white' : 'border-transparent bg-white/80 text-[var(--color-text)] dark:bg-white/5 dark:text-slate-200'}`}>{choice}</button>)}</div>
              {selectedScenario !== null && Math.floor(selectedScenario / 10) === index && <p role="status" className="mt-2 text-[9px] font-bold leading-relaxed text-emerald-800 dark:text-emerald-200">{selectedScenario % 10 === story.correct ? (isEn ? 'Good thinking! ' : 'اختيار جميل! ') : (isEn ? 'Let’s think again. ' : 'تعالوا نفكر تاني. ')}{isEn ? story.lessonEn : story.lessonAr}</p>}
            </div>}
            <button type="button" disabled={!onAddRoutineTask} onClick={() => onAddRoutineTask?.(isEn ? story.activityEn : story.activityAr,'07:30 م',childId)} className="mt-2 min-h-10 rounded-xl bg-fuchsia-700 px-2 py-2 text-[9px] font-extrabold text-white transition hover:bg-fuchsia-800 disabled:opacity-50">{isEn ? 'Add activity to routine' : 'أضف النشاط للروتين'}</button>
          </article>)}
        </div>
        {ageStage !== '0-2' && <div className="rounded-2xl border border-sky-200/80 bg-white/85 p-3 dark:border-sky-900/60 dark:bg-[#101D26]/80">
          <div className="flex items-center justify-between gap-2"><div><p className="text-[10px] font-black text-sky-800 dark:text-sky-200">{isEn ? 'FAMILY MINI GAME' : 'لعبة المواقف العائلية'}</p><h4 className="mt-1 text-xs font-black text-[var(--color-text)] dark:text-white">{isEn ? 'What would you do?' : 'لو حصل الموقف ده.. هتتصرف إزاي؟'}</h4></div><span className="text-2xl">🎯</span></div>
          {scenarios.map((scenario,index) => <div key={scenario.prompt} className="mt-2 rounded-xl bg-sky-50/80 p-2.5 dark:bg-sky-950/20"><p className="text-[10px] font-extrabold leading-relaxed text-sky-950 dark:text-sky-100">{index+1}. {scenario.prompt}</p><div className="mt-2 grid grid-cols-1 gap-1.5">{scenario.options.map((option,optionIndex) => <button key={option} type="button" onClick={() => setSelectedScenario(100 + index * 10 + optionIndex)} aria-pressed={selectedScenario === 100 + index * 10 + optionIndex} className={`min-h-9 rounded-lg border px-2 py-1.5 text-start text-[9px] font-bold ${selectedScenario === 100 + index * 10 + optionIndex ? 'border-sky-500 bg-sky-100 text-sky-950 dark:bg-sky-900/40 dark:text-white' : 'border-sky-100 bg-white/80 text-[var(--color-text)] dark:border-sky-900/50 dark:bg-white/5 dark:text-slate-200'}`}>{option}</button>)}</div>{selectedScenario !== null && Math.floor((selectedScenario - 100) / 10) === index && selectedScenario >= 100 && <p role="status" className="mt-2 text-[9px] font-bold text-emerald-800 dark:text-emerald-200">{selectedScenario % 10 === scenario.answer ? (isEn ? 'That’s a thoughtful choice. ' : 'ده اختيار فيه تفكير جميل. ') : (isEn ? 'Try another response. ' : 'جربوا اختيار تاني. ')}{scenario.feedback}</p>}</div>)}
        </div>}
        <p className="text-[9px] leading-relaxed text-[var(--color-muted)]">{isEn ? 'Stories are original child-friendly retellings or brief prompts. For faith-specific stories, read the full source from a trusted family religious resource.' : 'الحكايات هنا صياغات تربوية مبسطة للأطفال. في القصص الدينية، ارجعوا للنص الكامل من مصدر موثوق يناسب تقليد الأسرة.'}</p>
      </section>

      <div className="rounded-2xl border border-teal-500/20 bg-gradient-to-r from-teal-50/65 to-white p-3.5 shadow-sm dark:from-teal-500/10 dark:to-[#101D26]">
        <p className="text-[11px] leading-relaxed text-[var(--color-text)] dark:text-[#E2E8F0]">
          {isEn
            ? 'Spiritual and religious practices are a family choice. Keep the habits, examples and language aligned with your own beliefs and traditions.'
            : 'الأسرة هي اللي تختار طريقة تعليم الدين والعادات المناسبة لها، وبالأسلوب اللي الطفل يفهمه ويرتاح له.'}
        </p>
      </div>
    </section>
  );
};

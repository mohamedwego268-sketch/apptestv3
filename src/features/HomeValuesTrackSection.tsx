import React from 'react';
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

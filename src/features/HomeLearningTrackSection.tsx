import React from 'react';
import { BookOpen, Lightbulb, Puzzle, type LucideIcon } from 'lucide-react';
import type { PageId } from '../context/FamilyAppContext';
import type { AgeStage, LanguageCode } from '../domain/familySpaceCore';

interface HomeLearningTrackSectionProps {
  language: LanguageCode;
  childName: string;
  ageStage: AgeStage;
  childId: number | null;
  onNavigate: (pageId: PageId) => void;
  onAddRoutineTask?: (taskName: string, time: string, kidId: number | null) => void;
}

interface LearningActivity {
  id: string;
  icon: LucideIcon;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  taskAr: string;
  taskEn: string;
}

const LEARNING_BY_AGE: Record<AgeStage, LearningActivity[]> = {
  '0-2': [
    {
      id: 'shared-picture-book',
      icon: BookOpen,
      titleAr: 'اكتشفوا الصور سوا',
      titleEn: 'Explore pictures together',
      descriptionAr: 'اختاروا كتاب صور بسيط، سمّوا شيئًا واحدًا في كل صفحة، واستنوا استجابة الطفل من غير استعجال.',
      descriptionEn: 'Choose a simple picture book, name one thing on each page and pause for your child to respond.',
      taskAr: 'خمس دقائق لكتاب صور وتسمية الأشياء',
      taskEn: 'Five minutes of picture-book discovery',
    },
    {
      id: 'sound-turn-taking',
      icon: Lightbulb,
      titleAr: 'دورك ودوري في الأصوات',
      titleEn: 'Take turns with sounds',
      descriptionAr: 'قلّدوا صوتًا أو كلمة يصدرها الطفل، ثم اتركوا له فرصة يرد. التفاعل أهم من عدد الكلمات.',
      descriptionEn: 'Repeat a sound or word your child makes, then pause for their turn. Connection matters more than counting words.',
      taskAr: 'وقت تواصل بالأصوات والكلمات',
      taskEn: 'A short sound-and-word connection moment',
    },
  ],
  '2-5': [
    {
      id: 'story-sequence',
      icon: BookOpen,
      titleAr: 'احكوا الحكاية بالترتيب',
      titleEn: 'Put a story in order',
      descriptionAr: 'اختاروا ثلاث صور من قصة، واسألوا: إيه اللي حصل الأول؟ وبعدين؟ وسيبوا الطفل يحكي بطريقته.',
      descriptionEn: 'Choose three pictures from a story and ask what happened first and next. Let your child tell it their way.',
      taskAr: 'نشاط ترتيب صور وحكاية',
      taskEn: 'A picture-sequencing story activity',
    },
    {
      id: 'sorting-game',
      icon: Puzzle,
      titleAr: 'لعبة التصنيف والاكتشاف',
      titleEn: 'Sort, compare and discover',
      descriptionAr: 'استخدموا أشياء آمنة ومتاحة لتجميعها حسب اللون أو الشكل أو الحجم، واسألوا الطفل عن سبب اختياره.',
      descriptionEn: 'Use safe everyday objects to sort by color, shape or size, and ask your child why they chose each group.',
      taskAr: 'لعبة تصنيف واكتشاف لمدة ١٠ دقائق',
      taskEn: 'A 10-minute sorting and discovery game',
    },
  ],
  '5-8': [
    {
      id: 'curiosity-question',
      icon: Lightbulb,
      titleAr: 'سؤال فضول كل يوم',
      titleEn: 'One curiosity question',
      descriptionAr: 'اختاروا سؤالًا من الحياة اليومية، وابحثوا عن إجابته معًا من كتاب أو تجربة منزلية آمنة.',
      descriptionEn: 'Choose an everyday question and explore it together through a book or a safe home activity.',
      taskAr: 'وقت سؤال واكتشاف مشترك',
      taskEn: 'A shared question-and-discovery moment',
    },
    {
      id: 'small-problem',
      icon: Puzzle,
      titleAr: 'حل مشكلة صغيرة',
      titleEn: 'Solve a small problem',
      descriptionAr: 'قدّموا لغزًا أو مهمة تركيب مناسبة، واسألوا: إيه أول خطوة ممكن نجربها؟ شجّعوا المحاولة وتغيير الخطة.',
      descriptionEn: 'Offer an age-appropriate puzzle or building task. Ask what first step to try and encourage adapting the plan.',
      taskAr: 'لغز أو تحدي تفكير قصير',
      taskEn: 'A short puzzle or problem-solving challenge',
    },
  ],
  all: [
    {
      id: 'follow-interest',
      icon: Lightbulb,
      titleAr: 'ابدأوا من اهتمام الطفل',
      titleEn: 'Start with your child’s interest',
      descriptionAr: 'اسألوا الطفل يحب يكتشف إيه النهارده، وشاركوه نشاطًا بسيطًا يقوده هو. لو العمر غير مسجل، اختاروا ما يناسب قدرته الحالية.',
      descriptionEn: 'Ask what your child would like to explore today and follow their lead. If age is unknown, choose an activity that fits their current abilities.',
      taskAr: 'نشاط اكتشاف يختاره الطفل',
      taskEn: 'A child-chosen discovery activity',
    },
    {
      id: 'shared-story',
      icon: BookOpen,
      titleAr: 'قصة وسؤال مفتوح',
      titleEn: 'A story and an open question',
      descriptionAr: 'اقرأوا أو احكوا قصة قصيرة، ثم اسألوا سؤالًا مفيهوش إجابة واحدة صح، زي: تتوقع حصل إيه بعد كده؟',
      descriptionEn: 'Read or tell a short story, then ask an open question with no single right answer, such as what might happen next.',
      taskAr: 'قصة قصيرة وحوار مشترك',
      taskEn: 'A short story and a shared conversation',
    },
  ],
};

export const HomeLearningTrackSection: React.FC<HomeLearningTrackSectionProps> = ({
  language,
  childName,
  ageStage,
  childId,
  onNavigate,
  onAddRoutineTask,
}) => {
  const isEn = language === 'en';
  const activities = LEARNING_BY_AGE[ageStage] || LEARNING_BY_AGE.all;

  return (
    <section data-testid="home-learning-track" dir={isEn ? 'ltr' : 'rtl'} className="space-y-3">
      <div className="rounded-2xl border border-sky-500/20 bg-gradient-to-br from-sky-50/80 to-white p-4 shadow-sm dark:border-sky-900/40 dark:from-[#172D3A] dark:to-[#142430]">
        <p className="text-xs font-black text-sky-950 dark:text-sky-100">
          {isEn ? `Curiosity grows with ${childName}` : `التعلم يبدأ بالفضول مع ${childName}`}
        </p>
        <p className="mt-1 text-[11px] leading-relaxed text-sky-950/80 dark:text-sky-100/80">
          {isEn
            ? 'Small shared experiences matter more than scores. Follow the child’s pace and interests.'
            : 'التجارب الصغيرة المشتركة أهم من الدرجات. امشوا على وتيرة الطفل واهتماماته.'}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {activities.map((activity) => {
          const Icon = activity.icon;
          return (
            <article key={activity.id} className="flex flex-col rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white to-slate-50/80 p-4 shadow-[0_5px_16px_-14px_rgba(15,23,42,0.35)] dark:border-[#29404D] dark:from-[#142430] dark:to-[#101D26]">
              <span className="mb-3 grid h-11 w-11 place-items-center rounded-2xl border border-sky-500/15 bg-sky-500/10 text-sky-800 shadow-sm dark:text-sky-200">
                <Icon size={18} aria-hidden="true" />
              </span>
              <h4 className="text-xs font-black text-[var(--color-text)] dark:text-white">
                {isEn ? activity.titleEn : activity.titleAr}
              </h4>
              <p className="mt-1.5 text-[11px] leading-relaxed text-[var(--color-muted)] dark:text-[#CBD5E1]">
                {isEn ? activity.descriptionEn : activity.descriptionAr}
              </p>
              <button
                type="button"
                disabled={!onAddRoutineTask}
                onClick={() => onAddRoutineTask?.(
                  isEn ? activity.taskEn : activity.taskAr,
                  '05:00 م',
                  childId
                )}
                className="mt-4 min-h-[46px] w-full rounded-xl bg-sky-700 px-3 py-2.5 text-[11px] font-extrabold text-white shadow-sm transition-all hover:bg-sky-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 active:scale-[.99] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isEn ? 'Add to routine' : 'أضفها للروتين'}
              </button>
            </article>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2.5">
        <button type="button" onClick={() => onNavigate('children')} className="min-h-[44px] rounded-xl border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-xs font-extrabold text-sky-900 dark:text-sky-200">
          {isEn ? 'Explore child interests' : 'اكتشف اهتمامات الطفل'}
        </button>
        <button type="button" onClick={() => onNavigate('games')} className="min-h-[44px] rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs font-extrabold text-[var(--color-text)] dark:border-[#1E3646] dark:bg-[#142430] dark:text-white">
          {isEn ? 'Open learning games' : 'افتح ألعاب التعلم'}
        </button>
      </div>
    </section>
  );
};

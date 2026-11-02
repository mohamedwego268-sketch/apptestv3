import React from 'react';
import {
  BookOpen,
  Dumbbell,
  HeartHandshake,
  HeartPulse,
  ShieldCheck,
  Sparkles,
  Sun,
  type LucideIcon,
} from 'lucide-react';
import type { PageId } from '../context/FamilyAppContext';
import type { LanguageCode } from '../domain/familySpaceCore';

type HomeExpertSection = 'parentingSupport' | 'valuesTrack' | 'dailyEssentials' | 'learningTrack' | 'sportsTrack';

interface HomeExpertContentNetworkProps {
  language: LanguageCode;
  onNavigate: (pageId: PageId) => void;
  onOpenSection: (section: HomeExpertSection) => void;
}

interface ExpertiseArea {
  id: string;
  icon: LucideIcon;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  action: { kind: 'page'; page: PageId } | { kind: 'section'; section: HomeExpertSection };
}

const EXPERTISE_AREAS: ExpertiseArea[] = [
  {
    id: 'medical',
    icon: HeartPulse,
    titleAr: 'صحة الطفل',
    titleEn: 'Child health',
    descriptionAr: 'الصحة والنمو والرعاية والمتابعة',
    descriptionEn: 'Health, growth, care and follow-up',
    action: { kind: 'page', page: 'medical' },
  },
  {
    id: 'psychology',
    icon: HeartHandshake,
    titleAr: 'الدعم النفسي والتربوي',
    titleEn: 'Emotional & parenting support',
    descriptionAr: 'مشاعر الطفل ومساندة الأب والأم',
    descriptionEn: 'Children’s feelings and parent wellbeing',
    action: { kind: 'section', section: 'parentingSupport' },
  },
  {
    id: 'education',
    icon: BookOpen,
    titleAr: 'التعلم وتنمية المهارات',
    titleEn: 'Learning & development',
    descriptionAr: 'التعلم واللغة والفضول حسب العمر',
    descriptionEn: 'Age-aware learning, language and curiosity',
    action: { kind: 'section', section: 'learningTrack' },
  },
  {
    id: 'nutrition',
    icon: Sun,
    titleAr: 'التغذية والعادات الصحية',
    titleEn: 'Nutrition & healthy habits',
    descriptionAr: 'الغذاء والنوم والعناية اليومية',
    descriptionEn: 'Food, sleep and everyday care',
    action: { kind: 'section', section: 'dailyEssentials' },
  },
  {
    id: 'movement',
    icon: Dumbbell,
    titleAr: 'الحركة والنشاط',
    titleEn: 'Movement & activity',
    descriptionAr: 'اللعب واللياقة والأنشطة المناسبة للعمر',
    descriptionEn: 'Play, fitness and age-appropriate activity',
    action: { kind: 'section', section: 'sportsTrack' },
  },
  {
    id: 'values',
    icon: Sparkles,
    titleAr: 'القيم وبناء الشخصية',
    titleEn: 'Values & character',
    descriptionAr: 'التواصل والاحترام والاستقلالية',
    descriptionEn: 'Connection, respect and independence',
    action: { kind: 'section', section: 'valuesTrack' },
  },
];

export const HomeExpertContentNetwork: React.FC<HomeExpertContentNetworkProps> = ({
  language,
  onNavigate,
  onOpenSection,
}) => {
  const isEn = language === 'en';

  return (
    <section
      data-testid="home-expert-content-network"
      aria-labelledby="home-expert-content-network-title"
      dir={isEn ? 'ltr' : 'rtl'}
      className="overflow-hidden rounded-2xl border border-sky-500/20 bg-white p-4 shadow-sm dark:border-[#1E3646] dark:bg-[#101D26]"
    >
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-sky-500/10 text-sky-700 dark:text-sky-300">
          <ShieldCheck size={22} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 id="home-expert-content-network-title" className="text-sm font-black text-[var(--color-text)] dark:text-white">
              {isEn ? 'Expert knowledge network' : 'شبكة الخبراء والمختصين'}
            </h2>
            <span className="rounded-full bg-sky-500/10 px-2.5 py-1 text-[10px] font-extrabold text-sky-800 dark:text-sky-200">
              {isEn ? 'Building carefully' : 'قيد التجهيز'}
            </span>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-[var(--color-muted)] dark:text-[#A8B6C4]">
            {isEn
              ? 'Explore the fields our specialist-reviewed family content will cover. We publish professional profiles only after credential review.'
              : 'اكتشفوا المجالات التي سيغطيها المحتوى المتخصص. لن نعرض صفة «خبير موثّق» أو ننسب محتوى لمختص قبل مراجعة مؤهلاته واعتمادها.'}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {EXPERTISE_AREAS.map((area) => {
          const Icon = area.icon;
          return (
            <button
              key={area.id}
              type="button"
              data-testid={`home-expertise-${area.id}`}
              onClick={() => {
                if (area.action.kind === 'page') onNavigate(area.action.page);
                else onOpenSection(area.action.section);
              }}
              className="flex min-h-[104px] flex-col items-start rounded-xl border border-[var(--color-border)] bg-[var(--color-control-muted)]/45 p-3 text-start transition-colors hover:border-sky-500/50 hover:bg-sky-50/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:border-[#1E3646] dark:bg-[#142430] dark:hover:bg-sky-500/10"
            >
              <span className="mb-2 grid h-8 w-8 place-items-center rounded-lg bg-sky-500/10 text-sky-700 dark:text-sky-200">
                <Icon size={17} aria-hidden="true" />
              </span>
              <span className="text-xs font-black text-[var(--color-text)] dark:text-white">
                {isEn ? area.titleEn : area.titleAr}
              </span>
              <span className="mt-1 text-[10px] leading-relaxed text-[var(--color-muted)] dark:text-[#A8B6C4]">
                {isEn ? area.descriptionEn : area.descriptionAr}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-3 rounded-xl border border-dashed border-sky-500/30 bg-sky-50/60 px-3 py-2.5 text-[11px] leading-relaxed text-sky-950 dark:bg-sky-500/5 dark:text-sky-100">
        {isEn
          ? 'Every published contribution will show its author, verified credentials when applicable, review date, age range and whether it is general education or requires professional care.'
          : 'كل مساهمة منشورة هتوضح اسم صاحبها، ومؤهلاته بعد التحقق، وتاريخ المراجعة، والفئة العمرية، وهل هي إرشاد عام أم تستدعي الرجوع لمختص.'}
      </div>
    </section>
  );
};

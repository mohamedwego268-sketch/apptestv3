import React from 'react';
import {
  BookOpen,
  Dumbbell,
  HeartHandshake,
  HeartPulse,
  Sparkles,
  Sun,
  type LucideIcon,
} from 'lucide-react';
import type { PageId } from '../context/FamilyAppContext';
import type { LanguageCode } from '../domain/familySpaceCore';

type HomeSectionKey = 'heroesArena' | 'parentingSupport' | 'valuesTrack' | 'dailyEssentials' | 'learningTrack' | 'sportsTrack';

interface HomeContentTracksProps {
  language: LanguageCode;
  childName: string;
  onNavigate: (pageId: PageId) => void;
  onOpenSection: (section: HomeSectionKey) => void;
}

interface ContentTrack {
  id: string;
  icon: LucideIcon;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  nextStepAr: string;
  nextStepEn: string;
  destination: { kind: 'page'; page: PageId } | { kind: 'section'; section: HomeSectionKey };
}

const CONTENT_TRACKS: ContentTrack[] = [
  {
    id: 'health',
    icon: HeartPulse,
    titleAr: 'الصحة والرعاية',
    titleEn: 'Health & care',
    descriptionAr: 'السجل الصحي والنمو والمتابعة',
    descriptionEn: 'Health, growth and care records',
    nextStepAr: 'افتح السجل الصحي',
    nextStepEn: 'Open health record',
    destination: { kind: 'page', page: 'medical' },
  },
  {
    id: 'learning',
    icon: BookOpen,
    titleAr: 'التعلم والنمو',
    titleEn: 'Learning & development',
    descriptionAr: 'اكتشف مهارات طفلك واهتماماته',
    descriptionEn: 'Age-aware ideas that build curiosity and skills',
    nextStepAr: 'جرّب نشاطًا مناسبًا',
    nextStepEn: 'Try an age-fit activity',
    destination: { kind: 'section', section: 'learningTrack' },
  },
  {
    id: 'movement',
    icon: Dumbbell,
    titleAr: 'الحركة والرياضة',
    titleEn: 'Movement & sports',
    descriptionAr: 'أنشطة تناسب اهتمام طفلك',
    descriptionEn: 'Activities shaped around their interests',
    nextStepAr: 'اختر نشاطًا حركيًا',
    nextStepEn: 'Choose an activity',
    destination: { kind: 'section', section: 'sportsTrack' },
  },
  {
    id: 'wellbeing',
    icon: HeartHandshake,
    titleAr: 'المشاعر والدعم',
    titleEn: 'Emotional wellbeing',
    descriptionAr: 'مساندة الوالدين ومشاعر كل طفل',
    descriptionEn: 'Parent support and each child’s feelings',
    nextStepAr: 'تابع مشاعر طفلك',
    nextStepEn: 'Check in on feelings',
    destination: { kind: 'section', section: 'parentingSupport' },
  },
  {
    id: 'values',
    icon: Sparkles,
    titleAr: 'القيم والعادات',
    titleEn: 'Values & character',
    descriptionAr: 'خطوات يومية للرحمة والاحترام والمسؤولية',
    descriptionEn: 'Everyday kindness, respect and responsibility',
    nextStepAr: 'اختر عادة نبنيها',
    nextStepEn: 'Choose a habit to build',
    destination: { kind: 'section', section: 'valuesTrack' },
  },
  {
    id: 'daily-life',
    icon: Sun,
    titleAr: 'الحياة اليومية',
    titleEn: 'Everyday life',
    descriptionAr: 'النوم والتغذية والعادات والروتين',
    descriptionEn: 'Sleep, nutrition, habits and routines',
    nextStepAr: 'راجع روتين اليوم',
    nextStepEn: 'Review today’s routine',
    destination: { kind: 'section', section: 'dailyEssentials' },
  },
];

export const HomeContentTracks: React.FC<HomeContentTracksProps> = ({
  language,
  childName,
  onNavigate,
  onOpenSection,
}) => {
  const isEn = language === 'en';

  return (
    <section
      data-testid="home-content-tracks"
      aria-labelledby="home-content-tracks-heading"
      dir={isEn ? 'ltr' : 'rtl'}
      className="relative overflow-hidden rounded-3xl border border-teal-500/15 bg-gradient-to-br from-white via-white to-slate-50/80 p-4 shadow-[0_8px_24px_-18px_rgba(15,23,42,0.28)] dark:border-[#1E3646] dark:from-[#101D26] dark:via-[#101D26] dark:to-[#142430] sm:p-5"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id="home-content-tracks-heading" className="text-sm font-black text-[var(--color-text)] dark:text-white">
            {isEn ? 'Your family’s six growth tracks' : 'مسارات نكبر الستة'}
          </h2>
          <p className="mt-1 text-[10px] font-extrabold tracking-wide text-teal-700 dark:text-teal-300">
            {isEn ? 'Understand → Log → Follow → Understand better → Take action' : 'اعرف ← سجّل ← تابع ← افهم ← اتصرف'}
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-[var(--color-muted)] dark:text-[#94A3B8]">
            {isEn
              ? `One connected journey, starting with what ${childName} needs today.`
              : `مسارات مترابطة تبدأ من احتياج ${childName} النهارده.`}
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-teal-500/15 bg-teal-500/10 px-3 py-1.5 text-[10px] font-extrabold text-teal-800 dark:text-teal-200">
          {isEn ? 'Explore' : 'اكتشف'}
        </span>
      </div>

      <div data-testid="family-growth-map" className="mb-4 rounded-2xl border border-teal-500/15 bg-gradient-to-r from-teal-50 via-white to-sky-50/80 p-3 dark:from-[#102D32] dark:via-[#142430] dark:to-[#152C3C]">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] font-black text-teal-950 dark:text-teal-100">{isEn ? 'How the six tracks work together' : 'إزاي مسارات نكبر بتكمل بعض؟'}</p>
          <span className="text-lg" aria-hidden="true">🧭</span>
        </div>
        <div className="mt-2.5 grid grid-cols-5 gap-1">
          {(isEn ? [{icon:'👀',label:'Notice'},{icon:'📝',label:'Record'},{icon:'📈',label:'Follow'},{icon:'💡',label:'Understand'},{icon:'🤝',label:'Act'}] : [{icon:'👀',label:'لاحظ'},{icon:'📝',label:'سجّل'},{icon:'📈',label:'تابع'},{icon:'💡',label:'افهم'},{icon:'🤝',label:'اتصرف'}]).map((step,index)=>(
            <div key={step.label} className="min-w-0 text-center">
              <span className="mx-auto grid h-8 w-8 place-items-center rounded-xl border border-teal-500/10 bg-white/85 text-sm shadow-sm dark:border-white/10 dark:bg-white/5">{step.icon}</span>
              <span className="mt-1 block text-[8px] font-black text-teal-950 dark:text-teal-100 sm:text-[9px]">{step.label}</span>
              {index < 4 && <span className="sr-only">{isEn ? 'then' : 'ثم'}</span>}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {CONTENT_TRACKS.map((track) => {
          const Icon = track.icon;
          return (
            <button
              key={track.id}
              type="button"
              data-testid={`home-track-${track.id}`}
              onClick={() => {
                if (track.destination.kind === 'page') {
                  onNavigate(track.destination.page);
                } else {
                  onOpenSection(track.destination.section);
                }
              }}
              className="group flex min-h-[142px] min-w-0 flex-col items-start rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white to-slate-50/80 p-3.5 text-start shadow-[0_5px_16px_-14px_rgba(15,23,42,0.35)] transition-all hover:-translate-y-0.5 hover:border-teal-500/45 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 active:scale-[.98] dark:border-[#29404D] dark:from-[#142430] dark:to-[#101D26] dark:hover:border-teal-500/40"
            >
              <span className="mb-3 grid h-11 w-11 place-items-center rounded-2xl border border-teal-500/15 bg-teal-500/10 text-teal-800 shadow-sm ring-1 ring-black/[0.02] dark:text-teal-200">
                <Icon size={18} strokeWidth={2.1} aria-hidden="true" />
              </span>
              <span className="text-xs font-black leading-snug text-[var(--color-text)] dark:text-white">
                {isEn ? track.titleEn : track.titleAr}
              </span>
              <span className="mt-1.5 text-[10px] leading-relaxed text-[var(--color-muted)] dark:text-[#A8B6C4]">
                {isEn ? track.descriptionEn : track.descriptionAr}
              </span>
              <span className="mt-auto flex w-full items-center justify-between gap-1 border-t border-slate-100 pt-2.5 text-[10px] font-black text-teal-800 dark:border-[#29404D] dark:text-teal-200">
                {isEn ? track.nextStepEn : track.nextStepAr} <span aria-hidden="true">{isEn ? '→' : '←'}</span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
};

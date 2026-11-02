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

type HomeSectionKey = 'heroesArena' | 'parentingSupport' | 'valuesTrack' | 'dailyEssentials' | 'learningTrack';

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
    destination: { kind: 'page', page: 'medical' },
  },
  {
    id: 'learning',
    icon: BookOpen,
    titleAr: 'التعلم والنمو',
    titleEn: 'Learning & development',
    descriptionAr: 'اكتشف مهارات طفلك واهتماماته',
    descriptionEn: 'Age-aware ideas that build curiosity and skills',
    destination: { kind: 'section', section: 'learningTrack' },
  },
  {
    id: 'movement',
    icon: Dumbbell,
    titleAr: 'الحركة والرياضة',
    titleEn: 'Movement & sports',
    descriptionAr: 'أنشطة تناسب اهتمام طفلك',
    descriptionEn: 'Activities shaped around their interests',
    destination: { kind: 'section', section: 'heroesArena' },
  },
  {
    id: 'wellbeing',
    icon: HeartHandshake,
    titleAr: 'المشاعر والدعم',
    titleEn: 'Emotional wellbeing',
    descriptionAr: 'مساندة الوالدين ومشاعر كل طفل',
    descriptionEn: 'Parent support and each child’s feelings',
    destination: { kind: 'section', section: 'parentingSupport' },
  },
  {
    id: 'values',
    icon: Sparkles,
    titleAr: 'القيم والعادات',
    titleEn: 'Values & character',
    descriptionAr: 'خطوات يومية للرحمة والاحترام والمسؤولية',
    descriptionEn: 'Everyday kindness, respect and responsibility',
    destination: { kind: 'section', section: 'valuesTrack' },
  },
  {
    id: 'daily-life',
    icon: Sun,
    titleAr: 'الحياة اليومية',
    titleEn: 'Everyday life',
    descriptionAr: 'النوم والتغذية والعادات والروتين',
    descriptionEn: 'Sleep, nutrition, habits and routines',
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
      className="rounded-2xl border border-teal-500/20 bg-white/90 p-3.5 shadow-sm dark:border-[#1E3646] dark:bg-[#101D26] sm:p-4"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id="home-content-tracks-heading" className="text-sm font-black text-[var(--color-text)] dark:text-white">
            {isEn ? 'Your family’s six growth tracks' : 'مسارات نكبر الستة'}
          </h2>
          <p className="mt-1 text-[11px] leading-relaxed text-[var(--color-muted)] dark:text-[#94A3B8]">
            {isEn
              ? `One connected journey, starting with what ${childName} needs today.`
              : `مسارات مترابطة تبدأ من احتياج ${childName} النهارده.`}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-teal-50 px-2.5 py-1 text-[10px] font-extrabold text-teal-800 dark:bg-teal-500/10 dark:text-teal-200">
          {isEn ? 'Explore' : 'اكتشف'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
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
              className="flex min-h-[104px] flex-col items-start rounded-xl border border-[var(--color-border)] bg-[var(--color-control-muted)]/45 p-3 text-start transition-all hover:-translate-y-0.5 hover:border-teal-500/50 hover:bg-teal-50/70 active:scale-[.98] dark:border-[#1E3646] dark:bg-[#142430] dark:hover:bg-teal-500/10"
            >
              <span className="mb-2 grid h-9 w-9 place-items-center rounded-xl bg-teal-500/12 text-teal-800 dark:text-teal-200">
                <Icon size={18} strokeWidth={2.1} aria-hidden="true" />
              </span>
              <span className="text-xs font-black text-[var(--color-text)] dark:text-white">
                {isEn ? track.titleEn : track.titleAr}
              </span>
              <span className="mt-1 text-[10px] leading-relaxed text-[var(--color-muted)] dark:text-[#A8B6C4]">
                {isEn ? track.descriptionEn : track.descriptionAr}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
};

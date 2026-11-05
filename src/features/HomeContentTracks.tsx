import React, { useRef } from 'react';
import {
  BookOpen,
  Dumbbell,
  HeartHandshake,
  HeartPulse,
  Sparkles,
  Sun,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
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
  onOpenPlanner?: () => void;
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
  { id: 'health', icon: HeartPulse, titleAr: 'الصحة والرعاية', titleEn: 'Health & care', descriptionAr: 'النمو والسجل الصحي', descriptionEn: 'Growth and health records', destination: { kind: 'page', page: 'medical' } },
  { id: 'learning', icon: BookOpen, titleAr: 'التعلم والنمو', titleEn: 'Learning & growth', descriptionAr: 'مهارات وأنشطة تناسب عمره', descriptionEn: 'Age-fit skills and activities', destination: { kind: 'section', section: 'learningTrack' } },
  { id: 'movement', icon: Dumbbell, titleAr: 'الحركة والرياضة', titleEn: 'Movement & sports', descriptionAr: 'حركة ولعب حسب اهتمامه', descriptionEn: 'Play shaped around their interests', destination: { kind: 'section', section: 'sportsTrack' } },
  { id: 'wellbeing', icon: HeartHandshake, titleAr: 'المشاعر والدعم', titleEn: 'Feelings & support', descriptionAr: 'نفهم مشاعره ونسانده', descriptionEn: 'Understand feelings and offer support', destination: { kind: 'section', section: 'parentingSupport' } },
  { id: 'values', icon: Sparkles, titleAr: 'القيم والعادات', titleEn: 'Values & habits', descriptionAr: 'قيم نعيشها كل يوم', descriptionEn: 'Values we practice every day', destination: { kind: 'section', section: 'valuesTrack' } },
  { id: 'daily-life', icon: Sun, titleAr: 'الحياة اليومية', titleEn: 'Everyday life', descriptionAr: 'النوم والأكل والروتين', descriptionEn: 'Sleep, meals and routines', destination: { kind: 'section', section: 'dailyEssentials' } },
];

export const HomeContentTracks: React.FC<HomeContentTracksProps> = ({
  language,
  childName,
  onNavigate,
  onOpenSection,
  onOpenPlanner,
}) => {
  const isEn = language === 'en';
  const tracksRef = useRef<HTMLDivElement>(null);
  const scrollTracks = (direction: 'next' | 'previous') => {
    const container = tracksRef.current;
    if (!container) return;
    const amount = Math.max(240, Math.round(container.clientWidth * 0.78));
    container.scrollBy({ left: (isEn ? 1 : -1) * (direction === 'next' ? amount : -amount), behavior: 'smooth' });
  };

  return (
    <section
      data-testid="home-content-tracks"
      aria-labelledby="home-content-tracks-heading"
      dir={isEn ? 'ltr' : 'rtl'}
      className="relative rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-[0_6px_20px_-18px_rgba(15,23,42,0.3)] dark:border-[#263C49] dark:bg-[#101D26] sm:p-4"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 id="home-content-tracks-heading" className="text-sm font-black text-[var(--color-text)] dark:text-white">
            {isEn ? 'Your child’s journey' : 'رحلة طفلك'}
          </h2>
          <p className="mt-0.5 text-[10px] leading-relaxed text-[var(--color-muted)] dark:text-[#94A3B8]">
            {isEn ? `Choose what matters for ${childName} today` : `اختار المجال اللي يهم ${childName} النهارده`}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button type="button" onClick={() => scrollTracks('previous')} aria-label={isEn ? 'Previous areas' : 'المجالات السابقة'} className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-slate-600 transition hover:border-teal-500 hover:text-teal-700 dark:border-[#304754] dark:text-slate-300">
            {isEn ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
          </button>
          <button type="button" onClick={() => scrollTracks('next')} aria-label={isEn ? 'Next areas' : 'المجالات التالية'} className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-slate-600 transition hover:border-teal-500 hover:text-teal-700 dark:border-[#304754] dark:text-slate-300">
            {isEn ? <ArrowRight size={16} /> : <ArrowLeft size={16} />}
          </button>
        </div>
      </div>

      <div ref={tracksRef} data-testid="family-growth-map" className="flex snap-x snap-mandatory gap-2.5 overflow-x-auto overscroll-x-contain pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {CONTENT_TRACKS.map((track) => {
          const Icon = track.icon;
          return (
            <button
              key={track.id}
              type="button"
              data-testid={`home-track-${track.id}`}
              onClick={() => track.destination.kind === 'page' ? onNavigate(track.destination.page) : onOpenSection(track.destination.section)}
              className="group flex min-h-[112px] w-[72%] max-w-[230px] shrink-0 snap-start flex-col items-start rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 text-start transition hover:border-teal-500/45 hover:bg-teal-50/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 dark:border-[#29404D] dark:bg-[#142430] dark:hover:bg-teal-950/20 sm:w-[31%] sm:max-w-none"
            >
              <span className="mb-2 grid h-8 w-8 place-items-center rounded-lg bg-teal-500/10 text-teal-800 dark:text-teal-200">
                <Icon size={17} strokeWidth={2} aria-hidden="true" />
              </span>
              <span className="text-xs font-extrabold leading-snug text-[var(--color-text)] dark:text-white">
                {isEn ? track.titleEn : track.titleAr}
              </span>
              <span className="mt-1 text-[10px] leading-relaxed text-[var(--color-muted)] dark:text-[#A8B6C4]">
                {isEn ? track.descriptionEn : track.descriptionAr}
              </span>
              <span className="mt-auto pt-2 text-[10px] font-bold text-teal-800 dark:text-teal-200">
                {isEn ? 'Open area' : 'افتح المجال'} {isEn ? '→' : '←'}
              </span>
            </button>
          );
        })}
      </div>

      {onOpenPlanner && (
        <button type="button" onClick={onOpenPlanner} data-testid="home-family-ai-planner-entry" className="mt-3 flex min-h-10 w-full items-center justify-between gap-3 rounded-xl border border-teal-700/15 bg-teal-50/70 px-3 py-2.5 text-start transition hover:bg-teal-100/70 dark:border-teal-400/15 dark:bg-teal-950/20 dark:hover:bg-teal-950/35">
          <span className="flex min-w-0 items-center gap-2.5">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white text-teal-800 shadow-sm dark:bg-white/10 dark:text-teal-200"><CalendarDays size={16} /></span>
            <span className="min-w-0">
              <span className="block text-xs font-extrabold text-teal-950 dark:text-teal-100">{isEn ? 'Plan the family’s coming days' : 'رتّب الأيام الجاية للأسرة'}</span>
              <span className="mt-0.5 block truncate text-[10px] text-teal-800/80 dark:text-teal-200/75">{isEn ? 'Turn ideas into tasks and appointments' : 'حوّل الأفكار لمهام ومواعيد واضحة'}</span>
            </span>
          </span>
          <span className="shrink-0 text-xs font-black text-teal-800 dark:text-teal-200">{isEn ? 'Plan' : 'خطط'} ←</span>
        </button>
      )}
    </section>
  );
};

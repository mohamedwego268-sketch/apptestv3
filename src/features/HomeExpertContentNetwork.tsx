import React from 'react';
import { ShieldCheck } from 'lucide-react';
import type { LanguageCode } from '../domain/familySpaceCore';

interface HomeExpertContentNetworkProps {
  language: LanguageCode;
}

const EXPERTISE_AREAS = [
  { id: 'medical', titleAr: 'صحة الطفل', titleEn: 'Child health' },
  { id: 'psychology', titleAr: 'الدعم النفسي والتربوي', titleEn: 'Emotional & parenting support' },
  { id: 'education', titleAr: 'التعلم وتنمية المهارات', titleEn: 'Learning & development' },
  { id: 'nutrition', titleAr: 'التغذية والعادات الصحية', titleEn: 'Nutrition & healthy habits' },
  { id: 'movement', titleAr: 'الحركة والنشاط', titleEn: 'Movement & activity' },
  { id: 'values', titleAr: 'القيم وبناء الشخصية', titleEn: 'Values & character' },
] as const;

export const HomeExpertContentNetwork: React.FC<HomeExpertContentNetworkProps> = ({ language }) => {
  const isEn = language === 'en';

  return (
    <section
      data-testid="home-expert-content-network"
      aria-labelledby="home-expert-content-network-title"
      dir={isEn ? 'ltr' : 'rtl'}
      className="rounded-2xl border border-sky-500/20 bg-white/90 p-3.5 shadow-sm dark:border-[#1E3646] dark:bg-[#101D26] sm:p-4"
    >
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sky-500/10 text-sky-700 dark:text-sky-300">
          <ShieldCheck size={21} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 id="home-expert-content-network-title" className="text-sm font-black text-[var(--color-text)] dark:text-white">
              {isEn ? 'Specialist-reviewed family content' : 'محتوى أسري بمراجعة متخصصة'}
            </h2>
            <span className="rounded-full bg-sky-500/10 px-2.5 py-1 text-[10px] font-extrabold text-sky-800 dark:text-sky-200">
              {isEn ? 'In preparation' : 'قيد التجهيز'}
            </span>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-[var(--color-muted)] dark:text-[#A8B6C4]">
            {isEn
              ? 'We are preparing reviewed guidance across the family’s growth tracks. Professional credentials and sources will be checked before any specialist attribution is published.'
              : 'بنجهّز محتوى إرشادي مراجع عبر مسارات الأسرة. هنتحقق من المؤهلات والمصادر قبل نسبة أي محتوى لمختص أو عرض صفة مهنية.'}
          </p>
        </div>
      </div>

      <ul className="mt-3 flex flex-wrap gap-1.5" aria-label={isEn ? 'Content areas' : 'مجالات المحتوى'}>
        {EXPERTISE_AREAS.map((area) => (
          <li
            key={area.id}
            className="rounded-full border border-sky-500/20 bg-sky-50/70 px-2.5 py-1.5 text-[10px] font-bold text-sky-900 dark:border-sky-500/20 dark:bg-sky-500/5 dark:text-sky-100"
          >
            {isEn ? area.titleEn : area.titleAr}
          </li>
        ))}
      </ul>

      <p className="mt-3 border-t border-sky-500/15 pt-2.5 text-[10px] leading-relaxed text-[var(--color-muted)] dark:text-[#94A3B8]">
        {isEn
          ? 'Published guidance will identify its author, review date, relevant age range and when a family should seek qualified professional care.'
          : 'المحتوى المنشور هيوضح صاحبه وتاريخ مراجعته والمرحلة العمرية المناسبة، وإمتى تكون الاستعانة بمختص مؤهل هي الخطوة الأنسب.'}
      </p>
    </section>
  );
};

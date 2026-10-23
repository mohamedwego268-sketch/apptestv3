import React, { useState } from 'react';
import { LanguageCode } from '../domain/familySpaceCore';
import { ThreeDIcon, ThreeDIconId } from './ThreeDVisuals';

export interface BannerSlideItem {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  onCtaClick: () => void;
  iconId: ThreeDIconId;
  gradient: string;
  ctaVariant?: 'orange' | 'emerald' | 'purple' | 'indigo' | 'rose' | 'blue' | 'accent';
}

export const CTA_BUTTON_VARIANTS: Record<
  NonNullable<BannerSlideItem['ctaVariant']>,
  string
> = {
  orange: 'bg-orange-600 hover:bg-orange-700 text-white shadow-sm',
  emerald: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm',
  purple: 'bg-purple-700 hover:bg-purple-800 text-white shadow-sm',
  indigo: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm',
  rose: 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm',
  blue: 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm',
  accent: 'bg-[var(--color-accent)] hover:opacity-95 text-[var(--color-accent-contrast)] shadow-sm',
};

export type PastelTone =
  | 'emerald'
  | 'amber'
  | 'rose'
  | 'indigo'
  | 'purple'
  | 'sky'
  | 'teal'
  | 'orange'
  | 'pink'
  | 'cyan'
  | 'lime'
  | 'slate';

export const PASTEL_CARD_TONES: Record<
  PastelTone,
  { card: string; badge: string; iconBg: string }
> = {
  emerald: {
    card: 'bg-emerald-50/85 border-emerald-200/80',
    badge: 'bg-emerald-100 text-emerald-900',
    iconBg: 'bg-white/90 border-emerald-100',
  },
  amber: {
    card: 'bg-amber-50/85 border-amber-200/80',
    badge: 'bg-amber-100 text-amber-900',
    iconBg: 'bg-white/90 border-amber-100',
  },
  rose: {
    card: 'bg-rose-50/85 border-rose-200/80',
    badge: 'bg-rose-100 text-rose-900',
    iconBg: 'bg-white/90 border-rose-100',
  },
  indigo: {
    card: 'bg-indigo-50/85 border-indigo-200/80',
    badge: 'bg-indigo-100 text-indigo-900',
    iconBg: 'bg-white/90 border-indigo-100',
  },
  purple: {
    card: 'bg-purple-50/85 border-purple-200/80',
    badge: 'bg-purple-100 text-purple-900',
    iconBg: 'bg-white/90 border-purple-100',
  },
  sky: {
    card: 'bg-sky-50/85 border-sky-200/80',
    badge: 'bg-sky-100 text-sky-900',
    iconBg: 'bg-white/90 border-sky-100',
  },
  teal: {
    card: 'bg-teal-50/85 border-teal-200/80',
    badge: 'bg-teal-100 text-teal-900',
    iconBg: 'bg-white/90 border-teal-100',
  },
  orange: {
    card: 'bg-orange-50/85 border-orange-200/80',
    badge: 'bg-orange-100 text-orange-900',
    iconBg: 'bg-white/90 border-orange-100',
  },
  pink: {
    card: 'bg-pink-50/85 border-pink-200/80',
    badge: 'bg-pink-100 text-pink-900',
    iconBg: 'bg-white/90 border-pink-100',
  },
  cyan: {
    card: 'bg-cyan-50/85 border-cyan-200/80',
    badge: 'bg-cyan-100 text-cyan-900',
    iconBg: 'bg-white/90 border-cyan-100',
  },
  lime: {
    card: 'bg-lime-50/85 border-lime-200/80',
    badge: 'bg-lime-100 text-lime-900',
    iconBg: 'bg-white/90 border-lime-100',
  },
  slate: {
    card: 'bg-slate-50/90 border-slate-200/80',
    badge: 'bg-slate-200/90 text-slate-900',
    iconBg: 'bg-white/90 border-slate-100',
  },
};

interface PrimaryCtaButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: NonNullable<BannerSlideItem['ctaVariant']>;
  size?: 'sm' | 'md';
}

export const PrimaryCtaButton: React.FC<PrimaryCtaButtonProps> = ({
  variant = 'orange',
  size = 'md',
  className = '',
  children,
  ...rest
}) => {
  const sizeClasses =
    size === 'sm'
      ? 'min-h-[36px] px-3.5 py-1.5 rounded-xl text-[11.5px] font-extrabold'
      : 'min-h-[40px] px-4 py-2 rounded-xl text-xs font-extrabold';
  return (
    <button
      type="button"
      className={`${sizeClasses} ${CTA_BUTTON_VARIANTS[variant]} active:scale-[0.98] transition-all inline-flex items-center justify-center gap-1.5 whitespace-nowrap ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
};

interface SwipeableBannerCarouselProps {
  slides: BannerSlideItem[];
  language: LanguageCode;
  ariaLabel?: string;
}

export const SwipeableBannerCarousel: React.FC<SwipeableBannerCarouselProps> = ({
  slides,
  language,
  ariaLabel,
}) => {
  const [activeIdx, setActiveIdx] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  if (!slides.length) return null;
  const current = slides[activeIdx % slides.length];
  const isEn = language === 'en';
  const btnTone = CTA_BUTTON_VARIANTS[current.ctaVariant || 'orange'];

  return (
    <div
      className="relative rounded-[20px] overflow-hidden border border-[var(--color-border)] select-none"
      style={{
        background: current.gradient,
        boxShadow:
          '0 12px 26px -12px rgba(42, 36, 51, 0.12), inset 0 1px 3px rgba(255,255,255,0.85)',
      }}
      onTouchStart={(e) => setTouchStartX(e.touches[0]?.clientX ?? null)}
      onTouchEnd={(e) => {
        if (touchStartX === null) return;
        const endX = e.changedTouches[0]?.clientX ?? touchStartX;
        const diff = touchStartX - endX;
        if (Math.abs(diff) > 35) {
          if (diff > 0) {
            setActiveIdx((prev) => (prev + 1) % slides.length);
          } else {
            setActiveIdx((prev) => (prev - 1 + slides.length) % slides.length);
          }
        }
        setTouchStartX(null);
      }}
      aria-label={ariaLabel || (isEn ? 'Featured Highlights Carousel' : 'لافتات العروض والمختارات المتحركة')}
    >
      <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 min-h-[156px]">
        <div className="space-y-1.5 max-w-xl">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-white/85 text-[var(--color-text)] shadow-2xs">
            {current.badge}
          </span>
          <h2 className="text-base sm:text-xl font-extrabold text-[var(--color-text)] leading-snug">
            {current.title}
          </h2>
          <div className="text-[11.5px] sm:text-xs font-semibold text-[var(--color-muted)]">
            {current.subtitle}
          </div>
          <div className="pt-1 flex items-center gap-2">
            <button
              type="button"
              onClick={current.onCtaClick}
              className={`min-h-[38px] px-4 py-2 rounded-xl text-xs font-extrabold active:scale-[0.98] transition-transform ${btnTone}`}
            >
              {current.ctaLabel}
            </button>
          </div>
        </div>

        <div className="self-center sm:self-auto shrink-0 flex items-center justify-center w-18 h-18 sm:w-22 sm:h-22 rounded-2xl bg-white/80 backdrop-blur-xs border border-white shadow-sm">
          <ThreeDIcon id={current.iconId} size={52} />
        </div>
      </div>

      {/* Pagination Dots & Prev/Next Controls */}
      {slides.length > 1 && (
        <div className="px-4 pb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5" role="tablist" aria-label={isEn ? 'Banner slides' : 'شرائح اللافتات'}>
            {slides.map((s, idx) => {
              const isCurrent = idx === activeIdx % slides.length;
              return (
                <button
                  key={s.id}
                  type="button"
                  role="tab"
                  aria-selected={isCurrent}
                  aria-label={`${isEn ? 'Slide' : 'شريحة'} ${idx + 1}`}
                  onClick={() => setActiveIdx(idx)}
                  className={`h-2 rounded-full transition-all ${
                    isCurrent
                      ? 'w-6 bg-[var(--color-accent)]'
                      : 'w-2 bg-[var(--color-text)]/25 hover:bg-[var(--color-text)]/40'
                  }`}
                />
              );
            })}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveIdx((prev) => (prev - 1 + slides.length) % slides.length)}
              aria-label={isEn ? 'Previous Slide' : 'الشريحة السابقة'}
              className="w-7 h-7 rounded-lg bg-white/85 hover:bg-white text-[var(--color-text)] font-extrabold text-xs flex items-center justify-center shadow-2xs"
            >
              {isEn ? '‹' : '›'}
            </button>
            <button
              type="button"
              onClick={() => setActiveIdx((prev) => (prev + 1) % slides.length)}
              aria-label={isEn ? 'Next Slide' : 'الشريحة التالية'}
              className="w-7 h-7 rounded-lg bg-white/85 hover:bg-white text-[var(--color-text)] font-extrabold text-xs flex items-center justify-center shadow-2xs"
            >
              {isEn ? '›' : '‹'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

interface InnerScreenTopBarProps {
  title: string;
  subtitle?: string;
  badge?: string;
  iconId: ThreeDIconId;
  onBack: () => void;
  backLabel?: string;
  language: LanguageCode;
  tone?: PastelTone;
  rightSlot?: React.ReactNode;
}

export const InnerScreenTopBar: React.FC<InnerScreenTopBarProps> = ({
  title,
  subtitle,
  badge,
  iconId,
  onBack,
  backLabel,
  language,
  tone = 'slate',
  rightSlot,
}) => {
  const isEn = language === 'en';
  const toneClasses = PASTEL_CARD_TONES[tone];

  return (
    <div
      className={`rounded-[20px] border ${toneClasses.card} px-3 py-2.5 sm:px-4 sm:py-3 shadow-2xs flex items-center justify-between gap-2.5`}
    >
      <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
        <button
          type="button"
          onClick={onBack}
          aria-label={backLabel || (isEn ? 'Back to Home' : 'رجوع للرئيسية')}
          className="min-h-[36px] px-2.5 py-1 rounded-xl border border-[var(--color-border)] bg-white hover:border-[var(--color-accent)] text-[var(--color-text)] text-[11.5px] font-extrabold flex items-center gap-1 shadow-2xs active:scale-95 transition-all shrink-0"
        >
          <span className="text-xs leading-none">{isEn ? '←' : '→'}</span>
          <span>{backLabel || (isEn ? 'Back' : 'رجوع')}</span>
        </button>

        <div className="w-9 h-9 rounded-xl bg-white/95 border border-white shadow-2xs flex items-center justify-center shrink-0">
          <ThreeDIcon id={iconId} size={22} />
        </div>

        <div className="min-w-0 flex-1">
          <h1 className="text-xs sm:text-base font-extrabold text-[var(--color-text)] leading-tight">
            {title}
          </h1>
          {(subtitle || badge) && (
            <div className="text-[10.5px] font-bold text-[var(--color-muted)] truncate mt-0.5">
              {subtitle || badge}
            </div>
          )}
        </div>
      </div>

      {badge && (
        <span
          className={`hidden sm:inline-flex px-2 py-0.5 rounded-lg text-[10.5px] font-extrabold ${toneClasses.badge} shrink-0 tabular-nums`}
        >
          {badge}
        </span>
      )}

      {rightSlot && <div className="flex items-center gap-2 shrink-0">{rightSlot}</div>}
    </div>
  );
};


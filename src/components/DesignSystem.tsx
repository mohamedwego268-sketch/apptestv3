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
  ctaVariant?: 'orange' | 'emerald' | 'purple' | 'indigo' | 'rose' | 'blue' | 'teal' | 'accent';
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
  teal: 'bg-teal-600 hover:bg-teal-700 text-white shadow-sm',
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
  size?: 'sm' | 'md' | 'lg';
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
      : size === 'lg'
      ? 'min-h-[44px] px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold'
      : 'min-h-[40px] px-4 py-2 rounded-xl text-xs font-extrabold';
  const variantTone = CTA_BUTTON_VARIANTS[variant] || CTA_BUTTON_VARIANTS.orange;
  return (
    <button
      type="button"
      className={`${sizeClasses} ${variantTone} active:scale-[0.98] transition-all inline-flex items-center justify-center gap-1.5 whitespace-nowrap ${className}`}
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
      data-banner-carousel="true"
      data-banner-variant={current.ctaVariant || 'orange'}
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
  const toneClasses = PASTEL_CARD_TONES[tone] || PASTEL_CARD_TONES.slate;

  return (
    <div
      data-sticky-topbar="true"
      className={`sticky top-[52px] z-20 glass-sticky-subheader backdrop-blur-md rounded-[20px] border ${toneClasses.card} px-3 py-2.5 sm:px-4 sm:py-3 shadow-sm flex items-center justify-between gap-2.5 transition-all`}
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

interface SectionSkeletonLoaderProps {
  section: 'services' | 'medical' | 'community';
  language: LanguageCode;
}

export const SectionSkeletonLoader: React.FC<SectionSkeletonLoaderProps> = ({
  section,
  language,
}) => {
  const isEn = language === 'en';
  const sectionLabel =
    section === 'services'
      ? isEn
        ? 'Fetching Family Store & Live Tracking...'
        : 'جاري تحميل منتجات متجر الأسرة وتتبع التوصيل...'
      : section === 'medical'
      ? isEn
        ? 'Fetching Verified Pediatricians & Records...'
        : 'جاري تحميل قائمة الأطباء المعتمدين والسجلات الصحية...'
      : isEn
      ? 'Fetching Parents Community Discussions...'
      : 'جاري تحميل أحدث نقاشات وتجارب مجتمع الوالدين...';

  const cardCount = section === 'community' ? 4 : 6;

  return (
    <div
      id={`skeleton-loader-${section}`}
      data-testid="section-skeleton-loader"
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="space-y-4 animate-page-enter"
    >
      {/* Top Status Strip Shimmer */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 flex items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-xl skeleton-shimmer shrink-0" />
          <div className="space-y-1.5">
            <div className="text-xs font-extrabold text-[var(--color-text)] flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-[var(--color-accent)] animate-ping" />
              <span>{sectionLabel}</span>
            </div>
            <div className="h-2.5 w-44 rounded-full skeleton-shimmer" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-20 rounded-xl skeleton-shimmer" />
          <div className="h-8 w-24 rounded-xl skeleton-shimmer hidden sm:block" />
        </div>
      </div>

      {/* Hero Carousel Shimmer Block */}
      <div className="rounded-[22px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-2.5 w-full max-w-lg">
            <div className="h-5 w-32 rounded-full skeleton-shimmer" />
            <div className="h-6 w-3/4 rounded-xl skeleton-shimmer" />
            <div className="h-4 w-2/3 rounded-lg skeleton-shimmer" />
            <div className="pt-1">
              <div className="h-9 w-36 rounded-xl skeleton-shimmer" />
            </div>
          </div>
          <div className="w-20 h-20 rounded-2xl skeleton-shimmer shrink-0 self-center sm:self-auto" />
        </div>
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-6 rounded-full skeleton-shimmer" />
            <span className="h-2 w-2 rounded-full skeleton-shimmer" />
            <span className="h-2 w-2 rounded-full skeleton-shimmer" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-7 h-7 rounded-lg skeleton-shimmer" />
            <span className="w-7 h-7 rounded-lg skeleton-shimmer" />
          </div>
        </div>
      </div>

      {/* Filter Pills Bar Shimmer */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 flex flex-wrap items-center justify-between gap-2 shadow-2xs">
        <div className="flex items-center gap-2">
          <div className="h-8 w-24 rounded-xl skeleton-shimmer" />
          <div className="h-8 w-20 rounded-xl skeleton-shimmer" />
          <div className="h-8 w-24 rounded-xl skeleton-shimmer" />
        </div>
        <div className="h-8 w-44 rounded-xl skeleton-shimmer" />
      </div>

      {/* Cards Grid Shimmer */}
      <div
        className={
          section === 'community'
            ? 'grid grid-cols-1 md:grid-cols-2 gap-4'
            : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5'
        }
      >
        {Array.from({ length: cardCount }).map((_, idx) => (
          <div
            key={idx}
            className="rounded-[20px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 space-y-3 shadow-2xs"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="w-12 h-12 rounded-xl skeleton-shimmer shrink-0" />
              <div className="space-y-1.5 flex-1">
                <div className="h-4 w-3/4 rounded-lg skeleton-shimmer" />
                <div className="h-3 w-1/2 rounded-md skeleton-shimmer" />
              </div>
              <div className="h-5 w-14 rounded-lg skeleton-shimmer shrink-0" />
            </div>
            <div className="space-y-2 pt-1">
              <div className="h-3.5 w-full rounded-md skeleton-shimmer" />
              <div className="h-3.5 w-5/6 rounded-md skeleton-shimmer" />
            </div>
            <div className="pt-2 border-t border-[var(--color-border)]/60 flex items-center justify-between gap-2">
              <div className="h-5 w-20 rounded-lg skeleton-shimmer" />
              <div className="flex items-center gap-1.5">
                <div className="h-8 w-16 rounded-xl skeleton-shimmer" />
                <div className="h-8 w-20 rounded-xl skeleton-shimmer" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

interface FriendlyEmptyStateProps {
  id?: string;
  iconId?: ThreeDIconId;
  emoji?: string;
  title: string;
  subtitle?: string;
  tone?: PastelTone;
  ctaLabel?: string;
  onCtaClick?: () => void;
  actionLabel?: string;
  onAction?: () => void;
  secondaryCtaLabel?: string;
  onSecondaryCtaClick?: () => void;
}

export const FriendlyEmptyState: React.FC<FriendlyEmptyStateProps> = ({
  id,
  iconId = 'star',
  emoji,
  title,
  subtitle,
  tone = 'slate',
  ctaLabel,
  onCtaClick,
  actionLabel,
  onAction,
  secondaryCtaLabel,
  onSecondaryCtaClick,
}) => {
  const toneClasses = PASTEL_CARD_TONES[tone] || PASTEL_CARD_TONES.slate;
  const resolvedCtaLabel = ctaLabel || actionLabel;
  const resolvedOnCta = onCtaClick || onAction;

  return (
    <div
      id={id}
      data-testid="friendly-empty-state"
      className={`rounded-[22px] border border-dashed ${toneClasses.card} p-6 sm:p-8 text-center flex flex-col items-center justify-center gap-3 shadow-2xs animate-page-enter`}
    >
      <div className="relative flex items-center justify-center">
        <div className="w-16 h-16 rounded-3xl bg-white/90 border border-white shadow-sm flex items-center justify-center">
          {emoji ? (
            <span className="text-3xl">{emoji}</span>
          ) : (
            <ThreeDIcon id={iconId} size={40} />
          )}
        </div>
      </div>

      <div className="space-y-1 max-w-md">
        <h4 className="text-sm sm:text-base font-extrabold text-[var(--color-text)]">
          {title}
        </h4>
        {subtitle && (
          <p className="text-xs font-semibold text-[var(--color-muted)] leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>

      {(resolvedCtaLabel || secondaryCtaLabel) && (
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          {resolvedCtaLabel && resolvedOnCta && (
            <PrimaryCtaButton variant="orange" size="sm" onClick={resolvedOnCta}>
              {resolvedCtaLabel}
            </PrimaryCtaButton>
          )}
          {secondaryCtaLabel && onSecondaryCtaClick && (
            <button
              type="button"
              onClick={onSecondaryCtaClick}
              className="min-h-[36px] px-3.5 py-1.5 rounded-xl text-[11.5px] font-extrabold border border-[var(--color-border)] bg-white text-[var(--color-text)] shadow-2xs hover:border-[var(--color-accent)] active:scale-95 transition-all"
            >
              {secondaryCtaLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

interface GlobalToastSnackbarProps {
  message: string | null;
  onClose: () => void;
  language: LanguageCode;
}

export const GlobalToastSnackbar: React.FC<GlobalToastSnackbarProps> = ({
  message,
  onClose,
  language,
}) => {
  if (!message) return null;
  const isEn = language === 'en';
  const cleanMessage = message.replace(/^[✓✅]\s*/, '');

  return (
    <div
      id="global-toast-snackbar"
      data-testid="global-toast-snackbar"
      role="status"
      aria-live="polite"
      className="fixed bottom-20 lg:bottom-6 left-4 right-4 mx-auto max-w-md z-50 animate-toast-snackbar"
    >
      <div className="rounded-2xl bg-[var(--color-toast)]/95 backdrop-blur-md border border-white/15 text-white px-4 py-3 shadow-[0_16px_36px_-8px_rgba(15,23,42,0.45)] flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            aria-hidden="true"
            className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs"
          >
            <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 fill-none stroke-current stroke-[2.5]">
              <path d="M3.5 8.5L6.5 11.5L12.5 4.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="text-xs font-extrabold leading-snug">{cleanMessage}</span>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label={isEn ? 'Dismiss notification' : 'إغلاق التنبيه'}
          className="w-6 h-6 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-bold flex items-center justify-center shrink-0"
        >
          ×
        </button>
      </div>
    </div>
  );
};



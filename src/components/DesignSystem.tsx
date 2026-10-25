import React, { useEffect, useState } from 'react';
import { LanguageCode } from '../domain/familySpaceCore';
import { getCardBackgroundSpec } from '../domain/cardBackgrounds';
import { AiRobotHeadIcon, ThreeDIcon, ThreeDIconId } from './ThreeDVisuals';

export { AiRobotHeadIcon };

/**
 * Canonical Design System Color Tokens for نكبر (Nekbaar).
 * Light Mode: Crisp breathable white/light-gray (#F8FAFC, #FFFFFF) with high contrast text (#0B1926) and warm accents.
 * Dark Mode: Deep Midnight Charcoal (#0B131A) canvas with deep slate-navy surfaces (#101D26, #142430), pristine borders (#1E3646),
 * and WCAG AAA light text (#F8FAFC, #94A3B8).
 */
export const NEKBAAR_DESIGN_TOKENS = {
  light: {
    canvas: '#F8FAFC',
    surface: '#FFFFFF',
    surfaceSubtle: '#F1F5F9',
    textPrimary: '#0B1926',
    textMuted: '#64748B',
    border: '#E2E8F0',
    borderSubtle: '#F1F5F9',
    brandTeal: '#0D9488',
    brandCoral: '#FF8C61',
    cardShadow: '0 10px 28px -14px rgba(15,23,42,0.08)',
  },
  dark: {
    canvas: '#0B131A', // Deep Midnight Charcoal
    surface: '#101D26', // Elevated Card Surface
    surfaceElevated: '#142430', // Modal / Popover / Highlight
    surfaceHover: '#182C3A',
    textPrimary: '#F8FAFC', // WCAG AAA High Contrast
    textMuted: '#94A3B8', // Soft slate readable secondary
    border: '#1E3646', // Refined contrast border
    borderSubtle: '#162834',
    brandTeal: '#2DD4BF',
    brandCoral: '#FF8C61',
    cardShadow: '0 10px 28px -14px rgba(0,0,0,0.6)',
  },
} as const;


export interface SoftFilledIconProps {
  id: ThreeDIconId;
  size?: number;
  boxSize?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Standardized Soft-Filled Icon Box with uniform rounded corners, identical margins,
 * and Warm Coral (#FF8C61) soft-filled SVG iconography.
 */
export const SoftFilledIcon: React.FC<SoftFilledIconProps> = ({
  id,
  size,
  boxSize = 'md',
  className = '',
}) => {
  const boxClasses =
    boxSize === 'sm'
      ? 'w-9 h-9 rounded-xl'
      : boxSize === 'lg'
      ? 'w-14 h-14 rounded-2xl'
      : 'w-11 h-11 rounded-2xl';
  const iconSize = size ?? (boxSize === 'sm' ? 22 : boxSize === 'lg' ? 36 : 26);

  return (
    <span
      data-soft-icon-box={id}
      className={`nekbar-soft-icon-box ${boxClasses} inline-flex items-center justify-center shrink-0 select-none ${className}`}
    >
      <ThreeDIcon id={id} size={iconSize} />
    </span>
  );
};

export interface UnifiedBadgeProps {
  children?: React.ReactNode;
  label?: React.ReactNode;
  tone?: PastelTone;
  iconId?: ThreeDIconId;
  className?: string;
}

/**
 * Unified Tag & Badge component ensuring consistent typography, border radius, and soft-filled colors.
 */
export const UnifiedBadge: React.FC<UnifiedBadgeProps> = ({
  children,
  label,
  tone = 'teal',
  iconId,
  className = '',
}) => {
  const toneClasses = PASTEL_CARD_TONES[tone] || PASTEL_CARD_TONES.teal;
  const content = children ?? label;
  return (
    <span
      data-unified-badge="true"
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold ${toneClasses.badge} shadow-2xs select-none ${className}`}
    >
      {iconId && <ThreeDIcon id={iconId} size={13} />}
      <span>{content}</span>
    </span>
  );
};

export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  badge?: string;
  actionSlot?: React.ReactNode;
  className?: string;
}

/**
 * Standardized Centered & Bold Section Header with generous whitespace (breathing room).
 */
export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  badge,
  actionSlot,
  className = '',
}) => {
  return (
    <div className={`section-heading-block ${className}`}>
      {badge && (
        <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-[var(--color-accent-soft)] text-[var(--color-role-text)] shadow-2xs">
          {badge}
        </span>
      )}
      <h2 className="section-heading-centered">{title}</h2>
      {subtitle && <p className="section-subtitle-centered">{subtitle}</p>}
      {actionSlot && <div className="pt-1 flex flex-wrap items-center justify-center gap-2">{actionSlot}</div>}
    </div>
  );
};

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
  orange: 'bg-[#FF8C61] hover:bg-[#e86a3d] text-white shadow-sm',
  emerald: 'bg-[#0d9488] hover:bg-[#0f766e] text-white shadow-sm',
  purple: 'bg-[#0e7490] hover:bg-[#155e75] text-white shadow-sm',
  indigo: 'bg-[#0e7490] hover:bg-[#155e75] text-white shadow-sm',
  rose: 'bg-[#FF8C61] hover:bg-[#e86a3d] text-white shadow-sm',
  blue: 'bg-[#0284c7] hover:bg-[#0369a1] text-white shadow-sm',
  teal: 'bg-[#0d9488] hover:bg-[#0f766e] text-white shadow-sm',
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
    card: 'bg-teal-50/75 dark:bg-[#101D26] border-teal-200/45 dark:border-[#1E3646] shadow-[0_10px_28px_-14px_rgba(13,148,136,0.12)] dark:shadow-[0_10px_28px_-14px_rgba(0,0,0,0.6)]',
    badge: 'bg-teal-100/90 dark:bg-[#142430] text-teal-950 dark:text-[#A5F3FC] border border-teal-200/50 dark:border-[#1E3646]',
    iconBg: 'bg-white/95 dark:bg-[#142430] border-teal-100/60 dark:border-[#1E3646]',
  },
  amber: {
    card: 'bg-orange-50/75 dark:bg-[#101D26] border-orange-200/45 dark:border-[#1E3646] shadow-[0_10px_28px_-14px_rgba(255,140,97,0.12)] dark:shadow-[0_10px_28px_-14px_rgba(0,0,0,0.6)]',
    badge: 'bg-orange-100/90 dark:bg-[#142430] text-orange-950 dark:text-[#FDBA74] border border-orange-200/50 dark:border-[#1E3646]',
    iconBg: 'bg-white/95 dark:bg-[#142430] border-orange-100/60 dark:border-[#1E3646]',
  },
  rose: {
    card: 'bg-orange-50/75 dark:bg-[#101D26] border-orange-200/45 dark:border-[#1E3646] shadow-[0_10px_28px_-14px_rgba(255,140,97,0.12)] dark:shadow-[0_10px_28px_-14px_rgba(0,0,0,0.6)]',
    badge: 'bg-rose-100/90 dark:bg-[#142430] text-rose-950 dark:text-[#FDA4AF] border border-rose-200/50 dark:border-[#1E3646]',
    iconBg: 'bg-white/95 dark:bg-[#142430] border-rose-100/60 dark:border-[#1E3646]',
  },
  indigo: {
    card: 'bg-cyan-50/75 dark:bg-[#101D26] border-cyan-200/45 dark:border-[#1E3646] shadow-[0_10px_28px_-14px_rgba(14,116,144,0.12)] dark:shadow-[0_10px_28px_-14px_rgba(0,0,0,0.6)]',
    badge: 'bg-cyan-100/90 dark:bg-[#142430] text-cyan-950 dark:text-[#A5F3FC] border border-cyan-200/50 dark:border-[#1E3646]',
    iconBg: 'bg-white/95 dark:bg-[#142430] border-cyan-100/60 dark:border-[#1E3646]',
  },
  purple: {
    card: 'bg-teal-50/75 dark:bg-[#101D26] border-teal-200/45 dark:border-[#1E3646] shadow-[0_10px_28px_-14px_rgba(13,148,136,0.12)] dark:shadow-[0_10px_28px_-14px_rgba(0,0,0,0.6)]',
    badge: 'bg-teal-100/90 dark:bg-[#142430] text-teal-950 dark:text-[#A5F3FC] border border-teal-200/50 dark:border-[#1E3646]',
    iconBg: 'bg-white/95 dark:bg-[#142430] border-teal-100/60 dark:border-[#1E3646]',
  },
  sky: {
    card: 'bg-sky-50/75 dark:bg-[#101D26] border-sky-200/45 dark:border-[#1E3646] shadow-[0_10px_28px_-14px_rgba(14,165,233,0.12)] dark:shadow-[0_10px_28px_-14px_rgba(0,0,0,0.6)]',
    badge: 'bg-sky-100/90 dark:bg-[#142430] text-sky-950 dark:text-[#A5F3FC] border border-sky-200/50 dark:border-[#1E3646]',
    iconBg: 'bg-white/95 dark:bg-[#142430] border-sky-100/60 dark:border-[#1E3646]',
  },
  teal: {
    card: 'bg-teal-50/75 dark:bg-[#101D26] border-teal-200/45 dark:border-[#1E3646] shadow-[0_10px_28px_-14px_rgba(20,184,166,0.12)] dark:shadow-[0_10px_28px_-14px_rgba(0,0,0,0.6)]',
    badge: 'bg-teal-100/90 dark:bg-[#142430] text-teal-950 dark:text-[#A5F3FC] border border-teal-200/50 dark:border-[#1E3646]',
    iconBg: 'bg-white/95 dark:bg-[#142430] border-teal-100/60 dark:border-[#1E3646]',
  },
  orange: {
    card: 'bg-orange-50/75 dark:bg-[#101D26] border-orange-200/45 dark:border-[#1E3646] shadow-[0_10px_28px_-14px_rgba(255,140,97,0.12)] dark:shadow-[0_10px_28px_-14px_rgba(0,0,0,0.6)]',
    badge: 'bg-orange-100/90 dark:bg-[#142430] text-orange-950 dark:text-[#FDBA74] border border-orange-200/50 dark:border-[#1E3646]',
    iconBg: 'bg-white/95 dark:bg-[#142430] border-orange-100/60 dark:border-[#1E3646]',
  },
  pink: {
    card: 'bg-orange-50/75 dark:bg-[#101D26] border-orange-200/45 dark:border-[#1E3646] shadow-[0_10px_28px_-14px_rgba(255,140,97,0.12)] dark:shadow-[0_10px_28px_-14px_rgba(0,0,0,0.6)]',
    badge: 'bg-orange-100/90 dark:bg-[#142430] text-orange-950 dark:text-[#FDA4AF] border border-orange-200/50 dark:border-[#1E3646]',
    iconBg: 'bg-white/95 dark:bg-[#142430] border-orange-100/60 dark:border-[#1E3646]',
  },
  cyan: {
    card: 'bg-cyan-50/75 dark:bg-[#101D26] border-cyan-200/45 dark:border-[#1E3646] shadow-[0_10px_28px_-14px_rgba(6,182,212,0.12)] dark:shadow-[0_10px_28px_-14px_rgba(0,0,0,0.6)]',
    badge: 'bg-cyan-100/90 dark:bg-[#142430] text-cyan-950 dark:text-[#A5F3FC] border border-cyan-200/50 dark:border-[#1E3646]',
    iconBg: 'bg-white/95 dark:bg-[#142430] border-cyan-100/60 dark:border-[#1E3646]',
  },
  lime: {
    card: 'bg-teal-50/75 dark:bg-[#101D26] border-teal-200/45 dark:border-[#1E3646] shadow-[0_10px_28px_-14px_rgba(13,148,136,0.12)] dark:shadow-[0_10px_28px_-14px_rgba(0,0,0,0.6)]',
    badge: 'bg-teal-100/90 dark:bg-[#142430] text-teal-950 dark:text-[#A5F3FC] border border-teal-200/50 dark:border-[#1E3646]',
    iconBg: 'bg-white/95 dark:bg-[#142430] border-teal-100/60 dark:border-[#1E3646]',
  },
  slate: {
    card: 'bg-slate-50/85 dark:bg-[#101D26] border-slate-200/45 dark:border-[#1E3646] shadow-[0_10px_28px_-14px_rgba(15,23,42,0.08)] dark:shadow-[0_10px_28px_-14px_rgba(0,0,0,0.6)]',
    badge: 'bg-slate-200/80 dark:bg-[#142430] text-slate-900 dark:text-[#F8FAFC] border border-slate-300/50 dark:border-[#1E3646]',
    iconBg: 'bg-white/95 dark:bg-[#142430] border-slate-100/60 dark:border-[#1E3646]',
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
  darkMode?: boolean;
  ariaLabel?: string;
  autoPlayMs?: number;
}

const ICON_TO_BG_KEY: Record<ThreeDIconId, string> = {
  home: 'family',
  children: 'children',
  routine: 'routine',
  calendar: 'calendar',
  wishes: 'wishes',
  media: 'media',
  video: 'media',
  audio: 'media',
  games: 'games',
  services: 'services',
  cart: 'store',
  notifications: 'notifications',
  assistant: 'assistant',
  family: 'family',
  settings: 'settings',
  health: 'medical',
  shield: 'chat',
  star: 'community',
  location: 'services',
  sparkles: 'community',
};

export const SwipeableBannerCarousel: React.FC<SwipeableBannerCarouselProps> = ({
  slides,
  language,
  darkMode,
  ariaLabel,
  autoPlayMs = 4500,
}) => {
  const [activeIdx, setActiveIdx] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [domDark, setDomDark] = useState<boolean>(() =>
    typeof document !== 'undefined'
      ? document.documentElement.getAttribute('data-color-mode') === 'dark' ||
        document.documentElement.classList.contains('dark')
      : false
  );

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const syncDomMode = () => {
      setDomDark(
        document.documentElement.getAttribute('data-color-mode') === 'dark' ||
          document.documentElement.classList.contains('dark')
      );
    };
    syncDomMode();
    const obs = new MutationObserver(syncDomMode);
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-color-mode', 'class'],
    });
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (slides.length <= 1 || isPaused || autoPlayMs <= 0) return;
    const timer = window.setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % slides.length);
    }, autoPlayMs);
    return () => window.clearInterval(timer);
  }, [slides.length, isPaused, autoPlayMs]);

  if (!slides.length) return null;
  const current = slides[activeIdx % slides.length];
  const isEn = language === 'en';
  const btnTone = CTA_BUTTON_VARIANTS[current.ctaVariant || 'orange'];
  const bgKey = ICON_TO_BG_KEY[current.iconId] || 'services';
  const resolvedDark = darkMode !== undefined ? darkMode : domDark;
  const bgSpec = getCardBackgroundSpec(bgKey, resolvedDark);

  return (
    <div
      data-banner-carousel="true"
      data-autoplay-enabled="true"
      data-banner-variant={current.ctaVariant || 'orange'}
      className="image-bg-card relative rounded-[24px] overflow-hidden select-none transition-all"
      style={{
        backgroundImage: bgSpec.backgroundImageCss,
      }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={(e) => {
        setIsPaused(true);
        setTouchStartX(e.touches[0]?.clientX ?? null);
      }}
      onTouchEnd={(e) => {
        setIsPaused(false);
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
      <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 min-h-[148px] text-center sm:text-start">
        <div className="space-y-1.5 max-w-xl flex flex-col items-center sm:items-start">
          <span className="image-card-badge inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold">
            <ThreeDIcon id={current.iconId} size={14} />
            <span>{current.badge}</span>
          </span>
          <h2 className="image-card-title text-base sm:text-lg font-extrabold leading-snug">
            {current.title}
          </h2>
          <div className="image-card-subtitle text-xs font-semibold leading-relaxed">
            {current.subtitle}
          </div>
          <div className="pt-1 flex items-center gap-2">
            <button
              type="button"
              onClick={current.onCtaClick}
              className={`min-h-[38px] px-4 py-1.5 rounded-xl text-xs font-extrabold active:scale-[0.98] transition-transform ${btnTone}`}
            >
              {current.ctaLabel}
            </button>
          </div>
        </div>

        <div className="self-center shrink-0">
          <SoftFilledIcon id={current.iconId} boxSize="lg" size={40} className="bg-white/90 dark:bg-[#142430] border-white/80 dark:border-[#1E3646] shadow-sm" />
        </div>
      </div>

      {/* Pagination Dots & Prev/Next Controls */}
      {slides.length > 1 && (
        <div className="px-4 sm:px-5 pb-3.5 flex items-center justify-between gap-3">
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
                  className={`h-2.5 rounded-full transition-all ${
                    isCurrent
                      ? 'w-7 bg-[#FF8C61]'
                      : 'w-2.5 bg-[var(--color-text)]/30 hover:bg-[var(--color-text)]/50'
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
              className="w-7 h-7 rounded-xl bg-white/85 dark:bg-[#142430] hover:bg-white dark:hover:bg-[#182C3A] border border-transparent dark:border-[#1E3646] text-[var(--color-text)] font-extrabold text-xs flex items-center justify-center shadow-2xs"
            >
              {isEn ? '‹' : '›'}
            </button>
            <button
              type="button"
              onClick={() => setActiveIdx((prev) => (prev + 1) % slides.length)}
              aria-label={isEn ? 'Next Slide' : 'الشريحة التالية'}
              className="w-7 h-7 rounded-xl bg-white/85 dark:bg-[#142430] hover:bg-white dark:hover:bg-[#182C3A] border border-transparent dark:border-[#1E3646] text-[var(--color-text)] font-extrabold text-xs flex items-center justify-center shadow-2xs"
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
      className={`sticky top-[52px] z-20 glass-sticky-subheader backdrop-blur-md rounded-[22px] border ${toneClasses.card} px-3.5 py-2.5 sm:px-5 sm:py-3 shadow-sm flex items-center justify-between gap-3 transition-all`}
    >
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
        <button
          type="button"
          onClick={onBack}
          aria-label={backLabel || (isEn ? 'Back to Home' : 'رجوع للرئيسية')}
          className="min-h-[38px] px-3 py-1.5 rounded-xl border border-[var(--color-border)] bg-white hover:border-[#FF8C61] text-[var(--color-text)] text-xs font-extrabold flex items-center gap-1.5 shadow-2xs active:scale-95 transition-all shrink-0"
        >
          <span className="text-xs leading-none">{isEn ? '←' : '→'}</span>
          <span>{backLabel || (isEn ? 'Back' : 'رجوع')}</span>
        </button>

        <SoftFilledIcon id={iconId} boxSize="sm" />

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
          className={`hidden sm:inline-flex px-2.5 py-1 rounded-xl text-[10.5px] font-extrabold ${toneClasses.badge} shrink-0 tabular-nums`}
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
        <SoftFilledIcon id={iconId} boxSize="lg" />
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

export interface CollapsibleSectionCardProps {
  id?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  badge?: React.ReactNode;
  badgeLabel?: React.ReactNode;
  badgeTone?: PastelTone;
  icon?: React.ReactNode;
  iconId?: ThreeDIconId;
  defaultOpen?: boolean;
  isOpen?: boolean;
  onToggle?: (isOpen: boolean) => void;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
  cardTone?: PastelTone;
}

/**
 * Collapsible Section Card (Accordion) with smooth chevron arrow animation,
 * accessible keyboard/click controls, and visual tone preservation.
 */
export const CollapsibleSectionCard: React.FC<CollapsibleSectionCardProps> = ({
  id,
  title,
  subtitle,
  badge,
  badgeLabel,
  badgeTone = 'teal',
  icon,
  iconId,
  defaultOpen = false,
  isOpen: controlledIsOpen,
  onToggle,
  headerAction,
  children,
  className = '',
  headerClassName = '',
  bodyClassName = '',
  cardTone,
}) => {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isExpanded = controlledIsOpen !== undefined ? controlledIsOpen : internalOpen;

  const handleToggle = () => {
    const next = !isExpanded;
    if (controlledIsOpen === undefined) {
      setInternalOpen(next);
    }
    onToggle?.(next);
  };

  const cardToneClasses = cardTone
    ? PASTEL_CARD_TONES[cardTone]?.card || ''
    : 'bg-[var(--color-surface)] dark:bg-[#101D26] border-[var(--color-border)] dark:border-[#1E3646] text-[var(--color-text)] dark:text-[#F8FAFC]';

  const resolvedIcon = icon ?? (iconId ? <SoftFilledIcon id={iconId} size={18} boxSize="sm" /> : null);
  const resolvedBadge = badge ?? (badgeLabel ? (typeof badgeLabel === 'string' ? <UnifiedBadge tone={badgeTone}>{badgeLabel}</UnifiedBadge> : badgeLabel) : null);

  return (
    <div
      id={id}
      data-collapsible-section="true"
      data-expanded={isExpanded ? 'true' : 'false'}
      className={`rounded-[24px] border shadow-2xs transition-all overflow-hidden ${cardToneClasses} ${className}`}
    >
      <div
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        aria-controls={id ? `${id}-content` : undefined}
        onClick={handleToggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleToggle();
          }
        }}
        className={`w-full p-4 sm:p-5 flex items-center justify-between gap-3 cursor-pointer select-none hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors ${headerClassName}`}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {resolvedIcon && <div className="shrink-0">{resolvedIcon}</div>}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm sm:text-base font-extrabold text-[var(--color-text)] truncate">
                {title}
              </h3>
              {resolvedBadge && (
                typeof resolvedBadge === 'string' ? (
                  <UnifiedBadge tone={badgeTone}>{resolvedBadge}</UnifiedBadge>
                ) : (
                  resolvedBadge
                )
              )}
            </div>
            {subtitle && (
              <p className="text-xs font-semibold text-[var(--color-muted)] mt-0.5 leading-relaxed line-clamp-1">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {headerAction && (
            <div
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
              {headerAction}
            </div>
          )}
          <span
            data-accordion-chevron="true"
            aria-hidden="true"
            className={`w-8 h-8 rounded-xl bg-[var(--color-control-muted)] text-[var(--color-text)] border border-[var(--color-border)] flex items-center justify-center transition-transform duration-200 ${
              isExpanded
                ? 'rotate-180 bg-[var(--color-accent-soft)] text-[var(--color-role-text)] border-[var(--color-accent)]/30'
                : 'rotate-0'
            }`}
          >
            <svg
              className="w-4 h-4 fill-none stroke-current stroke-[2.5]"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </span>
        </div>
      </div>

      {isExpanded && (
        <div
          id={id ? `${id}-content` : undefined}
          className={`p-4 sm:p-5 pt-0 border-t border-[var(--color-border)]/40 ${bodyClassName}`}
        >
          {children}
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
      className="fixed bottom-20 lg:bottom-6 inset-x-4 mx-auto max-w-md z-50 animate-toast-snackbar"
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

import React, { useEffect, useState } from 'react';
import { LanguageCode } from '../domain/familySpaceCore';
import { getCardBackgroundSpec, getProductUnsplashImageUrl } from '../domain/cardBackgrounds';
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
    textPrimary: '#0B131A',
    textMuted: '#475569',
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
    textPrimary: '#F8FAFC', // WCAG AAA High Contrast White
    textCyan: '#A5F3FC', // Luminous Cyan Accent Text
    textMuted: '#CBD5E1', // Readable secondary slate
    border: '#1E3646', // Refined contrast border
    borderSubtle: '#162834',
    brandTeal: '#2DD4BF',
    brandCoral: '#FF8C61',
    cardShadow: '0 10px 28px -14px rgba(0,0,0,0.65)',
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
 * Modern Dual Opposing Arrows Comparison Icon (⇄) — replaces legacy balance/scale icon universally.
 */
export const CompareArrowsIcon: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 14,
}) => (
  <span
    data-compare-icon="arrows"
    aria-hidden="true"
    className={`inline-flex items-center justify-center leading-none select-none font-black ${className}`}
  >
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
    >
      <path d="M16 3l4 4-4 4" />
      <path d="M20 7H4" />
      <path d="M8 21l-4-4 4-4" />
      <path d="M4 17h16" />
    </svg>
  </span>
);

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
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-extrabold ${toneClasses.badge} shadow-2xs select-none whitespace-nowrap ${className}`}
    >
      {iconId && <ThreeDIcon id={iconId} size={10} />}
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
      ? 'min-h-[38px] px-4 py-1.5 rounded-xl text-[11.5px] font-extrabold tracking-tight'
      : size === 'lg'
      ? 'min-h-[46px] px-5.5 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold tracking-tight'
      : 'min-h-[42px] px-4.5 py-2 rounded-xl text-xs font-extrabold tracking-tight';
  const variantTone = CTA_BUTTON_VARIANTS[variant] || CTA_BUTTON_VARIANTS.orange;
  return (
    <button
      type="button"
      className={`${sizeClasses} ${variantTone} hover:scale-[1.02] active:scale-[0.97] transition-all duration-300 ease-in-out inline-flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${className}`}
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
      className="image-bg-card relative rounded-2xl sm:rounded-3xl overflow-hidden select-none transition-all duration-300 ease-in-out shadow-sm"
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
      <div className="p-4 sm:p-5 flex flex-row items-center justify-between gap-2.5 min-h-[88px] sm:min-h-[96px] text-start">
        <div className="image-card-glass-panel rounded-xl p-3 sm:p-3.5 space-y-1 max-w-xl flex-1 flex flex-col items-start transition-all duration-300 ease-in-out min-w-0">
          <div className="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap no-scrollbar max-w-full">
            <span className="image-card-badge inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold shrink-0">
              <ThreeDIcon id={current.iconId} size={11} />
              <span>{current.badge}</span>
            </span>
          </div>
          <h2 className="image-card-title text-xs sm:text-sm font-extrabold leading-snug line-clamp-1">
            {current.title}
          </h2>
          <div className="image-card-subtitle text-[10px] font-semibold leading-snug line-clamp-1">
            {current.subtitle}
          </div>
          <div className="pt-0.5 flex items-center gap-1.5">
            <button
              type="button"
              onClick={current.onCtaClick}
              className={`min-h-[28px] px-2.5 py-0.5 rounded-lg text-[10.5px] font-extrabold hover:scale-[1.02] active:scale-[0.97] transition-all duration-300 ease-in-out cursor-pointer ${btnTone}`}
            >
              {current.ctaLabel}
            </button>
          </div>
        </div>

        <div className="self-center shrink-0 hidden xs:block sm:block">
          <SoftFilledIcon
            id={current.iconId}
            boxSize="sm"
            size={22}
            className="bg-white/90 dark:bg-[#142430] border-white/80 dark:border-[#1E3646] shadow-2xs rounded-xl transition-transform duration-300 ease-in-out hover:scale-105"
          />
        </div>
      </div>

      {/* Pagination Dots & Prev/Next Controls */}
      {slides.length > 1 && (
        <div className="px-3 sm:px-3.5 pb-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1" role="tablist" aria-label={isEn ? 'Banner slides' : 'شرائح اللافتات'}>
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
                  className={`h-2 rounded-full transition-all duration-300 ease-in-out cursor-pointer ${
                    isCurrent
                      ? 'w-5 bg-[#FF8C61]'
                      : 'w-2 bg-[var(--color-text)]/30 hover:bg-[var(--color-text)]/50'
                  }`}
                />
              );
            })}
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveIdx((prev) => (prev - 1 + slides.length) % slides.length)}
              aria-label={isEn ? 'Previous Slide' : 'الشريحة السابقة'}
              className="w-6 h-6 rounded-lg bg-white/85 dark:bg-[#142430] hover:bg-white dark:hover:bg-[#182C3A] border border-transparent dark:border-[#1E3646] text-[var(--color-text)] font-extrabold text-xs flex items-center justify-center shadow-2xs transition-all duration-300 ease-in-out active:scale-95 cursor-pointer"
            >
              {isEn ? '‹' : '›'}
            </button>
            <button
              type="button"
              onClick={() => setActiveIdx((prev) => (prev + 1) % slides.length)}
              aria-label={isEn ? 'Next Slide' : 'الشريحة التالية'}
              className="w-6 h-6 rounded-lg bg-white/85 dark:bg-[#142430] hover:bg-white dark:hover:bg-[#182C3A] border border-transparent dark:border-[#1E3646] text-[var(--color-text)] font-extrabold text-xs flex items-center justify-center shadow-2xs transition-all duration-300 ease-in-out active:scale-95 cursor-pointer"
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
      className={`sticky top-[52px] z-20 glass-sticky-subheader backdrop-blur-md rounded-[22px] border ${toneClasses.card} px-3.5 py-2.5 sm:px-5 sm:py-3 shadow-sm flex flex-wrap items-center justify-between gap-2.5 sm:gap-3 transition-all duration-300 ease-in-out`}
    >
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
        <button
          type="button"
          onClick={onBack}
          aria-label={backLabel || (isEn ? 'Back to Home' : 'رجوع للرئيسية')}
          className="min-h-[36px] sm:min-h-[38px] px-2.5 sm:px-3 py-1.5 rounded-xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-bg)] dark:bg-[#142430] hover:border-[#FF8C61] text-[var(--color-text)] text-xs font-extrabold flex items-center gap-1.5 shadow-2xs active:scale-95 transition-all duration-300 ease-in-out shrink-0 cursor-pointer"
        >
          <span className="text-xs leading-none">{isEn ? '←' : '→'}</span>
          <span>{backLabel || (isEn ? 'Back' : 'رجوع')}</span>
        </button>

        <SoftFilledIcon id={iconId} boxSize="sm" />

        <div className="min-w-0 flex-1">
          <h1 className="text-xs sm:text-base font-extrabold text-[var(--color-text)] leading-tight truncate">
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
          className={`hidden md:inline-flex px-2.5 py-1 rounded-xl text-[10.5px] font-extrabold ${toneClasses.badge} shrink-0 tabular-nums`}
        >
          {badge}
        </span>
      )}

      {rightSlot && <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 shrink-0 ms-auto">{rightSlot}</div>}
    </div>
  );
};

interface SectionSkeletonLoaderProps {
  section: 'services' | 'medical' | 'community';
  language: LanguageCode;
}

export const PlayfulChildLoaderSvg: React.FC<{ size?: number }> = ({ size = 56 }) => (
  <span
    data-testid="playful-child-svg-loader"
    aria-hidden="true"
    className="relative inline-flex items-center justify-center shrink-0 select-none"
    style={{ width: size, height: size }}
  >
    {/* Subtle Glowing Pulse Halo */}
    <span
      className="animate-nav-pulse-halo absolute inset-0 rounded-full pointer-events-none"
      style={{
        background:
          'radial-gradient(circle, rgba(13, 148, 136, 0.24) 0%, rgba(255, 140, 97, 0.18) 55%, transparent 75%)',
      }}
    />
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      className="animate-child-loader-bob relative z-10 drop-shadow-xs"
    >
      {/* Soft Ground Shadow */}
      <ellipse cx="40" cy="71" rx="15" ry="3.2" fill="#0D9488" fillOpacity="0.18" />

      {/* Walking Toddler Left & Right Legs (Animated Alternating Steps) */}
      <g className="animate-toddler-step-a" style={{ transformOrigin: '35px 54px' }}>
        <path
          d="M35 54L31 66"
          stroke="#0D9488"
          strokeWidth="4.5"
          strokeLinecap="round"
        />
        <ellipse cx="29.5" cy="67" rx="4.2" ry="2.4" fill="#FF8C61" />
      </g>
      <g className="animate-toddler-step-b" style={{ transformOrigin: '45px 54px' }}>
        <path
          d="M45 54L49 66"
          stroke="#0D9488"
          strokeWidth="4.5"
          strokeLinecap="round"
        />
        <ellipse cx="50.5" cy="67" rx="4.2" ry="2.4" fill="#FF8C61" />
      </g>

      {/* Playful Waving Arms */}
      <g className="animate-toddler-step-b" style={{ transformOrigin: '28px 42px' }}>
        <path
          d="M29 42L20 36"
          stroke="#FBBF24"
          strokeWidth="4.2"
          strokeLinecap="round"
        />
        <circle cx="19" cy="35.5" r="2.8" fill="#FDE68A" stroke="#F59E0B" strokeWidth="1.2" />
      </g>
      <g className="animate-toddler-step-a" style={{ transformOrigin: '52px 42px' }}>
        <path
          d="M51 42L60 36"
          stroke="#FBBF24"
          strokeWidth="4.2"
          strokeLinecap="round"
        />
        <circle cx="61" cy="35.5" r="2.8" fill="#FDE68A" stroke="#F59E0B" strokeWidth="1.2" />
      </g>

      {/* Cozy Toddler Romper / Overalls Body */}
      <rect
        x="27"
        y="37"
        width="26"
        height="20"
        rx="11"
        fill="#0D9488"
        stroke="#14B8A6"
        strokeWidth="1.8"
      />
      {/* Little Star Emblem on Chest */}
      <path
        d="M40 42.5l1.3 2.7 3 .4-2.2 2.1.5 3-2.6-1.4-2.6 1.4.5-3-2.2-2.1 3-.4 1.3-2.7z"
        fill="#FDE047"
      />

      {/* Smiling Baby / Toddler Head */}
      <circle cx="40" cy="25" r="14.5" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="2" />

      {/* Playful Curl of Hair at Top */}
      <path
        d="M35 10.5c2.2-3.8 7.8-4.5 10.5-1 1.8 2 0.8 4.6-2 4.6"
        stroke="#0D9488"
        strokeWidth="2.6"
        strokeLinecap="round"
      />

      {/* Happy Arched Eyes */}
      <path d="M33.2 23.2c1.1-1.6 2.9-1.6 4 0" stroke="#0B131A" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M42.8 23.2c1.1-1.6 2.9-1.6 4 0" stroke="#0B131A" strokeWidth="2.2" strokeLinecap="round" />

      {/* Rosy Cheeks */}
      <circle cx="31.5" cy="27" r="2.3" fill="#FF8C61" fillOpacity="0.7" />
      <circle cx="48.5" cy="27" r="2.3" fill="#FF8C61" fillOpacity="0.7" />

      {/* Joyful Smile */}
      <path
        d="M35 28.8c1.8 3.2 8.2 3.2 10 0"
        stroke="#0B131A"
        strokeWidth="2.2"
        strokeLinecap="round"
      />

      {/* Floating Twinkling Star Top-Right */}
      <g className="animate-star-twinkle" style={{ transformOrigin: '64px 16px' }}>
        <path
          d="M64 10l1.5 3.8 3.9 1.5-3.9 1.5L64 20.6l-1.5-3.8-3.9-1.5 3.9-1.5L64 10z"
          fill="#F59E0B"
        />
      </g>

      {/* Floating Warm Family Heart Top-Left */}
      <g className="animate-star-twinkle" style={{ transformOrigin: '16px 18px', animationDelay: '300ms' }}>
        <path
          d="M16 22.5s-4.5-2.7-4.5-5.5c0-1.5 1.2-2.7 2.7-2.7 1 0 1.8.5 1.8 1.2 0-.7.8-1.2 1.8-1.2 1.5 0 2.7 1.2 2.7 2.7 0 2.8-4.5 5.5-4.5 5.5z"
          fill="#FF8C61"
        />
      </g>
    </svg>
  </span>
);

export interface FullScreenNavigationLoaderProps {
  visible: boolean;
  fadingOut?: boolean;
  language: LanguageCode;
  labelAr?: string;
  labelEn?: string;
}

/**
 * Full-Screen Center-Screen Navigation Transition Loader.
 * Appears immediately on page/tab switch with an adorable walking toddler SVG,
 * glowing pulse rings, and a minimal progress bar, then smoothly fades out
 * the exact moment the new page finishes rendering.
 */
export const FullScreenNavigationLoader: React.FC<FullScreenNavigationLoaderProps> = ({
  visible,
  fadingOut = false,
  language,
  labelAr,
  labelEn,
}) => {
  if (!visible) return null;
  const isEn = language === 'en';
  const displayLabel = isEn
    ? labelEn || 'Opening Family Space...'
    : labelAr || 'جاري فتح القسم...';

  return (
    <div
      id="fullscreen-navigation-loader"
      data-testid="fullscreen-navigation-loader"
      role="status"
      aria-live="polite"
      aria-busy={!fadingOut}
      className={`fixed inset-0 z-[80] pointer-events-none flex flex-col items-center justify-center p-6 sm:p-10 transition-all duration-200 ease-out overflow-hidden ${
        fadingOut ? 'opacity-0 scale-98' : 'opacity-100 scale-100'
      }`}
      style={{
        backgroundColor: 'rgba(11, 19, 26, 0.88)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        backgroundImage:
          'radial-gradient(rgba(45, 212, 191, 0.16) 1.5px, transparent 1.5px), radial-gradient(rgba(255, 140, 97, 0.14) 1.5px, transparent 1.5px)',
        backgroundSize: '32px 32px',
        backgroundPosition: '0 0, 16px 16px',
      }}
    >
      <div className="w-[92vw] max-w-[420px] rounded-[36px] border border-white/80 dark:border-[#1E3646] bg-[#F8FAFC]/95 dark:bg-[#101D26]/95 px-8 py-9 sm:px-10 sm:py-10 shadow-[0_28px_64px_-12px_rgba(11,19,26,0.55)] flex flex-col items-center justify-center gap-5 text-center">
        <div className="relative flex items-center justify-center">
          <span
            aria-hidden="true"
            className="animate-nav-loader-pulse-ring absolute w-32 h-32 sm:w-36 sm:h-36 rounded-full bg-gradient-to-tr from-[#0d9488]/30 via-[#FF8C61]/25 to-[#FBBF24]/30"
          />
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-gradient-to-b from-amber-50/90 to-teal-50/80 dark:from-[#142430] dark:to-[#0B131A] border border-teal-500/25 dark:border-[#1E3646] flex items-center justify-center shadow-md">
            <PlayfulChildLoaderSvg size={96} />
          </div>
        </div>

        <div className="space-y-2.5 w-full pt-1">
          <div className="text-base sm:text-lg font-black text-[var(--color-text)] dark:text-[#F8FAFC] truncate">
            {displayLabel}
          </div>
          <p className="text-xs font-extrabold text-[#0d9488] dark:text-[#2DD4BF]">
            {isEn ? 'Growing Together with Love' : 'مساحة تجمعنا.. وبحبهم نكبر'}
          </p>

          {/* Enlarged Glowing Progress Indicator */}
          <div className="w-56 sm:w-64 mx-auto h-2.5 rounded-full bg-slate-200/85 dark:bg-[#142430] overflow-hidden shadow-inner">
            <div className="animate-nav-progress h-full w-full rounded-full bg-gradient-to-r from-[#0d9488] via-[#2DD4BF] to-[#FF8C61]" />
          </div>
        </div>
      </div>
    </div>
  );
};

export const SectionSkeletonLoader: React.FC<SectionSkeletonLoaderProps> = ({
  section,
  language,
}) => {
  const isEn = language === 'en';
  const sectionLabel =
    section === 'services'
      ? isEn
        ? 'Loading Family Store & Live Tracking...'
        : 'جاري تجهيز متجر الأسرة وخريطة التوصيل المباشر...'
      : section === 'medical'
      ? isEn
        ? 'Loading Verified Pediatricians & Records...'
        : 'جاري تجهيز أطباء الأطفال وسجل متابعة النمو...'
      : isEn
      ? 'Loading Parents Community Discussions...'
      : 'جاري تجهيز أحدث تجارب ونقاشات مجتمع الآباء والأمهات...';

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
      {/* Charming Animated Smiling Child SVG Loader Header */}
      <div className="rounded-2xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-surface)] dark:bg-[#101D26] px-4 py-3.5 flex flex-wrap items-center justify-between gap-3 shadow-2xs soft-card-surface">
        <div className="flex items-center gap-3 min-w-0">
          <PlayfulChildLoaderSvg size={44} />
          <div className="space-y-1.5 min-w-0">
            <div className="text-xs font-extrabold text-[var(--color-text)] flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-[var(--color-accent)] animate-ping shrink-0" />
              <span className="truncate">{sectionLabel}</span>
            </div>
            <div className="h-2.5 w-44 sm:w-56 rounded-full skeleton-shimmer" />
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="h-8 w-20 rounded-xl skeleton-shimmer" />
          <div className="h-8 w-24 rounded-xl skeleton-shimmer hidden sm:block" />
        </div>
      </div>

      {/* Hero Carousel Shimmer Block */}
      <div className="rounded-3xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-surface)] dark:bg-[#101D26] p-5 space-y-4 shadow-2xs">
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
      <div className="rounded-2xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-surface)] dark:bg-[#101D26] p-3.5 flex flex-wrap items-center justify-between gap-2 shadow-2xs">
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
            : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
        }
      >
        {Array.from({ length: cardCount }).map((_, idx) => (
          <div
            key={idx}
            className="rounded-2xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-surface)] dark:bg-[#101D26] p-4 space-y-3 shadow-2xs"
          >
            <div className="h-28 w-full rounded-xl skeleton-shimmer" />
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-1.5 flex-1">
                <div className="h-4 w-3/4 rounded-lg skeleton-shimmer" />
                <div className="h-3 w-1/2 rounded-md skeleton-shimmer" />
              </div>
              <div className="h-5 w-14 rounded-lg skeleton-shimmer shrink-0" />
            </div>
            <div className="pt-2 border-t border-[var(--color-border)]/60 dark:border-[#1E3646] flex items-center justify-between gap-2">
              <div className="h-5 w-20 rounded-lg skeleton-shimmer" />
              <div className="flex items-center gap-1.5">
                <div className="h-8 w-8 rounded-xl skeleton-shimmer" />
                <div className="h-8 w-8 rounded-xl skeleton-shimmer" />
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
      className={`soft-card-surface rounded-3xl border border-dashed ${toneClasses.card} bg-[var(--color-surface)] dark:bg-[#101D26] dark:border-[#1E3646] p-6 sm:p-8 text-center flex flex-col items-center justify-center gap-3.5 shadow-2xs animate-page-enter transition-all duration-300 ease-in-out`}
    >
      <div className="relative flex items-center justify-center transition-transform duration-300 ease-in-out hover:scale-105">
        <SoftFilledIcon id={iconId} boxSize="lg" />
      </div>

      <div className="space-y-1.5 max-w-md">
        <h4 className="text-sm sm:text-base font-extrabold text-[var(--color-text)] leading-snug">
          {title}
        </h4>
        {subtitle && (
          <p className="text-xs font-semibold text-[var(--color-muted)] leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>

      {(resolvedCtaLabel || secondaryCtaLabel) && (
        <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
          {resolvedCtaLabel && resolvedOnCta && (
            <PrimaryCtaButton variant="orange" size="sm" onClick={resolvedOnCta}>
              {resolvedCtaLabel}
            </PrimaryCtaButton>
          )}
          {secondaryCtaLabel && onSecondaryCtaClick && (
            <button
              type="button"
              onClick={onSecondaryCtaClick}
              className="min-h-[38px] px-4 py-1.5 rounded-xl text-[11.5px] font-extrabold border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-bg)] dark:bg-[#142430] text-[var(--color-text)] shadow-2xs hover:border-[var(--color-accent)] active:scale-95 transition-all duration-300 ease-in-out cursor-pointer"
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
      className={`soft-card-surface rounded-2xl sm:rounded-3xl border shadow-sm transition-all duration-300 ease-in-out overflow-hidden bg-[var(--color-surface)] dark:bg-[#101D26] dark:border-[#1E3646] ${cardToneClasses} ${className}`}
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
        className={`w-full p-4 sm:p-5 flex items-center justify-between gap-2.5 cursor-pointer select-none hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-all duration-300 ease-in-out ${headerClassName}`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {resolvedIcon && <div className="shrink-0">{resolvedIcon}</div>}
          <div className="min-w-0 space-y-0.5">
            <div className="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap no-scrollbar">
              <h3 className="text-xs sm:text-sm font-extrabold text-[var(--color-text)] truncate">
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
              <p className="text-[10px] font-semibold text-[var(--color-muted)] leading-snug line-clamp-1">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
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
            className={`w-7 h-7 rounded-xl bg-[var(--color-control-muted)] text-[var(--color-text)] border border-[var(--color-border)] flex items-center justify-center transition-transform duration-300 ease-in-out ${
              isExpanded
                ? 'rotate-180 bg-[var(--color-accent-soft)] text-[var(--color-role-text)] border-[var(--color-accent)]/30'
                : 'rotate-0'
            }`}
          >
            <svg
              className="w-3.5 h-3.5 fill-none stroke-current stroke-[2.5]"
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
          className="w-6 h-6 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-bold flex items-center justify-center shrink-0 transition-all duration-300 ease-in-out cursor-pointer"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export interface MasterPatternCardProps {
  id?: string;
  testId?: string;
  tone?: PastelTone;
  categoryKey?: string;
  customImageUrl?: string;
  itemIdOrIndex?: number;
  darkMode?: boolean;
  topLeftBadge: React.ReactNode;
  topRightBadge?: React.ReactNode;
  title: React.ReactNode;
  titlePrefixSlot?: React.ReactNode;
  titleRightSlot?: React.ReactNode;
  metaLeft?: React.ReactNode;
  metaRightAction?: React.ReactNode;
  bodyContent?: React.ReactNode;
  footerLeft?: React.ReactNode;
  footerRight?: React.ReactNode;
  children?: React.ReactNode;
  onThumbnailClick?: () => void;
  className?: string;
  thumbnailClassName?: string;
}

/**
 * Canonical Master Surface Card Component for نكبر (Nekbaar).
 * Propagates the Store Product Card reference architecture universally:
 * - Clean soft-surface outer container (`rounded-3xl p-3 sm:p-3.5 soft-card-surface`)
 * - Structured top image thumbnail (`rounded-2xl p-2.5 sm:p-3`) with stock photo, directional gradient scrim,
 *   category badge (`image-card-badge`), rating/metric badge (`image-card-rating-pill`), and frosted title bar (`image-card-glass-panel`)
 * - Structured metadata row (`📍 Location · Details`)
 * - Hairline-divided footer (`pt-2.5 border-t`) for price/status and interactive action buttons.
 */
export const MasterPatternCard: React.FC<MasterPatternCardProps> = ({
  id,
  testId,
  tone = 'teal',
  categoryKey = 'store',
  customImageUrl,
  itemIdOrIndex = 0,
  darkMode,
  topLeftBadge,
  topRightBadge,
  title,
  titlePrefixSlot,
  titleRightSlot,
  metaLeft,
  metaRightAction,
  bodyContent,
  footerLeft,
  footerRight,
  children,
  onThumbnailClick,
  className = '',
  thumbnailClassName = '',
}) => {
  const [domDark, setDomDark] = useState<boolean>(() =>
    typeof document !== 'undefined'
      ? document.documentElement.getAttribute('data-color-mode') === 'dark' ||
        document.documentElement.classList.contains('dark')
      : false
  );

  useEffect(() => {
    if (typeof document === 'undefined' || darkMode !== undefined) return;
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
  }, [darkMode]);

  const [showMetaDetails, setShowMetaDetails] = useState<boolean>(false);
  const isDark = darkMode !== undefined ? darkMode : domDark;
  const toneClasses = PASTEL_CARD_TONES[tone] || PASTEL_CARD_TONES.teal;
  const resolvedStockUrl = customImageUrl || getProductUnsplashImageUrl(categoryKey, itemIdOrIndex);
  const bgSpec = getCardBackgroundSpec(categoryKey, isDark, resolvedStockUrl);

  return (
    <article
      id={id}
      data-testid={testId}
      data-master-card="true"
      className={`rounded-2xl sm:rounded-3xl border ${toneClasses.card} bg-[var(--color-surface)] dark:bg-[#101D26] dark:border-[#1E3646] p-4 sm:p-5 flex flex-col justify-between gap-2 soft-card-surface shadow-sm hover:shadow-md hover:scale-[1.005] active:scale-[0.99] transition-all group ${className}`}
    >
      <div className="space-y-1.5" data-card-layer="1-core">
        {/* Structured Top Image Thumbnail */}
        <div
          onClick={onThumbnailClick}
          role={onThumbnailClick ? 'button' : undefined}
          tabIndex={onThumbnailClick ? 0 : undefined}
          onKeyDown={
            onThumbnailClick
              ? (e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onThumbnailClick();
                  }
                }
              : undefined
          }
          data-image-card="true"
          style={{ backgroundImage: bgSpec.backgroundImageCss }}
          className={`image-bg-card relative overflow-hidden rounded-xl p-2.5 min-h-[82px] sm:min-h-[90px] flex flex-col justify-between gap-1 shadow-2xs ${
            onThumbnailClick ? 'cursor-pointer' : ''
          } ${thumbnailClassName}`}
        >
          <img
            src={resolvedStockUrl}
            alt={typeof title === 'string' ? title : ''}
            loading="lazy"
            decoding="async"
            onError={(e) => {
              const target = e.currentTarget;
              if (target.src !== bgSpec.imagePath) {
                target.src = bgSpec.imagePath;
              }
            }}
            className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-85 dark:opacity-80 group-hover:scale-105 transition-transform duration-500"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none"
            style={{
              background: isDark
                ? 'linear-gradient(to top, rgba(11, 19, 26, 0.95) 0%, rgba(16, 29, 38, 0.62) 52%, rgba(11, 19, 26, 0.28) 100%)'
                : 'linear-gradient(to top, rgba(255, 255, 255, 0.94) 0%, rgba(248, 250, 252, 0.65) 50%, rgba(255, 255, 255, 0.22) 100%)',
            }}
          />

          <div className="relative z-10 flex items-center justify-between gap-1.5 min-w-0">
            <span className="image-card-badge px-1.5 py-0.5 rounded-full text-[8.5px] font-extrabold truncate shadow-2xs inline-flex items-center gap-1 max-w-[68%]">
              <span className="truncate inline-flex items-center gap-1">{topLeftBadge}</span>
            </span>
            {topRightBadge && (
              <span
                data-keep-dark-text="true"
                className="image-card-rating-pill px-1.5 py-0.5 rounded-full text-[8.5px] font-extrabold tabular-nums shrink-0 inline-flex items-center gap-0.5 shadow-2xs"
              >
                {topRightBadge}
              </span>
            )}
          </div>

          <div className="relative z-10 image-card-glass-panel rounded-lg px-2 py-1 flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              {titlePrefixSlot && <div className="shrink-0">{titlePrefixSlot}</div>}
              <h3 className="image-card-title text-[11.5px] sm:text-xs font-extrabold leading-tight line-clamp-1">
                {title}
              </h3>
            </div>
            {titleRightSlot ? (
              <div className="shrink-0">{titleRightSlot}</div>
            ) : metaLeft ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMetaDetails((prev) => !prev);
                }}
                aria-expanded={showMetaDetails}
                className="px-1.5 py-0.5 rounded-md bg-black/15 dark:bg-white/10 text-[9px] font-extrabold text-[var(--color-text)] dark:text-[#A5F3FC] hover:opacity-90 shrink-0 cursor-pointer"
              >
                {showMetaDetails ? '▴' : 'ℹ️'}
              </button>
            ) : null}
          </div>
        </div>

        {/* Layer 3 (Metadata & Tags Carousel): Hidden by default, revealed only on explicit user trigger */}
        {showMetaDetails && (metaLeft || metaRightAction) && (
          <div
            data-card-layer="3-metadata-carousel"
            className="flex items-center justify-between gap-2 text-[9.5px] font-bold text-[var(--color-muted)] px-0.5 min-w-0 animate-fade-in"
          >
            <div className="flex items-center gap-1.5 min-w-0 flex-1 overflow-x-auto whitespace-nowrap no-scrollbar py-0.5">
              {metaLeft}
            </div>
            {metaRightAction && <div className="shrink-0 ms-auto">{metaRightAction}</div>}
          </div>
        )}

        {/* Optional Body Content */}
        {bodyContent && (
          <div className="text-[10px] font-semibold text-[var(--color-muted)] dark:text-[#CBD5E1] leading-snug px-0.5">
            {bodyContent}
          </div>
        )}
      </div>

      {/* Layer 2 (Action Footer): Fixed, non-overlapping horizontal action row for primary buttons */}
      {(footerLeft || footerRight) && (
        <div
          data-card-layer="2-action-footer"
          className="pt-2.5 border-t border-[var(--color-border)]/70 dark:border-[#1E3646] flex items-center justify-between gap-2 min-w-0"
        >
          <div className="min-w-0 flex-1 truncate">{footerLeft}</div>
          <div className="flex items-center justify-end gap-1.5 shrink-0 ms-auto">
            {footerRight}
          </div>
        </div>
      )}

      {children}
    </article>
  );
};

export interface TaskFestivalCelebrationProps {
  celebration: {
    id: number;
    titleAr: string;
    titleEn: string;
    subtitleAr?: string;
    subtitleEn?: string;
  } | null;
  language: LanguageCode;
}

const FESTIVAL_PARTICLES: Array<{
  left: string;
  tx: string;
  delay: string;
  glyph: string;
  color: string;
}> = [
  { left: '12%', tx: '-24px', delay: '0ms', glyph: '⭐', color: '#F59E0B' },
  { left: '22%', tx: '18px', delay: '60ms', glyph: '✨', color: '#0D9488' },
  { left: '32%', tx: '-16px', delay: '110ms', glyph: '💛', color: '#FF8C61' },
  { left: '42%', tx: '22px', delay: '30ms', glyph: '🌟', color: '#FBBF24' },
  { left: '50%', tx: '-10px', delay: '80ms', glyph: '🎉', color: '#2DD4BF' },
  { left: '58%', tx: '26px', delay: '40ms', glyph: '⭐', color: '#F59E0B' },
  { left: '68%', tx: '-20px', delay: '95ms', glyph: '🧡', color: '#FF8C61' },
  { left: '78%', tx: '16px', delay: '50ms', glyph: '✨', color: '#14B8A6' },
  { left: '88%', tx: '-22px', delay: '120ms', glyph: '🌟', color: '#FBBF24' },
];

/**
 * Performance-optimized Task & Goal Completion "Festival" Celebration Overlay.
 * Renders floating glowing stars, hearts, and confetti particles with a joyful pill banner.
 */
export const TaskFestivalCelebrationOverlay: React.FC<TaskFestivalCelebrationProps> = ({
  celebration,
  language,
}) => {
  if (!celebration) return null;
  const isEn = language === 'en';

  return (
    <div
      key={celebration.id}
      id="task-festival-celebration"
      data-testid="task-festival-celebration"
      aria-live="polite"
      className="fixed inset-0 z-[85] pointer-events-none overflow-hidden flex flex-col items-center justify-start pt-18 sm:pt-20 px-4"
    >
      {/* Joyful Spring Pill Banner */}
      <div className="animate-festival-banner rounded-2xl border border-amber-300/90 dark:border-amber-400/50 bg-white/95 dark:bg-[#142430]/95 backdrop-blur-md px-4 py-2.5 shadow-[0_16px_36px_-8px_rgba(245,158,11,0.35)] flex items-center gap-2.5 max-w-md">
        <span className="w-8 h-8 rounded-xl bg-amber-400/20 border border-amber-400/50 flex items-center justify-center text-base shrink-0">
          🏆
        </span>
        <div className="min-w-0 text-start">
          <div className="text-xs font-black text-[var(--color-text)] dark:text-[#F8FAFC] truncate">
            {isEn ? celebration.titleEn : celebration.titleAr}
          </div>
          {(celebration.subtitleAr || celebration.subtitleEn) && (
            <div className="text-[10px] font-bold text-[#0d9488] dark:text-[#A5F3FC] truncate">
              {isEn ? celebration.subtitleEn : celebration.subtitleAr}
            </div>
          )}
        </div>
      </div>

      {/* Floating Glowing Stars, Hearts & Confetti Particles */}
      <div className="relative w-full max-w-lg h-44 mt-6">
        {FESTIVAL_PARTICLES.map((p, idx) => (
          <span
            key={idx}
            aria-hidden="true"
            style={
              {
                left: p.left,
                bottom: '0px',
                animationDelay: p.delay,
                color: p.color,
                '--tx': p.tx,
              } as React.CSSProperties
            }
            className="animate-festival-particle absolute text-lg sm:text-xl select-none drop-shadow-xs"
          >
            {p.glyph}
          </span>
        ))}
      </div>
    </div>
  );
};

export type FamilyMoodId = 'calm' | 'excited' | 'cozy' | 'focused';

export interface FamilyMoodBarometerProps {
  language: LanguageCode;
  darkMode?: boolean;
  onSelectMood?: (moodId: FamilyMoodId, message: string) => void;
}

const FAMILY_MOOD_OPTIONS: Array<{
  id: FamilyMoodId;
  emoji: string;
  labelAr: string;
  labelEn: string;
  vibeAr: string;
  vibeEn: string;
}> = [
  {
    id: 'calm',
    emoji: '😊',
    labelAr: 'هادئ وممتن',
    labelEn: 'Calm & Grateful',
    vibeAr: 'جو البيت هادئ ومريح النهارده — وقت لطيف لحكاية قصيرة مع الأولاد',
    vibeEn: 'Calm & peaceful family vibe today — great time for a cozy story',
  },
  {
    id: 'excited',
    emoji: '🤩',
    labelAr: 'نشيط ومتحمس',
    labelEn: 'Joyful & Active',
    vibeAr: 'طاقة حلوة وحماس في البيت! مثالي لأنشطة اللعب والتحديات السريعة',
    vibeEn: 'High energy & smiles! Perfect for interactive play and milestones',
  },
  {
    id: 'cozy',
    emoji: '🧸',
    labelAr: 'دافئ وحنون',
    labelEn: 'Cozy & Cuddly',
    vibeAr: 'مود دافئ وحنون — حضن كبير للأولاد وروتين مسائي هادئ',
    vibeEn: 'Warm & cuddly mood — extra hugs and a gentle evening routine',
  },
  {
    id: 'focused',
    emoji: '🌿',
    labelAr: 'تركيز وروقان',
    labelEn: 'Focused & Zen',
    vibeAr: 'تركيز وترتيب مريح — يوم مناسب لإنجاز مهام الروتين خطوة بخطوة',
    vibeEn: 'Focused & organized — ideal for checking off daily routine goals',
  },
];

/**
 * Interactive Family Mood Barometer Widget (😊 / 🤩 / 🧸 / 🌿).
 * Lets parents set the family's daily vibe with instant visual & emotional feedback.
 */
export const FamilyMoodBarometer: React.FC<FamilyMoodBarometerProps> = ({
  language,
  onSelectMood,
}) => {
  const isEn = language === 'en';
  const [selectedMood, setSelectedMood] = useState<FamilyMoodId>(() => {
    try {
      const saved = window.localStorage.getItem('nekbaar_family_mood_v1');
      if (saved === 'calm' || saved === 'excited' || saved === 'cozy' || saved === 'focused') {
        return saved;
      }
    } catch {
      // ignore storage errors
    }
    return 'calm';
  });

  const activeMoodObj =
    FAMILY_MOOD_OPTIONS.find((m) => m.id === selectedMood) || FAMILY_MOOD_OPTIONS[0];

  const handleChooseMood = (opt: (typeof FAMILY_MOOD_OPTIONS)[number]) => {
    setSelectedMood(opt.id);
    try {
      window.localStorage.setItem('nekbaar_family_mood_v1', opt.id);
    } catch {
      // ignore storage errors
    }
    onSelectMood?.(opt.id, `${opt.emoji} ${isEn ? opt.vibeEn : opt.vibeAr}`);
  };

  const energyGaugePercent =
    selectedMood === 'excited'
      ? 96
      : selectedMood === 'focused'
      ? 84
      : selectedMood === 'calm'
      ? 68
      : 48;

  // Needle angle from -90deg (leftmost 0%) to +90deg (rightmost 100%)
  const needleAngleDeg = Math.round((energyGaugePercent / 100) * 180 - 90);
  // Semicircle arc path length for radius 80 is pi * 80 ≈ 251.3
  const arcTotalLen = 251.3;
  const arcActiveLen = (energyGaugePercent / 100) * arcTotalLen;

  return (
    <div
      id="family-mood-barometer"
      data-testid="family-mood-barometer"
      className="rounded-3xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-surface)] dark:bg-[#101D26] p-5 sm:p-6 soft-card-surface shadow-sm"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
        {/* Left/Start Column: Interactive Half-Circle Speedometer / Gauge Widget (SVG) */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center rounded-2xl border border-[var(--color-border)]/70 dark:border-[#1E3646] bg-[var(--color-control-muted)]/35 dark:bg-[#0B131A]/70 p-4">
          <div className="relative w-full max-w-[250px] flex flex-col items-center">
            <svg
              data-testid="half-circle-energy-gauge-svg"
              viewBox="0 0 220 128"
              className="w-full h-auto overflow-visible select-none"
              role="img"
              aria-label={
                isEn
                  ? `Family Energy & Mood Gauge: ${energyGaugePercent}%`
                  : `عدّاد طاقة ومود العيلة النصف دائري: ${energyGaugePercent}٪`
              }
            >
              <defs>
                {/* Smooth Color Grading: Green 🌿 -> Yellow ⚡ -> Orange/Red 🔥 */}
                <linearGradient id="nekbaarHalfCircleGaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10B981" />
                  <stop offset="35%" stopColor="#34D399" />
                  <stop offset="62%" stopColor="#FBBF24" />
                  <stop offset="84%" stopColor="#FF8C61" />
                  <stop offset="100%" stopColor="#EF4444" />
                </linearGradient>
                <filter id="gaugeNeedleShadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.28" />
                </filter>
              </defs>

              {/* Subtle Outer Scale Ticks */}
              {[-75, -45, -15, 15, 45, 75].map((deg) => {
                const rad = ((deg - 90) * Math.PI) / 180;
                const x1 = 110 + 91 * Math.cos(rad);
                const y1 = 106 + 91 * Math.sin(rad);
                const x2 = 110 + 97 * Math.cos(rad);
                const y2 = 106 + 97 * Math.sin(rad);
                return (
                  <line
                    key={deg}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    className="text-slate-300 dark:text-slate-600"
                  />
                );
              })}

              {/* Background Track Arc */}
              <path
                d="M 30 106 A 80 80 0 0 1 190 106"
                fill="none"
                stroke="currentColor"
                strokeWidth="16"
                strokeLinecap="round"
                className="text-slate-200/90 dark:text-[#142430]"
              />

              {/* Full Color-Graded Reference Track (Soft Opacity) */}
              <path
                d="M 30 106 A 80 80 0 0 1 190 106"
                fill="none"
                stroke="url(#nekbaarHalfCircleGaugeGrad)"
                strokeWidth="16"
                strokeLinecap="round"
                strokeOpacity="0.25"
              />

              {/* Active Color-Graded Foreground Arc */}
              <path
                d="M 30 106 A 80 80 0 0 1 190 106"
                fill="none"
                stroke="url(#nekbaarHalfCircleGaugeGrad)"
                strokeWidth="16"
                strokeLinecap="round"
                strokeDasharray={`${arcActiveLen} ${arcTotalLen}`}
                style={{
                  transition: 'stroke-dasharray 600ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}
              />

              {/* Zone Emoji Indicators along the Half-Circle */}
              <text x="16" y="122" textAnchor="middle" className="text-[11px] font-black fill-emerald-600 dark:fill-emerald-400">
                🌿
              </text>
              <text x="110" y="14" textAnchor="middle" className="text-[11px] font-black fill-amber-500">
                ⚡
              </text>
              <text x="204" y="122" textAnchor="middle" className="text-[11px] font-black fill-rose-500">
                🔥
              </text>

              {/* Sleek Interactive Needle / Pointer Anchored at (110, 106) */}
              <g
                data-testid="half-circle-gauge-needle"
                filter="url(#gaugeNeedleShadow)"
                style={{
                  transform: `rotate(${needleAngleDeg}deg)`,
                  transformOrigin: '110px 106px',
                  transition: 'transform 600ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}
              >
                {/* Needle Tapered Shaft */}
                <polygon
                  points="106.5,106 110,36 113.5,106"
                  fill="#0F766E"
                  className="dark:fill-[#2DD4BF]"
                />
                {/* Needle Glowing Tip */}
                <circle cx="110" cy="39" r="3.5" fill="#FF8C61" />
              </g>

              {/* Center Pivot Cap */}
              <circle
                cx="110"
                cy="106"
                r="10"
                fill="#0B131A"
                className="dark:fill-[#F8FAFC]"
              />
              <circle cx="110" cy="106" r="4.5" fill="#FF8C61" />
            </svg>

            {/* Digital Readout Under Half-Circle Gauge */}
            <div className="mt-1 flex items-center justify-between w-full px-2 text-[11px] font-extrabold">
              <button
                type="button"
                onClick={() => handleChooseMood(FAMILY_MOOD_OPTIONS[2])}
                className="text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
              >
                🌿 {isEn ? 'Calm' : 'هدوء'}
              </button>
              <span className="px-3 py-0.5 rounded-full bg-teal-500/12 text-[#0d9488] dark:text-[#2DD4BF] border border-teal-500/25 text-xs font-black tabular-nums">
                {energyGaugePercent}% · {isEn ? activeMoodObj.labelEn : activeMoodObj.labelAr}
              </span>
              <button
                type="button"
                onClick={() => handleChooseMood(FAMILY_MOOD_OPTIONS[1])}
                className="text-[#E86A3D] dark:text-[#FF8C61] hover:underline cursor-pointer"
              >
                🔥 {isEn ? 'Peak Energy' : 'ذروة الحماس'}
              </button>
            </div>
          </div>
        </div>

        {/* Right/End Column: Mood Context & Interactive Selector Buttons */}
        <div className="lg:col-span-7 space-y-3.5">
          <div className="flex items-start gap-3">
            <span className="w-12 h-12 rounded-2xl bg-amber-400/15 dark:bg-[#142430] border border-amber-400/35 dark:border-[#1E3646] flex items-center justify-center text-2xl shrink-0 shadow-2xs">
              {activeMoodObj.emoji}
            </span>
            <div className="space-y-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm sm:text-base font-black text-[var(--color-text)] dark:text-[#F8FAFC]">
                  {isEn ? 'Interactive Family Energy & Mood Gauge' : 'عدّاد طاقة ومود العيلة النصف دائري'}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 text-[10.5px] font-black">
                  {isEn ? activeMoodObj.labelEn : activeMoodObj.labelAr}
                </span>
              </div>
              <p className="text-xs font-semibold text-[var(--color-muted)] dark:text-[#CBD5E1] leading-relaxed">
                {isEn ? activeMoodObj.vibeEn : activeMoodObj.vibeAr}
              </p>
            </div>
          </div>

          <div
            role="radiogroup"
            aria-label={isEn ? 'Select Family Daily Mood' : 'اختر مود العيلة اليوم'}
            className="grid grid-cols-2 sm:grid-cols-4 gap-2"
          >
            {FAMILY_MOOD_OPTIONS.map((opt) => {
              const isSelected = opt.id === selectedMood;
              return (
                <button
                  key={opt.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  data-testid={`mood-option-${opt.id}`}
                  onClick={() => handleChooseMood(opt)}
                  className={`min-h-[42px] px-3 py-2 rounded-2xl text-xs font-extrabold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-[#0d9488] text-white border-[#0d9488] shadow-sm scale-[1.02]'
                      : 'bg-[var(--color-control-muted)] dark:bg-[#142430] text-[var(--color-text)] dark:text-[#F8FAFC] border-[var(--color-border)] dark:border-[#1E3646] hover:border-[#FF8C61]'
                  }`}
                >
                  <span className="text-sm leading-none">{opt.emoji}</span>
                  <span className="truncate">{isEn ? opt.labelEn : opt.labelAr}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export interface StarOfTheDayCrownBadgeProps {
  language: LanguageCode;
  completedCount?: number;
  onClick?: () => void;
}

/**
 * Glowing "Star of the Day" Crown & Star Micro-Animation Badge for Child Profile Cards.
 */
export const StarOfTheDayCrownBadge: React.FC<StarOfTheDayCrownBadgeProps> = ({
  language,
  completedCount = 1,
  onClick,
}) => {
  const isEn = language === 'en';
  return (
    <span
      onClick={(e) => {
        if (onClick) {
          e.stopPropagation();
          onClick();
        }
      }}
      data-testid="star-of-the-day-badge"
      className={`animate-star-crown-badge inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-300 text-slate-950 border border-amber-500/70 shadow-xs select-none whitespace-nowrap ${
        onClick ? 'cursor-pointer' : ''
      }`}
      title={
        isEn
          ? `Star of the Day (${completedCount} milestone${completedCount === 1 ? '' : 's'} completed)`
          : `نجم اليوم (${completedCount} إنجاز مكتمل اليوم)`
      }
    >
      <span aria-hidden="true" className="text-[10px] leading-none">
        👑
      </span>
      <span>{isEn ? 'Star of the Day' : 'نجم اليوم'}</span>
      {completedCount > 0 && (
        <span className="px-1 rounded-full bg-amber-950/15 text-[8.5px] tabular-nums">
          ★ {completedCount}
        </span>
      )}
    </span>
  );
};

export interface InteractiveSplashScreenProps {
  visible: boolean;
  fadingOut?: boolean;
  language: LanguageCode;
  darkMode?: boolean;
  onSkipOrFinish: () => void;
}

const SPLASH_VALUE_PROPOSITIONS: Array<{
  id: string;
  badgeAr: string;
  badgeEn: string;
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
  icon: string;
}> = [
  {
    id: 'vp-smart',
    badgeAr: '✨ رعاية ذكية متكاملة',
    badgeEn: '✨ Smart Family Care',
    titleAr: 'رفيقك الذكي لتربية صحية',
    titleEn: 'Your Smart Companion for Healthy Parenting',
    descAr: 'خطط يومية مخصصة، متابعة نمو ثلاثية الأبعاد، ومساعد ذكي يفهم احتياجات طفلك من يوم لـ ٨ سنين.',
    descEn: 'Personalized daily plans, 3D growth tracking, and a smart AI assistant for ages 0–8.',
    icon: '🧸',
  },
  {
    id: 'vp-all-in-one',
    badgeAr: '🏡 منظومة العيلة الشاملة',
    badgeEn: '🏡 All-in-One Family Hub',
    titleAr: 'كل احتياجات أسرتك في مكان واحد',
    titleEn: 'All Your Family Needs in One Place',
    descAr: 'روتين يومي، تقويم مشترك، شات العيلة، ريلز تربوية، وألعاب مونتيسوري وتنمية مهارات.',
    descEn: 'Daily routines, shared calendar, family chat, parenting reels, and Montessori toys.',
    icon: '🌟',
  },
  {
    id: 'vp-trusted',
    badgeAr: '🩺 شبكة موثوقة ومعتمدة',
    badgeEn: '🩺 Verified & Trusted Network',
    titleAr: 'دكاترة، حضانات ومتاجر موثوقة',
    titleEn: 'Verified Doctors, Nurseries & Trusted Stores',
    descAr: 'احجز أقرب دكتور أطفال أو حضانة معتمدة واطلب مستلزمات طفلك بتوصيل سريع لباب البيت.',
    descEn: 'Book top pediatricians & verified nurseries or order baby essentials with express delivery.',
    icon: '🚀',
  },
];

/**
 * 4-Second Interactive Opening / Splash Intro Screen for نكبر (Nekbaar).
 * Features warm glassmorphic gradients, central animated child SVG, cycling value-proposition subtitles,
 * interactive pill selector, and a touch-friendly "تخطي / Skip" button.
 */
export const InteractiveSplashScreen: React.FC<InteractiveSplashScreenProps> = ({
  visible,
  fadingOut = false,
  language,
  darkMode = false,
  onSkipOrFinish,
}) => {
  const isEn = language === 'en';
  const [activeSlideIdx, setActiveSlideIdx] = useState(0);

  useEffect(() => {
    if (!visible) return;
    setActiveSlideIdx(0);
    const interval = window.setInterval(() => {
      setActiveSlideIdx((prev) => (prev + 1) % SPLASH_VALUE_PROPOSITIONS.length);
    }, 2000);
    return () => window.clearInterval(interval);
  }, [visible]);

  if (!visible) return null;

  const currentSlide =
    SPLASH_VALUE_PROPOSITIONS[activeSlideIdx] || SPLASH_VALUE_PROPOSITIONS[0];

  return (
    <div
      id="nekbaar-interactive-splash-screen"
      data-testid="nekbaar-interactive-splash-screen"
      dir={isEn ? 'ltr' : 'rtl'}
      role="dialog"
      aria-modal="true"
      aria-label={isEn ? 'Welcome to Nekbaar' : 'مرحباً بك في نكبر'}
      className={`fixed inset-0 z-[130] w-screen h-screen flex flex-col items-center justify-between p-5 sm:p-8 overflow-hidden select-none transition-opacity duration-300 ${
        fadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{
        background: darkMode
          ? 'radial-gradient(rgba(45, 212, 191, 0.14) 1.5px, transparent 1.5px), radial-gradient(circle at 50% 22%, rgba(13, 148, 136, 0.3) 0%, rgba(255, 140, 97, 0.18) 38%, rgba(11, 19, 26, 0.98) 82%), #0B131A'
          : 'radial-gradient(rgba(13, 148, 136, 0.13) 1.5px, transparent 1.5px), radial-gradient(circle at 50% 22%, rgba(254, 243, 199, 0.88) 0%, rgba(204, 251, 241, 0.68) 45%, rgba(248, 250, 252, 0.98) 88%), #F8FAFC',
        backgroundSize: '28px 28px, 100% 100%',
      }}
    >
      {/* Ambient Floating Decorative Glow Blobs */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -start-24 w-72 h-72 rounded-full bg-teal-400/20 dark:bg-teal-500/15 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -end-24 w-80 h-80 rounded-full bg-orange-400/20 dark:bg-orange-500/15 blur-3xl"
      />

      {/* Top Row: Brand Pill & Interactive Skip Button */}
      <div className="relative z-10 w-full max-w-xl flex items-center justify-between gap-3 pt-1">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-teal-500/30 bg-white/85 dark:bg-[#101D26]/90 backdrop-blur-md shadow-xs">
          <span className="w-2.5 h-2.5 rounded-full bg-[#0d9488] animate-ping" />
          <span className="text-xs sm:text-sm font-extrabold text-[#0d9488] dark:text-[#2DD4BF]">
            {isEn ? 'Super Family Platform · Ages 0–8' : 'منصة الأسرة الذكية · من يوم لـ ٨ سنوات'}
          </span>
        </div>

        <button
          id="splash-skip-btn"
          data-testid="splash-skip-btn"
          type="button"
          onClick={onSkipOrFinish}
          className="min-h-[44px] px-5 py-2 rounded-full border border-[var(--color-border)] dark:border-[#1E3646] bg-white/95 dark:bg-[#142430]/95 hover:bg-[#0d9488] hover:text-white dark:hover:bg-[#0d9488] text-xs sm:text-sm font-extrabold text-[var(--color-text)] dark:text-[#F8FAFC] shadow-sm backdrop-blur-md transition-all active:scale-95 cursor-pointer inline-flex items-center gap-1.5"
        >
          <span>{isEn ? 'Skip (6s)' : 'تخطي'}</span>
          <span aria-hidden="true">{isEn ? '→' : '←'}</span>
        </button>
      </div>

      {/* Center Stage: Enlarged Mobile-First Glassmorphic Showcase Card */}
      <div className="relative z-10 w-full max-w-xl my-auto rounded-[36px] border border-white/85 dark:border-[#1E3646] bg-white/90 dark:bg-[#101D26]/92 backdrop-blur-xl px-6 py-8 sm:px-10 sm:py-10 shadow-[0_28px_70px_-15px_rgba(13,148,136,0.3)] dark:shadow-[0_28px_70px_-15px_rgba(0,0,0,0.8)] flex flex-col items-center text-center space-y-6">
        {/* Enlarged Animated Playful Child SVG with Warm Glowing Aura */}
        <div className="relative flex items-center justify-center">
          <span
            aria-hidden="true"
            className="animate-nav-loader-pulse-ring absolute w-36 h-36 sm:w-40 sm:h-40 rounded-full bg-gradient-to-tr from-[#0d9488]/28 via-[#FF8C61]/25 to-[#FBBF24]/30"
          />
          <div className="relative w-32 h-32 sm:w-36 sm:h-36 rounded-[32px] bg-gradient-to-b from-amber-50/95 to-teal-50/85 dark:from-[#142430] dark:to-[#0B131A] border-2 border-amber-200/80 dark:border-[#1E3646] flex items-center justify-center shadow-lg">
            <PlayfulChildLoaderSvg size={110} />
          </div>
        </div>

        {/* Primary Brand Identity & Official Slogan */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2.5 justify-center">
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-[#0f766e] dark:text-[#2DD4BF]">
              {isEn ? 'Nekbaar' : 'نكبر'}
            </h1>
            <span className="px-3 py-1 rounded-full text-xs sm:text-sm font-black bg-[#FF8C61]/15 text-[#E86A3D] dark:text-[#FF8C61] border border-[#FF8C61]/30">
              {isEn ? 'نكبر' : 'Nekbaar'}
            </span>
          </div>
          <p className="text-sm sm:text-base font-black text-[var(--color-text)] dark:text-[#F8FAFC]">
            {isEn ? 'Growing Together with Love' : 'مساحة تجمعنا.. وبحبهم نكبر'}
          </p>
        </div>

        {/* Cycling Value Proposition Card with Smooth Keyed Fade Transition */}
        <div
          key={currentSlide.id}
          className="w-full rounded-3xl border border-teal-500/25 dark:border-[#1E3646] bg-gradient-to-br from-teal-50/80 via-white to-amber-50/70 dark:from-[#142430] dark:via-[#101D26] dark:to-[#142430] p-5 sm:p-6 space-y-2 animate-page-enter min-h-[146px] flex flex-col items-center justify-center shadow-xs"
        >
          <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-[#0d9488]/12 text-[#0f766e] dark:text-[#5EEAD4]">
            {isEn ? currentSlide.badgeEn : currentSlide.badgeAr}
          </span>
          <h2 className="text-base sm:text-lg font-black text-[var(--color-text)] dark:text-[#F8FAFC]">
            {currentSlide.icon} {isEn ? currentSlide.titleEn : currentSlide.titleAr}
          </h2>
          <p className="text-xs sm:text-sm font-semibold text-[var(--color-muted)] dark:text-[#CBD5E1] leading-relaxed max-w-md">
            {isEn ? currentSlide.descEn : currentSlide.descAr}
          </p>
        </div>

        {/* Interactive Slide Dots + 4-Second Progress Bar */}
        <div className="w-full space-y-3.5 pt-1">
          <div className="flex items-center justify-center gap-2.5">
            {SPLASH_VALUE_PROPOSITIONS.map((sl, idx) => {
              const isActive = idx === activeSlideIdx;
              return (
                <button
                  key={sl.id}
                  type="button"
                  onClick={() => setActiveSlideIdx(idx)}
                  aria-label={isEn ? sl.titleEn : sl.titleAr}
                  className={`h-2.5 rounded-full transition-all cursor-pointer ${
                    isActive
                      ? 'w-9 bg-[#0d9488] dark:bg-[#2DD4BF]'
                      : 'w-2.5 bg-slate-300 dark:bg-slate-700 hover:bg-teal-400'
                  }`}
                />
              );
            })}
          </div>

          <div className="w-full h-2 rounded-full bg-slate-200/85 dark:bg-[#142430] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#0d9488] via-[#FF8C61] to-[#FBBF24] transition-all duration-500"
              style={{ width: `${((activeSlideIdx + 1) / SPLASH_VALUE_PROPOSITIONS.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Bottom Enter CTA */}
      <div className="relative z-10 w-full max-w-xl flex items-center justify-center pb-1">
        <button
          type="button"
          onClick={onSkipOrFinish}
          className="w-full min-h-[52px] py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#0d9488] to-[#0f766e] hover:from-[#0f766e] hover:to-[#115e59] text-white font-black text-sm sm:text-base shadow-lg transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2"
        >
          <span>
            {isEn ? 'Enter Nekbaar Now' : 'ابدأ رحلتك الآن في نكبر'}
          </span>
          <span aria-hidden="true">✨</span>
        </button>
      </div>
    </div>
  );
};



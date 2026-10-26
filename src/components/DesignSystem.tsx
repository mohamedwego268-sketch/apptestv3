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

export const SectionSkeletonLoader: React.FC<SectionSkeletonLoaderProps> = ({
  section,
  language,
}) => {
  const isEn = language === 'en';
  const sectionLabel =
    section === 'services'
      ? isEn
        ? 'Loading Family Store & Live Tracking...'
        : 'جاري تحميل منتجات متجر الأسرة وخريطة التوصيل المباشر...'
      : section === 'medical'
      ? isEn
        ? 'Loading Verified Pediatricians & Records...'
        : 'جاري تحميل قائمة أطباء الأطفال وسجل متابعة النمو...'
      : isEn
      ? 'Loading Parents Community Discussions...'
      : 'جاري تحميل أحدث تجارب ونقاشات مجتمع الآباء والأمهات...';

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
      <div className="rounded-2xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-surface)] dark:bg-[#101D26] px-4 py-3.5 flex items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-xl skeleton-shimmer shrink-0" />
          <div className="space-y-1.5">
            <div className="text-xs font-extrabold text-[var(--color-text)] flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-[var(--color-accent)] animate-ping" />
              <span>{sectionLabel}</span>
            </div>
            <div className="h-2.5 w-48 rounded-full skeleton-shimmer" />
          </div>
        </div>
        <div className="flex items-center gap-2">
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
      <div className="space-y-1.5">
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
            {titleRightSlot && <div className="shrink-0">{titleRightSlot}</div>}
          </div>
        </div>

        {/* Compact Metadata Strip */}
        {(metaLeft || metaRightAction) && (
          <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-[9.5px] font-bold text-[var(--color-muted)] px-0.5">
            <div className="flex items-center gap-1 min-w-0 flex-1 overflow-x-auto whitespace-nowrap no-scrollbar">
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

      {/* Bottom Price/Metric + Action Buttons */}
      {(footerLeft || footerRight) && (
        <div className="pt-2.5 border-t border-[var(--color-border)]/70 dark:border-[#1E3646] flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0 flex-1">{footerLeft}</div>
          <div className="flex flex-wrap items-center justify-end gap-1.5 shrink-0 ms-auto">
            {footerRight}
          </div>
        </div>
      )}

      {children}
    </article>
  );
};


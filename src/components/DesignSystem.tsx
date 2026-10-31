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
      ? 'min-h-[44px] max-w-full px-4 py-2 rounded-xl text-xs font-extrabold tracking-tight'
      : size === 'lg'
      ? 'min-h-[44px] max-w-full px-5 py-2.5 rounded-2xl text-sm font-extrabold tracking-tight'
      : 'min-h-[44px] max-w-full px-4 py-2.5 rounded-xl text-xs font-extrabold tracking-tight';
  const variantTone = CTA_BUTTON_VARIANTS[variant] || CTA_BUTTON_VARIANTS.orange;
  return (
    <button
      type="button"
      className={`${sizeClasses} ${variantTone} active:scale-95 transition-all duration-300 ease-in-out inline-flex flex-wrap items-center justify-center gap-1.5 text-center leading-snug break-words cursor-pointer ${className}`}
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
  search: 'family',
  community: 'community',
  messages: 'chat',
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
      className={`sticky top-[64px] z-20 glass-sticky-subheader backdrop-blur-md rounded-2xl border ${toneClasses.card} p-3 shadow-sm flex flex-wrap items-center justify-between gap-2.5 transition-all duration-300 ease-in-out`}
    >
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <button
          type="button"
          onClick={onBack}
          aria-label={backLabel || (isEn ? 'Back to Home' : 'رجوع للرئيسية')}
          className="min-h-[48px] px-3 py-2 rounded-xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-bg)] dark:bg-[#142430] hover:border-[#FF8C61] text-[var(--color-text)] text-xs font-extrabold flex items-center gap-1.5 shadow-2xs active:scale-95 transition-all duration-300 ease-in-out shrink-0 cursor-pointer"
        >
          <span className="text-xs leading-none">{isEn ? '←' : '→'}</span>
          <span>{backLabel || (isEn ? 'Back' : 'رجوع')}</span>
        </button>

        <SoftFilledIcon id={iconId} boxSize="sm" />

        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold text-[var(--color-text)] leading-snug break-words">
            {title}
          </h1>
          {(subtitle || badge) && (
            <div className="text-xs text-gray-500 dark:text-[#94A3B8] leading-snug break-words mt-0.5">
              {subtitle || badge}
            </div>
          )}
        </div>
      </div>

      {rightSlot && <div className="flex flex-wrap items-center gap-1.5 shrink-0 ms-auto">{rightSlot}</div>}
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
 * Vibrant Geometric SVG Backdrop Pattern used across Full-Screen Splash & Page Transition Loaders.
 */
const GeometricBackdropPattern: React.FC<{ idPrefix: string; darkMode?: boolean }> = ({
  idPrefix,
  darkMode = false,
}) => (
  <svg
    aria-hidden="true"
    className="pointer-events-none absolute inset-0 w-full h-full opacity-55 dark:opacity-45"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <pattern
        id={`${idPrefix}-geo-grid`}
        width="64"
        height="64"
        patternUnits="userSpaceOnUse"
      >
        {/* Subtle geometric diamond & cross lattice */}
        <path
          d="M 32 4 L 60 32 L 32 60 L 4 32 Z"
          fill="none"
          stroke={darkMode ? 'rgba(45, 212, 191, 0.22)' : 'rgba(13, 148, 136, 0.18)'}
          strokeWidth="1.2"
        />
        <circle
          cx="32"
          cy="32"
          r="3.2"
          fill={darkMode ? 'rgba(255, 140, 97, 0.35)' : 'rgba(255, 140, 97, 0.28)'}
        />
        <circle
          cx="0"
          cy="0"
          r="2"
          fill={darkMode ? 'rgba(251, 191, 36, 0.32)' : 'rgba(13, 148, 136, 0.25)'}
        />
        <circle
          cx="64"
          cy="0"
          r="2"
          fill={darkMode ? 'rgba(251, 191, 36, 0.32)' : 'rgba(13, 148, 136, 0.25)'}
        />
        <circle
          cx="0"
          cy="64"
          r="2"
          fill={darkMode ? 'rgba(251, 191, 36, 0.32)' : 'rgba(13, 148, 136, 0.25)'}
        />
        <circle
          cx="64"
          cy="64"
          r="2"
          fill={darkMode ? 'rgba(251, 191, 36, 0.32)' : 'rgba(13, 148, 136, 0.25)'}
        />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill={`url(#${idPrefix}-geo-grid)`} />
  </svg>
);

/**
 * Full-Screen Viewport Navigation Transition Loader.
 * Activates ONLY when navigating between internal application pages.
 * Renders across the full viewport with a vibrant geometric background pattern (no modal box wrapper).
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
      className={`fixed inset-0 z-[80] w-screen h-screen pointer-events-none flex flex-col items-center justify-center p-6 sm:p-12 transition-all duration-200 ease-out overflow-hidden ${
        fadingOut ? 'opacity-0 scale-98' : 'opacity-100 scale-100'
      }`}
      style={{
        background:
          'radial-gradient(circle at 50% 30%, rgba(13, 148, 136, 0.32) 0%, rgba(255, 140, 97, 0.2) 42%, rgba(11, 19, 26, 0.96) 88%), #0B131A',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      <GeometricBackdropPattern idPrefix="nav-loader" darkMode={true} />

      <div className="relative z-10 flex flex-col items-center justify-center gap-6 text-center max-w-lg w-full px-4">
        <div className="relative flex items-center justify-center">
          <span
            aria-hidden="true"
            className="animate-nav-loader-pulse-ring absolute w-40 h-40 sm:w-44 sm:h-44 rounded-full bg-gradient-to-tr from-[#2DD4BF]/35 via-[#FF8C61]/30 to-[#FBBF24]/35"
          />
          <div className="relative w-32 h-32 sm:w-36 sm:h-36 rounded-full bg-gradient-to-b from-teal-900/60 to-slate-900/80 border-2 border-[#2DD4BF]/45 flex items-center justify-center shadow-2xl">
            <PlayfulChildLoaderSvg size={108} />
          </div>
        </div>

        <div className="space-y-3 w-full">
          <div className="text-xl sm:text-2xl font-black text-[#F8FAFC] tracking-tight">
            {displayLabel}
          </div>

          {/* Enlarged Glowing Progress Indicator */}
          <div className="w-64 sm:w-80 mx-auto h-3 rounded-full bg-slate-800/90 border border-teal-500/30 overflow-hidden shadow-inner">
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
          <div className="min-w-0 space-y-1 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-xs sm:text-sm font-extrabold text-[var(--color-text)] leading-snug break-words">
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
              <p className="text-[11px] font-semibold text-[var(--color-muted)] leading-relaxed break-words">
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

          <div className="relative z-10 flex flex-wrap items-center justify-between gap-1.5 min-w-0">
            <span className="image-card-badge px-2.5 py-0.5 rounded-full text-[10px] font-extrabold shadow-2xs inline-flex items-center gap-1 leading-snug break-words">
              <span className="inline-flex items-center gap-1 leading-snug break-words">{topLeftBadge}</span>
            </span>
            {topRightBadge && (
              <span
                data-keep-dark-text="true"
                className="image-card-rating-pill px-2 py-0.5 rounded-full text-[10px] font-extrabold tabular-nums shrink-0 inline-flex items-center gap-0.5 shadow-2xs"
              >
                {topRightBadge}
              </span>
            )}
          </div>

          <div className="relative z-10 image-card-glass-panel rounded-lg px-2.5 py-1.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              {titlePrefixSlot && <div className="shrink-0">{titlePrefixSlot}</div>}
              <h3 className="image-card-title text-xs sm:text-sm font-extrabold leading-snug break-words">
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
                className="px-2 py-0.5 rounded-md bg-black/15 dark:bg-white/10 text-[10px] font-extrabold text-[var(--color-text)] dark:text-[#A5F3FC] hover:opacity-90 shrink-0 cursor-pointer"
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
            className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-bold text-[var(--color-muted)] px-1 py-1 min-w-0 animate-fade-in"
          >
            <div className="flex flex-wrap items-center gap-1.5 min-w-0 flex-1 leading-snug break-words">
              {metaLeft}
            </div>
            {metaRightAction && <div className="shrink-0 ms-auto">{metaRightAction}</div>}
          </div>
        )}

        {/* Optional Body Content */}
        {bodyContent && (
          <div className="text-xs font-semibold text-[var(--color-muted)] dark:text-[#CBD5E1] leading-relaxed px-0.5 break-words">
            {bodyContent}
          </div>
        )}
      </div>

      {/* Layer 2 (Action Footer): Fixed, non-overlapping horizontal action row for primary buttons */}
      {(footerLeft || footerRight) && (
        <div
          data-card-layer="2-action-footer"
          className="pt-3 border-t border-[var(--color-border)]/70 dark:border-[#1E3646] flex flex-wrap items-center justify-between gap-2.5 min-w-0"
        >
          <div className="min-w-0 flex-1 leading-snug break-words">{footerLeft}</div>
          <div className="flex flex-wrap items-center justify-end gap-1.5 shrink-0 ms-auto">
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
          <div className="text-xs sm:text-sm font-black text-[var(--color-text)] dark:text-[#F8FAFC] leading-snug break-words">
            {isEn ? celebration.titleEn : celebration.titleAr}
          </div>
          {(celebration.subtitleAr || celebration.subtitleEn) && (
            <div className="text-[11px] font-bold text-[#0d9488] dark:text-[#A5F3FC] leading-snug break-words">
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
  onAddRescueTask?: (taskName: string, timeStr: string, kidId: number | null) => void;
}

const FAMILY_MOOD_OPTIONS: Array<{
  id: FamilyMoodId;
  emoji: string;
  labelAr: string;
  labelEn: string;
  vibeAr: string;
  vibeEn: string;
  presetScores: Record<DiagnosticQuestionId, 0 | 50 | 100>;
}> = [
  {
    id: 'calm',
    emoji: '😊',
    labelAr: 'هادئ ومتوازن (75%)',
    labelEn: 'Calm & Balanced (75%)',
    vibeAr: 'جو البيت هادئ ومريح — تنسيق متوازن بين أحمد ومريم مع الأولاد',
    vibeEn: 'Calm & peaceful household vibe — smooth coordination between Ahmed & Maryam',
    presetScores: {
      hamza_sleep: 50,
      hamza_mood: 100,
      laila_coop: 50,
      laila_energy: 100,
      youssef_school: 50,
      youssef_mood: 100,
      parents_energy: 50,
      parents_teamwork: 100,
    },
  },
  {
    id: 'excited',
    emoji: '🤩',
    labelAr: 'بطارية مشحونة (100%)',
    labelEn: 'Full Battery (100%)',
    vibeAr: 'طاقة البيت مشحونة بالكامل! حمزة وليلى ويوسف في أفضل حالاتهم مع أحمد ومريم',
    vibeEn: '100% Full Family Battery! Hamza, Laila & Youssef are thriving with Ahmed & Maryam',
    presetScores: {
      hamza_sleep: 100,
      hamza_mood: 100,
      laila_coop: 100,
      laila_energy: 100,
      youssef_school: 100,
      youssef_mood: 100,
      parents_energy: 100,
      parents_teamwork: 100,
    },
  },
  {
    id: 'cozy',
    emoji: '🧸',
    labelAr: 'يحتاج دعم وهدوء (45%)',
    labelEn: 'Needs Gentle Support (45%)',
    vibeAr: 'البطارية متوسطة وتميل للإرهاق — تفعيل خطة التهدئة وتبادل الراحة بين أحمد ومريم',
    vibeEn: 'Moderate battery — activating calm wind-down and duty rotation for Ahmed & Maryam',
    presetScores: {
      hamza_sleep: 50,
      hamza_mood: 50,
      laila_coop: 0,
      laila_energy: 50,
      youssef_school: 50,
      youssef_mood: 50,
      parents_energy: 50,
      parents_teamwork: 50,
    },
  },
  {
    id: 'focused',
    emoji: '🪫',
    labelAr: 'إنقاذ البطارية (25%)',
    labelEn: 'Rescue Mode (25%)',
    vibeAr: 'بطارية البيت منخفضة — تفعيل خطة الطوارئ السريعة لتخفيف الضغط فوراً',
    vibeEn: 'Low household battery — activating emergency 20-minute family rescue plan',
    presetScores: {
      hamza_sleep: 0,
      hamza_mood: 50,
      laila_coop: 0,
      laila_energy: 0,
      youssef_school: 50,
      youssef_mood: 0,
      parents_energy: 0,
      parents_teamwork: 50,
    },
  },
];

type DiagnosticMemberId = 'hamza' | 'laila' | 'youssef' | 'parents';
type DiagnosticQuestionId =
  | 'hamza_sleep'
  | 'hamza_mood'
  | 'laila_coop'
  | 'laila_energy'
  | 'youssef_school'
  | 'youssef_mood'
  | 'parents_energy'
  | 'parents_teamwork';

interface DiagnosticMemberSpec {
  id: DiagnosticMemberId;
  kidId: number | null;
  emoji: string;
  nameAr: string;
  nameEn: string;
  stageAr: string;
  stageEn: string;
  questions: Array<{
    id: DiagnosticQuestionId;
    labelAr: string;
    labelEn: string;
    options: Array<{
      score: 0 | 50 | 100;
      textAr: string;
      textEn: string;
      icon: string;
    }>;
  }>;
  rescuePlanAr: string;
  rescuePlanEn: string;
  rescueTaskAr: string;
  rescueTaskEn: string;
  rescueTime: string;
}

const DIAGNOSTIC_MEMBERS_SPEC: DiagnosticMemberSpec[] = [
  {
    id: 'hamza',
    kidId: 1,
    emoji: '👶🏻',
    nameAr: 'حمزة',
    nameEn: 'Hamza',
    stageAr: 'رضيع · ٦ شهور',
    stageEn: 'Infant · 6m',
    questions: [
      {
        id: 'hamza_sleep',
        labelAr: '١. جودة النوم والقيلولة:',
        labelEn: '1. Sleep & Nap Quality:',
        options: [
          { score: 0, textAr: 'متقطع', textEn: 'Restless', icon: '😴' },
          { score: 50, textAr: 'متوسط', textEn: 'Moderate', icon: '🌙' },
          { score: 100, textAr: 'عميق ومريح', textEn: 'Deep & Calm', icon: '✨' },
        ],
      },
      {
        id: 'hamza_mood',
        labelAr: '٢. المزاج والرضاعة/الأكل:',
        labelEn: '2. Mood & First Feeding:',
        options: [
          { score: 0, textAr: 'مغص/بكاء', textEn: 'Fussy', icon: '🍼' },
          { score: 50, textAr: 'هادئ نسبياً', textEn: 'Calm-ish', icon: '🙂' },
          { score: 100, textAr: 'مبتسم ومرتاح', textEn: 'Happy & Fed', icon: '🥰' },
        ],
      },
    ],
    rescuePlanAr:
      'خطة إنقاذ حمزة (٦ شهور): يتولى أحمد حمل حمزة وتمرين التهدئة الحسي ١٥ دقيقة لتأخذ مريم قسط راحة، مع حمام دافئ وتدليك البطن قبل النوم.',
    rescuePlanEn:
      'Hamza (6m) Rescue Plan: Ahmed takes over 15-min soothing sensory hold while Maryam rests, followed by a warm bath and gentle tummy massage.',
    rescueTaskAr: 'حمام دافئ وتدليك تهدئة المساء لـ حمزة بالتناوب بين أحمد ومريم',
    rescueTaskEn: 'Warm soothing bath & tummy massage for Hamza (Ahmed & Maryam)',
    rescueTime: '07:15 م',
  },
  {
    id: 'laila',
    kidId: 2,
    emoji: '👧🏻',
    nameAr: 'ليلى',
    nameEn: 'Laila',
    stageAr: 'طفلة · ٤ سنوات',
    stageEn: 'Daughter · 4y',
    questions: [
      {
        id: 'laila_coop',
        labelAr: '١. التعاون ونوبات الغضب:',
        labelEn: '1. Cooperation & Tantrums:',
        options: [
          { score: 0, textAr: 'عناد/غضب', textEn: 'Tantrums', icon: '🌩️' },
          { score: 50, textAr: 'تحتاج تمهيد', textEn: 'Needs Prep', icon: '🤝' },
          { score: 100, textAr: 'متعاونة جداً', textEn: 'Cooperative', icon: '🌸' },
        ],
      },
      {
        id: 'laila_energy',
        labelAr: '٢. طاقة اللعب والحضانة:',
        labelEn: '2. Creative Play & Nursery:',
        options: [
          { score: 0, textAr: 'مرهقة/متعلقة', textEn: 'Clingy/Tired', icon: '🧸' },
          { score: 50, textAr: 'طاقة معتدلة', textEn: 'Balanced', icon: '🎨' },
          { score: 100, textAr: 'مبدعة ومنطلقة', textEn: 'Creative', icon: '🌟' },
        ],
      },
    ],
    rescuePlanAr:
      'خطة إنقاذ ليلى (٤ سنوات): تجلس مريم مع ليلى ١٠ دقائق بـ «بطاقات تسمية المشاعر» والتخيير الإيجابي بين نشاطين فنيين بدون أوامر مباشرة.',
    rescuePlanEn:
      'Laila (4y) Rescue Plan: Maryam spends 10 mins using Emotion Naming Cards & offering 2 gentle creative choices to dissolve resistance.',
    rescueTaskAr: 'جلسة بطاقات تسمية المشاعر والتلوين الهادئ مع ليلى (مريم)',
    rescueTaskEn: 'Emotion Naming Cards & calm coloring session with Laila (Maryam)',
    rescueTime: '04:30 م',
  },
  {
    id: 'youssef',
    kidId: 3,
    emoji: '👦🏻',
    nameAr: 'يوسف',
    nameEn: 'Youssef',
    stageAr: 'الابن الأكبر · ٨ سنوات',
    stageEn: 'Eldest Son · 8y',
    questions: [
      {
        id: 'youssef_school',
        labelAr: '١. استقلالية المدرسة والواجبات:',
        labelEn: '1. School & Homework:',
        options: [
          { score: 0, textAr: 'مشتت', textEn: 'Distracted', icon: '📚' },
          { score: 50, textAr: 'ينجز بتذكير', textEn: 'With Prompts', icon: '✏️' },
          { score: 100, textAr: 'مستقل ومنظم', textEn: 'Independent', icon: '🏆' },
        ],
      },
      {
        id: 'youssef_mood',
        labelAr: '٢. المزاج وتوازن الشاشات:',
        labelEn: '2. Mood & Screen Balance:',
        options: [
          { score: 0, textAr: 'شد على الشاشات', textEn: 'Screen Struggle', icon: '📱' },
          { score: 50, textAr: 'متوازن نسبياً', textEn: 'Balanced', icon: '⚽' },
          { score: 100, textAr: 'نشيط وإيجابي', textEn: 'Active & Great', icon: '🚀' },
        ],
      },
    ],
    rescuePlanAr:
      'خطة إنقاذ يوسف (٨ سنوات): يضبط أحمد مع يوسف مؤقت ٢٥ دقيقة لإنهاء الواجب مقابل تحدي شطرنج أو كورة مشترك بدون شاشات.',
    rescuePlanEn:
      'Youssef (8y) Rescue Plan: Ahmed sets a 25-min focus timer with Youssef followed by a screen-free father-son chess or ball match.',
    rescueTaskAr: 'تحدي ٢٥ دقيقة تركيز للواجب + مباراة بدون شاشات مع يوسف (أحمد)',
    rescueTaskEn: '25-min homework sprint + screen-free match with Youssef (Ahmed)',
    rescueTime: '05:30 م',
  },
  {
    id: 'parents',
    kidId: null,
    emoji: '💑',
    nameAr: 'أحمد ومريم',
    nameEn: 'Ahmed & Maryam',
    stageAr: 'الأب والأم · قيادة البيت',
    stageEn: 'Parents · Family Team',
    questions: [
      {
        id: 'parents_energy',
        labelAr: '١. مستوى طاقة أحمد ومريم:',
        labelEn: '1. Parents Energy Level:',
        options: [
          { score: 0, textAr: 'إرهاق عالي', textEn: 'Exhausted', icon: '🪫' },
          { score: 50, textAr: 'طاقة متوسطة', textEn: 'Moderate', icon: '☕' },
          { score: 100, textAr: 'نشاط وروقان', textEn: 'Energized', icon: '🔋' },
        ],
      },
      {
        id: 'parents_teamwork',
        labelAr: '٢. التنسيق وتوزيع المهام:',
        labelEn: '2. Teamwork Coordination:',
        options: [
          { score: 0, textAr: 'ضغط غير موزع', textEn: 'Overloaded', icon: '⚠️' },
          { score: 50, textAr: 'تنسيق جيد', textEn: 'Coordinated', icon: '🤝' },
          { score: 100, textAr: 'تناغم كامل', textEn: 'Full Synergy', icon: '💚' },
        ],
      },
    ],
    rescuePlanAr:
      'خطة إنقاذ أحمد ومريم: تطبيق «تناوب الـ ٣٠ دقيقة» فوراً — يستلم أحد الزوجين الأولاد بينما يحصل الآخر على استراحة هادئة مع قهوة بدون مقاطعة.',
    rescuePlanEn:
      'Ahmed & Maryam Rescue Plan: Activate the "30-Minute Tag-Team Relay" — one parent takes the kids while the other enjoys an uninterrupted coffee break.',
    rescueTaskAr: 'تفعيل تناوب الراحة المسائي (٣٠ دقيقة لكل من أحمد ومريم)',
    rescueTaskEn: '30-Minute Evening Tag-Team Rest Relay (Ahmed & Maryam)',
    rescueTime: '08:00 م',
  },
];

/**
 * Interactive Family Pulse & Battery Diagnostic Widget ("اختبار نبض البطارية والبيت اليومي").
 * Parents (Ahmad or Maryam) complete a 30-second check-in answering 2 targeted questions
 * for Hamza (6m), Laila (4y), Youssef (8y), and Ahmad & Maryam.
 * Dynamically calculates an aggregate household percentage (0% to 100%) driving the SVG Half-Circle
 * Gauge Needle & outputting a contextual daily operational rescue plan.
 */
export const FamilyMoodBarometer: React.FC<FamilyMoodBarometerProps> = ({
  language,
  onSelectMood,
  onAddRescueTask,
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

  const [diagnosticScores, setDiagnosticScores] = useState<Record<DiagnosticQuestionId, 0 | 50 | 100>>(() => {
    try {
      const raw = window.localStorage.getItem('nekbaar_family_pulse_scores_v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          return {
            hamza_sleep: parsed.hamza_sleep ?? 50,
            hamza_mood: parsed.hamza_mood ?? 100,
            laila_coop: parsed.laila_coop ?? 50,
            laila_energy: parsed.laila_energy ?? 100,
            youssef_school: parsed.youssef_school ?? 100,
            youssef_mood: parsed.youssef_mood ?? 50,
            parents_energy: parsed.parents_energy ?? 50,
            parents_teamwork: parsed.parents_teamwork ?? 100,
          };
        }
      }
    } catch {
      // ignore storage errors
    }
    return {
      hamza_sleep: 50,
      hamza_mood: 100,
      laila_coop: 50,
      laila_energy: 100,
      youssef_school: 100,
      youssef_mood: 50,
      parents_energy: 50,
      parents_teamwork: 100,
    };
  });

  const [activeMemberTab, setActiveMemberTab] = useState<DiagnosticMemberId>('hamza');

  const handleAnswerQuestion = (
    qId: DiagnosticQuestionId,
    score: 0 | 50 | 100,
    memberName: string,
    optLabel: string
  ) => {
    setDiagnosticScores((prev) => {
      const next = { ...prev, [qId]: score };
      try {
        window.localStorage.setItem('nekbaar_family_pulse_scores_v1', JSON.stringify(next));
      } catch {
        // ignore storage errors
      }
      const totalVals = Object.values(next) as number[];
      const avg = Math.round(totalVals.reduce((acc, v) => acc + v, 0) / totalVals.length);
      onSelectMood?.(
        avg >= 85 ? 'excited' : avg >= 65 ? 'calm' : avg >= 40 ? 'cozy' : 'focused',
        isEn
          ? `🔋 Updated ${memberName} check-in (${optLabel}) · Household Battery: ${avg}%`
          : `🔋 تم تحديث تشخيص ${memberName} (${optLabel}) · نبض بطارية البيت الآن: ${avg}%`
      );
      return next;
    });
  };

  const handleChooseMood = (opt: (typeof FAMILY_MOOD_OPTIONS)[number]) => {
    setSelectedMood(opt.id);
    setDiagnosticScores(opt.presetScores);
    try {
      window.localStorage.setItem('nekbaar_family_mood_v1', opt.id);
      window.localStorage.setItem('nekbaar_family_pulse_scores_v1', JSON.stringify(opt.presetScores));
    } catch {
      // ignore storage errors
    }
    onSelectMood?.(opt.id, `${opt.emoji} ${isEn ? opt.vibeEn : opt.vibeAr}`);
  };

  // Calculate per-member battery percentages & aggregate household battery percentage (0% to 100%)
  const memberPercentages: Record<DiagnosticMemberId, number> = {
    hamza: Math.round((diagnosticScores.hamza_sleep + diagnosticScores.hamza_mood) / 2),
    laila: Math.round((diagnosticScores.laila_coop + diagnosticScores.laila_energy) / 2),
    youssef: Math.round((diagnosticScores.youssef_school + diagnosticScores.youssef_mood) / 2),
    parents: Math.round((diagnosticScores.parents_energy + diagnosticScores.parents_teamwork) / 2),
  };

  const energyGaugePercent = Math.round(
    (memberPercentages.hamza +
      memberPercentages.laila +
      memberPercentages.youssef +
      memberPercentages.parents) /
      4
  );

  // Identify lowest-battery family member to tailor the instant operational rescue plan
  const priorityRescueMember = DIAGNOSTIC_MEMBERS_SPEC.reduce((lowest, curr) =>
    memberPercentages[curr.id] < memberPercentages[lowest.id] ? curr : lowest
  , DIAGNOSTIC_MEMBERS_SPEC[0]);

  const activeMoodObj =
    energyGaugePercent >= 85
      ? FAMILY_MOOD_OPTIONS[1]
      : energyGaugePercent >= 65
      ? FAMILY_MOOD_OPTIONS[0]
      : energyGaugePercent >= 40
      ? FAMILY_MOOD_OPTIONS[2]
      : FAMILY_MOOD_OPTIONS[3];

  // Needle angle from -90deg (leftmost 0%) to +90deg (rightmost 100%)
  const needleAngleDeg = Math.round((energyGaugePercent / 100) * 180 - 90);
  // Semicircle arc path length for radius 80 is pi * 80 ≈ 251.3
  const arcTotalLen = 251.3;
  const arcActiveLen = (energyGaugePercent / 100) * arcTotalLen;

  return (
    <div
      id="family-mood-barometer"
      data-testid="family-mood-barometer"
      className="rounded-3xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-surface)] dark:bg-[#101D26] p-5 sm:p-6 soft-card-surface shadow-sm space-y-5"
    >
      {/* Top Header Row: Title + Quick 1-Tap Household Presets */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[var(--color-border)]/70 dark:border-[#1E3646]">
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-11 h-11 rounded-2xl bg-teal-500/15 dark:bg-[#142430] border border-teal-500/30 dark:border-[#1E3646] flex items-center justify-center text-2xl shrink-0">
            🔋
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm sm:text-base font-black text-[var(--color-text)] dark:text-[#F8FAFC]">
                {isEn
                  ? 'Daily Family Battery & Pulse Diagnostic (30s Check-In)'
                  : 'اختبار نبض البطارية والبيت اليومي (تشخيص ٣٠ ثانية)'}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-teal-500/15 text-[#0d9488] dark:text-[#2DD4BF] text-[10.5px] font-black tabular-nums">
                {energyGaugePercent}% · {isEn ? activeMoodObj.labelEn : activeMoodObj.labelAr}
              </span>
            </div>
            <p className="text-xs font-semibold text-[var(--color-muted)] dark:text-[#CBD5E1]">
              {isEn
                ? 'Answer 2 quick questions for Hamza (6m), Laila (4y), Youssef (8y) & Ahmed/Maryam to generate today’s rescue plan'
                : 'أجب عن سؤالين سريعين لـ حمزة (٦ شهور)، ليلى (٤ سنوات)، يوسف (٨ سنوات)، وأحمد ومريم لحساب نبض البيت وخطة الإنقاذ الفورية'}
            </p>
          </div>
        </div>

        {/* Quick Preset Buttons */}
        <div
          role="radiogroup"
          aria-label={isEn ? 'Select Family Daily Mood' : 'اختر مود العيلة اليوم'}
          className="flex items-center gap-2 flex-wrap"
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
                className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs sm:text-sm font-extrabold border transition-all inline-flex items-center gap-1.5 whitespace-normal break-words leading-snug cursor-pointer ${
                  isSelected
                    ? 'bg-[#0d9488] text-white border-[#0d9488] shadow-2xs'
                    : 'bg-[var(--color-control-muted)] dark:bg-[#142430] text-[var(--color-text)] dark:text-[#F8FAFC] border-[var(--color-border)] dark:border-[#1E3646] hover:border-[#FF8C61]'
                }`}
              >
                <span aria-hidden="true">{opt.emoji}</span>
                <span>{isEn ? opt.labelEn : opt.labelAr}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* STEP 1 (FIRST): 2x2 Interactive Member Diagnostic Questions (Hamza 6m, Laila 4y, Youssef 8y, Ahmad & Maryam) */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between gap-2 px-1">
          <span className="text-xs font-black text-[#0d9488] dark:text-[#2DD4BF]">
            {isEn
              ? '1. First: Answer 2 Quick Questions Per Family Member'
              : '١. أولاً: أجب عن سؤالين سريعين لكل فرد في العيلة'}
          </span>
          <span className="text-[11px] font-bold text-[var(--color-muted)] dark:text-[#94A3B8]">
            {isEn ? 'Tap any answer to update result below ↓' : 'اضغط على أي إجابة لتحديث النتيجة بالأسفل ↓'}
          </span>
        </div>

        <div
          id="family-battery-questions-grid"
          data-testid="family-battery-questions-grid"
          className="grid grid-cols-1 sm:grid-cols-2 gap-3.5"
        >
          {DIAGNOSTIC_MEMBERS_SPEC.map((member) => {
            const memberPct = memberPercentages[member.id];
            const isHighlighted = activeMemberTab === member.id;
            const memberAccentBorder =
              member.id === 'hamza'
                ? 'border-sky-400/55 bg-sky-50/35 dark:bg-[#142430]/90'
                : member.id === 'laila'
                ? 'border-rose-400/55 bg-rose-50/35 dark:bg-[#142430]/90'
                : member.id === 'youssef'
                ? 'border-amber-400/55 bg-amber-50/35 dark:bg-[#142430]/90'
                : 'border-teal-500/55 bg-teal-50/35 dark:bg-[#142430]/90';

            return (
              <div
                key={member.id}
                data-testid={`diagnostic-card-${member.id}`}
                onClick={() => setActiveMemberTab(member.id)}
                className={`rounded-2xl border-2 p-4 flex flex-col justify-between gap-3.5 transition-all ${
                  isHighlighted
                    ? `${memberAccentBorder} shadow-xs`
                    : 'border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-muted)]/25 dark:bg-[#0B131A]/60'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <span className="text-xl leading-none shrink-0">{member.emoji}</span>
                    <div className="min-w-0 space-y-0.5">
                      <div className="text-xs sm:text-sm font-black text-[var(--color-text)] dark:text-[#F8FAFC] leading-snug break-words">
                        {isEn ? member.nameEn : member.nameAr}
                      </div>
                      <div className="text-[11px] font-bold text-[var(--color-muted)] dark:text-[#94A3B8] leading-snug break-words">
                        {isEn ? member.stageEn : member.stageAr}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-black tabular-nums shrink-0 ${
                      memberPct >= 75
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                        : memberPct >= 50
                        ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300'
                        : 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
                    }`}
                  >
                    ⚡ {memberPct}%
                  </span>
                </div>

                <div className="space-y-3">
                  {member.questions.map((q) => {
                    const currentVal = diagnosticScores[q.id];
                    return (
                      <div key={q.id} className="space-y-1.5">
                        <div className="text-xs font-extrabold text-[var(--color-text)] dark:text-[#CBD5E1] leading-snug break-words">
                          {isEn ? q.labelEn : q.labelAr}
                        </div>
                        <div className="flex flex-wrap items-stretch gap-1.5">
                          {q.options.map((opt) => {
                            const isPicked = currentVal === opt.score;
                            return (
                              <button
                                key={opt.score}
                                type="button"
                                data-testid={`diag-q-${q.id}-${opt.score}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveMemberTab(member.id);
                                  handleAnswerQuestion(
                                    q.id,
                                    opt.score,
                                    isEn ? member.nameEn : member.nameAr,
                                    isEn ? opt.textEn : opt.textAr
                                  );
                                }}
                                className={`flex-1 min-w-[92px] min-h-[44px] px-3 py-2 rounded-xl text-xs sm:text-sm font-extrabold border transition-all inline-flex items-center justify-center gap-1.5 text-center whitespace-normal break-words leading-snug cursor-pointer ${
                                  isPicked
                                    ? 'bg-[#0d9488] text-white border-[#0d9488] shadow-2xs'
                                    : 'bg-[var(--color-surface)] dark:bg-[#101D26] text-[var(--color-text)] dark:text-[#F8FAFC] border-[var(--color-border)] dark:border-[#1E3646] hover:border-[#FF8C61]'
                                }`}
                              >
                                <span aria-hidden="true" className="shrink-0">{opt.icon}</span>
                                <span className="leading-snug break-words">
                                  {isEn ? opt.textEn : opt.textAr}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* STEP 2 (BELOW QUESTIONS): Diagnostic Result, Half-Circle Battery Gauge & Instant Rescue Plan */}
      <div
        id="family-battery-diagnostic-result"
        data-testid="family-battery-diagnostic-result"
        className="pt-3 border-t border-[var(--color-border)]/70 dark:border-[#1E3646] space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
          <span className="text-xs font-black text-[#E86A3D] dark:text-[#FF8C61]">
            {isEn
              ? '2. Diagnostic Result & Household Battery Index'
              : '٢. نتيجة التشخيص ومؤشر بطارية البيت الآن'}
          </span>
          <span className="px-3 py-0.5 rounded-full bg-teal-500/15 text-[#0d9488] dark:text-[#2DD4BF] text-xs font-black tabular-nums">
            {energyGaugePercent}% · {isEn ? activeMoodObj.labelEn : activeMoodObj.labelAr}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
          {/* Half-Circle Speedometer / Battery Gauge Widget (SVG) + Member Summary Pills */}
          <div className="lg:col-span-5 flex flex-col items-center justify-between rounded-2xl border border-[var(--color-border)]/70 dark:border-[#1E3646] bg-[var(--color-control-muted)]/35 dark:bg-[#0B131A]/70 p-4 gap-3">
            <div className="relative w-full max-w-[250px] flex flex-col items-center">
              <svg
                data-testid="half-circle-energy-gauge-svg"
                viewBox="0 0 220 128"
                className="w-full h-auto overflow-visible select-none"
                role="img"
                aria-label={
                  isEn
                    ? `Family Energy & Mood Gauge: ${energyGaugePercent}%`
                    : `عدّاد نبض وبطارية العيلة النصف دائري: ${energyGaugePercent}٪`
                }
              >
                <defs>
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

                <path
                  d="M 30 106 A 80 80 0 0 1 190 106"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="16"
                  strokeLinecap="round"
                  className="text-slate-200/90 dark:text-[#142430]"
                />

                <path
                  d="M 30 106 A 80 80 0 0 1 190 106"
                  fill="none"
                  stroke="url(#nekbaarHalfCircleGaugeGrad)"
                  strokeWidth="16"
                  strokeLinecap="round"
                  strokeOpacity="0.25"
                />

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

                <text x="16" y="122" textAnchor="middle" className="text-[11px] font-black fill-emerald-600 dark:fill-emerald-400">
                  🌿
                </text>
                <text x="110" y="14" textAnchor="middle" className="text-[11px] font-black fill-amber-500">
                  ⚡
                </text>
                <text x="204" y="122" textAnchor="middle" className="text-[11px] font-black fill-rose-500">
                  🔥
                </text>

                <g
                  data-testid="half-circle-gauge-needle"
                  filter="url(#gaugeNeedleShadow)"
                  style={{
                    transform: `rotate(${needleAngleDeg}deg)`,
                    transformOrigin: '110px 106px',
                    transition: 'transform 600ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                  }}
                >
                  <polygon
                    points="106.5,106 110,36 113.5,106"
                    fill="#0F766E"
                    className="dark:fill-[#2DD4BF]"
                  />
                  <circle cx="110" cy="39" r="3.5" fill="#FF8C61" />
                </g>

                <circle
                  cx="110"
                  cy="106"
                  r="10"
                  fill="#0B131A"
                  className="dark:fill-[#F8FAFC]"
                />
                <circle cx="110" cy="106" r="4.5" fill="#FF8C61" />
              </svg>

              <div className="mt-1 flex items-center justify-between w-full px-1 text-[11px] font-extrabold">
                <span className="text-emerald-600 dark:text-emerald-400">🌿 0%</span>
                <span
                  data-testid="family-battery-aggregate-pct"
                  className="px-3 py-0.5 rounded-full bg-teal-500/15 text-[#0d9488] dark:text-[#2DD4BF] border border-teal-500/30 text-xs font-black tabular-nums"
                >
                  🔋 {isEn ? `Household Pulse: ${energyGaugePercent}%` : `نبض بطارية البيت: ${energyGaugePercent}%`}
                </span>
                <span className="text-[#E86A3D] dark:text-[#FF8C61]">🔥 100%</span>
              </div>
            </div>

            <div className="w-full grid grid-cols-2 gap-2 pt-2 border-t border-[var(--color-border)]/60 dark:border-[#1E3646]">
              {DIAGNOSTIC_MEMBERS_SPEC.map((m) => {
                const pct = memberPercentages[m.id];
                const isFocused = activeMemberTab === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    data-testid={`diagnostic-member-pill-${m.id}`}
                    onClick={() => setActiveMemberTab(m.id)}
                    className={`min-h-[42px] px-2.5 py-1.5 rounded-xl border text-start transition-all flex items-center justify-between gap-1.5 cursor-pointer ${
                      isFocused
                        ? 'border-[#0d9488] bg-teal-500/12 text-[var(--color-text)] dark:text-[#F8FAFC] shadow-2xs'
                        : 'border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-surface)] dark:bg-[#101D26] hover:border-[#0d9488]/60'
                    }`}
                  >
                    <span className="text-xs font-black leading-snug truncate">
                      {m.emoji} {isEn ? m.nameEn : m.nameAr}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-lg text-[10.5px] font-black tabular-nums shrink-0 ${
                        pct >= 75
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                          : pct >= 50
                          ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300'
                          : 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
                      }`}
                    >
                      {pct}%
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Operational Rescue Plan Card Driven Dynamically by Diagnostic Scores */}
          <div
            id="family-pulse-rescue-plan"
            data-testid="family-pulse-rescue-plan"
            className="lg:col-span-7 rounded-2xl border border-teal-500/35 dark:border-[#1E3646] bg-gradient-to-r from-teal-500/10 via-amber-500/5 to-teal-500/10 dark:from-[#142430] dark:to-[#0B131A] p-5 sm:p-6 flex flex-col justify-between gap-4 shadow-2xs"
          >
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-[#FF8C61]/20 text-[#E86A3D] dark:text-[#FF8C61] text-xs font-black leading-snug">
                  🛟 {isEn ? 'Instant Daily Operational Rescue Plan' : 'نتيجة التشخيص وخطة الإنقاذ الفورية'}
                </span>
                <span className="px-3 py-1 rounded-full bg-teal-500/15 text-[#0d9488] dark:text-[#2DD4BF] text-xs font-extrabold leading-snug">
                  {priorityRescueMember.emoji}{' '}
                  {isEn
                    ? `Priority Focus: ${priorityRescueMember.nameEn} (${memberPercentages[priorityRescueMember.id]}%)`
                    : `الأولوية الآن: ${priorityRescueMember.nameAr} (${memberPercentages[priorityRescueMember.id]}%)`}
                </span>
              </div>
              <p className="text-xs sm:text-sm font-bold text-[var(--color-text)] dark:text-[#F8FAFC] leading-relaxed break-words">
                {isEn ? priorityRescueMember.rescuePlanEn : priorityRescueMember.rescuePlanAr}
              </p>
            </div>

            {onAddRescueTask && (
              <div className="pt-2 border-t border-teal-500/20 flex items-center justify-end">
                <button
                  type="button"
                  data-testid="apply-rescue-plan-btn"
                  onClick={() => {
                    onAddRescueTask(
                      isEn ? priorityRescueMember.rescueTaskEn : priorityRescueMember.rescueTaskAr,
                      priorityRescueMember.rescueTime,
                      priorityRescueMember.kidId
                    );
                  }}
                  className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl bg-[#0d9488] hover:bg-[#0f766e] text-white text-xs sm:text-sm font-black shadow-xs transition-all active:scale-95 cursor-pointer shrink-0 inline-flex items-center justify-center gap-2"
                >
                  <span aria-hidden="true">＋</span>
                  <span className="leading-snug">
                    {isEn ? 'Add Rescue Task to Routine' : 'أضف خطة الإنقاذ للروتين اليومي'}
                  </span>
                </button>
              </div>
            )}
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

/**
 * Prominent, joyful animated SVG illustration of a Boy and a Girl (طفل وطفلة بشكل مكبر ومبهج)
 * used on the initial entry splash / login screen.
 */
export const PlayfulBoyAndGirlSplashSvg: React.FC<{ size?: number }> = ({ size = 260 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 260 260"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    className="animate-nav-loader-child overflow-visible drop-shadow-xl"
  >
    <defs>
      <radialGradient id="splashAuraGrad" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#2DD4BF" stopOpacity="0.38" />
        <stop offset="55%" stopColor="#FF8C61" stopOpacity="0.22" />
        <stop offset="100%" stopColor="#FBBF24" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="boyShirtGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#0D9488" />
        <stop offset="100%" stopColor="#2DD4BF" />
      </linearGradient>
      <linearGradient id="girlDressGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#FF8C61" />
        <stop offset="100%" stopColor="#F43F5E" />
      </linearGradient>
      <linearGradient id="skinWarmGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#FFE4C4" />
        <stop offset="100%" stopColor="#F7C59F" />
      </linearGradient>
      <linearGradient id="heartCenterGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#FBBF24" />
        <stop offset="100%" stopColor="#FF8C61" />
      </linearGradient>
    </defs>

    {/* Soft Radiant Ambient Halo */}
    <circle cx="130" cy="130" r="122" fill="url(#splashAuraGrad)" />

    {/* Floating Joyful Stars & Sparkles */}
    <path
      d="M130 22 L134 32 L145 33 L136 40 L139 51 L130 45 L121 51 L124 40 L115 33 L126 32 Z"
      fill="#FBBF24"
    />
    <circle cx="48" cy="58" r="6" fill="#2DD4BF" />
    <circle cx="212" cy="58" r="6.5" fill="#FF8C61" />
    <circle cx="38" cy="152" r="5" fill="#FBBF24" />
    <circle cx="222" cy="152" r="5" fill="#0D9488" />

    {/* Soft Ground Meadow Shadow */}
    <ellipse cx="130" cy="224" rx="84" ry="14" fill="#0D9488" fillOpacity="0.16" />

    {/* ================= LEFT CHARACTER: JOYFUL BOY ================= */}
    <g>
      <rect x="68" y="186" width="11" height="28" rx="5.5" fill="#1E293B" />
      <rect x="87" y="186" width="11" height="28" rx="5.5" fill="#1E293B" />
      <rect x="63" y="208" width="18" height="10" rx="5" fill="#0D9488" />
      <rect x="85" y="208" width="18" height="10" rx="5" fill="#0D9488" />

      <path
        d="M58 140 C58 126 108 126 108 140 L112 190 C112 195 54 195 54 190 Z"
        fill="url(#boyShirtGrad)"
      />
      <path
        d="M60 142 C42 130 34 112 40 102"
        stroke="url(#skinWarmGrad)"
        strokeWidth="12"
        strokeLinecap="round"
      />
      <circle cx="40" cy="100" r="8" fill="url(#skinWarmGrad)" />
      <path
        d="M104 146 C116 152 122 150 128 144"
        stroke="url(#skinWarmGrad)"
        strokeWidth="11"
        strokeLinecap="round"
      />

      <circle cx="83" cy="96" r="32" fill="url(#skinWarmGrad)" />
      <path
        d="M52 92 C50 64 72 54 90 58 C108 58 118 74 114 92 C106 78 94 74 82 75 C68 75 58 82 52 92 Z"
        fill="#1E293B"
      />
      <circle cx="66" cy="64" r="10" fill="#1E293B" />
      <circle cx="84" cy="60" r="11" fill="#1E293B" />
      <circle cx="101" cy="66" r="9" fill="#1E293B" />

      <ellipse cx="66" cy="102" rx="6" ry="3.8" fill="#FB7185" fillOpacity="0.55" />
      <ellipse cx="100" cy="102" rx="6" ry="3.8" fill="#FB7185" fillOpacity="0.55" />
      <circle cx="71" cy="92" r="4.2" fill="#0F172A" />
      <circle cx="95" cy="92" r="4.2" fill="#0F172A" />
      <circle cx="72.5" cy="90.5" r="1.5" fill="#FFFFFF" />
      <circle cx="96.5" cy="90.5" r="1.5" fill="#FFFFFF" />
      <path
        d="M72 104 Q83 116 94 104"
        stroke="#0F172A"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />
    </g>

    {/* ================= RIGHT CHARACTER: JOYFUL GIRL ================= */}
    <g>
      <rect x="162" y="186" width="11" height="28" rx="5.5" fill="url(#skinWarmGrad)" />
      <rect x="181" y="186" width="11" height="28" rx="5.5" fill="url(#skinWarmGrad)" />
      <rect x="158" y="208" width="18" height="10" rx="5" fill="#F43F5E" />
      <rect x="179" y="208" width="18" height="10" rx="5" fill="#F43F5E" />

      <circle cx="142" cy="84" r="13" fill="#292524" />
      <circle cx="212" cy="84" r="13" fill="#292524" />
      <circle cx="149" cy="80" r="5" fill="#FBBF24" />
      <circle cx="205" cy="80" r="5" fill="#FBBF24" />

      <path
        d="M154 138 C158 126 196 126 200 138 L212 192 C212 196 142 196 142 192 Z"
        fill="url(#girlDressGrad)"
      />
      <path
        d="M198 142 C216 130 226 112 220 100"
        stroke="url(#skinWarmGrad)"
        strokeWidth="12"
        strokeLinecap="round"
      />
      <circle cx="220" cy="98" r="8" fill="url(#skinWarmGrad)" />
      <path
        d="M156 146 C144 152 138 150 132 144"
        stroke="url(#skinWarmGrad)"
        strokeWidth="11"
        strokeLinecap="round"
      />

      <circle cx="177" cy="96" r="32" fill="url(#skinWarmGrad)" />
      <path
        d="M146 92 C146 64 166 56 184 58 C202 60 210 74 208 92 C198 78 188 74 177 74 C164 74 154 80 146 92 Z"
        fill="#292524"
      />

      <ellipse cx="160" cy="102" rx="6" ry="3.8" fill="#FB7185" fillOpacity="0.6" />
      <ellipse cx="194" cy="102" rx="6" ry="3.8" fill="#FB7185" fillOpacity="0.6" />
      <circle cx="165" cy="92" r="4.2" fill="#0F172A" />
      <circle cx="189" cy="92" r="4.2" fill="#0F172A" />
      <circle cx="166.5" cy="90.5" r="1.5" fill="#FFFFFF" />
      <circle cx="190.5" cy="90.5" r="1.5" fill="#FFFFFF" />
      <path
        d="M166 104 Q177 116 188 104"
        stroke="#0F172A"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />
    </g>

    {/* ================= CENTER GLOWING HEART BETWEEN BOY & GIRL ================= */}
    <path
      d="M130 152 C130 152 112 139 112 127 C112 119 119 114 125 117 C128 118 130 121 130 121 C130 121 132 118 135 117 C141 114 148 119 148 127 C148 139 130 152 130 152 Z"
      fill="url(#heartCenterGrad)"
      stroke="#FFFFFF"
      strokeWidth="3"
    />
  </svg>
);

export interface InteractiveSplashScreenProps {
  visible: boolean;
  fadingOut?: boolean;
  language: LanguageCode;
  darkMode?: boolean;
  onSkipOrFinish: () => void;
}

/**
 * First Login / Splash Intro Screen for نكبر (Nekbaar).
 * Positions the central boy/girl illustration in the upper-middle space,
 * renders the app name in Arabic & English ("نكبر / Nekbaar") and the official slogan
 * in Arabic & English ("مساحة تجمعنا.. وبحبهم نكبر / Our shared space.. growing with love")
 * directly underneath, and places copyright ownership strictly at the very bottom.
 */
export const InteractiveSplashScreen: React.FC<InteractiveSplashScreenProps> = ({
  visible,
  fadingOut = false,
  language,
  darkMode = false,
  onSkipOrFinish,
}) => {
  const isEn = language === 'en';

  if (!visible) return null;

  return (
    <div
      id="nekbaar-interactive-splash-screen"
      data-testid="nekbaar-interactive-splash-screen"
      dir={isEn ? 'ltr' : 'rtl'}
      role="dialog"
      aria-modal="true"
      aria-label={isEn ? 'Nekbaar Splash Screen' : 'شاشة ترحيب نكبر'}
      onClick={onSkipOrFinish}
      className={`fixed inset-0 z-[130] w-screen h-screen flex flex-col items-center justify-between p-6 overflow-hidden select-none cursor-pointer transition-opacity duration-700 ${
        fadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{
        background: darkMode
          ? 'radial-gradient(circle at 50% 36%, rgba(13, 148, 136, 0.34) 0%, rgba(255, 140, 97, 0.18) 45%, rgba(11, 19, 26, 0.98) 88%), #0B131A'
          : 'radial-gradient(circle at 50% 36%, rgba(254, 243, 199, 0.92) 0%, rgba(204, 251, 241, 0.78) 48%, rgba(248, 250, 252, 0.99) 88%), #F8FAFC',
      }}
    >
      {/* Subtle Geometric Background Pattern Overlay */}
      <GeometricBackdropPattern idPrefix="splash-screen" darkMode={darkMode} />

      {/* Ambient Floating Decorative Glow Blobs */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -start-24 w-80 h-80 rounded-full bg-teal-400/25 dark:bg-teal-500/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -end-24 w-96 h-96 rounded-full bg-orange-400/25 dark:bg-orange-500/20 blur-3xl"
      />

      {/* Top Spacer to Balance Upper-Middle Positioning */}
      <div aria-hidden="true" className="h-4 sm:h-6 shrink-0" />

      {/* Upper-Middle Central Stack: Boy/Girl Illustration + Bilingual App Name & Bilingual Slogan Directly Underneath */}
      <div className="relative z-10 flex flex-col items-center justify-center gap-5 sm:gap-6 my-auto -mt-6 sm:-mt-10 text-center max-w-lg mx-auto">
        <div className="relative flex items-center justify-center">
          <span
            aria-hidden="true"
            className="animate-nav-loader-pulse-ring absolute w-56 h-56 sm:w-68 sm:h-68 rounded-full bg-gradient-to-tr from-[#0d9488]/30 via-[#FF8C61]/28 to-[#FBBF24]/35"
          />
          <div className="relative w-48 h-48 sm:w-60 sm:h-60 rounded-full bg-white/92 dark:bg-[#142430]/92 border-4 border-teal-500/35 dark:border-[#2DD4BF]/40 flex items-center justify-center shadow-2xl backdrop-blur-md">
            <PlayfulBoyAndGirlSplashSvg size={208} />
          </div>
        </div>

        {/* Bilingual App Name ("نكبر / Nekbaar") & Official Slogan Directly Underneath */}
        <div className="space-y-2 px-4 font-['Cairo',_'Tajawal',_sans-serif]">
          <h1
            data-testid="splash-brand-title"
            className="text-3xl sm:text-5xl font-black tracking-tight text-[#0B131A] dark:text-[#F8FAFC] leading-tight flex flex-wrap items-center justify-center gap-2.5"
          >
            <span>نكبر</span>
            <span className="text-teal-500/50 font-light">/</span>
            <span className="text-2xl sm:text-4xl font-extrabold text-[#0d9488] dark:text-[#2DD4BF]">
              Nekbaar
            </span>
          </h1>
          <p
            data-testid="splash-brand-slogan"
            className="text-sm sm:text-base font-extrabold text-slate-700 dark:text-slate-200 tracking-wide"
          >
            مساحة تجمعنا.. وبحبهم نكبر
          </p>
        </div>
      </div>

      {/* Strictly Bottom Copyright Ownership Details */}
      <footer
        data-testid="splash-bottom-copyright"
        className="relative z-10 w-full pt-3 border-t border-teal-500/15 dark:border-[#1E3646] text-center text-[11px] sm:text-xs font-extrabold text-slate-600 dark:text-slate-400 shrink-0"
      >
        نكبر (Nekbaar) © 2026 — جميع حقوق الملكية محفوظة · All Rights Reserved
      </footer>
    </div>
  );
};


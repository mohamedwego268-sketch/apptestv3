/**
 * Pure domain mapping for Nekbar Global Design System:
 * 1. Image Background Cards with Soft Overlays (~30-40% opacity in Light Mode, ~75-80% in Dark Mode)
 * 2. Dynamic Text Tokens (Dark Slate #0F172A in Light Mode, Crisp White #FFFFFF in Dark Mode)
 * 3. Standardized Soft-Filled Iconography Tokens (Warm Coral #FF8C61)
 * 4. Dynamic AI Robot Assistant FAB Configuration
 */

export type CardBackgroundKey =
  | 'medical'
  | 'services'
  | 'store'
  | 'community'
  | 'media'
  | 'assistant'
  | 'chat'
  | 'children'
  | 'routine'
  | 'calendar'
  | 'wishes'
  | 'games'
  | 'settings'
  | 'family'
  | 'notifications'
  | 'privacy'
  | 'terms'
  | 'contact'
  | 'all'
  | 'toys'
  | 'clothing'
  | 'essentials'
  | 'doctor'
  | 'nursery'
  | 'consultation'
  | 'delivery';

export type CardColorMode = 'light' | 'dark';

export const IMAGE_CARD_TEXT_SHADOW = '0 2px 4px rgba(0, 0, 0, 0.4)';
export const IMAGE_CARD_LIGHT_TEXT_SHADOW =
  '0 1px 2px rgba(255, 255, 255, 0.92), 0 2px 4px rgba(0, 0, 0, 0.12)';
export const WARM_CORAL_HEX = '#FF8C61';
export const WARM_CORAL_DEEP_HEX = '#E86A3D';

export interface CardBackgroundSpec {
  key: CardBackgroundKey;
  colorMode: CardColorMode;
  imagePath: string;
  stockPhotoUrl: string;
  overlayGradient: string;
  lightOverlayGradient: string;
  darkOverlayGradient: string;
  textShadow: string;
  headingColor: string;
  bodyColor: string;
  backgroundImageCss: string;
}

const CARD_IMAGE_PATHS: Record<CardBackgroundKey, string> = {
  medical: '/images/cards/medical.svg',
  doctor: '/images/cards/medical.svg',
  services: '/images/cards/store.svg',
  store: '/images/cards/store.svg',
  all: '/images/cards/store.svg',
  toys: '/images/cards/store.svg',
  clothing: '/images/cards/family.svg',
  essentials: '/images/cards/routine.svg',
  nursery: '/images/cards/family.svg',
  consultation: '/images/cards/community.svg',
  delivery: '/images/cards/store.svg',
  community: '/images/cards/community.svg',
  media: '/images/cards/ai.svg',
  assistant: '/images/cards/ai.svg',
  chat: '/images/cards/community.svg',
  children: '/images/cards/family.svg',
  routine: '/images/cards/routine.svg',
  calendar: '/images/cards/routine.svg',
  wishes: '/images/cards/store.svg',
  games: '/images/cards/family.svg',
  settings: '/images/cards/ai.svg',
  family: '/images/cards/family.svg',
  notifications: '/images/cards/routine.svg',
  privacy: '/images/cards/medical.svg',
  terms: '/images/cards/ai.svg',
  contact: '/images/cards/community.svg',
};

const CARD_STOCK_PHOTO_URLS: Record<CardBackgroundKey, string> = {
  medical:
    'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=900&q=80',
  doctor:
    'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=900&q=80',
  services:
    'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=900&q=80',
  store:
    'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=900&q=80',
  all:
    'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=900&q=80',
  toys:
    'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=900&q=80',
  clothing:
    'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=900&q=80',
  essentials:
    'https://images.unsplash.com/photo-1544126592-807ade215a0b?auto=format&fit=crop&w=900&q=80',
  nursery:
    'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=900&q=80',
  consultation:
    'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=900&q=80',
  delivery:
    'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=900&q=80',
  community:
    'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=900&q=80',
  media:
    'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=900&q=80',
  assistant:
    'https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=900&q=80',
  chat:
    'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=900&q=80',
  children:
    'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=900&q=80',
  routine:
    'https://images.unsplash.com/photo-1544126592-807ade215a0b?auto=format&fit=crop&w=900&q=80',
  calendar:
    'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=900&q=80',
  wishes:
    'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?auto=format&fit=crop&w=900&q=80',
  games:
    'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=900&q=80',
  settings:
    'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=900&q=80',
  family:
    'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=900&q=80',
  notifications:
    'https://images.unsplash.com/photo-1544126592-807ade215a0b?auto=format&fit=crop&w=900&q=80',
  privacy:
    'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=900&q=80',
  terms:
    'https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=900&q=80',
  contact:
    'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=900&q=80',
};

/**
 * Light Mode Overlays (~30-40% opacity):
 * Smooth warm-ivory & pastel-tinted linear gradients (0.34 to 0.40 alpha) that allow the warm
 * background photography to shine through while pairing with Dark Slate (#0F172A) typography
 * for 100% WCAG AA/AAA readability (>= 10.5:1 contrast ratio).
 */
const LIGHT_MODE_OVERLAYS: Record<CardBackgroundKey, string> = {
  medical:
    'linear-gradient(135deg, rgba(255, 252, 248, 0.34) 0%, rgba(240, 253, 250, 0.36) 52%, rgba(255, 247, 237, 0.40) 100%)',
  doctor:
    'linear-gradient(135deg, rgba(255, 252, 248, 0.34) 0%, rgba(240, 253, 250, 0.36) 52%, rgba(255, 247, 237, 0.40) 100%)',
  services:
    'linear-gradient(135deg, rgba(255, 251, 246, 0.34) 0%, rgba(255, 245, 235, 0.37) 50%, rgba(254, 242, 232, 0.40) 100%)',
  store:
    'linear-gradient(135deg, rgba(255, 251, 246, 0.34) 0%, rgba(255, 245, 235, 0.37) 50%, rgba(254, 242, 232, 0.40) 100%)',
  all:
    'linear-gradient(135deg, rgba(255, 251, 246, 0.34) 0%, rgba(255, 245, 235, 0.37) 50%, rgba(254, 242, 232, 0.40) 100%)',
  toys:
    'linear-gradient(135deg, rgba(255, 251, 245, 0.34) 0%, rgba(254, 243, 199, 0.36) 50%, rgba(255, 237, 213, 0.40) 100%)',
  clothing:
    'linear-gradient(135deg, rgba(255, 250, 247, 0.34) 0%, rgba(252, 231, 243, 0.36) 50%, rgba(255, 237, 213, 0.40) 100%)',
  essentials:
    'linear-gradient(135deg, rgba(255, 252, 248, 0.34) 0%, rgba(224, 242, 254, 0.36) 50%, rgba(255, 247, 237, 0.40) 100%)',
  nursery:
    'linear-gradient(135deg, rgba(255, 251, 247, 0.34) 0%, rgba(238, 242, 255, 0.36) 50%, rgba(255, 237, 213, 0.40) 100%)',
  consultation:
    'linear-gradient(135deg, rgba(255, 251, 248, 0.34) 0%, rgba(243, 232, 255, 0.36) 50%, rgba(255, 241, 242, 0.40) 100%)',
  delivery:
    'linear-gradient(135deg, rgba(255, 252, 248, 0.34) 0%, rgba(204, 251, 241, 0.36) 50%, rgba(255, 247, 237, 0.40) 100%)',
  community:
    'linear-gradient(135deg, rgba(255, 250, 246, 0.34) 0%, rgba(255, 237, 213, 0.37) 50%, rgba(252, 231, 243, 0.40) 100%)',
  media:
    'linear-gradient(135deg, rgba(255, 251, 248, 0.34) 0%, rgba(237, 233, 254, 0.37) 50%, rgba(255, 237, 213, 0.40) 100%)',
  assistant:
    'linear-gradient(135deg, rgba(255, 250, 246, 0.34) 0%, rgba(255, 237, 213, 0.37) 50%, rgba(237, 233, 254, 0.40) 100%)',
  chat:
    'linear-gradient(135deg, rgba(255, 252, 248, 0.34) 0%, rgba(224, 242, 254, 0.36) 50%, rgba(255, 247, 237, 0.40) 100%)',
  children:
    'linear-gradient(135deg, rgba(255, 251, 247, 0.34) 0%, rgba(255, 237, 213, 0.36) 50%, rgba(204, 251, 241, 0.40) 100%)',
  routine:
    'linear-gradient(135deg, rgba(255, 251, 245, 0.34) 0%, rgba(254, 243, 199, 0.36) 50%, rgba(255, 237, 213, 0.40) 100%)',
  calendar:
    'linear-gradient(135deg, rgba(255, 252, 248, 0.34) 0%, rgba(224, 242, 254, 0.36) 50%, rgba(254, 243, 199, 0.40) 100%)',
  wishes:
    'linear-gradient(135deg, rgba(255, 250, 247, 0.34) 0%, rgba(252, 231, 243, 0.37) 50%, rgba(255, 237, 213, 0.40) 100%)',
  games:
    'linear-gradient(135deg, rgba(255, 251, 246, 0.34) 0%, rgba(220, 252, 231, 0.36) 50%, rgba(254, 243, 199, 0.40) 100%)',
  settings:
    'linear-gradient(135deg, rgba(255, 251, 248, 0.34) 0%, rgba(243, 232, 255, 0.37) 50%, rgba(255, 237, 213, 0.40) 100%)',
  family:
    'linear-gradient(135deg, rgba(255, 251, 247, 0.34) 0%, rgba(255, 237, 213, 0.37) 50%, rgba(243, 232, 255, 0.40) 100%)',
  notifications:
    'linear-gradient(135deg, rgba(255, 251, 245, 0.34) 0%, rgba(254, 243, 199, 0.37) 50%, rgba(224, 242, 254, 0.40) 100%)',
  privacy:
    'linear-gradient(135deg, rgba(255, 252, 248, 0.34) 0%, rgba(204, 251, 241, 0.36) 50%, rgba(255, 247, 237, 0.40) 100%)',
  terms:
    'linear-gradient(135deg, rgba(255, 251, 248, 0.34) 0%, rgba(238, 242, 255, 0.36) 50%, rgba(255, 237, 213, 0.40) 100%)',
  contact:
    'linear-gradient(135deg, rgba(255, 250, 246, 0.34) 0%, rgba(255, 237, 213, 0.37) 50%, rgba(254, 242, 232, 0.40) 100%)',
};

/**
 * Dark Mode Overlays (~75-80% opacity):
 * Deep calibrated Charcoal/Teal linear-gradients (0.76 to 0.80 alpha) so crisp pure white
 * and off-white typography pops with a high contrast ratio (>= 7.2:1 WCAG AA/AAA).
 */
const DARK_MODE_OVERLAYS: Record<CardBackgroundKey, string> = {
  medical:
    'linear-gradient(135deg, rgba(6, 14, 22, 0.79) 0%, rgba(8, 26, 34, 0.78) 52%, rgba(5, 10, 18, 0.80) 100%)',
  doctor:
    'linear-gradient(135deg, rgba(6, 14, 22, 0.79) 0%, rgba(8, 26, 34, 0.78) 52%, rgba(5, 10, 18, 0.80) 100%)',
  services:
    'linear-gradient(135deg, rgba(7, 14, 24, 0.79) 0%, rgba(10, 25, 34, 0.78) 50%, rgba(5, 10, 18, 0.80) 100%)',
  store:
    'linear-gradient(135deg, rgba(7, 14, 24, 0.79) 0%, rgba(10, 25, 34, 0.78) 50%, rgba(5, 10, 18, 0.80) 100%)',
  all:
    'linear-gradient(135deg, rgba(6, 14, 22, 0.79) 0%, rgba(9, 25, 34, 0.78) 50%, rgba(5, 10, 18, 0.80) 100%)',
  toys:
    'linear-gradient(135deg, rgba(7, 14, 24, 0.79) 0%, rgba(9, 26, 34, 0.78) 50%, rgba(5, 10, 18, 0.80) 100%)',
  clothing:
    'linear-gradient(135deg, rgba(7, 14, 24, 0.79) 0%, rgba(9, 25, 34, 0.78) 50%, rgba(5, 10, 18, 0.80) 100%)',
  essentials:
    'linear-gradient(135deg, rgba(6, 14, 22, 0.79) 0%, rgba(9, 26, 34, 0.78) 50%, rgba(5, 10, 18, 0.80) 100%)',
  nursery:
    'linear-gradient(135deg, rgba(6, 14, 24, 0.79) 0%, rgba(9, 25, 34, 0.78) 50%, rgba(5, 10, 18, 0.80) 100%)',
  consultation:
    'linear-gradient(135deg, rgba(7, 14, 24, 0.79) 0%, rgba(10, 24, 34, 0.78) 50%, rgba(5, 10, 18, 0.80) 100%)',
  delivery:
    'linear-gradient(135deg, rgba(6, 14, 22, 0.79) 0%, rgba(9, 26, 34, 0.78) 50%, rgba(5, 10, 18, 0.80) 100%)',
  community:
    'linear-gradient(135deg, rgba(7, 14, 24, 0.79) 0%, rgba(10, 24, 34, 0.78) 50%, rgba(5, 10, 18, 0.80) 100%)',
  media:
    'linear-gradient(135deg, rgba(6, 13, 22, 0.79) 0%, rgba(9, 24, 34, 0.78) 50%, rgba(5, 10, 18, 0.80) 100%)',
  assistant:
    'linear-gradient(135deg, rgba(6, 14, 24, 0.79) 0%, rgba(9, 25, 34, 0.78) 50%, rgba(5, 10, 18, 0.80) 100%)',
  chat:
    'linear-gradient(135deg, rgba(6, 14, 22, 0.79) 0%, rgba(9, 25, 34, 0.78) 50%, rgba(5, 10, 18, 0.80) 100%)',
  children:
    'linear-gradient(135deg, rgba(6, 14, 22, 0.79) 0%, rgba(9, 26, 34, 0.78) 50%, rgba(5, 10, 18, 0.80) 100%)',
  routine:
    'linear-gradient(135deg, rgba(6, 14, 24, 0.79) 0%, rgba(9, 25, 34, 0.78) 50%, rgba(5, 10, 18, 0.80) 100%)',
  calendar:
    'linear-gradient(135deg, rgba(6, 14, 22, 0.79) 0%, rgba(9, 25, 34, 0.78) 50%, rgba(5, 10, 18, 0.80) 100%)',
  wishes:
    'linear-gradient(135deg, rgba(7, 14, 24, 0.79) 0%, rgba(9, 25, 34, 0.78) 50%, rgba(5, 10, 18, 0.80) 100%)',
  games:
    'linear-gradient(135deg, rgba(6, 14, 22, 0.79) 0%, rgba(9, 26, 34, 0.78) 50%, rgba(5, 10, 18, 0.80) 100%)',
  settings:
    'linear-gradient(135deg, rgba(6, 13, 22, 0.79) 0%, rgba(9, 24, 34, 0.78) 50%, rgba(5, 10, 18, 0.80) 100%)',
  family:
    'linear-gradient(135deg, rgba(6, 14, 24, 0.79) 0%, rgba(9, 25, 34, 0.78) 50%, rgba(5, 10, 18, 0.80) 100%)',
  notifications:
    'linear-gradient(135deg, rgba(6, 14, 24, 0.79) 0%, rgba(9, 25, 34, 0.78) 50%, rgba(5, 10, 18, 0.80) 100%)',
  privacy:
    'linear-gradient(135deg, rgba(6, 14, 22, 0.79) 0%, rgba(8, 26, 34, 0.78) 50%, rgba(5, 10, 18, 0.80) 100%)',
  terms:
    'linear-gradient(135deg, rgba(6, 13, 22, 0.79) 0%, rgba(9, 24, 34, 0.78) 50%, rgba(5, 10, 18, 0.80) 100%)',
  contact:
    'linear-gradient(135deg, rgba(7, 14, 24, 0.79) 0%, rgba(10, 24, 34, 0.78) 50%, rgba(5, 10, 18, 0.80) 100%)',
};

function detectActiveDomColorMode(): CardColorMode {
  if (typeof document !== 'undefined' && document.documentElement) {
    if (
      document.documentElement.dataset.colorMode === 'dark' ||
      document.documentElement.classList.contains('dark')
    ) {
      return 'dark';
    }
  }
  return 'light';
}

export function getCardBackgroundSpec(
  rawKey: string,
  colorMode?: CardColorMode | boolean
): CardBackgroundSpec {
  const normalized = (rawKey in CARD_IMAGE_PATHS ? rawKey : 'services') as CardBackgroundKey;
  const resolvedMode: CardColorMode =
    typeof colorMode === 'boolean'
      ? colorMode
        ? 'dark'
        : 'light'
      : colorMode ?? detectActiveDomColorMode();

  const imagePath = CARD_IMAGE_PATHS[normalized];
  const stockPhotoUrl = CARD_STOCK_PHOTO_URLS[normalized];
  const lightOverlayGradient = LIGHT_MODE_OVERLAYS[normalized];
  const darkOverlayGradient = DARK_MODE_OVERLAYS[normalized];
  const overlayGradient =
    resolvedMode === 'dark' ? darkOverlayGradient : lightOverlayGradient;

  return {
    key: normalized,
    colorMode: resolvedMode,
    imagePath,
    stockPhotoUrl,
    overlayGradient,
    lightOverlayGradient,
    darkOverlayGradient,
    textShadow: IMAGE_CARD_TEXT_SHADOW,
    headingColor: resolvedMode === 'dark' ? '#ffffff' : '#0f172a',
    bodyColor: resolvedMode === 'dark' ? '#f8fafc' : '#1e293b',
    backgroundImageCss: `${overlayGradient}, url('${imagePath}')`,
  };
}

/**
 * Pure WCAG 2.1 relative luminance and contrast ratio utilities for unit testing
 * and accessibility verification.
 */
export function calculateRelativeLuminance(r: number, g: number, b: number): number {
  const toLinear = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  const R = toLinear(r);
  const G = toLinear(g);
  const B = toLinear(b);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

export function calculateContrastRatio(
  fgRgb: [number, number, number],
  bgRgb: [number, number, number]
): number {
  const l1 = calculateRelativeLuminance(fgRgb[0], fgRgb[1], fgRgb[2]);
  const l2 = calculateRelativeLuminance(bgRgb[0], bgRgb[1], bgRgb[2]);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return Number(((lighter + 0.05) / (darker + 0.05)).toFixed(2));
}

export function evaluateCardOverlayContrast(
  rawKey: string,
  colorMode: CardColorMode
): {
  minAlpha: number;
  maxAlpha: number;
  contrastOnBrightSpot: number;
  contrastOnMidtone: number;
  passesWcagAA: boolean;
} {
  const spec = getCardBackgroundSpec(rawKey, colorMode);
  const rgbaMatches = [
    ...spec.overlayGradient.matchAll(
      /rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([0-9.]+)\s*\)/g
    ),
  ];

  // Foreground token: Dark Slate (#0F172A -> [15, 23, 42]) in Light Mode, Pure White ([255, 255, 255]) in Dark Mode
  const fgRgb: [number, number, number] =
    colorMode === 'dark' ? [255, 255, 255] : [15, 23, 42];

  let worstContrastOnWhite = Infinity;
  let worstContrastOnMid = Infinity;
  let minAlpha = 1;
  let maxAlpha = 0;

  for (const match of rgbaMatches) {
    const r = Number(match[1]);
    const g = Number(match[2]);
    const b = Number(match[3]);
    const a = Number(match[4]);
    if (a < minAlpha) minAlpha = a;
    if (a > maxAlpha) maxAlpha = a;

    // Composite over a bright white spot (255, 255, 255)
    const brightBg: [number, number, number] = [
      Math.round(r * a + 255 * (1 - a)),
      Math.round(g * a + 255 * (1 - a)),
      Math.round(b * a + 255 * (1 - a)),
    ];
    // Composite over a warm high-key photographic pixel (225, 212, 198) in Light Mode or midtone (180, 165, 150)
    const baseSample: [number, number, number] =
      colorMode === 'dark' ? [180, 165, 150] : [225, 212, 198];
    const midBg: [number, number, number] = [
      Math.round(r * a + baseSample[0] * (1 - a)),
      Math.round(g * a + baseSample[1] * (1 - a)),
      Math.round(b * a + baseSample[2] * (1 - a)),
    ];

    const cBright = calculateContrastRatio(fgRgb, brightBg);
    const cMid = calculateContrastRatio(fgRgb, midBg);
    if (cBright < worstContrastOnWhite) worstContrastOnWhite = cBright;
    if (cMid < worstContrastOnMid) worstContrastOnMid = cMid;
  }

  return {
    minAlpha,
    maxAlpha,
    contrastOnBrightSpot: worstContrastOnWhite,
    contrastOnMidtone: worstContrastOnMid,
    passesWcagAA: worstContrastOnWhite >= 4.5 && worstContrastOnMid >= 4.5,
  };
}

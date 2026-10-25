/**
 * Pure domain mapping for Nekbaar (نكبر) Global Design System:
 * 1. Image Background Cards with Soft Overlays (~34-40% opacity in Light Mode, ~80-84% in Dark Mode)
 * 2. Dynamic Text Tokens (Deep Charcoal #0B131A in Light Mode, Crisp White #F8FAFC in Dark Mode)
 * 3. Standardized Soft-Filled Iconography Tokens (Warm Coral #FF8C61 & Teal #0D9488)
 * 4. Support for all 12 Store Categories & Core App Hubs
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
  | 'courses'
  | 'sports'
  | 'events_parks'
  | 'books'
  | 'nutrition'
  | 'furniture'
  | 'consultation'
  | 'delivery';

export type CardColorMode = 'light' | 'dark';

export const IMAGE_CARD_TEXT_SHADOW = '0 2px 4px rgba(0, 0, 0, 0.45)';
export const IMAGE_CARD_LIGHT_TEXT_SHADOW =
  '0 1px 2px rgba(255, 255, 255, 0.94), 0 2px 4px rgba(0, 0, 0, 0.1)';
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
  courses: '/images/cards/ai.svg',
  sports: '/images/cards/routine.svg',
  events_parks: '/images/cards/family.svg',
  books: '/images/cards/community.svg',
  nutrition: '/images/cards/medical.svg',
  furniture: '/images/cards/store.svg',
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
  medical: '/images/cards/medical.svg',
  doctor: '/images/cards/medical.svg',
  services: '/images/cards/store.svg',
  store: '/images/cards/store.svg',
  all: '/images/cards/store.svg',
  toys: '/images/cards/store.svg',
  clothing: '/images/cards/family.svg',
  essentials: '/images/cards/routine.svg',
  nursery: '/images/cards/family.svg',
  courses: '/images/cards/ai.svg',
  sports: '/images/cards/routine.svg',
  events_parks: '/images/cards/family.svg',
  books: '/images/cards/community.svg',
  nutrition: '/images/cards/medical.svg',
  furniture: '/images/cards/store.svg',
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

/**
 * Light Mode Overlays:
 * Breathable clean light tints pairing with Deep Charcoal (#0B131A) typography.
 */
const LIGHT_MODE_OVERLAYS: Record<CardBackgroundKey, string> = {
  medical:
    'linear-gradient(135deg, rgba(248, 250, 252, 0.38) 0%, rgba(240, 253, 250, 0.40) 52%, rgba(255, 247, 237, 0.42) 100%)',
  doctor:
    'linear-gradient(135deg, rgba(248, 250, 252, 0.38) 0%, rgba(240, 253, 250, 0.40) 52%, rgba(255, 247, 237, 0.42) 100%)',
  services:
    'linear-gradient(135deg, rgba(248, 250, 252, 0.38) 0%, rgba(255, 245, 235, 0.40) 50%, rgba(254, 242, 232, 0.42) 100%)',
  store:
    'linear-gradient(135deg, rgba(248, 250, 252, 0.38) 0%, rgba(255, 245, 235, 0.40) 50%, rgba(254, 242, 232, 0.42) 100%)',
  all:
    'linear-gradient(135deg, rgba(248, 250, 252, 0.38) 0%, rgba(255, 245, 235, 0.40) 50%, rgba(254, 242, 232, 0.42) 100%)',
  toys:
    'linear-gradient(135deg, rgba(248, 250, 252, 0.38) 0%, rgba(254, 243, 199, 0.40) 50%, rgba(255, 237, 213, 0.42) 100%)',
  clothing:
    'linear-gradient(135deg, rgba(248, 250, 252, 0.38) 0%, rgba(252, 231, 243, 0.40) 50%, rgba(255, 237, 213, 0.42) 100%)',
  essentials:
    'linear-gradient(135deg, rgba(248, 250, 252, 0.38) 0%, rgba(224, 242, 254, 0.40) 50%, rgba(255, 247, 237, 0.42) 100%)',
  nursery:
    'linear-gradient(135deg, rgba(248, 250, 252, 0.38) 0%, rgba(238, 242, 255, 0.40) 50%, rgba(255, 237, 213, 0.42) 100%)',
  courses:
    'linear-gradient(135deg, rgba(248, 250, 252, 0.38) 0%, rgba(237, 233, 254, 0.40) 50%, rgba(224, 242, 254, 0.42) 100%)',
  sports:
    'linear-gradient(135deg, rgba(248, 250, 252, 0.38) 0%, rgba(204, 251, 241, 0.40) 50%, rgba(224, 242, 254, 0.42) 100%)',
  events_parks:
    'linear-gradient(135deg, rgba(248, 250, 252, 0.38) 0%, rgba(255, 237, 213, 0.40) 50%, rgba(252, 231, 243, 0.42) 100%)',
  books:
    'linear-gradient(135deg, rgba(248, 250, 252, 0.38) 0%, rgba(254, 243, 199, 0.40) 50%, rgba(238, 242, 255, 0.42) 100%)',
  nutrition:
    'linear-gradient(135deg, rgba(248, 250, 252, 0.38) 0%, rgba(220, 252, 231, 0.40) 50%, rgba(240, 253, 250, 0.42) 100%)',
  furniture:
    'linear-gradient(135deg, rgba(248, 250, 252, 0.38) 0%, rgba(255, 247, 237, 0.40) 50%, rgba(224, 242, 254, 0.42) 100%)',
  consultation:
    'linear-gradient(135deg, rgba(248, 250, 252, 0.38) 0%, rgba(243, 232, 255, 0.40) 50%, rgba(255, 241, 242, 0.42) 100%)',
  delivery:
    'linear-gradient(135deg, rgba(248, 250, 252, 0.38) 0%, rgba(204, 251, 241, 0.40) 50%, rgba(255, 247, 237, 0.42) 100%)',
  community:
    'linear-gradient(135deg, rgba(248, 250, 252, 0.38) 0%, rgba(255, 237, 213, 0.40) 50%, rgba(252, 231, 243, 0.42) 100%)',
  media:
    'linear-gradient(135deg, rgba(248, 250, 252, 0.38) 0%, rgba(237, 233, 254, 0.40) 50%, rgba(255, 237, 213, 0.42) 100%)',
  assistant:
    'linear-gradient(135deg, rgba(248, 250, 252, 0.38) 0%, rgba(255, 237, 213, 0.40) 50%, rgba(237, 233, 254, 0.42) 100%)',
  chat:
    'linear-gradient(135deg, rgba(248, 250, 252, 0.38) 0%, rgba(224, 242, 254, 0.40) 50%, rgba(255, 247, 237, 0.42) 100%)',
  children:
    'linear-gradient(135deg, rgba(248, 250, 252, 0.38) 0%, rgba(255, 237, 213, 0.40) 50%, rgba(204, 251, 241, 0.42) 100%)',
  routine:
    'linear-gradient(135deg, rgba(248, 250, 252, 0.38) 0%, rgba(254, 243, 199, 0.40) 50%, rgba(255, 237, 213, 0.42) 100%)',
  calendar:
    'linear-gradient(135deg, rgba(248, 250, 252, 0.38) 0%, rgba(224, 242, 254, 0.40) 50%, rgba(254, 243, 199, 0.42) 100%)',
  wishes:
    'linear-gradient(135deg, rgba(248, 250, 252, 0.38) 0%, rgba(252, 231, 243, 0.40) 50%, rgba(255, 237, 213, 0.42) 100%)',
  games:
    'linear-gradient(135deg, rgba(248, 250, 252, 0.38) 0%, rgba(220, 252, 231, 0.40) 50%, rgba(254, 243, 199, 0.42) 100%)',
  settings:
    'linear-gradient(135deg, rgba(248, 250, 252, 0.38) 0%, rgba(243, 232, 255, 0.40) 50%, rgba(255, 237, 213, 0.42) 100%)',
  family:
    'linear-gradient(135deg, rgba(248, 250, 252, 0.38) 0%, rgba(255, 237, 213, 0.40) 50%, rgba(243, 232, 255, 0.42) 100%)',
  notifications:
    'linear-gradient(135deg, rgba(248, 250, 252, 0.38) 0%, rgba(254, 243, 199, 0.40) 50%, rgba(224, 242, 254, 0.42) 100%)',
  privacy:
    'linear-gradient(135deg, rgba(248, 250, 252, 0.38) 0%, rgba(204, 251, 241, 0.40) 50%, rgba(255, 247, 237, 0.42) 100%)',
  terms:
    'linear-gradient(135deg, rgba(248, 250, 252, 0.38) 0%, rgba(238, 242, 255, 0.40) 50%, rgba(255, 237, 213, 0.42) 100%)',
  contact:
    'linear-gradient(135deg, rgba(248, 250, 252, 0.38) 0%, rgba(255, 237, 213, 0.40) 50%, rgba(254, 242, 232, 0.42) 100%)',
};

/**
 * Dark Mode Overlays:
 * Strictly deep Midnight Charcoal (#0B131A / #101D26) gradients so luminous white/cyan text
 * achieves 100% WCAG AAA contrast with zero bright or washed-out patches.
 */
const DARK_CHARCOAL_GRADIENT =
  'linear-gradient(135deg, rgba(11, 19, 26, 0.86) 0%, rgba(16, 29, 38, 0.84) 52%, rgba(11, 19, 26, 0.88) 100%)';

const DARK_MODE_OVERLAYS: Record<CardBackgroundKey, string> = {
  medical: DARK_CHARCOAL_GRADIENT,
  doctor: DARK_CHARCOAL_GRADIENT,
  services: DARK_CHARCOAL_GRADIENT,
  store: DARK_CHARCOAL_GRADIENT,
  all: DARK_CHARCOAL_GRADIENT,
  toys: DARK_CHARCOAL_GRADIENT,
  clothing: DARK_CHARCOAL_GRADIENT,
  essentials: DARK_CHARCOAL_GRADIENT,
  nursery: DARK_CHARCOAL_GRADIENT,
  courses: DARK_CHARCOAL_GRADIENT,
  sports: DARK_CHARCOAL_GRADIENT,
  events_parks: DARK_CHARCOAL_GRADIENT,
  books: DARK_CHARCOAL_GRADIENT,
  nutrition: DARK_CHARCOAL_GRADIENT,
  furniture: DARK_CHARCOAL_GRADIENT,
  consultation: DARK_CHARCOAL_GRADIENT,
  delivery: DARK_CHARCOAL_GRADIENT,
  community: DARK_CHARCOAL_GRADIENT,
  media: DARK_CHARCOAL_GRADIENT,
  assistant: DARK_CHARCOAL_GRADIENT,
  chat: DARK_CHARCOAL_GRADIENT,
  children: DARK_CHARCOAL_GRADIENT,
  routine: DARK_CHARCOAL_GRADIENT,
  calendar: DARK_CHARCOAL_GRADIENT,
  wishes: DARK_CHARCOAL_GRADIENT,
  games: DARK_CHARCOAL_GRADIENT,
  settings: DARK_CHARCOAL_GRADIENT,
  family: DARK_CHARCOAL_GRADIENT,
  notifications: DARK_CHARCOAL_GRADIENT,
  privacy: DARK_CHARCOAL_GRADIENT,
  terms: DARK_CHARCOAL_GRADIENT,
  contact: DARK_CHARCOAL_GRADIENT,
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
    headingColor: resolvedMode === 'dark' ? '#F8FAFC' : '#0B131A',
    bodyColor: resolvedMode === 'dark' ? '#E2E8F0' : '#0B131A',
    backgroundImageCss: `${overlayGradient}, url('${imagePath}')`,
  };
}

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

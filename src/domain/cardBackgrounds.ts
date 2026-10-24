/**
 * Pure domain mapping for Image Background Cards & Teal/Dark Linear-Gradient Overlays.
 * Replaces flat solid cards and small title icons with warm family/medical/shopping
 * background imagery and a ~60% opacity Teal/Dark CSS linear-gradient overlay.
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
  | 'all'
  | 'toys'
  | 'clothing'
  | 'essentials'
  | 'doctor'
  | 'nursery'
  | 'consultation'
  | 'delivery';

export interface CardBackgroundSpec {
  key: CardBackgroundKey;
  imagePath: string;
  overlayGradient: string;
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
};

const TEAL_DARK_OVERLAYS: Record<CardBackgroundKey, string> = {
  medical:
    'linear-gradient(135deg, rgba(13, 68, 74, 0.72) 0%, rgba(15, 92, 99, 0.60) 52%, rgba(15, 23, 42, 0.76) 100%)',
  doctor:
    'linear-gradient(135deg, rgba(13, 68, 74, 0.72) 0%, rgba(15, 92, 99, 0.60) 52%, rgba(15, 23, 42, 0.76) 100%)',
  services:
    'linear-gradient(135deg, rgba(17, 64, 74, 0.70) 0%, rgba(24, 92, 102, 0.58) 50%, rgba(19, 28, 46, 0.76) 100%)',
  store:
    'linear-gradient(135deg, rgba(17, 64, 74, 0.70) 0%, rgba(24, 92, 102, 0.58) 50%, rgba(19, 28, 46, 0.76) 100%)',
  all:
    'linear-gradient(135deg, rgba(15, 66, 76, 0.70) 0%, rgba(20, 88, 98, 0.58) 50%, rgba(15, 23, 42, 0.76) 100%)',
  toys:
    'linear-gradient(135deg, rgba(19, 68, 78, 0.68) 0%, rgba(24, 96, 104, 0.58) 50%, rgba(17, 24, 39, 0.75) 100%)',
  clothing:
    'linear-gradient(135deg, rgba(18, 66, 76, 0.70) 0%, rgba(24, 90, 102, 0.58) 50%, rgba(19, 27, 46, 0.75) 100%)',
  essentials:
    'linear-gradient(135deg, rgba(15, 68, 78, 0.70) 0%, rgba(20, 94, 104, 0.58) 50%, rgba(15, 23, 42, 0.75) 100%)',
  nursery:
    'linear-gradient(135deg, rgba(16, 64, 76, 0.70) 0%, rgba(22, 88, 102, 0.60) 50%, rgba(17, 24, 39, 0.76) 100%)',
  consultation:
    'linear-gradient(135deg, rgba(19, 62, 74, 0.70) 0%, rgba(26, 84, 98, 0.60) 50%, rgba(17, 24, 39, 0.76) 100%)',
  delivery:
    'linear-gradient(135deg, rgba(14, 68, 76, 0.70) 0%, rgba(20, 92, 102, 0.58) 50%, rgba(15, 23, 42, 0.75) 100%)',
  community:
    'linear-gradient(135deg, rgba(18, 62, 74, 0.70) 0%, rgba(24, 84, 96, 0.60) 50%, rgba(17, 25, 40, 0.76) 100%)',
  media:
    'linear-gradient(135deg, rgba(16, 60, 74, 0.72) 0%, rgba(22, 84, 98, 0.60) 50%, rgba(15, 23, 42, 0.76) 100%)',
  assistant:
    'linear-gradient(135deg, rgba(15, 62, 76, 0.72) 0%, rgba(24, 90, 104, 0.60) 50%, rgba(17, 24, 39, 0.78) 100%)',
  chat:
    'linear-gradient(135deg, rgba(14, 66, 78, 0.70) 0%, rgba(20, 90, 104, 0.60) 50%, rgba(15, 23, 42, 0.76) 100%)',
  children:
    'linear-gradient(135deg, rgba(13, 68, 76, 0.70) 0%, rgba(18, 94, 104, 0.58) 50%, rgba(15, 23, 42, 0.75) 100%)',
  routine:
    'linear-gradient(135deg, rgba(16, 64, 76, 0.70) 0%, rgba(22, 88, 100, 0.60) 50%, rgba(17, 24, 39, 0.76) 100%)',
  calendar:
    'linear-gradient(135deg, rgba(14, 66, 78, 0.70) 0%, rgba(20, 92, 104, 0.58) 50%, rgba(15, 23, 42, 0.76) 100%)',
  wishes:
    'linear-gradient(135deg, rgba(18, 64, 76, 0.70) 0%, rgba(24, 88, 100, 0.58) 50%, rgba(17, 24, 39, 0.76) 100%)',
  games:
    'linear-gradient(135deg, rgba(14, 68, 76, 0.70) 0%, rgba(20, 94, 102, 0.58) 50%, rgba(15, 23, 42, 0.75) 100%)',
  settings:
    'linear-gradient(135deg, rgba(16, 60, 74, 0.72) 0%, rgba(22, 82, 96, 0.62) 50%, rgba(15, 23, 42, 0.78) 100%)',
};

export function getCardBackgroundSpec(rawKey: string): CardBackgroundSpec {
  const normalized = (rawKey in CARD_IMAGE_PATHS ? rawKey : 'services') as CardBackgroundKey;
  const imagePath = CARD_IMAGE_PATHS[normalized];
  const overlayGradient = TEAL_DARK_OVERLAYS[normalized];
  return {
    key: normalized,
    imagePath,
    overlayGradient,
    backgroundImageCss: `${overlayGradient}, url('${imagePath}')`,
  };
}

/**
 * Centralized Image-Background Card System & Curated Unsplash Stock Photography
 * Provides reliable, high-contrast Unsplash stock photo URLs for every Store category,
 * product card, horizontal carousel item, and service hub, paired with a dark/light
 * readability overlay so white/dark text and badges remain 100% legible in both modes.
 */

export type CardVisualThemeKey =
  | 'store'
  | 'toys'
  | 'clothing'
  | 'essentials'
  | 'nursery'
  | 'doctor'
  | 'consultation'
  | 'delivery'
  | 'courses'
  | 'sports'
  | 'events_parks'
  | 'books'
  | 'nutrition'
  | 'furniture'
  | 'children'
  | 'routine'
  | 'calendar'
  | 'wishes'
  | 'family'
  | 'games'
  | 'settings';

export type CardBackgroundKey =
  | CardVisualThemeKey
  | 'medical'
  | 'media'
  | 'community'
  | 'chat'
  | 'assistant'
  | 'services'
  | 'health';

/**
 * Local SVG fallback paths in `/public/images/cards/*.svg`
 */
export const CARD_IMAGE_PATHS: Record<CardVisualThemeKey, string> = {
  store: './images/cards/store.svg',
  toys: './images/cards/store.svg',
  clothing: './images/cards/store.svg',
  essentials: './images/cards/store.svg',
  nursery: './images/cards/community.svg',
  doctor: './images/cards/medical.svg',
  consultation: './images/cards/ai.svg',
  delivery: './images/cards/store.svg',
  courses: './images/cards/community.svg',
  sports: './images/cards/routine.svg',
  events_parks: './images/cards/family.svg',
  books: './images/cards/community.svg',
  nutrition: './images/cards/medical.svg',
  furniture: './images/cards/store.svg',
  children: './images/cards/family.svg',
  routine: './images/cards/routine.svg',
  calendar: './images/cards/routine.svg',
  wishes: './images/cards/family.svg',
  family: './images/cards/family.svg',
  games: './images/cards/routine.svg',
  settings: './images/cards/family.svg',
};

/**
 * Primary Curated Unsplash Stock Image URLs per Category / Hub
 * High-availability Unsplash CDN photography for children, toys, baby clothes,
 * organic care products, storybooks, nurseries, clinics, nutrition, and furniture.
 */
export const CARD_STOCK_PHOTO_URLS: Record<CardVisualThemeKey, string> = {
  store:
    'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=900&q=80',
  toys:
    'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=900&q=80',
  clothing:
    'https://images.unsplash.com/photo-1522771930-78848d9293e8?auto=format&fit=crop&w=900&q=80',
  essentials:
    'https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&w=900&q=80',
  nursery:
    'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=900&q=80',
  doctor:
    'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=900&q=80',
  consultation:
    'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=900&q=80',
  delivery:
    'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=900&q=80',
  courses:
    'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=900&q=80',
  sports:
    'https://images.unsplash.com/photo-1526676037777-05a232554f77?auto=format&fit=crop&w=900&q=80',
  events_parks:
    'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=900&q=80',
  books:
    'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=900&q=80',
  nutrition:
    'https://images.unsplash.com/photo-1490818387583-1baba5e638af?auto=format&fit=crop&w=900&q=80',
  furniture:
    'https://images.unsplash.com/photo-1540518614846-7ede433c4efb?auto=format&fit=crop&w=900&q=80',
  children:
    'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=900&q=80',
  routine:
    'https://images.unsplash.com/photo-1484820540004-14229fe36ca4?auto=format&fit=crop&w=900&q=80',
  calendar:
    'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=900&q=80',
  wishes:
    'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?auto=format&fit=crop&w=900&q=80',
  family:
    'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=900&q=80',
  games:
    'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?auto=format&fit=crop&w=900&q=80',
  settings:
    'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=900&q=80',
};

/**
 * Rich multi-photo Unsplash pools per product category so every item in a horizontal
 * carousel or grid gets a distinct, realistic product photograph.
 */
export const CATEGORY_UNSPLASH_POOLS: Record<string, string[]> = {
  toys: [
    'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1587654780291-39c9404d746b?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1558060370-d644479cb6f7?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1545558014-8692077e9b5c?auto=format&fit=crop&w=800&q=80',
  ],
  clothing: [
    'https://images.unsplash.com/photo-1522771930-78848d9293e8?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1519457431-44ccd64a579b?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1503919545889-aef636e10ad4?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1471286174890-9c112ffca5b4?auto=format&fit=crop&w=800&q=80',
  ],
  essentials: [
    'https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1544126592-807ade215a0b?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1515488764276-beab7607c1e6?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80',
  ],
  nursery: [
    'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1587654780291-39c9404d746b?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80',
  ],
  doctor: [
    'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1631815589968-fdb09a223b1e?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?auto=format&fit=crop&w=800&q=80',
  ],
  courses: [
    'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1485546246426-74dc88dec4d9?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=800&q=80',
  ],
  sports: [
    'https://images.unsplash.com/photo-1526676037777-05a232554f77?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1519315901367-f34ff9154487?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=800&q=80',
  ],
  events_parks: [
    'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1464349153735-7db50ed83c84?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1472653431158-6364773b2a56?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=800&q=80',
  ],
  books: [
    'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=800&q=80',
  ],
  nutrition: [
    'https://images.unsplash.com/photo-1490818387583-1baba5e638af?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=800&q=80',
  ],
  furniture: [
    'https://images.unsplash.com/photo-1540518614846-7ede433c4efb?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80',
  ],
  consultation: [
    'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80',
  ],
  delivery: [
    'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?auto=format&fit=crop&w=800&q=80',
  ],
};

/**
 * Deterministically returns a curated Unsplash stock photo URL for a given category and item ID/index.
 */
export function getProductUnsplashImageUrl(category: string, itemIdOrIndex = 0): string {
  const pool = CATEGORY_UNSPLASH_POOLS[category];
  if (pool && pool.length > 0) {
    const idx = Math.abs(itemIdOrIndex) % pool.length;
    return pool[idx];
  }
  const themeKey = resolveCardThemeKey(category);
  return CARD_STOCK_PHOTO_URLS[themeKey];
}

/**
 * Dark Mode Scrim Overlay (#0B131A / #101D26 deep midnight charcoal)
 * Directional bottom-up gradient (`to top`) so the vibrant stock image breathes clearly
 * in the upper area while keeping bottom titles & badges 100% WCAG AAA crisp.
 */
export const CARD_DARK_SCRIM_GRADIENT =
  'linear-gradient(to top, rgba(11, 19, 26, 0.95) 0%, rgba(16, 29, 38, 0.72) 52%, rgba(11, 19, 26, 0.4) 100%)';

/**
 * Light Mode Scrim Overlay
 * Directional bottom-up frosted gradient over the Unsplash stock image so dark charcoal text
 * (`#0F172A`) remains 100% readable in Light Mode while preserving upper image vibrancy.
 */
export const CARD_LIGHT_SCRIM_GRADIENT =
  'linear-gradient(to top, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.78) 52%, rgba(255, 255, 255, 0.38) 100%)';

/** Legacy alias for backward compatibility */
export const CARD_SCRIM_GRADIENT = CARD_DARK_SCRIM_GRADIENT;

/**
 * Maps arbitrary section IDs, store categories, or hub keys to a canonical CardVisualThemeKey.
 */
export function resolveCardThemeKey(rawKey?: string): CardVisualThemeKey {
  if (!rawKey) return 'store';
  const normalized = rawKey.trim().toLowerCase();

  switch (normalized) {
    case 'store':
    case 'services':
    case 'catalog':
      return 'store';
    case 'toys':
    case 'montessori':
      return 'toys';
    case 'clothing':
    case 'apparel':
      return 'clothing';
    case 'essentials':
    case 'care':
    case 'offer':
      return 'essentials';
    case 'nursery':
    case 'school':
      return 'nursery';
    case 'doctor':
    case 'medical':
    case 'health':
    case 'clinic':
      return 'doctor';
    case 'consultation':
    case 'counseling':
    case 'community':
    case 'chat':
    case 'assistant':
      return 'consultation';
    case 'delivery':
    case 'tracking':
      return 'delivery';
    case 'courses':
      return 'courses';
    case 'sports':
      return 'sports';
    case 'events_parks':
      return 'events_parks';
    case 'books':
      return 'books';
    case 'nutrition':
      return 'nutrition';
    case 'furniture':
      return 'furniture';
    case 'children':
    case 'kids':
      return 'children';
    case 'routine':
    case 'tasks':
    case 'media':
      return 'routine';
    case 'calendar':
    case 'events':
      return 'calendar';
    case 'wishes':
    case 'gifts':
      return 'wishes';
    case 'family':
    case 'permissions':
      return 'family';
    case 'games':
    case 'play':
      return 'games';
    case 'settings':
    case 'profile':
      return 'settings';
    default:
      return 'store';
  }
}

export interface CardBackgroundSpec {
  themeKey: CardVisualThemeKey;
  imagePath: string;
  stockPhotoUrl: string;
  overlayGradient: string;
  /** Ready-to-use CSS `backgroundImage` value combining overlay + Unsplash URL + local SVG fallback */
  backgroundImageCss: string;
  /** High-contrast text color token on top of the card */
  textColor: string;
  /** Subtitle / secondary text color token on top of the card */
  subtitleColor: string;
}

/**
 * Returns the complete background specification for any card in the application.
 * Supports an optional `customImageUrl` (e.g. a product's specific Unsplash URL).
 */
export function getCardBackgroundSpec(
  cardKey?: string,
  darkMode = false,
  customImageUrl?: string
): CardBackgroundSpec {
  const themeKey = resolveCardThemeKey(cardKey);
  const imagePath = CARD_IMAGE_PATHS[themeKey];
  const stockPhotoUrl =
    customImageUrl && customImageUrl.trim().length > 0
      ? customImageUrl.trim()
      : CARD_STOCK_PHOTO_URLS[themeKey];
  const overlayGradient = darkMode ? CARD_DARK_SCRIM_GRADIENT : CARD_LIGHT_SCRIM_GRADIENT;

  return {
    themeKey,
    imagePath,
    stockPhotoUrl,
    overlayGradient,
    backgroundImageCss: `${overlayGradient}, url('${stockPhotoUrl}'), url('${imagePath}')`,
    textColor: darkMode ? '#FFFFFF' : '#0F172A',
    subtitleColor: darkMode ? '#E2E8F0' : '#334155',
  };
}

/**
 * Helper returning all configured card image paths for verification & testing.
 */
export function getAllCardImageAssets(): Array<{
  key: CardVisualThemeKey;
  imagePath: string;
  stockPhotoUrl: string;
}> {
  return (Object.keys(CARD_IMAGE_PATHS) as CardVisualThemeKey[]).map((key) => ({
    key,
    imagePath: CARD_IMAGE_PATHS[key],
    stockPhotoUrl: CARD_STOCK_PHOTO_URLS[key],
  }));
}

/**
 * Family Space — 3D Asset Manifest & Visual System Registry
 * Documents all 3D character avatars, 3D icon families, 3D content scenes, and commerce renders.
 * Uses lightweight procedural 3D SVG claymorphism + CSS perspective transforms for zero-latency
 * rendering on mid-range mobile devices, with explicit integration slots for external GLTF/WebP renders.
 */

export type AvatarAccessoryTheme =
  | 'astronaut'
  | 'artist'
  | 'scientist'
  | 'athlete'
  | 'reader'
  | 'nature';

export interface ThreeDAssetManifestEntry {
  id: string;
  category: 'hero-scene' | 'child-avatar' | 'icon-family' | 'content-scene' | 'commerce-scene' | 'game-object';
  titleAr: string;
  titleEn: string;
  renderEngine: 'procedural-3d-svg-clay' | 'css-perspective-scene';
  fallbackStrategy: string;
  licenseNote: string;
}

export const AVATAR_ACCESSORY_THEMES: {
  id: AvatarAccessoryTheme;
  labelAr: string;
  labelEn: string;
  badgeColor: string;
  accentHex: string;
}[] = [
  {
    id: 'astronaut',
    labelAr: 'مستكشف الفضاء ثلاثي الأبعاد',
    labelEn: '3D Space Explorer',
    badgeColor: '#e0f2fe',
    accentHex: '#0284c7',
  },
  {
    id: 'artist',
    labelAr: 'فنان الألوان والإبداع',
    labelEn: '3D Creative Artist',
    badgeColor: '#fce7f3',
    accentHex: '#db2777',
  },
  {
    id: 'scientist',
    labelAr: 'باحث ومبتكر صغير',
    labelEn: '3D Little Scientist',
    badgeColor: '#ede9fe',
    accentHex: '#7c3aed',
  },
  {
    id: 'athlete',
    labelAr: 'بطل الحركة والرياضة',
    labelEn: '3D Active Champion',
    badgeColor: '#dcfce7',
    accentHex: '#16a34a',
  },
  {
    id: 'reader',
    labelAr: 'عاشق القصص والحكايات',
    labelEn: '3D Story Reader',
    badgeColor: '#fef3c7',
    accentHex: '#d97706',
  },
  {
    id: 'nature',
    labelAr: 'صديق الطبيعة والحيوانات',
    labelEn: '3D Nature Friend',
    badgeColor: '#ccfbf1',
    accentHex: '#0d9488',
  },
];

export const THREE_D_ASSET_MANIFEST: ThreeDAssetManifestEntry[] = [
  {
    id: 'scene-family-hero-3d',
    category: 'hero-scene',
    titleAr: 'مشهد الأسرة ثلاثي الأبعاد — لوحة القيادة',
    titleEn: '3D Family Living Room Hero Scene',
    renderEngine: 'css-perspective-scene',
    fallbackStrategy: 'Multi-layered SVG 3D clay render with radial lighting',
    licenseNote: 'Original procedural 3D vector/CSS artwork created for Family Space',
  },
  {
    id: 'avatar-child-3d-system',
    category: 'child-avatar',
    titleAr: 'نظام الهوية البصرية ثلاثية الأبعاد للأطفال (0–8 سنوات)',
    titleEn: '3D Child Profile Character System (0–8 Years)',
    renderEngine: 'procedural-3d-svg-clay',
    fallbackStrategy: 'Preserves uploaded parent photograph when present; renders 3D clay portrait otherwise',
    licenseNote: 'Original procedural 3D character components',
  },
  {
    id: 'icon-pack-family-3d',
    category: 'icon-family',
    titleAr: 'حزمة الأيقونات ثلاثية الأبعاد الموحدة (16 قسمًا)',
    titleEn: 'Unified 3D Volumetric Icon Family (16 Categories)',
    renderEngine: 'procedural-3d-svg-clay',
    fallbackStrategy: 'Accessible high-contrast vector fallback',
    licenseNote: 'Original procedural 3D icon family',
  },
  {
    id: 'scene-health-psychology-3d',
    category: 'content-scene',
    titleAr: 'مشهد الرعاية الصحية والنفسية المطمئن ثلاثي الأبعاد',
    titleEn: 'Reassuring 3D Pediatric & Psychology Scene',
    renderEngine: 'procedural-3d-svg-clay',
    fallbackStrategy: 'Soft dimensional medical & sleep illustration',
    licenseNote: 'Original procedural 3D illustration',
  },
  {
    id: 'scene-commerce-showcase-3d',
    category: 'commerce-scene',
    titleAr: 'منصة عرض المنتجات والألعاب التعليمية ثلاثية الأبعاد',
    titleEn: '3D Merchandising & Educational Toys Podium',
    renderEngine: 'css-perspective-scene',
    fallbackStrategy: 'Layered 3D product gallery cards',
    licenseNote: 'Original procedural 3D commerce showcase',
  },
];

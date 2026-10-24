import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  CardBackgroundKey,
  IMAGE_CARD_TEXT_SHADOW,
  WARM_CORAL_HEX,
  evaluateCardOverlayContrast,
  getCardBackgroundSpec,
} from './cardBackgrounds';

const ALL_CARD_KEYS: CardBackgroundKey[] = [
  'medical',
  'services',
  'store',
  'community',
  'media',
  'assistant',
  'chat',
  'children',
  'routine',
  'calendar',
  'wishes',
  'games',
  'settings',
  'family',
  'notifications',
  'privacy',
  'terms',
  'contact',
  'all',
  'toys',
  'clothing',
  'essentials',
  'doctor',
  'nursery',
  'consultation',
  'delivery',
];

describe('Nekbar Global Design System — Image Background Cards, Soft Overlays & Contrast', () => {
  it('returns distinct calibrated overlays for Light Mode (~30-40% opacity) vs Dark Mode (~75-80% opacity) across all card keys', () => {
    assert.equal(WARM_CORAL_HEX, '#FF8C61');

    for (const key of ALL_CARD_KEYS) {
      const lightSpec = getCardBackgroundSpec(key, 'light');
      const darkSpec = getCardBackgroundSpec(key, 'dark');

      assert.equal(lightSpec.key, key);
      assert.equal(lightSpec.colorMode, 'light');
      assert.equal(darkSpec.colorMode, 'dark');
      assert.ok(lightSpec.imagePath.startsWith('/images/cards/'));
      assert.ok(lightSpec.stockPhotoUrl.startsWith('https://images.unsplash.com/'));
      assert.notEqual(
        lightSpec.overlayGradient,
        darkSpec.overlayGradient,
        `Expected dynamic overlay difference between Light and Dark mode for ${key}`
      );
      assert.equal(lightSpec.headingColor, '#0f172a');
      assert.equal(darkSpec.headingColor, '#ffffff');
      assert.equal(lightSpec.textShadow, IMAGE_CARD_TEXT_SHADOW);
      assert.equal(darkSpec.textShadow, '0 2px 4px rgba(0, 0, 0, 0.4)');
    }
  });

  it('enforces ~30-40% overlay opacity in Light Mode and ~75-80% overlay opacity in Dark Mode while passing WCAG AA/AAA contrast', () => {
    for (const key of ALL_CARD_KEYS) {
      const lightAudit = evaluateCardOverlayContrast(key, 'light');
      const darkAudit = evaluateCardOverlayContrast(key, 'dark');

      assert.ok(
        lightAudit.minAlpha >= 0.3 && lightAudit.maxAlpha <= 0.42,
        `Light mode overlay for ${key} should be ~30-40% opacity (got ${lightAudit.minAlpha}..${lightAudit.maxAlpha})`
      );
      assert.ok(
        lightAudit.passesWcagAA && lightAudit.contrastOnBrightSpot >= 7.0,
        `Light mode overlay for ${key} failed WCAG contrast: ${lightAudit.contrastOnBrightSpot}:1`
      );

      assert.ok(
        darkAudit.minAlpha >= 0.75 && darkAudit.maxAlpha <= 0.82,
        `Dark mode overlay for ${key} should be ~75-80% opacity (got ${darkAudit.minAlpha}..${darkAudit.maxAlpha})`
      );
      assert.ok(
        darkAudit.passesWcagAA && darkAudit.contrastOnBrightSpot >= 7.0,
        `Dark mode overlay for ${key} should have deep >= 7.0:1 contrast: ${darkAudit.contrastOnBrightSpot}:1`
      );
    }
  });

  it('falls back gracefully for unknown keys while preserving boolean/mode signature', () => {
    const fallbackLight = getCardBackgroundSpec('unknown_category', false);
    const fallbackDark = getCardBackgroundSpec('unknown_category', true);
    assert.equal(fallbackLight.key, 'services');
    assert.equal(fallbackLight.colorMode, 'light');
    assert.equal(fallbackDark.colorMode, 'dark');
    assert.ok(fallbackDark.backgroundImageCss.includes('/images/cards/store.svg'));
  });
});

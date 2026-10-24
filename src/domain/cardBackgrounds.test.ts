import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getCardBackgroundSpec } from './cardBackgrounds';

describe('Image Background Cards & Teal/Dark Linear-Gradient Overlay Specs', () => {
  it('returns valid image path and Teal/Dark linear-gradient overlay for main feature cards', () => {
    const keys = [
      'medical',
      'services',
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
    ];
    for (const key of keys) {
      const spec = getCardBackgroundSpec(key);
      assert.equal(spec.key, key);
      assert.ok(spec.imagePath.startsWith('/images/cards/'), `Expected local card image for ${key}`);
      assert.ok(
        spec.overlayGradient.includes('linear-gradient'),
        `Expected linear-gradient overlay for ${key}`
      );
      assert.ok(
        spec.backgroundImageCss.includes(spec.imagePath) &&
          spec.backgroundImageCss.includes('linear-gradient'),
        `Expected combined background-image CSS for ${key}`
      );
    }
  });

  it('returns valid image background specs for store categories and falls back gracefully for unknown keys', () => {
    const toysSpec = getCardBackgroundSpec('toys');
    assert.equal(toysSpec.imagePath, '/images/cards/store.svg');

    const fallbackSpec = getCardBackgroundSpec('unknown_category');
    assert.equal(fallbackSpec.key, 'services');
    assert.ok(fallbackSpec.backgroundImageCss.includes('/images/cards/store.svg'));
  });
});

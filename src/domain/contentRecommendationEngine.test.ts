import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { calculateAgeInMonths, extractProfileSignals, getSafeFavoriteFood, rankDynamicContent, type DynamicContentCatalogItem } from './contentRecommendationEngine';

describe('dynamic profile signals', () => {
  it('calculates completed age months and rejects invalid dates', () => {
    assert.equal(calculateAgeInMonths('2020-01-15', new Date('2020-03-14T12:00:00')), 1);
    assert.equal(calculateAgeInMonths('2020-01-15', new Date('2020-03-15T12:00:00')), 2);
    assert.equal(calculateAgeInMonths('not-a-date'), null);
  });

  it('extracts interests, hobbies, sports and recent context from one child only', () => {
    const signals = extractProfileSignals({
      child: {
        birth: '2018-01-01',
        interests: 'space, football',
        profileDetails: { hobbies: ['painting'], sports: ['football'], favoriteFoods: ['banana'] },
      },
      language: 'en',
      recentRecords: [{ record_type: 'sports', title: 'Football practice' }],
      now: new Date('2026-01-01T12:00:00'),
    });
    assert.ok(signals.interests.includes('space'));
    assert.deepEqual(signals.hobbies, ['painting']);
    assert.deepEqual(signals.sports, ['football']);
    assert.deepEqual(signals.recentTopics, ['sports']);
  });

  it('does not surface favorite foods when restrictions or dislikes are recorded', () => {
    assert.equal(getSafeFavoriteFood({ favoriteFoods: ['banana'] }), 'banana');
    assert.equal(getSafeFavoriteFood({ favoriteFoods: ['banana'], foodRestrictions: ['strawberry'] }), null);
    assert.equal(getSafeFavoriteFood({ favoriteFoods: ['banana'], dislikedFoods: ['banana'] }), null);
  });
});


describe('dynamic content ranking', () => {
  const item = (overrides: Partial<DynamicContentCatalogItem> = {}): DynamicContentCatalogItem => ({
    id: 'content-1',
    content_key: 'football-basics',
    title_ar: 'نشاط كرة القدم',
    title_en: 'Football activity',
    summary_ar: 'نشاط مناسب',
    summary_en: 'An age-fit activity',
    body_ar: '',
    body_en: '',
    content_type: 'activity',
    topic: 'sports',
    audience: 'child',
    language: 'both',
    age_min_months: 60,
    age_max_months: 120,
    tags: [],
    interest_tags: [],
    hobby_tags: [],
    sport_tags: ['football'],
    safety_level: 'general',
    review_status: 'approved',
    is_published: true,
    is_featured: false,
    sort_weight: 0,
    media_asset_id: null,
    source_name: null,
    source_url: null,
    cta_label_ar: '',
    cta_label_en: '',
    cta_target: null,
    published_at: '2026-01-01T00:00:00.000Z',
    expires_at: null,
    ...overrides,
  });

  const profile = {
    child: {
      birth: '2020-01-01',
      interests: 'space',
      profileDetails: { sports: ['football'] },
    },
    language: 'en' as const,
    now: new Date('2026-11-03T12:00:00.000Z'),
  };

  it('ranks a child’s saved sport above unrelated content', () => {
    const unrelated = item({ id: 'content-2', content_key: 'painting', sport_tags: [], interest_tags: ['painting'] });
    const matched = item({ id: 'content-3', content_key: 'football', sport_tags: ['football'] });
    const ranked = rankDynamicContent([unrelated, matched], profile);
    assert.equal(ranked[0]?.item.id, 'content-3');
  });

  it('hard-filters medical, unreviewed, wrong-age and wrong-language content', () => {
    const unsafe = item({ id: 'medical', safety_level: 'medical' });
    const unreviewed = item({ id: 'draft', review_status: 'pending_review' });
    const tooYoung = item({ id: 'age', age_min_months: 90 });
    const wrongLanguage = item({ id: 'language', language: 'ar' });
    const ranked = rankDynamicContent([unsafe, unreviewed, tooYoung, wrongLanguage], profile);
    assert.deepEqual(ranked, []);
  });

  it('does not repeat content explicitly excluded by the caller', () => {
    const ranked = rankDynamicContent([item()], profile, { excludeIds: ['content-1'] });
    assert.deepEqual(ranked, []);
  });

  it('does not infer an age-specific recommendation when birth date is missing', () => {
    const unknownAgeProfile = {
      ...profile,
      child: { birth: '', interests: '', profileDetails: {} },
    };
    assert.deepEqual(rankDynamicContent([item()], unknownAgeProfile), []);
  });

  it('filters food content when dietary restrictions or dislikes are recorded', () => {
    const restrictedProfile = {
      ...profile,
      child: {
        ...profile.child,
        profileDetails: { foodRestrictions: ['peanuts'] },
      },
    };
    const nutritionItem = item({ id: 'nutrition', topic: 'nutrition', sport_tags: [] });
    assert.deepEqual(rankDynamicContent([nutritionItem], restrictedProfile), []);
  });
});

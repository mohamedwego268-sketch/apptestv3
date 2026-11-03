import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { calculateAgeInMonths, extractProfileSignals, getSafeFavoriteFood } from './contentRecommendationEngine';

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

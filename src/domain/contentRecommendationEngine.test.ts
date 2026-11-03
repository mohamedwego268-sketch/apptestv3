import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildDailyWelcomePersonalization,
  calculateAgeInMonths,
  extractProfileSignals,
  getSafeFavoriteFood,
} from './contentRecommendationEngine';

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

  it('personalizes daily welcome and compass by child name, age, interests and time of day without inventing data', () => {
    const morningPreschool = buildDailyWelcomePersonalization({
      child: {
        name: 'ليلى',
        birth: '2022-05-01',
        interests: 'الألوان المائية, القصص المصورة',
        profileDetails: { hobbies: ['الرسم'] },
      },
      parentDisplayNameAr: 'مريم',
      parentDisplayNameEn: 'Maryam',
      timeBucket: 'morning',
      now: new Date('2026-11-03T09:00:00'),
    });

    assert.equal(morningPreschool.ageStage, '2-5');
    assert.ok(morningPreschool.greetingAr.includes('صباح الخير يا مريم'));
    assert.ok(morningPreschool.greetingAr.includes('ليلى'));
    assert.ok(morningPreschool.greetingEn.includes('Good morning, Maryam'));
    assert.ok(morningPreschool.greetingEn.includes('Layla'));
    assert.ok(morningPreschool.summaryAr.includes('الألوان المائية'));
    assert.ok(morningPreschool.summaryEn.includes('Watercolors'));
    assert.ok(morningPreschool.compass.actionTaskAr.includes('الألوان المائية'));

    const eveningSchoolAge = buildDailyWelcomePersonalization({
      child: {
        name: 'يوسف',
        birth: '2019-03-10',
        interests: '',
        profileDetails: { sports: ['السباحة'] },
      },
      parentDisplayNameAr: 'أحمد',
      parentDisplayNameEn: 'Ahmad',
      timeBucket: 'evening',
      now: new Date('2026-11-03T20:00:00'),
    });

    assert.equal(eveningSchoolAge.ageStage, '5-8');
    assert.ok(eveningSchoolAge.greetingAr.includes('مساء الهدوء يا أحمد'));
    assert.ok(eveningSchoolAge.greetingAr.includes('يوسف'));
    assert.ok(eveningSchoolAge.summaryAr.includes('السباحة'));
    assert.ok(eveningSchoolAge.summaryEn.includes('Swimming'));

    const noChildAfternoon = buildDailyWelcomePersonalization({
      child: null,
      parentDisplayNameAr: 'مريم',
      parentDisplayNameEn: 'Maryam',
      timeBucket: 'afternoon',
    });

    assert.equal(noChildAfternoon.ageStage, 'unknown');
    assert.deepEqual(noChildAfternoon.topInterestsAr, []);
    assert.ok(noChildAfternoon.greetingAr.includes('طاب يومك يا مريم'));
    assert.ok(noChildAfternoon.greetingEn.includes('Good afternoon, Maryam'));
  });
});


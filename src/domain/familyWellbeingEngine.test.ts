import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildChildStageEmotionalGuidance,
  buildFamilyBondingRituals,
  buildParentEmotionalSupportCards,
  buildPositiveParentingAdviceList,
  buildScenarioPersonalizedAddOn,
} from './familyWellbeingEngine';

describe('Family Wellbeing & Parenting Support Engine', () => {
  it('generates distinct emotional support cards for mothers and fathers using real names', () => {
    const momCards = buildParentEmotionalSupportCards({
      role: 'mother',
      motherName: 'مريم',
      fatherName: 'أحمد',
      kidsCount: 2,
      selectedChildNameAr: 'ليلى',
      selectedChildNameEn: 'Layla',
    });
    const dadCards = buildParentEmotionalSupportCards({
      role: 'father',
      motherName: 'مريم',
      fatherName: 'أحمد',
      kidsCount: 2,
      selectedChildNameAr: 'ليلى',
      selectedChildNameEn: 'Layla',
    });

    assert.equal(momCards.length, 3);
    assert.equal(dadCards.length, 3);
    assert.equal(new Set(momCards.map((c) => c.titleAr)).size, 3);
    assert.equal(new Set(dadCards.map((c) => c.titleAr)).size, 3);
    assert.ok(momCards[0].titleAr.includes('مريم'));
    assert.ok(dadCards[0].titleAr.includes('أحمد'));
    assert.ok(momCards[0].bodyAr.includes('ليلى'));
  });

  it('adapts child emotional wellbeing guidance across 0-2, 2-5, 5-8 and unknown stages', () => {
    const infantGuidance = buildChildStageEmotionalGuidance({
      child: {
        id: 1,
        name: 'حمزة',
        gender: 'boy',
        birth: '2026-04-01',
        interests: 'تمارين البطن',
        emoji: '👶',
      },
      selectedMoodId: 'tired',
    });
    assert.equal(infantGuidance.stageCode, '0-2');
    assert.ok(infantGuidance.coreNeedAr.includes('حمزة'));
    assert.ok(infantGuidance.communicationTipAr.includes('تمارين البطن'));

    const schoolGuidance = buildChildStageEmotionalGuidance({
      child: {
        id: 3,
        name: 'يوسف',
        gender: 'boy',
        birth: '2019-01-15',
        interests: 'السباحة',
        emoji: '👦',
      },
      selectedMoodId: 'worried',
    });
    assert.equal(schoolGuidance.stageCode, '5-8');
    assert.ok(schoolGuidance.coreNeedAr.includes('يوسف'));
    assert.ok(schoolGuidance.moodFollowUpAr.includes('السباحة'));
  });

  it('produces non-repetitive positive parenting advice, scenario personalization and family bonding rituals', () => {
    const child = {
      id: 2,
      name: 'ليلى',
      gender: 'girl' as const,
      birth: '2022-05-10',
      interests: 'الألوان المائية',
      emoji: '👧',
    };

    const adviceList = buildPositiveParentingAdviceList({ child });
    assert.equal(adviceList.length, 4);
    assert.equal(new Set(adviceList.map((a) => a.headlineAr)).size, 4);
    assert.ok(adviceList[0].adviceAr.includes('الألوان المائية'));

    const screenScenario = buildScenarioPersonalizedAddOn({
      scenarioId: 'screen-change',
      child,
      kidsCount: 2,
    });
    assert.ok(screenScenario.personalizedPhraseAr.includes('ليلى'));
    assert.ok(screenScenario.personalizedPhraseAr.includes('الألوان المائية'));

    const bondingRituals = buildFamilyBondingRituals({ child, kidsCount: 2 });
    assert.equal(bondingRituals.length, 3);
    assert.equal(new Set(bondingRituals.map((r) => r.titleAr)).size, 3);
    assert.ok(bondingRituals[1].titleAr.includes('الألوان المائية'));
  });
});

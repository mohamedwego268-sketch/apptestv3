import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeAppData,
  calculateChildAge,
  getSuggestedCurrencyForCountry,
  formatCurrency,
  formatGregorianAndHijri,
  getChildDeletionSummary,
  deleteChildCascade,
  getNearestUpcomingEvent,
  validateChildInput,
  validateWishInput,
  validateImportedJson,
  parseTaskTimeMinutes,
  getRoutineTaskReminder,
  getRoutineRemindersSummary,
  validatePhoneForCountry,
  generateThreeDailyNotifications,
  DEFAULT_SEED,
} from './familySpaceCore';

test('normalizeAppData preserves legacy localStorage structure and detaches orphaned child IDs', () => {
  const legacyRaw = {
    role: 'dad',
    parentName: '  بابا أحمد  ',
    kids: [{ id: 10, name: 'عمر', gender: 'boy', birth: '2022-05-01' }],
    tasks: [
      { id: 1, name: 'قراءة', kidId: 10, done: true },
      { id: 2, name: 'مهمة يتيمة', kidId: 999, done: false },
    ],
    events: [
      { id: 100, title: 'تطعيم', date: '2026-11-01', childId: 10 },
      { id: 101, title: 'موعد قديم لطفل محذوف', date: '2026-11-02', childId: 999 },
    ],
    wishes: [
      { id: 200, name: 'دراجة', kid: 10, price: 500 },
      { id: 201, name: 'لعبة يتيمة', kid: 888, price: 150 },
    ],
  };

  const normalized = normalizeAppData(legacyRaw);
  assert.equal(normalized.role, 'dad');
  assert.equal(normalized.parentName, 'بابا أحمد');
  assert.equal(normalized.country, 'EG');
  assert.equal(normalized.currency, 'EGP');
  assert.equal(normalized.tasks[0].kidId, 10);
  assert.equal(normalized.tasks[1].kidId, null);
  assert.equal(normalized.events[0].childId, 10);
  assert.equal(normalized.events[1].childId, null);
  assert.equal(normalized.wishes[0].kid, 10);
  assert.equal(normalized.wishes[1].kid, 0);
  assert.ok(normalized.parentAccounts.mother);
  assert.ok(normalized.parentAccounts.father);
  assert.ok(Array.isArray(normalized.invitations));
  assert.ok(Array.isArray(normalized.readNotificationIds));
  assert.ok(Array.isArray(normalized.cart));
});

test('calculateChildAge classifies stages from day 1 to 8 years accurately', () => {
  const ref = new Date('2026-10-22T12:00:00Z');
  const infant = calculateChildAge('2025-10-22', 'ar', ref);
  assert.equal(infant.stageCode, '0-2');
  assert.equal(infant.months, 12);

  const preschool = calculateChildAge('2023-05-10', 'ar', ref);
  assert.equal(preschool.stageCode, '2-5');
  assert.equal(preschool.years, 3);

  const schoolAge = calculateChildAge('2020-02-01', 'en', ref);
  assert.equal(schoolAge.stageCode, '5-8');
  assert.equal(schoolAge.years, 6);
  assert.equal(schoolAge.label, '6 yrs');
});

test('country & currency helpers suggest SAR for SA and EGP for EG without fake FX', () => {
  assert.equal(getSuggestedCurrencyForCountry('EG'), 'EGP');
  assert.equal(getSuggestedCurrencyForCountry('SA'), 'SAR');

  const egpAr = formatCurrency(450, 'EGP', 'ar');
  assert.ok(egpAr.includes('ج.م'));

  const sarEn = formatCurrency(180, 'SAR', 'en');
  assert.equal(sarEn, '180 SAR');
});

test('formatGregorianAndHijri produces both Gregorian and Hijri date strings', () => {
  const res = formatGregorianAndHijri('2026-10-25', 'EG', 'ar', 'both');
  assert.ok(res.gregorian.length > 0);
  assert.ok(res.hijri.length > 0);
  assert.ok(res.combined.includes('·'));
});

test('deleteChildCascade counts and removes linked tasks, events, and wishes cleanly', () => {
  const summary = getChildDeletionSummary(DEFAULT_SEED, 1);
  assert.ok(summary.total >= 3);

  const afterDelete = deleteChildCascade(DEFAULT_SEED, 1);
  assert.equal(afterDelete.kids.some((k) => k.id === 1), false);
  assert.equal(afterDelete.tasks.some((t) => t.kidId === 1), false);
  assert.equal(afterDelete.events.some((e) => e.childId === 1), false);
  assert.equal(afterDelete.wishes.some((w) => w.kid === 1), false);
});

test('validation rejects blank names, future birth dates, negative prices, and invalid JSON imports', () => {
  assert.equal(validateChildInput({ name: '   ' }).valid, false);
  assert.equal(validateChildInput({ name: 'نور', birth: '2099-01-01' }, '2026-10-22').valid, false);
  assert.equal(validateChildInput({ name: 'نور', birth: '2023-01-01' }, '2026-10-22').valid, true);

  assert.equal(validateWishInput({ name: 'لعبة', price: -10, kid: 1 }, DEFAULT_SEED.kids).valid, false);
  assert.equal(validateWishInput({ name: 'لعبة', price: 100, kid: 999 }, DEFAULT_SEED.kids).valid, false);
  assert.equal(validateWishInput({ name: 'لعبة', price: 100, kid: 1, progress: 50 }, DEFAULT_SEED.kids).valid, true);

  assert.equal(validateImportedJson('{invalid json').valid, false);
  assert.equal(validateImportedJson('{"unrelated": true}').valid, false);
  const validExport = JSON.stringify(DEFAULT_SEED);
  const imported = validateImportedJson(validExport);
  assert.equal(imported.valid, true);
  assert.equal(imported.data?.kids.length, 2);
});

test('getNearestUpcomingEvent picks the earliest event on or after today', () => {
  const nearest = getNearestUpcomingEvent(DEFAULT_SEED.events, '2026-10-22');
  assert.ok(nearest);
  assert.equal(nearest?.id, 901);
});

test('parseTaskTimeMinutes and getRoutineTaskReminder classify overdue, approaching, scheduled, and completed tasks accurately', () => {
  assert.equal(parseTaskTimeMinutes('07:30 ص'), 7 * 60 + 30);
  assert.equal(parseTaskTimeMinutes('04:00 م'), 16 * 60);
  assert.equal(parseTaskTimeMinutes('07:00 م'), 19 * 60);
  assert.equal(parseTaskTimeMinutes('12:00 ص'), 0);
  assert.equal(parseTaskTimeMinutes('12:30 م'), 12 * 60 + 30);
  assert.equal(parseTaskTimeMinutes('18:45'), 18 * 60 + 45);
  assert.equal(parseTaskTimeMinutes('٠٧:٠٠ م'), 19 * 60);
  assert.equal(parseTaskTimeMinutes('بدون وقت'), null);

  // Reference time: 18:20 (6:20 PM = 1100 minutes)
  const nowMinutes = 18 * 60 + 20;

  // 1. Overdue open task (04:00 PM = 960 minutes)
  const overdueRes = getRoutineTaskReminder({ time: '04:00 م', done: false }, nowMinutes, 90, 'ar');
  assert.equal(overdueRes.status, 'overdue');
  assert.equal(overdueRes.isAlert, true);
  assert.ok(overdueRes.badgeLabel.includes('تجاوز الموعد'));

  // 2. Approaching open task (07:00 PM = 1140 minutes, 40m away <= 90m window)
  const approachingRes = getRoutineTaskReminder({ time: '07:00 م', done: false }, nowMinutes, 90, 'ar');
  assert.equal(approachingRes.status, 'approaching');
  assert.equal(approachingRes.isAlert, true);
  assert.ok(approachingRes.badgeLabel.includes('اقترب الموعد'));

  // 3. Scheduled later open task (09:00 PM = 1260 minutes, 160m away > 90m window)
  const scheduledRes = getRoutineTaskReminder({ time: '09:00 م', done: false }, nowMinutes, 90, 'ar');
  assert.equal(scheduledRes.status, 'scheduled');
  assert.equal(scheduledRes.isAlert, false);

  // 4. Completed task even if time is in the past
  const completedRes = getRoutineTaskReminder({ time: '07:00 ص', done: true }, nowMinutes, 90, 'ar');
  assert.equal(completedRes.status, 'completed');
  assert.equal(completedRes.isAlert, false);

  // 5. Summary aggregation across DEFAULT_SEED tasks at 18:20
  const summary = getRoutineRemindersSummary(DEFAULT_SEED.tasks, nowMinutes, 90, 'ar');
  assert.ok(summary.overdueCount >= 1);
  assert.ok(summary.approachingCount >= 1);
  assert.equal(summary.totalAlerts, summary.overdueCount + summary.approachingCount);
});

test('validatePhoneForCountry validates Egyptian (+20) and Saudi (+966) phone numbers', () => {
  const egValid = validatePhoneForCountry('01012345678', 'EG');
  assert.equal(egValid.valid, true);
  assert.equal(egValid.fullInternational, '+20 1012345678');

  const egInvalid = validatePhoneForCountry('01912345', 'EG');
  assert.equal(egInvalid.valid, false);

  const saValid = validatePhoneForCountry('0551234567', 'SA');
  assert.equal(saValid.valid, true);
  assert.equal(saValid.fullInternational, '+966 551234567');

  const saInvalid = validatePhoneForCountry('041234', 'SA');
  assert.equal(saInvalid.valid, false);
});

test('generateThreeDailyNotifications generates morning, midday, evening, and security notifications per parent', () => {
  const momNotifs = generateThreeDailyNotifications(DEFAULT_SEED, 'mother');
  assert.equal(momNotifs.length, 4);
  assert.ok(momNotifs.some((n) => n.slot === 'morning'));
  assert.ok(momNotifs.some((n) => n.slot === 'midday'));
  assert.ok(momNotifs.some((n) => n.slot === 'evening'));
  assert.ok(momNotifs.some((n) => n.slot === 'security'));

  const dadNotifs = generateThreeDailyNotifications(DEFAULT_SEED, 'father');
  assert.equal(dadNotifs.length, 4);
  assert.ok(dadNotifs.every((n) => n.parentTarget === 'father' || n.parentTarget === 'both'));
});

test('normalizeAppData normalizes city based on country and provides dependent city lists', async () => {
  const { COUNTRY_CITIES_MAP } = await import('./familySpaceCore');
  assert.ok(COUNTRY_CITIES_MAP.EG.length >= 6);
  assert.ok(COUNTRY_CITIES_MAP.SA.length >= 6);

  const normalizedEG = normalizeAppData({ country: 'EG' });
  assert.equal(normalizedEG.city, 'القاهرة');

  const normalizedSA = normalizeAppData({ country: 'SA' });
  assert.equal(normalizedSA.city, 'الرياض');

  const customCity = normalizeAppData({ country: 'EG', city: 'الإسكندرية' });
  assert.equal(customCity.city, 'الإسكندرية');
});



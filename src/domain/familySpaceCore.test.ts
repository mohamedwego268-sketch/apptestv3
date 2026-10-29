import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import {
  DEFAULT_SEED,
  STORAGE_KEY,
  normalizeAppData,
  validateChildInput,
} from './familySpaceCore';
import {
  loadPersistedFamilyState,
  savePersistedFamilyState,
} from '../services/familyStorageService';
import {
  OnboardingFlowController,
  UserSessionProfile,
} from '../services/OnboardingFlowController';
import {
  SHARED_FAMILY_ID,
  authenticateParentWithSupabase,
  ensureSharedFamilyRecordInSupabase,
  fetchChildrenFromSupabase,
  fetchFamilySpaceFromSupabase,
  fetchUsersFromSupabase,
  isCanonicalThreeDemoKids,
  isDefaultDemoSeedState,
  isValidUuid,
  normalizeOnboardingAuthPayload,
  normalizeOnboardingRoleToAccount,
  normalizeOnboardingRoleToTheme,
  resolveVerifiedFamilyContext,
  saveOnboardingChildrenToSupabase,
  saveOnboardingLocationToSupabase,
  syncFamilySpaceToSupabase,
} from '../services/supabaseService';

class MemoryStorage implements Storage {
  private store = new Map<string, string>();

  get length(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null;
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }
}

const memoryStorage = new MemoryStorage();
Object.defineProperty(globalThis, 'window', {
  value: {
    localStorage: memoryStorage,
    location: { origin: 'http://localhost:3000' },
  },
  configurable: true,
  writable: true,
});
Object.defineProperty(globalThis, 'localStorage', {
  value: memoryStorage,
  configurable: true,
  writable: true,
});

describe('Phase 1 Stabilization — Onboarding Payloads & Non-Destructive Local Storage', () => {
  beforeEach(() => {
    memoryStorage.clear();
  });

  it('1. maps fullName to parentName, normalizes roles consistently, and preserves location/currency fields', () => {
    assert.equal(normalizeOnboardingRoleToAccount('dad'), 'father');
    assert.equal(normalizeOnboardingRoleToAccount('father'), 'father');
    assert.equal(normalizeOnboardingRoleToAccount('أب'), 'father');
    assert.equal(normalizeOnboardingRoleToAccount('mom'), 'mother');
    assert.equal(normalizeOnboardingRoleToAccount('mother'), 'mother');
    assert.equal(normalizeOnboardingRoleToAccount('أم'), 'mother');

    assert.equal(normalizeOnboardingRoleToTheme('father'), 'dad');
    assert.equal(normalizeOnboardingRoleToTheme('mother'), 'mom');

    const mapped = normalizeOnboardingAuthPayload({
      mode: 'signup',
      fullName: '  طارق المنصور  ',
      email: ' tarek@example.com ',
      phone: ' 1012345678 ',
      role: 'dad',
      country: 'EG',
      city: 'الإسكندرية',
      familyId: 7,
      familyName: 'أسرة طارق',
    });

    assert.equal(mapped.parentName, 'طارق المنصور');
    assert.equal(mapped.role, 'father');
    assert.equal(mapped.themeRole, 'dad');
    assert.equal(mapped.country, 'EG');
    assert.equal(mapped.city, 'الإسكندرية');
    assert.equal(mapped.currency, 'EGP');
    assert.equal(mapped.familyId, 7);
    assert.equal(mapped.familyName, 'أسرة طارق');
    assert.equal(mapped.email, 'tarek@example.com');
    assert.equal(mapped.phone, '1012345678');
  });

  it('2. validates and deduplicates child-list persistence arguments ({ familyId, childrenList }) on retries', async () => {
    const res = await saveOnboardingChildrenToSupabase({
      familyId: 12,
      childrenList: [
        {
          id: 1,
          name: 'سلمى',
          birth: '2021-04-10',
          gender: 'girl',
          interests: 'الرسم والموسيقى',
          avatarTheme: 'artist',
        },
        // Duplicate retry entry with same name + birth
        {
          id: 99,
          name: '  سلمى ',
          birth: '2021-04-10',
          gender: 'girl',
          interests: 'الرسم والموسيقى',
          avatarTheme: 'artist',
        },
        {
          id: 2,
          name: 'عمر',
          birth: '2019-08-22',
          gender: 'boy',
          interests: 'السباحة',
          avatarTheme: 'astronaut',
        },
      ],
    });

    assert.equal(res.savedChildren.length, 2);
    assert.equal(res.savedChildren[0].family_id, 12);
    assert.equal(res.savedChildren[0].name, 'سلمى');
    assert.equal(res.savedChildren[0].gender, 'girl');
    assert.equal(res.savedChildren[1].name, 'عمر');
    assert.equal(res.savedChildren[1].gender, 'boy');
    assert.equal(res.synced, false);

    // Passing a malformed payload (e.g. legacy array instead of { familyId, childrenList }) fails explicitly without throwing TypeError
    const malformedRes = await saveOnboardingChildrenToSupabase(
      [] as unknown as Parameters<typeof saveOnboardingChildrenToSupabase>[0]
    );
    assert.equal(malformedRes.synced, false);
    assert.ok(malformedRes.error);
  });

  it('3. explicitly reports Supabase write failures instead of silently returning success: true', async () => {
    // Missing parentName on signup must fail explicitly
    const missingNameRes = await authenticateParentWithSupabase({
      mode: 'signup',
      fullName: '   ',
      email: 'parent@example.com',
      phone: '1012345678',
      role: 'mom',
      country: 'EG',
    });
    assert.equal(missingNameRes.success, false);
    assert.equal(missingNameRes.syncedToDb, false);
    assert.ok(missingNameRes.error);

    // Location payload preserves familyName, country, city, currency, and activeParent
    const locRes = await saveOnboardingLocationToSupabase({
      familyId: SHARED_FAMILY_ID,
      familyName: 'أسرة ندى — نكبر',
      country: 'SA',
      city: 'جدة',
      currency: 'SAR',
      activeParent: 'mom',
    });
    assert.equal(locRes.family.family_name, 'أسرة ندى — نكبر');
    assert.equal(locRes.family.country, 'SA');
    assert.equal(locRes.family.city, 'جدة');
    assert.equal(locRes.family.currency, 'SAR');
    assert.equal(locRes.family.active_parent, 'mother');
    assert.equal(locRes.synced, false);
    assert.ok(locRes.error);
  });

  it('4. preserves custom child profiles across page reloads without overwriting with canonical demo children', () => {
    const customState = normalizeAppData({
      ...DEFAULT_SEED,
      parentName: 'سارة محمود',
      role: 'mom',
      country: 'EG',
      city: 'الإسكندرية',
      currency: 'EGP',
      kids: [
        {
          id: 1,
          name: 'زين',
          gender: 'boy',
          birth: '2021-06-15',
          interests: 'تركيب المكعبات',
          avatarTheme: 'scientist',
        },
      ],
      tasks: [
        {
          id: 701,
          name: 'قراءة قصة المساء مع زين',
          time: '08:00 م',
          done: true,
          kidId: 1,
          category: 'روتين المساء',
          owner: 'الأم',
          cadence: 'daily',
        },
      ],
      wishes: [
        {
          id: 801,
          name: 'تلسكوب أطفال',
          kid: 1,
          price: 950,
          currency: 'EGP',
          emoji: '🔭',
          reserved: false,
          progress: 60,
          goalType: 'أمنية طفل',
        },
      ],
    });

    savePersistedFamilyState(customState);

    const reloaded = loadPersistedFamilyState();
    assert.equal(reloaded.parentName, 'سارة محمود');
    assert.equal(reloaded.city, 'الإسكندرية');
    assert.equal(reloaded.kids.length, 1);
    assert.equal(reloaded.kids[0].name, 'زين');
    assert.equal(reloaded.kids[0].voiceMoments?.length ?? 0, 0);
    assert.equal(isCanonicalThreeDemoKids(reloaded.kids), false);
    assert.equal(reloaded.tasks.length, 1);
    assert.equal(reloaded.tasks[0].name, 'قراءة قصة المساء مع زين');
    assert.equal(reloaded.wishes.length, 1);
    assert.equal(reloaded.wishes[0].name, 'تلسكوب أطفال');
  });

  it('5. initializes empty state with default seed only when no saved user state exists and never merges demo kids into custom families', async () => {
    // Empty localStorage -> returns DEFAULT_SEED without overwriting existing keys
    const initial = loadPersistedFamilyState();
    assert.equal(initial.kids.length, 3);
    assert.equal(isCanonicalThreeDemoKids(initial.kids), true);

    // Custom 2-child family must not have the 3rd demo child merged into it during Supabase hydration
    const twoKidsState = normalizeAppData({
      ...DEFAULT_SEED,
      parentName: 'كريم عادل',
      role: 'dad',
      kids: [
        {
          id: 10,
          name: 'تيا',
          gender: 'girl',
          birth: '2023-02-01',
          interests: 'الموسيقى',
          avatarTheme: 'artist',
        },
        {
          id: 11,
          name: 'آدم',
          gender: 'boy',
          birth: '2020-11-11',
          interests: 'السباحة',
          avatarTheme: 'athlete',
        },
      ],
    });

    const hydrationRes = await fetchFamilySpaceFromSupabase(twoKidsState);
    assert.equal(hydrationRes.nextState.kids.length, 2);
    assert.deepEqual(
      hydrationRes.nextState.kids.map((k) => k.name),
      ['تيا', 'آدم']
    );
  });

  it('6. preserves existing session persistence via OnboardingFlowController.saveAuthenticatedSession without treating localStorage as DB ownership', async () => {
    const session: UserSessionProfile = {
      userId: 'usr_1_dad',
      familyId: '550e8400-e29b-41d4-a716-446655440000',
      fullName: 'أحمد المنصور',
      parentName: 'أحمد المنصور',
      role: 'dad',
      parentRole: 'dad',
      email: 'ahmad@nekbaar.app',
      phone: '+201012345678',
      city: 'القاهرة',
      country: 'EG',
      childrenCount: 2,
      isCoParentLinked: true,
      syncedToDb: true,
    };

    OnboardingFlowController.saveDraft('CHILDREN', {
      parentName: 'أحمد المنصور',
      childrenList: [
        {
          id: 1,
          name: 'فريدة',
          gender: 'girl',
          ageStagePreset: 'custom',
          birth: '2022-03-15',
          interests: 'الرسم',
          avatarTheme: 'artist',
        },
      ],
    });

    OnboardingFlowController.saveAuthenticatedSession(session, true);

    const restored = OnboardingFlowController.getSavedProfile();
    assert.ok(restored);
    assert.equal(restored?.fullName, 'أحمد المنصور');
    assert.equal(restored?.role, 'dad');
    assert.equal(restored?.childrenCount, 2);
    assert.equal(OnboardingFlowController.loadDraft(), null);

    const detected = await OnboardingFlowController.detectInitialState();
    assert.equal(detected.step, 'DASHBOARD');
    assert.equal(detected.profile?.fullName, 'أحمد المنصور');
    // Crucial Phase 1 check: localStorage session alone must NOT be treated as verified DB ownership
    assert.equal(detected.profile?.isDbVerified, false);
    assert.equal(detected.profile?.syncedToDb, false);
    assert.equal(detected.profile?.verifiedFamilyId, null);

    const childCheck = validateChildInput({ name: 'فريدة', birth: '2022-03-15' });
    assert.equal(childCheck.valid, true);
  });

  it('7. rejects SHARED_FAMILY_ID = 1 for UUID operations and separates local numeric child IDs from remote UUIDs while preserving task/calendar/wish linkage', async () => {
    assert.equal(isValidUuid(SHARED_FAMILY_ID), false);
    assert.equal(isValidUuid('1'), false);
    assert.equal(isValidUuid('550e8400-e29b-41d4-a716-446655440000'), true);

    // Ensure Supabase UUID queries/upserts never execute with SHARED_FAMILY_ID = 1
    const familyRes = await ensureSharedFamilyRecordInSupabase({ familyId: SHARED_FAMILY_ID });
    assert.equal(familyRes.synced, false);

    const usersRes = await fetchUsersFromSupabase(SHARED_FAMILY_ID);
    assert.equal(usersRes.error, null);
    assert.equal(Array.isArray(usersRes.data), true);

    const childrenRes = await fetchChildrenFromSupabase(SHARED_FAMILY_ID);
    assert.equal(childrenRes.error, null);
    assert.equal(Array.isArray(childrenRes.data), true);

    // Verify separation of local numeric UI IDs (1, 2) and remote DB UUIDs (remoteId / remoteChildId)
    const child1Uuid = '11111111-2222-4333-8444-555555555551';
    const child2Uuid = '11111111-2222-4333-8444-555555555552';
    const familyUuid = '99999999-8888-4777-8666-555555555555';

    const normalized = normalizeAppData({
      ...DEFAULT_SEED,
      verifiedFamilyId: familyUuid,
      kids: [
        {
          id: 1,
          remoteId: child1Uuid,
          name: 'نور',
          gender: 'girl',
          birth: '2021-01-10',
          interests: 'الرسم',
        },
        {
          id: 2,
          remoteId: child2Uuid,
          name: 'ياسين',
          gender: 'boy',
          birth: '2019-05-20',
          interests: 'كرة القدم',
        },
      ],
      tasks: [
        {
          id: 10,
          remoteId: 'task-uuid-1',
          name: 'ترتيب الألعاب',
          time: '05:00 م',
          done: false,
          kidId: 999, // mismatched numeric ID resolved via remoteChildId -> local id 2
          remoteChildId: child2Uuid,
          category: 'مسؤوليات',
          owner: 'مشترك',
          cadence: 'daily',
        },
      ],
      events: [
        {
          id: 20,
          remoteId: 'event-uuid-1',
          title: 'زيارة طبيب الأسنان',
          date: '2026-11-15',
          time: '04:00 م',
          type: 'طبيب',
          childId: 888, // resolved via remoteChildId -> local id 1
          remoteChildId: child1Uuid,
          repeat: 'none',
        },
      ],
      wishes: [
        {
          id: 30,
          remoteId: 'wish-uuid-1',
          name: 'دراجة هوائية',
          kid: 777, // resolved via remoteChildId -> local id 2
          remoteChildId: child2Uuid,
          price: 600,
          currency: 'SAR',
          emoji: '🚲',
          reserved: false,
          progress: 50,
          goalType: 'أمنية طفل',
        },
      ],
    });

    assert.equal(normalized.verifiedFamilyId, familyUuid);
    assert.equal(normalized.kids[0].id, 1);
    assert.equal(normalized.kids[0].remoteId, child1Uuid);
    assert.equal(normalized.kids[1].id, 2);
    assert.equal(normalized.kids[1].remoteId, child2Uuid);
    // Linkage preserved using local numeric IDs for UI while retaining remoteChildId
    assert.equal(normalized.tasks[0].kidId, 2);
    assert.equal(normalized.tasks[0].remoteChildId, child2Uuid);
    assert.equal(normalized.events[0].childId, 1);
    assert.equal(normalized.events[0].remoteChildId, child1Uuid);
    assert.equal(normalized.wishes[0].kid, 2);
    assert.equal(normalized.wishes[0].remoteChildId, child2Uuid);
  });

  it('8. blocks syncing Default Demo Seed or unauthenticated state to Supabase while keeping DEFAULT_SEED intact for UI', async () => {
    // DEFAULT_SEED remains intact for UI preview
    assert.equal(DEFAULT_SEED.kids.length, 3);
    assert.equal(isDefaultDemoSeedState(DEFAULT_SEED), true);

    // Unauthenticated context must not be verified even if localStorage has fake family_id
    window.localStorage.setItem(
      OnboardingFlowController.STORAGE_KEY,
      JSON.stringify({
        userId: '550e8400-e29b-41d4-a716-446655440000',
        familyId: '99999999-8888-4777-8666-555555555555',
        fullName: 'مستخدم محلي',
      })
    );

    const verifiedCtx = await resolveVerifiedFamilyContext();
    assert.equal(verifiedCtx.authenticated, false);
    assert.equal(verifiedCtx.verifiedFamilyId, null);

    // Syncing DEFAULT_SEED or unauthenticated custom state to Supabase must be blocked
    const demoSyncOk = await syncFamilySpaceToSupabase(DEFAULT_SEED);
    assert.equal(demoSyncOk, false);

    const customUnauthState = normalizeAppData({
      ...DEFAULT_SEED,
      parentName: 'وليد خالد',
      kids: [
        {
          id: 1,
          name: 'فارس',
          gender: 'boy',
          birth: '2020-03-10',
          interests: 'السباحة',
        },
      ],
    });
    assert.equal(isDefaultDemoSeedState(customUnauthState), false);
    const unauthSyncOk = await syncFamilySpaceToSupabase(customUnauthState);
    assert.equal(unauthSyncOk, false);
  });
});


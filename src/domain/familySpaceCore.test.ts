import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import {
  DEFAULT_SEED,
  STORAGE_KEY,
  normalizeAppData,
  validateChildInput,
  getSuggestedCurrencyForCountry,
  resolveCityRegionId,
} from './familySpaceCore';
import {
  createEmptyFamilySpaceState,
  getFamilySpaceStorageKey,
  loadFamilySpaceStateForFamily,
  loadPersistedFamilyState,
  saveFamilySpaceStateForFamily,
  savePersistedFamilyState,
} from '../services/familyStorageService';
import {
  OnboardingFlowController,
  UserSessionProfile,
  hasVerifiedFamilyAccess,
} from '../services/OnboardingFlowController';
import {
  SHARED_FAMILY_ID,
  acceptFamilyInvitation,
  authenticateParentWithSupabase,
  createFamilyPrivateMediaSignedUrl,
  deleteChildFromSupabase,
  deleteFamilyPrivateMediaFromStorage,
  ensureSharedFamilyRecordInSupabase,
  fetchChildrenFromSupabase,
  fetchFamilySpaceFromSupabase,
  fetchUsersFromSupabase,
  hashFamilyPairingToken,
  isCanonicalThreeDemoKids,
  isDefaultDemoSeedState,
  isValidUuid,
  linkCoParentAccountInSupabase,
  normalizeOnboardingAuthPayload,
  normalizeOnboardingRoleToAccount,
  normalizeOnboardingRoleToTheme,
  resolveVerifiedFamilyContext,
  restoreAuthenticatedAccountFromSupabase,
  saveOnboardingChildrenToSupabase,
  saveOnboardingLocationToSupabase,
  signInWithOAuthProviderInSupabase,
  signOutFromSupabase,
  syncFamilySpaceToSupabase,
  uploadFamilyPrivateMediaToStorage,
  validateFamilyStorageObjectPath,
  verifyAccountIdentityOtpInSupabase,
} from '../services/supabaseService';
import {
  VERIFIED_LIVE_AUTH_SETTINGS,
  VERIFIED_LIVE_TABLE_COLUMNS,
  evaluateAuthSessionResponse,
  evaluateOAuthProviderAvailability,
  mapChildProfileToContractRow,
  verifyDatabaseFamilyMembership,
} from './supabaseDatabaseContract';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '../supabase.js';
import type { SupabaseClient } from '@supabase/supabase-js';
import { UI_STRINGS } from './i18n';

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

describe('Bilingual interface copy', () => {
  it('keeps Arabic and English translation keys aligned with no empty labels', () => {
    assert.deepEqual(Object.keys(UI_STRINGS.ar).sort(), Object.keys(UI_STRINGS.en).sort());
    for (const key of Object.keys(UI_STRINGS.ar)) {
      assert.ok(UI_STRINGS.ar[key].trim(), `Arabic translation is empty: ${key}`);
      assert.ok(UI_STRINGS.en[key].trim(), `English translation is empty: ${key}`);
    }
  });
});

describe('Country, currency and city normalization', () => {
  it('resolves Arabic and English city names and sub-city aliases to the same canonical region', () => {
    assert.equal(resolveCityRegionId('SA', 'Khobar'), 'الدمام');
    assert.equal(resolveCityRegionId('SA', 'الظهران'), 'الدمام');
    assert.equal(resolveCityRegionId('SA', 'Riyadh'), 'الرياض');
    assert.equal(resolveCityRegionId('EG', 'New Cairo'), 'القاهرة');
    assert.equal(resolveCityRegionId('EG', '  New   Cairo  '), 'القاهرة');
    assert.equal(resolveCityRegionId('EG', 'الإسكندرية'), 'الإسكندرية');
  });

  it('falls back safely for an unknown city and keeps country currency defaults aligned', () => {
    assert.equal(resolveCityRegionId('SA', 'Unknown city'), 'الدمام');
    assert.equal(getSuggestedCurrencyForCountry('SA'), 'SAR');
    assert.equal(getSuggestedCurrencyForCountry('EG'), 'EGP');
  });
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
      familyId: '550e8400-e29b-41d4-a716-446655440000',
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
    assert.equal(res.savedChildren[0].family_id, '550e8400-e29b-41d4-a716-446655440000');
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
    assert.equal(detected.step, 'WELCOME_PROFILE');
    assert.equal(detected.profile, undefined);
    // A cached profile alone must never unlock the private family workspace.
    assert.equal(hasVerifiedFamilyAccess(restored), false);
    assert.equal(hasVerifiedFamilyAccess({ verifiedFamilyId: '550e8400-e29b-41d4-a716-446655440000' }), true);

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
    assert.match(usersRes.error || '', /No authenticated family UUID is available/);
    assert.deepEqual(usersRes.data, []);

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

  it('9. Phase 2 Contract: evaluates signup session vs pending email confirmation and rejects demo/non-UUID accounts', () => {
    const validAuthUuid = '550e8400-e29b-41d4-a716-446655440000';

    // Case 1: Signup created auth.users record, but email confirmation is pending (session === null)
    const pendingConfirm = evaluateAuthSessionResponse({
      user: { id: validAuthUuid, email: 'parent@nekbaar.app' },
      session: null,
      error: null,
    });
    assert.equal(pendingConfirm.status, 'PENDING_EMAIL_CONFIRMATION');
    assert.equal(pendingConfirm.authUserId, validAuthUuid);
    assert.equal(pendingConfirm.canProceedToFamilyBootstrap, false);
    assert.equal(pendingConfirm.requiresEmailVerificationPrompt, true);

    // Case 2: Active session with valid UUID and access_token
    const activeReady = evaluateAuthSessionResponse({
      user: { id: validAuthUuid, email: 'parent@nekbaar.app' },
      session: {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.valid',
        user: { id: validAuthUuid, email: 'parent@nekbaar.app' },
      },
      error: null,
    });
    assert.equal(activeReady.status, 'ACTIVE_SESSION_READY');
    assert.equal(activeReady.canProceedToFamilyBootstrap, true);
    assert.equal(activeReady.requiresEmailVerificationPrompt, false);

    // Case 3: Demo IDs ("parent-ahmad", "1") are strictly rejected
    const demoRejected = evaluateAuthSessionResponse({
      user: { id: 'parent-ahmad', email: 'ahmad.dad@nekbaar.app' },
      session: { access_token: 'demo-token', user: { id: 'parent-ahmad' } },
      error: null,
    });
    assert.equal(demoRejected.status, 'UNAUTHENTICATED_OR_INVALID');
    assert.equal(demoRejected.canProceedToFamilyBootstrap, false);
  });

  it('10. Phase 2 Contract: enforces auth_user_id + family_id database ownership and isolates legacy orphaned rows', () => {
    const authUid = '550e8400-e29b-41d4-a716-446655440000';
    const otherAuthUid = '660e8400-e29b-41d4-a716-446655440999';
    const profileId = '770e8400-e29b-41d4-a716-446655440111';
    const familyUuid = '99999999-8888-4777-8666-555555555555';

    // 1. Live pre-migration public.users row has no family_id -> must not trust localStorage or user_metadata
    const liveRowWithoutFamilyId = verifyDatabaseFamilyMembership({
      sessionAuthUid: authUid,
      dbUserRow: {
        id: profileId,
        auth_user_id: authUid,
        full_name: 'أحمد المنصور',
        role: 'father',
      },
      localStorageFamilyId: familyUuid,
      userMetadataFamilyId: familyUuid,
    });
    assert.equal(liveRowWithoutFamilyId.verified, false);
    assert.equal(liveRowWithoutFamilyId.verifiedFamilyId, null);
    assert.equal(liveRowWithoutFamilyId.needsFamilyBootstrap, true);

    // 2. Quarantined legacy orphan row cannot be claimed even if family_id is present
    const orphanRowCheck = verifyDatabaseFamilyMembership({
      sessionAuthUid: authUid,
      dbUserRow: {
        id: profileId,
        auth_user_id: authUid,
        family_id: familyUuid,
        full_name: 'سجل يتيم قديم',
        role: 'father',
        is_legacy_orphan: true,
      },
    });
    assert.equal(orphanRowCheck.verified, false);
    assert.equal(orphanRowCheck.verifiedFamilyId, null);

    // 3. Mismatched auth_user_id is rejected
    const mismatchedAuthCheck = verifyDatabaseFamilyMembership({
      sessionAuthUid: authUid,
      dbUserRow: {
        id: profileId,
        auth_user_id: otherAuthUid,
        family_id: familyUuid,
        full_name: 'مستخدم آخر',
        role: 'mother',
      },
    });
    assert.equal(mismatchedAuthCheck.verified, false);

    // 4. Valid authenticated session + matching auth_user_id + verified UUID family_id succeeds
    const verifiedCheck = verifyDatabaseFamilyMembership({
      sessionAuthUid: authUid,
      dbUserRow: {
        id: profileId,
        auth_user_id: authUid,
        family_id: familyUuid,
        full_name: 'أحمد المنصور',
        role: 'father',
        is_legacy_orphan: false,
      },
    });
    assert.equal(verifiedCheck.verified, true);
    assert.equal(verifiedCheck.authUserId, authUid);
    assert.equal(verifiedCheck.profileUserId, profileId);
    assert.equal(verifiedCheck.verifiedFamilyId, familyUuid);
    assert.equal(verifiedCheck.needsFamilyBootstrap, false);
  });

  it('11. Phase 2 Contract: maps ChildProfile to live (age_stage, passions_or_heroes) and Phase 2 columns without leaking numeric local IDs', () => {
    assert.deepEqual(VERIFIED_LIVE_TABLE_COLUMNS.users, [
      'id',
      'auth_user_id',
      'full_name',
      'role',
      'created_at',
    ]);

    const familyUuid = '99999999-8888-4777-8666-555555555555';
    const remoteChildUuid = '11111111-2222-4333-8444-555555555551';

    // New child without remoteId -> must omit `id` so DB generates UUID, while populating age_stage & passions_or_heroes
    const liveMinimalNewChild = mapChildProfileToContractRow(
      {
        id: 1, // local UI numeric ID must NOT be sent as DB id
        name: 'ليان',
        birth: '2022-05-14',
        gender: 'girl',
        interests: 'الرسم بالألوان المائية والقصص',
      },
      familyUuid,
      'live_minimal'
    );
    assert.equal('id' in liveMinimalNewChild, false);
    assert.equal(liveMinimalNewChild.family_id, familyUuid);
    assert.equal(liveMinimalNewChild.name, 'ليان');
    assert.equal(liveMinimalNewChild.gender, 'girl');
    assert.equal(liveMinimalNewChild.passions_or_heroes, 'الرسم بالألوان المائية والقصص');
    assert.equal(typeof liveMinimalNewChild.age_stage, 'string');
    assert.ok(liveMinimalNewChild.age_stage.length > 0);

    // Existing child with verified UUID remoteId -> includes `id` and mirrors `passions_or_heroes` + `interests`
    const phase2ExistingChild = mapChildProfileToContractRow(
      {
        id: 2,
        remoteId: remoteChildUuid,
        name: 'عمر',
        birth: '2018-09-10',
        gender: 'boy',
        interests: 'السباحة والعلوم',
        avatarTheme: 'scientist',
      },
      familyUuid,
      'phase2_full'
    );
    assert.equal(phase2ExistingChild.id, remoteChildUuid);
    assert.equal(phase2ExistingChild.family_id, familyUuid);
    assert.equal(phase2ExistingChild.passions_or_heroes, 'السباحة والعلوم');
    assert.equal(phase2ExistingChild.interests, 'السباحة والعلوم');
    assert.equal(phase2ExistingChild.birth, '2018-09-10');
  });

  it('12. Required 9-Step E2E Scenario: Register -> Verify Identity -> Create Profile & Family -> Add Children -> Confirm in DB -> Sign Out -> Sign In -> Restore Exact Data -> Cross-Account RLS Isolation', async () => {
    /**
     * Stateful Supabase Auth + RLS-Enforcing PostgREST Simulator that mirrors
     * `auth.users`, `public.families`, `public.users`, `public.children`,
     * `bootstrap_authenticated_family_space`, and `current_user_family_id()` RLS policies.
     */
    interface SimAuthUser {
      id: string;
      email: string;
      password: string;
      email_confirmed_at: string | null;
      phone_confirmed_at: string | null;
      confirmed_at: string | null;
      user_metadata: Record<string, unknown>;
      otpToken: string;
    }

    const dbAuthUsers = new Map<string, SimAuthUser>();
    const dbFamilies = new Map<string, Record<string, unknown>>();
    const dbUsers = new Map<string, Record<string, unknown>>();
    const dbChildren = new Map<string, Record<string, unknown>>();

    let uuidCounter = 100;
    const nextUuid = () => {
      uuidCounter += 1;
      const hex = uuidCounter.toString(16).padStart(12, '0');
      return `88888888-4444-4444-8444-${hex}`;
    };

    const createSimulatedRlsClient = (): SupabaseClient => {
      let currentSessionUser: SimAuthUser | null = null;

      const currentUserFamilyId = (): string | null => {
        if (!currentSessionUser) return null;
        for (const u of dbUsers.values()) {
          if (u.auth_user_id === currentSessionUser.id && typeof u.family_id === 'string') {
            return u.family_id;
          }
        }
        return null;
      };

      const makeQueryBuilder = (tableName: string) => {
        const filters: Array<{ col: string; val: unknown }> = [];
        let op: 'select' | 'insert' | 'upsert' | 'update' = 'select';
        let writePayload: Array<Record<string, unknown>> = [];
        let upsertConflictCol: string | undefined;

        const execute = async (): Promise<{ data: unknown; error: null | { message: string; code?: string } }> => {
          const myUid = currentSessionUser?.id || null;
          const myFamilyId = currentUserFamilyId();

          if (!myUid && tableName !== 'catalog_items') {
            return { data: [], error: null };
          }

          if (op === 'select') {
            let sourceRows: Array<Record<string, unknown>> = [];
            if (tableName === 'families') {
              sourceRows = Array.from(dbFamilies.values()).filter(
                (r) => myFamilyId && r.id === myFamilyId
              );
            } else if (tableName === 'users') {
              sourceRows = Array.from(dbUsers.values()).filter(
                (r) =>
                  r.auth_user_id === myUid ||
                  (r.auth_user_id && myFamilyId && r.family_id === myFamilyId)
              );
            } else if (tableName === 'children') {
              sourceRows = Array.from(dbChildren.values()).filter(
                (r) => myFamilyId && r.family_id === myFamilyId
              );
            }
            for (const f of filters) {
              sourceRows = sourceRows.filter((r) => r[f.col] === f.val);
            }
            return { data: sourceRows.map((r) => ({ ...r })), error: null };
          }

          if (op === 'insert' || op === 'upsert') {
            const savedRows: Array<Record<string, unknown>> = [];
            for (const rawItem of writePayload) {
              if (tableName === 'families') {
                const id = typeof rawItem.id === 'string' && isValidUuid(rawItem.id) ? rawItem.id : nextUuid();
                if (dbFamilies.has(id) && id !== myFamilyId) {
                  return { data: null, error: { message: 'RLS policy violation on families', code: '42501' } };
                }
                const row = { ...rawItem, id, created_at: new Date().toISOString() };
                dbFamilies.set(id, row);
                savedRows.push(row);
              } else if (tableName === 'users') {
                if (rawItem.auth_user_id !== myUid) {
                  return { data: null, error: { message: 'RLS policy violation on users', code: '42501' } };
                }
                let existingId: string | null = null;
                if (upsertConflictCol === 'auth_user_id') {
                  for (const [k, v] of dbUsers.entries()) {
                    if (v.auth_user_id === myUid) {
                      existingId = k;
                      break;
                    }
                  }
                }
                const id = existingId || (typeof rawItem.id === 'string' && isValidUuid(rawItem.id) ? rawItem.id : nextUuid());
                const row = {
                  ...(existingId ? dbUsers.get(existingId) : {}),
                  ...rawItem,
                  id,
                };
                dbUsers.set(id, row);
                savedRows.push(row);
              } else if (tableName === 'children') {
                // Enforce RLS: `WITH CHECK (family_id = public.current_user_family_id())`
                if (!myFamilyId || rawItem.family_id !== myFamilyId) {
                  return {
                    data: null,
                    error: {
                      message: 'new row violates row-level security policy for table "children"',
                      code: '42501',
                    },
                  };
                }
                const id = typeof rawItem.id === 'string' && isValidUuid(rawItem.id) ? rawItem.id : nextUuid();
                const existingChild = dbChildren.get(id);
                if (existingChild && existingChild.family_id !== myFamilyId) {
                  return {
                    data: null,
                    error: {
                      message: 'RLS policy violation: cannot overwrite another family child',
                      code: '42501',
                    },
                  };
                }
                const row = {
                  ...(existingChild || {}),
                  ...rawItem,
                  id,
                  created_at: existingChild?.created_at || new Date().toISOString(),
                };
                dbChildren.set(id, row);
                savedRows.push(row);
              }
            }
            return { data: savedRows, error: null };
          }

          if (op === 'update') {
            const patch = writePayload[0] || {};
            const updatedRows: Array<Record<string, unknown>> = [];
            if (tableName === 'users') {
              for (const [k, v] of dbUsers.entries()) {
                const matchesFilters = filters.every((f) => v[f.col] === f.val);
                if (matchesFilters && v.auth_user_id === myUid) {
                  const next = { ...v, ...patch };
                  dbUsers.set(k, next);
                  updatedRows.push(next);
                }
              }
            } else if (tableName === 'families') {
              for (const [k, v] of dbFamilies.entries()) {
                const matchesFilters = filters.every((f) => v[f.col] === f.val);
                if (matchesFilters && k === myFamilyId) {
                  const next = { ...v, ...patch };
                  dbFamilies.set(k, next);
                  updatedRows.push(next);
                }
              }
            }
            return { data: updatedRows, error: null };
          }

          return { data: [], error: null };
        };

        const builder = {
          select() {
            return builder;
          },
          eq(col: string, val: unknown) {
            filters.push({ col, val });
            return builder;
          },
          order() {
            return builder;
          },
          limit() {
            return builder;
          },
          insert(rows: Record<string, unknown> | Array<Record<string, unknown>>) {
            op = 'insert';
            writePayload = Array.isArray(rows) ? rows : [rows];
            return builder;
          },
          upsert(
            rows: Record<string, unknown> | Array<Record<string, unknown>>,
            opts?: { onConflict?: string }
          ) {
            op = 'upsert';
            writePayload = Array.isArray(rows) ? rows : [rows];
            upsertConflictCol = opts?.onConflict;
            return builder;
          },
          update(patch: Record<string, unknown>) {
            op = 'update';
            writePayload = [patch];
            return builder;
          },
          then(
            onFulfilled?: (value: { data: unknown; error: null | { message: string; code?: string } }) => unknown,
            onRejected?: (reason: unknown) => unknown
          ) {
            return execute().then(onFulfilled, onRejected);
          },
        };
        return builder;
      };

      const client = {
        auth: {
          async signUp(params: {
            email: string;
            password: string;
            options?: { data?: Record<string, unknown> };
          }) {
            const cleanEmail = params.email.trim().toLowerCase();
            for (const existing of dbAuthUsers.values()) {
              if (existing.email === cleanEmail) {
                return {
                  data: { user: null, session: null },
                  error: { message: 'User already registered' },
                };
              }
            }
            const newUser: SimAuthUser = {
              id: nextUuid(),
              email: cleanEmail,
              password: params.password,
              email_confirmed_at: null,
              phone_confirmed_at: null,
              confirmed_at: null,
              user_metadata: params.options?.data || {},
              otpToken: '654321',
            };
            dbAuthUsers.set(newUser.id, newUser);
            // Mirrors live `mailer_autoconfirm: false` -> user created, session is null until OTP verified
            return {
              data: {
                user: { ...newUser },
                session: null,
              },
              error: null,
            };
          },
          async verifyOtp(params: { email?: string; token: string; type: string }) {
            const cleanEmail = (params.email || '').trim().toLowerCase();
            for (const user of dbAuthUsers.values()) {
              if (user.email === cleanEmail && user.otpToken === params.token.trim()) {
                const nowIso = new Date().toISOString();
                user.email_confirmed_at = nowIso;
                user.confirmed_at = nowIso;
                currentSessionUser = user;
                return {
                  data: {
                    user: { ...user },
                    session: {
                      access_token: `jwt_${user.id}`,
                      user: { ...user },
                    },
                  },
                  error: null,
                };
              }
            }
            return {
              data: { user: null, session: null },
              error: { message: 'Token has expired or is invalid' },
            };
          },
          async signInWithPassword(params: { email: string; password: string }) {
            const cleanEmail = params.email.trim().toLowerCase();
            for (const user of dbAuthUsers.values()) {
              if (user.email === cleanEmail) {
                if (user.password !== params.password) {
                  return {
                    data: { user: null, session: null },
                    error: { message: 'Invalid login credentials' },
                  };
                }
                if (!user.email_confirmed_at) {
                  return {
                    data: { user: null, session: null },
                    error: { message: 'Email not confirmed' },
                  };
                }
                currentSessionUser = user;
                return {
                  data: {
                    user: { ...user },
                    session: {
                      access_token: `jwt_${user.id}`,
                      user: { ...user },
                    },
                  },
                  error: null,
                };
              }
            }
            return {
              data: { user: null, session: null },
              error: { message: 'Invalid login credentials' },
            };
          },
          async getSession() {
            if (!currentSessionUser) {
              return { data: { session: null }, error: null };
            }
            return {
              data: {
                session: {
                  access_token: `jwt_${currentSessionUser.id}`,
                  user: { ...currentSessionUser },
                },
              },
              error: null,
            };
          },
          async signOut() {
            currentSessionUser = null;
            return { error: null };
          },
        },
        async rpc(fnName: string, args: Record<string, unknown>) {
          if (fnName === 'bootstrap_authenticated_family_space') {
            if (!currentSessionUser) {
              return { data: null, error: { message: 'UNAUTHENTICATED' } };
            }
            // Check if 1:1 user row already exists for `auth_user_id`
            for (const existingUser of dbUsers.values()) {
              if (
                existingUser.auth_user_id === currentSessionUser.id &&
                typeof existingUser.family_id === 'string'
              ) {
                return {
                  data: [
                    {
                      user_id: existingUser.id,
                      family_id: existingUser.family_id,
                      is_new_family: false,
                    },
                  ],
                  error: null,
                };
              }
            }
            const famId = nextUuid();
            dbFamilies.set(famId, {
              id: famId,
              family_name: args.p_family_name || `أسرة ${args.p_full_name} — نكبر`,
              country: args.p_country || 'EG',
              city: args.p_city || 'القاهرة',
              currency: args.p_currency || 'EGP',
              active_parent: args.p_role || 'father',
              created_by: currentSessionUser.id,
              created_at: new Date().toISOString(),
            });
            const usrRowId = nextUuid();
            dbUsers.set(usrRowId, {
              id: usrRowId,
              auth_user_id: currentSessionUser.id,
              family_id: famId,
              full_name: args.p_full_name,
              role: args.p_role || 'father',
              email: currentSessionUser.email,
              phone: args.p_phone || '',
              country: args.p_country || 'EG',
              verified: Boolean(currentSessionUser.email_confirmed_at),
              created_at: new Date().toISOString(),
            });
            return {
              data: [{ user_id: usrRowId, family_id: famId, is_new_family: true }],
              error: null,
            };
          }
          return { data: null, error: { message: 'RPC not found' } };
        },
        from(tableName: string) {
          return makeQueryBuilder(tableName);
        },
      };

      return client as unknown as SupabaseClient;
    };

    const clientA = createSimulatedRlsClient();
    const clientB = createSimulatedRlsClient();

    // =========================================================================
    // STEP 1: Register a new account (Account A)
    // =========================================================================
    const registerRes = await authenticateParentWithSupabase(
      {
        mode: 'signup',
        email: 'tarek.father@nekbaar.app',
        password: 'SecurePassword#2026',
        phone: '+201012345678',
        parentName: 'طارق المنصور',
        role: 'father',
        country: 'EG',
        city: 'القاهرة',
        currency: 'EGP',
      },
      clientA
    );

    assert.equal(registerRes.accountCreated, true);
    assert.equal(registerRes.pendingEmailVerification, true);
    assert.equal(registerRes.authenticated, false);
    assert.equal(registerRes.identityVerified, false);
    assert.equal(registerRes.emailVerified, false);
    assert.equal(registerRes.phoneVerified, false);
    assert.equal(registerRes.syncedToDb, false);
    assert.equal(dbFamilies.size, 0, 'Unverified signup must not write to families');
    assert.equal(dbUsers.size, 0, 'Unverified signup must not write to public.users');

    // =========================================================================
    // STEP 2: Complete genuine identity verification (OTP)
    // =========================================================================
    const verifyRes = await verifyAccountIdentityOtpInSupabase(
      {
        email: 'tarek.father@nekbaar.app',
        token: '654321',
        type: 'signup',
      },
      clientA
    );
    assert.equal(verifyRes.verified, true);
    assert.equal(verifyRes.emailVerified, true);
    assert.ok(isValidUuid(verifyRes.userId));

    // =========================================================================
    // STEP 3: Create the user profile and family record
    // =========================================================================
    const bootstrapRes = await authenticateParentWithSupabase(
      {
        mode: 'signin',
        email: 'tarek.father@nekbaar.app',
        password: 'SecurePassword#2026',
        phone: '+201012345678',
        parentName: 'طارق المنصور',
        role: 'father',
        country: 'EG',
        city: 'القاهرة',
        currency: 'EGP',
      },
      clientA
    );

    assert.equal(bootstrapRes.success, true);
    assert.equal(bootstrapRes.authenticated, true);
    assert.equal(bootstrapRes.identityVerified, true);
    assert.equal(bootstrapRes.emailVerified, true);
    assert.equal(bootstrapRes.profileCreated, true);
    assert.equal(bootstrapRes.familyLinked, true);
    assert.equal(bootstrapRes.syncedToDb, true);
    assert.ok(isValidUuid(bootstrapRes.verifiedFamilyUuid));
    const familyAUuid = bootstrapRes.verifiedFamilyUuid!;
    const userAUuid = bootstrapRes.userId;

    // =========================================================================
    // STEP 4: Add one or more children (plus retry deduplication check)
    // =========================================================================
    const addChildrenRes = await saveOnboardingChildrenToSupabase(
      {
        familyId: familyAUuid,
        childrenList: [
          {
            id: 1,
            name: 'كريم طارق',
            birth: '2021-06-15',
            gender: 'boy',
            interests: 'التركيب والفضاء',
            avatarTheme: 'astronaut',
          },
          {
            id: 2,
            name: 'سارة طارق',
            birth: '2023-11-02',
            gender: 'girl',
            interests: 'الموسيقى والرسم',
            avatarTheme: 'artist',
          },
        ],
      },
      clientA
    );

    assert.equal(addChildrenRes.synced, true);
    assert.equal(addChildrenRes.savedChildren.length, 2);
    assert.ok(isValidUuid(addChildrenRes.savedChildren[0].remote_id));
    assert.ok(isValidUuid(addChildrenRes.savedChildren[1].remote_id));

    // Retry with the exact same children to verify zero duplicate rows are created
    const retryChildrenRes = await saveOnboardingChildrenToSupabase(
      {
        familyId: familyAUuid,
        childrenList: [
          {
            id: 1,
            name: 'كريم طارق',
            birth: '2021-06-15',
            gender: 'boy',
            interests: 'التركيب والفضاء',
            avatarTheme: 'astronaut',
          },
          {
            id: 2,
            name: 'سارة طارق',
            birth: '2023-11-02',
            gender: 'girl',
            interests: 'الموسيقى والرسم',
            avatarTheme: 'artist',
          },
        ],
      },
      clientA
    );
    assert.equal(retryChildrenRes.synced, true);
    assert.equal(dbChildren.size, 2, 'Retries must update existing children, never duplicate rows');

    // =========================================================================
    // STEP 5: Confirm that all records exist in Supabase
    // =========================================================================
    assert.equal(dbUsers.size, 1, 'Exactly one 1:1 user profile must exist for Account A');
    assert.equal(dbFamilies.size, 1, 'Exactly one family record must exist for Account A');
    assert.equal(dbChildren.size, 2, 'Both children records must exist in Supabase');
    const fetchedChildrenStep5 = await fetchChildrenFromSupabase(familyAUuid, clientA);
    assert.equal(fetchedChildrenStep5.error, null);
    assert.equal(fetchedChildrenStep5.data.length, 2);
    assert.deepEqual(
      fetchedChildrenStep5.data.map((c) => c.name),
      ['كريم طارق', 'سارة طارق']
    );

    // =========================================================================
    // STEP 6: Sign out
    // =========================================================================
    const signOutRes = await signOutFromSupabase(clientA);
    assert.equal(signOutRes.signedOut, true);
    const afterSignOutCtx = await resolveVerifiedFamilyContext(clientA);
    assert.equal(afterSignOutCtx.authenticated, false);
    assert.equal(afterSignOutCtx.verifiedFamilyId, null);

    // =========================================================================
    // STEP 7: Sign in again using the same account
    // =========================================================================
    const signInAgainRes = await authenticateParentWithSupabase(
      {
        mode: 'signin',
        email: 'tarek.father@nekbaar.app',
        password: 'SecurePassword#2026',
        phone: '+201012345678',
        parentName: 'طارق المنصور',
        role: 'father',
        country: 'EG',
        city: 'القاهرة',
      },
      clientA
    );
    assert.equal(signInAgainRes.success, true);
    assert.equal(signInAgainRes.authenticated, true);
    assert.equal(signInAgainRes.userId, userAUuid);
    assert.equal(signInAgainRes.verifiedFamilyUuid, familyAUuid);
    assert.equal(dbUsers.size, 1, 'Signing in again must not create a duplicate user profile');
    assert.equal(dbFamilies.size, 1, 'Signing in again must not create a duplicate family');

    // =========================================================================
    // STEP 8: Confirm that the exact same user, family, and children data is restored
    // =========================================================================
    const restoredAccount = await restoreAuthenticatedAccountFromSupabase(clientA);
    assert.equal(restoredAccount.restored, true);
    assert.equal(restoredAccount.userId, userAUuid);
    assert.equal(restoredAccount.verifiedFamilyId, familyAUuid);
    assert.equal(restoredAccount.userProfile?.full_name, 'طارق المنصور');
    assert.equal(restoredAccount.userProfile?.role, 'father');
    assert.equal(restoredAccount.family?.id, familyAUuid);
    assert.equal(restoredAccount.family?.country, 'EG');
    assert.equal(restoredAccount.family?.city, 'القاهرة');
    assert.equal(restoredAccount.children.length, 2);
    assert.equal(restoredAccount.children[0].name, 'كريم طارق');
    assert.equal(restoredAccount.children[1].name, 'سارة طارق');
    assert.equal(
      restoredAccount.children[0].remote_id,
      addChildrenRes.savedChildren[0].remote_id
    );
    assert.equal(
      restoredAccount.children[1].remote_id,
      addChildrenRes.savedChildren[1].remote_id
    );

    // =========================================================================
    // STEP 9: Test that a different account (Account B) cannot access Account A's family data
    // =========================================================================
    await authenticateParentWithSupabase(
      {
        mode: 'signup',
        email: 'nada.mother@nekbaar.app',
        password: 'OtherPassword#2026',
        phone: '+966551234567',
        parentName: 'ندى العتيبي',
        role: 'mother',
        country: 'SA',
        city: 'الرياض',
        currency: 'SAR',
      },
      clientB
    );
    await verifyAccountIdentityOtpInSupabase(
      {
        email: 'nada.mother@nekbaar.app',
        token: '654321',
        type: 'signup',
      },
      clientB
    );
    const bootstrapB = await authenticateParentWithSupabase(
      {
        mode: 'signin',
        email: 'nada.mother@nekbaar.app',
        password: 'OtherPassword#2026',
        phone: '+966551234567',
        parentName: 'ندى العتيبي',
        role: 'mother',
        country: 'SA',
        city: 'الرياض',
        currency: 'SAR',
      },
      clientB
    );
    assert.equal(bootstrapB.success, true);
    const familyBUuid = bootstrapB.verifiedFamilyUuid!;
    assert.notEqual(familyBUuid, familyAUuid, 'Account B must receive a separate family UUID');

    // Account B attempts to read Account A's children by passing Family A's UUID
    const crossReadChildren = await fetchChildrenFromSupabase(familyAUuid, clientB);
    assert.equal(
      crossReadChildren.data.length,
      0,
      'RLS & service ownership verification must block Account B from reading Account A children'
    );

    // Account B attempts to read Account A's user profile
    const crossReadUsers = await fetchUsersFromSupabase(familyAUuid, clientB);
    assert.equal(
      crossReadUsers.data.filter((u) => u.id === userAUuid).length,
      0,
      'Account B must not be able to read Account A user profile'
    );

    // Confirm Account A's children are completely untouched
    const accountAChildrenCheck = await fetchChildrenFromSupabase(familyAUuid, clientA);
    assert.equal(accountAChildrenCheck.data.length, 2);
  });

  it('13. Live Supabase Configuration & Contract Readiness: normalizes publishable anon key and models live table columns accurately', () => {
    assert.equal(SUPABASE_URL, 'https://qbwnzunusmaidciakuod.supabase.co');
    assert.ok(
      SUPABASE_ANON_KEY.startsWith('sb_publishable_'),
      'SUPABASE_ANON_KEY must be normalized to lowercase sb_publishable_ prefix so PostgREST does not reject it with 401'
    );
    assert.deepEqual(VERIFIED_LIVE_TABLE_COLUMNS.extended_family, [
      'id',
      'family_id',
      'full_name',
      'relation_type',
      'created_at',
    ]);
    assert.deepEqual(VERIFIED_LIVE_TABLE_COLUMNS.catalog_items, [
      'id',
      'title',
      'price',
      'description',
      'created_at',
    ]);
  });

  it('14. Truthful OAuth & Co-Parent Verification: never fakes OAuth login or co-parent verification when providers or sessions are unverified', async () => {
    assert.equal(VERIFIED_LIVE_AUTH_SETTINGS.oauthProviders.google, false);
    assert.equal(VERIFIED_LIVE_AUTH_SETTINGS.oauthProviders.apple, false);
    assert.equal(VERIFIED_LIVE_AUTH_SETTINGS.oauthProviders.facebook, false);
    assert.equal(VERIFIED_LIVE_AUTH_SETTINGS.oauthProviders.azure, false);

    const disabledEval = evaluateOAuthProviderAvailability('google', {
      data: { url: null, provider: 'google' },
      error: { message: 'Unsupported provider: provider is not enabled' },
    });
    assert.equal(disabledEval.available, false);
    assert.equal(disabledEval.redirectUrl, null);
    assert.ok(disabledEval.reasonAr?.includes('google'));

    const mockDisabledOAuthClient = {
      auth: {
        async signInWithOAuth() {
          return {
            data: { provider: 'google', url: null },
            error: { message: 'Unsupported provider: provider is not enabled' },
          };
        },
        async getSession() {
          return { data: { session: null }, error: null };
        },
      },
    } as unknown as SupabaseClient;

    const oauthRes = await signInWithOAuthProviderInSupabase('google', mockDisabledOAuthClient);
    assert.equal(oauthRes.initiated, false);
    assert.equal(oauthRes.redirectUrl, null);
    assert.ok(oauthRes.errorEn?.includes('not enabled'));

    // Unauthenticated co-parent linking must never report linked=true or verified=true
    const coParentRes = await linkCoParentAccountInSupabase(
      {
        familyId: SHARED_FAMILY_ID,
        partnerRole: 'mother',
        partnerName: 'مريم',
        partnerPhone: '551234567',
        partnerEmail: 'maryam@example.com',
        country: 'SA',
        method: 'phone_otp',
      },
      mockDisabledOAuthClient
    );
    assert.equal(coParentRes.linked, false);
    assert.equal(coParentRes.syncedToDb, false);
  });

  it('15. Child Deletion & Family Ownership Enforcement: deletes child only when owned by authenticated family', async () => {
    const familyAUuid = '44444444-4444-4444-8444-444444444444';
    const childAUuid = '55555555-5555-4555-8555-555555555555';
    const authUserAUuid = '66666666-6666-4666-8666-666666666666';
    let deletedChildId: string | null = null;
    let deletedFamilyId: string | null = null;

    const mockAuthClient = {
      auth: {
        async getSession() {
          return {
            data: {
              session: {
                access_token: 'jwt_valid',
                user: {
                  id: authUserAUuid,
                  email: 'owner@nekbaar.app',
                  email_confirmed_at: '2026-10-30T00:00:00Z',
                },
              },
            },
            error: null,
          };
        },
      },
      from(table: string) {
        if (table === 'users') {
          return {
            select() {
              return {
                eq() {
                  return {
                    async limit() {
                      return {
                        data: [
                          {
                            id: '77777777-7777-4777-8777-777777777777',
                            auth_user_id: authUserAUuid,
                            family_id: familyAUuid,
                          },
                        ],
                        error: null,
                      };
                    },
                  };
                },
              };
            },
          };
        }
        if (table === 'children') {
          return {
            delete() {
              return {
                eq(col1: string, val1: string) {
                  if (col1 === 'id') deletedChildId = val1;
                  return {
                    async eq(col2: string, val2: string) {
                      if (col2 === 'family_id') deletedFamilyId = val2;
                      return { error: null };
                    },
                  };
                },
              };
            },
          };
        }
        throw new Error(`Unexpected table ${table}`);
      },
    } as unknown as SupabaseClient;

    // Non-UUID local ID is skipped safely
    const localSkipRes = await deleteChildFromSupabase({ remoteId: 1 }, mockAuthClient);
    assert.equal(localSkipRes.deleted, false);

    // Valid UUID child owned by Family A is deleted with both id and family_id filters
    const delRes = await deleteChildFromSupabase({ remoteId: childAUuid }, mockAuthClient);
    assert.equal(delRes.deleted, true);
    assert.equal(delRes.error, null);
    assert.equal(deletedChildId, childAUuid);
    assert.equal(deletedFamilyId, familyAUuid);
  });
  it('isolates local workspaces by verified family UUID', () => {
    const familyA = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    const familyB = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
    memoryStorage.setItem(STORAGE_KEY, JSON.stringify({ ...DEFAULT_SEED, tasks: [{ id: 900, name: 'legacy' }] }));

    const cleanA = loadFamilySpaceStateForFamily(familyA);
    assert.equal(cleanA.tasks.length, 0);

    const stateA = normalizeAppData({
      ...createEmptyFamilySpaceState(),
      verifiedFamilyId: familyA,
      parentName: 'Family A',
      tasks: [{ id: 901, name: 'private task', time: '08:00', done: false, kidId: 1, category: 'routine', owner: 'parent', cadence: 'daily' }],
    });
    assert.equal(saveFamilySpaceStateForFamily(stateA, familyA), true);

    assert.equal(loadFamilySpaceStateForFamily(familyA).tasks[0]?.name, 'private task');
    assert.equal(loadFamilySpaceStateForFamily(familyB).tasks.length, 0);
    assert.equal(getFamilySpaceStorageKey('1'), null);
    assert.equal(getFamilySpaceStorageKey('not-a-uuid'), null);
  });

  it('16. Sign-In Account Restoration & Post-OTP Bootstrap: restores saved phone, role, country, city, and children on signin without running UPDATE queries, and reuses verified session after OTP confirmation', async () => {
    const authUserUuid = '12121212-3434-4567-8901-234567890123';
    const userRowUuid = '21212121-4343-4567-8901-234567890123';
    const familyUuid = '31313131-5454-4567-8901-234567890123';
    const childUuid = '41414141-6565-4567-8901-234567890123';

    let usersUpdateCalled = false;
    let usersUpsertCalled = false;
    let signUpCallCount = 0;

    const mockRestoreClient = {
      auth: {
        async signInWithPassword({ email }: { email: string }) {
          return {
            data: {
              user: {
                id: authUserUuid,
                email,
                email_confirmed_at: '2026-10-30T10:00:00Z',
              },
              session: {
                access_token: 'jwt_signin_restored',
                user: {
                  id: authUserUuid,
                  email,
                  email_confirmed_at: '2026-10-30T10:00:00Z',
                },
              },
            },
            error: null,
          };
        },
        async signUp() {
          signUpCallCount += 1;
          return {
            data: { user: null, session: null },
            error: { message: 'User already registered' },
          };
        },
        async getSession() {
          return {
            data: {
              session: {
                access_token: 'jwt_signin_restored',
                user: {
                  id: authUserUuid,
                  email: 'mariam@nekbaar.app',
                  email_confirmed_at: '2026-10-30T10:00:00Z',
                },
              },
            },
            error: null,
          };
        },
      },
      from(table: string) {
        if (table === 'users') {
          return {
            select() {
              const chain = {
                eq() {
                  return chain;
                },
                async limit() {
                  return {
                    data: [
                      {
                        id: userRowUuid,
                        auth_user_id: authUserUuid,
                        family_id: familyUuid,
                        full_name: 'مريم الشافعي',
                        role: 'mother',
                        email: 'mariam@nekbaar.app',
                        phone: '+201098765432',
                        country: 'EG',
                      },
                    ],
                    error: null,
                  };
                },
              };
              return chain;
            },
            update() {
              usersUpdateCalled = true;
              const chain = {
                eq() {
                  return chain;
                },
                then(resolve: (val: { error: null }) => void) {
                  resolve({ error: null });
                },
              };
              return chain;
            },
            upsert() {
              usersUpsertCalled = true;
              return Promise.resolve({ error: null });
            },
          };
        }
        if (table === 'families') {
          return {
            select() {
              return {
                eq() {
                  return {
                    async limit() {
                      return {
                        data: [
                          {
                            id: familyUuid,
                            family_name: 'عائلة الشافعي',
                            country: 'EG',
                            city: 'الإسكندرية',
                            currency: 'EGP',
                            active_parent: 'mother',
                          },
                        ],
                        error: null,
                      };
                    },
                  };
                },
              };
            },
          };
        }
        if (table === 'children') {
          return {
            select() {
              return {
                async eq() {
                  return {
                    data: [
                      {
                        id: childUuid,
                        family_id: familyUuid,
                        name: 'سلمى',
                        gender: 'girl',
                        birth_date: '2021-09-01',
                        passions_or_heroes: 'الباليه والرسم',
                        avatar_theme: 'artist',
                      },
                    ],
                    error: null,
                  };
                },
              };
            },
          };
        }
        throw new Error(`Unexpected table: ${table}`);
      },
    } as unknown as SupabaseClient;

    // 1. Sign-in with blank UI defaults (parentName: '', phone: '', country: 'SA', role: 'father')
    // must restore authoritative DB values without issuing UPDATE or UPSERT on `public.users`.
    const signInRes = await authenticateParentWithSupabase(
      {
        mode: 'signin',
        parentName: '',
        role: 'father',
        email: 'mariam@nekbaar.app',
        phone: '',
        password: 'Password123!',
        country: 'SA',
        city: 'الرياض',
        currency: 'SAR',
      },
      mockRestoreClient
    );

    assert.equal(signInRes.success, true);
    assert.equal(signInRes.syncedToDb, true);
    assert.equal(signInRes.verifiedFamilyUuid, familyUuid);
    assert.equal(usersUpdateCalled, false);
    assert.equal(usersUpsertCalled, false);
    assert.equal(signInRes.user.full_name, 'مريم الشافعي');
    assert.equal(signInRes.user.role, 'mother');
    assert.equal(signInRes.user.phone, '+201098765432');
    assert.equal(signInRes.user.country, 'EG');
    assert.equal(signInRes.family?.country, 'EG');
    assert.equal(signInRes.family?.city, 'الإسكندرية');
    assert.equal(signInRes.family?.currency, 'EGP');
    assert.equal(signInRes.sharedChildren.length, 1);
    assert.equal(signInRes.sharedChildren[0].name, 'سلمى');
    assert.equal(signInRes.sharedChildren[0].remote_id, childUuid);

    // 2. Post-OTP signup retry: when `mode: 'signup'` is called after `verifyOtp` has already
    // established an active verified session for that email, it reuses the session instead of calling `auth.signUp` again.
    const postOtpSignupRes = await authenticateParentWithSupabase(
      {
        mode: 'signup',
        parentName: 'مريم الشافعي',
        role: 'mother',
        email: 'mariam@nekbaar.app',
        phone: '+201098765432',
        password: 'Password123!',
        country: 'EG',
        city: 'الإسكندرية',
        currency: 'EGP',
      },
      mockRestoreClient
    );

    assert.equal(signUpCallCount, 0);
    assert.equal(postOtpSignupRes.success, true);
    assert.equal(postOtpSignupRes.verifiedFamilyUuid, familyUuid);
  });

  it('17. Phase 3 Security Matrix: enforces family read/write isolation, child modification boundaries, user profile insert/upsert policies, immutable ownership triggers, and anonymous access denial', async () => {
    const familyAUuid = 'aaaa1111-2222-4333-8444-555555555501';
    const familyBUuid = 'bbbb1111-2222-4333-8444-555555555502';
    const authUserAUuid = 'aaaa2222-2222-4333-8444-555555555501';
    const authUserBUuid = 'bbbb2222-2222-4333-8444-555555555502';
    const userRowAUuid = 'aaaa3333-2222-4333-8444-555555555501';
    const userRowBUuid = 'bbbb3333-2222-4333-8444-555555555502';
    const childAUuid = 'aaaa4444-2222-4333-8444-555555555501';
    const childBUuid = 'bbbb4444-2222-4333-8444-555555555502';

    const dbFamilies = new Map<string, Record<string, unknown>>([
      [
        familyAUuid,
        {
          id: familyAUuid,
          family_name: 'أسرة طارق',
          country: 'EG',
          city: 'القاهرة',
          currency: 'EGP',
          active_parent: 'father',
          created_by: authUserAUuid,
        },
      ],
      [
        familyBUuid,
        {
          id: familyBUuid,
          family_name: 'أسرة ندى',
          country: 'SA',
          city: 'الرياض',
          currency: 'SAR',
          active_parent: 'mother',
          created_by: authUserBUuid,
        },
      ],
    ]);

    const dbUsers = new Map<string, Record<string, unknown>>([
      [
        userRowAUuid,
        {
          id: userRowAUuid,
          auth_user_id: authUserAUuid,
          family_id: familyAUuid,
          full_name: 'طارق المنصور',
          role: 'father',
          email: 'tarek@nekbaar.app',
          country: 'EG',
          is_legacy_orphan: false,
        },
      ],
      [
        userRowBUuid,
        {
          id: userRowBUuid,
          auth_user_id: authUserBUuid,
          family_id: familyBUuid,
          full_name: 'ندى العتيبي',
          role: 'mother',
          email: 'nada@nekbaar.app',
          country: 'SA',
          is_legacy_orphan: false,
        },
      ],
    ]);

    const dbChildren = new Map<string, Record<string, unknown>>([
      [
        childAUuid,
        {
          id: childAUuid,
          family_id: familyAUuid,
          name: 'كريم طارق',
          gender: 'boy',
          birth: '2021-06-15',
          age_stage: 'EARLY_CHILDHOOD',
          passions_or_heroes: 'الفضاء',
        },
      ],
      [
        childBUuid,
        {
          id: childBUuid,
          family_id: familyBUuid,
          name: 'سلمى ندى',
          gender: 'girl',
          birth: '2022-04-10',
          age_stage: 'EARLY_CHILDHOOD',
          passions_or_heroes: 'الرسم',
        },
      ],
    ]);

    const makeStrictRlsClient = (sessionAuthUid: string | null): SupabaseClient => {
      const resolveMyFamilyId = (): string | null => {
        if (!sessionAuthUid) return null;
        for (const u of dbUsers.values()) {
          if (
            u.auth_user_id === sessionAuthUid &&
            typeof u.family_id === 'string' &&
            !u.is_legacy_orphan
          ) {
            return u.family_id;
          }
        }
        return null;
      };

      const makeTableBuilder = (tableName: string) => {
        const filters: Array<{ col: string; val: unknown }> = [];
        let op: 'select' | 'insert' | 'update' | 'upsert' | 'delete' = 'select';
        let payloadRows: Array<Record<string, unknown>> = [];
        let singleMode = false;

        const run = async (): Promise<{
          data: unknown;
          error: null | { message: string; code: string };
        }> => {
          const myFamilyId = resolveMyFamilyId();

          // Anonymous access to private tables -> Denied (42501)
          if (!sessionAuthUid && tableName !== 'catalog_items') {
            return {
              data: null,
              error: {
                message: `permission denied for table ${tableName}`,
                code: '42501',
              },
            };
          }

          if (op === 'select') {
            let rows: Array<Record<string, unknown>> = [];
            if (tableName === 'families') {
              rows = Array.from(dbFamilies.values()).filter((r) => r.id === myFamilyId);
            } else if (tableName === 'users') {
              rows = Array.from(dbUsers.values()).filter(
                (r) =>
                  !r.is_legacy_orphan &&
                  (r.auth_user_id === sessionAuthUid ||
                    (r.auth_user_id && myFamilyId && r.family_id === myFamilyId))
              );
            } else if (tableName === 'children') {
              rows = Array.from(dbChildren.values()).filter((r) => r.family_id === myFamilyId);
            }
            for (const f of filters) {
              rows = rows.filter((r) => r[f.col] === f.val);
            }
            return {
              data: singleMode ? (rows[0] ? { ...rows[0] } : null) : rows.map((r) => ({ ...r })),
              error: null,
            };
          }

          if (op === 'insert' || op === 'upsert') {
            const saved: Array<Record<string, unknown>> = [];
            for (const item of payloadRows) {
              if (tableName === 'families') {
                // Hardened `families_insert_own_family`: id = private.current_user_family_id()
                if (!myFamilyId || item.id !== myFamilyId) {
                  return {
                    data: null,
                    error: {
                      message: 'new row violates row-level security policy for table "families"',
                      code: '42501',
                    },
                  };
                }
                const existing = dbFamilies.get(myFamilyId);
                if (
                  existing &&
                  existing.created_by &&
                  item.created_by !== undefined &&
                  item.created_by !== existing.created_by
                ) {
                  return {
                    data: null,
                    error: {
                      message: 'IMMUTABLE_OWNERSHIP_VIOLATION: families.created_by cannot be reassigned',
                      code: '42501',
                    },
                  };
                }
                const next = { ...(existing || {}), ...item, id: myFamilyId };
                dbFamilies.set(myFamilyId, next);
                saved.push(next);
              } else if (tableName === 'users') {
                // Hardened `users_insert_self_only`: auth_user_id = auth.uid() AND family_id = current_user_family_id()
                if (
                  item.auth_user_id !== sessionAuthUid ||
                  !myFamilyId ||
                  item.family_id !== myFamilyId
                ) {
                  return {
                    data: null,
                    error: {
                      message: 'new row violates row-level security policy for table "users"',
                      code: '42501',
                    },
                  };
                }
                let existingKey: string | null = null;
                for (const [k, v] of dbUsers.entries()) {
                  if (v.auth_user_id === sessionAuthUid) {
                    existingKey = k;
                    break;
                  }
                }
                const existing = existingKey ? dbUsers.get(existingKey) : undefined;
                if (
                  existing &&
                  ((item.id && item.id !== existing.id) ||
                    (item.auth_user_id && item.auth_user_id !== existing.auth_user_id) ||
                    (item.family_id && item.family_id !== existing.family_id))
                ) {
                  return {
                    data: null,
                    error: {
                      message: 'IMMUTABLE_OWNERSHIP_VIOLATION: user ownership identifiers cannot be changed',
                      code: '42501',
                    },
                  };
                }
                const id = existingKey || String(item.id || userRowAUuid);
                const next = { ...(existing || {}), ...item, id };
                dbUsers.set(id, next);
                saved.push(next);
              } else if (tableName === 'children') {
                if (!myFamilyId || item.family_id !== myFamilyId) {
                  return {
                    data: null,
                    error: {
                      message: 'new row violates row-level security policy for table "children"',
                      code: '42501',
                    },
                  };
                }
                const id = typeof item.id === 'string' ? item.id : 'aaaa5555-2222-4333-8444-555555555599';
                const existing = dbChildren.get(id);
                if (existing && existing.family_id !== myFamilyId) {
                  return {
                    data: null,
                    error: {
                      message: 'IMMUTABLE_OWNERSHIP_VIOLATION: children.family_id cannot be reassigned',
                      code: '42501',
                    },
                  };
                }
                const next = { ...(existing || {}), ...item, id };
                dbChildren.set(id, next);
                saved.push(next);
              }
            }
            return { data: singleMode ? saved[0] ?? null : saved, error: null };
          }

          if (op === 'update') {
            const patch = payloadRows[0] || {};
            const updated: Array<Record<string, unknown>> = [];
            if (tableName === 'families') {
              for (const [k, v] of dbFamilies.entries()) {
                if (filters.every((f) => v[f.col] === f.val) && k === myFamilyId) {
                  if (
                    (patch.id !== undefined && patch.id !== v.id) ||
                    (patch.created_by !== undefined && patch.created_by !== v.created_by)
                  ) {
                    return {
                      data: null,
                      error: {
                        message: 'IMMUTABLE_OWNERSHIP_VIOLATION: families ownership cannot be mutated',
                        code: '42501',
                      },
                    };
                  }
                  const next = { ...v, ...patch };
                  dbFamilies.set(k, next);
                  updated.push(next);
                }
              }
            } else if (tableName === 'users') {
              for (const [k, v] of dbUsers.entries()) {
                if (filters.every((f) => v[f.col] === f.val) && v.auth_user_id === sessionAuthUid) {
                  if (
                    (patch.id !== undefined && patch.id !== v.id) ||
                    (patch.auth_user_id !== undefined && patch.auth_user_id !== v.auth_user_id) ||
                    (patch.family_id !== undefined && patch.family_id !== v.family_id)
                  ) {
                    return {
                      data: null,
                      error: {
                        message: 'IMMUTABLE_OWNERSHIP_VIOLATION: users ownership identifiers cannot be mutated',
                        code: '42501',
                      },
                    };
                  }
                  const next = { ...v, ...patch };
                  dbUsers.set(k, next);
                  updated.push(next);
                }
              }
            } else if (tableName === 'children') {
              for (const [k, v] of dbChildren.entries()) {
                if (filters.every((f) => v[f.col] === f.val) && v.family_id === myFamilyId) {
                  if (
                    (patch.id !== undefined && patch.id !== v.id) ||
                    (patch.family_id !== undefined && patch.family_id !== v.family_id)
                  ) {
                    return {
                      data: null,
                      error: {
                        message: 'IMMUTABLE_OWNERSHIP_VIOLATION: children ownership identifiers cannot be mutated',
                        code: '42501',
                      },
                    };
                  }
                  const next = { ...v, ...patch };
                  dbChildren.set(k, next);
                  updated.push(next);
                }
              }
            }
            return { data: singleMode ? updated[0] ?? null : updated, error: null };
          }

          return { data: [], error: null };
        };

        const builder = {
          select() {
            return builder;
          },
          eq(col: string, val: unknown) {
            filters.push({ col, val });
            return builder;
          },
          limit() {
            return builder;
          },
          maybeSingle() {
            singleMode = true;
            return builder;
          },
          single() {
            singleMode = true;
            return builder;
          },
          insert(rows: Record<string, unknown> | Array<Record<string, unknown>>) {
            op = 'insert';
            payloadRows = Array.isArray(rows) ? rows : [rows];
            return builder;
          },
          upsert(rows: Record<string, unknown> | Array<Record<string, unknown>>) {
            op = 'upsert';
            payloadRows = Array.isArray(rows) ? rows : [rows];
            return builder;
          },
          update(patch: Record<string, unknown>) {
            op = 'update';
            payloadRows = [patch];
            return builder;
          },
          then(
            onFulfilled?: (val: { data: unknown; error: null | { message: string; code: string } }) => unknown,
            onRejected?: (err: unknown) => unknown
          ) {
            return run().then(onFulfilled, onRejected);
          },
        };
        return builder;
      };

      return {
        auth: {
          async getSession() {
            if (!sessionAuthUid) {
              return { data: { session: null }, error: null };
            }
            return {
              data: {
                session: {
                  access_token: `jwt_${sessionAuthUid}`,
                  user: {
                    id: sessionAuthUid,
                    email: sessionAuthUid === authUserAUuid ? 'tarek@nekbaar.app' : 'nada@nekbaar.app',
                    email_confirmed_at: '2026-10-31T00:00:00Z',
                  },
                },
              },
              error: null,
            };
          },
        },
        from(table: string) {
          return makeTableBuilder(table);
        },
      } as unknown as SupabaseClient;
    };

    const clientA = makeStrictRlsClient(authUserAUuid);
    const clientB = makeStrictRlsClient(authUserBUuid);
    const anonClient = makeStrictRlsClient(null);

    // 1. Parent reads own family -> Allowed
    const ownUsersA = await fetchUsersFromSupabase(familyAUuid, clientA);
    assert.equal(ownUsersA.error, null);
    assert.equal(ownUsersA.data.length, 1);
    assert.equal(ownUsersA.data[0].full_name, 'طارق المنصور');

    // 2. Parent reads another family -> Denied
    const crossUsersBReadsA = await fetchUsersFromSupabase(familyAUuid, clientB);
    assert.equal(crossUsersBReadsA.data.length, 0);
    assert.match(crossUsersBReadsA.error || '', /Cross-family read denied/);

    const crossChildrenBReadsA = await fetchChildrenFromSupabase(familyAUuid, clientB);
    assert.equal(crossChildrenBReadsA.data.length, 0);
    assert.match(crossChildrenBReadsA.error || '', /Cross-family read denied/);

    // 3. Parent modifies own child -> Allowed if authorized
    const modifyOwnChildRes = await saveOnboardingChildrenToSupabase(
      {
        familyId: familyAUuid,
        childrenList: [
          {
            id: 1,
            remoteId: childAUuid,
            name: 'كريم طارق المنصور',
            birth: '2021-06-15',
            gender: 'boy',
            interests: 'الفضاء والروبوتات',
            avatarTheme: 'astronaut',
          },
        ],
      },
      clientA
    );
    assert.equal(modifyOwnChildRes.synced, true);
    assert.equal(dbChildren.get(childAUuid)?.name, 'كريم طارق المنصور');

    // 4. Parent modifies another family's child -> Denied
    const modifyOtherFamilyChildViaService = await saveOnboardingChildrenToSupabase(
      {
        familyId: familyAUuid,
        childrenList: [
          {
            id: 1,
            remoteId: childAUuid,
            name: 'محاولة تعديل غير مصرح بها',
            birth: '2021-06-15',
            gender: 'boy',
            interests: 'قرصنة',
          },
        ],
      },
      clientB
    );
    assert.equal(modifyOtherFamilyChildViaService.synced, false);
    assert.match(modifyOtherFamilyChildViaService.error || '', /Cross-family write denied/);
    assert.equal(dbChildren.get(childAUuid)?.name, 'كريم طارق المنصور');

    // Direct DB upsert attempting to overwrite Family A's child UUID under Family B's session -> Denied by RLS/trigger
    const directCrossChildOverwrite = await clientB.from('children').upsert({
      id: childAUuid,
      family_id: familyBUuid,
      name: 'اختراق طفل أسرة أخرى',
      gender: 'boy',
      age_stage: 'EARLY_CHILDHOOD',
    });
    assert.equal(directCrossChildOverwrite.error?.code, '42501');
    assert.equal(dbChildren.get(childAUuid)?.family_id, familyAUuid);

    // 5. User inserts/upserts own profile -> Allowed
    const ownProfileUpsert = await clientA.from('users').upsert({
      id: userRowAUuid,
      auth_user_id: authUserAUuid,
      family_id: familyAUuid,
      full_name: 'طارق المنصور المحدث',
      role: 'father',
    });
    assert.equal(ownProfileUpsert.error, null);
    assert.equal(dbUsers.get(userRowAUuid)?.full_name, 'طارق المنصور المحدث');

    // 6. User inserts another user's profile -> Denied
    const SpoofedUserInsert = await clientB.from('users').insert({
      auth_user_id: authUserAUuid,
      family_id: familyBUuid,
      full_name: 'انتحال شخصية',
      role: 'father',
    });
    assert.equal(SpoofedUserInsert.error?.code, '42501');

    // 7. Authorized family UPSERT / update -> Allowed
    const authorizedFamilyUpdate = await ensureSharedFamilyRecordInSupabase(
      {
        familyId: familyAUuid,
        familyName: 'أسرة طارق — القاهرة الجديدة',
        country: 'EG',
        city: 'القاهرة',
        currency: 'EGP',
        activeParent: 'father',
      },
      clientA
    );
    assert.equal(authorizedFamilyUpdate.synced, true);
    assert.equal(dbFamilies.get(familyAUuid)?.family_name, 'أسرة طارق — القاهرة الجديدة');

    const authorizedFamilyUpsert = await clientA.from('families').upsert({
      id: familyAUuid,
      family_name: 'أسرة طارق — التجمع',
      country: 'EG',
      city: 'القاهرة',
      currency: 'EGP',
    });
    assert.equal(authorizedFamilyUpsert.error, null);

    // 8. Unauthorized family UPSERT -> Denied
    const unauthorizedCrossFamilyUpdate = await ensureSharedFamilyRecordInSupabase(
      {
        familyId: familyAUuid,
        familyName: 'استيلاء على أسرة طارق',
      },
      clientB
    );
    assert.equal(unauthorizedCrossFamilyUpdate.synced, false);
    assert.match(unauthorizedCrossFamilyUpdate.error || '', /Cross-family write denied/);

    const unauthorizedNewFamilyUpsert = await clientB.from('families').upsert({
      id: 'cccc1111-2222-4333-8444-555555555599',
      family_name: 'أسرة غير مصرح بإنشائها عبر المتصفح',
      created_by: authUserBUuid,
    });
    assert.equal(unauthorizedNewFamilyUpsert.error?.code, '42501');

    // 9. Anonymous access to private records -> Denied
    const anonFamilies = await anonClient.from('families').select('*');
    assert.equal(anonFamilies.error?.code, '42501');
    const anonUsers = await anonClient.from('users').select('*');
    assert.equal(anonUsers.error?.code, '42501');
    const anonChildren = await anonClient.from('children').select('*');
    assert.equal(anonChildren.error?.code, '42501');
    const anonChildrenViaService = await fetchChildrenFromSupabase(familyAUuid, anonClient);
    assert.equal(anonChildrenViaService.data.length, 0);
    assert.ok(anonChildrenViaService.error);

    // 10. User changes family ownership identifiers (`id`, `auth_user_id`, `family_id`, `created_by`) -> Denied
    const mutateUserFamilyId = await clientA
      .from('users')
      .update({ family_id: familyBUuid })
      .eq('id', userRowAUuid);
    assert.equal(mutateUserFamilyId.error?.code, '42501');
    assert.equal(dbUsers.get(userRowAUuid)?.family_id, familyAUuid);

    const mutateUserAuthId = await clientA
      .from('users')
      .update({ auth_user_id: authUserBUuid })
      .eq('id', userRowAUuid);
    assert.equal(mutateUserAuthId.error?.code, '42501');
    assert.equal(dbUsers.get(userRowAUuid)?.auth_user_id, authUserAUuid);

    const mutateChildFamilyId = await clientA
      .from('children')
      .update({ family_id: familyBUuid })
      .eq('id', childAUuid);
    assert.equal(mutateChildFamilyId.error?.code, '42501');
    assert.equal(dbChildren.get(childAUuid)?.family_id, familyAUuid);

    const mutateFamilyCreatedBy = await clientA
      .from('families')
      .update({ created_by: authUserBUuid })
      .eq('id', familyAUuid);
    assert.equal(mutateFamilyCreatedBy.error?.code, '42501');
    assert.equal(dbFamilies.get(familyAUuid)?.created_by, authUserAUuid);
  });

  it('18. Phase 3 Private Storage Isolation: allows verified family media upload/signed-url/delete and blocks cross-family or traversal access', async () => {
    const familyAUuid = 'aaaa1111-2222-4333-8444-555555555501';
    const familyBUuid = 'bbbb1111-2222-4333-8444-555555555502';
    const authUserAUuid = 'aaaa2222-2222-4333-8444-555555555501';
    const authUserBUuid = 'bbbb2222-2222-4333-8444-555555555502';

    const storedObjects = new Map<string, { owner: string; familyFolder: string; contentType: string }>();

    const makeStorageClient = (
      sessionAuthUid: string | null,
      verifiedFamilyId: string | null
    ): SupabaseClient => {
      return {
        auth: {
          async getSession() {
            if (!sessionAuthUid) return { data: { session: null }, error: null };
            return {
              data: {
                session: {
                  access_token: `jwt_${sessionAuthUid}`,
                  user: {
                    id: sessionAuthUid,
                    email: 'parent@nekbaar.app',
                    email_confirmed_at: '2026-10-31T00:00:00Z',
                  },
                },
              },
              error: null,
            };
          },
        },
        from(table: string) {
          if (table === 'users') {
            return {
              select() {
                const chain = {
                  eq() {
                    return chain;
                  },
                  async limit() {
                    if (!sessionAuthUid || !verifiedFamilyId) {
                      return { data: [], error: null };
                    }
                    return {
                      data: [
                        {
                          id: '11111111-2222-4333-8444-555555555500',
                          auth_user_id: sessionAuthUid,
                          family_id: verifiedFamilyId,
                          full_name: 'والد موثق',
                          role: 'father',
                        },
                      ],
                      error: null,
                    };
                  },
                };
                return chain;
              },
            };
          }
          throw new Error(`Unexpected table ${table}`);
        },
        storage: {
          from(bucketId: string) {
            return {
              async upload(path: string, _body: unknown, opts?: { contentType?: string }) {
                const folder = path.split('/')[0] || '';
                if (
                  bucketId !== 'family-media' ||
                  !sessionAuthUid ||
                  !verifiedFamilyId ||
                  folder !== verifiedFamilyId
                ) {
                  return {
                    data: null,
                    error: { message: 'new row violates row-level security policy for table "objects"' },
                  };
                }
                storedObjects.set(path, {
                  owner: sessionAuthUid,
                  familyFolder: folder,
                  contentType: opts?.contentType || 'application/octet-stream',
                });
                return { data: { path }, error: null };
              },
              async createSignedUrl(path: string, expiresIn: number) {
                const folder = path.split('/')[0] || '';
                if (
                  bucketId !== 'family-media' ||
                  !sessionAuthUid ||
                  !verifiedFamilyId ||
                  folder !== verifiedFamilyId ||
                  !storedObjects.has(path)
                ) {
                  return {
                    data: null,
                    error: { message: 'Object not found or access denied by storage RLS policy' },
                  };
                }
                return {
                  data: {
                    signedUrl: `https://qbwnzunusmaidciakuod.supabase.co/storage/v1/object/sign/family-media/${path}?token=signed_${expiresIn}`,
                  },
                  error: null,
                };
              },
              async remove(paths: string[]) {
                for (const p of paths) {
                  const folder = p.split('/')[0] || '';
                  if (
                    bucketId !== 'family-media' ||
                    !sessionAuthUid ||
                    !verifiedFamilyId ||
                    folder !== verifiedFamilyId
                  ) {
                    return {
                      data: null,
                      error: { message: 'Delete denied by storage.objects RLS policy' },
                    };
                  }
                  storedObjects.delete(p);
                }
                return { data: paths, error: null };
              },
            };
          },
        },
      } as unknown as SupabaseClient;
    };

    const storageClientA = makeStorageClient(authUserAUuid, familyAUuid);
    const storageClientB = makeStorageClient(authUserBUuid, familyBUuid);
    const anonStorageClient = makeStorageClient(null, null);

    // Path validation unit checks
    assert.equal(
      validateFamilyStorageObjectPath(`${familyAUuid}/memories/photo1.jpg`, familyAUuid).valid,
      true
    );
    assert.equal(
      validateFamilyStorageObjectPath(`${familyAUuid}/../${familyBUuid}/photo1.jpg`, familyAUuid).valid,
      false,
      'Path traversal must be rejected'
    );
    assert.equal(
      validateFamilyStorageObjectPath(`${familyBUuid}/memories/photo1.jpg`, familyAUuid).valid,
      false,
      'Cross-family folder prefix must be rejected'
    );

    // 1. Authorized Family A uploads private media -> Allowed
    const filePayload = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
    const uploadARes = await uploadFamilyPrivateMediaToStorage(
      {
        objectPath: `${familyAUuid}/child-1/memory.png`,
        fileBody: filePayload,
        contentType: 'image/png',
      },
      storageClientA
    );
    assert.equal(uploadARes.uploaded, true);
    assert.equal(uploadARes.path, `${familyAUuid}/child-1/memory.png`);

    // 2. Authorized Family A creates signed URL for its own private media -> Allowed
    const signedUrlARes = await createFamilyPrivateMediaSignedUrl(
      {
        objectPath: `${familyAUuid}/child-1/memory.png`,
        expiresInSeconds: 1800,
      },
      storageClientA
    );
    assert.equal(signedUrlARes.error, null);
    assert.ok(signedUrlARes.signedUrl?.includes('/storage/v1/object/sign/family-media/'));

    // 3. Unrelated Family B attempts to read/sign Family A's private media -> Denied
    const crossFamilyReadRes = await createFamilyPrivateMediaSignedUrl(
      {
        objectPath: `${familyAUuid}/child-1/memory.png`,
      },
      storageClientB
    );
    assert.equal(crossFamilyReadRes.signedUrl, null);
    assert.match(crossFamilyReadRes.error || '', /Cross-family storage access denied/);

    // 4. Unrelated Family B attempts to upload into Family A's folder -> Denied
    const crossFamilyUploadRes = await uploadFamilyPrivateMediaToStorage(
      {
        objectPath: `${familyAUuid}/child-1/injected.png`,
        fileBody: filePayload,
        contentType: 'image/png',
      },
      storageClientB
    );
    assert.equal(crossFamilyUploadRes.uploaded, false);
    assert.match(crossFamilyUploadRes.error || '', /Cross-family storage access denied/);

    // 5. Unrelated Family B attempts to delete Family A's private media -> Denied
    const crossFamilyDeleteRes = await deleteFamilyPrivateMediaFromStorage(
      `${familyAUuid}/child-1/memory.png`,
      storageClientB
    );
    assert.equal(crossFamilyDeleteRes.deleted, false);
    assert.match(crossFamilyDeleteRes.error || '', /Cross-family storage access denied/);
    assert.equal(storedObjects.has(`${familyAUuid}/child-1/memory.png`), true);

    // 6. Anonymous user attempts to read Family A's private media -> Denied
    const anonReadRes = await createFamilyPrivateMediaSignedUrl(
      {
        objectPath: `${familyAUuid}/child-1/memory.png`,
      },
      anonStorageClient
    );
    assert.equal(anonReadRes.signedUrl, null);
    assert.ok(anonReadRes.error);

    // 7. Authorized Family A deletes its own private media -> Allowed
    const deleteARes = await deleteFamilyPrivateMediaFromStorage(
      `${familyAUuid}/child-1/memory.png`,
      storageClientA
    );
    assert.equal(deleteARes.deleted, true);
    assert.equal(storedObjects.has(`${familyAUuid}/child-1/memory.png`), false);
  });

  it('19. Phase 3 Co-Parent Invitation & Catalog Write Lockdown: validates invitation acceptance for unlinked and empty-bootstrap accounts, blocks non-empty family merges, rejects expired/replayed/spoofed tokens, and denies client catalog_items writes', async () => {
    const familyAUuid = '10101010-2020-4303-8404-505050505001';
    const emptyBootstrapFamUuid = '20202020-3030-4404-8505-606060606002';
    const nonEmptyFamUuid = '30303030-4040-4505-8606-707070707003';

    const fatherAuthUuid = 'aaaa0001-0000-4000-8000-000000000001';
    const fatherProfileUuid = 'aaaa0002-0000-4000-8000-000000000002';

    const unlinkedMotherAuthUuid = 'bbbb0001-0000-4000-8000-000000000001';
    const unlinkedMotherProfileUuid = 'bbbb0002-0000-4000-8000-000000000002';

    const emptyFamMotherAuthUuid = 'cccc0001-0000-4000-8000-000000000001';
    const emptyFamMotherProfileUuid = 'cccc0002-0000-4000-8000-000000000002';

    const nonEmptyMotherAuthUuid = 'dddd0001-0000-4000-8000-000000000001';
    const nonEmptyMotherProfileUuid = 'dddd0002-0000-4000-8000-000000000002';

    const validToken1 = 'NKB-' + 'A1'.repeat(24);
    const validToken2 = 'NKB-' + 'B2'.repeat(24);
    const expiredToken = 'NKB-' + 'C3'.repeat(24);
    const nonEmptyFamToken = 'NKB-' + 'D4'.repeat(24);

    const hash1 = await hashFamilyPairingToken(validToken1);
    const hash2 = await hashFamilyPairingToken(validToken2);
    const hashExpired = await hashFamilyPairingToken(expiredToken);
    const hashNonEmpty = await hashFamilyPairingToken(nonEmptyFamToken);

    const dbUsers = new Map<string, Record<string, unknown>>([
      [
        fatherProfileUuid,
        {
          id: fatherProfileUuid,
          auth_user_id: fatherAuthUuid,
          family_id: familyAUuid,
          full_name: 'طارق المنصور',
          role: 'father',
          email: 'tarek@nekbaar.app',
          phone: '+201011112222',
        },
      ],
      [
        unlinkedMotherProfileUuid,
        {
          id: unlinkedMotherProfileUuid,
          auth_user_id: unlinkedMotherAuthUuid,
          family_id: null,
          full_name: 'مريم الشافعي',
          role: 'mother',
          email: 'mariam@nekbaar.app',
          phone: '+201033334444',
        },
      ],
      [
        emptyFamMotherProfileUuid,
        {
          id: emptyFamMotherProfileUuid,
          auth_user_id: emptyFamMotherAuthUuid,
          family_id: emptyBootstrapFamUuid,
          full_name: 'ندى العتيبي',
          role: 'mother',
          email: 'nada@nekbaar.app',
          phone: '+966551112233',
        },
      ],
      [
        nonEmptyMotherProfileUuid,
        {
          id: nonEmptyMotherProfileUuid,
          auth_user_id: nonEmptyMotherAuthUuid,
          family_id: nonEmptyFamUuid,
          full_name: 'سارة محمود',
          role: 'mother',
          email: 'sara@nekbaar.app',
          phone: '+201099998888',
        },
      ],
    ]);

    const dbAuthUsers = new Map<
      string,
      { id: string; email: string; phone: string; email_confirmed_at: string | null; phone_confirmed_at: string | null }
    >([
      [
        fatherAuthUuid,
        {
          id: fatherAuthUuid,
          email: 'tarek@nekbaar.app',
          phone: '+201011112222',
          email_confirmed_at: '2026-10-31T00:00:00Z',
          phone_confirmed_at: '2026-10-31T00:00:00Z',
        },
      ],
      [
        unlinkedMotherAuthUuid,
        {
          id: unlinkedMotherAuthUuid,
          email: 'mariam@nekbaar.app',
          phone: '+201033334444',
          email_confirmed_at: '2026-10-31T00:00:00Z',
          phone_confirmed_at: null,
        },
      ],
      [
        emptyFamMotherAuthUuid,
        {
          id: emptyFamMotherAuthUuid,
          email: 'nada@nekbaar.app',
          phone: '+966551112233',
          email_confirmed_at: '2026-10-31T00:00:00Z',
          phone_confirmed_at: '2026-10-31T00:00:00Z',
        },
      ],
      [
        nonEmptyMotherAuthUuid,
        {
          id: nonEmptyMotherAuthUuid,
          email: 'sara@nekbaar.app',
          phone: '+201099998888',
          email_confirmed_at: '2026-10-31T00:00:00Z',
          phone_confirmed_at: null,
        },
      ],
    ]);

    const dbChildren = new Map<string, { id: string; family_id: string }>([
      [
        'child-non-empty-1',
        { id: 'child-non-empty-1', family_id: nonEmptyFamUuid },
      ],
    ]);

    const dbPairings = new Map<string, Record<string, unknown>>([
      [
        hash1,
        {
          id: 'pair-1',
          family_id: familyAUuid,
          invited_by_user_id: fatherProfileUuid,
          partner_user_id: null,
          partner_name: 'مريم الشافعي',
          partner_phone: '+201033334444',
          partner_email: 'mariam@nekbaar.app',
          partner_role: 'mother',
          pairing_method: 'phone_otp',
          pairing_token_hash: hash1,
          status: 'pending',
          verified: false,
          expires_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
          accepted_at: null,
        },
      ],
      [
        hash2,
        {
          id: 'pair-2',
          family_id: familyAUuid,
          invited_by_user_id: fatherProfileUuid,
          partner_user_id: null,
          partner_name: 'ندى العتيبي',
          partner_phone: '+966551112233',
          partner_email: 'nada@nekbaar.app',
          partner_role: 'mother',
          pairing_method: 'phone_otp',
          pairing_token_hash: hash2,
          status: 'pending',
          verified: false,
          expires_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
          accepted_at: null,
        },
      ],
      [
        hashExpired,
        {
          id: 'pair-expired',
          family_id: familyAUuid,
          invited_by_user_id: fatherProfileUuid,
          partner_user_id: null,
          partner_name: 'ندى العتيبي',
          partner_phone: '+966551112233',
          partner_email: 'nada@nekbaar.app',
          partner_role: 'mother',
          pairing_method: 'phone_otp',
          pairing_token_hash: hashExpired,
          status: 'pending',
          verified: false,
          expires_at: new Date(Date.now() - 3600 * 1000).toISOString(),
          accepted_at: null,
        },
      ],
      [
        hashNonEmpty,
        {
          id: 'pair-non-empty',
          family_id: familyAUuid,
          invited_by_user_id: fatherProfileUuid,
          partner_user_id: null,
          partner_name: 'سارة محمود',
          partner_phone: '+201099998888',
          partner_email: 'sara@nekbaar.app',
          partner_role: 'mother',
          pairing_method: 'phone_otp',
          pairing_token_hash: hashNonEmpty,
          status: 'pending',
          verified: false,
          expires_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
          accepted_at: null,
        },
      ],
    ]);

    const makeInvitationAndCatalogClient = (sessionAuthUid: string | null): SupabaseClient => {
      return {
        auth: {
          async getSession() {
            if (!sessionAuthUid) return { data: { session: null }, error: null };
            const au = dbAuthUsers.get(sessionAuthUid);
            return {
              data: {
                session: {
                  access_token: `jwt_${sessionAuthUid}`,
                  user: au || { id: sessionAuthUid },
                },
              },
              error: null,
            };
          },
        },
        from(tableName: string) {
          return {
            select() {
              return Promise.resolve({
                data: tableName === 'catalog_items' ? [{ id: 'cat-1', title: 'لعبة خشبية', price: 250 }] : [],
                error: null,
              });
            },
            insert() {
              if (tableName === 'catalog_items') {
                return Promise.resolve({
                  data: null,
                  error: {
                    message: 'permission denied for table catalog_items',
                    code: '42501',
                  },
                });
              }
              return Promise.resolve({ data: null, error: { message: 'denied', code: '42501' } });
            },
            update() {
              const chain = {
                eq() {
                  return chain;
                },
                then(
                  onFulfilled?: (v: { data: null; error: { message: string; code: string } }) => unknown
                ) {
                  const err =
                    tableName === 'catalog_items'
                      ? { message: 'permission denied for table catalog_items', code: '42501' }
                      : {
                          message:
                            'IMMUTABLE_OWNERSHIP_VIOLATION: users.family_id cannot be reassigned once linked',
                          code: '42501',
                        };
                  return Promise.resolve({ data: null, error: err }).then(onFulfilled);
                },
              };
              return chain;
            },
            delete() {
              const chain = {
                eq() {
                  return chain;
                },
                then(
                  onFulfilled?: (v: { data: null; error: { message: string; code: string } }) => unknown
                ) {
                  return Promise.resolve({
                    data: null,
                    error: { message: `permission denied for table ${tableName}`, code: '42501' },
                  }).then(onFulfilled);
                },
              };
              return chain;
            },
          };
        },
        async rpc(fnName: string, args: { p_token_hash?: string }) {
          if (fnName !== 'accept_family_invitation') {
            return { data: null, error: { message: 'RPC not found' } };
          }
          if (!sessionAuthUid) {
            return { data: null, error: { message: 'AUTH_REQUIRED: Sign in before accepting a family invitation.' } };
          }
          const tokenHash = args.p_token_hash || '';
          const inv = dbPairings.get(tokenHash);
          if (
            !inv ||
            inv.status !== 'pending' ||
            inv.verified === true ||
            inv.partner_user_id !== null ||
            new Date(String(inv.expires_at)).getTime() <= Date.now()
          ) {
            return {
              data: null,
              error: { message: 'INVITATION_EXPIRED: This invitation is invalid, expired, or already used.' },
            };
          }

          const authUser = dbAuthUsers.get(sessionAuthUid);
          if (!authUser) {
            return { data: null, error: { message: 'AUTH_REQUIRED' } };
          }

          const emailMatches =
            Boolean(inv.partner_email) &&
            Boolean(authUser.email_confirmed_at) &&
            authUser.email.toLowerCase() === String(inv.partner_email).toLowerCase();
          const phoneMatches =
            Boolean(inv.partner_phone) &&
            Boolean(authUser.phone_confirmed_at) &&
            authUser.phone.replace(/\D/g, '') === String(inv.partner_phone).replace(/\D/g, '');

          if (!emailMatches && !phoneMatches) {
            return {
              data: null,
              error: {
                message:
                  'INVITATION_IDENTITY_MISMATCH: Sign in with the exact verified email or phone number that received this invitation.',
              },
            };
          }

          let profile: Record<string, unknown> | undefined;
          for (const u of dbUsers.values()) {
            if (u.auth_user_id === sessionAuthUid) {
              profile = u;
              break;
            }
          }
          if (!profile) {
            return { data: null, error: { message: 'PROFILE_REQUIRED' } };
          }

          if (profile.id === inv.invited_by_user_id) {
            return { data: null, error: { message: 'SELF_INVITATION: You cannot accept your own invitation.' } };
          }

          if (String(profile.role).toLowerCase() !== String(inv.partner_role).toLowerCase()) {
            return { data: null, error: { message: 'ROLE_MISMATCH' } };
          }

          // Check if target family already has a user for partner_role
          for (const u of dbUsers.values()) {
            if (
              u.family_id === inv.family_id &&
              String(u.role).toLowerCase() === String(inv.partner_role).toLowerCase() &&
              u.id !== profile.id
            ) {
              return {
                data: null,
                error: { message: 'PARENT_ALREADY_LINKED: This family already has a verified account for that parent role.' },
              };
            }
          }

          // Check if invitee's current family has existing children or other members
          if (profile.family_id && profile.family_id !== inv.family_id) {
            const hasChildren = Array.from(dbChildren.values()).some(
              (c) => c.family_id === profile!.family_id
            );
            if (hasChildren) {
              return {
                data: null,
                error: {
                  message:
                    'FAMILY_DATA_EXISTS: This account already has family or child data. A safe data merge is required before linking.',
                },
              };
            }
          }

          // Scoped server-side transition succeeds
          profile.family_id = inv.family_id;
          inv.status = 'accepted';
          inv.verified = true;
          inv.partner_user_id = profile.id;
          inv.accepted_at = new Date().toISOString();

          return {
            data: {
              accepted: true,
              family_id: inv.family_id,
              profile_user_id: profile.id,
              inviter_user_id: inv.invited_by_user_id,
            },
            error: null,
          };
        },
      } as unknown as SupabaseClient;
    };

    const fatherClient = makeInvitationAndCatalogClient(fatherAuthUuid);
    const unlinkedMotherClient = makeInvitationAndCatalogClient(unlinkedMotherAuthUuid);
    const emptyFamMotherClient = makeInvitationAndCatalogClient(emptyFamMotherAuthUuid);
    const nonEmptyMotherClient = makeInvitationAndCatalogClient(nonEmptyMotherAuthUuid);
    const anonClient = makeInvitationAndCatalogClient(null);

    // 1. Expired invitation -> Denied
    const expiredRes = await acceptFamilyInvitation(expiredToken, emptyFamMotherClient);
    assert.equal(expiredRes.accepted, false);
    assert.match(expiredRes.error || '', /INVITATION_EXPIRED/);

    // 2. Identity mismatch (Mother A tries to accept Mother B's token) -> Denied
    const mismatchRes = await acceptFamilyInvitation(validToken2, unlinkedMotherClient);
    assert.equal(mismatchRes.accepted, false);
    assert.match(mismatchRes.error || '', /INVITATION_IDENTITY_MISMATCH/);

    // 3. Non-empty family account tries to accept invitation -> Denied (FAMILY_DATA_EXISTS)
    const nonEmptyRes = await acceptFamilyInvitation(nonEmptyFamToken, nonEmptyMotherClient);
    assert.equal(nonEmptyRes.accepted, false);
    assert.match(nonEmptyRes.error || '', /FAMILY_DATA_EXISTS/);
    assert.equal(dbUsers.get(nonEmptyMotherProfileUuid)?.family_id, nonEmptyFamUuid);

    // 4. Direct client UPDATE attempting to change family_id on empty-bootstrap account -> Denied by ownership trigger
    const directTransferAttempt = await emptyFamMotherClient
      .from('users')
      .update({ family_id: familyAUuid })
      .eq('id', emptyFamMotherProfileUuid);
    assert.equal(directTransferAttempt.error?.code, '42501');

    // 5. Empty-bootstrap-family account accepts valid invitation via trusted RPC -> Allowed!
    const validEmptyFamRes = await acceptFamilyInvitation(validToken2, emptyFamMotherClient);
    assert.equal(validEmptyFamRes.accepted, true);
    assert.equal(validEmptyFamRes.familyId, familyAUuid);
    assert.equal(dbUsers.get(emptyFamMotherProfileUuid)?.family_id, familyAUuid);

    // 6. Replayed invitation (re-submitting validToken2 after acceptance) -> Denied!
    const replayRes = await acceptFamilyInvitation(validToken2, emptyFamMotherClient);
    assert.equal(replayRes.accepted, false);
    assert.match(replayRes.error || '', /INVITATION_EXPIRED/);

    // 7. Reset familyAUuid mother slot to test unlinked account (`family_id === null`) acceptance -> Allowed!
    dbUsers.get(emptyFamMotherProfileUuid)!.family_id = emptyBootstrapFamUuid;
    const unlinkedAcceptRes = await acceptFamilyInvitation(validToken1, unlinkedMotherClient);
    assert.equal(unlinkedAcceptRes.accepted, true);
    assert.equal(unlinkedAcceptRes.familyId, familyAUuid);
    assert.equal(dbUsers.get(unlinkedMotherProfileUuid)?.family_id, familyAUuid);

    // 8. Catalog Items: public SELECT allowed, browser client INSERT/UPDATE/DELETE denied (42501)
    const anonCatalogSelect = await anonClient.from('catalog_items').select('*');
    assert.equal(anonCatalogSelect.error, null);
    assert.equal(Array.isArray(anonCatalogSelect.data), true);

    const anonCatalogInsert = await anonClient.from('catalog_items').insert({ title: 'hack' });
    assert.equal(anonCatalogInsert.error?.code, '42501');

    const authCatalogInsert = await fatherClient.from('catalog_items').insert({
      title: 'unauthorized client product',
      family_id: familyAUuid,
    });
    assert.equal(authCatalogInsert.error?.code, '42501');

    const authCatalogUpdate = await fatherClient
      .from('catalog_items')
      .update({ price: 1 })
      .eq('id', 'cat-1');
    assert.equal(authCatalogUpdate.error?.code, '42501');

    const authCatalogDelete = await fatherClient
      .from('catalog_items')
      .delete()
      .eq('id', 'cat-1');
    assert.equal(authCatalogDelete.error?.code, '42501');
  });

  it('20. Stabilization & Pre-Upgrade Readiness: verifies CompactPortalDropdown for Country/City without resizing registration card, preserves official slogan, and confirms SectionToolsDrawer deduplication across Community, Store, and Children', async () => {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');

    const onboardingSrc = await fs.readFile(
      path.resolve(process.cwd(), 'src/components/OnboardingFlowModal.tsx'),
      'utf8'
    );
    const communitySrc = await fs.readFile(
      path.resolve(process.cwd(), 'src/components/ParentsCommunitySection.tsx'),
      'utf8'
    );
    const storeSrc = await fs.readFile(
      path.resolve(process.cwd(), 'src/components/CommercialEcosystemSection.tsx'),
      'utf8'
    );
    const childrenSrc = await fs.readFile(
      path.resolve(process.cwd(), 'src/features/ChildrenProfilesSection.tsx'),
      'utf8'
    );

    // 1. Registration card dimensions, 42px field height, official slogan, and portal dropdowns
    assert.ok(onboardingSrc.includes('max-w-[430px]'), 'Registration card width must remain 430px');
    assert.ok(
      onboardingSrc.includes('grid-cols-[1fr_1fr_auto_auto] gap-1.5 items-center'),
      'Country/City two-column + GPS/Manual grid row must remain intact'
    );
    assert.ok(
      onboardingSrc.includes('min-h-[42px] h-[42px]'),
      'Country/City trigger controls must preserve 42px height'
    );
    assert.ok(
      onboardingSrc.includes('createPortal('),
      'Country and City dropdowns must render listbox via createPortal to avoid overflow clipping'
    );
    assert.ok(
      onboardingSrc.includes('break-words whitespace-normal'),
      'Opened portal menu must wrap long option labels cleanly'
    );
    assert.ok(
      onboardingSrc.includes('role="combobox"') &&
        onboardingSrc.includes('role="listbox"') &&
        onboardingSrc.includes('role="option"'),
      'Portal dropdown must provide combobox/listbox/option ARIA semantics'
    );
    assert.ok(
      onboardingSrc.includes('مساحة تجمعنا.. وبحبهم نكبر'),
      'Official Arabic slogan must remain intact'
    );

    // 2. SectionToolsDrawer deduplication across Community, Store, and Children
    assert.ok(
      communitySrc.includes('sectionId="community"'),
      'Community section must render SectionToolsDrawer'
    );
    assert.equal(
      communitySrc.includes('id="community-topic-filter-card"'),
      false,
      'Duplicated inline community topic/search/create-post card must be removed'
    );

    assert.ok(
      storeSrc.includes('sectionId="store"'),
      'Store section must render SectionToolsDrawer'
    );
    assert.equal(
      storeSrc.includes('id="store-category-filter-btn"'),
      false,
      'Duplicated inline store filter button must be removed'
    );

    assert.ok(
      childrenSrc.includes('sectionId="children"'),
      'Children Profiles section must render SectionToolsDrawer'
    );
  });
});








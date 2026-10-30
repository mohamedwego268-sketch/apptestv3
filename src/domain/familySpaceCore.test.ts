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
  deleteChildFromSupabase,
  ensureSharedFamilyRecordInSupabase,
  fetchChildrenFromSupabase,
  fetchFamilySpaceFromSupabase,
  fetchUsersFromSupabase,
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
});




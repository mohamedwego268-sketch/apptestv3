import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  COMMERCIAL_CATALOG,
  ChildProfile,
  CommercialCatalogItem,
  DEFAULT_SEED,
  FamilySpaceState,
  calculateChildAge,
} from '../domain/familySpaceCore';
import {
  SHARED_FAMILY_ID,
  SUPABASE_TABLES,
  ensureSharedFamilyRecordInSupabase,
  fetchFamilySpaceFromSupabase,
  isCanonicalThreeDemoKids,
  isDefaultDemoSeedState,
  isValidUuid,
  resolveVerifiedFamilyContext,
  supabaseClient,
  syncFamilySpaceToSupabase,
  withSupabaseTimeout,
} from './supabaseService';

/**
 * ============================================================================
 * 1. AUTONOMOUS LIFECYCLE STATE MACHINE & TYPES
 * ============================================================================
 */
export type MasterLifecycleState =
  | 'Initializing'
  | 'Synced'
  | 'Offline-Fallback'
  | 'Error-Recovery';

export interface RetryTelemetry {
  attempt: number;
  maxAttempts: number;
  lastError: string | null;
  nextRetryDelayMs: number | null;
  recoveredCount: number;
  lastSyncedAt: string | null;
}

/**
 * ============================================================================
 * 2. BATTERY DIAGNOSTICS ENGINE TYPES (FAMILY & CHILD WELLNESS SCORES)
 * ============================================================================
 */
export interface ChildBatteryDiagnostic {
  id: string;
  familyId: number;
  childId: number;
  childRemoteId?: string | number;
  childName: string;
  ageStage: string;
  overallScore: number; // 0 - 100
  sleepScore: number; // 0 - 100
  nutritionScore: number; // 0 - 100
  moodScore: number; // 0 - 100
  routineCompletionScore: number; // 0 - 100
  statusLevel: 'optimal' | 'balanced' | 'needs-recharge';
  recommendationAr: string;
  recommendationEn: string;
  updatedAt: string;
}

export interface FamilyBatterySummary {
  familyId: number;
  familyAverageScore: number;
  parentAhmadBattery: number;
  parentMaryamBattery: number;
  childrenDiagnostics: Record<number, ChildBatteryDiagnostic>;
  historySnapshots: Array<{
    timestamp: string;
    familyAverageScore: number;
    childScores: Record<number, number>;
  }>;
  updatedAt: string;
}

export interface SaveDiagnosticAssessmentPayload {
  /** Select `'family'` for household-wide assessment or `1` (Hamza), `2` (Laila), `3` (Youssef) */
  scope: 'family' | number;
  childId?: number | null;
  sleepScore?: number;
  nutritionScore?: number;
  moodScore?: number;
  routineCompletionScore?: number;
  parentAhmadBattery?: number;
  parentMaryamBattery?: number;
  notes?: string;
}

/**
 * ============================================================================
 * 3. AI BEDTIME STORIES ENGINE TYPES (AUTOMATED GENERATION & CHILD LIBRARY)
 * ============================================================================
 */
export interface BedtimeStoryRecord {
  id: string;
  sequenceCode: string;
  familyId: number;
  childId: number;
  childRemoteId?: string | number;
  childName: string;
  ageStage: string;
  titleAr: string;
  titleEn: string;
  storyBodyAr: string;
  storyBodyEn: string;
  moralTagAr: string;
  moralTagEn: string;
  calmingTempoBpm: number;
  durationMinutes: number;
  tags: string[];
  createdAt: string;
}

export interface GenerateBedtimeStoryRequest {
  childId: number;
  childName: string;
  childNameEn?: string;
  childBirth?: string;
  childRemoteId?: string | number;
  themePrompt?: string;
  moralFocus?: string;
  moralFocusAr?: string;
  moralFocusEn?: string;
  storyBodyAr?: string;
  storyBodyEn?: string;
}

/**
 * ============================================================================
 * 4. CATALOG & SEQUENCE ENGINE TYPES (`PRD-XXXX`)
 * ============================================================================
 */
export interface SequencedCatalogItem extends CommercialCatalogItem {
  /** Auto-generated sequence code in format `PRD-XXXX` */
  sequenceCode: string;
  familyId: number;
}

/**
 * ============================================================================
 * 5. MASTER CONTROLLER SNAPSHOT & PUBLIC API
 * ============================================================================
 */
export interface MasterControllerSnapshot {
  lifecycleState: MasterLifecycleState;
  isOnline: boolean;
  familyId: number;
  retryTelemetry: RetryTelemetry;
  batterySummary: FamilyBatterySummary;
  storiesByChild: Record<number, BedtimeStoryRecord[]>;
  allStories: BedtimeStoryRecord[];
  sequencedCatalog: SequencedCatalogItem[];
  catalogSource: 'demo' | 'remote' | 'empty' | 'offline';
  pendingOutboxCount: number;
}

export interface MasterControllerAPI {
  getSnapshot: () => MasterControllerSnapshot;
  subscribe: (listener: (snapshot: MasterControllerSnapshot) => void) => () => void;
  recomputeBatteryDiagnostics: (state?: FamilySpaceState) => Promise<FamilyBatterySummary>;
  saveDiagnosticAssessment: (
    payload: SaveDiagnosticAssessmentPayload
  ) => Promise<FamilyBatterySummary>;
  recordChildWellnessBoost: (
    childId: number,
    pillar: 'sleep' | 'nutrition' | 'mood' | 'routine',
    delta?: number
  ) => Promise<ChildBatteryDiagnostic>;
  generateBedtimeStoryForChild: (
    req: GenerateBedtimeStoryRequest
  ) => Promise<BedtimeStoryRecord>;
  getStoriesForChild: (childId: number) => BedtimeStoryRecord[];
  refreshCatalogWithSequences: () => Promise<SequencedCatalogItem[]>;
  allocateNextProductSequenceCode: (numericSeed?: number) => string;
  forceSyncNow: (appState?: FamilySpaceState) => Promise<boolean>;
}

declare global {
  interface Window {
    nekbaarMaster?: MasterControllerAPI;
  }
}

const MASTER_CACHE_STORAGE_KEY = 'nekbaar_master_autonomous_cache_v1';

interface PersistedMasterCache {
  batterySummary: FamilyBatterySummary;
  allStories: BedtimeStoryRecord[];
  sequencedCatalog: SequencedCatalogItem[];
  catalogSource?: 'demo' | 'remote' | 'empty' | 'offline';
  sequenceCounter: number;
  pendingOutbox: Array<{
    id: string;
    type: 'battery' | 'story' | 'state';
    payload: unknown;
    createdAt: string;
  }>;
  lastSyncedAt: string | null;
}

/**
 * Formats a deterministic `PRD-XXXX` sequence code.
 */
export function formatProductSequenceCode(indexOrId: number): string {
  const normalized = Math.max(1, Math.abs(Math.floor(indexOrId)));
  const seqNum = normalized < 1000 ? 1000 + normalized : normalized;
  return `PRD-${String(seqNum).padStart(4, '0')}`;
}

/**
 * Builds initial canonical bedtime stories library for Hamza (6m), Laila (4y), and Youssef (8y).
 */
const DEMO_STORY_IDS = new Set(['story-hamza-1', 'story-laila-1', 'story-youssef-1']);

/**
 * Computes initial canonical battery diagnostics for Hamza (6m), Laila (4y), and Youssef (8y).
 */
function buildBatteryDiagnosticsFromState(
  kids: ChildProfile[],
  tasksCompletedRatio: number = 0.75,
  existingOverrides?: Record<number, Partial<ChildBatteryDiagnostic>>
): FamilyBatterySummary {
  const nowIso = new Date().toISOString();
  const sourceKids = kids.length > 0 ? kids : DEFAULT_SEED.kids;
  const diagnosticsMap: Record<number, ChildBatteryDiagnostic> = {};

  sourceKids.forEach((kid, idx) => {
    const ageInfo = calculateChildAge(kid.birth, 'ar');
    const prev = existingOverrides?.[kid.id];
    const baseSleep = idx === 0 ? 92 : idx === 1 ? 88 : 85;
    const baseNutrition = idx === 0 ? 94 : idx === 1 ? 86 : 89;
    const baseMood = idx === 0 ? 95 : idx === 1 ? 91 : 90;
    const baseRoutine = Math.min(100, Math.max(68, Math.round(tasksCompletedRatio * 100)));

    const sleepScore = prev?.sleepScore ?? baseSleep;
    const nutritionScore = prev?.nutritionScore ?? baseNutrition;
    const moodScore = prev?.moodScore ?? baseMood;
    const routineCompletionScore = prev?.routineCompletionScore ?? baseRoutine;

    const overallScore = Math.round(
      sleepScore * 0.3 +
        nutritionScore * 0.25 +
        moodScore * 0.25 +
        routineCompletionScore * 0.2
    );

    const statusLevel: ChildBatteryDiagnostic['statusLevel'] =
      overallScore >= 85
        ? 'optimal'
        : overallScore >= 70
        ? 'balanced'
        : 'needs-recharge';

    const recommendationAr =
      kid.id === 1
        ? `بطارية ${kid.name} ممتازة (${overallScore}%) — وقت البطن والرضاعة المنتظمة يدعمان نموه الحسي.`
        : kid.id === 2
        ? `طاقة ${kid.name} الإبداعية متوازنة (${overallScore}%) — جلسة تلوين هادئة وكوب ماء يجددان نشاطها.`
        : `بطارية البطل ${kid.name} (${overallScore}%) — وجبة خفيفة بعد التمرين ونوم مبكر يرفعان تركيزه غداً.`;

    const recommendationEn =
      kid.id === 1
        ? `${kid.name}'s wellness battery is optimal (${overallScore}%) — tummy time and regular feeds support sensory growth.`
        : kid.id === 2
        ? `${kid.name}'s creative battery is balanced (${overallScore}%) — calm art time and hydration keep her thriving.`
        : `${kid.name}'s champion battery is at ${overallScore}% — a post-sport snack and early sleep boost tomorrow's focus.`;

    diagnosticsMap[kid.id] = {
      id: `diag-${SHARED_FAMILY_ID}-${kid.id}`,
      familyId: SHARED_FAMILY_ID,
      childId: kid.id,
      childName: kid.name,
      ageStage: ageInfo?.stageCode || 'unknown',
      overallScore,
      sleepScore,
      nutritionScore,
      moodScore,
      routineCompletionScore,
      statusLevel,
      recommendationAr,
      recommendationEn,
      updatedAt: nowIso,
    };
  });

  const childValues = Object.values(diagnosticsMap);
  const familyAverageScore =
    childValues.length > 0
      ? Math.round(
          childValues.reduce((acc, item) => acc + item.overallScore, 0) / childValues.length
        )
      : 89;

  return {
    familyId: SHARED_FAMILY_ID,
    familyAverageScore,
    parentAhmadBattery: Math.min(100, Math.max(72, familyAverageScore - 2)),
    parentMaryamBattery: Math.min(100, Math.max(74, familyAverageScore)),
    childrenDiagnostics: diagnosticsMap,
    historySnapshots: [
      {
        timestamp: nowIso,
        familyAverageScore,
        childScores: Object.fromEntries(
          childValues.map((c) => [c.childId, c.overallScore])
        ),
      },
    ],
    updatedAt: nowIso,
  };
}

/**
 * Assigns `PRD-XXXX` sequence codes to all catalog items.
 */
function buildSequencedCatalog(items: CommercialCatalogItem[]): SequencedCatalogItem[] {
  const source = items.length > 0 ? items : COMMERCIAL_CATALOG;
  return source.map((item, idx) => ({
    ...item,
    sequenceCode: formatProductSequenceCode(item.id || idx + 1),
    familyId: SHARED_FAMILY_ID,
  }));
}

/**
 * ============================================================================
 * 6. SELF-CONTAINED AUTONOMOUS MASTER CONTROLLER SINGLETON
 * ============================================================================
 */
export class MasterBackendService implements MasterControllerAPI {
  private lifecycleState: MasterLifecycleState = 'Initializing';
  private isOnline: boolean =
    typeof navigator !== 'undefined' ? navigator.onLine !== false : true;
  private familyId: number = SHARED_FAMILY_ID;
  private retryTelemetry: RetryTelemetry = {
    attempt: 0,
    maxAttempts: 3,
    lastError: null,
    nextRetryDelayMs: null,
    recoveredCount: 0,
    lastSyncedAt: null,
  };
  private batterySummary: FamilyBatterySummary;
  private latestChildren: ChildProfile[] = DEFAULT_SEED.kids;
  private allStories: BedtimeStoryRecord[];
  private sequencedCatalog: SequencedCatalogItem[];
  private catalogSource: 'demo' | 'remote' | 'empty' | 'offline' = 'demo';
  private sequenceCounter: number = 1050;
  private pendingOutbox: PersistedMasterCache['pendingOutbox'] = [];
  private listeners: Set<(snapshot: MasterControllerSnapshot) => void> = new Set();
  private initializedListeners = false;

  constructor() {
    const cached = this.loadLocalCache();
    this.batterySummary =
      cached?.batterySummary || buildBatteryDiagnosticsFromState(DEFAULT_SEED.kids);
    this.allStories = (cached?.allStories || []).filter((story) => !DEMO_STORY_IDS.has(story.id));
    this.catalogSource = cached?.catalogSource ?? 'demo';
    this.sequencedCatalog =
      cached?.sequencedCatalog && cached.sequencedCatalog.length > 0
        ? cached.sequencedCatalog
        : buildSequencedCatalog(COMMERCIAL_CATALOG);
    this.sequenceCounter = cached?.sequenceCounter || 1050;
    this.pendingOutbox = cached?.pendingOutbox || [];
    this.retryTelemetry.lastSyncedAt = cached?.lastSyncedAt || null;

    this.attachAutonomousEnvironmentWatchers();
  }

  private loadLocalCache(): PersistedMasterCache | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = window.localStorage.getItem(MASTER_CACHE_STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as PersistedMasterCache;
    } catch {
      return null;
    }
  }

  private persistLocalCache(): void {
    if (typeof window === 'undefined') return;
    try {
      const payload: PersistedMasterCache = {
        batterySummary: this.batterySummary,
        allStories: this.allStories,
        sequencedCatalog: this.sequencedCatalog,
        catalogSource: this.catalogSource,
        sequenceCounter: this.sequenceCounter,
        pendingOutbox: this.pendingOutbox,
        lastSyncedAt: this.retryTelemetry.lastSyncedAt,
      };
      window.localStorage.setItem(MASTER_CACHE_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore storage quota restrictions safely
    }
  }

  public resetSessionState(): void {
    this.latestChildren = [];
    this.batterySummary = buildBatteryDiagnosticsFromState([]);
    this.allStories = [];
    this.pendingOutbox = [];
    this.retryTelemetry = {
      attempt: 0,
      maxAttempts: 3,
      lastError: null,
      nextRetryDelayMs: null,
      recoveredCount: 0,
      lastSyncedAt: null,
    };
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem(MASTER_CACHE_STORAGE_KEY);
      } catch {
        // Ignore storage restrictions safely
      }
    }
    this.notifyListeners();
  }

  private attachAutonomousEnvironmentWatchers(): void {
    if (typeof window === 'undefined' || typeof window.addEventListener !== 'function' || this.initializedListeners) return;
    this.initializedListeners = true;

    window.addEventListener('online', () => {
      this.isOnline = true;
      this.transitionState('Error-Recovery');
      void this.flushPendingOutboxAndSync();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.transitionState('Offline-Fallback');
    });

    // Expose singleton on window for zero-micromanagement inspection/access
    window.nekbaarMaster = this;
  }

  private transitionState(next: MasterLifecycleState): void {
    this.lifecycleState = next;
    this.persistLocalCache();
    this.notifyListeners();
  }

  private notifyListeners(): void {
    const snap = this.getSnapshot();
    this.listeners.forEach((listener) => {
      try {
        listener(snap);
      } catch {
        // Prevent any subscriber error from breaking the controller loop
      }
    });
  }

  /**
   * Smart Exponential Backoff Executor with Self-Healing State Transitions
   */
  public async executeWithExponentialBackoff<T>(
    taskFn: () => Promise<T>,
    fallbackValue: T,
    maxAttempts: number = 3
  ): Promise<{ value: T; synced: boolean }> {
    if (!this.isOnline || !supabaseClient) {
      this.transitionState('Offline-Fallback');
      return { value: fallbackValue, synced: false };
    }

    const baseDelays = [450, 1100, 2200];

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        this.retryTelemetry.attempt = attempt;
        this.retryTelemetry.maxAttempts = maxAttempts;
        if (attempt > 1) {
          this.transitionState('Error-Recovery');
        }

        const result = await withSupabaseTimeout(taskFn());
        this.retryTelemetry.attempt = 0;
        this.retryTelemetry.lastError = null;
        this.retryTelemetry.nextRetryDelayMs = null;
        this.retryTelemetry.lastSyncedAt = new Date().toISOString();
        if (attempt > 1) {
          this.retryTelemetry.recoveredCount += 1;
        }
        this.transitionState('Synced');
        return { value: result, synced: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Network operation failed';
        this.retryTelemetry.lastError = message;

        if (attempt < maxAttempts) {
          const delayMs = baseDelays[attempt - 1] || 1500;
          this.retryTelemetry.nextRetryDelayMs = delayMs;
          this.transitionState('Error-Recovery');
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }
    }

    // All retries exhausted -> gracefully enter Offline-Fallback with cached local data
    this.retryTelemetry.nextRetryDelayMs = null;
    this.transitionState('Offline-Fallback');
    return { value: fallbackValue, synced: false };
  }

  private async flushPendingOutboxAndSync(): Promise<void> {
    if (!this.isOnline || !supabaseClient || this.pendingOutbox.length === 0) {
      if (this.isOnline && supabaseClient) {
        this.transitionState('Synced');
      }
      return;
    }

    const itemsToProcess = [...this.pendingOutbox];
    this.pendingOutbox = [];
    this.persistLocalCache();

    await this.executeWithExponentialBackoff(
      async () => {
        const verifiedCtx = await resolveVerifiedFamilyContext();
        if (!verifiedCtx.authenticated || !isValidUuid(verifiedCtx.verifiedFamilyId)) {
          return 0;
        }
        await ensureSharedFamilyRecordInSupabase({ familyId: verifiedCtx.verifiedFamilyId });
        return itemsToProcess.length;
      },
      0,
      2
    );
  }

  public getSnapshot(): MasterControllerSnapshot {
    const storiesByChild: Record<number, BedtimeStoryRecord[]> = {};
    this.allStories.forEach((story) => {
      if (!storiesByChild[story.childId]) {
        storiesByChild[story.childId] = [];
      }
      storiesByChild[story.childId].push(story);
    });

    return {
      lifecycleState: this.lifecycleState,
      isOnline: this.isOnline,
      familyId: this.familyId,
      retryTelemetry: { ...this.retryTelemetry },
      batterySummary: this.batterySummary,
      storiesByChild,
      allStories: [...this.allStories],
      sequencedCatalog: [...this.sequencedCatalog],
      catalogSource: this.catalogSource,
      pendingOutboxCount: this.pendingOutbox.length,
    };
  }

  public subscribe(listener: (snapshot: MasterControllerSnapshot) => void): () => void {
    this.listeners.add(listener);
    listener(this.getSnapshot());
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Pillar 2A — Battery Diagnostics Engine:
   * Computes and persists wellness scores per child (Hamza, Laila, Youssef) and family average.
   */
  public async recomputeBatteryDiagnostics(
    state?: FamilySpaceState
  ): Promise<FamilyBatterySummary> {
    const kids = state?.kids && state.kids.length > 0 ? state.kids : this.latestChildren;
    if (state?.kids?.length) this.latestChildren = state.kids;
    const totalTasks = state?.tasks?.length || 1;
    const doneTasks = state?.tasks?.filter((t) => t.done).length || 0;
    const completionRatio = totalTasks > 0 ? doneTasks / totalTasks : 0.75;

    const nextSummary = buildBatteryDiagnosticsFromState(
      kids,
      completionRatio,
      this.batterySummary?.childrenDiagnostics
    );
    this.batterySummary = nextSummary;
    this.persistLocalCache();
    this.notifyListeners();

    await this.executeWithExponentialBackoff(
      async () => {
        if (!supabaseClient) return nextSummary;
        if ((state && isDefaultDemoSeedState(state)) || isCanonicalThreeDemoKids(kids)) {
          return nextSummary;
        }
        const verifiedCtx = await resolveVerifiedFamilyContext();
        if (!verifiedCtx.authenticated || !isValidUuid(verifiedCtx.verifiedFamilyId)) {
          return nextSummary;
        }
        const verifiedFamilyUuid = verifiedCtx.verifiedFamilyId;
        await ensureSharedFamilyRecordInSupabase({ familyId: verifiedFamilyUuid });
        const kidByLocalId = new Map<number, ChildProfile>(kids.map((k) => [k.id, k]));
        const rows = Object.values(nextSummary.childrenDiagnostics)
          .map((diag) => {
            const matchedKid = kidByLocalId.get(diag.childId);
            const remoteChildUuid =
              matchedKid && isValidUuid(matchedKid.remoteId) ? String(matchedKid.remoteId) : null;
            if (!remoteChildUuid) return null;
            return {
              family_id: verifiedFamilyUuid,
              child_id: remoteChildUuid,
              child_name: diag.childName,
              overall_score: diag.overallScore,
              sleep_score: diag.sleepScore,
              nutrition_score: diag.nutritionScore,
              mood_score: diag.moodScore,
              routine_score: diag.routineCompletionScore,
              routine_completion_score: diag.routineCompletionScore,
              updated_at: diag.updatedAt,
            };
          })
          .filter((row): row is NonNullable<typeof row> => row !== null);

        if (rows.length > 0) {
          const { error } = await supabaseClient
            .from('wellness_diagnostics')
            .upsert(rows, { onConflict: 'family_id,child_id' });
          if (error) throw error;
        }
        return nextSummary;
      },
      nextSummary,
      2
    );

    return nextSummary;
  }

  public async recordChildWellnessBoost(
    childId: number,
    pillar: 'sleep' | 'nutrition' | 'mood' | 'routine',
    delta: number = 4
  ): Promise<ChildBatteryDiagnostic> {
    const currentDiag =
      this.batterySummary.childrenDiagnostics[childId] ||
      Object.values(this.batterySummary.childrenDiagnostics)[0];

    const clamp = (val: number) => Math.min(100, Math.max(55, Math.round(val)));
    const nextSleep =
      pillar === 'sleep' ? clamp(currentDiag.sleepScore + delta) : currentDiag.sleepScore;
    const nextNutrition =
      pillar === 'nutrition'
        ? clamp(currentDiag.nutritionScore + delta)
        : currentDiag.nutritionScore;
    const nextMood =
      pillar === 'mood' ? clamp(currentDiag.moodScore + delta) : currentDiag.moodScore;
    const nextRoutine =
      pillar === 'routine'
        ? clamp(currentDiag.routineCompletionScore + delta)
        : currentDiag.routineCompletionScore;

    const nextOverall = clamp(
      nextSleep * 0.3 + nextNutrition * 0.25 + nextMood * 0.25 + nextRoutine * 0.2
    );

    const updatedDiag: ChildBatteryDiagnostic = {
      ...currentDiag,
      sleepScore: nextSleep,
      nutritionScore: nextNutrition,
      moodScore: nextMood,
      routineCompletionScore: nextRoutine,
      overallScore: nextOverall,
      statusLevel:
        nextOverall >= 85 ? 'optimal' : nextOverall >= 70 ? 'balanced' : 'needs-recharge',
      updatedAt: new Date().toISOString(),
    };

    const nextMap = {
      ...this.batterySummary.childrenDiagnostics,
      [childId]: updatedDiag,
    };
    const allDiags = Object.values(nextMap);
    const familyAverageScore = Math.round(
      allDiags.reduce((sum, d) => sum + d.overallScore, 0) / Math.max(1, allDiags.length)
    );

    this.batterySummary = {
      ...this.batterySummary,
      familyAverageScore,
      childrenDiagnostics: nextMap,
      updatedAt: updatedDiag.updatedAt,
    };

    this.persistLocalCache();
    this.notifyListeners();
    return updatedDiag;
  }

  /**
   * Interactive assessment saver for `BatteryDiagnosticsView.tsx` (`master.diagnostics.save(...)`).
   * Updates either a specific child (Hamza, Laila, Youssef) or the entire family assessment,
   * appends a historical score trend snapshot, persists to local cache, and syncs to Supabase.
   */
  public async saveDiagnosticAssessment(
    payload: SaveDiagnosticAssessmentPayload
  ): Promise<FamilyBatterySummary> {
    const clamp = (val: number) => Math.min(100, Math.max(40, Math.round(val)));
    const nowIso = new Date().toISOString();
    const nextMap: Record<number, ChildBatteryDiagnostic> = {
      ...this.batterySummary.childrenDiagnostics,
    };

    const targetChildId =
      typeof payload.scope === 'number'
        ? payload.scope
        : typeof payload.childId === 'number'
        ? payload.childId
        : null;

    if (targetChildId !== null) {
      const existing =
        nextMap[targetChildId] ||
        Object.values(nextMap)[0] ||
        buildBatteryDiagnosticsFromState(DEFAULT_SEED.kids).childrenDiagnostics[1];

      const sleepScore = clamp(payload.sleepScore ?? existing.sleepScore);
      const nutritionScore = clamp(payload.nutritionScore ?? existing.nutritionScore);
      const moodScore = clamp(payload.moodScore ?? existing.moodScore);
      const routineCompletionScore = clamp(
        payload.routineCompletionScore ?? existing.routineCompletionScore
      );
      const overallScore = clamp(
        sleepScore * 0.3 +
          nutritionScore * 0.25 +
          moodScore * 0.25 +
          routineCompletionScore * 0.2
      );

      const statusLevel: ChildBatteryDiagnostic['statusLevel'] =
        overallScore >= 85 ? 'optimal' : overallScore >= 70 ? 'balanced' : 'needs-recharge';

      const recommendationAr =
        payload.notes?.trim() ||
        (overallScore >= 85
          ? `طاقة ${existing.childName} ممتازة ومتوازنة اليوم (${overallScore}٪). استمروا على هذا الإيقاع الدافئ.`
          : overallScore >= 70
          ? `طاقة ${existing.childName} متوازنة (${overallScore}٪)؛ جلسة تهدئة أو وجبة خفيفة سترفع النشاط.`
          : `يوصى بجلسة شحن هادئة لـ ${existing.childName} (نوم مبكر ١٥ دقيقة وتقليل المحفزات).`);

      const recommendationEn =
        payload.notes?.trim() ||
        (overallScore >= 85
          ? `${existing.childName}'s wellness battery is optimal today (${overallScore}%). Keep up the warm rhythm.`
          : overallScore >= 70
          ? `${existing.childName}'s energy is balanced (${overallScore}%); a calm break or snack will boost readiness.`
          : `Recommended recharge for ${existing.childName}: 15m earlier bedtime and gentle screen-free calm.`);

      nextMap[targetChildId] = {
        ...existing,
        sleepScore,
        nutritionScore,
        moodScore,
        routineCompletionScore,
        overallScore,
        statusLevel,
        recommendationAr,
        recommendationEn,
        updatedAt: nowIso,
      };
    } else {
      // Family-level assessment updates all children proportionally if pillar scores are supplied
      Object.keys(nextMap).forEach((key) => {
        const kId = Number(key);
        const diag = nextMap[kId];
        if (!diag) return;
        const sleepScore = clamp(payload.sleepScore ?? diag.sleepScore);
        const nutritionScore = clamp(payload.nutritionScore ?? diag.nutritionScore);
        const moodScore = clamp(payload.moodScore ?? diag.moodScore);
        const routineCompletionScore = clamp(
          payload.routineCompletionScore ?? diag.routineCompletionScore
        );
        const overallScore = clamp(
          sleepScore * 0.3 +
            nutritionScore * 0.25 +
            moodScore * 0.25 +
            routineCompletionScore * 0.2
        );
        nextMap[kId] = {
          ...diag,
          sleepScore,
          nutritionScore,
          moodScore,
          routineCompletionScore,
          overallScore,
          statusLevel:
            overallScore >= 85 ? 'optimal' : overallScore >= 70 ? 'balanced' : 'needs-recharge',
          updatedAt: nowIso,
        };
      });
    }

    const parentAhmadBattery = clamp(
      payload.parentAhmadBattery ?? this.batterySummary.parentAhmadBattery
    );
    const parentMaryamBattery = clamp(
      payload.parentMaryamBattery ?? this.batterySummary.parentMaryamBattery
    );

    const allChildDiags = Object.values(nextMap);
    const childrenAvg =
      allChildDiags.reduce((sum, d) => sum + d.overallScore, 0) /
      Math.max(1, allChildDiags.length);
    const familyAverageScore = clamp(
      childrenAvg * 0.7 + ((parentAhmadBattery + parentMaryamBattery) / 2) * 0.3
    );

    const childScoresSnapshot: Record<number, number> = {};
    allChildDiags.forEach((d) => {
      childScoresSnapshot[d.childId] = d.overallScore;
    });

    const nextHistory = [
      ...(this.batterySummary.historySnapshots || []).slice(-11),
      {
        timestamp: nowIso,
        familyAverageScore,
        childScores: childScoresSnapshot,
      },
    ];

    this.batterySummary = {
      ...this.batterySummary,
      familyAverageScore,
      parentAhmadBattery,
      parentMaryamBattery,
      childrenDiagnostics: nextMap,
      historySnapshots: nextHistory,
      updatedAt: nowIso,
    };

    this.persistLocalCache();
    this.notifyListeners();

    await this.executeWithExponentialBackoff(
      async () => {
        if (!supabaseClient) return this.batterySummary;
        const verifiedCtx = await resolveVerifiedFamilyContext();
        if (!verifiedCtx.authenticated || !isValidUuid(verifiedCtx.verifiedFamilyId)) {
          return this.batterySummary;
        }
        const verifiedFamilyUuid = verifiedCtx.verifiedFamilyId;
        await ensureSharedFamilyRecordInSupabase({ familyId: verifiedFamilyUuid });
        const childByLocalId = new Map(this.latestChildren.map((kid) => [kid.id, kid]));
        const rows = Object.values(this.batterySummary.childrenDiagnostics).flatMap((d) => {
          const child = childByLocalId.get(d.childId);
          const childUuid = child && isValidUuid(child.remoteId) ? child.remoteId : null;
          if (!childUuid) return [];
          return [{
            family_id: verifiedFamilyUuid,
            child_id: childUuid,
            child_name: d.childName,
            age_stage: d.ageStage,
            overall_score: d.overallScore,
            sleep_score: d.sleepScore,
            nutrition_score: d.nutritionScore,
            mood_score: d.moodScore,
            routine_score: d.routineCompletionScore,
            routine_completion_score: d.routineCompletionScore,
            status_level: d.statusLevel,
            recommendation_ar: d.recommendationAr,
            recommendation_en: d.recommendationEn,
            updated_at: d.updatedAt,
          }];
        });
        if (rows.length > 0) {
          const { error } = await supabaseClient
            .from('wellness_diagnostics')
            .upsert(rows, { onConflict: 'family_id,child_id' });
          if (error) throw error;
        }
        return this.batterySummary;
      },
      this.batterySummary,
      2
    );

    return this.batterySummary;
  }

  /**
   * Creates a bedtime story linked to the selected real child profile.
   * Child identity and age are supplied by the caller; seeded demo profiles are never used.
   */
  public async generateBedtimeStoryForChild(
    req: GenerateBedtimeStoryRequest
  ): Promise<BedtimeStoryRecord> {
    const childName = req.childName.trim();
    const childNameEn = req.childNameEn?.trim() || childName;
    const childBirth = req.childBirth?.trim() || '';
    if (!childName || !Number.isFinite(req.childId) || req.childId < 0) {
      throw new Error('A valid saved child profile is required to create a personalized story.');
    }
    const parsedBirth = childBirth ? new Date(`${childBirth}T12:00:00`) : null;
    const ageInfo = parsedBirth && !Number.isNaN(parsedBirth.getTime()) && parsedBirth <= new Date()
      ? calculateChildAge(childBirth, 'ar')
      : null;
    const matchingKid = this.latestChildren.find((kid) => kid.id === req.childId && (!childBirth || kid.birth === childBirth));
    const storySeqNumber = 1000 + this.allStories.length + 1;
    const sequenceCode = `STR-${storySeqNumber}`;
    const nowIso = new Date().toISOString();

    const themeAr = req.themePrompt?.trim() || 'النجوم الهادئة والامتنان المسائي';
    const themeEn = req.themePrompt?.trim() || 'Calm Stars & Evening Gratitude';
    const moralAr = req.moralFocusAr?.trim() || req.moralFocus?.trim() || 'اللطف والتعاون والطمأنينة';
    const moralEn = req.moralFocusEn?.trim() || req.moralFocus?.trim() || 'Kindness, cooperation and reassurance';

    const newStory: BedtimeStoryRecord = {
      id: `story-${req.childId}-${Date.now()}`,
      sequenceCode,
      familyId: this.familyId,
      childId: req.childId,
      childRemoteId: req.childRemoteId ?? matchingKid?.remoteId,
      childName,
      ageStage: ageInfo?.stageCode || 'unknown',
      titleAr: `حدوتة ${childName}: رحلة ${themeAr}`,
      titleEn: `${childNameEn}’s Bedtime Tale: Journey of ${themeEn}`,
      storyBodyAr: req.storyBodyAr?.trim() || `في مساء هادئ مع أسرته، بدأ ${childName} مغامرة لطيفة حول «${themeAr}». وخلال الرحلة اكتشف معنى «${moralAr}»، ثم اختار طريقة بسيطة يشارك بها ما تعلمه مع أسرته قبل نهاية اليوم.`,
      storyBodyEn: req.storyBodyEn?.trim() || `On a calm evening with their family, ${childNameEn} began a gentle adventure about "${themeEn}". Along the way, ${childNameEn} discovered "${moralEn}" and found a simple way to share that lesson with the family before the day ended.`,
      moralTagAr: moralAr,
      moralTagEn: moralEn,
      calmingTempoBpm: ageInfo && ageInfo.months < 24 ? 58 : 60,
      durationMinutes: ageInfo ? (ageInfo.months < 24 ? 3 : ageInfo.months < 60 ? 5 : 6) : 4,
      tags: [ageInfo?.stageCode || 'age-not-set', childName, moralAr],
      createdAt: nowIso,
    };

    this.allStories = [newStory, ...this.allStories];
    this.persistLocalCache();
    this.notifyListeners();

    await this.executeWithExponentialBackoff(
      async () => {
        if (!supabaseClient) return newStory;
        const verifiedCtx = await resolveVerifiedFamilyContext();
        if (!verifiedCtx.authenticated || !isValidUuid(verifiedCtx.verifiedFamilyId)) {
          return newStory;
        }
        const verifiedFamilyUuid = verifiedCtx.verifiedFamilyId;
        await ensureSharedFamilyRecordInSupabase({ familyId: verifiedFamilyUuid });
        const remoteId = req.childRemoteId ?? matchingKid?.remoteId;
        const remoteChildUuid = isValidUuid(String(remoteId ?? '')) ? String(remoteId) : null;
        const storyPayload: Record<string, unknown> = {
          sequence_code: newStory.sequenceCode,
          family_id: verifiedFamilyUuid,
          child_id: remoteChildUuid,
          child_name: newStory.childName,
          age_stage: newStory.ageStage,
          title_ar: newStory.titleAr,
          title_en: newStory.titleEn,
          story_body_ar: newStory.storyBodyAr,
          story_body_en: newStory.storyBodyEn,
          moral_tag_ar: newStory.moralTagAr,
          moral_tag_en: newStory.moralTagEn,
          created_at: newStory.createdAt,
        };
        if (isValidUuid(newStory.id)) {
          storyPayload.id = newStory.id;
        }
        await supabaseClient
          .from('bedtime_stories')
          .upsert(storyPayload, { onConflict: 'sequence_code' });
        return newStory;
      },
      newStory,
      2
    );

    return newStory;
  }

  public getStoriesForChild(childId: number): BedtimeStoryRecord[] {
    return this.allStories.filter((s) => s.childId === childId);
  }

  /**
   * Pillar 2C — Catalog & Sequence Engine (`PRD-XXXX`):
   * Dynamically fetches catalog items from Supabase `catalog_items` and assigns `PRD-XXXX` sequence codes.
   */
  public allocateNextProductSequenceCode(numericSeed?: number): string {
    if (typeof numericSeed === 'number' && Number.isFinite(numericSeed)) {
      return formatProductSequenceCode(numericSeed);
    }
    this.sequenceCounter += 1;
    this.persistLocalCache();
    return formatProductSequenceCode(this.sequenceCounter);
  }

  public async refreshCatalogWithSequences(): Promise<SequencedCatalogItem[]> {
    const fallbackSequenced = buildSequencedCatalog(COMMERCIAL_CATALOG);

    const { value, synced } = await this.executeWithExponentialBackoff(
      async () => {
        if (!supabaseClient) return fallbackSequenced;
        const { data, error } = await supabaseClient
          .from(SUPABASE_TABLES.CATALOG_ITEMS)
          .select('*')
          .eq('is_active', true)
          .eq('marketplace_visible', true)
          .limit(50);

        if (error) {
          throw error;
        }
        if (!Array.isArray(data)) {
          throw new Error('Catalog response is not a valid list.');
        }
        // An empty, successful production query means there are no published listings.
        // Do not silently replace the admin-managed catalog with demo seed products.
        if (data.length === 0) {
          return [];
        }

        const now = Date.now();
        const visibleData = data.filter((row: Record<string, unknown>) => {
          const startsAt = typeof row.listing_starts_at === 'string' ? Date.parse(row.listing_starts_at) : Number.NaN;
          const endsAt = typeof row.listing_ends_at === 'string' ? Date.parse(row.listing_ends_at) : Number.NaN;
          return (!Number.isFinite(startsAt) || startsAt <= now) && (!Number.isFinite(endsAt) || endsAt > now);
        });
        const remoteSequenced: SequencedCatalogItem[] = visibleData.map(
          (row: Record<string, unknown>, idx: number) => {
            const rowCode = typeof row.code === 'string' && row.code.startsWith('PRD-') ? row.code : '';
            const codeNumber = rowCode ? Number(rowCode.slice(4)) : Number.NaN;
            const numericId = Number.isSafeInteger(codeNumber) && codeNumber > 0 ? codeNumber : (typeof row.id === 'number' ? row.id : 2000 + idx + 1);
            const rawSeq = rowCode || (typeof row.sequence_code === 'string' && row.sequence_code.startsWith('PRD-') ? row.sequence_code : formatProductSequenceCode(numericId));

            return {
              id: numericId,
              sequenceCode: rawSeq,
              familyId: this.familyId,
              name:
                (typeof row.title === 'string' && row.title.trim()) ||
                (typeof row.name === 'string' && row.name.trim()) ||
                'منتج عائلي مميز',
              nameEn: typeof row.name_en === 'string' ? row.name_en : 'Featured Family Item',
              kind:
                row.item_type === 'service' || row.kind === 'service'
                  ? 'service'
                  : row.kind === 'offer' ? 'offer' : 'product',
              category:
                (typeof row.category === 'string'
                  ? (row.category as CommercialCatalogItem['category'])
                  : 'toys') || 'toys',
              categoryLabel:
                typeof row.category_label === 'string' ? row.category_label : 'ألعاب وتنمية',
              country: row.country === 'EG' || row.country === 'SA' ? row.country : 'ALL',
              city: typeof row.city === 'string' ? row.city : 'الدمام',
              priceEGP: typeof row.price_egp === 'number' ? row.price_egp : 450,
              priceSAR: typeof row.price_sar === 'number' ? row.price_sar : 95,
              rating: typeof row.rating === 'string' || typeof row.rating === 'number' ? String(row.rating) : '0',
              isSponsored: Boolean(row.is_sponsored),
              description:
                typeof row.description === 'string'
                  ? row.description
                  : 'منتج مختار بعناية لأطفال الأسرة.',
              emoji: typeof row.emoji === 'string' ? row.emoji : '🧸',
              serviceDurationMinutes: typeof row.service_duration_minutes === 'number' ? row.service_duration_minutes : undefined,
              bookingRequired: Boolean(row.booking_required),
              fulfillmentMode: row.fulfillment_mode === 'pickup' || row.fulfillment_mode === 'online' || row.fulfillment_mode === 'onsite' || row.fulfillment_mode === 'at_home' || row.fulfillment_mode === 'digital' ? row.fulfillment_mode : 'shipping',
              providerName: typeof row.provider_name === 'string' ? row.provider_name : undefined,
              listingValidUntil: typeof row.listing_ends_at === 'string' ? row.listing_ends_at : undefined,
            };
          }
        );

        return remoteSequenced;
      },
      fallbackSequenced,
      3
    );

    this.catalogSource = synced ? (value.length > 0 ? 'remote' : 'empty') : 'offline';
    this.sequencedCatalog = value;
    this.persistLocalCache();
    this.notifyListeners();
    return value;
  }

  /**
   * Autonomous Full Sync Orchestrator with Exponential Backoff
   */
  public async forceSyncNow(appState?: FamilySpaceState): Promise<boolean> {
    if (appState) {
      await this.recomputeBatteryDiagnostics(appState);
    }

    const { synced } = await this.executeWithExponentialBackoff(
      async () => {
        if (appState) {
          const verifiedCtx = await resolveVerifiedFamilyContext();
          if (
            verifiedCtx.authenticated &&
            isValidUuid(verifiedCtx.verifiedFamilyId) &&
            !isDefaultDemoSeedState(appState)
          ) {
            const ok = await syncFamilySpaceToSupabase(appState);
            if (!ok) {
              throw new Error('Supabase state sync returned false');
            }
          }
        }
        await this.refreshCatalogWithSequences();
        return true;
      },
      false,
      3
    );

    if (!synced && appState) {
      this.pendingOutbox.push({
        id: `outbox-${Date.now()}`,
        type: 'state',
        payload: { updatedAt: new Date().toISOString() },
        createdAt: new Date().toISOString(),
      });
      this.persistLocalCache();
      this.notifyListeners();
    }

    return synced;
  }

  /**
   * Autonomous Bootstrapping Entry Point called on App Mount
   */
  public async bootstrapWithAppState(
    currentState: FamilySpaceState
  ): Promise<{ hydratedState: FamilySpaceState; snapshot: MasterControllerSnapshot }> {
    this.transitionState('Initializing');

    const { value: hydrationResult } = await this.executeWithExponentialBackoff(
      async () => {
        const res = await fetchFamilySpaceFromSupabase(currentState);
        if (res.error) {
          throw new Error(res.error);
        }
        return res;
      },
      {
        nextState: currentState,
        users: [],
        family: null,
        children: [],
        catalogItems: [],
        summary: {
          connected: false,
          sharedFamilyId: SHARED_FAMILY_ID,
          usersCount: 2,
          familiesCount: 1,
          childrenCount: currentState.kids.length,
          extendedFamilyCount: currentState.family.length,
          catalogCount: 0,
          syncedAt: new Date().toISOString(),
        },
        error: null,
      },
      3
    );

    await this.recomputeBatteryDiagnostics(hydrationResult.nextState);
    await this.refreshCatalogWithSequences();

    return {
      hydratedState: hydrationResult.nextState,
      snapshot: this.getSnapshot(),
    };
  }
}

export const masterAppController = new MasterBackendService();

/**
 * ============================================================================
 * 7. REACT CONTEXT & ZERO-MICROMANAGEMENT HOOKS (`useMasterController` & `useMaster`)
 * ============================================================================
 */
export interface MasterControllerContextValue extends MasterControllerSnapshot {
  controller: MasterBackendService;
  recomputeBatteryDiagnostics: (state?: FamilySpaceState) => Promise<FamilyBatterySummary>;
  saveDiagnosticAssessment: (
    payload: SaveDiagnosticAssessmentPayload
  ) => Promise<FamilyBatterySummary>;
  recordChildWellnessBoost: (
    childId: number,
    pillar: 'sleep' | 'nutrition' | 'mood' | 'routine',
    delta?: number
  ) => Promise<ChildBatteryDiagnostic>;
  generateBedtimeStoryForChild: (
    req: GenerateBedtimeStoryRequest
  ) => Promise<BedtimeStoryRecord>;
  getStoriesForChild: (childId: number) => BedtimeStoryRecord[];
  refreshCatalogWithSequences: () => Promise<SequencedCatalogItem[]>;
  allocateNextProductSequenceCode: (numericSeed?: number) => string;
  forceSyncNow: (appState?: FamilySpaceState) => Promise<boolean>;
  diagnostics: {
    summary: FamilyBatterySummary;
    save: (payload: SaveDiagnosticAssessmentPayload) => Promise<FamilyBatterySummary>;
    recompute: (state?: FamilySpaceState) => Promise<FamilyBatterySummary>;
    boost: (
      childId: number,
      pillar: 'sleep' | 'nutrition' | 'mood' | 'routine',
      delta?: number
    ) => Promise<ChildBatteryDiagnostic>;
  };
  stories: {
    all: BedtimeStoryRecord[];
    byChild: Record<number, BedtimeStoryRecord[]>;
    generate: (req: GenerateBedtimeStoryRequest) => Promise<BedtimeStoryRecord>;
    getForChild: (childId: number) => BedtimeStoryRecord[];
  };
  catalog: {
    items: SequencedCatalogItem[];
    refresh: () => Promise<SequencedCatalogItem[]>;
    allocateCode: (numericSeed?: number) => string;
  };
}

const MasterControllerContext = createContext<MasterControllerContextValue | null>(null);

export const MasterControllerProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [snapshot, setSnapshot] = useState<MasterControllerSnapshot>(() =>
    masterAppController.getSnapshot()
  );

  useEffect(() => {
    const unsubscribe = masterAppController.subscribe((nextSnap) => {
      setSnapshot(nextSnap);
    });
    return unsubscribe;
  }, []);

  const recomputeBatteryDiagnostics = useCallback(
    (state?: FamilySpaceState) => masterAppController.recomputeBatteryDiagnostics(state),
    []
  );

  const saveDiagnosticAssessment = useCallback(
    (payload: SaveDiagnosticAssessmentPayload) =>
      masterAppController.saveDiagnosticAssessment(payload),
    []
  );

  const recordChildWellnessBoost = useCallback(
    (
      childId: number,
      pillar: 'sleep' | 'nutrition' | 'mood' | 'routine',
      delta?: number
    ) => masterAppController.recordChildWellnessBoost(childId, pillar, delta),
    []
  );

  const generateBedtimeStoryForChild = useCallback(
    (req: GenerateBedtimeStoryRequest) =>
      masterAppController.generateBedtimeStoryForChild(req),
    []
  );

  const getStoriesForChild = useCallback(
    (childId: number) => masterAppController.getStoriesForChild(childId),
    []
  );

  const refreshCatalogWithSequences = useCallback(
    () => masterAppController.refreshCatalogWithSequences(),
    []
  );

  const allocateNextProductSequenceCode = useCallback(
    (numericSeed?: number) =>
      masterAppController.allocateNextProductSequenceCode(numericSeed),
    []
  );

  const forceSyncNow = useCallback(
    (appState?: FamilySpaceState) => masterAppController.forceSyncNow(appState),
    []
  );

  const contextValue = useMemo<MasterControllerContextValue>(
    () => ({
      ...snapshot,
      controller: masterAppController,
      recomputeBatteryDiagnostics,
      saveDiagnosticAssessment,
      recordChildWellnessBoost,
      generateBedtimeStoryForChild,
      getStoriesForChild,
      refreshCatalogWithSequences,
      allocateNextProductSequenceCode,
      forceSyncNow,
      diagnostics: {
        summary: snapshot.batterySummary,
        save: saveDiagnosticAssessment,
        recompute: recomputeBatteryDiagnostics,
        boost: recordChildWellnessBoost,
      },
      stories: {
        all: snapshot.allStories,
        byChild: snapshot.storiesByChild,
        generate: generateBedtimeStoryForChild,
        getForChild: getStoriesForChild,
      },
      catalog: {
        items: snapshot.sequencedCatalog,
        refresh: refreshCatalogWithSequences,
        allocateCode: allocateNextProductSequenceCode,
      },
    }),
    [
      snapshot,
      recomputeBatteryDiagnostics,
      saveDiagnosticAssessment,
      recordChildWellnessBoost,
      generateBedtimeStoryForChild,
      getStoriesForChild,
      refreshCatalogWithSequences,
      allocateNextProductSequenceCode,
      forceSyncNow,
    ]
  );

  return React.createElement(
    MasterControllerContext.Provider,
    { value: contextValue },
    children
  );
};

export function useMasterController(): MasterControllerContextValue {
  const ctx = useContext(MasterControllerContext);
  if (!ctx) {
    const fallbackSnap = masterAppController.getSnapshot();
    const recompute = (s?: FamilySpaceState) =>
      masterAppController.recomputeBatteryDiagnostics(s);
    const save = (payload: SaveDiagnosticAssessmentPayload) =>
      masterAppController.saveDiagnosticAssessment(payload);
    const boost = (
      id: number,
      pillar: 'sleep' | 'nutrition' | 'mood' | 'routine',
      delta?: number
    ) => masterAppController.recordChildWellnessBoost(id, pillar, delta);
    const generate = (req: GenerateBedtimeStoryRequest) =>
      masterAppController.generateBedtimeStoryForChild(req);
    const getForChild = (id: number) => masterAppController.getStoriesForChild(id);
    const refresh = () => masterAppController.refreshCatalogWithSequences();
    const allocateCode = (seed?: number) =>
      masterAppController.allocateNextProductSequenceCode(seed);

    return {
      ...fallbackSnap,
      controller: masterAppController,
      recomputeBatteryDiagnostics: recompute,
      saveDiagnosticAssessment: save,
      recordChildWellnessBoost: boost,
      generateBedtimeStoryForChild: generate,
      getStoriesForChild: getForChild,
      refreshCatalogWithSequences: refresh,
      allocateNextProductSequenceCode: allocateCode,
      forceSyncNow: (s) => masterAppController.forceSyncNow(s),
      diagnostics: {
        summary: fallbackSnap.batterySummary,
        save,
        recompute,
        boost,
      },
      stories: {
        all: fallbackSnap.allStories,
        byChild: fallbackSnap.storiesByChild,
        generate,
        getForChild,
      },
      catalog: {
        items: fallbackSnap.sequencedCatalog,
        refresh,
        allocateCode,
      },
    };
  }
  return ctx;
}

/**
 * Clean single-point alias hook `useMaster()` for UI components.
 */
export const useMaster = useMasterController;

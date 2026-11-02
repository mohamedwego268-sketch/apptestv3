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
  childrenDiagnostics: Reco...[truncated]  });

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
  private sequen...[truncated]       return 0;
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
    this.persistLocalCache();...[truncated]      nextSummary,
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

    this.persist...[truncated] overallScore >= 70
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
            overallScore >= 8...[truncated]    );

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
          return (!Number.isFinite(startsAt) ||...[truncated]====================================
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

 ...[truncated]      getStoriesForChild,
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
        ...[truncated]
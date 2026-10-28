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
  childName?: string;
  themePrompt?: string;
  moralFocus?: string;
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
function createInitialStoriesLibrary(): BedtimeStoryRecord[] {
  const nowIso = new Date().toISOString();
  return [
    {
      id: 'story-hamza-1',
      sequenceCode: 'STR-1001',
      familyId: SHARED_FAMILY_ID,
      childId: 1,
      childName: 'حمزة',
      ageStage: '0-2',
      titleAr: 'حمزة والغيمة الفضية الناعمة',
      titleEn: 'Baby Hamza and the Soft Silver Cloud',
      storyBodyAr:
        'في سماء المساء الهادئة، هبطت غيمة قطنية ناعمة تغني لحمزة نغمة دافئة. ابتسم حمزة وأغمض عينيه الصغيرتين وهو يشعر بحضن ماما مريم وبابا أحمد الآمن.',
      storyBodyEn:
        'In the calm evening sky, a soft cotton cloud floated down humming a gentle lullaby for baby Hamza. Hamza smiled and closed his eyes in the warm embrace of Mom Maryam and Dad Ahmad.',
      moralTagAr: 'الأمان العاطفي والهدوء الحسي للرضيع',
      moralTagEn: 'Emotional Safety & Infant Sensory Calm',
      calmingTempoBpm: 58,
      durationMinutes: 3,
      tags: ['infant', 'sensory-calm', 'lullaby', 'hamza'],
      createdAt: nowIso,
    },
    {
      id: 'story-laila-1',
      sequenceCode: 'STR-1002',
      familyId: SHARED_FAMILY_ID,
      childId: 2,
      childName: 'ليلى',
      ageStage: '3-5',
      titleAr: 'فرشاة ليلى السحرية وحديقة الألوان الهادئة',
      titleEn: 'Laila’s Magic Brush and the Calm Garden of Colors',
      storyBodyAr:
        'رسمت ليلى بفرشاتها المائية فراشة وردية تطير فوق أزهار المساء. شكرت الفراشة ليلى لأنها شاركت ألوانها بحب في الحضانة، ثم نامت الأزهار تحت ضوء القمر.',
      storyBodyEn:
        'With her watercolor brush, Laila painted a rose butterfly gliding over evening flowers. The butterfly thanked Laila for sharing her colors kindly at nursery as the garden fell asleep under the moonlight.',
      moralTagAr: 'المشاركة اللطيفة وتسمية المشاعر الإيجابية',
      moralTagEn: 'Kind Sharing & Positive Emotion Naming',
      calmingTempoBpm: 62,
      durationMinutes: 5,
      tags: ['nursery', 'creativity', 'empathy', 'laila'],
      createdAt: nowIso,
    },
    {
      id: 'story-youssef-1',
      sequenceCode: 'STR-1003',
      familyId: SHARED_FAMILY_ID,
      childId: 3,
      childName: 'يوسف',
      ageStage: '5-8',
      titleAr: 'الكابتن يوسف وبوصلة النجوم المضيئة',
      titleEn: 'Captain Youssef and the Glowing Star Compass',
      storyBodyAr:
        'بعد يوم مليء بالعلوم والسباحة، نظر الكابتن يوسف إلى السماء فرأى كوكبة النجوم ترسم له وسام الشجاعة والالتزام. استرخى يوسف بفخر استعداداً لمغامرة الغد.',
      storyBodyEn:
        'After a day of science and swimming practice, Captain Youssef looked up at the night sky where the stars formed a badge of courage and responsibility. He rested proudly, ready for tomorrow’s adventure.',
      moralTagAr: 'المسؤولية والثقة بالنفس والامتنان المسائي',
      moralTagEn: 'Responsibility, Confidence & Evening Gratitude',
      calmingTempoBpm: 60,
      durationMinutes: 6,
      tags: ['school', 'champions', 'science', 'youssef'],
      createdAt: nowIso,
    },
  ];
}

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
      ageStage: ageInfo.stageCode,
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
  private allStories: BedtimeStoryRecord[];
  private sequencedCatalog: SequencedCatalogItem[];
  private sequenceCounter: number = 1050;
  private pendingOutbox: PersistedMasterCache['pendingOutbox'] = [];
  private listeners: Set<(snapshot: MasterControllerSnapshot) => void> = new Set();
  private initializedListeners = false;

  constructor() {
    const cached = this.loadLocalCache();
    this.batterySummary =
      cached?.batterySummary || buildBatteryDiagnosticsFromState(DEFAULT_SEED.kids);
    this.allStories =
      cached?.allStories && cached.allStories.length > 0
        ? cached.allStories
        : createInitialStoriesLibrary();
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
        sequenceCounter: this.sequenceCounter,
        pendingOutbox: this.pendingOutbox,
        lastSyncedAt: this.retryTelemetry.lastSyncedAt,
      };
      window.localStorage.setItem(MASTER_CACHE_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore storage quota restrictions safely
    }
  }

  private attachAutonomousEnvironmentWatchers(): void {
    if (typeof window === 'undefined' || this.initializedListeners) return;
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
        await ensureSharedFamilyRecordInSupabase({ familyId: this.familyId });
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
    const kids = state?.kids && state.kids.length > 0 ? state.kids : DEFAULT_SEED.kids;
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
        await ensureSharedFamilyRecordInSupabase({ familyId: this.familyId });
        const rows = Object.values(nextSummary.childrenDiagnostics).map((diag) => ({
          id: diag.id,
          family_id: this.familyId,
          child_id: diag.childId,
          child_name: diag.childName,
          overall_score: diag.overallScore,
          sleep_score: diag.sleepScore,
          nutrition_score: diag.nutritionScore,
          mood_score: diag.moodScore,
          routine_score: diag.routineCompletionScore,
          updated_at: diag.updatedAt,
        }));
        await supabaseClient
          .from('wellness_diagnostics')
          .upsert(rows, { onConflict: 'id' });
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
        await ensureSharedFamilyRecordInSupabase({ familyId: this.familyId });
        const rows = Object.values(this.batterySummary.childrenDiagnostics).map((d) => ({
          id: d.id,
          family_id: this.familyId,
          child_id: d.childId,
          child_name: d.childName,
          age_stage: d.ageStage,
          overall_score: d.overallScore,
          sleep_score: d.sleepScore,
          nutrition_score: d.nutritionScore,
          mood_score: d.moodScore,
          routine_completion_score: d.routineCompletionScore,
          status_level: d.statusLevel,
          recommendation_ar: d.recommendationAr,
          recommendation_en: d.recommendationEn,
          updated_at: d.updatedAt,
        }));
        await supabaseClient.from('wellness_diagnostics').upsert(rows, { onConflict: 'id' });
        return this.batterySummary;
      },
      this.batterySummary,
      2
    );

    return this.batterySummary;
  }

  /**
   * Pillar 2B — AI Bedtime Stories Engine:
   * Generates a tailored bedtime story for Hamza, Laila, or Youssef, tags it with metadata,
   * and persists it in the historical library per child.
   */
  public async generateBedtimeStoryForChild(
    req: GenerateBedtimeStoryRequest
  ): Promise<BedtimeStoryRecord> {
    const targetKid =
      DEFAULT_SEED.kids.find((k) => k.id === req.childId) || DEFAULT_SEED.kids[0];
    const childName = req.childName?.trim() || targetKid.name;
    const ageInfo = calculateChildAge(targetKid.birth, 'ar');
    const storySeqNumber = 1000 + this.allStories.length + 1;
    const sequenceCode = `STR-${storySeqNumber}`;
    const nowIso = new Date().toISOString();

    const themeAr = req.themePrompt?.trim() || 'النجوم الهادئة والامتنان المسائي';
    const themeEn = req.themePrompt?.trim() || 'Calm Stars & Evening Gratitude';
    const moralAr =
      req.moralFocus?.trim() ||
      (req.childId === 1
        ? 'الأمان العاطفي والهدوء الحسي'
        : req.childId === 2
        ? 'المشاركة اللطيفة والخيال الإبداعي'
        : 'الثقة بالنفس والمسؤولية');
    const moralEn =
      req.moralFocus?.trim() ||
      (req.childId === 1
        ? 'Emotional Security & Sensory Calm'
        : req.childId === 2
        ? 'Kind Sharing & Creative Imagination'
        : 'Self-Confidence & Responsibility');

    const newStory: BedtimeStoryRecord = {
      id: `story-${req.childId}-${Date.now()}`,
      sequenceCode,
      familyId: this.familyId,
      childId: req.childId,
      childName,
      ageStage: ageInfo.stageCode,
      titleAr: `حدوتة ${childName}: رحلة ${themeAr}`,
      titleEn: `${childName}’s Bedtime Tale: Journey of ${themeEn}`,
      storyBodyAr: `في مساء دافئ داخل بيت أحمد ومريم، استعد ${childName} لرحلة خيالية هادئة حول «${themeAr}». تعلّم ${childName} في هذه الليلة قيمة «${moralAr}»، ثم أغمض عينيه بابتسامة مطمئنة استعداداً ليوم جديد جميل.`,
      storyBodyEn: `On a warm evening in Ahmad and Maryam’s home, ${childName} embarked on a peaceful bedtime journey about "${themeEn}". Embracing the lesson of "${moralEn}", ${childName} drifted into deep, restful sleep with a calm smile.`,
      moralTagAr: moralAr,
      moralTagEn: moralEn,
      calmingTempoBpm: req.childId === 1 ? 58 : 60,
      durationMinutes: req.childId === 1 ? 3 : req.childId === 2 ? 5 : 6,
      tags: [ageInfo.stageCode, childName, moralAr],
      createdAt: nowIso,
    };

    this.allStories = [newStory, ...this.allStories];
    this.persistLocalCache();
    this.notifyListeners();

    await this.executeWithExponentialBackoff(
      async () => {
        if (!supabaseClient) return newStory;
        await ensureSharedFamilyRecordInSupabase({ familyId: this.familyId });
        await supabaseClient.from('bedtime_stories').upsert(
          {
            id: newStory.id,
            sequence_code: newStory.sequenceCode,
            family_id: newStory.familyId,
            child_id: newStory.childId,
            child_name: newStory.childName,
            age_stage: newStory.ageStage,
            title_ar: newStory.titleAr,
            title_en: newStory.titleEn,
            story_body_ar: newStory.storyBodyAr,
            story_body_en: newStory.storyBodyEn,
            moral_tag_ar: newStory.moralTagAr,
            moral_tag_en: newStory.moralTagEn,
            created_at: newStory.createdAt,
          },
          { onConflict: 'id' }
        );
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

    const { value } = await this.executeWithExponentialBackoff(
      async () => {
        if (!supabaseClient) return fallbackSequenced;
        const { data, error } = await supabaseClient
          .from(SUPABASE_TABLES.CATALOG_ITEMS)
          .select('*')
          .limit(50);

        if (error || !Array.isArray(data) || data.length === 0) {
          return fallbackSequenced;
        }

        const remoteSequenced: SequencedCatalogItem[] = data.map(
          (row: Record<string, unknown>, idx: number) => {
            const numericId = typeof row.id === 'number' ? row.id : 2000 + idx + 1;
            const rawSeq =
              typeof row.sequence_code === 'string' && row.sequence_code.startsWith('PRD-')
                ? row.sequence_code
                : formatProductSequenceCode(numericId);

            return {
              id: numericId,
              sequenceCode: rawSeq,
              familyId: this.familyId,
              name: typeof row.name === 'string' ? row.name : 'منتج عائلي مميز',
              nameEn: typeof row.name_en === 'string' ? row.name_en : 'Featured Family Item',
              kind:
                row.kind === 'service' || row.kind === 'product' || row.kind === 'offer'
                  ? row.kind
                  : 'product',
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
              rating: typeof row.rating === 'string' ? row.rating : '4.9',
              isSponsored: Boolean(row.is_sponsored),
              description:
                typeof row.description === 'string'
                  ? row.description
                  : 'منتج مختار بعناية لأطفال الأسرة.',
              emoji: typeof row.emoji === 'string' ? row.emoji : '🧸',
            };
          }
        );

        const mergedById = new Map<number, SequencedCatalogItem>();
        fallbackSequenced.forEach((item) => mergedById.set(item.id, item));
        remoteSequenced.forEach((item) => mergedById.set(item.id, item));
        return Array.from(mergedById.values());
      },
      fallbackSequenced,
      3
    );

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
          const ok = await syncFamilySpaceToSupabase(appState);
          if (!ok) {
            throw new Error('Supabase state sync returned false');
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
      getStoriesForChild,
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

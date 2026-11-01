import type { SupabaseClient } from '@supabase/supabase-js';
import type { ChildProfileDetails } from '../domain/familySpaceCore';
import {
  isValidUuid,
  resolveVerifiedFamilyContext,
  supabaseClient,
  withSupabaseRetry,
} from './supabaseService';

export const CHILD_LIFE_RECORD_TYPES = [
  'sleep_log',
  'education',
  'nutrition',
  'sports',
  'routine',
  'growth_measurement',
  'vaccination',
  'medical_event',
  'milestone',
  'hobby',
  'emotional_social',
  'memory',
  'daily_note',
  'other',
] as const;

export type ChildLifeRecordType = (typeof CHILD_LIFE_RECORD_TYPES)[number];

export interface ChildLifeRecord {
  id: string;
  family_id: string;
  child_id: string;
  record_type: ChildLifeRecordType;
  title: string;
  notes: string;
  occurred_at: string;
  details: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}


type ServiceResult<T> = { data: T; error: string | null };

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

async function resolveChildScope(
  childId: string,
  client: SupabaseClient
): Promise<{ familyId: string; userId: string } | { error: string }> {
  if (!isValidUuid(childId)) return { error: 'A valid remote child UUID is required.' };
  const ctx = await resolveVerifiedFamilyContext(client);
  if (!ctx.authenticated || !isValidUuid(ctx.verifiedFamilyId) || !isValidUuid(ctx.userId)) {
    return { error: ctx.error || 'A verified signed-in family session is required.' };
  }
  const { data, error } = await withSupabaseRetry(() =>
    client.from('children')
      .select('id')
      .eq('id', childId)
      .eq('family_id', ctx.verifiedFamilyId)
      .maybeSingle()
  );
  if (error) return { error: error.message };
  if (!data) return { error: 'The child does not belong to the signed-in family.' };
  return { familyId: ctx.verifiedFamilyId, userId: ctx.userId };
}

function getClient(customClient?: SupabaseClient | null): SupabaseClient | null {
  return customClient === undefined ? supabaseClient : customClient;
}

export async function fetchChildLifeRecords(
  childId: string,
  customClient?: SupabaseClient | null
): Promise<ServiceResult<ChildLifeRecord[]>> {
  const client = getClient(customClient);
  if (!client) return { data: [], error: 'Supabase client is not initialized.' };
  try {
    const scope = await resolveChildScope(childId, client);
    if ('error' in scope) return { data: [], error: scope.error };
    const { data, error } = await withSupabaseRetry(() =>
      client.from('child_life_records')
        .select('*')
        .eq('family_id', scope.familyId)
        .eq('child_id', childId)
        .order('occurred_at', { ascending: false })
    );
    if (error) return { data: [], error: error.message };
    return { data: (data || []) as ChildLifeRecord[], error: null };
  } catch (error) {
    return { data: [], error: error instanceof Error ? error.message : 'Unable to load child history.' };
  }
}

export async function createChildLifeRecord(
  input: {
    childId: string;
    recordType: ChildLifeRecordType;
    title?: string;
    notes?: string;
    occurredAt?: string;
    details?: Record<string, unknown>;
  },
  customClient?: SupabaseClient | null
): Promise<ServiceResult<ChildLifeRecord | null>> {
  const client = getClient(customClient);
  if (!client) return { data: null, error: 'Supabase client is not initialized.' };
  if (!CHILD_LIFE_RECORD_TYPES.includes(input.recordType)) {
    return { data: null, error: 'Unsupported child history record type.' };
  }
  if (input.details !== undefined && !isRecord(input.details)) {
    return { data: null, error: 'Record details must be a JSON object.' };
  }
  try {
    const scope = await resolveChildScope(input.childId, client);
    if ('error' in scope) return { data: null, error: scope.error };
    const row = {
      family_id: scope.familyId,
      child_id: input.childId,
      record_type: input.recordType,
      title: input.title?.trim() || '',
      notes: input.notes?.trim() || '',
      occurred_at: input.occurredAt || new Date().toISOString(),
      details: (input.details || {}),
      created_by: scope.userId,
    };
    const { data, error } = await withSupabaseRetry(() =>
      client.from('child_life_records').insert(row).select('*').single()
    );
    if (error) return { data: null, error: error.message };
    return { data: data as ChildLifeRecord, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Unable to save child history.' };
  }
}

export async function updateChildLifeRecord(
  recordId: string,
  childId: string,
  patch: Partial<Pick<ChildLifeRecord, 'record_type' | 'title' | 'notes' | 'occurred_at' | 'details'>>,
  customClient?: SupabaseClient | null
): Promise<ServiceResult<ChildLifeRecord | null>> {
  const client = getClient(customClient);
  if (!client) return { data: null, error: 'Supabase client is not initialized.' };
  if (!isValidUuid(recordId)) return { data: null, error: 'A valid record UUID is required.' };
  if (patch.record_type && !CHILD_LIFE_RECORD_TYPES.includes(patch.record_type)) {
    return { data: null, error: 'Unsupported child history record type.' };
  }
  if (patch.details !== undefined && !isRecord(patch.details)) {
    return { data: null, error: 'Record details must be a JSON object.' };
  }
  try {
    const scope = await resolveChildScope(childId, client);
    if ('error' in scope) return { data: null, error: scope.error };
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (patch.record_type !== undefined) updates.record_type = patch.record_type;
    if (patch.title !== undefined) updates.title = patch.title.trim();
    if (patch.notes !== undefined) updates.notes = patch.notes.trim();
    if (patch.occurred_at !== undefined) updates.occurred_at = patch.occurred_at;
    if (patch.details !== undefined) updates.details = patch.details;
    const { data, error } = await withSupabaseRetry(() =>
      client.from('child_life_records').update(updates)
        .eq('id', recordId)
        .eq('family_id', scope.familyId)
        .eq('child_id', childId)
        .select('*')
        .maybeSingle()
    );
    if (error) return { data: null, error: error.message };
    if (!data) return { data: null, error: 'History record not found in this child profile.' };
    return { data: data as ChildLifeRecord, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Unable to update child history.' };
  }
}

export async function deleteChildLifeRecord(
  recordId: string,
  childId: string,
  customClient?: SupabaseClient | null
): Promise<{ deleted: boolean; error: string | null }> {
  const client = getClient(customClient);
  if (!client) return { deleted: false, error: 'Supabase client is not initialized.' };
  if (!isValidUuid(recordId)) return { deleted: false, error: 'A valid record UUID is required.' };
  try {
    const scope = await resolveChildScope(childId, client);
    if ('error' in scope) return { deleted: false, error: scope.error };
    const { data, error } = await withSupabaseRetry(() =>
      client.from('child_life_records').delete()
        .eq('id', recordId)
        .eq('family_id', scope.familyId)
        .eq('child_id', childId)
        .select('id')
        .maybeSingle()
    );
    if (error) return { deleted: false, error: error.message };
    return { deleted: Boolean(data), error: data ? null : 'History record not found in this child profile.' };
  } catch (error) {
    return { deleted: false, error: error instanceof Error ? error.message : 'Unable to delete child history.' };
  }
}

export async function saveChildProfileDetails(
  childId: string,
  details: ChildProfileDetails,
  customClient?: SupabaseClient | null
): Promise<ServiceResult<ChildProfileDetails | null>> {
  const client = getClient(customClient);
  if (!client) return { data: null, error: 'Supabase client is not initialized.' };
  if (!isRecord(details)) return { data: null, error: 'Child profile details must be a JSON object.' };
  try {
    const scope = await resolveChildScope(childId, client);
    if ('error' in scope) return { data: null, error: scope.error };
    const { data, error } = await withSupabaseRetry(() =>
      client.from('children')
        .update({ profile_details: details, updated_at: new Date().toISOString() })
        .eq('id', childId)
        .eq('family_id', scope.familyId)
        .select('profile_details')
        .single()
    );
    if (error) return { data: null, error: error.message };
    return { data: data.profile_details as ChildProfileDetails, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Unable to save child profile details.' };
  }
}

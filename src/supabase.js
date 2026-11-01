import { createClient } from '@supabase/supabase-js';

const viteEnv =
  typeof import.meta !== 'undefined' && import.meta && import.meta.env
    ? import.meta.env
    : {};
const rawSupabaseUrl =
  viteEnv.VITE_SUPABASE_URL || 'https://qbwnzunusmaidciakuod.supabase.co';
export const SUPABASE_URL = rawSupabaseUrl.replace(/^Https:\/\//, 'https://').trim();

const rawSupabaseAnonKey = (
  viteEnv.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_o0Sbv4yUi1DN-3WrEiL3GA_5d2a5oW6'
).trim();
export const SUPABASE_ANON_KEY = rawSupabaseAnonKey.replace(
  /^Sb_publishable_/,
  'sb_publishable_'
);

export const supabase =
  SUPABASE_URL && SUPABASE_ANON_KEY
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      })
    : null;

/**
 * Creates an isolated, in-memory Supabase client (never persisting to shared browser localStorage)
 * for multi-account E2E verification and cross-family isolation testing.
 */
export function createIsolatedSupabaseClient(customStorage) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  const memoryMap = new Map();
  const storage = customStorage || {
    getItem: (key) => (memoryMap.has(key) ? memoryMap.get(key) : null),
    setItem: (key, val) => {
      memoryMap.set(key, String(val));
    },
    removeItem: (key) => {
      memoryMap.delete(key);
    },
  };
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storage,
    },
  });
}

export default supabase;



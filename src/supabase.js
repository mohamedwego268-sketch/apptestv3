import { createClient } from '@supabase/supabase-js';

const viteEnv =
  typeof import.meta !== 'undefined' && import.meta && import.meta.env
    ? import.meta.env
    : {};
const rawSupabaseUrl =
  viteEnv.VITE_SUPABASE_URL || 'https://qbwnzunusmaidciakuod.supabase.co';
export const SUPABASE_URL = rawSupabaseUrl.replace(/^Https:\/\//, 'https://').trim();
export const SUPABASE_ANON_KEY = (
  viteEnv.VITE_SUPABASE_ANON_KEY ||
  'Sb_publishable_o0Sbv4yUi1DN-3WrEiL3GA_5d2a5oW6'
).trim();

export const supabase =
  SUPABASE_URL && SUPABASE_ANON_KEY
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      })
    : null;

export default supabase;

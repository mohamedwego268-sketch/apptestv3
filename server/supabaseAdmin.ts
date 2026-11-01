import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Load backend-only environment variables strictly from server/.env
dotenv.config({ path: path.resolve(process.cwd(), 'server/.env') });

const rawSupabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const normalizedSupabaseUrl = rawSupabaseUrl.replace(/^Https:\/\//, 'https://').trim();
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY || '';

if (!normalizedSupabaseUrl || !supabaseSecretKey) {
  console.warn('[Nekbaar Server] Missing SUPABASE_URL or SUPABASE_SECRET_KEY in server/.env');
}

/**
 * Server-only Supabase Admin Client.
 * Uses the backend secret key strictly on the server and must NEVER be imported by client code.
 */
export const supabaseAdmin =
  normalizedSupabaseUrl && supabaseSecretKey
    ? createClient(normalizedSupabaseUrl, supabaseSecretKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      })
    : null;

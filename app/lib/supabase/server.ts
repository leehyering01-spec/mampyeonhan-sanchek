import { createClient } from '@supabase/supabase-js';
import { getSupabaseEnv } from './env';

export function createSupabaseServer() {
  const env = getSupabaseEnv();
  if (!env) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL 또는 NEXT_PUBLIC_SUPABASE_ANON_KEY가 없습니다.');
  }
  return createClient(env.url, env.anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

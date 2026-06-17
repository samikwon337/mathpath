import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/** 시드 전용: service-role 키로 RLS를 우회한다. CLI에서만 호출. */
export function createAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL 가 설정되지 않았습니다.");
  if (!serviceKey)
    throw new Error("SUPABASE_SERVICE_ROLE_KEY 가 설정되지 않았습니다 (시드 전용).");
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

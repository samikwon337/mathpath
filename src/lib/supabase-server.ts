import { createClient } from "@supabase/supabase-js";

/** 서버 컴포넌트에서 공개 카탈로그를 읽는다. 세션 불필요(anon key). */
export function createServerSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

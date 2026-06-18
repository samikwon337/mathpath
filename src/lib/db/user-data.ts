import { supabase } from "@/lib/supabase";
import type { UserWorkbook, WorkbookStatus, Profile } from "@/data/types";

function mapUserWorkbook(r: Record<string, unknown>): UserWorkbook {
  return {
    id: r.id as string,
    userId: r.user_id as string,
    workbookId: r.workbook_id as string,
    status: r.status as WorkbookStatus,
    startedAt: (r.started_at as string | null) ?? undefined,
    completedAt: (r.completed_at as string | null) ?? undefined,
    note: (r.note as string | null) ?? undefined,
  };
}

export async function fetchUserWorkbooks(userId: string): Promise<UserWorkbook[]> {
  const { data, error } = await supabase
    .from("user_workbooks")
    .select("*")
    .eq("user_id", userId);
  if (error) throw new Error(`내 문제집 조회 실패: ${error.message}`);
  return (data ?? []).map(mapUserWorkbook);
}

export async function upsertUserWorkbook(input: {
  userId: string;
  workbookId: string;
  status: WorkbookStatus;
  startedAt?: string;
  completedAt?: string;
}): Promise<void> {
  const { error } = await supabase.from("user_workbooks").upsert(
    {
      user_id: input.userId,
      workbook_id: input.workbookId,
      status: input.status,
      started_at: input.startedAt ?? null,
      completed_at: input.completedAt ?? null,
    },
    { onConflict: "user_id,workbook_id" }
  );
  if (error) throw new Error(`상태 저장 실패: ${error.message}`);
}

export async function deleteUserWorkbook(userId: string, workbookId: string): Promise<void> {
  const { error } = await supabase
    .from("user_workbooks")
    .delete()
    .eq("user_id", userId)
    .eq("workbook_id", workbookId);
  if (error) throw new Error(`삭제 실패: ${error.message}`);
}

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw new Error(`프로필 조회 실패: ${error.message}`);
  if (!data) return null;
  return {
    id: data.id,
    displayName: data.display_name ?? "사용자",
    avatarUrl: data.avatar_url ?? undefined,
    currentGrade: data.current_grade ?? undefined,
    currentLevel: data.current_level ?? undefined,
    targetLevel: data.target_level ?? undefined,
  };
}

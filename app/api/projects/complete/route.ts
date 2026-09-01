import { fail, ok } from "@/lib/apiResponse";
import { getStudentSession } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

/**
 * 팀이 4단계까지 마쳤을 때 프로젝트를 '완료' 상태로 표시한다.
 * 완료 표시가 되면 교사 대시보드에서 확인할 수 있다.
 */
export async function POST() {
  const session = getStudentSession();
  if (!session) return fail("UNAUTHENTICATED", 401);

  const db = supabaseAdmin();

  try {
    const { data: membership } = await db
      .from("team_members")
      .select("team_id")
      .eq("student_id", session.id)
      .maybeSingle();

    if (!membership) return fail("FORBIDDEN", 403);

    const { data, error } = await db
      .from("projects")
      .update({ completed_at: new Date().toISOString(), current_stage: 5 })
      .eq("team_id", membership.team_id)
      .select("completed_at")
      .single();

    if (error) return fail("SAVE_FAILED", 500, error);
    return ok({ completedAt: data.completed_at });
  } catch (error) {
    return fail("SAVE_FAILED", 500, error);
  }
}

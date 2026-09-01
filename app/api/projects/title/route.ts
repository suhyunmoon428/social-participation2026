import { fail, ok } from "@/lib/apiResponse";
import { getStudentSession } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

/** 팀 주제명(projects.title) 저장 — 팀원 누구나 수정 가능 */
export async function POST(request: Request) {
  const session = getStudentSession();
  if (!session) return fail("UNAUTHENTICATED", 401);

  let title = "";
  try {
    title = ((await request.json())?.title ?? "").trim().slice(0, 80);
  } catch {
    return fail("INVALID_INPUT", 400);
  }

  if (title.length < 1) return fail("INVALID_INPUT", 400);

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
      .update({ title })
      .eq("team_id", membership.team_id)
      .select("title, updated_at")
      .single();

    if (error) return fail("SAVE_FAILED", 500, error);
    return ok({ title: data.title, updatedAt: data.updated_at });
  } catch (error) {
    return fail("SAVE_FAILED", 500, error);
  }
}

import { fail, ok } from "@/lib/apiResponse";
import { getStudentSession } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

/** 팀명(teams.name) 수정 — 조장(owner)만 가능 */
export async function POST(request: Request) {
  const session = getStudentSession();
  if (!session) return fail("UNAUTHENTICATED", 401);

  let name = "";
  try {
    name = ((await request.json())?.name ?? "").trim().slice(0, 40);
  } catch {
    return fail("INVALID_INPUT", 400);
  }

  if (name.length < 1) return fail("INVALID_INPUT", 400);

  const db = supabaseAdmin();

  try {
    const { data: membership } = await db
      .from("team_members")
      .select("team_id, role, teams(owner_id)")
      .eq("student_id", session.id)
      .maybeSingle();

    if (!membership) return fail("FORBIDDEN", 403);

    const ownerId = (membership as any).teams?.owner_id;
    if (membership.role !== "owner" && ownerId !== session.id) {
      return fail("FORBIDDEN", 403);
    }

    const { data, error } = await db
      .from("teams")
      .update({ name })
      .eq("id", membership.team_id)
      .select("name")
      .single();

    if (error) return fail("SAVE_FAILED", 500, error);
    return ok({ name: data.name });
  } catch (error) {
    return fail("SAVE_FAILED", 500, error);
  }
}

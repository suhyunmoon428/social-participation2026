import { fail, ok } from "@/lib/apiResponse";
import { getStudentSession } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { SUBMISSIONS_KEY, type ProjectContent } from "@/lib/stages";

export const runtime = "nodejs";

type Body = { stage?: number };

export async function POST(request: Request) {
  const session = getStudentSession();
  if (!session) return fail("UNAUTHENTICATED", 401);

  let body: Body;
  try {
    body = await request.json();
  } catch {
    return fail("INVALID_INPUT", 400);
  }

  const stage = Number(body.stage);
  if (!Number.isInteger(stage) || stage < 1 || stage > 5) {
    return fail("INVALID_INPUT", 400);
  }

  const db = supabaseAdmin();

  try {
    const { data: membership } = await db
      .from("team_members")
      .select("team_id")
      .eq("student_id", session.id)
      .maybeSingle();

    if (!membership) return fail("FORBIDDEN", 403);

    const { data: project, error: projectError } = await db
      .from("projects")
      .select("id, content, current_stage, completed_at")
      .eq("team_id", membership.team_id)
      .maybeSingle();

    if (projectError || !project) return fail("SAVE_FAILED", 500, projectError);

    const now = new Date().toISOString();
    const content = (project.content ?? {}) as ProjectContent;
    const nextContent: ProjectContent = {
      ...content,
      [SUBMISSIONS_KEY]: {
        ...(content[SUBMISSIONS_KEY] ?? {}),
        [String(stage)]: now,
      },
    };

    const nextStage = Math.max(project.current_stage, stage);
    const updates: Record<string, unknown> = {
      content: nextContent,
      current_stage: nextStage,
    };
    if (stage === 5) {
      updates.completed_at = project.completed_at ?? now;
    }

    const { data: updated, error: updateError } = await db
      .from("projects")
      .update(updates)
      .eq("id", project.id)
      .select("updated_at, completed_at")
      .single();

    if (updateError) return fail("SAVE_FAILED", 500, updateError);

    return ok({
      submittedAt: now,
      completedAt: updated?.completed_at ?? null,
      savedAt: updated?.updated_at ?? now,
    });
  } catch (error) {
    return fail("SAVE_FAILED", 500, error);
  }
}

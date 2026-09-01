import { fail, ok } from "@/lib/apiResponse";
import { getStudentSession } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { STAGE_BY_KEY, type ProjectContent } from "@/lib/stages";

export const runtime = "nodejs";

type Body = {
  stageKey?: string;
  fieldKey?: string;
  value?: string;
  currentStage?: number;
};

/**
 * 학생이 입력하는 즉시(디바운스 후) 호출되는 자동 저장 엔드포인트.
 */
export async function POST(request: Request) {
  const session = getStudentSession();
  if (!session) return fail("UNAUTHENTICATED", 401);

  let body: Body;
  try {
    body = await request.json();
  } catch {
    return fail("INVALID_INPUT", 400);
  }

  const stageKey = body.stageKey ?? "";
  const fieldKey = body.fieldKey ?? "";
  const value = typeof body.value === "string" ? body.value.slice(0, 20000) : null;

  const stageDef = STAGE_BY_KEY[stageKey];
  if (!stageDef || value === null) return fail("INVALID_INPUT", 400);
  if (!stageDef.fields.some((f) => f.key === fieldKey)) return fail("INVALID_INPUT", 400);

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
      .select("id, content, current_stage")
      .eq("team_id", membership.team_id)
      .maybeSingle();

    if (projectError || !project) return fail("SAVE_FAILED", 500, projectError);

    const content = (project.content ?? {}) as ProjectContent;
    const previous = content[stageKey]?.[fieldKey] ?? "";
    const nextContent: ProjectContent = {
      ...content,
      [stageKey]: { ...(content[stageKey] ?? {}), [fieldKey]: value },
    };

    const nextStage = Math.max(
      project.current_stage,
      Math.min(5, Number(body.currentStage) || project.current_stage)
    );

    const { data: updated, error: updateError } = await db
      .from("projects")
      .update({ content: nextContent, current_stage: nextStage })
      .eq("id", project.id)
      .select("updated_at")
      .single();

    if (updateError) return fail("SAVE_FAILED", 500, updateError);

    const delta = value.length - previous.length;
    if (delta !== 0) {
      await db.from("project_edits").insert({
        project_id: project.id,
        student_id: session.id,
        stage: stageDef.stage,
        field_key: fieldKey,
        char_delta: delta,
      });
    }

    return ok({
      savedAt: updated?.updated_at ?? new Date().toISOString(),
      lastEditor: {
        name: session.name,
        at: updated?.updated_at ?? new Date().toISOString(),
      },
    });
  } catch (error) {
    return fail("SAVE_FAILED", 500, error);
  }
}

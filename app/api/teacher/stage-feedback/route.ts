import { fail, ok } from "@/lib/apiResponse";
import { isTeacher } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { STAGE_BY_KEY } from "@/lib/stages";
import { mergeStageFeedback, type StageFeedbackStore } from "@/lib/stageFeedback";

export const runtime = "nodejs";

type Body = {
  teamId?: string;
  stageKey?: string;
  fieldKey?: string;
  content?: string;
};

export async function POST(request: Request) {
  if (!isTeacher()) return fail("FORBIDDEN", 403);

  let body: Body;
  try {
    body = await request.json();
  } catch {
    return fail("INVALID_INPUT", 400);
  }

  const teamId = body.teamId;
  const stageKey = body.stageKey ?? "";
  const fieldKey = body.fieldKey ?? "";
  const content = typeof body.content === "string" ? body.content.slice(0, 4000) : "";

  if (!teamId || !stageKey || !fieldKey) return fail("INVALID_INPUT", 400);

  const stageDef = STAGE_BY_KEY[stageKey];
  if (!stageDef?.fields.some((f) => f.key === fieldKey)) {
    return fail("INVALID_INPUT", 400);
  }

  const db = supabaseAdmin();

  try {
    const { data: existing } = await db
      .from("assessments")
      .select("stage_feedback")
      .eq("team_id", teamId)
      .maybeSingle();

    const current = (existing?.stage_feedback ?? {}) as StageFeedbackStore;
    const nextFeedback = mergeStageFeedback(current, stageKey, fieldKey, content);

    const { data, error } = await db
      .from("assessments")
      .upsert(
        {
          team_id: teamId,
          stage_feedback: nextFeedback,
          status: "reviewing",
        },
        { onConflict: "team_id" }
      )
      .select("stage_feedback, updated_at, status")
      .single();

    if (error) return fail("SAVE_FAILED", 500, error);
    return ok({
      stageFeedback: data.stage_feedback as StageFeedbackStore,
      updatedAt: data.updated_at,
      status: data.status,
    });
  } catch (error) {
    return fail("SAVE_FAILED", 500, error);
  }
}

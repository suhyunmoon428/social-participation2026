import { fail, ok } from "@/lib/apiResponse";
import { isTeacher } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { STAGES, stageCompletion, type ProjectContent } from "@/lib/stages";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: { teamId: string } }
) {
  if (!isTeacher()) return fail("FORBIDDEN", 403);

  const db = supabaseAdmin();

  try {
    const [{ data: team }, { data: project }, { data: members }] = await Promise.all([
      db.from("teams").select("id, name, join_code, created_at").eq("id", params.teamId).maybeSingle(),
      db
        .from("projects")
        .select("id, title, current_stage, content, ppt_outline, completed_at, updated_at")
        .eq("team_id", params.teamId)
        .maybeSingle(),
      db
        .from("team_members")
        .select("role, students(id, name, grade, class_no, student_no)")
        .eq("team_id", params.teamId),
    ]);

    if (!team) return fail("TEAM_NOT_FOUND", 404);

    const [{ data: edits }, { data: aiMessages }, { data: assessment }] = await Promise.all([
      project
        ? db.from("project_edits").select("student_id, stage, char_delta").eq("project_id", project.id)
        : Promise.resolve({ data: [] as any[] }),
      db
        .from("ai_messages")
        .select("stage, role, content, created_at, student_id")
        .eq("team_id", params.teamId)
        .order("created_at", { ascending: true }),
      db.from("assessments").select("*").eq("team_id", params.teamId).maybeSingle(),
    ]);

    const contributionMap = new Map<string, number>();
    for (const edit of edits ?? []) {
      const prev = contributionMap.get(edit.student_id) ?? 0;
      contributionMap.set(edit.student_id, prev + Math.max(0, edit.char_delta));
    }
    const totalChars = Array.from(contributionMap.values()).reduce((a, b) => a + b, 0) || 1;

    const content = (project?.content ?? {}) as ProjectContent;

    return ok({
      team: { id: team.id, name: team.name, joinCode: team.join_code, createdAt: team.created_at },
      project: project
        ? {
            id: project.id,
            title: project.title,
            currentStage: project.current_stage,
            content,
            pptOutline: project.ppt_outline,
            completedAt: project.completed_at,
            updatedAt: project.updated_at,
          }
        : null,
      stageProgress: STAGES.map((stage) => ({
        stage: stage.stage,
        title: stage.title,
        percent: stageCompletion(content, stage, (members ?? []).length),
      })),
      members: (members ?? []).map((m: any) => {
        const chars = contributionMap.get(m.students?.id) ?? 0;
        return {
          id: m.students?.id,
          name: m.students?.name ?? "이름 없음",
          label: m.students
            ? `${m.students.grade}학년 ${m.students.class_no}반 ${m.students.student_no}번`
            : "",
          role: m.role,
          chars,
          percent: Math.round((chars / totalChars) * 100),
          aiFeedbackCount: (aiMessages ?? []).filter(
            (msg: any) => msg.role === "assistant" && msg.student_id === m.students?.id
          ).length,
        };
      }),
      aiMessages: aiMessages ?? [],
      assessment: assessment ?? null,
    });
  } catch (error) {
    return fail("LOAD_FAILED", 500, error);
  }
}

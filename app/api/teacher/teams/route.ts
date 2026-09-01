import { fail, ok } from "@/lib/apiResponse";
import { isTeacher } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { STAGES, stageCompletion, type ProjectContent } from "@/lib/stages";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 전체 팀 진행 현황 목록(칸반/리스트 공용) */
export async function GET() {
  if (!isTeacher()) return fail("FORBIDDEN", 403);

  const db = supabaseAdmin();

  try {
    const { data: teams, error } = await db
      .from("teams")
      .select(
        "id, name, join_code, created_at, projects(id, title, current_stage, content, completed_at, updated_at), team_members(role, students(id, name)), assessments(status)"
      )
      .order("created_at", { ascending: true });

    if (error) return fail("LOAD_FAILED", 500, error);

    const rows = (teams ?? []).map((team: any) => {
      const project = Array.isArray(team.projects) ? team.projects[0] : team.projects;
      const content = (project?.content ?? {}) as ProjectContent;
      const assessment = Array.isArray(team.assessments) ? team.assessments[0] : team.assessments;

      return {
        id: team.id,
        name: team.name,
        topicTitle: project?.title ?? "주제 미정",
        joinCode: team.join_code,
        currentStage: project?.current_stage ?? 1,
        completedAt: project?.completed_at ?? null,
        lastActivityAt: project?.updated_at ?? team.created_at,
        assessmentStatus: assessment?.status ?? null,
        members: (team.team_members ?? []).map((m: any) => ({
          id: m.students?.id,
          name: m.students?.name ?? "이름 없음",
          role: m.role,
        })),
        stageProgress: STAGES.map((stage) => ({
          stage: stage.stage,
          percent: stageCompletion(content, stage, (team.team_members ?? []).length),
        })),
      };
    });

    return ok({ teams: rows });
  } catch (error) {
    return fail("LOAD_FAILED", 500, error);
  }
}

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import type { ProjectContent } from "@/lib/stages";
import type { StageFeedbackStore } from "@/lib/stageFeedback";
import { hasStageTeacherFeedback } from "@/lib/stageFeedback";
import { STAGES } from "@/lib/stages";

export type LastEditor = { name: string; at: string } | null;

export type TeacherFeedback = {
  content: string;
  stageFeedback: StageFeedbackStore;
  at: string;
  status: string;
} | null;

export type AiFeedback = {
  id: number;
  stage: number;
  content: string;
  at: string;
};

export type WorkspaceMeta = {
  lastEditor: LastEditor;
  teacherFeedback: TeacherFeedback;
  aiFeedbacks: AiFeedback[];
};

export type WorkspaceState = {
  team: { id: string; name: string; joinCode: string; ownerId: string } | null;
  members: {
    id: string;
    name: string;
    role: string;
    grade?: number;
    classNo?: number;
    studentNo?: number;
  }[];
  project: {
    id: string;
    title: string;
    currentStage: number;
    content: ProjectContent;
    pptOutline: unknown;
    completedAt: string | null;
    updatedAt: string;
  } | null;
  meta: WorkspaceMeta;
};

export async function loadProjectMeta(
  teamId: string,
  projectId: string,
  projectUpdatedAt: string
): Promise<WorkspaceMeta> {
  const db = supabaseAdmin();

  const [{ data: lastEdit }, { data: assessment }, { data: aiRows }] = await Promise.all([
    db
      .from("project_edits")
      .select("created_at, students(name)")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    db
      .from("assessments")
      .select("stage_feedback, updated_at, status")
      .eq("team_id", teamId)
      .maybeSingle(),
    db
      .from("ai_messages")
      .select("id, stage, content, created_at")
      .eq("team_id", teamId)
      .eq("role", "assistant")
      .order("created_at", { ascending: false })
      .limit(40),
  ]);

  const editRow = lastEdit as { created_at: string; students: { name: string } | null } | null;

  const lastEditor: LastEditor = editRow
    ? { name: editRow.students?.name ?? "팀원", at: editRow.created_at }
    : null;

  let teacherFeedback: TeacherFeedback = null;
  if (assessment) {
    const stageFeedback = (assessment.stage_feedback ?? {}) as StageFeedbackStore;
    const hasStageFb = STAGES.some((stage) => hasStageTeacherFeedback(stageFeedback, stage));
    if (hasStageFb) {
      teacherFeedback = {
        content: "",
        stageFeedback,
        at: assessment.updated_at,
        status: assessment.status,
      };
    }
  }

  const aiFeedbacks: AiFeedback[] = (aiRows ?? []).map((row: any) => ({
    id: row.id,
    stage: row.stage,
    content: row.content,
    at: row.created_at,
  }));

  return { lastEditor, teacherFeedback, aiFeedbacks };
}

export async function loadWorkspace(studentId: string): Promise<WorkspaceState> {
  const db = supabaseAdmin();

  const { data: membership } = await db
    .from("team_members")
    .select("team_id, teams(id, name, join_code, owner_id)")
    .eq("student_id", studentId)
    .maybeSingle();

  const teamRow = (membership as any)?.teams;
  if (!teamRow) {
    return {
      team: null,
      members: [],
      project: null,
      meta: { lastEditor: null, teacherFeedback: null, aiFeedbacks: [] },
    };
  }

  const [{ data: memberRows }, projectRow] = await Promise.all([
    db
      .from("team_members")
      .select("role, joined_at, students(id, name, grade, class_no, student_no)")
      .eq("team_id", teamRow.id)
      .order("joined_at", { ascending: true }),
    ensureProject(teamRow.id),
  ]);

  const meta = projectRow
    ? await loadProjectMeta(teamRow.id, projectRow.id, projectRow.updatedAt)
    : { lastEditor: null, teacherFeedback: null, aiFeedbacks: [] };

  return {
    team: {
      id: teamRow.id,
      name: teamRow.name,
      joinCode: teamRow.join_code,
      ownerId: teamRow.owner_id,
    },
    members: (memberRows ?? []).map((row: any) => ({
      id: row.students?.id,
      name: row.students?.name ?? "이름 없음",
      role: row.role,
      grade: row.students?.grade,
      classNo: row.students?.class_no,
      studentNo: row.students?.student_no,
    })),
    project: projectRow,
    meta,
  };
}

export async function ensureProject(teamId: string, initialTitle = "주제를 입력해 주세요"): Promise<WorkspaceState["project"]> {
  const db = supabaseAdmin();
  const columns = "id, title, current_stage, content, ppt_outline, completed_at, updated_at";

  const { data: existing } = await db
    .from("projects")
    .select(columns)
    .eq("team_id", teamId)
    .maybeSingle();

  const row =
    existing ??
    (
      await db
        .from("projects")
        .insert({ team_id: teamId, content: {}, title: initialTitle })
        .select(columns)
        .single()
    ).data;

  if (!row) return null;

  return {
    id: row.id,
    title: row.title,
    currentStage: row.current_stage,
    content: (row.content ?? {}) as ProjectContent,
    pptOutline: row.ppt_outline,
    completedAt: row.completed_at,
    updatedAt: row.updated_at,
  };
}

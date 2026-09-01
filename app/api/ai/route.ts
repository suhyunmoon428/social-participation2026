import { fail, ok } from "@/lib/apiResponse";
import { getStudentSession } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  COACH_SYSTEM_PROMPT,
  OUTLINE_SYSTEM_PROMPT,
  chatComplete,
  OpenRouterError,
  type ChatMessage,
} from "@/lib/openrouter";
import { STAGES, STAGE_BY_KEY, contentToPlainText, type ProjectContent } from "@/lib/stages";

export const runtime = "nodejs";
export const maxDuration = 60;

type Body = {
  mode?: "feedback" | "outline";
  stageKey?: string;
};

const FULL_FEEDBACK_REQUEST = [
  "이 단계 내용에 대한 종합 피드백을 주세요.",
  "다음 항목을 모두 포함해 주세요:",
  "1) 내용 검토 — 잘 쓴 점과 보완이 필요한 점",
  "2) 근거 점검 — 논리적 비약, 부족한 통계·출처",
  "3) 부작용 점검 — 예상 부작용과 반대 의견",
].join("\n");

export async function POST(request: Request) {
  const session = getStudentSession();
  if (!session) return fail("UNAUTHENTICATED", 401);

  let body: Body;
  try {
    body = await request.json();
  } catch {
    return fail("INVALID_INPUT", 400);
  }

  const mode = body.mode ?? "feedback";
  const db = supabaseAdmin();

  try {
    const { data: membership } = await db
      .from("team_members")
      .select("team_id")
      .eq("student_id", session.id)
      .maybeSingle();

    if (!membership) return fail("FORBIDDEN", 403);

    const { data: project } = await db
      .from("projects")
      .select("id, content")
      .eq("team_id", membership.team_id)
      .maybeSingle();

    const content = (project?.content ?? {}) as ProjectContent;

    if (mode === "outline") {
      const answer = await chatComplete(
        [
          { role: "system", content: OUTLINE_SYSTEM_PROMPT },
          {
            role: "user",
            content: `다음은 우리 팀이 서식1~4에 기록한 내용 전체입니다.\n\n${contentToPlainText(content)}\n\n이 기록만을 근거로 20매 분량 발표 개요를 작성해 주세요.`,
          },
        ],
        { maxTokens: 3000, temperature: 0.5 }
      );

      if (project) {
        await db
          .from("projects")
          .update({
            ppt_outline: { markdown: answer, generatedAt: new Date().toISOString() },
          })
          .eq("id", project.id);
      }

      await db.from("ai_messages").insert({
        team_id: membership.team_id,
        student_id: session.id,
        stage: 4,
        role: "assistant",
        content: answer,
      });

      return ok({ answer });
    }

    const stageKey = body.stageKey ?? "stage1";
    const stageDef = STAGE_BY_KEY[stageKey] ?? STAGES[0];
    const feedbackRequest = FULL_FEEDBACK_REQUEST;

    const stageValues = content[stageKey] ?? {};
    const stageText = stageDef.fields
      .map((f) => `- ${f.label}: ${(stageValues[f.key] ?? "").trim() || "(작성 전)"}`)
      .join("\n");

    const { data: history } = await db
      .from("ai_messages")
      .select("role, content")
      .eq("team_id", membership.team_id)
      .eq("stage", stageDef.stage)
      .order("created_at", { ascending: false })
      .limit(6);

    const priorMessages: ChatMessage[] = (history ?? [])
      .reverse()
      .filter((row: any) => row.role === "assistant")
      .slice(-3)
      .map((row: any) => ({ role: row.role, content: row.content }));

    const userPrompt = [
      `현재 단계: ${stageDef.title}`,
      `단계 목표: ${stageDef.summary}`,
      "",
      "우리 팀이 지금까지 이 단계에 쓴 내용:",
      stageText,
      "",
      `피드백 요청: ${feedbackRequest}`,
    ].join("\n");

    const answer = await chatComplete(
      [
        { role: "system", content: COACH_SYSTEM_PROMPT },
        ...priorMessages,
        { role: "user", content: userPrompt },
      ],
      { maxTokens: 1600, temperature: 0.7 }
    );

    await db.from("ai_messages").insert([
      {
        team_id: membership.team_id,
        student_id: session.id,
        stage: stageDef.stage,
        role: "user",
        content: feedbackRequest,
      },
      {
        team_id: membership.team_id,
        student_id: session.id,
        stage: stageDef.stage,
        role: "assistant",
        content: answer,
      },
    ]);

    return ok({ answer });
  } catch (error) {
    if (error instanceof OpenRouterError) return fail(error.code, 502, error.cause ?? error);
    return fail("AI_FAILED", 502, error);
  }
}

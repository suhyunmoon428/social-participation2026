"use client";

import { useState } from "react";
import { Markdown } from "@/components/Markdown";
import { useToast } from "@/components/Toast";
import { apiFetch } from "@/lib/fetcher";
import { formatKoreanDateTime } from "@/lib/format";
import type { AiFeedback, TeacherFeedback } from "@/lib/workspace";
import { formatStageTeacherFeedback } from "@/lib/stageFeedback";
import type { StageDef } from "@/lib/stages";

type Props = {
  stage: StageDef;
  aiFeedbacks: AiFeedback[];
  teacherFeedback: TeacherFeedback;
  stageSubmittedAt?: string | null;
  teacherFeedbackIsNew?: boolean;
  onAckTeacherFeedback?: () => void;
  onNewAiFeedback?: (feedback: AiFeedback) => void;
  onSubmitStage?: () => Promise<void>;
};

export function FeedbackPanel({
  stage,
  aiFeedbacks,
  teacherFeedback,
  stageSubmittedAt,
  teacherFeedbackIsNew,
  onAckTeacherFeedback,
  onNewAiFeedback,
  onSubmitStage,
}: Props) {
  const { show } = useToast();
  const [aiBusy, setAiBusy] = useState(false);
  const [submitBusy, setSubmitBusy] = useState(false);
  const stageAi = aiFeedbacks.filter((f) => f.stage === stage.stage);
  const latestAi = stageAi[0] ?? null;
  const stageTeacherContent = formatStageTeacherFeedback(teacherFeedback?.stageFeedback, stage);

  async function requestFeedback() {
    if (aiBusy) return;
    setAiBusy(true);
    try {
      const result = await apiFetch<{ answer: string }>("/api/ai", {
        method: "POST",
        body: JSON.stringify({ mode: "feedback", stageKey: stage.key }),
      });
      const now = new Date().toISOString();
      onNewAiFeedback?.({
        id: Date.now(),
        stage: stage.stage,
        content: result.answer,
        at: now,
      });
      show("AI 피드백을 받았어요! ✨", "success");
    } catch (error) {
      show((error as Error).message, "error");
    } finally {
      setAiBusy(false);
    }
  }

  async function submitToTeacher() {
    if (submitBusy || !onSubmitStage) return;
    setSubmitBusy(true);
    try {
      await onSubmitStage();
    } finally {
      setSubmitBusy(false);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-white/80 backdrop-blur-sm">
      <div className="grid shrink-0 grid-cols-1 gap-3 p-4">
        <div className="flex min-h-[220px] flex-col rounded-xl border border-violet-100 bg-gradient-to-br from-violet-50 to-white p-3.5 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-lg">🤖</span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-violet-700">AI 피드백</p>
              {latestAi ? (
                <p className="truncate text-[10px] text-violet-400">
                  {formatKoreanDateTime(latestAi.at)}
                </p>
              ) : (
                <p className="text-[10px] text-violet-300">이 단계 내용을 검토해 줘요</p>
              )}
            </div>
          </div>

          <div className="mt-2 min-h-[120px] flex-1 overflow-y-auto text-[12px] leading-5 text-slate-600">
            {aiBusy ? (
              <p className="text-violet-500">✨ AI가 이 단계 내용을 검토하고 있어요…</p>
            ) : latestAi ? (
              <Markdown text={latestAi.content} />
            ) : (
              <p className="text-slate-400">
                아래 버튼을 누르면 내용 검토·근거 점검·부작용 점검을 포함한 AI 피드백이
                제공돼요. 먼저 이 단계 칸을 어느 정도 채운 뒤 요청해 주세요.
              </p>
            )}
          </div>

          <button
            type="button"
            className="mt-3 w-full rounded-lg bg-violet-600 px-3 py-2 text-[12px] font-semibold text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-wait disabled:opacity-60"
            disabled={aiBusy || submitBusy}
            onClick={requestFeedback}
          >
            {aiBusy
              ? "분석 중…"
              : latestAi
                ? "🔄 AI 피드백 다시 받기"
                : "✨ AI 피드백 받기"}
          </button>
        </div>

        <div className="flex min-h-[220px] flex-col rounded-xl border border-sky-100 bg-gradient-to-br from-sky-50 to-white p-3.5 shadow-sm">
          {teacherFeedbackIsNew && (
            <button
              type="button"
              className="mb-2 rounded-lg border border-sky-300 bg-sky-100 px-3 py-2 text-left text-[11px] font-semibold text-sky-800 transition hover:bg-sky-200"
              onClick={onAckTeacherFeedback}
            >
              🔔 선생님 피드백이 도착했어요! 클릭하여 확인
            </button>
          )}

          <div className="flex items-center gap-2">
            <span className="text-lg">👩‍🏫</span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-sky-700">선생님 피드백</p>
              {teacherFeedback?.at ? (
                <p className="truncate text-[10px] text-sky-400">
                  {formatKoreanDateTime(teacherFeedback.at)}
                </p>
              ) : (
                <p className="text-[10px] text-sky-300">제출 후 선생님이 작성해 주세요</p>
              )}
            </div>
          </div>

          <div className="mt-2 flex-1 overflow-y-auto text-[12px] leading-5 text-slate-600">
            {stageTeacherContent ? (
              <Markdown text={stageTeacherContent} />
            ) : (
              <p className="text-slate-400">
                이 단계를 선생님께 제출하면, 선생님이 항목별로 피드백을 남겨 주세요.
              </p>
            )}
          </div>

          {stageSubmittedAt && (
            <p className="mt-2 text-[10px] text-sky-500">
              제출 완료 · {formatKoreanDateTime(stageSubmittedAt)}
            </p>
          )}

          <button
            type="button"
            className="mt-3 w-full rounded-lg bg-sky-600 px-3 py-2 text-[12px] font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={submitBusy || aiBusy || !onSubmitStage || Boolean(stageSubmittedAt)}
            onClick={submitToTeacher}
          >
            {submitBusy
              ? "제출 중…"
              : stageSubmittedAt
                ? "✓ 선생님께 제출 완료"
                : "👩‍🏫 선생님께 제출하기"}
          </button>
        </div>
      </div>
    </div>
  );
}

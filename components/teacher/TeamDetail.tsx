"use client";

import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/components/Toast";
import { apiFetch } from "@/lib/fetcher";
import { STAGES, parseActivityCard, parseAnalysisForm, parseMemberRoles, type ProjectContent } from "@/lib/stages";
import type { StageFeedbackStore } from "@/lib/stageFeedback";
import { getFieldFeedback } from "@/lib/stageFeedback";
import { TeacherFieldFeedback } from "@/components/teacher/TeacherFieldFeedback";

type Detail = {
  team: { id: string; name: string; joinCode: string; createdAt: string };
  project: {
    id: string;
    title: string;
    currentStage: number;
    content: ProjectContent;
    pptOutline: { markdown?: string } | null;
    completedAt: string | null;
    updatedAt: string;
  } | null;
  stageProgress: { stage: number; title: string; percent: number }[];
  members: {
    id: string;
    name: string;
    label: string;
    role: string;
    chars: number;
    percent: number;
    aiFeedbackCount: number;
  }[];
  assessment: {
    stage_feedback: StageFeedbackStore | null;
    status: string;
  } | null;
};

export function TeamDetail({ teamId, onBack }: { teamId: string; onBack: () => void }) {
  const { show } = useToast();
  const [detail, setDetail] = useState<Detail | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await apiFetch<Detail>(`/api/teacher/teams/${teamId}`, { cache: "no-store" });
      setDetail(data);
    } catch (error) {
      show((error as Error).message, "error");
    }
  }, [teamId, show]);

  useEffect(() => {
    load();
  }, [load]);

  if (!detail) {
    return (
      <main className="flex min-h-screen items-center justify-center text-sm text-ink-400">
        불러오는 중…
      </main>
    );
  }

  const content = detail.project?.content ?? {};
  const stageFeedback = (detail.assessment?.stage_feedback ?? {}) as StageFeedbackStore;

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10">
      <button type="button" onClick={onBack} className="text-sm text-ink-400 hover:text-ink-700">
        ← 전체 팀 목록
      </button>

      <header className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink-900">{detail.team.name}</h1>
          <p className="mt-1 text-sm font-medium text-violet-700">📌 {detail.project?.title ?? "주제 미정"}</p>
          <p className="mt-1 text-sm text-ink-500">
            참여 코드 <span className="font-mono">{detail.team.joinCode}</span> · 현재{" "}
            {detail.project?.currentStage ?? 1}단계
            {detail.project?.completedAt ? " · 제출 완료" : ""}
          </p>
        </div>
      </header>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {detail.stageProgress.map((p) => (
          <div key={p.stage} className="np-card">
            <p className="text-xs text-ink-400">{p.title}</p>
            <p className="mt-2 text-2xl font-semibold text-ink-900">{p.percent}%</p>
            <span className="mt-2 block h-1 w-full rounded-full bg-ink-200">
              <span className="block h-1 rounded-full bg-ink-700" style={{ width: `${p.percent}%` }} />
            </span>
          </div>
        ))}
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-ink-900">개인별 작성 기여도</h2>
        <div className="mt-3 overflow-x-auto rounded-lg border border-ink-200">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="bg-ink-50 text-left text-xs uppercase tracking-wide text-ink-400">
              <tr>
                <th className="px-4 py-3">학생</th>
                <th className="px-4 py-3">작성 글자수</th>
                <th className="px-4 py-3">기여 비율</th>
                <th className="px-4 py-3">AI 피드백</th>
              </tr>
            </thead>
            <tbody>
              {detail.members.map((member) => (
                <tr key={member.id} className="border-t border-ink-200">
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink-900">{member.name}</p>
                    <p className="text-[11px] text-ink-400">{member.label}</p>
                  </td>
                  <td className="px-4 py-3 text-ink-600">{member.chars.toLocaleString()}자</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-24 rounded-full bg-ink-200">
                        <span
                          className="block h-1.5 rounded-full bg-ink-700"
                          style={{ width: `${member.percent}%` }}
                        />
                      </span>
                      <span className="text-xs text-ink-500">{member.percent}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-ink-600">{member.aiFeedbackCount}회</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10 space-y-6">
        <h2 className="text-lg font-semibold text-ink-900">단계별 기록</h2>
        {STAGES.map((stage) => (
          <details key={stage.key} className="np-card" open={stage.stage === 1}>
            <summary className="cursor-pointer text-sm font-semibold text-ink-800">
              {stage.title}
            </summary>
            <div className="mt-4 space-y-4">
              {stage.fields.map((field) => {
                const raw = content[stage.key]?.[field.key]?.trim() ?? "";
                let display = raw || "(작성 전)";
                if ((field.type === "memberRoles" || field.type === "memberReflection") && raw) {
                  const map = parseMemberRoles(raw);
                  display =
                    detail.members
                      .map((m) => `${m.name}: ${map[m.id]?.trim() || "(작성 전)"}`)
                      .join("\n\n") || "(작성 전)";
                }
                if (field.type === "activityCard" && raw) {
                  const row = parseActivityCard(raw);
                  display = [
                    `활동 내용: ${row.content || "-"}`,
                    `기간: ${row.period || "-"}`,
                    `장소: ${row.place || "-"}`,
                    `방법: ${row.method || "-"}`,
                    `준비: ${row.prep || "-"}`,
                    `결과: ${row.result || "-"}`,
                  ].join("\n");
                }
                if (field.type === "analysisFormPdf" && raw) {
                  const form = parseAnalysisForm(raw);
                  display = [
                    form.notes ? `설명: ${form.notes}` : "",
                    form.pdf ? `PDF: ${form.pdf.fileName}` : "PDF: (미첨부)",
                  ]
                    .filter(Boolean)
                    .join("\n");
                }
                return (
                  <div key={field.key}>
                    <p className="text-xs font-medium text-ink-400">{field.label}</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-ink-700">
                      {display}
                    </p>
                    <TeacherFieldFeedback
                      teamId={teamId}
                      stageKey={stage.key}
                      fieldKey={field.key}
                      initial={getFieldFeedback(stageFeedback, stage.key, field.key)}
                      onSaved={load}
                    />
                  </div>
                );
              })}
            </div>
          </details>
        ))}
      </section>
    </main>
  );
}

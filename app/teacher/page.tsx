"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { TeamDetail } from "@/components/teacher/TeamDetail";
import { useToast } from "@/components/Toast";
import { apiFetch } from "@/lib/fetcher";
import { STAGES } from "@/lib/stages";

export type TeacherTeam = {
  id: string;
  name: string;
  topicTitle: string;
  joinCode: string;
  currentStage: number;
  completedAt: string | null;
  lastActivityAt: string;
  assessmentStatus: string | null;
  members: { id: string; name: string; role: string }[];
  stageProgress: { stage: number; percent: number }[];
};

export default function TeacherPage() {
  const { show } = useToast();
  const [authorized, setAuthorized] = useState(false);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [teams, setTeams] = useState<TeacherTeam[]>([]);
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [selected, setSelected] = useState<string | null>(null);

  const loadTeams = useCallback(async () => {
    try {
      const data = await apiFetch<{ teams: TeacherTeam[] }>("/api/teacher/teams", {
        cache: "no-store",
      });
      setTeams(data.teams);
      setAuthorized(true);
      return true;
    } catch (error) {
      setAuthorized(false);
      throw error;
    }
  }, []);

  useEffect(() => {
    loadTeams().catch(() => {
      // 로그인 전 403은 정상 — 오류 토스트를 띄우지 않는다.
    });
  }, [loadTeams]);

  async function login(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      await apiFetch("/api/teacher/login", {
        method: "POST",
        body: JSON.stringify({ password }),
      });
      setPassword("");
      await loadTeams();
    } catch (error) {
      show((error as Error).message, "error");
    } finally {
      setBusy(false);
    }
  }

  if (!authorized) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center px-6">
        <h1 className="text-xl font-semibold text-ink-900">교사용 대시보드</h1>
        <p className="mt-2 text-sm leading-6 text-ink-500">
          관리자 비밀번호를 입력하면 전체 팀의 진행 현황을 확인할 수 있습니다.
        </p>
        <form onSubmit={login} className="mt-6 space-y-3">
          <input
            className="np-input"
            type="password"
            placeholder="관리자 비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button className="np-button w-full" disabled={busy}>
            {busy ? "확인 중…" : "입장하기"}
          </button>
        </form>
        <Link href="/" className="mt-8 text-center text-xs text-ink-400 hover:text-ink-600 hover:underline">
          학생 화면으로 돌아가기
        </Link>
      </main>
    );
  }

  if (selected) {
    return <TeamDetail teamId={selected} onBack={() => { setSelected(null); loadTeams(); }} />;
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink-900">사회참여활동 진행 현황</h1>
          <p className="mt-1 text-sm text-ink-500">전체 {teams.length}팀 · 팀을 클릭하면 상세 기록과 개인별 기여도를 볼 수 있습니다.</p>
        </div>
        <div className="flex gap-1 rounded-lg bg-ink-100 p-1">
          {(
            [
              ["kanban", "칸반"],
              ["list", "리스트"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setView(key)}
              className={[
                "rounded-md px-3 py-1.5 text-sm font-medium transition",
                view === key ? "bg-white text-ink-900 shadow-sm" : "text-ink-500",
              ].join(" ")}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      {teams.length === 0 && (
        <p className="mt-16 text-center text-sm text-ink-400">아직 개설된 팀이 없습니다.</p>
      )}

      {view === "kanban" ? (
        <div className="mt-8 grid gap-3 md:grid-cols-3 xl:grid-cols-5">
          {STAGES.map((stage) => {
            const column = teams.filter((team) => team.currentStage === stage.stage);
            return (
              <section key={stage.key} className="rounded-lg bg-ink-50/70 p-3">
                <h2 className="px-1 pb-2 text-sm font-semibold text-ink-700">
                  {stage.shortTitle}
                  <span className="ml-2 text-xs font-normal text-ink-400">{column.length}팀</span>
                </h2>
                <div className="space-y-2">
                  {column.map((team) => (
                    <button
                      key={team.id}
                      type="button"
                      onClick={() => setSelected(team.id)}
                      className="w-full rounded-md border border-ink-200 bg-white p-3 text-left transition hover:border-ink-400"
                    >
                      <p className="truncate text-sm font-medium text-ink-900">{team.name}</p>
                      <p className="truncate text-[11px] text-ink-500">📌 {team.topicTitle}</p>
                      <p className="mt-1 truncate text-xs text-ink-500">
                        {team.members.map((m) => m.name).join(", ") || "팀원 없음"}
                      </p>
                      <div className="mt-2 flex gap-1">
                        {team.stageProgress.map((p) => (
                          <span key={p.stage} className="h-1 flex-1 rounded-full bg-ink-200">
                            <span
                              className="block h-1 rounded-full bg-ink-700"
                              style={{ width: `${p.percent}%` }}
                            />
                          </span>
                        ))}
                      </div>
                      {team.completedAt && (
                        <p className="mt-2 text-[11px] text-ink-500">제출 완료</p>
                      )}
                    </button>
                  ))}
                  {column.length === 0 && (
                    <p className="px-1 py-3 text-xs text-ink-400">해당 단계 팀 없음</p>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-lg border border-ink-200">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-ink-50 text-left text-xs uppercase tracking-wide text-ink-400">
              <tr>
                <th className="px-4 py-3">팀</th>
                <th className="px-4 py-3">팀원</th>
                <th className="px-4 py-3">현재 단계</th>
                <th className="px-4 py-3">단계별 진행률</th>
                <th className="px-4 py-3">평가</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team) => (
                <tr
                  key={team.id}
                  onClick={() => setSelected(team.id)}
                  className="cursor-pointer border-t border-ink-200 hover:bg-ink-50"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink-900">{team.name}</p>
                    <p className="truncate text-[11px] text-ink-500">📌 {team.topicTitle}</p>
                    <p className="font-mono text-[11px] text-ink-400">{team.joinCode}</p>
                  </td>
                  <td className="px-4 py-3 text-ink-600">
                    {team.members.map((m) => m.name).join(", ") || "-"}
                  </td>
                  <td className="px-4 py-3 text-ink-600">{team.currentStage}단계</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {team.stageProgress.map((p) => (
                        <span key={p.stage} className="h-1.5 w-10 rounded-full bg-ink-200">
                          <span
                            className="block h-1.5 rounded-full bg-ink-700"
                            style={{ width: `${p.percent}%` }}
                          />
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-500">
                    {team.assessmentStatus === "approved"
                      ? "승인 완료"
                      : team.assessmentStatus === "reviewing"
                      ? "검토 중"
                      : "미작성"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

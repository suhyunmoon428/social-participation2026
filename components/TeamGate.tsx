"use client";

import { useState } from "react";
import { useToast } from "@/components/Toast";
import { apiFetch } from "@/lib/fetcher";

export function TeamGate({
  studentName,
  onJoined,
}: {
  studentName: string;
  onJoined: () => void;
}) {
  const { show } = useToast();
  const [tab, setTab] = useState<"create" | "join">("create");
  const [teamName, setTeamName] = useState("");
  const [topicTitle, setTopicTitle] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;

    if (tab === "create") {
      if (!teamName.trim()) {
        show("팀명을 입력해 주세요.", "error");
        return;
      }
      if (!topicTitle.trim()) {
        show("주제명을 입력해 주세요. (나중에 언제든 바꿀 수 있어요)", "error");
        return;
      }
    }

    setBusy(true);
    try {
      await apiFetch("/api/teams", {
        method: "POST",
        body:
          tab === "create"
            ? JSON.stringify({
                action: "create",
                teamName: teamName.trim(),
                topicTitle: topicTitle.trim(),
              })
            : JSON.stringify({ action: "join", joinCode: joinCode.trim().toUpperCase() }),
      });
      show(
        tab === "create" ? "팀 방을 만들었어요! 팀원에게 참여 코드를 알려주세요." : "팀에 참여했어요!",
        "success"
      );
      onJoined();
    } catch (error) {
      show((error as Error).message, "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen ws-gradient">
      <div className="mx-auto flex w-full max-w-lg flex-col justify-center px-6 py-12">
        <p className="text-2xl">👥</p>
        <h1 className="mt-3 text-2xl font-bold text-slate-900">{studentName} 학생, 팀을 정해볼까요?</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          {tab === "create"
            ? "👑 조장(팀 개설자)이 팀명과 주제명을 입력해요. 팀원은 참여 코드로 합류합니다."
            : "조장에게 받은 6자리 참여 코드를 입력해 주세요."}
        </p>

        <div className="mt-8 flex gap-1 rounded-xl bg-white/80 p-1 shadow-sm">
          {(
            [
              ["create", "👑 조장 · 팀 개설"],
              ["join", "🔑 팀원 · 참여"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={[
                "flex-1 rounded-lg px-3 py-2.5 text-sm font-semibold transition",
                tab === key ? "bg-violet-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-700",
              ].join(" ")}
            >
              {label}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="mt-6 space-y-4">
          {tab === "create" ? (
            <>
              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-violet-700">👑 팀명</span>
                <input
                  className="np-input"
                  placeholder="예: 2-3 탐구 A팀"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                />
                <span className="text-[11px] text-slate-400">서식에 적는 팀 이름이에요.</span>
              </label>
              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-violet-700">📌 주제명</span>
                <input
                  className="np-input"
                  placeholder="예: 학교 주변 미세먼지 저감 방안"
                  value={topicTitle}
                  onChange={(e) => setTopicTitle(e.target.value)}
                />
                <span className="text-[11px] text-slate-400">
                  활동하면서 주제가 바뀌어도 괜찮아요. 워크스페이스에서 언제든 수정할 수 있어요.
                </span>
              </label>
            </>
          ) : (
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-slate-500">참여 코드 (6자리)</span>
              <input
                className="np-input font-mono tracking-[0.3em] uppercase"
                placeholder="ABC234"
                maxLength={6}
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              />
            </label>
          )}

          <button className="np-button w-full" disabled={busy}>
            {busy ? "처리 중…" : tab === "create" ? "👑 팀 방 만들기" : "🔑 팀에 참여하기"}
          </button>
        </form>
      </div>
    </main>
  );
}

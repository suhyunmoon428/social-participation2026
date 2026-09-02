"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CollaboratorBar } from "@/components/CollaboratorBar";
import { FeedbackPanel } from "@/components/FeedbackPanel";
import { EditableTeamName, EditableTopicTitle } from "@/components/EditableTopicTitle";
import { ExportStageReportButton } from "@/components/ExportStageReportButton";
import { StageFieldEditor } from "@/components/StageFieldEditor";
import { useToast } from "@/components/Toast";
import {
  DDAY_TONE_CLASS,
  STAGE_DEADLINE_LABELS,
  STAGE_DEADLINES,
  getDday,
} from "@/lib/deadlines";
import { apiFetch } from "@/lib/fetcher";
import { formatKoreanDateTime } from "@/lib/format";
import { isRealtimeConfigured, supabaseBrowser } from "@/lib/supabaseBrowser";
import { STAGE_COUNT, STAGES, getStageSubmissions, migrateStage4, stageCompletion, type ProjectContent, type StageDef } from "@/lib/stages";
import { getFieldFeedback } from "@/lib/stageFeedback";
import type { AiFeedback, LastEditor, TeacherFeedback } from "@/lib/workspace";
import {
  peersOnField,
  prunePeers,
  type PeerPresence,
} from "@/lib/presence";

type WorkspaceData = {
  student: { id: string; name: string };
  team: { id: string; name: string; joinCode: string; ownerId: string };
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
    pptOutline: { markdown?: string } | null;
    completedAt: string | null;
    updatedAt: string;
  };
  meta: {
    lastEditor: LastEditor;
    teacherFeedback: TeacherFeedback;
    aiFeedbacks: AiFeedback[];
  };
};

type SaveState = "idle" | "saving" | "saved" | "error";

export function Workspace({ data, onLogout }: { data: WorkspaceData; onLogout: () => void }) {
  const { show } = useToast();
  const [members, setMembers] = useState(data.members);
  const [content, setContent] = useState<ProjectContent>(() => migrateStage4(data.project.content ?? {}));
  const [activeStage, setActiveStage] = useState<StageDef>(
    STAGES[Math.min(STAGE_COUNT - 1, Math.max(0, data.project.currentStage - 1))]
  );
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [lastEditor, setLastEditor] = useState<LastEditor>(data.meta.lastEditor);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(data.project.updatedAt);
  const [teacherFeedback, setTeacherFeedback] = useState<TeacherFeedback>(data.meta.teacherFeedback);
  const [teacherFeedbackSeenAt, setTeacherFeedbackSeenAt] = useState<string | null>(() => {
    if (typeof window === "undefined" || !data.meta.teacherFeedback?.at) return null;
    return localStorage.getItem(`teacherFeedbackSeen:${data.team.id}`);
  });
  const [aiFeedbacks, setAiFeedbacks] = useState<AiFeedback[]>(data.meta.aiFeedbacks);
  const [completedAt, setCompletedAt] = useState<string | null>(data.project.completedAt);
  const [topicTitle, setTopicTitle] = useState(data.project.title || "주제를 입력해 주세요");
  const [teamName, setTeamName] = useState(data.team.name);
  const [peers, setPeers] = useState<Record<string, PeerPresence>>({});
  const [realtimeStatus, setRealtimeStatus] = useState<
    "disabled" | "connecting" | "connected" | "error"
  >(() => (isRealtimeConfigured() ? "connecting" : "disabled"));

  const isOwner = data.student.id === data.team.ownerId;

  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const focusedField = useRef<string | null>(null);
  const presenceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPresenceSent = useRef(0);
  const lastCursorRef = useRef(0);
  const saveStateRef = useRef<SaveState>("idle");
  const channelRef = useRef<ReturnType<NonNullable<ReturnType<typeof supabaseBrowser>>["channel"]> | null>(null);

  useEffect(() => {
    saveStateRef.current = saveState;
  }, [saveState]);

  const broadcastPresence = useCallback(
    (stageKey: string, fieldKey: string, cursor?: number, force = false) => {
      const now = Date.now();
      if (!force && now - lastPresenceSent.current < 60) return;
      lastPresenceSent.current = now;

      if (cursor !== undefined) lastCursorRef.current = cursor;

      const stage = STAGES.find((s) => s.key === stageKey);
      const field = stage?.fields.find((f) => f.key === fieldKey);

      const payload: PeerPresence = {
        studentId: data.student.id,
        studentName: data.student.name,
        stageKey,
        fieldKey,
        fieldLabel: field?.label,
        cursor: cursor ?? lastCursorRef.current,
        updatedAt: now,
      };

      setPeers((prev) => prunePeers({ ...prev, [data.student.id]: payload }));

      channelRef.current?.send({
        type: "broadcast",
        event: "presence",
        payload,
      });
    },
    [data.student.id, data.student.name]
  );

  const reportFieldPresence = useCallback(
    (stageKey: string, fieldKey: string, cursor?: number, force = false) => {
      if (force) {
        broadcastPresence(stageKey, fieldKey, cursor, true);
        return;
      }
      if (presenceTimer.current) clearTimeout(presenceTimer.current);
      presenceTimer.current = setTimeout(() => broadcastPresence(stageKey, fieldKey, cursor), 30);
    },
    [broadcastPresence]
  );

  const memberCount = members.length;

  const activePeers = useMemo(() => Object.values(peers), [peers]);

  const teacherFeedbackIsNew = Boolean(
    teacherFeedback &&
      (!teacherFeedbackSeenAt || teacherFeedback.at > teacherFeedbackSeenAt)
  );

  const prevFeedbackAt = useRef<string | null>(teacherFeedback?.at ?? null);

  useEffect(() => {
    if (!teacherFeedback?.at || teacherFeedback.at === prevFeedbackAt.current) return;
    prevFeedbackAt.current = teacherFeedback.at;
    if (!teacherFeedbackSeenAt || teacherFeedback.at > teacherFeedbackSeenAt) {
      show("선생님 피드백이 도착했어요! 👩‍🏫", "success");
    }
  }, [teacherFeedback?.at, teacherFeedbackSeenAt, show]);

  useEffect(() => {
    async function refreshWorkspace() {
      try {
        const res = await apiFetch<{
          members: WorkspaceData["members"];
          project?: WorkspaceData["project"];
          meta?: { teacherFeedback: TeacherFeedback; lastEditor: LastEditor };
        }>("/api/me");
        if (res.members?.length) setMembers(res.members);
        if (res.meta?.teacherFeedback) setTeacherFeedback(res.meta.teacherFeedback);
        if (res.meta?.lastEditor) setLastEditor(res.meta.lastEditor);

        if (
          res.project?.content &&
          res.project.updatedAt &&
          res.project.updatedAt > lastUpdatedAt &&
          saveStateRef.current !== "saving"
        ) {
          setContent(migrateStage4(res.project.content));
          setLastUpdatedAt(res.project.updatedAt);
          if (res.project.title) setTopicTitle(res.project.title);
        }
      } catch {
        // ignore background refresh errors
      }
    }

    const timer = setInterval(refreshWorkspace, 12_000);
    window.addEventListener("focus", refreshWorkspace);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", refreshWorkspace);
    };
  }, [lastUpdatedAt]);

  useEffect(() => {
    const timer = setInterval(() => {
      setPeers((prev) => prunePeers(prev));
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      const focused = focusedField.current;
      if (!focused) return;
      const [stageKey, fieldKey] = focused.split(".");
      if (!stageKey || !fieldKey) return;
      broadcastPresence(stageKey, fieldKey, lastCursorRef.current, true);
    }, 1500);
    return () => clearInterval(timer);
  }, [broadcastPresence]);

  function ackTeacherFeedback() {
    if (!teacherFeedback?.at) return;
    localStorage.setItem(`teacherFeedbackSeen:${data.team.id}`, teacherFeedback.at);
    setTeacherFeedbackSeenAt(teacherFeedback.at);
  }

  useEffect(() => {
    const client = supabaseBrowser();
    if (!client) {
      setRealtimeStatus("disabled");
      return;
    }

    const channel = client.channel(`team:${data.team.id}`, {
      config: { broadcast: { self: false } },
    });

    channel
      .on("broadcast", { event: "field" }, (payload) => {
        const { stageKey, fieldKey, value, authorId } = payload.payload as {
          stageKey: string;
          fieldKey: string;
          value: string;
          authorId: string;
        };
        if (authorId === data.student.id) return;
        setContent((prev) => ({
          ...prev,
          [stageKey]: { ...(prev[stageKey] ?? {}), [fieldKey]: value },
        }));
      })
      .on("broadcast", { event: "presence" }, (payload) => {
        const peer = payload.payload as PeerPresence;
        if (!peer?.studentId || peer.studentId === data.student.id) return;
        setPeers((prev) =>
          prunePeers({
            ...prev,
            [peer.studentId]: { ...peer, updatedAt: Date.now() },
          })
        );
      })
      .on("broadcast", { event: "meta" }, (payload) => {
        const { topicTitle: t, teamName: n, authorId } = payload.payload as {
          topicTitle?: string;
          teamName?: string;
          authorId: string;
        };
        if (authorId === data.student.id) return;
        if (t) setTopicTitle(t);
        if (n) setTeamName(n);
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") setRealtimeStatus("connected");
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") setRealtimeStatus("error");
      });

    channelRef.current = channel;
    return () => {
      client.removeChannel(channel);
      channelRef.current = null;
      setRealtimeStatus(isRealtimeConfigured() ? "connecting" : "disabled");
    };
  }, [data.team.id, data.student.id]);

  const persist = useCallback(
    async (stageKey: string, fieldKey: string, value: string) => {
      setSaveState("saving");
      try {
        const result = await apiFetch<{
          savedAt: string;
          lastEditor: { name: string; at: string };
        }>("/api/projects/save", {
          method: "POST",
          body: JSON.stringify({ stageKey, fieldKey, value, currentStage: activeStage.stage }),
        });
        setSaveState("saved");
        setLastUpdatedAt(result.savedAt);
        setLastEditor(result.lastEditor);
      } catch (error) {
        setSaveState("error");
        show((error as Error).message, "error");
      }
    },
    [activeStage.stage, show]
  );

  const handleChange = useCallback(
    (stageKey: string, fieldKey: string, value: string) => {
      setContent((prev) => ({
        ...prev,
        [stageKey]: { ...(prev[stageKey] ?? {}), [fieldKey]: value },
      }));

      channelRef.current?.send({
        type: "broadcast",
        event: "field",
        payload: { stageKey, fieldKey, value, authorId: data.student.id },
      });

      const timerKey = `${stageKey}.${fieldKey}`;
      clearTimeout(timers.current[timerKey]);
      timers.current[timerKey] = setTimeout(() => persist(stageKey, fieldKey, value), 800);
    },
    [data.student.id, persist]
  );

  useEffect(() => {
    const pending = timers.current;
    return () => Object.values(pending).forEach(clearTimeout);
  }, []);

  const progress = useMemo(
    () =>
      STAGES.map((stage) => ({
        stage,
        percent: stageCompletion(content, stage, memberCount),
        dday: getDday(STAGE_DEADLINES[stage.deadlineKey]),
        deadlineLabel: STAGE_DEADLINE_LABELS[stage.deadlineKey],
      })),
    [content, memberCount]
  );

  const overall = Math.round(progress.reduce((sum, p) => sum + p.percent, 0) / STAGES.length);

  const stageSubmissions = useMemo(() => getStageSubmissions(content), [content]);
  const activeStageSubmittedAt = stageSubmissions[activeStage.stage] ?? null;

  const displayEditor = lastEditor ?? { name: "아직 없음", at: lastUpdatedAt };

  const saveLabel =
    saveState === "saving"
      ? "💾 저장 중…"
      : saveState === "saved"
      ? "✅ 저장 완료"
      : saveState === "error"
      ? "❌ 저장 실패"
      : "✏️ 자동 저장";

  const saveTopicTitle = useCallback(
    async (title: string) => {
      await apiFetch("/api/projects/title", {
        method: "POST",
        body: JSON.stringify({ title }),
      });
      channelRef.current?.send({
        type: "broadcast",
        event: "meta",
        payload: { topicTitle: title, authorId: data.student.id },
      });
    },
    [data.student.id]
  );

  const saveTeamName = useCallback(
    async (name: string) => {
      await apiFetch("/api/teams/name", {
        method: "POST",
        body: JSON.stringify({ name }),
      });
      channelRef.current?.send({
        type: "broadcast",
        event: "meta",
        payload: { teamName: name, authorId: data.student.id },
      });
      show("팀명을 저장했어요.", "success");
    },
    [data.student.id, show]
  );

  async function submitStage() {
    try {
      const result = await apiFetch<{ submittedAt: string; completedAt: string | null }>(
        "/api/projects/submit-stage",
        {
          method: "POST",
          body: JSON.stringify({ stage: activeStage.stage }),
        }
      );
      setContent((prev) => ({
        ...prev,
        _submissions: {
          ...(prev._submissions ?? {}),
          [String(activeStage.stage)]: result.submittedAt,
        },
      }));
      if (result.completedAt) setCompletedAt(result.completedAt);
      show("선생님께 제출했어요! 🙌", "success");
    } catch (error) {
      show((error as Error).message, "error");
      throw error;
    }
  }

  const stageValues = content[activeStage.key] ?? {};

  // 역할 분배·성찰 초기화 + 구형 데이터 이전
  useEffect(() => {
    setContent((prev) => {
      let migrated = migrateStage4(prev);
      let changed = migrated !== prev;

      const s1 = migrated.stage1 ?? {};
      if (!s1.memberRoles && memberCount > 0) {
        migrated = {
          ...migrated,
          stage1: {
            ...s1,
            memberRoles: JSON.stringify(Object.fromEntries(members.map((m) => [m.id, ""]))),
          },
        };
        changed = true;
      }

      const s4 = migrated.stage4 ?? {};
      let reflectionMap: Record<string, string> = {};
      if (s4.reflection?.trim().startsWith("{")) {
        try {
          reflectionMap = JSON.parse(s4.reflection);
        } catch {
          reflectionMap = {};
        }
      } else if (s4.reflection?.trim()) {
        const owner = members.find((m) => m.role === "owner") ?? members[0];
        if (owner) reflectionMap[owner.id] = s4.reflection;
        changed = true;
      }

      if (memberCount > 0) {
        let reflectionUpdated = false;
        for (const m of members) {
          if (reflectionMap[m.id] === undefined) {
            reflectionMap[m.id] = "";
            reflectionUpdated = true;
          }
        }
        if (reflectionUpdated || (s4.reflection && !s4.reflection.trim().startsWith("{"))) {
          migrated = {
            ...migrated,
            stage4: { ...s4, reflection: JSON.stringify(reflectionMap) },
          };
          changed = true;
        }
      }

      return changed ? migrated : prev;
    });
  }, [members, memberCount]);

  return (
    <div className="flex h-screen flex-col ws-gradient">
      <header className="shrink-0 border-b border-white/60 bg-white/70 backdrop-blur-md">
        <div className="flex items-center gap-4 border-b border-white/50 px-5 py-2.5">
          <div className="min-w-0 flex-1">
            <EditableTopicTitle
              variant="header"
              value={topicTitle}
              onChange={setTopicTitle}
              onSave={saveTopicTitle}
            />
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="shrink-0 rounded-lg px-2 py-1 text-xs text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            {data.student.name} · 나가기
          </button>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-1 px-5 py-2 text-[12px]">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
            <span className="flex items-center gap-1.5 text-slate-700">
              <span>🕐</span>
              <span className="text-slate-500">최종 수정</span>
              {formatKoreanDateTime(displayEditor.at)}
            </span>
            <span className="flex items-center gap-1.5 text-slate-700">
              <span>✍️</span>
              <span className="text-slate-500">수정자</span>
              <span className="font-semibold text-violet-700">{displayEditor.name}</span>
            </span>
            <span className="text-slate-400">{saveLabel}</span>
          </div>
          <span className="text-xs text-slate-500">
            전체 진행 <b className="text-violet-600">{overall}%</b>
          </span>
        </div>
        <CollaboratorBar peers={activePeers} />
        {realtimeStatus === "disabled" && (
          <div className="border-t border-amber-200 bg-amber-50 px-5 py-2 text-[11px] leading-5 text-amber-900">
            ⚠️ 실시간 협업이 꺼져 있어요. Vercel에{" "}
            <b>NEXT_PUBLIC_SUPABASE_ANON_KEY</b> 환경변수를 추가한 뒤 Redeploy 해 주세요.
          </div>
        )}
        {realtimeStatus === "error" && (
          <div className="border-t border-rose-200 bg-rose-50 px-5 py-2 text-[11px] leading-5 text-rose-900">
            ⚠️ 실시간 연결에 실패했어요. Supabase URL·anon key가 맞는지 확인해 주세요.
          </div>
        )}
        {realtimeStatus === "connected" && activePeers.length === 0 && (
          <div className="border-t border-emerald-100 bg-emerald-50/80 px-5 py-1.5 text-[10px] text-emerald-800">
            🟢 실시간 협업 연결됨 — 같은 항목을 열면 구글 문서처럼 이름·커서가 보여요.
          </div>
        )}
      </header>

      <div className="flex min-h-0 flex-1">
        <nav className="flex w-[220px] shrink-0 flex-col border-r border-white/60 bg-white/50 backdrop-blur-sm">
          <div className="border-b border-slate-100 px-4 py-3 space-y-2">
            <EditableTeamName
              value={teamName}
              isOwner={isOwner}
              onChange={setTeamName}
              onSave={isOwner ? saveTeamName : undefined}
            />
            <button
              type="button"
              className="mt-1 flex items-center gap-1 text-[11px] text-slate-400 hover:text-violet-600"
              onClick={() => {
                navigator.clipboard?.writeText(data.team.joinCode);
                show("참여 코드를 복사했어요! 📋", "success");
              }}
            >
              🔑 <span className="font-mono tracking-widest">{data.team.joinCode}</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-2 py-3">
            <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              📚 단계별 메뉴
            </p>
            <ul className="mt-2 space-y-1">
              {progress.map(({ stage, percent, dday, deadlineLabel }) => (
                <li key={stage.key}>
                  <button
                    type="button"
                    onClick={() => setActiveStage(stage)}
                    className={[
                      "w-full rounded-xl px-3 py-2.5 text-left transition",
                      activeStage.key === stage.key
                        ? "bg-violet-600 text-white shadow-md"
                        : "text-slate-700 hover:bg-white/80",
                    ].join(" ")}
                  >
                    <span className="flex items-center gap-1.5 text-[12px] font-semibold">
                      <span>{stage.emoji}</span>
                      <span className="flex-1 truncate">{stage.shortTitle}</span>
                      <span
                        className={[
                          "rounded px-1 py-0.5 text-[9px] font-bold",
                          activeStage.key === stage.key
                            ? "bg-white/20 text-white"
                            : DDAY_TONE_CLASS[dday.tone],
                        ].join(" ")}
                      >
                        {dday.label}
                      </span>
                    </span>
                    <p
                      className={[
                        "mt-0.5 text-[10px]",
                        activeStage.key === stage.key ? "text-violet-100" : "text-slate-400",
                      ].join(" ")}
                    >
                      {stage.formLabel} · {deadlineLabel}
                    </p>
                    <span className="mt-1.5 flex items-center gap-2">
                      <span className="h-1 flex-1 overflow-hidden rounded-full bg-black/10">
                        <span
                          className={[
                            "block h-1 rounded-full transition-all",
                            activeStage.key === stage.key ? "bg-white/80" : "bg-violet-400",
                          ].join(" ")}
                          style={{ width: `${percent}%` }}
                        />
                      </span>
                      <span
                        className={[
                          "text-[9px]",
                          activeStage.key === stage.key ? "text-violet-100" : "text-slate-400",
                        ].join(" ")}
                      >
                        {percent}%
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        <main className="min-w-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[720px] px-5 py-5">
            <div className="mb-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-3 py-1 text-[11px] font-semibold text-violet-700">
                  {activeStage.emoji} {activeStage.stage} / {STAGE_COUNT} 단계
                </span>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-medium text-slate-500">
                  {activeStage.formLabel}
                </span>
                <span
                  className={[
                    "rounded-full px-2 py-0.5 text-[10px] font-bold",
                    DDAY_TONE_CLASS[getDday(STAGE_DEADLINES[activeStage.deadlineKey]).tone],
                  ].join(" ")}
                >
                  {getDday(STAGE_DEADLINES[activeStage.deadlineKey]).label} ·{" "}
                  {STAGE_DEADLINE_LABELS[activeStage.deadlineKey]}
                </span>
              </div>
              <h1 className="mt-3 text-xl font-bold text-slate-900">{activeStage.title}</h1>
              <p className="mt-1 text-sm leading-6 text-slate-500">{activeStage.summary}</p>
              <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white/80 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-800">
                    📄 {activeStage.formLabel} 보고서
                  </p>
                  <p className="mt-0.5 text-[11px] leading-5 text-slate-500">
                    서식에 맞게 PDF로 저장하거나 인쇄할 수 있어요. 인쇄 창에서 «PDF로 저장»을
                    선택하세요.
                  </p>
                </div>
                <ExportStageReportButton
                  stage={activeStage}
                  teamName={teamName}
                  topicTitle={topicTitle}
                  content={content}
                  members={members}
                  className="np-button shrink-0"
                />
              </div>
            </div>

            {activeStage.stage === 2 && (
              <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[12px] leading-5 text-amber-900">
                ⚠️ 대안 정책을 조사할 때는 <b>출처(기사, 정부·지자체 자료, URL 등)</b>를 반드시
                함께 적어 주세요.
              </div>
            )}

            {activeStage.stage === 5 && (
              <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-4">
                <p className="text-sm font-bold text-rose-700">📅 발표회 일정</p>
                <p className="mt-1 text-[14px] font-semibold text-rose-600">
                  11월 4일(수) 16:00 · 가람홀
                </p>
                <p className="mt-1 text-[11px] text-rose-500">
                  발표 자료(PPT)를 준비하고 아래 항목을 작성한 뒤 선생님께 제출해 주세요.
                </p>
              </div>
            )}

            <div className="space-y-6">
              {activeStage.fields.map((field) => (
                <StageFieldEditor
                  key={field.key}
                  field={field}
                  stageKey={activeStage.key}
                  value={stageValues[field.key] ?? ""}
                  members={members}
                  memberCount={memberCount}
                  onChange={(v) => handleChange(activeStage.key, field.key, v)}
                  onFocus={() => {
                    focusedField.current = `${activeStage.key}.${field.key}`;
                    lastCursorRef.current = 0;
                    reportFieldPresence(activeStage.key, field.key, 0, true);
                  }}
                  onBlur={() => {
                    focusedField.current = null;
                  }}
                  onCursor={(cursor) => reportFieldPresence(activeStage.key, field.key, cursor)}
                  fieldPeers={peersOnField(peers, activeStage.key, field.key, data.student.id)}
                  teacherComment={getFieldFeedback(
                    teacherFeedback?.stageFeedback,
                    activeStage.key,
                    field.key
                  )}
                />
              ))}
            </div>
          </div>
        </main>

        <aside className="flex w-[380px] shrink-0 flex-col border-l border-white/60 bg-white/60 backdrop-blur-sm">
          <FeedbackPanel
            stage={activeStage}
            aiFeedbacks={aiFeedbacks}
            teacherFeedback={teacherFeedback}
            stageSubmittedAt={activeStageSubmittedAt}
            teacherFeedbackIsNew={teacherFeedbackIsNew}
            onAckTeacherFeedback={ackTeacherFeedback}
            onNewAiFeedback={(fb) => setAiFeedbacks((prev) => [fb, ...prev])}
            onSubmitStage={submitStage}
          />
        </aside>
      </div>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { LoginForm } from "@/components/LoginForm";
import { TeamGate } from "@/components/TeamGate";
import { Workspace } from "@/components/Workspace";
import { apiFetch } from "@/lib/fetcher";
import type { WorkspaceMeta } from "@/lib/workspace";

type MeResponse = {
  student: { id: string; name: string; loginKey: string };
  team: { id: string; name: string; joinCode: string; ownerId: string } | null;
  members: {
    id: string;
    name: string;
    role: string;
    grade?: number;
    classNo?: number;
    studentNo?: number;
  }[];
  project: any;
  meta?: WorkspaceMeta;
};

export default function HomePage() {
  const [state, setState] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setState(await apiFetch<MeResponse>("/api/me", { cache: "no-store" }));
    } catch {
      setState(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setState(null);
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center text-sm text-ink-400">
        기록을 불러오고 있어요…
      </main>
    );
  }

  if (!state) return <LoginForm onSuccess={load} />;

  if (!state.team || !state.project) {
    return <TeamGate studentName={state.student.name} onJoined={load} />;
  }

  return (
    <Workspace
      data={{
        student: state.student,
        team: state.team,
        members: state.members,
        project: state.project,
        meta: state.meta ?? {
          lastEditor: null,
          teacherFeedback: null,
          aiFeedbacks: [],
        },
      }}
      onLogout={logout}
    />
  );
}

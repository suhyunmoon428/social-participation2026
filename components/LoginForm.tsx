"use client";

import { useState } from "react";
import Link from "next/link";
import { useToast } from "@/components/Toast";
import { apiFetch } from "@/lib/fetcher";

export function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const { show } = useToast();
  const [form, setForm] = useState({
    grade: "",
    classNo: "",
    studentNo: "",
    name: "",
    password: "",
  });
  const [busy, setBusy] = useState(false);

  const update = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: event.target.value }));

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;

    if (!form.grade || !form.classNo || !form.studentNo || form.name.trim().length < 2) {
      show("학년·반·번호·이름을 모두 입력해 주세요.", "error");
      return;
    }

    const grade = Number(form.grade);
    const classNo = Number(form.classNo);
    const studentNo = Number(form.studentNo);
    if (
      !Number.isInteger(grade) ||
      !Number.isInteger(classNo) ||
      !Number.isInteger(studentNo) ||
      grade < 1 ||
      grade > 6 ||
      classNo < 1 ||
      classNo > 30 ||
      studentNo < 1 ||
      studentNo > 60
    ) {
      show("학년은 1~6, 반은 1~30, 번호는 1~60 사이로 입력해 주세요.", "error");
      return;
    }
    if (form.password.length < 4) {
      show("비밀번호는 4자 이상으로 정해 주세요.", "error");
      return;
    }

    setBusy(true);
    try {
      const result = await apiFetch<{ name: string; created: boolean }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ ...form, name: form.name.trim() }),
      });
      show(
        result.created
          ? `${result.name} 학생, 처음 오셨네요! 비밀번호를 꼭 기억해 주세요.`
          : `${result.name} 학생, 다시 만나서 반가워요.`,
        "success"
      );
      onSuccess();
    } catch (error) {
      show((error as Error).message, "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen ws-gradient">
      <div className="mx-auto flex w-full max-w-md flex-col justify-center px-6 py-12">
        <p className="text-2xl">🌱</p>
        <h1 className="mt-3 text-2xl font-bold text-slate-900">사회참여활동 워크스페이스</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          학년·반·번호·이름과 비밀번호로 시작해요. 처음이면 자동으로 가입되고, 다음부터는 같은 정보로 이어서 쓸 수 있어요.
        </p>

      <form onSubmit={submit} className="mt-8 space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-ink-500">학년</span>
            <input
              className="np-input"
              inputMode="numeric"
              min={1}
              max={6}
              placeholder="2"
              value={form.grade}
              onChange={update("grade")}
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-ink-500">반</span>
            <input
              className="np-input"
              inputMode="numeric"
              min={1}
              max={30}
              placeholder="3"
              value={form.classNo}
              onChange={update("classNo")}
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-ink-500">번호</span>
            <input
              className="np-input"
              inputMode="numeric"
              min={1}
              max={60}
              placeholder="11"
              value={form.studentNo}
              onChange={update("studentNo")}
            />
          </label>
        </div>
        <p className="text-[11px] text-slate-400">학년 1~6 · 반 1~30 · 번호 1~60</p>

        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-ink-500">이름</span>
          <input className="np-input" placeholder="홍길동" value={form.name} onChange={update("name")} />
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-ink-500">비밀번호 (4자 이상)</span>
          <input
            className="np-input"
            type="password"
            placeholder="••••"
            value={form.password}
            onChange={update("password")}
          />
        </label>

        <button className="np-button w-full" disabled={busy}>
          {busy ? "확인 중…" : "🚀 시작하기"}
        </button>
      </form>

      <Link
        href="/teacher"
        className="mt-8 text-center text-xs text-slate-400 underline-offset-4 hover:text-brand-600 hover:underline"
      >
        👩‍🏫 선생님이신가요? 교사용 대시보드
      </Link>
      </div>
    </main>
  );
}

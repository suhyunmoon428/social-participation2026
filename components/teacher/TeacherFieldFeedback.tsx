"use client";

import { useEffect, useRef, useState } from "react";
import { useToast } from "@/components/Toast";
import { apiFetch } from "@/lib/fetcher";

type Props = {
  teamId: string;
  stageKey: string;
  fieldKey: string;
  initial: string;
  onSaved?: () => void;
};

export function TeacherFieldFeedback({
  teamId,
  stageKey,
  fieldKey,
  initial,
  onSaved,
}: Props) {
  const { show } = useToast();
  const [text, setText] = useState(initial);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setText(initial);
  }, [initial]);

  function persist(value: string) {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      setSaveState("saving");
      try {
        await apiFetch("/api/teacher/stage-feedback", {
          method: "POST",
          body: JSON.stringify({ teamId, stageKey, fieldKey, content: value }),
        });
        setSaveState("saved");
        onSaved?.();
        setTimeout(() => setSaveState("idle"), 1500);
      } catch (error) {
        setSaveState("idle");
        show((error as Error).message, "error");
      }
    }, 600);
  }

  return (
    <div className="mt-3 rounded-lg border border-sky-200 bg-sky-50/60 p-3">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <label className="text-[11px] font-semibold text-sky-700">👩‍🏫 교사 피드백</label>
        <span className="text-[10px] text-sky-400">
          {saveState === "saving" ? "저장 중…" : saveState === "saved" ? "저장됨 ✓" : ""}
        </span>
      </div>
      <textarea
        className="np-input min-h-[72px] resize-y py-2 text-[12px] leading-5"
        placeholder="이 항목에 대한 피드백을 작성해 주세요. 학생 화면에 표시됩니다."
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          persist(e.target.value);
        }}
        onBlur={() => persist(text)}
        rows={3}
      />
    </div>
  );
}

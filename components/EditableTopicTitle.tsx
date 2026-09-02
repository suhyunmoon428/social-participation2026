"use client";

import { useEffect, useRef, useState } from "react";
import { useToast } from "@/components/Toast";
import { apiFetch } from "@/lib/fetcher";

const DEFAULT_TOPIC = "주제를 입력해 주세요";

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSave?: (value: string) => Promise<void>;
  variant?: "header" | "sidebar" | "inline" | "panel";
  readOnly?: boolean;
};

export function EditableTopicTitle({
  value,
  onChange,
  onSave,
  variant = "inline",
  readOnly = false,
}: Props) {
  const { show } = useToast();
  const [local, setLocal] = useState(value || DEFAULT_TOPIC);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLocal(value || DEFAULT_TOPIC);
  }, [value]);

  function commit(next: string) {
    const trimmed = next.trim() || DEFAULT_TOPIC;
    onChange(trimmed);
    if (!onSave) return;

    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      if (trimmed === DEFAULT_TOPIC && !value) return;
      try {
        await onSave(trimmed);
      } catch (error) {
        show((error as Error).message, "error");
      }
    }, 700);
  }

  const styles = {
    header:
      "w-full min-w-0 rounded-lg border border-violet-200 bg-white/90 px-3 py-1.5 text-base font-bold text-slate-900 shadow-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100",
    sidebar:
      "w-full min-w-0 rounded-md border border-slate-200 bg-white px-2 py-1 text-[12px] font-semibold text-slate-800 focus:border-violet-300 focus:outline-none",
    inline:
      "w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-lg font-bold text-slate-900 focus:border-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-50",
    panel:
      "w-full min-w-0 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 focus:border-violet-300 focus:outline-none",
  };

  if (readOnly) {
    return (
      <p className={variant === "header" ? "text-base font-bold text-slate-900" : "text-sm font-semibold text-slate-800"}>
        📌 {local}
      </p>
    );
  }

  return (
    <label className="block min-w-0">
      {variant !== "inline" && (
        <span className="mb-0.5 block text-[10px] font-semibold text-violet-600">📌 주제명</span>
      )}
      <input
        type="text"
        className={styles[variant]}
        value={local}
        placeholder={DEFAULT_TOPIC}
        onChange={(e) => {
          setLocal(e.target.value);
          commit(e.target.value);
        }}
        onBlur={() => {
          const trimmed = local.trim() || DEFAULT_TOPIC;
          setLocal(trimmed);
          commit(trimmed);
        }}
      />
    </label>
  );
}

type TeamNameProps = {
  value: string;
  onChange: (value: string) => void;
  onSave?: (value: string) => Promise<void>;
};

export function EditableTeamName({ value, onChange, onSave }: TeamNameProps) {
  const { show } = useToast();
  const [local, setLocal] = useState(value);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => setLocal(value), [value]);

  return (
    <label className="block min-w-0">
      <span className="mb-0.5 block text-[10px] font-semibold text-slate-500">🏠 팀명</span>
      <input
        type="text"
        className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm font-bold text-slate-800 placeholder:font-normal placeholder:text-slate-400 focus:border-violet-300 focus:outline-none"
        value={local}
        placeholder="팀명을 입력해 주세요"
        onChange={(e) => {
          setLocal(e.target.value);
          onChange(e.target.value);
          if (!onSave) return;
          if (timer.current) clearTimeout(timer.current);
          timer.current = setTimeout(async () => {
            const trimmed = e.target.value.trim();
            if (!trimmed) return;
            try {
              await onSave(trimmed);
            } catch (err) {
              show((err as Error).message, "error");
            }
          }, 700);
        }}
        onBlur={async () => {
          const trimmed = local.trim();
          if (!trimmed || !onSave) return;
          try {
            await onSave(trimmed);
          } catch (err) {
            show((err as Error).message, "error");
          }
        }}
      />
      <span className="mt-0.5 block text-[10px] text-slate-400">팀원 모두 수정할 수 있어요</span>
    </label>
  );
}

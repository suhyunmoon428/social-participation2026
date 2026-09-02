"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { RemoteCaret } from "@/components/RemoteCaret";
import { colorForStudent, type PeerPresence } from "@/lib/presence";

type Props = {
  value: string;
  placeholder?: string;
  rows?: number;
  peers: PeerPresence[];
  onChange: (value: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  onCursor: (cursor: number) => void;
};

export function CollabTextarea({
  value,
  placeholder,
  rows = 5,
  peers,
  onChange,
  onFocus,
  onBlur,
  onCursor,
}: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [textareaEl, setTextareaEl] = useState<HTMLTextAreaElement | null>(null);
  const [layoutVersion, setLayoutVersion] = useState(0);

  const bumpLayout = useCallback(() => {
    setLayoutVersion((v) => v + 1);
  }, []);

  const reportCursor = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    onCursor(el.selectionStart ?? 0);
    bumpLayout();
  }, [onCursor, bumpLayout]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;

    const onScroll = () => bumpLayout();
    el.addEventListener("scroll", onScroll);
    window.addEventListener("resize", onScroll);
    return () => {
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [bumpLayout]);

  useEffect(() => {
    bumpLayout();
  }, [value, peers, bumpLayout]);

  return (
    <div
      className={[
        "relative rounded-xl border bg-slate-50/50 px-4 py-3 transition-shadow",
        peers.length > 0
          ? "border-violet-200 ring-2 ring-violet-100"
          : "border-slate-100 focus-within:border-violet-300 focus-within:ring-2 focus-within:ring-violet-50",
      ].join(" ")}
    >
      {peers.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {peers.map((peer) => (
            <span
              key={peer.studentId}
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm"
              style={{ backgroundColor: colorForStudent(peer.studentId) }}
            >
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white/90" />
              {peer.studentName}
              {peer.fieldLabel ? ` · ${peer.fieldLabel}` : ""}
            </span>
          ))}
        </div>
      )}

      <div className="relative min-h-[130px]">
        <textarea
          ref={(el) => {
            textareaRef.current = el;
            setTextareaEl(el);
            if (el) bumpLayout();
          }}
          className="np-editor relative z-10 min-h-[130px] w-full bg-transparent"
          placeholder={placeholder}
          value={value}
          rows={rows}
          onFocus={() => {
            onFocus();
            reportCursor();
          }}
          onBlur={onBlur}
          onChange={(event) => {
            onChange(event.target.value);
            reportCursor();
          }}
          onKeyUp={reportCursor}
          onKeyDown={reportCursor}
          onClick={reportCursor}
          onSelect={reportCursor}
          onInput={reportCursor}
        />

        <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden" aria-hidden>
          {peers.map((peer) => (
            <RemoteCaret
              key={peer.studentId}
              peer={peer}
              textarea={textareaEl}
              value={value}
              version={layoutVersion}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

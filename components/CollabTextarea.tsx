"use client";

import { useCallback, useEffect, useRef } from "react";
import { caretLine, colorForStudent, type PeerPresence } from "@/lib/presence";

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

const LINE_HEIGHT = 24;
const PADDING_Y = 12;

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
  const scrollRaf = useRef<number | null>(null);

  const reportCursor = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    onCursor(el.selectionStart ?? 0);
  }, [onCursor]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;

    const onScroll = () => {
      if (scrollRaf.current) cancelAnimationFrame(scrollRaf.current);
      scrollRaf.current = requestAnimationFrame(reportCursor);
    };

    el.addEventListener("scroll", onScroll);
    return () => {
      el.removeEventListener("scroll", onScroll);
      if (scrollRaf.current) cancelAnimationFrame(scrollRaf.current);
    };
  }, [reportCursor]);

  return (
    <div className="relative rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3 focus-within:border-violet-300 focus-within:ring-2 focus-within:ring-violet-50">
      {peers.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {peers.map((peer) => (
            <span
              key={peer.studentId}
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm"
              style={{ backgroundColor: colorForStudent(peer.studentId) }}
            >
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white/90" />
              {peer.studentName} 작성 중
            </span>
          ))}
        </div>
      )}

      <div className="relative">
        <textarea
          ref={textareaRef}
          className="np-editor relative z-10 min-h-[130px] bg-transparent"
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
          onClick={reportCursor}
          onSelect={reportCursor}
        />

        <div
          className="pointer-events-none absolute inset-0 z-20 overflow-hidden"
          aria-hidden
        >
          {peers.map((peer) => {
            if (peer.cursor === undefined) return null;
            const line = caretLine(value, peer.cursor);
            const scrollTop = textareaRef.current?.scrollTop ?? 0;
            const top = PADDING_Y + line * LINE_HEIGHT - scrollTop;
            if (top < -8 || top > 220) return null;

            return (
              <div
                key={peer.studentId}
                className="absolute left-0 flex items-center gap-1"
                style={{ top, transform: "translateY(-2px)" }}
              >
                <span
                  className="h-4 w-0.5 rounded-full"
                  style={{ backgroundColor: colorForStudent(peer.studentId) }}
                />
                <span
                  className="rounded px-1.5 py-0.5 text-[10px] font-semibold text-white shadow"
                  style={{ backgroundColor: colorForStudent(peer.studentId) }}
                >
                  {peer.studentName}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

"use client";

import { colorForStudent, type FieldTypist } from "@/lib/presence";

export function TypingIndicator({ typists }: { typists: FieldTypist[] }) {
  if (typists.length === 0) return null;

  return (
    <span className="inline-flex max-w-[180px] flex-wrap items-center justify-end gap-1">
      {typists.map((typist) => (
        <span
          key={typist.studentId}
          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm"
          style={{ backgroundColor: colorForStudent(typist.studentId) }}
        >
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white/90" />
          {typist.studentName}
        </span>
      ))}
    </span>
  );
}

"use client";

import { useLayoutEffect, useState } from "react";
import { getTextareaCaretPoint } from "@/lib/caretPosition";
import { colorForStudent, type PeerPresence } from "@/lib/presence";

export function RemoteCaret({
  peer,
  textarea,
  value,
  version,
}: {
  peer: PeerPresence;
  textarea: HTMLTextAreaElement | null;
  value: string;
  version: number;
}) {
  const [point, setPoint] = useState<{ top: number; left: number; height: number } | null>(null);
  const color = colorForStudent(peer.studentId);
  const cursor = peer.cursor ?? value.length;

  useLayoutEffect(() => {
    if (!textarea) {
      setPoint(null);
      return;
    }
    try {
      setPoint(getTextareaCaretPoint(textarea, cursor));
    } catch {
      setPoint(null);
    }
  }, [textarea, value, cursor, version]);

  if (!point || !textarea) return null;

  const { top, left, height } = point;
  if (top < -height || top > textarea.clientHeight + height) return null;

  return (
    <div
      className="pointer-events-none absolute z-30"
      style={{
        top,
        left,
        height,
      }}
    >
      <div
        className="absolute bottom-full left-0 mb-0.5 max-w-[140px] truncate rounded-t-md rounded-br-md px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white shadow-md"
        style={{ backgroundColor: color }}
      >
        {peer.studentName}
      </div>
      <div
        className="h-full w-[2px] rounded-full shadow-sm"
        style={{ backgroundColor: color }}
      />
    </div>
  );
}

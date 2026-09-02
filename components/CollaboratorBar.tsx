"use client";

import { STAGE_BY_KEY } from "@/lib/stages";
import { colorForStudent, type PeerPresence } from "@/lib/presence";

function fieldLabel(peer: PeerPresence): string {
  if (peer.fieldLabel) return peer.fieldLabel;
  const stage = STAGE_BY_KEY[peer.stageKey];
  const field = stage?.fields.find((f) => f.key === peer.fieldKey);
  return field?.label ?? "작성 항목";
}

export function CollaboratorBar({ peers }: { peers: PeerPresence[] }) {
  if (peers.length === 0) return null;

  const unique = [...new Map(peers.map((peer) => [peer.studentId, peer])).values()];

  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-white/50 px-5 py-2 text-[11px] text-slate-600">
      <span className="font-medium text-slate-500">✏️ 지금 작성 중</span>
      {unique.map((peer) => (
        <span
          key={peer.studentId}
          className="inline-flex max-w-[220px] items-center gap-1.5 truncate rounded-full bg-white/90 px-2.5 py-1 shadow-sm"
          title={`${peer.studentName} · ${fieldLabel(peer)}`}
        >
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-white"
            style={{ backgroundColor: colorForStudent(peer.studentId) }}
          />
          <span className="truncate font-medium text-slate-800">{peer.studentName}</span>
          <span className="truncate text-slate-400">· {fieldLabel(peer)}</span>
        </span>
      ))}
    </div>
  );
}

"use client";

import { colorForStudent, type PeerPresence } from "@/lib/presence";

export function CollaboratorBar({ peers }: { peers: PeerPresence[] }) {
  if (peers.length === 0) return null;

  const unique = [...new Map(peers.map((peer) => [peer.studentId, peer])).values()];

  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-white/50 px-5 py-2 text-[11px] text-slate-600">
      <span className="font-medium text-slate-500">👥 함께 보는 중</span>
      {unique.map((peer) => (
        <span
          key={peer.studentId}
          className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2 py-0.5 shadow-sm"
        >
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: colorForStudent(peer.studentId) }}
          />
          <span className="font-medium text-slate-700">{peer.studentName}</span>
        </span>
      ))}
    </div>
  );
}

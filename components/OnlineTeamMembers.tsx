"use client";

import { colorForStudent } from "@/lib/presence";
import type { OnlineMember } from "@/lib/presence";

type Member = { id: string; name: string; role?: string };

export function OnlineTeamMembers({
  members,
  online,
  selfId,
}: {
  members: Member[];
  online: Record<string, OnlineMember>;
  selfId: string;
}) {
  return (
    <div className="border-b border-slate-100 px-4 py-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">👥 접속 중</p>
      <ul className="mt-2 space-y-1.5">
        {members.map((member) => {
          const isOnline = member.id === selfId || Boolean(online[member.id]);
          return (
            <li
              key={member.id}
              className="flex items-center gap-2 rounded-lg bg-white/70 px-2 py-1.5 text-[12px]"
            >
              <span
                className={[
                  "h-2 w-2 shrink-0 rounded-full",
                  isOnline ? "bg-emerald-500 shadow-[0_0_0_2px_rgba(16,185,129,0.25)]" : "bg-slate-300",
                ].join(" ")}
              />
              <span className="min-w-0 flex-1 truncate font-medium text-slate-800">
                {member.name}
                {member.id === selfId ? " (나)" : ""}
              </span>
              {member.role === "owner" && (
                <span className="shrink-0 text-[10px] text-amber-600">👑</span>
              )}
              {isOnline && (
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: colorForStudent(member.id) }}
                />
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

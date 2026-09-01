"use client";

type Member = { id: string; name: string; role?: string };

type Props = {
  members: Member[];
  value: string;
  onChange: (json: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
};

export function MemberReflectionTable({ members, value, onChange, onFocus, onBlur }: Props) {
  const reflections = (() => {
    try {
      return JSON.parse(value || "{}") as Record<string, string>;
    } catch {
      return {} as Record<string, string>;
    }
  })();

  function updateReflection(memberId: string, text: string) {
    onChange(JSON.stringify({ ...reflections, [memberId]: text }));
  }

  return (
    <div className="space-y-3">
      {members.map((member) => (
        <div
          key={member.id}
          className="rounded-xl border border-emerald-100 bg-emerald-50/30 p-3"
        >
          <div className="mb-2 flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-800">{member.name}</span>
            {member.role === "owner" && (
              <span className="text-[10px] text-amber-600">👑 조장</span>
            )}
            <span className="ml-auto text-[10px] text-slate-400">
              {(reflections[member.id] ?? "").trim().length}자
            </span>
          </div>
          <textarea
            className="np-input min-h-[100px] resize-y py-2 text-[13px] leading-6"
            placeholder="이 활동을 통해 배운 점, 아쉬운 점, 다음에 개선할 점을 적어 주세요."
            value={reflections[member.id] ?? ""}
            onFocus={onFocus}
            onBlur={onBlur}
            onChange={(e) => updateReflection(member.id, e.target.value)}
            rows={4}
          />
        </div>
      ))}
      {members.length === 0 && (
        <p className="py-4 text-center text-xs text-slate-400">팀원이 없습니다.</p>
      )}
    </div>
  );
}

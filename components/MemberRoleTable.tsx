"use client";

type Member = { id: string; name: string; role?: string };

type Props = {
  members: Member[];
  value: string;
  onChange: (json: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
};

export function MemberRoleTable({ members, value, onChange, onFocus, onBlur }: Props) {
  const roles = (() => {
    try {
      return JSON.parse(value || "{}") as Record<string, string>;
    } catch {
      return {} as Record<string, string>;
    }
  })();

  function updateRole(memberId: string, role: string) {
    onChange(JSON.stringify({ ...roles, [memberId]: role }));
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <table className="w-full text-sm">
        <thead className="bg-violet-50 text-left text-[11px] font-semibold text-violet-700">
          <tr>
            <th className="w-[38%] px-3 py-2.5">팀원</th>
            <th className="px-3 py-2.5">담당 역할</th>
          </tr>
        </thead>
        <tbody>
          {members.map((member) => (
            <tr key={member.id} className="border-t border-slate-100">
              <td className="px-3 py-2 align-middle">
                <span className="font-medium text-slate-800">{member.name}</span>
                {member.role === "owner" && (
                  <span className="ml-1.5 text-[10px] text-amber-600">👑 조장</span>
                )}
              </td>
              <td className="px-3 py-2">
                <input
                  className="np-input py-2 text-[13px]"
                  placeholder="예: 설문지 제작 및 자료 조사"
                  value={roles[member.id] ?? ""}
                  onFocus={onFocus}
                  onBlur={onBlur}
                  onChange={(e) => updateRole(member.id, e.target.value)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {members.length === 0 && (
        <p className="px-3 py-4 text-center text-xs text-slate-400">팀원이 없습니다.</p>
      )}
    </div>
  );
}

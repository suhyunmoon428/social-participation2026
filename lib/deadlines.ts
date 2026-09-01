/** 별가람고 2026학년도 사회참여활동 마감일 (운영 계획 기준) */
export const STAGE_DEADLINES: Record<string, string> = {
  stage1: "2026-09-09",
  stage2: "2026-10-16",
  stage3: "2026-10-30",
  stage4: "2026-10-30",
  stage5: "2026-11-03",
};

export const STAGE_DEADLINE_LABELS: Record<string, string> = {
  stage1: "~ 9.9.(수)",
  stage2: "~ 10.16.(금)",
  stage3: "~ 10.30.(금)",
  stage4: "~ 10.30.(금)",
  stage5: "~ 11.3.(화) 제출",
};

export type DdayTone = "safe" | "urgent" | "today" | "overdue";

export function getDday(deadlineIso: string): { label: string; tone: DdayTone } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const [y, m, d] = deadlineIso.split("-").map(Number);
  const target = new Date(y, m - 1, d);
  const diff = Math.round((target.getTime() - today.getTime()) / 86400000);

  if (diff > 7) return { label: `D-${diff}`, tone: "safe" };
  if (diff > 0) return { label: `D-${diff}`, tone: "urgent" };
  if (diff === 0) return { label: "D-Day", tone: "today" };
  return { label: `D+${Math.abs(diff)}`, tone: "overdue" };
}

export const DDAY_TONE_CLASS: Record<DdayTone, string> = {
  safe: "bg-emerald-100 text-emerald-700",
  urgent: "bg-amber-100 text-amber-800",
  today: "bg-rose-100 text-rose-700",
  overdue: "bg-slate-200 text-slate-600",
};

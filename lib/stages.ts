import { STAGE_DEADLINES } from "@/lib/deadlines";

export type FieldType =
  | "textarea"
  | "memberRoles"
  | "memberReflection"
  | "activityCard"
  | "analysisFormPdf";

export type FieldDef = {
  key: string;
  emoji: string;
  label: string;
  hint: string;
  type?: FieldType;
  placeholder?: string;
};

export type StageDef = {
  stage: 1 | 2 | 3 | 4 | 5;
  key: "stage1" | "stage2" | "stage3" | "stage4" | "stage5";
  emoji: string;
  title: string;
  shortTitle: string;
  formLabel: string;
  summary: string;
  deadlineKey: keyof typeof STAGE_DEADLINES;
  fields: FieldDef[];
};

export const STAGES: StageDef[] = [
  {
    stage: 1,
    key: "stage1",
    emoji: "🔍",
    title: "문제 인식과 계획 수립",
    shortTitle: "문제 인식",
    formLabel: "서식1",
    summary:
      "학교·지역사회 문제를 발견하고, 현황 파악 계획을 세우며 팀원 역할을 나눠요.",
    deadlineKey: "stage1",
    fields: [
      {
        key: "problemChoice",
        emoji: "💡",
        label: "문제 발견과 선택",
        hint: "서식1 ◯ 문제 발견과 선택 — 팀 회의로 주제를 정한 뒤 아래 문장을 완성해 주세요.",
        placeholder:
          "우리가 선택한 문제는 (    )이고,\n이 문제의 해결을 통하여 (    )을 기대할 수 있다.",
      },
      {
        key: "analysisPlan",
        emoji: "📋",
        label: "문제 분석 — 현황 파악 계획",
        hint: "선택한 문제의 현황을 파악하기 위해 우리가 할 수 있는 일을 구체적으로 적어 주세요. (설문조사, 기사 수집, 촬영, 인터뷰 등)",
      },
      {
        key: "memberRoles",
        emoji: "👥",
        label: "팀원 역할 분배",
        hint: "팀원이 참여 코드로 입장하면 이름이 자동으로 표시됩니다. 각 팀원의 담당 역할만 입력해 주세요.",
        type: "memberRoles",
      },
      {
        key: "analysisForms",
        emoji: "📝",
        label: "문제 분석 양식 준비",
        hint: "사이트에 파일을 올리지 마세요. 아래 안내대로 제출해 주세요.",
        type: "analysisFormPdf",
      },
    ],
  },
  {
    stage: 2,
    key: "stage2",
    emoji: "⚖️",
    title: "대안 정책 분석",
    shortTitle: "대안 정책",
    formLabel: "서식2",
    summary: "이 문제(유사 문제)와 관련된 기존 정책을 찾아 특징·장단점을 정리해요. 출처를 반드시 밝혀 주세요.",
    deadlineKey: "stage2",
    fields: [1, 2, 3, 4, 5, 6].map((n) => ({
      key: `policy${n}`,
      emoji: "📌",
      label: `대안 정책 ${n}`,
      hint: "정책명 / 내용 및 특징 / 장점과 단점을 적어 주세요. 반드시 출처(기사, 정부·지자체 자료, 학술 자료 등)를 함께 적어 주세요.",
      placeholder: `․ 정책명:\n․ 내용 및 특징\n․ 장점과 단점\n․ 출처: (URL, 기사 제목·날짜, 자료명 등)`,
    })),
  },
  {
    stage: 3,
    key: "stage3",
    emoji: "✨",
    title: "공공정책 제안",
    shortTitle: "정책 제안",
    formLabel: "서식3",
    summary: "기존 정책의 한계를 보완할 수 있는 새로운 공공정책을 제안해요.",
    deadlineKey: "stage3",
    fields: [
      {
        key: "policyName",
        emoji: "🏷️",
        label: "1) 정책명",
        hint: "우리 팀이 제안하는 공공정책의 이름을 정해 주세요.",
      },
      {
        key: "policyFeatures",
        emoji: "📐",
        label: "2) 정책의 특징",
        hint: "정책의 핵심 내용, 대상, 시행 주체 등을 설명해 주세요.",
      },
      {
        key: "prosConsRemedy",
        emoji: "⚖️",
        label: "3) 정책의 장점, 단점과 보완 방안",
        hint: "장점과 함께 예상되는 단점, 그리고 단점을 보완할 방법을 적어 주세요.",
      },
      {
        key: "realizationEfforts",
        emoji: "🛠️",
        label: "4) 정책 실현을 위해 필요한 노력 및 활동",
        hint: "정책이 실제로 시행되려면 어떤 노력이 필요한지 구체적으로 적어 주세요.",
      },
    ],
  },
  {
    stage: 4,
    key: "stage4",
    emoji: "🚀",
    title: "실행 계획 수립 및 실천",
    shortTitle: "실천 활동",
    formLabel: "서식4",
    summary:
      "공공정책 실현을 위한 구체적 활동을 계획하고 실천한 내용을 기록해요.",
    deadlineKey: "stage4",
    fields: [
      ...([1, 2, 3, 4] as const).map((n) => ({
        key: `activity${n}` as const,
        emoji: ["1️⃣", "2️⃣", "3️⃣", "4️⃣"][n - 1],
        label: `활동 ${n}`,
        hint:
          n === 1
            ? "첫 번째 실천 활동을 계획하고 실행한 내용을 적어 주세요. (인터뷰, 캠페인, 서명운동 등)"
            : `${n}번째 실천 활동의 내용·기간·장소·방법·준비·결과를 작성해 주세요.`,
        type: "activityCard" as const,
      })),
      {
        key: "reflection",
        emoji: "🌱",
        label: "활동 전체 성찰",
        hint: "팀원 각자 배운 점, 아쉬운 점, 다음에 개선할 점을 적어 주세요. (본인 칸에 작성)",
        type: "memberReflection",
      },
    ],
  },
  {
    stage: 5,
    key: "stage5",
    emoji: "🎤",
    title: "발표 준비",
    shortTitle: "발표",
    formLabel: "발표",
    summary: "발표 자료(PPT)를 준비하고 발표회 일정을 확인해요.",
    deadlineKey: "stage5",
    fields: [
      {
        key: "presentationPlan",
        emoji: "📽️",
        label: "발표 구성 계획",
        hint: "발표 흐름, 각 팀원이 맡을 파트, 예상 발표 시간 등을 정리해 주세요.",
      },
      {
        key: "presentationChecklist",
        emoji: "✅",
        label: "제출 전 체크리스트",
        hint: "PPT 완성, 연습 여부, 질의응답 준비 등 제출 전 확인 사항을 적어 주세요.",
      },
    ],
  },
];

export const STAGE_BY_KEY = Object.fromEntries(STAGES.map((s) => [s.key, s])) as Record<
  string,
  StageDef
>;

export const STAGE_COUNT = STAGES.length;

export const SUBMISSIONS_KEY = "_submissions";

export type ProjectContent = Record<string, Record<string, string>>;

export function getStageSubmissions(content: ProjectContent): Record<number, string> {
  const raw = content[SUBMISSIONS_KEY] ?? {};
  const out: Record<number, string> = {};
  for (const [key, value] of Object.entries(raw)) {
    const stage = Number(key);
    if (stage >= 1 && stage <= 5 && value.trim()) out[stage] = value;
  }
  return out;
}

export type ActivityRow = {
  content: string;
  period: string;
  place: string;
  method: string;
  prep: string;
  result: string;
};

export const EMPTY_ACTIVITY: ActivityRow = {
  content: "",
  period: "",
  place: "",
  method: "",
  prep: "",
  result: "",
};

export const EMPTY_ACTIVITIES: ActivityRow[] = Array.from({ length: 4 }, () => ({
  ...EMPTY_ACTIVITY,
}));

export type AnalysisFormPdf = {
  fileName: string;
  storagePath: string;
  uploadedAt: string;
};

export type AnalysisFormValue = {
  notes: string;
  pdf?: AnalysisFormPdf;
};

export function parseAnalysisForm(raw: string | undefined): AnalysisFormValue {
  if (!raw?.trim()) return { notes: "" };
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      return {
        notes: typeof parsed.notes === "string" ? parsed.notes : "",
        pdf: parsed.pdf?.storagePath ? parsed.pdf : undefined,
      };
    }
  } catch {
    // legacy plain text
  }
  return { notes: raw };
}

export function parseMemberRoles(raw: string | undefined): Record<string, string> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed ? parsed : {};
  } catch {
    return {};
  }
}

export function parseActivityCard(raw: string | undefined): ActivityRow {
  if (!raw) return { ...EMPTY_ACTIVITY };
  try {
    const parsed = JSON.parse(raw);
    return {
      content: parsed?.content ?? "",
      period: parsed?.period ?? "",
      place: parsed?.place ?? "",
      method: parsed?.method ?? "",
      prep: parsed?.prep ?? "",
      result: parsed?.result ?? "",
    };
  } catch {
    return { ...EMPTY_ACTIVITY };
  }
}

export function parseActivities(raw: string | undefined): ActivityRow[] {
  if (!raw) return EMPTY_ACTIVITIES.map((r) => ({ ...r }));
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return EMPTY_ACTIVITIES.map((r) => ({ ...r }));
    return Array.from({ length: 4 }, (_, i) => ({
      content: parsed[i]?.content ?? "",
      period: parsed[i]?.period ?? "",
      place: parsed[i]?.place ?? "",
      method: parsed[i]?.method ?? "",
      prep: parsed[i]?.prep ?? "",
      result: parsed[i]?.result ?? "",
    }));
  } catch {
    return EMPTY_ACTIVITIES.map((r) => ({ ...r }));
  }
}

/** 예전 단일 표(activities) 데이터를 activity1~4 로 변환 */
export function migrateStage4(content: ProjectContent): ProjectContent {
  const s4 = content.stage4 ?? {};
  if (!s4.activities || s4.activity1) return content;

  const rows = parseActivities(s4.activities);
  const next: Record<string, string> = { ...s4 };
  delete next.activities;

  rows.forEach((row, i) => {
    next[`activity${i + 1}`] = JSON.stringify(row);
  });

  return { ...content, stage4: next };
}

export function fieldFilled(
  field: FieldDef,
  value: string,
  memberCount = 0
): boolean {
  if (field.type === "memberRoles" || field.type === "memberReflection") {
    const map = parseMemberRoles(value);
    if (memberCount === 0) return false;
    const filled = Object.values(map).filter((v) => v.trim().length > 0).length;
    return filled >= memberCount;
  }
  if (field.type === "activityCard") {
    const row = parseActivityCard(value);
    return [row.content, row.period, row.place, row.method, row.prep, row.result].some(
      (s) => s.trim().length > 0
    );
  }
  if (field.type === "analysisFormPdf") {
    // PDF 업로드 대신 오픈카톡 제출로 대체 — 진행률에서 막히지 않도록 완료 처리
    return true;
  }
  return value.trim().length > 0;
}

export function stageCompletion(
  content: ProjectContent,
  stage: StageDef,
  memberCount = 0
): number {
  const values = content?.[stage.key] ?? {};
  let filled = 0;
  for (const field of stage.fields) {
    const text = values[field.key] ?? "";
    if (fieldFilled(field, text, memberCount)) filled += 1;
  }
  return Math.round((filled / stage.fields.length) * 100);
}

export function contentToPlainText(content: ProjectContent): string {
  return STAGES.map((stage) => {
    const values = content?.[stage.key] ?? {};
    const body = stage.fields
      .map((f) => {
        const raw = (values[f.key] ?? "").trim();
        if (f.type === "memberRoles" || f.type === "memberReflection") {
          const map = parseMemberRoles(raw);
          const lines = Object.entries(map)
            .map(([id, text]) => `- ${id}: ${text || "(작성 전)"}`)
            .join("\n");
          return `- ${f.label}:\n${lines || "(작성 전)"}`;
        }
        if (f.type === "activityCard") {
          const row = parseActivityCard(raw);
          return `- ${f.label}:\n  · 활동 내용: ${row.content || "-"}\n  · 기간: ${row.period || "-"}\n  · 장소: ${row.place || "-"}\n  · 방법: ${row.method || "-"}\n  · 준비: ${row.prep || "-"}\n  · 결과: ${row.result || "-"}`;
        }
        if (f.type === "analysisFormPdf") {
          return `- ${f.label}: 오픈카톡방으로 수현쌤에게 제출 (기한: 2026-09-06 23:59)`;
        }
        return `- ${f.label}: ${raw || "(작성 전)"}`;
      })
      .join("\n");
    return `[${stage.formLabel} ${stage.title}]\n${body}`;
  }).join("\n\n");
}

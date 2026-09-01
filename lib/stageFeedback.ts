import { STAGE_BY_KEY, type FieldDef, type StageDef } from "@/lib/stages";

/** { stage1: { problemChoice: "피드백..." }, ... } */
export type StageFeedbackStore = Record<string, Record<string, string>>;

export function getFieldFeedback(
  store: StageFeedbackStore | undefined,
  stageKey: string,
  fieldKey: string
): string {
  return store?.[stageKey]?.[fieldKey]?.trim() ?? "";
}

export function formatStageTeacherFeedback(
  store: StageFeedbackStore | undefined,
  stage: StageDef
): string {
  if (!store) return "";
  const stageFb = store[stage.key] ?? {};
  const lines = stage.fields
    .map((field) => {
      const text = stageFb[field.key]?.trim();
      if (!text) return null;
      return `### ${field.label}\n${text}`;
    })
    .filter(Boolean);
  return lines.join("\n\n");
}

export function hasStageTeacherFeedback(
  store: StageFeedbackStore | undefined,
  stage: StageDef
): boolean {
  return stage.fields.some((field) => getFieldFeedback(store, stage.key, field.key).length > 0);
}

export function mergeStageFeedback(
  store: StageFeedbackStore | undefined,
  stageKey: string,
  fieldKey: string,
  content: string
): StageFeedbackStore {
  const next: StageFeedbackStore = { ...(store ?? {}) };
  const stageDef = STAGE_BY_KEY[stageKey];
  if (!stageDef?.fields.some((f) => f.key === fieldKey)) return next;

  const trimmed = content.trim();
  const stageMap = { ...(next[stageKey] ?? {}) };

  if (trimmed) stageMap[fieldKey] = trimmed;
  else delete stageMap[fieldKey];

  if (Object.keys(stageMap).length === 0) delete next[stageKey];
  else next[stageKey] = stageMap;

  return next;
}

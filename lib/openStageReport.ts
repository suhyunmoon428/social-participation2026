import { buildStageReportHtml, type StageReportOptions } from "@/lib/stageReportHtml";

const STORAGE_KEY = "stageReportPayload";

export function openStageReport(options: StageReportOptions): boolean {
  if (typeof window === "undefined") return false;

  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(options));
  } catch {
    alert("보고서 데이터를 저장하지 못했어요. 브라우저 저장 공간을 확인해 주세요.");
    return false;
  }

  const win = window.open("/print/report", "_blank", "noopener,noreferrer");
  if (!win) {
    alert("팝업이 차단되었어요. 브라우저에서 팝업을 허용한 뒤 다시 시도해 주세요.");
    return false;
  }

  return true;
}

export function readStageReportPayload(): StageReportOptions | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StageReportOptions;
  } catch {
    return null;
  }
}

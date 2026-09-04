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

  // 숨은 iframe 인쇄는 브라우저/팝업 정책에 막히는 경우가 많아
  // 전용 인쇄 페이지로 이동해 PDF 저장·인쇄하도록 한다.
  window.location.assign("/print/report");
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

/** 인쇄 페이지에서 HTML 미리보기용 */
export function buildStoredStageReportHtml(): string | null {
  const options = readStageReportPayload();
  if (!options) return null;
  return buildStageReportHtml(options);
}

import { buildStageReportHtml, type StageReportOptions } from "@/lib/stageReportHtml";

const STORAGE_KEY = "stageReportPayload";

function printHtmlInHiddenFrame(html: string): boolean {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("title", "사회참여활동 보고서");
  iframe.setAttribute(
    "style",
    "position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0;pointer-events:none"
  );
  document.body.appendChild(iframe);

  const win = iframe.contentWindow;
  const doc = win?.document;
  if (!win || !doc) {
    iframe.remove();
    return false;
  }

  doc.open();
  doc.write(html);
  doc.close();

  let printed = false;
  const triggerPrint = () => {
    if (printed) return;
    printed = true;
    try {
      win.focus();
      win.print();
    } catch {
      printed = false;
      return;
    }
    window.setTimeout(() => iframe.remove(), 2000);
  };

  iframe.onload = () => window.setTimeout(triggerPrint, 200);
  window.setTimeout(triggerPrint, 800);
  return true;
}

export function openStageReport(options: StageReportOptions): boolean {
  if (typeof window === "undefined") return false;

  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(options));
  } catch {
    alert("보고서 데이터를 저장하지 못했어요. 브라우저 저장 공간을 확인해 주세요.");
    return false;
  }

  const html = buildStageReportHtml(options);
  if (printHtmlInHiddenFrame(html)) return true;

  // iframe 인쇄가 막히면 팝업 없이 같은 탭에서 인쇄 페이지로 이동
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

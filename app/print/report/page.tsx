"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { readStageReportPayload } from "@/lib/openStageReport";
import { buildStageReportHtml } from "@/lib/stageReportHtml";

export default function PrintReportPage() {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [missing, setMissing] = useState(false);
  const [ready, setReady] = useState(false);

  const loadReport = useCallback(() => {
    const options = readStageReportPayload();
    if (!options) {
      setMissing(true);
      return;
    }

    const html = buildStageReportHtml(options);
    const frame = frameRef.current;
    if (!frame) return;

    const doc = frame.contentDocument;
    if (!doc) return;

    doc.open();
    doc.write(html);
    doc.close();
    setReady(true);
  }, []);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  function handlePrint() {
    const frame = frameRef.current;
    if (!frame?.contentWindow) return;
    frame.contentWindow.focus();
    frame.contentWindow.print();
  }

  if (missing) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-sm text-slate-600">
          인쇄할 보고서 데이터를 찾지 못했어요.
          <br />
          워크스페이스에서 다시 「PDF 저장 / 인쇄」를 눌러 주세요.
        </p>
        <Link href="/" className="np-button">
          워크스페이스로 돌아가기
        </Link>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 print:hidden">
        <Link href="/" className="text-sm text-slate-500 hover:text-slate-800">
          ← 돌아가기
        </Link>
        <button type="button" className="np-button" disabled={!ready} onClick={handlePrint}>
          🖨️ 인쇄하기
        </button>
      </div>

      <iframe
        ref={frameRef}
        title="사회참여활동 보고서"
        className="h-[calc(100vh-57px)] w-full border-0 print:h-screen print:border-0"
        onLoad={() => {
          setReady(true);
          window.setTimeout(handlePrint, 400);
        }}
      />
    </div>
  );
}

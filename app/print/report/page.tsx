"use client";

import { useEffect, useRef } from "react";
import { readStageReportPayload } from "@/lib/openStageReport";
import { buildStageReportHtml } from "@/lib/stageReportHtml";

export default function PrintReportPage() {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const printedRef = useRef(false);

  useEffect(() => {
    const options = readStageReportPayload();
    if (!options) return;

    const html = buildStageReportHtml(options);
    const frame = frameRef.current;
    if (!frame) return;

    const doc = frame.contentDocument;
    if (!doc) return;

    doc.open();
    doc.write(html);
    doc.close();

    const triggerPrint = () => {
      if (printedRef.current) return;
      printedRef.current = true;
      try {
        frame.contentWindow?.focus();
        frame.contentWindow?.print();
      } catch {
        // ignore
      }
    };

    frame.onload = () => setTimeout(triggerPrint, 400);
    setTimeout(triggerPrint, 800);
  }, []);

  return (
    <iframe
      ref={frameRef}
      title="사회참여활동 보고서"
      className="fixed inset-0 h-full w-full border-0 bg-white"
    />
  );
}

"use client";

import { openStageReport } from "@/lib/openStageReport";
import type { ReportMember } from "@/lib/stageReportHtml";
import { migrateStage4, type ProjectContent, type StageDef } from "@/lib/stages";

type Props = {
  stage: StageDef;
  teamName: string;
  topicTitle: string;
  content: ProjectContent;
  members: ReportMember[];
  pptOutline?: string;
  className?: string;
};

export function ExportStageReportButton({
  stage,
  teamName,
  topicTitle,
  content,
  members,
  pptOutline,
  className = "np-button",
}: Props) {
  return (
    <button
      type="button"
      className={className}
      onClick={() =>
        openStageReport({
          stage,
          teamName,
          topicTitle,
          content: migrateStage4(content),
          members,
          pptOutline,
        })
      }
    >
      📄 PDF 저장 / 인쇄
    </button>
  );
}

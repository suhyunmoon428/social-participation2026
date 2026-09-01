import {
  parseActivityCard,
  parseAnalysisForm,
  parseMemberRoles,
  type ProjectContent,
  type StageDef,
} from "@/lib/stages";

export type ReportMember = {
  id: string;
  name: string;
  role: string;
  grade?: number;
  classNo?: number;
  studentNo?: number;
};

export type StageReportOptions = {
  stage: StageDef;
  teamName: string;
  topicTitle: string;
  content: ProjectContent;
  members: ReportMember[];
  pptOutline?: string;
};

function esc(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function nl2br(text: string): string {
  return esc(text).replace(/\n/g, "<br/>");
}

export function memberStudentLabel(member: ReportMember): string {
  if (member.grade && member.classNo && member.studentNo) {
    return `${member.grade}학년 ${member.classNo}반 ${member.studentNo}번`;
  }
  return "-";
}

function memberHeaderHtml(teamName: string, topicTitle: string, members: ReportMember[]): string {
  const memberRows = members
    .map(
      (member) => `
      <tr>
        <td class="cell-label">${member.role === "owner" ? "팀장" : "팀원"}</td>
        <td>${esc(memberStudentLabel(member))}</td>
        <td>${esc(member.name)}</td>
      </tr>`
    )
    .join("");

  return `
    <table class="info-table">
      <tr>
        <td class="cell-label">팀명</td>
        <td colspan="2">${esc(teamName)}</td>
      </tr>
      <tr>
        <td class="cell-label">주제</td>
        <td colspan="2">${esc(topicTitle)}</td>
      </tr>
      <tr>
        <th class="cell-label">구분</th>
        <th>학번</th>
        <th>성명</th>
      </tr>
      ${memberRows}
    </table>`;
}

function sectionHtml(title: string, body: string): string {
  return `
    <section class="section">
      <h2 class="section-title">${esc(title)}</h2>
      <div class="section-body">${body || '<span class="empty">(작성 전)</span>'}</div>
    </section>`;
}

function stage1Body(values: Record<string, string>, members: ReportMember[]): string {
  const roles = parseMemberRoles(values.memberRoles);
  const roleRows = members
    .map(
      (member) => `
      <tr>
        <td>${esc(member.name)}</td>
        <td>${esc(roles[member.id] ?? "")}</td>
      </tr>`
    )
    .join("");

  return `
    ${sectionHtml("◯ 문제 발견과 선택", nl2br(values.problemChoice ?? ""))}
    ${sectionHtml("◯ 문제 분석 — 현황 파악 계획", nl2br(values.analysisPlan ?? ""))}
    <section class="section">
      <h2 class="section-title">◯ 팀원 역할 분배</h2>
      <table class="data-table">
        <tr><th>팀원명</th><th>역할</th></tr>
        ${roleRows}
      </table>
    </section>
    ${sectionHtml(
      "◯ 문제 분석 양식 준비",
      (() => {
        const form = parseAnalysisForm(values.analysisForms);
        const notes = form.notes ? nl2br(form.notes) : "";
        const pdfLine = form.pdf
          ? `<p>첨부 PDF: <strong>${esc(form.pdf.fileName)}</strong></p>`
          : '<p class="empty">(PDF 미첨부)</p>';
        return `${notes}${notes ? "<br/><br/>" : ""}${pdfLine}`;
      })()
    )}`;
}

function stage2Body(values: Record<string, string>): string {
  return [1, 2, 3, 4, 5, 6]
    .map((n) => sectionHtml(`대안 정책 ${n}`, nl2br(values[`policy${n}`] ?? "")))
    .join("");
}

function stage3Body(values: Record<string, string>): string {
  return `
    ${sectionHtml("1) 정책명", nl2br(values.policyName ?? ""))}
    ${sectionHtml("2) 정책의 특징", nl2br(values.policyFeatures ?? ""))}
    ${sectionHtml("3) 정책의 장점, 단점과 보완 방안", nl2br(values.prosConsRemedy ?? ""))}
    ${sectionHtml("4) 정책 실현을 위해 필요한 노력 및 활동", nl2br(values.realizationEfforts ?? ""))}`;
}

function stage4Body(values: Record<string, string>, members: ReportMember[]): string {
  const activities = ([1, 2, 3, 4] as const).map((n) => parseActivityCard(values[`activity${n}`]));
  const labels = ["활동 내용", "활동 기간", "활동 장소", "활동 방법", "활동 준비", "활동 결과"];
  const keys = ["content", "period", "place", "method", "prep", "result"] as const;

  const activityTable = `
    <table class="data-table activity-grid">
      <tr>
        <th class="row-label">활동</th>
        <th>활동 1</th>
        <th>활동 2</th>
        <th>활동 3</th>
        <th>활동 4</th>
      </tr>
      ${labels
        .map((label, i) => {
          const key = keys[i];
          return `
        <tr>
          <td class="row-label">${label}</td>
          ${activities.map((row) => `<td>${nl2br(row[key] ?? "")}</td>`).join("")}
        </tr>`;
        })
        .join("")}
    </table>`;

  const reflections = parseMemberRoles(values.reflection);
  const reflectionRows = members
    .map(
      (member) => `
      <tr>
        <td>${esc(member.name)}</td>
        <td>${nl2br(reflections[member.id] ?? "")}</td>
      </tr>`
    )
    .join("");

  return `
    <section class="section">
      <h2 class="section-title">◯ 공공정책 실현을 위한 활동 계획 및 실천</h2>
      ${activityTable}
    </section>
    <section class="section">
      <h2 class="section-title">◯ 활동 전체 성찰</h2>
      <table class="data-table">
        <tr><th>팀원명</th><th>성찰 내용</th></tr>
        ${reflectionRows}
      </table>
    </section>`;
}

function stage5Body(values: Record<string, string>, pptOutline?: string): string {
  const outlineSection = pptOutline?.trim()
    ? sectionHtml("AI 발표 PPT 개요 (참고)", nl2br(pptOutline))
    : "";

  return `
    ${sectionHtml("발표 구성 계획", nl2br(values.presentationPlan ?? ""))}
    ${sectionHtml("제출 전 체크리스트", nl2br(values.presentationChecklist ?? ""))}
    ${outlineSection}`;
}

function stageBody(options: StageReportOptions): string {
  const values = options.content[options.stage.key] ?? {};

  switch (options.stage.stage) {
    case 1:
      return stage1Body(values, options.members);
    case 2:
      return stage2Body(values);
    case 3:
      return stage3Body(values);
    case 4:
      return stage4Body(values, options.members);
    case 5:
      return stage5Body(values, options.pptOutline);
    default:
      return "";
  }
}

const PRINT_STYLES = `
  @page { size: A4; margin: 14mm 16mm; }
  * { box-sizing: border-box; }
  body {
    font-family: "Malgun Gothic", "Apple SD Gothic Neo", sans-serif;
    font-size: 11pt;
    line-height: 1.55;
    color: #111;
    margin: 0;
    padding: 0;
  }
  .page { max-width: 180mm; margin: 0 auto; }
  .school { text-align: center; font-size: 10pt; color: #444; margin-bottom: 4mm; }
  .form-title {
    text-align: center;
    font-size: 16pt;
    font-weight: 700;
    margin: 0 0 2mm;
    letter-spacing: -0.02em;
  }
  .form-sub {
    text-align: center;
    font-size: 10pt;
    color: #555;
    margin-bottom: 6mm;
  }
  .info-table, .data-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 5mm;
    font-size: 10pt;
  }
  .info-table td, .info-table th,
  .data-table td, .data-table th {
    border: 1px solid #333;
    padding: 5px 8px;
    vertical-align: top;
    text-align: left;
  }
  .cell-label, .row-label {
    background: #f3f3f3;
    font-weight: 600;
    white-space: nowrap;
    width: 72px;
  }
  .data-table th { background: #f3f3f3; font-weight: 600; }
  .activity-grid td { min-height: 28px; }
  .section { margin-bottom: 5mm; page-break-inside: avoid; }
  .section-title {
    font-size: 11pt;
    font-weight: 700;
    margin: 0 0 2mm;
    padding: 4px 0;
    border-bottom: 1.5px solid #333;
  }
  .section-body {
    min-height: 48px;
    padding: 6px 4px;
    white-space: pre-wrap;
    word-break: break-word;
  }
  .empty { color: #999; }
  .footer {
    margin-top: 8mm;
    text-align: right;
    font-size: 9pt;
    color: #666;
  }
  .print-hint {
    margin-top: 6mm;
    padding: 8px 12px;
    background: #f8f8f8;
    border: 1px dashed #aaa;
    font-size: 9pt;
    text-align: center;
  }
  @media print {
    .no-print { display: none !important; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
`;

export function buildStageReportHtml(options: StageReportOptions): string {
  const { stage, teamName, topicTitle } = options;
  const printedAt = new Date().toLocaleString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const formTitle =
    stage.stage === 5
      ? "사회참여활동 발표 준비 보고서"
      : `사회참여활동 ${stage.formLabel} — ${stage.title}`;

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8"/>
  <title>${esc(`${stage.formLabel}_${teamName}`)}</title>
  <style>${PRINT_STYLES}</style>
</head>
<body>
  <div class="page">
    <p class="school">별가람고등학교 · 사회참여활동</p>
    <h1 class="form-title">${esc(formTitle)}</h1>
    <p class="form-sub">${esc(stage.formLabel)} · ${esc(stage.shortTitle)}</p>
    ${memberHeaderHtml(teamName, topicTitle, options.members)}
    ${stageBody(options)}
    <p class="footer">출력일: ${esc(printedAt)}</p>
    <p class="print-hint no-print">인쇄 대화상자에서 «대상»을 «PDF로 저장»로 선택하면 PDF 파일로 저장할 수 있습니다.</p>
  </div>
</body>
</html>`;
}

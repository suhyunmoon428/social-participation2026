"use client";

type Props = {
  value?: string;
  stageKey?: string;
  fieldKey?: string;
  onChange?: (json: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
};

/**
 * PDF 업로드는 사용하지 않습니다.
 * 문제 분석 양식은 오픈카톡으로 제출하도록 안내합니다.
 */
export function AnalysisFormField(_props: Props) {
  return (
    <div className="rounded-xl border-2 border-rose-300 bg-gradient-to-br from-rose-50 via-amber-50 to-white px-4 py-5 shadow-sm">
      <p className="text-[13px] font-bold tracking-tight text-rose-700">📢 문제 분석 양식 제출 안내</p>
      <p className="mt-3 text-[15px] font-extrabold leading-7 text-slate-900">
        설문지·면담 질문지 등 문제 분석 양식은
        <br />
        <span className="text-rose-600 underline decoration-2 underline-offset-2">
          오픈카톡방
        </span>
        으로{" "}
        <span className="text-rose-600">수현쌤</span>
        에게 제출해 주세요.
      </p>
      <div className="mt-4 rounded-lg border border-rose-200 bg-white/90 px-3 py-3 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-rose-500">제출 기한</p>
        <p className="mt-1 text-[18px] font-black tabular-nums text-rose-700">
          2026년 9월 6일 (토) 23:59까지
        </p>
      </div>
      <p className="mt-3 text-[12px] leading-5 text-slate-600">
        이 칸에는 파일을 올리지 않아도 됩니다. 준비한 PDF·문서 파일은 팀 오픈카톡방에서
        수현쌤께 보내 주세요.
      </p>
    </div>
  );
}

"use client";

type Props = {
  value?: string;
  stageKey?: string;
  fieldKey?: string;
  onChange?: (json: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
};

/** 문제 분석 양식: 사이트 업로드 없음. 오픈카톡 제출 안내만 표시. */
export function AnalysisFormField(_props: Props) {
  return (
    <div className="rounded-xl border-2 border-rose-400 bg-rose-50 px-5 py-6 text-center shadow-sm">
      <p className="text-[17px] font-black leading-8 text-rose-700">
        오픈카톡방으로 수현쌤에게 제출
      </p>
      <p className="mt-3 text-[16px] font-extrabold tabular-nums text-slate-900">
        기한: 2026년 9월 6일 (토) 23:59까지
      </p>
    </div>
  );
}

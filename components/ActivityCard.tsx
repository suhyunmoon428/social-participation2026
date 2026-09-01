"use client";

import { EMPTY_ACTIVITY, parseActivityCard, type ActivityRow } from "@/lib/stages";

const FIELDS: { key: keyof ActivityRow; label: string; placeholder: string }[] = [
  { key: "content", label: "활동 내용", placeholder: "예: 지역 주민 대상 설문조사" },
  { key: "period", label: "활동 기간", placeholder: "예: 10월 3일 ~ 10월 10일" },
  { key: "place", label: "관련 기관 및 장소", placeholder: "예: ○○구청, 학교 앞" },
  { key: "method", label: "활동 방법", placeholder: "예: 대면 인터뷰, 온라인 설문" },
  { key: "prep", label: "준비 사항", placeholder: "예: 설문지 인쇄, 동의서 준비" },
  { key: "result", label: "활동 결과", placeholder: "예: 응답 50명, 주요 의견 3가지 도출" },
];

type Props = {
  value: string;
  onChange: (json: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
};

export function ActivityCard({ value, onChange, onFocus, onBlur }: Props) {
  const row = parseActivityCard(value);

  function update(key: keyof ActivityRow, text: string) {
    onChange(JSON.stringify({ ...row, [key]: text }));
  }

  return (
    <div className="space-y-3 rounded-xl border border-sky-100 bg-sky-50/30 p-4">
      {FIELDS.map((field) => (
        <label key={field.key} className="block">
          <span className="text-[11px] font-semibold text-sky-800">{field.label}</span>
          <textarea
            className="np-input mt-1 min-h-[64px] resize-y py-2 text-[13px] leading-5"
            value={row[field.key]}
            placeholder={field.placeholder}
            onFocus={onFocus}
            onBlur={onBlur}
            onChange={(e) => update(field.key, e.target.value)}
            rows={2}
          />
        </label>
      ))}
    </div>
  );
}

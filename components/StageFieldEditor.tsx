"use client";

import { ActivityCard } from "@/components/ActivityCard";
import { AnalysisFormField } from "@/components/AnalysisFormField";
import { MemberReflectionTable } from "@/components/MemberReflectionTable";
import { MemberRoleTable } from "@/components/MemberRoleTable";
import type { FieldDef } from "@/lib/stages";
import { fieldFilled, parseAnalysisForm } from "@/lib/stages";
import { Markdown } from "@/components/Markdown";

type Member = { id: string; name: string; role?: string };

type Props = {
  field: FieldDef;
  stageKey: string;
  value: string;
  members: Member[];
  memberCount: number;
  onChange: (value: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  teacherComment?: string;
};

export function StageFieldEditor({
  field,
  stageKey,
  value,
  members,
  memberCount,
  onChange,
  onFocus,
  onBlur,
  teacherComment,
}: Props) {
  const done = fieldFilled(field, value, memberCount);
  const isSpecial =
    field.type === "memberRoles" ||
    field.type === "memberReflection" ||
    field.type === "activityCard" ||
    field.type === "analysisFormPdf";

  const charCount =
    field.type === "analysisFormPdf" ? parseAnalysisForm(value).notes.trim().length : value.trim().length;

  return (
    <section className="np-card">
      <div className="flex items-start justify-between gap-3">
        <h2 className="flex items-center gap-2 text-[16px] font-bold text-slate-800">
          <span>{field.emoji}</span>
          {field.label}
        </h2>
        {!isSpecial && (
          <span
            className={[
              "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium",
              done ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400",
            ].join(" ")}
          >
            {charCount}자{done ? " ✓" : ""}
          </span>
        )}
        {isSpecial && (
          <span
            className={[
              "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium",
              done ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400",
            ].join(" ")}
          >
            {done ? "작성 완료 ✓" : "작성 중"}
          </span>
        )}
      </div>
      <p className="mt-1.5 text-[12px] leading-5 text-slate-400">{field.hint}</p>

      <div className="mt-3">
        {field.type === "memberRoles" ? (
          <MemberRoleTable
            members={members}
            value={value}
            onChange={onChange}
            onFocus={onFocus}
            onBlur={onBlur}
          />
        ) : field.type === "memberReflection" ? (
          <MemberReflectionTable
            members={members}
            value={value}
            onChange={onChange}
            onFocus={onFocus}
            onBlur={onBlur}
          />
        ) : field.type === "activityCard" ? (
          <ActivityCard value={value} onChange={onChange} onFocus={onFocus} onBlur={onBlur} />
        ) : field.type === "analysisFormPdf" ? (
          <AnalysisFormField
            value={value}
            stageKey={stageKey}
            fieldKey={field.key}
            onChange={onChange}
            onFocus={onFocus}
            onBlur={onBlur}
          />
        ) : (
          <div className="rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3 focus-within:border-violet-300 focus-within:ring-2 focus-within:ring-violet-50">
            <textarea
              className="np-editor min-h-[130px]"
              placeholder={field.placeholder ?? "여기에 자유롭게 써 보세요 ✨"}
              value={value}
              onFocus={onFocus}
              onBlur={onBlur}
              onChange={(e) => onChange(e.target.value)}
              rows={5}
            />
          </div>
        )}
      </div>

      {teacherComment?.trim() && (
        <div className="mt-3 rounded-lg border border-sky-200 bg-sky-50/70 px-3 py-2.5">
          <p className="text-[11px] font-semibold text-sky-700">👩‍🏫 선생님 피드백</p>
          <div className="mt-1 text-[12px] leading-5 text-slate-600">
            <Markdown text={teacherComment} />
          </div>
        </div>
      )}
    </section>
  );
}

"use client";

import { CollabTextarea } from "@/components/CollabTextarea";
import { ActivityCard } from "@/components/ActivityCard";
import { AnalysisFormField } from "@/components/AnalysisFormField";
import { MemberReflectionTable } from "@/components/MemberReflectionTable";
import { MemberRoleTable } from "@/components/MemberRoleTable";
import { TypingIndicator } from "@/components/TypingIndicator";
import type { FieldTypist, PeerPresence } from "@/lib/presence";
import { colorForStudent } from "@/lib/presence";
import type { FieldDef } from "@/lib/stages";
import { fieldFilled } from "@/lib/stages";
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
  onCursor?: (cursor: number) => void;
  fieldPeers?: PeerPresence[];
  fieldTypists?: FieldTypist[];
  selfId?: string;
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
  onCursor,
  fieldPeers = [],
  fieldTypists = [],
  selfId,
  teacherComment,
}: Props) {
  const done = fieldFilled(field, value, memberCount);
  const isSpecial =
    field.type === "memberRoles" ||
    field.type === "memberReflection" ||
    field.type === "activityCard" ||
    field.type === "analysisFormPdf";

  const charCount = value.trim().length;

  return (
    <section
      className={[
        "np-card transition-shadow",
        fieldPeers.length > 0 ? "ring-2 ring-offset-1" : "",
      ].join(" ")}
      style={
        fieldPeers.length > 0
          ? {
              boxShadow: `0 0 0 1px ${colorForStudent(fieldPeers[0]!.studentId)}55`,
              borderColor: colorForStudent(fieldPeers[0]!.studentId),
            }
          : undefined
      }
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="flex items-center gap-2 text-[16px] font-bold text-slate-800">
          <span>{field.emoji}</span>
          {field.label}
        </h2>
        {!isSpecial && (
          <div className="flex shrink-0 flex-col items-end gap-1">
            <TypingIndicator typists={fieldTypists} />
            <span
              className={[
                "rounded-full px-2 py-0.5 text-[10px] font-medium",
                done ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400",
              ].join(" ")}
            >
              {charCount}자{done ? " ✓" : ""}
            </span>
          </div>
        )}
        {isSpecial && (
          <span
            className={[
              "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium",
              done ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400",
            ].join(" ")}
          >
            {field.type === "analysisFormPdf"
              ? "오픈카톡 제출"
              : done
                ? "작성 완료 ✓"
                : "작성 중"}
          </span>
        )}
      </div>
      <p className="mt-1.5 text-[12px] leading-5 text-slate-400">{field.hint}</p>

      {isSpecial && fieldPeers.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {fieldPeers.map((peer) => (
            <span
              key={peer.studentId}
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm"
              style={{ backgroundColor: colorForStudent(peer.studentId) }}
            >
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white/90" />
              {peer.studentName}
            </span>
          ))}
        </div>
      )}

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
          <CollabTextarea
            value={value}
            placeholder={field.placeholder ?? "여기에 자유롭게 써 보세요 ✨"}
            peers={fieldPeers}
            selfId={selfId}
            onChange={onChange}
            onFocus={onFocus}
            onBlur={onBlur}
            onCursor={onCursor ?? (() => {})}
          />
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

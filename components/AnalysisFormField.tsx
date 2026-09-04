"use client";

import { useRef, useState } from "react";
import { useToast } from "@/components/Toast";
import { apiFetch } from "@/lib/fetcher";
import { parseAnalysisForm, type AnalysisFormValue } from "@/lib/stages";

const PDF_MAX_BYTES = 50 * 1024 * 1024;

type Props = {
  value: string;
  stageKey: string;
  fieldKey: string;
  onChange: (json: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
};

export function AnalysisFormField({ value, stageKey, fieldKey, onChange, onFocus, onBlur }: Props) {
  const { show } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const parsed = parseAnalysisForm(value);

  function update(next: AnalysisFormValue) {
    onChange(JSON.stringify(next));
  }

  async function handleFile(file: File) {
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      show("PDF 파일만 업로드할 수 있어요.", "error");
      return;
    }
    if (file.size > PDF_MAX_BYTES) {
      show("파일 크기는 50MB 이하여야 해요.", "error");
      return;
    }

    setUploading(true);
    try {
      const signed = await apiFetch<{
        fileName: string;
        storagePath: string;
        token: string;
        signedUrl: string;
        uploadedAt: string;
      }>("/api/projects/upload-pdf", {
        method: "POST",
        body: JSON.stringify({
          stageKey,
          fieldKey,
          fileName: file.name,
          fileSize: file.size,
          contentType: file.type || "application/pdf",
        }),
      });

      // Supabase signed upload는 raw body가 아니라 FormData(PUT)를 기대한다.
      const body = new FormData();
      body.append("cacheControl", "3600");
      body.append("", file);

      const uploadRes = await fetch(signed.signedUrl, {
        method: "PUT",
        headers: {
          "x-upsert": "true",
        },
        body,
      });

      if (!uploadRes.ok) {
        const detail = await uploadRes.text().catch(() => "");
        console.error("[pdf-upload]", uploadRes.status, detail.slice(0, 300));
        throw new Error("파일을 업로드하지 못했어요. 잠시 후 다시 시도해 주세요.");
      }

      update({
        ...parsed,
        pdf: {
          fileName: signed.fileName,
          storagePath: signed.storagePath,
          uploadedAt: signed.uploadedAt,
        },
      });
      show("PDF를 업로드했어요! 📎", "success");
    } catch (error) {
      show((error as Error).message, "error");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function removePdf() {
    const next = { ...parsed };
    delete next.pdf;
    update(next);
  }

  const charCount = parsed.notes.trim().length;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3 focus-within:border-violet-300 focus-within:ring-2 focus-within:ring-violet-50">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[11px] font-medium text-slate-500">양식 설명 (선택)</p>
          <span className="text-[10px] text-slate-400">{charCount}자</span>
        </div>
        <textarea
          className="np-editor min-h-[100px]"
          placeholder="만든 양식에 대한 간단한 설명을 적어 주세요."
          value={parsed.notes}
          onFocus={onFocus}
          onBlur={onBlur}
          onChange={(e) => update({ ...parsed, notes: e.target.value })}
          rows={4}
        />
      </div>

      <div className="rounded-xl border border-dashed border-violet-200 bg-violet-50/40 p-4">
        <p className="text-[12px] font-semibold text-violet-800">📎 PDF 양식 첨부 (필수)</p>
        <p className="mt-1 text-[11px] leading-5 text-violet-600">
          설문지·면담 질문지 등 문제 분석 양식을 <b>PDF 파일</b>로 업로드해 주세요.
        </p>

        {parsed.pdf ? (
          <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-violet-200 bg-white px-3 py-2">
            <span className="min-w-0 flex-1 truncate text-[12px] font-medium text-slate-700">
              📄 {parsed.pdf.fileName}
            </span>
            <a
              className="text-[11px] font-medium text-violet-700 underline"
              href={`/api/projects/pdf?path=${encodeURIComponent(parsed.pdf.storagePath)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              열기
            </a>
            <a
              className="text-[11px] font-medium text-violet-700 underline"
              href={`/api/projects/pdf?path=${encodeURIComponent(parsed.pdf.storagePath)}&download=1`}
            >
              다운로드
            </a>
            <button
              type="button"
              className="text-[11px] text-rose-500 hover:underline"
              onClick={removePdf}
            >
              삭제
            </button>
          </div>
        ) : (
          <label className="mt-3 flex cursor-pointer flex-col items-center justify-center rounded-lg border border-violet-200 bg-white px-4 py-6 text-center transition hover:bg-violet-50/50">
            <input
              ref={fileRef}
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleFile(file);
              }}
            />
            <span className="text-2xl">📤</span>
            <span className="mt-2 text-[12px] font-medium text-violet-700">
              {uploading ? "업로드 중…" : "PDF 파일 선택"}
            </span>
            <span className="mt-1 text-[10px] text-slate-400">최대 50MB · PDF만 가능</span>
          </label>
        )}
      </div>
    </div>
  );
}

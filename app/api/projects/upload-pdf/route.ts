import { fail, ok } from "@/lib/apiResponse";
import { getStudentSession } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { STAGE_BY_KEY } from "@/lib/stages";

export const runtime = "nodejs";
export const maxDuration = 60;

export const ATTACHMENT_BUCKET = "project-attachments";
/** 브라우저 → Supabase 직접 업로드라 Vercel 본문 한도를 피한다 */
export const PDF_MAX_BYTES = 50 * 1024 * 1024;

type Body = {
  stageKey?: string;
  fieldKey?: string;
  fileName?: string;
  fileSize?: number;
  contentType?: string;
};

async function ensureBucket(db: ReturnType<typeof supabaseAdmin>) {
  try {
    const { data: buckets } = await db.storage.listBuckets();
    const exists = buckets?.some((b) => b.id === ATTACHMENT_BUCKET || b.name === ATTACHMENT_BUCKET);
    if (exists) {
      await db.storage.updateBucket(ATTACHMENT_BUCKET, {
        public: false,
        fileSizeLimit: PDF_MAX_BYTES,
        allowedMimeTypes: ["application/pdf"],
      });
      return;
    }
  } catch (error) {
    console.error("[ensureBucket] list/update", error);
  }

  const { error } = await db.storage.createBucket(ATTACHMENT_BUCKET, {
    public: false,
    fileSizeLimit: PDF_MAX_BYTES,
    allowedMimeTypes: ["application/pdf"],
  });

  if (error && !/already exists|duplicate|exists/i.test(error.message ?? "")) {
    console.error("[ensureBucket] create", error);
  }
}

/**
 * PDF는 Vercel을 거치지 않고 Supabase Storage로 직접 올린다.
 * 이 API는 서명된 업로드 URL만 발급한다.
 */
export async function POST(request: Request) {
  try {
    const session = getStudentSession();
    if (!session) return fail("UNAUTHENTICATED", 401);

    let body: Body;
    try {
      body = await request.json();
    } catch {
      return fail("INVALID_INPUT", 400);
    }

    const stageKey = String(body.stageKey ?? "");
    const fieldKey = String(body.fieldKey ?? "");
    const fileName = String(body.fileName ?? "").trim();
    const fileSize = Number(body.fileSize ?? 0);
    const contentType = String(body.contentType ?? "");

    if (!STAGE_BY_KEY[stageKey]?.fields.some((f) => f.key === fieldKey)) {
      return fail("INVALID_INPUT", 400);
    }
    if (!fileName) return fail("INVALID_INPUT", 400);

    const isPdf =
      contentType === "application/pdf" || fileName.toLowerCase().endsWith(".pdf");
    if (!isPdf) return fail("PDF_ONLY", 400);
    if (!Number.isFinite(fileSize) || fileSize <= 0) return fail("INVALID_INPUT", 400);
    if (fileSize > PDF_MAX_BYTES) return fail("FILE_TOO_LARGE", 400);

    let db;
    try {
      db = supabaseAdmin();
    } catch {
      return fail("SUPABASE_NOT_CONFIGURED", 500);
    }

    const { data: membership } = await db
      .from("team_members")
      .select("team_id")
      .eq("student_id", session.id)
      .maybeSingle();

    if (!membership) return fail("FORBIDDEN", 403);

    await ensureBucket(db);

    const safeName = fileName.replace(/[^\w.\-가-힣]/g, "_").slice(0, 120) || "upload.pdf";
    const storagePath = `${membership.team_id}/${stageKey}/${fieldKey}/${Date.now()}-${safeName}`;

    const { data, error } = await db.storage
      .from(ATTACHMENT_BUCKET)
      .createSignedUploadUrl(storagePath);

    if (error || !data?.signedUrl || !data.token) {
      console.error("[upload-pdf] signed url", error);
      return fail("UPLOAD_FAILED", 500, error);
    }

    return ok({
      fileName,
      storagePath: data.path || storagePath,
      token: data.token,
      signedUrl: data.signedUrl,
      uploadedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[upload-pdf]", error);
    return fail("UPLOAD_FAILED", 500, error);
  }
}

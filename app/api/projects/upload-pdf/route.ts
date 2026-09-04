import { fail, ok } from "@/lib/apiResponse";
import { getStudentSession } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { STAGE_BY_KEY } from "@/lib/stages";

export const runtime = "nodejs";
export const maxDuration = 60;

const BUCKET = "project-attachments";
/** Vercel 서버리스 요청 본문 한도(~4.5MB)보다 작게 유지 */
const MAX_BYTES = 4 * 1024 * 1024;

function isUploadBlob(value: FormDataEntryValue | null): value is Blob {
  return Boolean(
    value &&
      typeof value !== "string" &&
      typeof (value as Blob).arrayBuffer === "function" &&
      typeof (value as Blob).size === "number"
  );
}

function uploadFileName(file: Blob): string {
  const named = file as Blob & { name?: string };
  return (named.name || "upload.pdf").trim() || "upload.pdf";
}

async function ensureBucket(db: ReturnType<typeof supabaseAdmin>) {
  try {
    const { data: buckets } = await db.storage.listBuckets();
    if (buckets?.some((b) => b.id === BUCKET || b.name === BUCKET)) return;
  } catch {
    // list 실패해도 upload 시도
  }

  const { error } = await db.storage.createBucket(BUCKET, {
    public: false,
    fileSizeLimit: MAX_BYTES,
    allowedMimeTypes: ["application/pdf"],
  });

  if (error && !/already exists|duplicate|exists/i.test(error.message ?? "")) {
    console.error("[ensureBucket]", error);
  }
}

export async function POST(request: Request) {
  try {
    const session = getStudentSession();
    if (!session) return fail("UNAUTHENTICATED", 401);

    let form: FormData;
    try {
      form = await request.formData();
    } catch (error) {
      console.error("[upload-pdf] formData", error);
      return fail("FILE_TOO_LARGE", 413);
    }

    const file = form.get("file");
    const stageKey = String(form.get("stageKey") ?? "");
    const fieldKey = String(form.get("fieldKey") ?? "");

    if (!isUploadBlob(file)) return fail("INVALID_INPUT", 400);
    if (!STAGE_BY_KEY[stageKey]?.fields.some((f) => f.key === fieldKey)) {
      return fail("INVALID_INPUT", 400);
    }

    const fileName = uploadFileName(file);
    const isPdf =
      file.type === "application/pdf" || fileName.toLowerCase().endsWith(".pdf");
    if (!isPdf) return fail("PDF_ONLY", 400);
    if (file.size <= 0) return fail("INVALID_INPUT", 400);
    if (file.size > MAX_BYTES) return fail("FILE_TOO_LARGE", 400);

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
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await db.storage
      .from(BUCKET)
      .upload(storagePath, buffer, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      console.error("[upload-pdf] storage", uploadError);
      return fail("UPLOAD_FAILED", 500, uploadError);
    }

    return ok({
      fileName,
      storagePath,
      uploadedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[upload-pdf]", error);
    return fail("UPLOAD_FAILED", 500, error);
  }
}

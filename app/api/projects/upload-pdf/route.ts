import { fail, ok } from "@/lib/apiResponse";
import { getStudentSession } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { STAGE_BY_KEY } from "@/lib/stages";

export const runtime = "nodejs";

const BUCKET = "project-attachments";
const MAX_BYTES = 8 * 1024 * 1024;

export async function POST(request: Request) {
  const session = getStudentSession();
  if (!session) return fail("UNAUTHENTICATED", 401);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail("INVALID_INPUT", 400);
  }

  const file = form.get("file");
  const stageKey = String(form.get("stageKey") ?? "");
  const fieldKey = String(form.get("fieldKey") ?? "");

  if (!(file instanceof File)) return fail("INVALID_INPUT", 400);
  if (!STAGE_BY_KEY[stageKey]?.fields.some((f) => f.key === fieldKey)) {
    return fail("INVALID_INPUT", 400);
  }

  const isPdf =
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  if (!isPdf) return fail("PDF_ONLY", 400);
  if (file.size > MAX_BYTES) return fail("FILE_TOO_LARGE", 400);

  const db = supabaseAdmin();

  try {
    const { data: membership } = await db
      .from("team_members")
      .select("team_id")
      .eq("student_id", session.id)
      .maybeSingle();

    if (!membership) return fail("FORBIDDEN", 403);

    const safeName = file.name.replace(/[^\w.\-가-힣]/g, "_").slice(0, 120);
    const storagePath = `${membership.team_id}/${stageKey}/${fieldKey}/${Date.now()}-${safeName}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await db.storage
      .from(BUCKET)
      .upload(storagePath, buffer, { contentType: "application/pdf", upsert: false });

    if (uploadError) {
      return fail("UPLOAD_FAILED", 500, uploadError);
    }

    return ok({
      fileName: file.name,
      storagePath,
      uploadedAt: new Date().toISOString(),
    });
  } catch (error) {
    return fail("UPLOAD_FAILED", 500, error);
  }
}

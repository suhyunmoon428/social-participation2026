import { fail } from "@/lib/apiResponse";
import { getStudentSession, isTeacher } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

const BUCKET = "project-attachments";

function fileNameFromPath(path: string): string {
  const last = path.split("/").pop() ?? "attachment.pdf";
  return last.replace(/^\d+-/, "") || "attachment.pdf";
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const path = url.searchParams.get("path");
  const asDownload = url.searchParams.get("download") === "1";
  if (!path || path.includes("..")) return fail("INVALID_INPUT", 400);

  const session = getStudentSession();
  const teacher = isTeacher();
  if (!session && !teacher) return fail("UNAUTHENTICATED", 401);

  const db = supabaseAdmin();

  try {
    if (session) {
      const { data: membership } = await db
        .from("team_members")
        .select("team_id")
        .eq("student_id", session.id)
        .maybeSingle();

      const teamId = membership?.team_id;
      if (!teamId || !path.startsWith(`${teamId}/`)) {
        return fail("FORBIDDEN", 403);
      }
    }

    const { data, error } = await db.storage.from(BUCKET).download(path);
    if (error || !data) return fail("LOAD_FAILED", 404, error);

    const bytes = Buffer.from(await data.arrayBuffer());
    const fileName = fileNameFromPath(path);
    const disposition = asDownload
      ? `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`
      : `inline; filename*=UTF-8''${encodeURIComponent(fileName)}`;

    return new Response(bytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": disposition,
        "Cache-Control": "private, max-age=60",
        "Content-Length": String(bytes.length),
      },
    });
  } catch (error) {
    return fail("LOAD_FAILED", 500, error);
  }
}

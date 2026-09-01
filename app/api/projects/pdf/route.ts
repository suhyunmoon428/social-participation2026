import { fail } from "@/lib/apiResponse";
import { getStudentSession, isTeacher } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

const BUCKET = "project-attachments";

export async function GET(request: Request) {
  const path = new URL(request.url).searchParams.get("path");
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

    const { data, error } = await db.storage.from(BUCKET).createSignedUrl(path, 60 * 10);
    if (error || !data?.signedUrl) return fail("LOAD_FAILED", 404, error);

    return Response.redirect(data.signedUrl, 302);
  } catch (error) {
    return fail("LOAD_FAILED", 500, error);
  }
}

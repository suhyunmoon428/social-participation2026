import { fail, ok } from "@/lib/apiResponse";
import { getStudentSession } from "@/lib/session";
import { loadWorkspace } from "@/lib/workspace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = getStudentSession();
  if (!session) return fail("UNAUTHENTICATED", 401);

  try {
    const workspace = await loadWorkspace(session.id);
    return ok({ student: session, ...workspace });
  } catch (error) {
    return fail("LOAD_FAILED", 500, error);
  }
}

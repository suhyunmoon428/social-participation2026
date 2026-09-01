import { ok } from "@/lib/apiResponse";
import { clearStudentSession, clearTeacherSession } from "@/lib/session";

export const runtime = "nodejs";

export async function POST() {
  clearStudentSession();
  clearTeacherSession();
  return ok({ loggedOut: true });
}

import bcrypt from "bcryptjs";
import { fail, ok } from "@/lib/apiResponse";
import { setTeacherSession } from "@/lib/session";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let password = "";
  try {
    password = (await request.json())?.password ?? "";
  } catch {
    return fail("INVALID_INPUT", 400);
  }

  const hash = process.env.TEACHER_PASSWORD_HASH;
  const plain = process.env.TEACHER_PASSWORD;

  let matched = false;
  if (hash) matched = await bcrypt.compare(password, hash);
  else if (plain) matched = password === plain;
  else return fail("UNKNOWN", 500, "TEACHER_PASSWORD_NOT_CONFIGURED");

  if (!matched) return fail("WRONG_PASSWORD", 401);

  setTeacherSession();
  return ok({ role: "teacher" });
}

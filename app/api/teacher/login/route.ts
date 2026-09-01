import bcrypt from "bcryptjs";
import { fail, ok } from "@/lib/apiResponse";
import { getServerEnvIssue } from "@/lib/serverEnv";
import { setTeacherSession } from "@/lib/session";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let password = "";
  try {
    password = (await request.json())?.password ?? "";
  } catch {
    return fail("INVALID_INPUT", 400);
  }

  const hash = process.env.TEACHER_PASSWORD_HASH?.trim();
  const plain = process.env.TEACHER_PASSWORD?.trim();

  if (!hash && !plain) return fail("TEACHER_NOT_CONFIGURED", 500);

  const envIssue = getServerEnvIssue();
  if (envIssue) return fail(envIssue, 500);

  let matched = false;
  try {
    if (hash) matched = await bcrypt.compare(password, hash);
    else matched = password === plain;
  } catch (error) {
    return fail("TEACHER_NOT_CONFIGURED", 500, error);
  }

  if (!matched) return fail("WRONG_PASSWORD", 401);

  setTeacherSession();
  return ok({ role: "teacher" });
}

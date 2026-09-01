import bcrypt from "bcryptjs";
import { fail, ok } from "@/lib/apiResponse";
import { setStudentSession } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

type Body = {
  grade?: number | string;
  classNo?: number | string;
  studentNo?: number | string;
  name?: string;
  password?: string;
};

function toInt(value: unknown): number | null {
  const n = Number(value);
  return Number.isInteger(n) ? n : null;
}

function validateStudentIdentity(grade: number, classNo: number, studentNo: number): boolean {
  return grade >= 1 && grade <= 6 && classNo >= 1 && classNo <= 30 && studentNo >= 1 && studentNo <= 60;
}

/**
 * 최초 접속이면 학생 정보를 등록하고, 이미 등록된 학생이면 비밀번호를 검증한다.
 */
export async function POST(request: Request) {
  let body: Body;
  try {
    body = await request.json();
  } catch {
    return fail("INVALID_INPUT", 400);
  }

  const grade = toInt(body.grade);
  const classNo = toInt(body.classNo);
  const studentNo = toInt(body.studentNo);
  const name = (body.name ?? "").trim();
  const password = body.password ?? "";

  if (
    grade === null || classNo === null || studentNo === null ||
    name.length < 2 || name.length > 20 || password.length < 4
  ) {
    return fail("INVALID_INPUT", 400);
  }

  if (!validateStudentIdentity(grade, classNo, studentNo)) {
    return fail("INVALID_STUDENT_INFO", 400);
  }

  const loginKey = `${grade}-${classNo}-${studentNo}-${name}`;
  const db = supabaseAdmin();

  try {
    const { data: existing, error: selectError } = await db
      .from("students")
      .select("id, name, login_key, password_hash")
      .eq("login_key", loginKey)
      .maybeSingle();

    if (selectError) return fail("UNKNOWN", 500, selectError);

    if (existing) {
      const matched = await bcrypt.compare(password, existing.password_hash);
      if (!matched) return fail("WRONG_PASSWORD", 401);

      await db.from("students").update({ last_login_at: new Date().toISOString() }).eq("id", existing.id);
      setStudentSession({ id: existing.id, name: existing.name, loginKey: existing.login_key });
      return ok({ id: existing.id, name: existing.name, created: false });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const { data: created, error: insertError } = await db
      .from("students")
      .insert({
        grade,
        class_no: classNo,
        student_no: studentNo,
        name,
        login_key: loginKey,
        password_hash: passwordHash,
        last_login_at: new Date().toISOString(),
      })
      .select("id, name, login_key")
      .single();

    if (insertError || !created) {
      if (insertError?.code === "23505") return fail("DUPLICATE_STUDENT", 409, insertError);
      if (insertError?.code === "23514") return fail("INVALID_STUDENT_INFO", 400, insertError);
      return fail("UNKNOWN", 500, insertError);
    }

    setStudentSession({ id: created.id, name: created.name, loginKey: created.login_key });
    return ok({ id: created.id, name: created.name, created: true });
  } catch (error) {
    return fail("UNKNOWN", 500, error);
  }
}

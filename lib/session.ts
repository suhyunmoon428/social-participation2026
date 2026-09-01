import crypto from "crypto";
import { cookies } from "next/headers";

const STUDENT_COOKIE = "sp_student";
const TEACHER_COOKIE = "sp_teacher";
const MAX_AGE = 60 * 60 * 24 * 30; // 30일

export type StudentSession = {
  id: string;
  name: string;
  loginKey: string;
};

function secret(): string {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 16) throw new Error("SESSION_SECRET_MISSING");
  return value;
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
}

function seal(data: unknown): string {
  const body = Buffer.from(JSON.stringify(data), "utf8").toString("base64url");
  return `${body}.${sign(body)}`;
}

function unseal<T>(token: string | undefined): T | null {
  if (!token) return null;
  const [body, mac] = token.split(".");
  if (!body || !mac) return null;

  const expected = sign(body);
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  try {
    return JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as T;
  } catch {
    return null;
  }
}

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: MAX_AGE,
};

export function setStudentSession(session: StudentSession) {
  cookies().set(STUDENT_COOKIE, seal(session), cookieOptions);
}

export function getStudentSession(): StudentSession | null {
  return unseal<StudentSession>(cookies().get(STUDENT_COOKIE)?.value);
}

export function clearStudentSession() {
  cookies().set(STUDENT_COOKIE, "", { ...cookieOptions, maxAge: 0 });
}

export function setTeacherSession() {
  cookies().set(TEACHER_COOKIE, seal({ role: "teacher", at: Date.now() }), cookieOptions);
}

export function isTeacher(): boolean {
  return unseal<{ role: string }>(cookies().get(TEACHER_COOKIE)?.value)?.role === "teacher";
}

export function clearTeacherSession() {
  cookies().set(TEACHER_COOKIE, "", { ...cookieOptions, maxAge: 0 });
}

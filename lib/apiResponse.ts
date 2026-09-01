import { NextResponse } from "next/server";
import { FRIENDLY_MESSAGES, type FriendlyCode } from "@/lib/messages";

export { FRIENDLY_MESSAGES };
export type { FriendlyCode };

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ ok: true, data }, { status });
}

export function fail(code: FriendlyCode, status = 400, debug?: unknown) {
  if (debug) console.error(`[${code}]`, debug);
  return NextResponse.json(
    { ok: false, message: FRIENDLY_MESSAGES[code], code },
    { status }
  );
}

import { FRIENDLY_MESSAGES } from "@/lib/messages";

export class FriendlyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FriendlyError";
  }
}

/**
 * 모든 클라이언트 요청은 이 함수를 통해 나간다.
 * 실패 시 서버가 준 학생 친화적 메시지를 그대로 throw 한다.
 */
export async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (!(init?.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers,
      credentials: "include",
    });
  } catch {
    throw new FriendlyError("인터넷 연결이 불안정해요. 연결을 확인해 주세요.");
  }

  let payload: any = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok || !payload?.ok) {
    throw new FriendlyError(payload?.message ?? FRIENDLY_MESSAGES.UNKNOWN);
  }

  return payload.data as T;
}

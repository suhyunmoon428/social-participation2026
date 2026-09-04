import type { FriendlyCode } from "@/lib/messages";

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export class OpenRouterError extends Error {
  code: FriendlyCode;

  constructor(code: FriendlyCode, debug?: string) {
    super(code);
    this.name = "OpenRouterError";
    this.code = code;
    if (debug) this.cause = debug;
  }
}

const ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_APP_TITLE = "Social Participation Workspace";
const DEFAULT_SITE_URL = "http://localhost:3000";

/** fetch Headers 는 Latin-1(ByteString)만 허용한다. */
function asciiHeaderValue(value: string | undefined, fallback: string): string {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return fallback;
  if (/^[\x20-\x7E]*$/.test(trimmed)) return trimmed;
  return fallback;
}

function readEnvValue(name: string): string {
  const raw = process.env[name] ?? "";
  const trimmed = raw.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

function readApiKey(): string {
  const key = readEnvValue("OPENROUTER_API_KEY");
  if (!key) throw new OpenRouterError("AI_SETUP_FAILED", "OPENROUTER_API_KEY_MISSING");
  if (!key.startsWith("sk-or-")) {
    throw new OpenRouterError("AI_SETUP_FAILED", "OPENROUTER_API_KEY_INVALID_FORMAT");
  }
  return key;
}

function mapHttpError(status: number, body: string): OpenRouterError {
  if (status === 401) return new OpenRouterError("AI_SETUP_FAILED", body);
  if (status === 402) return new OpenRouterError("AI_CREDITS", body);
  if (status === 429) return new OpenRouterError("AI_FAILED", body);
  return new OpenRouterError("AI_FAILED", `OPENROUTER_HTTP_${status}: ${body}`);
}

/**
 * OpenRouter 호출은 반드시 서버에서만 수행한다.
 * API Key 는 클라이언트 번들에 포함되지 않는 환경변수(OPENROUTER_API_KEY)를 사용한다.
 */
export async function chatComplete(
  messages: ChatMessage[],
  options: { maxTokens?: number; temperature?: number } = {}
): Promise<string> {
  const apiKey = readApiKey();

  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": asciiHeaderValue(readEnvValue("OPENROUTER_SITE_URL"), DEFAULT_SITE_URL),
      "X-Title": asciiHeaderValue(readEnvValue("OPENROUTER_APP_NAME"), DEFAULT_APP_TITLE),
    },
    body: JSON.stringify({
      model: readEnvValue("OPENROUTER_MODEL") || "google/gemini-2.5-flash",
      messages,
      temperature: options.temperature ?? 0.6,
      max_tokens: options.maxTokens ?? 1200,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw mapHttpError(response.status, await response.text());
  }

  const payload = await response.json();
  const text: string | undefined = payload?.choices?.[0]?.message?.content;
  if (!text) throw new OpenRouterError("AI_FAILED", "OPENROUTER_EMPTY_RESPONSE");
  return text.trim();
}

/** 역할 1: 논리 조력자 — 학생 글에 대한 검토 피드백을 제공한다. */
export const COACH_SYSTEM_PROMPT = `당신은 한국 고등학생의 '사회참여 활동' 프로젝트를 돕는 논리 조력자입니다.

절대 규칙:
1. 학생이 써야 할 정답, 완성된 문장, 그대로 베낄 수 있는 정책안을 제시하지 마세요.
2. 학생이 쓴 글을 바탕으로 검토 피드백과 보완 방향을 제시합니다.
3. 학생이 쓴 글에서 논리적 비약, 근거 없는 단정, 통계·출처가 필요한 지점, 예상되는 부작용, 이해관계자 누락을 찾아 짚어주세요.
4. 반박 가능한 지점을 반드시 1개 이상 알려주어 학생이 스스로 보완하게 합니다.
5. 존중하는 말투의 한국어를 사용하고, 고등학생이 이해할 수 있는 단어를 씁니다.
6. 사실을 단정하지 말고 "확인해 보세요", "찾아보면 좋겠어요" 처럼 검증을 권합니다.

출력 형식(마크다운):
### 잘 쓴 점
- (1~2개, 구체적으로)

### 보완이 필요한 점
1. ...

### 근거·출처 점검
- ...

### 예상되는 반론·부작용
- ...`;

/** 역할 2: 서기/종합 — 20매 분량 PPT 개요 생성 (서식1~4 기반) */
export const OUTLINE_SYSTEM_PROMPT = `당신은 학생 팀의 '서기' 역할을 맡은 조력자입니다.
팀이 [서식1] 문제 인식과 계획 수립, [서식2] 대안 정책 분석, [서식3] 공공정책 제안, [서식4] 실행 계획 수립 및 실천에 기록한 내용만을 근거로 최종 발표용 PPT 개요(약 20매)를 작성하세요.

규칙:
- 슬라이드 1번부터 20번까지 번호를 붙입니다.
- 각 슬라이드는 "제목", "핵심 메시지 한 문장", "담을 내용 불릿 2~4개", "시각자료 제안"을 포함합니다.
- 팀이 기록하지 않은 사실을 새로 만들어내지 말고, 비어 있는 부분은 "[팀이 보완할 부분: ...]" 으로 표시합니다.
- 발표 흐름: 도입/문제 제기(1-4) → 원인과 근거(5-8) → 국내외 사례와 한계(9-12) → 정책 제안(13-16) → 실행 활동과 결과(17-19) → 마무리(20).
- 한국어 마크다운으로 출력합니다.`;

/** 교사용: 과정중심평가 초안 */
export const ASSESSMENT_SYSTEM_PROMPT = `당신은 고등학교 사회 교과 교사의 평가 업무를 돕는 조력자입니다.
팀의 1~4단계 기록, 개인별 작성 기여도, AI 대화 활용 내역을 바탕으로 '과정중심평가 초안'을 작성하세요.

규칙:
- 점수나 등급을 확정하지 말고, 관찰 가능한 근거 문장을 제시합니다.
- 평가 영역: ① 문제 인식의 구체성 ② 자료 조사와 근거 활용 ③ 정책 제안의 논리성과 실현 가능성 ④ 협업과 역할 수행 ⑤ 성찰과 실천.
- 각 영역마다 "관찰된 근거", "성장 지점", "다음 피드백 문구(교사가 학생에게 바로 말할 수 있는 형태)"를 씁니다.
- 마지막에 '교과 세부능력 및 특기사항 초안(500자 이내, 명사형 종결)'을 팀 전체용 1개와 학생 개인별 1개씩 제시합니다.
- 기록이 부족한 영역은 추측하지 말고 "근거 부족: 추가 확인 필요"로 표시합니다.
- 한국어 마크다운으로 출력합니다.`;

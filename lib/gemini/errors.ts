// Gemini 오류 → 실패 원인 분류.

import "server-only";

import type { Failure } from "@/lib/errors";

export class MissingApiKeyError extends Error {
  constructor() {
    super("GEMINI_API_KEY 가 설정되지 않았습니다.");
    this.name = "MissingApiKeyError";
  }
}

export function classifyGeminiError(error: unknown): Failure {
  if (error instanceof MissingApiKeyError) return { code: "config", detail: "GEMINI_API_KEY 없음" };
  if (!(error instanceof Error)) return { code: "unknown" };

  const status = (error as { status?: unknown }).status;
  const message = error.message;
  // Gemini 는 오류 JSON 을 문자열로 한 번 더 감싸 보내기도 한다 (\" 이스케이프) — 둘 다 읽는다
  const reason = message.match(/\\?"status\\?":\s*\\?"([A-Z_]+)\\?"/)?.[1] ?? "";
  const detail = typeof status === "number" ? `Gemini ${status}${reason ? ` ${reason}` : ""}` : error.name;

  if (status === 429) {
    // 429 RESOURCE_EXHAUSTED 는 분당 요청 제한과 할당량(토큰·일일 한도) 소진을 모두 뜻한다 — 메시지로 구분
    return /quota|billing|exceeded your current/i.test(message) ? { code: "quota", detail } : { code: "rate", detail };
  }
  if (status === 401 || status === 403 || status === 404 || /API key not valid|API_KEY_INVALID|PERMISSION_DENIED/i.test(message)) {
    return { code: "config", detail };
  }
  if (status === 500 || status === 502 || status === 503 || status === 504) return { code: "overloaded", detail };
  if (/timeout|timed out|ETIMEDOUT|ECONNRESET|fetch failed/i.test(message)) return { code: "interrupted", detail };
  return { code: "unknown", detail };
}

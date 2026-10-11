// Gemini 호출 클라이언트. 서버 전용 — 키는 GEMINI_API_KEY (NEXT_PUBLIC_ 금지).

import "server-only";

import { GoogleGenAI } from "@google/genai";
import type { ChatTurn } from "@/types/saju";

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY 가 설정되지 않았습니다.");
  client ??= new GoogleGenAI({ apiKey });
  return client;
}

export const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-flash-latest";
const FALLBACK_MODELS = (process.env.GEMINI_FALLBACK_MODELS || "gemini-2.5-flash,gemini-flash-lite-latest")
  .split(",")
  .map((name) => name.trim())
  .filter(Boolean);
const TEMPERATURE = Number(process.env.GEMINI_TEMPERATURE || "0.6");

/** 과부하·일시 오류 — 다른 모델이나 잠시 뒤 재시도로 풀릴 수 있다 */
const RETRYABLE_STATUS = new Set([429, 500, 503]);

export type { ChatTurn };

function isRetryable(error: unknown): boolean {
  const status = (error as { status?: unknown })?.status;
  return typeof status === "number" && RETRYABLE_STATUS.has(status);
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * 텍스트 조각을 차례로 내보내는 스트림.
 * 첫 조각이 나오기 전에 일시 오류가 나면: 기본 모델 1회 재시도 → 대체 모델 순서로 넘어간다.
 * 이미 내보내기 시작한 뒤의 오류는 그대로 던진다 (문장이 섞이지 않게).
 */
export async function* streamText(systemInstruction: string, turns: ChatTurn[]): AsyncGenerator<string> {
  const attempts = [GEMINI_MODEL, GEMINI_MODEL, ...FALLBACK_MODELS.filter((name) => name !== GEMINI_MODEL)];
  let lastError: unknown;

  for (const [i, model] of attempts.entries()) {
    if (i === 1) await sleep(1000);
    let started = false;
    try {
      const response = await getClient().models.generateContentStream({
        model,
        contents: turns.map((turn) => ({ role: turn.role, parts: [{ text: turn.text }] })),
        config: { systemInstruction, temperature: TEMPERATURE },
      });
      for await (const chunk of response) {
        if (!chunk.text) continue;
        started = true;
        yield chunk.text;
      }
      return;
    } catch (error) {
      if (started || !isRetryable(error)) throw error;
      lastError = error;
      console.warn(`[gemini] ${model} 일시 오류(${(error as { status: number }).status}) — 다음 시도로 넘어감`);
    }
  }
  throw lastError;
}

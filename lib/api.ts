// Route Handler 공통: 입력 검증 · 오류 응답 · 텍스트 스트리밍 · 호출 제한.
// 개인정보 원칙: 생년월일시는 로그에 남기지 않는다.

import "server-only";

import { z } from "zod";
import type { BirthInput } from "@/types/saju";
import { birthInputSchema } from "@/lib/saju/schema";
import { LunarConversionError } from "@/lib/saju/compute";
import { classifyGeminiError } from "@/lib/gemini/errors";
import type { Failure } from "@/lib/errors";

export class InputError extends Error {}

export function parseBirthInput(value: unknown): BirthInput {
  const parsed = birthInputSchema.safeParse(value);
  if (!parsed.success) {
    throw new InputError(parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요.");
  }
  return parsed.data;
}

export function errorResponse(error: unknown): Response {
  if (error instanceof InputError || error instanceof z.ZodError) {
    return Response.json({ error: error.message }, { status: 400 });
  }
  if (error instanceof LunarConversionError) {
    return Response.json({ error: error.message }, { status: 422 });
  }
  console.error("[api] 처리 실패:", error instanceof Error ? error.name : "unknown");
  return Response.json(
    { error: "잠시 문제가 생겼어요. 조금 뒤에 다시 시도해 주세요." },
    { status: 500 },
  );
}

/** 로그용 오류 설명. 외부 API 오류(상태·메시지)만 남기고 요청 본문은 남기지 않는다. */
function describeError(error: unknown): string {
  if (!(error instanceof Error)) return "unknown";
  const status = (error as { status?: unknown }).status;
  return `${error.name}${typeof status === "number" ? ` ${status}` : ""}: ${error.message.slice(0, 500)}`;
}

/** 스트리밍 도중 오류가 나면 이 마커 뒤에 분류된 원인(JSON Failure)을 붙인다 (클라이언트가 감지) */
export const STREAM_ERROR_MARK = "\n@@error\n";

export function textStreamResponse(chunks: AsyncGenerator<string>): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
      } catch (error) {
        const failure = classifyGeminiError(error);
        console.error(`[api] 스트리밍 실패 (${failure.code}):`, describeError(error));
        controller.enqueue(encoder.encode(`${STREAM_ERROR_MARK}${JSON.stringify(failure)}`));
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}

// ⚠️ 인스턴스 메모리 기반 — 서버리스에서는 인스턴스마다 따로 센다.
// 운영 배포 전 외부 저장소(예: Upstash Redis) 기반으로 교체해야 한다 (개발 계획 7단계).
const WINDOW_MS = 60_000;
const LIMIT_PER_WINDOW = Number(process.env.LLM_RATE_LIMIT_PER_MINUTE || "10");
const hits = new Map<string, { count: number; resetAt: number }>();

export function rateLimited(request: Request): boolean {
  const key = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || entry.resetAt < now) {
    hits.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > LIMIT_PER_WINDOW;
}

export function tooManyRequests(): Response {
  const failure: Failure = { code: "rate", detail: "서비스 호출 제한 (IP당 분당)" };
  return Response.json({ error: "요청이 많아요. 1분 뒤에 다시 시도해 주세요.", failure }, { status: 429 });
}

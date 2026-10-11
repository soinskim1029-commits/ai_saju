import { describe, expect, it } from "vitest";
import { classifyGeminiError, MissingApiKeyError } from "./errors";

function apiError(status: number, body: string) {
  return Object.assign(new Error(body), { name: "ApiError", status });
}

describe("Gemini 오류 분류", () => {
  it("할당량(토큰) 소진 429 는 quota", () => {
    const error = apiError(429, '{"error":{"code":429,"message":"You exceeded your current quota, please check your plan and billing details.","status":"RESOURCE_EXHAUSTED"}}');
    expect(classifyGeminiError(error)).toEqual({ code: "quota", detail: "Gemini 429 RESOURCE_EXHAUSTED" });
  });
  it("분당 요청 제한 429 는 rate", () => {
    const error = apiError(429, '{"error":{"code":429,"message":"Resource has been exhausted (e.g. check rate limits).","status":"RESOURCE_EXHAUSTED"}}');
    expect(classifyGeminiError(error).code).toBe("rate");
  });
  it("과부하 503 은 overloaded (단순 일시 오류)", () => {
    const error = apiError(503, '{"error":{"code":503,"message":"This model is currently experiencing high demand.","status":"UNAVAILABLE"}}');
    expect(classifyGeminiError(error)).toEqual({ code: "overloaded", detail: "Gemini 503 UNAVAILABLE" });
  });
  it("잘못된 키 · 키 없음 · 없는 모델은 config", () => {
    expect(classifyGeminiError(apiError(400, '{"error":{"message":"API key not valid. Please pass a valid API key.","status":"INVALID_ARGUMENT"}}')).code).toBe("config");
    expect(classifyGeminiError(new MissingApiKeyError()).code).toBe("config");
    expect(classifyGeminiError(apiError(404, '{"error":{"message":"models/x is not found","status":"NOT_FOUND"}}')).code).toBe("config");
  });
  it("이중으로 감싼 오류 JSON 에서도 상태명을 읽는다", () => {
    const error = apiError(503, JSON.stringify({ error: { message: JSON.stringify({ error: { code: 503, status: "UNAVAILABLE" } }, null, 2), code: 503 } }));
    expect(classifyGeminiError(error).detail).toBe("Gemini 503 UNAVAILABLE");
  });
  it("네트워크 끊김은 interrupted, 그 밖은 unknown", () => {
    expect(classifyGeminiError(new TypeError("fetch failed")).code).toBe("interrupted");
    expect(classifyGeminiError(new Error("뭔가 이상함")).code).toBe("unknown");
  });
});

// 서버의 텍스트 스트림을 읽어 누적 텍스트를 콜백으로 넘긴다.
// 실패하면 원인(Failure)을 담은 StreamError 를 던진다.

import { parseFailure, type Failure } from "@/lib/errors";

/** lib/api.ts STREAM_ERROR_MARK 와 같은 값 */
const STREAM_ERROR_MARK = "\n@@error\n";
const GENERIC_MESSAGE = "잠시 문제가 생겼어요. 다시 시도해 주세요.";

export class StreamError extends Error {
  constructor(message: string, readonly failure: Failure) {
    super(message);
    this.name = "StreamError";
  }
}

export async function readError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: string };
    return body.error ?? GENERIC_MESSAGE;
  } catch {
    return GENERIC_MESSAGE;
  }
}

async function failedResponse(response: Response): Promise<StreamError> {
  try {
    const body = (await response.json()) as { error?: string; failure?: unknown };
    const failure = body.failure ? parseFailure(body.failure) : { code: "unknown" as const, detail: `HTTP ${response.status}` };
    return new StreamError(body.error ?? GENERIC_MESSAGE, failure);
  } catch {
    // 플랫폼이 HTML 오류 페이지를 돌려준 경우 (함수 시간 초과 등)
    const code = response.status === 504 ? "interrupted" : "unknown";
    return new StreamError(GENERIC_MESSAGE, { code, detail: `HTTP ${response.status}` });
  }
}

export async function streamPost(
  url: string,
  body: unknown,
  onText: (text: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal,
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new StreamError("네트워크 연결을 확인해 주세요.", { code: "interrupted", detail: "네트워크 요청 실패" });
  }
  if (!response.ok || !response.body) throw await failedResponse(response);

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let text = "";
  for (;;) {
    let chunk: ReadableStreamReadResult<Uint8Array>;
    try {
      chunk = await reader.read();
    } catch (error) {
      if (signal?.aborted) throw error;
      throw new StreamError("응답이 중간에 끊겼어요.", { code: "interrupted", detail: "스트림 연결 끊김" });
    }
    if (chunk.done) break;
    text += decoder.decode(chunk.value, { stream: true });
    const errorAt = text.indexOf(STREAM_ERROR_MARK);
    if (errorAt >= 0) {
      // 마커 뒤 JSON 이 아직 다 오지 않았을 수 있으니 끝까지 읽는다
      let rest = text.slice(errorAt + STREAM_ERROR_MARK.length);
      for (;;) {
        const more = await reader.read().catch(() => ({ done: true as const, value: undefined }));
        if (more.done) break;
        rest += decoder.decode(more.value, { stream: true });
      }
      onText(text.slice(0, errorAt));
      let failure: Failure;
      try {
        failure = parseFailure(JSON.parse(rest));
      } catch {
        failure = { code: "unknown" };
      }
      throw new StreamError(GENERIC_MESSAGE, failure);
    }
    onText(text);
  }
  return text;
}

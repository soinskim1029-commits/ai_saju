// 서버의 텍스트 스트림을 읽어 누적 텍스트를 콜백으로 넘긴다.

/** lib/api.ts STREAM_ERROR_MARK 와 같은 값 */
const STREAM_ERROR_MARK = "\n@@error\n";

export class StreamError extends Error {}

export async function readError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: string };
    return body.error ?? "잠시 문제가 생겼어요. 다시 시도해 주세요.";
  } catch {
    return "잠시 문제가 생겼어요. 다시 시도해 주세요.";
  }
}

export async function streamPost(
  url: string,
  body: unknown,
  onText: (text: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  if (!response.ok || !response.body) throw new StreamError(await readError(response));

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let text = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    text += decoder.decode(value, { stream: true });
    const errorAt = text.indexOf(STREAM_ERROR_MARK);
    if (errorAt >= 0) {
      onText(text.slice(0, errorAt));
      throw new StreamError(text.slice(errorAt + STREAM_ERROR_MARK.length) || "풀이를 이어 쓰지 못했어요.");
    }
    onText(text);
  }
  return text;
}

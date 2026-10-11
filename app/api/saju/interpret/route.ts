// ② 해석 스트리밍. 클라이언트가 보낸 계산 결과를 믿지 않고, 입력값으로 서버에서 다시 계산한다.

import { errorResponse, parseBirthInput, rateLimited, textStreamResponse, tooManyRequests } from "@/lib/api";
import { streamText } from "@/lib/gemini/client";
import { buildSystemPrompt, buildUserPrompt } from "@/lib/prompt/build";
import { computeSaju } from "@/lib/saju/compute";

export async function POST(request: Request) {
  if (rateLimited(request)) return tooManyRequests();
  try {
    const input = parseBirthInput(await request.json());
    const result = computeSaju(input);
    const topics = input.topics.length ? input.topics : ["general" as const];
    return textStreamResponse(streamText(buildSystemPrompt(), [{ role: "user", text: buildUserPrompt(result, topics) }]));
  } catch (error) {
    return errorResponse(error);
  }
}

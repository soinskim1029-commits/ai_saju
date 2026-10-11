// 대화형 상담. DB가 없으므로 대화 기록은 클라이언트가 매번 보낸다 (최근 턴만 사용).

import { z } from "zod";
import { errorResponse, InputError, parseBirthInput, rateLimited, textStreamResponse, tooManyRequests } from "@/lib/api";
import { streamText, type ChatTurn } from "@/lib/gemini/client";
import { buildChatSystemPrompt } from "@/lib/prompt/chat";
import { computeSaju } from "@/lib/saju/compute";

const MAX_TURNS = 8;

const bodySchema = z.object({
  input: z.unknown(),
  history: z
    .array(z.object({ role: z.enum(["user", "model"]), text: z.string().max(4000) }))
    .max(40),
  message: z.string().trim().min(1, "메시지를 입력해 주세요.").max(500, "메시지는 500자 이내로 입력해 주세요."),
});

export async function POST(request: Request) {
  if (rateLimited(request)) return tooManyRequests();
  try {
    const body = bodySchema.safeParse(await request.json());
    if (!body.success) throw new InputError(body.error.issues[0]?.message ?? "요청을 확인해 주세요.");

    const input = parseBirthInput(body.data.input);
    const result = computeSaju(input);
    const turns: ChatTurn[] = [...body.data.history.slice(-MAX_TURNS), { role: "user", text: body.data.message }];
    // Gemini 대화는 user 턴으로 시작해야 한다
    while (turns.length && turns[0].role !== "user") turns.shift();

    return textStreamResponse(streamText(buildChatSystemPrompt(result), turns));
  } catch (error) {
    return errorResponse(error);
  }
}

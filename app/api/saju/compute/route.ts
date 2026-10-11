// ① 계산만. LLM 없이 즉시 응답해 결과 화면을 먼저 그린다.

import { errorResponse, parseBirthInput } from "@/lib/api";
import { computeSaju } from "@/lib/saju/compute";

export async function POST(request: Request) {
  try {
    const input = parseBirthInput(await request.json());
    return Response.json({ result: computeSaju(input) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorResponse(error);
  }
}

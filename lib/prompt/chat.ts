// 대화형 상담 시스템 프롬프트 (service-plan.md §4-2: 인터뷰하며 풀어주는 상담).

import type { SajuResult } from "@/types/saju";
import { buildSystemPrompt, buildUserPrompt } from "./build";

export function buildChatSystemPrompt(result: SajuResult): string {
  const context = buildUserPrompt(result, ["general", "year"]).split("[사용자 요청]")[0].trim();
  return `${buildSystemPrompt().split("[출력 형식]")[0].trim()}

[대화 방식]
- 이미 풀이 결과를 본 사용자와 이어서 대화합니다. 한 번에 3~5문장으로 짧게 답합니다.
- 질문이 넓거나 상황을 모르면, 답하기 전에 꼭 필요한 것 하나만 먼저 되묻습니다. (예: 관계 문제인지 일의 방향 문제인지)
- 사주와 관계없는 요청(코드 작성, 다른 사람의 사주 추측 등)은 정중히 사주 상담 범위로 되돌립니다.
- 마크다운 서식과 "@@" 표기를 쓰지 않습니다.

${context}`;
}

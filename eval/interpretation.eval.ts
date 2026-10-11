// 해석 품질 평가 (실제 Gemini 호출 — 비용 발생).
// 실행: GEMINI_API_KEY=... npm run eval   (EVAL_RUNS 로 입력당 반복 횟수 조절, 기본 3)
//
// 예시 입력마다 여러 번 생성해 구조·금지 표현·환각(없는 간지)을 자동 점검한다.

import { describe, expect, it } from "vitest";
import type { BirthInput } from "@/types/saju";
import { computeSaju } from "@/lib/saju/compute";
import { streamText } from "@/lib/gemini/client";
import { buildSystemPrompt, buildUserPrompt } from "@/lib/prompt/build";
import { checkInterpretation } from "@/lib/prompt/checks";

const RUNS = Number(process.env.EVAL_RUNS ?? "3");

const fixtures: BirthInput[] = [
  { calendar: "solar", isLeapMonth: false, birthDate: "1996-03-14", birthTime: "10:30", gender: "female", birthCity: "seoul", topics: ["general", "year", "love"], targetYear: 2026 },
  { calendar: "solar", isLeapMonth: false, birthDate: "1990-03-15", birthTime: "10:30", gender: "male", birthCity: "seoul", topics: ["general", "year", "career"], targetYear: 2026 },
  { calendar: "solar", isLeapMonth: false, birthDate: "1999-11-02", birthTime: null, gender: "female", birthCity: null, topics: ["general", "year"], targetYear: 2026 },
  { calendar: "lunar", isLeapMonth: true, birthDate: "2001-04-10", birthTime: "06:15", gender: "male", birthCity: "busan", topics: ["general", "wealth"], targetYear: 2026 },
  { calendar: "solar", isLeapMonth: false, birthDate: "1985-12-24", birthTime: "23:40", gender: "female", birthCity: "gwangju", topics: ["general", "year", "love", "career", "wealth"], targetYear: 2026 },
];

async function collect(chunks: AsyncGenerator<string>): Promise<string> {
  let text = "";
  for await (const chunk of chunks) text += chunk;
  return text;
}

describe.skipIf(!process.env.GEMINI_API_KEY)("해석 품질 평가", () => {
  for (const [i, input] of fixtures.entries()) {
    it(`예시 ${i + 1} (${input.birthDate}) × ${RUNS}회`, async () => {
      const result = computeSaju(input);
      const failures: string[] = [];
      for (let run = 0; run < RUNS; run += 1) {
        const text = await collect(streamText(buildSystemPrompt(), [{ role: "user", text: buildUserPrompt(result, input.topics) }]));
        const check = checkInterpretation(text, result, input.topics);
        if (!check.ok) failures.push(`#${run + 1}: ${check.problems.join(", ")}`);
      }
      expect(failures).toEqual([]);
    }, 180_000);
  }
});

// 해석 결과 자동 점검 (interpretation-prompt.md §6 품질 관리).
// 평가 스크립트와 테스트에서 쓴다.

import type { SajuResult, Topic } from "@/types/saju";
import { BRANCHES, STEMS } from "@/lib/saju/constants";
import { parseSections, sectionsFor } from "./sections";

export const FORBIDDEN_PATTERNS: RegExp[] = [
  /사망|죽(는|을|음)/,
  /(암|불치병|중병)에 걸/,
  /저주/,
  /반드시 (망|실패|이혼|헤어)/,
  /(투자|매수|매도)하세요/,
  /이혼하세요|헤어지세요/,
];

export interface CheckResult {
  ok: boolean;
  problems: string[];
}

export function checkInterpretation(text: string, result: SajuResult, topics: Topic[]): CheckResult {
  const problems: string[] = [];
  const sections = parseSections(text);

  for (const key of sectionsFor(topics)) {
    if (!sections[key]) problems.push(`섹션 누락: @@${key}`);
  }

  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(text)) problems.push(`금지 표현: ${pattern}`);
  }

  // 환각 검출: 계산 결과에 없는 간지 한자(두 글자 조합)를 언급하는지
  const known = new Set(
    [result.pillars.year, result.pillars.month, result.pillars.day, result.pillars.hour, result.yearLuck.pillar]
      .filter((p) => p !== null)
      .map((p) => p.hanja),
  );
  const stems = STEMS.map((s) => s.hanja).join("");
  const branches = BRANCHES.map((b) => b.hanja).join("");
  for (const match of text.matchAll(new RegExp(`[${stems}][${branches}]`, "g"))) {
    if (!known.has(match[0])) problems.push(`계산 결과에 없는 간지: ${match[0]}`);
  }

  if (/^#|\*\*/m.test(text)) problems.push("마크다운 서식 사용");

  return { ok: problems.length === 0, problems };
}

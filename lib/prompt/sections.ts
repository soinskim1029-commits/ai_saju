// 해석 출력의 섹션 규약. 서버(프롬프트)와 클라이언트(스트리밍 파싱)가 함께 쓴다.
// LLM은 각 섹션을 "@@키" 한 줄로 시작한다.

import type { Topic } from "@/types/saju";

export const SECTION_KEYS = ["summary", "elements", "year", "love", "career", "wealth", "advice"] as const;
export type SectionKey = (typeof SECTION_KEYS)[number];

export const SECTION_TITLES: Record<SectionKey, string> = {
  summary: "한 줄 요약",
  elements: "오행 분포",
  year: "올해의 흐름",
  love: "연애",
  career: "직업",
  wealth: "재물",
  advice: "실천 조언",
};

/** 사용자가 고른 주제에 따라 생성할 섹션 순서 */
export function sectionsFor(topics: Topic[]): SectionKey[] {
  const keys: SectionKey[] = ["summary", "elements"];
  if (topics.includes("year")) keys.push("year");
  for (const topic of ["love", "career", "wealth"] as const) {
    if (topics.includes(topic)) keys.push(topic);
  }
  keys.push("advice");
  return keys;
}

/** 스트리밍 중인 텍스트를 섹션별로 나눈다. 마커 이전 텍스트는 버린다. */
export function parseSections(text: string): Partial<Record<SectionKey, string>> {
  const result: Partial<Record<SectionKey, string>> = {};
  const pattern = /^@@(\w+)\s*$/gm;
  const marks: { key: SectionKey; start: number; end: number }[] = [];
  for (const match of text.matchAll(pattern)) {
    const key = match[1] as SectionKey;
    if (!SECTION_KEYS.includes(key)) continue;
    marks.push({ key, start: match.index, end: match.index + match[0].length });
  }
  marks.forEach((mark, i) => {
    const next = marks[i + 1];
    result[mark.key] = text.slice(mark.end, next ? next.start : undefined).trim();
  });
  return result;
}

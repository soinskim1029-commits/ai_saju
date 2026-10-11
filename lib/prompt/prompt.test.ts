import { describe, expect, it } from "vitest";
import type { BirthInput } from "@/types/saju";
import { computeSaju } from "@/lib/saju/compute";
import { buildSystemPrompt, buildUserPrompt } from "./build";
import { buildChatSystemPrompt } from "./chat";
import { checkInterpretation } from "./checks";
import { parseSections, sectionsFor } from "./sections";

const base: BirthInput = {
  calendar: "solar",
  isLeapMonth: false,
  birthDate: "1996-03-14",
  birthTime: "10:30",
  gender: "female",
  birthCity: "seoul",
  topics: ["general", "year", "love"],
  targetYear: 2026,
};

describe("프롬프트 조립", () => {
  it("계산 결과의 네 기둥과 세운이 그대로 들어간다", () => {
    const prompt = buildUserPrompt(computeSaju(base), base.topics);
    for (const hanja of ["丙子", "辛卯", "庚戌", "辛巳", "丙午"]) expect(prompt).toContain(hanja);
    expect(prompt).toContain("일간(나): 경(庚)");
    expect(prompt).toMatch(/@@summary[\s\S]*@@elements[\s\S]*@@year[\s\S]*@@love[\s\S]*@@advice/);
    expect(prompt).not.toContain("@@career");
  });

  it("시간 미상이면 시주를 미상으로 표기한다", () => {
    const prompt = buildUserPrompt(computeSaju({ ...base, birthTime: null }), base.topics);
    expect(prompt).toContain("시주: 미상(시간 정보 없음)");
  });

  it("시스템 프롬프트에 성별-음양 금지 규칙이 있다", () => {
    expect(buildSystemPrompt()).toContain("성별을 근거로 음양의 강약을 판단하지 않습니다");
  });

  it("대화 프롬프트는 섹션 형식 없이 계산 결과를 포함한다", () => {
    const prompt = buildChatSystemPrompt(computeSaju(base));
    expect(prompt).toContain("庚戌");
    expect(prompt).not.toContain("[출력 형식]");
    expect(prompt).not.toContain("[작성할 섹션");
  });
});

describe("섹션 파싱", () => {
  it("스트리밍 중간 텍스트도 섹션별로 나눈다", () => {
    const partial = "@@summary\n단단한 쇠.\n설명입니다.\n@@elements\n금이 강하고";
    expect(parseSections(partial)).toEqual({ summary: "단단한 쇠.\n설명입니다.", elements: "금이 강하고" });
  });
  it("주제에 따라 섹션 순서가 정해진다", () => {
    expect(sectionsFor(["general", "wealth", "year"])).toEqual(["summary", "elements", "year", "wealth", "advice"]);
  });
});

describe("해석 자동 점검", () => {
  const result = computeSaju(base);
  const good = [
    "@@summary", "불 속에서 다듬어지는 쇠.", "경금(庚金) 일간은…",
    "@@elements", "금이 강해요.",
    "@@year", "병오(丙午)년은 관의 기운이…",
    "@@love", "표현을 부드럽게 다듬으면 좋아요.",
    "@@advice", "- 루틴 — 이유", "- 기록 — 이유", "- 말끝 — 이유",
  ].join("\n");

  it("규칙을 지킨 답변은 통과", () => {
    expect(checkInterpretation(good, result, base.topics)).toEqual({ ok: true, problems: [] });
  });
  it("없는 간지를 지어내면 잡아낸다", () => {
    expect(checkInterpretation(good + "\n갑자(甲子)의 기운", result, base.topics).problems).toContain("계산 결과에 없는 간지: 甲子");
  });
  it("섹션 누락과 금지 표현을 잡아낸다", () => {
    const bad = "@@summary\n올해 사망할 수 있어요.";
    const { problems } = checkInterpretation(bad, result, base.topics);
    expect(problems).toContain("섹션 누락: @@elements");
    expect(problems.some((p) => p.startsWith("금지 표현"))).toBe(true);
  });
});

// 해석 프롬프트 조립 (docs/saju/interpretation-prompt.md §1~§4).
// LLM은 해석만 한다. 계산 결과는 전부 여기서 문자열로 주입하고, 없는 값은 넣지 않는다.

import type { Element, Pillar, SajuResult, Topic } from "@/types/saju";
import { ELEMENT_KO } from "@/lib/saju/constants";
import { SECTION_TITLES, sectionsFor, type SectionKey } from "./sections";

/** §0 튜닝 변수. 톤을 바꾸려면 여기만 바꾼다. */
export const TUNING = {
  TONE: "전문 상담사형 존댓말 (정중하고 차분하게)",
  LENGTH: "섹션당 2~4문장, 짧은 문단",
  TERM_LEVEL: "전문용어는 괄호로 가볍게 병기 (예: 재물운(정재))",
  EMOJI: "사용하지 않음",
} as const;

const STRENGTH_KO = { strong: "신강(강한 편)", balanced: "중화(균형)", weak: "신약(약한 편)" } as const;
const YINYANG_KO = { yang: "양", yin: "음" } as const;

const SECTION_GUIDE: Record<SectionKey, string> = {
  summary: "첫 줄은 이 사람을 자연물 비유로 표현한 한 문장(25자 이내). 이어서 일간(나)의 성향과 올해 기운의 관계를 2~3문장으로.",
  elements: "강한 오행과 부족한 오행을 생활 언어로 번역. 부족한 기운은 어떤 습관·환경으로 보완하면 좋은지 함께.",
  year: "대상 연도 세운과 일간의 관계(세운 십신)로 한 해 흐름. 시기별로 주의할 점이 있으면 보완책과 함께.",
  love: "연애·관계 흐름. 단정 대신 경향으로. 이별·결혼 결정의 근거로 제시하지 않는다.",
  career: "직업·일의 흐름. 관성(정관·편관)과 식상(재능·표현)을 중심으로.",
  wealth: "재물 흐름. 재성과 신강신약을 근거로. 특정 투자·금액 판단을 하지 않는다.",
  advice: "실천 조언 정확히 3개. 각 줄은 '- 제목 — 한 문장 이유' 형식. 습관·태도·관계·리스크 관리 관점.",
};

export function buildSystemPrompt(): string {
  return `당신은 사주 명리학을 바탕으로 상담하는 전문 상담사입니다.
사용자의 사주 여덟 글자와 오행 분석은 이미 정확히 계산되어 주어집니다.
당신의 역할은 이 계산 결과를 '해석'하는 것입니다. 계산을 다시 하거나 글자를 바꾸지 마세요.

[말투]
- ${TUNING.TONE}.
- 단정하지 않습니다. "~한 경향이 있어요", "~하기 쉬운 편이에요"처럼 여지를 둡니다.
- ${TUNING.TERM_LEVEL}. 설명은 쉬운 말로 풉니다.
- 분량: ${TUNING.LENGTH}. 이모지: ${TUNING.EMOJI}.

[해석 원칙]
- 결정론적 예언이 아니라 자기 이해와 자기 점검을 돕는 참고 자료로 제시합니다.
- 강한 기운의 장점을 살리고, 부족한 기운은 보완하는 방향으로 조언합니다.
- 단점을 말할 때는 반드시 보완책과 함께 제시합니다.
- 주어진 계산 결과(네 기둥, 십신, 오행 분포, 신강신약, 용신, 세운)에 근거해서만 말합니다. 주어지지 않은 글자나 운을 지어내지 않습니다.
- 시주가 미상이면 시주에 기대는 해석을 하지 않습니다.

[금지]
- 단정적 흉언, 저주, 사망 예언, 질병 확정 표현 금지.
- 의료·투자·법률 등 중대한 결정을 대신하지 않습니다.
- 성별을 근거로 음양의 강약을 판단하지 않습니다. 음양 강약은 주어진 계산 결과만 따릅니다.
- 마크다운 제목(#), 굵게(**), 표를 쓰지 않습니다. 섹션 구분은 아래 형식만 씁니다.

[출력 형식]
- 요청된 섹션을 요청된 순서대로만 씁니다.
- 각 섹션은 "@@키" 한 줄로 시작하고, 다음 줄부터 본문을 씁니다. 키 외의 제목은 쓰지 않습니다.
- 면책 문구와 입력 한계 안내는 화면에서 따로 보여주므로 쓰지 않습니다.`;
}

function pillarLine(name: string, pillar: Pillar | null): string {
  if (!pillar) return `    ${name}: 미상(시간 정보 없음)`;
  const stemGod = pillar.stemTenGod ?? "일간(나)";
  return `    ${name}: ${pillar.label}(${pillar.hanja}) — 천간 ${pillar.stem}(${stemGod}), 지지 ${pillar.branch}(${pillar.branchTenGod})`;
}

function elementList(elements: Element[]): string {
  return elements.map((e) => ELEMENT_KO[e]).join(", ");
}

const TOPIC_KO: Record<Topic, string> = {
  general: "종합 풀이",
  year: "올해의 운세",
  love: "연애",
  career: "직업",
  wealth: "재물",
};

export function buildUserPrompt(result: SajuResult, topics: Topic[]): string {
  const { pillars, dayMaster, fiveElements: f, yongsin, yearLuck } = result;
  const sections = sectionsFor(topics);

  return `[사주 계산 결과]
- 네 기둥:
${pillarLine("연주", pillars.year)}
${pillarLine("월주", pillars.month)}
${pillarLine("일주", pillars.day)}
${pillarLine("시주", pillars.hour)}
- 일간(나): ${dayMaster.stem}(${dayMaster.stemHanja}) / ${ELEMENT_KO[dayMaster.element]} / ${YINYANG_KO[dayMaster.yinYang]} / 힘: ${STRENGTH_KO[dayMaster.strength]}
- 오행 분포: 목 ${f.wood} · 화 ${f.fire} · 토 ${f.earth} · 금 ${f.metal} · 수 ${f.water}
- 강한 오행: ${elementList(result.dominantElements)}
- 부족한 오행: ${elementList(result.weakElements)}
- 용신(보완점): ${ELEMENT_KO[yongsin.primary]}${yongsin.secondary ? ` (보조 ${ELEMENT_KO[yongsin.secondary]})` : ""} — ${yongsin.reasoning}
- ${yearLuck.year}년 세운: ${yearLuck.pillar.label}(${yearLuck.pillar.hanja}) — 천간 ${yearLuck.pillar.stemTenGod}, 지지 ${yearLuck.pillar.branchTenGod}
- 시간 정확도: ${result.timeAccuracy === "known" ? "시각 확인됨" : "시각 미상"}

[사용자 요청]
- 주제: ${topics.map((t) => TOPIC_KO[t]).join(", ")}
- 대상 연도: ${yearLuck.year}

[작성할 섹션 — 이 순서대로]
${sections.map((key) => `@@${key} (${SECTION_TITLES[key]}): ${SECTION_GUIDE[key]}`).join("\n")}`;
}

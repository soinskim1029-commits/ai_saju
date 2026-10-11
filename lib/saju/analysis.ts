// 오행 분포 · 신강신약 · 용신.
//
// ⚠️ 유파가 갈리는 영역이다 (docs/saju/domain-knowledge.md §0, §8, §9).
// 여기서는 자평명리 억부(抑扶) 기준의 '간이 판단'만 한다. 조후(調候)는 아직 반영하지 않는다.
// 판단 근거를 숫자로 남겨 해석(LLM)과 UI가 근거 없이 말하지 않게 한다.

import type { Element, SajuResult } from "@/types/saju";
import { BRANCHES, ELEMENT_CYCLE, ELEMENT_KO, STEMS, controls, controlledBy, generatedBy, generates } from "./constants";
import type { RawPillars } from "./pillars";

export function countFiveElements(p: RawPillars): Record<Element, number> {
  const counts: Record<Element, number> = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
  for (const pillar of [p.year, p.month, p.day, p.hour]) {
    if (!pillar) continue;
    counts[STEMS[pillar.stem].element] += 1;
    counts[BRANCHES[pillar.branch].element] += 1;
  }
  return counts;
}

export function dominantElements(counts: Record<Element, number>): Element[] {
  const max = Math.max(...Object.values(counts));
  return ELEMENT_CYCLE.filter((e) => counts[e] === max);
}

export function weakElements(counts: Record<Element, number>): Element[] {
  const min = Math.min(...Object.values(counts));
  return ELEMENT_CYCLE.filter((e) => counts[e] === min);
}

/**
 * 신강신약: 득령(월지)·득지(일지)·득세(나머지)를 가중합한다.
 * 월지 3, 일지 1.5, 나머지 글자 각 1. 일간을 돕는 기운(비겁·인성)의 비율로 판단.
 */
export function dayMasterStrength(p: RawPillars): { strength: SajuResult["dayMaster"]["strength"]; supportRatio: number } {
  const me = STEMS[p.day.stem].element;
  const helps = (e: Element) => e === me || e === generatedBy(me);

  const weighted: [Element, number][] = [
    [BRANCHES[p.month.branch].element, 3],
    [BRANCHES[p.day.branch].element, 1.5],
    [STEMS[p.year.stem].element, 1],
    [BRANCHES[p.year.branch].element, 1],
    [STEMS[p.month.stem].element, 1],
  ];
  if (p.hour) {
    weighted.push([STEMS[p.hour.stem].element, 1], [BRANCHES[p.hour.branch].element, 1]);
  }

  const total = weighted.reduce((sum, [, w]) => sum + w, 0);
  const support = weighted.reduce((sum, [e, w]) => sum + (helps(e) ? w : 0), 0);
  const supportRatio = Math.round((support / total) * 100) / 100;

  const strength = supportRatio >= 0.55 ? "strong" : supportRatio <= 0.4 ? "weak" : "balanced";
  return { strength, supportRatio };
}

export function selectYongsin(
  dayElement: Element,
  strength: SajuResult["dayMaster"]["strength"],
  counts: Record<Element, number>,
): SajuResult["yongsin"] {
  const peer = dayElement;
  const resource = generatedBy(dayElement);
  const output = generates(dayElement);
  const wealth = controls(dayElement);
  const officer = controlledBy(dayElement);
  const name = (e: Element) => ELEMENT_KO[e];

  if (strength === "weak") {
    return {
      primary: resource,
      secondary: peer,
      reasoning: `일간 ${name(dayElement)}의 힘이 약한 편이라, 나를 길러주는 ${name(resource)}을 우선 보완점으로, 같은 기운인 ${name(peer)}을 보조로 봅니다.`,
    };
  }

  if (strength === "strong") {
    const resourceHeavy = counts[resource] > counts[peer];
    const primary = resourceHeavy ? wealth : officer;
    return {
      primary,
      secondary: output,
      reasoning: resourceHeavy
        ? `일간이 강하고 특히 나를 돕는 ${name(resource)}이 많아, 이를 조절하는 ${name(wealth)}을 우선으로, 힘을 밖으로 쓰는 ${name(output)}을 보조로 봅니다.`
        : `일간이 강하고 같은 기운 ${name(peer)}이 많아, 이를 다듬는 ${name(officer)}을 우선으로, 힘을 밖으로 쓰는 ${name(output)}을 보조로 봅니다.`,
    };
  }

  const lacking = ELEMENT_CYCLE.slice().sort((a, b) => counts[a] - counts[b]);
  return {
    primary: lacking[0],
    secondary: lacking[1],
    reasoning: `일간의 힘이 비교적 균형 잡혀 있어, 원국에서 가장 적은 ${name(lacking[0])}을 채우는 방향을 보완점으로 봅니다.`,
  };
}

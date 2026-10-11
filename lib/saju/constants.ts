import type { Element, YinYang } from "@/types/saju";

export const STEMS = [
  { ko: "갑", hanja: "甲", element: "wood", yinYang: "yang" },
  { ko: "을", hanja: "乙", element: "wood", yinYang: "yin" },
  { ko: "병", hanja: "丙", element: "fire", yinYang: "yang" },
  { ko: "정", hanja: "丁", element: "fire", yinYang: "yin" },
  { ko: "무", hanja: "戊", element: "earth", yinYang: "yang" },
  { ko: "기", hanja: "己", element: "earth", yinYang: "yin" },
  { ko: "경", hanja: "庚", element: "metal", yinYang: "yang" },
  { ko: "신", hanja: "辛", element: "metal", yinYang: "yin" },
  { ko: "임", hanja: "壬", element: "water", yinYang: "yang" },
  { ko: "계", hanja: "癸", element: "water", yinYang: "yin" },
] as const satisfies readonly { ko: string; hanja: string; element: Element; yinYang: YinYang }[];

/** mainStem: 지장간 본기(本氣)의 천간 index. 지지의 십신은 본기로 판단한다. */
export const BRANCHES = [
  { ko: "자", hanja: "子", animal: "쥐", element: "water", mainStem: 9 },
  { ko: "축", hanja: "丑", animal: "소", element: "earth", mainStem: 5 },
  { ko: "인", hanja: "寅", animal: "호랑이", element: "wood", mainStem: 0 },
  { ko: "묘", hanja: "卯", animal: "토끼", element: "wood", mainStem: 1 },
  { ko: "진", hanja: "辰", animal: "용", element: "earth", mainStem: 4 },
  { ko: "사", hanja: "巳", animal: "뱀", element: "fire", mainStem: 2 },
  { ko: "오", hanja: "午", animal: "말", element: "fire", mainStem: 3 },
  { ko: "미", hanja: "未", animal: "양", element: "earth", mainStem: 5 },
  { ko: "신", hanja: "申", animal: "원숭이", element: "metal", mainStem: 6 },
  { ko: "유", hanja: "酉", animal: "닭", element: "metal", mainStem: 7 },
  { ko: "술", hanja: "戌", animal: "개", element: "earth", mainStem: 4 },
  { ko: "해", hanja: "亥", animal: "돼지", element: "water", mainStem: 8 },
] as const satisfies readonly { ko: string; hanja: string; animal: string; element: Element; mainStem: number }[];

/** 상생 순서. 다음 원소를 낳는다 (목→화→토→금→수→목) */
export const ELEMENT_CYCLE: readonly Element[] = ["wood", "fire", "earth", "metal", "water"];

export const ELEMENT_KO: Record<Element, string> = {
  wood: "목(木)",
  fire: "화(火)",
  earth: "토(土)",
  metal: "금(金)",
  water: "수(水)",
};

/** a가 낳는 원소 */
export function generates(a: Element): Element {
  return ELEMENT_CYCLE[(ELEMENT_CYCLE.indexOf(a) + 1) % 5];
}

/** a를 낳는 원소 */
export function generatedBy(a: Element): Element {
  return ELEMENT_CYCLE[(ELEMENT_CYCLE.indexOf(a) + 4) % 5];
}

/** a가 누르는 원소 (목극토, 토극수 …) */
export function controls(a: Element): Element {
  return ELEMENT_CYCLE[(ELEMENT_CYCLE.indexOf(a) + 2) % 5];
}

/** a를 누르는 원소 */
export function controlledBy(a: Element): Element {
  return ELEMENT_CYCLE[(ELEMENT_CYCLE.indexOf(a) + 3) % 5];
}

export function mod(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}

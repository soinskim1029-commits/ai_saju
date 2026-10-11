// 네 기둥 계산.
// - 연주: 입춘 절입 시각 기준
// - 월주: 12절 절입 시각 기준, 월간은 연간에서 (갑기년 병인월 …)
// - 일주: 지방평균시 날짜 기준 60갑자 순환. 자시(23시~)는 다음 날 일주로 본다.
// - 시주: 지방평균시 기준 2시간 단위, 시간은 일간에서 (갑기일 갑자시 …)

import type { Element, Pillar, TenGod } from "@/types/saju";
import { BRANCHES, STEMS, controls, controlledBy, generatedBy, generates, mod } from "./constants";
import { jieBefore, sajuYear } from "./solarTerms";
import type { LocalMeanTime } from "./time";

export interface RawPillar {
  stem: number;
  branch: number;
}

export interface RawPillars {
  year: RawPillar;
  month: RawPillar;
  day: RawPillar;
  hour: RawPillar | null;
}

const DAY_MS = 86_400_000;
/** 1900-01-01 은 甲戌일 (60갑자 index 10) */
const EPOCH_UTC = Date.UTC(1900, 0, 1);
const EPOCH_INDEX = 10;

export function yearPillarOf(year: number): RawPillar {
  return { stem: mod(year - 4, 10), branch: mod(year - 4, 12) };
}

export function dayPillarOf(year: number, month: number, day: number): RawPillar {
  const days = Math.round((Date.UTC(year, month - 1, day) - EPOCH_UTC) / DAY_MS);
  const index = mod(EPOCH_INDEX + days, 60);
  return { stem: index % 10, branch: index % 12 };
}

export function calculatePillars(
  utcMs: number,
  gregorianYear: number,
  lmt: LocalMeanTime | null,
  solarDate: { year: number; month: number; day: number },
): RawPillars {
  const year = yearPillarOf(sajuYear(utcMs, gregorianYear));

  const monthBranch = jieBefore(utcMs, gregorianYear).branch;
  const yinMonthStem = mod((year.stem % 5) * 2 + 2, 10);
  const month: RawPillar = {
    stem: mod(yinMonthStem + mod(monthBranch - 2, 12), 10),
    branch: monthBranch,
  };

  if (!lmt) {
    // 시간 미상: 입력한 양력 날짜로 일주만 계산
    return { year, month, day: dayPillarOf(solarDate.year, solarDate.month, solarDate.day), hour: null };
  }

  const dayDate = new Date(Date.UTC(lmt.year, lmt.month - 1, lmt.day) + (lmt.hour >= 23 ? DAY_MS : 0));
  const day = dayPillarOf(dayDate.getUTCFullYear(), dayDate.getUTCMonth() + 1, dayDate.getUTCDate());

  const hourBranch = mod(Math.floor((lmt.hour * 60 + lmt.minute + 60) / 120), 12);
  const hour: RawPillar = {
    stem: mod((day.stem % 5) * 2 + hourBranch, 10),
    branch: hourBranch,
  };

  return { year, month, day, hour };
}

export function tenGod(dayStem: number, otherElement: Element, otherYang: boolean): TenGod {
  const me = STEMS[dayStem];
  const samePolarity = (me.yinYang === "yang") === otherYang;
  if (otherElement === me.element) return samePolarity ? "비견" : "겁재";
  if (otherElement === generates(me.element)) return samePolarity ? "식신" : "상관";
  if (otherElement === controls(me.element)) return samePolarity ? "편재" : "정재";
  if (otherElement === controlledBy(me.element)) return samePolarity ? "편관" : "정관";
  if (otherElement === generatedBy(me.element)) return samePolarity ? "편인" : "정인";
  throw new Error("unreachable");
}

export function describePillar(raw: RawPillar, dayStem: number, isDayPillar: boolean): Pillar {
  const stem = STEMS[raw.stem];
  const branch = BRANCHES[raw.branch];
  const branchMain = STEMS[branch.mainStem];
  return {
    stem: stem.ko,
    branch: branch.ko,
    stemHanja: stem.hanja,
    branchHanja: branch.hanja,
    label: `${stem.ko}${branch.ko}`,
    hanja: `${stem.hanja}${branch.hanja}`,
    stemElement: stem.element,
    branchElement: branch.element,
    stemYinYang: stem.yinYang,
    stemTenGod: isDayPillar ? null : tenGod(dayStem, stem.element, stem.yinYang === "yang"),
    branchTenGod: tenGod(dayStem, branchMain.element, branchMain.yinYang === "yang"),
  };
}

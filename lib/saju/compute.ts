// 계산(input) → result. 서비스의 유일한 계산 진입점.
// 계산 라이브러리는 lib/saju 안에서만 쓰고, 바깥에는 types/saju.ts 타입만 내보낸다.

import "server-only";

import type { BirthInput, SajuResult } from "@/types/saju";
import { DEFAULT_CITY, findCity } from "./cities";
import { STEMS } from "./constants";
import { countFiveElements, dayMasterStrength, dominantElements, selectYongsin, weakElements } from "./analysis";
import { lunarToSolar } from "./lunar";
import { calculatePillars, describePillar, yearPillarOf } from "./pillars";
import { jieBefore } from "./solarTerms";
import { formatHm, formatYmd, seoulWallClockToUtc, toLocalMeanTime } from "./time";

export { LunarConversionError } from "./lunar";

export function computeSaju(input: BirthInput): SajuResult {
  const [y, m, d] = input.birthDate.split("-").map(Number);
  const limitations: string[] = [];

  const solar = input.calendar === "lunar" ? lunarToSolar(y, m, d, input.isLeapMonth) : { year: y, month: m, day: d };
  if (input.calendar === "lunar") {
    limitations.push(
      `음력 ${input.birthDate}${input.isLeapMonth ? "(윤달)" : ""}을 양력 ${formatYmd(solar.year, solar.month, solar.day)}로 바꿔 계산했어요.`,
    );
  }

  const city = findCity(input.birthCity) ?? DEFAULT_CITY;
  if (!input.birthCity && input.birthTime) {
    limitations.push("출생 지역이 없어 서울 경도로 시각을 보정했어요.");
  }

  let utcMs: number;
  let lmt = null;
  if (input.birthTime) {
    const [hh, mm] = input.birthTime.split(":").map(Number);
    utcMs = seoulWallClockToUtc(solar.year, solar.month, solar.day, hh, mm);
    lmt = toLocalMeanTime(utcMs, city.longitude);
  } else {
    utcMs = seoulWallClockToUtc(solar.year, solar.month, solar.day, 12, 0);
    limitations.push("태어난 시간이 없어 시주는 확정하지 않고 연·월·일 중심으로 보수적으로 풀이해요.");

    const dayStart = seoulWallClockToUtc(solar.year, solar.month, solar.day, 0, 0);
    const dayEnd = dayStart + 86_400_000;
    const jieOfDay = jieBefore(dayEnd - 1, solar.year);
    if (jieOfDay.utcMs >= dayStart) {
      limitations.push("절기가 바뀌는 날에 태어나 시간에 따라 월주가 달라질 수 있어요.");
    }
  }

  const raw = calculatePillars(utcMs, solar.year, lmt, solar);
  const dayStem = raw.day.stem;
  const counts = countFiveElements(raw);
  const { strength, supportRatio } = dayMasterStrength(raw);
  const dayElement = STEMS[dayStem].element;

  return {
    resolved: {
      solarDate: formatYmd(solar.year, solar.month, solar.day),
      localMeanTime: lmt ? formatHm(lmt.hour, lmt.minute) : null,
      longitude: city.longitude,
      cityLabel: city.label,
    },
    pillars: {
      year: describePillar(raw.year, dayStem, false),
      month: describePillar(raw.month, dayStem, false),
      day: describePillar(raw.day, dayStem, true),
      hour: raw.hour ? describePillar(raw.hour, dayStem, false) : null,
    },
    timeAccuracy: input.birthTime ? "known" : "unknown",
    dayMaster: {
      stem: STEMS[dayStem].ko,
      stemHanja: STEMS[dayStem].hanja,
      element: dayElement,
      yinYang: STEMS[dayStem].yinYang,
      strength,
      supportRatio,
    },
    fiveElements: counts,
    dominantElements: dominantElements(counts),
    weakElements: weakElements(counts),
    yongsin: selectYongsin(dayElement, strength, counts),
    yearLuck: {
      year: input.targetYear,
      pillar: describePillar(yearPillarOf(input.targetYear), dayStem, false),
    },
    limitations,
  };
}

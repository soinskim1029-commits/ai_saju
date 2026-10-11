// 계산 엔진 정답 세트 (docs/engineering/saju-engine.md §5).
// 기대값 출처: 한국천문연구원 절입 시각, KASI 기반 일진(korean-lunar-calendar), 수작업 대조.

import { describe, expect, it } from "vitest";
import type { BirthInput } from "@/types/saju";
import { computeSaju, LunarConversionError } from "./compute";
import { koreanDayGapja } from "./lunar";
import { dayPillarOf } from "./pillars";
import { BRANCHES, STEMS } from "./constants";

function input(overrides: Partial<BirthInput>): BirthInput {
  return {
    calendar: "solar",
    isLeapMonth: false,
    birthDate: "1990-03-15",
    birthTime: "10:30",
    gender: "male",
    birthCity: "seoul",
    topics: ["general"],
    targetYear: 2026,
    ...overrides,
  };
}

function eight(overrides: Partial<BirthInput>): string {
  const { year, month, day, hour } = computeSaju(input(overrides)).pillars;
  return [year.hanja, month.hanja, day.hanja, hour?.hanja ?? "--"].join(" ");
}

describe("일주: KASI 일진과 전수 대조", () => {
  it("1920-01-01 ~ 2049-12-31 모든 날짜가 일치한다", () => {
    const mismatches: string[] = [];
    for (let t = Date.UTC(1920, 0, 1); t <= Date.UTC(2049, 11, 31); t += 86_400_000) {
      const date = new Date(t);
      const [y, m, d] = [date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate()];
      const ours = dayPillarOf(y, m, d);
      const label = `${STEMS[ours.stem].ko}${BRANCHES[ours.branch].ko}일`;
      if (label !== koreanDayGapja(y, m, d)) mismatches.push(`${y}-${m}-${d}`);
    }
    expect(mismatches).toEqual([]);
  });
});

describe("알려진 명식", () => {
  it("1990-03-15 10:30 서울 남 — 월주와 일주가 같은 기묘(己卯)인 것은 정상", () => {
    expect(eight({})).toBe("庚午 己卯 己卯 己巳");
  });

  it("1996-03-14 10:30 서울 — KASI 일진 경술(庚戌)일", () => {
    expect(eight({ birthDate: "1996-03-14" })).toBe("丙子 辛卯 庚戌 辛巳");
  });
});

describe("입춘 경계 (연주)", () => {
  // 2025 입춘 = 2025-02-03 23:10 KST — 2월 4일 고정 규칙이면 틀리는 사례
  it("2025-02-03 23:00 은 아직 갑진년", () => {
    expect(computeSaju(input({ birthDate: "2025-02-03", birthTime: "23:00" })).pillars.year.hanja).toBe("甲辰");
  });
  it("2025-02-03 23:20 은 을사년, 무인월", () => {
    const { year, month } = computeSaju(input({ birthDate: "2025-02-03", birthTime: "23:20" })).pillars;
    expect(year.hanja).toBe("乙巳");
    expect(month.hanja).toBe("戊寅");
  });
  // 2024 입춘 = 2024-02-04 17:27 KST
  it("2024-02-04 17:20 은 계묘년 을축월, 17:35 는 갑진년 병인월", () => {
    expect(eight({ birthDate: "2024-02-04", birthTime: "17:20" }).slice(0, 5)).toBe("癸卯 乙丑");
    expect(eight({ birthDate: "2024-02-04", birthTime: "17:35" }).slice(0, 5)).toBe("甲辰 丙寅");
  });
});

describe("월 경계 (12절)", () => {
  it("1월 1~5일은 아직 자(子)월이다 (소한 전)", () => {
    expect(computeSaju(input({ birthDate: "2024-01-03" })).pillars.month.hanja).toBe("甲子");
  });
  it("소한(2024-01-06 05:49 KST) 이후는 축(丑)월", () => {
    expect(computeSaju(input({ birthDate: "2024-01-07" })).pillars.month.hanja).toBe("乙丑");
  });
  // 1996 경칩 = 1996-03-05 16:09 KST — 3월 6일 고정 규칙이면 틀리는 사례
  it("1996-03-05 18:00 은 이미 묘(卯)월", () => {
    expect(computeSaju(input({ birthDate: "1996-03-05", birthTime: "18:00" })).pillars.month.hanja).toBe("辛卯");
  });
});

describe("시주 · 자시 · 지방평균시", () => {
  it("서울 23:20 은 지방평균시 22:47 → 해(亥)시, 같은 날 일주", () => {
    const r = computeSaju(input({ birthDate: "2000-01-01", birthTime: "23:20" }));
    expect(r.resolved.localMeanTime).toBe("22:47");
    expect(r.pillars.day.hanja).toBe("戊午");
    expect(r.pillars.hour?.branchHanja).toBe("亥");
  });
  it("서울 23:40 은 지방평균시 23:08 → 다음 날 일주의 자(子)시", () => {
    const r = computeSaju(input({ birthDate: "2000-01-01", birthTime: "23:40" }));
    expect(r.pillars.day.hanja).toBe("己未");
    expect(r.pillars.hour?.hanja).toBe("甲子");
  });
  it("출생지에 따라 시주가 바뀐다 (경계 부근 09:28 출생)", () => {
    const seoul = computeSaju(input({ birthDate: "2000-06-01", birthTime: "09:28", birthCity: "seoul" }));
    const busan = computeSaju(input({ birthDate: "2000-06-01", birthTime: "09:28", birthCity: "busan" }));
    expect(seoul.pillars.hour?.branchHanja).toBe("辰"); // 08:55
    expect(busan.pillars.hour?.branchHanja).toBe("巳"); // 09:04
  });
  it("1988 서머타임: 07-01 10:00 KDT 는 지방평균시 08:27 → 진(辰)시", () => {
    const r = computeSaju(input({ birthDate: "1988-07-01", birthTime: "10:00" }));
    expect(r.resolved.localMeanTime).toBe("08:27");
    expect(r.pillars.hour?.branchHanja).toBe("辰");
  });
  it("1958 (UTC+8:30 시기): 03-01 10:00 은 지방평균시 09:57 → 사(巳)시", () => {
    const r = computeSaju(input({ birthDate: "1958-03-01", birthTime: "10:00" }));
    expect(r.resolved.localMeanTime).toBe("09:57");
    expect(r.pillars.hour?.branchHanja).toBe("巳");
  });
});

describe("시간 미상", () => {
  it("시주가 null 이고 한계 문구가 붙는다", () => {
    const r = computeSaju(input({ birthTime: null }));
    expect(r.pillars.hour).toBeNull();
    expect(r.timeAccuracy).toBe("unknown");
    expect(r.limitations.join(" ")).toContain("시주는 확정하지 않고");
  });
  it("절입일에 태어났으면 월주 불확실 안내가 붙는다", () => {
    const r = computeSaju(input({ birthDate: "2024-02-04", birthTime: null }));
    expect(r.limitations.join(" ")).toContain("월주가 달라질 수 있어요");
  });
});

describe("음력 · 윤달", () => {
  it("2023 윤2월 1일 = 양력 2023-03-22, 평달 2월 1일 = 2023-02-20", () => {
    expect(computeSaju(input({ calendar: "lunar", isLeapMonth: true, birthDate: "2023-02-01" })).resolved.solarDate).toBe(
      "2023-03-22",
    );
    expect(computeSaju(input({ calendar: "lunar", birthDate: "2023-02-01" })).resolved.solarDate).toBe("2023-02-20");
  });
  it("2020 윤4월 1일 = 양력 2020-05-23", () => {
    expect(computeSaju(input({ calendar: "lunar", isLeapMonth: true, birthDate: "2020-04-01" })).resolved.solarDate).toBe(
      "2020-05-23",
    );
  });
  it("윤달이 없는 달에 윤달을 고르면 변환 오류", () => {
    expect(() => computeSaju(input({ calendar: "lunar", isLeapMonth: true, birthDate: "2024-03-01" }))).toThrow(
      LunarConversionError,
    );
  });
});

describe("십신 · 분석", () => {
  it("1996-03-14 경금 일간의 십신 배치", () => {
    const { pillars, dayMaster, fiveElements, yearLuck } = computeSaju(input({ birthDate: "1996-03-14" }));
    expect(dayMaster.stemHanja).toBe("庚");
    expect([pillars.hour?.stemTenGod, pillars.month.stemTenGod, pillars.year.stemTenGod]).toEqual(["겁재", "겁재", "편관"]);
    expect([pillars.hour?.branchTenGod, pillars.day.branchTenGod, pillars.month.branchTenGod, pillars.year.branchTenGod]).toEqual(
      ["편관", "편인", "정재", "상관"],
    );
    expect(fiveElements).toEqual({ wood: 1, fire: 2, earth: 1, metal: 3, water: 1 });
    expect(yearLuck.pillar.hanja).toBe("丙午");
    expect([yearLuck.pillar.stemTenGod, yearLuck.pillar.branchTenGod]).toEqual(["편관", "정관"]);
  });
});

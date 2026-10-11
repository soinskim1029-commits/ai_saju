// 절입(節入) 시각. 월주는 24절기 중 12절(節) 기준, 한 해의 시작은 입춘.
// lunar-javascript 가 천문 계산으로 구한 절기 시각을 쓴다. 이 값은 중국 표준시(UTC+8)
// 벽시계라서 UTC 로 바꿔 절대 시각으로 비교한다.

import { Solar } from "lunar-javascript";

const HOUR = 3_600_000;

/** 12절 → 그 절이 여는 달의 지지 index (子=0) */
const JIE_TO_BRANCH: Record<string, number> = {
  立春: 2,
  惊蛰: 3,
  清明: 4,
  立夏: 5,
  芒种: 6,
  小暑: 7,
  立秋: 8,
  白露: 9,
  寒露: 10,
  立冬: 11,
  大雪: 0,
  小寒: 1,
};

/** 다음 해 표에서 영문 키로 들어오는 항목 */
const PINYIN_TO_HANZI: Record<string, string> = {
  LI_CHUN: "立春",
  JING_ZHE: "惊蛰",
  XIAO_HAN: "小寒",
  DA_XUE: "大雪",
};

export interface Jie {
  name: string;
  branch: number;
  utcMs: number;
}

const cache = new Map<number, Jie[]>();

function solarToUtc(solar: Solar): number {
  return (
    Date.UTC(
      solar.getYear(),
      solar.getMonth() - 1,
      solar.getDay(),
      solar.getHour(),
      solar.getMinute(),
      solar.getSecond(),
    ) - 8 * HOUR
  );
}

/** 해당 양력 연도 앞뒤를 포함하는 12절 목록 (시간순) */
export function jieAround(year: number): Jie[] {
  const cached = cache.get(year);
  if (cached) return cached;

  const byInstant = new Map<number, Jie>();
  for (const y of [year - 1, year, year + 1]) {
    const table = Solar.fromYmd(y, 6, 1).getLunar().getJieQiTable();
    for (const [key, solar] of Object.entries(table)) {
      const name = PINYIN_TO_HANZI[key] ?? key;
      const branch = JIE_TO_BRANCH[name];
      if (branch === undefined) continue;
      const utcMs = solarToUtc(solar);
      byInstant.set(utcMs, { name, branch, utcMs });
    }
  }

  const list = [...byInstant.values()].sort((a, b) => a.utcMs - b.utcMs);
  cache.set(year, list);
  return list;
}

/** 출생 시각 직전(같거나 이전)의 절 */
export function jieBefore(utcMs: number, gregorianYear: number): Jie {
  const list = jieAround(gregorianYear);
  let found: Jie | undefined;
  for (const jie of list) {
    if (jie.utcMs <= utcMs) found = jie;
    else break;
  }
  if (!found) throw new Error("절기 표 범위를 벗어난 시각입니다.");
  return found;
}

/** 출생 시각이 속한 사주 연도 (입춘 기준) */
export function sajuYear(utcMs: number, gregorianYear: number): number {
  const lichun = jieAround(gregorianYear).find(
    (jie) => jie.name === "立春" && new Date(jie.utcMs + 8 * HOUR).getUTCFullYear() === gregorianYear,
  );
  if (!lichun) throw new Error("입춘 시각을 찾지 못했습니다.");
  return utcMs >= lichun.utcMs ? gregorianYear : gregorianYear - 1;
}

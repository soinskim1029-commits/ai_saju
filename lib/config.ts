import { BRANCHES, STEMS, mod } from "@/lib/saju/constants";

/** 올해의 운세 대상 연도. 매년 갱신한다 (정적 페이지가 빌드 시점 날짜에 기대지 않도록 고정값). */
export const SERVICE_YEAR = 2026;

const ZODIAC_COLOR = ["푸른", "푸른", "붉은", "붉은", "누런", "누런", "흰", "흰", "검은", "검은"];

export function serviceYearLabel() {
  const stem = mod(SERVICE_YEAR - 4, 10);
  const branch = mod(SERVICE_YEAR - 4, 12);
  return {
    hanja: `${STEMS[stem].hanja}${BRANCHES[branch].hanja}`,
    nickname: `${ZODIAC_COLOR[stem]} ${BRANCHES[branch].animal}의 해`,
    branchHanja: BRANCHES[branch].hanja,
  };
}

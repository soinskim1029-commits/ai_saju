// 음력 → 양력 변환. 한국천문연구원(KASI) 데이터 기반 korean-lunar-calendar 사용.
// 음력은 입력 형식일 뿐, 계산은 항상 양력으로 바꾼 뒤 절기 기준으로 한다.

import KoreanLunarCalendar from "korean-lunar-calendar";

export class LunarConversionError extends Error {}

export function lunarToSolar(
  year: number,
  month: number,
  day: number,
  isLeapMonth: boolean,
): { year: number; month: number; day: number } {
  const calendar = new KoreanLunarCalendar();
  const ok = calendar.setLunarDate(year, month, day, isLeapMonth);
  if (!ok) {
    throw new LunarConversionError(
      isLeapMonth
        ? `${year}년 음력 ${month}월은 윤달이 없거나 날짜가 범위를 벗어났어요.`
        : `음력 ${year}-${month}-${day} 은(는) 존재하지 않는 날짜예요.`,
    );
  }
  const solar = calendar.getSolarCalendar();
  return { year: solar.year, month: solar.month, day: solar.day };
}

/** 교차 검증용: 해당 양력 날짜의 일진(한글 간지, 예: "경오일") */
export function koreanDayGapja(year: number, month: number, day: number): string {
  const calendar = new KoreanLunarCalendar();
  calendar.setSolarDate(year, month, day);
  return calendar.getKoreanGapja().day;
}

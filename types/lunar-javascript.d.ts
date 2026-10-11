// lunar-javascript 는 타입 정의를 제공하지 않는다. 사용하는 부분만 선언한다.
declare module "lunar-javascript" {
  export class Solar {
    static fromYmd(year: number, month: number, day: number): Solar;
    getYear(): number;
    getMonth(): number;
    getDay(): number;
    getHour(): number;
    getMinute(): number;
    getSecond(): number;
    getLunar(): Lunar;
  }
  export class Lunar {
    /** 절기명 → 절입 시각(중국 표준시 UTC+8 기준 벽시계) */
    getJieQiTable(): Record<string, Solar>;
  }
}

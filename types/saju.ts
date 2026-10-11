// 서비스 공통 타입. 계산 엔진(라이브러리)의 타입이 아니라 우리 서비스의 계약이다.
// 엔진을 교체해도 이 타입은 유지한다. (docs/engineering/architecture.md §6)

export type Element = "wood" | "fire" | "earth" | "metal" | "water";
export type YinYang = "yang" | "yin";
export type Gender = "male" | "female";
export type Topic = "general" | "year" | "love" | "career" | "wealth";

export type TenGod =
  | "비견" | "겁재"
  | "식신" | "상관"
  | "편재" | "정재"
  | "편관" | "정관"
  | "편인" | "정인";

export interface BirthInput {
  calendar: "solar" | "lunar";
  /** 음력일 때만 의미 있음 */
  isLeapMonth: boolean;
  /** YYYY-MM-DD (입력한 달력 기준) */
  birthDate: string;
  /** HH:mm, 모르면 null */
  birthTime: string | null;
  gender: Gender;
  /** lib/saju/cities.ts 의 key. 없으면 서울 기준으로 보정 */
  birthCity: string | null;
  topics: Topic[];
  targetYear: number;
}

export interface Pillar {
  stem: string;        // 한글 천간 (경)
  branch: string;      // 한글 지지 (오)
  stemHanja: string;   // 庚
  branchHanja: string; // 午
  label: string;       // 경오
  hanja: string;       // 庚午
  stemElement: Element;
  branchElement: Element;
  stemYinYang: YinYang;
  /** 일간 기준 십신. 일주의 천간은 null(=일간 자신) */
  stemTenGod: TenGod | null;
  branchTenGod: TenGod;
}

export interface SajuResult {
  /** 실제 계산에 쓴 양력 날짜·시각 정보 */
  resolved: {
    solarDate: string;
    /** 출생지 경도로 보정한 지방평균시(LMT), 시간 미상이면 null */
    localMeanTime: string | null;
    longitude: number;
    cityLabel: string;
  };
  pillars: {
    year: Pillar;
    month: Pillar;
    day: Pillar;
    hour: Pillar | null;
  };
  timeAccuracy: "known" | "unknown";
  dayMaster: {
    stem: string;
    stemHanja: string;
    element: Element;
    yinYang: YinYang;
    strength: "strong" | "balanced" | "weak";
    /** 일간을 돕는 기운의 비율(0~1). 근거 표시용 */
    supportRatio: number;
  };
  fiveElements: Record<Element, number>;
  dominantElements: Element[];
  weakElements: Element[];
  yongsin: {
    primary: Element;
    secondary: Element | null;
    reasoning: string;
  };
  /** 대상 연도의 세운 */
  yearLuck: {
    year: number;
    pillar: Pillar;
  };
  limitations: string[];
}

export interface ChatTurn {
  role: "user" | "model";
  text: string;
}

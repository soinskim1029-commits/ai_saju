// 출생지 경도 (지방평균시 보정용). 시·도 단위면 시주 판단에 충분한 정밀도다
// (같은 도 안에서 경도 차이는 대개 1° 이내 = 4분 이내).

export interface City {
  key: string;
  label: string;
  longitude: number;
}

export const CITIES: readonly City[] = [
  { key: "seoul", label: "서울", longitude: 126.98 },
  { key: "busan", label: "부산", longitude: 129.08 },
  { key: "daegu", label: "대구", longitude: 128.6 },
  { key: "incheon", label: "인천", longitude: 126.71 },
  { key: "gwangju", label: "광주", longitude: 126.85 },
  { key: "daejeon", label: "대전", longitude: 127.38 },
  { key: "ulsan", label: "울산", longitude: 129.31 },
  { key: "sejong", label: "세종", longitude: 127.29 },
  { key: "gyeonggi", label: "경기", longitude: 127.01 },
  { key: "gangwon", label: "강원", longitude: 128.2 },
  { key: "chungbuk", label: "충북", longitude: 127.49 },
  { key: "chungnam", label: "충남", longitude: 126.8 },
  { key: "jeonbuk", label: "전북", longitude: 127.15 },
  { key: "jeonnam", label: "전남", longitude: 126.46 },
  { key: "gyeongbuk", label: "경북", longitude: 128.89 },
  { key: "gyeongnam", label: "경남", longitude: 128.69 },
  { key: "jeju", label: "제주", longitude: 126.53 },
];

export const DEFAULT_CITY = CITIES[0];

export function findCity(key: string | null): City | undefined {
  return key ? CITIES.find((city) => city.key === key) : undefined;
}

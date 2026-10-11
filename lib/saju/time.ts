// 한국 출생 시각 → 절대 시각(UTC) → 지방평균시(LMT) 변환.
//
// 한국 표준시는 역사적으로 바뀌었다 (UTC+8:30 시기, 서머타임 시기 등).
// 직접 표를 만들지 않고 런타임의 IANA 시간대 데이터(Asia/Seoul)를 쓴다.

const SEOUL_TZ = "Asia/Seoul";
const MINUTE = 60_000;

const formatter = new Intl.DateTimeFormat("en-US", {
  timeZone: SEOUL_TZ,
  hourCycle: "h23",
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
  second: "numeric",
});

/** 해당 UTC 시각에서 Asia/Seoul 의 UTC 오프셋(ms) */
function seoulOffset(utcMs: number): number {
  const parts = Object.fromEntries(
    formatter.formatToParts(new Date(utcMs)).map((part) => [part.type, part.value]),
  );
  const wall = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );
  return wall - Math.floor(utcMs / 1000) * 1000;
}

/** 서울 벽시계 시각 → UTC ms. 서머타임 전환 경계에서는 전환 전 오프셋을 따른다. */
export function seoulWallClockToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
): number {
  const wall = Date.UTC(year, month - 1, day, hour, minute);
  let utc = wall - 9 * 60 * MINUTE;
  for (let i = 0; i < 3; i += 1) {
    utc = wall - seoulOffset(utc);
  }
  return utc;
}

export interface LocalMeanTime {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

/** UTC 시각을 경도 기준 지방평균시로 (경도 1° = 4분) */
export function toLocalMeanTime(utcMs: number, longitude: number): LocalMeanTime {
  const lmt = new Date(utcMs + longitude * 4 * MINUTE);
  return {
    year: lmt.getUTCFullYear(),
    month: lmt.getUTCMonth() + 1,
    day: lmt.getUTCDate(),
    hour: lmt.getUTCHours(),
    minute: lmt.getUTCMinutes(),
  };
}

export function formatYmd(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function formatHm(hour: number, minute: number): string {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

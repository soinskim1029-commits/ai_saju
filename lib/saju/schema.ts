import { z } from "zod";
import { CITIES } from "./cities";

const cityKeys = CITIES.map((city) => city.key) as [string, ...string[]];

/** 지원 범위: 절기·음력 데이터가 검증된 구간 */
export const MIN_YEAR = 1920;
export const MAX_YEAR = 2049;

export const birthInputSchema = z.object({
  calendar: z.enum(["solar", "lunar"]),
  isLeapMonth: z.boolean().default(false),
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "생년월일은 YYYY-MM-DD 형식으로 입력해 주세요.")
    .refine((value) => {
      const year = Number(value.slice(0, 4));
      return year >= MIN_YEAR && year <= MAX_YEAR;
    }, `${MIN_YEAR}년부터 ${MAX_YEAR}년 사이 출생만 지원해요.`),
  birthTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "태어난 시각은 HH:mm 형식으로 입력해 주세요.")
    .nullable(),
  gender: z.enum(["male", "female"]),
  birthCity: z.enum(cityKeys).nullable(),
  topics: z.array(z.enum(["general", "year", "love", "career", "wealth"])).max(5).default(["general", "year"]),
  targetYear: z.number().int().min(MIN_YEAR).max(MAX_YEAR),
});

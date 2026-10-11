"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LockIcon, TopBar, primaryButton } from "@/components/ui";
import { useSaju } from "@/components/SajuProvider";
import { CITIES } from "@/lib/saju/cities";
import { SERVICE_YEAR } from "@/lib/config";
import type { BirthInput, Topic } from "@/types/saju";

const TOPICS: { id: Topic | "health" | "match"; label: string; soon?: boolean }[] = [
  { id: "year", label: "올해의 운세" },
  { id: "love", label: "연애" },
  { id: "career", label: "직업" },
  { id: "wealth", label: "재물" },
  { id: "health", label: "건강", soon: true },
  { id: "match", label: "궁합", soon: true },
];

const segBase = "min-h-[46px] flex-1 cursor-pointer rounded text-[15px] transition";
const segOn = "bg-[#2a2e37] text-washi shadow-[inset_0_-2px_0_var(--color-gold)]";
const segOff = "text-[#b3ac9f]";
const chipBase = "inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-full border px-4 text-sm transition disabled:cursor-not-allowed disabled:opacity-55";
const chipOn = "border-shu-text bg-[#2a1e1c] text-[#f4eee2]";
const chipOff = "border-line-strong text-washi-dim";
const field =
  "min-h-[52px] w-full rounded-md border border-[#333742] bg-panel px-4 text-base tracking-[0.04em] text-washi placeholder:text-[#8f897d] disabled:opacity-45";

/** 숫자만 입력해도 YYYY-MM-DD 로 맞춘다 */
function formatDateInput(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 4) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
}

export default function InputPage() {
  const router = useRouter();
  const { submit } = useSaju();

  const [calendar, setCalendar] = useState<"solar" | "lunar">("solar");
  const [isLeapMonth, setLeap] = useState(false);
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [timeUnknown, setTimeUnknown] = useState(false);
  const [gender, setGender] = useState<"female" | "male" | null>(null);
  const [birthCity, setBirthCity] = useState("");
  const [topics, setTopics] = useState<Topic[]>(["year", "love"]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const toggleTopic = (id: Topic) => setTopics((list) => (list.includes(id) ? list.filter((t) => t !== id) : [...list, id]));

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) return setError("생년월일을 YYYY-MM-DD 형식으로 입력해 주세요.");
    if (!timeUnknown && !birthTime) return setError("태어난 시각을 입력하거나 ‘시간을 몰라요’를 선택해 주세요.");
    if (!gender) return setError("성별을 선택해 주세요.");

    const input: BirthInput = {
      calendar,
      isLeapMonth: calendar === "lunar" && isLeapMonth,
      birthDate,
      birthTime: timeUnknown ? null : birthTime,
      gender,
      birthCity: birthCity || null,
      topics: ["general", ...topics],
      targetYear: SERVICE_YEAR,
    };

    setError(null);
    setSubmitting(true);
    const message = await submit(input);
    setSubmitting(false);
    if (message) setError(message);
    else router.push("/result");
  }

  return (
    <main className="flex flex-1 flex-col">
      <TopBar title="태어난 때를 알려주세요" backHref="/" right={<span className="pr-3 text-xs text-muted">1 / 2</span>} />
      <div aria-hidden="true" className="h-0.5 bg-line-soft">
        <div className="h-0.5 w-1/2 bg-gold" />
      </div>

      <div className="flex items-start gap-4 px-6 pt-7">
        <p className="m-0 flex-1 text-sm leading-[1.7] text-[#b3ac9f]">
          정확한 여덟 글자를 위해 절기와 윤달까지 계산해요. 태어난 시각을 모르면 그대로 풀이할 수 있어요.
        </p>
        <div aria-hidden="true" className="border-l border-line pl-2.5 font-kanji text-[13px] tracking-[0.4em] text-gold [writing-mode:vertical-rl]">
          生年月日時
        </div>
      </div>

      <form onSubmit={onSubmit} noValidate className="flex flex-1 flex-col">
        <div className="flex flex-col gap-7.5 px-6 pt-7">
          <fieldset className="m-0 flex flex-col gap-2.5 border-0 p-0">
            <legend className="mb-2.5 p-0 text-sm font-medium">달력</legend>
            <div className="flex gap-1 rounded-md border border-line bg-panel p-1">
              {(["solar", "lunar"] as const).map((value) => (
                <button key={value} type="button" aria-pressed={calendar === value} onClick={() => setCalendar(value)} className={`${segBase} ${calendar === value ? segOn : segOff}`}>
                  {value === "solar" ? "양력" : "음력"}
                </button>
              ))}
            </div>
            {calendar === "lunar" && (
              <div className="flex items-center gap-2">
                <span className="w-14 text-[13px] text-muted">음력 달</span>
                <button type="button" aria-pressed={!isLeapMonth} onClick={() => setLeap(false)} className={`${chipBase} ${!isLeapMonth ? chipOn : chipOff}`}>
                  평달
                </button>
                <button type="button" aria-pressed={isLeapMonth} onClick={() => setLeap(true)} className={`${chipBase} ${isLeapMonth ? chipOn : chipOff}`}>
                  윤달
                </button>
              </div>
            )}
          </fieldset>

          <div className="flex flex-col gap-2.5">
            <label htmlFor="birth" className="text-sm font-medium">
              생년월일
            </label>
            <input
              id="birth"
              className={field}
              type="text"
              inputMode="numeric"
              autoComplete="bday"
              placeholder="YYYY-MM-DD"
              value={birthDate}
              onChange={(e) => setBirthDate(formatDateInput(e.target.value))}
            />
          </div>

          <div className="flex flex-col gap-2.5">
            <label htmlFor="time" className="text-sm font-medium">
              태어난 시각
            </label>
            <input id="time" className={field} type="time" value={birthTime} disabled={timeUnknown} onChange={(e) => setBirthTime(e.target.value)} />
            <label htmlFor="unknown" className="flex min-h-11 cursor-pointer items-center gap-2.5 text-sm text-washi-dim">
              <input id="unknown" type="checkbox" checked={timeUnknown} onChange={(e) => setTimeUnknown(e.target.checked)} className="m-0 size-5 accent-shu" />
              시간을 몰라요
            </label>
            {timeUnknown && (
              <div className="flex gap-2.5 rounded-md border border-dashed border-[#4a4538] bg-[#1a1914] px-4 py-3.5">
                <span aria-hidden="true" className="font-kanji text-[15px] text-gold">
                  時
                </span>
                <p className="m-0 text-[13px] leading-[1.65] text-washi-dim">
                  시주(時柱) 없이 연·월·일 여섯 글자 중심으로 보수적으로 풀이해요. 결과에도 이 한계를 함께 표시해 드려요.
                </p>
              </div>
            )}
          </div>

          <fieldset className="m-0 flex flex-col gap-2.5 border-0 p-0">
            <legend className="mb-2.5 p-0 text-sm font-medium">성별</legend>
            <div className="flex gap-1 rounded-md border border-line bg-panel p-1">
              {(["female", "male"] as const).map((value) => (
                <button key={value} type="button" aria-pressed={gender === value} onClick={() => setGender(value)} className={`${segBase} ${gender === value ? segOn : segOff}`}>
                  {value === "female" ? "여성" : "남성"}
                </button>
              ))}
            </div>
            <span className="text-xs text-muted">대운의 흐름 방향을 계산하는 데 필요해요.</span>
          </fieldset>

          <div className="flex flex-col gap-2.5">
            <label htmlFor="place" className="text-sm font-medium">
              출생 지역 <span className="font-normal text-muted">(선택)</span>
            </label>
            <select id="place" className={`${field} appearance-none`} value={birthCity} onChange={(e) => setBirthCity(e.target.value)}>
              <option value="">선택 안 함 (서울 기준)</option>
              {CITIES.map((city) => (
                <option key={city.key} value={city.key}>
                  {city.label}
                </option>
              ))}
            </select>
            <span className="text-xs text-muted">태어난 곳의 경도로 시각을 보정해 시주가 더 정확해져요.</span>
          </div>

          <fieldset className="m-0 flex flex-col gap-2.5 border-0 p-0">
            <legend className="mb-2.5 p-0 text-sm font-medium">보고 싶은 주제</legend>
            <div className="flex flex-wrap gap-2">
              {TOPICS.map((topic) => {
                const on = !topic.soon && topics.includes(topic.id as Topic);
                return (
                  <button
                    key={topic.id}
                    type="button"
                    aria-pressed={on}
                    disabled={topic.soon}
                    onClick={() => toggleTopic(topic.id as Topic)}
                    className={`${chipBase} ${on ? chipOn : chipOff}`}
                  >
                    {topic.label}
                    {topic.soon && <span className="text-[11px] text-muted">준비 중</span>}
                  </button>
                );
              })}
            </div>
            <span className="text-xs text-muted">종합 풀이는 기본으로 함께 보여드려요.</span>
          </fieldset>

          <div className="flex gap-3 rounded-md border border-line bg-panel p-4">
            <LockIcon />
            <p className="m-0 text-[13px] leading-[1.65] text-washi-dim">
              생년월일시는 민감정보로 다뤄요. 이번 풀이에만 사용하고 서버에 저장하지 않아요.
            </p>
          </div>
        </div>

        <div className="flex-1" />
        <div className="sticky bottom-0 mt-7 flex flex-col gap-3 border-t border-line-soft bg-ink px-6 py-5">
          {error && (
            <p role="alert" className="m-0 text-sm text-shu-text">
              {error}
            </p>
          )}
          <button type="submit" disabled={submitting} className={primaryButton}>
            {submitting ? "여덟 글자 계산 중…" : "여덟 글자 계산하기"}
          </button>
        </div>
      </form>
    </main>
  );
}

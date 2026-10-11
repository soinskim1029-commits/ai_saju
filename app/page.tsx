import Link from "next/link";
import { ArrowRight, Seal, Wave, primaryButton } from "@/components/ui";
import { SERVICE_YEAR, serviceYearLabel } from "@/lib/config";

// 장식용 예시 명식 (1996-03-14 10:30 서울) — 時 日 月 年 순서
const EXAMPLE = [
  ["辛", "巳"],
  ["庚", "戌"],
  ["辛", "卯"],
  ["丙", "子"],
];

const FEATURES = [
  ["一", "종합 풀이", "타고난 성향과 오행의 균형"],
  ["二", "올해의 운세", `${SERVICE_YEAR}년 흐름과 주제별 조언`],
  ["三", "대화로 깊게", "궁금한 것만 골라 묻기"],
];

export default function Home() {
  const year = serviceYearLabel();

  return (
    <main className="relative flex flex-1 flex-col overflow-hidden">
      <header className="relative z-10 flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2.5">
          <Seal />
          <div className="flex flex-col">
            <span className="font-serif text-[17px] font-bold tracking-[0.08em]">명</span>
            <span className="text-[11px] tracking-[0.06em] text-muted">AI 사주 상담</span>
          </div>
        </div>
      </header>

      <section className="relative px-6 pt-9">
        <div aria-hidden="true" className="absolute -right-[70px] -top-1.5 flex size-[270px] items-center justify-center rounded-full border border-[#343843]">
          <div className="flex size-[220px] items-center justify-center rounded-full border border-line-soft font-kanji text-[150px] leading-none text-[#1d2028]">
            {year.branchHanja}
          </div>
        </div>
        <div aria-hidden="true" className="absolute right-6 top-10 font-kanji text-[13px] tracking-[0.5em] text-gold [writing-mode:vertical-rl]">
          四柱八字
        </div>
        <div className="relative flex max-w-[290px] flex-col gap-4.5">
          <span className="text-[13px] tracking-[0.08em] text-gold">
            {SERVICE_YEAR} <span className="font-kanji">{year.hanja}年</span> · {year.nickname}
          </span>
          <h1 className="m-0 font-serif text-[34px] font-bold leading-[1.38]">
            여덟 글자로 읽는
            <br />
            나의 올해
          </h1>
          <p className="m-0 text-[15px] leading-[1.7] text-[#b3ac9f]">
            생년월일시로 사주 여덟 글자를 정확히 계산하고, 상담사처럼 차분하게 풀어드려요.
          </p>
        </div>
      </section>

      <section aria-label="예시 명식" className="mx-6 mt-8 flex items-center gap-4.5 border-y border-line py-4.5">
        <div className="grid flex-1 grid-cols-4 gap-1.5">
          {EXAMPLE.map(([stem, branch], i) => (
            <div key={i} className={`flex flex-col items-center gap-1 font-kanji text-[26px] leading-tight ${i === 1 ? "text-shu-text" : ""}`}>
              <span>{stem}</span>
              <span>{branch}</span>
            </div>
          ))}
        </div>
        <div className="w-px self-stretch bg-line" />
        <p className="m-0 w-[120px] text-xs leading-relaxed text-muted">
          계산은 만세력 기준으로 절기·윤달까지 정확하게.
          <br />
          풀이는 대화로 자연스럽게.
        </p>
      </section>

      <ol className="mx-6 mt-6 flex list-none flex-col gap-3.5 p-0">
        {FEATURES.map(([num, title, desc]) => (
          <li key={num} className="flex items-baseline gap-3.5">
            <span aria-hidden="true" className="w-4.5 font-kanji text-[15px] text-gold">{num}</span>
            <span className="text-[15px]">
              {title} <span className="text-[13px] text-muted">— {desc}</span>
            </span>
          </li>
        ))}
      </ol>

      <div className="min-h-8 flex-1" />

      <div className="relative z-10 flex flex-col gap-3 px-6 pb-5.5">
        <Link href="/input" className={primaryButton}>
          내 사주 풀어보기
          <ArrowRight />
        </Link>
        <p className="m-0 text-center text-xs text-muted">약 1분 · 입력한 생년월일시는 풀이 후 저장하지 않아요</p>
      </div>
      <Wave />
    </main>
  );
}

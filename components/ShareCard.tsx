"use client";

// 공유 카드 (4:5). 브라우저 안에서 이미지로 만든다 — 생년월일이 서버나 URL로 나가지 않게.

import { forwardRef } from "react";
import type { SajuResult } from "@/types/saju";
import { ElementBars } from "./SajuChart";
import { Seal } from "./ui";

interface Props {
  result: SajuResult;
  headline: string;
  advice: string | null;
}

export const ShareCard = forwardRef<HTMLDivElement, Props>(function ShareCard({ result, headline, advice }, ref) {
  const { hour, day, month, year } = result.pillars;
  const columns = [
    ["時", hour],
    ["日", day],
    ["月", month],
    ["年", year],
  ] as const;

  return (
    <div ref={ref} className="w-[540px] bg-ink p-[22px] text-washi" style={{ height: 675 }}>
      <div className="relative flex h-full flex-col border border-[#3a3528] px-10 pt-10">
        <div aria-hidden="true" className="pointer-events-none absolute inset-1.5 border border-[#23262d]" />
        <div className="relative flex items-start justify-between">
          <div className="flex flex-col gap-2.5">
            <span className="text-sm tracking-[0.12em] text-gold">
              {result.yearLuck.year} <span className="font-kanji">{result.yearLuck.pillar.hanja}年</span> · 나의 한 줄
            </span>
            <p className="m-0 max-w-[380px] font-serif text-[30px] font-bold leading-[1.45]">{headline}</p>
          </div>
          <div aria-hidden="true" className="font-kanji text-[15px] tracking-[0.5em] text-muted [writing-mode:vertical-rl]">
            {result.dayMaster.stemHanja}日主
          </div>
        </div>

        <div className="relative mt-9 flex items-center gap-7">
          <div className="grid w-[220px] grid-cols-4 gap-2.5">
            {columns.map(([label, pillar]) => (
              <div key={label} className={`flex flex-col items-center gap-1.5 font-kanji text-[30px] leading-tight ${label === "日" ? "border-b-2 border-shu pb-1" : ""}`}>
                <span className="font-sans text-[11px] text-muted">{label}</span>
                <span>{pillar?.stemHanja ?? "·"}</span>
                <span>{pillar?.branchHanja ?? "·"}</span>
              </div>
            ))}
          </div>
          <div className="w-px self-stretch bg-line" />
          <div className="flex-1">
            <ElementBars counts={result.fiveElements} compact />
          </div>
        </div>

        {advice && <p className="relative m-0 mt-7.5 text-[15px] leading-[1.75] text-washi-dim">올해의 한 가지 — {advice}</p>}

        <div className="flex-1" />
        <div className="relative flex items-center justify-between pb-5.5">
          <div className="flex items-center gap-2.5">
            <Seal size={38} className="-rotate-3" />
            <div className="flex flex-col gap-0.5">
              <span className="font-serif text-[15px] font-bold">명 · AI 사주 상담</span>
              <span className="text-xs text-muted">{process.env.NEXT_PUBLIC_SITE_URL ?? ""}</span>
            </div>
          </div>
          <span className="text-[11px] text-muted">자기 이해를 위한 참고용</span>
        </div>
        <div aria-hidden="true" className="wave -mx-10 h-16 border-t border-line" />
      </div>
    </div>
  );
});

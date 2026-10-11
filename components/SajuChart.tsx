// 명식(네 기둥)과 오행 분포 — 계산 결과를 그대로 그린다 (LLM 없이 즉시 표시).

import type { Element, Pillar, SajuResult } from "@/types/saju";

const ELEMENT_TEXT: Record<Element, string> = {
  wood: "text-wood",
  fire: "text-fire",
  earth: "text-earth",
  metal: "text-metal",
  water: "text-water",
};
const ELEMENT_BAR: Record<Element, string> = {
  wood: "bg-wood-bar",
  fire: "bg-fire-bar",
  earth: "bg-earth-bar",
  metal: "bg-metal-bar",
  water: "bg-water-bar",
};
const ELEMENT_ROWS: { key: Element; hanja: string; ko: string }[] = [
  { key: "wood", hanja: "木", ko: "목" },
  { key: "fire", hanja: "火", ko: "화" },
  { key: "earth", hanja: "土", ko: "토" },
  { key: "metal", hanja: "金", ko: "금" },
  { key: "water", hanja: "水", ko: "수" },
];

export function PillarsGrid({ result }: { result: SajuResult }) {
  const { hour, day, month, year } = result.pillars;
  const columns: { label: string; hanja: string; pillar: Pillar | null; me?: boolean }[] = [
    { label: "시주", hanja: "時", pillar: hour },
    { label: "일주", hanja: "日", pillar: day, me: true },
    { label: "월주", hanja: "月", pillar: month },
    { label: "연주", hanja: "年", pillar: year },
  ];

  return (
    <div className="grid grid-cols-4 gap-2">
      {columns.map(({ label, hanja, pillar, me }) => (
        <div
          key={label}
          className={`relative flex flex-col items-center gap-2 rounded border py-3 pb-3.5 ${me ? "border-shu-text bg-[#221a19]" : "border-line bg-ink-deep"}`}
        >
          {me && <span className="absolute -right-1.5 -top-2.5 rounded-sm bg-shu px-1.5 py-0.5 text-[11px] font-semibold text-[#f7f1e6]">나</span>}
          <span className={`text-[11px] tracking-[0.1em] ${me ? "text-[#e9b8a8]" : "text-muted"}`}>
            {label} <span className="font-kanji">{hanja}</span>
          </span>
          {pillar ? (
            <>
              <span className={`text-[11px] ${me ? "text-[#e9b8a8]" : "text-muted"}`}>{pillar.stemTenGod ?? "일간"}</span>
              <span className={`font-kanji text-[34px] leading-none ${ELEMENT_TEXT[pillar.stemElement]}`}>{pillar.stemHanja}</span>
              <span className={`font-kanji text-[34px] leading-none ${ELEMENT_TEXT[pillar.branchElement]}`}>{pillar.branchHanja}</span>
              <span className={`text-[11px] ${me ? "text-[#e9b8a8]" : "text-muted"}`}>{pillar.branchTenGod}</span>
              <span className={`w-3/5 border-t pt-2 text-center text-xs ${me ? "border-[#4a302b] text-washi" : "border-line text-washi-dim"}`}>
                {pillar.label}
              </span>
            </>
          ) : (
            <span className="flex flex-1 items-center py-6 text-center text-xs leading-relaxed text-muted">
              시간
              <br />
              미상
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

export function ElementBars({ counts, compact = false }: { counts: Record<Element, number>; compact?: boolean }) {
  const max = Math.max(4, ...Object.values(counts));
  return (
    <div className={`flex flex-col ${compact ? "gap-2.5" : "gap-3"}`}>
      {ELEMENT_ROWS.map(({ key, hanja, ko }) => (
        <div key={key} className={`grid items-center gap-3 ${compact ? "grid-cols-[22px_1fr]" : "grid-cols-[56px_1fr_22px]"}`}>
          <span className="text-sm">
            <span className={`font-kanji ${ELEMENT_TEXT[key]}`}>{hanja}</span>
            {!compact && ` ${ko}`}
          </span>
          {counts[key] === 0 ? (
            <div className={`${compact ? "h-1.5" : "h-2"} rounded-[1px] border border-dashed border-[#5a5242]`} />
          ) : (
            <div className={`${compact ? "h-1.5" : "h-2"} rounded-[1px] bg-line-soft`}>
              <div className={`h-full rounded-[1px] ${ELEMENT_BAR[key]}`} style={{ width: `${(counts[key] / max) * 100}%` }} />
            </div>
          )}
          {!compact && <span className={`text-right text-sm ${counts[key] === 0 ? "text-earth" : ""}`}>{counts[key]}</span>}
        </div>
      ))}
    </div>
  );
}

export const STRENGTH_LABEL = { strong: "신강", balanced: "중화", weak: "신약" } as const;

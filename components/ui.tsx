// 공용 UI 조각: 인장, 물결 띠, 상단 바, 섹션 제목, 아이콘.

import Link from "next/link";

export function Seal({ size = 34, children = "命", className = "" }: { size?: number; children?: React.ReactNode; className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded bg-shu font-kanji font-bold text-[#f4eee2] ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.58 }}
    >
      {children}
    </div>
  );
}

export function Wave({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`wave h-[60px] shrink-0 border-t border-line ${className}`} />;
}

export function TopBar({ title, backHref, backLabel = "뒤로", right }: { title: string; backHref: string; backLabel?: string; right?: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-10 flex items-center gap-1 border-b border-line-soft bg-ink/95 px-2 py-3 backdrop-blur">
      <Link href={backHref} aria-label={backLabel} className="flex size-11 items-center justify-center text-washi-dim">
        <ChevronLeft />
      </Link>
      <span className="flex-1 font-serif text-[17px] font-bold">{title}</span>
      {right}
    </header>
  );
}

const NUMERALS = ["一", "二", "三", "四", "五", "六", "七"];

export function SectionTitle({ index, children }: { index: number; children: React.ReactNode }) {
  return (
    <h2 className="m-0 flex items-baseline gap-2.5 font-serif text-[15px] font-bold">
      <span aria-hidden="true" className="font-kanji text-gold">
        {NUMERALS[index] ?? index + 1}
      </span>
      {children}
    </h2>
  );
}

export function ChevronLeft() {
  return (
    <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 6l-6 6 6 6" />
    </svg>
  );
}

export function ArrowRight() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </svg>
  );
}

export function ShareIcon() {
  return (
    <svg aria-hidden="true" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 15V4" />
      <path d="M8 8l4-4 4 4" />
      <path d="M5 13v6a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-6" />
    </svg>
  );
}

export function LockIcon() {
  return (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="mt-px shrink-0 text-gold">
      <rect x="5" y="11" width="14" height="9" rx="1.5" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

export function InfoIcon() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0 text-muted">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5" />
      <path d="M12 16.5v.5" />
    </svg>
  );
}

export function CheckIcon() {
  return (
    <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gold">
      <path d="M5 12l5 5 9-10" />
    </svg>
  );
}

export function SendIcon() {
  return (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 19V5" />
      <path d="M6 11l6-6 6 6" />
    </svg>
  );
}

export const primaryButton =
  "flex min-h-14 w-full items-center justify-center gap-2.5 rounded-md bg-shu text-base font-semibold tracking-wide text-[#f7f1e6] transition hover:brightness-110 disabled:opacity-60";
export const secondaryButton =
  "flex min-h-[52px] w-full items-center justify-center gap-2 rounded-md border border-line-strong text-[15px] text-washi transition hover:border-gold";

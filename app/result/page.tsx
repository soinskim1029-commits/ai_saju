"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import { useSaju } from "@/components/SajuProvider";
import { ElementBars, PillarsGrid, STRENGTH_LABEL } from "@/components/SajuChart";
import { ShareCard } from "@/components/ShareCard";
import { CheckIcon, InfoIcon, SectionTitle, ShareIcon, TopBar, Wave, primaryButton, secondaryButton } from "@/components/ui";
import { parseSections, sectionsFor, type SectionKey } from "@/lib/prompt/sections";
import type { Topic } from "@/types/saju";

const TOPIC_TABS: { key: Extract<SectionKey, Topic>; label: string }[] = [
  { key: "love", label: "연애" },
  { key: "career", label: "직업" },
  { key: "wealth", label: "재물" },
];

function splitSummary(text: string | undefined) {
  const [headline = "", ...rest] = (text ?? "").split("\n").filter(Boolean);
  return { headline, body: rest.join(" ") };
}

function parseAdvice(text: string | undefined) {
  return (text ?? "")
    .split("\n")
    .map((line) => line.replace(/^[-•]\s*/, "").trim())
    .filter(Boolean)
    .map((line) => {
      const [title, ...why] = line.split(/\s+[—–-]\s+/);
      return { title, why: why.join(" — ") };
    });
}

function Paragraphs({ text, streaming }: { text: string; streaming: boolean }) {
  const paragraphs = text.split(/\n+/).filter(Boolean);
  return (
    <>
      {paragraphs.map((p, i) => (
        <p key={i} className="m-0 text-[15px] leading-[1.85] text-[#e3ddd0]">
          {p}
          {streaming && i === paragraphs.length - 1 && <span className="caret" aria-hidden="true" />}
        </p>
      ))}
    </>
  );
}

function Pending() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-2">
      <div className="h-3.5 w-full animate-pulse rounded-sm bg-line-soft" />
      <div className="h-3.5 w-4/5 animate-pulse rounded-sm bg-line-soft" />
    </div>
  );
}

export default function ResultPage() {
  const { input, result, interpretation, retryInterpretation } = useSaju();
  const [tab, setTab] = useState<SectionKey | null>(null);
  const [shareState, setShareState] = useState<"idle" | "working" | "error">("idle");
  const cardRef = useRef<HTMLDivElement>(null);

  if (!input || !result) {
    return (
      <main className="flex flex-1 flex-col">
        <TopBar title="나의 풀이" backHref="/" />
        <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 text-center">
          <p className="m-0 leading-relaxed text-washi-dim">
            풀이 결과는 저장하지 않아서 새로고침하면 사라져요.
            <br />
            다시 입력해 주세요.
          </p>
          <Link href="/input" className={primaryButton}>
            정보 입력하기
          </Link>
        </div>
      </main>
    );
  }

  const sections = parseSections(interpretation.text);
  const keys = sectionsFor(input.topics);
  const streaming = interpretation.status === "streaming";
  const lastArrived = [...keys].reverse().find((key) => sections[key]);
  const isLive = (key: SectionKey) => streaming && key === lastArrived;

  const summary = splitSummary(sections.summary);
  const advice = parseAdvice(sections.advice);
  const tabs = TOPIC_TABS.filter((t) => keys.includes(t.key));
  const activeTab = tab && tabs.some((t) => t.key === tab) ? tab : tabs[0]?.key;

  const born = [
    input.birthDate.replaceAll("-", "."),
    input.calendar === "lunar" ? `음력${input.isLeapMonth ? "(윤)" : ""}` : "양력",
    input.birthTime ?? "시간 미상",
    input.gender === "female" ? "여성" : "남성",
  ].join(" · ");

  async function share() {
    if (!cardRef.current) return;
    setShareState("working");
    try {
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 2, cacheBust: true });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], "my-saju.png", { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "나의 사주 한 줄" });
      } else {
        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = "my-saju.png";
        link.click();
      }
      setShareState("idle");
    } catch (error) {
      setShareState(error instanceof DOMException && error.name === "AbortError" ? "idle" : "error");
    }
  }

  let index = 0;

  return (
    <main className="flex flex-1 flex-col">
      <TopBar
        title="나의 풀이"
        backHref="/input"
        right={
          <button type="button" aria-label="결과 카드 공유하기" onClick={share} disabled={!summary.headline} className="flex size-11 items-center justify-center text-washi-dim disabled:opacity-40">
            <ShareIcon />
          </button>
        }
      />

      <section className="flex flex-col gap-4.5 px-6 pt-6.5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <SectionTitle index={index++}>명식 · 여덟 글자</SectionTitle>
          <span className="text-xs text-muted">{born}</span>
        </div>
        <PillarsGrid result={result} />
        <p className="m-0 flex items-center gap-1.5 text-xs text-muted">
          <CheckIcon />
          만세력 절기 기준 · {result.resolved.cityLabel} 경도 보정
          {result.resolved.localMeanTime && ` (${result.resolved.localMeanTime})`}
        </p>
        {result.limitations.length > 0 && (
          <ul className="m-0 flex list-none flex-col gap-1.5 rounded-md border border-dashed border-[#4a4538] bg-[#1a1914] p-3.5">
            {result.limitations.map((text) => (
              <li key={text} className="text-[13px] leading-relaxed text-washi-dim">
                {text}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="relative mx-6 mt-8 flex flex-col gap-4 rounded border border-[#3a3528] bg-[#17171a] px-5.5 pb-6.5 pt-7">
        <div aria-hidden="true" className="absolute right-4.5 top-4.5 flex size-10 rotate-[-4deg] items-center justify-center rounded-[3px] border-2 border-shu font-kanji text-[15px] font-bold leading-none text-shu-text">
          {result.dayMaster.stemHanja}
          {{ wood: "木", fire: "火", earth: "土", metal: "金", water: "水" }[result.dayMaster.element]}
        </div>
        <SectionTitle index={index++}>한 줄 요약</SectionTitle>
        {sections.summary ? (
          <>
            <p className="m-0 pr-10 font-serif text-[23px] leading-[1.55]">
              {summary.headline}
              {isLive("summary") && !summary.body && <span className="caret" aria-hidden="true" />}
            </p>
            {summary.body && (
              <p className="m-0 text-sm leading-[1.8] text-washi-dim">
                {summary.body}
                {isLive("summary") && <span className="caret" aria-hidden="true" />}
              </p>
            )}
          </>
        ) : (
          <Pending />
        )}
      </section>

      <section className="flex flex-col gap-4 px-6 pt-8.5">
        <div className="flex items-baseline justify-between">
          <SectionTitle index={index++}>오행 분포</SectionTitle>
          <span className="text-xs text-muted">
            일간 힘: {STRENGTH_LABEL[result.dayMaster.strength]} · 보완점 {{ wood: "목", fire: "화", earth: "토", metal: "금", water: "수" }[result.yongsin.primary]}
          </span>
        </div>
        <ElementBars counts={result.fiveElements} />
        {sections.elements ? <Paragraphs text={sections.elements} streaming={isLive("elements")} /> : <Pending />}
      </section>

      {keys.includes("year") && (
        <>
          <div aria-hidden="true" className="mx-6 mt-8.5 flex items-center gap-3 font-kanji text-[13px] tracking-[0.4em] text-gold">
            <div className="h-px flex-1 bg-line" />
            {result.yearLuck.pillar.hanja}
            <div className="h-px flex-1 bg-line" />
          </div>
          <section className="flex flex-col gap-4 px-6 pt-6.5">
            <SectionTitle index={index++}>{result.yearLuck.year}년, 올해의 흐름</SectionTitle>
            {sections.year ? <Paragraphs text={sections.year} streaming={isLive("year")} /> : <Pending />}
          </section>
        </>
      )}

      {streaming && (
        <div role="status" className="flex items-center gap-2 px-6 pt-4 text-xs text-muted">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-shu-text" />
          풀이를 이어 쓰는 중…
        </div>
      )}

      {tabs.length > 0 && (
        <section className="flex flex-col px-6 pt-6">
          <div role="tablist" aria-label="주제별 운세" className="flex">
            {tabs.map((t) => (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={activeTab === t.key}
                onClick={() => setTab(t.key)}
                className={`min-h-12 flex-1 cursor-pointer text-[15px] ${activeTab === t.key ? "border-b-2 border-shu-text bg-panel text-washi" : "border-b border-line text-muted"}`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div role="tabpanel" className="flex min-h-32 flex-col gap-3 px-0.5 pt-4">
            {activeTab && sections[activeTab] ? <Paragraphs text={sections[activeTab]!} streaming={isLive(activeTab)} /> : <Pending />}
          </div>
        </section>
      )}

      <section className="mx-6 mt-7.5 flex flex-col gap-4.5 border-y border-line py-6">
        <SectionTitle index={index++}>실천 조언</SectionTitle>
        {advice.length ? (
          <ol className="m-0 flex list-none flex-col gap-4 p-0">
            {advice.map((item, i) => (
              <li key={i} className="flex gap-3.5">
                <span aria-hidden="true" className="flex size-7 shrink-0 items-center justify-center rounded-full border border-[#4a4538] font-kanji text-[13px] text-gold">
                  {["壱", "弐", "参", "四", "五"][i] ?? i + 1}
                </span>
                <div className="flex flex-col gap-1">
                  <span className="text-[15px] font-medium">{item.title}</span>
                  {item.why && <span className="text-[13px] leading-[1.65] text-[#b3ac9f]">{item.why}</span>}
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <Pending />
        )}
      </section>

      {interpretation.status === "error" && (
        <div role="alert" className="mx-6 mt-6 flex flex-col gap-3 rounded-md border border-shu/60 bg-[#221a19] p-4">
          <p className="m-0 text-sm text-washi">{interpretation.error}</p>
          <button type="button" onClick={retryInterpretation} className={secondaryButton}>
            풀이 다시 받기
          </button>
        </div>
      )}

      <aside className="mx-6 mt-6 flex gap-3 rounded bg-panel p-4">
        <InfoIcon />
        <p className="m-0 text-xs leading-[1.7] text-[#b3ac9f]">
          이 풀이는 자기 이해를 위한 참고 자료예요. 정해진 미래를 단정하지 않으며, 의료·투자·법률 판단을 대신하지 않아요.
        </p>
      </aside>

      <div className="flex flex-col gap-2.5 px-6 pt-7">
        <Link href="/chat" className={primaryButton}>
          상담사에게 더 물어보기
        </Link>
        <button type="button" onClick={share} disabled={!summary.headline || shareState === "working"} className={secondaryButton}>
          {shareState === "working" ? "카드 만드는 중…" : "결과 카드로 공유하기"}
        </button>
        {shareState === "error" && (
          <p role="alert" className="m-0 text-center text-xs text-shu-text">
            카드를 만들지 못했어요. 화면을 캡처해 공유해 주세요.
          </p>
        )}
      </div>

      <div className="min-h-8 flex-1" />
      <Wave />

      {/* 공유 이미지용 카드: 화면 밖에 그려두고 캡처한다 */}
      <div aria-hidden="true" className="pointer-events-none fixed -left-[10000px] top-0">
        <ShareCard ref={cardRef} result={result} headline={summary.headline} advice={advice[0]?.title ?? null} />
      </div>
    </main>
  );
}

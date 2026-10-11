"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useSaju } from "@/components/SajuProvider";
import { Seal, SendIcon, TopBar, primaryButton } from "@/components/ui";

const QUICK_QUESTIONS = ["올해 연애운은요?", "이직하기 좋은 시기", "올해 조심할 점"];
const GREETING = "풀이는 편하게 보셨어요? 더 궁금한 주제가 있으면 골라주시거나 직접 물어보세요.";

function Bubble({ role, children }: { role: "user" | "model"; children: React.ReactNode }) {
  return role === "user" ? (
    <div className="max-w-[78%] self-end whitespace-pre-line rounded-[14px_2px_14px_14px] border border-[#5a3027] bg-[#3a221e] px-4 py-3 text-sm leading-[1.7]">
      {children}
    </div>
  ) : (
    <div className="max-w-[86%] self-start whitespace-pre-line rounded-[2px_14px_14px_14px] border border-[#2b2f38] bg-panel-2 px-4 py-3.5 text-sm leading-[1.7]">
      {children}
    </div>
  );
}

export default function ChatPage() {
  const { input, result, chat, sendChat } = useSaju();
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [chat.history.length, chat.pending]);

  if (!input || !result) {
    return (
      <main className="flex flex-1 flex-col">
        <TopBar title="대화 상담" backHref="/" />
        <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 text-center">
          <p className="m-0 leading-relaxed text-washi-dim">먼저 사주를 계산해야 상담할 수 있어요.</p>
          <Link href="/input" className={primaryButton}>
            정보 입력하기
          </Link>
        </div>
      </main>
    );
  }

  const busy = chat.status === "streaming";

  function send(message: string) {
    const text = message.trim();
    if (!text || busy) return;
    sendChat(text);
    setDraft("");
  }

  return (
    <main className="flex h-dvh flex-col">
      <header className="flex shrink-0 items-center gap-2.5 border-b border-line-soft py-3 pl-2 pr-4">
        <Link href="/result" aria-label="풀이로 돌아가기" className="flex size-11 items-center justify-center text-washi-dim">
          <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 6l-6 6 6 6" />
          </svg>
        </Link>
        <Seal size={36} />
        <div className="flex flex-1 flex-col gap-0.5">
          <span className="font-serif text-base font-bold">명 상담사</span>
          <span className="text-[11px] text-muted">
            <span className="font-kanji">{result.pillars.day.hanja}</span> 일주 · 여덟 글자를 바탕으로 답해요
          </span>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-3.5 overflow-y-auto px-4 pb-3 pt-5" aria-live="polite">
        <Bubble role="model">{GREETING}</Bubble>
        {chat.history.map((turn, i) => (
          <Bubble key={i} role={turn.role}>
            {turn.text}
          </Bubble>
        ))}
        {chat.pending !== null && (
          <Bubble role="model">
            {chat.pending}
            <span className="flex items-center gap-1.5 pt-1" aria-label="답변 작성 중">
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </span>
          </Bubble>
        )}
        {chat.status === "error" && (
          <p role="alert" className="m-0 self-center text-xs text-shu-text">
            {chat.error}
          </p>
        )}
        <div ref={endRef} />
      </div>

      <div className="flex shrink-0 flex-col gap-3 border-t border-line-soft bg-ink pt-3">
        <div className="flex gap-2 overflow-x-auto px-4">
          {QUICK_QUESTIONS.map((q) => (
            <button
              key={q}
              type="button"
              disabled={busy}
              onClick={() => send(q)}
              className="min-h-10 shrink-0 cursor-pointer whitespace-nowrap rounded-full border border-line-strong bg-ink-deep px-3.5 text-[13px] text-washi-dim hover:border-gold hover:text-washi disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>
        <form
          className="flex items-center gap-2 px-4 pb-5"
          onSubmit={(e) => {
            e.preventDefault();
            send(draft);
          }}
        >
          <label htmlFor="msg" className="sr-only">
            메시지
          </label>
          <input
            id="msg"
            type="text"
            maxLength={500}
            placeholder="궁금한 걸 편하게 물어보세요"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="min-h-12 flex-1 rounded-full border border-[#333742] bg-panel px-4 text-[15px] text-washi placeholder:text-[#8f897d]"
          />
          <button
            type="submit"
            aria-label="보내기"
            disabled={busy || !draft.trim()}
            className="flex size-12 shrink-0 cursor-pointer items-center justify-center rounded-full bg-shu text-[#f7f1e6] disabled:opacity-50"
          >
            <SendIcon />
          </button>
        </form>
      </div>
    </main>
  );
}

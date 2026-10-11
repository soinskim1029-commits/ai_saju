"use client";

// 풀이 실패 팝업 — 토큰(사용량) 부족인지, 단순 오류인지 구분해 보여준다.

import { useEffect, useRef } from "react";
import { FAILURE_COPY, type Failure } from "@/lib/errors";
import { primaryButton, secondaryButton } from "./ui";

const BADGE: Record<Failure["code"], string> = {
  quota: "border-shu-text text-shu-text",
  config: "border-shu-text text-shu-text",
  rate: "border-gold text-gold",
  overloaded: "border-gold text-gold",
  interrupted: "border-gold text-gold",
  unknown: "border-line-strong text-muted",
};

export function FailureDialog({ failure, onRetry, onClose }: { failure: Failure | null; onRetry: () => void; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (failure && !dialog.open) dialog.showModal();
    if (!failure && dialog.open) dialog.close();
  }, [failure]);

  const copy = failure ? FAILURE_COPY[failure.code] : null;

  return (
    <dialog
      ref={ref}
      aria-labelledby="failure-title"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) e.currentTarget.close();
      }}
      className="m-auto w-[calc(100%-32px)] max-w-[400px] rounded-lg border border-line-strong bg-panel p-0 text-washi backdrop:bg-black/70"
    >
      {failure && copy && (
        <div className="flex flex-col gap-4 p-6">
          <div className="flex items-center gap-2.5">
            <span aria-hidden="true" className="flex size-9 items-center justify-center rounded border-2 border-shu font-kanji text-base font-bold text-shu-text">
              {failure.code === "quota" ? "盡" : "止"}
            </span>
            <span className={`rounded-full border px-2.5 py-0.5 text-xs ${BADGE[failure.code]}`}>
              {failure.code === "quota" ? "토큰 부족" : failure.code === "config" ? "설정 문제" : "토큰 부족 아님"} · {copy.kind}
            </span>
          </div>
          <h2 id="failure-title" className="m-0 font-serif text-xl font-bold leading-snug">
            {copy.title}
          </h2>
          <p className="m-0 text-sm leading-[1.75] text-washi-dim">{copy.body}</p>
          {failure.detail && (
            <p className="m-0 rounded bg-ink px-3 py-2 font-mono text-xs text-muted">
              원인 정보: {failure.detail}
            </p>
          )}
          <div className="flex flex-col gap-2 pt-1">
            {copy.retry && (
              <button
                type="button"
                className={primaryButton}
                onClick={() => {
                  ref.current?.close();
                  onRetry();
                }}
              >
                다시 시도
              </button>
            )}
            <button type="button" className={secondaryButton} onClick={() => ref.current?.close()}>
              닫기
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}

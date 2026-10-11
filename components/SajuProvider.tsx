"use client";

// 화면 간에 입력·계산 결과·풀이·대화를 메모리에만 보관한다.
// DB 없음 원칙 (architecture.md §6): 새로고침하면 사라지고, 브라우저 저장소에도 쓰지 않는다.

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import type { BirthInput, ChatTurn, SajuResult } from "@/types/saju";
import { readError, streamPost } from "@/lib/client/stream";

type Status = "idle" | "streaming" | "done" | "error";

interface SajuState {
  input: BirthInput | null;
  result: SajuResult | null;
  interpretation: { text: string; status: Status; error: string | null };
  chat: { history: ChatTurn[]; pending: string | null; status: Status; error: string | null };
  submit: (input: BirthInput) => Promise<string | null>;
  retryInterpretation: () => void;
  sendChat: (message: string) => void;
  reset: () => void;
}

const SajuContext = createContext<SajuState | null>(null);

const EMPTY_INTERPRETATION = { text: "", status: "idle" as Status, error: null };
const EMPTY_CHAT = { history: [] as ChatTurn[], pending: null, status: "idle" as Status, error: null };

export function SajuProvider({ children }: { children: React.ReactNode }) {
  const [input, setInput] = useState<BirthInput | null>(null);
  const [result, setResult] = useState<SajuResult | null>(null);
  const [interpretation, setInterpretation] = useState<SajuState["interpretation"]>(EMPTY_INTERPRETATION);
  const [chat, setChat] = useState<SajuState["chat"]>(EMPTY_CHAT);
  const interpretAbort = useRef<AbortController | null>(null);

  const interpret = useCallback((birth: BirthInput) => {
    interpretAbort.current?.abort();
    const controller = new AbortController();
    interpretAbort.current = controller;
    setInterpretation({ text: "", status: "streaming", error: null });
    streamPost("/api/saju/interpret", birth, (text) => setInterpretation((s) => ({ ...s, text })), controller.signal)
      .then(() => setInterpretation((s) => ({ ...s, status: "done" })))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setInterpretation((s) => ({ ...s, status: "error", error: error instanceof Error ? error.message : String(error) }));
      });
  }, []);

  const submit = useCallback(
    async (birth: BirthInput) => {
      const response = await fetch("/api/saju/compute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(birth),
      }).catch(() => null);
      if (!response) return "네트워크 연결을 확인해 주세요.";
      if (!response.ok) return readError(response);

      const { result: computed } = (await response.json()) as { result: SajuResult };
      setInput(birth);
      setResult(computed);
      setChat(EMPTY_CHAT);
      interpret(birth);
      return null;
    },
    [interpret],
  );

  const retryInterpretation = useCallback(() => {
    if (input) interpret(input);
  }, [input, interpret]);

  const sendChat = useCallback(
    (message: string) => {
      if (!input || chat.status === "streaming") return;
      const history = chat.history;
      const userTurn: ChatTurn = { role: "user", text: message };
      setChat({ history: [...history, userTurn], pending: "", status: "streaming", error: null });
      streamPost("/api/saju/chat", { input, history, message }, (text) => setChat((s) => ({ ...s, pending: text })))
        .then((text) => setChat((s) => ({ history: [...s.history, { role: "model", text }], pending: null, status: "done", error: null })))
        .catch((error: unknown) =>
          setChat((s) => ({ ...s, pending: null, status: "error", error: error instanceof Error ? error.message : String(error) })),
        );
    },
    [input, chat],
  );

  const reset = useCallback(() => {
    interpretAbort.current?.abort();
    setInput(null);
    setResult(null);
    setInterpretation(EMPTY_INTERPRETATION);
    setChat(EMPTY_CHAT);
  }, []);

  const value = useMemo(
    () => ({ input, result, interpretation, chat, submit, retryInterpretation, sendChat, reset }),
    [input, result, interpretation, chat, submit, retryInterpretation, sendChat, reset],
  );

  return <SajuContext.Provider value={value}>{children}</SajuContext.Provider>;
}

export function useSaju(): SajuState {
  const value = useContext(SajuContext);
  if (!value) throw new Error("useSaju 는 SajuProvider 안에서만 쓸 수 있어요.");
  return value;
}

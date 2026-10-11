// 풀이 실패 원인 분류. 서버(분류)와 클라이언트(팝업 문구)가 함께 쓴다.

export const FAILURE_CODES = ["quota", "rate", "overloaded", "config", "interrupted", "unknown"] as const;
export type FailureCode = (typeof FAILURE_CODES)[number];

export interface Failure {
  code: FailureCode;
  /** 운영자 확인용 짧은 기술 정보 (예: "Gemini 429 RESOURCE_EXHAUSTED"). 비밀 값·개인정보 없음 */
  detail?: string;
}

export const FAILURE_COPY: Record<FailureCode, { kind: string; title: string; body: string; retry: boolean }> = {
  quota: {
    kind: "사용량 한도 초과",
    title: "AI 사용 한도를 모두 썼어요",
    body: "풀이에 쓰는 토큰(사용량) 한도가 소진됐어요. 단순 오류가 아니라서 바로 다시 시도해도 같은 결과가 나와요. 한도가 초기화되거나 늘어난 뒤에 다시 시도해 주세요.",
    retry: false,
  },
  rate: {
    kind: "요청 과다",
    title: "요청이 잠시 몰렸어요",
    body: "짧은 시간에 요청이 많았어요. 토큰이 부족한 것은 아니에요. 1분쯤 뒤에 다시 시도해 주세요.",
    retry: true,
  },
  overloaded: {
    kind: "일시적 오류",
    title: "AI 서버가 잠시 혼잡해요",
    body: "토큰 부족이 아닌 단순 일시 오류예요. 대체 모델까지 시도했지만 응답을 받지 못했어요. 잠시 후 다시 시도해 주세요.",
    retry: true,
  },
  config: {
    kind: "설정 문제",
    title: "서비스 설정을 확인해야 해요",
    body: "AI 연결 설정(API 키 또는 모델 이름)에 문제가 있어요. 다시 시도해도 해결되지 않으니 운영자가 배포 환경변수를 확인해야 해요.",
    retry: false,
  },
  interrupted: {
    kind: "응답 끊김",
    title: "풀이가 중간에 끊겼어요",
    body: "응답 시간이 길어져 연결이 끊긴 것 같아요. 토큰 부족이 아닌 단순 오류일 가능성이 높아요. 다시 시도해 주세요.",
    retry: true,
  },
  unknown: {
    kind: "알 수 없는 오류",
    title: "풀이를 받지 못했어요",
    body: "원인을 특정하지 못한 오류예요. 잠시 후 다시 시도해 주세요. 계속되면 아래 정보를 운영자에게 알려주세요.",
    retry: true,
  },
};

export function parseFailure(value: unknown): Failure {
  const v = value as Partial<Failure> | null;
  const code = FAILURE_CODES.includes(v?.code as FailureCode) ? (v!.code as FailureCode) : "unknown";
  return { code, detail: typeof v?.detail === "string" ? v.detail : undefined };
}

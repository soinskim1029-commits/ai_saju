# 명(命) — AI 사주 상담

사주 여덟 글자는 코드로 정확하게 계산하고, 풀이는 LLM(Gemini)이 상담사처럼 들려주는 모바일 우선 웹 서비스.

- 기획·설계 문서: [docs/README.md](docs/README.md)
- 개발 계획·진행 현황: [docs/engineering/dev-plan.md](docs/engineering/dev-plan.md)
- 계산 엔진: [docs/engineering/saju-engine.md](docs/engineering/saju-engine.md) §9

## 실행

```bash
npm install
cp .env.example .env.local   # GEMINI_API_KEY 입력
npm run dev                  # http://localhost:3000
```

| 명령 | 내용 |
|---|---|
| `npm test` | 계산 엔진 정답 세트 + 프롬프트 단위 테스트 |
| `npm run eval` | 실제 Gemini 호출로 해석 품질 점검 (키 필요, 비용 발생) |
| `npm run typecheck` / `npm run lint` | 타입 · 린트 |
| `npm run build` | 프로덕션 빌드 |

## 구조

```
app/
  page.tsx                 시작
  input/ result/ chat/     입력 · 풀이 결과 · 대화 상담 (클라이언트)
  api/saju/compute         ① 계산만, 즉시 응답
  api/saju/interpret       ② 해석 스트리밍 (서버에서 다시 계산)
  api/saju/chat            대화 상담 스트리밍
lib/
  saju/                    계산 엔진 (서버 전용 진입점 compute.ts)
  prompt/                  프롬프트 조립 · 섹션 규약 · 자동 점검
  gemini/                  Gemini 클라이언트 (서버 전용)
components/                화면 조각, 메모리 상태(SajuProvider)
types/saju.ts              서비스 공통 타입
eval/                      LLM 품질 평가
```

원칙: 생년월일시는 저장하지 않는다(서버 DB 없음, 브라우저 저장소에도 쓰지 않음). 비밀 키는 서버 env 에만.

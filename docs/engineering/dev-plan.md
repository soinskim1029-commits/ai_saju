# 개발 계획 · 진행 현황 (Dev Plan)

> 기준: `product/service-plan.md`(무엇을), `engineering/architecture.md`(어떻게), 디자인 시안(모바일 5화면).
> 최종 갱신: 2026-10-11

## 진행 현황

| 단계 | 내용 | 상태 |
|---|---|:---:|
| 0 | 문서 저장소 이전, README 링크 수정, 잠정 결정 | ✅ |
| 1 | 계산 엔진 검증 ⛳ | ✅ `saju-fortune` 미채택 → 자체 모듈 |
| 2 | Next.js 16 + TS + Tailwind 4 골격, 디자인 토큰, 타입, Vitest | ✅ |
| 3 | 계산 API `POST /api/saju/compute` + 정답 세트 테스트 | ✅ |
| 4 | 해석 파이프라인 `POST /api/saju/interpret` (스트리밍) + 자동 점검 | 🟡 코드 완료, **실제 Gemini 평가 미실행** (키 필요) |
| 5 | 화면 구현 (시작·입력·결과·공유 카드) | 🟡 빌드 통과, **실기기 확인 필요** |
| 6 | 대화형 상담 `POST /api/saju/chat` | 🟡 코드 완료, 실제 대화 품질 미확인 |
| 7 | 출시 준비 | ⬜ 일부만 (아래) |

## 0단계에서 잠정으로 정한 것 (확정 필요)

| 항목 | 잠정값 | 바꾸려면 |
|---|---|---|
| 해석 톤 | 전문 상담사형 존댓말 | `lib/prompt/build.ts` `TUNING` |
| 유파 | 자평 주류 + 현대적 순화, 용신은 간이 억부 | `lib/saju/analysis.ts` |
| 자시 처리 | 23시 이후는 다음 날 일주 | `lib/saju/pillars.ts` |
| 시각 보정 | 출생지 경도 지방평균시 (균시차 미반영), 미입력 시 서울 | `lib/saju/time.ts` |
| MVP 주제 | 종합(고정) + 올해·연애·직업·재물 / 건강·궁합 "준비 중" | `app/input/page.tsx` |
| Gemini 모델 | `gemini-flash-latest`, temperature 0.6 | env `GEMINI_MODEL`, `GEMINI_TEMPERATURE` |
| 공유 방식 | 브라우저에서 PNG 생성 (html-to-image) → 공유 시트 / 다운로드 | `components/ShareCard.tsx` |
| 운세 대상 연도 | 2026 고정 (매년 갱신) | `lib/config.ts` `SERVICE_YEAR` |

## 남은 작업

### 4단계 마무리
- [ ] `.env.local`에 `GEMINI_API_KEY` 설정 후 `npm run eval` — 5개 예시 × 3회 자동 점검 (구조·금지 표현·없는 간지)
- [ ] 결과를 보고 모델·temperature 확정, 통과율 기준 정하기

### 5·6단계 마무리
- [ ] 실기기(360~430px) 확인: 입력 → 결과 스트리밍 → 탭 → 공유 카드 → 대화
- [ ] 공유 카드 이미지에 웹폰트가 제대로 들어가는지 (iOS Safari 특히)

### 7단계 출시 준비
- [x] 생년월일시 로그 미기록 (오류 종류만 기록)
- [x] 면책 문구 · 개인정보 안내 (입력·결과 화면)
- [x] IP당 호출 제한 — ⚠️ **인스턴스 메모리 기반**이라 서버리스에서 불완전 (`lib/api.ts`)
- [ ] 호출 제한을 외부 저장소(예: Upstash Redis)로 교체
- [ ] 개인정보 처리방침 · 이용약관 페이지
- [ ] Vercel 배포, 환경변수 등록, 비용·에러율·응답 시간 모니터링
- [ ] 1인당 풀이 원가 측정 → 무료 범위·가격 하한 결정

### 병행: 해석 품질
- [ ] `saju/domain-knowledge.md` TODO (십신 상세, 지장간, 오행별 장단점) 보강 → 프롬프트 반영
- [ ] 신강신약·용신 로직을 채택 유파에 맞춰 재검토 (조후 반영 여부)

## 출시 후 확장 순서
주제 확대(건강) → 오늘의 운세 → 궁합(전용 프롬프트) → 대운(입운 나이 계산 필요) → 수익 모델·DB 도입 검토.

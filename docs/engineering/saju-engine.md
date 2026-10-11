# 사주 계산 엔진 문서 (Saju Engine)

> 사주 여덟 글자 계산을 담당하는 엔진(`saju-fortune` 패키지)의 검증·출력 구조·연동 문서.
> 명리학 지식은 `domain-knowledge.md`, 전체 아키텍처는 `architecture.md`,
> 해석 프롬프트는 `interpretation-prompt.md` 참고.
>
> 이 문서는 계산 알고리즘을 직접 구현하지 않는다. 검증된 패키지를 **어떻게 쓰고,
> 결과를 어떻게 믿고, 서비스에 어떻게 연결하는가**를 다룬다.

> ✅ **검증 결과 및 결정 (2026-10-11)** — `saju-fortune` **미채택**.
> 보안상 문제는 없으나(의존성 0, 설치 스크립트·네트워크·파일 접근 없음) §5 경계 케이스 8건 중 5건 실패.
> 절기를 날짜 고정값(입춘=2/4 등)으로 처리하고, 1월 1~5일 월주 버그, 출생지 경도·서머타임 미반영.
> 대신 **자체 계산 모듈 `lib/saju/`** 를 구현했다. 아래 §9 참고. 이하 §1~§8은 검토 기록으로 남긴다.

---

## 1. 엔진 선택

- **채택 후보**: `saju-fortune` (npm)
- 버전(검증 시점): **0.2.0**
- 라이선스: MIT
- 출처: NomaDamas/k-skill (github.com/NomaDamas/k-skill)
- 설명: "Local saju fortune analysis helper for interview-style k-skills"

### 역할 분리 (재확인)
- **계산**: 이 패키지가 결정론적으로 여덟 글자·오행·용신 등을 산출한다.
- **해석**: LLM(Gemini)이 담당. 여덟 글자를 LLM에 맡기지 않는다(환각 방지).
- 서비스에 들어가는 것은 **패키지(코드)**이지, k-skill의 instruction.md(에이전트 지시문)가 아니다.

---

## 2. 설치 · 호출

```bash
npm install saju-fortune
```

### 제공 함수 (실제 exports)
```
analyzeSaju              # 1인 사주 분석 (핵심)
checkCompatibility       # 궁합 (2인)
callSajuTool             # MCP 스타일 도구명 래퍼
getMissingInterviewFields# 부족한 입력 필드 확인
normalizeBirthInput      # 입력 정규화
```

### 기본 호출
```js
const { analyzeSaju } = require("saju-fortune");

const result = analyzeSaju(
  {
    name: "홍길동",          // 선택
    birthDate: "1990-03-15", // 필수 (YYYY-MM-DD)
    birthTime: "10:30",      // 선택 (HH:mm) — 없으면 시주 미확정
    calendar: "solar",       // "solar" | "lunar"
    isLeapMonth: false,      // 음력 윤달 여부
    gender: "male",          // "male" | "female"
    birthCity: "서울"        // 선택 (경도 보정용)
  },
  {
    analysisType: "fortune",
    fortuneType: "general",  // general|love|wealth|career|health
    targetYear: 2026
  }
);
```

`fortuneType` 매핑: 종합=`general`, 연애=`love`, 재물=`wealth`, 직업=`career`, 건강=`health`, 한해운세=`general`+`targetYear`.

---

## 3. 출력 구조 (실측 기준)

> ⚠️ 이 구조에 `architecture.md`의 데이터 흐름과
> `interpretation-prompt.md`의 입력 포맷이 의존한다.

`analyzeSaju` 반환 객체의 주요 필드:

| 필드 | 내용 |
|------|------|
| `input` | 정규화된 입력값 (isLeapMonth 등 채워짐) |
| `pillars` | 네 기둥: `year` / `month` / `day` / `hour` |
| `pillars.*.label` | 한글 간지 (예: "경오") |
| `pillars.*.hanja` | 한자 간지 (예: "庚午") |
| `pillars.*.stem` / `branch` | 천간 / 지지 |
| `pillars.*.stemElement(Ko)` | 천간 오행 (metal / 금) |
| `pillars.*.branchElement(Ko)` | 지지 오행 |
| `pillars.*.branchAnimal` | 지지 동물 (예: "말") |
| `pillars.*.yinYang` | 음양 (yang / yin) |
| `pillars.hour` | **시간 미상 시 `null`** |
| `timeAccuracy` | "known" / "unknown" |
| `limitations` | 한계 안내 문자열 배열 (시간 미상 등) |
| `dayMaster` | 일간(나): stem, element, yinYang, **strength(신강신약)** |
| `fiveElements` | 오행 개수 분포 {wood, fire, earth, metal, water} |
| `dominantElements` | 강한 오행 배열 |
| `weakElements` | 부족한 오행 배열 |
| `yongsin` | 용신: primary/secondary + reasoning |
| `interview` | 부족·선택 필드, 추천 질문 |
| `readingGuide` | 풀이 가이드 문장 배열 |
| `fortune` | 주제별 결과: summary, guidance[], caveat |

### 실측 예시 (1990-03-15 10:30, male, solar, 서울)
```json
{
  "pillars": {
    "year":  { "label": "경오", "hanja": "庚午", "yinYang": "yang", ... },
    "month": { "label": "기묘", "hanja": "己卯", ... },
    "day":   { "label": "기묘", "hanja": "己卯", ... },
    "hour":  { "label": "기사", "hanja": "己巳", ... }
  },
  "dayMaster":   { "stem": "기", "elementKo": "토", "yinYang": "yin", "strength": "strong" },
  "fiveElements":{ "wood": 2, "fire": 2, "earth": 3, "metal": 1, "water": 0 },
  "dominantElements": ["earth"],
  "weakElements": ["water"],
  "yongsin": { "primaryKo": "목(木)", "secondaryKo": "수(水)", "reasoning": "..." }
}
```

→ 이 사람: 일간 기(己)=음토, 신강. 토 과다·수 부족 → 용신 목/수. `domain-knowledge.md`의 이론과 필드가 대응됨.

---

## 4. 예외 · 특수 입력 처리

### 태어난 시간 미상
- `birthTime` 생략 시:
  - `pillars.hour` = **null**
  - `timeAccuracy` = "unknown"
  - `limitations`에 안내 문구 추가("시주는 확정하지 않고 연·월·일 중심…")
- 서비스: 시주 없이 보수적 풀이로 진행하고, 이 한계를 사용자에게 노출.

### 음력 입력 — ⚠️ 중요
- 이 패키지의 음력 변환 정확도는 **별도 검증 전까지 신뢰하지 않는다.**
- 안전한 방식: 음력 입력은 **검증된 만세력/라이브러리로 먼저 양력 변환** →
  `calendar: "solar"`로 호출 → 변환 근거·윤달 여부를 limitations로 기록.
- 윤달 플래그(`isLeapMonth`)는 입력 단계에서 반드시 확인.

### 진태양시(경도) 보정
- `birthCity`로 경도 보정을 반영(생략 시 기본값/생략).
- 시(時) 경계 부근 출생은 이 보정으로 시주가 바뀔 수 있음 → 가능하면 출생지 입력 유도.

---

## 5. 검증 (Verification)

> 남의 패키지를 계산 엔진으로 채택하려면 정확도를 직접 검증하고 기록해야 한다.
> 아래는 **필수 검증 항목**. 채택 확정 전 반드시 통과 확인.

### 반드시 확인할 케이스
- [ ] **절기 경계**: 입춘 전후 출생의 연주가 정확히 갈리는가 (예: 2월 3일생 vs 2월 5일생)
- [ ] **월주 경계**: 각 월의 절(節) 경계 전후로 월주가 바뀌는가
- [ ] **시주 경계**: 자시(23~01시) 등 시 경계 처리
- [ ] **윤달**: 음력 윤달 입력 시 양력 대응이 맞는가 (또는 사전 변환 방식 채택)
- [ ] **진태양시**: 출생지별 경도 보정이 반영되는가
- [ ] 알려진 정답 사주(직접 만세력으로 확인한 표본) 여러 건과 대조

### ⚠️ 검증 중 발견된 유의점
- 실측 예시(1990-03-15 10:30)에서 **월주와 일주가 모두 "기묘(己卯)"로 동일**하게 나왔다.
  우연일 수 있으나, 서로 다른 기둥이 같은 간지로 나오는 경우가 잦다면
  계산 로직(특히 일주 산출)에 오류가 없는지 **교차 검증 필요**.
- 즉, 이 패키지를 무검증으로 신뢰하지 말 것. 위 케이스들을 반드시 대조한 뒤 채택 결정.

### 검증 결과 기록란 (saju-fortune 0.2.0, 서울 출생 기준)

기대값 출처: 한국천문연구원 절입 시각, KASI 기반 일진(`korean-lunar-calendar`), 수작업 대조.

| 케이스 | 입력 | 기대값 | saju-fortune | 통과 |
|--------|------|--------|--------|:---:|
| 기본 | 1990-03-15 10:30 | 庚午 己卯 己卯 己巳 | 庚午 己卯 己卯 己巳 | ✅ |
| 기본 | 1996-03-14 10:30 | 丙子 辛卯 庚戌 辛巳 | 丙子 辛卯 庚戌 辛巳 | ✅ |
| 입춘 경계 (2025 입춘 2/3 23:10) | 2025-02-03 23:20 | 乙巳년 戊寅월 | 甲辰년 丁丑월 | ❌ |
| 입춘 경계 (2024 입춘 2/4 17:27) | 2024-02-04 17:20 | 癸卯년 乙丑월 | 甲辰년 丙寅월 | ❌ |
| 소한 전 (1월 1~5일) | 2024-01-03 | 甲子월 | 乙丑월 | ❌ |
| 경칩 경계 (1996 경칩 3/5 16:09) | 1996-03-05 18:00 | 辛卯월 | 庚寅월 | ❌ |
| 자시 (지방평균시 23:08) | 2000-01-01 23:40 | 己未일 甲子시 | 戊午일 壬子시 | ⚠️ 유파 차이 |
| 서머타임 (1988 KDT) | 1988-07-01 10:00 | 辰시 | 巳시 | ❌ |

→ "월주=일주 동일(1990-03-15)" 이슈는 **정상**이다. KASI 일진으로도 그날은 己卯일이며, 월주도 己卯월이다.

---

## 6. 서비스 연동 (Next.js)

```
[Route Handler: /api/saju]
  1. 입력 검증 (양/음력, 윤달, 생년월일, 시각, 성별, 주제)
  2. (음력이면) 검증된 라이브러리로 양력 변환
  3. analyzeSaju(...) 실행 → 위 출력 객체 획득
  4. 출력에서 필요한 필드 추출 → 프롬프트에 삽입
     (pillars, dayMaster, fiveElements, dominant/weak, yongsin, fortune.summary 등)
  5. Gemini 호출 → 자연어 풀이
  6. 계산 요약 + 해석을 클라이언트로 반환
```

- 패키지는 **서버에서만** 실행(Node 패키지, 클라이언트 불가).
- 출력의 `readingGuide`, `fortune.caveat`, `limitations`는 프롬프트/UI에 활용 가능.

---

## 7. 리스크 · 대안

- **보안 감사 경고**: skills.sh에서 Socket/Snyk/Gen Agent Trust Hub 모두 "Warn" 표시.
  도입 전 경고 내용 확인 필요.
- **소규모 패키지 의존**: 개인/커뮤니티 패키지로 유지보수·정확도 보장이 제한적.
- **대안**:
  - 다른 만세력 계산 라이브러리로 교체
  - 계산 로직을 참고해 직접 구현/포팅
  - 계산만 담당하는 별도 검증된 API 사용
- 연동 함수 경계(`계산(input) → result`)를 고정해두면 엔진 교체 시 영향 최소화.

---

## 8. 미결정 사항 (Decisions Needed)
- [x] `saju-fortune` 최종 채택 여부 → 미채택, 자체 모듈 (§9)
- [x] 음력 변환 → korean-lunar-calendar(KASI)로 선변환
- [ ] 진태양시 보정 수준 (출생지 필수화 여부)
- [x] 보안 경고 확인 → 소스 점검 결과 위험 API 없음 (미채택이라 무관)

---

## 9. 자체 계산 모듈 `lib/saju/` (채택)

| 파일 | 역할 |
|------|------|
| `compute.ts` | 유일한 진입점 `computeSaju(BirthInput) → SajuResult` (서버 전용) |
| `solarTerms.ts` | 12절 절입 시각. `lunar-javascript`(천문 계산, UTC+8 출력)를 UTC로 변환해 절대 시각 비교 |
| `lunar.ts` | 음력→양력. `korean-lunar-calendar`(KASI 데이터). 존재하지 않는 윤달은 `LunarConversionError` |
| `time.ts` | 서울 벽시계→UTC(런타임 IANA `Asia/Seoul` — UTC+8:30 시기·서머타임 자동 반영), 경도 기반 지방평균시 |
| `pillars.ts` | 네 기둥 + 십신 |
| `analysis.ts` | 오행 분포, 신강신약, 용신 (간이 억부) |
| `cities.ts` | 시·도 경도 표 (미입력 시 서울) |

### 계산 규칙 (확정)
- **연주**: 입춘 절입 시각 기준.
- **월주**: 12절 절입 시각 기준. 월간은 연간에서 (갑기년 → 병인월 …).
- **시각 보정**: 입력 시각(그 시절 한국 표준시·서머타임 포함) → UTC → 출생지 경도로 **지방평균시**. 균시차는 반영하지 않는다(±16분, 추후 검토).
- **일주**: 지방평균시 날짜 기준. **23시 이후(자시)는 다음 날 일주**로 본다. (야자시를 쓰는 유파도 있어 추후 옵션화 가능)
- **시주**: 지방평균시 2시간 단위, 시간은 일간에서 (갑기일 → 갑자시 …).
- **시간 미상**: 시주 null. 절입일 출생이면 "월주가 달라질 수 있음" 한계 문구 추가.
- **지원 범위**: 1920~2049년.

### 신강신약 · 용신 (잠정 — 유파 확정 시 재검토)
- 득령(월지, 가중치 3)·득지(일지, 1.5)·득세(나머지 글자, 각 1)에서 일간을 돕는 기운(비겁·인성)의 비율.
  0.55 이상 신강, 0.40 이하 신약, 그 사이 중화.
- 용신(억부): 신약 → 인성(보조 비겁) / 신강 → 비겁 과다면 관성, 인성 과다면 재성(보조 식상) / 중화 → 가장 적은 오행.
- 조후·지장간 중기/여기는 미반영. 오행 개수는 천간 + 지지 본기 오행 8글자 기준.

### 테스트 (`npm test`)
- KASI 일진과 **1920-01-01 ~ 2049-12-31 전 날짜 일주 전수 대조** (불일치 0).
- 위 §5 경계 케이스 + 출생지별 시주 변화, UTC+8:30 시기, 윤달 변환, 십신 배치.

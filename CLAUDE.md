# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트

**클래스 핏 (ClassFit)** — 학부모가 답하는 설문으로 아이의 학습 성향을 진단하고, LLM이 서술형 리포트를 써주는 한국어 Next.js 앱. 배포: `learnmatch-zeta.vercel.app`.

제품 문서는 세 파일로 관리한다. **작업 전에 읽고, 결정을 내렸으면 갱신한다.**
- `PLAN.md` — 제품 개요·MVP 범위·마일스톤
- `TASKS.md` — 태스크(T-NN) 목록과 완료 기준
- `DECISIONS.md` — 결정 이력(D-NN). 왜 그렇게 했는지가 여기 있다. 코드만 봐서는 알 수 없는 트레이드오프가 기록돼 있으니 관련 기능을 건드리기 전에 해당 항목을 찾아볼 것.

UI 문구·주석·커밋 메시지는 한국어로 쓴다.

## 명령어

```bash
npm run dev          # 개발 서버 (localhost:3000)
npm run build        # 프로덕션 빌드
npx tsc --noEmit     # 타입 체크 — 테스트 러너가 없으므로 이게 1차 검증
node scripts/check-scoring.ts   # 채점 로직 검증 (문항 수·카테고리별 5개·범위 등). 문항·채점 수정 시 필수
```

테스트 프레임워크는 없다. 검증은 `check-scoring.ts` + `tsc` + 브라우저 확인 조합으로 한다.

운영·디버깅 스크립트 (모두 `.env.local`을 직접 파싱한다):
```bash
node scripts/check-db.js                          # 최근 diagnoses/reports 행 확인
node scripts/unlock.js <share_token> [주문번호]    # 수동 언락 (--local로 로컬 서버)
node scripts/unlock.js --list                     # 최근 진단 목록
node scripts/test-groble-webhook.js <share_token> # 웹훅 서명·언락 흐름 테스트
```

개발 서버는 `.claude/launch.json`의 `classfit-dev`로 띄운다 (Bash로 직접 실행하지 말 것).

## 아키텍처

### 흐름
`/survey` (이름·연령대·학원 유무 입력 → 65문항, localStorage에 실시간 저장) → sessionStorage → `/result` → `POST /api/report` → 채점 + LLM 생성 + DB 저장 → 로딩 → **리포트 열람 게이트(D-26)** → 리포트 렌더 → 공유 링크 `/r/[code]`

### 핵심 데이터 흐름 (`lib/`)

**`questions.ts` → `scoring.ts` → `prompt.ts` → `llm.ts`** 가 중심축이다.

- `questions.ts` — 65문항: 채점 5축(`autonomy`/`zpd_strain`/`burnout`/`competence`/`social`) × 12문항 = 60 + 범주형 `style_strength` 5문항 (D-21, D-26). 각 선택지는 `effects: Partial<Record<AxisId, number>>`로 가중치를 준다. `style`/`focus`는 범주형(최빈값)이라 점수화되지 않는다 — `category` 필드는 채점과 무관, 문항 상단 라벨·인터루드용. `LEVEL_MEANING`(D-24)은 5축×레벨 1~5의 의미 문장 — "레벨 X/5" 숫자가 화면에 나오는 곳(`result-view.tsx`)엔 항상 이 문장을 같이 보여준다, 숫자만 단독으로 보이면 안 됨. `AXIS_SCALE_NOTE`·`STRAIN_AXES`(D-27)는 **숫자의 방향**을 다룬다 — `burnout`·`zpd_strain` 두 축은 높을수록 부담이 크다는 뜻이라 나머지 3축과 방향이 반대다. 숫자가 나오는 자리(결과 화면 레벨 배지, 레이더 차트, OG 카드, LLM 프롬프트의 `[채점 결과]`)엔 반드시 방향 문장을 같이 넣고, 이 두 축엔 성취색(amber/sage)을 쓰지 않는다. 캡션을 역방향 2축에만 달면 그 둘이 "나쁜 축"으로 읽혀 반전 프레이밍이 깨지므로 5축 전부에 둔다.
- `insights.ts` — "어쩌면 의외의 모습" 재해석 문장 매핑 테이블 (D-24). 2축 조합 규칙 + 5축×상/하 단일 폴백으로 **항상 최소 1개**를 보장한다. mock·실제 LLM 프롬프트가 공유.
- `scoring.ts` — `axisRanges()`가 **문항 데이터에서 축별 이론적 min/max를 자동 산출**한다. 따라서 문항을 추가·수정해도 정규화 범위를 손으로 고칠 필요가 없다.
- `prompt.ts` — `PROMPT_VERSION`을 두고 DB에 함께 저장한다. 프롬프트를 의미 있게 바꾸면 버전을 올린다.
- `llm.ts` — **LLM 교체 지점은 이 파일 하나다.** 폴백 체인: Gemini(`gemini-2.5-flash`) → Claude(`claude-sonnet-5`) → `llm-mock.ts`. 각 단계는 try/catch로 감싸 실패 시 다음으로 넘어간다.

### 문항을 수정할 때 (중요)

**선택지의 순서와 `effects` 값은 그대로 두고 `text`/`label`만 바꾼다.** 이러면 채점 축 의미·`axisRanges()`·`check-scoring.ts` 21건이 전부 그대로 유지된다 (D-14). 문항 문구는 여러 번 다듬어 왔지만 채점 체계는 legacy 프로토타입부터 이어져 온 자산이다.

문항 톤의 방향: 부모가 스스로 범주화하는 추상적 질문("아이가 깊이 파고드는 편인가요?")이 아니라, **특정 장면에서의 행동**을 묻는다("아이 방을 둘러본다면 물건들은 어떤 모습인가요?"). 부모가 관찰을 그대로 떠올리게 되어 정확도와 의외성이 함께 올라간다.

장면은 아무 장면이 아니라 **부모가 즉시 알아보는 대표적 갈등 순간**을 고른다 (D-19) — "이따 할게" 무한 반복, 받아쓰기 공책의 빨간펜, 게임은 금방 배우면서 공부는 힘들어하는 모습. 단 **문항 문구 자체는 중립 관찰형을 유지**한다: 감정 실린 표현("속 터지게 미룰 때")은 부정 응답을 유도해 채점을 왜곡하므로, 공감 포인트는 장면 선택과 선택지 속 아이의 말에 싣는다.

문항을 고를 때 세 가지를 더 확인한다 (D-15, D-20): ① **일부 아이에게만 해당하는 상황을 전제하지 않는다** — 예를 들어 "학원 다녀온 날"은 학원에 안 다니는 아이(미취학·초등 저학년 포함)의 부모는 답할 근거가 없어 아무거나 찍게 되고, 그 노이즈가 해당 채점 축에 그대로 섞인다. ② **다른 문항과 소재·방향이 겹치지 않게 한다** — 같은 축을 재는 문항끼리도 서로 다른 장면이어야 다각도 측정의 의미가 있다. ③ **부모가 직접 볼 수 있는 장면이어야 한다** — 교실 안, 부모 없는 캠프처럼 부모의 관찰 범위 밖 장면을 물으면 관찰이 아니라 부모의 추측·인상을 측정하게 된다. 학교·학원 얘기를 다루려면 "집에서 부모에게 보이는 반응"(하교 후 대답, 식탁에서의 표정)으로 묻는다.

문항 자체를 일부 나이대·학원 유무에서 못 쓸 때는 `variants`/`hagwonVariants`를 쓴다 (D-17, D-21). `Question.variants[ageBand]` / `Question.hagwonVariants[hagwonStatus]`로 text/option label만 교체하고 **effects·순서·개수는 base와 완전히 동일하게 유지**한다 — 그래야 `axisRanges()`·`check-scoring.ts`·공유 코드가 영향받지 않는다. 둘 다 있으면 hagwonVariants가 나중에 적용돼 우선(더 좁은 문제를 겨냥하므로). 현재 커버리지: `variants`는 q4·q18(preschool+elem_low), q2·q11·q12·q15·q24(preschool), q6·q10·q13·q23(middle+high) — `hagwonVariants`는 q14·q21(none, 실제로 "학원"을 직접 언급하는 문항만). 문항을 표시하거나 LLM에 전달할 때는 정적 `QUESTIONS` 대신 `getQuestions(ageBand, hagwonStatus)`를 쓴다(`app/survey/page.tsx`, `lib/prompt.ts`, `lib/llm-mock.ts`가 이렇게 한다). 반면 채점·공유코드(`lib/scoring.ts`, `lib/share.ts`, `scripts/check-scoring.ts`)는 옵션 순서·effects·id만 쓰므로 base `QUESTIONS`를 그대로 쓰면 된다.

`hagwonStatus`(학원·과외 여부, `lib/hagwon-status.ts`)는 **DB에 저장하지 않는다** — `sessionStorage` → `/api/report` 요청 본문 → 프롬프트로만 흐른다. `child_age_band`(D-13)처럼 컬럼을 추가하려면 마이그레이션 확인 절차가 필요한데, 톤 분기 용도로만 쓰이고 생성된 리포트 텍스트는 기존 `content_md`에 저장되므로 굳이 새 컬럼이 필요 없었다. 학원 유무별 통계가 필요해지면(T-16) 그때 마이그레이션과 함께 추가한다.

**응답 신뢰도 보강 (D-25)**: 채점 축 60문항(스타일·포커스 5개 제외)엔 다섯 번째로 `uncertain: true` 옵션("아직 못 봤거나 잘 모르겠어요")이 항상 있다. 한 축(12문항)에서 이걸 2번 이상 고르면 `app/survey/page.tsx`가 그 축의 `SUPPLEMENTARY_QUESTIONS`(축당 1개, 더 일상적인 장면)를 배너와 함께 끼워 넣는다. `scoring.ts`는 base 65문항이 아니라 `ALL_SCORABLE_QUESTIONS`(= QUESTIONS + SUPPLEMENTARY_QUESTIONS)로 채점하고, `AxisScore.answeredCount`(uncertain 제외, 보조문항 포함)를 축마다 계산한다 — 리포트의 "(문항 N개 응답 종합)"은 이 값을 그대로 쓴다, **하드코딩하지 말 것.**

**문항 축 블록·인터루드 위치 (D-26)**: `lib/questions.ts`의 `QUESTIONS` 배열 순서는 축별로 12개씩 연속 배치(자율성 1~12·수준격차 13~24·번아웃 25~36·유능감 37~48·학습스타일 49~53·사회성 54~65)돼 있다. `app/survey/page.tsx`의 `AXIS_BLOCK_ENDS`(12/24/36/48/65)·`INTERLUDE_STEPS`(10/20/30/40/50/60)가 이 순서에 의존하므로, 문항 개수나 순서를 바꾸면 이 두 상수도 반드시 같이 고칠 것.

**응답 유실 방지 (D-26)**: `lib/survey-progress.ts`가 매 문항 응답마다 진행 상태를 localStorage에 저장하고(문항 수를 버전으로 저장해 구조가 바뀌면 자동 폐기), 인트로 화면에서 "이어서 하기"로 복구한다. 인터루드·보조문항 "화면 자체"는 복원 대상이 아니다(다음 실제 문항으로 건너뜀).

### 리포트 톤 (D-10, D-13, D-16)

- **반전 프레이밍**이 핵심. 부모가 "문제"로 여기던 행동을 강점의 언어로 재해석하되, 미화가 아니라 실천 힌트를 함께 준다. `AXIS_META`의 `positive`/`negative`가 **양극단 모두 강점 언어**로 쓰여 있는 이유다.
- 연령대(`childAgeBand`)가 주어지면 발달 단계를 반영한다 — 미취학 아이에게 "스스로 계획을 세워야 한다"는 기준을 들이대지 않는 것.
- "축별로 읽어보기"의 각 축은 관련 이론을 대화체 한 문장으로만 연결한다(자율성·동기·유능감·관계·사회성→SDT, 학습 수준·격차→ZPD, 정서·번아웃→학업 소진 연구). 논문 인용투는 쓰지 않고, 축마다 한 번을 넘지 않는다. 헤더의 '교육심리학 기반' 배지를 "과한 강조"로 뺀 전례(T-14)가 있으니 이 절제 수준을 넘지 않을 것. 학습스타일·강점(시각/청각/체험/읽기, 깊이/넓이)은 근거가 약한 참고 지표라 이론을 붙이지 않는다.
- 각 축 문단 끝에 "(문항 N개 응답 종합)"을 덧붙인다 (D-21, D-25) — N은 `[채점 결과]`에 표시된 그 축의 실제 `answeredCount`를 그대로 옮겨 쓴다(보통 12, "잘 모르겠어요"·보조문항에 따라 달라질 수 있음). 하드코딩 금지.
- "학원을 고른다면" 섹션은 헤딩은 고정하고 톤만 `hagwonStatus`로 분기한다(D-21) — 이미 다니면 "지금 다니는 곳이 맞는지 점검", 아직이면 "첫 학원 고르는 기준". 헤딩 자체를 조건부로 만들지 않는 이유는 아래 "리포트 게이팅" 항목 참고.
- "어쩌면 의외의 모습"에는 `lib/insights.ts::pickReinterpretationInsights()`가 계산한 재해석 후보를 최소 1개 반드시 녹인다(D-24). 프롬프트 지침만으로는 LLM이 빠뜨릴 수 있어서(D-23에서 겪음), 축 조합→문장 매핑 테이블을 코드로 만들어 "재료"를 프롬프트에 강제로 끼워 넣는 방식을 쓴다 — mock은 이 문장을 그대로 쓰고, 실제 LLM에는 `[재해석 후보]`로 전달. 새 조합 규칙을 추가할 땐 반드시 "부모님은 ~로 보셨을 수 있지만, 사실 ○○는 ~예요" 구조를 지키고, 단일 축 폴백(10개, 5축×상/하)이 있어 콤보가 하나도 안 맞아도 항상 최소 1개는 나온다는 걸 깨지 않을 것.

### 리포트 게이팅 — 두 겹 (D-07 부분잠금 + D-26 열람 게이트)

**① 열람 게이트 (D-26)**: `app/components/report-gate-screen.tsx`. 로딩이 끝나면 리포트를 바로 보여주지 않고 "리포트가 준비됐어요" 화면(목차 미리보기 + 버튼)을 먼저 보여준다. `result-view.tsx`의 `gatePassed` 상태로 제어 — 버튼을 눌러야 `ReportView`가 렌더된다. 이 화면은 **결제를 하지 않는다** — `report.locked`(D-32)를 prop으로 받아 문구만 바꾼다(`locked=false`면 "파일럿 기간 무료로 열람하기", `locked=true`면 "무료로 미리보기 시작하기" + 990원 안내). 항상 무료 미리보기로 들어가는 문이고, 실제 결제는 ②에서 일어난다 — 공감 후킹을 먼저 무료로 보여줘야 전환이 일어난다는 D-07 원칙 때문에 이 순서를 바꾸지 않았다(D-32에서 재확인). `initialReport`로 전달되는 경로(공유 링크 `/r/[code]`, 예시 페이지)는 게이트를 건너뛴다.

**② 부분잠금 (D-07, D-32에서 실전환, D-37에서 잠금 시작점 앞당김)**: `report-gate.ts`의 `splitReport()`가 `## 한눈에 보기` 헤딩(리포트 본문의 첫 헤딩)을 기준으로 마크다운을 문자열 분할한다 — 즉 본문은 이제 미리보기 없이 전부 잠긴다, 무료인 건 본문 밖의 헤드라인·레이더뿐. **프롬프트의 `## 헤딩` 문구와 이 상수가 정확히 일치해야 한다** — 헤딩을 바꾸면 게이팅이 깨진다. 기본값이 유료(D-34) — `PAYWALL_ENABLED=false`를 명시해야 꺼진다. "서비스 오픈 기념 990원으로 전체 리포트 열기" CTA가 `lib/groble.ts`의 실제 Groble 상품 URL(`?ref=share_token`)로 연결된다 — 결제 확인은 웹훅(`app/api/webhooks/groble/route.ts`) 또는 관리자 언락(`/api/unlock`)으로만 이루어진다.

> 트레이드오프: `content_md`는 항상 전체가 저장되고 ②의 게이팅은 읽을 때 적용된다. 즉 유료 전환 시 무료 기간에 발급된 기존 공유 링크도 그 순간 다시 잠긴다. 전환할 때 이 건을 다시 확인할 것.

### 공유 링크

두 경로가 공존한다 — `/r/[code]`가 먼저 DB `share_token`으로 조회하고(주 경로), 실패하면 `share.ts`의 무상태 숫자 코드 디코딩으로 폴백한다(legacy). 무상태 코드는 자릿수 = 문항 수라서, 문항 개수를 바꾸면 옛 링크는 디코딩되지 않는다.

### DB (`lib/db.ts`)

Supabase `service_role` 키를 쓴다 — **서버에서만 import할 것.** 전 테이블 RLS 활성화 + 정책 0개 = `service_role` 외에는 기본 거부.

저장 실패는 `console.error` 후 `null` 반환으로 삼킨다(서비스 계속 동작). 조용히 실패하므로 **DB 관련 변경 후에는 로그를 직접 확인해야 한다.**

## 마이그레이션 순서 (실수 이력 있음)

`supabase/migrations/`의 SQL은 **사용자가 Supabase 대시보드에서 직접 실행한다.** 자동 적용되지 않는다.

**새 컬럼에 의존하는 코드는 마이그레이션 실행을 확인받은 뒤에만 push한다.** 과거에 `child_name` 컬럼을 쓰는 코드를 먼저 배포해 프로덕션의 모든 진단 저장이 실패한 사고가 있었다 (`PGRST204: Could not find the '...' column`). insert 페이로드에 컬럼이 무조건 들어가므로 그 값을 안 쓰는 진단까지 전부 실패한다.

## 프로덕션 DB 주의

로컬 개발도 **프로덕션 Supabase를 공유한다.** 검증하다 만든 테스트 진단은 반드시 삭제한다 (`share_token`으로 특정해서). 출처가 불분명한 행은 지우지 말고 사용자에게 물어볼 것.

`/api/report`는 부수효과(DB 행 생성 + LLM 과금)가 있다. **재시도 루프나 폴링으로 호출하지 말 것** — 단발 호출로 검증하고 정리한다.

**알려진 이슈(미수정)**: 로컬 개발 모드에서 실제 진단 1건이 `/api/report`를 2번 호출해 진단 행이 2개씩 생기는 현상이 D-25·D-26 양쪽 검증에서 재현됨(React 18 StrictMode의 effect 이중 실행으로 추정 — `result-view.tsx`의 `useEffect` cleanup이 `cancelled` 플래그로 state 업데이트만 막고 실제 fetch는 취소하지 않는다). 프로덕션 빌드엔 영향 없을 가능성이 높지만 확인 안 됨. 검증 후 `node scripts/unlock.js --list`로 중복 행을 확인하고 지울 것.

## 결제 (Groble)

PG 직접 연동 없음. Groble 상품 페이지 링크로 보내기만 한다(`lib/groble.ts` — 교체 지점).

Groble 웹훅에는 커스텀 메타데이터·쿼리파라미터가 없다. 그래서 상품의 "구매 시 질문"으로 진단 링크를 필수 입력받아 `questionAnswers`에서 `share_token`을 추출한다 (D-08). 리다이렉트의 `?ref=`만으로는 절대 언락하지 않는다 — URL만 알면 무료 열람이 가능해지기 때문. 서버가 결제를 확인한 경우(웹훅 HMAC 서명 검증 또는 `ADMIN_SECRET` 인증)에만 언락한다.

## 알아둘 것

- `import` 경로에 `.ts` 확장자를 붙인다 (`allowImportingTsExtensions`). `lib/` 내부는 상대경로 + `.ts`, `app/`에서는 `@/lib/...` 별칭을 쓴다.
- OG 이미지(`opengraph-image.tsx`)는 Satori 기반이라 **자식이 2개 이상인 `<div>`에 `display: flex`를 명시**해야 한다. 한글은 Google Fonts CSS2 API로 서브셋을 fetch해 임베딩한다.
- `lib/example-report.ts`는 랜딩의 "예시 리포트 보기"용 고정 텍스트다 (매 열람마다 LLM을 부르지 않기 위함). 문항을 크게 바꾸면 재생성 대상 — `scripts/make-example.js` 참고. **D-21 이후 우선순위 상승**: 레이더 차트는 `scoreAnswers()`로 실시간 재계산돼 새 축 라벨("자율성·동기" 등)을 쓰는데, 고정 텍스트는 옛 라벨("자기주도성" 등)을 그대로 담고 있어 차트와 본문 라벨이 눈에 띄게 어긋난다.
- 결과 화면 공유(D-25)는 Kakao SDK 앱키가 없어 `navigator.share()`(모바일 OS 공유 시트 — 카카오톡 포함)로 구현했다. 데스크톱처럼 미지원이면 클립보드 복사로 폴백. 리치 카드 공유가 필요해지면 `lib/groble.ts`와 같은 패턴(환경변수 있으면 SDK 사용, 없으면 지금 방식 유지)으로 추가할 것.
- `legacy/`의 HTML 2개는 채점 축의 원본이자 2단계(학원 매칭) 참고 자산이다. `tsconfig`에서 제외돼 있다.

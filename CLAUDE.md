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
node scripts/check-scoring.ts   # 채점 로직 검증 (21건). 문항·채점 수정 시 필수
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
`/survey` (이름·연령대 입력 → 25문항) → sessionStorage → `/result` → `POST /api/report` → 채점 + LLM 생성 + DB 저장 → 리포트 렌더 → 공유 링크 `/r/[code]`

### 핵심 데이터 흐름 (`lib/`)

**`questions.ts` → `scoring.ts` → `prompt.ts` → `llm.ts`** 가 중심축이다.

- `questions.ts` — 25문항. 각 선택지는 `effects: Partial<Record<AxisId, number>>`로 5개 축(`autonomy`/`zpd_strain`/`burnout`/`competence`/`social`)에 가중치를 준다. `style`/`focus`는 범주형(최빈값).
- `scoring.ts` — `axisRanges()`가 **문항 데이터에서 축별 이론적 min/max를 자동 산출**한다. 따라서 문항을 추가·수정해도 정규화 범위를 손으로 고칠 필요가 없다.
- `prompt.ts` — `PROMPT_VERSION`을 두고 DB에 함께 저장한다. 프롬프트를 의미 있게 바꾸면 버전을 올린다.
- `llm.ts` — **LLM 교체 지점은 이 파일 하나다.** 폴백 체인: Gemini(`gemini-2.5-flash`) → Claude(`claude-sonnet-5`) → `llm-mock.ts`. 각 단계는 try/catch로 감싸 실패 시 다음으로 넘어간다.

### 문항을 수정할 때 (중요)

**선택지의 순서와 `effects` 값은 그대로 두고 `text`/`label`만 바꾼다.** 이러면 채점 축 의미·`axisRanges()`·`check-scoring.ts` 21건이 전부 그대로 유지된다 (D-14). 문항 문구는 여러 번 다듬어 왔지만 채점 체계는 legacy 프로토타입부터 이어져 온 자산이다.

문항 톤의 방향: 부모가 스스로 범주화하는 추상적 질문("아이가 깊이 파고드는 편인가요?")이 아니라, **특정 장면에서의 행동**을 묻는다("아이 방을 둘러본다면 물건들은 어떤 모습인가요?"). 부모가 관찰을 그대로 떠올리게 되어 정확도와 의외성이 함께 올라간다.

문항을 고를 때 두 가지를 더 확인한다 (D-15): ① **일부 아이에게만 해당하는 상황을 전제하지 않는다** — 예를 들어 "학원 다녀온 날"은 학원에 안 다니는 아이(미취학·초등 저학년 포함)의 부모는 답할 근거가 없어 아무거나 찍게 되고, 그 노이즈가 해당 채점 축에 그대로 섞인다. ② **다른 문항과 소재·방향이 겹치지 않게 한다** — 같은 축을 재는 문항끼리도 서로 다른 장면이어야 다각도 측정의 의미가 있다.

### 리포트 톤 (D-10, D-13)

- **반전 프레이밍**이 핵심. 부모가 "문제"로 여기던 행동을 강점의 언어로 재해석하되, 미화가 아니라 실천 힌트를 함께 준다. `AXIS_META`의 `positive`/`negative`가 **양극단 모두 강점 언어**로 쓰여 있는 이유다.
- 연령대(`childAgeBand`)가 주어지면 발달 단계를 반영한다 — 미취학 아이에게 "스스로 계획을 세워야 한다"는 기준을 들이대지 않는 것.

### 리포트 게이팅

`report-gate.ts`의 `splitReport()`가 `## 어쩌면 의외의 모습` 헤딩을 기준으로 마크다운을 문자열 분할한다. **프롬프트의 `## 헤딩` 문구와 이 상수가 정확히 일치해야 한다** — 헤딩을 바꾸면 게이팅이 깨진다.

`PAYWALL_ENABLED=true`일 때만 게이팅이 켜진다. 현재는 미설정 = 전체 무료 공개(D-12). `/api/report`·`/r/[code]`·결과 화면 CTA가 모두 이 함수 하나에 의존하므로, 유료 전환은 환경변수만 바꾸면 된다.

> 트레이드오프: `content_md`는 항상 전체가 저장되고 게이팅은 읽을 때 적용된다. 즉 유료 전환 시 무료 기간에 발급된 기존 공유 링크도 그 순간 다시 잠긴다. 전환할 때 이 건을 다시 확인할 것.

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

## 결제 (Groble)

PG 직접 연동 없음. Groble 상품 페이지 링크로 보내기만 한다(`lib/groble.ts` — 교체 지점).

Groble 웹훅에는 커스텀 메타데이터·쿼리파라미터가 없다. 그래서 상품의 "구매 시 질문"으로 진단 링크를 필수 입력받아 `questionAnswers`에서 `share_token`을 추출한다 (D-08). 리다이렉트의 `?ref=`만으로는 절대 언락하지 않는다 — URL만 알면 무료 열람이 가능해지기 때문. 서버가 결제를 확인한 경우(웹훅 HMAC 서명 검증 또는 `ADMIN_SECRET` 인증)에만 언락한다.

## 알아둘 것

- `import` 경로에 `.ts` 확장자를 붙인다 (`allowImportingTsExtensions`). `lib/` 내부는 상대경로 + `.ts`, `app/`에서는 `@/lib/...` 별칭을 쓴다.
- OG 이미지(`opengraph-image.tsx`)는 Satori 기반이라 **자식이 2개 이상인 `<div>`에 `display: flex`를 명시**해야 한다. 한글은 Google Fonts CSS2 API로 서브셋을 fetch해 임베딩한다.
- `lib/example-report.ts`는 랜딩의 "예시 리포트 보기"용 고정 텍스트다 (매 열람마다 LLM을 부르지 않기 위함). 문항을 크게 바꾸면 재생성 대상 — `scripts/make-example.js` 참고.
- `legacy/`의 HTML 2개는 채점 축의 원본이자 2단계(학원 매칭) 참고 자산이다. `tsconfig`에서 제외돼 있다.

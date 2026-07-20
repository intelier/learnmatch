# 클래스 핏 — PLAN

## 1. 제품 개요
- **한 줄 소개**: 자녀 성향진단으로 자녀 이해를 돕고, 나아가 학원 선택을 돕는 서비스
- **제품 성격**: 설문 → LLM 진단 리포트 → 소액 결제의 단순 웹 구조. 구현 난이도는 낮으나 **진단의 근거·신뢰성 확보가 핵심 리스크**. 학원 매칭은 2단계.
- **타겟**: 초등~중등 자녀를 둔 학부모. 아이의 학습 태도가 걱정되지만 "왜 그런지"를 설명해 주는 곳이 없는 부모.
- **핵심 가치(재방문 이유)**:
  - 1차: "우리 아이 얘기 같다"는 서술형 리포트 → 지인 공유 → 신규 유입 (공유 루프)
  - 2차: 형제/시간 경과 후 재진단, (2단계) 성향 기반 학원 추천

## 2. MVP 범위
### 넣을 것
1. 설문 문항 → 응답 수집 (익명, 가입 없음)
2. LLM(Claude Sonnet) 진단 리포트 생성 — "우리 아이 얘기 같은" 서술형
3. 990원 결제 언락 — Groble 판매 링크 부착 (PG 직접 연동 없음)
4. 리포트 공유 링크 → 지인 유입

### 일부러 안 넣을 것
- 회원가입·로그인 (익명 시작 유지. Supabase Auth는 필요 시 후순위)
- 학원 매칭·학원 DB (2단계 — 데이터 축적 후)
- PG 직접 연동 (토스 등 금지 — Groble 링크만)
- 관리자 대시보드, 앱(네이티브), 다국어

## 3. 기술 스택
| 영역 | 선택 |
|---|---|
| 프론트엔드 | Next.js (App Router) |
| 백엔드 | Supabase + Vercel Functions |
| 데이터 | Supabase Postgres |
| LLM | Claude Sonnet 5 (키 없으면 mock 어댑터, 교체 지점 파일 1개로 분리) |
| 결제 | Groble (groble.im) 판매 링크 |
| 배포 | Vercel |

## 4. 데이터 모델 초안
```
diagnoses            -- 진단 1회
  id uuid pk
  child_nickname text          -- 선택 입력 (익명)
  child_age_band text          -- 연령대 (미정: 범위)
  answers jsonb                -- {q1: 2, q2: 0, ...}
  scores jsonb                 -- 채점 결과 {autonomy: 2, burnout: -1, ...}
  share_token text unique      -- 공유 링크용
  created_at timestamptz

reports              -- LLM 생성 리포트
  id uuid pk
  diagnosis_id uuid fk -> diagnoses
  content_md text              -- 서술형 리포트 본문
  free_preview_md text         -- 무료 미리보기 부분 (미정: 경계)
  model text                   -- 'claude-sonnet-5' | 'mock'
  prompt_version text          -- 프롬프트 버전 추적 (신뢰성 관리)
  status text                  -- pending | done | failed
  created_at timestamptz

purchases            -- 결제 (Groble 링크 기반이므로 확인 방식 미정)
  id uuid pk
  diagnosis_id uuid fk
  product text                 -- 'single_990' | 'pack10_8000'
  status text                  -- pending | confirmed
  groble_ref text              -- Groble 주문 참조
  created_at timestamptz

-- (2단계) academies: 학원 DB — 스키마는 M3에서 설계
```

## 5. 기존 자산 (프로토타입)
- `index.html` — 학부모 설문 → 학원 매칭 데모 (2단계 참고용)
- `learning_diagnostic_full.html` — **성향 진단 풀 데모: 8문항 + 채점 축 구현됨**
  - 채점 축: autonomy(자기주도) · zpd_strain(수준 부담) · burnout(소진) · competence(유능감) · social(사회성) · style(학습스타일) · focus(깊이/넓이)
  - 자기결정성이론(SDT) + 비고츠키 ZPD 개념 기반 흔적
  - **[D-02 확정]** 이 채점 축을 유지하며 15~20문항으로 확장하는 방향으로 결정

## 6. 마일스톤
### M1 — 핵심 가설 검증: "리포트가 '우리 아이 얘기 같다'는 반응을 얻는가"
- 최소 화면: 설문 → 리포트 생성(무료 전체 공개) → 공유 링크
- 결제·DB 저장 없이도 가설 검증 가능한 최소 구성 (mock → 실제 LLM 순)
- 완료 기준: 배포 URL에서 설문~리포트~공유까지 눈으로 동작 확인

### M2 — 수익화: 결제 언락
- Supabase 저장, 무료 미리보기/유료 전체 게이팅, Groble 링크 부착
- 완료 기준: 미리보기 → Groble 결제 → 언락된 전체 리포트 열람

### M3 — 성장 루프 + 2단계 준비
- 공유 페이지 최적화(OG 이미지 등), 10회권, 데이터 축적 지표
- 학원 DB 스키마 설계 착수

## 7. 미정 사항 (인터뷰 대기열)
| # | 항목 | 왜 정해야 하나 |
|---|---|---|
| U-3 | 대상 연령 범위 (초등만? 초·중등?) | 문항 표현·리포트 톤·타겟 마케팅 결정 |
| U-4 | 공유 링크 공개 범위 — 전체 리포트 vs 요약 카드 | 공유 루프 설계 + 유료 콘텐츠 보호 상충 |
| U-5 | 보유 키 확인 — Anthropic / Supabase / Groble 계정 | mock → 실제 전환 시점 계획 |
| U-7 | 기존 HTML 데모 2개 처리 — /legacy 보존 vs 삭제 | 저장소를 Next.js로 재구성할 때 결정 필요 |

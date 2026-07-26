-- D-13: 아이 연령대 저장 — 리포트 발달 단계 반영용
-- 실행: Supabase 대시보드 → SQL Editor → Run
alter table diagnoses add column if not exists child_age_band text;

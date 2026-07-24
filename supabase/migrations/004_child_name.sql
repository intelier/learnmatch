-- T-신규: 아이 이름(애칭) 저장 — 리포트를 "OO이는~"으로 개인화
-- 실행: Supabase 대시보드 → SQL Editor → Run
alter table diagnoses add column if not exists child_name text;

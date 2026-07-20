-- T-10: 결제 언락 상태 컬럼
-- 실행: Supabase 대시보드 → SQL Editor → Run
alter table diagnoses add column if not exists unlocked boolean not null default false;

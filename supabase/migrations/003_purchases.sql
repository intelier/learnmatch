-- T-12: 결제 기록
-- 실행: Supabase 대시보드 → SQL Editor → Run
create table if not exists purchases (
  id uuid primary key default gen_random_uuid(),
  diagnosis_id uuid not null references diagnoses(id) on delete cascade,
  product text not null,                 -- 'single_990' | 'pack10_8000'
  status text not null default 'confirmed',
  groble_ref text,                       -- Groble 주문 참조 (있으면)
  note text,                             -- 수동 처리 시 메모
  created_at timestamptz not null default now()
);

create index if not exists purchases_diagnosis_id_idx on purchases (diagnosis_id);
alter table purchases enable row level security;

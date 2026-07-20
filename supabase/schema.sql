-- 클래스 핏 스키마 v1 (T-09)
-- 실행: Supabase 대시보드 → SQL Editor → 붙여넣기 → Run

create table if not exists diagnoses (
  id uuid primary key default gen_random_uuid(),
  answers jsonb not null,
  scores jsonb not null,
  share_token text unique not null,
  unlocked boolean not null default false, -- 결제 언락 여부 (T-10)
  created_at timestamptz not null default now()
);

create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  diagnosis_id uuid not null references diagnoses(id) on delete cascade,
  content_md text not null,
  model text not null,
  prompt_version text not null,
  status text not null default 'done',
  created_at timestamptz not null default now()
);

-- 결제 기록 (T-12)
create table if not exists purchases (
  id uuid primary key default gen_random_uuid(),
  diagnosis_id uuid not null references diagnoses(id) on delete cascade,
  product text not null,                 -- 'single_990' | 'pack10_8000'
  status text not null default 'confirmed',
  groble_ref text,                       -- Groble 주문 참조 (있으면)
  note text,                             -- 수동 처리 시 메모
  created_at timestamptz not null default now()
);

create index if not exists reports_diagnosis_id_idx on reports (diagnosis_id);
create index if not exists diagnoses_share_token_idx on diagnoses (share_token);
create index if not exists purchases_diagnosis_id_idx on purchases (diagnosis_id);

-- 접근은 서버(service_role)로만 하므로 anon 접근을 차단
alter table diagnoses enable row level security;
alter table reports enable row level security;
alter table purchases enable row level security;

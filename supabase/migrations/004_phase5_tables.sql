-- Phase 5: 박스오피스 캐시 테이블

create table if not exists boxoffice_cache (
  id         text        primary key,                -- "{type}:{targetDt}"
  box_type   text        not null,                   -- "daily" | "weekly"
  data       jsonb       not null,
  expires_at timestamptz not null,
  created_at timestamptz default now()
);

alter table boxoffice_cache enable row level security;
create policy "public read boxoffice_cache" on boxoffice_cache for select using (true);

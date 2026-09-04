-- 팀 인원 제한 해제 (기존 3명 정원 제거)
-- Supabase 대시보드 → SQL Editor에서 한 번 실행하세요.

-- 1) 정원 초과 방지 트리거 제거
drop trigger if exists team_members_capacity on public.team_members;
drop function if exists public.enforce_team_capacity();

-- 2) max_members 컬럼 제약 완화 (있으면 또는 큰 값 허용)
alter table public.teams drop constraint if exists teams_max_members_check;

-- 기존 팀도 사실상 무제한으로
update public.teams set max_members = 99 where max_members < 99;

alter table public.teams
  alter column max_members set default 99;

alter table public.teams
  add constraint teams_max_members_check check (max_members between 1 and 99);

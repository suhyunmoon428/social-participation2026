-- ============================================================================
-- 사회참여활동 워크스페이스 — Supabase 통합 DDL
-- Supabase Dashboard → SQL Editor 에 전체를 붙여넣고 한 번에 실행하세요.
-- (여러 번 실행해도 안전하도록 IF NOT EXISTS / DROP POLICY IF EXISTS 사용)
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- 1. students : 학년-반-번호-이름 + 개인 비밀번호(해시)
-- ---------------------------------------------------------------------------
create table if not exists public.students (
  id            uuid primary key default gen_random_uuid(),
  grade         smallint not null check (grade between 1 and 6),
  class_no      smallint not null check (class_no between 1 and 30),
  student_no    smallint not null check (student_no between 1 and 60),
  name          text     not null check (char_length(trim(name)) between 1 and 20),
  login_key     text     not null unique,          -- '2-3-11-홍길동' 정규화 문자열
  password_hash text     not null,                 -- bcrypt 해시 (서버에서만 생성)
  created_at    timestamptz not null default now(),
  last_login_at timestamptz
);

create index if not exists students_class_idx
  on public.students (grade, class_no, student_no);

-- ---------------------------------------------------------------------------
-- 2. teams : 팀 방 + 고유 참여 코드
-- ---------------------------------------------------------------------------
create table if not exists public.teams (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(trim(name)) between 1 and 40),
  join_code  text not null unique,                 -- 6자리 대문자/숫자
  owner_id   uuid not null references public.students(id) on delete cascade,
  max_members smallint not null default 99 check (max_members between 1 and 99),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 3. team_members : 팀 구성원 (인원 제한 없음)
-- ---------------------------------------------------------------------------
create table if not exists public.team_members (
  team_id    uuid not null references public.teams(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  role       text not null default 'member' check (role in ('owner', 'member')),
  joined_at  timestamptz not null default now(),
  primary key (team_id, student_id)
);

-- 한 학생은 하나의 팀에만 소속
create unique index if not exists team_members_one_team_per_student
  on public.team_members (student_id);

-- 예전 3명 정원 트리거가 남아 있으면 제거 (신규 설치·재실행 모두 안전)
drop trigger if exists team_members_capacity on public.team_members;
drop function if exists public.enforce_team_capacity();

-- ---------------------------------------------------------------------------
-- 4. projects : 팀별 4단계 서술 기록 (실시간 구독 대상)
--    content 구조 예시
--    {
--      "stage1": { "problem": "...", "cause": "...", "roles": "..." },
--      "stage2": { "domestic": "...", "overseas": "...", "prosCons": "..." },
--      "stage3": { "policy": "...", "sideEffects": "...", "solutions": "..." },
--      "stage4": { "actions": "...", "schedule": "...", "pptOutline": "..." }
--    }
-- ---------------------------------------------------------------------------
create table if not exists public.projects (
  id           uuid primary key default gen_random_uuid(),
  team_id      uuid not null unique references public.teams(id) on delete cascade,
  title        text not null default '주제를 입력해 주세요',
  current_stage smallint not null default 1 check (current_stage between 1 and 5),
  content      jsonb not null default '{}'::jsonb,
  ppt_outline  jsonb,
  completed_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists projects_touch_updated_at on public.projects;
create trigger projects_touch_updated_at
  before update on public.projects
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- 5. project_edits : 개인별 작성 기여도 집계용 로그
-- ---------------------------------------------------------------------------
create table if not exists public.project_edits (
  id         bigserial primary key,
  project_id uuid not null references public.projects(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  stage      smallint not null check (stage between 1 and 5),
  field_key  text not null,
  char_delta int  not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists project_edits_project_idx
  on public.project_edits (project_id, student_id);

-- ---------------------------------------------------------------------------
-- 6. ai_messages : AI 논리 조력자 대화 기록
-- ---------------------------------------------------------------------------
create table if not exists public.ai_messages (
  id         bigserial primary key,
  team_id    uuid not null references public.teams(id) on delete cascade,
  student_id uuid references public.students(id) on delete set null,
  stage      smallint not null check (stage between 1 and 5),
  role       text not null check (role in ('user', 'assistant')),
  content    text not null,
  created_at timestamptz not null default now()
);

create index if not exists ai_messages_team_idx
  on public.ai_messages (team_id, stage, created_at);

-- ---------------------------------------------------------------------------
-- 7. assessments : 교사 및 AI 과정중심평가 기록
-- ---------------------------------------------------------------------------
create table if not exists public.assessments (
  id           uuid primary key default gen_random_uuid(),
  team_id      uuid not null unique references public.teams(id) on delete cascade,
  ai_draft     text,
  teacher_final text,
  stage_feedback jsonb not null default '{}'::jsonb,
  status       text not null default 'draft' check (status in ('draft', 'reviewing', 'approved')),
  approved_at  timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

drop trigger if exists assessments_touch_updated_at on public.assessments;
create trigger assessments_touch_updated_at
  before update on public.assessments
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- 8. 참여 코드 생성 함수 (중복 없는 6자리 코드)
-- ---------------------------------------------------------------------------
create or replace function public.generate_join_code()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- 혼동되는 I,O,0,1 제외
  candidate text;
  i int;
begin
  loop
    candidate := '';
    for i in 1..6 loop
      candidate := candidate || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    exit when not exists (select 1 from public.teams where join_code = candidate);
  end loop;
  return candidate;
end;
$$;

-- ============================================================================
-- 9. RLS(Row Level Security) 정책
--    이 앱은 Supabase Auth 대신 '학년-반-번호-이름 + 비밀번호' 커스텀 인증을
--    사용하므로, 모든 DB 접근은 Next.js 서버(Service Role Key)를 통해서만
--    수행합니다. 따라서 anon / authenticated 롤에는 어떤 권한도 주지 않습니다.
--    (Service Role Key 는 RLS 를 우회하므로 서버 API 는 정상 동작합니다.)
--    브라우저의 실시간 협업은 테이블 구독이 아닌 Realtime Broadcast 채널을
--    사용하여 데이터 노출 없이 동작합니다.
-- ============================================================================
alter table public.students     enable row level security;
alter table public.teams        enable row level security;
alter table public.team_members enable row level security;
alter table public.projects     enable row level security;
alter table public.project_edits enable row level security;
alter table public.ai_messages  enable row level security;
alter table public.assessments  enable row level security;

alter table public.students     force row level security;
alter table public.teams        force row level security;
alter table public.team_members force row level security;
alter table public.projects     force row level security;
alter table public.project_edits force row level security;
alter table public.ai_messages  force row level security;
alter table public.assessments  force row level security;

-- 클라이언트(anon, authenticated)의 직접 접근을 명시적으로 차단
do $$
declare
  t text;
begin
  foreach t in array array[
    'students', 'teams', 'team_members', 'projects',
    'project_edits', 'ai_messages', 'assessments'
  ]
  loop
    execute format('drop policy if exists %I on public.%I', t || '_no_client_access', t);
    execute format(
      'create policy %I on public.%I as restrictive for all to anon, authenticated using (false) with check (false)',
      t || '_no_client_access', t
    );
  end loop;
end;
$$;

revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke execute on function public.generate_join_code() from anon, authenticated;

-- ---------------------------------------------------------------------------
-- 10. 교사 대시보드용 진행 현황 뷰 (서버에서만 조회)
-- ---------------------------------------------------------------------------
create or replace view public.team_progress as
select
  t.id                as team_id,
  t.name              as team_name,
  t.join_code,
  t.created_at,
  p.id                as project_id,
  coalesce(p.current_stage, 1) as current_stage,
  p.updated_at        as last_activity_at,
  p.completed_at,
  (select count(*) from public.team_members m where m.team_id = t.id) as member_count,
  coalesce(a.status, 'draft') as assessment_status
from public.teams t
left join public.projects p on p.team_id = t.id
left join public.assessments a on a.team_id = t.id;

revoke all on public.team_progress from anon, authenticated;

-- ============================================================================
-- 완료: 테이블 7개 + 뷰 1개 + 함수 3개 + RLS 정책 적용
-- ============================================================================

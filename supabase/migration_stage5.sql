-- 5단계(발표) 확장 마이그레이션
-- 이미 schema.sql 을 실행한 경우, Supabase SQL Editor 에서 이 파일만 실행하세요.

alter table public.projects drop constraint if exists projects_current_stage_check;
alter table public.projects add constraint projects_current_stage_check
  check (current_stage between 1 and 5);

alter table public.project_edits drop constraint if exists project_edits_stage_check;
alter table public.project_edits add constraint project_edits_stage_check
  check (stage between 1 and 5);

alter table public.ai_messages drop constraint if exists ai_messages_stage_check;
alter table public.ai_messages add constraint ai_messages_stage_check
  check (stage between 1 and 5);

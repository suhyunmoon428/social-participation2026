-- 단계·항목별 교사 피드백 (assessments.stage_feedback)
-- Supabase SQL Editor에서 실행하세요.

alter table public.assessments
  add column if not exists stage_feedback jsonb not null default '{}'::jsonb;

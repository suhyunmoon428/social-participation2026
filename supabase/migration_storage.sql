-- Supabase Storage: 팀별 PDF 첨부 파일
-- SQL Editor에서 한 번 실행하세요.

insert into storage.buckets (id, name, public)
values ('project-attachments', 'project-attachments', false)
on conflict (id) do nothing;

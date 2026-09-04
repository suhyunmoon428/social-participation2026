-- Supabase Storage: 팀별 PDF 첨부 파일 (최대 50MB)
-- SQL Editor에서 한 번 실행하세요.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'project-attachments',
  'project-attachments',
  false,
  52428800, -- 50MB
  array['application/pdf']::text[]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

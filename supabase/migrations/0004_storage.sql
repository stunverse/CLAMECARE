-- ============================================================================
-- ClaimCare AI — Secure document storage (cahier des charges §11/§33)
-- ============================================================================
-- Private bucket for claim documents. Objects are isolated per user via a
-- path convention: <user_id>/<claim_id>/<uuid>-<filename>. RLS on
-- storage.objects restricts every operation to the owner's own folder.
--
-- NOTE: the `storage` schema is provided by Supabase. This migration is meant
-- to run on a Supabase project (supabase db push); it is not validated against
-- a vanilla Postgres instance.
-- ============================================================================

-- Private bucket with a 25 MB per-file limit and an allow-list of MIME types.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'claim-documents',
  'claim-documents',
  false,
  26214400, -- 25 MB
  array[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do nothing;

-- Owner-only access, scoped by the first path segment (= auth.uid()).
create policy "claim_documents_objects_select"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'claim-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "claim_documents_objects_insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'claim-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "claim_documents_objects_update"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'claim-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'claim-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "claim_documents_objects_delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'claim-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

grant select on public.media_assets to anon;

drop policy if exists media_assets_public_select on public.media_assets;
create policy media_assets_public_select on public.media_assets
for select to anon
using (approval_status = 'approved' and visibility = 'public');

drop policy if exists nekbaar_media_public_read on storage.objects;
create policy nekbaar_media_public_read on storage.objects
for select to anon
using (
  bucket_id = 'nekbaar-media'
  and exists (
    select 1 from public.media_assets m
    where m.storage_path = name
      and m.approval_status = 'approved'
      and m.visibility = 'public'
  )
);

create sequence if not exists public.media_assets_code_seq;

create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  asset_code text not null unique default ('MED-' || lpad(nextval('public.media_assets_code_seq')::text, 6, '0')),
  owner_type text not null check (owner_type in ('platform', 'partner')),
  partner_id uuid null references private.platform_b2b_partners(id) on delete restrict,
  uploader_auth_user_id uuid not null references auth.users(id) on delete restrict,
  title text not null check (length(trim(title)) between 2 and 180),
  description text null,
  category text not null default 'general',
  media_type text not null default 'video' check (media_type in ('video', 'image', 'audio')),
  storage_path text not null unique,
  poster_path text null,
  mime_type text not null,
  file_size_bytes bigint not null check (file_size_bytes > 0 and file_size_bytes <= 52428800),
  duration_seconds integer null check (duration_seconds is null or duration_seconds > 0),
  visibility text not null default 'public' check (visibility in ('public', 'partner_only')),
  approval_status text not null default 'pending_review' check (approval_status in ('draft', 'pending_review', 'approved', 'rejected', 'archived')),
  review_note text null,
  approved_by uuid null references auth.users(id) on delete set null,
  approved_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint media_assets_owner_partner_check check (
    (owner_type = 'platform' and partner_id is null) or
    (owner_type = 'partner' and partner_id is not null)
  )
);

create index if not exists media_assets_public_feed_idx
  on public.media_assets (media_type, category, created_at desc)
  where approval_status = 'approved' and visibility = 'public';
create index if not exists media_assets_partner_idx
  on public.media_assets (partner_id, approval_status, created_at desc);
create index if not exists media_assets_uploader_idx
  on public.media_assets (uploader_auth_user_id, created_at desc);

create or replace function public.media_admin_can_view()
returns boolean language sql stable security definer set search_path = ''
as $$
  select
    private.admin_has_permission(auth.uid(), 'content.view')
    or private.admin_has_permission(auth.uid(), 'content.create')
    or private.admin_has_permission(auth.uid(), 'content.edit')
    or private.admin_has_permission(auth.uid(), 'content.moderate')
    or private.admin_has_permission(auth.uid(), 'content.publish');
$$;

create or replace function public.media_admin_can_upload()
returns boolean language sql stable security definer set search_path = ''
as $$
  select
    private.admin_has_permission(auth.uid(), 'content.create')
    or private.admin_has_permission(auth.uid(), 'content.edit');
$$;

create or replace function public.media_admin_can_moderate()
returns boolean language sql stable security definer set search_path = ''
as $$
  select
    private.admin_has_permission(auth.uid(), 'content.moderate')
    or private.admin_has_permission(auth.uid(), 'content.publish');
$$;

create or replace function public.media_partner_is_contact(p_partner_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1
    from private.platform_b2b_partners p
    join auth.users u on u.id = auth.uid()
    where p.id = p_partner_id
      and p.status = 'active'
      and p.email is not null
      and u.email_confirmed_at is not null
      and lower(trim(p.email)) = lower(trim(u.email))
  );
$$;

revoke all on function public.media_admin_can_view() from public, anon;
revoke all on function public.media_admin_can_upload() from public, anon;
revoke all on function public.media_admin_can_moderate() from public, anon;
revoke all on function public.media_partner_is_contact(uuid) from public, anon;
grant execute on function public.media_admin_can_view() to authenticated;
grant execute on function public.media_admin_can_upload() to authenticated;
grant execute on function public.media_admin_can_moderate() to authenticated;
grant execute on function public.media_partner_is_contact(uuid) to authenticated;

alter table public.media_assets enable row level security;
grant select, insert, update, delete on public.media_assets to authenticated;
grant usage, select on sequence public.media_assets_code_seq to authenticated;

drop policy if exists media_assets_select on public.media_assets;
create policy media_assets_select on public.media_assets for select to authenticated
using (
  (approval_status = 'approved' and visibility = 'public')
  or uploader_auth_user_id = auth.uid()
  or public.media_admin_can_view()
  or (partner_id is not null and public.media_partner_is_contact(partner_id))
);

drop policy if exists media_assets_insert on public.media_assets;
create policy media_assets_insert on public.media_assets for insert to authenticated
with check (
  uploader_auth_user_id = auth.uid()
  and approval_status in ('draft', 'pending_review')
  and (
    (owner_type = 'platform' and partner_id is null and public.media_admin_can_upload())
    or (owner_type = 'partner' and partner_id is not null and public.media_partner_is_contact(partner_id))
  )
);

drop policy if exists media_assets_update on public.media_assets;
create policy media_assets_update on public.media_assets for update to authenticated
using (
  public.media_admin_can_moderate()
  or (
    uploader_auth_user_id = auth.uid()
    and (
      (owner_type = 'platform' and public.media_admin_can_upload())
      or (owner_type = 'partner' and partner_id is not null and public.media_partner_is_contact(partner_id))
    )
  )
)
with check (
  public.media_admin_can_moderate()
  or (
    uploader_auth_user_id = auth.uid()
    and approval_status in ('draft', 'pending_review', 'rejected')
    and (
      (owner_type = 'platform' and public.media_admin_can_upload())
      or (owner_type = 'partner' and partner_id is not null and public.media_partner_is_contact(partner_id))
    )
  )
);

drop policy if exists media_assets_delete on public.media_assets;
create policy media_assets_delete on public.media_assets for delete to authenticated
using (
  public.media_admin_can_moderate()
  or (
    uploader_auth_user_id = auth.uid()
    and approval_status in ('draft', 'rejected')
    and (
      (owner_type = 'platform' and public.media_admin_can_upload())
      or (owner_type = 'partner' and partner_id is not null and public.media_partner_is_contact(partner_id))
    )
  )
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'nekbaar-media', 'nekbaar-media', false, 52428800,
  array['video/mp4','video/webm','video/quicktime','video/x-m4v','image/jpeg','image/png','image/webp']
)
on conflict (id) do update
set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists nekbaar_media_upload on storage.objects;
create policy nekbaar_media_upload on storage.objects for insert to authenticated
with check (
  bucket_id = 'nekbaar-media'
  and (
    (name like ('platform/' || auth.uid()::text || '/%') and public.media_admin_can_upload())
    or (
      name ~ '^partners/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89aAbB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}/'
      and public.media_partner_is_contact(split_part(name, '/', 2)::uuid)
    )
  )
);

drop policy if exists nekbaar_media_read on storage.objects;
create policy nekbaar_media_read on storage.objects for select to authenticated
using (
  bucket_id = 'nekbaar-media'
  and exists (
    select 1 from public.media_assets m
    where m.storage_path = name
      and (
        (m.approval_status = 'approved' and m.visibility = 'public')
        or m.uploader_auth_user_id = auth.uid()
        or public.media_admin_can_view()
        or (m.partner_id is not null and public.media_partner_is_contact(m.partner_id))
      )
  )
);

drop policy if exists nekbaar_media_delete on storage.objects;
create policy nekbaar_media_delete on storage.objects for delete to authenticated
using (
  bucket_id = 'nekbaar-media'
  and exists (
    select 1 from public.media_assets m
    where m.storage_path = name
      and (
        public.media_admin_can_moderate()
        or (
          m.uploader_auth_user_id = auth.uid()
          and m.approval_status in ('draft', 'rejected')
          and (
            (m.owner_type = 'platform' and public.media_admin_can_upload())
            or (m.owner_type = 'partner' and m.partner_id is not null and public.media_partner_is_contact(m.partner_id))
          )
        )
      )
  )
);

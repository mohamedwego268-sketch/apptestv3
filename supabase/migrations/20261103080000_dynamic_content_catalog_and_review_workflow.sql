-- Dynamic, reviewed content catalog for Nekbaar.
-- Source-control migration only; not applied to production.

create table if not exists public.content_catalog (
  id uuid primary key default gen_random_uuid(),
  content_key text not null unique,
  title_ar text not null default '',
  title_en text not null default '',
  summary_ar text not null default '',
  summary_en text not null default '',
  body_ar text not null default '',
  body_en text not null default '',
  content_type text not null default 'tip' check (content_type in ('tip','activity','guide','article','video','audio','story','exercise')),
  topic text not null default 'general',
  audience text not null default 'family' check (audience in ('child','parent','family')),
  language text not null default 'both' check (language in ('ar','en','both')),
  age_min_months integer null check (age_min_months is null or age_min_months >= 0),
  age_max_months integer null check (age_max_months is null or age_max_months >= 0),
  tags text[] not null default '{}',
  interest_tags text[] not null default '{}',
  hobby_tags text[] not null default '{}',
  sport_tags text[] not null default '{}',
  safety_level text not null default 'general' check (safety_level in ('general','sensitive','medical')),
  review_status text not null default 'draft' check (review_status in ('draft','pending_review','approved','rejected','archived')),
  is_published boolean not null default false,
  is_featured boolean not null default false,
  sort_weight integer not null default 0,
  media_asset_id uuid null references public.media_assets(id) on delete set null,
  source_name text null,
  source_url text null check (source_url is null or source_url ~* '^https://'),
  cta_label_ar text not null default '',
  cta_label_en text not null default '',
  cta_target text null,
  review_notes text null,
  reviewed_by uuid null references auth.users(id) on delete set null,
  reviewed_at timestamptz null,
  published_at timestamptz null,
  expires_at timestamptz null,
  created_by uuid null references auth.users(id) on delete set null,
  updated_by uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint content_catalog_has_title check (length(trim(title_ar)) > 0 or length(trim(title_en)) > 0),
  constraint content_catalog_age_range check (age_min_months is null or age_max_months is null or age_max_months >= age_min_months),
  constraint content_catalog_publish_guard check (not is_published or (review_status = 'approved' and safety_level <> 'medical' and published_at is not null)),
  constraint content_catalog_expiry_guard check (expires_at is null or published_at is null or expires_at > published_at)
);

create index if not exists content_catalog_published_feed_idx
  on public.content_catalog (is_published, review_status, safety_level, language, published_at desc)
  where is_published = true and review_status = 'approved';
create index if not exists content_catalog_age_window_idx
  on public.content_catalog (age_min_months, age_max_months)
  where is_published = true and review_status = 'approved';
create index if not exists content_catalog_topic_idx
  on public.content_catalog (topic, audience, sort_weight desc);
create index if not exists content_catalog_media_idx
  on public.content_catalog (media_asset_id) where media_asset_id is not null;
create index if not exists content_catalog_tags_gin_idx on public.content_catalog using gin (tags);
create index if not exists content_catalog_interest_tags_gin_idx on public.content_catalog using gin (interest_tags);

create or replace function public.content_admin_can_publish()
returns boolean language sql stable security definer set search_path = ''
as $$ select private.admin_has_permission((select auth.uid()), 'content.publish'); $$;

create or replace function public.content_admin_can_moderate()
returns boolean language sql stable security definer set search_path = ''
as $$ select private.admin_has_permission((select auth.uid()), 'content.moderate'); $$;

create or replace function public.content_catalog_set_published(
  p_content_id uuid,
  p_is_published boolean
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_updated_id uuid;
begin
  if (select auth.uid()) is null
    or not private.admin_has_permission((select auth.uid()), 'content.publish') then
    raise exception 'ADMIN_PERMISSION_REQUIRED' using errcode = '42501';
  end if;

  if p_is_published is null then
    raise exception 'INVALID_PUBLISH_STATE' using errcode = '22023';
  end if;

  if p_is_published then
    update public.content_catalog
    set is_published = true,
        published_at = coalesce(published_at, now()),
        updated_by = (select auth.uid())
    where id = p_content_id
      and review_status = 'approved'
      and safety_level <> 'medical'
    returning id into v_updated_id;
  else
    update public.content_catalog
    set is_published = false,
        updated_by = (select auth.uid())
    where id = p_content_id
      and is_published = true
    returning id into v_updated_id;
  end if;

  if v_updated_id is null then
    raise exception 'CONTENT_NOT_READY_FOR_PUBLISH' using errcode = '22023';
  end if;

  return true;
end;
$$;

revoke all on function public.content_admin_can_publish() from public, anon;
revoke all on function public.content_admin_can_moderate() from public, anon;
revoke all on function public.content_catalog_set_published(uuid, boolean) from public, anon;
grant execute on function public.content_admin_can_publish() to authenticated;
grant execute on function public.content_admin_can_moderate() to authenticated;
grant execute on function public.content_catalog_set_published(uuid, boolean) to authenticated;

create or replace function public.content_admin_can_view()
returns boolean language sql stable security definer set search_path = ''
as $ select private.admin_has_permission((select auth.uid()), 'content.view'); $;

create or replace function public.content_admin_can_create()
returns boolean language sql stable security definer set search_path = ''
as $ select private.admin_has_permission((select auth.uid()), 'content.create') or private.admin_has_permission((select auth.uid()), 'content.edit'); $;

create or replace function public.content_admin_can_edit()
returns boolean language sql stable security definer set search_path = ''
as $ select private.admin_has_permission((select auth.uid()), 'content.edit'); $;

revoke all on function public.content_admin_can_view() from public, anon;
revoke all on function public.content_admin_can_create() from public, anon;
revoke all on function public.content_admin_can_edit() from public, anon;
grant execute on function public.content_admin_can_view() to authenticated;
grant execute on function public.content_admin_can_create() to authenticated;
grant execute on function public.content_admin_can_edit() to authenticated;

alter table public.content_catalog enable row level security;
grant select on public.content_catalog to anon, authenticated;
grant insert, update, delete on public.content_catalog to authenticated;

drop policy if exists content_catalog_public_read on public.content_catalog;
create policy content_catalog_public_read on public.content_catalog for select to anon
using (is_published = true and review_status = 'approved' and safety_level = 'general'
  and published_at <= now() and (expires_at is null or expires_at > now()));

drop policy if exists content_catalog_member_read on public.content_catalog;
create policy content_catalog_member_read on public.content_catalog for select to authenticated
using (is_published = true and review_status = 'approved' and safety_level in ('general','sensitive')
  and published_at <= now() and (expires_at is null or expires_at > now()));

drop policy if exists content_catalog_admin_read on public.content_catalog;
create policy content_catalog_admin_read on public.content_catalog for select to authenticated
using (public.content_admin_can_view() or public.content_admin_can_create() or public.content_admin_can_edit() or public.content_admin_can_moderate() or public.content_admin_can_publish());

drop policy if exists content_catalog_admin_insert on public.content_catalog;
create policy content_catalog_admin_insert on public.content_catalog for insert to authenticated
with check (public.content_admin_can_create() and created_by = (select auth.uid())
  and is_published = false and review_status in ('draft','pending_review'));

drop policy if exists content_catalog_admin_update on public.content_catalog;
create policy content_catalog_admin_update on public.content_catalog for update to authenticated
using (
  (public.content_admin_can_edit() and is_published = false)
  or public.content_admin_can_moderate()
)
with check (
  (is_published = false and (review_status <> 'approved' or public.content_admin_can_moderate()))
  or (is_published = true and review_status = 'approved' and safety_level <> 'medical' and public.content_admin_can_publish())
);

drop policy if exists content_catalog_admin_delete on public.content_catalog;
create policy content_catalog_admin_delete on public.content_catalog for delete to authenticated
using (is_published = false and public.content_admin_can_edit());

comment on table public.content_catalog is
  'Reviewed multilingual family content. Medical content is never exposed through public or member read policies.';
comment on column public.content_catalog.safety_level is
  'general is public; sensitive requires authentication; medical is admin-only and excluded from home recommendations.';
comment on column public.content_catalog.media_asset_id is
  'Optional link to the approved internal media library asset.';


-- Keep the existing append-only admin audit trail authoritative for content changes.
create or replace function private.audit_content_catalog_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_before jsonb;
  v_after jsonb;
  v_action text;
  v_row_id uuid;
  v_content_key text;
begin
  if tg_op = 'INSERT' then
    v_row_id := new.id;
    v_content_key := new.content_key;
    v_after := jsonb_build_object(
      'content_key', new.content_key,
      'title_ar', new.title_ar,
      'title_en', new.title_en,
      'content_type', new.content_type,
      'topic', new.topic,
      'audience', new.audience,
      'safety_level', new.safety_level,
      'review_status', new.review_status,
      'is_published', new.is_published
    );
    v_action := 'content.catalog.created';
  elsif tg_op = 'UPDATE' then
    v_row_id := new.id;
    v_content_key := new.content_key;
    v_before := jsonb_build_object(
      'content_key', old.content_key,
      'review_status', old.review_status,
      'is_published', old.is_published,
      'safety_level', old.safety_level,
      'audience', old.audience,
      'topic', old.topic,
      'media_asset_id', old.media_asset_id
    );
    v_after := jsonb_build_object(
      'content_key', new.content_key,
      'review_status', new.review_status,
      'is_published', new.is_published,
      'safety_level', new.safety_level,
      'audience', new.audience,
      'topic', new.topic,
      'media_asset_id', new.media_asset_id
    );
    if old.review_status is distinct from new.review_status then
      v_action := 'content.catalog.reviewed';
    elsif old.is_published is distinct from new.is_published then
      v_action := case when new.is_published then 'content.catalog.published' else 'content.catalog.unpublished' end;
    else
      v_action := 'content.catalog.updated';
    end if;
  else
    v_row_id := old.id;
    v_content_key := old.content_key;
    v_before := jsonb_build_object(
      'content_key', old.content_key,
      'review_status', old.review_status,
      'is_published', old.is_published,
      'safety_level', old.safety_level,
      'audience', old.audience,
      'topic', old.topic
    );
    v_action := 'content.catalog.deleted';
  end if;

  insert into private.admin_audit_logs (
    actor_auth_user_id,
    action_key,
    target_type,
    target_id,
    before_state,
    after_state,
    metadata
  ) values (
    (select auth.uid()),
    v_action,
    'content_catalog',
    v_row_id::text,
    v_before,
    v_after,
    jsonb_build_object('content_key', v_content_key)
  );

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

drop trigger if exists audit_content_catalog_change on public.content_catalog;
create trigger audit_content_catalog_change
after insert or update or delete on public.content_catalog
for each row execute function private.audit_content_catalog_change();


create or replace function public.content_catalog_touch_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function public.content_catalog_touch_updated_at() from public, anon;
grant execute on function public.content_catalog_touch_updated_at() to authenticated;

drop trigger if exists touch_content_catalog_updated_at on public.content_catalog;
create trigger touch_content_catalog_updated_at
before update on public.content_catalog
for each row execute function public.content_catalog_touch_updated_at();

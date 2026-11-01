-- Marketplace-first catalog management: products and services share one coded catalog.
alter table public.catalog_items
  add column if not exists service_duration_minutes integer,
  add column if not exists booking_required boolean not null default false,
  add column if not exists validity_days integer,
  add column if not exists listing_starts_at timestamptz,
  add column if not exists listing_ends_at timestamptz,
  add column if not exists fulfillment_mode text not null default 'shipping',
  add column if not exists provider_name text,
  add column if not exists marketplace_visible boolean not null default true;

do $$
begin
  if not exists (select 1 from pg_constraint where conname='catalog_items_service_duration_positive') then
    alter table public.catalog_items add constraint catalog_items_service_duration_positive
      check (service_duration_minutes is null or service_duration_minutes between 1 and 10080);
  end if;
  if not exists (select 1 from pg_constraint where conname='catalog_items_validity_days_positive') then
    alter table public.catalog_items add constraint catalog_items_validity_days_positive
      check (validity_days is null or validity_days between 1 and 3650);
  end if;
  if not exists (select 1 from pg_constraint where conname='catalog_items_fulfillment_mode_allowed') then
    alter table public.catalog_items add constraint catalog_items_fulfillment_mode_allowed
      check (fulfillment_mode in ('shipping','pickup','online','onsite','at_home','digital'));
  end if;
  if not exists (select 1 from pg_constraint where conname='catalog_items_listing_window_valid') then
    alter table public.catalog_items add constraint catalog_items_listing_window_valid
      check (listing_starts_at is null or listing_ends_at is null or listing_ends_at > listing_starts_at);
  end if;
end $$;

create index if not exists catalog_items_marketplace_visible_idx
  on public.catalog_items (is_active, marketplace_visible, item_type, updated_at desc);

create or replace function public.admin_get_catalog_directory(
  p_search text default null, p_limit integer default 25, p_offset integer default 0
)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare
  v_search text := nullif(trim(coalesce(p_search,'')),'');
  v_limit integer := greatest(1,least(coalesce(p_limit,25),100));
  v_offset integer := greatest(0,coalesce(p_offset,0));
  v_result jsonb;
begin
  if not private.admin_has_permission((select auth.uid()),'content.view') then
    raise exception 'ADMIN_PERMISSION_REQUIRED' using errcode='42501';
  end if;
  select jsonb_build_object(
    'total_count',(select count(*) from public.catalog_items c
      where v_search is null or c.title ilike '%'||v_search||'%' or c.name ilike '%'||v_search||'%'
        or c.name_en ilike '%'||v_search||'%' or c.code ilike '%'||v_search||'%'
        or c.category ilike '%'||v_search||'%' or c.country ilike '%'||v_search||'%'),
    'items',(select coalesce(jsonb_agg(to_jsonb(q) order by q.updated_at desc),'[]'::jsonb)
      from (
        select c.id,c.code,c.title,c.name,c.name_en,c.item_type,c.kind,c.description,c.category,c.category_label,
          c.country,c.city,c.price_egp,c.price_sar,c.is_active,c.is_sponsored,c.emoji,c.created_at,c.updated_at,
          c.service_duration_minutes,c.booking_required,c.validity_days,c.listing_starts_at,c.listing_ends_at,
          c.fulfillment_mode,c.provider_name,c.marketplace_visible
        from public.catalog_items c
        where v_search is null or c.title ilike '%'||v_search||'%' or c.name ilike '%'||v_search||'%'
          or c.name_en ilike '%'||v_search||'%' or c.code ilike '%'||v_search||'%'
          or c.category ilike '%'||v_search||'%' or c.country ilike '%'||v_search||'%'
        order by c.updated_at desc limit v_limit offset v_offset
      ) q)
  ) into v_result;
  return v_result;
end; $$;

create or replace function public.admin_save_catalog_item(
  p_id uuid default null, p_title text default '', p_name_en text default '',
  p_item_type text default 'product', p_category text default 'toys',
  p_category_label text default 'ألعاب وتنمية', p_description text default '',
  p_country text default 'ALL', p_city text default 'القاهرة',
  p_price_egp numeric default 0, p_price_sar numeric default 0,
  p_emoji text default '🧸', p_is_sponsored boolean default false,
  p_is_active boolean default true, p_duration_minutes integer default null,
  p_booking_required boolean default false, p_validity_days integer default null,
  p_listing_starts_at timestamptz default null, p_listing_ends_at timestamptz default null,
  p_fulfillment_mode text default 'shipping', p_provider_name text default null,
  p_marketplace_visible boolean default true
)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  v_actor uuid := auth.uid();
  v_before jsonb;
  v_item public.catalog_items%rowtype;
begin
  if p_id is null and not private.admin_has_permission(v_actor,'content.create') then
    raise exception 'ADMIN_PERMISSION_REQUIRED' using errcode='42501';
  end if;
  if p_id is not null and not private.admin_has_permission(v_actor,'content.edit') then
    raise exception 'ADMIN_PERMISSION_REQUIRED' using errcode='42501';
  end if;
  if coalesce(p_is_active,false) and coalesce(p_marketplace_visible,false)
     and not private.admin_has_permission(v_actor,'content.publish') then
    raise exception 'ADMIN_PERMISSION_REQUIRED' using errcode='42501';
  end if;
  if nullif(trim(coalesce(p_title,'')),'') is null then
    raise exception 'CATALOG_TITLE_REQUIRED' using errcode='22023';
  end if;
  if p_item_type not in ('product','service','digital_feature','game') then
    raise exception 'INVALID_CATALOG_ITEM_TYPE' using errcode='22023';
  end if;
  if coalesce(p_price_egp,0)<0 or coalesce(p_price_sar,0)<0 then
    raise exception 'CATALOG_PRICE_CANNOT_BE_NEGATIVE' using errcode='22023';
  end if;
  if p_duration_minutes is not null and (p_duration_minutes<1 or p_duration_minutes>10080) then
    raise exception 'INVALID_SERVICE_DURATION' using errcode='22023';
  end if;
  if p_validity_days is not null and (p_validity_days<1 or p_validity_days>3650) then
    raise exception 'INVALID_LISTING_VALIDITY' using errcode='22023';
  end if;
  if coalesce(p_fulfillment_mode,'shipping') not in ('shipping','pickup','online','onsite','at_home','digital') then
    raise exception 'INVALID_FULFILLMENT_MODE' using errcode='22023';
  end if;
  if p_listing_starts_at is not null and p_listing_ends_at is not null and p_listing_ends_at<=p_listing_starts_at then
    raise exception 'INVALID_LISTING_WINDOW' using errcode='22023';
  end if;

  if p_id is null then
    insert into public.catalog_items(
      title,name,name_en,item_type,kind,description,category,category_label,country,city,
      price,price_egp,price_sar,emoji,is_sponsored,is_active,service_duration_minutes,
      booking_required,validity_days,listing_starts_at,listing_ends_at,fulfillment_mode,
      provider_name,marketplace_visible
    ) values (
      trim(p_title),trim(p_title),coalesce(nullif(trim(p_name_en),''),trim(p_title)),
      p_item_type,p_item_type,nullif(trim(coalesce(p_description,'')),''),
      coalesce(nullif(trim(p_category),''),'toys'),
      coalesce(nullif(trim(p_category_label),''),'ألعاب وتنمية'),
      coalesce(nullif(trim(p_country),''),'ALL'),coalesce(nullif(trim(p_city),''),'القاهرة'),
      coalesce(p_price_egp,0),coalesce(p_price_egp,0),coalesce(p_price_sar,0),
      coalesce(nullif(trim(p_emoji),''),'🧸'),coalesce(p_is_sponsored,false),coalesce(p_is_active,true),
      case when p_item_type='service' then p_duration_minutes else null end,
      coalesce(p_booking_required,false),p_validity_days,p_listing_starts_at,p_listing_ends_at,
      coalesce(p_fulfillment_mode,'shipping'),nullif(trim(coalesce(p_provider_name,'')), ''),
      coalesce(p_marketplace_visible,true)
    ) returning * into v_item;
    insert into private.admin_audit_logs(actor_auth_user_id,action_key,target_type,target_id,after_state)
    values(v_actor,'catalog.created','catalog_item',v_item.id::text,
      jsonb_build_object('code',v_item.code,'title',v_item.title,'item_type',v_item.item_type,
        'marketplace_visible',v_item.marketplace_visible,'is_active',v_item.is_active));
  else
    select to_jsonb(c) into v_before from public.catalog_items c where c.id=p_id for update;
    if v_before is null then raise exception 'CATALOG_ITEM_NOT_FOUND' using errcode='P0002'; end if;
    update public.catalog_items set
      title=trim(p_title),name=trim(p_title),
      name_en=coalesce(nullif(trim(p_name_en),''),trim(p_title)),
      item_type=p_item_type,kind=p_item_type,
      description=nullif(trim(coalesce(p_description,'')),''),
      category=coalesce(nullif(trim(p_category),''),'toys'),
      category_label=coalesce(nullif(trim(p_category_label),''),'ألعاب وتنمية'),
      country=coalesce(nullif(trim(p_country),''),'ALL'),
      city=coalesce(nullif(trim(p_city),''),'القاهرة'),
      price=coalesce(p_price_egp,0),price_egp=coalesce(p_price_egp,0),price_sar=coalesce(p_price_sar,0),
      emoji=coalesce(nullif(trim(p_emoji),''),'🧸'),
      is_sponsored=coalesce(p_is_sponsored,false),is_active=coalesce(p_is_active,true),
      service_duration_minutes=case when p_item_type='service' then p_duration_minutes else null end,
      booking_required=coalesce(p_booking_required,false),validity_days=p_validity_days,
      listing_starts_at=p_listing_starts_at,listing_ends_at=p_listing_ends_at,
      fulfillment_mode=coalesce(p_fulfillment_mode,'shipping'),
      provider_name=nullif(trim(coalesce(p_provider_name,'')), ''),
      marketplace_visible=coalesce(p_marketplace_visible,true),updated_at=now()
    where id=p_id returning * into v_item;
    insert into private.admin_audit_logs(actor_auth_user_id,action_key,target_type,target_id,before_state,after_state)
    values(v_actor,'catalog.updated','catalog_item',v_item.id::text,v_before,
      jsonb_build_object('code',v_item.code,'title',v_item.title,'item_type',v_item.item_type,
        'marketplace_visible',v_item.marketplace_visible,'is_active',v_item.is_active));
  end if;
  return jsonb_build_object('id',v_item.id,'code',v_item.code,'title',v_item.title,
    'item_type',v_item.item_type,'is_active',v_item.is_active,
    'marketplace_visible',v_item.marketplace_visible,
    'service_duration_minutes',v_item.service_duration_minutes);
end; $$;

revoke all on function public.admin_get_catalog_directory(text,integer,integer) from public,anon;
grant execute on function public.admin_get_catalog_directory(text,integer,integer) to authenticated;
revoke all on function public.admin_save_catalog_item(uuid,text,text,text,text,text,text,text,text,numeric,numeric,text,boolean,boolean,integer,boolean,integer,timestamptz,timestamptz,text,text,boolean) from public,anon;
grant execute on function public.admin_save_catalog_item(uuid,text,text,text,text,text,text,text,text,numeric,numeric,text,boolean,boolean,integer,boolean,integer,timestamptz,timestamptz,text,text,boolean) to authenticated;

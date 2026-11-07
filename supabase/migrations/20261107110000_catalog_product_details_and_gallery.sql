-- Catalog product detail schema and permission-checked management RPCs.
alter table public.catalog_items
  add column if not exists brand text,
  add column if not exists age_range text,
  add column if not exists gallery_images text[] not null default '{}',
  add column if not exists variants text[] not null default '{}',
  add column if not exists specifications_ar text[] not null default '{}',
  add column if not exists specifications_en text[] not null default '{}';

alter table public.catalog_items
  drop constraint if exists catalog_items_gallery_images_limit,
  add constraint catalog_items_gallery_images_limit check (cardinality(gallery_images) <= 8),
  drop constraint if exists catalog_items_variants_limit,
  add constraint catalog_items_variants_limit check (cardinality(variants) <= 30),
  drop constraint if exists catalog_items_specifications_limit,
  add constraint catalog_items_specifications_limit
    check (cardinality(specifications_ar) <= 30 and cardinality(specifications_en) <= 30);

create or replace function public.admin_save_catalog_item_v2(
  p_id uuid default null,p_title text default '',p_name_en text default '',
  p_item_type text default 'product',p_category text default 'toys',
  p_category_label text default 'ألعاب وتنمية',p_description text default '',
  p_country text default 'ALL',p_city text default 'الرياض',
  p_price_egp numeric default 0,p_price_sar numeric default 0,p_emoji text default '🧸',
  p_is_sponsored boolean default false,p_is_active boolean default true,
  p_duration_minutes integer default null,p_booking_required boolean default false,
  p_validity_days integer default null,p_listing_starts_at timestamptz default null,
  p_listing_ends_at timestamptz default null,p_fulfillment_mode text default 'shipping',
  p_provider_name text default null,p_marketplace_visible boolean default true,
  p_brand text default null,p_age_range text default null,
  p_gallery_images text[] default '{}',p_variants text[] default '{}',
  p_specifications_ar text[] default '{}',p_specifications_en text[] default '{}'
)
returns jsonb language plpgsql security definer set search_path = ''
as $function$
declare
  v_actor uuid := auth.uid();
  v_before jsonb;
  v_item public.catalog_items%rowtype;
  v_gallery text[] := coalesce(p_gallery_images, '{}');
  v_variants text[] := coalesce(p_variants, '{}');
  v_specs_ar text[] := coalesce(p_specifications_ar, '{}');
  v_specs_en text[] := coalesce(p_specifications_en, '{}');
begin
  if p_id is null and not private.admin_has_permission(v_actor, 'content.create') then raise exception 'ADMIN_PERMISSION_REQUIRED' using errcode='42501'; end if;
  if p_id is not null and not private.admin_has_permission(v_actor, 'content.edit') then raise exception 'ADMIN_PERMISSION_REQUIRED' using errcode='42501'; end if;
  if coalesce(p_is_active,false) and coalesce(p_marketplace_visible,false) and not private.admin_has_permission(v_actor, 'content.publish') then raise exception 'ADMIN_PERMISSION_REQUIRED' using errcode='42501'; end if;
  if nullif(trim(coalesce(p_title,'')),'') is null then raise exception 'CATALOG_TITLE_REQUIRED' using errcode='22023'; end if;
  if p_item_type not in ('product','service','digital_feature','game') then raise exception 'INVALID_CATALOG_ITEM_TYPE' using errcode='22023'; end if;
  if coalesce(p_price_egp,0)<0 or coalesce(p_price_sar,0)<0 then raise exception 'CATALOG_PRICE_CANNOT_BE_NEGATIVE' using errcode='22023'; end if;
  if p_duration_minutes is not null and (p_duration_minutes<1 or p_duration_minutes>10080) then raise exception 'INVALID_SERVICE_DURATION' using errcode='22023'; end if;
  if p_validity_days is not null and (p_validity_days<1 or p_validity_days>3650) then raise exception 'INVALID_LISTING_VALIDITY' using errcode='22023'; end if;
  if coalesce(p_fulfillment_mode,'shipping') not in ('shipping','pickup','online','onsite','at_home','digital') then raise exception 'INVALID_FULFILLMENT_MODE' using errcode='22023'; end if;
  if p_listing_starts_at is not null and p_listing_ends_at is not null and p_listing_ends_at<=p_listing_starts_at then raise exception 'INVALID_LISTING_WINDOW' using errcode='22023'; end if;
  if cardinality(v_gallery)>8 or exists(select 1 from unnest(v_gallery) u where length(u)>2048 or u !~* '^https://') then raise exception 'INVALID_PRODUCT_GALLERY' using errcode='22023'; end if;
  if cardinality(v_variants)>30 or cardinality(v_specs_ar)>30 or cardinality(v_specs_en)>30 then raise exception 'CATALOG_DETAILS_LIMIT_EXCEEDED' using errcode='22023'; end if;
  if exists(select 1 from unnest(v_variants || v_specs_ar || v_specs_en) u where length(trim(u))>240) then raise exception 'CATALOG_DETAIL_TOO_LONG' using errcode='22023'; end if;
  if p_id is null then
    insert into public.catalog_items(title,name,name_en,item_type,kind,description,category,category_label,country,city,price,price_egp,price_sar,emoji,is_sponsored,is_active,service_duration_minutes,booking_required,validity_days,listing_starts_at,listing_ends_at,fulfillment_mode,provider_name,marketplace_visible,brand,age_range,gallery_images,variants,specifications_ar,specifications_en)
    values(trim(p_title),trim(p_title),coalesce(nullif(trim(p_name_en),''),trim(p_title)),p_item_type,p_item_type,nullif(trim(coalesce(p_description,'')),''),coalesce(nullif(trim(p_category),''),'toys'),coalesce(nullif(trim(p_category_label),''),'ألعاب وتنمية'),coalesce(nullif(trim(p_country),''),'ALL'),coalesce(nullif(trim(p_city),''),'الرياض'),coalesce(p_price_egp,0),coalesce(p_price_egp,0),coalesce(p_price_sar,0),coalesce(nullif(trim(p_emoji),''),'🧸'),coalesce(p_is_sponsored,false),coalesce(p_is_active,true),case when p_item_type='service' then p_duration_minutes else null end,coalesce(p_booking_required,false),p_validity_days,p_listing_starts_at,p_listing_ends_at,coalesce(p_fulfillment_mode,'shipping'),nullif(trim(coalesce(p_provider_name,'')),''),coalesce(p_marketplace_visible,true),nullif(trim(coalesce(p_brand,'')),''),nullif(trim(coalesce(p_age_range,'')),''),v_gallery,v_variants,v_specs_ar,v_specs_en)
    returning * into v_item;
    insert into private.admin_audit_logs(actor_auth_user_id,action_key,target_type,target_id,after_state)
    values(v_actor,'catalog.created','catalog_item',v_item.id::text,jsonb_build_object('code',v_item.code,'title',v_item.title,'item_type',v_item.item_type,'marketplace_visible',v_item.marketplace_visible,'is_active',v_item.is_active,'gallery_count',cardinality(v_item.gallery_images)));
  else
    select to_jsonb(c) into v_before from public.catalog_items c where c.id=p_id for update;
    if v_before is null then raise exception 'CATALOG_ITEM_NOT_FOUND' using errcode='P0002'; end if;
    update public.catalog_items set title=trim(p_title),name=trim(p_title),name_en=coalesce(nullif(trim(p_name_en),''),trim(p_title)),item_type=p_item_type,kind=p_item_type,description=nullif(trim(coalesce(p_description,'')),''),category=coalesce(nullif(trim(p_category),''),'toys'),category_label=coalesce(nullif(trim(p_category_label),''),'ألعاب وتنمية'),country=coalesce(nullif(trim(p_country),''),'ALL'),city=coalesce(nullif(trim(p_city),''),'الرياض'),price=coalesce(p_price_egp,0),price_egp=coalesce(p_price_egp,0),price_sar=coalesce(p_price_sar,0),emoji=coalesce(nullif(trim(p_emoji),''),'🧸'),is_sponsored=coalesce(p_is_sponsored,false),is_active=coalesce(p_is_active,true),service_duration_minutes=case when p_item_type='service' then p_duration_minutes else null end,booking_required=coalesce(p_booking_required,false),validity_days=p_validity_days,listing_starts_at=p_listing_starts_at,listing_ends_at=p_listing_ends_at,fulfillment_mode=coalesce(p_fulfillment_mode,'shipping'),provider_name=nullif(trim(coalesce(p_provider_name,'')),''),marketplace_visible=coalesce(p_marketplace_visible,true),brand=nullif(trim(coalesce(p_brand,'')),''),age_range=nullif(trim(coalesce(p_age_range,'')),''),gallery_images=v_gallery,variants=v_variants,specifications_ar=v_specs_ar,specifications_en=v_specs_en,updated_at=now()
    where id=p_id returning * into v_item;
    insert into private.admin_audit_logs(actor_auth_user_id,action_key,target_type,target_id,before_state,after_state)
    values(v_actor,'catalog.updated','catalog_item',v_item.id::text,v_before,jsonb_build_object('code',v_item.code,'title',v_item.title,'item_type',v_item.item_type,'marketplace_visible',v_item.marketplace_visible,'is_active',v_item.is_active,'gallery_count',cardinality(v_item.gallery_images)));
  end if;
  return jsonb_build_object('id',v_item.id,'code',v_item.code,'title',v_item.title,'item_type',v_item.item_type,'is_active',v_item.is_active,'marketplace_visible',v_item.marketplace_visible,'service_duration_minutes',v_item.service_duration_minutes,'gallery_count',cardinality(v_item.gallery_images));
end;
$function$;

revoke all on function public.admin_save_catalog_item_v2(uuid,text,text,text,text,text,text,text,text,numeric,numeric,text,boolean,boolean,integer,boolean,integer,timestamptz,timestamptz,text,text,boolean,text,text,text[],text[],text[],text[]) from public,anon;
grant execute on function public.admin_save_catalog_item_v2(uuid,text,text,text,text,text,text,text,text,numeric,numeric,text,boolean,boolean,integer,boolean,integer,timestamptz,timestamptz,text,text,boolean,text,text,text[],text[],text[],text[]) to authenticated;

create or replace function public.admin_get_catalog_directory(p_search text default null,p_limit integer default 25,p_offset integer default 0)
returns jsonb language plpgsql stable security definer set search_path = ''
as $function$
declare v_search text:=nullif(trim(coalesce(p_search,'')),''); v_limit integer:=greatest(1,least(coalesce(p_limit,25),100)); v_offset integer:=greatest(0,coalesce(p_offset,0)); v_result jsonb;
begin
 if not private.admin_has_permission((select auth.uid()),'content.view') then raise exception 'ADMIN_PERMISSION_REQUIRED' using errcode='42501'; end if;
 select jsonb_build_object(
  'total_count',(select count(*) from public.catalog_items c where v_search is null or c.title ilike '%'||v_search||'%' or c.name ilike '%'||v_search||'%' or c.name_en ilike '%'||v_search||'%' or c.code ilike '%'||v_search||'%' or c.category ilike '%'||v_search||'%' or c.country ilike '%'||v_search||'%'),
  'items',(select coalesce(jsonb_agg(to_jsonb(q) order by q.updated_at desc),'[]'::jsonb) from (
   select c.id,c.code,c.title,c.name,c.name_en,c.item_type,c.kind,c.description,c.category,c.category_label,c.country,c.city,c.price_egp,c.price_sar,c.is_active,c.is_sponsored,c.emoji,c.created_at,c.updated_at,c.service_duration_minutes,c.booking_required,c.validity_days,c.listing_starts_at,c.listing_ends_at,c.fulfillment_mode,c.provider_name,c.marketplace_visible,c.brand,c.age_range,c.gallery_images,c.variants,c.specifications_ar,c.specifications_en
   from public.catalog_items c where v_search is null or c.title ilike '%'||v_search||'%' or c.name ilike '%'||v_search||'%' or c.name_en ilike '%'||v_search||'%' or c.code ilike '%'||v_search||'%' or c.category ilike '%'||v_search||'%' or c.country ilike '%'||v_search||'%'
   order by c.updated_at desc limit v_limit offset v_offset
  ) q)
 ) into v_result;
 return v_result;
end;
$function$;
revoke all on function public.admin_get_catalog_directory(text,integer,integer) from public,anon;
grant execute on function public.admin_get_catalog_directory(text,integer,integer) to authenticated;

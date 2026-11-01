create or replace function public.admin_get_catalog_directory(p_search text default null,p_limit integer default 25,p_offset integer default 0)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare v_search text:=nullif(trim(coalesce(p_search,'')),''); v_limit integer:=greatest(1,least(coalesce(p_limit,25),100)); v_offset integer:=greatest(0,coalesce(p_offset,0)); v_result jsonb;
begin
 if auth.uid() is null or not exists(select 1 from private.platform_admins pa where pa.auth_user_id=(select auth.uid()) and pa.is_active=true and pa.role_key='super_admin') then raise exception 'ADMIN_ACCESS_REQUIRED' using errcode='42501'; end if;
 select jsonb_build_object('total_count',(select count(*) from public.catalog_items c where v_search is null or c.title ilike '%'||v_search||'%' or c.name ilike '%'||v_search||'%' or c.name_en ilike '%'||v_search||'%' or c.code ilike '%'||v_search||'%' or c.category ilike '%'||v_search||'%' or c.country ilike '%'||v_search||'%'),'items',(select coalesce(jsonb_agg(to_jsonb(q) order by q.updated_at desc),'[]'::jsonb) from (select c.id,c.code,c.title,c.name,c.name_en,c.item_type,c.kind,c.description,c.category,c.category_label,c.country,c.city,c.price_egp,c.price_sar,c.is_active,c.is_sponsored,c.emoji,c.created_at,c.updated_at from public.catalog_items c where v_search is null or c.title ilike '%'||v_search||'%' or c.name ilike '%'||v_search||'%' or c.name_en ilike '%'||v_search||'%' or c.code ilike '%'||v_search||'%' or c.category ilike '%'||v_search||'%' or c.country ilike '%'||v_search||'%' order by c.updated_at desc limit v_limit offset v_offset) q)) into v_result;
 return v_result;
end; $$;
revoke all on function public.admin_get_catalog_directory(text,integer,integer) from public,anon;
grant execute on function public.admin_get_catalog_directory(text,integer,integer) to authenticated;

create or replace function public.admin_save_catalog_item(p_id uuid default null,p_title text default '',p_name_en text default '',p_item_type text default 'product',p_category text default 'toys',p_category_label text default 'ألعاب وتنمية',p_description text default '',p_country text default 'ALL',p_city text default 'القاهرة',p_price_egp numeric default 0,p_price_sar numeric default 0,p_emoji text default '🧸',p_is_sponsored boolean default false,p_is_active boolean default true)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_actor uuid:=auth.uid(); v_before jsonb; v_item public.catalog_items%rowtype;
begin
 if v_actor is null or not exists(select 1 from private.platform_admins pa where pa.auth_user_id=v_actor and pa.is_active=true and pa.role_key='super_admin') then raise exception 'ADMIN_ACCESS_REQUIRED' using errcode='42501'; end if;
 if nullif(trim(coalesce(p_title,'')),'') is null then raise exception 'CATALOG_TITLE_REQUIRED' using errcode='22023'; end if;
 if p_item_type not in ('product','service','digital_feature','game') then raise exception 'INVALID_CATALOG_ITEM_TYPE' using errcode='22023'; end if;
 if coalesce(p_price_egp,0)<0 or coalesce(p_price_sar,0)<0 then raise exception 'CATALOG_PRICE_CANNOT_BE_NEGATIVE' using errcode='22023'; end if;
 if p_id is null then
  insert into public.catalog_items(title,name,name_en,item_type,kind,description,category,category_label,country,city,price,price_egp,price_sar,emoji,is_sponsored,is_active)
  values(trim(p_title),trim(p_title),coalesce(nullif(trim(p_name_en),''),trim(p_title)),p_item_type,p_item_type,nullif(trim(coalesce(p_description,'')),''),coalesce(nullif(trim(p_category),''),'toys'),coalesce(nullif(trim(p_category_label),''),'ألعاب وتنمية'),coalesce(nullif(trim(p_country),''),'ALL'),coalesce(nullif(trim(p_city),''),'القاهرة'),coalesce(p_price_egp,0),coalesce(p_price_egp,0),coalesce(p_price_sar,0),coalesce(nullif(trim(p_emoji),''),'🧸'),coalesce(p_is_sponsored,false),coalesce(p_is_active,true)) returning * into v_item;
  insert into private.admin_audit_logs(actor_auth_user_id,action_key,target_type,target_id,after_state) values(v_actor,'catalog.created','catalog_item',v_item.id::text,jsonb_build_object('code',v_item.code,'title',v_item.title,'item_type',v_item.item_type,'category',v_item.category,'country',v_item.country,'is_active',v_item.is_active));
 else
  select to_jsonb(c) into v_before from public.catalog_items c where c.id=p_id for update;
  if v_before is null then raise exception 'CATALOG_ITEM_NOT_FOUND' using errcode='P0002'; end if;
  update public.catalog_items set title=trim(p_title),name=trim(p_title),name_en=coalesce(nullif(trim(p_name_en),''),trim(p_title)),item_type=p_item_type,kind=p_item_type,description=nullif(trim(coalesce(p_description,'')),''),category=coalesce(nullif(trim(p_category),''),'toys'),category_label=coalesce(nullif(trim(p_category_label),''),'ألعاب وتنمية'),country=coalesce(nullif(trim(p_country),''),'ALL'),city=coalesce(nullif(trim(p_city),''),'القاهرة'),price=coalesce(p_price_egp,0),price_egp=coalesce(p_price_egp,0),price_sar=coalesce(p_price_sar,0),emoji=coalesce(nullif(trim(p_emoji),''),'🧸'),is_sponsored=coalesce(p_is_sponsored,false),is_active=coalesce(p_is_active,true),updated_at=now() where id=p_id returning * into v_item;
  insert into private.admin_audit_logs(actor_auth_user_id,action_key,target_type,target_id,before_state,after_state) values(v_actor,'catalog.updated','catalog_item',v_item.id::text,v_before,jsonb_build_object('code',v_item.code,'title',v_item.title,'item_type',v_item.item_type,'category',v_item.category,'country',v_item.country,'is_active',v_item.is_active));
 end if;
 return jsonb_build_object('id',v_item.id,'code',v_item.code,'title',v_item.title,'item_type',v_item.item_type,'is_active',v_item.is_active);
end; $$;
revoke all on function public.admin_save_catalog_item(uuid,text,text,text,text,text,text,text,text,numeric,numeric,text,boolean,boolean) from public,anon;
grant execute on function public.admin_save_catalog_item(uuid,text,text,text,text,text,text,text,text,numeric,numeric,text,boolean,boolean) to authenticated;

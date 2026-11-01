create or replace function public.admin_get_user_directory(p_search text default null,p_limit integer default 25,p_offset integer default 0)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare v_search text:=nullif(trim(coalesce(p_search,'')),''); v_limit integer:=greatest(1,least(coalesce(p_limit,25),100)); v_offset integer:=greatest(0,coalesce(p_offset,0)); v_result jsonb;
begin
 if auth.uid() is null or not exists(select 1 from private.platform_admins pa where pa.auth_user_id=(select auth.uid()) and pa.is_active=true and pa.role_key='super_admin') then raise exception 'ADMIN_ACCESS_REQUIRED' using errcode='42501'; end if;
 select jsonb_build_object(
  'total_count',(select count(*) from public.users u left join public.families f on f.id=u.family_id where v_search is null or u.full_name ilike '%'||v_search||'%' or coalesce(u.email,'') ilike '%'||v_search||'%' or coalesce(u.phone,'') ilike '%'||v_search||'%' or coalesce(u.country,'') ilike '%'||v_search||'%' or coalesce(f.family_name,'') ilike '%'||v_search||'%'),
  'items',(select coalesce(jsonb_agg(to_jsonb(q) order by q.created_at desc),'[]'::jsonb) from (select u.id,u.full_name as name,u.role,u.email,u.phone,u.country,u.verified,u.family_id,f.family_name as family_name,u.created_at,u.updated_at from public.users u left join public.families f on f.id=u.family_id where v_search is null or u.full_name ilike '%'||v_search||'%' or coalesce(u.email,'') ilike '%'||v_search||'%' or coalesce(u.phone,'') ilike '%'||v_search||'%' or coalesce(u.country,'') ilike '%'||v_search||'%' or coalesce(f.family_name,'') ilike '%'||v_search||'%' order by u.created_at desc limit v_limit offset v_offset) q)
 ) into v_result; return v_result;
end; $$;
revoke all on function public.admin_get_user_directory(text,integer,integer) from public,anon;
grant execute on function public.admin_get_user_directory(text,integer,integer) to authenticated;

create or replace function public.admin_get_family_directory(p_search text default null,p_limit integer default 25,p_offset integer default 0)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare v_search text:=nullif(trim(coalesce(p_search,'')),''); v_limit integer:=greatest(1,least(coalesce(p_limit,25),100)); v_offset integer:=greatest(0,coalesce(p_offset,0)); v_result jsonb;
begin
 if auth.uid() is null or not exists(select 1 from private.platform_admins pa where pa.auth_user_id=(select auth.uid()) and pa.is_active=true and pa.role_key='super_admin') then raise exception 'ADMIN_ACCESS_REQUIRED' using errcode='42501'; end if;
 select jsonb_build_object(
  'total_count',(select count(*) from public.families f where v_search is null or f.family_name ilike '%'||v_search||'%' or coalesce(f.city,'') ilike '%'||v_search||'%' or coalesce(f.country,'') ilike '%'||v_search||'%' or coalesce(f.currency,'') ilike '%'||v_search||'%'),
  'items',(select coalesce(jsonb_agg(to_jsonb(q) order by q.created_at desc),'[]'::jsonb) from (select f.id,f.family_name as name,f.country,f.city,f.currency,f.active_parent,f.created_at,f.updated_at,(select count(*) from public.users u where u.family_id=f.id) as members_count,(select count(*) from public.children c where c.family_id=f.id) as children_count,(select count(*) from public.co_parent_pairings cp where cp.family_id=f.id and cp.status='pending' and cp.expires_at>now()) as pending_invitations from public.families f where v_search is null or f.family_name ilike '%'||v_search||'%' or coalesce(f.city,'') ilike '%'||v_search||'%' or coalesce(f.country,'') ilike '%'||v_search||'%' or coalesce(f.currency,'') ilike '%'||v_search||'%' order by f.created_at desc limit v_limit offset v_offset) q)
 ) into v_result; return v_result;
end; $$;
revoke all on function public.admin_get_family_directory(text,integer,integer) from public,anon;
grant execute on function public.admin_get_family_directory(text,integer,integer) to authenticated;

create or replace function public.admin_get_audit_directory(p_search text default null,p_limit integer default 25,p_offset integer default 0)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare v_search text:=nullif(trim(coalesce(p_search,'')),''); v_limit integer:=greatest(1,least(coalesce(p_limit,25),100)); v_offset integer:=greatest(0,coalesce(p_offset,0)); v_result jsonb;
begin
 if auth.uid() is null or not exists(select 1 from private.platform_admins pa where pa.auth_user_id=(select auth.uid()) and pa.is_active=true and pa.role_key='super_admin') then raise exception 'ADMIN_ACCESS_REQUIRED' using errcode='42501'; end if;
 select jsonb_build_object('total_count',(select count(*) from private.admin_audit_logs a left join auth.users au on au.id=a.actor_auth_user_id where v_search is null or a.action_key ilike '%'||v_search||'%' or coalesce(a.target_type,'') ilike '%'||v_search||'%' or coalesce(a.target_id,'') ilike '%'||v_search||'%' or coalesce(au.email,'') ilike '%'||v_search||'%'),'items',(select coalesce(jsonb_agg(to_jsonb(q) order by q.created_at desc),'[]'::jsonb) from (select a.id,a.action_key as action,a.target_type,a.target_id,a.actor_auth_user_id,au.email as actor_email,a.created_at from private.admin_audit_logs a left join auth.users au on au.id=a.actor_auth_user_id where v_search is null or a.action_key ilike '%'||v_search||'%' or coalesce(a.target_type,'') ilike '%'||v_search||'%' or coalesce(a.target_id,'') ilike '%'||v_search||'%' or coalesce(au.email,'') ilike '%'||v_search||'%' order by a.created_at desc limit v_limit offset v_offset) q)) into v_result;
 return v_result;
end; $$;
revoke all on function public.admin_get_audit_directory(text,integer,integer) from public,anon;
grant execute on function public.admin_get_audit_directory(text,integer,integer) to authenticated;

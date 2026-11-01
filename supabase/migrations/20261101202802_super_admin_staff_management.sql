-- Super Admin workforce operations: add/update staff records with audited changes.
create sequence if not exists private.platform_staff_code_seq start 1;
revoke all on sequence private.platform_staff_code_seq from public,anon,authenticated;
grant usage,select on sequence private.platform_staff_code_seq to service_role;

create or replace function public.admin_save_staff(
  p_id uuid default null,p_full_name text default '',p_email text default '',
  p_department text default 'operations',p_job_title text default '',
  p_phone text default null,p_cohort text default 'first_50',
  p_employment_status text default 'planned',p_employee_code text default null
) returns jsonb language plpgsql security definer set search_path=''
as $$
declare v_actor uuid:=auth.uid(); v_code text; v_before jsonb; v_staff private.platform_staff%rowtype;
begin
  if v_actor is null or not exists(select 1 from private.platform_admins pa where pa.auth_user_id=v_actor and pa.is_active=true and pa.role_key='super_admin') then
    raise exception 'ADMIN_ACCESS_REQUIRED' using errcode='42501';
  end if;
  if nullif(trim(coalesce(p_full_name,'')),'') is null then raise exception 'EMPLOYEE_NAME_REQUIRED' using errcode='22023'; end if;
  if nullif(trim(coalesce(p_email,'')),'') is null or trim(p_email) !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$' then
    raise exception 'VALID_EMPLOYEE_EMAIL_REQUIRED' using errcode='22023';
  end if;
  if p_id is null then
    v_code:=coalesce(nullif(trim(coalesce(p_employee_code,'')),''),'NKB-'||lpad(nextval('private.platform_staff_code_seq')::text,4,'0'));
    insert into private.platform_staff(employee_code,full_name,email,phone,department,job_title,cohort,employment_status)
    values(v_code,trim(p_full_name),lower(trim(p_email)),nullif(trim(coalesce(p_phone,'')),''),p_department,trim(coalesce(p_job_title,'')),p_cohort,p_employment_status)
    returning * into v_staff;
    insert into private.admin_audit_logs(actor_auth_user_id,action_key,target_type,target_id,after_state)
    values(v_actor,'staff.created','platform_staff',v_staff.id::text,jsonb_build_object('employee_code',v_staff.employee_code,'full_name',v_staff.full_name,'email',v_staff.email,'department',v_staff.department,'job_title',v_staff.job_title,'employment_status',v_staff.employment_status,'cohort',v_staff.cohort));
  else
    select to_jsonb(s) into v_before from private.platform_staff s where s.id=p_id for update;
    if v_before is null then raise exception 'EMPLOYEE_NOT_FOUND' using errcode='P0002'; end if;
    update private.platform_staff set full_name=trim(p_full_name),email=lower(trim(p_email)),phone=nullif(trim(coalesce(p_phone,'')),''),department=p_department,job_title=trim(coalesce(p_job_title,'')),cohort=p_cohort,employment_status=p_employment_status,updated_at=now()
    where id=p_id returning * into v_staff;
    insert into private.admin_audit_logs(actor_auth_user_id,action_key,target_type,target_id,before_state,after_state)
    values(v_actor,'staff.updated','platform_staff',v_staff.id::text,v_before,jsonb_build_object('employee_code',v_staff.employee_code,'full_name',v_staff.full_name,'email',v_staff.email,'department',v_staff.department,'job_title',v_staff.job_title,'employment_status',v_staff.employment_status,'cohort',v_staff.cohort));
  end if;
  return jsonb_build_object('id',v_staff.id,'employee_code',v_staff.employee_code,'name',v_staff.full_name,'email',v_staff.email,'phone',v_staff.phone,'department',v_staff.department,'title',v_staff.job_title,'status',v_staff.employment_status,'cohort',v_staff.cohort);
end;
$$;
revoke all on function public.admin_save_staff(uuid,text,text,text,text,text,text,text,text) from public,anon;
grant execute on function public.admin_save_staff(uuid,text,text,text,text,text,text,text,text) to authenticated;

create or replace function public.admin_get_dashboard_snapshot(p_period_days integer default 30)
returns jsonb language plpgsql stable security definer set search_path=''
as $$
declare v_days integer:=greatest(7,least(coalesce(p_period_days,30),90)); v_result jsonb;
begin
  if auth.uid() is null or not exists(select 1 from private.platform_admins pa where pa.auth_user_id=(select auth.uid()) and pa.is_active=true and pa.role_key='super_admin') then
    raise exception 'ADMIN_ACCESS_REQUIRED' using errcode='42501';
  end if;
  select jsonb_build_object(
    'generated_at',now(),'period_days',v_days,
    'kpis',jsonb_build_object('users_total',(select count(*) from public.users),'families_total',(select count(*) from public.families),'children_total',(select count(*) from public.children),'child_records_total',(select count(*) from public.child_life_records),'pending_invitations',(select count(*) from public.co_parent_pairings where status='pending' and expires_at>now()),'catalog_active',(select count(*) from public.catalog_items where is_active=true),'new_users_period',(select count(*) from public.users where created_at>=now()-make_interval(days=>v_days)),'staff_total',(select count(*) from private.platform_staff where employment_status in ('active','on_leave')),'staff_planned',(select count(*) from private.platform_staff where employment_status in ('planned','invited'))),
    'signup_series',(select coalesce(jsonb_agg(jsonb_build_object('date',d::date,'count',coalesce(x.cnt,0)) order by d),'[]'::jsonb) from generate_series(current_date-(v_days-1),current_date,interval '1 day') d left join (select created_at::date as signup_date,count(*) as cnt from public.users where created_at>=current_date-(v_days-1) group by created_at::date) x on x.signup_date=d::date),
    'recent_users',(select coalesce(jsonb_agg(jsonb_build_object('id',u.id,'name',u.full_name,'role',u.role,'country',u.country,'created_at',u.created_at) order by u.created_at desc),'[]'::jsonb) from (select id,full_name,role,country,created_at from public.users order by created_at desc limit 8) u),
    'recent_families',(select coalesce(jsonb_agg(jsonb_build_object('id',f.id,'name',f.family_name,'country',f.country,'city',f.city,'created_at',f.created_at) order by f.created_at desc),'[]'::jsonb) from (select id,family_name,country,city,created_at from public.families order by created_at desc limit 8) f),
    'record_mix',(select coalesce(jsonb_agg(jsonb_build_object('type',r.record_type,'count',r.cnt) order by r.cnt desc),'[]'::jsonb) from (select record_type,count(*) cnt from public.child_life_records group by record_type order by count(*) desc limit 8) r),
    'recent_admin_events',(select coalesce(jsonb_agg(jsonb_build_object('id',a.id,'action',a.action_key,'target_type',a.target_type,'target_id',a.target_id,'created_at',a.created_at) order by a.created_at desc),'[]'::jsonb) from (select id,action_key,target_type,target_id,created_at from private.admin_audit_logs order by created_at desc limit 8) a),
    'staff_directory',(select coalesce(jsonb_agg(jsonb_build_object('id',s.id,'employee_code',s.employee_code,'name',s.full_name,'email',s.email,'phone',s.phone,'department',s.department,'title',s.job_title,'status',s.employment_status,'cohort',s.cohort) order by s.created_at desc),'[]'::jsonb) from (select id,employee_code,full_name,email,phone,department,job_title,employment_status,cohort,created_at from private.platform_staff order by created_at desc limit 50) s)
  ) into v_result;
  return v_result;
end;
$$;
revoke all on function public.admin_get_dashboard_snapshot(integer) from public,anon;
grant execute on function public.admin_get_dashboard_snapshot(integer) to authenticated;

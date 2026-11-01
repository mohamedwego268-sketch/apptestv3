-- Workforce hierarchy and verified existing-account linking.
create or replace function public.admin_get_staff_directory(
  p_search text default null, p_limit integer default 100, p_offset integer default 0
) returns jsonb language plpgsql stable security definer set search_path=''
as $$
declare v_result jsonb;
begin
  if auth.uid() is null or not exists (
    select 1 from private.platform_admins pa
    where pa.auth_user_id=(select auth.uid()) and pa.is_active=true and pa.role_key='super_admin'
  ) then raise exception 'ADMIN_ACCESS_REQUIRED' using errcode='42501'; end if;
  select jsonb_build_object(
    'total_count',(select count(*) from private.platform_staff s
      left join private.platform_staff m on m.id=s.manager_id
      where p_search is null or s.full_name ilike '%'||p_search||'%' or s.email ilike '%'||p_search||'%'
        or s.employee_code ilike '%'||p_search||'%' or s.department ilike '%'||p_search||'%'
        or coalesce(m.full_name,'') ilike '%'||p_search||'%'),
    'items',coalesce((select jsonb_agg(jsonb_build_object(
      'id',q.id,'employee_code',q.employee_code,'name',q.full_name,'email',q.email,'phone',q.phone,
      'department',q.department,'title',q.job_title,'status',q.employment_status,'cohort',q.cohort,
      'manager_id',q.manager_id,'manager_name',q.manager_name,'account_linked',q.auth_user_id is not null,
      'start_date',q.start_date,'created_at',q.created_at,'updated_at',q.updated_at
    ) order by q.created_at desc) from (
      select s.id,s.employee_code,s.full_name,s.email,s.phone,s.department,s.job_title,s.employment_status,
        s.cohort,s.manager_id,m.full_name manager_name,s.auth_user_id,s.start_date,s.created_at,s.updated_at
      from private.platform_staff s left join private.platform_staff m on m.id=s.manager_id
      where p_search is null or s.full_name ilike '%'||p_search||'%' or s.email ilike '%'||p_search||'%'
        or s.employee_code ilike '%'||p_search||'%' or s.department ilike '%'||p_search||'%'
        or coalesce(m.full_name,'') ilike '%'||p_search||'%'
      order by s.created_at desc limit greatest(1,least(coalesce(p_limit,100),100))
      offset greatest(coalesce(p_offset,0),0)
    ) q),'[]'::jsonb)
  ) into v_result;
  return v_result;
end;
$$;

create or replace function public.admin_save_staff_hierarchy(
  p_id uuid default null,p_full_name text default '',p_email text default '',
  p_department text default 'operations',p_job_title text default '',p_phone text default null,
  p_cohort text default 'first_50',p_employment_status text default 'planned',p_manager_id uuid default null
) returns jsonb language plpgsql security definer set search_path=''
as $$
declare
  v_actor uuid:=(select auth.uid()); v_auth_user_id uuid; v_code text; v_before jsonb;
  v_staff private.platform_staff%rowtype; v_manager_status text; v_cycle boolean:=false; v_linked_staff_id uuid;
begin
  if v_actor is null or not exists(select 1 from private.platform_admins pa
    where pa.auth_user_id=v_actor and pa.is_active=true and pa.role_key='super_admin') then
    raise exception 'ADMIN_ACCESS_REQUIRED' using errcode='42501';
  end if;
  if nullif(trim(coalesce(p_full_name,'')),'') is null then raise exception 'EMPLOYEE_NAME_REQUIRED' using errcode='22023'; end if;
  if nullif(trim(coalesce(p_email,'')),'') is null or trim(p_email) !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$' then
    raise exception 'VALID_EMPLOYEE_EMAIL_REQUIRED' using errcode='22023';
  end if;
  if p_department not in ('executive','operations','sales','marketing','customer_success','content','product','engineering','finance','hr') then
    raise exception 'INVALID_EMPLOYEE_DEPARTMENT' using errcode='22023';
  end if;
  if p_cohort not in ('first_50','next_150') then raise exception 'INVALID_EMPLOYEE_COHORT' using errcode='22023'; end if;
  if p_employment_status not in ('planned','invited','active','on_leave','inactive','terminated') then
    raise exception 'INVALID_EMPLOYMENT_STATUS' using errcode='22023';
  end if;
  if p_manager_id is not null then
    if p_id is not null and p_manager_id=p_id then raise exception 'EMPLOYEE_CANNOT_MANAGE_SELF' using errcode='22023'; end if;
    select s.employment_status into v_manager_status from private.platform_staff s where s.id=p_manager_id;
    if not found then raise exception 'MANAGER_NOT_FOUND' using errcode='P0002'; end if;
    if v_manager_status not in ('active','on_leave') then raise exception 'MANAGER_MUST_BE_ACTIVE' using errcode='22023'; end if;
    if p_id is not null then
      with recursive manager_chain(id,manager_id) as (
        select s.id,s.manager_id from private.platform_staff s where s.id=p_manager_id
        union all select s.id,s.manager_id from private.platform_staff s join manager_chain mc on s.id=mc.manager_id
      ) select exists(select 1 from manager_chain where id=p_id) into v_cycle;
      if v_cycle then raise exception 'MANAGER_CYCLE_NOT_ALLOWED' using errcode='22023'; end if;
    end if;
  end if;
  -- Match only an already verified Auth identity; never create an Auth user from this browser RPC.
  select u.id into v_auth_user_id from auth.users u
  where lower(u.email)=lower(trim(p_email)) and u.email_confirmed_at is not null
  order by u.created_at asc limit 1;
  if v_auth_user_id is not null then
    select s.id into v_linked_staff_id from private.platform_staff s
    where s.auth_user_id=v_auth_user_id and s.id is distinct from p_id;
    if v_linked_staff_id is not null then raise exception 'AUTH_USER_ALREADY_LINKED_TO_STAFF' using errcode='23505'; end if;
  end if;
  if p_id is null then
    v_code:='NKB-'||lpad(nextval('private.platform_staff_code_seq')::text,4,'0');
    insert into private.platform_staff(employee_code,auth_user_id,full_name,email,phone,department,job_title,cohort,employment_status,manager_id)
    values(v_code,v_auth_user_id,trim(p_full_name),lower(trim(p_email)),nullif(trim(coalesce(p_phone,'')),''),p_department,
      trim(coalesce(p_job_title,'')),p_cohort,p_employment_status,p_manager_id) returning * into v_staff;
    insert into private.admin_audit_logs(actor_auth_user_id,action_key,target_type,target_id,after_state)
    values(v_actor,'staff.created','platform_staff',v_staff.id::text,jsonb_build_object(
      'employee_code',v_staff.employee_code,'full_name',v_staff.full_name,'email',v_staff.email,
      'department',v_staff.department,'job_title',v_staff.job_title,'employment_status',v_staff.employment_status,
      'cohort',v_staff.cohort,'manager_id',v_staff.manager_id,'auth_user_linked',v_staff.auth_user_id is not null));
  else
    select to_jsonb(s) into v_before from private.platform_staff s where s.id=p_id for update;
    if v_before is null then raise exception 'EMPLOYEE_NOT_FOUND' using errcode='P0002'; end if;
    update private.platform_staff set auth_user_id=v_auth_user_id,full_name=trim(p_full_name),email=lower(trim(p_email)),
      phone=nullif(trim(coalesce(p_phone,'')),''),department=p_department,job_title=trim(coalesce(p_job_title,'')),
      cohort=p_cohort,employment_status=p_employment_status,manager_id=p_manager_id,updated_at=now()
    where id=p_id returning * into v_staff;
    insert into private.admin_audit_logs(actor_auth_user_id,action_key,target_type,target_id,before_state,after_state)
    values(v_actor,'staff.updated','platform_staff',v_staff.id::text,v_before,jsonb_build_object(
      'employee_code',v_staff.employee_code,'full_name',v_staff.full_name,'email',v_staff.email,
      'department',v_staff.department,'job_title',v_staff.job_title,'employment_status',v_staff.employment_status,
      'cohort',v_staff.cohort,'manager_id',v_staff.manager_id,'auth_user_linked',v_staff.auth_user_id is not null));
  end if;
  return jsonb_build_object('id',v_staff.id,'employee_code',v_staff.employee_code,'name',v_staff.full_name,
    'email',v_staff.email,'phone',v_staff.phone,'department',v_staff.department,'title',v_staff.job_title,
    'status',v_staff.employment_status,'cohort',v_staff.cohort,'manager_id',v_staff.manager_id,
    'account_linked',v_staff.auth_user_id is not null);
end;
$$;
revoke all on function public.admin_get_staff_directory(text,integer,integer) from public,anon;
grant execute on function public.admin_get_staff_directory(text,integer,integer) to authenticated;
revoke all on function public.admin_save_staff_hierarchy(uuid,text,text,text,text,text,text,text,uuid) from public,anon;
grant execute on function public.admin_save_staff_hierarchy(uuid,text,text,text,text,text,text,text,uuid) to authenticated;

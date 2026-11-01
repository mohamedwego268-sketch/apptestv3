-- Nekbaar Super Admin control center foundation (additive, Free-plan compatible).
-- Private staff directory, server-verified owner RPCs, dashboard analytics snapshot,
-- and append-only admin audit protection. Existing family data and RLS remain untouched.

create table if not exists private.platform_staff (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  employee_code text not null unique,
  full_name text not null,
  email text not null unique,
  phone text,
  department text not null check (department in ('executive','operations','sales','marketing','customer_success','content','product','engineering','finance','hr')),
  job_title text not null default '',
  employment_status text not null default 'planned' check (employment_status in ('planned','invited','active','on_leave','inactive','terminated')),
  manager_id uuid references private.platform_staff(id) on delete set null,
  cohort text not null default 'first_50' check (cohort in ('first_50','next_150')),
  start_date date,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata)='object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists platform_staff_department_status_idx on private.platform_staff(department,employment_status);
create index if not exists platform_staff_manager_idx on private.platform_staff(manager_id);
alter table private.platform_staff enable row level security;
revoke all on private.platform_staff from public,anon,authenticated;
grant select,insert,update,delete on private.platform_staff to service_role;

create or replace function private.prevent_admin_audit_mutation()
returns trigger language plpgsql security invoker set search_path=''
as $$
begin
  raise exception 'ADMIN_AUDIT_LOGS_ARE_APPEND_ONLY' using errcode='42501';
end;
$$;
revoke all on function private.prevent_admin_audit_mutation() from public,anon,authenticated;
drop trigger if exists trg_admin_audit_logs_append_only on private.admin_audit_logs;
create trigger trg_admin_audit_logs_append_only before update or delete on private.admin_audit_logs
for each row execute function private.prevent_admin_audit_mutation();

create or replace function public.admin_verify_session()
returns jsonb language plpgsql stable security definer set search_path=''
as $$
declare v_admin record;
begin
  if auth.uid() is null then return jsonb_build_object('authorized',false); end if;
  select pa.role_key,pa.is_active into v_admin from private.platform_admins pa
  where pa.auth_user_id=(select auth.uid()) and pa.is_active=true;
  if not found then return jsonb_build_object('authorized',false); end if;
  return jsonb_build_object('authorized',true,'role',v_admin.role_key);
end;
$$;
revoke all on function public.admin_verify_session() from public,anon;
grant execute on function public.admin_verify_session() to authenticated;

create or replace function public.admin_get_dashboard_snapshot(p_period_days integer default 30)
returns jsonb language plpgsql stable security definer set search_path=''
as $$
declare v_days integer := greatest(7,least(coalesce(p_period_days,30),90)); v_result jsonb;
begin
  if auth.uid() is null or not exists (
    select 1 from private.platform_admins pa where pa.auth_user_id=(select auth.uid())
    and pa.is_active=true and pa.role_key='super_admin'
  ) then raise exception 'ADMIN_ACCESS_REQUIRED' using errcode='42501'; end if;
  select jsonb_build_object(
    'generated_at',now(),'period_days',v_days,
    'kpis',jsonb_build_object(
      'users_total',(select count(*) from public.users),
      'families_total',(select count(*) from public.families),
      'children_total',(select count(*) from public.children),
      'child_records_total',(select count(*) from public.child_life_records),
      'pending_invitations',(select count(*) from public.co_parent_pairings where status='pending' and expires_at>now()),
      'catalog_active',(select count(*) from public.catalog_items where is_active=true),
      'new_users_period',(select count(*) from public.users where created_at >= now()-make_interval(days=>v_days)),
      'staff_total',(select count(*) from private.platform_staff where employment_status in ('active','on_leave')),
      'staff_planned',(select count(*) from private.platform_staff where employment_status in ('planned','invited'))
    ),
    'signup_series',(select coalesce(jsonb_agg(jsonb_build_object('date',d::date,'count',coalesce(x.cnt,0)) order by d),'[]'::jsonb)
      from generate_series(current_date-(v_days-1),current_date,interval '1 day') d
      left join (select created_at::date as signup_date,count(*) as cnt from public.users where created_at>=current_date-(v_days-1) group by created_at::date) x on x.signup_date=d::date),
    'recent_users',(select coalesce(jsonb_agg(jsonb_build_object('id',u.id,'name',u.full_name,'role',u.role,'country',u.country,'created_at',u.created_at) order by u.created_at desc),'[]'::jsonb)
      from (select id,full_name,role,country,created_at from public.users order by created_at desc limit 8) u),
    'recent_families',(select coalesce(jsonb_agg(jsonb_build_object('id',f.id,'name',f.family_name,'country',f.country,'city',f.city,'created_at',f.created_at) order by f.created_at desc),'[]'::jsonb)
      from (select id,family_name,country,city,created_at from public.families order by created_at desc limit 8) f),
    'record_mix',(select coalesce(jsonb_agg(jsonb_build_object('type',r.record_type,'count',r.cnt) order by r.cnt desc),'[]'::jsonb)
      from (select record_type,count(*) cnt from public.child_life_records group by record_type order by count(*) desc limit 8) r),
    'recent_admin_events',(select coalesce(jsonb_agg(jsonb_build_object('id',a.id,'action',a.action_key,'target_type',a.target_type,'target_id',a.target_id,'created_at',a.created_at) order by a.created_at desc),'[]'::jsonb)
      from (select id,action_key,target_type,target_id,created_at from private.admin_audit_logs order by created_at desc limit 8) a),
    'staff_directory',(select coalesce(jsonb_agg(jsonb_build_object('id',s.id,'employee_code',s.employee_code,'name',s.full_name,'department',s.department,'title',s.job_title,'status',s.employment_status,'cohort',s.cohort) order by s.created_at desc),'[]'::jsonb)
      from (select id,employee_code,full_name,department,job_title,employment_status,cohort,created_at from private.platform_staff order by created_at desc limit 12) s)
  ) into v_result;
  return v_result;
end;
$$;
revoke all on function public.admin_get_dashboard_snapshot(integer) from public,anon;
grant execute on function public.admin_get_dashboard_snapshot(integer) to authenticated;

create or replace function public.admin_get_analytics_snapshot(p_period_days integer default 30)
returns jsonb language plpgsql stable security definer set search_path=''
as $$
declare v_days integer:=greatest(7,least(coalesce(p_period_days,30),90)); v_result jsonb;
begin
  if auth.uid() is null or not exists(select 1 from private.platform_admins pa
    where pa.auth_user_id=(select auth.uid()) and pa.is_active=true and pa.role_key='super_admin') then
    raise exception 'ADMIN_ACCESS_REQUIRED' using errcode='42501';
  end if;
  select jsonb_build_object(
    'generated_at',now(),'period_days',v_days,
    'metrics',jsonb_build_object(
      'users_total',(select count(*) from public.users),
      'verified_users',(select count(*) from public.users where verified=true),
      'users_with_family',(select count(*) from public.users where family_id is not null),
      'families_total',(select count(*) from public.families),
      'families_with_children',(select count(distinct family_id) from public.children where family_id is not null),
      'families_with_records',(select count(distinct family_id) from public.child_life_records),
      'active_families_period',(select count(distinct family_id) from public.child_life_records where occurred_at>=now()-make_interval(days=>v_days)),
      'records_period',(select count(*) from public.child_life_records where occurred_at>=now()-make_interval(days=>v_days)),
      'invitations_total',(select count(*) from public.co_parent_pairings),
      'invitations_pending',(select count(*) from public.co_parent_pairings where status='pending' and expires_at>now()),
      'invitations_accepted',(select count(*) from public.co_parent_pairings where accepted_at is not null),
      'invitation_acceptance_rate',coalesce((select round(100.0*count(*) filter(where accepted_at is not null)/nullif(count(*),0),1) from public.co_parent_pairings),0)
    ),
    'country_mix',(select coalesce(jsonb_agg(jsonb_build_object('country',x.country,'count',x.count) order by x.count desc),'[]'::jsonb)
      from (select country,count(*) count from public.users group by country) x),
    'role_mix',(select coalesce(jsonb_agg(jsonb_build_object('role',coalesce(x.role,'unknown'),'count',x.count) order by x.count desc),'[]'::jsonb)
      from (select role,count(*) count from public.users group by role) x),
    'invitation_funnel',(select coalesce(jsonb_agg(jsonb_build_object('status',x.status,'count',x.count) order by x.count desc),'[]'::jsonb)
      from (select status,count(*) count from public.co_parent_pairings group by status) x),
    'activity_series',(select coalesce(jsonb_agg(jsonb_build_object('date',d::date,'count',coalesce(x.cnt,0)) order by d),'[]'::jsonb)
      from generate_series(current_date-(v_days-1),current_date,interval '1 day') d
      left join (select occurred_at::date activity_date,count(*) cnt from public.child_life_records
        where occurred_at>=current_date-(v_days-1) group by occurred_at::date) x on x.activity_date=d::date)
  ) into v_result;
  return v_result;
end;
$$;
revoke all on function public.admin_get_analytics_snapshot(integer) from public,anon;
grant execute on function public.admin_get_analytics_snapshot(integer) to authenticated;

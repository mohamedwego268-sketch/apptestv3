create or replace function public.admin_get_family_detail(p_family_id uuid)
returns jsonb language plpgsql stable security definer set search_path=''
as $$
declare v_result jsonb;
begin
  if auth.uid() is null or not exists(select 1 from private.platform_admins pa
    where pa.auth_user_id=(select auth.uid()) and pa.is_active=true and pa.role_key='super_admin') then
    raise exception 'ADMIN_ACCESS_REQUIRED' using errcode='42501';
  end if;
  select jsonb_build_object(
    'id',f.id,'name',f.family_name,'country',f.country,'city',f.city,'currency',f.currency,
    'active_parent',f.active_parent,'created_at',f.created_at,'updated_at',f.updated_at,
    'members',coalesce((select jsonb_agg(jsonb_build_object('id',u.id,'name',u.full_name,'role',u.role,
      'email',u.email,'phone',u.phone,'verified',u.verified,'created_at',u.created_at) order by u.created_at)
      from public.users u where u.family_id=f.id),'[]'::jsonb),
    'children',coalesce((select jsonb_agg(jsonb_build_object(
      'id',c.id,'name',c.name,'age_stage',c.age_stage,'gender',c.gender,'birth',c.birth,
      'interests',c.interests,'passions_or_heroes',c.passions_or_heroes,'emoji',c.emoji,
      'growth_height_cm',c.growth_height_cm,'growth_weight_kg',c.growth_weight_kg,
      'life_records_count',(select count(*) from public.child_life_records lr where lr.family_id=f.id and lr.child_id=c.id),
      'last_record_at',(select max(lr.occurred_at) from public.child_life_records lr where lr.family_id=f.id and lr.child_id=c.id)
    ) order by c.created_at) from public.children c where c.family_id=f.id),'[]'::jsonb),
    'invitations',coalesce((select jsonb_agg(jsonb_build_object(
      'id',cp.id,'partner_name',cp.partner_name,'partner_email',cp.partner_email,'partner_phone',cp.partner_phone,
      'partner_role',cp.partner_role,'method',cp.pairing_method,'status',cp.status,'verified',cp.verified,
      'expires_at',cp.expires_at,'accepted_at',cp.accepted_at,'invited_by_name',iu.full_name
    ) order by cp.linked_at desc) from public.co_parent_pairings cp
      left join public.users iu on iu.id=cp.invited_by_user_id where cp.family_id=f.id),'[]'::jsonb),
    'record_summary',coalesce((select jsonb_agg(jsonb_build_object('type',x.record_type,'count',x.record_count,
      'last_record_at',x.last_record_at) order by x.record_count desc) from (
      select lr.record_type,count(*) record_count,max(lr.occurred_at) last_record_at
      from public.child_life_records lr where lr.family_id=f.id group by lr.record_type
    ) x),'[]'::jsonb)
  ) into v_result from public.families f where f.id=p_family_id;
  if v_result is null then raise exception 'FAMILY_NOT_FOUND' using errcode='P0002'; end if;
  return v_result;
end;
$$;

create or replace function public.admin_get_user_detail(p_user_id uuid)
returns jsonb language plpgsql stable security definer set search_path=''
as $$
declare v_user jsonb; v_family_id uuid; v_family jsonb;
begin
  if auth.uid() is null or not exists(select 1 from private.platform_admins pa
    where pa.auth_user_id=(select auth.uid()) and pa.is_active=true and pa.role_key='super_admin') then
    raise exception 'ADMIN_ACCESS_REQUIRED' using errcode='42501';
  end if;
  select jsonb_build_object('id',u.id,'name',u.full_name,'role',u.role,'email',u.email,'phone',u.phone,
    'country',u.country,'verified',u.verified,'auth_linked',u.auth_user_id is not null,
    'created_at',u.created_at,'updated_at',u.updated_at),u.family_id
  into v_user,v_family_id from public.users u where u.id=p_user_id;
  if v_user is null then raise exception 'USER_NOT_FOUND' using errcode='P0002'; end if;
  if v_family_id is not null then v_family:=public.admin_get_family_detail(v_family_id); end if;
  return jsonb_build_object('user',v_user,'family',v_family);
end;
$$;

revoke all on function public.admin_get_family_detail(uuid) from public,anon;
grant execute on function public.admin_get_family_detail(uuid) to authenticated;
revoke all on function public.admin_get_user_detail(uuid) from public,anon;
grant execute on function public.admin_get_user_detail(uuid) to authenticated;

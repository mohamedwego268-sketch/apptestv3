alter table private.admin_roles drop constraint if exists admin_roles_role_key_check;
alter table private.admin_roles add constraint admin_roles_role_key_check check(role_key in ('super_admin','admin','manager','employee','content_admin','operations_admin','sales_manager','sales_rep','marketing_manager','marketing_specialist','finance_admin','support_agent'));
alter table private.platform_staff add column if not exists role_key text not null default 'employee';
alter table private.platform_staff add constraint platform_staff_role_key_fkey foreign key(role_key) references private.admin_roles(role_key) on update cascade;
alter table private.admin_user_permission_overrides drop constraint if exists admin_user_permission_overrides_auth_user_id_fkey;
alter table private.admin_user_permission_overrides add constraint admin_user_permission_overrides_auth_user_id_fkey foreign key(auth_user_id) references auth.users(id) on delete cascade;

insert into private.admin_roles(role_key,display_name,description,is_system) values
 ('admin','Administrator','Broad platform administration, excluding owner-only security and role control',true),
 ('manager','Manager','Department-level coordination and reporting',true),
 ('employee','Employee','Basic assigned operational access',true),
 ('sales_manager','Sales Manager','Manages B2B sales pipeline, partners and team performance',true),
 ('sales_rep','Sales Representative','Handles assigned B2B partners, products and orders',true),
 ('marketing_manager','Marketing Manager','Leads content, campaigns and marketing reporting',true),
 ('marketing_specialist','Marketing Specialist','Creates and updates assigned content',true),
 ('finance_admin','Finance Administrator','Manages commercial pricing, invoices and collections',true),
 ('support_agent','Customer Support','Handles permitted user and family support records',true)
on conflict(role_key) do update set display_name=excluded.display_name,description=excluded.description;

insert into private.admin_permissions(permission_key,area,action,description) values
 ('analytics.view','analytics','view','View platform analytics and operational metrics'),
 ('team.view','team','view','View staff directory and team structure'),
 ('team.manage','team','manage','Create and manage staff records and assignments'),
 ('store.view','store','view','View B2B store and commercial records'),
 ('store.partners.view','store.partners','view','View B2B suppliers and buyers'),
 ('store.partners.manage','store.partners','manage','Create and manage B2B business partners'),
 ('store.products.view','store.products','view','View wholesale product catalog'),
 ('store.products.manage','store.products','manage','Manage wholesale products and inventory'),
 ('store.orders.view','store.orders','view','View B2B orders and quotations'),
 ('store.orders.manage','store.orders','manage','Create and process B2B orders'),
 ('store.pricing.manage','store.pricing','manage','Manage wholesale pricing and quantity tiers'),
 ('store.invoices.view','store.invoices','view','View B2B invoices and receivables'),
 ('store.invoices.manage','store.invoices','manage','Manage invoices and record payments')
on conflict(permission_key) do update set area=excluded.area,action=excluded.action,description=excluded.description;

insert into private.admin_role_permissions(role_key,permission_key)
select x.role_key,x.permission_key from (values
 ('admin','dashboard.view'),('admin','analytics.view'),('admin','users.view'),('admin','families.view'),('admin','content.view'),('admin','store.view'),('admin','team.view'),('admin','reports.view'),('admin','audit_logs.view'),
 ('manager','dashboard.view'),('manager','reports.view'),('manager','team.view'),('employee','dashboard.view'),
 ('sales_manager','dashboard.view'),('sales_manager','analytics.view'),('sales_manager','reports.view'),('sales_manager','team.view'),('sales_manager','store.view'),('sales_manager','store.partners.view'),('sales_manager','store.partners.manage'),('sales_manager','store.products.view'),('sales_manager','store.orders.view'),('sales_manager','store.orders.manage'),('sales_manager','store.pricing.manage'),('sales_manager','store.invoices.view'),
 ('sales_rep','dashboard.view'),('sales_rep','store.view'),('sales_rep','store.partners.view'),('sales_rep','store.products.view'),('sales_rep','store.orders.view'),('sales_rep','store.orders.manage'),
 ('marketing_manager','dashboard.view'),('marketing_manager','analytics.view'),('marketing_manager','reports.view'),('marketing_manager','content.view'),('marketing_manager','content.create'),('marketing_manager','content.edit'),('marketing_manager','content.publish'),
 ('marketing_specialist','dashboard.view'),('marketing_specialist','content.view'),('marketing_specialist','content.create'),('marketing_specialist','content.edit'),
 ('finance_admin','dashboard.view'),('finance_admin','reports.view'),('finance_admin','store.view'),('finance_admin','store.orders.view'),('finance_admin','store.invoices.view'),('finance_admin','store.invoices.manage'),('finance_admin','store.pricing.manage'),
 ('support_agent','dashboard.view'),('support_agent','users.view'),('support_agent','families.view'),
 ('content_admin','content.publish'),('content_admin','content.moderate'),('operations_admin','team.view'),('operations_admin','audit_logs.view'),('operations_admin','analytics.view')
) x(role_key,permission_key) on conflict(role_key,permission_key) do nothing;

CREATE OR REPLACE FUNCTION private.admin_has_permission(p_auth_user_id uuid, p_permission_key text)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_role text;v_override text;
begin
 if p_auth_user_id is null or nullif(trim(p_permission_key),'') is null then return false; end if;
 if exists(select 1 from private.platform_admins pa where pa.auth_user_id=p_auth_user_id and pa.is_active=true and pa.role_key='super_admin') then return true; end if;
 select s.role_key into v_role from private.platform_staff s
 where s.auth_user_id=p_auth_user_id and s.employment_status='active';
 if v_role is null then return false; end if;
 select o.effect into v_override from private.admin_user_permission_overrides o
 where o.auth_user_id=p_auth_user_id and o.permission_key=p_permission_key;
 if v_override='deny' then return false; end if;
 if v_override='grant' then return true; end if;
 return exists(select 1 from private.admin_role_permissions rp where rp.role_key=v_role and rp.permission_key=p_permission_key);
end; $function$;
CREATE OR REPLACE FUNCTION public.admin_get_my_permissions()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_user uuid:=(select auth.uid());v_role text;v_name text;v_permissions jsonb;v_super boolean:=false;
begin
 if v_user is null then return jsonb_build_object('authorized',false,'permissions','[]'::jsonb); end if;
 select pa.role_key into v_role from private.platform_admins pa where pa.auth_user_id=v_user and pa.is_active=true;
 if found and v_role='super_admin' then
  v_super:=true;v_name:='Super Admin';
  select coalesce(jsonb_agg(permission_key order by permission_key),'[]'::jsonb) into v_permissions from private.admin_permissions;
  return jsonb_build_object('authorized',true,'is_super_admin',true,'role_key',v_role,'role_name',v_name,'permissions',v_permissions);
 end if;
 select s.role_key,r.display_name into v_role,v_name from private.platform_staff s join private.admin_roles r on r.role_key=s.role_key
 where s.auth_user_id=v_user and s.employment_status='active';
 if v_role is null then return jsonb_build_object('authorized',false,'permissions','[]'::jsonb); end if;
 select coalesce(jsonb_agg(p.permission_key order by p.permission_key),'[]'::jsonb) into v_permissions
 from private.admin_permissions p where private.admin_has_permission(v_user,p.permission_key);
 return jsonb_build_object('authorized',true,'is_super_admin',false,'role_key',v_role,'role_name',v_name,'permissions',v_permissions);
end; $function$;
CREATE OR REPLACE FUNCTION public.admin_get_rbac_snapshot()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v jsonb;
begin
 if auth.uid() is null or not exists(select 1 from private.platform_admins pa where pa.auth_user_id=(select auth.uid()) and pa.is_active=true and pa.role_key='super_admin') then raise exception 'ADMIN_ACCESS_REQUIRED' using errcode='42501'; end if;
 select jsonb_build_object(
  'roles',(select coalesce(jsonb_agg(jsonb_build_object('role_key',r.role_key,'display_name',r.display_name,'description',r.description,'is_system',r.is_system,'permission_keys',coalesce((select jsonb_agg(rp.permission_key order by rp.permission_key) from private.admin_role_permissions rp where rp.role_key=r.role_key),'[]'::jsonb)) order by r.role_key),'[]'::jsonb) from private.admin_roles r),
  'permissions',(select coalesce(jsonb_agg(jsonb_build_object('permission_key',p.permission_key,'area',p.area,'action',p.action,'description',p.description) order by p.area,p.action),'[]'::jsonb) from private.admin_permissions p),
  'staff',(select coalesce(jsonb_agg(jsonb_build_object('id',s.id,'employee_code',s.employee_code,'name',s.full_name,'email',s.email,'department',s.department,'status',s.employment_status,'role_key',s.role_key,'auth_user_id',s.auth_user_id,'account_linked',s.auth_user_id is not null) order by s.full_name),'[]'::jsonb) from private.platform_staff s),
  'overrides',(select coalesce(jsonb_agg(jsonb_build_object('auth_user_id',o.auth_user_id,'staff_id',s.id,'staff_name',s.full_name,'permission_key',o.permission_key,'effect',o.effect) order by s.full_name,o.permission_key),'[]'::jsonb) from private.admin_user_permission_overrides o left join private.platform_staff s on s.auth_user_id=o.auth_user_id)
 ) into v;
 return v;
end; $function$;
CREATE OR REPLACE FUNCTION public.admin_save_staff_role(p_staff_id uuid, p_role_key text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_before jsonb;v_after jsonb;v_actor uuid:=(select auth.uid());
begin
 if v_actor is null or not exists(select 1 from private.platform_admins pa where pa.auth_user_id=v_actor and pa.is_active=true and pa.role_key='super_admin') then raise exception 'ADMIN_ACCESS_REQUIRED' using errcode='42501'; end if;
 if p_role_key='super_admin' or not exists(select 1 from private.admin_roles where role_key=p_role_key) then raise exception 'INVALID_STAFF_ROLE' using errcode='22023'; end if;
 select jsonb_build_object('role_key',role_key) into v_before from private.platform_staff where id=p_staff_id for update;
 if v_before is null then raise exception 'STAFF_NOT_FOUND' using errcode='P0002'; end if;
 update private.platform_staff set role_key=p_role_key,updated_at=now() where id=p_staff_id;
 v_after:=jsonb_build_object('role_key',p_role_key);
 insert into private.admin_audit_logs(actor_auth_user_id,action_key,target_type,target_id,before_state,after_state)
 values(v_actor,'staff.role_assigned','platform_staff',p_staff_id::text,v_before,v_after);
 return true;
end; $function$;
CREATE OR REPLACE FUNCTION public.admin_save_role_permissions(p_role_key text, p_permission_keys text[])
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_actor uuid:=(select auth.uid());v_before jsonb;
begin
 if v_actor is null or not exists(select 1 from private.platform_admins pa where pa.auth_user_id=v_actor and pa.is_active=true and pa.role_key='super_admin') then raise exception 'ADMIN_ACCESS_REQUIRED' using errcode='42501'; end if;
 if p_role_key='super_admin' or not exists(select 1 from private.admin_roles where role_key=p_role_key) then raise exception 'INVALID_ROLE_KEY' using errcode='22023'; end if;
 if exists(select 1 from unnest(coalesce(p_permission_keys,'{}'::text[])) k where not exists(select 1 from private.admin_permissions p where p.permission_key=k)) then raise exception 'UNKNOWN_PERMISSION_KEY' using errcode='22023'; end if;
 select coalesce(jsonb_agg(permission_key order by permission_key),'[]'::jsonb) into v_before from private.admin_role_permissions where role_key=p_role_key;
 delete from private.admin_role_permissions where role_key=p_role_key;
 insert into private.admin_role_permissions(role_key,permission_key) select p_role_key,k from unnest(coalesce(p_permission_keys,'{}'::text[])) k on conflict do nothing;
 insert into private.admin_audit_logs(actor_auth_user_id,action_key,target_type,target_id,before_state,after_state)
 values(v_actor,'rbac.role_permissions_updated','admin_role',p_role_key,v_before,to_jsonb(coalesce(p_permission_keys,'{}'::text[])));
 return true;
end; $function$;
CREATE OR REPLACE FUNCTION public.admin_save_staff_permission_override(p_staff_id uuid, p_permission_key text, p_effect text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_actor uuid:=(select auth.uid());v_auth_user_id uuid;v_before jsonb;
begin
 if v_actor is null or not exists(select 1 from private.platform_admins pa where pa.auth_user_id=v_actor and pa.is_active=true and pa.role_key='super_admin') then raise exception 'ADMIN_ACCESS_REQUIRED' using errcode='42501'; end if;
 if not exists(select 1 from private.admin_permissions where permission_key=p_permission_key) then raise exception 'UNKNOWN_PERMISSION_KEY' using errcode='22023'; end if;
 select auth_user_id into v_auth_user_id from private.platform_staff where id=p_staff_id for update;
 if not found then raise exception 'STAFF_NOT_FOUND' using errcode='P0002'; end if;
 if v_auth_user_id is null then raise exception 'STAFF_ACCOUNT_NOT_LINKED' using errcode='22023'; end if;
 select jsonb_build_object('effect',effect) into v_before from private.admin_user_permission_overrides where auth_user_id=v_auth_user_id and permission_key=p_permission_key;
 if p_effect='inherit' then
  delete from private.admin_user_permission_overrides where auth_user_id=v_auth_user_id and permission_key=p_permission_key;
 elsif p_effect in ('grant','deny') then
  insert into private.admin_user_permission_overrides(auth_user_id,permission_key,effect,created_by) values(v_auth_user_id,p_permission_key,p_effect,v_actor)
  on conflict(auth_user_id,permission_key) do update set effect=excluded.effect,created_by=excluded.created_by,created_at=now();
 else raise exception 'INVALID_PERMISSION_OVERRIDE' using errcode='22023';
 end if;
 insert into private.admin_audit_logs(actor_auth_user_id,action_key,target_type,target_id,before_state,after_state)
 values(v_actor,'rbac.staff_permission_override','platform_staff',p_staff_id::text,v_before,jsonb_build_object('permission_key',p_permission_key,'effect',p_effect));
 return true;
end; $function$;

revoke all on function private.admin_has_permission(uuid,text) from public,anon,authenticated;
revoke all on function public.admin_get_my_permissions() from public,anon;
grant execute on function public.admin_get_my_permissions() to authenticated;
revoke all on function public.admin_get_rbac_snapshot() from public,anon;
grant execute on function public.admin_get_rbac_snapshot() to authenticated;
revoke all on function public.admin_save_staff_role(uuid,text) from public,anon;
grant execute on function public.admin_save_staff_role(uuid,text) to authenticated;
revoke all on function public.admin_save_role_permissions(text,text[]) from public,anon;
grant execute on function public.admin_save_role_permissions(text,text[]) to authenticated;
revoke all on function public.admin_save_staff_permission_override(uuid,text,text) from public,anon;
grant execute on function public.admin_save_staff_permission_override(uuid,text,text) to authenticated;

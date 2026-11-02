-- Partner membership is private; all tenant reads happen through an auth-checked RPC.
create table if not exists private.platform_b2b_partner_members (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references private.platform_b2b_partners(id) on delete cascade,
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  member_role text not null default 'owner' check (member_role in ('owner','manager','catalog_manager','orders_manager','finance_manager')),
  status text not null default 'active' check (status in ('active','suspended','revoked')),
  invited_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (partner_id, auth_user_id)
);
create index if not exists platform_b2b_partner_members_user_idx on private.platform_b2b_partner_members(auth_user_id,status);
alter table private.platform_b2b_partner_members enable row level security;
revoke all on private.platform_b2b_partner_members from public,anon,authenticated;

create or replace function private.vendor_get_b2b_portal_snapshot()
returns jsonb language plpgsql volatile security definer set search_path=''
as $function$
declare
  v_uid uuid := (select auth.uid());
  v_email text;
  v_confirmed_at timestamptz;
  v_partner_id uuid;
  v_member_role text;
  v_partner jsonb;
  v_products jsonb := '[]'::jsonb;
  v_orders jsonb := '[]'::jsonb;
  v_product_count integer := 0;
  v_active_products integer := 0;
  v_open_orders integer := 0;
  v_order_count integer := 0;
begin
  if v_uid is null then raise exception 'AUTHENTICATION_REQUIRED' using errcode='42501'; end if;
  select u.email,u.email_confirmed_at into v_email,v_confirmed_at from auth.users u where u.id=v_uid;
  if v_email is null or v_confirmed_at is null then raise exception 'VERIFIED_EMAIL_REQUIRED' using errcode='42501'; end if;

  select m.partner_id,m.member_role into v_partner_id,v_member_role
  from p...[truncated]
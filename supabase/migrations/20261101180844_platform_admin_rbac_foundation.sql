-- Nekbaar platform administration foundation (additive; no existing application tables altered)
-- Admin identity is intentionally NOT seeded here. The central Super Admin must be
-- provisioned later using the verified auth.users UUID of the owner's account.

create schema if not exists private;

create table if not exists private.admin_roles (
  role_key text primary key check (role_key in ('super_admin','content_admin','operations_admin')),
  display_name text not null,
  description text not null default '',
  is_system boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists private.admin_permissions (
  permission_key text primary key,
  area text not null,
  action text not null,
  description text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists private.admin_role_permissions (
  role_key text not null references private.admin_roles(role_key) on delete cascade,
  permission_key text not null references private.admin_permissions(permission_key) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (role_key, permission_key)
);

create table if not exists private.platform_admins (
  auth_user_id uuid primary key references auth.users(id) on delete restrict,
  role_key text not null references private.admin_roles(role_key) on delete restrict,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

-- Exactly one active central Super Admin at a time.
create unique index if not exists platform_admins_single_active_super_admin
  on private.platform_admins ((role_key))
  where role_key = 'super_admin' and is_active = true;

create table if not exists private.admin_user_permission_overrides (
  auth_user_id uuid not null references private.platform_admins(auth_user_id) on delete cascade,
  permission_key text not null references private.admin_permissions(permission_key) on delete cascade,
  effect text not null check (effect in ('grant','deny')),
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  primary key (auth_user_id, permission_key)
);

create table if not exists private.admin_audit_logs (
  id bigint generated always as identity primary key,
  actor_auth_user_id uuid,
  action_key text not null,
  target_type text,
  target_id text,
  before_state jsonb,
  after_state jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

insert into private.admin_roles (role_key, display_name, description)
values
  ('super_admin', 'Super Admin', 'Central platform owner with full administrative authority'),
  ('content_admin', 'Content Admin', 'Manages platform content within assigned permissions'),
  ('operations_admin', 'Operations Admin', 'Manages operational workflows within assigned permissions')
on conflict (role_key) do update
set display_name = excluded.display_name,
    description = excluded.description;

insert into private.admin_permissions (permission_key, area, action, description)
values
  ('dashboard.view','dashboard','view','View administrative overview'),
  ('users.view','users','view','View user account records'),
  ('users.edit','users','edit','Edit permitted user account fields'),
  ('users.suspend','users','suspend','Suspend or reactivate user accounts'),
  ('families.view','families','view','View family directory and limited metadata'),
  ('families.manage','families','manage','Perform approved family administration actions'),
  ('content.view','content','view','View platform content'),
  ('content.create','content','create','Create platform content'),
  ('content.edit','content','edit','Edit platform content'),
  ('content.publish','content','publish','Publish or unpublish platform content'),
  ('content.moderate','content','moderate','Review reported or moderated content'),
  ('reports.view','reports','view','View operational reports'),
  ('admins.view','admins','view','View administrative team'),
  ('admins.manage','admins','manage','Create and manage non-owner admin accounts'),
  ('roles.view','roles','view','View roles and permission definitions'),
  ('roles.manage','roles','manage','Manage role permission assignments'),
  ('audit_logs.view','audit_logs','view','View administrative audit events'),
  ('ai.settings.view','ai','view_settings','View AI service configuration'),
  ('ai.settings.manage','ai','manage_settings','Manage AI service configuration'),
  ('system.settings.view','system','view_settings','View platform settings'),
  ('system.settings.manage','system','manage_settings','Manage platform settings')
on conflict (permission_key) do update
set area = excluded.area,
    action = excluded.action,
    description = excluded.description;

-- Safe defaults: content admins do not publish by default; operations admins
-- receive read-oriented access. Super Admin is handled as a server-side bypass.
insert into private.admin_role_permissions (role_key, permission_key)
select 'content_admin', permission_key
from private.admin_permissions
where permission_key in ('dashboard.view','content.view','content.create','content.edit')
on conflict do nothing;

insert into private.admin_role_permissions (role_key, permission_key)
select 'operations_admin', permission_key
from private.admin_permissions
where permission_key in ('dashboard.view','users.view','families.view','reports.view','admins.view')
on conflict do nothing;

-- Private administration data is never directly exposed to browser roles.
alter table private.admin_roles enable row level security;
alter table private.admin_permissions enable row level security;
alter table private.admin_role_permissions enable row level security;
alter table private.platform_admins enable row level security;
alter table private.admin_user_permission_overrides enable row level security;
alter table private.admin_audit_logs enable row level security;

revoke all on schema private from public, anon, authenticated;
grant usage on schema private to service_role;

revoke all on all tables in schema private from public, anon, authenticated;
grant select, insert, update, delete on
  private.admin_roles,
  private.admin_permissions,
  private.admin_role_permissions,
  private.platform_admins,
  private.admin_user_permission_overrides,
  private.admin_audit_logs
to service_role;
grant usage, select on all sequences in schema private to service_role;

comment on table private.platform_admins is
  'Platform admin identities. The single active super_admin row is the central owner account; not seeded by migration.';
comment on table private.admin_user_permission_overrides is
  'Per-admin permission overrides. deny takes precedence over role defaults.';
comment on table private.admin_audit_logs is
  'Append-only administrative audit trail; writes are intended through trusted server-side operations only.';

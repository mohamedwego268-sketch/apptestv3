-- Add covering indexes for foreign keys introduced by the platform admin RBAC foundation.
create index if not exists idx_admin_role_permissions_permission_key
  on private.admin_role_permissions (permission_key);

create index if not exists idx_admin_user_permission_overrides_permission_key
  on private.admin_user_permission_overrides (permission_key);

create index if not exists idx_admin_user_permission_overrides_created_by
  on private.admin_user_permission_overrides (created_by);

create index if not exists idx_platform_admins_created_by
  on private.platform_admins (created_by);

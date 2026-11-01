-- Preserve execution of existing private helper functions used by public-table RLS policies.
-- Schema USAGE does not expose the schema through PostgREST; private remains unexposed.
grant usage on schema private to anon, authenticated, service_role;

-- Administrative tables remain inaccessible to browser roles by table grants and RLS.
revoke all on
  private.admin_roles,
  private.admin_permissions,
  private.admin_role_permissions,
  private.platform_admins,
  private.admin_user_permission_overrides,
  private.admin_audit_logs
from public, anon, authenticated;

grant select, insert, update, delete on
  private.admin_roles,
  private.admin_permissions,
  private.admin_role_permissions,
  private.platform_admins,
  private.admin_user_permission_overrides,
  private.admin_audit_logs
to service_role;

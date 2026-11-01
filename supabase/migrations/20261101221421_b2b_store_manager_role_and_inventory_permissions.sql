alter table private.admin_roles drop constraint if exists admin_roles_role_key_check;
alter table private.admin_roles add constraint admin_roles_role_key_check check(role_key = any(array[
 'super_admin','admin','content_admin','operations_admin','manager','employee','sales_manager','sales_rep',
 'marketing_manager','marketing_specialist','finance_admin','support_agent','store_manager'
]));
insert into private.admin_roles(role_key,display_name,description,is_system)
values('store_manager','Store Manager','Owns B2B partners, wholesale catalog, stock, orders, quotations and collections',true)
on conflict(role_key) do update set display_name=excluded.display_name,description=excluded.description;

insert into private.admin_permissions(permission_key,area,action,description) values
 ('store.inventory.view','store.inventory','view','View available, reserved and on-hand inventory'),
 ('store.inventory.manage','store.inventory','manage','Adjust inventory and manage stock reservation controls'),
 ('store.quotes.manage','store.quotes','manage','Create and manage B2B quotations'),
 ('store.payments.manage','store.payments','manage','Record and reconcile invoice payments')
on conflict(permission_key) do update set area=excluded.area,action=excluded.action,description=excluded.description;

insert into private.admin_role_permissions(role_key,permission_key) values
 ('store_manager','dashboard.view'),('store_manager','analytics.view'),('store_manager','reports.view'),
 ('store_manager','store.view'),('store_manager','store.partners.view'),('store_manager','store.partners.manage'),
 ('store_manager','store.products.view'),('store_manager','store.products.manage'),('store_manager','store.pricing.manage'),
 ('store_manager','store.inventory.view'),('store_manager','store.inventory.manage'),
 ('store_manager','store.orders.view'),('store_manager','store.orders.manage'),('store_manager','store.quotes.manage'),
 ('store_manager','store.invoices.view'),('store_manager','store.invoices.manage'),('store_manager','store.payments.manage')
on conflict(role_key,permission_key) do nothing;

insert into private.admin_role_permissions(role_key,permission_key) values
 ('sales_manager','store.quotes.manage'),('sales_manager','store.inventory.view'),
 ('sales_rep','store.quotes.manage'),
 ('finance_admin','store.payments.manage'),
 ('operations_admin','store.inventory.view'),('operations_admin','store.orders.view')
on conflict(role_key,permission_key) do nothing;

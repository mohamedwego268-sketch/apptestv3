create index if not exists platform_b2b_inventory_actor_idx on private.platform_b2b_inventory_movements(actor_auth_user_id);
create index if not exists platform_b2b_order_items_product_idx on private.platform_b2b_order_items(product_id);
create index if not exists platform_b2b_orders_created_by_idx on private.platform_b2b_orders(created_by);

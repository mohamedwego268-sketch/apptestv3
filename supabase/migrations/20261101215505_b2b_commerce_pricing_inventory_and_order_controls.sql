alter table private.platform_b2b_products
  add column if not exists price_tiers jsonb not null default '[]'::jsonb,
  add column if not exists reorder_level numeric not null default 0;
alter table private.platform_b2b_products
  add constraint platform_b2b_products_price_tiers_array_check check(jsonb_typeof(price_tiers)='array'),
  add constraint platform_b2b_products_reorder_level_check check(reorder_level>=0);

create table if not exists private.platform_b2b_product_price_tiers (
 id uuid primary key default gen_random_uuid(),
 product_id uuid not null references private.platform_b2b_products(id) on delete cascade,
 min_qty numeric not null check(min_qty>0),
 unit_price numeric not null check(unit_price>=0),
 created_at timestamptz not null default now(),
 unique(product_id,min_qty)
);
create index if not exists platform_b2b_price_tiers_product_idx on private.platform_b2b_product_price_tiers(product_id,min_qty);
create table if not exists private.platform_b2b_inventory_movements (
 id bigint generated always as identity primary key,
 product_id uuid not null references private.platform_b2b_products(id) on delete restrict,
 movement_type text not null check(movement_type in ('opening','purchase','sale','return','adjustment','reservation','release')),
 quantity_delta numeric not null,
 reference text not null default '',
 notes text not null default '',
 actor_auth_user_id uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default now()
);
create index if not exists platform_b2b_inventory_product_time_idx on private.platform_b2b_inventory_movements(product_id,created_at desc);

create or replace function public.admin_save_b2b_product_v2(
 p_id uuid default null,p_partner_id uuid default null,p_name_ar text default '',p_name_en text default '',
 p_description text default null,p_category text default 'general',p_unit text default 'piece',
 p_min_order_qty numeric default 1,p_cost_price numeric default 0,p_wholesale_price numeric default 0,
 p_retail_price numeric default 0,p_currency text default 'SAR',p_tax_rate numeric default 15,
 p_stock_qty numeric default null,p_country text default 'SA',p_city text default null,
 p_status text default 'draft',p_price_tiers jsonb default '[]'::jsonb,p_reorder_level numeric default 0
) returns jsonb language plpgsql security definer set search_path=''
as $$
declare
 v_actor uuid:=(select auth.uid()); v_product private.platform_b2b_products%rowtype;
 v_before jsonb; v_sku text; v_old_stock numeric; v_delta numeric; v_type text;
begin
 if v_actor is null or not exists(select 1 from private.platform_admins pa where pa.auth_user_id=v_actor and pa.is_active=true and pa.role_key='super_admin') then
  raise exception 'ADMIN_ACCESS_REQUIRED' using errcode='42501';
 end if;
 if nullif(trim(coalesce(p_name_ar,'')),'') is null then raise exception 'B2B_PRODUCT_NAME_REQUIRED' using errcode='22023'; end if;
 if p_status not in ('draft','active','out_of_stock','discontinued') then raise exception 'INVALID_B2B_PRODUCT_STATUS' using errcode='22023'; end if;
 if coalesce(p_min_order_qty,0)<=0 or coalesce(p_cost_price,0)<0 or coalesce(p_wholesale_price,0)<0 or coalesce(p_retail_price,0)<0 or coalesce(p_tax_rate,0)<0 or coalesce(p_tax_rate,0)>100 or coalesce(p_reorder_level,0)<0 or (p_stock_qty is not null and p_stock_qty<0) then
  raise exception 'INVALID_B2B_PRODUCT_PRICING_OR_STOCK' using errcode='22023';
 end if;
 if jsonb_typeof(coalesce(p_price_tiers,'[]'::jsonb))<>'array' then raise exception 'INVALID_B2B_PRICE_TIERS' using errcode='22023'; end if;
 if exists(select 1 from jsonb_array_elements(coalesce(p_price_tiers,'[]'::jsonb)) t
   where coalesce((t->>'min_qty')::numeric,0)<=0 or coalesce((t->>'unit_price')::numeric,-1)<0) then
  raise exception 'INVALID_B2B_PRICE_TIER_VALUES' using errcode='22023';
 end if;
 if p_partner_id is not null and not exists(select 1 from private.platform_b2b_partners where id=p_partner_id and status<>'archived') then raise exception 'B2B_PARTNER_NOT_FOUND' using errcode='P0002'; end if;
 if p_id is null then
  v_sku:='B2B-'||lpad(nextval('private.platform_b2b_sku_seq')::text,6,'0');
  insert into private.platform_b2b_products(sku,partner_id,name_ar,name_en,description,category,unit,min_order_qty,cost_price,wholesale_price,retail_price,currency,tax_rate,stock_qty,country,city,status,price_tiers,reorder_level)
  values(v_sku,p_partner_id,trim(p_name_ar),trim(coalesce(p_name_en,'')),nullif(trim(coalesce(p_description,'')),''),coalesce(nullif(trim(p_category),''),'general'),coalesce(nullif(trim(p_unit),''),'piece'),p_min_order_qty,p_cost_price,p_wholesale_price,p_retail_price,coalesce(nullif(trim(p_currency),''),'SAR'),p_tax_rate,p_stock_qty,coalesce(nullif(trim(p_country),''),'SA'),nullif(trim(coalesce(p_city,'')),''),p_status,coalesce(p_price_tiers,'[]'::jsonb),coalesce(p_reorder_level,0))
  returning * into v_product;
  if p_stock_qty is not null then
   insert into private.platform_b2b_inventory_movements(product_id,movement_type,quantity_delta,reference,notes,actor_auth_user_id)
   values(v_product.id,'opening',p_stock_qty,'OPENING','Opening stock balance',v_actor);
  end if;
  insert into private.admin_audit_logs(actor_auth_user_id,action_key,target_type,target_id,after_state)
  values(v_actor,'b2b.product.created','b2b_product',v_product.id::text,jsonb_build_object('sku',v_product.sku,'name',v_product.name_ar,'partner_id',v_product.partner_id,'status',v_product.status,'price_tiers',v_product.price_tiers));
 else
  select to_jsonb(p),p.stock_qty into v_before,v_old_stock from private.platform_b2b_products p where p.id=p_id for update;
  if v_before is null then raise exception 'B2B_PRODUCT_NOT_FOUND' using errcode='P0002'; end if;
  update private.platform_b2b_products set partner_id=p_partner_id,name_ar=trim(p_name_ar),name_en=trim(coalesce(p_name_en,'')),description=nullif(trim(coalesce(p_description,'')),''),category=coalesce(nullif(trim(p_category),''),'general'),unit=coalesce(nullif(trim(p_unit),''),'piece'),min_order_qty=p_min_order_qty,cost_price=p_cost_price,wholesale_price=p_wholesale_price,retail_price=p_retail_price,currency=coalesce(nullif(trim(p_currency),''),'SAR'),tax_rate=p_tax_rate,stock_qty=p_stock_qty,country=coalesce(nullif(trim(p_country),''),'SA'),city=nullif(trim(coalesce(p_city,'')),''),status=p_status,price_tiers=coalesce(p_price_tiers,'[]'::jsonb),reorder_level=coalesce(p_reorder_level,0),updated_at=now()
  where id=p_id returning * into v_product;
  if v_old_stock is distinct from p_stock_qty then
   if v_old_stock is null then v_type:='opening';v_delta:=coalesce(p_stock_qty,0);
   elsif p_stock_qty is null then v_type:='adjustment';v_delta:=0;
   else v_type:='adjustment';v_delta:=p_stock_qty-v_old_stock; end if;
   insert into private.platform_b2b_inventory_movements(product_id,movement_type,quantity_delta,reference,notes,actor_auth_user_id)
   values(v_product.id,v_type,v_delta,'ADMIN_STOCK_UPDATE',case when p_stock_qty is null then 'Stock tracking disabled' else 'Admin stock balance adjustment' end,v_actor);
  end if;
  insert into private.admin_audit_logs(actor_auth_user_id,action_key,target_type,target_id,before_state,after_state)
  values(v_actor,'b2b.product.updated','b2b_product',v_product.id::text,v_before,jsonb_build_object('sku',v_product.sku,'name',v_product.name_ar,'partner_id',v_product.partner_id,'status',v_product.status,'price_tiers',v_product.price_tiers));
 end if;
 delete from private.platform_b2b_product_price_tiers where product_id=v_product.id;
 insert into private.platform_b2b_product_price_tiers(product_id,min_qty,unit_price)
 select v_product.id,(t->>'min_qty')::numeric,(t->>'unit_price')::numeric from jsonb_array_elements(coalesce(p_price_tiers,'[]'::jsonb)) t;
 return jsonb_build_object('id',v_product.id,'sku',v_product.sku,'name',v_product.name_ar,'status',v_product.status,'price_tiers',v_product.price_tiers);
end; $$;

create or replace function public.admin_update_b2b_document_status(p_entity text,p_id uuid,p_status text,p_note text default null)
returns boolean language plpgsql security definer set search_path=''
as $$
declare v_actor uuid:=(select auth.uid()); v_before jsonb; v_target text;
begin
 if v_actor is null or not exists(select 1 from private.platform_admins pa where pa.auth_user_id=v_actor and pa.is_active=true and pa.role_key='super_admin') then raise exception 'ADMIN_ACCESS_REQUIRED' using errcode='42501'; end if;
 if p_entity='order' then
  if p_status not in ('inquiry','quote_sent','approved','processing','shipped','delivered','cancelled') then raise exception 'INVALID_B2B_ORDER_STATUS' using errcode='22023'; end if;
  select to_jsonb(o) into v_before from private.platform_b2b_orders o where o.id=p_id for update;
  if v_before is null then raise exception 'B2B_ORDER_NOT_FOUND' using errcode='P0002'; end if;
  update private.platform_b2b_orders set status=p_status,notes=concat_ws(E'\n',notes,nullif(trim(coalesce(p_note,'')),'')),updated_at=now() where id=p_id;
  v_target:='b2b_order';
 elsif p_entity='quote' then
  if p_status not in ('draft','sent','accepted','rejected','expired') then raise exception 'INVALID_B2B_QUOTE_STATUS' using errcode='22023'; end if;
  select to_jsonb(q) into v_before from private.platform_b2b_quotes q where q.id=p_id for update;
  if v_before is null then raise exception 'B2B_QUOTE_NOT_FOUND' using errcode='P0002'; end if;
  update private.platform_b2b_quotes set status=p_status,updated_at=now() where id=p_id;
  v_target:='b2b_quote';
 elsif p_entity='invoice' then
  if p_status not in ('draft','issued','partially_paid','paid','overdue','void') then raise exception 'INVALID_B2B_INVOICE_STATUS' using errcode='22023'; end if;
  select to_jsonb(i) into v_before from private.platform_b2b_invoices i where i.id=p_id for update;
  if v_before is null then raise exception 'B2B_INVOICE_NOT_FOUND' using errcode='P0002'; end if;
  update private.platform_b2b_invoices set status=p_status,issued_at=case when p_status='issued' then coalesce(issued_at,now()) else issued_at end,updated_at=now() where id=p_id;
  v_target:='b2b_invoice';
 else raise exception 'INVALID_B2B_ENTITY' using errcode='22023';
 end if;
 insert into private.admin_audit_logs(actor_auth_user_id,action_key,target_type,target_id,before_state,after_state,metadata)
 values(v_actor,'b2b.'||p_entity||'.status_updated',v_target,p_id::text,v_before,jsonb_build_object('status',p_status),jsonb_build_object('note',nullif(trim(coalesce(p_note,'')),'')));
 return true;
end; $$;

create or replace function public.admin_record_b2b_invoice_payment(p_invoice_id uuid,p_amount numeric,p_note text default null)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare v_actor uuid:=(select auth.uid()); v_invoice private.platform_b2b_invoices%rowtype; v_new_paid numeric;
begin
 if v_actor is null or not exists(select 1 from private.platform_admins pa where pa.auth_user_id=v_actor and pa.is_active=true and pa.role_key='super_admin') then raise exception 'ADMIN_ACCESS_REQUIRED' using errcode='42501'; end if;
 if p_amount is null or p_amount<=0 then raise exception 'INVALID_PAYMENT_AMOUNT' using errcode='22023'; end if;
 select * into v_invoice from private.platform_b2b_invoices where id=p_invoice_id for update;
 if not found then raise exception 'B2B_INVOICE_NOT_FOUND' using errcode='P0002'; end if;
 if v_invoice.status in ('draft','void') then raise exception 'INVOICE_NOT_PAYABLE' using errcode='22023'; end if;
 v_new_paid:=v_invoice.amount_paid+p_amount;
 if v_new_paid>v_invoice.total then raise exception 'PAYMENT_EXCEEDS_BALANCE' using errcode='22023'; end if;
 update private.platform_b2b_invoices set amount_paid=v_new_paid,status=case when v_new_paid=v_invoice.total then 'paid' else 'partially_paid' end,updated_at=now() where id=p_invoice_id;
 insert into private.admin_audit_logs(actor_auth_user_id,action_key,target_type,target_id,before_state,after_state,metadata)
 values(v_actor,'b2b.invoice.payment_recorded','b2b_invoice',p_invoice_id::text,jsonb_build_object('amount_paid',v_invoice.amount_paid),jsonb_build_object('amount_paid',v_new_paid),jsonb_build_object('payment_amount',p_amount,'note',nullif(trim(coalesce(p_note,'')),'')));
 return jsonb_build_object('invoice_id',p_invoice_id,'amount_paid',v_new_paid,'balance_due',v_invoice.total-v_new_paid,'status',case when v_new_paid=v_invoice.total then 'paid' else 'partially_paid' end);
end; $$;

create or replace function public.admin_get_b2b_product_inventory_history(p_product_id uuid,p_limit integer default 20)
returns jsonb language plpgsql stable security definer set search_path=''
as $$
declare v_result jsonb;
begin
 if auth.uid() is null or not exists(select 1 from private.platform_admins pa where pa.auth_user_id=(select auth.uid()) and pa.is_active=true and pa.role_key='super_admin') then raise exception 'ADMIN_ACCESS_REQUIRED' using errcode='42501'; end if;
 if not exists(select 1 from private.platform_b2b_products where id=p_product_id) then raise exception 'B2B_PRODUCT_NOT_FOUND' using errcode='P0002'; end if;
 select coalesce(jsonb_agg(to_jsonb(x) order by x.created_at desc),'[]'::jsonb) into v_result from (
  select id,movement_type,quantity_delta,reference,notes,created_at from private.platform_b2b_inventory_movements
  where product_id=p_product_id order by created_at desc limit greatest(1,least(coalesce(p_limit,20),100))
 ) x;
 return v_result;
end; $$;

revoke all on function public.admin_save_b2b_product_v2(uuid,uuid,text,text,text,text,text,numeric,numeric,numeric,numeric,text,numeric,numeric,text,text,text,jsonb,numeric) from public,anon;
grant execute on function public.admin_save_b2b_product_v2(uuid,uuid,text,text,text,text,text,numeric,numeric,numeric,numeric,text,numeric,numeric,text,text,text,jsonb,numeric) to authenticated;
revoke all on function public.admin_update_b2b_document_status(text,uuid,text,text) from public,anon;
grant execute on function public.admin_update_b2b_document_status(text,uuid,text,text) to authenticated;
revoke all on function public.admin_record_b2b_invoice_payment(uuid,numeric,text) from public,anon;
grant execute on function public.admin_record_b2b_invoice_payment(uuid,numeric,text) to authenticated;
revoke all on function public.admin_get_b2b_product_inventory_history(uuid,integer) from public,anon;
grant execute on function public.admin_get_b2b_product_inventory_history(uuid,integer) to authenticated;

drop function if exists public.admin_update_shop_order_status(uuid,text,text,text);
drop function if exists public.admin_save_shop_product(uuid,text,uuid,text,text,text,text,text,text,numeric,numeric,numeric,integer,integer,integer,jsonb,text,text,boolean,text);
drop function if exists public.admin_save_shop_vendor(uuid,text,text,text,text,text,text,text,text,text,text);
drop function if exists public.admin_get_shop_snapshot(text);
drop table if exists private.shop_order_items;
drop table if exists private.shop_orders;
drop table if exists private.shop_inventory_movements;
drop table if exists private.shop_products;
drop table if exists private.shop_vendors;

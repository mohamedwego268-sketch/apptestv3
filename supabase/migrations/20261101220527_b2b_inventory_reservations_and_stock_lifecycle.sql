alter table private.platform_b2b_products add column if not exists reserved_qty numeric not null default 0;
do $$ begin if not exists(select 1 from pg_constraint where conname='platform_b2b_products_reserved_qty_check' and conrelid='private.platform_b2b_products'::regclass) then alter table private.platform_b2b_products add constraint platform_b2b_products_reserved_qty_check check(reserved_qty>=0 and (stock_qty is null or reserved_qty<=stock_qty)); end if; end $$;

CREATE OR REPLACE FUNCTION public.admin_save_b2b_product_v2(p_id uuid DEFAULT NULL::uuid, p_partner_id uuid DEFAULT NULL::uuid, p_name_ar text DEFAULT ''::text, p_name_en text DEFAULT ''::text, p_description text DEFAULT NULL::text, p_category text DEFAULT 'general'::text, p_unit text DEFAULT 'piece'::text, p_min_order_qty numeric DEFAULT 1, p_cost_price numeric DEFAULT 0, p_wholesale_price numeric DEFAULT 0, p_retail_price numeric DEFAULT 0, p_currency text DEFAULT 'SAR'::text, p_tax_rate numeric DEFAULT 15, p_stock_qty numeric DEFAULT NULL::numeric, p_country text DEFAULT 'SA'::text, p_city text DEFAULT NULL::text, p_status text DEFAULT 'draft'::text, p_price_tiers jsonb DEFAULT '[]'::jsonb, p_reorder_level numeric DEFAULT 0)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_actor uuid:=(select auth.uid());v_product private.platform_b2b_products%rowtype;v_before jsonb;v_sku text;v_old_stock numeric;
begin
 if v_actor is null or not exists(select 1 from private.platform_admins pa where pa.auth_user_id=v_actor and pa.is_active=true and pa.role_key='super_admin') then raise exception 'ADMIN_ACCESS_REQUIRED' using errcode='42501'; end if;
 if nullif(trim(coalesce(p_name_ar,'')),'') is null then raise exception 'B2B_PRODUCT_NAME_REQUIRED' using errcode='22023'; end if;
 if p_status not in ('draft','active','out_of_stock','discontinued') then raise exception 'INVALID_B2B_PRODUCT_STATUS' using errcode='22023'; end if;
 if coalesce(p_min_order_qty,0)<=0 or coalesce(p_cost_price,0)<0 or coalesce(p_wholesale_price,0)<0 or coalesce(p_retail_price,0)<0 or coalesce(p_tax_rate,0)<0 or coalesce(p_tax_rate,0)>100 or coalesce(p_reorder_level,0)<0 or (p_stock_qty is not null and p_stock_qty<0) then raise exception 'INVALID_B2B_PRODUCT_PRICING_OR_STOCK' using errcode='22023'; end if;
 if jsonb_typeof(coalesce(p_price_tiers,'[]'::jsonb))<>'array' then raise exception 'INVALID_B2B_PRICE_TIERS' using errcode='22023'; end if;
 if exists(select 1 from jsonb_array_elements(coalesce(p_price_tiers,'[]'::jsonb)) t where coalesce((t->>'min_qty')::numeric,0)<=0 or coalesce((t->>'unit_price')::numeric,-1)<0) then raise exception 'INVALID_B2B_PRICE_TIER_VALUES' using errcode='22023'; end if;
 if p_partner_id is not null and not exists(select 1 from private.platform_b2b_partners where id=p_partner_id and status<>'archived') then raise exception 'B2B_PARTNER_NOT_FOUND' using errcode='P0002'; end if;
 if p_id is null then
  v_sku:='B2B-'||lpad(nextval('private.platform_b2b_sku_seq')::text,6,'0');
  insert into private.platform_b2b_products(sku,partner_id,name_ar,name_en,description,category,unit,min_order_qty,cost_price,wholesale_price,retail_price,currency,tax_rate,stock_qty,country,city,status,price_tiers,reorder_level)
  values(v_sku,p_partner_id,trim(p_name_ar),trim(coalesce(p_name_en,'')),nullif(trim(coalesce(p_description,'')),''),coalesce(nullif(trim(p_category),''),'general'),coalesce(nullif(trim(p_unit),''),'piece'),p_min_order_qty,p_cost_price,p_wholesale_price,p_retail_price,coalesce(nullif(trim(p_currency),''),'SAR'),p_tax_rate,p_stock_qty,coalesce(nullif(trim(p_country),''),'SA'),nullif(trim(coalesce(p_city,'')),''),p_status,coalesce(p_price_tiers,'[]'::jsonb),coalesce(p_reorder_level,0)) returning * into v_product;
  if p_stock_qty is not null then insert into private.platform_b2b_inventory_movements(product_id,movement_type,quantity_delta,reference,notes,actor_auth_user_id) values(v_product.id,'opening',p_stock_qty,'OPENING','Opening stock balance',v_actor); end if;
  insert into private.admin_audit_logs(actor_auth_user_id,action_key,target_type,target_id,after_state) values(v_actor,'b2b.product.created','b2b_product',v_product.id::text,jsonb_build_object('sku',v_product.sku,'name',v_product.name_ar,'partner_id',v_product.partner_id,'status',v_product.status,'price_tiers',v_product.price_tiers));
 else
  select to_jsonb(p),p.stock_qty,p.reserved_qty into v_before,v_old_stock,v_product.reserved_qty from private.platform_b2b_products p where p.id=p_id for update;
  if v_before is null then raise exception 'B2B_PRODUCT_NOT_FOUND' using errcode='P0002'; end if;
  if p_stock_qty is not null and p_stock_qty<v_product.reserved_qty then raise exception 'B2B_STOCK_BELOW_RESERVED_QUANTITY' using errcode='22023'; end if;
  update private.platform_b2b_products set partner_id=p_partner_id,name_ar=trim(p_name_ar),name_en=trim(coalesce(p_name_en,'')),description=nullif(trim(coalesce(p_description,'')),''),category=coalesce(nullif(trim(p_category),''),'general'),unit=coalesce(nullif(trim(p_unit),''),'piece'),min_order_qty=p_min_order_qty,cost_price=p_cost_price,wholesale_price=p_wholesale_price,retail_price=p_retail_price,currency=coalesce(nullif(trim(p_currency),''),'SAR'),tax_rate=p_tax_rate,stock_qty=p_stock_qty,country=coalesce(nullif(trim(p_country),''),'SA'),city=nullif(trim(coalesce(p_city,'')),''),status=p_status,price_tiers=coalesce(p_price_tiers,'[]'::jsonb),reorder_level=coalesce(p_reorder_level,0),updated_at=now() where id=p_id returning * into v_product;
  if v_old_stock is distinct from p_stock_qty then
   insert into private.platform_b2b_inventory_movements(product_id,movement_type,quantity_delta,reference,notes,actor_auth_user_id)
   values(v_product.id,case when v_old_stock is null then 'opening' else 'adjustment' end,case when p_stock_qty is null then 0 else p_stock_qty-coalesce(v_old_stock,0) end,'ADMIN_STOCK_UPDATE','Admin stock balance adjustment',v_actor);
  end if;
  insert into private.admin_audit_logs(actor_auth_user_id,action_key,target_type,target_id,before_state,after_state) values(v_actor,'b2b.product.updated','b2b_product',v_product.id::text,v_before,jsonb_build_object('sku',v_product.sku,'name',v_product.name_ar,'partner_id',v_product.partner_id,'status',v_product.status,'price_tiers',v_product.price_tiers));
 end if;
 delete from private.platform_b2b_product_price_tiers where product_id=v_product.id;
 insert into private.platform_b2b_product_price_tiers(product_id,min_qty,unit_price) select v_product.id,(t->>'min_qty')::numeric,(t->>'unit_price')::numeric from jsonb_array_elements(coalesce(p_price_tiers,'[]'::jsonb)) t;
 return jsonb_build_object('id',v_product.id,'sku',v_product.sku,'name',v_product.name_ar,'status',v_product.status,'price_tiers',v_product.price_tiers);
end; $function$;
CREATE OR REPLACE FUNCTION public.admin_create_b2b_order(p_buyer_partner_id uuid, p_items jsonb, p_requested_delivery_date date DEFAULT NULL::date, p_notes text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
 v_actor uuid:=(select auth.uid());v_partner private.platform_b2b_partners%rowtype;v_order private.platform_b2b_orders%rowtype;
 v_item jsonb;v_product private.platform_b2b_products%rowtype;v_qty numeric;v_total_qty numeric;v_price numeric;v_line numeric;v_tax numeric;
 v_subtotal numeric:=0;v_tax_total numeric:=0;v_currency text;
begin
 if v_actor is null or not exists(select 1 from private.platform_admins pa where pa.auth_user_id=v_actor and pa.is_active=true and pa.role_key='super_admin') then raise exception 'ADMIN_ACCESS_REQUIRED' using errcode='42501'; end if;
 if jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items)=0 then raise exception 'B2B_ORDER_ITEMS_REQUIRED' using errcode='22023'; end if;
 select * into v_partner from private.platform_b2b_partners where id=p_buyer_partner_id and status='active' for share;
 if not found or v_partner.partner_type not in ('corporate_buyer','retailer','distributor') then raise exception 'B2B_BUYER_NOT_ACTIVE' using errcode='22023'; end if;
 v_currency:=v_partner.currency;
 for v_item in select value from jsonb_array_elements(p_items) loop
  select * into v_product from private.platform_b2b_products where id=(v_item->>'product_id')::uuid and status='active' for share;
  if not found then raise exception 'B2B_PRODUCT_NOT_ACTIVE' using errcode='22023'; end if;
  v_qty:=(v_item->>'quantity')::numeric;
  if v_qty is null or v_qty<=0 or v_qty<v_product.min_order_qty then raise exception 'B2B_MINIMUM_ORDER_QTY_NOT_MET: %',v_product.sku using errcode='22023'; end if;
  if v_product.currency<>v_currency then raise exception 'B2B_CURRENCY_MISMATCH' using errcode='22023'; end if;
  select coalesce(sum((x.value->>'quantity')::numeric),0) into v_total_qty
  from jsonb_array_elements(p_items) x where (x.value->>'product_id')::uuid=v_product.id;
  if v_product.stock_qty is not null and v_product.stock_qty-v_product.reserved_qty<v_total_qty then raise exception 'B2B_INSUFFICIENT_AVAILABLE_STOCK: %',v_product.sku using errcode='22023'; end if;
  select coalesce((select pt.unit_price from private.platform_b2b_product_price_tiers pt where pt.product_id=v_product.id and pt.min_qty<=v_qty order by pt.min_qty desc limit 1),v_product.wholesale_price) into v_price;
  v_line:=round(v_qty*v_price,2);v_tax:=round(v_line*v_product.tax_rate/100,2);
  v_subtotal:=v_subtotal+v_line;v_tax_total:=v_tax_total+v_tax;
 end loop;
 insert into private.platform_b2b_orders(order_no,buyer_partner_id,status,currency,subtotal,tax_total,total,requested_delivery_date,notes,created_by)
 values('ORD-'||to_char(now(),'YYYYMMDD')||'-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,6)),p_buyer_partner_id,'inquiry',v_currency,v_subtotal,v_tax_total,v_subtotal+v_tax_total,p_requested_delivery_date,nullif(trim(coalesce(p_notes,'')),''),v_actor)
 returning * into v_order;
 for v_item in select value from jsonb_array_elements(p_items) loop
  select * into v_product from private.platform_b2b_products where id=(v_item->>'product_id')::uuid;
  v_qty:=(v_item->>'quantity')::numeric;
  select coalesce((select pt.unit_price from private.platform_b2b_product_price_tiers pt where pt.product_id=v_product.id and pt.min_qty<=v_qty order by pt.min_qty desc limit 1),v_product.wholesale_price) into v_price;
  v_line:=round(v_qty*v_price,2);
  insert into private.platform_b2b_order_items(order_id,product_id,description,quantity,unit_price,tax_rate,line_total)
  values(v_order.id,v_product.id,v_product.name_ar,v_qty,v_price,v_product.tax_rate,v_line);
 end loop;
 insert into private.admin_audit_logs(actor_auth_user_id,action_key,target_type,target_id,after_state)
 values(v_actor,'b2b.order.created','b2b_order',v_order.id::text,jsonb_build_object('order_no',v_order.order_no,'buyer_partner_id',p_buyer_partner_id,'items_count',jsonb_array_length(p_items),'total',v_order.total,'currency',v_order.currency));
 return jsonb_build_object('id',v_order.id,'order_no',v_order.order_no,'status',v_order.status,'subtotal',v_order.subtotal,'tax_total',v_order.tax_total,'total',v_order.total,'currency',v_order.currency);
end; $function$;
CREATE OR REPLACE FUNCTION public.admin_update_b2b_order_status(p_order_id uuid, p_status text, p_notes text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_actor uuid:=(select auth.uid());v_before jsonb;v_order private.platform_b2b_orders%rowtype;v_allowed boolean:=false;v_item record;v_product private.platform_b2b_products%rowtype;
begin
 if v_actor is null or not exists(select 1 from private.platform_admins pa where pa.auth_user_id=v_actor and pa.is_active=true and pa.role_key='super_admin') then raise exception 'ADMIN_ACCESS_REQUIRED' using errcode='42501'; end if;
 if p_status not in ('inquiry','quote_sent','approved','processing','shipped','delivered','cancelled') then raise exception 'INVALID_B2B_ORDER_STATUS' using errcode='22023'; end if;
 select to_jsonb(o) into v_before from private.platform_b2b_orders o where o.id=p_order_id for update;
 if v_before is null then raise exception 'B2B_ORDER_NOT_FOUND' using errcode='P0002'; end if;
 select * into v_order from private.platform_b2b_orders where id=p_order_id;
 v_allowed:=case v_order.status when 'inquiry' then p_status in ('quote_sent','cancelled') when 'quote_sent' then p_status in ('approved','cancelled') when 'approved' then p_status in ('processing','cancelled') when 'processing' then p_status in ('shipped','cancelled') when 'shipped' then p_status='delivered' else false end;
 if not v_allowed then raise exception 'INVALID_B2B_ORDER_TRANSITION: % -> %',v_order.status,p_status using errcode='22023'; end if;

 if p_status='approved' then
  for v_item in select product_id,quantity from private.platform_b2b_order_items where order_id=p_order_id and product_id is not null loop
   select * into v_product from private.platform_b2b_products where id=v_item.product_id for update;
   if v_product.stock_qty is not null then
    if v_product.stock_qty-v_product.reserved_qty<v_item.quantity then raise exception 'B2B_INSUFFICIENT_AVAILABLE_STOCK: %',v_product.sku using errcode='22023'; end if;
    update private.platform_b2b_products set reserved_qty=reserved_qty+v_item.quantity,updated_at=now() where id=v_product.id;
    insert into private.platform_b2b_inventory_movements(product_id,movement_type,quantity_delta,reference,notes,actor_auth_user_id)
    values(v_product.id,'reservation',-v_item.quantity,v_order.order_no,'Reserved for approved B2B order',v_actor);
   end if;
  end loop;
 elsif p_status='shipped' then
  for v_item in select product_id,quantity from private.platform_b2b_order_items where order_id=p_order_id and product_id is not null loop
   select * into v_product from private.platform_b2b_products where id=v_item.product_id for update;
   if v_product.stock_qty is not null then
    if v_product.reserved_qty<v_item.quantity or v_product.stock_qty<v_item.quantity then raise exception 'B2B_STOCK_RESERVATION_INCONSISTENT: %',v_product.sku using errcode='23514'; end if;
    update private.platform_b2b_products set stock_qty=stock_qty-v_item.quantity,reserved_qty=reserved_qty-v_item.quantity,updated_at=now() where id=v_product.id;
    insert into private.platform_b2b_inventory_movements(product_id,movement_type,quantity_delta,reference,notes,actor_auth_user_id)
    values(v_product.id,'sale',-v_item.quantity,v_order.order_no,'Stock dispatched for B2B order',v_actor);
   end if;
  end loop;
 elsif p_status='cancelled' and v_order.status in ('approved','processing') then
  for v_item in select product_id,quantity from private.platform_b2b_order_items where order_id=p_order_id and product_id is not null loop
   select * into v_product from private.platform_b2b_products where id=v_item.product_id for update;
   if v_product.stock_qty is not null then
    if v_product.reserved_qty<v_item.quantity then raise exception 'B2B_STOCK_RESERVATION_INCONSISTENT: %',v_product.sku using errcode='23514'; end if;
    update private.platform_b2b_products set reserved_qty=reserved_qty-v_item.quantity,updated_at=now() where id=v_product.id;
    insert into private.platform_b2b_inventory_movements(product_id,movement_type,quantity_delta,reference,notes,actor_auth_user_id)
    values(v_product.id,'release',v_item.quantity,v_order.order_no,'Released reservation for cancelled B2B order',v_actor);
   end if;
  end loop;
 end if;

 update private.platform_b2b_orders set status=p_status,notes=case when nullif(trim(coalesce(p_notes,'')),'') is null then notes else concat_ws(E'\n',notes,trim(p_notes)) end,updated_at=now() where id=p_order_id returning * into v_order;
 insert into private.admin_audit_logs(actor_auth_user_id,action_key,target_type,target_id,before_state,after_state)
 values(v_actor,'b2b.order.status_changed','b2b_order',v_order.id::text,v_before,jsonb_build_object('order_no',v_order.order_no,'status',v_order.status));
 return jsonb_build_object('id',v_order.id,'order_no',v_order.order_no,'status',v_order.status);
end; $function$;
CREATE OR REPLACE FUNCTION public.admin_get_b2b_store_snapshot(p_search text DEFAULT NULL::text, p_limit integer DEFAULT 50, p_offset integer DEFAULT 0)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_search text:=nullif(trim(coalesce(p_search,'')),'');v_limit integer:=greatest(1,least(coalesce(p_limit,50),100));v_offset integer:=greatest(0,coalesce(p_offset,0));v_result jsonb;
begin
 if auth.uid() is null or not exists(select 1 from private.platform_admins pa where pa.auth_user_id=(select auth.uid()) and pa.is_active=true and pa.role_key='super_admin') then raise exception 'ADMIN_ACCESS_REQUIRED' using errcode='42501'; end if;
 select jsonb_build_object(
  'metrics',jsonb_build_object('partners_total',(select count(*) from private.platform_b2b_partners),'partners_active',(select count(*) from private.platform_b2b_partners where status='active'),'products_total',(select count(*) from private.platform_b2b_products),'products_active',(select count(*) from private.platform_b2b_products where status='active'),'products_low_stock',(select count(*) from private.platform_b2b_products where stock_qty is not null and stock_qty-reserved_qty<=reorder_level and status='active'),'orders_total',(select count(*) from private.platform_b2b_orders),'orders_open',(select count(*) from private.platform_b2b_orders where status not in ('delivered','cancelled')),'quotes_pending',(select count(*) from private.platform_b2b_quotes where status in ('draft','sent')),'invoices_unpaid',(select count(*) from private.platform_b2b_invoices where status in ('issued','partially_paid','overdue'))),
  'partners_total',(select count(*) from private.platform_b2b_partners where v_search is null or partner_code ilike '%'||v_search||'%' or legal_name ilike '%'||v_search||'%' or display_name ilike '%'||v_search||'%' or email ilike '%'||v_search||'%' or phone ilike '%'||v_search||'%'),
  'partners',(select coalesce(jsonb_agg(to_jsonb(p) order by p.updated_at desc),'[]'::jsonb) from (select id,partner_code,legal_name,display_name,partner_type,tax_number,country,city,contact_name,email,phone,website,status,currency,payment_terms_days,credit_limit,notes,created_at,updated_at from private.platform_b2b_partners where v_search is null or partner_code ilike '%'||v_search||'%' or legal_name ilike '%'||v_search||'%' or display_name ilike '%'||v_search||'%' or email ilike '%'||v_search||'%' or phone ilike '%'||v_search||'%' order by updated_at desc limit v_limit offset v_offset) p),
  'products_total',(select count(*) from private.platform_b2b_products where v_search is null or sku ilike '%'||v_search||'%' or name_ar ilike '%'||v_search||'%' or name_en ilike '%'||v_search||'%' or category ilike '%'||v_search||'%'),
  'products',(select coalesce(jsonb_agg(to_jsonb(p) order by p.updated_at desc),'[]'::jsonb) from (select pr.id,pr.sku,pr.partner_id,coalesce(bp.display_name,'—') partner_name,pr.name_ar,pr.name_en,pr.description,pr.category,pr.unit,pr.min_order_qty,pr.cost_price,pr.wholesale_price,pr.retail_price,pr.currency,pr.tax_rate,pr.stock_qty,pr.reserved_qty,(pr.stock_qty-pr.reserved_qty) available_stock,pr.reorder_level,pr.price_tiers,pr.country,pr.city,pr.status,pr.created_at,pr.updated_at from private.platform_b2b_products pr left join private.platform_b2b_partners bp on bp.id=pr.partner_id where v_search is null or pr.sku ilike '%'||v_search||'%' or pr.name_ar ilike '%'||v_search||'%' or pr.name_en ilike '%'||v_search||'%' or pr.category ilike '%'||v_search||'%' order by pr.updated_at desc limit v_limit offset v_offset) p),
  'orders',(select coalesce(jsonb_agg(to_jsonb(o) order by o.created_at desc),'[]'::jsonb) from (select o.id,o.order_no,o.status,o.currency,o.subtotal,o.tax_total,o.total,o.requested_delivery_date,o.created_at,b.display_name buyer_name from private.platform_b2b_orders o join private.platform_b2b_partners b on b.id=o.buyer_partner_id order by o.created_at desc limit 30) o),
  'quotes_total',(select count(*) from private.platform_b2b_quotes),'quotes',(select coalesce(jsonb_agg(to_jsonb(q) order by q.created_at desc),'[]'::jsonb) from (select q.id,q.quote_no,q.order_id,q.status,q.valid_until,q.subtotal,q.tax_total,q.total,q.terms,q.created_at,o.order_no,b.display_name buyer_name from private.platform_b2b_quotes q join private.platform_b2b_orders o on o.id=q.order_id join private.platform_b2b_partners b on b.id=o.buyer_partner_id order by q.created_at desc limit 30) q),
  'invoices_total',(select count(*) from private.platform_b2b_invoices),'invoices',(select coalesce(jsonb_agg(to_jsonb(i) order by i.created_at desc),'[]'::jsonb) from (select i.id,i.invoice_no,i.order_id,i.status,i.currency,i.total,i.amount_paid,(i.total-i.amount_paid) balance_due,i.due_date,i.issued_at,i.created_at,o.order_no,b.display_name buyer_name from private.platform_b2b_invoices i join private.platform_b2b_orders o on o.id=i.order_id join private.platform_b2b_partners b on b.id=o.buyer_partner_id order by i.created_at desc limit 30) i)
 ) into v_result;
 return v_result;
end; $function$;
revoke all on function public.admin_save_b2b_product_v2(uuid,uuid,text,text,text,text,text,numeric,numeric,numeric,numeric,text,numeric,numeric,text,text,text,jsonb,numeric) from public,anon;
grant execute on function public.admin_save_b2b_product_v2(uuid,uuid,text,text,text,text,text,numeric,numeric,numeric,numeric,text,numeric,numeric,text,text,text,jsonb,numeric) to authenticated;
revoke all on function public.admin_create_b2b_order(uuid,jsonb,date,text) from public,anon;
grant execute on function public.admin_create_b2b_order(uuid,jsonb,date,text) to authenticated;
revoke all on function public.admin_update_b2b_order_status(uuid,text,text) from public,anon;
grant execute on function public.admin_update_b2b_order_status(uuid,text,text) to authenticated;
revoke all on function public.admin_get_b2b_store_snapshot(text,integer,integer) from public,anon;
grant execute on function public.admin_get_b2b_store_snapshot(text,integer,integer) to authenticated;

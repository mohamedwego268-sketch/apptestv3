create or replace function public.admin_create_b2b_order(p_buyer_partner_id uuid,p_items jsonb,p_requested_delivery_date date default null,p_notes text default null)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare
 v_actor uuid:=(select auth.uid());v_partner private.platform_b2b_partners%rowtype;v_order private.platform_b2b_orders%rowtype;
 v_item jsonb;v_product private.platform_b2b_products%rowtype;v_qty numeric;v_price numeric;v_line numeric;v_tax numeric;
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
  if v_product.stock_qty is not null and v_product.stock_qty<v_qty then raise exception 'B2B_INSUFFICIENT_STOCK: %',v_product.sku using errcode='22023'; end if;
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
end; $$;

create or replace function public.admin_create_b2b_quote(p_order_id uuid,p_valid_until date default null,p_terms text default null)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare v_actor uuid:=(select auth.uid());v_order private.platform_b2b_orders%rowtype;v_quote private.platform_b2b_quotes%rowtype;
begin
 if v_actor is null or not exists(select 1 from private.platform_admins pa where pa.auth_user_id=v_actor and pa.is_active=true and pa.role_key='super_admin') then raise exception 'ADMIN_ACCESS_REQUIRED' using errcode='42501'; end if;
 select * into v_order from private.platform_b2b_orders where id=p_order_id for update;
 if not found then raise exception 'B2B_ORDER_NOT_FOUND' using errcode='P0002'; end if;
 if v_order.status not in ('inquiry','quote_sent') then raise exception 'ORDER_NOT_ELIGIBLE_FOR_QUOTE' using errcode='22023'; end if;
 if exists(select 1 from private.platform_b2b_quotes where order_id=p_order_id and status in ('draft','sent')) then raise exception 'ACTIVE_QUOTE_ALREADY_EXISTS' using errcode='23505'; end if;
 insert into private.platform_b2b_quotes(quote_no,order_id,status,valid_until,subtotal,tax_total,total,terms)
 values('QT-'||to_char(now(),'YYYYMMDD')||'-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,6)),p_order_id,'draft',p_valid_until,v_order.subtotal,v_order.tax_total,v_order.total,nullif(trim(coalesce(p_terms,'')),'')) returning * into v_quote;
 update private.platform_b2b_orders set status='quote_sent',updated_at=now() where id=p_order_id;
 insert into private.admin_audit_logs(actor_auth_user_id,action_key,target_type,target_id,after_state)
 values(v_actor,'b2b.quote.created','b2b_quote',v_quote.id::text,jsonb_build_object('quote_no',v_quote.quote_no,'order_no',v_order.order_no,'total',v_quote.total));
 return jsonb_build_object('id',v_quote.id,'quote_no',v_quote.quote_no,'status',v_quote.status);
end; $$;

create or replace function public.admin_create_b2b_invoice(p_order_id uuid,p_due_date date default null)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare v_actor uuid:=(select auth.uid());v_order private.platform_b2b_orders%rowtype;v_invoice private.platform_b2b_invoices%rowtype;
begin
 if v_actor is null or not exists(select 1 from private.platform_admins pa where pa.auth_user_id=v_actor and pa.is_active=true and pa.role_key='super_admin') then raise exception 'ADMIN_ACCESS_REQUIRED' using errcode='42501'; end if;
 select * into v_order from private.platform_b2b_orders where id=p_order_id for update;
 if not found then raise exception 'B2B_ORDER_NOT_FOUND' using errcode='P0002'; end if;
 if v_order.status not in ('approved','processing','shipped','delivered') then raise exception 'ORDER_NOT_READY_FOR_INVOICE' using errcode='22023'; end if;
 if exists(select 1 from private.platform_b2b_invoices where order_id=p_order_id and status<>'void') then raise exception 'ACTIVE_INVOICE_ALREADY_EXISTS' using errcode='23505'; end if;
 insert into private.platform_b2b_invoices(invoice_no,order_id,status,currency,total,amount_paid,due_date)
 values('INV-'||to_char(now(),'YYYYMMDD')||'-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,6)),p_order_id,'draft',v_order.currency,v_order.total,0,p_due_date)
 returning * into v_invoice;
 insert into private.admin_audit_logs(actor_auth_user_id,action_key,target_type,target_id,after_state)
 values(v_actor,'b2b.invoice.created','b2b_invoice',v_invoice.id::text,jsonb_build_object('invoice_no',v_invoice.invoice_no,'order_no',v_order.order_no,'total',v_invoice.total,'currency',v_invoice.currency));
 return jsonb_build_object('id',v_invoice.id,'invoice_no',v_invoice.invoice_no,'status',v_invoice.status,'total',v_invoice.total);
end; $$;

revoke all on function public.admin_create_b2b_order(uuid,jsonb,date,text) from public,anon;
grant execute on function public.admin_create_b2b_order(uuid,jsonb,date,text) to authenticated;
revoke all on function public.admin_create_b2b_quote(uuid,date,text) from public,anon;
grant execute on function public.admin_create_b2b_quote(uuid,date,text) to authenticated;
revoke all on function public.admin_create_b2b_invoice(uuid,date) from public,anon;
grant execute on function public.admin_create_b2b_invoice(uuid,date) to authenticated;

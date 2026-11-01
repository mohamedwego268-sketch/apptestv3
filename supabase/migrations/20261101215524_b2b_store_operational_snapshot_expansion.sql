create or replace function public.admin_get_b2b_store_snapshot(p_search text default null,p_limit integer default 50,p_offset integer default 0)
returns jsonb language plpgsql stable security definer set search_path=''
as $$
declare v_search text:=nullif(trim(coalesce(p_search,'')),'');v_limit integer:=greatest(1,least(coalesce(p_limit,50),100));v_offset integer:=greatest(0,coalesce(p_offset,0));v_result jsonb;
begin
 if auth.uid() is null or not exists(select 1 from private.platform_admins pa where pa.auth_user_id=(select auth.uid()) and pa.is_active=true and pa.role_key='super_admin') then raise exception 'ADMIN_ACCESS_REQUIRED' using errcode='42501'; end if;
 select jsonb_build_object(
  'metrics',jsonb_build_object(
   'partners_total',(select count(*) from private.platform_b2b_partners),
   'partners_active',(select count(*) from private.platform_b2b_partners where status='active'),
   'products_total',(select count(*) from private.platform_b2b_products),
   'products_active',(select count(*) from private.platform_b2b_products where status='active'),
   'products_low_stock',(select count(*) from private.platform_b2b_products where stock_qty is not null and stock_qty<=reorder_level and status='active'),
   'orders_total',(select count(*) from private.platform_b2b_orders),
   'orders_open',(select count(*) from private.platform_b2b_orders where status not in ('delivered','cancelled')),
   'quotes_pending',(select count(*) from private.platform_b2b_quotes where status in ('draft','sent')),
   'invoices_unpaid',(select count(*) from private.platform_b2b_invoices where status in ('issued','partially_paid','overdue'))
  ),
  'partners_total',(select count(*) from private.platform_b2b_partners where v_search is null or partner_code ilike '%'||v_search||'%' or legal_name ilike '%'||v_search||'%' or display_name ilike '%'||v_search||'%' or email ilike '%'||v_search||'%' or phone ilike '%'||v_search||'%'),
  'partners',(select coalesce(jsonb_agg(to_jsonb(p) order by p.updated_at desc),'[]'::jsonb) from (
   select id,partner_code,legal_name,display_name,partner_type,tax_number,country,city,contact_name,email,phone,website,status,currency,payment_terms_days,credit_limit,notes,created_at,updated_at
   from private.platform_b2b_partners where v_search is null or partner_code ilike '%'||v_search||'%' or legal_name ilike '%'||v_search||'%' or display_name ilike '%'||v_search||'%' or email ilike '%'||v_search||'%' or phone ilike '%'||v_search||'%'
   order by updated_at desc limit v_limit offset v_offset
  ) p),
  'products_total',(select count(*) from private.platform_b2b_products where v_search is null or sku ilike '%'||v_search||'%' or name_ar ilike '%'||v_search||'%' or name_en ilike '%'||v_search||'%' or category ilike '%'||v_search||'%'),
  'products',(select coalesce(jsonb_agg(to_jsonb(p) order by p.updated_at desc),'[]'::jsonb) from (
   select pr.id,pr.sku,pr.partner_id,coalesce(bp.display_name,'—') partner_name,pr.name_ar,pr.name_en,pr.description,pr.category,pr.unit,pr.min_order_qty,pr.cost_price,pr.wholesale_price,pr.retail_price,pr.currency,pr.tax_rate,pr.stock_qty,pr.reorder_level,pr.price_tiers,pr.country,pr.city,pr.status,pr.created_at,pr.updated_at
   from private.platform_b2b_products pr left join private.platform_b2b_partners bp on bp.id=pr.partner_id
   where v_search is null or pr.sku ilike '%'||v_search||'%' or pr.name_ar ilike '%'||v_search||'%' or pr.name_en ilike '%'||v_search||'%' or pr.category ilike '%'||v_search||'%'
   order by pr.updated_at desc limit v_limit offset v_offset
  ) p),
  'orders',(select coalesce(jsonb_agg(to_jsonb(o) order by o.created_at desc),'[]'::jsonb) from (
   select o.id,o.order_no,o.status,o.currency,o.subtotal,o.tax_total,o.total,o.requested_delivery_date,o.created_at,b.display_name buyer_name
   from private.platform_b2b_orders o join private.platform_b2b_partners b on b.id=o.buyer_partner_id order by o.created_at desc limit 30
  ) o),
  'quotes_total',(select count(*) from private.platform_b2b_quotes),
  'quotes',(select coalesce(jsonb_agg(to_jsonb(q) order by q.created_at desc),'[]'::jsonb) from (
   select q.id,q.quote_no,q.order_id,q.status,q.valid_until,q.subtotal,q.tax_total,q.total,q.terms,q.created_at,o.order_no,b.display_name buyer_name
   from private.platform_b2b_quotes q join private.platform_b2b_orders o on o.id=q.order_id join private.platform_b2b_partners b on b.id=o.buyer_partner_id
   order by q.created_at desc limit 30
  ) q),
  'invoices_total',(select count(*) from private.platform_b2b_invoices),
  'invoices',(select coalesce(jsonb_agg(to_jsonb(i) order by i.created_at desc),'[]'::jsonb) from (
   select i.id,i.invoice_no,i.order_id,i.status,i.currency,i.total,i.amount_paid,(i.total-i.amount_paid) balance_due,i.due_date,i.issued_at,i.created_at,o.order_no,b.display_name buyer_name
   from private.platform_b2b_invoices i join private.platform_b2b_orders o on o.id=i.order_id join private.platform_b2b_partners b on b.id=o.buyer_partner_id
   order by i.created_at desc limit 30
  ) i)
 ) into v_result;
 return v_result;
end; $$;
revoke all on function public.admin_get_b2b_store_snapshot(text,integer,integer) from public,anon;
grant execute on function public.admin_get_b2b_store_snapshot(text,integer,integer) to authenticated;

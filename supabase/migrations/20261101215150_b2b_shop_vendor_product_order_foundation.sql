create or replace function public.admin_get_b2b_store_snapshot(p_search text default null,p_limit integer default 50,p_offset integer default 0)
returns jsonb language plpgsql stable security definer set search_path=''
as $$
declare v_search text:=nullif(trim(coalesce(p_search,'')),''); v_limit integer:=greatest(1,least(coalesce(p_limit,50),100)); v_offset integer:=greatest(0,coalesce(p_offset,0)); v_result jsonb;
begin
 if auth.uid() is null or not exists(select 1 from private.platform_admins pa where pa.auth_user_id=(select auth.uid()) and pa.is_active=true and pa.role_key='super_admin') then raise exception 'ADMIN_ACCESS_REQUIRED' using errcode='42501'; end if;
 select jsonb_build_object(
  'metrics',jsonb_build_object('partners_total',(select count(*) from private.platform_b2b_partners),'partners_active',(select count(*) from private.platform_b2b_partners where status='active'),'products_total',(select count(*) from private.platform_b2b_products),'products_active',(select count(*) from private.platform_b2b_products where status='active'),'orders_total',(select count(*) from private.platform_b2b_orders),'orders_open',(select count(*) from private.platform_b2b_orders where status not in ('delivered','cancelled')),'quotes_pending',(select count(*) from private.platform_b2b_quotes where status in ('draft','sent')),'invoices_unpaid',(select count(*) from private.platform_b2b_invoices where status in ('issued','partially_paid','overdue'))),
  'partners_total',(select count(*) from private.platform_b2b_partners where v_search is null or partner_code ilike '%'||v_search||'%' or legal_name ilike '%'||v_search||'%' or display_name ilike '%'||v_search||'%' or email ilike '%'||v_search||'%' or phone ilike '%'||v_search||'%'),
  'partners',(select coalesce(jsonb_agg(to_jsonb(p) order by p.updated_at desc),'[]'::jsonb) from (select id,partner_code,legal_name,display_name,partner_type,tax_number,country,city,contact_name,email,phone,website,status,currency,payment_terms_days,credit_limit,notes,created_at,updated_at from private.platform_b2b_partners where v_search is null or partner_code ilike '%'||v_search||'%' or legal_name ilike '%'||v_search||'%' or display_name ilike '%'||v_search||'%' or email ilike '%'||v_search||'%' or phone ilike '%'||v_search||'%' order by updated_at desc limit v_limit offset v_offset) p),
  'products_total',(select count(*) from private.platform_b2b_products where v_search is null or sku ilike '%'||v_search||'%' or name_ar ilike '%'||v_search||'%' or name_en ilike '%'||v_search||'%' or category ilike '%'||v_search||'%'),
  'products',(select coalesce(jsonb_agg(to_jsonb(p) order by p.updated_at desc),'[]'::jsonb) from (select pr.id,pr.sku,pr.partner_id,coalesce(bp.display_name,'—') partner_name,pr.name_ar,pr.name_en,pr.description,pr.category,pr.unit,pr.min_order_qty,pr.cost_price,pr.wholesale_price,pr.retail_price,pr.currency,pr.tax_rate,pr.stock_qty,pr.country,pr.city,pr.status,pr.created_at,pr.updated_at from private.platform_b2b_products pr left join private.platform_b2b_partners bp on bp.id=pr.partner_id where v_search is null or pr.sku ilike '%'||v_search||'%' or pr.name_ar ilike '%'||v_search||'%' or pr.name_en ilike '%'||v_search||'%' or pr.category ilike '%'||v_search||'%' order by pr.updated_at desc limit v_limit offset v_offset) p),
  'orders',(select coalesce(jsonb_agg(to_jsonb(o) order by o.created_at desc),'[]'::jsonb) from (select o.id,o.order_no,o.status,o.currency,o.subtotal,o.tax_total,o.total,o.requested_delivery_date,o.created_at,b.display_name buyer_name from private.platform_b2b_orders o join private.platform_b2b_partners b on b.id=o.buyer_partner_id order by o.created_at desc limit 12) o),
  'quotes_total',(select count(*) from private.platform_b2b_quotes),'invoices_total',(select count(*) from private.platform_b2b_invoices)
 ) into v_result;
 return v_result;
end; $$;

create or replace function public.admin_save_b2b_partner(p_id uuid default null,p_legal_name text default '',p_display_name text default '',p_partner_type text default 'supplier',p_tax_number text default null,p_country text default 'SA',p_city text default '',p_contact_name text default null,p_email text default null,p_phone text default null,p_website text default null,p_status text default 'prospect',p_currency text default 'SAR',p_payment_terms_days integer default 0,p_credit_limit numeric default 0,p_notes text default null)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare v_actor uuid:=auth.uid(); v_partner private.platform_b2b_partners%rowtype; v_before jsonb; v_code text;
begin
 if v_actor is null or not exists(select 1 from private.platform_admins pa where pa.auth_user_id=v_actor and pa.is_active=true and pa.role_key='super_admin') then raise exception 'ADMIN_ACCESS_REQUIRED' using errcode='42501'; end if;
 if nullif(trim(coalesce(p_legal_name,'')),'') is null then raise exception 'PARTNER_LEGAL_NAME_REQUIRED' using errcode='22023'; end if;
 if p_partner_type not in ('supplier','distributor','retailer','service_provider','corporate_buyer') then raise exception 'INVALID_PARTNER_TYPE' using errcode='22023'; end if;
 if p_status not in ('prospect','onboarding','active','suspended','archived') then raise exception 'INVALID_PARTNER_STATUS' using errcode='22023'; end if;
 if coalesce(p_payment_terms_days,0)<0 or coalesce(p_payment_terms_days,0)>365 or coalesce(p_credit_limit,0)<0 then raise exception 'INVALID_PARTNER_CREDIT_TERMS' using errcode='22023'; end if;
 if p_id is null then
  v_code:='B2B-'||lpad(nextval('private.platform_b2b_partner_code_seq')::text,5,'0');
  insert into private.platform_b2b_partners(partner_code,legal_name,display_name,partner_type,tax_number,country,city,contact_name,email,phone,website,status,currency,payment_terms_days,credit_limit,notes)
  values(v_code,trim(p_legal_name),coalesce(nullif(trim(p_display_name),''),trim(p_legal_name)),p_partner_type,nullif(trim(coalesce(p_tax_number,'')),''),coalesce(nullif(trim(p_country),''),'SA'),trim(coalesce(p_city,'')),nullif(trim(coalesce(p_contact_name,'')),''),nullif(lower(trim(coalesce(p_email,''))),''),nullif(trim(coalesce(p_phone,'')),''),nullif(trim(coalesce(p_website,'')),''),p_status,coalesce(nullif(trim(p_currency),''),'SAR'),coalesce(p_payment_terms_days,0),coalesce(p_credit_limit,0),nullif(trim(coalesce(p_notes,'')),'')) returning * into v_partner;
  insert into private.admin_audit_logs(actor_auth_user_id,action_key,target_type,target_id,after_state) values(v_actor,'b2b.partner.created','b2b_partner',v_partner.id::text,jsonb_build_object('partner_code',v_partner.partner_code,'name',v_partner.display_name,'type',v_partner.partner_type,'status',v_partner.status));
 else
  select to_jsonb(p) into v_before from private.platform_b2b_partners p where p.id=p_id for update;
  if v_before is null then raise exception 'PARTNER_NOT_FOUND' using errcode='P0002'; end if;
  update private.platform_b2b_partners set legal_name=trim(p_legal_name),display_name=coalesce(nullif(trim(p_display_name),''),trim(p_legal_name)),partner_type=p_partner_type,tax_number=nullif(trim(coalesce(p_tax_number,'')),''),country=coalesce(nullif(trim(p_country),''),'SA'),city=trim(coalesce(p_city,'')),contact_name=nullif(trim(coalesce(p_contact_name,'')),''),email=nullif(lower(trim(coalesce(p_email,''))),''),phone=nullif(trim(coalesce(p_phone,'')),''),website=nullif(trim(coalesce(p_website,'')),''),status=p_status,currency=coalesce(nullif(trim(p_currency),''),'SAR'),payment_terms_days=coalesce(p_payment_terms_days,0),credit_limit=coalesce(p_credit_limit,0),notes=nullif(trim(coalesce(p_notes,'')),''),updated_at=now() where id=p_id returning * into v_partner;
  insert into private.admin_audit_logs(actor_auth_user_id,action_key,target_type,target_id,before_state,after_state) values(v_actor,'b2b.partner.updated','b2b_partner',v_partner.id::text,v_before,jsonb_build_object('partner_code',v_partner.partner_code,'name',v_partner.display_name,'type',v_partner.partner_type,'status',v_partner.status));
 end if;
 return jsonb_build_object('id',v_partner.id,'partner_code',v_partner.partner_code,'display_name',v_partner.display_name,'status',v_partner.status);
end; $$;

create or replace function public.admin_save_b2b_product(p_id uuid default null,p_partner_id uuid default null,p_name_ar text default '',p_name_en text default '',p_description text default null,p_category text default 'general',p_unit text default 'piece',p_min_order_qty numeric default 1,p_cost_price numeric default 0,p_wholesale_price numeric default 0,p_retail_price numeric default 0,p_currency text default 'SAR',p_tax_rate numeric default 15,p_stock_qty numeric default null,p_country text default 'SA',p_city text default null,p_status text default 'draft')
returns jsonb language plpgsql security definer set search_path=''
as $$
declare v_actor uuid:=auth.uid(); v_product private.platform_b2b_products%rowtype; v_before jsonb; v_sku text;
begin
 if v_actor is null or not exists(select 1 from private.platform_admins pa where pa.auth_user_id=v_actor and pa.is_active=true and pa.role_key='super_admin') then raise exception 'ADMIN_ACCESS_REQUIRED' using errcode='42501'; end if;
 if nullif(trim(coalesce(p_name_ar,'')),'') is null then raise exception 'B2B_PRODUCT_NAME_REQUIRED' using errcode='22023'; end if;
 if p_status not in ('draft','active','out_of_stock','discontinued') then raise exception 'INVALID_B2B_PRODUCT_STATUS' using errcode='22023'; end if;
 if coalesce(p_min_order_qty,0)<=0 or coalesce(p_cost_price,0)<0 or coalesce(p_wholesale_price,0)<0 or coalesce(p_retail_price,0)<0 or coalesce(p_tax_rate,0)<0 or coalesce(p_tax_rate,0)>100 or (p_stock_qty is not null and p_stock_qty<0) then raise exception 'INVALID_B2B_PRODUCT_PRICING_OR_STOCK' using errcode='22023'; end if;
 if p_partner_id is not null and not exists(select 1 from private.platform_b2b_partners where id=p_partner_id and status<>'archived') then raise exception 'B2B_PARTNER_NOT_FOUND' using errcode='P0002'; end if;
 if p_id is null then
  v_sku:='B2B-'||lpad(nextval('private.platform_b2b_sku_seq')::text,6,'0');
  insert into private.platform_b2b_products(sku,partner_id,name_ar,name_en,description,category,unit,min_order_qty,cost_price,wholesale_price,retail_price,currency,tax_rate,stock_qty,country,city,status)
  values(v_sku,p_partner_id,trim(p_name_ar),trim(coalesce(p_name_en,'')),nullif(trim(coalesce(p_description,'')),''),coalesce(nullif(trim(p_category),''),'general'),coalesce(nullif(trim(p_unit),''),'piece'),p_min_order_qty,p_cost_price,p_wholesale_price,p_retail_price,coalesce(nullif(trim(p_currency),''),'SAR'),p_tax_rate,p_stock_qty,coalesce(nullif(trim(p_country),''),'SA'),nullif(trim(coalesce(p_city,'')),''),p_status) returning * into v_product;
  insert into private.admin_audit_logs(actor_auth_user_id,action_key,target_type,target_id,after_state) values(v_actor,'b2b.product.created','b2b_product',v_product.id::text,jsonb_build_object('sku',v_product.sku,'name',v_product.name_ar,'partner_id',v_product.partner_id,'status',v_product.status));
 else
  select to_jsonb(p) into v_before from private.platform_b2b_products p where p.id=p_id for update;
  if v_before is null then raise exception 'B2B_PRODUCT_NOT_FOUND' using errcode='P0002'; end if;
  update private.platform_b2b_products set partner_id=p_partner_id,name_ar=trim(p_name_ar),name_en=trim(coalesce(p_name_en,'')),description=nullif(trim(coalesce(p_description,'')),''),category=coalesce(nullif(trim(p_category),''),'general'),unit=coalesce(nullif(trim(p_unit),''),'piece'),min_order_qty=p_min_order_qty,cost_price=p_cost_price,wholesale_price=p_wholesale_price,retail_price=p_retail_price,currency=coalesce(nullif(trim(p_currency),''),'SAR'),tax_rate=p_tax_rate,stock_qty=p_stock_qty,country=coalesce(nullif(trim(p_country),''),'SA'),city=nullif(trim(coalesce(p_city,'')),''),status=p_status,updated_at=now() where id=p_id returning * into v_product;
  insert into private.admin_audit_logs(actor_auth_user_id,action_key,target_type,target_id,before_state,after_state) values(v_actor,'b2b.product.updated','b2b_product',v_product.id::text,v_before,jsonb_build_object('sku',v_product.sku,'name',v_product.name_ar,'partner_id',v_product.partner_id,'status',v_product.status));
 end if;
 return jsonb_build_object('id',v_product.id,'sku',v_product.sku,'name',v_product.name_ar,'status',v_product.status);
end; $$;

revoke all on function public.admin_get_b2b_store_snapshot(text,integer,integer) from public,anon;
grant execute on function public.admin_get_b2b_store_snapshot(text,integer,integer) to authenticated;
revoke all on function public.admin_save_b2b_partner(uuid,text,text,text,text,text,text,text,text,text,text,text,text,integer,numeric,text) from public,anon;
grant execute on function public.admin_save_b2b_partner(uuid,text,text,text,text,text,text,text,text,text,text,text,text,integer,numeric,text) to authenticated;
revoke all on function public.admin_save_b2b_product(uuid,uuid,text,text,text,text,text,numeric,numeric,numeric,numeric,text,numeric,numeric,text,text,text) from public,anon;
grant execute on function public.admin_save_b2b_product(uuid,uuid,text,text,text,text,text,numeric,numeric,numeric,numeric,text,numeric,numeric,text,text,text) to authenticated;

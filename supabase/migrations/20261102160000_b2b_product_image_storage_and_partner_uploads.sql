-- Public product imagery with authenticated, tenant-scoped upload and delete controls.
-- This migration is committed for review only; it is not applied to the connected production project.

alter table private.platform_b2b_products
  add column if not exists image_path text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'nekbaar-product-images',
  'nekbaar-product-images',
  true,
  5242880,
  array['image/jpeg','image/png','image/webp','image/avif']::text[]
)
on conflict (id) do update
set name = excluded.name,
    public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create or replace function private.b2b_partner_can_manage_product_images(p_partner_id_text text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $function$
declare
  v_partner_id uuid;
  v_uid uuid := (select auth.uid());
begin
  if v_uid is null
     or p_partner_id_text !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
    return false;
  end if;

  v_partner_id := p_partner_id_text::uuid;

  return exists (
    select 1
    from private.platform_b2b_partner_members m
    join private.platform_b2b_partners p on p.id = m.partner_id
    where m.partner_id = v_partner_id
      and m.auth_user_id = v_uid
      and m.status = 'active'
      and m.member_role in ('owner','manager','catalog_manager')
      and p.status = 'active'
  );
end;
$function$;

revoke all on function private.b2b_partner_can_manage_product_images(text) from public, anon;
grant execute on function private.b2b_partner_can_manage_product_images(text) to authenticated;

drop policy if exists nekbaar_product_images_upload on storage.objects;
create policy nekbaar_product_images_upload
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'nekbaar-product-images'
  and (
    (
      name ~ '^platform/[0-9a-fA-F-]{36}/[0-9a-fA-F-]{36}/[^/]+\.(jpg|jpeg|png|webp|avif)$'
      and split_part(name, '/', 2) = (select auth.uid())::text
      and private.admin_has_permission((select auth.uid()), 'store.products.manage')
    )
    or
    (
      name ~ '^partners/[0-9a-fA-F-]{36}/[0-9a-fA-F-]{36}/[0-9a-fA-F-]{36}/[^/]+\.(jpg|jpeg|png|webp|avif)$'
      and split_part(name, '/', 3) = (select auth.uid())::text
      and private.b2b_partner_can_manage_product_images(split_part(name, '/', 2))
    )
  )
);

drop policy if exists nekbaar_product_images_delete on storage.objects;
create policy nekbaar_product_images_delete
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'nekbaar-product-images'
  and (
    (
      name ~ '^platform/[0-9a-fA-F-]{36}/[0-9a-fA-F-]{36}/[^/]+\.(jpg|jpeg|png|webp|avif)$'
      and split_part(name, '/', 2) = (select auth.uid())::text
      and private.admin_has_permission((select auth.uid()), 'store.products.manage')
    )
    or
    (
      name ~ '^partners/[0-9a-fA-F-]{36}/[0-9a-fA-F-]{36}/[0-9a-fA-F-]{36}/[^/]+\.(jpg|jpeg|png|webp|avif)$'
      and split_part(name, '/', 3) = (select auth.uid())::text
      and private.b2b_partner_can_manage_product_images(split_part(name, '/', 2))
    )
  )
);

create or replace function public.admin_set_b2b_product_image(
  p_product_id uuid,
  p_image_path text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_uid uuid := (select auth.uid());
  v_product private.platform_b2b_products%rowtype;
begin
  if v_uid is null
     or not private.admin_has_permission(v_uid, 'store.products.manage') then
    raise exception 'ADMIN_PERMISSION_REQUIRED' using errcode = '42501';
  end if;

  select * into v_product
  from private.platform_b2b_products
  where id = p_product_id
  for update;

  if not found then
    raise exception 'B2B_PRODUCT_NOT_FOUND' using errcode = 'P0002';
  end if;

  if p_image_path is not null
     and p_image_path !~ ('^platform/' || v_uid::text || '/' || p_product_id::text || '/[^/]+\.(jpg|jpeg|png|webp|avif)$') then
    raise exception 'INVALID_PRODUCT_IMAGE_PATH' using errcode = '22023';
  end if;

  update private.platform_b2b_products
  set image_path = p_image_path, updated_at = now()
  where id = p_product_id;

  insert into private.admin_audit_logs(actor_auth_user_id, action_key, target_type, target_id, before_state, after_state)
  values (
    v_uid,
    'b2b.product.image_updated',
    'b2b_product',
    p_product_id::text,
    jsonb_build_object('image_path', v_product.image_path),
    jsonb_build_object('image_path', p_image_path)
  );

  return jsonb_build_object('product_id', p_product_id, 'image_path', p_image_path);
end;
$function$;

revoke all on function public.admin_set_b2b_product_image(uuid,text) from public, anon;
grant execute on function public.admin_set_b2b_product_image(uuid,text) to authenticated;

create or replace function public.vendor_set_b2b_product_image(
  p_product_id uuid,
  p_image_path text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_uid uuid := (select auth.uid());
  v_product private.platform_b2b_products%rowtype;
  v_email_confirmed_at timestamptz;
begin
  if v_uid is null then
    raise exception 'AUTHENTICATION_REQUIRED' using errcode = '42501';
  end if;

  select u.email_confirmed_at into v_email_confirmed_at
  from auth.users u
  where u.id = v_uid;

  if v_email_confirmed_at is null then
    raise exception 'VERIFIED_EMAIL_REQUIRED' using errcode = '42501';
  end if;

  select * into v_product
  from private.platform_b2b_products
  where id = p_product_id
  for update;

  if not found or v_product.partner_id is null
     or not private.b2b_partner_can_manage_product_images(v_product.partner_id::text) then
    raise exception 'PARTNER_PRODUCT_ACCESS_DENIED' using errcode = '42501';
  end if;

  if p_image_path is not null
     and p_image_path !~ (
       '^partners/' || v_product.partner_id::text || '/' || v_uid::text || '/' ||
       p_product_id::text || '/[^/]+\.(jpg|jpeg|png|webp|avif)$'
     ) then
    raise exception 'INVALID_PRODUCT_IMAGE_PATH' using errcode = '22023';
  end if;

  update private.platform_b2b_products
  set image_path = p_image_path, updated_at = now()
  where id = p_product_id;

  insert into private.admin_audit_logs(actor_auth_user_id, action_key, target_type, target_id, before_state, after_state)
  values (
    v_uid,
    'b2b.partner_product.image_updated',
    'b2b_product',
    p_product_id::text,
    jsonb_build_object('image_path', v_product.image_path),
    jsonb_build_object('image_path', p_image_path)
  );

  return jsonb_build_object('product_id', p_product_id, 'image_path', p_image_path);
end;
$function$;

revoke all on function public.vendor_set_b2b_product_image(uuid,text) from public, anon;
grant execute on function public.vendor_set_b2b_product_image(uuid,text) to authenticated;

create or replace function public.vendor_get_b2b_product_image_paths()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $function$
declare
  v_uid uuid := (select auth.uid());
  v_email_confirmed_at timestamptz;
  v_partner_id uuid;
begin
  if v_uid is null then
    raise exception 'AUTHENTICATION_REQUIRED' using errcode = '42501';
  end if;

  select u.email_confirmed_at into v_email_confirmed_at
  from auth.users u
  where u.id = v_uid;

  if v_email_confirmed_at is null then
    raise exception 'VERIFIED_EMAIL_REQUIRED' using errcode = '42501';
  end if;

  select m.partner_id into v_partner_id
  from private.platform_b2b_partner_members m
  join private.platform_b2b_partners p on p.id = m.partner_id
  where m.auth_user_id = v_uid
    and m.status = 'active'
    and p.status = 'active'
  order by m.created_at desc
  limit 1;

  if v_partner_id is null then
    raise exception 'PARTNER_MEMBERSHIP_REQUIRED' using errcode = '42501';
  end if;

  return (
    select coalesce(
      jsonb_agg(jsonb_build_object('id', pr.id, 'image_path', pr.image_path) order by pr.updated_at desc),
      '[]'::jsonb
    )
    from private.platform_b2b_products pr
    where pr.partner_id = v_partner_id
  );
end;
$function$;

revoke all on function public.vendor_get_b2b_product_image_paths() from public, anon;
grant execute on function public.vendor_get_b2b_product_image_paths() to authenticated;

create or replace function public.admin_get_b2b_store_snapshot(
  p_search text default null,
  p_limit integer default 50,
  p_offset integer default 0
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $function$
declare
  v_search text := nullif(trim(coalesce(p_search, '')), '');
  v_limit integer := greatest(1, least(coalesce(p_limit, 50), 100));
  v_offset integer := greatest(0, coalesce(p_offset, 0));
  v_result jsonb;
begin
  if auth.uid() is null
     or not exists (
       select 1 from private.platform_admins pa
       where pa.auth_user_id = (select auth.uid())
         and pa.is_active = true
         and pa.role_key = 'super_admin'
     ) then
    raise exception 'ADMIN_ACCESS_REQUIRED' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'metrics', jsonb_build_object(
      'partners_total', (select count(*) from private.platform_b2b_partners),
      'partners_active', (select count(*) from private.platform_b2b_partners where status = 'active'),
      'products_total', (select count(*) from private.platform_b2b_products),
      'products_active', (select count(*) from private.platform_b2b_products where status = 'active'),
      'products_low_stock', (select count(*) from private.platform_b2b_products where stock_qty is not null and stock_qty <= reorder_level and status = 'active'),
      'orders_total', (select count(*) from private.platform_b2b_orders),
      'orders_open', (select count(*) from private.platform_b2b_orders where status not in ('delivered', 'cancelled')),
      'quotes_pending', (select count(*) from private.platform_b2b_quotes where status in ('draft', 'sent')),
      'invoices_unpaid', (select count(*) from private.platform_b2b_invoices where status in ('issued', 'partially_paid', 'overdue'))
    ),
    'partners_total', (
      select count(*) from private.platform_b2b_partners
      where v_search is null or partner_code ilike '%' || v_search || '%'
        or legal_name ilike '%' || v_search || '%' or display_name ilike '%' || v_search || '%'
        or email ilike '%' || v_search || '%' or phone ilike '%' || v_search || '%'
    ),
    'partners', (
      select coalesce(jsonb_agg(to_jsonb(p) order by p.updated_at desc), '[]'::jsonb)
      from (
        select id, partner_code, legal_name, display_name, partner_type, tax_number, country, city,
          contact_name, email, phone, website, status, currency, payment_terms_days, credit_limit,
          notes, created_at, updated_at
        from private.platform_b2b_partners
        where v_search is null or partner_code ilike '%' || v_search || '%'
          or legal_name ilike '%' || v_search || '%' or display_name ilike '%' || v_search || '%'
          or email ilike '%' || v_search || '%' or phone ilike '%' || v_search || '%'
        order by updated_at desc limit v_limit offset v_offset
      ) p
    ),
    'products_total', (
      select count(*) from private.platform_b2b_products
      where v_search is null or sku ilike '%' || v_search || '%'
        or name_ar ilike '%' || v_search || '%' or name_en ilike '%' || v_search || '%'
        or category ilike '%' || v_search || '%'
    ),
    'products', (
      select coalesce(jsonb_agg(to_jsonb(p) order by p.updated_at desc), '[]'::jsonb)
      from (
        select pr.id, pr.sku, pr.partner_id, coalesce(bp.display_name, '—') partner_name,
          pr.name_ar, pr.name_en, pr.description, pr.category, pr.unit, pr.min_order_qty,
          pr.cost_price, pr.wholesale_price, pr.retail_price, pr.currency, pr.tax_rate,
          pr.stock_qty, pr.reserved_qty, pr.reorder_level, pr.price_tiers, pr.country,
          pr.city, pr.status, pr.image_path, pr.created_at, pr.updated_at
        from private.platform_b2b_products pr
        left join private.platform_b2b_partners bp on bp.id = pr.partner_id
        where v_search is null or pr.sku ilike '%' || v_search || '%'
          or pr.name_ar ilike '%' || v_search || '%' or pr.name_en ilike '%' || v_search || '%'
          or pr.category ilike '%' || v_search || '%'
        order by pr.updated_at desc limit v_limit offset v_offset
      ) p
    ),
    'orders', (
      select coalesce(jsonb_agg(to_jsonb(o) order by o.created_at desc), '[]'::jsonb)
      from (
        select o.id, o.order_no, o.status, o.currency, o.subtotal, o.tax_total, o.total,
          o.requested_delivery_date, o.created_at, b.display_name buyer_name
        from private.platform_b2b_orders o
        join private.platform_b2b_partners b on b.id = o.buyer_partner_id
        order by o.created_at desc limit 30
      ) o
    ),
    'quotes_total', (select count(*) from private.platform_b2b_quotes),
    'quotes', (
      select coalesce(jsonb_agg(to_jsonb(q) order by q.created_at desc), '[]'::jsonb)
      from (
        select q.id, q.quote_no, q.order_id, q.status, q.valid_until, q.subtotal, q.tax_total,
          q.total, q.terms, q.created_at, o.order_no, b.display_name buyer_name
        from private.platform_b2b_quotes q
        join private.platform_b2b_orders o on o.id = q.order_id
        join private.platform_b2b_partners b on b.id = o.buyer_partner_id
        order by q.created_at desc limit 30
      ) q
    ),
    'invoices_total', (select count(*) from private.platform_b2b_invoices),
    'invoices', (
      select coalesce(jsonb_agg(to_jsonb(i) order by i.created_at desc), '[]'::jsonb)
      from (
        select i.id, i.invoice_no, i.order_id, i.status, i.currency, i.total, i.amount_paid,
          (i.total - i.amount_paid) balance_due, i.due_date, i.issued_at, i.created_at,
          o.order_no, b.display_name buyer_name
        from private.platform_b2b_invoices i
        join private.platform_b2b_orders o on o.id = i.order_id
        join private.platform_b2b_partners b on b.id = o.buyer_partner_id
        order by i.created_at desc limit 30
      ) i
    )
  ) into v_result;

  return v_result;
end;
$function$;

revoke all on function public.admin_get_b2b_store_snapshot(text, integer, integer) from public, anon;
grant execute on function public.admin_get_b2b_store_snapshot(text, integer, integer) to authenticated;

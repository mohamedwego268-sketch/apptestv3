create or replace function public.vendor_get_b2b_portal_snapshot()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_email text;
  v_partner private.platform_b2b_partners%rowtype;
  v_products jsonb;
  v_orders jsonb;
  v_metrics jsonb;
begin
  select lower(trim(u.email)) into v_email
  from auth.users u
  where u.id = auth.uid() and u.email_confirmed_at is not null;
  if v_email is null then raise exception 'A verified partner account is required'; end if;

  select p.* into v_partner
  from private.platform_b2b_partners p
  where lower(trim(p.email)) = v_email and p.status = 'active'
  order by p.created_at desc limit 1;
  if not found then raise exception 'No active partner account is linked to this email'; end if;

  select coalesce(jsonb_agg(to_jsonb(p) order by p.created_at desc), '[]'::jsonb)
  into v_products
  from private.platform_b2b_products p where p.partner_id = v_partner.id;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', q.id, 'order_no', q.order_no, 'status', q.status,
      'currency', q.currency, 'vendor_total', q.vendor_total,
      'created_at', q.created_at, 'buyer_name', q.buyer_name, 'items', q.items
    ) order by q.created_at desc
  ), '[]'::jsonb)
  into v_orders
  from (
    select o.id, o.order_no, o.status, o.currency,
      sum(oi.line_total)::numeric as vendor_total, o.created_at,
      coalesce(bp.display_name, bp.legal_name, 'عميل') as buyer_name,
      jsonb_agg(jsonb_build_object('product_name', coalesce(pr.name_ar, oi.description), 'quantity', oi.quantity)) as items
    from private.platform_b2b_orders o
    join private.platform_b2b_order_items oi on oi.order_id = o.id
    join private.platform_b2b_products pr on pr.id = oi.product_id
    left join private.platform_b2b_partners bp on bp.id = o.buyer_partner_id
    where pr.partner_id = v_partner.id
    group by o.id, bp.display_name, bp.legal_name
  ) q;

  select jsonb_build_object(
    'products_total', count(*),
    'products_active', count(*) filter (where p.status = 'active'),
    'orders_total', (select count(*) from jsonb_array_elements(v_orders)),
    'orders_open', (
      select count(*) from jsonb_array_elements(v_orders) as item(value)
      where coalesce(item.value->>'status', '') not in ('delivered', 'cancelled')
    )
  ) into v_metrics
  from private.platform_b2b_products p where p.partner_id = v_partner.id;

  return jsonb_build_object(
    'partner', to_jsonb(v_partner), 'member_role', 'owner',
    'metrics', coalesce(v_metrics, jsonb_build_object('products_total', 0, 'products_active', 0, 'orders_total', 0, 'orders_open', 0)),
    'products', v_products, 'orders', v_orders
  );
end;
$$;
revoke all on function public.vendor_get_b2b_portal_snapshot() from public, anon;
grant execute on function public.vendor_get_b2b_portal_snapshot() to authenticated;

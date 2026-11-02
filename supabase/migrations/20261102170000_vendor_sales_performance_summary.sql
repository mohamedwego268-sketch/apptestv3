-- Read-only, partner-scoped sales summary for the existing verified-email portal.
-- Does not change partner membership, roles, RLS, or production data.

create or replace function public.vendor_get_b2b_sales_summary()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $function$
declare
  v_uid uuid := (select auth.uid());
  v_email text;
  v_partner private.platform_b2b_partners%rowtype;
  v_result jsonb;
begin
  if v_uid is null then
    raise exception 'AUTHENTICATION_REQUIRED' using errcode = '42501';
  end if;

  select lower(trim(u.email))
  into v_email
  from auth.users u
  where u.id = v_uid
    and u.email_confirmed_at is not null;

  if v_email is null then
    raise exception 'VERIFIED_PARTNER_ACCOUNT_REQUIRED' using errcode = '42501';
  end if;

  select p.*
  into v_partner
  from private.platform_b2b_partners p
  where lower(trim(p.email)) = v_email
    and p.status = 'active'
  order by p.created_at desc
  limit 1;

  if not found then
    raise exception 'ACTIVE_PARTNER_ACCOUNT_NOT_FOUND' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'partner_id', v_partner.id,
    'currency', v_partner.currency,
    'vendor_sales_total', coalesce((
      select sum(oi.line_total)::numeric(14,2)
      from private.platform_b2b_order_items oi
      join private.platform_b2b_products pr on pr.id = oi.product_id
      join private.platform_b2b_orders o on o.id = oi.order_id
      where pr.partner_id = v_partner.id
        and o.status in ('approved','processing','shipped','delivered')
    ), 0),
    'vendor_delivered_total', coalesce((
      select sum(oi.line_total)::numeric(14,2)
      from private.platform_b2b_order_items oi
      join private.platform_b2b_products pr on pr.id = oi.product_id
      join private.platform_b2b_orders o on o.id = oi.order_id
      where pr.partner_id = v_partner.id
        and o.status = 'delivered'
    ), 0),
    'vendor_confirmed_orders', (
      select count(distinct o.id)
      from private.platform_b2b_order_items oi
      join private.platform_b2b_products pr on pr.id = oi.product_id
      join private.platform_b2b_orders o on o.id = oi.order_id
      where pr.partner_id = v_partner.id
        and o.status in ('approved','processing','shipped','delivered')
    ),
    'vendor_open_orders', (
      select count(distinct o.id)
      from private.platform_b2b_order_items oi
      join private.platform_b2b_products pr on pr.id = oi.product_id
      join private.platform_b2b_orders o on o.id = oi.order_id
      where pr.partner_id = v_partner.id
        and o.status in ('approved','processing','shipped')
    )
  )
  into v_result;

  return v_result;
end;
$function$;

revoke all on function public.vendor_get_b2b_sales_summary() from public, anon;
grant execute on function public.vendor_get_b2b_sales_summary() to authenticated;

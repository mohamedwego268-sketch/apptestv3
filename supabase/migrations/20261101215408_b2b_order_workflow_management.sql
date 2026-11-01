create or replace function public.admin_update_b2b_order_status(p_order_id uuid,p_status text,p_notes text default null)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare v_actor uuid:=auth.uid(); v_before jsonb; v_order private.platform_b2b_orders%rowtype; v_allowed boolean:=false;
begin
 if v_actor is null or not exists(select 1 from private.platform_admins pa where pa.auth_user_id=v_actor and pa.is_active=true and pa.role_key='super_admin') then raise exception 'ADMIN_ACCESS_REQUIRED' using errcode='42501'; end if;
 if p_status not in ('inquiry','quote_sent','approved','processing','shipped','delivered','cancelled') then raise exception 'INVALID_B2B_ORDER_STATUS' using errcode='22023'; end if;
 select to_jsonb(o) into v_before from private.platform_b2b_orders o where o.id=p_order_id for update;
 if v_before is null then raise exception 'B2B_ORDER_NOT_FOUND' using errcode='P0002'; end if;
 select * into v_order from private.platform_b2b_orders where id=p_order_id;
 v_allowed:=case v_order.status when 'inquiry' then p_status in ('quote_sent','cancelled') when 'quote_sent' then p_status in ('approved','cancelled') when 'approved' then p_status in ('processing','cancelled') when 'processing' then p_status in ('shipped','cancelled') when 'shipped' then p_status='delivered' else false end;
 if not v_allowed then raise exception 'INVALID_B2B_ORDER_TRANSITION: % -> %',v_order.status,p_status using errcode='22023'; end if;
 update private.platform_b2b_orders set status=p_status,notes=case when nullif(trim(coalesce(p_notes,'')),'') is null then notes else concat_ws(E'\n',notes,trim(p_notes)) end,updated_at=now() where id=p_order_id returning * into v_order;
 insert into private.admin_audit_logs(actor_auth_user_id,action_key,target_type,target_id,before_state,after_state) values(v_actor,'b2b.order.status_changed','b2b_order',v_order.id::text,v_before,jsonb_build_object('order_no',v_order.order_no,'status',v_order.status));
 return jsonb_build_object('id',v_order.id,'order_no',v_order.order_no,'status',v_order.status);
end; $$;
revoke all on function public.admin_update_b2b_order_status(uuid,text,text) from public,anon;
grant execute on function public.admin_update_b2b_order_status(uuid,text,text) to authenticated;

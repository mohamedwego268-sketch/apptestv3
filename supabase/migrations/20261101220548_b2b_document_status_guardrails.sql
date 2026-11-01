CREATE OR REPLACE FUNCTION public.admin_update_b2b_document_status(p_entity text, p_id uuid, p_status text, p_note text DEFAULT NULL::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_actor uuid:=(select auth.uid());v_before jsonb;v_target text;
begin
 if v_actor is null or not exists(select 1 from private.platform_admins pa where pa.auth_user_id=v_actor and pa.is_active=true and pa.role_key='super_admin') then raise exception 'ADMIN_ACCESS_REQUIRED' using errcode='42501'; end if;
 if p_entity='order' then
  perform public.admin_update_b2b_order_status(p_id,p_status,p_note);
  return true;
 elsif p_entity='quote' then
  if p_status not in ('draft','sent','accepted','rejected','expired') then raise exception 'INVALID_B2B_QUOTE_STATUS' using errcode='22023'; end if;
  select to_jsonb(q) into v_before from private.platform_b2b_quotes q where q.id=p_id for update;
  if v_before is null then raise exception 'B2B_QUOTE_NOT_FOUND' using errcode='P0002'; end if;
  update private.platform_b2b_quotes set status=p_status,updated_at=now() where id=p_id;
  v_target:='b2b_quote';
 elsif p_entity='invoice' then
  if p_status not in ('draft','issued','overdue','void') then raise exception 'INVALID_B2B_INVOICE_STATUS_USE_PAYMENT_RPC' using errcode='22023'; end if;
  select to_jsonb(i) into v_before from private.platform_b2b_invoices i where i.id=p_id for update;
  if v_before is null then raise exception 'B2B_INVOICE_NOT_FOUND' using errcode='P0002'; end if;
  if p_status='void' and exists(select 1 from private.platform_b2b_invoices i where i.id=p_id and i.amount_paid>0) then raise exception 'PAID_INVOICE_CANNOT_BE_VOIDED' using errcode='22023'; end if;
  update private.platform_b2b_invoices set status=p_status,issued_at=case when p_status='issued' then coalesce(issued_at,now()) else issued_at end,updated_at=now() where id=p_id;
  v_target:='b2b_invoice';
 else raise exception 'INVALID_B2B_ENTITY' using errcode='22023';
 end if;
 insert into private.admin_audit_logs(actor_auth_user_id,action_key,target_type,target_id,before_state,after_state,metadata)
 values(v_actor,'b2b.'||p_entity||'.status_updated',v_target,p_id::text,v_before,jsonb_build_object('status',p_status),jsonb_build_object('note',nullif(trim(coalesce(p_note,'')),'')));
 return true;
end; $function$;
revoke all on function public.admin_update_b2b_document_status(text,uuid,text,text) from public,anon;
grant execute on function public.admin_update_b2b_document_status(text,uuid,text,text) to authenticated;

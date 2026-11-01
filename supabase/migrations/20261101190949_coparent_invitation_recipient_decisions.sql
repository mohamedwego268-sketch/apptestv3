-- Co-parent invitation inbox and recipient-controlled decision workflow.
ALTER TABLE public.co_parent_pairings DROP CONSTRAINT IF EXISTS co_parent_pairings_status_check;
ALTER TABLE public.co_parent_pairings ADD CONSTRAINT co_parent_pairings_status_check
CHECK (status = ANY (ARRAY['pending'::text,'accepted'::text,'declined'::text,'revoked'::text,'expired'::text]));
CREATE OR REPLACE FUNCTION public.get_pending_coparent_invitations_for_current_user()
RETURNS TABLE(invitation_id uuid,inviter_name text,family_name text,partner_name text,partner_role text,expires_at timestamptz,invited_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $function$
DECLARE v_uid uuid := auth.uid(); v_email text; v_confirmed boolean; v_role text;
BEGIN
 IF v_uid IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED'; END IF;
 SELECT lower(trim(u.email)),u.email_confirmed_at IS NOT NULL INTO v_email,v_confirmed FROM auth.users u WHERE u.id=v_uid;
 IF v_email IS NULL OR NOT COALESCE(v_confirmed,false) THEN RAISE EXCEPTION 'IDENTITY_NOT_VERIFIED'; END IF;
 SELECT lower(trim(p.role)) INTO v_role FROM public.users p WHERE p.auth_user_id=v_uid;
 IF v_role NOT IN ('father','mother') THEN RETURN; END IF;
 RETURN QUERY SELECT cp.id,COALESCE(inviter.full_name,'ولي الأمر'),f.family_name,cp.partner_name,cp.partner_role,cp.expires_at,cp.linked_at
 FROM public.co_parent_pairings cp JOIN public.families f ON f.id=cp.family_id
 LEFT JOIN public.users inviter ON inviter.id=cp.invited_by_user_id
 WHERE lower(trim(cp.partner_email))=v_email AND lower(cp.partner_role)=v_role
 AND cp.status='pending' AND cp.verified=false AND cp.expires_at>now()
 ORDER BY cp.linked_at DESC;
END;$function$;
CREATE OR REPLACE FUNCTION public.respond_to_coparent_invitation(p_invitation_id uuid,p_accept boolean)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $function$
DECLARE v_uid uuid:=auth.uid(); v_email text; v_confirmed boolean; v_role text; v_inv public.co_parent_pairings%ROWTYPE; v_result jsonb;
BEGIN
 IF v_uid IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED'; END IF;
 SELECT lower(trim(u.email)),u.email_confirmed_at IS NOT NULL INTO v_email,v_confirmed FROM auth.users u WHERE u.id=v_uid;
 IF v_email IS NULL OR NOT COALESCE(v_confirmed,false) THEN RAISE EXCEPTION 'IDENTITY_NOT_VERIFIED'; END IF;
 SELECT lower(trim(p.role)) INTO v_role FROM public.users p WHERE p.auth_user_id=v_uid;
 IF v_role NOT IN ('father','mother') THEN RAISE EXCEPTION 'PARENT_ROLE_REQUIRED'; END IF;
 SELECT cp.* INTO v_inv FROM public.co_parent_pairings cp
 WHERE cp.id=p_invitation_id AND lower(trim(cp.partner_email))=v_email AND lower(cp.partner_role)=v_role
 AND cp.status='pending' AND cp.verified=false AND cp.expires_at>now() FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'INVITATION_NOT_FOUND'; END IF;
 IF p_accept THEN
   v_result:=private.accept_family_invitation_impl(v_inv.pairing_token_hash);
   RETURN v_result || jsonb_build_object('decision','accepted');
 END IF;
 UPDATE public.co_parent_pairings SET status='declined' WHERE id=v_inv.id AND status='pending';
 RETURN jsonb_build_object('accepted',false,'declined',true,'decision','declined');
END;$function$;
REVOKE ALL ON FUNCTION public.get_pending_coparent_invitations_for_current_user() FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.respond_to_coparent_invitation(uuid,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_pending_coparent_invitations_for_current_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.respond_to_coparent_invitation(uuid,boolean) TO authenticated;
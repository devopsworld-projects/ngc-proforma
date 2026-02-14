
-- Replace delete_user function to only delete business data, NOT auth.users
CREATE OR REPLACE FUNCTION public.delete_user(target_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Only allow admins to call this function
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;

  -- Prevent deleting yourself
  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot delete your own account';
  END IF;

  -- Delete user data in order (respecting foreign keys)
  DELETE FROM public.invoice_items 
  WHERE invoice_id IN (SELECT id FROM public.invoices WHERE user_id = target_user_id);
  
  DELETE FROM public.addresses 
  WHERE customer_id IN (SELECT id FROM public.customers WHERE user_id = target_user_id);
  
  DELETE FROM public.invoices WHERE user_id = target_user_id;
  DELETE FROM public.customers WHERE user_id = target_user_id;
  DELETE FROM public.products WHERE user_id = target_user_id;
  DELETE FROM public.company_settings WHERE user_id = target_user_id;
  DELETE FROM public.pdf_template_settings WHERE user_id = target_user_id;
  DELETE FROM public.pricing_settings WHERE user_id = target_user_id;
  DELETE FROM public.user_sessions WHERE user_id = target_user_id;
  DELETE FROM public.user_roles WHERE user_id = target_user_id;
  DELETE FROM public.profiles WHERE id = target_user_id;

  -- NOTE: auth.users deletion is now handled via Edge Function using Admin API

  RETURN TRUE;
END;
$function$;

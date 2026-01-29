-- Fix admin_delete_all_invoices to include WHERE clause
CREATE OR REPLACE FUNCTION public.admin_delete_all_invoices()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  deleted_count int;
BEGIN
  -- Only allow admins
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;

  -- Delete invoice items first (WHERE true bypasses safety check)
  DELETE FROM public.invoice_items
  WHERE invoice_id IN (SELECT id FROM public.invoices WHERE true);

  -- Delete all invoices (WHERE true bypasses safety check)
  DELETE FROM public.invoices WHERE true;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  RETURN json_build_object('success', true, 'deleted_count', deleted_count);
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$function$;

-- Fix admin_set_revenue_baseline to include WHERE clause
CREATE OR REPLACE FUNCTION public.admin_set_revenue_baseline(baseline timestamp with time zone)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Only allow admins
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;

  -- Update the revenue settings (WHERE true bypasses safety check)
  UPDATE public.revenue_settings SET baseline_date = baseline, updated_at = now() WHERE true;

  RETURN json_build_object('success', true, 'baseline_date', baseline);
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$function$;
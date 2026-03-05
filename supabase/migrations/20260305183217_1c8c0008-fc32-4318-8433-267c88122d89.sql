
CREATE OR REPLACE FUNCTION public.get_org_performance_stats()
RETURNS TABLE(
  user_id uuid,
  full_name text,
  email text,
  proformas_created bigint,
  proformas_sent bigint,
  proformas_paid bigint,
  total_revenue numeric,
  customers_added bigint,
  products_added bigint,
  session_count bigint,
  last_login timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;

  RETURN QUERY
  SELECT
    p.id as user_id,
    p.full_name,
    u.email::TEXT,
    COALESCE((SELECT COUNT(*) FROM public.invoices i WHERE i.user_id = p.id AND i.deleted_at IS NULL), 0) as proformas_created,
    COALESCE((SELECT COUNT(*) FROM public.invoices i WHERE i.user_id = p.id AND i.status = 'sent' AND i.deleted_at IS NULL), 0) as proformas_sent,
    COALESCE((SELECT COUNT(*) FROM public.invoices i WHERE i.user_id = p.id AND i.status = 'paid' AND i.deleted_at IS NULL), 0) as proformas_paid,
    COALESCE((SELECT SUM(i.grand_total) FROM public.invoices i WHERE i.user_id = p.id AND i.status = 'paid' AND i.deleted_at IS NULL), 0) as total_revenue,
    COALESCE((SELECT COUNT(*) FROM public.customers c WHERE c.user_id = p.id), 0) as customers_added,
    COALESCE((SELECT COUNT(*) FROM public.products pr WHERE pr.user_id = p.id), 0) as products_added,
    COALESCE((SELECT COUNT(*) FROM public.user_sessions s WHERE s.user_id = p.id), 0) as session_count,
    (SELECT MAX(s.logged_in_at) FROM public.user_sessions s WHERE s.user_id = p.id) as last_login
  FROM public.profiles p
  JOIN auth.users u ON p.id = u.id
  WHERE p.is_approved = true
    AND NOT EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.id AND ur.role = 'admin')
  ORDER BY proformas_created DESC;
END;
$$;

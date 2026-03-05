
-- Function: Get organization performance stats per user
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
  ORDER BY proformas_created DESC;
END;
$$;

-- Function: Get top selling products across org
CREATE OR REPLACE FUNCTION public.get_top_products_stats(limit_count int DEFAULT 20)
RETURNS TABLE(
  product_name text,
  total_quantity numeric,
  total_amount numeric,
  invoice_count bigint,
  seller_name text
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
    ii.description as product_name,
    SUM(ii.quantity) as total_quantity,
    SUM(ii.amount) as total_amount,
    COUNT(DISTINCT ii.invoice_id) as invoice_count,
    COALESCE(pr.full_name, 'Unknown') as seller_name
  FROM public.invoice_items ii
  JOIN public.invoices i ON ii.invoice_id = i.id
  LEFT JOIN public.profiles pr ON i.user_id = pr.id
  WHERE i.deleted_at IS NULL
  GROUP BY ii.description, pr.full_name
  ORDER BY total_quantity DESC
  LIMIT limit_count;
END;
$$;

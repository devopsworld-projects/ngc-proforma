-- Drop existing function first to allow return type change
DROP FUNCTION IF EXISTS public.get_admin_user_stats();

-- Recreate with new return type including approval status
CREATE OR REPLACE FUNCTION public.get_admin_user_stats()
RETURNS TABLE(
  user_id uuid, 
  full_name text, 
  email text, 
  created_at timestamp with time zone, 
  is_admin boolean, 
  invoice_count bigint, 
  total_revenue numeric, 
  customer_count bigint,
  is_approved boolean,
  email_confirmed_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow admins to call this function
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;

  RETURN QUERY
  SELECT 
    p.id as user_id,
    p.full_name,
    u.email::TEXT,
    p.created_at,
    EXISTS(SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.id AND ur.role = 'admin') as is_admin,
    COALESCE((SELECT COUNT(*) FROM public.invoices i WHERE i.user_id = p.id), 0) as invoice_count,
    COALESCE((SELECT SUM(grand_total) FROM public.invoices i WHERE i.user_id = p.id), 0) as total_revenue,
    COALESCE((SELECT COUNT(*) FROM public.customers c WHERE c.user_id = p.id), 0) as customer_count,
    p.is_approved,
    u.email_confirmed_at
  FROM public.profiles p
  JOIN auth.users u ON p.id = u.id
  ORDER BY p.created_at DESC;
END;
$$;
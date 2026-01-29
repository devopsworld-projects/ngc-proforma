-- Create table to store revenue baseline configuration
CREATE TABLE public.revenue_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    baseline_date timestamp with time zone NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Only one row should exist (singleton pattern)
INSERT INTO public.revenue_settings (id) VALUES (gen_random_uuid());

-- Enable RLS
ALTER TABLE public.revenue_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can view and modify revenue settings
CREATE POLICY "Admins can view revenue_settings"
ON public.revenue_settings FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update revenue_settings"
ON public.revenue_settings FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Create function to delete all invoices (admin only)
CREATE OR REPLACE FUNCTION public.admin_delete_all_invoices()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  deleted_count int;
BEGIN
  -- Only allow admins
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;

  -- Delete invoice items first
  DELETE FROM public.invoice_items
  WHERE invoice_id IN (SELECT id FROM public.invoices);

  -- Delete all invoices
  DELETE FROM public.invoices;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  RETURN json_build_object('success', true, 'deleted_count', deleted_count);
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Create function to archive all invoices (admin only)
CREATE OR REPLACE FUNCTION public.admin_archive_all_invoices()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  archived_count int;
BEGIN
  -- Only allow admins
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;

  -- Update all invoices to cancelled/archived status
  UPDATE public.invoices SET status = 'cancelled' WHERE status != 'cancelled';
  GET DIAGNOSTICS archived_count = ROW_COUNT;

  RETURN json_build_object('success', true, 'archived_count', archived_count);
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Create function to set revenue baseline date (admin only)
CREATE OR REPLACE FUNCTION public.admin_set_revenue_baseline(baseline timestamp with time zone)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only allow admins
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;

  -- Update the revenue settings
  UPDATE public.revenue_settings SET baseline_date = baseline, updated_at = now();

  RETURN json_build_object('success', true, 'baseline_date', baseline);
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Update the get_admin_user_stats function to respect baseline date
CREATE OR REPLACE FUNCTION public.get_admin_user_stats()
RETURNS TABLE(user_id uuid, full_name text, email text, created_at timestamp with time zone, is_admin boolean, invoice_count bigint, total_revenue numeric, customer_count bigint, is_approved boolean, email_confirmed_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  baseline_dt timestamp with time zone;
BEGIN
  -- Only allow admins
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;

  -- Get baseline date
  SELECT rs.baseline_date INTO baseline_dt FROM public.revenue_settings rs LIMIT 1;

  RETURN QUERY
  SELECT 
    p.id as user_id,
    p.full_name,
    u.email::TEXT,
    p.created_at,
    EXISTS(SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.id AND ur.role = 'admin') as is_admin,
    COALESCE((
      SELECT COUNT(*) FROM public.invoices i 
      WHERE i.user_id = p.id 
      AND i.status != 'cancelled'
      AND (baseline_dt IS NULL OR i.created_at >= baseline_dt)
    ), 0) as invoice_count,
    COALESCE((
      SELECT SUM(grand_total) FROM public.invoices i 
      WHERE i.user_id = p.id 
      AND i.status != 'cancelled'
      AND (baseline_dt IS NULL OR i.created_at >= baseline_dt)
    ), 0) as total_revenue,
    COALESCE((SELECT COUNT(*) FROM public.customers c WHERE c.user_id = p.id), 0) as customer_count,
    p.is_approved,
    u.email_confirmed_at
  FROM public.profiles p
  JOIN auth.users u ON p.id = u.id
  ORDER BY p.created_at DESC;
END;
$$;
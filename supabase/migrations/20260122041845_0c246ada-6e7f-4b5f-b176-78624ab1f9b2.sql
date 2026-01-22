-- Admin-specific RLS policies for viewing all data

-- Allow admins to view all profiles
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to view all user_roles
CREATE POLICY "Admins can view all user_roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to insert user_roles (for promoting users)
CREATE POLICY "Admins can insert user_roles"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow admins to delete user_roles (for demoting users)
CREATE POLICY "Admins can delete user_roles"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to view all customers
CREATE POLICY "Admins can view all customers"
  ON public.customers FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to view all invoices
CREATE POLICY "Admins can view all invoices"
  ON public.invoices FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to view all invoice items
CREATE POLICY "Admins can view all invoice_items"
  ON public.invoice_items FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to view all products
CREATE POLICY "Admins can view all products"
  ON public.products FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to view all company settings
CREATE POLICY "Admins can view all company_settings"
  ON public.company_settings FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Function to get user stats for admin dashboard (security definer to bypass RLS)
CREATE OR REPLACE FUNCTION public.get_admin_user_stats()
RETURNS TABLE (
  user_id UUID,
  full_name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ,
  is_admin BOOLEAN,
  invoice_count BIGINT,
  total_revenue NUMERIC,
  customer_count BIGINT
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
    COALESCE((SELECT COUNT(*) FROM public.customers c WHERE c.user_id = p.id), 0) as customer_count
  FROM public.profiles p
  JOIN auth.users u ON p.id = u.id
  ORDER BY p.created_at DESC;
END;
$$;

-- Function to get user invoices for admin dashboard
CREATE OR REPLACE FUNCTION public.get_user_invoices_admin(target_user_id UUID)
RETURNS TABLE (
  id UUID,
  invoice_no TEXT,
  date DATE,
  status TEXT,
  grand_total NUMERIC,
  customer_name TEXT,
  created_at TIMESTAMPTZ
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
    i.id,
    i.invoice_no,
    i.date,
    i.status,
    i.grand_total,
    c.name as customer_name,
    i.created_at
  FROM public.invoices i
  LEFT JOIN public.customers c ON i.customer_id = c.id
  WHERE i.user_id = target_user_id
  ORDER BY i.created_at DESC
  LIMIT 50;
END;
$$;

-- Function to promote/demote user admin role
CREATE OR REPLACE FUNCTION public.toggle_admin_role(target_user_id UUID, make_admin BOOLEAN)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow admins to call this function
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;

  -- Prevent removing own admin role
  IF target_user_id = auth.uid() AND NOT make_admin THEN
    RAISE EXCEPTION 'Cannot remove your own admin role';
  END IF;

  IF make_admin THEN
    -- Add admin role if not exists
    INSERT INTO public.user_roles (user_id, role)
    VALUES (target_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    -- Remove admin role
    DELETE FROM public.user_roles
    WHERE user_id = target_user_id AND role = 'admin';
  END IF;

  RETURN TRUE;
END;
$$;
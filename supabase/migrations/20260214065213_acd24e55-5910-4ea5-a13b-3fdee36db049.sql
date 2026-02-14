
-- Fix customers: drop overly permissive policy, keep admin + owner access
DROP POLICY IF EXISTS "Authenticated users can read all customers" ON public.customers;

CREATE POLICY "Users can read own customers"
  ON public.customers FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Fix products: same issue
DROP POLICY IF EXISTS "Authenticated users can view all products" ON public.products;

CREATE POLICY "Users can view own products"
  ON public.products FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

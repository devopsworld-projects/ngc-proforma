-- Fix products table RLS policy that allows public access
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "All users can view all products" ON public.products;

-- Create a new policy that requires authentication
-- Authenticated users can view all products (shared catalog for invoicing)
CREATE POLICY "Authenticated users can view all products" 
ON public.products 
FOR SELECT 
TO authenticated
USING (true);

-- Note: The existing RLS policies for profiles, customers, and pdf_template_settings 
-- already use auth.uid() comparisons which inherently require authentication.
-- auth.uid() returns NULL for anonymous users, so these policies already deny anonymous access.
-- Allow all authenticated users to view all products (global product visibility)
-- Drop the existing owner-only SELECT policy
DROP POLICY IF EXISTS "Users can read own products" ON public.products;

-- Create new policy allowing all authenticated users to view all products
CREATE POLICY "All users can view all products" 
ON public.products 
FOR SELECT 
TO authenticated
USING (true);

-- Note: INSERT, UPDATE, DELETE policies remain owner-scoped for security
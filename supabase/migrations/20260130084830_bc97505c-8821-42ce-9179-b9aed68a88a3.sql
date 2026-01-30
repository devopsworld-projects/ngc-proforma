-- Drop the existing restrictive SELECT policy for users
DROP POLICY IF EXISTS "Users can read own customers" ON public.customers;

-- Create new policy allowing all authenticated users to read all customers
CREATE POLICY "Authenticated users can read all customers"
ON public.customers
FOR SELECT
TO authenticated
USING (true);
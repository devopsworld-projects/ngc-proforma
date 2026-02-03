-- Allow admins to update any product
CREATE POLICY "Admins can update all products" 
ON public.products 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'));

-- Allow admins to delete any product
CREATE POLICY "Admins can delete all products" 
ON public.products 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'));
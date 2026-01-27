-- Drop the inventory-related tables in the correct order (respecting foreign keys)

-- 1. Drop product_serials first (references products, invoices, and suppliers)
DROP TABLE IF EXISTS public.product_serials CASCADE;

-- 2. Drop stock_movements (references products)
DROP TABLE IF EXISTS public.stock_movements CASCADE;

-- 3. Drop service_tickets (references customers)
DROP TABLE IF EXISTS public.service_tickets CASCADE;

-- 4. Drop suppliers (was referenced by product_serials, already dropped)
DROP TABLE IF EXISTS public.suppliers CASCADE;

-- 5. Update the delete_user function to remove references to these tables
CREATE OR REPLACE FUNCTION public.delete_user(target_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Only allow admins to call this function
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;

  -- Prevent deleting yourself
  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot delete your own account';
  END IF;

  -- Delete user data in order (respecting foreign keys)
  -- 1. Delete invoice items (via invoices)
  DELETE FROM public.invoice_items 
  WHERE invoice_id IN (SELECT id FROM public.invoices WHERE user_id = target_user_id);
  
  -- 2. Delete addresses (via customers)
  DELETE FROM public.addresses 
  WHERE customer_id IN (SELECT id FROM public.customers WHERE user_id = target_user_id);
  
  -- 3. Delete invoices
  DELETE FROM public.invoices WHERE user_id = target_user_id;
  
  -- 4. Delete customers
  DELETE FROM public.customers WHERE user_id = target_user_id;
  
  -- 5. Delete products
  DELETE FROM public.products WHERE user_id = target_user_id;
  
  -- 6. Delete company settings
  DELETE FROM public.company_settings WHERE user_id = target_user_id;
  
  -- 7. Delete user roles
  DELETE FROM public.user_roles WHERE user_id = target_user_id;
  
  -- 8. Delete profile
  DELETE FROM public.profiles WHERE id = target_user_id;
  
  -- 9. Delete from auth.users (this removes the actual auth account)
  DELETE FROM auth.users WHERE id = target_user_id;

  RETURN TRUE;
END;
$function$;
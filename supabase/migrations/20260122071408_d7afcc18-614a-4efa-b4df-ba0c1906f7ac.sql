-- Add unique constraint on sku for the products table (per user)
-- First, we need a composite unique constraint on user_id + sku to allow same SKU for different users
CREATE UNIQUE INDEX IF NOT EXISTS products_user_sku_unique 
ON public.products (user_id, sku) 
WHERE sku IS NOT NULL;
-- Add unique constraint on (user_id, sku) for upsert operations
-- First, handle any existing duplicates by keeping only the most recent one
DELETE FROM public.products a
USING public.products b
WHERE a.user_id = b.user_id 
  AND a.sku = b.sku 
  AND a.sku IS NOT NULL
  AND a.created_at < b.created_at;

-- Now create the unique index (only for non-null SKUs)
CREATE UNIQUE INDEX IF NOT EXISTS products_user_id_sku_unique 
ON public.products (user_id, sku) 
WHERE sku IS NOT NULL;
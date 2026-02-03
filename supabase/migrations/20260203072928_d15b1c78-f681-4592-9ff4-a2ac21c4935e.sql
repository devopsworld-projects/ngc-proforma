-- Add unique constraint on (user_id, sku) for products table to enable bulk upsert
-- First, handle any existing duplicates by keeping the most recent one
WITH duplicates AS (
  SELECT id, ROW_NUMBER() OVER (
    PARTITION BY user_id, sku 
    ORDER BY updated_at DESC, created_at DESC
  ) as rn
  FROM products
  WHERE sku IS NOT NULL AND user_id IS NOT NULL
)
UPDATE products 
SET sku = sku || '_dup_' || gen_random_uuid()::text 
WHERE id IN (SELECT id FROM duplicates WHERE rn > 1);

-- Create unique index (allows NULL values in sku column)
CREATE UNIQUE INDEX IF NOT EXISTS products_user_id_sku_unique 
ON products (user_id, sku) 
WHERE sku IS NOT NULL;
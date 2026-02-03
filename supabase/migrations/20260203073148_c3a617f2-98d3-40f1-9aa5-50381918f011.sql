-- Drop the partial index (it doesn't work with PostgREST upsert)
DROP INDEX IF EXISTS products_user_id_sku_unique;

-- For products with NULL SKU, we need to handle them differently
-- First, give unique SKUs to products that have NULL sku
UPDATE products 
SET sku = 'AUTO_' || id::text 
WHERE sku IS NULL;

-- Now create a proper UNIQUE CONSTRAINT (not partial index)
ALTER TABLE products 
ADD CONSTRAINT products_user_id_sku_key UNIQUE (user_id, sku);
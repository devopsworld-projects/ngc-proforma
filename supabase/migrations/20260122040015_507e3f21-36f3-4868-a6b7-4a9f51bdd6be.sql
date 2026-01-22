-- Add category and stock_quantity columns to products table
ALTER TABLE public.products 
ADD COLUMN category text,
ADD COLUMN stock_quantity numeric DEFAULT 0;

-- Create index for category filtering
CREATE INDEX idx_products_category ON public.products(category);
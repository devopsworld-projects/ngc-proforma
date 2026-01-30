-- Add brand and product_image columns to invoice_items table
ALTER TABLE public.invoice_items
ADD COLUMN brand text,
ADD COLUMN product_image text;
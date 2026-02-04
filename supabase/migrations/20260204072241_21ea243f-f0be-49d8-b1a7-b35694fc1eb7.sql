-- Add size_label column to products table for default size/length values
ALTER TABLE public.products 
ADD COLUMN size_label text;
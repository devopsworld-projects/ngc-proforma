-- Add size_label column to invoice_items for tracking dimensions like cable lengths
ALTER TABLE public.invoice_items 
ADD COLUMN size_label text;
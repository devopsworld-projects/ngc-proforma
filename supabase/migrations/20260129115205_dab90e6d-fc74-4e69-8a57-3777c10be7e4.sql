-- Drop the existing global unique constraint on invoice_no
ALTER TABLE public.invoices DROP CONSTRAINT IF EXISTS invoices_invoice_no_key;

-- Add a composite unique constraint on user_id + invoice_no
-- This allows each user to have their own invoice numbering sequence
ALTER TABLE public.invoices ADD CONSTRAINT invoices_user_invoice_no_unique UNIQUE (user_id, invoice_no);
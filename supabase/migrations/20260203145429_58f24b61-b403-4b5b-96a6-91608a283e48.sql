-- Add tax_type column to customers table
ALTER TABLE public.customers 
ADD COLUMN tax_type text NOT NULL DEFAULT 'cgst' 
CHECK (tax_type IN ('cgst', 'igst'));

-- Add comment for clarity
COMMENT ON COLUMN public.customers.tax_type IS 'Tax type: cgst for CGST+SGST (intra-state), igst for IGST (inter-state)';
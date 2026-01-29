-- Add quotation fields to invoices table
ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS quote_for text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS applied_markup_percent numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS customer_snapshot jsonb DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.invoices.quote_for IS 'Type of quote recipient: customer or dealer';
COMMENT ON COLUMN public.invoices.applied_markup_percent IS 'The markup percentage applied at time of quotation creation';
COMMENT ON COLUMN public.invoices.customer_snapshot IS 'Snapshot of customer/dealer details at time of creation';
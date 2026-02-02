-- Add gst_percent column to invoice_items for per-item GST tracking
ALTER TABLE public.invoice_items 
ADD COLUMN IF NOT EXISTS gst_percent numeric DEFAULT 18;

-- Add gst_amount column (calculated field stored for display)
ALTER TABLE public.invoice_items 
ADD COLUMN IF NOT EXISTS gst_amount numeric DEFAULT 0;

COMMENT ON COLUMN public.invoice_items.gst_percent IS 'GST percentage applied to this line item';
COMMENT ON COLUMN public.invoice_items.gst_amount IS 'Calculated GST amount for this line item';
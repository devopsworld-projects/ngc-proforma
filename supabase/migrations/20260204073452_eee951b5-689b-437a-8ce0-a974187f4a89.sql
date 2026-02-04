-- Add deleted_at column for soft-delete functionality
ALTER TABLE public.invoices 
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create index for efficient filtering
CREATE INDEX idx_invoices_deleted_at ON public.invoices (deleted_at);

-- Add comment for clarity
COMMENT ON COLUMN public.invoices.deleted_at IS 'Soft delete timestamp - NULL means active, non-NULL means deleted by user';
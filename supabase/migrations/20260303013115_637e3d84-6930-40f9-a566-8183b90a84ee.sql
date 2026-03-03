
-- Drop the existing FK constraint on admin_notifications and re-add with CASCADE
ALTER TABLE public.admin_notifications
  DROP CONSTRAINT IF EXISTS admin_notifications_invoice_id_fkey;

ALTER TABLE public.admin_notifications
  ADD CONSTRAINT admin_notifications_invoice_id_fkey
  FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE CASCADE;

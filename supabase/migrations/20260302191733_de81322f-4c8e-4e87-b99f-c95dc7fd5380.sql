
-- Notifications table for admin events
CREATE TABLE public.admin_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid REFERENCES public.invoices(id) ON DELETE CASCADE,
  invoice_no text NOT NULL,
  event_type text NOT NULL, -- 'created', 'deleted', 'status_sent', 'status_paid', etc.
  customer_name text,
  grand_total numeric,
  actor_user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Track when each admin last read notifications
CREATE TABLE public.admin_notification_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  last_read_at timestamptz NOT NULL DEFAULT now()
);

-- RLS on admin_notifications
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view notifications"
  ON public.admin_notifications FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS on admin_notification_reads
ALTER TABLE public.admin_notification_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view own read marker"
  ON public.admin_notification_reads FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can insert own read marker"
  ON public.admin_notification_reads FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update own read marker"
  ON public.admin_notification_reads FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Enable realtime for admin_notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_notifications;

-- Trigger function to auto-create notifications on invoice changes
CREATE OR REPLACE FUNCTION public.notify_admin_invoice_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  event_type text;
  cust_name text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    event_type := 'created';
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.deleted_at IS NOT NULL AND (OLD.deleted_at IS NULL) THEN
      event_type := 'deleted';
    ELSIF OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL THEN
      event_type := 'restored';
    ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
      event_type := 'status_' || NEW.status;
    ELSE
      RETURN NEW;
    END IF;
  ELSE
    RETURN NEW;
  END IF;

  SELECT name INTO cust_name FROM public.customers WHERE id = NEW.customer_id;

  INSERT INTO public.admin_notifications (invoice_id, invoice_no, event_type, customer_name, grand_total, actor_user_id)
  VALUES (NEW.id, NEW.invoice_no, event_type, cust_name, NEW.grand_total, NEW.user_id);

  RETURN NEW;
END;
$$;

-- Attach trigger to invoices table
CREATE TRIGGER trg_admin_invoice_notification
  AFTER INSERT OR UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admin_invoice_change();

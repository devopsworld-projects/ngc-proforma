
-- Add actor_name column to admin_notifications
ALTER TABLE public.admin_notifications ADD COLUMN actor_name text;

-- Update trigger to include actor name from profiles
CREATE OR REPLACE FUNCTION public.notify_admin_invoice_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  event_type text;
  cust_name text;
  act_name text;
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
  SELECT full_name INTO act_name FROM public.profiles WHERE id = NEW.user_id;

  INSERT INTO public.admin_notifications (invoice_id, invoice_no, event_type, customer_name, grand_total, actor_user_id, actor_name)
  VALUES (NEW.id, NEW.invoice_no, event_type, cust_name, NEW.grand_total, NEW.user_id, act_name);

  RETURN NEW;
END;
$$;

-- Add delete policy for admins on admin_notifications
CREATE POLICY "Admins can delete notifications"
  ON public.admin_notifications FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

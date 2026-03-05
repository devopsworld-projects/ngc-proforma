
CREATE TABLE public.popup_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  popup_key text NOT NULL UNIQUE,
  is_enabled boolean NOT NULL DEFAULT true,
  title text NOT NULL DEFAULT '',
  message text NOT NULL DEFAULT '',
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.popup_settings ENABLE ROW LEVEL SECURITY;

-- Admins can manage popup settings
CREATE POLICY "Admins can view popup_settings"
  ON public.popup_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can update popup_settings"
  ON public.popup_settings FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert popup_settings"
  ON public.popup_settings FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete popup_settings"
  ON public.popup_settings FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Seed default popup entries
INSERT INTO public.popup_settings (popup_key, is_enabled, title, message) VALUES
  ('uncategorized_products', true, 'Products Missing Category', 'Some products are missing a category. Please update them to keep your inventory organized.'),
  ('incomplete_customers', false, 'Incomplete Customer Records', 'Some customers are missing important details like email or phone. Please update them.'),
  ('draft_proformas', false, 'Draft Proformas Pending', 'You have draft proformas that haven''t been sent yet. Review and send them to your customers.');

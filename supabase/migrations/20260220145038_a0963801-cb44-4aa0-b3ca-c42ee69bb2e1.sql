ALTER TABLE public.pdf_template_settings
  ADD COLUMN IF NOT EXISTS bank_account_name text DEFAULT NULL;
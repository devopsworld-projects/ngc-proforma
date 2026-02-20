ALTER TABLE public.pdf_template_settings
  ADD COLUMN IF NOT EXISTS terms_line5 text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS terms_line6 text DEFAULT NULL;
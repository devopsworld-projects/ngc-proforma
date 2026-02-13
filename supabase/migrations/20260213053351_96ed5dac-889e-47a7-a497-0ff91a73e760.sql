
ALTER TABLE public.pdf_template_settings
ADD COLUMN show_gst boolean NOT NULL DEFAULT true;

ALTER TABLE public.pdf_template_settings
ADD COLUMN terms_line4 text DEFAULT NULL;

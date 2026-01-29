-- Add table text color to PDF template settings
ALTER TABLE public.pdf_template_settings
ADD COLUMN table_text_color TEXT NOT NULL DEFAULT '#1f2937';
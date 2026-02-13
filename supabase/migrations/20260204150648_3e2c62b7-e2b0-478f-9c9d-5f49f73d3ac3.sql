-- Add section_order column to pdf_template_settings for drag-and-drop section ordering
ALTER TABLE public.pdf_template_settings
ADD COLUMN section_order text[] NOT NULL DEFAULT ARRAY['header', 'customer_details', 'items_table', 'totals', 'bank_details', 'terms', 'signature']::text[];
-- Add new template customization fields to pdf_template_settings
ALTER TABLE public.pdf_template_settings

  -- Template style selection
  ADD COLUMN IF NOT EXISTS template_style text NOT NULL DEFAULT 'bold_corporate',

  -- Font customization
  ADD COLUMN IF NOT EXISTS font_heading text NOT NULL DEFAULT 'Montserrat',
  ADD COLUMN IF NOT EXISTS font_body text NOT NULL DEFAULT 'Inter',
  ADD COLUMN IF NOT EXISTS font_mono text NOT NULL DEFAULT 'Roboto Mono',
  ADD COLUMN IF NOT EXISTS font_size_scale text NOT NULL DEFAULT 'normal',

  -- Additional color options
  ADD COLUMN IF NOT EXISTS accent_color text NOT NULL DEFAULT '#d4a02c',
  ADD COLUMN IF NOT EXISTS table_header_bg text NOT NULL DEFAULT '#f3f4f6',
  ADD COLUMN IF NOT EXISTS table_header_text text NOT NULL DEFAULT '#374151',
  ADD COLUMN IF NOT EXISTS grand_total_bg text NOT NULL DEFAULT '#1e2a4a',
  ADD COLUMN IF NOT EXISTS grand_total_text text NOT NULL DEFAULT '#ffffff',

  -- Layout options
  ADD COLUMN IF NOT EXISTS header_layout text NOT NULL DEFAULT 'centered',
  ADD COLUMN IF NOT EXISTS show_brand_column boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_unit_column boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_image_column boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_company_state boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_customer_email boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_customer_phone boolean NOT NULL DEFAULT true,

  -- Custom field labels
  ADD COLUMN IF NOT EXISTS invoice_title text NOT NULL DEFAULT 'PROFORMA INVOICE',
  ADD COLUMN IF NOT EXISTS bill_to_label text NOT NULL DEFAULT 'Bill To',
  ADD COLUMN IF NOT EXISTS invoice_details_label text NOT NULL DEFAULT 'Invoice Details';
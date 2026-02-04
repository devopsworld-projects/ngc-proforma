-- Add granular spacing and sizing controls to pdf_template_settings
ALTER TABLE public.pdf_template_settings
ADD COLUMN IF NOT EXISTS header_padding text NOT NULL DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS header_layout_style text NOT NULL DEFAULT 'centered',
ADD COLUMN IF NOT EXISTS logo_size text NOT NULL DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS section_spacing text NOT NULL DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS table_row_padding text NOT NULL DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS footer_padding text NOT NULL DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS show_invoice_title boolean NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS compact_header boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS border_style text NOT NULL DEFAULT 'subtle',
ADD COLUMN IF NOT EXISTS table_border_color text NOT NULL DEFAULT '#e5e7eb';

-- Add comments for clarity
COMMENT ON COLUMN public.pdf_template_settings.header_padding IS 'Header padding: compact, normal, relaxed';
COMMENT ON COLUMN public.pdf_template_settings.header_layout_style IS 'Header layout: centered, left-aligned, split';
COMMENT ON COLUMN public.pdf_template_settings.logo_size IS 'Logo size: small (32px), medium (48px), large (64px)';
COMMENT ON COLUMN public.pdf_template_settings.section_spacing IS 'Spacing between sections: compact, normal, relaxed';
COMMENT ON COLUMN public.pdf_template_settings.compact_header IS 'Use condensed header with inline elements';
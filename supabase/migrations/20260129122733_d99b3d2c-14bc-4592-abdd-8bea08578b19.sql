-- Create PDF template settings table
CREATE TABLE public.pdf_template_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Color settings
  primary_color TEXT NOT NULL DEFAULT '#294172',
  secondary_color TEXT NOT NULL DEFAULT '#3b82f6',
  header_text_color TEXT NOT NULL DEFAULT '#ffffff',
  
  -- Section visibility
  show_logo BOOLEAN NOT NULL DEFAULT true,
  show_gstin_header BOOLEAN NOT NULL DEFAULT true,
  show_contact_header BOOLEAN NOT NULL DEFAULT true,
  show_shipping_address BOOLEAN NOT NULL DEFAULT false,
  show_serial_numbers BOOLEAN NOT NULL DEFAULT true,
  show_discount_column BOOLEAN NOT NULL DEFAULT true,
  show_terms BOOLEAN NOT NULL DEFAULT true,
  show_signature BOOLEAN NOT NULL DEFAULT true,
  show_amount_words BOOLEAN NOT NULL DEFAULT true,
  
  -- Custom content
  terms_line1 TEXT DEFAULT 'Goods once sold will not be taken back.',
  terms_line2 TEXT DEFAULT 'Subject to local jurisdiction only.',
  terms_line3 TEXT DEFAULT 'E&OE - Errors and Omissions Excepted.',
  custom_footer_text TEXT DEFAULT NULL,
  bank_name TEXT DEFAULT NULL,
  bank_account_no TEXT DEFAULT NULL,
  bank_ifsc TEXT DEFAULT NULL,
  bank_branch TEXT DEFAULT NULL,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.pdf_template_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can read own template settings"
  ON public.pdf_template_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own template settings"
  ON public.pdf_template_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own template settings"
  ON public.pdf_template_settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own template settings"
  ON public.pdf_template_settings FOR DELETE
  USING (auth.uid() = user_id);

-- Admin view policy
CREATE POLICY "Admins can view all pdf_template_settings"
  ON public.pdf_template_settings FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Update trigger
CREATE TRIGGER update_pdf_template_settings_updated_at
  BEFORE UPDATE ON public.pdf_template_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
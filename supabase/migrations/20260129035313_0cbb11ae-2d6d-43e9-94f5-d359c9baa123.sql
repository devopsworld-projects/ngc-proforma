-- Add new columns to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS model_spec TEXT,
ADD COLUMN IF NOT EXISTS gst_percent NUMERIC DEFAULT 18,
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add customer_type to customers table (customer or dealer)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'customer_type') THEN
    CREATE TYPE public.customer_type AS ENUM ('customer', 'dealer');
  END IF;
END $$;

ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS customer_type TEXT DEFAULT 'customer';

-- Create pricing_settings table for Admin to manage price markups
CREATE TABLE IF NOT EXISTS public.pricing_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  customer_markup_percent NUMERIC DEFAULT 0,
  dealer_markup_percent NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(user_id)
);

-- Enable RLS on pricing_settings
ALTER TABLE public.pricing_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for pricing_settings
CREATE POLICY "Users can read own pricing settings" 
ON public.pricing_settings 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pricing settings" 
ON public.pricing_settings 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pricing settings" 
ON public.pricing_settings 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all pricing_settings" 
ON public.pricing_settings 
FOR SELECT 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger for pricing_settings updated_at
CREATE TRIGGER update_pricing_settings_updated_at
BEFORE UPDATE ON public.pricing_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create product-images storage bucket for product images
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy for product images
CREATE POLICY "Authenticated users can upload product images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Product images are publicly accessible"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'product-images');

CREATE POLICY "Users can update own product images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'product-images');

CREATE POLICY "Users can delete own product images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'product-images');
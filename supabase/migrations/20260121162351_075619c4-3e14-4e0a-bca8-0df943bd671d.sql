-- Create storage bucket for company logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-logos', 'company-logos', true);

-- Allow public read access
CREATE POLICY "Public can view company logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'company-logos');

-- Allow insert/update/delete for anyone (admin backend)
CREATE POLICY "Allow insert company logos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'company-logos');

CREATE POLICY "Allow update company logos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'company-logos');

CREATE POLICY "Allow delete company logos"
ON storage.objects FOR DELETE
USING (bucket_id = 'company-logos');
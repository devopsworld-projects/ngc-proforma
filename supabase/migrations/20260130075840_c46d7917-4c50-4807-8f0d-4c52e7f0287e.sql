-- Update company-logos storage policies for global shared logos
DROP POLICY IF EXISTS "Users can upload own company logo" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own company logo" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own company logo" ON storage.objects;

-- Admins can upload, update, and delete shared company logos
CREATE POLICY "Admins can upload company logos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'company-logos'
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can update company logos"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'company-logos'
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can delete company logos"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'company-logos'
  AND public.has_role(auth.uid(), 'admin')
);
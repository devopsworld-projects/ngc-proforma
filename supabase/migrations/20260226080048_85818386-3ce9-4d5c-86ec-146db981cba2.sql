-- Fix 1: Enforce folder ownership on product-images uploads
DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;

CREATE POLICY "Users can upload to own product images folder"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'product-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Fix 2: Drop deprecated admin_create_user SQL function (Edge Function is used instead)
DROP FUNCTION IF EXISTS public.admin_create_user(text, text, text);
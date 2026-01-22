-- Fix 1: Create the missing approve_user function for admin user approval workflow
CREATE OR REPLACE FUNCTION public.approve_user(target_user_id UUID, approved BOOLEAN)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow admins to call this function
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;

  -- Update the is_approved column on the profiles table
  UPDATE public.profiles
  SET is_approved = approved, updated_at = now()
  WHERE id = target_user_id;

  -- Check if update was successful
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found: %', target_user_id;
  END IF;

  RETURN TRUE;
END;
$$;

-- Fix 2: Update storage policies for company-logos bucket with user ownership checks
-- First drop the existing overly permissive policies
DROP POLICY IF EXISTS "Allow insert company logos" ON storage.objects;
DROP POLICY IF EXISTS "Allow update company logos" ON storage.objects;
DROP POLICY IF EXISTS "Allow delete company logos" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read company logos" ON storage.objects;

-- Create secure policies with user ownership via path-based structure (user_id/filename)
-- Public read access (needed for displaying logos on invoices)
CREATE POLICY "Allow public read company logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'company-logos');

-- Only authenticated users can upload to their own folder
CREATE POLICY "Allow authenticated insert company logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'company-logos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Only owners can update their own logos
CREATE POLICY "Allow owner update company logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'company-logos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Only owners can delete their own logos
CREATE POLICY "Allow owner delete company logos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'company-logos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
-- Add is_approved column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_approved BOOLEAN NOT NULL DEFAULT false;

-- Approve the admin user immediately
UPDATE public.profiles 
SET is_approved = true 
WHERE id = (SELECT id FROM auth.users WHERE email = 'eswarchinthakayala@gmail.com');
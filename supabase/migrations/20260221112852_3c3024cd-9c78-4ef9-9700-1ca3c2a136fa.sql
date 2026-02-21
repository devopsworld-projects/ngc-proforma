
-- Create api_keys table for external API access
CREATE TABLE public.api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key_hash text NOT NULL,
  key_prefix text NOT NULL, -- first 8 chars for display
  label text NOT NULL DEFAULT 'Default',
  is_active boolean NOT NULL DEFAULT true,
  last_used_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone
);

-- Enable RLS
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Only admins can manage API keys
CREATE POLICY "Admins can view all api_keys"
  ON public.api_keys FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert api_keys"
  ON public.api_keys FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin') AND auth.uid() = user_id);

CREATE POLICY "Admins can update api_keys"
  ON public.api_keys FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete api_keys"
  ON public.api_keys FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

-- Function to validate API key and return user_id (used by edge function)
CREATE OR REPLACE FUNCTION public.validate_api_key(key_hash_input text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  found_user_id uuid;
BEGIN
  SELECT user_id INTO found_user_id
  FROM public.api_keys
  WHERE key_hash = key_hash_input
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > now());
  
  IF found_user_id IS NOT NULL THEN
    UPDATE public.api_keys SET last_used_at = now() WHERE key_hash = key_hash_input;
  END IF;
  
  RETURN found_user_id;
END;
$$;

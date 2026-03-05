
CREATE TABLE public.concerns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  user_email text,
  user_name text,
  subject text NOT NULL,
  message text NOT NULL,
  priority text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'open',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.concerns ENABLE ROW LEVEL SECURITY;

-- Users can insert their own concerns
CREATE POLICY "Users can insert own concerns"
  ON public.concerns FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can view own concerns
CREATE POLICY "Users can view own concerns"
  ON public.concerns FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Admins can view all concerns
CREATE POLICY "Admins can view all concerns"
  ON public.concerns FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update concerns
CREATE POLICY "Admins can update all concerns"
  ON public.concerns FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

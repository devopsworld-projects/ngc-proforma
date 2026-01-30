-- Update company_settings RLS policies for global access
DROP POLICY IF EXISTS "Users can read own company settings" ON public.company_settings;
DROP POLICY IF EXISTS "Users can insert own company settings" ON public.company_settings;
DROP POLICY IF EXISTS "Users can update own company settings" ON public.company_settings;
DROP POLICY IF EXISTS "Users can delete own company settings" ON public.company_settings;
DROP POLICY IF EXISTS "Admins can view all company_settings" ON public.company_settings;

-- New policies: All authenticated users can read, admins can write
CREATE POLICY "Authenticated users can read company settings"
ON public.company_settings FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Admins can insert company settings"
ON public.company_settings FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update company settings"
ON public.company_settings FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete company settings"
ON public.company_settings FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Update pdf_template_settings RLS policies for global access
DROP POLICY IF EXISTS "Users can read own template settings" ON public.pdf_template_settings;
DROP POLICY IF EXISTS "Users can insert own template settings" ON public.pdf_template_settings;
DROP POLICY IF EXISTS "Users can update own template settings" ON public.pdf_template_settings;
DROP POLICY IF EXISTS "Users can delete own template settings" ON public.pdf_template_settings;
DROP POLICY IF EXISTS "Admins can view all pdf_template_settings" ON public.pdf_template_settings;

-- New policies: All authenticated users can read, admins can write
CREATE POLICY "Authenticated users can read pdf template settings"
ON public.pdf_template_settings FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Admins can insert pdf template settings"
ON public.pdf_template_settings FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update pdf template settings"
ON public.pdf_template_settings FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete pdf template settings"
ON public.pdf_template_settings FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
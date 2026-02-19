
CREATE POLICY "Admins can insert invoice items"
ON public.invoice_items FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update invoice items"
ON public.invoice_items FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete invoice items"
ON public.invoice_items FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all invoices"
ON public.invoices FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

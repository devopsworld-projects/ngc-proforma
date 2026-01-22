-- Add warranty and supplier fields to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS warranty_months INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS supplier_name TEXT,
ADD COLUMN IF NOT EXISTS supplier_contact TEXT,
ADD COLUMN IF NOT EXISTS purchase_price NUMERIC DEFAULT 0;

-- Create stock_movements table to track all stock in/out
CREATE TABLE public.stock_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('in', 'out', 'adjustment')),
  quantity NUMERIC NOT NULL,
  serial_numbers TEXT[] DEFAULT '{}',
  reference_type TEXT, -- 'invoice', 'purchase', 'manual', 'service'
  reference_id UUID, -- invoice_id or service_ticket_id
  notes TEXT,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create suppliers table for basic supplier info
CREATE TABLE public.suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  gstin TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create service_tickets table for repair tracking
CREATE TABLE public.service_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_no TEXT NOT NULL,
  customer_id UUID REFERENCES public.customers(id),
  customer_name TEXT, -- for walk-in customers without account
  customer_phone TEXT,
  device_type TEXT NOT NULL, -- 'laptop', 'desktop', 'printer', etc.
  brand TEXT,
  model TEXT,
  serial_number TEXT,
  problem_description TEXT NOT NULL,
  diagnosis TEXT,
  resolution TEXT,
  status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'diagnosing', 'waiting_parts', 'in_progress', 'completed', 'delivered', 'cancelled')),
  received_date DATE NOT NULL DEFAULT CURRENT_DATE,
  estimated_completion DATE,
  completed_date DATE,
  delivered_date DATE,
  estimated_cost NUMERIC DEFAULT 0,
  final_cost NUMERIC DEFAULT 0,
  parts_used TEXT[],
  technician_notes TEXT,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create product_serials table to track individual items with serial numbers
CREATE TABLE public.product_serials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  serial_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'in_stock' CHECK (status IN ('in_stock', 'sold', 'in_service', 'defective', 'returned')),
  purchase_date DATE,
  warranty_expiry DATE,
  supplier_id UUID REFERENCES public.suppliers(id),
  purchase_price NUMERIC DEFAULT 0,
  sold_date DATE,
  sold_invoice_id UUID REFERENCES public.invoices(id),
  notes TEXT,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_serials ENABLE ROW LEVEL SECURITY;

-- RLS policies for stock_movements
CREATE POLICY "Users can read own stock movements" ON public.stock_movements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own stock movements" ON public.stock_movements FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own stock movements" ON public.stock_movements FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own stock movements" ON public.stock_movements FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all stock_movements" ON public.stock_movements FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for suppliers
CREATE POLICY "Users can read own suppliers" ON public.suppliers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own suppliers" ON public.suppliers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own suppliers" ON public.suppliers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own suppliers" ON public.suppliers FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all suppliers" ON public.suppliers FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for service_tickets
CREATE POLICY "Users can read own service tickets" ON public.service_tickets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own service tickets" ON public.service_tickets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own service tickets" ON public.service_tickets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own service tickets" ON public.service_tickets FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all service_tickets" ON public.service_tickets FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for product_serials
CREATE POLICY "Users can read own product serials" ON public.product_serials FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own product serials" ON public.product_serials FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own product serials" ON public.product_serials FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own product serials" ON public.product_serials FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all product_serials" ON public.product_serials FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at on new tables
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_service_tickets_updated_at BEFORE UPDATE ON public.service_tickets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_product_serials_updated_at BEFORE UPDATE ON public.product_serials FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create unique index on product_serials for serial number per user
CREATE UNIQUE INDEX product_serials_user_serial_unique ON public.product_serials (user_id, serial_number) WHERE serial_number IS NOT NULL;

-- Create unique index on service_tickets for ticket_no per user
CREATE UNIQUE INDEX service_tickets_user_ticket_no_unique ON public.service_tickets (user_id, ticket_no);
import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, parseISO } from "date-fns";
import { CalendarIcon, Building2, MapPin, RefreshCcw, Save, X, Users, Store } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { cn } from "@/lib/utils";

import { LineItemsEditor, LineItem } from "./LineItemsEditor";
import { TaxCalculator, useTaxCalculation } from "./TaxCalculator";
import { CustomerSelector } from "@/components/customers/CustomerSelector";
import { Customer, Address } from "@/hooks/useCustomers";
import { useNextInvoiceNumber, useUpdateInvoice, useDeleteInvoiceItems, Invoice, InvoiceItem } from "@/hooks/useInvoices";
import { usePricingSettings } from "@/hooks/usePricingSettings";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";

const invoiceFormSchema = z.object({
  invoiceNo: z.string().min(1, "Proforma number is required"),
  date: z.date(),
  eWayBillNo: z.string().optional(),
  supplierInvoiceNo: z.string().optional(),
  supplierInvoiceDate: z.date().optional().nullable(),
  otherReferences: z.string().optional(),
  isRecurring: z.boolean(),
  recurringFrequency: z.enum(["weekly", "monthly", "quarterly", "yearly"]).optional().nullable(),
});

type InvoiceFormData = z.infer<typeof invoiceFormSchema>;

export interface InvoiceWithRelations {
  id: string;
  invoice_no: string;
  customer_id: string | null;
  date: string;
  e_way_bill_no: string | null;
  supplier_invoice_no: string | null;
  supplier_invoice_date: string | null;
  other_references: string | null;
  billing_address_id: string | null;
  shipping_address_id: string | null;
  subtotal: number;
  discount_percent: number;
  discount_amount: number;
  tax_rate: number;
  tax_amount: number;
  round_off: number;
  grand_total: number;
  amount_in_words: string | null;
  status: string;
  is_recurring: boolean;
  recurring_frequency: string | null;
  next_invoice_date: string | null;
  created_at: string;
  updated_at: string;
  quote_for?: string | null;
  applied_markup_percent?: number | null;
  customer_snapshot?: Json;
  customers?: Customer | null;
  billing_address?: Record<string, any> | null;
  shipping_address?: Record<string, any> | null;
  items?: InvoiceItem[];
}

interface InvoiceFormProps {
  invoice?: InvoiceWithRelations | null;
  onCancel?: () => void;
  onSuccess?: () => void;
}

export function InvoiceForm({ invoice, onCancel, onSuccess }: InvoiceFormProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: nextInvoiceNo } = useNextInvoiceNumber();
  const { data: pricingSettings } = usePricingSettings();
  const updateInvoice = useUpdateInvoice();
  const deleteInvoiceItems = useDeleteInvoiceItems();
  
  const isEditing = !!invoice;
  
  // Quote For selection (mandatory)
  const [quoteFor, setQuoteFor] = useState<"customer" | "dealer" | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedBillingAddress, setSelectedBillingAddress] = useState<Address | null>(null);
  const [selectedShippingAddress, setSelectedShippingAddress] = useState<Address | null>(null);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [taxRate, setTaxRate] = useState(18);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      invoiceNo: "",
      date: new Date(),
      eWayBillNo: "",
      supplierInvoiceNo: "",
      supplierInvoiceDate: null,
      otherReferences: "",
      isRecurring: false,
      recurringFrequency: null,
    },
  });

  // Get current markup percentage based on quote type
  const currentMarkupPercent = useMemo(() => {
    if (!pricingSettings || !quoteFor) return 0;
    return quoteFor === "dealer" 
      ? pricingSettings.dealer_markup_percent || 0 
      : pricingSettings.customer_markup_percent || 0;
  }, [pricingSettings, quoteFor]);

  // Recalculate line item prices when quote type changes
  const recalculatePricesForType = useCallback((newType: "customer" | "dealer", items: LineItem[]) => {
    if (!pricingSettings || items.length === 0) return items;

    const oldMarkup = quoteFor === "dealer" 
      ? pricingSettings.dealer_markup_percent || 0 
      : pricingSettings.customer_markup_percent || 0;
    
    const newMarkup = newType === "dealer" 
      ? pricingSettings.dealer_markup_percent || 0 
      : pricingSettings.customer_markup_percent || 0;

    // Only recalculate if markups are different
    if (oldMarkup === newMarkup) return items;

    return items.map(item => {
      // Calculate base rate by removing old markup
      const baseRate = oldMarkup > 0 ? item.rate / (1 + oldMarkup / 100) : item.rate;
      // Apply new markup
      const newRate = newMarkup > 0 ? baseRate * (1 + newMarkup / 100) : baseRate;
      const finalRate = Math.round(newRate * 100) / 100;
      const grossAmount = item.quantity * finalRate;
      const discountAmount = (grossAmount * item.discountPercent) / 100;
      
      return {
        ...item,
        rate: finalRate,
        amount: grossAmount - discountAmount,
      };
    });
  }, [pricingSettings, quoteFor]);

  // Handle Quote For change
  const handleQuoteForChange = (newType: "customer" | "dealer") => {
    if (quoteFor && lineItems.length > 0) {
      // Recalculate prices for the new type
      const recalculatedItems = recalculatePricesForType(newType, lineItems);
      setLineItems(recalculatedItems);
      toast.info(`Prices recalculated for ${newType === "dealer" ? "Dealer" : "Customer"} rates`);
    }
    
    // Clear customer selection when type changes
    if (quoteFor !== newType) {
      setSelectedCustomer(null);
      setSelectedBillingAddress(null);
      setSelectedShippingAddress(null);
    }
    
    setQuoteFor(newType);
  };

  // Initialize form with existing invoice data
  useEffect(() => {
    if (invoice) {
      form.reset({
        invoiceNo: invoice.invoice_no,
        date: parseISO(invoice.date),
        eWayBillNo: invoice.e_way_bill_no || "",
        supplierInvoiceNo: invoice.supplier_invoice_no || "",
        supplierInvoiceDate: invoice.supplier_invoice_date ? parseISO(invoice.supplier_invoice_date) : null,
        otherReferences: invoice.other_references || "",
        isRecurring: invoice.is_recurring,
        recurringFrequency: invoice.recurring_frequency as any,
      });
      
      setDiscountPercent(invoice.discount_percent);
      setTaxRate(invoice.tax_rate);
      
      // Set quote_for from invoice or infer from customer
      if (invoice.quote_for) {
        setQuoteFor(invoice.quote_for as "customer" | "dealer");
      } else if (invoice.customers?.customer_type) {
        setQuoteFor(invoice.customers.customer_type as "customer" | "dealer");
      }
      
      if (invoice.customers) {
        setSelectedCustomer(invoice.customers);
      }
      if (invoice.billing_address && invoice.billing_address.id) {
        setSelectedBillingAddress(invoice.billing_address as Address);
      }
      if (invoice.shipping_address && invoice.shipping_address.id) {
        setSelectedShippingAddress(invoice.shipping_address as Address);
      }
      
      if (invoice.items && invoice.items.length > 0) {
        setLineItems(
          invoice.items.map((item) => {
            const gstPercent = item.gst_percent || 18;
            const gstAmount = item.gst_amount || (item.amount * gstPercent) / 100;
            return {
              id: item.id,
              slNo: item.sl_no,
              brand: item.brand || "",
              description: item.description,
              serialNumbers: item.serial_numbers?.join(", ") || "",
              quantity: item.quantity,
              unit: item.unit,
              rate: item.rate,
              discountPercent: item.discount_percent,
              gstPercent: gstPercent,
              gstAmount: gstAmount,
              amount: item.amount,
              productImage: item.product_image || "",
            };
          })
        );
      }
    }
  }, [invoice, form]);

  // Set invoice number when loaded (only for new invoices)
  useEffect(() => {
    if (!isEditing && nextInvoiceNo && !form.getValues("invoiceNo")) {
      form.setValue("invoiceNo", nextInvoiceNo);
    }
  }, [nextInvoiceNo, isEditing, form]);

  const subtotal = useMemo(() => {
    return lineItems.reduce((sum, item) => sum + item.amount, 0);
  }, [lineItems]);

  const totals = useTaxCalculation(subtotal, discountPercent, lineItems);

  const handleCustomerSelect = (
    customer: Customer | null,
    billingAddress: Address | null,
    shippingAddress: Address | null
  ) => {
    setSelectedCustomer(customer);
    setSelectedBillingAddress(billingAddress);
    setSelectedShippingAddress(shippingAddress);
  };

  // Create customer snapshot
  const createCustomerSnapshot = (customer: Customer | null, billing: Address | null, shipping: Address | null) => {
    if (!customer) return null;
    
    return {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      gstin: customer.gstin,
      state: customer.state,
      state_code: customer.state_code,
      customer_type: customer.customer_type,
      billing_address: billing ? {
        address_line1: billing.address_line1,
        address_line2: billing.address_line2,
        city: billing.city,
        state: billing.state,
        state_code: billing.state_code,
        postal_code: billing.postal_code,
        country: billing.country,
      } : null,
      shipping_address: shipping ? {
        address_line1: shipping.address_line1,
        address_line2: shipping.address_line2,
        city: shipping.city,
        state: shipping.state,
        state_code: shipping.state_code,
        postal_code: shipping.postal_code,
        country: shipping.country,
      } : null,
    };
  };

  const onSubmit = async (data: InvoiceFormData) => {
    if (!quoteFor) {
      toast.error("Please select Quote For (Customer or Dealer)");
      return;
    }

    if (lineItems.length === 0) {
      toast.error("Please add at least one line item");
      return;
    }

    if (lineItems.some((item) => !item.description.trim())) {
      toast.error("All items must have a description");
      return;
    }

    setIsSubmitting(true);

    try {
      if (!user) {
        throw new Error("You must be logged in to create invoices");
      }

      // Create customer snapshot
      const customerSnapshot = createCustomerSnapshot(
        selectedCustomer,
        selectedBillingAddress,
        selectedShippingAddress
      );

      const invoicePayload = {
        invoice_no: data.invoiceNo,
        customer_id: selectedCustomer?.id || null,
        date: format(data.date, "yyyy-MM-dd"),
        e_way_bill_no: data.eWayBillNo || null,
        supplier_invoice_no: data.supplierInvoiceNo || null,
        supplier_invoice_date: data.supplierInvoiceDate ? format(data.supplierInvoiceDate, "yyyy-MM-dd") : null,
        other_references: data.otherReferences || null,
        billing_address_id: selectedBillingAddress?.id || null,
        shipping_address_id: selectedShippingAddress?.id || null,
        subtotal: totals.subtotal,
        discount_percent: discountPercent,
        discount_amount: totals.discountAmount,
        tax_rate: taxRate,
        tax_amount: totals.taxAmount,
        round_off: totals.roundOff,
        grand_total: totals.grandTotal,
        amount_in_words: totals.amountInWords,
        is_recurring: data.isRecurring,
        recurring_frequency: data.isRecurring ? data.recurringFrequency : null,
        next_invoice_date: null,
        user_id: user.id,
        quote_for: quoteFor,
        applied_markup_percent: currentMarkupPercent,
        customer_snapshot: customerSnapshot,
      };

      if (isEditing && invoice) {
        // Update existing invoice
        const { error: updateError } = await supabase
          .from("invoices")
          .update(invoicePayload)
          .eq("id", invoice.id);

        if (updateError) throw updateError;

        // Delete existing items and re-create
        await deleteInvoiceItems.mutateAsync(invoice.id);

        const itemsPayload = lineItems.map((item) => ({
          invoice_id: invoice.id,
          sl_no: item.slNo,
          brand: item.brand || null,
          description: item.description,
          serial_numbers: item.serialNumbers ? item.serialNumbers.split(",").map((s) => s.trim()).filter(Boolean) : null,
          quantity: item.quantity,
          unit: item.unit,
          rate: item.rate,
          discount_percent: item.discountPercent,
          gst_percent: item.gstPercent || 18,
          gst_amount: item.gstAmount || 0,
          amount: item.amount,
          product_image: item.productImage || null,
        }));

        const { error: itemsError } = await supabase.from("invoice_items").insert(itemsPayload);
        if (itemsError) throw itemsError;

        toast.success("Proforma invoice updated successfully!");
      } else {
        // Create new invoice
        const { data: newInvoice, error: invoiceError } = await supabase
          .from("invoices")
          .insert({ ...invoicePayload, status: "draft" as const })
          .select()
          .single();

        if (invoiceError) throw invoiceError;

        const itemsPayload = lineItems.map((item) => ({
          invoice_id: newInvoice.id,
          sl_no: item.slNo,
          brand: item.brand || null,
          description: item.description,
          serial_numbers: item.serialNumbers ? item.serialNumbers.split(",").map((s) => s.trim()).filter(Boolean) : null,
          quantity: item.quantity,
          unit: item.unit,
          rate: item.rate,
          discount_percent: item.discountPercent,
          gst_percent: item.gstPercent || 18,
          gst_amount: item.gstAmount || 0,
          amount: item.amount,
          product_image: item.productImage || null,
        }));

        const { error: itemsError } = await supabase.from("invoice_items").insert(itemsPayload);
        if (itemsError) throw itemsError;

        // Auto-save manually entered products to products list
        const manualProducts = lineItems.filter(item => !item.productId && item.brand?.trim());
        if (manualProducts.length > 0) {
          const newProducts = manualProducts.map(item => ({
            name: item.brand.trim(),
            description: item.description?.trim() || null,
            unit: item.unit || "NOS",
            rate: item.rate,
            gst_percent: item.gstPercent || 18,
            stock_quantity: 0, // Start with 0 stock for new products
            is_active: true,
            user_id: user.id,
          }));
          
          // Insert products (ignore duplicates by name for same user)
          for (const product of newProducts) {
            // Check if product with same name exists for this user
            const { data: existingProduct } = await supabase
              .from("products")
              .select("id")
              .eq("user_id", user.id)
              .eq("name", product.name)
              .eq("is_active", true)
              .maybeSingle();
            
            if (!existingProduct) {
              await supabase.from("products").insert(product);
            }
          }
          
          if (manualProducts.length > 0) {
            toast.info(`${manualProducts.length} new product(s) added to inventory`);
          }
        }

        // Auto-deduct stock for items with productId
        const stockDeductions = lineItems
          .filter(item => item.productId)
          .map(item => ({
            productId: item.productId!,
            quantity: item.quantity,
          }));

        if (stockDeductions.length > 0) {
          for (const deduction of stockDeductions) {
            const { data: product } = await supabase
              .from("products")
              .select("stock_quantity")
              .eq("id", deduction.productId)
              .single();
            if (product) {
              await supabase
                .from("products")
                .update({ stock_quantity: Math.max(0, (product.stock_quantity || 0) - deduction.quantity) })
                .eq("id", deduction.productId);
            }
          }
        }

        toast.success("Proforma invoice created successfully!");
      }

      onSuccess?.();
      navigate("/invoices");
    } catch (error: any) {
      console.error("Error saving proforma invoice:", error);
      toast.error(error.message || "Failed to save proforma invoice");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isRecurring = form.watch("isRecurring");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-serif font-bold">
              {isEditing ? `Edit Proforma #${invoice?.invoice_no}` : "Create Proforma Invoice"}
            </h2>
            <p className="text-muted-foreground">
              {isEditing ? "Update the proforma invoice details" : "Fill in the details to create a new proforma invoice"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onCancel || (() => navigate("/invoices"))}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !quoteFor} className="gap-2">
              <Save className="h-4 w-4" />
              {isSubmitting ? "Saving..." : isEditing ? "Update Proforma" : "Save Proforma"}
            </Button>
          </div>
        </div>

        {/* Quote For Selection - Mandatory */}
        <Card className={cn(!quoteFor && "border-primary border-2")}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              Quote For
              <Badge variant="destructive" className="text-xs">Required</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => handleQuoteForChange("customer")}
                className={cn(
                  "flex items-center gap-3 p-4 rounded-lg border-2 transition-all",
                  quoteFor === "customer" 
                    ? "border-primary bg-primary/5" 
                    : "border-muted hover:border-primary/50"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center",
                  quoteFor === "customer" ? "bg-primary text-primary-foreground" : "bg-muted"
                )}>
                  <Users className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="font-semibold">Customer</p>
                  <p className="text-xs text-muted-foreground">
                    {pricingSettings?.customer_markup_percent 
                      ? `+${pricingSettings.customer_markup_percent}% markup`
                      : "Standard pricing"}
                  </p>
                </div>
              </button>
              
              <button
                type="button"
                onClick={() => handleQuoteForChange("dealer")}
                className={cn(
                  "flex items-center gap-3 p-4 rounded-lg border-2 transition-all",
                  quoteFor === "dealer" 
                    ? "border-primary bg-primary/5" 
                    : "border-muted hover:border-primary/50"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center",
                  quoteFor === "dealer" ? "bg-primary text-primary-foreground" : "bg-muted"
                )}>
                  <Store className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="font-semibold">Dealer</p>
                  <p className="text-xs text-muted-foreground">
                    {pricingSettings?.dealer_markup_percent 
                      ? `+${pricingSettings.dealer_markup_percent}% markup`
                      : "Dealer pricing"}
                  </p>
                </div>
              </button>
            </div>
            {!quoteFor && (
              <p className="text-sm text-destructive mt-3">
                Please select whether this quote is for a Customer or Dealer
              </p>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Proforma Invoice Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Proforma Details</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="invoiceNo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Proforma Number *</FormLabel>
                      <FormControl>
                        <Input placeholder="PI-001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Proforma Date *</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-popover" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                            className="p-3 pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="eWayBillNo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>e-Way Bill No.</FormLabel>
                      <FormControl>
                        <Input placeholder="Optional" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="supplierInvoiceNo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Supplier Invoice No.</FormLabel>
                      <FormControl>
                        <Input placeholder="Optional" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="supplierInvoiceDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Supplier Invoice Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? format(field.value, "PPP") : <span>Optional</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-popover" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value || undefined}
                            onSelect={field.onChange}
                            initialFocus
                            className="p-3 pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="otherReferences"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Other References</FormLabel>
                      <FormControl>
                        <Input placeholder="Optional" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Customer Selection - Only show after Quote For is selected */}
            {quoteFor && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    {quoteFor === "dealer" ? "Dealer" : "Customer"}
                    {currentMarkupPercent > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        +{currentMarkupPercent}% markup applied
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedCustomer ? (
                    <div className="space-y-3">
                      <div className="flex items-start justify-between p-3 bg-invoice-subtle rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold">{selectedCustomer.name}</p>
                              <Badge variant={selectedCustomer.customer_type === "dealer" ? "default" : "secondary"} className="text-xs">
                                {selectedCustomer.customer_type === "dealer" ? "Dealer" : "Customer"}
                              </Badge>
                            </div>
                            {selectedCustomer.gstin && (
                              <p className="text-xs text-muted-foreground font-mono">GSTIN: {selectedCustomer.gstin}</p>
                            )}
                          </div>
                        </div>
                        <CustomerSelector
                          selectedCustomerId={selectedCustomer.id}
                          onSelect={handleCustomerSelect}
                          filterType={quoteFor}
                          trigger={<Button type="button" size="sm" variant="outline">Change</Button>}
                        />
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm">
                        {selectedBillingAddress && (
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <MapPin className="w-3.5 h-3.5" />
                            <span>Billing: {selectedBillingAddress.city}, {selectedBillingAddress.state}</span>
                          </div>
                        )}
                        {selectedShippingAddress && (
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <MapPin className="w-3.5 h-3.5" />
                            <span>Shipping: {selectedShippingAddress.city}, {selectedShippingAddress.state}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-4 border-dashed border-2 rounded-lg">
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <Building2 className="w-5 h-5" />
                        <span>No {quoteFor} selected</span>
                      </div>
                      <CustomerSelector 
                        onSelect={handleCustomerSelect} 
                        filterType={quoteFor}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Line Items - Only show after Quote For is selected */}
            {quoteFor && (
              <Card>
                <CardContent className="pt-6">
                  <LineItemsEditor 
                    items={lineItems} 
                    onChange={setLineItems}
                    customerType={quoteFor}
                    pricingSettings={pricingSettings ? {
                      customerMarkupPercent: pricingSettings.customer_markup_percent || 0,
                      dealerMarkupPercent: pricingSettings.dealer_markup_percent || 0,
                    } : null}
                  />
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Tax Calculator */}
            <TaxCalculator
              subtotal={subtotal}
              discountPercent={discountPercent}
              onDiscountChange={setDiscountPercent}
              lineItems={lineItems}
              taxType={selectedCustomer?.tax_type as "cgst" | "igst" | undefined}
              customerName={selectedCustomer?.name}
            />

            {/* Recurring Settings */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <RefreshCcw className="h-4 w-4" />
                  Recurring Invoice
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="isRecurring"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <FormLabel className="text-sm font-normal">Enable recurring billing</FormLabel>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {isRecurring && (
                  <FormField
                    control={form.control}
                    name="recurringFrequency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Frequency</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || undefined}>
                          <FormControl>
                            <SelectTrigger className="bg-background">
                              <SelectValue placeholder="Select frequency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-popover">
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="quarterly">Quarterly</SelectItem>
                            <SelectItem value="yearly">Yearly</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </Form>
  );
}

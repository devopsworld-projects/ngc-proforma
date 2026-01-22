import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, parseISO } from "date-fns";
import { CalendarIcon, Building2, MapPin, RefreshCcw, Save, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const invoiceFormSchema = z.object({
  invoiceNo: z.string().min(1, "Invoice number is required"),
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
  const updateInvoice = useUpdateInvoice();
  const deleteInvoiceItems = useDeleteInvoiceItems();
  
  const isEditing = !!invoice;
  
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
          invoice.items.map((item) => ({
            id: item.id,
            slNo: item.sl_no,
            description: item.description,
            serialNumbers: item.serial_numbers?.join(", ") || "",
            quantity: item.quantity,
            unit: item.unit,
            rate: item.rate,
            discountPercent: item.discount_percent,
            amount: item.amount,
          }))
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

  const totals = useTaxCalculation(subtotal, discountPercent, taxRate);

  const handleCustomerSelect = (
    customer: Customer | null,
    billingAddress: Address | null,
    shippingAddress: Address | null
  ) => {
    setSelectedCustomer(customer);
    setSelectedBillingAddress(billingAddress);
    setSelectedShippingAddress(shippingAddress);
  };

  const onSubmit = async (data: InvoiceFormData) => {
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
          description: item.description,
          serial_numbers: item.serialNumbers ? item.serialNumbers.split(",").map((s) => s.trim()).filter(Boolean) : null,
          quantity: item.quantity,
          unit: item.unit,
          rate: item.rate,
          discount_percent: item.discountPercent,
          amount: item.amount,
        }));

        const { error: itemsError } = await supabase.from("invoice_items").insert(itemsPayload);
        if (itemsError) throw itemsError;

        toast.success("Invoice updated successfully!");
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
          description: item.description,
          serial_numbers: item.serialNumbers ? item.serialNumbers.split(",").map((s) => s.trim()).filter(Boolean) : null,
          quantity: item.quantity,
          unit: item.unit,
          rate: item.rate,
          discount_percent: item.discountPercent,
          amount: item.amount,
        }));

        const { error: itemsError } = await supabase.from("invoice_items").insert(itemsPayload);
        if (itemsError) throw itemsError;

        // Auto-deduct stock for items with productId
        const stockDeductions = lineItems
          .filter(item => item.productId)
          .map(item => ({
            product_id: item.productId!,
            movement_type: "out" as const,
            quantity: item.quantity,
            serial_numbers: item.serialNumbers ? item.serialNumbers.split(",").map(s => s.trim()).filter(Boolean) : [],
            reference_type: "invoice",
            reference_id: newInvoice.id,
            notes: `Invoice #${data.invoiceNo}`,
            user_id: user.id,
          }));

        if (stockDeductions.length > 0) {
          for (const movement of stockDeductions) {
            // Insert stock movement
            await supabase.from("stock_movements").insert(movement);
            // Update product stock
            const { data: product } = await supabase
              .from("products")
              .select("stock_quantity")
              .eq("id", movement.product_id)
              .single();
            if (product) {
              await supabase
                .from("products")
                .update({ stock_quantity: Math.max(0, (product.stock_quantity || 0) - movement.quantity) })
                .eq("id", movement.product_id);
            }
          }
        }

        toast.success("Invoice created successfully!");
      }

      onSuccess?.();
      navigate("/invoices");
    } catch (error: any) {
      console.error("Error saving invoice:", error);
      toast.error(error.message || "Failed to save invoice");
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
              {isEditing ? `Edit Invoice #${invoice?.invoice_no}` : "Create Invoice"}
            </h2>
            <p className="text-muted-foreground">
              {isEditing ? "Update the invoice details" : "Fill in the details to create a new invoice"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onCancel || (() => navigate("/invoices"))}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="gap-2">
              <Save className="h-4 w-4" />
              {isSubmitting ? "Saving..." : isEditing ? "Update Invoice" : "Save Invoice"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Invoice Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Invoice Details</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="invoiceNo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Invoice Number *</FormLabel>
                      <FormControl>
                        <Input placeholder="INV-001" {...field} />
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
                      <FormLabel>Invoice Date *</FormLabel>
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

            {/* Customer Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Customer</CardTitle>
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
                          <p className="font-semibold">{selectedCustomer.name}</p>
                          {selectedCustomer.gstin && (
                            <p className="text-xs text-muted-foreground font-mono">GSTIN: {selectedCustomer.gstin}</p>
                          )}
                        </div>
                      </div>
                      <CustomerSelector
                        selectedCustomerId={selectedCustomer.id}
                        onSelect={handleCustomerSelect}
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
                      <span>No customer selected</span>
                    </div>
                    <CustomerSelector onSelect={handleCustomerSelect} />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Line Items */}
            <Card>
              <CardContent className="pt-6">
                <LineItemsEditor items={lineItems} onChange={setLineItems} />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Tax Calculator */}
            <TaxCalculator
              subtotal={subtotal}
              discountPercent={discountPercent}
              taxRate={taxRate}
              onDiscountChange={setDiscountPercent}
              onTaxRateChange={setTaxRate}
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

import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Send, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { generateInvoicePDF } from "@/lib/pdf-generator";
import { CompanySettings } from "@/hooks/useCompanySettings";
import { PdfTemplateSettings } from "@/hooks/usePdfTemplateSettings";
import { formatCurrency } from "@/lib/invoice-utils";

const emailFormSchema = z.object({
  recipientEmail: z.string().email("Please enter a valid email address"),
  recipientName: z.string().min(1, "Recipient name is required").max(100),
});

type EmailFormData = z.infer<typeof emailFormSchema>;

interface InvoiceData {
  id: string;
  invoice_no: string;
  date: string;
  grand_total: number;
  subtotal: number;
  discount_percent: number;
  discount_amount: number;
  tax_rate: number;
  tax_amount: number;
  round_off: number;
  e_way_bill_no?: string | null;
  supplier_invoice_no?: string | null;
  supplier_invoice_date?: string | null;
  other_references?: string | null;
  amount_in_words?: string | null;
  items: any[];
  customer?: { name: string; gstin?: string | null; state?: string | null; state_code?: string | null } | null;
  billing_address?: any;
  shipping_address?: any;
}

interface SendInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: InvoiceData | null;
  companySettings: CompanySettings | null;
  templateSettings?: PdfTemplateSettings | null;
}

export function SendInvoiceDialog({
  open,
  onOpenChange,
  invoice,
  companySettings,
  templateSettings,
}: SendInvoiceDialogProps) {
  const [isSending, setIsSending] = useState(false);

  const form = useForm<EmailFormData>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: {
      recipientEmail: "",
      recipientName: invoice?.customer?.name || "",
    },
  });

  // Reset form when invoice changes
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && invoice?.customer) {
      form.reset({
        recipientEmail: "",
        recipientName: invoice.customer.name || "",
      });
    }
    onOpenChange(newOpen);
  };

  const onSubmit = async (data: EmailFormData) => {
    if (!invoice || !companySettings) {
      toast.error("Invoice or company settings not available");
      return;
    }

    setIsSending(true);

    try {
      // Generate PDF as base64
      const pdfBase64 = await generateInvoicePDF(
        {
          invoice_no: invoice.invoice_no,
          date: invoice.date,
          subtotal: invoice.subtotal,
          discount_percent: invoice.discount_percent,
          discount_amount: invoice.discount_amount,
          tax_rate: invoice.tax_rate,
          tax_amount: invoice.tax_amount,
          round_off: invoice.round_off,
          grand_total: invoice.grand_total,
          e_way_bill_no: invoice.e_way_bill_no,
          supplier_invoice_no: invoice.supplier_invoice_no,
          supplier_invoice_date: invoice.supplier_invoice_date,
          other_references: invoice.other_references,
          amount_in_words: invoice.amount_in_words,
          items: invoice.items,
          customer: invoice.customer,
          billing_address: invoice.billing_address,
          shipping_address: invoice.shipping_address,
        },
        companySettings,
        { returnBase64: true, templateSettings }
      );

      if (!pdfBase64) {
        throw new Error("Failed to generate PDF");
      }

      // Call edge function to send email
      const { data: response, error } = await supabase.functions.invoke(
        "send-invoice-email",
        {
          body: {
            invoiceId: invoice.id,
            recipientEmail: data.recipientEmail,
            recipientName: data.recipientName,
            pdfBase64,
            invoiceNo: invoice.invoice_no,
            grandTotal: formatCurrency(invoice.grand_total),
            companyName: companySettings.name,
          },
        }
      );

      if (error) throw error;

      toast.success(`Invoice sent successfully to ${data.recipientEmail}`);
      onOpenChange(false);
      form.reset();
    } catch (error: any) {
      console.error("Error sending invoice:", error);
      toast.error(error.message || "Failed to send invoice email");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Send Invoice via Email
          </DialogTitle>
          <DialogDescription>
            Send Invoice #{invoice?.invoice_no} to the customer via email with PDF
            attachment.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="recipientName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recipient Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Customer name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="recipientEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recipient Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="customer@example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {invoice && (
              <div className="rounded-lg bg-muted p-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Invoice Amount:</span>
                  <span className="font-semibold">
                    {formatCurrency(invoice.grand_total)}
                  </span>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSending}>
                {isSending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Invoice
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

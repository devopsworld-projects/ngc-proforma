import { AppLayout } from "@/components/layout/AppLayout";
import { useInvoices } from "@/hooks/useInvoices";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { RefreshCcw, Calendar, FileText, Plus } from "lucide-react";

const frequencyLabels: Record<string, string> = {
  weekly: "Weekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
  yearly: "Yearly",
};

export default function RecurringPage() {
  const { data: invoices } = useInvoices();
  const recurringInvoices = invoices?.filter((inv) => inv.is_recurring) || [];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-serif font-bold flex items-center gap-2">
              <RefreshCcw className="h-6 w-6" />
              Recurring Proformas
            </h2>
            <p className="text-muted-foreground">
              Manage automatically recurring proforma invoices for repeat customers
            </p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Recurring Proforma
          </Button>
        </div>

        {recurringInvoices.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <RefreshCcw className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No recurring proformas</h3>
              <p className="text-muted-foreground mb-4">
                Set up recurring proforma invoices for customers with regular billing cycles
              </p>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create Recurring Proforma
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recurringInvoices.map((invoice) => (
              <Card key={invoice.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-invoice-accent/10 flex items-center justify-center">
                        <RefreshCcw className="w-5 h-5 text-invoice-accent" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">Proforma #{invoice.invoice_no}</CardTitle>
                        {(invoice as any).customers?.name && (
                          <p className="text-sm text-muted-foreground">
                            {(invoice as any).customers.name}
                          </p>
                        )}
                      </div>
                    </div>
                    <Switch checked={true} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {invoice.recurring_frequency
                          ? frequencyLabels[invoice.recurring_frequency]
                          : "Not set"}
                      </span>
                    </div>
                    <Badge variant="secondary">
                      {formatCurrency(Number(invoice.grand_total))}
                    </Badge>
                  </div>
                  {invoice.next_invoice_date && (
                    <div className="text-sm text-muted-foreground">
                      Next proforma: {new Date(invoice.next_invoice_date).toLocaleDateString("en-IN")}
                    </div>
                  )}
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="outline" className="flex-1 gap-2">
                      <FileText className="h-4 w-4" />
                      View
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="py-4">
              <h4 className="font-medium mb-1">Weekly</h4>
              <p className="text-sm text-muted-foreground">
                Proforma generated every week on the same day
              </p>
            </CardContent>
          </Card>
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="py-4">
              <h4 className="font-medium mb-1">Monthly</h4>
              <p className="text-sm text-muted-foreground">
                Proforma generated on the same date each month
              </p>
            </CardContent>
          </Card>
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="py-4">
              <h4 className="font-medium mb-1">Quarterly / Yearly</h4>
              <p className="text-sm text-muted-foreground">
                Proforma generated every 3 or 12 months
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}

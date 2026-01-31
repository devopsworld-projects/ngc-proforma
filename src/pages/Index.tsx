import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Plus, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
const Index = () => {
  const navigate = useNavigate();
  return <AppLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-serif font-bold">Welcome to Global Shopee Proforma Invoice System</h2>
          
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate("/invoices/new")}>
            <CardContent className="py-8 text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Plus className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Create Invoice</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Generate a new invoice with customer details, line items, and automatic tax calculations
              </p>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                New Invoice
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate("/dashboard")}>
            <CardContent className="py-8 text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-invoice-accent/10 flex items-center justify-center mb-4">
                <BarChart3 className="w-8 h-8 text-invoice-accent" />
              </div>
              <h3 className="text-lg font-semibold mb-2">View Dashboard</h3>
              <p className="text-muted-foreground text-sm mb-4">
                See your revenue breakdown, invoice statistics, and customer overview
              </p>
              <Button variant="outline" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                Open Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Quick Start Guide</h3>
            <div className="max-w-md mx-auto text-sm text-muted-foreground space-y-2">
              <p>
                1. Add your customers in the <strong>Customers</strong> section
              </p>
              <p>2. Create invoices with line items and tax calculations</p>
              <p>3. Track invoice status and manage recurring billing</p>
              <p>4. View analytics in the Dashboard</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>;
};
export default Index;
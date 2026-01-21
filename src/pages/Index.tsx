import { AppLayout } from "@/components/layout/AppLayout";
import { Invoice } from "@/components/invoice/Invoice";
import { InvoiceActions } from "@/components/invoice/InvoiceActions";
import { CustomerSelector } from "@/components/customers/CustomerSelector";
import { sampleInvoice } from "@/data/sampleInvoice";
import { useState } from "react";
import { Customer, Address } from "@/hooks/useCustomers";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, MapPin, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const Index = () => {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedBillingAddress, setSelectedBillingAddress] = useState<Address | null>(null);
  const [selectedShippingAddress, setSelectedShippingAddress] = useState<Address | null>(null);

  const handleCustomerSelect = (
    customer: Customer | null,
    billingAddress: Address | null,
    shippingAddress: Address | null
  ) => {
    setSelectedCustomer(customer);
    setSelectedBillingAddress(billingAddress);
    setSelectedShippingAddress(shippingAddress);
  };

  const clearSelection = () => {
    setSelectedCustomer(null);
    setSelectedBillingAddress(null);
    setSelectedShippingAddress(null);
  };

  // Merge customer data with invoice if selected
  const invoiceData = selectedCustomer
    ? {
        ...sampleInvoice,
        supplier: {
          name: selectedCustomer.name,
          address: selectedBillingAddress
            ? `${selectedBillingAddress.address_line1}${selectedBillingAddress.address_line2 ? `, ${selectedBillingAddress.address_line2}` : ""}, ${selectedBillingAddress.city}, ${selectedBillingAddress.state} - ${selectedBillingAddress.postal_code}`
            : "",
          gstin: selectedCustomer.gstin || "",
          state: selectedCustomer.state || selectedBillingAddress?.state || "",
          stateCode: selectedCustomer.state_code || selectedBillingAddress?.state_code || "",
        },
      }
    : sampleInvoice;

  return (
    <AppLayout>
      {/* Customer Selection Panel */}
      <div className="no-print mb-6">
        {selectedCustomer ? (
          <Card className="bg-invoice-subtle border-invoice-border">
            <CardContent className="py-4">
              <div className="flex items-start justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">Selected Customer</Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{selectedCustomer.name}</h3>
                      {selectedCustomer.gstin && (
                        <p className="text-xs text-muted-foreground font-mono">
                          GSTIN: {selectedCustomer.gstin}
                        </p>
                      )}
                    </div>
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
                <div className="flex gap-2">
                  <CustomerSelector
                    selectedCustomerId={selectedCustomer?.id}
                    selectedBillingAddressId={selectedBillingAddress?.id}
                    selectedShippingAddressId={selectedShippingAddress?.id}
                    onSelect={handleCustomerSelect}
                    trigger={
                      <Button size="sm" variant="outline">
                        Change
                      </Button>
                    }
                  />
                  <Button size="icon" variant="ghost" onClick={clearSelection}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-dashed">
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">No customer selected</p>
                    <p className="text-sm text-muted-foreground">
                      Select a customer to link this invoice
                    </p>
                  </div>
                </div>
                <CustomerSelector onSelect={handleCustomerSelect} />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Actions */}
      <InvoiceActions />

      {/* Invoice Preview */}
      <Invoice data={invoiceData} />
    </AppLayout>
  );
};

export default Index;

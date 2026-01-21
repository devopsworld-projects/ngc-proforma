import { useState } from "react";
import { Customer, Address, useCustomers } from "@/hooks/useCustomers";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Search, Building2, MapPin, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface CustomerSelectorProps {
  selectedCustomerId?: string | null;
  selectedBillingAddressId?: string | null;
  selectedShippingAddressId?: string | null;
  onSelect: (customer: Customer | null, billingAddress: Address | null, shippingAddress: Address | null) => void;
  trigger?: React.ReactNode;
}

export function CustomerSelector({
  selectedCustomerId,
  selectedBillingAddressId,
  selectedShippingAddressId,
  onSelect,
  trigger,
}: CustomerSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [step, setStep] = useState<"customer" | "billing" | "shipping">("customer");
  const [tempCustomer, setTempCustomer] = useState<Customer | null>(null);
  const [tempBillingAddress, setTempBillingAddress] = useState<Address | null>(null);
  const [tempShippingAddress, setTempShippingAddress] = useState<Address | null>(null);

  const { data: customers } = useCustomers();

  const { data: addresses } = useQuery({
    queryKey: ["customer-addresses", tempCustomer?.id],
    queryFn: async () => {
      if (!tempCustomer?.id) return [];
      const { data, error } = await supabase
        .from("addresses")
        .select("*")
        .eq("customer_id", tempCustomer.id)
        .order("is_default", { ascending: false });
      if (error) throw error;
      return data as Address[];
    },
    enabled: !!tempCustomer?.id,
  });

  const filteredCustomers = customers?.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.gstin?.toLowerCase().includes(search.toLowerCase())
  );

  const billingAddresses = addresses?.filter((a) => a.address_type === "billing") || [];
  const shippingAddresses = addresses?.filter((a) => a.address_type === "shipping") || [];

  const handleCustomerSelect = (customer: Customer) => {
    setTempCustomer(customer);
    setStep("billing");
  };

  const handleBillingSelect = (address: Address | null) => {
    setTempBillingAddress(address);
    setStep("shipping");
  };

  const handleShippingSelect = (address: Address | null) => {
    setTempShippingAddress(address);
    onSelect(tempCustomer, tempBillingAddress, address);
    setOpen(false);
    resetState();
  };

  const handleSkipAddresses = () => {
    onSelect(tempCustomer, null, null);
    setOpen(false);
    resetState();
  };

  const resetState = () => {
    setStep("customer");
    setTempCustomer(null);
    setTempBillingAddress(null);
    setTempShippingAddress(null);
    setSearch("");
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      resetState();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Building2 className="h-4 w-4" />
            Select Customer
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px] max-h-[80vh] overflow-hidden flex flex-col bg-card">
        <DialogHeader>
          <DialogTitle className="font-serif">
            {step === "customer" && "Select Customer"}
            {step === "billing" && "Select Billing Address"}
            {step === "shipping" && "Select Shipping Address"}
          </DialogTitle>
        </DialogHeader>

        {step === "customer" && (
          <>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search customers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 max-h-[400px] pr-2">
              {filteredCustomers?.map((customer) => (
                <Card
                  key={customer.id}
                  className={`cursor-pointer hover:border-primary transition-colors ${
                    selectedCustomerId === customer.id ? "border-primary bg-primary/5" : ""
                  }`}
                  onClick={() => handleCustomerSelect(customer)}
                >
                  <CardContent className="py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Building2 className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{customer.name}</p>
                        {customer.gstin && (
                          <p className="text-xs text-muted-foreground font-mono">GSTIN: {customer.gstin}</p>
                        )}
                      </div>
                      {customer.state && <Badge variant="secondary" className="text-xs">{customer.state}</Badge>}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filteredCustomers?.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">No customers found</div>
              )}
            </div>
          </>
        )}

        {step === "billing" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Building2 className="h-4 w-4" />
              <span>{tempCustomer?.name}</span>
            </div>

            {billingAddresses.length === 0 ? (
              <div className="text-center py-8">
                <MapPin className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground mb-4">No billing addresses available</p>
                <Button onClick={handleSkipAddresses}>Continue without address</Button>
              </div>
            ) : (
              <>
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                  {billingAddresses.map((address) => (
                    <AddressOption
                      key={address.id}
                      address={address}
                      selected={selectedBillingAddressId === address.id}
                      onClick={() => handleBillingSelect(address)}
                    />
                  ))}
                </div>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" onClick={() => setStep("customer")}>Back</Button>
                  <Button variant="ghost" onClick={() => handleBillingSelect(null)}>Skip</Button>
                </div>
              </>
            )}
          </div>
        )}

        {step === "shipping" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Building2 className="h-4 w-4" />
              <span>{tempCustomer?.name}</span>
              {tempBillingAddress && (
                <>
                  <span>•</span>
                  <MapPin className="h-3.5 w-3.5" />
                  <span className="truncate">{tempBillingAddress.city}</span>
                </>
              )}
            </div>

            {shippingAddresses.length === 0 ? (
              <div className="text-center py-8">
                <MapPin className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground mb-4">No shipping addresses available</p>
                <Button onClick={() => handleShippingSelect(null)}>Continue</Button>
              </div>
            ) : (
              <>
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                  {shippingAddresses.map((address) => (
                    <AddressOption
                      key={address.id}
                      address={address}
                      selected={selectedShippingAddressId === address.id}
                      onClick={() => handleShippingSelect(address)}
                    />
                  ))}
                </div>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" onClick={() => setStep("billing")}>Back</Button>
                  <Button variant="ghost" onClick={() => handleShippingSelect(null)}>Skip</Button>
                </div>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function AddressOption({ address, selected, onClick }: { address: Address; selected: boolean; onClick: () => void }) {
  return (
    <Card
      className={`cursor-pointer hover:border-primary transition-colors ${selected ? "border-primary bg-primary/5" : ""}`}
      onClick={onClick}
    >
      <CardContent className="py-3">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
            <MapPin className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm truncate">{address.address_line1}</span>
              {address.is_default && <Star className="h-3.5 w-3.5 text-invoice-accent fill-invoice-accent flex-shrink-0" />}
            </div>
            {address.address_line2 && <p className="text-xs text-muted-foreground truncate">{address.address_line2}</p>}
            <p className="text-xs text-muted-foreground">
              {address.city}, {address.state} {address.postal_code}
            </p>
          </div>
          {address.state_code && <Badge variant="secondary" className="text-xs flex-shrink-0">{address.state_code}</Badge>}
        </div>
      </CardContent>
    </Card>
  );
}

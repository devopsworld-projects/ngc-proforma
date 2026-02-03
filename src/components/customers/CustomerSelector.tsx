import { useState, useEffect } from "react";
import { Customer, Address, useCustomers, useCreateCustomer, useCreateAddress } from "@/hooks/useCustomers";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Search, Building2, MapPin, Star, Plus, UserPlus, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface CustomerSelectorProps {
  selectedCustomerId?: string | null;
  selectedBillingAddressId?: string | null;
  selectedShippingAddressId?: string | null;
  onSelect: (customer: Customer | null, billingAddress: Address | null, shippingAddress: Address | null) => void;
  trigger?: React.ReactNode;
  filterType?: "customer" | "dealer" | null; // Filter by customer type
}

export function CustomerSelector({
  selectedCustomerId,
  selectedBillingAddressId,
  selectedShippingAddressId,
  onSelect,
  trigger,
  filterType,
}: CustomerSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [step, setStep] = useState<"customer" | "billing" | "shipping" | "create" | "create-address">("customer");
  const [tempCustomer, setTempCustomer] = useState<Customer | null>(null);
  const [tempBillingAddress, setTempBillingAddress] = useState<Address | null>(null);
  const [tempShippingAddress, setTempShippingAddress] = useState<Address | null>(null);
  const [addressTypeToCreate, setAddressTypeToCreate] = useState<"billing" | "shipping">("billing");

  // New customer form state - default to filterType if provided
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerType, setNewCustomerType] = useState<"customer" | "dealer">(filterType || "customer");
  const [newCustomerTaxType, setNewCustomerTaxType] = useState<"cgst" | "igst">("cgst");
  const [newCustomerGstin, setNewCustomerGstin] = useState("");
  const [newCustomerEmail, setNewCustomerEmail] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [newCustomerState, setNewCustomerState] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // New address form state
  const [newAddressLine1, setNewAddressLine1] = useState("");
  const [newAddressLine2, setNewAddressLine2] = useState("");
  const [newAddressCity, setNewAddressCity] = useState("");
  const [newAddressState, setNewAddressState] = useState("");
  const [newAddressStateCode, setNewAddressStateCode] = useState("");
  const [newAddressPostalCode, setNewAddressPostalCode] = useState("");
  const [newAddressCountry, setNewAddressCountry] = useState("India");
  const [newAddressIsDefault, setNewAddressIsDefault] = useState(true);
  const [isCreatingAddress, setIsCreatingAddress] = useState(false);

  const queryClient = useQueryClient();
  const { data: customers, refetch: refetchCustomers } = useCustomers();
  const createCustomer = useCreateCustomer();
  const createAddress = useCreateAddress();

  // Update newCustomerType when filterType changes
  useEffect(() => {
    if (filterType) {
      setNewCustomerType(filterType);
    }
  }, [filterType]);

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

  // Filter customers by search AND by type if filterType is provided
  const filteredCustomers = customers?.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.gstin?.toLowerCase().includes(search.toLowerCase());
    
    const matchesType = filterType ? c.customer_type === filterType : true;
    
    return matchesSearch && matchesType;
  });

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

  const handleCreateCustomer = async () => {
    if (!newCustomerName.trim()) {
      toast.error("Customer name is required");
      return;
    }

    setIsCreating(true);
    try {
      const newCustomer = await createCustomer.mutateAsync({
        name: newCustomerName.trim(),
        customer_type: newCustomerType,
        tax_type: newCustomerTaxType,
        gstin: newCustomerGstin.trim() || null,
        email: newCustomerEmail.trim() || null,
        phone: newCustomerPhone.trim() || null,
        state: newCustomerState.trim() || null,
        state_code: null,
        is_active: true,
        notes: null,
      });

      toast.success(`${newCustomerType === "dealer" ? "Dealer" : "Customer"} created successfully`);
      await refetchCustomers();
      
      // Auto-select the new customer
      setTempCustomer(newCustomer as Customer);
      setStep("billing");
      
      // Reset form fields
      setNewCustomerName("");
      setNewCustomerGstin("");
      setNewCustomerEmail("");
      setNewCustomerPhone("");
      setNewCustomerState("");
    } catch (error: any) {
      toast.error(error.message || "Failed to create customer");
    } finally {
      setIsCreating(false);
    }
  };

  const resetAddressForm = () => {
    setNewAddressLine1("");
    setNewAddressLine2("");
    setNewAddressCity("");
    setNewAddressState("");
    setNewAddressStateCode("");
    setNewAddressPostalCode("");
    setNewAddressCountry("India");
    setNewAddressIsDefault(true);
  };

  const handleCreateAddress = async () => {
    if (!newAddressLine1.trim()) {
      toast.error("Address line 1 is required");
      return;
    }
    if (!newAddressCity.trim()) {
      toast.error("City is required");
      return;
    }
    if (!newAddressState.trim()) {
      toast.error("State is required");
      return;
    }
    if (!newAddressPostalCode.trim()) {
      toast.error("Postal code is required");
      return;
    }
    if (!tempCustomer) {
      toast.error("No customer selected");
      return;
    }

    setIsCreatingAddress(true);
    try {
      const newAddress = await createAddress.mutateAsync({
        customer_id: tempCustomer.id,
        address_type: addressTypeToCreate,
        address_line1: newAddressLine1.trim(),
        address_line2: newAddressLine2.trim() || null,
        city: newAddressCity.trim(),
        state: newAddressState.trim(),
        state_code: newAddressStateCode.trim() || null,
        postal_code: newAddressPostalCode.trim(),
        country: newAddressCountry.trim(),
        is_default: newAddressIsDefault,
      });

      toast.success(`${addressTypeToCreate === "billing" ? "Billing" : "Shipping"} address added`);
      
      // Invalidate the addresses query to refetch
      queryClient.invalidateQueries({ queryKey: ["customer-addresses", tempCustomer.id] });
      
      resetAddressForm();
      
      // Auto-select the new address and go to next step
      if (addressTypeToCreate === "billing") {
        setTempBillingAddress(newAddress as Address);
        setStep("shipping");
      } else {
        setTempShippingAddress(newAddress as Address);
        onSelect(tempCustomer, tempBillingAddress, newAddress as Address);
        setOpen(false);
        resetState();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to add address");
    } finally {
      setIsCreatingAddress(false);
    }
  };

  const resetState = () => {
    setStep("customer");
    setTempCustomer(null);
    setTempBillingAddress(null);
    setTempShippingAddress(null);
    setSearch("");
    setNewCustomerName("");
    setNewCustomerType(filterType || "customer");
    setNewCustomerTaxType("cgst");
    setNewCustomerGstin("");
    setNewCustomerEmail("");
    setNewCustomerPhone("");
    setNewCustomerState("");
    resetAddressForm();
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      resetState();
    }
  };

  const typeLabel = filterType === "dealer" ? "Dealer" : filterType === "customer" ? "Customer" : "Customer/Dealer";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Building2 className="h-4 w-4" />
            Select {typeLabel}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px] max-h-[80vh] overflow-hidden flex flex-col bg-card">
        <DialogHeader>
          <DialogTitle className="font-serif">
            {step === "customer" && `Select ${typeLabel}`}
            {step === "create" && `Create New ${typeLabel}`}
            {step === "create-address" && `Add ${addressTypeToCreate === "billing" ? "Billing" : "Shipping"} Address`}
            {step === "billing" && "Select Billing Address"}
            {step === "shipping" && "Select Shipping Address"}
          </DialogTitle>
          <DialogDescription>
            {step === "customer" && `Choose a ${typeLabel.toLowerCase()} for this quotation`}
            {step === "create" && `Add a new ${typeLabel.toLowerCase()} to your records`}
            {step === "create-address" && `Add a new ${addressTypeToCreate} address for ${tempCustomer?.name}`}
            {step === "billing" && "Select, add, or skip billing address"}
            {step === "shipping" && "Select, add, or skip shipping address"}
          </DialogDescription>
        </DialogHeader>

        {step === "customer" && (
          <>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={`Search ${typeLabel.toLowerCase()}s...`}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" onClick={() => setStep("create")} className="gap-2">
                <UserPlus className="h-4 w-4" />
                New
              </Button>
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
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{customer.name}</p>
                          <Badge variant={customer.customer_type === "dealer" ? "default" : "secondary"} className="text-xs">
                            {customer.customer_type === "dealer" ? "Dealer" : "Customer"}
                          </Badge>
                        </div>
                        {customer.gstin && (
                          <p className="text-xs text-muted-foreground font-mono">GSTIN: {customer.gstin}</p>
                        )}
                      </div>
                      {customer.state && <Badge variant="outline" className="text-xs">{customer.state}</Badge>}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filteredCustomers?.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="mb-4">No {typeLabel.toLowerCase()}s found</p>
                  <Button variant="outline" onClick={() => setStep("create")} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create New {typeLabel}
                  </Button>
                </div>
              )}
            </div>
          </>
        )}

        {step === "create" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="customerName">Name *</Label>
                <Input
                  id="customerName"
                  placeholder={`Enter ${typeLabel.toLowerCase()} name`}
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="customerType">Type *</Label>
                <Select 
                  value={newCustomerType} 
                  onValueChange={(v) => setNewCustomerType(v as "customer" | "dealer")}
                  disabled={!!filterType} // Disable if filterType is set
                >
                  <SelectTrigger id="customerType" className="bg-background">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="customer">Customer</SelectItem>
                    <SelectItem value="dealer">Dealer</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {newCustomerType === "dealer" ? "Dealer pricing will apply" : "Customer pricing will apply"}
                </p>
              </div>

              <div className="col-span-2 space-y-2">
                <Label>Tax Type *</Label>
                <RadioGroup
                  value={newCustomerTaxType}
                  onValueChange={(v) => setNewCustomerTaxType(v as "cgst" | "igst")}
                  className="flex gap-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="cgst" id="inline-cgst" />
                    <Label htmlFor="inline-cgst" className="font-normal cursor-pointer">
                      CGST + SGST (Intra-state)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="igst" id="inline-igst" />
                    <Label htmlFor="inline-igst" className="font-normal cursor-pointer">
                      IGST (Inter-state)
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="customerGstin">GSTIN</Label>
                <Input
                  id="customerGstin"
                  placeholder="22AAAAA0000A1Z5"
                  value={newCustomerGstin}
                  onChange={(e) => setNewCustomerGstin(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customerEmail">Email</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  placeholder="email@example.com"
                  value={newCustomerEmail}
                  onChange={(e) => setNewCustomerEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customerPhone">Phone</Label>
                <Input
                  id="customerPhone"
                  placeholder="+91 98765 43210"
                  value={newCustomerPhone}
                  onChange={(e) => setNewCustomerPhone(e.target.value)}
                />
              </div>

              <div className="col-span-2 space-y-2">
                <Label htmlFor="customerState">State</Label>
                <Input
                  id="customerState"
                  placeholder="e.g., Karnataka"
                  value={newCustomerState}
                  onChange={(e) => setNewCustomerState(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setStep("customer")}>Back</Button>
              <Button onClick={handleCreateCustomer} disabled={isCreating} className="flex-1">
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Create {newCustomerType === "dealer" ? "Dealer" : "Customer"}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {step === "billing" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Building2 className="h-4 w-4" />
              <span>{tempCustomer?.name}</span>
              <Badge variant={tempCustomer?.customer_type === "dealer" ? "default" : "secondary"} className="text-xs">
                {tempCustomer?.customer_type === "dealer" ? "Dealer" : "Customer"}
              </Badge>
            </div>

            {billingAddresses.length === 0 ? (
              <div className="text-center py-8">
                <MapPin className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground mb-4">No billing addresses available</p>
                <div className="flex gap-2 justify-center">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setAddressTypeToCreate("billing");
                      setStep("create-address");
                    }}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Address
                  </Button>
                  <Button onClick={handleSkipAddresses}>Continue without</Button>
                </div>
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
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setAddressTypeToCreate("billing");
                      setStep("create-address");
                    }}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add
                  </Button>
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
                <div className="flex gap-2 justify-center">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setAddressTypeToCreate("shipping");
                      setStep("create-address");
                    }}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Address
                  </Button>
                  <Button onClick={() => handleShippingSelect(null)}>Continue without</Button>
                </div>
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
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setAddressTypeToCreate("shipping");
                      setStep("create-address");
                    }}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add
                  </Button>
                  <Button variant="ghost" onClick={() => handleShippingSelect(null)}>Skip</Button>
                </div>
              </>
            )}
          </div>
        )}

        {step === "create-address" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Building2 className="h-4 w-4" />
              <span>{tempCustomer?.name}</span>
              <Badge variant="outline" className="text-xs">
                {addressTypeToCreate === "billing" ? "Billing" : "Shipping"}
              </Badge>
            </div>

            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="addressLine1">Address Line 1 *</Label>
                <Input
                  id="addressLine1"
                  placeholder="Street address"
                  value={newAddressLine1}
                  onChange={(e) => setNewAddressLine1(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="addressLine2">Address Line 2</Label>
                <Input
                  id="addressLine2"
                  placeholder="Apartment, suite, etc."
                  value={newAddressLine2}
                  onChange={(e) => setNewAddressLine2(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    placeholder="City"
                    value={newAddressCity}
                    onChange={(e) => setNewAddressCity(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postalCode">Postal Code *</Label>
                  <Input
                    id="postalCode"
                    placeholder="Postal code"
                    value={newAddressPostalCode}
                    onChange={(e) => setNewAddressPostalCode(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="state">State *</Label>
                  <Input
                    id="state"
                    placeholder="State"
                    value={newAddressState}
                    onChange={(e) => setNewAddressState(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stateCode">State Code</Label>
                  <Input
                    id="stateCode"
                    placeholder="e.g. 37"
                    value={newAddressStateCode}
                    onChange={(e) => setNewAddressStateCode(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  placeholder="Country"
                  value={newAddressCountry}
                  onChange={(e) => setNewAddressCountry(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <Label htmlFor="isDefault" className="text-sm font-normal">Set as default address</Label>
                <Switch
                  id="isDefault"
                  checked={newAddressIsDefault}
                  onCheckedChange={setNewAddressIsDefault}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  resetAddressForm();
                  setStep(addressTypeToCreate);
                }}
              >
                Back
              </Button>
              <Button 
                onClick={handleCreateAddress} 
                disabled={isCreatingAddress}
                className="flex-1"
              >
                {isCreatingAddress ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Address
                  </>
                )}
              </Button>
            </div>
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

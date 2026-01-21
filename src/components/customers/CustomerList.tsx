import { useState } from "react";
import { useCustomers, useCustomer, Address, useDeleteAddress } from "@/hooks/useCustomers";
import { CustomerFormDialog } from "./CustomerFormDialog";
import { CustomerCard } from "./CustomerCard";
import { AddressFormDialog } from "./AddressFormDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Users, ArrowLeft, MapPin, Pencil, Trash2, Star } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function CustomerList() {
  const [search, setSearch] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const { data: customers, isLoading } = useCustomers();
  const { data: selectedCustomer } = useCustomer(selectedCustomerId || undefined);
  const deleteAddress = useDeleteAddress();

  const filteredCustomers = customers?.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.gstin?.toLowerCase().includes(search.toLowerCase())
  );

  const handleDeleteAddress = async (address: Address) => {
    try {
      await deleteAddress.mutateAsync({ id: address.id, customerId: address.customer_id });
      toast.success("Address deleted successfully");
    } catch (error) {
      toast.error("Failed to delete address");
    }
  };

  if (selectedCustomerId && selectedCustomer) {
    const billingAddresses = selectedCustomer.addresses.filter((a) => a.address_type === "billing");
    const shippingAddresses = selectedCustomer.addresses.filter((a) => a.address_type === "shipping");

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => setSelectedCustomerId(null)} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Customers
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl font-serif">{selectedCustomer.name}</CardTitle>
                {selectedCustomer.gstin && (
                  <p className="text-sm text-muted-foreground font-mono mt-1">GSTIN: {selectedCustomer.gstin}</p>
                )}
              </div>
              <CustomerFormDialog
                customer={selectedCustomer}
                trigger={
                  <Button size="sm" variant="outline" className="gap-2">
                    <Pencil className="h-4 w-4" />
                    Edit
                  </Button>
                }
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {selectedCustomer.email && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Email</p>
                  <p className="font-medium">{selectedCustomer.email}</p>
                </div>
              )}
              {selectedCustomer.phone && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Phone</p>
                  <p className="font-medium">{selectedCustomer.phone}</p>
                </div>
              )}
              {selectedCustomer.state && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">State</p>
                  <p className="font-medium">
                    {selectedCustomer.state}
                    {selectedCustomer.state_code && ` (Code: ${selectedCustomer.state_code})`}
                  </p>
                </div>
              )}
            </div>
            {selectedCustomer.notes && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Notes</p>
                <p className="text-sm">{selectedCustomer.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-serif font-semibold flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Addresses
            </h3>
            <AddressFormDialog customerId={selectedCustomer.id} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Billing Addresses */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Billing Addresses</h4>
              {billingAddresses.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-6 text-center text-muted-foreground text-sm">
                    No billing addresses
                  </CardContent>
                </Card>
              ) : (
                billingAddresses.map((address) => (
                  <AddressCard key={address.id} address={address} onDelete={handleDeleteAddress} customerId={selectedCustomer.id} />
                ))
              )}
            </div>

            {/* Shipping Addresses */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Shipping Addresses</h4>
              {shippingAddresses.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-6 text-center text-muted-foreground text-sm">
                    No shipping addresses
                  </CardContent>
                </Card>
              ) : (
                shippingAddresses.map((address) => (
                  <AddressCard key={address.id} address={address} onDelete={handleDeleteAddress} customerId={selectedCustomer.id} />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search customers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <CustomerFormDialog />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredCustomers?.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No customers found</h3>
            <p className="text-muted-foreground mb-4">
              {search ? "Try a different search term" : "Get started by adding your first customer"}
            </p>
            {!search && <CustomerFormDialog />}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers?.map((customer) => (
            <CustomerCard key={customer.id} customer={customer} onSelect={(c) => setSelectedCustomerId(c.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

function AddressCard({ address, onDelete, customerId }: { address: Address; onDelete: (a: Address) => void; customerId: string }) {
  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {address.is_default && (
                <Star className="h-3.5 w-3.5 text-invoice-accent fill-invoice-accent" />
              )}
              <span className="font-medium text-sm">{address.address_line1}</span>
            </div>
            {address.address_line2 && <p className="text-sm text-muted-foreground">{address.address_line2}</p>}
            <p className="text-sm text-muted-foreground">
              {address.city}, {address.state} {address.postal_code}
            </p>
            <p className="text-sm text-muted-foreground">{address.country}</p>
            {address.state_code && (
              <Badge variant="secondary" className="text-xs mt-1">
                Code: {address.state_code}
              </Badge>
            )}
          </div>
          <div className="flex gap-1">
            <AddressFormDialog
              customerId={customerId}
              address={address}
              trigger={
                <Button size="icon" variant="ghost" className="h-7 w-7">
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              }
            />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-card">
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Address</AlertDialogTitle>
                  <AlertDialogDescription>Are you sure you want to delete this address?</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDelete(address)} className="bg-destructive text-destructive-foreground">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

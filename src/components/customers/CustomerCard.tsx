import { Customer, useDeleteCustomer, Address } from "@/hooks/useCustomers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CustomerFormDialog } from "./CustomerFormDialog";
import { AddressFormDialog } from "./AddressFormDialog";
import { Pencil, Trash2, MapPin, Phone, Mail, Building2 } from "lucide-react";
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

interface CustomerCardProps {
  customer: Customer;
  addresses?: Address[];
  onSelect?: (customer: Customer) => void;
  showActions?: boolean;
}

export function CustomerCard({ customer, addresses = [], onSelect, showActions = true }: CustomerCardProps) {
  const deleteCustomer = useDeleteCustomer();

  const handleDelete = async () => {
    try {
      await deleteCustomer.mutateAsync(customer.id);
      toast.success("Customer deleted successfully");
    } catch (error) {
      toast.error("Failed to delete customer");
    }
  };

  const billingAddresses = addresses.filter((a) => a.address_type === "billing");
  const shippingAddresses = addresses.filter((a) => a.address_type === "shipping");

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onSelect?.(customer)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg font-serif">{customer.name}</CardTitle>
              {customer.gstin && (
                <p className="text-xs text-muted-foreground font-mono mt-1">
                  GSTIN: {customer.gstin}
                </p>
              )}
            </div>
          </div>
          {showActions && (
            <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
              <CustomerFormDialog
                customer={customer}
                trigger={
                  <Button size="icon" variant="ghost" className="h-8 w-8">
                    <Pencil className="h-4 w-4" />
                  </Button>
                }
              />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-card">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Customer</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete {customer.name}? This will also delete all associated addresses.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          {customer.email && (
            <div className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" />
              <span>{customer.email}</span>
            </div>
          )}
          {customer.phone && (
            <div className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" />
              <span>{customer.phone}</span>
            </div>
          )}
        </div>

        {customer.state && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {customer.state}
              {customer.state_code && `, Code: ${customer.state_code}`}
            </Badge>
          </div>
        )}

        {addresses.length > 0 && (
          <div className="pt-2 border-t space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <MapPin className="w-3.5 h-3.5" />
              <span>{addresses.length} address{addresses.length > 1 ? "es" : ""}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {billingAddresses.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  {billingAddresses.length} Billing
                </Badge>
              )}
              {shippingAddresses.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  {shippingAddresses.length} Shipping
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

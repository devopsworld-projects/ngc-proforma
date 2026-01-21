import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useCreateAddress, useUpdateAddress, Address } from "@/hooks/useCustomers";
import { toast } from "sonner";
import { Plus, MapPin } from "lucide-react";

const addressSchema = z.object({
  address_type: z.enum(["billing", "shipping"]),
  address_line1: z.string().min(1, "Address is required").max(200),
  address_line2: z.string().max(200).optional().or(z.literal("")),
  city: z.string().min(1, "City is required").max(100),
  state: z.string().min(1, "State is required").max(100),
  state_code: z.string().max(5).optional().or(z.literal("")),
  postal_code: z.string().min(1, "Postal code is required").max(10),
  country: z.string().min(1, "Country is required").max(100),
  is_default: z.boolean(),
});

type AddressFormData = z.infer<typeof addressSchema>;

interface AddressFormDialogProps {
  customerId: string;
  address?: Address;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function AddressFormDialog({ customerId, address, trigger, onSuccess }: AddressFormDialogProps) {
  const [open, setOpen] = useState(false);
  const createAddress = useCreateAddress();
  const updateAddress = useUpdateAddress();
  const isEditing = !!address;

  const form = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      address_type: address?.address_type || "billing",
      address_line1: address?.address_line1 || "",
      address_line2: address?.address_line2 || "",
      city: address?.city || "",
      state: address?.state || "",
      state_code: address?.state_code || "",
      postal_code: address?.postal_code || "",
      country: address?.country || "India",
      is_default: address?.is_default || false,
    },
  });

  const onSubmit = async (data: AddressFormData) => {
    try {
      const payload = {
        customer_id: customerId,
        address_type: data.address_type,
        address_line1: data.address_line1,
        address_line2: data.address_line2 || null,
        city: data.city,
        state: data.state,
        state_code: data.state_code || null,
        postal_code: data.postal_code,
        country: data.country,
        is_default: data.is_default,
      };

      if (isEditing) {
        await updateAddress.mutateAsync({ id: address.id, ...payload });
        toast.success("Address updated successfully");
      } else {
        await createAddress.mutateAsync(payload);
        toast.success("Address added successfully");
      }
      setOpen(false);
      form.reset();
      onSuccess?.();
    } catch (error) {
      toast.error(isEditing ? "Failed to update address" : "Failed to add address");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            Add Address
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-card">
        <DialogHeader>
          <DialogTitle className="font-serif flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            {isEditing ? "Edit Address" : "Add New Address"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="address_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address Type *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-popover">
                      <SelectItem value="billing">Billing Address</SelectItem>
                      <SelectItem value="shipping">Shipping Address</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address_line1"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address Line 1 *</FormLabel>
                  <FormControl>
                    <Input placeholder="Street address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address_line2"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address Line 2</FormLabel>
                  <FormControl>
                    <Input placeholder="Apartment, suite, etc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City *</FormLabel>
                    <FormControl>
                      <Input placeholder="City" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="postal_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Postal Code *</FormLabel>
                    <FormControl>
                      <Input placeholder="Postal code" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State *</FormLabel>
                    <FormControl>
                      <Input placeholder="State" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="state_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State Code</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. 37" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country *</FormLabel>
                  <FormControl>
                    <Input placeholder="Country" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_default"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <FormLabel className="text-sm font-normal">Set as default address</FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createAddress.isPending || updateAddress.isPending}>
                {isEditing ? "Update" : "Add"} Address
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

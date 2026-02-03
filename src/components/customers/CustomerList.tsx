import { useState, useMemo, useEffect } from "react";
import { useCustomers, useCustomer, Address, useDeleteAddress, useDeleteCustomer } from "@/hooks/useCustomers";
import { CustomerFormDialog } from "./CustomerFormDialog";
import { AddressFormDialog } from "./AddressFormDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Search, Users, ArrowLeft, MapPin, Pencil, Trash2, Star, MoreHorizontal, Filter, Eye } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
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

const ITEMS_PER_PAGE = 15;

export function CustomerList() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [taxTypeFilter, setTaxTypeFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const { data: customers, isLoading } = useCustomers();
  const { data: selectedCustomer } = useCustomer(selectedCustomerId || undefined);
  const deleteAddress = useDeleteAddress();
  const deleteCustomer = useDeleteCustomer();

  const handleDeleteCustomer = async (id: string, name: string) => {
    try {
      await deleteCustomer.mutateAsync(id);
      toast.success(`Customer "${name}" deleted successfully`);
    } catch (error) {
      toast.error("Failed to delete customer");
    }
  };

  const filteredCustomers = useMemo(() => {
    return customers?.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.email?.toLowerCase().includes(search.toLowerCase()) ||
        c.gstin?.toLowerCase().includes(search.toLowerCase());
      
      const matchesType =
        typeFilter === "all" ||
        c.customer_type === typeFilter;

      const matchesTaxType =
        taxTypeFilter === "all" ||
        c.tax_type === taxTypeFilter;

      return matchesSearch && matchesType && matchesTaxType;
    }) || [];
  }, [customers, search, typeFilter, taxTypeFilter]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, typeFilter, taxTypeFilter]);

  const totalPages = Math.ceil(filteredCustomers.length / ITEMS_PER_PAGE);
  const paginatedCustomers = filteredCustomers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleDeleteAddress = async (address: Address) => {
    try {
      await deleteAddress.mutateAsync({ id: address.id, customerId: address.customer_id });
      toast.success("Address deleted successfully");
    } catch (error) {
      toast.error("Failed to delete address");
    }
  };

  const getPageNumbers = () => {
    const pages: (number | "ellipsis")[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("ellipsis");
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push("ellipsis");
      pages.push(totalPages);
    }
    return pages;
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
                <div className="flex items-center gap-2">
                  <CardTitle className="text-2xl font-serif">{selectedCustomer.name}</CardTitle>
                  <Badge variant={selectedCustomer.customer_type === "dealer" ? "default" : "secondary"}>
                    {selectedCustomer.customer_type === "dealer" ? "Dealer" : "Customer"}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {selectedCustomer.tax_type === "igst" ? "IGST" : "CGST/SGST"}
                  </Badge>
                </div>
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
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Customer List</CardTitle>
            <Badge variant="secondary">{filteredCustomers.length} customers</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col sm:flex-row gap-3 justify-between">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search customers..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-[160px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="customer">Customer</SelectItem>
                  <SelectItem value="dealer">Dealer</SelectItem>
                </SelectContent>
              </Select>
              <Select value={taxTypeFilter} onValueChange={setTaxTypeFilter}>
                <SelectTrigger className="w-full sm:w-[140px]">
                  <SelectValue placeholder="Tax Type" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  <SelectItem value="all">All Tax Types</SelectItem>
                  <SelectItem value="cgst">CGST/SGST</SelectItem>
                  <SelectItem value="igst">IGST</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <CustomerFormDialog />
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="py-12 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No customers found</h3>
              <p className="text-muted-foreground mb-4">
                {search || typeFilter !== "all" ? "Try a different search or filter" : "Get started by adding your first customer"}
              </p>
              {!search && typeFilter === "all" && <CustomerFormDialog />}
            </div>
          ) : (
            <>
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>GSTIN</TableHead>
                      <TableHead>Added By</TableHead>
                      <TableHead>Date Added</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedCustomers.map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell>
                          <p className="font-medium">{customer.name}</p>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Badge variant={customer.customer_type === "dealer" ? "default" : "secondary"} className="text-xs">
                              {customer.customer_type === "dealer" ? "Dealer" : "Customer"}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {customer.tax_type === "igst" ? "IGST" : "CGST"}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">{customer.email || "—"}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">{customer.phone || "—"}</span>
                        </TableCell>
                        <TableCell>
                          {customer.gstin ? (
                            <Badge variant="outline" className="font-mono text-xs">
                              {customer.gstin}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {(customer as any).creator_name || "—"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(customer.created_at), "dd MMM yyyy")}
                          </span>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-popover z-50">
                              <DropdownMenuItem onClick={() => setSelectedCustomerId(customer.id)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <CustomerFormDialog
                                  customer={customer}
                                  trigger={
                                    <button className="flex w-full items-center px-2 py-1.5 text-sm">
                                      <Pencil className="h-4 w-4 mr-2" />
                                      Edit
                                    </button>
                                  }
                                />
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-destructive focus:text-destructive"
                                onClick={() => handleDeleteCustomer(customer.id, customer.name)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
                    {Math.min(currentPage * ITEMS_PER_PAGE, filteredCustomers.length)} of{" "}
                    {filteredCustomers.length} customers
                  </p>
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                      {getPageNumbers().map((page, idx) =>
                        page === "ellipsis" ? (
                          <PaginationItem key={`ellipsis-${idx}`}>
                            <span className="px-2">...</span>
                          </PaginationItem>
                        ) : (
                          <PaginationItem key={page}>
                            <PaginationLink
                              onClick={() => setCurrentPage(page)}
                              isActive={currentPage === page}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        )
                      )}
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                          className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
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
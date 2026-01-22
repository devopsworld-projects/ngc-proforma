import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Package, Wrench, Truck, ArrowDownToLine, ArrowUpFromLine, Search, MoreHorizontal, Pencil, Trash2, Filter } from "lucide-react";
import { useStockMovements } from "@/hooks/useInventory";
import { useSuppliers, useDeleteSupplier } from "@/hooks/useSuppliers";
import { useServiceTickets, useDeleteServiceTicket } from "@/hooks/useServiceTickets";
import { StockMovementDialog } from "@/components/inventory/StockMovementDialog";
import { SupplierFormDialog } from "@/components/inventory/SupplierFormDialog";
import { ServiceTicketFormDialog } from "@/components/inventory/ServiceTicketFormDialog";
import { formatCurrency } from "@/lib/invoice-utils";
import { format } from "date-fns";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, string> = {
  received: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  diagnosing: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  waiting_parts: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  in_progress: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  delivered: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState("stock");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  const { data: stockMovements = [], isLoading: loadingMovements } = useStockMovements();
  const { data: suppliers = [], isLoading: loadingSuppliers } = useSuppliers();
  const { data: serviceTickets = [], isLoading: loadingTickets } = useServiceTickets(statusFilter !== "all" ? statusFilter : undefined);
  const deleteSupplier = useDeleteSupplier();
  const deleteTicket = useDeleteServiceTicket();

  const handleDeleteSupplier = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete supplier "${name}"?`)) return;
    try {
      await deleteSupplier.mutateAsync(id);
      toast.success("Supplier deleted");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete supplier");
    }
  };

  const handleDeleteTicket = async (id: string, ticketNo: string) => {
    if (!confirm(`Are you sure you want to delete ticket "${ticketNo}"?`)) return;
    try {
      await deleteTicket.mutateAsync(id);
      toast.success("Service ticket deleted");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete ticket");
    }
  };

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.contact_person?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTickets = serviceTickets.filter(t =>
    t.ticket_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.device_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.brand?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-serif font-bold">Inventory Management</h1>
          <p className="text-muted-foreground">Track stock, service repairs, and suppliers</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="stock" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Stock
            </TabsTrigger>
            <TabsTrigger value="service" className="flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              Service
            </TabsTrigger>
            <TabsTrigger value="suppliers" className="flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Suppliers
            </TabsTrigger>
          </TabsList>

          {/* Stock Movements Tab */}
          <TabsContent value="stock" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Stock Movements</CardTitle>
                  <StockMovementDialog />
                </div>
              </CardHeader>
              <CardContent>
                {loadingMovements ? (
                  <div className="py-8 text-center text-muted-foreground">Loading...</div>
                ) : stockMovements.length === 0 ? (
                  <div className="py-12 text-center">
                    <Package className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <h3 className="font-semibold mb-1">No stock movements</h3>
                    <p className="text-sm text-muted-foreground mb-4">Record your first stock movement</p>
                    <StockMovementDialog />
                  </div>
                ) : (
                  <div className="rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Product</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead className="text-right">Qty</TableHead>
                          <TableHead>Reference</TableHead>
                          <TableHead>Notes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {stockMovements.map((movement) => (
                          <TableRow key={movement.id}>
                            <TableCell className="text-sm">
                              {format(new Date(movement.created_at), "dd MMM yyyy")}
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{movement.products?.name}</p>
                                {movement.products?.sku && (
                                  <p className="text-xs text-muted-foreground">{movement.products.sku}</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={movement.movement_type === "in" ? "default" : "secondary"} className="gap-1">
                                {movement.movement_type === "in" ? (
                                  <ArrowDownToLine className="h-3 w-3" />
                                ) : (
                                  <ArrowUpFromLine className="h-3 w-3" />
                                )}
                                {movement.movement_type.toUpperCase()}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {movement.movement_type === "in" ? "+" : "-"}{movement.quantity}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {movement.reference_type || "manual"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                              {movement.notes || "—"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Service Tickets Tab */}
          <TabsContent value="service" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Service Tickets</CardTitle>
                  <ServiceTicketFormDialog />
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search tickets..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="received">Received</SelectItem>
                      <SelectItem value="diagnosing">Diagnosing</SelectItem>
                      <SelectItem value="waiting_parts">Waiting Parts</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {loadingTickets ? (
                  <div className="py-8 text-center text-muted-foreground">Loading...</div>
                ) : filteredTickets.length === 0 ? (
                  <div className="py-12 text-center">
                    <Wrench className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <h3 className="font-semibold mb-1">No service tickets</h3>
                    <p className="text-sm text-muted-foreground mb-4">Create your first service ticket</p>
                    <ServiceTicketFormDialog />
                  </div>
                ) : (
                  <div className="rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ticket #</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Device</TableHead>
                          <TableHead>Problem</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Cost</TableHead>
                          <TableHead className="w-10"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredTickets.map((ticket) => (
                          <TableRow key={ticket.id}>
                            <TableCell className="font-mono font-medium">{ticket.ticket_no}</TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{ticket.customer_name || ticket.customers?.name || "Walk-in"}</p>
                                <p className="text-xs text-muted-foreground">{ticket.customer_phone || ticket.customers?.phone}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{ticket.device_type}</p>
                                <p className="text-xs text-muted-foreground">{[ticket.brand, ticket.model].filter(Boolean).join(" ")}</p>
                              </div>
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate text-sm">
                              {ticket.problem_description}
                            </TableCell>
                            <TableCell>
                              <Badge className={STATUS_COLORS[ticket.status] || ""}>
                                {ticket.status.replace("_", " ")}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              {ticket.final_cost > 0 ? formatCurrency(ticket.final_cost) : ticket.estimated_cost > 0 ? `~${formatCurrency(ticket.estimated_cost)}` : "—"}
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem asChild>
                                    <ServiceTicketFormDialog
                                      ticket={ticket}
                                      trigger={
                                        <button className="flex w-full items-center px-2 py-1.5 text-sm">
                                          <Pencil className="h-4 w-4 mr-2" />
                                          Edit
                                        </button>
                                      }
                                    />
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => handleDeleteTicket(ticket.id, ticket.ticket_no)}
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
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Suppliers Tab */}
          <TabsContent value="suppliers" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Suppliers</CardTitle>
                  <SupplierFormDialog />
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="relative max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search suppliers..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                {loadingSuppliers ? (
                  <div className="py-8 text-center text-muted-foreground">Loading...</div>
                ) : filteredSuppliers.length === 0 ? (
                  <div className="py-12 text-center">
                    <Truck className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <h3 className="font-semibold mb-1">No suppliers</h3>
                    <p className="text-sm text-muted-foreground mb-4">Add your first supplier</p>
                    <SupplierFormDialog />
                  </div>
                ) : (
                  <div className="rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Contact Person</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>GSTIN</TableHead>
                          <TableHead className="w-10"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredSuppliers.map((supplier) => (
                          <TableRow key={supplier.id}>
                            <TableCell className="font-medium">{supplier.name}</TableCell>
                            <TableCell>{supplier.contact_person || "—"}</TableCell>
                            <TableCell>{supplier.phone || "—"}</TableCell>
                            <TableCell>{supplier.email || "—"}</TableCell>
                            <TableCell>
                              {supplier.gstin ? (
                                <Badge variant="outline" className="font-mono text-xs">
                                  {supplier.gstin}
                                </Badge>
                              ) : "—"}
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem asChild>
                                    <SupplierFormDialog
                                      supplier={supplier}
                                      trigger={
                                        <button className="flex w-full items-center px-2 py-1.5 text-sm">
                                          <Pencil className="h-4 w-4 mr-2" />
                                          Edit
                                        </button>
                                      }
                                    />
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => handleDeleteSupplier(supplier.id, supplier.name)}
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
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useIsAdmin, useAdminUserStats, useAdminUserInvoices, useToggleAdminRole, useApproveUser, useDeleteUser, UserStats } from "@/hooks/useAdmin";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Users, FileText, DollarSign, Shield, ShieldOff, Eye, Loader2, CheckCircle, XCircle, Mail, MailX, UserCheck, UserX, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  paid: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(amount);
}

export default function AdminPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { data: users, isLoading: usersLoading } = useAdminUserStats();
  const toggleAdmin = useToggleAdminRole();
  const approveUser = useApproveUser();
  const deleteUser = useDeleteUser();
  
  const [selectedUser, setSelectedUser] = useState<UserStats | null>(null);
  const { data: userInvoices, isLoading: invoicesLoading } = useAdminUserInvoices(selectedUser?.user_id || null);

  if (authLoading || adminLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AppLayout>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <Shield className="h-16 w-16 text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground">You need admin privileges to access this page.</p>
        </div>
      </AppLayout>
    );
  }

  const handleToggleAdmin = async (targetUser: UserStats) => {
    try {
      await toggleAdmin.mutateAsync({
        userId: targetUser.user_id,
        makeAdmin: !targetUser.is_admin,
      });
      toast.success(
        targetUser.is_admin
          ? `Removed admin role from ${targetUser.full_name || targetUser.email}`
          : `Granted admin role to ${targetUser.full_name || targetUser.email}`
      );
    } catch (error: any) {
      toast.error(error.message || "Failed to update role");
    }
  };

  const handleApproveUser = async (targetUser: UserStats, approve: boolean) => {
    try {
      await approveUser.mutateAsync({
        userId: targetUser.user_id,
        approved: approve,
      });
      toast.success(
        approve
          ? `Approved ${targetUser.full_name || targetUser.email}`
          : `Revoked approval for ${targetUser.full_name || targetUser.email}`
      );
    } catch (error: any) {
      toast.error(error.message || "Failed to update approval status");
    }
  };

  const handleDeleteUser = async (targetUser: UserStats) => {
    try {
      await deleteUser.mutateAsync(targetUser.user_id);
      toast.success(`Deleted user ${targetUser.full_name || targetUser.email}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to delete user");
    }
  };

  const totalUsers = users?.length || 0;
  const pendingApproval = users?.filter(u => !u.is_approved && u.email_confirmed_at).length || 0;
  const totalInvoices = users?.reduce((sum, u) => sum + u.invoice_count, 0) || 0;
  const totalRevenue = users?.reduce((sum, u) => sum + Number(u.total_revenue), 0) || 0;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage users and view system-wide statistics</p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUsers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingApproval}</div>
              {pendingApproval > 0 && (
                <p className="text-xs text-amber-600 dark:text-amber-400">Requires attention</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalInvoices}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Users</CardTitle>
            <CardDescription>View and manage user accounts, approvals, and activity</CardDescription>
          </CardHeader>
          <CardContent>
            {usersLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : !users || users.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No users found</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email Status</TableHead>
                    <TableHead>Approval</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-center">Invoices</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-center">Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.user_id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{u.full_name || "—"}</p>
                          <p className="text-sm text-muted-foreground">{u.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {u.email_confirmed_at ? (
                          <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                            <Mail className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <MailX className="h-3 w-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {u.is_approved ? (
                          <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Approved
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <XCircle className="h-3 w-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {u.is_admin ? (
                          <Badge className="bg-primary">Admin</Badge>
                        ) : (
                          <Badge variant="secondary">User</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">{u.invoice_count}</TableCell>
                      <TableCell className="text-right">{formatCurrency(Number(u.total_revenue))}</TableCell>
                      <TableCell className="text-center">
                        {format(new Date(u.created_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* View Invoices */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedUser(u)}
                            disabled={u.invoice_count === 0}
                            title="View invoices"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          {/* Approve/Revoke User */}
                          {u.user_id !== user.id && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" title={u.is_approved ? "Revoke approval" : "Approve user"}>
                                  {u.is_approved ? (
                                    <UserX className="h-4 w-4 text-amber-600" />
                                  ) : (
                                    <UserCheck className="h-4 w-4 text-green-600" />
                                  )}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    {u.is_approved ? "Revoke User Approval?" : "Approve User?"}
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    {u.is_approved
                                      ? `This will revoke access for ${u.full_name || u.email}. They will no longer be able to use the application.`
                                      : `This will approve ${u.full_name || u.email} and grant them access to the application.`}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleApproveUser(u, !u.is_approved)}
                                    className={u.is_approved ? "bg-destructive hover:bg-destructive/90" : "bg-green-600 hover:bg-green-700"}
                                  >
                                    {approveUser.isPending ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : u.is_approved ? (
                                      "Revoke Approval"
                                    ) : (
                                      "Approve User"
                                    )}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                          
                          {/* Toggle Admin Role */}
                          {u.user_id !== user.id && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" title={u.is_admin ? "Remove admin" : "Make admin"}>
                                  {u.is_admin ? (
                                    <ShieldOff className="h-4 w-4 text-destructive" />
                                  ) : (
                                    <Shield className="h-4 w-4 text-primary" />
                                  )}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    {u.is_admin ? "Remove Admin Role?" : "Grant Admin Role?"}
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    {u.is_admin
                                      ? `This will remove admin privileges from ${u.full_name || u.email}. They will no longer be able to access the admin dashboard.`
                                      : `This will grant admin privileges to ${u.full_name || u.email}. They will be able to view all users and invoices.`}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleToggleAdmin(u)}
                                    className={u.is_admin ? "bg-destructive hover:bg-destructive/90" : ""}
                                  >
                                    {toggleAdmin.isPending ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : u.is_admin ? (
                                      "Remove Admin"
                                    ) : (
                                      "Grant Admin"
                                    )}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                          
                          {/* Delete User */}
                          {u.user_id !== user.id && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" title="Delete user">
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete User Permanently?</AlertDialogTitle>
                                  <AlertDialogDescription className="space-y-2">
                                    <p>
                                      This will permanently delete <strong>{u.full_name || u.email}</strong> and all their data including:
                                    </p>
                                    <ul className="list-disc list-inside text-sm">
                                      <li>{u.invoice_count} invoices ({formatCurrency(Number(u.total_revenue))} revenue)</li>
                                      <li>{u.customer_count} customers and their addresses</li>
                                      <li>All products, inventory, and service tickets</li>
                                    </ul>
                                    <p className="font-medium text-destructive">This action cannot be undone.</p>
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteUser(u)}
                                    className="bg-destructive hover:bg-destructive/90"
                                  >
                                    {deleteUser.isPending ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      "Delete User"
                                    )}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* User Invoices Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              Invoices for {selectedUser?.full_name || selectedUser?.email}
            </DialogTitle>
            <DialogDescription>
              Viewing {selectedUser?.invoice_count} invoices • Total: {formatCurrency(Number(selectedUser?.total_revenue || 0))}
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="h-[400px]">
            {invoicesLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : !userInvoices || userInvoices.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No invoices found</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-mono font-medium">#{invoice.invoice_no}</TableCell>
                      <TableCell>{invoice.customer_name || "—"}</TableCell>
                      <TableCell>{format(new Date(invoice.date), "MMM d, yyyy")}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[invoice.status] || ""}>
                          {invoice.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(invoice.grand_total)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
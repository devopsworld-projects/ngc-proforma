import { AppLayout } from "@/components/layout/AppLayout";
import { useInvoices } from "@/hooks/useInvoices";
import { useCustomers } from "@/hooks/useCustomers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  DollarSign, 
  FileText, 
  Users, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  XCircle,
  Send
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { useMemo } from "react";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const COLORS = {
  draft: "hsl(var(--muted-foreground))",
  sent: "hsl(217, 91%, 60%)",
  paid: "hsl(142, 71%, 45%)",
  cancelled: "hsl(var(--destructive))",
};

export default function DashboardPage() {
  const { data: invoices, isLoading: invoicesLoading } = useInvoices();
  const { data: customers, isLoading: customersLoading } = useCustomers();

  const stats = useMemo(() => {
    if (!invoices) return null;

    const totalRevenue = invoices.reduce((sum, inv) => sum + Number(inv.grand_total), 0);
    const paidAmount = invoices
      .filter((inv) => inv.status === "paid")
      .reduce((sum, inv) => sum + Number(inv.grand_total), 0);
    const pendingAmount = invoices
      .filter((inv) => inv.status === "sent")
      .reduce((sum, inv) => sum + Number(inv.grand_total), 0);
    const draftAmount = invoices
      .filter((inv) => inv.status === "draft")
      .reduce((sum, inv) => sum + Number(inv.grand_total), 0);

    const statusCounts = {
      draft: invoices.filter((inv) => inv.status === "draft").length,
      sent: invoices.filter((inv) => inv.status === "sent").length,
      paid: invoices.filter((inv) => inv.status === "paid").length,
      cancelled: invoices.filter((inv) => inv.status === "cancelled").length,
    };

    return {
      totalRevenue,
      paidAmount,
      pendingAmount,
      draftAmount,
      totalInvoices: invoices.length,
      statusCounts,
    };
  }, [invoices]);

  const statusChartData = useMemo(() => {
    if (!stats) return [];
    return [
      { name: "Draft", value: stats.statusCounts.draft, color: COLORS.draft },
      { name: "Sent", value: stats.statusCounts.sent, color: COLORS.sent },
      { name: "Paid", value: stats.statusCounts.paid, color: COLORS.paid },
      { name: "Cancelled", value: stats.statusCounts.cancelled, color: COLORS.cancelled },
    ].filter((item) => item.value > 0);
  }, [stats]);

  const revenueChartData = useMemo(() => {
    if (!stats) return [];
    return [
      { name: "Paid", amount: stats.paidAmount },
      { name: "Pending", amount: stats.pendingAmount },
      { name: "Draft", amount: stats.draftAmount },
    ];
  }, [stats]);

  const isLoading = invoicesLoading || customersLoading;

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-8 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-serif font-bold">Dashboard</h2>
          <p className="text-muted-foreground">Overview of your invoicing activity</p>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats?.totalRevenue || 0)}</div>
              <p className="text-xs text-muted-foreground">
                From {stats?.totalInvoices || 0} invoices
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Paid Amount</CardTitle>
              <CheckCircle className="h-4 w-4 text-invoice-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-invoice-success">
                {formatCurrency(stats?.paidAmount || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats?.statusCounts.paid || 0} paid invoices
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
              <Clock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(stats?.pendingAmount || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats?.statusCounts.sent || 0} sent invoices
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{customers?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                Active customers in system
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Revenue Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Revenue Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              {revenueChartData.some((d) => d.amount > 0) ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={revenueChartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis 
                      tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`}
                      className="text-xs"
                    />
                    <Tooltip
                      formatter={(value: number) => [formatCurrency(value), "Amount"]}
                      contentStyle={{
                        backgroundColor: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No invoice data yet</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Invoice Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Invoice Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statusChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={statusChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {statusChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number, name: string) => [value, name]}
                      contentStyle={{
                        backgroundColor: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No invoices created yet</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-muted/30">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <Clock className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.statusCounts.draft || 0}</p>
                <p className="text-xs text-muted-foreground">Draft Invoices</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 dark:bg-blue-950/20">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Send className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{stats?.statusCounts.sent || 0}</p>
                <p className="text-xs text-muted-foreground">Sent Invoices</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-50 dark:bg-green-950/20">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{stats?.statusCounts.paid || 0}</p>
                <p className="text-xs text-muted-foreground">Paid Invoices</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-red-50 dark:bg-red-950/20">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{stats?.statusCounts.cancelled || 0}</p>
                <p className="text-xs text-muted-foreground">Cancelled</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}

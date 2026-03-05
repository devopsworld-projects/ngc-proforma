import { AppLayout } from "@/components/layout/AppLayout";
import { useIsAdmin } from "@/hooks/useAdmin";
import { useAuth } from "@/hooks/useAuth";
import { useOrgPerformanceStats, useTopProductsStats, UserPerformance } from "@/hooks/useOrgPerformance";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Trophy, TrendingUp, Users, Package, FileText, Clock, Crown, Medal, Award } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
  }).format(amount);
}

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2, 160 60% 45%))",
  "hsl(var(--chart-3, 30 80% 55%))",
  "hsl(var(--chart-4, 280 65% 60%))",
  "hsl(var(--chart-5, 340 75% 55%))",
  "#6366f1",
  "#14b8a6",
  "#f59e0b",
];

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <Crown className="h-5 w-5 text-yellow-500" />;
  if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
  if (rank === 3) return <Award className="h-5 w-5 text-amber-600" />;
  return <span className="text-sm text-muted-foreground font-mono w-5 text-center">#{rank}</span>;
}

function LeaderboardCard({ title, icon: Icon, data, valueKey, formatValue, description }: {
  title: string;
  icon: typeof Trophy;
  data: { name: string; value: number }[];
  valueKey: string;
  formatValue: (v: number) => string;
  description: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          {title}
        </CardTitle>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No data yet</p>
        ) : (
          <div className="space-y-2">
            {data.slice(0, 5).map((item, i) => (
              <div key={i} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <RankBadge rank={i + 1} />
                  <span className="text-sm truncate">{item.name}</span>
                </div>
                <Badge variant="secondary" className="shrink-0 font-mono text-xs">
                  {formatValue(item.value)}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function PerformanceTracker() {
  const { user, isLoading: authLoading } = useAuth();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { data: stats, isLoading: statsLoading } = useOrgPerformanceStats();
  const { data: topProducts, isLoading: productsLoading } = useTopProductsStats();

  if (authLoading || adminLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <Shield className="h-16 w-16 text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground">Admin privileges required.</p>
        </div>
      </AppLayout>
    );
  }

  const isLoading = statsLoading || productsLoading;
  const users = stats || [];

  // Build leaderboards
  const byCreated = users.map(u => ({ name: u.full_name || u.email, value: u.proformas_created })).sort((a, b) => b.value - a.value);
  const bySent = users.map(u => ({ name: u.full_name || u.email, value: u.proformas_sent })).sort((a, b) => b.value - a.value);
  const byPaid = users.map(u => ({ name: u.full_name || u.email, value: u.proformas_paid })).sort((a, b) => b.value - a.value);
  const byRevenue = users.map(u => ({ name: u.full_name || u.email, value: Number(u.total_revenue) })).sort((a, b) => b.value - a.value);
  const byCustomers = users.map(u => ({ name: u.full_name || u.email, value: u.customers_added })).sort((a, b) => b.value - a.value);
  const byProducts = users.map(u => ({ name: u.full_name || u.email, value: u.products_added })).sort((a, b) => b.value - a.value);
  const bySessions = users.map(u => ({ name: u.full_name || u.email, value: u.session_count })).sort((a, b) => b.value - a.value);

  // Summary stats
  const totalProformas = users.reduce((s, u) => s + u.proformas_created, 0);
  const totalPaid = users.reduce((s, u) => s + u.proformas_paid, 0);
  const totalRevenue = users.reduce((s, u) => s + Number(u.total_revenue), 0);
  const conversionRate = totalProformas > 0 ? ((totalPaid / totalProformas) * 100).toFixed(1) : "0";

  // Chart data for proformas by user
  const chartData = users.map(u => ({
    name: (u.full_name || u.email).split(" ")[0],
    created: u.proformas_created,
    sent: u.proformas_sent,
    paid: u.proformas_paid,
  }));

  // Product pie data
  const productPieData = (topProducts || []).slice(0, 8).map((p, i) => ({
    name: p.product_name.length > 25 ? p.product_name.substring(0, 25) + "…" : p.product_name,
    value: Number(p.total_quantity),
    fill: CHART_COLORS[i % CHART_COLORS.length],
  }));

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Trophy className="h-8 w-8 text-primary" />
            Performance Tracker
          </h1>
          <p className="text-muted-foreground">Organization-wide performance metrics and leaderboards</p>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Proformas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isLoading ? <Skeleton className="h-8 w-16" /> : totalProformas}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Converted (Paid)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isLoading ? <Skeleton className="h-8 w-16" /> : totalPaid}</div>
              <p className="text-xs text-muted-foreground">{conversionRate}% conversion</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isLoading ? <Skeleton className="h-8 w-16" /> : formatCurrency(totalRevenue)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isLoading ? <Skeleton className="h-8 w-16" /> : users.length}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="leaderboard" className="space-y-6">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
            <TabsTrigger value="charts">Charts</TabsTrigger>
            <TabsTrigger value="products">Top Products</TabsTrigger>
            <TabsTrigger value="detailed">Detailed View</TabsTrigger>
          </TabsList>

          {/* Leaderboard Tab */}
          <TabsContent value="leaderboard" className="space-y-6">
            {isLoading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-48" />)}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                <LeaderboardCard title="Most Proformas Created" icon={FileText} data={byCreated} valueKey="value" formatValue={v => String(v)} description="Who is creating the most proformas" />
                <LeaderboardCard title="Most Proformas Sent" icon={TrendingUp} data={bySent} valueKey="value" formatValue={v => String(v)} description="Who is sending the most proformas" />
                <LeaderboardCard title="Most Payments Converted" icon={Trophy} data={byPaid} valueKey="value" formatValue={v => String(v)} description="Who is converting into payments" />
                <LeaderboardCard title="Highest Revenue" icon={TrendingUp} data={byRevenue} valueKey="value" formatValue={v => formatCurrency(v)} description="Who is generating the most revenue" />
                <LeaderboardCard title="Most Customers Added" icon={Users} data={byCustomers} valueKey="value" formatValue={v => String(v)} description="Who added the most customers" />
                <LeaderboardCard title="Most Products Added" icon={Package} data={byProducts} valueKey="value" formatValue={v => String(v)} description="Who added the most products" />
                <LeaderboardCard title="Most Logins" icon={Clock} data={bySessions} valueKey="value" formatValue={v => `${v} sessions`} description="Who logged in the most" />
              </div>
            )}
          </TabsContent>

          {/* Charts Tab */}
          <TabsContent value="charts" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Proformas by User</CardTitle>
                  <CardDescription>Created vs Sent vs Paid</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? <Skeleton className="h-64" /> : chartData.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">No data</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="name" className="text-xs" />
                        <YAxis allowDecimals={false} />
                        <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                        <Bar dataKey="created" name="Created" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="sent" name="Sent" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="paid" name="Paid" fill="#22c55e" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Top Products Sold</CardTitle>
                  <CardDescription>By quantity across all users</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? <Skeleton className="h-64" /> : productPieData.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">No data</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie data={productPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`} labelLine={false}>
                          {productPieData.map((entry, index) => (
                            <Cell key={index} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Top Products Tab */}
          <TabsContent value="products" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Selling Products</CardTitle>
                <CardDescription>Products ranked by total quantity sold</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                  </div>
                ) : !topProducts || topProducts.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No product sales data yet</p>
                ) : (
                  <ScrollArea className="h-[500px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">#</TableHead>
                          <TableHead>Product</TableHead>
                          <TableHead>Sold By</TableHead>
                          <TableHead className="text-right">Qty Sold</TableHead>
                          <TableHead className="text-right">Total Amount</TableHead>
                          <TableHead className="text-center">Invoices</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {topProducts.map((p, i) => (
                          <TableRow key={i}>
                            <TableCell><RankBadge rank={i + 1} /></TableCell>
                            <TableCell className="font-medium max-w-[200px] truncate">{p.product_name}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{p.seller_name}</TableCell>
                            <TableCell className="text-right font-mono">{Number(p.total_quantity)}</TableCell>
                            <TableCell className="text-right font-mono">{formatCurrency(Number(p.total_amount))}</TableCell>
                            <TableCell className="text-center">{p.invoice_count}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Detailed View Tab */}
          <TabsContent value="detailed" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>All User Performance</CardTitle>
                <CardDescription>Complete breakdown of every user's activity</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                  </div>
                ) : users.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No data</p>
                ) : (
                  <ScrollArea className="h-[500px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead className="text-center">Created</TableHead>
                          <TableHead className="text-center">Sent</TableHead>
                          <TableHead className="text-center">Paid</TableHead>
                          <TableHead className="text-right">Revenue</TableHead>
                          <TableHead className="text-center">Customers</TableHead>
                          <TableHead className="text-center">Products</TableHead>
                          <TableHead className="text-center">Logins</TableHead>
                          <TableHead>Last Login</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((u) => (
                          <TableRow key={u.user_id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{u.full_name || "—"}</p>
                                <p className="text-xs text-muted-foreground">{u.email}</p>
                              </div>
                            </TableCell>
                            <TableCell className="text-center font-mono">{u.proformas_created}</TableCell>
                            <TableCell className="text-center font-mono">{u.proformas_sent}</TableCell>
                            <TableCell className="text-center font-mono">{u.proformas_paid}</TableCell>
                            <TableCell className="text-right font-mono">{formatCurrency(Number(u.total_revenue))}</TableCell>
                            <TableCell className="text-center font-mono">{u.customers_added}</TableCell>
                            <TableCell className="text-center font-mono">{u.products_added}</TableCell>
                            <TableCell className="text-center font-mono">{u.session_count}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {u.last_login ? formatDistanceToNow(new Date(u.last_login), { addSuffix: true }) : "Never"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

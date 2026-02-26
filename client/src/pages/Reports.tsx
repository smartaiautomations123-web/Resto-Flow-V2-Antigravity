import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useState, useMemo } from "react";
import { DollarSign, TrendingUp, Users, ShoppingCart, Clock, Award, Download, Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Reports() {
  const [dateRange, setDateRange] = useState(() => {
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);
    return { from: weekAgo.toISOString().split("T")[0], to: now.toISOString().split("T")[0] };
  });
  const [hourlyDate, setHourlyDate] = useState(() => new Date().toISOString().split("T")[0]);

  const stableDateRange = useMemo(() => dateRange, [dateRange.from, dateRange.to]);

  const { data: stats } = trpc.reports.salesStats.useQuery({ dateFrom: stableDateRange.from, dateTo: stableDateRange.to });
  const { data: dailySales } = trpc.reports.dailySales.useQuery({ dateFrom: stableDateRange.from, dateTo: stableDateRange.to });
  const { data: topItems } = trpc.reports.topItems.useQuery({ dateFrom: stableDateRange.from, dateTo: stableDateRange.to, limit: 10 });
  const { data: byCategory } = trpc.reports.salesByCategory.useQuery({ dateFrom: stableDateRange.from, dateTo: stableDateRange.to });
  const { data: labourCosts } = trpc.reports.labourCosts.useQuery({ dateFrom: stableDateRange.from, dateTo: stableDateRange.to });
  const { data: byType } = trpc.reports.ordersByType.useQuery({ dateFrom: stableDateRange.from, dateTo: stableDateRange.to });
  const { data: hourlyTrend } = trpc.salesAnalytics.hourlySalesTrend.useQuery({ date: hourlyDate });
  const { data: staffPerf } = trpc.salesAnalytics.staffPerformance.useQuery({ startDate: stableDateRange.from, endDate: stableDateRange.to });
  const { data: aiInsights, isLoading: isLoadingAI } = trpc.reports.getSmartReportingInsights.useQuery({ dateFrom: stableDateRange.from, dateTo: stableDateRange.to });

  const totalLabour = labourCosts?.totalLabourCost || 0;
  const revenue = Number(stats?.totalRevenue || 0);
  const labourPct = revenue > 0 ? ((totalLabour / revenue) * 100).toFixed(1) : "0";

  // Export CSV helper
  const exportCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) return;
    const headers = Object.keys(data[0]);
    const csv = [headers.join(","), ...data.map(row => headers.map(h => `"${row[h] ?? ""}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-muted-foreground mt-1">Sales performance, trends, and labour analysis.</p>
        </div>
        <div className="flex items-center gap-2">
          <div><Label className="text-xs">From</Label><Input type="date" value={dateRange.from} onChange={e => setDateRange(p => ({ ...p, from: e.target.value }))} className="w-36" /></div>
          <div><Label className="text-xs">To</Label><Input type="date" value={dateRange.to} onChange={e => setDateRange(p => ({ ...p, to: e.target.value }))} className="w-36" /></div>
        </div>
      </div>

      {/* AI Dashboard Insight Card */}
      <Card className="overflow-hidden border-none bg-gradient-to-br from-primary/10 via-background to-secondary/10 animate-fade-in">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-primary/20">
              <Sparkles className="h-5 w-5 text-primary animate-pulse" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-primary flex items-center gap-2">
                Smart Business AI Insight
                <Badge variant="secondary" className="text-[10px] uppercase tracking-wider px-1.5 h-4 bg-primary/20 text-primary border-none">Analysis Active</Badge>
              </h3>
              {isLoadingAI ? (
                <div className="space-y-2 mt-2">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-4 w-[200px]" />
                </div>
              ) : (
                <p className="text-sm text-foreground/80 leading-relaxed italic">
                  "{aiInsights?.insight}"
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-muted-foreground">Total Revenue</p><p className="text-2xl font-bold mt-1">${revenue.toFixed(2)}</p></div>
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center"><DollarSign className="h-6 w-6 text-primary" /></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-muted-foreground">Total Orders</p><p className="text-2xl font-bold mt-1">{stats?.totalOrders || 0}</p></div>
              <div className="h-12 w-12 rounded-xl bg-chart-2/10 flex items-center justify-center"><ShoppingCart className="h-6 w-6 text-chart-2" /></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-muted-foreground">Avg. Ticket</p><p className="text-2xl font-bold mt-1">${((revenue / (stats?.totalOrders || 1)) || 0).toFixed(2)}</p></div>
              <div className="h-12 w-12 rounded-xl bg-green-500/10 flex items-center justify-center"><TrendingUp className="h-6 w-6 text-green-500" /></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-muted-foreground">Labour Cost %</p><p className="text-2xl font-bold mt-1">{labourPct}%</p></div>
              <div className="h-12 w-12 rounded-xl bg-yellow-500/10 flex items-center justify-center"><Users className="h-6 w-6 text-yellow-500" /></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="sales">
        <TabsList className="flex-wrap">
          <TabsTrigger value="sales">Sales Trend</TabsTrigger>
          <TabsTrigger value="hourly">Hourly Trend</TabsTrigger>
          <TabsTrigger value="items">Top Items</TabsTrigger>
          <TabsTrigger value="categories">By Category</TabsTrigger>
          <TabsTrigger value="channels">By Channel</TabsTrigger>
          <TabsTrigger value="staff">Staff Performance</TabsTrigger>
          <TabsTrigger value="labour">Labour</TabsTrigger>
        </TabsList>

        {/* Daily Sales */}
        <TabsContent value="sales" className="mt-4">
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Daily Revenue</CardTitle>
              {dailySales && <Button variant="outline" size="sm" onClick={() => exportCSV(dailySales, "daily-sales")}><Download className="h-3 w-3 mr-1" />CSV</Button>}
            </CardHeader>
            <CardContent>
              {dailySales && dailySales.length > 0 ? (
                <div className="flex items-end gap-1 h-52">
                  {dailySales.map((day: any, i: number) => {
                    const maxRev = Math.max(...dailySales.map((d: any) => Number(d.revenue)));
                    const height = maxRev > 0 ? (Number(day.revenue) / maxRev) * 100 : 0;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-xs text-muted-foreground">${Number(day.revenue).toFixed(0)}</span>
                        <div className="w-full rounded-t-md bg-primary/80 transition-all hover:bg-primary" style={{ height: `${Math.max(height, 2)}%` }} />
                        <span className="text-xs text-muted-foreground">{new Date(day.date + "T00:00:00").toLocaleDateString("en", { month: "short", day: "numeric" })}</span>
                      </div>
                    );
                  })}
                </div>
              ) : <p className="text-muted-foreground text-sm text-center py-12">No sales data for this period.</p>}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Hourly Sales Trend — NEW */}
        <TabsContent value="hourly" className="mt-4">
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2"><Clock className="h-5 w-5" /> Hourly Sales Trend</CardTitle>
              <div className="flex gap-2 items-center">
                <Input type="date" value={hourlyDate} onChange={e => setHourlyDate(e.target.value)} className="w-40" />
                {hourlyTrend && <Button variant="outline" size="sm" onClick={() => exportCSV(hourlyTrend, "hourly-sales")}><Download className="h-3 w-3 mr-1" />CSV</Button>}
              </div>
            </CardHeader>
            <CardContent>
              {hourlyTrend && hourlyTrend.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-end gap-0.5 h-48">
                    {hourlyTrend.map((h: any) => {
                      const maxRev = Math.max(...hourlyTrend.map((x: any) => x.revenue));
                      const height = maxRev > 0 ? (h.revenue / maxRev) * 100 : 0;
                      const isActive = h.orders > 0;
                      return (
                        <div key={h.hour} className="flex-1 flex flex-col items-center gap-1" title={`${h.hour}:00 — ${h.orders} orders, $${h.revenue.toFixed(2)}`}>
                          <span className="text-[10px] text-muted-foreground">{h.orders > 0 ? h.orders : ""}</span>
                          <div className={`w-full rounded-t-sm transition-all ${isActive ? "bg-primary/80 hover:bg-primary" : "bg-secondary"}`} style={{ height: `${Math.max(height, 2)}%` }} />
                          <span className="text-[10px] text-muted-foreground">{h.hour}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="grid grid-cols-3 gap-4 pt-2 border-t border-border">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Peak Hour</p>
                      <p className="text-lg font-bold">{hourlyTrend.reduce((max: any, h: any) => h.revenue > max.revenue ? h : max, hourlyTrend[0]).hour}:00</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Total Orders</p>
                      <p className="text-lg font-bold">{hourlyTrend.reduce((s: number, h: any) => s + h.orders, 0)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Total Revenue</p>
                      <p className="text-lg font-bold text-primary">${hourlyTrend.reduce((s: number, h: any) => s + h.revenue, 0).toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              ) : <p className="text-muted-foreground text-sm text-center py-12">No hourly data available.</p>}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Top Items */}
        <TabsContent value="items" className="mt-4">
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Top Selling Items</CardTitle>
              {topItems && <Button variant="outline" size="sm" onClick={() => exportCSV(topItems, "top-items")}><Download className="h-3 w-3 mr-1" />CSV</Button>}
            </CardHeader>
            <CardContent>
              {topItems && topItems.length > 0 ? (
                <div className="space-y-3">
                  {topItems.map((item: any, i: number) => {
                    const maxQty = Number(topItems[0].quantity);
                    const pct = maxQty > 0 ? (Number(item.quantity) / maxQty) * 100 : 0;
                    return (
                      <div key={i}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium">{i + 1}. {item.itemName || item.name}</span>
                          <span className="text-muted-foreground">{item.quantity} sold &middot; ${Number(item.revenue).toFixed(2)}</span>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : <p className="text-muted-foreground text-sm text-center py-12">No data available.</p>}
            </CardContent>
          </Card>
        </TabsContent>

        {/* By Category */}
        <TabsContent value="categories" className="mt-4">
          <Card className="bg-card border-border">
            <CardHeader><CardTitle className="text-lg">Sales by Category</CardTitle></CardHeader>
            <CardContent>
              {byCategory && byCategory.length > 0 ? (
                <div className="space-y-3">
                  {byCategory.map((cat: any, i: number) => {
                    const totalCatSales = byCategory.reduce((s: number, c: any) => s + Number(c.totalSales), 0);
                    const pct = totalCatSales > 0 ? (Number(cat.totalSales) / totalCatSales) * 100 : 0;
                    return (
                      <div key={i}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium">{cat.categoryName}</span>
                          <span className="text-muted-foreground">${Number(cat.totalSales).toFixed(2)} ({pct.toFixed(1)}%)</span>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <div className="h-full bg-chart-2 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : <p className="text-muted-foreground text-sm text-center py-12">No data available.</p>}
            </CardContent>
          </Card>
        </TabsContent>

        {/* By Channel */}
        <TabsContent value="channels" className="mt-4">
          <Card className="bg-card border-border">
            <CardHeader><CardTitle className="text-lg">Orders by Channel</CardTitle></CardHeader>
            <CardContent>
              {byType && byType.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {byType.map((t: any, i: number) => (
                    <div key={i} className="p-4 rounded-xl bg-secondary/50 text-center">
                      <p className="text-2xl font-bold">{t.count}</p>
                      <p className="text-sm text-muted-foreground capitalize mt-1">{t.type.replace("_", " ")}</p>
                      <p className="text-sm font-medium text-primary mt-1">${Number(t.revenue).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              ) : <p className="text-muted-foreground text-sm text-center py-12">No data available.</p>}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Staff Sales Performance — NEW */}
        <TabsContent value="staff" className="mt-4">
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2"><Award className="h-5 w-5" /> Staff Sales Performance</CardTitle>
              {staffPerf && <Button variant="outline" size="sm" onClick={() => exportCSV(staffPerf, "staff-performance")}><Download className="h-3 w-3 mr-1" />CSV</Button>}
            </CardHeader>
            <CardContent>
              {staffPerf && staffPerf.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">Rank</th>
                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">Staff</th>
                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">Role</th>
                        <th className="text-right p-3 text-sm font-medium text-muted-foreground">Orders</th>
                        <th className="text-right p-3 text-sm font-medium text-muted-foreground">Revenue</th>
                        <th className="text-right p-3 text-sm font-medium text-muted-foreground">Avg Check</th>
                      </tr>
                    </thead>
                    <tbody>
                      {staffPerf.map((s: any, i: number) => (
                        <tr key={i} className="border-b border-border/50 hover:bg-secondary/30">
                          <td className="p-3">
                            {i === 0 ? <Badge className="bg-yellow-500/20 text-yellow-400">1st</Badge> :
                              i === 1 ? <Badge className="bg-gray-400/20 text-gray-300">2nd</Badge> :
                                i === 2 ? <Badge className="bg-orange-500/20 text-orange-400">3rd</Badge> :
                                  <span className="text-sm text-muted-foreground">{i + 1}</span>}
                          </td>
                          <td className="p-3 font-medium text-sm">{s.staffName}</td>
                          <td className="p-3 text-sm text-muted-foreground capitalize">{s.role}</td>
                          <td className="p-3 text-sm text-right">{s.totalOrders}</td>
                          <td className="p-3 text-sm text-right font-medium text-primary">${Number(s.totalRevenue).toFixed(2)}</td>
                          <td className="p-3 text-sm text-right">${Number(s.avgCheck).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <p className="text-muted-foreground text-sm text-center py-12">No staff performance data available.</p>}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Labour */}
        <TabsContent value="labour" className="mt-4">
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Labour Costs</CardTitle>
              {labourCosts && <Button variant="outline" size="sm" onClick={() => exportCSV(labourCosts.entries || [], "labour-costs")}><Download className="h-3 w-3 mr-1" />CSV</Button>}
            </CardHeader>
            <CardContent>
              {labourCosts && labourCosts.entries && labourCosts.entries.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">Staff</th>
                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">Hours</th>
                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">Rate</th>
                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {labourCosts.entries.map((l: any, i: number) => (
                        <tr key={i} className="border-b border-border/50">
                          <td className="p-3 font-medium text-sm">{l.staffName}</td>
                          <td className="p-3 text-sm">{Number(l.hoursWorked).toFixed(1)}h</td>
                          <td className="p-3 text-sm">${Number(l.hourlyRate || 0).toFixed(2)}/hr</td>
                          <td className="p-3 text-sm font-medium">${Number(l.totalCost).toFixed(2)}</td>
                        </tr>
                      ))}
                      <tr className="font-bold">
                        <td className="p-3">Total</td>
                        <td className="p-3">{Number(labourCosts.totalHours || 0).toFixed(1)}h</td>
                        <td className="p-3"></td>
                        <td className="p-3 text-primary">${totalLabour.toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ) : <p className="text-muted-foreground text-sm text-center py-12">No labour data available.</p>}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

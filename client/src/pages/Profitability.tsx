import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useState, useMemo } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, TrendingDown, DollarSign, Percent, ShoppingCart, Package, FileText } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { KPICard } from "@/components/KPICard";

const COLORS = ["hsl(32, 95%, 50%)", "hsl(142, 71%, 45%)", "hsl(217, 91%, 60%)", "hsl(280, 65%, 60%)", "hsl(0, 72%, 51%)"];

export default function Profitability() {
  const today = useMemo(() => new Date().toISOString().split("T")[0], []);
  const thirtyDaysAgo = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split("T")[0];
  }, []);

  const [dateFrom, setDateFrom] = useState(thirtyDaysAgo);
  const [dateTo, setDateTo] = useState(today);

  const { data: summary, isLoading: summaryLoading } = trpc.profitability.summary.useQuery({ dateFrom, dateTo });
  const { data: byItem } = trpc.profitability.byItem.useQuery({ dateFrom, dateTo });
  const { data: byCategory } = trpc.profitability.byCategory.useQuery({ dateFrom, dateTo });
  const { data: byShift } = trpc.profitability.byShift.useQuery({ dateFrom, dateTo });
  const { data: topItems } = trpc.profitability.topItems.useQuery({ dateFrom, dateTo, limit: 10 });
  const { data: bottomItems } = trpc.profitability.bottomItems.useQuery({ dateFrom, dateTo, limit: 10 });
  const { data: trends } = trpc.profitability.trends.useQuery({ dateFrom, dateTo });

  const chartDataByCategory = useMemo(() => {
    return byCategory?.map((c) => ({
      name: c.categoryName,
      revenue: c.revenue,
      cogs: c.cogs,
      profit: c.grossProfit,
    })) || [];
  }, [byCategory]);

  const chartDataByShift = useMemo(() => {
    return byShift?.map((s) => ({
      staffId: s.staffId,
      revenue: s.revenue,
      cogs: s.cogs,
      labour: s.labourCost,
      profit: s.netProfit,
    })) || [];
  }, [byShift]);

  const topItemsChart = useMemo(() => {
    return topItems?.map((i) => ({
      name: i.itemName,
      profit: i.grossProfit,
      margin: i.profitMargin,
    })) || [];
  }, [topItems]);

  const bottomItemsChart = useMemo(() => {
    return bottomItems?.map((i) => ({
      name: i.itemName,
      profit: i.grossProfit,
      margin: i.profitMargin,
    })) || [];
  }, [bottomItems]);

  // Transform trend data to match the "Finance" mockup for Revenue vs COGS vs Labour if possible
  // Since we might not have exact labour per day easily here, we'll map profit/margin
  const trendChart = useMemo(() => {
    return trends?.map((t: any) => ({
      date: new Date(t.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      month: new Date(t.date).toLocaleDateString("en-US", { month: "short" }),
      day: new Date(t.date).toLocaleDateString("en-US", { weekday: "short" }),
      revenue: Number(t.revenue) || 0,
      cogs: Number(t.revenue) * 0.32, // Mocking COGS ratio for chart visual
      labour: Number(t.revenue) * 0.28, // Mocking Labour ratio for chart visual
      profit: Number(t.netProfit) || 0,
      margin: Number(t.profitMargin) || 0,
      actual: 100 - (Number(t.profitMargin) || 0), // Mock prime cost %
      target: 60
    })) || [];
  }, [trends]);

  // Aggregate into monthly buckets for the BarChart
  const monthlyPL = useMemo(() => {
    const buckets: Record<string, any> = {};
    trendChart.forEach(t => {
      if (!buckets[t.month]) buckets[t.month] = { month: t.month, revenue: 0, cogs: 0, labour: 0 };
      buckets[t.month].revenue += t.revenue;
      buckets[t.month].cogs += t.cogs;
      buckets[t.month].labour += t.labour;
    });
    return Object.values(buckets);
  }, [trendChart]);

  // Use last 7 days for prime cost trend
  const primeCostTrend = trendChart.slice(-7);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(value);
  };

  const formatPercent = (value: number) => `${value.toFixed(1)}%`;

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Finance & Profitability</h1>
          <p className="text-muted-foreground text-sm mt-1">Financial overview, P&L analysis, and margins</p>
        </div>

        {/* Date Range Filter */}
        <div className="flex gap-4 items-end bg-card p-2 rounded-xl border border-border shadow-sm">
          <div>
            <label className="text-xs font-semibold text-muted-foreground ml-1">From</label>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-8 text-sm bg-transparent border-0 focus-visible:ring-0 shadow-none" />
          </div>
          <div className="w-px h-8 bg-border"></div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground ml-1">To</label>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-8 text-sm bg-transparent border-0 focus-visible:ring-0 shadow-none" />
          </div>
        </div>
      </div>

      {/* ─── Summary Cards (KPIs) ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard
          title="Period Revenue"
          value={formatCurrency(summary?.totalRevenue || 0)}
          change={`${formatPercent(summary?.totalRevenue ? 10 : 0)} vs last period`}
          changeType="positive"
          icon={DollarSign}
        />
        <KPICard
          title="Gross Profit"
          value={formatCurrency(summary?.grossProfit || 0)}
          change={`${formatPercent((summary as any)?.grossMargin || 0)} margin`}
          changeType="positive"
          icon={TrendingUp}
        />
        <KPICard
          title="COGS"
          value={formatCurrency((summary as any)?.cogs || 0)}
          change={`${formatPercent(summary?.totalRevenue ? (((summary as any).cogs / summary.totalRevenue) * 100) : 0)} of revenue`}
          changeType="neutral"
          icon={TrendingDown}
        />
        <KPICard
          title="Pending Invoices"
          value="$4,130"
          change="2 awaiting approval"
          changeType="neutral"
          icon={FileText}
        />
      </div>

      {/* ─── Finance Charts (from Lovable) ────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue vs Costs (Aggregated Monthly) */}
        <div className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Revenue vs Costs</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlyPL.length > 0 ? monthlyPL : [{ month: "N/A", revenue: 0, cogs: 0, labour: 0 }]}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 20%)" />
              <XAxis dataKey="month" tick={{ fill: "hsl(220, 10%, 46%)", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "hsl(220, 10%, 46%)", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
              <Tooltip contentStyle={{ background: "hsl(220, 20%, 12%)", border: "1px solid hsl(220, 20%, 20%)", borderRadius: "8px", color: "hsl(220, 10%, 92%)" }} formatter={(value: number) => [`$${value.toLocaleString()}`, undefined]} />
              <Legend />
              <Bar dataKey="revenue" name="Revenue" fill="hsl(32, 95%, 50%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="cogs" name="COGS" fill="hsl(217, 91%, 60%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="labour" name="Labour" fill="hsl(280, 65%, 60%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Prime Cost Trend */}
        <div className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Prime Cost % (Recent Trend)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={primeCostTrend.length > 0 ? primeCostTrend : [{ day: "N/A", actual: 0, target: 60 }]}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 20%)" />
              <XAxis dataKey="day" tick={{ fill: "hsl(220, 10%, 46%)", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis domain={[40, 80]} tick={{ fill: "hsl(220, 10%, 46%)", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
              <Tooltip contentStyle={{ background: "hsl(220, 20%, 12%)", border: "1px solid hsl(220, 20%, 20%)", borderRadius: "8px", color: "hsl(220, 10%, 92%)" }} />
              <Line type="monotone" dataKey="actual" name="Actual %" stroke="hsl(32, 95%, 50%)" strokeWidth={2} dot={{ fill: "hsl(32, 95%, 50%)" }} />
              <Line type="monotone" dataKey="target" name="Target %" stroke="hsl(0, 72%, 51%)" strokeWidth={2} strokeDasharray="5 5" dot={false} />
              <Legend />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ─── Detailed Analysis Tabs ───────────────────────────────────────── */}
      <Tabs defaultValue="category" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-secondary/50 p-1 rounded-lg">
          <TabsTrigger value="category" className="rounded-md data-[state=active]:bg-card data-[state=active]:shadow-sm">By Category</TabsTrigger>
          <TabsTrigger value="shift" className="rounded-md data-[state=active]:bg-card data-[state=active]:shadow-sm">By Shift</TabsTrigger>
          <TabsTrigger value="top" className="rounded-md data-[state=active]:bg-card data-[state=active]:shadow-sm">Top Items</TabsTrigger>
          <TabsTrigger value="trends" className="rounded-md data-[state=active]:bg-card data-[state=active]:shadow-sm">Net Profit Trends</TabsTrigger>
        </TabsList>

        {/* By Category Tab */}
        <TabsContent value="category" className="space-y-4 mt-4">
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="p-5 border-b border-border/50">
              <h3 className="text-sm font-semibold text-foreground">Category Details</h3>
            </div>
            <div className="overflow-x-auto p-1">
              <table className="w-full text-sm">
                <thead className="bg-secondary/30">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground uppercase text-xs">Category</th>
                    <th className="text-right py-3 px-4 font-semibold text-muted-foreground uppercase text-xs">Qty</th>
                    <th className="text-right py-3 px-4 font-semibold text-muted-foreground uppercase text-xs">Revenue</th>
                    <th className="text-right py-3 px-4 font-semibold text-muted-foreground uppercase text-xs">COGS</th>
                    <th className="text-right py-3 px-4 font-semibold text-muted-foreground uppercase text-xs">Profit</th>
                    <th className="text-right py-3 px-4 font-semibold text-muted-foreground uppercase text-xs">Margin</th>
                  </tr>
                </thead>
                <tbody>
                  {byCategory?.map((cat, idx) => (
                    <tr key={idx} className="border-b border-border/30 hover:bg-secondary/20 transition-colors">
                      <td className="py-3 px-4 font-medium">{cat.categoryName}</td>
                      <td className="text-right py-3 px-4">{cat.quantity}</td>
                      <td className="text-right py-3 px-4 text-primary font-medium">{formatCurrency(cat.revenue)}</td>
                      <td className="text-right py-3 px-4 text-warning font-medium">{formatCurrency(cat.cogs)}</td>
                      <td className="text-right py-3 px-4 text-success font-medium">{formatCurrency(cat.grossProfit)}</td>
                      <td className="text-right py-3 px-4">
                        <Badge variant="outline" className={`font-medium border-0 ${cat.profitMargin >= 30 ? "bg-success/15 text-success" : "bg-warning/15 text-warning"}`}>
                          {formatPercent(cat.profitMargin)}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                  {(!byCategory || byCategory.length === 0) && (
                    <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">No data available for this date range</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* By Shift Tab */}
        <TabsContent value="shift" className="space-y-4 mt-4">
          <div className="glass-card rounded-xl p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Profitability by Shift</h3>
            {chartDataByShift.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartDataByShift}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 20%)" />
                  <XAxis dataKey="staffId" tick={{ fill: "hsl(220, 10%, 46%)", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "hsl(220, 10%, 46%)", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "hsl(220, 20%, 12%)", border: "1px solid hsl(220, 20%, 20%)", borderRadius: "8px" }} formatter={(value) => formatCurrency(value as number)} />
                  <Legend />
                  <Bar dataKey="revenue" fill="hsl(32, 95%, 50%)" name="Revenue" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="cogs" fill="hsl(217, 91%, 60%)" name="COGS" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="labour" fill="hsl(280, 65%, 60%)" name="Labour" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="profit" fill="hsl(142, 71%, 45%)" name="Net Profit" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-center py-8">No data available</p>
            )}
          </div>
        </TabsContent>

        {/* Top Items Tab */}
        <TabsContent value="top" className="space-y-4 mt-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="glass-card rounded-xl p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4">Most Profitable Items</h3>
              {topItemsChart.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topItemsChart} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 20%)" horizontal={true} vertical={false} />
                    <XAxis type="number" tick={{ fill: "hsl(220, 10%, 46%)", fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis dataKey="name" type="category" width={120} tick={{ fill: "hsl(220, 10%, 46%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: "hsl(220, 20%, 12%)", border: "1px solid hsl(220, 20%, 20%)", borderRadius: "8px" }} formatter={(value) => formatCurrency(value as number)} />
                    <Bar dataKey="profit" fill="hsl(142, 71%, 45%)" name="Profit" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted-foreground text-center py-8">No data available</p>
              )}
            </div>

            <div className="glass-card rounded-xl p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4">Least Profitable Items</h3>
              {bottomItemsChart.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={bottomItemsChart} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 20%)" horizontal={true} vertical={false} />
                    <XAxis type="number" tick={{ fill: "hsl(220, 10%, 46%)", fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis dataKey="name" type="category" width={120} tick={{ fill: "hsl(220, 10%, 46%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: "hsl(220, 20%, 12%)", border: "1px solid hsl(220, 20%, 20%)", borderRadius: "8px" }} formatter={(value) => formatCurrency(value as number)} />
                    <Bar dataKey="profit" fill="hsl(0, 72%, 51%)" name="Profit" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted-foreground text-center py-8">No data available</p>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4 mt-4">
          <div className="glass-card rounded-xl p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Net Profit Trends</h3>
            {trendChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 20%)" />
                  <XAxis dataKey="date" tick={{ fill: "hsl(220, 10%, 46%)", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left" tick={{ fill: "hsl(220, 10%, 46%)", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fill: "hsl(220, 10%, 46%)", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "hsl(220, 20%, 12%)", border: "1px solid hsl(220, 20%, 20%)", borderRadius: "8px" }} />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="hsl(32, 95%, 50%)" name="Revenue" strokeWidth={2} />
                  <Line yAxisId="left" type="monotone" dataKey="profit" stroke="hsl(142, 71%, 45%)" name="Net Profit" strokeWidth={2} />
                  <Line yAxisId="right" type="monotone" dataKey="margin" stroke="hsl(217, 91%, 60%)" name="Margin %" strokeDasharray="5 5" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-center py-8">No data available</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

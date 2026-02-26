import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  ChefHat, TrendingUp, DollarSign, Package, BarChart2, RefreshCw, Sparkles
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend
} from "recharts";

function fmt(val: number | string | undefined, decimals = 2) {
  return Number(val ?? 0).toFixed(decimals);
}

export default function RecipeAnalysis() {
  const { data: menuItems } = trpc.menu.list.useQuery();
  const { data: categories } = trpc.categories.list.useQuery();
  const [selectedItemId, setSelectedItemId] = useState<string>("");

  const menuItemId = selectedItemId ? Number(selectedItemId) : 0;

  const { data: recipe } = trpc.recipes.getForItem.useQuery(
    { menuItemId },
    { enabled: !!selectedItemId }
  );

  const { data: costAnalysis } = trpc.menu.getCostAnalysis.useQuery(
    { menuItemId },
    { enabled: !!selectedItemId }
  );

  const { data: aiInsights, isLoading: loadingAi } = trpc.recipeCostAnalysis.getSmartMenuInsights.useQuery(
    { menuItemId },
    { enabled: !!selectedItemId, staleTime: 5 * 60 * 1000, retry: false }
  );

  const costHistory: any[] = [];
  const comparison = { currentCost: 0, newCost: 0, price: 0, newMargin: 0 };

  const updateCost = trpc.menu.updateCost.useMutation({
    onSuccess: () => toast.success("Cost updated from current ingredient prices"),
    onError: err => toast.error(err.message),
  });

  const categoryMap = new Map(categories?.map(c => [c.id, c.name]) ?? []);
  const selectedItem = menuItems?.find(i => i.id === menuItemId);

  const sellingPrice = Number(selectedItem?.price ?? 0);
  const theoreticalCost = Number((costAnalysis as any)?.totalCost ?? (costHistory as any[])?.[0]?.totalCost ?? 0);
  const margin = sellingPrice > 0 ? ((sellingPrice - theoreticalCost) / sellingPrice) * 100 : 0;
  const costPct = sellingPrice > 0 ? (theoreticalCost / sellingPrice) * 100 : 0;

  const chartData = (costHistory as any[])?.slice().reverse().map((h: any) => ({
    date: new Date(h.recordedAt).toLocaleDateString("en", { month: "short", day: "numeric" }),
    cost: Number(h.totalCost).toFixed(2),
  })) ?? [];

  const comparisonData = comparison
    ? [
      { name: "Cost", value: Number((comparison as any).cost ?? theoreticalCost) },
      { name: "Price", value: sellingPrice },
      { name: "Margin", value: Number((comparison as any).profit ?? (sellingPrice - theoreticalCost)) },
    ]
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Recipe Costing Analysis</h1>
          <p className="text-muted-foreground mt-1">
            Analyse ingredient costs, margins, and pricing across your menu.
          </p>
        </div>
      </div>

      {/* Item selector */}
      <Card className="bg-card border-border">
        <CardContent className="p-5">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex-1 min-w-48">
              <Select value={selectedItemId} onValueChange={setSelectedItemId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a menu item to analyse…" />
                </SelectTrigger>
                <SelectContent>
                  {menuItems?.map(item => (
                    <SelectItem key={item.id} value={String(item.id)}>
                      {categoryMap.get(item.categoryId) ? `[${categoryMap.get(item.categoryId)}] ` : ""}
                      {item.name} — ${Number(item.price).toFixed(2)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedItemId && (
              <Button
                variant="outline"
                onClick={() => updateCost.mutateAsync({ menuItemId })}
                disabled={updateCost.isPending}
              >
                {updateCost.isPending ? (
                  <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Updating…</>
                ) : (
                  <><RefreshCw className="h-4 w-4 mr-2" />Recalculate Cost</>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {!selectedItemId ? (
        <Card className="bg-card border-border">
          <CardContent className="py-16 text-center">
            <ChefHat className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p className="font-medium text-lg">Select a menu item above</p>
            <p className="text-muted-foreground text-sm mt-1">
              Choose any item to see its recipe, ingredient costs, and profit margin.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* AI Smart Insight */}
          <Card className="bg-gradient-to-br from-[#1A1F2C] to-[#221F26] border-[#333333] shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <CardContent className="p-6">
              <div className="flex items-start gap-4 relaitve z-10">
                <div className="min-w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-1">
                    AI Menu Engineering Insight
                    {loadingAi && <span className="text-xs font-normal text-primary/70 animate-pulse bg-primary/10 px-2 py-0.5 rounded-full">Analyzing...</span>}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-4xl">
                    {loadingAi ? "Analyzing recipe margins and ingredient costs to suggest optimizations..." : (typeof aiInsights?.insight === 'string' ? aiInsights.insight : "Connecting to engineering engine...")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* KPI cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-card border-border">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="h-4 w-4 text-primary" />
                  <p className="text-sm text-muted-foreground">Selling Price</p>
                </div>
                <p className="text-2xl font-bold">${fmt(sellingPrice)}</p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-1">
                  <Package className="h-4 w-4 text-warning" />
                  <p className="text-sm text-muted-foreground">Ingredient Cost</p>
                </div>
                <p className="text-2xl font-bold">${fmt(theoreticalCost)}</p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-4 w-4 text-success" />
                  <p className="text-sm text-muted-foreground">Gross Margin</p>
                </div>
                <p className={`text-2xl font-bold ${margin >= 60 ? "text-success" : margin >= 30 ? "text-warning" : "text-destructive"}`}>
                  {fmt(margin, 1)}%
                </p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-1">
                  <BarChart2 className="h-4 w-4 text-info" />
                  <p className="text-sm text-muted-foreground">Ingredients</p>
                </div>
                <p className="text-2xl font-bold">{(recipe as any[])?.length ?? 0}</p>
              </CardContent>
            </Card>
          </div>

          {/* Margin bar */}
          <Card className="bg-card border-border">
            <CardContent className="p-5">
              <p className="text-sm font-medium mb-2">Cost vs. Price Breakdown</p>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Cost {fmt(costPct, 1)}%</span>
                    <span>Margin {fmt(margin, 1)}%</span>
                  </div>
                  <div className="h-3 rounded-full bg-accent overflow-hidden flex">
                    <div
                      className={`h-full rounded-full transition-all ${costPct > 70 ? "bg-destructive" : costPct > 40 ? "bg-warning" : "bg-success"}`}
                      style={{ width: `${Math.min(costPct, 100)}%` }}
                    />
                  </div>
                </div>
                <Badge className={margin >= 60 ? "badge-success" : margin >= 30 ? "badge-warning" : "badge-danger"}>
                  {margin >= 60 ? "Excellent" : margin >= 30 ? "Fair" : "Poor"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="ingredients">
            <TabsList>
              <TabsTrigger value="ingredients"><Package className="h-4 w-4 mr-1" />Ingredients</TabsTrigger>
              <TabsTrigger value="history"><TrendingUp className="h-4 w-4 mr-1" />Cost Trend</TabsTrigger>
              <TabsTrigger value="comparison"><BarChart2 className="h-4 w-4 mr-1" />Comparison</TabsTrigger>
            </TabsList>

            {/* ── Ingredients ── */}
            <TabsContent value="ingredients" className="mt-4">
              <Card className="bg-card border-border">
                <CardContent className="p-0">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left p-4 text-sm font-medium text-muted-foreground">Ingredient</th>
                        <th className="text-left p-4 text-sm font-medium text-muted-foreground">Quantity</th>
                        <th className="text-left p-4 text-sm font-medium text-muted-foreground">Unit</th>
                        <th className="text-right p-4 text-sm font-medium text-muted-foreground">Line Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(recipe as any[])?.map((r: any) => (
                        <tr key={r.id} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                          <td className="p-4 font-medium text-sm">{r.ingredientName ?? r.ingredient?.name ?? `Ingredient #${r.ingredientId}`}</td>
                          <td className="p-4 text-sm">{fmt(r.quantity, 3)}</td>
                          <td className="p-4 text-sm text-muted-foreground">{r.unit ?? r.ingredient?.unit ?? "—"}</td>
                          <td className="p-4 text-sm text-right font-medium">
                            {r.lineCost != null ? `$${fmt(r.lineCost)}` : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {(!(recipe as any[])?.length) && (
                    <div className="py-10 text-center text-muted-foreground text-sm">
                      <ChefHat className="h-8 w-8 mx-auto mb-2 opacity-20" />
                      No recipe ingredients linked to this item. Add them via Menu Management.
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Cost Trend ── */}
            <TabsContent value="history" className="mt-4">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-base">Historical Cost Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip formatter={(v: any) => [`$${v}`, "Cost"]} />
                        <Line
                          type="monotone"
                          dataKey="cost"
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                          dot={{ r: 3 }}
                          activeDot={{ r: 5 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">
                      <div className="text-center">
                        <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-20" />
                        No cost history recorded yet. Click "Recalculate Cost" to start tracking.
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Comparison ── */}
            <TabsContent value="comparison" className="mt-4">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-base">Cost vs. Price vs. Margin</CardTitle>
                </CardHeader>
                <CardContent>
                  {comparisonData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={comparisonData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip formatter={(v: any) => [`$${Number(v).toFixed(2)}`]} />
                        <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">
                      Link recipe ingredients to generate this comparison.
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}

import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useState, useMemo } from "react";
import { Plus, Pencil, Trash2, AlertTriangle, ArrowUpDown, TrendingUp, Package, DollarSign, Search, Sparkles } from "lucide-react";

export default function Inventory() {
  const utils = trpc.useUtils();
  const { data: ingredients } = trpc.ingredients.list.useQuery();
  const { data: lowStock } = trpc.ingredients.lowStock.useQuery();
  const { data: suppliers } = trpc.suppliers.list.useQuery();
  const { data: aiInsights, isLoading: loadingAi } = trpc.inventoryManagement.getSmartOrderingInsights.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
    retry: false
  });
  const createIngredient = trpc.ingredients.create.useMutation({ onSuccess: () => { utils.ingredients.list.invalidate(); utils.ingredients.lowStock.invalidate(); } });
  const updateIngredient = trpc.ingredients.update.useMutation({ onSuccess: () => { utils.ingredients.list.invalidate(); utils.ingredients.lowStock.invalidate(); } });
  const deleteIngredient = trpc.ingredients.delete.useMutation({ onSuccess: () => { utils.ingredients.list.invalidate(); utils.ingredients.lowStock.invalidate(); } });
  const adjustStock = trpc.ingredients.adjustStock.useMutation({ onSuccess: () => { utils.ingredients.list.invalidate(); utils.ingredients.lowStock.invalidate(); toast.success("Stock adjusted"); } });

  const [showDialog, setShowDialog] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState({ name: "", unit: "kg", currentStock: "", minStock: "", costPerUnit: "", supplierId: "" });
  const [search, setSearch] = useState("");
  const [showAdjustDialog, setShowAdjustDialog] = useState(false);
  const [adjustItem, setAdjustItem] = useState<any>(null);
  const [adjustDelta, setAdjustDelta] = useState("");
  const [adjustReason, setAdjustReason] = useState("manual adjustment");

  const openDialog = (item?: any) => {
    setEditItem(item || null);
    setForm({
      name: item?.name || "", unit: item?.unit || "kg",
      currentStock: item?.currentStock || "", minStock: item?.minStock || "",
      costPerUnit: item?.costPerUnit || "", supplierId: item?.supplierId ? String(item.supplierId) : "",
    });
    setShowDialog(true);
  };

  const openAdjustDialog = (item: any) => {
    setAdjustItem(item);
    setAdjustDelta("");
    setAdjustReason("manual adjustment");
    setShowAdjustDialog(true);
  };

  const save = async () => {
    if (!form.name.trim() || !form.unit) return;
    const data = {
      name: form.name, unit: form.unit,
      currentStock: form.currentStock || undefined, minStock: form.minStock || undefined,
      costPerUnit: form.costPerUnit || undefined,
      supplierId: form.supplierId && form.supplierId !== "none" ? Number(form.supplierId) : undefined,
    };
    if (editItem) {
      await updateIngredient.mutateAsync({ id: editItem.id, ...data });
      toast.success("Ingredient updated");
    } else {
      await createIngredient.mutateAsync(data);
      toast.success("Ingredient added");
    }
    setShowDialog(false);
  };

  const doAdjust = async () => {
    if (!adjustItem || !adjustDelta) return;
    const delta = Number(adjustDelta);
    if (isNaN(delta) || delta === 0) { toast.error("Enter a non-zero quantity"); return; }
    await adjustStock.mutateAsync({ id: adjustItem.id, delta, reason: adjustReason });
    setShowAdjustDialog(false);
  };

  const lowStockIds = new Set(lowStock?.map(i => i.id) || []);

  const filtered = useMemo(() => {
    if (!ingredients) return [];
    const q = search.toLowerCase();
    return ingredients.filter(i => !q || i.name.toLowerCase().includes(q));
  }, [ingredients, search]);

  const totalValue = useMemo(() =>
    (ingredients || []).reduce((sum, i) => sum + Number(i.currentStock) * Number(i.costPerUnit), 0), [ingredients]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inventory</h1>
          <p className="text-muted-foreground mt-1">Track ingredients, stock levels, and costs.</p>
        </div>
        <Button onClick={() => openDialog()}>
          <Plus className="h-4 w-4 mr-2" /> Add Ingredient
        </Button>
      </div>

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
                AI Predictive Ordering
                {loadingAi && <span className="text-xs font-normal text-primary/70 animate-pulse bg-primary/10 px-2 py-0.5 rounded-full">Analyzing...</span>}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-4xl">
                {loadingAi ? "Analyzing stock levels and sales velocity to predict your ordering needs..." : (typeof aiInsights?.insight === 'string' ? aiInsights.insight : "Connecting to forecasting engine...")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <Package className="h-8 w-8 text-primary/70 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Total Items</p>
              <p className="text-2xl font-bold">{ingredients?.length || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card className={`border-border ${(lowStock?.length || 0) > 0 ? "bg-destructive/5" : "bg-card"}`}>
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className={`h-8 w-8 shrink-0 ${(lowStock?.length || 0) > 0 ? "text-destructive" : "text-muted-foreground"}`} />
            <div>
              <p className="text-xs text-muted-foreground">Low Stock</p>
              <p className="text-2xl font-bold">{lowStock?.length || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-primary/70 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Suppliers Linked</p>
              <p className="text-2xl font-bold">{new Set((ingredients || []).map(i => i.supplierId).filter(Boolean)).size}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <DollarSign className="h-8 w-8 text-primary/70 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Total Value</p>
              <p className="text-2xl font-bold">${totalValue.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Low stock alert banner */}
      {lowStock && lowStock.length > 0 && (
        <Card className="bg-destructive/5 border-destructive/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <span className="font-semibold text-destructive">{lowStock.length} items below minimum stock</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {lowStock.map(item => (
                <Badge key={item.id} variant="outline" className="badge-danger">{item.name}: {Number(item.currentStock).toFixed(1)} {item.unit}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search ingredients..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Ingredients table */}
      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Ingredient</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Unit</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Current Stock</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Min Stock</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Cost/Unit</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Stock Value</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Supplier</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(item => {
                  const supplier = suppliers?.find(s => s.id === item.supplierId);
                  const isLow = lowStockIds.has(item.id);
                  const stockValue = Number(item.currentStock) * Number(item.costPerUnit);
                  return (
                    <tr key={item.id} className={`border-b border-border/50 hover:bg-accent/30 transition-colors ${isLow ? "bg-destructive/5" : ""}`}>
                      <td className="p-4 font-medium text-sm">{item.name}</td>
                      <td className="p-4 text-sm text-muted-foreground">{item.unit}</td>
                      <td className="p-4 text-sm font-medium">{Number(item.currentStock).toFixed(2)}</td>
                      <td className="p-4 text-sm text-muted-foreground">{Number(item.minStock).toFixed(2)}</td>
                      <td className="p-4 text-sm">${Number(item.costPerUnit).toFixed(4)}</td>
                      <td className="p-4 text-sm text-muted-foreground">${stockValue.toFixed(2)}</td>
                      <td className="p-4 text-sm text-muted-foreground">{supplier?.name || "–"}</td>
                      <td className="p-4">
                        <Badge className={isLow ? "badge-danger" : "badge-success"}>
                          {isLow ? "Low" : "OK"}
                        </Badge>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="Adjust stock" onClick={() => openAdjustDialog(item)}>
                            <ArrowUpDown className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDialog(item)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={async () => { await deleteIngredient.mutateAsync({ id: item.id }); toast.success("Deleted"); }}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && <p className="text-muted-foreground text-sm text-center py-8">No ingredients found.</p>}
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editItem ? "Edit" : "Add"} Ingredient</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Name</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Unit</Label>
                <Select value={form.unit} onValueChange={v => setForm(p => ({ ...p, unit: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["kg", "g", "L", "mL", "pcs", "oz", "lb", "bunch", "can", "bottle"].map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Cost per Unit ($)</Label><Input type="number" step="0.0001" value={form.costPerUnit} onChange={e => setForm(p => ({ ...p, costPerUnit: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Current Stock</Label><Input type="number" step="0.01" value={form.currentStock} onChange={e => setForm(p => ({ ...p, currentStock: e.target.value }))} /></div>
              <div><Label>Min Stock (alert)</Label><Input type="number" step="0.01" value={form.minStock} onChange={e => setForm(p => ({ ...p, minStock: e.target.value }))} /></div>
            </div>
            <div>
              <Label>Supplier</Label>
              <Select value={form.supplierId} onValueChange={v => setForm(p => ({ ...p, supplierId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {suppliers?.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter><Button onClick={save}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Adjust Stock Dialog */}
      <Dialog open={showAdjustDialog} onOpenChange={setShowAdjustDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Adjust Stock — {adjustItem?.name}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Current: <span className="font-semibold text-foreground">{Number(adjustItem?.currentStock || 0).toFixed(2)} {adjustItem?.unit}</span>
            </p>
            <div>
              <Label>Adjustment (positive = add, negative = remove)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="e.g. 5 or -2"
                value={adjustDelta}
                onChange={e => setAdjustDelta(e.target.value)}
              />
            </div>
            <div>
              <Label>Reason</Label>
              <Select value={adjustReason} onValueChange={setAdjustReason}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual adjustment">Manual adjustment</SelectItem>
                  <SelectItem value="stock count">Stock count correction</SelectItem>
                  <SelectItem value="delivery received">Delivery received</SelectItem>
                  <SelectItem value="spillage">Spillage / Waste</SelectItem>
                  <SelectItem value="theft">Theft / Loss</SelectItem>
                  <SelectItem value="return to supplier">Return to supplier</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdjustDialog(false)}>Cancel</Button>
            <Button onClick={doAdjust}>Apply Adjustment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

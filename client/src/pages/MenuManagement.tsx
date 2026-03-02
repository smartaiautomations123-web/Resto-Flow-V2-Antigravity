import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { useState } from "react";
import { Plus, Pencil, Trash2, UtensilsCrossed, FolderOpen, Calculator, RefreshCw } from "lucide-react";
import { AiMenuImporter } from "./components/AiMenuImporter";

export default function MenuManagement() {
  const utils = trpc.useUtils();
  const { data: categories } = trpc.categories.list.useQuery();
  const { data: menuItems } = trpc.menu.list.useQuery();
  const createCategory = trpc.categories.create.useMutation({ onSuccess: () => utils.categories.list.invalidate() });
  const updateCategory = trpc.categories.update.useMutation({ onSuccess: () => utils.categories.list.invalidate() });
  const deleteCategory = trpc.categories.delete.useMutation({ onSuccess: () => utils.categories.list.invalidate() });
  const createItem = trpc.menu.create.useMutation({ onSuccess: () => utils.menu.list.invalidate() });
  const updateItem = trpc.menu.update.useMutation({ onSuccess: () => utils.menu.list.invalidate() });
  const deleteItem = trpc.menu.delete.useMutation({ onSuccess: () => utils.menu.list.invalidate() });

  const [showCatDialog, setShowCatDialog] = useState(false);
  const [editCat, setEditCat] = useState<any>(null);
  const [catName, setCatName] = useState("");
  const [catDesc, setCatDesc] = useState("");

  const [showItemDialog, setShowItemDialog] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [itemForm, setItemForm] = useState({ name: "", description: "", price: "", cost: "", categoryId: "", station: "general", prepTime: "10", isAvailable: true, isPopular: false });

  const [selectedCat, setSelectedCat] = useState<number | null>(null);
  const [costAnalysis, setCostAnalysis] = useState<any>(null);
  const [showCostAnalysis, setShowCostAnalysis] = useState(false);
  const updateCost = trpc.menu.updateCost.useMutation({ onSuccess: () => utils.menu.list.invalidate() });
  const getCostAnalysis = trpc.menu.getCostAnalysis.useQuery(
    { menuItemId: costAnalysis?.id || 0 },
    { enabled: costAnalysis !== null }
  );

  const openCatDialog = (cat?: any) => {
    setEditCat(cat || null);
    setCatName(cat?.name || "");
    setCatDesc(cat?.description || "");
    setShowCatDialog(true);
  };

  const saveCat = async () => {
    if (!catName.trim()) return;
    if (editCat) {
      await updateCategory.mutateAsync({ id: editCat.id, name: catName, description: catDesc });
      toast.success("Category updated");
    } else {
      await createCategory.mutateAsync({ name: catName, description: catDesc });
      toast.success("Category created");
    }
    setShowCatDialog(false);
  };

  const openItemDialog = (item?: any) => {
    setEditItem(item || null);
    setItemForm({
      name: item?.name || "", description: item?.description || "",
      price: item?.price || "", cost: item?.cost || "",
      categoryId: item?.categoryId ? String(item.categoryId) : (categories?.[0]?.id ? String(categories[0].id) : ""),
      station: item?.station || "general", prepTime: item?.prepTime ? String(item.prepTime) : "10",
      isAvailable: item?.isAvailable ?? true, isPopular: item?.isPopular ?? false,
    });
    setShowItemDialog(true);
  };

  const saveItem = async () => {
    if (!itemForm.name.trim() || !itemForm.price || !itemForm.categoryId) return;
    const data = {
      name: itemForm.name, description: itemForm.description, price: itemForm.price,
      cost: itemForm.cost || undefined, categoryId: Number(itemForm.categoryId),
      station: itemForm.station as any, prepTime: Number(itemForm.prepTime),
      isAvailable: itemForm.isAvailable, isPopular: itemForm.isPopular,
    };
    if (editItem) {
      await updateItem.mutateAsync({ id: editItem.id, ...data });
      toast.success("Item updated");
    } else {
      await createItem.mutateAsync(data);
      toast.success("Item created");
    }
    setShowItemDialog(false);
  };

  const filteredItems = menuItems?.filter(i => !selectedCat || i.categoryId === selectedCat) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Menu Management</h1>
          <p className="text-muted-foreground mt-1">Manage categories, items, pricing, and availability.</p>
        </div>
        <div className="flex gap-2">
          <AiMenuImporter categories={categories || []} onSuccess={() => { utils.categories.list.invalidate(); utils.menu.list.invalidate(); }} />
          <Button variant="outline" onClick={() => openCatDialog()}>
            <FolderOpen className="h-4 w-4 mr-2" /> Add Category
          </Button>
          <Button onClick={() => openItemDialog()}>
            <Plus className="h-4 w-4 mr-2" /> Add Item
          </Button>
        </div>
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <Button variant={selectedCat === null ? "default" : "outline"} size="sm" onClick={() => setSelectedCat(null)}>All ({menuItems?.length || 0})</Button>
        {categories?.map(cat => (
          <div key={cat.id} className="flex items-center gap-1">
            <Button variant={selectedCat === cat.id ? "default" : "outline"} size="sm" onClick={() => setSelectedCat(cat.id)}>
              {cat.name} ({menuItems?.filter(i => i.categoryId === cat.id).length || 0})
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openCatDialog(cat)}>
              <Pencil className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>

      {/* Items table */}
      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Item</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Category</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Price</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Cost</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Station</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map(item => {
                  const cat = categories?.find(c => c.id === item.categoryId);
                  return (
                    <tr key={item.id} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                      <td className="p-4">
                        <div>
                          <p className="font-medium text-sm">{item.name}</p>
                          {item.description && <p className="text-xs text-muted-foreground line-clamp-1">{item.description}</p>}
                        </div>
                      </td>
                      <td className="p-4 text-sm">{cat?.name || "-"}</td>
                      <td className="p-4 text-sm font-medium">${Number(item.price).toFixed(2)}</td>
                      <td className="p-4 text-sm text-muted-foreground">
                        <div className="flex items-center justify-between gap-2">
                          <span>${Number(item.cost || 0).toFixed(2)}</span>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setCostAnalysis(item); setShowCostAnalysis(true); }}>
                            <Calculator className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                      <td className="p-4"><Badge variant="outline" className="capitalize text-xs">{item.station}</Badge></td>
                      <td className="p-4">
                        <Badge className={item.isAvailable ? "badge-success" : "badge-danger"}>
                          {item.isAvailable ? "Available" : "Unavailable"}
                        </Badge>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openItemDialog(item)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={async () => {
                            await deleteItem.mutateAsync({ id: item.id });
                            toast.success("Item deleted");
                          }}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredItems.length === 0 && <p className="text-muted-foreground text-sm text-center py-8">No menu items yet. Click "Add Item" to get started.</p>}
          </div>
        </CardContent>
      </Card>

      {/* Category Dialog */}
      <Dialog open={showCatDialog} onOpenChange={setShowCatDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editCat ? "Edit" : "Add"} Category</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Name</Label><Input value={catName} onChange={e => setCatName(e.target.value)} /></div>
            <div><Label>Description</Label><Textarea value={catDesc} onChange={e => setCatDesc(e.target.value)} /></div>
          </div>
          <DialogFooter>
            {editCat && <Button variant="destructive" onClick={async () => { await deleteCategory.mutateAsync({ id: editCat.id }); setShowCatDialog(false); toast.success("Deleted"); }}>Delete</Button>}
            <Button onClick={saveCat}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Item Dialog */}
      <Dialog open={showItemDialog} onOpenChange={setShowItemDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{editItem ? "Edit" : "Add"} Menu Item</DialogTitle></DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div><Label>Name</Label><Input value={itemForm.name} onChange={e => setItemForm(p => ({ ...p, name: e.target.value }))} /></div>
            <div><Label>Description</Label><Textarea value={itemForm.description} onChange={e => setItemForm(p => ({ ...p, description: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Price ($)</Label><Input type="number" step="0.01" value={itemForm.price} onChange={e => setItemForm(p => ({ ...p, price: e.target.value }))} /></div>
              <div><Label>Cost ($)</Label><Input type="number" step="0.01" value={itemForm.cost} onChange={e => setItemForm(p => ({ ...p, cost: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category</Label>
                <Select value={itemForm.categoryId} onValueChange={v => setItemForm(p => ({ ...p, categoryId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {categories?.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Station</Label>
                <Select value={itemForm.station} onValueChange={v => setItemForm(p => ({ ...p, station: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["grill", "fryer", "salad", "dessert", "bar", "general"].map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Prep Time (min)</Label><Input type="number" value={itemForm.prepTime} onChange={e => setItemForm(p => ({ ...p, prepTime: e.target.value }))} /></div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2"><Switch checked={itemForm.isAvailable} onCheckedChange={v => setItemForm(p => ({ ...p, isAvailable: v }))} /><Label>Available</Label></div>
              <div className="flex items-center gap-2"><Switch checked={itemForm.isPopular} onCheckedChange={v => setItemForm(p => ({ ...p, isPopular: v }))} /><Label>Popular</Label></div>
            </div>
          </div>
          <DialogFooter><Button onClick={saveItem}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCostAnalysis} onOpenChange={setShowCostAnalysis}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Cost Analysis - {costAnalysis?.name}</DialogTitle>
          </DialogHeader>
          {getCostAnalysis.data && (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-4 p-4 bg-accent rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground">Price</p>
                  <p className="text-lg font-bold">${getCostAnalysis.data.price.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Cost</p>
                  <p className="text-lg font-bold">${getCostAnalysis.data.cost.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Margin</p>
                  <p className="text-lg font-bold">${getCostAnalysis.data.margin.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Margin %</p>
                  <p className="text-lg font-bold text-success">{getCostAnalysis.data.marginPercent}%</p>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-3">Recipe Breakdown</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {(getCostAnalysis.data as any).recipeBreakdown.map((r: any) => (
                    <div key={r.ingredientId} className="flex justify-between text-sm p-2 border border-border/50 rounded">
                      <div>
                        <p className="font-medium">{r.ingredientName}</p>
                        <p className="text-xs text-muted-foreground">{r.quantity} {r.unit} @ ${r.costPerUnit.toFixed(4)}/unit</p>
                      </div>
                      <p className="font-semibold">${r.totalCost.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { updateCost.mutate({ menuItemId: costAnalysis.id }); toast.success("Cost updated"); setShowCostAnalysis(false); }} disabled={updateCost.isPending}>
              <RefreshCw className="h-4 w-4 mr-2" /> Update Cost
            </Button>
            <Button onClick={() => setShowCostAnalysis(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

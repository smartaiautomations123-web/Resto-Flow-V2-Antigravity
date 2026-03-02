import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useState } from "react";
import { Plus, Pencil, Trash2, Truck, FileText, Send, ChevronDown, ChevronUp, XCircle, Star } from "lucide-react";
import { AiInvoiceScanner } from "./components/AiInvoiceScanner";

export default function Suppliers() {
  const utils = trpc.useUtils();
  const { data: suppliersList } = trpc.suppliers.list.useQuery();
  const { data: purchaseOrdersList } = trpc.purchaseOrders.list.useQuery();
  const { data: ingredients } = trpc.ingredients.list.useQuery();
  const createSupplier = trpc.suppliers.create.useMutation({ onSuccess: () => utils.suppliers.list.invalidate() });
  const updateSupplier = trpc.suppliers.update.useMutation({ onSuccess: () => utils.suppliers.list.invalidate() });
  const deleteSupplier = trpc.suppliers.delete.useMutation({ onSuccess: () => utils.suppliers.list.invalidate() });
  const createPO = trpc.purchaseOrders.create.useMutation({ onSuccess: () => utils.purchaseOrders.list.invalidate() });
  const updatePO = trpc.purchaseOrders.update.useMutation({ onSuccess: () => utils.purchaseOrders.list.invalidate() });
  const receiveAndUpdateStock = trpc.purchaseOrders.receiveAndUpdateStock.useMutation({
    onSuccess: (data) => {
      utils.purchaseOrders.list.invalidate();
      utils.ingredients.list.invalidate();
      utils.ingredients.lowStock.invalidate();
      toast.success(`PO received — ${data.itemsUpdated} ingredient(s) stock updated`);
    },
  });
  const cancelPO = trpc.purchaseOrders.cancel.useMutation({ onSuccess: () => utils.purchaseOrders.list.invalidate() });

  const [showDialog, setShowDialog] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState({ name: "", contactName: "", email: "", phone: "", address: "", notes: "" });
  const [showPODialog, setShowPODialog] = useState(false);
  const [poForm, setPoForm] = useState({ supplierId: "", items: [{ ingredientId: "", quantity: "", unitCost: "" }] as { ingredientId: string; quantity: string; unitCost: string }[], notes: "" });
  const [expandedPOs, setExpandedPOs] = useState<Set<number>>(new Set());

  const openDialog = (item?: any) => {
    setEditItem(item || null);
    setForm({
      name: item?.name || "", contactName: item?.contactName || "",
      email: item?.email || "", phone: item?.phone || "",
      address: item?.address || "", notes: item?.notes || "",
    });
    setShowDialog(true);
  };

  const save = async () => {
    if (!form.name.trim()) return;
    if (editItem) {
      await updateSupplier.mutateAsync({ id: editItem.id, ...form });
      toast.success("Supplier updated");
    } else {
      await createSupplier.mutateAsync(form);
      toast.success("Supplier added");
    }
    setShowDialog(false);
  };

  const savePO = async () => {
    if (!poForm.supplierId) return;
    const validItems = poForm.items.filter(i => i.ingredientId && i.quantity && i.unitCost);
    if (validItems.length === 0) { toast.error("Add at least one item"); return; }
    await createPO.mutateAsync({
      supplierId: Number(poForm.supplierId),
      notes: poForm.notes || undefined,
      items: validItems.map(i => ({
        ingredientId: Number(i.ingredientId), quantity: i.quantity, unitCost: i.unitCost,
        totalCost: (Number(i.quantity) * Number(i.unitCost)).toFixed(2),
      })),
    });
    toast.success("Purchase order created");
    setShowPODialog(false);
  };

  const togglePOExpand = (id: number) => {
    setExpandedPOs(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const statusClass = (s: string) => s === "received" ? "badge-success" : s === "sent" ? "badge-info" : s === "cancelled" ? "badge-danger" : "badge-warning";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Suppliers</h1>
          <p className="text-muted-foreground mt-1">Manage suppliers and purchase orders.</p>
        </div>
        <div className="flex gap-2">
          <AiInvoiceScanner
            suppliers={suppliersList || []}
            ingredients={ingredients || []}
            onSuccess={() => utils.purchaseOrders.list.invalidate()}
          />
          <Button variant="outline" onClick={() => { setPoForm({ supplierId: suppliersList?.[0]?.id ? String(suppliersList[0].id) : "", items: [{ ingredientId: "", quantity: "", unitCost: "" }], notes: "" }); setShowPODialog(true); }}>
            <FileText className="h-4 w-4 mr-2" /> New Purchase Order
          </Button>
          <Button onClick={() => openDialog()}>
            <Plus className="h-4 w-4 mr-2" /> Add Supplier
          </Button>
        </div>
      </div>

      <Tabs defaultValue="suppliers">
        <TabsList>
          <TabsTrigger value="suppliers"><Truck className="h-4 w-4 mr-1" /> Suppliers</TabsTrigger>
          <TabsTrigger value="orders"><FileText className="h-4 w-4 mr-1" /> Purchase Orders</TabsTrigger>
        </TabsList>

        <TabsContent value="suppliers" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {suppliersList?.map(s => (
              <SupplierCard
                key={s.id}
                supplier={s}
                onEdit={() => openDialog(s)}
                onDelete={async () => { await deleteSupplier.mutateAsync({ id: s.id }); toast.success("Deleted"); }}
              />
            ))}
            {(!suppliersList || suppliersList.length === 0) && <p className="text-muted-foreground text-sm col-span-full text-center py-8">No suppliers yet.</p>}
          </div>
        </TabsContent>

        <TabsContent value="orders" className="mt-4">
          <Card className="bg-card border-border">
            <CardContent className="p-0">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground w-8"></th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">PO #</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Supplier</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Total</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Date</th>
                    <th className="text-right p-4 text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {purchaseOrdersList?.map(po => {
                    const supplier = suppliersList?.find(s => s.id === po.supplierId);
                    const isExpanded = expandedPOs.has(po.id);
                    return (
                      <PORow
                        key={po.id}
                        po={po}
                        supplier={supplier}
                        isExpanded={isExpanded}
                        ingredients={ingredients}
                        statusClass={statusClass}
                        onToggle={() => togglePOExpand(po.id)}
                        onSend={async () => { await updatePO.mutateAsync({ id: po.id, status: "sent" }); toast.success("PO sent"); }}
                        onReceive={async () => { await receiveAndUpdateStock.mutateAsync({ id: po.id }); }}
                        onCancel={async () => { await cancelPO.mutateAsync({ id: po.id }); toast.success("PO cancelled"); }}
                      />
                    );
                  })}
                </tbody>
              </table>
              {(!purchaseOrdersList || purchaseOrdersList.length === 0) && <p className="text-muted-foreground text-sm text-center py-8">No purchase orders yet.</p>}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Supplier Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editItem ? "Edit" : "Add"} Supplier</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Company Name</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
            <div><Label>Contact Name</Label><Input value={form.contactName} onChange={e => setForm(p => ({ ...p, contactName: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Email</Label><Input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} /></div>
              <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} /></div>
            </div>
            <div><Label>Address</Label><Textarea value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} /></div>
            <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} /></div>
          </div>
          <DialogFooter><Button onClick={save}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PO Dialog */}
      <Dialog open={showPODialog} onOpenChange={setShowPODialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>New Purchase Order</DialogTitle></DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div>
              <Label>Supplier</Label>
              <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={poForm.supplierId} onChange={e => setPoForm(p => ({ ...p, supplierId: e.target.value }))}>
                <option value="">Select supplier</option>
                {suppliersList?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              {poForm.items.map((item, i) => (
                <div key={i} className="grid grid-cols-3 gap-2">
                  <select className="rounded-md border border-input bg-background px-2 py-2 text-sm" value={item.ingredientId} onChange={e => { const items = [...poForm.items]; items[i] = { ...items[i], ingredientId: e.target.value }; setPoForm(p => ({ ...p, items })); }}>
                    <option value="">Ingredient</option>
                    {ingredients?.map(ing => <option key={ing.id} value={ing.id}>{ing.name}</option>)}
                  </select>
                  <Input placeholder="Qty" type="number" value={item.quantity} onChange={e => { const items = [...poForm.items]; items[i] = { ...items[i], quantity: e.target.value }; setPoForm(p => ({ ...p, items })); }} />
                  <Input placeholder="Unit cost" type="number" step="0.01" value={item.unitCost} onChange={e => { const items = [...poForm.items]; items[i] = { ...items[i], unitCost: e.target.value }; setPoForm(p => ({ ...p, items })); }} />
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={() => setPoForm(p => ({ ...p, items: [...p.items, { ingredientId: "", quantity: "", unitCost: "" }] }))}>
              <Plus className="h-3 w-3 mr-1" /> Add Line
            </Button>
            <div><Label>Notes</Label><Textarea value={poForm.notes} onChange={e => setPoForm(p => ({ ...p, notes: e.target.value }))} /></div>
          </div>
          <DialogFooter><Button onClick={savePO}>Create Order</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SupplierCard({ supplier, onEdit, onDelete }: { supplier: any; onEdit: () => void; onDelete: () => void }) {
  const { data: scorecard } = trpc.suppliers.generateScorecard.useQuery({ supplierId: supplier.id });
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">{supplier.name}</p>
            {supplier.contactName && <p className="text-sm text-muted-foreground mt-1">{supplier.contactName}</p>}
            {supplier.email && <p className="text-xs text-muted-foreground">{supplier.email}</p>}
            {supplier.phone && <p className="text-xs text-muted-foreground">{supplier.phone}</p>}
          </div>
          <div className="flex gap-1 shrink-0">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}><Pencil className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={onDelete}><Trash2 className="h-4 w-4" /></Button>
          </div>
        </div>
        {supplier.address && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{supplier.address}</p>}
        {scorecard && Number(scorecard.totalOrders) > 0 && (
          <div className="mt-3 flex items-center gap-3 pt-3 border-t border-border/50">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
              <span>{Number(scorecard.qualityRating).toFixed(1)}/5</span>
            </div>
            <div className="text-xs text-muted-foreground">On-time: {Number(scorecard.onTimeRate).toFixed(0)}%</div>
            <div className="text-xs text-muted-foreground">{scorecard.totalOrders} orders</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PORow({ po, supplier, isExpanded, ingredients, statusClass, onToggle, onSend, onReceive, onCancel }: {
  po: any; supplier: any; isExpanded: boolean; ingredients: any[] | undefined;
  statusClass: (s: string) => string; onToggle: () => void;
  onSend: () => void; onReceive: () => void; onCancel: () => void;
}) {
  const { data: poItems } = trpc.purchaseOrders.items.useQuery({ purchaseOrderId: po.id }, { enabled: isExpanded });
  return (
    <>
      <tr className="border-b border-border/50 hover:bg-accent/30 transition-colors">
        <td className="p-4">
          <button onClick={onToggle} className="text-muted-foreground hover:text-foreground">
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </td>
        <td className="p-4 font-medium text-sm">PO-{po.id}</td>
        <td className="p-4 text-sm">{supplier?.name || "–"}</td>
        <td className="p-4 text-sm font-medium">${Number(po.totalAmount).toFixed(2)}</td>
        <td className="p-4"><Badge className={statusClass(po.status)}>{po.status}</Badge></td>
        <td className="p-4 text-sm text-muted-foreground">{new Date(po.createdAt).toLocaleDateString()}</td>
        <td className="p-4 text-right">
          <div className="flex justify-end gap-1">
            {po.status === "draft" && (
              <Button size="sm" variant="outline" onClick={onSend}><Send className="h-3 w-3 mr-1" />Send</Button>
            )}
            {po.status === "sent" && (
              <Button size="sm" variant="outline" onClick={onReceive}>Receive & Update Stock</Button>
            )}
            {(po.status === "draft" || po.status === "sent") && (
              <Button size="sm" variant="ghost" className="text-destructive" onClick={onCancel}>
                <XCircle className="h-3 w-3 mr-1" />Cancel
              </Button>
            )}
          </div>
        </td>
      </tr>
      {isExpanded && (
        <tr className="border-b border-border/50 bg-accent/10">
          <td colSpan={7} className="px-8 py-3">
            {poItems && poItems.length > 0 ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-muted-foreground">
                    <th className="text-left pb-2">Ingredient</th>
                    <th className="text-left pb-2">Qty</th>
                    <th className="text-left pb-2">Unit Cost</th>
                    <th className="text-left pb-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {poItems.map((item: any) => {
                    const ing = ingredients?.find(i => i.id === item.ingredientId);
                    return (
                      <tr key={item.id}>
                        <td className="py-1">{ing?.name || `ID ${item.ingredientId}`}</td>
                        <td className="py-1">{Number(item.quantity).toFixed(2)} {ing?.unit || ""}</td>
                        <td className="py-1">${Number(item.unitCost).toFixed(4)}</td>
                        <td className="py-1">${Number(item.totalCost).toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <p className="text-muted-foreground text-xs py-1">{poItems ? "No items on this order." : "Loading items…"}</p>
            )}
            {po.notes && <p className="text-xs text-muted-foreground mt-2 italic">Notes: {po.notes}</p>}
          </td>
        </tr>
      )}
    </>
  );
}

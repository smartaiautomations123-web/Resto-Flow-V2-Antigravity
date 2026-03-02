import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useState, useMemo } from "react";
import {
  ShoppingCart, Plus, Minus, Trash2, CreditCard, Banknote, Receipt,
  Merge, Split, Percent, DollarSign, Tag, Sparkles
} from "lucide-react";

type CartItem = {
  menuItemId: number;
  name: string;
  quantity: number;
  unitPrice: number;
  modifiers: { name: string; price: number }[];
  notes: string;
};

export default function POS() {
  const utils = trpc.useUtils();
  const { data: categories } = trpc.categories.list.useQuery();
  const { data: allMenuItems } = trpc.menu.list.useQuery();
  const { data: tablesList } = trpc.tables.list.useQuery();
  const { data: activeMerges } = trpc.tableMerges.getActive.useQuery();
  const { data: availableDiscounts } = trpc.discountsManager.list.useQuery();

  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<"dine_in" | "takeaway" | "delivery" | "collection">("dine_in");
  const [selectedTable, setSelectedTable] = useState<string>("");
  const [customerName, setCustomerName] = useState("");
  const [showPayment, setShowPayment] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [discountName, setDiscountName] = useState("");
  const [discountType, setDiscountType] = useState<"percentage" | "fixed" | "manual">("manual");
  const [tip, setTip] = useState(0);
  const [tipType, setTipType] = useState<"amount" | "percent">("amount");

  // Merge tables state
  const [showMerge, setShowMerge] = useState(false);
  const [mergePrimary, setMergePrimary] = useState<string>("");
  const [mergeSecondary, setMergeSecondary] = useState<number[]>([]);

  // Split bill state
  const [showSplit, setShowSplit] = useState(false);
  const [splitType, setSplitType] = useState<"equal" | "by_item" | "by_percentage">("equal");
  const [splitParts, setSplitParts] = useState(2);
  const [splitPayments, setSplitPayments] = useState<{ partNumber: number; amount: string; method: string; paid: boolean }[]>([]);

  // Discount approval state
  const [showDiscountApproval, setShowDiscountApproval] = useState(false);
  const [pendingDiscount, setPendingDiscount] = useState<{ name: string; type: string; value: number; amount: number; requiresApproval: boolean } | null>(null);
  const [managerPin, setManagerPin] = useState("");

  const cartItemIds = useMemo(() => cart.map(c => c.menuItemId), [cart]);
  const { data: upsells } = trpc.ai.getRealtimeUpsells.useQuery({ cartItemIds }, { enabled: cart.length > 0 });

  const createOrder = trpc.orders.create.useMutation();
  const addItem = trpc.orders.addItem.useMutation();
  const updateOrder = trpc.orders.update.useMutation();
  const updateTable = trpc.tables.update.useMutation();
  const mergeTablesMut = trpc.tableMerges.merge.useMutation();
  const unmergeTablesMut = trpc.tableMerges.unmerge.useMutation();
  const splitBillCreate = trpc.splitBills.create.useMutation();
  const splitBillAddPart = trpc.splitBills.addPart.useMutation();
  const splitBillPayPart = trpc.splitBills.payPart.useMutation();
  const applyDiscountMut = trpc.discountsManager.applyToOrder.useMutation();
  const addTipMut = trpc.tips.addToOrder.useMutation();

  const filteredItems = useMemo(() => {
    if (!allMenuItems) return [];
    return selectedCategory ? allMenuItems.filter(i => i.categoryId === selectedCategory && i.isAvailable) : allMenuItems.filter(i => i.isAvailable);
  }, [allMenuItems, selectedCategory]);

  const subtotal = cart.reduce((s, i) => s + (i.unitPrice + i.modifiers.reduce((m, mod) => m + mod.price, 0)) * i.quantity, 0);
  const tax = subtotal * 0.1;
  const serviceCharge = subtotal * 0.05;
  const tipAmount = tipType === "percent" ? subtotal * (tip / 100) : tip;
  const total = subtotal + tax + serviceCharge - discount + tipAmount;

  const addToCart = (item: NonNullable<typeof allMenuItems>[0]) => {
    setCart(prev => {
      const existing = prev.find(c => c.menuItemId === item.id && c.modifiers.length === 0);
      if (existing) return prev.map(c => c === existing ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { menuItemId: item.id, name: item.name, quantity: 1, unitPrice: Number(item.price), modifiers: [], notes: "" }];
    });
  };

  const updateQuantity = (index: number, delta: number) => {
    setCart(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], quantity: updated[index].quantity + delta };
      if (updated[index].quantity <= 0) updated.splice(index, 1);
      return updated;
    });
  };

  // Apply a preset discount
  const applyPresetDiscount = (d: NonNullable<typeof availableDiscounts>[0]) => {
    const discValue = Number(d.value);
    let amount = 0;
    if (d.type === "percentage") {
      amount = subtotal * (discValue / 100);
      if (d.maxDiscountAmount && amount > Number(d.maxDiscountAmount)) amount = Number(d.maxDiscountAmount);
    } else {
      amount = discValue;
    }
    // Check if approval needed (>10% or flagged)
    const pctOfOrder = (amount / subtotal) * 100;
    if (d.requiresApproval || pctOfOrder > Number(d.approvalThreshold || 10)) {
      setPendingDiscount({ name: d.name, type: d.type, value: discValue, amount, requiresApproval: true });
      setShowDiscountApproval(true);
    } else {
      setDiscount(amount);
      setDiscountName(d.name);
      setDiscountType(d.type as any);
      toast.success(`Discount "${d.name}" applied: -$${amount.toFixed(2)}`);
    }
  };

  const approveDiscount = () => {
    if (!pendingDiscount) return;
    // In production this would verify against a manager PIN/auth
    if (managerPin.length < 4) {
      toast.error("Manager PIN required (min 4 digits)");
      return;
    }
    setDiscount(pendingDiscount.amount);
    setDiscountName(pendingDiscount.name);
    setDiscountType(pendingDiscount.type as any);
    setShowDiscountApproval(false);
    setManagerPin("");
    setPendingDiscount(null);
    toast.success(`Discount approved and applied: -$${pendingDiscount.amount.toFixed(2)}`);
  };

  // Handle merge tables
  const handleMergeTables = async () => {
    if (!mergePrimary || mergeSecondary.length === 0) {
      toast.error("Select a primary table and at least one table to merge");
      return;
    }
    try {
      await mergeTablesMut.mutateAsync({ primaryTableId: Number(mergePrimary), tableIds: mergeSecondary });
      toast.success("Tables merged successfully");
      setShowMerge(false);
      setMergePrimary("");
      setMergeSecondary([]);
      utils.tables.list.invalidate();
      utils.tableMerges.getActive.invalidate();
    } catch { toast.error("Failed to merge tables"); }
  };

  const handleUnmerge = async (mergeId: number) => {
    try {
      await unmergeTablesMut.mutateAsync({ mergeId });
      toast.success("Tables unmerged");
      utils.tables.list.invalidate();
      utils.tableMerges.getActive.invalidate();
    } catch { toast.error("Failed to unmerge"); }
  };

  // Handle payment (single or split)
  const handlePayment = async (method: "card" | "cash" | "split") => {
    try {
      const order: any = await createOrder.mutateAsync({
        type: orderType,
        tableId: selectedTable ? Number(selectedTable) : undefined,
        customerName: customerName || undefined,
      });

      for (const item of cart) {
        const itemTotal = (item.unitPrice + item.modifiers.reduce((m, mod) => m + mod.price, 0)) * item.quantity;
        await addItem.mutateAsync({
          orderId: order.id,
          menuItemId: item.menuItemId,
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice.toFixed(2),
          totalPrice: itemTotal.toFixed(2),
          modifiers: item.modifiers.length > 0 ? item.modifiers : undefined,
          notes: item.notes || undefined,
        });
      }

      await updateOrder.mutateAsync({
        id: order.id,
        subtotal: subtotal.toFixed(2),
        taxAmount: tax.toFixed(2),
        discountAmount: discount.toFixed(2),
        serviceCharge: serviceCharge.toFixed(2),
        tipAmount: tipAmount.toFixed(2),
        total: total.toFixed(2),
        paymentMethod: method,
        paymentStatus: method === "split" ? "partial" : "paid",
        status: "preparing",
      });

      // If discount was applied, log it
      if (discount > 0) {
        await applyDiscountMut.mutateAsync({
          orderId: order.id,
          discountName: discountName || "Manual Discount",
          discountType: discountType || "manual",
          discountValue: discount.toFixed(2),
          discountAmount: discount.toFixed(2),
        });
      }

      // If tip was added, log it
      if (tipAmount > 0) {
        await addTipMut.mutateAsync({ orderId: order.id, tipAmount: tipAmount.toFixed(2) });
      }

      if (selectedTable) {
        await updateTable.mutateAsync({ id: Number(selectedTable), status: "occupied" });
      }

      // If split payment, open split dialog
      if (method === "split") {
        const splitBill: any = await splitBillCreate.mutateAsync({
          orderId: order.id,
          splitType: splitType,
          totalParts: splitParts,
        });
        const partAmount = (total / splitParts).toFixed(2);
        const parts = [];
        for (let i = 1; i <= splitParts; i++) {
          await splitBillAddPart.mutateAsync({
            splitBillId: splitBill.id,
            partNumber: i,
            amount: partAmount,
          });
          parts.push({ partNumber: i, amount: partAmount, method: "unpaid", paid: false });
        }
        setSplitPayments(parts);
        setShowPayment(false);
        setShowSplit(true);
        toast.success(`Order #${order.id} created — split into ${splitParts} parts`);
      } else {
        toast.success(`Order #${order.id} placed successfully!`);
        resetOrder();
      }

      utils.orders.list.invalidate();
      utils.tables.list.invalidate();
    } catch (err) {
      toast.error("Failed to create order");
    }
  };

  const resetOrder = () => {
    setCart([]);
    setShowPayment(false);
    setShowSplit(false);
    setDiscount(0);
    setDiscountName("");
    setTip(0);
    setCustomerName("");
    setSelectedTable("");
    setSplitPayments([]);
  };

  return (
    <div className="flex gap-4 h-[calc(100vh-6rem)]">
      {/* Left: Menu */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <h1 className="text-2xl font-bold tracking-tight">POS</h1>
          <Select value={orderType} onValueChange={(v: any) => setOrderType(v)}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="dine_in">Dine In</SelectItem>
              <SelectItem value="takeaway">Takeaway</SelectItem>
              <SelectItem value="delivery">Delivery</SelectItem>
              <SelectItem value="collection">Collection</SelectItem>
            </SelectContent>
          </Select>
          {orderType === "dine_in" && (
            <>
              <Select value={selectedTable} onValueChange={setSelectedTable}>
                <SelectTrigger className="w-36"><SelectValue placeholder="Select table" /></SelectTrigger>
                <SelectContent>
                  {tablesList?.filter(t => t.status === "free").map(t => (
                    <SelectItem key={t.id} value={String(t.id)}>{t.name} ({t.seats} seats)</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={() => setShowMerge(true)}>
                <Merge className="h-4 w-4 mr-1" /> Merge Tables
              </Button>
            </>
          )}
        </div>

        {/* Active merges banner */}
        {activeMerges && activeMerges.length > 0 && (
          <div className="flex gap-2 mb-3 flex-wrap">
            {activeMerges.map((m: any) => (
              <Badge key={m.id} variant="secondary" className="gap-1 cursor-pointer" onClick={() => handleUnmerge(m.id)}>
                Merged: Table {m.primaryTableId} + {(m.mergedTableIds as number[]).join(", ")}
                <span className="text-destructive ml-1">✕</span>
              </Badge>
            ))}
          </div>
        )}

        {/* Category tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          <Button variant={selectedCategory === null ? "default" : "outline"} size="sm" onClick={() => setSelectedCategory(null)}>All</Button>
          {categories?.filter((c: any) => c.isActive).map((cat: any) => (
            <Button key={cat.id} variant={selectedCategory === cat.id ? "default" : "outline"} size="sm" onClick={() => setSelectedCategory(cat.id)}>
              {cat.name}
            </Button>
          ))}
        </div>

        {/* Menu grid */}
        <ScrollArea className="flex-1">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredItems.map(item => (
              <button key={item.id} onClick={() => addToCart(item)}
                className="p-4 rounded-xl bg-card border border-border hover:border-primary/50 hover:bg-accent/50 transition-all text-left group">
                <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">{item.name}</p>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{item.description}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm font-bold text-primary">${Number(item.price).toFixed(2)}</span>
                  {item.isPopular && <Badge variant="secondary" className="text-xs">Popular</Badge>}
                </div>
              </button>
            ))}
            {filteredItems.length === 0 && (
              <div className="col-span-full text-center py-12 text-muted-foreground">No menu items found.</div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Right: Cart */}
      <Card className="w-80 lg:w-96 flex flex-col bg-card border-border shrink-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            Current Order
            {cart.length > 0 && <Badge variant="secondary">{cart.length}</Badge>}
          </CardTitle>
          <Input placeholder="Customer name" value={customerName} onChange={e => setCustomerName(e.target.value)} className="mt-2" />
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          <ScrollArea className="flex-1 -mx-2 px-2">
            {cart.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">Tap items to add to order</p>
            ) : (
              <div className="space-y-2">
                {cart.map((item, i) => {
                  const itemTotal = (item.unitPrice + item.modifiers.reduce((m, mod) => m + mod.price, 0)) * item.quantity;
                  return (
                    <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground">${item.unitPrice.toFixed(2)} ea</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateQuantity(i, -1)}>
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateQuantity(i, 1)}>
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <span className="text-sm font-medium w-16 text-right">${itemTotal.toFixed(2)}</span>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setCart(prev => prev.filter((_, idx) => idx !== i))}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>

          {/* AI Upsell Suggestions */}
          {cart.length > 0 && upsells && upsells.length > 0 && (
            <div className="mx-2 mt-2 mb-2 p-3 bg-indigo-50 border border-indigo-100 rounded-lg shrink-0">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider flex items-center"><Sparkles className="h-3 w-3 mr-1" /> AI Suggests</span>
              </div>
              <div className="space-y-2">
                {upsells.map((upsell, i) => (
                  <div key={i} className="flex justify-between items-center bg-white p-2 rounded shadow-sm border border-indigo-100">
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="text-sm font-semibold truncate text-indigo-950">{upsell.item.name}</p>
                      <p className="text-[10px] text-indigo-500 uppercase font-bold truncate">{upsell.reason}</p>
                    </div>
                    <Button size="sm" variant="outline" className="h-7 px-2 text-xs border-indigo-200 text-indigo-700 hover:bg-indigo-50 shrink-0" onClick={() => addToCart(upsell.item as any)}>
                      + ${Number(upsell.item.price).toFixed(2)}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Totals */}
          {cart.length > 0 && (
            <div className="border-t border-border pt-3 mt-3 space-y-1.5">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Tax (10%)</span><span>${tax.toFixed(2)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Service (5%)</span><span>${serviceCharge.toFixed(2)}</span></div>
              {discount > 0 && <div className="flex justify-between text-sm text-green-500"><span>Discount ({discountName})</span><span>-${discount.toFixed(2)}</span></div>}
              {tipAmount > 0 && <div className="flex justify-between text-sm text-blue-400"><span>Tip</span><span>+${tipAmount.toFixed(2)}</span></div>}
              <div className="flex justify-between text-base font-bold pt-1 border-t border-border">
                <span>Total</span><span className="text-primary">${total.toFixed(2)}</span>
              </div>

              {/* Quick discount buttons */}
              {availableDiscounts && availableDiscounts.length > 0 && (
                <div className="flex gap-1 flex-wrap pt-1">
                  {availableDiscounts.slice(0, 4).map((d: any) => (
                    <Button key={d.id} variant="outline" size="sm" className="text-xs h-7" onClick={() => applyPresetDiscount(d)}>
                      <Tag className="h-3 w-3 mr-1" />{d.name}
                    </Button>
                  ))}
                </div>
              )}

              <Button className="w-full mt-3" size="lg" onClick={() => setShowPayment(true)}>
                <Receipt className="h-4 w-4 mr-2" /> Charge ${total.toFixed(2)}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <Dialog open={showPayment} onOpenChange={setShowPayment}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Complete Payment</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-between text-lg font-bold">
              <span>Total Due</span><span className="text-primary">${total.toFixed(2)}</span>
            </div>

            {/* Discount */}
            <div>
              <Label className="text-sm text-muted-foreground">Discount</Label>
              <div className="flex gap-2 mt-1">
                <Input type="number" min={0} value={discount} onChange={e => { setDiscount(Number(e.target.value)); setDiscountName("Manual"); setDiscountType("manual"); }} placeholder="Amount" />
                {discount > 0 && subtotal > 0 && (
                  <Badge variant="secondary" className="shrink-0">{((discount / subtotal) * 100).toFixed(1)}%</Badge>
                )}
              </div>
            </div>

            {/* Tip */}
            <div>
              <Label className="text-sm text-muted-foreground">Tip</Label>
              <div className="flex gap-2 mt-1">
                <div className="flex gap-1">
                  {[10, 15, 20].map(pct => (
                    <Button key={pct} variant={tipType === "percent" && tip === pct ? "default" : "outline"} size="sm"
                      onClick={() => { setTipType("percent"); setTip(pct); }}>
                      {pct}%
                    </Button>
                  ))}
                </div>
                <Input type="number" min={0} value={tipType === "amount" ? tip : ""} placeholder="Custom $"
                  onChange={e => { setTipType("amount"); setTip(Number(e.target.value)); }} className="w-24" />
              </div>
            </div>

            <Separator />

            {/* Split bill config */}
            <div>
              <Label className="text-sm text-muted-foreground">Split Bill</Label>
              <div className="flex gap-2 mt-1 items-center">
                <Select value={splitType} onValueChange={(v: any) => setSplitType(v)}>
                  <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="equal">Equal Split</SelectItem>
                    <SelectItem value="by_item">By Item</SelectItem>
                    <SelectItem value="by_percentage">By %</SelectItem>
                  </SelectContent>
                </Select>
                <Input type="number" min={2} max={10} value={splitParts} onChange={e => setSplitParts(Number(e.target.value))} className="w-20" />
                <span className="text-xs text-muted-foreground">parts</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Button size="lg" className="flex flex-col gap-1 h-20" onClick={() => handlePayment("card")}>
                <CreditCard className="h-6 w-6" /><span className="text-xs">Card</span>
              </Button>
              <Button size="lg" variant="outline" className="flex flex-col gap-1 h-20" onClick={() => handlePayment("cash")}>
                <Banknote className="h-6 w-6" /><span className="text-xs">Cash</span>
              </Button>
              <Button size="lg" variant="outline" className="flex flex-col gap-1 h-20" onClick={() => handlePayment("split")}>
                <Split className="h-6 w-6" /><span className="text-xs">Split ({splitParts})</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Split Bill Payment Dialog */}
      <Dialog open={showSplit} onOpenChange={setShowSplit}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Split Bill Payment</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {splitPayments.map((part, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                <span className="font-medium text-sm w-16">Part {part.partNumber}</span>
                <span className="text-sm font-bold flex-1">${part.amount}</span>
                {part.paid ? (
                  <Badge className="bg-green-500/20 text-green-400">Paid ({part.method})</Badge>
                ) : (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => {
                      setSplitPayments(prev => prev.map((p, idx) => idx === i ? { ...p, paid: true, method: "card" } : p));
                      toast.success(`Part ${part.partNumber} paid by card`);
                    }}><CreditCard className="h-3 w-3 mr-1" />Card</Button>
                    <Button size="sm" variant="outline" onClick={() => {
                      setSplitPayments(prev => prev.map((p, idx) => idx === i ? { ...p, paid: true, method: "cash" } : p));
                      toast.success(`Part ${part.partNumber} paid by cash`);
                    }}><Banknote className="h-3 w-3 mr-1" />Cash</Button>
                  </div>
                )}
              </div>
            ))}
            {splitPayments.length > 0 && splitPayments.every(p => p.paid) && (
              <Button className="w-full" onClick={resetOrder}>All Paid — Close Order</Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Merge Tables Dialog */}
      <Dialog open={showMerge} onOpenChange={setShowMerge}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Merge Tables</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Primary Table</Label>
              <Select value={mergePrimary} onValueChange={setMergePrimary}>
                <SelectTrigger><SelectValue placeholder="Select primary table" /></SelectTrigger>
                <SelectContent>
                  {tablesList?.filter(t => t.status === "free").map(t => (
                    <SelectItem key={t.id} value={String(t.id)}>{t.name} ({t.seats} seats)</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tables to Merge</Label>
              <div className="flex gap-2 flex-wrap mt-2">
                {tablesList?.filter(t => t.status === "free" && String(t.id) !== mergePrimary).map(t => (
                  <Button key={t.id} size="sm"
                    variant={mergeSecondary.includes(t.id) ? "default" : "outline"}
                    onClick={() => setMergeSecondary(prev => prev.includes(t.id) ? prev.filter(id => id !== t.id) : [...prev, t.id])}>
                    {t.name}
                  </Button>
                ))}
              </div>
            </div>
            <Button className="w-full" onClick={handleMergeTables} disabled={!mergePrimary || mergeSecondary.length === 0}>
              <Merge className="h-4 w-4 mr-2" /> Merge {mergeSecondary.length + 1} Tables
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Discount Approval Dialog */}
      <Dialog open={showDiscountApproval} onOpenChange={setShowDiscountApproval}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Manager Approval Required</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Discount "{pendingDiscount?.name}" of ${pendingDiscount?.amount.toFixed(2)} exceeds the approval threshold.
              A manager must approve this discount.
            </p>
            <div>
              <Label>Manager PIN</Label>
              <Input type="password" maxLength={6} value={managerPin} onChange={e => setManagerPin(e.target.value)} placeholder="Enter manager PIN" />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => { setShowDiscountApproval(false); setPendingDiscount(null); setManagerPin(""); }}>Cancel</Button>
              <Button className="flex-1" onClick={approveDiscount}>Approve</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

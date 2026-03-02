import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { FileSearch, Upload, Loader2, X, Plus } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AiInvoiceResult } from "../../../../server/services/ai";

interface AiInvoiceScannerProps {
    onSuccess: () => void;
    suppliers: any[];
    ingredients: any[];
}

export function AiInvoiceScanner({ onSuccess, suppliers, ingredients }: AiInvoiceScannerProps) {
    const [open, setOpen] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [parsedData, setParsedData] = useState<AiInvoiceResult | null>(null);
    const [supplierId, setSupplierId] = useState<string>("");
    const [itemMappings, setItemMappings] = useState<Record<number, string>>({});

    const parseInvoice = trpc.ai.parseInvoice.useMutation();
    const createPO = trpc.purchaseOrders.create.useMutation();
    const createSupplier = trpc.suppliers.create.useMutation();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            if (!selectedFile.type.startsWith("image/")) {
                toast.error("Please upload an image file (JPEG, PNG). PDF support coming soon.");
                return;
            }
            setFile(selectedFile);
            setPreviewUrl(URL.createObjectURL(selectedFile));
            setParsedData(null);
        }
    };

    const handleParse = async () => {
        if (!file) return;
        setIsUploading(true);

        try {
            const buffer = await file.arrayBuffer();
            const base64 = Buffer.from(buffer).toString('base64');

            const result = await parseInvoice.mutateAsync({ fileBase64: base64 });
            setParsedData(result);
            toast.success("Invoice parsed successfully!");

            // Try to auto-match supplier if one wasn't manually selected yet
            if (result.supplierName && !supplierId) {
                const match = suppliers.find(s =>
                    s.name.toLowerCase().includes(result.supplierName!.toLowerCase()) ||
                    result.supplierName!.toLowerCase().includes(s.name.toLowerCase())
                );
                if (match) setSupplierId(String(match.id));
            }

            // Try to auto-match ingredients based on description
            const initialMap: Record<number, string> = {};
            result.items.forEach((item, idx) => {
                const match = ingredients.find(ing =>
                    item.description.toLowerCase().includes(ing.name.toLowerCase()) ||
                    ing.name.toLowerCase().includes(item.description.toLowerCase())
                );
                if (match) {
                    initialMap[idx] = String(match.id);
                }
            });
            setItemMappings(initialMap);

        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Failed to parse invoice image.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleImport = async () => {
        if (!parsedData) return;
        setIsUploading(true);

        try {
            let finalSupplierId = supplierId;

            // Create supplier if necessary
            if (finalSupplierId === "create_new" && parsedData.supplierName) {
                const newSupplier = await createSupplier.mutateAsync({ name: parsedData.supplierName });
                finalSupplierId = String((newSupplier as any)[0]?.insertId || (newSupplier as any).insertId);
            }

            if (!finalSupplierId || finalSupplierId === "create_new") {
                toast.error("Please select a valid supplier or ensure the AI extracted a supplier name.");
                setIsUploading(false);
                return;
            }

            // Build PO Items
            const validItems = parsedData.items.map((item, idx) => {
                const mappedIngId = itemMappings[idx];
                if (!mappedIngId) return null; // Skip unmapped items

                // Clean prices
                const rawUnit = item.unitPrice.replace(/[^0-9.]/g, '');
                return {
                    ingredientId: parseInt(mappedIngId),
                    quantity: String(item.quantity),
                    unitCost: rawUnit,
                    totalCost: (parseFloat(rawUnit) * item.quantity).toFixed(2),
                };
            }).filter(Boolean) as any[];

            if (validItems.length === 0) {
                toast.error("Please map at least one invoice item to an ingredient.");
                setIsUploading(false);
                return;
            }

            await createPO.mutateAsync({
                supplierId: parseInt(finalSupplierId),
                notes: `AI Scanned Invoice: ${parsedData.invoiceNumber || 'Unknown'} - ${parsedData.invoiceDate || ''}`,
                items: validItems,
            });

            toast.success(`Purchase order drafted with ${validItems.length} items!`);
            setOpen(false);
            resetState();
            onSuccess();
        } catch (error: any) {
            console.error(error);
            toast.error("Failed to import invoice. " + (error.message || ""));
        } finally {
            setIsUploading(false);
        }
    };

    const resetState = () => {
        setFile(null);
        setPreviewUrl(null);
        setParsedData(null);
        setItemMappings({});
        setSupplierId("");
    };

    const handleOpenChange = (newOpen: boolean) => {
        setOpen(newOpen);
        if (!newOpen) resetState();
    };

    return (
        <>
            <Button variant="outline" className="border-indigo-200 text-indigo-700 hover:bg-indigo-50" onClick={() => setOpen(true)}>
                <FileSearch className="h-4 w-4 mr-2" /> AI Scan Invoice
            </Button>

            <Dialog open={open} onOpenChange={handleOpenChange}>
                <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileSearch className="h-5 w-5 text-indigo-600" />
                            AI Invoice Scanner
                        </DialogTitle>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                        {!parsedData ? (
                            // Step 1: Upload
                            <div className="space-y-4">
                                <div
                                    className="border-2 border-dashed border-border rounded-lg p-12 text-center hover:bg-accent/50 transition-colors cursor-pointer relative"
                                    onClick={() => document.getElementById('invoice-upload')?.click()}
                                >
                                    <Input
                                        id="invoice-upload"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleFileChange}
                                        disabled={isUploading}
                                    />
                                    {previewUrl ? (
                                        <div className="space-y-4">
                                            <img src={previewUrl} alt="Invoice preview" className="max-h-64 mx-auto rounded shadow-sm" />
                                            <Button type="button" variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); resetState(); }}>
                                                <X className="h-3 w-3 mr-1" /> Clear Image
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <Upload className="h-8 w-8 text-muted-foreground mx-auto" />
                                            <p className="font-medium">Click to upload or drag and drop invoice</p>
                                            <p className="text-sm text-muted-foreground">Take a clear picture of the supplier invoice</p>
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-end">
                                    <Button onClick={handleParse} disabled={!file || isUploading} className="w-full sm:w-auto">
                                        {isUploading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Extracting Data...</> : "Scan with AI"}
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            // Step 2: Review Grid
                            <div className="space-y-6">
                                <div className="bg-indigo-50 text-indigo-800 p-4 rounded-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div>
                                        <p className="font-semibold">Invoice Metadata</p>
                                        <p className="text-sm opacity-90">
                                            Document: {parsedData.invoiceNumber || 'N/A'} • Date: {parsedData.invoiceDate || 'N/A'} • Total: {parsedData.totalAmount ? `$${parsedData.totalAmount}` : 'N/A'}
                                        </p>
                                    </div>

                                    <div className="w-full sm:w-64">
                                        <Label className="text-xs text-indigo-800/80 mb-1 block">Supplier Identity:</Label>
                                        <Select value={supplierId} onValueChange={setSupplierId}>
                                            <SelectTrigger className="bg-white border-indigo-200">
                                                <SelectValue placeholder="Select Supplier..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {parsedData.supplierName && (
                                                    <SelectItem value="create_new" className="text-success font-medium">
                                                        + Create "{parsedData.supplierName}"
                                                    </SelectItem>
                                                )}
                                                {suppliers.map(s => (
                                                    <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="border rounded-md overflow-hidden">
                                    <div className="bg-muted p-3 border-b font-medium text-sm flex justify-between items-center">
                                        Extracted Line Items
                                        <Badge variant="outline">{parsedData.items.length} found</Badge>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-background">
                                                <tr className="border-b">
                                                    <th className="text-left p-3 font-medium text-muted-foreground w-1/3">Original Invoice Line</th>
                                                    <th className="text-left p-3 font-medium text-muted-foreground">Qty / Unit Price</th>
                                                    <th className="text-left p-3 font-medium text-muted-foreground">Map to Inventory</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y">
                                                {parsedData.items.map((item, idx) => (
                                                    <tr key={idx} className={itemMappings[idx] ? "bg-success/5" : "hover:bg-accent/20"}>
                                                        <td className="p-3 align-top">
                                                            <span className="font-medium">{item.description}</span>
                                                        </td>
                                                        <td className="p-3 align-top whitespace-nowrap">
                                                            <div>{item.quantity} {item.unitOfMeasure || 'units'}</div>
                                                            <div className="text-muted-foreground text-xs mt-1">@ ${item.unitPrice}</div>
                                                        </td>
                                                        <td className="p-3 align-top">
                                                            <Select
                                                                value={itemMappings[idx]}
                                                                onValueChange={(val) => setItemMappings(prev => ({ ...prev, [idx]: val }))}
                                                            >
                                                                <SelectTrigger className={!itemMappings[idx] ? "border-amber-300 bg-amber-50" : "bg-background"}>
                                                                    <SelectValue placeholder="Select inventory match..." />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {ingredients.map(ing => (
                                                                        <SelectItem key={ing.id} value={String(ing.id)}>{ing.name} ({ing.unit})</SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="mt-4 pt-4 border-t">
                        {parsedData ? (
                            <>
                                <Button variant="outline" onClick={() => setParsedData(null)} disabled={isUploading}>Back to Upload</Button>
                                <Button
                                    onClick={handleImport}
                                    disabled={isUploading || !supplierId || Object.keys(itemMappings).length === 0}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                                >
                                    {isUploading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Drafting...</> : "Draft Purchase Order"}
                                </Button>
                            </>
                        ) : (
                            <Button variant="outline" onClick={() => handleOpenChange(false)}>Cancel</Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

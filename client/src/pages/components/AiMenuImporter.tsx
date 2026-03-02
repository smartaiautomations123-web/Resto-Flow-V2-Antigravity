import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Sparkles, Upload, Loader2, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AiMenuResult } from "../../../../server/services/ai";

interface AiMenuImporterProps {
    onSuccess: () => void;
    categories: any[];
}

export function AiMenuImporter({ onSuccess, categories }: AiMenuImporterProps) {
    const [open, setOpen] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [parsedData, setParsedData] = useState<AiMenuResult | null>(null);
    const [categoriesMap, setCategoriesMap] = useState<Record<string, number>>({});

    const parseMenu = trpc.ai.parseMenu.useMutation();
    const createCategory = trpc.categories.create.useMutation();
    const createItem = trpc.menu.create.useMutation();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            if (!selectedFile.type.startsWith("image/")) {
                toast.error("Please upload an image file (JPEG, PNG, etc). PDF support coming soon.");
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
            // Read file as base64
            const buffer = await file.arrayBuffer();
            const base64 = Buffer.from(buffer).toString('base64');

            const result = await parseMenu.mutateAsync({ fileBase64: base64 });
            setParsedData(result);
            toast.success("Menu parsed successfully! Please review the extracted data.");

            // Auto-map existing categories if names match
            const initialMap: Record<string, number> = {};
            result.categories.forEach(aiCat => {
                const existing = categories.find(c => c.name.toLowerCase() === aiCat.name.toLowerCase());
                if (existing) {
                    initialMap[aiCat.name] = existing.id;
                }
            });
            setCategoriesMap(initialMap);

        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Failed to parse menu image. Please try again.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleImport = async () => {
        if (!parsedData) return;
        setIsUploading(true);

        try {
            let importedItems = 0;
            let newCats = 0;

            for (const aiCat of parsedData.categories) {
                let catId = categoriesMap[aiCat.name];

                // If category isn't mapped, create it
                if (!catId) {
                    const newCat = await createCategory.mutateAsync({ name: aiCat.name, description: "AI Imported Category" });
                    catId = (newCat as any)[0]?.insertId || (newCat as any).insertId;
                    newCats++;
                }

                // Import items for this category
                if (catId) {
                    for (const item of aiCat.items) {
                        // Clean up price string to be just numbers
                        const rawPrice = item.price.replace(/[^0-9.]/g, '');
                        const finalPrice = parseFloat(rawPrice);

                        if (isNaN(finalPrice)) continue;

                        await createItem.mutateAsync({
                            categoryId: catId,
                            name: item.name,
                            description: item.description || "",
                            price: finalPrice.toFixed(2),
                            isAvailable: true,
                            station: "general",
                        });
                        importedItems++;
                    }
                }
            }

            toast.success(`Import complete! Added ${importedItems} items and ${newCats} new categories`);
            setOpen(false);
            resetState();
            onSuccess();
        } catch (error: any) {
            console.error(error);
            toast.error("Failed to import some items. " + (error.message || ""));
        } finally {
            setIsUploading(false);
        }
    };

    const resetState = () => {
        setFile(null);
        setPreviewUrl(null);
        setParsedData(null);
        setCategoriesMap({});
    };

    const handleOpenChange = (newOpen: boolean) => {
        setOpen(newOpen);
        if (!newOpen) resetState();
    };

    return (
        <>
            <Button variant="default" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700" onClick={() => setOpen(true)}>
                <Sparkles className="h-4 w-4 mr-2" /> AI Import Menu
            </Button>

            <Dialog open={open} onOpenChange={handleOpenChange}>
                <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-purple-600" />
                            AI Menu Importer
                        </DialogTitle>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                        {!parsedData ? (
                            // Step 1: Upload
                            <div className="space-y-4">
                                <div
                                    className="border-2 border-dashed border-border rounded-lg p-12 text-center hover:bg-accent/50 transition-colors cursor-pointer relative"
                                    onClick={() => document.getElementById('menu-upload')?.click()}
                                >
                                    <Input
                                        id="menu-upload"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleFileChange}
                                        disabled={isUploading}
                                    />
                                    {previewUrl ? (
                                        <div className="space-y-4">
                                            <img src={previewUrl} alt="Menu preview" className="max-h-64 mx-auto rounded shadow-sm" />
                                            <Button type="button" variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); resetState(); }}>
                                                <X className="h-3 w-3 mr-1" /> Clear Image
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <Upload className="h-8 w-8 text-muted-foreground mx-auto" />
                                            <p className="font-medium">Click to upload or drag and drop</p>
                                            <p className="text-sm text-muted-foreground">Supported format: JPEG, PNG</p>
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-end">
                                    <Button onClick={handleParse} disabled={!file || isUploading} className="w-full sm:w-auto">
                                        {isUploading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Analyzing Menu...</> : "Parse with AI"}
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            // Step 2: Review Grid
                            <div className="space-y-6">
                                <div className="bg-accent/50 p-3 rounded text-sm text-muted-foreground">
                                    Review the extracted items below. You can map extracted categories to existing ones. Unmapped categories will be created automatically.
                                </div>

                                {parsedData.categories.map((aiCat, idx) => (
                                    <div key={idx} className="border rounded-md overflow-hidden">
                                        <div className="bg-muted p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b">
                                            <div className="font-semibold">{aiCat.name} <span className="text-muted-foreground text-sm font-normal">({aiCat.items.length} items)</span></div>

                                            <div className="flex items-center gap-2">
                                                <Label className="text-xs whitespace-nowrap">Map to:</Label>
                                                <Select
                                                    value={categoriesMap[aiCat.name] ? String(categoriesMap[aiCat.name]) : "create_new"}
                                                    onValueChange={(val) => {
                                                        setCategoriesMap(prev => {
                                                            const next = { ...prev };
                                                            if (val === "create_new") delete next[aiCat.name];
                                                            else next[aiCat.name] = parseInt(val);
                                                            return next;
                                                        });
                                                    }}
                                                >
                                                    <SelectTrigger className="h-8 w-48 bg-background">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="create_new" className="text-success font-medium">+ Create as new category</SelectItem>
                                                        {categories.map(c => (
                                                            <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead className="bg-background">
                                                    <tr className="border-b">
                                                        <th className="text-left p-2 font-medium text-muted-foreground w-1/3">Item Name</th>
                                                        <th className="text-left p-2 font-medium text-muted-foreground w-1/2">Description</th>
                                                        <th className="text-right p-2 font-medium text-muted-foreground">Price</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y">
                                                    {aiCat.items.map((item, itemIdx) => (
                                                        <tr key={itemIdx} className="hover:bg-accent/20">
                                                            <td className="p-2 align-top font-medium">{item.name}</td>
                                                            <td className="p-2 align-top text-muted-foreground text-xs leading-relaxed">{item.description || "-"}</td>
                                                            <td className="p-2 align-top text-right whitespace-nowrap">${item.price}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <DialogFooter className="mt-4 pt-4 border-t">
                        {parsedData ? (
                            <>
                                <Button variant="outline" onClick={() => setParsedData(null)} disabled={isUploading}>Back to Upload</Button>
                                <Button onClick={handleImport} disabled={isUploading} className="bg-success hover:bg-success/90 text-success-foreground">
                                    {isUploading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Importing...</> : "Confirm & Import All"}
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

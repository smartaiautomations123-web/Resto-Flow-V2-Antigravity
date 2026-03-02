import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Clock, Search, Download } from 'lucide-react';
import { Progress } from "@/components/ui/progress";

export default function DataImports() {
    const [dataType, setDataType] = useState<string>('menu');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const utils = trpc.useUtils();
    const { data: jobs, isLoading } = trpc.dataImports.listJobs.useQuery(undefined, {
        refetchInterval: 5000 // Poll every 5s for updates
    });

    const uploadMut = trpc.dataImports.uploadFile.useMutation({
        onSuccess: () => {
            toast.success('File uploaded successfully. Processing started.');
            setSelectedFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
            utils.dataImports.listJobs.invalidate();
        },
        onError: (err) => toast.error(`Upload failed: ${err.message}`),
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            if (file.name.endsWith('.csv') || file.name.endsWith('.xlsx')) {
                setSelectedFile(file);
            } else {
                toast.error('Please select a valid CSV or Excel file.');
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        // Convert file to base64 for TRPC submission (for smaller files like CSVs this is fine)
        const reader = new FileReader();
        reader.onload = async (e) => {
            const base64 = (e.target?.result as string).split(',')[1];
            uploadMut.mutate({
                fileName: selectedFile.name,
                fileBase64: base64,
                dataType,
            });
        };
        reader.readAsDataURL(selectedFile);
    };

    const getStatusBadge = (status: string) => {
        switch (status.toLowerCase()) {
            case 'completed': return <Badge className="bg-green-500"><CheckCircle2 className="w-3 h-3 mr-1" />Completed</Badge>;
            case 'processing': return <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"><Clock className="w-3 h-3 mr-1 animate-spin" />Processing</Badge>;
            case 'failed': return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Failed</Badge>;
            default: return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
        }
    };

    const downloadTemplate = () => {
        const csvContent = "data:text/csv;charset=utf-8,Name,Description,Price,Category\nSample Item,A delicious meal,12.99,Mains";
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${dataType}_template.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold">Data Imports</h1>
                <p className="text-muted-foreground mt-2">Bulk upload your existing data via CSV or Excel to get started quickly.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Upload Section */}
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>New Import</CardTitle>
                            <CardDescription>Upload a file to import records</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Data Type</label>
                                <Select value={dataType} onValueChange={setDataType}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="menu">Menu Items</SelectItem>
                                        <SelectItem value="customers">Customers</SelectItem>
                                        <SelectItem value="inventory">Inventory / Ingredients</SelectItem>
                                        <SelectItem value="staff">Staff Members</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center text-center space-y-4 hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center">
                                    <UploadCloud className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="font-medium">{selectedFile ? selectedFile.name : 'Click to upload file'}</p>
                                    <p className="text-xs text-muted-foreground mt-1">Supports .csv, .xlsx</p>
                                </div>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                                    onChange={handleFileChange}
                                />
                            </div>

                        </CardContent>
                        <CardFooter className="flex-col gap-3">
                            <Button className="w-full" onClick={handleUpload} disabled={!selectedFile || uploadMut.isPending}>
                                {uploadMut.isPending ? 'Uploading...' : 'Start Import'}
                            </Button>
                            <Button variant="outline" className="w-full text-xs" onClick={downloadTemplate}>
                                <Download className="w-3 h-3 mr-2" /> Download Template
                            </Button>
                        </CardFooter>
                    </Card>
                </div>

                {/* Recent Imports Section */}
                <div className="lg:col-span-2 space-y-4">
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle>Recent Import Jobs</CardTitle>
                            <CardDescription>Status and history of your data uploads</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                    <Clock className="w-8 h-8 animate-spin mb-4 text-primary/40" />
                                    <p>Loading jobs...</p>
                                </div>
                            ) : jobs?.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 text-center border rounded-xl bg-muted/20">
                                    <Search className="w-10 h-10 text-muted-foreground mb-4" />
                                    <h3 className="font-medium text-lg">No imports yet</h3>
                                    <p className="text-muted-foreground text-sm max-w-sm mt-1">
                                        Upload your first CSV or Excel file to see the import history here.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {jobs?.map((job) => (
                                        <div key={job.id} className="border rounded-lg p-4 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center">
                                                        <FileText className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium capitalize">{job.type} Import</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {new Date(job.createdAt).toLocaleString()} · ID: #{job.id}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div>{getStatusBadge(job.status)}</div>
                                            </div>

                                            {job.status === 'processing' && (
                                                <div className="space-y-1">
                                                    <div className="flex justify-between text-xs text-muted-foreground">
                                                        <span>Processing records...</span>
                                                        <span>{job.processedRecords || 0} / {job.totalRecords || '?'}</span>
                                                    </div>
                                                    <Progress value={job.totalRecords ? ((job.processedRecords || 0) / job.totalRecords) * 100 : 0} className="h-2" />
                                                </div>
                                            )}

                                            {job.status === 'completed' && (
                                                <div className="bg-green-50 dark:bg-green-900/10 text-green-700 dark:text-green-400 text-sm p-3 rounded-md flex items-center justify-between">
                                                    <span>Successfully processed {job.processedRecords} records.</span>
                                                    {job.failedRecords ? <span className="text-red-500 font-medium">{job.failedRecords} failed</span> : null}
                                                </div>
                                            )}

                                            {job.status === 'failed' && (
                                                <div className="bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-400 text-sm p-3 rounded-md">
                                                    Error: {job.errorMessage || 'Unknown error occurred during processing.'}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

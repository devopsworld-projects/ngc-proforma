import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, Download } from "lucide-react";
import { useBulkCreateProducts } from "@/hooks/useProducts";
import { toast } from "sonner";

interface ParsedProduct {
  name: string;
  description: string | null;
  sku: string | null;
  unit: string;
  rate: number;
  hsn_code: string | null;
  category: string | null;
  stock_quantity: number;
  is_active: boolean;
}

interface ExcelUploadDialogProps {
  trigger?: React.ReactNode;
}

export function ExcelUploadDialog({ trigger }: ExcelUploadDialogProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parsedProducts, setParsedProducts] = useState<ParsedProduct[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const bulkCreate = useBulkCreateProducts();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setErrors([]);
    setParsedProducts([]);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

        const products: ParsedProduct[] = [];
        const parseErrors: string[] = [];

        jsonData.forEach((row: any, index: number) => {
          const rowNum = index + 2; // +2 for 1-indexed and header row
          
          const name = String(row.name || row.Name || row.PRODUCT_NAME || row["Product Name"] || "").trim();
          if (!name) {
            parseErrors.push(`Row ${rowNum}: Missing product name`);
            return;
          }

          const rate = parseFloat(row.rate || row.Rate || row.RATE || row.Price || row.price || 0);
          if (isNaN(rate) || rate < 0) {
            parseErrors.push(`Row ${rowNum}: Invalid rate for "${name}"`);
            return;
          }

          const stockQty = parseFloat(row.stock_quantity || row.stock || row.Stock || row.quantity || row.Quantity || 0);

          products.push({
            name,
            description: String(row.description || row.Description || row.DESCRIPTION || "").trim() || null,
            sku: String(row.sku || row.SKU || row.sku_code || row["SKU Code"] || "").trim() || null,
            unit: String(row.unit || row.Unit || row.UNIT || "NOS").trim(),
            rate,
            hsn_code: String(row.hsn_code || row.HSN || row.hsn || row["HSN Code"] || "").trim() || null,
            category: String(row.category || row.Category || row.CATEGORY || "").trim() || null,
            stock_quantity: isNaN(stockQty) ? 0 : stockQty,
            is_active: true,
          });
        });

        setParsedProducts(products);
        setErrors(parseErrors);
      } catch (error) {
        console.error("Error parsing Excel file:", error);
        setErrors(["Failed to parse Excel file. Please ensure it's a valid .xlsx or .xls file."]);
      }
    };

    reader.readAsArrayBuffer(selectedFile);
  };

  const handleUpload = async () => {
    if (parsedProducts.length === 0) {
      toast.error("No valid products to upload");
      return;
    }

    setIsUploading(true);
    try {
      await bulkCreate.mutateAsync(parsedProducts);
      toast.success(`Successfully imported ${parsedProducts.length} products`);
      setOpen(false);
      resetState();
    } catch (error: any) {
      console.error("Error uploading products:", error);
      toast.error(error.message || "Failed to upload products");
    } finally {
      setIsUploading(false);
    }
  };

  const resetState = () => {
    setFile(null);
    setParsedProducts([]);
    setErrors([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const downloadTemplate = () => {
    const template = [
      {
        name: "Sample Product",
        description: "Product description",
        sku: "SKU001",
        unit: "NOS",
        rate: 100,
        hsn_code: "8471",
        category: "Electronics",
        stock_quantity: 50,
      },
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Products");
    XLSX.writeFile(wb, "products_template.xlsx");
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) resetState();
    }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <Upload className="h-4 w-4" />
            Import Excel
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Import Products from Excel
          </DialogTitle>
          <DialogDescription>
            Upload an Excel file (.xlsx, .xls) with your products. Required columns: name, rate. Optional: description, sku, unit, hsn_code, category, stock_quantity.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-4 overflow-hidden">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="file">Select Excel File</Label>
              <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={downloadTemplate}>
                <Download className="h-3 w-3 mr-1" />
                Download Template
              </Button>
            </div>
            <Input
              ref={fileInputRef}
              id="file"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
            />
          </div>

          {errors.length > 0 && (
            <div className="p-3 bg-destructive/10 rounded-lg space-y-1">
              <div className="flex items-center gap-2 text-destructive font-medium">
                <AlertCircle className="h-4 w-4" />
                <span>{errors.length} issue{errors.length > 1 ? "s" : ""} found</span>
              </div>
              <ul className="text-sm text-destructive/80 list-disc list-inside">
                {errors.slice(0, 5).map((error, i) => (
                  <li key={i}>{error}</li>
                ))}
                {errors.length > 5 && <li>...and {errors.length - 5} more</li>}
              </ul>
            </div>
          )}

          {parsedProducts.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="font-medium">{parsedProducts.length} products ready to import</span>
              </div>
              <ScrollArea className="h-[250px] border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Stock</TableHead>
                      <TableHead className="text-right">Rate (₹)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedProducts.slice(0, 50).map((product, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-mono text-xs">{index + 1}</TableCell>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>
                          {product.sku ? (
                            <Badge variant="outline" className="font-mono text-xs">
                              {product.sku}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {product.category ? (
                            <Badge variant="secondary" className="text-xs">
                              {product.category}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">{product.stock_quantity}</TableCell>
                        <TableCell className="text-right">{product.rate.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {parsedProducts.length > 50 && (
                  <div className="p-2 text-center text-sm text-muted-foreground">
                    ...and {parsedProducts.length - 50} more products
                  </div>
                )}
              </ScrollArea>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={parsedProducts.length === 0 || isUploading}
            className="gap-2"
          >
            {isUploading ? (
              <>Importing...</>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Import {parsedProducts.length} Products
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

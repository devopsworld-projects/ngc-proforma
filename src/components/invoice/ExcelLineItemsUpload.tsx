import { useState, useRef } from "react";
import { parseExcelFile, downloadExcelTemplate } from "@/lib/excel-utils";
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
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { LineItem } from "./LineItemsEditor";

interface ParsedLineItem {
  description: string;
  quantity: number;
  rate: number;
  discountPercent: number;
  amount: number;
  sku: string;
  serialNumbers: string;
  unit: string;
}

interface ExcelLineItemsUploadProps {
  onImport: (items: LineItem[]) => void;
  trigger?: React.ReactNode;
}

export function ExcelLineItemsUpload({ onImport, trigger }: ExcelLineItemsUploadProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parsedItems, setParsedItems] = useState<ParsedLineItem[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setErrors([]);
    setParsedItems([]);
    setIsParsing(true);

    try {
      const jsonData = await parseExcelFile(selectedFile);

      const items: ParsedLineItem[] = [];
      const parseErrors: string[] = [];

      jsonData.forEach((row: any, index: number) => {
        const rowNum = index + 2; // +2 for 1-indexed and header row

        // Parse description (required)
        const description = String(
          row.description || 
          row.Description || 
          row["Description of Goods"] || 
          row.DESCRIPTION || 
          row.product || 
          row.Product ||
          ""
        ).trim().slice(0, 500);

        if (!description) {
          parseErrors.push(`Row ${rowNum}: Missing description`);
          return;
        }

        // Parse quantity
        const quantity = parseFloat(
          row.quantity || row.Quantity || row.QUANTITY || row.qty || row.Qty || 1
        );
        if (isNaN(quantity) || quantity <= 0) {
          parseErrors.push(`Row ${rowNum}: Invalid quantity for "${description.slice(0, 30)}..."`);
          return;
        }

        // Parse rate
        const rate = parseFloat(
          row.rate || row.Rate || row.RATE || row.price || row.Price || 0
        );
        if (isNaN(rate) || rate < 0) {
          parseErrors.push(`Row ${rowNum}: Invalid rate for "${description.slice(0, 30)}..."`);
          return;
        }

        // Parse discount
        const discountPercent = parseFloat(
          row.discount || row.Discount || row.DISCOUNT || row["Discount %"] || row.discountPercent || 0
        );

        // Parse unit
        const unit = String(
          row.unit || row.Unit || row.UNIT || row.per || row.Per || "NOS"
        ).trim().slice(0, 20);

        // Parse SKU
        const sku = String(
          row.sku || row.SKU || row["Product SKU"] || row["SKU Number"] || row.sku_number || ""
        ).trim().slice(0, 50);

        // Parse serial numbers - can be comma separated or newline separated
        const serialNumbers = String(
          row.serialNumbers || 
          row["Serial Numbers"] || 
          row["Product Serial Number"] || 
          row.serial_numbers ||
          row["S/NO"] ||
          ""
        ).trim().slice(0, 2000);

        // Calculate amount
        const grossAmount = quantity * rate;
        const discountAmount = (grossAmount * discountPercent) / 100;
        const amount = grossAmount - discountAmount;

        items.push({
          description,
          quantity,
          rate,
          discountPercent: isNaN(discountPercent) ? 0 : discountPercent,
          amount,
          sku,
          serialNumbers,
          unit,
        });
      });

      setParsedItems(items);
      setErrors(parseErrors);
    } catch (error) {
      console.error("Error parsing Excel file:", error);
      setErrors(["Failed to parse Excel file. Please ensure it's a valid .xlsx or .xls file."]);
    } finally {
      setIsParsing(false);
    }
  };

  const handleImport = () => {
    if (parsedItems.length === 0) {
      toast.error("No valid items to import");
      return;
    }

    // Convert parsed items to LineItem format
    const lineItems: LineItem[] = parsedItems.map((item, index) => {
      const gstPercent = 18; // Default GST for Excel imports
      const gstAmount = Math.round((item.amount * gstPercent) / 100 * 100) / 100;
      return {
        id: crypto.randomUUID(),
        slNo: index + 1,
        brand: "", // Excel import doesn't have brand
        description: item.sku ? `${item.description} (SKU: ${item.sku})` : item.description,
        serialNumbers: item.serialNumbers,
        quantity: item.quantity,
        unit: item.unit,
        rate: item.rate,
        discountPercent: item.discountPercent,
        amount: item.amount,
        productImage: "", // Excel import doesn't have image
        gstPercent: gstPercent,
        gstAmount: gstAmount,
      };
    });

    onImport(lineItems);
    toast.success(`Successfully imported ${lineItems.length} line items`);
    setOpen(false);
    resetState();
  };

  const resetState = () => {
    setFile(null);
    setParsedItems([]);
    setErrors([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const downloadTemplate = async () => {
    const template = [
      {
        "Description of Goods": "CP PLUS ILLUMAX DOME CAMERA CP-URC-DC24PL3C-L",
        "Quantity": 60,
        "Rate": 1060.00,
        "Discount": 11,
        "Amount": 56604.00,
        "Product SKU": "CP-URC-DC24PL3C-L",
        "Product Serial Number": "4WWB,4QXF,ETPP,77GV,QFGY,XYXR,8JQ9,YRSE",
        "Unit": "NOS"
      },
      {
        "Description of Goods": "CP PLUS ILLUMAX BULLET CAMERA CP-URC-TC24P3C-L",
        "Quantity": 160,
        "Rate": 1120.00,
        "Discount": 11,
        "Amount": 159488.00,
        "Product SKU": "CP-URC-TC24P3C-L",
        "Product Serial Number": "1NVXYYUYSI3BZJ2N,2CD2,26TP4UQK,9Y3LCS3",
        "Unit": "NOS"
      },
    ];

    await downloadExcelTemplate(
      template,
      "invoice_line_items_template.xlsx",
      "Invoice Items",
      [50, 12, 12, 10, 15, 20, 50, 8]
    );
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) resetState();
    }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Upload className="h-4 w-4" />
            Import Excel
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Import Invoice Line Items from Excel
          </DialogTitle>
          <DialogDescription>
            Upload an Excel file with invoice line items. Required: Description, Quantity, Rate. 
            Optional: Discount, Product SKU, Serial Numbers, Unit.
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
              disabled={isParsing}
            />
          </div>

          {isParsing && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Parsing Excel file...</span>
            </div>
          )}

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

          {parsedItems.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="font-medium">{parsedItems.length} items ready to import</span>
              </div>
              <ScrollArea className="h-[300px] border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Rate (₹)</TableHead>
                      <TableHead className="text-right">Disc %</TableHead>
                      <TableHead className="text-right">Amount (₹)</TableHead>
                      <TableHead>Serial Numbers</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedItems.slice(0, 50).map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-mono text-xs">{index + 1}</TableCell>
                        <TableCell className="font-medium max-w-[200px] truncate" title={item.description}>
                          {item.description}
                        </TableCell>
                        <TableCell>
                          {item.sku ? (
                            <Badge variant="outline" className="font-mono text-xs">
                              {item.sku}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">{item.quantity} {item.unit}</TableCell>
                        <TableCell className="text-right">{item.rate.toFixed(2)}</TableCell>
                        <TableCell className="text-right">{item.discountPercent}%</TableCell>
                        <TableCell className="text-right font-semibold">{item.amount.toFixed(2)}</TableCell>
                        <TableCell className="max-w-[150px] truncate font-mono text-xs" title={item.serialNumbers}>
                          {item.serialNumbers || "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {parsedItems.length > 50 && (
                  <div className="p-2 text-center text-sm text-muted-foreground">
                    ...and {parsedItems.length - 50} more items
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
            onClick={handleImport}
            disabled={parsedItems.length === 0 || isParsing}
            className="gap-2"
          >
            <Upload className="h-4 w-4" />
            Import {parsedItems.length} Items
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

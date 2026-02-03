import { InvoiceItem } from "@/types/invoice";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { ImageIcon } from "lucide-react";

interface InvoiceTableProps {
  items: InvoiceItem[];
}

export function InvoiceTable({ items }: InvoiceTableProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Reverse-calculate GST from inclusive price
  const calculateTaxBreakup = (inclusivePrice: number, gstPercent: number) => {
    const basePrice = (inclusivePrice * 100) / (100 + gstPercent);
    const gstAmount = inclusivePrice - basePrice;
    return { basePrice, gstAmount };
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-100 border-none">
            <TableHead className="w-12 text-center py-2 text-gray-700 text-xs font-semibold uppercase">Sl No.</TableHead>
            <TableHead className="py-2 text-gray-700 text-xs font-semibold uppercase">Image</TableHead>
            <TableHead className="min-w-[180px] py-2 text-gray-700 text-xs font-semibold uppercase">Product</TableHead>
            <TableHead className="text-center py-2 w-16 text-gray-700 text-xs font-semibold uppercase">Qty</TableHead>
            <TableHead className="text-right py-2 w-28 text-gray-700 text-xs font-semibold uppercase">Base Price</TableHead>
            <TableHead className="text-right py-2 w-20 text-gray-700 text-xs font-semibold uppercase">GST %</TableHead>
            <TableHead className="text-right py-2 w-28 text-gray-700 text-xs font-semibold uppercase">GST Amt</TableHead>
            <TableHead className="text-right py-2 w-28 text-gray-700 text-xs font-semibold uppercase">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item, index) => {
            const gstPercent = item.gstPercent ?? 18;
            const inclusiveUnitPrice = item.rate;
            const { basePrice: baseUnitPrice, gstAmount: gstPerUnit } = calculateTaxBreakup(inclusiveUnitPrice, gstPercent);
            const totalBasePrice = baseUnitPrice * item.quantity;
            const totalGstAmount = gstPerUnit * item.quantity;
            const totalInclusive = item.quantity * inclusiveUnitPrice;

            return (
              <TableRow 
                key={item.id} 
                className="border-b border-gray-200 hover:bg-gray-50"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <TableCell className="text-center font-medium py-2">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-gray-800 text-xs font-semibold">
                    {item.slNo}
                  </span>
                </TableCell>
                <TableCell className="py-2">
                  {item.productImage ? (
                    <HoverCard openDelay={200} closeDelay={100}>
                      <HoverCardTrigger asChild>
                        <div className="relative w-14 h-14 cursor-pointer group">
                          <img 
                            src={item.productImage} 
                            alt={item.brand || item.description}
                            className="w-full h-full object-cover rounded-md border border-gray-200 shadow-sm"
                          />
                        </div>
                      </HoverCardTrigger>
                      <HoverCardContent side="right" className="w-auto p-2 no-print">
                        <img 
                          src={item.productImage} 
                          alt={item.brand || item.description}
                          className="max-w-[200px] max-h-[200px] object-contain rounded-md"
                        />
                        <p className="text-xs text-muted-foreground mt-2 text-center max-w-[200px] truncate">
                          {item.brand || item.description}
                        </p>
                      </HoverCardContent>
                    </HoverCard>
                  ) : (
                    <div className="w-14 h-14 flex items-center justify-center bg-gray-100 rounded-md border border-gray-300">
                      <ImageIcon className="w-5 h-5 text-gray-400" />
                    </div>
                  )}
                </TableCell>
                <TableCell className="py-2">
                  <div className="space-y-0.5">
                    <p className="font-semibold text-black text-sm">{item.brand || "Unnamed Product"}</p>
                    {item.description && item.description !== item.brand && (
                      <p className="text-xs text-gray-600">{item.description}</p>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-center py-2">
                  <span className="font-semibold text-black text-sm font-mono">{item.quantity}</span>
                  <span className="text-gray-600 text-xs ml-1">{item.unit}</span>
                </TableCell>
                <TableCell className="text-right py-2 font-medium text-black text-sm font-mono">
                  {formatCurrency(totalBasePrice)}
                </TableCell>
                <TableCell className="text-right py-2 font-medium text-gray-600 text-sm font-mono">
                  {gstPercent}%
                </TableCell>
                <TableCell className="text-right py-2 font-medium text-black text-sm font-mono">
                  {formatCurrency(totalGstAmount)}
                </TableCell>
                <TableCell className="text-right py-2 font-semibold text-black text-sm font-mono">
                  {formatCurrency(totalInclusive)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

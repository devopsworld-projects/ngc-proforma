import { InvoiceItem } from "@/types/invoice";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

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

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="invoice-table-header border-none">
            <TableHead className="w-16 text-center py-4">Sl No.</TableHead>
            <TableHead className="min-w-[300px] py-4">Description of Goods</TableHead>
            <TableHead className="text-right py-4">Quantity</TableHead>
            <TableHead className="text-right py-4">Rate</TableHead>
            <TableHead className="text-center py-4">Disc. %</TableHead>
            <TableHead className="text-right py-4">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item, index) => (
            <TableRow 
              key={item.id} 
              className="invoice-table-row"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <TableCell className="text-center font-medium py-6">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/5 text-primary text-sm font-semibold">
                  {item.slNo}
                </span>
              </TableCell>
              <TableCell className="py-6">
                <div className="space-y-2">
                  <p className="font-medium text-foreground">{item.description}</p>
                  {item.serialNumbers && item.serialNumbers.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      <span className="text-xs text-invoice-muted">S/NO: </span>
                      {item.serialNumbers.slice(0, 5).map((sn, i) => (
                        <Badge key={i} variant="secondary" className="text-xs font-mono">
                          {sn}
                        </Badge>
                      ))}
                      {item.serialNumbers.length > 5 && (
                        <Badge variant="outline" className="text-xs">
                          +{item.serialNumbers.length - 5} more
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right py-6">
                <span className="font-semibold">{item.quantity.toFixed(3)}</span>
                <span className="text-invoice-muted text-xs ml-1">{item.unit}</span>
              </TableCell>
              <TableCell className="text-right py-6 font-medium">
                {formatCurrency(item.rate)}
              </TableCell>
              <TableCell className="text-center py-6">
                <Badge variant="outline" className="font-mono">
                  {item.discountPercent}%
                </Badge>
              </TableCell>
              <TableCell className="text-right py-6">
                <span className="font-semibold text-lg">{formatCurrency(item.amount)}</span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

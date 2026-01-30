import { InvoiceItem } from "@/types/invoice";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
            <TableHead className="w-32 py-4">Brand</TableHead>
            <TableHead className="min-w-[250px] py-4">Description</TableHead>
            <TableHead className="text-center py-4 w-20">Qty</TableHead>
            <TableHead className="text-right py-4 w-28">Unit Price</TableHead>
            <TableHead className="text-center py-4 w-24">Product Image</TableHead>
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
                <span className="font-medium text-foreground">{item.brand || "-"}</span>
              </TableCell>
              <TableCell className="py-6">
                <p className="font-medium text-foreground">{item.description}</p>
              </TableCell>
              <TableCell className="text-center py-6">
                <span className="font-semibold">{item.quantity}</span>
                <span className="text-invoice-muted text-xs ml-1">{item.unit}</span>
              </TableCell>
              <TableCell className="text-right py-6 font-medium">
                {formatCurrency(item.rate)}
              </TableCell>
              <TableCell className="text-center py-6">
                {item.productImage ? (
                  <img 
                    src={item.productImage} 
                    alt={item.description}
                    className="w-12 h-12 object-cover rounded mx-auto"
                  />
                ) : (
                  <span className="text-muted-foreground text-xs">-</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

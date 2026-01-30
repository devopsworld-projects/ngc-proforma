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
          <TableRow className="bg-gray-100 border-none">
            <TableHead className="w-12 text-center py-2 text-gray-700 text-xs font-semibold uppercase">Sl No.</TableHead>
            <TableHead className="w-28 py-2 text-gray-700 text-xs font-semibold uppercase">Brand</TableHead>
            <TableHead className="min-w-[200px] py-2 text-gray-700 text-xs font-semibold uppercase">Description</TableHead>
            <TableHead className="text-center py-2 w-16 text-gray-700 text-xs font-semibold uppercase">Qty</TableHead>
            <TableHead className="text-right py-2 w-24 text-gray-700 text-xs font-semibold uppercase">Unit Price</TableHead>
            <TableHead className="text-center py-2 w-20 text-gray-700 text-xs font-semibold uppercase">Image</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item, index) => (
            <TableRow 
              key={item.id} 
              className="border-b border-gray-200 hover:bg-gray-50"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <TableCell className="text-center font-medium py-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/5 text-primary text-xs font-semibold">
                  {item.slNo}
                </span>
              </TableCell>
              <TableCell className="py-2">
                <span className="font-medium text-black text-sm">{item.brand || "-"}</span>
              </TableCell>
              <TableCell className="py-2">
                <p className="font-medium text-black text-sm">{item.description}</p>
              </TableCell>
              <TableCell className="text-center py-2">
                <span className="font-semibold text-black text-sm">{item.quantity}</span>
                <span className="text-gray-600 text-xs ml-1">{item.unit}</span>
              </TableCell>
              <TableCell className="text-right py-2 font-medium text-black text-sm">
                {formatCurrency(item.rate)}
              </TableCell>
              <TableCell className="text-center py-2">
                {item.productImage ? (
                  <img 
                    src={item.productImage} 
                    alt={item.description}
                    className="w-10 h-10 object-cover rounded mx-auto"
                  />
                ) : (
                  <span className="text-gray-400 text-xs">-</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

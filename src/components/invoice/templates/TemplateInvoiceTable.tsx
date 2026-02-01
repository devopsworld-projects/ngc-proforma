import { InvoiceItem } from "@/types/invoice";
import { PdfTemplateSettings } from "@/hooks/usePdfTemplateSettings";
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

interface TemplateInvoiceTableProps {
  items: InvoiceItem[];
  settings: PdfTemplateSettings;
}

export function TemplateInvoiceTable({ items, settings }: TemplateInvoiceTableProps) {
  const s = settings;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Font size scale
  const fontScale = {
    small: 'text-xs',
    normal: 'text-sm',
    large: 'text-base',
  };
  const bodyFont = fontScale[s.font_size_scale] || fontScale.normal;

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow 
            className="border-none"
            style={{ backgroundColor: s.table_header_bg }}
          >
            <TableHead 
              className="w-12 text-center py-2 text-xs font-semibold uppercase"
              style={{ color: s.table_header_text }}
            >
              Sl No.
            </TableHead>
            {s.show_brand_column && (
              <TableHead 
                className="w-28 py-2 text-xs font-semibold uppercase"
                style={{ color: s.table_header_text }}
              >
                Brand
              </TableHead>
            )}
            <TableHead 
              className="min-w-[200px] py-2 text-xs font-semibold uppercase"
              style={{ color: s.table_header_text }}
            >
              Description
            </TableHead>
            <TableHead 
              className="text-center py-2 w-16 text-xs font-semibold uppercase"
              style={{ color: s.table_header_text }}
            >
              Qty
            </TableHead>
            {s.show_unit_column && (
              <TableHead 
                className="text-center py-2 w-16 text-xs font-semibold uppercase"
                style={{ color: s.table_header_text }}
              >
                Unit
              </TableHead>
            )}
            <TableHead 
              className="text-right py-2 w-24 text-xs font-semibold uppercase"
              style={{ color: s.table_header_text }}
            >
              Unit Price
            </TableHead>
            {s.show_image_column && (
              <TableHead 
                className="text-center py-2 w-24 text-xs font-semibold uppercase"
                style={{ color: s.table_header_text }}
              >
                Image
              </TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item, index) => (
            <TableRow 
              key={item.id} 
              className="border-b border-gray-200 hover:bg-gray-50"
              style={{ 
                animationDelay: `${index * 0.05}s`,
                color: s.table_text_color
              }}
            >
              <TableCell className="text-center font-medium py-2">
                <span 
                  className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold"
                  style={{ 
                    backgroundColor: s.table_header_bg,
                    color: s.table_text_color
                  }}
                >
                  {item.slNo}
                </span>
              </TableCell>
              {s.show_brand_column && (
                <TableCell className="py-2">
                  <span className={`font-medium ${bodyFont}`}>{item.brand || "-"}</span>
                </TableCell>
              )}
              <TableCell className="py-2">
                <p className={`font-medium ${bodyFont}`}>{item.description}</p>
                {s.show_serial_numbers && item.serialNumbers && item.serialNumbers.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    S/N: {item.serialNumbers.join(", ")}
                  </p>
                )}
              </TableCell>
              <TableCell className="text-center py-2">
                <span 
                  className={`font-semibold ${bodyFont}`}
                  style={{ fontFamily: `'${s.font_mono}', monospace` }}
                >
                  {item.quantity}
                </span>
              </TableCell>
              {s.show_unit_column && (
                <TableCell className="text-center py-2">
                  <span className="text-xs text-gray-600">{item.unit}</span>
                </TableCell>
              )}
              <TableCell 
                className={`text-right py-2 font-medium ${bodyFont}`}
                style={{ fontFamily: `'${s.font_mono}', monospace` }}
              >
                {formatCurrency(item.rate)}
              </TableCell>
              {s.show_image_column && (
                <TableCell className="text-center py-2">
                  {item.productImage ? (
                    <HoverCard openDelay={200} closeDelay={100}>
                      <HoverCardTrigger asChild>
                        <div className="relative w-14 h-14 mx-auto cursor-pointer group">
                          <img 
                            src={item.productImage} 
                            alt={item.description}
                            className="w-full h-full object-cover rounded-md border border-gray-200 shadow-sm"
                          />
                        </div>
                      </HoverCardTrigger>
                      <HoverCardContent side="left" className="w-auto p-2 no-print">
                        <img 
                          src={item.productImage} 
                          alt={item.description}
                          className="max-w-[200px] max-h-[200px] object-contain rounded-md"
                        />
                        <p className="text-xs text-muted-foreground mt-2 text-center max-w-[200px] truncate">
                          {item.description}
                        </p>
                      </HoverCardContent>
                    </HoverCard>
                  ) : (
                    <div className="w-14 h-14 mx-auto flex items-center justify-center bg-gray-100 rounded-md border border-gray-300">
                      <ImageIcon className="w-5 h-5 text-gray-400" />
                    </div>
                  )}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

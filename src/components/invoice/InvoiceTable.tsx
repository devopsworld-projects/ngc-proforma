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
import { formatCurrency, calculateGstBreakup, roundToTwo } from "@/lib/invoice-utils";

interface InvoiceTableProps {
  items: InvoiceItem[];
  settings?: {
    table_header_bg: string;
    table_header_text: string;
    table_text_color: string;
    show_image_column: boolean;
    show_brand_column: boolean;
    show_unit_column: boolean;
    show_serial_numbers: boolean;
    show_discount_column: boolean;
    show_gst?: boolean;
    table_row_padding?: string;
    border_style?: string;
    table_border_color?: string;
  };
}

// Map spacing values to CSS classes
const getRowPaddingClass = (padding?: string) => {
  switch (padding) {
    case "compact": return "py-1";
    case "relaxed": return "py-3";
    default: return "py-2";
  }
};

const getBorderClass = (style?: string) => {
  switch (style) {
    case "none": return "border-0";
    case "medium": return "border-b-2";
    case "bold": return "border-b-2 border-gray-400";
    default: return "border-b";
  }
};

export function InvoiceTable({ items, settings }: InvoiceTableProps) {
  const tableHeaderBg = settings?.table_header_bg || "#f3f4f6";
  const tableHeaderText = settings?.table_header_text || "#374151";
  const tableTextColor = settings?.table_text_color || "#1f2937";
  const showImageColumn = settings?.show_image_column ?? true;
  const showBrandColumn = settings?.show_brand_column ?? true;
  const showUnitColumn = settings?.show_unit_column ?? true;
  const showGst = settings?.show_gst ?? true;
  const rowPaddingClass = getRowPaddingClass(settings?.table_row_padding);
  const borderClass = getBorderClass(settings?.border_style);
  const borderColor = settings?.table_border_color || "#e5e7eb";

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow 
            className="border-none"
            style={{ backgroundColor: tableHeaderBg }}
          >
            <TableHead 
              className="w-12 text-center py-2 text-xs font-semibold uppercase"
              style={{ color: tableHeaderText }}
            >
              Sl No.
            </TableHead>
            {showImageColumn && (
              <TableHead 
                className="py-2 text-xs font-semibold uppercase"
                style={{ color: tableHeaderText }}
              >
                Image
              </TableHead>
            )}
            <TableHead 
              className="min-w-[180px] py-2 text-xs font-semibold uppercase"
              style={{ color: tableHeaderText }}
            >
              {showBrandColumn ? "Product" : "Description"}
            </TableHead>
            <TableHead 
              className="text-center py-2 w-16 text-xs font-semibold uppercase"
              style={{ color: tableHeaderText }}
            >
              Qty{showUnitColumn ? "" : ""}
            </TableHead>
            <TableHead 
              className="text-right py-2 w-28 text-xs font-semibold uppercase"
              style={{ color: tableHeaderText }}
            >
              {showGst ? "Base Price" : "Unit Price"}
            </TableHead>
            {showGst && (
              <TableHead 
                className="text-right py-2 w-20 text-xs font-semibold uppercase"
                style={{ color: tableHeaderText }}
              >
                GST %
              </TableHead>
            )}
            {showGst && (
              <TableHead 
                className="text-right py-2 w-28 text-xs font-semibold uppercase"
                style={{ color: tableHeaderText }}
              >
                GST Amt
              </TableHead>
            )}
            <TableHead 
              className="text-right py-2 w-28 text-xs font-semibold uppercase"
              style={{ color: tableHeaderText }}
            >
              Total
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody style={{ color: tableTextColor }}>
        {items.map((item, index) => {
            const gstPercent = item.gstPercent ?? 18;
            const inclusiveUnitPrice = item.rate;
            const { basePrice: baseUnitPrice, gstAmount: gstPerUnit } = calculateGstBreakup(inclusiveUnitPrice, gstPercent);
            // Apply rounding only at display time
            const totalBasePrice = roundToTwo(baseUnitPrice * item.quantity);
            const totalGstAmount = roundToTwo(gstPerUnit * item.quantity);
            const totalInclusive = roundToTwo(item.quantity * inclusiveUnitPrice);

            return (
              <TableRow 
                key={item.id} 
                className={`${borderClass} hover:bg-gray-50`}
                style={{ 
                  animationDelay: `${index * 0.05}s`,
                  borderColor: borderColor,
                }}
              >
                <TableCell className={`text-center font-medium ${rowPaddingClass}`}>
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-xs font-semibold" style={{ color: tableTextColor }}>
                    {item.slNo}
                  </span>
                </TableCell>
                {showImageColumn && (
                  <TableCell className={rowPaddingClass}>
                    {item.productImage ? (
                      <HoverCard openDelay={200} closeDelay={100}>
                        <HoverCardTrigger asChild>
                          <div className="relative w-12 h-12 cursor-pointer group">
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
                      <div className="w-12 h-12 flex items-center justify-center bg-gray-100 rounded-md border border-gray-300">
                        <ImageIcon className="w-4 h-4 text-gray-400" />
                      </div>
                    )}
                  </TableCell>
                )}
                <TableCell className={rowPaddingClass}>
                  <div className="space-y-0.5">
                    {showBrandColumn && (
                      <p className="font-semibold text-sm" style={{ color: tableTextColor }}>{item.brand || "Unnamed Product"}</p>
                    )}
                    {item.description && (!showBrandColumn || item.description !== item.brand) && (
                      <p className="text-xs opacity-70">{item.description}</p>
                    )}
                  </div>
                </TableCell>
                <TableCell className={`text-center ${rowPaddingClass}`}>
                  <span className="font-semibold text-sm font-mono" style={{ color: tableTextColor }}>{item.quantity}</span>
                  {showUnitColumn && <span className="text-xs ml-1 opacity-70">{item.unit}</span>}
                  {item.sizeLabel && (
                    <div className="text-[10px] opacity-50 mt-0.5">({item.sizeLabel})</div>
                  )}
                </TableCell>
                <TableCell className={`text-right ${rowPaddingClass} font-medium text-sm font-mono`} style={{ color: tableTextColor }}>
                  {showGst ? formatCurrency(totalBasePrice) : formatCurrency(inclusiveUnitPrice)}
                </TableCell>
                {showGst && (
                  <TableCell className={`text-right ${rowPaddingClass} font-medium text-sm font-mono opacity-70`}>
                    {gstPercent}%
                  </TableCell>
                )}
                {showGst && (
                  <TableCell className={`text-right ${rowPaddingClass} font-medium text-sm font-mono`} style={{ color: tableTextColor }}>
                    {formatCurrency(totalGstAmount)}
                  </TableCell>
                )}
                <TableCell className={`text-right ${rowPaddingClass} font-semibold text-sm font-mono`} style={{ color: tableTextColor }}>
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

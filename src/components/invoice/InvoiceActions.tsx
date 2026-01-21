import { Button } from "@/components/ui/button";
import { Printer, Download, Share2 } from "lucide-react";

interface InvoiceActionsProps {
  onPrint?: () => void;
  onDownload?: () => void;
  onShare?: () => void;
}

export function InvoiceActions({ onPrint, onDownload, onShare }: InvoiceActionsProps) {
  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  return (
    <div className="no-print flex flex-wrap gap-3 mb-6 justify-center lg:justify-end">
      <Button
        variant="outline"
        size="sm"
        onClick={handlePrint}
        className="gap-2"
      >
        <Printer className="w-4 h-4" />
        Print Invoice
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onDownload}
        className="gap-2"
      >
        <Download className="w-4 h-4" />
        Download PDF
      </Button>
      <Button
        size="sm"
        onClick={onShare}
        className="gap-2 gradient-gold text-primary border-0"
      >
        <Share2 className="w-4 h-4" />
        Share
      </Button>
    </div>
  );
}

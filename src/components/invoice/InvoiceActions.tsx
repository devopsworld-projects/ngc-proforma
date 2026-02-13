import { Button } from "@/components/ui/button";
import { Download, Share2 } from "lucide-react";

interface InvoiceActionsProps {
  onDownload?: () => void;
  onShare?: () => void;
}

export function InvoiceActions({ onDownload, onShare }: InvoiceActionsProps) {
  return (
    <div className="no-print flex flex-wrap gap-3 mb-6 justify-center lg:justify-end">
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

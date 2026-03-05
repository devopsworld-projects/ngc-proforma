import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Info, Package, Users, FileText, Archive } from "lucide-react";
import { useDataQualityScanner, ScanFinding } from "@/hooks/useDataQualityScanner";

const POPUP_ICONS: Record<string, React.ReactNode> = {
  uncategorized_products: <Package className="h-5 w-5" />,
  missing_sku: <Package className="h-5 w-5" />,
  zero_stock: <Archive className="h-5 w-5" />,
  incomplete_customers: <Users className="h-5 w-5" />,
  missing_address: <Users className="h-5 w-5" />,
  draft_proformas: <FileText className="h-5 w-5" />,
  stale_drafts: <FileText className="h-5 w-5" />,
};

export function DataQualityAgent() {
  const { findings } = useDataQualityScanner();
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  const activeFinding: ScanFinding | null =
    !dismissed && findings.length > 0 && currentIndex < findings.length
      ? findings[currentIndex]
      : null;

  const remaining = findings.length - currentIndex - 1;

  const handleDismiss = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < findings.length) {
      setCurrentIndex(nextIndex);
    } else {
      setDismissed(true);
    }
  };

  const handleAction = () => {
    const route = activeFinding?.navigateTo || "/";
    handleDismiss();
    navigate(route);
  };

  if (!activeFinding) return null;

  const isWarning = activeFinding.severity === "warning";
  const IconComponent = isWarning ? AlertTriangle : Info;

  return (
    <AlertDialog open={!!activeFinding} onOpenChange={(open) => !open && handleDismiss()}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full ${
                isWarning
                  ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
                  : "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
              }`}
            >
              {POPUP_ICONS[activeFinding.popup_key] || <IconComponent className="h-5 w-5" />}
            </div>
            <div className="flex-1">
              <AlertDialogTitle className="text-lg flex items-center gap-2">
                {activeFinding.title}
                <Badge
                  variant={isWarning ? "destructive" : "secondary"}
                  className="text-[10px] px-1.5 py-0"
                >
                  {activeFinding.count}
                </Badge>
              </AlertDialogTitle>
            </div>
          </div>
          <AlertDialogDescription className="pt-2 space-y-2">
            <span>{activeFinding.message}</span>
            <span className="block font-semibold text-foreground">
              {activeFinding.count} record{activeFinding.count > 1 ? "s" : ""} need
              {activeFinding.count === 1 ? "s" : ""} attention.
            </span>
            {remaining > 0 && (
              <span className="block text-xs text-muted-foreground">
                +{remaining} more issue{remaining > 1 ? "s" : ""} detected
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleDismiss}>
            {remaining > 0 ? "Next Issue" : "Dismiss"}
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleAction}>Take Action</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

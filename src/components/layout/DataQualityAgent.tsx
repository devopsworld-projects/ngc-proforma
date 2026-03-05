import { useState, useEffect, useCallback } from "react";
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
import { Button } from "@/components/ui/button";
import { AlertTriangle, Info, Package, Users, FileText, Archive, Clock, HandHeart } from "lucide-react";
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

const SNOOZE_OPTIONS = [
  { label: "30 minutes", ms: 30 * 60 * 1000 },
  { label: "1 hour", ms: 60 * 60 * 1000 },
  { label: "4 hours", ms: 4 * 60 * 60 * 1000 },
  { label: "Tomorrow", ms: 24 * 60 * 60 * 1000 },
];

const DISMISS_COUNT_KEY = "dqa_dismiss_count";
const SNOOZE_UNTIL_KEY = "dqa_snooze_until";

function getDismissCount(): number {
  return parseInt(localStorage.getItem(DISMISS_COUNT_KEY) || "0", 10);
}

function incrementDismissCount(): number {
  const count = getDismissCount() + 1;
  localStorage.setItem(DISMISS_COUNT_KEY, String(count));
  return count;
}

function resetDismissCount() {
  localStorage.setItem(DISMISS_COUNT_KEY, "0");
}

function getSnoozeUntil(): number {
  return parseInt(localStorage.getItem(SNOOZE_UNTIL_KEY) || "0", 10);
}

function setSnoozeUntil(timestamp: number) {
  localStorage.setItem(SNOOZE_UNTIL_KEY, String(timestamp));
}

export function DataQualityAgent() {
  const { findings } = useDataQualityScanner();
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [showCooperateDialog, setShowCooperateDialog] = useState(false);
  const [snoozed, setSnoozed] = useState(false);

  // Check if currently snoozed
  useEffect(() => {
    const snoozeUntil = getSnoozeUntil();
    if (snoozeUntil > Date.now()) {
      setSnoozed(true);
      const timeout = setTimeout(() => {
        setSnoozed(false);
        resetDismissCount();
      }, snoozeUntil - Date.now());
      return () => clearTimeout(timeout);
    }
  }, []);

  const activeFinding: ScanFinding | null =
    !dismissed && !snoozed && findings.length > 0 && currentIndex < findings.length
      ? findings[currentIndex]
      : null;

  const remaining = findings.length - currentIndex - 1;

  const handleDismiss = useCallback(() => {
    const count = incrementDismissCount();

    if (count >= 5) {
      setShowCooperateDialog(true);
      return;
    }

    const nextIndex = currentIndex + 1;
    if (nextIndex < findings.length) {
      setCurrentIndex(nextIndex);
    } else {
      setDismissed(true);
    }
  }, [currentIndex, findings.length]);

  const handleAction = () => {
    const route = activeFinding?.navigateTo || "/";
    resetDismissCount();
    const nextIndex = currentIndex + 1;
    if (nextIndex < findings.length) {
      setCurrentIndex(nextIndex);
    } else {
      setDismissed(true);
    }
    navigate(route);
  };

  const handleSnooze = (ms: number) => {
    const until = Date.now() + ms;
    setSnoozeUntil(until);
    resetDismissCount();
    setSnoozed(true);
    setShowCooperateDialog(false);
    setDismissed(true);
  };

  const handleCooperateAction = () => {
    resetDismissCount();
    setShowCooperateDialog(false);
    // Navigate to the current finding
    if (activeFinding) {
      navigate(activeFinding.navigateTo);
    }
    setDismissed(true);
  };

  // Cooperate dialog — shown after 5 dismissals
  if (showCooperateDialog) {
    return (
      <AlertDialog open onOpenChange={(open) => !open && setShowCooperateDialog(false)}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <HandHeart className="h-6 w-6 text-primary" />
              </div>
              <AlertDialogTitle className="text-lg">
                Kindly Cooperate 🙏
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="pt-3 space-y-3">
              <span className="block text-base">
                Kindly cooperate to maintain the application organized. Keeping your data clean helps everyone work efficiently.
              </span>
              <span className="block font-medium text-foreground">
                When would you like to be reminded?
              </span>
              <div className="grid grid-cols-2 gap-2 pt-1">
                {SNOOZE_OPTIONS.map((option) => (
                  <Button
                    key={option.label}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={() => handleSnooze(option.ms)}
                  >
                    <Clock className="h-3.5 w-3.5" />
                    {option.label}
                  </Button>
                ))}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-2">
            <AlertDialogAction onClick={handleCooperateAction}>
              I'll Fix It Now
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

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

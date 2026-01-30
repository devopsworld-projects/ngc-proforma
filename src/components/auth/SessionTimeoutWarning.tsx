import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Clock } from "lucide-react";

interface SessionTimeoutWarningProps {
  open: boolean;
  remainingSeconds: number;
  onContinue: () => void;
}

export function SessionTimeoutWarning({
  open,
  remainingSeconds,
  onContinue,
}: SessionTimeoutWarningProps) {
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const timeDisplay = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/30">
            <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
          </div>
          <AlertDialogTitle className="text-center">
            Session Timeout Warning
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center space-y-2">
            <p>
              Your session will expire due to inactivity.
            </p>
            <p className="text-2xl font-bold text-foreground">
              {timeDisplay}
            </p>
            <p className="text-sm">
              Click below to continue your session.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="sm:justify-center">
          <AlertDialogAction onClick={onContinue}>
            Continue Session
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SessionActivityIndicatorProps {
  totalRemainingSeconds: number;
  timeoutMinutes: number;
}

export function SessionActivityIndicator({
  totalRemainingSeconds,
  timeoutMinutes,
}: SessionActivityIndicatorProps) {
  const totalSeconds = timeoutMinutes * 60;
  const percentage = (totalRemainingSeconds / totalSeconds) * 100;
  
  const minutes = Math.floor(totalRemainingSeconds / 60);
  const seconds = totalRemainingSeconds % 60;
  const timeDisplay = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  // Color based on remaining time
  const getColorClass = () => {
    if (percentage > 50) return "text-green-500";
    if (percentage > 25) return "text-yellow-500";
    return "text-red-500";
  };

  const getProgressColor = () => {
    if (percentage > 50) return "bg-green-500";
    if (percentage > 25) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="hidden sm:flex items-center gap-2 px-2 py-1 rounded-md bg-muted/50 cursor-default">
            <Clock className={cn("h-3.5 w-3.5", getColorClass())} />
            <div className="flex items-center gap-1.5">
              <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn("h-full transition-all duration-1000", getProgressColor())}
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className={cn("text-xs font-mono tabular-nums", getColorClass())}>
                {timeDisplay}
              </span>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p className="text-xs">
            Session expires in {minutes} min {seconds} sec
            <br />
            <span className="text-muted-foreground">Activity resets the timer</span>
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

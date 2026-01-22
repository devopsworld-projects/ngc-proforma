import { Check, X } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface PasswordStrengthIndicatorProps {
  password: string;
}

const requirements = [
  { label: "At least 6 characters", test: (p: string) => p.length >= 6 },
  { label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "One number", test: (p: string) => /[0-9]/.test(p) },
  { label: "One special character", test: (p: string) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
];

export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  const passedCount = requirements.filter((req) => req.test(password)).length;
  const strength = (passedCount / requirements.length) * 100;

  const getStrengthColor = () => {
    if (strength <= 25) return "bg-destructive";
    if (strength <= 50) return "bg-orange-500";
    if (strength <= 75) return "bg-yellow-500";
    return "bg-green-500";
  };

  if (!password) return null;

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Password strength</span>
          <span className={cn(
            "font-medium",
            strength <= 25 && "text-destructive",
            strength > 25 && strength <= 50 && "text-orange-500",
            strength > 50 && strength <= 75 && "text-yellow-500",
            strength > 75 && "text-green-500"
          )}>
            {strength <= 25 && "Weak"}
            {strength > 25 && strength <= 50 && "Fair"}
            {strength > 50 && strength <= 75 && "Good"}
            {strength > 75 && "Strong"}
          </span>
        </div>
        <Progress 
          value={strength} 
          className="h-1.5"
          indicatorClassName={getStrengthColor()}
        />
      </div>
      <ul className="space-y-1">
        {requirements.map((req, index) => {
          const passed = req.test(password);
          return (
            <li
              key={index}
              className={cn(
                "flex items-center gap-2 text-xs transition-colors",
                passed ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
              )}
            >
              {passed ? (
                <Check className="h-3 w-3" />
              ) : (
                <X className="h-3 w-3" />
              )}
              {req.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

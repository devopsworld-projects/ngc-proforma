import { Link } from "react-router-dom";
import { 
  PlusCircle, 
  Users, 
  Package, 
  FileText,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickAction {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  gradient: string;
  iconColor: string;
}

const quickActions: QuickAction[] = [
  {
    title: "New Quotation",
    description: "Generate a new proforma quotation",
    icon: PlusCircle,
    href: "/invoices/new",
    gradient: "from-emerald-500 to-teal-600",
    iconColor: "text-emerald-600 dark:text-emerald-400",
  },
  {
    title: "Add Customer",
    description: "Register a new customer",
    icon: Users,
    href: "/customers",
    gradient: "from-blue-500 to-indigo-600",
    iconColor: "text-blue-600 dark:text-blue-400",
  },
  {
    title: "Add Product",
    description: "Add a new product or service",
    icon: Package,
    href: "/products",
    gradient: "from-purple-500 to-pink-600",
    iconColor: "text-purple-600 dark:text-purple-400",
  },
  {
    title: "View Invoices",
    description: "Browse and manage invoices",
    icon: FileText,
    href: "/invoices",
    gradient: "from-orange-500 to-red-600",
    iconColor: "text-orange-600 dark:text-orange-400",
  },
];

export function QuickActionCards() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {quickActions.map((action) => {
        const Icon = action.icon;
        return (
          <Link
            key={action.title}
            to={action.href}
            className="group relative overflow-hidden rounded-2xl border bg-card p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
          >
            {/* Gradient background on hover */}
            <div className={cn(
              "absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300 bg-gradient-to-br",
              action.gradient
            )} />
            
            {/* Icon */}
            <div className={cn(
              "mb-4 inline-flex items-center justify-center rounded-xl p-3 bg-muted/50 transition-transform duration-300 group-hover:scale-110",
            )}>
              <Icon className={cn("h-6 w-6", action.iconColor)} />
            </div>
            
            {/* Content */}
            <h3 className="font-semibold text-foreground mb-1 flex items-center gap-2">
              {action.title}
              <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
            </h3>
            <p className="text-sm text-muted-foreground">
              {action.description}
            </p>
          </Link>
        );
      })}
    </div>
  );
}

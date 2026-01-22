import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { FileText, Users, LayoutDashboard, RefreshCcw, PlusCircle, BarChart3, Settings, Package } from "lucide-react";

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { path: "/", label: "Home", icon: FileText },
  { path: "/invoices/new", label: "Create Invoice", icon: PlusCircle },
  { path: "/customers", label: "Customers", icon: Users },
  { path: "/invoices", label: "All Invoices", icon: LayoutDashboard },
  { path: "/products", label: "Products", icon: Package },
  { path: "/recurring", label: "Recurring", icon: RefreshCcw },
  { path: "/settings", label: "Settings", icon: Settings },
];

export function AppNavigation() {
  const location = useLocation();

  return (
    <nav className="no-print border-b bg-card">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-1 overflow-x-auto py-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

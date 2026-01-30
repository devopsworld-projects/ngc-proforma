import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Users, LayoutDashboard, RefreshCcw, PlusCircle, BarChart3, Settings, Package, LogOut, Shield, UserCircle, Menu, X, ChevronDown, Globe } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useAdmin";
import { useSessionTimeoutContext } from "@/components/auth/SessionTimeoutProvider";
import { SessionActivityIndicator } from "@/components/auth/SessionActivityIndicator";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
const mainNavItems = [{
  path: "/dashboard",
  label: "Dashboard",
  icon: BarChart3
}];
const invoiceItems = [{
  path: "/invoices/new",
  label: "Create Proforma",
  icon: PlusCircle
}, {
  path: "/invoices",
  label: "All Proformas",
  icon: LayoutDashboard
}, {
  path: "/recurring",
  label: "Recurring",
  icon: RefreshCcw
}];
const managementItems = [{
  path: "/customers",
  label: "Customers",
  icon: Users
}, {
  path: "/products",
  label: "Products",
  icon: Package
}];
export function AppNavigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const {
    signOut,
    user
  } = useAuth();
  const {
    data: isAdmin
  } = useIsAdmin();
  const {
    totalRemainingSeconds,
    timeoutMinutes
  } = useSessionTimeoutContext();
  const handleLogout = async () => {
    await signOut();
    toast.success("Logged out successfully");
    navigate("/login");
  };
  const isActive = (path: string) => location.pathname === path;
  const isGroupActive = (items: typeof invoiceItems) => items.some(item => location.pathname === item.path);
  const NavLink = ({
    path,
    label,
    icon: Icon
  }: {
    path: string;
    label: string;
    icon: typeof BarChart3;
  }) => <Link to={path} onClick={() => setMobileMenuOpen(false)} className={cn("flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors", isActive(path) ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted")}>
      <Icon className="h-4 w-4" />
      {label}
    </Link>;
  const DropdownNavGroup = ({
    label,
    icon: Icon,
    items
  }: {
    label: string;
    icon: typeof BarChart3;
    items: typeof invoiceItems;
  }) => <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className={cn("flex items-center gap-2 px-3 py-2 h-auto text-sm font-medium", isGroupActive(items) ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted")}>
          <Icon className="h-4 w-4" />
          {label}
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48 bg-popover border shadow-lg z-50">
        {items.map(item => <DropdownMenuItem key={item.path} asChild>
            <Link to={item.path} className={cn("flex items-center gap-2 cursor-pointer", isActive(item.path) && "bg-accent")}>
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          </DropdownMenuItem>)}
      </DropdownMenuContent>
    </DropdownMenu>;
  return <nav className="no-print sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo / Brand */}
          <Link to="/dashboard" className="flex items-center gap-2 font-semibold text-lg">
            <Globe className="h-5 w-5 text-primary" />
            <span className="hidden sm:inline">Global Shope </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {mainNavItems.map(item => <NavLink key={item.path} {...item} />)}
            <DropdownNavGroup label="Proforma Invoice" icon={FileText} items={invoiceItems} />
            <DropdownNavGroup label="Management" icon={Package} items={managementItems} />
            {isAdmin && <NavLink path="/settings" label="Settings" icon={Settings} />}
            {isAdmin && <Link to="/admin" className={cn("flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors", isActive("/admin") ? "bg-amber-500 text-white" : "text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-900/20")}>
                <Shield className="h-4 w-4" />
                Admin
              </Link>}
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2">
            {/* Session Activity Indicator */}
            {user && totalRemainingSeconds > 0 && <SessionActivityIndicator totalRemainingSeconds={totalRemainingSeconds} timeoutMinutes={timeoutMinutes} />}
            
            <ThemeToggle />

            {/* User Menu - Desktop */}
            {user && <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="hidden md:flex gap-2">
                    <UserCircle className="h-4 w-4" />
                    <span className="max-w-[100px] truncate">{user.email?.split("@")[0]}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-popover border shadow-lg z-50">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">Account</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="cursor-pointer">
                      <UserCircle className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>}

            {/* Mobile Menu Button */}
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && <div className="md:hidden border-t bg-background">
          <div className="px-4 py-3 space-y-1">
            {mainNavItems.map(item => <NavLink key={item.path} {...item} />)}

            {/* Proforma Invoice Section */}
            <div className="pt-2">
              <p className="px-3 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Proforma Invoices
              </p>
              {invoiceItems.map(item => <NavLink key={item.path} {...item} />)}
            </div>

            {/* Management Section */}
            <div className="pt-2">
              <p className="px-3 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Management
              </p>
              {managementItems.map(item => <NavLink key={item.path} {...item} />)}
            </div>

            {/* System Section */}
            <div className="pt-2 border-t">
              {isAdmin && <NavLink path="/settings" label="Settings" icon={Settings} />}
              {isAdmin && <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className={cn("flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors", isActive("/admin") ? "bg-amber-500 text-white" : "text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-900/20")}>
                  <Shield className="h-4 w-4" />
                  Admin
                </Link>}
            </div>

            {/* User Section - Mobile */}
            {user && <div className="pt-2 border-t">
                <div className="px-3 py-2 text-sm text-muted-foreground truncate">{user.email}</div>
                <NavLink path="/profile" label="Profile" icon={UserCircle} />
                <button onClick={() => {
            setMobileMenuOpen(false);
            handleLogout();
          }} className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors">
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>}
          </div>
        </div>}
    </nav>;
}
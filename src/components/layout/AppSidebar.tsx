import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  Users, LayoutDashboard, RefreshCcw, PlusCircle, BarChart3, Settings, 
  Package, Shield, FileText, Boxes, LogOut, UserCircle, ChevronDown
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useAdmin";
import { toast } from "sonner";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { path: "/invoices/new", label: "New Invoice", icon: PlusCircle },
  { path: "/invoices", label: "Invoices", icon: LayoutDashboard },
  { path: "/customers", label: "Customers", icon: Users },
  { path: "/products", label: "Products", icon: Package },
  { path: "/inventory", label: "Inventory", icon: Boxes },
  { path: "/recurring", label: "Recurring", icon: RefreshCcw },
  { path: "/settings", label: "Settings", icon: Settings },
];

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { data: isAdmin } = useIsAdmin();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  const handleLogout = async () => {
    await signOut();
    toast.success("Logged out successfully");
    navigate("/login");
  };

  const userInitials = user?.email?.substring(0, 2).toUpperCase() || "U";
  const userName = user?.email?.split("@")[0] || "User";

  return (
    <Sidebar 
      collapsible="icon" 
      className="border-r-0 bg-sidebar-background"
    >
      {/* Logo Header */}
      <SidebarHeader className="p-4 pb-2">
        <Link to="/dashboard" className="flex items-center gap-3 group">
          <div className={cn(
            "rounded-xl gradient-navy flex items-center justify-center shrink-0 shadow-lg transition-all duration-300 group-hover:shadow-xl",
            collapsed ? "w-9 h-9" : "w-11 h-11"
          )}>
            <FileText className={cn("text-white transition-all", collapsed ? "w-4 h-4" : "w-5 h-5")} />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="text-xl font-bold text-foreground tracking-tight">Proforma</h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Invoice System</p>
            </div>
          )}
        </Link>
      </SidebarHeader>

      <Separator className="mx-4 w-auto" />

      {/* Navigation */}
      <SidebarContent className="px-3 py-4">
        <SidebarMenu className="space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            
            return (
              <SidebarMenuItem key={item.path}>
                <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                  <Link
                    to={item.path}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                    )}
                  >
                    <Icon className={cn(
                      "h-[18px] w-[18px] shrink-0 transition-colors",
                      isActive ? "text-primary-foreground" : "text-muted-foreground"
                    )} />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}

          {/* Admin Link */}
          {isAdmin && (
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={location.pathname === "/admin"} tooltip="Admin">
                <Link
                  to="/admin"
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    location.pathname === "/admin"
                      ? "bg-amber-500 text-white shadow-md"
                      : "text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
                  )}
                >
                  <Shield className="h-[18px] w-[18px] shrink-0" />
                  {!collapsed && <span>Admin</span>}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarContent>

      {/* User Footer */}
      <SidebarFooter className="p-3 mt-auto">
        <Separator className="mb-3" />
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "w-full rounded-xl h-auto py-2 hover:bg-accent/50 transition-all",
                  collapsed ? "justify-center px-2" : "justify-start px-3"
                )}
              >
                <Avatar className={cn("shrink-0 border-2 border-primary/20", collapsed ? "h-8 w-8" : "h-9 w-9")}>
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                {!collapsed && (
                  <>
                    <div className="flex flex-col items-start ml-3 overflow-hidden">
                      <span className="text-sm font-semibold text-foreground truncate max-w-[120px]">
                        {userName}
                      </span>
                      <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                        {user.email}
                      </span>
                    </div>
                    <ChevronDown className="ml-auto h-4 w-4 text-muted-foreground" />
                  </>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="top" className="w-56 rounded-xl">
              <div className="px-3 py-2">
                <p className="text-sm font-medium">{userName}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                <Link to="/profile">
                  <UserCircle className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleLogout} 
                className="rounded-lg text-destructive focus:text-destructive cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}

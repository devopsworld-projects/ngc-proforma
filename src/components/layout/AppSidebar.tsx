import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  Users, LayoutDashboard, RefreshCcw, PlusCircle, BarChart3, Settings, 
  Package, Shield, FileText, Boxes, ChevronRight, LogOut, UserCircle
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useAdmin";
import { toast } from "sonner";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const mainNavItems = [
  { path: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { path: "/invoices/new", label: "Create Invoice", icon: PlusCircle },
  { path: "/invoices", label: "All Invoices", icon: LayoutDashboard },
];

const managementItems = [
  { path: "/customers", label: "Customers", icon: Users },
  { path: "/products", label: "Products", icon: Package },
  { path: "/inventory", label: "Inventory", icon: Boxes },
  { path: "/recurring", label: "Recurring", icon: RefreshCcw },
];

const settingsItems = [
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

  const NavItem = ({ item }: { item: { path: string; label: string; icon: React.ComponentType<{ className?: string }> } }) => {
    const isActive = location.pathname === item.path;
    const Icon = item.icon;
    
    return (
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={isActive}>
          <Link
            to={item.path}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200",
              isActive
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            <Icon className={cn("h-4 w-4 shrink-0", isActive && "text-primary-foreground")} />
            {!collapsed && <span className="font-medium">{item.label}</span>}
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  const userInitials = user?.email?.substring(0, 2).toUpperCase() || "U";

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      {/* Header */}
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <Link to="/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-navy flex items-center justify-center shrink-0 shadow-lg">
            <FileText className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="text-lg font-serif font-bold text-sidebar-foreground truncate">Proforma</h1>
              <p className="text-xs text-sidebar-foreground/60 truncate">Invoice System</p>
            </div>
          )}
        </Link>
      </SidebarHeader>

      {/* Main Content */}
      <SidebarContent className="px-2 py-4">
        {/* Main Navigation */}
        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider px-3 mb-2">
              Main
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {mainNavItems.map((item) => (
                <NavItem key={item.path} item={item} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Management */}
        <SidebarGroup className="mt-6">
          {!collapsed && (
            <SidebarGroupLabel className="text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider px-3 mb-2">
              Management
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {managementItems.map((item) => (
                <NavItem key={item.path} item={item} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Settings & Admin */}
        <SidebarGroup className="mt-6">
          {!collapsed && (
            <SidebarGroupLabel className="text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider px-3 mb-2">
              System
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {settingsItems.map((item) => (
                <NavItem key={item.path} item={item} />
              ))}
              {isAdmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={location.pathname === "/admin"}>
                    <Link
                      to="/admin"
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200",
                        location.pathname === "/admin"
                          ? "bg-amber-500 text-white shadow-md"
                          : "text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                      )}
                    >
                      <Shield className="h-4 w-4 shrink-0" />
                      {!collapsed && <span className="font-medium">Admin</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer - User Menu */}
      <SidebarFooter className="border-t border-sidebar-border p-3">
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3 px-2 py-6 hover:bg-sidebar-accent",
                  collapsed && "justify-center px-0"
                )}
              >
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                {!collapsed && (
                  <div className="flex flex-col items-start overflow-hidden">
                    <span className="text-sm font-medium text-sidebar-foreground truncate max-w-[140px]">
                      {user.email?.split("@")[0]}
                    </span>
                    <span className="text-xs text-sidebar-foreground/60 truncate max-w-[140px]">
                      {user.email}
                    </span>
                  </div>
                )}
                {!collapsed && <ChevronRight className="ml-auto h-4 w-4 text-sidebar-foreground/50" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="right" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">Account</p>
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
          </DropdownMenu>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}

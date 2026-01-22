import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useLocation, Link } from "react-router-dom";

interface AppLayoutProps {
  children: React.ReactNode;
}

const routeLabels: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/invoices": "Invoices",
  "/invoices/new": "Create Invoice",
  "/customers": "Customers",
  "/products": "Products",
  "/inventory": "Inventory",
  "/recurring": "Recurring",
  "/settings": "Settings",
  "/admin": "Admin",
  "/profile": "Profile",
};

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const currentRoute = location.pathname;
  
  // Handle dynamic routes like /invoices/:id
  const getPageTitle = () => {
    if (routeLabels[currentRoute]) {
      return routeLabels[currentRoute];
    }
    if (currentRoute.startsWith("/invoices/") && currentRoute.endsWith("/edit")) {
      return "Edit Invoice";
    }
    if (currentRoute.startsWith("/invoices/")) {
      return "Invoice Preview";
    }
    return "Page";
  };

  const getBreadcrumbs = () => {
    const parts = currentRoute.split("/").filter(Boolean);
    const breadcrumbs: { label: string; path: string; isLast: boolean }[] = [];
    
    let currentPath = "";
    parts.forEach((part, index) => {
      currentPath += `/${part}`;
      const isLast = index === parts.length - 1;
      
      let label = routeLabels[currentPath] || part.charAt(0).toUpperCase() + part.slice(1);
      
      // Special handling for dynamic segments
      if (part === "new") label = "New";
      if (part === "edit") label = "Edit";
      if (parts[0] === "invoices" && index === 1 && part !== "new") {
        label = "Preview";
      }
      
      breadcrumbs.push({ label, path: currentPath, isLast });
    });
    
    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <SidebarInset className="flex-1 flex flex-col">
          {/* Header */}
          <header className="no-print sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="h-6" />
            
            {/* Breadcrumbs */}
            <Breadcrumb className="hidden md:flex">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to="/dashboard" className="text-muted-foreground hover:text-foreground">
                      Home
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                {breadcrumbs.map((crumb, index) => (
                  <span key={crumb.path} className="contents">
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      {crumb.isLast ? (
                        <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink asChild>
                          <Link to={crumb.path} className="text-muted-foreground hover:text-foreground">
                            {crumb.label}
                          </Link>
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                  </span>
                ))}
              </BreadcrumbList>
            </Breadcrumb>

            {/* Page Title (mobile) */}
            <span className="md:hidden font-medium">{getPageTitle()}</span>

            <div className="ml-auto flex items-center gap-2">
              <ThemeToggle />
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            <div className="container max-w-7xl mx-auto px-4 sm:px-6 py-6">
              {children}
            </div>
          </main>

          {/* Footer */}
          <footer className="no-print border-t bg-background py-3 px-4">
            <div className="container max-w-7xl mx-auto text-center text-xs text-muted-foreground">
              Premium Invoice System • Secure & Reliable
            </div>
          </footer>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

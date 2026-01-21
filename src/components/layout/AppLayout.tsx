import { AppNavigation } from "@/components/layout/AppNavigation";
import { FileText } from "lucide-react";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="no-print border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-navy flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-serif font-bold text-foreground">Proforma Invoice</h1>
              <p className="text-xs text-muted-foreground">Premium Invoice Management System</p>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <AppNavigation />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="no-print border-t bg-card py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Premium Invoice System • Secure & Reliable</p>
        </div>
      </footer>
    </div>
  );
}

import { AppNavigation } from "@/components/layout/AppNavigation";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-white text-black">
      {/* Horizontal Navigation */}
      <AppNavigation />

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-white">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 py-6 bg-white">{children}</div>
      </main>

      {/* Footer */}
      <footer className="no-print border-t bg-white py-3 px-4">
        <div className="container max-w-7xl mx-auto text-center text-xs text-gray-600">
          Global Shopee • Invoice System • Secure & Reliable
        </div>
      </footer>
    </div>
  );
}

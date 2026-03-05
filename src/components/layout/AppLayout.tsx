import { AppNavigation } from "@/components/layout/AppNavigation";
import { DataQualityAgent } from "@/components/layout/DataQualityAgent";
import { useAdminInvoiceNotification } from "@/hooks/useAdminInvoiceNotification";

interface AppLayoutProps {
  children: React.ReactNode;
}
export function AppLayout({
  children
}: AppLayoutProps) {
  const { unreadCount, notifications, markAsRead, clearAll, lastReadAt } = useAdminInvoiceNotification();
  return <div className="min-h-screen flex flex-col bg-background">
      <AppNavigation unreadInvoiceCount={unreadCount} notifications={notifications} onMarkAsRead={markAsRead} onClearAll={clearAll} lastReadAt={lastReadAt} />
      <DataQualityAgent />
      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 py-6">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="no-print border-t bg-background py-3 px-4">
        <div className="container max-w-7xl mx-auto text-center text-xs text-muted-foreground">
          Global Shopee • Proforma Invoice • Secure & Reliable    
        </div>
      </footer>
    </div>;
}

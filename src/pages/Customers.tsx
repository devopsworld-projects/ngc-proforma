import { AppLayout } from "@/components/layout/AppLayout";
import { CustomerList } from "@/components/customers/CustomerList";

export default function CustomersPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-serif font-bold">Customers</h2>
          <p className="text-muted-foreground">Manage your customers and their billing/shipping addresses</p>
        </div>
        <CustomerList />
      </div>
    </AppLayout>
  );
}

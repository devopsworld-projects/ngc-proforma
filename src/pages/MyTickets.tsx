import { AppLayout } from "@/components/layout/AppLayout";
import { MyTicketsCard } from "@/components/profile/MyTicketsCard";

export default function MyTickets() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">My Support Tickets</h1>
        <MyTicketsCard />
      </div>
    </AppLayout>
  );
}

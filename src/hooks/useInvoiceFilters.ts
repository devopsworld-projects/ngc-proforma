import { useMemo, useState } from "react";
import { InvoiceFiltersState } from "@/components/invoices/InvoiceFilters";

const initialFilters: InvoiceFiltersState = {
  search: "",
  status: "all",
  dateFrom: undefined,
  dateTo: undefined,
  amountMin: "",
  amountMax: "",
};

interface InvoiceWithCustomer {
  id: string;
  invoice_no: string;
  date: string;
  grand_total: number;
  status: string;
  customers?: { name: string } | null;
}

export function useInvoiceFilters<T extends InvoiceWithCustomer>(invoices: T[] | undefined) {
  const [filters, setFilters] = useState<InvoiceFiltersState>(initialFilters);

  const filteredInvoices = useMemo(() => {
    if (!invoices) return [];

    return invoices.filter((invoice) => {
      // Search filter (invoice number or customer name)
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const invoiceNoMatch = invoice.invoice_no.toLowerCase().includes(searchLower);
        const customerName = (invoice as any).customers?.name || "";
        const customerMatch = customerName.toLowerCase().includes(searchLower);
        if (!invoiceNoMatch && !customerMatch) return false;
      }

      // Status filter
      if (filters.status !== "all" && invoice.status !== filters.status) {
        return false;
      }

      // Date range filter
      const invoiceDate = new Date(invoice.date);
      if (filters.dateFrom) {
        const fromDate = new Date(filters.dateFrom);
        fromDate.setHours(0, 0, 0, 0);
        if (invoiceDate < fromDate) return false;
      }
      if (filters.dateTo) {
        const toDate = new Date(filters.dateTo);
        toDate.setHours(23, 59, 59, 999);
        if (invoiceDate > toDate) return false;
      }

      // Amount range filter
      const amount = Number(invoice.grand_total);
      if (filters.amountMin && amount < Number(filters.amountMin)) {
        return false;
      }
      if (filters.amountMax && amount > Number(filters.amountMax)) {
        return false;
      }

      return true;
    });
  }, [invoices, filters]);

  const clearFilters = () => setFilters(initialFilters);

  return {
    filters,
    setFilters,
    filteredInvoices,
    clearFilters,
    hasActiveFilters: filters.search !== "" || 
      filters.status !== "all" || 
      filters.dateFrom !== undefined || 
      filters.dateTo !== undefined ||
      filters.amountMin !== "" ||
      filters.amountMax !== "",
  };
}

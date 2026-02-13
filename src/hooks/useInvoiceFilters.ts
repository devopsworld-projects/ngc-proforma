import { useMemo, useState } from "react";
import { InvoiceFiltersState } from "@/components/invoices/InvoiceFilters";
import { SortConfig, SortDirection } from "@/components/ui/sortable-table-head";

const initialFilters: InvoiceFiltersState = {
  search: "",
  status: "all",
  dateFrom: undefined,
  dateTo: undefined,
  amountMin: "",
  amountMax: "",
};

export type InvoiceSortKey = "date" | "invoice_no" | "grand_total" | "status";

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
  const [sortConfig, setSortConfig] = useState<SortConfig<InvoiceSortKey>>({
    key: "date",
    direction: "desc",
  });

  const handleSort = (key: InvoiceSortKey) => {
    setSortConfig((prev) => {
      if (prev.key !== key) {
        return { key, direction: "asc" };
      }
      if (prev.direction === "asc") {
        return { key, direction: "desc" };
      }
      if (prev.direction === "desc") {
        return { key: null, direction: null };
      }
      return { key, direction: "asc" };
    });
  };

  const filteredInvoices = useMemo(() => {
    if (!invoices) return [];

    let result = invoices.filter((invoice) => {
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

    // Apply sorting
    if (sortConfig.key && sortConfig.direction) {
      result = [...result].sort((a, b) => {
        const key = sortConfig.key!;
        let aVal: any = a[key as keyof typeof a];
        let bVal: any = b[key as keyof typeof b];
        
        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return 1;
        if (bVal == null) return -1;
        
        let comparison = 0;
        
        // Handle date comparison
        if (key === "date") {
          comparison = new Date(aVal).getTime() - new Date(bVal).getTime();
        } else if (typeof aVal === "number" && typeof bVal === "number") {
          comparison = aVal - bVal;
        } else {
          comparison = String(aVal).localeCompare(String(bVal));
        }
        
        return sortConfig.direction === "desc" ? -comparison : comparison;
      });
    }

    return result;
  }, [invoices, filters, sortConfig]);

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
    sortConfig,
    handleSort,
  };
}

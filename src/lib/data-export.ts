// Data export utilities for Excel and CSV downloads
import { downloadExcelTemplate } from "./excel-utils";

export interface ExportableInvoice {
  invoice_no: string;
  date: string;
  customer_name: string;
  subtotal: number;
  tax_amount: number;
  grand_total: number;
  status: string;
  created_at: string;
}

export interface ExportableCustomer {
  name: string;
  email: string | null;
  phone: string | null;
  gstin: string | null;
  state: string | null;
  state_code: string | null;
  notes: string | null;
}

export interface ExportableProduct {
  name: string;
  sku: string | null;
  description: string | null;
  category: string | null;
  hsn_code: string | null;
  unit: string;
  rate: number;
  purchase_price: number | null;
  stock_quantity: number;
}

export async function exportInvoicesToExcel(invoices: ExportableInvoice[]): Promise<void> {
  const data = invoices.map(inv => ({
    "Invoice No": inv.invoice_no,
    "Date": inv.date,
    "Customer": inv.customer_name,
    "Subtotal": inv.subtotal,
    "Tax Amount": inv.tax_amount,
    "Grand Total": inv.grand_total,
    "Status": inv.status,
    "Created At": new Date(inv.created_at).toLocaleString(),
  }));
  
  await downloadExcelTemplate(data, "invoices-export.xlsx", "Invoices", [15, 12, 30, 15, 15, 15, 12, 20]);
}

export async function exportCustomersToExcel(customers: ExportableCustomer[]): Promise<void> {
  const data = customers.map(cust => ({
    "Name": cust.name,
    "Email": cust.email || "",
    "Phone": cust.phone || "",
    "GSTIN": cust.gstin || "",
    "State": cust.state || "",
    "State Code": cust.state_code || "",
    "Notes": cust.notes || "",
  }));
  
  await downloadExcelTemplate(data, "customers-export.xlsx", "Customers", [30, 30, 15, 20, 20, 12, 40]);
}

export async function exportProductsToExcel(products: ExportableProduct[]): Promise<void> {
  const data = products.map(prod => ({
    "Name": prod.name,
    "SKU": prod.sku || "",
    "Description": prod.description || "",
    "Category": prod.category || "",
    "HSN Code": prod.hsn_code || "",
    "Unit": prod.unit,
    "Rate": prod.rate,
    "Purchase Price": prod.purchase_price || 0,
    "Stock Quantity": prod.stock_quantity,
  }));
  
  await downloadExcelTemplate(data, "products-export.xlsx", "Products", [30, 15, 40, 20, 15, 10, 15, 15, 15]);
}

// CSV Export functions
function convertToCSV(data: Record<string, unknown>[]): string {
  if (data.length === 0) return "";
  
  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(",")];
  
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      const stringValue = value === null || value === undefined ? "" : String(value);
      // Escape quotes and wrap in quotes if contains comma, quote, or newline
      if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    });
    csvRows.push(values.join(","));
  }
  
  return csvRows.join("\n");
}

function downloadCSV(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportInvoicesToCSV(invoices: ExportableInvoice[]): void {
  const data = invoices.map(inv => ({
    "Invoice No": inv.invoice_no,
    "Date": inv.date,
    "Customer": inv.customer_name,
    "Subtotal": inv.subtotal,
    "Tax Amount": inv.tax_amount,
    "Grand Total": inv.grand_total,
    "Status": inv.status,
    "Created At": new Date(inv.created_at).toLocaleString(),
  }));
  
  downloadCSV(convertToCSV(data), "invoices-export.csv");
}

export function exportCustomersToCSV(customers: ExportableCustomer[]): void {
  const data = customers.map(cust => ({
    "Name": cust.name,
    "Email": cust.email || "",
    "Phone": cust.phone || "",
    "GSTIN": cust.gstin || "",
    "State": cust.state || "",
    "State Code": cust.state_code || "",
    "Notes": cust.notes || "",
  }));
  
  downloadCSV(convertToCSV(data), "customers-export.csv");
}

export function exportProductsToCSV(products: ExportableProduct[]): void {
  const data = products.map(prod => ({
    "Name": prod.name,
    "SKU": prod.sku || "",
    "Description": prod.description || "",
    "Category": prod.category || "",
    "HSN Code": prod.hsn_code || "",
    "Unit": prod.unit,
    "Rate": prod.rate,
    "Purchase Price": prod.purchase_price || 0,
    "Stock Quantity": prod.stock_quantity,
  }));
  
  downloadCSV(convertToCSV(data), "products-export.csv");
}

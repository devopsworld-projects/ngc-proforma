export interface CompanyInfo {
  name: string;
  address: string[];
  phone: string[];
  gstin: string;
  state: string;
  stateCode: string;
  email: string;
  website: string;
}

export interface SupplierInfo {
  name: string;
  address: string;
  gstin: string;
  state: string;
  stateCode: string;
}

export interface InvoiceItem {
  id: string;
  slNo: number;
  description: string;
  serialNumbers?: string[];
  quantity: number;
  unit: string;
  rate: number;
  discountPercent: number;
  amount: number;
}

export interface InvoiceTotals {
  subtotal: number;
  discount: number;
  discountPercent: number;
  taxRate: number;
  taxAmount: number;
  roundOff: number;
  grandTotal: number;
}

export interface InvoiceData {
  invoiceNo: string;
  date: string;
  eWayBillNo?: string;
  supplierInvoiceNo: string;
  supplierInvoiceDate: string;
  otherReferences?: string;
  company: CompanyInfo;
  supplier: SupplierInfo;
  items: InvoiceItem[];
  totals: InvoiceTotals;
  totalQuantity: number;
  amountInWords: string;
}

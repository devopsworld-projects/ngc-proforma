import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatCurrency, numberToWords } from "./invoice-utils";

interface InvoiceItem {
  sl_no: number;
  description: string;
  serial_numbers?: string[] | null;
  quantity: number;
  unit: string;
  rate: number;
  discount_percent: number;
  amount: number;
}

interface CompanyInfo {
  name: string;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  state_code?: string | null;
  postal_code?: string | null;
  phone?: string[] | null;
  email?: string | null;
  website?: string | null;
  gstin?: string | null;
  logo_url?: string | null;
}

interface CustomerInfo {
  name: string;
  gstin?: string | null;
  state?: string | null;
  state_code?: string | null;
}

interface AddressInfo {
  address_line1?: string;
  address_line2?: string | null;
  city?: string;
  state?: string;
  state_code?: string | null;
  postal_code?: string;
}

interface InvoiceData {
  invoice_no: string;
  date: string;
  e_way_bill_no?: string | null;
  supplier_invoice_no?: string | null;
  supplier_invoice_date?: string | null;
  other_references?: string | null;
  subtotal: number;
  discount_percent: number;
  discount_amount: number;
  tax_rate: number;
  tax_amount: number;
  round_off: number;
  grand_total: number;
  amount_in_words?: string | null;
  items: InvoiceItem[];
  customer?: CustomerInfo | null;
  billing_address?: AddressInfo | null;
  shipping_address?: AddressInfo | null;
}

export async function generateInvoicePDF(
  invoice: InvoiceData,
  company: CompanyInfo,
  options: { returnBase64?: boolean } = {}
): Promise<string | void> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let yPos = 15;

  // Colors
  const primaryColor: [number, number, number] = [30, 41, 59]; // slate-800
  const accentColor: [number, number, number] = [180, 142, 95]; // gold accent
  const mutedColor: [number, number, number] = [100, 116, 139]; // slate-500

  // Helper function to add text
  const addText = (text: string, x: number, y: number, options: { fontSize?: number; fontStyle?: string; color?: [number, number, number]; align?: "left" | "center" | "right" } = {}) => {
    const { fontSize = 10, fontStyle = "normal", color = primaryColor, align = "left" } = options;
    doc.setFontSize(fontSize);
    doc.setFont("helvetica", fontStyle);
    doc.setTextColor(...color);
    doc.text(text, x, y, { align });
  };

  // Header - Company Name
  addText(company.name, margin, yPos, { fontSize: 18, fontStyle: "bold" });
  yPos += 8;

  // Company Address
  if (company.address_line1) {
    addText(company.address_line1, margin, yPos, { fontSize: 9, color: mutedColor });
    yPos += 4;
  }
  if (company.address_line2) {
    addText(company.address_line2, margin, yPos, { fontSize: 9, color: mutedColor });
    yPos += 4;
  }
  if (company.city || company.state || company.postal_code) {
    const cityLine = [company.city, company.state, company.postal_code].filter(Boolean).join(", ");
    addText(cityLine, margin, yPos, { fontSize: 9, color: mutedColor });
    yPos += 4;
  }

  // Company Contact
  if (company.phone && company.phone.length > 0) {
    addText(`Phone: ${company.phone.join(", ")}`, margin, yPos, { fontSize: 9, color: mutedColor });
    yPos += 4;
  }
  if (company.email) {
    addText(`Email: ${company.email}`, margin, yPos, { fontSize: 9, color: mutedColor });
    yPos += 4;
  }
  if (company.gstin) {
    addText(`GSTIN: ${company.gstin}`, margin, yPos, { fontSize: 9, fontStyle: "bold" });
    yPos += 4;
  }

  // Invoice Title - Right side
  doc.setFillColor(...accentColor);
  doc.rect(pageWidth - 70, 15, 55, 12, "F");
  addText("PROFORMA INVOICE", pageWidth - margin, 23, { fontSize: 11, fontStyle: "bold", color: [255, 255, 255], align: "right" });

  // Invoice Details Box
  yPos = Math.max(yPos, 45);
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 8;

  // Invoice Number and Date
  const col1 = margin;
  const col2 = pageWidth / 2;
  
  addText("Invoice No:", col1, yPos, { fontSize: 9, color: mutedColor });
  addText(invoice.invoice_no, col1 + 25, yPos, { fontSize: 10, fontStyle: "bold" });
  
  addText("Date:", col2, yPos, { fontSize: 9, color: mutedColor });
  addText(new Date(invoice.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }), col2 + 15, yPos, { fontSize: 10, fontStyle: "bold" });
  yPos += 6;

  if (invoice.e_way_bill_no) {
    addText("e-Way Bill No:", col1, yPos, { fontSize: 9, color: mutedColor });
    addText(invoice.e_way_bill_no, col1 + 30, yPos, { fontSize: 10 });
    yPos += 6;
  }

  yPos += 4;
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 8;

  // Customer Details
  addText("BILL TO:", col1, yPos, { fontSize: 9, fontStyle: "bold", color: accentColor });
  if (invoice.shipping_address) {
    addText("SHIP TO:", col2, yPos, { fontSize: 9, fontStyle: "bold", color: accentColor });
  }
  yPos += 6;

  if (invoice.customer) {
    addText(invoice.customer.name, col1, yPos, { fontSize: 11, fontStyle: "bold" });
    yPos += 5;
    
    if (invoice.billing_address) {
      if (invoice.billing_address.address_line1) {
        addText(invoice.billing_address.address_line1, col1, yPos, { fontSize: 9, color: mutedColor });
        yPos += 4;
      }
      if (invoice.billing_address.city || invoice.billing_address.state) {
        const addr = [invoice.billing_address.city, invoice.billing_address.state, invoice.billing_address.postal_code].filter(Boolean).join(", ");
        addText(addr, col1, yPos, { fontSize: 9, color: mutedColor });
        yPos += 4;
      }
    }
    
    if (invoice.customer.gstin) {
      addText(`GSTIN: ${invoice.customer.gstin}`, col1, yPos, { fontSize: 9 });
      yPos += 4;
    }
    if (invoice.customer.state) {
      addText(`State: ${invoice.customer.state}${invoice.customer.state_code ? ` (${invoice.customer.state_code})` : ""}`, col1, yPos, { fontSize: 9, color: mutedColor });
    }
  }

  // Shipping address on right
  if (invoice.shipping_address) {
    let shipY = yPos - 19;
    if (invoice.shipping_address.address_line1) {
      addText(invoice.shipping_address.address_line1, col2, shipY, { fontSize: 9, color: mutedColor });
      shipY += 4;
    }
    if (invoice.shipping_address.city || invoice.shipping_address.state) {
      const addr = [invoice.shipping_address.city, invoice.shipping_address.state, invoice.shipping_address.postal_code].filter(Boolean).join(", ");
      addText(addr, col2, shipY, { fontSize: 9, color: mutedColor });
    }
  }

  yPos += 10;

  // Items Table
  const tableData = invoice.items.map((item) => [
    item.sl_no.toString(),
    item.description + (item.serial_numbers?.length ? `\nS/N: ${item.serial_numbers.join(", ")}` : ""),
    item.quantity.toString(),
    item.unit,
    formatCurrency(item.rate),
    item.discount_percent > 0 ? `${item.discount_percent}%` : "-",
    formatCurrency(item.amount),
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [["#", "Description", "Qty", "Unit", "Rate", "Disc", "Amount"]],
    body: tableData,
    theme: "grid",
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: primaryColor,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      1: { cellWidth: "auto" },
      2: { cellWidth: 15, halign: "center" },
      3: { cellWidth: 15, halign: "center" },
      4: { cellWidth: 25, halign: "right" },
      5: { cellWidth: 15, halign: "center" },
      6: { cellWidth: 30, halign: "right" },
    },
    margin: { left: margin, right: margin },
  });

  // Get final Y position after table
  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Totals Section
  const totalsX = pageWidth - margin - 70;
  const valuesX = pageWidth - margin;

  addText("Subtotal:", totalsX, yPos, { fontSize: 9, color: mutedColor });
  addText(formatCurrency(invoice.subtotal), valuesX, yPos, { fontSize: 9, align: "right" });
  yPos += 5;

  if (invoice.discount_amount > 0) {
    addText(`Discount (${invoice.discount_percent}%):`, totalsX, yPos, { fontSize: 9, color: mutedColor });
    addText(`-${formatCurrency(invoice.discount_amount)}`, valuesX, yPos, { fontSize: 9, align: "right" });
    yPos += 5;
  }

  addText(`IGST (${invoice.tax_rate}%):`, totalsX, yPos, { fontSize: 9, color: mutedColor });
  addText(formatCurrency(invoice.tax_amount), valuesX, yPos, { fontSize: 9, align: "right" });
  yPos += 5;

  if (invoice.round_off !== 0) {
    addText("Round Off:", totalsX, yPos, { fontSize: 9, color: mutedColor });
    addText(invoice.round_off >= 0 ? `+${invoice.round_off.toFixed(2)}` : invoice.round_off.toFixed(2), valuesX, yPos, { fontSize: 9, align: "right" });
    yPos += 5;
  }

  // Grand Total
  doc.setFillColor(...accentColor);
  doc.rect(totalsX - 5, yPos - 3, pageWidth - totalsX - margin + 5, 10, "F");
  addText("GRAND TOTAL:", totalsX, yPos + 4, { fontSize: 10, fontStyle: "bold", color: [255, 255, 255] });
  addText(formatCurrency(invoice.grand_total), valuesX, yPos + 4, { fontSize: 10, fontStyle: "bold", color: [255, 255, 255], align: "right" });
  yPos += 15;

  // Amount in words
  const amountWords = invoice.amount_in_words || numberToWords(invoice.grand_total);
  addText("Amount in Words:", margin, yPos, { fontSize: 9, fontStyle: "bold" });
  yPos += 5;
  addText(amountWords, margin, yPos, { fontSize: 9, fontStyle: "italic", color: mutedColor });
  yPos += 15;

  // Footer
  doc.setDrawColor(...mutedColor);
  doc.setLineWidth(0.2);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 8;

  addText("Terms & Conditions:", margin, yPos, { fontSize: 8, fontStyle: "bold" });
  yPos += 4;
  addText("1. Goods once sold will not be taken back.", margin, yPos, { fontSize: 7, color: mutedColor });
  yPos += 3;
  addText("2. Subject to jurisdiction of local courts only.", margin, yPos, { fontSize: 7, color: mutedColor });

  // Signature area
  addText("For " + company.name, pageWidth - margin, yPos - 7, { fontSize: 9, fontStyle: "bold", align: "right" });
  addText("Authorized Signatory", pageWidth - margin, yPos + 10, { fontSize: 8, color: mutedColor, align: "right" });

  // Return base64 or save PDF
  if (options.returnBase64) {
    return doc.output("datauristring").split(",")[1];
  }
  
  doc.save(`Invoice-${invoice.invoice_no}.pdf`);
}

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
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPos = 25;

  // Colors
  const darkColor: [number, number, number] = [51, 51, 51]; // Dark gray for text
  const accentColor: [number, number, number] = [245, 189, 50]; // Yellow/gold accent
  const mutedColor: [number, number, number] = [128, 128, 128]; // Gray for secondary text
  const lightGray: [number, number, number] = [245, 245, 245]; // Light gray for alternating rows

  // Helper function to add text
  const addText = (text: string, x: number, y: number, options: { fontSize?: number; fontStyle?: string; color?: [number, number, number]; align?: "left" | "center" | "right" } = {}) => {
    const { fontSize = 10, fontStyle = "normal", color = darkColor, align = "left" } = options;
    doc.setFontSize(fontSize);
    doc.setFont("helvetica", fontStyle);
    doc.setTextColor(...color);
    doc.text(text, x, y, { align });
  };

  // ===== HEADER SECTION =====
  // Company Name (top left)
  addText(company.name, margin, yPos, { fontSize: 16, fontStyle: "bold" });
  
  // Tagline/GSTIN under company name
  if (company.gstin) {
    yPos += 6;
    addText(`GSTIN: ${company.gstin}`, margin, yPos, { fontSize: 8, color: mutedColor });
  }

  // Yellow accent bar with INVOICE title (right side)
  const accentBarWidth = 80;
  const accentBarHeight = 12;
  doc.setFillColor(...accentColor);
  doc.rect(pageWidth - margin - accentBarWidth - 10, 18, accentBarWidth + 10, accentBarHeight, "F");
  // Small accent square
  doc.rect(pageWidth - margin - 8, 18, 8, accentBarHeight, "F");
  
  addText("INVOICE", pageWidth - margin - accentBarWidth / 2 - 5, 26, { 
    fontSize: 18, 
    fontStyle: "bold", 
    color: darkColor, 
    align: "center" 
  });

  yPos = 50;

  // ===== CUSTOMER & INVOICE DETAILS SECTION =====
  // Yellow accent bar (left side only)
  doc.setFillColor(...accentColor);
  doc.rect(margin, yPos - 5, 4, 40, "F");

  // Invoice to section
  addText("Invoice to:", margin + 12, yPos, { fontSize: 10, fontStyle: "bold", color: darkColor });
  yPos += 6;

  if (invoice.customer) {
    addText(invoice.customer.name, margin + 12, yPos, { fontSize: 11, fontStyle: "bold" });
    yPos += 5;
    
    if (invoice.billing_address) {
      if (invoice.billing_address.address_line1) {
        addText(invoice.billing_address.address_line1, margin + 12, yPos, { fontSize: 9, color: mutedColor });
        yPos += 4;
      }
      if (invoice.billing_address.address_line2) {
        addText(invoice.billing_address.address_line2, margin + 12, yPos, { fontSize: 9, color: mutedColor });
        yPos += 4;
      }
      const cityLine = [invoice.billing_address.city, invoice.billing_address.state, invoice.billing_address.postal_code].filter(Boolean).join(", ");
      if (cityLine) {
        addText(cityLine, margin + 12, yPos, { fontSize: 9, color: mutedColor });
        yPos += 4;
      }
    }
    
    if (invoice.customer.gstin) {
      addText(`GSTIN: ${invoice.customer.gstin}`, margin + 12, yPos, { fontSize: 9, color: mutedColor });
    }
  }

  // Invoice # and Date (right side)
  const rightColX = pageWidth - margin - 50;
  const rightValX = pageWidth - margin;
  let rightY = 50;
  
  addText("Invoice#", rightColX, rightY, { fontSize: 10, fontStyle: "bold", color: darkColor });
  addText(invoice.invoice_no, rightValX, rightY, { fontSize: 10, align: "right" });
  rightY += 8;
  
  addText("Date", rightColX, rightY, { fontSize: 10, fontStyle: "bold", color: darkColor });
  addText(new Date(invoice.date).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" }), rightValX, rightY, { fontSize: 10, align: "right" });

  if (invoice.e_way_bill_no) {
    rightY += 8;
    addText("e-Way Bill", rightColX, rightY, { fontSize: 10, fontStyle: "bold", color: darkColor });
    addText(invoice.e_way_bill_no, rightValX, rightY, { fontSize: 10, align: "right" });
  }

  yPos = Math.max(yPos, rightY) + 20;

  // ===== ITEMS TABLE =====
  const tableData = invoice.items.map((item) => [
    item.sl_no.toString(),
    item.description + (item.serial_numbers?.length ? `\nS/N: ${item.serial_numbers.join(", ")}` : ""),
    formatCurrency(item.rate),
    item.quantity.toString(),
    formatCurrency(item.amount),
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [["SL.", "Item Description", "Price", "Qty.", "Total"]],
    body: tableData,
    theme: "plain",
    headStyles: {
      fillColor: accentColor,
      textColor: darkColor,
      fontStyle: "bold",
      fontSize: 10,
      cellPadding: 6,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: darkColor,
      cellPadding: 6,
    },
    alternateRowStyles: {
      fillColor: lightGray,
    },
    columnStyles: {
      0: { cellWidth: 15, halign: "center" },
      1: { cellWidth: "auto" },
      2: { cellWidth: 30, halign: "right" },
      3: { cellWidth: 20, halign: "center" },
      4: { cellWidth: 35, halign: "right" },
    },
    margin: { left: margin, right: margin },
    tableLineColor: [220, 220, 220],
    tableLineWidth: 0.1,
  });

  // Get final Y position after table
  yPos = (doc as any).lastAutoTable.finalY + 15;

  // ===== THANK YOU & TOTALS SECTION =====
  const leftContentX = margin;
  const totalsLabelX = pageWidth - margin - 70;
  const totalsValueX = pageWidth - margin;

  // Left side - Thank you message
  addText("Thank you for your business", leftContentX, yPos, { fontSize: 11, fontStyle: "italic", color: darkColor });

  // Right side - Subtotal
  addText("Sub Total:", totalsLabelX, yPos, { fontSize: 10, color: mutedColor });
  addText(formatCurrency(invoice.subtotal), totalsValueX, yPos, { fontSize: 10, align: "right" });
  yPos += 7;

  // Discount (if any)
  if (invoice.discount_amount > 0) {
    addText(`Discount (${invoice.discount_percent}%):`, totalsLabelX, yPos, { fontSize: 10, color: mutedColor });
    addText(`-${formatCurrency(invoice.discount_amount)}`, totalsValueX, yPos, { fontSize: 10, align: "right" });
    yPos += 7;
  }

  // Tax
  addText(`Tax (${invoice.tax_rate}%):`, totalsLabelX, yPos, { fontSize: 10, color: mutedColor });
  addText(formatCurrency(invoice.tax_amount), totalsValueX, yPos, { fontSize: 10, align: "right" });
  yPos += 10;

  // Total with yellow accent
  doc.setFillColor(...accentColor);
  doc.rect(totalsLabelX - 5, yPos - 5, pageWidth - margin - totalsLabelX + 5, 12, "F");
  addText("Total:", totalsLabelX, yPos + 3, { fontSize: 11, fontStyle: "bold", color: darkColor });
  addText(formatCurrency(invoice.grand_total), totalsValueX, yPos + 3, { fontSize: 11, fontStyle: "bold", color: darkColor, align: "right" });

  yPos += 25;

  // ===== TERMS & CONDITIONS =====
  addText("Terms & Conditions:", leftContentX, yPos, { fontSize: 10, fontStyle: "bold", color: darkColor });
  yPos += 5;
  addText("1. Goods once sold will not be taken back.", leftContentX, yPos, { fontSize: 8, color: mutedColor });
  yPos += 4;
  addText("2. Subject to jurisdiction of local courts only.", leftContentX, yPos, { fontSize: 8, color: mutedColor });

  // Amount in words
  yPos += 10;
  const amountWords = invoice.amount_in_words || numberToWords(invoice.grand_total);
  addText("Amount in Words:", leftContentX, yPos, { fontSize: 9, fontStyle: "bold", color: darkColor });
  yPos += 5;
  addText(amountWords, leftContentX, yPos, { fontSize: 9, fontStyle: "italic", color: mutedColor });

  // ===== FOOTER =====
  const footerY = pageHeight - 30;
  
  // Separator line
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.5);
  doc.line(margin, footerY - 10, pageWidth - margin, footerY - 10);

  // Contact info (centered)
  const contactParts = [];
  if (company.phone && company.phone.length > 0) contactParts.push(company.phone[0]);
  if (company.city && company.state) contactParts.push(`${company.city}, ${company.state}`);
  if (company.website) contactParts.push(company.website);
  
  if (contactParts.length > 0) {
    addText(contactParts.join("  |  "), pageWidth / 2, footerY, { fontSize: 8, color: mutedColor, align: "center" });
  }

  // Authorized signature (right side)
  doc.setDrawColor(...darkColor);
  doc.setLineWidth(0.3);
  doc.line(pageWidth - margin - 50, footerY - 5, pageWidth - margin, footerY - 5);
  addText("Authorised Sign", pageWidth - margin - 25, footerY + 2, { fontSize: 8, color: mutedColor, align: "center" });

  // Return base64 or save PDF
  if (options.returnBase64) {
    return doc.output("datauristring").split(",")[1];
  }
  
  doc.save(`Invoice-${invoice.invoice_no}.pdf`);
}

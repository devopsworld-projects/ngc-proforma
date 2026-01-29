import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatCurrency, numberToWords } from "./invoice-utils";
import { PdfTemplateSettings, defaultPdfTemplateSettings } from "@/hooks/usePdfTemplateSettings";

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

// Helper to convert hex to RGB
function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [41, 65, 114];
}

// Helper to load image as base64
async function loadImageAsBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function generateInvoicePDF(
  invoice: InvoiceData,
  company: CompanyInfo,
  options: { returnBase64?: boolean; templateSettings?: Partial<PdfTemplateSettings> | null } = {}
): Promise<string | void> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;
  let yPos = margin;

  // Merge template settings with defaults
  const template = { ...defaultPdfTemplateSettings, ...options.templateSettings };

  // Colors from template settings
  const primaryColor = hexToRgb(template.primary_color);
  const secondaryColor = hexToRgb(template.secondary_color);
  const headerTextColor = hexToRgb(template.header_text_color);
  const tableTextColor = hexToRgb(template.table_text_color);
  const darkText: [number, number, number] = [33, 37, 41];
  const mutedText: [number, number, number] = [108, 117, 125];
  const lightBg: [number, number, number] = [248, 249, 250];
  const borderColor: [number, number, number] = [222, 226, 230];

  // Helper to add text
  const addText = (
    text: string,
    x: number,
    y: number,
    opts: {
      fontSize?: number;
      fontStyle?: string;
      color?: [number, number, number];
      align?: "left" | "center" | "right";
      maxWidth?: number;
    } = {}
  ) => {
    const { fontSize = 10, fontStyle = "normal", color = darkText, align = "left", maxWidth } = opts;
    doc.setFontSize(fontSize);
    doc.setFont("helvetica", fontStyle);
    doc.setTextColor(...color);
    
    if (maxWidth) {
      const lines = doc.splitTextToSize(text, maxWidth);
      doc.text(lines, x, y, { align });
      return lines.length * (fontSize * 0.4);
    }
    doc.text(text, x, y, { align });
    return fontSize * 0.4;
  };

  // ===== COMPACT HEADER =====
  const headerHeight = 32;
  
  // Header background - full width with subtle gradient effect
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, headerHeight, "F");

  // Try to load and add company logo
  let contentStartX = margin + 4;
  if (template.show_logo && company.logo_url) {
    const logoBase64 = await loadImageAsBase64(company.logo_url);
    if (logoBase64) {
      try {
        const logoSize = 20;
        doc.addImage(logoBase64, "PNG", margin + 4, 6, logoSize, logoSize);
        contentStartX = margin + 4 + logoSize + 6;
      } catch (e) {
        console.warn("Failed to add logo:", e);
      }
    }
  }

  // Company name - prominent
  addText(company.name.toUpperCase(), contentStartX, 15, {
    fontSize: 14,
    fontStyle: "bold",
    color: headerTextColor,
  });

  // Company tagline/GSTIN under name
  if (template.show_gstin_header && company.gstin) {
    addText(`GSTIN: ${company.gstin}`, contentStartX, 22, {
      fontSize: 8,
      color: [Math.min(headerTextColor[0] + 60, 255), Math.min(headerTextColor[1] + 60, 255), Math.min(headerTextColor[2] + 60, 255)],
    });
  }

  // Contact info on right - compact single line
  if (template.show_contact_header) {
    const rightX = pageWidth - margin - 4;
    const contactParts: string[] = [];
    
    if (company.phone && company.phone.length > 0) contactParts.push(company.phone[0]);
    if (company.email) contactParts.push(company.email);
    
    if (contactParts.length > 0) {
      addText(contactParts.join(" • "), rightX, 14, {
        fontSize: 8,
        color: [Math.min(headerTextColor[0] + 40, 255), Math.min(headerTextColor[1] + 40, 255), Math.min(headerTextColor[2] + 40, 255)],
        align: "right",
      });
    }
    
    // Address line
    const addressParts = [company.city, company.state, company.postal_code].filter(Boolean);
    if (addressParts.length > 0) {
      addText(addressParts.join(", "), rightX, 21, {
        fontSize: 7,
        color: [Math.min(headerTextColor[0] + 80, 255), Math.min(headerTextColor[1] + 80, 255), Math.min(headerTextColor[2] + 80, 255)],
        align: "right",
      });
    }
  }

  yPos = headerHeight + 8;

  // ===== INVOICE TITLE STRIP =====
  doc.setFillColor(...secondaryColor);
  doc.rect(margin, yPos, pageWidth - margin * 2, 10, "F");
  
  addText("TAX INVOICE", margin + 6, yPos + 6.5, {
    fontSize: 10,
    fontStyle: "bold",
    color: [255, 255, 255],
  });

  // Invoice number and date on right
  const invoiceDate = new Date(invoice.date).toLocaleDateString("en-IN", { 
    day: "2-digit", 
    month: "short", 
    year: "numeric" 
  });
  addText(`${invoice.invoice_no} | ${invoiceDate}`, pageWidth - margin - 6, yPos + 6.5, {
    fontSize: 9,
    fontStyle: "bold",
    color: [255, 255, 255],
    align: "right",
  });

  yPos += 16;

  // ===== TWO COLUMN LAYOUT - BILL TO & INVOICE DETAILS =====
  const colWidth = (pageWidth - margin * 2 - 8) / 2;
  const leftColX = margin;
  const rightColX = margin + colWidth + 8;
  const boxHeight = 42;

  // Bill To Box
  doc.setFillColor(...lightBg);
  doc.setDrawColor(...borderColor);
  doc.setLineWidth(0.3);
  doc.roundedRect(leftColX, yPos, colWidth, boxHeight, 2, 2, "FD");

  // Section header with accent
  doc.setFillColor(...secondaryColor);
  doc.rect(leftColX, yPos, colWidth, 8, "F");
  // Round top corners manually
  doc.setFillColor(...lightBg);
  
  addText("BILL TO", leftColX + 6, yPos + 5.5, {
    fontSize: 7,
    fontStyle: "bold",
    color: [255, 255, 255],
  });

  let billY = yPos + 14;
  if (invoice.customer) {
    addText(invoice.customer.name, leftColX + 6, billY, {
      fontSize: 10,
      fontStyle: "bold",
      color: darkText,
      maxWidth: colWidth - 12,
    });
    billY += 6;

    if (invoice.billing_address) {
      const addr = invoice.billing_address;
      const addressLines: string[] = [];
      if (addr.address_line1) addressLines.push(addr.address_line1);
      if (addr.address_line2) addressLines.push(addr.address_line2);
      const cityLine = [addr.city, addr.state, addr.postal_code].filter(Boolean).join(", ");
      if (cityLine) addressLines.push(cityLine);
      
      addressLines.forEach(line => {
        addText(line, leftColX + 6, billY, {
          fontSize: 8,
          color: mutedText,
          maxWidth: colWidth - 12,
        });
        billY += 4;
      });
    }

    if (invoice.customer.gstin) {
      addText(`GSTIN: ${invoice.customer.gstin}`, leftColX + 6, billY + 1, {
        fontSize: 8,
        fontStyle: "bold",
        color: secondaryColor,
      });
    }
  }

  // Invoice Details Box
  doc.setFillColor(...lightBg);
  doc.roundedRect(rightColX, yPos, colWidth, boxHeight, 2, 2, "FD");
  
  doc.setFillColor(...secondaryColor);
  doc.rect(rightColX, yPos, colWidth, 8, "F");

  addText("INVOICE DETAILS", rightColX + 6, yPos + 5.5, {
    fontSize: 7,
    fontStyle: "bold",
    color: [255, 255, 255],
  });

  const detailLabelX = rightColX + 6;
  const detailValueX = rightColX + colWidth - 6;
  let detailY = yPos + 15;

  const addDetailRow = (label: string, value: string) => {
    addText(label, detailLabelX, detailY, { fontSize: 8, color: mutedText });
    addText(value, detailValueX, detailY, { fontSize: 8, fontStyle: "bold", color: darkText, align: "right" });
    detailY += 5.5;
  };

  addDetailRow("Invoice No:", invoice.invoice_no);
  addDetailRow("Date:", invoiceDate);
  
  if (invoice.e_way_bill_no) {
    addDetailRow("e-Way Bill:", invoice.e_way_bill_no);
  }
  
  if (invoice.supplier_invoice_no) {
    addDetailRow("Supplier Inv:", invoice.supplier_invoice_no);
  }

  if (invoice.other_references) {
    addDetailRow("Reference:", invoice.other_references.substring(0, 25));
  }

  yPos += boxHeight + 8;

  // ===== ITEMS TABLE =====
  const showDiscount = template.show_discount_column;
  const showSerial = template.show_serial_numbers;

  const tableData = invoice.items.map((item, idx) => {
    let desc = item.description;
    if (showSerial && item.serial_numbers?.length) {
      desc += `\nS/N: ${item.serial_numbers.slice(0, 2).join(", ")}${item.serial_numbers.length > 2 ? "..." : ""}`;
    }
    
    const row: string[] = [
      (idx + 1).toString(),
      desc,
      item.quantity.toString(),
      item.unit,
      formatCurrency(item.rate),
    ];
    
    if (showDiscount) {
      row.push(item.discount_percent > 0 ? `${item.discount_percent}%` : "-");
    }
    row.push(formatCurrency(item.amount));
    
    return row;
  });

  const tableHead = showDiscount 
    ? [["#", "Description", "Qty", "Unit", "Rate", "Disc", "Amount"]]
    : [["#", "Description", "Qty", "Unit", "Rate", "Amount"]];

  const columnStyles: any = {
    0: { cellWidth: 10, halign: "center" },
    1: { cellWidth: "auto", halign: "left" },
    2: { cellWidth: 16, halign: "center" },
    3: { cellWidth: 16, halign: "center" },
    4: { cellWidth: 26, halign: "right" },
  };

  if (showDiscount) {
    columnStyles[5] = { cellWidth: 16, halign: "center" };
    columnStyles[6] = { cellWidth: 30, halign: "right", fontStyle: "bold" };
  } else {
    columnStyles[5] = { cellWidth: 30, halign: "right", fontStyle: "bold" };
  }

  autoTable(doc, {
    startY: yPos,
    head: tableHead,
    body: tableData,
    theme: "plain",
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
      cellPadding: 4,
      halign: "center",
    },
    bodyStyles: {
      fontSize: 8,
      textColor: tableTextColor,
      cellPadding: 4,
      lineColor: borderColor,
      lineWidth: 0.2,
    },
    alternateRowStyles: {
      fillColor: [252, 253, 254],
    },
    columnStyles,
    margin: { left: margin, right: margin },
    tableLineColor: borderColor,
    tableLineWidth: 0.2,
    didDrawPage: (data) => {
      const pageNum = doc.getCurrentPageInfo().pageNumber;
      doc.setFontSize(7);
      doc.setTextColor(...mutedText);
      doc.text(`Page ${pageNum}`, pageWidth / 2, pageHeight - 8, { align: "center" });
    },
  });

  yPos = (doc as any).lastAutoTable.finalY + 8;

  // Check if we need a new page for totals section
  if (yPos > pageHeight - 90) {
    doc.addPage();
    yPos = margin;
  }

  // ===== TOTALS & AMOUNT IN WORDS SECTION =====
  const totalsWidth = 85;
  const totalsX = pageWidth - margin - totalsWidth;
  const wordsWidth = pageWidth - margin * 2 - totalsWidth - 8;

  // Amount in words box (left side)
  if (template.show_amount_words) {
    doc.setFillColor(...lightBg);
    doc.setDrawColor(...borderColor);
    doc.roundedRect(margin, yPos, wordsWidth, 36, 2, 2, "FD");
    
    addText("AMOUNT IN WORDS", margin + 6, yPos + 8, {
      fontSize: 7,
      fontStyle: "bold",
      color: secondaryColor,
    });
    
    const amountWords = invoice.amount_in_words || numberToWords(invoice.grand_total);
    addText(amountWords, margin + 6, yPos + 16, {
      fontSize: 9,
      fontStyle: "italic",
      color: darkText,
      maxWidth: wordsWidth - 12,
    });
  }

  // Totals box (right side)
  doc.setFillColor(...lightBg);
  doc.setDrawColor(...borderColor);
  
  const hasDiscount = invoice.discount_amount > 0;
  const hasRoundOff = Math.abs(invoice.round_off) > 0.001;
  const totalsBoxHeight = 36 + (hasDiscount ? 6 : 0) + (hasRoundOff ? 6 : 0);
  
  doc.roundedRect(totalsX, yPos, totalsWidth, totalsBoxHeight, 2, 2, "FD");

  const totalsLabelX = totalsX + 6;
  const totalsValueX = totalsX + totalsWidth - 6;
  let totalsY = yPos + 8;

  const addTotalRow = (label: string, value: string, isBold = false) => {
    addText(label, totalsLabelX, totalsY, {
      fontSize: 8,
      color: mutedText,
    });
    addText(value, totalsValueX, totalsY, {
      fontSize: isBold ? 9 : 8,
      fontStyle: isBold ? "bold" : "normal",
      color: isBold ? primaryColor : darkText,
      align: "right",
    });
    totalsY += 6;
  };

  addTotalRow("Subtotal:", formatCurrency(invoice.subtotal));
  
  if (hasDiscount) {
    addTotalRow(`Discount (${invoice.discount_percent}%):`, `-${formatCurrency(invoice.discount_amount)}`);
  }
  
  addTotalRow(`GST (${invoice.tax_rate}%):`, formatCurrency(invoice.tax_amount));

  if (hasRoundOff) {
    addTotalRow("Round Off:", formatCurrency(invoice.round_off));
  }

  // Grand total highlight bar
  totalsY += 2;
  doc.setFillColor(...primaryColor);
  doc.roundedRect(totalsX, totalsY - 3, totalsWidth, 12, 0, 0, "F");
  
  addText("GRAND TOTAL", totalsLabelX, totalsY + 4, {
    fontSize: 8,
    fontStyle: "bold",
    color: [255, 255, 255],
  });
  addText(formatCurrency(invoice.grand_total), totalsValueX, totalsY + 4, {
    fontSize: 10,
    fontStyle: "bold",
    color: [255, 255, 255],
    align: "right",
  });

  yPos += Math.max(totalsBoxHeight, 36) + 8;

  // ===== BANK DETAILS =====
  if (template.bank_name) {
    doc.setFillColor(...lightBg);
    doc.setDrawColor(...borderColor);
    doc.roundedRect(margin, yPos, pageWidth - margin * 2, 20, 2, 2, "FD");
    
    addText("BANK DETAILS", margin + 6, yPos + 7, {
      fontSize: 7,
      fontStyle: "bold",
      color: secondaryColor,
    });

    const bankDetails = [
      template.bank_name,
      template.bank_account_no ? `A/C: ${template.bank_account_no}` : null,
      template.bank_ifsc ? `IFSC: ${template.bank_ifsc}` : null,
      template.bank_branch ? `Branch: ${template.bank_branch}` : null,
    ].filter(Boolean).join("  |  ");

    addText(bankDetails, margin + 6, yPos + 14, {
      fontSize: 8,
      color: darkText,
      maxWidth: pageWidth - margin * 2 - 12,
    });

    yPos += 24;
  }

  // ===== FOOTER SECTION =====
  const footerStartY = pageHeight - 38;

  // Only draw footer if we have space
  if (yPos < footerStartY - 10) {
    // Separator line
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.4);
    doc.line(margin, footerStartY - 6, pageWidth - margin, footerStartY - 6);

    // Terms & Conditions (left side)
    if (template.show_terms) {
      addText("Terms & Conditions", margin, footerStartY, {
        fontSize: 7,
        fontStyle: "bold",
        color: darkText,
      });
      
      let termY = footerStartY + 5;
      const terms = [template.terms_line1, template.terms_line2, template.terms_line3].filter(Boolean);
      terms.forEach((term, idx) => {
        addText(`${idx + 1}. ${term}`, margin, termY, { fontSize: 6, color: mutedText });
        termY += 4;
      });
    }

    // Signature section (right side)
    if (template.show_signature) {
      const sigX = pageWidth - margin - 45;
      
      addText(`For ${company.name}`, sigX + 22, footerStartY - 2, {
        fontSize: 7,
        fontStyle: "bold",
        color: darkText,
        align: "center",
      });

      // Signature line
      doc.setDrawColor(...darkText);
      doc.setLineWidth(0.3);
      doc.line(sigX, footerStartY + 12, pageWidth - margin, footerStartY + 12);
      
      addText("Authorized Signatory", sigX + 22, footerStartY + 17, {
        fontSize: 6,
        color: mutedText,
        align: "center",
      });
    }

    // Custom footer text (centered at bottom)
    if (template.custom_footer_text) {
      addText(template.custom_footer_text, pageWidth / 2, pageHeight - 12, {
        fontSize: 7,
        fontStyle: "italic",
        color: mutedText,
        align: "center",
      });
    }
  }

  // Return base64 or save PDF
  if (options.returnBase64) {
    return doc.output("datauristring").split(",")[1];
  }

  doc.save(`Invoice-${invoice.invoice_no}.pdf`);
}

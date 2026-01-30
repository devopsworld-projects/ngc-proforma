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
  const margin = 15;
  let yPos = margin;

  // Merge template settings with defaults
  const template = { ...defaultPdfTemplateSettings, ...options.templateSettings };

  // Colors - simple palette
  const primaryColor = hexToRgb(template.primary_color);
  const tableTextColor = hexToRgb(template.table_text_color);
  const darkText: [number, number, number] = [0, 0, 0]; // Pure black
  const mutedText: [number, number, number] = [80, 80, 80]; // Dark gray for secondary text
  const borderColor: [number, number, number] = [200, 200, 200];

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

  // ===== HEADER - SIMPLE WHITE LAYOUT =====
  
  // Logo on left (vertically centered with company info)
  const logoSize = 28;
  let logoEndX = margin;
  let hasLogo = false;
  
  if (template.show_logo && company.logo_url) {
    const logoBase64 = await loadImageAsBase64(company.logo_url);
    if (logoBase64) {
      try {
        doc.addImage(logoBase64, "PNG", margin, yPos, logoSize, logoSize);
        logoEndX = margin + logoSize + 10;
        hasLogo = true;
      } catch (e) {
        console.warn("Failed to add logo:", e);
      }
    }
  }

  // Company name - aligned with logo center
  const companyNameY = hasLogo ? yPos + 10 : yPos + 8;
  addText(company.name.toUpperCase(), logoEndX, companyNameY, {
    fontSize: 16,
    fontStyle: "bold",
    color: primaryColor,
  });

  // Company details under name
  let companyY = companyNameY + 6;
  if (template.show_gstin_header && company.gstin) {
    addText(`GSTIN: ${company.gstin}`, logoEndX, companyY, {
      fontSize: 9,
      color: mutedText,
    });
    companyY += 5;
  }

  // Contact info on right
  if (template.show_contact_header) {
    const rightX = pageWidth - margin;
    let contactY = yPos + 5;
    
    if (company.phone && company.phone.length > 0) {
      addText(`Phone: ${company.phone[0]}`, rightX, contactY, {
        fontSize: 9,
        color: darkText,
        align: "right",
      });
      contactY += 5;
    }
    if (company.email) {
      addText(company.email, rightX, contactY, {
        fontSize: 9,
        color: darkText,
        align: "right",
      });
      contactY += 5;
    }
    
    const addressParts = [company.city, company.state, company.postal_code].filter(Boolean);
    if (addressParts.length > 0) {
      addText(addressParts.join(", "), rightX, contactY, {
        fontSize: 9,
        color: mutedText,
        align: "right",
      });
    }
  }

  yPos += hasLogo ? 35 : 30;

  // Separator line
  doc.setDrawColor(...borderColor);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  
  yPos += 8;

  // No TAX INVOICE title - clean layout

  // ===== INVOICE DETAILS & BILL TO - TWO COLUMNS =====
  const colWidth = (pageWidth - margin * 2 - 20) / 2;
  const leftColX = margin;
  const rightColX = margin + colWidth + 20;

  // Proforma Invoice Details (Left)
  addText("Proforma Invoice Details", leftColX, yPos, {
    fontSize: 10,
    fontStyle: "bold",
    color: darkText,
  });

  let detailY = yPos + 7;
  const invoiceDate = new Date(invoice.date).toLocaleDateString("en-IN", { 
    day: "2-digit", 
    month: "short", 
    year: "numeric" 
  });

  const addDetailLine = (label: string, value: string) => {
    addText(label, leftColX, detailY, { fontSize: 9, color: mutedText });
    addText(value, leftColX + 35, detailY, { fontSize: 9, fontStyle: "bold", color: darkText });
    detailY += 5;
  };

  addDetailLine("Proforma No:", invoice.invoice_no);
  addDetailLine("Date:", invoiceDate);
  if (invoice.e_way_bill_no) addDetailLine("e-Way Bill:", invoice.e_way_bill_no);
  if (invoice.supplier_invoice_no) addDetailLine("Supplier Inv:", invoice.supplier_invoice_no);
  if (invoice.other_references) addDetailLine("Reference:", invoice.other_references.substring(0, 30));

  // Bill To (Right)
  addText("Bill To", rightColX, yPos, {
    fontSize: 10,
    fontStyle: "bold",
    color: darkText,
  });

  let billY = yPos + 7;
  if (invoice.customer) {
    addText(invoice.customer.name, rightColX, billY, {
      fontSize: 10,
      fontStyle: "bold",
      color: darkText,
      maxWidth: colWidth,
    });
    billY += 6;

    if (invoice.billing_address) {
      const addr = invoice.billing_address;
      if (addr.address_line1) {
        addText(addr.address_line1, rightColX, billY, { fontSize: 9, color: mutedText, maxWidth: colWidth });
        billY += 5;
      }
      if (addr.address_line2) {
        addText(addr.address_line2, rightColX, billY, { fontSize: 9, color: mutedText, maxWidth: colWidth });
        billY += 5;
      }
      const cityLine = [addr.city, addr.state, addr.postal_code].filter(Boolean).join(", ");
      if (cityLine) {
        addText(cityLine, rightColX, billY, { fontSize: 9, color: mutedText, maxWidth: colWidth });
        billY += 5;
      }
    }

    if (invoice.customer.gstin) {
      addText(`GSTIN: ${invoice.customer.gstin}`, rightColX, billY, {
        fontSize: 9,
        color: darkText,
      });
      billY += 5;
    }

    if (invoice.customer.state) {
      const stateInfo = invoice.customer.state_code 
        ? `${invoice.customer.state} (${invoice.customer.state_code})`
        : invoice.customer.state;
      addText(`State: ${stateInfo}`, rightColX, billY, {
        fontSize: 9,
        color: mutedText,
      });
    }
  }

  yPos = Math.max(detailY, billY) + 10;

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
    4: { cellWidth: 28, halign: "right" },
  };

  if (showDiscount) {
    columnStyles[5] = { cellWidth: 16, halign: "center" };
    columnStyles[6] = { cellWidth: 32, halign: "right", fontStyle: "bold" };
  } else {
    columnStyles[5] = { cellWidth: 32, halign: "right", fontStyle: "bold" };
  }

  autoTable(doc, {
    startY: yPos,
    head: tableHead,
    body: tableData,
    theme: "plain",
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: darkText,
      fontStyle: "bold",
      fontSize: 9,
      cellPadding: 4,
      halign: "center",
      lineWidth: 0.3,
      lineColor: borderColor,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: tableTextColor,
      cellPadding: 4,
      lineColor: borderColor,
      lineWidth: 0.2,
    },
    alternateRowStyles: {
      fillColor: [255, 255, 255],
    },
    columnStyles,
    margin: { left: margin, right: margin },
    tableLineColor: borderColor,
    tableLineWidth: 0.3,
    didDrawPage: (data) => {
      const pageNum = doc.getCurrentPageInfo().pageNumber;
      doc.setFontSize(8);
      doc.setTextColor(...mutedText);
      doc.text(`Page ${pageNum}`, pageWidth / 2, pageHeight - 10, { align: "center" });
    },
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Check if we need a new page
  if (yPos > pageHeight - 80) {
    doc.addPage();
    yPos = margin;
  }

  // ===== TOTALS SECTION (Right aligned) =====
  const totalsX = pageWidth - margin - 80;
  const totalsValueX = pageWidth - margin;
  let totalsY = yPos;

  // Separator line above totals
  doc.setDrawColor(...borderColor);
  doc.setLineWidth(0.3);
  doc.line(totalsX - 10, totalsY - 3, pageWidth - margin, totalsY - 3);

  const addTotalLine = (label: string, value: string, isBold = false) => {
    addText(label, totalsX, totalsY, {
      fontSize: 9,
      color: mutedText,
    });
    addText(value, totalsValueX, totalsY, {
      fontSize: isBold ? 11 : 9,
      fontStyle: isBold ? "bold" : "normal",
      color: isBold ? primaryColor : darkText,
      align: "right",
    });
    totalsY += 6;
  };

  addTotalLine("Subtotal:", formatCurrency(invoice.subtotal));
  
  if (invoice.discount_amount > 0) {
    addTotalLine(`Discount (${invoice.discount_percent}%):`, `-${formatCurrency(invoice.discount_amount)}`);
  }
  
  addTotalLine(`GST (${invoice.tax_rate}%):`, formatCurrency(invoice.tax_amount));

  if (Math.abs(invoice.round_off) > 0.001) {
    addTotalLine("Round Off:", formatCurrency(invoice.round_off));
  }

  // Grand total with line
  totalsY += 2;
  doc.setDrawColor(...borderColor);
  doc.line(totalsX - 10, totalsY - 3, pageWidth - margin, totalsY - 3);
  addTotalLine("GRAND TOTAL:", formatCurrency(invoice.grand_total), true);

  // Amount in words (left side, same row as totals start)
  if (template.show_amount_words) {
    const amountWords = invoice.amount_in_words || numberToWords(invoice.grand_total);
    addText("Amount in Words:", margin, yPos, {
      fontSize: 9,
      fontStyle: "bold",
      color: darkText,
    });
    addText(amountWords, margin, yPos + 6, {
      fontSize: 9,
      fontStyle: "italic",
      color: mutedText,
      maxWidth: totalsX - margin - 20,
    });
  }

  yPos = totalsY + 10;

  // ===== BANK DETAILS =====
  if (template.bank_name) {
    doc.setDrawColor(...borderColor);
    doc.line(margin, yPos - 3, pageWidth - margin, yPos - 3);
    
    addText("Bank Details:", margin, yPos + 3, {
      fontSize: 9,
      fontStyle: "bold",
      color: darkText,
    });

    const bankInfo = [
      template.bank_name,
      template.bank_account_no ? `A/C: ${template.bank_account_no}` : null,
      template.bank_ifsc ? `IFSC: ${template.bank_ifsc}` : null,
      template.bank_branch ? `Branch: ${template.bank_branch}` : null,
    ].filter(Boolean).join("  |  ");

    addText(bankInfo, margin, yPos + 10, {
      fontSize: 9,
      color: mutedText,
      maxWidth: pageWidth - margin * 2,
    });

    yPos += 20;
  }

  // ===== FOOTER SECTION =====
  const footerY = pageHeight - 35;

  // Separator line
  doc.setDrawColor(...borderColor);
  doc.setLineWidth(0.3);
  doc.line(margin, footerY - 8, pageWidth - margin, footerY - 8);

  // Terms & Conditions
  if (template.show_terms) {
    addText("Terms & Conditions:", margin, footerY - 2, {
      fontSize: 8,
      fontStyle: "bold",
      color: darkText,
    });
    
    let termY = footerY + 4;
    const terms = [template.terms_line1, template.terms_line2, template.terms_line3].filter(Boolean);
    terms.forEach((term, idx) => {
      addText(`${idx + 1}. ${term}`, margin, termY, { fontSize: 7, color: mutedText });
      termY += 4;
    });
  }

  // Signature section (right side)
  if (template.show_signature) {
    const sigX = pageWidth - margin - 40;
    
    addText(`For ${company.name}`, sigX + 20, footerY - 4, {
      fontSize: 8,
      fontStyle: "bold",
      color: darkText,
      align: "center",
    });

    doc.setDrawColor(...darkText);
    doc.setLineWidth(0.3);
    doc.line(sigX, footerY + 10, pageWidth - margin, footerY + 10);
    
    addText("Authorized Signatory", sigX + 20, footerY + 15, {
      fontSize: 7,
      color: mutedText,
      align: "center",
    });
  }

  // Custom footer text
  if (template.custom_footer_text) {
    addText(template.custom_footer_text, pageWidth / 2, pageHeight - 12, {
      fontSize: 8,
      fontStyle: "italic",
      color: mutedText,
      align: "center",
    });
  }

  // Return base64 or save PDF
  if (options.returnBase64) {
    return doc.output("datauristring").split(",")[1];
  }

  doc.save(`Invoice-${invoice.invoice_no}.pdf`);
}

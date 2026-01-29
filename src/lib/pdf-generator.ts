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
    : [41, 65, 114]; // fallback to default primary
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

  // Colors from template settings
  const primaryColor = hexToRgb(template.primary_color);
  const secondaryColor = hexToRgb(template.secondary_color);
  const headerTextColor = hexToRgb(template.header_text_color);
  const tableTextColor = hexToRgb(template.table_text_color);
  const darkText: [number, number, number] = [31, 41, 55];
  const mutedText: [number, number, number] = [107, 114, 128];
  const lightBg: [number, number, number] = [248, 250, 252];
  const borderColor: [number, number, number] = [226, 232, 240];

  // Helper to add text with proper sizing
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

  // ===== HEADER WITH LOGO AND COMPANY INFO =====
  const headerHeight = 45;
  
  // Header background
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, headerHeight, "F");

  // Try to load and add company logo
  let logoEndX = margin;
  if (template.show_logo && company.logo_url) {
    const logoBase64 = await loadImageAsBase64(company.logo_url);
    if (logoBase64) {
      try {
        const logoSize = 25;
        doc.addImage(logoBase64, "PNG", margin, 10, logoSize, logoSize);
        logoEndX = margin + logoSize + 8;
      } catch (e) {
        console.warn("Failed to add logo:", e);
      }
    }
  }

  // Company name
  addText(company.name.toUpperCase(), logoEndX, 20, {
    fontSize: 16,
    fontStyle: "bold",
    color: headerTextColor,
  });

  // Company GSTIN under name
  if (template.show_gstin_header && company.gstin) {
    addText(`GSTIN: ${company.gstin}`, logoEndX, 28, {
      fontSize: 9,
      color: [Math.min(headerTextColor[0] + 40, 255), Math.min(headerTextColor[1] + 40, 255), Math.min(headerTextColor[2] + 40, 255)],
    });
  }

  // Company contact on right side of header
  if (template.show_contact_header) {
    const rightX = pageWidth - margin;
    let contactY = 15;
    const contactColor: [number, number, number] = [Math.min(headerTextColor[0] + 40, 255), Math.min(headerTextColor[1] + 40, 255), Math.min(headerTextColor[2] + 40, 255)];
    
    if (company.phone && company.phone.length > 0) {
      addText(company.phone[0], rightX, contactY, {
        fontSize: 9,
        color: contactColor,
        align: "right",
      });
      contactY += 5;
    }
    if (company.email) {
      addText(company.email, rightX, contactY, {
        fontSize: 9,
        color: contactColor,
        align: "right",
      });
      contactY += 5;
    }
    if (company.website) {
      addText(company.website, rightX, contactY, {
        fontSize: 9,
        color: contactColor,
        align: "right",
      });
      contactY += 5;
    }
    
    // Company address in header
    const addressParts = [company.address_line1, company.city, company.state, company.postal_code].filter(Boolean);
    if (addressParts.length > 0) {
      addText(addressParts.join(", "), rightX, contactY, {
        fontSize: 8,
        color: [Math.min(headerTextColor[0] + 60, 255), Math.min(headerTextColor[1] + 60, 255), Math.min(headerTextColor[2] + 60, 255)],
        align: "right",
      });
    }
  }

  yPos = headerHeight + 15;

  // ===== INVOICE TITLE BAR =====
  doc.setFillColor(...secondaryColor);
  doc.rect(margin, yPos - 5, pageWidth - margin * 2, 14, "F");
  
  addText("TAX INVOICE", margin + 8, yPos + 4, {
    fontSize: 12,
    fontStyle: "bold",
    color: [255, 255, 255],
  });

  // Invoice number and date on right
  addText(`#${invoice.invoice_no}`, pageWidth - margin - 8, yPos + 4, {
    fontSize: 11,
    fontStyle: "bold",
    color: [255, 255, 255],
    align: "right",
  });

  yPos += 20;

  // ===== BILLING INFO SECTION =====
  const colWidth = (pageWidth - margin * 2 - 10) / 2;
  const leftColX = margin;
  const rightColX = margin + colWidth + 10;

  // Bill To Box
  doc.setFillColor(...lightBg);
  doc.setDrawColor(...borderColor);
  doc.roundedRect(leftColX, yPos, colWidth, 45, 3, 3, "FD");

  addText("BILL TO", leftColX + 8, yPos + 8, {
    fontSize: 8,
    fontStyle: "bold",
    color: secondaryColor,
  });

  let billY = yPos + 16;
  if (invoice.customer) {
    addText(invoice.customer.name, leftColX + 8, billY, {
      fontSize: 11,
      fontStyle: "bold",
      color: darkText,
      maxWidth: colWidth - 16,
    });
    billY += 7;

    if (invoice.billing_address) {
      const addr = invoice.billing_address;
      if (addr.address_line1) {
        addText(addr.address_line1, leftColX + 8, billY, {
          fontSize: 9,
          color: mutedText,
          maxWidth: colWidth - 16,
        });
        billY += 5;
      }
      if (addr.address_line2) {
        addText(addr.address_line2, leftColX + 8, billY, {
          fontSize: 9,
          color: mutedText,
          maxWidth: colWidth - 16,
        });
        billY += 5;
      }
      const cityLine = [addr.city, addr.state, addr.postal_code].filter(Boolean).join(", ");
      if (cityLine) {
        addText(cityLine, leftColX + 8, billY, {
          fontSize: 9,
          color: mutedText,
          maxWidth: colWidth - 16,
        });
        billY += 5;
      }
    }

    if (invoice.customer.gstin) {
      addText(`GSTIN: ${invoice.customer.gstin}`, leftColX + 8, billY, {
        fontSize: 9,
        color: mutedText,
      });
    }
  }

  // Invoice Details Box
  doc.setFillColor(...lightBg);
  doc.roundedRect(rightColX, yPos, colWidth, 45, 3, 3, "FD");

  addText("INVOICE DETAILS", rightColX + 8, yPos + 8, {
    fontSize: 8,
    fontStyle: "bold",
    color: secondaryColor,
  });

  const detailLabelX = rightColX + 8;
  const detailValueX = rightColX + colWidth - 8;
  let detailY = yPos + 18;

  const addDetailRow = (label: string, value: string) => {
    addText(label, detailLabelX, detailY, { fontSize: 9, color: mutedText });
    addText(value, detailValueX, detailY, { fontSize: 9, fontStyle: "bold", color: darkText, align: "right" });
    detailY += 7;
  };

  addDetailRow("Invoice Date:", new Date(invoice.date).toLocaleDateString("en-IN", { 
    day: "2-digit", 
    month: "short", 
    year: "numeric" 
  }));
  
  if (invoice.e_way_bill_no) {
    addDetailRow("e-Way Bill:", invoice.e_way_bill_no);
  }
  
  if (invoice.supplier_invoice_no) {
    addDetailRow("Supplier Inv:", invoice.supplier_invoice_no);
  }

  if (invoice.other_references) {
    addDetailRow("Reference:", invoice.other_references.substring(0, 20));
  }

  yPos += 55;

  // ===== ITEMS TABLE =====
  const showDiscount = template.show_discount_column;
  const showSerial = template.show_serial_numbers;

  const tableData = invoice.items.map((item, idx) => {
    let desc = item.description;
    if (showSerial && item.serial_numbers?.length) {
      desc += `\n(S/N: ${item.serial_numbers.slice(0, 2).join(", ")}${item.serial_numbers.length > 2 ? "..." : ""})`;
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
    0: { cellWidth: 12, halign: "center" },
    1: { cellWidth: "auto", halign: "left" },
    2: { cellWidth: 18, halign: "center" },
    3: { cellWidth: 18, halign: "center" },
    4: { cellWidth: 28, halign: "right" },
  };

  if (showDiscount) {
    columnStyles[5] = { cellWidth: 18, halign: "center" };
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
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 9,
      cellPadding: 5,
      halign: "center",
    },
    bodyStyles: {
      fontSize: 9,
      textColor: tableTextColor,
      cellPadding: 5,
      lineColor: borderColor,
      lineWidth: 0.1,
    },
    alternateRowStyles: {
      fillColor: [252, 252, 253],
    },
    columnStyles,
    margin: { left: margin, right: margin },
    didDrawPage: (data) => {
      const pageNum = doc.getCurrentPageInfo().pageNumber;
      doc.setFontSize(8);
      doc.setTextColor(...mutedText);
      doc.text(`Page ${pageNum}`, pageWidth / 2, pageHeight - 10, { align: "center" });
    },
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Check if we need a new page for totals
  if (yPos > pageHeight - 100) {
    doc.addPage();
    yPos = margin;
  }

  // ===== TOTALS SECTION =====
  const totalsWidth = 90;
  const totalsX = pageWidth - margin - totalsWidth;
  const totalsLabelX = totalsX + 5;
  const totalsValueX = pageWidth - margin - 5;

  // Totals box background
  doc.setFillColor(...lightBg);
  doc.setDrawColor(...borderColor);
  const totalsBoxHeight = invoice.discount_amount > 0 ? 60 : 50;
  doc.roundedRect(totalsX, yPos, totalsWidth, totalsBoxHeight, 2, 2, "FD");

  let totalsY = yPos + 10;

  const addTotalRow = (label: string, value: string, bold = false) => {
    addText(label, totalsLabelX, totalsY, {
      fontSize: 9,
      color: mutedText,
    });
    addText(value, totalsValueX, totalsY, {
      fontSize: bold ? 11 : 9,
      fontStyle: bold ? "bold" : "normal",
      color: bold ? primaryColor : darkText,
      align: "right",
    });
    totalsY += 8;
  };

  addTotalRow("Subtotal:", formatCurrency(invoice.subtotal));
  
  if (invoice.discount_amount > 0) {
    addTotalRow(`Discount (${invoice.discount_percent}%):`, `-${formatCurrency(invoice.discount_amount)}`);
  }
  
  addTotalRow(`Tax (${invoice.tax_rate}%):`, formatCurrency(invoice.tax_amount));

  if (Math.abs(invoice.round_off) > 0.001) {
    addTotalRow("Round Off:", formatCurrency(invoice.round_off));
  }

  // Grand total highlight
  totalsY += 2;
  doc.setFillColor(...primaryColor);
  doc.roundedRect(totalsX, totalsY - 5, totalsWidth, 14, 2, 2, "F");
  
  addText("TOTAL:", totalsLabelX, totalsY + 3, {
    fontSize: 10,
    fontStyle: "bold",
    color: [255, 255, 255],
  });
  addText(formatCurrency(invoice.grand_total), totalsValueX, totalsY + 3, {
    fontSize: 11,
    fontStyle: "bold",
    color: [255, 255, 255],
    align: "right",
  });

  // Amount in words (left side)
  if (template.show_amount_words) {
    const amountWords = invoice.amount_in_words || numberToWords(invoice.grand_total);
    addText("Amount in Words:", margin, yPos + 5, {
      fontSize: 8,
      fontStyle: "bold",
      color: secondaryColor,
    });
    addText(amountWords, margin, yPos + 12, {
      fontSize: 9,
      fontStyle: "italic",
      color: darkText,
      maxWidth: totalsX - margin - 15,
    });
  }

  yPos += totalsBoxHeight + 15;

  // ===== BANK DETAILS =====
  if (template.bank_name) {
    doc.setFillColor(...lightBg);
    doc.setDrawColor(...borderColor);
    doc.roundedRect(margin, yPos, pageWidth - margin * 2, 25, 2, 2, "FD");
    
    addText("BANK DETAILS", margin + 8, yPos + 8, {
      fontSize: 8,
      fontStyle: "bold",
      color: secondaryColor,
    });

    let bankY = yPos + 16;
    const bankDetails = [
      template.bank_name,
      template.bank_account_no ? `A/C: ${template.bank_account_no}` : null,
      template.bank_ifsc ? `IFSC: ${template.bank_ifsc}` : null,
      template.bank_branch ? `Branch: ${template.bank_branch}` : null,
    ].filter(Boolean).join(" | ");

    addText(bankDetails, margin + 8, bankY, {
      fontSize: 9,
      color: darkText,
      maxWidth: pageWidth - margin * 2 - 16,
    });

    yPos += 30;
  }

  // Check for new page
  if (yPos > pageHeight - 50) {
    doc.addPage();
    yPos = margin;
  }

  // ===== FOOTER SECTION =====
  const footerY = pageHeight - 45;

  // Separator line
  doc.setDrawColor(...borderColor);
  doc.setLineWidth(0.5);
  doc.line(margin, footerY - 15, pageWidth - margin, footerY - 15);

  // Terms & Conditions
  if (template.show_terms) {
    addText("Terms & Conditions:", margin, footerY - 8, {
      fontSize: 8,
      fontStyle: "bold",
      color: darkText,
    });
    
    let termY = footerY - 2;
    if (template.terms_line1) {
      addText(`1. ${template.terms_line1}`, margin, termY, { fontSize: 7, color: mutedText });
      termY += 4;
    }
    if (template.terms_line2) {
      addText(`2. ${template.terms_line2}`, margin, termY, { fontSize: 7, color: mutedText });
      termY += 4;
    }
    if (template.terms_line3) {
      addText(`3. ${template.terms_line3}`, margin, termY, { fontSize: 7, color: mutedText });
    }
  }

  // Custom footer text
  if (template.custom_footer_text) {
    addText(template.custom_footer_text, margin, footerY + 15, {
      fontSize: 8,
      fontStyle: "italic",
      color: mutedText,
    });
  }

  // Signature section
  if (template.show_signature) {
    const sigX = pageWidth - margin - 50;
    doc.setDrawColor(...darkText);
    doc.setLineWidth(0.3);
    doc.line(sigX - 10, footerY + 5, pageWidth - margin, footerY + 5);
    addText("Authorized Signatory", sigX, footerY + 12, {
      fontSize: 8,
      color: mutedText,
      align: "center",
    });

    // Company name in footer
    addText(`For ${company.name}`, sigX, footerY - 5, {
      fontSize: 8,
      fontStyle: "bold",
      color: darkText,
      align: "center",
    });
  }

  // Return base64 or save PDF
  if (options.returnBase64) {
    return doc.output("datauristring").split(",")[1];
  }

  doc.save(`Invoice-${invoice.invoice_no}.pdf`);
}

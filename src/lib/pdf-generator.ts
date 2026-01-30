import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatCurrency, numberToWords } from "./invoice-utils";
import { PdfTemplateSettings, defaultPdfTemplateSettings } from "@/hooks/usePdfTemplateSettings";

interface InvoiceItem {
  sl_no: number;
  brand?: string | null;
  description: string;
  serial_numbers?: string[] | null;
  quantity: number;
  unit: string;
  rate: number;
  discount_percent: number;
  amount: number;
  product_image?: string | null;
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
  email?: string | null;
  phone?: string | null;
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

  // ===== HEADER - ORGANIZATION DETAILS (CENTERED) =====
  
  // Logo centered at top
  const logoSize = 24;
  let hasLogo = false;
  
  if (template.show_logo && company.logo_url) {
    const logoBase64 = await loadImageAsBase64(company.logo_url);
    if (logoBase64) {
      try {
        const logoX = (pageWidth - logoSize) / 2;
        doc.addImage(logoBase64, "PNG", logoX, yPos, logoSize, logoSize);
        hasLogo = true;
        yPos += logoSize + 4;
      } catch (e) {
        console.warn("Failed to add logo:", e);
      }
    }
  }

  // Company name - centered
  addText(company.name.toUpperCase(), pageWidth / 2, yPos, {
    fontSize: 16,
    fontStyle: "bold",
    color: primaryColor,
    align: "center",
  });
  yPos += 7;

  // Company address - centered
  const addressParts = [company.address_line1, company.address_line2].filter(Boolean);
  if (addressParts.length > 0) {
    addText(addressParts.join(", "), pageWidth / 2, yPos, {
      fontSize: 9,
      color: mutedText,
      align: "center",
    });
    yPos += 5;
  }
  
  const cityLine = [company.city, company.state, company.postal_code].filter(Boolean).join(", ");
  if (cityLine) {
    addText(cityLine, pageWidth / 2, yPos, {
      fontSize: 9,
      color: mutedText,
      align: "center",
    });
    yPos += 5;
  }

  // Contact info - centered
  if (template.show_contact_header) {
    const contactParts = [];
    if (company.phone && company.phone.length > 0) {
      contactParts.push(`Phone: ${company.phone.join(", ")}`);
    }
    if (company.email) {
      contactParts.push(`Email: ${company.email}`);
    }
    if (company.website) {
      contactParts.push(company.website);
    }
    if (contactParts.length > 0) {
      addText(contactParts.join("  |  "), pageWidth / 2, yPos, {
        fontSize: 8,
        color: mutedText,
        align: "center",
      });
      yPos += 5;
    }
  }

  // GSTIN - centered
  if (template.show_gstin_header && company.gstin) {
    addText(`GSTIN: ${company.gstin}`, pageWidth / 2, yPos, {
      fontSize: 9,
      fontStyle: "bold",
      color: darkText,
      align: "center",
    });
    yPos += 5;
  }

  yPos += 3;

  // Separator line
  doc.setDrawColor(...borderColor);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  
  yPos += 8;

  // ===== PROFORMA INVOICE TITLE =====
  addText("PROFORMA INVOICE", pageWidth / 2, yPos, {
    fontSize: 14,
    fontStyle: "bold",
    color: primaryColor,
    align: "center",
  });
  yPos += 10;

  // ===== CUSTOMER DETAILS (LEFT) & INVOICE INFO (RIGHT) =====
  const colWidth = (pageWidth - margin * 2 - 20) / 2;
  const leftColX = margin;
  const rightColX = margin + colWidth + 20;

  // Bill To (Left)
  addText("Bill To:", leftColX, yPos, {
    fontSize: 10,
    fontStyle: "bold",
    color: darkText,
  });

  let billY = yPos + 7;
  if (invoice.customer) {
    addText(invoice.customer.name, leftColX, billY, {
      fontSize: 10,
      fontStyle: "bold",
      color: darkText,
      maxWidth: colWidth,
    });
    billY += 6;

    if (invoice.billing_address) {
      const addr = invoice.billing_address;
      if (addr.address_line1) {
        addText(addr.address_line1, leftColX, billY, { fontSize: 9, color: mutedText, maxWidth: colWidth });
        billY += 5;
      }
      if (addr.address_line2) {
        addText(addr.address_line2, leftColX, billY, { fontSize: 9, color: mutedText, maxWidth: colWidth });
        billY += 5;
      }
      const addrCityLine = [addr.city, addr.state, addr.postal_code].filter(Boolean).join(", ");
      if (addrCityLine) {
        addText(addrCityLine, leftColX, billY, { fontSize: 9, color: mutedText, maxWidth: colWidth });
        billY += 5;
      }
    }

    if (invoice.customer.phone) {
      addText(`Phone: ${invoice.customer.phone}`, leftColX, billY, {
        fontSize: 9,
        color: mutedText,
      });
      billY += 5;
    }

    if (invoice.customer.email) {
      addText(`Email: ${invoice.customer.email}`, leftColX, billY, {
        fontSize: 9,
        color: mutedText,
      });
      billY += 5;
    }

    if (invoice.customer.gstin) {
      addText(`GSTIN: ${invoice.customer.gstin}`, leftColX, billY, {
        fontSize: 9,
        color: darkText,
      });
      billY += 5;
    }

    if (invoice.customer.state) {
      const stateInfo = invoice.customer.state_code 
        ? `${invoice.customer.state} (${invoice.customer.state_code})`
        : invoice.customer.state;
      addText(`State: ${stateInfo}`, leftColX, billY, {
        fontSize: 9,
        color: mutedText,
      });
      billY += 5;
    }
  }

  // Invoice Details (Right)
  addText("Invoice Details:", rightColX, yPos, {
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
    addText(label, rightColX, detailY, { fontSize: 9, color: mutedText });
    addText(value, rightColX + 35, detailY, { fontSize: 9, fontStyle: "bold", color: darkText });
    detailY += 5;
  };

  addDetailLine("Proforma No:", invoice.invoice_no);
  addDetailLine("Date:", invoiceDate);
  if (invoice.e_way_bill_no) addDetailLine("e-Way Bill:", invoice.e_way_bill_no);
  if (invoice.supplier_invoice_no) addDetailLine("Supplier Inv:", invoice.supplier_invoice_no);
  if (invoice.other_references) addDetailLine("Reference:", invoice.other_references.substring(0, 30));

  yPos = Math.max(detailY, billY) + 10;

  // ===== ITEMS TABLE =====
  const tableData = invoice.items.map((item, idx) => {
    const row: string[] = [
      (idx + 1).toString(),
      item.brand || "-",
      item.description,
      `${item.quantity} ${item.unit}`,
      formatCurrency(item.rate),
      item.product_image ? "[Image]" : "-",
    ];
    
    return row;
  });

  const tableHead = [["#", "Brand", "Description", "Qty", "Unit Price", "Image"]];

  const columnStyles: any = {
    0: { cellWidth: 10, halign: "center" },
    1: { cellWidth: 30, halign: "left" },
    2: { cellWidth: "auto", halign: "left" },
    3: { cellWidth: 22, halign: "center" },
    4: { cellWidth: 30, halign: "right" },
    5: { cellWidth: 18, halign: "center" },
  };

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

  // Check if we need a new page for footer content
  if (yPos > pageHeight - 70) {
    doc.addPage();
    yPos = margin;
  }

  // ===== TERMS & CONDITIONS =====
  if (template.show_terms) {
    doc.setDrawColor(...borderColor);
    doc.line(margin, yPos - 3, pageWidth - margin, yPos - 3);
    
    addText("Terms & Conditions:", margin, yPos + 3, {
      fontSize: 9,
      fontStyle: "bold",
      color: darkText,
    });
    
    let termY = yPos + 10;
    // Use hardcoded terms to match the view proforma
    const defaultTerms = [
      "Customer Should register the product with respective company.",
      "In case of Warranty the customer should bare the courier charges.",
      "Validity of this quotation is for 7 days.",
      "Payment should be made in 100% Advance, No warranty for Burning."
    ];
    const terms = template.terms_line1 ? [template.terms_line1, template.terms_line2, template.terms_line3].filter(Boolean) : defaultTerms;
    terms.forEach((term, idx) => {
      addText(`${idx + 1}. ${term}`, margin, termY, { fontSize: 8, color: mutedText });
      termY += 5;
    });
    yPos = termY + 5;
  }

  // ===== BANK DETAILS =====
  // Use hardcoded bank details to match the view proforma
  const bankName = template.bank_name || "TAMILNAD MERCANTILE BANK LTD";
  const bankAccountNo = template.bank_account_no || "171700150950039";
  const bankIfsc = template.bank_ifsc || "TMBL0000171";
  const bankBranch = template.bank_branch || "NEW GLOBAL COMPUTERS";

  doc.setDrawColor(...borderColor);
  doc.line(margin, yPos - 3, pageWidth - margin, yPos - 3);
  
  addText("Bank Details:", margin, yPos + 3, {
    fontSize: 9,
    fontStyle: "bold",
    color: darkText,
  });

  let bankY = yPos + 10;
  addText(`Name: ${bankBranch}`, margin, bankY, { fontSize: 8, color: mutedText });
  bankY += 5;
  addText(`Bank: ${bankName}`, margin, bankY, { fontSize: 8, color: mutedText });
  bankY += 5;
  addText(`A/C No: ${bankAccountNo}`, margin, bankY, { fontSize: 8, color: mutedText });
  bankY += 5;
  addText(`IFSC: ${bankIfsc}`, margin, bankY, { fontSize: 8, color: mutedText });
  bankY += 5;
  yPos = bankY + 5;

  // ===== SIGNATURE SECTION =====
  if (template.show_signature) {
    const sigX = pageWidth - margin - 50;
    const sigY = Math.max(yPos, pageHeight - 30);
    
    addText(`For ${company.name}`, sigX + 25, sigY - 8, {
      fontSize: 8,
      fontStyle: "bold",
      color: darkText,
      align: "center",
    });

    doc.setDrawColor(...darkText);
    doc.setLineWidth(0.3);
    doc.line(sigX, sigY, pageWidth - margin, sigY);
    
    addText("Authorized Signatory", sigX + 25, sigY + 5, {
      fontSize: 7,
      color: mutedText,
      align: "center",
    });
  }

  // Page number
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...mutedText);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 8, { align: "center" });
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

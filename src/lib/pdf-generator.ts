import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatCurrency, numberToWords, calculateGstBreakup, roundToTwo } from "./invoice-utils";
import { PdfTemplateSettings } from "@/hooks/usePdfTemplateSettings";

// Default PDF template settings
const defaultPdfTemplateSettings = {
  primary_color: "#294172",
  secondary_color: "#3b82f6",
  accent_color: "#d4a02c",
  header_text_color: "#ffffff",
  table_header_bg: "#f3f4f6",
  table_header_text: "#374151",
  table_text_color: "#1f2937",
  grand_total_bg: "#1e2a4a",
  grand_total_text: "#ffffff",
  template_style: "bold_corporate",
  invoice_title: "PROFORMA INVOICE",
  bill_to_label: "Bill To",
  invoice_details_label: "Invoice Details",
  header_layout: "centered",
  font_heading: "Montserrat",
  font_body: "Inter",
  font_mono: "Roboto Mono",
  font_size_scale: "normal",
  show_logo: true,
  show_gstin_header: true,
  show_contact_header: true,
  show_company_state: true,
  show_shipping_address: false,
  show_customer_email: true,
  show_customer_phone: true,
  show_image_column: true,
  show_brand_column: true,
  show_unit_column: true,
  show_serial_numbers: true,
  show_discount_column: true,
  show_gst: true,
  show_terms: true,
  show_signature: true,
  show_amount_words: true,
  terms_line1: "Goods once sold will not be taken back.",
  terms_line2: "Subject to local jurisdiction only.",
  terms_line3: "E&OE - Errors and Omissions Excepted.",
  custom_footer_text: null as string | null,
  bank_name: null as string | null,
  bank_account_no: null as string | null,
  bank_ifsc: null as string | null,
  bank_branch: null as string | null,
};

interface InvoiceItem {
  sl_no: number;
  brand?: string | null;
  description: string;
  serial_numbers?: string[] | null;
  quantity: number;
  unit: string;
  rate: number; // GST-inclusive rate
  discount_percent: number;
  amount: number; // GST-inclusive amount
  product_image?: string | null;
  gst_percent?: number | null;
  gst_amount?: number | null;
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

  // Colors - matching the web preview's design system
  // Primary: Deep Navy (HSL 222 47% 15% = #1e2a4a)
  const headerBgColor: [number, number, number] = [30, 42, 74]; // Deep navy for header
  const headerTextColor: [number, number, number] = [255, 255, 255]; // White text on header
  const accentGold: [number, number, number] = [212, 160, 44]; // Gold accent (HSL 43 74% 49%)
  const darkText: [number, number, number] = [0, 0, 0]; // Pure black
  const mutedText: [number, number, number] = [80, 80, 80]; // Dark gray for secondary text
  const borderColor: [number, number, number] = [200, 200, 200];
  const tableTextColor = hexToRgb(template.table_text_color);

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

  // ===== GOLD ACCENT BAR AT TOP =====
  doc.setFillColor(...accentGold);
  doc.rect(0, 0, pageWidth, 3, "F");
  yPos = 8;

  // ===== HEADER - ORGANIZATION DETAILS (CENTERED) - Dark Navy Background =====
  const headerStartY = yPos;
  
  // We'll draw the header background after calculating height
  let headerContentHeight = 0;
  
  // Logo centered at top
  const logoSize = 24;
  let hasLogo = false;
  const logoY = yPos + 6;
  
  if (template.show_logo && company.logo_url) {
    const logoBase64 = await loadImageAsBase64(company.logo_url);
    if (logoBase64) {
      try {
        const logoX = (pageWidth - logoSize) / 2;
        hasLogo = true;
        headerContentHeight += logoSize + 4;
      } catch (e) {
        console.warn("Failed to add logo:", e);
      }
    }
  }

  // Calculate header content positions
  let contentY = logoY + (hasLogo ? logoSize + 4 : 0);
  
  // Company name
  const nameY = contentY;
  contentY += 7;
  
  // Address lines
  const addressParts = [company.address_line1, company.address_line2].filter(Boolean);
  const addressY = contentY;
  if (addressParts.length > 0) contentY += 5;
  
  const cityLine = [company.city, company.state, company.postal_code].filter(Boolean).join(", ");
  const cityY = contentY;
  if (cityLine) contentY += 5;

  // Contact info
  const contactY = contentY;
  if (template.show_contact_header) contentY += 5;

  // GSTIN
  const gstinY = contentY;
  if (template.show_gstin_header && company.gstin) contentY += 5;

  // State info
  const stateY = contentY;
  contentY += 8;

  // PROFORMA INVOICE title
  const titleY = contentY;
  contentY += 12;

  const headerEndY = contentY;
  headerContentHeight = headerEndY - headerStartY;

  // Draw header background
  doc.setFillColor(...headerBgColor);
  doc.rect(0, headerStartY - 3, pageWidth, headerContentHeight + 6, "F");

  // Now draw all the content on top
  if (hasLogo && template.show_logo && company.logo_url) {
    const logoBase64 = await loadImageAsBase64(company.logo_url);
    if (logoBase64) {
      try {
        const logoX = (pageWidth - logoSize) / 2;
        doc.addImage(logoBase64, "PNG", logoX, logoY, logoSize, logoSize);
      } catch (e) {
        console.warn("Failed to add logo:", e);
      }
    }
  }

  // Company name - centered, white text
  addText(company.name.toUpperCase(), pageWidth / 2, nameY, {
    fontSize: 16,
    fontStyle: "bold",
    color: headerTextColor,
    align: "center",
  });

  // Company address - centered
  if (addressParts.length > 0) {
    addText(addressParts.join(", "), pageWidth / 2, addressY, {
      fontSize: 9,
      color: [220, 220, 220],
      align: "center",
    });
  }
  
  if (cityLine) {
    addText(cityLine, pageWidth / 2, cityY, {
      fontSize: 9,
      color: [220, 220, 220],
      align: "center",
    });
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
      addText(contactParts.join("  |  "), pageWidth / 2, contactY, {
        fontSize: 8,
        color: [200, 200, 200],
        align: "center",
      });
    }
  }

  // GSTIN - centered with semi-transparent background effect
  if (template.show_gstin_header && company.gstin) {
    addText(`GSTIN: ${company.gstin}`, pageWidth / 2, gstinY, {
      fontSize: 9,
      fontStyle: "bold",
      color: headerTextColor,
      align: "center",
    });
  }

  // State info
  if (company.state) {
    addText(`State: ${company.state}, Code: ${company.state_code || ""}`, pageWidth / 2, stateY, {
      fontSize: 8,
      color: [200, 200, 200],
      align: "center",
    });
  }

  // ===== PROFORMA INVOICE TITLE - Gold text =====
  addText("PROFORMA INVOICE", pageWidth / 2, titleY, {
    fontSize: 14,
    fontStyle: "bold",
    color: accentGold,
    align: "center",
  });

  yPos = headerEndY + 5;

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

  const showGst = template.show_gst !== false;
  
  const tableData = invoice.items.map((item, idx) => {
    const gstPercent = item.gst_percent || 18;
    const inclusiveRate = item.rate;
    const { basePrice: baseUnitPrice, gstAmount: gstPerUnit } = calculateGstBreakup(inclusiveRate, gstPercent);
    
    const totalBasePrice = roundToTwo(baseUnitPrice * item.quantity);
    const totalGstAmount = roundToTwo(gstPerUnit * item.quantity);
    const totalInclusive = roundToTwo(item.quantity * inclusiveRate);

    const row: string[] = [
      (idx + 1).toString(),
      item.brand || "-",
      item.description,
      `${item.quantity} ${item.unit}`,
    ];
    
    if (showGst) {
      row.push(formatCurrency(totalBasePrice));
      row.push(formatCurrency(totalGstAmount));
    } else {
      row.push(formatCurrency(inclusiveRate));
    }
    
    row.push(formatCurrency(totalInclusive));
    
    return row;
  });

  const gstPercent = invoice.items[0]?.gst_percent || 18;

  const tableHead = showGst
    ? [["#", "Brand", "Description", "Qty", "Base Price", `GST Amt (${gstPercent}%)`, "Total"]]
    : [["#", "Brand", "Description", "Qty", "Unit Price", "Total"]];

  const columnStyles: any = showGst
    ? {
        0: { cellWidth: 8, halign: "center" },
        1: { cellWidth: 25, halign: "left" },
        2: { cellWidth: "auto", halign: "left" },
        3: { cellWidth: 18, halign: "center" },
        4: { cellWidth: 24, halign: "right" },
        5: { cellWidth: 24, halign: "right" },
        6: { cellWidth: 26, halign: "right" },
      }
    : {
        0: { cellWidth: 8, halign: "center" },
        1: { cellWidth: 28, halign: "left" },
        2: { cellWidth: "auto", halign: "left" },
        3: { cellWidth: 20, halign: "center" },
        4: { cellWidth: 24, halign: "right" },
        5: { cellWidth: 26, halign: "right" },
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
      color: isBold ? headerBgColor : darkText,
      align: "right",
    });
    totalsY += 6;
  };

  // Calculate total GST from per-item reverse calculation
  let totalGstFromItems = 0;
  invoice.items.forEach(item => {
    const gstPercent = item.gst_percent || 18;
    const { gstAmount: gstPerUnit } = calculateGstBreakup(item.rate, gstPercent);
    totalGstFromItems += gstPerUnit * item.quantity;
  });
  totalGstFromItems = roundToTwo(totalGstFromItems);

  addTotalLine("Subtotal:", formatCurrency(invoice.subtotal));
  
  if (invoice.discount_amount > 0) {
    addTotalLine(`Discount (${invoice.discount_percent}%):`, `-${formatCurrency(invoice.discount_amount)}`);
  }
  
  addTotalLine("Total GST (included):", formatCurrency(totalGstFromItems));

  if (Math.abs(invoice.round_off) > 0.001) {
    addTotalLine("Round Off:", formatCurrency(invoice.round_off));
  }

  // Grand total with dark navy background (matching web preview)
  totalsY += 4;
  const grandTotalBoxY = totalsY - 4;
  const grandTotalBoxHeight = 14;
  
  doc.setFillColor(...headerBgColor);
  doc.roundedRect(totalsX - 12, grandTotalBoxY, pageWidth - margin - totalsX + 14, grandTotalBoxHeight, 2, 2, "F");
  
  addText("Grand Total", totalsX - 8, totalsY + 2, {
    fontSize: 10,
    fontStyle: "bold",
    color: headerTextColor,
  });
  addText(formatCurrency(invoice.grand_total), totalsValueX - 2, totalsY + 2, {
    fontSize: 12,
    fontStyle: "bold",
    color: headerTextColor,
    align: "right",
  });
  totalsY += grandTotalBoxHeight;

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
  if (yPos > pageHeight - 80) {
    doc.addPage();
    yPos = margin;
  }

  // ===== FOOTER SECTION WITH DARK BACKGROUND (matching web preview) =====
  const footerStartY = yPos;
  const footerEndY = pageHeight - 15; // Leave space for page number
  
  // Draw footer background
  doc.setFillColor(...headerBgColor);
  doc.rect(0, footerStartY - 5, pageWidth, footerEndY - footerStartY + 20, "F");

  // ===== TERMS & CONDITIONS =====
  if (template.show_terms) {
    addText("Terms & Conditions", margin, yPos, {
      fontSize: 9,
      fontStyle: "bold",
      color: [180, 180, 180],
    });
    
    let termY = yPos + 6;
    // Use hardcoded terms to match the view proforma
    const defaultTerms = [
      "Customer Should register the product with respective company.",
      "In case of Warranty the customer should bare the courier charges.",
      "Validity of this quotation is for 7 days.",
      "Payment should be made in 100% Advance, No warranty for Burning."
    ];
    const terms = template.terms_line1 ? [template.terms_line1, template.terms_line2, template.terms_line3].filter(Boolean) : defaultTerms;
    terms.forEach((term, idx) => {
      addText(`${idx + 1}. ${term}`, margin + 4, termY, { fontSize: 8, color: [220, 220, 220] });
      termY += 4;
    });
    yPos = termY + 6;
  }

  // ===== BANK DETAILS =====
  // Use hardcoded bank details to match the view proforma
  const bankName = template.bank_name || "TAMILNAD MERCANTILE BANK LTD";
  const bankAccountNo = template.bank_account_no || "171700150950039";
  const bankIfsc = template.bank_ifsc || "TMBL0000171";
  const bankBranch = template.bank_branch || "NEW GLOBAL COMPUTERS";

  addText("Bank Details", margin, yPos, {
    fontSize: 9,
    fontStyle: "bold",
    color: [180, 180, 180],
  });

  let bankY = yPos + 6;
  addText(`Name: ${bankBranch}`, margin + 4, bankY, { fontSize: 8, color: [220, 220, 220] });
  bankY += 4;
  addText(`Bank: ${bankName}`, margin + 4, bankY, { fontSize: 8, color: [220, 220, 220] });
  bankY += 4;
  addText(`A/C No: ${bankAccountNo}`, margin + 4, bankY, { fontSize: 8, color: [220, 220, 220] });
  bankY += 4;
  addText(`IFSC: ${bankIfsc}`, margin + 4, bankY, { fontSize: 8, color: [220, 220, 220] });
  bankY += 4;

  // ===== SIGNATURE SECTION =====
  if (template.show_signature) {
    const sigX = pageWidth - margin - 50;
    const sigY = Math.max(yPos + 5, footerEndY - 15);
    
    addText(`for ${company.name}`, sigX + 25, sigY - 10, {
      fontSize: 8,
      fontStyle: "bold",
      color: headerTextColor,
      align: "center",
    });

    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.3);
    doc.line(sigX, sigY, pageWidth - margin, sigY);
    
    addText("Authorised Signatory", sigX + 25, sigY + 5, {
      fontSize: 7,
      color: [180, 180, 180],
      align: "center",
    });
  }

  // ===== GOLD ACCENT BAR AT BOTTOM =====
  doc.setFillColor(...accentGold);
  doc.rect(0, pageHeight - 3, pageWidth, 3, "F");

  // Page number - on top of footer
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(180, 180, 180);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 6, { align: "center" });
  }

  // Custom footer text
  if (template.custom_footer_text) {
    addText(template.custom_footer_text, pageWidth / 2, pageHeight - 10, {
      fontSize: 8,
      fontStyle: "italic",
      color: [150, 150, 150],
      align: "center",
    });
  }

  // Return base64 or save PDF
  if (options.returnBase64) {
    return doc.output("datauristring").split(",")[1];
  }

  doc.save(`Invoice-${invoice.invoice_no}.pdf`);
}

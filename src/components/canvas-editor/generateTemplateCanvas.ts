/**
 * Generates a fabric.js-compatible JSON from current PDF template settings,
 * so the canvas editor starts with the existing template layout pre-populated.
 */

const CANVAS_WIDTH = 595;
const CANVAS_HEIGHT = 842;

interface TemplateSettings {
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  header_text_color: string;
  table_header_bg: string;
  table_header_text: string;
  table_text_color: string;
  grand_total_bg: string;
  grand_total_text: string;
  invoice_title: string;
  bill_to_label: string;
  invoice_details_label: string;
  font_heading: string;
  font_body: string;
  font_mono: string;
  show_logo: boolean;
  show_gstin_header: boolean;
  show_contact_header: boolean;
  show_company_state: boolean;
  show_customer_email: boolean;
  show_customer_phone: boolean;
  show_terms: boolean;
  show_signature: boolean;
  show_amount_words: boolean;
  terms_line1: string | null;
  terms_line2: string | null;
  terms_line3: string | null;
  bank_name: string | null;
  bank_account_no: string | null;
  bank_ifsc: string | null;
  bank_branch: string | null;
}

interface CompanyInfo {
  name?: string;
  logo_url?: string | null;
}

export function generateTemplateCanvas(settings: TemplateSettings, company?: CompanyInfo | null) {
  const objects: any[] = [];
  const companyName = company?.name || "YOUR COMPANY NAME";
  let y = 0;

  // ── Top Accent Bar ──
  objects.push({
    type: "Rect",
    left: 0, top: y, width: CANVAS_WIDTH, height: 8,
    fill: settings.accent_color,
    selectable: true, evented: true,
    id: "accent_bar_top", name: "Top Accent Bar",
  });
  y += 8;

  // ── Header Background ──
  const headerHeight = 160;
  objects.push({
    type: "Rect",
    left: 0, top: y, width: CANVAS_WIDTH, height: headerHeight,
    fill: settings.primary_color,
    selectable: true, evented: true,
    id: "header_bg", name: "Header Background",
  });

  // Logo placeholder
  if (settings.show_logo) {
    objects.push({
      type: "Rect",
      left: CANVAS_WIDTH / 2 - 22, top: y + 12, width: 44, height: 44,
      fill: settings.accent_color,
      rx: 6, ry: 6,
      selectable: true, evented: true,
      id: "logo_placeholder", name: "Logo",
    });
  }

  // Company Name
  objects.push({
    type: "Textbox",
    left: 40, top: y + (settings.show_logo ? 62 : 16), width: CANVAS_WIDTH - 80,
    text: companyName,
    fontSize: 18, fontWeight: "bold",
    fontFamily: settings.font_heading,
    fill: settings.header_text_color,
    textAlign: "center",
    selectable: true, evented: true,
    id: "company_name", name: "Company Name",
  });

  // Address
  objects.push({
    type: "Textbox",
    left: 40, top: y + (settings.show_logo ? 86 : 40), width: CANVAS_WIDTH - 80,
    text: "123 Business Street, City, State 123456",
    fontSize: 9, fontFamily: settings.font_body,
    fill: settings.header_text_color, opacity: 0.8,
    textAlign: "center",
    selectable: true, evented: true,
    id: "company_address", name: "Company Address",
  });

  // Contact info
  if (settings.show_contact_header) {
    objects.push({
      type: "Textbox",
      left: 40, top: y + (settings.show_logo ? 102 : 56), width: CANVAS_WIDTH - 80,
      text: "📞 +91 12345 67890  ✉ email@company.com  🌐 www.company.com",
      fontSize: 8, fontFamily: settings.font_body,
      fill: settings.header_text_color, opacity: 0.8,
      textAlign: "center",
      selectable: true, evented: true,
      id: "contact_info", name: "Contact Info",
    });
  }

  // GSTIN
  if (settings.show_gstin_header) {
    objects.push({
      type: "Textbox",
      left: 40, top: y + (settings.show_logo ? 118 : 72), width: CANVAS_WIDTH - 80,
      text: `GSTIN: 29ABCDE1234F1ZH${settings.show_company_state ? "   |   State: Karnataka (29)" : ""}`,
      fontSize: 8, fontFamily: settings.font_body,
      fill: settings.header_text_color, opacity: 0.7,
      textAlign: "center",
      selectable: true, evented: true,
      id: "gstin_info", name: "GSTIN Info",
    });
  }

  // Invoice title
  objects.push({
    type: "Textbox",
    left: 40, top: y + 138, width: CANVAS_WIDTH - 80,
    text: settings.invoice_title,
    fontSize: 13, fontWeight: "bold",
    fontFamily: settings.font_heading,
    fill: settings.accent_color,
    textAlign: "center",
    selectable: true, evented: true,
    id: "invoice_title", name: "Invoice Title",
  });

  y += headerHeight;

  // ── Customer Details Section ──
  const custSectionHeight = 80;
  objects.push({
    type: "Rect",
    left: 0, top: y, width: CANVAS_WIDTH, height: custSectionHeight,
    fill: settings.primary_color,
    selectable: true, evented: true,
    id: "customer_section_bg", name: "Customer Section Background",
  });

  // Bill To
  let billToText = `${settings.bill_to_label}\n\nCustomer Name\n123 Customer Street`;
  if (settings.show_customer_phone) billToText += "\nPhone: +91 98765 43210";
  if (settings.show_customer_email) billToText += "\nEmail: customer@email.com";

  objects.push({
    type: "Textbox",
    left: 24, top: y + 8, width: 260,
    text: billToText,
    fontSize: 9, fontFamily: settings.font_body,
    fill: settings.header_text_color,
    lineHeight: 1.4,
    selectable: true, evented: true,
    id: "bill_to", name: "Bill To Section",
  });

  // Invoice Details
  objects.push({
    type: "Textbox",
    left: CANVAS_WIDTH - 200, top: y + 8, width: 176,
    text: `${settings.invoice_details_label}\n\nProforma No: INV-001\nDate: 04-Feb-2026`,
    fontSize: 9, fontFamily: settings.font_body,
    fill: settings.header_text_color,
    textAlign: "right", lineHeight: 1.4,
    selectable: true, evented: true,
    id: "invoice_details", name: "Invoice Details",
  });

  y += custSectionHeight;

  // ── Items Table Header ──
  const tableHeaderH = 24;
  objects.push({
    type: "Rect",
    left: 0, top: y, width: CANVAS_WIDTH, height: tableHeaderH,
    fill: settings.table_header_bg,
    selectable: true, evented: true,
    id: "table_header_bg", name: "Table Header Background",
  });

  objects.push({
    type: "Textbox",
    left: 12, top: y + 6, width: CANVAS_WIDTH - 24,
    text: "SL        PRODUCT                                          QTY          RATE              TOTAL",
    fontSize: 8, fontWeight: "bold",
    fontFamily: settings.font_body,
    fill: settings.table_header_text,
    selectable: true, evented: true,
    id: "table_header_text", name: "Table Header Labels",
  });
  y += tableHeaderH;

  // ── Table Rows ──
  const rows = [
    { sl: "1", product: "Sample Product A\n  High quality product", qty: "2", rate: "₹1,500", total: "₹3,000" },
    { sl: "2", product: "Sample Product B\n  Premium edition", qty: "1", rate: "₹2,500", total: "₹2,500" },
  ];

  rows.forEach((row, idx) => {
    const rowH = 36;
    // Alternating row background
    if (idx % 2 === 1) {
      objects.push({
        type: "Rect",
        left: 0, top: y, width: CANVAS_WIDTH, height: rowH,
        fill: "#f9fafb",
        selectable: true, evented: true,
        id: `table_row_bg_${idx}`, name: `Row ${idx + 1} Background`,
      });
    }

    objects.push({
      type: "Textbox",
      left: 12, top: y + 6, width: 30,
      text: row.sl,
      fontSize: 9, fontFamily: settings.font_body,
      fill: settings.table_text_color,
      selectable: true, evented: true,
      id: `row_sl_${idx}`, name: `Row ${idx + 1} SL`,
    });

    objects.push({
      type: "Textbox",
      left: 60, top: y + 4, width: 240,
      text: row.product,
      fontSize: 9, fontFamily: settings.font_body,
      fill: settings.table_text_color, lineHeight: 1.3,
      selectable: true, evented: true,
      id: `row_product_${idx}`, name: `Row ${idx + 1} Product`,
    });

    objects.push({
      type: "Textbox",
      left: 360, top: y + 6, width: 40,
      text: row.qty,
      fontSize: 9, fontFamily: settings.font_mono,
      fill: settings.table_text_color, textAlign: "center",
      selectable: true, evented: true,
      id: `row_qty_${idx}`, name: `Row ${idx + 1} Qty`,
    });

    objects.push({
      type: "Textbox",
      left: 420, top: y + 6, width: 70,
      text: row.rate,
      fontSize: 9, fontFamily: settings.font_mono,
      fill: settings.table_text_color, textAlign: "right",
      selectable: true, evented: true,
      id: `row_rate_${idx}`, name: `Row ${idx + 1} Rate`,
    });

    objects.push({
      type: "Textbox",
      left: 510, top: y + 6, width: 70,
      text: row.total,
      fontSize: 9, fontFamily: settings.font_mono,
      fill: settings.table_text_color, textAlign: "right",
      fontWeight: "bold",
      selectable: true, evented: true,
      id: `row_total_${idx}`, name: `Row ${idx + 1} Total`,
    });

    y += rowH;
  });

  // ── Totals Section ──
  const totalsY = y + 8;

  // Amount in words
  if (settings.show_amount_words) {
    objects.push({
      type: "Rect",
      left: 12, top: totalsY, width: 300, height: 36,
      fill: "#f9fafb", stroke: "#e5e7eb", strokeWidth: 1,
      selectable: true, evented: true,
      id: "amount_words_bg", name: "Amount in Words Background",
    });
    objects.push({
      type: "Textbox",
      left: 18, top: totalsY + 4, width: 288,
      text: "Amount in Words\nFive Thousand Five Hundred Only",
      fontSize: 8, fontFamily: settings.font_body,
      fill: settings.table_text_color, lineHeight: 1.5,
      selectable: true, evented: true,
      id: "amount_words_text", name: "Amount in Words",
    });
  }

  // Totals column
  const totColX = 400;
  objects.push({
    type: "Textbox",
    left: totColX, top: totalsY, width: 100,
    text: "Subtotal\nGST (18%)",
    fontSize: 9, fontFamily: settings.font_body,
    fill: "#6b7280", lineHeight: 1.8,
    selectable: true, evented: true,
    id: "totals_labels", name: "Totals Labels",
  });

  objects.push({
    type: "Textbox",
    left: 510, top: totalsY, width: 70,
    text: "₹5,500\n₹990",
    fontSize: 9, fontFamily: settings.font_mono,
    fill: settings.table_text_color, textAlign: "right",
    lineHeight: 1.8,
    selectable: true, evented: true,
    id: "totals_values", name: "Totals Values",
  });

  // Grand Total bar
  const gtY = totalsY + 42;
  objects.push({
    type: "Rect",
    left: totColX - 10, top: gtY, width: 195, height: 28,
    fill: settings.grand_total_bg,
    selectable: true, evented: true,
    id: "grand_total_bg", name: "Grand Total Background",
  });
  objects.push({
    type: "Textbox",
    left: totColX, top: gtY + 6, width: 80,
    text: "Grand Total",
    fontSize: 10, fontWeight: "bold",
    fontFamily: settings.font_heading,
    fill: settings.grand_total_text,
    selectable: true, evented: true,
    id: "grand_total_label", name: "Grand Total Label",
  });
  objects.push({
    type: "Textbox",
    left: 510, top: gtY + 6, width: 70,
    text: "₹6,490",
    fontSize: 10, fontWeight: "bold",
    fontFamily: settings.font_mono,
    fill: settings.grand_total_text, textAlign: "right",
    selectable: true, evented: true,
    id: "grand_total_value", name: "Grand Total Value",
  });

  y = gtY + 40;

  // ── Footer Section ──
  const footerStartY = y + 12;
  const footerHeight = CANVAS_HEIGHT - footerStartY - 8;

  objects.push({
    type: "Rect",
    left: 0, top: footerStartY, width: CANVAS_WIDTH, height: footerHeight,
    fill: settings.primary_color,
    selectable: true, evented: true,
    id: "footer_bg", name: "Footer Background",
  });

  let footerY = footerStartY + 12;

  // Terms
  if (settings.show_terms) {
    const termsText = [settings.terms_line1, settings.terms_line2, settings.terms_line3]
      .filter(Boolean)
      .map((t, i) => `${i + 1}. ${t}`)
      .join("\n");

    if (termsText) {
      objects.push({
        type: "Textbox",
        left: 24, top: footerY, width: 340,
        text: `Terms & Conditions\n${termsText}`,
        fontSize: 8, fontFamily: settings.font_body,
        fill: settings.header_text_color, opacity: 0.85,
        lineHeight: 1.5,
        selectable: true, evented: true,
        id: "terms_text", name: "Terms & Conditions",
      });
      footerY += 60;
    }
  }

  // Bank Details
  if (settings.bank_name) {
    let bankText = `Bank Details\nBank: ${settings.bank_name}`;
    if (settings.bank_account_no) bankText += `\nA/C: ${settings.bank_account_no}`;
    if (settings.bank_ifsc) bankText += `\nIFSC: ${settings.bank_ifsc}`;
    if (settings.bank_branch) bankText += `\nBranch: ${settings.bank_branch}`;

    objects.push({
      type: "Textbox",
      left: 24, top: footerY, width: 300,
      text: bankText,
      fontSize: 8, fontFamily: settings.font_body,
      fill: settings.header_text_color, opacity: 0.85,
      lineHeight: 1.5,
      selectable: true, evented: true,
      id: "bank_details", name: "Bank Details",
    });
  }

  // Signature
  if (settings.show_signature) {
    objects.push({
      type: "Textbox",
      left: CANVAS_WIDTH - 180, top: CANVAS_HEIGHT - 70, width: 156,
      text: `for ${companyName}\n\n\n________________________\nAuthorised Signatory`,
      fontSize: 8, fontFamily: settings.font_body,
      fill: settings.header_text_color, opacity: 0.85,
      textAlign: "center", lineHeight: 1.3,
      selectable: true, evented: true,
      id: "signature", name: "Signature Block",
    });
  }

  // Bottom accent bar
  objects.push({
    type: "Rect",
    left: 0, top: CANVAS_HEIGHT - 8, width: CANVAS_WIDTH, height: 8,
    fill: settings.accent_color,
    selectable: true, evented: true,
    id: "accent_bar_bottom", name: "Bottom Accent Bar",
  });

  return {
    version: "6.6.1",
    objects,
    background: "#ffffff",
  };
}

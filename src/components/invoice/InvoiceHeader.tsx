import { CompanyInfo } from "@/types/invoice";
import { Building2, Phone, Mail, Globe } from "lucide-react";

interface InvoiceHeaderProps {
  company: CompanyInfo;
  invoiceNo: string;
  date: string;
  eWayBillNo?: string;
  supplierInvoiceNo: string;
  supplierInvoiceDate: string;
  otherReferences?: string;
  customer?: {
    name: string;
    address: string;
    gstin: string;
    state: string;
    stateCode: string;
    email?: string;
    phone?: string;
  };
  settings?: {
    primary_color: string;
    accent_color: string;
    header_text_color: string;
    invoice_title: string;
    bill_to_label: string;
    invoice_details_label: string;
    show_logo: boolean;
    show_gstin_header: boolean;
    show_contact_header: boolean;
    show_company_state: boolean;
    font_heading: string;
  };
}

export function InvoiceHeader({
  company,
  invoiceNo,
  date,
  eWayBillNo,
  supplierInvoiceNo,
  supplierInvoiceDate,
  otherReferences,
  customer,
  settings,
}: InvoiceHeaderProps) {
  const primaryColor = settings?.primary_color || "#294172";
  const accentColor = settings?.accent_color || "#d4a02c";
  const headerTextColor = settings?.header_text_color || "#ffffff";
  const invoiceTitle = settings?.invoice_title || "PROFORMA INVOICE";
  const billToLabel = settings?.bill_to_label || "Bill To";
  const invoiceDetailsLabel = settings?.invoice_details_label || "Invoice Details";
  const showLogo = settings?.show_logo ?? true;
  const showGstinHeader = settings?.show_gstin_header ?? true;
  const showContactHeader = settings?.show_contact_header ?? true;
  const showCompanyState = settings?.show_company_state ?? true;
  const fontHeading = settings?.font_heading || "Montserrat";

  return (
    <div 
      className="invoice-header py-4"
      style={{ 
        backgroundColor: primaryColor, 
        color: headerTextColor,
        fontFamily: fontHeading,
      }}
    >
      {/* Organization Details - Centered */}
      <div className="text-center space-y-2 pb-3 border-b border-white/20 print:border-gray-300 px-4">
        {showLogo && (
          <div className="flex justify-center">
            {company.logoUrl ? (
              <img 
                src={company.logoUrl} 
                alt={`${company.name} logo`} 
                className="w-12 h-12 rounded-lg object-contain" 
              />
            ) : (
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: accentColor }}
              >
                <Building2 className="w-6 h-6" style={{ color: primaryColor }} />
              </div>
            )}
          </div>
        )}

        <h1 className="text-lg font-bold tracking-tight">
          {company.name}
        </h1>

        <div className="text-xs opacity-80">
          {company.address.map((line, i) => (
            <span key={i}>
              {line}{i < company.address.length - 1 ? ", " : ""}
            </span>
          ))}
        </div>

        {showContactHeader && (
          <div className="flex flex-wrap justify-center gap-3 text-xs opacity-80">
            {company.phone.length > 0 && (
              <div className="flex items-center gap-1">
                <Phone className="w-3 h-3" />
                <span>{company.phone.join(", ")}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Mail className="w-3 h-3" />
              <span>{company.email}</span>
            </div>
            <div className="flex items-center gap-1">
              <Globe className="w-3 h-3" />
              <span>{company.website}</span>
            </div>
          </div>
        )}

        {showGstinHeader && (
          <div className="flex justify-center gap-3 text-xs">
            <div className="px-2 py-1 rounded" style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
              <span className="opacity-80">GSTIN: </span>
              <span className="font-semibold">{company.gstin}</span>
            </div>
            {showCompanyState && (
              <div className="px-2 py-1 rounded" style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
                <span className="opacity-80">State: </span>
                <span className="font-semibold">
                  {company.state}, Code: {company.stateCode}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Proforma Invoice Title */}
      <div className="text-center py-2 px-4">
        <h2 
          className="text-base font-bold"
          style={{ color: accentColor }}
        >
          {invoiceTitle}
        </h2>
      </div>

      {/* Customer Details (Left) & Invoice Details (Right) */}
      <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/20 print:border-gray-300 px-4">
        {/* Bill To - Left */}
        <div className="space-y-1">
          <h3 className="text-xs font-semibold uppercase tracking-wider opacity-60">
            {billToLabel}
          </h3>
          {customer && (
            <div className="space-y-0.5">
              <p className="text-sm font-semibold">{customer.name}</p>
              <p className="text-xs opacity-80">{customer.address}</p>
              {customer.phone && (
                <p className="text-xs opacity-80">Phone: {customer.phone}</p>
              )}
              {customer.email && (
                <p className="text-xs opacity-80">Email: {customer.email}</p>
              )}
              {customer.gstin && (
                <p className="text-xs">
                  <span className="opacity-60">GSTIN: </span>
                  <span className="font-medium">{customer.gstin}</span>
                </p>
              )}
              {customer.state && (
                <p className="text-xs opacity-80">
                  State: {customer.state}
                  {customer.stateCode && ` (${customer.stateCode})`}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Invoice Details - Right */}
        <div className="space-y-1 text-right">
          <h3 className="text-xs font-semibold uppercase tracking-wider opacity-60">
            {invoiceDetailsLabel}
          </h3>
          <div className="space-y-0.5 text-xs">
            <div className="flex justify-end gap-2">
              <span className="opacity-60">Proforma No:</span>
              <span className="font-semibold text-sm">{invoiceNo}</span>
            </div>
            <div className="flex justify-end gap-2">
              <span className="opacity-60">Date:</span>
              <span className="font-medium">{date}</span>
            </div>
            {eWayBillNo && (
              <div className="flex justify-end gap-2">
                <span className="opacity-60">e-Way Bill:</span>
                <span className="font-medium">{eWayBillNo}</span>
              </div>
            )}
            {otherReferences && (
              <div className="flex justify-end gap-2">
                <span className="opacity-60">Reference:</span>
                <span className="font-medium">{otherReferences}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

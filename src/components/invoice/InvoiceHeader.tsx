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
    // New spacing settings
    header_padding?: string;
    header_layout_style?: string;
    logo_size?: string;
    show_invoice_title?: boolean;
    compact_header?: boolean;
  };
}

// Map spacing values to CSS classes
const getPaddingClass = (padding: string, compact: boolean) => {
  if (compact) return "py-2 px-3";
  switch (padding) {
    case "compact": return "py-2 px-3";
    case "relaxed": return "py-5 px-5";
    default: return "py-3 px-4";
  }
};

const getLogoSize = (size: string) => {
  switch (size) {
    case "small": return "w-8 h-8";
    case "large": return "w-16 h-16";
    case "xlarge": return "w-20 h-20";
    default: return "w-12 h-12";
  }
};

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
  
  // New spacing settings
  const headerPadding = settings?.header_padding || "normal";
  const headerLayoutStyle = settings?.header_layout_style || "centered";
  const logoSize = settings?.logo_size || "medium";
  const showInvoiceTitle = settings?.show_invoice_title ?? true;
  const compactHeader = settings?.compact_header ?? false;

  const paddingClass = getPaddingClass(headerPadding, compactHeader);
  const logoSizeClass = getLogoSize(logoSize);

  // Render header based on layout style
  const renderCenteredLayout = () => (
    <>
      {/* Organization Details - Centered */}
      <div className={`text-center space-y-1.5 ${compactHeader ? 'pb-2' : 'pb-3'} border-b border-white/20 print:border-gray-300`}>
        {showLogo && (
          <div className="flex justify-center">
            {company.logoUrl ? (
              <img 
                src={company.logoUrl} 
                alt={`${company.name} logo`} 
                className={`${logoSizeClass} rounded-lg object-contain`} 
              />
            ) : (
              <div 
                className={`${logoSizeClass} rounded-lg flex items-center justify-center`}
                style={{ backgroundColor: accentColor }}
              >
                <Building2 className="w-1/2 h-1/2" style={{ color: primaryColor }} />
              </div>
            )}
          </div>
        )}

        <h1 className={`${compactHeader ? 'text-base' : 'text-lg'} font-bold tracking-tight`}>
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
            <div className="px-2 py-0.5 rounded" style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
              <span className="opacity-80">GSTIN: </span>
              <span className="font-semibold">{company.gstin}</span>
            </div>
            {showCompanyState && (
              <div className="px-2 py-0.5 rounded" style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
                <span className="opacity-80">State: </span>
                <span className="font-semibold">
                  {company.state}, Code: {company.stateCode}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );

  const renderSplitLayout = () => (
    <div className={`flex items-start justify-between ${compactHeader ? 'pb-2' : 'pb-3'} border-b border-white/20 print:border-gray-300`}>
      {/* Left - Logo & Name */}
      <div className="flex items-center gap-3">
        {showLogo && (
          company.logoUrl ? (
            <img 
              src={company.logoUrl} 
              alt={`${company.name} logo`} 
              className={`${logoSizeClass} rounded-lg object-contain`} 
            />
          ) : (
            <div 
              className={`${logoSizeClass} rounded-lg flex items-center justify-center`}
              style={{ backgroundColor: accentColor }}
            >
              <Building2 className="w-1/2 h-1/2" style={{ color: primaryColor }} />
            </div>
          )
        )}
        <div>
          <h1 className={`${compactHeader ? 'text-base' : 'text-lg'} font-bold tracking-tight`}>
            {company.name}
          </h1>
          <div className="text-xs opacity-80 max-w-xs">
            {company.address.join(", ")}
          </div>
        </div>
      </div>

      {/* Right - Contact & GSTIN */}
      <div className="text-right text-xs space-y-1">
        {showContactHeader && (
          <div className="opacity-80 space-y-0.5">
            {company.phone.length > 0 && <div>{company.phone.join(", ")}</div>}
            <div>{company.email}</div>
            <div>{company.website}</div>
          </div>
        )}
        {showGstinHeader && (
          <div className="pt-1">
            <span className="opacity-80">GSTIN: </span>
            <span className="font-semibold">{company.gstin}</span>
          </div>
        )}
      </div>
    </div>
  );

  const renderLeftAlignedLayout = () => (
    <div className={`space-y-1.5 ${compactHeader ? 'pb-2' : 'pb-3'} border-b border-white/20 print:border-gray-300`}>
      <div className="flex items-center gap-3">
        {showLogo && (
          company.logoUrl ? (
            <img 
              src={company.logoUrl} 
              alt={`${company.name} logo`} 
              className={`${logoSizeClass} rounded-lg object-contain`} 
            />
          ) : (
            <div 
              className={`${logoSizeClass} rounded-lg flex items-center justify-center`}
              style={{ backgroundColor: accentColor }}
            >
              <Building2 className="w-1/2 h-1/2" style={{ color: primaryColor }} />
            </div>
          )
        )}
        <div>
          <h1 className={`${compactHeader ? 'text-base' : 'text-lg'} font-bold tracking-tight`}>
            {company.name}
          </h1>
          <div className="text-xs opacity-80">
            {company.address.join(", ")}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 text-xs">
        {showContactHeader && (
          <div className="flex gap-3 opacity-80">
            {company.phone.length > 0 && (
              <span><Phone className="w-3 h-3 inline mr-1" />{company.phone.join(", ")}</span>
            )}
            <span><Mail className="w-3 h-3 inline mr-1" />{company.email}</span>
            <span><Globe className="w-3 h-3 inline mr-1" />{company.website}</span>
          </div>
        )}
        {showGstinHeader && (
          <div>
            <span className="opacity-80">GSTIN: </span>
            <span className="font-semibold">{company.gstin}</span>
            {showCompanyState && (
              <span className="ml-3 opacity-80">
                State: {company.state} ({company.stateCode})
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div 
      className={`invoice-header ${paddingClass}`}
      style={{ 
        backgroundColor: primaryColor, 
        color: headerTextColor,
        fontFamily: fontHeading,
      }}
    >
      {/* Render layout based on style */}
      {headerLayoutStyle === "split" ? renderSplitLayout()
        : headerLayoutStyle === "left-aligned" ? renderLeftAlignedLayout()
        : renderCenteredLayout()}

      {/* Proforma Invoice Title */}
      {showInvoiceTitle && (
        <div className={`text-center ${compactHeader ? 'py-1' : 'py-2'}`}>
          <h2 
            className={`${compactHeader ? 'text-sm' : 'text-base'} font-bold`}
            style={{ color: accentColor }}
          >
            {invoiceTitle}
          </h2>
        </div>
      )}

      {/* Customer Details (Left) & Invoice Details (Right) */}
      <div className={`grid grid-cols-2 gap-4 ${compactHeader ? 'pt-1' : 'pt-2'} border-t border-white/20 print:border-gray-300`}>
        {/* Bill To - Left */}
        <div className="space-y-0.5">
          <h3 className="text-xs font-semibold uppercase tracking-wider opacity-60">
            {billToLabel}
          </h3>
          {customer && (
            <div className="space-y-0.5">
              <p className={`${compactHeader ? 'text-xs' : 'text-sm'} font-semibold`}>{customer.name}</p>
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
        <div className="space-y-0.5 text-right">
          <h3 className="text-xs font-semibold uppercase tracking-wider opacity-60">
            {invoiceDetailsLabel}
          </h3>
          <div className="space-y-0.5 text-xs">
            <div className="flex justify-end gap-2">
              <span className="opacity-60">Proforma No:</span>
              <span className={`font-semibold ${compactHeader ? 'text-xs' : 'text-sm'}`}>{invoiceNo}</span>
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

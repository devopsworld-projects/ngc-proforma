import { CompanyInfo } from "@/types/invoice";
import { PenLine, Building2, FileText } from "lucide-react";

interface InvoiceFooterProps {
  company: CompanyInfo;
  termsAndConditions?: string[];
  bankDetails?: {
    bankName?: string;
    accountNo?: string;
    ifsc?: string;
    branch?: string;
  };
  showSignature?: boolean;
  settings?: {
    primary_color: string;
    header_text_color: string;
  };
}

export function InvoiceFooter({ 
  company, 
  termsAndConditions = [],
  bankDetails,
  showSignature = true,
  settings,
}: InvoiceFooterProps) {
  const primaryColor = settings?.primary_color || "#294172";
  const headerTextColor = settings?.header_text_color || "#ffffff";

  // If nothing to show, return null
  if (termsAndConditions.length === 0 && !bankDetails && !showSignature) {
    return null;
  }

  const hasTerms = termsAndConditions.length > 0;
  const hasBankDetails = !!(bankDetails && bankDetails.bankName);
  const hasBothTermsAndBank = hasTerms && hasBankDetails;

  return (
    <div 
      className="px-3 py-3 space-y-3"
      style={{ 
        backgroundColor: primaryColor, 
        color: headerTextColor,
      }}
    >
      {/* Terms & Bank Details - side by side when both present */}
      {(hasTerms || hasBankDetails) && (
        <div className={hasBothTermsAndBank ? "grid grid-cols-2 gap-4" : ""}>
          {/* Terms & Conditions */}
          {hasTerms && (
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <FileText className="w-3 h-3 opacity-70" />
                <h4 className="text-xs font-semibold uppercase tracking-wider opacity-70">
                  Terms & Conditions
                </h4>
              </div>
              <ul className="text-xs opacity-90 space-y-0 pl-4">
                {termsAndConditions.map((term, idx) => (
                  <li key={idx}>{idx + 1}. {term}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Bank Details */}
          {hasBankDetails && (
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <Building2 className="w-3 h-3 opacity-70" />
                <h4 className="text-xs font-semibold uppercase tracking-wider opacity-70">
                  Bank Details
                </h4>
              </div>
              <div className="text-xs opacity-90 space-y-0 pl-4">
                {bankDetails!.branch && <p>Name: {bankDetails!.branch}</p>}
                {bankDetails!.bankName && <p>Bank: {bankDetails!.bankName}</p>}
                {bankDetails!.accountNo && <p>A/C No: {bankDetails!.accountNo}</p>}
                {bankDetails!.ifsc && <p>IFSC: {bankDetails!.ifsc}</p>}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Signature Section */}
      {showSignature && (
        <div className="flex justify-end">
          <div className="text-center w-36">
            <p className="text-xs font-semibold mb-4">
              for {company.name}
            </p>
            <div className="border-t border-white/30 pt-1.5 flex items-center justify-center gap-1">
              <PenLine className="w-2.5 h-2.5 opacity-70" />
              <span className="text-xs font-medium opacity-80">
                Authorised Signatory
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

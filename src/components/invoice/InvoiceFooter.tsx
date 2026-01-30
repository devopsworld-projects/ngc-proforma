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
}

export function InvoiceFooter({ 
  company, 
  termsAndConditions = [
    "Customer Should register the product with respective company.",
    "In case of Warranty the customer should bare the courier charges.",
    "Validity of this quotation is for 7 days.",
    "Payment should be made in 100% Advance, No warranty for Burning."
  ],
  bankDetails = {
    bankName: "TAMILNAD MERCANTILE BANK LTD",
    accountNo: "171700150950039",
    ifsc: "TMBL0000171",
    branch: "NEW GLOBAL COMPUTERS"
  }
}: InvoiceFooterProps) {
  return (
    <div className="px-4 py-3 bg-[hsl(var(--invoice-header-bg))] text-[hsl(var(--invoice-header-fg))] space-y-3">
      {/* Terms & Conditions */}
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

      {/* Bank Details */}
      {bankDetails && bankDetails.bankName && (
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5">
            <Building2 className="w-3 h-3 opacity-70" />
            <h4 className="text-xs font-semibold uppercase tracking-wider opacity-70">
              Bank Details
            </h4>
          </div>
          <div className="text-xs opacity-90 space-y-0 pl-4">
            {bankDetails.branch && <p>Name: {bankDetails.branch}</p>}
            {bankDetails.bankName && <p>Bank: {bankDetails.bankName}</p>}
            {bankDetails.accountNo && <p>A/C No: {bankDetails.accountNo}</p>}
            {bankDetails.ifsc && <p>IFSC: {bankDetails.ifsc}</p>}
          </div>
        </div>
      )}

      {/* Signature Section */}
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
    </div>
  );
}

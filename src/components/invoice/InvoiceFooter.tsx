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
    "Goods once sold will not be taken back.",
    "Subject to local jurisdiction only.",
    "E&OE - Errors and Omissions Excepted."
  ],
  bankDetails 
}: InvoiceFooterProps) {
  return (
    <div className="p-6 bg-invoice-subtle border-t border-invoice-border space-y-6">
      {/* Terms & Conditions */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-invoice-muted" />
          <h4 className="text-xs font-semibold uppercase tracking-wider text-invoice-muted">
            Terms & Conditions
          </h4>
        </div>
        <ul className="text-xs text-muted-foreground space-y-1 pl-6">
          {termsAndConditions.map((term, idx) => (
            <li key={idx}>{idx + 1}. {term}</li>
          ))}
        </ul>
      </div>

      {/* Bank Details */}
      {bankDetails && bankDetails.bankName && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-invoice-muted" />
            <h4 className="text-xs font-semibold uppercase tracking-wider text-invoice-muted">
              Bank Details
            </h4>
          </div>
          <div className="text-xs text-muted-foreground grid grid-cols-2 gap-2 pl-6">
            {bankDetails.bankName && <p>Bank: {bankDetails.bankName}</p>}
            {bankDetails.accountNo && <p>A/C No: {bankDetails.accountNo}</p>}
            {bankDetails.ifsc && <p>IFSC: {bankDetails.ifsc}</p>}
            {bankDetails.branch && <p>Branch: {bankDetails.branch}</p>}
          </div>
        </div>
      )}

      {/* Signature Section */}
      <div className="flex justify-end">
        <div className="text-center w-48">
          <p className="text-sm font-semibold text-foreground mb-8">
            for {company.name}
          </p>
          <div className="border-t-2 border-primary pt-3 flex items-center justify-center gap-2">
            <PenLine className="w-4 h-4 text-invoice-muted" />
            <span className="text-sm font-medium text-muted-foreground">
              Authorised Signatory
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

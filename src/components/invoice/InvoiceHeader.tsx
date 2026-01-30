import { CompanyInfo } from "@/types/invoice";
import { Building2, Phone, Mail, Globe, FileText } from "lucide-react";
interface InvoiceHeaderProps {
  company: CompanyInfo;
  invoiceNo: string;
  date: string;
  eWayBillNo?: string;
  supplierInvoiceNo: string;
  supplierInvoiceDate: string;
  otherReferences?: string;
}
export function InvoiceHeader({
  company,
  invoiceNo,
  date,
  eWayBillNo,
  supplierInvoiceNo,
  supplierInvoiceDate,
  otherReferences
}: InvoiceHeaderProps) {
  return <div className="invoice-header">
      <div className="flex flex-col lg:flex-row justify-between gap-6">
        {/* Company Info */}
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-3">
            {company.logoUrl ? <img src={company.logoUrl} alt={`${company.name} logo`} className="w-12 h-12 rounded-lg object-contain" /> : <div className="w-12 h-12 rounded-lg gradient-gold flex items-center justify-center">
                <Building2 className="w-6 h-6 text-primary" />
              </div>}
            <div>
              <h1 className="text-2xl font-serif font-bold tracking-tight">
                {company.name}
              </h1>
              <p className="text-sm opacity-80">Proforma Invoice</p>
            </div>
          </div>
          
          <div className="space-y-1.5 text-sm opacity-90">
            {company.address.map((line, i) => <p key={i} className="">{line}</p>)}
          </div>

          <div className="flex flex-wrap gap-4 text-xs opacity-80">
            {company.phone.length > 0 && <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" />
                <span>{company.phone.join(", ")}</span>
              </div>}
            <div className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" />
              <span>{company.email}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" />
              <span>{company.website}</span>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap gap-4 text-xs">
            <div className="bg-white/10 px-3 py-1.5 rounded-md">
              <span className="opacity-70">GSTIN: </span>
              <span className="font-semibold">{company.gstin}</span>
            </div>
            <div className="bg-white/10 px-3 py-1.5 rounded-md">
              <span className="opacity-70">State: </span>
              <span className="font-semibold">{company.state}, Code: {company.stateCode}</span>
            </div>
          </div>
        </div>

        {/* Invoice Details */}
        <div className="lg:w-80 space-y-3">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-5 h-5 invoice-gold-text" />
              <span className="text-lg font-serif font-semibold invoice-gold-text">PROFORMA INVOICE</span>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs opacity-60 uppercase tracking-wide">Invoice No.</p>
                <p className="font-semibold text-lg">{invoiceNo}</p>
              </div>
              <div>
                <p className="text-xs opacity-60 uppercase tracking-wide">Date</p>
                <p className="font-semibold">{date}</p>
              </div>
            </div>

            {eWayBillNo && <div className="text-sm">
                <p className="text-xs opacity-60 uppercase tracking-wide">e-Way Bill No.</p>
                <p className="font-semibold">{eWayBillNo}</p>
              </div>}

            <div className="pt-2 border-t border-white/10 text-sm">
              <p className="text-xs opacity-60 uppercase tracking-wide">
            </p>
              
              
            </div>

            {otherReferences && <div className="text-sm">
                <p className="text-xs opacity-60 uppercase tracking-wide">Other References</p>
                <p className="font-medium">{otherReferences}</p>
              </div>}
          </div>
        </div>
      </div>
    </div>;
}
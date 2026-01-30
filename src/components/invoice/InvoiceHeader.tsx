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
}: InvoiceHeaderProps) {
  return (
    <div className="invoice-header">
      {/* Organization Details - Centered */}
      <div className="text-center space-y-3 pb-6 border-b border-white/20">
        <div className="flex justify-center">
          {company.logoUrl ? (
            <img
              src={company.logoUrl}
              alt={`${company.name} logo`}
              className="w-16 h-16 rounded-lg object-contain"
            />
          ) : (
            <div className="w-16 h-16 rounded-lg gradient-gold flex items-center justify-center">
              <Building2 className="w-8 h-8 text-primary" />
            </div>
          )}
        </div>

        <h1 className="text-2xl font-serif font-bold tracking-tight">
          {company.name}
        </h1>

        <div className="text-sm opacity-90 space-y-1">
          {company.address.map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>

        <div className="flex flex-wrap justify-center gap-4 text-xs opacity-80">
          {company.phone.length > 0 && (
            <div className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" />
              <span>{company.phone.join(", ")}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5" />
            <span>{company.email}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5" />
            <span>{company.website}</span>
          </div>
        </div>

        <div className="flex justify-center gap-4 text-xs">
          <div className="bg-white/10 px-3 py-1.5 rounded-md">
            <span className="opacity-70">GSTIN: </span>
            <span className="font-semibold">{company.gstin}</span>
          </div>
          <div className="bg-white/10 px-3 py-1.5 rounded-md">
            <span className="opacity-70">State: </span>
            <span className="font-semibold">
              {company.state}, Code: {company.stateCode}
            </span>
          </div>
        </div>
      </div>

      {/* Proforma Invoice Title */}
      <div className="text-center py-4">
        <h2 className="text-xl font-serif font-bold invoice-gold-text">
          PROFORMA INVOICE
        </h2>
      </div>

      {/* Customer Details (Left) & Invoice Details (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-white/20">
        {/* Bill To - Left */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider opacity-60">
            Bill To
          </h3>
          {customer && (
            <div className="space-y-1">
              <p className="text-lg font-semibold">{customer.name}</p>
              <p className="text-sm opacity-80">{customer.address}</p>
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
        <div className="space-y-3 lg:text-right">
          <h3 className="text-xs font-semibold uppercase tracking-wider opacity-60">
            Invoice Details
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex lg:justify-end gap-2">
              <span className="opacity-60">Proforma No:</span>
              <span className="font-semibold text-lg">{invoiceNo}</span>
            </div>
            <div className="flex lg:justify-end gap-2">
              <span className="opacity-60">Date:</span>
              <span className="font-medium">{date}</span>
            </div>
            {eWayBillNo && (
              <div className="flex lg:justify-end gap-2">
                <span className="opacity-60">e-Way Bill:</span>
                <span className="font-medium">{eWayBillNo}</span>
              </div>
            )}
            {otherReferences && (
              <div className="flex lg:justify-end gap-2">
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
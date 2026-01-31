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
}

export function InvoiceHeader({
  company,
  invoiceNo,
  date,
  eWayBillNo,
  supplierInvoiceNo,
  supplierInvoiceDate,
  otherReferences,
  customer
}: InvoiceHeaderProps) {
  return (
    <div className="invoice-header py-4">
      {/* Organization Details - Centered */}
      <div className="text-center space-y-2 pb-3 border-b border-white/20 print:border-gray-300">
        <div className="flex justify-center">
          {company.logoUrl ? (
            <img 
              src={company.logoUrl} 
              alt={`${company.name} logo`} 
              className="w-12 h-12 rounded-lg object-contain" 
            />
          ) : (
            <div className="w-12 h-12 rounded-lg gradient-gold flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
          )}
        </div>

        <h1 className="text-lg font-heading font-bold tracking-tight">
          {company.name}
        </h1>

        <div className="text-xs text-gray-200">
          {company.address.map((line, i) => (
            <span key={i}>
              {line}{i < company.address.length - 1 ? ", " : ""}
            </span>
          ))}
        </div>

        <div className="flex flex-wrap justify-center gap-3 text-xs text-gray-300">
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

        <div className="flex justify-center gap-3 text-xs">
          <div className="bg-gray-700 px-2 py-1 rounded">
            <span className="text-gray-300">GSTIN: </span>
            <span className="font-semibold text-white">{company.gstin}</span>
          </div>
          <div className="bg-gray-700 px-2 py-1 rounded">
            <span className="text-gray-300">State: </span>
            <span className="font-semibold text-white">
              {company.state}, Code: {company.stateCode}
            </span>
          </div>
        </div>
      </div>

      {/* Proforma Invoice Title */}
      <div className="text-center py-2">
        <h2 className="text-base font-heading font-bold invoice-gold-text">
          PROFORMA INVOICE
        </h2>
      </div>

      {/* Customer Details (Left) & Invoice Details (Right) */}
      <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/20 print:border-gray-300">
        {/* Bill To - Left */}
        <div className="space-y-1">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Bill To
          </h3>
          {customer && (
            <div className="space-y-0.5">
              <p className="text-sm font-semibold text-white">{customer.name}</p>
              <p className="text-xs text-gray-300">{customer.address}</p>
              {customer.phone && (
                <p className="text-xs text-gray-300">Phone: {customer.phone}</p>
              )}
              {customer.email && (
                <p className="text-xs text-gray-300">Email: {customer.email}</p>
              )}
              {customer.gstin && (
                <p className="text-xs">
                  <span className="text-gray-400">GSTIN: </span>
                  <span className="font-medium text-white">{customer.gstin}</span>
                </p>
              )}
              {customer.state && (
                <p className="text-xs text-gray-300">
                  State: {customer.state}
                  {customer.stateCode && ` (${customer.stateCode})`}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Invoice Details - Right */}
        <div className="space-y-1 text-right">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Invoice Details
          </h3>
          <div className="space-y-0.5 text-xs">
            <div className="flex justify-end gap-2">
              <span className="text-gray-400">Proforma No:</span>
              <span className="font-semibold text-sm text-white">{invoiceNo}</span>
            </div>
            <div className="flex justify-end gap-2">
              <span className="text-gray-400">Date:</span>
              <span className="font-medium text-white">{date}</span>
            </div>
            {eWayBillNo && (
              <div className="flex justify-end gap-2">
                <span className="text-gray-400">e-Way Bill:</span>
                <span className="font-medium text-white">{eWayBillNo}</span>
              </div>
            )}
            {otherReferences && (
              <div className="flex justify-end gap-2">
                <span className="text-gray-400">Reference:</span>
                <span className="font-medium text-white">{otherReferences}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
